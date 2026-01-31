<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { mode } from "mode-watcher";
  import {
    init,
    dispose,
    registerXAxis,
    type KLineData,
  } from "klinecharts";
  import { screenWidth } from "$lib/store";

  // ============================================================================
  // CONSTANTS & CACHED FORMATTERS (avoid creating new instances repeatedly)
  // ============================================================================
  const NY_TIMEZONE = "America/New_York";
  const SESSION_START_MIN = 9 * 60 + 30;
  const SESSION_END_MIN = 16 * 60;
  const SESSION_RANGE_MIN = SESSION_END_MIN - SESSION_START_MIN;
  const KLINE_MIN_BAR_SPACE = 1;
  const DRAG_THRESHOLD_PX = 6;
  const ONE_DAY_X_AXIS_NAME = "oneDayXAxis";

  // Cache formatters to avoid repeated instantiation
  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: NY_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const tzFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: NY_TIMEZONE,
    timeZoneName: "longOffset",
  });

  // Cached NY offset (recalculated only when needed)
  let cachedNyOffset: number | null = null;
  const getNyOffset = (date: Date): number => {
    const tzPart = tzFormatter.formatToParts(date).find((p) => p.type === "timeZoneName")?.value || "GMT-05:00";
    const match = tzPart.match(/GMT([+-])(\d{2}):(\d{2})/);
    if (!match) return -5 * 60 * 60 * 1000;
    const sign = match[1] === "-" ? -1 : 1;
    return sign * (parseInt(match[2]) * 60 + parseInt(match[3])) * 60 * 1000;
  };

  // ============================================================================
  // STATIC REGISTRATIONS (done once globally)
  // ============================================================================
  let oneDayXAxisRegistered = false;

  // ============================================================================
  // PROPS
  // ============================================================================
  export let priceData: any[] = [];
  export let displayRange: string = "1D";
  export let previousClose: number | null = null;
  export let isNegative: boolean = false;
  export let isLoading: boolean = false;
  export let showVolume: boolean = true;

  // ============================================================================
  // STATE
  // ============================================================================
  let chartContainer: HTMLDivElement | null = null;
  let chart: ReturnType<typeof init> | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let resizeRaf: number | null = null;
  let styleRaf: number | null = null;
  let lastContainerWidth = 0;
  let currentBars: KLineData[] = [];
  let currentBarCount = 0;
  let sessionStart: number | null = null;
  let sessionEnd: number | null = null;
  let sessionBarCount = 0;
  let missingRightBars = 0;

  // Range selection state
  let isSelecting = false;
  let selectionStart: { index: number; price: number; x: number; y: number; timestamp: number } | null = null;
  let selectionEnd: { index: number; price: number; x: number; y: number; timestamp: number } | null = null;
  let startPointerId: number | null = null;
  let startChartX: number | null = null;

  // Track last applied values to avoid redundant updates
  let lastAppliedMode: string | null = null;
  let lastAppliedNegative: boolean | null = null;
  let lastDisplayRange: string | null = null;
  let pendingStyleTimeout: ReturnType<typeof setTimeout> | null = null;
  let dataUpdateRaf: number | null = null;

  // ============================================================================
  // AXIS LABELS (reactive to screen width)
  // ============================================================================
  $: axisLabels = $screenWidth > 640
    ? [
        { label: "10 AM", minutes: 600 },
        { label: "11 AM", minutes: 660 },
        { label: "12 PM", minutes: 720 },
        { label: "1 PM", minutes: 780 },
        { label: "2 PM", minutes: 840 },
        { label: "3 PM", minutes: 900 },
        { label: "4 PM", minutes: 960 },
      ]
    : [
        { label: "10 AM", minutes: 600 },
        { label: "1 PM", minutes: 780 },
        { label: "4 PM", minutes: 960 },
      ];

  const ensureOneDayXAxis = () => {
    if (oneDayXAxisRegistered) return;
    registerXAxis({
      name: ONE_DAY_X_AXIS_NAME,
      createTicks: ({ bounding }) => {
        const width = Math.max(bounding.width, 0);
        if (width <= 0) return [];
        const leftPad = 6, rightPad = 20;
        const usableWidth = Math.max(width - leftPad - rightPad, 1);
        return axisLabels.map((tick) => ({
          coord: leftPad + usableWidth * ((tick.minutes - SESSION_START_MIN) / SESSION_RANGE_MIN),
          value: tick.minutes,
          text: tick.label,
        }));
      },
    });
    oneDayXAxisRegistered = true;
  };

  // ============================================================================
  // UTILITY FUNCTIONS (optimized)
  // ============================================================================
  const toNumber = (value: unknown): number | null => {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value === "string") {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const parseTimestamp = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value > 1e12 ? Math.floor(value) : value > 1e9 ? Math.floor(value * 1000) : null;
    }
    if (typeof value === "string") {
      const raw = value.trim();
      if (!raw) return null;

      // Handle date-only strings (YYYY-MM-DD) explicitly for Safari compatibility.
      const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})Z?$/);
      if (dateOnlyMatch) {
        const year = Number(dateOnlyMatch[1]);
        const month = Number(dateOnlyMatch[2]) - 1;
        const day = Number(dateOnlyMatch[3]);
        const asUtc = new Date(Date.UTC(year, month, day, 0, 0, 0));
        return asUtc.getTime() - getNyOffset(asUtc);
      }

      const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
      const asUtc = new Date(`${normalized}Z`);
      if (isNaN(asUtc.getTime())) return null;
      return asUtc.getTime() - getNyOffset(asUtc);
    }
    return null;
  };

  const buildSessionTimestamp = (baseTimestamp: number, hours: number, minutes: number): number => {
    const dateStr = dateFormatter.format(new Date(baseTimestamp));
    const timeStr = `${dateStr}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00Z`;
    const asUtc = new Date(timeStr);
    return asUtc.getTime() - getNyOffset(asUtc);
  };

  // Optimized median calculation without full sort
  const computeIntervalMs = (bars: KLineData[]): number => {
    if (bars.length < 2) return 60000;
    const diffs: number[] = [];
    for (let i = 1; i < Math.min(bars.length, 50); i++) {
      const diff = bars[i].timestamp - bars[i - 1].timestamp;
      if (diff > 0) diffs.push(diff);
    }
    if (!diffs.length) return 60000;
    // Quick select for median (faster than full sort)
    diffs.sort((a, b) => a - b);
    return diffs[Math.floor(diffs.length / 2)];
  };

  // LTTB downsampling (optimized)
  const downsampleBars = (bars: KLineData[], targetCount: number): KLineData[] => {
    const len = bars.length;
    if (len <= targetCount || targetCount < 3) return bars;

    const result: KLineData[] = [bars[0]];
    const bucketSize = (len - 2) / (targetCount - 2);

    for (let i = 0; i < targetCount - 2; i++) {
      const bucketStart = Math.floor(i * bucketSize) + 1;
      const bucketEnd = Math.floor((i + 1) * bucketSize) + 1;
      const nextBucketStart = bucketEnd;
      const nextBucketEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, len - 1);

      let avgX = 0, avgY = 0, count = 0;
      for (let j = nextBucketStart; j < nextBucketEnd; j++) {
        avgX += j;
        avgY += bars[j].close;
        count++;
      }
      if (count > 0) { avgX /= count; avgY /= count; }

      const prevX = result.length - 1;
      const prevY = result[result.length - 1].close;
      let maxArea = -1, maxIndex = bucketStart;

      for (let j = bucketStart; j < bucketEnd && j < len - 1; j++) {
        const area = Math.abs((prevX - avgX) * (bars[j].close - prevY) - (prevX - j) * (avgY - prevY));
        if (area > maxArea) { maxArea = area; maxIndex = j; }
      }
      result.push(bars[maxIndex]);
    }
    result.push(bars[len - 1]);
    return result;
  };

  // ============================================================================
  // CHART FUNCTIONS
  // ============================================================================
  const buildBars = (rawData: any[]): KLineData[] => {
    if (!Array.isArray(rawData) || !rawData.length) return [];

    const parsed: KLineData[] = [];
    for (const item of rawData) {
      const timestamp = parseTimestamp(item?.time ?? item?.date);
      const close = toNumber(item?.close);
      if (timestamp === null || close === null) continue;
      parsed.push({
        timestamp,
        close,
        open: toNumber(item?.open) ?? close,
        high: toNumber(item?.high) ?? close,
        low: toNumber(item?.low) ?? close,
        volume: toNumber(item?.volume) ?? 0,
      });
    }

    if (!parsed.length) return [];
    parsed.sort((a, b) => a.timestamp - b.timestamp);

    if (displayRange === "1D") {
      const baseTs = parsed[0].timestamp;
      sessionStart = buildSessionTimestamp(baseTs, 9, 30);
      sessionEnd = buildSessionTimestamp(baseTs, 16, 0);

      const sessionBars = parsed.filter(
        (bar) => bar.timestamp >= sessionStart! && bar.timestamp <= sessionEnd!
      );
      if (!sessionBars.length) return parsed;

      // Fill gaps with synthetic bars to align bar indices with time positions
      const filledBars: KLineData[] = [];
      const ONE_MINUTE_MS = 60000;
      let barIndex = 0;

      for (let ts = sessionStart; ts <= sessionEnd; ts += ONE_MINUTE_MS) {
        // Find bar at this timestamp (within 30 second tolerance)
        while (
          barIndex < sessionBars.length &&
          sessionBars[barIndex].timestamp < ts - 30000
        ) {
          barIndex++;
        }

        if (
          barIndex < sessionBars.length &&
          Math.abs(sessionBars[barIndex].timestamp - ts) < 30000
        ) {
          // Use actual bar, normalize timestamp to exact minute
          filledBars.push({ ...sessionBars[barIndex], timestamp: ts });
          barIndex++;
        } else if (filledBars.length > 0) {
          // Create synthetic bar using previous close (forward-fill)
          const prev = filledBars[filledBars.length - 1];
          filledBars.push({
            timestamp: ts,
            open: prev.close,
            high: prev.close,
            low: prev.close,
            close: prev.close,
            volume: 0,
          });
        }
        // Skip if no previous bar exists (gap at start of session)
      }

      return filledBars;
    }

    sessionStart = null;
    sessionEnd = null;
    return parsed;
  };

  const applyStyles = (isLight: boolean, negative: boolean) => {
    if (!chart) return;

    const upColor = isLight ? "#16a34a" : "#22c55e";
    const downColor = isLight ? "#dc2626" : "#ef4444";
    const gridColor = isLight
      ? "rgba(148, 163, 184, 0.35)"
      : "rgba(148, 163, 184, 0.25)";
    const separatorColor = isLight ? "#e5e7eb" : "#1e293b";
    const axisText = isLight ? "#6b7280" : "#9ca3af";
    const crosshairLine = isLight ? "#374151" : "#d1d5db";
    const crosshairBg = isLight ? "#111827" : "#f9fafb";
    const crosshairText = isLight ? "#f9fafb" : "#111827";
    const chartFont = "Inter, system-ui, sans-serif";
    const lineColor = negative ? downColor : upColor;
    // Multi-stop gradient for smooth fade effect (0 = bottom, 1 = top near line)
    const areaGradient = negative
      ? [
          { offset: 0, color: "rgba(0, 0, 0, 0)" },
          { offset: 0.4, color: isLight ? "rgba(220, 38, 38, 0.05)" : "rgba(248, 113, 113, 0.04)" },
          { offset: 0.7, color: isLight ? "rgba(220, 38, 38, 0.12)" : "rgba(248, 113, 113, 0.10)" },
          { offset: 1, color: isLight ? "rgba(220, 38, 38, 0.25)" : "rgba(248, 113, 113, 0.20)" },
        ]
      : [
          { offset: 0, color: "rgba(0, 0, 0, 0)" },
          { offset: 0.4, color: isLight ? "rgba(22, 163, 74, 0.05)" : "rgba(34, 197, 94, 0.04)" },
          { offset: 0.7, color: isLight ? "rgba(22, 163, 74, 0.12)" : "rgba(34, 197, 94, 0.10)" },
          { offset: 1, color: isLight ? "rgba(22, 163, 74, 0.25)" : "rgba(34, 197, 94, 0.20)" },
        ];

    chart.setStyles({
      grid: {
        show: true,
        horizontal: {
          show: true,
          style: "dashed",
          size: 1,
          color: gridColor,
          dashedValue: [3, 3],
        },
        vertical: { show: false },
      },
      xAxis: {
        show: true,
        size: "auto",
        axisLine: { show: false },
        tickLine: { show: false },
        tickText: { show: true, color: axisText, size: 11, family: chartFont, weight: 400 },
      },
      yAxis: {
        show: true,
        size: "auto",
        position: "right",
        inside: false,
        axisLine: { show: false },
        tickLine: { show: false },
        tickText: { show: true, color: axisText, size: 11, family: chartFont, weight: 400 },
      },
      crosshair: {
        show: true,
        horizontal: {
          line: { show: true, style: "dashed", dashedValue: [4, 4], size: 1, color: crosshairLine },
          text: {
            show: true,
            color: crosshairText,
            size: 11,
            family: chartFont,
            weight: 600,
            borderColor: crosshairLine,
            backgroundColor: crosshairBg,
            borderRadius: 4,
            paddingLeft: 6,
            paddingRight: 6,
            paddingTop: 3,
            paddingBottom: 3,
          },
        },
        vertical: {
          line: { show: true, style: "dashed", dashedValue: [4, 4], size: 1, color: crosshairLine },
          text: {
            show: true,
            color: crosshairText,
            size: 11,
            family: chartFont,
            weight: 600,
            borderColor: crosshairLine,
            backgroundColor: crosshairBg,
            borderRadius: 4,
            paddingLeft: 6,
            paddingRight: 6,
            paddingTop: 3,
            paddingBottom: 3,
          },
        },
      },
      candle: {
        type: "area",
        bar: {
          upColor, downColor, noChangeColor: axisText,
          upBorderColor: upColor, downBorderColor: downColor, noChangeBorderColor: axisText,
          upWickColor: upColor, downWickColor: downColor, noChangeWickColor: axisText,
        },
        area: {
          lineSize: 1.5,
          lineColor,
          smooth: false,
          value: "close",
          backgroundColor: areaGradient,
          point: { show: false },
        },
        priceMark: {
          show: true,
          high: { show: false },
          low: { show: false },
          last: {
            show: true,
            upColor, downColor, noChangeColor: axisText,
            line: { show: true, style: "dashed", dashedValue: [4, 4], size: 1 },
            text: { show: true, color: "#fff", size: 10, family: chartFont, weight: 600, borderRadius: 2, paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2 },
          },
        },
        tooltip: { showRule: "none" },
      },
      indicator: {
        bars: [{
          style: "fill", borderStyle: "solid", borderSize: 0, borderDashedValue: [2, 2],
          upColor: isLight ? "rgba(22, 163, 74, 0.35)" : "rgba(34, 197, 94, 0.35)",
          downColor: isLight ? "rgba(239, 68, 68, 0.35)" : "rgba(248, 113, 113, 0.35)",
          noChangeColor: "rgba(148, 163, 184, 0.35)",
        }],
        lines: [{ show: false }, { show: false }, { show: false }, { show: false }, { show: false }],
        tooltip: { showRule: "none" },
        lastValueMark: { show: false },
      },
      separator: { size: 1, color: separatorColor, fill: false, activeBackgroundColor: "transparent" },
    });

    lastAppliedMode = isLight ? "light" : "dark";
    lastAppliedNegative = negative;
  };

  const updateBarSpace = () => {
    if (!chart || !chartContainer || currentBarCount <= 0) return;

    // Use consistent fallback with updateChartData (300 for mobile)
    const width = chart.getSize("candle_pane", "main")?.width || chartContainer?.clientWidth || 300;

    const targetCount = displayRange === "1D" && sessionBarCount > 0 ? sessionBarCount : currentBarCount;
    const barSpace = Math.max(KLINE_MIN_BAR_SPACE, width / targetCount);
    chart.setBarSpace(barSpace);

    const actualSpace = chart.getBarSpace()?.bar ?? barSpace;
    const rightOffset = displayRange === "1D" && missingRightBars > 0 ? missingRightBars * actualSpace : 0;
    chart.setMaxOffsetRightDistance(rightOffset + 10);
    chart.setOffsetRightDistance(rightOffset);
  };

  const updateChartData = (rawData: any[]) => {
    if (!chart || !chartContainer) return;

    let bars = buildBars(rawData);
    if (!bars.length) {
      currentBars = [];
      currentBarCount = 0;
      sessionBarCount = 0;
      missingRightBars = 0;
      chart.setDataLoader({
        getBars: async ({ callback }) => callback([], { backward: false, forward: false }),
      });
      return;
    }

    const intervalMs = computeIntervalMs(bars);
    const width = chart.getSize("candle_pane", "main")?.width || chartContainer?.clientWidth || 300;
    const maxBars = Math.max(100, Math.floor(width));

    if (displayRange === "1D" && sessionStart !== null && sessionEnd !== null) {
      const fullCount = Math.round((sessionEnd - sessionStart) / intervalMs) + 1;
      const lastTs = bars[bars.length - 1].timestamp;
      const rawMissing = lastTs < sessionEnd ? Math.round((sessionEnd - lastTs) / intervalMs) : 0;

      if (fullCount > maxBars) {
        const ratio = maxBars / fullCount;
        bars = downsampleBars(bars, Math.max(2, Math.floor(bars.length * ratio)));
        sessionBarCount = maxBars;
        missingRightBars = Math.round(rawMissing * ratio);
      } else {
        sessionBarCount = fullCount;
        missingRightBars = rawMissing;
      }
    } else {
      sessionBarCount = 0;
      missingRightBars = 0;
      if (bars.length > maxBars) bars = downsampleBars(bars, maxBars);
    }

    currentBars = bars;
    currentBarCount = bars.length;

    const periodType = intervalMs >= 86400000 ? "day" : intervalMs >= 3600000 ? "hour" : "minute";
    const periodSpan = periodType === "day" ? 1 : periodType === "hour" ? Math.round(intervalMs / 3600000) : Math.round(intervalMs / 60000);

    chart.setPeriod({ type: periodType, span: periodSpan });

    // Capture bars in closure to avoid race conditions when updateChartData is called rapidly
    const barsToLoad = bars;
    const barCount = bars.length;

    // Use setDataLoader - klinecharts will call getBars with type "init"
    chart.setDataLoader({
      getBars: async ({ type, callback }) => {
        if (type === "init") {
          callback(barsToLoad, { backward: false, forward: false });
          // Multiple passes to ensure bar space is set correctly on mobile
          requestAnimationFrame(() => {
            if (currentBarCount === barCount) {
              updateBarSpace();
              requestAnimationFrame(() => {
                if (currentBarCount === barCount) {
                  updateBarSpace();
                  // Third pass with small delay for slower mobile devices
                  setTimeout(() => {
                    if (currentBarCount === barCount) {
                      updateBarSpace();
                    }
                  }, 16);
                }
              });
            }
          });
        } else {
          callback([], { backward: false, forward: false });
        }
      },
    });
  };

  const formatXAxisLabel = (timestamp: number): string => {
    const date = new Date(timestamp);
    if (displayRange === "1D") {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: NY_TIMEZONE });
    }
    if (displayRange === "1W" || displayRange === "1M") {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    }
    return date.toLocaleDateString("en-US", { year: "2-digit", month: "short", timeZone: "UTC" });
  };

  // ============================================================================
  // RANGE SELECTION
  // ============================================================================
  const formatRangeTimestamp = (ts: number): string => {
    const date = new Date(ts);
    if (displayRange === "1D") {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: NY_TIMEZONE });
    }
    if (displayRange === "1W" || displayRange === "1M") {
      return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  };

  const hexToRgba = (hex: string, alpha: number): string => {
    const h = hex.replace("#", "");
    const expanded = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    if (expanded.length !== 6) return `rgba(0,0,0,${alpha})`;
    return `rgba(${parseInt(expanded.slice(0, 2), 16)},${parseInt(expanded.slice(2, 4), 16)},${parseInt(expanded.slice(4, 6), 16)},${alpha})`;
  };

  $: selectionDelta = selectionStart && selectionEnd ? selectionEnd.price - selectionStart.price : 0;
  $: selectionPercent = selectionStart && selectionEnd && selectionStart.price !== 0
    ? ((selectionEnd.price - selectionStart.price) / selectionStart.price) * 100 : 0;
  $: selectionColor = selectionDelta >= 0 ? "#00FC50" : "#FF2F1F";
  $: selectionTimeRange = selectionStart && selectionEnd
    ? (selectionStart.timestamp === selectionEnd.timestamp
        ? formatRangeTimestamp(selectionStart.timestamp)
        : `${formatRangeTimestamp(Math.min(selectionStart.timestamp, selectionEnd.timestamp))} – ${formatRangeTimestamp(Math.max(selectionStart.timestamp, selectionEnd.timestamp))}`)
    : "";
  $: selectionRect = selectionStart && selectionEnd && chartContainer
    ? { x: Math.min(selectionStart.x, selectionEnd.x), y: 0, width: Math.abs(selectionEnd.x - selectionStart.x), height: chartContainer.clientHeight - 80 }
    : null;

  const getDataFromPoint = (clientX: number, clientY: number) => {
    if (!chart || !chartContainer) return null;
    const rect = chartContainer.getBoundingClientRect();
    const x = clientX - rect.left, y = clientY - rect.top;
    const dataIndex = chart.convertFromPixel({ x, y }, { paneId: "candle_pane", absolute: false });
    if (!dataIndex || dataIndex.dataIndex === undefined) return null;
    const bar = chart.getDataList()[dataIndex.dataIndex];
    if (!bar) return null;
    return { index: dataIndex.dataIndex, price: bar.close, x, y, timestamp: bar.timestamp };
  };

  const onPointerDown = (evt: PointerEvent) => {
    if (evt.button !== 0) return;
    const data = getDataFromPoint(evt.clientX, evt.clientY);
    if (!data) return;
    startPointerId = evt.pointerId;
    startChartX = data.x;
    selectionStart = selectionEnd = { ...data };
    try { (evt.target as HTMLElement)?.setPointerCapture(evt.pointerId); } catch {}
  };

  const onPointerMove = (evt: PointerEvent) => {
    if (startPointerId !== evt.pointerId || !selectionStart) return;
    const data = getDataFromPoint(evt.clientX, evt.clientY);
    if (!data) return;
    if (!isSelecting && startChartX !== null && Math.abs(data.x - startChartX) > DRAG_THRESHOLD_PX) {
      isSelecting = true;
    }
    if (isSelecting) {
      selectionEnd = { ...data };
      evt.preventDefault();
    }
  };

  const onPointerUp = (evt: PointerEvent) => {
    if (startPointerId !== evt.pointerId) return;
    try { (evt.target as HTMLElement)?.releasePointerCapture(evt.pointerId); } catch {}
    setTimeout(() => {
      isSelecting = false;
      selectionStart = selectionEnd = null;
      startPointerId = startChartX = null;
    }, 100);
  };

  // ============================================================================
  // LIFECYCLE
  // ============================================================================
  onMount(() => {
    if (!chartContainer) return;

    ensureOneDayXAxis();

    chart = init(chartContainer);
    if (!chart) return;

    chart.setZoomEnabled(false);
    chart.setScrollEnabled(false);
    chart.setOffsetRightDistance(0);
    chart.setLeftMinVisibleBarCount(0);
    chart.setRightMinVisibleBarCount(0);
    chart.setSymbol({ ticker: "STOCK", pricePrecision: 2, volumePrecision: 0 });

    if (showVolume) {
      chart.createIndicator({ name: "VOL", calcParams: [] }, false, {
        id: "volume_pane",
        height: 80,
        dragEnabled: false,
        gap: { top: 0.02, bottom: 0 },
        axis: {
          show: false,
          scrollZoomEnabled: false,
          createRange: ({ chart: c, defaultRange }) => {
            const visibleRange = c.getVisibleRange();
            const dataList = c.getDataList();
            if (!dataList?.length) return defaultRange;

            const volumes: number[] = [];
            for (let i = visibleRange.from; i < visibleRange.to; i++) {
              const v = dataList[i]?.volume;
              if (typeof v === "number" && v > 0) volumes.push(v);
            }
            if (!volumes.length) return defaultRange;

            volumes.sort((a, b) => a - b);
            const p95 = volumes[Math.min(Math.floor(volumes.length * 0.95), volumes.length - 1)];
            const actualMax = volumes[volumes.length - 1];
            const max = actualMax > p95 * 3 ? p95 * 1.5 : actualMax * 1.05;

            return { from: 0, to: max, range: max, realFrom: 0, realTo: max, realRange: max, displayFrom: 0, displayTo: max, displayRange: max };
          },
        },
        styles: {
          grid: {
            show: false,
          },
        },
      });
    }

    chart.setPaneOptions({ id: "candle_pane", gap: { top: 0.02, bottom: 0.02 }, axis: { scrollZoomEnabled: false } });

    if (displayRange === "1D") {
      chart.setPaneOptions({ id: "x_axis_pane", axis: { name: ONE_DAY_X_AXIS_NAME, scrollZoomEnabled: false } });
    }

    chart.setFormatter({ formatDate: ({ timestamp }) => formatXAxisLabel(timestamp) });
    chart.setPeriod({ type: "minute", span: 1 });

    applyStyles($mode === "light", isNegative);

    if (priceData?.length > 0) {
      updateChartData(priceData);
    }

    lastDisplayRange = displayRange;

    resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (Math.abs(width - lastContainerWidth) < 1) return;
      const changed = Math.round(width) !== Math.round(lastContainerWidth);
      lastContainerWidth = width;

      if (resizeRaf !== null) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = null;
        chart?.resize();
        if (changed && priceData?.length > 0) updateChartData(priceData);
        else updateBarSpace();
      });
    });
    resizeObserver.observe(chartContainer);
  });

  onDestroy(() => {
    if (resizeRaf !== null) cancelAnimationFrame(resizeRaf);
    if (styleRaf !== null) cancelAnimationFrame(styleRaf);
    if (dataUpdateRaf !== null) cancelAnimationFrame(dataUpdateRaf);
    if (pendingStyleTimeout !== null) clearTimeout(pendingStyleTimeout);
    resizeObserver?.disconnect();
    if (chart) { dispose(chart); chart = null; }
  });

  // ============================================================================
  // REACTIVE UPDATES (consolidated & optimized)
  // ============================================================================
  const scheduleStyleUpdate = () => {
    if (styleRaf !== null) cancelAnimationFrame(styleRaf);
    styleRaf = requestAnimationFrame(() => {
      styleRaf = null;
      if (!chart) return;
      const isLight = $mode === "light";
      if (lastAppliedMode !== (isLight ? "light" : "dark") || lastAppliedNegative !== isNegative) {
        applyStyles(isLight, isNegative);
      }
    });
  };

  // React to mode changes
  $: if (chart && $mode) scheduleStyleUpdate();

  // React to isNegative changes
  $: if (chart && isNegative !== lastAppliedNegative) scheduleStyleUpdate();

  // Helper to schedule style reapplication after async operations
  const scheduleDelayedStyleUpdate = () => {
    if (pendingStyleTimeout !== null) clearTimeout(pendingStyleTimeout);
    pendingStyleTimeout = setTimeout(() => {
      pendingStyleTimeout = null;
      if (chart) {
        applyStyles($mode === "light", isNegative);
      }
    }, 50);
  };

  // Debounced data update to handle rapid range switching
  const scheduleDataUpdate = () => {
    if (dataUpdateRaf !== null) cancelAnimationFrame(dataUpdateRaf);
    dataUpdateRaf = requestAnimationFrame(() => {
      dataUpdateRaf = null;
      if (!chart || !priceData?.length) return;
      updateChartData(priceData);
      scheduleDelayedStyleUpdate();
    });
  };

  // Track the last displayRange we processed data for
  let lastProcessedDisplayRange: string | null = null;

  // React to priceData changes
  $: if (chart && priceData) {
    // Always update when priceData changes
    lastProcessedDisplayRange = displayRange;
    scheduleDataUpdate();
  }

  // React to displayRange changes
  $: if (chart && displayRange && displayRange !== lastDisplayRange) {
    lastDisplayRange = displayRange;
    // Update x-axis type
    chart.setPaneOptions({
      id: "x_axis_pane",
      axis: { name: displayRange === "1D" ? ONE_DAY_X_AXIS_NAME : "default", scrollZoomEnabled: false },
    });
    // Only trigger data update if priceData hasn't changed yet (handles cached data with same reference)
    // If priceData will change, let the priceData reactive handle the update to avoid race conditions
    if (lastProcessedDisplayRange !== displayRange && priceData?.length > 0) {
      // Small delay to allow priceData reactive to fire first if data is changing
      setTimeout(() => {
        if (lastProcessedDisplayRange !== displayRange && priceData?.length > 0) {
          lastProcessedDisplayRange = displayRange;
          scheduleDataUpdate();
        }
      }, 10);
    }
  }

</script>

<div class="relative w-full h-[320px]">
  {#if isLoading}
    <div class="absolute inset-0 flex items-center justify-center z-10">
      <div class="bg-white/90 dark:bg-zinc-900/80 border border-gray-300 dark:border-zinc-700 rounded-full h-14 w-14 flex items-center justify-center shadow-sm">
        <span class="loading loading-spinner loading-md text-gray-700 dark:text-zinc-200"></span>
      </div>
    </div>
  {/if}

  <div
    bind:this={chartContainer}
    class="w-full h-full touch-none"
    on:pointerdown={onPointerDown}
    on:pointermove={onPointerMove}
    on:pointerup={onPointerUp}
    on:pointercancel={onPointerUp}
    role="img"
    aria-label="Stock price chart"
  ></div>

  {#if isSelecting && selectionRect && selectionStart && selectionEnd}
    <div class="absolute inset-0 pointer-events-none z-10">
      <div
        class="absolute"
        style="left:{selectionRect.x}px;top:0;width:{selectionRect.width}px;height:{selectionRect.height}px;background-color:{hexToRgba(selectionColor, $mode === 'light' ? 0.12 : 0.16)}"
      ></div>
      <div
        class="absolute w-px"
        style="left:{selectionStart.x}px;top:0;height:{selectionRect.height}px;background:repeating-linear-gradient(to bottom,{$mode === 'light' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'} 0px,{$mode === 'light' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'} 3px,transparent 3px,transparent 6px)"
      ></div>
      <div
        class="absolute w-px"
        style="left:{selectionEnd.x}px;top:0;height:{selectionRect.height}px;background:repeating-linear-gradient(to bottom,{$mode === 'light' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'} 0px,{$mode === 'light' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'} 3px,transparent 3px,transparent 6px)"
      ></div>
      <div class="absolute w-2.5 h-2.5 rounded-full" style="left:{selectionStart.x - 5}px;top:{selectionStart.y - 5}px;background:{$mode === 'light' ? '#000' : '#fff'}"></div>
      <div class="absolute w-2.5 h-2.5 rounded-full" style="left:{selectionEnd.x - 5}px;top:{selectionEnd.y - 5}px;background:{$mode === 'light' ? '#000' : '#fff'}"></div>
      <div class="absolute bg-black border border-gray-700 rounded px-2 py-1.5 text-sm" style="left:{(selectionStart.x + selectionEnd.x) / 2}px;top:20px;transform:translateX(-50%)">
        <div class="whitespace-nowrap" style="color:{selectionColor}">
          {selectionDelta > 0 ? "+" : ""}{selectionDelta.toFixed(2)} ({selectionPercent.toFixed(2)}%)
          {selectionDelta > 0 ? "↑" : selectionDelta < 0 ? "↓" : ""}
        </div>
        {#if selectionTimeRange}
          <div class="text-xs text-gray-400 whitespace-nowrap mt-0.5">{selectionTimeRange}</div>
        {/if}
      </div>
    </div>
  {/if}
</div>

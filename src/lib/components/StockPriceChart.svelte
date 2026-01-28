<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { mode } from "mode-watcher";
  import { init, dispose, registerOverlay, type KLineData } from "klinecharts";
  import { screenWidth } from "$lib/store";
  import { abbreviateNumber } from "$lib/utils";

  // Register previous close overlay once
  let prevCloseOverlayRegistered = false;
  const PREV_CLOSE_OVERLAY_NAME = "prevCloseLine";

  const ensurePrevCloseOverlay = () => {
    if (prevCloseOverlayRegistered) return;
    registerOverlay({
      name: PREV_CLOSE_OVERLAY_NAME,
      totalStep: 0,
      needDefaultPointFigure: false,
      needDefaultXAxisFigure: false,
      needDefaultYAxisFigure: false,
      createPointFigures: ({ overlay, coordinates, bounding, yAxis }) => {
        const price = overlay.extendData?.price;
        if (price === null || price === undefined) return [];

        const y = yAxis?.convertToPixel(price);
        if (y === undefined || y === null) return [];

        return [
          {
            type: "line",
            attrs: {
              coordinates: [
                { x: 0, y },
                { x: bounding.width, y },
              ],
            },
            styles: {
              style: "dashed",
              dashedValue: [4, 4],
              size: 0.8,
              color: overlay.extendData?.color ?? "#64748b",
            },
          },
        ];
      },
    });
    prevCloseOverlayRegistered = true;
  };

  // Props
  export let priceData: any[] = [];
  export let displayRange: string = "1D";
  export let previousClose: number | null = null;
  export let isNegative: boolean = false;
  export let isLoading: boolean = false;

  // Chart elements
  let chartContainer: HTMLDivElement | null = null;
  let chart: ReturnType<typeof init> | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let resizeRaf: number | null = null;

  // Range selector state
  let isSelecting = false;
  let selectionStart: { index: number; price: number; x: number; y: number; timestamp: number } | null = null;
  let selectionEnd: { index: number; price: number; x: number; y: number; timestamp: number } | null = null;
  let startPointerId: number | null = null;
  let startChartX: number | null = null;
  const DRAG_THRESHOLD_PX = 6;

  // Format timestamp for range selector label based on display range
  const formatRangeTimestamp = (timestampMs: number): string => {
    const date = new Date(timestampMs);

    if (displayRange === "1D") {
      // For 1D: show time only (e.g., "10:30 AM")
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }

    if (["1W", "1M"].includes(displayRange)) {
      // For 1W, 1M: show date with time (e.g., "Jan 15, 10:30 AM")
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "UTC",
      });
    }

    // For 6M, YTD, 1Y, MAX: show date only (e.g., "Jan 15, 2024")
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  // Session boundaries for 1D
  let sessionStart: number | null = null;
  let sessionEnd: number | null = null;

  // Tooltip state
  let tooltipVisible = false;
  let tooltipData: { price: number; volume: number; time: string } | null = null;
  let tooltipPosition = { x: 0, y: 0 };

  // Previous close line elements
  let prevCloseLineY: number | null = null;
  let prevCloseOverlayId: string | null = null;

  const updatePrevCloseLine = () => {
    if (!chart) return;

    // Remove existing overlay if any
    if (prevCloseOverlayId) {
      chart.removeOverlay(prevCloseOverlayId);
      prevCloseOverlayId = null;
    }

    // Only show for 1D range with valid previousClose
    const effectivePrevClose = displayRange === "1D" ? previousClose : getFirstBarClose();
    if (effectivePrevClose === null || effectivePrevClose === undefined) return;

    const lineColor = $mode === "light" ? "#64748b" : "#e2e8f0";

    const overlayId = chart.createOverlay({
      name: PREV_CLOSE_OVERLAY_NAME,
      lock: true,
      visible: true,
      extendData: {
        price: effectivePrevClose,
        color: lineColor,
      },
    });

    if (overlayId) {
      prevCloseOverlayId = overlayId;
    }
  };

  const getFirstBarClose = (): number | null => {
    if (!chart) return null;
    const dataList = chart.getDataList();
    return dataList?.[0]?.close ?? null;
  };

  const toNumber = (value: unknown): number | null => {
    const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
    return Number.isFinite(n) ? n : null;
  };

  const parseTimestamp = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) {
      if (value > 1e12) return Math.floor(value);
      if (value > 1e9) return Math.floor(value * 1000);
      return null;
    }
    if (typeof value === "string") {
      // Handle date strings - append Z for UTC if not present
      let dateStr = value;
      // Check if it has timezone info (Z, +HH:MM, or -HH:MM at the end)
      const hasTimezone = /[Z]$|[+-]\d{2}:\d{2}$|[+-]\d{4}$/.test(dateStr);
      if (!hasTimezone) {
        // Replace space with T for ISO format if needed
        dateStr = dateStr.replace(" ", "T");
        dateStr = dateStr + "Z";
      }
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.getTime();
      }
      // Try original value as fallback
      const fallbackDate = new Date(value);
      if (!isNaN(fallbackDate.getTime())) {
        return fallbackDate.getTime();
      }
    }
    return null;
  };

  const buildSessionTimestamp = (baseTimestamp: number, hours: number, minutes: number): number => {
    const baseDate = new Date(baseTimestamp);
    const localDate = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      hours,
      minutes,
      0,
      0
    );
    return Date.UTC(
      localDate.getUTCFullYear(),
      localDate.getUTCMonth(),
      localDate.getUTCDate(),
      localDate.getUTCHours(),
      localDate.getUTCMinutes(),
      localDate.getUTCSeconds()
    );
  };

  const buildBars = (rawData: any[]): KLineData[] => {
    const list = Array.isArray(rawData) ? rawData : [];
    const parsed = list
      .map((item) => {
        const timestamp = parseTimestamp(item?.time ?? item?.date);
        const close = toNumber(item?.close);
        if (timestamp === null || close === null) return null;
        return {
          timestamp,
          close,
          open: toNumber(item?.open) ?? close,
          high: toNumber(item?.high) ?? close,
          low: toNumber(item?.low) ?? close,
          volume: toNumber(item?.volume) ?? 0,
        };
      })
      .filter((item): item is KLineData => item !== null)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (!parsed.length) return [];

    // For 1D, filter to session hours (9:30 AM - 4:00 PM ET)
    if (displayRange === "1D" && parsed.length > 0) {
      const baseTimestamp = parsed[0].timestamp;
      sessionStart = buildSessionTimestamp(baseTimestamp, 9, 30);
      sessionEnd = buildSessionTimestamp(baseTimestamp, 16, 0);

      const sessionBars = parsed.filter(
        (bar) => bar.timestamp >= sessionStart! && bar.timestamp <= sessionEnd!
      );
      return sessionBars.length > 0 ? sessionBars : parsed;
    }

    sessionStart = null;
    sessionEnd = null;
    return parsed;
  };

  const computeIntervalMs = (bars: KLineData[]): number => {
    if (bars.length < 2) return 60 * 1000;
    const diffs: number[] = [];
    for (let i = 1; i < bars.length; i++) {
      const diff = bars[i].timestamp - bars[i - 1].timestamp;
      if (diff > 0) diffs.push(diff);
    }
    if (!diffs.length) return 60 * 1000;
    diffs.sort((a, b) => a - b);
    return diffs[Math.floor(diffs.length / 2)];
  };

  const applyStyles = (isLight: boolean, negative: boolean) => {
    if (!chart) return;

    const upColor = isLight ? "#16a34a" : "#22c55e";
    const downColor = isLight ? "#dc2626" : "#ef4444";
    const bgColor = isLight ? "#ffffff" : "#09090B";
    const gridColor = isLight ? "#e5e7eb" : "#1e293b";
    const axisText = isLight ? "#6b7280" : "#9ca3af";
    const crosshairColor = isLight ? "#000000" : "#ffffff";
    const chartFont = "Inter, system-ui, sans-serif";

    const lineColor = negative ? downColor : upColor;
    const fillColorStart = negative
      ? isLight ? "rgba(220, 38, 38, 0.16)" : "rgba(248, 113, 113, 0.14)"
      : isLight ? "rgba(22, 101, 52, 0.16)" : "rgba(34, 197, 94, 0.14)";
    const fillColorEnd = "rgba(0, 0, 0, 0)";

    chart.setStyles({
      grid: {
        show: true,
        horizontal: {
          show: true,
          size: 1,
          color: gridColor,
          style: "dashed",
          dashedValue: [3, 3],
        },
        vertical: {
          show: false,
        },
      },
      xAxis: {
        show: true,
        size: "auto",
        axisLine: { show: false },
        tickLine: { show: false },
        tickText: {
          show: true,
          color: axisText,
          size: 11,
          family: chartFont,
          weight: 400,
        },
      },
      yAxis: {
        show: true,
        size: "auto",
        position: "right",
        inside: false,
        axisLine: { show: false },
        tickLine: { show: false },
        tickText: {
          show: true,
          color: axisText,
          size: 11,
          family: chartFont,
          weight: 400,
        },
      },
      crosshair: {
        show: true,
        horizontal: {
          show: true,
          line: {
            show: true,
            style: "dashed",
            dashedValue: [4, 4],
            size: 1,
            color: crosshairColor,
          },
          text: {
            show: true,
            color: isLight ? "#ffffff" : "#000000",
            size: 10,
            family: chartFont,
            weight: 500,
            borderRadius: 2,
            borderSize: 0,
            paddingLeft: 4,
            paddingRight: 4,
            paddingTop: 2,
            paddingBottom: 2,
            backgroundColor: crosshairColor,
          },
        },
        vertical: {
          show: true,
          line: {
            show: true,
            style: "dashed",
            dashedValue: [4, 4],
            size: 1,
            color: crosshairColor,
          },
          text: {
            show: true,
            color: isLight ? "#ffffff" : "#000000",
            size: 10,
            family: chartFont,
            weight: 500,
            borderRadius: 2,
            borderSize: 0,
            paddingLeft: 4,
            paddingRight: 4,
            paddingTop: 2,
            paddingBottom: 2,
            backgroundColor: crosshairColor,
          },
        },
      },
      candle: {
        type: "area",
        bar: {
          upColor,
          downColor,
          noChangeColor: axisText,
          upBorderColor: upColor,
          downBorderColor: downColor,
          noChangeBorderColor: axisText,
          upWickColor: upColor,
          downWickColor: downColor,
          noChangeWickColor: axisText,
        },
        area: {
          lineSize: 1.5,
          lineColor,
          smooth: false,
          value: "close",
          backgroundColor: [
            { offset: 0, color: fillColorStart },
            { offset: 1, color: fillColorEnd },
          ],
          point: {
            show: false,
          },
        },
        priceMark: {
          show: true,
          high: { show: false },
          low: { show: false },
          last: {
            show: true,
            upColor: upColor,
            downColor: downColor,
            noChangeColor: axisText,
            line: {
              show: true,
              style: "dashed",
              dashedValue: [4, 4],
              size: 1,
            },
            text: {
              show: true,
              color: "#ffffff",
              size: 10,
              family: chartFont,
              weight: 600,
              borderRadius: 2,
              paddingLeft: 4,
              paddingRight: 4,
              paddingTop: 2,
              paddingBottom: 2,
            },
          },
        },
        tooltip: {
          showRule: "none",
        },
      },
      indicator: {
        bars: [
          {
            style: "fill",
            borderStyle: "solid",
            borderSize: 0,
            borderDashedValue: [2, 2],
            upColor: isLight ? "rgba(22, 163, 74, 0.35)" : "rgba(34, 197, 94, 0.35)",
            downColor: isLight ? "rgba(239, 68, 68, 0.35)" : "rgba(248, 113, 113, 0.35)",
            noChangeColor: "rgba(148, 163, 184, 0.35)",
          },
        ],
        lines: [
          { show: false },
          { show: false },
          { show: false },
          { show: false },
          { show: false },
        ],
        tooltip: {
          showRule: "none",
        },
        lastValueMark: {
          show: false,
        },
      },
      separator: {
        size: 1,
        color: gridColor,
        fill: false,
        activeBackgroundColor: "transparent",
      },
    });
  };

  // Store current bars for updates
  let currentBars: KLineData[] = [];
  let currentBarCount = 0;

  // KlineCharts has a hard-coded minimum bar space of 1px (BarSpaceLimitConstants.MIN = 1)
  // This means we cannot fit more bars than pixels. To show all data without scrolling,
  // we must downsample when data exceeds available width.
  const KLINE_MIN_BAR_SPACE = 1;

  // Downsample bars using LTTB (Largest-Triangle-Three-Buckets) algorithm
  // This preserves visual shape better than simple sampling
  const downsampleBars = (bars: KLineData[], targetCount: number): KLineData[] => {
    if (bars.length <= targetCount || targetCount < 3) return bars;

    const result: KLineData[] = [];
    const bucketSize = (bars.length - 2) / (targetCount - 2);

    // Always keep first point
    result.push(bars[0]);

    for (let i = 0; i < targetCount - 2; i++) {
      const bucketStart = Math.floor((i + 0) * bucketSize) + 1;
      const bucketEnd = Math.floor((i + 1) * bucketSize) + 1;
      const nextBucketStart = Math.floor((i + 1) * bucketSize) + 1;
      const nextBucketEnd = Math.floor((i + 2) * bucketSize) + 1;

      // Average of next bucket (for triangle calculation)
      let avgX = 0, avgY = 0, count = 0;
      for (let j = nextBucketStart; j < nextBucketEnd && j < bars.length - 1; j++) {
        avgX += j;
        avgY += bars[j].close;
        count++;
      }
      if (count > 0) {
        avgX /= count;
        avgY /= count;
      }

      // Find point in current bucket with largest triangle area
      const prevX = result.length - 1;
      const prevY = result[result.length - 1].close;
      let maxArea = -1;
      let maxIndex = bucketStart;

      for (let j = bucketStart; j < bucketEnd && j < bars.length - 1; j++) {
        // Triangle area formula (simplified, no division by 2 needed for comparison)
        const area = Math.abs(
          (prevX - avgX) * (bars[j].close - prevY) -
          (prevX - j) * (avgY - prevY)
        );
        if (area > maxArea) {
          maxArea = area;
          maxIndex = j;
        }
      }

      result.push(bars[maxIndex]);
    }

    // Always keep last point
    result.push(bars[bars.length - 1]);

    return result;
  };

  // Update bar space to fit all data without scrolling, starting from left edge
  const updateBarSpace = () => {
    if (!chart || !chartContainer || currentBarCount <= 0) return;

    // Get the actual main pane width (excludes y-axis)
    const paneWidth = chart.getSize("candle_pane", "main")?.width;
    const containerWidth = chartContainer.clientWidth;
    const chartWidth = chart.getSize()?.width;
    const width = paneWidth ?? containerWidth ?? chartWidth ?? 0;

    if (!width || width <= 0) return;

    // Calculate bar space to fit all bars exactly in the available width
    const barSpace = Math.max(KLINE_MIN_BAR_SPACE, width / currentBarCount);

    // Set the bar space
    chart.setBarSpace(barSpace);

    // Reset offsets
    chart.setMaxOffsetRightDistance(0);
    chart.setOffsetRightDistance(0);

    // Get current visible range
    const visibleRange = chart.getVisibleRange();

    // Calculate how far we need to scroll to get first bar at left edge
    // visibleRange.from is the index of the first visible bar
    // If from > 0, we need to scroll to show earlier bars
    // If from < 0, we've scrolled too far left (empty space at left)
    if (visibleRange.from !== 0) {
      const actualBarSpace = chart.getBarSpace()?.bar ?? barSpace;
      // Scroll by the distance needed to make from = 0
      // Negative distance scrolls left (shows earlier data), positive scrolls right
      const scrollDistance = visibleRange.from * actualBarSpace;
      chart.scrollByDistance(scrollDistance);
    }
  };

  const updateChartData = (rawData: any[]) => {
    if (!chart || !chartContainer) return;

    let bars = buildBars(rawData);

    if (!bars.length) {
      currentBars = [];
      currentBarCount = 0;
      chart.setDataLoader({
        getBars: async ({ type, callback }) => {
          callback([], { backward: false, forward: false });
        },
      });
      return;
    }

    // Calculate available width to determine if we need to downsample
    const paneWidth = chart.getSize("candle_pane", "main")?.width;
    const containerWidth = chartContainer.clientWidth;
    const chartWidth = chart.getSize()?.width;
    const width = paneWidth ?? containerWidth ?? chartWidth ?? 0;

    // Downsample if we have more bars than pixels (KlineCharts min bar space is 1px)
    // Leave some margin (use 90% of width) to ensure all data fits comfortably
    const maxBars = Math.max(100, Math.floor((width || 800) * 0.95));
    if (bars.length > maxBars) {
      bars = downsampleBars(bars, maxBars);
    }

    currentBars = bars;
    currentBarCount = bars.length;

    const intervalMs = computeIntervalMs(bars);
    const periodType = intervalMs >= 86400000 ? "day" : intervalMs >= 3600000 ? "hour" : "minute";
    const periodSpan = periodType === "day" ? 1 : periodType === "hour" ? Math.round(intervalMs / 3600000) : Math.round(intervalMs / 60000);

    // Set period BEFORE setting data loader
    chart.setPeriod({ type: periodType, span: periodSpan });

    // Use setDataLoader - KlineCharts will automatically call the callback with type: "init"
    chart.setDataLoader({
      getBars: async ({ type, callback }) => {
        if (type === "init") {
          callback(currentBars, { backward: false, forward: false });
          // Use requestAnimationFrame to wait for the chart to render
          // Then apply bar space and positioning
          requestAnimationFrame(() => {
            updateBarSpace();
            // Second call after a delay ensures positioning sticks after initial render
            requestAnimationFrame(() => {
              updateBarSpace();
            });
          });
          return;
        }
        callback([], { backward: false, forward: false });
      },
    });
  };

  const formatXAxisLabel = (timestamp: number): string => {
    const date = new Date(timestamp);

    if (displayRange === "1D") {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }

    if (["1W", "1M"].includes(displayRange)) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
    }

    return date.toLocaleDateString("en-US", {
      year: "2-digit",
      month: "short",
      timeZone: "UTC",
    });
  };

  const formatTooltipTime = (timestamp: number): string => {
    const date = new Date(timestamp);

    if (displayRange === "1D") {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }

    if (["1W", "1M"].includes(displayRange)) {
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "UTC",
      });
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  };

  // Range selector helpers
  const hexToRgba = (hex: string, alpha: number): string => {
    const normalized = hex.replace("#", "");
    const expanded = normalized.length === 3
      ? normalized.split("").map((c) => c + c).join("")
      : normalized;
    if (expanded.length !== 6) return `rgba(0, 0, 0, ${alpha})`;
    const r = parseInt(expanded.slice(0, 2), 16);
    const g = parseInt(expanded.slice(2, 4), 16);
    const b = parseInt(expanded.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  $: selectionDelta = selectionStart && selectionEnd
    ? selectionEnd.price - selectionStart.price
    : 0;

  $: selectionPercent = selectionStart && selectionEnd && selectionStart.price !== 0
    ? ((selectionEnd.price - selectionStart.price) / selectionStart.price) * 100
    : 0;

  $: selectionColor = selectionDelta >= 0 ? "#00FC50" : "#FF2F1F";

  // Format the time/date range for the label
  $: selectionTimeRange = (() => {
    if (!selectionStart || !selectionEnd) return "";
    const t1 = Math.min(selectionStart.timestamp, selectionEnd.timestamp);
    const t2 = Math.max(selectionStart.timestamp, selectionEnd.timestamp);
    if (t1 === t2) return formatRangeTimestamp(t1);
    return `${formatRangeTimestamp(t1)} – ${formatRangeTimestamp(t2)}`;
  })();

  $: selectionRect = (() => {
    if (!selectionStart || !selectionEnd || !chartContainer) return null;
    const x1 = Math.min(selectionStart.x, selectionEnd.x);
    const x2 = Math.max(selectionStart.x, selectionEnd.x);
    const width = x2 - x1;
    const height = chartContainer.clientHeight - 80; // Price pane height (total minus volume pane)
    return { x: x1, y: 0, width, height };
  })();

  // Event handlers for range selection
  const getDataFromPoint = (clientX: number, clientY: number): { index: number; price: number; x: number; y: number; timestamp: number } | null => {
    if (!chart || !chartContainer) return null;

    const rect = chartContainer.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const dataIndex = chart.convertFromPixel({ x, y }, { paneId: "candle_pane", absolute: false });
    if (!dataIndex || dataIndex.dataIndex === undefined) return null;

    const dataList = chart.getDataList();
    const bar = dataList[dataIndex.dataIndex];
    if (!bar) return null;

    return {
      index: dataIndex.dataIndex,
      price: bar.close,
      x,
      y,
      timestamp: bar.timestamp,
    };
  };

  const onPointerDown = (evt: PointerEvent) => {
    if (evt.button !== 0) return;

    const data = getDataFromPoint(evt.clientX, evt.clientY);
    if (!data) return;

    startPointerId = evt.pointerId;
    startChartX = data.x;
    selectionStart = { index: data.index, price: data.price, x: data.x, y: data.y, timestamp: data.timestamp };
    selectionEnd = { index: data.index, price: data.price, x: data.x, y: data.y, timestamp: data.timestamp };

    try {
      (evt.target as HTMLElement)?.setPointerCapture(evt.pointerId);
    } catch {}
  };

  const onPointerMove = (evt: PointerEvent) => {
    if (startPointerId !== evt.pointerId || !selectionStart) return;

    const data = getDataFromPoint(evt.clientX, evt.clientY);
    if (!data) return;

    // Check if we've exceeded drag threshold
    if (!isSelecting && startChartX !== null && Math.abs(data.x - startChartX) > DRAG_THRESHOLD_PX) {
      isSelecting = true;
      if (chart) {
        chart.setZoomEnabled(false);
        chart.setScrollEnabled(false);
      }
    }

    if (isSelecting) {
      selectionEnd = { index: data.index, price: data.price, x: data.x, y: data.y, timestamp: data.timestamp };
      evt.preventDefault();
    }
  };

  const onPointerUp = (evt: PointerEvent) => {
    if (startPointerId !== evt.pointerId) return;

    try {
      (evt.target as HTMLElement)?.releasePointerCapture(evt.pointerId);
    } catch {}

    // Keep selection visible for a moment, then clear
    setTimeout(() => {
      isSelecting = false;
      selectionStart = null;
      selectionEnd = null;
      startPointerId = null;
      startChartX = null;
      if (chart) {
        chart.setZoomEnabled(false);
        chart.setScrollEnabled(false);
      }
    }, 100);
  };

  const onPointerCancel = onPointerUp;

  onMount(() => {
    if (!chartContainer) return;

    ensurePrevCloseOverlay();
    chart = init(chartContainer);
    if (!chart) return;

    chart.setZoomEnabled(false);
    chart.setScrollEnabled(false);
    chart.setOffsetRightDistance(0);
    chart.setLeftMinVisibleBarCount(0);
    chart.setRightMinVisibleBarCount(0);

    // Set symbol info (required for proper chart initialization)
    chart.setSymbol({
      ticker: "STOCK",
      pricePrecision: 2,
      volumePrecision: 0,
    });

    // Create volume pane with no MA lines (calcParams: [] disables MA calculations)
    // Use custom createRange for proper volume scaling like TradingView
    chart.createIndicator({ name: "VOL", calcParams: [] }, false, {
      id: "volume_pane",
      height: 80,
      gap: { top: 0.02, bottom: 0 },
      axis: {
        show: false,
        createRange: ({ chart: c, defaultRange }) => {
          const visibleRange = c.getVisibleRange();
          const dataList = c.getDataList();

          if (!dataList || dataList.length === 0) {
            return defaultRange;
          }

          // Collect volumes from visible bars
          const volumes: number[] = [];
          for (let i = visibleRange.from; i < visibleRange.to; i++) {
            const data = dataList[i];
            if (data && typeof data.volume === "number" && data.volume > 0) {
              volumes.push(data.volume);
            }
          }

          if (volumes.length === 0) {
            return defaultRange;
          }

          // Sort volumes to calculate percentile
          volumes.sort((a, b) => a - b);

          // Use 95th percentile as max to handle outliers/spikes gracefully
          const percentileIndex = Math.floor(volumes.length * 0.95);
          const percentileMax = volumes[Math.min(percentileIndex, volumes.length - 1)];
          const actualMax = volumes[volumes.length - 1];

          // If the spike is more than 3x the 95th percentile, cap at 1.5x the 95th percentile
          // Otherwise use actual max with small padding
          let max: number;
          if (actualMax > percentileMax * 3) {
            max = percentileMax * 1.5;
          } else {
            max = actualMax * 1.05;
          }

          const min = 0;
          const range = max - min;

          return {
            from: min,
            to: max,
            range,
            realFrom: min,
            realTo: max,
            realRange: range,
            displayFrom: min,
            displayTo: max,
            displayRange: range,
          };
        },
      },
    });

    // Set pane options
    chart.setPaneOptions({
      id: "candle_pane",
      gap: { top: 0.02, bottom: 0.02 },
    });

    chart.setFormatter({
      formatDate: ({ timestamp }) => formatXAxisLabel(timestamp),
    });

    // Set initial period (will be updated when data arrives)
    chart.setPeriod({ type: "minute", span: 1 });

    applyStyles($mode === "light", isNegative);

    // Apply data after styles are set
    if (priceData?.length > 0) {
      updateChartData(priceData);
    } else {
      console.log("[StockPriceChart] No initial data, waiting for reactive update");
    }

    // Add previous close line after data is loaded
    requestAnimationFrame(() => {
      updatePrevCloseLine();
    });

    // Set up resize observer
    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      if (resizeRaf !== null) {
        cancelAnimationFrame(resizeRaf);
      }
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = null;
        chart?.resize();
        // Re-calculate bar space after resize
        updateBarSpace();
      });
    });
    resizeObserver.observe(chartContainer);
  });

  onDestroy(() => {
    if (resizeRaf !== null) {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = null;
    }
    resizeObserver?.disconnect();
    resizeObserver = null;
    if (chart) {
      dispose(chart);
      chart = null;
    }
  });

  // Reactivity
  $: if (chart && $mode) {
    applyStyles($mode === "light", isNegative);
    updatePrevCloseLine();
  }

  $: if (chart && priceData) {
    updateChartData(priceData);
    requestAnimationFrame(() => {
      updatePrevCloseLine();
    });
  }

  $: if (chart && isNegative !== undefined) {
    applyStyles($mode === "light", isNegative);
  }

  $: if (chart && (previousClose !== undefined || displayRange)) {
    requestAnimationFrame(() => {
      updatePrevCloseLine();
    });
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

  <!-- Chart container -->
  <div
    bind:this={chartContainer}
    class="w-full h-full"
    on:pointerdown={onPointerDown}
    on:pointermove={onPointerMove}
    on:pointerup={onPointerUp}
    on:pointercancel={onPointerCancel}
    role="img"
    aria-label="Stock price chart"
  ></div>

  <!-- Range selection overlay -->
  {#if isSelecting && selectionRect && selectionStart && selectionEnd}
    <div class="absolute inset-0 pointer-events-none" style="z-index: 10;">
      <!-- Selection highlight -->
      <div
        class="absolute"
        style="
          left: {selectionRect.x}px;
          top: {selectionRect.y}px;
          width: {selectionRect.width}px;
          height: {selectionRect.height}px;
          background-color: {hexToRgba(selectionColor, $mode === 'light' ? 0.12 : 0.16)};
        "
      ></div>

      <!-- Start line -->
      <div
        class="absolute w-px"
        style="
          left: {selectionStart.x}px;
          top: 0;
          height: {selectionRect.height}px;
          background: repeating-linear-gradient(
            to bottom,
            {$mode === 'light' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'} 0px,
            {$mode === 'light' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'} 3px,
            transparent 3px,
            transparent 6px
          );
        "
      ></div>

      <!-- End line -->
      <div
        class="absolute w-px"
        style="
          left: {selectionEnd.x}px;
          top: 0;
          height: {selectionRect.height}px;
          background: repeating-linear-gradient(
            to bottom,
            {$mode === 'light' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'} 0px,
            {$mode === 'light' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'} 3px,
            transparent 3px,
            transparent 6px
          );
        "
      ></div>

      <!-- Start marker -->
      <div
        class="absolute w-2.5 h-2.5 rounded-full border-2"
        style="
          left: {selectionStart.x - 5}px;
          top: {selectionStart.y - 5}px;
          background-color: {$mode === 'light' ? '#000' : '#fff'};
          border-color: {$mode === 'light' ? '#000' : '#fff'};
        "
      ></div>

      <!-- End marker -->
      <div
        class="absolute w-2.5 h-2.5 rounded-full border-2"
        style="
          left: {selectionEnd.x - 5}px;
          top: {selectionEnd.y - 5}px;
          background-color: {$mode === 'light' ? '#000' : '#fff'};
          border-color: {$mode === 'light' ? '#000' : '#fff'};
        "
      ></div>

      <!-- Label -->
      <div
        class="absolute bg-black border border-gray-700 rounded px-2 py-1.5 text-sm"
        style="
          left: {(selectionStart.x + selectionEnd.x) / 2}px;
          top: 20px;
          transform: translateX(-50%);
        "
      >
        <div class="whitespace-nowrap" style="color: {selectionColor};">
          {selectionDelta > 0 ? '+' : ''}{selectionDelta.toFixed(2)} ({selectionPercent.toFixed(2)}%)
          {selectionDelta > 0 ? '↑' : selectionDelta < 0 ? '↓' : ''}
        </div>
        {#if selectionTimeRange}
          <div class="text-xs text-gray-400 whitespace-nowrap mt-0.5">
            {selectionTimeRange}
          </div>
        {/if}
      </div>
    </div>
  {/if}

</div>

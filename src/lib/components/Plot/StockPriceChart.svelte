<script context="module" lang="ts">
  import { registerXAxis } from "klinecharts";

  const SESSION_START_MIN = 9 * 60 + 30;
  const SESSION_END_MIN = 16 * 60;
  const SESSION_RANGE_MIN = SESSION_END_MIN - SESSION_START_MIN;
  const ONE_DAY_X_AXIS_NAME = "oneDayXAxis";
  const wideAxisLabels = [
    { label: "10 AM", minutes: 600 },
    { label: "11 AM", minutes: 660 },
    { label: "12 PM", minutes: 720 },
    { label: "1 PM", minutes: 780 },
    { label: "2 PM", minutes: 840 },
    { label: "3 PM", minutes: 900 },
    { label: "4 PM", minutes: 960 },
  ];
  const narrowAxisLabels = [
    { label: "10 AM", minutes: 600 },
    { label: "1 PM", minutes: 780 },
    { label: "4 PM", minutes: 960 },
  ];
  let oneDayXAxisRegistered = false;

  const ensureOneDayXAxis = () => {
    if (oneDayXAxisRegistered) return;
    registerXAxis({
      name: ONE_DAY_X_AXIS_NAME,
      createTicks: ({ bounding }) => {
        const width = Math.max(bounding.width, 0);
        if (width <= 0) return [];
        const leftPad = 6;
        const rightPad = 20;
        const usableWidth = Math.max(width - leftPad - rightPad, 1);
        const labels = width > 640 ? wideAxisLabels : narrowAxisLabels;
        return labels.map((tick) => ({
          coord:
            leftPad +
            usableWidth *
              ((tick.minutes - SESSION_START_MIN) / SESSION_RANGE_MIN),
          value: tick.minutes,
          text: tick.label,
        }));
      },
    });
    oneDayXAxisRegistered = true;
  };
</script>

<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { mode } from "mode-watcher";
  import { init, dispose, type Crosshair } from "klinecharts";
  import {
    adjacentRealPointIndex,
    buildHoverSummary,
    chartSamplingTarget,
    downsampleChartPoints,
    formatEtTimestamp,
    normalizeChartData,
    sessionPointCount,
    type ChartPoint,
    type HoverSummary,
    type RawChartPoint,
  } from "./stockPriceChartData";
  import {
    common_chart_change,
    common_chart_empty,
    common_chart_error,
    common_chart_loading,
    common_chart_price,
    common_chart_retry,
    common_chart_summary,
  } from "$lib/paraglide/messages";

  // ============================================================================
  // CONSTANTS & CACHED FORMATTERS (avoid creating new instances repeatedly)
  // ============================================================================
  const NY_TIMEZONE = "America/New_York";
  const KLINE_MIN_BAR_SPACE = 1;
  const DRAG_THRESHOLD_PX = 6;
  const TOOLTIP_GAP_PX = 12;
  const TOOLTIP_MARGIN_PX = 8;
  const TOOLTIP_FALLBACK_WIDTH_PX = 320;
  const TOOLTIP_FALLBACK_HEIGHT_PX = 84;

  // ============================================================================
  // PROPS
  // ============================================================================
  export let priceData: RawChartPoint[] = [];
  export let displayRange: string = "1D";
  export let previousClose: number | null = null;
  export let isNegative: boolean = false;
  export let isLoading: boolean = false;
  export let symbol: string = "";
  export let errorMessage: string | null = null;
  export let onRetry: (() => void) | null = null;

  // ============================================================================
  // STATE
  // ============================================================================
  let chartContainer: HTMLDivElement | null = null;
  let chart: ReturnType<typeof init> | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let resizeRaf: number | null = null;
  let styleRaf: number | null = null;
  let lastContainerWidth = 0;
  let lastSamplingTarget = 0;
  let currentBars: ChartPoint[] = [];
  let currentBarCount = 0;
  let sessionStart: number | null = null;
  let sessionEnd: number | null = null;
  let sessionBarCount = 0;
  let missingRightBars = 0;
  let hoverSummary: HoverSummary | null = null;
  let hoverTooltip: HTMLDivElement | null = null;
  let tooltipVisible = false;
  let tooltipX = TOOLTIP_MARGIN_PX;
  let tooltipY = TOOLTIP_MARGIN_PX;
  let chartError = "";
  let dataGeneration = 0;
  let layoutRaf: number | null = null;
  let layoutTimer: ReturnType<typeof setTimeout> | null = null;
  let selectionTimer: ReturnType<typeof setTimeout> | null = null;
  let rangeUpdateTimer: ReturnType<typeof setTimeout> | null = null;
  let unsubscribeWheel: (() => void) | null = null;

  // Range selection state
  let isSelecting = false;
  let selectionStart: {
    index: number;
    price: number;
    x: number;
    y: number;
    timestamp: number;
  } | null = null;
  let selectionEnd: {
    index: number;
    price: number;
    x: number;
    y: number;
    timestamp: number;
  } | null = null;
  let startPointerId: number | null = null;
  let startChartX: number | null = null;

  // Track last applied values to avoid redundant updates
  let lastAppliedMode: string | null = null;
  let lastAppliedNegative: boolean | null = null;
  let lastDisplayRange: string | null = null;
  let dataUpdateRaf: number | null = null;

  // ============================================================================
  // UTILITY FUNCTIONS (optimized)
  // ============================================================================
  // ============================================================================
  // CHART FUNCTIONS
  // ============================================================================
  // Same tokens the tables use, so the green in the chart matches the green in
  // the header. Chart only renders client-side, so the document always exists.
  const CHART_FALLBACK = "#808080";
  const cssVar = (name: string) => {
    if (typeof window === "undefined") return CHART_FALLBACK;
    return (
      getComputedStyle(document.documentElement)
        ?.getPropertyValue(name)
        ?.trim() || CHART_FALLBACK
    );
  };

  const applyStyles = (isLight: boolean, negative: boolean) => {
    if (!chart) return;

    const upColor = cssVar("--up");
    const downColor = cssVar("--down");
    const gridColor = cssVar("--line");
    const axisText = cssVar("--fg-subtle");
    const crosshairLine = cssVar("--fg-muted");
    const crosshairBg = cssVar("--fg");
    const crosshairText = cssVar("--surface-card");
    const chartFont = "Space Grotesk";
    const lineColor = negative ? downColor : upColor;
    // klinecharts colours priceMark.last by comparing the last bar to the one
    // before it, so a single closing down-tick painted the tag and the dashed
    // rule RED on a session that finished up. The session decides, not the tick.
    const sessionColor = lineColor;
    // Multi-stop gradient for smooth fade effect (0 = bottom, 1 = top near line)
    const areaGradient = negative
      ? [
          { offset: 0, color: "rgba(0, 0, 0, 0)" },
          {
            offset: 0.4,
            color: isLight
              ? "rgba(220, 38, 38, 0.05)"
              : "rgba(248, 113, 113, 0.04)",
          },
          {
            offset: 0.7,
            color: isLight
              ? "rgba(220, 38, 38, 0.12)"
              : "rgba(248, 113, 113, 0.10)",
          },
          {
            offset: 1,
            color: isLight
              ? "rgba(220, 38, 38, 0.25)"
              : "rgba(248, 113, 113, 0.20)",
          },
        ]
      : [
          { offset: 0, color: "rgba(0, 0, 0, 0)" },
          {
            offset: 0.4,
            color: isLight
              ? "rgba(22, 163, 74, 0.05)"
              : "rgba(34, 197, 94, 0.04)",
          },
          {
            offset: 0.7,
            color: isLight
              ? "rgba(22, 163, 74, 0.12)"
              : "rgba(34, 197, 94, 0.10)",
          },
          {
            offset: 1,
            color: isLight
              ? "rgba(22, 163, 74, 0.25)"
              : "rgba(34, 197, 94, 0.20)",
          },
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
          line: {
            show: true,
            style: "dashed",
            dashedValue: [4, 4],
            size: 1,
            color: crosshairLine,
          },
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
          line: {
            show: true,
            style: "dashed",
            dashedValue: [4, 4],
            size: 1,
            color: crosshairLine,
          },
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
          backgroundColor: areaGradient,
          point: { show: false },
        },
        priceMark: {
          show: true,
          high: { show: false },
          low: { show: false },
          last: {
            show: true,
            upColor: sessionColor,
            downColor: sessionColor,
            noChangeColor: sessionColor,
            line: { show: true, style: "dashed", dashedValue: [4, 4], size: 1 },
            text: {
              show: true,
              color: crosshairText,
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
        tooltip: { showRule: "none" },
      },
      separator: {
        size: 0,
        color: "transparent",
        fill: false,
        activeBackgroundColor: "transparent",
      },
    });

    lastAppliedMode = isLight ? "light" : "dark";
    lastAppliedNegative = negative;
  };

  const updateBarSpace = () => {
    if (!chart || !chartContainer || currentBarCount <= 0) return;

    // Use consistent fallback with updateChartData (300 for mobile)
    const width =
      chart.getSize("candle_pane", "main")?.width ||
      chartContainer?.clientWidth ||
      300;

    const targetCount =
      displayRange === "1D" && sessionBarCount > 0
        ? sessionBarCount
        : currentBarCount;
    const barSpace = Math.max(KLINE_MIN_BAR_SPACE, width / targetCount);
    chart.setBarSpace(barSpace);

    const actualSpace = chart.getBarSpace()?.bar ?? barSpace;
    const rightOffset =
      displayRange === "1D" && missingRightBars > 0
        ? missingRightBars * actualSpace
        : 0;
    chart.setMaxOffsetRightDistance(rightOffset + 10);
    chart.setOffsetRightDistance(rightOffset);
  };

  const clearLayoutWork = () => {
    if (layoutRaf !== null) cancelAnimationFrame(layoutRaf);
    if (layoutTimer !== null) clearTimeout(layoutTimer);
    layoutRaf = null;
    layoutTimer = null;
  };

  const scheduleBarSpace = (generation: number) => {
    clearLayoutWork();
    layoutRaf = requestAnimationFrame(() => {
      layoutRaf = null;
      if (generation !== dataGeneration || !chart) return;
      updateBarSpace();
      layoutTimer = setTimeout(() => {
        layoutTimer = null;
        if (generation === dataGeneration && chart) updateBarSpace();
      }, 16);
    });
  };

  const updateChartData = (rawData: RawChartPoint[]) => {
    if (!chart || !chartContainer) return;
    const generation = ++dataGeneration;
    clearLayoutWork();
    const normalized = normalizeChartData(rawData, displayRange);
    let bars = normalized.points;
    sessionStart = normalized.sessionStart;
    sessionEnd = normalized.sessionEnd;
    chartError = "";
    hoverSummary = null;
    if (!bars.length) {
      currentBars = [];
      currentBarCount = 0;
      sessionBarCount = 0;
      missingRightBars = 0;
      chart.setDataLoader({
        getBars: async ({ callback }) =>
          callback([], { backward: false, forward: false }),
      });
      return;
    }

    const intervalMs = normalized.intervalMs;
    const maxBars = chartSamplingTarget(chartContainer.clientWidth);
    lastSamplingTarget = maxBars;

    if (displayRange === "1D" && sessionStart !== null && sessionEnd !== null) {
      const fullCount = sessionPointCount(sessionStart, sessionEnd, intervalMs);
      const lastTs = bars[bars.length - 1].timestamp;
      const rawMissing =
        lastTs < sessionEnd
          ? Math.round((sessionEnd - lastTs) / intervalMs)
          : 0;

      if (fullCount > maxBars) {
        const ratio = maxBars / fullCount;
        bars = downsampleChartPoints(
          bars,
          Math.max(2, Math.floor(bars.length * ratio)),
        );
        sessionBarCount = maxBars;
        missingRightBars = Math.round(rawMissing * ratio);
      } else {
        sessionBarCount = fullCount;
        missingRightBars = rawMissing;
      }
    } else {
      sessionBarCount = 0;
      missingRightBars = 0;
      if (bars.length > maxBars) bars = downsampleChartPoints(bars, maxBars);
    }

    currentBars = bars;
    currentBarCount = bars.length;
    showSummaryAtIndex(bars.length - 1);

    const periodType =
      intervalMs >= 86400000
        ? "day"
        : intervalMs >= 3600000
          ? "hour"
          : "minute";
    const periodSpan =
      periodType === "day"
        ? 1
        : periodType === "hour"
          ? Math.round(intervalMs / 3600000)
          : Math.round(intervalMs / 60000);

    chart.setPeriod({ type: periodType, span: periodSpan });

    // Capture bars in closure to avoid race conditions when updateChartData is called rapidly
    const barsToLoad = bars;
    // Use setDataLoader - klinecharts will call getBars with type "init"
    chart.setDataLoader({
      getBars: async ({ type, callback }) => {
        if (generation !== dataGeneration) {
          callback([], { backward: false, forward: false });
          return;
        }
        if (type === "init") {
          callback(barsToLoad, { backward: false, forward: false });
          scheduleBarSpace(generation);
        } else {
          callback([], { backward: false, forward: false });
        }
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
        timeZone: NY_TIMEZONE,
      });
    }
    if (displayRange === "1W" || displayRange === "1M") {
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

  // ============================================================================
  // RANGE SELECTION
  // ============================================================================
  const formatRangeTimestamp = (ts: number): string => {
    const date = new Date(ts);
    if (displayRange === "1D") {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: NY_TIMEZONE,
      });
    }
    if (displayRange === "1W" || displayRange === "1M") {
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "UTC",
      });
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  const hexToRgba = (hex: string, alpha: number): string => {
    const h = hex.replace("#", "");
    const expanded =
      h.length === 3
        ? h
            .split("")
            .map((c) => c + c)
            .join("")
        : h;
    if (expanded.length !== 6) return `rgba(0,0,0,${alpha})`;
    return `rgba(${parseInt(expanded.slice(0, 2), 16)},${parseInt(expanded.slice(2, 4), 16)},${parseInt(expanded.slice(4, 6), 16)},${alpha})`;
  };

  $: selectionDelta =
    selectionStart && selectionEnd
      ? selectionEnd.price - selectionStart.price
      : 0;
  $: selectionPercent =
    selectionStart && selectionEnd && selectionStart.price !== 0
      ? ((selectionEnd.price - selectionStart.price) / selectionStart.price) *
        100
      : 0;
  $: selectionColor = selectionDelta >= 0 ? "#00FC50" : "#FF2F1F";
  $: selectionTimeRange =
    selectionStart && selectionEnd
      ? selectionStart.timestamp === selectionEnd.timestamp
        ? formatRangeTimestamp(selectionStart.timestamp)
        : `${formatRangeTimestamp(Math.min(selectionStart.timestamp, selectionEnd.timestamp))} – ${formatRangeTimestamp(Math.max(selectionStart.timestamp, selectionEnd.timestamp))}`
      : "";
  $: selectionRect =
    selectionStart && selectionEnd && chartContainer
      ? {
          x: Math.min(selectionStart.x, selectionEnd.x),
          y: 0,
          width: Math.abs(selectionEnd.x - selectionStart.x),
          height: chartContainer.clientHeight - 80,
        }
      : null;

  const getDataFromPoint = (clientX: number, clientY: number) => {
    if (!chart || !chartContainer) return null;
    const rect = chartContainer.getBoundingClientRect();
    const x = clientX - rect.left,
      y = clientY - rect.top;
    const dataIndex = chart.convertFromPixel(
      { x, y },
      { paneId: "candle_pane", absolute: false },
    );
    if (!dataIndex || dataIndex.dataIndex === undefined) return null;
    const bar = chart.getDataList()[dataIndex.dataIndex];
    if (!bar) return null;
    return {
      index: dataIndex.dataIndex,
      price: bar.close,
      x,
      y,
      timestamp: bar.timestamp,
    };
  };

  const showSummaryAtIndex = (index: number) => {
    hoverSummary = buildHoverSummary(
      currentBars,
      index,
      displayRange,
      previousClose,
    );
  };

  const onCrosshairChange = (data?: unknown) => {
    const crosshair = data as Crosshair | undefined;
    if (typeof crosshair?.dataIndex === "number") {
      showSummaryAtIndex(crosshair.dataIndex);
    }
  };

  const positionTooltip = (clientX: number, clientY: number) => {
    if (!chartContainer) return;
    const rect = chartContainer.getBoundingClientRect();
    const width = Math.min(
      hoverTooltip?.offsetWidth ?? TOOLTIP_FALLBACK_WIDTH_PX,
      Math.max(rect.width - TOOLTIP_MARGIN_PX * 2, 0),
    );
    const height = Math.min(
      hoverTooltip?.offsetHeight ?? TOOLTIP_FALLBACK_HEIGHT_PX,
      Math.max(rect.height - TOOLTIP_MARGIN_PX * 2, 0),
    );
    const pointerX = clientX - rect.left;
    const pointerY = clientY - rect.top;
    const preferredX = pointerX + TOOLTIP_GAP_PX;
    tooltipX = Math.max(
      TOOLTIP_MARGIN_PX,
      Math.min(
        preferredX + width > rect.width - TOOLTIP_MARGIN_PX
          ? pointerX - width - TOOLTIP_GAP_PX
          : preferredX,
        rect.width - width - TOOLTIP_MARGIN_PX,
      ),
    );
    tooltipY = Math.max(
      TOOLTIP_MARGIN_PX,
      Math.min(
        pointerY - height / 2,
        rect.height - height - TOOLTIP_MARGIN_PX,
      ),
    );
  };

  const onChartPointerMove = (evt: PointerEvent) => {
    const data = getDataFromPoint(evt.clientX, evt.clientY);
    if (data && evt.pointerType !== "touch") {
      showSummaryAtIndex(data.index);
      tooltipVisible = true;
      positionTooltip(evt.clientX, evt.clientY);
    }
    onPointerMove(evt);
  };

  const onChartPointerLeave = () => {
    tooltipVisible = false;
    if (!isSelecting && currentBars.length > 0) {
      showSummaryAtIndex(currentBars.length - 1);
    }
  };

  const onChartBlur = () => {
    tooltipVisible = false;
  };

  const onChartKeyDown = (evt: KeyboardEvent) => {
    if (!currentBars.length) return;
    const currentIndex = hoverSummary?.pointIndex ?? currentBars.length - 1;
    if (evt.key === "ArrowLeft" || evt.key === "ArrowRight") {
      const nextIndex = adjacentRealPointIndex(
        currentBars,
        currentIndex,
        evt.key === "ArrowLeft" ? -1 : 1,
      );
      if (nextIndex !== null) {
        showSummaryAtIndex(nextIndex);
        tooltipVisible = true;
      }
      evt.preventDefault();
    } else if (evt.key === "Home") {
      showSummaryAtIndex(0);
      tooltipVisible = true;
      evt.preventDefault();
    } else if (evt.key === "End") {
      showSummaryAtIndex(currentBars.length - 1);
      tooltipVisible = true;
      evt.preventDefault();
    } else if (evt.key === "Escape") {
      tooltipVisible = false;
    }
  };

  const stopChartWheel = (evt: WheelEvent) => evt.stopPropagation();

  const onPointerDown = (evt: PointerEvent) => {
    if (evt.button !== 0) return;
    const data = getDataFromPoint(evt.clientX, evt.clientY);
    if (!data) return;
    startPointerId = evt.pointerId;
    startChartX = data.x;
    selectionStart = selectionEnd = { ...data };
  };

  const onPointerMove = (evt: PointerEvent) => {
    if (startPointerId !== evt.pointerId || !selectionStart) return;
    const data = getDataFromPoint(evt.clientX, evt.clientY);
    if (!data) return;
    if (
      !isSelecting &&
      startChartX !== null &&
      Math.abs(data.x - startChartX) > DRAG_THRESHOLD_PX
    ) {
      isSelecting = true;
      try {
        (evt.target as HTMLElement)?.setPointerCapture(evt.pointerId);
      } catch {}
    }
    if (isSelecting) {
      selectionEnd = { ...data };
      evt.preventDefault();
    }
  };

  const onPointerUp = (evt: PointerEvent) => {
    if (startPointerId !== evt.pointerId) return;
    try {
      (evt.target as HTMLElement)?.releasePointerCapture(evt.pointerId);
    } catch {}
    if (selectionTimer !== null) clearTimeout(selectionTimer);
    selectionTimer = setTimeout(() => {
      selectionTimer = null;
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

    try {
      chart = init(chartContainer);
    } catch (error) {
      console.error("Unable to initialize stock price chart", error);
      chartError = common_chart_error();
      return;
    }
    if (!chart) {
      chartError = common_chart_error();
      return;
    }

    chartContainer.addEventListener("wheel", stopChartWheel, {
      capture: true,
      passive: true,
    });
    unsubscribeWheel = () =>
      chartContainer?.removeEventListener("wheel", stopChartWheel, true);
    chart.setZoomEnabled(false);
    chart.setScrollEnabled(false);
    chart.setOffsetRightDistance(0);
    chart.setLeftMinVisibleBarCount(0);
    chart.setRightMinVisibleBarCount(0);
    chart.setSymbol({
      ticker: symbol.trim().toUpperCase() || "INSTRUMENT",
      pricePrecision: 2,
      volumePrecision: 0,
    });
    chart.subscribeAction("onCrosshairChange", onCrosshairChange);

    chart.setPaneOptions({
      id: "candle_pane",
      gap: { top: 0.02, bottom: 0.02 },
      axis: { scrollZoomEnabled: false },
    });

    if (displayRange === "1D") {
      chart.setPaneOptions({
        id: "x_axis_pane",
        axis: { name: ONE_DAY_X_AXIS_NAME, scrollZoomEnabled: false },
      });
    }

    chart.setFormatter({
      formatDate: ({ timestamp }) => formatXAxisLabel(timestamp),
    });
    chart.setPeriod({ type: "minute", span: 1 });

    applyStyles($mode === "light", isNegative);

    if (priceData?.length > 0) {
      updateChartData(priceData);
    }

    lastDisplayRange = displayRange;

    resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (Math.abs(width - lastContainerWidth) < 1) return;
      const previousWidth = lastContainerWidth;
      lastContainerWidth = width;
      const samplingTarget = chartSamplingTarget(width);

      if (resizeRaf !== null) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = null;
        chart?.resize();
        if (
          previousWidth > 0 &&
          priceData.length > 0 &&
          samplingTarget !== lastSamplingTarget
        ) {
          updateChartData(priceData);
        } else {
          updateBarSpace();
        }
      });
    });
    resizeObserver.observe(chartContainer);
  });

  onDestroy(() => {
    dataGeneration += 1;
    if (resizeRaf !== null) cancelAnimationFrame(resizeRaf);
    if (styleRaf !== null) cancelAnimationFrame(styleRaf);
    if (dataUpdateRaf !== null) cancelAnimationFrame(dataUpdateRaf);
    if (selectionTimer !== null) clearTimeout(selectionTimer);
    if (rangeUpdateTimer !== null) clearTimeout(rangeUpdateTimer);
    clearLayoutWork();
    unsubscribeWheel?.();
    resizeObserver?.disconnect();
    if (chart) {
      chart.unsubscribeAction("onCrosshairChange", onCrosshairChange);
      dispose(chart);
      chart = null;
    }
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
      if (
        lastAppliedMode !== (isLight ? "light" : "dark") ||
        lastAppliedNegative !== isNegative
      ) {
        applyStyles(isLight, isNegative);
      }
    });
  };

  // React to mode changes
  $: if (chart && $mode) scheduleStyleUpdate();

  // React to isNegative changes
  $: if (chart && isNegative !== lastAppliedNegative) scheduleStyleUpdate();

  // Debounced data update to handle rapid range switching
  const scheduleDataUpdate = () => {
    if (dataUpdateRaf !== null) cancelAnimationFrame(dataUpdateRaf);
    dataUpdateRaf = requestAnimationFrame(() => {
      dataUpdateRaf = null;
      if (!chart) return;
      updateChartData(priceData);
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
      axis: {
        name: displayRange === "1D" ? ONE_DAY_X_AXIS_NAME : "default",
        scrollZoomEnabled: false,
      },
    });
    // Only trigger data update if priceData hasn't changed yet (handles cached data with same reference)
    // If priceData will change, let the priceData reactive handle the update to avoid race conditions
    if (lastProcessedDisplayRange !== displayRange && priceData?.length > 0) {
      // Small delay to allow priceData reactive to fire first if data is changing
      if (rangeUpdateTimer !== null) clearTimeout(rangeUpdateTimer);
      rangeUpdateTimer = setTimeout(() => {
        rangeUpdateTimer = null;
        if (
          lastProcessedDisplayRange !== displayRange &&
          priceData?.length > 0
        ) {
          lastProcessedDisplayRange = displayRange;
          scheduleDataUpdate();
        }
      }, 10);
    }
  }

  $: if (chart && symbol) {
    chart.setSymbol({
      ticker: symbol.trim().toUpperCase() || "INSTRUMENT",
      pricePrecision: 2,
      volumePrecision: 0,
    });
  }

  $: effectiveError = errorMessage || chartError;
  $: hoverDateTime = hoverSummary
    ? formatEtTimestamp(hoverSummary.timestamp)
    : { date: "", time: "" };
  $: chartLabel = common_chart_summary({
    symbol: symbol.trim().toUpperCase() || "Instrument",
    range: displayRange,
  });
</script>

<div class="relative w-full h-[320px]">
  {#if isLoading}
    <div
      class="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <div
        class="bg-white/90 dark:bg-zinc-900/80 border border-line rounded-full h-14 w-14 flex items-center justify-center"
      >
        <span
          class="loading loading-spinner loading-md text-fg"
          aria-hidden="true"
        ></span>
      </div>
      <span class="sr-only">{common_chart_loading()}</span>
    </div>
  {/if}

  <div
    bind:this={chartContainer}
    class="w-full h-full touch-pan-y"
    on:pointerdown={onPointerDown}
    on:pointermove={onChartPointerMove}
    on:pointerleave={onChartPointerLeave}
    on:pointerup={onPointerUp}
    on:pointercancel={onPointerUp}
    on:keydown={onChartKeyDown}
    on:blur={onChartBlur}
    role="group"
    tabindex="0"
    aria-label={chartLabel}
  ></div>

  {#if effectiveError}
    <div
      class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-surface-card/90 px-4 text-center"
      role="alert"
    >
      <p class="type-body text-fg">{effectiveError}</p>
      {#if onRetry}
        <button class="btn btn-sm" type="button" on:click={onRetry}>
          {common_chart_retry()}
        </button>
      {/if}
    </div>
  {:else if !isLoading && currentBars.length === 0}
    <div
      class="absolute inset-0 z-10 flex items-center justify-center pointer-events-none text-fg-subtle"
      role="status"
    >
      {common_chart_empty()}
    </div>
  {/if}

  {#if hoverSummary && tooltipVisible && !isSelecting && !effectiveError}
    <div
      bind:this={hoverTooltip}
      class="absolute z-10 max-w-[calc(100%_-_1rem)] pointer-events-none rounded-control border border-line bg-surface-card/95 px-3 py-2 shadow-sm backdrop-blur-sm"
      style="left:{tooltipX}px;top:{tooltipY}px"
      aria-hidden="true"
    >
      <div class="type-meta text-fg-subtle">
        {hoverDateTime.date} · {hoverDateTime.time}
      </div>
      <div class="mt-1 flex items-baseline gap-3">
        <span class="type-data-em text-fg">
          {common_chart_price()}: {hoverSummary.price.toFixed(2)}
        </span>
        {#if hoverSummary.absoluteChange !== null}
          <span
            class={hoverSummary.absoluteChange >= 0 ? "text-up" : "text-down"}
          >
            {common_chart_change()}:
            {hoverSummary.absoluteChange >= 0 ? "+" : ""}{hoverSummary.absoluteChange.toFixed(2)}
            {#if hoverSummary.percentChange !== null}
              ({hoverSummary.percentChange >= 0 ? "+" : ""}{hoverSummary.percentChange.toFixed(2)}%)
            {/if}
          </span>
        {/if}
      </div>
    </div>
    <span class="sr-only" aria-live="polite">
      {hoverDateTime.date}, {hoverDateTime.time}. {common_chart_price()}
      {hoverSummary.price.toFixed(2)}.
      {#if hoverSummary.absoluteChange !== null}
        {common_chart_change()} {hoverSummary.absoluteChange.toFixed(2)}.
      {/if}
    </span>
  {/if}

  {#if isSelecting && selectionRect && selectionStart && selectionEnd}
    <div class="absolute inset-0 pointer-events-none z-10">
      <div
        class="absolute"
        style="left:{selectionRect.x}px;top:0;width:{selectionRect.width}px;height:{selectionRect.height}px;background-color:{hexToRgba(
          selectionColor,
          $mode === 'light' ? 0.12 : 0.16,
        )}"
      ></div>
      <div
        class="absolute w-px"
        style="left:{selectionStart.x}px;top:0;height:{selectionRect.height}px;background:repeating-linear-gradient(to bottom,{$mode ===
        'light'
          ? 'rgba(0,0,0,0.35)'
          : 'rgba(255,255,255,0.35)'} 0px,{$mode === 'light'
          ? 'rgba(0,0,0,0.35)'
          : 'rgba(255,255,255,0.35)'} 3px,transparent 3px,transparent 6px)"
      ></div>
      <div
        class="absolute w-px"
        style="left:{selectionEnd.x}px;top:0;height:{selectionRect.height}px;background:repeating-linear-gradient(to bottom,{$mode ===
        'light'
          ? 'rgba(0,0,0,0.35)'
          : 'rgba(255,255,255,0.35)'} 0px,{$mode === 'light'
          ? 'rgba(0,0,0,0.35)'
          : 'rgba(255,255,255,0.35)'} 3px,transparent 3px,transparent 6px)"
      ></div>
      <div
        class="absolute w-2.5 h-2.5 rounded-full"
        style="left:{selectionStart.x - 5}px;top:{selectionStart.y -
          5}px;background:{$mode === 'light' ? '#000' : '#fff'}"
      ></div>
      <div
        class="absolute w-2.5 h-2.5 rounded-full"
        style="left:{selectionEnd.x - 5}px;top:{selectionEnd.y -
          5}px;background:{$mode === 'light' ? '#000' : '#fff'}"
      ></div>
      <div
        class="absolute bg-black border border-gray-700 rounded-control px-2 py-1.5 text-sm"
        style="left:{(selectionStart.x + selectionEnd.x) /
          2}px;top:20px;transform:translateX(-50%)"
      >
        <div class="whitespace-nowrap" style="color:{selectionColor}">
          {selectionDelta > 0 ? "+" : ""}{selectionDelta.toFixed(2)} ({selectionPercent.toFixed(
            2,
          )}%)
          {selectionDelta > 0 ? "↑" : selectionDelta < 0 ? "↓" : ""}
        </div>
        {#if selectionTimeRange}
          <div class="text-xs text-fg-subtle whitespace-nowrap mt-0.5">
            {selectionTimeRange}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

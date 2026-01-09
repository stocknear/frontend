<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { init, dispose, registerOverlay } from "klinecharts";
  import type { KLineData } from "klinecharts";
  import { DateTime } from "luxon";
  import { mode } from "mode-watcher";
  import { registerCustomIndicators } from "$lib/klinecharts/customIndicators";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import ChevronDown from "lucide-svelte/icons/chevron-down";
  import MousePointer2 from "lucide-svelte/icons/mouse-pointer-2";
  import CrosshairIcon from "lucide-svelte/icons/crosshair";
  import TrendingUp from "lucide-svelte/icons/trending-up";
  import ArrowUpRight from "lucide-svelte/icons/arrow-up-right";
  import SlashIcon from "lucide-svelte/icons/slash";
  import SquareIcon from "lucide-svelte/icons/square";
  import CircleIcon from "lucide-svelte/icons/circle";
  import TypeIcon from "lucide-svelte/icons/type";
  import PencilLine from "lucide-svelte/icons/pencil-line";
  import EraserIcon from "lucide-svelte/icons/eraser";
  import Trash2 from "lucide-svelte/icons/trash-2";
  import ZoomIn from "lucide-svelte/icons/zoom-in";
  import ZoomOut from "lucide-svelte/icons/zoom-out";
  import Settings from "lucide-svelte/icons/settings";
  import ChartCandlestick from "lucide-svelte/icons/chart-candlestick";
  import ChartLine from "lucide-svelte/icons/chart-line";
  import Search from "lucide-svelte/icons/search";
  import X from "lucide-svelte/icons/x";

  export let data;

  const zone = "America/New_York";
  const timeframes = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"];

  let chartContainer: HTMLDivElement | null = null;
  let chart: any = null;
  let hoverBar: KLineData | null = null;
  let currentBars: KLineData[] = [];
  let activeRange = "1D";
  let chartType: "candles" | "line" = "candles";
  let showMA = true;
  let showVolume = true;
  let showRSI = false;
  let showMACD = false;
  let activeTool = "cursor";
  let indicatorSearchTerm = "";
  let indicatorTab: "indicators" | "strategies" | "profiles" | "patterns" =
    "indicators";

  let maId: string | null = null;
  let volumeId: string | null = null;
  let rsiId: string | null = null;
  let macdId: string | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let chartRoot: HTMLElement | null = null;
  let chartMain: HTMLElement | null = null;

  let ticker = "";
  let dailyBars: KLineData[] = [];
  let intradayBars: KLineData[] = [];
  let pricePrecision = 2;
  let priceFormatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: pricePrecision,
    maximumFractionDigits: pricePrecision,
  });
  const volumeFormatter = new Intl.NumberFormat("en-US");
  const tools = [
    { id: "cursor", label: "Cursor", icon: MousePointer2 },
    { id: "crosshair", label: "Crosshair", icon: CrosshairIcon },
    { id: "trend", label: "Trend Line", icon: TrendingUp },
    { id: "ray", label: "Ray", icon: ArrowUpRight },
    { id: "line", label: "Line", icon: SlashIcon },
    { id: "rect", label: "Rectangle", icon: SquareIcon },
    { id: "circle", label: "Circle", icon: CircleIcon },
    { id: "text", label: "Text", icon: TypeIcon },
    { id: "brush", label: "Brush", icon: PencilLine },
    { id: "erase", label: "Eraser", icon: EraserIcon },
  ];

  const indicatorTabs = [
    { id: "indicators", label: "Indicators" },
    { id: "strategies", label: "Strategies" },
    { id: "profiles", label: "Profiles" },
    { id: "patterns", label: "Patterns" },
  ] as const;

  const indicatorItems = [
    {
      id: "ma",
      label: "Moving Average",
      sublabel: "MA 20/50/200",
    },
    {
      id: "volume",
      label: "Volume",
      sublabel: "Volume + MA 5/10/20",
    },
    {
      id: "rsi",
      label: "Relative Strength Index",
      sublabel: "RSI 14",
    },
    {
      id: "macd",
      label: "MACD",
      sublabel: "12/26/9",
    },
  ];
  let filteredIndicators = indicatorItems;

  const toolOverlays: Record<string, string> = {
    trend: "segment",
    ray: "rayLine",
    line: "straightLine",
    rect: "rect",
    circle: "circle",
    brush: "brush",
  };

  let customOverlaysRegistered = false;
  let customIndicatorsRegistered = false;

  const registerCustomOverlays = () => {
    if (customOverlaysRegistered) return;

    registerOverlay({
      name: "rect",
      totalStep: 3,
      needDefaultPointFigure: true,
      needDefaultXAxisFigure: true,
      needDefaultYAxisFigure: true,
      createPointFigures: ({ coordinates }) => {
        if (coordinates.length !== 2) return [];
        const [start, end] = coordinates;
        const x = Math.min(start.x, end.x);
        const y = Math.min(start.y, end.y);
        const width = Math.abs(end.x - start.x);
        const height = Math.abs(end.y - start.y);
        return [
          {
            type: "rect",
            attrs: { x, y, width, height },
          },
        ];
      },
    });

    registerOverlay({
      name: "circle",
      totalStep: 3,
      needDefaultPointFigure: true,
      needDefaultXAxisFigure: true,
      needDefaultYAxisFigure: true,
      createPointFigures: ({ coordinates }) => {
        if (coordinates.length !== 2) return [];
        const [center, edge] = coordinates;
        const dx = edge.x - center.x;
        const dy = edge.y - center.y;
        return [
          {
            type: "circle",
            attrs: { x: center.x, y: center.y, r: Math.hypot(dx, dy) },
          },
        ];
      },
    });

    registerOverlay({
      name: "brush",
      totalStep: 2,
      needDefaultPointFigure: false,
      needDefaultXAxisFigure: false,
      needDefaultYAxisFigure: false,
      performEventMoveForDrawing: ({ points, performPoint }) => {
        if (!points.length) {
          points.push(performPoint);
          return;
        }
        const last = points[points.length - 1];
        if (
          last.timestamp !== performPoint.timestamp ||
          last.value !== performPoint.value
        ) {
          points.push({ ...performPoint });
        }
      },
      createPointFigures: ({ coordinates }) => {
        if (coordinates.length < 2) return [];
        return [
          {
            type: "line",
            attrs: { coordinates },
          },
        ];
      },
    });

    customOverlaysRegistered = true;
  };

  const registerIndicatorEngine = () => {
    if (customIndicatorsRegistered) return;
    registerCustomIndicators();
    customIndicatorsRegistered = true;
  };

  const updateChartDomRefs = () => {
    if (!chart) return;
    chartRoot = chart.getDom() as HTMLElement | null;
    chartMain = chart.getDom("candle_pane", "main") as HTMLElement | null;
  };

  const toNumber = (value: unknown): number | null => {
    const num = typeof value === "number" ? value : Number(value);
    return Number.isFinite(num) ? num : null;
  };

  const handleCrosshairChange = (payload) => {
    hoverBar = payload?.kLineData ?? null;
  };

  function parseDailyTimestamp(value: string): number | null {
    const dt = DateTime.fromISO(value, { zone });
    return dt.isValid ? dt.toMillis() : null;
  }

  function parseIntradayTimestamp(value: string): number | null {
    const dt = DateTime.fromFormat(value, "yyyy-MM-dd HH:mm:ss", { zone });
    return dt.isValid ? dt.toMillis() : null;
  }

  function normalizeDaily(list): KLineData[] {
    return (Array.isArray(list) ? list : [])
      .map((entry) => {
        const time = typeof entry?.time === "string" ? entry.time : null;
        if (!time) return null;
        const timestamp = parseDailyTimestamp(time);
        if (!timestamp) return null;
        const open = toNumber(entry?.open);
        const high = toNumber(entry?.high);
        const low = toNumber(entry?.low);
        const close = toNumber(entry?.close);
        if (open === null || high === null || low === null || close === null) {
          return null;
        }
        return {
          timestamp,
          open,
          high,
          low,
          close,
          volume: toNumber(entry?.volume) ?? 0,
          adjClose: toNumber(entry?.adjClose) ?? null,
        };
      })
      .filter((bar): bar is KLineData => Boolean(bar))
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  function normalizeIntraday(list): KLineData[] {
    return (Array.isArray(list) ? list : [])
      .map((entry) => {
        const time = typeof entry?.time === "string" ? entry.time : null;
        if (!time) return null;
        const timestamp = parseIntradayTimestamp(time);
        if (!timestamp) return null;
        const open = toNumber(entry?.open);
        const high = toNumber(entry?.high);
        const low = toNumber(entry?.low);
        const close = toNumber(entry?.close);
        if (open === null || high === null || low === null || close === null) {
          return null;
        }
        return {
          timestamp,
          open,
          high,
          low,
          close,
          volume: 0,
        };
      })
      .filter((bar): bar is KLineData => Boolean(bar))
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  function computePricePrecision(bars: KLineData[]): number {
    let precision = 2;
    for (const bar of bars) {
      for (const key of ["open", "high", "low", "close"]) {
        const value = bar[key] as number;
        if (!Number.isFinite(value)) continue;
        const text = value.toString();
        const dotIndex = text.indexOf(".");
        const decimals = dotIndex === -1 ? 0 : text.length - dotIndex - 1;
        precision = Math.max(precision, Math.min(decimals, 6));
      }
    }
    return precision;
  }

  function getRangeBars(range: string) {
    if (range === "1D") {
      if (intradayBars.length) {
        return { bars: intradayBars, period: { type: "minute", span: 1 } };
      }
      return { bars: dailyBars.slice(-1), period: { type: "day", span: 1 } };
    }

    if (!dailyBars.length) {
      return { bars: [], period: { type: "day", span: 1 } };
    }

    if (range === "5D") {
      return { bars: dailyBars.slice(-5), period: { type: "day", span: 1 } };
    }

    const end = DateTime.fromMillis(dailyBars[dailyBars.length - 1].timestamp, {
      zone,
    });

    let threshold = end;
    switch (range) {
      case "1M":
        threshold = end.minus({ months: 1 });
        break;
      case "6M":
        threshold = end.minus({ months: 6 });
        break;
      case "YTD":
        threshold = end.startOf("year");
        break;
      case "1Y":
        threshold = end.minus({ years: 1 });
        break;
      case "5Y":
        threshold = end.minus({ years: 5 });
        break;
      case "MAX":
        threshold = DateTime.fromMillis(dailyBars[0].timestamp, { zone });
        break;
      default:
        threshold = DateTime.fromMillis(dailyBars[0].timestamp, { zone });
    }

    const thresholdMs = threshold.toMillis();
    return {
      bars: dailyBars.filter((bar) => bar.timestamp >= thresholdMs),
      period: { type: "day", span: 1 },
    };
  }

  function applyRange(range: string) {
    if (!chart) return;
    const { bars, period } = getRangeBars(range);
    currentBars = bars;
    hoverBar = null;
    chart.setSymbol({
      ticker,
      pricePrecision,
      volumePrecision: 0,
    });
    chart.setPeriod(period);
    chart.setDataLoader({
      getBars: ({ type, callback }) => {
        if (type !== "init") {
          callback([], { backward: false, forward: false });
          return;
        }
        callback(bars, { backward: false, forward: false });
      },
    });
    chart.scrollToRealTime();
  }

  function syncIndicators() {
    if (!chart) return;

    if (showMA && !maId) {
      maId = chart.createIndicator(
        { name: "SN_MA", calcParams: [20, 50, 200] },
        true,
        { id: "candle_pane" },
      );
    }
    if (!showMA && maId) {
      chart.removeIndicator({ id: maId });
      maId = null;
    }

    if (showVolume && !volumeId) {
      volumeId = chart.createIndicator("SN_VOL", false, {
        id: "sn_vol_pane",
        height: 120,
      });
    }
    if (!showVolume && volumeId) {
      chart.removeIndicator({ id: volumeId });
      volumeId = null;
    }

    if (showRSI && !rsiId) {
      rsiId = chart.createIndicator("SN_RSI", false, {
        id: "sn_rsi_pane",
        height: 120,
      });
    }
    if (!showRSI && rsiId) {
      chart.removeIndicator({ id: rsiId });
      rsiId = null;
    }

    if (showMACD && !macdId) {
      macdId = chart.createIndicator("SN_MACD", false, {
        id: "sn_macd_pane",
        height: 140,
      });
    }
    if (!showMACD && macdId) {
      chart.removeIndicator({ id: macdId });
      macdId = null;
    }
  }

  function applyTheme(_theme: string) {
    if (!chart) return;
    const isDark = true;
    const gridColor = "#1f2128";
    const axisText = "#9aa0a6";
    const upColor = "#22ab94";
    const downColor = "#f23645";
    const crosshairColor = "#3a3f4b";

    chart.setStyles({
      grid: {
        show: true,
        horizontal: {
          show: true,
          style: "solid",
          size: 1,
          color: gridColor,
          dashedValue: [2, 2],
        },
        vertical: {
          show: true,
          style: "solid",
          size: 1,
          color: gridColor,
          dashedValue: [2, 2],
        },
      },
      candle: {
        bar: {
          compareRule: "current_open",
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
      },
      xAxis: {
        axisLine: { show: true, color: gridColor, size: 1 },
        tickLine: { show: true, color: gridColor, size: 1, length: 3 },
        tickText: { show: true, color: axisText },
      },
      yAxis: {
        axisLine: { show: true, color: gridColor, size: 1 },
        tickLine: { show: true, color: gridColor, size: 1, length: 3 },
        tickText: { show: true, color: axisText },
      },
      crosshair: {
        show: true,
        horizontal: {
          line: {
            show: true,
            style: "dashed",
            size: 1,
            color: crosshairColor,
            dashedValue: [4, 4],
          },
        },
        vertical: {
          line: {
            show: true,
            style: "dashed",
            size: 1,
            color: crosshairColor,
            dashedValue: [4, 4],
          },
        },
      },
      separator: {
        size: 1,
        color: gridColor,
        fill: true,
        activeBackgroundColor: "#0f1117",
      },
    });
  }

  function applyChartType(type: "candles" | "line") {
    if (!chart) return;
    if (type === "line") {
      chart.setStyles({
        candle: {
          type: "area",
          area: {
            lineColor: "#3b82f6",
            lineSize: 2,
            smooth: true,
            value: "close",
            backgroundColor: [
              {
                offset: 0,
                color: "rgba(59, 130, 246, 0.25)",
              },
              {
                offset: 1,
                color: "rgba(59, 130, 246, 0)",
              },
            ],
          },
        },
      });
      return;
    }
    chart.setStyles({
      candle: {
        type: "candle_solid",
      },
    });
  }

  function setRange(range: string) {
    activeRange = range;
    if (chart) {
      applyRange(range);
    }
  }

  function setChartType(type: "candles" | "line") {
    chartType = type;
    if (chart) {
      applyChartType(type);
    }
  }

  function toggleIndicator(name: "ma" | "volume" | "rsi" | "macd") {
    if (name === "ma") showMA = !showMA;
    if (name === "volume") showVolume = !showVolume;
    if (name === "rsi") showRSI = !showRSI;
    if (name === "macd") showMACD = !showMACD;
    if (chart) {
      syncIndicators();
    }
  }

  function toggleIndicatorById(id: string) {
    if (id === "ma" || id === "volume" || id === "rsi" || id === "macd") {
      toggleIndicator(id);
    }
  }

  function isIndicatorEnabled(id: string) {
    if (id === "ma") return showMA;
    if (id === "volume") return showVolume;
    if (id === "rsi") return showRSI;
    if (id === "macd") return showMACD;
    return false;
  }

  function closeIndicatorModal() {
    indicatorSearchTerm = "";
  }

  function openIndicatorModal() {
    indicatorTab = "indicators";
    indicatorSearchTerm = "";
  }

  function zoomChart(scale: number) {
    if (!chart) return;
    chart.zoomAtCoordinate(scale);
  }

  function resetView() {
    if (!chart) return;
    applyRange(activeRange);
  }

  function activateTool(toolId: string) {
    activeTool = toolId;
    if (!chart) return;

    if (chartMain) {
      chartMain.style.cursor = toolId === "crosshair" ? "crosshair" : "default";
    }

    if (toolId === "cursor") {
      chart.setStyles({ crosshair: { show: false } });
      return;
    }

    if (toolId === "crosshair") {
      chart.setStyles({ crosshair: { show: true } });
      return;
    }

    if (toolId === "erase") {
      chart.removeOverlay();
      activeTool = "cursor";
      if (chartMain) {
        chartMain.style.cursor = "default";
      }
      return;
    }

    if (toolId === "text") {
      const text = window.prompt("Annotation text") ?? "";
      chart.createOverlay({ name: "simpleAnnotation", extendData: text });
      return;
    }

    const overlayName = toolOverlays[toolId];
    if (overlayName) {
      chart.createOverlay({ name: overlayName });
    }
  }

  function formatPrice(value: number | null) {
    if (value === null || !Number.isFinite(value)) return "--";
    return priceFormatter.format(value);
  }

  function formatVolume(value: number | null | undefined) {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      return "--";
    }
    return volumeFormatter.format(value);
  }

  function formatPercent(value: number | null) {
    if (value === null || !Number.isFinite(value)) return "--";
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  }

  function formatTimestamp(bar: KLineData | null) {
    if (!bar) return "--";
    const dt = DateTime.fromMillis(bar.timestamp, { zone });
    if (activeRange === "1D") {
      return dt.toFormat("MMM dd, HH:mm");
    }
    if (activeRange === "5D" || activeRange === "1M") {
      return dt.toFormat("MMM dd");
    }
    return dt.toFormat("MMM dd, yyyy");
  }

  onMount(() => {
    if (!chartContainer) return;
    registerCustomOverlays();
    registerIndicatorEngine();
    chart = init(chartContainer, {
      timezone: zone,
    });
    if (!chart) return;

    updateChartDomRefs();
    if (!chartRoot) {
      chartRoot = chartContainer;
    }

    chart.setOffsetRightDistance(12);
    chart.subscribeAction("onCrosshairChange", handleCrosshairChange);

    resizeObserver = new ResizeObserver(() => {
      chart?.resize();
    });
    resizeObserver.observe(chartRoot);
  });

  onDestroy(() => {
    if (chart) {
      chart.unsubscribeAction("onCrosshairChange", handleCrosshairChange);
      dispose(chart);
    }
    chart = null;
    chartRoot = null;
    chartMain = null;
    resizeObserver?.disconnect();
    resizeObserver = null;
  });

  $: {
    ticker = data?.ticker ?? "";
    dailyBars = normalizeDaily(data?.historical ?? []);
    intradayBars = normalizeIntraday(data?.intraday ?? []);
  }

  $: {
    pricePrecision = computePricePrecision([...dailyBars, ...intradayBars]);
    priceFormatter = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: pricePrecision,
      maximumFractionDigits: pricePrecision,
    });
  }

  $: if (chart) {
    ticker;
    dailyBars;
    intradayBars;
    applyRange(activeRange);
  }

  $: if (chart) {
    applyTheme($mode);
    applyChartType(chartType);
  }

  $: if (chart) {
    syncIndicators();
  }

  $: lastBar = currentBars[currentBars.length - 1] ?? null;
  $: displayBar = hoverBar ?? lastBar;
  $: previousClose =
    dailyBars.length > 1 ? dailyBars[dailyBars.length - 2]?.close : null;
  $: lastClose = displayBar?.close ?? null;
  $: change =
    lastClose !== null && previousClose !== null
      ? lastClose - previousClose
      : null;
  $: changePercent =
    change !== null && previousClose ? (change / previousClose) * 100 : null;

  $: changeClass =
    change !== null && change < 0 ? "text-[#f23645]" : "text-[#22ab94]";

  $: filteredIndicators = indicatorItems.filter((item) => {
    if (!indicatorSearchTerm.trim()) return true;
    return item.label
      .toLowerCase()
      .includes(indicatorSearchTerm.trim().toLowerCase());
  });
</script>

<svelte:head>
  <title>{ticker} Chart | Stocknear</title>
</svelte:head>

<main class="h-[calc(100vh-56px)] w-full bg-[#0b0b0b] text-neutral-200">
  <div class="flex h-full w-full flex-col">
    <div
      class="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 bg-[#0f0f0f] px-3 py-1.5 text-xs"
    >
      <div class="flex items-center gap-3">
        <button
          class="flex items-center gap-2 rounded-full border border-gray-300 px-2 py-1 text-sm font-semibold text-neutral-200 transition hover:border-neutral-700 hover:bg-neutral-800 dark:border-zinc-700"
        >
          <img
            src={ticker?.length > 0
              ? `https://financialmodelingprep.com/image-stock/${ticker}.png`
              : "/pwa-192x192.png"}
            alt={`${ticker || "Stocknear"} logo`}
            class="shrink-0 w-4 h-4 rounded-full"
          />

          {ticker}
        </button>
        <div class="flex items-baseline gap-2">
          <div class="text-sm font-semibold text-neutral-100">
            {formatPrice(lastClose)}
          </div>
          <div class={`text-sm font-medium ${changeClass}`}>
            {formatPrice(change)} ({formatPercent(changePercent)})
          </div>
        </div>
      </div>

      <div class="flex flex-1 items-center justify-center gap-2">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild let:builder>
            <Button
              builders={[builder]}
              class="min-w-[64px] h-7 transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-zinc-200 bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 py-1 rounded-full truncate text-sm font-semibold"
            >
              <span class="truncate">{activeRange}</span>
              <ChevronDown class="h-3 w-3" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            side="bottom"
            align="start"
            sideOffset={10}
            class="w-28 h-fit max-h-72 overflow-y-auto scroller rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 shadow-none"
          >
            <DropdownMenu.Group>
              {#each timeframes as frame}
                <DropdownMenu.Item
                  class={`text-sm cursor-pointer ${
                    activeRange === frame
                      ? "text-gray-900 dark:text-white font-semibold"
                      : "text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400"
                  }`}
                  on:click={() => setRange(frame)}
                >
                  {frame}
                </DropdownMenu.Item>
              {/each}
            </DropdownMenu.Group>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
        <div
          class="inline-flex items-center overflow-hidden rounded-md border border-neutral-800"
        >
          <button
            class={`flex h-7 w-8 items-center justify-center transition ${
              chartType === "candles"
                ? "bg-neutral-200 text-neutral-900"
                : "text-neutral-300 hover:bg-neutral-800"
            }`}
            on:click={() => setChartType("candles")}
            aria-label="Candles"
          >
            <ChartCandlestick class="h-4 w-4" />
          </button>
          <button
            class={`flex h-7 w-8 items-center justify-center transition ${
              chartType === "line"
                ? "bg-neutral-200 text-neutral-900"
                : "text-neutral-300 hover:bg-neutral-800"
            }`}
            on:click={() => setChartType("line")}
            aria-label="Line"
          >
            <ChartLine class="h-4 w-4" />
          </button>
        </div>

        <label
          for="indicatorModal"
          on:click={openIndicatorModal}
          class="cursor-pointer flex flex-row items-center rounded-full border border-gray-300 dark:border-zinc-700 px-2 py-1 text-sm font-semibold text-neutral-200 transition hover:border-neutral-700 hover:bg-neutral-800"
          ><span role="img" class="icon-GwQQdU8S" aria-hidden="true"
            ><svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 28 28"
              class="size-5 inline-block"
              fill="none"
              ><path
                stroke="currentColor"
                d="M6 12l4.8-4.8a1 1 0 0 1 1.4 0l2.7 2.7a1 1 0 0 0 1.3.1L23 5"
              ></path><path
                fill="currentColor"
                fill-rule="evenodd"
                d="M19 12a1 1 0 0 0-1 1v4h-3v-1a1 1 0 0 0-1-1h-3a1 1 0 0 0-1 1v2H7a1 1 0 0 0-1 1v4h17V13a1 1 0 0 0-1-1h-3zm0 10h3v-9h-3v9zm-1 0v-4h-3v4h3zm-4-4.5V22h-3v-6h3v1.5zM10 22v-3H7v3h3z"
              ></path></svg
            ></span
          >
          Indicators</label
        >
      </div>

      <div class="flex items-center gap-2">
        <button
          class="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-800 text-neutral-300 transition hover:border-neutral-700 hover:bg-neutral-800"
          on:click={() => zoomChart(1.2)}
          aria-label="Zoom in"
        >
          <ZoomIn class="h-4 w-4" />
        </button>
        <button
          class="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-800 text-neutral-300 transition hover:border-neutral-700 hover:bg-neutral-800"
          on:click={() => zoomChart(0.9)}
          aria-label="Zoom out"
        >
          <ZoomOut class="h-4 w-4" />
        </button>
        <button
          class="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-800 text-neutral-300 transition hover:border-neutral-700 hover:bg-neutral-800"
          on:click={resetView}
          aria-label="Reset view"
        >
          <Trash2 class="h-4 w-4" />
        </button>
        <button
          class="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-800 text-neutral-300 transition hover:border-neutral-700 hover:bg-neutral-800"
          aria-label="Settings"
        >
          <Settings class="h-4 w-4" />
        </button>
      </div>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <div
        class="flex h-full w-12 flex-col items-center gap-2 border-r border-neutral-800 bg-[#0f0f0f] py-3"
      >
        {#each tools as tool}
          <button
            class={`flex h-8 w-8 items-center justify-center rounded-md border text-neutral-300 transition ${
              activeTool === tool.id
                ? "border-neutral-200 bg-neutral-200 text-neutral-900"
                : "border-transparent hover:border-neutral-700 hover:bg-neutral-800"
            }`}
            on:click={() => activateTool(tool.id)}
            aria-label={tool.label}
          >
            <svelte:component this={tool.icon} class="h-4 w-4" />
          </button>
        {/each}
        <div class="mt-auto flex flex-col items-center gap-2 pb-3">
          <button
            class="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-800 text-neutral-300 transition hover:border-neutral-700 hover:bg-neutral-800"
            on:click={() => zoomChart(1.2)}
            aria-label="Zoom in"
          >
            <ZoomIn class="h-4 w-4" />
          </button>
          <button
            class="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-800 text-neutral-300 transition hover:border-neutral-700 hover:bg-neutral-800"
            on:click={() => zoomChart(0.9)}
            aria-label="Zoom out"
          >
            <ZoomOut class="h-4 w-4" />
          </button>
        </div>
      </div>

      <div class="relative flex-1 bg-[#0b0b0b]">
        <div class="absolute inset-0" bind:this={chartContainer}></div>

        {#if !currentBars.length}
          <div
            class="absolute inset-0 flex items-center justify-center text-sm text-neutral-500"
          >
            No chart data available.
          </div>
        {/if}
      </div>
    </div>

    <div
      class="flex items-center justify-between border-t border-neutral-800 bg-[#0f0f0f] px-3 py-1 text-sm text-neutral-500"
    >
      <div class="flex flex-wrap items-center gap-1">
        {#each timeframes as frame}
          <button
            class={`rounded-full border px-2 py-1 text-sm font-semibold transition ${
              activeRange === frame
                ? "border-neutral-200 bg-neutral-200 text-neutral-900"
                : "border-gray-300 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-800 hover:text-neutral-100 dark:border-zinc-700"
            }`}
            on:click={() => setRange(frame)}
          >
            {frame}
          </button>
        {/each}
      </div>
      <span>{currentBars.length} bars | {zone}</span>
    </div>
  </div>
</main>

<input type="checkbox" id="indicatorModal" class="modal-toggle" />

<dialog id="indicatorModal" class="modal p-2 sm:p-0 text-neutral-200">
  <label
    for="indicatorModal"
    class="cursor-pointer modal-backdrop bg-black/60"
    on:click={closeIndicatorModal}
  ></label>
  <div
    class="modal-box relative w-full max-w-5xl overflow-hidden rounded-2xl border border-neutral-800 bg-[#1b1b1b] p-0 shadow-none"
  >
    <div
      class="flex items-center justify-between border-b border-neutral-800 px-6 py-4"
    >
      <div class="text-base font-semibold text-neutral-100">
        Indicators, metrics, and strategies
      </div>
      <label
        for="indicatorModal"
        class="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-800 text-neutral-400 transition hover:border-neutral-700 hover:bg-neutral-800"
        on:click={closeIndicatorModal}
        aria-label="Close indicators modal"
      >
        <X class="h-4 w-4" />
      </label>
    </div>

    <div class="px-6 pb-6 pt-4">
      <div class="relative">
        <Search
          class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
        />
        <input
          type="text"
          placeholder="Search"
          class="w-full rounded-xl border border-neutral-800 bg-[#151515] py-2.5 pl-9 pr-9 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-0"
          bind:value={indicatorSearchTerm}
        />
        {#if indicatorSearchTerm.length > 0}
          <button
            class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 transition hover:text-neutral-200"
            on:click={() => (indicatorSearchTerm = "")}
            aria-label="Clear search"
          >
            <X class="h-3.5 w-3.5" />
          </button>
        {/if}
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-2">
        {#each indicatorTabs as tab}
          <button
            class={`rounded-full border px-3 py-1 text-sm font-semibold transition ${
              indicatorTab === tab.id
                ? "border-neutral-200 bg-neutral-200 text-neutral-900"
                : "border-gray-300 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-800 dark:border-zinc-700"
            }`}
            on:click={() => (indicatorTab = tab.id)}
          >
            {tab.label}
          </button>
        {/each}
      </div>

      <div class="mt-5">
        <div class="mb-3 text-sm uppercase tracking-wide text-neutral-500">
          Technical indicators
        </div>
        {#if indicatorTab !== "indicators"}
          <div
            class="rounded-lg border border-neutral-800 p-4 text-sm text-neutral-500"
          >
            This section is coming soon.
          </div>
        {:else}
          <div class="max-h-[420px] space-y-2 overflow-y-auto pr-2">
            {#each filteredIndicators as indicator}
              <div
                class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-neutral-200 transition hover:bg-neutral-800/70"
              >
                <div>
                  <div class="font-medium">{indicator.label}</div>
                  <div class="text-sm text-neutral-500">
                    {indicator.sublabel}
                  </div>
                </div>
                <label class="inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    class="sr-only peer"
                    checked={isIndicatorEnabled(indicator.id)}
                    on:change={() => toggleIndicatorById(indicator.id)}
                  />
                  <div
                    class={`relative h-6 w-11 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-700 after:bg-white after:transition-all ${
                      isIndicatorEnabled(indicator.id)
                        ? "bg-emerald-500"
                        : "bg-neutral-800"
                    }`}
                  ></div>
                </label>
              </div>
            {/each}
            {#if filteredIndicators.length === 0}
              <div
                class="rounded-lg border border-neutral-800 p-4 text-sm text-neutral-500"
              >
                No indicators match your search.
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
</dialog>

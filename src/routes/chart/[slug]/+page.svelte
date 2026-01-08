<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { init, dispose } from "klinecharts";
  import type { KLineData } from "klinecharts";
  import { DateTime } from "luxon";
  import { mode } from "mode-watcher";
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
  let showIndicatorMenu = false;
  let activeTool = "cursor";

  let maId: string | null = null;
  let volumeId: string | null = null;
  let rsiId: string | null = null;
  let macdId: string | null = null;
  let resizeObserver: ResizeObserver | null = null;

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
        { name: "MA", calcParams: [20, 50, 200] },
        true,
        { id: "candle_pane" },
      );
    }
    if (!showMA && maId) {
      chart.removeIndicator({ id: maId });
      maId = null;
    }

    if (showVolume && !volumeId) {
      volumeId = chart.createIndicator("VOL", false, { height: 120 });
    }
    if (!showVolume && volumeId) {
      chart.removeIndicator({ id: volumeId });
      volumeId = null;
    }

    if (showRSI && !rsiId) {
      rsiId = chart.createIndicator("RSI", false, { height: 120 });
    }
    if (!showRSI && rsiId) {
      chart.removeIndicator({ id: rsiId });
      rsiId = null;
    }

    if (showMACD && !macdId) {
      macdId = chart.createIndicator("MACD", false, { height: 140 });
    }
    if (!showMACD && macdId) {
      chart.removeIndicator({ id: macdId });
      macdId = null;
    }
  }

  function applyTheme(theme: string) {
    if (!chart) return;
    const isDark = theme === "dark";
    const gridColor = isDark ? "#1f2937" : "#e2e8f0";
    const axisText = isDark ? "#9ca3af" : "#64748b";
    const upColor = isDark ? "#22c55e" : "#16a34a";
    const downColor = isDark ? "#ef4444" : "#dc2626";
    const crosshairColor = isDark ? "#475569" : "#94a3b8";

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
        activeBackgroundColor: isDark ? "#0f172a" : "#f8fafc",
      },
    });
  }

  function applyChartType(type: "candles" | "line") {
    if (!chart) return;
    const isDark = $mode === "dark";
    if (type === "line") {
      chart.setStyles({
        candle: {
          type: "area",
          area: {
            lineColor: isDark ? "#60a5fa" : "#2563eb",
            lineSize: 2,
            smooth: true,
            value: "close",
            backgroundColor: [
              {
                offset: 0,
                color: isDark
                  ? "rgba(96, 165, 250, 0.25)"
                  : "rgba(37, 99, 235, 0.2)",
              },
              {
                offset: 1,
                color: isDark
                  ? "rgba(96, 165, 250, 0)"
                  : "rgba(37, 99, 235, 0)",
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

  function zoomChart(scale: number) {
    if (!chart) return;
    chart.zoomAtCoordinate(scale);
  }

  function resetView() {
    if (!chart) return;
    applyRange(activeRange);
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
    chart = init(chartContainer, {
      timezone: zone,
    });
    if (!chart) return;

    chart.setOffsetRightDistance(12);
    chart.subscribeAction("onCrosshairChange", handleCrosshairChange);

    resizeObserver = new ResizeObserver(() => {
      chart?.resize();
    });
    resizeObserver.observe(chartContainer);
  });

  onDestroy(() => {
    if (chart) {
      chart.unsubscribeAction("onCrosshairChange", handleCrosshairChange);
      dispose(chart);
    }
    chart = null;
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
    change !== null && change < 0
      ? "text-red-600 dark:text-red-400"
      : "text-emerald-600 dark:text-emerald-400";
</script>

<svelte:head>
  <title>{ticker} Chart | Stocknear</title>
</svelte:head>

<main class="h-screen w-full bg-slate-50 dark:bg-zinc-950">
  <div class="flex h-full w-full flex-col">
    <div
      class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div class="flex items-center gap-3">
        <div
          class="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-300"
        >
          {ticker}
        </div>
        <div class="flex items-baseline gap-2">
          <div class="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {formatPrice(lastClose)}
          </div>
          <div class={`text-xs font-medium ${changeClass}`}>
            {formatPrice(change)} ({formatPercent(changePercent)})
          </div>
        </div>
      </div>

      <div class="hidden items-center gap-3 text-xs text-slate-500 dark:text-slate-400 lg:flex">
        <span>{formatTimestamp(displayBar)}</span>
        <span>O {formatPrice(displayBar?.open ?? null)}</span>
        <span>H {formatPrice(displayBar?.high ?? null)}</span>
        <span>L {formatPrice(displayBar?.low ?? null)}</span>
        <span>C {formatPrice(displayBar?.close ?? null)}</span>
        <span>V {formatVolume(displayBar?.volume)}</span>
      </div>

      <div class="flex items-center gap-2">
        <button
          class="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-zinc-800 dark:text-slate-300 dark:hover:bg-zinc-900"
          on:click={() => zoomChart(1.2)}
          aria-label="Zoom in"
        >
          <ZoomIn class="h-4 w-4" />
        </button>
        <button
          class="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-zinc-800 dark:text-slate-300 dark:hover:bg-zinc-900"
          on:click={() => zoomChart(0.9)}
          aria-label="Zoom out"
        >
          <ZoomOut class="h-4 w-4" />
        </button>
        <button
          class="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-zinc-800 dark:text-slate-300 dark:hover:bg-zinc-900"
          on:click={resetView}
          aria-label="Reset view"
        >
          <Trash2 class="h-4 w-4" />
        </button>
        <button
          class="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-zinc-800 dark:text-slate-300 dark:hover:bg-zinc-900"
          aria-label="Settings"
        >
          <Settings class="h-4 w-4" />
        </button>
      </div>
    </div>

    <div
      class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2 text-xs text-slate-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-300"
    >
      <div class="flex flex-wrap items-center gap-1">
        {#each timeframes as frame}
          <button
            class={`rounded-md px-2 py-1 text-xs font-semibold transition ${
              activeRange === frame
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-zinc-900"
            }`}
            on:click={() => (activeRange = frame)}
          >
            {frame}
          </button>
        {/each}
      </div>

      <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 lg:hidden">
        <span>{formatTimestamp(displayBar)}</span>
        <span>O {formatPrice(displayBar?.open ?? null)}</span>
        <span>H {formatPrice(displayBar?.high ?? null)}</span>
        <span>L {formatPrice(displayBar?.low ?? null)}</span>
        <span>C {formatPrice(displayBar?.close ?? null)}</span>
        <span>V {formatVolume(displayBar?.volume)}</span>
      </div>

      <div class="relative flex items-center gap-2">
        <button
          class="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-zinc-800 dark:text-slate-300 dark:hover:bg-zinc-900"
          on:click={() => (showIndicatorMenu = !showIndicatorMenu)}
        >
          Indicators
          <ChevronDown class="h-3.5 w-3.5" />
        </button>
        {#if showIndicatorMenu}
          <div
            class="absolute right-0 top-full z-30 mt-2 w-48 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 shadow-lg dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-200"
          >
            <button
              class="flex w-full items-center justify-between rounded-md px-2 py-1 transition hover:bg-slate-100 dark:hover:bg-zinc-900"
              on:click={() => (showMA = !showMA)}
            >
              <span>MA 20/50/200</span>
              {#if showMA}<span>On</span>{:else}<span>Off</span>{/if}
            </button>
            <button
              class="flex w-full items-center justify-between rounded-md px-2 py-1 transition hover:bg-slate-100 dark:hover:bg-zinc-900"
              on:click={() => (showVolume = !showVolume)}
            >
              <span>Volume</span>
              {#if showVolume}<span>On</span>{:else}<span>Off</span>{/if}
            </button>
            <button
              class="flex w-full items-center justify-between rounded-md px-2 py-1 transition hover:bg-slate-100 dark:hover:bg-zinc-900"
              on:click={() => (showRSI = !showRSI)}
            >
              <span>RSI</span>
              {#if showRSI}<span>On</span>{:else}<span>Off</span>{/if}
            </button>
            <button
              class="flex w-full items-center justify-between rounded-md px-2 py-1 transition hover:bg-slate-100 dark:hover:bg-zinc-900"
              on:click={() => (showMACD = !showMACD)}
            >
              <span>MACD</span>
              {#if showMACD}<span>On</span>{:else}<span>Off</span>{/if}
            </button>
          </div>
        {/if}
        <div
          class="inline-flex items-center overflow-hidden rounded-md border border-slate-200 dark:border-zinc-800"
        >
          <button
            class={`flex h-7 w-8 items-center justify-center transition ${
              chartType === "candles"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-zinc-900"
            }`}
            on:click={() => (chartType = "candles")}
            aria-label="Candles"
          >
            <ChartCandlestick class="h-4 w-4" />
          </button>
          <button
            class={`flex h-7 w-8 items-center justify-center transition ${
              chartType === "line"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-zinc-900"
            }`}
            on:click={() => (chartType = "line")}
            aria-label="Line"
          >
            <ChartLine class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <div
        class="flex h-full w-12 flex-col items-center gap-2 border-r border-slate-200 bg-white/95 py-3 dark:border-zinc-800 dark:bg-zinc-950"
      >
        {#each tools as tool}
          <button
            class={`flex h-8 w-8 items-center justify-center rounded-md border text-slate-600 transition dark:text-slate-300 ${
              activeTool === tool.id
                ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                : "border-transparent hover:border-slate-200 hover:bg-slate-100 dark:hover:border-zinc-800 dark:hover:bg-zinc-900"
            }`}
            on:click={() => (activeTool = tool.id)}
            aria-label={tool.label}
          >
            <svelte:component this={tool.icon} class="h-4 w-4" />
          </button>
        {/each}
        <div class="mt-auto flex flex-col items-center gap-2 pb-3">
          <button
            class="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-zinc-800 dark:text-slate-300 dark:hover:bg-zinc-900"
            on:click={() => zoomChart(1.2)}
            aria-label="Zoom in"
          >
            <ZoomIn class="h-4 w-4" />
          </button>
          <button
            class="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-zinc-800 dark:text-slate-300 dark:hover:bg-zinc-900"
            on:click={() => zoomChart(0.9)}
            aria-label="Zoom out"
          >
            <ZoomOut class="h-4 w-4" />
          </button>
        </div>
      </div>

      <div class="relative flex-1 bg-white dark:bg-zinc-950">
        <div class="absolute inset-0" bind:this={chartContainer}></div>
        {#if !currentBars.length}
          <div
            class="absolute inset-0 flex items-center justify-center text-sm text-slate-500"
          >
            No chart data available.
          </div>
        {/if}
      </div>
    </div>

    <div
      class="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-1 text-xs text-slate-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-400"
    >
      <span>{activeRange} | {currentBars.length} bars</span>
      <span>Timezone: {zone}</span>
    </div>
  </div>
</main>

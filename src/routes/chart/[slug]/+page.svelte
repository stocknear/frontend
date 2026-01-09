<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { init, dispose, registerOverlay } from "klinecharts";
  import type { KLineData } from "klinecharts";
  import { DateTime } from "luxon";
  import { mode } from "mode-watcher";
  import { toast } from "svelte-sonner";
  import { registerCustomIndicators } from "$lib/klinecharts/customIndicators";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import Input from "$lib/components/Input.svelte";
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
  import ChartCandlestick from "lucide-svelte/icons/chart-candlestick";
  import ChartLine from "lucide-svelte/icons/chart-line";
  import Timer from "lucide-svelte/icons/timer";

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
  let showEMA = false;
  let showBOLL = false;
  let showVWAP = false;
  let showATR = false;
  let showSTOCH = false;
  let activeTool = "cursor";
  let indicatorSearchTerm = "";

  type ChartRule = { name: string; params?: number[] };

  const indicatorParamDefaults: Record<string, number[]> = {
    ma: [20, 50, 200],
    ema: [9, 21, 50],
    boll: [20, 2],
    vwap: [],
    volume: [5, 10, 20],
    rsi: [14],
    macd: [12, 26, 9],
    atr: [14],
    stoch: [14, 3],
  };

  const cloneIndicatorParams = () =>
    Object.fromEntries(
      Object.entries(indicatorParamDefaults).map(([key, value]) => [
        key,
        [...value],
      ]),
    );

  let indicatorParams = cloneIndicatorParams();
  const strategyType = "chart";
  const getStrategyRules = (strategy): ChartRule[] =>
    Array.isArray(strategy?.rules) ? strategy.rules : [];
  let strategyList = data?.getAllStrategies ?? [];
  let selectedStrategy = strategyList?.at(0)?.id ?? "";
  let ruleOfList: ChartRule[] = getStrategyRules(strategyList?.at(0));
  let selectedStrategyTitle = "";

  let maId: string | null = null;
  let volumeId: string | null = null;
  let rsiId: string | null = null;
  let macdId: string | null = null;
  let emaId: string | null = null;
  let bollId: string | null = null;
  let vwapId: string | null = null;
  let atrId: string | null = null;
  let stochId: string | null = null;
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

  const indicatorItems = [
    {
      id: "ma",
      label: "Moving Average",
      sublabel: "MA 20/50/200",
    },
    {
      id: "ema",
      label: "Exponential Moving Average",
      sublabel: "EMA 9/21/50",
    },
    {
      id: "boll",
      label: "Bollinger Bands",
      sublabel: "BOLL 20 / 2 SD",
    },
    {
      id: "vwap",
      label: "VWAP",
      sublabel: "Volume-weighted average price",
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
    {
      id: "atr",
      label: "Average True Range",
      sublabel: "ATR 14",
    },
    {
      id: "stoch",
      label: "Stochastic Oscillator",
      sublabel: "%K 14 / %D 3",
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

  const getIndicatorParams = (key: string) =>
    indicatorParams[key]?.length
      ? indicatorParams[key]
      : (indicatorParamDefaults[key] ?? []);

  function syncIndicators() {
    if (!chart) return;

    if (showMA && !maId) {
      maId = chart.createIndicator(
        { name: "SN_MA", calcParams: getIndicatorParams("ma") },
        true,
        { id: "candle_pane" },
      );
    }
    if (!showMA && maId) {
      chart.removeIndicator({ id: maId });
      maId = null;
    }

    if (showEMA && !emaId) {
      emaId = chart.createIndicator(
        { name: "SN_EMA", calcParams: getIndicatorParams("ema") },
        true,
        { id: "candle_pane" },
      );
    }
    if (!showEMA && emaId) {
      chart.removeIndicator({ id: emaId });
      emaId = null;
    }

    if (showBOLL && !bollId) {
      bollId = chart.createIndicator(
        { name: "SN_BOLL", calcParams: getIndicatorParams("boll") },
        true,
        { id: "candle_pane" },
      );
    }
    if (!showBOLL && bollId) {
      chart.removeIndicator({ id: bollId });
      bollId = null;
    }

    if (showVWAP && !vwapId) {
      vwapId = chart.createIndicator(
        { name: "SN_VWAP", calcParams: getIndicatorParams("vwap") },
        true,
        { id: "candle_pane" },
      );
    }
    if (!showVWAP && vwapId) {
      chart.removeIndicator({ id: vwapId });
      vwapId = null;
    }

    if (showVolume && !volumeId) {
      volumeId = chart.createIndicator(
        { name: "SN_VOL", calcParams: getIndicatorParams("volume") },
        false,
        {
          id: "sn_vol_pane",
          height: 120,
        },
      );
    }
    if (!showVolume && volumeId) {
      chart.removeIndicator({ id: volumeId });
      volumeId = null;
    }

    if (showRSI && !rsiId) {
      rsiId = chart.createIndicator(
        { name: "SN_RSI", calcParams: getIndicatorParams("rsi") },
        false,
        {
          id: "sn_rsi_pane",
          height: 120,
        },
      );
    }
    if (!showRSI && rsiId) {
      chart.removeIndicator({ id: rsiId });
      rsiId = null;
    }

    if (showMACD && !macdId) {
      macdId = chart.createIndicator(
        { name: "SN_MACD", calcParams: getIndicatorParams("macd") },
        false,
        {
          id: "sn_macd_pane",
          height: 140,
        },
      );
    }
    if (!showMACD && macdId) {
      chart.removeIndicator({ id: macdId });
      macdId = null;
    }

    if (showATR && !atrId) {
      atrId = chart.createIndicator(
        { name: "SN_ATR", calcParams: getIndicatorParams("atr") },
        false,
        { id: "sn_atr_pane", height: 120 },
      );
    }
    if (!showATR && atrId) {
      chart.removeIndicator({ id: atrId });
      atrId = null;
    }

    if (showSTOCH && !stochId) {
      stochId = chart.createIndicator(
        { name: "SN_STOCH", calcParams: getIndicatorParams("stoch") },
        false,
        { id: "sn_stoch_pane", height: 120 },
      );
    }
    if (!showSTOCH && stochId) {
      chart.removeIndicator({ id: stochId });
      stochId = null;
    }
  }

  const buildRuleList = (): ChartRule[] =>
    indicatorItems
      .filter((item) => isIndicatorEnabled(item.id))
      .map((item) => ({
        name: item.id,
        params:
          indicatorParams[item.id] ?? indicatorParamDefaults[item.id] ?? [],
      }));

  const applyStrategyRules = (rules: ChartRule[]) => {
    const active = new Set(rules.map((rule) => rule.name));
    showMA = active.has("ma");
    showEMA = active.has("ema");
    showBOLL = active.has("boll");
    showVWAP = active.has("vwap");
    showVolume = active.has("volume");
    showRSI = active.has("rsi");
    showMACD = active.has("macd");
    showATR = active.has("atr");
    showSTOCH = active.has("stoch");

    indicatorParams = cloneIndicatorParams();
    rules.forEach((rule) => {
      if (Array.isArray(rule.params) && rule.params.length > 0) {
        indicatorParams[rule.name] = [...rule.params];
      }
    });

    if (chart) {
      syncIndicators();
    }
    ruleOfList = buildRuleList();
  };

  function applyTheme(_theme: string) {
    if (!chart) return;
    const isDark = _theme === "dark";
    const gridColor = isDark ? "#1d2230" : "#e6e9ef";
    const axisLineColor = isDark ? "#252a38" : "#e1e5ec";
    const axisText = isDark ? "#9aa3b2" : "#6b7280";
    const priceText = isDark ? "#a1a9b8" : "#64748b";
    const upColor = "#22ab94";
    const downColor = "#f23645";
    const crosshairLine = isDark ? "#3a4252" : "#cbd5e1";
    const crosshairText = isDark ? "#e2e8f0" : "#111827";
    const crosshairBg = isDark ? "#0f141d" : "#f8fafc";
    const crosshairBorder = isDark ? "#283042" : "#e2e8f0";
    const tooltipText = isDark ? "#e2e8f0" : "#1f2937";
    const tooltipBg = isDark
      ? "rgba(15, 19, 27, 0.8)"
      : "rgba(248, 250, 252, 0.96)";
    const tooltipBorder = isDark ? "rgba(32, 41, 56, 0.9)" : "#e2e8f0";
    const activePaneBg = isDark ? "#0f1117" : "#f8fafc";

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
        priceMark: {
          high: { color: priceText },
          low: { color: priceText },
        },
        tooltip: {
          rect: {
            color: tooltipBg,
            borderColor: tooltipBorder,
          },
          title: {
            color: tooltipText,
            size: 11,
            weight: 500,
          },
          legend: {
            color: tooltipText,
            size: 11,
            weight: 500,
          },
        },
      },
      indicator: {
        tooltip: {
          title: {
            color: tooltipText,
            size: 11,
            weight: 500,
          },
          legend: {
            color: tooltipText,
            size: 11,
            weight: 500,
          },
        },
      },
      xAxis: {
        axisLine: { show: true, color: axisLineColor, size: 1 },
        tickLine: { show: true, color: axisLineColor, size: 1, length: 3 },
        tickText: {
          show: true,
          color: axisText,
          size: 11,
          weight: 500,
          marginStart: 4,
          marginEnd: 6,
        },
      },
      yAxis: {
        axisLine: { show: true, color: axisLineColor, size: 1 },
        tickLine: { show: true, color: axisLineColor, size: 1, length: 3 },
        tickText: {
          show: true,
          color: axisText,
          size: 11,
          weight: 500,
          marginStart: 4,
          marginEnd: 6,
        },
      },
      crosshair: {
        show: true,
        horizontal: {
          line: {
            show: true,
            style: "dashed",
            size: 1,
            color: crosshairLine,
            dashedValue: [4, 4],
          },
          text: {
            color: crosshairText,
            size: 11,
            weight: 500,
            borderColor: crosshairBorder,
            backgroundColor: crosshairBg,
            borderRadius: 6,
            paddingLeft: 6,
            paddingRight: 6,
            paddingTop: 4,
            paddingBottom: 4,
          },
        },
        vertical: {
          line: {
            show: true,
            style: "dashed",
            size: 1,
            color: crosshairLine,
            dashedValue: [4, 4],
          },
          text: {
            color: crosshairText,
            size: 11,
            weight: 500,
            borderColor: crosshairBorder,
            backgroundColor: crosshairBg,
            borderRadius: 6,
            paddingLeft: 6,
            paddingRight: 6,
            paddingTop: 4,
            paddingBottom: 4,
          },
        },
      },
      separator: {
        size: 1,
        color: axisLineColor,
        fill: true,
        activeBackgroundColor: activePaneBg,
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

  function toggleIndicator(
    name:
      | "ma"
      | "ema"
      | "boll"
      | "vwap"
      | "volume"
      | "rsi"
      | "macd"
      | "atr"
      | "stoch",
  ) {
    if (name === "ma") showMA = !showMA;
    if (name === "volume") showVolume = !showVolume;
    if (name === "rsi") showRSI = !showRSI;
    if (name === "macd") showMACD = !showMACD;
    if (name === "ema") showEMA = !showEMA;
    if (name === "boll") showBOLL = !showBOLL;
    if (name === "vwap") showVWAP = !showVWAP;
    if (name === "atr") showATR = !showATR;
    if (name === "stoch") showSTOCH = !showSTOCH;
    if (chart) {
      syncIndicators();
    }
    ruleOfList = buildRuleList();
  }

  function toggleIndicatorById(id: string) {
    if (
      id === "ma" ||
      id === "ema" ||
      id === "boll" ||
      id === "vwap" ||
      id === "volume" ||
      id === "rsi" ||
      id === "macd" ||
      id === "atr" ||
      id === "stoch"
    ) {
      toggleIndicator(id);
    }
  }

  function isIndicatorEnabled(id: string) {
    if (id === "ma") return showMA;
    if (id === "ema") return showEMA;
    if (id === "boll") return showBOLL;
    if (id === "vwap") return showVWAP;
    if (id === "volume") return showVolume;
    if (id === "rsi") return showRSI;
    if (id === "macd") return showMACD;
    if (id === "atr") return showATR;
    if (id === "stoch") return showSTOCH;
    return false;
  }

  const toastStyle = () =>
    `border-radius: 5px; background: #fff; color: #000; border-color: ${
      $mode === "light" ? "#F9FAFB" : "#4B5563"
    }; font-size: 15px;`;

  const ensureAuth = () => {
    if (data?.user) return true;
    toast.info("Sign in to save chart strategies.", {
      style: toastStyle(),
    });
    return false;
  };

  $: selectedStrategyTitle =
    strategyList?.find((item) => item.id === selectedStrategy)?.title ?? "";

  async function handleSave(showMessage = true) {
    if (!ensureAuth()) return;
    if (!selectedStrategy) {
      toast.info("Create a strategy first.", {
        style: toastStyle(),
      });
      return;
    }

    ruleOfList = buildRuleList();

    const target = strategyList?.find((item) => item.id === selectedStrategy);
    if (target) {
      target.rules = ruleOfList;
    }

    const postData = {
      strategyId: selectedStrategy,
      rules: ruleOfList,
      type: strategyType,
    };

    const savePromise = (async () => {
      const response = await fetch("/api/save-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      return response;
    })();

    if (showMessage) {
      return toast.promise(savePromise, {
        loading: "Saving strategy...",
        success: "Strategy saved!",
        error: "Save failed. Please try again.",
        style: toastStyle(),
      });
    }

    await savePromise;
  }

  async function createStrategy(event) {
    event.preventDefault();
    if (!ensureAuth()) return;

    const formData = new FormData(event.target);
    const titleValue = formData.get("title");
    const title =
      typeof titleValue === "string" && titleValue.trim().length > 0
        ? titleValue.trim()
        : "My Chart Strategy";

    if (title.length > 100) {
      toast.error("Title is too long. Please keep it under 100 characters.", {
        style: toastStyle(),
      });
      return;
    }

    const postData = {
      type: strategyType,
      user: data?.user?.id,
      title,
      rules: buildRuleList(),
    };

    const createPromise = (async () => {
      const response = await fetch("/api/create-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error(`Network error: ${response.status}`);
      }

      const output = await response.json();
      if (!output?.id) {
        throw new Error("Server did not return a new strategy ID");
      }

      const closePopup = document.getElementById("addChartStrategy");
      closePopup?.dispatchEvent(new MouseEvent("click"));

      strategyList = [output, ...(strategyList ?? [])];
      selectedStrategy = output.id;
      ruleOfList = getStrategyRules(output);

      return output;
    })();

    return toast.promise(createPromise, {
      loading: "Creating strategy...",
      success: "Strategy created!",
      error: "Something went wrong. Please try again later!",
      style: toastStyle(),
    });
  }

  async function handleDeleteStrategy() {
    if (!ensureAuth()) return;
    if (!selectedStrategy) return;

    const deletePromise = (async () => {
      const postData = { strategyId: selectedStrategy, type: strategyType };
      const response = await fetch("/api/delete-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error(`Network error: ${response.status}`);
      }

      const output = await response.json();
      if (output !== "success") {
        throw new Error("Server returned failure");
      }

      strategyList =
        strategyList?.filter((item) => item.id !== selectedStrategy) ?? [];
      selectedStrategy = strategyList?.at(0)?.id ?? "";

      if (selectedStrategy) {
        ruleOfList =
          strategyList?.find((item) => item.id === selectedStrategy)?.rules ??
          [];
        applyStrategyRules(ruleOfList);
      } else {
        ruleOfList = buildRuleList();
      }

      return true;
    })();

    return toast.promise(deletePromise, {
      loading: "Deleting strategy...",
      success: "Strategy deleted successfully!",
      error: "Delete failed. Please try again.",
      style: toastStyle(),
    });
  }

  function switchStrategy(item) {
    selectedStrategy = item?.id ?? "";
    ruleOfList = getStrategyRules(item);
    applyStrategyRules(ruleOfList);
  }

  function closeIndicatorModal() {
    indicatorSearchTerm = "";
  }

  function openIndicatorModal() {
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
    if (selectedStrategy) {
      applyStrategyRules(ruleOfList);
    } else {
      ruleOfList = buildRuleList();
    }

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

      <div class="flex flex-1 items-center gap-2">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild let:builder>
            <Button
              builders={[builder]}
              class="min-w-[64px] h-7  transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-zinc-200 bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row  items-center px-2 py-1 rounded-full truncate text-sm font-semibold"
            >
              <Timer class="size-4 inline-block mr-0.5" />
              <span class="truncate">{activeRange}</span>
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
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild let:builder>
            <Button
              builders={[builder]}
              class="min-w-[90px] h-7 transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-zinc-200 bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 py-1 rounded-full truncate text-sm font-semibold"
            >
              <span class="inline-flex items-center gap-1 truncate">
                {#if chartType === "candles"}
                  <ChartCandlestick class="size-4" />
                  Candles
                {:else}
                  <ChartLine class="size-4" />
                  Line
                {/if}
              </span>
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            side="bottom"
            align="start"
            sideOffset={10}
            class="w-36 h-fit max-h-72 overflow-y-auto scroller rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 shadow-none"
          >
            <DropdownMenu.Group>
              <DropdownMenu.Item
                class={`text-sm cursor-pointer ${
                  chartType === "candles"
                    ? "text-gray-900 dark:text-white font-semibold"
                    : "text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400"
                }`}
                on:click={() => setChartType("candles")}
              >
                <span class="inline-flex items-center gap-2">
                  <ChartCandlestick class="h-4 w-4" />
                  Candles
                </span>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class={`text-sm cursor-pointer ${
                  chartType === "line"
                    ? "text-gray-900 dark:text-white font-semibold"
                    : "text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400"
                }`}
                on:click={() => setChartType("line")}
              >
                <span class="inline-flex items-center gap-2">
                  <ChartLine class="h-4 w-4" />
                  Line
                </span>
              </DropdownMenu.Item>
            </DropdownMenu.Group>
          </DropdownMenu.Content>
        </DropdownMenu.Root>

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

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild let:builder>
            <Button
              builders={[builder]}
              class="min-w-[130px] h-7 transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-zinc-200 bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 py-1 rounded-full truncate text-[11px] font-semibold"
            >
              <span class="truncate">
                {selectedStrategyTitle?.length > 0
                  ? selectedStrategyTitle
                  : "TA Strategies"}
              </span>
              <ChevronDown class="h-3 w-3" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            side="bottom"
            align="start"
            sideOffset={10}
            class="w-full max-w-56 h-fit max-h-72 overflow-y-auto scroller rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 shadow-none"
          >
            <DropdownMenu.Label>
              <DropdownMenu.Trigger asChild let:builder>
                <Button
                  builders={[builder]}
                  class="p-0 -mb-2 -mt-2 text-sm inline-flex cursor-pointer items-center justify-center space-x-1 bg-transparent whitespace-nowrap focus:outline-hidden text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                >
                  <label
                    for="addChartStrategy"
                    class="flex flex-row items-center cursor-pointer"
                  >
                    <svg
                      class="h-4 w-4 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      style="max-width:40px"
                      aria-hidden="true"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                    <div class="text-sm text-start">New Strategy</div>
                  </label>
                </Button>
              </DropdownMenu.Trigger>
            </DropdownMenu.Label>
            <DropdownMenu.Separator />
            <DropdownMenu.Group>
              {#if strategyList?.length > 0}
                {#each strategyList as item}
                  <DropdownMenu.Item
                    on:click={() => {
                      switchStrategy(item);
                    }}
                    class="cursor-pointer {item?.id === selectedStrategy
                      ? 'text-violet-600 dark:text-violet-400'
                      : 'text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400'}"
                  >
                    {item?.title?.length > 20
                      ? item?.title?.slice(0, 20) + "..."
                      : item?.title} ({item?.rules?.length ?? 0})
                    <label
                      for="deleteChartStrategy"
                      class="ml-auto inline-flex items-center justify-center cursor-pointer hover:text-rose-600 dark:hover:text-rose-400 transition"
                    >
                      <Trash2 class="h-4 w-4" />
                    </label>
                  </DropdownMenu.Item>
                {/each}
              {:else}
                <DropdownMenu.Item
                  class="text-sm text-gray-500 dark:text-zinc-400"
                >
                  No saved strategies
                </DropdownMenu.Item>
              {/if}
            </DropdownMenu.Group>
          </DropdownMenu.Content>
        </DropdownMenu.Root>

        <button
          class={`flex items-center gap-1 rounded-full border border-gray-300 px-2 py-1 text-[11px] font-semibold text-neutral-200 transition hover:border-neutral-700 hover:bg-neutral-800 dark:border-zinc-700 ${
            data?.user ? "" : "opacity-60"
          }`}
          on:click={() => handleSave(true)}
        >
          Save
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
  </div>
</main>

<input type="checkbox" id="indicatorModal" class="modal-toggle" />

<dialog id="indicatorModal" class="modal p-2 lg:p-0">
  <label
    id="indicatorModal"
    for="indicatorModal"
    on:click={closeIndicatorModal}
    class="cursor-pointer modal-backdrop"
  ></label>
  <div
    class="modal-box relative bg-white dark:bg-zinc-950 z-20 mx-2 min-h-[30vh] h-[800px] rounded-2xl border border-gray-300 dark:border-zinc-700 bp:mx-3 sm:mx-4 w-full max-w-6xl overflow-y-auto shadow-none"
  >
    <div class="relative flex flex-col w-full">
      <div
        class="fixed w-full h-fit sticky -top-6 z-40 bg-white/95 dark:bg-zinc-950/95 pb-6 pt-5 border-gray-300 dark:border-zinc-700 border-b"
      >
        <div class="flex flex-row items-center justify-between mb-2">
          <h2
            class="text-[1rem] sm:text-xl font-semibold text-gray-900 dark:text-white"
          >
            Select technical indicators ({indicatorItems.length} total)
          </h2>
          <label
            for="indicatorModal"
            class="inline-block cursor-pointer absolute right-0 top-3 text-[1.3rem] sm:text-[1.8rem]"
            on:click={closeIndicatorModal}
            aria-label="Close indicators modal"
          >
            <svg
              class="w-6 h-6 sm:w-8 sm:h-8"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              ><path
                fill="currentColor"
                d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
              /></svg
            >
          </label>
        </div>

        <form
          class="w-full h-8"
          on:keydown={(e) => (e?.key === "Enter" ? e.preventDefault() : "")}
        >
          <label for="indicator-search" class="sr-only">Search</label>
          <div class="relative w-full max-w-sm">
            <div
              class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none"
            >
              <svg
                class="w-4 h-4 text-gray-400 dark:text-zinc-400"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                />
              </svg>
            </div>

            <div
              class="absolute inset-y-0 right-0 flex items-center pr-2 {indicatorSearchTerm?.length >
              0
                ? ''
                : 'hidden'}"
            >
              <button
                on:click={() => (indicatorSearchTerm = "")}
                class="cursor-pointer text-gray-400 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
                tabindex="0"
                aria-label="Clear search"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style="max-width:40px"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path></svg
                >
              </button>
            </div>

            <input
              autocomplete="off"
              id="indicator-search"
              class="focus:outline-none placeholder-gray-500 dark:placeholder:text-zinc-400 block w-full p-2 ps-10 text-sm border border-gray-300 dark:border-zinc-700 rounded-full bg-white/80 dark:bg-zinc-950/60"
              placeholder="Search..."
              bind:value={indicatorSearchTerm}
            />
          </div>
        </form>
      </div>

      <div class="">
        <h4
          class="mb-1 font-semibold text-lg mt-5 text-gray-900 dark:text-white"
        >
          Technical indicators
        </h4>
        <div class="flex flex-wrap">
          {#each filteredIndicators as indicator}
            <div
              class="flex w-full items-center space-x-1.5 py-1.5 md:w-1/2 lg:w-1/3 lg:py-1"
            >
              <input
                on:click={() => toggleIndicatorById(indicator.id)}
                id={indicator.id}
                type="checkbox"
                checked={isIndicatorEnabled(indicator.id)}
                class="h-[18px] w-[18px] rounded-sm ring-offset-0 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 lg:h-4 lg:w-4"
              />
              <div class="-mt-0.5">
                <label for={indicator.id} class="cursor-pointer text-[1rem]">
                  {indicator.label}
                </label>
              </div>
            </div>
          {/each}
        </div>
        {#if filteredIndicators.length === 0}
          <div class="mt-5 font-semibold text-[1rem] sm:text-lg">
            Nothing found
          </div>
        {/if}
      </div>
    </div>
  </div>
</dialog>

<input type="checkbox" id="addChartStrategy" class="modal-toggle" />

<dialog id="addChartStrategy" class="modal modal-bottom sm:modal-middle">
  <label for="addChartStrategy" class="cursor-pointer modal-backdrop"></label>

  <div
    class="modal-box w-full p-6 rounded border bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-2xl shadow-none"
  >
    <h1
      class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
    >
      New Chart Strategy
    </h1>

    <form
      on:submit={createStrategy}
      method="POST"
      class="space-y-2 pt-5 pb-10 sm:pb-5"
    >
      <Input
        id="title"
        type="text"
        errors=""
        label="Strategy Name"
        required={true}
      />

      <button
        type="submit"
        class="cursor-pointer mt-2 py-2.5 bg-gray-900 text-white dark:bg-white dark:text-gray-900 duration-100 w-full rounded-full m-auto font-semibold text-md transition hover:bg-gray-800 dark:hover:bg-zinc-200"
      >
        Create Strategy
      </button>
    </form>
  </div>
</dialog>

<input type="checkbox" id="deleteChartStrategy" class="modal-toggle" />

<dialog id="deleteChartStrategy" class="modal modal-bottom sm:modal-middle">
  <label for="deleteChartStrategy" class="cursor-pointer modal-backdrop"
  ></label>

  <div
    class="modal-box w-full p-6 rounded border bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-2xl shadow-none"
  >
    <h3 class="text-lg font-medium mb-2 text-gray-900 dark:text-white">
      Delete Strategy
    </h3>
    <p class="text-sm mb-6 text-gray-800 dark:text-zinc-300">
      Are you sure you want to delete this strategy? This action cannot be
      undone.
    </p>
    <div class="flex justify-end space-x-3">
      <label
        for="deleteChartStrategy"
        class="cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-colors duration-100 border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400"
        tabindex="0">Cancel</label
      ><label
        for="deleteChartStrategy"
        on:click={handleDeleteStrategy}
        class="cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-colors duration-100 flex items-center border border-rose-200/70 dark:border-rose-500/30 bg-rose-50/80 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300"
        tabindex="0"
        ><svg
          stroke="currentColor"
          fill="none"
          stroke-width="2"
          viewBox="0 0 24 24"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-4 h-4 mr-2"
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
          ><polyline points="3 6 5 6 21 6"></polyline><path
            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
          ></path><line x1="10" y1="11" x2="10" y2="17"></line><line
            x1="14"
            y1="11"
            x2="14"
            y2="17"
          ></line></svg
        >Delete Strategy</label
      >
    </div>
  </div>
</dialog>

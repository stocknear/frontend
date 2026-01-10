<script lang="ts">
  import { afterUpdate, onDestroy, onMount } from "svelte";
  import { beforeNavigate } from "$app/navigation";
  import { init, dispose, registerOverlay } from "klinecharts";
  import type { KLineData } from "klinecharts";
  import { DateTime } from "luxon";
  import { mode } from "mode-watcher";
  import { toast } from "svelte-sonner";
  import { registerCustomIndicators } from "$lib/klinecharts/customIndicators";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import Input from "$lib/components/Input.svelte";
  import { isOpen, screenWidth } from "$lib/store";
  import ChevronDown from "lucide-svelte/icons/chevron-down";
  import MousePointer2 from "lucide-svelte/icons/mouse-pointer-2";
  import TrendingUp from "lucide-svelte/icons/trending-up";
  import SlashIcon from "lucide-svelte/icons/slash";
  import SquareIcon from "lucide-svelte/icons/square";
  import CircleIcon from "lucide-svelte/icons/circle";

  import EraserIcon from "lucide-svelte/icons/eraser";
  import Trash2 from "lucide-svelte/icons/trash-2";
  import ZoomIn from "lucide-svelte/icons/zoom-in";
  import ZoomOut from "lucide-svelte/icons/zoom-out";
  import Camera from "lucide-svelte/icons/camera";
  import ArrowRight from "lucide-svelte/icons/arrow-right";
  import ChartCandlestick from "lucide-svelte/icons/chart-candlestick";
  import ChartLine from "lucide-svelte/icons/chart-line";
  import Timer from "lucide-svelte/icons/timer";
  import { groupChartIndicators, abbreviateNumber } from "$lib/utils";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
  export let form;

  const zone = "America/New_York";
  const timeframes = [
    "1min",
    "5min",
    "15min",
    "30min",
    "1hour",
    "1D",
    "1W",
    "1M",
  ];

  // localStorage keys for chart settings (not saved to pocketbase)
  const CHART_SETTINGS_KEY = "chart-settings";
  const CHART_OVERLAYS_KEY = "chart-overlays";

  interface ChartSettings {
    chartType: string;
    activeRange: string;
  }

  const loadChartSettings = (): ChartSettings | null => {
    try {
      const saved = localStorage?.getItem(CHART_SETTINGS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.log("Failed loading chart settings:", e);
    }
    return null;
  };

  const saveChartSettings = (settings: ChartSettings) => {
    try {
      localStorage?.setItem(CHART_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.log("Failed saving chart settings:", e);
    }
  };

  const loadChartOverlays = (): any[] => {
    try {
      const saved = localStorage?.getItem(CHART_OVERLAYS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.log("Failed loading chart overlays:", e);
    }
    return [];
  };

  const saveChartOverlays = (overlays: any[]) => {
    try {
      localStorage?.setItem(CHART_OVERLAYS_KEY, JSON.stringify(overlays));
    } catch (e) {
      console.log("Failed saving chart overlays:", e);
    }
  };

  let minuteBars = [];
  let minuteBarsTicker = "";
  let hasMoreMinuteHistory = false;
  let minuteBarsLoading = false;
  let minuteBarsLastEndDate = "";

  // Earnings marker types and state
  interface EarningsData {
    date: string;
    period: string;
    period_year: number;
    eps: string | number | null;
    eps_est: string | number | null;
    eps_surprise: string | number | null;
    eps_surprise_percent: string | number | null;
    revenue: string | number | null;
    revenue_est: string | number | null;
    revenue_surprise: string | number | null;
    revenue_surprise_percent: string | number | null;
    time?: string; // "bmo" (before market open) or "amc" (after market close)
  }

  interface EarningsMarker {
    earnings: EarningsData;
    timestamp: number;
    x: number;
    visible: boolean;
    isFuture: boolean;
  }

  let historicalEarnings: EarningsData[] = [];
  let nextEarnings: EarningsData | null = null;
  let earningsMarkers: EarningsMarker[] = [];
  let selectedEarnings: EarningsData | null = null;
  let selectedEarningsIsFuture = false;
  let earningsPopupPosition = { x: 0, y: 0 };

  let chartContainer: HTMLDivElement | null = null;
  let chart: any = null;
  let hoverBar: KLineData | null = null;
  let currentBars = [];
  let barIndexByTimestamp = new Map<number, number>();
  let activeRange = "1D";
  type ChartTypeId =
    | "bars"
    | "candles"
    | "hollow_candles"
    | "line_step"
    | "area"
    | "hlc_area"
    | "high_low"
    | "heikin_ashi";
  type ChartTypeOption = {
    id: ChartTypeId;
    label: string;
    icon: typeof ChartCandlestick | typeof ChartLine;
  };
  const chartTypeOptions: ChartTypeOption[] = [
    { id: "candles", label: "Candles", icon: ChartCandlestick },
    { id: "bars", label: "Bars", icon: ChartCandlestick },
    { id: "hollow_candles", label: "Hollow Candles", icon: ChartCandlestick },
    { id: "high_low", label: "High-Low", icon: ChartCandlestick },
    { id: "heikin_ashi", label: "Heikin Ashi", icon: ChartCandlestick },
    { id: "line_step", label: "Line Step", icon: ChartLine },
    { id: "area", label: "Area", icon: ChartLine },
    { id: "hlc_area", label: "HLC Area", icon: ChartLine },
  ];
  let chartType: ChartTypeId = "candles";
  let currentChartType: ChartTypeOption | undefined = chartTypeOptions[0];
  let activeTool = "cursor";
  let indicatorSearchTerm = "";
  const toNumber = (value: unknown): number | null => {
    const n =
      typeof value === "number"
        ? value
        : typeof value === "string"
          ? Number(value)
          : NaN;
    return Number.isFinite(n) ? n : null;
  };
  const formatSeoPrice = (value: number | null | undefined) =>
    typeof value === "number" && Number.isFinite(value)
      ? value.toFixed(2)
      : "N/A";
  const toRealtimeTimestampMs = (value: unknown): number | null => {
    const raw = toNumber(value);
    if (raw === null) return null;
    if (raw > 1e17) return Math.floor(raw / 1e6);
    if (raw > 1e14) return Math.floor(raw / 1e3);
    if (raw > 1e11) return Math.floor(raw);
    if (raw > 1e9) return Math.floor(raw * 1000);
    return null;
  };
  const getMinuteTimestamp = (timestampMs: number) =>
    Math.floor(timestampMs / 60000) * 60000;
  const resolveTickPrice = (tick): number | null =>
    toNumber(tick?.lp) ?? toNumber(tick?.ap) ?? toNumber(tick?.bp);
  const resolveTickVolume = (tick): number => toNumber(tick?.ls) ?? 0;
  const normalizeAssetType = (value: unknown): string => {
    if (typeof value !== "string") return "";
    let type = value.toLowerCase().trim();
    if (type.endsWith("s")) type = type.slice(0, -1);
    if (["stock", "etf", "index"].includes(type)) return type;
    return "";
  };

  type ChartRule = { name: string; params?: number[] };

  type IndicatorDefinition = {
    id: string;
    label: string;
    indicatorName: string;
    category: string;
    infoKey?: string;
    defaultParams: number[];
    pane: "candle" | "panel";
    height?: number;
    defaultEnabled?: boolean;
  };

  const indicatorDefinitions: IndicatorDefinition[] = [
    {
      id: "ma",
      label: "Moving Average",
      indicatorName: "SN_MA",
      category: "Trend",
      infoKey: "ma",
      defaultParams: [20, 50, 100, 200],
      pane: "candle",
    },
    {
      id: "ema",
      label: "Exponential Moving Average",
      indicatorName: "SN_EMA",
      category: "Trend",
      infoKey: "ema",
      defaultParams: [9, 21, 50],
      pane: "candle",
    },
    {
      id: "boll",
      label: "Bollinger Bands",
      indicatorName: "SN_BOLL",
      category: "Volatility",
      defaultParams: [20, 2],
      pane: "candle",
    },
    {
      id: "vwap",
      label: "VWAP",
      indicatorName: "SN_VWAP",
      category: "Volume",
      infoKey: "vwap",
      defaultParams: [],
      pane: "candle",
    },
    {
      id: "parabolic_sar",
      label: "Parabolic SAR",
      indicatorName: "SN_SAR",
      category: "Trend",
      defaultParams: [0.02, 0.2],
      pane: "candle",
    },
    {
      id: "donchian",
      label: "Donchian Channels",
      indicatorName: "SN_DONCHIAN",
      category: "Trend",
      defaultParams: [20],
      pane: "candle",
    },
    {
      id: "pivot",
      label: "Pivot Points",
      indicatorName: "SN_PIVOT",
      category: "Price Levels",
      defaultParams: [],
      pane: "candle",
    },
    {
      id: "fibonacci",
      label: "Fibonacci Retracements",
      indicatorName: "SN_FIB",
      category: "Price Levels",
      defaultParams: [],
      pane: "candle",
    },
    {
      id: "psych_round_10",
      label: "Psychological Levels ($10)",
      indicatorName: "SN_PSYCH",
      category: "Price Levels",
      defaultParams: [10],
      pane: "candle",
    },
    {
      id: "psych_round_25",
      label: "Psychological Levels ($25)",
      indicatorName: "SN_PSYCH",
      category: "Price Levels",
      defaultParams: [25],
      pane: "candle",
    },
    {
      id: "psych_round_50",
      label: "Psychological Levels ($50)",
      indicatorName: "SN_PSYCH",
      category: "Price Levels",
      defaultParams: [50],
      pane: "candle",
    },
    {
      id: "obv",
      label: "On-Balance Volume",
      indicatorName: "SN_OBV",
      category: "Volume",
      defaultParams: [5, 10, 20, 50],
      pane: "panel",
      height: 120,
    },
    {
      id: "rsi",
      label: "Relative Strength Index",
      indicatorName: "SN_RSI",
      category: "Momentum",
      infoKey: "rsi",
      defaultParams: [14],
      pane: "panel",
      height: 120,
    },
    {
      id: "macd",
      label: "MACD",
      indicatorName: "SN_MACD",
      category: "Momentum",
      defaultParams: [12, 26, 9],
      pane: "panel",
      height: 140,
    },
    {
      id: "atr",
      label: "Average True Range",
      sublabel: "ATR 14",
      indicatorName: "SN_ATR",
      category: "Volatility",
      infoKey: "atr",
      defaultParams: [14],
      pane: "panel",
      height: 120,
    },
    {
      id: "stoch",
      label: "Stochastic Oscillator",
      indicatorName: "SN_STOCH",
      category: "Momentum",
      defaultParams: [14, 3],
      pane: "panel",
      height: 120,
    },
    {
      id: "stoch_crossover",
      label: "Stochastic Crossover",
      indicatorName: "SN_STOCH_X",
      category: "Momentum",
      defaultParams: [14, 3],
      pane: "panel",
      height: 120,
    },
    {
      id: "cci",
      label: "Commodity Channel Index",
      indicatorName: "SN_CCI",
      category: "Momentum",
      infoKey: "cci",
      defaultParams: [20],
      pane: "panel",
      height: 120,
    },
    {
      id: "williams_r",
      label: "Williams %R",
      indicatorName: "SN_WILLIAMS",
      category: "Momentum",
      defaultParams: [14],
      pane: "panel",
      height: 120,
    },
    {
      id: "mfi",
      label: "Money Flow Index",
      indicatorName: "SN_MFI",
      category: "Volume",
      infoKey: "mfi",
      defaultParams: [14],
      pane: "panel",
      height: 120,
    },

    {
      id: "roc",
      label: "Rate of Change",
      indicatorName: "SN_ROC",
      category: "Momentum",
      defaultParams: [12],
      pane: "panel",
      height: 120,
    },
    {
      id: "tsi",
      label: "True Strength Index",
      indicatorName: "SN_TSI",
      category: "Momentum",
      defaultParams: [25, 13, 7],
      pane: "panel",
      height: 120,
    },
    {
      id: "aroon",
      label: "Aroon",
      indicatorName: "SN_AROON",
      category: "Trend",
      defaultParams: [25],
      pane: "panel",
      height: 120,
    },
    {
      id: "std",
      label: "Standard Deviation",
      indicatorName: "SN_STD",
      category: "Volatility",
      defaultParams: [20],
      pane: "panel",
      height: 120,
    },
    {
      id: "hist_vol",
      label: "Historical Volatility",
      indicatorName: "SN_HVOL",
      category: "Volatility",
      defaultParams: [20],
      pane: "panel",
      height: 120,
    },
    {
      id: "chaikin_vol",
      label: "Chaikin Volatility",
      indicatorName: "SN_CHAIKIN",
      category: "Volatility",
      defaultParams: [10, 10],
      pane: "panel",
      height: 120,
    },
  ];

  const indicatorParamDefaults: Record<string, number[]> = Object.fromEntries(
    indicatorDefinitions.map((item) => [item.id, item.defaultParams]),
  );

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
  let lastAppliedStrategyId = "";
  let lastAppliedStrategySignature = "";

  let indicatorInstanceIds: Record<string, string | null> = Object.fromEntries(
    indicatorDefinitions.map((item) => [item.id, null]),
  );
  let indicatorState: Record<string, boolean> = Object.fromEntries(
    indicatorDefinitions.map((item) => [item.id, Boolean(item.defaultEnabled)]),
  );
  let resizeObserver: ResizeObserver | null = null;
  let chartRoot: HTMLElement | null = null;
  let chartMain: HTMLElement | null = null;
  let previousBodyOverflow = "";
  let previousHtmlOverflow = "";
  let socket: WebSocket | null = null;
  let realtimeBarCallback: ((bar: KLineData) => void) | null = null;
  let previousTicker = "";
  let isComponentDestroyed = false;

  let ticker = "";
  let dailyBars: KLineData[] = [];
  let intradayBars: KLineData[] = [];
  type IntradayInterval = "1min" | "5min" | "15min" | "30min" | "1hour";
  const intradayIntervals: IntradayInterval[] = [
    "1min",
    "5min",
    "15min",
    "30min",
    "1hour",
  ];
  const intradaySpanMap: Record<IntradayInterval, number> = {
    "1min": 1,
    "5min": 5,
    "15min": 15,
    "30min": 30,
    "1hour": 60,
  };
  type IntradayHistoryState = {
    bars: KLineData[];
    startTimestamp: number | null;
    hasMore: boolean;
    isLoading: boolean;
    lastEndDate: string;
  };
  const createIntradayState = (): IntradayHistoryState => ({
    bars: [],
    startTimestamp: null,
    hasMore: true,
    isLoading: false,
    lastEndDate: "",
  });
  let intradayHistory: Record<IntradayInterval, IntradayHistoryState> =
    Object.fromEntries(
      intradayIntervals.map((interval) => [interval, createIntradayState()]),
    ) as Record<IntradayInterval, IntradayHistoryState>;
  let intradayHistoryTicker = "";
  const intradayHistoryChunkDays = 5;
  // 1min and 5min: max 30 days, others (15min, 30min, 1hour): max 90 days
  const intradayHistoryLimitDaysMap: Record<IntradayInterval, number> = {
    "1min": 30,
    "5min": 30,
    "15min": 90,
    "30min": 90,
    "1hour": 90,
  };
  const getIntradayLimitDays = (interval: IntradayInterval) =>
    intradayHistoryLimitDaysMap[interval] ?? 30;
  let pricePrecision = 2;
  let priceFormatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: pricePrecision,
    maximumFractionDigits: pricePrecision,
  });
  const volumeFormatter = new Intl.NumberFormat("en-US");
  const tools = [
    { id: "cursor", label: "Cursor", icon: MousePointer2 },
    { id: "trend", label: "Trend Line", icon: TrendingUp },
    { id: "line", label: "Line", icon: SlashIcon },
    { id: "rect", label: "Rectangle", icon: SquareIcon },
    { id: "circle", label: "Circle", icon: CircleIcon },
    { id: "erase", label: "Eraser", icon: EraserIcon },
  ];

  const indicatorItems = indicatorDefinitions.map((item) => ({
    id: item.id,
    label: item.label,
    category: item.category,
    infoKey: item.infoKey,
  }));
  let filteredIndicators = indicatorItems;
  let groupedIndicators = groupChartIndicators(indicatorItems);

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
        const time =
          typeof entry?.time === "string"
            ? entry.time
            : typeof entry?.date === "string"
              ? entry.date
              : null;
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
          volume: toNumber(entry?.volume) ?? 0,
        };
      })
      .filter((bar): bar is KLineData => Boolean(bar))
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  const cloneBars = (bars: KLineData[]) => bars.map((bar) => ({ ...bar }));

  const updateIntradayState = (
    interval: IntradayInterval,
    updates: Partial<IntradayHistoryState>,
  ) => {
    intradayHistory = {
      ...intradayHistory,
      [interval]: { ...intradayHistory[interval], ...updates },
    };
  };

  const getIntradayHistoryLimitMs = (interval: IntradayInterval) =>
    DateTime.now()
      .setZone(zone)
      .minus({ days: getIntradayLimitDays(interval) })
      .startOf("day")
      .toMillis();

  // US market holidays for 2025-2026
  const marketHolidays = new Set([
    "2025-01-01",
    "2025-01-20",
    "2025-02-17",
    "2025-04-18",
    "2025-05-26",
    "2025-06-19",
    "2025-07-04",
    "2025-09-01",
    "2025-11-27",
    "2025-12-25",
    "2026-01-01",
    "2026-01-19",
    "2026-02-16",
    "2026-04-03",
    "2026-05-25",
    "2026-06-19",
    "2026-07-03",
    "2026-09-07",
    "2026-11-26",
    "2026-12-25",
  ]);

  const isMarketDay = (dt: DateTime): boolean => {
    const dayOfWeek = dt.weekday; // 1=Monday, 7=Sunday
    if (dayOfWeek >= 6) return false; // Saturday or Sunday
    return !marketHolidays.has(dt.toFormat("yyyy-MM-dd"));
  };

  const getPreviousMarketDay = (dt: DateTime): DateTime => {
    let current = dt.minus({ days: 1 });
    while (!isMarketDay(current)) {
      current = current.minus({ days: 1 });
    }
    return current;
  };

  const getIntradayHistoryEndDate = (interval: IntradayInterval) => {
    const state = intradayHistory[interval];
    if (!state.bars.length) {
      return DateTime.now().setZone(zone).toFormat("yyyy-MM-dd");
    }
    const earliestBarDate = DateTime.fromMillis(state.bars[0].timestamp, {
      zone,
    });
    return getPreviousMarketDay(earliestBarDate).toFormat("yyyy-MM-dd");
  };

  const getMinuteHistoryEndDate = () => {
    if (!minuteBars.length) {
      return DateTime.now().setZone(zone).toFormat("yyyy-MM-dd");
    }
    const earliestBarDate = DateTime.fromMillis(minuteBars[0].timestamp, {
      zone,
    });
    return getPreviousMarketDay(earliestBarDate).toFormat("yyyy-MM-dd");
  };

  const mergeIntradayBars = (current: KLineData[], incoming: KLineData[]) => {
    const map = new Map(current.map((bar) => [bar.timestamp, bar]));
    incoming.forEach((bar) => {
      map.set(bar.timestamp, bar);
    });
    return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
  };

  const requestIntradayHistory = async (
    interval: IntradayInterval,
    endDate: string,
  ) => {
    const response = await fetch("/api/chart-intraday-price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticker,
        endDate,
        interval,
        days: intradayHistoryChunkDays,
      }),
    });

    if (!response.ok) {
      return { bars: [], hasMore: false };
    }

    const payload = await response.json();
    return {
      bars: normalizeIntraday(payload?.data ?? []),
      hasMore: Boolean(payload?.hasMore),
    };
  };

  const loadMoreIntradayBars = async (interval: IntradayInterval) => {
    const state = intradayHistory[interval];
    if (!ticker || state.isLoading || !state.hasMore) {
      return { bars: [], hasMore: state.hasMore };
    }

    const endDate = getIntradayHistoryEndDate(interval);
    if (!endDate || endDate === state.lastEndDate) {
      return { bars: [], hasMore: state.hasMore };
    }

    updateIntradayState(interval, {
      isLoading: true,
      lastEndDate: endDate,
    });
    const result = await requestIntradayHistory(interval, endDate);
    if (result.bars.length) {
      const merged = mergeIntradayBars(
        intradayHistory[interval].bars,
        result.bars,
      );
      updateIntradayState(interval, {
        bars: merged,
        startTimestamp: merged[0]?.timestamp ?? null,
      });
      if (activeRange === interval) {
        currentBars = transformBarsForType(merged, chartType);
      }
    }
    updateIntradayState(interval, {
      hasMore: result.hasMore,
      isLoading: false,
    });
    return result;
  };

  const resetIntradayHistory = () => {
    const nextHistory = Object.fromEntries(
      intradayIntervals.map((interval) => {
        const limitMs = getIntradayHistoryLimitMs(interval);
        if (interval === "1min") {
          const bars = cloneBars(intradayBars);
          const startTimestamp = bars[0]?.timestamp ?? null;
          return [
            interval,
            {
              bars,
              startTimestamp,
              hasMore:
                startTimestamp !== null ? startTimestamp > limitMs : false,
              isLoading: false,
              lastEndDate: "",
            },
          ];
        }
        return [
          interval,
          {
            ...createIntradayState(),
            hasMore: true,
          },
        ];
      }),
    ) as Record<IntradayInterval, IntradayHistoryState>;

    intradayHistory = nextHistory;
  };

  // Check if current range is non-intraday (should show earnings)
  const isNonIntradayRange = (range: string) =>
    ["1D", "1W", "1M"].includes(range);

  // Update earnings marker positions based on visible chart range
  const updateEarningsMarkers = () => {
    if (!chart || !chartContainer || !isNonIntradayRange(activeRange)) {
      earningsMarkers = [];
      return;
    }

    const chartRect = chartContainer.getBoundingClientRect();
    const chartWidth = chartRect.width;

    // Create markers for each earnings date
    const markers: EarningsMarker[] = [];

    for (const earnings of historicalEarnings) {
      if (!earnings.date) continue;

      // Convert earnings date to timestamp (start of day in NY timezone)
      const earningsDate = DateTime.fromISO(earnings.date, { zone });
      const timestamp = earningsDate.startOf("day").toMillis();

      // Convert timestamp to pixel position
      const pixel = chart.convertToPixel({ timestamp });

      if (pixel && typeof pixel.x === "number") {
        // Check if marker is within visible chart area (with some padding)
        const visible = pixel.x >= -20 && pixel.x <= chartWidth + 20;

        markers.push({
          earnings,
          timestamp,
          x: pixel.x,
          visible,
          isFuture: false,
        });
      }
    }

    // Also add next earnings if available and in the future
    if (nextEarnings?.date) {
      const nextDate = DateTime.fromISO(nextEarnings.date, { zone });
      const now = DateTime.now().setZone(zone);
      if (nextDate > now) {
        const timestamp = nextDate.startOf("day").toMillis();
        const pixel = chart.convertToPixel({ timestamp });

        if (pixel && typeof pixel.x === "number") {
          const visible = pixel.x >= -20 && pixel.x <= chartWidth + 20;
          markers.push({
            earnings: nextEarnings,
            timestamp,
            x: pixel.x,
            visible,
            isFuture: true,
          });
        }
      }
    }

    earningsMarkers = markers;
  };

  // Handle earnings marker click
  const handleEarningsClick = (marker: EarningsMarker, event: MouseEvent) => {
    event.stopPropagation();
    selectedEarnings = marker.earnings;
    selectedEarningsIsFuture = marker.isFuture;

    // Position popup near the click but ensure it stays on screen
    const rect = chartContainer?.getBoundingClientRect();
    if (rect) {
      let x = marker.x;
      let y = rect.height - 100; // Position above the volume area

      // Ensure popup doesn't go off screen
      if (x < 150) x = 150;
      if (x > rect.width - 150) x = rect.width - 150;

      earningsPopupPosition = { x, y };
    }
  };

  // Close earnings popup
  const closeEarningsPopup = () => {
    selectedEarnings = null;
  };

  // Helper to get EPS value (handles both field naming conventions)
  const getEpsValue = (
    earnings: EarningsData | null,
  ): string | number | null => {
    if (!earnings) return null;
    // Historical uses: eps, Next earnings uses: epsPrior
    return earnings.eps ?? (earnings as any).epsPrior ?? null;
  };

  // Helper to get EPS estimate (handles both field naming conventions)
  const getEpsEstimate = (
    earnings: EarningsData | null,
  ): string | number | null => {
    if (!earnings) return null;
    // Historical uses: eps_est, Next earnings uses: epsEst
    return earnings.eps_est ?? (earnings as any).epsEst ?? null;
  };

  // Helper to get revenue value (handles both field naming conventions)
  const getRevenueValue = (
    earnings: EarningsData | null,
  ): string | number | null => {
    if (!earnings) return null;
    // Historical uses: revenue, Next earnings uses: revenuePrior
    return earnings.revenue ?? (earnings as any).revenuePrior ?? null;
  };

  // Helper to get revenue estimate (handles both field naming conventions)
  const getRevenueEstimate = (
    earnings: EarningsData | null,
  ): string | number | null => {
    if (!earnings) return null;
    // Historical uses: revenue_est, Next earnings uses: revenueEst
    return earnings.revenue_est ?? (earnings as any).revenueEst ?? null;
  };

  // Helper to check if earnings is before market open
  const isBeforeMarketOpen = (earnings: EarningsData | null): boolean => {
    if (!earnings) return false;
    // Historical uses: time = "bmo", Next earnings uses: time = "09:30" or earlier
    if (earnings.time === "bmo") return true;
    if (earnings.time && earnings.time.includes(":")) {
      const [hours] = earnings.time.split(":").map(Number);
      return hours < 10; // Before 10:00 AM
    }
    return false;
  };

  // Helper to check if earnings is after market close
  const isAfterMarketClose = (earnings: EarningsData | null): boolean => {
    if (!earnings) return false;
    // Historical uses: time = "amc", Next earnings uses: time = "16:00" or later
    if (earnings.time === "amc") return true;
    if (earnings.time && earnings.time.includes(":")) {
      const [hours] = earnings.time.split(":").map(Number);
      return hours >= 16; // 4:00 PM or later
    }
    return false;
  };

  // Calculate YoY change for future earnings (estimate vs prior)
  const calculateYoYChange = (
    estimate: string | number | null,
    prior: string | number | null,
  ): { percent: number; positive: boolean } | null => {
    const estNum =
      typeof estimate === "string" ? parseFloat(estimate) : estimate;
    const priorNum = typeof prior === "string" ? parseFloat(prior) : prior;

    if (
      !Number.isFinite(estNum) ||
      !Number.isFinite(priorNum) ||
      priorNum === 0
    ) {
      return null;
    }

    const percent = (estNum / priorNum - 1) * 100;
    return { percent, positive: percent >= 0 };
  };

  // Format earnings value for display
  const formatEarningsValue = (value: string | number | null): string => {
    if (value === null || value === undefined || value === "") return "-";
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (!Number.isFinite(num)) return "-";
    return num.toFixed(2);
  };

  // Format revenue value with abbreviation
  const formatRevenueValue = (value: string | number | null): string => {
    if (value === null || value === undefined || value === "") return "-";
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (!Number.isFinite(num)) return "-";
    return abbreviateNumber(num);
  };

  // Calculate surprise percentage
  const calculateSurprise = (
    actual: string | number | null,
    estimate: string | number | null,
  ): { value: number; percent: number; positive: boolean } | null => {
    const actualNum = typeof actual === "string" ? parseFloat(actual) : actual;
    const estimateNum =
      typeof estimate === "string" ? parseFloat(estimate) : estimate;

    if (
      !Number.isFinite(actualNum) ||
      !Number.isFinite(estimateNum) ||
      Math.abs(estimateNum) < 0.0001
    ) {
      return null;
    }

    const value = actualNum - estimateNum;
    const percent = (value / Math.abs(estimateNum)) * 100;
    return { value, percent, positive: value >= 0 };
  };

  const buildHeikinAshi = (bars: KLineData[]) => {
    const output: KLineData[] = [];
    let prevOpen = 0;
    let prevClose = 0;
    bars.forEach((bar, index) => {
      const close = (bar.open + bar.high + bar.low + bar.close) / 4;
      const open =
        index === 0 ? (bar.open + bar.close) / 2 : (prevOpen + prevClose) / 2;
      const high = Math.max(bar.high, open, close);
      const low = Math.min(bar.low, open, close);
      output.push({
        ...bar,
        open,
        high,
        low,
        close,
      });
      prevOpen = open;
      prevClose = close;
    });
    return output;
  };

  const buildHighLowBars = (bars: KLineData[]) =>
    bars.map((bar) => ({
      ...bar,
      open: bar.high,
      close: bar.low,
    }));

  const buildHlcAreaBars = (bars: KLineData[]) =>
    bars.map((bar) => ({
      ...bar,
      hlc3: (bar.high + bar.low + bar.close) / 3,
    }));

  const transformBarsForType = (bars: KLineData[], type: ChartTypeId) => {
    if (type === "heikin_ashi") return buildHeikinAshi(bars);
    if (type === "high_low") return buildHighLowBars(bars);
    if (type === "hlc_area") return buildHlcAreaBars(bars);
    return bars;
  };

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
    // Intraday intervals - use intraday data from API
    if (range === "1min") {
      const bars = minuteBars.length ? minuteBars : intradayBars;
      return { bars, period: { type: "minute", span: 1 } };
    }

    // Handle other intraday intervals (5min, 15min, 30min, 1hour)
    if (
      intradayIntervals.includes(range as IntradayInterval) &&
      range !== "1min"
    ) {
      const interval = range as IntradayInterval;
      const span = intradaySpanMap[interval];
      const bars = intradayHistory[interval].bars;
      return { bars, period: { type: "minute", span } };
    }

    // Daily/Weekly/Monthly ranges - use historical adjusted price data
    if (!dailyBars.length) {
      return { bars: [], period: { type: "day", span: 1 } };
    }

    if (range === "1D") {
      // Daily interval - show all historical data
      return { bars: dailyBars, period: { type: "day", span: 1 } };
    }

    if (range === "1W") {
      // Weekly interval - aggregate daily bars to weekly
      const weeklyBars = aggregateToWeekly(dailyBars);
      return { bars: weeklyBars, period: { type: "week", span: 1 } };
    }

    if (range === "1M") {
      // Monthly interval - aggregate daily bars to monthly
      const monthlyBars = aggregateToMonthly(dailyBars);
      return { bars: monthlyBars, period: { type: "month", span: 1 } };
    }

    // Default fallback
    return { bars: dailyBars, period: { type: "day", span: 1 } };
  }

  // Aggregate daily bars into weekly bars
  function aggregateToWeekly(bars: KLineData[]): KLineData[] {
    if (!bars.length) return [];

    const weeklyMap = new Map<string, KLineData>();

    for (const bar of bars) {
      const dt = DateTime.fromMillis(bar.timestamp, { zone });
      // Get the start of the week (Monday)
      const weekStart = dt.startOf("week");
      const weekKey = weekStart.toISODate();

      if (!weekKey) continue;

      const existing = weeklyMap.get(weekKey);
      if (existing) {
        existing.high = Math.max(existing.high, bar.high);
        existing.low = Math.min(existing.low, bar.low);
        existing.close = bar.close; // Last close of the week
        existing.volume = (existing.volume ?? 0) + (bar.volume ?? 0);
      } else {
        weeklyMap.set(weekKey, {
          timestamp: weekStart.toMillis(),
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: bar.volume ?? 0,
        });
      }
    }

    return Array.from(weeklyMap.values()).sort(
      (a, b) => a.timestamp - b.timestamp,
    );
  }

  // Aggregate daily bars into monthly bars
  function aggregateToMonthly(bars: KLineData[]): KLineData[] {
    if (!bars.length) return [];

    const monthlyMap = new Map<string, KLineData>();

    for (const bar of bars) {
      const dt = DateTime.fromMillis(bar.timestamp, { zone });
      // Get the start of the month
      const monthStart = dt.startOf("month");
      const monthKey = monthStart.toFormat("yyyy-MM");

      const existing = monthlyMap.get(monthKey);
      if (existing) {
        existing.high = Math.max(existing.high, bar.high);
        existing.low = Math.min(existing.low, bar.low);
        existing.close = bar.close; // Last close of the month
        existing.volume = (existing.volume ?? 0) + (bar.volume ?? 0);
      } else {
        monthlyMap.set(monthKey, {
          timestamp: monthStart.toMillis(),
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: bar.volume ?? 0,
        });
      }
    }

    return Array.from(monthlyMap.values()).sort(
      (a, b) => a.timestamp - b.timestamp,
    );
  }

  async function applyRange(range: string) {
    if (!chart) return;

    const isIntradayInterval = intradayIntervals.includes(
      range as IntradayInterval,
    );
    const interval = range as IntradayInterval;
    const isMinuteRange = range === "1min";
    const isOtherIntradayRange = isIntradayInterval && range !== "1min";

    // For intraday intervals (except 1min which uses minuteBars),
    // load initial data if bars are empty
    if (isOtherIntradayRange) {
      const state = intradayHistory[interval];
      if (state.bars.length === 0 && state.hasMore && !state.isLoading) {
        await loadMoreIntradayBars(interval);
      }
    }

    // Get bars after potential initial load
    const { bars, period } = getRangeBars(range);
    const displayBars = transformBarsForType(bars, chartType);
    currentBars = displayBars;
    hoverBar = null;
    realtimeBarCallback = null;

    chart.setSymbol({
      ticker,
      pricePrecision,
      volumePrecision: 0,
    });
    chart.setPeriod(period);
    chart.setDataLoader({
      getBars: async ({ type, callback }) => {
        if (type === "init") {
          const hasMore = isMinuteRange
            ? hasMoreMinuteHistory
            : isOtherIntradayRange
              ? intradayHistory[interval].hasMore
              : false;
          callback(displayBars, {
            backward: false,
            forward: hasMore,
          });
          return;
        }

        if (isMinuteRange && type === "forward") {
          const result = await loadMoreMinuteBars();
          const nextBars = transformBarsForType(result.bars, chartType);
          callback(nextBars, { backward: false, forward: result.hasMore });
          return;
        }

        if (isOtherIntradayRange && type === "forward") {
          const result = await loadMoreIntradayBars(interval);
          const nextBars = transformBarsForType(result.bars, chartType);
          callback(nextBars, { backward: false, forward: result.hasMore });
          return;
        }

        callback([], { backward: false, forward: false });
      },
      subscribeBar: ({ callback }) => {
        realtimeBarCallback = callback;
      },
      unsubscribeBar: () => {
        realtimeBarCallback = null;
      },
    });
    chart.scrollToRealTime();
  }

  const upsertMinuteBar = (
    bars: KLineData[],
    minuteTimestamp: number,
    price: number,
    volume: number,
  ) => {
    const lastIndex = bars.length - 1;
    let updatedIndex = -1;

    if (lastIndex >= 0) {
      const lastBar = bars[lastIndex];
      if (lastBar.timestamp === minuteTimestamp) {
        bars[lastIndex] = {
          ...lastBar,
          high: Math.max(lastBar.high, price),
          low: Math.min(lastBar.low, price),
          close: price,
          volume: (lastBar.volume ?? 0) + volume,
        };
        updatedIndex = lastIndex;
      } else if (lastBar.timestamp < minuteTimestamp) {
        bars.push({
          timestamp: minuteTimestamp,
          open: price,
          high: price,
          low: price,
          close: price,
          volume,
        });
        updatedIndex = bars.length - 1;
      } else {
        const matchIndex = bars.findIndex(
          (bar) => bar.timestamp === minuteTimestamp,
        );
        if (matchIndex === -1) return -1;
        const target = bars[matchIndex];
        bars[matchIndex] = {
          ...target,
          high: Math.max(target.high, price),
          low: Math.min(target.low, price),
          close: price,
          volume: (target.volume ?? 0) + volume,
        };
        updatedIndex = matchIndex;
      }
    } else {
      bars.push({
        timestamp: minuteTimestamp,
        open: price,
        high: price,
        low: price,
        close: price,
        volume,
      });
      updatedIndex = bars.length - 1;
    }

    return updatedIndex;
  };

  const updateRealtimeBars = (tick) => {
    if (!tick) return;
    const symbol = typeof tick?.s === "string" ? tick.s.toUpperCase() : "";
    if (symbol && ticker && symbol !== ticker.toUpperCase()) return;
    const timestampMs = toRealtimeTimestampMs(tick?.t ?? tick?.time);
    if (timestampMs === null) return;
    const price = resolveTickPrice(tick);
    if (price === null) return;
    const volume = resolveTickVolume(tick);
    const minuteTimestamp = getMinuteTimestamp(timestampMs);

    const intradayIndex = upsertMinuteBar(
      intradayBars,
      minuteTimestamp,
      price,
      volume,
    );
    let minuteIndex = -1;
    if (minuteBarsTicker === ticker) {
      if (!minuteBars.length && intradayBars.length) {
        minuteBars = cloneBars(intradayBars);
        minuteIndex = minuteBars.length - 1;
      } else if (minuteBars.length) {
        minuteIndex = upsertMinuteBar(
          minuteBars,
          minuteTimestamp,
          price,
          volume,
        );
      }
    }

    if (activeRange === "1D") {
      const displayBars = transformBarsForType(intradayBars, chartType);
      currentBars = displayBars;
      if (intradayIndex === displayBars.length - 1) {
        const latestBar = displayBars[intradayIndex];
        if (latestBar && realtimeBarCallback) {
          realtimeBarCallback(latestBar);
        }
      }
    }

    if (activeRange === "1min") {
      const sourceBars = minuteBars.length ? minuteBars : intradayBars;
      const sourceIndex =
        minuteBars.length && minuteIndex !== -1 ? minuteIndex : intradayIndex;
      const displayBars = transformBarsForType(sourceBars, chartType);
      currentBars = displayBars;
      if (sourceIndex === displayBars.length - 1) {
        const latestBar = displayBars[sourceIndex];
        if (latestBar && realtimeBarCallback) {
          realtimeBarCallback(latestBar);
        }
      }
    }

    pricePrecision = computePricePrecision([
      ...dailyBars,
      ...intradayBars,
      ...minuteBars,
    ]);
    priceFormatter = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: pricePrecision,
      maximumFractionDigits: pricePrecision,
    });
  };

  function sendMessage(message) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON?.stringify(message));
    } else {
      console.error("WebSocket is not open. Unable to send message.");
    }
  }

  async function websocketRealtimeData() {
    if (!data?.wsURL || !ticker || typeof window === "undefined") return;
    if (
      socket &&
      (socket.readyState === WebSocket.CONNECTING ||
        socket.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    try {
      socket = new WebSocket(data?.wsURL + "/price-data");

      socket.addEventListener("open", () => {
        const tickerList = [ticker?.toUpperCase()] || [];
        sendMessage(tickerList);
      });

      socket.addEventListener("message", (event) => {
        try {
          const parsed = JSON.parse(event.data);
          const items = Array.isArray(parsed) ? parsed : [parsed];
          items.forEach((item) => {
            if (!item || (item.type !== "Q" && item.type !== "T")) return;
            updateRealtimeBars(item);
          });
        } catch (error) {
          console.log(error);
        }
      });

      socket.addEventListener("close", () => {
        socket = null;
      });
    } catch (error) {
      console.error("WebSocket connection error:", error);
    }
  }

  function disconnectWebSocket() {
    if (socket) {
      socket.close();
      socket = null;
    }
  }

  const getIndicatorParams = (key: string) =>
    indicatorParams[key]?.length
      ? indicatorParams[key]
      : (indicatorParamDefaults[key] ?? []);

  function syncIndicators() {
    if (!chart) return;
    const nextInstanceIds = { ...indicatorInstanceIds };

    indicatorDefinitions.forEach((item) => {
      const enabled = Boolean(indicatorState[item.id]);
      const existingId = nextInstanceIds[item.id];

      // For candle pane indicators, explicitly specify the candle pane ID
      const isOnCandlePane = item.pane === "candle";

      let paneOptions: Record<string, unknown> | undefined;
      if (isOnCandlePane) {
        // Explicitly specify candle_pane to overlay indicator on main chart
        // Using 'id' property to target existing candle pane (per klinecharts API)
        paneOptions = { id: "candle_pane" };
      } else if (item.id === "volume") {
        // Volume pane: minimal y-axis, no gap from candle pane
        paneOptions = {
          id: `sn_${item.id}_pane`,
          height: item.height ?? 80,
          minHeight: 60,
          dragEnabled: false,
          gap: { top: 0, bottom: 0 },
          axis: {
            show: true,
            axisLine: { show: false },
            tickLine: { show: false },
            tickText: { show: true },
          },
        };
      } else {
        paneOptions = { id: `sn_${item.id}_pane`, height: item.height ?? 120 };
      }

      if (enabled && !existingId) {
        // isStack=false when targeting pane by ID (per klinecharts API)
        nextInstanceIds[item.id] = chart.createIndicator(
          { name: item.indicatorName, calcParams: getIndicatorParams(item.id) },
          false,
          paneOptions,
        );
        return;
      }

      if (!enabled && existingId) {
        chart.removeIndicator({ id: existingId });
        nextInstanceIds[item.id] = null;
        return;
      }

      if (enabled && existingId) {
        chart.overrideIndicator({
          id: existingId,
          calcParams: getIndicatorParams(item.id),
        });
      }
    });

    indicatorInstanceIds = nextInstanceIds;
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
    const nextState: Record<string, boolean> = Object.fromEntries(
      indicatorDefinitions.map((item) => [item.id, false]),
    );
    indicatorParams = cloneIndicatorParams();
    rules.forEach((rule) => {
      if (!rule?.name || !(rule.name in nextState)) return;
      nextState[rule.name] = true;
      if (Array.isArray(rule.params) && rule.params.length > 0) {
        indicatorParams[rule.name] = [...rule.params];
      }
    });

    indicatorState = nextState;
    if (chart) {
      syncIndicators();
    }
    ruleOfList = buildRuleList();
  };

  const applyDefaultIndicators = () => {
    indicatorParams = cloneIndicatorParams();
    indicatorState = Object.fromEntries(
      indicatorDefinitions.map((item) => [
        item.id,
        Boolean(item.defaultEnabled),
      ]),
    );
    if (chart) {
      syncIndicators();
    }
    ruleOfList = buildRuleList();
  };

  const getRulesSignature = (rules: ChartRule[]) => JSON.stringify(rules ?? []);

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
    const chartFont = "Space Grotesk";
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
          high: { show: false },
          low: { show: false },
          last: {
            text: {
              family: chartFont,
            },
          },
        },
        tooltip: {
          rect: {
            color: tooltipBg,
            borderColor: tooltipBorder,
          },
          title: {
            show: false,
            color: tooltipText,
            size: 11,
            family: chartFont,
            weight: 500,
          },
          legend: {
            color: tooltipText,
            size: 13,
            family: chartFont,
            weight: 500,
            template: buildCandleTooltipLegends,
          },
        },
      },
      indicator: {
        lastValueMark: {
          show: true,
          text: {
            show: true,
            size: 13,
            family: chartFont,
            weight: 500,
          },
        },
        tooltip: {
          title: {
            color: tooltipText,
            size: 11,
            family: chartFont,
            weight: 500,
          },
          legend: {
            color: tooltipText,
            size: 13,
            family: chartFont,
            weight: 500,
          },
        },
        bars: [
          {
            upColor: "rgba(34, 171, 148, 0.5)",
            downColor: "rgba(242, 54, 69, 0.5)",
            noChangeColor: "rgba(136, 136, 136, 0.5)",
          },
        ],
      },
      xAxis: {
        axisLine: { show: true, color: axisLineColor, size: 1 },
        tickLine: { show: true, color: axisLineColor, size: 1, length: 3 },
        tickText: {
          show: true,
          color: axisText,
          size: 11,
          family: chartFont,
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
          family: chartFont,
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
            family: chartFont,
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
            family: chartFont,
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
        size: 0,
        color: "transparent",
        fill: false,
        activeBackgroundColor: "transparent",
      },
    });
  }

  function applyChartType(type: ChartTypeId) {
    if (!chart) return;
    const blueLine = "#3b82f6";
    const transparentArea = [
      { offset: 0, color: "rgba(59, 130, 246, 0)" },
      { offset: 1, color: "rgba(59, 130, 246, 0)" },
    ];
    const softArea = [
      { offset: 0, color: "rgba(59, 130, 246, 0.25)" },
      { offset: 1, color: "rgba(59, 130, 246, 0)" },
    ];

    let candleType: string = "candle_solid";
    let areaStyle = undefined;

    switch (type) {
      case "bars":
        candleType = "ohlc";
        break;
      case "hollow_candles":
        candleType = "candle_up_stroke";
        break;
      case "high_low":
        candleType = "ohlc";
        break;
      case "heikin_ashi":
        candleType = "candle_solid";
        break;
      case "line_step":
        candleType = "area";
        areaStyle = {
          lineColor: blueLine,
          lineSize: 2,
          smooth: false,
          value: "close",
          backgroundColor: transparentArea,
        };
        break;
      case "area":
        candleType = "area";
        areaStyle = {
          lineColor: blueLine,
          lineSize: 2,
          smooth: true,
          value: "close",
          backgroundColor: softArea,
        };
        break;
      case "hlc_area":
        candleType = "area";
        areaStyle = {
          lineColor: blueLine,
          lineSize: 2,
          smooth: true,
          value: "hlc3",
          backgroundColor: softArea,
        };
        break;
      default:
        candleType = "candle_solid";
    }

    chart.setStyles({
      candle: {
        type: candleType,
        ...(areaStyle ? { area: areaStyle } : {}),
      },
    });
  }

  function setRange(range: string) {
    activeRange = range;
    if (chart) {
      applyRange(range);
    }
    // Save to localStorage
    saveChartSettings({ chartType, activeRange });
  }

  function setChartType(type: ChartTypeId) {
    chartType = type;
    if (chart) {
      // Apply chart type styling
      applyChartType(type);

      // Transform current bars to new type without resetting position
      const { bars } = getRangeBars(activeRange);
      const displayBars = transformBarsForType(bars, type);
      currentBars = displayBars;

      // Update chart data in place without resetting scroll position
      chart.applyNewData(displayBars);
    }
    // Save to localStorage
    saveChartSettings({ chartType, activeRange });
  }

  function toggleIndicator(name: string) {
    if (!(name in indicatorState)) return;
    indicatorState = {
      ...indicatorState,
      [name]: !indicatorState[name],
    };
    if (chart) {
      syncIndicators();
    }
    ruleOfList = buildRuleList();
  }

  function toggleIndicatorById(id: string) {
    toggleIndicator(id);
  }

  function isIndicatorEnabled(id: string) {
    return Boolean(indicatorState[id]);
  }

  const toastStyle = () =>
    `border-radius: 5px; background: #fff; color: #000; border-color: ${
      $mode === "light" ? "#F9FAFB" : "#4B5563"
    }; font-size: 15px;`;

  let LoginPopup;

  const openLoginModal = () => {
    const loginTrigger = document.getElementById("userLogin");
    if (!loginTrigger) return false;
    loginTrigger.dispatchEvent(new MouseEvent("click"));
    return true;
  };

  const ensureAuth = () => {
    if (data?.user) return true;
    if (!openLoginModal()) {
      toast.info("Sign in to save chart strategies.", {
        style: toastStyle(),
      });
    }
    return false;
  };

  $: selectedStrategyTitle =
    strategyList?.find((item) => item.id === selectedStrategy)?.title ?? "";

  function handleCreateStrategy() {
    const modal = document.getElementById("addChartStrategy");
    modal?.dispatchEvent(new MouseEvent("click"));
  }

  async function handleSave(showMessage = true) {
    if (!data?.user) return;
    if (!selectedStrategy) {
      handleCreateStrategy();
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

    // Clear all chart tools and indicators (like clicking eraser)
    if (chart) {
      chart.removeOverlay();
      clearIndicators();
      saveChartOverlays([]);
      activeTool = "cursor";
      if (chartMain) {
        chartMain.style.cursor = "default";
      }
    }

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
        applyDefaultIndicators();
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

  function zoomChart(scale: number) {
    if (!chart) return;
    chart.zoomAtCoordinate(scale);
  }

  async function downloadChart() {
    if (!chart || !chartContainer) return;
    try {
      // Get all canvas elements from the chart container
      const canvases = chartContainer.querySelectorAll("canvas");
      if (!canvases.length) {
        toast.error("Chart not ready for download");
        return;
      }

      // Get the container dimensions
      const rect = chartContainer.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);

      // Create a new canvas to composite all layers
      const compositeCanvas = document.createElement("canvas");
      compositeCanvas.width = width * 2; // 2x for higher resolution
      compositeCanvas.height = height * 2;
      const ctx = compositeCanvas.getContext("2d");
      if (!ctx) {
        toast.error("Failed to create canvas context");
        return;
      }

      // Scale for higher resolution
      ctx.scale(2, 2);

      // Fill background
      ctx.fillStyle = "#0b0b0b";
      ctx.fillRect(0, 0, width, height);

      // Draw each canvas layer onto the composite canvas
      canvases.forEach((canvas) => {
        if (canvas.width > 0 && canvas.height > 0) {
          const canvasRect = canvas.getBoundingClientRect();
          const x = canvasRect.left - rect.left;
          const y = canvasRect.top - rect.top;
          ctx.drawImage(canvas, x, y, canvasRect.width, canvasRect.height);
        }
      });

      // Add watermark - matches on-screen watermark
      // bottom-[200px], left-3 = 12px, size-9 = 36px, gap-2 = 8px
      const logoSize = 36;
      const paddingLeft = 12;
      const paddingBottom = 200;
      const gap = 8;
      const watermarkY = height - paddingBottom;

      // Load and draw logo
      const logo = new Image();
      logo.crossOrigin = "anonymous";
      logo.src = "/pwa-192x192.png";

      await new Promise<void>((resolve, reject) => {
        logo.onload = () => {
          // Draw logo
          ctx.drawImage(logo, paddingLeft, watermarkY, logoSize, logoSize);

          // Draw text next to logo (text-base = 16px, font-semibold = 600)
          ctx.font = "600 16px 'Space Grotesk', sans-serif";
          ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
          ctx.textBaseline = "middle";
          ctx.fillText(
            "Stocknear",
            paddingLeft + logoSize + gap,
            watermarkY + logoSize / 2,
          );

          resolve();
        };
        logo.onerror = () => {
          // If logo fails to load, just draw text
          ctx.font = "600 16px 'Space Grotesk', sans-serif";
          ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
          ctx.textBaseline = "middle";
          ctx.fillText("Stocknear", paddingLeft, watermarkY + logoSize / 2);
          resolve();
        };
      });

      const url = compositeCanvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `${ticker}-chart-${DateTime.now().toFormat("yyyy-MM-dd-HHmmss")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Failed to download chart:", e);
      toast.error("Failed to download chart");
    }
  }

  function resetView() {
    if (!chart) return;
    applyRange(activeRange);
  }

  function clearIndicators() {
    const nextState: Record<string, boolean> = Object.fromEntries(
      indicatorDefinitions.map((item) => [item.id, false]),
    );
    indicatorState = nextState;
    if (chart) {
      syncIndicators();
    }
    ruleOfList = buildRuleList();
  }

  // Handler for overlay draw end - saves overlays to localStorage
  const handleOverlayDrawEnd = () => {
    if (!chart) return;
    try {
      const overlays = chart.getOverlays();
      if (overlays && Array.isArray(overlays)) {
        // Extract serializable overlay data
        const serializableOverlays = overlays.map((overlay: any) => ({
          name: overlay.name,
          points: overlay.points,
          extendData: overlay.extendData,
          styles: overlay.styles,
        }));
        saveChartOverlays(serializableOverlays);
      }
    } catch (e) {
      console.log("Failed to save overlays:", e);
    }
    return true;
  };

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
      clearIndicators();
      // Clear saved overlays from localStorage
      saveChartOverlays([]);
      activeTool = "cursor";
      if (chartMain) {
        chartMain.style.cursor = "default";
      }
      return;
    }

    if (toolId === "text") {
      const text = window.prompt("Annotation text") ?? "";
      chart.createOverlay({
        name: "simpleAnnotation",
        extendData: text,
        onDrawEnd: handleOverlayDrawEnd,
      });
      return;
    }

    const overlayName = toolOverlays[toolId];
    if (overlayName) {
      chart.createOverlay({
        name: overlayName,
        onDrawEnd: handleOverlayDrawEnd,
      });
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

  type CandleTooltipData = {
    prev: KLineData | null;
    current: KLineData | null;
    next: KLineData | null;
  };

  const buildMaTooltipLegends = (data?: CandleTooltipData) => {
    if (!chart || !isIndicatorEnabled("ma")) return [];
    const indicator =
      chart.getIndicators({ name: "SN_MA", paneId: "candle_pane" })?.[0] ??
      null;
    if (!indicator) return [];
    const result = indicator.result ?? [];
    if (!result.length) return [];
    const timestamp = data?.current?.timestamp;
    const index =
      typeof timestamp === "number"
        ? barIndexByTimestamp.get(timestamp)
        : undefined;
    const safeIndex = typeof index === "number" ? index : result.length - 1;
    if (safeIndex < 0) return [];
    const point = result[safeIndex] ?? {};
    const lineStyles =
      indicator.styles?.lines ?? chart.getStyles()?.indicator?.lines ?? [];
    const baseColor =
      chart.getStyles()?.candle?.tooltip?.legend?.color ?? "#e2e8f0";
    const legends = [];
    indicator.figures?.forEach((figure, figureIndex) => {
      const value = point[figure.key];
      if (typeof value !== "number" || !Number.isFinite(value)) return;
      legends.push({
        title: { text: figure.title ?? "", color: baseColor },
        value: {
          text: formatPrice(value),
          color: lineStyles?.[figureIndex]?.color ?? baseColor,
        },
      });
    });
    return legends;
  };

  const buildCandleTooltipLegends = (data: CandleTooltipData) => {
    const current = data?.current;
    const isUp = current && current.close >= current.open;
    const valueColor = isUp ? "#22ab94" : "#f23645";
    const titleColor = "#9ca3af";
    const volumeColor = "#9ca3af";

    // Calculate change and percentage
    let changeText = "";
    if (current && current.open && current.close) {
      const change = current.close - current.open;
      const changePercent = (change / current.open) * 100;
      const sign = change >= 0 ? "+" : "";
      changeText = `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
    }
    const changeColor = isUp ? "#22ab94" : "#f23645";

    // Check if small screen (below sm breakpoint = 640px)
    const isSmallScreen = $screenWidth < 640;

    // For line chart types, show value and volume
    const isLineChart = ["line_step", "area", "hlc_area"].includes(chartType);
    if (isLineChart) {
      return [
        {
          title: { text: "Value: ", color: titleColor },
          value: { text: "{close}", color: valueColor },
        },
        {
          title: { text: "V: ", color: titleColor },
          value: { text: "{volume}", color: volumeColor },
        },
        {
          title: { text: "", color: titleColor },
          value: { text: changeText, color: changeColor },
        },
      ];
    }

    // For small screens with candle charts, show only C V + change
    if (isSmallScreen) {
      return [
        {
          title: { text: "C: ", color: titleColor },
          value: { text: "{close}", color: valueColor },
        },
        {
          title: { text: "V: ", color: titleColor },
          value: { text: "{volume}", color: volumeColor },
        },
        {
          title: { text: "", color: titleColor },
          value: { text: changeText, color: changeColor },
        },
      ];
    }

    // For candlestick/bar charts, show O H L C V + change
    return [
      {
        title: { text: "O: ", color: titleColor },
        value: { text: "{open}", color: valueColor },
      },
      {
        title: { text: "H: ", color: titleColor },
        value: { text: "{high}", color: valueColor },
      },
      {
        title: { text: "L: ", color: titleColor },
        value: { text: "{low}", color: valueColor },
      },
      {
        title: { text: "C: ", color: titleColor },
        value: { text: "{close}", color: valueColor },
      },
      {
        title: { text: "V: ", color: titleColor },
        value: { text: "{volume}", color: volumeColor },
      },
      {
        title: { text: "", color: titleColor },
        value: { text: changeText, color: changeColor },
      },
    ];
  };

  function formatTimestamp(bar: KLineData | null) {
    if (!bar) return "--";
    const dt = DateTime.fromMillis(bar.timestamp, { zone });
    if (activeRange === "1D" || activeRange === "1min") {
      return dt.toFormat("MMM dd, HH:mm");
    }
    if (activeRange === "5D" || activeRange === "1M") {
      return dt.toFormat("MMM dd");
    }
    return dt.toFormat("MMM dd, yyyy");
  }

  onMount(async () => {
    if (typeof document !== "undefined") {
      previousBodyOverflow = document.body.style.overflow;
      previousHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }

    // Load chart settings from localStorage
    const savedSettings = loadChartSettings();
    if (savedSettings) {
      if (
        savedSettings.chartType &&
        chartTypeOptions.some((opt) => opt.id === savedSettings.chartType)
      ) {
        chartType = savedSettings.chartType as ChartTypeId;
        currentChartType = chartTypeOptions.find((opt) => opt.id === chartType);
      }
      if (
        savedSettings.activeRange &&
        timeframes.includes(savedSettings.activeRange)
      ) {
        activeRange = savedSettings.activeRange;
      }
    }

    if (!data?.user) {
      LoginPopup = (await import("$lib/components/LoginPopup.svelte")).default;
    }

    if (strategyList?.length) {
      ruleOfList = getStrategyRules(
        strategyList?.find((item) => item.id === selectedStrategy) ??
          strategyList?.at(0),
      );
      applyStrategyRules(ruleOfList);
    } else {
      applyDefaultIndicators();
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

    // Subscribe to chart events for earnings marker position updates
    chart.subscribeAction("onScroll", updateEarningsMarkers);
    chart.subscribeAction("onZoom", updateEarningsMarkers);
    chart.subscribeAction("onVisibleRangeChange", updateEarningsMarkers);

    // Always create volume indicator by default
    chart.createIndicator({ name: "SN_VOL", calcParams: [] }, false, {
      id: "sn_volume_pane",
      height: 80,
      minHeight: 60,
      dragEnabled: false,
      gap: { top: 0, bottom: 0 },
      axis: {
        show: true,
        axisLine: { show: false },
        tickLine: { show: false },
        tickText: { show: true },
      },
    });

    // Load saved overlays from localStorage
    const savedOverlays = loadChartOverlays();
    if (savedOverlays?.length > 0) {
      savedOverlays.forEach((overlay) => {
        try {
          chart.createOverlay({
            ...overlay,
            onDrawEnd: handleOverlayDrawEnd,
          });
        } catch (e) {
          console.log("Failed to restore overlay:", e);
        }
      });
    }

    resizeObserver = new ResizeObserver(() => {
      chart?.resize();
    });
    resizeObserver.observe(chartRoot);
  });

  beforeNavigate(() => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = previousBodyOverflow || "";
      document.documentElement.style.overflow = previousHtmlOverflow || "";
    }
  });

  onDestroy(() => {
    isComponentDestroyed = true;
    disconnectWebSocket();
    if (typeof document !== "undefined") {
      document.body.style.overflow = previousBodyOverflow || "";
      document.documentElement.style.overflow = previousHtmlOverflow || "";
    }

    if (chart) {
      chart.unsubscribeAction("onCrosshairChange", handleCrosshairChange);
      chart.unsubscribeAction("onScroll", updateEarningsMarkers);
      chart.unsubscribeAction("onZoom", updateEarningsMarkers);
      chart.unsubscribeAction("onVisibleRangeChange", updateEarningsMarkers);
      dispose(chart);
    }
    chart = null;
    chartRoot = null;
    chartMain = null;
    resizeObserver?.disconnect();
    resizeObserver = null;
  });

  $: {
    if ($isOpen && typeof window !== "undefined") {
      websocketRealtimeData();
    } else {
      disconnectWebSocket();
    }
  }

  afterUpdate(async () => {
    if (previousTicker !== ticker) {
      previousTicker = ticker;

      if (socket) {
        socket.close();
        await new Promise((resolve) => {
          socket?.addEventListener("close", resolve);
        });

        if (socket?.readyState === WebSocket?.CLOSED && !isComponentDestroyed) {
          await websocketRealtimeData();
        }
      }
    }
  });

  const resetMinuteBars = () => {
    // Seed minuteBars with the current intraday bars (typically 1-min for today)
    minuteBars = cloneBars(intradayBars);
    minuteBarsLastEndDate = "";
    minuteBarsLoading = false;

    const limitMs = getIntradayHistoryLimitMs("1min");
    const startTimestamp = minuteBars[0]?.timestamp ?? null;
    hasMoreMinuteHistory =
      startTimestamp !== null ? startTimestamp > limitMs : false;
  };

  // Called by the chart data loader when "1min" range wants more history
  const loadMoreMinuteBars = async (): Promise<{
    bars: KLineData[];
    hasMore: boolean;
  }> => {
    if (!ticker || minuteBarsLoading || !hasMoreMinuteHistory) {
      return { bars: [], hasMore: hasMoreMinuteHistory };
    }

    const endDate = getMinuteHistoryEndDate();
    if (!endDate || endDate === minuteBarsLastEndDate) {
      return { bars: [], hasMore: hasMoreMinuteHistory };
    }

    minuteBarsLoading = true;
    minuteBarsLastEndDate = endDate;

    // Reuse your existing endpoint helper (interval "1min")
    const result = await requestIntradayHistory("1min", endDate);

    if (result.bars.length) {
      const merged = mergeIntradayBars(minuteBars, result.bars);
      minuteBars = merged;

      const limitMs = getIntradayHistoryLimitMs("1min");
      const startTimestamp = minuteBars[0]?.timestamp ?? null;
      // respect both API hasMore + local retention limit
      hasMoreMinuteHistory =
        Boolean(result.hasMore) &&
        (startTimestamp !== null ? startTimestamp > limitMs : false);

      if (activeRange === "1min") {
        currentBars = transformBarsForType(minuteBars, chartType);
      }
    } else {
      // If API says no more, stop.
      hasMoreMinuteHistory = Boolean(result.hasMore) && hasMoreMinuteHistory;
    }

    minuteBarsLoading = false;
    return { bars: result.bars, hasMore: hasMoreMinuteHistory };
  };

  $: {
    ticker = data?.ticker ?? "";
    dailyBars = normalizeDaily(data?.historical ?? []);
    intradayBars = normalizeIntraday(data?.intraday ?? []);
    historicalEarnings = data?.historicalEarnings ?? [];
    nextEarnings = data?.nextEarnings ?? null;
  }

  $: if (
    typeof window !== "undefined" &&
    ticker &&
    ticker !== minuteBarsTicker
  ) {
    minuteBarsTicker = ticker;
    resetMinuteBars();
  }

  $: if (
    typeof window !== "undefined" &&
    ticker &&
    ticker === minuteBarsTicker &&
    minuteBars.length === 0 &&
    intradayBars.length
  ) {
    resetMinuteBars();
  }

  $: {
    pricePrecision = computePricePrecision([
      ...dailyBars,
      ...intradayBars,
      ...minuteBars,
    ]);
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

  // Update earnings markers when range or data changes
  $: if (chart && historicalEarnings) {
    activeRange;
    // Small delay to ensure chart has rendered
    setTimeout(updateEarningsMarkers, 100);
  }

  $: if (chart) {
    applyTheme($mode);
    applyChartType(chartType);
  }

  $: if (chart) {
    syncIndicators();
  }

  $: barIndexByTimestamp = new Map(
    currentBars.map((bar, index) => [bar.timestamp, index]),
  );

  $: if (strategyList?.length) {
    const activeStrategy =
      strategyList?.find((item) => item.id === selectedStrategy) ??
      strategyList?.at(0);
    const activeId = activeStrategy?.id ?? "";
    const signature = getRulesSignature(activeStrategy?.rules ?? []);
    if (
      activeId &&
      (activeId !== lastAppliedStrategyId ||
        signature !== lastAppliedStrategySignature)
    ) {
      lastAppliedStrategyId = activeId;
      lastAppliedStrategySignature = signature;
      if (selectedStrategy !== activeId) {
        selectedStrategy = activeId;
      }
      ruleOfList = getStrategyRules(activeStrategy);
      applyStrategyRules(ruleOfList);
    }
  } else if (lastAppliedStrategyId || lastAppliedStrategySignature) {
    lastAppliedStrategyId = "";
    lastAppliedStrategySignature = "";
    applyDefaultIndicators();
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

  $: seoCompanyName = data?.companyName || ticker;
  $: seoPrice =
    toNumber(data?.getStockQuote?.price) ??
    toNumber(lastClose) ??
    toNumber(dailyBars?.at(-1)?.close);
  $: seoChangePercent =
    toNumber(data?.getStockQuote?.changesPercentage) ?? changePercent;
  $: seoChangeSymbol =
    seoChangePercent !== null && seoChangePercent < 0 ? "▼" : "▲";
  $: seoChangeText =
    seoChangePercent !== null
      ? `${seoChangeSymbol} ${Math.abs(seoChangePercent).toFixed(2)}%`
      : "";
  $: seoPriceText = seoPrice !== null ? formatSeoPrice(seoPrice) : "N/A";
  $: seoMarketCap = toNumber(data?.getStockQuote?.marketCap);
  $: seoMarketCapText = seoMarketCap
    ? `$${(seoMarketCap / 1e9).toFixed(1)}B`
    : "N/A";
  $: resolvedAssetType = normalizeAssetType(data?.assetType);
  $: showDetailedAnalysis = Boolean(resolvedAssetType);
  $: detailRoot =
    resolvedAssetType === "etf"
      ? "etf"
      : resolvedAssetType === "index"
        ? "index"
        : "stocks";
  $: detailedAnalysisHref = showDetailedAnalysis
    ? `/${detailRoot}/${ticker}`
    : "";

  $: filteredIndicators = indicatorItems.filter((item) => {
    if (!indicatorSearchTerm.trim()) return true;
    const term = indicatorSearchTerm.trim().toLowerCase();
    return (
      item.label.toLowerCase().includes(term) ||
      item.id.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term)
    );
  });
  $: groupedIndicators = groupChartIndicators(filteredIndicators);

  $: currentChartType =
    chartTypeOptions.find((item) => item.id === chartType) ??
    chartTypeOptions[0];
</script>

<SEO
  title={`${ticker}${seoPriceText !== "N/A" ? ` ${seoPriceText}` : ""}${seoChangeText ? ` ${seoChangeText}` : ""} `}
  description={`Interactive ${seoCompanyName} (${ticker}) stock chart with real-time and historical prices, volume, and technical indicators. Latest price ${seoPriceText}, market cap ${seoMarketCapText}.`}
  keywords={`${ticker} stock chart, ${seoCompanyName} chart, ${ticker} technical analysis, ${ticker} live price, ${ticker} candlestick chart, stock charting, trading indicators, price action`}
  type="article"
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["WebPage", "FinancialProduct"],
    name: `${seoCompanyName} (${ticker}) Stock Chart`,
    headline: `${seoCompanyName} (${ticker}) Live Stock Chart`,
    description: `Real-time ${seoCompanyName} (${ticker}) chart with price, volume, and technical indicators`,
    url: `https://stocknear.com/chart/${ticker}`,
    author: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
      logo: {
        "@type": "ImageObject",
        url: "https://stocknear.com/favicon.png",
      },
    },
    dateModified: new Date().toISOString(),
    datePublished: new Date().toISOString(),
    about: {
      "@type": "FinancialProduct",
      name: `${seoCompanyName} Common Stock`,
      identifier: ticker,
      offers: {
        "@type": "Offer",
        price: seoPrice ?? undefined,
        priceCurrency: "USD",
        priceValidUntil: new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        ).toISOString(),
        availability: "https://schema.org/InStock",
      },
    },
    financialData: {
      "@type": "MonetaryAmount",
      currency: "USD",
      value: {
        marketCap: seoMarketCap,
        price: seoPrice ?? undefined,
        volume: data?.getStockQuote?.volume,
      },
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://stocknear.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Chart",
          item: "https://stocknear.com/chart",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `${seoCompanyName} (${ticker})`,
          item: `https://stocknear.com/chart/${ticker}`,
        },
      ],
    },
  }}
/>

<main
  class="h-[calc(100vh-56px)] w-full bg-[#09090b] text-neutral-200 overflow-hidden"
>
  <div class="flex h-full w-full flex-col overflow-hidden">
    <div
      class="flex flex-col sm:flex-wrap items-start sm:items-center sm:justify-between sm:gap-3 border-b border-neutral-800 bg-[#09090b] px-3 py-1.5 text-xs"
    >
      <div class="flex items-center justify-start w-full gap-3">
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

      <div
        class="flex flex-1 items-center gap-2 overflow-x-auto w-full mt-2 mb-2 sm:mb-0 sm:mt-0"
      >
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild let:builder>
            <Button
              builders={[builder]}
              class="cursor-pointer h-7 flex flex-row items-center rounded-full border border-gray-300 dark:border-zinc-700 px-2 py-1 text-sm font-semibold text-neutral-200 transition"
            >
              <Timer class="size-4 inline-block mr-0.5 " />
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
              class="min-w-[90px] h-7 rounded-full border border-gray-300 dark:border-zinc-700 px-2 py-1 text-sm font-semibold text-neutral-200 transition hover:border-neutral-700 hover:bg-neutral-800 bg-transparent flex items-center truncate"
            >
              <span class="inline-flex items-center gap-1 truncate">
                <svelte:component
                  this={currentChartType?.icon}
                  class="size-4"
                />
                {currentChartType?.label}
              </span>
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            side="bottom"
            align="start"
            sideOffset={10}
            class="w-52 h-fit max-h-72 overflow-y-auto scroller rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 shadow-none"
          >
            <DropdownMenu.Group>
              {#each chartTypeOptions as option}
                <DropdownMenu.Item
                  class={`text-sm cursor-pointer ${
                    chartType === option.id
                      ? "text-gray-900 dark:text-white font-semibold"
                      : "text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400"
                  }`}
                  on:click={() => setChartType(option.id)}
                >
                  <span class="inline-flex items-center gap-2">
                    <svelte:component this={option.icon} class="h-4 w-4" />
                    {option.label}
                  </span>
                </DropdownMenu.Item>
              {/each}
            </DropdownMenu.Group>
          </DropdownMenu.Content>
        </DropdownMenu.Root>

        <label
          for="indicatorModal"
          on:click={() => (indicatorSearchTerm = "")}
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
              class=" h-7 cursor-pointer flex flex-row items-center rounded-full border border-gray-300 dark:border-zinc-700 px-2 py-1 text-sm font-semibold text-neutral-200 transition hover:border-neutral-700 hover:bg-neutral-800"
            >
              <span class="truncate">
                {selectedStrategyTitle?.length > 0
                  ? selectedStrategyTitle
                  : "Select Strategy"}
              </span>
              <ChevronDown class="size-4 ml-1 mr-1" />
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
                    for={!data?.user ? "userLogin" : "addChartStrategy"}
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
        {#if data?.user}
          <label
            for={!data?.user ? "userLogin" : ""}
            on:click={() => handleSave(true)}
            class="cursor-pointer flex flex-row items-center rounded-full border border-gray-300 dark:border-zinc-700 px-2 py-1 text-sm font-semibold text-neutral-200 transition hover:border-neutral-700 hover:bg-neutral-800"
          >
            Save
          </label>

          {#if strategyList?.length > 0}
            <label
              for={!data?.user ? "userLogin" : "addChartStrategy"}
              class="cursor-pointer flex flex-row items-center rounded-full border border-gray-300 dark:border-zinc-700 px-2 py-1 text-sm font-semibold text-neutral-200 transition hover:border-neutral-700 hover:bg-neutral-800"
            >
              Save as New
            </label>
          {/if}
        {/if}
        {#if showDetailedAnalysis}
          <a
            href={detailedAnalysisHref}
            class="ml-auto whitespace-nowrap flex items-center gap-1 rounded-full border border-gray-300 dark:border-zinc-700 px-2 py-1 text-sm font-semibold text-neutral-200 transition hover:border-neutral-700 hover:bg-neutral-800"
            aria-label="Detailed Analysis"
          >
            Detailed Analysis
            <ArrowRight class="h-4 w-4" />
          </a>
        {/if}
      </div>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <div
        class="hidden sm:flex h-full w-12 flex-col items-center gap-2 border-r border-neutral-800 bg-[#09090b] py-3 overflow-hidden"
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
        <div
          class="mt-auto flex flex-col items-center gap-2 pb-3 overflow-hidden"
        >
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
          <button
            class="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-800 text-neutral-300 transition hover:border-neutral-700 hover:bg-neutral-800"
            on:click={downloadChart}
            aria-label="Download chart"
          >
            <Camera class="h-4 w-4" />
          </button>
        </div>
      </div>

      <div class="relative flex-1 bg-[#0b0b0b]">
        <div class="absolute inset-0" bind:this={chartContainer}></div>

        <!-- Watermark -->
        <div
          class="absolute bottom-[200px] left-3 hidden sm:flex items-center gap-2 pointer-events-none z-10"
        >
          <img
            src="/pwa-192x192.png"
            alt="Stocknear"
            class="size-9 rounded-full opacity-60"
          />
          <span class="text-white/60 text-base font-semibold text-md"
            >Stocknear</span
          >
        </div>

        <!-- Earnings markers overlay (only for non-intraday ranges) -->
        {#if isNonIntradayRange(activeRange) && earningsMarkers.length > 0}
          <div class="absolute inset-0 pointer-events-none z-[5]">
            {#each earningsMarkers as marker (marker.timestamp)}
              {#if marker?.visible}
                <button
                  class="absolute bottom-[145px] -translate-x-1/2 pointer-events-auto cursor-pointer transition-transform hover:scale-110"
                  style="left: {marker.x}px"
                  on:click={(e) => handleEarningsClick(marker, e)}
                  aria-label="View earnings details"
                >
                  <svg
                    width="24"
                    height="30"
                    viewBox="0 0 18 22"
                    class="drop-shadow-md"
                  >
                    {#if marker.isFuture}
                      <!-- Future earnings: outline style -->
                      <path
                        d="M1 3.5C1 1.84315 2.34315 0.5 4 0.5H14C15.6569 0.5 17 1.84315 17 3.5V13.5C17 14.4 16.6 15.2 15.9 15.8L9 21.5L2.1 15.8C1.4 15.2 1 14.4 1 13.5V3.5Z"
                        fill="#1a1a1a"
                        stroke="#B91C1C"
                        stroke-width="1.5"
                      />
                      <text
                        x="9"
                        y="11"
                        text-anchor="middle"
                        dominant-baseline="middle"
                        fill="#B91C1C"
                        font-size="10"
                        font-weight="bold"
                        font-family="system-ui, sans-serif">E</text
                      >
                    {:else}
                      <!-- Past earnings: solid fill -->
                      <path
                        d="M1 3.5C1 1.84315 2.34315 0.5 4 0.5H14C15.6569 0.5 17 1.84315 17 3.5V13.5C17 14.4 16.6 15.2 15.9 15.8L9 21.5L2.1 15.8C1.4 15.2 1 14.4 1 13.5V3.5Z"
                        fill="#B91C1C"
                      />
                      <text
                        x="9"
                        y="11"
                        text-anchor="middle"
                        dominant-baseline="middle"
                        fill="white"
                        font-size="10"
                        font-weight="bold"
                        font-family="system-ui, sans-serif">E</text
                      >
                    {/if}
                  </svg>
                </button>
              {/if}
            {/each}
          </div>
        {/if}

        <!-- Earnings popup -->
        {#if selectedEarnings}
          <div
            class="absolute z-[7] pointer-events-auto"
            style="left: {earningsPopupPosition.x}px; top: {earningsPopupPosition.y}px; transform: translate(-50%, -100%)"
          >
            <div
              class="bg-[#1a1a1a] border border-neutral-700 rounded-xl shadow-2xl p-4 min-w-[280px] max-w-[320px]"
            >
              <!-- Header -->
              <div class="flex items-center gap-2 mb-3">
                <svg
                  width="24"
                  height="30"
                  viewBox="0 0 18 22"
                  class="shrink-0"
                >
                  {#if selectedEarningsIsFuture}
                    <path
                      d="M1 3.5C1 1.84315 2.34315 0.5 4 0.5H14C15.6569 0.5 17 1.84315 17 3.5V13.5C17 14.4 16.6 15.2 15.9 15.8L9 21.5L2.1 15.8C1.4 15.2 1 14.4 1 13.5V3.5Z"
                      fill="#1a1a1a"
                      stroke="#B91C1C"
                      stroke-width="1.5"
                    />
                    <text
                      x="9"
                      y="11"
                      text-anchor="middle"
                      dominant-baseline="middle"
                      fill="#B91C1C"
                      font-size="10"
                      font-weight="bold"
                      font-family="system-ui, sans-serif">E</text
                    >
                  {:else}
                    <path
                      d="M1 3.5C1 1.84315 2.34315 0.5 4 0.5H14C15.6569 0.5 17 1.84315 17 3.5V13.5C17 14.4 16.6 15.2 15.9 15.8L9 21.5L2.1 15.8C1.4 15.2 1 14.4 1 13.5V3.5Z"
                      fill="#B91C1C"
                    />
                    <text
                      x="9"
                      y="11"
                      text-anchor="middle"
                      dominant-baseline="middle"
                      fill="white"
                      font-size="10"
                      font-weight="bold"
                      font-family="system-ui, sans-serif">E</text
                    >
                  {/if}
                </svg>
                <h3 class="text-white font-semibold">
                  {selectedEarningsIsFuture
                    ? "Upcoming Earnings"
                    : "Earnings & Revenue"}
                </h3>
                <button
                  class="cursor-pointer ml-auto text-neutral-400 hover:text-white transition"
                  on:click={closeEarningsPopup}
                  aria-label="Close"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <!-- Date info -->
              <div class="text-sm text-neutral-300 mb-3 space-y-1">
                <div class="flex justify-between">
                  <span class="text-neutral-500">Date</span>
                  <span class="flex items-center gap-1">
                    {DateTime.fromISO(selectedEarnings.date, { zone }).toFormat(
                      "EEE d MMM ''yy",
                    )}
                    {#if isBeforeMarketOpen(selectedEarnings)}
                      <svg
                        class="w-4 h-4 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    {:else if isAfterMarketClose(selectedEarnings)}
                      <svg
                        class="w-4 h-4 text-blue-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
                        />
                      </svg>
                    {/if}
                  </span>
                </div>
                {#if selectedEarnings.period && selectedEarnings.period_year}
                  <div class="flex justify-between">
                    <span class="text-neutral-500">Period Ending</span>
                    <span
                      >{selectedEarnings.period}
                      '{String(selectedEarnings.period_year).slice(-2)}</span
                    >
                  </div>
                {/if}
              </div>

              <!-- Earnings section -->
              <div class="border-t border-neutral-700 pt-3 mb-3">
                <div class="text-xs text-neutral-500 uppercase mb-2">
                  {selectedEarningsIsFuture ? "EPS Estimate" : "Earnings"}
                </div>
                <div class="text-sm space-y-1">
                  {#if !selectedEarningsIsFuture}
                    <div class="flex justify-between text-neutral-300">
                      <span>Reported</span>
                      <span
                        >{formatEarningsValue(
                          getEpsValue(selectedEarnings),
                        )}</span
                      >
                    </div>
                  {/if}
                  <div class="flex justify-between text-neutral-300">
                    <span>Estimate</span>
                    <span
                      >{formatEarningsValue(
                        getEpsEstimate(selectedEarnings),
                      )}</span
                    >
                  </div>
                  {#if !selectedEarningsIsFuture && calculateSurprise(getEpsValue(selectedEarnings), getEpsEstimate(selectedEarnings))}
                    {@const surprise = calculateSurprise(
                      getEpsValue(selectedEarnings),
                      getEpsEstimate(selectedEarnings),
                    )}
                    <div class="flex justify-between">
                      <span
                        class={surprise?.positive
                          ? "text-green-400"
                          : "text-red-400"}>Surprise</span
                      >
                      <span
                        class={surprise?.positive
                          ? "text-green-400"
                          : "text-red-400"}
                      >
                        {surprise?.positive ? "+" : ""}{surprise?.value.toFixed(
                          2,
                        )} ({surprise?.positive
                          ? "+"
                          : ""}{surprise?.percent.toFixed(2)}%)
                      </span>
                    </div>
                  {/if}
                  {#if selectedEarningsIsFuture}
                    {@const yoy = calculateYoYChange(
                      selectedEarnings?.["epsEst"],
                      selectedEarnings?.["epsPrior"],
                    )}
                    {#if yoy}
                      <div class="flex justify-between">
                        <span class="text-neutral-400">YoY Change</span>
                        <span
                          class={yoy.positive
                            ? "text-green-400"
                            : "text-red-400"}
                        >
                          {yoy.positive ? "+" : ""}{yoy.percent.toFixed(2)}%
                        </span>
                      </div>
                    {/if}
                  {/if}
                </div>
              </div>

              <!-- Revenue section -->
              <div class="border-t border-neutral-700 pt-3 mb-3">
                <div class="text-xs text-neutral-500 uppercase mb-2">
                  {selectedEarningsIsFuture ? "Revenue Estimate" : "Revenue"}
                </div>
                <div class="text-sm space-y-1">
                  {#if !selectedEarningsIsFuture}
                    <div class="flex justify-between text-neutral-300">
                      <span>Reported</span>
                      <span
                        >{formatRevenueValue(
                          getRevenueValue(selectedEarnings),
                        )}</span
                      >
                    </div>
                  {/if}
                  <div class="flex justify-between text-neutral-300">
                    <span>Estimate</span>
                    <span
                      >{formatRevenueValue(
                        getRevenueEstimate(selectedEarnings),
                      )}</span
                    >
                  </div>
                  {#if !selectedEarningsIsFuture && calculateSurprise(getRevenueValue(selectedEarnings), getRevenueEstimate(selectedEarnings))}
                    {@const surprise = calculateSurprise(
                      getRevenueValue(selectedEarnings),
                      getRevenueEstimate(selectedEarnings),
                    )}
                    <div class="flex justify-between">
                      <span
                        class={surprise?.positive
                          ? "text-green-400"
                          : "text-red-400"}>Surprise</span
                      >
                      <span
                        class={surprise?.positive
                          ? "text-green-400"
                          : "text-red-400"}
                      >
                        {surprise?.positive ? "+" : ""}{abbreviateNumber(
                          surprise?.value ?? 0,
                        )} ({surprise?.positive
                          ? "+"
                          : ""}{surprise?.percent.toFixed(2)}%)
                      </span>
                    </div>
                  {/if}
                  {#if selectedEarningsIsFuture}
                    {@const yoy = calculateYoYChange(
                      selectedEarnings?.["revenueEst"],
                      selectedEarnings?.["revenuePrior"],
                    )}
                    {#if yoy}
                      <div class="flex justify-between">
                        <span class="text-neutral-400">YoY Change</span>
                        <span
                          class={yoy.positive
                            ? "text-green-400"
                            : "text-red-400"}
                        >
                          {yoy.positive ? "+" : ""}{yoy.percent.toFixed(2)}%
                        </span>
                      </div>
                    {/if}
                  {/if}
                </div>
              </div>

              <!-- Link to more details -->
              <a
                href="/stocks/{ticker}/statistics/earnings"
                class="block w-full text-center py-2 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium rounded-lg transition"
              >
                More {ticker} financials
              </a>
            </div>
          </div>

          <!-- Click outside to close -->
          <button
            class="fixed inset-0 z-[6] cursor-default"
            on:click={closeEarningsPopup}
            aria-label="Close earnings popup"
          ></button>
        {/if}

        {#if !currentBars.length}
          <div class="absolute right-1/2 left-1/2 top-1/2 bottom-1/2">
            <div class="relative">
              <label
                class="shadow-sm bg-white/90 dark:bg-zinc-900/80 border border-gray-300 shadow dark:border-zinc-700 rounded-full h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              >
                <span
                  class="loading loading-spinner loading-md text-gray-700 dark:text-zinc-200"
                ></span>
              </label>
            </div>
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
        {#each Object.entries(groupedIndicators) as [category, indicators]}
          <div class="mt-4">
            <div
              class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
            >
              {category}
            </div>
            <div class="flex flex-wrap">
              {#each indicators as indicator}
                <div
                  class="flex w-full items-center space-x-1.5 py-1.5 md:w-1/2 lg:w-1/3 lg:py-1"
                >
                  <input
                    on:click={() => toggleIndicatorById(indicator.id)}
                    id={indicator.id}
                    type="checkbox"
                    checked={Boolean(indicatorState[indicator.id])}
                    class="h-[18px] w-[18px] rounded-sm ring-offset-0 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 lg:h-4 lg:w-4"
                  />
                  <div class="-mt-0.5">
                    <div class="flex items-center gap-1">
                      <label
                        for={indicator.id}
                        class="cursor-pointer text-[1rem]"
                      >
                        {indicator.label}
                      </label>
                      <InfoModal
                        id={`indicator-${indicator.id}`}
                        title={indicator.label}
                        callAPI={true}
                        parameter={indicator.infoKey || indicator.id}
                      />
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
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

{#if LoginPopup}
  <LoginPopup {form} />
{/if}

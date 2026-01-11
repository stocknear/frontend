<script lang="ts">
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import { afterUpdate, onDestroy, onMount } from "svelte";
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
  import ZoomIn from "lucide-svelte/icons/zoom-in";
  import ZoomOut from "lucide-svelte/icons/zoom-out";
  import ArrowRight from "lucide-svelte/icons/arrow-right";
  import ChartCandlestick from "lucide-svelte/icons/chart-candlestick";
  import ChartLine from "lucide-svelte/icons/chart-line";
  import Timer from "lucide-svelte/icons/timer";
  import Trash2 from "lucide-svelte/icons/trash-2";
  import IndentDecrease from "lucide-svelte/icons/indent-decrease";
  import IndentIncrease from "lucide-svelte/icons/indent-increase";
  import { groupChartIndicators, abbreviateNumber } from "$lib/utils";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
  export let form;

  const zone = "America/New_York";

  // Throttle utility for performance optimization
  function throttle<T extends (...args: any[]) => void>(
    fn: T,
    delay: number,
  ): T {
    let lastCall = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    return ((...args: Parameters<T>) => {
      const now = Date.now();
      const remaining = delay - (now - lastCall);
      if (remaining <= 0) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        lastCall = now;
        fn(...args);
      } else if (!timeoutId) {
        timeoutId = setTimeout(() => {
          lastCall = Date.now();
          timeoutId = null;
          fn(...args);
        }, remaining);
      }
    }) as T;
  }

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
  const CHART_EVENTS_KEY = "chart-events";
  const CHART_OVERLAYS_KEY = "chart-overlays";

  interface ChartSettings {
    chartType: string;
    activeRange: string;
    showEarnings?: boolean;
    showDividends?: boolean;
    showNewsFlow?: boolean;
  }

  const loadChartSettings = (): ChartSettings | null => {
    try {
      const saved = localStorage?.getItem(CHART_EVENTS_KEY);
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
      localStorage?.setItem(CHART_EVENTS_KEY, JSON.stringify(settings));
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

  // Dividend marker types and state
  interface DividendData {
    date: string; // ex-dividend date
    adjDividend: number;
    declarationDate?: string;
    recordDate?: string;
    paymentDate?: string;
  }

  interface DividendMarker {
    dividend: DividendData;
    timestamp: number;
    x: number;
    visible: boolean;
  }

  let historicalEarnings: EarningsData[] = [];
  let nextEarnings: EarningsData | null = null;
  let earningsMarkers: EarningsMarker[] = [];
  let showEarnings = false;
  let selectedEarnings: EarningsData | null = null;
  let selectedEarningsIsFuture = false;
  let earningsPopupPosition = { x: 0, y: 0 };

  let historicalDividends: DividendData[] = [];
  let dividendMarkers: DividendMarker[] = [];
  let showDividends = false;
  let selectedDividend: DividendData | null = null;
  let dividendPopupPosition = { x: 0, y: 0 };

  // News Flow (WIIM) marker types and state
  interface NewsData {
    date: string;
    text: string;
    changesPercentage: number | string;
  }

  interface NewsMarker {
    news: NewsData;
    timestamp: number;
    x: number;
    visible: boolean;
  }

  let newsFlowData: NewsData[] = [];
  let newsMarkers: NewsMarker[] = [];
  let showNewsFlow = false;
  let selectedNews: NewsData | null = null;
  let newsPopupPosition = { x: 0, y: 0 };

  // Cached timestamp maps for performance (avoid re-computing on every scroll/zoom)
  let earningsTimestampCache = new Map<EarningsData, number>();
  let dividendTimestampCache = new Map<DividendData, number>();
  let newsTimestampCache = new Map<NewsData, number>();

  // Cached chart rect for performance (avoid multiple getBoundingClientRect calls)
  let cachedChartRect: DOMRect | null = null;

  // GEX/DEX (Gamma/Delta Exposure) types and state
  interface GexDexStrikeData {
    strike: number;
    call_gex: number;
    put_gex: number;
    call_dex: number;
    put_dex: number;
    net_gex?: number;
    net_dex?: number;
  }

  interface GexDexLevel {
    strike: number;
    value: number; // net exposure value
    callValue: number;
    putValue: number;
    y: number; // pixel position
    visible: boolean;
    isPositive: boolean;
    intensity: number; // 0-1 for line thickness/opacity
  }

  let gexStrikeData: GexDexStrikeData[] = [];
  let dexStrikeData: GexDexStrikeData[] = [];
  let gexLevels: GexDexLevel[] = [];
  let dexLevels: GexDexLevel[] = [];
  let gexLoading = false;
  let dexLoading = false;
  let selectedGexLevel: GexDexLevel | null = null;
  let selectedDexLevel: GexDexLevel | null = null;
  let gexDexPopupPosition = { x: 0, y: 0 };

  // Open Interest (OI) types and state
  interface OiStrikeData {
    strike: number;
    call_oi: number;
    put_oi: number;
    total_oi?: number;
  }

  interface OiLevel {
    strike: number;
    callOi: number;
    putOi: number;
    totalOi: number;
    y: number;
    visible: boolean;
    intensity: number; // 0-1 for line thickness based on OI magnitude
  }

  let oiStrikeData: OiStrikeData[] = [];
  let oiLevels: OiLevel[] = [];
  let oiLoading = false;
  let selectedOiLevel: OiLevel | null = null;
  let oiPopupPosition = { x: 0, y: 0 };

  // Hottest Contracts types and state
  interface HottestContract {
    strike_price: number;
    option_type: "C" | "P";
    date_expiration: string;
    volume: number;
    open_interest: number;
    last: number;
    high: number;
    low: number;
    iv: number;
    total_premium: number;
    option_symbol: string;
  }

  interface HottestLevel {
    strike: number;
    optionType: "C" | "P";
    expiration: string;
    volume: number;
    openInterest: number;
    iv: number;
    premium: number;
    last: number;
    y: number;
    visible: boolean;
    intensity: number;
  }

  let hottestContractsData: HottestContract[] = [];
  let hottestLevels: HottestLevel[] = [];
  let hottestLoading = false;
  let selectedHottestLevel: HottestLevel | null = null;
  let hottestPopupPosition = { x: 0, y: 0 };

  $: isSubscribed = data?.user?.tier === "Pro";

  // Save event toggle states to localStorage
  const saveEventSettings = () => {
    const currentSettings = loadChartSettings() || {
      chartType: "candle_solid",
      activeRange: "1D",
    };
    saveChartSettings({
      ...currentSettings,
      showEarnings,
      showDividends,
      showNewsFlow,
    });
  };

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
    isOverlay?: boolean; // For GEX/DEX that render as overlays, not klinechart indicators
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
    {
      id: "gex",
      label: "Gamma Exposure (GEX)",
      indicatorName: "SN_GEX",
      category: "Options",
      defaultParams: [],
      pane: "candle",
      isOverlay: true,
    },
    {
      id: "dex",
      label: "Delta Exposure (DEX)",
      indicatorName: "SN_DEX",
      category: "Options",
      defaultParams: [],
      pane: "candle",
      isOverlay: true,
    },
    {
      id: "oi",
      label: "Open Interest (OI)",
      indicatorName: "SN_OI",
      category: "Options",
      defaultParams: [],
      pane: "candle",
      isOverlay: true,
    },
    {
      id: "hottest",
      label: "Hottest Contracts",
      indicatorName: "SN_HOTTEST",
      category: "Options",
      defaultParams: [],
      pane: "candle",
      isOverlay: true,
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

  // Drawing tool groups matching KlineCharts Pro
  interface ToolOption {
    id: string;
    label: string;
    overlay: string;
    icon: string;
  }

  interface ToolGroup {
    id: string;
    label: string;
    options: ToolOption[];
  }

  // SVG icon paths for each drawing tool - TradingView/KlineCharts Pro style (viewBox 22x22)
  const toolIcons: Record<string, string> = {
    // Lines
    horizontalStraightLine:
      "M12.41465,11L18.5,11C18.7761,11,19,11.22386,19,11.5C19,11.77614,18.7761,12,18.5,12L12.41465,12C12.20873,12.5826,11.65311,13,11,13C10.34689,13,9.79127,12.5826,9.58535,12L3.5,12C3.223857,12,3,11.77614,3,11.5C3,11.22386,3.223857,11,3.5,11L9.58535,11C9.79127,10.4174,10.34689,10,11,10C11.65311,10,12.20873,10.4174,12.41465,11Z",
    horizontalRayLine:
      "M6.91465,11L11.08535,11C11.29127,10.4174,11.84689,10,12.5,10C13.15311,10,13.70873,10.4174,13.91465,11L18.5,11C18.7761,11,19,11.22386,19,11.5C19,11.77614,18.7761,12,18.5,12L13.91465,12C13.70873,12.5826,13.15311,13,12.5,13C11.84689,13,11.29127,12.5826,11.08535,12L6.91465,12C6.70873,12.5826,6.15311,13,5.5,13C4.671573,13,4,12.32843,4,11.5C4,10.671573,4.671573,10,5.5,10C6.15311,10,6.70873,10.4174,6.91465,11Z",
    verticalStraightLine:
      "M11,12.41465L11,18.5C11,18.7761,11.22386,19,11.5,19C11.77614,19,12,18.7761,12,18.5L12,12.41465C12.5826,12.20873,13,11.65311,13,11C13,10.34689,12.5826,9.79127,12,9.58535L12,3.5C12,3.223857,11.77614,3,11.5,3C11.22386,3,11,3.223857,11,3.5L11,9.58535C10.4174,9.79127,10,10.34689,10,11C10,11.65311,10.4174,12.20873,11,12.41465Z",
    straightLine:
      "M5.146447,15.753C4.9511845,15.9483,4.9511845,16.2649,5.146447,16.4602C5.341709,16.6554,5.658291,16.6554,5.853554,16.4602L8.1566,14.15711C8.35241,14.25082,8.57173,14.3033,8.8033,14.3033C9.63173,14.3033,10.3033,13.63172,10.3033,12.80329C10.3033,12.57172,10.25082,12.35241,10.15712,12.15659L12.1566,10.15711C12.35241,10.25082,12.57173,10.30329,12.8033,10.30329C13.63173,10.30329,14.3033,9.63172,14.3033,8.80329C14.3033,8.57172,14.25082,8.35241,14.15712,8.15659L16.4602,5.853553C16.6554,5.658291,16.6554,5.341709,16.4602,5.146447C16.2649,4.9511843,15.9483,4.9511843,15.753,5.146447L13.45001,7.44948C13.25419,7.35577,13.03487,7.30329,12.8033,7.30329C11.97487,7.30329,11.3033,7.97487,11.3033,8.80329C11.3033,9.03487,11.35578,9.25419,11.44949,9.45001L9.45001,11.44948C9.25419,11.35577,9.03487,11.30329,8.8033,11.30329C7.97487,11.30329,7.3033,11.97487,7.3033,12.80329C7.3033,13.03487,7.35578,13.25419,7.44949,13.45001L5.146447,15.753Z",
    rayLine:
      "M7.57333,14.54568C7.66704,14.7415,7.71951,14.96081,7.71951,15.1924C7.71951,16.0208,7.04794,16.6924,6.21951,16.6924C5.39109,16.6924,4.71951,16.0208,4.71951,15.1924C4.71951,14.36395,5.39109,13.69238,6.21951,13.69238C6.45109,13.69238,6.67041,13.74486,6.86623,13.83857L9.8657,10.8391C9.77199,10.64328,9.71951,10.42396,9.71951,10.19238C9.71951,9.36395,10.39108,8.69238,11.21951,8.69238C11.45109,8.69238,11.67041,8.74486,11.86623,8.83857L15.46211,5.24265C15.65741,5.04738,15.97401,5.04738,16.16921,5.24265C16.36451,5.43791,16.36451,5.75449,16.16921,5.94975L12.57333,9.54568C12.66704,9.7415,12.71951,9.96081,12.71951,10.19238C12.71951,11.02081,12.04794,11.69238,11.21951,11.69238C10.98794,11.69238,10.76863,11.63991,10.57281,11.5462L7.57333,14.54568Z",
    arrow:
      "M17.0643,7.03386L18,3.58578L14.5078,4.5097L15.3537,5.34493L6.02026,14.56058C5.87635,14.51748,5.72366,14.49428,5.5655,14.49428C4.7009,14.49428,4,15.18638,4,16.04008C4,16.89378,4.7009,17.58578,5.5655,17.58578C6.43011,17.58578,7.13101,16.89378,7.13101,16.04008C7.13101,15.72228,7.03392,15.42698,6.86744,15.18138L16.0917,6.0736L17.0643,7.03386Z",
    segment:
      "M15.71951,8.46178C16.54791,8.46178,17.21951,7.79021,17.21951,6.96178C17.21951,6.13335,16.54791,5.46178,15.71951,5.46178C14.89108,5.46178,14.21951,6.13335,14.21951,6.96178C14.21951,7.19335,14.27199,7.41267,14.36569,7.60849L7.36622,14.60796C7.1704,14.51426,6.95108,14.46178,6.71951,14.46178C5.89109,14.46178,5.21951,15.13335,5.21951,15.96178C5.21951,16.79018,5.89109,17.46178,6.71951,17.46178C7.54794,17.46178,8.21951,16.79018,8.21951,15.96178C8.21951,15.73018,8.16703,15.51088,8.07332,15.31507L15.0728,8.31559C15.26861,8.4093,15.48791,8.46178,15.71951,8.46178Z",
    priceLine:
      "M6.91465,13.00505L18.5,13.00505C18.7761,13.00505,19,13.22891,19,13.50505C19,13.78119,18.7761,14.00505,18.5,14.00505L6.91465,14.00505C6.70873,14.58765,6.15311,15.00505,5.5,15.00505C4.671573,15.00505,4,14.33348,4,13.50505C4,12.67662,4.671573,12.00505,5.5,12.00505C6.15311,12.00505,6.70873,12.42245,6.91465,13.00505ZM7.81404,11.625L10.48591,11.625L10.48591,10.90625L9.65193,10.90625L9.65193,7.125L8.99763,7.125C8.71443,7.306641,8.4156,7.419922,7.96443,7.498047L7.96443,8.05078L8.77497,8.05078L8.77497,10.90625L7.81404,10.90625L7.81404,11.625ZM11.08162,11.625L14.0562,11.625L14.0562,10.88281L13.09724,10.88281C12.8863,10.88281,12.59333,10.90625,12.36482,10.93555C13.17537,10.11328,13.84724,9.2207,13.84724,8.39062C13.84724,7.541016,13.28865,7,12.4488,7C11.84333,7,11.44685,7.234375,11.03279,7.679688L11.52497,8.16797C11.74763,7.914062,12.0113,7.697266,12.33552,7.697266C12.7613,7.697266,13.00154,7.982422,13.00154,8.43359C13.00154,9.14648,12.29255,10.00781,11.08162,11.11523L11.08162,11.625ZM15.9605,11.75C16.8121,11.75,17.5269,11.2832,17.5269,10.4375C17.5269,9.82031,17.1422,9.43945,16.6441,9.30078L16.6441,9.27148C17.1129,9.08594,17.3824,8.7207,17.3824,8.21289C17.3824,7.421875,16.8004,7,15.9429,7C15.4215,7,14.9957,7.210938,14.6109,7.541016L15.066,8.11133C15.3258,7.849609,15.5836,7.697266,15.9019,7.697266C16.2789,7.697266,16.4957,7.914062,16.4957,8.28125C16.4957,8.70898,16.2301,9,15.4215,9L15.4215,9.63672C16.3804,9.63672,16.6383,9.91992,16.6383,10.38086C16.6383,10.79688,16.3336,11.03125,15.8824,11.03125C15.4742,11.03125,15.1578,10.82227,14.8922,10.55078L14.4781,11.13281C14.7906,11.48633,15.2652,11.75,15.9605,11.75Z",
    // Channels
    priceChannelLine:
      "M3.146447,14.17813C2.9511847,13.98283,2.9511847,13.66623,3.146447,13.47093L7.39146,9.22597C7.35417,9.09511,7.33421,8.95695,7.33421,8.81412C7.33421,7.9857,8.00578,7.31412,8.83421,7.31412C8.97703,7.31412,9.11519,7.33409,9.24605,7.37137L13.753,2.86437C13.9483,2.66911,14.2649,2.66911,14.4602,2.86437C14.6554,3.05964,14.6554,3.37622,14.4602,3.57148L10.06916,7.96248C10.23631,8.20439,10.33421,8.49783,10.33421,8.81412C10.33421,9.64255,9.66264,10.31412,8.83421,10.31412C8.51791,10.31412,8.22448,10.21623,7.98256,10.04908L3.853554,14.17813C3.658291,14.37333,3.341709,14.37333,3.146447,14.17813ZM7.67736,19.18853C7.4821,18.99323,7.4821,18.67663,7.67736,18.48143L9.9804,16.17833C9.88669,15.98253,9.83421,15.76323,9.83421,15.53163C9.83421,14.70323,10.50578,14.03163,11.33421,14.03163C11.56579,14.03163,11.78511,14.08413,11.98093,14.17783L13.9804,12.17836C13.8867,11.98254,13.8342,11.76322,13.8342,11.53164C13.8342,10.70321,14.5058,10.03164,15.3342,10.03164C15.5658,10.03164,15.7851,10.08412,15.9809,10.17783L18.284,7.8748C18.4792,7.67954,18.7958,7.67954,18.9911,7.8748C19.1863,8.07006,19.1863,8.38664,18.9911,8.58191L16.688,10.88494C16.7817,11.08076,16.8342,11.30007,16.8342,11.53164C16.8342,12.36007,16.1626,13.03163,15.3342,13.03163C15.1026,13.03163,14.8833,12.97913,14.6875,12.88543L12.688,14.88493C12.7817,15.08073,12.8342,15.30003,12.8342,15.53163C12.8342,16.36003,12.1626,17.03163,11.3342,17.03163C11.1026,17.03163,10.8833,16.97913,10.6875,16.88543L8.38446,19.18853C8.1892,19.38373,7.87262,19.38373,7.67736,19.18853Z",
    parallelStraightLine:
      "M3.14645,10.8536C2.95118,10.6583,2.95118,10.3417,3.14645,10.1464L10.1464,3.14645C10.3417,2.95118,10.6583,2.95118,10.8536,3.14645C11.0488,3.34171,11.0488,3.65829,10.8536,3.85355L3.85355,10.8536C3.65829,11.0488,3.34171,11.0488,3.14645,10.8536ZM11.1464,18.8536C10.9512,18.6583,10.9512,18.3417,11.1464,18.1464L18.1464,11.1464C18.3417,10.9512,18.6583,10.9512,18.8536,11.1464C19.0488,11.3417,19.0488,11.6583,18.8536,11.8536L11.8536,18.8536C11.6583,19.0488,11.3417,19.0488,11.1464,18.8536Z",
    // Shapes
    rect: "M19,4.5C19,5.15311,18.5826,5.70873,18,5.91465L18,18.5C18,18.7761,17.7761,19,17.5,19L5.91465,19C5.70873,19.5826,5.15311,20,4.5,20C3.671573,20,3,19.3284,3,18.5C3,17.8469,3.417404,17.2913,4,17.0854L4,4.5C4,4.22386,4.22386,4,4.5,4L16.0854,4C16.2913,3.417404,16.8469,3,17.5,3C18.3284,3,19,3.671573,19,4.5ZM5,5L16.0854,5C16.236,5.42621,16.5738,5.764,17,5.91465L17,18L5.91465,18C5.764,17.5738,5.42621,17.236,5,17.0854L5,5Z",
    circle:
      "M11,5C7.68629,5,5,7.68629,5,11C5,14.3137,7.68629,17,11,17C14.3137,17,17,14.3137,17,11C17,7.68629,14.3137,5,11,5ZM4,11C4,7.13401,7.13401,4,11,4C14.866,4,18,7.13401,18,11C18,14.866,14.866,18,11,18C7.13401,18,4,14.866,4,11Z",
    triangle:
      "M11.57625,6.9981C11.55099,6.99936,11.52557,7,11.5,7C11.34,7,11.18584,6.97495,11.04125,6.9285L5.55401,16.4327C5.71376,16.5905,5.83826,16.7839,5.91465,17L16.0854,17C16.2187,16.6227,16.4987,16.3147,16.8569,16.1445L11.57625,6.9981ZM12.50759,6.61122C12.81005,6.33679,13,5.94058,13,5.5C13,4.671573,12.32843,4,11.5,4C10.67157,4,10,4.671573,10,5.5C10,5.80059,10.08841,6.08052,10.24066,6.31522L4.64514,16.0069C4.59738,16.0023,4.54896,16,4.5,16C3.671573,16,3,16.6716,3,17.5C3,18.3284,3.671573,19,4.5,19C5.15311,19,5.70873,18.5826,5.91465,18L16.0854,18C16.2913,18.5826,16.8469,19,17.5,19C18.3284,19,19,18.3284,19,17.5C19,16.8365,18.5691,16.2735,17.9719,16.0757L12.50759,6.61122Z",
    parallelogram:
      "M19.6401,7.99355C20.4028,7.92291,21,7.2812,21,6.5C21,5.671573,20.3284,5,19.5,5C18.8469,5,18.2913,5.417404,18.0854,6L7.62067,6C7.34453,6,7.12067,6.22386,7.12067,6.5C7.12067,6.5479,7.12741,6.59423,7.13999,6.63809L3.2294,15.0243C2.530138,15.1517,2,15.764,2,16.5C2,17.3284,2.671573,18,3.5,18C4.15311,18,4.70873,17.5826,4.91465,17L14.5963,17C14.6456,17.076,14.7162,17.1396,14.8044,17.1807C15.0546,17.2974,15.3521,17.1891,15.4688,16.9388L19.6401,7.99355ZM14.7896,16.0293L18.6551,7.7396C18.3942,7.56144,18.1925,7.30307,18.0854,7L8.0746,7L4.25044,15.2009C4.55701,15.3784,4.79493,15.6613,4.91465,16L14.6207,16C14.68,16,14.7368,16.0103,14.7896,16.0293Z",
    // Fibonacci
    fibonacciLine:
      "M13.1889,6C12.98303,6.5826,12.42741,7,11.7743,7C11.12119,7,10.56557,6.5826,10.35965,6L3.5,6C3.223857,6,3,5.77614,3,5.5C3,5.22386,3.223857,5,3.5,5L10.35965,5C10.56557,4.4174,11.12119,4,11.7743,4C12.42741,4,12.98303,4.4174,13.1889,5L18.5,5C18.7761,5,19,5.22386,19,5.5C19,5.77614,18.7761,6,18.5,6L13.1889,6ZM3,8.5C3,8.22386,3.223857,8,3.5,8L18.5,8C18.7761,8,19,8.22386,19,8.5C19,8.77614,18.7761,9,18.5,9L3.5,9C3.223857,9,3,8.77614,3,8.5ZM3.27855,11.5C3.27855,11.22386,3.50241,11,3.77855,11L18.7785,11C19.0547,11,19.2785,11.22386,19.2785,11.5C19.2785,11.77614,19.0547,12,18.7785,12L3.77855,12C3.50241,12,3.27855,11.77614,3.27855,11.5ZM3.13927,14.5C3.13927,14.2239,3.36312,14,3.63927,14L18.6393,14C18.9154,14,19.1393,14.2239,19.1393,14.5C19.1393,14.7761,18.9154,15,18.6393,15L3.63927,15C3.36312,15,3.13927,14.7761,3.13927,14.5ZM13.1889,18C12.98303,18.5826,12.42741,19,11.7743,19C11.12119,19,10.56557,18.5826,10.35965,18L3.77855,18C3.50241,18,3.27855,17.7761,3.27855,17.5C3.27855,17.2239,3.50241,17,3.77855,17L10.35965,17C10.56557,16.4174,11.12119,16,11.7743,16C12.42741,16,12.98303,16.4174,13.1889,17L18.7785,17C19.0547,17,19.2785,17.2239,19.2785,17.5C19.2785,17.7761,19.0547,18,18.7785,18L13.1889,18Z",
    fibonacciExtension:
      "M17,4.5C17,5.32843,16.3284,6,15.5,6C15.0931,6,14.7241,5.83802,14.4539,5.57503L5.98992,8.32515C5.99658,8.38251,6,8.44085,6,8.5C6,9.15311,5.5826,9.70873,5,9.91465L5,11.08535C5.42621,11.236,5.764,11.57379,5.91465,12L19.5,12C19.7761,12,20,12.22386,20,12.5C20,12.77614,19.7761,13,19.5,13L5.91465,13C5.70873,13.5826,5.15311,14,4.5,14C3.671573,14,3,13.3284,3,12.5C3,11.84689,3.417404,11.29127,4,11.08535L4,9.91465C3.417404,9.70873,3,9.15311,3,8.5C3,7.67157,3.671573,7,4.5,7C4.90411,7,5.2709,7.15981,5.54062,7.41967L14.0093,4.66802C14.0032,4.61286,14,4.5568,14,4.5C14,3.671573,14.6716,3,15.5,3C16.3284,3,17,3.671573,17,4.5ZM4,15.5C4,15.2239,4.22386,15,4.5,15L19.5,15C19.7761,15,20,15.2239,20,15.5C20,15.7761,19.7761,16,19.5,16L4.5,16C4.22386,16,4,15.7761,4,15.5ZM4,18.5C4,18.2239,4.22386,18,4.5,18L19.5,18C19.7761,18,20,18.2239,20,18.5C20,18.7761,19.7761,19,19.5,19L4.5,19C4.22386,19,4,18.7761,4,18.5Z",
    fibonacciSpeedResistanceFan:
      "M4,17.0854L4,3.5C4,3.223858,4.22386,3,4.5,3C4.77614,3,5,3.223858,5,3.5L5,10L7.57584,10L9.8127,4.46359C9.91614,4.20756,10.20756,4.08386,10.46359,4.1873C10.71963,4.29075,10.84333,4.58216,10.73988,4.8382L8.65438,10L11.08535,10C11.29127,9.4174,11.84689,9,12.5,9C12.65154,9,12.79784,9.02247,12.93573,9.06427L16.6464,5.35355C16.8417,5.15829,17.1583,5.15829,17.3536,5.35355C17.5488,5.54882,17.5488,5.8654,17.3536,6.06066L13.7475,9.66675C13.907,9.90508,14,10.19168,14,10.5C14,11.15311,13.5826,11.70873,13,11.91465L13,14.3638L18.3714,12.1936C18.6274,12.09015,18.9188,12.21385,19.0222,12.46989C19.1257,12.72592,19.002,13.0173,18.746,13.1208L13,15.4423L13,18L19.5,18C19.7761,18,20,18.2239,20,18.5C20,18.7761,19.7761,19,19.5,19L5.91465,19C5.70873,19.5826,5.15311,20,4.5,20C3.671573,20,3,19.3284,3,18.5C3,17.8469,3.417404,17.2913,4,17.0854ZM6.37295,17.0413L12,14.7678L12,11.91465C11.88136,11.87271,11.76956,11.81627,11.66675,11.74746L6.37295,17.0413ZM12,15.8463L6.66947,18L12,18L12,15.8463ZM6.38629,15.6137L8.25035,11L11,11L6.38629,15.6137ZM5,11L7.17182,11L5,16.3754L5,11Z",
    fibonacciCircle:
      "M11,5C7.68629,5,5,7.68629,5,11C5,14.3137,7.68629,17,11,17C14.3137,17,17,14.3137,17,11C17,7.68629,14.3137,5,11,5ZM4,11C4,7.13401,7.13401,4,11,4C14.866,4,18,7.13401,18,11C18,14.866,14.866,18,11,18C7.13401,18,4,14.866,4,11ZM11,7C8.79086,7,7,8.79086,7,11C7,13.2091,8.79086,15,11,15C13.2091,15,15,13.2091,15,11C15,8.79086,13.2091,7,11,7ZM11,9C9.89543,9,9,9.89543,9,11C9,12.1046,9.89543,13,11,13C12.1046,13,13,12.1046,13,11C13,9.89543,12.1046,9,11,9Z",
    // Patterns
    xabcd:
      "M5.92159,5.93994C6.04014,5.90529,6.15262,5.85639,6.25704,5.79523L9.12729,9.89437C9.04545,10.07959,9,10.28449,9,10.5C9,10.79522,9.08529,11.07053,9.23257,11.30262L4.97573,16.7511L5.92159,5.93994ZM4.92259,5.88484C4.38078,5.65866,4,5.1238,4,4.5C4,3.671573,4.67157,3,5.5,3C6.2157,3,6.81433,3.50124,6.96399,4.17183L15.1309,4.88634C15.3654,4.36387,15.8902,4,16.5,4C17.3284,4,18,4.67157,18,5.5C18,6.08983,17.6596,6.60015,17.1645,6.84518L18.4264,14.0018C18.4508,14.0006,18.4753,14,18.5,14C19.3284,14,20,14.6716,20,15.5C20,16.3284,19.3284,17,18.5,17C17.9325,17,17.4386,16.6849,17.1838,16.22L5.99686,18.5979C5.94643,19.3807,5.29554,20,4.5,20C3.671573,20,3,19.3284,3,18.5C3,17.8693,3.38929,17.3295,3.94071,17.1077L4.92259,5.88484ZM5.72452,17.6334C5.69799,17.596,5.6698,17.5599,5.64004,17.5251L10.01843,11.921C10.16958,11.9722,10.33155,12,10.5,12C10.80059,12,11.08052,11.9116,11.31522,11.7593L17.0606,15.0765C17.0457,15.1271,17.0335,15.1789,17.0239,15.2317L5.72452,17.6334ZM11.92855,10.9587L17.4349,14.1379L16.1699,6.96356C15.9874,6.92257,15.8174,6.8483,15.6667,6.74746L11.99771,10.4165C11.99923,10.4441,12,10.472,12,10.5C12,10.66,11.97495,10.8142,11.92855,10.9587ZM10.5,9C10.25983,9,10.03285,9.05644,9.83159,9.15679L7.04919,5.1831L15.0493,5.88302C15.054,5.90072,15.059,5.91829,15.0643,5.93573L11.56066,9.43934C11.28921,9.16789,10.91421,9,10.5,9Z",
    abcd: "M21,5.5C21,6.32843,20.3284,7,19.5,7C19.4136,7,19.3289,6.99269,19.2465,6.97866L15.6257,15.5086C15.8587,15.7729,16,16.12,16,16.5C16,17.3284,15.3284,18,14.5,18C13.8469,18,13.2913,17.5826,13.0854,17L3.91465,17C3.70873,17.5826,3.15311,18,2.5,18C1.671573,18,1,17.3284,1,16.5C1,15.6716,1.671573,15,2.5,15C2.584,15,2.66643,15.0069,2.74668,15.0202L6.36934,6.48574C6.13933,6.22213,6,5.87733,6,5.5C6,4.671573,6.67157,4,7.5,4C8.15311,4,8.70873,4.417404,8.91465,5L18.0854,5C18.2913,4.417404,18.8469,4,19.5,4C20.3284,4,21,4.671573,21,5.5ZM18.0854,6L8.91465,6C8.89258,6.06243,8.8665,6.12296,8.83672,6.18128L13.9814,15.0921C14.143,15.0325,14.3177,15,14.5,15C14.584,15,14.6664,15.0069,14.7467,15.0202L18.3693,6.48574C18.2462,6.3446,18.149,6.1802,18.0854,6ZM13.2036,15.745L8.08611,6.88118C7.90605,6.95768,7.70797,7,7.5,7C7.41359,7,7.32888,6.99269,7.24647,6.97866L3.62571,15.5086C3.7512,15.651,3.8501,15.8174,3.91465,16L13.0854,16C13.1169,15.9108,13.1566,15.8255,13.2036,15.745Z",
    // Utility icons (viewBox 28x28 for TradingView consistency)
    magnet:
      "M14 10a2 2 0 0 0-2 2v11H6V12c0-4.416 3.584-8 8-8s8 3.584 8 8v11h-6V12a2 2 0 0 0-2-2zm-3 2a3 3 0 0 1 6 0v10h4V12c0-3.864-3.136-7-7-7s-7 3.136-7 7v10h4V12z M6.5 18h5v1h-5zm10 0h5v1h-5z",
    visible:
      "M11,17C5.80945,17,3.66772,12.85,3.11339,11.575C2.9622,11.2,2.9622,10.8,3.11339,10.425C3.66772,9.15,5.80945,5,11,5C16.1654,5,18.3323,9.15,18.8866,10.425C19.0378,10.8,19.0378,11.2,18.8866,11.575C18.3323,12.85,16.1654,17,11,17ZM4.04567,10.8C3.99528,10.925,3.99528,11.05,4.04567,11.175C4.52441,12.325,6.43937,16,11,16C15.5606,16,17.4756,12.325,17.9543,11.2C18.0047,11.075,18.0047,10.95,17.9543,10.825C17.4756,9.675,15.5606,6,11,6C6.43937,6,4.52441,9.675,4.04567,10.8ZM11,13.5C9.61417,13.5,8.48032,12.375,8.48032,11C8.48032,9.625,9.61417,8.5,11,8.5C12.38583,8.5,13.5197,9.625,13.5197,11C13.5197,12.375,12.38583,13.5,11,13.5ZM11,9.5C10.1685,9.5,9.48819,10.175,9.48819,11C9.48819,11.825,10.1685,12.5,11,12.5C11.8315,12.5,12.51181,11.825,12.51181,11C12.51181,10.175,11.8315,9.5,11,9.5Z",
    invisible:
      "M5.80417,14.9887L4.62563,16.1673C4.43037,16.3625,4.43037,16.6791,4.62563,16.8744C4.82089,17.0696,5.13748,17.0696,5.33274,16.8744L6.62638,15.5807C7.75595,16.2901,9.19328,16.7929,11,16.7929C16.1654,16.7929,18.3323,12.64289,18.8866,11.36789C19.0378,10.99289,19.0378,10.59289,18.8866,10.21789C18.5549,9.45486,17.6456,7.66212,15.8617,6.34545L17.3536,4.853553C17.5488,4.658291,17.5488,4.341709,17.3536,4.146447C17.1583,3.9511845,16.8417,3.9511845,16.6464,4.146447L15.0014,5.7915C13.9314,5.1969,12.61166,4.792893,11,4.792893C5.80945,4.792893,3.66772,8.94289,3.11339,10.21789C2.9622,10.59289,2.9622,10.99289,3.11339,11.36789C3.42444,12.08333,4.2353,13.70399,5.80417,14.9887ZM7.36012,14.847C8.32327,15.4074,9.52286,15.7929,11,15.7929C15.5606,15.7929,17.4756,12.11789,17.9543,10.99289C18.0047,10.86789,18.0047,10.74289,17.9543,10.61789C17.659,9.90846,16.8171,8.23812,15.1447,7.06241L12.96929,9.23782C13.3134,9.66543,13.5197,10.20642,13.5197,10.79289C13.5197,12.16789,12.38583,13.29289,11,13.29289C10.41596,13.29289,9.87667,13.09308,9.44815,12.75896L7.36012,14.847ZM8.79461,11.99829L6.5201,14.2728C5.06905,13.12119,4.32057,11.62825,4.04567,10.96789C3.99528,10.84289,3.99528,10.71789,4.04567,10.59289C4.52441,9.46789,6.43937,5.79289,11,5.79289C12.28868,5.79289,13.3661,6.08632,14.2596,6.53329L12.19759,8.5953C11.84086,8.40257,11.43271,8.29289,11,8.29289C9.61417,8.29289,8.48032,9.41789,8.48032,10.79289C8.48032,11.22918,8.59447,11.64029,8.79461,11.99829ZM10.16528,12.04183C10.40487,12.20032,10.69207,12.29289,11,12.29289C11.8315,12.29289,12.51181,11.61789,12.51181,10.79289C12.51181,10.48318,12.41593,10.1946,12.25216,9.95494L10.16528,12.04183ZM11.43602,9.35687L9.55616,11.23674C9.512,11.09633,9.48819,10.94724,9.48819,10.79289C9.48819,9.96789,10.1685,9.29289,11,9.29289C11.15142,9.29289,11.29782,9.31528,11.43602,9.35687Z",
    remove:
      "M18 7h5v1h-2.01l-1.33 14.64a1.5 1.5 0 0 1-1.5 1.36H9.84a1.5 1.5 0 0 1-1.49-1.36L7.01 8H5V7h5V6c0-1.1.9-2 2-2h4a2 2 0 0 1 2 2v1Zm-6-2a1 1 0 0 0-1 1v1h6V6a1 1 0 0 0-1-1h-4ZM8.02 8l1.32 14.54a.5.5 0 0 0 .5.46h8.33a.5.5 0 0 0 .5-.46L19.99 8H8.02Z",
  };

  const toolGroups: ToolGroup[] = [
    {
      id: "lines",
      label: "Lines",
      options: [
        {
          id: "horizontalStraightLine",
          label: "Horizontal Line",
          overlay: "horizontalStraightLine",
          icon: "horizontalStraightLine",
        },
        {
          id: "horizontalRayLine",
          label: "Horizontal Ray",
          overlay: "horizontalRayLine",
          icon: "horizontalRayLine",
        },
        {
          id: "horizontalSegment",
          label: "Horizontal Segment",
          overlay: "horizontalSegment",
          icon: "horizontalSegment",
        },
        {
          id: "verticalStraightLine",
          label: "Vertical Line",
          overlay: "verticalStraightLine",
          icon: "verticalStraightLine",
        },
        {
          id: "verticalRayLine",
          label: "Vertical Ray",
          overlay: "verticalRayLine",
          icon: "verticalRayLine",
        },
        {
          id: "verticalSegment",
          label: "Vertical Segment",
          overlay: "verticalSegment",
          icon: "verticalSegment",
        },
        {
          id: "straightLine",
          label: "Straight Line",
          overlay: "straightLine",
          icon: "straightLine",
        },
        {
          id: "rayLine",
          label: "Ray Line",
          overlay: "rayLine",
          icon: "rayLine",
        },
        {
          id: "segment",
          label: "Segment",
          overlay: "segment",
          icon: "segment",
        },
        {
          id: "priceLine",
          label: "Price Line",
          overlay: "priceLine",
          icon: "priceLine",
        },
      ],
    },
    {
      id: "channels",
      label: "Channels",
      options: [
        {
          id: "priceChannelLine",
          label: "Price Channel",
          overlay: "priceChannelLine",
          icon: "priceChannelLine",
        },
        {
          id: "parallelStraightLine",
          label: "Parallel Channel",
          overlay: "parallelStraightLine",
          icon: "parallelStraightLine",
        },
      ],
    },
    {
      id: "shapes",
      label: "Shapes",
      options: [
        { id: "circle", label: "Circle", overlay: "circle", icon: "circle" },
        { id: "rect", label: "Rectangle", overlay: "rect", icon: "rect" },
      ],
    },
    {
      id: "fibonacci",
      label: "Fibonacci",
      options: [
        {
          id: "fibonacciLine",
          label: "Fib Retracement",
          overlay: "fibonacciLine",
          icon: "fibonacciLine",
        },
        {
          id: "fibonacciExtension",
          label: "Fib Extension",
          overlay: "fibonacciExtension",
          icon: "fibonacciExtension",
        },
      ],
    },
    {
      id: "waves",
      label: "Patterns",
      options: [
        {
          id: "xabcd",
          label: "XABCD Pattern",
          overlay: "xabcd",
          icon: "xabcd",
        },
        { id: "abcd", label: "ABCD Pattern", overlay: "abcd", icon: "abcd" },
      ],
    },
  ];

  // Track selected tool for each group
  let selectedToolByGroup: Record<string, string> = {
    lines: "horizontalStraightLine",
    channels: "priceChannelLine",
    shapes: "circle",
    fibonacci: "fibonacciLine",
    waves: "xabcd",
  };

  // Toolbar state
  let drawingsLocked = false;
  let drawingsVisible = true;
  let openDropdownId: string | null = null;
  let toolbarExpanded = true;
  let drawingMode: "normal" | "weak_magnet" | "strong_magnet" = "normal";
  let dropdownStates: Record<string, boolean> = {
    lines: false,
    channels: false,
    shapes: false,
    fibonacci: false,
    waves: false,
    magnet: false,
  };

  // Helper function to get current icon for a group
  function getGroupIcon(groupId: string): string {
    const selectedTool = selectedToolByGroup[groupId];
    return toolIcons[selectedTool] || toolIcons.horizontalStraightLine;
  }

  const indicatorItems = indicatorDefinitions.map((item) => ({
    id: item.id,
    label: item.label,
    category: item.category,
    infoKey: item.infoKey,
  }));
  let filteredIndicators = indicatorItems;
  let groupedIndicators = groupChartIndicators(indicatorItems);

  // Legacy toolOverlays kept for backwards compatibility
  const toolOverlays: Record<string, string> = {
    trend: "segment",
    ray: "rayLine",
    line: "straightLine",
    fib: "fibonacciLine",
    channel: "priceChannelLine",
    xabcd: "xabcd",
    rect: "rect",
    circle: "circle",
    brush: "brush",
  };

  // Track overlay IDs for lock/visibility control
  let overlayIds: string[] = [];

  // Functions for new toolbar
  function activateDrawingTool(
    groupId: string,
    toolId: string,
    overlay: string,
  ) {
    selectedToolByGroup[groupId] = toolId;
    activeTool = toolId;
    openDropdownId = null;
    if (!chart) return;

    // Map drawing mode to klinecharts overlay mode
    const overlayMode =
      drawingMode === "normal"
        ? "normal"
        : drawingMode === "weak_magnet"
          ? "weak_magnet"
          : "strong_magnet";

    chart.createOverlay({
      name: overlay,
      lock: drawingsLocked,
      visible: drawingsVisible,
      mode: overlayMode,
      onDrawEnd: (event: any) => {
        // Track the overlay ID
        if (event?.overlay?.id) {
          overlayIds = [...overlayIds, event.overlay.id];
        }
        handleOverlayDrawEnd(event);
      },
    });
  }

  function toggleDrawingsLock() {
    drawingsLocked = !drawingsLocked;
    // Update all tracked overlays
    if (chart && overlayIds.length > 0) {
      overlayIds.forEach((id) => {
        chart.overrideOverlay({ id, lock: drawingsLocked });
      });
    }
  }

  function toggleDrawingsVisibility() {
    drawingsVisible = !drawingsVisible;
    if (chart && overlayIds.length > 0) {
      overlayIds.forEach((id) => {
        chart.overrideOverlay({ id, visible: drawingsVisible });
      });
    }
  }

  function removeAllDrawings() {
    if (chart) {
      chart.removeOverlay();
      saveChartOverlays([]);
      overlayIds = [];
    }
    activeTool = "cursor";
  }

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

    // XABCD Harmonic Pattern (5 points: X, A, B, C, D)
    registerOverlay({
      name: "xabcd",
      totalStep: 6,
      needDefaultPointFigure: true,
      needDefaultXAxisFigure: true,
      needDefaultYAxisFigure: true,
      createPointFigures: ({ coordinates }) => {
        if (coordinates.length === 0) return [];

        const figures: any[] = [];
        const tags = ["X", "A", "B", "C", "D"];

        // Text labels at each point
        coordinates.forEach((coordinate, i) => {
          if (i < tags.length) {
            figures.push({
              type: "text",
              attrs: {
                x: coordinate.x,
                y: coordinate.y,
                text: `(${tags[i]})`,
                baseline: "bottom",
              },
              ignoreEvent: true,
            });
          }
        });

        // Main line connecting all points sequentially
        if (coordinates.length >= 2) {
          figures.push({
            type: "line",
            attrs: { coordinates: [...coordinates] },
          });
        }

        // Dashed line: X-B
        if (coordinates.length > 2) {
          figures.push({
            type: "line",
            attrs: { coordinates: [coordinates[0], coordinates[2]] },
            styles: { style: "dashed" },
            ignoreEvent: true,
          });
        }

        // Dashed line: A-C
        if (coordinates.length > 3) {
          figures.push({
            type: "line",
            attrs: { coordinates: [coordinates[1], coordinates[3]] },
            styles: { style: "dashed" },
            ignoreEvent: true,
          });
        }

        // Dashed line: B-D
        if (coordinates.length > 4) {
          figures.push({
            type: "line",
            attrs: { coordinates: [coordinates[2], coordinates[4]] },
            styles: { style: "dashed" },
            ignoreEvent: true,
          });
        }

        // Polygon X-A-B
        if (coordinates.length >= 3) {
          figures.push({
            type: "polygon",
            attrs: {
              coordinates: [coordinates[0], coordinates[1], coordinates[2]],
            },
            styles: { color: "rgba(22, 119, 255, 0.15)" },
            ignoreEvent: true,
          });
        }

        // Polygon B-C-D
        if (coordinates.length >= 5) {
          figures.push({
            type: "polygon",
            attrs: {
              coordinates: [coordinates[2], coordinates[3], coordinates[4]],
            },
            styles: { color: "rgba(22, 119, 255, 0.15)" },
            ignoreEvent: true,
          });
        }

        return figures;
      },
    });

    // ABCD Pattern (4 points: A, B, C, D)
    registerOverlay({
      name: "abcd",
      totalStep: 5,
      needDefaultPointFigure: true,
      needDefaultXAxisFigure: true,
      needDefaultYAxisFigure: true,
      createPointFigures: ({ coordinates }) => {
        if (coordinates.length === 0) return [];

        const figures: any[] = [];
        const tags = ["A", "B", "C", "D"];

        // Text labels at each point
        coordinates.forEach((coordinate, i) => {
          if (i < tags.length) {
            figures.push({
              type: "text",
              attrs: {
                x: coordinate.x,
                y: coordinate.y,
                text: `(${tags[i]})`,
                baseline: "bottom",
              },
              ignoreEvent: true,
            });
          }
        });

        // Main line connecting all points sequentially
        if (coordinates.length >= 2) {
          figures.push({
            type: "line",
            attrs: { coordinates: [...coordinates] },
          });
        }

        // Dashed line: A-C
        if (coordinates.length > 2) {
          figures.push({
            type: "line",
            attrs: { coordinates: [coordinates[0], coordinates[2]] },
            styles: { style: "dashed" },
            ignoreEvent: true,
          });
        }

        // Dashed line: B-D
        if (coordinates.length > 3) {
          figures.push({
            type: "line",
            attrs: { coordinates: [coordinates[1], coordinates[3]] },
            styles: { style: "dashed" },
            ignoreEvent: true,
          });
        }

        return figures;
      },
    });

    // Trend-Based Fibonacci Extension (3 points like TradingView)
    registerOverlay({
      name: "fibonacciExtension",
      totalStep: 4,
      needDefaultPointFigure: true,
      needDefaultXAxisFigure: true,
      needDefaultYAxisFigure: true,
      createPointFigures: ({ chart, coordinates, bounding, overlay, yAxis }) => {
        const points = overlay.points;
        if (coordinates.length < 2) return [];

        let precision = 2;
        if (yAxis?.isInCandle() ?? true) {
          precision = chart.getSymbol()?.pricePrecision ?? 2;
        }

        const figures: any[] = [];

        // Draw trend line (point 1 to point 2)
        if (coordinates.length >= 2) {
          figures.push({
            type: "line",
            attrs: { coordinates: [coordinates[0], coordinates[1]] },
          });
        }

        // Draw retracement line (point 2 to point 3) and extension levels
        if (
          coordinates.length >= 3 &&
          points[0]?.value != null &&
          points[1]?.value != null &&
          points[2]?.value != null
        ) {
          // Retracement line
          figures.push({
            type: "line",
            attrs: { coordinates: [coordinates[1], coordinates[2]] },
            styles: { style: "dashed" },
          });

          // Calculate trend distance (price and coordinate)
          const trendPriceDiff = points[1].value - points[0].value;
          const isUptrend = trendPriceDiff > 0;

          // Extension levels (projected from point 3)
          const extensionLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.272, 1.618, 2, 2.618];

          const startX = 0;
          const endX = bounding.width;

          // Base point for extensions is point 3
          const baseValue = points[2].value;
          const baseY = coordinates[2].y;

          // Calculate Y per price unit using points 0 and 1
          const yPerPrice =
            points[1].value !== points[0].value
              ? (coordinates[1].y - coordinates[0].y) / (points[1].value - points[0].value)
              : 0;

          extensionLevels.forEach((level) => {
            // Extension value: base + (trend * level)
            // For uptrend: extensions go up from point 3
            // For downtrend: extensions go down from point 3
            const extensionPrice = baseValue + trendPriceDiff * level;
            const extensionY = baseY - (extensionPrice - baseValue) * Math.abs(yPerPrice);

            const formattedPrice = chart
              .getDecimalFold()
              .format(
                chart.getThousandsSeparator().format(extensionPrice.toFixed(precision)),
              );

            figures.push({
              type: "line",
              attrs: { coordinates: [{ x: startX, y: extensionY }, { x: endX, y: extensionY }] },
              styles: level === 1 ? {} : { style: "dashed" },
              ignoreEvent: true,
            });

            figures.push({
              type: "text",
              attrs: {
                x: startX + 5,
                y: extensionY,
                text: `${formattedPrice} (${(level * 100).toFixed(1)}%)`,
                baseline: "bottom",
              },
              ignoreEvent: true,
            });
          });
        }

        return figures;
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

  // Check if current range is non-intraday (should show earnings)
  const isNonIntradayRange = (range: string) =>
    ["1D", "1W", "1M"].includes(range);

  // Update earnings marker positions based on visible chart range
  const updateEarningsMarkers = () => {
    if (
      !chart ||
      !chartContainer ||
      !isNonIntradayRange(activeRange) ||
      !cachedChartRect
    ) {
      earningsMarkers = [];
      return;
    }

    const chartWidth = cachedChartRect.width;

    // Get the date range from historical price data
    const minTimestamp = dailyBars.length > 0 ? dailyBars[0].timestamp : null;
    const maxTimestamp =
      dailyBars.length > 0 ? dailyBars[dailyBars.length - 1].timestamp : null;

    // Create markers for each earnings date (using cached timestamps)
    const markers: EarningsMarker[] = [];

    for (const earnings of historicalEarnings) {
      const timestamp = earningsTimestampCache.get(earnings);
      if (timestamp === undefined) continue;

      // Skip earnings outside the historical price date range
      if (
        minTimestamp !== null &&
        maxTimestamp !== null &&
        (timestamp < minTimestamp || timestamp > maxTimestamp)
      ) {
        continue;
      }

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

  // Update dividend marker positions based on visible chart range
  const updateDividendMarkers = () => {
    if (
      !chart ||
      !chartContainer ||
      !isNonIntradayRange(activeRange) ||
      !cachedChartRect
    ) {
      dividendMarkers = [];
      return;
    }

    const chartWidth = cachedChartRect.width;

    // Get the date range from historical price data
    const minTimestamp = dailyBars.length > 0 ? dailyBars[0].timestamp : null;
    const maxTimestamp =
      dailyBars.length > 0 ? dailyBars[dailyBars.length - 1].timestamp : null;

    // Create markers for each dividend date (using cached timestamps)
    const markers: DividendMarker[] = [];

    for (const dividend of historicalDividends) {
      const timestamp = dividendTimestampCache.get(dividend);
      if (timestamp === undefined) continue;

      // Skip dividends outside the historical price date range
      if (
        minTimestamp !== null &&
        maxTimestamp !== null &&
        (timestamp < minTimestamp || timestamp > maxTimestamp)
      ) {
        continue;
      }

      // Convert timestamp to pixel position
      const pixel = chart.convertToPixel({ timestamp });

      if (pixel && typeof pixel.x === "number") {
        // Check if marker is within visible chart area (with some padding)
        const visible = pixel.x >= -20 && pixel.x <= chartWidth + 20;

        markers.push({
          dividend,
          timestamp,
          x: pixel.x,
          visible,
        });
      }
    }

    dividendMarkers = markers;
  };

  // Handle dividend marker click
  const handleDividendClick = (marker: DividendMarker, event: MouseEvent) => {
    event.stopPropagation();
    selectedDividend = marker.dividend;

    // Position popup near the click but ensure it stays on screen
    const rect = chartContainer?.getBoundingClientRect();
    if (rect) {
      let x = marker.x;
      let y = rect.height - 100; // Position above the volume area

      // Ensure popup doesn't go off screen
      if (x < 150) x = 150;
      if (x > rect.width - 150) x = rect.width - 150;

      dividendPopupPosition = { x, y };
    }
  };

  // Close dividend popup
  const closeDividendPopup = () => {
    selectedDividend = null;
  };

  // Update news flow marker positions based on visible chart range
  const updateNewsMarkers = () => {
    if (
      !chart ||
      !chartContainer ||
      !isNonIntradayRange(activeRange) ||
      !cachedChartRect
    ) {
      newsMarkers = [];
      return;
    }

    const chartWidth = cachedChartRect.width;

    // Get the date range from historical price data
    const minTimestamp = dailyBars.length > 0 ? dailyBars[0].timestamp : null;
    const maxTimestamp =
      dailyBars.length > 0 ? dailyBars[dailyBars.length - 1].timestamp : null;

    // Create markers for each news date (using cached timestamps)
    const markers: NewsMarker[] = [];

    for (const news of newsFlowData) {
      const timestamp = newsTimestampCache.get(news);
      if (timestamp === undefined) continue;

      // Skip news outside the historical price date range
      if (
        minTimestamp !== null &&
        maxTimestamp !== null &&
        (timestamp < minTimestamp || timestamp > maxTimestamp)
      ) {
        continue;
      }

      // Convert timestamp to pixel position
      const pixel = chart.convertToPixel({ timestamp });

      if (pixel && typeof pixel.x === "number") {
        // Check if marker is within visible chart area (with some padding)
        const visible = pixel.x >= -20 && pixel.x <= chartWidth + 20;

        markers.push({
          news,
          timestamp,
          x: pixel.x,
          visible,
        });
      }
    }

    newsMarkers = markers;
  };

  // Handle news marker click
  const handleNewsClick = (marker: NewsMarker, event: MouseEvent) => {
    event.stopPropagation();
    selectedNews = marker.news;

    // Position popup near the click but ensure it stays on screen
    const rect = chartContainer?.getBoundingClientRect();
    if (rect) {
      let x = marker.x;
      let y = rect.height - 100; // Position above the volume area

      // Ensure popup doesn't go off screen
      if (x < 150) x = 150;
      if (x > rect.width - 150) x = rect.width - 150;

      newsPopupPosition = { x, y };
    }
  };

  // Close news popup
  const closeNewsPopup = () => {
    selectedNews = null;
  };

  // Get news marker color based on changesPercentage (matches earnings colors)
  const getNewsMarkerColor = (
    changesPercentage: number | string | null | undefined,
  ): string => {
    // Handle null, undefined, or string "-"
    if (changesPercentage === null || changesPercentage === undefined) {
      return "#9ca3af"; // gray
    }
    // Handle numeric values
    if (typeof changesPercentage === "number") {
      if (changesPercentage > 0) return "#10B981"; // green
      if (changesPercentage < 0) return "#B91C1C"; // red
      return "#9ca3af"; // zero
    }
    // Handle string values
    const strValue = String(changesPercentage).trim();
    if (strValue === "-" || strValue === "") {
      return "#9ca3af"; // gray
    }
    const numValue = parseFloat(strValue);
    if (isNaN(numValue)) return "#9ca3af";
    if (numValue > 0) return "#10B981"; // green (same as earnings beat)
    if (numValue < 0) return "#B91C1C"; // red (same as earnings miss)
    return "#9ca3af"; // neutral
  };

  // Fetch GEX/DEX strike data from API
  const fetchGexDexData = async (type: "gex" | "dex") => {
    const isLoading = type === "gex" ? gexLoading : dexLoading;
    if (!ticker || isLoading) return;

    if (type === "gex") {
      gexLoading = true;
    } else {
      dexLoading = true;
    }

    try {
      const response = await fetch("/api/chart-indicator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticker,
          category: type === "gex" ? "options-gex" : "options-dex",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // The API returns data keyed by date - we want the latest date's data
      // and aggregate across all available data
      const aggregatedData = new Map<number, GexDexStrikeData>();

      for (const dateData of Object.values(result) as GexDexStrikeData[][]) {
        if (!Array.isArray(dateData)) continue;
        for (const item of dateData) {
          const strike = item.strike;
          if (!aggregatedData.has(strike)) {
            aggregatedData.set(strike, {
              strike,
              call_gex: 0,
              put_gex: 0,
              call_dex: 0,
              put_dex: 0,
            });
          }
          const existing = aggregatedData.get(strike)!;
          existing.call_gex += item.call_gex || 0;
          existing.put_gex += item.put_gex || 0;
          existing.call_dex += item.call_dex || 0;
          existing.put_dex += item.put_dex || 0;
        }
      }

      // Calculate net values and convert to array
      const strikeData = Array.from(aggregatedData.values()).map((item) => ({
        ...item,
        net_gex: item.call_gex + item.put_gex,
        net_dex: item.call_dex + item.put_dex,
      }));

      if (type === "gex") {
        gexStrikeData = strikeData;
        updateGexLevels();
      } else {
        dexStrikeData = strikeData;
        updateDexLevels();
      }
    } catch (error) {
      console.error(`Failed to fetch ${type.toUpperCase()} data:`, error);
      if (type === "gex") {
        gexStrikeData = [];
        gexLevels = [];
      } else {
        dexStrikeData = [];
        dexLevels = [];
      }
    } finally {
      if (type === "gex") {
        gexLoading = false;
      } else {
        dexLoading = false;
      }
    }
  };

  // Update GEX levels for rendering on chart
  const updateGexLevels = () => {
    if (!chart || !chartContainer || gexStrikeData.length === 0) {
      gexLevels = [];
      return;
    }

    // Get visible price range from chart
    const visibleRange = chart.getVisibleRange();
    if (!visibleRange) {
      gexLevels = [];
      return;
    }

    // Get price range from visible bars
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (let i = visibleRange.from; i < visibleRange.to; i++) {
      const bar = currentBars[i];
      if (bar) {
        minPrice = Math.min(minPrice, bar.low);
        maxPrice = Math.max(maxPrice, bar.high);
      }
    }

    // Add padding to price range
    const padding = (maxPrice - minPrice) * 0.1;
    minPrice -= padding;
    maxPrice += padding;

    // Filter strikes within visible price range
    const visibleStrikes = gexStrikeData.filter(
      (item) => item.strike >= minPrice && item.strike <= maxPrice,
    );

    // Find max absolute value for intensity calculation
    const maxAbsValue = Math.max(
      ...visibleStrikes.map((item) => Math.abs(item.net_gex || 0)),
      1,
    );

    // Sort by absolute value and take top 10 most significant levels
    const sortedStrikes = [...visibleStrikes]
      .sort((a, b) => Math.abs(b.net_gex || 0) - Math.abs(a.net_gex || 0))
      .slice(0, 10);

    // Convert to pixel positions
    const levels: GexDexLevel[] = [];
    for (const item of sortedStrikes) {
      const pixel = chart.convertToPixel({ value: item.strike });
      if (pixel && typeof pixel.y === "number") {
        const netValue = item.net_gex || 0;
        levels.push({
          strike: item.strike,
          value: netValue,
          callValue: item.call_gex,
          putValue: item.put_gex,
          y: pixel.y,
          visible: true,
          isPositive: netValue >= 0,
          intensity: Math.abs(netValue) / maxAbsValue,
        });
      }
    }

    gexLevels = levels;
  };

  // Update DEX levels for rendering on chart
  const updateDexLevels = () => {
    if (!chart || !chartContainer || dexStrikeData.length === 0) {
      dexLevels = [];
      return;
    }

    // Get visible price range from chart
    const visibleRange = chart.getVisibleRange();
    if (!visibleRange) {
      dexLevels = [];
      return;
    }

    // Get price range from visible bars
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (let i = visibleRange.from; i < visibleRange.to; i++) {
      const bar = currentBars[i];
      if (bar) {
        minPrice = Math.min(minPrice, bar.low);
        maxPrice = Math.max(maxPrice, bar.high);
      }
    }

    // Add padding to price range
    const padding = (maxPrice - minPrice) * 0.1;
    minPrice -= padding;
    maxPrice += padding;

    // Filter strikes within visible price range
    const visibleStrikes = dexStrikeData.filter(
      (item) => item.strike >= minPrice && item.strike <= maxPrice,
    );

    // Find max absolute value for intensity calculation
    const maxAbsValue = Math.max(
      ...visibleStrikes.map((item) => Math.abs(item.net_dex || 0)),
      1,
    );

    // Sort by absolute value and take top 10 most significant levels
    const sortedStrikes = [...visibleStrikes]
      .sort((a, b) => Math.abs(b.net_dex || 0) - Math.abs(a.net_dex || 0))
      .slice(0, 10);

    // Convert to pixel positions
    const levels: GexDexLevel[] = [];
    for (const item of sortedStrikes) {
      const pixel = chart.convertToPixel({ value: item.strike });
      if (pixel && typeof pixel.y === "number") {
        const netValue = item.net_dex || 0;
        levels.push({
          strike: item.strike,
          value: netValue,
          callValue: item.call_dex,
          putValue: item.put_dex,
          y: pixel.y,
          visible: true,
          isPositive: netValue >= 0,
          intensity: Math.abs(netValue) / maxAbsValue,
        });
      }
    }

    dexLevels = levels;
  };

  // Calculate popup position ensuring it stays within bounds
  const calculatePopupPosition = (
    event: MouseEvent,
    popupWidth: number = 260,
    popupHeight: number = 280,
  ) => {
    const rect = chartContainer?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };

    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Calculate x position - try to center on click, but keep within bounds
    let x = clickX - popupWidth / 2;
    const padding = 10;

    // Keep popup within chart bounds horizontally
    if (x < padding) {
      x = padding;
    } else if (x + popupWidth > rect.width - padding) {
      x = rect.width - popupWidth - padding;
    }

    // Calculate y position - show above click if near bottom, below if near top
    let y: number;
    const spaceBelow = rect.height - clickY;
    const spaceAbove = clickY;

    if (spaceBelow >= popupHeight + padding) {
      // Show below click point
      y = clickY + 15;
    } else if (spaceAbove >= popupHeight + padding) {
      // Show above click point
      y = clickY - popupHeight - 15;
    } else {
      // Not enough space, center vertically
      y = Math.max(padding, (rect.height - popupHeight) / 2);
    }

    // Ensure y stays within bounds
    y = Math.max(padding, Math.min(y, rect.height - popupHeight - padding));

    return { x, y };
  };

  // Handle GEX level click
  const handleGexLevelClick = (level: GexDexLevel, event: MouseEvent) => {
    event.stopPropagation();
    selectedGexLevel = level;
    selectedDexLevel = null;
    selectedOiLevel = null;
    gexDexPopupPosition = calculatePopupPosition(event);
  };

  // Handle DEX level click
  const handleDexLevelClick = (level: GexDexLevel, event: MouseEvent) => {
    event.stopPropagation();
    selectedDexLevel = level;
    selectedGexLevel = null;
    selectedOiLevel = null;
    gexDexPopupPosition = calculatePopupPosition(event);
  };

  // Close GEX/DEX popup
  const closeGexDexPopup = () => {
    selectedGexLevel = null;
    selectedDexLevel = null;
  };

  // Fetch Open Interest strike data from API
  const fetchOiData = async () => {
    if (!ticker || oiLoading) return;

    oiLoading = true;

    try {
      const response = await fetch("/api/chart-indicator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticker,
          category: "options-oi",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // The API returns data keyed by date - aggregate across all expiration dates
      const aggregatedData = new Map<number, OiStrikeData>();

      for (const dateData of Object.values(result) as OiStrikeData[][]) {
        if (!Array.isArray(dateData)) continue;
        for (const item of dateData) {
          const strike = item.strike;
          if (!aggregatedData.has(strike)) {
            aggregatedData.set(strike, {
              strike,
              call_oi: 0,
              put_oi: 0,
            });
          }
          const existing = aggregatedData.get(strike)!;
          existing.call_oi += item.call_oi || 0;
          existing.put_oi += item.put_oi || 0;
        }
      }

      // Calculate total OI and convert to array
      const strikeData = Array.from(aggregatedData.values()).map((item) => ({
        ...item,
        total_oi: item.call_oi + item.put_oi,
      }));

      oiStrikeData = strikeData;
      updateOiLevels();
    } catch (error) {
      console.error("Failed to fetch OI data:", error);
      oiStrikeData = [];
      oiLevels = [];
    } finally {
      oiLoading = false;
    }
  };

  // Update OI levels for rendering on chart
  const updateOiLevels = () => {
    if (!chart || !chartContainer || oiStrikeData.length === 0) {
      oiLevels = [];
      return;
    }

    // Get visible price range from chart
    const visibleRange = chart.getVisibleRange();
    if (!visibleRange) {
      oiLevels = [];
      return;
    }

    // Get price range from visible bars
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (let i = visibleRange.from; i < visibleRange.to; i++) {
      const bar = currentBars[i];
      if (bar) {
        minPrice = Math.min(minPrice, bar.low);
        maxPrice = Math.max(maxPrice, bar.high);
      }
    }

    // Add padding to price range
    const padding = (maxPrice - minPrice) * 0.1;
    minPrice -= padding;
    maxPrice += padding;

    // Filter strikes within visible price range
    const visibleStrikes = oiStrikeData.filter(
      (item) => item.strike >= minPrice && item.strike <= maxPrice,
    );

    // Find max total OI for intensity calculation
    const maxTotalOi = Math.max(
      ...visibleStrikes.map((item) => item.total_oi || 0),
      1,
    );

    // Sort by total OI and take top 10 most significant levels
    const sortedStrikes = [...visibleStrikes]
      .sort((a, b) => (b.total_oi || 0) - (a.total_oi || 0))
      .slice(0, 10);

    // Convert to pixel positions
    const levels: OiLevel[] = [];
    for (const item of sortedStrikes) {
      const pixel = chart.convertToPixel({ value: item.strike });
      if (pixel && typeof pixel.y === "number") {
        levels.push({
          strike: item.strike,
          callOi: item.call_oi,
          putOi: item.put_oi,
          totalOi: item.total_oi || 0,
          y: pixel.y,
          visible: true,
          intensity: (item.total_oi || 0) / maxTotalOi,
        });
      }
    }

    oiLevels = levels;
  };

  // Handle OI level click
  const handleOiLevelClick = (level: OiLevel, event: MouseEvent) => {
    event.stopPropagation();
    selectedOiLevel = level;
    selectedGexLevel = null;
    selectedDexLevel = null;
    oiPopupPosition = calculatePopupPosition(event);
  };

  // Close OI popup
  const closeOiPopup = () => {
    selectedOiLevel = null;
  };

  // Fetch Hottest Contracts data from API
  const fetchHottestContractsData = async () => {
    if (!ticker || hottestLoading) return;

    hottestLoading = true;

    try {
      const response = await fetch("/api/chart-indicator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticker,
          category: "hottest-contracts",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // The API returns { volume: [...], openInterest: [...] }
      // We use the volume data for hottest contracts
      const volumeData = result?.volume || [];

      hottestContractsData = volumeData;
      updateHottestLevels();
    } catch (error) {
      console.error("Failed to fetch Hottest Contracts data:", error);
      hottestContractsData = [];
      hottestLevels = [];
    } finally {
      hottestLoading = false;
    }
  };

  // Update Hottest Contracts levels for rendering on chart
  const updateHottestLevels = () => {
    if (!chart || !chartContainer || hottestContractsData.length === 0) {
      hottestLevels = [];
      return;
    }

    // Get visible price range from chart
    const visibleRange = chart.getVisibleRange();
    if (!visibleRange) {
      hottestLevels = [];
      return;
    }

    // Get price range from visible bars
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (let i = visibleRange.from; i < visibleRange.to; i++) {
      const bar = currentBars[i];
      if (bar) {
        minPrice = Math.min(minPrice, bar.low);
        maxPrice = Math.max(maxPrice, bar.high);
      }
    }

    // Add padding to price range
    const padding = (maxPrice - minPrice) * 0.1;
    minPrice -= padding;
    maxPrice += padding;

    // Filter contracts within visible price range
    const visibleContracts = hottestContractsData.filter(
      (item) => item.strike_price >= minPrice && item.strike_price <= maxPrice,
    );

    // Find max volume for intensity calculation
    const maxVolume = Math.max(
      ...visibleContracts.map((item) => item.volume || 0),
      1,
    );

    // Sort by volume and take top 10 most significant levels
    const sortedContracts = [...visibleContracts]
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .slice(0, 10);

    // Convert to pixel positions
    const levels: HottestLevel[] = [];
    for (const item of sortedContracts) {
      const pixel = chart.convertToPixel({ value: item.strike_price });
      if (pixel && typeof pixel.y === "number") {
        levels.push({
          strike: item.strike_price,
          optionType: item.option_type,
          expiration: item.date_expiration,
          volume: item.volume,
          openInterest: item.open_interest,
          iv: item.iv,
          premium: item.total_premium,
          last: item.last,
          y: pixel.y,
          visible: true,
          intensity: (item.volume || 0) / maxVolume,
        });
      }
    }

    hottestLevels = levels;
  };

  // Handle Hottest Contracts level click
  const handleHottestLevelClick = (level: HottestLevel, event: MouseEvent) => {
    event.stopPropagation();
    selectedHottestLevel = level;
    selectedGexLevel = null;
    selectedDexLevel = null;
    selectedOiLevel = null;
    hottestPopupPosition = calculatePopupPosition(event);
  };

  // Close Hottest Contracts popup
  const closeHottestPopup = () => {
    selectedHottestLevel = null;
  };

  // Unified function to update all chart overlays (markers and levels)
  const updateAllOverlays = () => {
    // Cache chart rect once for all update functions (avoids layout thrashing)
    cachedChartRect = chartContainer?.getBoundingClientRect() ?? null;

    updateEarningsMarkers();
    updateDividendMarkers();
    updateNewsMarkers();
    updateGexLevels();
    updateDexLevels();
    updateOiLevels();
    updateHottestLevels();
  };

  // Throttled version for scroll/zoom events (16ms = ~60fps)
  const throttledUpdateOverlays = throttle(updateAllOverlays, 16);

  // Format expiration date for display
  const formatExpiration = (dateStr: string): string => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${month}/${day}/${year?.slice(-2)}`;
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

  // Helper to check if both revenue and earnings surprises are positive (beat expectations)
  const hasBeatExpectations = (earnings: EarningsData | null): boolean => {
    if (!earnings) return false;
    const epsSurprise = toNumber(earnings.eps_surprise);
    const revenueSurprise = toNumber(earnings.revenue_surprise);
    // Both must be positive numbers (beat expectations)
    return (
      epsSurprise !== null &&
      epsSurprise > 0 &&
      revenueSurprise !== null &&
      revenueSurprise > 0
    );
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

  // WebSocket batching state for performance
  let pendingWsUpdate: any = null;
  let wsUpdateScheduled = false;

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

          // Queue only the latest valid update (skip stale intermediate data)
          for (const item of items) {
            if (item && (item.type === "Q" || item.type === "T")) {
              pendingWsUpdate = item;
            }
          }

          // Batch process on next animation frame
          if (pendingWsUpdate && !wsUpdateScheduled) {
            wsUpdateScheduled = true;
            requestAnimationFrame(() => {
              if (pendingWsUpdate) {
                updateRealtimeBars(pendingWsUpdate);
                pendingWsUpdate = null;
              }
              wsUpdateScheduled = false;
            });
          }
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
      // Skip overlay indicators (GEX/DEX) - they are rendered separately
      if (item.isOverlay) return;

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
          height: item.height ?? 120,
          minHeight: 80,
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
        // isStack=true for candle pane to allow multiple overlaid indicators (MA, BOLL, etc.)
        // isStack=false for separate panes to avoid stacking
        nextInstanceIds[item.id] = chart.createIndicator(
          { name: item.indicatorName, calcParams: getIndicatorParams(item.id) },
          isOnCandlePane,
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
    const newState = !indicatorState[name];
    indicatorState = {
      ...indicatorState,
      [name]: newState,
    };
    if (chart) {
      syncIndicators();
    }
    ruleOfList = buildRuleList();

    // Handle overlay indicators (GEX/DEX/OI) - fetch data when enabled
    if (newState) {
      if (name === "gex" && gexStrikeData.length === 0) {
        fetchGexDexData("gex");
      } else if (name === "dex" && dexStrikeData.length === 0) {
        fetchGexDexData("dex");
      } else if (name === "oi" && oiStrikeData.length === 0) {
        fetchOiData();
      } else if (name === "hottest" && hottestContractsData.length === 0) {
        fetchHottestContractsData();
      }
    } else {
      // Clear data when disabled
      if (name === "gex") {
        gexStrikeData = [];
        gexLevels = [];
        selectedGexLevel = null;
      } else if (name === "dex") {
        dexStrikeData = [];
        dexLevels = [];
        selectedDexLevel = null;
      } else if (name === "oi") {
        oiStrikeData = [];
        oiLevels = [];
        selectedOiLevel = null;
      } else if (name === "hottest") {
        hottestContractsData = [];
        hottestLevels = [];
        selectedHottestLevel = null;
      }
    }
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
    if (value === null || !Number.isFinite(value)) return "-";
    return priceFormatter?.format(value);
  }

  function formatPercent(value: number | null) {
    if (value === null || !Number?.isFinite(value)) return "-";
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value?.toFixed(2)}%`;
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
    if (!bar) return "-";
    const dt = DateTime.fromMillis(bar.timestamp, { zone });
    if (activeRange === "1D" || activeRange === "1min") {
      return dt.toFormat("MMM dd, HH:mm");
    }
    if (activeRange === "5D" || activeRange === "1M") {
      return dt.toFormat("MMM dd");
    }
    return dt.toFormat("MMM dd, yyyy");
  }

  // Click outside handler for toolbar dropdowns
  const handleToolbarClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(".relative") && openDropdownId) {
      openDropdownId = null;
    }
  };

  onMount(async () => {
    document.addEventListener("click", handleToolbarClickOutside);

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
      // Load event toggle states for Pro users
      if (data?.user?.tier === "Pro") {
        showEarnings = savedSettings.showEarnings ?? true;
        showDividends = savedSettings.showDividends ?? true;
        showNewsFlow = savedSettings.showNewsFlow ?? true;
      }
    } else if (data?.user?.tier === "Pro") {
      // Default to true for Pro users if no settings saved
      showEarnings = true;
      showDividends = true;
      showNewsFlow = true;
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

    // Configure candle pane y-axis to only show price range (exclude indicators)
    chart.setPaneOptions({
      id: "candle_pane",
      axis: {
        createRange: ({ chart: c, defaultRange }) => {
          const visibleRange = c.getVisibleRange();
          const dataList = c.getDataList();

          if (!dataList || dataList.length === 0) {
            return defaultRange;
          }

          let min = Infinity;
          let max = -Infinity;

          // Only consider candle high/low values for the range
          for (let i = visibleRange.from; i < visibleRange.to; i++) {
            const data = dataList[i];
            if (data) {
              if (data.high > max) max = data.high;
              if (data.low < min) min = data.low;
            }
          }

          if (min === Infinity || max === -Infinity) {
            return defaultRange;
          }

          // Add some padding (2%)
          const padding = (max - min) * 0.02;
          min -= padding;
          max += padding;
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

    chart.subscribeAction("onCrosshairChange", handleCrosshairChange);

    // Subscribe to chart events for overlay updates (throttled for performance)
    chart.subscribeAction("onScroll", throttledUpdateOverlays);
    chart.subscribeAction("onZoom", throttledUpdateOverlays);
    chart.subscribeAction("onVisibleRangeChange", throttledUpdateOverlays);

    // Always create volume indicator by default
    chart.createIndicator({ name: "SN_VOL", calcParams: [] }, false, {
      id: "sn_volume_pane",
      height: 120,
      minHeight: 80,
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

    // Throttled resize handler to prevent lag during window resize
    const throttledChartResize = throttle(() => chart?.resize(), 100);
    resizeObserver = new ResizeObserver(throttledChartResize);
    resizeObserver.observe(chartRoot);
  });

  onDestroy(() => {
    isComponentDestroyed = true;
    disconnectWebSocket();
    if (browser) {
      document.removeEventListener("click", handleToolbarClickOutside);
    }

    if (chart) {
      chart.unsubscribeAction("onCrosshairChange", handleCrosshairChange);
      chart.unsubscribeAction("onScroll", throttledUpdateOverlays);
      chart.unsubscribeAction("onZoom", throttledUpdateOverlays);
      chart.unsubscribeAction("onVisibleRangeChange", throttledUpdateOverlays);
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
    historicalDividends = data?.historicalDividends ?? [];
    newsFlowData = data?.getWhyPriceMoved ?? [];

    // Pre-compute and cache timestamps for markers (avoids recalculation on scroll/zoom)
    earningsTimestampCache = new Map();
    for (const earnings of historicalEarnings) {
      if (earnings.date) {
        const dt = DateTime.fromISO(earnings.date, { zone });
        if (dt.isValid)
          earningsTimestampCache.set(earnings, dt.startOf("day").toMillis());
      }
    }

    dividendTimestampCache = new Map();
    for (const dividend of historicalDividends) {
      if (dividend.date) {
        const dt = DateTime.fromISO(dividend.date, { zone });
        if (dt.isValid)
          dividendTimestampCache.set(dividend, dt.startOf("day").toMillis());
      }
    }

    newsTimestampCache = new Map();
    for (const news of newsFlowData) {
      if (news.date) {
        const dt = DateTime.fromSQL(news.date, { zone });
        if (dt.isValid)
          newsTimestampCache.set(news, dt.startOf("day").toMillis());
      }
    }
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

  // Batched update for all overlays when chart, range, or data changes
  let overlayUpdateScheduled = false;
  $: if (chart) {
    // Track dependencies that should trigger overlay update
    activeRange;
    historicalEarnings;
    historicalDividends;
    newsFlowData;
    gexStrikeData;
    dexStrikeData;
    oiStrikeData;
    hottestContractsData;
    indicatorState;

    // Schedule single batched update using requestAnimationFrame
    if (!overlayUpdateScheduled) {
      overlayUpdateScheduled = true;
      requestAnimationFrame(() => {
        overlayUpdateScheduled = false;
        updateAllOverlays();
      });
    }
  }

  // Track ticker for GEX/DEX/OI refetch
  let gexDexOiTicker = "";

  // Clear GEX/DEX/OI/Hottest data and refetch when ticker changes
  $: if (ticker && ticker !== gexDexOiTicker) {
    gexDexOiTicker = ticker;
    // Clear existing data
    gexStrikeData = [];
    dexStrikeData = [];
    oiStrikeData = [];
    hottestContractsData = [];
    gexLevels = [];
    dexLevels = [];
    oiLevels = [];
    hottestLevels = [];
    // Refetch if indicators are enabled
    if (indicatorState.gex) {
      fetchGexDexData("gex");
    }
    if (indicatorState.dex) {
      fetchGexDexData("dex");
    }
    if (indicatorState.oi) {
      fetchOiData();
    }
    if (indicatorState.hottest) {
      fetchHottestContractsData();
    }
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

  $: companyName = data?.companyName || ticker;
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
  $: assetType =
    resolvedAssetType === "etf"
      ? "etf"
      : resolvedAssetType === "index"
        ? "index"
        : "stocks";
  $: detailedAnalysisHref = showDetailedAnalysis
    ? `/${assetType}/${ticker}`
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
  description={`Interactive ${companyName} (${ticker}) stock chart with real-time and historical prices, volume, and technical indicators. Latest price ${seoPriceText}, market cap ${seoMarketCapText}.`}
  keywords={`${ticker} stock chart, ${companyName} chart, ${ticker} technical analysis, ${ticker} live price, ${ticker} candlestick chart, stock charting, trading indicators, price action`}
  type="article"
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["WebPage", "FinancialProduct"],
    name: `${companyName} (${ticker}) Stock Chart`,
    headline: `${companyName} (${ticker}) Live Stock Chart`,
    description: `Real-time ${companyName} (${ticker}) chart with price, volume, and technical indicators`,
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
      name: `${companyName} Common Stock`,
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
          name: `${companyName} (${ticker})`,
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
    <!-- TradingView Style Navbar -->
    <div
      class="flex flex-col border-b border-gray-200 dark:border-[#262626] bg-[#09090b]"
    >
      <!-- First Row: Ticker Info + OHLC -->
      <div
        class="flex items-center px-2 py-1 gap-1 text-sm border-b border-gray-200 dark:border-[#262626]"
      >
        <!-- Ticker Symbol -->
        <button class="flex items-center gap-1.5 px-2 py-1">
          <img
            src={ticker?.length > 0
              ? `https://financialmodelingprep.com/image-stock/${ticker}.png`
              : "/pwa-512x512.png"}
            alt={`${ticker || "Stocknear"} logo`}
            class="shrink-0 w-5 h-5 rounded-full"
          />
          <span class="font-semibold text-neutral-100">{ticker}</span>
          <span class="text-neutral-500">·</span>
          <span class="text-neutral-400">{activeRange}</span>
          <span class="text-neutral-500">·</span>
          <span class="text-neutral-400"
            >{data?.getStockQuote?.exchange?.toUpperCase() || ""}</span
          >
        </button>

        <!-- Separator -->
        <div class="w-px h-5 bg-neutral-700 mx-1"></div>

        <!-- Price -->
        <div class="flex items-center gap-2 text-xs">
          <span class={`font-medium ${changeClass}`}
            >{formatPrice(lastClose)}</span
          >
          <span class={`${changeClass}`}
            >{formatPrice(change)} ({formatPercent(changePercent)})</span
          >
        </div>
      </div>

      <!-- Second Row: Tools -->
      <div class="flex items-center px-1 py-0.5 gap-0.5 overflow-x-auto">
        <!-- Toolbar Toggle -->
        <button
          class="cursor-pointer hidden sm:flex h-7 w-7 items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition"
          on:click={() => (toolbarExpanded = !toolbarExpanded)}
          title={toolbarExpanded ? "Hide drawing tools" : "Show drawing tools"}
        >
          {#if toolbarExpanded}
            <IndentDecrease class="size-5 flex-shrink-0" />
          {:else}
            <IndentIncrease class="size-5 flex-shrink-0" />
          {/if}
        </button>

        <!-- Separator -->
        <div class="w-px h-5 bg-neutral-700 mx-0.5"></div>

        <!-- Time Intervals - Dropdown for mobile, inline buttons for sm+ -->
        <!-- Mobile Dropdown -->
        <div class="sm:hidden">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild let:builder>
              <button
                use:builder.action
                {...builder}
                class="flex items-center gap-1 px-2 py-1 text-sm font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition"
              >
                <Timer class="h-4 w-4" />
                <span>{activeRange}</span>
                <ChevronDown class="h-3 w-3" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              side="bottom"
              align="start"
              sideOffset={4}
              class="w-24 rounded border border-neutral-700 bg-[#1e222d] p-1 text-neutral-200 shadow-lg"
            >
              <DropdownMenu.Group>
                {#each timeframes as frame}
                  <DropdownMenu.Item
                    class={`px-2 py-1.5 text-sm rounded cursor-pointer transition ${
                      activeRange === frame
                        ? "text-white bg-violet-600"
                        : "text-neutral-300 hover:bg-neutral-800"
                    }`}
                    on:click={() => setRange(frame)}
                  >
                    {frame}
                  </DropdownMenu.Item>
                {/each}
              </DropdownMenu.Group>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>

        <!-- Desktop Inline Buttons -->
        <div class="hidden sm:flex items-center">
          {#each timeframes as frame}
            <button
              class={`cursor-pointer px-2 py-1 text-xs font-medium rounded transition ${
                activeRange === frame
                  ? "text-white bg-violet-600"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
              }`}
              on:click={() => setRange(frame)}
            >
              {frame}
            </button>
          {/each}
        </div>

        <!-- Separator -->
        <div class="w-px h-5 bg-neutral-700 mx-0.5"></div>

        <!-- Chart Type Dropdown -->
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild let:builder>
            <button
              use:builder.action
              {...builder}
              class="cursor-pointer flex items-center gap-1 px-2 py-1 text-sm font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition"
            >
              <svelte:component
                this={currentChartType?.icon}
                class="h-4 w-4 flex-shrink-0"
              />
              <ChevronDown class="h-3 w-3" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            side="bottom"
            align="start"
            sideOffset={4}
            class="w-44 rounded-lg border border-neutral-700 bg-neutral-900 p-1 shadow-xl"
          >
            <DropdownMenu.Group>
              {#each chartTypeOptions as option}
                <DropdownMenu.Item
                  class={`flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer transition ${
                    chartType === option.id
                      ? "text-white bg-violet-600"
                      : "text-neutral-300 hover:bg-neutral-800"
                  }`}
                  on:click={() => setChartType(option.id)}
                >
                  {option.label}
                </DropdownMenu.Item>
              {/each}
            </DropdownMenu.Group>
          </DropdownMenu.Content>
        </DropdownMenu.Root>

        <!-- Separator -->
        <div class="w-px h-5 bg-neutral-700 mx-0.5"></div>

        <!-- Indicators Button -->
        <label
          for="indicatorModal"
          on:click={() => (indicatorSearchTerm = "")}
          class="flex items-center gap-1 px-2 py-1 text-sm font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded cursor-pointer transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 28 28"
            class="h-4 w-4"
            fill="none"
          >
            <path
              stroke="currentColor"
              d="M6 12l4.8-4.8a1 1 0 0 1 1.4 0l2.7 2.7a1 1 0 0 0 1.3.1L23 5"
            />
            <path
              fill="currentColor"
              fill-rule="evenodd"
              d="M19 12a1 1 0 0 0-1 1v4h-3v-1a1 1 0 0 0-1-1h-3a1 1 0 0 0-1 1v2H7a1 1 0 0 0-1 1v4h17V13a1 1 0 0 0-1-1h-3zm0 10h3v-9h-3v9zm-1 0v-4h-3v4h3zm-4-4.5V22h-3v-6h3v1.5zM10 22v-3H7v3h3z"
            />
          </svg>
          <span>Indicators</span>
        </label>

        <!-- Separator -->
        <div class="w-px h-5 bg-neutral-700 mx-0.5"></div>

        <!-- Events Dropdown -->
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild let:builder>
            <button
              use:builder.action
              {...builder}
              class="flex items-center gap-1 px-2 py-1 text-sm font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded cursor-pointer transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 28 28"
                class="h-4 w-4"
                fill="currentColor"
              >
                <path
                  d="M10 6a4 4 0 1 1 8 0v1h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2V6zm6 0a2 2 0 1 0-4 0v1h4V6zM8 9v12h12V9H8zm3 3h6v2h-6v-2zm0 4h4v2h-4v-2z"
                />
              </svg>
              <span>Events</span>
              <ChevronDown class="size-3" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            side="bottom"
            align="start"
            sideOffset={4}
            class="w-auto min-w-40 rounded border border-neutral-700 bg-[#1e222d] p-1 text-neutral-200 shadow-lg"
          >
            <DropdownMenu.Group>
              <DropdownMenu.Item
                class="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-neutral-700 cursor-pointer"
                on:click={(e) => e.preventDefault()}
              >
                <label
                  class="inline-flex justify-between w-full items-center cursor-pointer"
                  on:click|stopPropagation
                  on:pointerdown|stopPropagation
                >
                  <span>Earnings</span>
                  <div class="relative ml-4 flex items-center">
                    {#if isSubscribed}
                      <input
                        type="checkbox"
                        class="sr-only peer"
                        checked={showEarnings}
                        on:change={() => {
                          showEarnings = !showEarnings;
                          saveEventSettings();
                        }}
                      />
                      <div
                        class="w-9 h-5 bg-gray-200/80 dark:bg-zinc-800 rounded-full peer peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-200/70 dark:after:border-zinc-700/80 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"
                      ></div>
                    {:else}
                      <button
                        type="button"
                        on:click|stopPropagation={() => goto("/pricing")}
                        class="text-neutral-500 hover:text-neutral-300 transition"
                      >
                        <svg
                          class="w-4 h-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="currentColor"
                            d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                          />
                        </svg>
                      </button>
                    {/if}
                  </div>
                </label>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-neutral-700 cursor-pointer"
                on:click={(e) => e.preventDefault()}
              >
                <label
                  class="inline-flex justify-between w-full items-center cursor-pointer"
                  on:click|stopPropagation
                  on:pointerdown|stopPropagation
                >
                  <span>Dividends</span>
                  <div class="relative ml-4 flex items-center">
                    {#if isSubscribed}
                      <input
                        type="checkbox"
                        class="sr-only peer"
                        checked={showDividends}
                        on:change={() => {
                          showDividends = !showDividends;
                          saveEventSettings();
                        }}
                      />
                      <div
                        class="w-9 h-5 bg-gray-200/80 dark:bg-zinc-800 rounded-full peer peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-200/70 dark:after:border-zinc-700/80 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"
                      ></div>
                    {:else}
                      <button
                        type="button"
                        on:click|stopPropagation={() => goto("/pricing")}
                        class="text-neutral-500 hover:text-neutral-300 transition"
                      >
                        <svg
                          class="w-4 h-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="currentColor"
                            d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                          />
                        </svg>
                      </button>
                    {/if}
                  </div>
                </label>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-neutral-700 cursor-pointer"
                on:click={(e) => e.preventDefault()}
              >
                <label
                  class="inline-flex justify-between w-full items-center cursor-pointer"
                  on:click|stopPropagation
                  on:pointerdown|stopPropagation
                >
                  <span>News Flow</span>
                  <div class="relative ml-4 flex items-center">
                    {#if isSubscribed}
                      <input
                        type="checkbox"
                        class="sr-only peer"
                        checked={showNewsFlow}
                        on:change={() => {
                          showNewsFlow = !showNewsFlow;
                          saveEventSettings();
                        }}
                      />
                      <div
                        class="w-9 h-5 bg-gray-200/80 dark:bg-zinc-800 rounded-full peer peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-200/70 dark:after:border-zinc-700/80 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"
                      ></div>
                    {:else}
                      <button
                        type="button"
                        on:click|stopPropagation={() => goto("/pricing")}
                        class="text-neutral-500 hover:text-neutral-300 transition"
                      >
                        <svg
                          class="w-4 h-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="currentColor"
                            d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                          />
                        </svg>
                      </button>
                    {/if}
                  </div>
                </label>
              </DropdownMenu.Item>
            </DropdownMenu.Group>
          </DropdownMenu.Content>
        </DropdownMenu.Root>

        <!-- Separator -->
        <div class="w-px h-5 bg-neutral-700 mx-0.5"></div>

        <!-- Strategy Dropdown -->
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild let:builder>
            <button
              use:builder.action
              {...builder}
              class="flex items-center gap-1 px-2 py-1 text-sm font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded cursor-pointer transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 28 28"
                class="h-4 w-4"
                fill="currentColor"
              >
                <path
                  d="M14 4l8 4v8c0 4.4-3.4 8.5-8 10-4.6-1.5-8-5.6-8-10V8l8-4zm0 2.2L8 9.3v6.7c0 3.3 2.5 6.5 6 7.8 3.5-1.3 6-4.5 6-7.8V9.3l-6-3.1z"
                />
              </svg>
              <span class="truncate max-w-24">
                {selectedStrategyTitle?.length > 0
                  ? selectedStrategyTitle
                  : "Strategy"}
              </span>
              <ChevronDown class="size-3" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            side="bottom"
            align="start"
            sideOffset={4}
            class="w-auto min-w-48 max-h-64 overflow-y-auto rounded border border-neutral-700 bg-[#1e222d] p-1 text-neutral-200 shadow-lg"
          >
            <label
              for={!data?.user ? "userLogin" : "addChartStrategy"}
              class="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-neutral-700 cursor-pointer text-violet-800 dark:text-violet-400 sm:hover:text-muted dark:sm:hover:text-white transition"
            >
              <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              <span>New Strategy</span>
            </label>
            <div class="h-px bg-neutral-700 my-1"></div>
            <DropdownMenu.Group>
              {#if strategyList?.length > 0}
                {#each strategyList as item}
                  <DropdownMenu.Item
                    on:click={() => {
                      switchStrategy(item);
                    }}
                    class="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-neutral-700 cursor-pointer {item?.id ===
                    selectedStrategy
                      ? 'text-violet-400'
                      : 'text-neutral-200'}"
                  >
                    <span class="truncate">
                      {item?.title?.length > 18
                        ? item?.title?.slice(0, 18) + "..."
                        : item?.title}
                      <span class="text-neutral-500 ml-1"
                        >({item?.rules?.length ?? 0})</span
                      >
                    </span>
                    <label
                      for="deleteChartStrategy"
                      class="ml-2 flex items-center justify-center cursor-pointer text-neutral-500 hover:text-red-500 transition"
                      on:click|stopPropagation
                    >
                      <Trash2 class="h-3.5 w-3.5" />
                    </label>
                  </DropdownMenu.Item>
                {/each}
              {:else}
                <div class="px-2 py-1.5 text-sm text-neutral-500">
                  No saved strategies
                </div>
              {/if}
            </DropdownMenu.Group>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
        {#if data?.user}
          <!-- Separator -->
          <div class="w-px h-5 bg-neutral-700 mx-0.5"></div>

          <button
            on:click={() => handleSave(true)}
            class="flex items-center gap-1 px-2 py-1 text-sm font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded cursor-pointer transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 28 28"
              class="h-4 w-4"
              fill="currentColor"
            >
              <path
                d="M6 4h12l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm11 2H7v4h10V6zm-4 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
              />
            </svg>
            <span>Save</span>
          </button>

          {#if strategyList?.length > 0}
            <label
              for={!data?.user ? "userLogin" : "addChartStrategy"}
              class="flex items-center gap-1 px-2 py-1 text-sm font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded cursor-pointer transition whitespace-nowrap"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 28 28"
                class="h-4 w-4"
                fill="currentColor"
              >
                <path
                  d="M14 4a1 1 0 0 1 1 1v8h8a1 1 0 1 1 0 2h-8v8a1 1 0 1 1-2 0v-8H5a1 1 0 1 1 0-2h8V5a1 1 0 0 1 1-1z"
                />
              </svg>
              <span>Save as New</span>
            </label>
          {/if}
        {/if}

        {#if showDetailedAnalysis}
          <!-- Spacer to push to right -->
          <div class="flex-1"></div>

          <a
            href={detailedAnalysisHref}
            class="whitespace-nowrap flex items-center gap-1 px-2 py-1 text-sm font-medium text-violet-800 dark:text-violet-400 sm:hover:text-muted dark:sm:hover:text-white transition"
            aria-label="Detailed Analysis"
          >
            <span>Detailed Analysis</span>
            <ArrowRight class="h-3.5 w-3.5" />
          </a>
        {/if}
      </div>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <!-- KlineCharts Pro Style Drawing Toolbar -->
      {#if toolbarExpanded}
        <div
          class="hidden sm:flex h-full w-[48px] flex-col items-center border-r border-gray-200 dark:border-[#262626] bg-[#0b0b0b] py-2 overflow-visible transition-all duration-200"
        >
          <!-- Cursor Tool -->
          <button
            class={`group relative flex h-[38px] w-[38px] items-center justify-center rounded transition-all duration-200 ${
              activeTool === "cursor"
                ? "bg-neutral-800 text-white"
                : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
            }`}
            on:click={() => {
              activeTool = "cursor";
              if (chartMain) chartMain.style.cursor = "default";
            }}
            title="Cursor"
          >
            <MousePointer2 class="h-6 w-6" />
          </button>

          <!-- Drawing Tool Groups -->
          {#each toolGroups as group, groupIndex}
            <DropdownMenu.Root bind:open={dropdownStates[group.id]}>
              <div class="relative mt-1 group/item">
                <!-- Main Button with selected tool icon -->
                <button
                  class={`relative flex h-[38px] w-[38px] items-center justify-center rounded transition-all duration-200 ${
                    group.options.some((o) => o.id === activeTool)
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                  }`}
                  on:click={() => {
                    const selectedTool = group.options.find(
                      (o) => o.id === selectedToolByGroup[group.id],
                    );
                    if (selectedTool) {
                      activateDrawingTool(
                        group.id,
                        selectedTool.id,
                        selectedTool.overlay,
                      );
                    }
                  }}
                  title={group.label}
                >
                  <svg viewBox="0 0 22 22" class="h-6 w-6 fill-current">
                    <path d={getGroupIcon(group.id)} />
                  </svg>
                  <!-- Dropdown Arrow -->
                  <DropdownMenu.Trigger asChild let:builder>
                    <div
                      use:builder.action
                      {...builder}
                      class="absolute -right-0.5 top-1/2 -translate-y-1/2 w-[8px] h-[12px] flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 cursor-pointer"
                      on:click|stopPropagation
                    >
                      <svg
                        viewBox="0 0 4 6"
                        class={`w-[5px] h-[7px] fill-black dark:fill-white transition-transform duration-200 ${dropdownStates[group.id] ? "rotate-90" : ""}`}
                      >
                        <path
                          d="M1.07298,0.159458C0.827521,-0.0531526,0.429553,-0.0531526,0.184094,0.159458C-0.0613648,0.372068,-0.0613648,0.716778,0.184094,0.929388L2.61275,3.03303L0.260362,5.07061C0.0149035,5.28322,0.0149035,5.62793,0.260362,5.84054C0.505822,6.05315,0.903789,6.05315,1.14925,5.84054L3.81591,3.53075C4.01812,3.3556,4.05374,3.0908,3.92279,2.88406C3.93219,2.73496,3.87113,2.58315,3.73964,2.46925L1.07298,0.159458Z"
                        />
                      </svg>
                    </div>
                  </DropdownMenu.Trigger>
                </button>

                <!-- Dropdown Menu -->
                <DropdownMenu.Content
                  side="right"
                  align="start"
                  sideOffset={4}
                  class="w-52 max-h-80 overflow-y-auto scroller rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-1 z-50"
                >
                  <DropdownMenu.Group>
                    {#each group.options as option}
                      <DropdownMenu.Item
                        class={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg transition-colors ${
                          selectedToolByGroup[group.id] === option.id
                            ? "bg-neutral-100 dark:bg-neutral-800 text-gray-900 dark:text-white font-medium"
                            : "text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
                        }`}
                        on:click={() => {
                          activateDrawingTool(
                            group.id,
                            option.id,
                            option.overlay,
                          );
                          dropdownStates[group.id] = false;
                        }}
                      >
                        <svg
                          viewBox="0 0 22 22"
                          class="h-[18px] w-[18px] flex-shrink-0 fill-current"
                        >
                          <path d={toolIcons[option.icon]} />
                        </svg>
                        <span>{option.label}</span>
                      </DropdownMenu.Item>
                    {/each}
                  </DropdownMenu.Group>
                </DropdownMenu.Content>
              </div>
            </DropdownMenu.Root>
          {/each}

          <!-- Separator -->
          <div class="w-5 h-px bg-neutral-700 my-2"></div>

          <!-- Magnet Mode -->
          <DropdownMenu.Root bind:open={dropdownStates.magnet}>
            <div class="relative mt-1 group/magnet">
              <button
                class={`relative flex h-[38px] w-[38px] items-center justify-center rounded transition-all duration-200 ${
                  drawingMode !== "normal"
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                }`}
                on:click={() => {
                  if (drawingMode === "normal") {
                    drawingMode = "weak_magnet";
                  } else {
                    drawingMode = "normal";
                  }
                }}
                title={drawingMode === "normal"
                  ? "Enable magnet mode"
                  : "Disable magnet mode"}
              >
                <svg viewBox="0 0 28 28" class="h-6 w-6 fill-current">
                  <path d={toolIcons.magnet} />
                </svg>
                <!-- Dropdown Arrow -->
                <DropdownMenu.Trigger asChild let:builder>
                  <div
                    use:builder.action
                    {...builder}
                    class="absolute -right-0.5 top-1/2 -translate-y-1/2 w-[8px] h-[12px] flex items-center justify-center opacity-0 group-hover/magnet:opacity-100 transition-opacity duration-150 cursor-pointer"
                    on:click|stopPropagation
                  >
                    <svg
                      viewBox="0 0 4 6"
                      class={`w-[5px] h-[7px] fill-black dark:fill-white transition-transform duration-200 ${dropdownStates.magnet ? "rotate-90" : ""}`}
                    >
                      <path
                        d="M1.07298,0.159458C0.827521,-0.0531526,0.429553,-0.0531526,0.184094,0.159458C-0.0613648,0.372068,-0.0613648,0.716778,0.184094,0.929388L2.61275,3.03303L0.260362,5.07061C0.0149035,5.28322,0.0149035,5.62793,0.260362,5.84054C0.505822,6.05315,0.903789,6.05315,1.14925,5.84054L3.81591,3.53075C4.01812,3.3556,4.05374,3.0908,3.92279,2.88406C3.93219,2.73496,3.87113,2.58315,3.73964,2.46925L1.07298,0.159458Z"
                      />
                    </svg>
                  </div>
                </DropdownMenu.Trigger>
              </button>

              <!-- Magnet Mode Dropdown -->
              <DropdownMenu.Content
                side="right"
                align="start"
                sideOffset={4}
                class="w-44 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-1 z-50"
              >
                <DropdownMenu.Group>
                  <DropdownMenu.Item
                    class={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg transition-colors ${
                      drawingMode === "weak_magnet"
                        ? "bg-neutral-100 dark:bg-neutral-800 text-gray-900 dark:text-white font-medium"
                        : "text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
                    }`}
                    on:click={() => {
                      drawingMode = "weak_magnet";
                      dropdownStates.magnet = false;
                    }}
                  >
                    <svg
                      viewBox="0 0 28 28"
                      class="h-[18px] w-[18px] flex-shrink-0 fill-current"
                    >
                      <path d={toolIcons.magnet} />
                    </svg>
                    <span>Weak Magnet</span>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    class={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg transition-colors ${
                      drawingMode === "strong_magnet"
                        ? "bg-neutral-100 dark:bg-neutral-800 text-gray-900 dark:text-white font-medium"
                        : "text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
                    }`}
                    on:click={() => {
                      drawingMode = "strong_magnet";
                      dropdownStates.magnet = false;
                    }}
                  >
                    <svg
                      viewBox="0 0 28 28"
                      class="h-[18px] w-[18px] flex-shrink-0 fill-current"
                    >
                      <path d={toolIcons.magnet} />
                    </svg>
                    <span>Strong Magnet</span>
                  </DropdownMenu.Item>
                </DropdownMenu.Group>
              </DropdownMenu.Content>
            </div>
          </DropdownMenu.Root>

          <!-- Visibility -->
          <button
            class={`flex h-[38px] w-[38px] items-center justify-center rounded transition-all duration-200 mt-1 ${
              !drawingsVisible
                ? "bg-neutral-800 text-white"
                : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
            }`}
            on:click={toggleDrawingsVisibility}
            title={drawingsVisible ? "Hide drawings" : "Show drawings"}
          >
            <svg viewBox="0 0 22 22" class="h-6 w-6 fill-current">
              <path
                d={drawingsVisible ? toolIcons.visible : toolIcons.invisible}
              />
            </svg>
          </button>

          <!-- Separator -->
          <div class="w-5 h-px bg-neutral-700 my-2"></div>

          <!-- Zoom Tools -->
          <button
            class="flex h-[38px] w-[38px] items-center justify-center rounded text-neutral-400 transition-all duration-200 hover:bg-neutral-800 hover:text-neutral-200"
            on:click={() => zoomChart(1.2)}
            title="Zoom in"
          >
            <ZoomIn class="h-6 w-6" />
          </button>
          <button
            class="flex h-[38px] w-[38px] items-center justify-center rounded text-neutral-400 transition-all duration-200 hover:bg-neutral-800 hover:text-neutral-200 mt-1"
            on:click={() => zoomChart(0.9)}
            title="Zoom out"
          >
            <ZoomOut class="h-6 w-6" />
          </button>

          <!-- Bottom Controls -->
          <div class="mt-auto flex flex-col items-center pb-2">
            <!-- Screenshot -->
            <button
              class="flex h-[38px] w-[38px] items-center justify-center rounded text-neutral-400 transition-all duration-200 hover:bg-neutral-800 hover:text-neutral-200"
              on:click={downloadChart}
              title="Screenshot"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 28 28"
                class="h-6 w-6 fill-current"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M11.118 6a.5.5 0 0 0-.447.276L9.809 8H5.5A1.5 1.5 0 0 0 4 9.5v10A1.5 1.5 0 0 0 5.5 21h16a1.5 1.5 0 0 0 1.5-1.5v-10A1.5 1.5 0 0 0 21.5 8h-4.309l-.862-1.724A.5.5 0 0 0 15.882 6h-4.764zm-1.342-.17A1.5 1.5 0 0 1 11.118 5h4.764a1.5 1.5 0 0 1 1.342.83L17.809 7H21.5A2.5 2.5 0 0 1 24 9.5v10a2.5 2.5 0 0 1-2.5 2.5h-16A2.5 2.5 0 0 1 3 19.5v-10A2.5 2.5 0 0 1 5.5 7h3.691l.585-1.17z"
                />
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M13.5 18a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm0 1a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z"
                />
              </svg>
            </button>

            <!-- Remove All -->
            <button
              class="flex h-[38px] w-[38px] items-center justify-center rounded text-neutral-400 transition-all duration-200 hover:bg-neutral-800 hover:text-rose-500 mt-1"
              on:click={removeAllDrawings}
              title="Remove all drawings"
            >
              <svg viewBox="0 0 28 28" class="h-6 w-6 fill-current">
                <path d={toolIcons.remove} />
              </svg>
            </button>
          </div>
        </div>
      {/if}

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

        <!-- Earnings markers overlay (only for non-intraday ranges when enabled) -->
        {#if isSubscribed && showEarnings && isNonIntradayRange(activeRange) && earningsMarkers.length > 0}
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
                    style={!marker.isFuture &&
                    hasBeatExpectations(marker.earnings)
                      ? "transform: rotate(180deg)"
                      : ""}
                  >
                    {#if marker?.isFuture}
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
                    {:else if hasBeatExpectations(marker?.earnings)}
                      <!-- Past earnings with positive surprise: green, upside down -->
                      <path
                        d="M1 3.5C1 1.84315 2.34315 0.5 4 0.5H14C15.6569 0.5 17 1.84315 17 3.5V13.5C17 14.4 16.6 15.2 15.9 15.8L9 21.5L2.1 15.8C1.4 15.2 1 14.4 1 13.5V3.5Z"
                        fill="#10B981"
                      />
                      <text
                        x="9"
                        y="14"
                        text-anchor="middle"
                        dominant-baseline="middle"
                        fill="white"
                        font-size="10"
                        font-weight="bold"
                        font-family="system-ui, sans-serif"
                        transform="rotate(180 9 11)">E</text
                      >
                    {:else}
                      <!-- Past earnings: solid red fill -->
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
                          ? "text-emerald-800 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"}>Surprise</span
                      >
                      <span
                        class={surprise?.positive
                          ? "text-emerald-800 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"}
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
                            ? "text-emerald-800 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"}
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
                          ? "text-emerald-800 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"}>Surprise</span
                      >
                      <span
                        class={surprise?.positive
                          ? "text-emerald-800 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"}
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
                            ? "text-emerald-800 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"}
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

        <!-- Dividend markers overlay (only for non-intraday ranges when enabled) -->
        {#if isSubscribed && showDividends && isNonIntradayRange(activeRange) && dividendMarkers.length > 0}
          <div class="absolute inset-0 pointer-events-none z-[5]">
            {#each dividendMarkers as marker (marker.timestamp)}
              {#if marker?.visible}
                <button
                  class="absolute bottom-[145px] -translate-x-1/2 pointer-events-auto cursor-pointer transition-transform hover:scale-110"
                  style="left: {marker.x}px"
                  on:click={(e) => handleDividendClick(marker, e)}
                  aria-label="View dividend details"
                >
                  <svg
                    width="24"
                    height="30"
                    viewBox="0 0 18 22"
                    class="drop-shadow-md"
                  >
                    <!-- Dividend marker: solid blue fill -->
                    <path
                      d="M1 3.5C1 1.84315 2.34315 0.5 4 0.5H14C15.6569 0.5 17 1.84315 17 3.5V13.5C17 14.4 16.6 15.2 15.9 15.8L9 21.5L2.1 15.8C1.4 15.2 1 14.4 1 13.5V3.5Z"
                      fill="#3B82F6"
                    />
                    <text
                      x="9"
                      y="11"
                      text-anchor="middle"
                      dominant-baseline="middle"
                      fill="white"
                      font-size="10"
                      font-weight="bold"
                      font-family="system-ui, sans-serif">D</text
                    >
                  </svg>
                </button>
              {/if}
            {/each}
          </div>
        {/if}

        <!-- Dividend popup -->
        {#if selectedDividend}
          <div
            class="absolute z-[7] pointer-events-auto"
            style="left: {dividendPopupPosition.x}px; top: {dividendPopupPosition.y}px; transform: translate(-50%, -100%)"
          >
            <div
              class="bg-[#1a1a1a] border border-neutral-700 rounded-xl shadow-2xl p-4 min-w-[280px] max-w-[320px]"
            >
              <!-- Header -->
              <div class="flex items-center gap-2 mb-3">
                <h3 class="text-white font-semibold">Dividend</h3>
                <button
                  class="cursor-pointer ml-auto text-neutral-400 hover:text-white transition"
                  on:click={closeDividendPopup}
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

              <!-- Dividend info -->
              <div class="text-sm text-neutral-300 mb-3 space-y-1">
                <div class="flex justify-between">
                  <span class="text-neutral-500">Ex-Dividend Date</span>
                  <span class="text-white">
                    {new Date(selectedDividend.date).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" },
                    )}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-neutral-500">Amount</span>
                  <span class="text-blue-400 font-semibold">
                    ${selectedDividend.adjDividend?.toFixed(4)}
                  </span>
                </div>
                {#if selectedDividend.declarationDate}
                  <div class="flex justify-between">
                    <span class="text-neutral-500">Declaration Date</span>
                    <span>
                      {new Date(
                        selectedDividend.declarationDate,
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                {/if}
                {#if selectedDividend.recordDate}
                  <div class="flex justify-between">
                    <span class="text-neutral-500">Record Date</span>
                    <span>
                      {new Date(selectedDividend.recordDate).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" },
                      )}
                    </span>
                  </div>
                {/if}
                {#if selectedDividend.paymentDate}
                  <div class="flex justify-between">
                    <span class="text-neutral-500">Payment Date</span>
                    <span>
                      {new Date(
                        selectedDividend.paymentDate,
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                {/if}
              </div>

              <!-- Link to more details -->
              <a
                href="/stocks/{ticker}/dividends"
                class="block w-full text-center py-2 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium rounded-lg transition"
              >
                More {ticker} dividends
              </a>
            </div>
          </div>

          <!-- Click outside to close -->
          <button
            class="fixed inset-0 z-[6] cursor-default"
            on:click={closeDividendPopup}
            aria-label="Close dividend popup"
          ></button>
        {/if}

        <!-- News Flow markers overlay (only for non-intraday ranges when enabled) -->
        {#if isSubscribed && showNewsFlow && isNonIntradayRange(activeRange) && newsMarkers.length > 0}
          <div class="absolute inset-0 pointer-events-none z-[5]">
            {#each newsMarkers as marker (marker.news.date)}
              {#if marker?.visible}
                <button
                  class="absolute bottom-[115px] -translate-x-1/2 pointer-events-auto cursor-pointer transition-transform hover:scale-110"
                  style="left: {marker.x}px"
                  on:click={(e) => handleNewsClick(marker, e)}
                  aria-label="View news details"
                >
                  <svg
                    width="24"
                    height="30"
                    viewBox="0 0 18 22"
                    class="drop-shadow-md"
                  >
                    <path
                      d="M1 3.5C1 1.84315 2.34315 0.5 4 0.5H14C15.6569 0.5 17 1.84315 17 3.5V13.5C17 14.4 16.6 15.2 15.9 15.8L9 21.5L2.1 15.8C1.4 15.2 1 14.4 1 13.5V3.5Z"
                      fill={getNewsMarkerColor(marker.news.changesPercentage)}
                    />
                    <text
                      x="9"
                      y="11"
                      text-anchor="middle"
                      dominant-baseline="middle"
                      fill="white"
                      font-size="10"
                      font-weight="bold"
                      font-family="system-ui, sans-serif">N</text
                    >
                  </svg>
                </button>
              {/if}
            {/each}
          </div>
        {/if}

        <!-- News popup -->
        {#if selectedNews}
          <div
            class="absolute z-[7] pointer-events-auto"
            style="left: {newsPopupPosition.x}px; top: {newsPopupPosition.y}px; transform: translate(-50%, -100%)"
          >
            <div
              class="bg-[#1a1a1a] border border-neutral-700 rounded-xl shadow-2xl p-4 min-w-[300px] max-w-[380px]"
            >
              <!-- Header -->
              <div class="flex items-center justify-between gap-2 mb-3">
                <h3 class="text-white font-semibold">Why Price Moved</h3>
                <span
                  class={`text-sm font-semibold ${
                    typeof selectedNews.changesPercentage === "number"
                      ? selectedNews.changesPercentage > 0
                        ? "text-emerald-400"
                        : selectedNews.changesPercentage < 0
                          ? "text-red-400"
                          : "text-neutral-400"
                      : selectedNews.changesPercentage === "-" ||
                          selectedNews.changesPercentage === null
                        ? "text-neutral-400"
                        : parseFloat(String(selectedNews.changesPercentage)) > 0
                          ? "text-emerald-400"
                          : parseFloat(String(selectedNews.changesPercentage)) <
                              0
                            ? "text-red-400"
                            : "text-neutral-400"
                  }`}
                >
                  {#if typeof selectedNews.changesPercentage === "number"}
                    {selectedNews.changesPercentage > 0
                      ? "+"
                      : ""}{selectedNews.changesPercentage.toFixed(2)}%
                  {:else if selectedNews.changesPercentage === "-" || selectedNews.changesPercentage === null}
                    -
                  {:else}
                    {parseFloat(String(selectedNews.changesPercentage)) > 0
                      ? "+"
                      : ""}{selectedNews.changesPercentage}%
                  {/if}
                </span>
              </div>

              <!-- Date -->
              <div class="text-xs text-neutral-500 mb-2">
                {new Date(selectedNews.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>

              <!-- News Text -->
              <p class="text-neutral-200 text-sm leading-relaxed">
                {selectedNews.text}
              </p>
            </div>
          </div>

          <!-- Click outside to close -->
          <button
            class="fixed inset-0 z-[6] cursor-default"
            on:click={closeNewsPopup}
            aria-label="Close news popup"
          ></button>
        {/if}

        <!-- GEX (Gamma Exposure) horizontal levels overlay -->
        {#if indicatorState.gex && gexLevels.length > 0}
          <div class="absolute inset-0 pointer-events-none z-[4]">
            {#each gexLevels as level (level.strike)}
              {#if level.visible}
                <!-- Horizontal line -->
                <div
                  class="absolute left-0 right-0 h-[2px] pointer-events-auto cursor-pointer transition-opacity hover:opacity-100"
                  style="top: {level.y}px; background: {level.isPositive
                    ? 'rgba(34, 197, 94, ' + (0.4 + level.intensity * 0.5) + ')'
                    : 'rgba(239, 68, 68, ' +
                      (0.4 + level.intensity * 0.5) +
                      ')'}; height: {1 + level.intensity * 2}px; opacity: {0.6 +
                    level.intensity * 0.4}"
                  on:click={(e) => handleGexLevelClick(level, e)}
                  on:keypress={(e) =>
                    e.key === "Enter" && handleGexLevelClick(level, e)}
                  role="button"
                  tabindex="0"
                  aria-label="GEX level at ${level.strike}"
                ></div>
              {/if}
            {/each}
          </div>
        {/if}

        <!-- DEX (Delta Exposure) horizontal levels overlay -->
        {#if indicatorState.dex && dexLevels.length > 0}
          <div class="absolute inset-0 pointer-events-none z-[4]">
            {#each dexLevels as level (level.strike)}
              {#if level.visible}
                <!-- Horizontal line with dashed style for DEX -->
                <div
                  class="absolute left-0 right-0 pointer-events-auto cursor-pointer transition-opacity hover:opacity-100"
                  style="top: {level.y}px; border-top: {1 +
                    level.intensity * 2}px dashed {level.isPositive
                    ? 'rgba(59, 130, 246, ' +
                      (0.5 + level.intensity * 0.5) +
                      ')'
                    : 'rgba(249, 115, 22, ' +
                      (0.5 + level.intensity * 0.5) +
                      ')'}; opacity: {0.6 + level.intensity * 0.4}"
                  on:click={(e) => handleDexLevelClick(level, e)}
                  on:keypress={(e) =>
                    e.key === "Enter" && handleDexLevelClick(level, e)}
                  role="button"
                  tabindex="0"
                  aria-label="DEX level at ${level.strike}"
                ></div>
              {/if}
            {/each}
          </div>
        {/if}

        <!-- GEX/DEX popup -->
        {#if selectedGexLevel || selectedDexLevel}
          {@const level = selectedGexLevel || selectedDexLevel}
          {@const isGex = selectedGexLevel !== null}
          <!-- Click outside to close (behind popup) -->
          <button
            class="fixed inset-0 z-[6] cursor-default bg-transparent"
            on:click={closeGexDexPopup}
            aria-label="Close GEX/DEX popup"
          ></button>
          <div
            class="absolute z-[7] pointer-events-auto w-[260px]"
            style="left: {gexDexPopupPosition.x}px; top: {gexDexPopupPosition.y}px;"
          >
            <div
              class="bg-[#1a1a1a] border border-neutral-700 rounded-xl shadow-2xl p-3 sm:p-4 w-full"
            >
              <!-- Header -->
              <div class="flex items-center gap-2 mb-2 sm:mb-3">
                <div
                  class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                  style="background: {isGex
                    ? level?.isPositive
                      ? '#22c55e'
                      : '#ef4444'
                    : level?.isPositive
                      ? '#3b82f6'
                      : '#f97316'}"
                ></div>
                <h3
                  class="text-white font-semibold text-sm sm:text-base truncate"
                >
                  {isGex ? "Gamma (GEX)" : "Delta (DEX)"}
                </h3>
                <button
                  class="cursor-pointer ml-auto text-neutral-400 hover:text-white transition flex-shrink-0"
                  on:click={closeGexDexPopup}
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

              <!-- Strike info -->
              <div class="text-xs sm:text-sm space-y-1.5 sm:space-y-2">
                <div class="flex justify-between text-neutral-300">
                  <span class="text-neutral-500">Strike</span>
                  <span class="font-medium">${level?.strike.toFixed(2)}</span>
                </div>
                <div class="flex justify-between text-neutral-300">
                  <span class="text-neutral-500"
                    >Net {isGex ? "Gamma" : "Delta"}</span
                  >
                  <span
                    class="font-medium {level?.isPositive
                      ? 'text-emerald-800 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'}"
                  >
                    {level?.isPositive ? "+" : ""}{level?.value?.toLocaleString(
                      "en-US",
                    ) || 0}
                  </span>
                </div>
                <div class="flex justify-between text-neutral-300">
                  <span class="text-neutral-500">Call</span>
                  <span class="text-emerald-800 dark:text-emerald-400"
                    >+{level?.callValue?.toLocaleString("en-US") || 0}</span
                  >
                </div>
                <div class="flex justify-between text-neutral-300">
                  <span class="text-neutral-500">Put</span>
                  <span class="text-rose-600 dark:text-rose-400"
                    >{level?.putValue?.toLocaleString("en-US") || 0}</span
                  >
                </div>
              </div>

              <!-- Explanation -->
              <div
                class="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-neutral-700 text-[10px] sm:text-xs text-neutral-400 leading-relaxed"
              >
                {#if isGex}
                  {#if level?.isPositive}
                    <p>
                      Positive GEX: Price pinned here. MMs sell rallies, buy
                      dips.
                    </p>
                  {:else}
                    <p>
                      Negative GEX: Price accelerates. Higher volatility
                      expected.
                    </p>
                  {/if}
                {:else if level?.isPositive}
                  <p>
                    Positive DEX: Dealers long delta. Mean-reverting behavior.
                  </p>
                {:else}
                  <p>
                    Negative DEX: Dealers short delta. Trend-following behavior.
                  </p>
                {/if}
              </div>

              <!-- Link to more details -->
              <a
                href="/{resolvedAssetType}/{ticker}/options/{isGex
                  ? 'gex'
                  : 'dex'}/strike"
                class="block w-full text-center py-1.5 sm:py-2 px-3 mt-2 sm:mt-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs sm:text-sm font-medium rounded-lg transition"
              >
                View all levels
              </a>
            </div>
          </div>
        {/if}

        <!-- Open Interest (OI) horizontal levels overlay -->
        {#if indicatorState.oi && oiLevels.length > 0}
          <div class="absolute inset-0 pointer-events-none z-[4]">
            {#each oiLevels as level (level.strike)}
              {#if level.visible}
                <!-- Horizontal line with dotted style for OI -->
                <div
                  class="absolute left-0 right-0 pointer-events-auto cursor-pointer transition-opacity hover:opacity-100"
                  style="top: {level.y}px; border-top: {1 +
                    level.intensity * 2}px dotted rgba(168, 85, 247, {0.5 +
                    level.intensity * 0.5}); opacity: {0.6 +
                    level.intensity * 0.4}"
                  on:click={(e) => handleOiLevelClick(level, e)}
                  on:keypress={(e) =>
                    e.key === "Enter" && handleOiLevelClick(level, e)}
                  role="button"
                  tabindex="0"
                  aria-label="OI level at ${level.strike}"
                ></div>
              {/if}
            {/each}
          </div>
        {/if}

        <!-- OI popup -->
        {#if selectedOiLevel}
          <!-- Click outside to close (behind popup) -->
          <button
            class="fixed inset-0 z-[6] cursor-default bg-transparent"
            on:click={closeOiPopup}
            aria-label="Close OI popup"
          ></button>
          <div
            class="absolute z-[7] pointer-events-auto w-[260px]"
            style="left: {oiPopupPosition.x}px; top: {oiPopupPosition.y}px;"
          >
            <div
              class="bg-[#1a1a1a] border border-neutral-700 rounded-xl shadow-2xl p-3 sm:p-4 w-full"
            >
              <!-- Header -->
              <div class="flex items-center gap-2 mb-2 sm:mb-3">
                <div
                  class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                  style="background: #a855f7"
                ></div>
                <h3
                  class="text-white font-semibold text-sm sm:text-base truncate"
                >
                  Open Interest (OI)
                </h3>
                <button
                  class="cursor-pointer ml-auto text-neutral-400 hover:text-white transition flex-shrink-0"
                  on:click={closeOiPopup}
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

              <!-- Strike info -->
              <div class="text-xs sm:text-sm space-y-1.5 sm:space-y-2">
                <div class="flex justify-between text-neutral-300">
                  <span class="text-neutral-500">Strike</span>
                  <span class="font-medium"
                    >${selectedOiLevel.strike.toFixed(2)}</span
                  >
                </div>
                <div class="flex justify-between text-neutral-300">
                  <span class="text-neutral-500">Total OI</span>
                  <span class="font-medium text-purple-400">
                    {selectedOiLevel.totalOi?.toLocaleString("en-US")}
                  </span>
                </div>
                <div class="flex justify-between text-neutral-300">
                  <span class="text-neutral-500">Call OI</span>
                  <span class="text-emerald-800 dark:text-emerald-400"
                    >{selectedOiLevel.callOi?.toLocaleString("en-US")}</span
                  >
                </div>
                <div class="flex justify-between text-neutral-300">
                  <span class="text-neutral-500">Put OI</span>
                  <span class="text-rose-600 dark:text-rose-400"
                    >{selectedOiLevel.putOi?.toLocaleString("en-US")}</span
                  >
                </div>
                <div class="flex justify-between text-neutral-300">
                  <span class="text-neutral-500">P/C Ratio</span>
                  <span
                    class="font-medium {selectedOiLevel.callOi > 0 &&
                    selectedOiLevel.putOi / selectedOiLevel.callOi > 1
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-800 dark:text-emerald-400'}"
                  >
                    {selectedOiLevel.callOi > 0
                      ? (
                          selectedOiLevel.putOi / selectedOiLevel.callOi
                        ).toFixed(2)
                      : "N/A"}
                  </span>
                </div>
              </div>

              <!-- Explanation -->
              <div
                class="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-neutral-700 text-[10px] sm:text-xs text-neutral-400 leading-relaxed"
              >
                <p>
                  High OI here indicates significant positioning. May act as
                  support/resistance.
                </p>
              </div>

              <!-- Link to more details -->
              <a
                href="/{resolvedAssetType}/{ticker}/options/oi"
                class="block w-full text-center py-1.5 sm:py-2 px-3 mt-2 sm:mt-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs sm:text-sm font-medium rounded-lg transition"
              >
                View all levels
              </a>
            </div>
          </div>
        {/if}

        <!-- Hottest Contracts horizontal levels overlay -->
        {#if indicatorState.hottest && hottestLevels.length > 0}
          <div class="absolute inset-0 pointer-events-none z-[4]">
            {#each hottestLevels as level (level.strike + level.optionType + level.expiration)}
              {#if level.visible}
                <!-- Horizontal line - solid green for calls, solid red for puts -->
                <div
                  class="absolute left-0 right-0 pointer-events-auto cursor-pointer transition-opacity hover:opacity-100"
                  style="top: {level.y}px; height: {1.5 +
                    level.intensity * 2}px; background: {level.optionType ===
                  'C'
                    ? 'rgba(16, 185, 129, ' +
                      (0.5 + level.intensity * 0.5) +
                      ')'
                    : 'rgba(244, 63, 94, ' +
                      (0.5 + level.intensity * 0.5) +
                      ')'}; opacity: {0.6 + level.intensity * 0.4}"
                  on:click={(e) => handleHottestLevelClick(level, e)}
                  on:keypress={(e) =>
                    e.key === "Enter" && handleHottestLevelClick(level, e)}
                  role="button"
                  tabindex="0"
                  aria-label="Hottest contract at ${level.strike}"
                ></div>
              {/if}
            {/each}
          </div>
        {/if}

        <!-- Hottest Contracts popup -->
        {#if selectedHottestLevel}
          <!-- Click outside to close (behind popup) -->
          <button
            class="fixed inset-0 z-[6] cursor-default bg-transparent"
            on:click={closeHottestPopup}
            aria-label="Close Hottest Contracts popup"
          ></button>
          <div
            class="absolute z-[7] pointer-events-auto w-[260px]"
            style="left: {hottestPopupPosition.x}px; top: {hottestPopupPosition.y}px;"
          >
            <div
              class="bg-[#1a1a1a] border border-neutral-700 rounded-xl shadow-2xl p-3 sm:p-4 w-full"
            >
              <!-- Header -->
              <div class="flex items-center gap-2 mb-2 sm:mb-3">
                <div
                  class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                  style="background: {selectedHottestLevel.optionType === 'C'
                    ? '#10b981'
                    : '#f43f5e'}"
                ></div>
                <h3
                  class="text-white font-semibold text-sm sm:text-base truncate"
                >
                  {selectedHottestLevel.optionType === "C" ? "Call" : "Put"} ${selectedHottestLevel.strike}
                </h3>
                <button
                  class="cursor-pointer ml-auto text-neutral-400 hover:text-white transition flex-shrink-0"
                  on:click={closeHottestPopup}
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

              <!-- Contract info -->
              <div class="text-xs sm:text-sm space-y-1.5 sm:space-y-2">
                <div class="flex justify-between text-neutral-300">
                  <span class="text-neutral-500">Expiration</span>
                  <span class="font-medium"
                    >{formatExpiration(selectedHottestLevel.expiration)}</span
                  >
                </div>
                <div class="flex justify-between text-neutral-300">
                  <span class="text-neutral-500">Volume</span>
                  <span class="font-medium text-amber-400">
                    {selectedHottestLevel.volume?.toLocaleString("en-US")}
                  </span>
                </div>
                <div class="flex justify-between text-neutral-300">
                  <span class="text-neutral-500">Open Interest</span>
                  <span class="text-purple-400"
                    >{selectedHottestLevel.openInterest?.toLocaleString(
                      "en-US",
                    )}</span
                  >
                </div>
                <div class="flex justify-between text-neutral-300">
                  <span class="text-neutral-500">Last Price</span>
                  <span
                    class={selectedHottestLevel.optionType === "C"
                      ? "text-emerald-800 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"}
                    >${selectedHottestLevel.last?.toFixed(2)}</span
                  >
                </div>
                <div class="flex justify-between text-neutral-300">
                  <span class="text-neutral-500">IV</span>
                  <span class="font-medium"
                    >{(selectedHottestLevel.iv * 100)?.toFixed(1)}%</span
                  >
                </div>
                <div class="flex justify-between text-neutral-300">
                  <span class="text-neutral-500">Premium</span>
                  <span class="font-medium"
                    >${selectedHottestLevel.premium?.toLocaleString("en-US", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}</span
                  >
                </div>
              </div>

              <!-- Explanation -->
              <div
                class="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-neutral-700 text-[10px] sm:text-xs text-neutral-400 leading-relaxed"
              >
                <p>
                  High volume contract. Large trades here may signal
                  institutional activity or hedging.
                </p>
              </div>

              <!-- Link to more details -->
              <a
                href="/{resolvedAssetType}/{ticker}/options/hottest-contracts/volume"
                class="block w-full text-center py-1.5 sm:py-2 px-3 mt-2 sm:mt-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs sm:text-sm font-medium rounded-lg transition"
              >
                View all contracts
              </a>
            </div>
          </div>
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
            Select Indicators ({indicatorItems.length} total)
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
          Technical Indicators
        </h4>
        {#each Object.entries(groupedIndicators).filter(([cat]) => cat !== "Options") as [category, indicators]}
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

        {#if groupedIndicators["Options"]}
          <h4
            class="mb-1 font-semibold text-lg mt-8 text-gray-900 dark:text-white"
          >
            Options
          </h4>
          <div class="mt-4">
            <div class="flex flex-wrap">
              {#each groupedIndicators["Options"] as indicator}
                <div
                  class="flex w-full items-center space-x-1.5 py-1.5 md:w-1/2 lg:w-1/3 lg:py-1"
                >
                  {#if isSubscribed}
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
                  {:else}
                    <button
                      on:click={() => goto("/pricing")}
                      class="flex items-center cursor-pointer text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                    >
                      <svg
                        class="w-4 h-4 mr-1.5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                        />
                      </svg>
                      <span class="text-[1rem]">{indicator.label}</span>
                    </button>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}

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

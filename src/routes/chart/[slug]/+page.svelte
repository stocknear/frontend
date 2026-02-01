<script lang="ts">
  import { goto } from "$app/navigation";
  import { afterUpdate, onDestroy, onMount } from "svelte";
  import { init, dispose, registerOverlay } from "klinecharts";
  import type { KLineData, Chart } from "klinecharts";
  import { DateTime } from "luxon";
  import { mode } from "mode-watcher";
  import { toast } from "svelte-sonner";
  import {
    registerCustomIndicators,
    setShortInterestData,
    clearShortInterestData,
    setFTDData,
    clearFTDData,
    clearMaxPainData,
    setRevenueData,
    clearRevenueData,
    setMarketCapData,
    clearMarketCapData,
    setStatementMetricData,
    clearStatementMetricData,
  } from "$lib/klinecharts/customIndicators";
  import {
    STATEMENT_INDICATORS,
    STATEMENT_INDICATOR_BY_ID,
    STATEMENT_INDICATOR_INDEX,
    STATEMENT_INDICATOR_TAB_MAP,
  } from "$lib/financials/statementIndicators";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import Input from "$lib/components/Input.svelte";
  import { isOpen, screenWidth } from "$lib/store";
  import ChevronDown from "lucide-svelte/icons/chevron-down";
  import MousePointer2 from "lucide-svelte/icons/mouse-pointer-2";
  import ZoomIn from "lucide-svelte/icons/zoom-in";
  import ZoomOut from "lucide-svelte/icons/zoom-out";
  import ArrowLeft from "lucide-svelte/icons/arrow-left";
  import ChartCandlestick from "lucide-svelte/icons/chart-candlestick";
  import ChartLine from "lucide-svelte/icons/chart-line";
  import Timer from "lucide-svelte/icons/timer";
  import Trash2 from "lucide-svelte/icons/trash-2";
  import IndentDecrease from "lucide-svelte/icons/indent-decrease";
  import IndentIncrease from "lucide-svelte/icons/indent-increase";
  import DatabaseZap from "lucide-svelte/icons/database-zap";
  import AlarmClockPlus from "lucide-svelte/icons/alarm-clock-plus";
  import { groupChartIndicators, abbreviateNumber } from "$lib/utils";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
  export let form;

  const zone = "America/New_York";
  const PRICE_DECIMALS = 2;
  type FinancialIndicatorPeriod = "annual" | "quarterly" | "ttm";

  // Chart theme colors
  const CHART_COLORS = {
    UP: "#22ab94", // Green for price increase
    DOWN: "#f23645", // Red for price decrease
    POSITIVE: "#10B981", // Green for positive values (earnings beat, etc.)
    NEGATIVE: "#B91C1C", // Red for negative values (earnings miss, etc.)
    NEUTRAL: "#9ca3af", // Gray for neutral values
  } as const;

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
  // Keys are per-ticker to save settings separately for each ticker
  const getChartEventsKey = (tickerSymbol: string) =>
    `chart-events-${tickerSymbol}`;
  const getChartOverlaysKey = (tickerSymbol: string) =>
    `chart-overlays-${tickerSymbol}`;

  interface ChartSettings {
    chartType: string;
    activeRange: string;
    showEarnings?: boolean;
    showDividends?: boolean;
    showNewsFlow?: boolean;
    showShortInterest?: boolean;
    financialIndicatorPeriod?: FinancialIndicatorPeriod;
    revenueIndicatorPeriod?: FinancialIndicatorPeriod;
    epsIndicatorPeriod?: FinancialIndicatorPeriod;
    statementIndicatorPeriods?: Record<string, FinancialIndicatorPeriod>;
    selectedToolByGroup?: Record<string, string>; // Toolbar selection state
    drawingMode?: "normal" | "weak_magnet" | "strong_magnet";
    drawingsLocked?: boolean;
    drawingsVisible?: boolean;
    savedAt?: number; // Timestamp for 1Y cache expiration
  }

  // 1 Year in milliseconds for localStorage cache duration
  const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

  // Valid chart types for validation
  const VALID_CHART_TYPES = [
    "bars",
    "candles",
    "hollow_candles",
    "heikin_ashi",
    "line_step",
    "area",
    "hlc_area",
    "high_low",
  ] as const;

  // Valid drawing modes
  const VALID_DRAWING_MODES = [
    "normal",
    "weak_magnet",
    "strong_magnet",
  ] as const;

  // Valid tool groups for toolbar
  const VALID_TOOL_GROUPS = [
    "lines",
    "channels",
    "shapes",
    "fibonacci",
    "waves",
  ] as const;

  // Ticker validation regex (1-5 uppercase letters, optionally with dots for BRK.A style)
  const TICKER_REGEX = /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/;

  // Validate ticker format
  const isValidTicker = (ticker: string): boolean => {
    return typeof ticker === "string" && TICKER_REGEX.test(ticker);
  };

  // Sanitize chart settings from localStorage
  const sanitizeChartSettings = (parsed: unknown): ChartSettings | null => {
    if (!parsed || typeof parsed !== "object") return null;

    const settings = parsed as Record<string, unknown>;

    // Validate chartType
    const chartType =
      typeof settings.chartType === "string" &&
      VALID_CHART_TYPES.includes(settings.chartType as any)
        ? settings.chartType
        : "candles";

    // Validate activeRange
    const activeRange =
      typeof settings.activeRange === "string" &&
      timeframes.includes(settings.activeRange)
        ? settings.activeRange
        : "1D";

    // Validate booleans
    const showEarnings =
      typeof settings.showEarnings === "boolean"
        ? settings.showEarnings
        : undefined;
    const showDividends =
      typeof settings.showDividends === "boolean"
        ? settings.showDividends
        : undefined;
    const showNewsFlow =
      typeof settings.showNewsFlow === "boolean"
        ? settings.showNewsFlow
        : undefined;
    const showShortInterest =
      typeof settings.showShortInterest === "boolean"
        ? settings.showShortInterest
        : undefined;
    const drawingsLocked =
      typeof settings.drawingsLocked === "boolean"
        ? settings.drawingsLocked
        : undefined;
    const drawingsVisible =
      typeof settings.drawingsVisible === "boolean"
        ? settings.drawingsVisible
        : undefined;

    // Validate drawingMode
    const drawingMode =
      typeof settings.drawingMode === "string" &&
      VALID_DRAWING_MODES.includes(settings.drawingMode as any)
        ? (settings.drawingMode as "normal" | "weak_magnet" | "strong_magnet")
        : undefined;

    // Validate selectedToolByGroup
    let selectedToolByGroup: Record<string, string> | undefined;
    if (
      settings.selectedToolByGroup &&
      typeof settings.selectedToolByGroup === "object"
    ) {
      const toolGroup = settings.selectedToolByGroup as Record<string, unknown>;
      selectedToolByGroup = {};
      for (const key of VALID_TOOL_GROUPS) {
        if (typeof toolGroup[key] === "string") {
          selectedToolByGroup[key] = toolGroup[key] as string;
        }
      }
    }

    // Validate savedAt timestamp
    const savedAt =
      typeof settings.savedAt === "number" && settings.savedAt > 0
        ? settings.savedAt
        : undefined;

    // Validate financial indicator periods
    const validPeriods = ["annual", "quarterly", "ttm"];
    const financialIndicatorPeriod =
      typeof settings.financialIndicatorPeriod === "string" &&
      validPeriods.includes(settings.financialIndicatorPeriod)
        ? (settings.financialIndicatorPeriod as FinancialIndicatorPeriod)
        : undefined;
    const revenueIndicatorPeriod =
      typeof settings.revenueIndicatorPeriod === "string" &&
      validPeriods.includes(settings.revenueIndicatorPeriod)
        ? (settings.revenueIndicatorPeriod as FinancialIndicatorPeriod)
        : undefined;
    const epsIndicatorPeriod =
      typeof settings.epsIndicatorPeriod === "string" &&
      validPeriods.includes(settings.epsIndicatorPeriod)
        ? (settings.epsIndicatorPeriod as FinancialIndicatorPeriod)
        : undefined;

    // Validate statementIndicatorPeriods
    let statementIndicatorPeriods:
      | Record<string, FinancialIndicatorPeriod>
      | undefined;
    if (
      settings.statementIndicatorPeriods &&
      typeof settings.statementIndicatorPeriods === "object"
    ) {
      const periods = settings.statementIndicatorPeriods as Record<
        string,
        unknown
      >;
      statementIndicatorPeriods = {};
      for (const [key, value] of Object.entries(periods)) {
        if (typeof value === "string" && validPeriods.includes(value)) {
          statementIndicatorPeriods[key] = value as FinancialIndicatorPeriod;
        }
      }
    }

    return {
      chartType,
      activeRange,
      showEarnings,
      showDividends,
      showNewsFlow,
      showShortInterest,
      drawingsLocked,
      drawingsVisible,
      drawingMode,
      selectedToolByGroup,
      savedAt,
      financialIndicatorPeriod,
      revenueIndicatorPeriod,
      epsIndicatorPeriod,
      statementIndicatorPeriods,
    };
  };

  // Overlay data interface for type safety
  interface ChartOverlayData {
    name: string;
    points?: Array<{ timestamp: number; value: number }>;
    extendData?: unknown;
    styles?: Record<string, unknown>;
  }

  // Sanitize overlay data from localStorage
  const sanitizeOverlays = (parsed: unknown): ChartOverlayData[] => {
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is Record<string, unknown> => {
        return (
          item && typeof item === "object" && typeof item.name === "string"
        );
      })
      .map((item) => ({
        name: String(item.name),
        points: Array.isArray(item.points)
          ? item.points.filter(
              (p: unknown) =>
                p &&
                typeof p === "object" &&
                typeof (p as any).timestamp === "number" &&
                typeof (p as any).value === "number",
            )
          : undefined,
        extendData: item.extendData,
        styles:
          item.styles && typeof item.styles === "object"
            ? (item.styles as Record<string, unknown>)
            : undefined,
      }));
  };

  // WebSocket tick message interface for type safety
  interface WsTickMessage {
    type: "Q" | "T";
    s?: string; // symbol
    t?: number | string; // timestamp (various formats)
    time?: string; // alternative timestamp format
    lp?: number; // last price
    ap?: number; // ask price
    bp?: number; // bid price
    ls?: number; // last size (volume)
  }

  // Validate WebSocket message
  const isValidWsMessage = (item: unknown): item is WsTickMessage => {
    if (!item || typeof item !== "object") return false;
    const msg = item as Record<string, unknown>;
    // Must have valid type and at least one price field
    if (msg.type !== "Q" && msg.type !== "T") return false;
    const hasPrice =
      typeof msg.lp === "number" ||
      typeof msg.ap === "number" ||
      typeof msg.bp === "number";
    return hasPrice;
  };

  // Validate WebSocket URL
  const isValidWsUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "wss:" || parsed.protocol === "ws:";
    } catch {
      return false;
    }
  };

  const loadChartSettings = (tickerSymbol?: string): ChartSettings | null => {
    const symbol = tickerSymbol || data?.ticker;
    if (!symbol) return null;
    const key = getChartEventsKey(symbol);
    try {
      const saved = localStorage?.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Sanitize and validate the parsed data
        const settings = sanitizeChartSettings(parsed);
        if (!settings) return null;

        // Check if data is older than 1 year
        if (settings.savedAt) {
          const now = Date.now();
          if (now - settings.savedAt > ONE_YEAR_MS) {
            // Data expired, clear it
            localStorage?.removeItem(key);
            return null;
          }
        }
        return settings;
      }
    } catch {
      // Silent fail - corrupted localStorage data
    }
    return null;
  };

  const saveChartSettings = (
    settings: ChartSettings,
    tickerSymbol?: string,
  ) => {
    const symbol = tickerSymbol || data?.ticker;
    if (!symbol) return;
    const key = getChartEventsKey(symbol);
    try {
      // Add timestamp for 1Y cache expiration
      const settingsWithTimestamp = {
        ...settings,
        savedAt: Date.now(),
      };
      localStorage?.setItem(key, JSON.stringify(settingsWithTimestamp));
    } catch {
      // Silent fail - localStorage full or unavailable
    }
  };

  const loadChartOverlays = (tickerSymbol?: string): ChartOverlayData[] => {
    const symbol = tickerSymbol || data?.ticker;
    if (!symbol) return [];
    const key = getChartOverlaysKey(symbol);
    try {
      const saved = localStorage?.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Sanitize and validate the parsed data
        return sanitizeOverlays(parsed);
      }
    } catch {
      // Silent fail - corrupted localStorage data
    }
    return [];
  };

  const saveChartOverlays = (
    overlays: ChartOverlayData[],
    tickerSymbol?: string,
  ) => {
    const symbol = tickerSymbol || data?.ticker;
    if (!symbol) return;
    const key = getChartOverlaysKey(symbol);
    try {
      localStorage?.setItem(key, JSON.stringify(overlays));
    } catch {
      // Silent fail - localStorage full or unavailable
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

  // Financial statement data interface
  interface FinancialStatementRow {
    date?: string;
    calendarYear?: string;
    period?: string;
    symbol?: string;
    revenue?: number;
    netIncome?: number;
    eps?: number;
    [key: string]: unknown; // Allow additional properties
  }

  // FTD data interface
  interface FtdDataPoint {
    date: string;
    failsToDeliver?: number;
    price?: number;
    timestamp?: number;
  }

  // Revenue data interface
  interface RevenueDataPoint {
    date?: string;
    revenue?: number;
    timestamp?: number;
  }

  // Market cap data interface
  interface MarketCapDataPoint {
    date?: string;
    marketCap?: number;
    timestamp?: number;
  }

  // Statement data bundle type
  interface StatementDataBundle {
    annual: FinancialStatementRow[];
    quarter: FinancialStatementRow[];
    ttm: FinancialStatementRow[];
  }

  // Short Interest marker types and state
  interface ShortInterestData {
    recordDate: string;
    totalShortInterest: number | string;
    shortPercentOfFloat: number;
    daysToCover: number;
    shortPriorMo: number | string;
    percentChangeMoMo: number;
    shortPercentOfOut: number;
  }

  interface ShortInterestMarker {
    shortInterest: ShortInterestData;
    timestamp: number;
    x: number;
    y: number;
    visible: boolean;
  }

  let historicalShortInterest: ShortInterestData[] = [];
  let shortInterestMarkers: ShortInterestMarker[] = [];
  let showShortInterest = false;
  let shortInterestLoading = false;
  let selectedShortInterest: ShortInterestData | null = null;
  let shortInterestPopupPosition = { x: 0, y: 0 };

  // New indicator data storage
  let ftdData: FtdDataPoint[] = [];
  let ftdLoading = false;
  let maxPainData: MaxPainDataPoint[] = [];
  let maxPainLoading = false;
  let analystTargetLoading = false;
  let revenueIndicatorPeriod: FinancialIndicatorPeriod = "ttm";
  let statementIndicatorPeriods: Record<string, FinancialIndicatorPeriod> = {};
  let incomeStatementData: StatementDataBundle | null = null;
  let incomeStatementLoading = false;
  let incomeStatementTicker = "";
  let balanceSheetData: StatementDataBundle | null = null;
  let balanceSheetLoading = false;
  let balanceSheetTicker = "";
  let cashFlowStatementData: StatementDataBundle | null = null;
  let cashFlowStatementLoading = false;
  let cashFlowStatementTicker = "";
  let ratiosStatementData: StatementDataBundle | null = null;
  let ratiosStatementLoading = false;
  let ratiosStatementTicker = "";
  let revenueData: RevenueDataPoint[] = [];
  let revenueLoading = false;
  let marketCapData: MarketCapDataPoint[] = [];
  let marketCapLoading = false;

  // Cached timestamp maps for performance (avoid re-computing on every scroll/zoom)
  let earningsTimestampCache = new Map<EarningsData, number>();
  let dividendTimestampCache = new Map<DividendData, number>();
  let newsTimestampCache = new Map<NewsData, number>();
  let shortInterestTimestampCache = new Map<ShortInterestData, number>();

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
    absValue: number;
    callValue: number;
    putValue: number;
    y: number; // pixel position
    visible: boolean;
    isPositive: boolean;
    intensity: number; // 0-1 for line thickness/opacity
    showLabel: boolean;
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
  let gexLevelCacheKey = "";
  let dexLevelCacheKey = "";
  const EXPOSURE_LEVEL_LIMIT = 12;
  const EXPOSURE_LABEL_LIMIT = 6;
  const EXPOSURE_SPOT_WINDOW = 0.15;

  // Visibility padding for markers (pixels outside visible area to still render)
  const MARKER_VISIBILITY_PADDING = 20;

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
    expiration: string | null;
    dte: number | null;
    y: number;
    visible: boolean;
    intensity: number; // 0-1 for line thickness based on OI magnitude
    showLabel: boolean;
  }

  let oiStrikeData: OiStrikeData[] = [];
  let oiLevels: OiLevel[] = [];
  let oiLoading = false;
  let selectedOiLevel: OiLevel | null = null;
  let oiPopupPosition = { x: 0, y: 0 };
  let oiSelectedExpiration: string | null = null;
  let oiLevelCacheKey = "";
  const OI_LEVEL_LIMIT = 12;
  const OI_LABEL_LIMIT = 6;

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
    dte: number | null;
    y: number;
    visible: boolean;
    intensity: number;
    showLabel: boolean;
  }

  let hottestContractsData: HottestContract[] = [];
  let hottestLevels: HottestLevel[] = [];
  let hottestLoading = false;
  let selectedHottestLevel: HottestLevel | null = null;
  let hottestPopupPosition = { x: 0, y: 0 };
  let hottestLevelCacheKey = "";
  const HOTTEST_LEVEL_LIMIT = 12;
  const HOTTEST_LABEL_LIMIT = 6;

  // Max Pain types and state
  interface MaxPainDataPoint {
    expiration: string;
    maxPain: number;
  }

  interface MaxPainLevel {
    price: number;
    expiration: string;
    dte: number | null;
    y: number;
    labelY: number;
    visible: boolean;
    isPrimary: boolean;
    intensity: number;
  }

  let maxPainLevels: MaxPainLevel[] = [];
  let selectedMaxPainLevel: MaxPainLevel | null = null;
  let maxPainPopupPosition = { x: 0, y: 0 };

  // Analyst Target types and state
  type AnalystTargetKey = "low" | "average" | "median" | "high";
  interface AnalystTargetSummary {
    low: number | null;
    average: number | null;
    median: number | null;
    high: number | null;
    numAnalysts: number | null;
    consensus: string | null;
  }

  interface AnalystTargetLevel {
    key: AnalystTargetKey;
    label: string;
    price: number;
    y: number;
    labelY: number;
    visible: boolean;
    color: string;
  }

  let analystTargetSummary: AnalystTargetSummary | null = null;
  let analystTargetLevels: AnalystTargetLevel[] = [];
  let selectedAnalystTargetLevel: AnalystTargetLevel | null = null;
  let analystTargetPopupPosition = { x: 0, y: 0 };

  $: isSubscribed = data?.user?.tier === "Pro";

  // Responsive breakpoint helpers
  $: isMobile = $screenWidth > 0 && $screenWidth < 640;
  $: isTablet = $screenWidth >= 640 && $screenWidth < 1024;
  $: isDesktop = $screenWidth >= 1024;

  // Save event toggle states to localStorage
  const saveEventSettings = () => {
    const currentSettings = loadChartSettings() || {
      chartType: "candles",
      activeRange: "1D",
    };
    saveChartSettings({
      ...currentSettings,
      showEarnings,
      showDividends,
      showNewsFlow,
      showShortInterest,
    });
  };

  let chartContainer: HTMLDivElement | null = null;
  let chart: Chart | null = null;
  let hoverBar: KLineData | null = null;
  let currentBars: KLineData[] = [];
  let activeRange = "1D";

  // Memoized bar index lookup - only recreates Map when currentBars changes
  let _cachedBars: KLineData[] | null = null;
  let _barIndexMap = new Map<number, number>();
  const getBarIndexByTimestamp = (timestamp: number): number | undefined => {
    // Rebuild map only if currentBars reference changed
    if (_cachedBars !== currentBars) {
      _cachedBars = currentBars;
      _barIndexMap = new Map(
        currentBars.map((bar, index) => [bar.timestamp, index]),
      );
    }
    return _barIndexMap.get(timestamp);
  };
  type ChartTypeId =
    | "bars"
    | "candles"
    | "hollow_candles"
    | "heikin_ashi"
    | "line_step"
    | "area"
    | "hlc_area"
    | "high_low";
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
  let isSearchActive = false;
  let technicalGroups: Array<[string, IndicatorDefinition[]]> = [];
  type FundamentalTabId = "income" | "balance" | "cashflow" | "ratios";
  let fundamentalsTab: FundamentalTabId = "income";
  let indicatorModalSection:
    | "Selected"
    | "Favorites"
    | "Technicals"
    | "Fundamentals"
    | "Options"
    | "Statistics" = "Technicals";
  const INDICATOR_FAVORITES_KEY = "chart-indicator-favorites";
  const indicatorStarPath =
    "M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327l4.898.696c.441.062.612.636.282.95l-3.522 3.356l.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z";
  let indicatorFavorites: string[] = [];
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
    // Handle string timestamps like "2026-01-12 14:09" (New York timezone)
    if (typeof value === "string" && value.includes("-")) {
      const parsed = DateTime.fromFormat(value, "yyyy-MM-dd HH:mm", {
        zone,
      });
      if (parsed.isValid) {
        return parsed.toMillis();
      }
    }
    // Handle numeric timestamps (nanoseconds, microseconds, milliseconds, seconds)
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
  const resolveTickPrice = (tick: WsTickMessage): number | null =>
    toNumber(tick?.lp) ?? toNumber(tick?.ap) ?? toNumber(tick?.bp);
  const resolveTickVolume = (tick: WsTickMessage): number =>
    toNumber(tick?.ls) ?? 0;
  const normalizeAssetType = (value: unknown): string => {
    if (typeof value !== "string") return "";
    let type = value.toLowerCase().trim();
    if (type === "stock") return "stocks";
    if (["stocks", "etf", "index"].includes(type)) return type;
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

  const statementIndicatorDefinitions: IndicatorDefinition[] =
    STATEMENT_INDICATORS.map((indicator) => ({
      id: indicator.id,
      label: indicator.label,
      indicatorName: "SN_STATEMENT_METRIC",
      category: "Fundamentals",
      infoKey: indicator.property,
      defaultParams: [],
      pane: "panel",
      height: 120,
    }));

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
      height: 150,
    },
    {
      id: "rsi",
      label: "Relative Strength Index",
      indicatorName: "SN_RSI",
      category: "Momentum",
      infoKey: "rsi",
      defaultParams: [14],
      pane: "panel",
      height: 150,
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
      height: 150,
    },
    {
      id: "stoch",
      label: "Stochastic Oscillator",
      indicatorName: "SN_STOCH",
      category: "Momentum",
      defaultParams: [14, 3],
      pane: "panel",
      height: 150,
    },
    {
      id: "stoch_crossover",
      label: "Stochastic Crossover",
      indicatorName: "SN_STOCH_X",
      category: "Momentum",
      defaultParams: [14, 3],
      pane: "panel",
      height: 150,
    },
    {
      id: "cci",
      label: "Commodity Channel Index",
      indicatorName: "SN_CCI",
      category: "Momentum",
      infoKey: "cci",
      defaultParams: [20],
      pane: "panel",
      height: 150,
    },
    {
      id: "williams_r",
      label: "Williams %R",
      indicatorName: "SN_WILLIAMS",
      category: "Momentum",
      defaultParams: [14],
      pane: "panel",
      height: 150,
    },
    {
      id: "mfi",
      label: "Money Flow Index",
      indicatorName: "SN_MFI",
      category: "Volume",
      infoKey: "mfi",
      defaultParams: [14],
      pane: "panel",
      height: 150,
    },

    {
      id: "roc",
      label: "Rate of Change",
      indicatorName: "SN_ROC",
      category: "Momentum",
      defaultParams: [12],
      pane: "panel",
      height: 150,
    },
    {
      id: "tsi",
      label: "True Strength Index",
      indicatorName: "SN_TSI",
      category: "Momentum",
      defaultParams: [25, 13, 7],
      pane: "panel",
      height: 150,
    },
    {
      id: "aroon",
      label: "Aroon",
      indicatorName: "SN_AROON",
      category: "Trend",
      defaultParams: [25],
      pane: "panel",
      height: 150,
    },
    {
      id: "std",
      label: "Standard Deviation",
      indicatorName: "SN_STD",
      category: "Volatility",
      defaultParams: [20],
      pane: "panel",
      height: 150,
    },
    {
      id: "hist_vol",
      label: "Historical Volatility",
      indicatorName: "SN_HVOL",
      category: "Volatility",
      defaultParams: [20],
      pane: "panel",
      height: 150,
    },
    {
      id: "chaikin_vol",
      label: "Chaikin Volatility",
      indicatorName: "SN_CHAIKIN",
      category: "Volatility",
      defaultParams: [10, 10],
      pane: "panel",
      height: 150,
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
    // Fundamentals category
    {
      id: "short_interest",
      label: "Short Interest",
      indicatorName: "SN_SHORT_INTEREST",
      category: "Statistics",
      defaultParams: [],
      pane: "panel",
      height: 120,
    },
    {
      id: "revenue",
      label: "Revenue",
      indicatorName: "SN_REVENUE",
      category: "Fundamentals",
      defaultParams: [],
      pane: "panel",
      height: 120,
    },
    {
      id: "market_cap",
      label: "Market Cap",
      indicatorName: "SN_MARKET_CAP",
      category: "Statistics",
      defaultParams: [],
      pane: "panel",
      height: 120,
    },
    {
      id: "analyst_target",
      label: "Analyst Price Target",
      indicatorName: "SN_ANALYST_TARGET",
      category: "Statistics",
      defaultParams: [],
      pane: "candle",
      isOverlay: true,
    },
    ...statementIndicatorDefinitions,
    // Options category
    {
      id: "max_pain",
      label: "Max Pain",
      indicatorName: "SN_MAX_PAIN",
      category: "Options",
      defaultParams: [],
      pane: "candle",
      isOverlay: true,
    },
    // Statistics category
    {
      id: "ftd",
      label: "Fail-to-Deliver",
      indicatorName: "SN_FTD",
      category: "Statistics",
      defaultParams: [],
      pane: "panel",
      height: 120,
    },
  ];

  const FINANCIAL_PERIOD_OPTIONS: {
    id: FinancialIndicatorPeriod;
    label: string;
  }[] = [
    { id: "annual", label: "Annual" },
    { id: "quarterly", label: "Quarterly" },
    { id: "ttm", label: "TTM" },
  ];
  const FINANCIAL_PERIOD_LABELS: Record<FinancialIndicatorPeriod, string> = {
    annual: "Annual",
    quarterly: "Quarterly",
    ttm: "TTM",
  };
  const FUNDAMENTAL_TABS: { id: FundamentalTabId; label: string }[] = [
    { id: "income", label: "Income statement" },
    { id: "balance", label: "Balance sheet" },
    { id: "cashflow", label: "Cash flow" },
    { id: "ratios", label: "Ratios" },
  ];
  const FUNDAMENTAL_INDICATOR_MAP: Record<string, FundamentalTabId> = {
    ...STATEMENT_INDICATOR_TAB_MAP,
    revenue: "income",
  };

  const indicatorParamDefaults: Record<string, number[]> = Object.fromEntries(
    indicatorDefinitions.map((item) => [item.id, item.defaultParams]),
  );
  const INDICATOR_MODAL_SECTIONS: Array<
    | "Selected"
    | "Favorites"
    | "Technicals"
    | "Fundamentals"
    | "Options"
    | "Statistics"
  > = [
    "Selected",
    "Favorites",
    "Technicals",
    "Fundamentals",
    "Options",
    "Statistics",
  ];

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
  let latestRealtimePrice: number | null = null;

  // WebSocket handler references for proper cleanup
  let wsOpenHandler: (() => void) | null = null;
  let wsMessageHandler: ((event: MessageEvent) => void) | null = null;
  let wsCloseHandler: (() => void) | null = null;

  // Timeout for WebSocket operations
  const WS_CLOSE_TIMEOUT_MS = 3000;

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

  // Chart loading state - shows spinner when loading historical data
  $: isChartLoading =
    minuteBarsLoading ||
    (intradayIntervals.includes(activeRange as IntradayInterval) &&
      intradayHistory[activeRange as IntradayInterval]?.isLoading);

  const intradayHistoryChunkDays = 5;

  // Base limits for non-Pro users
  const intradayHistoryBaseLimitDaysMap: Record<IntradayInterval, number> = {
    "1min": 30,
    "5min": 30,
    "15min": 90,
    "30min": 90,
    "1hour": 90,
  };

  // Pro limits (3x for 1min/5min, ~2.67x for others)
  const intradayHistoryProLimitDaysMap: Record<IntradayInterval, number> = {
    "1min": 90,
    "5min": 90,
    "15min": 240,
    "30min": 240,
    "1hour": 240,
  };

  // Dynamic limit based on subscription status
  const getIntradayLimitDays = (interval: IntradayInterval) => {
    const map = isSubscribed
      ? intradayHistoryProLimitDaysMap
      : intradayHistoryBaseLimitDaysMap;
    return map[interval] ?? 30;
  };

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
    horizontalSegment:
      "M6.91465,11L11.08535,11C11.29127,10.4174,11.84689,10,12.5,10C13.15311,10,13.70873,10.4174,13.91465,11L17.08535,11C17.29127,10.4174,17.84689,10,18.5,10C19.32843,10,20,10.67157,20,11.5C20,12.32843,19.32843,13,18.5,13C17.84689,13,17.29127,12.5826,17.08535,12L13.91465,12C13.70873,12.5826,13.15311,13,12.5,13C11.84689,13,11.29127,12.5826,11.08535,12L6.91465,12C6.70873,12.5826,6.15311,13,5.5,13C4.671573,13,4,12.32843,4,11.5C4,10.67157,4.671573,10,5.5,10C6.15311,10,6.70873,10.4174,6.91465,11Z",
    verticalRayLine:
      "M11,6.91465L11,11.08535C10.4174,11.29127,10,11.84689,10,12.5C10,13.15311,10.4174,13.70873,11,13.91465L11,18.5C11,18.7761,11.22386,19,11.5,19C11.77614,19,12,18.7761,12,18.5L12,13.91465C12.5826,13.70873,13,13.15311,13,12.5C13,11.84689,12.5826,11.29127,12,11.08535L12,6.91465C12.5826,6.70873,13,6.15311,13,5.5C13,4.671573,12.32843,4,11.5,4C10.67157,4,10,4.671573,10,5.5C10,6.15311,10.4174,6.70873,11,6.91465Z",
    verticalSegment:
      "M11,6.91465L11,11.08535C10.4174,11.29127,10,11.84689,10,12.5C10,13.15311,10.4174,13.70873,11,13.91465L11,17.08535C10.4174,17.29127,10,17.84689,10,18.5C10,19.32843,10.67157,20,11.5,20C12.32843,20,13,19.32843,13,18.5C13,17.84689,12.5826,17.29127,12,17.08535L12,13.91465C12.5826,13.70873,13,13.15311,13,12.5C13,11.84689,12.5826,11.29127,12,11.08535L12,6.91465C12.5826,6.70873,13,6.15311,13,5.5C13,4.671573,12.32843,4,11.5,4C10.67157,4,10,4.671573,10,5.5C10,6.15311,10.4174,6.70873,11,6.91465Z",
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
    lock: "M14.5 11V8.5C14.5 6.567 12.933 5 11 5C9.067 5 7.5 6.567 7.5 8.5V11H7C5.895 11 5 11.895 5 13V18C5 19.105 5.895 20 7 20H15C16.105 20 17 19.105 17 18V13C17 11.895 16.105 11 15 11H14.5ZM8.5 8.5C8.5 7.119 9.619 6 11 6C12.381 6 13.5 7.119 13.5 8.5V11H8.5V8.5ZM16 13V18C16 18.552 15.552 19 15 19H7C6.448 19 6 18.552 6 18V13C6 12.448 6.448 12 7 12H15C15.552 12 16 12.448 16 13Z",
    unlock:
      "M14.5 11H15C16.105 11 17 11.895 17 13V18C17 19.105 16.105 20 15 20H7C5.895 20 5 19.105 5 18V13C5 11.895 5.895 11 7 11H13.5V8.5C13.5 7.119 12.381 6 11 6C9.887 6 8.948 6.74 8.621 7.75L7.672 7.434C8.112 6.114 9.44 5 11 5C12.933 5 14.5 6.567 14.5 8.5V11ZM16 13C16 12.448 15.552 12 15 12H7C6.448 12 6 12.448 6 13V18C6 18.552 6.448 19 7 19H15C15.552 19 16 18.552 16 18V13Z",
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

  const indicatorItems = indicatorDefinitions.map((item) => ({
    id: item.id,
    label: item.label,
    category: item.category,
    infoKey: item.infoKey,
  }));
  const sanitizeIndicatorFavorites = (list: unknown) => {
    if (!Array.isArray(list)) return [];
    const validIds = new Set(indicatorItems.map((item) => item.id));
    const seen = new Set<string>();
    const sanitized: string[] = [];
    list.forEach((id) => {
      if (typeof id === "string" && validIds.has(id) && !seen.has(id)) {
        sanitized.push(id);
        seen.add(id);
      }
    });
    return sanitized;
  };
  const saveIndicatorFavorites = () => {
    try {
      localStorage?.setItem(
        INDICATOR_FAVORITES_KEY,
        JSON.stringify(indicatorFavorites),
      );
    } catch (e) {
      console.log("Failed saving indicator favorites:", e);
    }
  };
  const loadIndicatorFavorites = () => {
    try {
      const saved = localStorage?.getItem(INDICATOR_FAVORITES_KEY);
      if (saved) {
        indicatorFavorites = sanitizeIndicatorFavorites(JSON.parse(saved));
      }
    } catch (e) {
      console.log("Failed loading indicator favorites:", e);
    }
  };
  const toggleIndicatorFavorite = (event: Event | null, id: string) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (indicatorFavorites.includes(id)) {
      indicatorFavorites = indicatorFavorites.filter((item) => item !== id);
    } else {
      indicatorFavorites = [...indicatorFavorites, id];
    }
    indicatorFavorites = sanitizeIndicatorFavorites(indicatorFavorites);
    saveIndicatorFavorites();
  };
  const isIndicatorFavorite = (id: string) => indicatorFavorites.includes(id);
  const getFavoriteStarClass = (isFavorite: boolean) =>
    `shrink-0 transition cursor-pointer p-1.5 -m-1 rounded-lg active:bg-gray-200 dark:active:bg-zinc-700 ${
      isFavorite
        ? "opacity-100 text-amber-400"
        : "opacity-40 sm:opacity-0 sm:group-hover:opacity-100 text-gray-500 dark:text-zinc-400 hover:text-amber-400"
    }`;
  let favoriteIndicators: typeof indicatorItems = [];
  // In Favorites tab, sort alphabetically
  $: favoriteIndicators = indicatorItems
    .filter((item) => indicatorFavorites.includes(item.id))
    .slice()
    .sort((a, b) => a.label.localeCompare(b.label));
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
    // Prevent adding new drawings when locked
    if (drawingsLocked) return;

    selectedToolByGroup[groupId] = toolId;
    activeTool = toolId;

    // Save toolbar selection to localStorage
    const currentSettings = loadChartSettings() || {};
    saveChartSettings({
      ...currentSettings,
      selectedToolByGroup: { ...selectedToolByGroup },
      drawingMode,
    });

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
    // Save to localStorage
    const currentSettings = loadChartSettings() || {};
    saveChartSettings({ ...currentSettings, drawingsLocked });
  }

  function toggleDrawingsVisibility() {
    drawingsVisible = !drawingsVisible;
    if (chart && overlayIds.length > 0) {
      overlayIds.forEach((id) => {
        chart.overrideOverlay({ id, visible: drawingsVisible });
      });
    }
    // Save to localStorage
    const currentSettings = loadChartSettings() || {};
    saveChartSettings({ ...currentSettings, drawingsVisible });
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
      createPointFigures: ({
        chart,
        coordinates,
        bounding,
        overlay,
        yAxis,
      }) => {
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
          const extensionLevels = [
            0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.272, 1.618, 2, 2.618,
          ];

          const startX = 0;
          const endX = bounding.width;

          // Base point for extensions is point 3
          const baseValue = points[2].value;
          const baseY = coordinates[2].y;

          // Calculate Y per price unit using points 0 and 1
          const yPerPrice =
            points[1].value !== points[0].value
              ? (coordinates[1].y - coordinates[0].y) /
                (points[1].value - points[0].value)
              : 0;

          extensionLevels.forEach((level) => {
            // Extension value: base + (trend * level)
            // For uptrend: extensions go up from point 3
            // For downtrend: extensions go down from point 3
            const extensionPrice = baseValue + trendPriceDiff * level;
            const extensionY =
              baseY - (extensionPrice - baseValue) * Math.abs(yPerPrice);

            const formattedPrice = chart
              .getDecimalFold()
              .format(
                chart
                  .getThousandsSeparator()
                  .format(extensionPrice.toFixed(precision)),
              );

            figures.push({
              type: "line",
              attrs: {
                coordinates: [
                  { x: startX, y: extensionY },
                  { x: endX, y: extensionY },
                ],
              },
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

      // Check against limit
      const limitMs = getIntradayHistoryLimitMs(interval);
      const startTimestamp = merged[0]?.timestamp ?? null;
      const withinLimit =
        startTimestamp !== null ? startTimestamp > limitMs : false;

      updateIntradayState(interval, {
        hasMore: Boolean(result.hasMore) && withinLimit,
        isLoading: false,
      });

      return {
        bars: result.bars,
        hasMore: Boolean(result.hasMore) && withinLimit,
      };
    } else {
      // Empty bars returned - still enforce retention limits
      const limitMs = getIntradayHistoryLimitMs(interval);
      const existingBars = intradayHistory[interval].bars;
      const startTimestamp = existingBars[0]?.timestamp ?? null;
      const withinLimit =
        startTimestamp !== null ? startTimestamp > limitMs : false;

      updateIntradayState(interval, {
        hasMore: Boolean(result.hasMore) && withinLimit,
        isLoading: false,
      });

      return { bars: [], hasMore: Boolean(result.hasMore) && withinLimit };
    }
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
        const visible =
          pixel.x >= -MARKER_VISIBILITY_PADDING &&
          pixel.x <= chartWidth + MARKER_VISIBILITY_PADDING;

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
          const visible =
            pixel.x >= -MARKER_VISIBILITY_PADDING &&
            pixel.x <= chartWidth + MARKER_VISIBILITY_PADDING;
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
      let y = rect.height - panelIndicatorsHeight - 40; // Position above the event markers at volume y=0

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
        const visible =
          pixel.x >= -MARKER_VISIBILITY_PADDING &&
          pixel.x <= chartWidth + MARKER_VISIBILITY_PADDING;

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
      let y = rect.height - panelIndicatorsHeight - 40; // Position above the event markers at volume y=0

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
        const visible =
          pixel.x >= -MARKER_VISIBILITY_PADDING &&
          pixel.x <= chartWidth + MARKER_VISIBILITY_PADDING;

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
      let y = rect.height - panelIndicatorsHeight - 40; // Position above the event markers at volume y=0

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

  // Update short interest marker positions based on visible chart range
  const updateShortInterestMarkers = () => {
    if (
      !chart ||
      !chartContainer ||
      !isNonIntradayRange(activeRange) ||
      !cachedChartRect
    ) {
      shortInterestMarkers = [];
      return;
    }

    const chartWidth = cachedChartRect.width;
    const chartHeight = cachedChartRect.height;

    // Get the date range from historical price data
    const minTimestamp = dailyBars.length > 0 ? dailyBars[0].timestamp : null;
    const maxTimestamp =
      dailyBars.length > 0 ? dailyBars[dailyBars.length - 1].timestamp : null;

    // Create markers for each short interest date (using cached timestamps)
    const markers: ShortInterestMarker[] = [];

    for (const si of historicalShortInterest) {
      const timestamp = shortInterestTimestampCache.get(si);
      if (timestamp === undefined) continue;

      // Skip short interest outside the historical price date range
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
        const visible =
          pixel.x >= -MARKER_VISIBILITY_PADDING &&
          pixel.x <= chartWidth + MARKER_VISIBILITY_PADDING;

        // Find the price bar closest to this timestamp to get the y position
        let priceY = chartHeight / 2; // Default to middle if no price found
        const barIndex = getBarIndexByTimestamp(timestamp);
        if (barIndex !== undefined && currentBars[barIndex]) {
          const bar = currentBars[barIndex];
          const pricePixel = chart.convertToPixel({ value: bar.close });
          if (pricePixel && typeof pricePixel.y === "number") {
            priceY = pricePixel.y;
          }
        } else {
          // Try to find nearest bar by iterating through bars
          let closestBar = null;
          let closestDiff = Infinity;
          for (const bar of currentBars) {
            const diff = Math.abs(bar.timestamp - timestamp);
            if (diff < closestDiff) {
              closestDiff = diff;
              closestBar = bar;
            }
          }
          if (closestBar) {
            const pricePixel = chart.convertToPixel({
              value: closestBar.close,
            });
            if (pricePixel && typeof pricePixel.y === "number") {
              priceY = pricePixel.y;
            }
          }
        }

        markers.push({
          shortInterest: si,
          timestamp,
          x: pixel.x,
          y: priceY,
          visible,
        });
      }
    }

    shortInterestMarkers = markers;
  };

  // Handle short interest marker click
  const handleShortInterestClick = (
    marker: ShortInterestMarker,
    event: MouseEvent,
  ) => {
    event.stopPropagation();
    selectedShortInterest = marker.shortInterest;

    // Position popup near the click but ensure it stays on screen
    const rect = chartContainer?.getBoundingClientRect();
    if (rect) {
      let x = marker.x;
      let y = rect.height - panelIndicatorsHeight - 40; // Position above the event markers at volume y=0

      // Ensure popup doesn't go off screen
      if (x < 150) x = 150;
      if (x > rect.width - 150) x = rect.width - 150;

      shortInterestPopupPosition = { x, y };
    }
  };

  // Close short interest popup
  const closeShortInterestPopup = () => {
    selectedShortInterest = null;
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
      if (changesPercentage > 0) return CHART_COLORS.POSITIVE;
      if (changesPercentage < 0) return CHART_COLORS.NEGATIVE;
      return "#9ca3af"; // zero
    }
    // Handle string values
    const strValue = String(changesPercentage).trim();
    if (strValue === "-" || strValue === "") {
      return "#9ca3af"; // gray
    }
    const numValue = parseFloat(strValue);
    if (isNaN(numValue)) return "#9ca3af";
    if (numValue > 0) return CHART_COLORS.POSITIVE;
    if (numValue < 0) return CHART_COLORS.NEGATIVE;
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

      const resolveLatestSnapshot = (payload: unknown): GexDexStrikeData[] => {
        if (Array.isArray(payload)) return payload as GexDexStrikeData[];
        if (!payload || typeof payload !== "object") return [];

        const entries = Object.entries(payload).filter(([, value]) =>
          Array.isArray(value),
        ) as [string, GexDexStrikeData[]][];
        if (entries.length === 0) return [];

        let latest = entries[0];
        let latestDate = DateTime.fromISO(latest[0]);
        for (const entry of entries) {
          const dt = DateTime.fromISO(entry[0]);
          if (dt.isValid && (!latestDate.isValid || dt > latestDate)) {
            latest = entry;
            latestDate = dt;
          }
        }
        return Array.isArray(latest[1]) ? latest[1] : [];
      };

      const latestData = resolveLatestSnapshot(result);
      const aggregatedData = new Map<number, GexDexStrikeData>();

      for (const item of latestData) {
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

      // Calculate net values and convert to array
      const strikeData = Array.from(aggregatedData.values()).map((item) => ({
        ...item,
        net_gex: item.call_gex + item.put_gex,
        net_dex: item.call_dex + item.put_dex,
      }));

      if (type === "gex") {
        gexStrikeData = strikeData;
        gexLevelCacheKey = "";
        updateGexLevels();
      } else {
        dexStrikeData = strikeData;
        dexLevelCacheKey = "";
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

  const getSpotPrice = (): number | null => {
    if (typeof lastClose === "number") return lastClose;
    const lastBar = currentBars[currentBars.length - 1];
    return typeof lastBar?.close === "number" ? lastBar.close : null;
  };

  const computeExposureLevels = (
    strikeData: GexDexStrikeData[],
    netKey: "net_gex" | "net_dex",
    callKey: "call_gex" | "call_dex",
    putKey: "put_gex" | "put_dex",
    visibleRange: { from: number; to: number },
  ): GexDexLevel[] => {
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (let i = visibleRange.from; i < visibleRange.to; i++) {
      const bar = currentBars[i];
      if (bar) {
        minPrice = Math.min(minPrice, bar.low);
        maxPrice = Math.max(maxPrice, bar.high);
      }
    }

    if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice)) {
      return [];
    }

    const padding = (maxPrice - minPrice) * 0.1;
    minPrice -= padding;
    maxPrice += padding;

    const spotPrice = getSpotPrice();
    if (spotPrice) {
      const spotMin = spotPrice * (1 - EXPOSURE_SPOT_WINDOW);
      const spotMax = spotPrice * (1 + EXPOSURE_SPOT_WINDOW);
      minPrice = Math.min(minPrice, spotMin);
      maxPrice = Math.max(maxPrice, spotMax);
    }

    const candidates = strikeData.filter(
      (item) => item.strike >= minPrice && item.strike <= maxPrice,
    );
    if (candidates.length === 0) return [];

    const getNetValue = (item: GexDexStrikeData) => Number(item?.[netKey] ?? 0);

    const halfLimit = Math.max(2, Math.ceil(EXPOSURE_LEVEL_LIMIT / 2));
    const positives = candidates
      .filter((item) => getNetValue(item) > 0)
      .sort((a, b) => getNetValue(b) - getNetValue(a))
      .slice(0, halfLimit);
    const negatives = candidates
      .filter((item) => getNetValue(item) < 0)
      .sort((a, b) => Math.abs(getNetValue(b)) - Math.abs(getNetValue(a)))
      .slice(0, halfLimit);

    let selected = [...positives, ...negatives];

    if (spotPrice) {
      const closest = candidates.reduce(
        (best, item) => {
          if (!best) return item;
          return Math.abs(item.strike - spotPrice) <
            Math.abs(best.strike - spotPrice)
            ? item
            : best;
        },
        null as GexDexStrikeData | null,
      );

      if (closest && !selected.some((item) => item.strike === closest.strike)) {
        selected = [...selected, closest];
      }
    }

    const uniqueByStrike = new Map<number, GexDexStrikeData>();
    for (const item of selected) {
      const existing = uniqueByStrike.get(item.strike);
      if (!existing) {
        uniqueByStrike.set(item.strike, item);
        continue;
      }
      if (Math.abs(getNetValue(item)) > Math.abs(getNetValue(existing))) {
        uniqueByStrike.set(item.strike, item);
      }
    }

    const unique = Array.from(uniqueByStrike.values())
      .sort((a, b) => Math.abs(getNetValue(b)) - Math.abs(getNetValue(a)))
      .slice(0, EXPOSURE_LEVEL_LIMIT);

    const labelStrikes = new Set(
      unique.slice(0, EXPOSURE_LABEL_LIMIT).map((item) => item.strike),
    );
    const maxAbsValue = Math.max(
      ...unique.map((item) => Math.abs(getNetValue(item))),
      1,
    );
    const chartHeight = chart.getSize()?.height ?? cachedChartRect?.height ?? 0;

    const levels = unique
      .map((item) => {
        const netValue = getNetValue(item);
        const absValue = Math.abs(netValue);
        const pixel = chart.convertToPixel({ value: item.strike });
        if (!pixel || typeof pixel.y !== "number") return null;
        return {
          strike: item.strike,
          value: netValue,
          absValue,
          callValue: Number(item?.[callKey] ?? 0),
          putValue: Number(item?.[putKey] ?? 0),
          y: pixel.y,
          visible:
            chartHeight > 0
              ? pixel.y >= -MARKER_VISIBILITY_PADDING &&
                pixel.y <= chartHeight + MARKER_VISIBILITY_PADDING
              : true,
          isPositive: netValue >= 0,
          intensity: Math.sqrt(absValue / maxAbsValue),
          showLabel: labelStrikes.has(item.strike),
        };
      })
      .filter(Boolean) as GexDexLevel[];

    return levels.sort((a, b) => a.strike - b.strike);
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
    const spotPrice = getSpotPrice();
    const nextKey = `${visibleRange.from}:${visibleRange.to}:${gexStrikeData.length}:${spotPrice ?? "na"}`;
    if (nextKey === gexLevelCacheKey) return;
    gexLevelCacheKey = nextKey;

    gexLevels = computeExposureLevels(
      gexStrikeData,
      "net_gex",
      "call_gex",
      "put_gex",
      visibleRange,
    );
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
    const spotPrice = getSpotPrice();
    const nextKey = `${visibleRange.from}:${visibleRange.to}:${dexStrikeData.length}:${spotPrice ?? "na"}`;
    if (nextKey === dexLevelCacheKey) return;
    dexLevelCacheKey = nextKey;

    dexLevels = computeExposureLevels(
      dexStrikeData,
      "net_dex",
      "call_dex",
      "put_dex",
      visibleRange,
    );
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

  // Clear all level popups (GEX, DEX, OI, Hottest, MaxPain, AnalystTarget)
  const clearAllLevelPopups = () => {
    selectedGexLevel = null;
    selectedDexLevel = null;
    selectedOiLevel = null;
    selectedHottestLevel = null;
    selectedMaxPainLevel = null;
    selectedAnalystTargetLevel = null;
  };

  // Handle GEX level click
  const handleGexLevelClick = (level: GexDexLevel, event: MouseEvent) => {
    event.stopPropagation();
    clearAllLevelPopups();
    selectedGexLevel = level;
    gexDexPopupPosition = calculatePopupPosition(event);
  };

  // Handle DEX level click
  const handleDexLevelClick = (level: GexDexLevel, event: MouseEvent) => {
    event.stopPropagation();
    clearAllLevelPopups();
    selectedDexLevel = level;
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

      const entries = Object.entries(result ?? {}).filter(([, value]) =>
        Array.isArray(value),
      ) as [string, OiStrikeData[]][];

      const now = DateTime.now().setZone(zone).startOf("day");
      let bestFuture: [string, OiStrikeData[]] | null = null;
      let bestFutureDate: DateTime | null = null;
      let bestPast: [string, OiStrikeData[]] | null = null;
      let bestPastDate: DateTime | null = null;

      for (const entry of entries) {
        const dt = DateTime.fromISO(entry[0], { zone });
        if (!dt.isValid) continue;
        if (dt >= now) {
          if (!bestFutureDate || dt < bestFutureDate) {
            bestFutureDate = dt;
            bestFuture = entry;
          }
        } else if (!bestPastDate || dt > bestPastDate) {
          bestPastDate = dt;
          bestPast = entry;
        }
      }

      const selectedEntry = bestFuture ?? bestPast;

      if (!selectedEntry) {
        oiStrikeData = [];
        oiLevels = [];
        oiSelectedExpiration = null;
        oiLoading = false;
        return;
      }

      const [expiration, dateData] = selectedEntry;
      const strikeData = (Array.isArray(dateData) ? dateData : []).map(
        (item) => ({
          ...item,
          total_oi: (item.call_oi ?? 0) + (item.put_oi ?? 0),
        }),
      );

      oiSelectedExpiration = expiration;
      oiStrikeData = strikeData;
      oiLevelCacheKey = "";
      updateOiLevels();
    } catch (error) {
      console.error("Failed to fetch OI data:", error);
      oiStrikeData = [];
      oiLevels = [];
      oiSelectedExpiration = null;
      oiLevelCacheKey = "";
      oiSelectedExpiration = null;
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

    const spotPrice = getSpotPrice();
    const nextKey = `${visibleRange.from}:${visibleRange.to}:${oiStrikeData.length}:${spotPrice ?? "na"}:${oiSelectedExpiration ?? "na"}`;
    if (nextKey === oiLevelCacheKey) return;
    oiLevelCacheKey = nextKey;

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (let i = visibleRange.from; i < visibleRange.to; i++) {
      const bar = currentBars[i];
      if (bar) {
        minPrice = Math.min(minPrice, bar.low);
        maxPrice = Math.max(maxPrice, bar.high);
      }
    }

    if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice)) {
      oiLevels = [];
      return;
    }

    const padding = (maxPrice - minPrice) * 0.1;
    minPrice -= padding;
    maxPrice += padding;

    if (spotPrice) {
      const spotMin = spotPrice * (1 - EXPOSURE_SPOT_WINDOW);
      const spotMax = spotPrice * (1 + EXPOSURE_SPOT_WINDOW);
      minPrice = Math.min(minPrice, spotMin);
      maxPrice = Math.max(maxPrice, spotMax);
    }

    const visibleStrikes = oiStrikeData.filter(
      (item) => item.strike >= minPrice && item.strike <= maxPrice,
    );

    if (!visibleStrikes.length) {
      oiLevels = [];
      return;
    }

    const sortedStrikes = [...visibleStrikes]
      .sort((a, b) => (b.total_oi || 0) - (a.total_oi || 0))
      .slice(0, OI_LEVEL_LIMIT);

    const maxTotalOi = Math.max(
      ...sortedStrikes.map((item) => item.total_oi || 0),
      1,
    );
    const labelStrikes = new Set(
      sortedStrikes.slice(0, OI_LABEL_LIMIT).map((item) => item.strike),
    );
    const chartHeight = chart.getSize()?.height ?? cachedChartRect?.height ?? 0;
    const now = DateTime.now().setZone(zone).startOf("day");
    const expDate = oiSelectedExpiration
      ? DateTime.fromISO(oiSelectedExpiration, { zone })
      : null;
    const dte =
      expDate && expDate.isValid
        ? Math.max(0, Math.ceil(expDate.diff(now, "days").days))
        : null;

    const levels: OiLevel[] = [];
    for (const item of sortedStrikes) {
      const pixel = chart.convertToPixel({ value: item.strike });
      if (pixel && typeof pixel.y === "number") {
        levels.push({
          strike: item.strike,
          callOi: item.call_oi,
          putOi: item.put_oi,
          totalOi: item.total_oi || 0,
          expiration: oiSelectedExpiration,
          dte,
          y: pixel.y,
          visible:
            chartHeight > 0
              ? pixel.y >= -MARKER_VISIBILITY_PADDING &&
                pixel.y <= chartHeight + MARKER_VISIBILITY_PADDING
              : true,
          intensity: Math.sqrt((item.total_oi || 0) / maxTotalOi),
          showLabel: labelStrikes.has(item.strike),
        });
      }
    }

    oiLevels = levels;
  };

  // Handle OI level click
  const handleOiLevelClick = (level: OiLevel, event: MouseEvent) => {
    event.stopPropagation();
    clearAllLevelPopups();
    selectedOiLevel = level;
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
      hottestLevelCacheKey = "";
      updateHottestLevels();
    } catch (error) {
      console.error("Failed to fetch Hottest Contracts data:", error);
      hottestContractsData = [];
      hottestLevels = [];
    } finally {
      hottestLoading = false;
    }
  };

  // Fetch Short Interest data from API
  const fetchShortInterestData = async () => {
    if (!ticker || shortInterestLoading) return;

    shortInterestLoading = true;

    try {
      const response = await fetch("/api/chart-indicator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticker,
          category: "short-interest",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // The API returns { history: [...], sharesShort, shortRatio, etc. }
      const historyData = result?.history || [];

      historicalShortInterest = historyData;

      // Build timestamp cache for short interest data
      shortInterestTimestampCache = new Map();
      const indicatorData: {
        timestamp: number;
        shortPercentOfFloat: number;
        shortPercentOfOut: number;
        daysToCover: number;
        totalShortInterest: number;
      }[] = [];
      for (const si of historicalShortInterest) {
        if (si.recordDate) {
          const dt = DateTime.fromISO(si.recordDate, { zone });
          if (dt.isValid) {
            const timestamp = dt.startOf("day").toMillis();
            shortInterestTimestampCache.set(si, timestamp);
            indicatorData.push({
              timestamp,
              shortPercentOfFloat: si.shortPercentOfFloat ?? 0,
              shortPercentOfOut: si.shortPercentOfOut ?? 0,
              daysToCover: si.daysToCover ?? 0,
              totalShortInterest: Number(si.totalShortInterest) ?? 0,
            });
          }
        }
      }

      // Set data for the indicator and sync
      setShortInterestData(indicatorData);
      showShortInterest = true;

      // Sync indicators to create/update the short interest panel
      if (chart && indicatorState.short_interest) {
        syncIndicators();
      }

      updateAllOverlays();
    } catch (error) {
      console.error("Failed to fetch Short Interest data:", error);
      historicalShortInterest = [];
      shortInterestMarkers = [];
    } finally {
      shortInterestLoading = false;
    }
  };

  // Generic indicator fetch function
  const fetchIndicatorData = async (
    category: string,
    loadingFlag: string,
    setDataFn: (data: any[]) => void,
    transformFn: (item: any) => any,
  ) => {
    if (!ticker) return;

    try {
      const response = await fetch("/api/chart-indicator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, category }),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      const historyData = Array.isArray(result)
        ? result
        : result?.history || result?.data || [];

      const indicatorData = historyData
        .map(transformFn)
        .filter((d: any) => d.timestamp > 0);
      setDataFn(indicatorData);

      if (chart) syncIndicators();
    } catch (error) {
      console.error(`Failed to fetch ${category} data:`, error);
      setDataFn([]);
    }
  };

  // Fetch FTD data
  const fetchFTDDataIndicator = async () => {
    if (ftdLoading || !ticker) return;
    ftdLoading = true;
    try {
      console.log("[FTD] Fetching for ticker:", ticker);
      const response = await fetch("/api/chart-indicator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, category: "ftd" }),
      });

      console.log("[FTD] Response status:", response.status);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      console.log("[FTD] API result keys:", Object.keys(result || {}));

      // FTD API may return array directly or nested in history/data
      const historyData = Array.isArray(result)
        ? result
        : result?.history || result?.data || [];

      console.log("[FTD] historyData length:", historyData.length);

      if (historyData.length === 0) {
        console.warn("[FTD] No FTD data returned from API");
        ftdData = [];
        setFTDData([]);
        ftdLoading = false;
        return;
      }

      // Log first item to see actual field names
      console.log("[FTD] First raw item keys:", Object.keys(historyData[0]));
      console.log("[FTD] First raw item:", historyData[0]);

      const indicatorData = historyData
        .map((item: any) => {
          // Try multiple date field names
          const dateStr =
            item.date ||
            item.settlement_date ||
            item.settlementDate ||
            item.recordDate;

          let timestamp = 0;
          if (dateStr) {
            // Try ISO format first
            const dt = DateTime.fromISO(dateStr, { zone });
            if (dt.isValid) {
              timestamp = dt.startOf("day").toMillis();
            } else {
              // Fallback: try parsing as Date object
              const parsed = new Date(dateStr);
              if (!isNaN(parsed.getTime())) {
                timestamp = DateTime.fromJSDate(parsed, { zone })
                  .startOf("day")
                  .toMillis();
              }
            }
          }

          if (timestamp <= 0) {
            console.warn("[FTD] Invalid timestamp for item:", item);
          }

          return {
            timestamp,
            ftdShares:
              item.failToDeliver ??
              item.ftdShares ??
              item.ftd_shares ??
              item.quantity ??
              0,
          };
        })
        .filter((d: any) => d.timestamp > 0);

      console.log("[FTD] Valid items after filter:", indicatorData.length);
      if (indicatorData.length > 0) {
        console.log("[FTD] First transformed item:", indicatorData[0]);
        console.log(
          "[FTD] Last transformed item:",
          indicatorData[indicatorData.length - 1],
        );
      }

      ftdData = indicatorData;
      setFTDData(indicatorData);

      // Force indicator refresh
      if (chart && indicatorState.ftd) {
        const existingId = indicatorInstanceIds.ftd;
        if (existingId) {
          chart.removeIndicator({ id: existingId });
          indicatorInstanceIds.ftd = null;
        }
        syncIndicators();
      }
    } catch (error) {
      console.error("[FTD] Failed to fetch FTD data:", error);
      ftdData = [];
      setFTDData([]);
    }
    ftdLoading = false;
  };

  const parseMaxPainExpiration = (value: unknown): string | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const dt = DateTime.fromISO(trimmed, { zone });
    if (dt.isValid) return dt.toISODate();
    const alt = DateTime.fromFormat(trimmed, "yyyy-MM-dd", { zone });
    return alt.isValid ? alt.toISODate() : null;
  };

  const normalizeMaxPainData = (items: any[]): MaxPainDataPoint[] => {
    const normalized: MaxPainDataPoint[] = [];
    for (const item of Array.isArray(items) ? items : []) {
      const expiration =
        parseMaxPainExpiration(item?.expiration) ??
        parseMaxPainExpiration(item?.expirationDate) ??
        parseMaxPainExpiration(item?.expiration_date) ??
        parseMaxPainExpiration(item?.date) ??
        parseMaxPainExpiration(item?.recordDate);
      const maxPain = toNumber(item?.maxPain ?? item?.max_pain ?? item?.strike);
      if (!expiration || maxPain === null) continue;
      normalized.push({ expiration, maxPain });
    }
    normalized.sort((a, b) => a.expiration.localeCompare(b.expiration));
    return normalized;
  };

  // Fetch Max Pain data
  const fetchMaxPainData = async () => {
    if (maxPainLoading || !ticker) return;
    maxPainLoading = true;
    try {
      const response = await fetch("/api/chart-indicator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, category: "max-pain" }),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      const historyData = Array.isArray(result)
        ? result
        : result?.history || result?.data || [];

      maxPainData = normalizeMaxPainData(historyData);
      updateMaxPainLevels();
    } catch (error) {
      console.error("[MaxPain] Failed to fetch max pain data:", error);
      maxPainData = [];
      maxPainLevels = [];
    } finally {
      maxPainLoading = false;
    }
  };

  // Fetch Analyst Target data
  const fetchAnalystTargetData = async () => {
    if (analystTargetLoading || !ticker) return;
    analystTargetLoading = true;
    const normalizeTargetValue = (value: unknown) => {
      const num = toNumber(value);
      return num !== null && num > 0 ? num : null;
    };
    try {
      const response = await fetch("/api/chart-indicator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, category: "analyst-target" }),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();

      const summary: AnalystTargetSummary = {
        low: normalizeTargetValue(
          result?.lowPriceTarget ?? result?.low_price_target,
        ),
        average: normalizeTargetValue(
          result?.avgPriceTarget ??
            result?.averagePriceTarget ??
            result?.avg_price_target,
        ),
        median: normalizeTargetValue(
          result?.medianPriceTarget ?? result?.median_price_target,
        ),
        high: normalizeTargetValue(
          result?.highPriceTarget ?? result?.high_price_target,
        ),
        numAnalysts: toNumber(result?.numOfAnalyst ?? result?.num_of_analyst),
        consensus: result?.consensusRating ?? result?.consensus_rating ?? null,
      };

      const hasTargets =
        summary.low !== null ||
        summary.average !== null ||
        summary.median !== null ||
        summary.high !== null;

      analystTargetSummary = hasTargets ? summary : null;
      updateAnalystTargetLevels();
    } catch (error) {
      console.error("[AnalystTarget] Failed to fetch summary data:", error);
      analystTargetSummary = null;
      analystTargetLevels = [];
    }
    analystTargetLoading = false;
  };

  const resolveStatementPeriodData = (
    data: StatementDataBundle | null,
    period: FinancialIndicatorPeriod,
  ): { period: FinancialIndicatorPeriod; rows: FinancialStatementRow[] } => {
    if (!data) return { period, rows: [] };
    const periodMap: Record<FinancialIndicatorPeriod, FinancialStatementRow[]> =
      {
        annual: Array.isArray(data.annual) ? data.annual : [],
        quarterly: Array.isArray(data.quarter) ? data.quarter : [],
        ttm: Array.isArray(data.ttm) ? data.ttm : [],
      };

    const preferred = periodMap[period] ?? [];
    if (preferred.length) {
      return { period, rows: preferred };
    }

    const fallbackOrder: FinancialIndicatorPeriod[] = [
      "annual",
      "quarterly",
      "ttm",
    ];
    for (const fallback of fallbackOrder) {
      const rows = periodMap[fallback];
      if (rows?.length) {
        return { period: fallback, rows };
      }
    }

    return { period, rows: [] };
  };

  const getStatementYear = (item: FinancialStatementRow): number | null => {
    const yearValue = toNumber(item?.fiscalYear ?? item?.calendarYear);
    if (yearValue !== null) return Math.trunc(yearValue);
    const dateStr =
      item?.date || item?.fiscalDateEnding || item?.recordDate || null;
    if (dateStr) {
      const dt = DateTime.fromISO(dateStr, { zone });
      if (dt.isValid) return dt.year;
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return DateTime.fromJSDate(parsed, { zone }).year;
      }
    }
    return null;
  };

  const getStatementTimestamp = (item: any): number => {
    const dateStr =
      item?.date || item?.fiscalDateEnding || item?.recordDate || null;
    if (dateStr) {
      const dt = DateTime.fromISO(dateStr, { zone });
      if (dt.isValid) return dt.startOf("day").toMillis();
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return DateTime.fromJSDate(parsed, { zone }).startOf("day").toMillis();
      }
    }
    const year = getStatementYear(item);
    return year !== null
      ? DateTime.fromObject({ year }, { zone }).startOf("year").toMillis()
      : 0;
  };

  const buildStatementKey = (
    item: any,
    period: FinancialIndicatorPeriod,
  ): string | null => {
    const year = getStatementYear(item);
    if (year === null) return null;
    if (period === "quarterly" || period === "ttm") {
      const quarter = item?.period || item?.calendarQuarter;
      if (quarter) return `${quarter}-${year}`;
    }
    return `${year}`;
  };

  const buildStatementPrevKey = (
    item: any,
    period: FinancialIndicatorPeriod,
  ): string | null => {
    const year = getStatementYear(item);
    if (year === null) return null;
    if (period === "quarterly" || period === "ttm") {
      const quarter = item?.period || item?.calendarQuarter;
      if (quarter) return `${quarter}-${year - 1}`;
    }
    return `${year - 1}`;
  };

  const buildRevenueIndicatorData = (
    rows: any[],
    period: FinancialIndicatorPeriod,
  ) => {
    const sortedRows = [...rows].sort(
      (a, b) => getStatementTimestamp(a) - getStatementTimestamp(b),
    );

    const usePrevRow = period === "quarterly";
    const lookupMap = new Map<string, any>();
    if (!usePrevRow) {
      for (const item of sortedRows) {
        const key = buildStatementKey(item, period);
        if (key) lookupMap.set(key, item);
      }
    }

    const getRevenueValue = (item: any) =>
      toNumber(item?.revenue ?? item?.totalRevenue ?? item?.total_revenue);

    return sortedRows
      .map((item, index) => {
        const timestamp = getStatementTimestamp(item);
        const currentRevenue = getRevenueValue(item);
        const prevItem = usePrevRow
          ? index > 0
            ? sortedRows[index - 1]
            : null
          : (() => {
              const prevKey = buildStatementPrevKey(item, period);
              return prevKey ? lookupMap.get(prevKey) : null;
            })();
        const prevRevenue = prevItem ? getRevenueValue(prevItem) : null;

        let revenueGrowth = 0;
        if (
          currentRevenue !== null &&
          prevRevenue !== null &&
          prevRevenue !== 0
        ) {
          revenueGrowth =
            ((currentRevenue - prevRevenue) / Math.abs(prevRevenue)) * 100;
        }

        return {
          timestamp,
          revenue: currentRevenue ?? 0,
          revenueGrowth: Number.isFinite(revenueGrowth) ? revenueGrowth : 0,
        };
      })
      .filter((d) => d.timestamp > 0);
  };

  type StatementCategory = "income" | "balance" | "cashflow" | "ratios";

  const STATEMENT_CATEGORY_ENDPOINT: Record<StatementCategory, string> = {
    income: "income-statement",
    balance: "balance-sheet",
    cashflow: "cash-flow",
    ratios: "ratios",
  };

  const getStatementDataBundle = (category: StatementCategory) => {
    if (category === "income") return incomeStatementData;
    if (category === "balance") return balanceSheetData;
    if (category === "cashflow") return cashFlowStatementData;
    return ratiosStatementData;
  };

  const setStatementDataBundle = (
    category: StatementCategory,
    payload: { annual: any[]; quarter: any[]; ttm: any[] } | null,
    nextTicker: string,
  ) => {
    if (category === "income") {
      incomeStatementData = payload;
      incomeStatementTicker = nextTicker;
      return;
    }
    if (category === "balance") {
      balanceSheetData = payload;
      balanceSheetTicker = nextTicker;
      return;
    }
    if (category === "cashflow") {
      cashFlowStatementData = payload;
      cashFlowStatementTicker = nextTicker;
      return;
    }
    ratiosStatementData = payload;
    ratiosStatementTicker = nextTicker;
  };

  const getStatementIndicatorPeriod = (id: string) =>
    statementIndicatorPeriods[id] ?? "ttm";

  const setStatementIndicatorPeriod = (
    id: string,
    period: FinancialIndicatorPeriod,
  ) => {
    const config = STATEMENT_INDICATOR_BY_ID[id];
    if (!config) return;
    const current = getStatementIndicatorPeriod(id);
    if (current === period) return;
    statementIndicatorPeriods = {
      ...statementIndicatorPeriods,
      [id]: period,
    };
    const currentSettings = loadChartSettings() || {};
    saveChartSettings({
      ...currentSettings,
      revenueIndicatorPeriod,
      statementIndicatorPeriods,
    });
    const statementData = getStatementDataBundle(config.statement);
    if (!statementData && indicatorState[id]) {
      fetchStatementData(config.statement);
      return;
    }
    refreshStatementMetricIndicator(id);
  };

  const buildStatementMetricData = (
    rows: any[],
    property: string,
    period: FinancialIndicatorPeriod,
  ) => {
    const sortedRows = [...rows].sort(
      (a, b) => getStatementTimestamp(a) - getStatementTimestamp(b),
    );
    const usePrevRow = period === "quarterly";
    const lookupMap = new Map<string, any>();
    if (!usePrevRow) {
      for (const item of sortedRows) {
        const key = buildStatementKey(item, period);
        if (key) lookupMap.set(key, item);
      }
    }

    const getMetricValue = (item: any) => toNumber(item?.[property]);

    return sortedRows
      .map((item, index) => {
        const timestamp = getStatementTimestamp(item);
        const value = getMetricValue(item);
        if (timestamp <= 0 || value === null) return null;

        const prevItem = usePrevRow
          ? index > 0
            ? sortedRows[index - 1]
            : null
          : (() => {
              const prevKey = buildStatementPrevKey(item, period);
              return prevKey ? lookupMap.get(prevKey) : null;
            })();
        const prevValue = prevItem ? getMetricValue(prevItem) : null;

        let growth = 0;
        if (prevValue !== null && prevValue !== 0) {
          growth = ((value - prevValue) / Math.abs(prevValue)) * 100;
        }

        return {
          timestamp,
          value,
          growth: Number.isFinite(growth) ? growth : 0,
        };
      })
      .filter(
        (item): item is { timestamp: number; value: number; growth: number } =>
          Boolean(item),
      );
  };

  const refreshStatementMetricIndicator = (id: string) => {
    const config = STATEMENT_INDICATOR_BY_ID[id];
    if (!config) return;
    const statementData = getStatementDataBundle(config.statement);
    if (!statementData) return;
    const period = getStatementIndicatorPeriod(id);
    const resolved = resolveStatementPeriodData(statementData, period);
    if (resolved.period !== period) {
      statementIndicatorPeriods = {
        ...statementIndicatorPeriods,
        [id]: resolved.period,
      };
      const currentSettings = loadChartSettings() || {};
      saveChartSettings({
        ...currentSettings,
        revenueIndicatorPeriod,
        statementIndicatorPeriods,
      });
    }
    const indicatorData = buildStatementMetricData(
      resolved.rows,
      config.property,
      resolved.period,
    );
    setStatementMetricData(STATEMENT_INDICATOR_INDEX[id], indicatorData);
    if (chart && indicatorState[id]) {
      syncIndicators();
    }
  };

  const refreshStatementIndicatorsForCategory = (
    category: StatementCategory,
  ) => {
    STATEMENT_INDICATORS.filter(
      (indicator) => indicator.statement === category,
    ).forEach((indicator) => {
      if (indicatorState[indicator.id]) {
        refreshStatementMetricIndicator(indicator.id);
      }
    });
  };

  const fetchStatementData = async (category: StatementCategory) => {
    if (!ticker) return;
    if (category === "income") {
      await fetchIncomeStatementData();
      return;
    }
    const statementLoading =
      category === "balance"
        ? balanceSheetLoading
        : category === "cashflow"
          ? cashFlowStatementLoading
          : ratiosStatementLoading;
    const statementTicker =
      category === "balance"
        ? balanceSheetTicker
        : category === "cashflow"
          ? cashFlowStatementTicker
          : ratiosStatementTicker;

    if (statementLoading) return;
    if (statementTicker === ticker && getStatementDataBundle(category)) {
      refreshStatementIndicatorsForCategory(category);
      return;
    }

    if (category === "balance") {
      balanceSheetLoading = true;
    } else if (category === "cashflow") {
      cashFlowStatementLoading = true;
    } else {
      ratiosStatementLoading = true;
    }

    try {
      const response = await fetch("/api/chart-indicator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker,
          category: STATEMENT_CATEGORY_ENDPOINT[category],
        }),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      const payload = {
        annual: Array.isArray(result?.annual) ? result.annual : [],
        quarter: Array.isArray(result?.quarter)
          ? result.quarter
          : Array.isArray(result?.quarterly)
            ? result.quarterly
            : [],
        ttm: Array.isArray(result?.ttm) ? result.ttm : [],
      };

      setStatementDataBundle(category, payload, ticker);
      refreshStatementIndicatorsForCategory(category);
    } catch (error) {
      console.error("[StatementData] Failed to fetch data:", error);
      setStatementDataBundle(category, null, "");
    } finally {
      if (category === "balance") {
        balanceSheetLoading = false;
      } else if (category === "cashflow") {
        cashFlowStatementLoading = false;
      } else {
        ratiosStatementLoading = false;
      }
    }
  };

  const ensureStatementMetricData = async (id: string) => {
    const config = STATEMENT_INDICATOR_BY_ID[id];
    if (!config) return;
    const statementData = getStatementDataBundle(config.statement);
    if (!statementData) {
      await fetchStatementData(config.statement);
      return;
    }
    refreshStatementMetricIndicator(id);
  };

  const refreshIncomeStatementIndicators = () => {
    if (!incomeStatementData) return;
    if (indicatorState.revenue) {
      const resolved = resolveStatementPeriodData(
        incomeStatementData,
        revenueIndicatorPeriod,
      );
      if (resolved.period !== revenueIndicatorPeriod) {
        revenueIndicatorPeriod = resolved.period;
        const currentSettings = loadChartSettings() || {};
        saveChartSettings({
          ...currentSettings,
          revenueIndicatorPeriod,
        });
      }
      const indicatorData = buildRevenueIndicatorData(
        resolved.rows,
        resolved.period,
      );
      revenueData = indicatorData;
      setRevenueData(indicatorData);
      if (chart && indicatorState.revenue) {
        const existingId = indicatorInstanceIds.revenue;
        if (existingId) {
          chart.removeIndicator({ id: existingId });
          indicatorInstanceIds.revenue = null;
        }
        syncIndicators();
      }
    }

    refreshStatementIndicatorsForCategory("income");
  };

  const fetchIncomeStatementData = async () => {
    if (incomeStatementLoading || !ticker) return;
    if (incomeStatementData && incomeStatementTicker === ticker) {
      refreshIncomeStatementIndicators();
      return;
    }
    incomeStatementLoading = true;
    try {
      const response = await fetch("/api/chart-indicator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, category: "income-statement" }),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      incomeStatementData = {
        annual: Array.isArray(result?.annual) ? result.annual : [],
        quarter: Array.isArray(result?.quarter)
          ? result.quarter
          : Array.isArray(result?.quarterly)
            ? result.quarterly
            : [],
        ttm: Array.isArray(result?.ttm) ? result.ttm : [],
      };
      incomeStatementTicker = ticker;
      refreshIncomeStatementIndicators();
    } catch (error) {
      console.error("[IncomeStatement] Failed to fetch data:", error);
      incomeStatementData = null;
      incomeStatementTicker = "";
      revenueData = [];
      setRevenueData([]);
      clearStatementMetricData(STATEMENT_INDICATOR_INDEX["eps"]);
    } finally {
      incomeStatementLoading = false;
    }
  };

  // Fetch Revenue data
  const fetchRevenueDataIndicator = async () => {
    if (revenueLoading || !ticker) return;
    revenueLoading = true;
    await fetchIncomeStatementData();
    revenueLoading = false;
  };

  // Fetch Market Cap data
  const fetchMarketCapDataIndicator = async () => {
    if (marketCapLoading || !ticker) return;
    marketCapLoading = true;
    try {
      const response = await fetch("/api/chart-indicator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, category: "market-cap" }),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();

      // Market Cap API may return array directly or nested in history/data
      const historyData = Array.isArray(result)
        ? result
        : result?.history || result?.data || [];

      if (historyData?.length === 0) {
        marketCapData = [];
        setMarketCapData([]);
        marketCapLoading = false;
        return;
      }

      const indicatorData = historyData
        .map((item: any) => {
          // Try multiple date field names
          const dateStr = item.date || item.recordDate || item.calendarYear;

          let timestamp = 0;
          if (dateStr) {
            // Try ISO format first
            const dt = DateTime.fromISO(dateStr, { zone });
            if (dt.isValid) {
              timestamp = dt.startOf("day").toMillis();
            } else {
              // Fallback: try parsing as Date object
              const parsed = new Date(dateStr);
              if (!isNaN(parsed.getTime())) {
                timestamp = DateTime.fromJSDate(parsed, { zone })
                  .startOf("day")
                  .toMillis();
              }
            }
          }

          return {
            timestamp,
            marketCap:
              item.marketCap ??
              item.market_cap ??
              item.marketCapitalization ??
              0,
          };
        })
        .filter((d: any) => d.timestamp > 0);

      marketCapData = indicatorData;
      setMarketCapData(indicatorData);

      // Force indicator refresh
      if (chart && indicatorState.market_cap) {
        const existingId = indicatorInstanceIds.market_cap;
        if (existingId) {
          chart.removeIndicator({ id: existingId });
          indicatorInstanceIds.market_cap = null;
        }
        syncIndicators();
      }
    } catch (error) {
      console.error("[MarketCap] Failed to fetch market cap data:", error);
      marketCapData = [];
      setMarketCapData([]);
    }
    marketCapLoading = false;
  };

  // Fetch data for indicators that are already enabled on page load
  const fetchDataForEnabledIndicators = async () => {
    if (!chart) return;

    // Check each indicator that requires external data and fetch if enabled but no data loaded
    if (indicatorState.revenue && revenueData.length === 0) {
      fetchRevenueDataIndicator();
    }
    if (indicatorState.market_cap && marketCapData.length === 0) {
      fetchMarketCapDataIndicator();
    }
    if (indicatorState.ftd && ftdData.length === 0) {
      fetchFTDDataIndicator();
    }
    if (indicatorState.max_pain && maxPainData.length === 0) {
      fetchMaxPainData();
    }
    if (indicatorState.analyst_target && !analystTargetSummary) {
      fetchAnalystTargetData();
    }
    if (indicatorState.short_interest && historicalShortInterest.length === 0) {
      fetchShortInterestData();
    }
    for (const indicator of STATEMENT_INDICATORS) {
      if (indicatorState[indicator.id]) {
        ensureStatementMetricData(indicator.id);
      }
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

    const spotPrice = getSpotPrice();
    const nextKey = `${visibleRange.from}:${visibleRange.to}:${hottestContractsData.length}:${spotPrice ?? "na"}`;
    if (nextKey === hottestLevelCacheKey) return;
    hottestLevelCacheKey = nextKey;

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (let i = visibleRange.from; i < visibleRange.to; i++) {
      const bar = currentBars[i];
      if (bar) {
        minPrice = Math.min(minPrice, bar.low);
        maxPrice = Math.max(maxPrice, bar.high);
      }
    }

    if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice)) {
      hottestLevels = [];
      return;
    }

    const padding = (maxPrice - minPrice) * 0.1;
    minPrice -= padding;
    maxPrice += padding;

    if (spotPrice) {
      const spotMin = spotPrice * (1 - EXPOSURE_SPOT_WINDOW);
      const spotMax = spotPrice * (1 + EXPOSURE_SPOT_WINDOW);
      minPrice = Math.min(minPrice, spotMin);
      maxPrice = Math.max(maxPrice, spotMax);
    }

    let visibleContracts = hottestContractsData.filter(
      (item) => item.strike_price >= minPrice && item.strike_price <= maxPrice,
    );
    if (!visibleContracts.length && hottestContractsData.length) {
      visibleContracts = [...hottestContractsData];
    }

    const now = DateTime.now().setZone(zone).startOf("day");
    const withDte = visibleContracts
      .map((item) => {
        const expDate = DateTime.fromISO(item.date_expiration, { zone });
        const dte = expDate.isValid
          ? Math.max(0, Math.ceil(expDate.diff(now, "days").days))
          : null;
        return { item, dte };
      })
      .filter(({ dte }) => dte === null || dte >= 0);

    const sortedContracts = withDte
      .sort((a, b) => {
        const volA = a.item.volume || 0;
        const volB = b.item.volume || 0;
        if (volA !== volB) return volB - volA;
        const dteA = a.dte ?? Number.MAX_SAFE_INTEGER;
        const dteB = b.dte ?? Number.MAX_SAFE_INTEGER;
        return dteA - dteB;
      })
      .slice(0, HOTTEST_LEVEL_LIMIT);

    const maxVolume = Math.max(
      ...sortedContracts.map(({ item }) => item.volume || 0),
      1,
    );
    const labelKeys = new Set(
      sortedContracts
        .slice(0, HOTTEST_LABEL_LIMIT)
        .map(
          ({ item }) =>
            `${item.strike_price}-${item.option_type}-${item.date_expiration}`,
        ),
    );
    const chartHeight = chart.getSize()?.height ?? cachedChartRect?.height ?? 0;

    const levels: HottestLevel[] = [];
    for (const { item, dte } of sortedContracts) {
      const pixel = chart.convertToPixel({ value: item.strike_price });
      if (pixel && typeof pixel.y === "number") {
        const key = `${item.strike_price}-${item.option_type}-${item.date_expiration}`;
        levels.push({
          strike: item.strike_price,
          optionType: item.option_type,
          expiration: item.date_expiration,
          volume: item.volume,
          openInterest: item.open_interest,
          iv: item.iv,
          premium: item.total_premium,
          last: item.last,
          dte,
          y: pixel.y,
          visible:
            chartHeight > 0
              ? pixel.y >= -MARKER_VISIBILITY_PADDING &&
                pixel.y <= chartHeight + MARKER_VISIBILITY_PADDING
              : true,
          intensity: Math.sqrt((item.volume || 0) / maxVolume),
          showLabel: labelKeys.has(key),
        });
      }
    }

    hottestLevels = levels;
  };

  // Update Max Pain levels for rendering on chart
  const updateMaxPainLevels = () => {
    if (!indicatorState.max_pain) {
      maxPainLevels = [];
      return;
    }
    if (!chart || !chartContainer || maxPainData.length === 0) {
      maxPainLevels = [];
      return;
    }

    const now = DateTime.now().setZone(zone).startOf("day");
    const upcoming = [...maxPainData]
      .filter((item) => {
        const expDate = DateTime.fromISO(item.expiration, { zone });
        return expDate.isValid ? expDate >= now : true;
      })
      .slice(0, 2);
    const chartHeight = chart.getSize()?.height ?? cachedChartRect?.height ?? 0;

    const levels: MaxPainLevel[] = [];
    upcoming.forEach((item, index) => {
      const expDate = DateTime.fromISO(item.expiration, { zone });
      const dte = expDate.isValid
        ? Math.max(0, Math.ceil(expDate.diff(now, "days").days))
        : null;
      const pixel = chart.convertToPixel({ value: item.maxPain });
      if (pixel && typeof pixel.y === "number") {
        const isPrimary = index === 0;
        const intensity = isPrimary ? 1 : 0.7;
        const labelY =
          chartHeight > 0
            ? Math.min(chartHeight - 20, Math.max(2, pixel.y - 10))
            : pixel.y - 10;
        levels.push({
          price: item.maxPain,
          expiration: item.expiration,
          dte,
          y: pixel.y,
          labelY,
          visible:
            chartHeight > 0
              ? pixel.y >= -MARKER_VISIBILITY_PADDING &&
                pixel.y <= chartHeight + MARKER_VISIBILITY_PADDING
              : true,
          isPrimary,
          intensity,
        });
      }
    });

    maxPainLevels = levels;
  };

  const ANALYST_TARGET_COLORS: Record<AnalystTargetKey, string> = {
    high: "#22C55E",
    average: "#F59E0B",
    median: "#60A5FA",
    low: "#EF4444",
  };

  const updateAnalystTargetLevels = () => {
    if (!indicatorState.analyst_target) {
      analystTargetLevels = [];
      return;
    }
    if (!chart || !chartContainer || !analystTargetSummary) {
      analystTargetLevels = [];
      return;
    }

    const chartHeight = chart.getSize()?.height ?? cachedChartRect?.height ?? 0;
    const targets: {
      key: AnalystTargetKey;
      label: string;
      value: number | null;
    }[] = [
      { key: "high", label: "High", value: analystTargetSummary.high },
      { key: "average", label: "Avg", value: analystTargetSummary.average },
      { key: "median", label: "Med", value: analystTargetSummary.median },
      { key: "low", label: "Low", value: analystTargetSummary.low },
    ];

    const levels: AnalystTargetLevel[] = [];
    for (const target of targets) {
      if (target.value === null) continue;
      const pixel = chart.convertToPixel({ value: target.value });
      if (pixel && typeof pixel.y === "number") {
        const clampedY =
          chartHeight > 0
            ? Math.min(chartHeight - 2, Math.max(2, pixel.y))
            : pixel.y;
        const labelY =
          chartHeight > 0
            ? Math.min(chartHeight - 20, Math.max(2, clampedY - 10))
            : clampedY - 10;
        levels.push({
          key: target.key,
          label: target.label,
          price: target.value,
          y: clampedY,
          labelY,
          visible: true,
          color: ANALYST_TARGET_COLORS[target.key],
        });
      }
    }

    analystTargetLevels = levels;
  };

  // Handle Hottest Contracts level click
  const handleHottestLevelClick = (level: HottestLevel, event: MouseEvent) => {
    event.stopPropagation();
    clearAllLevelPopups();
    selectedHottestLevel = level;
    hottestPopupPosition = calculatePopupPosition(event);
  };

  // Close Hottest Contracts popup
  const closeHottestPopup = () => {
    selectedHottestLevel = null;
  };

  // Handle Max Pain level click
  const handleMaxPainLevelClick = (level: MaxPainLevel, event: MouseEvent) => {
    event.stopPropagation();
    clearAllLevelPopups();
    selectedMaxPainLevel = level;
    maxPainPopupPosition = calculatePopupPosition(event, 260, 220);
  };

  // Close Max Pain popup
  const closeMaxPainPopup = () => {
    selectedMaxPainLevel = null;
  };

  const handleAnalystTargetLevelClick = (
    level: AnalystTargetLevel,
    event: MouseEvent,
  ) => {
    event.stopPropagation();
    clearAllLevelPopups();
    selectedAnalystTargetLevel = level;
    analystTargetPopupPosition = calculatePopupPosition(event, 260, 280);
  };

  const closeAnalystTargetPopup = () => {
    selectedAnalystTargetLevel = null;
  };

  // Unified function to update all chart overlays (markers and levels)
  const updateAllOverlays = () => {
    // Cache chart rect once for all update functions (avoids layout thrashing)
    cachedChartRect = chartContainer?.getBoundingClientRect() ?? null;

    updateEarningsMarkers();
    updateDividendMarkers();
    updateNewsMarkers();
    updateShortInterestMarkers();
    updateGexLevels();
    updateDexLevels();
    updateOiLevels();
    updateHottestLevels();
    updateMaxPainLevels();
    updateAnalystTargetLevels();
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
      // For HLC Area, we use the HLC3 value as the 'close' for area rendering
      // while preserving original OHLC in separate fields for tooltip display
      close: (bar.high + bar.low + bar.close) / 3,
      originalClose: bar.close,
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

  const updateRealtimeBars = (tick: WsTickMessage) => {
    const symbol = typeof tick.s === "string" ? tick.s.toUpperCase() : "";
    if (symbol && ticker && symbol !== ticker.toUpperCase()) {
      return;
    }
    const timestampMs = toRealtimeTimestampMs(tick?.t ?? tick?.time);
    if (timestampMs === null) {
      return;
    }
    const price = resolveTickPrice(tick);
    if (price === null) {
      return;
    }
    const volume = resolveTickVolume(tick);
    const minuteTimestamp = getMinuteTimestamp(timestampMs);

    // Update latest realtime price for SEO title
    latestRealtimePrice = price;

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

    pricePrecision = PRICE_DECIMALS;
    priceFormatter = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: pricePrecision,
      maximumFractionDigits: pricePrecision,
    });
  };

  function sendMessage(message: string[]) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }

  // WebSocket batching state for performance
  let pendingWsUpdate: WsTickMessage | null = null;
  let wsUpdateScheduled = false;

  async function websocketRealtimeData() {
    if (!data?.wsURL || !ticker || typeof window === "undefined") return;

    // Validate ticker format before connecting
    const upperTicker = ticker.toUpperCase();
    if (!isValidTicker(upperTicker)) return;

    // Validate WebSocket URL
    const wsUrl = data.wsURL + "/price-data";
    if (!isValidWsUrl(wsUrl)) return;

    if (
      socket &&
      (socket.readyState === WebSocket.CONNECTING ||
        socket.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    try {
      socket = new WebSocket(wsUrl);

      // Store handler references for cleanup
      wsOpenHandler = () => {
        sendMessage([upperTicker]);
      };

      wsMessageHandler = (event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data);
          const items = Array.isArray(parsed) ? parsed : [parsed];

          // Queue only the latest valid update (skip stale intermediate data)
          for (const item of items) {
            // Validate message structure before processing
            if (isValidWsMessage(item)) {
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
        } catch {
          // Invalid JSON - ignore malformed messages
        }
      };

      wsCloseHandler = () => {
        // Handler kept minimal - cleanup happens in disconnectWebSocket
      };

      socket.addEventListener("open", wsOpenHandler);
      socket.addEventListener("message", wsMessageHandler);
      socket.addEventListener("close", wsCloseHandler);
    } catch {
      // WebSocket connection failed - will retry on next trigger
    }
  }

  function disconnectWebSocket() {
    if (socket) {
      // Remove event listeners before closing
      if (wsOpenHandler) socket.removeEventListener("open", wsOpenHandler);
      if (wsMessageHandler)
        socket.removeEventListener("message", wsMessageHandler);
      if (wsCloseHandler) socket.removeEventListener("close", wsCloseHandler);

      socket.close();
      socket = null;
    }
    // Clear handler references
    wsOpenHandler = null;
    wsMessageHandler = null;
    wsCloseHandler = null;
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

      const isRestrictedCategory =
        item.category === "Fundamentals" || item.category === "Statistics";
      const isRangeAllowed =
        !isRestrictedCategory || isNonIntradayRange(activeRange);
      const enabled = Boolean(indicatorState[item.id]) && isRangeAllowed;
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
          dragEnabled: true,
          gap: { top: 0, bottom: 0 },
          axis: {
            show: true,
            axisLine: { show: false },
            tickLine: { show: false },
            tickText: { show: true },
          },
        };
      } else {
        paneOptions = {
          id: `sn_${item.id}_pane`,
          height: item.height ?? 150,
          dragEnabled: true,
        };
      }

      const indicatorCreate: Record<string, unknown> = {
        name: item.indicatorName,
        calcParams: getIndicatorParams(item.id),
      };
      if (item.id === "revenue") {
        indicatorCreate.shortName = getFinancialIndicatorShortName("revenue");
        indicatorCreate.extendData = {
          period: getFinancialIndicatorPeriod("revenue"),
        };
      } else if (STATEMENT_INDICATOR_BY_ID[item.id]) {
        indicatorCreate.shortName = getStatementIndicatorShortName(item.id);
        indicatorCreate.calcParams = [];
        indicatorCreate.extendData = {
          metricIndex: STATEMENT_INDICATOR_INDEX[item.id],
          period: getStatementIndicatorPeriod(item.id),
        };
      }

      if (enabled && !existingId) {
        // isStack=true for candle pane to allow multiple overlaid indicators (MA, BOLL, etc.)
        // isStack=false for separate panes to avoid stacking
        nextInstanceIds[item.id] = chart.createIndicator(
          indicatorCreate,
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
        const overrideIndicator: Record<string, unknown> = {
          id: existingId,
          calcParams: getIndicatorParams(item.id),
        };
        if (item.id === "revenue") {
          overrideIndicator.shortName =
            getFinancialIndicatorShortName("revenue");
          overrideIndicator.extendData = {
            period: getFinancialIndicatorPeriod("revenue"),
          };
        } else if (STATEMENT_INDICATOR_BY_ID[item.id]) {
          overrideIndicator.shortName = getStatementIndicatorShortName(item.id);
          overrideIndicator.calcParams = [];
          overrideIndicator.extendData = {
            metricIndex: STATEMENT_INDICATOR_INDEX[item.id],
            period: getStatementIndicatorPeriod(item.id),
          };
        }
        chart.overrideIndicator(overrideIndicator);
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
    const upColor = CHART_COLORS.UP;
    const downColor = CHART_COLORS.DOWN;
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
          value: "close", // Uses modified close field containing HLC3 value
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
      syncIndicators();
    }
    // Save to localStorage (preserve existing event settings)
    const currentSettings = loadChartSettings() || {};
    saveChartSettings({ ...currentSettings, activeRange });
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
  }

  function toggleIndicator(name: string) {
    if (!(name in indicatorState)) return;
    const newState = !indicatorState[name];

    // Auto-switch to 1D for Fundamentals/Statistics indicators on intraday timeframes
    if (newState) {
      const indicatorDef = indicatorDefinitions.find((ind) => ind.id === name);
      const isRestrictedCategory =
        indicatorDef?.category === "Fundamentals" ||
        indicatorDef?.category === "Statistics";
      const isIntradayRange = !isNonIntradayRange(activeRange);

      if (isRestrictedCategory && isIntradayRange) {
        setRange("1D");
      }
    }

    if (newState && name === "revenue") {
      revenueIndicatorPeriod = "ttm";
      const currentSettings = loadChartSettings() || {};
      saveChartSettings({
        ...currentSettings,
        revenueIndicatorPeriod,
        statementIndicatorPeriods,
      });
    }
    if (newState && STATEMENT_INDICATOR_BY_ID[name]) {
      if (!statementIndicatorPeriods[name]) {
        statementIndicatorPeriods = {
          ...statementIndicatorPeriods,
          [name]: "ttm",
        };
        const currentSettings = loadChartSettings() || {};
        saveChartSettings({
          ...currentSettings,
          revenueIndicatorPeriod,
          statementIndicatorPeriods,
        });
      }
    }

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
      } else if (
        name === "short_interest" &&
        historicalShortInterest.length === 0
      ) {
        fetchShortInterestData();
      } else if (name === "short_interest") {
        // Data already exists, set it for the indicator and sync
        const indicatorData = historicalShortInterest
          .map((si) => {
            const dt = DateTime.fromISO(si.recordDate, { zone });
            return {
              timestamp: dt.isValid ? dt.startOf("day").toMillis() : 0,
              shortPercentOfFloat: si.shortPercentOfFloat ?? 0,
              shortPercentOfOut: si.shortPercentOfOut ?? 0,
              daysToCover: si.daysToCover ?? 0,
              totalShortInterest: Number(si.totalShortInterest) ?? 0,
            };
          })
          .filter((d) => d.timestamp > 0);
        setShortInterestData(indicatorData);
        showShortInterest = true;
        syncIndicators();
      }
      // New fundamental & options indicators
      else if (name === "ftd" && ftdData.length === 0) {
        fetchFTDDataIndicator();
      } else if (name === "ftd") {
        setFTDData(ftdData);
        syncIndicators();
      } else if (name === "max_pain" && maxPainData.length === 0) {
        fetchMaxPainData();
      } else if (name === "max_pain") {
        updateMaxPainLevels();
      } else if (name === "analyst_target" && !analystTargetSummary) {
        fetchAnalystTargetData();
      } else if (name === "analyst_target") {
        updateAnalystTargetLevels();
      } else if (name === "revenue" && revenueData.length === 0) {
        fetchRevenueDataIndicator();
      } else if (name === "revenue") {
        setRevenueData(revenueData);
        syncIndicators();
      } else if (name === "market_cap" && marketCapData.length === 0) {
        fetchMarketCapDataIndicator();
      } else if (name === "market_cap") {
        setMarketCapData(marketCapData);
        syncIndicators();
      } else if (STATEMENT_INDICATOR_BY_ID[name]) {
        ensureStatementMetricData(name);
      }
    } else {
      // Clear data when disabled
      if (name === "gex") {
        gexStrikeData = [];
        gexLevels = [];
        selectedGexLevel = null;
        gexLevelCacheKey = "";
      } else if (name === "dex") {
        dexStrikeData = [];
        dexLevels = [];
        selectedDexLevel = null;
        dexLevelCacheKey = "";
      } else if (name === "oi") {
        oiStrikeData = [];
        oiLevels = [];
        selectedOiLevel = null;
        oiSelectedExpiration = null;
        oiLevelCacheKey = "";
      } else if (name === "hottest") {
        hottestContractsData = [];
        hottestLevels = [];
        selectedHottestLevel = null;
        hottestLevelCacheKey = "";
      } else if (name === "short_interest") {
        showShortInterest = false;
        shortInterestMarkers = [];
        selectedShortInterest = null;
        clearShortInterestData();
      } else if (name === "ftd") {
        ftdData = [];
        clearFTDData();
      } else if (name === "max_pain") {
        maxPainData = [];
        maxPainLevels = [];
        selectedMaxPainLevel = null;
        clearMaxPainData();
      } else if (name === "analyst_target") {
        analystTargetSummary = null;
        analystTargetLevels = [];
        selectedAnalystTargetLevel = null;
      } else if (name === "revenue") {
        revenueData = [];
        clearRevenueData();
      } else if (name === "market_cap") {
        marketCapData = [];
        clearMarketCapData();
      } else if (STATEMENT_INDICATOR_BY_ID[name]) {
        clearStatementMetricData(STATEMENT_INDICATOR_INDEX[name]);
      }
    }
  }

  function toggleIndicatorById(id: string) {
    toggleIndicator(id);
  }

  function isIndicatorEnabled(id: string) {
    return Boolean(indicatorState[id]);
  }

  const getFinancialIndicatorPeriod = (id: string) => {
    if (id === "revenue") return revenueIndicatorPeriod;
    if (STATEMENT_INDICATOR_BY_ID[id]) return getStatementIndicatorPeriod(id);
    return "ttm";
  };

  const getFinancialIndicatorShortName = (id: "revenue") => {
    const period = getFinancialIndicatorPeriod(id);
    const label = FINANCIAL_PERIOD_LABELS[period];
    return `Revenue (${label})`;
  };

  const getStatementIndicatorShortName = (id: string) => {
    const config = STATEMENT_INDICATOR_BY_ID[id];
    if (!config) return "";
    const label = FINANCIAL_PERIOD_LABELS[getStatementIndicatorPeriod(id)];
    return `${config.label} (${label})`;
  };

  const setFinancialIndicatorPeriod = (
    id: string,
    period: FinancialIndicatorPeriod,
  ) => {
    if (id !== "revenue") {
      setStatementIndicatorPeriod(id, period);
      return;
    }
    const current = getFinancialIndicatorPeriod(id);
    if (current === period) return;
    revenueIndicatorPeriod = period;
    const currentSettings = loadChartSettings() || {};
    saveChartSettings({
      ...currentSettings,
      revenueIndicatorPeriod,
      statementIndicatorPeriods,
    });
    if (incomeStatementData) {
      refreshIncomeStatementIndicators();
    } else if (indicatorState.revenue) {
      fetchIncomeStatementData();
    }
  };

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
    if (!data?.user || data?.user?.tier !== "Pro") return;
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
    if (data?.user?.tier !== "Pro") return;

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
    indicatorModalSection = "Technicals";
    fundamentalsTab = "income";
  }

  function openIndicatorModal() {
    indicatorSearchTerm = "";
    // Default to Selected if user has selected indicators, else Favorites if has favorites, otherwise Technicals
    const hasSelectedIndicators = indicatorDefinitions.some(
      (indicator) => indicatorState[indicator.id],
    );
    if (hasSelectedIndicators) {
      indicatorModalSection = "Selected";
    } else if (indicatorFavorites.length > 0) {
      indicatorModalSection = "Favorites";
    } else {
      indicatorModalSection = "Technicals";
    }
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
      ctx.fillStyle = $mode === "dark" ? "#0b0b0b" : "#ffffff";
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

      // Add watermark - matches on-screen watermark (dynamic position above volume)
      // left-3 = 12px, size-9 = 36px, gap-2 = 8px
      const logoSize = 36;
      const paddingLeft = 12;
      const paddingBottom = watermarkBottom;
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

  function formatPrice(value: number | null) {
    if (value === null || !Number.isFinite(value)) return "-";
    return priceFormatter?.format(value) ?? value.toFixed(pricePrecision);
  }

  function formatExposureValue(value: number | null) {
    if (value === null || !Number.isFinite(value)) return "0";
    const abs = Math.abs(value);
    if (abs >= 1000) return abbreviateNumber(abs);
    return abs.toFixed(2);
  }

  function formatSignedExposure(value: number | null) {
    if (value === null || !Number.isFinite(value)) return "0";
    const sign = value >= 0 ? "+" : "-";
    return `${sign}${formatExposureValue(value)}`;
  }

  function formatCount(value: number | null) {
    if (value === null || !Number.isFinite(value)) return "0";
    return Math.round(value).toLocaleString("en-US", {
      maximumFractionDigits: 0,
    });
  }

  function formatIvPercent(value: number | null) {
    if (value === null || !Number.isFinite(value)) return "0.0%";
    return `${value.toFixed(1)}%`;
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

  const buildCandleTooltipLegends = (data: CandleTooltipData) => {
    const current = data?.current;
    const isUp = current && current.close >= current.open;
    const valueColor = isUp ? CHART_COLORS.UP : CHART_COLORS.DOWN;
    const titleColor = CHART_COLORS.NEUTRAL;
    const volumeColor = CHART_COLORS.NEUTRAL;

    // Calculate change and percentage
    let changeText = "";
    if (current && current.open && current.close) {
      const change = current.close - current.open;
      const changePercent = (change / current.open) * 100;
      const sign = change >= 0 ? "+" : "";
      changeText = `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
    }
    const changeColor = isUp ? CHART_COLORS.UP : CHART_COLORS.DOWN;

    // Check if small screen (below sm breakpoint = 640px)
    const isSmallScreen = isMobile;

    // For line chart types, show value and volume
    const isLineChart = ["line_step", "area", "hlc_area"].includes(chartType);
    if (isLineChart) {
      const valueLabel = chartType === "hlc_area" ? "HLC3: " : "Value: ";
      return [
        {
          title: { text: valueLabel, color: titleColor },
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

  onMount(async () => {
    loadIndicatorFavorites();
    // Load chart settings from localStorage
    const savedSettings = loadChartSettings();
    if (savedSettings) {
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
        showShortInterest = savedSettings.showShortInterest ?? false;
      }
      // Load toolbar selection state
      if (savedSettings.selectedToolByGroup) {
        selectedToolByGroup = {
          ...selectedToolByGroup,
          ...savedSettings.selectedToolByGroup,
        };
      }
      if (savedSettings.drawingMode) {
        drawingMode = savedSettings.drawingMode;
      }
      if (typeof savedSettings.drawingsLocked === "boolean") {
        drawingsLocked = savedSettings.drawingsLocked;
      }
      if (typeof savedSettings.drawingsVisible === "boolean") {
        drawingsVisible = savedSettings.drawingsVisible;
      }
      const legacyPeriod = savedSettings.financialIndicatorPeriod;
      const savedRevenuePeriod =
        savedSettings.revenueIndicatorPeriod ?? legacyPeriod;
      const savedEpsPeriod = savedSettings.epsIndicatorPeriod ?? legacyPeriod;
      if (
        savedRevenuePeriod &&
        FINANCIAL_PERIOD_OPTIONS.some(
          (option) => option.id === savedRevenuePeriod,
        )
      ) {
        revenueIndicatorPeriod = savedRevenuePeriod;
      }
      if (savedSettings.statementIndicatorPeriods) {
        statementIndicatorPeriods = {
          ...savedSettings.statementIndicatorPeriods,
        };
      }
      // Migrate legacy epsIndicatorPeriod to statementIndicatorPeriods
      if (
        savedEpsPeriod &&
        FINANCIAL_PERIOD_OPTIONS.some(
          (option) => option.id === savedEpsPeriod,
        ) &&
        !statementIndicatorPeriods.eps
      ) {
        statementIndicatorPeriods = {
          ...statementIndicatorPeriods,
          eps: savedEpsPeriod,
        };
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
    // Set small minHeight to allow indicator panes to expand freely
    chart.setPaneOptions({
      id: "candle_pane",
      minHeight: 100,
      dragEnabled: true,
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
      dragEnabled: true,
      gap: { top: 0, bottom: 0 },
      axis: {
        show: true,
        axisLine: { show: false },
        tickLine: { show: false },
        tickText: { show: true },
        // Dynamic scaling based on visible range with outlier handling (like TradingView)
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
          const percentileMax =
            volumes[Math.min(percentileIndex, volumes.length - 1)];
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

    // Fetch data for indicators that are already enabled (e.g., from saved strategy)
    fetchDataForEnabledIndicators();

    // Throttled resize handler to prevent lag during window resize
    const throttledChartResize = throttle(() => chart?.resize(), 100);
    resizeObserver = new ResizeObserver(throttledChartResize);
    resizeObserver.observe(chartRoot);
  });

  onDestroy(() => {
    isComponentDestroyed = true;
    disconnectWebSocket();

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
    // Include ticker as dependency to re-run when ticker changes
    if ($isOpen && typeof window !== "undefined" && ticker) {
      websocketRealtimeData();
    } else if (!$isOpen) {
      disconnectWebSocket();
    }
  }

  afterUpdate(async () => {
    if (previousTicker !== ticker) {
      const isInitialLoad = previousTicker === "";
      previousTicker = ticker;

      // Reload toolbar settings and overlays for the new ticker
      // Note: activeRange is loaded in the reactive block before applyRange
      if (!isInitialLoad && ticker) {
        // Clear existing overlays from the chart
        if (chart) {
          chart.removeOverlay();
          overlayIds = [];
        }

        // Reset toolbar state to defaults
        selectedToolByGroup = {
          lines: "horizontalStraightLine",
          channels: "priceChannelLine",
          shapes: "circle",
          fibonacci: "fibonacciLine",
          waves: "xabcd",
        };
        drawingsLocked = false;
        drawingsVisible = true;
        drawingMode = "normal";
        activeTool = "cursor";

        // Load toolbar settings for the new ticker
        const savedSettings = loadChartSettings();
        if (savedSettings) {
          if (data?.user?.tier === "Pro") {
            showEarnings = savedSettings.showEarnings ?? true;
            showDividends = savedSettings.showDividends ?? true;
            showNewsFlow = savedSettings.showNewsFlow ?? true;
            showShortInterest = savedSettings.showShortInterest ?? false;
          }
          if (savedSettings.selectedToolByGroup) {
            selectedToolByGroup = {
              ...selectedToolByGroup,
              ...savedSettings.selectedToolByGroup,
            };
          }
          if (savedSettings.drawingMode) {
            drawingMode = savedSettings.drawingMode;
          }
          if (typeof savedSettings.drawingsLocked === "boolean") {
            drawingsLocked = savedSettings.drawingsLocked;
          }
          if (typeof savedSettings.drawingsVisible === "boolean") {
            drawingsVisible = savedSettings.drawingsVisible;
          }
        }

        // Load overlays for the new ticker
        const savedOverlays = loadChartOverlays();
        if (chart && savedOverlays?.length > 0) {
          savedOverlays.forEach((overlay) => {
            try {
              chart.createOverlay({
                ...overlay,
                lock: drawingsLocked,
                visible: drawingsVisible,
                onDrawEnd: handleOverlayDrawEnd,
              });
            } catch (e) {
              console.log("Failed to restore overlay:", e);
            }
          });
        }
      }

      // Handle WebSocket reconnection on ticker change
      if (socket) {
        // Disconnect current socket with proper cleanup
        disconnectWebSocket();

        // Wait a brief moment before reconnecting
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Reconnect if component not destroyed
        if (!isComponentDestroyed) {
          await websocketRealtimeData();
        }

        // Reset realtime price for new ticker
        latestRealtimePrice = null;
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
      const withinLimit =
        startTimestamp !== null ? startTimestamp > limitMs : false;

      // respect both API hasMore + local retention limit
      hasMoreMinuteHistory = Boolean(result.hasMore) && withinLimit;

      if (activeRange === "1min") {
        currentBars = transformBarsForType(minuteBars, chartType);
      }
    } else {
      // Empty bars returned - still enforce retention limits
      const limitMs = getIntradayHistoryLimitMs("1min");
      const startTimestamp = minuteBars[0]?.timestamp ?? null;
      const withinLimit =
        startTimestamp !== null ? startTimestamp > limitMs : false;

      hasMoreMinuteHistory = Boolean(result.hasMore) && withinLimit;
    }

    minuteBarsLoading = false;
    return { bars: result.bars, hasMore: hasMoreMinuteHistory };
  };

  $: {
    ticker = data?.ticker ?? "";

    dailyBars = normalizeDaily(data?.historical ?? []);
    intradayBars = normalizeIntraday(data?.intraday ?? []);
    latestRealtimePrice = null; // Reset on ticker change
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

    // Reset short interest state when ticker changes
    historicalShortInterest = [];
    shortInterestMarkers = [];
    shortInterestTimestampCache = new Map();
    showShortInterest = false;
    clearShortInterestData();
    // Reset max pain state when ticker changes
    maxPainData = [];
    maxPainLevels = [];
    selectedMaxPainLevel = null;
    // Reset analyst target state when ticker changes
    analystTargetSummary = null;
    analystTargetLevels = [];
    selectedAnalystTargetLevel = null;
    incomeStatementData = null;
    incomeStatementTicker = "";
    revenueData = [];
    clearRevenueData();
    // Clear ALL statement metric indicators (not just eps)
    for (const indicator of STATEMENT_INDICATORS) {
      clearStatementMetricData(STATEMENT_INDICATOR_INDEX[indicator.id]);
    }

    // If indicator was enabled, refetch for new ticker
    if (indicatorState?.short_interest) {
      fetchShortInterestData();
    }
    if (indicatorState?.analyst_target) {
      fetchAnalystTargetData();
    }
    if (indicatorState?.revenue) {
      fetchIncomeStatementData();
    }

    // Refetch ALL enabled statement metric indicators (not just eps)
    for (const indicator of STATEMENT_INDICATORS) {
      if (indicatorState?.[indicator.id]) {
        ensureStatementMetricData(indicator.id);
      }
    }

    if (indicatorState?.max_pain) {
      fetchMaxPainData();
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
    pricePrecision = PRICE_DECIMALS;
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
    maxPainData;
    currentBars;
    historicalShortInterest;
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
    gexLevelCacheKey = "";
    dexLevelCacheKey = "";
    oiSelectedExpiration = null;
    oiLevelCacheKey = "";
    hottestLevelCacheKey = "";
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

  // barIndexByTimestamp is now a memoized function: getBarIndexByTimestamp()

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
  // Use stock quote previousClose for consistent change calculation (same as SEO)
  $: previousClose =
    toNumber(data?.getStockQuote?.previousClose) ??
    toNumber(intradayBars?.at(0)?.open) ??
    (dailyBars.length > 1 ? dailyBars[dailyBars.length - 2]?.close : null);
  // When not hovering, prefer latestRealtimePrice for real-time updates; when hovering show hovered bar
  $: lastClose = hoverBar
    ? hoverBar.close
    : (latestRealtimePrice ?? displayBar?.close ?? null);
  $: change =
    lastClose !== null && previousClose !== null
      ? lastClose - previousClose
      : null;
  $: changePercent =
    change !== null && previousClose ? (change / previousClose) * 100 : null;

  $: changeClass =
    change !== null && change < 0
      ? "text-rose-800 dark:text-rose-400"
      : "text-emerald-800 dark:text-emerald-400";

  $: companyName = data?.companyName || ticker;
  // SEO uses same values as UI for consistency
  $: seoPrice = lastClose;
  $: seoPreviousClose = previousClose;
  $: seoChangePercent = changePercent;
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
  $: assetType =
    resolvedAssetType === "etf"
      ? "etf"
      : resolvedAssetType === "index"
        ? "index"
        : "stocks";

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
  $: isSearchActive = indicatorSearchTerm.trim().length > 0;
  // Sort indicators: favorites first, then alphabetically
  // Create a Set for O(1) lookup and to trigger reactivity when indicatorFavorites changes
  $: favoritesSet = new Set(indicatorFavorites);
  // Create a reactive key for period changes to ensure template re-renders
  $: periodKey = JSON.stringify({
    revenue: revenueIndicatorPeriod,
    statements: statementIndicatorPeriods,
  });
  // Calculate total height of panel indicators below volume for watermark positioning
  $: panelIndicatorsHeight = indicatorDefinitions
    ?.filter((item) => {
      if (item.pane !== "panel") return false;
      if (!indicatorState[item.id]) return false;
      // Fundamentals/Statistics are hidden on intraday ranges
      const isRestrictedCategory =
        item.category === "Fundamentals" || item.category === "Statistics";
      if (isRestrictedCategory && !isNonIntradayRange(activeRange))
        return false;
      return true;
    })
    ?.reduce((sum, item) => sum + (item.height ?? 150), 0);
  // Watermark bottom offset: volume pane (120px) + buffer (80px) + panel indicators height
  $: watermarkBottom = 150 + panelIndicatorsHeight;
  // Event marker position slightly above volume y=0 (bottom of volume pane + offset)
  $: eventMarkerBottom = panelIndicatorsHeight + 28;
  $: technicalGroups = Object.entries(groupedIndicators)
    .filter(
      ([cat]) =>
        cat !== "Options" && cat !== "Fundamentals" && cat !== "Statistics",
    )
    .map(
      ([cat, indicators]) =>
        [
          cat,
          [...indicators].sort((a, b) => {
            // Sort by favorites first, then alphabetically
            const aFav = favoritesSet.has(a.id);
            const bFav = favoritesSet.has(b.id);
            if (aFav !== bFav) {
              return aFav ? -1 : 1;
            }
            return a.label.localeCompare(b.label);
          }),
        ] as [string, typeof indicators],
    );
  $: fundamentalsIndicators = (groupedIndicators["Fundamentals"] ?? [])
    .filter(
      (indicator) =>
        (FUNDAMENTAL_INDICATOR_MAP[indicator.id] ?? "ratios") ===
        fundamentalsTab,
    )
    .slice()
    .sort((a, b) => {
      // Sort by favorites first, then alphabetically
      const aFav = favoritesSet.has(a.id);
      const bFav = favoritesSet.has(b.id);
      if (aFav !== bFav) {
        return aFav ? -1 : 1;
      }
      return a.label.localeCompare(b.label);
    });
  $: optionsIndicators = (groupedIndicators["Options"] ?? [])
    .slice()
    .sort((a, b) => {
      // Sort by favorites first, then alphabetically
      const aFav = favoritesSet.has(a.id);
      const bFav = favoritesSet.has(b.id);
      if (aFav !== bFav) {
        return aFav ? -1 : 1;
      }
      return a.label.localeCompare(b.label);
    });
  $: statisticsIndicators = (groupedIndicators["Statistics"] ?? [])
    .slice()
    .sort((a, b) => {
      // Sort by favorites first, then alphabetically
      const aFav = favoritesSet.has(a.id);
      const bFav = favoritesSet.has(b.id);
      if (aFav !== bFav) {
        return aFav ? -1 : 1;
      }
      return a.label.localeCompare(b.label);
    });
  // Get all selected (checked) indicators for the Selected tab
  $: selectedIndicators = indicatorDefinitions.filter(
    (indicator) => indicatorState[indicator.id],
  );

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
  class="h-[calc(100dvh-56px-60px)] sm:h-[calc(100dvh-56px)] w-full bg-white dark:bg-zinc-950 text-gray-700 dark:text-zinc-200 overflow-hidden"
>
  <div class="flex h-full w-full flex-col overflow-hidden">
    <!-- TradingView Style Navbar -->
    <div
      class="flex flex-col border-b border-gray-300 dark:border-zinc-800 bg-white dark:bg-zinc-950"
    >
      <!-- First Row: Ticker Info + OHLC -->
      <div
        class="flex items-center px-2 py-1 gap-1 text-sm border-b border-gray-300 dark:border-zinc-800"
      >
        <!-- Ticker Symbol -->
        <button class="flex items-center gap-1.5 px-2 py-1">
          <img
            src={ticker?.length > 0
              ? `https://financialmodelingprep.com/image-stock/${ticker}.png`
              : "/pwa-512x512.png"}
            alt={`${ticker || "Stocknear"} logo`}
            class="shrink-0 w-5 h-5 rounded-full"
            loading="lazy"
            decoding="async"
          />
          <span class="font-semibold text-gray-900 dark:text-white text-sm"
            >{ticker}</span
          >
          <span class="text-gray-500 dark:text-zinc-500">·</span>
          <span class="text-gray-600 dark:text-zinc-400 text-sm"
            >{activeRange}</span
          >
          <span class="text-gray-500 dark:text-zinc-500 text-sm">·</span>
          <span class="text-gray-600 dark:text-zinc-400 text-sm"
            >{data?.getStockQuote?.exchange?.toUpperCase() || ""}</span
          >
        </button>

        <!-- Back to Asset Button -->
        <a
          href="/{assetType}/{ticker}"
          class="flex items-center gap-1 px-2 py-1 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100/60 dark:hover:bg-zinc-800 rounded transition"
          title="Back to {ticker}"
        >
          <ArrowLeft class="h-4 w-4 flex-shrink-0" />
          <span class="hidden sm:inline"
            >{assetType === "etf"
              ? "ETF"
              : assetType === "index"
                ? "Index"
                : "Stock"}</span
          >
        </a>

        <!-- Separator -->
        <div class="w-px h-5 bg-gray-300 dark:bg-zinc-700 mx-1"></div>

        <!-- Price -->
        <div class="flex items-center gap-2 text-xs whitespace-nowrap">
          <span class={`font-medium ${changeClass}`}
            >{formatPrice(lastClose)}</span
          >
          <span class={`${changeClass}`}
            >{formatPrice(change)} ({formatPercent(changePercent)})</span
          >
        </div>
      </div>

      <!-- Second Row: Tools -->
      <div
        class="flex items-center px-1 py-0.5 gap-1 sm:gap-0.5 overflow-x-auto scrollbar-none"
      >
        <!-- Toolbar Toggle (hidden on mobile since drawing toolbar is desktop-only) -->
        <button
          class="hidden sm:flex cursor-pointer items-center gap-1 px-2 py-1 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100/60 dark:hover:bg-zinc-800 rounded transition"
          on:click={() => (toolbarExpanded = !toolbarExpanded)}
          title={toolbarExpanded ? "Hide drawing tools" : "Show drawing tools"}
        >
          {#if toolbarExpanded}
            <IndentDecrease class="size-5 flex-shrink-0" />
          {:else}
            <IndentIncrease class="size-5 flex-shrink-0" />
          {/if}
        </button>

        <!-- Time Intervals Dropdown - Desktop only (mobile uses bottom nav) -->
        <div class="hidden sm:block">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild let:builder>
              <button
                use:builder.action
                {...builder}
                class="cursor-pointer flex items-center gap-1.5 px-2 py-1 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100/60 dark:hover:bg-zinc-800 rounded transition"
              >
                <AlarmClockPlus class="h-4 w-4 flex-shrink-0" />
                <span>{activeRange}</span>
                <ChevronDown class="h-3 w-3" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              side="bottom"
              align="start"
              sideOffset={4}
              class="w-32 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-1 text-gray-700 dark:text-zinc-200"
            >
              <DropdownMenu.Group>
                {#each timeframes as frame}
                  <DropdownMenu.Item
                    class={`flex items-center px-2 py-1.5 text-sm rounded cursor-pointer transition ${
                      activeRange === frame
                        ? "text-violet-600 dark:text-violet-400 bg-gray-100 dark:bg-zinc-800"
                        : "sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400"
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

        <!-- Separator (hidden on mobile) -->
        <div
          class="hidden sm:block w-px h-5 bg-gray-300 dark:bg-zinc-700 mx-0.5"
        ></div>

        <!-- Chart Type Dropdown (desktop only, mobile uses bottom nav) -->
        <div class="hidden sm:block">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild let:builder>
              <button
                use:builder.action
                {...builder}
                class="cursor-pointer flex items-center gap-1.5 px-2 py-1 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100/60 dark:hover:bg-zinc-800 rounded transition"
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
              class="w-44 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-1 text-gray-700 dark:text-zinc-200"
            >
              <DropdownMenu.Group>
                {#each chartTypeOptions as option}
                  <DropdownMenu.Item
                    class={`flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer transition ${
                      chartType === option.id
                        ? "text-violet-600 dark:text-violet-400 bg-gray-100 dark:bg-zinc-800"
                        : "sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400"
                    }`}
                    on:click={() => setChartType(option.id)}
                  >
                    {option.label}
                  </DropdownMenu.Item>
                {/each}
              </DropdownMenu.Group>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>

        <!-- Separator -->
        <div
          class="hidden sm:block w-px h-5 bg-gray-300 dark:bg-zinc-700 mx-0.5"
        ></div>

        <!-- Indicators Button (desktop only, mobile uses bottom nav) -->
        <label
          for="indicatorModal"
          on:click={openIndicatorModal}
          class="hidden sm:flex items-center gap-1.5 px-2 py-1 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100/60 dark:hover:bg-zinc-800 rounded cursor-pointer transition"
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
        <div
          class="hidden sm:block w-px h-5 bg-gray-300 dark:bg-zinc-700 mx-0.5"
        ></div>

        <!-- Events Dropdown (desktop only, mobile uses bottom nav) -->
        <div class="hidden sm:block">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild let:builder>
              <button
                use:builder.action
                {...builder}
                class="flex items-center gap-1.5 px-2 py-1 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100/60 dark:hover:bg-zinc-800 rounded cursor-pointer transition"
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
              class="w-auto min-w-40 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-1 text-gray-700 dark:text-zinc-200"
            >
              <DropdownMenu.Group>
                <DropdownMenu.Item
                  class="flex items-center justify-between px-2 py-1.5 text-sm rounded sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 cursor-pointer"
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
                            if (
                              showEarnings &&
                              !isNonIntradayRange(activeRange)
                            ) {
                              setRange("1D");
                              // Re-apply range after chart settles to ensure correct state
                              setTimeout(() => setRange("1D"), 150);
                            } else {
                              updateAllOverlays();
                            }
                          }}
                        />
                        <div
                          class="w-9 h-5 bg-gray-200/80 dark:bg-zinc-800 rounded-full peer peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300/70 dark:after:border-zinc-700/80 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"
                        ></div>
                      {:else}
                        <button
                          type="button"
                          on:click|stopPropagation={() => goto("/pricing")}
                          class="text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 transition"
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
                  class="flex items-center justify-between px-2 py-1.5 text-sm rounded sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 cursor-pointer"
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
                            if (
                              showDividends &&
                              !isNonIntradayRange(activeRange)
                            ) {
                              setRange("1D");
                              // Re-apply range after chart settles to ensure correct state
                              setTimeout(() => setRange("1D"), 150);
                            } else {
                              updateAllOverlays();
                            }
                          }}
                        />
                        <div
                          class="w-9 h-5 bg-gray-200/80 dark:bg-zinc-800 rounded-full peer peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300/70 dark:after:border-zinc-700/80 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"
                        ></div>
                      {:else}
                        <button
                          type="button"
                          on:click|stopPropagation={() => goto("/pricing")}
                          class="text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 transition"
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
                  class="flex items-center justify-between px-2 py-1.5 text-sm rounded sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 cursor-pointer"
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
                            if (
                              showNewsFlow &&
                              !isNonIntradayRange(activeRange)
                            ) {
                              setRange("1D");
                              // Re-apply range after chart settles to ensure correct state
                              setTimeout(() => setRange("1D"), 150);
                            } else {
                              updateAllOverlays();
                            }
                          }}
                        />
                        <div
                          class="w-9 h-5 bg-gray-200/80 dark:bg-zinc-800 rounded-full peer peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300/70 dark:after:border-zinc-700/80 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"
                        ></div>
                      {:else}
                        <button
                          type="button"
                          on:click|stopPropagation={() => goto("/pricing")}
                          class="text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 transition"
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
        </div>

        <!-- Separator -->
        <div
          class="hidden sm:block w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-0.5"
        ></div>

        <!-- Strategy Dropdown -->
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild let:builder>
            <button
              use:builder.action
              {...builder}
              class="flex items-center gap-1 px-2 py-1 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100/60 dark:hover:bg-zinc-800 rounded cursor-pointer transition"
            >
              <DatabaseZap class="h-4 w-4 flex-shrink-0" />
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
            class="w-auto min-w-48 max-h-64 overflow-y-auto rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-1 text-gray-700 dark:text-zinc-200"
          >
            {#if isSubscribed}
              <label
                for={!data?.user ? "userLogin" : "addChartStrategy"}
                class="flex items-center gap-2 px-2 py-1.5 text-sm rounded sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 cursor-pointer text-violet-600 dark:text-violet-400 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition"
              >
                <svg
                  class="h-3.5 w-3.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                <span>New Strategy</span>
              </label>
            {:else}
              <button
                on:click={() => goto("/pricing")}
                class="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer text-gray-500 dark:text-zinc-400 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition"
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
                <span>New Strategy</span>
              </button>
            {/if}
            <DropdownMenu.Separator
              class="my-1 h-px bg-gray-200/70 dark:bg-zinc-800/80"
            />
            <DropdownMenu.Group>
              {#if strategyList?.length > 0}
                {#each strategyList as item}
                  <DropdownMenu.Item
                    on:click={() => {
                      switchStrategy(item);
                    }}
                    class="flex items-center justify-between px-2 py-1.5 text-sm rounded sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 cursor-pointer {item?.id ===
                    selectedStrategy
                      ? 'text-violet-600 dark:text-violet-400'
                      : ''}"
                  >
                    <span class="truncate">
                      {item?.title?.length > 18
                        ? item?.title?.slice(0, 18) + "..."
                        : item?.title}
                      <span class="text-gray-400 dark:text-zinc-500 ml-1"
                        >({item?.rules?.length ?? 0})</span
                      >
                    </span>
                    <label
                      for="deleteChartStrategy"
                      class="ml-2 flex items-center justify-center cursor-pointer text-gray-400 dark:text-zinc-500 hover:text-red-500 transition"
                      on:click|stopPropagation
                    >
                      <Trash2 class="h-3.5 w-3.5" />
                    </label>
                  </DropdownMenu.Item>
                {/each}
              {:else}
                <div
                  class="px-2 py-1.5 text-sm text-gray-400 dark:text-zinc-500"
                >
                  No saved strategies
                </div>
              {/if}
            </DropdownMenu.Group>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
        {#if isSubscribed}
          <!-- Separator -->
          <div class="w-px h-5 bg-gray-300 dark:bg-zinc-700 mx-0.5"></div>

          <button
            on:click={() => handleSave(true)}
            class="flex items-center gap-1 px-2 py-1 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100/60 dark:hover:bg-zinc-800 rounded cursor-pointer transition"
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
              for="addChartStrategy"
              class="flex items-center gap-1 px-2 py-1 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100/60 dark:hover:bg-zinc-800 rounded cursor-pointer transition whitespace-nowrap"
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

          {#if ruleOfList?.length > 0}
            <button
              on:click={clearIndicators}
              class="flex items-center gap-1 px-2 py-1 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100/60 dark:hover:bg-zinc-800 rounded cursor-pointer transition whitespace-nowrap"
            >
              <svg
                class="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 21 21"
              >
                <g
                  fill="none"
                  fill-rule="evenodd"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M3.578 6.487A8 8 0 1 1 2.5 10.5" />
                  <path d="M7.5 6.5h-4v-4" />
                </g>
              </svg>
              <span>Reset All</span>
            </button>
          {/if}
        {/if}
      </div>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <!-- KlineCharts Pro Style Drawing Toolbar -->
      {#if toolbarExpanded}
        <div
          class="hidden sm:flex h-full w-[54px] flex-col items-center border-r border-gray-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2 overflow-visible transition-all duration-200"
        >
          <!-- Cursor Tool -->
          <button
            class={`cursor-pointer group relative flex h-[38px] w-[38px] items-center justify-center rounded transition-all duration-200 ${
              activeTool === "cursor"
                ? "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white"
                : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100/60 dark:hover:bg-zinc-800 hover:text-violet-600 dark:hover:text-violet-400"
            }`}
            on:click={() => {
              activeTool = "cursor";
              if (chartMain) chartMain.style.cursor = "default";
            }}
            title="Cursor"
          >
            <MousePointer2 class="size-5" />
          </button>

          <!-- Drawing Tool Groups -->
          {#each toolGroups as group, groupIndex}
            <DropdownMenu.Root bind:open={dropdownStates[group.id]}>
              <div class="relative mt-1 group/item">
                <!-- Main Button with selected tool icon -->
                <button
                  class={`relative flex h-[38px] w-[38px] items-center justify-center rounded transition-all duration-200 ${
                    drawingsLocked
                      ? "cursor-not-allowed opacity-40 text-gray-500 dark:text-zinc-500"
                      : group.options.some((o) => o.id === activeTool)
                        ? "cursor-pointer bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white"
                        : "cursor-pointer text-gray-600 dark:text-zinc-400 hover:bg-gray-100/60 dark:hover:bg-zinc-800 hover:text-violet-600 dark:hover:text-violet-400"
                  }`}
                  on:click={() => {
                    if (drawingsLocked) return;
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
                  title={drawingsLocked
                    ? "Unlock drawings to use this tool"
                    : group.label}
                >
                  <svg viewBox="0 0 22 22" class="h-6 w-6 fill-current">
                    <path
                      d={toolIcons[selectedToolByGroup[group.id]] ||
                        toolIcons.horizontalStraightLine}
                    />
                  </svg>
                  <!-- Dropdown Arrow - hidden when drawings are locked -->
                  {#if !drawingsLocked}
                    <DropdownMenu.Trigger asChild let:builder>
                      <div
                        use:builder.action
                        {...builder}
                        class="absolute -right-0.5 top-1/2 -translate-y-1/2 w-[8px] h-[12px] flex items-center justify-center opacity-50 group-hover/item:opacity-100 transition-opacity duration-150 cursor-pointer"
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
                  {/if}
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
                            ? "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium"
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
          <div class="w-5 h-px bg-gray-300 dark:bg-zinc-700 my-2"></div>

          <!-- Magnet Mode -->
          <DropdownMenu.Root bind:open={dropdownStates.magnet}>
            <div class="relative mt-1 group/magnet">
              <button
                class={`cursor-pointer relative flex h-[38px] w-[38px] items-center justify-center rounded transition-all duration-200 ${
                  drawingMode !== "normal"
                    ? "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white"
                    : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100/60 dark:hover:bg-zinc-800 hover:text-gray-700 dark:text-zinc-200"
                }`}
                on:click={() => {
                  if (drawingMode === "normal") {
                    drawingMode = "weak_magnet";
                  } else {
                    drawingMode = "normal";
                  }
                  // Save to localStorage
                  const currentSettings = loadChartSettings() || {};
                  saveChartSettings({ ...currentSettings, drawingMode });
                }}
                title={drawingMode === "normal"
                  ? "Enable magnet mode"
                  : "Disable magnet mode"}
              >
                <svg viewBox="0 0 28 28" class="h-6 w-6 fill-current">
                  <path d={toolIcons.magnet} />
                </svg>
                <!-- Dropdown Arrow - always visible for better discoverability -->
                <DropdownMenu.Trigger asChild let:builder>
                  <div
                    use:builder.action
                    {...builder}
                    class="absolute -right-0.5 top-1/2 -translate-y-1/2 w-[8px] h-[12px] flex items-center justify-center opacity-50 group-hover/magnet:opacity-100 transition-opacity duration-150 cursor-pointer"
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
                        ? "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium"
                        : "text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
                    }`}
                    on:click={() => {
                      drawingMode = "weak_magnet";
                      dropdownStates.magnet = false;
                      // Save to localStorage
                      const currentSettings = loadChartSettings() || {};
                      saveChartSettings({ ...currentSettings, drawingMode });
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
                        ? "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium"
                        : "text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
                    }`}
                    on:click={() => {
                      drawingMode = "strong_magnet";
                      dropdownStates.magnet = false;
                      // Save to localStorage
                      const currentSettings = loadChartSettings() || {};
                      saveChartSettings({ ...currentSettings, drawingMode });
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

          <!-- Visibility - highlights when drawings are hidden (unusual state) -->
          <button
            class={`cursor-pointer flex h-[38px] w-[38px] items-center justify-center rounded transition-all duration-200 mt-1 ${
              !drawingsVisible
                ? "bg-gray-100 dark:bg-zinc-800 text-rose-400"
                : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100/60 dark:hover:bg-zinc-800 hover:text-gray-700 dark:text-zinc-200"
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

          <!-- Lock - prevents accidental modification of drawings -->
          <button
            class={`cursor-pointer flex h-[38px] w-[38px] items-center justify-center rounded transition-all duration-200 mt-1 ${
              drawingsLocked
                ? "bg-gray-100 dark:bg-zinc-800 text-amber-500 dark:text-amber-400"
                : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100/60 dark:hover:bg-zinc-800 hover:text-violet-600 dark:hover:text-violet-400"
            }`}
            on:click={toggleDrawingsLock}
            title={drawingsLocked ? "Unlock drawings" : "Lock drawings"}
          >
            <svg viewBox="0 0 22 22" class="h-6 w-6 fill-current">
              <path d={drawingsLocked ? toolIcons.lock : toolIcons.unlock} />
            </svg>
          </button>

          <!-- Separator -->
          <div class="w-5 h-px bg-gray-300 dark:bg-zinc-700 my-2"></div>

          <!-- Zoom Tools -->
          <button
            class="cursor-pointer flex h-[38px] w-[38px] items-center justify-center rounded text-gray-600 dark:text-zinc-400 transition-all duration-200 hover:bg-gray-100/60 dark:hover:bg-zinc-800 hover:text-violet-600 dark:hover:text-violet-400"
            on:click={() => zoomChart(1.2)}
            title="Zoom in"
          >
            <ZoomIn class="size-5" />
          </button>
          <button
            class=" cursor-pointer flex h-[38px] w-[38px] items-center justify-center rounded text-gray-600 dark:text-zinc-400 transition-all duration-200 hover:bg-gray-100/60 dark:hover:bg-zinc-800 hover:text-violet-600 dark:hover:text-violet-400 mt-1"
            on:click={() => zoomChart(0.9)}
            title="Zoom out"
          >
            <ZoomOut class="size-5" />
          </button>

          <!-- Bottom Controls -->
          <div class="mt-auto flex flex-col items-center pb-2">
            <!-- Screenshot -->
            <button
              class="cursor-pointer flex h-[38px] w-[38px] items-center justify-center rounded text-gray-600 dark:text-zinc-400 transition-all duration-200 hover:bg-gray-100/60 dark:hover:bg-zinc-800 hover:text-violet-600 dark:hover:text-violet-400"
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
              class="cursor-pointer flex h-[38px] w-[38px] items-center justify-center rounded text-gray-600 dark:text-zinc-400 transition-all duration-200 hover:bg-gray-100/60 dark:hover:bg-zinc-800 hover:text-rose-500 mt-1"
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

      <div class="relative flex-1 bg-white dark:bg-zinc-950">
        <div
          class="absolute inset-0 z-[1] touch-manipulation"
          bind:this={chartContainer}
        ></div>

        <!-- Loading Spinner Overlay -->
        {#if isChartLoading}
          <div
            class="bg-white/70 dark:bg-zinc-900/70 rounded-full h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[5]"
          >
            <span
              class="loading loading-spinner loading-md text-gray-900 dark:text-white"
            ></span>
          </div>
        {/if}

        <!-- Watermark -->
        <div
          class="absolute left-3 hidden sm:flex items-center gap-2 pointer-events-none z-10"
          style="bottom: {watermarkBottom}px"
        >
          <img
            src="/pwa-192x192.png"
            alt="Stocknear"
            class="size-9 rounded-full opacity-60"
            loading="lazy"
            decoding="async"
          />
          <span
            class="text-gray-500/60 dark:text-white/60 text-base font-semibold text-md"
            >Stocknear</span
          >
        </div>

        <!-- Earnings markers overlay (only for non-intraday ranges when enabled) -->
        {#if isSubscribed && showEarnings && isNonIntradayRange(activeRange) && earningsMarkers.length > 0}
          <div class="absolute inset-0 pointer-events-none z-[15]">
            {#each earningsMarkers as marker, i (`${marker.timestamp}-${i}`)}
              {#if marker?.visible}
                <button
                  class="cursor-pointer absolute -translate-x-1/2 pointer-events-auto cursor-pointer transition-transform hover:scale-110"
                  style="left: {marker.x}px; bottom: {eventMarkerBottom}px"
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
            class="fixed sm:absolute z-[20] pointer-events-auto bottom-0 left-0 right-0 sm:bottom-auto sm:left-auto sm:right-auto"
            style="--popup-x: {earningsPopupPosition.x}px; --popup-y: {earningsPopupPosition.y}px;"
            style:left={!isMobile ? `${earningsPopupPosition.x}px` : undefined}
            style:top={!isMobile ? `${earningsPopupPosition.y}px` : undefined}
            style:transform={!isMobile ? "translate(-50%, -100%)" : undefined}
          >
            <div
              class="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-t-xl sm:rounded-xl shadow-2xl p-4 w-full sm:min-w-[280px] sm:max-w-[320px]"
            >
              <!-- Header -->
              <div class="flex items-center gap-2 mb-3">
                <h3 class="text-gray-900 dark:text-white font-semibold">
                  {selectedEarningsIsFuture
                    ? "Upcoming Earnings"
                    : "Earnings & Revenue"}
                </h3>
                <button
                  class="cursor-pointer ml-auto text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition"
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
              <div
                class="text-sm text-gray-700 dark:text-zinc-300 mb-3 space-y-1"
              >
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-zinc-400">Date</span>
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
                    <span class="text-gray-500 dark:text-zinc-400"
                      >Period Ending</span
                    >
                    <span
                      >{selectedEarnings.period}
                      '{String(selectedEarnings.period_year).slice(-2)}</span
                    >
                  </div>
                {/if}
              </div>

              <!-- Earnings section -->
              <div
                class="border-t border-gray-300 dark:border-zinc-700 pt-3 mb-3"
              >
                <div
                  class="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2"
                >
                  {selectedEarningsIsFuture ? "EPS Estimate" : "Earnings"}
                </div>
                <div class="text-sm space-y-1">
                  {#if !selectedEarningsIsFuture}
                    <div
                      class="flex justify-between text-gray-700 dark:text-zinc-300"
                    >
                      <span>Reported</span>
                      <span
                        >{formatEarningsValue(
                          getEpsValue(selectedEarnings),
                        )}</span
                      >
                    </div>
                  {/if}
                  <div
                    class="flex justify-between text-gray-700 dark:text-zinc-300"
                  >
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
                          : "text-rose-800 dark:text-rose-400"}>Surprise</span
                      >
                      <span
                        class={surprise?.positive
                          ? "text-emerald-800 dark:text-emerald-400"
                          : "text-rose-800 dark:text-rose-400"}
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
                        <span class="text-gray-600 dark:text-zinc-400"
                          >YoY Change</span
                        >
                        <span
                          class={yoy.positive
                            ? "text-emerald-800 dark:text-emerald-400"
                            : "text-rose-800 dark:text-rose-400"}
                        >
                          {yoy.positive ? "+" : ""}{yoy.percent.toFixed(2)}%
                        </span>
                      </div>
                    {/if}
                  {/if}
                </div>
              </div>

              <!-- Revenue section -->
              <div
                class="border-t border-gray-300 dark:border-zinc-700 pt-3 mb-3"
              >
                <div
                  class="text-xs text-gray-500 dark:text-zinc-400 uppercase mb-2"
                >
                  {selectedEarningsIsFuture ? "Revenue Estimate" : "Revenue"}
                </div>
                <div class="text-sm space-y-1">
                  {#if !selectedEarningsIsFuture}
                    <div
                      class="flex justify-between text-gray-700 dark:text-zinc-300"
                    >
                      <span>Reported</span>
                      <span
                        >{formatRevenueValue(
                          getRevenueValue(selectedEarnings),
                        )}</span
                      >
                    </div>
                  {/if}
                  <div
                    class="flex justify-between text-gray-700 dark:text-zinc-300"
                  >
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
                          : "text-rose-800 dark:text-rose-400"}>Surprise</span
                      >
                      <span
                        class={surprise?.positive
                          ? "text-emerald-800 dark:text-emerald-400"
                          : "text-rose-800 dark:text-rose-400"}
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
                        <span class="text-gray-600 dark:text-zinc-400"
                          >YoY Change</span
                        >
                        <span
                          class={yoy.positive
                            ? "text-emerald-800 dark:text-emerald-400"
                            : "text-rose-800 dark:text-rose-400"}
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
                class="block w-full text-center py-2 px-4 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 text-sm font-medium rounded-lg transition"
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
          <div class="absolute inset-0 pointer-events-none z-[15]">
            {#each dividendMarkers as marker, i (`${marker.timestamp}-${i}`)}
              {#if marker?.visible}
                <button
                  class="absolute -translate-x-1/2 pointer-events-auto cursor-pointer transition-transform hover:scale-110"
                  style="left: {marker.x}px; bottom: {eventMarkerBottom}px"
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
            class="fixed sm:absolute z-[20] pointer-events-auto bottom-0 left-0 right-0 sm:bottom-auto sm:left-auto sm:right-auto"
            style:left={!isMobile ? `${dividendPopupPosition.x}px` : undefined}
            style:top={!isMobile ? `${dividendPopupPosition.y}px` : undefined}
            style:transform={!isMobile ? "translate(-50%, -100%)" : undefined}
          >
            <div
              class="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-t-xl sm:rounded-xl shadow-2xl p-4 w-full sm:min-w-[280px] sm:max-w-[320px]"
            >
              <!-- Header -->
              <div class="flex items-center gap-2 mb-3">
                <h3 class="text-gray-900 dark:text-white font-semibold">
                  Dividend
                </h3>
                <button
                  class="cursor-pointer ml-auto text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition"
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
              <div
                class="text-sm text-gray-700 dark:text-zinc-300 mb-3 space-y-1"
              >
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-zinc-400"
                    >Ex-Dividend Date</span
                  >
                  <span class="text-gray-900 dark:text-white">
                    {new Date(selectedDividend.date).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" },
                    )}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-zinc-400">Amount</span>
                  <span class="text-blue-400 font-semibold">
                    ${selectedDividend.adjDividend?.toFixed(4)}
                  </span>
                </div>
                {#if selectedDividend.declarationDate}
                  <div class="flex justify-between">
                    <span class="text-gray-500 dark:text-zinc-400"
                      >Declaration Date</span
                    >
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
                    <span class="text-gray-500 dark:text-zinc-400"
                      >Record Date</span
                    >
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
                    <span class="text-gray-500 dark:text-zinc-400"
                      >Payment Date</span
                    >
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
                class="block w-full text-center py-2 px-4 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 text-sm font-medium rounded-lg transition"
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
          <div class="absolute inset-0 pointer-events-none z-[15]">
            {#each newsMarkers as marker, i (`${marker.news.date}-${i}`)}
              {#if marker?.visible}
                <button
                  class="absolute -translate-x-1/2 pointer-events-auto cursor-pointer transition-transform hover:scale-110"
                  style="left: {marker.x}px; bottom: {eventMarkerBottom}px"
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
            class="fixed sm:absolute z-[20] pointer-events-auto bottom-0 left-0 right-0 sm:bottom-auto sm:left-auto sm:right-auto"
            style:left={!isMobile ? `${newsPopupPosition.x}px` : undefined}
            style:top={!isMobile ? `${newsPopupPosition.y}px` : undefined}
            style:transform={!isMobile ? "translate(-50%, -100%)" : undefined}
          >
            <div
              class="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-t-xl sm:rounded-xl shadow-2xl p-4 w-full sm:min-w-[300px] sm:max-w-[380px]"
            >
              <!-- Header -->
              <div class="flex items-center justify-between gap-2 mb-3">
                <h3 class="text-gray-900 dark:text-white font-semibold">
                  Why Price Moved
                </h3>
                <span
                  class={`text-sm font-semibold ${
                    typeof selectedNews.changesPercentage === "number"
                      ? selectedNews.changesPercentage > 0
                        ? "text-emerald-400"
                        : selectedNews.changesPercentage < 0
                          ? "text-red-400"
                          : "text-gray-600 dark:text-zinc-400"
                      : selectedNews.changesPercentage === "-" ||
                          selectedNews.changesPercentage === null
                        ? "text-gray-600 dark:text-zinc-400"
                        : parseFloat(String(selectedNews.changesPercentage)) > 0
                          ? "text-emerald-400"
                          : parseFloat(String(selectedNews.changesPercentage)) <
                              0
                            ? "text-red-400"
                            : "text-gray-600 dark:text-zinc-400"
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
              <div class="text-xs text-gray-500 dark:text-zinc-400 mb-2">
                {new Date(selectedNews.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>

              <!-- News Text -->
              <p
                class="text-gray-700 dark:text-zinc-200 text-sm leading-relaxed"
              >
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
                {#if level.showLabel}
                  <div
                    class="absolute right-2 pointer-events-auto cursor-pointer"
                    style="top: {level.y - 10}px;"
                    on:click={(e) => handleGexLevelClick(level, e)}
                    on:keypress={(e) =>
                      e.key === "Enter" && handleGexLevelClick(level, e)}
                    role="button"
                    tabindex="0"
                    aria-label="GEX label at ${level.strike}"
                  >
                    <span
                      class={`px-1.5 py-0.5 rounded bg-white/80 dark:bg-zinc-900/80 text-[10px] border ${
                        level.isPositive
                          ? "text-emerald-200 border-emerald-500/30"
                          : "text-rose-200 border-rose-500/30"
                      }`}
                    >
                      GEX {formatPrice(level.strike)}
                      {level.isPositive ? "+" : "-"}{formatExposureValue(
                        level.absValue,
                      )}
                    </span>
                  </div>
                {/if}
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
                {#if level.showLabel}
                  <div
                    class="absolute right-2 pointer-events-auto cursor-pointer"
                    style="top: {level.y - 10}px;"
                    on:click={(e) => handleDexLevelClick(level, e)}
                    on:keypress={(e) =>
                      e.key === "Enter" && handleDexLevelClick(level, e)}
                    role="button"
                    tabindex="0"
                    aria-label="DEX label at ${level.strike}"
                  >
                    <span
                      class={`px-1.5 py-0.5 rounded bg-white/80 dark:bg-zinc-900/80 text-[10px] border ${
                        level.isPositive
                          ? "text-sky-200 border-sky-500/30"
                          : "text-orange-200 border-orange-500/30"
                      }`}
                    >
                      DEX {formatPrice(level.strike)}
                      {level.isPositive ? "+" : "-"}{formatExposureValue(
                        level.absValue,
                      )}
                    </span>
                  </div>
                {/if}
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
              class="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-xl shadow-2xl p-3 sm:p-4 w-full"
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
                  class="text-gray-900 dark:text-white font-semibold text-sm sm:text-base truncate"
                >
                  {isGex ? "Gamma (GEX)" : "Delta (DEX)"}
                </h3>
                <button
                  class="cursor-pointer ml-auto text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition flex-shrink-0"
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
                <div
                  class="flex justify-between text-gray-700 dark:text-zinc-300"
                >
                  <span class="text-gray-500 dark:text-zinc-400">Strike</span>
                  <span class="font-medium">${level?.strike.toFixed(2)}</span>
                </div>
                <div
                  class="flex justify-between text-gray-700 dark:text-zinc-300"
                >
                  <span class="text-gray-500 dark:text-zinc-400"
                    >Net {isGex ? "Gamma" : "Delta"}</span
                  >
                  <span
                    class="font-medium {level?.isPositive
                      ? 'text-emerald-800 dark:text-emerald-400'
                      : 'text-rose-800 dark:text-rose-400'}"
                  >
                    {formatSignedExposure(level?.value ?? 0)}
                  </span>
                </div>
                <div
                  class="flex justify-between text-gray-700 dark:text-zinc-300"
                >
                  <span class="text-gray-500 dark:text-zinc-400">Call</span>
                  <span class="text-emerald-800 dark:text-emerald-400"
                    >{formatExposureValue(level?.callValue ?? 0)}</span
                  >
                </div>
                <div
                  class="flex justify-between text-gray-700 dark:text-zinc-300"
                >
                  <span class="text-gray-500 dark:text-zinc-400">Put</span>
                  <span class="text-rose-800 dark:text-rose-400"
                    >{formatExposureValue(level?.putValue ?? 0)}</span
                  >
                </div>
              </div>

              <!-- Explanation -->
              <div
                class="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-300 dark:border-zinc-700 text-[10px] sm:text-xs text-gray-600 dark:text-zinc-400 leading-relaxed"
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
                href="/{assetType}/{ticker}/options/{isGex
                  ? 'gex'
                  : 'dex'}/strike"
                class="block w-full text-center py-1.5 sm:py-2 px-3 mt-2 sm:mt-3 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 text-xs sm:text-sm font-medium rounded-lg transition"
              >
                View all levels
              </a>
            </div>
          </div>
        {/if}

        <!-- Max Pain horizontal levels overlay -->
        {#if indicatorState.max_pain && maxPainLevels.length > 0}
          <div class="absolute inset-0 pointer-events-none z-[4]">
            {#each maxPainLevels as level (level.expiration)}
              {#if level.visible}
                <div
                  class="absolute left-0 right-0 pointer-events-auto cursor-pointer transition-opacity hover:opacity-100"
                  style="top: {level.y}px; border-top: {level.isPrimary
                    ? 2
                    : 1}px solid rgba(245, 158, 11, {0.5 +
                    level.intensity * 0.4}); opacity: {0.65 +
                    level.intensity * 0.35}"
                  on:click={(e) => handleMaxPainLevelClick(level, e)}
                  on:keypress={(e) =>
                    e.key === "Enter" && handleMaxPainLevelClick(level, e)}
                  role="button"
                  tabindex="0"
                  aria-label="Max pain level at ${level.price}"
                ></div>
                <div
                  class="absolute right-2 pointer-events-auto cursor-pointer"
                  style="top: {level.labelY}px;"
                  on:click={(e) => handleMaxPainLevelClick(level, e)}
                  on:keypress={(e) =>
                    e.key === "Enter" && handleMaxPainLevelClick(level, e)}
                  role="button"
                  tabindex="0"
                  aria-label="Max pain label at ${level.price}"
                >
                  <span
                    class="px-1.5 py-0.5 rounded bg-white/80 dark:bg-zinc-900/80 text-[10px] text-amber-200 border border-amber-500/30"
                  >
                    MP {formatExpiration(level.expiration)}
                    {#if level.dte !== null}
                      ({level.dte}d)
                    {/if}
                    {formatPrice(level.price)}
                  </span>
                </div>
              {/if}
            {/each}
          </div>
        {/if}

        <!-- Analyst Target horizontal levels overlay -->
        {#if indicatorState.analyst_target && analystTargetLevels.length > 0}
          <div class="absolute inset-0 pointer-events-none z-[4]">
            {#each analystTargetLevels as level (level.key)}
              {#if level.visible}
                <div
                  class="absolute left-0 right-0 pointer-events-auto cursor-pointer transition-opacity hover:opacity-100"
                  style="top: {level.y}px; border-top: 2px solid {level.color}; opacity: 0.7"
                  on:click={(e) => handleAnalystTargetLevelClick(level, e)}
                  on:keypress={(e) =>
                    e.key === "Enter" &&
                    handleAnalystTargetLevelClick(level, e)}
                  role="button"
                  tabindex="0"
                  aria-label="Analyst target {level.label} at ${level.price}"
                ></div>
                <div
                  class="absolute right-2 pointer-events-auto cursor-pointer"
                  style="top: {level.labelY}px;"
                  on:click={(e) => handleAnalystTargetLevelClick(level, e)}
                  on:keypress={(e) =>
                    e.key === "Enter" &&
                    handleAnalystTargetLevelClick(level, e)}
                  role="button"
                  tabindex="0"
                  aria-label="Analyst target label {level.label} at ${level.price}"
                >
                  <span
                    class="px-1.5 py-0.5 rounded bg-white/80 dark:bg-zinc-900/80 text-[10px] border"
                    style="color: {level.color}; border-color: {level.color}55;"
                  >
                    PT {level.label}
                    {formatPrice(level.price)}
                  </span>
                </div>
              {/if}
            {/each}
          </div>
        {/if}

        <!-- Max Pain popup -->
        {#if selectedMaxPainLevel}
          {@const refPrice = typeof lastClose === "number" ? lastClose : null}
          {@const diff =
            refPrice !== null ? selectedMaxPainLevel.price - refPrice : null}
          {@const diffAbs = diff !== null ? Math.abs(diff) : null}
          {@const diffLabel =
            diffAbs !== null
              ? `${diff >= 0 ? "+" : "-"}${formatPrice(diffAbs)}`
              : "-"}
          {@const diffPct = refPrice !== null ? (diff / refPrice) * 100 : null}
          <button
            class="fixed inset-0 z-[6] cursor-default bg-transparent"
            on:click={closeMaxPainPopup}
            aria-label="Close Max Pain popup"
          ></button>
          <div
            class="absolute z-[7] pointer-events-auto w-[260px]"
            style="left: {maxPainPopupPosition.x}px; top: {maxPainPopupPosition.y}px;"
          >
            <div
              class="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-xl shadow-2xl p-3 sm:p-4 w-full"
            >
              <!-- Header -->
              <div class="flex items-center gap-2 mb-2 sm:mb-3">
                <div
                  class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                  style="background: #f59e0b"
                ></div>
                <h3
                  class="text-gray-900 dark:text-white font-semibold text-sm sm:text-base truncate"
                >
                  Max Pain
                </h3>
                <button
                  class="cursor-pointer ml-auto text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition flex-shrink-0"
                  on:click={closeMaxPainPopup}
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

              <!-- Max pain info -->
              <div class="text-xs sm:text-sm space-y-1.5 sm:space-y-2">
                <div
                  class="flex justify-between text-gray-700 dark:text-zinc-300"
                >
                  <span class="text-gray-500 dark:text-zinc-400"
                    >Expiration</span
                  >
                  <span class="font-medium"
                    >{formatExpiration(selectedMaxPainLevel.expiration)}</span
                  >
                </div>
                <div
                  class="flex justify-between text-gray-700 dark:text-zinc-300"
                >
                  <span class="text-gray-500 dark:text-zinc-400">DTE</span>
                  <span class="font-medium"
                    >{selectedMaxPainLevel.dte !== null
                      ? `${selectedMaxPainLevel.dte}d`
                      : "N/A"}</span
                  >
                </div>
                <div
                  class="flex justify-between text-gray-700 dark:text-zinc-300"
                >
                  <span class="text-gray-500 dark:text-zinc-400">Max Pain</span>
                  <span class="font-medium text-amber-200"
                    >{formatPrice(selectedMaxPainLevel.price)}</span
                  >
                </div>
                <div
                  class="flex justify-between text-gray-700 dark:text-zinc-300"
                >
                  <span class="text-gray-500 dark:text-zinc-400">Spot</span>
                  <span class="font-medium">{formatPrice(refPrice)}</span>
                </div>
                <div
                  class="flex justify-between text-gray-700 dark:text-zinc-300"
                >
                  <span class="text-gray-500 dark:text-zinc-400">Distance</span>
                  <span
                    class="font-medium {diff !== null && diff >= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'}"
                  >
                    {diffLabel} ({formatPercent(diffPct)})
                  </span>
                </div>
              </div>

              <!-- Explanation -->
              <div
                class="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-300 dark:border-zinc-700 text-[10px] sm:text-xs text-gray-600 dark:text-zinc-400 leading-relaxed"
              >
                <p>
                  Max pain is the strike where option buyers lose the most.
                  Pinning risk increases as DTE shrinks.
                </p>
              </div>

              <!-- Link to more details -->
              <a
                href="/{assetType}/{ticker}/options/max-pain"
                class="block w-full text-center py-1.5 sm:py-2 px-3 mt-2 sm:mt-3 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 text-xs sm:text-sm font-medium rounded-lg transition"
              >
                View All Max Pain
              </a>
            </div>
          </div>
        {/if}

        <!-- Analyst Target popup -->
        {#if selectedAnalystTargetLevel && analystTargetSummary}
          {@const refPrice = typeof lastClose === "number" ? lastClose : null}
          {@const targetRows = [
            {
              key: "High",
              value: analystTargetSummary.high,
              color: ANALYST_TARGET_COLORS.high,
            },
            {
              key: "Average",
              value: analystTargetSummary.average,
              color: ANALYST_TARGET_COLORS.average,
            },
            {
              key: "Median",
              value: analystTargetSummary.median,
              color: ANALYST_TARGET_COLORS.median,
            },
            {
              key: "Low",
              value: analystTargetSummary.low,
              color: ANALYST_TARGET_COLORS.low,
            },
          ].filter((row) => row.value !== null)}
          <button
            class="fixed inset-0 z-[6] cursor-default bg-transparent"
            on:click={closeAnalystTargetPopup}
            aria-label="Close Analyst Target popup"
          ></button>
          <div
            class="absolute z-[7] pointer-events-auto w-[260px]"
            style="left: {analystTargetPopupPosition.x}px; top: {analystTargetPopupPosition.y}px;"
          >
            <div
              class="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-xl shadow-2xl p-3 sm:p-4 w-full"
            >
              <!-- Header -->
              <div class="flex items-center gap-2 mb-2 sm:mb-3">
                <div
                  class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                  style="background: #22c55e"
                ></div>
                <h3
                  class="text-gray-900 dark:text-white font-semibold text-sm sm:text-base truncate"
                >
                  Analyst Targets
                </h3>
                <button
                  class="cursor-pointer ml-auto text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition flex-shrink-0"
                  on:click={closeAnalystTargetPopup}
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

              <!-- Targets info -->
              <div class="text-xs sm:text-sm space-y-1.5 sm:space-y-2">
                <div
                  class="flex justify-between text-gray-700 dark:text-zinc-300"
                >
                  <span class="text-gray-500 dark:text-zinc-400">Spot</span>
                  <span class="font-medium">{formatPrice(refPrice)}</span>
                </div>
                {#each targetRows as row (row.key)}
                  {@const diff =
                    refPrice !== null ? row.value - refPrice : null}
                  {@const diffPct =
                    refPrice !== null && diff !== null
                      ? (diff / refPrice) * 100
                      : null}
                  <div
                    class="flex justify-between text-gray-700 dark:text-zinc-300"
                  >
                    <span class="text-gray-500 dark:text-zinc-400"
                      >{row.key}</span
                    >
                    <span class="font-medium" style="color: {row.color}">
                      {formatPrice(row.value)}
                      <span
                        class="ml-1 text-[11px] {diff !== null && diff >= 0
                          ? 'text-emerald-400'
                          : 'text-rose-400'}"
                      >
                        ({formatPercent(diffPct)})
                      </span>
                    </span>
                  </div>
                {/each}
                {#if analystTargetSummary.numAnalysts !== null}
                  <div
                    class="flex justify-between text-gray-700 dark:text-zinc-300"
                  >
                    <span class="text-gray-500 dark:text-zinc-400"
                      >Analysts</span
                    >
                    <span class="font-medium">
                      {formatCount(analystTargetSummary.numAnalysts)}
                    </span>
                  </div>
                {/if}
                {#if analystTargetSummary.consensus}
                  <div
                    class="flex justify-between text-gray-700 dark:text-zinc-300"
                  >
                    <span class="text-gray-500 dark:text-zinc-400"
                      >Consensus</span
                    >
                    <span class="font-medium">
                      {analystTargetSummary.consensus}
                    </span>
                  </div>
                {/if}
              </div>

              <!-- Explanation -->
              <div
                class="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-300 dark:border-zinc-700 text-[10px] sm:text-xs text-gray-600 dark:text-zinc-400 leading-relaxed"
              >
                <p>
                  Targets are 12-month analyst estimates. Use them as reference
                  levels, not guarantees.
                </p>
              </div>

              <!-- Link to more details -->
              <a
                href="/stocks/{ticker}/forecast"
                class="block w-full text-center py-1.5 sm:py-2 px-3 mt-2 sm:mt-3 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 text-xs sm:text-sm font-medium rounded-lg transition"
              >
                View forecast
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
                {#if level.showLabel}
                  <div
                    class="absolute right-2 pointer-events-auto cursor-pointer"
                    style="top: {level.y - 10}px;"
                    on:click={(e) => handleOiLevelClick(level, e)}
                    on:keypress={(e) =>
                      e.key === "Enter" && handleOiLevelClick(level, e)}
                    role="button"
                    tabindex="0"
                    aria-label="OI label at ${level.strike}"
                  >
                    <span
                      class="px-1.5 py-0.5 rounded bg-white/80 dark:bg-zinc-900/80 text-[10px] text-purple-200 border border-purple-500/30"
                    >
                      OI {formatPrice(level.strike)}
                      {formatCount(level.totalOi)}
                    </span>
                  </div>
                {/if}
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
              class="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-xl shadow-2xl p-3 sm:p-4 w-full"
            >
              <!-- Header -->
              <div class="flex items-center gap-2 mb-2 sm:mb-3">
                <div
                  class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                  style="background: #a855f7"
                ></div>
                <h3
                  class="text-gray-900 dark:text-white font-semibold text-sm sm:text-base truncate"
                >
                  Open Interest (OI)
                </h3>
                <button
                  class="cursor-pointer ml-auto text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition flex-shrink-0"
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
                <div
                  class="flex justify-between text-gray-700 dark:text-zinc-300"
                >
                  <span class="text-gray-500 dark:text-zinc-400">Strike</span>
                  <span class="font-medium"
                    >{formatPrice(selectedOiLevel.strike)}</span
                  >
                </div>
                {#if selectedOiLevel.expiration}
                  <div
                    class="flex justify-between text-gray-700 dark:text-zinc-300"
                  >
                    <span class="text-gray-500 dark:text-zinc-400"
                      >Expiration</span
                    >
                    <span class="font-medium"
                      >{formatExpiration(selectedOiLevel.expiration)}</span
                    >
                  </div>
                {/if}
                {#if selectedOiLevel.dte !== null}
                  <div
                    class="flex justify-between text-gray-700 dark:text-zinc-300"
                  >
                    <span class="text-gray-500 dark:text-zinc-400">DTE</span>
                    <span class="font-medium">{selectedOiLevel.dte}d</span>
                  </div>
                {/if}
                <div
                  class="flex justify-between text-gray-700 dark:text-zinc-300"
                >
                  <span class="text-gray-500 dark:text-zinc-400">Total OI</span>
                  <span class="font-medium text-purple-400">
                    {formatCount(selectedOiLevel.totalOi)}
                  </span>
                </div>
                <div
                  class="flex justify-between text-gray-700 dark:text-zinc-300"
                >
                  <span class="text-gray-500 dark:text-zinc-400">Call OI</span>
                  <span class="text-emerald-800 dark:text-emerald-400"
                    >{formatCount(selectedOiLevel.callOi)}</span
                  >
                </div>
                <div
                  class="flex justify-between text-gray-700 dark:text-zinc-300"
                >
                  <span class="text-gray-500 dark:text-zinc-400">Put OI</span>
                  <span class="text-rose-800 dark:text-rose-400"
                    >{formatCount(selectedOiLevel.putOi)}</span
                  >
                </div>
                <div
                  class="flex justify-between text-gray-700 dark:text-zinc-300"
                >
                  <span class="text-gray-500 dark:text-zinc-400">P/C Ratio</span
                  >
                  <span
                    class="font-medium {selectedOiLevel.callOi > 0 &&
                    selectedOiLevel.putOi / selectedOiLevel.callOi > 1
                      ? 'text-rose-800 dark:text-rose-400'
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
                class="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-300 dark:border-zinc-700 text-[10px] sm:text-xs text-gray-600 dark:text-zinc-400 leading-relaxed"
              >
                <p>
                  High OI here indicates significant positioning. May act as
                  support/resistance.
                </p>
              </div>

              <!-- Link to more details -->
              <a
                href="/{assetType}/{ticker}/options/oi"
                class="block w-full text-center py-1.5 sm:py-2 px-3 mt-2 sm:mt-3 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 text-xs sm:text-sm font-medium rounded-lg transition"
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
                {#if level.showLabel}
                  <div
                    class="absolute right-2 pointer-events-auto cursor-pointer"
                    style="top: {level.y - 10}px;"
                    on:click={(e) => handleHottestLevelClick(level, e)}
                    on:keypress={(e) =>
                      e.key === "Enter" && handleHottestLevelClick(level, e)}
                    role="button"
                    tabindex="0"
                    aria-label="Hottest contract label at ${level.strike}"
                  >
                    <span
                      class={`px-1.5 py-0.5 rounded bg-white/80 dark:bg-zinc-900/80 text-[10px] border ${
                        level.optionType === "C"
                          ? "text-emerald-200 border-emerald-500/30"
                          : "text-rose-200 border-rose-500/30"
                      }`}
                    >
                      HOT {level.optionType}
                      {formatExpiration(level.expiration)}
                      {formatCount(level.volume)}
                    </span>
                  </div>
                {/if}
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
              class="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-xl shadow-2xl p-3 sm:p-4 w-full"
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
                  class="text-gray-900 dark:text-white font-semibold text-sm sm:text-base truncate"
                >
                  {selectedHottestLevel.optionType === "C" ? "Call" : "Put"}
                  {formatPrice(selectedHottestLevel.strike)}
                </h3>
                <button
                  class="cursor-pointer ml-auto text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition flex-shrink-0"
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
                <div
                  class="flex justify-between text-gray-700 dark:text-zinc-300"
                >
                  <span class="text-gray-500 dark:text-zinc-400"
                    >Expiration</span
                  >
                  <span class="font-medium"
                    >{formatExpiration(selectedHottestLevel.expiration)}</span
                  >
                </div>
                {#if selectedHottestLevel.dte !== null}
                  <div
                    class="flex justify-between text-gray-700 dark:text-zinc-300"
                  >
                    <span class="text-gray-500 dark:text-zinc-400">DTE</span>
                    <span class="font-medium">{selectedHottestLevel.dte}d</span>
                  </div>
                {/if}
                <div
                  class="flex justify-between text-gray-700 dark:text-zinc-300"
                >
                  <span class="text-gray-500 dark:text-zinc-400">Volume</span>
                  <span class="font-medium text-amber-400">
                    {formatCount(selectedHottestLevel.volume)}
                  </span>
                </div>
                <div
                  class="flex justify-between text-gray-700 dark:text-zinc-300"
                >
                  <span class="text-gray-500 dark:text-zinc-400"
                    >Open Interest</span
                  >
                  <span class="text-purple-400"
                    >{formatCount(selectedHottestLevel.openInterest)}</span
                  >
                </div>
                <div
                  class="flex justify-between text-gray-700 dark:text-zinc-300"
                >
                  <span class="text-gray-500 dark:text-zinc-400"
                    >Last Price</span
                  >
                  <span
                    class={selectedHottestLevel.optionType === "C"
                      ? "text-emerald-800 dark:text-emerald-400"
                      : "text-rose-800 dark:text-rose-400"}
                    >{formatPrice(selectedHottestLevel.last)}</span
                  >
                </div>
                <div
                  class="flex justify-between text-gray-700 dark:text-zinc-300"
                >
                  <span class="text-gray-500 dark:text-zinc-400">IV</span>
                  <span class="font-medium"
                    >{formatIvPercent(selectedHottestLevel.iv)}</span
                  >
                </div>
                <div
                  class="flex justify-between text-gray-700 dark:text-zinc-300"
                >
                  <span class="text-gray-500 dark:text-zinc-400">Premium</span>
                  <span class="font-medium"
                    >${formatCount(selectedHottestLevel.premium)}</span
                  >
                </div>
              </div>

              <!-- Explanation -->
              <div
                class="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-300 dark:border-zinc-700 text-[10px] sm:text-xs text-gray-600 dark:text-zinc-400 leading-relaxed"
              >
                <p>
                  High volume contract. Large trades here may signal
                  institutional activity or hedging.
                </p>
              </div>

              <!-- Link to more details -->
              <a
                href="/{assetType}/{ticker}/options/hottest-contracts/volume"
                class="block w-full text-center py-1.5 sm:py-2 px-3 mt-2 sm:mt-3 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 text-xs sm:text-sm font-medium rounded-lg transition"
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

  <!-- Mobile Bottom Navigation Bar -->
  <div
    class="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-gray-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
  >
    <div class="flex items-center justify-around px-2 py-1">
      <!-- Timeframe -->
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild let:builder>
          <button
            use:builder.action
            {...builder}
            class="flex flex-col items-center gap-0.5 px-3 py-2 text-gray-600 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-200 transition min-w-[60px]"
          >
            <Timer class="h-5 w-5" />
            <span class="text-[10px] font-medium">{activeRange}</span>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          side="top"
          align="center"
          sideOffset={8}
          class="w-32 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-1 text-gray-700 dark:text-zinc-200"
        >
          <DropdownMenu.Group>
            {#each timeframes as frame}
              <DropdownMenu.Item
                class={`px-3 py-2 text-sm rounded cursor-pointer transition ${
                  activeRange === frame
                    ? "text-violet-400 bg-gray-100 dark:bg-zinc-800"
                    : "hover:bg-gray-100/60 dark:hover:bg-zinc-800"
                }`}
                on:click={() => setRange(frame)}
              >
                {frame}
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Group>
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      <!-- Chart Type -->
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild let:builder>
          <button
            use:builder.action
            {...builder}
            class="flex flex-col items-center gap-0.5 px-3 py-2 text-gray-600 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-200 transition min-w-[60px]"
          >
            <svelte:component this={currentChartType?.icon} class="h-5 w-5" />
            <span class="text-[10px] font-medium">Chart</span>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          side="top"
          align="center"
          sideOffset={8}
          class="w-40 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-1 text-gray-700 dark:text-zinc-200"
        >
          <DropdownMenu.Group>
            {#each chartTypeOptions as option}
              <DropdownMenu.Item
                class={`flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer transition ${
                  chartType === option.id
                    ? "text-violet-400 bg-gray-100 dark:bg-zinc-800"
                    : "hover:bg-gray-100/60 dark:hover:bg-zinc-800"
                }`}
                on:click={() => setChartType(option.id)}
              >
                <svelte:component this={option.icon} class="h-4 w-4" />
                {option.label}
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Group>
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      <!-- Indicators -->
      <label
        for="indicatorModal"
        on:click={openIndicatorModal}
        class="flex flex-col items-center gap-0.5 px-3 py-2 text-gray-600 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-200 cursor-pointer transition min-w-[60px]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 28 28"
          class="h-5 w-5"
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
        <span class="text-[10px] font-medium">Indicators</span>
      </label>

      <!-- Events -->
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild let:builder>
          <button
            use:builder.action
            {...builder}
            class="flex flex-col items-center gap-0.5 px-3 py-2 text-gray-600 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-200 transition min-w-[60px]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 28 28"
              class="h-5 w-5"
              fill="currentColor"
            >
              <path
                d="M10 6a4 4 0 1 1 8 0v1h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2V6zm6 0a2 2 0 1 0-4 0v1h4V6zM8 9v12h12V9H8zm3 3h6v2h-6v-2zm0 4h4v2h-4v-2z"
              />
            </svg>
            <span class="text-[10px] font-medium">Events</span>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          side="top"
          align="center"
          sideOffset={8}
          class="w-auto min-w-44 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-1 text-gray-700 dark:text-zinc-200"
        >
          <DropdownMenu.Group>
            <DropdownMenu.Item
              class="flex items-center justify-between px-3 py-2.5 text-sm rounded hover:bg-gray-100/60 dark:hover:bg-zinc-800 cursor-pointer"
              on:click={(e) => e.preventDefault()}
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
                      if (showEarnings && !isNonIntradayRange(activeRange)) {
                        setRange("1D");
                        setTimeout(() => setRange("1D"), 150);
                      } else {
                        updateAllOverlays();
                      }
                    }}
                  />
                  <div
                    class="w-9 h-5 bg-gray-200 dark:bg-zinc-700 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 dark:border-zinc-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"
                  ></div>
                {:else}
                  <button
                    type="button"
                    on:click|stopPropagation={() => goto("/pricing")}
                    class="text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 transition"
                  >
                    <svg
                      class="w-4 h-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      ><path
                        fill="currentColor"
                        d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                      /></svg
                    >
                  </button>
                {/if}
              </div>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              class="flex items-center justify-between px-3 py-2.5 text-sm rounded hover:bg-gray-100/60 dark:hover:bg-zinc-800 cursor-pointer"
              on:click={(e) => e.preventDefault()}
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
                      if (showDividends && !isNonIntradayRange(activeRange)) {
                        setRange("1D");
                        setTimeout(() => setRange("1D"), 150);
                      } else {
                        updateAllOverlays();
                      }
                    }}
                  />
                  <div
                    class="w-9 h-5 bg-gray-200 dark:bg-zinc-700 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 dark:border-zinc-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"
                  ></div>
                {:else}
                  <button
                    type="button"
                    on:click|stopPropagation={() => goto("/pricing")}
                    class="text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 transition"
                  >
                    <svg
                      class="w-4 h-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      ><path
                        fill="currentColor"
                        d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                      /></svg
                    >
                  </button>
                {/if}
              </div>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              class="flex items-center justify-between px-3 py-2.5 text-sm rounded hover:bg-gray-100/60 dark:hover:bg-zinc-800 cursor-pointer"
              on:click={(e) => e.preventDefault()}
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
                      if (showNewsFlow && !isNonIntradayRange(activeRange)) {
                        setRange("1D");
                        setTimeout(() => setRange("1D"), 150);
                      } else {
                        updateAllOverlays();
                      }
                    }}
                  />
                  <div
                    class="w-9 h-5 bg-gray-200 dark:bg-zinc-700 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 dark:border-zinc-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"
                  ></div>
                {:else}
                  <button
                    type="button"
                    on:click|stopPropagation={() => goto("/pricing")}
                    class="text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 transition"
                  >
                    <svg
                      class="w-4 h-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      ><path
                        fill="currentColor"
                        d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                      /></svg
                    >
                  </button>
                {/if}
              </div>
            </DropdownMenu.Item>
          </DropdownMenu.Group>
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      <!-- Zoom -->
      <div class="flex flex-col items-center gap-0.5 px-2 py-2 min-w-[60px]">
        <div class="flex items-center gap-1">
          <button
            class="p-1.5 text-gray-600 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-200 hover:bg-gray-100/60 dark:hover:bg-zinc-800 rounded transition"
            on:click={() => zoomChart(1.2)}
            title="Zoom in"
          >
            <ZoomIn class="h-4 w-4" />
          </button>
          <button
            class="p-1.5 text-gray-600 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-200 hover:bg-gray-100/60 dark:hover:bg-zinc-800 rounded transition"
            on:click={() => zoomChart(0.9)}
            title="Zoom out"
          >
            <ZoomOut class="h-4 w-4" />
          </button>
        </div>
        <span class="text-[10px] font-medium text-gray-600 dark:text-zinc-400"
          >Zoom</span
        >
      </div>
    </div>
  </div>
</main>

<!-- Mobile Bottom Navigation Bar -->
{#if isMobile}
  <div
    class="fixed bottom-0 left-0 right-0 z-40 sm:hidden border-t border-gray-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
  >
    <div class="flex items-center justify-around h-14 px-2">
      <!-- Timeframe -->
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild let:builder>
          <button
            use:builder.action
            {...builder}
            class="flex flex-col items-center justify-center gap-0.5 p-2 min-w-[56px] text-gray-600 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-200 transition"
          >
            <Timer class="h-5 w-5" />
            <span class="text-[10px] font-medium">{activeRange}</span>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          side="top"
          align="center"
          sideOffset={8}
          class="w-28 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-1"
        >
          <DropdownMenu.Group>
            {#each timeframes as frame}
              <DropdownMenu.Item
                class={`px-3 py-2 text-sm rounded cursor-pointer transition ${
                  activeRange === frame
                    ? "text-violet-400 bg-gray-100 dark:bg-zinc-800"
                    : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100/60 dark:hover:bg-zinc-800"
                }`}
                on:click={() => setRange(frame)}
              >
                {frame}
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Group>
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      <!-- Chart Type -->
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild let:builder>
          <button
            use:builder.action
            {...builder}
            class="flex flex-col items-center justify-center gap-0.5 p-2 min-w-[56px] text-gray-600 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-200 transition"
          >
            <svelte:component this={currentChartType?.icon} class="h-5 w-5" />
            <span class="text-[10px] font-medium">Chart</span>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          side="top"
          align="center"
          sideOffset={8}
          class="w-36 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-1"
        >
          <DropdownMenu.Group>
            {#each chartTypeOptions as option}
              <DropdownMenu.Item
                class={`flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer transition ${
                  chartType === option.id
                    ? "text-violet-400 bg-gray-100 dark:bg-zinc-800"
                    : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100/60 dark:hover:bg-zinc-800"
                }`}
                on:click={() => setChartType(option.id)}
              >
                <svelte:component this={option.icon} class="h-4 w-4" />
                {option.label}
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Group>
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      <!-- Indicators -->
      <label
        for="indicatorModal"
        class="flex flex-col items-center justify-center gap-0.5 p-2 min-w-[56px] text-gray-600 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-200 transition cursor-pointer"
      >
        <svg
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
        <span class="text-[10px] font-medium">Indicators</span>
      </label>

      <!-- Events -->
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild let:builder>
          <button
            use:builder.action
            {...builder}
            class="flex flex-col items-center justify-center gap-0.5 p-2 min-w-[56px] text-gray-600 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-200 transition"
          >
            <svg
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span class="text-[10px] font-medium">Events</span>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          side="top"
          align="center"
          sideOffset={8}
          class="w-44 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-1"
        >
          <DropdownMenu.Group>
            <DropdownMenu.Item
              class="flex items-center justify-between px-3 py-2.5 text-sm rounded hover:bg-gray-100/60 dark:hover:bg-zinc-800 cursor-pointer"
              on:click={(e) => e.preventDefault()}
            >
              <span class="text-gray-700 dark:text-zinc-300">Earnings</span>
              <div class="relative ml-4 flex items-center">
                <input
                  type="checkbox"
                  class="sr-only peer"
                  checked={showEarnings}
                  on:change={() => {
                    showEarnings = !showEarnings;
                    saveEventSettings();
                    if (showEarnings && !isNonIntradayRange(activeRange)) {
                      setRange("1D");
                      setTimeout(() => setRange("1D"), 150);
                    } else {
                      updateAllOverlays();
                    }
                  }}
                />
                <div
                  class="w-9 h-5 bg-gray-200 dark:bg-zinc-700 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 dark:border-zinc-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"
                ></div>
              </div>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              class="flex items-center justify-between px-3 py-2.5 text-sm rounded hover:bg-gray-100/60 dark:hover:bg-zinc-800 cursor-pointer"
              on:click={(e) => e.preventDefault()}
            >
              <span class="text-gray-700 dark:text-zinc-300">Dividends</span>
              <div class="relative ml-4 flex items-center">
                <input
                  type="checkbox"
                  class="sr-only peer"
                  checked={showDividends}
                  on:change={() => {
                    showDividends = !showDividends;
                    saveEventSettings();
                    if (showDividends && !isNonIntradayRange(activeRange)) {
                      setRange("1D");
                      setTimeout(() => setRange("1D"), 150);
                    } else {
                      updateAllOverlays();
                    }
                  }}
                />
                <div
                  class="w-9 h-5 bg-gray-200 dark:bg-zinc-700 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 dark:border-zinc-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"
                ></div>
              </div>
            </DropdownMenu.Item>
            {#if isSubscribed}
              <DropdownMenu.Item
                class="flex items-center justify-between px-3 py-2.5 text-sm rounded hover:bg-gray-100/60 dark:hover:bg-zinc-800 cursor-pointer"
                on:click={(e) => e.preventDefault()}
              >
                <span class="text-gray-700 dark:text-zinc-300">News Flow</span>
                <div class="relative ml-4 flex items-center">
                  <input
                    type="checkbox"
                    class="sr-only peer"
                    checked={showNewsFlow}
                    on:change={() => {
                      showNewsFlow = !showNewsFlow;
                      saveEventSettings();
                      if (showNewsFlow && !isNonIntradayRange(activeRange)) {
                        setRange("1D");
                        setTimeout(() => setRange("1D"), 150);
                      } else {
                        updateAllOverlays();
                      }
                    }}
                  />
                  <div
                    class="w-9 h-5 bg-gray-200 dark:bg-zinc-700 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 dark:border-zinc-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"
                  ></div>
                </div>
              </DropdownMenu.Item>
            {/if}
          </DropdownMenu.Group>
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      <!-- Drawing Tools -->
      <label
        for="mobileToolsModal"
        class="flex flex-col items-center justify-center gap-0.5 p-2 min-w-[56px] text-gray-600 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-200 transition cursor-pointer"
      >
        <svg
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
        <span class="text-[10px] font-medium">Tools</span>
      </label>
    </div>
  </div>
{/if}

<!-- Mobile Drawing Tools Modal -->
<input type="checkbox" id="mobileToolsModal" class="modal-toggle" />
<dialog id="mobileToolsModal" class="modal modal-bottom">
  <label
    for="mobileToolsModal"
    class="cursor-pointer modal-backdrop bg-black/30"
  ></label>
  <div
    class="modal-box rounded-t-2xl border-t border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-0 w-full max-h-[70vh]"
  >
    <!-- Handle bar -->
    <div class="flex justify-center py-2">
      <div class="w-10 h-1 bg-gray-200 dark:bg-zinc-700 rounded-full"></div>
    </div>

    <!-- Header -->
    <div
      class="flex items-center justify-between px-4 pb-3 border-b border-gray-300 dark:border-zinc-700"
    >
      <h3 class="text-base font-semibold text-gray-900 dark:text-white">
        Drawing Tools
      </h3>
      <div class="flex items-center gap-2">
        <!-- Lock/Unlock -->
        <button
          class={`p-2 rounded-lg transition ${drawingsLocked ? "text-amber-400 bg-amber-400/10" : "text-gray-600 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-200 hover:bg-gray-100/60 dark:hover:bg-zinc-800"}`}
          on:click={toggleDrawingsLock}
          title={drawingsLocked ? "Unlock drawings" : "Lock drawings"}
        >
          <svg class="h-5 w-5" viewBox="0 0 22 22" fill="currentColor">
            <path d={drawingsLocked ? toolIcons.lock : toolIcons.unlock} />
          </svg>
        </button>
        <!-- Show/Hide -->
        <button
          class={`p-2 rounded-lg transition ${!drawingsVisible ? "text-gray-500 dark:text-zinc-400" : "text-gray-600 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-200 hover:bg-gray-100/60 dark:hover:bg-zinc-800"}`}
          on:click={toggleDrawingsVisibility}
          title={drawingsVisible ? "Hide drawings" : "Show drawings"}
        >
          <svg class="h-5 w-5" viewBox="0 0 22 22" fill="currentColor">
            <path
              d={drawingsVisible ? toolIcons.visible : toolIcons.invisible}
            />
          </svg>
        </button>
        <!-- Delete All -->
        <button
          class="p-2 rounded-lg text-gray-600 dark:text-zinc-400 hover:text-rose-400 hover:bg-rose-400/10 transition"
          on:click={removeAllDrawings}
          title="Delete all drawings"
        >
          <Trash2 class="h-5 w-5" />
        </button>
      </div>
    </div>

    <!-- Tools Grid -->
    <div class="p-4 space-y-4 overflow-y-auto max-h-[50vh]">
      {#each toolGroups as group}
        <div>
          <h4
            class="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-2"
          >
            {group.label}
          </h4>
          <div class="grid grid-cols-2 gap-2">
            {#each group.options as option}
              <label
                for="mobileToolsModal"
                class={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${
                  selectedToolByGroup[group.id] === option.id
                    ? "border-violet-500 bg-violet-500/10 text-violet-300"
                    : "border-gray-300 dark:border-zinc-700 bg-gray-100/50 dark:bg-zinc-900/50 text-gray-700 dark:text-zinc-300 hover:border-gray-300 dark:border-zinc-700 hover:bg-gray-100/60 dark:hover:bg-zinc-800/50"
                } ${drawingsLocked ? "opacity-50 pointer-events-none" : ""}`}
                on:click={() =>
                  activateDrawingTool(group.id, option.id, option.overlay)}
              >
                <svg
                  class="h-5 w-5 flex-shrink-0"
                  viewBox="0 0 22 22"
                  fill="currentColor"
                >
                  <path
                    d={toolIcons[option.icon] ||
                      toolIcons.horizontalStraightLine}
                  />
                </svg>
                <span class="text-sm truncate">{option.label}</span>
              </label>
            {/each}
          </div>
        </div>
      {/each}
    </div>

    <!-- Cursor Mode Button -->
    <div class="p-4 pt-0">
      <label
        for="mobileToolsModal"
        class="flex items-center justify-center gap-2 w-full p-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800/50 text-gray-700 dark:text-zinc-200 hover:bg-gray-100/60 dark:hover:bg-zinc-800 transition cursor-pointer"
        on:click={() => {
          activeTool = null;
          chart?.removeOverlay();
        }}
      >
        <MousePointer2 class="h-5 w-5" />
        <span class="text-sm font-medium">Cursor Mode</span>
      </label>
    </div>
  </div>
</dialog>

<input type="checkbox" id="indicatorModal" class="modal-toggle" />

<dialog class="modal modal-bottom sm:modal-middle p-0 sm:p-2 lg:p-0">
  <label
    for="indicatorModal"
    on:click={closeIndicatorModal}
    class="cursor-pointer modal-backdrop"
  ></label>
  <div
    class="modal-box relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white z-20 mx-0 sm:mx-2 min-h-[50vh] h-[85dvh] sm:h-[800px] sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl border border-gray-300 dark:border-zinc-700 bp:mx-3 sm:mx-4 w-full max-w-6xl overflow-hidden shadow-2xl"
  >
    <div class="relative flex flex-col w-full h-full">
      <div
        class="sticky top-0 z-40 bg-white dark:bg-zinc-900 pb-6 pt-5 border-b border-gray-300 dark:border-zinc-700"
      >
        <div class="flex flex-row items-center justify-between mb-2">
          <h2
            class="text-[1rem] sm:text-xl font-semibold text-gray-900 dark:text-white"
          >
            Indicators
          </h2>
          <label
            for="indicatorModal"
            class="inline-block cursor-pointer absolute right-0 top-3 text-[1.3rem] sm:text-[1.8rem] text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition"
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
          class="w-full h-10"
          on:keydown={(e) => (e?.key === "Enter" ? e.preventDefault() : "")}
        >
          <label for="indicator-search" class="sr-only">Search</label>
          <div class="relative w-full max-w-md">
            <div
              class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none"
            >
              <svg
                class="w-4 h-4 text-gray-500 dark:text-zinc-400"
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
                class="cursor-pointer text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-200 transition"
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
              class="focus:outline-none placeholder:text-gray-500 dark:text-zinc-400 block w-full p-2.5 ps-10 text-sm border border-gray-300 dark:border-zinc-700 rounded-full bg-gray-100 dark:bg-zinc-800"
              placeholder="Search"
              bind:value={indicatorSearchTerm}
            />
          </div>
        </form>
      </div>

      <div class="flex flex-1 gap-6 pt-6 overflow-hidden min-h-0">
        <aside
          class="hidden md:flex w-48 flex-col gap-2 pr-4 border-r border-gray-300 dark:border-zinc-700"
        >
          <div
            class="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400"
          >
            Personal
          </div>
          <button
            type="button"
            class="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition {indicatorModalSection ===
            'Selected'
              ? 'bg-violet-100 dark:bg-zinc-800 text-violet-700 dark:text-white'
              : 'text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-white hover:bg-gray-100/60 dark:hover:bg-zinc-800/60'}"
            on:click={() => (indicatorModalSection = "Selected")}
          >
            <svg
              class="w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Selected
          </button>
          <button
            type="button"
            class="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition {indicatorModalSection ===
            'Favorites'
              ? 'bg-violet-100 dark:bg-zinc-800 text-violet-700 dark:text-white'
              : 'text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-white hover:bg-gray-100/60 dark:hover:bg-zinc-800/60'}"
            on:click={() => (indicatorModalSection = "Favorites")}
          >
            <svg
              class="w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
            >
              <path fill="currentColor" d={indicatorStarPath} />
            </svg>
            Favorites
          </button>

          <div
            class="mt-3 text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400"
          >
            Built-in
          </div>
          <button
            type="button"
            class="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition {indicatorModalSection ===
            'Technicals'
              ? 'bg-violet-100 dark:bg-zinc-800 text-violet-700 dark:text-white'
              : 'text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-white hover:bg-gray-100/60 dark:hover:bg-zinc-800/60'}"
            on:click={() => (indicatorModalSection = "Technicals")}
          >
            <svg
              class="w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 19h16" />
              <path d="M7 17V10" />
              <path d="M12 17V7" />
              <path d="M17 17V13" />
            </svg>
            Technicals
          </button>
          <button
            type="button"
            class="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition {indicatorModalSection ===
            'Fundamentals'
              ? 'bg-violet-100 dark:bg-zinc-800 text-violet-700 dark:text-white'
              : 'text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-white hover:bg-gray-100/60 dark:hover:bg-zinc-800/60'}"
            on:click={() => (indicatorModalSection = "Fundamentals")}
          >
            <svg
              class="w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M5 19h14" />
              <path d="M7 17V9" />
              <path d="M12 17V5" />
              <path d="M17 17V12" />
            </svg>
            Fundamentals
          </button>
          <button
            type="button"
            class="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition {indicatorModalSection ===
            'Options'
              ? 'bg-violet-100 dark:bg-zinc-800 text-violet-700 dark:text-white'
              : 'text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-white hover:bg-gray-100/60 dark:hover:bg-zinc-800/60'}"
            on:click={() => (indicatorModalSection = "Options")}
          >
            <svg
              class="w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="8" />
              <path d="M12 8v5l3 2" />
            </svg>
            Options
          </button>
          <button
            type="button"
            class="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition {indicatorModalSection ===
            'Statistics'
              ? 'bg-violet-100 dark:bg-zinc-800 text-violet-700 dark:text-white'
              : 'text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-white hover:bg-gray-100/60 dark:hover:bg-zinc-800/60'}"
            on:click={() => (indicatorModalSection = "Statistics")}
          >
            <svg
              class="w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 3v18h18" />
              <path d="M18 17V9" />
              <path d="M13 17V5" />
              <path d="M8 17v-3" />
            </svg>
            Statistics
          </button>
        </aside>

        <div class="flex-1 min-w-0 overflow-y-auto pr-2">
          <div class="md:hidden flex flex-wrap gap-2 mb-4">
            {#each INDICATOR_MODAL_SECTIONS as section}
              <button
                type="button"
                class="cursor-pointer px-3 py-1.5 rounded-full text-sm border transition {indicatorModalSection ===
                section
                  ? 'border-violet-500 dark:border-violet-400 text-violet-700 bg-violet-100 dark:text-white dark:bg-zinc-800'
                  : 'border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-violet-500 dark:hover:border-violet-400 hover:text-violet-600 dark:hover:text-white'}"
                on:click={() => (indicatorModalSection = section)}
              >
                {section}
              </button>
            {/each}
          </div>

          {#if filteredIndicators.length === 0}
            <div
              class="mt-5 font-semibold text-[1rem] sm:text-lg text-gray-700 dark:text-zinc-200"
            >
              Nothing found
            </div>
          {:else if isSearchActive}
            {#if technicalGroups.length}
              <div
                class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
              >
                Technicals
              </div>
              {#each technicalGroups as [category, indicators]}
                <div class="mt-4">
                  <div
                    class="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400/80"
                  >
                    {category}
                  </div>
                  <div class="mt-2 space-y-1">
                    {#each indicators as indicator}
                      <div
                        class="group flex w-full items-center rounded-md px-2 py-1.5 hover:bg-gray-100/60 dark:hover:bg-zinc-800/60"
                      >
                        <button
                          type="button"
                          class={getFavoriteStarClass(
                            indicatorFavorites.includes(indicator.id),
                          ) + " mr-2"}
                          aria-label={isIndicatorFavorite(indicator.id)
                            ? "Remove from favorites"
                            : "Add to favorites"}
                          on:click|stopPropagation={(event) =>
                            toggleIndicatorFavorite(event, indicator.id)}
                        >
                          <svg
                            class="w-5 h-5 sm:w-4 sm:h-4"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 16 16"
                          >
                            <path fill="currentColor" d={indicatorStarPath} />
                          </svg>
                        </button>
                        <input
                          on:click={() => toggleIndicatorById(indicator.id)}
                          id={indicator.id}
                          type="checkbox"
                          checked={Boolean(indicatorState[indicator.id])}
                          class="h-[18px] w-[18px] rounded-sm ring-offset-0 border border-gray-300 dark:border-zinc-700 bg-gray-200 dark:bg-zinc-900 lg:h-4 lg:w-4"
                        />
                        <label
                          for={indicator.id}
                          class="cursor-pointer text-sm sm:text-[1rem] ml-2"
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
                    {/each}
                  </div>
                </div>
              {/each}
            {/if}

            {#if optionsIndicators.length > 0}
              <div
                class="mt-6 text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
              >
                Options
              </div>
              <div class="mt-2 space-y-1">
                {#each optionsIndicators as indicator}
                  <div
                    class="group flex w-full items-center rounded-md px-2 py-1.5 hover:bg-gray-100/60 dark:hover:bg-zinc-800/60"
                  >
                    {#if isSubscribed}
                      <button
                        type="button"
                        class={getFavoriteStarClass(
                          indicatorFavorites.includes(indicator.id),
                        ) + " mr-2"}
                        aria-label={isIndicatorFavorite(indicator.id)
                          ? "Remove from favorites"
                          : "Add to favorites"}
                        on:click|stopPropagation={(event) =>
                          toggleIndicatorFavorite(event, indicator.id)}
                      >
                        <svg
                          class="w-5 h-5 sm:w-4 sm:h-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                        >
                          <path fill="currentColor" d={indicatorStarPath} />
                        </svg>
                      </button>
                      <input
                        on:click={() => toggleIndicatorById(indicator.id)}
                        id={indicator.id}
                        type="checkbox"
                        checked={Boolean(indicatorState[indicator.id])}
                        class="h-[18px] w-[18px] rounded-sm ring-offset-0 border border-gray-300 dark:border-zinc-700 bg-gray-200 dark:bg-zinc-900 lg:h-4 lg:w-4"
                      />
                      <label
                        for={indicator.id}
                        class="cursor-pointer text-sm sm:text-[1rem] ml-2"
                      >
                        {indicator.label}
                      </label>
                      <InfoModal
                        id={`indicator-${indicator.id}`}
                        title={indicator.label}
                        callAPI={true}
                        parameter={indicator.infoKey || indicator.id}
                      />
                    {:else}
                      <button
                        type="button"
                        class={getFavoriteStarClass(
                          indicatorFavorites.includes(indicator.id),
                        ) + " mr-2"}
                        aria-label={isIndicatorFavorite(indicator.id)
                          ? "Remove from favorites"
                          : "Add to favorites"}
                        on:click|stopPropagation={(event) =>
                          toggleIndicatorFavorite(event, indicator.id)}
                      >
                        <svg
                          class="w-5 h-5 sm:w-4 sm:h-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                        >
                          <path fill="currentColor" d={indicatorStarPath} />
                        </svg>
                      </button>
                      <button
                        on:click={() => goto("/pricing")}
                        class="flex items-center cursor-pointer text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors"
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
                        <span class="text-sm sm:text-[1rem]"
                          >{indicator.label}</span
                        >
                      </button>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}

            {#if statisticsIndicators.length > 0}
              <div
                class="mt-6 text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
              >
                Statistics
              </div>
              <div class="mt-2 space-y-1">
                {#each statisticsIndicators as indicator}
                  <div
                    class="group flex w-full items-center rounded-md px-2 py-1.5 hover:bg-gray-100/60 dark:hover:bg-zinc-800/60"
                  >
                    {#if isSubscribed}
                      <button
                        type="button"
                        class={getFavoriteStarClass(
                          indicatorFavorites.includes(indicator.id),
                        ) + " mr-2"}
                        aria-label={isIndicatorFavorite(indicator.id)
                          ? "Remove from favorites"
                          : "Add to favorites"}
                        on:click|stopPropagation={(event) =>
                          toggleIndicatorFavorite(event, indicator.id)}
                      >
                        <svg
                          class="w-5 h-5 sm:w-4 sm:h-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                        >
                          <path fill="currentColor" d={indicatorStarPath} />
                        </svg>
                      </button>
                      <input
                        on:click={() => toggleIndicatorById(indicator.id)}
                        id={indicator.id}
                        type="checkbox"
                        checked={Boolean(indicatorState[indicator.id])}
                        class="h-[18px] w-[18px] rounded-sm ring-offset-0 border border-gray-300 dark:border-zinc-700 bg-gray-200 dark:bg-zinc-900 lg:h-4 lg:w-4"
                      />
                      <label
                        for={indicator.id}
                        class="cursor-pointer text-sm sm:text-[1rem] ml-2"
                      >
                        {indicator.label}
                      </label>
                      <InfoModal
                        id={`indicator-${indicator.id}`}
                        title={indicator.label}
                        callAPI={true}
                        parameter={indicator.infoKey || indicator.id}
                      />
                    {:else}
                      <button
                        type="button"
                        class={getFavoriteStarClass(
                          indicatorFavorites.includes(indicator.id),
                        ) + " mr-2"}
                        aria-label={isIndicatorFavorite(indicator.id)
                          ? "Remove from favorites"
                          : "Add to favorites"}
                        on:click|stopPropagation={(event) =>
                          toggleIndicatorFavorite(event, indicator.id)}
                      >
                        <svg
                          class="w-5 h-5 sm:w-4 sm:h-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                        >
                          <path fill="currentColor" d={indicatorStarPath} />
                        </svg>
                      </button>
                      <button
                        on:click={() => goto("/pricing")}
                        class="flex items-center cursor-pointer text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors"
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
                        <span class="text-sm sm:text-[1rem]"
                          >{indicator.label}</span
                        >
                      </button>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}

            {#if groupedIndicators["Fundamentals"]}
              <div
                class="mt-6 text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
              >
                Fundamentals
              </div>
              <div class="mt-2 flex flex-wrap gap-2">
                {#each FUNDAMENTAL_TABS as tab}
                  <button
                    type="button"
                    class="cursor-pointer px-3 py-1.5 rounded-full text-xs border transition {fundamentalsTab ===
                    tab.id
                      ? 'border-violet-500 dark:border-violet-400 text-violet-700 bg-violet-100 dark:text-white dark:bg-zinc-800'
                      : 'border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-violet-500 dark:hover:border-violet-400 hover:text-violet-600 dark:hover:text-white'}"
                    on:click={() => (fundamentalsTab = tab.id)}
                  >
                    {tab.label}
                  </button>
                {/each}
              </div>
              {#if fundamentalsIndicators.length === 0}
                <div class="mt-4 text-sm text-gray-500 dark:text-zinc-400">
                  No indicators available for this section yet.
                </div>
              {/if}
              <div class="mt-4 space-y-2 sm:space-y-1">
                {#each fundamentalsIndicators as indicator}
                  <div
                    class="group rounded-md px-2 py-2 sm:py-1.5 hover:bg-gray-100/60 dark:hover:bg-zinc-800/60"
                  >
                    {#if isSubscribed}
                      <div class="flex items-center w-full">
                        <button
                          type="button"
                          class={getFavoriteStarClass(
                            indicatorFavorites.includes(indicator.id),
                          ) + " mr-2"}
                          aria-label={isIndicatorFavorite(indicator.id)
                            ? "Remove from favorites"
                            : "Add to favorites"}
                          on:click|stopPropagation={(event) =>
                            toggleIndicatorFavorite(event, indicator.id)}
                        >
                          <svg
                            class="w-5 h-5 sm:w-4 sm:h-4"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 16 16"
                          >
                            <path fill="currentColor" d={indicatorStarPath} />
                          </svg>
                        </button>
                        <input
                          on:click={() => toggleIndicatorById(indicator.id)}
                          id={indicator.id}
                          type="checkbox"
                          checked={Boolean(indicatorState[indicator.id])}
                          class="h-[18px] w-[18px] shrink-0 rounded-sm ring-offset-0 border border-gray-300 dark:border-zinc-700 bg-gray-200 dark:bg-zinc-900 lg:h-4 lg:w-4"
                        />
                        <label
                          for={indicator.id}
                          class="cursor-pointer text-sm sm:text-[1rem] ml-2"
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
                      {#if STATEMENT_INDICATOR_BY_ID[indicator.id]}
                        <div
                          class="flex items-center gap-1.5 sm:gap-1 mt-2 sm:mt-0 sm:float-right sm:-mt-7 pl-9 sm:pl-0"
                        >
                          {#key `${periodKey}-${indicator.id}`}
                            {#each FINANCIAL_PERIOD_OPTIONS as option}
                              <button
                                type="button"
                                class="cursor-pointer px-2.5 sm:px-2 py-1 sm:py-0.5 text-xs sm:text-[11px] rounded border transition cursor-pointer {getFinancialIndicatorPeriod(
                                  indicator.id,
                                ) === option.id
                                  ? 'border-violet-500 dark:border-violet-400 text-violet-700 bg-violet-100 dark:text-white dark:bg-zinc-800'
                                  : 'border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-violet-500 dark:hover:border-violet-400 hover:text-violet-600 dark:hover:text-white'}"
                                on:click|stopPropagation={() =>
                                  setFinancialIndicatorPeriod(
                                    indicator.id,
                                    option.id,
                                  )}
                              >
                                {option.label}
                              </button>
                            {/each}
                          {/key}
                        </div>
                      {/if}
                    {:else}
                      <button
                        type="button"
                        class={getFavoriteStarClass(
                          indicatorFavorites.includes(indicator.id),
                        ) + " mr-2"}
                        aria-label={isIndicatorFavorite(indicator.id)
                          ? "Remove from favorites"
                          : "Add to favorites"}
                        on:click|stopPropagation={(event) =>
                          toggleIndicatorFavorite(event, indicator.id)}
                      >
                        <svg
                          class="w-5 h-5 sm:w-4 sm:h-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                        >
                          <path fill="currentColor" d={indicatorStarPath} />
                        </svg>
                      </button>
                      <button
                        on:click={() => goto("/pricing")}
                        class="flex items-center cursor-pointer text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors"
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
                        <span class="text-sm sm:text-[1rem]"
                          >{indicator.label}</span
                        >
                      </button>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          {:else if indicatorModalSection === "Selected"}
            <div class="flex items-center justify-between">
              <div
                class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
              >
                Selected Indicators
              </div>
              {#if selectedIndicators.length > 0}
                <button
                  type="button"
                  class="cursor-pointer flex items-center gap-1 px-2 py-1 text-xs rounded border border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-violet-500 dark:hover:border-violet-400 hover:text-violet-600 dark:hover:text-white transition cursor-pointer"
                  on:click={clearIndicators}
                >
                  <svg
                    class="h-3 w-3"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 21 21"
                  >
                    <g
                      fill="none"
                      fill-rule="evenodd"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M3.578 6.487A8 8 0 1 1 2.5 10.5" />
                      <path d="M7.5 6.5h-4v-4" />
                    </g>
                  </svg>
                  Reset All
                </button>
              {/if}
            </div>
            {#if selectedIndicators.length === 0}
              <div class="mt-4 text-sm text-gray-500 dark:text-zinc-400">
                No indicators selected.
              </div>
            {:else}
              <div class="mt-4 space-y-2 sm:space-y-1">
                {#each selectedIndicators as indicator}
                  <div
                    class="group rounded-md px-2 py-2 sm:py-1.5 hover:bg-gray-100/60 dark:hover:bg-zinc-800/60"
                  >
                    <div
                      class="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2 sm:gap-0"
                    >
                      <div class="flex items-center">
                        <button
                          type="button"
                          class={getFavoriteStarClass(
                            indicatorFavorites.includes(indicator.id),
                          ) + " mr-2"}
                          aria-label={isIndicatorFavorite(indicator.id)
                            ? "Remove from favorites"
                            : "Add to favorites"}
                          on:click|stopPropagation={(event) =>
                            toggleIndicatorFavorite(event, indicator.id)}
                        >
                          <svg
                            class="w-5 h-5 sm:w-4 sm:h-4"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 16 16"
                          >
                            <path fill="currentColor" d={indicatorStarPath} />
                          </svg>
                        </button>
                        <input
                          on:click={() => toggleIndicatorById(indicator.id)}
                          id={`selected-${indicator.id}`}
                          type="checkbox"
                          checked={Boolean(indicatorState[indicator.id])}
                          class="h-[18px] w-[18px] shrink-0 rounded-sm ring-offset-0 border border-gray-300 dark:border-zinc-700 bg-gray-200 dark:bg-zinc-900 lg:h-4 lg:w-4"
                        />
                        <label
                          for={`selected-${indicator.id}`}
                          class="cursor-pointer text-sm sm:text-[1rem] ml-2"
                        >
                          {indicator.label}
                        </label>
                        <InfoModal
                          id={`indicator-selected-${indicator.id}`}
                          title={indicator.label}
                          callAPI={true}
                          parameter={indicator.infoKey || indicator.id}
                        />
                      </div>
                      {#if STATEMENT_INDICATOR_BY_ID[indicator.id]}
                        <div
                          class="flex items-center gap-1.5 sm:gap-1 pl-9 sm:pl-0"
                        >
                          {#key `${periodKey}-${indicator.id}`}
                            {#each FINANCIAL_PERIOD_OPTIONS as option}
                              <button
                                type="button"
                                class="px-2.5 sm:px-2 py-1 sm:py-0.5 text-xs sm:text-[11px] rounded border transition cursor-pointer {getFinancialIndicatorPeriod(
                                  indicator.id,
                                ) === option.id
                                  ? 'border-violet-500 dark:border-violet-400 text-violet-700 bg-violet-100 dark:text-white dark:bg-zinc-800'
                                  : 'border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-violet-500 dark:hover:border-violet-400 hover:text-violet-600 dark:hover:text-white'}"
                                on:click|stopPropagation={() =>
                                  setFinancialIndicatorPeriod(
                                    indicator.id,
                                    option.id,
                                  )}
                              >
                                {option.label}
                              </button>
                            {/each}
                          {/key}
                        </div>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          {:else if indicatorModalSection === "Favorites"}
            <div
              class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
            >
              My Indicators
            </div>
            {#if favoriteIndicators.length === 0}
              <div class="mt-4 text-sm text-gray-500 dark:text-zinc-400">
                No favorites yet.
              </div>
            {:else}
              <div class="mt-4 space-y-2 sm:space-y-1">
                {#each favoriteIndicators as indicator}
                  <div
                    class="group rounded-md px-2 py-2 sm:py-1.5 hover:bg-gray-100/60 dark:hover:bg-zinc-800/60"
                  >
                    <div
                      class="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2 sm:gap-0"
                    >
                      <div class="flex items-center">
                        <button
                          type="button"
                          class="shrink-0 transition cursor-pointer text-amber-400 hover:text-amber-300 mr-2 p-1.5 -m-1 rounded-lg active:bg-gray-200 dark:active:bg-zinc-700"
                          aria-label="Remove from favorites"
                          on:click|stopPropagation={(event) =>
                            toggleIndicatorFavorite(event, indicator.id)}
                        >
                          <svg
                            class="w-5 h-5 sm:w-4 sm:h-4"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 16 16"
                          >
                            <path fill="currentColor" d={indicatorStarPath} />
                          </svg>
                        </button>
                        {#if isSubscribed}
                          <input
                            on:click={() => toggleIndicatorById(indicator.id)}
                            id={`favorite-${indicator.id}`}
                            type="checkbox"
                            checked={Boolean(indicatorState[indicator.id])}
                            class="h-[18px] w-[18px] shrink-0 rounded-sm ring-offset-0 border border-gray-300 dark:border-zinc-700 bg-gray-200 dark:bg-zinc-900 lg:h-4 lg:w-4"
                          />
                          <label
                            for={`favorite-${indicator.id}`}
                            class="cursor-pointer text-sm sm:text-[1rem] ml-2"
                          >
                            {indicator.label}
                          </label>
                          <InfoModal
                            id={`indicator-favorite-${indicator.id}`}
                            title={indicator.label}
                            callAPI={true}
                            parameter={indicator.infoKey || indicator.id}
                          />
                        {:else}
                          <button
                            on:click={() => goto("/pricing")}
                            class="flex items-center cursor-pointer text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors"
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
                            <span class="text-sm sm:text-[1rem]"
                              >{indicator.label}</span
                            >
                          </button>
                        {/if}
                      </div>
                      {#if indicator.id === "revenue" || STATEMENT_INDICATOR_BY_ID[indicator.id]}
                        <div
                          class="flex items-center gap-1.5 sm:gap-1 pl-9 sm:pl-0"
                        >
                          {#key `${periodKey}-${indicator.id}`}
                            {#each FINANCIAL_PERIOD_OPTIONS as option}
                              <button
                                type="button"
                                class="px-2.5 sm:px-2 py-1 sm:py-0.5 text-xs sm:text-[11px] rounded border transition cursor-pointer {getFinancialIndicatorPeriod(
                                  indicator.id,
                                ) === option.id
                                  ? 'border-violet-500 dark:border-violet-400 text-violet-700 bg-violet-100 dark:text-white dark:bg-zinc-800'
                                  : 'border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-violet-500 dark:hover:border-violet-400 hover:text-violet-600 dark:hover:text-white'}"
                                on:click|stopPropagation={() =>
                                  setFinancialIndicatorPeriod(
                                    indicator.id,
                                    option.id,
                                  )}
                              >
                                {option.label}
                              </button>
                            {/each}
                          {/key}
                        </div>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          {:else if indicatorModalSection === "Fundamentals"}
            {#if groupedIndicators["Fundamentals"]}
              <div
                class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
              >
                Fundamentals
              </div>
              <div class="mt-2 flex flex-wrap gap-2">
                {#each FUNDAMENTAL_TABS as tab}
                  <button
                    type="button"
                    class="px-3 py-1.5 rounded-full text-xs border transition {fundamentalsTab ===
                    tab.id
                      ? 'border-violet-500 dark:border-violet-400 text-violet-700 bg-violet-100 dark:text-white dark:bg-zinc-800'
                      : 'border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-violet-500 dark:hover:border-violet-400 hover:text-violet-600 dark:hover:text-white'}"
                    on:click={() => (fundamentalsTab = tab.id)}
                  >
                    {tab.label}
                  </button>
                {/each}
              </div>
              {#if fundamentalsIndicators.length === 0}
                <div class="mt-4 text-sm text-gray-500 dark:text-zinc-400">
                  No indicators available for this section yet.
                </div>
              {/if}
              <div class="mt-4 space-y-2 sm:space-y-1">
                {#each fundamentalsIndicators as indicator}
                  <div
                    class="group rounded-md px-2 py-2 sm:py-1.5 hover:bg-gray-100/60 dark:hover:bg-zinc-800/60"
                  >
                    {#if isSubscribed}
                      <div
                        class="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2 sm:gap-0"
                      >
                        <div class="flex items-center">
                          <button
                            type="button"
                            class={getFavoriteStarClass(
                              indicatorFavorites.includes(indicator.id),
                            ) + " mr-2"}
                            aria-label={isIndicatorFavorite(indicator.id)
                              ? "Remove from favorites"
                              : "Add to favorites"}
                            on:click|stopPropagation={(event) =>
                              toggleIndicatorFavorite(event, indicator.id)}
                          >
                            <svg
                              class="w-5 h-5 sm:w-4 sm:h-4"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 16 16"
                            >
                              <path fill="currentColor" d={indicatorStarPath} />
                            </svg>
                          </button>
                          <input
                            on:click={() => toggleIndicatorById(indicator.id)}
                            id={indicator.id}
                            type="checkbox"
                            checked={Boolean(indicatorState[indicator.id])}
                            class="h-[18px] w-[18px] shrink-0 rounded-sm ring-offset-0 border border-gray-300 dark:border-zinc-700 bg-gray-200 dark:bg-zinc-900 lg:h-4 lg:w-4"
                          />
                          <label
                            for={indicator.id}
                            class="cursor-pointer text-sm sm:text-[1rem] ml-2"
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
                        {#if indicator.id === "revenue" || STATEMENT_INDICATOR_BY_ID[indicator.id]}
                          <div
                            class="flex items-center gap-1.5 sm:gap-1 pl-9 sm:pl-0"
                          >
                            {#key `${periodKey}-${indicator.id}`}
                              {#each FINANCIAL_PERIOD_OPTIONS as option}
                                <button
                                  type="button"
                                  class="px-2.5 sm:px-2 py-1 sm:py-0.5 text-xs sm:text-[11px] rounded border transition cursor-pointer {getFinancialIndicatorPeriod(
                                    indicator.id,
                                  ) === option.id
                                    ? 'border-violet-500 dark:border-violet-400 text-violet-700 bg-violet-100 dark:text-white dark:bg-zinc-800'
                                    : 'border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-violet-500 dark:hover:border-violet-400 hover:text-violet-600 dark:hover:text-white'}"
                                  on:click|stopPropagation={() =>
                                    setFinancialIndicatorPeriod(
                                      indicator.id,
                                      option.id,
                                    )}
                                >
                                  {option.label}
                                </button>
                              {/each}
                            {/key}
                          </div>
                        {/if}
                      </div>
                    {:else}
                      <div
                        class="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2 sm:gap-0"
                      >
                        <div class="flex items-center">
                          <button
                            type="button"
                            class={getFavoriteStarClass(
                              indicatorFavorites.includes(indicator.id),
                            ) + " mr-2"}
                            aria-label={isIndicatorFavorite(indicator.id)
                              ? "Remove from favorites"
                              : "Add to favorites"}
                            on:click|stopPropagation={(event) =>
                              toggleIndicatorFavorite(event, indicator.id)}
                          >
                            <svg
                              class="w-5 h-5 sm:w-4 sm:h-4"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 16 16"
                            >
                              <path fill="currentColor" d={indicatorStarPath} />
                            </svg>
                          </button>
                          <button
                            on:click={() => goto("/pricing")}
                            class="flex items-center cursor-pointer text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors"
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
                            <span class="text-sm sm:text-[1rem]"
                              >{indicator.label}</span
                            >
                          </button>
                        </div>
                        {#if indicator.id === "revenue" || STATEMENT_INDICATOR_BY_ID[indicator.id]}
                          <div
                            class="flex items-center gap-1.5 sm:gap-1 pl-9 sm:pl-0"
                          >
                            {#key `${periodKey}-${indicator.id}`}
                              {#each FINANCIAL_PERIOD_OPTIONS as option}
                                <button
                                  type="button"
                                  class="px-2.5 sm:px-2 py-1 sm:py-0.5 text-xs sm:text-[11px] rounded border transition cursor-pointer {getFinancialIndicatorPeriod(
                                    indicator.id,
                                  ) === option.id
                                    ? 'border-violet-500 dark:border-violet-400 text-violet-700 bg-violet-100 dark:text-white dark:bg-zinc-800'
                                    : 'border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-violet-500 dark:hover:border-violet-400 hover:text-violet-600 dark:hover:text-white'}"
                                  on:click|stopPropagation={() =>
                                    setFinancialIndicatorPeriod(
                                      indicator.id,
                                      option.id,
                                    )}
                                >
                                  {option.label}
                                </button>
                              {/each}
                            {/key}
                          </div>
                        {/if}
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          {:else if indicatorModalSection === "Options"}
            {#if optionsIndicators.length > 0}
              <div
                class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
              >
                Options
              </div>
              <div class="mt-2 space-y-1">
                {#each optionsIndicators as indicator}
                  <div
                    class="group flex w-full items-center rounded-md px-2 py-1.5 hover:bg-gray-100/60 dark:hover:bg-zinc-800/60"
                  >
                    {#if isSubscribed}
                      <button
                        type="button"
                        class={getFavoriteStarClass(
                          indicatorFavorites.includes(indicator.id),
                        ) + " mr-2"}
                        aria-label={isIndicatorFavorite(indicator.id)
                          ? "Remove from favorites"
                          : "Add to favorites"}
                        on:click|stopPropagation={(event) =>
                          toggleIndicatorFavorite(event, indicator.id)}
                      >
                        <svg
                          class="w-5 h-5 sm:w-4 sm:h-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                        >
                          <path fill="currentColor" d={indicatorStarPath} />
                        </svg>
                      </button>
                      <input
                        on:click={() => toggleIndicatorById(indicator.id)}
                        id={indicator.id}
                        type="checkbox"
                        checked={Boolean(indicatorState[indicator.id])}
                        class="h-[18px] w-[18px] rounded-sm ring-offset-0 border border-gray-300 dark:border-zinc-700 bg-gray-200 dark:bg-zinc-900 lg:h-4 lg:w-4"
                      />
                      <label
                        for={indicator.id}
                        class="cursor-pointer text-sm sm:text-[1rem] ml-2"
                      >
                        {indicator.label}
                      </label>
                      <InfoModal
                        id={`indicator-${indicator.id}`}
                        title={indicator.label}
                        callAPI={true}
                        parameter={indicator.infoKey || indicator.id}
                      />
                    {:else}
                      <button
                        type="button"
                        class={getFavoriteStarClass(
                          indicatorFavorites.includes(indicator.id),
                        ) + " mr-2"}
                        aria-label={isIndicatorFavorite(indicator.id)
                          ? "Remove from favorites"
                          : "Add to favorites"}
                        on:click|stopPropagation={(event) =>
                          toggleIndicatorFavorite(event, indicator.id)}
                      >
                        <svg
                          class="w-5 h-5 sm:w-4 sm:h-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                        >
                          <path fill="currentColor" d={indicatorStarPath} />
                        </svg>
                      </button>
                      <button
                        on:click={() => goto("/pricing")}
                        class="flex items-center cursor-pointer text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors"
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
                        <span class="text-sm sm:text-[1rem]"
                          >{indicator.label}</span
                        >
                      </button>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          {:else if indicatorModalSection === "Statistics"}
            {#if statisticsIndicators.length > 0}
              <div
                class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
              >
                Statistics
              </div>
              <div class="mt-2 space-y-1">
                {#each statisticsIndicators as indicator}
                  <div
                    class="group flex w-full items-center rounded-md px-2 py-1.5 hover:bg-gray-100/60 dark:hover:bg-zinc-800/60"
                  >
                    {#if isSubscribed}
                      <button
                        type="button"
                        class={getFavoriteStarClass(
                          indicatorFavorites.includes(indicator.id),
                        ) + " mr-2"}
                        aria-label={isIndicatorFavorite(indicator.id)
                          ? "Remove from favorites"
                          : "Add to favorites"}
                        on:click|stopPropagation={(event) =>
                          toggleIndicatorFavorite(event, indicator.id)}
                      >
                        <svg
                          class="w-5 h-5 sm:w-4 sm:h-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                        >
                          <path fill="currentColor" d={indicatorStarPath} />
                        </svg>
                      </button>
                      <input
                        on:click={() => toggleIndicatorById(indicator.id)}
                        id={indicator.id}
                        type="checkbox"
                        checked={Boolean(indicatorState[indicator.id])}
                        class="h-[18px] w-[18px] rounded-sm ring-offset-0 border border-gray-300 dark:border-zinc-700 bg-gray-200 dark:bg-zinc-900 lg:h-4 lg:w-4"
                      />
                      <label
                        for={indicator.id}
                        class="cursor-pointer text-sm sm:text-[1rem] ml-2"
                      >
                        {indicator.label}
                      </label>
                      <InfoModal
                        id={`indicator-${indicator.id}`}
                        title={indicator.label}
                        callAPI={true}
                        parameter={indicator.infoKey || indicator.id}
                      />
                    {:else}
                      <button
                        type="button"
                        class={getFavoriteStarClass(
                          indicatorFavorites.includes(indicator.id),
                        ) + " mr-2"}
                        aria-label={isIndicatorFavorite(indicator.id)
                          ? "Remove from favorites"
                          : "Add to favorites"}
                        on:click|stopPropagation={(event) =>
                          toggleIndicatorFavorite(event, indicator.id)}
                      >
                        <svg
                          class="w-5 h-5 sm:w-4 sm:h-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                        >
                          <path fill="currentColor" d={indicatorStarPath} />
                        </svg>
                      </button>
                      <button
                        on:click={() => goto("/pricing")}
                        class="flex items-center cursor-pointer text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors"
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
                        <span class="text-sm sm:text-[1rem]"
                          >{indicator.label}</span
                        >
                      </button>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          {:else if technicalGroups.length}
            <div
              class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
            >
              Technicals
            </div>
            {#each technicalGroups as [category, indicators]}
              <div class="mt-4">
                <div
                  class="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400/80"
                >
                  {category}
                </div>
                <div class="mt-2 space-y-1">
                  {#each indicators as indicator}
                    <div
                      class="group flex w-full items-center rounded-md px-2 py-1.5 hover:bg-gray-100/60 dark:hover:bg-zinc-800/60"
                    >
                      <button
                        type="button"
                        class={getFavoriteStarClass(
                          indicatorFavorites.includes(indicator.id),
                        ) + " mr-2"}
                        aria-label={isIndicatorFavorite(indicator.id)
                          ? "Remove from favorites"
                          : "Add to favorites"}
                        on:click|stopPropagation={(event) =>
                          toggleIndicatorFavorite(event, indicator.id)}
                      >
                        <svg
                          class="w-5 h-5 sm:w-4 sm:h-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                        >
                          <path fill="currentColor" d={indicatorStarPath} />
                        </svg>
                      </button>
                      <input
                        on:click={() => toggleIndicatorById(indicator.id)}
                        id={indicator.id}
                        type="checkbox"
                        checked={Boolean(indicatorState[indicator.id])}
                        class="h-[18px] w-[18px] rounded-sm ring-offset-0 border border-gray-300 dark:border-zinc-700 bg-gray-200 dark:bg-zinc-900 lg:h-4 lg:w-4"
                      />
                      <label
                        for={indicator.id}
                        class="cursor-pointer text-sm sm:text-[1rem] ml-2"
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
                  {/each}
                </div>
              </div>
            {/each}
          {/if}
        </div>
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

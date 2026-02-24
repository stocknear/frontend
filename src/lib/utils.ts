import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { cubicOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";
import { getLocale } from "$lib/paraglide/runtime.js";
import {
  time_ago,
  time_day,
  time_days,
  time_hour,
  time_hours,
  time_just_now,
  time_minute,
  time_minutes,
  time_month,
  time_months,
  time_second,
  time_seconds,
  time_week,
  time_weeks,
  time_year,
  time_years,
  common_period_1_day,
  common_period_5_days,
  common_period_1_month,
  common_period_ytd,
  common_period_3_months,
  common_period_6_months,
  common_period_1_year,
  common_period_5_years,
  common_period_max,
  chat_default_gainers_losers_label,
  chat_default_gainers_losers_query,
  chat_default_options_flow_label,
  chat_default_options_flow_query,
  chat_default_market_news_label,
  chat_default_market_news_query,
  chat_default_bull_bear_label,
  chat_default_bull_bear_query,
  chat_default_value_investor_label,
  chat_default_value_investor_query,
  chat_default_cathie_wood_label,
  chat_default_cathie_wood_query,
  chat_default_options_data_label,
  chat_default_options_data_query,
  chat_default_undervalued_label,
  chat_default_undervalued_query,
  chat_default_gamestop_label,
  chat_default_gamestop_query,
  chat_default_spy_bullish_label,
  chat_default_spy_bullish_query,
  chat_default_nvidia_flow_label,
  chat_default_nvidia_flow_query,
  chat_default_googl_flow_label,
  chat_default_googl_flow_query,
  chat_default_compare_aapl_msft_label,
  chat_default_compare_aapl_msft_query,
  chat_default_analyst_ratings_label,
  chat_default_analyst_ratings_query,
  chat_default_dark_pool_label,
  chat_default_dark_pool_query,
  chat_default_dividend_label,
  chat_default_dividend_query,
  chat_default_michael_burry_label,
  chat_default_michael_burry_query,
  chat_default_peter_lynch_label,
  chat_default_peter_lynch_query,
  chat_default_sector_performance_label,
  chat_default_sector_performance_query,
  chat_default_earnings_label,
  chat_default_earnings_query,
} from "$lib/paraglide/messages";

// Helper to get current locale safely (returns "en" as fallback)
function getCurrentLocale(): string {
  try {
    return getLocale() || "en";
  } catch {
    return "en";
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type FlyAndScaleParams = {
  y?: number;
  x?: number;
  start?: number;
  duration?: number;
};

type IdleOptions = { timeout?: number };

export const deferFunction = (
  cb: () => Promise<void> | void,
  timeoutOrOpts: number | IdleOptions = 1000
): Promise<void> => {
  // Normalize: if caller passed a number, turn it into { timeout: number }
  const opts: IdleOptions =
    typeof timeoutOrOpts === "number"
      ? { timeout: timeoutOrOpts }
      : timeoutOrOpts;

  // Ensure we always have a numeric timeout fallback
  const timeout = opts.timeout ?? 1000;

  return new Promise<void>((resolve) => {
    const wrapped = async () => {
      await Promise.resolve(cb());
      resolve();
    };

    if ("requestIdleCallback" in window) {
      // Always pass a plain object here
      window.requestIdleCallback(wrapped, { timeout });
    } else {
      setTimeout(wrapped, timeout);
    }
  });
};



export function removeCompanyStrings(name) {
  const wordsToRemove = ["ETF Trust", "Technologies", "AG", ", Inc.","Inc.","Corp.","Corporation","Holding","Limited","Group","N.V.","Co. Ltd.","Co.", "Ltd."];
if (!name) return "";
    return wordsToRemove?.reduce((acc, word) => acc.replace(word, "").trim(), name);
}

export function buildOptionSymbol(ticker, dateExpiration, optionType, strikePrice) {
  // Parse the date and pull UTC components
  const date = new Date(dateExpiration);
  const year = date.getUTCFullYear() % 100;                   // Last two digits of the year, UTC
  const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Months are 0-indexed; use UTC
  const day = String(date.getUTCDate()).padStart(2, "0");        // Day of month, UTC
  const expirationStr = `${year}${month}${day}`;

  // Convert option type to a single uppercase letter (C for Call, P for Put)
  const optionTypeChar = optionType.charAt(0).toUpperCase();

  // Format strike price as 8 digits (multiply by 1000 and pad with leading zeros)
  const strikePriceScaled = Math.round(strikePrice * 1000);
  const strikeStr = strikePriceScaled.toString().padStart(8, "0");

  // Combine all components into the final option symbol
  return `${ticker}${expirationStr}${optionTypeChar}${strikeStr}`;
}


  export function parseOptionSymbol(optionSymbol) {
  // Extract the ticker (everything before the 6-digit date + 1 character + 8-digit strike)
  // The \^? allows for optional "^" prefix for index tickers like ^SPX
  const match = optionSymbol.match(/^(\^?[A-Z]+)(\d{6})([CP])(\d{8})$/);
  if (!match) throw new Error("Invalid option symbol format");

  const [, ticker, datePart, optionTypeChar, strikeStr] = match;

  // Parse and format the expiration date manually
  const year = (parseInt(datePart.slice(0, 2), 10) + 2000).toString();
  const month = datePart.slice(2, 4); // Already 2-digit string
  const day = datePart.slice(4, 6);   // Already 2-digit string
  const dateExpiration = `${year}-${month}-${day}`;

  // Convert the option type character back to "call" or "put"
  const optionType = optionTypeChar === "C" ? "Call" : "Put";

  // Convert strike price string back to a float
  const strikePrice = parseInt(strikeStr, 10) / 1000;

  return {
    ticker,
    dateExpiration,
    optionType,
    strikePrice,
  };
}


export function convertToSlug(title) {
    // Replace path separators first to keep URL segments stable.
    const cleanedTitle = (title ?? "")
        .replace(/[\\/]/g, " ")
        .replace(/[-.,?!:"]/g, "") // Remove punctuation and hyphens
        .replace(/\s+/g, " ") // Replace multiple spaces with a single space
        .trim(); // Remove leading and trailing spaces

    if (!cleanedTitle) {
      return "";
    }

    // Convert to lowercase, split by spaces, and join with hyphens
    const words = cleanedTitle.toLowerCase().split(" ");
    const truncatedWords = words;

    // Join with hyphens
    const slug = truncatedWords.join("-");
    return slug;
}


export function isPWAInstalled() {
  try {
      // For iOS (Safari)

    const isInStandaloneMode = window.navigator.standalone;

  // For Android and other platforms
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

  return isInStandaloneMode || isStandalone;
  }
  catch(e) {
    console.log(e)
    return false;
  }
  
}


export function calculateDTE(data, dateExpiration) {
  // Parse the expiration date as UTC at 00:00
  const [expYear, expMonth, expDay] = dateExpiration.split('-').map(Number);
  const expirationUTCms = Date.UTC(expYear, expMonth - 1, expDay);

  return data?.map(item => {
    // Parse each item.date as UTC at 00:00
    const [yr, mo, da] = item.date.split('-').map(Number);
    const itemUTCms = Date.UTC(yr, mo - 1, da);

    const diffMs = expirationUTCms - itemUTCms;                 // ms difference in UTC
    const dte = Math.ceil(diffMs / (1000 * 60 * 60 * 24));      // convert to days

    return {
      ...item,
      dte
    };
  });
}

type StatementEntry = Record<string, any>;

type StatementMetricConfig = {
  propertyName: string;
  label: string;
  growthPropertyName?: string;
};

type FieldDescriptor = {
  label: string;
  key: string;
  growthOf?: string;
};

type GrowthFieldDescriptor = FieldDescriptor & {
  baseKey: string;
};

type PeriodView = "annual" | "quarterly" | "ttm" | "unknown";

type ChronoNode = {
  entry: StatementEntry;
  originalIndex: number;
  timestamp: number | null;
  fiscalYear: number | null;
  calendarYear: number | null;
  periodLabel: string;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const TTM_COMPARISON_THRESHOLD_DAYS = 360;
const DEFAULT_GROWTH_PREFIX = "growth";

const buildGrowthKey = (propertyName: string) => {
  if (!propertyName) return "";
  return `${DEFAULT_GROWTH_PREFIX}${propertyName
    .charAt(0)
    .toUpperCase()}${propertyName.slice(1)}`;
};

const buildGrowthLabel = (label: string) =>
  label ? `${label} Growth` : "Growth";

const coerceToNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const getComparableTimestamp = (entry: StatementEntry): number | null => {
  if (!entry) return null;
  for (const key of ["date", "fiscalDate"]) {
    if (entry[key]) {
      const parsed = Date.parse(entry[key]);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }

  const year = Number(entry?.fiscalYear ?? entry?.year);
  if (Number.isFinite(year)) {
    return Date.UTC(year, 0, 1);
  }

  return null;
};

const calculateGrowthRatio = (
  currentValue: number | null,
  previousValue: number | null,
) => {
  if (
    currentValue === null ||
    previousValue === null ||
    previousValue === 0
  ) {
    return null;
  }
  const ratio = (currentValue - previousValue) / previousValue;
  return Number.isFinite(ratio) ? ratio : null;
};

const buildGrowthFieldDescriptors = (
  configs: StatementMetricConfig[],
): GrowthFieldDescriptor[] => {
  if (!Array.isArray(configs)) {
    return [];
  }

  return configs
    .filter(
      (config): config is StatementMetricConfig & { propertyName: string } =>
        Boolean(config?.propertyName),
    )
    .map((config) => {
      const baseKey = config.propertyName;
      const growthKey = config.growthPropertyName || buildGrowthKey(baseKey);
      return {
        label: buildGrowthLabel(config.label),
        key: growthKey,
        baseKey,
      };
    });
};

const normalizePeriodType = (value?: string | null): PeriodView => {
  if (!value) return "unknown";
  const normalized = value.toLowerCase();
  if (normalized.startsWith("quarter")) {
    return "quarterly";
  }
  if (normalized === "ttm") {
    return "ttm";
  }
  if (normalized === "annual" || normalized === "yearly") {
    return "annual";
  }
  return "unknown";
};

const normalizePeriodLabel = (value: string | undefined) => {
  if (!value) return "";
  return value.toString().trim().toUpperCase();
};

const isQuarterLabel = (label: string) => /^Q[1-4]$/.test(label);

const getFiscalYearNumber = (entry: StatementEntry): number | null => {
  const year = Number(entry?.fiscalYear ?? entry?.calendarYear ?? entry?.year);
  return Number.isFinite(year) ? year : null;
};

const getCalendarYearNumber = (entry: StatementEntry): number | null => {
  const timestamp = getComparableTimestamp(entry);
  if (timestamp === null) {
    return null;
  }
  return new Date(timestamp).getUTCFullYear();
};

const buildChronologicalNodes = (
  statements: StatementEntry[],
): {
  nodes: ChronoNode[];
  nodeIndexMap: Map<StatementEntry, number>;
  quarterBuckets: Map<string, ChronoNode[]>;
} => {
  const nodes: ChronoNode[] = statements.map((entry, index) => ({
    entry,
    originalIndex: index,
    timestamp: getComparableTimestamp(entry),
    fiscalYear: getFiscalYearNumber(entry),
    calendarYear: getCalendarYearNumber(entry),
    periodLabel: normalizePeriodLabel(entry?.period),
  }));

  nodes.sort((a, b) => {
    if (a.timestamp !== null && b.timestamp !== null && a.timestamp !== b.timestamp) {
      return a.timestamp - b.timestamp;
    }
    if (a.timestamp !== null && b.timestamp === null) {
      return -1;
    }
    if (a.timestamp === null && b.timestamp !== null) {
      return 1;
    }
    const yearA = a.fiscalYear ?? a.calendarYear ?? 0;
    const yearB = b.fiscalYear ?? b.calendarYear ?? 0;
    return yearA - yearB;
  });

  const nodeIndexMap = new Map<StatementEntry, number>();
  nodes.forEach((node, index) => {
    nodeIndexMap.set(node.entry, index);
  });

  const quarterBuckets = new Map<string, ChronoNode[]>();
  nodes.forEach((node) => {
    if (isQuarterLabel(node.periodLabel)) {
      if (!quarterBuckets.has(node.periodLabel)) {
        quarterBuckets.set(node.periodLabel, []);
      }
      quarterBuckets.get(node.periodLabel)?.push(node);
    }
  });

  return { nodes, nodeIndexMap, quarterBuckets };
};

const findPreviousNode = (
  nodes: ChronoNode[],
  startIndex: number | undefined,
  predicate?: (node: ChronoNode) => boolean,
) => {
  if (startIndex === undefined) return null;
  for (let i = startIndex - 1; i >= 0; i -= 1) {
    const candidate = nodes[i];
    if (!predicate || predicate(candidate)) {
      return candidate;
    }
  }
  return null;
};

const findAnnualComparison = (
  nodes: ChronoNode[],
  nodeIndexMap: Map<StatementEntry, number>,
  current: ChronoNode,
) => {
  return findPreviousNode(nodes, nodeIndexMap.get(current.entry));
};

const findQuarterlyComparison = (
  quarterBuckets: Map<string, ChronoNode[]>,
  current: ChronoNode,
) => {
  if (!isQuarterLabel(current.periodLabel)) {
    return null;
  }
  const bucket = quarterBuckets.get(current.periodLabel);
  if (!bucket) {
    return null;
  }
  const idx = bucket.indexOf(current);
  if (idx <= 0) {
    return null;
  }
  const currentYear = current.fiscalYear ?? current.calendarYear;
  for (let i = idx - 1; i >= 0; i -= 1) {
    const candidate = bucket[i];
    const candidateYear = candidate.fiscalYear ?? candidate.calendarYear;
    if (currentYear !== null && candidateYear !== null) {
      if (candidateYear <= currentYear - 1) {
        return candidate;
      }
      continue;
    }
    return candidate;
  }
  return null;
};

const findTtmComparison = (
  nodes: ChronoNode[],
  nodeIndexMap: Map<StatementEntry, number>,
  current: ChronoNode,
) => {
  const currentIndex = nodeIndexMap.get(current.entry);
  if (currentIndex === undefined) {
    return null;
  }
  const currentTimestamp = current.timestamp;
  for (let i = currentIndex - 1; i >= 0; i -= 1) {
    const candidate = nodes[i];
    if (currentTimestamp !== null && candidate.timestamp !== null) {
      const diffDays = (currentTimestamp - candidate.timestamp) / DAY_IN_MS;
      if (diffDays >= TTM_COMPARISON_THRESHOLD_DAYS) {
        return candidate;
      }
    } else {
      return candidate;
    }
  }
  return null;
};

const buildGrowthComparisonFinder = (
  periodView: PeriodView,
  nodes: ChronoNode[],
  nodeIndexMap: Map<StatementEntry, number>,
  quarterBuckets: Map<string, ChronoNode[]>,
) => {
  return (current: ChronoNode) => {
    switch (periodView) {
      case "quarterly":
        return (
          findQuarterlyComparison(quarterBuckets, current) ??
          findPreviousNode(nodes, nodeIndexMap.get(current.entry))
        );
      case "ttm":
        return (
          findTtmComparison(nodes, nodeIndexMap, current) ??
          findPreviousNode(nodes, nodeIndexMap.get(current.entry))
        );
      case "annual":
        return findAnnualComparison(nodes, nodeIndexMap, current);
      default:
        return findPreviousNode(nodes, nodeIndexMap.get(current.entry));
    }
  };
};

export const augmentStatementsWithGrowth = (
  statements: StatementEntry[] = [],
  configs: StatementMetricConfig[] = [],
  periodType: string = "annual",
): { statements: StatementEntry[]; fields: FieldDescriptor[] } => {
  if (!Array.isArray(statements) || statements.length === 0) {
    return { statements: statements ?? [], fields: [] };
  }

  const growthDescriptors = buildGrowthFieldDescriptors(configs);
  const fields: FieldDescriptor[] = [];
  const clonedStatements = statements.map((entry) => ({ ...entry }));

  const periodView = normalizePeriodType(periodType);
  const { nodes, nodeIndexMap, quarterBuckets } =
    buildChronologicalNodes(clonedStatements);
  const findComparisonNode = buildGrowthComparisonFinder(
    periodView,
    nodes,
    nodeIndexMap,
    quarterBuckets,
  );

  configs.forEach((config) => {
    if (!config?.propertyName) {
      return;
    }

    fields.push({
      label: config.label,
      key: config.propertyName,
      growthOf: undefined,
    });

    const growthMeta = growthDescriptors.find(
      (descriptor) => descriptor.baseKey === config.propertyName,
    );

    if (!growthMeta?.key) {
      return;
    }

    fields.push({
      label: growthMeta.label,
      key: growthMeta.key,
      growthOf: growthMeta.baseKey,
    });
  });

  growthDescriptors.forEach(({ baseKey, key }) => {
    nodes.forEach((node) => {
      const comparisonNode = findComparisonNode(node);
      const currentValue = coerceToNumber(node.entry[baseKey]);
      const previousValue = comparisonNode
        ? coerceToNumber(comparisonNode.entry[baseKey])
        : null;
      node.entry[key] = calculateGrowthRatio(currentValue, previousValue);
    });
  });

  return {
    statements: clonedStatements,
    fields,
  };
};


export const computeGrowthSingleList = (data, actualList) => {
    // Initialize the result list
    let resultList = [];

    for (let i = 0; i < data?.length; i++) {
      const currentData = data[i];

      // Find the corresponding actual data from one FY back
      const correspondingActual = actualList?.find(
        (entry) => Number(entry.FY) === Number(currentData.FY) - 1,
      );

      // Calculate growth if a matching entry exists in actualList
      let growth = null;
      if (
        correspondingActual &&
        correspondingActual?.val !== null &&
        currentData.val !== null
      ) {
        growth = (
          ((currentData?.val - correspondingActual?.val) /
            Math.abs(correspondingActual?.val)) *
          100
        )?.toFixed(2);
      }

      // Push the result for this FY
      resultList.push({
        FY: currentData.FY,
        val: currentData.val,
        growth: growth !== null ? Number(growth) : null, // Convert growth to number or leave as null
      });
    }

    return resultList;
  }


  export const compareTimes = (time1, time2) => {
    const [hours1, minutes1] = time1.split(":").map(Number);
    const [hours2, minutes2] = time2.split(":").map(Number);

    if (hours1 > hours2) return 1;
    if (hours1 < hours2) return -1;
    if (minutes1 > minutes2) return 1;
    if (minutes1 < minutes2) return -1;
    return 0;
  }

 export const formatTime = (timeString) => {
    // Split the time string into components
    const [hours, minutes, seconds] = timeString.split(":").map(Number);

    const isGerman = getCurrentLocale() === "de";

    if (isGerman) {
      // German: 24-hour format with "Uhr"
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} Uhr`;
    }

    // English: 12-hour format with AM/PM
    const period = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12; // Converts 0 to 12 for midnight
    return `${formattedHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
  }


export const groupScreenerRules = (allRows) => {
  const categoryOrder = [
    "Most Popular",
    "Fund Info",
    "Statistics", "Options Activity", "Greeks", "Company Info", "Earnings Report",
    "Price & Volume", "Fair Value", "Valuation & Ratios", "Valuation & Price Targets", "Margins",
    "Performance", "Total Return", "Return CAGR",
    "Technicals", "Technical Analysis",
    "Forecasts, Analysts & Price Targets",
    "Valuation", "Dividends", "52-Week",
    "Revenue / Sales", "Net Income", "Financial Performance", "Other Profits", "Cash Flow", "Expenses", "Debt", "Assets & Liabilities", "Shares Statistics", "Short Selling Statistics", "Taxes",
    "Ticker Filters", "Others",
  ];

  // Group rows by category
  const grouped = allRows.reduce((acc, row) => {
    // Ensure category is an array if it's a single string
    const categories = Array.isArray(row.category) ? row.category : [row.category || "Others"]; // Default to "Others" if no category is provided

    categories.forEach((category) => {
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(row);
    });

    return acc;
  }, {});

  // Sort categories based on the defined order (unknowns go to the end)
  const maxIdx = categoryOrder.length;
  const orderedGroupedRules = Object.fromEntries(
    Object.entries(grouped).sort(
      ([keyA], [keyB]) => {
        const idxA = categoryOrder.indexOf(keyA);
        const idxB = categoryOrder.indexOf(keyB);
        return (idxA === -1 ? maxIdx : idxA) - (idxB === -1 ? maxIdx : idxB);
      }
    )
  );

  return orderedGroupedRules;
}

export const groupChartIndicators = (items) => {
  const categoryOrder = [
    "Trend",
    "Momentum",
    "Volatility",
    "Volume",
    "Price Levels",
    "Other",
  ];

  const grouped = items.reduce((acc, item) => {
    const category = item?.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  const orderedGroupedIndicators = Object.fromEntries(
    Object.entries(grouped).sort(([keyA], [keyB]) => {
      const indexA = categoryOrder.indexOf(keyA);
      const indexB = categoryOrder.indexOf(keyB);
      const safeIndexA = indexA === -1 ? categoryOrder.length : indexA;
      const safeIndexB = indexB === -1 ? categoryOrder.length : indexB;
      if (safeIndexA !== safeIndexB) {
        return safeIndexA - safeIndexB;
      }
      return keyA.localeCompare(keyB);
    }),
  );

  return orderedGroupedIndicators;
};




export const groupEarnings = (earnings) => {
  return Object?.entries(
    earnings?.reduce((acc, item) => {
      // Force formatting in UTC to avoid local timezone conversion
      const dateKey = new Intl.DateTimeFormat('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'
      })?.format(new Date(item.date));

      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(item);
      return acc;
    }, {})
  )
    // Sort the grouped dates in descending order
    ?.sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
    ?.map(([date, earnings]) => [
      date,
      // Sort earnings within the date by time (also treat times as UTC)
      earnings?.sort((a, b) => {
        const timeA = new Date(`1970-01-01T${a?.time}Z`);
        const timeB = new Date(`1970-01-01T${b?.time}Z`);
        return timeB - timeA;
      })
    ]);
};



export const groupNews = (news, watchList) => {
  return Object.entries(
    news
      ?.map(item => {
        // Add 'type' based on watchList
        const match = watchList?.find(w => w?.symbol === item?.symbol);
        return match ? { ...item, type: match.type } : { ...item };
      })
      ?.reduce((acc, item) => {
        // Use UTC to format the published date without shifting the day
        const dateKey = new Intl.DateTimeFormat('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          timeZone: 'UTC'
        }).format(new Date(item?.publishedDate));
        
        const titleKey = item?.title;
        if (!acc[dateKey]) acc[dateKey] = {};
        if (!acc[dateKey][titleKey]) acc[dateKey][titleKey] = [];
        acc[dateKey][titleKey]?.push(item);
        return acc;
      }, {})
  )
    // Sort the grouped dates in descending order (latest date first)
    ?.sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
    ?.map(([date, titleGroup]) => [
      date,
      Object.entries(titleGroup)
        // Sort titles by the latest time of their items
        ?.sort(([, itemsA], [, itemsB]) => {
          const latestTimeA = new Date(Math.max(...itemsA?.map(item => new Date(item.publishedDate + 'Z'))));
          const latestTimeB = new Date(Math.max(...itemsB?.map(item => new Date(item.publishedDate + 'Z'))));
          return latestTimeB - latestTimeA;
        })
        ?.map(([title, items]) => {
          // Sort items within each title group by the latest time (treating times as UTC)
          items.sort((a, b) => new Date(b?.publishedDate + 'Z') - new Date(a?.publishedDate + 'Z'));
          
          // Get the unique symbols
          const symbols = [...new Set(items?.map(item => item.symbol))];
          
          return { title, items, symbols };
        }),
    ]);
};


export const calculateChange = (oldList = [], newList = []) => {
  const oldLen = oldList.length;
  const newLen = newList.length;
  if (!oldLen || !newLen) return oldList.slice();

  // Build a fast symbol -> item dictionary (faster than Map in hot paths)
  const dict = Object.create(null);
  for (let i = 0; i < newLen; i++) {
    const n = newList[i];
    // skip falsy or missing symbol to be safe
    if (n && n.symbol != null) dict[n.symbol] = n;
  }

  // tiny hot-path helpers (inlined & branch-light)
  const parseNum = (v) => {
    if (typeof v === "number") return v;
    if (v == null) return NaN;
    // Strip commas only if needed to avoid extra alloc on clean numbers
    const s = typeof v === "string" ? v : String(v);
    return s.indexOf(",") >= 0 ? +s.replace(/,/g, "") : +s;
  };

  for (let i = 0; i < oldLen; i++) {
    const item = oldList[i];
    if (!item) continue;

    const newItem = dict[item.symbol];
    if (!newItem) continue;

    // Price/percentage update
    const np = newItem.avgPrice;
    if (np != null) {
      const price = item.price;
      const cp = item.changesPercentage;

      if (price != null && cp != null) {
        // changesPercentage might be string; ensure number
        const cpNum = +cp;
        if (cpNum === cpNum) { // NaN check
          // baseLine = price / (1 + cp/100)
          const baseLine = price / (1 + cpNum / 100);
          // (newPrice / baseLine - 1) * 100
          item.changesPercentage = (np / baseLine - 1) * 100;
        }
      }

      item.previous = price;
      item.price = np;

      // Recalculate sinceAdded if addedPrice exists (for watchlist)
      const addedPrice = parseNum(item.addedPrice);
      if (addedPrice > 0 && np > 0) {
        item.sinceAdded = Math.round(((np - addedPrice) / addedPrice) * 10000) / 100;
      }
    }

    // Volume update (increment by newItem.ls if finite and > 0)
    const incRaw = newItem.ls;
    const inc = parseNum(incRaw);
    if (inc > 0 && inc === inc) {
      const cur = parseNum(item.volume);
      if (cur === cur) {
        // use trunc to mirror original semantics
        item.volume = Math.trunc(cur) + Math.trunc(inc);
      }
    }
  }

  return oldList;
};


export function updateStockList(stockList = [], originalData = []) {
  // Create a Map for fast O(1) lookups of original data by symbol
  const originalDataMap = new Map(originalData.map(item => [item.symbol, item]));

  // Initialize an array to store the updated stock list
  const updatedStockList = [];

  // Iterate through each stock in the stockList
  for (let i = 0; i < stockList.length; i++) {
    const stock = stockList[i];
    const matchingStock = originalDataMap?.get(stock?.symbol);
    // If a matching stock is found, update it
    if (matchingStock) {
      updatedStockList.push({
        ...stock,
        price: matchingStock.price,
        changesPercentage: matchingStock.changesPercentage,
        previous: matchingStock.previous ?? null,
        volume: matchingStock.volume ?? stock.volume,
      });
    } else {
      // If no match, add the stock unchanged
      updatedStockList.push(stock);
    }
  }

  // Return the updated stock list
  return updatedStockList;
}


export const flyAndScale = (
  node: Element,
  params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 0 },
): TransitionConfig => {
  const style = getComputedStyle(node);
  const transform = style.transform === "none" ? "" : style.transform;

  const scaleConversion = (
    valueA: number,
    scaleA: [number, number],
    scaleB: [number, number],
  ) => {
    const [minA, maxA] = scaleA;
    const [minB, maxB] = scaleB;

    const percentage = (valueA - minA) / (maxA - minA);
    const valueB = percentage * (maxB - minB) + minB;

    return valueB;
  };

  const styleToString = (
    style: Record<string, number | string | undefined>,
  ): string => {
    return Object.keys(style).reduce((str, key) => {
      if (style[key] === undefined) return str;
      return str + key + ":" + style[key] + ";";
    }, "");
  };

  return {
    duration: Math.max(params.duration ?? 300, 1), // Ensure a minimum duration of 1ms
    delay: 0,
    css: (t) => {
      const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
      const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
      const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

      return styleToString({
        transform:
          transform +
          "translate3d(" +
          x +
          "px, " +
          y +
          "px, 0) scale(" +
          scale +
          ")",
        opacity: t,
      });
    },
    easing: cubicOut,
  };
};

export const sortTableData = (key, displayList, rawData, sortOrders) => {
  // Reset all other keys to 'none' except the current key
  for (const k in sortOrders) {
    if (k !== key) {
      sortOrders[k].order = "none";
    }
  }

  // Cycle through 'none', 'asc', 'desc' for the clicked key
  const orderCycle = ["none", "asc", "desc"];
  const originalData = rawData?.slice(0, 40);
  const currentOrderIndex = orderCycle.indexOf(sortOrders[key].order);
  sortOrders[key].order =
    orderCycle[(currentOrderIndex + 1) % orderCycle.length];
  const sortOrder = sortOrders[key].order;

  // Reset to original data when 'none' and stop further sorting
  if (sortOrder === "none") {
    analytRatingList = [...originalData]; // Reset to original data (spread to avoid mutation)
    return;
  }

  // Define a generic comparison function
  const compareValues = (a, b) => {
    const { type } = sortOrders[key];
    let valueA, valueB;

    switch (type) {
      case "date":
        valueA = new Date(a[key]);
        valueB = new Date(b[key]);
        break;
      case "string":
        valueA = a[key].toUpperCase();
        valueB = b[key].toUpperCase();
        return sortOrder === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      case "number":
      default:
        valueA = parseFloat(a[key]);
        valueB = parseFloat(b[key]);
        break;
    }

    if (sortOrder === "asc") {
      return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
    } else {
      return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
    }
  };

  // Sort using the generic comparison function
  analytRatingList = [...originalData].sort(compareValues);
};

export const formatDateRange = (lastDateStr) => {
  // Convert lastDateStr to Date object
  const lastDate = new Date(lastDateStr);

  // Set the first date to the beginning of the month of lastDate
  const firstDate = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1);

  // Format first and last dates
  const firstDateFormatted = firstDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    day: "2-digit",
  });
  const lastDateFormatted = lastDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    day: "2-digit",
  });
  // Construct and return the formatted date range string
  return `${firstDateFormatted} - ${lastDateFormatted}`;
};

export const serializeNonPOJOs = (obj) => {
  return structuredClone(obj);
};

export const generateUsername = (name) => {
  const randomHex = Math.floor(Math.random() * 65536).toString(16);
  const id = randomHex.padStart(4, "0");
  return `${name.slice(0, 5)}${id}`;
};

export const getImageURL = (collectionId, recordId, fileName, size = "0x0") => {
  const pbCloudImage = import.meta.env.VITE_IMAGE_POCKETBASE_URL;
  //For development or local storage or S3 bucket without CDN Cloudfront
  if (pbCloudImage === "http://localhost:8090") {
    return `${pbCloudImage}/api/files/${collectionId}/${recordId}/${fileName}?thumb=${size}`;
  }
  return `${pbCloudImage}/${collectionId}/${recordId}/${fileName}?thumb=${size}`;
};

export const validateData = async (formData, schema) => {
  const body = Object.fromEntries(formData);

  try {
    const data = schema.parse(body);
    return {
      formData: data,
      errors: null,
    };
  } catch (err) {
    const errors = err.flatten();
    return {
      formData: body,
      errors,
    };
  }
};

export function sumQuarterlyResultsByYear(quarterlyResults, namingList) {
  const yearlySummaries = {};
  const quarterCounts = {};
  // FMP sucks since these keys are up to date only by the last quarter value
  const lastQuarterKeys = new Set([namingList]); // Keys that need last quarter values

  // Define a Set of keys to exclude from summing
  // FMP sucks since these keys are up to date for every quarter hence no summation required
  const excludeKeys = new Set([
    "totalDebt",
    "priceToEarnings",
    "weightedAverageShsOut",
    "weightedAverageShsOutDil",
  ]);

  // Function to get the quarter number from the period string
  function getQuarterNumber(period) {
    switch (period) {
      case "Q1":
        return 1;
      case "Q2":
        return 2;
      case "Q3":
        return 3;
      case "Q4":
        return 4;
      default:
        return 0;
    }
  }

  // Iterate over each quarterly result
  quarterlyResults?.forEach((quarter) => {
    // Extract year and quarter from the data
    const year = quarter?.calendarYear;
    const quarterNum = getQuarterNumber(quarter?.period);

    // Initialize the year in summaries and quarter counts if not already present
    if (!yearlySummaries[year]) {
      yearlySummaries[year] = {
        calendarYear: `${year}`, // Use end of the year date
        lastQuarterProcessed: 0, // Keep track of the last quarter processed
        date: quarter?.date, // Copy the 'date' field unchanged
      };
      quarterCounts[year] = 0;
    }

    // Increment the quarter count for the year
    quarterCounts[year]++;

    // Update last quarter processed if the current quarter is greater
    if (quarterNum > yearlySummaries[year].lastQuarterProcessed) {
      yearlySummaries[year].lastQuarterProcessed = quarterNum;
      // Update the date to the latest quarter's date if applicable
      yearlySummaries[year].date = quarter?.date;
    }

    // Sum up the numeric fields for the year, excluding specific keys
    Object?.keys(quarter)?.forEach((key) => {
      if (
        typeof quarter[key] === "number" &&
        !excludeKeys?.has(key) &&
        !lastQuarterKeys.has(key)
      ) {
        yearlySummaries[year][key] =
          (yearlySummaries[year][key] || 0) + quarter[key];
      } else if (excludeKeys.has(key)) {
        // Directly copy the last quarter value for these keys
        yearlySummaries[year][key] = quarter[key];
      } else if (lastQuarterKeys.has(key) && quarterNum === 4) {
        // Update only if it's the last quarter of the year
        yearlySummaries[year][key] = quarter[key];
      }
    });
  });

  // Filter out years with less than 4 quarters
  const validYears = Object?.keys(quarterCounts)?.filter(
    (year) => quarterCounts[year] === 4,
  );
  const annualResults = validYears?.map((year) => yearlySummaries[year]);

  // Sort the results by year in descending order
  annualResults.sort((a, b) => b?.calendarYear?.localeCompare(a?.calendarYear));

  return annualResults;
}

export const sortPostsByDate = (posts) => {
  return posts.sort(function (a, b) {
    return new Date(b.created) - new Date(a.created);
  });
};

export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function formatString(inputString) {
  // Split the input string into words using space as a delimiter
  const words = inputString?.split(" ");

  // Capitalize the first letter of each word and convert the rest to lowercase
  const formattedWords = words?.map((word, index) => {
    if (word.length > 0) {
      // Check if the word is "LTG" or "LLC" and keep them uppercase
      const excludedList = [
        "n/a",
        "CEO",
        "U.S.",
        "NGL",
        "ETF",
        "SPDR",
        "S&P",
        "USD",
        "US",
        "JPMORGAN",
        "SRS",
        "AQR",
        "XN",
        "TIG",
        "HAP",
        "AB",
        "AKRE",
        "LTG",
        "LLC",
        "JVL",
        "NJ",
        "FMR",
        "LP",
        "NNS",
        "BPS",
        "BNP",
        "PCG",
        "CTC",
        "IMC",
        "PLC",
        "WIT",
      ];

      // Check if the word is "black-rock" and format it accordingly
      if (
        index < words?.length - 1 &&
        word?.toLowerCase() === "black" &&
        words[index + 1]?.toLowerCase() === "rock"
      ) {
        return "Black Rock";
      } else if (excludedList?.includes(word)) {
        return word;
      } else {
        return word?.charAt(0)?.toUpperCase() + word?.slice(1)?.toLowerCase();
      }
    }
    return word; // Handle empty words if any
  });

  // Join the formatted words back together with spaces
  const formattedString = formattedWords?.join(" ");

  return formattedString;
}


export function abbreviateNumberWithColor(number, addDollarSign = false, color = false) {
  // Check if number is null or undefined, return "-" if true
  if (number == null) {
    return "-";
  }

  const negative = number < 0;
  const locale = getCurrentLocale();
  const isGerman = locale === "de";

  // Locale-specific suffixes: German uses Mio/Mrd with space
  const suffixesEn = ["", "K", "M", "B", "B", "T", "Q", "Qu", "S", "O", "N", "D"];
  const suffixesDe = ["", "K", " Mio", " Mrd", " Mrd", " Bio", "Q", "Qu", "S", "O", "N", "D"];
  const suffixes = isGerman ? suffixesDe : suffixesEn;

  // Handle special case for exactly 1000
  if (Math.abs(number) === 1000) {
    const suffix = color ? '<span class=\"text-yellow-500\">K</span>' : 'K';
    return addDollarSign
      ? negative
        ? `-\$1${suffix}`
        : `\$1${suffix}`
      : negative
      ? `-1${suffix}`
      : `1${suffix}`;
  }

  if (Math.abs(number) !== 0 && Math.abs(number) > 1000) {
    const magnitude = Math.floor(Math.log10(Math.abs(number)));
    let index = Math.min(Math.floor(magnitude / 3), suffixes.length - 1);

    // Special case to keep numbers in trillions formatted as billions
    if (index >= 4) {
      index = 3; // Keep the suffix at "B" / "Mrd"
    }

    let abbreviation = Math.abs(number) / Math.pow(10, index * 3);

    // Set the desired number of decimals
    if (abbreviation >= 1000) {
      abbreviation = abbreviation.toFixed(1);
      index++;
    } else {
      abbreviation = abbreviation.toFixed(2);
    }

    abbreviation = parseFloat(abbreviation).toLocaleString("en-US", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });

    let suffix = suffixes[index];

    if (color && !isGerman) {
      if (suffix === "K") {
        suffix = '<span class="font-semibold text-[#8F82FE]">K</span>';
      } else if (suffix === "M") {
        suffix = '<span class="font-semibold text-[#C8A32D]">M</span>';
      } else if (suffix === "B") {
        suffix = '<span class="font-semibold text-[#2CB8A6]">B</span>';
      }
    } else if (color && isGerman) {
      if (suffix === "K") {
        suffix = '<span class="font-semibold text-[#8F82FE]">K</span>';
      } else if (suffix === " Mio") {
        suffix = ' <span class="font-semibold text-[#C8A32D]">Mio</span>';
      } else if (suffix === " Mrd") {
        suffix = ' <span class="font-semibold text-[#2CB8A6]">Mrd</span>';
      }
    }

    const formattedNumber = abbreviation + suffix;

    return addDollarSign
      ? (negative ? "-\$" : "\$") + formattedNumber
      : negative
      ? "-" + formattedNumber
      : formattedNumber;
  } else if (Math.abs(number) >= 0 && Math.abs(number) < 1000) {
    return addDollarSign
      ? (negative ? "-\$" : "\$") + Math.abs(number)
      : negative
      ? "-" + Math.abs(number)
      : number.toString();
  } else {
    return addDollarSign ? "\$0" : "0";
  }
}


export function abbreviateNumber(
  number,
  addDollarSign = false,
  stripTrailingZeros = true
) {
  // Check if number is null or undefined, return "-" if true
  if (number == null) {
    return "n/a";
  }

  const negative = number < 0;
  const locale = getCurrentLocale();
  const isGerman = locale === "de";

  // Locale-specific suffixes: German uses Mio/Mrd with space
  const suffixesEn = ["", "K", "M", "B", "B", "T", "Q", "Qu", "S", "O", "N", "D"];
  const suffixesDe = ["", "K", " Mio", " Mrd", " Mrd", " Bio", "Q", "Qu", "S", "O", "N", "D"];
  const suffixes = isGerman ? suffixesDe : suffixesEn;

  // Handle special case for exactly 1000
  if (Math.abs(number) === 1000) {
    return addDollarSign
      ? negative
        ? "-$1K"
        : "$1K"
      : negative
      ? "-1K"
      : "1K";
  }

  if (Math.abs(number) !== 0 && Math.abs(number) > 1000) {
    const magnitude = Math.floor(Math.log10(Math.abs(number)));
    let index = Math.min(Math.floor(magnitude / 3), suffixes.length - 1);

    // Special case to keep numbers in trillions formatted as billions
    if (index >= 4) {
      index = 3; // Keep the suffix at "B" / "Mrd"
    }

    let abbreviation = Math.abs(number) / Math.pow(10, index * 3);

    // Set the desired number of decimals
    if (abbreviation >= 1000) {
      abbreviation = abbreviation.toFixed(1);
      index++;
    } else {
      abbreviation = abbreviation.toFixed(2);
    }

    // When stripTrailingZeros is true, we set the minimumFractionDigits to 0
    const localeOptions = {
      maximumFractionDigits: 2,
      minimumFractionDigits: stripTrailingZeros ? 0 : 2,
    };

    abbreviation = parseFloat(abbreviation).toLocaleString("en-US", localeOptions);

    const formattedNumber = abbreviation + suffixes[index];

    return addDollarSign
      ? (negative ? "-$" : "$") + formattedNumber
      : negative
      ? "-" + formattedNumber
      : formattedNumber;
  } else if (Math.abs(number) >= 0 && Math.abs(number) < 1000) {
    return addDollarSign
      ? (negative ? "-$" : "$") + Math.abs(number)
      : negative
      ? "-" + Math.abs(number)
      : number.toString();
  } else {
    return addDollarSign ? "$0" : "0";
  }
}

export function formatDate(dateStr, short = false) {
  try {
    const regex = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(dateStr);
    if (!regex) throw new Error('Bad date format');
    const [, y, mo, d, h, mi, s] = regex.map(Number);

    // Build an ISO string with the *correct* NY offset for that instant.
    const offset = zoneOffsetForWallTime(
      { year: y, month: mo, day: d, hour: h, minute: mi, second: s },
      'America/New_York'
    ); // e.g. "-04:00" or "-05:00"

    const isoWithOffset = [
      pad(y, 4), '-', pad(mo), '-', pad(d), 'T',
      pad(h), ':', pad(mi), ':', pad(s), offset
    ].join('');

    const postedUtcMs = Date.parse(isoWithOffset); // absolute moment
    if (!Number.isFinite(postedUtcMs)) throw new Error('Invalid date');

    let seconds = Math.floor((Date.now() - postedUtcMs) / 1000);

    // If it's in the future by <1s, treat as now.
    if (seconds < 0) seconds = 0;

    // Helper to get translated unit
    const getUnit = (unit: string, count: number) => {
      const unitMap: Record<string, () => string> = {
        year: () => count === 1 ? time_year() : time_years(),
        month: () => count === 1 ? time_month() : time_months(),
        week: () => count === 1 ? time_week() : time_weeks(),
        day: () => count === 1 ? time_day() : time_days(),
        hour: () => count === 1 ? time_hour() : time_hours(),
        minute: () => count === 1 ? time_minute() : time_minutes(),
        second: () => count === 1 ? time_second() : time_seconds(),
      };
      return unitMap[unit]?.() || unit;
    };

    const intervals = [
      { unit: 'year',   short: 'y',  seconds: 31536000 },
      { unit: 'month',  short: 'mo', seconds: 2592000 },
      { unit: 'week',   short: 'w',  seconds: 604800 },
      { unit: 'day',    short: 'd',  seconds: 86400 },
      { unit: 'hour',   short: 'h',  seconds: 3600 },
      { unit: 'minute', short: 'm',  seconds: 60 },
      { unit: 'second', short: 's',  seconds: 1 },
    ];

    for (const { unit, short: sfx, seconds: per } of intervals) {
      const count = Math.floor(seconds / per);
      if (count >= 1) {
        if (unit === 'hour' && count >= 24) {
          const days = Math.floor(count / 24);
          return short ? `${days}d` : time_ago({ count: days.toString(), unit: getUnit('day', days) });
        }
        return short ? `${count}${sfx}` : time_ago({ count: count.toString(), unit: getUnit(unit, count) });
      }
    }
    return short ? '0s' : time_just_now();
  } catch (err) {
    console.error('Error formatting date:', err);
    return 'Invalid date';
  }
}

function pad(n, len = 2) {
  return String(n).padStart(len, '0');
}

/**
 * Compute the zone offset string ("-04:00" / "-05:00") for a given wall time in a timeZone.
 * Uses Intl + math to handle DST correctly.
 */
function zoneOffsetForWallTime({ year, month, day, hour, minute, second }, timeZone) {
  // Naive UTC guess for those components
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);

  // Formatter that shows what the zone thinks utcGuess is
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });

  const parts = dtf.formatToParts(utcGuess).reduce((acc, p) => (acc[p.type] = p.value, acc), {});
  const zoneAsUTC = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour), Number(parts.minute), Number(parts.second)
  );

  // zoneAsUTC - utcGuess = -offsetMs
  const offsetMs = utcGuess - zoneAsUTC; // positive for West-of-UTC (e.g., NY)
  const sign = offsetMs <= 0 ? '+' : '-';
  const abs = Math.abs(offsetMs);
  const hh = Math.floor(abs / 3_600_000);
  const mm = Math.floor((abs % 3_600_000) / 60_000);
  return `${sign}${pad(hh)}:${pad(mm)}`;
}
export const formatRuleValue = (rule) => {
  if (["interestIncome", "interestExpenses"].includes(rule.name)) {
    return `$${rule.value === 1000 ? `${rule.value / 1000} Bn` : `${rule.value} Mio`}`;
  } else if (
    [
      "revenue",
      "costOfRevenue",
      "costAndExpenses",
      "netIncome",
      "grossProfit",
      "researchAndDevelopmentExpenses",
      "marketCap",
      "operatingExpenses",
      "operatingIncome",
      "ebitda",
    ].includes(rule.name)
  ) {
    return `${rule.condition} $${rule.value} Bn`;
  } else if (rule.name === "aiSignal") {
    return `${rule.value === "2" ? "Buy" : rule.value === "1" ? "Hold" : rule.value === "0" ? "Sell" : "n/a"} Signal`;
  } else if (["avgVolume"].includes(rule.name)) {
    return `${rule.condition} ${rule.value} Mio`;
  } else if (["var"].includes(rule.name)) {
    return `${rule.condition} ${rule.value}%`;
  } else if (["ratingRecommendation"].includes(rule.name)) {
    return rule.value === 2 ? "Buy" : rule.value === 1 ? "Hold" : "Sell";
  } else if (["trendAnalysis", "fundamentalAnalysis"].includes(rule.name)) {
    return `${rule.condition} ${rule.value}% Accuracy`;
  } else {
    return `${rule.condition} ${rule.value}${rule.name.includes("Growth") ? " %" : ""}`;
  }
};

export function formatETFName(inputString) {
  // Define special cases
  const specialCases = {
    "etf-mg": "ETFMG",
    ark: "ARK",
    "index-iq": "IndexIQ",
    "bny-mellon": "BNY Mellon",
    ssc: "SS&C",
    pgim: "PGIM",
    "jpmorgan-chase": "JPMorgan Chase",
    "us-global-investors": "US Global Investors",
    // Add more special cases as needed
  };

  // Check if the input string is a special case
  const lowerCaseInput = inputString?.toLowerCase();
  if (specialCases?.hasOwnProperty(lowerCaseInput)) {
    return specialCases[lowerCaseInput];
  }

  // Split the input string into an array of words
  const words = inputString?.split("-");

  // Capitalize the first letter of each word
  const capitalizedWords = words?.map(
    (word) => word.charAt(0)?.toUpperCase() + word?.slice(1),
  );

  // Join the words back together with a space between them
  const formattedString = capitalizedWords?.join(" ");

  return formattedString;
}

// Function to add days to a given date
export function addDays(data, days, state) {
  let result;
  const createdDate = new Date(data?.user?.created);

  result = new Date(createdDate);
  result.setDate(result.getDate() + days);

  if (state === "date") {
    return result;
  } else {
    const differenceInTime = result - createdDate;
    const differenceInDays = Math.round(
      differenceInTime / (1000 * 60 * 60 * 24),
    );
    return Math.abs(differenceInDays);
  }
}

export function pageTransitionIn(node, { duration, screenWidth }) {
  if (screenWidth >= 640) {
    return;
  }
  return {
    duration,
    css: (t) => {
      const eased = cubicOut(t);

      return `
        transform: translateX(${(1 - eased) * 100}%);
        width: 100%;
        height: 100%;
        opacity: 1;
        z-index: 9999;
        transition: transform ${duration}ms ease-out;
      `;
    },
  };
}

export function pageTransitionOut(node, { duration }) {
  return {
    duration,
    css: (t) => {
      const eased = cubicOut(t);

      return `
      transform: translateX(${(1 - eased) * 100}%);
        opacity: 1;
        width: 100%;
        height: 100%;
        z-index: 9999;
        transition: transform ${duration}ms ease-in;
      `;
    },
  };
}

export function convertTimestamp(timestamp) {
  const date = new Date(timestamp * 1000); // Convert seconds to milliseconds

  return date.toLocaleString("en-US", {
    year: "numeric", // e.g., "2024"
    month: "short", // e.g., "Aug"
    day: "2-digit", // e.g., "23"
    hour: "numeric", // e.g., "3"
    minute: "2-digit", // e.g., "59"
    hour12: true, // e.g., "PM"
  });
}

export async function checkDisposableEmail(email) {
  const url = `https://disposable.debounce.io/?email=${encodeURIComponent(email)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const output = (await response.json())?.disposable ?? false;
  return output;
}

export function validateReturnUrl(returnUrl: string, origin: string) {
    try {
        const targetUrl = new URL(returnUrl, origin);
        if (targetUrl.origin !== origin) {
            return '/';
        }
        return targetUrl.pathname + targetUrl.search;
    } catch {
        return '/';
    }
}


/*
function convertNYTimeToLocalTime(nyTimeString) {
    // New York Time Zone
    const nyTimeZone = 'America/New_York';
    
    // Parse the New York time string
    let nyTime = new Date(nyTimeString);
    if (isNaN(nyTime)) {
        throw new Error('Invalid date format');
    }
    
    // Convert New York time to UTC
    let utcTime = new Date(nyTime.toLocaleString('en-US', { timeZone: nyTimeZone }));
    
    // Create an Intl.DateTimeFormat object for local time zone
    const localTimeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        hour12: false,  // Use 24-hour format
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    // Format the UTC time as local time
    const localFormattedTime = localTimeFormatter.format(utcTime);
    return localFormattedTime;
}
*/
export function convertPeriodString(interval) {
  const mapping = {
    "1D": common_period_1_day(),
    "1W": common_period_5_days(), // Assuming "1W" means a trading week (5 days)
    "1M": common_period_1_month(),
    "YTD": common_period_ytd(),
    "3M": common_period_3_months(),
    "6M": common_period_6_months(),
    "1Y": common_period_1_year(),
    "5Y": common_period_5_years(),
    "MAX": common_period_max(),
  };

  return mapping[interval] || interval; // Return original if no match
}



export const listOfCountries = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo (Congo-Brazzaville)",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czechia (Czech Republic)",
  "Democratic Republic of the Congo",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini (fmr. 'Swaziland')",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Holy See",
  "Honduras",
  "Hong Kong",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar (formerly Burma)",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Tajikistan",
  "Tanzania",
  "Taiwan",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "UK",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

export const listOfRelevantCountries = [
  "United States", // By far the most companies listed on the NYSE
  "China",
  "Canada",
  "United Kingdom",
  "Japan",
  "Israel",
  "Brazil",
  "France",
  "Ireland",
  "Germany",
  "Mexico",
  "India",
  "Australia",
  "South Korea",
  "Sweden",
  "Netherlands",
  "Switzerland",
  "Taiwan",
  "South Africa",
  "Hong Kong",
  "Singapore",
  "Argentina",
  "Chile",
  "Philippines",
  "Turkey",
  "Italy",
  "Indonesia",
  "Malaysia",
  "Luxembourg",
  "Vietnam",
  "New Zealand",
  "Denmark",
  "Norway",
  "Finland",
  "Russia",
  "United Arab Emirates",
];

export const sectorList = [
  "Basic Materials",
  "Communication Services",
  "Consumer Cyclical",
  "Consumer Defensive",
  "Energy",
  "Financial Services",
  "Healthcare",
  "Industrials",
  "Real Estate",
  "Technology",
  "Utilities",
];

export const industryList = [
  "Steel",
  "Silver",
  "Other Precious Metals",
  "Gold",
  "Copper",
  "Aluminum",
  "Paper, Lumber & Forest Products",
  "Industrial Materials",
  "Construction Materials",
  "Chemicals - Specialty",
  "Chemicals",
  "Agricultural Inputs",
  "Telecommunications Services",
  "Internet Content & Information",
  "Publishing",
  "Broadcasting",
  "Advertising Agencies",
  "Entertainment",
  "Travel Lodging",
  "Travel Services",
  "Specialty Retail",
  "Luxury Goods",
  "Home Improvement",
  "Residential Construction",
  "Department Stores",
  "Personal Products & Services",
  "Leisure",
  "Gambling, Resorts & Casinos",
  "Furnishings, Fixtures & Appliances",
  "Restaurants",
  "Auto - Parts",
  "Auto - Manufacturers",
  "Auto - Recreational Vehicles",
  "Auto - Dealerships",
  "Apparel - Retail",
  "Apparel - Manufacturers",
  "Apparel - Footwear & Accessories",
  "Packaging & Containers",
  "Tobacco",
  "Grocery Stores",
  "Discount Stores",
  "Household & Personal Products",
  "Packaged Foods",
  "Food Distribution",
  "Food Confectioners",
  "Agricultural Farm Products",
  "Education & Training Services",
  "Beverages - Wineries & Distilleries",
  "Beverages - Non-Alcoholic",
  "Beverages - Alcoholic",
  "Uranium",
  "Solar",
  "Oil & Gas Refining & Marketing",
  "Oil & Gas Midstream",
  "Oil & Gas Integrated",
  "Oil & Gas Exploration & Production",
  "Oil & Gas Equipment & Services",
  "Oil & Gas Energy",
  "Oil & Gas Drilling",
  "Coal",
  "Shell Companies",
  "Investment - Banking & Investment Services",
  "Insurance - Specialty",
  "Insurance - Reinsurance",
  "Insurance - Property & Casualty",
  "Insurance - Life",
  "Insurance - Diversified",
  "Insurance - Brokers",
  "Financial - Mortgages",
  "Financial - Diversified",
  "Financial - Data & Stock Exchanges",
  "Financial - Credit Services",
  "Financial - Conglomerates",
  "Financial - Capital Markets",
  "Banks - Regional",
  "Banks - Diversified",
  "Banks",
  "Asset Management",
  "Asset Management - Bonds",
  "Asset Management - Income",
  "Asset Management - Leveraged",
  "Asset Management - Cryptocurrency",
  "Asset Management - Global",
  "Medical - Specialties",
  "Medical - Pharmaceuticals",
  "Medical - Instruments & Supplies",
  "Medical - Healthcare Plans",
  "Medical - Healthcare Information Services",
  "Medical - Equipment & Services",
  "Medical - Distribution",
  "Medical - Diagnostics & Research",
  "Medical - Devices",
  "Medical - Care Facilities",
  "Drug Manufacturers - Specialty & Generic",
  "Drug Manufacturers - General",
  "Biotechnology",
  "Waste Management",
  "Trucking",
  "Railroads",
  "Aerospace & Defense",
  "Marine Shipping",
  "Integrated Freight & Logistics",
  "Airlines, Airports & Air Services",
  "General Transportation",
  "Manufacturing - Tools & Accessories",
  "Manufacturing - Textiles",
  "Manufacturing - Miscellaneous",
  "Manufacturing - Metal Fabrication",
  "Industrial - Distribution",
  "Industrial - Specialties",
  "Industrial - Pollution & Treatment Controls",
  "Environmental Services",
  "Industrial - Machinery",
  "Industrial - Infrastructure Operations",
  "Industrial - Capital Goods",
  "Consulting Services",
  "Business Equipment & Supplies",
  "Staffing & Employment Services",
  "Rental & Leasing Services",
  "Engineering & Construction",
  "Security & Protection Services",
  "Specialty Business Services",
  "Construction",
  "Conglomerates",
  "Electrical Equipment & Parts",
  "Agricultural - Machinery",
  "Agricultural - Commodities/Milling",
  "REIT - Specialty",
  "REIT - Retail",
  "REIT - Residential",
  "REIT - Office",
  "REIT - Mortgage",
  "REIT - Industrial",
  "REIT - Hotel & Motel",
  "REIT - Healthcare Facilities",
  "REIT - Diversified",
  "Real Estate - Services",
  "Real Estate - Diversified",
  "Real Estate - Development",
  "Real Estate - General",
  "Information Technology Services",
  "Hardware, Equipment & Parts",
  "Computer Hardware",
  "Electronic Gaming & Multimedia",
  "Software - Services",
  "Software - Infrastructure",
  "Software - Application",
  "Semiconductors",
  "Media & Entertainment",
  "Communication Equipment",
  "Technology Distributors",
  "Consumer Electronics",
  "Renewable Utilities",
  "Regulated Water",
  "Regulated Gas",
  "Regulated Electric",
  "Independent Power Producers",
  "Diversified Utilities",
  "General Utilities",
];

export const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const holidays = ["2026-01-01","2026-01-19","2026-02-16","2026-04-03","2026-05-25","2026-06-19","2026-07-03","2026-09-07","2026-11-26","2026-12-25"]

export const getLastTradingDay = () => {
  const etTimeZone = "America/New_York";

  // Helper function to check if a date (in NY time) is a holiday
  const isHoliday = (date) => {
    return holidays.includes(date.toISOString().split("T")[0]);
  };
  let date = new Date();

  // Convert current date to NY timezone
  const nyDate = new Date(
    date.toLocaleString("en-US", { timeZone: etTimeZone }),
  );

  // Loop backwards to find the most recent trading day
  while (true) {
    const dayOfWeek = nyDate.getUTCDay();

    // Check if it's a weekday and not a holiday
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday(nyDate)) {
      return nyDate.toISOString().split("T")[0];
    }

    // Move back one day
    nyDate.setDate(nyDate.getDate() - 1);
  }
};

export const sectorNavigation = [
  {
    title: "Financial Services",
    link: "/list/sector/financial",
  },
  {
    title: "Finance",
    link: "/list/sector/financial",
  },
  {
    title: "Healthcare",
    link: "/list/sector/healthcare",
  },
  {
    title: "Technology",
    link: "/list/sector/technology",
  },
  {
    title: "Industrials",
    link: "/list/sector/industrials",
  },
  {
    title: "Energy",
    link: "/list/sector/energy",
  },
  {
    title: "Utilities",
    link: "/list/sector/utilities",
  },
  {
    title: "Consumer Cyclical",
    link: "/list/sector/consumer-cyclical",
  },
  {
    title: "Real Estate",
    link: "/list/sector/real-estate",
  },
  {
    title: "Basic Materials",
    link: "/list/sector/basic-materials",
  },
  {
    title: "Communication Services",
    link: "/list/sector/communication-services",
  },
  {
    title: "Consumer Defensive",
    link: "/list/sector/consumer-defensive",
  },
];


export const agentOptions = [
  {"name": "Analyst", "group": 'Stocks',"credit": 2},
  {"name": "BullvsBear",  "group": 'Stocks', "credit": 2},
  {"name": "CompareStocks", "group": 'Stocks',"credit": 2},
  {"name": "UnusualOrderFeed", "group": 'Stocks',"credit": 5},
  {"name": "FundamentalData", "group": 'Stocks',"credit": 3},
  {"name": "OptionsData", "group": 'Options', "credit": 5},
  {"name": "OptionsFlowFeed", "group": 'Options', "credit": 5},
  {"name": "StockScreener", "group": 'Others',"credit": 2},
  {"name": "WarrenBuffet", "group": 'Investors',"credit": 2},
  {"name": "CharlieMunger", "group": 'Investors',"credit": 2},
  {"name": "BillAckman", "group": 'Investors',"credit": 2},
  {"name": "MichaelBurry", "group": 'Investors',"credit": 2},
  {"name": "PeterLynch", "group": 'Investors',"credit": 2},
  {"name": "BenjaminGraham", "group": 'Investors',"credit": 2},
  {"name": "CathieWood", "group": 'Investors',"credit": 2},
  //{"name": "Backtesting", "group": 'Others',"credit": 3},
  //{"name": "Plot", "credit": 1},
  
]

export const agentCategory = ["Stocks", "Options", "Investors", "Others"];

export function getIntradayExportBounds(interval = "15min") {
  const bounds: Record<string, { min: number; max: number }> = {
    "1hour": { min: 4, max: 30 },
    "30min": { min: 6, max: 40 },
    "15min": { min: 8, max: 50 },
    "5min": { min: 12, max: 70 },
    "1min": { min: 18, max: 100 },
  };

  return bounds[interval] ?? bounds["15min"];
}

export function calculateIntradayExportCredits(
  startDate: string,
  endDate: string,
  interval = "15min",
) {
  const bounds = getIntradayExportBounds(interval);
  if (!startDate || !endDate) return bounds.min;

  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return minCredits;
  }

  if (start > end) return minCredits;

  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1;
  const perDayRates: Record<string, number> = {
    "1hour": 0.15,
    "30min": 0.3,
    "15min": 0.55,
    "5min": 0.95,
    "1min": 1.5,
  };
  const rate = perDayRates[interval] ?? perDayRates["15min"];
  const cost = Math.ceil(diffDays * rate);

  return Math.min(bounds.max, Math.max(bounds.min, cost));
}


export function getCreditFromQuery(query, agentOptions) {
  let totalCredit = 0;
  let foundAnyTrigger = false;
  
  // Check for all triggers in the query and sum their credits
  for (const item of agentOptions) {
    if (query?.includes(`@${item?.name}`)) {
      totalCredit += item?.credit || 0;
      foundAnyTrigger = true;
    }
  }
  
  // If no triggers found, return default credit of 2
  // If triggers found, return the sum (minimum 2)
  return foundAnyTrigger ? Math.max(totalCredit, 2) : 2;
}

export function getDefaultChats() {
  return [
    {
      label: chat_default_gainers_losers_label(),
      query: chat_default_gainers_losers_query(),
      type: "Stocks",
    },
    {
      label: chat_default_options_flow_label(),
      query: chat_default_options_flow_query(),
      type: "Options",
    },
    {
      label: chat_default_market_news_label(),
      query: chat_default_market_news_query(),
      type: "Stocks",
    },
    {
      label: chat_default_bull_bear_label(),
      query: chat_default_bull_bear_query(),
      type: "Stocks",
    },
    {
      label: chat_default_value_investor_label(),
      query: chat_default_value_investor_query(),
      type: "Stocks",
    },
    {
      label: chat_default_cathie_wood_label(),
      query: chat_default_cathie_wood_query(),
      type: "Stocks",
    },
    {
      label: chat_default_options_data_label(),
      query: chat_default_options_data_query(),
      type: "ETF",
    },
    {
      label: chat_default_undervalued_label(),
      query: chat_default_undervalued_query(),
      type: "Stocks",
    },
    {
      label: chat_default_gamestop_label(),
      query: chat_default_gamestop_query(),
      type: "Stocks",
    },
    {
      label: chat_default_spy_bullish_label(),
      query: chat_default_spy_bullish_query(),
      type: "ETF",
    },
    {
      label: chat_default_nvidia_flow_label(),
      query: chat_default_nvidia_flow_query(),
      type: "Options",
    },
    {
      label: chat_default_googl_flow_label(),
      query: chat_default_googl_flow_query(),
      type: "Stocks",
    },
    {
      label: chat_default_compare_aapl_msft_label(),
      query: chat_default_compare_aapl_msft_query(),
      type: "Stocks",
    },
    {
      label: chat_default_analyst_ratings_label(),
      query: chat_default_analyst_ratings_query(),
      type: "Stocks",
    },
    {
      label: chat_default_dark_pool_label(),
      query: chat_default_dark_pool_query(),
      type: "Stocks",
    },
    {
      label: chat_default_dividend_label(),
      query: chat_default_dividend_query(),
      type: "Stocks",
    },
    {
      label: chat_default_michael_burry_label(),
      query: chat_default_michael_burry_query(),
      type: "Investors",
    },
    {
      label: chat_default_peter_lynch_label(),
      query: chat_default_peter_lynch_query(),
      type: "Investors",
    },
    {
      label: chat_default_sector_performance_label(),
      query: chat_default_sector_performance_query(),
      type: "Stocks",
    },
    {
      label: chat_default_earnings_label(),
      query: chat_default_earnings_query(),
      type: "Stocks",
    },
  ];
}



export let allCards = [
  {
    href: '/chat/',
    label: 'AI Agent',
    icon: `<svg
    fill="currentColor"
    class="h-8 w-8 text-gray-500 dark:text-white"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 512 512"
    xml:space="preserve"
    ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
      id="SVGRepo_tracerCarrier"
      stroke-linecap="round"
      stroke-linejoin="round"
    ></g><g id="SVGRepo_iconCarrier">
      <g>
        <path
          d="M247.355,106.9C222.705,82.241,205.833,39.18,197.46,0c-8.386,39.188-25.24,82.258-49.899,106.917 c-24.65,24.642-67.724,41.514-106.896,49.904c39.188,8.373,82.254,25.235,106.904,49.895c24.65,24.65,41.522,67.72,49.908,106.9 c8.373-39.188,25.24-82.258,49.886-106.917c24.65-24.65,67.724-41.514,106.896-49.904 C315.08,148.422,272.014,131.551,247.355,106.9z"
        ></path>
        <path
          d="M407.471,304.339c-14.714-14.721-24.81-40.46-29.812-63.864c-5.011,23.404-15.073,49.142-29.803,63.872 c-14.73,14.714-40.464,24.801-63.864,29.812c23.408,5.01,49.134,15.081,63.864,29.811c14.73,14.722,24.81,40.46,29.82,63.864 c5.001-23.413,15.081-49.142,29.802-63.872c14.722-14.722,40.46-24.802,63.856-29.82 C447.939,329.14,422.201,319.061,407.471,304.339z"
        ></path>
        <path
          d="M146.352,354.702c-4.207,19.648-12.655,41.263-25.019,53.626c-12.362,12.354-33.968,20.82-53.613,25.027 c19.645,4.216,41.251,12.656,53.613,25.027c12.364,12.362,20.829,33.96,25.036,53.618c4.203-19.658,12.655-41.255,25.023-53.626 c12.354-12.362,33.964-20.82,53.605-25.035c-19.64-4.2-41.251-12.656-53.613-25.019 C159.024,395.966,150.555,374.351,146.352,354.702z"
        ></path>
      </g>
    </g></svg
  >`,
  },
  {
    href: '/options-flow',
    label: 'Options Flow',
    icon: ` <svg
              fill="currentColor"
              class="h-8 w-8 text-gray-500 dark:text-white"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g><g id="SVGRepo_iconCarrier">
                <path
                  d="M3 3C3 2.44772 3.44772 2 4 2H19C19.5523 2 20 2.44772 20 3C20 3.55228 19.5523 4 19 4H4C3.44772 4 3 3.55228 3 3Z"
                ></path>
                <path
                  d="M7 6C7 5.44772 7.44772 5 8 5H20C20.5523 5 21 5.44772 21 6C21 6.55228 20.5523 7 20 7H8C7.44772 7 7 6.55228 7 6Z"
                ></path>
                <path
                  d="M10 8C9.44772 8 9 8.44772 9 9C9 9.55228 9.44772 10 10 10H19C19.5523 10 20 9.55228 20 9C20 8.44772 19.5523 8 19 8H10Z"
                ></path>
                <path
                  d="M6 12C6 11.4477 6.44772 11 7 11H15C15.5523 11 16 11.4477 16 12C16 12.5523 15.5523 13 15 13H7C6.44772 13 6 12.5523 6 12Z"
                ></path>
                <path
                  d="M7 14C6.44772 14 6 14.4477 6 15C6 15.5523 6.44772 16 7 16H13C13.5523 16 14 15.5523 14 15C14 14.4477 13.5523 14 13 14H7Z"
                ></path>
                <path
                  d="M9 18C9 17.4477 9.44772 17 10 17H15C15.5523 17 16 17.4477 16 18C16 18.5523 15.5523 19 15 19H10C9.44772 19 9 18.5523 9 18Z"
                ></path>
                <path
                  d="M14 20C13.4477 20 13 20.4477 13 21C13 21.5523 13.4477 22 14 22H16C16.5523 22 17 21.5523 17 21C17 20.4477 16.5523 20 16 20H14Z"
                ></path>
              </g></svg
            >`,
  },
  {
    href: '/potus-tracker',
    label: 'POTUS Tracker',
    icon: ` <svg
              fill="currentColor"
              class="h-9 w-9 text-gray-500 dark:text-white"
              version="1.1"
              id="Capa_1"
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              viewBox="0 0 19.935 19.935"
              xml:space="preserve"
              ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g><g id="SVGRepo_iconCarrier">
                <g>
                  <path
                    d="M19.935,18.33v-4.611h-4.022v-0.843h-1.879V12.35h-0.629v-1.98c0.132-0.037,0.229-0.155,0.229-0.3 c0-0.171-0.141-0.31-0.311-0.31H12.91V8.5c0.069-0.048,0.115-0.127,0.115-0.219c0-0.146-0.117-0.264-0.265-0.264h-0.323 c-0.033-0.352-0.143-1.081-0.48-1.569c-0.354-0.507-0.826-0.817-1.223-1.006c0.028-0.038,0.045-0.086,0.045-0.138 c0-0.11-0.071-0.201-0.172-0.23V4.857h-0.174V3.8c0.052-0.026,0.09-0.082,0.09-0.146c0-0.09-0.075-0.164-0.164-0.164h-0.048 c-0.049-0.084-0.14-0.146-0.245-0.17V1.604H9.868V3.32C9.762,3.344,9.674,3.406,9.623,3.489H9.575 c-0.089,0-0.164,0.073-0.164,0.164c0,0.064,0.038,0.12,0.091,0.146v1.057H9.325v0.217C9.227,5.104,9.153,5.194,9.153,5.305 c0,0.052,0.019,0.1,0.046,0.139c-0.398,0.188-0.868,0.498-1.22,1.005c-0.341,0.488-0.45,1.219-0.482,1.57H7.172 c-0.146,0-0.262,0.118-0.262,0.265c0,0.091,0.044,0.169,0.113,0.218v1.259H6.61c-0.17,0-0.31,0.139-0.31,0.31 c0,0.145,0.098,0.263,0.229,0.3v1.98H5.9v0.526H4.022v0.843H0v4.611h19.935V18.33z M18.182,14.482h0.698v0.986h-0.698V14.482z M18.182,16.042h0.698v0.986h-0.698V16.042z M16.682,14.482h0.7v0.986h-0.7V14.482z M16.682,16.042h0.7v0.986h-0.7V16.042z M14.546,13.999h0.661v2.374h-0.661V13.999z M11.421,16.373h-0.662v-2.374h0.662V16.373z M12.683,16.373h-0.661v-2.374h0.661 V16.373z M13.284,13.999h0.659v2.374h-0.659V13.999z M12.595,10.653c0,0-0.016-0.235,0.202-0.235c0.219,0,0.219,0.235,0.219,0.235 v1.682h-0.421C12.595,12.335,12.595,10.653,12.595,10.653z M12.118,8.538c0,0-0.013-0.17,0.166-0.17c0.178,0,0.178,0.17,0.178,0.17 v1.218h-0.344C12.118,9.756,12.118,8.538,12.118,8.538z M11.852,10.417c0.218,0,0.218,0.235,0.218,0.235v1.682h-0.421v-1.681 C11.648,10.653,11.633,10.417,11.852,10.417z M11.344,8.538c0,0-0.012-0.17,0.163-0.17c0.181,0,0.181,0.17,0.181,0.17v1.218h-0.344 V8.538z M11.121,10.653v1.682h-0.417v-1.682c0,0-0.017-0.235,0.201-0.235C11.121,10.417,11.121,10.653,11.121,10.653z M10.569,8.538c0,0-0.013-0.17,0.166-0.17c0.178,0,0.178,0.17,0.178,0.17v1.218h-0.344C10.569,9.756,10.569,8.538,10.569,8.538z M9.795,8.538c0,0-0.013-0.17,0.166-0.17c0.178,0,0.178,0.17,0.178,0.17v1.218H9.795V8.538z M9.758,10.653 c0,0-0.017-0.235,0.203-0.235c0.216,0,0.216,0.235,0.216,0.235v1.682H9.758V10.653z M9.615,15.121c0,0,0.075-0.243,0.354-0.243 c0.278,0,0.35,0.243,0.35,0.243v1.251H9.615V15.121z M7.911,16.373H7.252v-2.374h0.659V16.373z M9.176,16.373H8.513v-2.374h0.662 v2.374H9.176z M9.021,8.538c0,0-0.014-0.17,0.165-0.17c0.177,0,0.177,0.17,0.177,0.17v1.218H9.021V8.538z M8.812,10.653 c0,0-0.016-0.235,0.201-0.235c0.218,0,0.218,0.235,0.218,0.235v1.682H8.812V10.653z M8.247,8.538c0,0-0.013-0.17,0.165-0.17 c0.177,0,0.177,0.17,0.177,0.17v1.218H8.247V8.538z M7.865,10.653c0,0-0.015-0.235,0.203-0.235c0.216,0,0.216,0.235,0.216,0.235 v1.682H7.865V10.653z M7.473,8.538c0,0-0.014-0.17,0.166-0.17c0.176,0,0.176,0.17,0.176,0.17v1.218H7.473V8.538z M6.919,10.653 c0,0-0.015-0.235,0.203-0.235s0.218,0.235,0.218,0.235v1.682H6.919V10.653z M5.989,13.999H6.65v2.374H5.989V13.999z M4.728,13.999 h0.661v2.374H4.728V13.999z M2.445,14.482h0.702v0.986H2.445V14.482z M2.445,16.042h0.702v0.986H2.445V16.042z M0.947,14.482h0.702 v0.986H0.947V14.482z M0.947,16.042h0.702v0.986H0.947V16.042z"
                  ></path>
                </g>
              </g></svg
            >`,
  },
  {
    href: '/stocks/screener',
    label: 'Stock Screener',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-8 w-8 text-gray-500 dark:text-white" aria-hidden="true"><path d="M6 12a.75.75 0 01-.75-.75v-7.5a.75.75 0 111.5 0v7.5A.75.75 0 016 12zM18 12a.75.75 0 01-.75-.75v-7.5a.75.75 0 011.5 0v7.5A.75.75 0 0118 12zM6.75 20.25v-1.5a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0zM18.75 18.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 011.5 0zM12.75 5.25v-1.5a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0zM12 21a.75.75 0 01-.75-.75v-7.5a.75.75 0 011.5 0v7.5A.75.75 0 0112 21zM3.75 15a2.25 2.25 0 104.5 0 2.25 2.25 0 00-4.5 0zM12 11.25a2.25 2.25 0 110-4.5 2.25 2.25 0 010 4.5zM15.75 15a2.25 2.25 0 104.5 0 2.25 2.25 0 00-4.5 0z"></path></svg>`,
  },
  {
    href: '/stocks/compare',
    label: 'Compare Stocks',
    icon: `<svg
              fill="currentColor"
              class="h-8 w-8 text-gray-500 dark:text-white"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g><g id="SVGRepo_iconCarrier"
                ><path
                  d="M1,8A1,1,0,0,1,2,7H9.586L7.293,4.707A1,1,0,1,1,8.707,3.293l4,4a1,1,0,0,1,0,1.414l-4,4a1,1,0,1,1-1.414-1.414L9.586,9H2A1,1,0,0,1,1,8Zm21,7H14.414l2.293-2.293a1,1,0,0,0-1.414-1.414l-4,4a1,1,0,0,0,0,1.414l4,4a1,1,0,0,0,1.414-1.414L14.414,17H22a1,1,0,0,0,0-2Z"
                ></path></g
              ></svg
            >`,
  },
  {
    href: '/market-mover/gainers',
    label: 'Market Movers',
    icon: `<svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="h-8 w-8 text-gray-500 dark:text-white"
              aria-hidden="true"
              ><path
                fill-rule="evenodd"
                d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm4.5 7.5a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0v-2.25a.75.75 0 01.75-.75zm3.75-1.5a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0V12zm2.25-3a.75.75 0 01.75.75v6.75a.75.75 0 01-1.5 0V9.75A.75.75 0 0113.5 9zm3.75-1.5a.75.75 0 00-1.5 0v9a.75.75 0 001.5 0v-9z"
                clip-rule="evenodd"
              ></path></svg
            >`,
  },
  {
    href: '/watchlist/stocks',
    label: 'Watchlist',
    icon: `<svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="h-8 w-8 text-gray-500 dark:text-white"
              aria-hidden="true"
              ><path
                fill-rule="evenodd"
                d="M2.625 6.75a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875 0A.75.75 0 018.25 6h12a.75.75 0 010 1.5h-12a.75.75 0 01-.75-.75zM2.625 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zM7.5 12a.75.75 0 01.75-.75h12a.75.75 0 010 1.5h-12A.75.75 0 017.5 12zm-4.875 5.25a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875 0a.75.75 0 01.75-.75h12a.75.75 0 010 1.5h-12a.75.75 0 01-.75-.75z"
                clip-rule="evenodd"
              ></path></svg
            >`,
  },
  {
    href: '/pricing',
    label: 'Unlimited Access',
    icon: ` <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="h-8 w-8 text-gray-500 dark:text-white"
              aria-hidden="true"
              ><path
                fill-rule="evenodd"
                d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z"
                clip-rule="evenodd"
              ></path></svg
            >`,
  },
  {
    href: '/earnings-calendar',
    label: 'Earnings Calendar',
    icon: `<svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="h-8 w-8 text-gray-500 dark:text-white"
              aria-hidden="true"
              ><path
                fill-rule="evenodd"
                d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z"
                clip-rule="evenodd"
              ></path></svg
            >`,
  },
  {
    href: '/stocks/heatmap',
    label: 'Market Heatmap',
    icon: `<svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="h-8 w-8 text-gray-500 dark:text-white"
              aria-hidden="true"
              ><path
                fill-rule="evenodd"
                d="M8.161 2.58a1.875 1.875 0 0 1 1.678 0l4.993 2.498c.106.052.23.052.336 0l3.869-1.935A1.875 1.875 0 0 1 21.75 4.82v12.485c0 .71-.401 1.36-1.037 1.677l-4.875 2.437a1.875 1.875 0 0 1-1.676 0l-4.994-2.497a.375.375 0 0 0-.336 0l-3.868 1.935A1.875 1.875 0 0 1 2.25 19.18V6.695c0-.71.401-1.36 1.036-1.677l4.875-2.437ZM9 6a.75.75 0 0 1 .75.75V15a.75.75 0 0 1-1.5 0V6.75A.75.75 0 0 1 9 6Zm6.75 3a.75.75 0 0 0-1.5 0v8.25a.75.75 0 0 0 1.5 0V9Z"
                clip-rule="evenodd"
              ></path></svg
            >`,
  },
  {
    href: '/list',
    label: 'Stock Lists',
    icon: `<svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="h-8 w-8 text-gray-500 dark:text-white"
              aria-hidden="true"
              ><path
                fill-rule="evenodd"
                d="M7.491 5.992a.75.75 0 0 1 .75-.75h12a.75.75 0 1 1 0 1.5h-12a.75.75 0 0 1-.75-.75ZM7.49 11.995a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1-.75-.75ZM7.491 17.994a.75.75 0 0 1 .75-.75h12a.75.75 0 1 1 0 1.5h-12a.75.75 0 0 1-.75-.75ZM2.24 3.745a.75.75 0 0 1 .75-.75h1.125a.75.75 0 0 1 .75.75v3h.375a.75.75 0 0 1 0 1.5H2.99a.75.75 0 0 1 0-1.5h.375v-2.25H2.99a.75.75 0 0 1-.75-.75ZM2.79 10.602a.75.75 0 0 1 0-1.06 1.875 1.875 0 1 1 2.652 2.651l-.55.55h.35a.75.75 0 0 1 0 1.5h-2.16a.75.75 0 0 1-.53-1.281l1.83-1.83a.375.375 0 0 0-.53-.53.75.75 0 0 1-1.062 0ZM2.24 15.745a.75.75 0 0 1 .75-.75h1.125a1.875 1.875 0 0 1 1.501 2.999 1.875 1.875 0 0 1-1.501 3H2.99a.75.75 0 0 1 0-1.501h1.125a.375.375 0 0 0 .036-.748H3.74a.75.75 0 0 1-.75-.75v-.002a.75.75 0 0 1 .75-.75h.411a.375.375 0 0 0-.036-.748H2.99a.75.75 0 0 1-.75-.75Z"
                clip-rule="evenodd"
              ></path></svg
            >`,
  }
];


export const checkPreMarketHourSSR = () => {
  const holidays = ["2026-01-01","2026-01-19","2026-02-16","2026-04-03","2026-05-25","2026-06-19","2026-07-03","2026-09-07","2026-11-26","2026-12-25"]

  const currentDate = new Date().toISOString().split("T")[0];

  const etTimeZone = "America/New_York";
  const nowET = new Date(
    new Date().toLocaleString("en-US", { timeZone: etTimeZone })
  );

  const day = nowET.getDay();
  const hour = nowET.getHours();
  const minutes = nowET.getMinutes();

  const isWeekend = day === 0 || day === 6;
  const isHoliday = holidays?.includes(currentDate);
  const isBeforeOpen = hour < 9 || (hour === 9 && minutes < 30);

  return !isWeekend && !isHoliday && isBeforeOpen;
};

export const checkMarketHourSSR = () => {
  const holidays = ["2026-01-01","2026-01-19","2026-02-16","2026-04-03","2026-05-25","2026-06-19","2026-07-03","2026-09-07","2026-11-26","2026-12-25"]


  const currentDate = new Date().toISOString().split("T")[0];

  const etTimeZone = "America/New_York";
  const nowET = new Date(
    new Date().toLocaleString("en-US", { timeZone: etTimeZone })
  );

  const day = nowET.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = nowET.getHours();
  const minutes = nowET.getMinutes();

  const isWeekend = day === 0 || day === 6;
  const isHoliday = holidays?.includes(currentDate);
  const isBeforeOpen = hour < 9 || (hour === 9 && minutes < 30);
  const isAfterClose = hour > 16 || (hour === 16 && minutes > 0);

  const isOpen = !(isWeekend || isHoliday || isBeforeOpen || isAfterClose);

  return isOpen;
};

// ============================================================================
// CAGR (Compound Annual Growth Rate) Calculation Utilities
// ============================================================================

/**
 * Calculate CAGR (Compound Annual Growth Rate) between two values over a period
 * Formula: ((endValue / startValue) ^ (1 / years) - 1) * 100
 * 
 * @param startValue - The starting value
 * @param endValue - The ending value
 * @param years - Number of years between start and end
 * @returns CAGR as a percentage, or null if calculation is invalid
 */
export function calculateCAGR(
  startValue: number,
  endValue: number,
  years: number
): number | null {
  // Handle edge cases
  if (!Number.isFinite(startValue) || !Number.isFinite(endValue) || !Number.isFinite(years)) {
    return null;
  }
  if (years <= 0) return null;
  if (startValue === 0) return null;
  
  // Handle negative to positive transition (recovery from losses)
  if (startValue < 0 && endValue > 0) {
    const totalGrowth = (endValue - startValue) / Math.abs(startValue);
    const annualized = (Math.pow(1 + totalGrowth, 1 / years) - 1) * 100;
    return Number.isFinite(annualized) ? Number(annualized.toFixed(2)) : null;
  }
  // Handle positive to negative transition (decline into losses)
  if (startValue > 0 && endValue < 0) {
    const totalDecline = (startValue - endValue) / startValue;
    const annualized = -(Math.pow(1 + totalDecline, 1 / years) - 1) * 100;
    return Number.isFinite(annualized) ? Number(annualized.toFixed(2)) : null;
  }
  
  // Both negative - use absolute values and preserve sign
  if (startValue < 0 && endValue < 0) {
    const absStart = Math.abs(startValue);
    const absEnd = Math.abs(endValue);
    const cagr = (Math.pow(absEnd / absStart, 1 / years) - 1) * 100;
    // If end is more negative (larger absolute), growth is negative
    return endValue < startValue ? cagr : -cagr;
  }
  
  // Standard calculation for positive values
  const ratio = endValue / startValue;
  const cagr = (Math.pow(ratio, 1 / years) - 1) * 100;
  
  return Number.isFinite(cagr) ? Number(cagr.toFixed(2)) : null;
}

/**
 * Get the value at a specific index from chronologically sorted data
 * Returns the metric value for CAGR calculation
 */
function getMetricValueAtIndex(
  data: Record<string, any>[],
  index: number,
  metricKey: string
): number | null {
  if (index < 0 || index >= data.length) return null;
  const value = data[index]?.[metricKey];
  if (value === null || value === undefined) return null;
  const numValue = Number(value);
  return Number.isFinite(numValue) ? numValue : null;
}

/**
 * Get the timestamp or fiscal year from a data entry for sorting
 */
function getEntryTimestampForCAGR(entry: Record<string, any>): number {
  if (entry?.date) {
    const parsed = Date.parse(entry.date);
    if (!Number.isNaN(parsed)) return parsed;
  }
  if (entry?.fiscalYear) {
    const year = Number(entry.fiscalYear);
    if (Number.isFinite(year)) return Date.UTC(year, 0, 1);
  }
  return 0;
}

/**
 * Sort financial statements chronologically (oldest first)
 */
export function sortStatementsChronologicallyForCAGR(
  data: Record<string, any>[]
): Record<string, any>[] {
  return [...data].sort((a, b) => 
    getEntryTimestampForCAGR(a) - getEntryTimestampForCAGR(b)
  );
}

/**
 * Calculate CAGR values for multiple time periods for a given metric
 * 
 * @param data - Array of financial statement data (will be sorted chronologically)
 * @param metricKey - The key of the metric to calculate CAGR for
 * @param periodType - 'annual' | 'quarterly' | 'ttm'
 * @returns Object with CAGR values for 1Y, 2Y, 5Y, 10Y periods
 */
export function calculatePeriodCAGRs(
  data: Record<string, any>[],
  metricKey: string,
  periodType: string = 'annual'
): { '1Y': number | null; '2Y': number | null; '5Y': number | null; '10Y': number | null } {
  const result = { '1Y': null as number | null, '2Y': null as number | null, '5Y': null as number | null, '10Y': null as number | null };
  
  if (!data || data.length < 2) return result;
  
  // Sort data chronologically (oldest first)
  const sortedData = sortStatementsChronologicallyForCAGR(data);
  
  // Get the most recent value (last in sorted array)
  const latestIndex = sortedData.length - 1;
  const latestValue = getMetricValueAtIndex(sortedData, latestIndex, metricKey);
  
  if (latestValue === null) return result;
  
  // Determine periods to look back based on periodType
  // For annual: 1 period = 1 year
  // For quarterly: 4 periods = 1 year
  const periodsPerYear = periodType === 'quarterly' || periodType === 'ttm' ? 4 : 1;
  
  const periods = [
    { key: '1Y' as const, years: 1 },
    { key: '2Y' as const, years: 2 },
    { key: '5Y' as const, years: 5 },
    { key: '10Y' as const, years: 10 },
  ];
  
  for (const { key, years } of periods) {
    const periodsBack = years * periodsPerYear;
    const startIndex = latestIndex - periodsBack;
    
    if (startIndex >= 0) {
      const startValue = getMetricValueAtIndex(sortedData, startIndex, metricKey);
      if (startValue !== null) {
        result[key] = calculateCAGR(startValue, latestValue, years);
      }
    }
  }
  
  return result;
}

/**
 * Format CAGR value for display with proper sign and percentage
 */
export function formatCAGRValue(value: number | null): string {
  if (value === null) return 'n/a';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Get CSS class for CAGR value based on positive/negative
 */
export function getCAGRColorClass(value: number | null): string {
  if (value === null) return 'text-gray-500 dark:text-zinc-400';
  if (value > 0) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30';
  if (value < 0) return 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/30';
  return 'text-gray-600 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800';
}

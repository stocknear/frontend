import { abbreviateNumber } from "$lib/utils";
import {
  chat_graph_pe_ratio,
  heatmap_metric_price_change,
  stock_detail_market_cap,
  stock_detail_net_income_ttm,
  stock_detail_revenue,
} from "$lib/paraglide/messages.js";

export type HeatmapIndex = {
  symbol: string;
  name: string;
  category: string;
  tier: "free" | "pro";
  changes?: Record<string, number>;
};

export const HEATMAP_PERIODS = ["1D", "1W", "1M", "3M", "6M", "1Y", "3Y"];
export const DEFAULT_PERIOD = "1D";
export const DEFAULT_INDEX = "SPY";
export const DEFAULT_METRIC = "performance";

const finite = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

/**
 * What a tile prints and what it is coloured by. Tile size always stays market cap, and
 * switching metric never refetches -- every number is already in the payload. `id` doubles
 * as the ?d= slug, and `label` stays a function because calling it at module scope would
 * freeze the locale at import time.
 */
export const HEATMAP_METRICS = [
  {
    id: DEFAULT_METRIC,
    label: () => heatmap_metric_price_change(),
    value: (custom: any) => finite(custom?.change),
    format: (value: number) => `${value > 0 ? "+" : ""}${value?.toFixed(2)}%`,
  },
  {
    id: "market-cap",
    label: () => stock_detail_market_cap(),
    value: (_custom: any, pointValue?: number) => finite(pointValue),
    format: (value: number) => abbreviateNumber(value, true),
  },
  {
    id: "revenue",
    label: () => stock_detail_revenue(),
    value: (custom: any) => finite(custom?.revenue),
    format: (value: number) => abbreviateNumber(value, true),
  },
  {
    id: "net-income",
    label: () => stock_detail_net_income_ttm(),
    value: (custom: any) => finite(custom?.netIncome),
    format: (value: number) => abbreviateNumber(value, true),
  },
  {
    id: "pe",
    label: () => chat_graph_pe_ratio(),
    value: (custom: any) => finite(custom?.pe),
    format: (value: number) => value?.toFixed(2),
  },
];

export function validPeriod(period: unknown): string {
  return HEATMAP_PERIODS?.includes(period as string)
    ? (period as string)
    : DEFAULT_PERIOD;
}

export function validMetric(metric: unknown): string {
  return HEATMAP_METRICS?.some((entry) => entry?.id === metric)
    ? (metric as string)
    : DEFAULT_METRIC;
}

export function metricLabel(metric: string): string {
  return (
    HEATMAP_METRICS?.find((entry) => entry?.id === metric)?.label?.() ?? ""
  );
}

/**
 * The number the selected metric is worth for a tile, or null when the company has no
 * value for it. Also what the tile is coloured by: the axis is clamped to a few percent,
 * so a fundamental in the billions simply saturates -- positive green, negative red.
 */
export function metricValue(
  custom: any,
  pointValue: number | undefined,
  metric: string,
): number | null {
  return (
    HEATMAP_METRICS?.find((entry) => entry?.id === metric)?.value?.(
      custom,
      pointValue,
    ) ?? null
  );
}

export function formatMetric(
  custom: any,
  pointValue: number | undefined,
  metric: string,
): string {
  const value = metricValue(custom, pointValue, metric);
  if (value === null) return "";

  const formatted = HEATMAP_METRICS?.find(
    (entry) => entry?.id === metric,
  )?.format?.(value);
  // abbreviateNumber renders a missing number as "-", which reads as data loss on a tile.
  return !formatted || formatted === "-" ? "" : formatted;
}

/** Pro and Plus both unlock the non-default indexes, matching the rest of the site. */
export function isEntitled(tier: unknown): boolean {
  return ["Pro", "Plus"]?.includes(tier as string);
}

export function canUseIndex(
  index: HeatmapIndex | undefined,
  entitled: boolean | undefined,
): boolean {
  return !!index && (index?.tier === "free" || entitled === true);
}

const TABS_KEY = "sn_heatmap_tabs";
export const DEFAULT_TABS = ["SPY", "QQQ", "DIA"];

export function loadTabs(): string[] {
  if (typeof localStorage === "undefined") return DEFAULT_TABS;

  try {
    const saved = JSON.parse(localStorage.getItem(TABS_KEY) ?? "null");
    // Nothing stored or unparseable -> defaults. A stored empty array is a choice,
    // not a fault: restoring the defaults there would silently undo a deselection.
    // The active index still gets a tab, via the visibleTabs invariant on the page.
    if (!Array.isArray(saved)) return DEFAULT_TABS;

    return saved?.filter(
      (symbol) => typeof symbol === "string" && symbol?.length > 0,
    );
  } catch {
    return DEFAULT_TABS;
  }
}

export function saveTabs(tabs: string[]): void {
  if (typeof localStorage === "undefined") return;

  try {
    localStorage.setItem(TABS_KEY, JSON.stringify(tabs));
  } catch (error) {
    console.warn("Failed to persist heatmap tabs:", error);
  }
}

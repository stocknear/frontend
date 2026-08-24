import {
  getLocalTimeZone,
  today,
  type DateValue,
} from "@internationalized/date";

const MS_PER_DAY = 86_400_000;

/**
 * Today (and anything later) is served by the live feed, not the historical
 * endpoint. Reads "today" fresh on every call so a tab left open past midnight
 * stops treating yesterday as live.
 */
export function isLiveFlowDate(value: DateValue): boolean {
  return value.compare(today(getLocalTimeZone())) >= 0;
}

export const OPTIONS_FLOW_LIVE_STORAGE_KEY = "options-flow-live-enabled";
export const UNUSUAL_ORDER_FLOW_LIVE_STORAGE_KEY =
  "unusual-order-flow-live-enabled";

export const OPTIONS_FLOW_NUMERIC_RULES = [
  "cost_basis",
  "size",
  "volume",
  "open_interest",
  "bullish_premium_pct",
  "bearish_premium_pct",
  "volumeOIRatio",
  "sizeOIRatio",
  "date_expiration",
] as const;

export const OPTIONS_FLOW_CATEGORICAL_RULES = [
  "moneyness",
  "flowType",
  "put_call",
  "sentiment",
  "execution_estimate",
  "option_activity_type",
  "underlying_type",
  "trade_leg_type",
] as const;

export const UNUSUAL_FLOW_NUMERIC_RULES = [
  "size",
  "volume",
  "premium",
  "sizeVolRatio",
  "sizeAvgVolRatio",
] as const;

export const UNUSUAL_FLOW_CATEGORICAL_RULES = [
  "assetType",
  "exchange",
  "transactionType",
] as const;

export function isActiveFlowFilterValue(value: unknown): boolean {
  if (value == null) return false;

  if (typeof value === "number") return Number.isFinite(value);

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized !== "" && normalized !== "any";
  }

  if (Array.isArray(value)) {
    const populatedValues = value.filter(
      (item) =>
        item != null && (typeof item !== "string" || item.trim() !== ""),
    );
    return (
      populatedValues.length > 0 &&
      populatedValues.every(
        (item) =>
          (typeof item === "number" && Number.isFinite(item)) ||
          (typeof item === "string" &&
            item.trim() !== "" &&
            item.trim().toLowerCase() !== "any"),
      )
    );
  }

  return false;
}

export function parseFlowNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;

  const normalized = value.replace(/[%$,]/g, "").trim().toUpperCase();
  const match = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))([KMB]?)$/.exec(normalized);
  if (!match) return null;

  const multipliers: Record<string, number> = {
    "": 1,
    K: 1_000,
    M: 1_000_000,
    B: 1_000_000_000,
  };
  const parsed = Number(match[1]) * multipliers[match[2]];
  return Number.isFinite(parsed) ? parsed : null;
}

export function isValidFlowNumericFilterValue(
  value: unknown,
  condition: unknown,
): boolean {
  if (!["over", "under", "between", "exactly"].includes(String(condition))) {
    return false;
  }

  if (condition !== "between") return parseFlowNumber(value) != null;
  if (!Array.isArray(value) || value.length === 0 || value.length > 2) {
    return false;
  }

  let hasEndpoint = false;
  for (const endpoint of value) {
    if (
      endpoint == null ||
      (typeof endpoint === "string" && endpoint.trim() === "")
    ) {
      continue;
    }
    if (parseFlowNumber(endpoint) == null) return false;
    hasEndpoint = true;
  }
  return hasEndpoint;
}

export function normalizeFlowRules(
  rules: unknown,
  numericRuleNames: readonly string[],
  categoricalRuleNames: readonly string[],
): Record<string, any>[] {
  if (!Array.isArray(rules)) return [];

  const numericRules = new Set(numericRuleNames);
  const categoricalRules = new Set(categoricalRuleNames);
  const normalized: Record<string, any>[] = [];

  for (const candidate of rules) {
    if (
      !candidate ||
      typeof candidate !== "object" ||
      Array.isArray(candidate)
    ) {
      continue;
    }
    const rule = candidate as Record<string, unknown>;
    const name = typeof rule.name === "string" ? rule.name : "";
    if (!name) continue;

    if (numericRules.has(name)) {
      if (!isValidFlowNumericFilterValue(rule.value, rule.condition)) continue;
      const value =
        rule.condition === "between" && Array.isArray(rule.value)
          ? rule.value.map((endpoint) => parseFlowNumber(endpoint))
          : parseFlowNumber(rule.value);
      normalized.push({ ...rule, value });
      continue;
    }

    if (categoricalRules.has(name) || Array.isArray(rule.value)) {
      const rawValues = Array.isArray(rule.value) ? rule.value : [rule.value];
      // "any" is the UI's no-selection sentinel. Drop it per entry so a stale
      // ["any", "Bullish"] still filters on Bullish; malformed entries still
      // reject the whole rule.
      const values = rawValues.filter(
        (value) =>
          typeof value !== "string" || value.trim().toLowerCase() !== "any",
      );
      if (
        values.length === 0 ||
        !values.every(
          (value) => typeof value === "string" && value.trim() !== "",
        )
      ) {
        continue;
      }
      normalized.push({
        ...rule,
        value: Array.isArray(rule.value)
          ? values.map((value) => String(value).trim())
          : String(values[0]).trim(),
      });
      continue;
    }

    if (isActiveFlowFilterValue(rule.value)) normalized.push({ ...rule });
  }

  return normalized;
}

export function compareFlowDte(
  left: unknown,
  right: unknown,
  order: string,
): number {
  const leftDte =
    typeof left === "number" && Number.isFinite(left) ? left : null;
  const rightDte =
    typeof right === "number" && Number.isFinite(right) ? right : null;

  if (leftDte == null) return rightDte == null ? 0 : 1;
  if (rightDte == null) return -1;
  return order === "asc" ? leftDte - rightDte : rightDte - leftDte;
}

export function parseStoredBoolean(
  value: string | null,
  fallback: boolean,
): boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

type StorageReader = { getItem(key: string): string | null };
type StorageWriter = { setItem(key: string, value: string): void };

export function readStoredBoolean(
  storage: StorageReader,
  key: string,
  fallback: boolean,
): boolean {
  try {
    return parseStoredBoolean(storage.getItem(key), fallback);
  } catch {
    return fallback;
  }
}

export function writeStoredBoolean(
  storage: StorageWriter,
  key: string,
  value: boolean,
): void {
  try {
    storage.setItem(key, String(value));
  } catch {
    // Storage may be disabled; keep the in-memory preference working.
  }
}

function calendarDateUtc(value: unknown): number | null {
  const date = String(value ?? "");
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return timestamp;
}

export function calendarDayDifference(
  laterDate: unknown,
  earlierDate: unknown,
): number | null {
  const later = calendarDateUtc(laterDate);
  const earlier = calendarDateUtc(earlierDate);
  if (later == null || earlier == null) return null;
  return (later - earlier) / MS_PER_DAY;
}

export type FlowStatTotals = {
  callVolumeSum: number;
  putVolumeSum: number;
  callPremiumSum: number;
  putPremiumSum: number;
  bullishPremiumSum: number;
  bearishPremiumSum: number;
};

export function createFlowStatTotals(): FlowStatTotals {
  return {
    callVolumeSum: 0,
    putVolumeSum: 0,
    callPremiumSum: 0,
    putPremiumSum: 0,
    bullishPremiumSum: 0,
    bearishPremiumSum: 0,
  };
}

/**
 * Folds trades into `totals` in place. Mirrors `compute_stats()` in
 * backend/app/utils/options_flow_filter.py field for field, so totals seeded from a
 * server payload and advanced with live trades stay equal to a full server recompute.
 */
export function accumulateFlowStats(
  totals: FlowStatTotals,
  rows: any[] = [],
): FlowStatTotals {
  for (const item of rows) {
    const volume = Number(item?.size) || 0;
    const premium = Number(item?.cost_basis) || 0;

    if (item?.put_call === "Calls") {
      totals.callVolumeSum += volume;
      totals.callPremiumSum += premium;
    } else if (item?.put_call === "Puts") {
      totals.putVolumeSum += volume;
      totals.putPremiumSum += premium;
    }

    if (item?.sentiment === "Bullish") {
      totals.bullishPremiumSum += premium;
    } else if (item?.sentiment === "Bearish") {
      totals.bearishPremiumSum += premium;
    }
  }
  return totals;
}

/** Ratios and percentages the options-flow summary cards render. */
export function deriveFlowStatDisplays(totals: FlowStatTotals) {
  const totalVolume = totals.callVolumeSum + totals.putVolumeSum;
  const callPercentage =
    totalVolume !== 0
      ? Math.floor((totals.callVolumeSum / totalVolume) * 100)
      : 0;

  const directionalPremium =
    totals.bullishPremiumSum + totals.bearishPremiumSum;
  const bullishPercentage =
    directionalPremium !== 0
      ? Math.round((totals.bullishPremiumSum / directionalPremium) * 100)
      : 0;

  return {
    putCallRatio:
      totals.callVolumeSum !== 0
        ? totals.putVolumeSum / totals.callVolumeSum
        : 0,
    callPercentage,
    putPercentage: totalVolume !== 0 ? 100 - callPercentage : 0,
    bullishPercentage,
    bearishPercentage: directionalPremium !== 0 ? 100 - bullishPercentage : 0,
  };
}

export type UnusualStatTotals = {
  totalVolume: number;
  totalValue: number;
  darkPoolCount: number;
  blockOrderCount: number;
  stockCount: number;
  etfCount: number;
};

export function createUnusualStatTotals(): UnusualStatTotals {
  return {
    totalVolume: 0,
    totalValue: 0,
    darkPoolCount: 0,
    blockOrderCount: 0,
    stockCount: 0,
    etfCount: 0,
  };
}

/**
 * Folds unusual orders into `totals` in place. Mirrors `compute_stats()` in
 * backend/app/utils/unusual_order_filter.py, including its exact-case comparisons
 * against the stored `DP` / `B` and `Stock` / `ETF` values.
 */
export function accumulateUnusualStats(
  totals: UnusualStatTotals,
  rows: any[] = [],
): UnusualStatTotals {
  for (const item of rows) {
    totals.totalVolume += Number(item?.size) || 0;
    totals.totalValue += Number(item?.premium) || 0;

    if (item?.transactionType === "DP") totals.darkPoolCount += 1;
    else if (item?.transactionType === "B") totals.blockOrderCount += 1;

    if (item?.assetType === "Stock") totals.stockCount += 1;
    else if (item?.assetType === "ETF") totals.etfCount += 1;
  }
  return totals;
}

/** Percentages the unusual-order-flow split bars render. */
export function deriveUnusualStatDisplays(totals: UnusualStatTotals) {
  const transactions = totals.darkPoolCount + totals.blockOrderCount;
  const darkPoolPercentage =
    transactions !== 0
      ? Math.floor((totals.darkPoolCount / transactions) * 100)
      : 0;

  const assets = totals.stockCount + totals.etfCount;
  const stockPercentage =
    assets !== 0 ? Math.floor((totals.stockCount / assets) * 100) : 0;

  return {
    darkPoolPercentage,
    blockOrderPercentage: transactions !== 0 ? 100 - darkPoolPercentage : 0,
    stockPercentage,
    etfPercentage: assets !== 0 ? 100 - stockPercentage : 0,
  };
}

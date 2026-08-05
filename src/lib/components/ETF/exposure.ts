import {
  etf_reverse_lookup_column_asset_class,
  etf_reverse_lookup_filter_any,
  etf_reverse_lookup_filter_assets_label,
  etf_reverse_lookup_filter_assets_over_100b,
  etf_reverse_lookup_filter_assets_over_10b,
  etf_reverse_lookup_filter_assets_over_1b,
  etf_reverse_lookup_filter_weight_label,
  etf_reverse_lookup_filter_weight_over_1,
  etf_reverse_lookup_filter_weight_over_10,
  etf_reverse_lookup_filter_weight_over_5,
  etf_reverse_lookup_column_change,
  etf_reverse_lookup_column_expense_ratio,
  etf_reverse_lookup_column_fund_assets,
  etf_reverse_lookup_column_holdings,
  etf_reverse_lookup_column_inception,
  etf_reverse_lookup_column_issuer,
  etf_reverse_lookup_column_market_value,
  etf_reverse_lookup_column_price,
  etf_reverse_lookup_column_shares,
  etf_reverse_lookup_column_weight,
} from "$lib/paraglide/messages";

export type ExposureRow = {
  symbol: string;
  name: string | null;
  weightPercentage: number | null;
  marketValue: number | null;
  sharesNumber: number | null;
  price: number | null;
  changesPercentage: number | null;
  marketCap: number | null;
  // Joined onto every row by cron_etf_asset_exposure.py. Absent on payloads
  // written before that change shipped, hence optional.
  expenseRatio?: number | null;
  assetsUnderManagement?: number | null;
  etfCompany?: string | null;
  assetClass?: string | null;
  inceptionDate?: string | null;
  holdingsCount?: number | null;
  domicile?: string | null;
  // Derived by prepareExposureRows before the rows reach the table.
  rank?: number | null;
  fundAssets?: number | null;
  assetType?: string;
};

/**
 * Column metadata for Table.svelte. `rule` is the row key; `type` selects the
 * formatter. Passed as `specificRows` so these keys join the column picker
 * alongside the table's own set — the same hook /etf/[tickerID]/holdings uses.
 */
export const EXPOSURE_SPECIFIC_ROWS = () => [
  { name: etf_reverse_lookup_column_weight(), rule: "weightPercentage", type: "percent" },
  { name: etf_reverse_lookup_column_shares(), rule: "sharesNumber", type: "int" },
  { name: etf_reverse_lookup_column_expense_ratio(), rule: "expenseRatio", type: "percent" },
  { name: etf_reverse_lookup_column_fund_assets(), rule: "fundAssets", type: "dollarInt" },
  { name: etf_reverse_lookup_column_market_value(), rule: "marketValue", type: "int" },
  { name: etf_reverse_lookup_column_issuer(), rule: "etfCompany", type: "string" },
  { name: etf_reverse_lookup_column_asset_class(), rule: "assetClass", type: "string" },
  { name: etf_reverse_lookup_column_inception(), rule: "inceptionDate", type: "string" },
  { name: etf_reverse_lookup_column_holdings(), rule: "holdingsCount", type: "int" },
];

/**
 * The columns shown before the reader touches the column picker.
 *
 * `price` and `changesPercentage` come from Table.svelte's own metadata and are
 * the two the websocket feed keeps live, so they stay visible by default.
 */
export const EXPOSURE_DEFAULT_LIST = () => [
  { name: etf_reverse_lookup_column_weight(), rule: "weightPercentage" },
  { name: etf_reverse_lookup_column_shares(), rule: "sharesNumber" },
  { name: etf_reverse_lookup_column_price(), rule: "price" },
  { name: etf_reverse_lookup_column_change(), rule: "changesPercentage" },
  { name: etf_reverse_lookup_column_expense_ratio(), rule: "expenseRatio" },
  { name: etf_reverse_lookup_column_fund_assets(), rule: "fundAssets" },
];

/**
 * Fund assets, preferring the value the fund itself reports. The exposure row's
 * `marketCap` comes from the ETF quote and disagrees with the fund's own filing
 * for share-class families (VTI quotes 623B against a reported 2.3T), so it is
 * only a fallback for funds whose profile omits the figure.
 */
export function fundAssets(row: ExposureRow | null | undefined): number | null {
  const reported = row?.assetsUnderManagement;
  if (typeof reported === "number" && Number.isFinite(reported)) return reported;

  const quoted = row?.marketCap;
  return typeof quoted === "number" && Number.isFinite(quoted) ? quoted : null;
}

/**
 * Shape the raw exposure payload for Table.svelte.
 *
 * - `rank` is assigned by shares held, 1 = most, computed over the whole set so
 *   it stays fixed while the reader sorts or filters.
 * - `fundAssets` is resolved once, so the column, the sort and the summary card
 *   can never disagree about what "Fund Assets" means.
 * - `assetType` makes the symbol cell link to /etf/… instead of /stocks/….
 */
export function prepareExposureRows(rows: ExposureRow[]): ExposureRow[] {
  const ranked = [...(rows ?? [])]
    // Not Number(v): Number(null) is 0, which would rank a fund with no
    // reported share count as if it held nothing.
    ?.filter(
      (row) => typeof row?.sharesNumber === "number" && Number.isFinite(row?.sharesNumber),
    )
    ?.sort((left, right) => Number(right?.sharesNumber) - Number(left?.sharesNumber));

  const rankBySymbol = new Map(ranked?.map((row, index) => [row?.symbol, index + 1]));

  return (
    rows?.map((row) => ({
      ...row,
      rank: rankBySymbol.get(row?.symbol) ?? null,
      fundAssets: fundAssets(row),
      assetType: "etf",
    })) ?? []
  );
}

export type ExposureSummary = {
  fundCount: number;
  totalExposure: number | null;
  averageWeight: number | null;
  combinedAssets: number | null;
};

/**
 * `totalExposure` sums the reported position values rather than deriving them
 * from weight x assets: the two agree on the funds that report both, and the
 * reported figure survives when a fund omits its assets.
 */
export function summarize(rows: ExposureRow[]): ExposureSummary {
  const fundCount = rows?.length ?? 0;
  if (!fundCount) {
    return { fundCount: 0, totalExposure: null, averageWeight: null, combinedAssets: null };
  }

  let exposure = 0;
  let exposureCount = 0;
  let weight = 0;
  let weightCount = 0;
  let assets = 0;
  let assetsCount = 0;

  for (const row of rows) {
    const value = row?.marketValue;
    if (typeof value === "number" && Number.isFinite(value)) {
      exposure += value;
      exposureCount += 1;
    }

    const rowWeight = row?.weightPercentage;
    if (typeof rowWeight === "number" && Number.isFinite(rowWeight)) {
      weight += rowWeight;
      weightCount += 1;
    }

    const rowAssets = fundAssets(row);
    if (rowAssets !== null) {
      assets += rowAssets;
      assetsCount += 1;
    }
  }

  return {
    fundCount,
    totalExposure: exposureCount ? exposure : null,
    averageWeight: weightCount ? weight / weightCount : null,
    combinedAssets: assetsCount ? assets : null,
  };
}

/**
 * "At least" dropdowns for Table.svelte's control bar. `key` is the row field;
 * a value of 0 means no constraint. `fundAssets` is the resolved figure, so the
 * filter and the column agree.
 */
export const EXPOSURE_QUICK_FILTERS = () => [
  {
    key: "weightPercentage",
    label: etf_reverse_lookup_filter_weight_label(),
    options: [
      { label: etf_reverse_lookup_filter_any(), value: 0 },
      { label: etf_reverse_lookup_filter_weight_over_1(), value: 1 },
      { label: etf_reverse_lookup_filter_weight_over_5(), value: 5 },
      { label: etf_reverse_lookup_filter_weight_over_10(), value: 10 },
    ],
  },
  {
    key: "fundAssets",
    label: etf_reverse_lookup_filter_assets_label(),
    options: [
      { label: etf_reverse_lookup_filter_any(), value: 0 },
      { label: etf_reverse_lookup_filter_assets_over_1b(), value: 1e9 },
      { label: etf_reverse_lookup_filter_assets_over_10b(), value: 1e10 },
      { label: etf_reverse_lookup_filter_assets_over_100b(), value: 1e11 },
    ],
  },
];

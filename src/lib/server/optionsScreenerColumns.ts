// Columns the options screener feed is allowed to project, shared by the API
// proxy (src/routes/api/options-screener-feed/+server.ts) and the SSR pre-fetch
// (src/routes/options-screener/+page.server.ts). Both hit the same backend, so
// they must sanitise identically — unfiltered names can exceed the backend's
// max_length on displayColumns, which is a 422 and a blank first paint.
export const MAX_DISPLAY_COLUMNS = 50;

export const allowedDisplayColumns = new Set([
  "symbol",
  "name",
  "expiration",
  "strike",
  "optionType",
  "iv",
  "ivRank",
  "close",
  "moneynessPercentage",
  "volume",
  "oi",
  "delta",
  "gamma",
  "theta",
  "vega",
  "totalPrem",
  "changesPercentageOI",
  "assetType",
  "optionSymbol",
  "dte",
  "indexMembership",
  "marketCap",
  "marketCapGroup",
  "earningsDate",
  "earningsTime",
  "earningsGap",
]);

/** Filter arbitrary rule names down to a safe, capped displayColumns list. */
export function sanitizeDisplayColumns(names: (string | undefined)[]): string[] {
  return names
    .map((name) => name?.trim())
    .filter(
      (name): name is string =>
        !!name && allowedDisplayColumns.has(name),
    )
    .slice(0, MAX_DISPLAY_COLUMNS);
}

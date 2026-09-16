/**
 * The saved-filter selection lives in a cookie rather than localStorage because
 * every one of these pages renders its first table server-side from the active
 * filter's rules, so `load()` has to see the same id the client will show.
 */
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export const SAVED_FILTER_COOKIE = {
  optionsFlow: "options_flow_filter",
  stocksScreener: "stocks_screener_filter",
  optionsScreener: "options_screener_filter",
  coveredCallScreener: "covered_call_screener_filter",
  cashSecuredPutScreener: "cash_secured_put_screener_filter",
  etfsScreener: "etf_screener_filter",
  unusualOrderFlow: "unusual_order_flow_filter",
  chart: "chart_filter",
} as const;

/** The remembered filter, or the first one when the id is stale or missing. */
export function activeSavedFilter<T extends { id: string }>(
  list: T[] | undefined,
  savedId: string | undefined,
): T | undefined {
  return list?.find((item) => item.id === savedId) ?? list?.at(0);
}

export function rememberSavedFilter(cookieName: string, id: string): void {
  // Also runs during SSR, where there is no document and nothing to remember.
  if (typeof document === "undefined" || !id) return;
  document.cookie = `${cookieName}=${encodeURIComponent(id)}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}

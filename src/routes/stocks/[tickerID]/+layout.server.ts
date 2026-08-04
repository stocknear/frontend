import { checkMarketHourSSR } from "$lib/utils";
import { fetchWatchlist } from "$lib/server/watchlist";
import { fetchFollowedAnalysts } from "$lib/server/followedAnalysts";
import { postAPI } from "$lib/server/api";
import {
  getNativeContentLocales,
  resolveBackendLocale,
} from "$lib/i18n/backend-locales";
import { isUsableEntityPayload } from "$lib/seo/eligibility";
import {
  TtlCache,
  cleanCompanyName,
  createEntityPageLoader,
} from "$lib/server/entityPage";

const ENDPOINTS = Object.freeze([
  "/stockdeck",
  "/analyst-summary-rating",
  "/stock-quote",
  "/pre-post-quote",
  "/wiim",
  "/one-day-price",
  "/next-earnings",
  "/earnings-surprise",
  "/stock-news",
]);

const dataCache = new TtlCache();

const fetchPayload = async (locals, tickerID: string) => {
  // Stock content is localized, so the cache key must include the locale or a
  // German visitor would be served the English payload.
  const { effectiveLocale } = resolveBackendLocale(
    "stockBulkData",
    locals?.locale,
  );
  const cacheKey = `/bulk-data-${tickerID}-${effectiveLocale}`;
  const cached = dataCache.get(cacheKey);
  if (cached) return cached as Record<string, any>;

  const data = await postAPI(locals, "/bulk-data", {
    ticker: tickerID,
    endpoints: ENDPOINTS,
    lang: effectiveLocale,
  });
  // Never cache an empty payload — that is a backend failure, and caching it
  // served the failure to every visitor of this ticker for the whole window.
  if (isUsableEntityPayload(data)) dataCache.set(cacheKey, data);
  return data;
};

export const load = createEntityPageLoader({
  entity: "stock",
  label: "Stock",
  identityKey: "/stockdeck",
  identityFields: ["companyName", "symbol", "ticker"],
  availableLocales: getNativeContentLocales("stockBulkData"),
  fetchPayload,
  extras: async (locals) => {
    const [getUserWatchlist, getFollowedAnalysts] = await Promise.all([
      fetchWatchlist(locals?.pb, locals?.user?.id).catch(() => []),
      fetchFollowedAnalysts(locals?.pb, locals?.user).catch(() => []),
    ]);
    return { getUserWatchlist, getFollowedAnalysts };
  },
  shape: (payload, { extras }) => ({
    getStockDeck: payload?.["/stockdeck"] ?? {},
    getAnalystSummary: payload?.["/analyst-summary-rating"] ?? {},
    getStockQuote: payload?.["/stock-quote"] ?? {},
    getPrePostQuote: checkMarketHourSSR()
      ? {}
      : (payload?.["/pre-post-quote"] ?? {}),
    getWhyPriceMoved: payload?.["/wiim"] ?? {},
    getOneDayPrice: payload?.["/one-day-price"] ?? {},
    getNextEarnings: payload?.["/next-earnings"] ?? {},
    getEarningsSurprise: payload?.["/earnings-surprise"] ?? {},
    getNews: payload?.["/stock-news"] ?? {},
    getUserWatchlist: extras?.getUserWatchlist,
    getFollowedAnalysts: extras?.getFollowedAnalysts,
    companyName: cleanCompanyName(payload?.["/stockdeck"]?.companyName),
  }),
});

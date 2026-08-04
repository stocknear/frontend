import { checkMarketHourSSR } from "$lib/utils";
import { fetchWatchlist } from "$lib/server/watchlist";
import { postAPI } from "$lib/server/api";
import { isUsableEntityPayload } from "$lib/seo/eligibility";
import {
  TtlCache,
  cleanCompanyName,
  createEntityPageLoader,
} from "$lib/server/entityPage";

const ENDPOINTS = Object.freeze([
  "/etf-profile",
  "/etf-holdings",
  "/etf-sector-weighting",
  "/stock-dividend",
  "/stock-quote",
  "/pre-post-quote",
  "/wiim",
  "/one-day-price",
  "/stock-news",
]);

const dataCache = new TtlCache();

const fetchPayload = async (locals, tickerID: string) => {
  const cacheKey = `/bulk-data-${tickerID}`;
  const cached = dataCache.get(cacheKey);
  if (cached) return cached as Record<string, any>;

  const data = await postAPI(locals, "/bulk-data", {
    ticker: tickerID,
    endpoints: ENDPOINTS,
  });
  // Never cache an empty payload — that is a backend failure, and caching it
  // served the failure to every visitor of this ticker for the whole window.
  if (isUsableEntityPayload(data)) dataCache.set(cacheKey, data);
  return data;
};

export const load = createEntityPageLoader({
  entity: "etf",
  label: "ETF",
  identityKey: "/etf-profile",
  identityFields: ["name", "symbol", "ticker"],
  availableLocales: ["en"],
  fetchPayload,
  extras: async (locals) => ({
    getUserWatchlist: await fetchWatchlist(locals?.pb, locals?.user?.id).catch(
      () => [],
    ),
  }),
  shape: (payload, { extras }) => ({
    getETFProfile: payload?.["/etf-profile"] ?? [],
    getETFHoldings: payload?.["/etf-holdings"] ?? [],
    getETFSectorWeighting: payload?.["/etf-sector-weighting"] ?? [],
    getStockDividend: payload?.["/stock-dividend"] ?? [],
    getStockQuote: payload?.["/stock-quote"] ?? [],
    getPrePostQuote: checkMarketHourSSR()
      ? {}
      : (payload?.["/pre-post-quote"] ?? {}),
    getWhyPriceMoved: payload?.["/wiim"] ?? [],
    getOneDayPrice: payload?.["/one-day-price"] ?? [],
    getNews: payload?.["/stock-news"] ?? [],
    getUserWatchlist: extras?.getUserWatchlist,
    companyName: cleanCompanyName(payload?.["/etf-profile"]?.at(0)?.name),
  }),
});

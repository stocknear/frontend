import { checkMarketHourSSR } from "$lib/utils";
import { fetchWatchlist } from "$lib/server/watchlist";
import { postAPI } from "$lib/server/api";
import {
  getIndexProxyTicker,
  INDEX_HOLDINGS_PROXY_TICKERS,
} from "$lib/server/indexTickers";
import { isUsableEntityPayload } from "$lib/seo/eligibility";
import {
  TtlCache,
  cleanCompanyName,
  createEntityPageLoader,
} from "$lib/server/entityPage";

const ENDPOINTS = Object.freeze([
  "/index-profile",
  "/etf-holdings",
  "/etf-sector-weighting",
  "/stock-quote",
  "/pre-post-quote",
  "/wiim",
  "/one-day-price",
  "/stock-news",
]);

// Indices have no holdings feed of their own, so these read from a proxy ETF.
const SPY_PROXY_ENDPOINTS = Object.freeze([
  "/etf-holdings",
  "/etf-sector-weighting",
  "/wiim",
  "/stock-news",
]);

// The endpoints the 404/503 gate depends on. A failure in either must surface as
// an upstream error; swallowing the quote into [] removed the only fallback and
// 404'd legitimate indices.
const GATE_ENDPOINTS = new Set(["/index-profile", "/stock-quote"]);

const dataCache = new TtlCache();

const fetchEndpoint = async (locals, endpoint: string, tickerID: string) => {
  const useProxyTicker =
    tickerID?.toLowerCase() in INDEX_HOLDINGS_PROXY_TICKERS &&
    SPY_PROXY_ENDPOINTS?.includes(endpoint);
  const effectiveTicker = useProxyTicker
    ? getIndexProxyTicker(tickerID)
    : tickerID;

  const cacheKey = `${endpoint}-${effectiveTicker}`;
  const cached = dataCache.get(cacheKey);
  if (cached) return cached;

  const data = await postAPI(
    locals,
    endpoint,
    endpoint === "/etf-holdings"
      ? { ticker: effectiveTicker, assetType: "etf" }
      : { ticker: effectiveTicker },
  );
  // Never cache an empty payload — that is a backend failure, and caching it
  // served the failure to every visitor of this ticker for the whole window.
  if (isUsableEntityPayload(data)) dataCache.set(cacheKey, data);
  return data;
};

// Unlike stocks and ETFs there is no /bulk-data for indices, so the endpoints are
// fetched individually and reassembled into the same endpoint→data shape.
const fetchPayload = async (locals, tickerID: string) => {
  const values = await Promise.all(
    ENDPOINTS?.map((endpoint) => {
      const request = fetchEndpoint(locals, endpoint, tickerID);
      // Optional endpoints degrade; gate endpoints propagate.
      return GATE_ENDPOINTS?.has(endpoint) ? request : request.catch(() => []);
    }),
  );
  return Object.fromEntries(
    ENDPOINTS?.map((endpoint, position) => [endpoint, values?.[position]]),
  );
};

export const load = createEntityPageLoader({
  entity: "index",
  label: "Index",
  identityKey: "/index-profile",
  identityFields: ["name", "symbol", "ticker"],
  availableLocales: ["en"],
  fetchPayload,
  extras: async (locals) => ({
    getUserWatchlist: await fetchWatchlist(locals?.pb, locals?.user?.id).catch(
      () => [],
    ),
  }),
  shape: (payload, { extras }) => ({
    getIndexProfile: payload?.["/index-profile"] ?? [],
    getIndexHolding: payload?.["/etf-holdings"] ?? [],
    getIndexSectorWeighting: payload?.["/etf-sector-weighting"] ?? [],
    getStockQuote: payload?.["/stock-quote"] ?? [],
    getPrePostQuote: checkMarketHourSSR()
      ? {}
      : (payload?.["/pre-post-quote"] ?? {}),
    getWhyPriceMoved: payload?.["/wiim"] ?? [],
    getOneDayPrice: payload?.["/one-day-price"] ?? [],
    getNews: payload?.["/stock-news"] ?? [],
    getUserWatchlist: extras?.getUserWatchlist ?? [],
    companyName: cleanCompanyName(payload?.["/index-profile"]?.at(0)?.name),
  }),
});

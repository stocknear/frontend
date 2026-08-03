import { error, redirect } from "@sveltejs/kit";
import { checkMarketHourSSR} from "$lib/utils";
import { fetchWatchlist } from "$lib/server/watchlist";
import { postAPI } from "$lib/server/api";
import { getIndexProxyTicker, INDEX_HOLDINGS_PROXY_TICKERS } from "$lib/server/indexTickers";
import {
  canonicalizeSymbolInUrl,
  createSeoEligibility,
  hasEntityIdentity,
  hasFiniteMarketPrice,
  isUpstreamNotFound,
  resolveEntitySymbol,
} from "$lib/seo/eligibility";

// Pre-compile regex pattern and substrings for cleaning
const REMOVE_PATTERNS = {
  pattern: new RegExp(`\\b(${[
    "Depositary",
    "Inc.",
    "Incorporated",
    "Holdings",
    "Corporations",
    "LLC",
    "Holdings plc American Depositary Shares",
    "Holding Corporation",
    "Oyj",
    "Company",
    "The",
    "plc"
  ].join("|")})\\b|,`, "gi")
};

// Constants
const CACHE_DURATION = 30 * 1000;
const ENDPOINTS = Object.freeze([
  "/index-profile",
  "/etf-holdings",
  "/etf-sector-weighting",
  "/stock-quote",
  "/pre-post-quote",
  "/wiim",
  "/one-day-price",
  "/stock-news"
]);

const SPY_PROXY_ENDPOINTS = Object.freeze([
  "/etf-holdings",
  "/etf-sector-weighting",
  "/wiim",
  "/stock-news"
]);

// Memoized string cleaning function
const cleanString = (() => {
  const cache = new Map();
  return (input) => {
    if (!input) return '';
    if (cache.has(input)) return cache.get(input);
    const cleaned = input.replace(REMOVE_PATTERNS.pattern, '').trim();
    cache.set(input, cleaned);
    return cleaned;
  };
})();

// LRU Cache implementation with automatic cleanup
class LRUCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp >= CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  set(key, data) {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

const dataCache = new LRUCache();

// Main data fetching function with SPX/SPY handling
const fetchData = async (locals, endpoint, ticker) => {
  const useProxyTicker =
    ticker?.toLowerCase() in INDEX_HOLDINGS_PROXY_TICKERS &&
    SPY_PROXY_ENDPOINTS.includes(endpoint);

  const effectiveTicker = useProxyTicker ? getIndexProxyTicker(ticker) : ticker;

  const cacheKey = `${endpoint}-${effectiveTicker}`;
  const cachedData = dataCache.get(cacheKey);
  if (cachedData) return cachedData;

  const requestBody =
    endpoint === "/etf-holdings"
      ? { ticker: effectiveTicker, assetType: "etf" }
      : { ticker: effectiveTicker };
  const data = await postAPI(locals, endpoint, requestBody);
  dataCache.set(cacheKey, data);
  return data;
};

// Main load function with parallel fetching
export const load = async ({ params, locals, url }) => {
  const { pb, user } = locals;
  const requestedTicker = params.tickerID;
  const symbolResolution = resolveEntitySymbol(requestedTicker);
  if (!symbolResolution.valid) error(404, "Index not found");

  const tickerID = symbolResolution.canonicalSymbol;
  const canonicalRedirect = canonicalizeSymbolInUrl(
    url,
    requestedTicker,
    tickerID,
  );
  if (canonicalRedirect) redirect(308, canonicalRedirect);

  try {
    const promises = ENDPOINTS.map((endpoint) => {
      const request = fetchData(locals, endpoint, tickerID);
      return endpoint === "/index-profile" ? request : request.catch(() => []);
    });
    promises.push(fetchWatchlist(pb, user?.id).catch(() => []));

    const [
      getIndexProfile,
      getIndexHolding,
      getIndexSectorWeighting,
      getStockQuote,
      fetchedPrePostQuote,
      getWhyPriceMoved,
      getOneDayPrice,
      getNews,
      getUserWatchlist,
    ] = await Promise.all(promises);

    const getPrePostQuote = (checkMarketHourSSR() || {} ) ? {} : fetchedPrePostQuote;
    
    const hasIdentity = hasEntityIdentity(getIndexProfile, ["name", "symbol", "ticker"]);
    const hasPartialQuote = hasFiniteMarketPrice(getStockQuote);
    if (!hasIdentity && !hasPartialQuote) error(404, "Index not found");

    return {
      getIndexProfile: getIndexProfile || [],
      getIndexHolding: getIndexHolding || [],
      getIndexSectorWeighting: getIndexSectorWeighting || [],
      getStockQuote: getStockQuote || [],
      getPrePostQuote,
      getWhyPriceMoved: getWhyPriceMoved || [],
      getOneDayPrice: getOneDayPrice || [],
      getNews: getNews || [],
      getUserWatchlist: getUserWatchlist || [],
      companyName: cleanString(getIndexProfile?.at(0)?.name),
      getParams: tickerID,
      seoEligibility: createSeoEligibility({
        canonicalPath: url.pathname,
        availableLocales: ["en"],
        indexable: hasIdentity,
        reason: hasIdentity ? "eligible" : "insufficient-data",
      }),
    };
  } catch (cause) {
    if (isUpstreamNotFound(cause)) error(404, "Index not found");
    error(503, "Index data is temporarily unavailable");
  }
};

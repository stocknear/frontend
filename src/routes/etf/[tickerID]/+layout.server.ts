import { error, redirect } from "@sveltejs/kit";
import { checkMarketHourSSR} from "$lib/utils";
import { fetchWatchlist } from "$lib/server/watchlist";
import { postAPI } from "$lib/server/api";
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

// Constants
const CACHE_DURATION = 30 * 1000;
const ENDPOINTS = Object.freeze([
  "/etf-profile",
  "/etf-holdings",
  "/etf-sector-weighting",
  "/stock-dividend",
  "/stock-quote",
  "/pre-post-quote",
  "/wiim",
  "/one-day-price",
  "/stock-news"
]);

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

// Main data fetching function
const fetchData = async (locals, ticker) => {
  const cacheKey = `/bulk-data-${ticker}`;
  const cachedData = dataCache.get(cacheKey);
  if (cachedData) return cachedData;

  const data = await postAPI(locals, "/bulk-data", { ticker, endpoints: ENDPOINTS });
  dataCache.set(cacheKey, data);
  return data;
};

// Main load function with parallel fetching
export const load = async ({ params, locals, url }) => {
  const { pb, user } = locals;
  const requestedTicker = params.tickerID;
  const symbolResolution = resolveEntitySymbol(requestedTicker);
  if (!symbolResolution.valid) error(404, "ETF not found");

  const tickerID = symbolResolution.canonicalSymbol;
  const canonicalRedirect = canonicalizeSymbolInUrl(
    url,
    requestedTicker,
    tickerID,
  );
  if (canonicalRedirect) redirect(308, canonicalRedirect);

  let bulkData;
  let userWatchlist;
  try {
    [bulkData, userWatchlist] = await Promise.all([
      fetchData(locals, tickerID),
      fetchWatchlist(pb, user?.id).catch(() => [])
    ]);
  } catch (cause) {
    if (isUpstreamNotFound(cause)) error(404, "ETF not found");
    error(503, "ETF data is temporarily unavailable");
  }

  const {
    '/etf-profile': getETFProfile = [],
    '/etf-holdings': getETFHoldings = [],
    '/etf-sector-weighting': getETFSectorWeighting = [],
    '/stock-dividend': getStockDividend = [],
    '/stock-quote': getStockQuote = [],
    '/pre-post-quote': fetchedPrePostQuote = {},
    '/wiim': getWhyPriceMoved = [],
    '/one-day-price': getOneDayPrice = [],
    '/stock-news': getNews = []
  } = bulkData;

  const hasIdentity = hasEntityIdentity(getETFProfile, ["name", "symbol", "ticker"]);
  const hasPartialQuote = hasFiniteMarketPrice(getStockQuote);
  if (!hasIdentity && !hasPartialQuote) error(404, "ETF not found");

  // override if market is closed
  const getPrePostQuote = checkMarketHourSSR() ?  {} : fetchedPrePostQuote;

  return {
    getETFProfile,
    getETFHoldings,
    getETFSectorWeighting,
    getStockDividend,
    getStockQuote,
    getPrePostQuote,
    getWhyPriceMoved,
    getOneDayPrice,
    getNews,
    getUserWatchlist: userWatchlist,
    companyName: cleanString(getETFProfile?.at(0)?.name),
    getParams: tickerID,
    seoEligibility: createSeoEligibility({
      canonicalPath: url.pathname,
      availableLocales: ["en"],
      indexable: hasIdentity,
      reason: hasIdentity ? "eligible" : "insufficient-data",
    }),
  };
};

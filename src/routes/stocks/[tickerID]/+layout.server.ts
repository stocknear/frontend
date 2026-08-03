import { error, redirect } from "@sveltejs/kit";
import { checkMarketHourSSR} from "$lib/utils";
import { fetchWatchlist } from "$lib/server/watchlist";
import { fetchFollowedAnalysts } from "$lib/server/followedAnalysts";
import { postAPI } from "$lib/server/api";
import {
  getNativeContentLocales,
  resolveBackendLocale,
  type BackendLocale,
} from "$lib/i18n/backend-locales";
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
const CACHE_DURATION =  30 * 1000;
const ENDPOINTS = Object.freeze([
  "/stockdeck",
  "/analyst-summary-rating",
  "/stock-quote",
  "/pre-post-quote",
  "/wiim",
  "/one-day-price",
  "/next-earnings",
  "/earnings-surprise",
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
const fetchData = async (locals, ticker, lang: BackendLocale = "en") => {
  const cacheKey = `/bulk-data-${ticker}-${lang}`;
  const cachedData = dataCache.get(cacheKey);
  if (cachedData) return cachedData;

  try {
    const data = await postAPI(locals, "/bulk-data", { ticker, endpoints: ENDPOINTS, lang });
    dataCache.set(cacheKey, data);
    return data;
  } catch (error) {
    throw error;
  }
};

// Main load function with parallel fetching
export const load = async ({ params, locals, url }) => {
  const { pb, user, locale } = locals;
  const requestedTicker = params.tickerID;
  const symbolResolution = resolveEntitySymbol(requestedTicker);
  if (!symbolResolution.valid) error(404, "Stock not found");

  const tickerID = symbolResolution.canonicalSymbol;
  const canonicalRedirect = canonicalizeSymbolInUrl(
    url,
    requestedTicker,
    tickerID,
  );
  if (canonicalRedirect) redirect(308, canonicalRedirect);

  const { effectiveLocale } = resolveBackendLocale("stockBulkData", locale);

  let stockData;
  let userWatchlist;
  let followedAnalysts;
  try {
    [stockData, userWatchlist, followedAnalysts] = await Promise.all([
      fetchData(locals, tickerID, effectiveLocale),
      fetchWatchlist(pb, user?.id).catch(() => []),
      fetchFollowedAnalysts(pb, user).catch(() => [])
    ]);
  } catch (cause) {
    if (isUpstreamNotFound(cause)) error(404, "Stock not found");
    error(503, "Stock data is temporarily unavailable");
  }

  const {
    '/stockdeck': getStockDeck = {},
    '/analyst-summary-rating': getAnalystSummary = {},
    '/stock-quote': getStockQuote = {},
    '/pre-post-quote': fetchedPrePostQuote = {},
    '/wiim': getWhyPriceMoved = {},
    '/one-day-price': getOneDayPrice = {},
    '/next-earnings': getNextEarnings = {},
    '/earnings-surprise': getEarningsSurprise = {},
    '/stock-news': getNews = {}
  } = stockData;

  const hasIdentity = hasEntityIdentity(getStockDeck, [
    "companyName",
    "symbol",
    "ticker",
  ]);
  const hasPartialQuote = hasFiniteMarketPrice(getStockQuote);
  if (!hasIdentity && !hasPartialQuote) error(404, "Stock not found");

  // Decide based on market hours
  const getPrePostQuote = checkMarketHourSSR() ?  {} : fetchedPrePostQuote;
  return {
    getStockDeck,
    getAnalystSummary,
    getStockQuote,
    getPrePostQuote,
    getWhyPriceMoved,
    getOneDayPrice,
    getNextEarnings,
    getEarningsSurprise,
    getNews,
    getUserWatchlist: userWatchlist,
    getFollowedAnalysts: followedAnalysts,
    companyName: cleanString(getStockDeck?.companyName),
    getParams: tickerID,
    seoEligibility: createSeoEligibility({
      canonicalPath: url.pathname,
      availableLocales: getNativeContentLocales("stockBulkData"),
      indexable: hasIdentity,
      reason: hasIdentity ? "eligible" : "insufficient-data",
    }),
  };
};

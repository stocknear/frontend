import { checkMarketHourSSR} from "$lib/utils";
import { fetchWatchlist } from "$lib/server/watchlist";
import { postAPI } from "$lib/server/api";

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
const fetchData = async (locals, ticker, lang = "en") => {
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
export const load = async ({ params, locals }) => {
  const { pb, user, locale } = locals;
  const { tickerID } = params;

  if (!tickerID) {
    return { error: 'Invalid ticker ID' };
  }

  try {
    const [stockData, userWatchlist] = await Promise.all([
      fetchData(locals, tickerID, locale ?? "en"),
      fetchWatchlist(pb, user?.id)
    ]);

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
      companyName: cleanString(getStockDeck?.companyName),
      getParams: tickerID
    };
  } catch (error) {
    return { error: 'Failed to load stock data' };
  }
};

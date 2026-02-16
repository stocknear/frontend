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

  try {
    const data = await postAPI(locals, "/bulk-data", { ticker, endpoints: ENDPOINTS });
    dataCache.set(cacheKey, data);
    return data;
  } catch (error) {
    return [];
  }
};

// Main load function with parallel fetching
export const load = async ({ params, locals }) => {
  const { pb, user } = locals;
  const { tickerID } = params;

  if (!tickerID) {
    return getDefaultResponse(tickerID);
  }

  try {
    const [bulkData, userWatchlist] = await Promise.all([
      fetchData(locals, tickerID),
      fetchWatchlist(pb, user?.id)
    ]);

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
      getParams: tickerID
    };
  } catch (error) {
    return getDefaultResponse(tickerID);
  }
};


// Helper function to generate default response
const getDefaultResponse = (tickerID) => ({
  getETFProfile: [],
  getETFHoldings: [],
  getETFSectorWeighting: [],
  getStockDividend: [],
  getStockQuote: [],
  getPrePostQuote: [],
  getWhyPriceMoved: [],
  getOneDayPrice: [],
  getNews: [],
  getUserWatchlist: [],
  companyName: '',
  getParams: tickerID
});

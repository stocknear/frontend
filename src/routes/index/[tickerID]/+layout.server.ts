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

const INDEX_TO_ETF = {
  "^spx": "SPY",
  "^dji": "DIA",
  "^ixic": "QQQ",
  "^rut": "IWM",
};

// Main data fetching function with SPX/SPY handling
const fetchData = async (locals, endpoint, ticker) => {
  const useProxyTicker =
    ticker?.toLowerCase() in INDEX_TO_ETF &&
    SPY_PROXY_ENDPOINTS.includes(endpoint);

  const effectiveTicker =
    useProxyTicker ? INDEX_TO_ETF[ticker.toLowerCase()] : ticker;

  const cacheKey = `${endpoint}-${effectiveTicker}`;
  const cachedData = dataCache.get(cacheKey);
  if (cachedData) return cachedData;

  try {
    const data = await postAPI(locals, endpoint, { ticker: effectiveTicker });
    dataCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return [];
  }
};

// Helper function to generate default response
const getDefaultResponse = (tickerID) => ({
  getIndexProfile: [],
  getIndexHolding: [],
  getIndexSectorWeighting: [],
  getStockQuote: [],
  getPrePostQuote: [],
  getWhyPriceMoved: [],
  getOneDayPrice: [],
  getNews: [],
  getUserWatchlist: [],
  companyName: '',
  getParams: tickerID
});

// Main load function with parallel fetching
export const load = async ({ params, locals }) => {
  const { pb, user } = locals;
  const { tickerID } = params;

  if (!tickerID) {
    return getDefaultResponse(tickerID);
  }

  try {
    const promises = ENDPOINTS.map(endpoint =>
      fetchData(locals, endpoint, tickerID)
    );
    promises.push(fetchWatchlist(pb, user?.id));

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
      getParams: tickerID
    };
  } catch (error) {
    console.error('Error in load function:', error);
    return getDefaultResponse(tickerID);
  }
};

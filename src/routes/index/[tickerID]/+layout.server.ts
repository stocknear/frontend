import { checkMarketHourSSR} from "$lib/utils";

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
const CACHE_DURATION = 30 * 1000; // 5 minutes
const REQUEST_TIMEOUT = 2000; // 5 seconds
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

// Optimized fetch function with AbortController and timeout
const fetchWithTimeout = async (url, options, timeout) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
};

// Main data fetching function with SPX/SPY handling
const fetchData = async (apiURL, apiKey, endpoint, ticker) => {
  const INDEX_TO_ETF = {
    "^spx": "SPY",     // S&P 500
    "^dji": "DIA",     // Dow Jones Industrial Average
    "^ixic": "QQQ",    // Nasdaq-100
    "^rut": "IWM",     // Russell 2000
  };
  
  const useProxyTicker =
    ticker?.toLowerCase() in INDEX_TO_ETF &&
    SPY_PROXY_ENDPOINTS.includes(endpoint);
  
  const effectiveTicker =
    useProxyTicker ? INDEX_TO_ETF[ticker.toLowerCase()] : ticker;

    

  
  const cacheKey = `${endpoint}-${effectiveTicker}`;
  const cachedData = dataCache.get(cacheKey);
  if (cachedData) return cachedData;

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey
    },
    body: JSON.stringify({ ticker: effectiveTicker })
  };

  try {
    const data = await fetchWithTimeout(
      `${apiURL}${endpoint}`,
      options,
      REQUEST_TIMEOUT
    );
    dataCache.set(cacheKey, data);
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`Request timeout for ${endpoint}`);
    } else {
      console.error(`Error fetching ${endpoint}:`, error);
    }
    return [];
  }
};

// Optimized watchlist fetching with error boundary
const fetchWatchlist = async (pb, userId) => {
  if (!userId) return [];
  try {
    return await pb.collection("watchlist").getFullList({
      filter: `user="${userId}"`
    });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
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
  const { apiURL, apiKey, pb, user } = locals;
  const { tickerID } = params;

  if (!tickerID) {
    return getDefaultResponse(tickerID);
  }

  try {
    const promises = ENDPOINTS.map(endpoint =>
      fetchData(apiURL, apiKey, endpoint, tickerID)
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

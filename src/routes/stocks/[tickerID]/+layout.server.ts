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
const REQUEST_TIMEOUT = 2000;
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

// Main data fetching function
const fetchData = async (apiURL, apiKey, endpoint, ticker) => {
  const cacheKey = `${endpoint}-${ticker}`;
  const cachedData = dataCache.get(cacheKey);
  if (cachedData) return cachedData;

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey
    },
    body: JSON.stringify({ ticker, endpoints: ENDPOINTS })
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
      throw new Error(`Request timeout for ${endpoint}`);
    }
    throw error;
  }
};

// Optimized watchlist fetching with error boundary
const fetchWatchlist = async (pb, userId) => {
  if (!userId) return [];
  try {
    return await pb.collection("watchlist").getFullList({
      filter: `user="${userId}"`
    });
  } catch {
    return [];
  }
};

// Main load function with parallel fetching
export const load = async ({ params, locals }) => {
  const { apiURL, apiKey, pb, user } = locals;
  const { tickerID } = params;

  if (!tickerID) {
    return { error: 'Invalid ticker ID' };
  }

  try {
    const [stockData, userWatchlist] = await Promise.all([
      fetchData(apiURL, apiKey, "/bulk-data", tickerID),
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

    // 👇 Decide based on market hours
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

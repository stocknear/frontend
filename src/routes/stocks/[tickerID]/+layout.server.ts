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
const fetchData = async (apiURL, apiKey, endpoint, ticker, lang = "en") => {
  const cacheKey = `${endpoint}-${ticker}-${lang}`;
  const cachedData = dataCache.get(cacheKey);
  if (cachedData) return cachedData;

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey
    },
    body: JSON.stringify({ ticker, endpoints: ENDPOINTS, lang })
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

// Type for ticker data (can be string or object)
type TickerData = string | { symbol: string; note?: string; addedPrice?: number | null };

// Extract just the symbols from ticker array (strips notes to save bandwidth)
function extractSymbolsOnly(tickers: unknown): string[] {
  if (!tickers) return [];

  let tickerArray: TickerData[];

  // Handle string format (JSON stored in DB)
  if (typeof tickers === "string") {
    try {
      tickerArray = JSON?.parse(tickers);
    } catch {
      return [];
    }
  } else if (Array?.isArray(tickers)) {
    tickerArray = tickers;
  } else {
    return [];
  }

  if (!Array.isArray(tickerArray)) return [];

  // Extract just the symbol strings
  return tickerArray?.map((t) =>
    typeof t === "string" ? t : (t?.symbol || "")
  )?.filter(Boolean);
}

// Optimized watchlist fetching - strips notes to save bandwidth
// For stock detail page, we only need: id, title, and list of symbols
const fetchWatchlist = async (pb, userId) => {
  if (!userId) return [];
  try {
    const watchlists = await pb.collection("watchlist").getFullList({
      filter: `user="${userId}"`,
      fields: "id,title,ticker", // Only fetch needed fields
    });

    // Transform to lightweight format (symbols only, no notes)
    return watchlists.map((wl) => ({
      id: wl.id,
      title: wl.title,
      ticker: extractSymbolsOnly(wl.ticker),
    }));
  } catch {
    return [];
  }
};

// Main load function with parallel fetching
export const load = async ({ params, locals }) => {
  const { apiURL, apiKey, pb, user, locale } = locals;
  const { tickerID } = params;

  if (!tickerID) {
    return { error: 'Invalid ticker ID' };
  }

  try {
    const [stockData, userWatchlist] = await Promise.all([
      fetchData(apiURL, apiKey, "/bulk-data", tickerID, locale ?? "en"),
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

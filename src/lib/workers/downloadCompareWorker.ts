// Cache to store previous requests (capped to prevent unbounded memory growth)
const MAX_CACHE_SIZE = 50;
const cache = new Map<string, any>();



const fetchData = async (tickerList, category, assetType = "stocks") => {
  console.log("Checking cache and fetching new data if needed");

  // 1) Sort tickers alphabetically
  //const sortedTickers = [...tickerList]?.sort();

  // 2) Build the cacheKey from tickers + category
  const cacheKey = JSON.stringify({
    tickers: tickerList,
    category,
    assetType,
  });

  // 3) Return cached result if present
  if (cache?.has(cacheKey)) {
    console.log("Returning cached data");
    return cache?.get(cacheKey);
  }

  // 4) Fetch fresh data
  const postData = { tickerList, category, assetType };
  const response = await fetch("/api/compare-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(postData),
  });

  const output = await response.json();

  // 5) Cache & return (evict oldest if at capacity)
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache?.set(cacheKey, output);
  return output;
};

onmessage = async (event) => {
  const { tickerList, category, assetType = "stocks" } = event?.data || {};
  
  const output = await fetchData(tickerList, category, assetType);
  postMessage({ message: "success", output });
};

export {};

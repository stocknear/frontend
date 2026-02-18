// Cache to store completed responses
let cache = new Map();

// In-flight request deduplication: ruleKey -> Promise
let pendingRequests = new Map();

// Separate cache for stock screener earningsDate data (shared across all CSP rule sets)
let earningsCache = null;

const getCashSecuredPutScreenerData = async (rules) => {
  const getRuleOfList = rules?.map((rule) => rule.name) || [];
  const ruleKey = JSON.stringify(getRuleOfList.sort());

  // Check completed cache
  if (cache.has(ruleKey)) {
    return cache.get(ruleKey);
  }

  // Deduplicate: if the same request is already in-flight, reuse its promise
  if (pendingRequests.has(ruleKey)) {
    return pendingRequests.get(ruleKey);
  }

  // Start new fetch and track it
  const fetchPromise = (async () => {
    const response = await fetch("/api/cash-secured-put-screener-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ruleOfList: getRuleOfList }),
    });
    const output = await response.json();
    cache.set(ruleKey, output);
    pendingRequests.delete(ruleKey);
    return output;
  })();

  pendingRequests.set(ruleKey, fetchPromise);
  return fetchPromise;
};

// Fetch earnings fields for all symbols from the stock screener API
const getEarningsDataMap = async () => {
  if (earningsCache) return earningsCache;

  const response = await fetch("/api/stock-screener-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ruleOfList: ["marketCap", "earningsDate", "earningsTime", "earningsRevenueEst", "earningsEPSEst", "earningsRevenueGrowthEst", "earningsEPSGrowthEst", "payoutRatio", "dividendYield", "payoutFrequency", "annualDividend", "dividendGrowth", "exDividendDate"] }),
  });

  const data = await response.json();

  // Build symbol -> earnings data lookup map
  const map = new Map();
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item?.symbol) {
        map.set(item.symbol, {
          marketCap: item.marketCap ?? null,
          earningsDate: item.earningsDate ?? null,
          earningsTime: item.earningsTime ?? null,
          earningsRevenueEst: item.earningsRevenueEst ?? null,
          earningsEPSEst: item.earningsEPSEst ?? null,
          earningsRevenueGrowthEst: item.earningsRevenueGrowthEst ?? null,
          earningsEPSGrowthEst: item.earningsEPSGrowthEst ?? null,
          payoutRatio: item.payoutRatio ?? null,
          dividendYield: item.dividendYield ?? null,
          payoutFrequency: item.payoutFrequency ?? null,
          annualDividend: item.annualDividend ?? null,
          dividendGrowth: item.dividendGrowth ?? null,
          exDividendDate: item.exDividendDate ?? null,
        });
      }
    }
  }

  earningsCache = map;
  return map;
};

// Derive marketCapGroup label from marketCap value
function getMarketCapGroup(marketCap) {
  if (marketCap >= 200_000_000_000) return "Mega-Cap (200B+)";
  if (marketCap >= 10_000_000_000) return "Large-Cap (10-200B)";
  if (marketCap >= 2_000_000_000) return "Mid-Cap (2-10B)";
  if (marketCap >= 300_000_000) return "Small-Cap (300M-2B)";
  if (marketCap >= 50_000_000) return "Micro-Cap (Under 300M)";
  return "Nano-Cap (Under 50M)";
}

// Fields that are legitimately nullable (not every stock has an upcoming earnings date)
const nullableFields = new Set(["marketCap", "marketCapGroup", "earningsDate", "earningsTime", "earningsRevenueEst", "earningsEPSEst", "earningsRevenueGrowthEst", "earningsEPSGrowthEst", "payoutRatio", "dividendYield", "payoutFrequency", "annualDividend", "dividendGrowth", "exDividendDate"]);

// Optimized validation function
const isValidValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value !== "object") return true;

  // Fast object validation
  for (const subValue of Object.values(value)) {
    if (subValue === null || subValue === undefined) return false;
  }
  return true;
};

const filterValidItems = (data) => {
  const result = [];
  for (const item of data) {
    let isValid = true;
    for (const [key, value] of Object.entries(item)) {
      if (nullableFields.has(key)) continue;
      if (!isValidValue(value)) {
        isValid = false;
        break;
      }
    }
    if (isValid) result.push(item);
  }
  return result;
};

onmessage = async (event) => {
  const { ruleOfList, prefetch } = event.data || {};

  try {
    // Fetch CSP data and earnings data map in parallel
    const [output, earningsMap] = await Promise.all([
      getCashSecuredPutScreenerData(ruleOfList),
      getEarningsDataMap(),
    ]);

    // Prefetch: only warm the caches, don't update UI
    if (prefetch) return;

    const rawData = output?.data || [];

    // Enrich each CSP item with earnings fields from stock screener
    for (const item of rawData) {
      const earnings = item?.symbol && earningsMap.has(item.symbol)
        ? earningsMap.get(item.symbol)
        : null;
      item.marketCap = earnings?.marketCap ?? null;
      item.marketCapGroup = item.marketCap ? getMarketCapGroup(item.marketCap) : null;
      item.earningsDate = earnings?.earningsDate ?? null;
      item.earningsTime = earnings?.earningsTime ?? null;
      item.earningsRevenueEst = earnings?.earningsRevenueEst ?? null;
      item.earningsEPSEst = earnings?.earningsEPSEst ?? null;
      item.earningsRevenueGrowthEst = earnings?.earningsRevenueGrowthEst ?? null;
      item.earningsEPSGrowthEst = earnings?.earningsEPSGrowthEst ?? null;
      item.payoutRatio = earnings?.payoutRatio ?? null;
      item.dividendYield = earnings?.dividendYield ?? null;
      item.payoutFrequency = earnings?.payoutFrequency ?? null;
      item.annualDividend = earnings?.annualDividend ?? null;
      item.dividendGrowth = earnings?.dividendGrowth ?? null;
      item.exDividendDate = earnings?.exDividendDate ?? null;
    }

    const stockScreenerData = filterValidItems(rawData);

    postMessage({
      message: "success",
      stockScreenerData,
      expirationList: output?.expirationList || [],
      totalContracts: output?.totalContracts || 0,
    });
  } catch (error) {
    postMessage({ message: "error", error: error.message });
  }
};

export {};

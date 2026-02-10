// Cache to store previous requests
let cache = new Map();

// Pre-compiled rule key cache
let lastRules = null;
let lastRuleKey = null;

// Separate cache for stock screener earningsDate data (shared across all CC rule sets)
let earningsCache = null;

const getCoveredCallScreenerData = async (rules) => {
  // Fast path: empty rules
  if (!rules?.length) {
    const emptyKey = `[]`;
    if (cache.has(emptyKey)) return cache.get(emptyKey);
  }

  // Extract rule names with single pass
  const getRuleOfList = rules?.map((rule) => rule.name) || [];

  // Fast path: check if we can reuse the last computed rule key
  if (lastRules === rules) {
    if (cache.has(lastRuleKey)) {
      return cache.get(lastRuleKey);
    }
  }

  // Create cache key - sort for consistent keys
  const ruleKey = JSON.stringify(getRuleOfList.sort());

  // Cache the computed key
  lastRules = rules;
  lastRuleKey = ruleKey;

  // Check cache
  if (cache.has(ruleKey)) {
    return cache.get(ruleKey);
  }

  // Fetch new data
  const response = await fetch("/api/covered-call-screener-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ruleOfList: getRuleOfList }),
  });

  const output = await response.json();

  // Store in cache
  cache.set(ruleKey, output);
  return output;
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
  const { ruleOfList } = event.data || {};

  try {
    // Fetch CC data and earnings data map in parallel
    const [output, earningsMap] = await Promise.all([
      getCoveredCallScreenerData(ruleOfList),
      getEarningsDataMap(),
    ]);

    const rawData = output?.data || [];

    // Enrich each CC item with earnings fields from stock screener
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

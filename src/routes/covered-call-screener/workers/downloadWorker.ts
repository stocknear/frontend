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

// Fetch earningsDate for all symbols from the stock screener API
const getEarningsDateMap = async () => {
  if (earningsCache) return earningsCache;

  const response = await fetch("/api/stock-screener-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ruleOfList: ["earningsDate"] }),
  });

  const data = await response.json();

  // Build symbol -> earningsDate lookup map
  const map = new Map();
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item?.symbol) {
        map.set(item.symbol, item.earningsDate ?? null);
      }
    }
  }

  earningsCache = map;
  return map;
};

// Fields that are legitimately nullable (not every stock has an upcoming earnings date)
const nullableFields = new Set(["earningsDate"]);

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
    // Fetch CC data and earningsDate map in parallel
    const [output, earningsMap] = await Promise.all([
      getCoveredCallScreenerData(ruleOfList),
      getEarningsDateMap(),
    ]);

    const rawData = output?.data || [];

    // Enrich each CC item with earningsDate from stock screener
    for (const item of rawData) {
      item.earningsDate = item?.symbol && earningsMap.has(item.symbol)
        ? earningsMap.get(item.symbol)
        : null;
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

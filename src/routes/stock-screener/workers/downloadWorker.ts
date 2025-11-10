// Cache to store previous requests
let cache = new Map();

// Pre-computed EMA parameters set for O(1) lookup
const emaParametersSet = new Set([
  "sma20", "sma50", "sma100", "sma200",
  "ema20", "ema50", "ema100", "ema200"
]);

// Pre-compiled rule key cache
let lastRules = null;
let lastRuleKey = null;

const getStockScreenerData = async (rules) => {
  console.log("Checking cache and fetching new data if needed");
  
  // Fast path: empty rules
  if (!rules?.length) {
    const emptyKey = "[]";
    if (cache.has(emptyKey)) return cache.get(emptyKey);
  }
  
  // Extract rule names with single pass
  const getRuleOfList = rules?.map(rule => rule.name) || [];
  
  // Fast path: check if we can reuse the last computed rule key
  if (lastRules === rules) {
    if (cache.has(lastRuleKey)) {
      console.log("Returning cached data");
      return cache.get(lastRuleKey);
    }
  }
  
  // Single pass: check for EMA parameters and add missing ones
  let hasEmaParams = false;
  const ruleSet = new Set(getRuleOfList);
  
  for (const param of getRuleOfList) {
    if (emaParametersSet.has(param)) {
      hasEmaParams = true;
      break;
    }
  }
  
  if (hasEmaParams) {
    for (const param of emaParametersSet) {
      if (!ruleSet.has(param)) {
        getRuleOfList.push(param);
        ruleSet.add(param);
      }
    }
  }
  
  // Create cache key - sort for consistent keys
  const ruleKey = JSON.stringify(getRuleOfList.sort());
  
  // Cache the computed key
  lastRules = rules;
  lastRuleKey = ruleKey;
  
  // Check cache
  if (cache.has(ruleKey)) {
    console.log("Returning cached data");
    return cache.get(ruleKey);
  }
  
  // Fetch new data
  const response = await fetch("/api/stock-screener-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ruleOfList: getRuleOfList })
  });
  
  const output = await response.json();
  
  // Store in cache
  cache.set(ruleKey, output);
  return output;
};

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
    for (const value of Object.values(item)) {
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
    const output = await getStockScreenerData(ruleOfList);
    const stockScreenerData = output ? filterValidItems(output) : [];
    postMessage({ message: "success", stockScreenerData });
  } catch (error) {
    postMessage({ message: "error", error: error.message });
  }
};

export {};
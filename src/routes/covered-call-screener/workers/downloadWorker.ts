// Cache to store previous requests
let cache = new Map();

// Pre-compiled rule key cache
let lastRules = null;
let lastRuleKey = null;

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
    const output = await getCoveredCallScreenerData(ruleOfList);
    const stockScreenerData = output?.data
      ? filterValidItems(output.data)
      : [];

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

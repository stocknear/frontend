// filterWorker.ts
// Worker that filters stock screener data based on rules, including indexMembership.
// Accepts message with { stockScreenerData, ruleOfList, indexDict }

function convertUnitToValue(input: string | number | string[]): any {
  try {
    if (Array.isArray(input)) {
      return input.map(convertUnitToValue); // Recursively convert array elements
    }
    if (typeof input === "number") return input;
    if (typeof input !== "string") {
      return input; // Return as-is if not a string or number
    }

    const lowerInput = input?.toLowerCase();
    const nonNumericValues = new Set(["any", "call", "put", "stock", "etf"]);
    if (nonNumericValues.has(lowerInput)) return input;

    // Handle percentage values
    if (input.endsWith("%")) {
      const numericValue = parseFloat(input.slice(0, -1));
      if (isNaN(numericValue)) return input;
      return numericValue;
    }

    // Handle units (B, M, K)
    const units: Record<string, number> = { B: 1_000_000_000, M: 1_000_000, K: 1_000 };
    const match = input.match(/^(-?\d+(\.\d+)?)([BMK])?$/i);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = (match[3] || "").toUpperCase();
      return unit ? value * (units[unit] ?? 1) : value;
    }

    const numericValue = parseFloat(input);
    if (isNaN(numericValue)) return input;
    return numericValue;
  } catch (error) {
    console.warn(`Error converting value: ${input}`, error);
    return input;
  }
}

// Normalize index keys so variants like "S&P100", "s&p 100", "s and p500" become "sp100"/"sp500"
function normalizeIndexKey(raw: any): string {
  if (typeof raw !== "string") return String(raw || "").toLowerCase();
  let s = raw.toLowerCase();
  s = s.replace(/\s+/g, "");
  s = s.replace(/s&p/gi, "sp");
  s = s.replace(/sandp/gi, "sp");
  s = s.replace(/s& p/gi, "sp");
  s = s.replace(/s\s*and\s*p/gi, "sp");
  s = s.replace(/[^\w]/g, "");
  return s;
}

// Build index maps one time for all rules/items
function buildIndexMaps(indexDict: any) {
  const normalizedIndexDict: Record<string, Set<string>> = {};
  const symbolToIndexSet: Record<string, Set<string>> = {};

  if (!indexDict || typeof indexDict !== "object") {
    return { normalizedIndexDict, symbolToIndexSet };
  }

  for (const rawKey of Object.keys(indexDict)) {
    try {
      const nk = normalizeIndexKey(rawKey);
      if (!nk) continue;
      const list = Array.isArray(indexDict[rawKey]) ? indexDict[rawKey] : [];

      const symbolSet = new Set<string>();
      for (const s of list) {
        if (!s) continue;
        const sym = String(s).toUpperCase();
        symbolSet.add(sym);

        if (!symbolToIndexSet[sym]) symbolToIndexSet[sym] = new Set();
        symbolToIndexSet[sym].add(nk);
      }

      normalizedIndexDict[nk] = symbolSet;
    } catch {
      // ignore malformed entries
    }
  }

  return { normalizedIndexDict, symbolToIndexSet };
}

// Centralized rule checking logic
function createRuleCheck(rule: any, ruleName: string, ruleValue: any, indexMaps: any) {
  if (rule?.value === "any") return () => true;
  if (ruleValue === "any") return () => true;
  if (Array.isArray(ruleValue) && ruleValue.some((v: any) => v === "any")) return () => true;

  // Special handling: indexMembership
  if (ruleName === "indexmembership" || rule.name === "indexMembership") {
    const { symbolToIndexSet } = indexMaps;

    const selectedIndexesSet = new Set<string>();
    if (Array.isArray(rule.value)) {
      for (const v of rule.value) {
        const nk = normalizeIndexKey(v);
        if (nk) selectedIndexesSet.add(nk);
      }
    } else {
      const nk = normalizeIndexKey(rule.value);
      if (nk) selectedIndexesSet.add(nk);
    }

    // ✅ Ensure "sp100" and "sp500" are preserved and allowed
    if (selectedIndexesSet.size === 0) return () => false;

    return (item: any) => {
      const symbol = (item?.symbol || "").toString().toUpperCase();
      if (!symbol) return false;

      const idxSet = symbolToIndexSet[symbol];
      if (!idxSet) return false;

      for (const sel of selectedIndexesSet) {
        if (idxSet.has(sel)) return true;
      }
      return false;
    };
  }

  // Categorical checks
  const categoricalFields = ["optionType", "assetType"];
  if (categoricalFields.includes(ruleName) || categoricalFields.includes(rule.name)) {
    return (item: any) => {
      const itemValue = item[rule.name];
      if (Array.isArray(ruleValue)) return ruleValue.includes(itemValue);
      return itemValue === ruleValue;
    };
  }

  // Between condition (numeric)
  if (rule.condition === "between" && Array.isArray(ruleValue)) {
    return (item: any) => {
      const rawItemValue = item[rule.name];
      const itemValue =
        typeof rawItemValue === "string" || typeof rawItemValue === "number"
          ? convertUnitToValue(rawItemValue)
          : rawItemValue;

      const [minRaw, maxRaw] = ruleValue;
      const min = convertUnitToValue(minRaw);
      const max = convertUnitToValue(maxRaw);

      const emptyMin = min === "" || min === undefined || min === null;
      const emptyMax = max === "" || max === undefined || max === null;

      if (emptyMin && emptyMax) return true;
      if (emptyMin) return itemValue < max;
      if (emptyMax) return itemValue > min;
      return itemValue > min && itemValue < max;
    };
  }

  // Default numeric/string comparisons
  return (item: any) => {
    const rawItemValue = item[rule.name];
    if (rawItemValue === null || rawItemValue === undefined) return false;

    const itemValue =
      typeof rawItemValue === "string" || typeof rawItemValue === "number"
        ? convertUnitToValue(rawItemValue)
        : rawItemValue;

    if (Array.isArray(ruleValue)) {
      return ruleValue.includes(rawItemValue) || ruleValue.includes(itemValue);
    }

    switch (rule.condition) {
      case "exactly":
        return itemValue === ruleValue;
      case "over":
        return Number(itemValue) > Number(ruleValue);
      case "under":
        return Number(itemValue) <= Number(ruleValue);
      default:
        if (ruleValue !== undefined && ruleValue !== null) {
          return itemValue === ruleValue || itemValue == ruleValue;
        }
        return true;
    }
  };
}

async function filterStockScreenerData(
  stockScreenerData: any[],
  ruleOfList: any[],
  indexDict: any
) {
  if (!stockScreenerData?.length || !ruleOfList?.length) {
    return stockScreenerData || [];
  }

  const indexMaps = buildIndexMaps(indexDict);

  const compiledRules = ruleOfList.map((rule) => {
    const ruleName = (rule.name || "").toString().toLowerCase();
    const ruleValue =
      ruleName === "indexmembership" ? rule.value : convertUnitToValue(rule.value);
    return {
      ...rule,
      compiledCheck: createRuleCheck(rule, ruleName, ruleValue, indexMaps),
    };
  });

  return stockScreenerData.filter((item) =>
    compiledRules.every((rule) => {
      try {
        return rule.compiledCheck(item);
      } catch (err) {
        console.warn("Rule check error for item", item?.symbol, err);
        return false;
      }
    })
  );
}

onmessage = async (event: MessageEvent) => {
  const { stockScreenerData, ruleOfList, indexDict } = event.data || {};

  try {
    const filteredData = await filterStockScreenerData(
      stockScreenerData,
      ruleOfList,
      indexDict
    );


    
    postMessage({
      message: "success",
      filteredData,
      originalDataLength: stockScreenerData?.length || 0,
      filteredDataLength: filteredData?.length || 0,
    });
  } catch (error) {
    console.error("Error in onmessage handler:", error);
    postMessage({
      message: "error",
      originalData: stockScreenerData,
      error: (error && error.toString()) || String(error),
    });
  }
};

export {};

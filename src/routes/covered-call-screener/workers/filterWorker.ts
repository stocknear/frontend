// filterWorker.ts
// Worker that filters covered call screener data based on rules.
// Accepts message with { stockScreenerData, ruleOfList }

function convertUnitToValue(input: string | number | string[]): any {
  try {
    if (Array.isArray(input)) {
      return input.map(convertUnitToValue);
    }
    if (typeof input === "number") return input;
    if (typeof input !== "string") {
      return input;
    }

    const lowerInput = input?.toLowerCase();
    const nonNumericValues = new Set(["any", "stock", "etf"]);
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

// Centralized rule checking logic
function createRuleCheck(rule: any, ruleName: string, ruleValue: any) {
  if (rule?.value === "any") return () => true;
  if (ruleValue === "any") return () => true;
  if (Array.isArray(ruleValue) && ruleValue.some((v: any) => v === "any")) return () => true;

  // Categorical checks
  const categoricalFields = ["assetType"];
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
  ruleOfList: any[]
) {
  if (!stockScreenerData?.length || !ruleOfList?.length) {
    return stockScreenerData || [];
  }

  const compiledRules = ruleOfList.map((rule) => {
    const ruleName = (rule.name || "").toString().toLowerCase();
    const ruleValue = convertUnitToValue(rule.value);
    return {
      ...rule,
      compiledCheck: createRuleCheck(rule, ruleName, ruleValue),
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
  const { stockScreenerData, ruleOfList } = event.data || {};

  try {
    const filteredData = await filterStockScreenerData(
      stockScreenerData,
      ruleOfList
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

const categoricalFields = [
  "execution_estimate",
  "underlying_type",
  "exchange",
];

function convertUnitToValue(
  input: string | number | string[],
): number | string[] | string {
  if (Array.isArray(input)) return input;
  if (typeof input === "number") return input;
  if (typeof input !== "string") {
    throw new TypeError(
      `Expected a string or number, but received ${typeof input}`,
    );
  }
  const lowerInput = input?.toLowerCase();
  const nonNumericValues = new Set([
    "any",
    "at bid",
    "at ask",
    "at mid",
    "above ask",
    "below bid",
    "stock",
    "etf",
    "nasdaq",
    "nyse",
    "arca",
    "amex",
    "bats",
    "iex",
  ]);
  if (nonNumericValues?.has(lowerInput)) return input;

  const units = { B: 1_000_000_000, M: 1_000_000, K: 1_000 };
  const match = input.match(/^(\d+(\.\d+)?)([BMK])?$/);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = match[3] as keyof typeof units;
    return unit ? value * units[unit] : value;
  }
  const numericValue = parseFloat(input);
  if (isNaN(numericValue)) {
    throw new Error(`Unable to convert ${input} to a number`);
  }
  return numericValue;
}

function isAny(value: string | string[]): boolean {
  if (typeof value === "string") return value.toLowerCase() === "any";
  if (Array.isArray(value))
    return value.length === 1 && value[0].toLowerCase() === "any";
  return false;
}

// Normalize execution estimate values for comparison
function normalizeExecutionEstimate(value: string): string {
  const lower = value?.toLowerCase();
  // Map "At Mid" to "At Midpoint" for matching with backend data
  if (lower === "at mid") return "at midpoint";
  return lower;
}

function createRuleCheck(rule, ruleName, ruleValue) {
  // Handle categorical/string-based conditions (execution_estimate, underlying_type, exchange)
  if (categoricalFields?.includes(ruleName)) {
    return (item) => {
      // If ruleValue is empty, undefined, or "any", return true for all items
      if (ruleValue === "" || ruleValue === undefined || isAny(ruleValue)) {
        return true;
      }

      let itemValue = item[rule.name];

      // Normalize item value for execution_estimate comparison
      const normalizedItemValue =
        ruleName === "execution_estimate" && typeof itemValue === "string"
          ? normalizeExecutionEstimate(itemValue)
          : itemValue?.toLowerCase();

      // Handle array of values for categorical fields
      if (Array?.isArray(ruleValue)) {
        // Remove any empty or undefined values from ruleValue
        const validRuleValues = ruleValue?.filter(
          (val) => val !== "" && val !== undefined,
        );

        // If no valid values remain, return true for all items
        if (validRuleValues.length === 0) {
          return true;
        }

        // Normalize rule values for execution_estimate
        const normalizedRuleValues =
          ruleName === "execution_estimate"
            ? validRuleValues.map((val) => normalizeExecutionEstimate(val))
            : validRuleValues.map((val) => val.toLowerCase());

        // If itemValue is an array, check if any of the values match
        if (Array?.isArray(itemValue)) {
          return normalizedRuleValues?.some((val) =>
            itemValue.some((iv) => normalizeExecutionEstimate(iv) === val),
          );
        }

        // If itemValue is a string, check if it's in the validRuleValues array
        return normalizedRuleValues?.some((val) => normalizedItemValue === val);
      }

      // Handle single string value
      if (typeof ruleValue === "string") {
        const normalizedRuleValue =
          ruleName === "execution_estimate"
            ? normalizeExecutionEstimate(ruleValue)
            : ruleValue.toLowerCase();

        // If itemValue is an array, check if any value matches
        if (Array?.isArray(itemValue)) {
          return itemValue?.some(
            (iv) => normalizeExecutionEstimate(iv) === normalizedRuleValue,
          );
        }

        // If both are strings, do a direct comparison
        return normalizedItemValue === normalizedRuleValue;
      }

      return false;
    };
  }

  // Fallback to numeric conditions (size, price, cost_basis)
  return (item) => {
    const itemValue = item[rule.name];
    if (typeof ruleValue === "string") return true;

    if (itemValue === null || itemValue === undefined) return false;

    const numericItemValue = parseFloat(itemValue);

    if (isNaN(numericItemValue)) return false;

    // Handle 'between' condition for numeric fields
    if (rule.condition === "between" && Array.isArray(ruleValue)) {
      const [minValue, maxValue] = ruleValue.map(convertUnitToValue);

      if (minValue === null && maxValue === null) return true;
      if (minValue === null) return numericItemValue <= maxValue;
      if (maxValue === null) return numericItemValue >= minValue;

      return numericItemValue >= minValue && numericItemValue <= maxValue;
    }

    // Existing conditions
    if (rule.condition === "exactly" && numericItemValue !== ruleValue)
      return false;
    if (rule.condition === "over" && numericItemValue <= ruleValue) return false;
    if (rule.condition === "under" && numericItemValue >= ruleValue)
      return false;

    return true;
  };
}

async function filterRawData(rawData, ruleOfList, filterQuery) {
  // Early return for empty inputs
  if (!rawData?.length) {
    return rawData || [];
  }

  // Preprocess filter tickers
  const filterTickers = filterQuery
    ? filterQuery?.split(",")?.map((ticker) => ticker?.trim()?.toUpperCase())
    : [];

  // Precompile rules for more efficient filtering
  const compiledRules = ruleOfList?.map((rule) => {
    const ruleName = rule?.name?.toLowerCase();
    const ruleValue = convertUnitToValue(rule.value);

    return {
      ...rule,
      compiledCheck: createRuleCheck(rule, ruleName, ruleValue),
    };
  });

  // Optimized filtering with precompiled rules
  return rawData?.filter((item) => {
    // Early ticker filtering
    if (
      filterTickers?.length > 0 &&
      !filterTickers?.includes(item.ticker.toUpperCase())
    ) {
      return false;
    }

    // Apply all precompiled rules
    return compiledRules?.every((rule) => rule?.compiledCheck(item));
  });
}

// Web Worker message handler
onmessage = async (event: MessageEvent) => {
  const { rawData, ruleOfList, filterQuery } = event.data || {};
  // Filter the data
  let filteredData = await filterRawData(rawData, ruleOfList, filterQuery);

  filteredData = Array?.from(
    new Map(filteredData?.map((item) => [item?.id, item]))?.values(),
  );

  postMessage({ message: "success", filteredData });
};

export {};

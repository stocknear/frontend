import { sectorList, listOfRelevantCountries } from "$lib/utils";

// Convert the input to a value or return it as-is if it's already an array
function convertUnitToValue(
  input: string | number | string[]
): number | string[] {
  if (Array.isArray(input)) return input;

  if (typeof input === "number") return input;

  if (typeof input !== "string") {
    throw new TypeError(
      `Expected a string or number, but received ${typeof input}`
    );
  }

  const lowerInput = input.toLowerCase();

  // Pre-compute the set for quick lookups
  const nonNumericValues = new Set([
    "any",
    ...sectorList,
    ...listOfRelevantCountries,
    "hold",
    "sell",
    "buy",
  ]);

  if (nonNumericValues.has(lowerInput)) return "any";

  if (input.endsWith("%")) {
    const numericValue = parseFloat(input.slice(0, -1));
    if (isNaN(numericValue)) {
      throw new Error(`Unable to convert ${input} to a number`);
    }
    return numericValue;
  }

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

// Filter the stock screener data based on the provided rules
async function filterStockScreenerData(stockScreenerData, ruleOfList) {
  return stockScreenerData?.filter((item) => {
    return ruleOfList.every((rule) => {
      const itemValue = item[rule.name];
      const ruleValue = convertUnitToValue(rule.value);

      if (["trendAnalysis", "fundamentalAnalysis"].includes(rule.name)) {
        const accuracy = item[rule.name]?.accuracy;
        if (rule.condition === "over" && accuracy <= ruleValue) return false;
        if (rule.condition === "under" && accuracy > ruleValue) return false;
      } else if (["analystRating", "sector", "country"].includes(rule.name)) {
        if (rule.value === "any") return true;

        if (Array.isArray(ruleValue) && !ruleValue.includes(itemValue))
          return false;
        if (!Array.isArray(ruleValue) && itemValue !== ruleValue) return false;
      } else {
        if (
          rule.condition === "over" &&
          itemValue !== null &&
          itemValue <= ruleValue
        )
          return false;
        if (
          rule.condition === "under" &&
          itemValue !== null &&
          itemValue > ruleValue
        )
          return false;
      }
      return true;
    });
  });
}

onmessage = async (event: MessageEvent) => {
  const { stockScreenerData, ruleOfList } = event.data || {};

  const filteredData = await filterStockScreenerData(
    stockScreenerData,
    ruleOfList
  );

  postMessage({ message: "success", filteredData });
};

export {};

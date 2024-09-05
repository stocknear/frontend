import { sectorList } from "$lib/utils";

function convertUnitToValue(input: string | number): number {
  if (typeof input === "number") {
    return input; // If it's already a number, return it directly.
  }

  if (typeof input !== "string") {
    throw new TypeError(
      `Expected a string or number, but received ${typeof input}`
    );
  }

  // Handle specific non-numeric cases
  if (
    input.toLowerCase() === "any" ||
    [...sectorList, "Hold", "Sell", "Buy"]?.includes(input)
  ) {
    return "any"; // Return a special value for "any" that represents a non-restrictive filter
  }

  // Handle percentage values by stripping the "%" sign and converting to a number
  if (input.endsWith("%")) {
    const numericValue = parseFloat(input.slice(0, -1));
    if (isNaN(numericValue)) {
      throw new Error(`Unable to convert ${input} to a number`);
    }
    return numericValue; // Convert percentage to a decimal
  }

  const units = {
    B: 1_000_000_000,
    M: 1_000_000,
    K: 1_000,
  };

  const match = input.match(/^(\d+(\.\d+)?)([BMK])?$/);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = match[3] as keyof typeof units;

    // If there's a unit, multiply the value by the unit's multiplier
    if (unit) {
      return value * units[unit];
    } else {
      // If no unit, return the value directly
      return value;
    }
  }

  // If input can't be parsed, throw an error
  const numericValue = parseFloat(input);
  if (isNaN(numericValue)) {
    throw new Error(`Unable to convert ${input} to a number`);
  }

  return numericValue;
}

async function filterStockScreenerData(stockScreenerData, ruleOfList) {
  return stockScreenerData?.filter((item) => {
    for (const rule of ruleOfList) {
      const itemValue = item[rule.name];
      const ruleValue = convertUnitToValue(rule.value);
      if (["trendAnalysis", "fundamentalAnalysis"].includes(rule.name)) {
        const accuracy = item[rule.name]?.accuracy;
        if (rule.condition === "over" && accuracy <= ruleValue) {
          return false;
        } else if (rule.condition === "under" && accuracy > ruleValue) {
          return false;
        }
      } else if (rule.name === "analystRating") {
        if (
          ["Buy", "Hold", "Sell"]?.includes(rule.value) &&
          itemValue !== rule.value
        ) {
          return false;
        }
      } else if (rule.name === "sector") {
        if (sectorList?.includes(rule.value) && itemValue !== rule.value) {
          return false;
        }
      } else {
        if (
          rule.condition === "over" &&
          itemValue !== null &&
          itemValue <= ruleValue
        ) {
          return false;
        } else if (
          rule.condition === "under" &&
          itemValue !== null &&
          itemValue > ruleValue
        ) {
          return false;
        }
      }
    }
    return true;
  });
}

onmessage = async (event: MessageEvent) => {
  const stockScreenerData = event.data?.stockScreenerData;
  const ruleOfList = event.data?.ruleOfList;

  const filteredData = await filterStockScreenerData(
    stockScreenerData,
    ruleOfList
  );

  postMessage({ message: "success", filteredData });

  // Sending data back to the main thread
  //postMessage({ message: 'Data received in the worker', ticker, apiURL });
};

export {};

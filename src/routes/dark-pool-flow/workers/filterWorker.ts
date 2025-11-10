import { sectorList } from "$lib/utils";


interface FilterContext {
  flowTypeCache?: Map<string, number>;
}

 const categoricalFields = [
    'assetType',
    'sector',
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
  "stock",
  "etf",
  ...sectorList.map(sector => sector.toLowerCase()),
]);


  if (nonNumericValues.has(lowerInput)) return input;
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


function createRuleCheck(rule, ruleName, ruleValue) {
if (rule.value === 'any') return () => true;

if (['sizeVolRatio','sizeAvgVolRatio']?.includes(ruleName)) {
  return (item) => {

    if (isNaN(ruleValue) || ruleValue === 0) {
      return false;
    }

    const ratio = rule?.value;

    // Handle 'between' condition for volume to open interest ratio
    if (rule.condition === 'between' && Array.isArray(ruleValue)) {
      const [minRatio, maxRatio] = ruleValue.map(convertUnitToValue); // Convert ruleValue to numeric values

      if (minRatio === null && maxRatio === null) return true;
      if (minRatio === null) return ratio <= maxRatio;
      if (maxRatio === null) return ratio >= minRatio;

      return ratio >= minRatio && ratio <= maxRatio;
    }

    // Existing conditions for 'over' and 'under'
    if (rule.condition === 'over' && ratio <= ruleValue) return false;
    if (rule.condition === 'under' && ratio >= ruleValue) return false;
    if (rule.condition === 'exactly' && ratio !== ruleValue) return false;


    return true;
  };
}



  // Handle string-based conditions (sentiment, option_type, etc.)
  if (categoricalFields.includes(rule.name)) {
    return (item) => {
      const itemValue = item[rule.name];
      if (Array.isArray(ruleValue)) {
        return ruleValue.includes(itemValue);
      }
      return itemValue === ruleValue;
    };
  }

// Fallback to other numeric conditions
return (item) => {
  const itemValue = item[rule.name];
  if (typeof ruleValue === 'string') return true; // Handle cases where the rule value is a string but not 'sentiment' or 'option_type'

  if (itemValue === null || itemValue === undefined) return false;

  const numericItemValue = parseFloat(itemValue);


  if (isNaN(numericItemValue)) return false;

  // Handle 'between' condition for numeric fields using convertUnitToValue
  if (rule.condition === 'between' && Array.isArray(ruleValue)) {
    const [minValue, maxValue] = ruleValue.map(convertUnitToValue);

    if (minValue === null && maxValue === null) return true;
    if (minValue === null) return numericItemValue <= maxValue;
    if (maxValue === null) return numericItemValue >= minValue;

    return numericItemValue >= minValue && numericItemValue <= maxValue;
  }

  // Existing conditions
  if (rule.condition === 'exactly' && numericItemValue !== ruleValue) return false;
  if (rule.condition === 'over' && numericItemValue <= ruleValue) return false;
  if (rule.condition === 'under' && numericItemValue >= ruleValue) return false;



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
    ? filterQuery?.split(",").map((ticker) => ticker.trim().toUpperCase())
    : [];

  // Initialize context with optional flowTypeCache
  const context: FilterContext = { 
    flowTypeCache: new Map() 
  };

  // Precompile rules for more efficient filtering
  const compiledRules = ruleOfList?.map(rule => {
    const ruleName = rule?.name?.toLowerCase();
    const ruleValue = convertUnitToValue(rule.value);

    return {
      ...rule,
      compiledCheck: createRuleCheck(rule, ruleName, ruleValue)
    };
  });

  // Optimized filtering with precompiled rules
  return rawData?.filter(item => {
    // Early ticker filtering
    if (filterTickers?.length > 0 && 
        !filterTickers?.includes(item.ticker.toUpperCase())) {
      return false;
    }

    // Apply all precompiled rules, passing the context
    return compiledRules?.every(rule => rule?.compiledCheck(item, context));
  });
}

// Web Worker message handler remains the same
onmessage = async (event: MessageEvent) => {
  const { rawData, ruleOfList, filterQuery } = event.data || {};
  // Filter the data
  let filteredData = await filterRawData(rawData, ruleOfList, filterQuery);
  
  filteredData = Array.from(
    new Map(filteredData?.map((item) => [item?.trackingID, item]))?.values()
  );

  postMessage({ message: "success", filteredData });
};

export {};

interface FilterContext {
  flowTypeCache?: Map<string, number>;
}

 const categoricalFields = [
    'put_call', 
    'sentiment', 
    'execution_estimate', 
    'option_activity_type', 
    'underlying_type'
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
    "puts",
    "calls",
    "bullish",
    "neutral",
    "bearish",
    "at bid",
    "at ask",
    "at midpoint",
    "above ask",
    "below bid",
    "sweep",
    "trade",
    "stock",
    "etf",
    "itm",
    "otm",
    "repeated flow"
  ]);
  if (nonNumericValues?.has(lowerInput)) return input;
  if (input?.endsWith("%")) {
    const numericValue = parseFloat(input?.slice(0, -1));
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

function isAny(value: string | string[]): boolean {
  if (typeof value === "string") return value.toLowerCase() === "any";
  if (Array.isArray(value))
    return value.length === 1 && value[0].toLowerCase() === "any";
  return false;
}



function createRuleCheck(rule, ruleName, ruleValue) {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));


if (ruleName === 'flowtype') {
  return (item: any, context: FilterContext = {}) => {
    // Check for 'any' rule or other non-repeated flow conditions
    if (ruleValue === 'any' || ruleValue?.includes("any")) {
      return true;
    }

    // Handle Repeated Flow logic
    if (ruleValue?.includes('Repeated Flow')) {
      // Initialize flowTypeCache if it doesn't exist
      context.flowTypeCache = context.flowTypeCache || new Map();

      // Create a unique key for repeated flow based on item characteristics
      const key = `${item.ticker}-${item.put_call}-${item.strike_price}-${item.date_expiration}`;
      
      // Increment the count for the key in the flowTypeCache
      const currentCount = (context.flowTypeCache.get(key) || 0) + 1;
      context.flowTypeCache.set(key, currentCount);

      // Return true if this flow appears more than N times (3 in this case)
      return currentCount > 3;
    }

    // Fallback for other flow type conditions (i.e., non-repeated flow)
    return true;
  };
}


 if (ruleName === 'moneyness') {
    return (item) => {
      if (ruleValue === 'any' || ruleValue?.includes("any")) return true;

      const currentPrice = parseFloat(item?.underlying_price);
      const strikePrice = parseFloat(item?.strike_price);
      const optionType = item?.put_call;
      if (isNaN(currentPrice) || isNaN(strikePrice)) return false;

      // Determine moneyness
      let moneyness = '';
      if (optionType === 'Calls') {
        moneyness = currentPrice > strikePrice ? 'ITM' : 'OTM';
      } else if (optionType === 'Puts') {
        moneyness = currentPrice < strikePrice ? 'ITM' : 'OTM';
      }
      // Check if the item matches the ruleValue ('itm' or 'otm')
      if (!ruleValue?.includes(moneyness)) return false;
      return true;
    };
  }

if (ruleName === 'volumeoiratio') {
  return (item) => {
    const volume = parseFloat(item.volume);
    const openInterest = parseFloat(item.open_interest);

    if (isNaN(volume) || isNaN(openInterest) || openInterest === 0) {
      return false;
    }

    const ratio = Math.ceil((volume / openInterest) * 100);

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


if (ruleName === 'sizeoiratio') {
  return (item) => {
    const size = parseFloat(item?.size);
    const openInterest = parseFloat(item?.open_interest);
    if (isNaN(size) || isNaN(openInterest) || openInterest === 0) {
      return false;
    }

    const ratio = Math?.ceil((size / openInterest) * 100);

    // Handle 'between' condition for size to open interest ratio
    if (rule.condition === 'between' && Array.isArray(ruleValue)) {
      const [minRatio, maxRatio] = ruleValue?.map(convertUnitToValue); // Convert ruleValue to numeric values

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


  if (ruleName === 'date_expiration') {
  // If ruleValue is empty, undefined, "any", or an array containing only "any", return a function that always returns true
  if (ruleValue === "" || ruleValue === undefined || isAny(ruleValue)) {
    return () => true;
  }

  
  return (item) => {
    const expirationDate = new Date(item[rule.name]);


    if (isNaN(expirationDate)) return false; // Handle invalid dates

    const daysDiff = Math?.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));


    if (rule.condition === 'between' && Array.isArray(ruleValue)) {
      const [minDays, maxDays] = ruleValue.map(val =>
        val === '' || val === null || val === undefined ? null : parseFloat(val.toString())
      );

      if (minDays === null && maxDays === null) return true;
      if (minDays === null) return daysDiff <= maxDays;
      if (maxDays === null) return daysDiff >= minDays;

      return daysDiff >= minDays && daysDiff <= maxDays;
    }

    if (rule.condition === 'over' && typeof ruleValue === 'number') {
      return daysDiff >= ruleValue;
    }

    if (rule.condition === 'under' && typeof ruleValue === 'number') {
      return daysDiff <= ruleValue;
    }
    
    if (rule.condition === 'exactly' && typeof ruleValue === 'number') {
      return daysDiff === ruleValue;
    }


    return false;
  };
}
  // Handle string-based conditions (sentiment, option_type, etc.)
  if (categoricalFields?.includes(ruleName)) {
    return (item) => {
      // If ruleValue is empty, undefined, or "any", return true for all items
      if (ruleValue === "" || ruleValue === undefined || isAny(ruleValue)) {
        return true;
      }

      const itemValue = item[rule.name];
      
      // Handle array of values for categorical fields
      if (Array?.isArray(ruleValue)) {
        // Remove any empty or undefined values from ruleValue
        const validRuleValues = ruleValue?.filter(val => val !== "" && val !== undefined);
        
        // If no valid values remain, return true for all items
        if (validRuleValues.length === 0) {
          return true;
        }

        // If itemValue is an array, check if any of the values match
        if (Array?.isArray(itemValue)) {
          return validRuleValues?.some(val => 
            itemValue.some(iv => iv.toLowerCase() === val.toLowerCase())
          );
        }
        
        // If itemValue is a string, check if it's in the validRuleValues array
        return validRuleValues?.some(val => 
          itemValue?.toLowerCase() === val.toLowerCase()
        );
      }
      
      // Handle single string value
      if (typeof ruleValue === 'string') {
        // If itemValue is an array, check if any value matches
        if (Array?.isArray(itemValue)) {
          return itemValue?.some(iv => iv.toLowerCase() === ruleValue.toLowerCase());
        }
        
        // If both are strings, do a direct comparison
        return itemValue?.toLowerCase() === ruleValue.toLowerCase();
      }
      
      return false;
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
    ? filterQuery?.split(",")?.map((ticker) => ticker?.trim()?.toUpperCase())
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
  
  filteredData = Array?.from(
    new Map(filteredData?.map((item) => [item?.id, item]))?.values()
  );

  postMessage({ message: "success", filteredData });
};

export {};
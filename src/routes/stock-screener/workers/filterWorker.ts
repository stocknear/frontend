import { sectorList, industryList, listOfRelevantCountries } from "$lib/utils";

const generateMovingAverageConditions = () => {
  const conditions = {};
  const periods = [20, 50, 100, 200];
  const maTypes = ['ema', 'sma'];
  
  // Generate conditions for each MA type
  maTypes.forEach(maType => {
    const maTypeUpper = maType.toUpperCase();
    
    // Price above MA conditions
    periods.forEach(period => {
      const key = `Price above ${maTypeUpper}${period}`;
      conditions[key] = (item) => item.price > item[`${maType}${period}`];
    });
    
    // Price below MA conditions
    periods.forEach(period => {
      const key = `Price below ${maTypeUpper}${period}`;
      conditions[key] = (item) => item.price < item[`${maType}${period}`];
    });
    
    // MA cross conditions (all combinations)
    periods.forEach((period1, i) => {
      periods.forEach((period2, j) => {
        if (i !== j) { // Skip same period comparisons
          const key = `${maTypeUpper}${period1} above ${maTypeUpper}${period2}`;
          conditions[key] = (item) => item[`${maType}${period1}`] > item[`${maType}${period2}`];
        }
      });
    });
  });
  
  return conditions;
};

// Generate the moving average conditions
const movingAverageConditions = {
  ...generateMovingAverageConditions(),
  
  // Additional non-MA conditions
  "Price > Graham Number": (item) => item.price > item.grahamNumber,
  "Price < Graham Number": (item) => item.price < item.grahamNumber,
  "Price > Lynch Fair Value": (item) => item.price > item.lynchFairValue,
  "Price < Lynch Fair Value": (item) => item.price < item.lynchFairValue,
};



// Convert the input to a value or return it as-is if it's already an array
function convertUnitToValue(input: string | number | string[]) {
  try {
    if (Array.isArray(input)) {
      return input.map(convertUnitToValue); // Recursively convert array elements
    }
    if (typeof input === "number") return input;
    if (typeof input !== "string") {
      return input; // Return as-is if not a string or number
    }

    const lowerInput = input.toLowerCase();

    // Pre-compute the set for quick lookups
    const nonNumericValues = new Set([
      "any",
      ...sectorList,
      ...industryList,
      ...listOfRelevantCountries,
      'before market open',
      'after market close',
      'quarterly',
      'monthly',
      'annual',
      'semi-annual',
      "hold",
      "sell",
      "buy",
      "strong buy",
      "strong sell",
      "compliant",
      "non-compliant",
      "stock price",
    ]);
    
    if (nonNumericValues.has(lowerInput)) return input;

    // Handle percentage values
    if (input?.endsWith("%")) {
      const numericValue = parseFloat(input?.slice(0, -1));  // Remove '%' and convert to number
      if (isNaN(numericValue)) {
        return input; // Return original input if conversion fails
      }
      return numericValue //numericValue / 100; // Convert percentage to a decimal
    }

    // Handle units (B, M, K)
    const units = { B: 1_000_000_000, M: 1_000_000, K: 1_000 };
    const match = input.match(/^(-?\d+(\.\d+)?)([BMK])?$/); // Allow optional '-' at the beginning
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[3] as keyof typeof units;
      return unit ? value * units[unit] : value;
    }

    // Default numeric conversion (if no unit specified)
    const numericValue = parseFloat(input);
    if (isNaN(numericValue)) {
      return input; // Return original input if conversion fails
    }

    return numericValue;
  } catch (error) {
    console.warn(`Error converting value: ${input}`, error);
    return input; // Return original input in case of any unexpected errors
  }
}

// Centralized rule checking logic
function createRuleCheck(rule, ruleName, ruleValue) {
  // Handle 'any' condition quickly
  if (rule.value === 'any') return () => true;


if (['earningsDate', 'exDividendDate'].includes(rule.name)) {
  // If rule.value explicitly says 'any' or is empty -> always match
  const rawVal = rule.value;
  if (
    rawVal === undefined ||
    rawVal === null ||
    (typeof rawVal === 'string' && rawVal.trim().toLowerCase() === 'any') ||
    (Array.isArray(rawVal) && rawVal.length === 0)
  ) {
    return () => true;
  }

  // Get "midnight UTC" of "today"
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  // Helper: format a Date object as "YYYY-MM-DD"
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  // Pre-compute ranges for each label (inclusive)
  const ranges: Record<string, [string, string]> = {
    'today': [fmt(todayUTC), fmt(todayUTC)],
    'tomorrow': [
      fmt(new Date(todayUTC.getTime() + 24 * 60 * 60_000)),
      fmt(new Date(todayUTC.getTime() + 24 * 60 * 60_000))
    ],
    'next 7d': [
      fmt(todayUTC),
      fmt(new Date(todayUTC.getTime() + 6 * 24 * 60 * 60_000)) // include today + next 6 days
    ],
    'next 30d': [
      fmt(todayUTC),
      fmt(new Date(todayUTC.getTime() + 29 * 24 * 60 * 60_000)) // include today + next 29 days
    ],
    'this month': (() => {
      const start = new Date(Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth(), 1));
      const end = new Date(Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth() + 1, 0));
      return [fmt(start), fmt(end)];
    })(),
    'next month': (() => {
      const start = new Date(Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth() + 1, 1));
      const end = new Date(Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth() + 2, 0));
      return [fmt(start), fmt(end)];
    })()
  };

  // Build label list from rule.value (accept string or array)
  const labels = Array.isArray(rule.value)
    ? rule.value.map((v: any) => String(v).trim().toLowerCase())
    : [String(rule.value).trim().toLowerCase()];

  // Find the widest combined date range across labels
  let minDate = '9999-12-31';
  let maxDate = '0000-01-01';
  for (const label of labels) {
    if (!label) continue;
    const r = ranges[label];
    if (!r) {
      console.warn(`Unrecognized ${rule.name} label: "${label}"`);
      continue;
    }
    const [start, end] = r;
    if (start < minDate) minDate = start;
    if (end > maxDate) maxDate = end;
  }

  // If no valid labels were found, match everything
  if (minDate === '9999-12-31' || maxDate === '0000-01-01') {
    return () => true;
  }

  // Return predicate that checks the relevant field dynamically (earningsDate or exDividendDate)
  return (item: any) => {
    const raw = item?.[rule.name];
    if (!raw) return false;

    // Accept strings, numbers (timestamps), or Date objects
    let d: Date;
    if (raw instanceof Date) d = raw;
    else if (typeof raw === 'number') d = new Date(raw);
    else d = new Date(String(raw));

    if (isNaN(d.getTime())) return false;

    // Normalize to UTC midnight and compare ISO date strings
    const itemUTC = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const itemDateStr = fmt(itemUTC);

    return itemDateStr >= minDate && itemDateStr <= maxDate;
  };
}

    

  // Categorical checks
  const categoricalFields = [
    'analystRating', 'topAnalystRating', 'earningsTime','halalStocks', 'score', 
    'sector', 'industry', 'country','payoutFrequency'
  ];

  if (categoricalFields.includes(rule.name)) {
    return (item) => {
      const itemValue = item[rule.name];
      if (Array.isArray(ruleValue)) {
        return ruleValue.includes(itemValue);
      }
      return itemValue === ruleValue;
    };
  }

  // Moving averages checks
  const movingAverageFields = [
    'ema20', 'ema50', 'ema100', 'ema200', 
    'sma20', 'sma50', 'sma100', 'sma200', 
    'grahamnumber','lynchfairvalue'
  ];

  if (movingAverageFields.includes(ruleName)) {
    return (item) => {
      if (Array.isArray(ruleValue)) {
        return ruleValue.every(condition => 
          movingAverageConditions[condition]?.(item) ?? true
        );
      }
      return true;
    };
  }

  // Between condition
  if (rule.condition === 'between' && Array?.isArray(ruleValue)) {
    return (item) => {
      const itemValue = item[rule.name];
      const [min, max] = ruleValue?.map(convertUnitToValue);


      // Handle empty/undefined min and max
      if ((min === '' || min === undefined || min === null) && 
          (max === '' || max === undefined || max === null)) {
        return true;
      }

      if (min === '' || min === undefined || min === null) {
        return itemValue < max;
      }

      if (max === '' || max === undefined || max === null) {
        return itemValue > min;
      }
      
      return itemValue > min && itemValue < max;
    };
  }

  // Default numeric comparisons
  return (item) => {
    const itemValue = item[rule.name];
    if (itemValue === null) return false;

   if (rule.condition === 'exactly' && itemValue !== ruleValue) return false;
  if (rule.condition === 'over' && itemValue <= ruleValue) return false;
  if (rule.condition === 'under' && itemValue > ruleValue) return false;



    // Default comparison if no specific condition
    return true;
  };
}


async function filterStockScreenerData(stockScreenerData, ruleOfList) {
  // Early return if no data or no rules
  if (!stockScreenerData?.length || !ruleOfList?.length) {
    return stockScreenerData || [];
  }

  // Precompile rule conditions to avoid repeated checks
  const compiledRules = ruleOfList.map(rule => {
    const ruleName = rule.name.toLowerCase();
    const ruleValue = convertUnitToValue(rule.value);

    return {
      ...rule,
      compiledCheck: createRuleCheck(rule, ruleName, ruleValue)
    };
  });

  // Use a more performant filtering method
  return stockScreenerData?.filter(item => 
    compiledRules?.every(rule => rule.compiledCheck(item))
  );
}


onmessage = async (event: MessageEvent) => {
  const { stockScreenerData, ruleOfList } = event.data || {};

  try {
    let filteredData = await filterStockScreenerData(
      stockScreenerData,
      ruleOfList
    );

    filteredData = filteredData?.sort((a,b) => b?.marketCap - a?.marketCap);

    postMessage({ 
      message: "success", 
      filteredData,
      originalDataLength: stockScreenerData?.length || 0,
      filteredDataLength: filteredData?.length || 0
    });
  } catch (error) {
    console.error('Error in onmessage handler:', error);
    postMessage({ 
      message: "error", 
      originalData: stockScreenerData,
      error: error.toString()
    });
  }
};

export {};
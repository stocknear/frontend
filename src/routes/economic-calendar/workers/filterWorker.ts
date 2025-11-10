// Country list with codes
export const listOfRelevantCountries = [
  { US: "United States" },
  { CN: "China" },
  { CA: "Canada" },
  { GB: "United Kingdom" },
  { JP: "Japan" },
  { IL: "Israel" },
  { BR: "Brazil" },
  { FR: "France" },
  { IE: "Ireland" },
  { DE: "Germany" },
  { MX: "Mexico" },
  { IN: "India" },
  { AU: "Australia" },
  { KR: "South Korea" },
  { SE: "Sweden" },
  { NL: "Netherlands" },
  { CH: "Switzerland" },
  { TW: "Taiwan" },
  { ZA: "South Africa" },
  { HK: "Hong Kong" },
  { SG: "Singapore" },
  { AR: "Argentina" },
  { CL: "Chile" },
  { PH: "Philippines" },
  { TR: "Turkey" },
  { IT: "Italy" },
  { ID: "Indonesia" },
  { MY: "Malaysia" },
  { LU: "Luxembourg" },
  { VN: "Vietnam" },
  { NZ: "New Zealand" },
  { DK: "Denmark" },
  { NO: "Norway" },
  { FI: "Finland" },
  { RU: "Russia" },
  { AE: "United Arab Emirates" },
];

// Pre-compute country map for O(1) lookups
const countryMap = new Map<string, string>(
  listOfRelevantCountries.map((entry) => {
    const [code, name] = Object.entries(entry)[0];
    return [name, code];
  })
);

// Type definitions for better type safety
interface CalendarItem {
  country: string;
  importance: number;
  [key: string]: any;
}

interface FilterMessage {
  rawData: CalendarItem[][];
  filterList: (string | number)[];
}

// Optimized message handler
onmessage = async (event: MessageEvent<FilterMessage>) => {
  const { rawData, filterList } = event.data;

  if (!rawData || !filterList) {
    postMessage({ message: "error", error: "Invalid data provided" });
    return;
  }

  // Early return if no filters
  if (filterList.length === 0) {
    postMessage({ message: "success", finalData: { output: rawData } });
    return;
  }

  // Separate and type filters efficiently
  const importanceFilters = new Set<number>();
  const countryFilters = new Set<string>();

  filterList.forEach(item => {
    if (typeof item === "number" && item >= 1 && item <= 3) {
      importanceFilters.add(item);
    } else if (typeof item === "string") {
      countryFilters.add(item);
    }
  });

  // Map country names to codes for faster filtering
  const filterCodes = new Set<string>(
    Array.from(countryFilters).map(name => countryMap.get(name) || "")
      .filter(code => code !== "")
  );

  // Apply filters efficiently with early termination
  const hasCountryFilter = filterCodes.size > 0;
  const hasImportanceFilter = importanceFilters.size > 0;

  const output = rawData.map(subArray => {
    // Skip empty arrays
    if (!subArray || subArray.length === 0) {
      return [];
    }

    return subArray.filter(item => {
      // Early termination checks
      if (!item) return false;

      // Check country filter
      if (hasCountryFilter && !filterCodes.has(item.country)) {
        return false;
      }

      // Check importance filter
      if (hasImportanceFilter && !importanceFilters.has(item.importance)) {
        return false;
      }

      return true;
    });
  });

  // Send response
  postMessage({ 
    message: "success", 
    finalData: { output } 
  });
};

export {};
// Auto-synced from /routes/etf/screener/+page.svelte allRules metadata.
// Keep this aligned with ETF screener filter definitions.

export type CompareColumnRule = {
  name: string;
  rule: string;
  type?: string;
};

export type CompareTab = {
  key: string;
  label: string;
};

const ETF_STRING_RULES = new Set([
  "assetClass",
  "etfProvider",
  "topSector",
  "aumGroup",
  "payoutFrequency",
  "country",
]);

const ETF_FLOAT_RULES = new Set([
  "price",
  "expenseRatio",
  "beta",
  "pe",
  "nav",
]);

const ETF_INT_RULES = new Set([
  "totalAssets",
  "marketCap",
]);

const mapRuleType = (rule: string, varType: string | null): string => {
  if (varType === "percent") return "percent";
  if (varType === "percentSign") return "percentSign";
  if (ETF_STRING_RULES.has(rule)) return "str";
  if (ETF_FLOAT_RULES.has(rule)) return "float";
  if (ETF_INT_RULES.has(rule)) return "int";
  return "decimal";
};

const ETF_COMPARE_RULE_META: Array<{ rule: string; label: string; varType: string | null }> = [
  {
    "rule": "totalAssets",
    "label": "AUM",
    "varType": null
  },
  {
    "rule": "expenseRatio",
    "label": "Expense Ratio (%)",
    "varType": "percent"
  },
  {
    "rule": "numberOfHoldings",
    "label": "Holdings",
    "varType": null
  },
  {
    "rule": "dividendYield",
    "label": "Dividend Yield",
    "varType": "percent"
  },
  {
    "rule": "beta",
    "label": "Beta",
    "varType": null
  },
  {
    "rule": "assetClass",
    "label": "Asset Class",
    "varType": null
  },
  {
    "rule": "etfProvider",
    "label": "ETF Provider",
    "varType": null
  },
  {
    "rule": "price",
    "label": "Price",
    "varType": null
  },
  {
    "rule": "volume",
    "label": "Volume",
    "varType": null
  },
  {
    "rule": "avgVolume",
    "label": "Average Volume",
    "varType": null
  },
  {
    "rule": "relativeVolume",
    "label": "Relative Volume",
    "varType": "percentSign"
  },
  {
    "rule": "changesPercentage",
    "label": "Price Change 1D",
    "varType": "percentSign"
  },
  {
    "rule": "change1W",
    "label": "Price Change 1W",
    "varType": "percentSign"
  },
  {
    "rule": "change1M",
    "label": "Price Change 1M",
    "varType": "percentSign"
  },
  {
    "rule": "change3M",
    "label": "Price Change 3M",
    "varType": "percentSign"
  },
  {
    "rule": "change6M",
    "label": "Price Change 6M",
    "varType": "percentSign"
  },
  {
    "rule": "change1Y",
    "label": "Price Change 1Y",
    "varType": "percentSign"
  },
  {
    "rule": "change3Y",
    "label": "Price Change 3Y",
    "varType": "percentSign"
  },
  {
    "rule": "totalReturn1M",
    "label": "Total Return 1M",
    "varType": "percentSign"
  },
  {
    "rule": "totalReturn3M",
    "label": "Total Return 3M",
    "varType": "percentSign"
  },
  {
    "rule": "totalReturn6M",
    "label": "Total Return 6M",
    "varType": "percentSign"
  },
  {
    "rule": "totalReturnYTD",
    "label": "Total Return YTD",
    "varType": "percentSign"
  },
  {
    "rule": "totalReturn1Y",
    "label": "Total Return 1Y",
    "varType": "percentSign"
  },
  {
    "rule": "totalReturn3Y",
    "label": "Total Return 3Y",
    "varType": "percentSign"
  },
  {
    "rule": "totalReturn5Y",
    "label": "Total Return 5Y",
    "varType": "percentSign"
  },
  {
    "rule": "totalReturn10Y",
    "label": "Total Return 10Y",
    "varType": "percentSign"
  },
  {
    "rule": "cagr1Y",
    "label": "CAGR 1Y",
    "varType": "percentSign"
  },
  {
    "rule": "cagr3Y",
    "label": "CAGR 3Y",
    "varType": "percentSign"
  },
  {
    "rule": "cagr5Y",
    "label": "CAGR 5Y",
    "varType": "percentSign"
  },
  {
    "rule": "cagr10Y",
    "label": "CAGR 10Y",
    "varType": "percentSign"
  },
  {
    "rule": "annualDividend",
    "label": "Annual Dividend",
    "varType": null
  },
  {
    "rule": "payoutFrequency",
    "label": "Dividend Payout Frequency",
    "varType": null
  },
  {
    "rule": "yearHigh",
    "label": "52W High",
    "varType": null
  },
  {
    "rule": "yearLow",
    "label": "52W Low",
    "varType": null
  },
  {
    "rule": "fromHigh52W",
    "label": "From 52W High (%)",
    "varType": "percentSign"
  },
  {
    "rule": "fromLow52W",
    "label": "From 52W Low (%)",
    "varType": "percentSign"
  },
  {
    "rule": "pe",
    "label": "PE Ratio",
    "varType": null
  },
  {
    "rule": "nav",
    "label": "NAV",
    "varType": null
  },
  {
    "rule": "marketCap",
    "label": "Market Cap",
    "varType": null
  },
  {
    "rule": "topSector",
    "label": "Top Sector",
    "varType": null
  },
  {
    "rule": "aumGroup",
    "label": "AUM Group",
    "varType": null
  },
  {
    "rule": "country",
    "label": "Country",
    "varType": null
  }
];

export const ETF_COMPARE_DEFAULT_LIST: CompareColumnRule[] = [
  { name: "AUM", rule: "totalAssets", type: "int" },
  { name: "Price", rule: "price", type: "float" },
  { name: "% Change", rule: "changesPercentage", type: "percentSign" },
  { name: "Expense Ratio", rule: "expenseRatio", type: "percent" },
  { name: "Holdings", rule: "numberOfHoldings", type: "decimal" },
];

export const ETF_COMPARE_TABS: CompareTab[] = [
  { key: "general", label: "General" },
  { key: "performance", label: "Performance" },
  { key: "dividends", label: "Dividends" },
  { key: "indicators", label: "Indicators" },
];

export const ETF_COMPARE_TAB_RULE_SETS: Record<string, CompareColumnRule[]> = {
  performance: [
    { name: "AUM", rule: "totalAssets", type: "int" },
    { name: "Price Change 1W", rule: "change1W", type: "percentSign" },
    { name: "Price Change 1M", rule: "change1M", type: "percentSign" },
    { name: "Price Change 3M", rule: "change3M", type: "percentSign" },
    { name: "Price Change 1Y", rule: "change1Y", type: "percentSign" },
  ],
  dividends: [
    { name: "AUM", rule: "totalAssets", type: "int" },
    { name: "Annual Dividend", rule: "annualDividend", type: "decimal" },
    { name: "Dividend Yield", rule: "dividendYield", type: "percent" },
    { name: "Dividend Payout Frequency", rule: "payoutFrequency", type: "str" },
  ],
};

export const ETF_COMPARE_INDICATOR_ROWS: CompareColumnRule[] =
  ETF_COMPARE_RULE_META.map((item) => ({
    name: item.label,
    rule: item.rule,
    type: mapRuleType(item.rule, item.varType),
  }));

export const ETF_COMPARE_INDICATOR_DEFAULT_ROWS: CompareColumnRule[] = [
  ...ETF_COMPARE_DEFAULT_LIST,
];

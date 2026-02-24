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
  "rsi",
  "stochRSI",
  "mfi",
  "cci",
  "atr",
  "pe",
  "nav",
]);

const mapRuleType = (rule: string, varType: string | null): string => {
  if (varType === "percent") return "percent";
  if (varType === "percentSign") return "percentSign";
  if (ETF_STRING_RULES.has(rule)) return "str";
  if (ETF_FLOAT_RULES.has(rule)) return "float";
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
    "rule": "rsi",
    "label": "Relative Strength Index",
    "varType": null
  },
  {
    "rule": "stochRSI",
    "label": "Stochastic RSI Fast",
    "varType": null
  },
  {
    "rule": "mfi",
    "label": "Money Flow Index",
    "varType": null
  },
  {
    "rule": "cci",
    "label": "Commodity Channel Index",
    "varType": null
  },
  {
    "rule": "atr",
    "label": "Average True Range",
    "varType": null
  },
  {
    "rule": "sma20",
    "label": "20-Day Moving Average",
    "varType": null
  },
  {
    "rule": "sma50",
    "label": "50-Day Moving Average",
    "varType": null
  },
  {
    "rule": "sma100",
    "label": "100-Day Moving Average",
    "varType": null
  },
  {
    "rule": "sma200",
    "label": "200-Day Moving Average",
    "varType": null
  },
  {
    "rule": "ema20",
    "label": "20-Day Exp. Moving Average",
    "varType": null
  },
  {
    "rule": "ema50",
    "label": "50-Day Exp. Moving Average",
    "varType": null
  },
  {
    "rule": "ema100",
    "label": "100-Day Exp. Moving Average",
    "varType": null
  },
  {
    "rule": "ema200",
    "label": "200-Day Exp. Moving Average",
    "varType": null
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
  { name: "AUM", rule: "totalAssets", type: "decimal" },
  { name: "Price", rule: "price", type: "float" },
  { name: "% Change", rule: "changesPercentage", type: "percentSign" },
  { name: "Expense Ratio", rule: "expenseRatio", type: "percent" },
  { name: "Holdings", rule: "numberOfHoldings", type: "decimal" },
];

export const ETF_COMPARE_TABS: CompareTab[] = [
  { key: "general", label: "General" },
  { key: "performance", label: "Performance" },
  { key: "technicals", label: "Technicals" },
  { key: "dividends", label: "Dividends" },
  { key: "indicators", label: "Indicators" },
];

export const ETF_COMPARE_TAB_RULE_SETS: Record<string, CompareColumnRule[]> = {
  performance: [
    { name: "AUM", rule: "totalAssets", type: "decimal" },
    { name: "Price Change 1W", rule: "change1W", type: "percentSign" },
    { name: "Price Change 1M", rule: "change1M", type: "percentSign" },
    { name: "Price Change 3M", rule: "change3M", type: "percentSign" },
    { name: "Price Change 1Y", rule: "change1Y", type: "percentSign" },
  ],
  technicals: [
    { name: "AUM", rule: "totalAssets", type: "decimal" },
    { name: "Relative Strength Index", rule: "rsi", type: "float" },
    { name: "50-Day Moving Average", rule: "sma50", type: "decimal" },
    { name: "200-Day Moving Average", rule: "sma200", type: "decimal" },
    { name: "Beta", rule: "beta", type: "float" },
  ],
  dividends: [
    { name: "AUM", rule: "totalAssets", type: "decimal" },
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

/**
 * Metric Overlay Configuration
 * 
 * Defines which metrics support overlay views in the expanded chart modal.
 * Each base metric can have multiple overlay options that show related data.
 */

export type OverlayType = {
  key: string;
  label: string;
  primary?: boolean;
  /** If series is provided, overlay multiple metrics together */
  series?: string[];
  /** If computed is true, the value needs to be calculated from other metrics */
  computed?: boolean;
  /** Formula description for computed metrics */
  formula?: string;
  /** Related metric keys used for computation */
  relatedMetrics?: string[];
};

export type MetricOverlayConfig = {
  baseMetric: string;
  label: string;
  overlays: OverlayType[];
  /** Color theme for this metric group */
  colorTheme?: 'revenue' | 'income' | 'cashflow' | 'margin' | 'pershare' | 'debt' | 'default';
};

/**
 * Color themes for different metric categories
 */
export const CHART_COLOR_THEMES = {
  revenue: {
    primary: '#F59E0B', // Amber
    secondary: '#FBBF24',
    light: '#FEF3C7',
    dark: '#92400E',
  },
  income: {
    primary: '#10B981', // Emerald
    secondary: '#34D399',
    light: '#D1FAE5',
    dark: '#065F46',
  },
  cashflow: {
    primary: '#3B82F6', // Blue
    secondary: '#60A5FA',
    light: '#DBEAFE',
    dark: '#1E40AF',
  },
  margin: {
    primary: '#8B5CF6', // Violet
    secondary: '#A78BFA',
    light: '#EDE9FE',
    dark: '#5B21B6',
  },
  pershare: {
    primary: '#EC4899', // Pink
    secondary: '#F472B6',
    light: '#FCE7F3',
    dark: '#9D174D',
  },
  debt: {
    primary: '#EF4444', // Red
    secondary: '#F87171',
    light: '#FEE2E2',
    dark: '#991B1B',
  },
  default: {
    primary: '#6B7280', // Gray
    secondary: '#9CA3AF',
    light: '#F3F4F6',
    dark: '#374151',
  },
} as const;

/**
 * Income Statement Metric Overlays
 */
export const INCOME_STATEMENT_OVERLAYS: MetricOverlayConfig[] = [
  {
    baseMetric: 'revenue',
    label: 'Revenue',
    colorTheme: 'revenue',
    overlays: [
      { key: 'revenue', label: 'Revenue', primary: true },
      { key: 'revenuePerShare', label: 'Revenue Per Share', computed: true, relatedMetrics: ['revenue', 'weightedAverageShsOut'] },
    ],
  },
  {
    baseMetric: 'grossProfit',
    label: 'Gross Profit',
    colorTheme: 'income',
    overlays: [
      { key: 'grossProfit', label: 'Gross Profit', primary: true },
      { key: 'grossProfitMargin', label: 'Gross Margin', computed: true, formula: 'grossProfit / revenue * 100' },
    ],
  },
  {
    baseMetric: 'operatingIncome',
    label: 'Operating Income',
    colorTheme: 'income',
    overlays: [
      { key: 'operatingIncome', label: 'Operating Income', primary: true },
      { key: 'operatingMargin', label: 'Operating Margin', computed: true, formula: 'operatingIncome / revenue * 100' },
    ],
  },
  {
    baseMetric: 'netIncome',
    label: 'Net Income',
    colorTheme: 'income',
    overlays: [
      { key: 'netIncome', label: 'Net Income', primary: true },
      { key: 'eps', label: 'EPS (Basic)' },
      { key: 'epsDiluted', label: 'EPS (Diluted)' },
      { key: 'netProfitMargin', label: 'Net Profit Margin', computed: true, formula: 'netIncome / revenue * 100' },
    ],
  },
  {
    baseMetric: 'ebitda',
    label: 'EBITDA',
    colorTheme: 'income',
    overlays: [
      { key: 'ebitda', label: 'EBITDA', primary: true },
      { key: 'ebitdaMargin', label: 'EBITDA Margin', computed: true, formula: 'ebitda / revenue * 100' },
    ],
  },
  {
    baseMetric: 'eps',
    label: 'EPS',
    colorTheme: 'pershare',
    overlays: [
      { key: 'eps', label: 'EPS (Basic)', primary: true },
      { key: 'epsDiluted', label: 'EPS (Diluted)' },
    ],
  },
  {
    baseMetric: 'epsDiluted',
    label: 'EPS (Diluted)',
    colorTheme: 'pershare',
    overlays: [
      { key: 'epsDiluted', label: 'EPS (Diluted)', primary: true },
      { key: 'eps', label: 'EPS (Basic)' },
    ],
  },
];

/**
 * Cash Flow Statement Metric Overlays
 */
export const CASH_FLOW_OVERLAYS: MetricOverlayConfig[] = [
  {
    baseMetric: 'freeCashFlow',
    label: 'Free Cash Flow',
    colorTheme: 'cashflow',
    overlays: [
      { key: 'freeCashFlow', label: 'FCF', primary: true },
      { key: 'fcfPerShare', label: 'FCF Per Share', computed: true, relatedMetrics: ['freeCashFlow', 'weightedAverageShsOut'] },
      { key: 'fcfAndSbc', label: 'FCF & SBC', series: ['freeCashFlow', 'stockBasedCompensation'] },
      { key: 'sbcAdjFcf', label: 'SBC Adj. FCF', computed: true, formula: 'freeCashFlow - stockBasedCompensation', relatedMetrics: ['freeCashFlow', 'stockBasedCompensation'] },
      { key: 'sbcAdjFcfPerShare', label: 'SBC Adj. FCF/Share', computed: true, relatedMetrics: ['freeCashFlow', 'stockBasedCompensation', 'weightedAverageShsOut'] },
    ],
  },
  {
    baseMetric: 'operatingCashFlow',
    label: 'Operating Cash Flow',
    colorTheme: 'cashflow',
    overlays: [
      { key: 'operatingCashFlow', label: 'Operating CF', primary: true },
      { key: 'ocfPerShare', label: 'OCF Per Share', computed: true, relatedMetrics: ['operatingCashFlow', 'weightedAverageShsOut'] },
    ],
  },
  {
    baseMetric: 'netCashProvidedByOperatingActivities',
    label: 'Net Cash from Operations',
    colorTheme: 'cashflow',
    overlays: [
      { key: 'netCashProvidedByOperatingActivities', label: 'Net Cash from Operations', primary: true },
    ],
  },
  {
    baseMetric: 'capitalExpenditure',
    label: 'Capital Expenditures',
    colorTheme: 'debt',
    overlays: [
      { key: 'capitalExpenditure', label: 'CapEx', primary: true },
      { key: 'capexToRevenue', label: 'CapEx % of Revenue', computed: true, formula: 'capitalExpenditure / revenue * 100' },
    ],
  },
  {
    baseMetric: 'stockBasedCompensation',
    label: 'Stock-Based Compensation',
    colorTheme: 'margin',
    overlays: [
      { key: 'stockBasedCompensation', label: 'SBC', primary: true },
      { key: 'sbcToRevenue', label: 'SBC % of Revenue', computed: true, formula: 'stockBasedCompensation / revenue * 100' },
    ],
  },
  {
    baseMetric: 'commonDividendsPaid',
    label: 'Dividends Paid',
    colorTheme: 'income',
    overlays: [
      { key: 'commonDividendsPaid', label: 'Dividends', primary: true },
      { key: 'dividendsPerShare', label: 'Dividends Per Share', computed: true },
    ],
  },
  {
    baseMetric: 'commonStockRepurchased',
    label: 'Stock Repurchased',
    colorTheme: 'pershare',
    overlays: [
      { key: 'commonStockRepurchased', label: 'Buybacks', primary: true },
    ],
  },
];

/**
 * Balance Sheet Metric Overlays
 */
export const BALANCE_SHEET_OVERLAYS: MetricOverlayConfig[] = [
  {
    baseMetric: 'totalAssets',
    label: 'Total Assets',
    colorTheme: 'revenue',
    overlays: [
      { key: 'totalAssets', label: 'Total Assets', primary: true },
      { key: 'bookValuePerShare', label: 'Book Value/Share', computed: true },
    ],
  },
  {
    baseMetric: 'totalLiabilities',
    label: 'Total Liabilities',
    colorTheme: 'debt',
    overlays: [
      { key: 'totalLiabilities', label: 'Total Liabilities', primary: true },
    ],
  },
  {
    baseMetric: 'totalDebt',
    label: 'Total Debt',
    colorTheme: 'debt',
    overlays: [
      { key: 'totalDebt', label: 'Total Debt', primary: true },
      { key: 'netDebt', label: 'Net Debt', computed: true, formula: 'totalDebt - cashAndCashEquivalents' },
      { key: 'debtToEquity', label: 'Debt to Equity', computed: true },
    ],
  },
  {
    baseMetric: 'cashAndCashEquivalents',
    label: 'Cash & Equivalents',
    colorTheme: 'cashflow',
    overlays: [
      { key: 'cashAndCashEquivalents', label: 'Cash', primary: true },
      { key: 'cashAndShortTermInvestments', label: 'Cash + ST Investments' },
      { key: 'netCashPosition', label: 'Net Cash Position', computed: true, formula: 'cash - totalDebt' },
    ],
  },
  {
    baseMetric: 'totalStockholdersEquity',
    label: 'Shareholders Equity',
    colorTheme: 'income',
    overlays: [
      { key: 'totalStockholdersEquity', label: 'Shareholders Equity', primary: true },
      { key: 'tangibleBookValue', label: 'Tangible Book Value', computed: true },
    ],
  },
  {
    baseMetric: 'retainedEarnings',
    label: 'Retained Earnings',
    colorTheme: 'income',
    overlays: [
      { key: 'retainedEarnings', label: 'Retained Earnings', primary: true },
    ],
  },
];

/**
 * Financial Ratios Metric Overlays
 */
export const RATIOS_OVERLAYS: MetricOverlayConfig[] = [
  {
    baseMetric: 'returnOnEquity',
    label: 'Return on Equity',
    colorTheme: 'margin',
    overlays: [
      { key: 'returnOnEquity', label: 'ROE', primary: true },
    ],
  },
  {
    baseMetric: 'returnOnAssets',
    label: 'Return on Assets',
    colorTheme: 'margin',
    overlays: [
      { key: 'returnOnAssets', label: 'ROA', primary: true },
    ],
  },
  {
    baseMetric: 'returnOnInvestedCapital',
    label: 'Return on Invested Capital',
    colorTheme: 'margin',
    overlays: [
      { key: 'returnOnInvestedCapital', label: 'ROIC', primary: true },
    ],
  },
  {
    baseMetric: 'returnOnCapitalEmployed',
    label: 'Return on Capital Employed',
    colorTheme: 'margin',
    overlays: [
      { key: 'returnOnCapitalEmployed', label: 'ROCE', primary: true },
    ],
  },
  {
    baseMetric: 'freeCashFlowYield',
    label: 'Free Cash Flow Yield',
    colorTheme: 'cashflow',
    overlays: [
      { key: 'freeCashFlowYield', label: 'FCF Yield', primary: true },
    ],
  },
  {
    baseMetric: 'currentRatio',
    label: 'Current Ratio',
    colorTheme: 'default',
    overlays: [
      { key: 'currentRatio', label: 'Current Ratio', primary: true },
      { key: 'quickRatio', label: 'Quick Ratio' },
    ],
  },
  {
    baseMetric: 'debtToEquity',
    label: 'Debt to Equity',
    colorTheme: 'debt',
    overlays: [
      { key: 'debtToEquity', label: 'D/E Ratio', primary: true },
      { key: 'debtToAssets', label: 'Debt to Assets' },
    ],
  },
];

/**
 * Overview Composite Metric Overlays
 */
export const OVERVIEW_OVERLAYS: MetricOverlayConfig[] = [
  {
    baseMetric: 'stockPrice',
    label: 'Stock Price',
    colorTheme: 'default',
    overlays: [
      { key: 'stockPrice', label: 'Stock Price', primary: true },
    ],
  },
  {
    baseMetric: 'cashAndDebt',
    label: 'Cash & Debt',
    colorTheme: 'cashflow',
    overlays: [
      { key: 'cashAndCashEquivalents', label: 'Cash', primary: true },
      { key: 'longTermDebt', label: 'Long-Term Debt' },
      { key: 'capitalLeaseObligations', label: 'Lease Obligations' },
    ],
  },
  {
    baseMetric: 'returnOfCapital',
    label: 'Return of Capital',
    colorTheme: 'pershare',
    overlays: [
      { key: 'commonStockRepurchased', label: 'Buybacks', primary: true },
      { key: 'commonDividendsPaid', label: 'Dividends' },
    ],
  },
  {
    baseMetric: 'margins',
    label: 'Margins',
    colorTheme: 'margin',
    overlays: [
      { key: 'returnOnCapitalEmployed', label: 'ROCE', primary: true },
      { key: 'grossProfitMargin', label: 'Gross Margin' },
      { key: 'operatingProfitMargin', label: 'Operating Margin' },
      { key: 'netProfitMargin', label: 'Net Margin' },
    ],
  },
  {
    baseMetric: 'expenses',
    label: 'Expenses',
    colorTheme: 'debt',
    overlays: [
      { key: 'capitalExpenditure', label: 'CapEx', primary: true },
      { key: 'sellingAndMarketingExpenses', label: 'S&M' },
      { key: 'sellingGeneralAndAdministrativeExpenses', label: 'SG&A' },
      { key: 'researchAndDevelopmentExpenses', label: 'R&D' },
    ],
  },
];

/**
 * Combined map of all overlays for quick lookup
 */
export const ALL_METRIC_OVERLAYS: Map<string, MetricOverlayConfig> = new Map([
  ...INCOME_STATEMENT_OVERLAYS,
  ...CASH_FLOW_OVERLAYS,
  ...BALANCE_SHEET_OVERLAYS,
  ...RATIOS_OVERLAYS,
  ...OVERVIEW_OVERLAYS,
].map(config => [config.baseMetric, config]));

/**
 * Get overlay configuration for a metric
 */
export function getMetricOverlayConfig(metricKey: string): MetricOverlayConfig | undefined {
  return ALL_METRIC_OVERLAYS.get(metricKey);
}

/**
 * Check if a metric has overlay options
 */
export function hasMetricOverlays(metricKey: string): boolean {
  const config = ALL_METRIC_OVERLAYS.get(metricKey);
  return config !== undefined && config.overlays.length > 1;
}

/**
 * Get chart color for a metric based on its theme
 */
export function getMetricChartColor(metricKey: string, variant: 'primary' | 'secondary' = 'primary'): string {
  const config = ALL_METRIC_OVERLAYS.get(metricKey);
  const theme = config?.colorTheme || 'default';
  return CHART_COLOR_THEMES[theme][variant];
}

/**
 * Get color theme for a metric
 */
export function getMetricColorTheme(metricKey: string): keyof typeof CHART_COLOR_THEMES {
  const config = ALL_METRIC_OVERLAYS.get(metricKey);
  return config?.colorTheme || 'default';
}

/**
 * Compute derived metric values
 */
export function computeDerivedMetric(
  overlayKey: string,
  data: Record<string, any>,
): number | null {
  switch (overlayKey) {
    case 'revenuePerShare':
      return computePerShare(data.revenue, data.weightedAverageShsOut);
    case 'fcfPerShare':
      return computePerShare(data.freeCashFlow, data.weightedAverageShsOut);
    case 'ocfPerShare':
      return computePerShare(data.operatingCashFlow, data.weightedAverageShsOut);
    case 'sbcAdjFcf':
      return computeSbcAdjustedFcf(data.freeCashFlow, data.stockBasedCompensation);
    case 'sbcAdjFcfPerShare':
      const adjFcf = computeSbcAdjustedFcf(data.freeCashFlow, data.stockBasedCompensation);
      return computePerShare(adjFcf, data.weightedAverageShsOut);
    case 'grossProfitMargin':
      return computeMargin(data.grossProfit, data.revenue);
    case 'operatingMargin':
      return computeMargin(data.operatingIncome, data.revenue);
    case 'netProfitMargin':
      return computeMargin(data.netIncome, data.revenue);
    case 'ebitdaMargin':
      return computeMargin(data.ebitda, data.revenue);
    case 'netDebt':
      return computeNetDebt(data.totalDebt, data.cashAndCashEquivalents);
    case 'netCashPosition':
      return computeNetCashPosition(data.cashAndCashEquivalents, data.totalDebt);
    default:
      return null;
  }
}

function computePerShare(value: number | null | undefined, shares: number | null | undefined): number | null {
  if (value == null || shares == null || shares === 0) return null;
  return value / shares;
}

function computeSbcAdjustedFcf(fcf: number | null | undefined, sbc: number | null | undefined): number | null {
  if (fcf == null) return null;
  const sbcValue = sbc ?? 0;
  return fcf - sbcValue;
}

function computeMargin(numerator: number | null | undefined, denominator: number | null | undefined): number | null {
  if (numerator == null || denominator == null || denominator === 0) return null;
  return (numerator / denominator) * 100;
}

function computeNetDebt(debt: number | null | undefined, cash: number | null | undefined): number | null {
  if (debt == null) return null;
  const cashValue = cash ?? 0;
  return debt - cashValue;
}

function computeNetCashPosition(cash: number | null | undefined, debt: number | null | undefined): number | null {
  if (cash == null) return null;
  const debtValue = debt ?? 0;
  return cash - debtValue;
}

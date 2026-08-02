export const FINANCIAL_RATIO_KEYS = [
  "priceToEarningsRatio",
  "priceToEarningsGrowthRatio",
  "returnOnEquity",
  "returnOnInvestedCapital",
  "netProfitMargin",
  "freeCashFlowYield",
  "debtToEquityRatio",
  "currentRatio",
  "forwardPE",
  "priceToSalesRatio",
  "priceToBookRatio",
  "priceToFreeCashFlowRatio",
  "priceToOperatingCashFlowRatio",
  "enterpriseValueMultiple",
  "priceToFairValue",
  "returnOnAssets",
  "returnOnCapitalEmployed",
  "grossProfitMargin",
  "operatingProfitMargin",
  "ebitdaMargin",
  "ebitMargin",
  "pretaxProfitMargin",
  "freeCashFlowMargin",
  "bottomLineProfitMargin",
  "continuousOperationsProfitMargin",
  "freeCashFlowPerShare",
  "revenuePerShare",
  "netIncomePerShare",
  "operatingCashFlowPerShare",
  "bookValuePerShare",
  "tangibleBookValuePerShare",
  "cashPerShare",
  "shareholdersEquityPerShare",
  "interestDebtPerShare",
  "capexPerShare",
  "dividendYield",
  "dividendPerShare",
  "dividendPayoutRatio",
  "dividendYieldPercentage",
  "quickRatio",
  "cashRatio",
  "debtToAssetsRatio",
  "debtToCapitalRatio",
  "longTermDebtToCapitalRatio",
  "debtToMarketCap",
  "financialLeverageRatio",
  "solvencyRatio",
  "interestCoverageRatio",
  "operatingCashFlowRatio",
  "operatingCashFlowSalesRatio",
  "freeCashFlowOperatingCashFlowRatio",
  "debtServiceCoverageRatio",
  "operatingCashFlowCoverageRatio",
  "capitalExpenditureCoverageRatio",
  "dividendPaidAndCapexCoverageRatio",
  "shortTermOperatingCashFlowCoverageRatio",
  "assetTurnover",
  "inventoryTurnover",
  "receivablesTurnover",
  "payablesTurnover",
  "fixedAssetTurnover",
  "workingCapitalTurnoverRatio",
  "effectiveTaxRate",
  "netIncomePerEBT",
  "ebtPerEbit",
] as const;

export type FinancialRatioKey = (typeof FINANCIAL_RATIO_KEYS)[number];

export type FinancialRatiosSourceCatalog = {
  sectionTitle: string;
  metrics: Record<FinancialRatioKey, readonly [label: string, description: string]>;
  seo: {
    title: string;
    description: string;
    keywords: string;
    name: string;
    headline: string;
    structuredDescription: string;
    aboutName: string;
    aboutDescription: string;
    home: string;
    stocks: string;
    financialStatements: string;
    financialRatios: string;
  };
};

export type FinancialRatiosPageCatalog = {
  sectionTitle: string;
  statementConfig: Array<{
    propertyName: FinancialRatioKey;
    label: string;
    text: string;
  }>;
  seo: FinancialRatiosSourceCatalog["seo"];
};

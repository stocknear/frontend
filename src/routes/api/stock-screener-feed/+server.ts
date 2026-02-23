import type { RequestHandler } from "./$types";

const allowedParams = [
  "page", "pageSize", "sortKey", "sortOrder", "search", "rules", "tab", "displayColumns",
] as const;

const MAX_PAGE_SIZE = 50000;
const MIN_PAGE_SIZE = 1;

const allowedDisplayColumns = new Set([
  "symbol", "name", "marketCap", "price", "changesPercentage", "volume",
  "priceToEarningsRatio", "priceToBookRatio", "priceToSalesRatio",
  "priceToEarningsGrowthRatio", "forwardPE", "forwardPS",
  "evToSales", "evToEBITDA", "evToEBIT", "evToFreeCashFlow",
  "enterpriseValue", "currentRatio", "quickRatio", "interestCoverageRatio",
  "eps", "epsGrowthYears", "cagr3YearEPS", "cagr5YearEPS",
  "priceToFreeCashFlowRatio", "priceToOperatingCashFlowRatio",
  "cashPerShare", "revenuePerShare", "netIncomePerShare",
  "shareholdersEquityPerShare", "capexPerShare",
  "operatingCashFlowSalesRatio", "earningsYield", "freeCashFlowYield",
  "avgVolume", "relativeVolume", "beta", "rsi", "stochRSI", "mfi", "cci", "atr",
  "sma20", "sma50", "sma100", "sma200",
  "ema20", "ema50", "ema100", "ema200",
  "grahamNumber", "grahamUpside", "lynchFairValue", "lynchUpside",
  "change1W", "change1M", "change3M", "change6M", "change1Y", "change3Y", "var",
  "revenue", "revenueGrowthYears", "growthRevenue",
  "cagr3YearRevenue", "cagr5YearRevenue",
  "researchDevelopmentRevenueRatio",
  "costOfRevenue", "growthCostOfRevenue",
  "costAndExpenses", "growthCostAndExpenses",
  "netIncome", "growthNetIncome", "netIncomeGrowthYears",
  "grossProfit", "growthGrossProfit", "grossProfitGrowthYears",
  "operatingIncome", "growthOperatingIncome",
  "ebit", "ebitda", "growthEBITDA",
  "freeCashFlow", "operatingCashFlow",
  "growthFreeCashFlow", "growthOperatingCashFlow",
  "freeCashFlowPerShare", "operatingCashFlowPerShare", "freeCashFlowMargin",
  "operatingExpenses", "growthOperatingExpenses",
  "interestExpense", "growthInterestExpense", "interestIncome",
  "researchAndDevelopmentExpenses", "growthResearchAndDevelopmentExpenses",
  "stockBasedCompensation", "growthStockBasedCompensation",
  "stockBasedCompensationToRevenue",
  "grossProfitMargin", "netProfitMargin", "pretaxProfitMargin",
  "ebitdaMargin", "ebitMargin", "operatingMargin",
  "dividendYield", "annualDividend", "dividendGrowth", "payoutRatio",
  "payoutFrequency", "exDividendDate",
  "totalDebt", "debtToEquityRatio", "growthTotalDebt", "interestDebtPerShare",
  "totalAssets", "tangibleAssetValue", "bookValue", "bookValuePerShare",
  "totalLiabilities", "growthTotalLiabilities", "workingCapital",
  "sharesOutStanding", "floatShares", "institutionalOwnership",
  "totalStockholdersEquity", "growthTotalStockholdersEquity",
  "sharesQoQ", "sharesYoY",
  "returnOnAssets", "returnOnEquity", "returnOnTangibleAssets",
  "returnOnInvestedCapital", "returnOnCapitalEmployed",
  "sharesShort", "shortRatio", "shortFloatPercent", "shortOutstandingPercent",
  "failToDeliver", "relativeFTD",
  "sector", "industry", "country", "marketCapGroup",
  "employees", "revenuePerEmployee", "profitPerEmployee",
  "earningsDate", "earningsTime",
  "earningsRevenueEst", "earningsEPSEst",
  "earningsRevenueGrowthEst", "earningsEPSGrowthEst",
  "analystRating", "analystCounter", "priceTarget", "upside",
  "topAnalystRating", "topAnalystCounter", "topAnalystPriceTarget", "topAnalystUpside",
  "cagrNext3YearEPS", "cagrNext5YearEPS", "cagrNext3YearRevenue", "cagrNext5YearRevenue",
  "score", "halalStocks",
  "ivRank", "iv30d", "totalOI", "changeOI",
  "callVolume", "putVolume", "pcRatio", "totalPrem",
  "callOI", "putOI", "pcOIRatio",
  "callOIChange", "putOIChange", "pcOIRatioChange",
  "altmanZScore", "piotroskiScore",
  "assetTurnover", "fixedAssetTurnover", "inventoryTurnover",
  "interestIncomeToCapitalization", "effectiveTaxRate",
]);

export const GET: RequestHandler = async ({ url, locals }) => {
  const { apiURL, apiKey, user } = locals;

  const params = new URLSearchParams();

  for (const param of allowedParams) {
    if (param === "rules" && !['Plus','Pro'].includes(user?.tier)) continue;
    const value = url.searchParams.get(param);
    if (value && value.trim().length > 0) {
      if (param === "pageSize") {
        const parsedPageSize = Number.parseInt(value, 10);
        const normalizedPageSize = Number.isFinite(parsedPageSize)
          ? Math.max(MIN_PAGE_SIZE, Math.min(parsedPageSize, MAX_PAGE_SIZE))
          : 20;
        params.set(param, String(normalizedPageSize));
        continue;
      }

      if (param === "displayColumns") {
        const safeColumns = value
          ?.split(",")
          ?.map((column) => column.trim())
          ?.filter((column) => allowedDisplayColumns.has(column))
          ?.slice(0, 50);

        if (safeColumns.length > 0) {
          params.set(param, safeColumns.join(","));
        }
        continue;
      }

      params.set(param, value);
    }
  }

  params.set("subscriber", ['Plus','Pro'].includes(user?.tier) ? "Pro" : "Free");

  const endpoint = `${apiURL}/stock-screener-feed${params.size ? `?${params.toString()}` : ""}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
  });

  if (!response.ok) {
    return new Response(
      JSON.stringify({ message: "Failed to load screener data." }),
      { status: response.status },
    );
  }

  return new Response(response.body, {
    headers: { "Content-Type": "application/json" },
  });
};

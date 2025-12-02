<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";

  import SEO from "$lib/components/SEO.svelte";
  import FinancialSection from "$lib/components/FinancialSection.svelte";

  export let data;

  const statementConfig = [
  // Valuation & Market Multiples
  {
    propertyName: "priceToEarningsRatio",
    label: "PE Ratio",
    text: "The price-to-earnings (P/E) ratio is a valuation metric that shows how expensive a stock is relative to earnings.",
  },
  {
    propertyName: "forwardPE",
    label: "Forward PE Ratio",
    text: "The forward price-to-earnings (P/E) ratio uses estimated earnings for the next fiscal year instead of historical earnings, providing insight into expected valuation based on future profitability.",
  },
  {
    propertyName: "priceToEarningsGrowthRatio",
    label: "PEG Ratio",
    text: "The price/earnings to growth (PEG) ratio is calculated by dividing a company's PE ratio by its expected earnings growth next year.",
  },
  {
    propertyName: "priceToSalesRatio",
    label: "PS Ratio",
    text: "The price-to-sales (P/S) ratio is a commonly used valuation metric. It shows how expensive a stock is compared to revenue.",
  },
  {
    propertyName: "priceToBookRatio",
    label: "PB Ratio",
    text: "The price-to-book (P/B) ratio measures a stock's price relative to book value. Book value is also called Shareholders' equity.",
  },
  {
    propertyName: "priceToFreeCashFlowRatio",
    label: "P/FCF Ratio",
    text: "The price to free cash flow (P/FCF) ratio is similar to the P/E ratio, except it uses free cash flow instead of accounting earnings.",
  },
  {
    propertyName: "priceToOperatingCashFlowRatio",
    label: "P/OCF Ratio",
    text: "The price to operating cash flow (P/OCF) ratio measures the price of a stock relative to operating cash flow.",
  },
  {
    propertyName: "priceToFairValue",
    label: "Price to Fair Value",
    text: "The price to fair value ratio compares the current stock price to an estimated fair value based on fundamental analysis.",
  },
  {
    propertyName: "enterpriseValueMultiple",
    label: "EV Multiple",
    text: "The enterprise value multiple (EV/EBITDA) is a valuation metric that compares a company's enterprise value to its EBITDA.",
  },
  {
    propertyName: "freeCashFlowYield",
    label: "FCF Yield",
    text: "Free cash flow yield compares the cash a company generates after capital expenditures to its market capitalization, showing the cash return available to investors.",
  },

  // Profitability & Returns
  {
    propertyName: "returnOnEquity",
    label: "Return on Equity",
    text: `Return on equity (ROE) is a profitability metric that shows how efficient a company is at using its equity (or "net" assets) to generate profits. It is calculated by dividing the company's net income by the average shareholders' equity during the past 12 months.`,
  },
  {
    propertyName: "returnOnAssets",
    label: "Return on Assets",
    text: `Return on assets (ROA) is a metric that measures how much profit a company is able to generate using its assets. It is calculated by dividing net income by the average total assets for the past 12 months.`,
  },
  {
    propertyName: "returnOnInvestedCapital",
    label: "Return on Invested Capital",
    text: `Return on invested capital (ROIC) measures how effective a company is at investing its capital in order to increase profits. It is calculated by dividing the NOPAT (Net Operating Profit After Tax) by the invested capital.`,
  },
  {
    propertyName: "returnOnCapitalEmployed",
    label: "Return on Capital Employed",
    text: `Return on capital employed (ROCE) evaluates how efficiently a company uses its total capital base (shareholder equity plus debt) to generate operating profits, typically measured as EBIT divided by capital employed.`,
  },

  // Margin Profile
  {
    propertyName: "grossProfitMargin",
    label: "Gross Profit Margin",
    text: "Gross Profit Margin is the percentage of revenue left as gross profits, after subtracting cost of goods sold from the revenue.",
  },
  {
    propertyName: "operatingProfitMargin",
    label: "Operating Profit Margin",
    text: "Operating margin is the percentage of revenue left as operating income, after subtracting cost of revenue and all operating expenses from the revenue.",
  },
  {
    propertyName: "ebitMargin",
    label: "EBIT Margin",
    text: "EBIT margin is the percentage of revenue left as earnings before interest and taxes (EBIT), measuring operating profitability.",
  },
  {
    propertyName: "ebitdaMargin",
    label: "EBITDA Margin",
    text: "EBITDA margin is the percentage of revenue left as EBITDA, after subtracting all expenses except interest, taxes, depreciation and amortization from revenue.",
  },
  {
    propertyName: "pretaxProfitMargin",
    label: "Pretax Profit Margin",
    text: "Pretax margin is the percentage of revenue left as profits before subtracting taxes.",
  },
  {
    propertyName: "netProfitMargin",
    label: "Net Profit Margin",
    text: "Net Profit Margin is the percentage of revenue left as net income, or profits, after subtracting all costs and expenses from the revenue.",
  },
  {
    propertyName: "bottomLineProfitMargin",
    label: "Bottom Line Profit Margin",
    text: "The bottom line profit margin represents the final profit margin after all expenses, taxes, and costs have been deducted from revenue.",
  },
  {
    propertyName: "continuousOperationsProfitMargin",
    label: "Continuous Operations Margin",
    text: "The continuous operations profit margin measures profitability from ongoing business operations, excluding discontinued operations.",
  },
  {
    propertyName: "freeCashFlowMargin",
    label: "FCF Margin",
    text: "FCF margin is the percentage of revenue left as free cash flow. FCF is calculated by subtracting capital expenditures (CapEx) from the operating cash flow (OCF). Both CapEx and OCF are shown on the cash flow statement.",
  },

  // Cash Flow Strength & Coverage
  {
    propertyName: "operatingCashFlowRatio",
    label: "OCF Ratio",
    text: "The operating cash flow ratio measures a company's ability to cover current liabilities with cash generated from operations.",
  },
  {
    propertyName: "operatingCashFlowSalesRatio",
    label: "OCF/S Ratio",
    text: "The operating cash flow to sales (OCF/S) Ratio assesses how well sales convert to cash. It's the operating cash flow divided by net sales, indicating cash efficiency.",
  },
  {
    propertyName: "freeCashFlowOperatingCashFlowRatio",
    label: "FCF/OCF Ratio",
    text: "The free cash flow to operating cash flow ratio shows what percentage of operating cash flow remains as free cash flow after capital expenditures.",
  },
  {
    propertyName: "shortTermOperatingCashFlowCoverageRatio",
    label: "ST OCF Coverage",
    text: "The short-term operating cash flow coverage ratio measures the ability of operating cash flow to cover short-term obligations.",
  },
  {
    propertyName: "operatingCashFlowCoverageRatio",
    label: "OCF Coverage Ratio",
    text: "The operating cash flow coverage ratio measures how well operating cash flow can cover total debt obligations.",
  },
  {
    propertyName: "capitalExpenditureCoverageRatio",
    label: "CapEx Coverage Ratio",
    text: "The capital expenditure coverage ratio measures how well operating cash flow covers capital expenditures needed to maintain and grow the business.",
  },
  {
    propertyName: "dividendPaidAndCapexCoverageRatio",
    label: "Dividend & CapEx Coverage",
    text: "This ratio measures the ability of operating cash flow to cover both dividend payments and capital expenditures.",
  },
  {
    propertyName: "interestCoverageRatio",
    label: "Interest Coverage",
    text: "The interest coverage ratio is a measure of the ability of a company to pay its interest expenses. It is calculated by dividing the company's Earnings Before Interest and Taxes (EBIT) by its interest expenses.",
  },
  {
    propertyName: "debtServiceCoverageRatio",
    label: "Debt Service Coverage",
    text: "The debt service coverage ratio measures a company's ability to service its debt with its operating income.",
  },

  // Efficiency & Turnover
  {
    propertyName: "assetTurnover",
    label: "Asset Turnover",
    text: "The asset turnover ratio measures the amount of sales relative to a company's assets. It indicates how efficiently the company uses its assets to generate revenue.",
  },
  {
    propertyName: "fixedAssetTurnover",
    label: "Fixed Asset Turnover",
    text: "The fixed asset turnover ratio is the amount of revenue generated for every dollar spent on fixed assets such as property and equipment.",
  },
  {
    propertyName: "workingCapitalTurnoverRatio",
    label: "Working Capital Turnover",
    text: "The working capital turnover ratio measures how efficiently a company uses its working capital to generate sales.",
  },
  {
    propertyName: "receivablesTurnover",
    label: "Receivables Turnover",
    text: "The receivables turnover ratio measures how efficiently a company collects revenue from its credit customers.",
  },
  {
    propertyName: "payablesTurnover",
    label: "Payables Turnover",
    text: "The payables turnover ratio measures how quickly a company pays its suppliers.",
  },
  {
    propertyName: "inventoryTurnover",
    label: "Inventory Turnover",
    text: "The inventory turnover ratio measures how many times a company sells and replaces its inventory during a period.",
  },

  // Capital Structure & Solvency
  {
    propertyName: "debtToEquityRatio",
    label: "Debt / Equity Ratio",
    text: "The debt-to-equity ratio measures a company's debt levels relative to its shareholders' equity or book value. A high ratio implies that a company has a lot of debt.",
  },
  {
    propertyName: "debtToAssetsRatio",
    label: "Debt to Assets Ratio",
    text: "The debt-to-assets ratio shows what percentage of a company's assets are financed through debt. It indicates the company's financial leverage.",
  },
  {
    propertyName: "debtToCapitalRatio",
    label: "Debt to Capital Ratio",
    text: "The debt-to-capital ratio measures a company's financial leverage by comparing total debt to total capital (debt plus equity).",
  },
  {
    propertyName: "longTermDebtToCapitalRatio",
    label: "LT Debt to Capital Ratio",
    text: "The long-term debt to capital ratio measures the portion of a company's capital that is financed by long-term debt.",
  },
  {
    propertyName: "debtToMarketCap",
    label: "Debt to Market Cap",
    text: "The debt to market capitalization ratio compares a company's total debt to its market value, showing leverage relative to market valuation.",
  },
  {
    propertyName: "financialLeverageRatio",
    label: "Financial Leverage Ratio",
    text: "The financial leverage ratio measures the degree to which a company uses debt to finance its assets.",
  },
  {
    propertyName: "solvencyRatio",
    label: "Solvency Ratio",
    text: "The solvency ratio measures a company's ability to meet its long-term obligations and indicates long-term financial stability.",
  },

  // Liquidity
  {
    propertyName: "currentRatio",
    label: "Current Ratio",
    text: "The current ratio is used to measure a company's short-term liquidity. A low number can indicate that a company will have trouble paying its upcoming liabilities.",
  },
  {
    propertyName: "quickRatio",
    label: "Quick Ratio",
    text: "The quick ratio measure a company's short-term liquidity. A low number indicates that the company may have trouble paying its upcoming financial obligations.",
  },
  {
    propertyName: "cashRatio",
    label: "Cash Ratio",
    text: "The cash ratio is the most conservative liquidity ratio, measuring only cash and cash equivalents against current liabilities.",
  },

  // Per Share Metrics
  {
    propertyName: "revenuePerShare",
    label: "Revenue Per Share",
    text: "Revenue per share is the total revenue divided by the number of outstanding shares, showing how much revenue is generated per share.",
  },
  {
    propertyName: "netIncomePerShare",
    label: "Net Income Per Share",
    text: "Net income per share (EPS) is the portion of a company's profit allocated to each outstanding share of common stock.",
  },
  {
    propertyName: "operatingCashFlowPerShare",
    label: "Operating Cash Flow Per Share",
    text: "Operating cash flow per share is the cash generated from operations divided by the number of outstanding shares.",
  },
  {
    propertyName: "freeCashFlowPerShare",
    label: "Free Cash Flow Per Share",
    text: "Free cash flow per share is the free cash flow (operating cash flow minus capital expenditures) divided by the number of outstanding shares.",
  },
  {
    propertyName: "cashPerShare",
    label: "Cash Per Share",
    text: "Cash per share is the total cash and cash equivalents divided by the number of outstanding shares.",
  },
  {
    propertyName: "bookValuePerShare",
    label: "Book Value Per Share",
    text: "Book value per share is the shareholders' equity divided by the number of outstanding shares, representing the net asset value per share.",
  },
  {
    propertyName: "tangibleBookValuePerShare",
    label: "Tangible Book Value Per Share",
    text: "Tangible book value per share is the book value per share excluding intangible assets like goodwill.",
  },
  {
    propertyName: "shareholdersEquityPerShare",
    label: "Shareholders' Equity Per Share",
    text: "Shareholders' equity per share represents the total equity attributable to shareholders divided by the number of outstanding shares.",
  },
  {
    propertyName: "interestDebtPerShare",
    label: "Interest Debt Per Share",
    text: "Interest-bearing debt per share shows the amount of debt that incurs interest expense divided by the number of outstanding shares.",
  },
  {
    propertyName: "capexPerShare",
    label: "CapEx Per Share",
    text: "Capital expenditures per share shows the amount spent on fixed assets divided by the number of outstanding shares.",
  },

  // Dividends & Payout
  {
    propertyName: "dividendPerShare",
    label: "Dividend Per Share",
    text: "The dividend per share is the total amount of dividends paid out to shareholders divided by the number of outstanding shares.",
  },
  {
    propertyName: "dividendYield",
    label: "Dividend Yield",
    text: "The dividend yield is how much a stock pays in dividends each year, as a percentage of the stock price.",
  },
  {
    propertyName: "dividendYieldPercentage",
    label: "Dividend Yield %",
    text: "The dividend yield expressed as a percentage, showing the annual dividend payment relative to the stock price.",
  },
  {
    propertyName: "dividendPayoutRatio",
    label: "Payout Ratio",
    text: "The dividend payout ratio is the percentage of a company's profits that are paid out as dividends. A high ratio implies that the dividend payments may not be sustainable.",
  },

  // Tax & Other Ratios
  {
    propertyName: "netIncomePerEBT",
    label: "Net Income / EBT",
    text: "The net income to earnings before tax ratio shows what percentage of pre-tax earnings remains after taxes are paid.",
  },
  {
    propertyName: "ebtPerEbit",
    label: "EBT / EBIT",
    text: "The earnings before tax to EBIT ratio shows the impact of interest expenses on operating earnings.",
  },
  {
    propertyName: "effectiveTaxRate",
    label: "Effective Tax Rate",
    text: "The effective tax rate is the average rate at which a company's pre-tax profits are taxed.",
  },
];

</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Financial Ratios & Valuation Metrics Analysis - P/E, ROE, Debt Ratios & Profitability`}
  description={`Comprehensive financial ratio analysis for ${$displayCompanyName} (${$stockTicker}) with key valuation metrics including P/E ratio, PEG ratio, ROE, ROA, debt-to-equity, current ratio, and profitability margins. Track ${$stockTicker} financial health with price-to-book, price-to-sales, dividend yield, and operational efficiency ratios over multiple periods.`}
  keywords={`${$stockTicker} financial ratios, ${$displayCompanyName} valuation metrics, ${$stockTicker} P/E ratio, ROE analysis, debt-to-equity ratio, profitability ratios, valuation analysis, financial metrics, investment ratios, liquidity ratios, efficiency ratios, dividend yield`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "WebPage", "AnalysisNewsArticle"],
    name: `${$displayCompanyName} (${$stockTicker}) Financial Ratios Analysis`,
    headline: `${$displayCompanyName} Valuation & Financial Metrics - Comprehensive Ratio Analysis`,
    description: `Detailed financial ratio analysis for ${$displayCompanyName} (${$stockTicker}) including valuation, profitability, liquidity, and efficiency metrics`,
    url: `https://stocknear.com/stocks/${$stockTicker}/financials/ratios`,

    author: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
      logo: {
        "@type": "ImageObject",
        url: "https://stocknear.com/favicon.png",
      },
    },
    dateModified: new Date().toISOString(),
    datePublished: new Date().toISOString(),
    mainEntity: {
      "@type": "Corporation",
      name: $displayCompanyName,
      tickerSymbol: $stockTicker,
    },
    about: {
      "@type": "Thing",
      name: "Financial Ratio Analysis",
      description:
        "Comprehensive analysis of valuation metrics, profitability ratios, and financial health indicators",
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://stocknear.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Stocks",
          item: "https://stocknear.com/stocks",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `${$displayCompanyName} (${$stockTicker})`,
          item: `https://stocknear.com/stocks/${$stockTicker}`,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: "Financial Statements",
          item: `https://stocknear.com/stocks/${$stockTicker}/financials`,
        },
        {
          "@type": "ListItem",
          position: 5,
          name: "Financial Ratios",
          item: `https://stocknear.com/stocks/${$stockTicker}/financials/ratios`,
        },
      ],
    },
  }}
/>

<FinancialSection
  {data}
  title="Ratios and Metrics"
  statementType="ratios"
  {statementConfig}
  enableFavorites
  favoriteStorageKey="financial_ratios"
/>

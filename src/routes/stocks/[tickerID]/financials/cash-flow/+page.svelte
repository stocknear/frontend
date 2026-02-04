<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import {
  stock_detail_financials_cash_flow_statement,
} from "$lib/paraglide/messages";

  import SEO from "$lib/components/SEO.svelte";
  import FinancialSection from "$lib/components/FinancialSection.svelte";

  export let data;

  const statementConfig = [
    // Key Summary Metrics (most important at top)
    {
      propertyName: "freeCashFlow",
      label: "Free Cash Flow",
    },
    {
      propertyName: "operatingCashFlow",
      label: "Operating Cash Flow",
    },
    {
      propertyName: "capitalExpenditure",
      label: "Capital Expenditures",
    },
    {
      propertyName: "netChangeInCash",
      label: "Net Change in Cash",
    },
    // Operating Activities
    {
      propertyName: "netIncome",
      label: "Net Income",
    },
    {
      propertyName: "depreciationAndAmortization",
      label: "Depreciation & Amortization",
    },
    {
      propertyName: "stockBasedCompensation",
      label: "Stock-Based Compensation",
    },
    {
      propertyName: "deferredIncomeTax",
      label: "Deferred Income Tax",
    },
    {
      propertyName: "changeInWorkingCapital",
      label: "Change in Working Capital",
    },
    {
      propertyName: "accountsReceivables",
      label: "Accounts Receivables",
    },
    {
      propertyName: "inventory",
      label: "Inventory",
    },
    {
      propertyName: "accountsPayables",
      label: "Accounts Payables",
    },
    {
      propertyName: "otherWorkingCapital",
      label: "Other Working Capital",
    },
    {
      propertyName: "otherNonCashItems",
      label: "Other Non-Cash Items",
    },
    {
      propertyName: "netCashProvidedByOperatingActivities",
      label: "Net Cash from Operating Activities",
    },
    // Investing Activities
    {
      propertyName: "investmentsInPropertyPlantAndEquipment",
      label: "PP&E Investments",
    },
    {
      propertyName: "acquisitionsNet",
      label: "Cash Acquisitions",
    },
    {
      propertyName: "purchasesOfInvestments",
      label: "Purchase of Investments",
    },
    {
      propertyName: "salesMaturitiesOfInvestments",
      label: "Sales Maturities of Investments",
    },
    {
      propertyName: "otherInvestingActivities",
      label: "Other Investing Activities",
    },
    {
      propertyName: "netCashProvidedByInvestingActivities",
      label: "Net Cash from Investing Activities",
    },
    // Financing Activities
    {
      propertyName: "netDebtIssuance",
      label: "Net Debt Issuance",
    },
    {
      propertyName: "longTermNetDebtIssuance",
      label: "Long-Term Net Debt Issuance",
    },
    {
      propertyName: "shortTermNetDebtIssuance",
      label: "Short-Term Net Debt Issuance",
    },
    {
      propertyName: "netStockIssuance",
      label: "Net Stock Issuance",
    },
    {
      propertyName: "netCommonStockIssuance",
      label: "Net Common Stock Issuance",
    },
    {
      propertyName: "commonStockIssuance",
      label: "Common Stock Issuance",
    },
    {
      propertyName: "commonStockRepurchased",
      label: "Common Stock Repurchased",
    },
    {
      propertyName: "netPreferredStockIssuance",
      label: "Net Preferred Stock Issuance",
    },
    {
      propertyName: "netDividendsPaid",
      label: "Net Dividends Paid",
    },
    {
      propertyName: "commonDividendsPaid",
      label: "Common Dividends Paid",
    },
    {
      propertyName: "preferredDividendsPaid",
      label: "Preferred Dividends Paid",
    },
    {
      propertyName: "otherFinancingActivities",
      label: "Other Financing Activities",
    },
    {
      propertyName: "netCashProvidedByFinancingActivities",
      label: "Net Cash from Financing Activities",
    },
    // Cash Position
    {
      propertyName: "effectOfForexChangesOnCash",
      label: "Effect of Forex Changes on Cash",
    },
    {
      propertyName: "cashAtBeginningOfPeriod",
      label: "Cash at Beginning of Period",
    },
    {
      propertyName: "cashAtEndOfPeriod",
      label: "Cash at End of Period",
    },
    // Supplemental
    {
      propertyName: "incomeTaxesPaid",
      label: "Income Taxes Paid",
    },
    {
      propertyName: "interestPaid",
      label: "Interest Paid",
    },
  ];
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Cash Flow Statement Analysis - Operating Cash Flow, CapEx & Free Cash Flow`}
  description={`Comprehensive cash flow statement analysis for ${$displayCompanyName} (${$stockTicker}) with detailed breakdown of operating cash flow, capital expenditures, free cash flow, and cash generation patterns. Track ${$stockTicker} cash management with investing activities, financing activities, and working capital changes over multiple periods.`}
  keywords={`${$stockTicker} cash flow, ${$displayCompanyName} free cash flow, ${$stockTicker} operating cash flow, cash flow statement, capital expenditures, cash flow analysis, free cash flow yield, working capital, cash generation, investing activities, financing activities`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "WebPage", "AnalysisNewsArticle"],
    name: `${$displayCompanyName} (${$stockTicker}) Cash Flow Statement Analysis`,
    headline: `${$displayCompanyName} Cash Generation - Cash Flow Statement & Free Cash Flow Analysis`,
    description: `Detailed cash flow statement analysis for ${$displayCompanyName} (${$stockTicker}) including operating, investing, and financing cash flows`,
    url: `https://stocknear.com/stocks/${$stockTicker}/financials/cash-flow`,

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
      name: "Cash Flow Statement Analysis",
      description:
        "Financial statement analysis focused on cash generation and cash flow patterns",
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
          name: "Cash Flow Statement",
          item: `https://stocknear.com/stocks/${$stockTicker}/financials/cash-flow`,
        },
      ],
    },
  }}
/>

<FinancialSection
  {data}
  title={stock_detail_financials_cash_flow_statement()}
  statementType="cash-flow"
  {statementConfig}
  enableFavorites
  favoriteStorageKey="cash_flow"
/>

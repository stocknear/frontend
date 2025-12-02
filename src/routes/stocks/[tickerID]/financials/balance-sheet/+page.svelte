<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";

  import SEO from "$lib/components/SEO.svelte";
  import FinancialSection from "$lib/components/FinancialSection.svelte";

  export let data;

  const statementConfig = [
    {
      propertyName: "cashAndCashEquivalents",
      label: "Cash & Equivalents",
    },
    {
      propertyName: "shortTermInvestments",
      label: "Short-Term Investments",
    },
    {
      propertyName: "cashAndShortTermInvestments",
      label: "Cash & Short-Term Investments",
    },
    {
      propertyName: "netReceivables",
      label: "Receivables",
    },
    {
      propertyName: "accountsReceivables",
      label: "Accounts Receivables",
    },
    {
      propertyName: "otherReceivables",
      label: "Other Receivables",
    },
    {
      propertyName: "inventory",
      label: "Inventory",
    },
    {
      propertyName: "prepaids",
      label: "Prepaid Expenses",
    },
    {
      propertyName: "otherCurrentAssets",
      label: "Other Current Assets",
    },
    {
      propertyName: "totalCurrentAssets",
      label: "Total Current Assets",
    },
    {
      propertyName: "propertyPlantEquipmentNet",
      label: "Property-Plant & Equipment",
    },
    {
      propertyName: "goodwill",
      label: "Goodwill",
    },
    {
      propertyName: "intangibleAssets",
      label: "Intangible Assets",
    },
    {
      propertyName: "goodwillAndIntangibleAssets",
      label: "Goodwill & Intangibles",
    },
    {
      propertyName: "longTermInvestments",
      label: "Long-Term Investments",
    },
    {
      propertyName: "taxAssets",
      label: "Tax Assets",
    },
    {
      propertyName: "otherNonCurrentAssets",
      label: "Other Long-Term Assets",
    },
    {
      propertyName: "totalNonCurrentAssets",
      label: "Total Long-Term Assets",
    },
    {
      propertyName: "otherAssets",
      label: "Other Assets",
    },
    {
      propertyName: "totalAssets",
      label: "Total Assets",
    },
    {
      propertyName: "totalPayables",
      label: "Total Payables",
    },
    {
      propertyName: "accountPayables",
      label: "Account Payables",
    },
    {
      propertyName: "otherPayables",
      label: "Other Payables",
    },
    {
      propertyName: "accruedExpenses",
      label: "Accrued Expenses",
    },
    {
      propertyName: "shortTermDebt",
      label: "Short-Term Debt",
    },
    {
      propertyName: "capitalLeaseObligationsCurrent",
      label: "Current Capital Lease Obligations",
    },
    {
      propertyName: "taxPayables",
      label: "Tax Payables",
    },
    {
      propertyName: "deferredRevenue",
      label: "Deferred Revenue",
    },
    {
      propertyName: "otherCurrentLiabilities",
      label: "Other Current Liabilities",
    },
    {
      propertyName: "totalCurrentLiabilities",
      label: "Total Current Liabilities",
    },
    {
      propertyName: "longTermDebt",
      label: "Long-Term Debt",
    },
    {
      propertyName: "capitalLeaseObligationsNonCurrent",
      label: "Non-Current Capital Lease Obligations",
    },
    {
      propertyName: "deferredRevenueNonCurrent",
      label: "Non-Current Deferred Revenue",
    },
    {
      propertyName: "deferredTaxLiabilitiesNonCurrent",
      label: "Non-Current Deferred Tax Liabilities",
    },
    {
      propertyName: "otherNonCurrentLiabilities",
      label: "Other Long-Term Liabilities",
    },
    {
      propertyName: "totalNonCurrentLiabilities",
      label: "Total Long-Term Liabilities",
    },
    {
      propertyName: "otherLiabilities",
      label: "Other Liabilities",
    },
    {
      propertyName: "capitalLeaseObligations",
      label: "Capital Lease Obligations",
    },
    {
      propertyName: "totalLiabilities",
      label: "Total Liabilities",
    },
    {
      propertyName: "treasuryStock",
      label: "Treasury Stock",
    },
    {
      propertyName: "preferredStock",
      label: "Preferred Stock",
    },
    {
      propertyName: "commonStock",
      label: "Common Stock",
    },
    {
      propertyName: "retainedEarnings",
      label: "Retained Earnings",
    },
    {
      propertyName: "additionalPaidInCapital",
      label: "Additional Paid-In Capital",
    },
    {
      propertyName: "accumulatedOtherComprehensiveIncomeLoss",
      label: "Comprehensive Income",
    },
    {
      propertyName: "otherTotalStockholdersEquity",
      label: "Other Stockholders Equity",
    },
    {
      propertyName: "totalStockholdersEquity",
      label: "Shareholders Equity",
    },
    {
      propertyName: "totalEquity",
      label: "Total Equity",
    },
    {
      propertyName: "minorityInterest",
      label: "Minority Interest",
    },
    {
      propertyName: "totalLiabilitiesAndTotalEquity",
      label: "Total Liabilities & Equity",
    },
    {
      propertyName: "totalInvestments",
      label: "Total Investments",
    },
    {
      propertyName: "totalDebt",
      label: "Total Debt",
    },
    {
      propertyName: "netDebt",
      label: "Net Debt",
    },
    {
      propertyName: "bookValue",
      label: "Book Value",
    },
    {
      propertyName: "bookValuePerShare",
      label: "Book Value Per Share",
    },
  ];
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Balance Sheet Analysis - Assets, Liabilities & Financial Position`}
  description={`Comprehensive balance sheet analysis for ${$displayCompanyName} (${$stockTicker}) with detailed breakdown of assets, liabilities, shareholders equity, debt levels, and financial position. Track ${$stockTicker} financial health with cash positions, working capital, debt-to-equity ratios, and asset quality metrics over multiple periods.`}
  keywords={`${$stockTicker} balance sheet, ${$displayCompanyName} assets, ${$stockTicker} liabilities, balance sheet analysis, shareholders equity, debt analysis, working capital, financial position, asset quality, cash position, debt-to-equity ratio, book value`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "WebPage", "AnalysisNewsArticle"],
    name: `${$displayCompanyName} (${$stockTicker}) Balance Sheet Analysis`,
    headline: `${$displayCompanyName} Financial Position - Balance Sheet & Asset Analysis`,
    description: `Detailed balance sheet analysis for ${$displayCompanyName} (${$stockTicker}) including assets, liabilities, equity, and financial position metrics`,
    url: `https://stocknear.com/stocks/${$stockTicker}/financials/balance-sheet`,

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
      name: "Balance Sheet Analysis",
      description:
        "Financial statement analysis focused on assets, liabilities, and financial position",
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
          name: "Balance Sheet",
          item: `https://stocknear.com/stocks/${$stockTicker}/financials/balance-sheet`,
        },
      ],
    },
  }}
/>

<FinancialSection
  {data}
  title="Balance Sheet Statement"
  statementType="balance-sheet"
  {statementConfig}
  enableFavorites
  favoriteStorageKey="balance_sheet"
/>

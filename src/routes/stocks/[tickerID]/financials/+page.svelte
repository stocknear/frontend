<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import {
  stock_detail_financials_income_statement,
} from "$lib/paraglide/messages";

  import SEO from "$lib/components/SEO.svelte";
  import FinancialSection from "$lib/components/FinancialSection.svelte";

  export let data;

  const statementConfig = [
    // Key Summary Metrics (most important at top)
    {
      propertyName: "revenue",
      label: "Revenue",
    },
    {
      propertyName: "netIncome",
      label: "Net Income",
    },
    {
      propertyName: "eps",
      growthPropertyName: "growthEPS",
      label: "EPS (Basic)",
    },
    {
      propertyName: "epsDiluted",
      label: "EPS (Diluted)",
    },
    {
      propertyName: "ebitda",
      label: "EBITDA",
    },
    // Profitability Waterfall
    {
      propertyName: "grossProfit",
      label: "Gross Profit",
    },
    {
      propertyName: "operatingIncome",
      label: "Operating Income",
    },
    {
      propertyName: "ebit",
      label: "EBIT",
    },
    {
      propertyName: "incomeBeforeTax",
      label: "Pretax Income",
    },
    // Costs & Expenses
    {
      propertyName: "costOfRevenue",
      label: "Cost of Revenue",
    },
    {
      propertyName: "operatingExpenses",
      label: "Operating Expenses",
    },
    {
      propertyName: "researchAndDevelopmentExpenses",
      label: "Research & Development",
    },
    {
      propertyName: "sellingGeneralAndAdministrativeExpenses",
      label: "Selling & General & Admin",
    },
    {
      propertyName: "sellingAndMarketingExpenses",
      label: "Selling & Marketing Expenses",
    },
    {
      propertyName: "costAndExpenses",
      label: "Cost & Expenses",
    },
    {
      propertyName: "otherExpenses",
      label: "Other Expenses",
    },
    // Interest & Taxes
    {
      propertyName: "interestIncome",
      label: "Interest Income",
    },
    {
      propertyName: "interestExpense",
      label: "Interest Expense",
    },
    {
      propertyName: "incomeTaxExpense",
      label: "Income Tax Expense",
    },
    // Other Metrics
    {
      propertyName: "depreciationAndAmortization",
      label: "Depreciation & Amortization",
    },
    {
      propertyName: "weightedAverageShsOut",
      label: "Shares Outstanding (Basic)",
    },
    {
      propertyName: "weightedAverageShsOutDil",
      label: "Shares Outstanding (Diluted)",
    },
  ];
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Income Statement Analysis - Revenue, Earnings & Profitability Metrics`}
  description={`Comprehensive income statement analysis for ${$displayCompanyName} (${$stockTicker}) with detailed revenue trends, operating margins, net income, EPS growth, and profitability metrics. Track ${$stockTicker} financial performance with quarterly and annual income statement data, earnings quality analysis, and revenue recognition patterns.`}
  keywords={`${$stockTicker} income statement, ${$displayCompanyName} revenue, ${$stockTicker} earnings, income statement analysis, profitability metrics, EPS growth, operating margin, net income, revenue analysis, financial performance, earnings quality, EBITDA analysis`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "WebPage", "AnalysisNewsArticle"],
    name: `${$displayCompanyName} (${$stockTicker}) Income Statement Analysis`,
    headline: `${$displayCompanyName} Financial Performance - Income Statement & Profitability Analysis`,
    description: `Detailed income statement analysis for ${$displayCompanyName} (${$stockTicker}) including revenue trends, earnings growth, and profitability metrics`,
    url: `https://stocknear.com/stocks/${$stockTicker}/financials`,

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
      name: "Income Statement Analysis",
      description:
        "Financial statement analysis focused on revenue, expenses, and profitability metrics",
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
      ],
    },
  }}
/>

<FinancialSection
  {data}
  title={stock_detail_financials_income_statement()}
  statementType="income-statement"
  {statementConfig}
  enableFavorites
  favoriteStorageKey="income_statement"
/>

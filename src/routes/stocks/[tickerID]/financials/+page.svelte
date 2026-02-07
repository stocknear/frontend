<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import SEO from "$lib/components/SEO.svelte";
  import FinancialOverviewSection from "$lib/components/FinancialOverviewSection.svelte";

  export let data;

  const chartConfig = [
    {
      key: 'stockPrice',
      label: 'Stock Price',
      chartType: 'line' as const,
      metrics: [{ key: 'stockPrice', label: 'Price', color: '#10B981' }],
    },
    {
      key: 'revenue',
      label: 'Revenue',
      chartType: 'bar' as const,
      metrics: [{ key: 'revenue', label: 'Revenue' }],
    },
{
      key: 'netIncome',
      label: 'Net Income',
      chartType: 'bar' as const,
      metrics: [{ key: 'netIncome', label: 'Net Income' }],
    },
    {
      key: 'freeCashFlow',
      label: 'Free Cash Flow',
      chartType: 'bar' as const,
      metrics: [{ key: 'freeCashFlow', label: 'FCF' }],
    },
    {
      key: 'eps',
      label: 'EPS',
      chartType: 'bar' as const,
      metrics: [{ key: 'eps', label: 'EPS' }],
    },
    {
      key: 'cashAndDebt',
      label: 'Cash & Debt',
      chartType: 'grouped-stacked' as const,
      metrics: [
        { key: 'cashAndCashEquivalents', label: 'Cash', color: '#10B981', stack: 'cash' },
        { key: 'longTermDebt', label: 'Long-Term Debt', color: '#B91C1C', stack: 'debt' },
        { key: 'capitalLeaseObligations', label: 'Lease Obligations', color: '#F87171', stack: 'debt' },
      ],
    },
    {
      key: 'commonDividendsPaid',
      label: 'Dividends Paid',
      chartType: 'bar' as const,
      negate: true,
      metrics: [{ key: 'commonDividendsPaid', label: 'Dividends' }],
    },
    {
      key: 'returnOfCapital',
      label: 'Return of Capital',
      chartType: 'stacked' as const,
      negate: true,
      metrics: [
        { key: 'commonStockRepurchased', label: 'Buybacks' },
        { key: 'commonDividendsPaid', label: 'Dividends', color: '#8B5CF6' },
      ],
    },
    {
      key: 'weightedAverageShsOut',
      label: 'Shares Outstanding',
      chartType: 'bar' as const,
      metrics: [{ key: 'weightedAverageShsOut', label: 'Shares' }],
    },
    {
      key: 'margins',
      label: 'Margins',
      chartType: 'grouped' as const,
      isMargin: true,
      metrics: [
        { key: 'returnOnCapitalEmployed', label: 'ROCE' },
        { key: 'grossProfitMargin', label: 'Gross' },
        { key: 'operatingProfitMargin', label: 'Operating' },
        { key: 'netProfitMargin', label: 'Net' },
      ],
    },
    {
      key: 'priceToEarningsRatio',
      label: 'P/E Ratio',
      chartType: 'line' as const,
      metrics: [{ key: 'priceToEarningsRatio', label: 'P/E', color: '#10B981' }],
    },
    {
      key: 'expenses',
      label: 'Expenses',
      chartType: 'stacked' as const,
      metrics: [
        { key: 'capitalExpenditure', label: 'CapEx', negate: true },
        { key: 'sellingAndMarketingExpenses', label: 'S&M' },
        { key: 'sellingGeneralAndAdministrativeExpenses', label: 'SG&A' },
        { key: 'researchAndDevelopmentExpenses', label: 'R&D' },
      ],
    },
  ];
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Financial Overview - Key Metrics & Charts`}
  description={`Financial overview for ${$displayCompanyName} (${$stockTicker}) with key metrics including revenue, earnings, cash flow, margins, and valuation ratios. Visual summary of ${$stockTicker} financial performance.`}
  keywords={`${$stockTicker} financials, ${$displayCompanyName} financial overview, ${$stockTicker} revenue, earnings, cash flow, margins, financial charts`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "WebPage"],
    name: `${$displayCompanyName} (${$stockTicker}) Financial Overview`,
    description: `Financial overview charts for ${$displayCompanyName} (${$stockTicker})`,
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
          name: "Financial Overview",
          item: `https://stocknear.com/stocks/${$stockTicker}/financials`,
        },
      ],
    },
  }}
/>

<FinancialOverviewSection
  {data}
  {chartConfig}
/>

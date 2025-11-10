<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import SEO from "$lib/components/SEO.svelte";
  import Dividends from "$lib/components/Dividends.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Dividend Analysis - Historical Payments, Yield Calculator & Ex-Dividend Dates`}
  description={`Complete dividend analysis for ${$displayCompanyName} (${$stockTicker}) including historical dividend payments, current yield, payout ratio, ex-dividend dates, and dividend growth trends. Track ${$stockTicker} dividend sustainability, quarterly distributions, and income investing metrics. Essential data for dividend investors and income portfolio strategies.`}
  keywords={`${$stockTicker} dividends, ${$displayCompanyName} dividend yield, ${$stockTicker} dividend history, dividend payments, ex-dividend dates, dividend growth, payout ratio, dividend sustainability, income investing, quarterly dividends, dividend calendar, yield analysis, dividend aristocrat`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "WebPage", "AnalysisNewsArticle"],
    name: `${$displayCompanyName} (${$stockTicker}) Dividend Analysis`,
    headline: `${$displayCompanyName} Dividend History, Yield & Payment Analysis`,
    description: `Comprehensive dividend analysis for ${$displayCompanyName} (${$stockTicker}) including historical payments, current yield, and future dividend projections`,
    url: `https://stocknear.com/stocks/${$stockTicker}/dividends`,

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
      name: "Dividend Analysis",
      description:
        "Analysis of dividend payments, yield, and distribution history for income investing",
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
          name: "Dividend Analysis",
          item: `https://stocknear.com/stocks/${$stockTicker}/dividends`,
        },
      ],
    },
    potentialAction: {
      "@type": "AnalyzeAction",
      target: `https://stocknear.com/stocks/${$stockTicker}/dividends`,
      name: "Analyze Dividend Data",
    },
  }}
/>

<Dividends {data} ticker={$stockTicker} />

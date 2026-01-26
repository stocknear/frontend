<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import SEO from "$lib/components/SEO.svelte";
  import Dividends from "$lib/components/Dividends.svelte";
  import {
  stock_detail_dividends_seo_description,
  stock_detail_dividends_seo_keywords,
  stock_detail_dividends_seo_title,
  stock_detail_dividends_structured_desc,
  stock_detail_dividends_structured_headline,
  stock_detail_dividends_structured_name,
} from "$lib/paraglide/messages";

  export let data;
</script>

<SEO
  title={stock_detail_dividends_seo_title({ company: $displayCompanyName, ticker: $stockTicker })}
  description={stock_detail_dividends_seo_description({ company: $displayCompanyName, ticker: $stockTicker })}
  keywords={stock_detail_dividends_seo_keywords({ ticker: $stockTicker, company: $displayCompanyName })}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "WebPage", "AnalysisNewsArticle"],
    name: stock_detail_dividends_structured_name({ company: $displayCompanyName, ticker: $stockTicker }),
    headline: stock_detail_dividends_structured_headline({ company: $displayCompanyName }),
    description: stock_detail_dividends_structured_desc({ company: $displayCompanyName, ticker: $stockTicker }),
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

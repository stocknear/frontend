<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";
  import History from "$lib/components/History.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import {
  stock_detail_history_seo_description,
  stock_detail_history_seo_keywords,
  stock_detail_history_seo_title,
  stock_detail_history_structured_desc,
  stock_detail_history_structured_name,
} from "$lib/paraglide/messages";

  export let data;
</script>

<SEO
  title={stock_detail_history_seo_title({ company: $displayCompanyName, ticker: $stockTicker })}
  description={stock_detail_history_seo_description({ company: $displayCompanyName, ticker: $stockTicker })}
  keywords={stock_detail_history_seo_keywords({ ticker: $stockTicker, company: $displayCompanyName })}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/history`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "Dataset"],
    name: stock_detail_history_structured_name({ company: $displayCompanyName }),
    description: stock_detail_history_structured_desc({ company: $displayCompanyName, ticker: $stockTicker }),
    url: `https://stocknear.com/stocks/${$stockTicker}/history`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Historical price data",
      "OHLCV data tracking",
      "Volume analysis",
      "Price trend analysis",
      "Historical charts",
      "Trading statistics",
      "Market data archive",
      "Price movement history",
    ],
    provider: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
    mainEntity: {
      "@type": "Corporation",
      name: $displayCompanyName,
      tickerSymbol: $stockTicker,
    },
    about: {
      "@type": "Thing",
      name: "Historical Stock Data",
      description:
        "Comprehensive historical stock price and trading data analysis",
    },
  }}
/>

<History {data} ticker={$stockTicker} />

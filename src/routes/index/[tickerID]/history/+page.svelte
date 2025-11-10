<script lang="ts">
  import { indexTicker, displayCompanyName } from "$lib/store";
  import History from "$lib/components/History.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$indexTicker}) Index Historical Data - Complete Price History & Performance Analysis`}
  description={`Complete historical price data for ${$displayCompanyName} (${$indexTicker}) market index from inception to present. Analyze daily index values, trading patterns, and long-term market trends. Essential data for index performance research, market cycle analysis, and benchmark comparisons.`}
  keywords={`${$indexTicker} historical data, ${$displayCompanyName} price history, index historical prices, market index performance, index price chart, historical index data, benchmark analysis, market trends`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${$displayCompanyName} (${$indexTicker}) Historical Index Data`,
    description:
      "Complete historical price data for market index analysis and research",
    url: `https://stocknear.com/index/${$indexTicker}/history`,
    about: {
      "@type": "FinancialProduct",
      name: `${$displayCompanyName}`,
      tickerSymbol: $indexTicker,
      category: "Market Index",
    },
    provider: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
  }}
/>

<History {data} ticker={$indexTicker} />

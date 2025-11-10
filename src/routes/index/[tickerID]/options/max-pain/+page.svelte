<script lang="ts">
  import { indexTicker, displayCompanyName } from "$lib/store";

  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  import MaxPain from "$lib/components/Options/MaxPain.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$indexTicker?.toUpperCase()}) Index Options Max Pain Analysis - Market Sentiment & Strike Pressure`}
  description={`Comprehensive max pain analysis for ${$displayCompanyName} (${$indexTicker?.toUpperCase()}) index options. Identify optimal expiration levels, market maker positioning, and systematic hedging pressure affecting index movements. Essential for understanding broad market sentiment and institutional options flow.`}
  keywords={`${$indexTicker?.toUpperCase()} max pain, ${$displayCompanyName} index options, market sentiment analysis, options strike pressure, index options max pain, systematic hedging analysis`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "AnalysisNewsArticle",
    headline: `${$displayCompanyName} (${$indexTicker?.toUpperCase()}) Index Options Max Pain Analysis`,
    description:
      "Max pain analysis for index options and market sentiment tracking",
    about: {
      "@type": "FinancialProduct",
      name: `${$displayCompanyName}`,
      tickerSymbol: $indexTicker?.toUpperCase(),
      category: "Market Index",
    },
    provider: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
    url: `https://stocknear.com/index/${$indexTicker}/options/max-pain`,
  }}
/>

<section class="w-full overflow-hidden min-h-screen">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if data?.getData?.length > 0}
        <MaxPain {data} ticker={$indexTicker?.toUpperCase()} />
      {:else}
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto">
          <div class="">
            <Infobox text="No Max Pain data available for the company." />
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>

<script lang="ts">
  import Infobox from "$lib/components/Infobox.svelte";
  import GreekExposure from "$lib/components/Options/GreekExposure.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import { etfTicker, displayCompanyName } from "$lib/store";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$etfTicker}) ETF Daily Delta Exposure Analysis - Options Greeks`}
  description={`Track daily delta exposure for ${$displayCompanyName} (${$etfTicker}) ETF options. Analyze delta-hedging flows, market maker positioning, and systematic options activity affecting ETF price movements. Essential for understanding ETF options market structure and institutional flows.`}
  keywords={`${$etfTicker} delta exposure, ${$displayCompanyName} ETF delta, ETF options greeks, delta hedging, ETF market makers, options flow analysis, ETF systematic trading`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "AnalysisNewsArticle",
    headline: `${$displayCompanyName} (${$etfTicker}) ETF Delta Exposure Analysis`,
    description: "Daily delta exposure analysis for ETF options trading",
    about: {
      "@type": "FinancialProduct",
      name: `${$displayCompanyName}`,
      tickerSymbol: $etfTicker,
      category: "Exchange-Traded Fund",
    },
    provider: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
    url: `https://stocknear.com/etf/${$etfTicker}/options/dex`,
  }}
/>

<section class="w-full overflow-hidden min-h-screen pb-40">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if data?.getData?.length > 0}
        <GreekExposure {data} title="Delta" ticker={$etfTicker} />
      {:else}
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto">
          <div class="">
            <Infobox text="No data is available" />
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>

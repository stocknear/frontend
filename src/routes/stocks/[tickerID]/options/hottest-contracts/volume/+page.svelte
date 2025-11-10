<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";

  import SEO from "$lib/components/SEO.svelte";
  import HottestContracts from "$lib/components/Options/HottestContracts.svelte";
  import Infobox from "$lib/components/Infobox.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Highest Volume Options | Top Trading Activity & Flow Analysis`}
  description={`Track the highest volume options contracts for ${$displayCompanyName} (${$stockTicker}). Real-time analysis of most actively traded options with volume trends, trading patterns, and institutional flow insights for professional options traders.`}
  keywords={`${$stockTicker} highest volume options, ${$displayCompanyName} top volume contracts, most traded options, options volume leaders, ${$stockTicker} options activity, high volume options trading, options flow analysis, institutional options activity`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/hottest-contracts/volume`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataFeed"],
    name: `${$displayCompanyName} Highest Volume Options`,
    description: `Real-time tracking of highest volume options contracts for ${$displayCompanyName} (${$stockTicker})`,
    url: `https://stocknear.com/stocks/${$stockTicker}/options/hottest-contracts/volume`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Highest volume options tracking",
      "Real-time volume analysis",
      "Trading activity insights",
      "Volume trend identification",
      "Institutional flow detection",
      "Options activity ranking",
      "Volume-based momentum analysis",
      "Professional trading tools",
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
  }}
/>

<section class="w-full overflow-hidden min-h-screen pb-40">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if data?.getData?.volume?.length > 0}
        <HottestContracts
          {data}
          ticker={$stockTicker?.toUpperCase()}
          assetType="stocks"
          type="volume"
          title="Highest Volume Options"
        />
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

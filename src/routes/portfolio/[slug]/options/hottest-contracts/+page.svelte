<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";

  import SEO from "$lib/components/SEO.svelte";
  import HottestContracts from "$lib/components/Options/HottestContracts.svelte";
  import Infobox from "$lib/components/Infobox.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Hottest Options Contracts | Top Volume & Open Interest`}
  description={`Discover the hottest options contracts for ${$displayCompanyName} (${$stockTicker}) by volume and open interest. Real-time analysis of most active options with detailed volume trends, open interest data, and trading activity insights for professional traders.`}
  keywords={`${$stockTicker} hottest options contracts, ${$displayCompanyName} high volume options, top options by open interest, most active ${$stockTicker} options, options volume leaders, highest OI options, ${$stockTicker} options activity, trending options contracts`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/hottest-contracts`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataFeed"],
    name: `${$displayCompanyName} Hottest Options Contracts`,
    description: `Real-time tracking of the most active options contracts for ${$displayCompanyName} (${$stockTicker}) by volume and open interest`,
    url: `https://stocknear.com/stocks/${$stockTicker}/options/hottest-contracts`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Highest volume options tracking",
      "Top open interest contracts",
      "Real-time options activity",
      "Volume trend analysis",
      "Open interest changes",
      "Contract popularity ranking",
      "Options flow analysis",
      "Trading activity insights",
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
      name: "Options Contract Analysis",
      description:
        "Professional tracking of most active options contracts by volume and open interest",
    },
  }}
/>

<section class="w-full overflow-hidden min-h-screen pb-40">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if data?.getData?.openInterest?.length > 0}
        <HottestContracts
          {data}
          ticker={$stockTicker?.toUpperCase()}
          assetType="stocks"
          type="oi"
          title="Highest Open Interest Options"
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

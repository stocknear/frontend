<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";

  import SEO from "$lib/components/SEO.svelte";
  import HottestContracts from "$lib/components/Options/HottestContracts.svelte";
  import Infobox from "$lib/components/Infobox.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Most Active Options Contracts`}
  description={`See the most active ${$displayCompanyName} (${$stockTicker}) contracts by volume and premium for short-term flow.`}
  keywords={`${$stockTicker} most active options, top contracts, options volume, options flow`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/hottest-contracts`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataFeed"],
    name: `${$displayCompanyName} Hottest Options Contracts`,
    description: `Most active options contracts for ${$displayCompanyName} (${$stockTicker})`,
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

<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";
  import SEO from "$lib/components/SEO.svelte";

  import Infobox from "$lib/components/Infobox.svelte";

  import GreekByStrike from "$lib/components/Options/GreekByStrike.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) DEX by Strike`}
  description={`Delta exposure by strike for ${$displayCompanyName} (${$stockTicker}) to map hedging levels.`}
  keywords={`${$stockTicker} DEX by strike, delta exposure, dealer hedging`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/dex/strike`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataVisualization"],
    name: `${$displayCompanyName} Delta Exposure by Strike`,
    description: `Delta exposure by strike for ${$displayCompanyName} (${$stockTicker}) options`,
    url: `https://stocknear.com/stocks/${$stockTicker}/options/dex/strike`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Delta exposure by strike tracking",
      "Strike price delta analysis",
      "Greeks by strike price",
      "Dealer positioning by strike",
      "Gamma hedging flow by strike",
      "Strike price concentration analysis",
      "Support/resistance from options",
      "Strike-based risk metrics",
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
      {#if Object?.keys(data?.getData)?.length > 0}
        <GreekByStrike
          {data}
          title="Delta"
          ticker={$stockTicker?.toUpperCase()}
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

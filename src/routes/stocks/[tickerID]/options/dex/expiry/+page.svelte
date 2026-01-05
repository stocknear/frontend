<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";

  import Infobox from "$lib/components/Infobox.svelte";
  import GreekByExpiry from "$lib/components/Options/GreekByExpiry.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
  let rawData = data?.getData || [];
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) DEX by Expiry`}
  description={`Delta exposure by expiry for ${$displayCompanyName} (${$stockTicker}) to understand positioning into expiration.`}
  keywords={`${$stockTicker} DEX by expiry, delta exposure, dealer hedging`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/dex/expiry`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataVisualization"],
    name: `${$displayCompanyName} Delta Exposure by Expiry`,
    description: `Delta exposure by expiry for ${$displayCompanyName} (${$stockTicker}) options`,
    url: `https://stocknear.com/stocks/${$stockTicker}/options/dex/expiry`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Delta exposure by expiry tracking",
      "Expiration date analysis",
      "Greeks by expiry date",
      "Dealer positioning by expiry",
      "Gamma hedging flow analysis",
      "Options calendar analysis",
      "Time decay impact assessment",
      "Expiry-based risk metrics",
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
      {#if rawData?.length > 0}
        <GreekByExpiry
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

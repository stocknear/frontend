<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";

  import Infobox from "$lib/components/Infobox.svelte";
  import GreekByExpiry from "$lib/components/Options/GreekByExpiry.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
  let rawData = data?.getData || [];
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Gamma Exposure by Expiry | GEX Expiration Analysis`}
  description={`Comprehensive gamma exposure (GEX) analysis by expiration date for ${$displayCompanyName} (${$stockTicker}) options. Track dealer gamma positioning and volatility suppression zones across different expiry dates. Advanced options Greeks calendar analysis.`}
  keywords={`${$stockTicker} gamma exposure expiry, ${$displayCompanyName} GEX by expiration, options gamma flow by expiry, dealer gamma positioning expiry, volatility suppression by expiry, ${$stockTicker} options Greeks expiry, gamma exposure calendar, options volatility expiration`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/gex/expiry`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataVisualization"],
    name: `${$displayCompanyName} Gamma Exposure by Expiry`,
    description: `Professional gamma exposure tracking by expiration date for ${$displayCompanyName} (${$stockTicker}) options`,
    url: `https://stocknear.com/stocks/${$stockTicker}/options/gex/expiry`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Gamma exposure by expiry tracking",
      "Expiration gamma analysis",
      "Volatility suppression by expiry",
      "Dealer gamma positioning by expiry",
      "Time decay gamma impact",
      "Options calendar gamma analysis",
      "Expiry-based volatility zones",
      "Gamma roll risk assessment",
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
          title="Gamma"
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

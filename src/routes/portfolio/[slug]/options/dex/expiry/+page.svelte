<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";

  import Infobox from "$lib/components/Infobox.svelte";
  import GreekByExpiry from "$lib/components/Options/GreekByExpiry.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
  let rawData = data?.getData || [];
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Delta Exposure by Expiry | DEX Options Analysis & Greeks`}
  description={`Comprehensive delta exposure (DEX) analysis by expiration date for ${$displayCompanyName} (${$stockTicker}) options. Track dealer positioning and gamma hedging flows across different expiry dates. Professional options Greeks analysis tools.`}
  keywords={`${$stockTicker} delta exposure expiry, ${$displayCompanyName} DEX by expiration, options delta flow by expiry, dealer positioning analysis, gamma hedging by expiry, ${$stockTicker} options Greeks expiry, delta exposure calendar, options flow expiration analysis`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/dex/expiry`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataVisualization"],
    name: `${$displayCompanyName} Delta Exposure by Expiry`,
    description: `Professional delta exposure tracking by expiration date for ${$displayCompanyName} (${$stockTicker}) options`,
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

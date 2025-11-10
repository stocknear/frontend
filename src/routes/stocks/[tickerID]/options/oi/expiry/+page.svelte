<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";

  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import OpenInterestByExpiry from "$lib/components/Options/OpenInterestByExpiry.svelte";

  export let data;
  let rawData = data?.getData || [];
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Open Interest by Expiry | OI Expiration Analysis`}
  description={`Comprehensive open interest (OI) analysis by expiration date for ${$displayCompanyName} (${$stockTicker}) options. Track OI distribution across expiry dates, institutional positioning, and expiration-based options sentiment with detailed historical trends.`}
  keywords={`${$stockTicker} open interest expiry, ${$displayCompanyName} OI by expiration, options open interest calendar, OI expiration analysis, ${$stockTicker} options positioning expiry, open interest trends by expiry, institutional positioning calendar`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/oi/expiry`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataVisualization"],
    name: `${$displayCompanyName} Open Interest by Expiry`,
    description: `Professional open interest tracking by expiration date for ${$displayCompanyName} (${$stockTicker}) options`,
    url: `https://stocknear.com/stocks/${$stockTicker}/options/oi/expiry`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Open interest by expiry tracking",
      "Expiration OI distribution",
      "Calendar-based positioning",
      "Expiry concentration analysis",
      "Roll risk assessment",
      "Time decay impact on OI",
      "Institutional calendar positioning",
      "Expiration sentiment analysis",
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
        <OpenInterestByExpiry {data} ticker={$stockTicker?.toUpperCase()} />
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

<script lang="ts">
  import { etfTicker, displayCompanyName } from "$lib/store";

  import Infobox from "$lib/components/Infobox.svelte";
  import GreekByExpiry from "$lib/components/Options/GreekByExpiry.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
  let rawData = data?.getData || [];
</script>

<SEO
  title={`${$displayCompanyName} (${$etfTicker}) ETF Delta Exposure by Expiration - Options Greeks Analysis`}
  description={`Analyze delta exposure by expiration dates for ${$displayCompanyName} (${$etfTicker}) ETF options. Track how delta positioning changes across different expiry periods, identifying systematic flow patterns and market maker hedging activity for ETF derivatives.`}
  keywords={`${$etfTicker} delta exposure, ${$displayCompanyName} ETF options expiry, delta by expiration, ETF options greeks, delta hedging analysis, options expiry analysis`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "AnalysisNewsArticle",
    headline: `${$displayCompanyName} (${$etfTicker}) Delta Exposure by Expiration`,
    description:
      "ETF options delta exposure analysis segmented by expiration dates",
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
    url: `https://stocknear.com/etf/${$etfTicker}/options/dex/expiry`,
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
          ticker={$etfTicker?.toUpperCase()}
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

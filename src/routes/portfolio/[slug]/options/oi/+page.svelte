<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";

  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  import OpenInterestByStrike from "$lib/components/Options/OpenInterestByStrike.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Open Interest Analysis | OI by Strike Price & Volume`}
  description={`Comprehensive open interest (OI) analysis by strike price for ${$displayCompanyName} (${$stockTicker}) options. Track open interest trends, strike price concentration, and institutional positioning with detailed OI charts and historical data.`}
  keywords={`${$stockTicker} open interest analysis, ${$displayCompanyName} OI by strike, options open interest tracking, strike price concentration, ${$stockTicker} options positioning, OI volume analysis, open interest trends, institutional options positioning`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/oi`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataVisualization"],
    name: `${$displayCompanyName} Open Interest Analysis`,
    description: `Professional open interest tracking by strike price for ${$displayCompanyName} (${$stockTicker}) options`,
    url: `https://stocknear.com/stocks/${$stockTicker}/options/oi`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Open interest by strike tracking",
      "OI concentration analysis",
      "Strike price positioning",
      "Historical OI trends",
      "Institutional positioning insights",
      "Support/resistance from OI",
      "Options sentiment analysis",
      "Strike price popularity",
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
      name: "Open Interest Analysis",
      description:
        "Professional analysis of options open interest and market positioning",
    },
  }}
/>

<section class="w-full overflow-hidden min-h-screen pb-40">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if Object?.keys(data?.getData)?.length > 0}
        <OpenInterestByStrike {data} ticker={$stockTicker?.toUpperCase()} />
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

<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";

  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  import MaxPain from "$lib/components/Options/MaxPain.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Max Pain & Pin Levels`}
  description={`Find max pain levels and potential pin zones for ${$displayCompanyName} (${$stockTicker}) options into expiration.`}
  keywords={`${$stockTicker} max pain, options pin, pin risk, max pain level`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/max-pain`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataVisualization"],
    name: `${$displayCompanyName} Options Max Pain Analysis`,
    description: `Max pain analysis for ${$displayCompanyName} (${$stockTicker}) options`,
    url: `https://stocknear.com/stocks/${$stockTicker}/options/max-pain`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Max pain calculation",
      "Strike price pressure analysis",
      "Market maker positioning",
      "Options-driven price targets",
      "Expiration pressure tracking",
      "Sentiment analysis",
      "Pain threshold identification",
      "Market structure insights",
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
      name: "Max Pain Analysis",
      description:
        "Advanced options analysis focusing on maximum pain theory and strike price pressure",
    },
  }}
/>

<section class="w-full overflow-hidden min-h-screen">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if data?.getData?.length > 0}
        <MaxPain {data} ticker={$stockTicker?.toUpperCase()} />
      {:else}
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto">
          <div class="">
            <Infobox text="No Max Pain data available for the company." />
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>

<script lang="ts">
  import { indexTicker, displayCompanyName } from "$lib/store";

  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  import MaxPain from "$lib/components/Options/MaxPain.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$indexTicker}) Max Pain & Pin Levels`}
  description={`Find max pain levels and potential pin zones for ${$displayCompanyName} (${$indexTicker}) options into expiration.`}
  keywords={`${$indexTicker} max pain, options pin, pin risk, max pain level`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "AnalysisNewsArticle",
    headline: `${$displayCompanyName} (${$indexTicker?.toUpperCase()}) Index Options Max Pain Analysis`,
    description:
      "Max pain analysis for index options and market sentiment tracking",
    about: {
      "@type": "FinancialProduct",
      name: `${$displayCompanyName}`,
      tickerSymbol: $indexTicker?.toUpperCase(),
      category: "Market Index",
    },
    provider: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
    url: `https://stocknear.com/index/${$indexTicker}/options/max-pain`,
  }}
/>

<section class="w-full overflow-hidden min-h-screen">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if data?.getData?.length > 0}
        <MaxPain {data} ticker={$indexTicker?.toUpperCase()} />
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

<script lang="ts">
  import { indexTicker, displayCompanyName } from "$lib/store";

  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  import Volatility from "$lib/components/Options/Volatility.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$indexTicker}) Implied Volatility & IV Rank`}
  description={`Track IV, IV rank, and volatility trends for ${$displayCompanyName} (${$indexTicker}) options to plan premium or momentum trades.`}
  keywords={`${$indexTicker} implied volatility, IV rank, IV percentile, options volatility, ${$indexTicker} options IV`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "AnalysisNewsArticle",
    headline: `${$displayCompanyName} (${$indexTicker}) Index Volatility Analysis`,
    description: "Index volatility tracking and market risk analysis",
    about: {
      "@type": "FinancialProduct",
      name: `${$displayCompanyName}`,
      tickerSymbol: $indexTicker,
      category: "Market Index",
    },
    provider: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
    url: `https://stocknear.com/index/${$indexTicker}/options/volatility`,
  }}
/>

<section class="w-full overflow-hidden min-h-screen pb-40">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if data?.getData?.length > 0}
        <Volatility {data} ticker={$indexTicker?.toUpperCase()} />
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

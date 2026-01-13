<script lang="ts">
  import { etfTicker, displayCompanyName } from "$lib/store";
  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import GreekByStrike from "$lib/components/Options/GreekByStrike.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$etfTicker}) DEX by Strike`}
  description={`Delta exposure by strike for ${$displayCompanyName} (${$etfTicker}) to map hedging levels.`}
  keywords={`${$etfTicker} DEX by strike, delta exposure, dealer hedging`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "AnalysisNewsArticle",
    headline: `${$displayCompanyName} (${$etfTicker}) Delta Exposure by Strike Price`,
    description: "ETF options delta exposure breakdown by strike price levels",
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
    url: `https://stocknear.com/etf/${$etfTicker}/options/dex/strike`,
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

<script lang="ts">
  import { indexTicker, displayCompanyName } from "$lib/store";

  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  import Volatility from "$lib/components/Options/Volatility.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$indexTicker}) Index Volatility Analysis - Market Fear & Greed Indicator`}
  description={`Comprehensive volatility analysis for ${$displayCompanyName} (${$indexTicker}) index tracking market fear, implied volatility trends, and systematic risk patterns. Monitor VIX-style volatility indicators, term structure analysis, and market stress levels for portfolio risk management and market timing.`}
  keywords={`${$indexTicker} volatility, ${$displayCompanyName} index volatility, market volatility analysis, implied volatility, realized volatility, market fear indicator, volatility trading, systematic risk`}
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

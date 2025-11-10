<script lang="ts">
  import { displayCompanyName, indexTicker } from "$lib/store";
  import OptionsChainStatistics from "$lib/components/Options/OptionsChainStatistics.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$indexTicker}) Index Options Analysis - Market Index Derivatives & Hedging Tools`}
  description={`Professional index options analysis for ${$displayCompanyName} (${$indexTicker}) with real-time options chain data, volatility analysis, and institutional hedging patterns. Track market-wide options flow, systematic hedging activity, and index volatility for portfolio risk management and market timing strategies.`}
  keywords={`${$indexTicker} index options, ${$displayCompanyName} options analysis, index derivatives, market hedging, index volatility, systematic options trading, portfolio hedging, market index options`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: `${$displayCompanyName} (${$indexTicker}) Index Options`,
    description:
      "Index options analysis for market hedging and portfolio management",
    category: "Index Options",
    url: `https://stocknear.com/index/${$indexTicker}/options`,
    about: {
      "@type": "Thing",
      name: `${$displayCompanyName}`,
      description:
        "Market index with derivative instruments for hedging and speculation",
      category: "Market Index",
    },
    provider: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
  }}
/>

<section class="w-full overflow-hidden min-h-screen">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if Object?.keys(data?.getOptionsChainStatistics)?.length > 0}
        <OptionsChainStatistics {data} ticker={$indexTicker?.toUpperCase()} />
      {:else}
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto">
          <div class="">
            <Infobox text="No Options Data available for the company." />
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>

<!--Start Options Detail Desktop Modal-->

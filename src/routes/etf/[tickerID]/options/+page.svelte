<script lang="ts">
  import { displayCompanyName, etfTicker } from "$lib/store";
  import OptionsChainStatistics from "$lib/components/Options/OptionsChainStatistics.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$etfTicker}) ETF Options Analysis - Chain Data, Volume & Implied Volatility`}
  description={`Professional ETF options analysis for ${$displayCompanyName} (${$etfTicker}) with real-time options chain data, volume tracking, open interest analysis, max pain calculations, and implied volatility trends. Monitor ETF options flow, institutional activity, and hedging patterns for systematic trading strategies.`}
  keywords={`${$etfTicker} ETF options, ${$displayCompanyName} options chain, ETF options trading, ETF options volume, ETF implied volatility, ETF max pain, ETF options analysis, ETF hedging, systematic options trading, ETF derivatives`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: `${$displayCompanyName} (${$etfTicker}) ETF Options`,
    description: "ETF options analysis with chain data and trading metrics",
    category: "ETF Options",
    url: `https://stocknear.com/etf/${$etfTicker}/options`,
    about: {
      "@type": "InvestmentFund",
      name: `${$displayCompanyName}`,
      tickerSymbol: $etfTicker,
      category: "Exchange-Traded Fund",
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
        <OptionsChainStatistics {data} ticker={$etfTicker?.toUpperCase()} />
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

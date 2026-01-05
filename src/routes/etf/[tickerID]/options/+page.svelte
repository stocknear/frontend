<script lang="ts">
  import { displayCompanyName, etfTicker } from "$lib/store";
  import OptionsChainStatistics from "$lib/components/Options/OptionsChainStatistics.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$etfTicker}) ETF Options Flow, IV & Open Interest`}
  description={`Live ETF options chain, flow, IV, and open interest for ${$displayCompanyName} (${$etfTicker}) to plan short-term trades.`}
  keywords={`${$etfTicker} options flow, ${$displayCompanyName} options chain, unusual options activity, implied volatility, open interest, options sweeps`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: `${$displayCompanyName} (${$etfTicker}) ETF Options`,
    description: `ETF options flow and chain data for ${$displayCompanyName} (${$etfTicker})`,
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
        <OptionsChainStatistics
          {data}
          ticker={$etfTicker?.toUpperCase()}
          assetType="etf"
        />
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

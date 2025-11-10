<script lang="ts">
  import { indexTicker, displayCompanyName } from "$lib/store";

  import SEO from "$lib/components/SEO.svelte";
  import ContractLookup from "$lib/components/Options/ContractLookup.svelte";
  import Infobox from "$lib/components/Infobox.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$indexTicker}) Index Options Contract Lookup - Detailed Derivatives Analysis`}
  description={`Advanced index options contract analysis for ${$displayCompanyName} (${$indexTicker}). Research individual index options contracts with historical volume, open interest trends, and pricing data. Essential tool for portfolio hedging, market timing, and systematic index trading strategies.`}
  keywords={`${$indexTicker} options contracts, ${$displayCompanyName} index options lookup, index derivatives analysis, portfolio hedging tools, market index options data`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${$displayCompanyName} (${$indexTicker}) Index Options Contract Lookup`,
    description:
      "Index options contract research and analysis tool for portfolio management",
    url: `https://stocknear.com/index/${$indexTicker}/options/contract-lookup`,
    applicationCategory: "Financial Analysis Tool",
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
  }}
/>

<section class="w-full overflow-hidden min-h-screen pb-40">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if Object?.keys(data?.getData)?.length > 0}
        <ContractLookup {data} ticker={$indexTicker} />
      {:else}
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto">
          <Infobox text="No data is available" />
        </div>
      {/if}
    </div>
  </div>
</section>

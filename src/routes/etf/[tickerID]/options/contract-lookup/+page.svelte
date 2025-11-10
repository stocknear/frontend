<script lang="ts">
  import { etfTicker, displayCompanyName } from "$lib/store";

  import SEO from "$lib/components/SEO.svelte";
  import ContractLookup from "$lib/components/Options/ContractLookup.svelte";
  import Infobox from "$lib/components/Infobox.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$etfTicker}) ETF Options Contract Lookup - Detailed Contract Analysis`}
  description={`Advanced ETF options contract analysis for ${$displayCompanyName} (${$etfTicker}). Research individual options contracts with historical volume, open interest trends, and pricing data. Essential tool for ETF options traders and systematic strategies.`}
  keywords={`${$etfTicker} options contracts, ${$displayCompanyName} ETF options lookup, options contract analysis, ETF options data, options research tool, ETF derivatives analysis`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${$displayCompanyName} (${$etfTicker}) Options Contract Lookup`,
    description: "ETF options contract research and analysis tool",
    url: `https://stocknear.com/etf/${$etfTicker}/options/contract-lookup`,
    applicationCategory: "Financial Analysis Tool",
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
  }}
/>

<section class="w-full overflow-hidden min-h-screen pb-40">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if Object?.keys(data?.getData)?.length > 0}
        <ContractLookup {data} ticker={$etfTicker} />
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

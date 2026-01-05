<script lang="ts">
  import { etfTicker, displayCompanyName } from "$lib/store";

  import SEO from "$lib/components/SEO.svelte";
  import ContractLookup from "$lib/components/Options/ContractLookup.svelte";
  import Infobox from "$lib/components/Infobox.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$etfTicker}) Options Contract Lookup`}
  description={`Lookup ${$displayCompanyName} (${$etfTicker}) options contracts and key metrics for fast trade planning.`}
  keywords={`${$etfTicker} options contract lookup, options chain, options metrics`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${$displayCompanyName} (${$etfTicker}) Options Contract Lookup`,
    description: `Options contract lookup for ${$displayCompanyName} (${$etfTicker})`,
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

<script lang="ts">
  import { indexTicker, displayCompanyName } from "$lib/store";

  import SEO from "$lib/components/SEO.svelte";
  import ContractLookup from "$lib/components/Options/ContractLookup.svelte";
  import Infobox from "$lib/components/Infobox.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$indexTicker}) Options Contract Lookup`}
  description={`Lookup ${$displayCompanyName} (${$indexTicker}) options contracts and key metrics for fast trade planning.`}
  keywords={`${$indexTicker} options contract lookup, options chain, options metrics`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${$displayCompanyName} (${$indexTicker}) Index Options Contract Lookup`,
    description: `Options contract lookup for ${$displayCompanyName} (${$indexTicker})`,
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

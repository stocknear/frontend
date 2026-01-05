<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";

  import SEO from "$lib/components/SEO.svelte";
  import ContractLookup from "$lib/components/Options/ContractLookup.svelte";
  import Infobox from "$lib/components/Infobox.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Options Contract Lookup`}
  description={`Lookup ${$displayCompanyName} (${$stockTicker}) options contracts and key metrics for fast trade planning.`}
  keywords={`${$stockTicker} options contract lookup, options chain, options metrics`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/contract-lookup`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "WebApplication"],
    name: `${$displayCompanyName} Options Contract Lookup`,
    description: `Options contract lookup for ${$displayCompanyName} (${$stockTicker})`,
    url: `https://stocknear.com/stocks/${$stockTicker}/options/contract-lookup`,
    applicationCategory: "FinanceApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Real-time options contract data",
      "Historical volume analysis",
      "Open interest tracking",
      "Bid-ask spread analysis",
      "Options Greeks calculator",
      "Advanced contract filtering",
      "Volume trend analysis",
      "Strike price comparison",
    ],
    provider: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
    mainEntity: {
      "@type": "Corporation",
      name: $displayCompanyName,
      tickerSymbol: $stockTicker,
    },
  }}
/>

<section class="w-full overflow-hidden min-h-screen pb-40">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if Object?.keys(data?.getData)?.length > 0}
        <ContractLookup {data} ticker={$stockTicker} />
      {:else}
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto">
          <Infobox text="No data is available" />
        </div>
      {/if}
    </div>
  </div>
</section>

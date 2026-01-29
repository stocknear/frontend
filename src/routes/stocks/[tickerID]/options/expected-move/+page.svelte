<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import ExpectedMove from "$lib/components/Options/ExpectedMove.svelte";

  export let data;
</script>

<SEO
  title="{$displayCompanyName} ({$stockTicker}) Expected Move - Options Analysis | Stocknear"
  description="View the expected price movement for {$displayCompanyName} ({$stockTicker}) options across all expiration dates. See upper and lower price projections based on implied volatility."
  keywords="{$stockTicker} expected move, {$displayCompanyName} options, implied volatility, price projection, options analysis"
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/expected-move`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataVisualization"],
    name: `${$displayCompanyName} Expected Move Analysis`,
    description: `Expected price movement analysis for ${$displayCompanyName} (${$stockTicker}) options based on implied volatility across all expiration dates.`,
    url: `https://stocknear.com/stocks/${$stockTicker}/options/expected-move`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Expected move calculation",
      "Price range projections",
      "Implied volatility analysis",
      "Multiple expiration dates",
      "Historical price overlay",
      "Upper and lower price bounds",
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
    about: {
      "@type": "Thing",
      name: "Expected Move Analysis",
      description: "Options-based price movement projections using implied volatility",
    },
  }}
/>

<section class="w-full overflow-hidden min-h-screen">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if data?.getData?.expirations?.length > 0}
        <ExpectedMove {data} ticker={$stockTicker?.toUpperCase()} />
      {:else}
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto">
          <div class="">
            <Infobox text="No expected move data available for this symbol." />
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>

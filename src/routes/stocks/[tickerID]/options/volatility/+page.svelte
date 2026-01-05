<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";

  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  import Volatility from "$lib/components/Options/Volatility.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Implied Volatility & IV Rank`}
  description={`Track IV, IV rank, and volatility trends for ${$displayCompanyName} (${$stockTicker}) options to plan premium or momentum trades.`}
  keywords={`${$stockTicker} implied volatility, IV rank, IV percentile, options volatility, ${$stockTicker} options IV`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/volatility`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataVisualization"],
    name: `${$displayCompanyName} Volatility Analysis`,
    description: `Implied volatility and IV rank for ${$displayCompanyName} (${$stockTicker}) options`,
    url: `https://stocknear.com/stocks/${$stockTicker}/options/volatility`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Implied volatility tracking",
      "Realized volatility analysis",
      "IV vs RV comparison",
      "Volatility skew analysis",
      "IV crush identification",
      "Historical volatility trends",
      "Volatility percentiles",
      "Professional volatility indicators",
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
      name: "Volatility Analysis",
      description:
        "Advanced analysis of implied and realized volatility for options trading",
    },
  }}
/>

<section class="w-full overflow-hidden min-h-screen">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if data?.getData?.length > 0}
        <Volatility {data} ticker={$stockTicker?.toUpperCase()} />
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

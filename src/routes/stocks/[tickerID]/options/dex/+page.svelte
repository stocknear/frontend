<script lang="ts">
  import Infobox from "$lib/components/Infobox.svelte";
  import GreekExposure from "$lib/components/Options/GreekExposure.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import { stockTicker, displayCompanyName } from "$lib/store";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Delta Exposure (DEX)`}
  description={`Track delta exposure for ${$displayCompanyName} (${$stockTicker}) to gauge dealer hedging pressure and trend risk.`}
  keywords={`${$stockTicker} DEX, delta exposure, dealer hedging, options delta`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/dex`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataVisualization"],
    name: `${$displayCompanyName} Delta Exposure Analysis`,
    description: `Delta exposure for ${$displayCompanyName} (${$stockTicker}) options`,
    url: `https://stocknear.com/stocks/${$stockTicker}/options/dex`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Real-time delta exposure tracking",
      "Dealer positioning analysis",
      "Gamma hedging flow detection",
      "Market maker exposure metrics",
      "Historical DEX trend analysis",
      "Options flow visualization",
      "Delta impact assessment",
      "Market structure analysis",
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
      name: "Delta Exposure Analysis",
      description:
        "Advanced options flow analysis focusing on delta exposure and market maker positioning",
    },
  }}
/>
<section class="w-full overflow-hidden min-h-screen pb-40">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if data?.getData?.length > 0}
        <GreekExposure
          {data}
          title="Delta"
          ticker={$stockTicker?.toUpperCase()}
        />
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

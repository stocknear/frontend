<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";

  import Infobox from "$lib/components/Infobox.svelte";
  import GreekExposure from "$lib/components/Options/GreekExposure.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Gamma Exposure Analysis | GEX Options Flow & Volatility`}
  description={`Advanced gamma exposure (GEX) analysis for ${$displayCompanyName} (${$stockTicker}) options. Track dealer gamma positioning, volatility suppression zones, and market maker hedging activity. Real-time GEX charts with historical gamma flow data.`}
  keywords={`${$stockTicker} gamma exposure, ${$displayCompanyName} GEX analysis, options gamma flow, dealer gamma positioning, volatility suppression, market maker gamma, ${$stockTicker} options volatility, gamma exposure chart, options market structure, dealer gamma hedging`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/gex`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataVisualization"],
    name: `${$displayCompanyName} Gamma Exposure Analysis`,
    description: `Professional gamma exposure (GEX) tracking and analysis tool for ${$displayCompanyName} (${$stockTicker}) options`,
    url: `https://stocknear.com/stocks/${$stockTicker}/options/gex`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Real-time gamma exposure tracking",
      "Dealer gamma positioning",
      "Volatility suppression zones",
      "Market maker gamma hedging",
      "Historical GEX trend analysis",
      "Gamma flow visualization",
      "Volatility impact assessment",
      "Options market structure analysis",
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
      name: "Gamma Exposure Analysis",
      description:
        "Advanced options flow analysis focusing on gamma exposure and volatility dynamics",
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
          title="Gamma"
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

<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";
  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import GreekByStrike from "$lib/components/Options/GreekByStrike.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Gamma Exposure by Strike | GEX Strike Analysis & Volatility`}
  description={`Advanced gamma exposure (GEX) analysis by strike price for ${$displayCompanyName} (${$stockTicker}) options. Track dealer gamma positioning, volatility suppression zones, and market maker hedging across strike prices. Professional gamma flow analysis.`}
  keywords={`${$stockTicker} gamma exposure strike, ${$displayCompanyName} GEX by strike price, options gamma flow by strike, dealer gamma positioning strike, volatility suppression strike, ${$stockTicker} options volatility strike, gamma exposure strike price, options gamma hedging strike`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/gex/strike`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataVisualization"],
    name: `${$displayCompanyName} Gamma Exposure by Strike`,
    description: `Professional gamma exposure tracking by strike price for ${$displayCompanyName} (${$stockTicker}) options`,
    url: `https://stocknear.com/stocks/${$stockTicker}/options/gex/strike`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Gamma exposure by strike tracking",
      "Strike price gamma analysis",
      "Volatility suppression by strike",
      "Dealer gamma positioning by strike",
      "Strike-based gamma hedging",
      "Gamma concentration analysis",
      "Strike price volatility zones",
      "Gamma-based support/resistance",
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
        <GreekByStrike
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

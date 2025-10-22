<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";

  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  import Greeks from "$lib/components/Options/Greeks.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Options Greeks | Delta, Gamma, Theta & Vega Analysis`}
  description={`Detailed Greeks analysis for ${$displayCompanyName} (${$stockTicker}) options. Track delta, gamma, theta, and vega to understand options risk, price sensitivity, and market maker exposure. Real-time Greeks charts with expiration and sentiment insights.`}
  keywords={`${$stockTicker} options greeks, ${$displayCompanyName} delta gamma theta vega, options sensitivity analysis, ${$stockTicker} options chart, options risk metrics, options hedging pressure, ${$stockTicker} options sentiment`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/greeks`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataVisualization"],
    name: `${$displayCompanyName} Options Greeks Analysis`,
    description: `Professional Greeks tracking and analysis for ${$displayCompanyName} (${$stockTicker}) options — including delta, gamma, theta, and vega sensitivity metrics.`,
    url: `https://stocknear.com/stocks/${$stockTicker}/options/greeks`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Delta sensitivity to stock price changes",
      "Gamma exposure and hedging effects",
      "Theta decay and time value impact",
      "Vega risk to volatility changes",
      "Expiration-driven Greeks shifts",
      "Options sentiment and positioning",
      "Market maker hedging pressure",
      "Greeks-based trading insights",
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
      name: "Options Greeks Analysis",
      description:
        "Advanced options analysis focusing on delta, gamma, theta, and vega sensitivity to price, volatility, and time decay.",
    },
  }}
/>

<section class="w-full overflow-hidden min-h-screen">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if data?.getData?.length > 0}
        <Greeks {data} ticker={$stockTicker?.toUpperCase()} />
      {:else}
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto">
          <div class="">
            <Infobox text="No Greeks data available for the company." />
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>

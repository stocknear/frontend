<script lang="ts">
  import { indexTicker, displayCompanyName } from "$lib/store";

  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  import Greeks from "$lib/components/Options/Greeks.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$indexTicker}) Options Greeks - Delta, Gamma, Theta, Vega`}
  description={`Monitor options Greeks for ${$displayCompanyName} (${$indexTicker}) to manage risk on short-term trades.`}
  keywords={`${$indexTicker} options Greeks, delta gamma theta vega, options exposure`}
  type="website"
  url={`https://stocknear.com/stocks/${$indexTicker}/options/greeks`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataVisualization"],
    name: `${$displayCompanyName} Options Greeks Analysis`,
    description: `Options Greeks for ${$displayCompanyName} (${$indexTicker})`,
    url: `https://stocknear.com/stocks/${$indexTicker}/options/greeks`,
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
      tickerSymbol: $indexTicker,
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
        <Greeks {data} ticker={$indexTicker?.toUpperCase()} />
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

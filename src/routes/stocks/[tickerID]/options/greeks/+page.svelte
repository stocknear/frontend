<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";

  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import * as m from "$lib/paraglide/messages";

  import Greeks from "$lib/components/Options/Greeks.svelte";

  export let data;
</script>

<SEO
  title={m.stock_detail_options_greeks_seo_title({ company: $displayCompanyName, ticker: $stockTicker })}
  description={m.stock_detail_options_greeks_seo_description({ company: $displayCompanyName, ticker: $stockTicker })}
  keywords={m.stock_detail_options_greeks_seo_keywords({ ticker: $stockTicker })}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/greeks`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataVisualization"],
    name: m.stock_detail_options_greeks_structured_name({ company: $displayCompanyName }),
    description: m.stock_detail_options_greeks_structured_desc({ company: $displayCompanyName, ticker: $stockTicker }),
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
            <Infobox text={m.stock_detail_options_greeks_no_data()} />
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>

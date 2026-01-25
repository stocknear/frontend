<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";

  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import * as m from "$lib/paraglide/messages";

  import OpenInterestByStrike from "$lib/components/Options/OpenInterestByStrike.svelte";

  export let data;
</script>

<SEO
  title={m.stock_detail_options_oi_strike_seo_title({ company: $displayCompanyName, ticker: $stockTicker })}
  description={m.stock_detail_options_oi_strike_seo_description({ company: $displayCompanyName, ticker: $stockTicker })}
  keywords={m.stock_detail_options_oi_strike_seo_keywords({ ticker: $stockTicker })}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/oi`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataVisualization"],
    name: m.stock_detail_options_oi_strike_structured_name({ company: $displayCompanyName }),
    description: m.stock_detail_options_oi_strike_structured_desc({ company: $displayCompanyName, ticker: $stockTicker }),
    url: `https://stocknear.com/stocks/${$stockTicker}/options/oi`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Open interest by strike tracking",
      "OI concentration analysis",
      "Strike price positioning",
      "Historical OI trends",
      "Institutional positioning insights",
      "Support/resistance from OI",
      "Options sentiment analysis",
      "Strike price popularity",
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
      name: "Open Interest Analysis",
      description:
        "Professional analysis of options open interest and market positioning",
    },
  }}
/>

<section class="w-full overflow-hidden min-h-screen pb-40">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if Object?.keys(data?.getData)?.length > 0}
        <OpenInterestByStrike {data} ticker={$stockTicker?.toUpperCase()} />
      {:else}
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto">
          <div class="">
            <Infobox text={m.stock_detail_options_oi_no_data()} />
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>

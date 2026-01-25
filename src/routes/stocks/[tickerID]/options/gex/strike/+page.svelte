<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";
  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import GreekByStrike from "$lib/components/Options/GreekByStrike.svelte";
  import * as m from "$lib/paraglide/messages";

  export let data;
</script>

<SEO
  title={m.stock_detail_options_gex_strike_seo_title({ company: $displayCompanyName, ticker: $stockTicker })}
  description={m.stock_detail_options_gex_strike_seo_description({ company: $displayCompanyName, ticker: $stockTicker })}
  keywords={m.stock_detail_options_gex_strike_seo_keywords({ ticker: $stockTicker })}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/gex/strike`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataVisualization"],
    name: m.stock_detail_options_gex_strike_structured_name({ company: $displayCompanyName }),
    description: m.stock_detail_options_gex_strike_structured_desc({ company: $displayCompanyName, ticker: $stockTicker }),
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
          title={m.stock_detail_options_gex_title_gamma()}
          ticker={$stockTicker?.toUpperCase()}
        />
      {:else}
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto">
          <div class="">
            <Infobox text={m.stock_detail_options_gex_no_data()} />
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>

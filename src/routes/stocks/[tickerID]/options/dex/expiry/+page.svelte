<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";

  import Infobox from "$lib/components/Infobox.svelte";
  import GreekByExpiry from "$lib/components/Options/GreekByExpiry.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import * as m from "$lib/paraglide/messages";

  export let data;
  let rawData = data?.getData || [];
</script>

<SEO
  title={m.stock_detail_options_dex_expiry_seo_title({ company: $displayCompanyName, ticker: $stockTicker })}
  description={m.stock_detail_options_dex_expiry_seo_description({ company: $displayCompanyName, ticker: $stockTicker })}
  keywords={m.stock_detail_options_dex_expiry_seo_keywords({ ticker: $stockTicker })}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/dex/expiry`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataVisualization"],
    name: m.stock_detail_options_dex_expiry_structured_name({ company: $displayCompanyName }),
    description: m.stock_detail_options_dex_expiry_structured_desc({ company: $displayCompanyName, ticker: $stockTicker }),
    url: `https://stocknear.com/stocks/${$stockTicker}/options/dex/expiry`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Delta exposure by expiry tracking",
      "Expiration date analysis",
      "Greeks by expiry date",
      "Dealer positioning by expiry",
      "Gamma hedging flow analysis",
      "Options calendar analysis",
      "Time decay impact assessment",
      "Expiry-based risk metrics",
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
      {#if rawData?.length > 0}
        <GreekByExpiry
          {data}
          title={m.stock_detail_options_dex_title_delta()}
          ticker={$stockTicker?.toUpperCase()}
        />
      {:else}
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto">
          <div class="">
            <Infobox text={m.stock_detail_options_dex_no_data()} />
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>

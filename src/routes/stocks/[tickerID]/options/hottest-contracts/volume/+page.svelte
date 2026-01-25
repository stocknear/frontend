<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";

  import SEO from "$lib/components/SEO.svelte";
  import HottestContracts from "$lib/components/Options/HottestContracts.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import * as m from "$lib/paraglide/messages";

  export let data;
</script>

<SEO
  title={m.stock_detail_options_hottest_vol_seo_title({ company: $displayCompanyName, ticker: $stockTicker })}
  description={m.stock_detail_options_hottest_vol_seo_description({ company: $displayCompanyName, ticker: $stockTicker })}
  keywords={m.stock_detail_options_hottest_vol_seo_keywords({ ticker: $stockTicker })}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/hottest-contracts/volume`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataFeed"],
    name: m.stock_detail_options_hottest_vol_structured_name({ company: $displayCompanyName }),
    description: m.stock_detail_options_hottest_vol_structured_desc({ company: $displayCompanyName, ticker: $stockTicker }),
    url: `https://stocknear.com/stocks/${$stockTicker}/options/hottest-contracts/volume`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Highest volume options tracking",
      "Real-time volume analysis",
      "Trading activity insights",
      "Volume trend identification",
      "Institutional flow detection",
      "Options activity ranking",
      "Volume-based momentum analysis",
      "Professional trading tools",
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
      {#if data?.getData?.volume?.length > 0}
        <HottestContracts
          {data}
          ticker={$stockTicker?.toUpperCase()}
          assetType="stocks"
          type="volume"
          title={m.stock_detail_options_hottest_vol_title()}
        />
      {:else}
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto">
          <div class="">
            <Infobox text={m.stock_detail_options_hottest_oi_no_data()} />
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>

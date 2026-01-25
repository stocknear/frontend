<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";

  import SEO from "$lib/components/SEO.svelte";
  import HottestContracts from "$lib/components/Options/HottestContracts.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import * as m from "$lib/paraglide/messages";

  export let data;
</script>

<SEO
  title={m.stock_detail_options_hottest_oi_seo_title({ company: $displayCompanyName, ticker: $stockTicker })}
  description={m.stock_detail_options_hottest_oi_seo_description({ company: $displayCompanyName, ticker: $stockTicker })}
  keywords={m.stock_detail_options_hottest_oi_seo_keywords({ ticker: $stockTicker })}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/hottest-contracts`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataFeed"],
    name: m.stock_detail_options_hottest_oi_structured_name({ company: $displayCompanyName }),
    description: m.stock_detail_options_hottest_oi_structured_desc({ company: $displayCompanyName, ticker: $stockTicker }),
    url: `https://stocknear.com/stocks/${$stockTicker}/options/hottest-contracts`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Highest volume options tracking",
      "Top open interest contracts",
      "Real-time options activity",
      "Volume trend analysis",
      "Open interest changes",
      "Contract popularity ranking",
      "Options flow analysis",
      "Trading activity insights",
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
      name: "Options Contract Analysis",
      description:
        "Professional tracking of most active options contracts by volume and open interest",
    },
  }}
/>

<section class="w-full overflow-hidden min-h-screen pb-40">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if data?.getData?.openInterest?.length > 0}
        <HottestContracts
          {data}
          ticker={$stockTicker?.toUpperCase()}
          assetType="stocks"
          type="oi"
          title={m.stock_detail_options_hottest_oi_title()}
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

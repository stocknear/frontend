<script lang="ts">
  import { etfTicker, displayCompanyName } from "$lib/store";

  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import {
    stock_detail_options_expected_move_no_data,
    stock_detail_options_expected_move_seo_description,
    stock_detail_options_expected_move_seo_keywords,
    stock_detail_options_expected_move_seo_title,
    stock_detail_options_expected_move_structured_desc,
    stock_detail_options_expected_move_structured_name,
  } from "$lib/paraglide/messages";

  import ExpectedMove from "$lib/components/Options/ExpectedMove.svelte";

  export let data;
</script>

<SEO
  title={stock_detail_options_expected_move_seo_title({
    company: $displayCompanyName,
    ticker: $etfTicker,
  })}
  description={stock_detail_options_expected_move_seo_description({
    company: $displayCompanyName,
    ticker: $etfTicker,
  })}
  keywords={stock_detail_options_expected_move_seo_keywords({
    ticker: $etfTicker,
  })}
  type="website"
  url={`https://stocknear.com/etf/${$etfTicker}/options/expected-move`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataVisualization"],
    name: stock_detail_options_expected_move_structured_name({
      company: $displayCompanyName,
    }),
    description: stock_detail_options_expected_move_structured_desc({
      company: $displayCompanyName,
      ticker: $etfTicker,
    }),
    url: `https://stocknear.com/etf/${$etfTicker}/options/expected-move`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Expected move calculation",
      "Price range projections",
      "Implied volatility analysis",
      "Multiple expiration dates",
      "Historical price overlay",
      "Upper and lower price bounds",
    ],
    provider: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
    mainEntity: {
      "@type": "Corporation",
      name: $displayCompanyName,
      tickerSymbol: $etfTicker,
    },
    about: {
      "@type": "Thing",
      name: "Expected Move Analysis",
      description:
        "Options-based price movement projections using implied volatility",
    },
  }}
/>

<section class="w-full overflow-hidden min-h-screen">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if data?.getData?.expirations?.length > 0}
        <ExpectedMove {data} ticker={$etfTicker?.toUpperCase()} />
      {:else}
        <div class="sm:pl-7 w-full m-auto">
          <div class="">
            <Infobox text={stock_detail_options_expected_move_no_data()} />
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>

<script lang="ts">
  import { indexTicker, displayCompanyName } from "$lib/store";

  import Infobox from "$lib/components/Infobox.svelte";
  import GreekByExpiry from "$lib/components/Options/GreekByExpiry.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import {
    stock_detail_options_dex_expiry_seo_description,
    stock_detail_options_dex_expiry_seo_keywords,
    stock_detail_options_dex_expiry_seo_title,
    stock_detail_options_dex_expiry_structured_desc,
    stock_detail_options_dex_expiry_structured_name,
    stock_detail_options_dex_no_data,
    stock_detail_options_dex_title_delta,
  } from "$lib/paraglide/messages";

  export let data;
  let rawData = data?.getData || [];
</script>

<SEO
  title={stock_detail_options_dex_expiry_seo_title({
    company: $displayCompanyName,
    ticker: $indexTicker,
  })}
  description={stock_detail_options_dex_expiry_seo_description({
    company: $displayCompanyName,
    ticker: $indexTicker,
  })}
  keywords={stock_detail_options_dex_expiry_seo_keywords({
    ticker: $indexTicker,
  })}
  type="website"
  url={`https://stocknear.com/stocks/${$indexTicker}/options/dex/expiry`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataVisualization"],
    name: stock_detail_options_dex_expiry_structured_name({
      company: $displayCompanyName,
    }),
    description: stock_detail_options_dex_expiry_structured_desc({
      company: $displayCompanyName,
      ticker: $indexTicker,
    }),
    url: `https://stocknear.com/stocks/${$indexTicker}/options/dex/expiry`,
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
      tickerSymbol: $indexTicker,
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
          title={stock_detail_options_dex_title_delta()}
          ticker={$indexTicker?.toUpperCase()}
        />
      {:else}
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto">
          <div class="">
            <Infobox text={stock_detail_options_dex_no_data()} />
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>

<script lang="ts">
  import { indexTicker, displayCompanyName } from "$lib/store";
  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import GreekByStrike from "$lib/components/Options/GreekByStrike.svelte";
  import {
    stock_detail_options_gex_no_data,
    stock_detail_options_gex_strike_seo_description,
    stock_detail_options_gex_strike_seo_keywords,
    stock_detail_options_gex_strike_seo_title,
    stock_detail_options_gex_strike_structured_desc,
    stock_detail_options_gex_strike_structured_name,
    stock_detail_options_gex_title_gamma,
  } from "$lib/paraglide/messages";

  export let data;
</script>

<SEO
  title={stock_detail_options_gex_strike_seo_title({
    company: $displayCompanyName,
    ticker: $indexTicker,
  })}
  description={stock_detail_options_gex_strike_seo_description({
    company: $displayCompanyName,
    ticker: $indexTicker,
  })}
  keywords={stock_detail_options_gex_strike_seo_keywords({
    ticker: $indexTicker,
  })}
  type="website"
  url={`https://stocknear.com/stocks/${$indexTicker}/options/gex/strike`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataVisualization"],
    name: stock_detail_options_gex_strike_structured_name({
      company: $displayCompanyName,
    }),
    description: stock_detail_options_gex_strike_structured_desc({
      company: $displayCompanyName,
      ticker: $indexTicker,
    }),
    url: `https://stocknear.com/stocks/${$indexTicker}/options/gex/strike`,
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
      tickerSymbol: $indexTicker,
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
          title={stock_detail_options_gex_title_gamma()}
          ticker={$indexTicker?.toUpperCase()}
        />
      {:else}
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto">
          <div class="">
            <Infobox text={stock_detail_options_gex_no_data()} />
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>

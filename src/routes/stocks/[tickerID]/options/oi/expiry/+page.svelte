<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";

  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import OpenInterestByExpiry from "$lib/components/Options/OpenInterestByExpiry.svelte";
  import * as m from "$lib/paraglide/messages";

  export let data;
  let rawData = data?.getData || [];
</script>

<SEO
  title={m.stock_detail_options_oi_expiry_seo_title({ company: $displayCompanyName, ticker: $stockTicker })}
  description={m.stock_detail_options_oi_expiry_seo_description({ company: $displayCompanyName, ticker: $stockTicker })}
  keywords={m.stock_detail_options_oi_expiry_seo_keywords({ ticker: $stockTicker })}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/oi/expiry`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataVisualization"],
    name: m.stock_detail_options_oi_expiry_structured_name({ company: $displayCompanyName }),
    description: m.stock_detail_options_oi_expiry_structured_desc({ company: $displayCompanyName, ticker: $stockTicker }),
    url: `https://stocknear.com/stocks/${$stockTicker}/options/oi/expiry`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Open interest by expiry tracking",
      "Expiration OI distribution",
      "Calendar-based positioning",
      "Expiry concentration analysis",
      "Roll risk assessment",
      "Time decay impact on OI",
      "Institutional calendar positioning",
      "Expiration sentiment analysis",
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
        <OpenInterestByExpiry {data} ticker={$stockTicker?.toUpperCase()} />
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

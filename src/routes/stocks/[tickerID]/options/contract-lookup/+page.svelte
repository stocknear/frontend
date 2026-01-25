<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";

  import SEO from "$lib/components/SEO.svelte";
  import ContractLookup from "$lib/components/Options/ContractLookup.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import * as m from "$lib/paraglide/messages";

  export let data;
</script>

<SEO
  title={m.stock_detail_options_contract_lookup_seo_title({ company: $displayCompanyName, ticker: $stockTicker })}
  description={m.stock_detail_options_contract_lookup_seo_description({ company: $displayCompanyName, ticker: $stockTicker })}
  keywords={m.stock_detail_options_contract_lookup_seo_keywords({ ticker: $stockTicker })}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/contract-lookup`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "WebApplication"],
    name: m.stock_detail_options_contract_lookup_structured_name({ company: $displayCompanyName }),
    description: m.stock_detail_options_contract_lookup_structured_desc({ company: $displayCompanyName, ticker: $stockTicker }),
    url: `https://stocknear.com/stocks/${$stockTicker}/options/contract-lookup`,
    applicationCategory: "FinanceApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Real-time options contract data",
      "Historical volume analysis",
      "Open interest tracking",
      "Bid-ask spread analysis",
      "Options Greeks calculator",
      "Advanced contract filtering",
      "Volume trend analysis",
      "Strike price comparison",
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
        <ContractLookup {data} ticker={$stockTicker} />
      {:else}
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto">
          <Infobox text={m.stock_detail_options_oi_no_data()} />
        </div>
      {/if}
    </div>
  </div>
</section>

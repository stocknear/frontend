<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";

  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import {
  stock_detail_options_max_pain_no_data,
  stock_detail_options_max_pain_seo_description,
  stock_detail_options_max_pain_seo_keywords,
  stock_detail_options_max_pain_seo_title,
  stock_detail_options_max_pain_structured_desc,
  stock_detail_options_max_pain_structured_name,
} from "$lib/paraglide/messages";

  import MaxPain from "$lib/components/Options/MaxPain.svelte";

  export let data;
</script>

<SEO
  title={stock_detail_options_max_pain_seo_title({ company: $displayCompanyName, ticker: $stockTicker })}
  description={stock_detail_options_max_pain_seo_description({ company: $displayCompanyName, ticker: $stockTicker })}
  keywords={stock_detail_options_max_pain_seo_keywords({ ticker: $stockTicker })}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/max-pain`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataVisualization"],
    name: stock_detail_options_max_pain_structured_name({ company: $displayCompanyName }),
    description: stock_detail_options_max_pain_structured_desc({ company: $displayCompanyName, ticker: $stockTicker }),
    url: `https://stocknear.com/stocks/${$stockTicker}/options/max-pain`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Max pain calculation",
      "Strike price pressure analysis",
      "Market maker positioning",
      "Options-driven price targets",
      "Expiration pressure tracking",
      "Sentiment analysis",
      "Pain threshold identification",
      "Market structure insights",
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
      name: "Max Pain Analysis",
      description:
        "Advanced options analysis focusing on maximum pain theory and strike price pressure",
    },
  }}
/>

<section class="w-full overflow-hidden min-h-screen">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if data?.getData?.length > 0}
        <MaxPain {data} ticker={$stockTicker?.toUpperCase()} />
      {:else}
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto">
          <div class="">
            <Infobox text={stock_detail_options_max_pain_no_data()} />
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>

<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";

  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import * as m from "$lib/paraglide/messages";

  import UnusualActivity from "$lib/components/Options/UnusualActivity.svelte";

  export let data;
</script>

<SEO
  title={m.stock_detail_options_unusual_seo_title({ company: $displayCompanyName, ticker: $stockTicker })}
  description={m.stock_detail_options_unusual_seo_description({ company: $displayCompanyName, ticker: $stockTicker })}
  keywords={m.stock_detail_options_unusual_seo_keywords({ ticker: $stockTicker })}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/unusual-activity`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataFeed"],
    name: m.stock_detail_options_unusual_structured_name({ company: $displayCompanyName }),
    description: m.stock_detail_options_unusual_structured_desc({ company: $displayCompanyName, ticker: $stockTicker }),
    url: `https://stocknear.com/stocks/${$stockTicker}/options/unusual-activity`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Unusual options activity detection",
      "$1M+ premium trade alerts",
      "Smart money flow analysis",
      "Institutional options tracking",
      "Unusual volume identification",
      "High-conviction trade detection",
      "Dark pool options activity",
      "Professional flow analysis",
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
      name: "Unusual Options Activity",
      description:
        "Professional detection and analysis of unusual options trading activity and institutional flows",
    },
  }}
/>

<section class="w-full overflow-hidden min-h-screen pb-40">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if data?.getData?.length > 0}
        <UnusualActivity
          {data}
          ticker={$stockTicker?.toUpperCase()}
          assetType={"stocks"}
        />
      {:else}
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto">
          <Infobox
            text={m.stock_detail_options_unusual_no_data()}
          />
        </div>
      {/if}
    </div>
  </div>
</section>

<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import OptionsChainStatistics from "$lib/components/Options/OptionsChainStatistics.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import {
  stock_detail_options_no_data,
  stock_detail_options_seo_description,
  stock_detail_options_seo_keywords,
  stock_detail_options_seo_title,
  stock_detail_options_structured_desc,
  stock_detail_options_structured_headline,
  stock_detail_options_structured_name,
} from "$lib/paraglide/messages";

  export let data;
</script>

<SEO
  title={stock_detail_options_seo_title({ company: $displayCompanyName, ticker: $stockTicker })}
  description={stock_detail_options_seo_description({ company: $displayCompanyName, ticker: $stockTicker })}
  keywords={stock_detail_options_seo_keywords({ ticker: $stockTicker, company: $displayCompanyName })}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "WebPage", "AnalysisNewsArticle"],
    name: stock_detail_options_structured_name({ company: $displayCompanyName, ticker: $stockTicker }),
    headline: stock_detail_options_structured_headline({ company: $displayCompanyName }),
    description: stock_detail_options_structured_desc({ company: $displayCompanyName, ticker: $stockTicker }),
    url: `https://stocknear.com/stocks/${$stockTicker}/options`,

    author: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
      logo: {
        "@type": "ImageObject",
        url: "https://stocknear.com/favicon.png",
      },
    },
    dateModified: new Date().toISOString(),
    datePublished: new Date().toISOString(),
    mainEntity: {
      "@type": "Corporation",
      name: $displayCompanyName,
      tickerSymbol: $stockTicker,
    },
    about: {
      "@type": "Thing",
      name: "Options Analysis",
      description: `options flow and chain data for ${$displayCompanyName} (${$stockTicker})`,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://stocknear.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Stocks",
          item: "https://stocknear.com/stocks",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `${$displayCompanyName} (${$stockTicker})`,
          item: `https://stocknear.com/stocks/${$stockTicker}`,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: "Options Analysis",
          item: `https://stocknear.com/stocks/${$stockTicker}/options`,
        },
      ],
    },
  }}
/>

<section class="w-full overflow-hidden min-h-screen">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if Object?.keys(data?.getOptionsChainStatistics)?.length > 0}
        <OptionsChainStatistics
          {data}
          ticker={$stockTicker?.toUpperCase()}
          assetType="stocks"
        />
      {:else}
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto">
          <div class="">
            <Infobox text={stock_detail_options_no_data()} />
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>

<!--Start Options Detail Desktop Modal-->

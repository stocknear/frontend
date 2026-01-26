<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import HistoricalDarkPool from "$lib/components/UnusualOrders/HistoricalDarkPool.svelte";
  import PriceLevel from "$lib/components/UnusualOrders/PriceLevel.svelte";
  import Exchange from "$lib/components/UnusualOrders/Exchange.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import HottestTrades from "$lib/components/UnusualOrders/HottestTrades.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import {
  stock_detail_unusual_orders_no_activity,
  stock_detail_unusual_orders_seo_description,
  stock_detail_unusual_orders_seo_keywords,
  stock_detail_unusual_orders_seo_title,
  stock_detail_unusual_orders_structured_desc,
  stock_detail_unusual_orders_structured_headline,
  stock_detail_unusual_orders_structured_name,
} from "$lib/paraglide/messages";

  export let data;
  let historicalDarkPool = data?.getHistoricalDarkPool || [];
  let priceLevel = data?.getPriceLevel?.priceLevel || [];
  let exchangeData = data?.getPriceLevel?.exchangeData || [];

  let hottestTrades = data?.getPriceLevel?.hottestTrades || [];
</script>

<SEO
  title={stock_detail_unusual_orders_seo_title({ company: $displayCompanyName, ticker: $stockTicker })}
  description={stock_detail_unusual_orders_seo_description({ company: $displayCompanyName, ticker: $stockTicker })}
  keywords={stock_detail_unusual_orders_seo_keywords({ ticker: $stockTicker, company: $displayCompanyName })}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "AnalysisNewsArticle", "WebPage"],
    name: stock_detail_unusual_orders_structured_name({ company: $displayCompanyName, ticker: $stockTicker }),
    headline: stock_detail_unusual_orders_structured_headline({ company: $displayCompanyName }),
    description: stock_detail_unusual_orders_structured_desc({ company: $displayCompanyName, ticker: $stockTicker }),
    url: `https://stocknear.com/stocks/${$stockTicker}/unusual-orders`,
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
      name: "Unusual Orders",
      description:
        "Combined view of institutional flows: on-exchange block trades (exchange-routed trades of 10,000+ shares) and off-exchange dark pool executions that hide large orders until reporting.",
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
          name: "Unusual Orders",
          item: `https://stocknear.com/stocks/${$stockTicker}/unusual-orders`,
        },
      ],
    },
  }}
/>

<section class="w-full overflow-hidden h-full">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <div class="sm:pl-7 sm:pb-7 sm:pt-7 pt-4 w-full m-auto mt-2 sm:mt-0">
        <div class="w-full">
          {#if priceLevel?.length === 0 && hottestTrades?.length === 0 && historicalDarkPool?.length === 0}
            <Infobox
              text={stock_detail_unusual_orders_no_activity({ company: $displayCompanyName })}
            />
          {/if}
        </div>
        {#if priceLevel?.length > 0}
          <PriceLevel
            {data}
            rawData={priceLevel}
            metrics={data?.getPriceLevel?.metrics}
          />
        {/if}
        {#if exchangeData?.length > 0}
          <Exchange {data} rawData={exchangeData} />
        {/if}
        {#if hottestTrades?.length > 0}
          <HottestTrades
            {data}
            rawData={hottestTrades}
            ticker={$stockTicker?.toUpperCase()}
          />
        {/if}

        {#if historicalDarkPool?.length > 10}
          <HistoricalDarkPool {data} rawData={historicalDarkPool} />
        {/if}
      </div>
    </div>
  </div>
</section>

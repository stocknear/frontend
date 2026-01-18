<script lang="ts">
  import { displayCompanyName, etfTicker } from "$lib/store";
  import HistoricalDarkPool from "$lib/components/UnusualOrders/HistoricalDarkPool.svelte";
  import PriceLevel from "$lib/components/UnusualOrders/PriceLevel.svelte";
  import Exchange from "$lib/components/UnusualOrders/Exchange.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import HottestTrades from "$lib/components/UnusualOrders/HottestTrades.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
  let historicalDarkPool = data?.getHistoricalDarkPool || [];
  let priceLevel = data?.getPriceLevel?.priceLevel || [];
  let exchangeData = data?.getPriceLevel?.exchangeData || [];

  let hottestTrades = data?.getPriceLevel?.hottestTrades || [];
</script>

<SEO
  title={`${$displayCompanyName} (${$etfTicker}) Unusual Orders — Block Trades & Dark Pool Activity`}
  description={`Unusual Orders for ${$displayCompanyName} (${$etfTicker}): on-exchange block trades (≥10,000 shares) and off-exchange dark pool executions — institutional flow, hidden volume, and market impact.`}
  keywords={`${$etfTicker} unusual orders, ${$etfTicker} block trades, ${$etfTicker} dark pool, ${$displayCompanyName} institutional flow, block trade data, dark liquidity, hidden trading volume, ATS trading, off-exchange trades, market impact`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "AnalysisNewsArticle", "WebPage"],
    name: `${$displayCompanyName} (${$etfTicker}) Unusual Orders Analysis`,
    headline: `${$displayCompanyName} — Unusual Orders: Block Trades (≥10,000 shares) & Dark Pool Activity`,
    description: `Analysis of unusual orders for ${$displayCompanyName} (${$etfTicker}): on-exchange block trades (10,000+ shares) and off-exchange dark pool executions, showing institutional positioning, hidden volume, and potential market impact.`,
    url: `https://stocknear.com/etf/${$etfTicker}/unusual-orders`,
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
      tickerSymbol: $etfTicker,
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
          name: "ETFs",
          item: "https://stocknear.com/etf",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `${$displayCompanyName} (${$etfTicker})`,
          item: `https://stocknear.com/etf/${$etfTicker}`,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: "Unusual Orders",
          item: `https://stocknear.com/etf/${$etfTicker}/unusual-orders`,
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
              text={`No Dark Pool activity are detected for ${$displayCompanyName}`}
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
            ticker={$etfTicker?.toUpperCase()}
          />
        {/if}

        {#if historicalDarkPool?.length > 10}
          <HistoricalDarkPool {data} rawData={historicalDarkPool} />
        {/if}
      </div>
    </div>
  </div>
</section>

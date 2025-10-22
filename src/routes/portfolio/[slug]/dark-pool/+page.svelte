<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import HistoricalVolume from "$lib/components/DarkPool/HistoricalVolume.svelte";
  import PriceLevel from "$lib/components/DarkPool/PriceLevel.svelte";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import HottestTrades from "$lib/components/DarkPool/HottestTrades.svelte";
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
  let historicalDarkPool = data?.getHistoricalDarkPool || [];
  let priceLevel = data?.getPriceLevel?.priceLevel || [];

  let hottestTrades = data?.getPriceLevel?.hottestTrades || [];
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Dark Pool Trading Analysis - Institutional Block Trading Data & Hidden Market Activity`}
  description={`Professional dark pool trading analysis for ${$displayCompanyName} (${$stockTicker}). Track institutional block trades, hidden market activity, volume distribution, and institutional sentiment. Access real-time dark pool data showing where big money is trading ${$stockTicker} away from public markets. Essential for understanding institutional positioning and market impact.`}
  keywords={`${$stockTicker} dark pool, ${$displayCompanyName} institutional trading, ${$stockTicker} block trades, dark pool analysis, institutional sentiment, hidden trading volume, off-exchange trading, market microstructure, institutional flow, dark liquidity, alternative trading systems, ATS trading data`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "AnalysisNewsArticle", "WebPage"],
    name: `${$displayCompanyName} (${$stockTicker}) Dark Pool Analysis`,
    headline: `${$displayCompanyName} Dark Pool Trading Data & Institutional Block Analysis`,
    description: `Professional analysis of dark pool trading activity for ${$displayCompanyName} (${$stockTicker}) including institutional block trades and hidden market flows`,
    url: `https://stocknear.com/stocks/${$stockTicker}/dark-pool`,

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
      name: "Dark Pool Trading",
      description:
        "Private exchanges for institutional block trading away from public markets",
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
          name: "Dark Pool Analysis",
          item: `https://stocknear.com/stocks/${$stockTicker}/dark-pool`,
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
          {:else if priceLevel?.length === 0 && hottestTrades?.length === 0}{:else}
            <div class="flex flex-row items-center mb-4 sm:mb-0">
              <label
                for="darkPoolInfo"
                class="mr-1 cursor-pointer flex flex-row items-center text-xl sm:text-2xl font-bold"
              >
                {$stockTicker?.toUpperCase()} Dark Pool Overview
              </label>
              <InfoModal
                title={"Dark Pool Data"}
                content={"Dark pool data refers to information on trading activities that occur in private, non-public financial exchanges known as dark pools. These venues are used by hedge funds and major institutional traders to buy and sell large blocks of securities without exposing their orders to the public, minimizing market impact and price fluctuations. Currently, nearly 50% of all trades are executed in these dark pools, highlighting their significant role in the trading landscape."}
                id={"darkPoolInfo"}
              />
            </div>
          {/if}
        </div>
        {#if priceLevel?.length > 0}
          <PriceLevel
            {data}
            rawData={priceLevel}
            metrics={data?.getPriceLevel?.metrics}
          />
        {/if}
        {#if hottestTrades?.length > 0}
          <HottestTrades
            {data}
            rawData={hottestTrades}
            ticker={$stockTicker?.toUpperCase()}
          />
        {/if}

        {#if historicalDarkPool?.length > 10}
          <HistoricalVolume {data} rawData={historicalDarkPool} />
        {/if}
        {#if data?.user?.tier === "Pro"}
          <UpgradeToPro {data} />
        {/if}
      </div>
    </div>
  </div>
</section>

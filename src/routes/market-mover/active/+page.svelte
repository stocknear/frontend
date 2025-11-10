<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import { displayTitle, displayDate } from "$lib/store";
  import SEO from "$lib/components/SEO.svelte";

  export let data;

  let rawData = data?.getMarketMover["1D"];

  let excludedRules = new Set([
    "volume",
    "price",
    "changesPercentage",
    "eps",
    "marketCap",
  ]);

  const defaultList = [
    { name: "Market Cap", rule: "marketCap" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "Volume", rule: "volume" },
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Most Active Stocks Today",
    description:
      "Real-time list of the most actively traded stocks by volume, featuring high-volume securities with significant market activity and trading interest.",
    url: "https://stocknear.com/market-mover/active",
    mainEntity: {
      "@type": "ItemList",
      name: "Most Active Stocks",
      description: "Today's most actively traded stocks by trading volume",
    },
    about: {
      "@type": "Thing",
      name: "Active Stock Trading",
      description:
        "Stock market securities with highest trading volume and market activity",
    },
  };
</script>

<SEO
  title="Most Active Stocks Today - High Volume Trading Stocks"
  description="Discover today's most actively traded stocks by volume. Track high-volume securities, market activity, trading volume, and real-time stock performance data."
  keywords="most active stocks, high volume stocks, active trading, stock volume, market activity, most traded stocks, high volume securities, active stock movers, trading volume analysis"
  {structuredData}
/>

<div class="w-full">
  <Table
    {data}
    {rawData}
    {excludedRules}
    {defaultList}
    title={$displayTitle}
    date={$displayDate}
  />
</div>

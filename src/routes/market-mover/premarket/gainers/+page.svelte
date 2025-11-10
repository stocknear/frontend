<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import { displayTitle, displayDate } from "$lib/store";
  import SEO from "$lib/components/SEO.svelte";

  export let data;

  let rawData = data?.getMarketMover;

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
    name: "Top Premarket Stock Gainers Today",
    description:
      "Real-time list of the best performing stocks in premarket trading, featuring stocks with highest percentage increases during extended hours.",
    url: "https://stocknear.com/market-mover/premarket/gainers",
    mainEntity: {
      "@type": "ItemList",
      name: "Premarket Stock Gainers",
      description:
        "Top performing stocks in premarket trading by percentage increase",
    },
    about: {
      "@type": "Thing",
      name: "Premarket Stock Trading Gainers",
      description:
        "Stocks with highest percentage price increases during premarket extended hours trading",
    },
  };
</script>

<SEO
  title="Top Premarket Stock Gainers Today - Extended Hours Winners"
  description="Discover today's top premarket stock gainers with highest percentage increases. Track extended hours trading performance, premarket winners, early morning movers, and pre-market stock activity."
  keywords="premarket gainers, premarket stocks, extended hours trading, premarket winners, early trading, pre-market movers, extended hours gainers, morning stock trading, premarket performance"
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

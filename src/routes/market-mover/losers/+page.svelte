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
    name: "Top Stock Losers Today",
    description:
      "Real-time list of today's worst performing stocks with the highest percentage losses, featuring declining stocks and market underperformers.",
    url: "https://stocknear.com/market-mover/losers",
    mainEntity: {
      "@type": "ItemList",
      name: "Top Stock Losers",
      description: "Today's worst performing stocks by percentage decrease",
    },
    about: {
      "@type": "Thing",
      name: "Stock Market Losers",
      description:
        "Stocks with highest percentage price decreases and negative market performance",
    },
  };
</script>

<SEO
  title="Top Stock Losers Today - Worst Performing Stocks"
  description="Track today's top stock losers with the highest percentage declines. Monitor declining stocks, worst performers, market underperformers, and negative stock movements in real-time."
  keywords="stock losers, top losers, worst performing stocks, declining stocks, stock declines, percentage losses, market losers, negative stock performance, stock decreases"
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

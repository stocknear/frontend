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
    name: "Top Stock Gainers Today",
    description:
      "Real-time list of today's top performing stocks with the highest percentage gains, featuring winning stocks and market leaders.",
    url: "https://stocknear.com/market-mover/gainers",
    mainEntity: {
      "@type": "ItemList",
      name: "Top Stock Gainers",
      description: "Today's best performing stocks by percentage increase",
    },
    about: {
      "@type": "Thing",
      name: "Stock Market Gainers",
      description:
        "Stocks with highest percentage price increases and positive market performance",
    },
  };
</script>

<SEO
  title="Top Stock Gainers Today - Best Performing Stocks"
  description="Discover today's top stock gainers with the highest percentage increases. Track winning stocks, best performers, market leaders, and positive stock movements in real-time."
  keywords="stock gainers, top gainers, best performing stocks, winning stocks, stock winners, percentage gains, market gainers, positive stock performance, stock increases"
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

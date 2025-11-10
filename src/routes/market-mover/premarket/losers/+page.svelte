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
    name: "Top Premarket Stock Losers Today",
    description:
      "Real-time list of the worst performing stocks in premarket trading, featuring stocks with highest percentage losses during extended hours.",
    url: "https://stocknear.com/market-mover/premarket/losers",
    mainEntity: {
      "@type": "ItemList",
      name: "Premarket Stock Losers",
      description:
        "Worst performing stocks in premarket trading by percentage decrease",
    },
    about: {
      "@type": "Thing",
      name: "Premarket Stock Trading Losers",
      description:
        "Stocks with highest percentage price decreases during premarket extended hours trading",
    },
  };
</script>

<SEO
  title="Top Premarket Stock Losers Today - Extended Hours Decliners"
  description="Track today's top premarket stock losers with highest percentage declines. Monitor extended hours trading losses, premarket decliners, early morning drops, and pre-market stock declines."
  keywords="premarket losers, premarket stocks, extended hours trading, premarket decliners, early trading losses, pre-market drops, extended hours losers, morning stock declines, premarket performance"
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

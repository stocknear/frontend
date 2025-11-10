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
    name: "Top After-Hours Stock Losers Today",
    description:
      "Real-time list of the worst performing stocks in after-hours trading, featuring stocks with highest percentage losses during extended hours.",
    url: "https://stocknear.com/market-mover/afterhours/losers",
    mainEntity: {
      "@type": "ItemList",
      name: "After-Hours Stock Losers",
      description:
        "Worst performing stocks in after-hours trading by percentage decrease",
    },
    about: {
      "@type": "Thing",
      name: "After-Hours Stock Trading Losers",
      description:
        "Stocks with highest percentage price decreases during after-hours extended hours trading",
    },
  };
</script>

<SEO
  title="Top After-Hours Stock Losers Today - Extended Hours Decliners"
  description="Track today's top after-hours stock losers with highest percentage declines. Monitor extended hours trading losses, aftermarket decliners, evening drops, and post-market stock declines."
  keywords="afterhours losers, after-hours stocks, extended hours trading, aftermarket decliners, evening trading losses, post-market drops, extended hours losers, aftermarket declines, after-hours performance"
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

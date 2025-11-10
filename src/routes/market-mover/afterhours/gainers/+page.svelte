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
    name: "Top After-Hours Stock Gainers Today",
    description:
      "Real-time list of the best performing stocks in after-hours trading, featuring stocks with highest percentage increases during extended hours.",
    url: "https://stocknear.com/market-mover/afterhours/gainers",
    mainEntity: {
      "@type": "ItemList",
      name: "After-Hours Stock Gainers",
      description:
        "Top performing stocks in after-hours trading by percentage increase",
    },
    about: {
      "@type": "Thing",
      name: "After-Hours Stock Trading Gainers",
      description:
        "Stocks with highest percentage price increases during after-hours extended hours trading",
    },
  };
</script>

<SEO
  title="Top After-Hours Stock Gainers Today - Extended Hours Winners"
  description="Discover today's top after-hours stock gainers with highest percentage increases. Track extended hours trading performance, aftermarket winners, evening movers, and post-market stock activity."
  keywords="afterhours gainers, after-hours stocks, extended hours trading, aftermarket winners, evening trading, post-market movers, extended hours gainers, aftermarket trading, after-hours performance"
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

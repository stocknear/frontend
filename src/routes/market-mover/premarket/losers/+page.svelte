<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import { displayTitle, displayDate } from "$lib/store";
  import SEO from "$lib/components/SEO.svelte";
  import {
    market_mover_premarket_losers_seo_description,
    market_mover_premarket_losers_seo_keywords,
    market_mover_premarket_losers_seo_title,
    market_mover_premarket_losers_structured_about_description,
    market_mover_premarket_losers_structured_about_name,
    market_mover_premarket_losers_structured_description,
    market_mover_premarket_losers_structured_main_description,
    market_mover_premarket_losers_structured_main_name,
    market_mover_premarket_losers_structured_name,
  } from "$lib/paraglide/messages.js";

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
    name: market_mover_premarket_losers_structured_name(),
    description: market_mover_premarket_losers_structured_description(),
    url: "https://stocknear.com/market-mover/premarket/losers",
    mainEntity: {
      "@type": "ItemList",
      name: market_mover_premarket_losers_structured_main_name(),
      description: market_mover_premarket_losers_structured_main_description(),
    },
    about: {
      "@type": "Thing",
      name: market_mover_premarket_losers_structured_about_name(),
      description: market_mover_premarket_losers_structured_about_description(),
    },
  };
</script>

<SEO
  title={market_mover_premarket_losers_seo_title()}
  description={market_mover_premarket_losers_seo_description()}
  keywords={market_mover_premarket_losers_seo_keywords()}
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

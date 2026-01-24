<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import {
    list_count_stocks,
    list_dividend_aristocrats_description,
    list_dividend_aristocrats_title,
    list_dividend_kings_description,
    list_dividend_kings_title,
  } from "$lib/paraglide/messages.js";

  import { page } from "$app/stores";

  export let data;

  const excludedRules = new Set([
    "volume",
    "price",
    "changesPercentage",
    "dividendYield",
    "eps",
    "marketCap",
  ]);

  const defaultList = [
    { name: "Market Cap", rule: "marketCap" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "Dividend Yield", rule: "dividendYield" },
    { name: "Years", rule: "years" },
  ];

  $: text =
    $page?.url?.pathname === "/list/dividend/dividend-kings"
      ? list_dividend_kings_description()
      : list_dividend_aristocrats_description();
</script>

<SEO
  title={$page?.url?.pathname === "/list/dividend/dividend-kings"
    ? list_dividend_kings_title()
    : list_dividend_aristocrats_title()}
  description={text}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox {text} />

  <!-- Page wrapper -->
  <Table
    {data}
    rawData={data?.getDividendCategory}
    {excludedRules}
    {defaultList}
    title={list_count_stocks({
      count: data?.getDividendCategory?.length?.toLocaleString("en-US") ?? "0",
    })}
  />
</section>

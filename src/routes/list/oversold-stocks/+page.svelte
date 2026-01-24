<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import {
    common_home,
    list_category_stock_lists,
    list_count_stocks,
    list_index_oversold_stocks,
    list_oversold_infobox,
    list_oversold_main_description,
    list_oversold_main_name,
    list_oversold_seo_description,
    list_oversold_seo_keywords,
    list_oversold_seo_title,
    list_oversold_structured_description,
  } from "$lib/paraglide/messages.js";

  export let data;

  const defaultList = [
    { name: "RSI", rule: "rsi" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "Market Cap", rule: "marketCap" },
  ];

  const excludedRules = new Set([
    "volume",
    "price",
    "changesPercentage",
    "revenue",
    "eps",
    "marketCap",
    "rsi",
  ]);
</script>

<SEO
  title={list_oversold_seo_title()}
  description={list_oversold_seo_description()}
  keywords={list_oversold_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: list_index_oversold_stocks(),
    description: list_oversold_structured_description(),
    url: "https://stocknear.com/list/oversold-stocks",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: common_home(),
          item: "https://stocknear.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: list_category_stock_lists(),
          item: "https://stocknear.com/list",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: list_index_oversold_stocks(),
          item: "https://stocknear.com/list/oversold-stocks",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: list_oversold_main_name(),
      description: list_oversold_main_description(),
      numberOfItems: data?.getOverSoldStocks?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox text={list_oversold_infobox()} />

  <!-- Page wrapper -->
  <Table
    {data}
    rawData={data?.getOverSoldStocks}
    {excludedRules}
    {defaultList}
    title={list_count_stocks({
      count: data?.getOverSoldStocks?.length?.toLocaleString("en-US") ?? "0",
    })}
  />
</section>

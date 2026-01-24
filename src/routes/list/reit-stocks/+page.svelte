<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import {
    common_home,
    list_category_stock_lists,
    list_count_stocks,
    list_reit_infobox,
    list_reit_main_description,
    list_reit_main_name,
    list_reit_seo_description,
    list_reit_seo_keywords,
    list_reit_seo_title,
    list_reit_structured_description,
    list_reit_structured_name,
  } from "$lib/paraglide/messages.js";

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
  ];
</script>

<SEO
  title={list_reit_seo_title()}
  description={list_reit_seo_description()}
  keywords={list_reit_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: list_reit_structured_name(),
    description: list_reit_structured_description(),
    url: "https://stocknear.com/list/reit-stocks",
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
          name: list_reit_structured_name(),
          item: "https://stocknear.com/list/reit-stocks",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: list_reit_main_name(),
      description: list_reit_main_description(),
      numberOfItems: data?.getAllREITS?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox text={list_reit_infobox()} />

  <!-- Page wrapper -->
  <Table
    {data}
    rawData={data?.getAllREITS}
    {excludedRules}
    {defaultList}
    title={list_count_stocks({
      count: data?.getAllREITS?.length?.toLocaleString("en-US") ?? "0",
    })}
  />
</section>

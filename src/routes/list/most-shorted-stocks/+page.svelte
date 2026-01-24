<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import {
    common_home,
    list_category_stock_lists,
    list_count_stocks,
    list_index_most_shorted_stocks,
    list_most_shorted_infobox,
    list_most_shorted_main_description,
    list_most_shorted_main_name,
    list_most_shorted_seo_description,
    list_most_shorted_seo_keywords,
    list_most_shorted_seo_title,
    list_most_shorted_structured_description,
    list_most_shorted_structured_name,
  } from "$lib/paraglide/messages.js";

  export let data;

  const defaultList = [
    { name: "Short % Float", rule: "shortFloatPercent" },
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
    "shortFloatPercent",
  ]);
</script>

<SEO
  title={list_most_shorted_seo_title()}
  description={list_most_shorted_seo_description()}
  keywords={list_most_shorted_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: list_most_shorted_structured_name(),
    description: list_most_shorted_structured_description(),
    url: "https://stocknear.com/list/most-shorted-stocks",
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
          name: list_index_most_shorted_stocks(),
          item: "https://stocknear.com/list/most-shorted-stocks",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: list_most_shorted_main_name(),
      description: list_most_shorted_main_description(),
      numberOfItems: data?.getStocks?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox text={list_most_shorted_infobox()} />

  <!-- Page wrapper -->
  <Table
    {data}
    rawData={data?.getStocks}
    {excludedRules}
    {defaultList}
    title={list_count_stocks({
      count: data?.getStocks?.length?.toLocaleString("en-US") ?? "0",
    })}
  />
</section>

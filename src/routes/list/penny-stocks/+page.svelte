<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import {
    common_home,
    list_category_stock_lists,
    list_count_stocks,
    list_index_penny_stocks,
    list_penny_infobox,
    list_penny_main_description,
    list_penny_main_name,
    list_penny_seo_description,
    list_penny_seo_keywords,
    list_penny_seo_title,
    list_penny_structured_description,
    list_penny_structured_name,
  } from "$lib/paraglide/messages.js";

  export let data;

  const defaultList = [
    { name: "Market Cap", rule: "marketCap" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "Volume", rule: "volume" },
  ];
</script>

<SEO
  title={list_penny_seo_title()}
  description={list_penny_seo_description()}
  keywords={list_penny_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: list_penny_structured_name(),
    description: list_penny_structured_description(),
    url: "https://stocknear.com/list/penny-stocks",
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
          name: list_index_penny_stocks(),
          item: "https://stocknear.com/list/penny-stocks",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: list_penny_main_name(),
      description: list_penny_main_description(),
      numberOfItems: data?.getPennyStocks?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox text={list_penny_infobox()} />

  <!-- Page wrapper -->
  <Table
    {data}
    rawData={data?.getPennyStocks}
    {defaultList}
    title={list_count_stocks({
      count: data?.getPennyStocks?.length?.toLocaleString("en-US") ?? "0",
    })}
  />
</section>

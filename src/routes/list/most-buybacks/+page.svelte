<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import {
    common_home,
    list_buybacks_infobox,
    list_buybacks_main_description,
    list_buybacks_main_name,
    list_buybacks_seo_description,
    list_buybacks_seo_keywords,
    list_buybacks_seo_title,
    list_buybacks_structured_description,
    list_buybacks_structured_name,
    list_category_stock_lists,
    list_count_stocks,
  } from "$lib/paraglide/messages.js";

  export let data;

  const defaultList = [
    { name: "Buybacks", rule: "commonStockRepurchased" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "Market Cap", rule: "marketCap" },
  ];
</script>

<SEO
  title={list_buybacks_seo_title()}
  description={list_buybacks_seo_description()}
  keywords={list_buybacks_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: list_buybacks_structured_name(),
    description: list_buybacks_structured_description(),
    url: "https://stocknear.com/list/most-buybacks",
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
          name: list_buybacks_structured_name(),
          item: "https://stocknear.com/list/most-buybacks",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: list_buybacks_main_name(),
      description: list_buybacks_main_description(),
      numberOfItems: data?.getData?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox text={list_buybacks_infobox()} />

  <!-- Page wrapper -->
  <Table
    {data}
    rawData={data?.getData}
    {defaultList}
    title={list_count_stocks({
      count: data?.getData?.length?.toLocaleString("en-US") ?? "0",
    })}
  />
</section>

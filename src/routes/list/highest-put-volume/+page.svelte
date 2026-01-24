<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import {
    common_home,
    list_category_stock_lists,
    list_highest_put_volume_infobox,
    list_highest_put_volume_main_description,
    list_highest_put_volume_main_name,
    list_highest_put_volume_seo_description,
    list_highest_put_volume_seo_keywords,
    list_highest_put_volume_seo_title,
    list_highest_put_volume_structured_description,
    list_highest_put_volume_structured_name,
  } from "$lib/paraglide/messages.js";

  export let data;

  const defaultList = [
    { name: "Put Volume", rule: "putVolume" },
    { name: "Call Volume", rule: "callVolume" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
  ];

  const excludedRules = new Set([
    "volume",
    "price",
    "changesPercentage",
    "revenue",
    "eps",
    "callVolume",
    "putVolume",
  ]);
</script>

<SEO
  title={list_highest_put_volume_seo_title()}
  description={list_highest_put_volume_seo_description()}
  keywords={list_highest_put_volume_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: list_highest_put_volume_structured_name(),
    description: list_highest_put_volume_structured_description(),
    url: "https://stocknear.com/list/highest-put-volume",
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
          name: list_highest_put_volume_structured_name(),
          item: "https://stocknear.com/list/highest-put-volume",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: list_highest_put_volume_main_name(),
      description: list_highest_put_volume_main_description(),
      numberOfItems: data?.getStocks?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox text={list_highest_put_volume_infobox()} />

  <!-- Page wrapper -->
  <Table {data} rawData={data?.getStocks} {excludedRules} {defaultList} />
</section>

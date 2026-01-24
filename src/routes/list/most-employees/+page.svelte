<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import {
    common_home,
    list_category_stock_lists,
    list_count_stocks,
    list_most_employees_infobox,
    list_most_employees_main_description,
    list_most_employees_main_name,
    list_most_employees_seo_description,
    list_most_employees_seo_keywords,
    list_most_employees_seo_title,
    list_most_employees_structured_description,
    list_most_employees_structured_name,
  } from "$lib/paraglide/messages.js";

  export let data;

  const defaultList = [
    { name: "Employees", rule: "employees" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "Market Cap", rule: "marketCap" },
  ];
</script>

<SEO
  title={list_most_employees_seo_title()}
  description={list_most_employees_seo_description()}
  keywords={list_most_employees_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: list_most_employees_structured_name(),
    description: list_most_employees_structured_description(),
    url: "https://stocknear.com/list/most-employees",
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
          name: list_most_employees_structured_name(),
          item: "https://stocknear.com/list/most-employees",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: list_most_employees_main_name(),
      description: list_most_employees_main_description(),
      numberOfItems: data?.getData?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox text={list_most_employees_infobox()} />

  <!-- Page wrapper -->
  <Table
    title={list_count_stocks({
      count: data?.getData?.length?.toLocaleString("en-US") ?? "0",
    })}
    {data}
    rawData={data?.getData}
    {defaultList}
  />
</section>

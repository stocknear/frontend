<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import {
    common_home,
    list_category_stock_lists,
    list_count_stocks,
  } from "$lib/paraglide/messages.js";

  export let data;

  const defaultList = [
    { name: "Net Debt", rule: "netDebt" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "Market Cap", rule: "marketCap" },
  ];

  const pageTitle = "Net Cash Stocks";
  const pageDescription =
    "Find net cash stocks with balance sheets holding more cash than total debt. This list requires net debt < 0 and market cap >= $1B.";
  const pageKeywords =
    "net cash stocks, negative net debt stocks, low leverage stocks";
</script>

<SEO
  title={pageTitle}
  description={pageDescription}
  keywords={pageKeywords}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageTitle,
    description: pageDescription,
    url: "https://stocknear.com/list/net-cash-stocks",
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
          name: pageTitle,
          item: "https://stocknear.com/list/net-cash-stocks",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: pageTitle,
      description: pageDescription,
      numberOfItems: data?.getData?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text="Net cash stocks are companies with more cash than debt, reflected by negative net debt. This list includes stocks with net debt below zero and market cap above $1B."
  />

  <Table
    {data}
    rawData={data?.getData}
    {defaultList}
    title={list_count_stocks({
      count: data?.getData?.length?.toLocaleString("en-US") ?? "0",
    })}
  />
</section>

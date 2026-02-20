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
    { name: "FCF Yield", rule: "freeCashFlowYield" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "Market Cap", rule: "marketCap" },
  ];

  const pageTitle = "High Free Cash Flow Yield Stocks";
  const pageDescription =
    "Find high free cash flow yield stocks with strong cash generation relative to valuation. This list requires free cash flow yield >= 8% and market cap >= $1B.";
  const pageKeywords =
    "high free cash flow yield stocks, free cash flow yield stocks, value stocks";
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
    url: "https://stocknear.com/list/high-free-cash-flow-yield-stocks",
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
          item: "https://stocknear.com/list/high-free-cash-flow-yield-stocks",
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
    text="High free cash flow yield stocks are companies generating strong free cash flow relative to their valuation. This list includes stocks with at least 8% free cash flow yield and market cap above $1B."
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

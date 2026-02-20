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
    { name: "Dividend Growth", rule: "dividendGrowth" },
    { name: "Dividend Yield", rule: "dividendYield" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "Market Cap", rule: "marketCap" },
  ];

  const pageTitle = "Dividend Growth Stocks";
  const pageDescription =
    "Track dividend growth stocks sorted by dividend growth and market cap. This list requires dividend growth >= 5%, dividend yield >= 1%, and market cap >= $1B.";
  const pageKeywords =
    "dividend growth stocks, high dividend growth, dividend growth investing, dividend yield stocks";
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
    url: "https://stocknear.com/list/dividend-growth-stocks",
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
          item: "https://stocknear.com/list/dividend-growth-stocks",
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
    text="Dividend growth stocks are companies that consistently increase their payouts over time. This list includes stocks with at least 5% dividend growth, at least 1% dividend yield, and market cap above $1B."
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

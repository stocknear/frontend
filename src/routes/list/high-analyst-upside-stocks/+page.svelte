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
    { name: "Upside", rule: "upside" },
    { name: "Analyst Count", rule: "analystCounter" },
    { name: "Analyst Rating", rule: "analystRating" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "Market Cap", rule: "marketCap" },
  ];

  const pageTitle = "High Analyst Upside Stocks";
  const pageDescription =
    "Find stocks with strong analyst upside and broader analyst coverage. This list requires upside >= 20%, analyst count >= 5, analyst rating in Buy or Strong Buy, and market cap >= $1B.";
  const pageKeywords =
    "high analyst upside stocks, analyst upside stocks, buy rated stocks";
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
    url: "https://stocknear.com/list/high-analyst-upside-stocks",
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
          item: "https://stocknear.com/list/high-analyst-upside-stocks",
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
    text="High analyst upside stocks are companies with stronger price-target upside and enough analyst coverage to reduce single-analyst noise. This list includes stocks with at least 20% upside, at least 5 analysts, Buy or Strong Buy rating, and market cap above $1B."
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

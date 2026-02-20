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
    { name: "Forward PE", rule: "forwardPE" },
    { name: "Return on Equity", rule: "returnOnEquity" },
    { name: "Debt / Equity", rule: "debtToEquityRatio" },
    { name: "Revenue Growth Years", rule: "revenueGrowthYears" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "Market Cap", rule: "marketCap" },
  ];

  const pageTitle = "Undervalued Growth Stocks";
  const pageDescription =
    "Find undervalued growth stocks with profitability, controlled leverage, and multi-year revenue expansion. This list requires forward PE <= 20, ROE >= 12%, debt to equity <= 1.5, revenue growth years >= 2, and market cap >= $2B.";
  const pageKeywords =
    "undervalued growth stocks, growth value stocks, low forward pe growth stocks";
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
    url: "https://stocknear.com/list/undervalued-growth-stocks",
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
          item: "https://stocknear.com/list/undervalued-growth-stocks",
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
    text="Undervalued growth stocks are companies that still compound revenue while trading at reasonable valuation levels. This list includes stocks with forward PE of 20 or less, ROE of at least 12%, debt to equity of 1.5 or less, at least 2 years of revenue growth, and market cap above $2B."
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

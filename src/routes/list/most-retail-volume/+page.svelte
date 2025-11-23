<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;

  const defaultList = [
    { name: "Retail Vol Share vs US Market", rule: "activity" },
    { name: "Retail Vol in $", rule: "traded" },
    { name: "Retail Sentiment", rule: "sentiment" },
  ];

  const specificRows = [
    {
      name: "Retail Vol / US Market",
      rule: "activity",
      type: "percent",
    },
    {
      name: "Retail Vol in $",
      rule: "traded",
      type: "int",
    },
    {
      name: "Retail Sentiment",
      rule: "sentiment",
      type: "sentiment",
    },
  ];

  const excludedRules = new Set([
    "volume",
    "price",
    "changesPercentage",
    "sentiment",
    "traded",
    "activity",
  ]);
</script>

<SEO
  title="Highest Open Interest Change - Biggest Options OI Changes "
  description="List of US stocks ranked by highest open interest changes. Track which companies have the biggest increases in options open interest and emerging options activity."
  keywords="highest open interest change, OI change stocks, options interest increase, biggest OI changes, open interest growth, options activity change"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Highest Open Interest Change",
    description: "US stocks ranked by highest open interest changes",
    url: "https://stocknear.com/list/highest-open-interest-change",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://stocknear.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Stock Lists",
          item: "https://stocknear.com/list",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Highest Open Interest Change",
          item: "https://stocknear.com/list/highest-open-interest-change",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Stocks by Open Interest Change",
      description:
        "List of US stocks ranked by open interest changes in options",
      numberOfItems: data?.getStocks?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text="These are US stocks with the highest changes in open interest (OI). Open interest represents outstanding options contracts, and significant changes often indicate shifting investor sentiment or emerging trading opportunities."
  />

  <!-- Page wrapper -->
  <Table
    {data}
    rawData={data?.getStocks}
    {excludedRules}
    {defaultList}
    {specificRows}
    title={data?.getStocks?.length?.toLocaleString("en-US") + " " + "Stocks"}
  />
</section>

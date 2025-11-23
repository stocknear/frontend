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
  title="Top US Stocks by Retail Trading Tracker Volume"
  description="Track US stocks with the highest retail trading volume. Discover where individual investors are most active and spot potential meme stocks or volatility spikes."
  keywords="retail trading volume, retail investor activity, top retail stocks, meme stocks, high retail volume, individual investor trends"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Top US Stocks by Retail Trading Volume",
    description:
      "US stocks ranked by highest retail trading volume and individual investor activity.",
    url: "https://stocknear.com/list/most-retail-volume",
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
          name: "Top US Stocks by Retail Volume",
          item: "https://stocknear.com/list/most-retail-volume",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Stocks by Retail Trading Volume",
      description:
        "List of US stocks ranked by retail trading activity and volume.",
      numberOfItems: data?.getStocks?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text="US stocks ranked by Retail Market Share, showing where individual investors are most active. Highlights potential meme stocks or volatility unrelated to fundamentals."
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

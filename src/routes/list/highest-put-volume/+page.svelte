<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

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
  title="Highest Put Volume Stocks - Top Put Option Trading Volume "
  description="List of US stocks ranked by highest put option volume. Track which companies have the most put option contract trading activity and bearish sentiment."
  keywords="highest put volume stocks, put option volume, put options trading, bearish stocks, highest put activity, put volume leaders, options volume"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Highest Put Volume Stocks",
    description: "US stocks ranked by highest put option trading volume",
    url: "https://stocknear.com/list/highest-put-volume",
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
          name: "Highest Put Volume",
          item: "https://stocknear.com/list/highest-put-volume",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Stocks by Put Volume",
      description: "List of US stocks ranked by put option trading volume",
      numberOfItems: data?.getStocks?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text="These are US stocks with the highest put option trading volume. Put volume represents the total number of put option contracts traded, often indicating bearish sentiment or hedging activity by investors."
  />

  <!-- Page wrapper -->
  <Table {data} rawData={data?.getStocks} {excludedRules} {defaultList} />
</section>

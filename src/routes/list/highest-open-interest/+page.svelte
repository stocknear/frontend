<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;

  const defaultList = [
    { name: "Total OI", rule: "totalOI" },
    { name: "Change OI", rule: "changeOI" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "IV Rank", rule: "ivRank" },
    { name: "Total Prem", rule: "totalPrem" },
  ];

  const excludedRules = new Set([
    "volume",
    "price",
    "changesPercentage",
    "revenue",
    "eps",
    "changeOI",
    "totalOI",
    "totalPrem",
    "ivRank",
  ]);
</script>

<SEO
  title="Highest Open Interest Stocks - Top Options Open Interest "
  description="List of US stocks ranked by highest options open interest. Track which companies have the most outstanding options contracts and highest options activity."
  keywords="highest open interest stocks, options open interest, outstanding options contracts, options activity, highest OI stocks, open interest leaders"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Highest Open Interest Stocks",
    description: "US stocks ranked by highest options open interest",
    url: "https://stocknear.com/list/highest-open-interest",
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
          name: "Highest Open Interest",
          item: "https://stocknear.com/list/highest-open-interest",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Stocks by Open Interest",
      description: "List of US stocks ranked by options open interest",
      numberOfItems: data?.getStocks?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text="These are US stocks with the highest options open interest (OI). Open interest represents the total number of outstanding options contracts available for trading, indicating market liquidity and investor interest."
  />

  <!-- Page wrapper -->
  <Table
    {data}
    rawData={data?.getStocks}
    {excludedRules}
    {defaultList}
    title={data?.getStocks?.length?.toLocaleString("en-US") + " " + "Stocks"}
  />
</section>

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
  title="Highest Options Premium Stocks - Top Total Options Premium "
  description="List of US stocks ranked by highest total options premium. Track which companies have the most options premium value and highest options market interest."
  keywords="highest options premium, total options premium, options market leaders, options premium value, premium collection stocks, highest premium stocks"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Highest Options Premium Stocks",
    description: "US stocks ranked by highest total options premium",
    url: "https://stocknear.com/list/highest-option-premium",
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
          name: "Highest Options Premium",
          item: "https://stocknear.com/list/highest-option-premium",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Stocks by Options Premium",
      description: "List of US stocks ranked by total options premium value",
      numberOfItems: data?.getStocks?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text="These are US stocks with the highest total options premium. The premium represents the sum of all options contract values for each stock, reflecting market sentiment, volatility expectations, and overall options trading interest."
  />

  <!-- Page wrapper -->
  <Table {data} rawData={data?.getStocks} {excludedRules} {defaultList} />
</section>

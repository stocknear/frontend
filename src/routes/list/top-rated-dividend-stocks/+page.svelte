<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  export let data;

  const defaultList = [
    { name: "Dividend Yield", rule: "dividendYield" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "Market Cap", rule: "marketCap" },
  ];
</script>

<SEO
  title="Top-Rated Dividend Stocks - Analyst Buy Recommendations "
  description="Complete list of dividend stocks rated as Buy or Strong Buy by analysts. High-quality dividend stocks with sustainable yields, strong fundamentals, and positive analyst sentiment for income investing."
  keywords="top rated dividend stocks, buy rated dividend stocks, analyst recommendations dividend, dividend stock ratings, dividend aristocrats, quality dividend stocks, income stocks buy rating"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Top-Rated Dividend Stocks List",
    description:
      "Complete directory of dividend stocks with Buy or Strong Buy analyst ratings",
    url: "https://stocknear.com/list/top-rated-dividend-stocks",
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
          name: "Top-Rated Dividend Stocks",
          item: "https://stocknear.com/list/top-rated-dividend-stocks",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "High-Quality Dividend Stocks Directory",
      description:
        "List of dividend stocks with Buy or Strong Buy analyst ratings and sustainable yields",
      numberOfItems: data?.getDividendStocks?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text="Comprehensive list of high-quality dividend stocks with Buy or Strong Buy analyst ratings. Each stock has consensus ratings from at least 10 analysts, dividend yields of 2% or higher, and payout ratios below 60% for sustainable income generation."
  />

  <!-- Page wrapper -->
  <Table
    {data}
    rawData={data?.getDividendStocks}
    {defaultList}
    title={data?.getDividendStocks?.length?.toLocaleString("en-US") + " Stocks"}
  />
</section>

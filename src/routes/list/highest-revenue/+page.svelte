<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;

  const defaultList = [
    { name: "Revenue", rule: "revenue" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "Market Cap", rule: "marketCap" },
  ];
</script>

<SEO
  title="Highest Revenue Companies - Biggest US Companies by Revenue "
  description="List of the biggest US public companies ranked by total revenue and sales in the past 12 months. Discover which American corporations generate the most annual revenue."
  keywords="highest revenue companies, biggest companies by revenue, largest companies by sales, top revenue companies, US companies by revenue, highest sales companies"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Highest Revenue Companies",
    description: "US companies ranked by highest total revenue and sales",
    url: "https://stocknear.com/list/highest-revenue",
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
          name: "Highest Revenue",
          item: "https://stocknear.com/list/highest-revenue",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Companies by Revenue",
      description:
        "List of US public companies ranked by total revenue and sales",
      numberOfItems: data?.getData?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text="These are the biggest US public companies ranked by total revenue and sales over the past 12 months. Track which American corporations generate the most annual revenue across all sectors."
  />

  <!-- Page wrapper -->
  <Table
    {data}
    rawData={data?.getData}
    {defaultList}
    title={data?.getData?.length?.toLocaleString("en-US") + " Stocks"}
  />
</section>

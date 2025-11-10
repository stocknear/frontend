<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;

  const defaultList = [
    { name: "Employees", rule: "employees" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "Market Cap", rule: "marketCap" },
  ];
</script>

<SEO
  title="Largest Employers - Companies with Most Employees in US "
  description="List of the biggest US public companies ranked by total number of employees. Discover which American corporations employ the most workers and staff."
  keywords="largest employers, companies with most employees, biggest employers US, companies by employee count, largest US employers, most employees companies"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Largest Employers",
    description: "US companies ranked by total number of employees",
    url: "https://stocknear.com/list/most-employees",
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
          name: "Most Employees",
          item: "https://stocknear.com/list/most-employees",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Companies by Employee Count",
      description:
        "List of US public companies ranked by total number of employees",
      numberOfItems: data?.getData?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text="These are the biggest US public companies ranked by total number of employees, updated daily. Track which American corporations employ the most workers across all industries."
  />

  <!-- Page wrapper -->
  <Table
    title={data?.getData?.length?.toLocaleString("en-US") + " Stocks"}
    {data}
    rawData={data?.getData}
    {defaultList}
  />
</section>

<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;

  const defaultList = [
    { name: "Relative FTD", rule: "relativeFTD" },
    { name: "FTD Shares", rule: "failToDeliver" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
  ];
</script>

<SEO
  title="Highest FTD Shares - Failed to Deliver Stocks "
  description="List of US stocks ranked by highest failed-to-deliver (FTD) shares reported by SEC. Track which companies have the most FTD shares and relative FTD ratios."
  keywords="FTD shares, failed to deliver stocks, SEC FTD data, highest FTD shares, relative FTD, failed delivery shares, FTD stocks list"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Highest FTD Shares",
    description: "US stocks ranked by highest failed-to-deliver (FTD) shares",
    url: "https://stocknear.com/list/most-ftd-shares",
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
          name: "Most FTD Shares",
          item: "https://stocknear.com/list/most-ftd-shares",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Stocks by FTD Shares",
      description:
        "List of US stocks ranked by failed-to-deliver (FTD) shares reported by SEC",
      numberOfItems: data?.getData?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text="These are US stocks ranked by failed-to-deliver (FTD) shares as reported by the SEC, updated daily. 'Relative FTD' compares FTD shares to average trading volume, showing their significance in overall trading activity."
  />

  <!-- Page wrapper -->
  <Table
    title={data?.getData?.length?.toLocaleString("en-US") + " Stocks"}
    {data}
    rawData={data?.getData}
    {defaultList}
  />
</section>

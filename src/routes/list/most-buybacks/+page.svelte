<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;

  const defaultList = [
    { name: "Buybacks", rule: "commonStockRepurchased" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "Market Cap", rule: "marketCap" },
  ];
</script>

<SEO
  title="Most Stock Buybacks List - Companies with Highest Repurchases "
  description="Complete list of US companies with the highest stock buybacks and share repurchases. Track capital allocation strategies and shareholder value creation through stock repurchase programs."
  keywords="stock buybacks, share repurchases, stock buyback list, share repurchase programs, capital allocation, shareholder returns, stock repurchases"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Most Stock Buybacks List",
    description:
      "Complete directory of US companies with the highest stock buybacks and share repurchases",
    url: "https://stocknear.com/list/most-buybacks",
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
          name: "Most Buybacks",
          item: "https://stocknear.com/list/most-buybacks",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Stock Buybacks Directory",
      description:
        "List of US companies ranked by highest stock buybacks and share repurchases",
      numberOfItems: data?.getData?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text="Comprehensive list of US companies ranked by the highest stock buybacks and share repurchases. These companies actively return capital to shareholders through stock repurchase programs, demonstrating confidence in their business and commitment to shareholder value."
  />

  <!-- Page wrapper -->
  <Table
    {data}
    rawData={data?.getData}
    {defaultList}
    title={data?.getData?.length?.toLocaleString("en-US") + " " + "Stocks"}
  />
</section>

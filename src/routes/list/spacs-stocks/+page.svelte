<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;

  const excludedRules = new Set([
    "volume",
    "price",
    "changesPercentage",
    "eps",
    "marketCap",
  ]);

  const defaultList = [
    { name: "Market Cap", rule: "marketCap" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
  ];
</script>

<SEO
  title="SPAC Stocks List - Special Purpose Acquisition Companies "
  description="Complete list of actively traded SPAC stocks (Special Purpose Acquisition Companies) on US markets. Track blank check companies and shell companies seeking acquisition targets."
  keywords="SPAC stocks, special purpose acquisition companies, blank check companies, shell companies, SPAC investments, acquisition companies, SPAC list"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "SPAC Stocks",
    description:
      "List of actively traded Special Purpose Acquisition Companies (SPACs)",
    url: "https://stocknear.com/list/spacs-stocks",
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
          name: "SPAC Stocks",
          item: "https://stocknear.com/list/spacs-stocks",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "SPAC Companies",
      description:
        "List of Special Purpose Acquisition Companies (SPACs) trading on US markets",
      numberOfItems: data?.getData?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text="These are all actively traded SPACs (Special Purpose Acquisition Companies) on the US stock market. SPACs are blank check companies that raise capital through public offerings to acquire private companies and bring them public."
  />

  <!-- Page wrapper -->
  <Table
    {data}
    rawData={data?.getData}
    {excludedRules}
    {defaultList}
    title={data?.getData?.length?.toLocaleString("en-US") + " " + "Stocks"}
  />
</section>

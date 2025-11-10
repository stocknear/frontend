<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;

  const defaultList = [
    { name: "Short % Float", rule: "shortFloatPercent" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "Market Cap", rule: "marketCap" },
  ];

  const excludedRules = new Set([
    "volume",
    "price",
    "changesPercentage",
    "revenue",
    "eps",
    "marketCap",
    "shortFloatPercent",
  ]);
</script>

<SEO
  title="Most Shorted Stocks List - High Short Interest Stocks "
  description="Complete list of most shorted stocks with highest short interest as percentage of float. Track heavily shorted stocks, short squeeze candidates, and bearish sentiment indicators for contrarian investing strategies."
  keywords="most shorted stocks, high short interest stocks, heavily shorted stocks, short squeeze stocks, short float percentage, bearish stocks, contrarian investing, short interest data"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Most Shorted Stocks List",
    description:
      "Complete directory of stocks with the highest short interest relative to their float",
    url: "https://stocknear.com/list/most-shorted-stocks",
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
          name: "Most Shorted Stocks",
          item: "https://stocknear.com/list/most-shorted-stocks",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "High Short Interest Stocks Directory",
      description:
        "List of stocks with the highest number of shares shorted relative to float",
      numberOfItems: data?.getStocks?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text="Comprehensive list of stocks with the highest short interest as a percentage of float. These heavily shorted stocks represent bearish sentiment and potential short squeeze candidates. Float represents shares available for trading by the public."
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

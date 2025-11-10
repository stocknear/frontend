<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;

  const defaultList = [
    { name: "Call Volume", rule: "callVolume" },
    { name: "Put Volume", rule: "putVolume" },
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
  title="Highest Call Volume Stocks - Options Trading Activity "
  description="Complete list of stocks with highest call option volume indicating bullish sentiment and options trading activity. Track call volume leaders for momentum trading and options strategies."
  keywords="highest call volume stocks, call option volume, bullish options activity, options trading volume, call volume leaders, options momentum stocks, bullish sentiment indicators"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Highest Call Volume Stocks List",
    description:
      "Complete directory of stocks with the highest call option trading volume",
    url: "https://stocknear.com/list/highest-call-volume",
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
          name: "Highest Call Volume",
          item: "https://stocknear.com/list/highest-call-volume",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "High Call Volume Stocks Directory",
      description:
        "List of stocks with the highest call option contract trading volume",
      numberOfItems: data?.getStocks?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text="Comprehensive list of stocks with the highest call option volume, indicating strong bullish sentiment and active options trading. High call volume often signals investor optimism and can precede significant price movements."
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

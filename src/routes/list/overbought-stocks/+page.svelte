<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;

  const defaultList = [
    { name: "RSI", rule: "rsi" },
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
    "rsi",
  ]);
</script>

<SEO
  title="Overbought Stocks List - High RSI Technical Analysis "
  description="Complete list of overbought stocks with RSI above 70 indicating potential pullback opportunities. Technical analysis screening for momentum reversal and short-term trading strategies."
  keywords="overbought stocks, high RSI stocks, RSI over 70, technical analysis stocks, momentum reversal stocks, overbought RSI screening, technical indicators"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Overbought Stocks List",
    description:
      "Complete directory of stocks with high RSI indicating overbought conditions",
    url: "https://stocknear.com/list/overbought-stocks",
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
          name: "Overbought Stocks",
          item: "https://stocknear.com/list/overbought-stocks",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Overbought Stocks Directory",
      description:
        "List of stocks with RSI over 70 indicating overbought technical conditions",
      numberOfItems: data?.getOverBoughtStocks?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text="Comprehensive list of overbought stocks based on Relative Strength Index (RSI) technical analysis. Stocks with RSI above 70 are considered overbought and may be due for a pullback or consolidation, providing potential short-term trading opportunities."
  />

  <!-- Page wrapper -->
  <Table
    {data}
    rawData={data?.getOverBoughtStocks}
    {excludedRules}
    {defaultList}
    title={data?.getOverBoughtStocks?.length?.toLocaleString("en-US") +
      " " +
      "Stocks"}
  />
</section>

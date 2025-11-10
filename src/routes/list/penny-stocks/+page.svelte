<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;

  const defaultList = [
    { name: "Market Cap", rule: "marketCap" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "Volume", rule: "volume" },
  ];
</script>

<SEO
  title="Penny Stocks List - Actively Traded Stocks Under $5 "
  description="Complete list of actively traded penny stocks under $5 per share with volume over 10K. Find low-priced stocks for speculative trading and investment opportunities with high volume and liquidity."
  keywords="penny stocks, penny stock list, stocks under $5, low price stocks, cheap stocks, small cap stocks, penny stock trading, sub $5 stocks, micro cap stocks"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Penny Stocks List",
    description:
      "Complete directory of actively traded penny stocks under $5 per share with high volume",
    url: "https://stocknear.com/list/penny-stocks",
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
          name: "Penny Stocks",
          item: "https://stocknear.com/list/penny-stocks",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Penny Stocks Directory",
      description:
        "List of actively traded stocks under $5 per share with trading volume over 10,000",
      numberOfItems: data?.getPennyStocks?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text="Comprehensive list of actively traded penny stocks priced below $5 per share with trading volume over 10,000 shares. These low-priced stocks offer speculative investment opportunities but carry higher risk due to volatility and liquidity concerns."
  />

  <!-- Page wrapper -->
  <Table
    {data}
    rawData={data?.getPennyStocks}
    {defaultList}
    title={data?.getPennyStocks?.length?.toLocaleString("en-US") +
      " " +
      "Stocks"}
  />
</section>

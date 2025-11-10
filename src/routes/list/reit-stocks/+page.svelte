<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;

  const excludedRules = new Set([
    "volume",
    "price",
    "changesPercentage",
    "dividendYield",
    "eps",
    "marketCap",
  ]);

  const defaultList = [
    { name: "Market Cap", rule: "marketCap" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "Dividend Yield", rule: "dividendYield" },
  ];
</script>

<SEO
  title="REIT Stocks List - Real Estate Investment Trusts "
  description="Complete list of REIT stocks (Real Estate Investment Trusts) with dividend yields, market cap, and performance metrics. Analyze residential, commercial, industrial, and specialty REITs for income investing."
  keywords="REIT stocks, real estate investment trusts, REIT list, dividend REITs, real estate stocks, income REITs, commercial real estate stocks, residential REITs"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "REIT Stocks List",
    description:
      "Complete directory of Real Estate Investment Trusts (REITs) for income and real estate exposure",
    url: "https://stocknear.com/list/reit-stocks",
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
          name: "REIT Stocks",
          item: "https://stocknear.com/list/reit-stocks",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Real Estate Investment Trusts Directory",
      description:
        "List of actively traded REITs on the US stock market with dividend and performance data",
      numberOfItems: data?.getAllREITS?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text="Comprehensive list of actively traded Real Estate Investment Trusts (REITs) on the US stock market. REITs provide exposure to real estate sectors including residential, commercial, industrial, and specialty properties while offering attractive dividend yields for income investors."
  />

  <!-- Page wrapper -->
  <Table
    {data}
    rawData={data?.getAllREITS}
    {excludedRules}
    {defaultList}
    title={data?.getAllREITS?.length?.toLocaleString("en-US") + " " + "Stocks"}
  />
</section>

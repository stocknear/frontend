<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;

  const currentYear = new Date().getFullYear();
  const defaultList = [
    { name: "Dividend Yield", rule: "dividendYield" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "Market Cap", rule: "marketCap" },
  ];
</script>

<SEO
  title="Monthly Dividend Stocks List - Income Stocks That Pay Monthly "
  description="Complete list of monthly dividend stocks that pay dividends every month. Find reliable income stocks for consistent monthly cash flow including REITs, BDCs, and dividend aristocrats with monthly distributions."
  keywords="monthly dividend stocks, monthly income stocks, monthly dividend paying stocks, monthly cash flow stocks, income investing, dividend stocks monthly, REITs monthly dividends"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Monthly Dividend Stocks List",
    description:
      "Complete directory of stocks that pay dividends every month for consistent income",
    url: "https://stocknear.com/list/monthly-dividend-stocks",
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
          name: "Monthly Dividend Stocks",
          item: "https://stocknear.com/list/monthly-dividend-stocks",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Monthly Dividend Stocks Directory",
      description:
        "List of stocks that pay dividends monthly for consistent income generation",
      numberOfItems: data?.getData?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text="Comprehensive list of stocks that pay dividends every month, providing consistent monthly income for investors. Includes REITs, BDCs, closed-end funds, and other securities listed on major US exchanges that distribute monthly dividends."
  />

  <!-- Page wrapper -->
  <Table
    {data}
    rawData={data?.getData}
    {defaultList}
    title={data?.getData?.length?.toLocaleString("en-US") + " " + "Stocks"}
  />
</section>

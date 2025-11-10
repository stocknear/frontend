<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;

  const defaultList = [
    { name: "Income Tax", rule: "incomeTaxExpense" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "Market Cap", rule: "marketCap" },
  ];
</script>

<SEO
  title="Highest Income Tax Companies - US Companies That Pay Most Taxes "
  description="List of US companies paying the highest income taxes ranked by corporate tax payments. Discover which public companies contribute most in federal income tax expenses and corporate tax rates."
  keywords="highest income tax companies, companies paying most taxes, corporate tax payments, income tax expense, corporate tax rates, highest corporate taxes, US tax paying companies"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Highest Income Tax Companies",
    description: "US companies ranked by highest corporate income tax payments",
    url: "https://stocknear.com/list/highest-income-tax",
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
          name: "Highest Income Tax",
          item: "https://stocknear.com/list/highest-income-tax",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Companies by Income Tax Payments",
      description:
        "List of US public companies ranked by corporate income tax expenses",
      numberOfItems: data?.getData?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text="These are the biggest public companies in the US, ranked by the total amount of corporate income taxes they paid in the past 12 months. Track which companies contribute most to federal tax revenue."
  />

  <!-- Page wrapper -->
  <Table
    {data}
    rawData={data?.getData}
    {defaultList}
    title={data?.getData?.length?.toLocaleString("en-US") + " Stocks"}
  />
</section>

<script lang="ts">
  import { screenWidth } from "$lib/store";
  import IndustryTable from "$lib/components/IndustryTable.svelte";
  import { industryList, sectorList, sectorNavigation } from "$lib/utils";
  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";

  export let data;
  let rawData = data?.getSectorIndustryOverview;

  $: charNumber = $screenWidth < 640 ? 20 : 30;
</script>

<SEO
  title="Stock Sectors & Industries Analysis - Market Performance by Sector "
  description={`Analyze stock performance across ${sectorList?.length} sectors and ${industryList?.length} industries. Track sector rotation, industry trends, and market performance by business category. Free sector and industry analysis tool.`}
  keywords="stock sectors, stock industries, sector analysis, industry analysis, sector performance, technology stocks, healthcare stocks, financial sector, energy sector, sector rotation"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Stock Sectors and Industries",
    description: "Stock market analysis organized by sectors and industries",
    url: "https://stocknear.com/industry",
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
          name: "Industries",
          item: "https://stocknear.com/industry",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Stock Market Sectors and Industries",
      description: "Comprehensive list of stock market sectors and industries",
      numberOfItems: sectorList?.length + industryList?.length,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <div class="mb-3">
    <Infobox
      text={`Stocknear categorize stocks into ${sectorList?.length} sectors and ${industryList?.length}
    industries, based on the company's primary business activity.`}
    />
  </div>

  <!-- Page wrapper -->
  <div class="flex justify-center w-full m-auto h-full overflow-hidden">
    <!-- Content area -->
    <div class="w-full">
      {#each sectorList as sector}
        <IndustryTable
          {charNumber}
          industryList={rawData[sector]}
          sectorName={sector}
          sectorLink={sectorNavigation?.find((item) => item?.title === sector)
            ?.link}
        />
      {/each}
    </div>
  </div>
</section>

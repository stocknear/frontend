<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
  let rawData = data?.getData;

  let totalMarketCap =
    rawData?.reduce((total, stock) => total + stock?.marketCap, 0) ?? 0;
  let totalRevenue =
    rawData?.reduce((total, stock) => total + stock?.revenue, 0) ?? 0;
</script>

<SEO
  title="Mobile Game Stocks List - Mobile Gaming Companies "
  description="Complete list of mobile gaming and mobile game developer stocks. Analyze companies developing mobile games, gaming apps, and mobile entertainment with market cap, revenue, and growth metrics."
  keywords="mobile game stocks, mobile gaming stocks, mobile game developers, gaming app stocks, mobile entertainment stocks, game developer stocks, smartphone gaming companies"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Mobile Game Stocks List",
    description:
      "Complete directory of mobile gaming companies and mobile game developers",
    url: "https://stocknear.com/list/mobile-games",
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
          name: "Mobile Game Stocks",
          item: "https://stocknear.com/list/mobile-games",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Mobile Gaming Companies Directory",
      description:
        "List of mobile gaming and mobile game development companies with market capitalization data",
      numberOfItems: rawData?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text="Comprehensive list of mobile gaming and mobile game developer stocks. Includes companies developing popular mobile games, gaming apps, and mobile entertainment platforms. Track the performance of the rapidly growing mobile gaming industry."
  />

  <div
    class="shadow mt-6 mb-4 flex flex-col divide-y divide-gray-300 dark:divide-gray-600 rounded border border-gray-300 dark:border-gray-600 sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0"
  >
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div class="text-[1rem] font-semibold">Total Stocks</div>
        <div
          class="mt-1 break-words font-semibold leading-8 text-xl sm:text-2xl"
        >
          {new Intl.NumberFormat("en")?.format(rawData?.length)}
        </div>
      </div>
    </div>
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div class="text-[1rem] font-semibold">Total Market Cap</div>
        <div
          class="mt-1 break-words font-semibold leading-8 text-xl sm:text-2xl"
        >
          {abbreviateNumber(totalMarketCap)}
        </div>
      </div>
    </div>
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div class="text-[1rem] font-semibold">Total Revenue</div>
        <div
          class="mt-1 break-words font-semibold leading-8 text-xl sm:text-2xl"
        >
          {abbreviateNumber(totalRevenue)}
        </div>
      </div>
    </div>
  </div>

  <Table
    {data}
    rawData={data?.getData}
    title={data?.getData?.length?.toLocaleString("en-US") + " " + "Stocks"}
  />
</section>

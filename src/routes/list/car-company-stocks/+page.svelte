<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
  let rawData = data?.getData || [];

  let totalMarketCap =
    rawData?.reduce((total, stock) => total + stock?.marketCap, 0) ?? 0;
  let totalRevenue =
    rawData?.reduce((total, stock) => total + stock?.revenue, 0) ?? 0;
</script>

<SEO
  title="Car Company Stocks List - Top Auto Manufacturers "
  description="Complete list of car company and automaker stocks ranked by market capitalization. Analyze Tesla, Toyota, Ford, GM and other automotive industry leaders with market cap, revenue, and performance metrics."
  keywords="car company stocks, auto stocks, automotive stocks, car manufacturer stocks, TSLA stock, F stock, GM stock, TM stock, auto industry stocks, vehicle manufacturer stocks"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Car Company Stocks List",
    description:
      "Complete directory of car company and automaker stocks ranked by market capitalization",
    url: "https://stocknear.com/list/car-company-stocks",
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
          name: "Car Company Stocks",
          item: "https://stocknear.com/list/car-company-stocks",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Automotive Stocks Directory",
      description:
        "List of car company and automaker stocks with market capitalization and financial metrics",
      numberOfItems: rawData?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text="Comprehensive list of car company and automaker stocks ranked by market capitalization. Includes major automotive manufacturers like Tesla, Toyota, Ford, General Motors, and other leading vehicle companies. Compare financial metrics, market performance, and industry positioning."
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

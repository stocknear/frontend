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
  title="Clean Energy Stocks List - Renewable Energy Companies "
  description="Complete list of clean energy and renewable energy stocks ranked by market capitalization. Analyze solar, wind, battery, and green technology companies with market cap, revenue, and ESG metrics."
  keywords="clean energy stocks, renewable energy stocks, green energy stocks, solar stocks, wind energy stocks, battery stocks, ESG stocks, sustainable energy investments, clean tech stocks"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Clean Energy Stocks List",
    description:
      "Complete directory of clean energy and renewable energy companies ranked by market capitalization",
    url: "https://stocknear.com/list/clean-energy",
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
          name: "Clean Energy Stocks",
          item: "https://stocknear.com/list/clean-energy",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Clean Energy Companies Directory",
      description:
        "List of clean energy and renewable energy companies with market capitalization and financial metrics",
      numberOfItems: rawData?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text="Comprehensive list of clean energy and renewable energy stocks ranked by market capitalization. Includes companies focused on solar power, wind energy, battery technology, electric utilities, and other sustainable energy solutions. Track the performance of leading green technology investments."
  />

  <div
    class="mt-6 mb-4 grid grid-cols-1 sm:grid-cols-3 overflow-hidden rounded-xl border border-gray-200/70 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-950/40 divide-y divide-gray-200/70 dark:divide-zinc-800/80 sm:divide-x sm:divide-y-0"
  >
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div class="text-xs uppercase tracking-wide text-gray-400 dark:text-zinc-500">Total Stocks</div>
        <div
          class="mt-1 break-words text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tabular-nums"
        >
          {new Intl.NumberFormat("en")?.format(rawData?.length)}
        </div>
      </div>
    </div>
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div class="text-xs uppercase tracking-wide text-gray-400 dark:text-zinc-500">Total Market Cap</div>
        <div
          class="mt-1 break-words text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tabular-nums"
        >
          {abbreviateNumber(totalMarketCap)}
        </div>
      </div>
    </div>
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div class="text-xs uppercase tracking-wide text-gray-400 dark:text-zinc-500">Total Revenue</div>
        <div
          class="mt-1 break-words text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tabular-nums"
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

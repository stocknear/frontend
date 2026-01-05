<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;

  let rawData = data?.getSectorCategory;

  let totalMarketCap = rawData?.reduce(
    (total, stock) => total + stock?.marketCap,
    0,
  );
  let totalRevenue = rawData?.reduce(
    (total, stock) => total + stock?.revenue,
    0,
  );
</script>

<SEO
  title={`${data?.getParams
    ?.split(" ")
    ?.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    ?.join(" ")} Stocks List - Sector Analysis`}
  description={`Complete list of ${data?.getParams} sector stocks with ${rawData?.length} companies, combined market cap of ${abbreviateNumber(totalMarketCap)} and total revenue of ${abbreviateNumber(totalRevenue)}. Analyze sector performance, trends, and leading companies.`}
  keywords={`${data?.getParams?.toLowerCase()} stocks, ${data?.getParams?.toLowerCase()} sector, ${data?.getParams?.toLowerCase()} companies, sector analysis, ${data?.getParams?.toLowerCase()} investments`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${data?.getParams} Sector Stocks`,
    description: `Complete directory of companies in the ${data?.getParams} sector`,
    url: `https://stocknear.com/list/sector/${data?.getParams?.toLowerCase()?.replace(/\s+/g, "-")}`,
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
          name: "Sector Stocks",
          item: "https://stocknear.com/list/sector",
        },
        {
          "@type": "ListItem",
          position: 4,
          name: `${data?.getParams}`,
          item: `https://stocknear.com/list/sector/${data?.getParams?.toLowerCase()?.replace(/\s+/g, "-")}`,
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: `${data?.getParams} Sector Directory`,
      description: `List of companies in the ${data?.getParams} sector with market capitalization and financial metrics`,
      numberOfItems: rawData?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text={`Comprehensive analysis of the ${data?.getParams} sector with ${rawData?.length} publicly traded companies. Combined market capitalization of ${abbreviateNumber(totalMarketCap)} and total revenue of ${abbreviateNumber(totalRevenue)}. Track sector performance, trends, and leading market players.`}
  />

  <div
    class="mt-6 mb-4 grid grid-cols-1 sm:grid-cols-3 overflow-hidden rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/60 dark:bg-zinc-950/40 divide-y divide-gray-200/70 dark:divide-zinc-800/80 sm:divide-x sm:divide-y-0"
  >
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div
          class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
        >
          Total Stocks
        </div>
        <div
          class="mt-1 break-words text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tabular-nums"
        >
          {new Intl.NumberFormat("en")?.format(rawData?.length)}
        </div>
      </div>
    </div>
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div
          class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
        >
          Total Market Cap
        </div>
        <div
          class="mt-1 break-words text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tabular-nums"
        >
          {abbreviateNumber(totalMarketCap)}
        </div>
      </div>
    </div>
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div
          class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
        >
          Total Revenue
        </div>
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
    rawData={data?.getSectorCategory}
    title={data?.getSectorCategory?.length?.toLocaleString("en-US") +
      " " +
      "Stocks"}
  />
</section>

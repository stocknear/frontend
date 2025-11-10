<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import Table from "$lib/components/Table/Table.svelte";
  import { formatDate } from "$lib/utils";
  export let data;

  let marketNews = data?.getNews;
  let rawData = data?.getIPOCalendar?.slice(0, 200) ?? [];
  const excludedRules = new Set([
    "volume",
    "price",
    "ipoPrice",
    "return",
    "eps",
    "ipoDate",
    "marketCap",
  ]);

  const defaultList = [
    { name: "IPO Date", rule: "ipoDate" },
    { name: "IPO Price", rule: "ipoPrice" },
    { name: "Current Price", rule: "currentPrice" },
    { name: "Return Since", rule: "return" },
  ];

  const specificRows = [
    { name: "Return Since", rule: "return", type: "percentSign" },
    { name: "IPO Date", rule: "ipoDate", type: "date" },
    { name: "IPO Price", rule: "ipoPrice", type: "float" },
    { name: "Current Price", rule: "currentPrice", type: "float" },
  ];
</script>

<SEO
  title="IPO Calendar - Recent & Upcoming IPOs | Initial Public Offerings "
  description="Track recent and upcoming IPOs (Initial Public Offerings) with detailed analysis. Monitor IPO performance, prices, dates, and returns since listing. Free IPO calendar and tracker with comprehensive data."
  keywords="IPO calendar, upcoming IPOs, recent IPOs, initial public offerings, IPO tracker, IPO performance, IPO prices, new stock listings, public offerings"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "IPO Calendar",
    description:
      "Comprehensive tracking of recent and upcoming Initial Public Offerings",
    url: "https://stocknear.com/ipos",
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
          name: "IPOs",
          item: "https://stocknear.com/ipos",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "IPO List",
      description: "List of recent and upcoming Initial Public Offerings",
      numberOfItems: rawData?.length || 0,
    },
  }}
/>

<div class="w-full overflow-hidden m-auto">
  <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
    <div
      class="relative flex flex-col lg:flex-row justify-center items-start overflow-hidden w-full"
    >
      <main class="w-full lg:w-3/4 lg:pr-10">
        <div class="w-full overflow-x-auto">
          <Table
            title={rawData?.length?.toLocaleString("en-US") + " Stocks"}
            {data}
            {rawData}
            {excludedRules}
            {defaultList}
            {specificRows}
          />
        </div>
      </main>
      <aside class="inline-block relative w-full lg:w-1/4 mt-3">
        {#if marketNews?.length !== 0}
          <div
            class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer bg-inherit"
          >
            <div class="p-4 text-sm">
              <h3 class="text-xl font-bold mb-3">Stock News</h3>
              <ul class="">
                {#each marketNews?.slice(0, 10) as item}
                  <li class="mb-3 last:mb-1">
                    {formatDate(item?.publishedDate)} -
                    <a
                      class="text-blue-800 sm:hover:text-muted dark:sm:hover:text-white dark:text-blue-400"
                      href={item?.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow">{item?.title}</a
                    >
                    - {item?.site}
                  </li>
                {/each}
              </ul>
              <a
                href={`/market-news`}
                class="flex justify-center items-center rounded cursor-pointer w-full py-2 mt-3 text-[1rem] text-center font-semibold text-white dark:text-black m-auto sm:hover:bg-muted dark:sm:hover:bg-gray-300 bg-black dark:bg-[#fff] transition duration-100"
              >
                More Stocks News
              </a>
            </div>
          </div>
        {/if}
      </aside>
    </div>
  </div>
</div>

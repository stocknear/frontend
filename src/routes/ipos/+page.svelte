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
            class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
          >
            <div class="p-4 text-sm text-gray-600 dark:text-zinc-300">
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-3"
              >
                Stock News
              </h3>
              <ul class="">
                {#each marketNews?.slice(0, 10) as item}
                  <li class="mb-3 last:mb-1">
                    {formatDate(item?.publishedDate)} -
                    <a
                      class="text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
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
                class="flex justify-center items-center rounded-full cursor-pointer w-full py-2.5 mt-3 text-[0.95rem] text-center font-semibold text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200 transition"
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

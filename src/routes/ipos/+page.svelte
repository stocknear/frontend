<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import Table from "$lib/components/Table/Table.svelte";

  export let data;

  let ipoNews = data?.getNews;
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
  title="200 Most Recent IPOs"
  description="Detailed information the last 200 IPOs (initial public offerings) on the stock market. Includes IPO prices, dates, total returns and more."
/>

<div class="w-full overflow-hidden m-auto">
  <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
    <div
      class="relative flex flex-col lg:flex-row justify-center items-start overflow-hidden w-full"
    >
      <main class="w-full lg:w-3/4 lg:pr-10">
        <div class="w-full overflow-x-auto">
          <Table
            {data}
            {rawData}
            {excludedRules}
            {defaultList}
            {specificRows}
          />
        </div>
      </main>
      <aside class="inline-block relative w-full lg:w-1/4 mt-3">
        {#if ipoNews?.length !== 0}
          <div
            class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer bg-inherit"
          >
            <div class="p-4 text-sm">
              <h3 class="text-xl font-bold mb-3">IPO News</h3>
              <ul class="">
                {#each ipoNews?.slice(0, 10) as item}
                  <li class="mb-3 last:mb-1">
                    {item?.timestamp}
                    <a
                      class="text-blue-700 sm:hover:text-muted dark:sm:hover:text-white dark:text-blue-400"
                      href={item?.link}
                      target="_blank"
                      rel="noopener noreferrer nofollow">{item?.title}</a
                    >
                  </li>
                {/each}
              </ul>
              <a
                href={`/ipos/news`}
                class="flex justify-center items-center rounded cursor-pointer w-full py-2 -mb-2 text-[1rem] text-center font-semibold text-white dark:text-black m-auto sm:hover:bg-default dark:sm:hover:bg-gray-300 bg-black dark:bg-[#fff]"
              >
                More IPO News
              </a>
            </div>
          </div>
        {/if}
      </aside>
    </div>
  </div>
</div>

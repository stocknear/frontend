<script lang="ts">
  import { indexTicker } from "$lib/store";
  import { formatDate, removeCompanyStrings } from "$lib/utils";

  export let data;

  let newsList = [];
  let similarStocks = [];

  $: {
    if ($indexTicker) {
      newsList = data?.getNews || [];
      similarStocks = data?.getSimilarStocks;
    }
  }
</script>

<section class="w-full overflow-hidden">
  <div class="w-full overflow-hidden m-auto">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex flex-col lg:flex-row justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:w-3/4 lg:pr-10">
          <slot />
        </main>

        <aside class="inline-block relative w-full lg:w-1/4 mt-3">
          {#if !["Pro", "Plus"]?.includes(data?.user?.tier)}
            <div
              class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
            >
              <a
                href="/pricing"
                class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
              >
                <div class="w-full flex justify-between items-center p-3 mt-3">
                  <h2 class="text-start text-xl font-semibold sm:ml-3">
                    Pro Subscription
                  </h2>
                </div>
                <span class=" p-3 sm:ml-3 sm:mr-3 -mt-4">
                  Upgrade now for unlimited access to all data, tools and no
                  ads.
                </span>
              </a>
            </div>
          {/if}

          {#if similarStocks?.length > 0 && similarStocks?.at(0)?.dividendYield}
            <div
              class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4"
            >
              <h3 class="p-2 pt-4 text-xl font-semibold">Related Stocks</h3>
              <table class="table table-sm table-compact w-full">
                <thead class="text-muted dark:text-white"
                  ><tr
                    ><th
                      class="whitespace-nowrap border-b border-gray-300 dark:border-gray-600 font-semibold text-[1rem] text-left px-2"
                      >Company</th
                    >
                    <th
                      class="whitespace-nowrap border-b border-gray-300 dark:border-gray-600 font-semibold text-[1rem] text-right px-2"
                      >Dividend Yield</th
                    ></tr
                  ></thead
                >
                <tbody>
                  {#each similarStocks?.slice(0, 8) as item, index}
                    {#if item?.dividendYield > 0}
                      <tr
                        class="border-gray-300 dark:border-gray-800 text-[1rem] {index !==
                        similarStocks?.slice(0, 8).length - 1
                          ? 'border-b'
                          : ''}"
                        ><td class="text-left text-[1rem] px-2"
                          ><a
                            href={`/stocks/${item?.symbol}/dividends`}
                            class="text-blue-800 sm:hover:text-muted dark:sm:hover:text-white dark:text-blue-400"
                            >{removeCompanyStrings(item?.name)}</a
                          ></td
                        >
                        <td class="text-right cursor-normal text-[1rem] px-2"
                          >{item?.dividendYield
                            ? item?.dividendYield + "%"
                            : "n/a"}</td
                        >
                      </tr>
                    {/if}
                  {/each}
                </tbody>
              </table>
              <div class="px-2">
                <a
                  href="/list/top-rated-dividend-stocks"
                  class="flex justify-center items-center rounded cursor-pointer w-full py-2 mt-3 text-[1rem] text-center font-semibold text-white dark:text-black m-auto sm:hover:bg-muted dark:sm:hover:bg-gray-300 bg-black dark:bg-[#fff] transition duration-100"
                >
                  Dividend Rankings
                </a>
              </div>
            </div>
          {/if}

          {#if newsList?.length !== 0}
            <div
              class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer bg-inherit"
            >
              <div class="p-4 text-sm">
                <h3 class="text-lg font-semibold mb-3">
                  {$indexTicker} News
                </h3>
                <ul class="">
                  {#each newsList?.slice(0, 10) as item}
                    <li class="mb-3 last:mb-1">
                      {formatDate(item?.publishedDate)} &#183;
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
              </div>
            </div>
          {/if}
        </aside>
      </div>
    </div>
  </div>
</section>

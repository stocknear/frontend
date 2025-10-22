<script lang="ts">
  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";

  export let data;
  const similarStocks = data?.getSimilarStocks;

  function getMarketCapCategory(marketCap) {
    const BILLION = 1_000_000_000;
    const MILLION = 1_000_000;

    const marketCapNavigation = [
      {
        threshold: 200 * BILLION,
        name: "Mega-Cap",
        link: "/list/market-cap/mega-cap-stocks",
      },
      {
        minThreshold: 10 * BILLION,
        maxThreshold: 200 * BILLION,
        name: "Large-Cap",
        link: "/list/market-cap/large-cap-stocks",
      },
      {
        minThreshold: 2 * BILLION,
        maxThreshold: 10 * BILLION,
        name: "Mid-Cap",
        link: "/list/market-cap/mid-cap-stocks",
      },
      {
        minThreshold: 300 * MILLION,
        maxThreshold: 2 * BILLION,
        name: "Small-Cap",
        link: "/list/market-cap/small-cap-stocks",
      },
      {
        minThreshold: 50 * MILLION,
        maxThreshold: 300 * MILLION,
        name: "Micro-Cap",
        link: "/list/market-cap/micro-cap-stocks",
      },
      {
        maxThreshold: 50 * MILLION,
        name: "Nano-Cap",
        link: "/list/market-cap/nano-cap-stocks",
      },
    ];

    if (!marketCap) return null;

    // Convert string to number if needed
    const capValue =
      typeof marketCap === "string" ? parseFloat(marketCap) : marketCap;

    return marketCapNavigation.find((category) => {
      if (category.threshold) {
        return capValue >= category.threshold;
      }
      if (category.minThreshold && category.maxThreshold) {
        return (
          capValue >= category.minThreshold && capValue < category.maxThreshold
        );
      }
      if (category.maxThreshold) {
        return capValue < category.maxThreshold;
      }
      return false;
    });
  }

  let capCategory = getMarketCapCategory(data?.getStockQuote?.marketCap);
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

          <div
            class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4"
          >
            <h3 class="p-2 pt-4 text-xl font-semibold">
              Market Capitalization
            </h3>
            <div class=" p-2">
              Market capitalization, also called net worth, is the total value
              of all of a company's outstanding shares. It is calculated by
              multiplying the stock price by the number of shares outstanding.
              <br />
              <br />
              Formula: Market Cap = Stock Price * Shares Outstanding
            </div>
            <div class="px-2">
              <a
                href="/blog/article/market-capitalization"
                class="flex justify-center items-center rounded cursor-pointer w-full py-2 mt-3 text-[1rem] text-center font-semibold text-white dark:text-black m-auto sm:hover:bg-muted dark:sm:hover:bg-gray-300 bg-black dark:bg-[#fff] transition duration-100"
              >
                Full Definition
              </a>
            </div>
          </div>

          {#if similarStocks?.length > 0}
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
                      >Market Cap</th
                    ></tr
                  ></thead
                >
                <tbody>
                  {#each similarStocks?.slice(0, 8) as item, index}
                    {#if item?.marketCap > 0}
                      <tr
                        class="border-gray-300 dark:border-gray-800 text-[1rem] {index !==
                        similarStocks?.slice(0, 8).length - 1
                          ? 'border-b'
                          : ''}"
                        ><td class="text-left text-[1rem] px-2"
                          ><a
                            href={`/stocks/${item?.symbol}`}
                            class="text-blue-800 sm:hover:text-muted dark:sm:hover:text-white dark:text-blue-400"
                            >{removeCompanyStrings(item?.name)}</a
                          ></td
                        >
                        <td class="text-right cursor-normal text-[1rem] px-2"
                          >{abbreviateNumber(item?.marketCap)}</td
                        >
                      </tr>
                    {/if}
                  {/each}
                </tbody>
              </table>
              {#if capCategory}
                <div class="px-2">
                  <a
                    href={capCategory?.link}
                    class="flex justify-center items-center rounded cursor-pointer w-full py-2 mt-3 text-[1rem] text-center font-semibold text-white dark:text-black m-auto sm:hover:bg-muted dark:sm:hover:bg-gray-300 bg-black dark:bg-[#fff] transition duration-100"
                  >
                    {capCategory?.name} Rankings
                  </a>
                </div>
              {/if}
            </div>
          {/if}
        </aside>
      </div>
    </div>
  </div>
</section>

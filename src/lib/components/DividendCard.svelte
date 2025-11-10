<script lang="ts">
  import { etfTicker, screenWidth } from "$lib/store";
  import { goto } from "$app/navigation";

  export let dividendList;

  let dividendHistoryList = [];
  let dividendYield;

  $: {
    if ($etfTicker && typeof window !== "undefined") {
      dividendHistoryList = dividendList?.history;

      dividendYield = dividendList?.dividendYield;
    }
  }
</script>

<!--Start Similar Stocks Card -->

<div
  class="space-y-3 lg:pt-5 lg:{dividendHistoryList?.length !== 0
    ? ''
    : 'hidden'}"
>
  <div
    class="sm:rounded shadow-lg bg-[#000] lg:bg-default lg:border lg:border-gray-600 h-auto {$screenWidth <=
    800
      ? 'w-screen pt-16'
      : ''} md:w-[420px] xl:w-[450px]"
  >
    <div class="w-auto lg:w-full p-1 flex-1 flex flex-wrap pb-5">
      <div class="flex flex-row items-center w-full ml-2 pb-2 p-3">
        <span class="font-bold text-white text-2xl"> Dividends </span>
        <span class="text-white font-semibold ml-auto text-[1rem]">
          Dividend Yield {dividendYield ?? "0"}%
        </span>
      </div>

      {#if dividendList?.history?.at(0)?.length !== 0}
        <div class="flex justify-start items-center w-full m-auto pl-2">
          <table
            class="table lg:table-sm table-compact mt-3 text-start flex justify-start items-center w-full px-3 m-auto"
          >
            <thead>
              <tr>
                <th
                  class="text-white font-semibold text-sm text-start bg-[#000] lg:bg-default"
                  >Ex-Dividend</th
                >
                <th
                  class="text-white font-semibold text-sm text-end bg-[#000] lg:bg-default"
                  >Payment Date</th
                >
                <th
                  class="text-white font-semibold text-sm text-end bg-[#000] lg:bg-default"
                  >Amount</th
                >
              </tr>
            </thead>

            <tbody>
              {#each dividendHistoryList?.slice(0, 5) as item}
                <tr
                  class="text-white bg-[#000] lg:bg-default border-b border-[#000] lg:border-[#27272A]"
                >
                  <td class="text-start text-sm text-white">
                    {new Date(item?.date)?.toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      daySuffix: "2-digit",
                    })}
                  </td>

                  <td class="text-end text-sm text-white">
                    {item?.paymentDate?.length !== 0
                      ? new Date(item?.paymentDate)?.toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          daySuffix: "2-digit",
                        })
                      : "n/a"}
                  </td>

                  <td class="text-end text-sm text-white">
                    ${item?.adjDividend?.toFixed(2)}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <label
          for="dividendModal"
          on:click={() => goto(`/etf/${$etfTicker}/dividends`)}
          class="rounded cursor-pointer w-11/12 md:w-3/4 lg:w-11/12 py-2 h-full mt-8 lg:mt-6 text-[1rem] text-center font-semibold text-black m-auto sm:hover:bg-gray-300 bg-[#fff] transition duration-100 ease-in"
        >
          Dividend History
        </label>
      {:else}
        <h2
          class="mt-20 justify-center items-center text-3xl text-slate-700 mb-20 m-auto"
        >
          No data available
          <svg
            class="w-10 lg:w-12 inline-block"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            ><path
              fill="#334155"
              d="M18.68 12.32a4.49 4.49 0 0 0-6.36.01a4.49 4.49 0 0 0 0 6.36a4.508 4.508 0 0 0 5.57.63L21 22.39L22.39 21l-3.09-3.11c1.13-1.77.87-4.09-.62-5.57m-1.41 4.95c-.98.98-2.56.97-3.54 0c-.97-.98-.97-2.56.01-3.54c.97-.97 2.55-.97 3.53 0c.97.98.97 2.56 0 3.54M10.9 20.1a6.527 6.527 0 0 1-1.48-2.32C6.27 17.25 4 15.76 4 14v3c0 2.21 3.58 4 8 4c-.4-.26-.77-.56-1.1-.9M4 9v3c0 1.68 2.07 3.12 5 3.7v-.2c0-.93.2-1.85.58-2.69C6.34 12.3 4 10.79 4 9m8-6C7.58 3 4 4.79 4 7c0 2 3 3.68 6.85 4h.05c1.2-1.26 2.86-2 4.6-2c.91 0 1.81.19 2.64.56A3.215 3.215 0 0 0 20 7c0-2.21-3.58-4-8-4Z"
            /></svg
          >
        </h2>
      {/if}
    </div>
  </div>
</div>
<!--End Similar Stocks Card -->

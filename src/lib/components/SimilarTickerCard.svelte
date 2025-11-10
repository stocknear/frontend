<script lang="ts">
  import { similarTickerClicked, screenWidth } from "$lib/store";
  import { goto } from "$app/navigation";
  import { abbreviateNumber } from "$lib/utils";

  export let similarstock;

  async function stockSelector(symbol) {
    window?.scroll({ top: 0, left: 0, behavior: "smooth" });
    //stockTicker.update(value => symbol);
    $similarTickerClicked = true;
    goto("/stocks/" + symbol);
  }
</script>

<!--Start Similar Stocks Card -->

<div
  class="space-y-3 sm:pt-5 hidden lg:block lg:{similarstock?.length !== 0
    ? ''
    : 'hidden'}"
>
  <div
    class="sm:rounded shadow-lg bg-[#000] sm:bg-default sm:border sm:border-gray-600 h-auto {$screenWidth <
    640
      ? 'w-screen pt-16'
      : ''} md:w-[420px] xl:w-[450px]"
  >
    <div
      class="w-auto lg:w-full p-1 flex flex-col m-auto pb-14 sm:pb-10 px-2 sm:px-0"
    >
      <h2 class="text-start text-2xl font-semibold text-white p-3 mt-3 ml-1">
        Similar Stocks
      </h2>
      {#if similarstock?.length !== 0}
        <div class="flex justify-start items-center w-full m-auto">
          <table
            class="table table-sm table-compact mt-3 text-start flex justify-start items-center w-full px-3 m-auto"
          >
            <thead>
              <tr>
                <th
                  class="text-white font-semibold text-sm text-start bg-[#000] sm:bg-default"
                  >Company</th
                >
                <th
                  class="text-white font-semibold text-sm text-end bg-[#000] sm:bg-default"
                  >Market Cap</th
                >
                <th
                  class="text-white font-semibold text-sm text-end bg-[#000] sm:bg-default"
                  >Avg Volume</th
                >
              </tr>
            </thead>
            <tbody>
              {#each similarstock as item, index}
                <tr
                  on:click={() => stockSelector(item?.symbol)}
                  class="shake-ticker sm:hover:text-white text-blue-400 cursor-pointer sm:hover:bg-[#245073]/10 bg-[#000] sm:bg-default border-b border-[#000] sm:border-[#27272A]"
                >
                  {#if index <= 6}
                    <td class="whitespace-nowrap">
                      <div class="flex flex-row items-center">
                        <div
                          class="rounded-full w-10 h-10 relative flex items-center justify-center"
                        >
                          <img
                            style="clip-path: circle(50%);"
                            class="w-6 h-6 rounded-full"
                            src={`https://financialmodelingprep.com/image-stock/${item?.symbol}.png`}
                            loading="lazy"
                          />
                        </div>
                        <div class="flex flex-col ml-3 w-full">
                          <span class="text-sm sm:text-[1rem]"
                            >{item?.symbol}</span
                          >
                          <span class="text-white text-sm">
                            {#if typeof item?.name !== "undefined"}
                              {item?.name?.length > 15
                                ? item?.name?.slice(0, 15) + "..."
                                : item?.name}
                            {:else}
                              n/a
                            {/if}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td class="text-white text-end text-sm sm:text-[1rem]">
                      {item?.marketCap !== null
                        ? abbreviateNumber(item?.marketCap)
                        : "-"}
                    </td>

                    <td class="text-white text-sm sm:text-[1rem] text-end">
                      {item?.avgVolume !== null
                        ? abbreviateNumber(item?.avgVolume)
                        : "-"}
                    </td>
                  {/if}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div
          class=" mt-20 flex justify-center items-center text-2xl font-bold text-slate-700 mb-20 m-auto"
        >
          No data available
        </div>
      {/if}
    </div>
  </div>
</div>
<!--End Similar Stocks Card -->

<!--Start Mobile Similar Ticker Card-->
<div class="lg:hidden space-y-3 sm:pt-5">
  <div class="bg-[#000] h-auto w-screen">
    <!--Start Header-->
    <div class="w-full p-1 flex flex-col items-center pb-5 h-auto">
      <h2 class="text-center m-auto text-lg font-semibold text-white mt-5">
        Similar Ticker
      </h2>
      <div class="flex flex-col items-center mt-10 mb-5 w-full px-8">
        <span class="text-white text-center text-md">
          Identify trends in similar assets and explore superior competing
          options in your portfolio.
        </span>
      </div>
    </div>
    <!--End Header-->

    {#if similarstock?.length !== 0}
      <div
        class="flex justify-start items-center w-full m-auto mt-10 overflow-x-auto"
      >
        <table
          class="table table-sm table-compact mt-3 text-start flex justify-start items-center w-full px-3 m-auto"
        >
          <thead>
            <tr>
              <th class="text-white font-semibold text-sm text-start bg-[#000]"
                >Company</th
              >
              <th class="text-white font-semibold text-sm text-end bg-[#000]"
                >Market Cap</th
              >
              <th class="text-white font-semibold text-sm text-end bg-[#000]"
                >Avg Volume</th
              >
            </tr>
          </thead>
          <tbody>
            {#each similarstock as item, index}
              <tr
                on:click={() => stockSelector(item?.symbol)}
                class="text-white cursor-pointer bg-[#000] border-b border-[#000]"
              >
                {#if index <= 6}
                  <td class="text-white whitespace-nowrap">
                    <div class="flex flex-row items-center">
                      <div class="flex flex-col w-full">
                        <span class="text-blue-400 text-sm">{item?.symbol}</span
                        >
                        <span class="text-white text-sm">
                          {#if typeof item?.name !== "undefined"}
                            {item?.name?.length > 20
                              ? item?.name?.slice(0, 20) + "..."
                              : item?.name}
                          {:else}
                            n/a
                          {/if}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td class="text-white text-end font-semibold text-sm">
                    {item?.marketCap !== null
                      ? abbreviateNumber(item?.marketCap, true)
                      : "-"}
                  </td>

                  <td class="text-white font-semibold text-end text-sm">
                    {item?.avgVolume !== null
                      ? abbreviateNumber(item?.avgVolume)
                      : "-"}
                  </td>
                {/if}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <div
        class=" mt-20 flex justify-center items-center text-2xl font-bold text-slate-700 mb-20 m-auto"
      >
        No data available
      </div>
    {/if}
  </div>
</div>
<!--End Mobile Similar Ticker Card-->

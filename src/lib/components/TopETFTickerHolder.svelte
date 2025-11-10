<script lang="ts">
  import { stockTicker, screenWidth } from "$lib/store";
  import { goto } from "$app/navigation";
  import { abbreviateNumber } from "$lib/utils";

  export let topETFHolder;

  async function etfSelector(state) {
    //window?.scroll({ top: 0, left: 0, behavior: 'smooth' });
    goto("/etf/" + state + "/");
  }
</script>

<!--Start ETF Holder Card -->

<div
  class="space-y-3 sm:pt-5 hidden lg:block lg:{topETFHolder?.length !== 0
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
        Top ETFs Holder
      </h2>
      <p class="text-white mb-5 ml-4 mr-1">
        ETFs with the largest estimated holdings in {$stockTicker}.
      </p>

      {#if topETFHolder?.length !== 0}
        <div class="flex justify-start items-center w-full m-auto">
          <table
            class="table table-sm table-compact text-start flex justify-start items-center w-full px-3 m-auto"
          >
            <thead>
              <tr>
                <th
                  class="text-white font-semibold text-sm text-start bg-[#000] sm:bg-default"
                  >Company Name</th
                >
                <th
                  class="text-white font-semibold text-sm text-end bg-[#000] sm:bg-default"
                  >Total Assets</th
                >
                <th
                  class="text-white font-semibold text-sm text-end bg-[#000] sm:bg-default"
                  >% of Fund</th
                >
              </tr>
            </thead>
            <tbody>
              {#each topETFHolder as item, index}
                <tr
                  class="sm:hover:text-white text-blue-400 sm:hover:bg-[#245073]/10 bg-[#000] sm:bg-default border-b border-[#000] sm:border-[#27272A]"
                >
                  {#if index <= 6}
                    <td>
                      <label
                        on:click={() => goto("/etf/" + item?.symbol)}
                        class="flex flex-row items-center cursor-pointer"
                      >
                        <div class="flex flex-col w-full">
                          <span class="text-sm sm:text-[1rem]"
                            >{item?.symbol}</span
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
                      </label>
                    </td>

                    <td class="text-white text-end text-sm sm:text-[1rem]">
                      {item?.totalAssets !== null
                        ? abbreviateNumber(item?.totalAssets)
                        : "-"}
                    </td>

                    <td class="text-white text-end text-sm sm:text-[1rem]">
                      {item?.weightPercentage !== null
                        ? item?.weightPercentage?.toFixed(2)
                        : "-"}%
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
<!--End ETF Holder Card -->

<!--Start Mobile ETF Holder Card-->
<div class="lg:hidden space-y-3 sm:pt-5">
  <div class="bg-[#000] h-auto w-screen">
    <!--Start Header-->
    <div class="w-full p-1 flex flex-col items-center pb-5 h-auto">
      <h2 class="text-center m-auto text-lg font-semibold text-white mt-5">
        Top ETFs Holder
      </h2>
      <div class="flex flex-col items-center mt-10 mb-5 w-full px-8">
        <span class="text-white text-center text-md">
          Find the ETFs with the highest portfolio weights for this stock.
        </span>
      </div>
    </div>
    <!--End Header-->

    {#if topETFHolder?.length !== 0}
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
                >Total Assets</th
              >
              <th class="text-white font-semibold text-sm text-end bg-[#000]"
                >% of Fund</th
              >
            </tr>
          </thead>
          <tbody>
            {#each topETFHolder as item, index}
              <tr
                on:click={() => etfSelector(item?.symbol)}
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

                  <td class="text-white text-end font-semibold">
                    {item?.totalAssets !== null
                      ? abbreviateNumber(item?.totalAssets)
                      : "-"}
                  </td>

                  <td class="text-white font-semibold text-end">
                    {item?.weightPercentage !== null
                      ? abbreviateNumber(item?.weightPercentage)?.toFixed(2)
                      : "-"}%
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
<!--End Mobile ETF Holder Card-->

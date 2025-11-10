<script lang="ts">
  import { etfTicker, similarTickerClicked, screenWidth } from "$lib/store";
  import { goto } from "$app/navigation";
  import { abbreviateNumber } from "$lib/utils";

  export let similarTicker;

  async function etfSelector(state) {
    window?.scroll({ top: 0, left: 0, behavior: "smooth" });
    etfTicker.update((value) => state);
    $similarTickerClicked = true;
    goto("/etf/" + state + "/");
  }
</script>

<!--Start Similar Stocks Card -->

<div
  class="space-y-3 sm:pt-5 hidden lg:block sm:{similarTicker?.length !== 0
    ? ''
    : 'hidden'}"
>
  <div
    class="sm:rounded shadow-lg bg-[#000] sm:bg-default sm:border sm:border-gray-600 h-auto {$screenWidth <
    640
      ? 'w-screen pt-16'
      : ''} md:w-[420px] xl:w-[450px]"
  >
    <div class="w-auto lg:w-full p-1 flex-1 flex flex-wrap pb-5">
      <h2 class="text-start ml-2 text-2xl font-bold text-white pb-2 p-3">
        Similar ETFs
      </h2>
      {#if similarTicker?.length !== 0}
        <div class="flex justify-start items-center w-full m-auto pl-2">
          <table
            class="table table-sm table-compact mt-3 text-start flex justify-start items-center w-full px-3 m-auto"
          >
            <thead>
              <tr>
                <th
                  class="text-white font-semibold text-sm text-start bg-[#000] sm:bg-default"
                  >Fund Name</th
                >
                <th
                  class="text-white font-semibold text-sm text-end bg-[#000] sm:bg-default"
                  >Total Assets</th
                >
                <th
                  class="text-white font-semibold text-sm text-end bg-[#000] sm:bg-default"
                  >Holdings</th
                >
              </tr>
            </thead>
            <tbody>
              {#each similarTicker as item, index}
                <tr
                  on:click={() => etfSelector(item?.symbol)}
                  class="shake-ticker sm:hover:text-white text-blue-400 cursor-pointer sm:hover:bg-[#245073]/10 bg-[#000] sm:bg-default border-b border-[#000] sm:border-[#27272A]"
                >
                  {#if index <= 6}
                    <td class="">
                      <div class="flex flex-row items-center">
                        <div
                          class="rounded-full w-10 h-10 relative flex items-center justify-center"
                        >
                          <img
                            style="clip-path: circle(50%);"
                            class="w-6 h-6 rounded-full"
                            src={`https://financialmodelingprep.com/image-stock/${item.symbol}.png`}
                            loading="lazy"
                          />
                        </div>
                        <div class="flex flex-col ml-3 w-full">
                          <span class="text-sm">{item?.symbol}</span>
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
                        ? abbreviateNumber(item?.totalAssets, true)
                        : "-"}
                    </td>

                    <td class="text-white font-semibold text-end">
                      {abbreviateNumber(item?.numberOfHoldings)}
                    </td>
                  {/if}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <h2
          class=" mt-20 justify-center items-center text-3xl font-bold text-slate-700 mb-20 m-auto"
        >
          No data available
          <svg
            class="w-10 sm:w-12 inline-block"
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

<!--Start Mobile Similar Ticker Card-->
<div class="lg:hidden space-y-3 sm:pt-5">
  <div class="bg-[#000] h-auto w-screen">
    <!--Start Header-->
    <div
      class="bg-default w-full p-1 flex flex-col items-center pb-5 h-auto rounded-b-[30px]"
    >
      <h2 class="text-center m-auto text-[1.1rem] text-white mt-5">
        Similar Ticker
      </h2>
      <div class="flex flex-col items-center mt-10 w-full">
        <span
          class="text-white text-center text-md text-opacity-[0.8] pl-8 pr-8"
        >
          Identify trends in similar assets and explore superior competing
          options in your portfolio.
        </span>

        <div
          class="flex flex-row justify-center items-center w-full mt-5"
        ></div>
      </div>
    </div>
    <!--End Header-->

    {#if similarTicker?.length !== 0}
      <div
        class="flex justify-start items-center w-full m-auto pl-2 mt-10 overflow-x-auto"
      >
        <table
          class="table table-sm table-compact mt-3 text-start flex justify-start items-center w-full px-3 m-auto"
        >
          <thead>
            <tr class="border-b border-blue-400">
              <th
                class="text-white font-bold text-sm text-start bg-[#000] border-b border-blue-400"
                >Company</th
              >
              <th
                class="text-white font-bold text-sm text-end bg-[#000] border-b border-blue-400"
                >Market Cap</th
              >
              <th
                class="text-white font-bold text-sm text-end bg-[#000] border-b border-blue-400"
                >Change</th
              >
            </tr>
          </thead>
          <tbody>
            {#each similarTicker as item, index}
              <tr
                on:click={() => etfSelector(item?.symbol)}
                class="shake-ticker text-white cursor-pointer border-b border-[#000]"
              >
                {#if index <= 6}
                  <td class="text-gray-200 whitespace-nowrap">
                    <div class="flex flex-row items-center">
                      <div
                        class="rounded-full w-10 h-10 relative flex items-center justify-center"
                      >
                        <img
                          style="clip-path: circle(50%);"
                          class="w-6 h-6 rounded-full"
                          src={`https://financialmodelingprep.com/image-stock/${item.symbol}.png`}
                          loading="lazy"
                        />
                      </div>
                      <div class="flex flex-col ml-3 w-full">
                        <span class="text-blue-400 text-sm">{item?.symbol}</span
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

                  <td class="text-white text-end font-semibold">
                    {item?.totalAssets !== null
                      ? abbreviateNumber(item?.totalAssets, true)
                      : "-"}
                  </td>

                  <td class="text-white font-semibold text-end">
                    {abbreviateNumber(item?.numberOfHoldings)}
                  </td>
                {/if}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <h2
        class="mt-20 flex justify-center items-center text-3xl font-bold text-slate-700 mb-20 m-auto"
      >
        No data available
        <svg
          class="w-10 sm:w-12 inline-block"
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
<!--End Mobile Similar Ticker Card-->

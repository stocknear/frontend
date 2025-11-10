<script lang="ts">
  export let data;

  export let displayCompanyName;
  export let charNumber;
  export let ticker;
  export let prePostData;
  export let displayLegend;
  export let isOpen;
</script>

<div class="flex items-center w-full mt-5 sm:mt-10">
  <div class="flex flex-row justify-start w-full items-center">
    <div class="flex flex-col items-start w-full">
      <div
        class="flex flex-row justify-between items-center w-full sm:-mt-[50px] mb-5 sm:mb-10"
      >
        <div class="flex flex-col items-start">
          <h1 class="text-xl sm:text-2xl font-bold">
            {displayCompanyName
              ? displayCompanyName?.length > charNumber
                ? displayCompanyName?.slice(0, charNumber) + "..."
                : displayCompanyName
              : "n/a"}
            <span class="hidden sm:inline-block">({ticker?.toUpperCase()})</span
            >
          </h1>

          <div class="mt-[1px] text-xs text-gray-800 dark:text-gray-300">
            {data?.getStockQuote?.exchange}: {ticker?.toUpperCase()}
            · Real-Time Price · USD
          </div>
        </div>
      </div>

      <div
        class="-mt-3.5 sm:-mt-7 mb-3 flex flex-row items-end space-x-2 xs:space-x-3 sm:space-x-5 divide-x sm:divide-none divide-gray-300 dark:divide-gray-600"
      >
        <div class="w-full max-w-[50%] whitespace-nowrap pr-5">
          <div
            class="text-3xl sm:text-4xl font-bold {Object?.keys(prePostData)
              ?.length === 0
              ? 'inline'
              : 'block sm:inline'}"
          >
            {displayLegend?.close ?? "n/a"}
          </div>
          <div
            class="font-semibold {Object?.keys(prePostData)?.length === 0
              ? 'inline'
              : 'block sm:inline'} text-xl sm:text-2xl"
          >
            <span
              class={displayLegend?.change >= 0
                ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
                : displayLegend?.change < 0
                  ? "text-red-800 dark:text-[#FF2F1F]"
                  : ""}
            >
              {displayLegend?.change ?? "n/a"}
            </span>
            <span
              class={displayLegend?.changesPercentage >= 0
                ? "text-green-800 dark:text-[#00FC50]"
                : displayLegend?.changesPercentage < 0
                  ? "text-red-800 dark:text-[#FF2F1F]"
                  : ""}
            >
              ({displayLegend?.changesPercentage
                ? displayLegend?.changesPercentage + "%"
                : "n/a"})
            </span>
          </div>
          <div class="mt-0.5 text-[0.85rem] sm:text-sm">
            {#if !isOpen}
              <span class="block font-semibold sm:inline mb-0.5 sm:mb-0"
                >At close:</span
              >
            {/if}
            {displayLegend?.date}
            {#if isOpen}
              <span
                class="{Object?.keys(prePostData)?.length !== 0
                  ? 'block sm:inline'
                  : 'inline'} mb-0.5 sm:mb-0">- Market open</span
              >
            {/if}
          </div>
        </div>
        {#if Object?.keys(prePostData)?.length > 0 && !isOpen}
          <div class="pl-5">
            <div
              class="block text-2xl sm:text-[1.7rem] font-semibold leading-5 sm:inline"
            >
              {prePostData?.price?.toFixed(2)}
            </div>
            <div
              class="mt-1.5 block sm:mt-0 sm:inline text-lg {prePostData?.changesPercentage >=
              0
                ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
                : 'text-red-800 dark:text-[#FF2F1F]'}"
            >
              {prePostData?.changesPercentage?.toFixed(2)}%
            </div>
            <div class="mt-1 text-xs sm:text-[0.8rem] sm:flex">
              <span class="flex items-center">
                {#if prePostData?.time?.includes("AM")}
                  <svg
                    class="h-4 w-4 inline text-yellow-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    style="max-width:40px"
                    ><path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    ></path></svg
                  >
                {:else}
                  <svg
                    class="h-4 w-4 inline text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    style="max-width:40px"
                    ><path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    ></path></svg
                  >
                {/if}
                <span
                  class="ml-0.5 whitespace-nowrap font-semibold md:ml-1 mb-0.5 sm:mb-0"
                  >{prePostData?.time?.includes("AM")
                    ? "Pre-market"
                    : "After-hours"}:</span
                ></span
              >
              <span class="sm:ml-1 whitespace-nowrap">{prePostData?.time}</span>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

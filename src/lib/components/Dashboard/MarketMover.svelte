<script lang="ts">
  import Infobox from "$lib/components/Infobox.svelte";
  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";

  export let marketStatus = 0;
  export let gainersList = [];
  export let losersList = [];
  export let charNumber = 30;
</script>

<section
  class="mx-auto flex flex-col space-y-6 px-3 xs:px-4 sm:px-5 lg:max-w-[1200px] lg:flex-row lg:justify-evenly lg:space-x-10 lg:space-y-0 xl:space-x-12 xxxl:space-x-14"
>
  <div class="grow">
    <div class="mb-1 flex flex-row items-end justify-between">
      <a
        class="flex items-center"
        href={`/market-mover/${marketStatus === 0 ? "gainers" : marketStatus === 1 ? "premarket/gainers" : "afterhours/gainers"}`}
        ><h2
          class="mb-0.5 text-xl font-bold leading-tight sm:text-2xl bp:leading-tight md:mb-1 sm:hover:underline sm:hover:underline-offset-4"
        >
          {marketStatus === 0
            ? "Top"
            : marketStatus === 1
              ? "Pre-Market"
              : "Afterhours"} Gainers
        </h2>
        <svg
          class="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          style="max-width:40px"
          aria-hidden="true"
          ><path
            fill-rule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clip-rule="evenodd"
          ></path></svg
        ></a
      >
    </div>
    {#if gainersList?.length > 0}
      <table
        class="w-full border border-gray-300 dark:border-gray-800 text-left text-sm sm:text-[1rem]"
      >
        <thead
          ><tr
            ><th
              class="border border-gray-300 dark:border-gray-800 py-1.5 px-3 sm:py-2 xl:px-3.5 xxxl:px-4"
              >Symbol</th
            >
            <th
              class=" border border-gray-300 dark:border-gray-800 py-1.5 px-3 sm:py-2 lg:max-w-[210px] lg:truncate xl:px-3.5 xxxl:max-w-[250px] xxxl:px-4"
              >Name</th
            >
            <th
              class="border border-gray-300 dark:border-gray-800 py-1.5 text-right px-3 sm:py-2 xl:px-3.5 xxxl:px-4"
              >Price</th
            >
            <th
              class="border border-gray-300 dark:border-gray-800 py-1.5 text-right px-3 sm:py-2 xl:px-3.5 xxxl:px-4"
              >Change</th
            ></tr
          ></thead
        >
        <tbody>
          {#each gainersList as item}
            <tr
              ><td
                class="border border-gray-300 dark:border-gray-800 py-1.5 px-3 sm:py-2 xl:px-3.5 xxxl:px-4"
              >
                <a
                  href={`/stocks/${item?.symbol}`}
                  class="text-blue-800 dark:text-blue-400 sm:hover:text-muted dark:sm:hover:text-white cursor-pointer"
                  >{item?.symbol}</a
                ></td
              >
              <td
                class=" border border-gray-300 dark:border-gray-800 py-1.5 px-3 sm:py-2 lg:max-w-[210px] lg:truncate xl:px-3.5 xxxl:max-w-[250px] xxxl:px-4"
                >{removeCompanyStrings(item?.name)?.length > charNumber
                  ? removeCompanyStrings(item?.name)?.slice(0, charNumber) +
                    "..."
                  : removeCompanyStrings(item?.name)}</td
              >
              <td
                class="border border-gray-300 dark:border-gray-800 py-1.5 text-right px-3 sm:py-2 xl:px-3.5 xxxl:px-4"
                >${item?.price?.toFixed(2)}</td
              >
              <td
                class="border border-gray-300 dark:border-gray-800 py-1.5 text-right text-red-default px-3 sm:py-2 xl:px-3.5 xxxl:px-4"
              >
                {#if item?.changesPercentage >= 0}
                  <span class="text-green-800 dark:text-[#00FC50]"
                    >+{item?.changesPercentage >= 1000
                      ? abbreviateNumber(item?.changesPercentage)
                      : item?.changesPercentage?.toFixed(2)}%</span
                  >
                {:else}
                  <span class="text-red-800 dark:text-[#FF2F1F]"
                    >{item?.changesPercentage <= -1000
                      ? abbreviateNumber(item?.changesPercentage)
                      : item?.changesPercentage?.toFixed(2)}%
                  </span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <Infobox text="Currently, no market gainers data is available." />
    {/if}
  </div>
  <div class="grow">
    <div class="mb-1 flex flex-row items-end justify-between">
      <a
        class="flex items-center"
        href={`/market-mover/${marketStatus === 0 ? "losers" : marketStatus === 1 ? "premarket/losers" : "afterhours/losers"}`}
        ><h2
          class="mb-0.5 text-xl font-bold leading-tight sm:text-2xl bp:leading-tight md:mb-1 sm:hover:underline sm:hover:underline-offset-4"
        >
          {marketStatus === 0
            ? "Top"
            : marketStatus === 1
              ? "Pre-Market"
              : "Afterhours"} Losers
        </h2>
        <svg
          class="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          style="max-width:40px"
          aria-hidden="true"
          ><path
            fill-rule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clip-rule="evenodd"
          ></path></svg
        ></a
      >
    </div>
    {#if losersList?.length > 0}
      <table
        class="w-full border border-gray-300 dark:border-gray-800 text-left text-sm sm:text-[1rem]"
      >
        <thead
          ><tr
            ><th
              class="border border-gray-300 dark:border-gray-800 py-1.5 px-3 sm:py-2 xl:px-3.5 xxxl:px-4"
              >Symbol</th
            >
            <th
              class=" border border-gray-300 dark:border-gray-800 py-1.5 px-3 sm:py-2 lg:max-w-[210px] lg:truncate xl:px-3.5 xxxl:max-w-[250px] xxxl:px-4"
              >Name</th
            >
            <th
              class="border border-gray-300 dark:border-gray-800 py-1.5 text-right px-3 sm:py-2 xl:px-3.5 xxxl:px-4"
              >Price</th
            >
            <th
              class="border border-gray-300 dark:border-gray-800 py-1.5 text-right px-3 sm:py-2 xl:px-3.5 xxxl:px-4"
              >Change</th
            ></tr
          ></thead
        >
        <tbody>
          {#each losersList as item}
            <tr
              ><td
                class="border border-gray-300 dark:border-gray-800 py-1.5 px-3 sm:py-2 xl:px-3.5 xxxl:px-4"
              >
                <a
                  href={`/stocks/${item?.symbol}`}
                  class="text-blue-800 dark:text-blue-400 sm:hover:text-muted dark:sm:hover:text-white cursor-pointer"
                  >{item?.symbol}</a
                ></td
              >
              <td
                class=" border border-gray-300 dark:border-gray-800 py-1.5 px-3 sm:py-2 lg:max-w-[210px] lg:truncate xl:px-3.5 xxxl:max-w-[250px] xxxl:px-4"
                >{removeCompanyStrings(item?.name)?.length > charNumber
                  ? removeCompanyStrings(item?.name)?.slice(0, charNumber) +
                    "..."
                  : removeCompanyStrings(item?.name)}</td
              >
              <td
                class="border border-gray-300 dark:border-gray-800 py-1.5 text-right px-3 sm:py-2 xl:px-3.5 xxxl:px-4"
                >${item?.price ? item?.price?.toFixed(2) : item?.price}</td
              >
              <td
                class="border border-gray-300 dark:border-gray-800 py-1.5 text-right text-red-default px-3 sm:py-2 xl:px-3.5 xxxl:px-4"
              >
                {#if item?.changesPercentage >= 0}
                  <span class="text-green-800 dark:text-[#00FC50]"
                    >+{item?.changesPercentage >= 1000
                      ? abbreviateNumber(item?.changesPercentage)
                      : item?.changesPercentage?.toFixed(2)}%</span
                  >
                {:else}
                  <span class="text-red-800 dark:text-[#FF2F1F]"
                    >{item?.changesPercentage <= -1000
                      ? abbreviateNumber(item?.changesPercentage)
                      : item?.changesPercentage?.toFixed(2)}%
                  </span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <Infobox text="Currently, no market loser data is available." />
    {/if}
  </div>
</section>

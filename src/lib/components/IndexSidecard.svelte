<script lang="ts">
  import { indexTicker } from "$lib/store";
  import { abbreviateNumber, sectorNavigation } from "$lib/utils";

  import {
    index_sidecard_about,
    index_sidecard_top_sectors,
    index_sidecard_sector,
    index_sidecard_weight_percent,
    index_sidecard_view_all_sectors,
  } from "$lib/paraglide/messages";

  export let data;

  let info;
  let topSectorList = [];
  let description = "";

  $: {
    if ($indexTicker) {
      info = data?.getIndexProfile?.at(0);
      topSectorList = data?.getIndexSectorWeighting || [];

      description =
        info?.description ??
        "A detailed description of the company is not yet available.";
    }
  }
</script>

<div class="px-0.5 lg:px-0 text-gray-700 dark:text-zinc-200">
  <h2
    class="mb-2 text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
  >
    {index_sidecard_about({ ticker: $indexTicker })}
  </h2>
  <p class="text-sm text-gray-800 dark:text-zinc-300">
    {description}
  </p>
</div>

{#if topSectorList?.length !== 0}
  <div class="space-y-3 pt-5 {topSectorList?.length !== 0 ? '' : 'hidden'}">
    <div class="h-auto w-full">
      <!--Start Content-->
      <div class="w-auto lg:w-full flex flex-col m-auto">
        <h2 class="mb-2 text-xl sm:text-2xl flex flex-row items-center">
          <span
            class="font-semibold tracking-tight text-gray-900 dark:text-white"
            >{index_sidecard_top_sectors()}</span
          >
        </h2>

        <div class="mt-2 w-full overflow-hidden">
          <table class="w-full">
            <thead>
              <tr
                class="border-y border-gray-300 dark:border-zinc-700 text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
              >
                <th class="px-1 py-1.5 text-left xs:px-2 font-semibold"
                  >{index_sidecard_sector()}</th
                >

                <th class="px-1 py-1.5 text-right xs:px-2 font-semibold"
                  >{index_sidecard_weight_percent()}</th
                >
              </tr>
            </thead>
            <tbody>
              {#each topSectorList?.slice(0, 5) as item}
                {#if item?.weightPercentage > 0}
                  <tr
                    class="border-b border-gray-300 dark:border-zinc-700 text-sm text-gray-600 dark:text-zinc-300"
                  >
                    <td class="px-1 py-1.5 text-left xs:px-2">
                      <a
                        href={sectorNavigation?.find(
                          (listItem) => listItem?.title === item?.sector,
                        )?.link}
                        class="hover:text-violet-600 dark:hover:text-violet-400 underline underline-offset-4 truncate"
                      >
                        {item?.sector}
                      </a>
                    </td>

                    <td class="px-1 py-1.5 text-right xs:px-2">
                      {abbreviateNumber(item?.weightPercentage?.toFixed(2))}%
                    </td>
                  </tr>
                {/if}
              {/each}
            </tbody>
          </table>
        </div>

        <a
          href={`/index/${$indexTicker}/holdings`}
          class="inline-flex justify-center items-center rounded-full cursor-pointer w-full py-2 mt-3 text-sm text-center font-semibold text-white dark:text-gray-900 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 transition duration-100"
        >
          {index_sidecard_view_all_sectors()}
        </a>
      </div>
    </div>
  </div>
{/if}

<script lang="ts">
  import { indexTicker } from "$lib/store";
  import { abbreviateNumber, sectorNavigation } from "$lib/utils";

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

<div class="px-0.5 lg:px-0">
  <h2 class="mb-2 text-2xl font-bold">
    About {$indexTicker}
  </h2>
  <p>
    {description}
  </p>
</div>

{#if topSectorList?.length !== 0}
  <div
    class="space-y-3 pt-5 text-muted dark:text-white {topSectorList?.length !==
    0
      ? ''
      : 'hidden'}"
  >
    <div class="h-auto w-full">
      <!--Start Content-->
      <div class="w-auto lg:w-full flex flex-col m-auto">
        <h2 class="mb-2 text-2xl flex flex-row items-center">
          <span class="font-bold">Top 5 Sectors</span>
        </h2>

        <div class="mt-2 w-full overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="border-y border-gray-300 dark:border-gray-800">
                <th class="px-1 py-1.5 text-left xs:px-2">Sector</th>

                <th class="px-1 py-1.5 text-right xs:px-2">Weight %</th>
              </tr>
            </thead>
            <tbody>
              {#each topSectorList?.slice(0, 5) as item}
                {#if item?.weightPercentage > 0}
                  <tr class=" border-b border-gray-300 dark:border-gray-800">
                    <td class="px-1 py-1.5 text-left xs:px-2">
                      <a
                        href={sectorNavigation?.find(
                          (listItem) => listItem?.title === item?.sector,
                        )?.link}
                        class="sm:hover:underline sm:hover:underline-offset-4 truncate"
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
          class="flex justify-center items-center rounded cursor-pointer w-full py-2 mt-3 text-[1rem] text-center font-semibold text-white dark:text-black m-auto sm:hover:bg-muted dark:sm:hover:bg-gray-300 bg-black dark:bg-[#fff] transition duration-100"
        >
          View All Sectors
        </a>
      </div>
    </div>
  </div>
{/if}

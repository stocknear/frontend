<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import { displayCompanyName, stockTicker } from "$lib/store";
  import { createEventDispatcher } from "svelte";

  export let data;
  export let title = "";
  export let metrics = [];
  export let showGrowth = true;
  export let first = false;
  export let selectedTimePeriod = "ttm";

  const dispatch = createEventDispatcher();
  const isSubscribed = ["Pro", "Plus"]?.includes(data?.user?.tier);
  const limit = 6;
  const MAX_DATES = 12; // Limit to 12 most recent periods

  let tabs = ["Quarterly", "TTM"];

  $: activeIdx = selectedTimePeriod === "quarterly" ? 0 : 1;

  function handleTabClick(index: number) {
    const period = index === 0 ? "quarterly" : "ttm";
    dispatch("periodChange", period);
  }

  // Pre-compute everything in one reactive block
  let tableData = { dates: [], formattedDates: [], rows: [] };

  $: {
    if (!metrics || metrics.length === 0) {
      tableData = { dates: [], formattedDates: [], rows: [] };
    } else {
      // Collect all dates
      const dateSet = new Set();
      for (const metric of metrics) {
        for (const v of metric.values) {
          dateSet.add(v.date);
        }
      }

      // Sort and limit to most recent
      const allDates = Array.from(dateSet).sort().reverse().slice(0, MAX_DATES);

      // Pre-format dates once
      const formattedDates = allDates.map((d) => {
        const date = new Date(d);
        return isNaN(date)
          ? "n/a"
          : date.toLocaleString("en-US", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              timeZone: "UTC",
            });
      });

      // Pre-compute all row data
      const rows = metrics.map((metric) => {
        const valueMap = new Map();
        let valueType = "NUMBER";

        // Build value map
        for (const v of metric.values) {
          valueMap.set(v.date, v.val);
          if (v.valueType) valueType = v.valueType;
        }

        // Pre-compute all cells
        const cells = allDates.map((date, i) => {
          const value = valueMap.get(date) ?? null;

          // Format value
          let formatted = "-";
          if (value !== null && value !== undefined) {
            switch (valueType) {
              case "CURRENCY":
                formatted = abbreviateNumber(value, false, true);
                break;
              case "PERCENT":
                formatted = value.toFixed(2) + "%";
                break;
              case "NUMBER":
                formatted = abbreviateNumber(value, false, false);
                break;
              default:
                formatted = value.toString();
            }
          }

          // Calculate growth
          let growth = "-";
          let growthNum = 0;
          let growthClass = "";

          if (showGrowth && i < allDates.length - 1) {
            const prevValue = valueMap.get(allDates[i + 1]) ?? null;
            if (value !== null && prevValue !== null && prevValue !== 0) {
              growthNum = ((value - prevValue) / prevValue) * 100;
              growth = (growthNum > 0 ? "+" : "") + growthNum.toFixed(2) + "%";
              growthClass =
                growthNum > 0
                  ? "text-green-800 dark:text-[#00FC50]"
                  : growthNum < 0
                    ? "text-red-800 dark:text-[#FF2F1F]"
                    : "";
            }
          }

          return {
            value,
            formatted,
            growth,
            growthClass,
            isPremium: !isSubscribed && i > limit,
          };
        });

        return {
          name: metric.name,
          cells,
        };
      });

      tableData = { dates: allDates, formattedDates, rows };
    }
  }
</script>

<section class="my-5 pb-5">
  {#if first}
    <div class="items-center lg:overflow-visible">
      <div
        class="col-span-2 flex flex-col lg:flex-row items-start sm:items-center lg:order-2 lg:grow py-1"
      >
        <h2
          class="text-start whitespace-nowrap text-xl sm:text-2xl font-bold py-1 border-b border-gray-300 dark:border-gray-800 lg:border-none w-full"
        >
          {title}
        </h2>
        <div
          class="mt-1 w-full flex flex-row lg:flex order-1 items-center ml-auto pb-1 pt-1 sm:pt-0 w-full order-0 lg:order-1"
        >
          <div class="ml-auto">
            <div class="inline-flex">
              <div class="inline-flex rounded-lg shadow-sm">
                {#each tabs as item, i (item)}
                  <button
                    on:click={() => handleTabClick(i)}
                    class="cursor-pointer px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none transition-colors duration-50
                            {i === 0 ? 'rounded-l border' : ''}
                            {i === tabs?.length - 1
                      ? 'rounded-r border-t border-r border-b'
                      : ''}
                            {i !== 0 && i !== tabs?.length - 1
                      ? 'border-t border-b'
                      : ''}
                            {activeIdx === i
                      ? 'bg-black dark:bg-white text-white dark:text-black'
                      : 'bg-white  border-gray-300 sm:hover:bg-gray-100 dark:bg-primary dark:border-gray-800'}"
                  >
                    {item}
                  </button>
                {/each}
              </div>
            </div>
          </div>

          <div class="ml-2">
            <DownloadData
              {data}
              rawData={metrics}
              title={`${$stockTicker}_metric_data`}
            />
          </div>
        </div>
      </div>
    </div>
  {:else}
    <h2 class="mt-5 text-xl font-bold mb-4">{title}</h2>
  {/if}

  <div
    class="flex justify-start items-center w-screen sm:w-full mt-2 m-auto overflow-x-auto pr-5 sm:pr-0"
  >
    <table
      class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
    >
      <thead class="bg-default text-white">
        <tr>
          <th
            class="border-b border-r border-gray-800 font-semibold text-sm text-start"
          >
            Period Ending
          </th>
          {#each tableData.formattedDates as formattedDate (formattedDate)}
            <th
              class="z-20 border-b border-r min-w-[120px] border-gray-800 font-semibold text-sm text-end"
            >
              {formattedDate}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody class="shadow">
        {#each tableData.rows as row (row.name)}
          <tr class="odd:bg-[#F6F7F8] dark:odd:bg-odd">
            <th
              class="whitespace-nowrap text-sm sm:text-[1rem] font-normal text-start border-b border-r border-gray-300 dark:border-gray-800"
            >
              {row.name}
            </th>
            {#each row.cells as cell, i}
              <td
                class="whitespace-nowrap text-sm sm:text-[1rem] text-end border-b border-r border-gray-300 dark:border-gray-800"
              >
                {#if cell.isPremium && cell.value !== null}
                  <a
                    href="/pricing"
                    class="inline-flex items-center justify-end text-sm font-semibold text-muted hover:text-default"
                  >
                    Upgrade
                    <svg
                      class="ml-1 mt-px size-3.5 text-muted"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      style="max-width:40px"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </a>
                {:else}
                  {cell.formatted}
                {/if}
              </td>
            {/each}
          </tr>
          {#if showGrowth}
            <tr>
              <td
                class="whitespace-nowrap text-sm sm:text-[1rem] font-normal text-start border-b border-r border-gray-300 dark:border-gray-800"
              >
                <span class="ml-2">{row.name} Growth</span>
              </td>
              {#each row.cells as cell, i}
                <td
                  class="text-sm sm:text-[1rem] text-end border-b border-r border-gray-300 dark:border-gray-800 {cell.growthClass}"
                >
                  {#if cell.isPremium && cell.growth !== "-"}
                    <a
                      href="/pricing"
                      class="inline-flex items-center justify-end text-sm font-semibold text-muted hover:text-default"
                    >
                      Upgrade
                      <svg
                        class="ml-1 mt-px size-3.5 text-muted"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        style="max-width:40px"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </a>
                  {:else}
                    {cell.growth}
                  {/if}
                </td>
              {/each}
            </tr>
          {/if}
        {/each}
      </tbody>
    </table>
  </div>
</section>

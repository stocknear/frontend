<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import { displayCompanyName, stockTicker } from "$lib/store";
  import { createEventDispatcher } from "svelte";

  export let data;
  export let title = "";
  export let metrics = []; // Array of metric objects from the new data structure
  export let showGrowth = true;
  export let first = false;
  export let selectedTimePeriod = "quarterly";

  const dispatch = createEventDispatcher();

  let tabs = ["Quarterly", "Annual"];

  $: activeIdx = selectedTimePeriod === "quarterly" ? 0 : 1;

  function handleTabClick(index: number) {
    const period = index === 0 ? "quarterly" : "annual";
    dispatch("periodChange", period);
  }

  const isSubscribed = ["Pro", "Plus"]?.includes(data?.user?.tier);
  const limit = 7;
  // Helper to format dates consistently.
  const formatDate = (d) => {
    const date = new Date(d);
    return isNaN(date)
      ? "n/a"
      : date.toLocaleString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        });
  };

  // Format a growth value for display.
  const formatGrowth = (current, previous) => {
    if (
      current === null ||
      current === undefined ||
      previous === null ||
      previous === undefined ||
      previous === 0
    ) {
      return "-";
    }
    const growth = ((current - previous) / previous) * 100;
    return (growth > 0 ? "+" : "") + growth?.toFixed(2) + "%";
  };

  // Format value based on valueType
  const formatValue = (value, valueType) => {
    if (value === null || value === undefined) return "-";

    switch (valueType) {
      case "CURRENCY":
        return abbreviateNumber(value, false, true);
      case "PERCENT":
        return value?.toFixed(2) + "%";
      case "NUMBER":
        return abbreviateNumber(value, false, false);
      default:
        return value.toString();
    }
  };

  // Get all unique dates from all metrics
  $: allDates = (() => {
    const dates = new Set();
    metrics.forEach((metric) => {
      metric.values.forEach((v) => dates.add(v.date));
    });
    return Array?.from(dates).sort().reverse(); // Show all available quarters
  })();

  // Get value for a specific metric and date
  const getValue = (metric, date) => {
    const item = metric.values.find((v) => v.date === date);
    return item ? item.val : null;
  };

  const getValueType = (metric) => {
    return metric.values[0]?.valueType || "NUMBER";
  };
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
                {#each tabs as item, i}
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
          {#each allDates as date}
            <th
              class="z-20 border-b border-r min-w-[120px] border-gray-800 font-semibold text-sm text-end"
            >
              {formatDate(date)}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody class="shadow">
        {#each metrics as metric}
          <tr class="odd:bg-[#F6F7F8] dark:odd:bg-odd">
            <th
              class="whitespace-nowrap text-sm sm:text-[1rem] font-normal text-start border-b border-r border-gray-300 dark:border-gray-800"
            >
              {metric?.name}
            </th>
            {#each allDates as date, index}
              {@const value = getValue(metric, date)}
              <td
                class="whitespace-nowrap text-sm sm:text-[1rem] text-end border-b border-r border-gray-300 dark:border-gray-800"
              >
                {#if isSubscribed}
                  {formatValue(value, getValueType(metric))}
                {:else if index <= limit}
                  {formatValue(value, getValueType(metric))}
                {:else}
                  <a
                    href="/pricing"
                    class="inline-flex items-center justify-end text-sm font-semibold text-muted hover:text-default"
                    >Upgrade <!--[--><!----><svg
                      class="ml-1 mt-px size-3.5 text-muted"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      style="max-width:40px"
                      ><path
                        fill-rule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clip-rule="evenodd"
                      ></path></svg
                    >
                  </a>
                {/if}
              </td>
            {/each}
          </tr>
          {#if showGrowth}
            <tr>
              <td
                class="whitespace-nowrap text-sm sm:text-[1rem] font-normal text-start border-b border-r border-gray-300 dark:border-gray-800"
              >
                <span class="ml-2">{metric.name} Growth</span>
              </td>
              {#each allDates as date, dateIndex}
                {@const currentValue = getValue(metric, date)}
                {@const previousValue =
                  dateIndex < allDates.length - 1
                    ? getValue(metric, allDates[dateIndex + 1])
                    : null}
                {@const growth = formatGrowth(currentValue, previousValue)}
                {@const growthNum =
                  currentValue && previousValue
                    ? ((currentValue - previousValue) / previousValue) * 100
                    : 0}

                {#if isSubscribed}
                  <td
                    class="text-sm sm:text-[1rem] text-end
                  {growthNum > 0
                      ? 'text-green-800 dark:text-[#00FC50]'
                      : growthNum < 0
                        ? 'text-red-800 dark:text-[#FF2F1F]'
                        : ''}
                  border-b border-r border-gray-300 dark:border-gray-800"
                  >
                    {growth}
                  </td>
                {:else if dateIndex <= limit}
                  <td
                    class="text-sm sm:text-[1rem] text-end
                  {growthNum > 0
                      ? 'text-green-800 dark:text-[#00FC50]'
                      : growthNum < 0
                        ? 'text-red-800 dark:text-[#FF2F1F]'
                        : ''}
                  border-b border-r border-gray-300 dark:border-gray-800"
                  >
                    {growth}
                  </td>
                {:else}
                  <td
                    class="whitespace-nowrap text-sm sm:text-[1rem] text-end border-b border-r border-gray-300 dark:border-gray-800"
                  >
                    <a
                      href="/pricing"
                      class="inline-flex items-center justify-end text-sm font-semibold text-muted hover:text-default"
                      >Upgrade <!--[--><!----><svg
                        class="ml-1 mt-px size-3.5 text-muted"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        style="max-width:40px"
                        ><path
                          fill-rule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clip-rule="evenodd"
                        ></path></svg
                      >
                    </a>
                  </td>
                {/if}
              {/each}
            </tr>
          {/if}
        {/each}
      </tbody>
    </table>
  </div>
</section>

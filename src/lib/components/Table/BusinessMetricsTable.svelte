<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";

  export let title = "";
  export let metrics = []; // Array of metric objects from the new data structure
  export let showGrowth = true;

  // Helper to format dates consistently.
  const formatDate = (d) => {
    const date = new Date(d);
    return isNaN(date)
      ? "n/a"
      : date.toLocaleString("en-US", {
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
      return "n/a";
    }
    const growth = ((current - previous) / previous) * 100;
    return (growth > 0 ? "+" : "") + growth?.toFixed(2) + "%";
  };

  // Format value based on valueType
  const formatValue = (value, valueType) => {
    if (value === null || value === undefined) return "n/a";

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
    return Array?.from(dates).sort().reverse().slice(0, 8); // Show last 8 quarters
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
  <h2 class="mt-5 text-xl sm:text-2xl font-bold mb-4">{title}</h2>

  <div
    class="flex justify-start items-center w-screen sm:w-full mt-6 m-auto overflow-x-auto pr-5 sm:pr-0"
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
        {#each metrics as metric, index}
          <tr class="odd:bg-[#F6F7F8] dark:odd:bg-odd">
            <th
              class="whitespace-nowrap text-sm sm:text-[1rem] font-normal text-start border-b border-r border-gray-300 dark:border-gray-800"
            >
              {metric.name}
            </th>
            {#each allDates as date}
              {@const value = getValue(metric, date)}
              <td
                class="whitespace-nowrap text-sm sm:text-[1rem] text-end border-b border-r border-gray-300 dark:border-gray-800"
              >
                {formatValue(value, getValueType(metric))}
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
              {/each}
            </tr>
          {/if}
        {/each}
      </tbody>
    </table>
  </div>
</section>

<script lang="ts">
  import {
    displayCompanyName,
    stockTicker,
    selectedTimePeriod,
  } from "$lib/store";
  import { removeCompanyStrings, abbreviateNumber } from "$lib/utils";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";

  export let data;

  $selectedTimePeriod = "ttm";
  let orderedCategories = [];
  let categorizedMetrics = {};

  // User subscription info
  const isSubscribed = ["Pro", "Plus"]?.includes(data?.user?.tier);
  const limit = 6;

  // Tab state
  let tabs = ["Quarterly", "TTM"];
  $: activeIdx = $selectedTimePeriod === "quarterly" ? 0 : 1;

  function handleTabClick(index: number) {
    $selectedTimePeriod = index === 0 ? "quarterly" : "ttm";
  }

  // Cache processed data per period to avoid re-processing
  const cache = new Map();

  // Helper function for category sorting (defined once, not recreated)
  function getPrefixPriority(name: string): string {
    if (name.startsWith("Revenue")) return "1-Revenue";
    if (name.startsWith("Gross")) return "2-Gross";
    if (name.startsWith("Operating")) return "3-Operating";
    if (name.startsWith("Vehicles")) return "4-Vehicles";
    if (name.startsWith("Energy")) return "5-Energy";
    return "9-" + name.split(" ")[0];
  }

  function sortCategories(a: string, b: string): number {
    if (a === "Operating Metrics") return -1;
    if (b === "Operating Metrics") return 1;

    const aHasGeography = a.includes("Geography");
    const bHasGeography = b.includes("Geography");
    if (aHasGeography && !bHasGeography) return 1;
    if (!aHasGeography && bHasGeography) return -1;

    const prefixA = getPrefixPriority(a);
    const prefixB = getPrefixPriority(b);

    if (prefixA !== prefixB) {
      return prefixA.localeCompare(prefixB);
    }
    return a.localeCompare(b);
  }

  function processMetrics(metricsData) {
    // Categorize metrics in a single pass
    const tempCategorized = {};
    const operatingMetrics = [];

    for (const metric of metricsData) {
      const category = metric?.category || "Other";
      if (!tempCategorized[category]) {
        tempCategorized[category] = [];
      }
      tempCategorized[category].push(metric);
    }

    // Build final categorized metrics
    const result = {};
    for (const [category, metrics] of Object.entries(tempCategorized)) {
      if (metrics.length === 1) {
        operatingMetrics.push(...metrics);
      } else {
        result[category] = metrics;
      }
    }

    if (operatingMetrics.length > 0) {
      result["Operating Metrics"] = operatingMetrics;
    }

    return {
      categorized: result,
      ordered: Object.keys(result).sort(sortCategories),
    };
  }

  // Memoized table date formatter (separate from download formatter)
  const tableDateFormatterCache = new Map();
  function formatTableDate(dateStr: string): string {
    if (tableDateFormatterCache.has(dateStr)) {
      return tableDateFormatterCache.get(dateStr);
    }
    const date = new Date(dateStr);
    const formatted = isNaN(date.getTime())
      ? "n/a"
      : date.toLocaleString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        });
    tableDateFormatterCache.set(dateStr, formatted);
    return formatted;
  }

  // Single reactive block with caching
  $: if ($stockTicker && data?.getData?.[$selectedTimePeriod]) {
    const cacheKey = `${$stockTicker}-${$selectedTimePeriod}`;

    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      categorizedMetrics = cached.categorized;
      orderedCategories = cached.ordered;
    } else {
      const metricsData = data.getData[$selectedTimePeriod];
      const processed = processMetrics(metricsData);

      categorizedMetrics = processed.categorized;
      orderedCategories = processed.ordered;

      cache.set(cacheKey, processed);
    }
  } else {
    categorizedMetrics = {};
    orderedCategories = [];
  }

  // Process table data for each category
  let categoryTableData = new Map();
  $: {
    const newTableData = new Map();
    for (const category of orderedCategories) {
      const metrics = categorizedMetrics[category] || [];

      if (metrics.length === 0) {
        newTableData.set(category, { dates: [], formattedDates: [], rows: [] });
        continue;
      }

      // Collect all dates for this category
      const dateSet = new Set();
      for (const metric of metrics) {
        for (const v of metric.values) {
          dateSet.add(v.date);
        }
      }

      // Sort and format dates
      const allDates = Array.from(dateSet).sort().reverse();
      const formattedDates = allDates.map(formatTableDate);

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

          if (i < allDates.length - 1) {
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

      newTableData.set(category, { dates: allDates, formattedDates, rows });
    }
    categoryTableData = newTableData;
  }

  // Memoized date formatter
  const dateFormatterCache = new Map();
  function formatDate(dateStr: string): string {
    if (dateFormatterCache.has(dateStr)) {
      return dateFormatterCache.get(dateStr);
    }
    const date = new Date(dateStr);
    const formatted = isNaN(date.getTime())
      ? "n/a"
      : date.toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        });
    dateFormatterCache.set(dateStr, formatted);
    return formatted;
  }

  // Create comprehensive download data for all categories combined
  let downloadData = [];
  $: {
    if (!orderedCategories.length || !categorizedMetrics) {
      downloadData = [];
    } else {
      // Collect all unique dates across all metrics
      const dateSet = new Set();
      const allMetrics = [];

      for (const category of orderedCategories) {
        const metrics = categorizedMetrics[category] || [];
        for (const metric of metrics) {
          allMetrics.push({ ...metric, category });
          for (const v of metric.values) {
            dateSet.add(v.date);
          }
        }
      }

      // Sort dates (most recent first)
      const sortedDates = Array.from(dateSet).sort().reverse();

      // Pre-build value maps for O(1) lookups instead of O(n) find operations
      const metricValueMaps = allMetrics.map((metric) => {
        const valueMap = new Map();
        for (const v of metric.values) {
          valueMap.set(v.date, {
            val: v.val,
            valueType: v.valueType || "NUMBER",
          });
        }
        return { metric, valueMap };
      });

      // Build download data (one row per date period)
      downloadData = sortedDates.map((date) => {
        const row: Record<string, any> = {
          "Period Ending": formatDate(date),
        };

        // Add all metrics as columns
        for (const { metric: metricData, valueMap } of metricValueMaps) {
          const valueObj = valueMap.get(date);
          const value = valueObj?.val;
          const valueType = valueObj?.valueType || "NUMBER";

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

          // Use category prefix to make metric names unique
          const columnName = `${metricData.category} - ${metricData.name}`;
          row[columnName] = formatted;
        }

        return row;
      });
    }
  }
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Business Metrics Overview`}
  description={`View comprehensive business metrics for ${$displayCompanyName} (${$stockTicker}) stock, including revenue breakdown, operating metrics, and performance indicators.`}
/>

<section class="overflow-hidden min-h-screen w-full">
  <div class="flex justify-center m-auto h-full overflow-hidden w-full">
    <div
      class="relative flex justify-center items-center overflow-hidden w-full"
    >
      <div class="sm:pl-7 sm:pb-7 w-full m-auto mt-2 sm:mt-0">
        {#if orderedCategories.length > 0}
          {#each orderedCategories as category, index (category)}
            {@const tableData = categoryTableData.get(category) || {
              dates: [],
              formattedDates: [],
              rows: [],
            }}
            {@const isFirst = index === 0}
            {@const categoryDownloadData = isFirst
              ? downloadData
              : tableData.formattedDates.map((formattedDate, dateIndex) => {
                  const downloadRow = { "Period Ending": formattedDate };
                  tableData.rows.forEach((row) => {
                    const cell = row.cells[dateIndex];
                    if (cell && !cell.isPremium) {
                      downloadRow[row.name] = cell.formatted;
                      if (cell.growth !== "-") {
                        downloadRow[`${row.name} Growth`] = cell.growth;
                      }
                    } else if (cell?.isPremium) {
                      downloadRow[row.name] = "Premium";
                      downloadRow[`${row.name} Growth`] = "Premium";
                    } else {
                      downloadRow[row.name] = "-";
                      downloadRow[`${row.name} Growth`] = "-";
                    }
                  });
                  return downloadRow;
                })}

            <section class="my-5 pb-5">
              {#if isFirst}
                <div class="items-center lg:overflow-visible">
                  <div
                    class="col-span-2 flex flex-col lg:flex-row items-start sm:items-center lg:order-2 lg:grow py-1"
                  >
                    <h2
                      class="text-start whitespace-nowrap text-xl sm:text-2xl font-bold py-1 w-full"
                    >
                      {removeCompanyStrings($displayCompanyName)}
                      {category}
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
                                  : 'bg-white border-gray-300 sm:hover:bg-gray-100 dark:bg-primary dark:border-gray-800'}"
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
                          rawData={categoryDownloadData}
                          title={`${$stockTicker}_all_business_metrics_overview`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              {:else}
                <h2 class="mt-5 text-xl font-bold mb-4">{category}</h2>
              {/if}

              <div
                class="flex justify-start items-center w-screen sm:w-full mt-2 m-auto overflow-x-auto pr-5 sm:pr-0"
              >
                <table
                  class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
                >
                  <thead class="bg-default text-white w-full">
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
                  <tbody class="shadow w-full">
                    {#each tableData.rows as row (row.name)}
                      <tr class="w-full odd:bg-[#F6F7F8] dark:odd:bg-odd">
                        <th
                          class="whitespace-nowrap flex flex-row justify-between items-center text-sm sm:text-[1rem] font-normal text-start border-r border-gray-300 dark:border-gray-800"
                        >
                          {row.name}
                        </th>
                        {#each row.cells as cell}
                          <td
                            class="whitespace-nowrap text-sm sm:text-[1rem] text-end border-b border-r border-gray-300 dark:border-gray-800"
                          >
                            {#if cell?.isPremium && cell?.value !== null}
                              <a
                                href="/pricing"
                                class="inline-flex items-center justify-end text-sm font-semibold"
                              >
                                Upgrade
                                <svg
                                  class="ml-1 mt-px size-3.5"
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
                      <tr>
                        <td
                          class="min-w-auto md:min-w-96 w-full whitespace-nowrap flex flex-row justify-between items-center text-sm sm:text-[1rem] font-normal text-start border-r border-gray-300 dark:border-gray-800"
                        >
                          <span class="ml-2 mr-5 md:mr-0"
                            >{row.name} Growth</span
                          >
                        </td>
                        {#each row.cells as cell}
                          <td
                            class="text-sm sm:text-[1rem] text-end border-b border-r border-gray-300 dark:border-gray-800 {cell.growthClass}"
                          >
                            {#if cell.isPremium && cell.growth !== "-"}
                              <a
                                href="/pricing"
                                class="inline-flex items-center justify-end text-sm font-semibold text-muted dark:text-white"
                              >
                                Upgrade
                                <svg
                                  class="ml-1 mt-px size-3.5"
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
                    {/each}
                  </tbody>
                </table>
              </div>
            </section>
          {/each}
        {:else}
          <Infobox
            text={`Currently, there are no business metrics available for ${removeCompanyStrings($displayCompanyName)}.`}
          />
        {/if}
      </div>
    </div>
  </div>
</section>

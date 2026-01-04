<script lang="ts">
  import {
    displayCompanyName,
    stockTicker,
    screenWidth,
    selectedTimePeriod,
  } from "$lib/store";
  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import highcharts from "$lib/highcharts.ts";
  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
  import { mode } from "mode-watcher";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { goto } from "$app/navigation";

  export let data;
  $selectedTimePeriod = "ttm";

  let selectedInterval = "5Y";
  let categoryMetrics = [];
  let categoryName = "";
  let config = null;
  let tableData = [];
  let filteredDates = [];
  let isSubscribed = ["Plus", "Pro"].includes(data?.user?.tier);

  // Cache for computed values
  const computeCache = new Map();

  let tabs = ["Quarterly", "TTM"];
  $: activeIdx = $selectedTimePeriod === "quarterly" ? 0 : 1;

  function handleTabClick(index: number) {
    $selectedTimePeriod = index === 0 ? "quarterly" : "ttm";
  }

  function changeStatement(interval: string) {
    if (isSubscribed === false && interval !== "5Y") {
      goto("/pricing");
    } else {
      selectedInterval = interval;
    }
  }

  function filterDataByYears(dates: string[], interval: string) {
    const now = new Date();
    let thresholdDate: Date;

    switch (interval) {
      case "5Y":
        thresholdDate = new Date(now);
        thresholdDate.setFullYear(now.getFullYear() - 5);
        break;
      case "10Y":
        thresholdDate = new Date(now);
        thresholdDate.setFullYear(now.getFullYear() - 10);
        break;
      case "MAX":
      default:
        thresholdDate = new Date(0);
        break;
    }

    return dates.filter((date) => new Date(date) >= thresholdDate);
  }

  $: categorySlug = data?.getParams;

  function slugToCategory(slug: string): string {
    return slug
      ?.split("-")
      ?.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      ?.join(" ");
  }

  function normalizeSlug(category: string): string {
    return category?.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "");
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  function formatDateShort(dateStr: string): string {
    const date = new Date(dateStr);
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const year = date.getFullYear().toString().slice(-2);
    return `${month} '${year}`;
  }

  function plot(metrics, dates, isDarkMode, isSmallScreen, timePeriod, slug) {
    if (!metrics || metrics.length === 0 || !dates || dates.length === 0)
      return null;

    // Separate percentage and non-percentage metrics
    let usePercentChart = false;
    let metricsToPlot = [];

    for (const metric of metrics) {
      const valueType = metric.values?.[0]?.valueType;
      if (valueType === "PERCENT") {
        usePercentChart = true;
        metricsToPlot.push(metric);
      } else if (valueType && !usePercentChart) {
        metricsToPlot.push(metric);
      }
    }

    // If we found percent metrics, filter out non-percent
    if (usePercentChart) {
      metricsToPlot = metrics.filter(
        (m) => m.values?.[0]?.valueType === "PERCENT",
      );
    }

    if (metricsToPlot.length === 0) return null;

    // Limit to 12 most recent and reverse for chart (oldest to newest for display)
    const chartDates = [...dates].reverse();

    // Create series data for each metric
    const colors = [
      "#2d6289",
      "#5369a2",
      "#8668ae",
      "#ea6094",
      "#8b5cf6",
      "#ec4899",
      "#06b6d4",
      "#84cc16",
    ];

    const series = metricsToPlot.map((metric, index) => {
      // Pre-build value map for O(1) lookups
      const valueMap = new Map();
      for (const v of metric.values) {
        valueMap.set(v.date, v.val);
      }

      const data = chartDates.map((date) => valueMap.get(date) ?? null);

      return {
        name: metric.name,
        type: usePercentChart ? "spline" : "column",
        data: data,
        color: colors[index % colors.length],
        borderRadius: usePercentChart ? undefined : "5px",
        animation: false,
        marker: usePercentChart
          ? {
              enabled: true,
              radius: 4,
              symbol: "circle",
            }
          : undefined,
        lineWidth: usePercentChart ? 2 : undefined,
      };
    });

    // Pre-format dates for faster rendering
    const formattedDates = chartDates.map((date) => formatDateShort(date));

    // Build the Highcharts options
    const baseConfig = {
      credits: { enabled: false },
      chart: {
        type: usePercentChart ? "spline" : "column",
        backgroundColor: isDarkMode ? "#09090B" : "#fff",
        animation: false,
        height: isSmallScreen ? 360 : 500,
      },

      title: {
        text: `<h3 class="mt-3 mb-1 text-sm sm:text-lg">${categoryName}</h3>`,
        useHTML: true,
        style: { color: isDarkMode ? "white" : "black" },
      },

      xAxis: {
        categories: formattedDates,
        crosshair: {
          color: isDarkMode ? "#fff" : "#000",
          width: 1,
          dashStyle: "Solid",
        },
        labels: {
          style: { color: isDarkMode ? "#fff" : "#000" },
        },
      },

      yAxis: {
        min: 0,
        title: { text: null },
        gridLineColor: isDarkMode ? "#1f2937" : "#e5e7eb",
        labels: {
          style: { color: isDarkMode ? "#fff" : "#545454" },
          formatter: function () {
            if (usePercentChart) {
              return this.value.toFixed(1) + "%";
            }
            return abbreviateNumber(this.value, false, true);
          },
        },
      },

      plotOptions: {
        series: {
          animation: false,
          states: {
            hover: {
              enabled: true,
            },
          },
        },
      },

      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 1)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        style: {
          color: "#fff",
          fontSize: "15px",
          padding: "12px 16px",
        },
        borderRadius: 8,
        outside: false,
      },

      series: series,

      legend: {
        enabled: true,
        itemStyle: { color: isDarkMode ? "#fff" : "#000" },
        itemHoverStyle: { color: isDarkMode ? "#d1d5db" : "#374151" },
      },
    };

    // Pre-compute formatted dates for tooltip
    const dateMap = new Map();
    chartDates.forEach((date, idx) => {
      dateMap.set(formattedDates[idx], formatDate(date));
    });

    // Add specific configurations for column charts
    if (!usePercentChart) {
      baseConfig.yAxis.stackLabels = {
        enabled: true,
        style: {
          color: isDarkMode ? "#fff" : "#000",
          fontWeight: "bold",
        },
        formatter: function () {
          return abbreviateNumber(this.total, false, true);
        },
      };

      baseConfig.plotOptions.column = {
        stacking: "normal",
        dataLabels: {
          enabled: true,
          inside: true,
          verticalAlign: "middle",
          style: {
            color: "#eeeeee",
            textOutline: "none",
            fontSize: "12px",
            fontWeight: "600",
          },
          formatter: function () {
            const total = this.point.stackTotal;
            const percentage = (this.y / total) * 100;
            if (percentage < 5) return null;
            return abbreviateNumber(this.y, false, true);
          },
        },
        borderWidth: 1,
        borderColor: isDarkMode ? "#09090B" : "#eeeeee",
        animation: false,
        pointPadding: 0.05,
        groupPadding: 0.05,
      };

      baseConfig.tooltip.formatter = function () {
        let total = 0;
        const formattedDate = dateMap.get(this.x) || this.x;

        // Pre-calculate all values
        const points = this.points.filter((p) => p.y !== null);
        points.forEach((p) => {
          total += p.y;
        });

        let content = `<div style="min-width: 250px; max-width: 400px;">`;
        content += `<div style="font-weight: 600; margin-bottom: 5px; font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 8px;">${formattedDate}</div>`;
        content += `<div style="display: grid; gap: 6px;">`;

        points.forEach((point) => {
          content += `
      <div style="display: grid; grid-template-columns: auto 1fr auto; gap: 5px; align-items: center;">
       <span style="color: ${point.color}; font-size: 14px;">●</span>
       <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 14px;">${point.series.name}</span>
       <span style="font-weight: 600; white-space: nowrap; font-size: 14px;">${abbreviateNumber(point.y, false, true)}</span>
      </div>`;
        });

        content += `</div>`;
        content += `
     <div style="margin-top: 12px; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.3); display: flex; justify-content: space-between; font-size: 14px;">
      <span style="font-weight: 600; font-size: 14px;">Total:</span>
      <span style="font-weight: 700; font-size: 14px;">${abbreviateNumber(total, false, true)}</span>
     </div>`;
        content += `</div>`;

        return content;
      };
    } else {
      // Spline chart specific tooltip
      baseConfig.plotOptions.spline = {
        dataLabels: {
          enabled: false,
        },
        animation: false,
      };

      baseConfig.tooltip.formatter = function () {
        const formattedDate = dateMap.get(this.x) || this.x;
        const points = this.points.filter((p) => p.y !== null);

        let content = `<div style="min-width: 250px; max-width: 400px;">`;
        content += `<div style="font-weight: 600; margin-bottom: 5px; font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 8px;">${formattedDate}</div>`;
        content += `<div style="display: grid; gap: 6px;">`;

        points.forEach((point) => {
          content += `
      <div style="display: grid; grid-template-columns: auto 1fr auto; gap: 5px; align-items: center;">
       <span style="color: ${point.color}; font-size: 14px;">●</span>
       <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 14px;">${point.series.name}</span>
       <span style="font-weight: 600; white-space: nowrap; font-size: 14px;">${point.y.toFixed(2)}%</span>
      </div>`;
        });

        content += `</div></div>`;
        return content;
      };
    }

    return baseConfig;
  }

  // Extract category metrics (only when data or category changes)
  $: if ($stockTicker && data?.getData?.[$selectedTimePeriod] && categorySlug) {
    const metricsData = data.getData[$selectedTimePeriod];
    const slugLower = categorySlug.toLowerCase();

    // Create cache key for category extraction
    const categoryCacheKey = `${$stockTicker}-${$selectedTimePeriod}-${slugLower}`;

    if (computeCache.has(categoryCacheKey)) {
      const cached = computeCache.get(categoryCacheKey);
      categoryMetrics = cached.categoryMetrics;
      categoryName = cached.categoryName;
    } else {
      if (slugLower === "operating-metrics") {
        categoryName = "Operating Metrics";

        const tempCategorized = {};
        for (const metric of metricsData) {
          const category = metric.category || "Other";
          if (!tempCategorized[category]) {
            tempCategorized[category] = [];
          }
          tempCategorized[category].push(metric);
        }

        categoryMetrics = [];
        for (const metrics of Object.values(tempCategorized)) {
          if (metrics.length === 1) {
            categoryMetrics.push(...metrics);
          }
        }
      } else {
        categoryMetrics = [];
        let foundCategoryName = "";

        for (const metric of metricsData) {
          if (normalizeSlug(metric.category) === slugLower) {
            categoryMetrics.push(metric);
            if (!foundCategoryName) {
              foundCategoryName = metric.category;
            }
          }
        }

        categoryName = foundCategoryName || slugToCategory(categorySlug);
      }

      // Cache the category extraction result
      computeCache.set(categoryCacheKey, { categoryMetrics, categoryName });
    }
  } else {
    categoryMetrics = [];
    categoryName = "";
  }

  // Process filtered dates and table data (when interval or metrics change)
  $: if (categoryMetrics.length > 0 && selectedInterval) {
    const cacheKey = `${$selectedTimePeriod}-${categorySlug}-${selectedInterval}`;

    if (computeCache.has(cacheKey)) {
      const cached = computeCache.get(cacheKey);
      filteredDates = cached.filteredDates;
      tableData = cached.tableData;
    } else {
      // Collect unique dates
      const dateSet = new Set();
      for (const metric of categoryMetrics) {
        for (const v of metric.values) {
          dateSet.add(v.date);
        }
      }

      // Sort and filter dates
      const sortedDates = Array.from(dateSet).sort().reverse();
      filteredDates = filterDataByYears(sortedDates, selectedInterval);

      // Pre-build value maps for all metrics (O(1) lookups)
      const metricValueMaps = new Map();
      for (const metric of categoryMetrics) {
        const valueMap = new Map();
        for (const v of metric.values) {
          valueMap.set(v.date, { val: v.val, valueType: v.valueType });
        }
        metricValueMaps.set(metric.name, valueMap);
      }

      // Build table data - optimized version
      const numDates = filteredDates.length;
      const numMetrics = categoryMetrics.length;
      tableData = new Array(numDates);

      for (let i = 0; i < numDates; i++) {
        const date = filteredDates[i];
        const metrics = {};

        for (let j = 0; j < numMetrics; j++) {
          const metric = categoryMetrics[j];
          const valueMap = metricValueMaps.get(metric.name);
          const valueObj = valueMap.get(date);

          if (valueObj) {
            const value = valueObj.val;
            const valueType = valueObj.valueType;

            let formatted;
            if (value === null || value === undefined) {
              formatted = "-";
            } else if (valueType === "PERCENT") {
              formatted = value.toFixed(2) + "%";
            } else if (valueType === "CURRENCY") {
              formatted = abbreviateNumber(value, false, true);
            } else if (valueType === "NUMBER") {
              formatted = abbreviateNumber(value, false, false);
            } else {
              formatted = value.toString();
            }

            metrics[metric.name] = { value, formatted, valueType };
          } else {
            metrics[metric.name] = {
              value: null,
              formatted: "-",
              valueType: "NUMBER",
            };
          }
        }

        tableData[i] = {
          date,
          formattedDate: formatDate(date),
          metrics,
        };
      }

      // Cache the results
      computeCache.set(cacheKey, { filteredDates, tableData });

      // Limit cache size to prevent memory issues
      if (computeCache.size > 100) {
        const firstKey = computeCache.keys().next().value;
        computeCache.delete(firstKey);
      }
    }
  } else {
    filteredDates = [];
    tableData = [];
  }

  // Generate chart (only when necessary)
  $: {
    if (
      categoryMetrics.length > 0 &&
      filteredDates.length > 0 &&
      $mode &&
      $screenWidth !== undefined
    ) {
      const isDarkMode = $mode === "dark";
      const isSmallScreen = $screenWidth < 640;
      config = plot(
        categoryMetrics,
        filteredDates,
        isDarkMode,
        isSmallScreen,
        $selectedTimePeriod,
        categorySlug,
      );
    } else {
      config = null;
    }
  }

  // Transform tableData for download - matches table display format
  $: downloadData = tableData.map((row) => {
    const downloadRow: Record<string, any> = {
      Date: row.formattedDate,
    };

    categoryMetrics.forEach((metric) => {
      downloadRow[metric.name] = row.metrics[metric.name]?.formatted || "-";
    });

    return downloadRow;
  });
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) ${categoryName} - Business Metrics`}
  description={`Detailed ${categoryName} metrics for ${$displayCompanyName} (${$stockTicker}). Track historical trends and performance indicators.`}
/>

{#key data?.getParams}
  <section class="w-full overflow-hidden h-full">
    <div
      class="w-full flex justify-center w-full sm-auto h-full overflow-hidden"
    >
      <div
        class="w-full relative flex justify-center items-center overflow-hidden"
      >
        <main class="w-full">
          <div class="sm:pl-7 sm:pb-7 sm:pt-7 pt-3 m-auto mt-2 sm:mt-0 w-full">
            {#if categoryMetrics?.length > 0}
              <div class="items-center lg:overflow-visible">
                <div
                  class="col-span-2 flex flex-col lg:flex-row items-start sm:items-center lg:order-2 lg:grow py-1"
                >
                  <h2
                    class="text-start whitespace-nowrap text-xl sm:text-2xl font-bold py-1 w-full"
                  >
                    {removeCompanyStrings($displayCompanyName)}
                    {categoryName}
                  </h2>
                  <div
                    class="mt-1 w-full flex flex-row items-center justify-end pb-1 pt-1 sm:pt-0 gap-1"
                  >
                    <!-- Tabs (segmented pill) -->
                    <div
                      class="w-fit text-sm flex items-center gap-1 rounded-full border border-gray-300 shadow dark:border-zinc-800/80
           "
                    >
                      {#each tabs as item, i (item)}
                        <button
                          on:click={() => handleTabClick(i)}
                          class="cursor-pointer font-medium rounded-full px-3 py-1.5 focus:z-10 focus:outline-none transition-all
          {activeIdx === i
                            ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                            : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'}"
                        >
                          {item}
                        </button>
                      {/each}
                    </div>

                    <!-- Interval dropdown (kept separate, but styled to match height/feel) -->
                    <div class="relative inline-block">
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild let:builder>
                          <Button
                            builders={[builder]}
                            class="flex-shrink-0 transition-all border border-gray-300 shadow dark:border-zinc-800/80
                 bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900
                 text-gray-900 dark:text-white rounded-full px-3 py-1.5 text-xs
                 flex flex-row items-center gap-2 truncate disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <span class="truncate">{selectedInterval}</span>
                            <svg
                              class="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fill-rule="evenodd"
                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                clip-rule="evenodd"
                              />
                            </svg>
                          </Button>
                        </DropdownMenu.Trigger>

                        <DropdownMenu.Content
                          side="bottom"
                          align="end"
                          sideOffset={10}
                          class="h-fit max-h-72 overflow-y-auto scroller"
                        >
                          <DropdownMenu.Group>
                            <DropdownMenu.Item
                              on:click={() => changeStatement("5Y")}
                              class="cursor-pointer text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400"
                            >
                              5Y
                            </DropdownMenu.Item>

                            <DropdownMenu.Item
                              on:click={() => changeStatement("10Y")}
                              class="cursor-pointer text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 flex items-center"
                            >
                              10Y
                              {#if !isSubscribed}
                                <svg
                                  class="w-3 h-3 ml-auto"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fill-rule="evenodd"
                                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                    clip-rule="evenodd"
                                  />
                                </svg>
                              {/if}
                            </DropdownMenu.Item>

                            <DropdownMenu.Item
                              on:click={() => changeStatement("MAX")}
                              class="cursor-pointer text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 flex items-center"
                            >
                              Max
                              {#if !isSubscribed}
                                <svg
                                  class="w-3 h-3 ml-auto"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fill-rule="evenodd"
                                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                    clip-rule="evenodd"
                                  />
                                </svg>
                              {/if}
                            </DropdownMenu.Item>
                          </DropdownMenu.Group>
                        </DropdownMenu.Content>
                      </DropdownMenu.Root>
                    </div>
                  </div>
                </div>
              </div>

              {#if config}
                <div>
                  <div class="grow">
                    <div class="relative">
                      <div
                        class="mt-5 shadow-none sm:mt-0 sm:border sm:border-gray-200 dark:border-zinc-800/80 rounded-2xl bg-white/70 dark:bg-zinc-950/40"
                        use:highcharts={config}
                      ></div>
                    </div>
                  </div>
                </div>
              {/if}

              <div
                class=" mt-5 flex flex-row items-center w-full justify-between border-t border-b border-gray-200 dark:border-zinc-800/80 py-2"
              >
                <h3 class="text-xl sm:text-2xl font-bold">History</h3>
                <div class="ml-2">
                  <DownloadData
                    {data}
                    rawData={downloadData}
                    title={`${$stockTicker}_${normalizeSlug(categoryName)}_metrics`}
                  />
                </div>
              </div>

              <div class="w-full overflow-x-auto">
                <table
                  class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 shadow dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/40 text-gray-700 dark:text-zinc-200 tabular-nums m-auto mt-4"
                >
                  <thead
                    class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                  >
                    <tr>
                      <th class="font-semibold text-start text-xs">
                        {$selectedTimePeriod === "quarterly"
                          ? "Quarter Ended"
                          : "Period Ended"}
                      </th>
                      {#each categoryMetrics as metric}
                        <th class="font-semibold text-end">
                          {metric.name}
                        </th>
                      {/each}
                    </tr>
                  </thead>
                  <tbody>
                    {#each tableData as row}
                      <tr class="transition-colors text-sm">
                        <td class=" whitespace-nowrap">
                          {row.formattedDate}
                        </td>
                        {#each categoryMetrics as metric}
                          <td class=" text-right whitespace-nowrap">
                            {row.metrics[metric.name]?.formatted || "-"}
                          </td>
                        {/each}
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
              <div
                class="text-sm border border-gray-300 shadow dark:border-zinc-800/80 p-3 mt-4"
              >
                <strong>Source:</strong> Business metrics provided by
                <a
                  href="https://mainstreetdata.com/"
                  target="_blank"
                  rel="noopener"
                  class="text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                  >Main Street Data</a
                > and sourced from official company press releases and documents.
              </div>
            {:else}
              <Infobox
                text={`Currently, there are no metrics available for ${categoryName}.`}
              />
            {/if}
          </div>
        </main>
      </div>
    </div>
  </section>
{/key}

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

  export let data;
  $selectedTimePeriod = "ttm";

  const MAX_DATES = 12;

  let categoryMetrics = [];
  let categoryName = "";
  let config = null;
  let tableData = [];

  let tabs = ["Quarterly", "TTM"];
  $: activeIdx = $selectedTimePeriod === "quarterly" ? 0 : 1;

  function handleTabClick(index: number) {
    $selectedTimePeriod = index === 0 ? "quarterly" : "ttm";
  }

  // Make categorySlug reactive to route changes
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

  function plot(metrics) {
    if (!metrics || metrics.length === 0) return null;

    // Separate percentage and non-percentage metrics
    const percentMetrics = metrics.filter((metric) => {
      const valueType = metric.values?.[0]?.valueType;
      return valueType === "PERCENT";
    });

    const nonPercentMetrics = metrics.filter((metric) => {
      const valueType = metric.values?.[0]?.valueType;
      return valueType && valueType !== "PERCENT";
    });

    // Determine which type of chart to create
    const usePercentChart = percentMetrics.length > 0;
    const metricsToPlot = usePercentChart ? percentMetrics : nonPercentMetrics;

    if (metricsToPlot.length === 0) return null;

    // Collect all unique dates from all metrics
    const dateSet = new Set();
    for (const metric of metricsToPlot) {
      for (const v of metric.values) {
        dateSet.add(v.date);
      }
    }

    // Sort dates (most recent first, then reverse for chart)
    const dates = Array.from(dateSet).sort().reverse().slice(0, 12).reverse();

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
      const valueMap = new Map();
      for (const v of metric.values) {
        valueMap.set(v.date, v.val);
      }

      const data = dates.map((date) => valueMap.get(date) ?? null);

      return {
        name: metric.name,
        type: usePercentChart ? "spline" : "column",
        data: data,
        color: colors[index % colors.length],
        borderRadius: usePercentChart ? undefined : "3px",
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

    // Build the Highcharts options
    const baseConfig = {
      credits: { enabled: false },
      chart: {
        type: usePercentChart ? "spline" : "column",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        animation: false,
        height: $screenWidth < 640 ? 360 : 500,
      },

      title: {
        text: `<h3 class="mt-3 mb-1 text-[1rem] sm:text-lg">${categoryName}</h3>`,
        useHTML: true,
        style: { color: $mode === "light" ? "black" : "white" },
      },

      xAxis: {
        categories: dates,
        crosshair: {
          color: $mode === "light" ? "#000" : "#fff",
          width: 1,
          dashStyle: "Solid",
        },
        labels: {
          style: { color: $mode === "light" ? "#000" : "#fff" },
          formatter: function () {
            return formatDateShort(this.value);
          },
        },
      },

      yAxis: {
        min: 0,
        title: { text: null },
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#1f2937",
        labels: {
          style: { color: $mode === "light" ? "#545454" : "#fff" },
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
        backgroundColor: "rgba(0, 0, 0, 0.85)",
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
        itemStyle: { color: $mode === "light" ? "#000" : "#fff" },
        itemHoverStyle: { color: $mode === "light" ? "#374151" : "#d1d5db" },
      },
    };

    // Add specific configurations for column charts
    if (!usePercentChart) {
      baseConfig.yAxis.stackLabels = {
        enabled: true,
        style: {
          color: $mode === "light" ? "#000" : "#fff",
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
            // Only show label if value is significant enough
            const total = this.point.stackTotal;
            const percentage = (this.y / total) * 100;
            if (percentage < 5) return null; // Hide if less than 5% of total
            return abbreviateNumber(this.y, false, true);
          },
        },
        borderWidth: 1,
        borderColor: $mode === "light" ? "#eeeeee" : "#09090B",
        animation: false,
        pointPadding: 0.05,
        groupPadding: 0.05,
      };

      baseConfig.tooltip.formatter = function () {
        let total = 0;
        let content = `<div style="min-width: 250px; max-width: 400px;">`;
        content += `<div style="font-weight: 600; margin-bottom: 5px; font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 8px;">${formatDate(this.x)}</div>`;
        content += `<div style="display: grid; gap: 6px;">`;

        this.points.forEach((point) => {
          if (point.y !== null) {
            total += point.y;
            content += `
              <div style="display: grid; grid-template-columns: auto 1fr auto; gap: 5px; align-items: center;">
                <span style="color: ${point.color}; font-size: 14px;">●</span>
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 14px;">${point.series.name}</span>
                <span style="font-weight: 600; white-space: nowrap; font-size: 14px;">${abbreviateNumber(point.y, false, true)}</span>
              </div>`;
          }
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
        let content = `<div style="min-width: 250px; max-width: 400px;">`;
        content += `<div style="font-weight: 600; margin-bottom: 5px; font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 8px;">${formatDate(this.x)}</div>`;
        content += `<div style="display: grid; gap: 6px;">`;

        this.points.forEach((point) => {
          if (point.y !== null) {
            content += `
              <div style="display: grid; grid-template-columns: auto 1fr auto; gap: 5px; align-items: center;">
                <span style="color: ${point.color}; font-size: 14px;">●</span>
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 14px;">${point.series.name}</span>
                <span style="font-weight: 600; white-space: nowrap; font-size: 14px;">${point.y.toFixed(2)}%</span>
              </div>`;
          }
        });

        content += `</div></div>`;
        return content;
      };
    }

    return baseConfig;
  }

  $: if ($stockTicker && data?.getData?.[$selectedTimePeriod] && categorySlug) {
    const metricsData = data.getData[$selectedTimePeriod];
    const slugLower = categorySlug.toLowerCase();

    if (slugLower === "operating-metrics") {
      categoryName = "Operating Metrics";

      // Group metrics by category in single pass
      const tempCategorized = {};
      for (const metric of metricsData) {
        const category = metric.category || "Other";
        if (!tempCategorized[category]) {
          tempCategorized[category] = [];
        }
        tempCategorized[category].push(metric);
      }

      // Get all single-metric categories
      categoryMetrics = [];
      for (const metrics of Object.values(tempCategorized)) {
        if (metrics.length === 1) {
          categoryMetrics.push(...metrics);
        }
      }
    } else {
      // Regular category - filter in single pass
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

    // Generate chart config after metrics are set
    config = plot(categoryMetrics);

    // Build table data - dates as rows, metrics as columns
    if (categoryMetrics && categoryMetrics.length > 0) {
      // Collect all unique dates
      const dateSet = new Set();
      for (const metric of categoryMetrics) {
        for (const v of metric.values) {
          dateSet.add(v.date);
        }
      }

      // Sort dates descending (most recent first) and limit
      const sortedDates = Array.from(dateSet)
        .sort()
        .reverse()
        .slice(0, MAX_DATES);

      // Build rows where each row is a date/period
      tableData = sortedDates.map((date, index) => {
        const rowData = {
          date,
          formattedDate: formatDate(date),
          metrics: {},
        };

        // For each metric, get the value at this date
        for (const metric of categoryMetrics) {
          const valueObj = metric.values.find((v) => v.date === date);
          const value = valueObj?.val ?? null;
          const valueType =
            valueObj?.valueType || metric.values[0]?.valueType || "NUMBER";

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

          rowData.metrics[metric.name] = {
            value,
            formatted,
            valueType,
          };
        }

        return rowData;
      });
    } else {
      tableData = [];
    }
  } else {
    categoryMetrics = [];
    categoryName = "";
    config = null;
    tableData = [];
  }

  // Regenerate chart when mode or period changes
  $: if (
    categoryMetrics.length > 0 &&
    data?.getData?.[$selectedTimePeriod] &&
    $mode !== undefined &&
    data?.getParams
  ) {
    config = plot(categoryMetrics);
  }
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
                  </div>
                </div>
              </div>

              {#if config}
                <div>
                  <div class="grow mt-3">
                    <div class="relative">
                      <div
                        class="mt-5 shadow-xs sm:mt-0 sm:border sm:border-gray-300 dark:border-gray-800 rounded"
                        use:highcharts={config}
                      ></div>
                    </div>
                  </div>
                </div>
              {/if}

              <div
                class="history-driver mt-5 flex flex-row items-center w-full justify-between border-t border-b border-gray-300 dark:border-gray-800 py-2"
              >
                <h3 class="text-xl sm:text-2xl font-bold">History</h3>

                <div class="ml-2">
                  <DownloadData
                    {data}
                    rawData={categoryMetrics}
                    title={`${$stockTicker}_metric_data`}
                  />
                </div>
              </div>

              <div class="w-full overflow-x-auto">
                <table
                  class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto mt-4"
                >
                  <thead class="bg-default text-white">
                    <tr>
                      <th
                        class="font-semibold text-start text-sm sm:text-[1rem]"
                      >
                        Date
                      </th>
                      {#each categoryMetrics as metric}
                        <th
                          class="font-semibold text-end text-sm sm:text-[1rem]"
                        >
                          {metric.name}
                        </th>
                      {/each}
                    </tr>
                  </thead>
                  <tbody>
                    {#each tableData as row}
                      <tr
                        class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
                      >
                        <td class="text-sm sm:text-[1rem] whitespace-nowrap">
                          {row?.formattedDate}
                        </td>
                        {#each categoryMetrics as metric}
                          <td
                            class="text-sm sm:text-[1rem] text-right whitespace-nowrap"
                          >
                            {row?.metrics[metric.name]?.formatted || "-"}
                          </td>
                        {/each}
                      </tr>
                    {/each}
                  </tbody>
                </table>
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

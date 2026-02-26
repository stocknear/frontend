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
  import { mode } from "mode-watcher";
  import highcharts from "$lib/highcharts.ts";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import BarChart from "lucide-svelte/icons/chart-column-increasing";
  import LineChart from "lucide-svelte/icons/chart-spline";
  import X from "lucide-svelte/icons/x";
  import {
    stock_detail_metrics_bar_chart,
    stock_detail_metrics_growth,
    stock_detail_metrics_line_chart,
    stock_detail_metrics_no_data,
    stock_detail_metrics_period_ending,
    stock_detail_metrics_quarterly,
    stock_detail_metrics_seo_description,
    stock_detail_metrics_seo_title,
    stock_detail_metrics_source,
    stock_detail_metrics_ttm,
    stock_detail_metrics_upgrade,
  } from "$lib/paraglide/messages";

  export let data;

  $selectedTimePeriod = "ttm";
  let orderedCategories = [];
  let categorizedMetrics = {};

  // User subscription info
  const isSubscribed = ["Pro", "Plus"]?.includes(data?.user?.tier);
  const limit = 6;

  // Tab state
  $: tabs = [stock_detail_metrics_quarterly(), stock_detail_metrics_ttm()];
  $: activeIdx = $selectedTimePeriod === "quarterly" ? 0 : 1;

  function handleTabClick(index: number) {
    $selectedTimePeriod = index === 0 ? "quarterly" : "ttm";
  }

  // Chart modal state
  let config = null;
  let chartMode = "bar";
  let modalLabel = "";
  let currentRow = null;
  let currentIsGrowth = false;
  let isModalOpen = false;

  // Professional axis formatter (matching financials modal)
  function getCompactFractionDigits(valueAbs: number, stepAbs: number): number {
    if (valueAbs < 1000) return 0;
    const unit =
      valueAbs >= 1_000_000_000_000 ? 1_000_000_000_000 :
      valueAbs >= 1_000_000_000 ? 1_000_000_000 :
      valueAbs >= 1_000_000 ? 1_000_000 :
      1_000;
    const safeStep = Number.isFinite(stepAbs) && stepAbs > 0 ? stepAbs : unit;
    const stepInUnit = safeStep / unit;
    if (stepInUnit < 0.05) return 2;
    if (stepInUnit < 0.5) return 1;
    return 0;
  }

  function formatProfessionalAxisLabel(value: number, isPercent = false, tickInterval = 0): string {
    const safeValue = Number.isFinite(value) ? value : 0;
    const abs = Math.abs(safeValue);
    let formatted = "";
    if (abs >= 1000) {
      const compactDigits = getCompactFractionDigits(abs, Math.abs(tickInterval));
      formatted = new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: compactDigits,
        minimumFractionDigits: 0,
      }).format(safeValue);
    } else if (abs >= 10) {
      formatted = Number(safeValue.toFixed(1)).toLocaleString("en-US", { maximumFractionDigits: 1 });
    } else {
      formatted = Number(safeValue.toFixed(2)).toLocaleString("en-US", { maximumFractionDigits: 2 });
    }
    return isPercent ? `${formatted}%` : formatted;
  }

  function plotData(row: any, isGrowth: boolean) {
    // Get the current category's table data to access dates
    let currentFormattedDates = [];
    let currentRawDates = [];

    // Find the dates from categoryTableData
    for (const [category, data] of categoryTableData.entries()) {
      if (data.rows.some((r) => r.name === row.name)) {
        currentFormattedDates = data.formattedDates;
        currentRawDates = data.dates;
        break;
      }
    }

    // Extract values based on whether it's growth or regular values
    const allValues = row.cells.map((cell) => {
      if (cell.isPremium) return null;

      if (isGrowth) {
        // Parse growth percentage (e.g., "+5.23%" -> 5.23)
        if (cell.growth === "-") return null;
        return parseFloat(cell.growth.replace(/[+%]/g, ""));
      } else {
        return cell.value;
      }
    });

    // Filter out premium values and nulls, and include raw date for sorting
    const filteredData = allValues
      .map((val, index) => ({
        value: val,
        formattedDate: currentFormattedDates[index],
        rawDate: currentRawDates[index],
        isPremium: row.cells[index].isPremium,
      }))
      .filter((item) => !item.isPremium && item.value !== null)
      .sort(
        (a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime(),
      );

    const dateList = filteredData.map((item) => item.formattedDate);
    const valueList = filteredData.map((item) => item.value);

    const label = isGrowth
      ? `${row.name} ${stock_detail_metrics_growth()}`
      : row.name;

    const chartColor = $mode === "light" ? "#F59E0B" : "#FBBF24";

    const options = {
      chart: {
        type: chartMode === "bar" ? "column" : "spline",
        backgroundColor: $mode === "light" ? "#fff" : "#18181b",
        height: 400,
        animation: false,
        spacing: [20, 10, 20, 10],
      },
      credits: { enabled: false },
      legend: { enabled: false },
      plotOptions: {
        column: {
          borderRadius: 3,
          pointPadding: 0.1,
          groupPadding: 0.15,
        },
        spline: { lineWidth: 2, marker: { enabled: true, radius: 3 } },
        series: { animation: false },
      },
      title: {
        text: `<div class="text-lg font-semibold">${$stockTicker} ${label}</div>`,
        useHTML: true,
        style: { color: $mode === "light" ? "#111827" : "#f4f4f5" },
      },
      xAxis: {
        categories: dateList,
        crosshair: { color: $mode === "light" ? "#d1d5db" : "#3f3f46", width: 1 },
        labels: {
          style: { color: $mode === "light" ? "#6b7280" : "#a1a1aa" },
          rotation: -45,
        },
        lineColor: $mode === "light" ? "#e5e7eb" : "#27272a",
      },
      yAxis: {
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#f3f4f6" : "#27272a",
        labels: {
          style: { color: $mode === "light" ? "#6b7280" : "#a1a1aa" },
          formatter: function () {
            const tickInterval = Number(this?.axis?.tickInterval);
            return formatProfessionalAxisLabel(
              Number(this.value),
              isGrowth,
              tickInterval,
            );
          },
        },
        title: { text: null },
        opposite: true,
      },
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        style: { color: "#fff", fontSize: "13px" },
        borderRadius: 8,
        formatter: function () {
          const categoryName = this.points?.[0]?.key ?? this.x;
          let html = `<div class="px-1 py-1"><div class="font-semibold mb-1">${categoryName}</div>`;
          this.points.forEach((point) => {
            const val = point.y;
            const formatted = val != null
              ? (isGrowth ? val.toFixed(2) + "%" : (Math.abs(val) < 1000 ? val?.toFixed(2) : abbreviateNumber(val)))
              : "n/a";
            html += `<div class="flex items-center gap-2">
              <span style="color: ${point.series.color}">${point.series.name}:</span>
              <span class="font-medium">${formatted}</span>
            </div>`;
          });
          html += `</div>`;
          return html;
        },
      },
      series: [
        {
          name: label,
          data: valueList,
          color: chartColor,
          borderColor: chartColor,
          borderRadius: 3,
          animation: false,
        },
      ],
    };

    return options;
  }

  function handleChart(row: any, isGrowth: boolean) {
    currentRow = row;
    currentIsGrowth = isGrowth;
    modalLabel = isGrowth
      ? `${row.name} ${stock_detail_metrics_growth()}`
      : row.name;
    config = plotData(row, isGrowth);
    isModalOpen = true;
  }

  function handleCloseModal() {
    isModalOpen = false;
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      handleCloseModal();
    }
  }

  function toggleMode() {
    if (chartMode === "bar") {
      chartMode = "line";
    } else {
      chartMode = "bar";
    }
    // Re-render the chart with the new mode
    if (currentRow) {
      config = plotData(currentRow, currentIsGrowth);
    }
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
                  ? "text-emerald-800 dark:text-emerald-400"
                  : growthNum < 0
                    ? "text-rose-800 dark:text-rose-400"
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
  title={stock_detail_metrics_seo_title({
    company: $displayCompanyName,
    ticker: $stockTicker,
  })}
  description={stock_detail_metrics_seo_description({
    company: $displayCompanyName,
    ticker: $stockTicker,
  })}
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
                      {category}
                    </h2>
                    <div
                      class="mt-1 w-full flex flex-row lg:flex order-1 items-center ml-auto pb-1 pt-1 sm:pt-0 w-full order-0 lg:order-1"
                    >
                      <div class="ml-auto">
                        <div class="inline-flex">
                          <div
                            class="w-fit flex text-sm items-center gap-1 rounded-full border border-gray-300 shadow dark:border-zinc-700
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
                  class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 text-gray-700 dark:text-zinc-200 tabular-nums m-auto"
                >
                  <thead
                    class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                  >
                    <tr>
                      <th
                        class="border-b border-r border-gray-300 dark:border-zinc-700 font-semibold text-xs text-start"
                      >
                        {stock_detail_metrics_period_ending()}
                      </th>
                      {#each tableData.formattedDates as formattedDate (formattedDate)}
                        <th
                          class="z-20 border-b border-r min-w-[120px] border-gray-300 dark:border-zinc-700 font-semibold text-xs text-end"
                        >
                          {formattedDate}
                        </th>
                      {/each}
                    </tr>
                  </thead>
                  <tbody
                    class="w-full divide-y divide-gray-200/70 dark:divide-zinc-800/80"
                  >
                    {#each tableData.rows as row (row.name)}
                      <tr class="w-full transition-colors">
                        <th
                          class="whitespace-nowrap flex flex-row justify-between items-center text-sm font-normal text-start border-r border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-200"
                        >
                          {row.name}
                          <button
                            on:click={() => handleChart(row, false)}
                            class="cursor-pointer inline-block border-none"
                          >
                            <svg
                              class="w-5 h-5 text-gray-500 dark:text-gray-300"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                                id="SVGRepo_tracerCarrier"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              ></g><g id="SVGRepo_iconCarrier">
                                <path
                                  d="M9 12H4.6C4.03995 12 3.75992 12 3.54601 12.109C3.35785 12.2049 3.20487 12.3578 3.10899 12.546C3 12.7599 3 13.0399 3 13.6V19.4C3 19.9601 3 20.2401 3.10899 20.454C3.20487 20.6422 3.35785 20.7951 3.54601 20.891C3.75992 21 4.03995 21 4.6 21H9M9 21H15M9 21L9 8.6C9 8.03995 9 7.75992 9.10899 7.54601C9.20487 7.35785 9.35785 7.20487 9.54601 7.10899C9.75992 7 10.0399 7 10.6 7H13.4C13.9601 7 14.2401 7 14.454 7.10899C14.6422 7.20487 14.7951 7.35785 14.891 7.54601C15 7.75992 15 8.03995 15 8.6V21M15 21H19.4C19.9601 21 20.2401 21 20.454 20.891C20.6422 20.7951 20.7951 20.6422 20.891 20.454C21 20.2401 21 19.9601 21 19.4V4.6C21 4.03995 21 3.75992 20.891 3.54601C20.7951 3.35785 20.6422 3.20487 20.454 3.10899C20.2401 3 19.9601 3 19.4 3H16.6C16.0399 3 15.7599 3 15.546 3.10899C15.3578 3.20487 15.2049 3.35785 15.109 3.54601C15 3.75992 15 4.03995 15 4.6V8"
                                  stroke="currentColor"
                                  stroke-width="1.8"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                ></path>
                              </g></svg>

                          </button>
                        </th>
                        {#each row.cells as cell}
                          <td
                            class="whitespace-nowrap text-sm text-end border-b border-r border-gray-300 dark:border-zinc-700"
                          >
                            {#if cell?.isPremium && cell?.value !== null}
                              <a
                                href="/pricing"
                                class="inline-flex items-center justify-end text-sm font-semibold"
                              >
                                {stock_detail_metrics_upgrade()}
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
                          class="min-w-auto md:min-w-96 w-full whitespace-nowrap flex flex-row justify-between items-center text-sm font-normal text-start border-r border-gray-300 dark:border-zinc-700"
                        >
                          <span class="ml-2 mr-5 md:mr-0"
                            >{row.name} {stock_detail_metrics_growth()}</span
                          >
                          <button
                            on:click={() => handleChart(row, true)}
                            class="cursor-pointer inline-block border-none"
                          >
                            <svg
                              class="w-5 h-5 text-gray-500 dark:text-gray-300"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                                id="SVGRepo_tracerCarrier"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              ></g><g id="SVGRepo_iconCarrier">
                                <path
                                  d="M9 12H4.6C4.03995 12 3.75992 12 3.54601 12.109C3.35785 12.2049 3.20487 12.3578 3.10899 12.546C3 12.7599 3 13.0399 3 13.6V19.4C3 19.9601 3 20.2401 3.10899 20.454C3.20487 20.6422 3.35785 20.7951 3.54601 20.891C3.75992 21 4.03995 21 4.6 21H9M9 21H15M9 21L9 8.6C9 8.03995 9 7.75992 9.10899 7.54601C9.20487 7.35785 9.35785 7.20487 9.54601 7.10899C9.75992 7 10.0399 7 10.6 7H13.4C13.9601 7 14.2401 7 14.454 7.10899C14.6422 7.20487 14.7951 7.35785 14.891 7.54601C15 7.75992 15 8.03995 15 8.6V21M15 21H19.4C19.9601 21 20.2401 21 20.454 20.891C20.6422 20.7951 20.7951 20.6422 20.891 20.454C21 20.2401 21 19.9601 21 19.4V4.6C21 4.03995 21 3.75992 20.891 3.54601C20.7951 3.35785 20.6422 3.20487 20.454 3.10899C20.2401 3 19.9601 3 19.4 3H16.6C16.0399 3 15.7599 3 15.546 3.10899C15.3578 3.20487 15.2049 3.35785 15.109 3.54601C15 3.75992 15 4.03995 15 4.6V8"
                                  stroke="currentColor"
                                  stroke-width="1.8"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                ></path>
                              </g></svg>

                          </button>
                        </td>
                        {#each row.cells as cell}
                          <td
                            class="text-sm text-end border-b border-r border-gray-300 dark:border-zinc-700 {cell.growthClass}"
                          >
                            {#if cell.isPremium && cell.growth !== "-"}
                              <a
                                href="/pricing"
                                class="inline-flex items-center justify-end text-sm font-semibold text-gray-600 dark:text-zinc-300"
                              >
                                {stock_detail_metrics_upgrade()}
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

          <div
            class="text-sm border border-gray-300 shadow dark:border-zinc-700 p-3 -mt-5"
          >
            <strong>Source:</strong>
            {@html stock_detail_metrics_source({
              link: `<a href="https://mainstreetdata.com/" target="_blank" rel="noopener" class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition">Main Street Data</a>`,
            })}
          </div>
        {:else}
          <Infobox
            text={stock_detail_metrics_no_data({
              company: removeCompanyStrings($displayCompanyName),
            })}
          />
        {/if}
      </div>
    </div>
  </div>
</section>

<svelte:window on:keydown={handleKeydown} />

{#if isModalOpen}
  <div
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
    on:click={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    aria-labelledby="metrics-modal-title"
  >
    <div
      class="relative w-full max-w-4xl max-h-[90vh] overflow-auto bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800"
      on:click|stopPropagation
    >
      <!-- Header -->
      <div class="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-4 sm:px-6 py-4">
        <div class="flex items-start justify-between">
          <div>
            <h2 id="metrics-modal-title" class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              {modalLabel}
            </h2>
            <p class="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
              {$stockTicker} - {$selectedTimePeriod === "quarterly" ? "Quarterly" : "TTM"}
            </p>
          </div>
          <button
            type="button"
            class="cursor-pointer p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
            on:click={handleCloseModal}
            aria-label="Close modal"
          >
            <X class="w-5 h-5 text-gray-500 dark:text-zinc-400" />
          </button>
        </div>

        <!-- Controls Row -->
        <div class="flex flex-wrap items-center gap-2 mt-4">
          <Button
            on:click={toggleMode}
            class="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-zinc-700 rounded-2xl bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700"
          >
            {#if chartMode === "bar"}
              <LineChart class="w-4 h-4" />
              <span>{stock_detail_metrics_line_chart()}</span>
            {:else}
              <BarChart class="w-4 h-4" />
              <span>{stock_detail_metrics_bar_chart()}</span>
            {/if}
          </Button>
        </div>
      </div>

      <!-- Chart Area -->
      <div class="px-4 sm:px-6 py-4">
        {#if config}
          <div class="w-full" use:highcharts={config}></div>
        {:else}
          <div class="h-[400px] flex items-center justify-center">
            <span class="loading loading-spinner loading-md text-gray-400"></span>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
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
  import {
    stock_detail_metrics_history,
    stock_detail_metrics_no_category_data,
    stock_detail_metrics_period_ended,
    stock_detail_metrics_quarter_ended,
    stock_detail_metrics_quarterly,
    stock_detail_metrics_slug_seo_description,
    stock_detail_metrics_slug_seo_title,
    stock_detail_metrics_source,
    stock_detail_metrics_ttm,
    insider_tracker_previous,
    insider_tracker_next,
    insider_tracker_page_of,
    insider_tracker_rows,
    insider_tracker_back_to_top,
  } from "$lib/paraglide/messages";

  export let data;
  $selectedTimePeriod = "ttm";

  let selectedInterval = "5Y";
  let categoryMetrics = [];
  let categoryName = "";
  let config = null;
  let tableData = [];
  let filteredDates = [];
  let isSubscribed = ["Plus", "Pro"].includes(data?.user?.tier);

  const isSmallScreen = $screenWidth < 640;

  // Cache for computed values
  const computeCache = new Map();

  $: tabs = [stock_detail_metrics_quarterly(), stock_detail_metrics_ttm()];
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

  function plot(metrics, dates, isDarkMode, timePeriod, slug) {
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
    const chartColor = isDarkMode ? "#FBBF24" : "#F59E0B";
    const colors = [
      chartColor,
      "#3B82F6",
      "#EF4444",
      "#10B981",
      "#8B5CF6",
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

      const seriesColor = colors[index % colors.length];
      const isAmber = seriesColor === "#F59E0B" || seriesColor === "#FBBF24";

      return {
        name: metric.name,
        type: usePercentChart ? "spline" : "column",
        data: data,
        color: seriesColor,
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
        ...(isAmber ? { dataLabels: { style: { color: "#000" } } } : {}),
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
        style: { color: isDarkMode ? "#f4f4f5" : "#111827" },
      },

      xAxis: {
        categories: formattedDates,
        crosshair: {
          color: isDarkMode ? "#3f3f46" : "#d1d5db",
          width: 1,
          dashStyle: "Solid",
        },
        labels: {
          style: { color: isDarkMode ? "#a1a1aa" : "#6b7280" },
        },
        lineColor: isDarkMode ? "#27272a" : "#e5e7eb",
      },

      yAxis: {
        min: usePercentChart ? undefined : 0,
        title: { text: null },
        gridLineColor: isDarkMode ? "#27272a" : "#f3f4f6",
        labels: {
          style: { color: isDarkMode ? "#a1a1aa" : "#6b7280" },
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
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        style: {
          color: "#fff",
          fontSize: "13px",
        },
        borderRadius: 8,
        outside: false,
      },

      series: series,

      legend: {
        enabled: isSmallScreen ? false : true,
        itemStyle: { color: isDarkMode ? "#d4d4d8" : "#374151" },
        itemHoverStyle: { color: isDarkMode ? "#f4f4f5" : "#111827" },
      },
    };

    // Pre-compute formatted dates for tooltip
    const dateMap = new Map();
    chartDates.forEach((date, idx) => {
      dateMap.set(formattedDates[idx], formatDate(date));
    });

    // Add specific configurations for column charts
    if (!usePercentChart) {
      const hideLabels = selectedInterval !== "5Y";

      baseConfig.yAxis.stackLabels = {
        enabled: !hideLabels,
        style: {
          color: isDarkMode ? "#d4d4d8" : "#374151",
          fontWeight: "bold",
        },
        formatter: function () {
          return abbreviateNumber(this.total, false, true);
        },
      };

      baseConfig.plotOptions.column = {
        stacking: "normal",
        dataLabels: {
          enabled: !hideLabels,
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
        const formattedDate =
          dateMap.get(this.points[0]?.key) || this.points[0]?.key;

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
        const formattedDate =
          dateMap.get(this.points[0]?.key) || this.points[0]?.key;
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
      config = plot(
        categoryMetrics,
        filteredDates,
        isDarkMode,
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

  // ── Sorting ──
  let sortKey = "";
  let sortOrder: "none" | "asc" | "desc" = "none";

  function sortData(key: string) {
    if (sortKey === key) {
      const cycle = ["none", "asc", "desc"];
      const idx = cycle.indexOf(sortOrder);
      sortOrder = cycle[(idx + 1) % cycle.length] as typeof sortOrder;
    } else {
      sortKey = key;
      sortOrder = "asc";
    }
    currentPage = 1;
  }

  $: sortedTableData = (() => {
    if (sortOrder === "none" || !sortKey) return tableData;
    const sorted = [...tableData].sort((a, b) => {
      let valA: any, valB: any;
      if (sortKey === "date") {
        valA = a.date;
        valB = b.date;
      } else {
        valA = a.metrics[sortKey]?.value;
        valB = b.metrics[sortKey]?.value;
      }
      // Nulls always last
      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  })();

  // Reset sort and page when underlying data changes
  $: if (tableData) {
    sortKey = "";
    sortOrder = "none";
    currentPage = 1;
  }

  // ── Pagination ──
  let currentPage = 1;
  let rowsPerPage = 20;
  const rowsPerPageOptions = [20, 50, 100];

  $: totalPages = Math.max(1, Math.ceil(sortedTableData.length / rowsPerPage));

  $: paginatedData = sortedTableData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
    }
  }

  function changeRowsPerPage(newRows: number) {
    rowsPerPage = newRows;
    currentPage = 1;
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const sortIconSvg = (order: string) => `
    <svg class="shrink-0 w-4 h-4 ${
      order === "asc"
        ? "rotate-180 inline-block"
        : order === "desc"
          ? "inline-block"
          : "hidden"
    }" viewBox="0 0 20 20" fill="currentColor" style="max-width:50px">
      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
    </svg>
  `;
</script>

<SEO
  title={stock_detail_metrics_slug_seo_title({
    company: $displayCompanyName,
    ticker: $stockTicker,
    category: categoryName,
  })}
  description={stock_detail_metrics_slug_seo_description({
    company: $displayCompanyName,
    ticker: $stockTicker,
    category: categoryName,
  })}
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
                    {categoryName}
                  </h2>
                  <div
                    class="mt-1 w-full flex flex-row items-center justify-end pb-1 pt-1 sm:pt-0 gap-1"
                  >
                    <!-- Tabs (segmented pill) -->
                    <div
                      class="w-fit text-sm flex items-center gap-1 rounded-full border border-gray-300 shadow dark:border-zinc-700
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
                            class="flex-shrink-0 transition-all border border-gray-300 shadow dark:border-zinc-700
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
                        class="mt-5 shadow-none sm:mt-0 sm:border sm:border-gray-300 dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40"
                        use:highcharts={config}
                      ></div>
                    </div>
                  </div>
                </div>
              {/if}

              <div
                class=" mt-5 flex flex-row items-center w-full justify-between border-t border-b border-gray-300 dark:border-zinc-700 py-2"
              >
                <h3 class="text-xl sm:text-2xl font-bold">
                  {stock_detail_metrics_history()}
                </h3>
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
                  class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 text-gray-700 dark:text-zinc-200 tabular-nums m-auto mt-4"
                >
                  <thead>
                    <tr
                      class="bg-white/60 dark:bg-zinc-950/40 border-b border-gray-300 dark:border-zinc-700 text-gray-500 dark:text-zinc-400"
                    >
                      <th
                        on:click={() => sortData("date")}
                        class="cursor-pointer select-none font-semibold text-[0.7rem] sm:text-xs uppercase tracking-wide whitespace-nowrap text-start transition-all duration-150"
                      >
                        <span class="inline-flex items-center gap-1">
                          {$selectedTimePeriod === "quarterly"
                            ? stock_detail_metrics_quarter_ended()
                            : stock_detail_metrics_period_ended()}
                          {@html sortIconSvg(
                            sortKey === "date" ? sortOrder : "none",
                          )}
                        </span>
                      </th>
                      {#each categoryMetrics as metric}
                        <th
                          on:click={() => sortData(metric.name)}
                          class="cursor-pointer select-none font-semibold text-[0.7rem] sm:text-xs uppercase tracking-wide whitespace-nowrap text-end transition-all duration-150"
                        >
                          <span
                            class="inline-flex items-center justify-end gap-1"
                          >
                            {metric.name}
                            {@html sortIconSvg(
                              sortKey === metric.name ? sortOrder : "none",
                            )}
                          </span>
                        </th>
                      {/each}
                    </tr>
                  </thead>
                  <tbody>
                    {#each paginatedData as row}
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
              <!-- Pagination -->
              {#if paginatedData?.length > 0}
                <div
                  class="flex flex-row items-center justify-between mt-8 sm:mt-5"
                >
                  <!-- Previous and Next buttons -->
                  <div class="flex items-center gap-2">
                    <Button
                      on:click={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <svg
                        class="h-5 w-5 inline-block shrink-0 rotate-90"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        style="max-width:40px"
                        aria-hidden="true"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clip-rule="evenodd"
                        ></path>
                      </svg>
                      <span class="hidden sm:inline"
                        >{insider_tracker_previous()}</span
                      ></Button
                    >
                  </div>

                  <!-- Page info and rows selector in center -->
                  <div class="flex flex-row items-center gap-4">
                    <span class="text-sm text-gray-600 dark:text-zinc-300">
                      {insider_tracker_page_of({
                        current: currentPage,
                        total: totalPages,
                      })}
                    </span>

                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild let:builder>
                        <Button
                          builders={[builder]}
                          class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <span class="truncate text-[0.85rem] sm:text-sm"
                            >{rowsPerPage} {insider_tracker_rows()}</span
                          >
                          <svg
                            class="ml-0.5 mt-1 h-5 w-5 inline-block shrink-0"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            style="max-width:40px"
                            aria-hidden="true"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clip-rule="evenodd"
                            ></path>
                          </svg>
                        </Button>
                      </DropdownMenu.Trigger>

                      <DropdownMenu.Content
                        side="bottom"
                        align="end"
                        sideOffset={10}
                        alignOffset={0}
                        class="w-auto min-w-40 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
                      >
                        <!-- Dropdown items -->
                        <DropdownMenu.Group class="pb-2">
                          {#each rowsPerPageOptions as item}
                            <DropdownMenu.Item
                              class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition"
                            >
                              <label
                                on:click={() => changeRowsPerPage(item)}
                                class="inline-flex justify-between w-full items-center cursor-pointer"
                              >
                                <span class="text-sm"
                                  >{item} {insider_tracker_rows()}</span
                                >
                              </label>
                            </DropdownMenu.Item>
                          {/each}
                        </DropdownMenu.Group>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </div>

                  <!-- Next button -->
                  <div class="flex items-center gap-2">
                    <Button
                      on:click={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <span class="hidden sm:inline"
                        >{insider_tracker_next()}</span
                      >
                      <svg
                        class="h-5 w-5 inline-block shrink-0 -rotate-90"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        style="max-width:40px"
                        aria-hidden="true"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clip-rule="evenodd"
                        ></path>
                      </svg>
                    </Button>
                  </div>
                </div>

                <!-- Back to Top button -->
                <div class="flex justify-center mt-4">
                  <button
                    on:click={scrollToTop}
                    class="cursor-pointer text-sm font-medium text-gray-800 dark:text-zinc-300 transition hover:text-violet-600 dark:hover:text-violet-400"
                  >
                    {insider_tracker_back_to_top()}
                    <svg
                      class="h-5 w-5 inline-block shrink-0 rotate-180"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      style="max-width:40px"
                      aria-hidden="true"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                  </button>
                </div>
              {/if}

              <div
                class="text-sm border border-gray-300 shadow dark:border-zinc-700 p-3 mt-10 rounded-2xl"
              >
                <strong>Source:</strong>
                {@html stock_detail_metrics_source({
                  link: `<a href="https://mainstreetdata.com/" target="_blank" rel="noopener" class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition">Main Street Data</a>`,
                })}
              </div>
            {:else}
              <Infobox
                text={stock_detail_metrics_no_category_data({
                  category: categoryName,
                })}
              />
            {/if}
          </div>
        </main>
      </div>
    </div>
  </section>
{/key}

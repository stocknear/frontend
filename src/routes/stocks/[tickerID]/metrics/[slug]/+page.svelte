<script lang="ts">
  import { displayCompanyName, stockTicker, screenWidth } from "$lib/store";
  import SEO from "$lib/components/SEO.svelte";
  import BusinessMetricsTable from "$lib/components/Table/BusinessMetricsTable.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import highcharts from "$lib/highcharts.ts";
  import { abbreviateNumber } from "$lib/utils";
  import { mode } from "mode-watcher";

  export let data;

  let categorySlug = data?.getParams;
  let categoryMetrics = [];
  let categoryName = "";
  let selectedTimePeriod = "ttm";
  let config = null;

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

    // Filter out percentage metrics - only show non-percentage values
    const nonPercentMetrics = metrics.filter((metric) => {
      const valueType = metric.values?.[0]?.valueType;
      return valueType && valueType !== "PERCENT";
    });

    if (nonPercentMetrics.length === 0) return null;

    // Determine if we should use currency formatting (check first metric)
    const firstValueType = nonPercentMetrics[0]?.values?.[0]?.valueType;

    // Collect all unique dates from all metrics
    const dateSet = new Set();
    for (const metric of nonPercentMetrics) {
      for (const v of metric.values) {
        dateSet.add(v.date);
      }
    }

    // Sort dates (most recent first, then reverse for chart)
    const dates = Array.from(dateSet).sort().reverse().slice(0, 12).reverse();

    // Create series data for each metric
    const colors = [
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#ec4899",
      "#06b6d4",
      "#84cc16",
    ];

    const series = nonPercentMetrics.map((metric, index) => {
      const valueMap = new Map();
      for (const v of metric.values) {
        valueMap.set(v.date, v.val);
      }

      const data = dates.map((date) => valueMap.get(date) ?? null);

      return {
        name: metric.name,
        type: "column",
        data: data,
        color: colors[index % colors.length],
        borderRadius: 0,
        animation: false,
      };
    });

    // Build the Highcharts options
    return {
      credits: { enabled: false },
      chart: {
        type: "column",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        animation: false,
        height: $screenWidth < 640 ? 360 : 500,
      },

      title: {
        text: categoryName,
        style: {
          color: $mode === "light" ? "#000" : "#fff",
          fontSize: "18px",
          fontWeight: "bold",
        },
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
            return abbreviateNumber(this.value, false, true);
          },
        },
        stackLabels: {
          enabled: true,
          style: {
            color: $mode === "light" ? "#000" : "#fff",
            fontWeight: "bold",
          },
          formatter: function () {
            return abbreviateNumber(this.total, false, true);
          },
        },
      },

      plotOptions: {
        column: {
          stacking: "normal",
          dataLabels: { enabled: false },
          borderWidth: 0,
          animation: false,
        },
        series: {
          animation: false,
          states: {
            hover: {
              enabled: false,
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
        formatter: function () {
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
        },
      },

      series: series,

      legend: {
        enabled: true,
        itemStyle: { color: $mode === "light" ? "#000" : "#fff" },
        itemHoverStyle: { color: $mode === "light" ? "#374151" : "#d1d5db" },
      },
    };
  }

  $: if ($stockTicker && data?.getData?.[selectedTimePeriod] && categorySlug) {
    const metricsData = data.getData[selectedTimePeriod];
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
  } else {
    categoryMetrics = [];
    categoryName = "";
    config = null;
  }

  // Regenerate chart when mode or period changes
  $: if (
    categoryMetrics.length > 0 &&
    data?.getData?.[selectedTimePeriod] &&
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
            <div class="mb-3">
              <h1 class="text-xl sm:text-2xl font-bold">
                {categoryName}
              </h1>
            </div>

            {#if categoryMetrics?.length > 0}
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

              <BusinessMetricsTable
                title={categoryName}
                first={true}
                {selectedTimePeriod}
                metrics={categoryMetrics}
                showGrowth={true}
                {data}
                on:periodChange={(e) => (selectedTimePeriod = e.detail)}
              />
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

// Utility functions needed in worker
function abbreviateNumber(value: number, isCash: boolean = false, isPrice: boolean = false): string {
  if (value === null || value === undefined || isNaN(value)) return "-";

  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absValue >= 1e12) {
    return sign + (absValue / 1e12).toFixed(2) + "T";
  } else if (absValue >= 1e9) {
    return sign + (absValue / 1e9).toFixed(2) + "B";
  } else if (absValue >= 1e6) {
    return sign + (absValue / 1e6).toFixed(2) + "M";
  } else if (absValue >= 1e3) {
    return sign + (absValue / 1e3).toFixed(2) + "K";
  }
  return sign + absValue.toFixed(2);
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

function normalizeSlug(category: string): string {
  return category?.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "");
}

function slugToCategory(slug: string): string {
  return slug
    ?.split("-")
    ?.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    ?.join(" ");
}

function filterDataByYears(dates: string[], interval: string): string[] {
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

onmessage = (event: MessageEvent) => {
  const {
    metricsData,
    slugLower,
    selectedInterval,
    isDarkMode,
    isSmallScreen,
  } = event.data;

  try {
    // Extract category metrics
    let categoryMetrics: any[] = [];
    let categoryName = "";

    if (slugLower === "operating-metrics") {
      categoryName = "Operating Metrics";
      const tempCategorized: Record<string, any[]> = {};

      for (const metric of metricsData) {
        const category = metric.category || "Other";
        if (!tempCategorized[category]) {
          tempCategorized[category] = [];
        }
        tempCategorized[category].push(metric);
      }

      for (const metrics of Object.values(tempCategorized)) {
        if (metrics.length === 1) {
          categoryMetrics.push(...metrics);
        }
      }
    } else {
      let foundCategoryName = "";
      for (const metric of metricsData) {
        if (normalizeSlug(metric.category) === slugLower) {
          categoryMetrics.push(metric);
          if (!foundCategoryName) {
            foundCategoryName = metric.category;
          }
        }
      }
      categoryName = foundCategoryName || slugToCategory(slugLower);
    }

    if (categoryMetrics.length === 0) {
      postMessage({
        success: true,
        categoryMetrics: [],
        categoryName,
        filteredDates: [],
        tableData: [],
        chartData: null,
      });
      return;
    }

    // Collect and filter dates
    const dateSet = new Set<string>();
    for (const metric of categoryMetrics) {
      for (const v of metric.values) {
        dateSet.add(v.date);
      }
    }
    const sortedDates = Array.from(dateSet).sort().reverse();
    const filteredDates = filterDataByYears(sortedDates, selectedInterval);

    // Pre-build value maps for all metrics
    const metricValueMaps = new Map();
    for (const metric of categoryMetrics) {
      const valueMap = new Map();
      for (const v of metric.values) {
        valueMap.set(v.date, { val: v.val, valueType: v.valueType });
      }
      metricValueMaps.set(metric.name, valueMap);
    }

    // Build table data
    const numDates = filteredDates.length;
    const numMetrics = categoryMetrics.length;
    const tableData = new Array(numDates);

    for (let i = 0; i < numDates; i++) {
      const date = filteredDates[i];
      const metrics: Record<string, any> = {};

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
            valueType: "NUMBER"
          };
        }
      }

      tableData[i] = {
        date,
        formattedDate: formatDate(date),
        metrics
      };
    }

    // Prepare chart data
    let usePercentChart = false;
    let metricsToPlot: any[] = [];

    for (const metric of categoryMetrics) {
      const valueType = metric.values?.[0]?.valueType;
      if (valueType === "PERCENT") {
        usePercentChart = true;
        metricsToPlot.push(metric);
      } else if (valueType && !usePercentChart) {
        metricsToPlot.push(metric);
      }
    }

    if (usePercentChart) {
      metricsToPlot = categoryMetrics.filter(
        (m) => m.values?.[0]?.valueType === "PERCENT"
      );
    }

    let chartData = null;
    if (metricsToPlot.length > 0) {
      const chartDates = filteredDates.slice(0, 12).reverse();
      const formattedDates = new Array(chartDates.length);

      for (let i = 0; i < chartDates.length; i++) {
        formattedDates[i] = formatDateShort(chartDates[i]);
      }

      // Professional color palette for light and dark modes
      const colors = isDarkMode
        ? ["#60a5fa", "#a78bfa", "#f472b6", "#fb923c", "#34d399", "#fbbf24", "#38bdf8", "#c084fc"]
        : ["#1e40af", "#6366f1", "#be185d", "#c2410c", "#047857", "#b45309", "#0369a1", "#7c3aed"];

      const seriesData = new Array(metricsToPlot.length);

      for (let i = 0; i < metricsToPlot.length; i++) {
        const metric = metricsToPlot[i];
        const valueMap = metricValueMaps.get(metric.name);
        const data = new Array(chartDates.length);

        for (let j = 0; j < chartDates.length; j++) {
          data[j] = valueMap.get(chartDates[j])?.val ?? null;
        }

        seriesData[i] = {
          name: metric.name,
          type: usePercentChart ? "spline" : "column",
          data: data,
          color: colors[i % colors.length],
          borderRadius: usePercentChart ? undefined : "3px",
          animation: false,
          marker: usePercentChart
            ? {
                enabled: true,
                radius: 4,
                symbol: "circle",
                lineWidth: 2,
                lineColor: isDarkMode ? "#09090B" : "#ffffff",
              }
            : undefined,
          lineWidth: usePercentChart ? 2.5 : undefined,
        };
      }

      chartData = {
        metricsToPlot,
        chartDates,
        formattedDates,
        seriesData,
        usePercentChart,
      };
    }

    postMessage({
      success: true,
      categoryMetrics,
      categoryName,
      filteredDates,
      tableData,
      chartData,
    });
  } catch (error: any) {
    postMessage({
      success: false,
      error: error.message,
    });
  }
};

export {};

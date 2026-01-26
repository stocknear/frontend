<script lang="ts">
  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
  import { displayCompanyName, screenWidth } from "$lib/store";

  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";
  import BarChartIcon from "lucide-svelte/icons/chart-column-increasing";
  import LineChartIcon from "lucide-svelte/icons/chart-spline";
  import ScatterChartIcon from "lucide-svelte/icons/circle-dot";
  import {
    stock_detail_options_chart_current_price,
    stock_detail_options_chart_type_column,
    stock_detail_options_chart_type_line,
    stock_detail_options_chart_type_scatter,
    stock_detail_options_common_back_to_top,
    stock_detail_options_common_call,
    stock_detail_options_common_day,
    stock_detail_options_common_days,
    stock_detail_options_common_next,
    stock_detail_options_common_page_of,
    stock_detail_options_common_previous,
    stock_detail_options_common_put,
    stock_detail_options_common_rows,
    stock_detail_options_max_pain_by_expiry_title,
    stock_detail_options_max_pain_by_strike_title,
    stock_detail_options_max_pain_chart_expiry_title,
    stock_detail_options_max_pain_chart_strike_title,
    stock_detail_options_max_pain_col_expiration,
    stock_detail_options_max_pain_col_max_pain,
    stock_detail_options_max_pain_col_vs_current_price,
    stock_detail_options_max_pain_date_expiration,
    stock_detail_options_max_pain_expiry_levels_above,
    stock_detail_options_max_pain_expiry_levels_around,
    stock_detail_options_max_pain_expiry_levels_below,
    stock_detail_options_max_pain_expiry_magnetic_level,
    stock_detail_options_max_pain_expiry_spread_consensus,
    stock_detail_options_max_pain_expiry_spread_divergent,
    stock_detail_options_max_pain_expiry_timing,
    stock_detail_options_max_pain_expiry_trend_falling,
    stock_detail_options_max_pain_expiry_trend_rising,
    stock_detail_options_max_pain_expiry_trend_stable,
    stock_detail_options_max_pain_high_dispersion,
    stock_detail_options_max_pain_magnetic_zone,
    stock_detail_options_max_pain_overview_sentence,
    stock_detail_options_max_pain_position_above,
    stock_detail_options_max_pain_position_below,
    stock_detail_options_max_pain_position_pinned,
    stock_detail_options_max_pain_pressure_down,
    stock_detail_options_max_pain_pressure_stable,
    stock_detail_options_max_pain_pressure_up,
    stock_detail_options_max_pain_table_title,
    stock_detail_options_max_pain_trend_detail_falling,
    stock_detail_options_max_pain_trend_detail_rising,
    stock_detail_options_max_pain_trend_detail_stable,
    stock_detail_options_max_pain_trend_falling,
    stock_detail_options_max_pain_trend_rising,
    stock_detail_options_max_pain_trend_sentence,
    stock_detail_options_max_pain_trend_stable,
    stock_detail_options_max_pain_upgrade_locked,
    stock_detail_options_max_pain_upgrade_unlock,
  } from "$lib/paraglide/messages";

  export let data;
  export let ticker = null;

  // Chart type state for Max Pain By Strike
  type ChartType = "column" | "spline" | "scatter";
  let chartTypeStrike: ChartType = "column";

  const chartTypes: { type: ChartType; icon: any }[] = [
    { type: "column", icon: BarChartIcon },
    { type: "spline", icon: LineChartIcon },
    { type: "scatter", icon: ScatterChartIcon },
  ];

  const getChartTypeLabel = (type: ChartType) => {
    const labels: Record<ChartType, () => string> = {
      column: stock_detail_options_chart_type_column,
      spline: stock_detail_options_chart_type_line,
      scatter: stock_detail_options_chart_type_scatter,
    };
    return labels[type]?.() ?? type;
  };

  function changeChartTypeStrike(type: ChartType) {
    chartTypeStrike = type;
    configStrike = plotStrikePrice() || null;
  }

  // Chart type state for Max Pain By Expiry
  let chartTypeExpiry: ChartType = "column";

  function changeChartTypeExpiry(type: ChartType) {
    chartTypeExpiry = type;
    configExpiry = plotExpiry() || null;
  }

  let currentPrice = null;
  let rawData = [];
  // Track the currently sorted data separately
  let sortedData = [];

  let dateList = [];
  let selectedDate;
  let selectedMaxPain;

  let displayList = [];

  // Pagination state
  let currentPage = 1;
  let rowsPerPage = 20;
  let rowsPerPageOptions = [20, 50, 100];
  let totalPages = 1;
  let pagePathName = $page?.url?.pathname;

  let configStrike = null;
  let configExpiry = null;

  // Calculate metrics for insight paragraph
  $: nearTermMaxPain = rawData?.[0]?.maxPain || 0;
  $: nearTermExpiry = rawData?.[0]?.expiration || null;
  $: nearTermDaysLeft = nearTermExpiry ? daysLeft(nearTermExpiry) : 0;

  $: priceVsMaxPain =
    currentPrice && nearTermMaxPain
      ? ((currentPrice - nearTermMaxPain) / nearTermMaxPain) * 100
      : 0;

  // Calculate average max pain across all expirations
  $: averageMaxPain =
    rawData.length > 0
      ? rawData.reduce((sum, item) => sum + (item.maxPain || 0), 0) /
        rawData.length
      : 0;

  // Find the trend in max pain (comparing near-term to longer-term)
  $: maxPainTrend = (() => {
    if (rawData.length < 3) return "stable";
    const nearTerm =
      rawData
        .slice(0, Math.min(3, rawData.length))
        .reduce((sum, item) => sum + item.maxPain, 0) /
      Math.min(3, rawData.length);
    const longerTerm =
      rawData
        .slice(3, Math.min(6, rawData.length))
        .reduce((sum, item) => sum + item.maxPain, 0) /
      Math.min(3, rawData.length - 3);

    if (longerTerm === 0) return "stable";
    const change = ((nearTerm - longerTerm) / longerTerm) * 100;

    if (Math.abs(change) < 2) return "stable";
    return change > 0 ? "rising" : "falling";
  })();

  // Find expirations where max pain is significantly different from current price
  $: significantDeviations = rawData.filter((item) => {
    const deviation = Math.abs(
      ((item.maxPain - currentPrice) / currentPrice) * 100,
    );
    return deviation > 5; // More than 5% away
  }).length;

  // Calculate the range of max pain values
  $: maxPainRange =
    rawData.length > 0
      ? {
          min: Math.min(...rawData.map((item) => item.maxPain)),
          max: Math.max(...rawData.map((item) => item.maxPain)),
        }
      : { min: 0, max: 0 };

  // Identify if there's a clustering of max pain at certain levels
  $: maxPainClusters = (() => {
    if (rawData.length < 3) return [];
    const threshold = 1; // Within 1% considered a cluster
    const clusters = {};

    rawData.forEach((item) => {
      const rounded = Math.round(item.maxPain);
      if (!clusters[rounded]) clusters[rounded] = 0;
      clusters[rounded]++;
    });

    return Object.entries(clusters)
      .filter(([_, count]) => count >= 2)
      .map(([price, count]) => ({ price: parseFloat(price), count }))
      .sort((a, b) => b.count - a.count);
  })();

  $: nearTermDayLabel =
    Number(nearTermDaysLeft) === 1
      ? stock_detail_options_common_day()
      : stock_detail_options_common_days();

  $: maxPainPositionText =
    Math.abs(priceVsMaxPain) < 2
      ? stock_detail_options_max_pain_position_pinned()
      : priceVsMaxPain > 0
        ? stock_detail_options_max_pain_position_above({
            percent: Math.abs(priceVsMaxPain).toFixed(1),
          })
        : stock_detail_options_max_pain_position_below({
            percent: Math.abs(priceVsMaxPain).toFixed(1),
          });

  $: maxPainPressureText =
    Math.abs(priceVsMaxPain) > 5
      ? priceVsMaxPain > 0
        ? stock_detail_options_max_pain_pressure_down()
        : stock_detail_options_max_pain_pressure_up()
      : stock_detail_options_max_pain_pressure_stable();

  $: maxPainTrendLabel =
    maxPainTrend === "rising"
      ? stock_detail_options_max_pain_trend_rising()
      : maxPainTrend === "falling"
        ? stock_detail_options_max_pain_trend_falling()
        : stock_detail_options_max_pain_trend_stable();

  $: maxPainTrendDetail =
    maxPainTrend === "rising"
      ? stock_detail_options_max_pain_trend_detail_rising()
      : maxPainTrend === "falling"
        ? stock_detail_options_max_pain_trend_detail_falling()
        : stock_detail_options_max_pain_trend_detail_stable();

  $: maxPainMagneticText =
    maxPainClusters.length > 0
      ? stock_detail_options_max_pain_magnetic_zone({
          price: maxPainClusters[0].price,
          count: maxPainClusters[0].count,
        })
      : "";

  $: maxPainDispersionText =
    significantDeviations > rawData.length * 0.5
      ? stock_detail_options_max_pain_high_dispersion()
      : "";

  $: maxPainExpirySpreadPercent =
    averageMaxPain > 0
      ? (
          ((maxPainRange.max - maxPainRange.min) / averageMaxPain) *
          100
        ).toFixed(0)
      : "0";

  $: maxPainExpiryTrendSentence =
    maxPainTrend === "rising"
      ? stock_detail_options_max_pain_expiry_trend_rising({
          ticker,
          min: maxPainRange.min,
          max: maxPainRange.max,
        })
      : maxPainTrend === "falling"
        ? stock_detail_options_max_pain_expiry_trend_falling({
            ticker,
            min: maxPainRange.min,
            max: maxPainRange.max,
          })
        : stock_detail_options_max_pain_expiry_trend_stable({
            ticker,
            avg: averageMaxPain.toFixed(2),
          });

  $: maxPainExpirySpreadSentence =
    averageMaxPain > 0 &&
    Math.abs(maxPainRange.max - maxPainRange.min) / averageMaxPain > 0.1
      ? stock_detail_options_max_pain_expiry_spread_divergent({
          spread: maxPainExpirySpreadPercent,
        })
      : stock_detail_options_max_pain_expiry_spread_consensus({
          spread: maxPainExpirySpreadPercent,
        });

  $: maxPainExpiryLevelsSentence =
    rawData?.filter((item) => item.maxPain < currentPrice).length >
    rawData.length * 0.7
      ? stock_detail_options_max_pain_expiry_levels_below({
          price: currentPrice,
        })
      : rawData?.filter((item) => item.maxPain > currentPrice).length >
          rawData?.length * 0.7
        ? stock_detail_options_max_pain_expiry_levels_above({
            price: currentPrice,
          })
        : stock_detail_options_max_pain_expiry_levels_around({
            price: currentPrice,
          });

  $: maxPainExpiryMagneticSentence =
    maxPainClusters.length > 0 && maxPainClusters[0].count >= 3
      ? stock_detail_options_max_pain_expiry_magnetic_level({
          price: maxPainClusters[0].price,
          count: maxPainClusters[0].count,
        })
      : "";

  // Pagination functions
  function updatePaginatedData() {
    const dataSource = sortedData?.length > 0 ? sortedData : rawData;
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    displayList = dataSource?.slice(startIndex, endIndex) || [];
    totalPages = Math.ceil((dataSource?.length || 0) / rowsPerPage);
  }

  function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      updatePaginatedData();
    }
  }

  function changeRowsPerPage(newRowsPerPage) {
    rowsPerPage = newRowsPerPage;
    currentPage = 1; // Reset to first page when changing rows per page
    updatePaginatedData();
    saveRowsPerPage(); // Save to localStorage
  }

  // Save rows per page preference to localStorage
  function saveRowsPerPage() {
    if (!pagePathName || typeof localStorage === "undefined") return;

    try {
      const paginationKey = `${pagePathName}_rowsPerPage`;
      localStorage.setItem(paginationKey, String(rowsPerPage));
    } catch (e) {
      console.warn("Failed to save rows per page preference:", e);
    }
  }

  // Load rows per page preference from localStorage
  function loadRowsPerPage() {
    const currentPath = pagePathName || $page?.url?.pathname;

    if (!currentPath || typeof localStorage === "undefined") {
      rowsPerPage = 20; // Default value
      return;
    }

    try {
      const paginationKey = `${currentPath}_rowsPerPage`;
      const savedRows = localStorage.getItem(paginationKey);

      if (savedRows && rowsPerPageOptions.includes(Number(savedRows))) {
        rowsPerPage = Number(savedRows);
      } else {
        rowsPerPage = 20; // Default if invalid or not found
      }
    } catch (e) {
      console.warn("Failed to load rows per page preference:", e);
      rowsPerPage = 20; // Default on error
    }
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function initialize() {
    currentPrice = Number(data?.getStockQuote?.price?.toFixed(2));
    rawData = data?.getData;

    // Calculate change and changesPercentage for each item
    rawData = rawData?.map((item) => {
      const change = item?.maxPain - currentPrice;
      const changesPercentage =
        ((item?.maxPain - currentPrice) / currentPrice) * 100;
      return {
        ...item,
        change,
        changesPercentage,
      };
    });

    dateList = rawData?.map((item) => item?.expiration);
    selectedDate = dateList?.at(0);
    selectedMaxPain = rawData?.at(0)?.maxPain;

    // Initialize sortedData with raw data
    sortedData = [...rawData];

    // Load pagination preference
    loadRowsPerPage();

    // Initialize pagination
    updatePaginatedData();

    configExpiry = plotExpiry() || null;
  }

  function daysLeft(targetDate) {
    // Parse the target date parts:
    const [year, month, day] = targetDate?.split("-")?.map(Number);

    // Build a UTC timestamp for midnight of that date:
    const targetUTCms = Date?.UTC(year, month - 1, day);

    // Now (in ms since epoch, UTC):
    const nowUTCms = Date?.now();

    // Milliseconds in one full day:
    const msPerDay = 24 * 60 * 60 * 1000;

    // Difference, then round up to the next integer day:
    const diff = targetUTCms - nowUTCms;
    const days = Math.ceil(diff / msPerDay);

    return `${days}`;
  }

  function formatDate(dateStr) {
    try {
      let date = new Date(dateStr + "T00:00:00Z");
      let options = {
        timeZone: "UTC",
        month: "short", // Full month name
        day: "numeric", // Day without leading zero
        year: "numeric", // Full year
      };

      let formatter = new Intl.DateTimeFormat("en-US", options);

      return formatter?.format(date);
    } catch (e) {
      return "n/a";
    }
  }

  function plotStrikePrice() {
    const raw = rawData?.find((item) => item?.expiration === selectedDate);
    if (!raw) return {};

    // Destructure strikes and payouts
    let strikes = raw.strikes; // e.g. [95,96,97,...]
    let callData = raw.callPayouts;
    let putData = raw.putPayouts;
    selectedMaxPain = raw.maxPain;

    // Ensure current price and maxPain are in our categories
    const extras = [currentPrice, selectedMaxPain].filter(
      (s) => typeof s === "number",
    );
    const allStrikes = Array.from(new Set([...strikes, ...extras])).sort(
      (a, b) => a - b,
    );

    // Re-map call/put data to align with allStrikes (fill missing with 0)
    const callSeries = allStrikes.map((s) => {
      const idx = strikes.indexOf(s);
      return idx > -1 ? callData[idx] : 0;
    });
    const putSeries = allStrikes.map((s) => {
      const idx = strikes.indexOf(s);
      return idx > -1 ? putData[idx] : 0;
    });

    // Build the Highcharts options
    return {
      credits: { enabled: false },

      chart: {
        type: chartTypeStrike,
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 360,
        animation: false,
        zoomType: "x",
        resetZoomButton: {
          theme: {
            fill: $mode === "light" ? "#f3f4f6" : "#27272a",
            stroke: $mode === "light" ? "#d1d5db" : "#3f3f46",
            style: {
              color: $mode === "light" ? "#111827" : "#f4f4f5",
            },
            r: 8,
            states: {
              hover: {
                fill: $mode === "light" ? "#e5e7eb" : "#3f3f46",
              },
            },
          },
          position: {
            align: "right",
            x: -10,
            y: 10,
          },
        },
      },

      title: {
        text: `<h3 class="mt-3 mb-1 text-sm font-semibold tracking-tight">${stock_detail_options_max_pain_chart_strike_title()}</h3>`,
        useHTML: true,
        style: { color: $mode === "light" ? "black" : "white" },
      },

      xAxis: {
        categories: allStrikes,
        plotLines: [
          {
            value:
              $screenWidth < 640
                ? null
                : allStrikes?.findIndex((s) => s === currentPrice),
            color: $mode === "light" ? "#000" : "#fff",
            dashStyle: "Dash",
            width: 1.5,
            label: {
              text: stock_detail_options_chart_current_price({
                price: currentPrice,
              }),
              style: { color: $mode === "light" ? "#000" : "#fff" },
            },
            zIndex: 5,
          },
          {
            value: allStrikes.findIndex((s) => s === selectedMaxPain),
            color: $mode === "light" ? "#000" : "#fff",
            dashStyle: "Dash",
            width: 1.5,
            label: {
              text: `Max Pain ${(selectedMaxPain || 0).toFixed(2)}`,
              style: { color: $mode === "light" ? "#000" : "#fff" },
            },
            zIndex: 5,
          },
        ],
        gridLineWidth: 0,
        crosshair: {
          color: $mode === "light" ? "black" : "white",
          width: 1,
          dashStyle: "Solid",
          snap: true, // snap crosshair without animation
        },
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
          formatter() {
            return this.pos % 1 === 0 ? this.value : "";
          },
        },
        tickAmount: 12,
      },

      yAxis: [
        {
          gridLineWidth: 1,
          gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
          labels: { style: { color: $mode === "light" ? "#545454" : "white" } },
          title: { text: null },
          opposite: true,
        },
        {
          gridLineWidth: 0,
          labels: { enabled: false },
          title: { text: null },
        },
      ],

      plotOptions: {
        column: { groupPadding: 0.1, pointPadding: 0.1, borderWidth: 0 },
        spline: {
          marker: {
            enabled: true,
            radius: 3,
          },
        },
        scatter: {
          marker: {
            radius: 4,
            symbol: "circle",
          },
        },
        series: {
          animation: false,
          states: { hover: { enabled: false } },
        },
      },

      tooltip: {
        shared: true,
        useHTML: true,
        animation: false,
        backgroundColor: "rgba(0, 0, 0, 1)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        borderRadius: 4,
        style: { color: "#fff", fontSize: "16px", padding: "10px" },
        formatter() {
          let s = `<span class="text-white font-[501]">Strike ${this.x}</span><br>`;
          this.points.forEach((point) => {
            s +=
              `<span style="display:inline-block;width:10px;height:10px;background-color:${point.color};border-radius:50%;margin-right:5px;"></span>` +
              `<span class="text-white font-semibold text-sm">${point.series.name}:</span>` +
              `<span class="text-white font-normal text-sm">${abbreviateNumber(point.y)}</span><br>`;
          });
          return s;
        },
      },

      series: [
        {
          name: stock_detail_options_common_call(),
          type: chartTypeStrike,
          data: callSeries,
          color: $mode === "light" ? "#08B108" : "#00FC50",
          borderColor: $mode === "light" ? "#08B108" : "#00FC50",
          borderRadius: 0,
          marker: {
            enabled: chartTypeStrike !== "column",
            radius: chartTypeStrike === "scatter" ? 4 : 3,
          },
          animation: false,
        },
        {
          name: stock_detail_options_common_put(),
          type: chartTypeStrike,
          data: putSeries,
          color: "#FF0808",
          borderColor: "#FF0808",
          borderRadius: 0,
          marker: {
            enabled: chartTypeStrike !== "column",
            radius: chartTypeStrike === "scatter" ? 4 : 3,
          },
          animation: false,
        },
      ],

      legend: {
        enabled: true,
        align: "center", // Positions legend at the left edge
        verticalAlign: "top", // Positions legend at the top
        layout: "horizontal", // Align items horizontally (use 'vertical' if preferred)
        itemStyle: {
          color: $mode === "light" ? "black" : "white",
        },
        symbolWidth: 14, // Controls the width of the legend symbol
        symbolRadius: 1, // Creates circular symbols (adjust radius as needed)
        squareSymbol: true, // Ensures symbols are circular, not square
      },
    };
  }

  function plotExpiry() {
    // Destructure strikes and payouts
    let maxPainList = rawData?.map((item) => item?.maxPain);

    // Build the Highcharts options
    return {
      credits: { enabled: false },
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        animation: false,
        height: 360,
        zoomType: "x",
        resetZoomButton: {
          theme: {
            fill: $mode === "light" ? "#f3f4f6" : "#27272a",
            stroke: $mode === "light" ? "#d1d5db" : "#3f3f46",
            style: {
              color: $mode === "light" ? "#111827" : "#f4f4f5",
            },
            r: 8,
            states: {
              hover: {
                fill: $mode === "light" ? "#e5e7eb" : "#3f3f46",
              },
            },
          },
          position: {
            align: "right",
            x: -10,
            y: 10,
          },
        },
      },

      title: {
        text: `<h3 class="mt-3 mb-1 text-sm font-semibold tracking-tight">${stock_detail_options_max_pain_chart_expiry_title()}</h3>`,
        useHTML: true,
        style: { color: $mode === "light" ? "black" : "white" },
      },

      xAxis: {
        endOnTick: false,
        categories: dateList,
        crosshair: {
          color: $mode === "light" ? "black" : "white", // Set the color of the crosshair line
          width: 1, // Adjust the line width as needed
          dashStyle: "Solid",
        },

        labels: {
          style: { color: $mode === "light" ? "black" : "white" },
          distance: 10, // Increases space between label and axis
          formatter: function () {
            return new Date(this.value).toLocaleDateString("en-US", {
              day: "2-digit", // Include day number
              month: "short", // Display short month name
              year: "numeric", // Include year
            });
          },
        },
      },
      yAxis: {
        plotLines: [
          {
            value: currentPrice,
            color: $mode === "light" ? "#000" : "#fff",
            dashStyle: "Dash",
            width: 1.5,
            label: {
              text: stock_detail_options_chart_current_price({
                price: currentPrice,
              }),
              style: { color: $mode === "light" ? "#000" : "#fff" },
            },
            zIndex: 5,
          },
        ],
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        labels: { style: { color: $mode === "light" ? "#545454" : "white" } },
        title: { text: null },
        opposite: true,
      },

      plotOptions: {
        column: { groupPadding: 0.1, pointPadding: 0.1, borderWidth: 0 },
        spline: {
          marker: {
            enabled: true,
            radius: 3,
          },
        },
        scatter: {
          marker: {
            radius: 4,
            symbol: "circle",
          },
        },
        series: {
          animation: false,
          states: { hover: { enabled: false } },
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
          fontSize: "16px",
          padding: "10px",
        },
        borderRadius: 4,
        formatter: function () {
          let tooltipContent = `<span class="m-auto text-[1rem] font-[501]">Max Pain ${this?.y?.toLocaleString("en-US")}</span><br>`;

          this.points.forEach((point) => {
            tooltipContent += `
        <span class="font-normal text-sm mt-1">${formatDate(this.points[0]?.key)}</span><br>`;
          });

          return tooltipContent;
        },
      },

      series: [
        {
          name: "Max Pain",
          type: chartTypeExpiry,
          data: maxPainList,
          color: $mode === "light" ? "#2C6288" : "#fff",
          borderColor: $mode === "light" ? "#2C6288" : "#fff",
          borderRadius: 0,
          marker: {
            enabled: chartTypeExpiry !== "column",
            radius: chartTypeExpiry === "scatter" ? 4 : 3,
          },
          animation: false,
        },
      ],

      legend: {
        enabled: false,
      },
    };
  }

  $: columns = [
    {
      key: "expiration",
      label: stock_detail_options_max_pain_col_expiration(),
      align: "left",
    },
    {
      key: "maxPain",
      label: stock_detail_options_max_pain_col_max_pain(),
      align: "right",
    },
    {
      key: "changesPercentage",
      label: stock_detail_options_max_pain_col_vs_current_price(),
      align: "right",
    },
  ];

  $: sortOrders = {
    expiration: { order: "none", type: "date" },
    maxPain: { order: "none", type: "number" },
    changesPercentage: { order: "none", type: "number" },
  };

  const sortData = (key) => {
    // Reset all other keys to 'none' except the current key
    for (const k in sortOrders) {
      if (k !== key) {
        sortOrders[k].order = "none";
      }
    }

    // Cycle through 'none', 'asc', 'desc' for the clicked key
    const orderCycle = ["none", "asc", "desc"];
    const currentOrderIndex = orderCycle.indexOf(sortOrders[key].order);
    sortOrders[key].order =
      orderCycle[(currentOrderIndex + 1) % orderCycle.length];
    const sortOrder = sortOrders[key].order;

    // Reset to original data when 'none' and stop further sorting
    if (sortOrder === "none") {
      sortedData = [...rawData];
      currentPage = 1; // Reset to first page
      updatePaginatedData();
      return;
    }

    // Define a generic comparison function
    const compareValues = (a, b) => {
      const { type } = sortOrders[key];
      let valueA, valueB;

      switch (type) {
        case "date":
          valueA = new Date(a[key]);
          valueB = new Date(b[key]);
          break;
        case "string":
          valueA = a[key]?.toUpperCase() || "";
          valueB = b[key]?.toUpperCase() || "";
          return sortOrder === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        case "sentiment":
          const sentimentOrder = { BULLISH: 1, NEUTRAL: 2, BEARISH: 3 };
          const sentimentA = sentimentOrder[a?.sentiment?.toUpperCase()] || 4;
          const sentimentB = sentimentOrder[b?.sentiment?.toUpperCase()] || 4;
          return sortOrder === "asc"
            ? sentimentA - sentimentB
            : sentimentB - sentimentA;

        case "number":
        default:
          valueA = parseFloat(a[key]) || 0;
          valueB = parseFloat(b[key]) || 0;
          break;
      }

      // Default comparison for numbers and fallback case
      if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
      if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    };

    // Sort all data and store it
    sortedData = [...rawData].sort(compareValues);
    // Reset to first page and update pagination
    currentPage = 1;
    updatePaginatedData();
  };

  $: {
    if ($mode || selectedDate || chartTypeStrike) {
      configStrike = plotStrikePrice() || null;
    }
  }

  $: {
    if ($mode || chartTypeExpiry) {
      configExpiry = plotExpiry() || null;
    }
  }

  // Reactive statement to update pagination when rawData changes
  $: if (rawData?.length > 0) {
    // Ensure sortedData is in sync with rawData
    if (sortedData?.length === 0) {
      sortedData = [...rawData];
    }
    updatePaginatedData();
  }

  // Reactive statement to load pagination settings when page changes
  $: if ($page?.url?.pathname && $page?.url?.pathname !== pagePathName) {
    pagePathName = $page?.url?.pathname;
    loadRowsPerPage(); // Load pagination preference for new page
    updatePaginatedData(); // Update display with loaded preference
  }

  initialize();
</script>

<section class="w-full overflow-hidden min-h-screen sm:pb-20">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto mt-2 sm:mt-0">
        <h2
          class="flex flex-row items-center text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white w-fit mb-2 sm:mb-0"
        >
          {stock_detail_options_max_pain_by_strike_title({
            company: removeCompanyStrings($displayCompanyName),
          })}
        </h2>

        <!-- Insightful overview paragraph -->
        <div class="w-full mt-4 mb-6">
          <p class="text-sm text-gray-800 dark:text-zinc-300 leading-relaxed">
            {@html stock_detail_options_max_pain_overview_sentence({
              ticker,
              price: currentPrice,
              position: maxPainPositionText,
              maxPain: nearTermMaxPain,
              date: formatDate(nearTermExpiry),
              days: nearTermDaysLeft,
              dayLabel: nearTermDayLabel,
            })}
            {maxPainPressureText ? ` ${maxPainPressureText}` : ""}
            {@html ` ${stock_detail_options_max_pain_trend_sentence({
              trend: maxPainTrendLabel,
              min: maxPainRange.min,
              max: maxPainRange.max,
              detail: maxPainTrendDetail,
            })}`}
            {maxPainMagneticText ? ` ${maxPainMagneticText}` : ""}
            {maxPainDispersionText ? ` ${maxPainDispersionText}` : ""}
          </p>
        </div>

        <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild let:builder>
              <Button
                builders={[builder]}
                class="w-fit transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span class="truncate text-sm"
                  >{stock_detail_options_max_pain_date_expiration()} | {formatDate(
                    selectedDate,
                  )}</span
                >
                <svg
                  class="-mr-1 ml-2 h-5 w-5 inline-block"
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
              class="min-w-56 w-auto max-w-60 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
            >
              <!-- Dropdown items -->
              <DropdownMenu.Group class="pb-2"
                >{#each dateList as item, index}
                  {#if data?.user?.tier === "Pro" || index === 0}
                    <DropdownMenu.Item
                      on:click={() => {
                        selectedDate = item;
                      }}
                      class="{selectedDate === item
                        ? 'text-gray-900 dark:text-white font-medium'
                        : 'text-gray-800 dark:text-zinc-300'} cursor-pointer hover:text-violet-600 dark:hover:text-violet-400"
                    >
                      {formatDate(item)}
                    </DropdownMenu.Item>
                  {:else}
                    <DropdownMenu.Item
                      on:click={() => goto("/pricing")}
                      class="cursor-pointer text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400"
                    >
                      {formatDate(item)}
                      <svg
                        class="ml-1 size-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        style="max-width: 40px;"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clip-rule="evenodd"
                        >
                        </path>
                      </svg>
                    </DropdownMenu.Item>
                  {/if}
                {/each}</DropdownMenu.Group
              >
            </DropdownMenu.Content>
          </DropdownMenu.Root>

          <!-- Chart Type Switcher -->
          <div class="flex items-center">
            <div
              class="w-fit flex text-sm items-center gap-1 rounded-full border border-gray-300 dark:border-zinc-700 p-1"
            >
              {#each chartTypes as item}
                <button
                  on:click={() => changeChartTypeStrike(item.type)}
                  class="cursor-pointer rounded-full p-1.5 focus:z-10 focus:outline-none transition-all
                    {chartTypeStrike === item.type
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                    : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'}"
                  title={getChartTypeLabel(item.type)}
                >
                  <svelte:component this={item.icon} class="w-4 h-4" />
                </button>
              {/each}
            </div>
          </div>
        </div>

        <div>
          <div class="grow mt-3">
            <div class="relative">
              <!-- Apply the blur class to the chart -->
              <div
                class="mt-5 sm:mt-0 border border-gray-300 dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40"
                use:highcharts={configStrike}
              ></div>
            </div>
          </div>
        </div>

        <h2
          class="mt-10 flex flex-row items-center text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white w-fit mb-2 sm:mb-0"
        >
          {stock_detail_options_max_pain_by_expiry_title({
            company: removeCompanyStrings($displayCompanyName),
          })}
        </h2>

        {#if data?.user?.tier === "Pro"}
          <!-- Insightful overview paragraph for Max Pain By Expiry section -->
          <div class="w-full mt-4 mb-2">
            <p class="text-sm text-gray-800 dark:text-zinc-300 leading-relaxed">
              {@html maxPainExpiryTrendSentence}
              {maxPainExpirySpreadSentence
                ? ` ${maxPainExpirySpreadSentence}`
                : ""}
              {maxPainExpiryLevelsSentence
                ? ` ${maxPainExpiryLevelsSentence}`
                : ""}
              {maxPainExpiryMagneticSentence
                ? ` ${maxPainExpiryMagneticSentence}`
                : ""}
              {` ${stock_detail_options_max_pain_expiry_timing()}`}
            </p>
          </div>

          <!-- Chart Type Switcher for Max Pain By Expiry -->
          <div class="mt-4 flex items-center justify-end">
            <div
              class="w-fit flex text-sm items-center gap-1 rounded-full border border-gray-300 dark:border-zinc-700 p-1"
            >
              {#each chartTypes as item}
                <button
                  on:click={() => changeChartTypeExpiry(item.type)}
                  class="cursor-pointer rounded-full p-1.5 focus:z-10 focus:outline-none transition-all
                    {chartTypeExpiry === item.type
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                    : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'}"
                  title={getChartTypeLabel(item.type)}
                >
                  <svelte:component this={item.icon} class="w-4 h-4" />
                </button>
              {/each}
            </div>
          </div>

          <div>
            <div class="grow mt-3">
              <div class="relative">
                <!-- Apply the blur class to the chart -->
                <div
                  class="mt-5 sm:mt-0 border border-gray-300 dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40"
                  use:highcharts={configExpiry}
                ></div>
              </div>
            </div>
          </div>
        {:else}
          <!-- Locked state for non-Pro users -->
          <div class="w-full mt-4 mb-2">
            <p class="text-sm text-gray-800 dark:text-zinc-300 leading-relaxed">
              {stock_detail_options_max_pain_upgrade_locked()}
            </p>
          </div>

          <div>
            <div class="grow mt-3">
              <div class="relative">
                <div
                  class="mt-5 sm:mt-0 border border-gray-300 dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 h-[360px] flex flex-col items-center justify-center"
                >
                  <a
                    href="/pricing"
                    class="flex flex-col items-center gap-3 text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
                  >
                    <svg
                      class="size-10"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                      />
                    </svg>
                    <span class="text-sm font-medium"
                      >{stock_detail_options_max_pain_upgrade_unlock()}</span
                    >
                  </a>
                </div>
              </div>
            </div>
          </div>
        {/if}

        {#if rawData?.length > 0}
          <div class="items-center lg:overflow-visible px-1 py-1 mt-10">
            <div
              class="col-span-2 flex flex-row items-center grow py-1 border-t border-b border-gray-300 dark:border-zinc-700"
            >
              <h2
                class="text-start whitespace-nowrap text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white w-full"
              >
                {stock_detail_options_max_pain_table_title()}
              </h2>
              {#if data?.user?.tier === "Pro"}
                <div
                  class="mt-1 w-full flex flex-row lg:flex order-1 items-center ml-auto pb-1 pt-1 sm:pt-0 w-full order-0 lg:order-1"
                >
                  <div class="ml-auto">
                    <DownloadData
                      {data}
                      rawData={rawData?.map((item) => ({
                        expiration: item?.expiration,
                        maxPain: item?.maxPain,
                        change: item?.change,
                        changesPercentage: item?.changesPercentage,
                      }))}
                      title={`${ticker}_max_pain`}
                    />
                  </div>
                </div>
              {/if}
            </div>
          </div>

          {#if data?.user?.tier === "Pro"}
            <div class="mt-3 w-full m-auto mb-4 overflow-x-auto">
              <div class="w-full overflow-x-auto">
                <table
                  class="table table-sm table-compact w-full text-gray-700 dark:text-zinc-200 tabular-nums m-auto rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 mt-2"
                >
                  <thead
                    class="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                  >
                    <TableHeader {columns} {sortOrders} {sortData} />
                  </thead>
                  <tbody>
                    {#each displayList as item, index}
                      <tr class="transition-colors">
                        <td class="text-sm text-start whitespace-nowrap">
                          {formatDate(item?.expiration)}
                        </td>

                        <td class="text-sm text-end whitespace-nowrap">
                          {item?.maxPain}
                        </td>

                        <td class="text-sm text-end whitespace-nowrap">
                          {item?.change ? item?.change?.toFixed(2) : "n/a"}
                          <span
                            class="ml-2 {item?.changesPercentage >= 0
                              ? "text-emerald-600 dark:text-emerald-400 before:content-['+']"
                              : 'text-rose-600 dark:text-rose-400'}"
                          >
                            ({item?.changesPercentage
                              ? item?.changesPercentage?.toFixed(2) + "%"
                              : "n/a"})</span
                          >
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          {:else}
            <!-- Locked table for non-Pro users -->
            <div class="mt-3 w-full m-auto mb-4">
              <div
                class="rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 h-[200px] flex flex-col items-center justify-center"
              >
                <a
                  href="/pricing"
                  class="flex flex-col items-center gap-3 text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
                >
                  <svg
                    class="size-10"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                    />
                  </svg>
                  <span class="text-sm font-medium"
                    >{stock_detail_options_max_pain_upgrade_unlock()}</span
                  >
                </a>
              </div>
            </div>
          {/if}

          <!-- Pagination controls -->
          {#if data?.user?.tier === "Pro" && displayList?.length > 0 && totalPages > 0}
            <div
              class="flex flex-row items-center justify-between mt-8 sm:mt-5"
            >
              <!-- Previous button -->
              <div class="flex items-center gap-2">
                <Button
                  on:click={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
                    >{stock_detail_options_common_previous()}</span
                  >
                </Button>
              </div>

              <!-- Page info and rows selector in center -->
              <div class="flex flex-row items-center gap-4">
                <span class="text-sm text-gray-600 dark:text-zinc-300">
                  {stock_detail_options_common_page_of({
                    current: currentPage,
                    total: totalPages,
                  })}
                </span>

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild let:builder>
                    <Button
                      builders={[builder]}
                      class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <span class="truncate text-[0.85rem] sm:text-sm"
                        >{stock_detail_options_common_rows({
                          count: rowsPerPage,
                        })}</span
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
                    class="w-auto min-w-40 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
                  >
                    <!-- Dropdown items -->
                    <DropdownMenu.Group class="pb-2">
                      {#each rowsPerPageOptions as item}
                        <DropdownMenu.Item
                          class="hover:text-violet-600 dark:hover:text-violet-400 transition"
                        >
                          <label
                            on:click={() => changeRowsPerPage(item)}
                            class="inline-flex justify-between w-full items-center cursor-pointer"
                          >
                            <span class="text-sm"
                              >{stock_detail_options_common_rows({
                                count: item,
                              })}</span
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
                  class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span class="hidden sm:inline"
                    >{stock_detail_options_common_next()}</span
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
                {stock_detail_options_common_back_to_top()}
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
        {/if}
      </div>
    </div>
  </div>
</section>

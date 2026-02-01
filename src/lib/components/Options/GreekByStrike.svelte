<script lang="ts">
  import {
    stock_detail_options_chart_current_price,
    stock_detail_options_chart_type_column,
    stock_detail_options_chart_type_line,
    stock_detail_options_chart_type_scatter,
    stock_detail_options_common_back_to_top,
    stock_detail_options_common_next,
    stock_detail_options_common_page_of,
    stock_detail_options_common_previous,
    stock_detail_options_common_rows,
    stock_detail_options_dex_table,
    stock_detail_options_gex_table,
    stock_detail_options_greek_all_dte,
    stock_detail_options_greek_by_strike,
    stock_detail_options_greek_chart_title,
    stock_detail_options_greek_col_call_delta,
    stock_detail_options_greek_col_call_gex,
    stock_detail_options_greek_col_net_delta,
    stock_detail_options_greek_col_net_gex,
    stock_detail_options_greek_col_pc,
    stock_detail_options_greek_col_put_delta,
    stock_detail_options_greek_col_put_gex,
    stock_detail_options_greek_col_strike,
    stock_detail_options_greek_custom,
    stock_detail_options_greek_dte_label,
    stock_detail_options_greek_max,
    stock_detail_options_greek_min,
    stock_detail_options_greek_strike_delta_all,
    stock_detail_options_greek_strike_delta_context_above,
    stock_detail_options_greek_strike_delta_context_at,
    stock_detail_options_greek_strike_delta_context_below,
    stock_detail_options_greek_strike_delta_context_other,
    stock_detail_options_greek_strike_delta_max_intro,
    stock_detail_options_greek_strike_delta_multi,
    stock_detail_options_greek_strike_delta_single,
    stock_detail_options_greek_strike_delta_totals,
    stock_detail_options_greek_strike_gamma_all,
    stock_detail_options_greek_strike_gamma_context_above,
    stock_detail_options_greek_strike_gamma_context_at,
    stock_detail_options_greek_strike_gamma_context_below,
    stock_detail_options_greek_strike_gamma_max_intro,
    stock_detail_options_greek_strike_gamma_multi,
    stock_detail_options_greek_strike_gamma_single,
    stock_detail_options_greek_strike_gamma_totals,
    stock_detail_options_greek_strike_info_delta,
    stock_detail_options_greek_strike_info_gamma,
    stock_detail_options_greek_strike_intro,
    stock_detail_options_greek_strike_no_data,
    stock_detail_options_greek_strike_no_data_all,
    stock_detail_options_greek_to,
    stock_detail_options_greek_type_delta,
    stock_detail_options_greek_type_gamma,
  } from "$lib/paraglide/messages";
  import { abbreviateNumber } from "$lib/utils";
  import { onMount } from "svelte";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { page } from "$app/stores";
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";
  import { goto } from "$app/navigation";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import BarChartIcon from "lucide-svelte/icons/chart-column-increasing";
  import LineChartIcon from "lucide-svelte/icons/chart-spline";
  import ScatterChartIcon from "lucide-svelte/icons/circle-dot";

  export let data;
  export let title = "Gamma";
  export let ticker;
  let currentPrice = null;

  // Chart type state
  type ChartType = "column" | "line" | "scatter";
  let chartType: ChartType = "column";

  const chartTypes: { type: ChartType; icon: any }[] = [
    { type: "column", icon: BarChartIcon },
    { type: "line", icon: LineChartIcon },
    { type: "scatter", icon: ScatterChartIcon },
  ];

  const chartTypeLabels: Record<ChartType, () => string> = {
    column: stock_detail_options_chart_type_column,
    line: stock_detail_options_chart_type_line,
    scatter: stock_detail_options_chart_type_scatter,
  };

  function getChartTypeLabel(type: ChartType): string {
    return chartTypeLabels[type]?.() ?? type;
  }

  function changeChartType(type: ChartType) {
    chartType = type;
    config = plotData() || null;
  }

  $: isGamma = title === "Gamma";

  // Cache for DTE calculations to avoid recalculating
  const dteCache = new Map();

  // Calculate DTE (Days to Expiration) for each date, excluding weekends
  function calculateDTE(dateStr) {
    // Return cached value if available
    if (dteCache.has(dateStr)) {
      return dteCache.get(dateStr);
    }

    // Parse both dates in local time to avoid timezone issues
    const [year, month, day] = dateStr.split("-").map(Number);
    const expiryDate = new Date(year, month - 1, day);
    expiryDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let result;

    // If expiry is today, return 0 (0 DTE)
    if (expiryDate.getTime() === today.getTime()) {
      result = 0;
    } else if (expiryDate < today) {
      // If expiry is before today, return -1 (expired)
      result = -1;
    } else {
      // Count business days between today and expiry
      let businessDays = 0;
      let currentDate = new Date(today);

      while (currentDate < expiryDate) {
        currentDate.setDate(currentDate.getDate() + 1);
        const dayOfWeek = currentDate.getDay();
        // 0 = Sunday, 6 = Saturday
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          businessDays++;
        }
      }
      result = businessDays;
    }

    // Cache the result
    dteCache.set(dateStr, result);
    return result;
  }

  // Create DTE-based options
  let dteOptions = [
    "All",
    "0 DTE",
    "5 DTE",
    "10 DTE",
    "20 DTE",
    "60 DTE",
    "90 DTE",
    "180 DTE",
  ];

  // New variables for multiple selection
  let selectedDTEs = new Set(["All"]); // Start with "All" selected
  let checkedDTEs = new Set(["All"]); // Track which DTEs are checked
  let selectedDTEsText = "All"; // Text to display in the dropdown
  let selectedDTEsLabel = stock_detail_options_greek_all_dte();

  // Custom range state
  let customMin: number | null = null;
  let customMax: number | null = null;
  let isCustomSelected = false;

  // LocalStorage key based on page type (gex-strike or dex-strike)
  $: dteStorageKey =
    title === "Gamma" ? "dte_settings_gex_strike" : "dte_settings_dex_strike";

  // Save DTE settings to localStorage (only for Pro users)
  function saveDTESettings() {
    // Only save settings for Pro users
    if (data?.user?.tier !== "Pro") {
      return;
    }

    if (typeof localStorage !== "undefined") {
      const settings = {
        selectedDTE: Array.from(selectedDTEs)[0] || "All",
        selectedDTEsText,
        isCustomSelected,
        customMin,
        customMax,
      };
      localStorage.setItem(dteStorageKey, JSON.stringify(settings));
    }
  }

  // Load DTE settings from localStorage (only for Pro users)
  function loadDTESettings() {
    // Only load saved settings for Pro users
    if (data?.user?.tier !== "Pro") {
      // Non-Pro users always default to "All DTE"
      return;
    }

    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(dteStorageKey);
      if (saved) {
        try {
          const settings = JSON.parse(saved);

          // Restore state
          checkedDTEs.clear();
          selectedDTEs.clear();

          if (settings.isCustomSelected) {
            isCustomSelected = true;
            customMin = settings.customMin;
            customMax = settings.customMax;
            checkedDTEs.add("Custom");
            selectedDTEs.add("Custom");
            selectedDTEsText = settings.selectedDTEsText || "Custom";
          } else {
            isCustomSelected = false;
            const selectedDTE = settings.selectedDTE || "All";
            checkedDTEs.add(selectedDTE);
            selectedDTEs.add(selectedDTE);
            selectedDTEsText = settings.selectedDTEsText || selectedDTE;
          }

          // Trigger reactive updates
          selectedDTEs = new Set(selectedDTEs);
          checkedDTEs = new Set(checkedDTEs);
          dteOptions = [...dteOptions];
        } catch (e) {
          // If parsing fails, use defaults
          console.error("Failed to load DTE settings:", e);
        }
      }
    }
  }

  let rawData = [];
  let sortedData = [];
  let displayList = [];

  // Pagination state
  let currentPage = 1;
  let rowsPerPage = 20;
  let rowsPerPageOptions = [20, 50, 100];
  let totalPages = 1;
  let pagePathName = $page?.url?.pathname;

  // Calculate metrics for insight paragraph
  $: totalCallExposure =
    rawData?.reduce(
      (sum, item) =>
        sum + (isGamma ? (item?.call_gex ?? 0) : (item?.call_dex ?? 0)),
      0,
    ) || 0;

  $: totalPutExposure =
    rawData?.reduce(
      (sum, item) =>
        sum + (isGamma ? (item?.put_gex ?? 0) : (item?.put_dex ?? 0)),
      0,
    ) || 0;

  $: totalNetExposure =
    rawData?.reduce(
      (sum, item) =>
        sum + (isGamma ? (item?.net_gex ?? 0) : (item?.net_dex ?? 0)),
      0,
    ) || 0;

  $: overallPutCallRatio =
    totalCallExposure !== 0
      ? Math.abs(totalPutExposure / totalCallExposure).toFixed(2)
      : "n/a";

  // Find the strike with maximum absolute exposure
  $: maxExposureStrike =
    rawData?.reduce((max, item) => {
      const currentNet = Math.abs(
        isGamma ? item?.net_gex || 0 : item?.net_dex || 0,
      );
      const maxNet = Math.abs(isGamma ? max?.net_gex || 0 : max?.net_dex || 0);
      return currentNet > maxNet ? item : max;
    }, rawData[0]) || {};

  // Find strikes near current price with significant exposure
  $: nearbyStrikes =
    rawData?.filter((item) => {
      const strikeDistance =
        Math.abs(item.strike - currentPrice) / currentPrice;
      return strikeDistance <= 0.05; // Within 5% of current price
    }) || [];

  $: nearbyNetExposure =
    nearbyStrikes?.reduce(
      (sum, item) => sum + (isGamma ? item?.net_gex || 0 : item?.net_dex || 0),
      0,
    ) || 0;

  // Identify potential support/resistance levels
  $: supportStrikes =
    rawData
      ?.filter(
        (item) =>
          item.strike < currentPrice &&
          (isGamma ? item.net_gex > 0 : item.net_dex < 0),
      )
      ?.sort((a, b) => b.strike - a.strike)
      ?.slice(0, 3) || [];

  $: resistanceStrikes =
    rawData
      ?.filter(
        (item) =>
          item.strike > currentPrice &&
          (isGamma ? item.net_gex > 0 : item.net_dex > 0),
      )
      ?.sort((a, b) => a.strike - b.strike)
      ?.slice(0, 3) || [];

  $: greekTypeLabel = isGamma
    ? stock_detail_options_greek_type_gamma()
    : stock_detail_options_greek_type_delta();

  $: greekMetricLabel = isGamma ? "GEX" : "DEX";

  $: hasPrice = Number.isFinite(currentPrice);
  $: formattedPrice = hasPrice ? `$${currentPrice}` : "n/a";

  $: formattedCallExposure = isGamma
    ? totalCallExposure?.toLocaleString("en-US")
    : abbreviateNumber(totalCallExposure);

  $: formattedPutExposure = isGamma
    ? Math.abs(totalPutExposure)?.toLocaleString("en-US")
    : abbreviateNumber(Math.abs(totalPutExposure));

  $: formattedNetExposure = isGamma
    ? maxExposureStrike?.net_gex?.toLocaleString("en-US")
    : abbreviateNumber(maxExposureStrike?.net_dex);

  $: formattedMaxStrike =
    maxExposureStrike?.strike !== undefined &&
    maxExposureStrike?.strike !== null
      ? `$${maxExposureStrike?.strike?.toFixed(2)}`
      : "n/a";

  $: maxStrike = maxExposureStrike?.strike ?? 0;
  $: percentAbove =
    currentPrice && maxStrike
      ? (((maxStrike - currentPrice) / currentPrice) * 100).toFixed(1)
      : "0.0";
  $: percentBelow =
    currentPrice && maxStrike
      ? (((currentPrice - maxStrike) / currentPrice) * 100).toFixed(1)
      : "0.0";

  $: summaryDteText = isGamma
    ? selectedDTEs.has("All")
      ? stock_detail_options_greek_strike_gamma_all()
      : selectedDTEs.size === 1
        ? stock_detail_options_greek_strike_gamma_single({
            dte: selectedDTEsLabel,
          })
        : stock_detail_options_greek_strike_gamma_multi({
            count: selectedDTEs.size,
          })
    : selectedDTEs.has("All")
      ? stock_detail_options_greek_strike_delta_all()
      : selectedDTEs.size === 1
        ? stock_detail_options_greek_strike_delta_single({
            dte: selectedDTEsLabel,
          })
        : stock_detail_options_greek_strike_delta_multi({
            count: selectedDTEs.size,
          });

  $: summaryTotalsText = isGamma
    ? stock_detail_options_greek_strike_gamma_totals({
        call: formattedCallExposure,
        put: formattedPutExposure,
        ratio: overallPutCallRatio,
      })
    : stock_detail_options_greek_strike_delta_totals({
        call: formattedCallExposure,
        put: formattedPutExposure,
        ratio: overallPutCallRatio,
      });

  $: summaryMaxIntroText = isGamma
    ? stock_detail_options_greek_strike_gamma_max_intro({
        strike: formattedMaxStrike,
        net: formattedNetExposure,
      })
    : stock_detail_options_greek_strike_delta_max_intro({
        strike: formattedMaxStrike,
        net: formattedNetExposure,
      });

  $: summaryContextText = isGamma
    ? maxStrike > currentPrice
      ? stock_detail_options_greek_strike_gamma_context_above({
          percent: percentAbove,
        })
      : maxStrike < currentPrice
        ? stock_detail_options_greek_strike_gamma_context_below({
            percent: percentBelow,
          })
        : stock_detail_options_greek_strike_gamma_context_at()
    : maxExposureStrike?.net_dex > 0 && maxStrike > currentPrice
      ? stock_detail_options_greek_strike_delta_context_above({
          percent: percentAbove,
        })
      : maxExposureStrike?.net_dex < 0 && maxStrike < currentPrice
        ? stock_detail_options_greek_strike_delta_context_below({
            percent: percentBelow,
          })
        : maxStrike === currentPrice
          ? stock_detail_options_greek_strike_delta_context_at()
          : stock_detail_options_greek_strike_delta_context_other();

  $: noDataRange =
    selectedDTEsText === "All"
      ? stock_detail_options_greek_strike_no_data_all()
      : selectedDTEsLabel;

  $: noDataText = stock_detail_options_greek_strike_no_data({
    type: greekTypeLabel,
    range: noDataRange,
  });

  // Function to handle DTE selection changes
  async function handleDTEChange(dteValue) {
    // If clicking on already selected item (not "All" and not "Custom"), uncheck it and revert to "All"
    if (
      dteValue !== "All" &&
      dteValue !== "Custom" &&
      checkedDTEs.has(dteValue)
    ) {
      checkedDTEs.clear();
      selectedDTEs.clear();
      checkedDTEs.add("All");
      selectedDTEs.add("All");
      selectedDTEsText = "All";
      isCustomSelected = false;
    } else {
      // Always allow only one selection at a time
      checkedDTEs.clear();
      selectedDTEs.clear();
      isCustomSelected = false;

      selectedDTEsText = dteValue;

      if (dteValue === "All" || !dteValue) {
        checkedDTEs.add("All");
        selectedDTEs.add("All");
      } else {
        checkedDTEs.add(dteValue);
        selectedDTEs.add(dteValue);
      }
    }

    // Trigger reactive updates
    selectedDTEs = new Set(selectedDTEs);
    checkedDTEs = new Set(checkedDTEs);
    dteOptions = [...dteOptions];

    updateDataForSelectedDTEs();
    saveDTESettings();
  }

  // Handle custom checkbox toggle
  function handleCustomToggle() {
    if (isCustomSelected) {
      // Uncheck custom and revert to All
      isCustomSelected = false;
      checkedDTEs.clear();
      selectedDTEs.clear();
      checkedDTEs.add("All");
      selectedDTEs.add("All");
      selectedDTEsText = "All";
      customMin = null;
      customMax = null;
    } else {
      // Select custom
      selectCustomIfNeeded();
    }

    // Trigger reactive updates
    selectedDTEs = new Set(selectedDTEs);
    checkedDTEs = new Set(checkedDTEs);
    dteOptions = [...dteOptions];

    updateDataForSelectedDTEs();
    saveDTESettings();
  }

  // Select custom without toggling (used when typing in inputs)
  function selectCustomIfNeeded() {
    if (!isCustomSelected) {
      isCustomSelected = true;
      checkedDTEs.clear();
      selectedDTEs.clear();
      checkedDTEs.add("Custom");
      selectedDTEs.add("Custom");
      selectedDTEsText = "Custom";

      // Trigger reactive updates
      selectedDTEs = new Set(selectedDTEs);
      checkedDTEs = new Set(checkedDTEs);
      dteOptions = [...dteOptions];
      saveDTESettings();
    }
  }

  // Apply custom range filter
  function applyCustomRange() {
    if (isCustomSelected) {
      const minVal = customMin ?? 0;
      const maxVal = customMax ?? 999;
      selectedDTEsText = `${minVal}-${maxVal} DTE`;
      updateDataForSelectedDTEs();
      saveDTESettings();
    }
  }

  function getDteLabel(value: string): string {
    if (value === "All") {
      return stock_detail_options_greek_all_dte();
    }

    if (value === "Custom") {
      return stock_detail_options_greek_custom();
    }

    return value;
  }

  $: selectedDTEsLabel = getDteLabel(selectedDTEsText);

  function updateDataForSelectedDTEs() {
    if (selectedDTEs.has("All")) {
      rawData = aggregateDict(data?.getData) || [];
    } else if (selectedDTEs.has("Custom")) {
      // Handle custom range
      const selectedData = {};
      const minDTE = customMin ?? 0;
      const maxDTE = customMax ?? 999;

      const dataKeys = Object.keys(data?.getData ?? {});
      for (let i = 0; i < dataKeys.length; i++) {
        const date = dataKeys[i];
        const dte = calculateDTE(date);

        // Include dates where DTE is within the custom range
        if (dte >= 0 && dte >= minDTE && dte <= maxDTE) {
          selectedData[date] = data?.getData[date];
        }
      }

      rawData = aggregateDict(selectedData) || [];
    } else {
      const selectedData = {};
      const dteStr = Array.from(selectedDTEs)[0]; // Only one is allowed
      const targetDTE = parseInt(dteStr.split(" ")[0]);

      const dataKeys = Object.keys(data?.getData ?? {});
      for (let i = 0; i < dataKeys.length; i++) {
        const date = dataKeys[i];
        const dte = calculateDTE(date);

        // Include dates where DTE is >= 0 (not expired) and <= targetDTE
        // For "0 DTE": dte >= 0 && dte <= 0, so only exactly 0 DTE
        if (dte >= 0 && dte <= targetDTE) {
          selectedData[date] = data?.getData[date];
        }
      }

      rawData = aggregateDict(selectedData) || [];
    }

    rawData = rawData?.map((item) => {
      if (title === "Gamma") {
        return {
          ...item,
          net_gex: (item?.call_gex || 0) + (item?.put_gex || 0),
          put_call_ratio:
            item?.call_gex > 0
              ? Math.abs((item?.put_gex || 0) / item?.call_gex)
              : null,
        };
      } else {
        return {
          ...item,
          net_dex: (item?.call_dex || 0) + (item?.put_dex || 0),
          put_call_ratio:
            item?.call_dex > 0
              ? Math.abs((item?.put_dex || 0) / item?.call_dex)
              : null,
        };
      }
    });

    sortedData = [...rawData];
    currentPage = 1;
    updatePaginatedData();
    config = plotData() || null;
  }

  function updatePaginatedData() {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    displayList = sortedData?.slice(start, end);
    totalPages = Math.ceil(sortedData?.length / rowsPerPage);
  }

  function goToPage(page) {
    currentPage = page;
    updatePaginatedData();
  }

  function changeRowsPerPage(newRowsPerPage) {
    rowsPerPage = newRowsPerPage;
    currentPage = 1;
    updatePaginatedData();
    saveRowsPerPage();
  }

  function saveRowsPerPage() {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        `greekByStrike_rowsPerPage_${pagePathName}`,
        rowsPerPage.toString(),
      );
    }
  }

  function loadRowsPerPage() {
    if (typeof localStorage !== "undefined") {
      const savedRowsPerPage = localStorage.getItem(
        `greekByStrike_rowsPerPage_${pagePathName}`,
      );
      if (savedRowsPerPage) {
        rowsPerPage = parseInt(savedRowsPerPage, 10);
      }
    }
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function aggregateDict(data) {
    const map = new Map();

    // pick which keys to accumulate
    const isGamma = title === "Gamma";
    const callKey = isGamma ? "call_gex" : "call_dex";
    const putKey = isGamma ? "put_gex" : "put_dex";

    // flatten out all the points into one loop
    for (const pts of Object?.values(data)) {
      for (const pt of pts) {
        const { strike } = pt;

        // on first sight of this strike, seed all four fields at zero
        if (!map?.has(strike)) {
          map?.set(strike, {
            strike,
            call_gex: 0,
            put_gex: 0,
            call_dex: 0,
            put_dex: 0,
          });
        }

        // accumulate into the right buckets
        const agg = map.get(strike);
        agg[callKey] += pt[callKey] ?? 0;
        agg[putKey] += pt[putKey] ?? 0;
      }
    }

    // sort by strike ascending
    return Array?.from(map?.values())?.sort((a, b) => a?.strike - b?.strike);
  }

  function plotData() {
    currentPrice = Number(data?.getStockQuote?.price?.toFixed(2));

    const isGamma = title === "Gamma"; // Don't delete this; isGamma is used below.
    const processedData = rawData
      ?.map((d) => ({
        strike: d?.strike,
        callValue: isGamma ? d?.call_gex : d?.call_dex,
        putValue: isGamma ? d?.put_gex : d?.put_dex,
        netValue: isGamma ? d?.net_gex : d?.net_dex,
      }))
      ?.sort((a, b) => a.strike - b.strike);

    // Extract data arrays
    const strikes = processedData?.map((d) => d.strike);

    const allStrikes = Array.from(
      new Set([...strikes, ...[currentPrice]]),
    )?.sort((a, b) => a - b);

    // Ensure numerical values instead of strings (toFixed returns a string) - handle undefined values
    const callValues = processedData?.map((d) =>
      parseFloat((d.callValue ?? 0).toFixed(2)),
    );
    const putValues = processedData?.map((d) =>
      parseFloat((d.putValue ?? 0).toFixed(2)),
    );
    const netValues = processedData?.map((d) =>
      parseFloat((d.netValue ?? 0).toFixed(2)),
    );

    const options = {
      credits: {
        enabled: false,
      },
      chart: {
        type: chartType === "scatter" ? "scatter" : chartType,
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
        text: `<h3 class="mt-3 mb-1 text-sm font-semibold tracking-tight">${stock_detail_options_greek_chart_title({ ticker, metric: greekMetricLabel })}</h3>`,
        style: {
          color: $mode === "light" ? "#111827" : "#f4f4f5",
        },
        useHTML: true,
      },
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
      plotOptions: {
        series: {
          animation: false,
          ...(chartType === "column" ? { stacking: "normal" } : {}),
        },
        line: {
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
      },
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 1)", // Semi-transparent black
        borderColor: "rgba(255, 255, 255, 0.2)", // Slightly visible white border
        borderWidth: 1,
        style: {
          color: "#fff",
          fontSize: "16px",
          padding: "10px",
        },
        borderRadius: 4,
        formatter: function () {
          // Displaying "Strike" and the x value in the header
          let tooltipContent = `<span class="text-white m-auto text-black text-[1rem] font-[501]">Strike ${this?.x}</span><br>`;

          // Loop through each point in the shared tooltip
          this.points.forEach((point) => {
            tooltipContent += `
        <span style="display:inline-block; width:10px; height:10px; background-color:${point.color}; border-radius:50%; margin-right:5px;"></span>
        <span class="text-white font-semibold text-sm">${point.series.name}:</span> 
        <span class="text-white font-normal text-sm">${point.y?.toLocaleString("en-US")}</span><br>`;
          });

          return tooltipContent;
        },
      },
      xAxis: {
        categories: allStrikes,
        gridLineWidth: 0,
        crosshair: {
          color: $mode === "light" ? "black" : "white",
          width: 1,
          dashStyle: "Solid",
        },
        plotLines: [
          {
            value: allStrikes?.findIndex((s) => s === currentPrice),
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
        labels: {
          style: {
            color: $mode === "light" ? "#545454" : "white",
          },
          formatter: function () {
            return this.pos % 2 === 0 ? this.value : "";
          },
        },
      },
      yAxis: {
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
          formatter: function () {
            return abbreviateNumber(this.value);
          },
        },
        title: { text: null },
        opposite: true,
      },
      series: [
        {
          name: `Put ${isGamma ? "Gamma" : "Delta"}`,
          data: putValues,
          stack: "value",
          color: "#E74C3C",
          borderColor: "#E74C3C",
          borderRadius: "1px",
          animation: false,
        },
        {
          name: `Net ${isGamma ? "Gamma" : "Delta"}`,
          data: netValues,
          stack: "value",
          color: "#2C6288",
          borderColor: "#2C6288",
          borderRadius: "1px",
          animation: false,
        },
        {
          name: `Call ${isGamma ? "Gamma" : "Delta"}`,
          data: callValues,
          stack: "value",
          color: "#2ECC71",
          borderColor: "#2ECC71",
          borderRadius: "1px",
          animation: false,
        },
      ],
    };

    return options;
  }

  onMount(() => {
    loadRowsPerPage();
    loadDTESettings();
    updateDataForSelectedDTEs(); // Initialize data
  });

  $: {
    if (pagePathName) {
      loadRowsPerPage();
      updatePaginatedData();
    }
  }

  $: columns = [
    {
      key: "strike",
      label: stock_detail_options_greek_col_strike(),
      align: "left",
    },
    {
      key: isGamma ? "call_gex" : "call_dex",
      label: isGamma
        ? stock_detail_options_greek_col_call_gex()
        : stock_detail_options_greek_col_call_delta(),
      align: "right",
    },
    {
      key: isGamma ? "put_gex" : "put_dex",
      label: isGamma
        ? stock_detail_options_greek_col_put_gex()
        : stock_detail_options_greek_col_put_delta(),
      align: "right",
    },
    {
      key: isGamma ? "net_gex" : "net_dex",
      label: isGamma
        ? stock_detail_options_greek_col_net_gex()
        : stock_detail_options_greek_col_net_delta(),
      align: "right",
    },
    {
      key: "put_call_ratio",
      label: stock_detail_options_greek_col_pc(),
      align: "right",
    },
  ];

  $: sortOrders = {
    strike: { order: "none", type: "number" },
    [isGamma ? "call_gex" : "call_dex"]: { order: "none", type: "number" },
    [isGamma ? "put_gex" : "put_dex"]: { order: "none", type: "number" },
    [isGamma ? "net_gex" : "net_dex"]: { order: "none", type: "number" },
    put_call_ratio: { order: "none", type: "number" },
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
      currentPage = 1;
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
          valueA = a[key].toUpperCase();
          valueB = b[key].toUpperCase();
          return sortOrder === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        case "number":
        default:
          valueA = parseFloat(a[key]);
          valueB = parseFloat(b[key]);
          break;
      }

      if (sortOrder === "asc") {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    };

    // Sort using the generic comparison function
    sortedData = [...rawData].sort(compareValues);
    currentPage = 1;
    updatePaginatedData();
  };

  let config = null;

  // Reactive statement to update when mode changes
  $: if ($mode) {
    config = plotData() || null;
  }
</script>

<div class="sm:pl-7 sm:pb-7 sm:pt-5 w-full m-auto mt-2 sm:mt-0">
  <h2
    class="flex flex-row items-center text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white w-fit"
  >
    {stock_detail_options_greek_by_strike()}
    <InfoModal
      content={isGamma
        ? stock_detail_options_greek_strike_info_gamma({ ticker })
        : stock_detail_options_greek_strike_info_delta({ ticker })}
    />
  </h2>

  <!-- Insightful overview paragraph -->
  <div class="w-full mt-4 mb-6 text-sm text-gray-800 dark:text-zinc-300">
    {#if rawData?.length > 0}
      <p>
        {#if hasPrice}
          <span
            >{@html stock_detail_options_greek_strike_intro({
              ticker,
              price: formattedPrice,
            })}</span
          >
          {" "}
        {/if}
        <span>{@html summaryDteText}</span>
        {" "}
        <span>{@html summaryTotalsText}</span>
        {" "}
        <span>{@html summaryMaxIntroText}</span>
        {" "}
        <span>{@html summaryContextText}</span>.
      </p>
    {:else}
      <p>
        {noDataText}
      </p>
    {/if}
  </div>

  <div class="mt-7 flex flex-wrap items-center justify-between gap-3">
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild let:builder>
        <Button
          builders={[builder]}
          class="w-fit transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span class="truncate text-sm"
            >{stock_detail_options_greek_dte_label()} | {selectedDTEsLabel}</span
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
        class="min-w-56 w-auto max-w-96 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
      >
        <DropdownMenu.Group class="pb-2">
          {#each dteOptions as item, index}
            {#if data?.user?.tier === "Pro" || index === 0}
              <DropdownMenu.Item
                class="hover:text-violet-600 dark:hover:text-violet-400"
              >
                <div
                  on:click|preventDefault|stopPropagation={() =>
                    handleDTEChange(item)}
                  class="flex items-center cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checkedDTEs.has(item)}
                    on:click|preventDefault|stopPropagation={() =>
                      handleDTEChange(item)}
                  />
                  <span class="ml-2">
                    {item === "All"
                      ? stock_detail_options_greek_all_dte()
                      : item}
                  </span>
                </div>
              </DropdownMenu.Item>
            {:else}
              <DropdownMenu.Item
                on:click={() => goto("/pricing")}
                class="cursor-pointer hover:text-violet-600 dark:hover:text-violet-400"
              >
                {item}
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
          {/each}

          <!-- Custom Range Option -->
          {#if data?.user?.tier === "Pro"}
            <div
              class="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
              on:click|stopPropagation
              on:keydown|stopPropagation
              on:keyup|stopPropagation
              on:keypress|stopPropagation
            >
              <div class="flex items-center gap-2 w-full">
                <div
                  class="cursor-pointer flex items-center"
                  on:click|preventDefault|stopPropagation={handleCustomToggle}
                >
                  <input
                    type="checkbox"
                    checked={isCustomSelected}
                    on:click|preventDefault|stopPropagation={handleCustomToggle}
                  />
                  <span class="ml-2">{stock_detail_options_greek_custom()}</span
                  >
                </div>
                <input
                  type="number"
                  bind:value={customMin}
                  on:input={() => {
                    selectCustomIfNeeded();
                    applyCustomRange();
                  }}
                  on:click|stopPropagation
                  on:keydown|stopPropagation
                  on:keyup|stopPropagation
                  on:keypress|stopPropagation
                  on:focus|stopPropagation
                  placeholder={stock_detail_options_greek_min()}
                  min="0"
                  class="w-16 px-2 py-1 text-sm rounded-full border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                <span class="text-gray-500 dark:text-zinc-400"
                  >{stock_detail_options_greek_to()}</span
                >
                <input
                  type="number"
                  bind:value={customMax}
                  on:input={() => {
                    selectCustomIfNeeded();
                    applyCustomRange();
                  }}
                  on:click|stopPropagation
                  on:keydown|stopPropagation
                  on:keyup|stopPropagation
                  on:keypress|stopPropagation
                  on:focus|stopPropagation
                  placeholder={stock_detail_options_greek_max()}
                  min="0"
                  class="w-16 px-2 py-1 text-sm rounded-full border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>
          {:else}
            <DropdownMenu.Item
              on:click={() => goto("/pricing")}
              class="cursor-pointer hover:text-violet-600 dark:hover:text-violet-400"
            >
              {stock_detail_options_greek_custom()}
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
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>

    <!-- Chart Type Switcher -->
    <div class="flex items-center">
      <div
        class="w-fit flex text-sm items-center gap-1 rounded-full border border-gray-300 dark:border-zinc-700 p-1"
      >
        {#each chartTypes as item}
          <button
            on:click={() => changeChartType(item.type)}
            class="cursor-pointer rounded-full p-1.5 focus:z-10 focus:outline-none transition-all
              {chartType === item.type
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

  <div class="w-full overflow-hidden m-auto sm:mt-3">
    {#if config !== null && rawData?.length > 0}
      <div>
        <div class="grow">
          <div class="relative">
            <!-- Apply the blur class to the chart -->
            <div
              class="mt-5 sm:mt-0 border border-gray-300 dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40"
              use:highcharts={config}
            ></div>
          </div>
        </div>
      </div>
    {:else if rawData?.length === 0}
      <Infobox text={noDataText} />
    {/if}
  </div>

  {#if rawData?.length > 0}
    <div class="items-center lg:overflow-visible px-1 py-1 mt-10">
      <div
        class="col-span-2 flex flex-row items-center grow py-1 border-t border-b border-gray-300 dark:border-zinc-700"
      >
        <h2
          class="text-start whitespace-nowrap text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white w-full"
        >
          {title === "Gamma"
            ? stock_detail_options_gex_table()
            : stock_detail_options_dex_table()}
        </h2>
        <div
          class="mt-1 w-full flex flex-row lg:flex order-1 items-center ml-auto pb-1 pt-1 sm:pt-0 w-full order-0 lg:order-1"
        >
          <div class="ml-auto">
            <DownloadData
              {data}
              rawData={rawData?.map((item) => {
                if (title === "Gamma") {
                  return {
                    strike: item?.strike,
                    call_gex: item?.call_gex,
                    put_gex: item?.put_gex,
                    net_gex: item?.net_gex,
                    put_call_ratio: item?.put_call_ratio,
                  };
                } else {
                  return {
                    strike: item?.strike,
                    call_dex: item?.call_dex,
                    put_dex: item?.put_dex,
                    net_dex: item?.net_dex,
                    put_call_ratio: item?.put_call_ratio,
                  };
                }
              })}
              title={`${ticker}_${title === "Gamma" ? "gex" : "dex"}_by_strike`}
            />
          </div>
        </div>
      </div>
    </div>

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
                  {item?.strike?.toFixed(2)}
                </td>
                <td class="text-sm text-end whitespace-nowrap">
                  {(isGamma ? item?.call_gex : item?.call_dex)?.toLocaleString(
                    "en-US",
                  )}
                </td>
                <td class="text-sm text-end whitespace-nowrap">
                  {(isGamma ? item?.put_gex : item?.put_dex)?.toLocaleString(
                    "en-US",
                  )}
                </td>

                <td class="text-sm text-end whitespace-nowrap">
                  {(isGamma ? item?.net_gex : item?.net_dex)?.toLocaleString(
                    "en-US",
                  )}
                </td>

                <td class="text-sm text-end whitespace-nowrap">
                  {#if item?.put_call_ratio <= 1 && item?.put_call_ratio !== null}
                    <span class="text-emerald-800 dark:text-emerald-400"
                      >{item?.put_call_ratio?.toFixed(2)}</span
                    >
                  {:else if item?.put_call_ratio > 1 && item?.put_call_ratio !== null}
                    <span class="text-rose-800 dark:text-rose-400"
                      >{item?.put_call_ratio?.toFixed(2)}</span
                    >
                  {:else}
                    n/a
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination controls -->
    {#if displayList?.length > 0 && totalPages > 0}
      <div class="flex flex-row items-center justify-between mt-8 sm:mt-5">
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

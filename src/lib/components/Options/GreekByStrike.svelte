<script lang="ts">
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

  const chartTypes: { type: ChartType; label: string; icon: any }[] = [
    { type: "column", label: "Column", icon: BarChartIcon },
    { type: "line", label: "Line", icon: LineChartIcon },
    { type: "scatter", label: "Scatter", icon: ScatterChartIcon },
  ];

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

  // Function to handle DTE selection changes
  async function handleDTEChange(dteValue) {
    // If clicking on already selected item (not "All"), uncheck it and revert to "All"
    if (dteValue !== "All" && checkedDTEs.has(dteValue)) {
      checkedDTEs.clear();
      selectedDTEs.clear();
      checkedDTEs.add("All");
      selectedDTEs.add("All");
      selectedDTEsText = "All";
    } else {
      // Always allow only one selection at a time
      checkedDTEs.clear();
      selectedDTEs.clear();

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

    updateDataForSelectedDTEs();
    dteOptions = [...dteOptions];
  }

  function isDTEChecked(dteValue) {
    return checkedDTEs.has(dteValue);
  }

  function updateDataForSelectedDTEs() {
    if (selectedDTEs.has("All")) {
      rawData = aggregateDict(data?.getData) || [];
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
        text: `<h3 class="mt-3 mb-1 text-sm font-semibold tracking-tight">${ticker} ${title === "Gamma" ? "GEX" : "DEX"} Chart</h3>`,
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
              text: `Current Price ${currentPrice}`,
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
    updateDataForSelectedDTEs(); // Initialize data
  });

  $: {
    if (pagePathName) {
      loadRowsPerPage();
      updatePaginatedData();
    }
  }

  $: columns = [
    { key: "strike", label: "Strike Price", align: "left" },
    {
      key: isGamma ? "call_gex" : "call_dex",
      label: `Call ${isGamma ? "GEX" : "Delta"}`,
      align: "right",
    },
    {
      key: isGamma ? "put_gex" : "put_dex",
      label: `Put ${isGamma ? "GEX" : "Delta"}`,
      align: "right",
    },
    {
      key: isGamma ? "net_gex" : "net_dex",
      label: `Net ${isGamma ? "GEX" : "Delta"}`,
      align: "right",
    },
    {
      key: "put_call_ratio",
      label: `P/C`,
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
    By Strike <InfoModal
      content={title === "Gamma"
        ? `Gamma Exposure (GEX) for ${ticker} options, representing the estimated dollar value of shares that option sellers must buy or sell to maintain delta neutrality for each 1% move in ${ticker}'s stock price.`
        : `Delta Exposure (DEX) for ${ticker} options, representing the estimated net number of ${ticker} shares that option sellers must hold or short to hedge their current options positions and maintain delta neutrality.`}
    />
  </h2>

  <!-- Insightful overview paragraph -->
  <div class="w-full mt-4 mb-6 text-sm text-gray-800 dark:text-zinc-300">
    {#if rawData?.length > 0 && currentPrice}
      <p>
        {#if isGamma}
          <strong>{ticker}</strong> is currently trading at
          <strong>${currentPrice}</strong>
          with
          {#if selectedDTEs.has("All")}
            total Gamma Exposure (GEX) across all strikes and expirations
            showing
          {:else if selectedDTEs.size === 1}
            Gamma Exposure (GEX) for <strong
              >{Array.from(selectedDTEs)[0]}</strong
            > showing
          {:else}
            combined Gamma Exposure (GEX) for <strong
              >{selectedDTEs.size}</strong
            > selected DTEs showing
          {/if}
          <strong>{totalCallExposure?.toLocaleString("en-US")}</strong> from
          calls and
          <strong>{Math.abs(totalPutExposure)?.toLocaleString("en-US")}</strong>
          from puts, with a put-call ratio of
          <strong>{overallPutCallRatio}</strong>. The maximum exposure
          concentration is at the
          <strong>${maxExposureStrike?.strike?.toFixed(2)}</strong>
          strike with
          <strong>{maxExposureStrike?.net_gex?.toLocaleString("en-US")}</strong>
          net GEX,
          {maxExposureStrike?.strike > currentPrice
            ? `acting as potential resistance ${(((maxExposureStrike?.strike - currentPrice) / currentPrice) * 100).toFixed(1)}% above current price`
            : maxExposureStrike?.strike < currentPrice
              ? `providing potential support ${(((currentPrice - maxExposureStrike?.strike) / currentPrice) * 100).toFixed(1)}% below current price`
              : "right at the current price level, creating a strong pinning effect"}.
        {:else}
          <strong>{ticker}</strong> is currently trading at
          <strong>${currentPrice}</strong>
          with
          {#if selectedDTEs.has("All")}
            total Delta Exposure (DEX) across all strikes and expirations
            showing
          {:else if selectedDTEs.size === 1}
            Delta Exposure (DEX) for <strong
              >{Array.from(selectedDTEs)[0]}</strong
            > showing
          {:else}
            combined Delta Exposure (DEX) for <strong
              >{selectedDTEs.size}</strong
            > selected DTEs showing
          {/if}
          <strong>{abbreviateNumber(totalCallExposure)}</strong> shares from
          calls and
          <strong>{abbreviateNumber(Math.abs(totalPutExposure))}</strong> shares
          from puts, with a put-call ratio of
          <strong>{overallPutCallRatio}</strong>. The largest delta
          concentration is at the
          <strong>${maxExposureStrike?.strike?.toFixed(2)}</strong>
          strike with
          <strong>{abbreviateNumber(maxExposureStrike?.net_dex)}</strong> net
          shares to hedge,
          {maxExposureStrike?.net_dex > 0 &&
          maxExposureStrike?.strike > currentPrice
            ? `requiring market makers to short shares if reached, potentially capping upside ${(((maxExposureStrike?.strike - currentPrice) / currentPrice) * 100).toFixed(1)}% above`
            : maxExposureStrike?.net_dex < 0 &&
                maxExposureStrike?.strike < currentPrice
              ? `forcing market makers to buy shares if breached, providing support ${(((currentPrice - maxExposureStrike?.strike) / currentPrice) * 100).toFixed(1)}% below`
              : maxExposureStrike?.strike === currentPrice
                ? "creating significant hedging pressure at the current level"
                : "creating a key inflection point for hedging flows"}.
        {/if}
      </p>
    {:else}
      <p>
        No {title.toLowerCase()} exposure data available for the selected period.
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
            >Date to Expiration | {selectedDTEsText}</span
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
        <DropdownMenu.Group class="pb-2">
          {#each dteOptions as item, index}
            {#if data?.user?.tier === "Pro" || index === 0}
              <DropdownMenu.Item
                class="hover:text-violet-600 dark:hover:text-violet-400"
              >
                <div
                  on:click|capture={(event) => event.preventDefault()}
                  class="flex items-center"
                >
                  <label
                    class="cursor-pointer"
                    on:click={() => handleDTEChange(item)}
                    for={item}
                  >
                    <input type="checkbox" checked={isDTEChecked(item)} />
                    <span class="ml-2">
                      {item === "All" ? "All DTE" : item}
                    </span>
                  </label>
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
            title={item.label}
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
      <Infobox
        text={`No ${title.toLowerCase()} exposure data available for ${selectedDTEsText === "All" ? "all expirations" : selectedDTEsText}. Try selecting a different expiration range.`}
      />
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
        {title === "Gamma" ? "GEX" : "DEX"} Table
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
                  <span class="text-emerald-600 dark:text-emerald-400"
                    >{item?.put_call_ratio?.toFixed(2)}</span
                  >
                {:else if item?.put_call_ratio > 1 && item?.put_call_ratio !== null}
                  <span class="text-rose-600 dark:text-rose-400"
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
          <span class="hidden sm:inline">Previous</span>
        </Button>
      </div>

      <!-- Page info and rows selector in center -->
      <div class="flex flex-row items-center gap-4">
        <span class="text-sm text-gray-600 dark:text-zinc-300">
          Page {currentPage} of {totalPages}
        </span>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild let:builder>
            <Button
              builders={[builder]}
              class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span class="truncate text-[0.85rem] sm:text-sm"
                >{rowsPerPage} Rows</span
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
                    <span class="text-sm">{item} Rows</span>
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
          <span class="hidden sm:inline">Next</span>
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
        Back to Top <svg
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

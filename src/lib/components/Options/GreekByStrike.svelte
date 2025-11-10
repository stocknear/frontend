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

  export let data;
  export let title = "Gamma";
  export let ticker;
  let currentPrice = null;

  $: isGamma = title === "Gamma";

  // Calculate DTE (Days to Expiration) for each date, excluding weekends
  function calculateDTE(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(dateStr + "T00:00:00Z");

    // If expiry is before today, return negative days (counting business days)
    if (expiryDate < today) {
      const diffTime = expiryDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }

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

    return businessDays;
  }

  // Create DTE-based options
  let dteOptions = [
    "All",
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

      Object.keys(data?.getData ?? {}).forEach((date) => {
        const dte = calculateDTE(date);

        if (dte <= targetDTE) {
          selectedData[date] = data?.getData[date];
        }
      });

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

    // Ensure numerical values instead of strings (toFixed returns a string)
    const callValues = processedData?.map((d) =>
      parseFloat(d.callValue.toFixed(2)),
    );
    const putValues = processedData?.map((d) =>
      parseFloat(d.putValue.toFixed(2)),
    );
    const netValues = processedData?.map((d) =>
      parseFloat(d.netValue.toFixed(2)),
    );

    const options = {
      credits: {
        enabled: false,
      },
      chart: {
        type: "column",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 360,
        animation: false,
      },
      title: {
        text: `<h3 class="mt-3 mb-1 ">${ticker} ${title === "Gamma" ? "GEX" : "DEX"} Chart</h3>`,
        style: {
          color: $mode === "light" ? "black" : "white",
          // Using inline CSS for margin-top and margin-bottom
        },
        useHTML: true, // Enable HTML to apply custom class styling
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
          stacking: "normal",
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
          color: $mode === "light" ? "black" : "white", // Set the color of the crosshair line
          width: 1, // Adjust the line width as needed
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
          // Only display every 2nd label
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
  <h2 class=" flex flex-row items-center text-xl sm:text-2xl font-bold w-fit">
    {ticker}
    {title} Exposure By Strike <InfoModal
      content={title === "Gamma"
        ? `Gamma Exposure (GEX) for ${ticker} options, representing the estimated dollar value of shares that option sellers must buy or sell to maintain delta neutrality for each 1% move in ${ticker}'s stock price.`
        : `Delta Exposure (DEX) for ${ticker} options, representing the estimated net number of ${ticker} shares that option sellers must hold or short to hedge their current options positions and maintain delta neutrality.`}
    />
  </h2>

  <!-- Insightful overview paragraph -->
  <div class="w-full mt-4 mb-6">
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

  <div class="mt-7">
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild let:builder>
        <Button
          builders={[builder]}
          class=" border border-gray-300 dark:border-gray-700  text-white bg-black sm:hover:bg-default dark:default h-[38px] flex flex-row justify-between items-center min-w-[130px] max-w-[240px] sm:w-auto  px-3  rounded truncate"
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
        class="min-w-56 w-auto max-w-60 max-h-[400px] overflow-y-auto scroller relative"
      >
        <DropdownMenu.Group class="pb-2">
          {#each dteOptions as item, index}
            {#if data?.user?.tier === "Pro" || index === 0}
              <DropdownMenu.Item
                class="sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
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
                class="cursor-pointer sm:hover:bg-gray-200 dark:sm:hover:bg-primary"
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
  </div>

  <div class="w-full overflow-hidden m-auto sm:mt-3 shadow">
    {#if config !== null}
      <div>
        <div class="grow">
          <div class="relative">
            <!-- Apply the blur class to the chart -->
            <div
              class="mt-5 shadow sm:mt-0 sm:border sm:border-gray-300 dark:border-gray-800 rounded"
              use:highcharts={config}
            ></div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <div class="items-center lg:overflow-visible px-1 py-1 mt-10">
    <div
      class="col-span-2 flex flex-row items-center grow py-1 border-t border-b border-gray-300 dark:border-gray-800"
    >
      <h2
        class="text-start whitespace-nowrap text-xl sm:text-2xl font-semibold w-full"
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

  <div class="w-full overflow-x-auto mt-3">
    <table
      class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
    >
      <thead>
        <TableHeader {columns} {sortOrders} {sortData} />
      </thead>
      <tbody>
        {#each displayList as item, index}
          <tr
            class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
          >
            <td class=" text-sm sm:text-[1rem] text-start whitespace-nowrap">
              {item?.strike?.toFixed(2)}
            </td>
            <td class=" text-sm sm:text-[1rem] text-end whitespace-nowrap">
              {(isGamma ? item?.call_gex : item?.call_dex)?.toLocaleString(
                "en-US",
              )}
            </td>
            <td class=" text-sm sm:text-[1rem] text-end whitespace-nowrap">
              {(isGamma ? item?.put_gex : item?.put_dex)?.toLocaleString(
                "en-US",
              )}
            </td>

            <td class=" text-sm sm:text-[1rem] text-end whitespace-nowrap">
              {(isGamma ? item?.net_gex : item?.net_dex)?.toLocaleString(
                "en-US",
              )}
            </td>

            <td class=" text-sm sm:text-[1rem] text-end whitespace-nowrap">
              {#if item?.put_call_ratio <= 1 && item?.put_call_ratio !== null}
                <span class="text-green-800 dark:text-[#00FC50]"
                  >{item?.put_call_ratio?.toFixed(2)}</span
                >
              {:else if item?.put_call_ratio > 1 && item?.put_call_ratio !== null}
                <span class="text-red-800 dark:text-[#FF2F1F]"
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

  <!-- Pagination controls -->
  {#if displayList?.length > 0 && totalPages > 0}
    <div class="flex flex-row items-center justify-between mt-8 sm:mt-5">
      <!-- Previous button -->
      <div class="flex items-center gap-2">
        <Button
          on:click={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          class="w-fit transition-all flex flex-row items-center duration-50 border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary flex flex-row justify-between items-center sm:w-auto px-1.5 sm:px-3 rounded truncate"
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
        <span class="text-sm sm:text-[1rem]">
          Page {currentPage} of {totalPages}
        </span>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild let:builder>
            <Button
              builders={[builder]}
              class="w-fit transition-all duration-50 border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary flex flex-row justify-between items-center sm:w-auto px-2 sm:px-3 rounded truncate"
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
            class="w-auto min-w-40 max-h-[400px] overflow-y-auto scroller relative"
          >
            <!-- Dropdown items -->
            <DropdownMenu.Group class="pb-2">
              {#each rowsPerPageOptions as item}
                <DropdownMenu.Item
                  class="sm:hover:bg-gray-200 dark:sm:hover:bg-primary"
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
          class="w-fit transition-all flex flex-row items-center duration-50 border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary flex flex-row justify-between items-center sm:w-auto px-1.5 sm:px-3 rounded truncate"
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
        class="cursor-pointer sm:hover:text-muted text-blue-800 dark:sm:hover:text-white dark:text-blue-400 text-sm sm:text-[1rem] font-medium"
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
</div>

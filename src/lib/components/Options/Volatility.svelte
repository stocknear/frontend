<script lang="ts">
  import { removeCompanyStrings, abbreviateNumber } from "$lib/utils";
  import { displayCompanyName } from "$lib/store";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { page } from "$app/stores";
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";

  export let data;
  export let ticker;

  let isLoaded = false;
  let rawData;
  // Track the currently sorted data separately
  let sortedData = [];

  let avgIV;
  let avgRV;
  let displayList;
  let timePeriod;

  let config = null;

  // Pagination state
  let currentPage = 1;
  let rowsPerPage = 20;
  let rowsPerPageOptions = [20, 50, 100];
  let totalPages = 1;
  let pagePathName = $page?.url?.pathname;

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

  initialize();

  function initialize() {
    rawData = data?.getData || [];
    avgIV =
      rawData?.reduce((acc, entry) => acc + entry.iv, 0) / rawData?.length;
    avgRV =
      rawData?.reduce((acc, entry) => acc + entry.rv, 0) / rawData?.length;

    // Sort rawData by date descending (latest first)
    rawData = rawData?.sort((a, b) => new Date(b?.date) - new Date(a?.date));

    // Initialize sortedData with raw data
    sortedData = [...rawData];

    // Load pagination preference
    loadRowsPerPage();

    // Reset to first page and update pagination
    currentPage = 1;
    updatePaginatedData();

    timePeriod = "3M";

    config = plotData();
  }

  function filterDataByPeriod(historicalData, period = "3M") {
    const currentDate = new Date();
    let startDate = new Date();

    // Calculate the start date based on the period input
    switch (period) {
      case "3M":
        startDate.setMonth(currentDate.getMonth() - 3);
        break;
      case "6M":
        startDate.setMonth(currentDate.getMonth() - 6);
        break;
      case "1Y":
        startDate.setFullYear(currentDate.getFullYear() - 1);
        break;
      default:
        throw new Error(`Unsupported period: ${period}`);
    }

    // Filter the data based on the calculated start date
    let filteredData = historicalData?.filter((item) => {
      if (!item?.date) return false;
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= currentDate;
    });

    filteredData?.forEach((entry) => {
      const matchingData = data?.getHistoricalPrice?.find(
        (d) => d?.time === entry?.date,
      );
      if (matchingData) {
        entry.price = matchingData?.close;
      }
    });

    // Extract the dates and gamma values from the filtered data
    const dateList = filteredData?.map((item) => item.date);
    const impliedVolatility = filteredData?.map((item) => item?.iv);
    const realizedVolatility = filteredData?.map((item) => item?.rv);

    const priceList = filteredData
      ?.map((item) => item.price)
      ?.filter((price) => price != null); // Filter out null/undefined

    return {
      dateList,
      impliedVolatility,
      realizedVolatility,
      priceList,
    };
  }

  function plotData() {
    // Sort and filter the raw data as before
    const data = rawData?.sort((a, b) => new Date(a?.date) - new Date(b?.date));
    const { dateList, impliedVolatility, realizedVolatility, priceList } =
      filterDataByPeriod(data, timePeriod);

    const options = {
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        animation: false,
        height: 360,
      },
      credits: { enabled: false },
      legend: {
        enabled: true,
        align: "center", // left side
        verticalAlign: "top", // top edge
        layout: "horizontal",
        squareSymbol: false, // use our rectangle shape
        symbolWidth: 20,
        symbolHeight: 12,
        symbolRadius: 0,

        itemStyle: {
          color: $mode === "light" ? "black" : "white",
        },
      },
      title: {
        text: `<h3 class="mt-3 -mb-2 text-[1rem] sm:text-lg">Volatiltiy Exposure</h3>`,
        useHTML: true,
        style: { color: $mode === "light" ? "black" : "white" },
      },
      // Disable markers globally on hover for all series
      xAxis: {
        type: "datetime",
        endOnTick: false,
        categories: dateList,
        crosshair: {
          color: $mode === "light" ? "black" : "white", // Set the color of the crosshair line
          width: 1, // Adjust the line width as needed
          dashStyle: "Solid",
        },
        labels: {
          style: {
            color: $mode === "light" ? "#545454" : "white",
          },
          distance: 20, // Increases space between label and axis
          formatter: function () {
            const date = new Date(this.value);
            return date.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            });
          },
        },
        tickPositioner: function () {
          // Create custom tick positions with wider spacing
          const positions = [];
          const info = this.getExtremes();
          const tickCount = 5; // Reduce number of ticks displayed
          const interval = Math?.floor((info?.max - info?.min) / tickCount);

          for (let i = 0; i <= tickCount; i++) {
            positions?.push(info?.min + i * interval);
          }
          return positions;
        },
      },
      yAxis: [
        {
          gridLineWidth: 1,
          gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
          labels: {
            style: { color: $mode === "light" ? "#545454" : "white" },
          },
          title: { text: null },
          opposite: true,
        },
        {
          // Primary yAxis (left) – for volatility series
          labels: { enabled: false },
          title: { text: null },
          gridLineWidth: 0,
        },
        {
          // Primary yAxis (left) – for volatility series
          labels: { enabled: false },
          title: { text: null },
          gridLineWidth: 0,
        },
      ],
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
          // Format the x value to display time in a custom format
          let tooltipContent = `<span class="m-auto text-[1rem] font-[501]">${new Date(
            this?.x,
          ).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}</span><br>`;

          // Loop through each point in the shared tooltip
          this.points.forEach((point) => {
            tooltipContent += `
        <span style="display:inline-block; width:10px; height:10px; background-color:${point.color}; border-radius:50%; margin-right:5px;"></span>
        <span class="font-semibold text-sm">${point.series.name}:</span> 
        <span class="font-normal text-sm">${abbreviateNumber(point.y)}</span><br>`;
          });

          return tooltipContent;
        },
      },

      plotOptions: {
        series: {
          legendSymbol: "rectangle",
          marker: {
            enabled: false,
            states: {
              hover: {
                enabled: false,
              },
            },
          },
          color: $mode === "light" ? "black" : "white",
          animation: false, // Disable series animation
          states: {
            hover: {
              enabled: false, // Disable hover effect globally
            },
          },
        },
      },

      series: [
        {
          name: "Stock Price",
          type: "spline", // smooth line
          data: priceList,
          yAxis: 1,
          color: $mode === "light" ? "#000" : "#fff",
          lineWidth: 1.3,
          animation: false,
        },
        {
          name: "Implied Volatility",
          type: "spline",
          data: impliedVolatility,
          lineWidth: 2,
          yAxis: 0,
          color: $mode === "light" ? "#C69307" : "#FAD776",
          animation: false,
        },
        {
          name: "Realized Volatility",
          type: "spline",
          data: realizedVolatility,
          lineWidth: 2,
          yAxis: 0,
          color: "#007BFF",
          animation: false,
        },
      ],
    };

    return options;
  }

  function formatDate(dateStr) {
    // Convert the input date string to a Date object in UTC
    let date = new Date(dateStr + "T00:00:00Z");

    // Use the desired format and set timezone if needed
    let options = {
      timeZone: "UTC",
      month: "short", // Full month name
      day: "numeric", // Day without leading zero
      year: "numeric", // Full year
    };

    let formatter = new Intl.DateTimeFormat("en-US", options);

    return formatter.format(date); // e.g., April 11, 2025
  }

  $: columns = [
    { key: "date", label: "Date", align: "left" },
    {
      key: "changesPercentage",
      label: "% Change",
      align: "right",
    },
    {
      key: "putCallRatio",
      label: "P/C",
      align: "right",
    },
    {
      key: "total_open_interest",
      label: "Total OI",
      align: "right",
    },
    {
      key: "changesPercentageOI",
      label: "% OI Change",
      align: "right",
    },
    {
      key: "iv",
      label: "Implied Volatility",
      align: "right",
    },
    {
      key: "rv",
      label: "Realized Vol.",
      align: "right",
    },
  ];

  $: sortOrders = {
    date: { order: "none", type: "date" },
    changesPercentage: { order: "none", type: "number" },
    putCallRatio: { order: "none", type: "number" },
    iv: { order: "none", type: "number" },
    rv: { order: "none", type: "number" },
    total_open_interest: { order: "none", type: "number" },
    changesPercentageOI: { order: "none", type: "number" },
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
      // Reset to original data sorted by date descending (latest first)
      sortedData = [...rawData]?.sort(
        (a, b) => new Date(b?.date) - new Date(a?.date),
      );
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
          valueA = (a[key] || "")?.toUpperCase();
          valueB = (b[key] || "")?.toUpperCase();
          return sortOrder === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        case "number":
        default:
          valueA = parseFloat(a[key]) || 0;
          valueB = parseFloat(b[key]) || 0;
          break;
      }

      if (sortOrder === "asc") {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    };

    // Sort all data and store it
    sortedData = [...rawData].sort(compareValues);
    // Reset to first page and update pagination
    currentPage = 1;
    updatePaginatedData();
  };

  $: {
    if (timePeriod || $mode) {
      config = plotData() || null;
    }
  }

  // Reactive statement to load pagination settings when page changes
  $: if ($page?.url?.pathname && $page?.url?.pathname !== pagePathName) {
    pagePathName = $page?.url?.pathname;
    loadRowsPerPage(); // Load pagination preference for new page
    updatePaginatedData(); // Update display with loaded preference
  }
</script>

<div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto mt-2 sm:mt-0">
  <h2 class=" flex flex-row items-center text-xl sm:text-2xl font-bold w-fit">
    {ticker} Volatility Exposure
  </h2>
  <div class="w-full mt-2">
    {removeCompanyStrings($displayCompanyName)} has experienced an average implied
    volatility of {avgIV?.toFixed(2)} and an average realized volatility of {avgRV?.toFixed(
      2,
    )}.
  </div>

  <div class="w-full overflow-hidden m-auto">
    {#if config}
      <div class="flex justify-end pt-5 pb-2 space-x-2 ml-auto z-10">
        {#each ["3M", "6M", "1Y"] as item, index}
          {#if data?.user?.tier === "Pro" || index === 0}
            <label
              on:click={() => (timePeriod = item)}
              class="px-3 py-1 text-sm shadow border-gray-300 dark:border-gray-600 {timePeriod ===
              item
                ? 'bg-gray-300 dark:bg-white text-black '
                : ' bg-gray-100 dark:bg-table text-opacity-[0.6]'} transition ease-out duration-100 rounded cursor-pointer"
            >
              {item}
            </label>
          {:else if data?.user?.tier !== "Pro"}
            <a
              href="/pricing"
              class="px-3 py-1 text-sm flex flex-row items-center border border-gray-300 dark:border-gray-600 {timePeriod ===
              item
                ? 'bg-gray-300 dark:bg-white text-black '
                : ' bg-gray-100 dark:bg-table text-opacity-[0.6]'} transition ease-out duration-100 rounded cursor-pointer"
            >
              {item}
              <svg
                class="ml-1 -mt-w-3.5 h-3.5 inline-block"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                ><path
                  fill="currentColor"
                  d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                /></svg
              >
            </a>
          {/if}
        {/each}
      </div>
      <div
        class="border border-gray-300 dark:border-gray-800 rounded w-full"
        use:highcharts={config}
      ></div>
    {/if}
  </div>

  <div class="items-center lg:overflow-visible px-1 py-1 mt-10">
    <div
      class="col-span-2 flex flex-row items-center grow py-1 border-t border-b border-gray-300 dark:border-gray-800"
    >
      <h2
        class="text-start whitespace-nowrap text-xl sm:text-2xl font-semibold w-full"
      >
        Volatility History
      </h2>
      <div
        class="mt-1 w-full flex flex-row lg:flex order-1 items-center ml-auto pb-1 pt-1 sm:pt-0 w-full order-0 lg:order-1"
      >
        <div class="ml-auto">
          <DownloadData
            {data}
            {rawData}
            title={`${ticker}_volatility_history`}
          />
        </div>
      </div>
    </div>
  </div>

  <div class="w-full overflow-x-auto">
    <table
      class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto mt-4"
    >
      <thead>
        <TableHeader {columns} {sortOrders} {sortData} />
      </thead>
      <tbody>
        {#each data?.user?.tier === "Pro" ? displayList : displayList?.slice(0, 3) as item, index}
          <tr
            class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd {index +
              1 ===
              displayList?.slice(0, 3)?.length &&
            !['Pro']?.includes(data?.user?.tier)
              ? 'opacity-[0.1]'
              : ''}"
          >
            <td class=" text-sm sm:text-[1rem] text-start whitespace-nowrap">
              {formatDate(item?.date)}
            </td>

            <td class=" text-sm sm:text-[1rem] text-end">
              {#if item?.changesPercentage >= 0 && item?.changesPercentage !== null}
                <span class="text-green-800 dark:text-[#00FC50]"
                  >+{item?.changesPercentage >= 1000
                    ? abbreviateNumber(item?.changesPercentage)
                    : item?.changesPercentage?.toFixed(2)}%</span
                >
              {:else if item?.changesPercentage < 0 && item?.changesPercentage !== null}
                <span class="text-red-800 dark:text-[#FF2F1F]"
                  >{item?.changesPercentage <= -1000
                    ? abbreviateNumber(item?.changesPercentage)
                    : item?.changesPercentage?.toFixed(2)}%
                </span>
              {:else}
                n/a
              {/if}
            </td>

            <td class="text-sm sm:text-[1rem] text-end">
              {item?.putCallRatio}
            </td>

            <td class="text-sm sm:text-[1rem] text-end">
              {@html abbreviateNumber(item?.total_open_interest, false, true)}
            </td>

            <td class=" text-sm sm:text-[1rem] text-end">
              {#if item?.changesPercentageOI >= 0 && item?.changesPercentageOI !== null}
                <span class="text-green-800 dark:text-[#00FC50]"
                  >+{item?.changesPercentageOI >= 1000
                    ? abbreviateNumber(item?.changesPercentageOI)
                    : item?.changesPercentageOI?.toFixed(2)}%</span
                >
              {:else if item?.changesPercentageOI < 0 && item?.changesPercentageOI !== null}
                <span class="text-red-800 dark:text-[#FF2F1F]"
                  >{item?.changesPercentageOI <= -1000
                    ? abbreviateNumber(item?.changesPercentageOI)
                    : item?.changesPercentageOI?.toFixed(2)}%
                </span>
              {:else}
                <span class=""> n/a </span>
              {/if}
            </td>

            <td class=" text-sm sm:text-[1rem] text-end whitespace-nowrap">
              {item?.iv}
            </td>
            <td class=" text-sm sm:text-[1rem] text-end whitespace-nowrap">
              {item?.rv ?? "n/a"}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Pagination controls - only for Pro users -->
  {#if data?.user?.tier === "Pro" && displayList?.length > 0 && totalPages > 0}
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

  <UpgradeToPro {data} display={true} />
</div>

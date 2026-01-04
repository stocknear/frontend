<script lang="ts">
  import { screenWidth } from "$lib/store";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { page } from "$app/stores";
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";

  import { onMount } from "svelte";

  export let data;
  export let ticker = null;
  export let assetType = "stocks";

  const currentTime = new Date(
    new Date().toLocaleString("en-US", { timeZone: "UTC" }),
  )?.getTime();

  let rawData = data?.getData
    ?.map((item) => ({
      ...item,
      dte: daysLeft(item?.expiry),
    }))
    ?.sort((a, b) => new Date(b?.date) - new Date(a?.date));

  // Track the currently sorted data separately
  let sortedData = [...rawData];
  let displayList = sortedData?.slice(0, 50) || [];
  let currentSortKey = null;
  let currentSortOrder = "none";

  // Pagination state
  let currentPage = 1;
  let rowsPerPage = 20;
  let rowsPerPageOptions = [20, 50, 100];
  let totalPages = 1;
  let pagePathName = $page?.url?.pathname;

  let config = null;

  function daysLeft(targetDate) {
    const targetTime = new Date(targetDate).getTime();
    const difference = targetTime - currentTime;

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const daysLeft = Math?.ceil(difference / millisecondsPerDay);

    return daysLeft + "D";
  }

  function formatDate(dateStr) {
    // Convert the input date string to a Date object in UTC
    let date = new Date(dateStr + "T00:00:00Z"); // Assume input is in UTC
    let options = {
      timeZone: "UTC",
      month: "short", // Changed from "2-digit" to "short" for "Jan"
      day: "numeric", // Changed from "2-digit" to "numeric" for "17" (no leading zero)
      year: "numeric", // Changed from "2-digit" to "numeric" for "2025"
    };
    let formatter = new Intl.DateTimeFormat("en-US", options);
    return formatter.format(date);
  }

  // Pagination functions
  function updatePaginatedData() {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    displayList = sortedData?.slice(startIndex, endIndex) || [];
    totalPages = Math.ceil((sortedData?.length || 0) / rowsPerPage);
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

  onMount(async () => {
    // Load pagination preference
    loadRowsPerPage();

    // Initialize pagination
    updatePaginatedData();
  });

  $: columns = [
    { key: "optionType", label: "Type", align: "left" },
    { key: "date", label: "Transaction Date", align: "right" },
    { key: "dte", label: "DTE", align: "right" },
    { key: "unusualType", label: "Type", align: "right" },
    { key: "executionEst", label: "Exec", align: "right" },
    { key: "sentiment", label: "Sent.", align: "right" },
    { key: "size", label: "Size", align: "right" },
    { key: "price", label: "Spot", align: "right" },
    { key: "premium", label: "Prem", align: "right" },
    { key: "optionSymbol", label: "Option Chain", align: "right" },
  ];

  $: sortOrders = {
    optionType: { order: "none", type: "string" },
    date: { order: "none", type: "date" },
    optionSymbol: { order: "none", type: "string" },
    unusualType: { order: "none", type: "string" },
    executionEst: { order: "none", type: "string" },
    dte: { order: "none", type: "number" },
    sentiment: { order: "none", type: "sentiment" },
    size: { order: "none", type: "number" },
    price: { order: "none", type: "number" },
    premium: { order: "none", type: "number" },
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

    // Update tracking variables
    currentSortKey = key;
    currentSortOrder = sortOrder;

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
          valueA = a[key].toUpperCase();
          valueB = b[key].toUpperCase();
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
          valueA = parseFloat(a[key]);
          valueB = parseFloat(b[key]);
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

  // Reactive statement to load pagination settings when page changes
  $: if ($page?.url?.pathname && $page?.url?.pathname !== pagePathName) {
    pagePathName = $page?.url?.pathname;
    loadRowsPerPage(); // Load pagination preference for new page
    updatePaginatedData(); // Update display with loaded preference
  }

  function convertDateFormat(dateString) {
    if (!dateString || typeof dateString !== "string") {
      return null;
    }
    const parts = dateString.split("-");
    if (parts.length !== 3) {
      return null;
    }
    const [year, month, day] = parts;
    if (!year || !month || !day || year.length !== 4) {
      return null;
    }
    return `${month}/${day}/${year?.slice(-2)}`;
  }

  function plotBarChart() {
    // Sort by premium (highest first) and take top 10
    const chartData = [...rawData]
      ?.sort((a, b) => b?.premium - a?.premium)
      ?.slice(0, 20);

    const categories = chartData?.map(
      (item) =>
        `${convertDateFormat(item.expiry)} ${item.strike}${item.optionType === "Calls" ? "C" : "P"}`,
    );

    const barData = chartData?.map((item) => ({
      y: item.premium,
      color: item.optionType === "Puts" ? "#f87171" : "#34d399",
      originalData: item,
    }));

    const options = {
      credits: {
        enabled: false,
      },
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        type: "bar",
        height: 360,
        animation: false,
      },
      title: { text: null },
      xAxis: {
        categories,
        title: null,
        labels: {
          style: {
            color: $mode === "light" ? "#09090B" : "white",
            fontSize: "12px",
            fontWeight: "400",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden",
          },
          useHTML: true,
          formatter: function () {
            return this.value;
          },
        },
        lineWidth: 0,
        tickLength: 0,
      },
      yAxis: {
        min: 0,
        title: null,
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
        },
        gridLineWidth: 0,
        lineWidth: 0,
        tickLength: 0,
      },
      plotOptions: {
        series: {
          pointWidth: 10,
        },
        bar: {
          dataLabels: {
            enabled: true,
            inside: false,
            align: "right",
            style: {
              color: "#000",
              fontSize: "12.5px",
              textOutline: "none",
            },
            formatter: function () {
              return "$" + (this.y / 1_000_000).toFixed(1) + "M";
            },
          },
          borderWidth: 0,
          pointPadding: $screenWidth < 640 ? 0.02 : 0.18,
          groupPadding: $screenWidth < 640 ? 0.4 : -0.1,
          animation: false,
          states: {
            hover: { enabled: false },
            inactive: { enabled: false },
          },
        },
      },
      tooltip: {
        shared: false,
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
          const item = this.point.originalData;
          let tooltipContent = `<span class="m-auto text-xs">${ticker} ${convertDateFormat(item?.expiry)} ${item.strike}${item.optionType === "Calls" ? "C" : "P"}</span><br>`;
          tooltipContent += `<span class="font-normal text-sm">Premium: $${this.y?.toLocaleString("en-US")}</span><br>`;
          tooltipContent += `<span class="font-normal text-sm">Size: ${item.size?.toLocaleString("en-US")} contracts</span><br>`;
          tooltipContent += `<span class="font-normal text-sm">Sentiment: ${item.sentiment}</span>`;
          return tooltipContent;
        },
      },
      series: [
        {
          name: "Premium",
          data: barData,
          animation: false,
        },
      ],
      legend: { enabled: false },
    };
    return options;
  }

  $: {
    if (ticker && rawData?.length > 0 && typeof window !== "undefined") {
      config = plotBarChart() || null;
    }
  }
</script>

<section class="w-full overflow-hidden min-h-screen pb-40">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto mt-2 sm:mt-0">
        <h2
          class=" flex flex-row items-center text-xl sm:text-2xl font-bold w-fit mb-2 sm:mb-0"
        >
          {ticker} Unusual Activity
        </h2>
        <p class={rawData?.length > 0 ? "mt-4" : "mt-0"}>
          {#if rawData?.length > 0}
            {@const totalPremium = rawData.reduce(
              (sum, item) => sum + (item.premium || 0),
              0,
            )}
            {@const callCount = rawData.filter(
              (item) => item.optionType === "Calls",
            ).length}
            {@const putCount = rawData.filter(
              (item) => item.optionType === "Puts",
            ).length}
            {@const bullishCount = rawData.filter(
              (item) => item.sentiment === "Bullish",
            ).length}
            {@const bearishCount = rawData.filter(
              (item) => item.sentiment === "Bearish",
            ).length}
            {@const avgDTE = Math.round(
              rawData.reduce((sum, item) => sum + parseInt(item.dte || 0), 0) /
                rawData.length,
            )}
            {@const recentActivity = rawData.filter((item) => {
              const daysDiff =
                (currentTime - new Date(item.date).getTime()) /
                (1000 * 60 * 60 * 24);
              return daysDiff <= 7;
            }).length}
            {@const largestPremium = Math.max(
              ...rawData.map((item) => item.premium || 0),
            )}
            {@const sweepCount = rawData?.filter(
              (item) => item.unusualType === "Sweep",
            ).length}

            <strong>{ticker}</strong> has recorded
            <strong>{rawData.length}</strong>
            unusual options
            {rawData.length === 1 ? "trade" : "trades"} with a total premium of
            <strong>${totalPremium.toLocaleString("en-US")}</strong>. The
            activity is split between <strong>{callCount}</strong> call
            {callCount === 1 ? "order" : "orders"} ({(
              (callCount / rawData.length) *
              100
            ).toFixed(1)}%) and
            <strong>{putCount}</strong> put {putCount === 1
              ? "order"
              : "orders"}
            ({((putCount / rawData.length) * 100).toFixed(1)}%),
            {@html callCount > putCount
              ? `showing a <span class="text-green-800 dark:text-[#00FC50]">bullish skew</span>`
              : putCount > callCount
                ? `showing a <span class="text-red-800 dark:text-[#FF2F1F]">bearish skew</span>`
                : `showing <span>balanced</span> positioning`}. Sentiment
            analysis reveals
            <strong
              >{((bullishCount / rawData.length) * 100).toFixed(0)}%</strong
            >
            bullish and
            <strong
              >{((bearishCount / rawData.length) * 100).toFixed(0)}%</strong
            >
            bearish positioning
            {@html bullishCount > bearishCount * 1.5
              ? ", indicating <strong>strong bullish conviction</strong>"
              : bearishCount > bullishCount * 1.5
                ? ", indicating <strong>strong bearish conviction</strong>"
                : ", showing <strong>mixed market sentiment</strong>"}.
          {/if}
        </p>

        {#if config}
          <div
            class="sm:p-3 shadow border border-gray-300 dark:border-gray-800 rounded mt-4 mb-4"
            use:highcharts={config}
          ></div>
        {/if}

        <div class="items-center lg:overflow-visible px-1 py-1 mt-5">
          <div
            class="col-span-2 flex flex-row items-center grow py-1 border-t border-b border-gray-300 dark:border-gray-800"
          >
            <h2
              class="text-start whitespace-nowrap text-xl sm:text-2xl font-semibold w-full"
            >
              {(rawData?.length || 0)?.toLocaleString("en-US")} Activity
            </h2>
            <div
              class="mt-1 w-full flex flex-row lg:flex order-1 items-center ml-auto pb-1 pt-1 sm:pt-0 w-full order-0 lg:order-1"
            >
              <div class="ml-auto">
                <DownloadData
                  {data}
                  {rawData}
                  title={`${ticker}_unusual_activity`}
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
              {#each data?.user?.tier !== "Pro" ? displayList?.slice(0, 3) : displayList as item, index}
                <tr
                  class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd relative {index +
                    1 ===
                    rawData?.slice(0, 3)?.length &&
                  !['Pro']?.includes(data?.user?.tier)
                    ? 'opacity-[0.1]'
                    : ''}"
                >
                  <td
                    class=" text-sm sm:text-[1rem] text-start whitespace-nowrap flex flex-row items-center justify-between"
                  >
                    <span
                      class={item?.optionType === "Calls"
                        ? "dark:text-[#00FC50]"
                        : "dark:text-[#FF2F1F]"}
                    >
                      {item?.optionType === "Calls" ? "Call" : "Put"}
                      {" " + item?.strike}
                    </span>
                  </td>

                  <td
                    class=" text-sm sm:text-[1rem] text-end whitespace-nowrap"
                  >
                    {formatDate(item?.date)}
                  </td>

                  <td
                    class=" text-sm sm:text-[1rem] text-end whitespace-nowrap"
                  >
                    {item?.dte}
                  </td>

                  <td
                    class=" text-sm sm:text-[1rem] text-end whitespace-nowrap"
                  >
                    {item?.unusualType}
                  </td>

                  <td
                    class=" text-sm sm:text-[1rem] text-end whitespace-nowrap"
                  >
                    {item?.executionEst?.replace("At Midpoint", "Midpoint")}
                  </td>

                  <td
                    class="text-sm sm:text-[1rem] text-end whitespace-nowrap {item?.sentiment ===
                    'Bullish'
                      ? 'text-green-800 dark:text-[#00FC50]'
                      : item?.sentiment === 'Bearish'
                        ? 'text-red-800 dark:text-[#FF2F1F]'
                        : 'text-orange-800 dark:text-[#C8A32D]'} "
                  >
                    {item?.sentiment}
                  </td>
                  <td
                    class=" text-sm sm:text-[1rem] text-end whitespace-nowrap"
                  >
                    {item?.size?.toLocaleString("en-US")}
                  </td>

                  <td
                    class=" text-sm sm:text-[1rem] text-end whitespace-nowrap"
                  >
                    {item?.price}
                  </td>
                  <td
                    class=" text-sm sm:text-[1rem] text-end whitespace-nowrap"
                  >
                    ${item?.premium?.toLocaleString("en-US")}
                  </td>

                  <td class="text-sm sm:text-[1rem] text-end whitespace-nowrap">
                    <a
                      href={`/${["stocks", "stock"]?.includes(assetType) ? "stocks" : assetType === "etf" ? "etf" : "index"}/${ticker}/options/contract-lookup?query=${item?.optionSymbol}`}
                      class="cursor-pointer text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
                    >
                      {item?.optionSymbol}
                    </a>
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
                class="w-fit sm:w-auto transition-all duration-150 border border-gray-200/70 dark:border-zinc-800/80 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
                    class="w-fit sm:w-auto transition-all duration-150 border border-gray-200/70 dark:border-zinc-800/80 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
                  class="w-auto min-w-40 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-200/70 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
                >
                  <!-- Dropdown items -->
                  <DropdownMenu.Group class="pb-2">
                    {#each rowsPerPageOptions as item}
                      <DropdownMenu.Item
                        class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-600 dark:sm:hover:text-violet-400 transition"
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
                class="w-fit sm:w-auto transition-all duration-150 border border-gray-200/70 dark:border-zinc-800/80 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
              class="cursor-pointer text-sm font-medium text-gray-600 dark:text-zinc-400 transition hover:text-violet-600 dark:hover:text-violet-400"
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
    </div>
  </div>
</section>

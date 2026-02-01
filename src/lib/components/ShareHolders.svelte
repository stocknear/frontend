<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import {
    abbreviateNumber,
    removeCompanyStrings,
    formatString,
  } from "$lib/utils";
  import { onMount } from "svelte";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { page } from "$app/stores";
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";
  import {
    stock_detail_back_to_top,
    stock_detail_next,
    stock_detail_page_of,
    stock_detail_previous,
    stock_detail_rows,
    stock_detail_shareholders_additional,
    stock_detail_shareholders_call_flow,
    stock_detail_shareholders_col_filing,
    stock_detail_shareholders_col_institute,
    stock_detail_shareholders_col_ownership,
    stock_detail_shareholders_col_portfolio,
    stock_detail_shareholders_col_shares,
    stock_detail_shareholders_col_shares_change,
    stock_detail_shareholders_col_value,
    stock_detail_shareholders_declined,
    stock_detail_shareholders_decrease,
    stock_detail_shareholders_description,
    stock_detail_shareholders_dropping,
    stock_detail_shareholders_expanded,
    stock_detail_shareholders_find,
    stock_detail_shareholders_grew,
    stock_detail_shareholders_increase,
    stock_detail_shareholders_increasing,
    stock_detail_shareholders_options_activity,
    stock_detail_shareholders_options_bearish,
    stock_detail_shareholders_options_bullish,
    stock_detail_shareholders_options_holding,
    stock_detail_shareholders_options_neutral,
    stock_detail_shareholders_others,
    stock_detail_shareholders_ownership,
    stock_detail_shareholders_put_call,
    stock_detail_shareholders_put_flow,
    stock_detail_shareholders_reduced,
    stock_detail_shareholders_reduction,
    stock_detail_shareholders_top_shareholders,
  } from "$lib/paraglide/messages";

  export let data;

  let rawData = data?.getShareholderData || {};

  let callPercentage;
  let putPercentage;
  let totalCalls;
  let totalPuts;
  let putCallRatio;

  let shareholderList = rawData?.shareholders;
  let filteredData = [];
  let displayList = [];
  let config;

  let topHolders = 0;
  let inputValue = "";
  let searchWorker: Worker | undefined;

  // Pagination state
  let currentPage = 1;
  let rowsPerPage = 20;
  let rowsPerPageOptions = [20, 50, 100];
  let totalPages = 1;
  let pagePathName = $page?.url?.pathname;

  function plotData() {
    // Get top 10 shareholders and calculate their ownership
    const topShareholders = shareholderList?.slice(0, 10) || [];
    const topShareholdersOwnership = topShareholders.reduce(
      (acc, item) => acc + (item?.ownership || 0),
      0,
    );

    // Calculate others (rest of shareholders)
    const othersOwnership =
      (rawData?.ownershipPercent || 0) - topShareholdersOwnership;

    // Color palette
    const colors = [
      "#2B5F75", // Dark blue
      "#4A7BA7", // Medium blue
      "#8B5A9B", // Purple
      "#C85A9B", // Pink-purple
      "#E85A85", // Pink
      "#F5756B", // Coral
      "#F9A05C", // Orange
      "#FFC04D", // Yellow
      "#FFD93D", // Bright yellow
      "#4A6B8A", // Blue-gray
    ];

    // Transform data for pie chart
    const pieData = topShareholders.map((item, index) => ({
      name:
        item?.name?.length > 30 ? item?.name?.slice(0, 30) + "..." : item?.name,
      y: item?.ownership || 0,
      color: colors[index % colors.length],
    }));

    // Add "Others" if there's remaining ownership
    if (othersOwnership > 0) {
      pieData.push({
        name: stock_detail_shareholders_others(),
        y: othersOwnership,
        color: "#9B7BA7", // Light purple
      });
    }

    const options = {
      credits: {
        enabled: false,
      },
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        type: "pie",
        height: 400,
        animation: false,
      },
      title: {
        text: `<h3 class="mt-3 mb-1 text-center text-sm font-semibold tracking-tight"></h3>`,
        useHTML: true,
        style: { color: $mode === "light" ? "black" : "white" },
      },
      plotOptions: {
        pie: {
          allowPointSelect: false,
          cursor: "pointer",
          dataLabels: {
            enabled: true,
            distance: 20,
            style: {
              color: $mode === "light" ? "#333" : "#fff",
              fontSize: "13px",
              fontWeight: "500",
              textOutline: "none",
            },
            formatter: function () {
              return `<span style="font-weight: 600">${this.point.name}:</span> ${this.y.toFixed(2)}%`;
            },
          },
          showInLegend: false,
          borderWidth: 0,
          size: "85%",
          innerSize: "0%",
          animation: false,
          enableMouseTracking: false,
          states: {
            hover: {
              enabled: false,
            },
            inactive: {
              enabled: false,
            },
          },
        },
      },
      tooltip: {
        enabled: false,
      },
      series: [
        {
          name: stock_detail_shareholders_ownership(),
          data: pieData,
          animation: false,
        },
      ],
      legend: {
        enabled: false,
      },
    };

    return options;
  }

  totalCalls = rawData?.totalCalls ?? 0;
  totalPuts = rawData?.totalPuts ?? 0;
  if (totalCalls + totalPuts !== 0) {
    callPercentage = (100 * totalCalls) / (totalCalls + totalPuts);
    putPercentage = 100 - callPercentage;
    putCallRatio = rawData?.putCallRatio;
  } else {
    callPercentage = 0;
    putPercentage = 0;
    putCallRatio = 0;
  }

  let charNumber = 25;

  function updatePaginatedData() {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    displayList = filteredData?.slice(start, end);
    totalPages = Math.ceil(filteredData?.length / rowsPerPage);
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
        `shareholders_rowsPerPage_${pagePathName}`,
        rowsPerPage.toString(),
      );
    }
  }

  function loadRowsPerPage() {
    if (typeof localStorage !== "undefined") {
      const savedRowsPerPage = localStorage.getItem(
        `shareholders_rowsPerPage_${pagePathName}`,
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

  async function resetTableSearch() {
    inputValue = "";
    filteredData = [...(shareholderList || [])];
    currentPage = 1;
    updatePaginatedData();
  }

  async function search() {
    const searchValue = inputValue?.toLowerCase();

    setTimeout(async () => {
      if (searchValue?.length > 0) {
        await loadSearchWorker();
      } else {
        // Reset to original data if filter is empty
        filteredData = [...(shareholderList || [])];
        currentPage = 1;
        updatePaginatedData();
      }
    }, 100);
  }

  const loadSearchWorker = async () => {
    if (searchWorker && shareholderList?.length > 0) {
      searchWorker.postMessage({
        rawData: shareholderList,
        inputValue: inputValue?.toLowerCase(),
      });
    }
  };

  const handleSearchMessage = (event) => {
    if (event.data?.message === "success") {
      filteredData = event.data?.output ?? [];
      currentPage = 1;
      updatePaginatedData();
    }
  };

  function initialize() {
    filteredData = [...(shareholderList || [])];
    loadRowsPerPage();
    currentPage = 1;
    updatePaginatedData();
  }

  onMount(async () => {
    // Load pagination preference
    loadRowsPerPage();

    // Initialize pagination
    initialize();

    if (!searchWorker) {
      const SearchWorker =
        await import("$lib/workers/tableSearchWorker?worker");
      searchWorker = new SearchWorker.default();
      searchWorker.onmessage = handleSearchMessage;
    }
  });

  $: {
    if (pagePathName) {
      initialize();
    }
  }

  $: columns = [
    {
      key: "name",
      label: stock_detail_shareholders_col_institute(),
      align: "left",
    },
    {
      key: "ownership",
      label: stock_detail_shareholders_col_ownership(),
      align: "right",
    },
    {
      key: "sharesNumber",
      label: stock_detail_shareholders_col_shares(),
      align: "right",
    },
    {
      key: "changeInSharesNumberPercentage",
      label: stock_detail_shareholders_col_shares_change(),
      align: "right",
    },
    {
      key: "marketValue",
      label: stock_detail_shareholders_col_value(),
      align: "right",
    },
    {
      key: "weight",
      label: stock_detail_shareholders_col_portfolio(),
      align: "right",
    },
    {
      key: "filingDate",
      label: stock_detail_shareholders_col_filing(),
      align: "right",
    },
  ];

  let sortOrders = {
    name: { order: "none", type: "string" },
    ownership: { order: "none", type: "number" },
    sharesNumber: { order: "none", type: "number" },
    changeInSharesNumberPercentage: { order: "none", type: "number" },
    marketValue: { order: "none", type: "number" },
    weight: { order: "none", type: "number" },
    filingDate: { order: "none", type: "date" },
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

    // Determine the data source based on search state
    const dataToSort =
      inputValue?.length > 0 ? [...filteredData] : [...(shareholderList || [])];

    // Reset to original data when 'none' and stop further sorting
    if (sortOrder === "none") {
      filteredData = dataToSort;
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

    // Sort the data and update filteredData
    filteredData = dataToSort.sort(compareValues);
    currentPage = 1;
    updatePaginatedData();
  };

  $: {
    if ($mode) {
      config = plotData();
    }
  }
</script>

<section class="overflow-hidden h-full pb-8">
  <main class="overflow-hidden">
    {#if shareholderList?.length !== 0}
      <div
        class="mt-3 text-sm text-gray-800 dark:text-zinc-300 leading-relaxed"
      >
        <p>
          {@html stock_detail_shareholders_description({
            count: rawData?.investorsHolding?.toLocaleString("en-US"),
            company: removeCompanyStrings($displayCompanyName),
            direction:
              rawData?.investorsHoldingChange >= 0
                ? stock_detail_shareholders_expanded()
                : stock_detail_shareholders_reduced(),
            changeType:
              rawData?.investorsHoldingChange >= 0
                ? stock_detail_shareholders_increase()
                : stock_detail_shareholders_decrease(),
            change: Math.abs(rawData?.investorsHoldingChange),
            sharesDirection:
              rawData?.numberOf13FsharesChange >= 0
                ? stock_detail_shareholders_additional()
                : stock_detail_shareholders_reduction(),
            sharesChange: abbreviateNumber(
              Math.abs(rawData?.numberOf13FsharesChange),
              false,
              true,
            ),
            capitalDirection:
              rawData?.totalInvestedChange >= 0
                ? stock_detail_shareholders_grew()
                : stock_detail_shareholders_declined(),
            capitalChange: abbreviateNumber(
              Math.abs(rawData?.totalInvestedChange),
              true,
              true,
            ),
            ownershipDirection:
              rawData?.ownershipPercent >= rawData?.lastOwnershipPercent
                ? stock_detail_shareholders_increasing()
                : stock_detail_shareholders_dropping(),
            lastOwnership: rawData?.lastOwnershipPercent?.toFixed(2),
            currentOwnership: rawData?.ownershipPercent?.toFixed(2),
          })}
        </p>

        <div
          class="border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 w-full mt-4"
          use:highcharts={config}
        ></div>
      </div>

      {#if putCallRatio !== 0}
        <h1
          class="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white mb-3 mt-6"
        >
          {stock_detail_shareholders_options_activity()}
        </h1>

        <div class="mt-2 text-sm text-gray-800 dark:text-zinc-300">
          {stock_detail_shareholders_options_holding()}
          {callPercentage > 55
            ? stock_detail_shareholders_options_bullish()
            : callPercentage < 45
              ? stock_detail_shareholders_options_bearish()
              : stock_detail_shareholders_options_neutral()}
        </div>

        <div class="w-full mt-5 mb-10 m-auto flex justify-center items-center">
          <div
            class="w-full grid grid-cols-2 lg:grid-cols-4 gap-y-3 lg:gap-y-3 gap-x-3"
          >
            <!--Start Put/Call-->
            <div
              class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 rounded-2xl h-20"
            >
              <div class="flex flex-col items-start">
                <span
                  class="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                  >{stock_detail_shareholders_put_call()}</span
                >
                <span
                  class="text-start text-sm text-gray-700 dark:text-zinc-200"
                >
                  {putCallRatio?.toFixed(3)}
                </span>
              </div>
              <!-- Circular Progress -->
              <div class="relative size-14 ml-auto">
                <svg
                  class="size-full w-14 h-14"
                  viewBox="0 0 36 36"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <!-- Background Circle -->
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    class="stroke-current text-gray-200 dark:text-zinc-800"
                    stroke-width="3"
                  ></circle>
                  <!-- Progress Circle inside a group with rotation -->
                  <g class="origin-center -rotate-90 transform">
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      class="stroke-current text-gray-600/70 dark:text-zinc-400"
                      stroke-width="3"
                      stroke-dasharray="100"
                      stroke-dashoffset={putCallRatio >= 1
                        ? 0
                        : 100 - (putCallRatio * 100)?.toFixed(2)}
                    ></circle>
                  </g>
                </svg>
                <!-- Percentage Text -->
                <div
                  class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2"
                >
                  <span
                    class="text-center text-sm text-gray-700 dark:text-zinc-200"
                    >{putCallRatio?.toFixed(2)}</span
                  >
                </div>
              </div>
              <!-- End Circular Progress -->
            </div>
            <!--End Put/Call-->
            <!--Start Call Flow-->
            <div
              class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 rounded-2xl h-20"
            >
              <div class="flex flex-col items-start">
                <span
                  class="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                  >{stock_detail_shareholders_call_flow()}</span
                >
                <span
                  class="text-start text-sm text-gray-700 dark:text-zinc-200"
                >
                  {new Intl.NumberFormat("en", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(rawData?.totalCalls)}
                </span>
              </div>
              <!-- Circular Progress -->
              <div class="relative size-14 ml-auto">
                <svg
                  class="size-full w-14 h-14"
                  viewBox="0 0 36 36"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <!-- Background Circle -->
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    class="stroke-current text-gray-200 dark:text-zinc-800"
                    stroke-width="3"
                  ></circle>
                  <!-- Progress Circle inside a group with rotation -->
                  <g class="origin-center -rotate-90 transform">
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      class="stroke-current text-emerald-500/70 dark:text-emerald-400"
                      stroke-width="3"
                      stroke-dasharray="100"
                      stroke-dashoffset={(100 - callPercentage)?.toFixed(2)}
                    ></circle>
                  </g>
                </svg>
                <!-- Percentage Text -->
                <div
                  class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2"
                >
                  <span
                    class="text-center text-sm text-gray-700 dark:text-zinc-200"
                    >{callPercentage?.toFixed(0)}%</span
                  >
                </div>
              </div>
              <!-- End Circular Progress -->
            </div>
            <!--End Call Flow-->

            <!--Start Put Flow-->
            <div
              class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 rounded-2xl h-20"
            >
              <div class="flex flex-col items-start">
                <span
                  class="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                  >{stock_detail_shareholders_put_flow()}</span
                >
                <span
                  class="text-start text-sm text-gray-700 dark:text-zinc-200"
                >
                  {new Intl.NumberFormat("en", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(rawData?.totalPuts)}
                </span>
              </div>
              <!-- Circular Progress -->
              <div class="relative size-14 ml-auto">
                <svg
                  class="size-full w-14 h-14"
                  viewBox="0 0 36 36"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <!-- Background Circle -->
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    class="stroke-current text-gray-200 dark:text-zinc-800"
                    stroke-width="3"
                  ></circle>
                  <!-- Progress Circle inside a group with rotation -->
                  <g class="origin-center -rotate-90 transform">
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      class="stroke-current text-rose-500/70 dark:text-rose-400"
                      stroke-width="3"
                      stroke-dasharray="100"
                      stroke-dashoffset={100 - putPercentage}
                    ></circle>
                  </g>
                </svg>
                <!-- Percentage Text -->
                <div
                  class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2"
                >
                  <span
                    class="text-center text-sm text-gray-700 dark:text-zinc-200"
                    >{putPercentage?.toFixed(0)}%</span
                  >
                </div>
              </div>
              <!-- End Circular Progress -->
            </div>
            <!--End Put Flow-->
          </div>
        </div>
      {/if}

      <div class="items-center lg:overflow-visible px-1 py-1 mt-4">
        <div
          class="col-span-2 flex flex-col lg:flex-row items-start sm:items-center lg:order-2 lg:grow py-1 border-t border-b border-gray-300 dark:border-zinc-700"
        >
          <h2
            class="text-start whitespace-nowrap text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white py-1 border-b border-gray-300 dark:border-zinc-700 lg:border-none w-full"
          >
            {stock_detail_shareholders_top_shareholders()}
          </h2>
          <div
            class="mt-1 w-full flex flex-row lg:flex order-1 items-center ml-auto pb-1 pt-1 sm:pt-0 w-full order-0 lg:order-1"
          >
            <div class="relative lg:ml-auto w-full lg:w-fit">
              <div
                class="inline-block cursor-pointer absolute right-2 top-2 text-sm"
              >
                {#if inputValue?.length > 0}
                  <label
                    class="cursor-pointer"
                    on:click={() => resetTableSearch()}
                  >
                    <svg
                      class="w-5 h-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      ><path
                        fill="currentColor"
                        d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
                      /></svg>

                  </label>
                {/if}
              </div>

              <input
                bind:value={inputValue}
                on:input={search}
                type="text"
                placeholder={stock_detail_shareholders_find()}
                class="py-2 text-[0.85rem] sm:text-sm border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 rounded-full text-gray-700 dark:text-zinc-200 placeholder:text-gray-800 dark:placeholder:text-zinc-300 px-3 focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80 grow w-full sm:min-w-56 lg:max-w-14"
              />
            </div>

            <div class="ml-2">
              <DownloadData
                {data}
                rawData={shareholderList}
                title={`13-institute-${$stockTicker}`}
              />
            </div>
          </div>
        </div>
      </div>

      <div class="mt-3 w-full m-auto mb-4 overflow-x-auto">
        <div class="w-full">
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
                {#if item?.name?.length > 0}
                  <tr class="transition-colors">
                    <td class="text-sm whitespace-nowrap">
                      <a
                        href={"/hedge-funds/" + item?.cik}
                        class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                      >
                        {item?.name?.length > charNumber
                          ? item?.name?.slice(0, charNumber) + "..."
                          : item?.name}
                      </a>
                    </td>

                    <td class="text-end text-sm whitespace-nowrap">
                      {item?.ownership <= 0.01
                        ? "< 0.01%"
                        : item?.ownership?.toFixed(2) + "%"}
                    </td>

                    <td class="text-end text-sm whitespace-nowrap">
                      {@html item?.sharesNumber !== null
                        ? abbreviateNumber(item?.sharesNumber, false, true)
                        : "-"}
                    </td>

                    <td class="text-end text-sm whitespace-nowrap">
                      {#if item?.changeInSharesNumberPercentage >= 0}
                        <span class="text-emerald-800 dark:text-emerald-400"
                          >+{abbreviateNumber(
                            item?.changeInSharesNumberPercentage?.toFixed(2),
                          )}%</span
                        >
                      {:else if item?.changeInSharesNumberPercentage < 0}
                        <span class="text-rose-800 dark:text-rose-400"
                          >{abbreviateNumber(
                            item?.changeInSharesNumberPercentage?.toFixed(2),
                          )}%</span
                        >
                      {:else}
                        -
                      {/if}
                    </td>

                    <td class="text-end text-sm whitespace-nowrap">
                      {item?.marketValue !== null
                        ? abbreviateNumber(item?.marketValue)
                        : "-"}
                    </td>

                    <td class="text-end text-sm whitespace-nowrap">
                      {item?.weight <= 0.01
                        ? "< 0.01%"
                        : item?.weight?.toFixed(2) + "%"}
                    </td>

                    <td class="text-end text-sm whitespace-nowrap">
                      {new Date(item?.filingDate)?.toLocaleDateString("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                        timeZone: "UTC",
                      })}
                    </td>
                  </tr>
                {/if}
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
              <span class="hidden sm:inline">{stock_detail_previous()}</span>
            </Button>
          </div>

          <!-- Page info and rows selector in center -->
          <div class="flex flex-row items-center gap-4">
            <span class="text-sm text-gray-600 dark:text-zinc-300">
              {stock_detail_page_of({
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
                    >{stock_detail_rows({ count: rowsPerPage })}</span
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
                      class="text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
                    >
                      <label
                        on:click={() => changeRowsPerPage(item)}
                        class="inline-flex justify-between w-full items-center cursor-pointer"
                      >
                        <span class="text-sm"
                          >{stock_detail_rows({ count: item })}</span
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
              <span class="hidden sm:inline">{stock_detail_next()}</span>
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
            {stock_detail_back_to_top()}
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

      <UpgradeToPro {data} />
    {/if}
  </main>
</section>

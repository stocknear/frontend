<script lang="ts">
  import { formatString, sectorNavigation } from "$lib/utils";
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";
  import RatingsChart from "$lib/components/RatingsChart.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import { onMount } from "svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { page } from "$app/stores";

  import DownloadData from "$lib/components/DownloadData.svelte";

  export let data;

  let rawData = data?.getData?.output;
  let numOfTrades = rawData?.history?.length;
  let performance = rawData?.performance || {};
  let performanceScore = performance?.score;
  let performanceRank = performance?.rank;
  let performanceSuccessRate = performance?.successRate;
  let performanceAvgReturn = performance?.avgReturn;
  let performanceTrades = performance?.totalTrades;

  let rawDataTable = processTickerData(rawData?.history) || [];
  let originalData = rawDataTable;
  let stockList = [];
  let inputValue = "";
  let searchWorker: Worker | undefined;

  // Pagination state
  let currentPage = 1;
  let rowsPerPage = 20;
  let rowsPerPageOptions = [20, 50, 100];
  let totalPages = 1;

  let pagePathName = $page?.url?.pathname;

  let name = rawData?.history?.at(0)?.representative ?? "n/a";
  let mainSectors = rawData?.mainSectors || [];
  let mainIndustries = rawData?.mainIndustries || [];

  const typeCounts = rawData?.history?.reduce((counts, item) => {
    counts[item?.type] = (counts[item?.type] || 0) + 1;
    return counts;
  }, {});

  let buySellRatio =
    typeCounts["Bought"] > 0 && typeCounts["Sold"] === undefined
      ? 1
      : typeCounts["Bought"] === undefined
        ? 0
        : typeCounts["Bought"] / typeCounts["Sold"];

  let totalAmountTraded = rawData?.history?.reduce((sum, item) => {
    const amount = item?.amount;
    const parsedAmount = extractNumberFromAmount(amount);
    return sum + parsedAmount;
  }, 0);
  let politicianDistrict = data?.getData?.politicianDistrict;
  let politicianCongress = data?.getData?.politicianCongress;
  let lastTradedDate = rawData?.history?.at(0)?.transactionDate;

  let politicianParty = data?.getData?.politicianParty;

  // Function to extract the number from the amount string
  function extractNumberFromAmount(amount) {
    const dashIndex = amount?.indexOf("-");
    if (dashIndex !== -1) {
      const numberAfterDash = amount?.slice(dashIndex + 1);
      const suffix = numberAfterDash?.slice(-1);
      let multiplier = 1;
      if (suffix === "K") {
        multiplier = 1e3;
      } else if (suffix === "M") {
        multiplier = 1e6;
      }
      const parsedNumber =
        parseFloat(numberAfterDash?.replace(/[^\d.]/g, "")) * multiplier;
      return isNaN(parsedNumber) ? 0 : parsedNumber;
    }
    return 0;
  }

  function processTickerData(data) {
    const tickerMap = new Map();

    data?.forEach((item) => {
      const { ticker } = item;

      if (!ticker) return; // Skip if ticker is not defined

      if (!tickerMap?.has(ticker)) {
        // Add the item and initialize count
        tickerMap?.set(ticker, { ...item, transaction: 1 });
      } else {
        const existing = tickerMap?.get(ticker);

        // Increment the ratings count
        existing.transaction += 1;

        // Keep the item with the latest date
        if (
          new Date(item?.transactionDate) > new Date(existing?.transactionDate)
        ) {
          tickerMap?.set(ticker, {
            ...item,
            transaction: existing?.transaction,
          });
        }
      }
    });

    // Convert the Map back to an array
    return Array?.from(tickerMap?.values());
  }

  // Pagination functions
  function updatePaginatedData() {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const dataSource = inputValue?.length > 0 ? rawDataTable : originalData;
    stockList = dataSource?.slice(startIndex, endIndex) || [];
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

  async function resetTableSearch() {
    inputValue = "";
    rawDataTable = originalData;
    currentPage = 1; // Reset to first page
    updatePaginatedData();
  }

  async function search() {
    inputValue = inputValue?.toLowerCase();

    setTimeout(async () => {
      if (inputValue?.length > 0) {
        await loadSearchWorker();
      } else {
        // Reset to original data if filter is empty
        rawDataTable = originalData || [];
        currentPage = 1; // Reset to first page
        updatePaginatedData();
      }
    }, 100);
  }

  const loadSearchWorker = async () => {
    if (searchWorker && originalData?.length > 0) {
      searchWorker.postMessage({
        rawData: originalData,
        inputValue: inputValue,
      });
    }
  };

  const handleSearchMessage = (event) => {
    if (event.data?.message === "success") {
      rawDataTable = event.data?.output ?? [];
      currentPage = 1; // Reset to first page after search
      updatePaginatedData();
    }
  };

  onMount(async () => {
    // Load pagination preference
    loadRowsPerPage();

    // Initialize pagination
    updatePaginatedData();

    if (!searchWorker) {
      const SearchWorker = await import(
        "$lib/workers/tableSearchWorker?worker"
      );
      searchWorker = new SearchWorker.default();
      searchWorker.onmessage = handleSearchMessage;
    }
  });

  // Update pagination when rawDataTable changes
  $: if (rawDataTable && rawDataTable.length > 0) {
    updatePaginatedData();
  }

  // Reactive statement to load pagination settings when page changes
  $: if ($page?.url?.pathname && $page?.url?.pathname !== pagePathName) {
    pagePathName = $page?.url?.pathname;
    loadRowsPerPage(); // Load pagination preference for new page
    updatePaginatedData(); // Update display with loaded preference
  }

  $: checkedSymbol = "";
  function openGraph(symbol) {
    // Clear all existing symbols
    if (checkedSymbol === symbol) {
      checkedSymbol = "";
    } else {
      checkedSymbol = symbol;
    }
  }
</script>

<SEO
  title={`${name} - ${politicianParty} Member | Investment & Trading Activity`}
  description={`${name}, a member of ${politicianParty}, made ${numOfTrades} trades totaling ${totalAmountTraded}. Discover their buy/sell ratio of ${buySellRatio} and investment trends.`}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-6 px-4 lg:px-6 text-gray-700 dark:text-zinc-200"
>
  <div class="text-xs sm:text-sm breadcrumbs text-gray-800 dark:text-zinc-300">
    <ul>
      <li>
        <a
          href="/"
          class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          >Home</a
        >
      </li>
      <li>
        <a
          href="/politicians"
          class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          >Politicians</a
        >
      </li>

      <li class="text-gray-800 dark:text-zinc-300">{name}</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class="w-full m-auto mt-12">
            <div class="items-center justify-between lg:flex">
              <div
                class="flex space-x-3 border-b border-gray-300 dark:border-zinc-700 pb-3 lg:border-none lg:pb-0"
              >
                <div class="shrink-0">
                  <div
                    class="h-16 w-16 sm:h-20 sm:w-20 relative rounded-full {politicianParty ===
                    'Republican'
                      ? 'republican-striped bg-[#98272B]'
                      : politicianParty === 'Democratic'
                        ? 'democratic-striped bg-[#295AC7]'
                        : 'other-striped bg-[#20202E]'} flex items-center justify-center"
                  >
                    <img
                      style="clip-path: circle(50%);"
                      class="rounded-full w-12 sm:w-16"
                      src={`/img/senator/${name?.replace(/\s+/g, "_")}.png`}
                      loading="lazy"
                    />
                  </div>
                </div>
                <div class="mt-0 pt-0.5 text-left">
                  <h1
                    class="mb-0 text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
                  >
                    {formatString(name)}
                  </h1>
                  <p class="mb-0.5 text-sm text-gray-800 dark:text-zinc-300">
                    {politicianParty ?? "n/a"} / {politicianCongress}
                    {#if politicianDistrict !== undefined && politicianDistrict?.length !== 0}
                      / {politicianDistrict}
                    {/if}
                  </p>
                  <div class="inline-flex items-center mt-1">
                    <div class="flex flex-row items-center">
                      {#each Array.from({ length: 5 }) as _, i}
                        {#if i < Math?.floor(performanceScore || 0)}
                          <svg
                            class="w-5 h-5 text-[#FFA500]"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 22 20"
                          >
                            <path
                              d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"
                            />
                          </svg>
                        {:else}
                          <svg
                            class="w-5 h-5 text-gray-800 dark:text-zinc-300"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 22 20"
                          >
                            <path
                              d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"
                            />
                          </svg>
                        {/if}
                      {/each}
                    </div>
                    <span class="ml-1 text-sm text-gray-800 dark:text-zinc-300"
                      >({performanceScore ?? "n/a"})</span
                    >
                  </div>
                </div>
              </div>
              <div
                class="mt-4 grid grid-cols-2 overflow-hidden rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/60 dark:bg-zinc-950/40 py-2 text-center md:grid-cols-4 md:p-0 lg:mt-0"
              >
                <div class="flex flex-col px-4 py-2 bp:px-6 md:py-6">
                  <div
                    class="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white tabular-nums"
                  >
                    # {performanceRank ?? "n/a"}
                  </div>
                  <div
                    class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
                  >
                    Rank
                  </div>
                </div>

                <div
                  class="flex flex-col px-4 py-2 bp:px-6 sm:border-l border-gray-200 dark:sm:border-zinc-800/80 md:py-6"
                >
                  <div
                    class="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white tabular-nums"
                  >
                    {performanceTrades !== undefined &&
                    performanceTrades !== null
                      ? performanceTrades?.toLocaleString("en-US")
                      : numOfTrades !== undefined && numOfTrades !== null
                        ? numOfTrades?.toLocaleString("en-US")
                        : "n/a"}
                  </div>
                  <div
                    class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
                  >
                    Trades Scored
                  </div>
                </div>

                <div
                  class="flex flex-col px-4 py-2 bp:px-6 sm:border-l border-gray-200 dark:sm:border-zinc-800/80 md:py-6"
                >
                  <div
                    class="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white tabular-nums"
                  >
                    <span
                      class={performanceSuccessRate >= 0 &&
                      performanceSuccessRate !== undefined &&
                      performanceSuccessRate !== null
                        ? "before:content-['+'] text-emerald-600 dark:text-emerald-400"
                        : performanceSuccessRate < 0 &&
                            performanceSuccessRate !== undefined &&
                            performanceSuccessRate !== null
                          ? "text-rose-600 dark:text-rose-400"
                          : ""}
                      >{performanceSuccessRate !== undefined &&
                      performanceSuccessRate !== null
                        ? performanceSuccessRate?.toFixed(2) + "%"
                        : "n/a"}</span
                    >
                  </div>
                  <div
                    class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
                  >
                    Success Rate
                  </div>
                </div>
                <div
                  class="flex flex-col px-4 py-2 bp:px-6 sm:border-l border-gray-200 dark:sm:border-zinc-800/80 md:py-6"
                >
                  <div
                    class="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white tabular-nums"
                  >
                    <span
                      class={performanceAvgReturn >= 0 &&
                      performanceAvgReturn !== undefined &&
                      performanceAvgReturn !== null
                        ? "before:content-['+'] text-emerald-600 dark:text-emerald-400"
                        : performanceAvgReturn < 0 &&
                            performanceAvgReturn !== undefined &&
                            performanceAvgReturn !== null
                          ? "text-rose-600 dark:text-rose-400"
                          : ""}
                      >{performanceAvgReturn !== undefined &&
                      performanceAvgReturn !== null
                        ? performanceAvgReturn?.toFixed(2) + "%"
                        : "n/a"}</span
                    >
                  </div>
                  <div
                    class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
                  >
                    Avg. Return
                  </div>
                </div>
              </div>
            </div>

            <div
              class="mt-4 grid grid-cols-2 overflow-hidden rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/60 dark:bg-zinc-950/40 py-2 text-center md:grid-cols-4 md:p-0"
            >
              <div class="flex flex-col px-4 py-2 bp:px-6 md:py-6">
                <div
                  class="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white tabular-nums"
                >
                  ${new Intl.NumberFormat("en", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(totalAmountTraded)}
                </div>
                <div
                  class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
                >
                  Total Amount
                </div>
              </div>

              <div
                class="flex flex-col px-4 py-2 bp:px-6 sm:border-l border-gray-200 dark:sm:border-zinc-800/80 md:py-6"
              >
                <div
                  class="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white tabular-nums"
                >
                  {numOfTrades?.toLocaleString("en-US")}
                </div>
                <div
                  class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
                >
                  Transaction
                </div>
              </div>

              <div
                class="flex flex-col px-4 py-2 bp:px-6 sm:border-l border-gray-200 dark:sm:border-zinc-800/80 md:py-6"
              >
                <div
                  class="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white tabular-nums"
                >
                  {lastTradedDate?.length !== undefined
                    ? new Date(lastTradedDate)?.toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        daySuffix: "2-digit",
                      })
                    : "n/a"}
                </div>
                <div
                  class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
                >
                  Last Transaction
                </div>
              </div>
              <div
                class="flex flex-col px-4 py-2 bp:px-6 sm:border-l border-gray-200 dark:sm:border-zinc-800/80 md:py-6"
              >
                <div
                  class="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white tabular-nums"
                >
                  {buySellRatio?.toFixed(2)}
                </div>
                <div
                  class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
                >
                  Buy/Sell
                </div>
              </div>
            </div>

            {#if mainSectors?.length !== 0}
              <div class="mb-10 mt-10">
                <div
                  class="relative my-3 space-y-2 rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/60 dark:bg-zinc-950/40 sm:my-6 p-4"
                >
                  <div class="flex flex-col sm:flex-row sm:items-center">
                    <div
                      class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-300 sm:mb-0 sm:mr-2 text-center sm:text-left"
                    >
                      Main Sectors:
                    </div>
                    <div
                      class="flex flex-wrap items-center gap-x-2 gap-y-3 justify-center sm:justify-start"
                    >
                      {#each mainSectors as item}
                        <a
                          href={sectorNavigation?.find(
                            (listItem) => listItem?.title === item,
                          )?.link}
                          class="inline-flex items-center rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/50 px-3 py-1 text-xs font-semibold sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                        >
                          {item}
                        </a>
                      {/each}
                    </div>
                  </div>
                  <div class="flex flex-col sm:flex-row sm:items-center">
                    <div
                      class="mb-2 whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-300 sm:mb-0 sm:mr-2 text-center sm:text-left"
                    >
                      Top Industries:
                    </div>
                    <div
                      class="flex flex-wrap items-center gap-x-2 gap-y-3 justify-center sm:justify-start"
                    >
                      {#each mainIndustries as item}
                        <a
                          href={`/list/industry/${item?.replace(/ /g, "-")?.replace(/&/g, "and")?.replace(/-{2,}/g, "-")?.toLowerCase()}`}
                          class="inline-flex items-center rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/50 px-3 py-1 text-xs font-semibold sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                        >
                          {item}
                        </a>
                      {/each}
                    </div>
                  </div>
                </div>
              </div>
            {/if}

            <div class="items-center lg:overflow-visible px-1 py-1 mt-6">
              <div
                class="col-span-2 flex flex-col lg:flex-row items-start sm:items-center lg:order-2 lg:grow py-1 border-t border-b border-gray-300 dark:border-zinc-700"
              >
                <h2
                  class="text-left whitespace-nowrap text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white py-1 border-b border-gray-300 dark:border-zinc-700 lg:border-none w-full"
                >
                  {originalData?.length?.toLocaleString("en-US")} Stocks
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
                            /></svg
                          >
                        </label>
                      {/if}
                    </div>

                    <input
                      bind:value={inputValue}
                      on:input={search}
                      type="text"
                      placeholder="Find..."
                      class="py-2 text-[0.85rem] sm:text-sm border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 rounded-full text-gray-700 dark:text-zinc-200 placeholder:text-gray-500 dark:placeholder:text-zinc-400 px-3 focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80 grow w-full sm:min-w-56 lg:max-w-14"
                    />
                  </div>

                  <div class="ml-2">
                    <DownloadData
                      {data}
                      rawData={originalData}
                      title={`${name}`}
                    />
                  </div>
                </div>
              </div>
            </div>
            {#if stockList?.length > 0}
              <div
                class="w-full m-auto mt-4 mb-4 rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 overflow-x-auto"
              >
                <table
                  class="table table-sm table-compact rounded-none sm:rounded w-full m-auto text-gray-700 dark:text-zinc-200 tabular-nums"
                >
                  <!-- head -->
                  <thead
                    class="bg-gray-50/80 dark:bg-zinc-900/60 border-b border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-300"
                  >
                    <tr>
                      <th
                        class="hidden lg:table-cell text-left text-[0.7rem] sm:text-xs font-semibold uppercase tracking-wide"
                      ></th>
                      <th
                        class="text-left text-[0.7rem] sm:text-xs font-semibold uppercase tracking-wide"
                      >
                        Symbol
                      </th>
                      <th
                        class="text-left text-[0.7rem] sm:text-xs font-semibold uppercase tracking-wide"
                      >
                        Name
                      </th>
                      <th
                        class="text-right text-[0.7rem] sm:text-xs font-semibold uppercase tracking-wide"
                      >
                        Transaction Type
                      </th>
                      <th
                        class="text-right text-[0.7rem] sm:text-xs font-semibold uppercase tracking-wide"
                      >
                        Amount
                      </th>
                      <th
                        class="text-right text-[0.7rem] sm:text-xs font-semibold uppercase tracking-wide"
                      >
                        Transaction
                      </th>
                      <th
                        class="text-right text-[0.7rem] sm:text-xs font-semibold uppercase tracking-wide"
                      >
                        Last Trade
                      </th>
                      <th
                        class="text-right text-[0.7rem] sm:text-xs font-semibold uppercase tracking-wide"
                      >
                        Filed
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    class="divide-y divide-gray-200/70 dark:divide-zinc-800/80"
                  >
                    {#each stockList as item, index}
                      <tr
                        class="transition-colors hover:bg-gray-50/60 dark:hover:bg-zinc-900/50"
                      >
                        <td class="hidden lg:table-cell"
                          ><button
                            on:click={() => openGraph(item?.ticker)}
                            class="cursor-pointer h-full pl-2 pr-2 align-middle lg:pl-3"
                            ><svg
                              class="w-5 h-5 text-gray-800 dark:text-zinc-300 transition {(checkedSymbol ===
                                item?.ticker ?? item?.symbol)
                                ? 'rotate-180'
                                : ''}"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              style="max-width:40px"
                              ><path
                                fill-rule="evenodd"
                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                clip-rule="evenodd"
                              ></path></svg
                            ></button
                          ></td
                        >

                        <td
                          class="text-left text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-700 dark:text-zinc-200"
                        >
                          <HoverStockChart
                            symbol={item?.symbol ?? item?.ticker}
                            assetType={item?.assetType}
                          />
                        </td>

                        <td
                          class="text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300"
                        >
                          {item?.name?.length > 20
                            ? item?.name?.slice(0, 20) + "..."
                            : item?.name}
                        </td>

                        <td
                          class="text-right text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                        >
                          <span class="">
                            {#if item?.type === "Bought"}
                              <span
                                class="text-emerald-600 dark:text-emerald-400"
                                >Buy</span
                              >
                            {:else if item?.type === "Sold"}
                              <span class="text-rose-600 dark:text-rose-400"
                                >Sell</span
                              >
                            {:else if item?.type === "Exchange"}
                              <span class="text-amber-600 dark:text-amber-400"
                                >Exchange</span
                              >
                            {/if}
                          </span></td
                        >

                        <td
                          class="text-right text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                        >
                          {item?.amount}</td
                        >

                        <td
                          class="text-right text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                        >
                          {item?.transaction?.toLocaleString("en-US")}</td
                        >

                        <td
                          class="text-right text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                        >
                          {new Date(item?.transactionDate)?.toLocaleString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              daySuffix: "2-digit",
                            },
                          )}
                        </td>

                        <td
                          class="text-right text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                        >
                          {new Date(item?.disclosureDate)?.toLocaleString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              daySuffix: "2-digit",
                            },
                          )}
                        </td>
                      </tr>
                      {#if checkedSymbol === (item?.ticker ?? item?.symbol)}
                        <tr class="bg-white/70 dark:bg-zinc-950/50">
                          <td colspan="8" class="px-0">
                            <div class="-mt-0.5 px-0 pb-2">
                              <div class="relative h-[350px]">
                                <div class="absolute top-0 w-full">
                                  <div
                                    class="h-[250px] w-full xs:h-[300px] sm:h-[350px]"
                                    style="overflow: hidden;"
                                  >
                                    <div
                                      style="position: relative; height: 0px; z-index: 1;"
                                    >
                                      <RatingsChart
                                        {data}
                                        title="Transactions"
                                        ratingsList={rawData?.history?.map(
                                          (item) => ({
                                            ...item,
                                            date: item.transactionDate,
                                          }),
                                        )}
                                        symbol={item?.ticker ?? item?.symbol}
                                        numOfRatings={item?.transaction}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div></td
                          >
                        </tr>
                      {/if}
                    {/each}
                  </tbody>
                </table>
              </div>
            {:else if stockList?.length === 0 && inputValue?.length > 0}
              <div class="pt-5">
                <Infobox text={`No data is available for "${inputValue}"`} />
              </div>
            {:else}
              <div class="pt-5">
                <Infobox
                  text="No data is available for the searched analyst."
                />
              </div>
            {/if}

            <!-- Pagination controls -->
            {#if stockList?.length > 0}
              <div
                class="flex flex-row items-center justify-between mt-8 sm:mt-5"
              >
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
                    <span class="hidden sm:inline">Previous</span></Button
                  >
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
                        class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
                    class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
          </div>
        </main>
      </div>
    </div>
  </div>
</section>

<style>
  .scroller {
    scrollbar-width: thin;
  }

  .republican-striped {
    background-image: repeating-linear-gradient(
      -45deg,
      #98272b,
      #98272b 10px,
      #840412 10px,
      #840412 20px
    );
  }

  .democratic-striped {
    background-image: repeating-linear-gradient(
      -45deg,
      #295ac7,
      #295ac7 10px,
      #164d9d 10px,
      #164d9d 20px
    );
  }

  .other-striped {
    background-image: repeating-linear-gradient(
      -45deg,
      #a4a6a8,
      #a4a6a8 10px,
      #c0c3c5 10px,
      #c0c3c5 20px
    );
  }
</style>

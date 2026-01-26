<script lang="ts">
  import { formatString, sectorNavigation } from "$lib/utils";
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";
  import RatingsChart from "$lib/components/RatingsChart.svelte";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import { onMount } from "svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { page } from "$app/stores";
  import { screenWidth } from "$lib/store";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import {
  politicians_back_to_top,
  politicians_breadcrumb_home,
  politicians_breadcrumb_politicians,
  politicians_detail_count_stocks,
  politicians_detail_empty,
  politicians_detail_empty_search,
  politicians_detail_main_sectors,
  politicians_detail_mobile_filed,
  politicians_detail_mobile_view_chart,
  politicians_detail_stats_avg_return,
  politicians_detail_stats_buy_sell,
  politicians_detail_stats_last_transaction,
  politicians_detail_stats_rank,
  politicians_detail_stats_success_rate,
  politicians_detail_stats_total_amount,
  politicians_detail_stats_trades_scored,
  politicians_detail_stats_transaction,
  politicians_detail_top_industries,
  politicians_pagination_next,
  politicians_pagination_page_of,
  politicians_pagination_previous,
  politicians_pagination_rows,
  politicians_search_placeholder,
} from "$lib/paraglide/messages";

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
  let originalData = [...rawDataTable];
  let unsortedData = [...rawDataTable]; // Preserve truly original unsorted order
  let unsortedSearchData = []; // Preserve unsorted search results
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
    unsortedSearchData = []; // Clear search results
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
        unsortedSearchData = []; // Clear search results
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
      unsortedSearchData = [...rawDataTable]; // Preserve unsorted search results
      currentPage = 1; // Reset to first page after search
      updatePaginatedData();
    }
  };

  onMount(async () => {
    // Load column order preference
    loadColumnOrder(true);

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

  // Table columns and sorting (for TableHeader consistency)
  const defaultColumnsWithoutChart = [
    { key: "ticker", label: "Symbol", align: "left" },
    { key: "name", label: "Name", align: "left" },
    { key: "type", label: "Type", align: "right" },
    { key: "amount", label: "Amount", align: "right" },
    { key: "transaction", label: "Trades", align: "right" },
    { key: "transactionDate", label: "Last Trade", align: "right" },
    { key: "disclosureDate", label: "Filed", align: "right" },
  ];

  // Column order state
  let customColumnOrder: string[] = [];
  let lastAppliedColumnKeys: string = "";

  // Get storage key for column order
  function getColumnOrderStorageKey(): string {
    const currentPath = pagePathName || $page?.url?.pathname;
    return currentPath ? `${currentPath}_columnOrder` : "";
  }

  // Load column order from localStorage
  function loadColumnOrder(forceReapply: boolean = false): void {
    const currentPath = pagePathName || $page?.url?.pathname;
    if (!currentPath || typeof localStorage === "undefined") return;

    try {
      const storageKey = getColumnOrderStorageKey();
      if (!storageKey) return;

      const savedOrder = localStorage.getItem(storageKey);
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        if (Array.isArray(parsedOrder) && parsedOrder.length > 0) {
          customColumnOrder = parsedOrder;
          if (forceReapply) {
            lastAppliedColumnKeys = "";
          }
        }
      }
    } catch (e) {
      console.warn("Failed to load column order:", e);
    }
  }

  // Save column order to localStorage
  function saveColumnOrder(order: string[]): void {
    if (!pagePathName || typeof localStorage === "undefined") return;

    try {
      const storageKey = getColumnOrderStorageKey();
      if (!storageKey) return;

      localStorage.setItem(storageKey, JSON.stringify(order));
    } catch (e) {
      console.warn("Failed to save column order:", e);
    }
  }

  // Apply saved column order to columns array (excluding chart column which is always first)
  function applyColumnOrder(
    cols: typeof defaultColumnsWithoutChart,
  ): typeof defaultColumnsWithoutChart {
    if (customColumnOrder.length === 0) return cols;

    const columnMap = new Map(cols.map((col) => [col.key, col]));
    const orderedColumns: typeof defaultColumnsWithoutChart = [];

    // Add columns in saved order (if they exist, but not chart - that's handled separately)
    for (const key of customColumnOrder) {
      if (key === "chart") continue; // Skip chart, it's handled separately
      const col = columnMap.get(key);
      if (col) {
        orderedColumns.push(col);
        columnMap.delete(key);
      }
    }

    // Add any remaining columns not in saved order
    for (const col of columnMap.values()) {
      orderedColumns.push(col);
    }

    return orderedColumns;
  }

  // Handle column reorder from TableHeader
  function handleColumnReorder(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return;

    const newColumns = [...columns];
    const [movedColumn] = newColumns.splice(fromIndex, 1);
    newColumns.splice(toIndex, 0, movedColumn);

    // Save order without chart column (it's always first on desktop)
    const newOrder = newColumns
      .filter((col) => col.key !== "chart")
      .map((col) => col.key);

    customColumnOrder = newOrder;
    lastAppliedColumnKeys = newOrder.join(",");
    saveColumnOrder(customColumnOrder);
  }

  // Reset column order to default
  function resetColumnOrder(): void {
    customColumnOrder = [];
    lastAppliedColumnKeys = "";

    const storageKey = getColumnOrderStorageKey();
    if (storageKey && typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {
        console.warn("Failed to remove column order:", e);
      }
    }
  }

  // Reactive columns with chart handling - explicitly track customColumnOrder for reactivity
  $: columns = (() => {
    // Explicitly reference customColumnOrder to trigger reactivity
    const _orderLength = customColumnOrder.length;
    const orderedCols = applyColumnOrder(defaultColumnsWithoutChart);

    // Add chart column at the beginning for large screens
    if ($screenWidth > 1024) {
      return [{ key: "chart", label: "", align: "left" }, ...orderedCols];
    }
    return orderedCols;
  })();

  $: sortOrders = {
    chart: { order: "none", type: "string" },
    ticker: { order: "none", type: "string" },
    name: { order: "none", type: "string" },
    type: { order: "none", type: "string" },
    amount: { order: "none", type: "string" },
    transaction: { order: "none", type: "number" },
    transactionDate: { order: "none", type: "date" },
    disclosureDate: { order: "none", type: "date" },
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

    const dataSource = inputValue?.length > 0 ? rawDataTable : originalData;

    // Reset to original data when 'none' and stop further sorting
    if (sortOrder === "none") {
      if (inputValue?.length > 0) {
        rawDataTable = [...unsortedSearchData]; // Restore from unsorted search results
      } else {
        originalData = [...unsortedData]; // Restore from truly original unsorted data
      }
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
          valueA = (a[key] ?? "").toString().toUpperCase();
          valueB = (b[key] ?? "").toString().toUpperCase();
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

    // Sort using the generic comparison function
    const sortedData = [...dataSource].sort(compareValues);
    if (inputValue?.length > 0) {
      rawDataTable = sortedData;
    } else {
      originalData = sortedData;
    }
    currentPage = 1;
    updatePaginatedData();
  };
</script>

<SEO
  title={`${name} - ${politicianParty} Member | Investment & Trading Activity`}
  description={`${name}, a member of ${politicianParty}, made ${numOfTrades} trades totaling ${totalAmountTraded}. Discover their buy/sell ratio of ${buySellRatio} and investment trends.`}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-6 px-4 lg:px-6 text-gray-700 dark:text-zinc-200"
>
  <BreadCrumb
    containerClass="text-xs sm:text-sm breadcrumbs text-gray-800 dark:text-zinc-300"
  >
    <li>
      <a
        href="/"
        class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
        >{politicians_breadcrumb_home()}</a
      >
    </li>
    <li>
      <a
        href="/politicians"
        class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
        >{politicians_breadcrumb_politicians()}</a
      >
    </li>

    <li class="text-gray-800 dark:text-zinc-300">{name}</li>
  </BreadCrumb>

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
                    {politicians_detail_stats_rank()}
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
                    {politicians_detail_stats_trades_scored()}
                  </div>
                </div>

                <div
                  class="flex flex-col px-4 py-2 bp:px-6 sm:border-l border-gray-200 dark:sm:border-zinc-800/80 md:py-6"
                >
                  <div
                    class="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white tabular-nums"
                  >
                    {#if ["Plus", "Pro"]?.includes(data?.user?.tier)}
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
                    {:else}
                      <a href="/pricing" class="flex justify-center mb-2">
                        <svg
                          class="size-6 text-gray-400 dark:text-zinc-300"
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
                      </a>
                    {/if}
                  </div>
                  <div
                    class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
                  >
                    {politicians_detail_stats_success_rate()}
                  </div>
                </div>
                <div
                  class="flex flex-col px-4 py-2 bp:px-6 sm:border-l border-gray-200 dark:sm:border-zinc-800/80 md:py-6"
                >
                  <div
                    class="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white tabular-nums"
                  >
                    {#if ["Plus", "Pro"]?.includes(data?.user?.tier)}
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
                    {:else}
                      <a href="/pricing" class="flex justify-center mb-2">
                        <svg
                          class="size-6 text-gray-400 dark:text-zinc-300"
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
                      </a>
                    {/if}
                  </div>
                  <div
                    class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
                  >
                    {politicians_detail_stats_avg_return()}
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
                  {politicians_detail_stats_total_amount()}
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
                  {politicians_detail_stats_transaction()}
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
                  {politicians_detail_stats_last_transaction()}
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
                  {politicians_detail_stats_buy_sell()}
                </div>
              </div>
            </div>

            {#if mainSectors?.length !== 0}
              <div class="mb-10 mt-10">
                <div
                  class="relative my-3 space-y-2 rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/60 dark:bg-zinc-950/40 sm:my-6 p-4"
                >
                  <div
                    class="flex flex-col sm:flex-row items-start sm:items-center"
                  >
                    <div
                      class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-300 sm:mb-0 sm:mr-2 text-center sm:text-left"
                    >
                      {politicians_detail_main_sectors()}
                    </div>
                    <div
                      class="flex flex-wrap items-center gap-x-2 gap-y-3 justify-start sm:justify-center"
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
                  <div
                    class="pt-2 sm:pt-0 flex flex-col sm:flex-row items-start sm:items-center"
                  >
                    <div
                      class="mb-2 whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-300 sm:mb-0 sm:mr-2 text-center sm:text-left"
                    >
                      {politicians_detail_top_industries()}
                    </div>
                    <div
                      class="flex flex-wrap items-center gap-x-2 gap-y-3 justify-start sm:justify-center"
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
                  {politicians_detail_count_stocks({ count: originalData?.length?.toLocaleString("en-US") })}
                </h2>
                <div
                  class="mt-1 w-full flex flex-row items-center ml-auto pb-1 pt-1 sm:pt-0 order-0 lg:order-1"
                >
                  <div class="relative lg:ml-auto flex-1 min-w-0 sm:flex-none sm:w-fit">
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
                      placeholder={politicians_search_placeholder()}
                      class="py-2 text-[0.85rem] sm:text-sm border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 rounded-full text-gray-700 dark:text-zinc-200 placeholder:text-gray-800 dark:placeholder:text-zinc-300 px-3 focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80 grow w-full sm:min-w-56 lg:max-w-14"
                    />
                  </div>

                  <div class="ml-2 shrink-0">
                    <DownloadData
                      {data}
                      rawData={originalData}
                      title={`${name}`}
                    />
                  </div>

                  {#if customColumnOrder?.length > 0}
                    <button
                      on:click={resetColumnOrder}
                      title="Reset column order"
                      class="ml-2 shrink-0 cursor-pointer p-2 rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                    >
                      <svg
                        class="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          d="M3 7h14M3 12h10M3 17h6M17 10l4 4-4 4M21 14H11"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </button>
                  {/if}
                </div>
              </div>
            </div>
            {#if stockList?.length > 0}
              <!-- Mobile Card View (only show when screenWidth is set and < 640) -->
              {#if $screenWidth > 0 && $screenWidth < 640}
                <div class="mt-4 mb-4 space-y-3">
                  {#each stockList as item, index}
                    <div
                      class="rounded-2xl border border-gray-300 dark:border-zinc-700 overflow-hidden"
                    >
                      <!-- Header -->
                      <div
                        class="flex items-start justify-between px-4 pt-4 pb-3"
                      >
                        <div class="min-w-0 flex-1">
                          <HoverStockChart
                            symbol={item?.symbol ?? item?.ticker}
                            assetType={item?.assetType}
                          />
                          <p
                            class="mt-0.5 text-[13px] text-gray-800 dark:text-zinc-300 truncate"
                          >
                            {item?.name?.length > 28
                              ? item?.name?.slice(0, 28) + "..."
                              : item?.name}
                          </p>
                        </div>
                        <span
                          class="ml-3 text-[13px] tabular-nums text-gray-800 dark:text-zinc-300 whitespace-nowrap"
                        >
                          {new Date(item?.transactionDate)?.toLocaleString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>

                      <!-- Details -->
                      <div class="flex items-end justify-between px-4 pb-4">
                        <div class="space-y-1">
                          <div class="flex items-center gap-1.5 text-[13px]">
                            {#if item?.type === "Bought"}
                              <span
                                class="font-medium text-emerald-600 dark:text-emerald-500"
                                >Bought</span
                              >
                            {:else if item?.type === "Sold"}
                              <span
                                class="font-medium text-rose-600 dark:text-rose-500"
                                >Sold</span
                              >
                            {:else if item?.type === "Exchange"}
                              <span
                                class="font-medium text-amber-600 dark:text-amber-500"
                                >Exchange</span
                              >
                            {/if}
                            <span class="text-gray-600 dark:text-zinc-400"
                              >·</span
                            >
                            <span
                              class="tabular-nums text-gray-800 dark:text-zinc-300"
                            >
                              {item?.transaction?.toLocaleString("en-US")} trade{item?.transaction >
                              1
                                ? "s"
                                : ""}
                            </span>
                          </div>
                          <p
                            class="text-[13px] text-gray-600 dark:text-zinc-400"
                          >
                            <span
                              class="uppercase text-[10px] tracking-wide text-gray-600 dark:text-zinc-400 mr-1"
                              >Amt</span
                            >
                            <span class="font-medium tabular-nums"
                              >{item?.amount}</span
                            >
                          </p>
                        </div>
                        <div class="text-right">
                          <p
                            class="uppercase text-[10px] tracking-wide text-gray-600 dark:text-zinc-400 mb-0.5"
                          >
                            {politicians_detail_mobile_filed()}
                          </p>
                          <p
                            class="text-[13px] tabular-nums text-gray-800 dark:text-zinc-300"
                          >
                            {new Date(item?.disclosureDate)?.toLocaleString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </p>
                        </div>
                      </div>

                      <!-- Expand Button -->
                      <button
                        on:click={() => openGraph(item?.ticker)}
                        class="flex w-full items-center justify-between border-t border-gray-300 dark:border-zinc-700 px-4 py-3 text-[13px] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                      >
                        <span>{politicians_detail_mobile_view_chart()}</span>
                        <svg
                          class="h-4 w-4 transition-transform {checkedSymbol ===
                          (item?.ticker ?? item?.symbol)
                            ? 'rotate-180'
                            : ''}"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </button>

                      <!-- Chart -->
                      {#if checkedSymbol === (item?.ticker ?? item?.symbol)}
                        <div
                          class="border-t border-gray-300 dark:border-zinc-700 pb-3"
                        >
                          <div class="relative h-[300px]">
                            <div class="absolute inset-x-0 top-0">
                              <div class="h-[300px] w-full overflow-hidden">
                                <div
                                  class="relative"
                                  style="height: 0; z-index: 1;"
                                >
                                  <RatingsChart
                                    {data}
                                    title="Transactions"
                                    ratingsList={rawData?.history?.map(
                                      (historyItem) => ({
                                        ...historyItem,
                                        date: historyItem.transactionDate,
                                      }),
                                    )}
                                    symbol={item?.ticker ?? item?.symbol}
                                    numOfRatings={item?.transaction}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              {:else}
                <!-- Desktop Table View -->
                <div
                  class="w-full m-auto mt-4 mb-4 rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 overflow-x-auto"
                >
                  <table
                    class="table table-sm table-compact w-full m-auto mt-0 text-gray-700 dark:text-zinc-200 tabular-nums"
                  >
                    <thead>
                      <TableHeader {columns} {sortOrders} {sortData} onColumnReorder={handleColumnReorder} />
                    </thead>
                    <tbody
                      class="divide-y divide-gray-200/70 dark:divide-zinc-800/80"
                    >
                      {#each stockList as item, index}
                        <tr
                          class="transition-colors hover:bg-gray-50/60 dark:hover:bg-zinc-900/50"
                        >
                          {#each columns as column}
                            {#if column.key === "chart"}
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
                            {:else if column.key === "ticker"}
                              <td
                                class="text-left text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-700 dark:text-zinc-200"
                              >
                                <HoverStockChart
                                  symbol={item?.symbol ?? item?.ticker}
                                  assetType={item?.assetType}
                                />
                              </td>
                            {:else if column.key === "name"}
                              <td
                                class="text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300"
                              >
                                {item?.name?.length > 20
                                  ? item?.name?.slice(0, 20) + "..."
                                  : item?.name}
                              </td>
                            {:else if column.key === "type"}
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
                            {:else if column.key === "amount"}
                              <td
                                class="text-right text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                              >
                                {item?.amount}</td
                              >
                            {:else if column.key === "transaction"}
                              <td
                                class="text-right text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                              >
                                {item?.transaction?.toLocaleString("en-US")}</td
                              >
                            {:else if column.key === "transactionDate"}
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
                            {:else if column.key === "disclosureDate"}
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
                            {/if}
                          {/each}
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
              {/if}
            {:else if stockList?.length === 0 && inputValue?.length > 0}
              <div class="pt-5">
                <Infobox text={politicians_detail_empty_search({ query: inputValue })} />
              </div>
            {:else}
              <div class="pt-5">
                <Infobox
                  text={politicians_detail_empty()}
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
                    <span class="hidden sm:inline">{politicians_pagination_previous()}</span></Button
                  >
                </div>

                <!-- Page info and rows selector in center -->
                <div class="flex flex-row items-center gap-4">
                  <span class="text-sm text-gray-600 dark:text-zinc-300">
                    {politicians_pagination_page_of({ current: currentPage, total: totalPages })}
                  </span>

                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild let:builder>
                      <Button
                        builders={[builder]}
                        class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <span class="truncate text-[0.85rem] sm:text-sm"
                          >{politicians_pagination_rows({ count: rowsPerPage })}</span
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
                              <span class="text-sm">{politicians_pagination_rows({ count: item })}</span>
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
                    <span class="hidden sm:inline">{politicians_pagination_next()}</span>
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
                  {politicians_back_to_top()} <svg
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

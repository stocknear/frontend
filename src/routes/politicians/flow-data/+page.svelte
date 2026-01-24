<script lang="ts">
  import { formatString } from "$lib/utils";
  import { screenWidth } from "$lib/store";
  import { onMount } from "svelte";
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";
  //import UpgradeToPro from '$lib/components/UpgradeToPro.svelte';
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { page } from "$app/stores";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import * as m from "$lib/paraglide/messages";

  import SEO from "$lib/components/SEO.svelte";

  export let data;
  let inputValue = "";
  let searchWorker: Worker | undefined;

  let originalData = data?.getPoliticianRSS;
  let rawData = originalData;
  let stockList = [];

  // Pagination state
  let currentPage = 1;
  let rowsPerPage = 20;
  let rowsPerPageOptions = [20, 50, 100];
  let totalPages = 1;

  let pagePathName = $page?.url?.pathname;

  // Pagination functions
  function updatePaginatedData() {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const dataSource = inputValue?.length > 0 ? rawData : originalData;
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
    rawData = originalData;
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
        rawData = originalData || [];
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
      rawData = event.data?.output ?? [];
      currentPage = 1; // Reset to first page after search
      updatePaginatedData();
    }
  };

  onMount(async () => {
    // Load pagination preference
    loadRowsPerPage();

    // Load column order preference
    loadColumnOrder(true);

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

  // Note: We don't use a reactive statement here because we manually call updatePaginatedData()
  // in our sorting, searching, and pagination functions to have better control over when it runs

  // Reactive statement to load pagination settings when page changes
  $: if ($page?.url?.pathname && $page?.url?.pathname !== pagePathName) {
    pagePathName = $page?.url?.pathname;
    loadRowsPerPage(); // Load pagination preference for new page
    loadColumnOrder(true); // Load column order preference for new page
    updatePaginatedData(); // Update display with loaded preference
  }

  function getAbbreviatedName(fullName) {
    if (fullName === null) {
      return "-";
    }

    const names = fullName?.split(" ");
    let firstName = names[0];
    // Remove any title prefix (e.g. Dr., Mr., Mrs., Ms.)
    if (names.length > 1 && /^(Dr|Mr|Mrs|Ms)\.?$/i.test(names[0])) {
      firstName = names[1];
      names?.splice(0, 1);
    }
    const initials = names
      ?.slice(0, -1)
      ?.map((name) => name?.charAt(0))
      ?.join(". ");
    const lastName = names[names?.length - 1];
    return `${firstName?.charAt(0)}. ${lastName}`;
  }

  const defaultColumns = [
    { key: "performanceScore", label: "Rank", align: "left" },
    { key: "representative", label: "Person", align: "left" },
    { key: "party", label: "Party", align: "right" },
    { key: "ticker", label: "Symbol", align: "right" },
    { key: "assetDescription", label: "Name", align: "right" },
    { key: "disclosureDate", label: "Filing Date", align: "right" },
    { key: "amount", label: "Amount", align: "right" },
    { key: "type", label: "Type", align: "right" },
  ];

  let columns = [...defaultColumns];

  // Column reordering state and functions
  let customColumnOrder: string[] = [];
  let lastAppliedColumnKeys: string = "";

  function getColumnOrderStorageKey(): string {
    const currentPath = pagePathName || $page?.url?.pathname;
    return currentPath ? `${currentPath}_columnOrder` : "";
  }

  function loadColumnOrder(forceReapply: boolean = false): void {
    const storageKey = getColumnOrderStorageKey();
    if (!storageKey || typeof localStorage === "undefined") {
      customColumnOrder = [];
      return;
    }

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          customColumnOrder = parsed;
          if (forceReapply) {
            lastAppliedColumnKeys = "";
          }
          return;
        }
      }
    } catch (e) {
      console.warn("Failed to load column order:", e);
    }
    customColumnOrder = [];
  }

  function saveColumnOrder(order: string[]): void {
    const storageKey = getColumnOrderStorageKey();
    if (!storageKey || typeof localStorage === "undefined") return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(order));
    } catch (e) {
      console.warn("Failed to save column order:", e);
    }
  }

  function applyColumnOrder(cols: typeof columns): typeof columns {
    if (!customColumnOrder || customColumnOrder.length === 0) {
      return cols;
    }

    const colMap = new Map(cols.map((col) => [col.key, col]));
    const orderedCols: typeof columns = [];
    const usedKeys = new Set<string>();

    for (const key of customColumnOrder) {
      const col = colMap.get(key);
      if (col) {
        orderedCols.push(col);
        usedKeys.add(key);
      }
    }

    for (const col of cols) {
      if (!usedKeys.has(col.key)) {
        orderedCols.push(col);
      }
    }

    return orderedCols;
  }

  function handleColumnReorder(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return;

    const newColumns = [...columns];
    const [movedColumn] = newColumns.splice(fromIndex, 1);
    newColumns.splice(toIndex, 0, movedColumn);

    customColumnOrder = newColumns.map((col) => col.key);
    saveColumnOrder(customColumnOrder);
    lastAppliedColumnKeys = newColumns.map((col) => col.key).join("|");
    columns = newColumns;
  }

  function resetColumnOrder(): void {
    const storageKey = getColumnOrderStorageKey();
    if (storageKey && typeof localStorage !== "undefined") {
      localStorage.removeItem(storageKey);
    }
    customColumnOrder = [];
    lastAppliedColumnKeys = "";
    columns = [...defaultColumns];
  }

  // Apply custom column order when needed
  $: if (columns && columns.length > 0 && customColumnOrder.length > 0) {
    const currentKeys = columns.map((c) => c.key).join("|");
    const orderedKeys = customColumnOrder.join("|");
    if (currentKeys !== orderedKeys && lastAppliedColumnKeys !== currentKeys) {
      const currentKeySet = new Set(columns.map((c) => c.key));
      const matchingKeys = customColumnOrder.filter((key) =>
        currentKeySet.has(key),
      );
      const compatibilityRatio = matchingKeys.length / customColumnOrder.length;

      if (compatibilityRatio >= 0.5) {
        lastAppliedColumnKeys = currentKeys;
        const reordered = applyColumnOrder(columns);
        const reorderedKeys = reordered.map((c) => c.key).join("|");
        if (reorderedKeys !== currentKeys) {
          columns = reordered;
        }
      }
    }
  }

  let sortOrders = {
    performanceScore: { order: "none", type: "number" },
    representative: { order: "none", type: "string" },
    party: { order: "none", type: "string" },
    ticker: { order: "none", type: "string" },
    assetDescription: { order: "none", type: "string" },
    disclosureDate: { order: "none", type: "date" },
    amount: { order: "none", type: "string" },
    type: { order: "none", type: "string" },
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
      if (inputValue?.length > 0) {
        // If filtering, keep the filtered rawData but reset to unsorted state
        // We need to re-run the search to get the original filtered order
        search();
      } else {
        // Reset to original unsorted state
        originalData = data?.getPoliticianRSS || [];
        rawData = [...originalData];
        currentPage = 1; // Reset to first page
        updatePaginatedData(); // Reset displayed data
      }
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

    // Get the data to sort and sort it
    const dataToSort = inputValue?.length > 0 ? rawData : originalData;
    const sortedData = [...dataToSort].sort(compareValues);

    // Update the appropriate data source based on whether we're filtering or not
    if (inputValue?.length > 0) {
      rawData = sortedData;
    } else {
      originalData = sortedData;
      rawData = sortedData; // Keep rawData in sync for consistency
    }

    // Force a re-render by triggering the sortOrders reactivity
    sortOrders = { ...sortOrders };

    currentPage = 1; // Reset to first page when sorting
    updatePaginatedData(); // Update the displayed data
  };

  $: charNumber = $screenWidth < 640 ? 20 : 30;
</script>

<SEO
  title={m.politicians_flow_seo_title()}
  description={m.politicians_flow_seo_description()}
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
        >{m.politicians_breadcrumb_home()}</a
      >
    </li>
    <li class="text-gray-800 dark:text-zinc-300">{m.politicians_breadcrumb_flow()}</li>
  </BreadCrumb>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class="border-b border-gray-300 dark:border-zinc-700 pb-2">
            <h1
              class="mb-1 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              {m.politicians_flow_title()}
            </h1>
          </div>

          <p
            class="mt-4 text-sm sm:text-[0.95rem] text-gray-800 dark:text-zinc-300"
          >
            {m.politicians_flow_description_intro()}
            <strong
              >{(() => {
                // Use originalData for stats to show full dataset metrics
                const buys =
                  originalData?.filter((item) => item?.type === "Bought")
                    ?.length || 0;
                const sells =
                  originalData?.filter((item) => item?.type === "Sold")
                    ?.length || 0;
                const total = buys + sells;
                return total > 0
                  ? m.politicians_flow_description_buys({ percent: ((buys / total) * 100).toFixed(1) })
                  : "n/a";
              })()}</strong
            >
            {m.politicians_flow_description_versus()}
            <strong
              >{(() => {
                const buys =
                  originalData?.filter((item) => item?.type === "Bought")
                    ?.length || 0;
                const sells =
                  originalData?.filter((item) => item?.type === "Sold")
                    ?.length || 0;
                const total = buys + sells;
                return total > 0
                  ? m.politicians_flow_description_sells({ percent: ((sells / total) * 100).toFixed(1) })
                  : "n/a";
              })()}</strong
            >
            {m.politicians_flow_description_active_party()}
            <strong
              >{(() => {
                const partyCount = {};
                originalData?.forEach((item) => {
                  if (item?.party) {
                    partyCount[item.party] = (partyCount[item.party] || 0) + 1;
                  }
                });
                const mostActive = Object.entries(partyCount).sort(
                  ([, a], [, b]) => b - a,
                )[0];
                return mostActive ? mostActive[0] : "n/a";
              })()}</strong
            >
            {m.politicians_flow_description_with()}
            <strong
              >{(() => {
                const partyCount = {};
                originalData?.forEach((item) => {
                  if (item?.party) {
                    partyCount[item.party] = (partyCount[item.party] || 0) + 1;
                  }
                });
                const mostActive = Object.entries(partyCount).sort(
                  ([, a], [, b]) => b - a,
                )[0];
                return mostActive ? mostActive[1] : "0";
              })()}</strong
            >
            {m.politicians_flow_description_transactions()}
            <strong
              >{(() => {
                const buys =
                  originalData?.filter((item) => item?.type === "Bought")
                    ?.length || 0;
                const sells =
                  originalData?.filter((item) => item?.type === "Sold")
                    ?.length || 0;
                if (buys > sells) return m.politicians_flow_sentiment_bullish();
                if (sells > buys) return m.politicians_flow_sentiment_bearish();
                return m.politicians_flow_sentiment_neutral();
              })()}</strong
            >
            {m.politicians_flow_description_sentiment()}
          </p>

          <div class="w-full overflow-hidden m-auto">
            <section class="w-full overflow-hidden m-auto mt-3">
              <div class=" flex justify-center w-full m-auto overflow-hidden">
                <div
                  class="relative flex justify-center items-center overflow-hidden w-full"
                >
                  <main class="w-full">
                    <div
                      class="items-center lg:overflow-visible px-1 py-1 mt-4"
                    >
                      <div
                        class="col-span-2 flex flex-col lg:flex-row items-start sm:items-center lg:order-2 lg:grow py-1 border-t border-b border-gray-300 dark:border-zinc-700"
                      >
                        <h2
                          class="text-start whitespace-nowrap text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white py-1 border-b border-gray-300 dark:border-zinc-700 lg:border-none w-full"
                        >
                          {m.politicians_flow_count_trades({ count: originalData?.length?.toLocaleString("en-US") })}
                        </h2>
                        <div
                          class="mt-1 w-full flex flex-row items-center pb-1 pt-1 sm:pt-0 order-0 lg:order-1"
                        >
                          <!-- Find input - grows to fill space but shrinks when needed -->
                          <div
                            class="relative ml-auto flex-1 min-w-0 sm:flex-none sm:w-fit"
                          >
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
                              placeholder={m.politicians_search_placeholder()}
                              class="py-2 text-[0.85rem] sm:text-sm border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 rounded-full text-gray-700 dark:text-zinc-200 placeholder:text-gray-800 dark:placeholder:text-zinc-300 px-3 focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80 w-full sm:min-w-56"
                            />
                          </div>

                          <!-- Download button -->
                          <div class="ml-2 shrink-0">
                            <DownloadData
                              {data}
                              rawData={originalData}
                              title={"congress_flow_data"}
                            />
                          </div>

                          <!-- Reset column order button -->
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

                    <div class="w-full m-auto mt-2">
                      <div
                        class="w-full m-auto mb-4 rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 overflow-x-auto"
                      >
                        {#if stockList?.length > 0}
                          <table
                            class="table table-sm table-compact rounded-none sm:rounded w-full m-auto text-gray-700 dark:text-zinc-200 tabular-nums"
                          >
                            <thead>
                              <TableHeader
                                {columns}
                                {sortOrders}
                                {sortData}
                                onColumnReorder={handleColumnReorder}
                              />
                            </thead>
                            <tbody
                              class="divide-y divide-gray-200/70 dark:divide-zinc-800/80"
                            >
                              {#each stockList as item}
                                <tr
                                  class="transition-colors hover:bg-gray-50/60 dark:hover:bg-zinc-900/50"
                                >
                                  {#each columns as column}
                                    {#if column.key === "performanceScore"}
                                      <td
                                        class="text-[0.85rem] sm:text-sm whitespace-nowrap flex flex-row mt-2.5 sm:mt-0 items-center text-gray-700 dark:text-zinc-200 tabular-nums"
                                      >
                                        {#if item?.performanceScore !== null && item?.performanceScore !== undefined}
                                          <div>
                                            {Number(
                                              item?.performanceScore,
                                            ).toFixed(1)}
                                          </div>
                                        {:else}
                                          <div>n/a</div>
                                        {/if}
                                        <svg
                                          class="ml-1 w-4 h-4"
                                          aria-hidden="true"
                                          xmlns="http://www.w3.org/2000/svg"
                                          fill="#FFA500"
                                          viewBox="0 0 22 20"
                                        >
                                          <path
                                            d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"
                                          />
                                        </svg>
                                      </td>
                                    {:else if column.key === "representative"}
                                      <td
                                        class="text-start text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-700 dark:text-zinc-200"
                                      >
                                        <a
                                          href={`/politicians/${item?.id}`}
                                          class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                                          >{getAbbreviatedName(
                                            item?.representative?.replace(
                                              "_",
                                              " ",
                                            ),
                                          )}</a
                                        >
                                      </td>
                                    {:else if column.key === "party"}
                                      <td
                                        class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300"
                                      >
                                        {item?.party}
                                      </td>
                                    {:else if column.key === "ticker"}
                                      <td
                                        class="text-end whitespace-nowrap text-[0.85rem] sm:text-sm text-gray-600 dark:text-zinc-300"
                                      >
                                        <HoverStockChart
                                          symbol={item?.ticker}
                                          assetType={item?.assetType}
                                        />
                                      </td>
                                    {:else if column.key === "assetDescription"}
                                      <td
                                        class="text-end whitespace-nowrap text-[0.85rem] sm:text-sm text-gray-600 dark:text-zinc-300"
                                      >
                                        <span
                                          >{item?.assetDescription.length >
                                          charNumber
                                            ? formatString(
                                                item?.assetDescription.slice(
                                                  0,
                                                  charNumber,
                                                ),
                                              ) + "..."
                                            : formatString(
                                                item?.assetDescription,
                                              )
                                                ?.replace("- Common Stock", "")
                                                ?.replace(
                                                  "Common Stock",
                                                  "",
                                                )}</span
                                        >
                                      </td>
                                    {:else if column.key === "disclosureDate"}
                                      <td
                                        class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                                      >
                                        {new Date(
                                          item?.disclosureDate,
                                        )?.toLocaleString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                          daySuffix: "2-digit",
                                        })}
                                      </td>
                                    {:else if column.key === "amount"}
                                      <td
                                        class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                                      >
                                        {item?.amount?.replace(
                                          "$1,000,001 - $5,000,000",
                                          "$1Mio - $5Mio",
                                        )}
                                      </td>
                                    {:else if column.key === "type"}
                                      <td
                                        class="text-[0.85rem] sm:text-sm text-end text-gray-600 dark:text-zinc-300"
                                      >
                                        {#if item?.type === "Bought"}
                                          <span
                                            class="text-emerald-600 dark:text-emerald-400"
                                            >Bought</span
                                          >
                                        {:else if item?.type === "Sold"}
                                          <span
                                            class="text-rose-600 dark:text-rose-400"
                                            >Sold</span
                                          >
                                        {/if}
                                      </td>
                                    {/if}
                                  {/each}
                                </tr>
                              {/each}
                            </tbody>
                          </table>
                        {:else}
                          <Infobox
                            text={m.politicians_flow_empty_search({ query: inputValue })}
                          />
                        {/if}
                      </div>

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
                              <span class="hidden sm:inline">{m.politicians_pagination_previous()}</span
                              ></Button
                            >
                          </div>

                          <!-- Page info and rows selector in center -->
                          <div class="flex flex-row items-center gap-4">
                            <span
                              class="text-sm text-gray-600 dark:text-zinc-300"
                            >
                              {m.politicians_pagination_page_of({ current: currentPage, total: totalPages })}
                            </span>

                            <DropdownMenu.Root>
                              <DropdownMenu.Trigger asChild let:builder>
                                <Button
                                  builders={[builder]}
                                  class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  <span
                                    class="truncate text-[0.85rem] sm:text-sm"
                                    >{m.politicians_pagination_rows({ count: rowsPerPage })}</span
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
                                        <span class="text-sm">{m.politicians_pagination_rows({ count: item })}</span>
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
                              <span class="hidden sm:inline">{m.politicians_pagination_next()}</span>
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
                            {m.politicians_back_to_top()} <svg
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

                      <!--<InfiniteLoading on:infinite={infiniteHandler} />-->

                      <!--<UpgradeToPro data={data} title="Track the latest trades of corrupt US Politicians"/>-->
                    </div>
                  </main>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  </div>
</section>

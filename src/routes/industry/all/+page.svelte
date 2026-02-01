<script lang="ts">
  import { screenWidth } from "$lib/store";
  import { abbreviateNumber } from "$lib/utils";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import Infobox from "$lib/components/Infobox.svelte";
  import {
    industry_all_heading,
    industry_all_seo_description,
    industry_all_seo_title,
    industry_back_to_top,
    industry_no_results,
    industry_pagination_next,
    industry_pagination_page_of,
    industry_pagination_previous,
    industry_reset_column_order,
    industry_rows_label,
    industry_search_placeholder,
  } from "$lib/paraglide/messages.js";

  export let data;
  let originalData = data?.getIndustryOverview;

  let rawData = originalData;

  $: charNumber = $screenWidth < 640 ? 20 : 30;

  let displayList = rawData;

  let inputValue = "";
  let searchWorker: Worker | undefined;

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
        rawData = originalData;
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

  onMount(async () => {
    // Load pagination preference
    loadRowsPerPage();

    // Load column order preference
    initColumnOrder();

    // Initialize pagination
    updatePaginatedData();

    if (!searchWorker) {
      const SearchWorker =
        await import("$lib/workers/tableSearchWorker?worker");
      searchWorker = new SearchWorker.default();
      searchWorker.onmessage = handleSearchMessage;
    }
  });

  // Update pagination when originalData or rawData changes
  $: if (
    (originalData && originalData.length > 0) ||
    (rawData && inputValue?.length > 0)
  ) {
    updatePaginatedData();
  }

  // Reactive statement to load pagination settings when page changes
  $: if ($page?.url?.pathname && $page?.url?.pathname !== pagePathName) {
    pagePathName = $page?.url?.pathname;
    loadRowsPerPage(); // Load pagination preference for new page
    updatePaginatedData(); // Update display with loaded preference
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  let defaultColumns = [
    { key: "industry", label: "Industry Name", align: "left" },
    { key: "numStocks", label: "# Stocks", align: "right" },
    { key: "totalMarketCap", label: "Market Cap", align: "right" },
    { key: "avgDividendYield", label: "Div. Yield", align: "right" },
    { key: "pe", label: "PE Ratio", align: "right" },
    { key: "profitMargin", label: "Profit Margin", align: "right" },
    { key: "avgChange1D", label: "1D Change", align: "right" },
    { key: "avgChange1W", label: "1W Change", align: "right" },
    { key: "avgChange1M", label: "1M Change", align: "right" },
    { key: "avgChange1Y", label: "1Y Change", align: "right" },
  ];

  // Column reordering state
  let customColumnOrder: string[] = [];

  // Column reordering functions
  function getColumnOrderStorageKey() {
    return `${pagePathName}_columnOrder`;
  }

  function loadColumnOrder(): string[] {
    if (typeof localStorage === "undefined") return [];
    try {
      const saved = localStorage.getItem(getColumnOrderStorageKey());
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  function saveColumnOrder(order: string[]) {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(getColumnOrderStorageKey(), JSON.stringify(order));
    } catch (e) {
      console.warn("Failed to save column order:", e);
    }
  }

  function applyColumnOrder(
    cols: typeof defaultColumns,
    order: string[],
  ): typeof defaultColumns {
    if (!order.length) return cols;

    const colMap = new Map(cols.map((c) => [c.key, c]));
    const ordered: typeof defaultColumns = [];

    for (const key of order) {
      const col = colMap.get(key);
      if (col) {
        ordered.push(col);
        colMap.delete(key);
      }
    }

    // Add any remaining columns not in the saved order
    for (const col of colMap.values()) {
      ordered.push(col);
    }

    return ordered;
  }

  function handleColumnReorder(fromIndex: number, toIndex: number) {
    const reordered = [...columns];
    const [removed] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, removed);
    customColumnOrder = reordered.map((c) => c.key);
    saveColumnOrder(customColumnOrder);
  }

  function resetColumnOrder() {
    customColumnOrder = [];
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(getColumnOrderStorageKey());
      } catch (e) {
        console.warn("Failed to remove column order:", e);
      }
    }
  }

  function initColumnOrder() {
    customColumnOrder = loadColumnOrder();
  }

  $: columns = applyColumnOrder([...defaultColumns], customColumnOrder);

  let sortOrders = {
    industry: { order: "none", type: "string" },
    numStocks: { order: "none", type: "number" },
    totalMarketCap: { order: "none", type: "number" },
    avgDividendYield: { order: "none", type: "number" },
    pe: { order: "none", type: "number" },
    profitMargin: { order: "none", type: "number" },
    avgChange1D: { order: "none", type: "number" },
    avgChange1W: { order: "none", type: "number" },
    avgChange1M: { order: "none", type: "number" },
    avgChange1Y: { order: "none", type: "number" },
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
        updatePaginatedData();
      } else {
        originalData = [...rawData]; // Reset originalData to rawData
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
          valueA = (a[key] ?? "").toUpperCase();
          valueB = (b[key] ?? "").toUpperCase();
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

    // Sort and update the data
    if (inputValue?.length > 0) {
      // If filtering, sort the filtered data
      rawData = [...rawData].sort(compareValues);
    } else {
      // If not filtering, sort the original data
      originalData = [...originalData].sort(compareValues);
    }

    currentPage = 1; // Reset to first page when sorting
    updatePaginatedData(); // Update the displayed data
  };
</script>

<SEO
  title={industry_all_seo_title()}
  description={industry_all_seo_description({
    count: rawData?.length ?? 0,
  })}
/>

<section class="w-full overflow-hidden m-auto">
  <!-- Page wrapper -->
  <div class="items-center lg:overflow-visible px-1">
    <div
      class="col-span-2 flex flex-col lg:flex-row items-start sm:items-center lg:order-2 lg:grow py-1 border-b border-gray-300 dark:border-zinc-700"
    >
      <h2
        class="text-start whitespace-nowrap text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white py-1 border-b border-gray-300 dark:border-zinc-700 lg:border-none w-full"
      >
        {industry_all_heading({
          count: rawData?.length?.toLocaleString("en-US") ?? "0",
        })}
      </h2>
      <div
        class="mt-1 w-full flex flex-row lg:flex order-1 items-center ml-auto pb-1 pt-1 sm:pt-0 w-full order-0 lg:order-1"
      >
        <div class="relative lg:ml-auto w-full lg:w-fit">
          <div
            class="inline-block cursor-pointer absolute right-2 top-2 text-sm"
          >
            {#if inputValue?.length > 0}
              <label class="cursor-pointer" on:click={() => resetTableSearch()}>
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
            placeholder={industry_search_placeholder()}
            class="py-2 text-[0.85rem] sm:text-sm border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 rounded-full text-gray-700 dark:text-zinc-200 placeholder:text-gray-800 dark:placeholder:text-zinc-300 px-3 focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80 grow w-full sm:min-w-56 lg:max-w-14"
          />
        </div>

        <div class="ml-2">
          <DownloadData
            {data}
            rawData={originalData}
            title={"all_industries_overview"}
          />
        </div>

        {#if customColumnOrder?.length > 0}
          <button
            on:click={resetColumnOrder}
            title={industry_reset_column_order()}
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

  {#if displayList?.length > 0}
    <div class="flex justify-center w-full m-auto h-full overflow-hidden">
      <!-- Content area -->

      <div
        class="w-full m-auto mt-4 mb-4 rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 overflow-x-auto"
      >
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
          <tbody class="divide-y divide-gray-200/70 dark:divide-zinc-800/80">
            {#each displayList as item}
              <!-- row -->
              <tr
                class="transition-colors hover:bg-gray-50/60 dark:hover:bg-zinc-900/50"
              >
                {#each columns as column}
                  {#if column.key === "industry"}
                    <td
                      class="text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-700 dark:text-zinc-200"
                    >
                      <a
                        href={`/list/industry/${item?.name?.replace(/ /g, "-")?.replace(/&/g, "and")?.replace(/-{2,}/g, "-")?.toLowerCase()}`}
                        class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                      >
                        {item?.name?.length > charNumber
                          ? item?.name?.slice(0, charNumber) + "..."
                          : item?.name}
                      </a>
                    </td>
                  {:else if column.key === "numStocks"}
                    <td
                      class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                    >
                      {item?.numStocks}
                    </td>
                  {:else if column.key === "totalMarketCap"}
                    <td
                      class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                    >
                      {abbreviateNumber(item?.totalMarketCap) ?? "n/a"}
                    </td>
                  {:else if column.key === "avgDividendYield"}
                    <td
                      class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                    >
                      {item?.avgDividendYield?.toFixed(2) ?? "n/a"}%
                    </td>
                  {:else if column.key === "pe"}
                    <td
                      class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                    >
                      {item?.pe?.toFixed(2) ?? "n/a"}
                    </td>
                  {:else if column.key === "profitMargin"}
                    <td
                      class=" {item?.profitMargin >= 0
                        ? "before:content-['+'] text-emerald-800 dark:text-emerald-400"
                        : 'text-rose-800 dark:text-rose-400'}   text-[0.85rem] sm:text-sm whitespace-nowrap text-end tabular-nums"
                    >
                      {abbreviateNumber(item?.profitMargin)}%
                    </td>
                  {:else if column.key === "avgChange1D"}
                    <td
                      class="{item?.avgChange1D && item?.avgChange1D > 0
                        ? "before:content-['+'] text-emerald-800 dark:text-emerald-400"
                        : item?.avgChange1D && item?.avgChange1D < 0
                          ? 'text-rose-800 dark:text-rose-400'
                          : ''} text-end text-[0.85rem] sm:text-sm whitespace-nowrap tabular-nums"
                    >
                      {item?.avgChange1D
                        ? item?.avgChange1D?.toFixed(2) + "%"
                        : "n/a"}
                    </td>
                  {:else if column.key === "avgChange1W"}
                    <td
                      class="{item?.avgChange1W && item?.avgChange1W > 0
                        ? "before:content-['+'] text-emerald-800 dark:text-emerald-400"
                        : item?.avgChange1W && item?.avgChange1W < 0
                          ? 'text-rose-800 dark:text-rose-400'
                          : ''} text-end text-[0.85rem] sm:text-sm whitespace-nowrap tabular-nums"
                    >
                      {item?.avgChange1W
                        ? item?.avgChange1W?.toFixed(2) + "%"
                        : "n/a"}
                    </td>
                  {:else if column.key === "avgChange1M"}
                    <td
                      class="{item?.avgChange1M && item?.avgChange1M > 0
                        ? "before:content-['+'] text-emerald-800 dark:text-emerald-400"
                        : item?.avgChange1M && item?.avgChange1M < 0
                          ? 'text-rose-800 dark:text-rose-400'
                          : ''} text-end text-[0.85rem] sm:text-sm whitespace-nowrap tabular-nums"
                    >
                      {item?.avgChange1M
                        ? item?.avgChange1M?.toFixed(2) + "%"
                        : "n/a"}
                    </td>
                  {:else if column.key === "avgChange1Y"}
                    <td
                      class="{item?.avgChange1Y && item?.avgChange1Y > 0
                        ? "before:content-['+'] text-emerald-800 dark:text-emerald-400"
                        : item?.avgChange1Y && item?.avgChange1Y < 0
                          ? 'text-rose-800 dark:text-rose-400'
                          : ''} text-end text-[0.85rem] sm:text-sm whitespace-nowrap tabular-nums"
                    >
                      {item?.avgChange1Y
                        ? item?.avgChange1Y?.toFixed(2) + "%"
                        : "n/a"}
                    </td>
                  {/if}
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {:else}
    <div class="w-full flex items-center justify-start text-start">
      <Infobox text={industry_no_results({ query: inputValue })} />
    </div>
  {/if}

  <!-- Pagination controls -->
  {#if displayList?.length > 0}
    <div class="flex flex-row items-center justify-between mt-8 sm:mt-5 px-1">
      <!-- Previous and Next buttons -->
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
          <span class="hidden sm:inline">{industry_pagination_previous()}</span
          ></Button
        >
      </div>

      <!-- Page info and rows selector in center -->
      <div class="flex flex-row items-center gap-4">
        <span class="text-sm text-gray-600 dark:text-zinc-300">
          {industry_pagination_page_of({
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
                >{industry_rows_label({ rows: rowsPerPage })}</span
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
                    <span class="text-sm"
                      >{industry_rows_label({ rows: item })}</span
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
          <span class="hidden sm:inline">{industry_pagination_next()}</span>
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
        {industry_back_to_top()}
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
</section>

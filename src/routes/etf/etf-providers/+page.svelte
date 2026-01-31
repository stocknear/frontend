<script lang="ts">
  import { abbreviateNumber, formatETFName } from "$lib/utils";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import Pagination from "$lib/components/Table/Pagination.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import { onMount } from "svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import { page } from "$app/stores";
  import {
    etf_providers_count,
    etf_providers_empty,
    etf_providers_infobox,
    etf_providers_seo_description,
    etf_providers_seo_keywords,
    etf_providers_seo_title,
    etf_providers_structured_description,
    etf_providers_structured_item_description,
    etf_providers_structured_item_name,
    etf_providers_structured_name,
    etf_search_placeholder,
  } from "$lib/paraglide/messages";

  export let data;

  let originalData = data?.getData;
  let rawData = originalData;
  let etfProviderList = [];
  let inputValue = "";
  let searchWorker: Worker | undefined;

  let pagePathName = $page?.url?.pathname;

  // Pagination state
  let currentPage = 1;
  let rowsPerPage = 20;
  let rowsPerPageOptions = [20, 50, 100];
  let totalPages = 1;

  // Pagination functions
  function updatePaginatedData() {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const dataSource = inputValue?.length > 0 ? rawData : originalData;
    etfProviderList = dataSource?.slice(startIndex, endIndex) || [];
    totalPages = Math.ceil((dataSource?.length || 0) / rowsPerPage);
  }

  function handlePageChange(event) {
    currentPage = event.detail.page;
    updatePaginatedData();
  }

  function handleRowsPerPageChange(event) {
    rowsPerPage = event.detail.rowsPerPage;
    currentPage = 1; // Reset to first page when changing rows per page
    updatePaginatedData();
    saveRowsPerPage(); // Save to localStorage
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    initColumnOrder();

    if (!searchWorker) {
      const SearchWorker =
        await import("$lib/workers/tableSearchWorker?worker");
      searchWorker = new SearchWorker.default();
      searchWorker.onmessage = handleSearchMessage;
    }

    // Initialize pagination
    updatePaginatedData();
  });

  // Reactive statement to load pagination settings when page changes
  $: if ($page?.url?.pathname && $page?.url?.pathname !== pagePathName) {
    pagePathName = $page?.url?.pathname;
    loadRowsPerPage(); // Load pagination preference for new page
    updatePaginatedData(); // Update display with loaded preference
  }

  let defaultColumns = [
    { key: "name", label: "Name", align: "left" },
    { key: "totalAssets", label: "Total Assets", align: "right" },
    { key: "funds", label: "Funds", align: "right" },
    { key: "avgExpenseRatio", label: "Avg. Cost", align: "right" },
    { key: "avgHoldings", label: "Avg. Holdings", align: "right" },
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
    name: { order: "none", type: "string" },
    totalAssets: { order: "none", type: "number" },
    funds: { order: "none", type: "number" },
    avgExpenseRatio: { order: "none", type: "number" },
    avgHoldings: { order: "none", type: "number" },
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
        // If searching, re-run the search to get the original filtered order
        search();
      } else {
        // Reset to original unsorted state
        originalData = data?.getData || [];
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

    currentPage = 1; // Reset to first page when sorting
    updatePaginatedData(); // Update the displayed data

    // Force reactivity by triggering the sortOrders reactivity
    sortOrders = { ...sortOrders };
  };
</script>

<SEO
  title={etf_providers_seo_title()}
  description={etf_providers_seo_description()}
  keywords={etf_providers_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: etf_providers_structured_name(),
    description: etf_providers_structured_description(),
    url: "https://stocknear.com/etf/etf-providers",
    mainEntity: {
      "@type": "ItemList",
      name: etf_providers_structured_item_name(),
      description: etf_providers_structured_item_description(),
      numberOfItems: etfProviderList?.length || 0,
    },
    about: {
      "@type": "FinancialService",
      name: "ETF Management Services",
      description:
        "Investment management companies providing exchange-traded funds",
    },
  }}
/>

<section class="w-full overflow-hidden m-auto text-gray-700 dark:text-zinc-200">
  <Infobox text={etf_providers_infobox()} />

  <div class="items-center lg:overflow-visible px-1 py-1 mt-4">
    <div
      class="col-span-2 flex flex-col lg:flex-row items-start sm:items-center lg:order-2 lg:grow py-2 border-t border-b border-gray-300 dark:border-zinc-700"
    >
      <h2
        class="text-start whitespace-nowrap text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white py-1 border-b border-gray-300 dark:border-zinc-700 lg:border-none w-full"
      >
        {etf_providers_count({
          count: originalData?.length?.toLocaleString("en-US") || "0",
        })}
      </h2>
      <div
        class="mt-1 w-full flex flex-row lg:flex order-1 items-center ml-auto pb-1 pt-1 sm:pt-0 w-full order-0 lg:order-1"
      >
        <div class="relative ml-auto w-full sm:min-w-56 sm:max-w-14">
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
                  /></svg
                >
              </label>
            {/if}
          </div>

          <input
            type="text"
            bind:value={inputValue}
            on:input={search}
            placeholder={etf_search_placeholder()}
            class="shadow-sm py-2 text-[0.85rem] sm:text-sm border bg-white/80 dark:bg-zinc-950/60 border-gray-300 dark:border-zinc-700 rounded-full placeholder:text-gray-800 dark:placeholder:text-zinc-300 px-3 focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80 grow w-full sm:min-w-56 lg:max-w-14"
          />
        </div>

        <div class="ml-2">
          <DownloadData {data} {rawData} title={"etf_providers_data"} />
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

  <!-- Page wrapper -->
  <div class="flex justify-center w-full m-auto h-full overflow-hidden">
    <!-- Content area -->
    <div class="w-full">
      {#if etfProviderList?.length > 0}
        <div class="w-full overflow-x-auto">
          <table
            class="table table-sm table-compact w-full border border-gray-300 shadow dark:border-zinc-700 rounded-xl overflow-hidden bg-white/70 dark:bg-zinc-950/40 m-auto mt-4"
          >
            <thead>
              <TableHeader
                {columns}
                {sortOrders}
                {sortData}
                onColumnReorder={handleColumnReorder}
              />
            </thead>
            <tbody>
              {#each etfProviderList as item}
                <!-- row -->
                <tr
                  class="border-b border-gray-300 dark:border-zinc-700 hover:bg-gray-50/60 dark:hover:bg-zinc-900/50"
                >
                  {#each columns as column}
                    {#if column.key === "name"}
                      <td
                        class="text-sm text-gray-700 dark:text-zinc-200 whitespace-nowrap"
                      >
                        <a
                          href={"/etf/etf-providers/" + item?.name}
                          class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                        >
                          {formatETFName(item?.name)}
                        </a>
                      </td>
                    {:else if column.key === "totalAssets"}
                      <td
                        class="text-sm text-gray-600 dark:text-zinc-300 whitespace-nowrap text-end tabular-nums"
                      >
                        {abbreviateNumber(item?.totalAssets)}
                      </td>
                    {:else if column.key === "funds"}
                      <td
                        class="text-sm text-gray-600 dark:text-zinc-300 whitespace-nowrap text-end tabular-nums"
                      >
                        {item?.funds}
                      </td>
                    {:else if column.key === "avgExpenseRatio"}
                      <td
                        class="text-sm text-gray-600 dark:text-zinc-300 whitespace-nowrap text-end tabular-nums"
                      >
                        {item?.avgExpenseRatio}%
                      </td>
                    {:else if column.key === "avgHoldings"}
                      <td
                        class="text-sm text-gray-600 dark:text-zinc-300 whitespace-nowrap text-end tabular-nums"
                      >
                        {item?.avgHoldings}
                      </td>
                    {/if}
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <Pagination
          {currentPage}
          {totalPages}
          {rowsPerPage}
          {rowsPerPageOptions}
          on:pageChange={handlePageChange}
          on:rowsPerPageChange={handleRowsPerPageChange}
        />
      {:else}
        <Infobox text={etf_providers_empty({ query: inputValue })} />
      {/if}
    </div>
  </div>
</section>

<script lang="ts">
  import { abbreviateNumber, formatETFName } from "$lib/utils";
  import { screenWidth } from "$lib/store";
  import { onMount } from "svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { page } from "$app/stores";
  import * as m from "$lib/paraglide/messages";

  export let data;

  let originalData = data?.getETFProviderData;
  let rawData = originalData;
  let etfProviderData = [];
  let inputValue = "";
  let searchWorker: Worker | undefined;

  let pagePathName = $page?.url?.pathname;

  // Pagination state
  let currentPage = 1;
  let rowsPerPage = 20;
  let rowsPerPageOptions = [20, 50, 100];
  let totalPages = 1;

  let etfProviderName = formatETFName(data?.getProviderName);

  const totalAssets = originalData?.reduce(
    (total, item) => total + item?.totalAssets,
    0,
  );

  const avgExpenseRatio =
    originalData?.reduce((total, item) => total + item?.expenseRatio || 0, 0) /
    originalData?.length;

  // Pagination functions
  function updatePaginatedData() {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const dataSource = inputValue?.length > 0 ? rawData : originalData;
    etfProviderData = dataSource?.slice(startIndex, endIndex) || [];
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
      const SearchWorker = await import(
        "$lib/workers/tableSearchWorker?worker"
      );
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

  $: charNumber = $screenWidth < 640 ? 20 : 20;

  let defaultColumns = [
    { key: "symbol", label: "Symbol", align: "left" },
    { key: "name", label: "Name", align: "left" },
    { key: "price", label: "Price", align: "right" },
    { key: "changesPercentage", label: "Change", align: "right" },
    { key: "totalAssets", label: "Total Assets", align: "right" },
    { key: "numberOfHoldings", label: "Holdings", align: "right" },
    { key: "expenseRatio", label: "Expense Ratio", align: "right" },
  ];

  // Column reordering state
  let customColumnOrder: string[] = [];

  // Column reordering functions
  function getColumnOrderStorageKey() {
    return `/etf/etf-providers/[slug]_columnOrder`;
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
    symbol: { order: "none", type: "string" },
    name: { order: "none", type: "string" },
    price: { order: "none", type: "number" },
    changesPercentage: { order: "none", type: "number" },
    totalAssets: { order: "none", type: "number" },
    numberOfHoldings: { order: "none", type: "number" },
    expenseRatio: { order: "none", type: "number" },
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
        originalData = data?.getETFProviderData || [];
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

  $: htmlOutput = m.etf_provider_detail_infobox({
    provider: etfProviderName,
    count: String(originalData?.length || 0),
    assets: abbreviateNumber(totalAssets),
    expenseRatio: avgExpenseRatio?.toFixed(2) || "0"
  });
</script>

<SEO
  title={m.etf_provider_detail_seo_title({ provider: etfProviderName, count: String(originalData?.length || 0) })}
  description={m.etf_provider_detail_seo_description({ provider: etfProviderName, count: String(originalData?.length || 0), assets: abbreviateNumber(totalAssets), expenseRatio: avgExpenseRatio?.toFixed(2) || "0" })}
  keywords={m.etf_provider_detail_seo_keywords({ provider: etfProviderName })}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: m.etf_provider_detail_structured_name({ provider: etfProviderName }),
    description: m.etf_provider_detail_structured_description({ provider: etfProviderName }),
    url: `https://stocknear.com/etf/etf-providers/${data?.getProviderName}`,
    about: {
      "@type": "Organization",
      name: etfProviderName,
      description:
        "Investment management company providing exchange-traded funds",
    },
    mainEntity: {
      "@type": "ItemList",
      name: m.etf_provider_detail_structured_item_name({ provider: etfProviderName }),
      description: m.etf_provider_detail_structured_item_description({ provider: etfProviderName }),
      numberOfItems: originalData?.length || 0,
    },
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Total Assets Under Management",
        value: abbreviateNumber(totalAssets),
      },
      {
        "@type": "PropertyValue",
        name: "Number of Funds",
        value: originalData?.length || 0,
      },
      {
        "@type": "PropertyValue",
        name: "Average Expense Ratio",
        value: avgExpenseRatio?.toFixed(2) + "%",
      },
    ],
  }}
/>

<section class="w-full overflow-hidden m-auto text-gray-700 dark:text-zinc-200">
  {#if originalData?.length !== 0}
    <div class="mb-5 mt-5 sm:mt-0">
      <Infobox text={htmlOutput} />
    </div>
  {/if}

  <div
    class="mb-4 grid grid-cols-1 sm:grid-cols-3 overflow-hidden rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/60 dark:bg-zinc-950/40 divide-y divide-gray-200/70 dark:divide-zinc-800/80 sm:divide-x sm:divide-y-0"
  >
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div
          class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
        >
          {m.etf_stats_listed_funds()}
        </div>
        <div
          class="mt-1 break-words text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tabular-nums"
        >
          {originalData?.length}
        </div>
      </div>
    </div>
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div
          class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
        >
          {m.etf_stats_total_assets()}
        </div>
        <div
          class="mt-1 break-words text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tabular-nums"
        >
          {abbreviateNumber(totalAssets)}
        </div>
      </div>
    </div>
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div
          class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
        >
          {m.etf_stats_average_cost()}
        </div>
        <div
          class="mt-1 break-words text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tabular-nums"
        >
          {avgExpenseRatio?.toFixed(2)}%
        </div>
      </div>
    </div>
  </div>

  {#if originalData?.length !== 0}
    <div class="items-center lg:overflow-visible px-1 py-1 mt-4">
      <div
        class="col-span-2 flex flex-col lg:flex-row items-start sm:items-center lg:order-2 lg:grow py-2 border-t border-b border-gray-300 dark:border-zinc-700"
      >
        <h2
          class="text-start whitespace-nowrap text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white py-1 border-b border-gray-300 dark:border-zinc-700 lg:border-none w-full"
        >
          {m.etf_provider_detail_count({ count: originalData?.length?.toLocaleString("en-US") || "0" })}
        </h2>
        <div
          class="mt-1 w-full flex flex-row lg:flex order-1 items-center ml-auto pb-1 pt-1 sm:pt-0 w-full order-0 lg:order-1"
        >
          <div class="relative ml-auto w-full sm:min-w-56 sm:max-w-14">
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
              type="text"
              bind:value={inputValue}
              on:input={search}
              placeholder={m.etf_search_placeholder()}
              class="py-2 text-[0.85rem] sm:text-sm border bg-white/80 dark:bg-zinc-950/60 border-gray-300 dark:border-zinc-700 rounded-full placeholder:text-gray-800 dark:placeholder:text-zinc-300 px-3 focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80 grow w-full sm:min-w-56 lg:max-w-14"
            />
          </div>

          <div class="ml-2">
            <DownloadData
              {data}
              {rawData}
              title={`${data?.getProviderName}_etf_data`}
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

    <!-- Page wrapper -->
    <div class="flex justify-center w-full m-auto h-full overflow-hidden">
      <!-- Content area -->
      <div class="w-full">
        {#if etfProviderData?.length > 0}
          <div class="w-full overflow-x-auto">
            <table
              class="mt-4 table table-sm table-compact w-full border border-gray-300 shadow dark:border-zinc-700 rounded-xl overflow-hidden bg-white/70 dark:bg-zinc-950/40 m-auto"
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
                {#each etfProviderData as item, index}
                  <!-- row -->
                  <tr
                    class="border-b border-gray-300 dark:border-zinc-700 hover:bg-gray-50/60 dark:hover:bg-zinc-900/50"
                  >
                    {#each columns as column}
                      {#if column.key === "symbol"}
                        <td
                          class="text-sm text-gray-700 dark:text-zinc-200 whitespace-nowrap"
                        >
                          <HoverStockChart
                            symbol={item?.symbol}
                            assetType={"etf"}
                          />
                        </td>
                      {:else if column.key === "name"}
                        <td
                          class="text-sm text-gray-600 dark:text-zinc-300 whitespace-nowrap"
                        >
                          {item?.name?.length > charNumber
                            ? item?.name?.slice(0, charNumber) + "..."
                            : item?.name}
                        </td>
                      {:else if column.key === "price"}
                        <td
                          class="text-sm text-gray-600 dark:text-zinc-300 whitespace-nowrap text-end tabular-nums"
                        >
                          {item?.price}
                        </td>
                      {:else if column.key === "changesPercentage"}
                        <td
                          class="text-sm text-gray-600 dark:text-zinc-300 whitespace-nowrap text-end tabular-nums"
                        >
                          {#if item?.changesPercentage >= 0}
                            <span class="text-emerald-600 dark:text-emerald-400"
                              >+{item?.changesPercentage >= 1000
                                ? abbreviateNumber(item?.changesPercentage)
                                : item?.changesPercentage?.toFixed(2)}%</span
                            >
                          {:else if item?.changesPercentage < 0}
                            <span class="text-rose-600 dark:text-rose-400"
                              >{item?.changesPercentage <= -1000
                                ? abbreviateNumber(item?.changesPercentage)
                                : item?.changesPercentage?.toFixed(2)}%
                            </span>
                          {:else}
                            -
                          {/if}
                        </td>
                      {:else if column.key === "totalAssets"}
                        <td
                          class="text-end text-sm text-gray-600 dark:text-zinc-300 whitespace-nowrap tabular-nums"
                        >
                          {abbreviateNumber(item?.totalAssets)}
                        </td>
                      {:else if column.key === "numberOfHoldings"}
                        <td
                          class="text-end text-sm text-gray-600 dark:text-zinc-300 whitespace-nowrap tabular-nums"
                        >
                          {item?.numberOfHoldings}
                        </td>
                      {:else if column.key === "expenseRatio"}
                        <td
                          class="text-end text-sm text-gray-600 dark:text-zinc-300 whitespace-nowrap tabular-nums"
                        >
                          {item?.expenseRatio}%
                        </td>
                      {/if}
                    {/each}
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          <!-- Pagination controls -->
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
                <span class="hidden sm:inline">{m.etf_pagination_previous()}</span></Button
              >
            </div>

            <!-- Page info and rows selector in center -->
            <div class="flex flex-row items-center gap-4">
              <span class="text-sm text-gray-600 dark:text-zinc-300">
                {m.etf_pagination_page_of({ current: String(currentPage), total: String(totalPages) })}
              </span>

              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild let:builder>
                  <Button
                    builders={[builder]}
                    class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span class="truncate text-[0.85rem] sm:text-sm"
                      >{m.etf_pagination_rows({ count: String(rowsPerPage) })}</span
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
                          <span class="text-sm">{m.etf_pagination_rows({ count: String(item) })}</span>
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
                <span class="hidden sm:inline">{m.etf_pagination_next()}</span>
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
              {m.etf_back_to_top()} <svg
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
        {:else}
          <Infobox text={m.etf_provider_detail_empty({ query: inputValue })} />
        {/if}
      </div>
    </div>
  {:else}
    <div
      class="mt-10 w-full flex justify-center items-center m-auto text-lg font-semibold text-gray-800 dark:text-zinc-300"
    >
      {m.etf_provider_detail_no_data()}
    </div>
  {/if}
</section>

<script lang="ts">
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import {
  politicians_back_to_top,
  politicians_breadcrumb_home,
  politicians_breadcrumb_politicians,
  politicians_count_members,
  politicians_empty_filter,
  politicians_empty_search,
  politicians_filter_party,
  politicians_main_title,
  politicians_pagination_next,
  politicians_pagination_page_of,
  politicians_pagination_previous,
  politicians_pagination_rows,
  politicians_search_placeholder,
  politicians_seo_description,
  politicians_seo_keywords,
  politicians_seo_title,
  politicians_structured_description,
  politicians_structured_name,
} from "$lib/paraglide/messages";

  import { onMount } from "svelte";
  import { page } from "$app/stores";

  export let data;

  let syncWorker: Worker | undefined;
  let searchWorker: Worker | undefined;

  let pagePathName = $page?.url?.pathname;

  let originalData = data?.getAllPolitician || [];
  let rawData = originalData;

  let displayList = [];
  let isLoaded = false;
  let animationClass = "";
  let animationId = "";
  let favoriteList = [];
  let inputValue = "";
  let filterList = [];
  let checkedItems: Set<any> = new Set();

  // Pagination state
  let currentPage = 1;
  let rowsPerPage = 20;
  let rowsPerPageOptions = [20, 50, 100];
  let totalPages = 1;

  // Pagination functions
  function updatePaginatedData() {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const dataSource =
      inputValue?.length > 0 || filterList?.length > 0 ? rawData : originalData;
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

  // Handle messages from our filtering web worker.
  const handleMessage = (event) => {
    rawData = event.data?.output || [];
    rawData?.sort((a, b) => {
      // Check if each id is in the favoriteList
      const aIsFavorite = favoriteList?.includes(a?.id);
      const bIsFavorite = favoriteList?.includes(b?.id);

      // If both are favorites or both are not, keep their order
      if (aIsFavorite === bIsFavorite) return 0;

      // If a is favorite and b is not, a comes first; otherwise, b comes first
      return aIsFavorite ? -1 : 1;
    });

    currentPage = 1; // Reset to first page after filtering
    updatePaginatedData();
  };

  // Tell the web worker to filter our data
  const loadWorker = async () => {
    syncWorker?.postMessage({
      rawData: originalData,
      filterList: filterList,
    });
  };

  async function handleChangeValue(value) {
    if (checkedItems.has(value)) {
      checkedItems.delete(value);
    } else {
      checkedItems.add(value);
    }
    const filterSet = new Set(filterList);
    filterSet.has(value) ? filterSet.delete(value) : filterSet.add(value);
    filterList = Array.from(filterSet);

    if (filterList.length > 0) {
      await loadWorker();
    } else {
      rawData = [...originalData];
      rawData?.sort((a, b) => {
        // Check if each id is in the favoriteList
        const aIsFavorite = favoriteList?.includes(a?.id);
        const bIsFavorite = favoriteList?.includes(b?.id);

        // If both are favorites or both are not, keep their order
        if (aIsFavorite === bIsFavorite) return 0;

        // If a is favorite and b is not, a comes first; otherwise, b comes first
        return aIsFavorite ? -1 : 1;
      });

      currentPage = 1; // Reset to first page
      updatePaginatedData();
    }
  }

  onMount(async () => {
    try {
      const savedList = localStorage?.getItem(pagePathName);

      if (savedList) {
        favoriteList = JSON?.parse(savedList);
      }
    } catch (e) {
      console.log(e);
    }

    // Load column order preference
    loadColumnOrder(true);

    // Load pagination preference
    loadRowsPerPage();

    // Initialize workers
    if (!syncWorker) {
      const SyncWorker = await import("./workers/filterWorker?worker");
      syncWorker = new SyncWorker.default();
      syncWorker.onmessage = handleMessage;
    }

    if (!searchWorker) {
      const SearchWorker = await import(
        "$lib/workers/tableSearchWorker?worker"
      );
      searchWorker = new SearchWorker.default();
      searchWorker.onmessage = handleSearchMessage;
    }

    rawData?.sort((a, b) => {
      // Check if each id is in the favoriteList
      const aIsFavorite = favoriteList?.includes(a?.id);
      const bIsFavorite = favoriteList?.includes(b?.id);

      // If both are favorites or both are not, keep their order
      if (aIsFavorite === bIsFavorite) return 0;

      // If a is favorite and b is not, a comes first; otherwise, b comes first
      return aIsFavorite ? -1 : 1;
    });

    // Initialize pagination
    updatePaginatedData();
    isLoaded = true;
  });

  // Reactive statement to load pagination settings when page changes
  $: if ($page?.url?.pathname && $page?.url?.pathname !== pagePathName) {
    pagePathName = $page?.url?.pathname;
    loadRowsPerPage(); // Load pagination preference for new page
    updatePaginatedData(); // Update display with loaded preference
  }

  async function resetTableSearch() {
    inputValue = "";
    if (filterList?.length === 0) {
      rawData = originalData;
    } else {
      await loadWorker(); // Re-apply party filters
    }
    currentPage = 1; // Reset to first page
    updatePaginatedData();
  }

  async function search() {
    inputValue = inputValue?.toLowerCase();

    setTimeout(async () => {
      if (inputValue?.length > 0) {
        await loadSearchWorker();
      } else {
        // Reset to original data or re-apply party filters if they exist
        if (filterList?.length === 0) {
          rawData = originalData || [];
        } else {
          await loadWorker(); // Re-apply party filters
        }
        currentPage = 1; // Reset to first page
        updatePaginatedData();
      }
    }, 100);
  }

  const loadSearchWorker = async () => {
    if (searchWorker) {
      // Use the base data (original or party-filtered) for search
      const baseData = filterList?.length > 0 ? rawData : originalData;
      searchWorker.postMessage({
        rawData: baseData,
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

  function saveList() {
    try {
      // Save the version along with the rules
      localStorage?.setItem(pagePathName, JSON?.stringify(favoriteList));
    } catch (e) {
      console.log("Failed saving indicator rules: ", e);
    }
  }

  async function addToFavorite(event, itemId) {
    event?.preventDefault();
    if (favoriteList.includes(itemId)) {
      // Remove ticker from the watchlist.
      favoriteList = favoriteList?.filter((item) => item !== itemId);
    } else {
      // Add ticker to the watchlist.
      animationId = itemId;
      animationClass = "heartbeat";
      const removeAnimation = () => {
        animationId = "";
        animationClass = "";
      };
      favoriteList = [...favoriteList, itemId];
      const heartbeatElement = document.getElementById(itemId);
      if (heartbeatElement) {
        // Only add listener if it's not already present
        if (!heartbeatElement.classList.contains("animation-added")) {
          heartbeatElement.addEventListener("animationend", removeAnimation);
          heartbeatElement.classList.add("animation-added"); // Prevent re-adding listener
        }
      }
    }

    saveList();
  }

  const defaultColumns = [
    { key: "performanceScore", label: "Rank", align: "left" },
    { key: "representative", label: "Person", align: "left" },
    { key: "favorite", label: "Favorite", align: "center" },
    { key: "party", label: "Party", align: "right" },
    { key: "successRate", label: "Success Rate", align: "right" },
    { key: "avgReturn", label: "Avg. Return", align: "right" },
    { key: "totalTrades", label: "Total Trades", align: "right" },
    { key: "lastTrade", label: "Last Trade", align: "right" },
  ];

  let columns = [...defaultColumns];

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
            columns = applyColumnOrder(defaultColumns);
            lastAppliedColumnKeys = columns.map((c) => c.key).join(",");
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

  // Apply saved column order to columns array
  function applyColumnOrder(
    cols: typeof defaultColumns,
  ): typeof defaultColumns {
    if (customColumnOrder.length === 0) return cols;

    const columnMap = new Map(cols.map((col) => [col.key, col]));
    const orderedColumns: typeof defaultColumns = [];

    // Add columns in saved order (if they exist)
    for (const key of customColumnOrder) {
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

    columns = newColumns;
    customColumnOrder = newColumns.map((col) => col.key);
    lastAppliedColumnKeys = columns.map((c) => c.key).join(",");
    saveColumnOrder(customColumnOrder);
  }

  // Reset column order to default
  function resetColumnOrder(): void {
    customColumnOrder = [];
    columns = [...defaultColumns];
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

  // Reactive: Apply column order when customColumnOrder changes
  $: if (
    defaultColumns &&
    defaultColumns.length > 0 &&
    customColumnOrder.length > 0
  ) {
    const currentColumnKeys = columns.map((c) => c.key).join(",");
    const defaultKeys = defaultColumns.map((c) => c.key);
    const matchingKeys = customColumnOrder.filter((key) =>
      defaultKeys.includes(key),
    );
    const compatibilityRatio = matchingKeys.length / customColumnOrder.length;

    if (
      compatibilityRatio >= 0.5 &&
      currentColumnKeys !== lastAppliedColumnKeys
    ) {
      columns = applyColumnOrder(defaultColumns);
      lastAppliedColumnKeys = columns.map((c) => c.key).join(",");
    }
  }

  let sortOrders = {
    performanceScore: { order: "none", type: "number" },
    representative: { order: "none", type: "string" },
    favorite: { order: "none", type: "favorite" },
    party: { order: "none", type: "string" },
    successRate: { order: "none", type: "number" },
    avgReturn: { order: "none", type: "number" },
    totalTrades: { order: "none", type: "number" },
    lastTrade: { order: "none", type: "date" },
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
      } else if (filterList?.length > 0) {
        // If party filtering, re-run party filter to get original filtered order
        loadWorker();
      } else {
        // Reset to original unsorted state with favorites prioritized
        originalData = data?.getAllPolitician || [];
        originalData?.sort((a, b) => {
          const aIsFavorite = favoriteList?.includes(a?.id);
          const bIsFavorite = favoriteList?.includes(b?.id);
          if (aIsFavorite === bIsFavorite) return 0;
          return aIsFavorite ? -1 : 1;
        });
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
        case "favorite":
          valueA = favoriteList?.includes(a?.id) ? 0 : 1;
          valueB = favoriteList?.includes(b?.id) ? 0 : 1;
          break;
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

    // Get the data to sort and sort it
    const dataToSort =
      inputValue?.length > 0 || filterList?.length > 0 ? rawData : originalData;
    const sortedData = [...dataToSort].sort(compareValues);

    // Update the appropriate data source based on whether we're filtering or not
    if (inputValue?.length > 0 || filterList?.length > 0) {
      rawData = sortedData;
    } else {
      originalData = sortedData;
      rawData = sortedData; // Keep rawData in sync for consistency
    }

    // Force reactivity by triggering the sortOrders reactivity
    sortOrders = { ...sortOrders };

    currentPage = 1; // Reset to first page when sorting
    updatePaginatedData(); // Update the displayed data
  };
</script>

<SEO
  title={politicians_seo_title()}
  description={politicians_seo_description()}
  keywords={politicians_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: politicians_structured_name(),
    description: politicians_structured_description(),
    url: "https://stocknear.com/politicians",
    applicationCategory: "FinanceApplication",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: politicians_breadcrumb_home(),
          item: "https://stocknear.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: politicians_breadcrumb_politicians(),
          item: "https://stocknear.com/politicians",
        },
      ],
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  }}
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
    <li class="text-gray-800 dark:text-zinc-300">{politicians_breadcrumb_politicians()}</li>
  </BreadCrumb>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <h1
            class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
          >
            {politicians_main_title()}
          </h1>
          <div
            class="w-full flex flex-col sm:flex-row items-center justify-start sm:justify-between w-full mt-5 text-gray-600 dark:text-zinc-300 sm:pt-2 sm:pb-2 sm:border-t sm:border-b sm:border-gray-200 sm:dark:border-zinc-700"
          >
            <div
              class="flex flex-row items-center justify-between sm:justify-start w-full sm:w-fit whitespace-nowrap -mb-1 sm:mb-0"
            >
              <h2
                class="text-start w-full mb-2 sm:mb-0 text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
              >
                {politicians_count_members({ count: originalData?.length?.toLocaleString("en-US") })}
              </h2>
            </div>

            <div
              class="flex flex-row items-center ml-auto border-t border-b border-gray-300 dark:border-zinc-700 sm:border-none pt-2 pb-2 sm:pt-0 sm:pb-0 w-full"
            >
              <div
                class="relative ml-auto flex-1 min-w-0 sm:flex-none sm:min-w-56 sm:max-w-14 mr-2"
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
                  type="text"
                  bind:value={inputValue}
                  on:input={search}
                  placeholder={politicians_search_placeholder()}
                  class="py-2 text-[0.85rem] sm:text-sm border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 rounded-full text-gray-700 dark:text-zinc-200 placeholder:text-gray-800 dark:placeholder:text-zinc-300 px-3 focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80 grow w-full"
                />
              </div>

              <div class="shrink-0">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild let:builder>
                    <Button
                      builders={[builder]}
                      class="min-w-fit transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <span class="truncate">{politicians_filter_party()}</span>
                      <svg
                        class="-mr-1 ml-1 h-5 w-5 xs:ml-2 inline-block"
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
                    class="w-56 h-fit max-h-72 overflow-y-auto scroller rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
                  >
                    <DropdownMenu.Group>
                      {#each ["Democratic", "Republican", "Other"] as item}
                        <DropdownMenu.Item
                          class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition"
                        >
                          <div class="flex items-center">
                            <label
                              class="cursor-pointer"
                              on:click={() => handleChangeValue(item)}
                              for={item}
                            >
                              <input
                                type="checkbox"
                                checked={checkedItems.has(item)}
                              />
                              <span class="ml-2">{item}</span>
                            </label>
                          </div>
                        </DropdownMenu.Item>
                      {/each}
                    </DropdownMenu.Group>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
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

          <div class="w-full m-auto mt-4">
            {#if displayList?.length > 0}
              <div
                class="w-full m-auto mb-4 rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 overflow-x-auto"
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
                  <tbody
                    class="divide-y divide-gray-200/70 dark:divide-zinc-800/80"
                  >
                    {#each displayList as item}
                      <tr
                        class="transition-colors hover:bg-gray-50/60 dark:hover:bg-zinc-900/50"
                      >
                        {#each columns as column}
                          {#if column.key === "performanceScore"}
                            <td
                              class="text-[0.85rem] sm:text-sm whitespace-nowrap flex flex-row items-center text-gray-700 dark:text-zinc-200 tabular-nums"
                            >
                              {#if item?.performanceScore !== null && item?.performanceScore !== undefined}
                                <div>
                                  {Number(item?.performanceScore).toFixed(1)}
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
                                >{item?.representative?.replace("_", " ")}</a
                              >
                            </td>
                          {:else if column.key === "favorite"}
                            <td
                              class="text-center text-[0.85rem] sm:text-sm whitespace-nowrap"
                            >
                              <div
                                id={item?.id}
                                on:click|stopPropagation={(event) =>
                                  addToFavorite(event, item?.id)}
                                class="text-center transition hover:text-amber-500 dark:hover:text-amber-400 {favoriteList?.includes(
                                  item?.id,
                                )
                                  ? 'text-amber-500 dark:text-amber-400'
                                  : 'text-gray-400 dark:text-zinc-300'}"
                              >
                                <svg
                                  class="{item?.id === animationId
                                    ? animationClass
                                    : ''} w-5 h-5 inline-block cursor-pointer shrink-0"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 16 16"
                                  ><path
                                    fill="currentColor"
                                    d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327l4.898.696c.441.062.612.636.282.95l-3.522 3.356l.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"
                                  /></svg
                                >
                              </div>
                            </td>
                          {:else if column.key === "party"}
                            <td
                              class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300"
                            >
                              {item?.party}
                            </td>
                          {:else if column.key === "successRate"}
                            <td
                              class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                            >
                              {#if ["Plus", "Pro"]?.includes(data?.user?.tier)}
                                {#if item?.successRate === null || item?.successRate === undefined}
                                  <span class="">n/a</span>
                                {:else}
                                  <span
                                    class="font-medium text-emerald-600 dark:text-emerald-400"
                                    >+{Number(item?.successRate)?.toFixed(
                                      2,
                                    )}%</span
                                  >
                                {/if}
                              {:else}
                                <a href="/pricing" class="flex justify-end">
                                  <svg
                                    class="size-4 mb-1 inline-block"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      fill="currentColor"
                                      d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                    />
                                  </svg>
                                </a>
                              {/if}
                            </td>
                          {:else if column.key === "avgReturn"}
                            <td
                              class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                            >
                              {#if ["Plus", "Pro"]?.includes(data?.user?.tier)}
                                {#if item?.avgReturn === null || item?.avgReturn === undefined}
                                  <span class="">n/a</span>
                                {:else if Number(item?.avgReturn) >= 0}
                                  <span
                                    class="font-medium text-emerald-600 dark:text-emerald-400"
                                    >+{Number(item?.avgReturn)?.toFixed(2)}%</span
                                  >
                                {:else}
                                  <span
                                    class="font-medium text-rose-600 dark:text-rose-400"
                                    >{Number(item?.avgReturn)?.toFixed(2)}%</span
                                  >
                                {/if}
                              {:else}
                                <a href="/pricing" class="flex justify-end">
                                  <svg
                                    class="size-4 mb-1 inline-block"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      fill="currentColor"
                                      d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                    />
                                  </svg>
                                </a>
                              {/if}
                            </td>
                          {:else if column.key === "totalTrades"}
                            <td
                              class="text-end whitespace-nowrap text-[0.85rem] sm:text-sm text-gray-600 dark:text-zinc-300 tabular-nums"
                            >
                              {item?.totalTrades?.toLocaleString("en-US")}
                            </td>
                          {:else if column.key === "lastTrade"}
                            <td
                              class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                            >
                              {new Date(item?.lastTrade)?.toLocaleString(
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
                    {/each}
                  </tbody>
                </table>
              </div>
            {:else if displayList?.length === 0 && inputValue?.length > 0}
              <Infobox text={politicians_empty_search({ query: inputValue })} />
            {:else}
              <Infobox
                text={politicians_empty_filter()}
              />
            {/if}

            <!-- Pagination controls -->
            {#if displayList?.length > 0}
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
  .heartbeat {
    animation: heartbeat-animation 0.3s;
    animation-timing-function: ease-in-out;
  }

  @keyframes heartbeat-animation {
    0% {
      transform: rotate(0deg) scale(0.95);
    }
    25% {
      transform: rotate(10deg) scale(1.05);
    }
    50% {
      transform: rotate(0deg) scale(1.2);
    }
    75% {
      transform: rotate(-10deg) scale(1.05);
    }
    100% {
      transform: rotate(0deg) scale(0.95);
    }
  }
</style>

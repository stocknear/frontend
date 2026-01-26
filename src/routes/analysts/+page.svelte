<script lang="ts">
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import AnalystInfo from "$lib/components/AnalystInfo.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import Infobox from "$lib/components/Infobox.svelte";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";

  import SEO from "$lib/components/SEO.svelte";

  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import {
  analysts_back_to_top,
  analysts_breadcrumb_home,
  analysts_breadcrumb_top_analysts,
  analysts_count,
  analysts_empty,
  analysts_infobox,
  analysts_main_name,
  analysts_pagination_next,
  analysts_pagination_page_of,
  analysts_pagination_previous,
  analysts_pagination_rows,
  analysts_search_placeholder,
  analysts_seo_description,
  analysts_seo_keywords,
  analysts_seo_title,
} from "$lib/paraglide/messages";

  export let data;

  let rawData = data?.getTopAnalyst ?? [];
  let originalData = [...rawData]; // Unaltered copy of raw data
  let unsortedSearchData = []; // Preserve unsorted search results
  let analystList = [];

  let inputValue = "";
  let searchWorker: Worker | undefined;

  // Pagination state
  let currentPage = 1;
  let rowsPerPage = 20;
  let rowsPerPageOptions = [20, 50, 100];
  let totalPages = 1;

  let pagePathName = $page?.url?.pathname;

  function updatePaginatedData() {
    const dataSource = inputValue?.length > 0 ? rawData : originalData;
    const totalItems = dataSource?.length || 0;
    totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / rowsPerPage);
    const normalizedPage = Math.min(Math.max(currentPage, 1), totalPages || 1);
    if (normalizedPage !== currentPage) {
      currentPage = normalizedPage;
    }
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    analystList = dataSource?.slice(startIndex, endIndex) ?? [];
  }

  function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      updatePaginatedData();
    }
  }

  function changeRowsPerPage(newRowsPerPage) {
    rowsPerPage = newRowsPerPage;
    currentPage = 1;
    updatePaginatedData();
    saveRowsPerPage();
  }

  function saveRowsPerPage() {
    if (!pagePathName || typeof localStorage === "undefined") return;

    try {
      const paginationKey = `${pagePathName}_rowsPerPage`;
      localStorage.setItem(paginationKey, String(rowsPerPage));
    } catch (e) {
      console.warn("Failed to save rows per page preference:", e);
    }
  }

  function loadRowsPerPage() {
    const currentPath = pagePathName || $page?.url?.pathname;

    if (!currentPath || typeof localStorage === "undefined") {
      rowsPerPage = 20;
      return;
    }

    try {
      const paginationKey = `${currentPath}_rowsPerPage`;
      const savedRows = localStorage.getItem(paginationKey);

      if (savedRows && rowsPerPageOptions.includes(Number(savedRows))) {
        rowsPerPage = Number(savedRows);
      } else {
        rowsPerPage = 20;
      }
    } catch (e) {
      console.warn("Failed to load rows per page preference:", e);
      rowsPerPage = 20;
    }
  }

  function scrollToTop() {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function resetTableSearch() {
    inputValue = "";
    rawData = originalData;
    unsortedSearchData = [];
    currentPage = 1;
    updatePaginatedData();
  }

  async function search() {
    inputValue = inputValue?.toLowerCase();

    setTimeout(async () => {
      if (inputValue?.length > 0) {
        await loadSearchWorker();
      } else {
        rawData = originalData || [];
        unsortedSearchData = [];
        currentPage = 1;
        updatePaginatedData();
      }
    }, 100);
  }

  const loadSearchWorker = async () => {
    if (searchWorker && rawData?.length > 0) {
      searchWorker.postMessage({
        rawData: originalData,
        inputValue: inputValue,
      });
    }
  };

  const handleSearchMessage = (event) => {
    if (event.data?.message === "success") {
      rawData = event.data?.output ?? [];
      unsortedSearchData = [...rawData];
      currentPage = 1;
      updatePaginatedData();
    }
  };

  onMount(async () => {
    loadRowsPerPage();
    loadColumnOrder(true);

    if (!searchWorker) {
      const SearchWorker = await import(
        "$lib/workers/tableSearchWorker?worker"
      );
      searchWorker = new SearchWorker.default();
      searchWorker.onmessage = handleSearchMessage;
    }

    updatePaginatedData();
  });

  // Reactive statement to load pagination settings when page changes
  $: if ($page?.url?.pathname && $page?.url?.pathname !== pagePathName) {
    pagePathName = $page?.url?.pathname;
    loadRowsPerPage();
    loadColumnOrder(true);
    updatePaginatedData();
  }

  const defaultColumns = [
    { key: "rank", label: "Rank", align: "left" },
    { key: "name", label: "Analyst", align: "left" },
    { key: "successRate", label: "Success Rate", align: "right" },
    { key: "avgReturn", label: "Avg. Return", align: "right" },
    { key: "totalRatings", label: "Total Ratings", align: "right" },
    { key: "lastRating", label: "Last Rating", align: "right" },
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
    rank: { order: "none", type: "number" },
    name: { order: "none", type: "string" },
    successRate: { order: "none", type: "number" },
    avgReturn: { order: "none", type: "number" },
    totalRatings: { order: "none", type: "number" },
    lastRating: { order: "none", type: "date" },
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
    const currentOrderIndex = orderCycle.indexOf(
      sortOrders[key]?.order || "none",
    );
    sortOrders[key] = {
      ...(sortOrders[key] || {}),
      order: orderCycle[(currentOrderIndex + 1) % orderCycle.length],
    };
    const sortOrder = sortOrders[key]?.order;

    // Reset to original data when 'none' and stop further sorting
    if (sortOrder === "none") {
      originalData = [...rawData]; // Reset originalData to rawData
      currentPage = 1;
      updatePaginatedData();
      return;
    }

    // Generic comparison function
    const compareValues = (a, b) => {
      const { type } = sortOrders[key];
      let valueA, valueB;

      switch (type) {
        case "date":
          valueA = new Date(a[key]);
          valueB = new Date(b[key]);
          break;
        case "rating":
        case "string":
          // Retrieve values
          valueA = a[key];
          valueB = b[key];

          // Handle null or undefined values, always placing them at the bottom
          if (valueA == null && valueB == null) {
            return 0; // Both are null/undefined, no need to change the order
          } else if (valueA == null) {
            return 1; // null goes to the bottom
          } else if (valueB == null) {
            return -1; // null goes to the bottom
          }

          // Convert the values to uppercase for case-insensitive comparison
          valueA = valueA?.toUpperCase();
          valueB = valueB?.toUpperCase();

          // Perform the sorting based on ascending or descending order
          return sortOrder === "asc"
            ? valueA?.localeCompare(valueB)
            : valueB?.localeCompare(valueA);
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

    // Sort and update the originalData and analystList
    originalData = [...rawData].sort(compareValues);
    currentPage = 1;
    updatePaginatedData();
  };
</script>

<SEO
  title={analysts_seo_title()}
  description={analysts_seo_description()}
  keywords={analysts_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Analyst Rankings",
    description:
      "Analyst rankings and rating performance for catalyst-driven trade ideas",
    url: "https://stocknear.com/analysts",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://stocknear.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Analyst Rankings",
          item: "https://stocknear.com/analysts",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Wall Street Analyst Rankings",
      description: "Analyst performance rankings with recent rating catalysts",
      numberOfItems: rawData?.length || 0,
    },
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pt-5 px-4 lg:px-3 mb-20 text-gray-700 dark:text-zinc-200"
>
  <BreadCrumb
    containerClass="text-xs sm:text-sm breadcrumbs text-gray-500 dark:text-zinc-400"
  >
    <li>
      <a
        href="/"
        class="text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400"
        >{analysts_breadcrumb_home()}</a
      >
    </li>
    <li class="text-gray-500 dark:text-zinc-400">{analysts_breadcrumb_top_analysts()}</li>
  </BreadCrumb>

  <div class="w-full overflow-hidden m-auto mt-5 mb-20">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex flex-col lg:flex-row justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class="border-b border-gray-300 dark:border-zinc-700">
            <h1
              class="mb-3 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              {analysts_main_name()}
            </h1>
          </div>

          <Infobox
            text={analysts_infobox()}
          />

          <div class="items-center lg:overflow-visible px-1 py-1 mt-4">
            <div
              class="col-span-2 flex flex-col lg:flex-row items-start sm:items-center lg:order-2 lg:grow py-1 border-t border-b border-gray-300 dark:border-zinc-700"
            >
              <h2
                class="text-start whitespace-nowrap text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white py-1 border-b border-gray-300 dark:border-zinc-700 lg:border-none w-full"
              >
                {analysts_count({ count: ["Plus", "Pro"].includes(data?.user?.tier)
                  ? originalData?.length ?? 0
                  : 100 })}
              </h2>
              <div
                class="mt-1 w-full flex flex-row lg:flex order-1 items-center ml-auto pb-1 pt-1 sm:pt-0 w-full order-0 lg:order-1"
              >
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
                    placeholder={analysts_search_placeholder()}
                    class="py-2 text-[0.85rem] sm:text-sm border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 rounded-full text-gray-700 dark:text-zinc-200 placeholder:text-gray-800 dark:placeholder:text-zinc-300 px-3 focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80 w-full sm:min-w-56"
                  />
                </div>

                <div class="ml-2">
                  <DownloadData
                    {data}
                    rawData={originalData}
                    title={"top_wall_street_analysts"}
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

          <div class="w-full m-auto mt-4">
            {#if analystList?.length > 0}
              <div
                class="w-full m-auto rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 mb-4 overflow-x-auto"
              >
                <table
                  class="table table-sm table-compact w-full m-auto text-gray-700 dark:text-zinc-200 tabular-nums"
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
                    {#each analystList as item, index}
                      <tr
                        class="transition-colors hover:bg-gray-50/60 dark:hover:bg-zinc-900/50 {(currentPage -
                          1) *
                          rowsPerPage +
                          index +
                          1 ===
                          rawData?.length &&
                        !['Pro', 'Plus']?.includes(data?.user?.tier)
                          ? 'opacity-[0.1]'
                          : ''}"
                      >
                        {#each columns as column}
                          {#if column.key === "rank"}
                            <td class="text-[0.85rem] sm:text-sm text-center">
                              {item?.rank}
                            </td>
                          {:else if column.key === "name"}
                            <td
                              class="text-start text-[0.85rem] sm:text-sm whitespace-nowrap"
                            >
                              <div class="flex flex-col items-start">
                                <a
                                  href={"/analysts/" + item?.analystId}
                                  class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                                  >{item?.name}
                                </a>
                                <div class="flex flex-row items-center mt-1">
                                  {#each Array.from({ length: 5 }) as _, i}
                                    {#if i < Math.floor(item?.analystScore)}
                                      <svg
                                        class="w-3.5 h-3.5 text-amber-400"
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
                                        class="w-3.5 h-3.5 text-gray-300 dark:text-zinc-600"
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

                                  <span
                                    class="ml-1 text-gray-500 dark:text-zinc-400"
                                  >
                                    ({item?.analystScore !== null
                                      ? item?.analystScore
                                      : 0})
                                  </span>
                                </div>
                              </div>
                            </td>
                          {:else if column.key === "successRate"}
                            <td
                              class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap"
                            >
                              {#if Number(item?.successRate) >= 0}
                                <span
                                  class="font-medium text-emerald-600 dark:text-emerald-400"
                                  >+{Number(item?.successRate)?.toFixed(
                                    2,
                                  )}%</span
                                >
                              {/if}
                            </td>
                          {:else if column.key === "avgReturn"}
                            <td
                              class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap"
                            >
                              {#if Number(item?.avgReturn) >= 0}
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
                            </td>
                          {:else if column.key === "totalRatings"}
                            <td
                              class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap"
                            >
                              {item?.totalRatings}
                            </td>
                          {:else if column.key === "lastRating"}
                            <td
                              class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300"
                            >
                              {item?.lastRating !== null
                                ? new Date(item?.lastRating)?.toLocaleString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      daySuffix: "2-digit",
                                    },
                                  )
                                : "n/a"}
                            </td>
                          {/if}
                        {/each}
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {:else}
              <div class="w-full flex items-center justify-start text-start">
                <Infobox text={analysts_empty()} />
              </div>
            {/if}

            {#if analystList?.length > 0}
              <div
                class="flex flex-row items-center justify-between mt-8 sm:mt-5"
              >
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
                    <span class="hidden sm:inline">{analysts_pagination_previous()}</span></Button
                  >
                </div>

                <div class="flex flex-row items-center gap-4">
                  <span class="text-sm text-gray-600 dark:text-zinc-300">
                    {analysts_pagination_page_of({ current: currentPage, total: totalPages })}
                  </span>

                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild let:builder>
                      <Button
                        builders={[builder]}
                        class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <span class="truncate text-[0.85rem] sm:text-sm"
                          >{analysts_pagination_rows({ count: rowsPerPage })}</span
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
                      <DropdownMenu.Group class="pb-2">
                        {#each rowsPerPageOptions as item}
                          <DropdownMenu.Item
                            class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition"
                          >
                            <label
                              on:click={() => changeRowsPerPage(item)}
                              class="inline-flex justify-between w-full items-center cursor-pointer"
                            >
                              <span class="text-sm">{analysts_pagination_rows({ count: item })}</span>
                            </label>
                          </DropdownMenu.Item>
                        {/each}
                      </DropdownMenu.Group>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </div>

                <div class="flex items-center gap-2">
                  <Button
                    on:click={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span class="hidden sm:inline">{analysts_pagination_next()}</span>
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

              <div class="flex justify-center mt-4">
                <button
                  on:click={scrollToTop}
                  class="cursor-pointer text-sm font-medium text-gray-800 dark:text-zinc-300 transition hover:text-violet-600 dark:hover:text-violet-400"
                >
                  {analysts_back_to_top()} <svg
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

          <UpgradeToPro {data} />

          <AnalystInfo />
        </main>
      </div>
    </div>
  </div>
</section>

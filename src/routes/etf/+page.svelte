<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import { screenWidth } from "$lib/store";
  import ArrowLogo from "lucide-svelte/icons/move-up-right";
  import { abbreviateNumber } from "$lib/utils";
  import { onMount } from "svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { page } from "$app/stores";
  import Infobox from "$lib/components/Infobox.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";

  export let data;

  let originalData = data?.getStockList;
  let rawData = originalData;
  let stockList = [];
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

  $: columns = [
    { key: "symbol", label: "Symbol", align: "left" },
    { key: "name", label: "Fund Name", align: "left" },
    { key: "assetClass", label: "Asset Class", align: "left" },
    { key: "aum", label: "Asset", align: "right" },
    { key: "expenseRatio", label: "Expense Ratio", align: "right" },
  ];

  let sortOrders = {
    symbol: { order: "none", type: "string" },
    name: { order: "none", type: "string" },
    aum: { order: "none", type: "number" },
    assetClass: { order: "none", type: "string" },
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
        originalData = data?.getStockList || [];
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

  $: charNumber = $screenWidth < 640 ? 20 : 35;
</script>

<SEO
  title="Complete ETF Directory - All {originalData?.length ||
    0} Exchange-Traded Funds with Real-Time Analysis"
  description="Comprehensive ETF database featuring {originalData?.length ||
    0} exchange-traded funds with real-time quotes, expense ratios, AUM, and holdings analysis. Compare ETF performance, track popular funds like SPY, QQQ, and IWM with advanced portfolio diversification tools."
  keywords="ETF directory, exchange-traded funds list, ETF analysis, ETF expense ratios, ETF holdings, portfolio diversification, passive investing, index funds, ETF screener, fund comparison, asset allocation, SPY ETF, QQQ ETF, sector ETFs, bond ETFs"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Complete ETF Directory",
    description:
      "Comprehensive database of {originalData?.length || 0} exchange-traded funds with analysis tools and real-time data",
    url: "https://stocknear.com/etf",
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
          name: "ETF Directory",
          item: "https://stocknear.com/etf",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Exchange-Traded Funds Directory",
      description:
        "Complete catalog of ETF ticker symbols with expense ratios, assets under management, and performance metrics",
      numberOfItems: originalData?.length || 0,
    },
    about: {
      "@type": "FinancialProduct",
      name: "Exchange-Traded Funds",
      description:
        "Investment funds traded on stock exchanges like individual stocks, offering diversified exposure to various asset classes",
      category: "Investment Fund",
    },
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-6 px-4 lg:px-6 text-gray-700 dark:text-zinc-200"
>
  <div class="text-xs sm:text-sm breadcrumbs text-gray-500 dark:text-zinc-500">
    <ul>
      <li>
        <a
          href="/"
          class="text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white transition"
          >Home</a
        >
      </li>
      <li class="text-gray-500 dark:text-zinc-500">All ETFs</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class="border-b border-gray-200 dark:border-zinc-800/80 pb-2">
            <h1
              class="mb-1 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              All ETF Symbols
            </h1>
            <p
              class="mb-3 px-1 text-sm text-gray-600 dark:text-zinc-400 sm:px-0"
            >
              List of all {originalData?.length} ETF symbols we support
            </p>
          </div>

          <div class="w-full m-auto">
            <!-- Search functionality -->
            <div class="items-center lg:overflow-visible px-1 py-1 mt-4">
              <div
                class="col-span-2 flex flex-col lg:flex-row items-start sm:items-center lg:order-2 lg:grow py-1 border-t border-b border-gray-200 dark:border-zinc-800/80"
              >
                <h2
                  class="text-start whitespace-nowrap text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white py-1 border-b border-gray-200 dark:border-zinc-800/80 lg:border-none w-full"
                >
                  {originalData?.length?.toLocaleString("en-US")} ETFs
                </h2>
                <div
                  class="mt-1 w-full flex flex-row lg:flex order-1 items-center ml-auto pb-1 pt-1 sm:pt-0 w-full order-0 lg:order-1"
                >
                  <div
                    class="relative lg:ml-auto w-full lg:w-fit rounded-full border border-gray-300 shadow dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/60 overflow-hidden flex items-center"
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
                      placeholder="Find..."
                      class="py-2 text-[0.85rem] sm:text-sm border-0 bg-transparent text-gray-700 dark:text-zinc-200 placeholder:text-gray-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-0 grow w-full sm:min-w-56 lg:max-w-14 px-3 pr-8"
                    />
                  </div>

                  <div class="ml-2">
                    <DownloadData {data} {rawData} title={"all_etfs_data"} />
                  </div>
                </div>
              </div>
            </div>

            <!--Start ETF Table-->
            {#if stockList?.length > 0}
              <div
                class="mt-6 w-full m-auto mb-4 rounded-xl border border-gray-300 shadow dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/40 overflow-x-auto"
              >
                <table
                  class="table table-sm table-compact rounded-none sm:rounded w-full m-auto text-gray-700 dark:text-zinc-200 tabular-nums"
                >
                  <thead>
                    <TableHeader {columns} {sortOrders} {sortData} />
                  </thead>
                  <tbody
                    class="divide-y divide-gray-200/70 dark:divide-zinc-800/80"
                  >
                    {#each stockList as item}
                      <tr
                        class="transition-colors hover:bg-gray-50/60 dark:hover:bg-zinc-900/50"
                      >
                        <td class="text-[0.85rem] sm:text-sm text-start">
                          <a
                            href={`/etf/${item?.symbol}`}
                            class="text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                          >
                            {item?.symbol}
                          </a>
                        </td>
                        <td
                          class="whitespace-nowrap text-[0.85rem] sm:text-sm text-start truncate w-fit text-gray-600 dark:text-zinc-300"
                        >
                          {item?.name?.length > charNumber
                            ? item?.name?.slice(0, charNumber) + "..."
                            : item?.name}
                        </td>

                        <td
                          class="whitespace-nowrap text-[0.85rem] sm:text-sm text-start truncate text-gray-600 dark:text-zinc-300"
                        >
                          {item?.assetClass}
                        </td>

                        <td
                          class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                        >
                          {abbreviateNumber(item?.aum)}
                        </td>

                        <td
                          class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                        >
                          {item?.expenseRatio
                            ? item?.expenseRatio?.toFixed(2) + "%"
                            : "n/a"}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
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
                      class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-800/80 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
                          class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-800/80 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
                        class="w-auto min-w-40 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-300 shadow dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
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
                      class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-800/80 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
            {:else}
              <Infobox text={`No ETFs found for "${inputValue}"`} />
            {/if}
          </div>
        </main>
      </div>
    </div>
  </div>
</section>

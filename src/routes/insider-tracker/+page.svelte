<script lang="ts">
  import { screenWidth } from "$lib/store";
  import { abbreviateNumber } from "$lib/utils";
  import { onMount } from "svelte";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";
  import RatingsChart from "$lib/components/RatingsChart.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { page } from "$app/stores";

  import SEO from "$lib/components/SEO.svelte";

  export let data;

  let originalData = processTickerData(data?.getData) ?? [];
  let rawData = originalData;
  let stockList = [];

  let inputValue = "";
  let searchWorker: Worker | undefined;

  function processTickerData(data) {
    const symbolMap = new Map();

    data.forEach((item) => {
      const { symbol } = item;

      if (!symbol) return; // Skip if symbol is not defined

      if (!symbolMap.has(symbol)) {
        // Add the item and initialize count
        symbolMap.set(symbol, { ...item, ratings: 1 });
      } else {
        const existing = symbolMap.get(symbol);

        // Increment the ratings count
        existing.ratings += 1;

        // Keep the item with the latest date
        if (new Date(item.filingDate) > new Date(existing.filingDate)) {
          symbolMap.set(symbol, { ...item, ratings: existing.ratings });
        }
      }
    });

    // Convert the Map back to an array
    return Array?.from(symbolMap?.values());
  }

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

  $: columns = [
    ...($screenWidth > 1024
      ? [{ key: "chart", label: "", align: "right" }]
      : []),
    { key: "symbol", label: "Symbol", align: "left" },
    { key: "name", label: "Name", align: "left" },

    { key: "reportingName", label: "Member", align: "left" },
    { key: "marketCap", label: "Market Cap", align: "right" },
    { key: "shares", label: "Shares", align: "right" },
    { key: "value", label: "Market Value", align: "right" },
    { key: "transactionType", label: "Type", align: "right" },
    //{ key: "transactionDate", label: "Transaction", align: "right" },
    //{ key: "filingDate", label: "Filed", align: "right" },
  ];

  let sortOrders = {
    chart: { order: "none", type: "string" },
    filingDate: { order: "none", type: "date" },
    symbol: { order: "none", type: "string" },
    name: { order: "none", type: "string" },
    reportingName: { order: "none", type: "string" },
    marketCap: { order: "none", type: "number" },
    price: { order: "none", type: "number" },
    changesPercentage: { order: "none", type: "number" },
    shares: { order: "none", type: "number" },
    value: { order: "none", type: "number" },
    transactionType: { order: "none", type: "string" },
    //filingDate: { order: "none", type: "date" },
    //transactionDate: { order: "none", type: "date" },
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
        // If filtering, don't change rawData
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
  $: charNumber = $screenWidth < 640 ? 20 : 40;

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
  title="Insider Trading Tracker - Real-Time Corporate Insider Buys & Sells "
  description="Track real-time insider trading activity from corporate executives, directors, and institutional investors. Monitor insider buys, sells, and ownership changes across all US stocks. Free insider trading tracker with alerts."
  keywords="insider trading tracker, insider trading data, insider buys, insider sells, corporate insider trading, executive trading, insider transactions, insider ownership, insider trading alerts"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Insider Trading Tracker",
    description: "Real-time corporate insider trading activity tracker",
    url: "https://stocknear.com/insider-tracker",
    applicationCategory: "FinanceApplication",
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
          name: "Insider Tracker",
          item: "https://stocknear.com/insider-tracker",
        },
      ],
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Real-time insider trading data",
      "Insider buy/sell tracking",
      "Executive transaction alerts",
      "Ownership change monitoring",
      "Insider trading analysis",
    ],
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3 text-gray-700 dark:text-zinc-200"
>
  <div class="text-xs sm:text-sm breadcrumbs text-gray-500 dark:text-zinc-400">
    <ul>
      <li>
        <a
          href="/"
          class="text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400"
          >Home</a
        >
      </li>
      <li class="text-gray-500 dark:text-zinc-400">Insider Tracker</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class="mb-6 border-b border-gray-200/70 dark:border-zinc-800/80">
            <h1
              class="mb-1 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              Insider Tracker
            </h1>
          </div>

          <Infobox
            text="We update our data in real time to bring you the latest
                      insights on unusual insider trading, sourced from SEC
                      filings with a minimum transaction value of 1 million dollars."
          />

          <div class="items-center lg:overflow-visible px-1 py-1 mt-4">
            <div
              class="col-span-2 flex flex-col lg:flex-row items-start sm:items-center lg:order-2 lg:grow py-1 border-t border-b border-gray-200/70 dark:border-zinc-800/80"
            >
              <h2
                class="text-start whitespace-nowrap text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white py-1 border-b border-gray-200/70 dark:border-zinc-800/80 lg:border-none w-full"
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
                    class="py-2 text-[0.85rem] sm:text-sm border border-gray-200/70 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/70 rounded-full text-gray-700 dark:text-zinc-200 placeholder:text-gray-500 dark:placeholder:text-zinc-400 px-3 focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80 grow w-full sm:min-w-56 lg:max-w-14"
                  />
                </div>

                <div class="ml-2">
                  <DownloadData
                    {data}
                    rawData={originalData}
                    title={"insider_tracker"}
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="w-full m-auto mt-5">
            {#if stockList?.length > 0}
              <div
                class="w-full m-auto rounded-lg border border-gray-200/70 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/40 mb-4 overflow-x-auto"
              >
                <table
                  class="table table-sm table-compact w-full m-auto text-gray-700 dark:text-zinc-200 tabular-nums"
                >
                  <thead>
                    <TableHeader {columns} {sortOrders} {sortData} />
                  </thead>
                  <tbody class="divide-y divide-gray-200/70 dark:divide-zinc-800/80">
                    {#each stockList as item, index}
                      <tr
                        class="transition-colors hover:bg-gray-50/80 dark:hover:bg-zinc-900/60 odd:bg-gray-50/60 dark:odd:bg-zinc-900/30"
                      >
                        <td class="hidden lg:table-cell"
                          ><button
                            on:click={() => openGraph(item?.symbol)}
                            class="cursor-pointer h-full pl-2 pr-2 align-middle lg:pl-3"
                            ><svg
                              class="w-5 h-5 text-gray-400 dark:text-zinc-500 {checkedSymbol ===
                              item?.symbol
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

                        <td class="text-[0.85rem] sm:text-sm text-start text-gray-700 dark:text-zinc-200">
                          <HoverStockChart symbol={item?.symbol} />
                        </td>
                        <td
                          class="whitespace-nowrap text-[0.85rem] sm:text-sm text-start text-gray-700 dark:text-zinc-200"
                        >
                          {item?.name?.length > charNumber
                            ? item?.name?.slice(0, charNumber) + "..."
                            : item?.name}
                        </td>

                        <td
                          class="whitespace-nowrap text-[0.85rem] sm:text-sm text-start text-gray-700 dark:text-zinc-200"
                        >
                          {item?.reportingName?.length > charNumber
                            ? item?.reportingName?.slice(0, charNumber) + "..."
                            : item?.reportingName}
                        </td>

                        <td
                          class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-700 dark:text-zinc-200 tabular-nums"
                        >
                          {abbreviateNumber(item?.marketCap)}
                        </td>

                        <td
                          class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-700 dark:text-zinc-200 tabular-nums"
                        >
                          {item?.shares?.toLocaleString("en-US")}
                        </td>

                        <td
                          class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-700 dark:text-zinc-200 tabular-nums"
                        >
                          {abbreviateNumber(item?.value)}
                        </td>

                        <td
                          class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-700 dark:text-zinc-200"
                        >
                          {item?.transactionType}
                        </td>
                        <!--
                      <td
                        class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
                      >
                        {item?.transactionDate
                          ? new Date(item?.transactionDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "2-digit",
                                year: "numeric",
                                timeZone: "UTC",
                              },
                            )
                          : ""}
                      </td>

                      <td
                        class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
                      >
                        {item?.filingDate
                          ? new Date(item?.filingDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "2-digit",
                                year: "numeric",
                                timeZone: "UTC",
                              },
                            )
                          : ""}
                      </td>

                      -->
                      </tr>

                      {#if checkedSymbol === item?.symbol}
                        <tr class="bg-white/80 dark:bg-zinc-950/60"
                          ><td colspan="10" class="px-0"
                            ><div class="-mt-0.5 px-0 pb-2">
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
                                        ratingsList={originalData?.map(
                                          (item) => ({
                                            ...item,
                                            type: item?.transactionType,
                                            date: item?.filingDate,
                                            ticker: item?.symbol,
                                          }),
                                        )}
                                        symbol={item?.symbol}
                                        numOfRatings={item?.ratings}
                                        title={"Insider Trading"}
                                        addToLast={true}
                                        {data}
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
            {:else}
              <div class="w-full flex items-center justify-start text-start">
                <Infobox text={`No results found for "${inputValue}" `} />
              </div>
            {/if}

            <!-- Pagination controls -->
            {#if stockList?.length > 0}
              <div
                class="flex flex-row items-center justify-between mt-8 sm:mt-5"
              >
                <!-- Previous and Next buttons -->
                <div class="flex items-center gap-2">
                  <Button
                    on:click={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    class="w-fit sm:w-auto transition-all duration-150 border border-gray-200/70 dark:border-zinc-800/80 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
                        class="w-fit sm:w-auto transition-all duration-150 border border-gray-200/70 dark:border-zinc-800/80 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
                      class="w-auto min-w-40 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-200/70 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
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
                    class="w-fit sm:w-auto transition-all duration-150 border border-gray-200/70 dark:border-zinc-800/80 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
          </div>
        </main>
      </div>
    </div>
  </div>
</section>

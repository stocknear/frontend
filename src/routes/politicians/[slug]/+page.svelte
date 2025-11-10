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
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3"
>
  <div class="text-sm sm:text-[1rem] breadcrumbs">
    <ul>
      <li><a href="/" class="text-muted dark:text-gray-300">Home</a></li>
      <li>
        <a href="/politicians" class="text-muted dark:text-gray-300"
          >Politicians</a
        >
      </li>

      <li class="text-muted dark:text-gray-300">{name}</li>
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
                class="flex space-x-3 border-b-[2px] border-below-title pb-3 lg:border-none lg:pb-0"
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
                  <h1 class="mb-0 text-xl sm:text-2xl font-bold">
                    {formatString(name)}
                  </h1>
                  <p
                    class="mb-0.5 text-sm font-semibold text-muted dark:text-gray-300"
                  >
                    {politicianParty ?? "n/a"} / {politicianCongress}
                    {#if politicianDistrict !== undefined && politicianDistrict?.length !== 0}
                      / {politicianDistrict}
                    {/if}
                  </p>
                </div>
              </div>
              <div
                class="mt-4 grid grid-cols-2 overflow-hidden rounded border border-gray-300 dark:border-gray-800 py-2 text-center md:grid-cols-4 md:p-0 lg:mt-0 lg:border-none"
              >
                <div class="flex flex-col px-4 py-2 bp:px-6 md:py-6">
                  <div class="text-xl sm:text-2xl font-bold tracking-tight">
                    ${new Intl.NumberFormat("en", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(totalAmountTraded)}
                  </div>
                  <div
                    class="text-sm font-semibold leading-6 text-muted dark:text-gray-300"
                  >
                    Total Amount
                  </div>
                </div>

                <div
                  class="flex flex-col px-4 py-2 bp:px-6 sm:border-l border-gray-300 dark:sm:border-gray-800 md:py-6"
                >
                  <div class="text-xl sm:text-2xl font-semibold tracking-tight">
                    {numOfTrades?.toLocaleString("en-US")}
                  </div>
                  <div
                    class="text-sm font-semibold leading-6 text-muted dark:text-gray-300"
                  >
                    Transaction
                  </div>
                </div>

                <div
                  class="flex flex-col px-4 py-2 bp:px-6 sm:border-l border-gray-300 dark:sm:border-gray-800 md:py-6"
                >
                  <div class="text-xl sm:text-2xl font-semibold tracking-tight">
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
                    class="text-sm font-semibold leading-6 text-muted dark:text-gray-300"
                  >
                    Last Transaction
                  </div>
                </div>
                <div
                  class="flex flex-col px-4 py-2 bp:px-6 sm:border-l border-gray-300 dark:sm:border-gray-800 md:py-6"
                >
                  <div class="text-xl sm:text-2xl font-bold tracking-tight">
                    {buySellRatio?.toFixed(2)}
                  </div>
                  <div
                    class="text-sm font-semibold leading-6 text-muted dark:text-gray-300"
                  >
                    Buy/Sell
                  </div>
                </div>
              </div>
            </div>

            {#if mainSectors?.length !== 0}
              <div class="mb-10 mt-10">
                <div
                  class="relative my-3 space-y-2 rounded border border-gray-300 dark:border-gray-800 sm:my-6 p-4"
                >
                  <div class="flex flex-col sm:flex-row">
                    <div class="mb-2 font-semibold sm:mb-0">Main Sectors:</div>
                    <div class="flex flex-wrap gap-x-2 gap-y-3 sm:ml-2">
                      {#each mainSectors as item}
                        <a
                          href={sectorNavigation?.find(
                            (listItem) => listItem?.title === item,
                          )?.link}
                          class="inline-block badge border-gray-300 dark:border-gray-800 rounded-[3px] bg-blue-100 dark:bg-primary duration-0 rounded-sm ml-1 px-3 m-auto text-blue-800 dark:text-blue-400 dark:sm:hover:text-white sm:hover:text-muted text-[1rem]"
                        >
                          {item}
                        </a>
                      {/each}
                    </div>
                  </div>
                  <div class="flex flex-col sm:flex-row">
                    <div class="mb-2 whitespace-nowrap font-semibold sm:mb-0">
                      Top Industries:
                    </div>
                    <div class="flex flex-wrap gap-x-2 gap-y-3 sm:ml-2">
                      {#each mainIndustries as item}
                        <a
                          href={`/list/industry/${item?.replace(/ /g, "-")?.replace(/&/g, "and")?.replace(/-{2,}/g, "-")?.toLowerCase()}`}
                          class="inline-block badge border-gray-300 dark:border-gray-800 rounded-[3px] bg-blue-100 dark:bg-primary duration-0 rounded-sm ml-1 px-3 m-auto text-blue-800 dark:text-blue-400 dark:sm:hover:text-white sm:hover:text-muted text-[1rem]"
                        >
                          {item}
                        </a>
                      {/each}
                    </div>
                  </div>
                </div>
              </div>
            {/if}

            <div class="items-center lg:overflow-visible px-1 py-1 mt-4">
              <div
                class="col-span-2 flex flex-col lg:flex-row items-start sm:items-center lg:order-2 lg:grow py-1 border-t border-b border-gray-300 dark:border-gray-800"
              >
                <h2
                  class="text-start whitespace-nowrap text-xl sm:text-2xl font-semibold py-1 border-b border-gray-300 dark:border-gray-800 lg:border-none w-full"
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
                      class=" py-[7px] text-[0.85rem] sm:text-sm border bg-white dark:bg-default shadow focus:outline-hidden border border-gray-300 dark:border-gray-600 rounded placeholder:text-gray-800 dark:placeholder:text-gray-300 px-3 focus:outline-none focus:ring-0 dark:focus:border-gray-800 grow w-full sm:min-w-56 lg:max-w-14"
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
              <div class="w-full overflow-x-auto">
                <table
                  class="mt-5 table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
                >
                  <!-- head -->
                  <thead class="text-white bg-default">
                    <tr class="">
                      <th
                        class="hidden lg:table-cell text-start text-sm font-semibold"
                      >
                      </th>
                      <th class="text-start text-sm font-semibold"> Symbol </th>
                      <th class="text-start text-sm font-semibold"> Name </th>
                      <th class="text-end text-sm font-semibold">
                        Transaction Type
                      </th>
                      <th class="text-end text-sm font-semibold"> Amount </th>
                      <th class="text-end text-sm font-semibold">
                        Transaction
                      </th>
                      <th class="text-end text-sm font-semibold">
                        Last Trade
                      </th>
                      <th class="text-end text-sm font-semibold"> Filed </th>
                    </tr>
                  </thead>
                  <tbody class="p-0">
                    {#each stockList as item, index}
                      <tr
                        class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
                      >
                        <td class="hidden lg:table-cell"
                          ><button
                            on:click={() => openGraph(item?.ticker)}
                            class="cursor-pointer h-full pl-2 pr-2 align-middle lg:pl-3"
                            ><svg
                              class="w-5 h-5 text-icon {(checkedSymbol ===
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
                          class="text-start text-sm sm:text-[1rem] whitespace-nowrap"
                        >
                          <HoverStockChart
                            symbol={item?.symbol ?? item?.ticker}
                            assetType={item?.assetType}
                          />
                        </td>

                        <td class="text-sm sm:text-[1rem] whitespace-nowrap">
                          {item?.name?.length > 20
                            ? item?.name?.slice(0, 20) + "..."
                            : item?.name}
                        </td>

                        <td
                          class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
                        >
                          <span class="">
                            {#if item?.type === "Bought"}
                              <span class="text-green-800 dark:text-[#00FC50]"
                                >Buy</span
                              >
                            {:else if item?.type === "Sold"}
                              <span class="text-red-800 dark:text-[#FF2F1F]"
                                >Sell</span
                              >
                            {:else if item?.type === "Exchange"}
                              <span class="text-orange-800 dark:text-[#C6A755]"
                                >Exchange</span
                              >
                            {/if}
                          </span></td
                        >

                        <td
                          class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
                        >
                          {item?.amount}</td
                        >

                        <td
                          class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
                        >
                          {item?.transaction?.toLocaleString("en-US")}</td
                        >

                        <td
                          class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
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
                          class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
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
                        <tr
                          ><td colspan="8" class="px-0" style=""
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
                    class="w-fit transition-all flex flex-row items-center duration-50 border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary flex flex-row justify-between items-center  sm:w-auto px-1.5 sm:px-3 rounded truncate"
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
                  <span class="text-sm sm:text-[1rem]">
                    Page {currentPage} of {totalPages}
                  </span>

                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild let:builder>
                      <Button
                        builders={[builder]}
                        class="w-fit transition-all duration-50 border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary  flex flex-row justify-between items-center  sm:w-auto px-2 sm:px-3 rounded truncate"
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
                      class="w-auto min-w-40  max-h-[400px] overflow-y-auto scroller relative"
                    >
                      <!-- Dropdown items -->
                      <DropdownMenu.Group class="pb-2">
                        {#each rowsPerPageOptions as item}
                          <DropdownMenu.Item
                            class="sm:hover:bg-gray-200 dark:sm:hover:bg-primary"
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
                    class="w-fit transition-all flex flex-row items-center duration-50 border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary flex flex-row justify-between items-center sm:w-auto px-1.5 sm:px-3 rounded truncate"
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
                  class=" cursor-pointer sm:hover:text-muted text-blue-800 dark:sm:hover:text-white dark:text-blue-400 text-sm sm:text-[1rem] font-medium"
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

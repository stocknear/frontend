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

  let columns = [
    { key: "symbol", label: "Symbol", align: "left" },
    { key: "name", label: "Name", align: "left" },
    { key: "price", label: "Price", align: "right" },
    { key: "changesPercentage", label: "Change", align: "right" },
    { key: "totalAssets", label: "Total Assets", align: "right" },
    { key: "numberOfHoldings", label: "Holdings", align: "right" },
    { key: "expenseRatio", label: "Expense Ratio", align: "right" },
  ];

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

  function generateStatementInfoHTML() {
    return `
     ${etfProviderName} has ${originalData?.length} ETFs listed with a total of ${abbreviateNumber(
       totalAssets,
     )}
      in assets under management. The funds have an average expense ratio of ${avgExpenseRatio?.toFixed(
        2,
      )}%.
    `;
  }

  let htmlOutput = generateStatementInfoHTML();
</script>

<SEO
  title={`${etfProviderName} ETFs - Complete Directory of ${originalData?.length || 0} Exchange-Traded Funds`}
  description={`Comprehensive analysis of all ${originalData?.length || 0} ${etfProviderName} ETFs with ${abbreviateNumber(totalAssets)} total AUM and ${avgExpenseRatio?.toFixed(2)}% average expense ratio. Compare fund performance, holdings, costs, and asset allocation across ${etfProviderName}'s complete ETF lineup for optimal portfolio construction.`}
  keywords={`${etfProviderName} ETFs, ${etfProviderName} funds, ${etfProviderName} expense ratios, ${etfProviderName} fund comparison, ETF provider analysis, fund lineup, ETF selection`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${etfProviderName} ETF Directory`,
    description: `Complete catalog of ${etfProviderName} exchange-traded funds`,
    url: `https://stocknear.com/etf/etf-providers/${data?.getProviderName}`,
    about: {
      "@type": "Organization",
      name: etfProviderName,
      description:
        "Investment management company providing exchange-traded funds",
    },
    mainEntity: {
      "@type": "ItemList",
      name: `${etfProviderName} ETFs`,
      description: `Exchange-traded funds managed by ${etfProviderName}`,
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

<section class="w-full overflow-hidden m-auto">
  {#if originalData?.length !== 0}
    <div class="mb-5 mt-5 sm:mt-0">
      <Infobox text={htmlOutput} />
    </div>
  {/if}

  <div
    class="shadow mb-4 flex flex-col divide-y divide-gray-300 dark:divide-gray-600 rounded border border-gray-300 dark:border-gray-600 sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0"
  >
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div class="text-[1rem] font-normal">Listed Funds</div>
        <div
          class="mt-1 break-words font-semibold leading-8 text-xl sm:text-2xl"
        >
          {originalData?.length}
        </div>
      </div>
    </div>
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div class="text-[1rem] font-normal">Total Assets</div>
        <div
          class="mt-1 break-words font-semibold leading-8 text-xl sm:text-2xl"
        >
          {abbreviateNumber(totalAssets)}
        </div>
      </div>
    </div>
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div class="text-[1rem] font-normal">Average Cost</div>
        <div
          class="mt-1 break-words font-semibold leading-8 text-xl sm:text-2xl"
        >
          {avgExpenseRatio?.toFixed(2)}%
        </div>
      </div>
    </div>
  </div>

  {#if originalData?.length !== 0}
    <div class="items-center lg:overflow-visible px-1 py-1 mt-4">
      <div
        class="col-span-2 flex flex-col lg:flex-row items-start sm:items-center lg:order-2 lg:grow py-1 border-t border-b border-gray-300 dark:border-gray-800"
      >
        <h2
          class="text-start whitespace-nowrap text-xl sm:text-2xl font-semibold py-1 border-b border-gray-300 dark:border-gray-800 lg:border-none w-full"
        >
          {originalData?.length?.toLocaleString("en-US")} ETFs from {etfProviderName}
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
              {rawData}
              title={`${data?.getProviderName}_etf_data`}
            />
          </div>
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
              class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
            >
              <thead>
                <TableHeader {columns} {sortOrders} {sortData} />
              </thead>
              <tbody>
                {#each etfProviderData as item, index}
                  <!-- row -->
                  <tr
                    class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
                  >
                    <td class=" text-sm sm:text-[1rem] whitespace-nowrap">
                      <HoverStockChart
                        symbol={item?.symbol}
                        assetType={"etf"}
                      />
                    </td>

                    <td class="text-sm sm:text-[1rem] whitespace-nowrap">
                      {item?.name?.length > charNumber
                        ? item?.name?.slice(0, charNumber) + "..."
                        : item?.name}
                    </td>

                    <td
                      class=" text-sm sm:text-[1rem] whitespace-nowrap text-end"
                    >
                      {item?.price}
                    </td>

                    <td
                      class=" text-sm sm:text-[1rem] whitespace-nowrap text-end"
                    >
                      {#if item?.changesPercentage >= 0}
                        <span class="text-green-800 dark:text-[#00FC50]"
                          >+{item?.changesPercentage >= 1000
                            ? abbreviateNumber(item?.changesPercentage)
                            : item?.changesPercentage?.toFixed(2)}%</span
                        >
                      {:else if item?.changesPercentage < 0}
                        <span class="text-red-800 dark:text-[#FF2F1F]"
                          >{item?.changesPercentage <= -1000
                            ? abbreviateNumber(item?.changesPercentage)
                            : item?.changesPercentage?.toFixed(2)}%
                        </span>
                      {:else}
                        -
                      {/if}
                    </td>

                    <td
                      class=" text-end text-sm sm:text-[1rem] whitespace-nowrap"
                    >
                      {abbreviateNumber(item?.totalAssets)}
                    </td>

                    <td
                      class=" text-end text-sm sm:text-[1rem] whitespace-nowrap"
                    >
                      {item?.numberOfHoldings}
                    </td>

                    <td
                      class=" text-end text-sm sm:text-[1rem] whitespace-nowrap"
                    >
                      {item?.expenseRatio}%
                    </td>
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
        {:else}
          <Infobox text={`No ETFs found for "${inputValue}"`} />
        {/if}
      </div>
    </div>
  {:else}
    <div
      class="mt-10 w-full flex justify-center items-center m-auto text-2xl font-bold text-gray-300"
    >
      No data Available
    </div>
  {/if}
</section>

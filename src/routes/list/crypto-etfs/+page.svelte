<script lang="ts">
  import { screenWidth } from "$lib/store";
  import { abbreviateNumber } from "$lib/utils";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import Pagination from "$lib/components/Table/Pagination.svelte";
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import { onMount } from "svelte";
  import { page } from "$app/stores";

  export let data;

  let originalData = data?.getData;
  let rawData = originalData;
  let displayList = [];
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
    displayList = dataSource?.slice(startIndex, endIndex) || [];
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

  const totalAssets = originalData?.reduce(
    (total, etf) => total + etf?.totalAssets,
    0,
  );
  const avgExpenseRatio =
    originalData?.reduce((total, item) => total + item?.expenseRatio || 0, 0) /
    originalData?.length;

  let columns = [
    { key: "rank", label: "Rank", align: "center" },
    { key: "symbol", label: "Symbol", align: "left" },
    { key: "name", label: "Name", align: "left" },
    { key: "price", label: "Price", align: "right" },
    { key: "changesPercentage", label: "% Change", align: "right" },
    { key: "expenseRatio", label: "Expense Ratio", align: "right" },
    { key: "totalAssets", label: "Assets", align: "right" },
  ];

  let sortOrders = {
    rank: { order: "none", type: "number" },
    symbol: { order: "none", type: "string" },
    name: { order: "none", type: "string" },
    price: { order: "none", type: "number" },
    changesPercentage: { order: "none", type: "number" },
    expenseRatio: { order: "none", type: "number" },
    totalAssets: { order: "none", type: "number" },
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

  $: charNumber = $screenWidth < 640 ? 15 : 40;
</script>

<SEO
  title="Crypto ETFs List - Complete Cryptocurrency ETF Directory "
  description="Comprehensive list of cryptocurrency ETFs trading on US stock exchanges. Compare Bitcoin, Ethereum, and blockchain ETFs with expense ratios, assets under management, and real-time performance. Track BITO, ETHE, BLOK and more crypto funds."
  keywords="crypto ETFs, cryptocurrency ETFs, crypto ETF list, bitcoin ETFs, ethereum ETFs, blockchain ETFs, crypto investment funds, cryptocurrency exchange traded funds, BITO ETF, ETHE ETF, BLOK ETF"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Crypto ETFs List",
    description:
      "Complete directory of cryptocurrency exchange-traded funds available on US stock exchanges",
    url: "https://stocknear.com/list/crypto-etfs",
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
          name: "Stock Lists",
          item: "https://stocknear.com/list",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Crypto ETFs",
          item: "https://stocknear.com/list/crypto-etfs",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Cryptocurrency ETF Directory",
      description:
        "List of cryptocurrency exchange-traded funds with performance metrics and expense ratios",
      numberOfItems: originalData?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text="Comprehensive list of cryptocurrency ETFs that are currently active. These exchange-traded funds provide exposure to Bitcoin, Ethereum, and the crypto industry generally."
  />

  <div
    class="mt-6 mb-4 grid grid-cols-1 sm:grid-cols-3 overflow-hidden rounded-xl border border-gray-300 shadow dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-950/40 divide-y divide-gray-200/70 dark:divide-zinc-800/80 sm:divide-x sm:divide-y-0"
  >
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div
          class="text-xs uppercase tracking-wide text-gray-400 dark:text-zinc-500"
        >
          Total ETFs
        </div>
        <div
          class="mt-1 break-words text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tabular-nums"
        >
          {new Intl.NumberFormat("en")?.format(originalData?.length)}
        </div>
      </div>
    </div>
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div
          class="text-xs uppercase tracking-wide text-gray-400 dark:text-zinc-500"
        >
          Total Assets
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
          class="text-xs uppercase tracking-wide text-gray-400 dark:text-zinc-500"
        >
          Avg. Cost
        </div>
        <div
          class="mt-1 break-words text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tabular-nums"
        >
          {avgExpenseRatio?.toFixed(2)}%
        </div>
      </div>
    </div>
  </div>

  <div class="items-center lg:overflow-visible px-1 py-1 mt-4">
    <div
      class="col-span-2 flex flex-col lg:flex-row items-start sm:items-center lg:order-2 lg:grow py-2 border-t border-b border-gray-200 dark:border-zinc-800/80"
    >
      <h2
        class="text-start whitespace-nowrap text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white py-1 border-b border-gray-200 dark:border-zinc-800/80 lg:border-none w-full"
      >
        {originalData?.length?.toLocaleString("en-US")} Crypto ETFs
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
            class="py-2 text-[0.85rem] sm:text-sm border border-gray-300 shadow dark:border-zinc-800/80 rounded-full bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 placeholder:text-gray-500 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80 grow w-full sm:min-w-56 lg:max-w-14"
          />
        </div>

        <div class="ml-2">
          <DownloadData {data} {rawData} title="crypto_etfs_data" />
        </div>
      </div>
    </div>
  </div>

  <!-- Page wrapper -->
  <div class="flex justify-center w-full m-auto h-full overflow-hidden">
    <!-- Content area -->
    <div class="w-full mt-3">
      {#if displayList?.length > 0}
        <div class="w-full overflow-x-auto">
          <table
            class="table table-sm table-compact w-full border border-gray-300 shadow dark:border-zinc-800/80 rounded-xl overflow-hidden bg-white/70 dark:bg-zinc-950/40 m-auto"
          >
            <thead>
              <TableHeader {columns} {sortOrders} {sortData} />
            </thead>
            <tbody>
              {#each displayList as item}
                <!-- row -->
                <tr
                  class="border-b border-gray-200 dark:border-zinc-800/80 hover:bg-gray-50/60 dark:hover:bg-zinc-900/50"
                >
                  <td
                    class="text-center text-sm font-semibold text-gray-700 dark:text-zinc-200 tabular-nums"
                  >
                    {item?.rank}
                  </td>

                  <td class="text-sm text-gray-700 dark:text-zinc-200">
                    <HoverStockChart symbol={item?.symbol} assetType="etf" />
                  </td>

                  <td
                    class="text-sm text-gray-600 dark:text-zinc-300 whitespace-nowrap"
                  >
                    {item?.name?.length > charNumber
                      ? item?.name?.slice(0, charNumber) + "..."
                      : item?.name}
                  </td>

                  <td
                    class="text-end text-sm text-gray-600 dark:text-zinc-300 tabular-nums"
                  >
                    {item?.price}
                  </td>

                  <td
                    class="text-end text-sm text-gray-600 dark:text-zinc-300 tabular-nums"
                  >
                    {#if item?.changesPercentage >= 0}
                      <span class="text-emerald-600 dark:text-emerald-400"
                        >+{item.changesPercentage?.toFixed(2)}%</span
                      >
                    {:else}
                      <span class="text-rose-600 dark:text-rose-400"
                        >{item.changesPercentage?.toFixed(2)}%
                      </span>
                    {/if}
                  </td>

                  <td
                    class="text-end text-sm text-gray-600 dark:text-zinc-300 tabular-nums"
                  >
                    {item?.expenseRatio}%
                  </td>

                  <td
                    class="text-end text-sm text-gray-600 dark:text-zinc-300 whitespace-nowrap tabular-nums"
                  >
                    {abbreviateNumber(item?.totalAssets)}
                  </td>
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
        <Infobox text={`No crypto ETFs found for "${inputValue}"`} />
      {/if}
    </div>
  </div>
</section>

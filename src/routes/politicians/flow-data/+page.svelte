<script lang="ts">
  import { formatString } from "$lib/utils";
  import { screenWidth } from "$lib/store";
  import { onMount } from "svelte";
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";
  //import UpgradeToPro from '$lib/components/UpgradeToPro.svelte';
  import ArrowLogo from "lucide-svelte/icons/move-up-right";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { page } from "$app/stores";

  import SEO from "$lib/components/SEO.svelte";

  export let data;
  let inputValue = "";
  let searchWorker: Worker | undefined;

  let originalData = data?.getPoliticianRSS;
  let rawData = originalData;
  let stockList = [];

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

  // Note: We don't use a reactive statement here because we manually call updatePaginatedData()
  // in our sorting, searching, and pagination functions to have better control over when it runs

  // Reactive statement to load pagination settings when page changes
  $: if ($page?.url?.pathname && $page?.url?.pathname !== pagePathName) {
    pagePathName = $page?.url?.pathname;
    loadRowsPerPage(); // Load pagination preference for new page
    updatePaginatedData(); // Update display with loaded preference
  }

  function getAbbreviatedName(fullName) {
    if (fullName === null) {
      return "-";
    }

    const names = fullName?.split(" ");
    let firstName = names[0];
    // Remove any title prefix (e.g. Dr., Mr., Mrs., Ms.)
    if (names.length > 1 && /^(Dr|Mr|Mrs|Ms)\.?$/i.test(names[0])) {
      firstName = names[1];
      names?.splice(0, 1);
    }
    const initials = names
      ?.slice(0, -1)
      ?.map((name) => name?.charAt(0))
      ?.join(". ");
    const lastName = names[names?.length - 1];
    return `${firstName?.charAt(0)}. ${lastName}`;
  }

  let columns = [
    { key: "representative", label: "Person", align: "left" },
    { key: "party", label: "Party", align: "right" },
    { key: "ticker", label: "Symbol", align: "right" },
    { key: "assetDescription", label: "Name", align: "right" },
    { key: "disclosureDate", label: "Filing Date", align: "right" },
    { key: "amount", label: "Amount", align: "right" },
    { key: "type", label: "Type", align: "right" },
  ];

  let sortOrders = {
    representative: { order: "none", type: "string" },
    party: { order: "none", type: "string" },
    ticker: { order: "none", type: "string" },
    assetDescription: { order: "none", type: "string" },
    disclosureDate: { order: "none", type: "date" },
    amount: { order: "none", type: "string" },
    type: { order: "none", type: "string" },
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
        // If filtering, keep the filtered rawData but reset to unsorted state
        // We need to re-run the search to get the original filtered order
        search();
      } else {
        // Reset to original unsorted state
        originalData = data?.getPoliticianRSS || [];
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
          valueA = a[key]?.toUpperCase() || "";
          valueB = b[key]?.toUpperCase() || "";
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

    // Force a re-render by triggering the sortOrders reactivity
    sortOrders = { ...sortOrders };

    currentPage = 1; // Reset to first page when sorting
    updatePaginatedData(); // Update the displayed data
  };

  $: charNumber = $screenWidth < 640 ? 20 : 30;
</script>

<SEO
  title="Latest
    Congressional Trading"
  description="Find the latest congress trading and see what insiders who have access to regulations are investing."
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3"
>
  <div class="text-sm sm:text-[1rem] breadcrumbs">
    <ul>
      <li><a href="/" class="text-muted dark:text-gray-300">Home</a></li>
      <li class="text-muted dark:text-gray-300">Congress Flow</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:w-3/4 lg:pr-5">
          <div class=" border-[#2C6288] dark:border-white border-b-[2px]">
            <h1 class="mb-1 text-2xl sm:text-3xl font-bold">
              Latest Trades of Politicians
            </h1>
          </div>

          <p class="mt-4">
            Overview of the latest congressional trading activity. The buy-sell
            ratio shows
            <strong
              >{(() => {
                // Use originalData for stats to show full dataset metrics
                const buys =
                  originalData?.filter((item) => item?.type === "Bought")
                    ?.length || 0;
                const sells =
                  originalData?.filter((item) => item?.type === "Sold")
                    ?.length || 0;
                const total = buys + sells;
                return total > 0
                  ? `${((buys / total) * 100).toFixed(1)}% buys`
                  : "n/a";
              })()}</strong
            >
            versus
            <strong
              >{(() => {
                const buys =
                  originalData?.filter((item) => item?.type === "Bought")
                    ?.length || 0;
                const sells =
                  originalData?.filter((item) => item?.type === "Sold")
                    ?.length || 0;
                const total = buys + sells;
                return total > 0
                  ? `${((sells / total) * 100).toFixed(1)}% sells`
                  : "n/a";
              })()}</strong
            >
            among recent filings. The most active party is
            <strong
              >{(() => {
                const partyCount = {};
                originalData?.forEach((item) => {
                  if (item?.party) {
                    partyCount[item.party] = (partyCount[item.party] || 0) + 1;
                  }
                });
                const mostActive = Object.entries(partyCount).sort(
                  ([, a], [, b]) => b - a,
                )[0];
                return mostActive ? mostActive[0] : "n/a";
              })()}</strong
            >
            with
            <strong
              >{(() => {
                const partyCount = {};
                originalData?.forEach((item) => {
                  if (item?.party) {
                    partyCount[item.party] = (partyCount[item.party] || 0) + 1;
                  }
                });
                const mostActive = Object.entries(partyCount).sort(
                  ([, a], [, b]) => b - a,
                )[0];
                return mostActive ? mostActive[1] : "0";
              })()}</strong
            >
            transactions, indicating
            <strong
              >{(() => {
                const buys =
                  originalData?.filter((item) => item?.type === "Bought")
                    ?.length || 0;
                const sells =
                  originalData?.filter((item) => item?.type === "Sold")
                    ?.length || 0;
                if (buys > sells) return "bullish";
                if (sells > buys) return "bearish";
                return "neutral";
              })()}</strong
            >
            sentiment among congressional members.
          </p>

          <body class="w-full overflow-hidden m-auto">
            <section class="w-full overflow-hidden m-auto mt-3">
              <div class=" flex justify-center w-full m-auto overflow-hidden">
                <div
                  class="relative flex justify-center items-center overflow-hidden w-full"
                >
                  <main class="w-full">
                    <div class="items-center lg:overflow-visible px-1 py-1">
                      <div
                        class="col-span-2 flex flex-col lg:flex-row items-start sm:items-center lg:order-2 lg:grow py-1 border-t border-b border-gray-300 dark:border-gray-800"
                      >
                        <h2
                          class="text-start whitespace-nowrap text-xl sm:text-2xl font-semibold py-1 border-b border-gray-300 dark:border-gray-800 lg:border-none w-full"
                        >
                          {originalData?.length?.toLocaleString("en-US")} Congressional
                          Trades
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
                              title={"congress_flow_data"}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="w-full m-auto mt-2">
                      <div
                        class="w-full m-auto rounded-none sm:rounded mb-4 overflow-x-auto sm:overflow-hidden"
                      >
                        {#if stockList?.length > 0}
                          <table
                            class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
                          >
                            <thead>
                              <TableHeader {columns} {sortOrders} {sortData} />
                            </thead>
                            <tbody>
                              {#each stockList as item}
                                <tr
                                  class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
                                >
                                  <td
                                    class="text-start text-sm sm:text-[1rem] whitespace-nowrap"
                                  >
                                    <a
                                      href={`/politicians/${item?.id}`}
                                      class="text-blue-800 sm:hover:text-muted dark:sm:hover:text-white dark:text-blue-400"
                                      >{getAbbreviatedName(
                                        item?.representative?.replace("_", " "),
                                      )}</a
                                    >
                                  </td>
                                  <td
                                    class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
                                  >
                                    {item?.party}
                                  </td>

                                  <td
                                    class="text-end whitespace-nowrap text-sm sm:text-[1rem]"
                                  >
                                    <HoverStockChart
                                      symbol={item?.ticker}
                                      assetType={item?.assetType}
                                    />
                                  </td>
                                  <td
                                    class="text-end whitespace-nowrap text-sm sm:text-[1rem]"
                                  >
                                    <span class=""
                                      >{item?.assetDescription.length >
                                      charNumber
                                        ? formatString(
                                            item?.assetDescription.slice(
                                              0,
                                              charNumber,
                                            ),
                                          ) + "..."
                                        : formatString(item?.assetDescription)
                                            ?.replace("- Common Stock", "")
                                            ?.replace("Common Stock", "")}</span
                                    >
                                  </td>

                                  <td
                                    class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
                                  >
                                    {new Date(
                                      item?.disclosureDate,
                                    )?.toLocaleString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      daySuffix: "2-digit",
                                    })}
                                  </td>

                                  <td
                                    class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
                                  >
                                    {item?.amount?.replace(
                                      "$1,000,001 - $5,000,000",
                                      "$1Mio - $5Mio",
                                    )}
                                  </td>
                                  <td class="text-sm sm:text-[1rem] text-end">
                                    {#if item?.type === "Bought"}
                                      <span
                                        class="text-green-800 dark:text-[#00FC50]"
                                        >Bought</span
                                      >
                                    {:else if item?.type === "Sold"}
                                      <span
                                        class="text-red-800 dark:text-[#FF2F1F]"
                                        >Sold</span
                                      >
                                    {/if}
                                  </td>
                                </tr>
                              {/each}
                            </tbody>
                          </table>
                        {:else}
                          <Infobox
                            text={`No Stocks found for "${inputValue}"`}
                          />
                        {/if}
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
                              <span class="hidden sm:inline">Previous</span
                              ></Button
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
                                  <span
                                    class="truncate text-[0.85rem] sm:text-sm"
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

                      <!--<InfiniteLoading on:infinite={infiniteHandler} />-->

                      <!--<UpgradeToPro data={data} title="Track the latest trades of corrupt US Politicians"/>-->
                    </div>
                  </main>
                </div>
              </div>
            </section>
          </body>
        </main>

        <aside class="hidden lg:block relative fixed w-1/4 ml-4">
          {#if !["Pro", "Plus"]?.includes(data?.user?.tier)}
            <div
              class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
            >
              <a
                href={"/pricing"}
                class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
              >
                <div class="w-full flex justify-between items-center p-3 mt-3">
                  <h2 class="text-start text-xl font-bold ml-3">
                    Pro Subscription
                  </h2>
                  <ArrowLogo
                    class="w-8 h-8 mr-3 shrink-0 text-gray-400 dark:"
                  />
                </div>
                <span class="p-3 ml-3 mr-3">
                  Upgrade now for unlimited access to all data, tools and no
                  ads.
                </span>
              </a>
            </div>
          {/if}

          <div
            class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
          >
            <a
              href={"/politicians"}
              class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-xl font-bold ml-3">
                  All Congress Members
                </h2>
                <ArrowLogo class="w-8 h-8 mr-3 shrink-0 text-gray-400 " />
              </div>
              <span class="p-3 ml-3 mr-3">
                Get detailed reports on all Congress member trading activity.
              </span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
</section>

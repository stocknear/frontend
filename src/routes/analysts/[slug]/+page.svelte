<script lang="ts">
  import { screenWidth } from "$lib/store";
  import { sectorNavigation } from "$lib/utils";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import { onMount } from "svelte";
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";
  import RatingsChart from "$lib/components/RatingsChart.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { page } from "$app/stores";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";

  export let data;

  let analystStats = data?.getData;

  let rawData = processTickerData(data?.getData?.ratingsList);
  let originalData = [...rawData]; // Unaltered copy of raw data
  let unsortedData = [...rawData]; // Preserve truly original unsorted order
  let unsortedSearchData = []; // Preserve unsorted search results

  let stockList = [];

  let inputValue = "";
  let searchWorker: Worker | undefined;

  // Pagination state
  let currentPage = 1;
  let rowsPerPage = 20;
  let rowsPerPageOptions = [20, 50, 100];
  let totalPages = 1;

  let pagePathName = $page?.url?.pathname;

  let analystScore = analystStats?.analystScore;
  let rank = analystStats?.rank;
  let analystName = analystStats?.analystName ?? "n/a";
  let companyName = analystStats?.companyName;
  let totalRatings = analystStats?.totalRatings;
  let successRate = analystStats?.successRate;
  let avgReturn = analystStats?.avgReturn;
  let numOfAnalysts = new Intl.NumberFormat("en", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(analystStats?.numOfAnalysts);

  function processTickerData(data) {
    const tickerMap = new Map();

    data?.forEach((item) => {
      const { ticker } = item;

      if (!ticker) return; // Skip if ticker is not defined

      if (!tickerMap.has(ticker)) {
        // Add the item and initialize count
        tickerMap.set(ticker, { ...item, ratings: 1 });
      } else {
        const existing = tickerMap.get(ticker);

        // Increment the ratings count
        existing.ratings += 1;

        // Keep the item with the latest date
        if (new Date(item.date) > new Date(existing.date)) {
          tickerMap.set(ticker, { ...item, ratings: existing.ratings });
        }
      }
    });

    // Convert the Map back to an array
    return Array.from(tickerMap.values());
  }

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
    unsortedSearchData = []; // Clear search results
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
        unsortedSearchData = []; // Clear search results
        currentPage = 1; // Reset to first page
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
      unsortedSearchData = [...rawData]; // Preserve unsorted search results
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

  $: checkedSymbol = "";
  function openGraph(symbol) {
    // Clear all existing symbols
    if (checkedSymbol === symbol) {
      checkedSymbol = "";
    } else {
      checkedSymbol = symbol;
    }
  }
  $: charNumber = $screenWidth < 640 ? 20 : 40;

  $: columns = [
    ...($screenWidth > 1024
      ? [{ key: "chart", label: "", align: "right" }]
      : []),
    { key: "ticker", label: "Symbol", align: "left" },
    { key: "name", label: "Name", align: "left" },
    { key: "rating_current", label: "Action", align: "left" },
    { key: "adjusted_pt_current", label: "Price Target", align: "right" },
    { key: "price", label: "Current", align: "right" },
    { key: "upside", label: "% Upside", align: "right" },
    { key: "ratings", label: "Ratings", align: "right" },
    { key: "date", label: "Updated", align: "right" },
  ];

  $: sortOrders = {
    chart: { order: "none", type: "string" },
    ticker: { order: "none", type: "string" },
    name: { order: "none", type: "string" },
    rating_current: { order: "none", type: "string" },
    adjusted_pt_current: { order: "none", type: "number" },
    marketCap: { order: "none", type: "number" },
    price: { order: "none", type: "number" },
    upside: { order: "none", type: "number" },
    ratings: { order: "none", type: "number" },
    date: { order: "none", type: "date" },
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

    const dataSource = inputValue?.length > 0 ? rawData : originalData;

    // Reset to original data when 'none' and stop further sorting
    if (sortOrder === "none") {
      if (inputValue?.length > 0) {
        rawData = [...unsortedSearchData]; // Restore from unsorted search results
      } else {
        originalData = [...unsortedData]; // Restore from truly original unsorted data
      }
      currentPage = 1;
      updatePaginatedData();
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

    // Sort using the generic comparison function
    const sortedData = [...dataSource].sort(compareValues);
    if (inputValue?.length > 0) {
      rawData = sortedData;
    } else {
      originalData = sortedData;
    }
    currentPage = 1;
    updatePaginatedData();
  };

  // Update pagination when rawData changes
  $: if (rawData && rawData.length >= 0) {
    updatePaginatedData();
  }

  // Reactive statement to load pagination settings when page changes
  $: if ($page?.url?.pathname && $page?.url?.pathname !== pagePathName) {
    pagePathName = $page?.url?.pathname;
    loadRowsPerPage(); // Load pagination preference for new page
    updatePaginatedData(); // Update display with loaded preference
  }
</script>

<SEO
  title="{analystName} Stock Analyst Profile - {companyName} Research Coverage"
  description="Detailed profile of {analystName}, equity research analyst at {companyName}. Track their stock ratings, price targets, success rate of {successRate}%, and average return of {avgReturn}% across {totalRatings} stock recommendations."
  keywords="{analystName?.toLowerCase()}, {companyName?.toLowerCase()} analyst, {analystName?.toLowerCase()} stock picks, equity research analyst, stock analyst ratings, {companyName?.toLowerCase()} research, analyst price targets, Wall Street analyst profile"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "Person",
    name: analystName,
    jobTitle: "Stock Analyst",
    worksFor: {
      "@type": "Organization",
      name: companyName,
    },
    description:
      "Wall Street equity research analyst specializing in stock analysis and recommendations",
    url: "https://stocknear.com/analysts/{data?.getData?.analystId}",
    hasCredential: {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "Financial Analysis",
    },
    knowsAbout: data?.getData?.mainSectors || [],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: analystScore,
      bestRating: 5,
      worstRating: 1,
    },
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-6 px-4 lg:px-6 text-gray-700 dark:text-zinc-200"
>
  <BreadCrumb
    containerClass="text-xs sm:text-sm breadcrumbs text-gray-500 dark:text-zinc-400"
  >
    <li>
      <a
        href="/"
        class="text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400"
        >Home</a
      >
    </li>
    <li>
      <a
        href="/analysts"
        class="text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400"
        >Analyst</a
      >
    </li>

    <li class="text-gray-500 dark:text-zinc-400">
      {analystName ?? "n/a"}
    </li>
  </BreadCrumb>

  <div class="w-full overflow-hidden m-auto">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class="w-full m-auto mt-12">
            <div class="items-center justify-between lg:flex">
              <div
                class="flex space-x-3 border-b border-gray-300 dark:border-zinc-700 pb-3 lg:border-none lg:pb-0"
              >
                <div class="shrink-0">
                  <svg
                    class="h-16 w-16 sm:h-20 sm:w-20 text-gray-400 dark:text-zinc-300"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    style="max-width:100px"
                    ><path
                      fill-rule="evenodd"
                      d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                      clip-rule="evenodd"
                    ></path></svg
                  >
                </div>
                <div class="mt-0 pt-0.5 text-left">
                  <h1
                    class="mb-0 text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
                  >
                    {analystName ?? "n/a"}
                  </h1>
                  <p
                    class="mb-0.5 text-sm font-medium text-gray-800 dark:text-zinc-300"
                  >
                    Stock Analyst at {companyName ?? "n/a"}
                  </p>
                  <div class="inline-flex items-center">
                    <div class="flex flex-row items-center">
                      {#each Array.from({ length: 5 }) as _, i}
                        {#if i < Math?.floor(analystScore)}
                          <svg
                            class="w-5 h-5 text-amber-400"
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
                            class="w-5 h-5 text-gray-300 dark:text-zinc-600"
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
                    </div>
                    <span class="ml-1 text-sm text-gray-500 dark:text-zinc-400"
                      >({analystScore ?? "n/a"})</span
                    >
                  </div>
                </div>
              </div>
              <div
                class="mt-4 grid grid-cols-2 overflow-hidden rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/60 dark:bg-zinc-950/40 py-2 text-center md:grid-cols-4 md:p-0 lg:mt-0"
              >
                <div class="flex flex-col px-4 py-2 bp:px-6 md:py-6">
                  <div
                    class="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white tabular-nums"
                  >
                    # {rank ?? "n/a"}
                  </div>
                  <div
                    class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
                  >
                    Out of {numOfAnalysts ?? "n/a"} analysts
                  </div>
                </div>
                <div
                  class="flex flex-col px-4 py-2 bp:px-6 sm:border-l border-gray-200 dark:sm:border-zinc-800/80 md:py-6"
                >
                  <div
                    class="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white tabular-nums"
                  >
                    {totalRatings ?? "n/a"}
                  </div>
                  <div
                    class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
                  >
                    Total ratings
                  </div>
                </div>
                <div
                  class="flex flex-col px-4 py-2 bp:px-6 sm:border-l border-gray-200 dark:sm:border-zinc-800/80 md:py-6"
                >
                  <div
                    class="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white tabular-nums"
                  >
                    {#if ["Plus", "Pro"]?.includes(data?.user?.tier)}
                      <span
                        class={successRate >= 0 && successRate !== undefined
                          ? "before:content-['+'] text-emerald-600 dark:text-emerald-400"
                          : successRate < 0 && successRate !== undefined
                            ? "text-rose-600 dark:text-rose-400"
                            : ""}
                        >{successRate !== undefined
                          ? successRate?.toFixed(2) + "%"
                          : "n/a"}</span
                      >
                    {:else}
                      <a href="/pricing" class="flex justify-center mb-2">
                        <svg
                          class="size-6 text-gray-400 dark:text-zinc-300"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          style="max-width: 40px;"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clip-rule="evenodd"
                          >
                          </path>
                        </svg>
                      </a>
                    {/if}
                  </div>
                  <div
                    class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
                  >
                    Success rate
                  </div>
                </div>
                <div
                  class="flex flex-col px-4 py-2 bp:px-6 sm:border-l border-gray-200 dark:sm:border-zinc-800/80 md:py-6"
                >
                  <div
                    class="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white tabular-nums"
                  >
                    {#if ["Plus", "Pro"]?.includes(data?.user?.tier)}
                      <span
                        class={avgReturn >= 0 && avgReturn !== undefined
                          ? "before:content-['+'] text-emerald-600 dark:text-emerald-400"
                          : avgReturn < 0 && avgReturn !== undefined
                            ? "text-rose-600 dark:text-rose-400"
                            : ""}
                        >{avgReturn !== undefined
                          ? avgReturn?.toFixed(2) + "%"
                          : "n/a"}</span
                      >
                    {:else}
                      <a href="/pricing" class="flex justify-center mb-2">
                        <svg
                          class="size-6 text-gray-400 dark:text-zinc-300"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          style="max-width: 40px;"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clip-rule="evenodd"
                          >
                          </path>
                        </svg>
                      </a>
                    {/if}
                  </div>
                  <div
                    class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
                  >
                    Average return
                  </div>
                </div>
              </div>
            </div>

            {#if data?.getData?.mainSectors?.length > 0}
              <div class="mb-10 mt-10">
                <div
                  class="relative my-3 space-y-2 rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/60 dark:bg-zinc-950/40 sm:my-6 p-4"
                >
                  <div
                    class="flex flex-col sm:flex-row items-start sm:items-center"
                  >
                    <div
                      class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-300 sm:mb-0 sm:mr-2 text-center sm:text-left"
                    >
                      Main Sectors:
                    </div>
                    <div
                      class="flex flex-wrap items-center gap-x-2 gap-y-3 justify-start sm:justify-center"
                    >
                      {#each data?.getData?.mainSectors as item}
                        <a
                          href={sectorNavigation?.find(
                            (listItem) => listItem?.title === item,
                          )?.link}
                          class="inline-flex items-center rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/50 px-3 py-1 text-xs font-semibold sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                        >
                          {item}
                        </a>
                      {/each}
                    </div>
                  </div>
                  <div
                    class="pt-2 sm:pt-0 flex flex-col sm:flex-row items-start sm:items-center"
                  >
                    <div
                      class="mb-2 whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-300 sm:mb-0 sm:mr-2 text-center sm:text-left"
                    >
                      Top Industries:
                    </div>
                    <div
                      class="flex flex-wrap items-center gap-x-2 gap-y-3 justify-start sm:justify-center"
                    >
                      {#each data?.getData?.mainIndustries as item}
                        <a
                          href={`/list/industry/${item?.replace(/ /g, "-")?.replace(/&/g, "and")?.replace(/-{2,}/g, "-")?.toLowerCase()}`}
                          class="inline-flex items-center rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/50 px-3 py-1 text-xs font-semibold sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
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
                class="col-span-2 flex flex-col lg:flex-row items-start sm:items-center lg:order-2 lg:grow py-1 border-t border-b border-gray-300 dark:border-zinc-700"
              >
                <h2
                  class="text-start whitespace-nowrap text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white py-1 border-b border-gray-300 dark:border-zinc-700 lg:border-none w-full"
                >
                  {rawData?.length?.toLocaleString("en-US")} Stocks
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
                      class="py-2 text-[0.85rem] sm:text-sm border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 rounded-full text-gray-700 dark:text-zinc-200 placeholder:text-gray-500 dark:placeholder:text-zinc-400 px-3 focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80 grow w-full sm:min-w-56 lg:max-w-14"
                    />
                  </div>

                  <div class="ml-2">
                    <DownloadData
                      {data}
                      {rawData}
                      title={`${analystName}_ratings`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {#if stockList?.length > 0}
              <!-- Mobile Card View (only show when screenWidth is set and < 640) -->
              {#if $screenWidth > 0 && $screenWidth < 640}
                <div class="mt-4 mb-4 space-y-3">
                  {#each stockList as item, index}
                    <div
                      class="rounded-2xl border border-gray-300 dark:border-zinc-700 overflow-hidden"
                    >
                      <!-- Header -->
                      <div
                        class="flex items-start justify-between px-4 pt-4 pb-3"
                      >
                        <div class="min-w-0 flex-1">
                          <HoverStockChart symbol={item?.ticker} />
                          <p
                            class="mt-0.5 text-[13px] text-gray-800 dark:text-zinc-300 truncate"
                          >
                            {item?.name?.length > 28
                              ? item?.name?.slice(0, 28) + "..."
                              : item?.name}
                          </p>
                        </div>
                        <span
                          class="ml-3 text-[13px] tabular-nums text-gray-800 dark:text-zinc-300 whitespace-nowrap"
                        >
                          {new Date(item?.date)?.toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <!-- Details -->
                      <div class="flex items-end justify-between px-4 pb-4">
                        <div class="space-y-1">
                          <div class="flex items-center gap-1.5 text-[13px]">
                            <span class="text-gray-600 dark:text-zinc-400"
                              >{item?.action_company}:</span
                            >
                            <span class="font-medium text-gray-800 dark:text-zinc-200"
                              >{item?.rating_current}</span
                            >
                          </div>
                          <p
                            class="text-[13px] text-gray-600 dark:text-zinc-400"
                          >
                            <span
                              class="uppercase text-[10px] tracking-wide text-gray-600 dark:text-zinc-400 mr-1"
                              >PT</span
                            >
                            {#if Math?.ceil(item?.adjusted_pt_prior) !== 0}
                              <span class="text-gray-500 dark:text-zinc-400"
                                >{Math?.ceil(item?.adjusted_pt_prior)}</span
                              >
                              <span class="mx-1">→</span>
                              <span class="font-medium tabular-nums text-gray-800 dark:text-zinc-200"
                                >${Math?.ceil(item?.adjusted_pt_current)}</span
                              >
                            {:else if Math?.ceil(item?.adjusted_pt_current) !== 0}
                              <span class="font-medium tabular-nums text-gray-800 dark:text-zinc-200"
                                >${Math?.ceil(item?.adjusted_pt_current)}</span
                              >
                            {:else}
                              <span class="text-gray-500 dark:text-zinc-400">n/a</span>
                            {/if}
                          </p>
                        </div>
                        <div class="text-right">
                          <p class="text-[13px] text-gray-600 dark:text-zinc-400 mb-0.5">
                            <span class="uppercase text-[10px] tracking-wide mr-1">Current</span>
                            <span class="tabular-nums text-gray-800 dark:text-zinc-200"
                              >{item?.price !== null ? "$" + item?.price : "n/a"}</span
                            >
                          </p>
                          <p class="text-[13px]">
                            <span class="uppercase text-[10px] tracking-wide text-gray-600 dark:text-zinc-400 mr-1">Upside</span>
                            <span
                              class="font-medium tabular-nums {item?.upside >= 0 && item?.upside !== null
                                ? 'text-emerald-600 dark:text-emerald-500'
                                : item?.upside < 0 && item?.upside !== null
                                  ? 'text-rose-600 dark:text-rose-500'
                                  : 'text-gray-500 dark:text-zinc-400'}"
                            >
                              {item?.upside !== null
                                ? (item?.upside >= 0 ? "+" : "") + item?.upside + "%"
                                : "n/a"}
                            </span>
                          </p>
                        </div>
                      </div>

                      <!-- Expand Button -->
                      <button
                        on:click={() => openGraph(item?.ticker)}
                        class="flex w-full items-center justify-between border-t border-gray-300 dark:border-zinc-700 px-4 py-3 text-[13px] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                      >
                        <span>{item?.ratings} Rating{item?.ratings > 1 ? "s" : ""}</span>
                        <div class="flex items-center gap-1">
                          <span>View Chart</span>
                          <svg
                            class="h-4 w-4 transition-transform {checkedSymbol === item?.ticker
                              ? 'rotate-180'
                              : ''}"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clip-rule="evenodd"
                            />
                          </svg>
                        </div>
                      </button>

                      <!-- Chart -->
                      {#if checkedSymbol === item?.ticker}
                        <div
                          class="border-t border-gray-300 dark:border-zinc-700 pb-3"
                        >
                          <div class="relative h-[300px]">
                            <div class="absolute inset-x-0 top-0">
                              <div class="h-[300px] w-full overflow-hidden">
                                <div
                                  class="relative"
                                  style="height: 0; z-index: 1;"
                                >
                                  <RatingsChart
                                    ratingsList={data?.getData?.ratingsList?.map(
                                      (ratingItem) => ({
                                        ...ratingItem,
                                        type: ratingItem?.rating_current,
                                      }),
                                    )}
                                    symbol={item?.ticker}
                                    numOfRatings={item?.ratings}
                                    {data}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              {:else}
                <!-- Desktop Table View -->
                <div class="w-full m-auto mt-4">
                  <div
                    class="w-full m-auto rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 mb-4 overflow-x-auto"
                  >
                    <table
                      class="table table-sm table-compact w-full m-auto mt-0 text-gray-700 dark:text-zinc-200 tabular-nums"
                    >
                      <thead>
                        <TableHeader {columns} {sortOrders} {sortData} />
                      </thead>
                      <tbody
                        class="divide-y divide-gray-200/70 dark:divide-zinc-800/80"
                      >
                        {#each stockList as item, index}
                          <tr
                            class="transition-colors hover:bg-gray-50/60 dark:hover:bg-zinc-900/50"
                          >
                            <td class="hidden lg:table-cell"
                              ><button
                                on:click={() => openGraph(item?.ticker)}
                                class="cursor-pointer h-full pl-2 pr-2 align-middle lg:pl-3"
                                ><svg
                                  class="w-5 h-5 text-gray-800 dark:text-zinc-300 {checkedSymbol ===
                                  item?.ticker
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
                              class="text-[0.85rem] sm:text-sm text-start whitespace-nowrap text-gray-700 dark:text-zinc-200"
                            >
                              <HoverStockChart symbol={item?.ticker} />
                            </td>

                            <td
                              class="text-[0.85rem] sm:text-sm text-start whitespace-nowrap text-gray-700 dark:text-zinc-200"
                            >
                              {item?.name?.length > charNumber
                                ? item?.name?.slice(0, charNumber) + "..."
                                : item?.name}
                            </td>
                            <td
                              class="text-[0.85rem] sm:text-sm text-start whitespace-nowrap text-gray-700 dark:text-zinc-200"
                            >
                              <div class="flex flex-col sm:flex-row items-start">
                                <span class="mr-1">{item?.action_company}:</span>
                                <span>
                                  {item?.rating_current}
                                </span>
                              </div>
                            </td>

                            <td
                              class="text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-700 dark:text-zinc-200"
                            >
                              <div class="flex flex-row items-center justify-end">
                                {#if Math?.ceil(item?.adjusted_pt_prior) !== 0}
                                  <span
                                    class="text-gray-500 dark:text-zinc-400 font-normal"
                                    >{Math?.ceil(item?.adjusted_pt_prior)}</span
                                  >
                                  <svg
                                    class="w-3 h-3 ml-1 mr-1 inline-block"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    ><path
                                      fill="none"
                                      stroke="currentColor"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                      stroke-width="1.5"
                                      d="M4 12h16m0 0l-6-6m6 6l-6 6"
                                    /></svg
                                  >
                                  <span class="font-semibold"
                                    >{Math?.ceil(item?.adjusted_pt_current)}</span
                                  >
                                {:else if Math?.ceil(item?.adjusted_pt_current) !== 0}
                                  <span class="font-semibold"
                                    >{Math?.ceil(item?.adjusted_pt_current)}</span
                                  >
                                {:else}
                                  n/a
                                {/if}
                              </div>
                            </td>

                            <td
                              class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-700 dark:text-zinc-200"
                            >
                              {item?.price !== null ? item?.price : "n/a"}
                            </td>

                            <td
                              class="{item?.upside >= 0 && item?.upside !== null
                                ? "before:content-['+'] text-emerald-600 dark:text-emerald-400"
                                : item?.upside < 0 && item?.upside !== null
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : ''} text-end text-[0.85rem] sm:text-sm whitespace-nowrap"
                            >
                              {item?.upside !== null ? item?.upside + "%" : "n/a"}
                            </td>

                            <td
                              class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-700 dark:text-zinc-200"
                            >
                              {item?.ratings !== null ? item?.ratings : "n/a"}
                            </td>

                            <td
                              class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300"
                            >
                              {new Date(item?.date).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                daySuffix: "2-digit",
                              })}
                            </td>
                          </tr>
                          {#if checkedSymbol === item?.ticker}
                            <tr class="bg-white/80 dark:bg-zinc-950/60"
                              ><td colspan="9" class="px-0"
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
                                            ratingsList={data?.getData?.ratingsList?.map(
                                              (ratingItem) => ({
                                                ...ratingItem,
                                                type: ratingItem?.rating_current,
                                              }),
                                            )}
                                            symbol={item?.ticker}
                                            numOfRatings={item?.ratings}
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
                </div>
              {/if}

              <!-- Pagination controls -->
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
                        class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
                    class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
                  class="cursor-pointer text-sm font-medium text-gray-800 dark:text-zinc-300 transition hover:text-violet-600 dark:hover:text-violet-400"
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
</style>

<script lang="ts">
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { page } from "$app/stores";
  import { browser } from "$app/environment";

  import { abbreviateNumber, formatString } from "$lib/utils";
  import { onMount } from "svelte";
  import SEO from "$lib/components/SEO.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import Infobox from "$lib/components/Infobox.svelte";

  export let data;

  const DEFAULT_ROWS_PER_PAGE = 20;

  let tableData = data?.getData?.items ?? [];
  let totalItems = data?.getData?.total ?? 0;
  let currentPage = data?.getData?.page ?? 1;
  let rowsPerPage = data?.getData?.pageSize ?? DEFAULT_ROWS_PER_PAGE;
  let inputValue = data?.getData?.search ?? "";
  let totalPages = Math.max(
    1,
    Math.ceil((totalItems || 0) / (rowsPerPage || 1)),
  );
  let isLoading = false;
  let requestId = 0;

  let pagePathName = $page?.url?.pathname;

  const rowsPerPageOptions = [20, 50, 100];

  let downloadCache: { signature: string; data: any[] } | null = null;
  let downloadPromise: Promise<any[]> | null = null;

  const columns = [
    { key: "rank", label: "Rank", align: "left" },
    { key: "name", label: "Name", align: "left" },
    { key: "marketValue", label: "AUM", align: "right" },
    { key: "numberOfStocks", label: "Holdings", align: "right" },
    { key: "turnover", label: "Turnover", align: "right" },
    { key: "performancePercentage3Year", label: "3-Year Perf", align: "right" },
    { key: "winRate", label: "Win Rate", align: "right" },
  ];

  let sortOrders = {
    rank: { order: "none", type: "number" },
    name: { order: "none", type: "string" },
    marketValue: { order: "none", type: "number" },
    numberOfStocks: { order: "none", type: "number" },
    turnover: { order: "none", type: "number" },
    performancePercentage3Year: { order: "none", type: "number" },
    winRate: { order: "none", type: "number" },
  };

  let activeSortKey = data?.getData?.sort?.key ?? "rank";
  let activeSortOrder = data?.getData?.sort?.order ?? "asc";
  let isManualSort = !(activeSortKey === "rank" && activeSortOrder === "asc");

  if (
    isManualSort &&
    activeSortKey in sortOrders &&
    sortOrders[activeSortKey]
  ) {
    sortOrders[activeSortKey].order = activeSortOrder;
  }

  sortOrders = { ...sortOrders };

  let searchTimeout: ReturnType<typeof setTimeout> | undefined;

  const validSortKeys = new Set([
    "rank",
    "name",
    "marketValue",
    "numberOfStocks",
    "turnover",
    "performancePercentage3Year",
    "winRate",
  ]);

  const normalizeSearchTerm = (value: string) =>
    (value ?? "").trim().toLowerCase();

  const createDownloadSignature = (
    search: string,
    sortKey: string,
    sortOrder: string,
  ) => `${search}::${sortKey}::${sortOrder}`;

  const sortDatasetForDownload = (
    dataset: any[],
    key: string,
    order: string,
  ) => {
    const sortKey = validSortKeys.has(key) ? key : "rank";
    const reverse = order === "desc";

    const comparator = (a: any, b: any) => {
      const valueA = a?.[sortKey];
      const valueB = b?.[sortKey];

      if (sortKey === "name") {
        const nameA = (valueA ?? "").toString().toLowerCase();
        const nameB = (valueB ?? "").toString().toLowerCase();
        if (nameA === nameB) return 0;
        return (nameA < nameB ? -1 : 1) * (reverse ? -1 : 1);
      }

      const noneValue = reverse
        ? Number.NEGATIVE_INFINITY
        : Number.POSITIVE_INFINITY;
      const parsedAValue = Number(valueA);
      const parsedBValue = Number(valueB);
      const parsedA =
        valueA == null || Number.isNaN(parsedAValue) ? noneValue : parsedAValue;
      const parsedB =
        valueB == null || Number.isNaN(parsedBValue) ? noneValue : parsedBValue;

      if (parsedA === parsedB) return 0;
      return (parsedA < parsedB ? -1 : 1) * (reverse ? -1 : 1);
    };

    return [...dataset].sort(comparator);
  };

  function calculateTotalPages(total = totalItems, pageSize = rowsPerPage) {
    const safePageSize = Math.max(pageSize, 1);
    totalPages = Math.max(1, Math.ceil((total || 0) / safePageSize));
  }

  function saveRowsPerPage(value: number) {
    if (!browser) return;
    const currentPath = pagePathName || $page?.url?.pathname;
    if (!currentPath) return;

    try {
      const paginationKey = `${currentPath}_rowsPerPage`;
      localStorage.setItem(paginationKey, String(value));
    } catch (e) {
      console.warn("Failed to save rows per page preference:", e);
    }
  }

  function loadRowsPerPage(): number {
    if (!browser) {
      return rowsPerPage;
    }

    const currentPath = pagePathName || $page?.url?.pathname;
    if (!currentPath) {
      return rowsPerPage;
    }

    try {
      const paginationKey = `${currentPath}_rowsPerPage`;
      const savedRows = localStorage.getItem(paginationKey);
      const parsedRows = savedRows ? Number(savedRows) : NaN;

      if (rowsPerPageOptions.includes(parsedRows)) {
        return parsedRows;
      }
    } catch (e) {
      console.warn("Failed to load rows per page preference:", e);
    }

    return DEFAULT_ROWS_PER_PAGE;
  }

  async function fetchTableData({
    page = currentPage,
    pageSize = rowsPerPage,
    searchTerm = inputValue,
    sortKey = activeSortKey,
    sortOrder = activeSortOrder,
  }: {
    page?: number;
    pageSize?: number;
    searchTerm?: string;
    sortKey?: string;
    sortOrder?: string;
  } = {}) {
    const invocationId = ++requestId;
    const normalizedSearch = (searchTerm ?? "").trim();
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sortKey,
      sortOrder,
    });

    if (normalizedSearch.length > 0) {
      params.set("search", normalizedSearch);
    }

    isLoading = true;

    try {
      const response = await fetch(`/api/hedge-funds?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to load hedge fund data (${response.status})`);
      }

      const result = await response.json();

      if (invocationId !== requestId) {
        return;
      }

      tableData = result?.items ?? [];
      totalItems = result?.total ?? 0;
      currentPage = result?.page ?? page;
      rowsPerPage = result?.pageSize ?? pageSize;
      activeSortKey = result?.sort?.key ?? sortKey;
      activeSortOrder = result?.sort?.order ?? sortOrder;
      isManualSort = !(activeSortKey === "rank" && activeSortOrder === "asc");
      calculateTotalPages(totalItems, rowsPerPage);
      downloadCache = null;

      // Update sort order indicators
      if (activeSortKey in sortOrders) {
        for (const key in sortOrders) {
          sortOrders[key].order =
            isManualSort && key === activeSortKey ? activeSortOrder : "none";
        }
        sortOrders = { ...sortOrders };
      }

      saveRowsPerPage(rowsPerPage);
    } catch (error) {
      if (invocationId === requestId) {
        console.error(error);
      }
    } finally {
      if (invocationId === requestId) {
        isLoading = false;
      }
    }
  }

  async function fetchAllDataForDownload() {
    const normalizedSearch = normalizeSearchTerm(inputValue);
    const sortKey = activeSortKey;
    const sortOrder = activeSortOrder;
    const signature = createDownloadSignature(
      normalizedSearch,
      sortKey,
      sortOrder,
    );

    if (downloadCache?.signature === signature) {
      return downloadCache.data;
    }

    if (downloadPromise) {
      return downloadPromise;
    }

    downloadPromise = (async () => {
      try {
        const response = await fetch("/api/hedge-funds/all");
        if (!response.ok) {
          throw new Error(
            `Failed to load hedge fund data (${response.status})`,
          );
        }

        const result = await response.json();
        let dataset = Array.isArray(result) ? result : [];

        if (normalizedSearch.length > 0) {
          dataset = dataset.filter((item) => {
            const name = (item?.name ?? "").toString().toLowerCase();
            const cik = (item?.cik ?? "").toString().toLowerCase();
            return (
              name.includes(normalizedSearch) || cik.includes(normalizedSearch)
            );
          });
        }

        const sortedDataset = sortDatasetForDownload(
          dataset,
          sortKey,
          sortOrder,
        );
        downloadCache = { signature, data: sortedDataset };

        return sortedDataset;
      } catch (error) {
        console.error(error);
        return downloadCache?.data ?? [];
      } finally {
        downloadPromise = null;
      }
    })();

    return downloadPromise;
  }

  async function goToPage(pageNumber: number) {
    if (pageNumber < 1 || pageNumber > totalPages || isLoading) return;
    await fetchTableData({ page: pageNumber });
  }

  async function changeRowsPerPage(newRowsPerPage: number) {
    if (rowsPerPage === newRowsPerPage || isLoading) return;
    await fetchTableData({ page: 1, pageSize: newRowsPerPage });
  }

  function scrollToTop() {
    if (!browser) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function resetTableSearch() {
    inputValue = "";
    await fetchTableData({ page: 1, searchTerm: "" });
  }

  function search() {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    searchTimeout = setTimeout(() => {
      fetchTableData({ page: 1, searchTerm: inputValue });
    }, 250);
  }

  function setSortOrders(key: string, order: "none" | "asc" | "desc") {
    for (const sortKey in sortOrders) {
      sortOrders[sortKey].order = sortKey === key ? order : "none";
    }
    sortOrders = { ...sortOrders };
  }

  async function sortData(key: string) {
    if (!sortOrders[key] || isLoading) return;

    const orderCycle: Array<"none" | "asc" | "desc"> = ["none", "asc", "desc"];
    const currentOrder = sortOrders[key]?.order || "none";
    let nextOrder =
      orderCycle[(orderCycle.indexOf(currentOrder) + 1) % orderCycle.length];

    if (key === "rank") {
      if (currentOrder === "none") {
        nextOrder = "desc";
      } else if (currentOrder === "desc") {
        nextOrder = "asc";
      } else {
        nextOrder = "none";
      }
    }

    if (nextOrder === "none") {
      isManualSort = false;
      activeSortKey = "rank";
      activeSortOrder = "asc";
      setSortOrders(key, "none");
      await fetchTableData({
        page: 1,
        sortKey: activeSortKey,
        sortOrder: activeSortOrder,
      });
      return;
    }

    isManualSort = true;
    activeSortKey = key;
    activeSortOrder = nextOrder;
    setSortOrders(key, nextOrder);
    await fetchTableData({ page: 1, sortKey: key, sortOrder: nextOrder });
  }

  onMount(() => {
    const storedRows = loadRowsPerPage();
    if (storedRows !== rowsPerPage) {
      changeRowsPerPage(storedRows);
    }
  });

  $: if ($page?.url?.pathname && $page?.url?.pathname !== pagePathName) {
    pagePathName = $page?.url?.pathname;
    const storedRows = loadRowsPerPage();
    if (storedRows !== rowsPerPage) {
      changeRowsPerPage(storedRows);
    }
  }
</script>

<SEO
  title="Hedge Fund Tracker - Top Hedge Fund Holdings & 13F Filings "
  description="Track top hedge fund holdings, 13F filings, and institutional investor portfolios. Monitor what hedge funds are buying and selling with detailed position analysis. Free hedge fund tracking tool."
  keywords="hedge fund tracker, hedge fund holdings, 13F filings, institutional investors, hedge fund positions, top hedge funds, institutional holdings, hedge fund portfolios, berkshire hathaway holdings"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Hedge Fund Tracker",
    description:
      "Comprehensive tracking of hedge fund holdings and institutional investments",
    url: "https://stocknear.com/hedge-funds",
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
          name: "Hedge Funds",
          item: "https://stocknear.com/hedge-funds",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Hedge Fund List",
      description:
        "List of hedge funds and institutional investors with their holdings",
      numberOfItems: totalItems || 0,
    },
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-6 px-4 lg:px-6 text-gray-700 dark:text-zinc-200"
>
  <body class="w-full overflow-hidden m-auto">
    <div
      class="text-xs sm:text-sm breadcrumbs text-gray-800 dark:text-zinc-300"
    >
      <ul>
        <li>
          <a
            href="/"
            class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
            >Home</a
          >
        </li>
        <li class="text-gray-800 dark:text-zinc-300">Hedge Funds</li>
      </ul>
    </div>

    <section class="w-full overflow-hidden m-auto sm:mt-10 px-0 mt-10">
      <div class=" flex justify-center w-full m-auto overflow-hidden">
        <div
          class="relative flex justify-center items-center overflow-hidden w-full"
        >
          <main class="w-full">
            <div class="mb-6 border-b border-gray-300 dark:border-zinc-700">
              <h1
                class="mb-1 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
              >
                Top Hedge Funds in US
              </h1>
            </div>

            <Infobox
              text="List of all Wall Street Institutions with the highest Asset under Management."
            />

            <div class="items-center lg:overflow-visible px-1 py-1 mt-4">
              <div
                class="col-span-2 flex flex-col lg:flex-row items-start sm:items-center lg:order-2 lg:grow py-1 border-t border-b border-gray-300 dark:border-zinc-700"
              >
                <h2
                  class="text-start whitespace-nowrap text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white py-1 border-b border-gray-300 dark:border-zinc-700 lg:border-none w-full"
                >
                  {totalItems?.toLocaleString("en-US")} Institutes
                </h2>
                <div
                  class="mt-1 w-full flex flex-row lg:flex order-1 items-center ml-auto pb-1 pt-1 sm:pt-0 w-full order-0 lg:order-1"
                >
                  <div
                    class="relative lg:ml-auto w-full lg:w-fit rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 overflow-hidden flex items-center"
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
                    <DownloadData
                      {data}
                      rawData={tableData}
                      fetchRawData={fetchAllDataForDownload}
                      title={"latest_analyst_ratings_data"}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="w-full m-auto mt-5">
              <div
                class="w-full m-auto mb-4 rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 overflow-x-auto relative transition-opacity duration-200"
                class:opacity-60={isLoading}
              >
                {#if isLoading}
                  <div
                    class="pointer-events-none absolute inset-0 bg-white/70 dark:bg-[#0b1220]/70 backdrop-blur-sm"
                    aria-hidden="true"
                  ></div>
                {/if}
                <table
                  class="table table-sm table-compact rounded-none sm:rounded w-full m-auto text-gray-700 dark:text-zinc-200 tabular-nums"
                  aria-busy={isLoading}
                >
                  <thead>
                    <TableHeader {columns} {sortOrders} {sortData} />
                  </thead>
                  <tbody
                    class="transition-opacity duration-100 divide-y divide-gray-200/70 dark:divide-zinc-800/80"
                    class:opacity-70={isLoading}
                  >
                    {#if !tableData?.length}
                      <tr>
                        <td
                          colspan={columns.length}
                          class="py-6 text-center text-sm text-gray-800 dark:text-zinc-300"
                        >
                          {isLoading ? "Loading..." : "No data available."}
                        </td>
                      </tr>
                    {:else}
                      {#each tableData as item, index}
                        <tr
                          class="transition-colors hover:bg-gray-50/60 dark:hover:bg-zinc-900/50"
                        >
                          <td
                            class="text-[0.85rem] sm:text-sm text-center text-gray-700 dark:text-zinc-200 tabular-nums"
                          >
                            {item?.rank}
                          </td>

                          <td
                            class="text-start text-[0.85rem] sm:text-sm whitespace-nowrap"
                          >
                            <a
                              href={"/hedge-funds/" + item?.cik}
                              class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                              >{formatString(item?.name)}
                            </a>
                          </td>

                          <td
                            class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                          >
                            {abbreviateNumber(item?.marketValue)}
                          </td>

                          <td
                            class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                          >
                            {new Intl.NumberFormat("en", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(item?.numberOfStocks)}
                          </td>

                          <td
                            class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                          >
                            {item?.turnover?.toFixed(2)}
                          </td>

                          <!--
                            <td class=" text-sm sm:text-[1rem] whitespace-nowrap  text-end">
                              {item?.mainSectors?.at(0)}
                            </td>
                            -->

                          <td
                            class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap tabular-nums"
                          >
                            {#if item?.performancePercentage3Year >= 0}
                              <span
                                class="text-emerald-600 dark:text-emerald-400"
                                >+{abbreviateNumber(
                                  item?.performancePercentage3Year?.toFixed(2),
                                )}%</span
                              >
                            {:else}
                              <span class="text-rose-600 dark:text-rose-400"
                                >{abbreviateNumber(
                                  item?.performancePercentage3Year?.toFixed(2),
                                )}%
                              </span>
                            {/if}
                          </td>

                          <td
                            class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap tabular-nums"
                          >
                            {#if item?.winRate >= 0}
                              <span
                                class="text-emerald-600 dark:text-emerald-400"
                                >+{abbreviateNumber(
                                  item?.winRate?.toFixed(2),
                                )}%</span
                              >
                            {:else}
                              <span class="text-rose-600 dark:text-rose-400"
                                >{abbreviateNumber(item?.winRate?.toFixed(2))}%
                              </span>
                            {/if}
                          </td>
                        </tr>
                      {/each}
                    {/if}
                  </tbody>
                </table>
              </div>

              <!-- Pagination controls -->
              {#if totalItems > 0}
                <div
                  class="flex flex-row items-center justify-between mt-8 sm:mt-5"
                >
                  <!-- Previous button -->
                  <div class="flex items-center gap-2">
                    <Button
                      on:click={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1 || isLoading}
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
                      disabled={currentPage === totalPages || isLoading}
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
              {/if}
            </div>
          </main>
        </div>
      </div>
    </section>
  </body>
</section>

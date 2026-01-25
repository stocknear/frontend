<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import { onMount } from "svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import { browser } from "$app/environment";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import * as m from "$lib/paraglide/messages";

  //import * as XLSX from 'xlsx';

  export let data;

  let rawData = data?.getData?.history || [];
  let baseTableData = Array.isArray(rawData)
    ? [...rawData].sort(
        (a, b) =>
          new Date(b?.recordDate).getTime() - new Date(a?.recordDate).getTime(),
      )
    : [];
  let tableList: any[] = [...baseTableData];
  let paginatedTableList: any[] = [];

  const DEFAULT_ROWS_PER_PAGE = 20;
  const rowsPerPageOptions = [20, 50, 100];

  let rowsPerPage = DEFAULT_ROWS_PER_PAGE;
  let currentPage = 1;
  let totalPages = 1;
  let pagePathName = "";
  let latestEntry = baseTableData?.[0] ?? null;
  $: latestEntry = baseTableData?.[0] ?? null;

  let config = null;

  let columns = [
    { key: "recordDate", label: "Date", align: "left" },
    { key: "totalShortInterest", label: "Short Interest", align: "right" },
    { key: "shortPriorMo", label: "Short Prior Month", align: "right" },
    { key: "percentChangeMoMo", label: "% Change", align: "right" },
    { key: "daysToCover", label: "Day to Cover", align: "right" },
    { key: "shortPercentOfFloat", label: "Short % Float", align: "right" },
    { key: "shortPercentOfOut", label: "Short % Out", align: "right" },
  ];

  let sortOrders = {
    recordDate: { order: "none", type: "date" },
    totalShortInterest: { order: "none", type: "number" },
    shortPriorMo: { order: "none", type: "number" },
    percentChangeMoMo: { order: "none", type: "number" },
    daysToCover: { order: "none", type: "number" },
    shortPercentOfFloat: { order: "none", type: "number" },
    shortPercentOfOut: { order: "none", type: "number" },
  };

  function getPaginationKey() {
    if (!browser) {
      return null;
    }

    const currentPath = window.location.pathname || "";
    if (!currentPath) {
      return null;
    }

    pagePathName = currentPath;
    return `${currentPath}_short_interest_rowsPerPage`;
  }

  function loadRowsPerPageFromStorage() {
    const paginationKey = getPaginationKey();
    if (!paginationKey) {
      return rowsPerPage;
    }

    try {
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

  function saveRowsPerPage(value: number) {
    const paginationKey = getPaginationKey();
    if (!paginationKey) {
      return;
    }

    try {
      localStorage.setItem(paginationKey, String(value));
    } catch (e) {
      console.warn("Failed to save rows per page preference:", e);
    }
  }

  function compareForSort(
    a: any,
    b: any,
    key: string,
    type: "date" | "number" | "string",
    order: "asc" | "desc",
  ) {
    const direction = order === "asc" ? 1 : -1;

    if (type === "date") {
      const timeA = new Date(a?.[key]).getTime();
      const timeB = new Date(b?.[key]).getTime();
      const fallback =
        order === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
      const safeA = Number.isFinite(timeA) ? timeA : fallback;
      const safeB = Number.isFinite(timeB) ? timeB : fallback;
      if (safeA === safeB) return 0;
      return safeA < safeB ? -1 * direction : 1 * direction;
    }

    if (type === "string") {
      const valueA = (a?.[key] ?? "").toString().toLowerCase();
      const valueB = (b?.[key] ?? "").toString().toLowerCase();
      return valueA.localeCompare(valueB) * direction;
    }

    const rawA = Number(a?.[key]);
    const rawB = Number(b?.[key]);
    const fallback =
      order === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    const isValidA =
      a?.[key] !== null && a?.[key] !== undefined && Number.isFinite(rawA);
    const isValidB =
      b?.[key] !== null && b?.[key] !== undefined && Number.isFinite(rawB);
    const safeA = isValidA ? rawA : fallback;
    const safeB = isValidB ? rawB : fallback;
    if (safeA === safeB) return 0;
    return safeA < safeB ? -1 * direction : 1 * direction;
  }

  function applySorting() {
    const activeKey = Object.keys(sortOrders).find(
      (key) => sortOrders[key].order !== "none",
    );

    let workingList = [...baseTableData];

    if (activeKey) {
      const { order, type } = sortOrders[activeKey];
      if (order !== "none") {
        workingList.sort((a, b) =>
          compareForSort(a, b, activeKey, type, order),
        );
      }
    }

    tableList = workingList;
  }

  function applyPagination() {
    if (!Array.isArray(tableList) || tableList.length === 0) {
      paginatedTableList = [];
      totalPages = 1;
      currentPage = 1;
      return;
    }

    const safeRowsPerPage =
      rowsPerPage && rowsPerPage > 0 ? rowsPerPage : DEFAULT_ROWS_PER_PAGE;

    if (rowsPerPage <= 0) {
      rowsPerPage = safeRowsPerPage;
    }

    totalPages = Math.max(1, Math.ceil(tableList.length / safeRowsPerPage));

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    if (currentPage < 1) {
      currentPage = 1;
    }

    const startIndex = (currentPage - 1) * safeRowsPerPage;
    paginatedTableList = tableList.slice(
      startIndex,
      startIndex + safeRowsPerPage,
    );
  }

  function refreshTable({ resetPage = false } = {}) {
    applySorting();
    if (resetPage) {
      currentPage = 1;
    }
    applyPagination();
  }

  function goToPage(pageNumber: number) {
    if (pageNumber < 1 || pageNumber > totalPages) {
      return;
    }

    currentPage = pageNumber;
    applyPagination();
  }

  function changeRowsPerPage(newRowsPerPage: number) {
    if (rowsPerPage === newRowsPerPage) {
      return;
    }

    rowsPerPage = newRowsPerPage;
    currentPage = 1;
    if (browser) {
      saveRowsPerPage(rowsPerPage);
    }
    refreshTable({ resetPage: true });
  }

  function sortData(key: string) {
    if (!sortOrders[key]) {
      return;
    }

    const updatedSortOrders = { ...sortOrders };
    for (const sortKey in updatedSortOrders) {
      if (sortKey !== key) {
        updatedSortOrders[sortKey].order = "none";
      }
    }

    const orderCycle: Array<"none" | "asc" | "desc"> = ["none", "asc", "desc"];
    const currentOrder = updatedSortOrders[key].order;
    const nextOrder =
      orderCycle[(orderCycle.indexOf(currentOrder) + 1) % orderCycle.length];

    updatedSortOrders[key].order = nextOrder;
    sortOrders = updatedSortOrders;

    refreshTable({ resetPage: true });
  }

  refreshTable({ resetPage: true });

  onMount(() => {
    if (!browser) {
      return;
    }

    const storedRows = loadRowsPerPageFromStorage();
    if (storedRows !== rowsPerPage) {
      rowsPerPage = storedRows;
    }

    refreshTable({ resetPage: true });
  });
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Short Interest Analysis | Historical Data & Squeeze Indicators`}
  description={`Comprehensive short interest analysis for ${$displayCompanyName} (${$stockTicker}). Track short position changes, days to cover, short ratio, float percentage, and historical trends. Advanced short squeeze detection and bearish sentiment analysis tools.`}
  keywords={`${$stockTicker} short interest, ${$displayCompanyName} short squeeze, days to cover, short float percentage, ${$stockTicker} short ratio, short position analysis, short interest history, bearish sentiment analysis, squeeze indicators`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/statistics/short-interest`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "Dataset"],
    name: `${$displayCompanyName} Short Interest Analysis`,
    description: `Professional short interest tracking and squeeze analysis for ${$displayCompanyName} (${$stockTicker})`,
    url: `https://stocknear.com/stocks/${$stockTicker}/statistics/short-interest`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Short interest tracking",
      "Days to cover analysis",
      "Short float percentage",
      "Historical short data",
      "Short squeeze indicators",
      "Bearish sentiment analysis",
      "Short ratio calculations",
      "Position change tracking",
    ],
    provider: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
    mainEntity: {
      "@type": "Corporation",
      name: $displayCompanyName,
      tickerSymbol: $stockTicker,
    },
    about: {
      "@type": "Thing",
      name: "Short Interest Analysis",
      description:
        "Professional analysis of short positions and squeeze potential",
    },
  }}
/>

<section class="w-full overflow-hidden h-full text-gray-700 dark:text-zinc-200">
  <div class="w-full flex justify-center w-full sm-auto h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <main class="w-full">
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 m-auto mt-2 sm:mt-0">
          <div class="w-full flex flex-col sm:flex-row justify-between">
            <h1
              class="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              {m.stock_detail_stats_nav_short_interest()}
            </h1>
          </div>

          {#if rawData?.length !== 0}
            <div class="grid grid-cols-1 gap-2">
              <Infobox
                text={m.stock_detail_stats_short_interest_infobox({
                  company: removeCompanyStrings($displayCompanyName),
                  shortInterest: abbreviateNumber(data?.getData?.sharesShort),
                  changeDirection: (latestEntry?.percentChangeMoMo ?? 0) > 0
                    ? m.stock_detail_stats_increased()
                    : (latestEntry?.percentChangeMoMo ?? 0) < 0
                      ? m.stock_detail_stats_decreased()
                      : m.stock_detail_stats_unchanged(),
                  changePercent: abbreviateNumber(latestEntry?.percentChangeMoMo?.toFixed(2))
                })}
              />

              <div
                class="my-5 grid grid-cols-2 gap-3 xs:mt-6 bp:mt-7 sm:grid-cols-3 sm:gap-6"
              >
                <div
                  class="short-interest-driver rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 p-4"
                >
                  <div
                    class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                  >
                    {m.stock_detail_stats_nav_short_interest()}
                  </div>
                  <div
                    class="mt-1 text-lg bp:text-xl sm:mt-1.5 sm:text-2xl font-semibold text-gray-900 dark:text-white"
                  >
                    {abbreviateNumber(data?.getData?.sharesShort)}
                  </div>
                </div>
                <div
                  class="shortPriorMonth-driver rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 p-4"
                >
                  <div
                    class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                  >
                    {m.stock_detail_stats_short_prior_month()}
                  </div>
                  <div
                    class="mt-1 text-lg bp:text-xl sm:mt-1.5 sm:text-2xl font-semibold text-gray-900 dark:text-white"
                  >
                    {abbreviateNumber(data?.getData?.sharesShortPriorMonth)}
                  </div>
                </div>
                <div
                  class="changeMoM-driver rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 p-4"
                >
                  <div
                    class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                  >
                    {m.stock_detail_stats_change_mom()}
                  </div>
                  <div
                    class="mt-1 text-lg bp:text-xl sm:mt-1.5 sm:text-2xl font-semibold {latestEntry?.percentChangeMoMo >
                    0
                      ? "text-emerald-600 dark:text-emerald-400 before:content-['+'] "
                      : latestEntry?.percentChangeMoMo < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-gray-900 dark:text-white'}"
                  >
                    {latestEntry?.percentChangeMoMo
                      ? latestEntry?.percentChangeMoMo + "%"
                      : "n/a"}
                  </div>
                </div>
                <div
                  class="shortPercentFloat-driver rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 p-4"
                >
                  <div
                    class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                  >
                    {m.stock_detail_stats_short_percent_floating()}
                  </div>
                  <div
                    class="mt-1 text-lg bp:text-xl sm:mt-1.5 sm:text-2xl font-semibold text-gray-900 dark:text-white"
                  >
                    {data?.getData?.shortFloatPercent
                      ? data?.getData?.shortFloatPercent + "%"
                      : "n/a"}
                  </div>
                </div>
                <div
                  class="shortPercentOutstanding-driver rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 p-4"
                >
                  <div
                    class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                  >
                    {m.stock_detail_stats_short_percent_outstanding()}
                  </div>
                  <div
                    class="mt-1 text-lg bp:text-xl sm:mt-1.5 sm:text-2xl font-semibold text-gray-900 dark:text-white"
                  >
                    {data?.getData?.shortOutstandingPercent
                      ? data?.getData?.shortOutstandingPercent + "%"
                      : "n/a"}
                  </div>
                </div>
                <div
                  class="daysToCover-driver rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 p-4"
                >
                  <div
                    class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                  >
                    {m.stock_detail_stats_days_to_cover()}
                  </div>
                  <div
                    class="mt-1 text-lg bp:text-xl sm:mt-1.5 sm:text-2xl font-semibold text-gray-900 dark:text-white"
                  >
                    {data?.getData?.shortRatio}
                  </div>
                </div>
              </div>

              <div class="items-center lg:overflow-visible px-1 py-1">
                <div
                  class="flex flex-row items-start sm:items-center lg:order-2 lg:grow py-1 border-t border-b border-gray-300 dark:border-zinc-700"
                >
                  <h3
                    class="text-start whitespace-nowrap text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white py-1 w-full"
                  >
                    {m.stock_detail_stats_history()}
                  </h3>

                  <div class=" w-full flex order-1 items-center ml-auto">
                    <div class="ml-auto">
                      <DownloadData
                        {data}
                        {rawData}
                        title={`short_interest_${$stockTicker}`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-3 w-full m-auto mb-4 overflow-x-auto">
                <div class="w-full overflow-x-flow">
                  <table
                    class="table table-sm table-compact w-full text-gray-700 dark:text-zinc-200 tabular-nums m-auto rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40"
                  >
                    <thead
                      class="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                    >
                      <TableHeader {columns} {sortOrders} {sortData} />
                    </thead>
                    <tbody>
                      {#each paginatedTableList as item}
                        <tr class="transition-colors">
                          <td class="text-sm whitespace-nowrap">
                            {new Date(item?.recordDate)?.toLocaleDateString(
                              "en-US",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                timeZone: "UTC",
                              },
                            )}
                          </td>

                          <td class="text-sm text-right whitespace-nowrap">
                            {abbreviateNumber(item?.totalShortInterest)}
                          </td>
                          <td class="text-sm text-right whitespace-nowrap">
                            {abbreviateNumber(item?.shortPriorMo)}
                          </td>
                          <td class="text-sm whitespace-nowrap text-end">
                            <span
                              class={item?.percentChangeMoMo &&
                              item?.percentChangeMoMo >= 0
                                ? "before:content-['+'] text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"}
                            >
                              {item?.percentChangeMoMo
                                ? item?.percentChangeMoMo + "%"
                                : "n/a"}
                            </span>
                          </td>
                          <td class="text-sm text-right whitespace-nowrap">
                            {abbreviateNumber(item?.daysToCover)}
                          </td>
                          <td class="text-sm text-right whitespace-nowrap">
                            {item?.shortPercentOfFloat
                              ? item?.shortPercentOfFloat + "%"
                              : "n/a"}
                          </td>
                          <td class="text-sm text-right whitespace-nowrap">
                            {item?.shortPercentOfOut
                              ? item?.shortPercentOfOut + "%"
                              : "n/a"}
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              </div>
              {#if paginatedTableList?.length > 0}
                <div
                  class="flex gap-3 mt-3 flex-row items-center justify-between mb-5 sm:mb-0 w-full"
                >
                  <Button
                    on:click={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    class="w-fit sm:w-auto gap-1 transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
                    <span class="hidden sm:inline">{m.stock_detail_previous()}</span>
                  </Button>

                  <div class="flex flex-row items-center gap-4">
                    <span class="text-sm text-gray-600 dark:text-zinc-300">
                      {m.stock_detail_page_of({ current: currentPage, total: totalPages })}
                    </span>

                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild let:builder>
                        <Button
                          builders={[builder]}
                          class="w-fit sm:w-auto gap-1 transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <span class="truncate text-[0.85rem] sm:text-sm"
                            >{m.stock_detail_rows({ count: rowsPerPage })}</span
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
                              class="text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
                            >
                              <label
                                on:click={() => changeRowsPerPage(item)}
                                class="inline-flex justify-between w-full items-center cursor-pointer"
                              >
                                <span class="text-sm">{m.stock_detail_rows({ count: item })}</span>
                              </label>
                            </DropdownMenu.Item>
                          {/each}
                        </DropdownMenu.Group>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </div>

                  <Button
                    on:click={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    class="w-fit sm:w-auto gap-1 transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span class="hidden sm:inline">{m.stock_detail_next()}</span>
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
              {/if}
            </div>
          {:else}
            <Infobox text={m.stock_detail_no_data()} />
          {/if}
        </div>
      </main>
    </div>
  </div>
</section>

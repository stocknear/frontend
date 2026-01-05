<script lang="ts">
  import { displayCompanyName } from "$lib/store";
  import Infobox from "$lib/components/Infobox.svelte";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { page } from "$app/stores";
  import { onMount } from "svelte";

  export let data;
  export let ticker;

  let dateDistance;
  let rawData = data?.getStockDividend;
  let sortedData = [];
  let stockList = [];
  let exDividendDate;
  let dividendYield;
  let annualDividend;
  let payoutFrequency;
  let payoutRatio;
  let dividendGrowth;

  // Pagination state
  let currentPage = 1;
  let rowsPerPage = 20;
  let rowsPerPageOptions = [20, 50, 100];
  let totalPages = 1;
  let pagePathName = $page?.url?.pathname;

  const mapFrequency: Record<string, string> = {
    Annually: "year",
    Quarterly: "quarter",
    Monthly: "month",
    Weekly: "week",
    Daily: "day",
    "Semi-Annually": "6 months",
    Biweekly: "2 weeks",
    Fortnightly: "2 weeks",
    "Every 2 Weeks": "2 weeks",
    "Semi-Monthly": "half-month",
  };

  // Optional: normalize common variations (case, hyphens, etc.)
  const normalizedMap = new Map<string, string>([
    ["annually", "year"],
    ["annual", "year"],
    ["yearly", "year"],
    ["quarterly", "quarter"],
    ["monthly", "month"],
    ["weekly", "week"],
    ["daily", "day"],
    ["semiannually", "6 months"],
    ["semi-annually", "6 months"],
    ["biweekly", "2 weeks"],
    ["fortnightly", "2 weeks"],
    ["every 2 weeks", "2 weeks"],
    ["semi-monthly", "half-month"],
  ]);

  const getFreqUnit = (payoutFrequency?: string) => {
    if (!payoutFrequency) return "";
    // exact match first
    if (payoutFrequency in mapFrequency) return mapFrequency[payoutFrequency];

    // otherwise, try normalized match
    const norm = payoutFrequency.toLowerCase().replace(/\s+/g, " ").trim();
    return normalizedMap.get(norm) ?? "";
  };

  function updatePaginatedData() {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    stockList = sortedData?.slice(start, end);
    totalPages = Math.ceil(sortedData?.length / rowsPerPage);
  }

  function goToPage(page) {
    currentPage = page;
    updatePaginatedData();
  }

  function changeRowsPerPage(newRowsPerPage) {
    rowsPerPage = newRowsPerPage;
    currentPage = 1;
    updatePaginatedData();
    saveRowsPerPage();
  }

  function saveRowsPerPage() {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        `dividends_rowsPerPage_${pagePathName}`,
        rowsPerPage.toString(),
      );
    }
  }

  function loadRowsPerPage() {
    if (typeof localStorage !== "undefined") {
      const savedRowsPerPage = localStorage.getItem(
        `dividends_rowsPerPage_${pagePathName}`,
      );
      if (savedRowsPerPage) {
        rowsPerPage = parseInt(savedRowsPerPage, 10);
      }
    }
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function initialize() {
    sortedData = [...(rawData?.history || [])];
    loadRowsPerPage();
    currentPage = 1;
    updatePaginatedData();
  }

  function generateDividendInfoHTML() {
    const history = rawData?.history || [];

    if (history.length !== 0) {
      if (!dateDistance) {
        const formattedExDividendDate = new Date(exDividendDate).toLocaleString(
          "en-US",
          {
            month: "short",
            day: "numeric",
            year: "numeric",
          },
        );

        return `
       <span>
  ${ticker} has a dividend yield of ${dividendYield}% and paid $${annualDividend} per share in the past year. The dividend is paid once per ${mapFrequency[payoutFrequency] ?? "n/a"} and the last ex-dividend date was ${formattedExDividendDate}.
</span>

      `;
      } else {
        const latestDividendDate = new Date(history.at(0)?.date).toLocaleString(
          "en-US",
          {
            month: "short",
            day: "numeric",
            year: "numeric",
          },
        );

        return `
        <span>
          ${$displayCompanyName} issued its most recent dividend on ${latestDividendDate}. 
          Since then, the company has not distributed any further dividends for over 12 months.
        </span>
      `;
      }
    } else {
      return `
      <span>
        No dividend history available for ${$displayCompanyName}.
      </span>
    `;
    }
  }

  let htmlOutput = `No dividend history available for ${$displayCompanyName}.`;

  $: {
    if (pagePathName) {
      initialize();
    }
  }

  let columns = [
    { key: "date", label: "Ex-Dividend Date", align: "left" },
    { key: "adjDividend", label: "Cash Amount", align: "right" },
    { key: "declarationDate", label: "Declaration Date", align: "right" },
    { key: "recordDate", label: "Record Date", align: "right" },
    { key: "paymentDate", label: "Pay Date", align: "right" },
  ];

  let sortOrders = {
    date: { order: "none", type: "date" },
    adjDividend: { order: "none", type: "number" },
    declarationDate: { order: "none", type: "date" },
    recordDate: { order: "none", type: "date" },
    paymentDate: { order: "none", type: "date" },
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
      sortedData = [...(rawData?.history || [])];
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
    sortedData = [...(rawData?.history || [])].sort(compareValues);
    currentPage = 1;
    updatePaginatedData();
  };

  rawData = data?.getStockDividend;
  exDividendDate = rawData?.history?.at(0)?.date;
  dividendYield = rawData?.dividendYield;
  annualDividend = rawData?.annualDividend;
  payoutFrequency = rawData?.payoutFrequency;
  payoutRatio = rawData?.payoutRatio;
  dividendGrowth = rawData?.dividendGrowth;

  htmlOutput = generateDividendInfoHTML();
</script>

<section class="w-full overflow-hidden h-full">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <div class="sm:pl-7 sm:pb-7 sm:pt-7 pt-3 w-full m-auto mt-2 sm:mt-0">
        <div class="w-full mb-6">
          <h2
            class="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white mb-4 w-full"
          >
            Dividends
          </h2>

          <Infobox text={htmlOutput} />
        </div>

        {#if rawData?.history?.length > 0}
          <div
            class="mb-4 grid grid-cols-2 md:grid-cols-3 rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 divide-x divide-y divide-gray-200/70 dark:divide-zinc-800/80"
          >
            <div class="p-4 bp:p-5 sm:p-6">
              <label
                class="mr-1 cursor-pointer flex flex-row items-center text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400"
              >
                Dividend Yield
              </label>
              <div
                class="mt-2 break-words font-semibold leading-8 text-xl text-gray-900 dark:text-white"
              >
                {dividendYield !== "0.00" ? dividendYield : "0"}%
              </div>
            </div>
            <div class="p-4 bp:p-5 sm:p-6">
              <label
                class="mr-1 cursor-pointer flex flex-row items-center text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400"
              >
                Annual Dividend
              </label>

              <div
                class="mt-2 break-words font-semibold leading-8 text-xl text-gray-900 dark:text-white"
              >
                {annualDividend !== "0.00" ? annualDividend : "0"}
              </div>
            </div>
            <div class="p-4 bp:p-5 sm:p-6">
              <label
                class="mr-1 cursor-pointer flex flex-row items-center text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400"
              >
                Ex-Dividend Date
              </label>

              <div
                class="mt-2 break-words font-semibold leading-8 text-xl text-gray-900 dark:text-white"
              >
                {new Date(exDividendDate)?.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  daySuffix: "2-digit",
                })}
              </div>
            </div>

            <div class="p-4 bp:p-5 sm:p-6">
              <label
                class="mr-1 cursor-pointer flex flex-row items-center text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400"
              >
                Payout Frequency
              </label>

              <div
                class="mt-2 break-words font-semibold leading-8 text-xl text-gray-900 dark:text-white"
              >
                {payoutFrequency ? payoutFrequency : "n/a"}
              </div>
            </div>
            <div class="p-4 bp:p-5 sm:p-6">
              <label
                class="mr-1 cursor-pointer flex flex-row items-center text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400"
              >
                Payout Ratio
              </label>

              <div
                class="mt-2 break-words font-semibold leading-8 text-xl text-gray-900 dark:text-white"
              >
                {payoutRatio !== "0.00" && payoutRatio !== null
                  ? payoutRatio + "%"
                  : "n/a"}
              </div>
            </div>
            <div class="p-4 bp:p-5 sm:p-6">
              <label
                class="mr-1 cursor-pointer flex flex-row items-center text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400"
              >
                Dividend Growth
              </label>

              <div
                class="mt-2 break-words font-semibold leading-8 text-xl text-gray-900 dark:text-white"
              >
                {dividendGrowth ? dividendGrowth + "%" : "n/a"}
              </div>
            </div>
          </div>

          <div
            class="history-driver mt-5 flex flex-row items-center w-full justify-between border-t border-b border-gray-300 dark:border-zinc-700 py-2"
          >
            <h3
              class="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              History
            </h3>

            <div class="inline-flex ml-auto">
              <DownloadData
                {data}
                rawData={rawData?.history}
                title={`dividend_${ticker}`}
              />
            </div>
          </div>

          {#if stockList?.length > 0}
            <div
              class="overflow-x-auto flex justify-start items-center w-full m-auto mb-4 mt-4"
            >
              <div class="w-full overflow-x-auto">
                <table
                  class="table table-sm table-compact w-full text-gray-700 dark:text-zinc-200 tabular-nums m-auto rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 mt-2"
                >
                  <thead
                    class="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                  >
                    <TableHeader {columns} {sortOrders} {sortData} />
                  </thead>
                  <tbody>
                    {#each stockList as item}
                      <tr class="transition-colors">
                        <td class="text-start text-sm whitespace-nowrap">
                          {new Date(item?.date)?.toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            daySuffix: "2-digit",
                          })}
                        </td>
                        <td class="text-end text-sm whitespace-nowrap">
                          ${item?.adjDividend?.toFixed(3)}
                        </td>
                        <td class="text-end text-sm whitespace-nowrap">
                          {item?.declarationDate?.length !== 0
                            ? new Date(item?.declarationDate)?.toLocaleString(
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
                        <td class="text-end text-sm whitespace-nowrap">
                          {item?.recordDate?.length !== 0
                            ? new Date(item?.recordDate)?.toLocaleString(
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
                        <td class="text-end text-sm whitespace-nowrap">
                          {item?.paymentDate?.length !== 0
                            ? new Date(item?.paymentDate)?.toLocaleString(
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
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Pagination controls -->
            {#if stockList?.length > 0 && totalPages > 0}
              <div
                class="flex flex-row items-center justify-between mt-8 sm:mt-5"
              >
                <!-- Previous button -->
                <div class="flex items-center gap-2">
                  <Button
                    on:click={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
                    <span class="hidden sm:inline">Previous</span>
                  </Button>
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
                        class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
                      class="w-auto min-w-40 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
                    >
                      <!-- Dropdown items -->
                      <DropdownMenu.Group class="pb-2">
                        {#each rowsPerPageOptions as item}
                          <DropdownMenu.Item
                            class="hover:text-violet-600 dark:hover:text-violet-400 transition"
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
                    class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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

            <div class="text-gray-800 dark:text-zinc-300 text-sm italic mt-7">
              * Dividend amounts are adjusted for stock splits when applicable.
            </div>
          {:else}
            <Infobox text="No dividend data found" />
          {/if}
        {/if}
      </div>
    </div>
  </div>
</section>

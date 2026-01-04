<script lang="ts">
  import {
    displayCompanyName,
    stockTicker,
    assetType,
    etfTicker,
  } from "$lib/store";
  import { removeCompanyStrings, abbreviateNumber } from "$lib/utils";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";
  import { get } from "svelte/store";
  import DownloadData from "$lib/components/DownloadData.svelte";

  export let data;
  export let rawData = [];

  let config = null;

  let avgFailToDeliver;
  let weightedFTD;

  let activeIdx = 0;
  const tabs = [
    {
      title: "Daily",
    },
    {
      title: "Monthly",
    },
  ];

  let tableList = [];
  let sortedList = [];
  let displayList = [];
  let currentSortKey = null;
  let currentPage = 1;
  let rowsPerPage = 20;
  let rowsPerPageOptions = [20, 50, 100];
  let totalPages = 1;
  let initialized = false;
  let sortOrders = {
    date: { order: "none", type: "date" },
    tPlus35Date: { order: "none", type: "date" },
    price: { order: "none", type: "number" },
    tradeVolume: { order: "none", type: "number" },
    failToDeliver: { order: "none", type: "number" },
    ftdChange: { order: "none", type: "number" },
    ftdChangePercentage: { order: "none", type: "number" },
    notionalValue: { order: "none", type: "number" },
  };

  const columns = [
    { key: "date", label: "Date", align: "left" },
    { key: "tPlus35Date", label: "Deadline", align: "left" },
    { key: "price", label: "Price", align: "right" },
    { key: "tradeVolume", label: "Trade Vol", align: "right" },
    { key: "failToDeliver", label: "FTD Shares", align: "right" },
    { key: "ftdChange", label: "FTD Change", align: "right" },
    {
      key: "ftdChangePercentage",
      label: "% FTD Change",
      align: "right",
    },
    { key: "notionalValue", label: "$ Notional", align: "right" },
  ];

  function changeTimePeriod(i) {
    activeIdx = i;
    computeTableData(true);
  }

  function filterByPeriod(data) {
    if (!Array.isArray(data) || data.length === 0) return [];

    data = data?.sort((a, b) => new Date(b?.date) - new Date(a?.date));

    // Quarterly: one result per year-quarter.
    const seenPeriods = new Set();
    return data.filter((item) => {
      const dt = new Date(item.date);
      const year = dt.getFullYear();
      const quarter = Math.floor(dt.getMonth() / 3) + 1; // Quarter 1 to 4
      const key = `${year}-Q${quarter}`;
      if (!seenPeriods.has(key)) {
        seenPeriods.add(key);
        return true;
      }
      return false;
    });
  }

  function filterByMonth(data) {
    if (!Array.isArray(data) || data.length === 0) return [];

    data = data?.sort((a, b) => new Date(b?.date) - new Date(a?.date));

    // Monthly: one result per month.
    const seenMonths = new Set();
    return data.filter((item) => {
      const dt = new Date(item.date);
      const year = dt.getFullYear();
      const month = dt.getMonth(); // Month as a number (0-11)
      const key = `${year}-${month}`;
      if (!seenMonths.has(key)) {
        seenMonths.add(key);
        return true;
      }
      return false;
    });
  }

  function getPaginationStorageKey() {
    const ticker =
      get(assetType) === "stock" ? get(stockTicker) : get(etfTicker);
    return `ftd_rows_${ticker || "global"}`;
  }

  function loadRowsPerPage() {
    if (typeof localStorage === "undefined") return;
    try {
      const stored = localStorage?.getItem(getPaginationStorageKey());
      if (stored && rowsPerPageOptions.includes(Number(stored))) {
        rowsPerPage = Number(stored);
      }
    } catch (error) {
      console.warn("Failed to load rows per page preference:", error);
    }
  }

  function saveRowsPerPage() {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage?.setItem(getPaginationStorageKey(), String(rowsPerPage));
    } catch (error) {
      console.warn("Failed to save rows per page preference:", error);
    }
  }

  function computeTableData(resetPage = false) {
    let baseList = data?.getData || [];
    if (activeIdx === 1) {
      baseList = filterByMonth([...baseList]);
    } else {
      baseList = [...baseList].sort(
        (a, b) => new Date(b?.date) - new Date(a?.date),
      );
    }

    tableList = baseList ?? [];

    if (resetPage) {
      currentPage = 1;
    }

    applySorting();
  }

  function normalizeValues(a, b, key, type) {
    let valueA = a?.[key];
    let valueB = b?.[key];

    switch (type) {
      case "date":
        valueA = valueA ? new Date(valueA).getTime() : null;
        valueB = valueB ? new Date(valueB).getTime() : null;
        break;
      case "number":
        valueA = typeof valueA === "number" ? valueA : parseFloat(valueA) || 0;
        valueB = typeof valueB === "number" ? valueB : parseFloat(valueB) || 0;
        break;
      default:
        valueA = valueA?.toString()?.toUpperCase() ?? null;
        valueB = valueB?.toString()?.toUpperCase() ?? null;
    }

    return { valueA, valueB };
  }

  function applySorting() {
    if (currentSortKey && sortOrders[currentSortKey]?.order === "none") {
      currentSortKey = null;
    }

    sortedList = [...tableList];

    if (currentSortKey) {
      const { order, type } = sortOrders[currentSortKey];
      if (order && order !== "none") {
        sortedList.sort((a, b) => {
          const { valueA, valueB } = normalizeValues(
            a,
            b,
            currentSortKey,
            type,
          );

          if (valueA === null && valueB === null) return 0;
          if (valueA === null) return order === "asc" ? 1 : -1;
          if (valueB === null) return order === "asc" ? -1 : 1;

          if (valueA < valueB) return order === "asc" ? -1 : 1;
          if (valueA > valueB) return order === "asc" ? 1 : -1;
          return 0;
        });
      }
    }

    updatePagination();
  }

  function updatePagination() {
    const totalItems = sortedList?.length || 0;
    totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / rowsPerPage);
    if (currentPage > totalPages) {
      currentPage = totalPages;
    }
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    displayList = sortedList.slice(startIndex, endIndex);
  }

  function goToPage(pageNumber) {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      currentPage = pageNumber;
      updatePagination();
    }
  }

  function changeRowsPerPage(newRowsPerPage) {
    rowsPerPage = newRowsPerPage;
    currentPage = 1;
    updatePagination();
    saveRowsPerPage();
  }

  function sortData(key) {
    if (!sortOrders[key]) return;

    for (const sortKey in sortOrders) {
      if (sortKey !== key) {
        sortOrders[sortKey].order = "none";
      }
    }

    const orderCycle = ["none", "asc", "desc"];
    const currentOrderIndex = orderCycle.indexOf(sortOrders[key].order);
    const nextOrder = orderCycle[(currentOrderIndex + 1) % orderCycle.length];
    sortOrders[key].order = nextOrder;
    currentSortKey = nextOrder === "none" ? null : key;
    sortOrders = { ...sortOrders };
    applySorting();
  }

  function formatDisplayDate(value) {
    if (!value) return "n/a";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "n/a";
    const formatted = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
      timeZone: "UTC",
    });
    return formatted.replace(/, (\d{2})$/, ", '$1");
  }

  function plotData() {
    let dates = [];
    let priceList = [];
    let failToDeliverList = [];
    rawData?.forEach((item) => {
      dates?.push(item?.date);
      priceList?.push(Number(item?.price));
      failToDeliverList?.push(item?.failToDeliver);
    });

    const totalNumber = failToDeliverList?.reduce((acc, item) => acc + item, 0);
    avgFailToDeliver = Math?.floor(totalNumber / failToDeliverList?.length);

    // Calculate max and min FTD values for bubble scaling
    const maxFTD = Math.max(...(failToDeliverList || [0]));
    const minFTD = Math.min(...(failToDeliverList || [0]));

    // Calculate dynamic threshold for significant FTD spikes
    const avgFTD =
      failToDeliverList?.reduce((sum, item) => sum + item, 0) /
      (failToDeliverList?.length || 1);
    const ftdThreshold = Math.min(avgFTD * 1.5, maxFTD * 0.3); // Show meaningful spikes

    // Create FTD impact bubbles for significant spikes
    const ftdImpactPoints =
      rawData
        ?.filter((item, index) => failToDeliverList[index] > ftdThreshold)
        ?.map((item, index) => {
          const originalIndex = rawData.indexOf(item);
          const x = originalIndex; // Use index for category axis
          const y = Number(item?.price) || 0;
          const z = failToDeliverList[originalIndex] || 0;

          // Only return valid data points with meaningful FTD
          return x !== undefined && y && z > 0 ? { x, y, z } : null;
        })
        ?.filter(Boolean) || []; // Remove null/undefined values

    const options = {
      credits: {
        enabled: false,
      },
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 360,
        animation: false,
      },
      title: {
        text: `<h3 class="mt-3 mb-1 text-[1rem] sm:text-lg">${removeCompanyStrings($displayCompanyName)} FTD</h3>`,
        style: {
          color: $mode === "light" ? "black" : "white",
        },
        useHTML: true,
      },
      plotOptions: {
        series: {
          legendSymbol: "rectangle",
          animation: false,
          states: {
            hover: {
              enabled: false,
            },
          },
        },
        spline: {
          marker: {
            enabled: false,
            states: {
              hover: {
                enabled: false,
              },
            },
          },
        },
      },
      legend: {
        enabled: true,
        align: "center",
        verticalAlign: "top",
        layout: "horizontal",
        squareSymbol: false,
        symbolWidth: 20,
        symbolHeight: 12,
        symbolRadius: 0,
        itemStyle: {
          color: $mode === "light" ? "black" : "white",
        },
      },
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 1)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        borderRadius: 4,
        style: { color: "#fff", fontSize: "14px", padding: "10px" },

        formatter: function () {
          const dateVal = dates?.[this.x] ?? this.x;
          const dateStr = new Date(dateVal).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          });

          let html = `<div class="text-[1rem] font-[501] mb-1">${dateStr}</div>`;

          // `this.points` is an array of point objects (one per visible series at x)
          this.points.forEach((p) => {
            if (p.series.type === "line") {
              html += `<div class="text-sm">Stock Price: <strong>$${(p.y ?? 0).toFixed(2)}</strong></div>`;
            } else {
              html += `<div class="text-sm">${p.series.name}: <strong>${p.y?.toLocaleString("en-US") ?? 0}</strong></div>`;
            }
          });

          return `<div class="p-1">${html}</div>`;
        },
      },
      xAxis: {
        endOnTick: false,
        categories: dates,
        crosshair: {
          color: $mode === "light" ? "black" : "white",
          width: 1,
          dashStyle: "Solid",
        },
        labels: {
          style: { color: $mode === "light" ? "black" : "white" },
          distance: 10,
          formatter: function () {
            return new Date(this.value).toLocaleDateString("en-US", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              timeZone: "UTC",
            });
          },
        },
      },
      yAxis: [
        {
          gridLineWidth: 1,
          gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
          labels: {
            enabled: false,
          },
          title: {
            text: null,
          },
          opposite: true,
        },
        {
          gridLineWidth: 1,
          gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
          labels: {
            enabled: false,
          },
          title: {
            text: null,
          },
          opposite: true,
        },
      ],
      series: [
        {
          // Price line series drawn on top of area
          name: "Stock Price",
          type: "line",
          data: priceList,
          color: $mode === "light" ? "#2C6288" : "#fff",
          marker: {
            enabled: false,
            states: {
              hover: {
                enabled: false,
              },
            },
          },
          lineWidth: 2,
          zIndex: 2, // Middle z-index
        },
        {
          name: "FTD Shares",
          type: "column",
          data: failToDeliverList,
          fillOpacity: 1,
          yAxis: 1,
          color: "#E11D48",
          borderColor: "#E11D48",
          marker: {
            enabled: false,
            states: {
              hover: {
                enabled: false,
              },
            },
          },
          zIndex: 1, // Lowest z-index
        },
      ],
    };

    return options;
  }
  $: {
    if ($stockTicker || $etfTicker || $mode) {
      const ticker = $assetType === "stock" ? $stockTicker : $etfTicker;
      if (ticker) {
        if (rawData?.length > 0) {
          weightedFTD = (
            (rawData?.slice(-1)?.at(0)?.failToDeliver /
              data?.getStockQuote?.avgVolume) *
            100
          )?.toFixed(2);
          config = plotData();
          if (!initialized) {
            loadRowsPerPage();
            changeTimePeriod(0);
            initialized = true;
          } else {
            computeTableData();
          }
        }
      }
    }
  }
</script>

<section class="overflow-hidden h-full pb-8">
  <main class="overflow-hidden">
    <div class="flex flex-row items-center w-full mt-3">
      <h1 class="text-xl sm:text-2xl font-bold">FTD Chart</h1>
    </div>

    {#if rawData?.length > 0}
      <div class="text-[1rem] mt-2 mb-2 w-full">
        As of <strong
          >{new Date(rawData?.slice(-1)?.at(0)?.date).toLocaleDateString(
            "en-US",
            { month: "short", day: "numeric", year: "numeric" },
          )}</strong
        >,
        <strong>{$displayCompanyName}</strong> has
        <strong
          >{rawData
            ?.slice(-1)
            ?.at(0)
            ?.failToDeliver?.toLocaleString("en-US")}</strong
        >
        shares failed to deliver, representing <strong>{weightedFTD}%</strong>
        of the average daily volume of
        <strong
          >{data?.getStockQuote?.avgVolume?.toLocaleString("en-US")}</strong
        >
        shares.
      </div>

      <div
        class="chart-driver shadow mt-5 border border-gray-300 dark:border-gray-800 rounded"
        use:highcharts={config}
      ></div>

      <div
        class="mt-5 flex flex-col sm:flex-row items-start sm:items-center w-full justify-between sm:border-y border-gray-300 dark:border-gray-800 sm:pt-2 sm:pb-2"
      >
        <h3 class="history-driver text-xl sm:text-2xl font-bold mb-2 sm:mb-0">
          FTD History
        </h3>

        <div class="inline-flex ml-auto mt-2 sm:mt-0">
          <div class="inline-flex rounded-lg shadow-sm">
            {#each tabs as item, i}
              <button
                on:click={() => changeTimePeriod(i)}
                class="cursor-pointer px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none transition-colors duration-50
                          {i === 0 ? 'rounded-l border' : ''}
                          {i === tabs.length - 1
                  ? 'rounded-r border-t border-r border-b'
                  : ''}
                          {i !== 0 && i !== tabs.length - 1
                  ? 'border-t border-b'
                  : ''}
                          {activeIdx === i
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-white  border-gray-300 sm:hover:bg-gray-100 dark:bg-primary dark:border-gray-800'}"
              >
                {item.title}
              </button>
            {/each}
          </div>
          <div class="ml-2">
            <DownloadData {data} {rawData} title={`ftd_data_${$stockTicker}`} />
          </div>
        </div>
      </div>

      <div class="w-full overflow-x-auto">
        <table
          class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto mt-4"
        >
          <thead class="text-white bg-default">
            <TableHeader {columns} {sortOrders} {sortData} />
          </thead>
          <tbody>
            {#each displayList as item}
              <tr
                class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
              >
                <td class=" text-sm sm:text-[1rem] whitespace-nowrap">
                  {formatDisplayDate(item?.date)}
                </td>

                <td class=" text-sm sm:text-[1rem] whitespace-nowrap">
                  {formatDisplayDate(item?.tPlus35Date)}
                </td>

                <td
                  class=" text-sm sm:text-[1rem] text-right whitespace-nowrap"
                >
                  {typeof item?.price === "number"
                    ? item.price.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "n/a"}
                </td>

                <td
                  class=" text-sm sm:text-[1rem] text-right whitespace-nowrap"
                >
                  {abbreviateNumber(item?.tradeVolume)}
                </td>

                <td
                  class=" text-sm sm:text-[1rem] text-right whitespace-nowrap"
                >
                  {item?.failToDeliver?.toLocaleString("en-US")}
                </td>

                <td
                  class=" text-sm sm:text-[1rem] {item?.ftdChange > 0
                    ? "text-emerald-600 dark:text-emerald-400 before:content-['+'] "
                    : item?.ftdChange < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : ''} text-right whitespace-nowrap"
                >
                  {typeof item?.ftdChange === "number"
                    ? item.ftdChange.toLocaleString("en-US")
                    : "n/a"}
                </td>

                <td
                  class=" text-sm sm:text-[1rem] {item?.ftdChangePercentage > 0
                    ? "text-emerald-600 dark:text-emerald-400 before:content-['+'] "
                    : item?.ftdChangePercentage < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : ''} text-right whitespace-nowrap"
                >
                  {typeof item?.ftdChangePercentage === "number"
                    ? `${item.ftdChangePercentage.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}%`
                    : "n/a"}
                </td>
                <td
                  class=" text-sm sm:text-[1rem] text-right whitespace-nowrap"
                >
                  {typeof item?.notionalValue === "number"
                    ? item.notionalValue.toLocaleString("en-US")
                    : "n/a"}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if displayList?.length > 0}
        <div class="flex flex-row items-center justify-between mt-8 sm:mt-5">
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
      {/if}
    {/if}
  </main>
</section>

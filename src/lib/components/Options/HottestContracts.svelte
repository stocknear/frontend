<script lang="ts">
  import {
    stock_detail_options_common_back_to_top,
    stock_detail_options_common_call,
    stock_detail_options_common_next,
    stock_detail_options_common_page_of,
    stock_detail_options_common_previous,
    stock_detail_options_common_put,
    stock_detail_options_common_rows,
    stock_detail_options_hottest_col_dte,
    stock_detail_options_hottest_col_iv,
    stock_detail_options_hottest_col_last,
    stock_detail_options_hottest_col_low_high,
    stock_detail_options_hottest_col_oi,
    stock_detail_options_hottest_col_oi_change,
    stock_detail_options_hottest_col_option_symbol,
    stock_detail_options_hottest_col_otm,
    stock_detail_options_hottest_col_prem,
    stock_detail_options_hottest_col_type,
    stock_detail_options_hottest_col_volume,
    stock_detail_options_hottest_contracts_count,
    stock_detail_options_hottest_intro_oi,
    stock_detail_options_hottest_intro_volume,
    stock_detail_options_hottest_option_call,
    stock_detail_options_hottest_option_put,
  } from "$lib/paraglide/messages";
  import { screenWidth } from "$lib/store";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { page } from "$app/stores";
  import { onMount } from "svelte";

  export let data;
  export let ticker;
  export let title;
  export let type;
  export let assetType;

  let isLoaded = false;
  let config = null;

  let rawDataHistory = [];
  let rawData = [];
  let sortedData = [];
  let displayList = [];

  // Pagination state
  let currentPage = 1;
  let rowsPerPage = 20;
  let rowsPerPageOptions = [20, 50, 100];
  let totalPages = 1;
  let pagePathName = $page?.url?.pathname;

  const currentTime = new Date(
    new Date().toLocaleString("en-US", { timeZone: "UTC" }),
  )?.getTime();

  function convertDateFormat(dateString) {
    if (!dateString || typeof dateString !== "string") {
      return null;
    }
    const parts = dateString.split("-");
    if (parts.length !== 3) {
      return null;
    }
    const [year, month, day] = parts;
    if (!year || !month || !day || year.length !== 4) {
      return null;
    }
    return `${month}/${day}/${year?.slice(-2)}`;
  }

  function initialize() {
    rawDataHistory = [];
    if (type === "oi") {
      rawData = data?.getData?.openInterest?.map((item) => ({
        ...item,
        dte: daysLeft(item?.date_expiration),
        otm: computeOTM(item?.strike_price, item?.option_type),
      }));
    } else {
      rawData = data?.getData?.volume?.map((item) => ({
        ...item,
        dte: daysLeft(item?.date_expiration),
        otm: computeOTM(item?.strike_price, item?.option_type),
      }));
    }
    sortedData = [...rawData];
    updatePaginatedData();
  }

  function computeOTM(strikePrice, optionType) {
    const currentPrice = data?.getStockQuote?.price;
    let otmPercentage = 0;

    if (optionType === "C") {
      otmPercentage = (
        ((strikePrice - currentPrice) / currentPrice) *
        100
      )?.toFixed(2);
    } else if (optionType === "P") {
      otmPercentage = (
        ((currentPrice - strikePrice) / currentPrice) *
        100
      )?.toFixed(2);
    } else {
      otmPercentage = "n/a";
    }

    return otmPercentage;
  }

  function daysLeft(targetDate) {
    const targetTime = new Date(targetDate).getTime();
    const difference = targetTime - currentTime;
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const daysLeft = Math?.ceil(difference / millisecondsPerDay);
    return daysLeft + "D";
  }

  // Pagination functions
  function updatePaginatedData() {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    displayList = sortedData?.slice(startIndex, endIndex) || [];
    totalPages = Math.ceil((sortedData?.length || 0) / rowsPerPage);
  }

  function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      updatePaginatedData();
    }
  }

  function changeRowsPerPage(newRowsPerPage) {
    rowsPerPage = newRowsPerPage;
    currentPage = 1;
    updatePaginatedData();
    saveRowsPerPage();
  }

  function saveRowsPerPage() {
    if (!pagePathName || typeof localStorage === "undefined") return;
    try {
      const paginationKey = `${pagePathName}_rowsPerPage`;
      localStorage.setItem(paginationKey, String(rowsPerPage));
    } catch (e) {
      console.warn("Failed to save rows per page preference:", e);
    }
  }

  function loadRowsPerPage() {
    const currentPath = pagePathName || $page?.url?.pathname;
    if (!currentPath || typeof localStorage === "undefined") {
      rowsPerPage = 20;
      return;
    }
    try {
      const paginationKey = `${currentPath}_rowsPerPage`;
      const savedRows = localStorage.getItem(paginationKey);
      if (savedRows && rowsPerPageOptions.includes(Number(savedRows))) {
        rowsPerPage = Number(savedRows);
      } else {
        rowsPerPage = 20;
      }
    } catch (e) {
      console.warn("Failed to load rows per page preference:", e);
      rowsPerPage = 20;
    }
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  onMount(async () => {
    loadRowsPerPage();
    updatePaginatedData();
  });

  $: columns = [
    {
      key: "strike_price",
      label: stock_detail_options_hottest_col_type(),
      align: "left",
    },
    {
      key: "dte",
      label: stock_detail_options_hottest_col_dte(),
      align: "right",
    },
    {
      key: "otm",
      label: stock_detail_options_hottest_col_otm(),
      align: "right",
    },
    {
      key: "last",
      label: stock_detail_options_hottest_col_last(),
      align: "right",
    },
    {
      key: "high",
      label: stock_detail_options_hottest_col_low_high(),
      align: "right",
    },
    {
      key: "volume",
      label: stock_detail_options_hottest_col_volume(),
      align: "right",
    },
    {
      key: "open_interest",
      label: stock_detail_options_hottest_col_oi(),
      align: "right",
    },
    {
      key: "changeOI",
      label: stock_detail_options_hottest_col_oi_change(),
      align: "right",
    },
    { key: "iv", label: stock_detail_options_hottest_col_iv(), align: "right" },
    {
      key: "total_premium",
      label: stock_detail_options_hottest_col_prem(),
      align: "right",
    },
    {
      key: "option_symbol",
      label: stock_detail_options_hottest_col_option_symbol(),
      align: "right",
    },
  ];

  $: sortOrders = {
    strike_price: { order: "none", type: "number" },
    dte: { order: "none", type: "number" },
    otm: { order: "none", type: "number" },
    last: { order: "none", type: "number" },
    high: { order: "none", type: "number" },
    volume: { order: "none", type: "number" },
    open_interest: { order: "none", type: "number" },
    changeOI: { order: "none", type: "number" },
    iv: { order: "none", type: "number" },
    total_premium: { order: "none", type: "number" },
    option_symbol: { order: "none", type: "string" },
  };

  const sortData = (key) => {
    for (const k in sortOrders) {
      if (k !== key) {
        sortOrders[k].order = "none";
      }
    }

    const orderCycle = ["none", "asc", "desc"];
    const currentOrderIndex = orderCycle.indexOf(sortOrders[key].order);
    sortOrders[key].order =
      orderCycle[(currentOrderIndex + 1) % orderCycle.length];
    const sortOrder = sortOrders[key].order;

    if (sortOrder === "none") {
      sortedData = [...rawData];
      currentPage = 1;
      updatePaginatedData();
      return;
    }

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

    sortedData = [...rawData].sort(compareValues);
    currentPage = 1;
    updatePaginatedData();
  };

  // Reactive statement to load pagination settings when page changes
  $: if ($page?.url?.pathname && $page?.url?.pathname !== pagePathName) {
    pagePathName = $page?.url?.pathname;
    loadRowsPerPage();
    updatePaginatedData();
  }

  function plotBarChart() {
    let chartSortedData = [];
    if (type === "oi") {
      chartSortedData = [...rawData]
        ?.sort((a, b) => b?.open_interest - a?.open_interest)
        ?.slice(0, 20);
    } else {
      chartSortedData = [...rawData]
        ?.sort((a, b) => b?.volume - a?.volume)
        ?.slice(0, 20);
    }

    const categories = chartSortedData?.map(
      (item) =>
        `${convertDateFormat(item.date_expiration)} ${item.strike_price}${item.option_type}`,
    );
    const chartData = chartSortedData.map((item) => ({
      y: type === "oi" ? item.open_interest : item.volume,
      color: item.option_type === "P" ? "#f87171" : "#34d399",
      originalData: item,
    }));

    const options = {
      credits: {
        enabled: false,
      },
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        type: "bar",
        height: 360,
        animation: false,
      },
      title: { text: null },
      xAxis: {
        categories,
        title: null,
        labels: {
          style: {
            color: $mode === "light" ? "#09090B" : "white",
            fontSize: "12px",
            fontWeight: "400",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden",
          },
          useHTML: true,
          formatter: function () {
            return this.value;
          },
        },
        lineWidth: 0,
        tickLength: 0,
      },
      yAxis: {
        min: 0,
        title: null,
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
        },
        gridLineWidth: 0,
        lineWidth: 0,
        tickLength: 0,
      },
      plotOptions: {
        series: {
          pointWidth: 10,
        },
        bar: {
          dataLabels: {
            enabled: true,
            inside: false,
            align: "right",
            style: {
              color: "#000",
              fontSize: "12.5px",
              fontWeight: "550",
              textOutline: "none",
            },
            formatter: function () {
              return this.y?.toLocaleString("en-US");
            },
          },
          borderWidth: 0,
          pointPadding: $screenWidth < 640 ? 0.02 : 0.18,
          groupPadding: $screenWidth < 640 ? 0.4 : -0.1,
          animation: false,
          states: {
            hover: { enabled: false },
            inactive: { enabled: false },
          },
        },
      },
      tooltip: {
        shared: false,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 1)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        style: {
          color: "#fff",
          fontSize: "16px",
          padding: "10px",
        },
        borderRadius: 4,
        formatter: function () {
          const originalItem = this.point.originalData;
          let tooltipContent = `<span class="m-auto text-xs">${ticker} ${convertDateFormat(originalItem?.date_expiration)} ${originalItem.strike_price}${originalItem.option_type}</span><br>`;
          tooltipContent += `<span class="font-normal text-sm">${type === "oi" ? "OI" : "Volume"}: ${this.y?.toLocaleString("en-US")}</span><br>`;
          return tooltipContent;
        },
      },
      series: [
        {
          name: "Open Interest",
          data: chartData,
          animation: false,
        },
      ],
      legend: { enabled: false },
    };
    return options;
  }

  $: {
    if (ticker && typeof window !== "undefined") {
      isLoaded = false;
      initialize();
      config = plotBarChart() || null;
      isLoaded = true;
    }
  }
</script>

<section class="w-full overflow-hidden">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto mt-2 sm:mt-0">
        <h2
          class="flex flex-row items-center text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white w-fit"
        >
          {ticker}
          {title}
        </h2>

        {#if rawData?.length > 0}
          <p
            class="mt-4 text-sm text-gray-800 dark:text-zinc-300 leading-relaxed"
          >
            {@html type === "oi"
              ? stock_detail_options_hottest_intro_oi({
                  count: Math.max(
                    ...rawData?.map((item) => item?.open_interest || 0),
                  )?.toLocaleString("en-US"),
                  strike: rawData?.find(
                    (item) =>
                      item?.open_interest ===
                      Math.max(...rawData?.map((i) => i?.open_interest || 0)),
                  )?.strike_price,
                  optionType:
                    rawData?.find(
                      (item) =>
                        item?.open_interest ===
                        Math.max(...rawData?.map((i) => i?.open_interest || 0)),
                    )?.option_type === "C"
                      ? stock_detail_options_hottest_option_call()
                      : stock_detail_options_hottest_option_put(),
                  avgIv: (
                    rawData
                      ?.filter((item) => item?.iv)
                      ?.reduce((sum, item) => sum + parseFloat(item.iv), 0) /
                      rawData?.filter((item) => item?.iv)?.length || 0
                  )?.toFixed(2),
                })
              : stock_detail_options_hottest_intro_volume({
                  count: Math.max(
                    ...rawData?.map((item) => item?.volume || 0),
                  )?.toLocaleString("en-US"),
                  strike: rawData?.find(
                    (item) =>
                      item?.volume ===
                      Math.max(...rawData?.map((i) => i?.volume || 0)),
                  )?.strike_price,
                  optionType:
                    rawData?.find(
                      (item) =>
                        item?.volume ===
                        Math.max(...rawData?.map((i) => i?.volume || 0)),
                    )?.option_type === "C"
                      ? stock_detail_options_hottest_option_call()
                      : stock_detail_options_hottest_option_put(),
                  avgIv: (
                    rawData
                      ?.filter((item) => item?.iv)
                      ?.reduce((sum, item) => sum + parseFloat(item.iv), 0) /
                      rawData?.filter((item) => item?.iv)?.length || 0
                  )?.toFixed(2),
                })}
          </p>
        {/if}

        {#if config}
          <div
            class="sm:p-3 border border-gray-300 dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 mt-4 mb-4"
            use:highcharts={config}
          ></div>
        {/if}

        <div class="items-center lg:overflow-visible px-1 py-1 mt-5">
          <div
            class="col-span-2 flex flex-row items-center grow py-1 border-t border-b border-gray-300 dark:border-zinc-700"
          >
            <h2
              class="text-start whitespace-nowrap text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white w-full"
            >
              {stock_detail_options_hottest_contracts_count({
                count: (rawData?.length || 0)?.toLocaleString("en-US"),
              })}
            </h2>
            <div
              class="mt-1 w-full flex flex-row lg:flex order-1 items-center ml-auto pb-1 pt-1 sm:pt-0 w-full order-0 lg:order-1"
            >
              <div class="ml-auto">
                <DownloadData
                  {data}
                  {rawData}
                  title={`${ticker}_hottest_${type}_options_contracts`}
                />
              </div>
            </div>
          </div>
        </div>

        <div class="mt-3 w-full m-auto mb-4 overflow-x-auto">
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
                {#each data?.user?.tier === "Pro" ? displayList : displayList?.slice(0, 3) as item, index}
                  <tr
                    class="transition-colors relative {index + 1 ===
                      displayList?.slice(0, 3)?.length &&
                    !['Pro']?.includes(data?.user?.tier)
                      ? 'opacity-[0.1]'
                      : ''}"
                  >
                    <td
                      class="text-sm text-start whitespace-nowrap flex flex-row items-center justify-between"
                    >
                      <span
                        class={item?.option_type === "C"
                          ? "dark:text-[#00FC50]"
                          : "dark:text-[#FF2F1F]"}
                      >
                        {item?.option_type === "C"
                          ? stock_detail_options_common_call()
                          : stock_detail_options_common_put()}
                        {" " + item?.strike_price}
                      </span>
                    </td>
                    <td class="text-sm text-end whitespace-nowrap">
                      {item?.dte}
                    </td>
                    <td class="text-sm text-end whitespace-nowrap">
                      {item?.otm}%
                    </td>
                    <td class="text-sm text-end whitespace-nowrap">
                      {item?.last ?? "n/a"}
                    </td>
                    <td class="text-sm text-end whitespace-nowrap">
                      {#if item?.low && item?.high}
                        {item?.low}-{item?.high}
                      {:else}
                        n/a
                      {/if}
                    </td>
                    <td class="text-sm text-end whitespace-nowrap">
                      {item?.volume?.toLocaleString("en-US")}
                    </td>
                    <td class="text-sm text-end whitespace-nowrap">
                      {item?.open_interest?.toLocaleString("en-US")}
                    </td>
                    <td class="text-sm text-end whitespace-nowrap">
                      {#if item?.changeOI >= 0}
                        <span class="text-emerald-800 dark:text-emerald-400"
                          >+{item?.changeOI?.toLocaleString("en-US")}</span
                        >
                      {:else if item?.changeOI < 0}
                        <span class="text-rose-800 dark:text-rose-400"
                          >{item?.changeOI?.toLocaleString("en-US")}</span
                        >
                      {:else}
                        n/a
                      {/if}
                    </td>
                    <td class="text-sm text-end">
                      {item?.iv ? item?.iv + "%" : "n/a"}
                    </td>
                    <td class="text-sm text-end whitespace-nowrap">
                      ${item?.total_premium?.toLocaleString("en-US")}
                    </td>

                    <td class="text-sm text-end whitespace-nowrap">
                      <a
                        href={`/${["stocks", "stock"]?.includes(assetType) ? "stocks" : assetType === "etf" ? "etf" : "index"}/${ticker}/options/contract-lookup?contract=${item?.option_symbol}`}
                        class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                      >
                        {item?.option_symbol}
                      </a>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pagination controls -->
        {#if displayList?.length > 0 && totalPages > 0}
          <div class="flex flex-row items-center justify-between mt-8 sm:mt-5">
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
                <span class="hidden sm:inline"
                  >{stock_detail_options_common_previous()}</span
                >
              </Button>
            </div>

            <!-- Page info and rows selector in center -->
            <div class="flex flex-row items-center gap-4">
              <span class="text-sm text-gray-600 dark:text-zinc-300">
                {stock_detail_options_common_page_of({
                  current: currentPage,
                  total: totalPages,
                })}
              </span>

              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild let:builder>
                  <Button
                    builders={[builder]}
                    class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span class="truncate text-[0.85rem] sm:text-sm"
                      >{stock_detail_options_common_rows({
                        count: rowsPerPage,
                      })}</span
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
                  <DropdownMenu.Group class="pb-2">
                    {#each rowsPerPageOptions as item}
                      <DropdownMenu.Item
                        class="text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
                      >
                        <label
                          on:click={() => changeRowsPerPage(item)}
                          class="inline-flex justify-between w-full items-center cursor-pointer"
                        >
                          <span class="text-sm"
                            >{stock_detail_options_common_rows({
                              count: item,
                            })}</span
                          >
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
                <span class="hidden sm:inline"
                  >{stock_detail_options_common_next()}</span
                >
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
              {stock_detail_options_common_back_to_top()}
              <svg
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

        <UpgradeToPro {data} display={true} />
      </div>
    </div>
  </div>
</section>

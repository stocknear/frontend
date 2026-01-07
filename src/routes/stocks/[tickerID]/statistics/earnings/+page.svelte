<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import { onMount } from "svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import NextEarnings from "$lib/components/NextEarnings.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";

  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";

  export let data;

  // raw earnings & prices from backend
  let rawData: Array<any> = data?.getData?.historicalEarnings || [];

  // ensure data is sorted descending by earnings date (latest first)
  rawData = [...rawData].sort(
    (a, b) => new Date(b?.date).getTime() - new Date(a?.date).getTime(),
  );
  let baseTableData: Array<any> = [];
  let tableList: Array<any> = [];
  let paginatedTableList: Array<any> = [];

  const todayDateStr = new Date().toISOString().slice(0, 10);

  let timeFrame = "3Y";
  let timeIdx = 0;
  const tabs = ["EPS Surprise", "Revenue Surprise"];

  function isFutureDate(dateStr: string) {
    if (!dateStr) return false;
    // dates are in 'YYYY-MM-DD' so lexicographic compare works
    return dateStr > todayDateStr;
  }

  function safeParseFloat(v: any, fallback = 0) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function normalizePercentValue(value: any): number | null {
    const parsed = safeParseFloat(value, NaN);
    if (!Number.isFinite(parsed)) {
      return null;
    }
    return Math.abs(parsed) <= 1 ? parsed * 100 : parsed;
  }

  function calculateSurprisePercent(
    actualValue: any,
    estimateValue: any,
    providedPercent: any,
  ): number {
    const actual = safeParseFloat(actualValue, NaN);
    const estimate = safeParseFloat(estimateValue, NaN);

    if (
      Number.isFinite(actual) &&
      Number.isFinite(estimate) &&
      Math.abs(estimate) > 1e-8
    ) {
      const surprise = ((actual - estimate) / Math.abs(estimate)) * 100;
      if (Number.isFinite(surprise)) {
        return surprise;
      }
    }

    const normalizedProvided = normalizePercentValue(providedPercent);
    return normalizedProvided ?? 0;
  }

  // Function to change surprise type
  function changeSurprise(index: number) {
    timeIdx = index;
  }

  // Chart config
  let config = null;

  function plotData() {
    if (!rawData || rawData.length === 0) {
      return {};
    }

    // Filter data based on timeFrame
    const filterByTimeFrame = (data: Array<any>) => {
      const now = new Date();
      const cutoffDate = new Date();

      switch (timeFrame) {
        case "3Y":
          cutoffDate.setFullYear(now.getFullYear() - 3);
          break;
        case "5Y":
          cutoffDate.setFullYear(now.getFullYear() - 5);
          break;
        default:
          return data; // Return all data if no filter
      }

      return data.filter((item) => new Date(item.date) >= cutoffDate);
    };

    // Apply time filter and sort ascending for plotting
    const filteredData = filterByTimeFrame(rawData);
    const sortedEarnings = [...filteredData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Prepare categories with fiscal year format
    const categories = sortedEarnings.map((item) => {
      const shortYear = String(item.period_year).slice(-2);
      return `FY${shortYear} ${item.period}`;
    });

    // Prepare data based on selected tab
    let dataList: number[] = [];
    let seriesName = "";
    let seriesColor = "";

    if (timeIdx === 0) {
      // EPS Surprise selected
      dataList = sortedEarnings.map((item) => {
        return calculateSurprisePercent(
          item.eps,
          item.eps_est,
          item.eps_surprise_percent,
        );
      });
      seriesName = "EPS Surprise";
      seriesColor = $mode === "dark" ? "#60a5fa" : "#2C6288";
    } else {
      // Revenue Surprise selected
      dataList = sortedEarnings.map((item) => {
        return calculateSurprisePercent(
          item.revenue,
          item.revenue_est,
          item.revenue_surprise_percent,
        );
      });
      seriesName = "Revenue Surprise";
      seriesColor = $mode === "dark" ? "#fbbf24" : "#ea580c";
    }

    const isDarkMode = $mode === "dark";
    const textColor = isDarkMode ? "#a1a1aa" : "#6b7280";
    const titleColor = isDarkMode ? "#f4f4f5" : "#111827";
    const bgColor = isDarkMode ? "#09090B" : "#fff";
    const gridColor = isDarkMode ? "#27272a" : "#e5e7eb";
    const zeroLineColor = isDarkMode ? "#3f3f46" : "#9ca3af";

    const options = {
      credits: {
        enabled: false,
      },
      chart: {
        type: "column",
        backgroundColor: bgColor,
        plotBackgroundColor: bgColor,
        height: 360,
        animation: false,
      },
      title: {
        text: `<h3 class="mt-3 mb-1 text-sm font-semibold tracking-tight">${seriesName}</h3>`,
        style: {
          color: titleColor,
        },
        useHTML: true,
      },
      xAxis: {
        categories,
        gridLineWidth: 0,
        labels: {
          style: {
            color: textColor,
            fontSize: "11px",
          },
          rotation: -45,
          align: "right",
          step:
            categories.length > 20 ? 2 : categories.length > 12 ? 1 : undefined,
        },
      },
      yAxis: {
        gridLineWidth: 1,
        gridLineColor: gridColor,
        labels: {
          style: { color: textColor },
          formatter: function () {
            return this.value + "%";
          },
        },
        title: { text: null },
        opposite: true,
        plotLines: [
          {
            value: 0,
            color: zeroLineColor,
            width: 1,
            zIndex: 5,
          },
        ],
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
          const categoryLabel = this.x;
          const pointIndex = this.point.index;
          const earnings = sortedEarnings[pointIndex];
          const valueColor = this.y >= 0 ? "#22c55e" : "#ef4444";

          let tooltipContent = `<span class="m-auto text-sm font-[501]">${categoryLabel}</span><br>`;

          tooltipContent += `
            <span style="display:inline-block; width:10px; height:10px; background-color:${seriesColor}; border-radius:50%; margin-right:5px;"></span>
            <span class="font-semibold text-sm">${seriesName}:</span> 
            <span class="font-normal text-sm" style="color:${valueColor};">${this.y >= 0 ? "+" : ""}${this.y.toFixed(2)}%</span><br>`;

          // Add actual vs estimate details
          if (earnings) {
            tooltipContent += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2);">`;

            if (timeIdx === 0) {
              // Show EPS details
              tooltipContent += `<span class="text-xs opacity-80">EPS: ${earnings.eps} (Est: ${earnings.eps_est})</span><br>`;
              if (earnings.eps_surprise) {
                tooltipContent += `<span class="text-xs opacity-80">Surprise: ${earnings.eps_surprise}</span>`;
              }
            } else {
              // Show Revenue details
              if (earnings.revenue) {
                tooltipContent += `<span class="text-xs opacity-80">Revenue: ${abbreviateNumber(earnings.revenue)}</span><br>`;
                tooltipContent += `<span class="text-xs opacity-80">Estimate: ${abbreviateNumber(earnings.revenue_est || 0)}</span><br>`;
                if (earnings.revenue_surprise) {
                  tooltipContent += `<span class="text-xs opacity-80">Surprise: ${abbreviateNumber(earnings.revenue_surprise)}</span>`;
                }
              }
            }
            tooltipContent += `</div>`;
          }

          return tooltipContent;
        },
      },
      plotOptions: {
        column: {
          grouping: false,
          shadow: false,
          borderWidth: 0,
          animation: false,
          colorByPoint: true,
          colors: dataList.map((val) =>
            val >= 0
              ? isDarkMode
                ? "#10b981"
                : "#059669"
              : isDarkMode
                ? "#ef4444"
                : "#dc2626",
          ),
          dataLabels: {
            enabled: true,
            color: isDarkMode ? "#e4e4e7" : "#111827",
            style: {
              fontSize: "11px",
              fontWeight: "bold",
              textOutline: isDarkMode ? "1px #18181b" : "1px #ffffff",
            },
            formatter: function () {
              if (Math.abs(this.y) < 0.5) return ""; // Hide very small values
              return (this.y > 0 ? "+" : "") + this.y.toFixed(1) + "%";
            },
          },
        },
        series: {
          animation: false,
        },
      },
      legend: {
        enabled: false,
      },
      series: [
        {
          name: seriesName,
          data: dataList,
          color: seriesColor,
        },
      ],
    };

    return options;
  }

  // Table columns & sorting
  let columns = [
    { key: "period_year", label: "Period", align: "left" },
    { key: "date", label: "Date", align: "right" },
    { key: "eps", label: "EPS", align: "right" },
    { key: "eps_est", label: "EPS Est.", align: "right" },
    { key: "revenue", label: "Revenue", align: "right" },
    { key: "revenue_est", label: "Rev Est.", align: "right" },
  ];

  let sortOrders = {
    period_year: { order: "none", type: "string" },
    date: { order: "none", type: "date" },
    period: { order: "none", type: "string" },
    eps: { order: "none", type: "number" },
    eps_est: { order: "none", type: "number" },
    revenue: { order: "none", type: "number" },
    revenue_est: { order: "none", type: "number" },
  };

  const DEFAULT_ROWS_PER_PAGE = 20;
  const rowsPerPageOptions = [20, 50, 100];
  let rowsPerPage = DEFAULT_ROWS_PER_PAGE;
  let currentPage = 1;
  let totalPages = 1;
  let pagePathName = "";

  function getPaginationKey() {
    if (!browser) return null;
    const currentPath = window.location.pathname || "";
    if (!currentPath) return null;
    pagePathName = currentPath;
    return `${currentPath}_earnings_rowsPerPage`;
  }

  function loadRowsPerPageFromStorage() {
    const key = getPaginationKey();
    if (!key) return rowsPerPage;
    try {
      const savedRows = localStorage.getItem(key);
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
    const key = getPaginationKey();
    if (!key) return;
    try {
      localStorage.setItem(key, String(value));
    } catch (e) {
      console.warn("Failed to save rows per page preference:", e);
    }
  }

  function prepareBaseTableData(dataset: Array<any>) {
    return [...dataset]
      .filter((item) => !isFutureDate(item?.date ?? ""))
      .sort(
        (a, b) => new Date(b?.date).getTime() - new Date(a?.date).getTime(),
      );
  }

  function compareForSort(
    a: any,
    b: any,
    key: string,
    type: "date" | "number" | "string",
    order: "asc" | "desc",
  ) {
    const direction = order === "asc" ? 1 : -1;

    if (key === "period") {
      const periodA = `${a?.period ?? ""} ${a?.period_year ?? ""}`;
      const periodB = `${b?.period ?? ""} ${b?.period_year ?? ""}`;
      return periodA.localeCompare(periodB) * direction;
    }

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

    if (type === "number") {
      const rawA = safeParseFloat(a?.[key], 0);
      const rawB = safeParseFloat(b?.[key], 0);
      if (rawA === rawB) return 0;
      return rawA < rawB ? -1 * direction : 1 * direction;
    }

    const valueA = (a?.[key] ?? "").toString().toLowerCase();
    const valueB = (b?.[key] ?? "").toString().toLowerCase();
    return valueA.localeCompare(valueB) * direction;
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

  const sortData = (key) => {
    if (!sortOrders[key]) {
      return;
    }

    const updatedSortOrders = { ...sortOrders };
    for (const sortKey in updatedSortOrders) {
      if (sortKey !== key) {
        updatedSortOrders[sortKey].order = "none";
      }
    }

    const orderCycle = ["none", "asc", "desc"];
    const currentIndex = orderCycle.indexOf(updatedSortOrders[key].order);
    updatedSortOrders[key].order =
      orderCycle[(currentIndex + 1) % orderCycle.length];
    sortOrders = updatedSortOrders;

    refreshTable({ resetPage: true });
  };

  function updateBaseTableData(dataset: Array<any>) {
    baseTableData = prepareBaseTableData(dataset);
    refreshTable({ resetPage: true });
  }

  onMount(() => {
    if (!browser) return;
    const storedRows = loadRowsPerPageFromStorage();
    if (storedRows !== rowsPerPage) {
      rowsPerPage = storedRows;
      refreshTable({ resetPage: true });
    }
  });

  updateBaseTableData(rawData);

  $: {
    if ($mode || timeFrame || timeIdx) {
      config = plotData();
    }
  }
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Earnings Surprise Analysis | EPS & Revenue Impact`}
  description={`In-depth analysis of earnings surprises for ${$displayCompanyName} (${$stockTicker}), tracking EPS and revenue beats or misses. Explore historical earnings impact on stock price and performance trends.`}
  keywords={`${$stockTicker} earnings surprise, ${$displayCompanyName} EPS surprise, revenue surprise, earnings analysis, historical stock price, EPS beats, revenue beats`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/statistics/earnings`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataAnalysis"],
    name: `${$displayCompanyName} Earnings Surprise Analysis`,
    description: `Detailed tracking of EPS and revenue surprises for ${$displayCompanyName} (${$stockTicker}), with historical stock price reactions and performance insights.`,
    url: `https://stocknear.com/stocks/${$stockTicker}/statistics/earnings`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "EPS surprise analysis",
      "Revenue surprise tracking",
      "Historical earnings data",
      "Stock price reaction to surprises",
      "Quarterly and annual performance trends",
      "Post-earnings impact visualization",
      "Data-driven investing insights",
      "Earnings beat/miss evaluation",
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
      name: "Earnings Surprise Analysis",
      description:
        "Professional analysis of EPS and revenue surprises and their impact on stock price and performance.",
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
              Earnings Surprise
            </h1>
          </div>

          {#if rawData?.length > 0}
            <div class="grid grid-cols-1 gap-2">
              {#if data?.getNextEarnings && Object.keys(data.getNextEarnings).length > 0 && data?.getEarningsSurprise?.date !== data.getNextEarnings?.date}
                <div class="mt-3 mb-3">
                  <NextEarnings {data} hideTitle={true} />
                </div>
              {/if}

              <div
                class="flex flex-col sm:flex-row items-start sm:items-center w-full justify-between border-t border-b border-gray-300 dark:border-zinc-700 py-2"
              >
                <h2
                  class="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
                >
                  Earnings Chart
                </h2>
                <div class="sm:ml-auto">
                  <div class="inline-flex mt-2 sm:mt-0">
                    <div
                      class="w-fit text-sm flex items-center gap-1 rounded-full border border-gray-300 shadow dark:border-zinc-700
           "
                    >
                      {#each tabs as item, i (item)}
                        <button
                          on:click={() => changeSurprise(i)}
                          class="cursor-pointer font-medium rounded-full px-3 py-1.5 focus:z-10 focus:outline-none transition-all
          {timeIdx === i
                            ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                            : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'}"
                        >
                          {item}
                        </button>
                      {/each}
                    </div>
                  </div>

                  <div class="ml-1 relative inline-block">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild let:builder>
                        <Button
                          builders={[builder]}
                          class="flex-shrink-0 w-full sm:w-fit transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <span class="truncate">{timeFrame}</span>
                          <svg
                            class="-mr-1 ml-1 h-5 w-5 xs:ml-2 inline-block"
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
                        class="h-fit max-h-72 overflow-y-auto scroller rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
                      >
                        <DropdownMenu.Group>
                          {#each ["3Y", "5Y", "MAX"] as item, index}
                            {#if ["Plus", "Pro"]?.includes(data?.user?.tier) || index === 0}
                              <DropdownMenu.Item
                                on:click={() => (timeFrame = item)}
                                class="cursor-pointer text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400"
                              >
                                {item}
                              </DropdownMenu.Item>
                            {:else}
                              <DropdownMenu.Item
                                on:click={() => goto("/pricing")}
                                class="cursor-pointer text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400"
                              >
                                {item}
                                <svg
                                  class="ml-1 size-4"
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
                              </DropdownMenu.Item>
                            {/if}
                          {/each}
                        </DropdownMenu.Group>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </div>
                </div>
              </div>

              <div class="chart-driver mb-3">
                <div class="grow">
                  <div class="relative">
                    <div
                      class="border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40"
                      use:highcharts={config}
                    ></div>
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
                    History
                  </h3>

                  <div class=" w-full flex order-1 items-center ml-auto">
                    <div class="ml-auto">
                      <DownloadData
                        {data}
                        rawData={baseTableData}
                        title={`earnings_${$stockTicker}`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div class=" w-full m-auto mb-4 overflow-x-auto">
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
                      {#each paginatedTableList as item}
                        {#if !isFutureDate(item.date)}
                          <tr class="transition-colors">
                            <td class="text-sm text-start whitespace-nowrap">
                              FY{String(item?.period_year)?.slice(-2)}
                              {item.period}
                            </td>

                            <td class="text-sm text-end whitespace-nowrap">
                              {new Date(item.date).toLocaleDateString("en-US", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                timeZone: "UTC",
                              })}
                            </td>

                            <td class="text-sm text-right whitespace-nowrap">
                              {item?.eps && item?.eps?.length > 0
                                ? item?.eps
                                : "-"}
                            </td>

                            <td class="text-sm text-right whitespace-nowrap">
                              {item?.eps_est && item?.eps_est?.length > 0
                                ? item?.eps_est
                                : "-"}
                            </td>

                            <td class="text-sm text-right whitespace-nowrap">
                              {item.revenue && item.revenue?.length > 0
                                ? abbreviateNumber(item.revenue)
                                : "-"}
                            </td>

                            <td class="text-sm text-right whitespace-nowrap">
                              {item.revenue_est && item.revenue_est?.length > 0
                                ? abbreviateNumber(item.revenue_est)
                                : "-"}
                            </td>
                          </tr>
                        {/if}
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
                    <span class="hidden sm:inline">Previous</span>
                  </Button>

                  <div class="flex flex-row items-center gap-4">
                    <span class="text-sm text-gray-600 dark:text-zinc-300">
                      Page {currentPage} of {totalPages}
                    </span>

                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild let:builder>
                        <Button
                          builders={[builder]}
                          class="w-fit sm:w-auto gap-1 transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <span class="truncate text-[0.85rem] sm:text-sm">
                            {rowsPerPage} Rows
                          </span>
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
                                <span class="text-sm">
                                  {item} Rows
                                </span>
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
              {/if}
            </div>
          {:else}
            <Infobox text="No data available" />
          {/if}
        </div>
      </main>
    </div>
  </div>
</section>

<script lang="ts">
  import { displayCompanyName, stockTicker, timeFrame } from "$lib/store";
  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
  import SEO from "$lib/components/SEO.svelte";
  import { mode } from "mode-watcher";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import {
    stock_detail_back_to_top,
    stock_detail_employees,
    stock_detail_market_cap,
    stock_detail_next,
    stock_detail_no_data,
    stock_detail_page_of,
    stock_detail_previous,
    stock_detail_rows,
    stock_detail_stats_history,
    stock_detail_stats_nav_revenue,
    stock_detail_stats_price_sales_ratio,
    stock_detail_stats_revenue_chart,
    stock_detail_stats_revenue_growth,
    stock_detail_stats_revenue_infobox,
    stock_detail_stats_revenue_per_employee,
    stock_detail_stats_revenue_seo_description,
    stock_detail_stats_revenue_seo_keywords,
    stock_detail_stats_revenue_seo_title,
    stock_detail_stats_revenue_structured_desc,
    stock_detail_stats_revenue_structured_name,
    stock_detail_stats_revenue_ttm,
    stock_detail_stats_sources,
  } from "$lib/paraglide/messages";

  import highcharts from "$lib/highcharts.ts";

  import Infobox from "$lib/components/Infobox.svelte";

  export let data;

  let config = null;
  let currency = data?.getStockDeck?.currency ?? "USD";
  let rawData = data?.getHistoricalRevenue || {};
  let baseTableData: any[] = [];
  let tableList: any[] = [];
  let paginatedTableList: any[] = [];
  let tableColumns: Array<{
    key: string;
    label: string;
    align: "left" | "right" | "center";
  }> = [
    { key: "date", label: "Fiscal Year End", align: "left" },
    { key: "revenue", label: "Revenue", align: "right" },
    { key: "changePercentage", label: "% YoY", align: "right" },
  ];

  const DEFAULT_ROWS_PER_PAGE = 20;
  const rowsPerPageOptions = [20, 50, 100];

  let rowsPerPage = DEFAULT_ROWS_PER_PAGE;
  let currentPage = 1;
  let totalPages = 1;
  let pagePathName = "";

  $timeFrame = "5Y";
  const tabs = ["Annual", "Quarterly"];

  let activeIdx = 0;
  let timeIdx = 0;

  let sortOrders: Record<
    string,
    { order: "none" | "asc" | "desc"; type: "date" | "number" | "string" }
  > = {
    date: { order: "none", type: "date" },
    revenue: { order: "none", type: "number" },
    changePercentageYoY: { order: "none", type: "number" },
    changePercentage: { order: "none", type: "number" },
  };

  function filterByYears(data: any[] = []) {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    const maxYear = Math.max(...data.map((item) => Number(item?.fiscalYear)));

    let yearsToKeep;
    if ($timeFrame === "MAX") {
      return data;
    } else if ($timeFrame?.endsWith("Y")) {
      yearsToKeep = Number($timeFrame.replace("Y", ""));
    } else {
      throw new Error("Invalid $timeFrame format. Use '5Y', '10Y', or 'MAX'.");
    }

    return data.filter(
      (item) => Number(item?.fiscalYear) >= maxYear - yearsToKeep + 1,
    );
  }

  function calculateChangePercentage(currentItem: any, nextItem: any) {
    if (!currentItem || !nextItem) {
      return null;
    }

    const currentRevenue = Number(currentItem?.revenue);
    const nextRevenue = Number(nextItem?.revenue);

    if (
      !Number.isFinite(currentRevenue) ||
      !Number.isFinite(nextRevenue) ||
      nextRevenue === 0
    ) {
      return null;
    }

    if (currentRevenue === nextRevenue) {
      return 0;
    }

    const delta =
      ((currentRevenue - nextRevenue) / Math.abs(nextRevenue)) * 100;

    return Number.isFinite(delta) ? delta : null;
  }

  function getPaginationKey() {
    if (!browser) {
      return null;
    }

    const currentPath = window.location.pathname || "";
    if (!currentPath) {
      return null;
    }

    pagePathName = currentPath;
    return `${currentPath}_revenue_rowsPerPage`;
  }

  function loadRowsPerPage() {
    const paginationKey = getPaginationKey();
    if (!paginationKey) {
      return;
    }

    try {
      const savedRows = localStorage.getItem(paginationKey);
      const parsedRows = savedRows ? Number(savedRows) : NaN;

      if (rowsPerPageOptions.includes(parsedRows)) {
        rowsPerPage = parsedRows;
      } else if (!rowsPerPageOptions.includes(rowsPerPage)) {
        rowsPerPage = DEFAULT_ROWS_PER_PAGE;
      }
    } catch (e) {
      console.warn("Failed to load rows per page preference:", e);
      rowsPerPage = DEFAULT_ROWS_PER_PAGE;
    }
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

  function applyPagination() {
    if (!Array.isArray(tableList) || tableList.length === 0) {
      paginatedTableList = [];
      totalPages = 1;
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

  function resolveSortableColumns() {
    const columns: typeof tableColumns = [
      {
        key: "date",
        label: activeIdx === 0 ? "Fiscal Year End" : "Quarter Ended",
        align: "left",
      },
      { key: "revenue", label: "Revenue", align: "right" },
    ];

    if (activeIdx === 1) {
      columns.push({
        key: "changePercentageYoY",
        label: "% YoY",
        align: "right",
      });
      columns.push({
        key: "changePercentage",
        label: "% QoQ",
        align: "right",
      });
    } else {
      columns.push({
        key: "changePercentage",
        label: "% YoY",
        align: "right",
      });
    }

    tableColumns = columns;
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
        workingList = [...workingList].sort((a, b) =>
          compareForSort(a, b, activeKey, type, order),
        );
      }
    }

    tableList = workingList;
  }

  function refreshTableData({ resetPage = false } = {}) {
    const dataset =
      activeIdx === 0 ? (rawData?.annual ?? []) : (rawData?.quarter ?? []);

    if (!Array.isArray(dataset) || dataset.length === 0) {
      baseTableData = [];
      tableList = [];
      paginatedTableList = [];
      totalPages = 1;
      currentPage = 1;
      resolveSortableColumns();
      return;
    }

    const sorted = [...dataset].sort(
      (a, b) => new Date(b?.date).getTime() - new Date(a?.date).getTime(),
    );

    let quarterlyLookup: Map<string, any> | null = null;
    if (activeIdx === 1) {
      quarterlyLookup = new Map(
        sorted
          .map((item) => {
            const periodKey = (item?.period ?? "").toString();
            const fiscalYear = Number(item?.fiscalYear);
            if (!periodKey || !Number.isFinite(fiscalYear)) {
              return null;
            }
            return [`${periodKey}-${fiscalYear}`, item] as const;
          })
          .filter(Boolean) as Array<readonly [string, any]>,
      );
    }

    baseTableData = sorted.map((item, index) => {
      let changePercentageYoY: number | null = null;
      if (activeIdx === 1 && quarterlyLookup) {
        const periodKey = (item?.period ?? "").toString();
        const fiscalYear = Number(item?.fiscalYear);
        if (periodKey && Number.isFinite(fiscalYear)) {
          const priorYearItem = quarterlyLookup.get(
            `${periodKey}-${fiscalYear - 1}`,
          );
          changePercentageYoY = calculateChangePercentage(item, priorYearItem);
        }
      }

      return {
        ...item,
        changePercentage: calculateChangePercentage(item, sorted[index + 1]),
        changePercentageYoY,
      };
    });

    if (activeIdx !== 1 && sortOrders.changePercentageYoY.order !== "none") {
      sortOrders = {
        ...sortOrders,
        changePercentageYoY: {
          ...sortOrders.changePercentageYoY,
          order: "none",
        },
      };
    }

    applySorting();

    if (resetPage) {
      currentPage = 1;
    } else if (currentPage > totalPages) {
      currentPage = 1;
    }

    resolveSortableColumns();
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
    saveRowsPerPage(rowsPerPage);
    applyPagination();
    scrollToTop();
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

    applySorting();
    currentPage = 1;
    applyPagination();
  }

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC", // Ensure consistent formatting regardless of user's timezone
    });
  }

  function changeTablePeriod(index) {
    activeIdx = index;
    refreshTableData({ resetPage: true });
  }

  refreshTableData({ resetPage: true });

  function scrollToTop() {
    if (!browser) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  onMount(() => {
    if (!browser) {
      return;
    }

    loadRowsPerPage();
    refreshTableData({ resetPage: true });
  });

  async function changeTimePeriod(state) {
    timeIdx = state;

    config = plotData();
    try {
      config.yAxis.labels.formatter = function () {
        return abbreviateNumber(this?.value);
      };
    } catch (e) {
      console.log(e);
    }
  }

  function plotData() {
    let filteredData = [];
    const rawData = data?.getHistoricalRevenue;

    if (timeIdx === 0) {
      // Clone the array before sorting
      filteredData = [...rawData?.annual];
    } else {
      filteredData = [...rawData?.quarter];
    }
    filteredData = filterByYears(filteredData);
    // Sort ascending for plotting
    filteredData.sort((a, b) => new Date(a?.date) - new Date(b?.date));

    let quarterLookup: Map<string, any> | undefined;
    if (timeIdx === 1) {
      quarterLookup = new Map(
        filteredData
          .map((item) => {
            const periodKey = (item?.period ?? "").toString();
            const fiscalYear = Number(item?.fiscalYear);
            if (!periodKey || !Number.isFinite(fiscalYear)) {
              return null;
            }
            return [`${periodKey}-${fiscalYear}`, item] as const;
          })
          .filter(Boolean) as Array<readonly [string, any]>,
      );
    }

    const yoyValues = filteredData.map((item, index) => {
      const currentRevenue = Number(item?.revenue);
      if (!Number.isFinite(currentRevenue)) {
        return null;
      }

      let previousRevenue: number | null = null;
      if (timeIdx === 0) {
        const previousItem = filteredData[index - 1];
        previousRevenue = Number(previousItem?.revenue);
      } else if (quarterLookup) {
        const periodKey = (item?.period ?? "").toString();
        const fiscalYear = Number(item?.fiscalYear);
        if (periodKey && Number.isFinite(fiscalYear)) {
          const priorYearItem = quarterLookup.get(
            `${periodKey}-${fiscalYear - 1}`,
          );
          previousRevenue = Number(priorYearItem?.revenue);
        }
      }

      if (!Number.isFinite(previousRevenue) || previousRevenue === 0) {
        return null;
      }

      const delta =
        ((currentRevenue - previousRevenue) / Math.abs(previousRevenue)) * 100;
      return Number.isFinite(delta) ? delta : null;
    });

    let categories;
    if (timeIdx === 0) {
      // Annual: Just show fiscal year
      categories = filteredData.map((item) => {
        const shortYear = `${String(item?.fiscalYear).slice(-2)}`;
        return `FY${shortYear}`;
      });
    } else {
      // Quarterly: "Q1 `25" format
      categories = filteredData.map((item) => {
        const shortYear = `'${String(item?.fiscalYear).slice(-2)}`;
        return `${item?.period} ${shortYear}`;
      });
    }

    const revenueSeriesData = filteredData.map((item, index) => {
      const revenueValue = Number(item?.revenue);
      return {
        y: Number.isFinite(revenueValue) ? revenueValue : null,
        yoy: yoyValues[index],
        qoq:
          timeIdx === 1 && index > 0
            ? (() => {
                const previous = filteredData[index - 1];
                const previousRevenue = Number(previous?.revenue);
                if (
                  !Number.isFinite(previousRevenue) ||
                  previousRevenue === 0 ||
                  !Number.isFinite(revenueValue)
                ) {
                  return null;
                }
                const delta =
                  ((revenueValue - previousRevenue) /
                    Math.abs(previousRevenue)) *
                  100;
                return Number.isFinite(delta) ? delta : null;
              })()
            : null,
      };
    });

    const options = {
      credits: {
        enabled: false,
      },
      chart: {
        type: "column",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 360, // Set the maximum height for the chart
        animation: false,
      },
      title: {
        text:
          timeIdx === 0
            ? `<h3 class="mt-3 mb-1">${removeCompanyStrings($displayCompanyName)} Revenue - Annual</h3>`
            : `<h3 class="mt-3 mb-1">${removeCompanyStrings($displayCompanyName)} Revenue - Quarterly</h3>`,
        style: {
          color: $mode === "light" ? "black" : "white",
          // Using inline CSS for margin-top and margin-bottom
        },
        useHTML: true, // Enable HTML to apply custom class styling
      },

      xAxis: {
        categories,
        gridLineWidth: 0,
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
        },
      },
      yAxis: {
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
        },
        title: { text: null },
        opposite: true,
      },
      tooltip: {
        shared: true,
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
          // Get the x-axis category label for this point
          const categoryLabel = this.points
            ? this.points[0].series.xAxis.categories[this.points[0].point.index]
            : this.series.xAxis.categories[this.point.index];

          let tooltipContent = `<span class="m-auto text-sm font-[501]">${categoryLabel}</span><br>`;

          this.points.forEach((point) => {
            tooltipContent += `
    <span style="display:inline-block; width:10px; height:10px; background-color:${point.color}; border-radius:50%; margin-right:5px;"></span>
    <span class="font-semibold text-sm">${point.series.name}:</span> 
    <span class="font-normal text-sm">${abbreviateNumber(point.y)}</span><br>`;
            if (
              point.series.name === "Revenue" &&
              typeof point.point?.yoy === "number" &&
              Number?.isFinite(point.point.yoy)
            ) {
              const yoyValue = point.point.yoy;
              tooltipContent += `
    <span class="${yoyValue > 0 ? "bg-green-400" : "bg-red-400"}" style="display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:5px;"></span>
    <span class="font-semibold text-sm">YoY:</span> 
    <span class="${yoyValue > 0 ? "text-green-400 before:content-['+']" : "text-red-400"} text-sm">${yoyValue.toFixed(2)}%</span><br>`;
            }
            if (
              point.series.name === "Revenue" &&
              typeof point.point?.qoq === "number" &&
              Number?.isFinite(point.point.qoq) &&
              timeIdx === 1
            ) {
              const qoqValue = point.point.qoq;
              tooltipContent += `
    <span class="${qoqValue > 0 ? "bg-green-400" : "bg-red-400"}" style="display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:5px;"></span>
    <span class="font-semibold text-sm">QoQ:</span> 
    <span class="${qoqValue > 0 ? "text-green-400 before:content-['+']" : "text-red-400"} text-sm">${qoqValue.toFixed(2)}%</span><br>`;
            }
          });

          return tooltipContent;
        },
      },

      plotOptions: {
        series: {
          color: $mode === "light" ? "black" : "white",
          animation: false,
          dataLabels: {
            enabled: timeIdx === 0 && $timeFrame === "5Y" ? true : false,
            color: $mode === "light" ? "black" : "white",
            style: {
              fontSize: "13px",
              fontWeight: "bold",
            },
            formatter: function () {
              return abbreviateNumber(this?.y);
            },
          },
        },
      },
      legend: {
        enabled: false,
      },
      series: [
        {
          name: "Revenue",
          data: revenueSeriesData,
          color: $mode === "light" ? "#2C6288" : "white",
        },
      ],
    };

    return options;
  }

  $: {
    if ($mode || $timeFrame) {
      changeTablePeriod(0);
      changeTimePeriod(0);
    }
  }
</script>

<SEO
  title={stock_detail_stats_revenue_seo_title({
    company: $displayCompanyName,
    ticker: $stockTicker,
  })}
  description={stock_detail_stats_revenue_seo_description({
    company: $displayCompanyName,
    ticker: $stockTicker,
  })}
  keywords={stock_detail_stats_revenue_seo_keywords({
    company: $displayCompanyName,
    ticker: $stockTicker,
  })}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/statistics/revenue`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "Dataset"],
    name: stock_detail_stats_revenue_structured_name({
      company: $displayCompanyName,
    }),
    description: stock_detail_stats_revenue_structured_desc({
      company: $displayCompanyName,
      ticker: $stockTicker,
    }),
    url: `https://stocknear.com/stocks/${$stockTicker}/statistics/revenue`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Historical revenue analysis",
      "Sales growth tracking",
      "Quarterly revenue data",
      "Revenue trend analysis",
      "Year-over-year comparisons",
      "Sales performance metrics",
      "Revenue growth rate calculation",
      "Financial performance charts",
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
      name: "Revenue Analysis",
      description:
        "Professional analysis of company revenue trends and sales performance",
    },
  }}
/>

<section class="w-full overflow-hidden min-h-screen">
  <div class="w-full flex justify-center w-full sm-auto h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <main class="w-full">
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 m-auto mt-2 sm:mt-0">
          <div class="w-full flex flex-col sm:flex-row justify-between">
            <h1 class="text-xl sm:text-2xl font-bold">
              {stock_detail_stats_nav_revenue()}
            </h1>
          </div>

          {#if Object?.keys(data?.getHistoricalRevenue)?.length > 0}
            <div class="grid grid-cols-1 gap-2">
              <Infobox
                text={stock_detail_stats_revenue_infobox({
                  company: removeCompanyStrings($displayCompanyName),
                  annualRevenue: abbreviateNumber(
                    rawData?.annual?.at(0)?.revenue,
                  ),
                  growthPercent: rawData?.growthRevenue,
                  quarterDate: formatDate(rawData?.quarter?.at(0)?.date),
                  quarterRevenue: abbreviateNumber(
                    rawData?.quarter?.at(0)?.revenue,
                  ),
                })}
              />

              <div
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 mt-3"
              >
                <div
                  class="revenue-ttm-driver shadow-none bg-white/70 dark:bg-zinc-950/40 border border-gray-300 shadow dark:border-zinc-700 rounded-2xl p-4"
                >
                  <div class="text-sm mb-2 flex items-center">
                    <span>{stock_detail_stats_revenue_ttm()}</span>
                  </div>
                  <div class="flex items-baseline">
                    <span class="text-xl font-semibold">
                      {abbreviateNumber(rawData?.revenueTTM)}
                      {currency !== "USD" ? currency : ""}</span
                    >
                  </div>
                </div>

                <div
                  class="revenue-growth-driver shadow-none bg-white/70 dark:bg-zinc-950/40 border border-gray-300 shadow dark:border-zinc-700 rounded-2xl p-4"
                >
                  <div class="text-sm mb-2 flex items-center">
                    <span>{stock_detail_stats_revenue_growth()}</span>
                  </div>
                  <div class="flex items-baseline">
                    <span class="text-xl font-semibold"
                      >{rawData?.growthRevenue
                        ? rawData?.growthRevenue + "%"
                        : "n/a"}</span
                    >
                  </div>
                </div>

                <div
                  class="ps-ratio-driver shadow-none bg-white/70 dark:bg-zinc-950/40 border border-gray-300 shadow dark:border-zinc-700 rounded-2xl p-4"
                >
                  <div class="text-sm mb-2 flex items-center">
                    <span>{stock_detail_stats_price_sales_ratio()}</span>
                  </div>
                  <div class="flex items-baseline">
                    <span class="text-xl font-semibold"
                      >{rawData?.priceToSalesRatio ?? "n/a"}</span
                    >
                  </div>
                </div>

                <div
                  class="rev-per-emp-driver shadow-none bg-white/70 dark:bg-zinc-950/40 border border-gray-300 shadow dark:border-zinc-700 rounded-2xl p-4"
                >
                  <div class="text-sm mb-2 flex items-center">
                    <span>{stock_detail_stats_revenue_per_employee()}</span>
                  </div>
                  <div class="flex items-baseline">
                    <span class="text-xl font-semibold"
                      >{rawData?.revenuePerEmployee?.toLocaleString("en-US")}
                      {currency !== "USD" ? currency : ""}</span
                    >
                  </div>
                </div>

                <div
                  class="employees-driver shadow-none bg-white/70 dark:bg-zinc-950/40 border border-gray-300 shadow dark:border-zinc-700 rounded-2xl p-4"
                >
                  <div class="text-sm mb-2 flex items-center">
                    <span>{stock_detail_employees()}</span>
                  </div>
                  <div class="flex items-baseline">
                    <span class="text-xl font-semibold"
                      >{rawData?.employees?.toLocaleString("en-US") ??
                        "n/a"}</span
                    >
                  </div>
                </div>
                <div
                  class="marketCap-driver shadow-none bg-white/70 dark:bg-zinc-950/40 border border-gray-300 shadow dark:border-zinc-700 rounded-2xl p-4"
                >
                  <div class="text-sm mb-2 flex items-center">
                    <span>{stock_detail_market_cap()}</span>
                  </div>
                  <div class="flex items-baseline">
                    <span class="text-xl font-semibold"
                      >{abbreviateNumber(data?.getStockQuote?.marketCap)}
                      {currency !== "USD" ? "USD" : ""}</span
                    >
                  </div>
                </div>
              </div>

              <div
                class=" flex flex-col sm:flex-row items-start sm:items-center w-full justify-between border-t border-b border-gray-300 dark:border-zinc-700 py-2"
              >
                <h2 class="text-xl sm:text-2xl font-bold">
                  {stock_detail_stats_revenue_chart()}
                </h2>
                <div class="ml-auto">
                  <div class="inline-flex mt-2 sm:mt-0">
                    <div
                      class="w-fit text-sm flex items-center gap-1 rounded-full border border-gray-300 shadow dark:border-zinc-700"
                    >
                      {#each tabs as item, i (item)}
                        <button
                          on:click={() => changeTimePeriod(i)}
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
                          <span class="truncate">{$timeFrame}</span>
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
                        class=" h-fit max-h-72 overflow-y-auto scroller"
                      >
                        <DropdownMenu.Group>
                          <DropdownMenu.Item
                            on:click={() => ($timeFrame = "5Y")}
                            class="cursor-pointer text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400"
                          >
                            5Y
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            on:click={() => ($timeFrame = "10Y")}
                            class="cursor-pointer text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400"
                          >
                            10Y
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            on:click={() => ($timeFrame = "MAX")}
                            class="cursor-pointer text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 flex flex-row items-center"
                          >
                            Max
                          </DropdownMenu.Item>
                        </DropdownMenu.Group>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </div>
                </div>
              </div>

              <div
                class="chart-driver shadow-none mt-5 sm:mt-0 border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40"
                use:highcharts={config}
              ></div>
              {#if currency !== "USD"}
                <span class="text-sm text-gray-800 dark:text-gray-400"
                  >* This company reports financials in DKK.</span
                >
              {/if}

              <div
                class="history-driver mt-5 flex flex-row items-center w-full justify-between border-t border-b border-gray-300 dark:border-zinc-700 py-2"
              >
                <h3 class="text-xl sm:text-2xl font-bold">
                  {stock_detail_stats_history()}
                </h3>

                <div class="inline-flex ml-auto">
                  <div
                    class="w-fit text-sm flex items-center gap-1 rounded-full border border-gray-300 shadow dark:border-zinc-700"
                  >
                    {#each tabs as item, i (item)}
                      <button
                        on:click={() => changeTablePeriod(i)}
                        class="cursor-pointer font-medium rounded-full px-3 py-1.5 focus:z-10 focus:outline-none transition-all
          {activeIdx === i
                          ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                          : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'}"
                      >
                        {item}
                      </button>
                    {/each}
                  </div>
                </div>
              </div>

              <div class="w-full overflow-x-auto">
                <table
                  class="table table-sm table-compact w-full text-gray-700 dark:text-zinc-200 tabular-nums m-auto rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 mt-2"
                >
                  <thead
                    class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                  >
                    <TableHeader
                      columns={tableColumns}
                      {sortOrders}
                      {sortData}
                    />
                  </thead>
                  <tbody>
                    {#each paginatedTableList as item}
                      <tr class="transition-colors">
                        <td class=" text-sm whitespace-nowrap">
                          {new Date(item?.date)?.toLocaleDateString("en-US", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>

                        <td class=" text-sm text-right whitespace-nowrap">
                          {abbreviateNumber(item?.revenue)}
                        </td>

                        {#if activeIdx === 1}
                          <td class=" text-sm whitespace-nowrap text-end">
                            {#if typeof item?.changePercentageYoY !== "number" || !Number.isFinite(item.changePercentageYoY) || item.changePercentageYoY === 0}
                              n/a
                            {:else if item.changePercentageYoY > 0}
                              <span
                                class="text-emerald-800 dark:text-emerald-400"
                              >
                                +{item.changePercentageYoY.toFixed(2)}%
                              </span>
                            {:else}
                              <span class="text-rose-800 dark:text-rose-400">
                                -{Math.abs(item.changePercentageYoY).toFixed(
                                  2,
                                )}%
                              </span>
                            {/if}
                          </td>
                        {/if}

                        <td class=" text-sm whitespace-nowrap text-end">
                          {#if typeof item?.changePercentage !== "number" || !Number.isFinite(item.changePercentage) || item.changePercentage === 0}
                            n/a
                          {:else if item.changePercentage > 0}
                            <span
                              class="text-emerald-800 dark:text-emerald-400"
                            >
                              +{item.changePercentage.toFixed(2)}%
                            </span>
                          {:else}
                            <span class="text-rose-800 dark:text-rose-400">
                              -{Math.abs(item.changePercentage).toFixed(2)}%
                            </span>
                          {/if}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
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
                    <span class="hidden sm:inline"
                      >{stock_detail_previous()}</span
                    >
                  </Button>

                  <div class="flex flex-row items-center gap-4">
                    <span class="text-sm text-gray-600 dark:text-zinc-300">
                      {stock_detail_page_of({
                        current: currentPage,
                        total: totalPages,
                      })}
                    </span>

                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild let:builder>
                        <Button
                          builders={[builder]}
                          class="w-fit sm:w-auto gap-1 transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <span class="truncate text-[0.85rem] sm:text-sm"
                            >{stock_detail_rows({ count: rowsPerPage })}</span
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
                                <span class="text-sm"
                                  >{stock_detail_rows({ count: item })}</span
                                >
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
                    <span class="hidden sm:inline">{stock_detail_next()}</span>
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

                <div class="flex justify-center mt-4">
                  <button
                    on:click={scrollToTop}
                    class="cursor-pointer text-sm font-medium text-gray-800 dark:text-zinc-300 transition hover:text-violet-600 dark:hover:text-violet-400"
                  >
                    {stock_detail_back_to_top()}
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
              <span class="text-sm mt-2">
                {stock_detail_stats_sources()}
              </span>
            </div>
          {:else}
            <Infobox text={stock_detail_no_data()} />
          {/if}
        </div>
      </main>
    </div>
  </div>
</section>

<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
  import SEO from "$lib/components/SEO.svelte";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";

  import Infobox from "$lib/components/Infobox.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  //import * as XLSX from 'xlsx';
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";
  import {
    stock_detail_next,
    stock_detail_no_data,
    stock_detail_page_of,
    stock_detail_previous,
    stock_detail_rows,
    stock_detail_stats_10_years,
    stock_detail_stats_1_month,
    stock_detail_stats_1_year,
    stock_detail_stats_1_year_change,
    stock_detail_stats_3_years,
    stock_detail_stats_5_years,
    stock_detail_stats_6_months,
    stock_detail_stats_annual,
    stock_detail_stats_category,
    stock_detail_stats_decreased,
    stock_detail_stats_history,
    stock_detail_stats_increased,
    stock_detail_stats_market_cap_chart,
    stock_detail_stats_market_cap_infobox,
    stock_detail_stats_market_cap_seo_description,
    stock_detail_stats_market_cap_seo_keywords,
    stock_detail_stats_market_cap_seo_title,
    stock_detail_stats_market_cap_structured_desc,
    stock_detail_stats_market_cap_structured_name,
    stock_detail_stats_market_capitalization,
    stock_detail_stats_max,
    stock_detail_stats_nav_market_cap,
    stock_detail_stats_negative_trend,
    stock_detail_stats_positive_trend,
    stock_detail_stats_quarterly,
    stock_detail_stats_select_time_frame,
    stock_detail_stats_unchanged,
  } from "$lib/paraglide/messages";

  export let data;

  let rawData = data?.getHistoricalMarketCap || [];
  let baseTableData: any[] = [];
  let tableList: any[] = [];
  let paginatedTableList: any[] = [];
  let changePercentageYearAgo = 0;
  let timePeriod = "3Y";

  const tabs = ["Annual", "Quarterly"];
  let activeIdx = 0;

  const DEFAULT_ROWS_PER_PAGE = 20;
  const rowsPerPageOptions = [20, 50, 100];

  let rowsPerPage = DEFAULT_ROWS_PER_PAGE;
  let currentPage = 1;
  let totalPages = 1;
  let pagePathName = "";

  const columns = [
    { key: "date", label: "Date", align: "left" },
    { key: "marketCap", label: "Market Cap", align: "right" },
    { key: "changesPercentage", label: "% Change", align: "right" },
  ];

  let sortOrders = {
    date: { order: "none", type: "date" },
    marketCap: { order: "none", type: "number" },
    changesPercentage: { order: "none", type: "number" },
  };

  function getMarketCapCategory(marketCap) {
    const BILLION = 1_000_000_000;
    const MILLION = 1_000_000;

    const marketCapNavigation = [
      {
        threshold: 200 * BILLION,
        name: "Mega-Cap",
        link: "/list/market-cap/mega-cap-stocks",
      },
      {
        minThreshold: 10 * BILLION,
        maxThreshold: 200 * BILLION,
        name: "Large-Cap",
        link: "/list/market-cap/large-cap-stocks",
      },
      {
        minThreshold: 2 * BILLION,
        maxThreshold: 10 * BILLION,
        name: "Mid-Cap",
        link: "/list/market-cap/mid-cap-stocks",
      },
      {
        minThreshold: 300 * MILLION,
        maxThreshold: 2 * BILLION,
        name: "Small-Cap",
        link: "/list/market-cap/small-cap-stocks",
      },
      {
        minThreshold: 50 * MILLION,
        maxThreshold: 300 * MILLION,
        name: "Micro-Cap",
        link: "/list/market-cap/micro-cap-stocks",
      },
      {
        maxThreshold: 50 * MILLION,
        name: "Nano-Cap",
        link: "/list/market-cap/nano-cap-stocks",
      },
    ];

    if (!marketCap) return null;

    // Convert string to number if needed
    const capValue =
      typeof marketCap === "string" ? parseFloat(marketCap) : marketCap;

    return marketCapNavigation.find((category) => {
      if (category.threshold) {
        return capValue >= category.threshold;
      }
      if (category.minThreshold && category.maxThreshold) {
        return (
          capValue >= category.minThreshold && capValue < category.maxThreshold
        );
      }
      if (category.maxThreshold) {
        return capValue < category.maxThreshold;
      }
      return false;
    });
  }

  function computeYearOverYearChange(rawData) {
    if (rawData.length < 2) {
      return null; // Not enough rawData to compute change
    }

    // Step 1: Get the last entry in the list
    const lastEntry = rawData[rawData.length - 1];
    const lastDate = new Date(lastEntry.date);
    const lastMarketCap = data?.getStockQuote?.marketCap;

    // Step 2: Find the entry closest to one year before the last date
    let closestEntry = null;
    for (let i = rawData.length - 2; i >= 0; i--) {
      const entryDate = new Date(rawData[i].date);
      const oneYearAgo = new Date(lastDate);
      oneYearAgo.setFullYear(lastDate.getFullYear() - 1);

      // Check if the entry is close to one year ago
      if (entryDate <= oneYearAgo) {
        closestEntry = rawData[i];
        break;
      }
    }

    if (!closestEntry) {
      return null; // No suitable entry found for comparison
    }

    const previousMarketCap = closestEntry.marketCap;

    // Step 3: Calculate the percentage change
    const change =
      ((lastMarketCap - previousMarketCap) / previousMarketCap) * 100;

    return change;
  }

  function addChangesPercentage(data) {
    // First, sort by date ascending
    const sorted = [...data].sort(
      (a, b) => new Date(b?.date) - new Date(a?.date),
    );

    // Then, calculate changesPercentage compared to next item
    return sorted.map((item, index, arr) => {
      if (index === arr.length - 1) {
        return { ...item, changesPercentage: null };
      }

      const nextMarketCap = arr[index + 1]?.marketCap;
      const pctChange =
        ((item.marketCap - nextMarketCap) / nextMarketCap) * 100;

      return {
        ...item,
        changesPercentage: parseFloat(pctChange?.toFixed(2)),
      };
    });
  }

  function filterEndOfYearDates(data) {
    // Step 1: Group data by year
    const groupedByYear = data.reduce((acc, item) => {
      const year = new Date(item.date).getFullYear();
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(item);
      return acc;
    }, {});

    // Step 2: For each year, find the entry with the latest date
    let annualData = Object.values(groupedByYear).map((yearData) => {
      return yearData.reduce((latest, current) => {
        return new Date(latest.date) > new Date(current.date)
          ? latest
          : current;
      });
    });

    annualData = addChangesPercentage(annualData);

    return annualData;
  }

  function filterEndOfQuarterDates(data) {
    // Step 1: Group data by year and quarter
    const groupedByQuarter = data?.reduce((acc, item) => {
      const date = new Date(item?.date);
      const year = date.getFullYear();
      const quarter = Math?.floor(date?.getMonth() / 3) + 1; // Get the quarter (1-4)

      const key = `${year}-Q${quarter}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});

    // Step 2: For each year-quarter group, find the entry with the latest date
    let quarterlyData = Object?.values(groupedByQuarter)?.map((quarterData) => {
      return quarterData?.reduce((latest, current) => {
        return new Date(latest?.date) > new Date(current?.date)
          ? latest
          : current;
      });
    });

    quarterlyData = addChangesPercentage(quarterlyData);
    return quarterlyData;
  }

  function changeTablePeriod(index) {
    activeIdx = index;
    const dataset =
      activeIdx === 0
        ? filterEndOfYearDates(rawData)
        : filterEndOfQuarterDates(rawData);

    baseTableData = Array.isArray(dataset)
      ? [...dataset].sort(
          (a, b) => new Date(b?.date).getTime() - new Date(a?.date).getTime(),
        )
      : [];

    // Reset sort indicators
    sortOrders = {
      date: { order: "none", type: "date" },
      marketCap: { order: "none", type: "number" },
      changesPercentage: { order: "none", type: "number" },
    };

    refreshTable({ resetPage: true });
  }

  changePercentageYearAgo = computeYearOverYearChange(rawData);
  changeTablePeriod(0);

  onMount(() => {
    if (!browser) {
      return;
    }

    const storedRows = loadRowsPerPageFromStorage();
    if (storedRows !== rowsPerPage) {
      rowsPerPage = storedRows;
      refreshTable({ resetPage: true });
    }
  });

  async function changeStatement(state) {
    timePeriod = state;

    config = plotData();
  }

  function filterDataByTimePeriod(rawData, timePeriod) {
    let dates = [];
    let marketCapList = [];
    let changesPercentageList = [];
    const now = new Date();

    // Calculate the date threshold based on the selected time period
    let thresholdDate;
    switch (timePeriod) {
      case "1M":
        thresholdDate = new Date(now);
        thresholdDate.setMonth(now.getMonth() - 1);
        break;
      case "6M":
        thresholdDate = new Date(now);
        thresholdDate.setMonth(now.getMonth() - 6);
        break;
      case "1Y":
        thresholdDate = new Date(now);
        thresholdDate.setFullYear(now.getFullYear() - 1);
        break;
      case "3Y":
        thresholdDate = new Date(now);
        thresholdDate.setFullYear(now.getFullYear() - 3);
        break;
      case "5Y":
        thresholdDate = new Date(now);
        thresholdDate.setFullYear(now.getFullYear() - 5);
        break;
      case "10Y":
        thresholdDate = new Date(now);
        thresholdDate.setFullYear(now.getFullYear() - 10);
        break;
      case "Max":
      default:
        thresholdDate = new Date(0); // Set to the earliest possible date
        break;
    }

    // Filter the data based on the threshold date
    rawData?.forEach((item) => {
      const itemDate = new Date(item?.date);
      if (itemDate >= thresholdDate) {
        dates?.push(item?.date);
        marketCapList?.push(item?.marketCap);
        changesPercentageList?.push(item?.changesPercentage);
      }
    });

    return { dates, marketCapList, changesPercentageList };
  }

  function plotData() {
    const filteredData = filterDataByTimePeriod(rawData, timePeriod);

    const fillColorStart = "rgb(70, 129, 244,0.5)";
    const fillColorEnd = "rgb(70, 129, 244,0.001)";

    const options = {
      credits: {
        enabled: false,
      },
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 360,
      },
      title: {
        text: `<h3 class="mt-3 mb-1 ">${removeCompanyStrings($displayCompanyName)} Market Cap</h3>`,
        style: {
          color: $mode === "light" ? "black" : "white",
          // Using inline CSS for margin-top and margin-bottom
        },
        useHTML: true, // Enable HTML to apply custom class styling
      },
      xAxis: {
        type: "datetime",
        endOnTick: false,
        categories: filteredData?.dates,
        crosshair: {
          color: $mode === "light" ? "black" : "white", // Set the color of the crosshair line
          width: 1, // Adjust the line width as needed
          dashStyle: "Solid",
        },
        labels: {
          style: {
            color: $mode === "light" ? "#545454" : "white",
          },
          distance: 10, // Increases space between label and axis
          formatter: function () {
            const date = new Date(this.value);
            return date.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            });
          },
        },
        tickPositioner: function () {
          // Create custom tick positions with wider spacing
          const positions = [];
          const info = this.getExtremes();
          const tickCount = 5; // Reduce number of ticks displayed
          const interval = Math.floor((info.max - info.min) / tickCount);

          for (let i = 0; i <= tickCount; i++) {
            positions.push(info.min + i * interval);
          }
          return positions;
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
        backgroundColor: "rgba(0, 0, 0, 1)", // Semi-transparent black
        borderColor: "rgba(255, 255, 255, 0.2)", // Slightly visible white border
        borderWidth: 1,
        style: {
          color: "#fff",
          fontSize: "16px",
          padding: "10px",
        },
        borderRadius: 4,
        formatter: function () {
          // Format the x value to display time in a custom format
          let tooltipContent = `<span class="m-auto text-sm font-[501]">${new Date(
            this.points[0]?.key,
          ).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}</span><br>`;

          // Loop through each point in the shared tooltip
          this.points.forEach((point) => {
            tooltipContent += `
    <span class="font-semibold text-sm">${point.series.name}:</span> 
    <span class="font-normal text-sm">${abbreviateNumber(point.y)}</span><br>`;
          });

          return tooltipContent;
        },
      },

      plotOptions: {
        series: {
          color: "white",
          animation: false, // Disable series animation
          states: {
            hover: {
              enabled: false, // Disable hover effect globally
            },
          },
        },
      },
      legend: {
        enabled: false,
      },
      series: [
        {
          name: "Mkt Cap",
          type: "area",
          data: filteredData?.marketCapList,
          color: "#4681f4",
          lineWidth: 1.2,
          marker: {
            enabled: false,
          },
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, fillColorStart],
              [1, fillColorEnd],
            ],
          },
        },
      ],
    };

    return options;
  }

  let config = null;

  $: {
    if ($mode) {
      config = plotData();
    }
  }
  $: capCategory = getMarketCapCategory(data?.getStockQuote?.marketCap);

  function getPaginationKey() {
    if (!browser) {
      return null;
    }

    const currentPath = window.location.pathname || "";
    if (!currentPath) {
      return null;
    }

    pagePathName = currentPath;
    return `${currentPath}_market_cap_rowsPerPage`;
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
</script>

<SEO
  title={stock_detail_stats_market_cap_seo_title({
    company: $displayCompanyName,
    ticker: $stockTicker,
  })}
  description={stock_detail_stats_market_cap_seo_description({
    company: $displayCompanyName,
    ticker: $stockTicker,
  })}
  keywords={stock_detail_stats_market_cap_seo_keywords({
    company: $displayCompanyName,
    ticker: $stockTicker,
  })}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/statistics/market-cap`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "Dataset"],
    name: stock_detail_stats_market_cap_structured_name({
      company: $displayCompanyName,
    }),
    description: stock_detail_stats_market_cap_structured_desc({
      company: $displayCompanyName,
      ticker: $stockTicker,
    }),
    url: `https://stocknear.com/stocks/${$stockTicker}/statistics/market-cap`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Market cap tracking",
      "Historical valuation analysis",
      "Size classification",
      "Growth trend analysis",
      "Quarterly market cap data",
      "Year-over-year comparisons",
      "Valuation metrics",
      "Market cap charts",
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
      name: "Market Capitalization Analysis",
      description:
        "Professional analysis of company market value and valuation trends",
    },
  }}
/>

<section class=" w-full overflow-hidden h-full">
  <div class="w-full flex justify-center w-full sm-auto h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <main class="w-full">
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 m-auto mt-2 sm:mt-0">
          <div class="w-full flex flex-col sm:flex-row justify-between">
            <h1 class="text-xl sm:text-2xl font-bold">
              {stock_detail_stats_market_capitalization()}
            </h1>
          </div>

          {#if rawData?.length !== 0}
            <div class="grid grid-cols-1 gap-2">
              <Infobox
                text={stock_detail_stats_market_cap_infobox({
                  company: removeCompanyStrings($displayCompanyName),
                  marketCap: abbreviateNumber(data?.getStockQuote?.marketCap),
                  date: new Date()?.toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "UTC",
                  }),
                  changeDirection:
                    changePercentageYearAgo > 0
                      ? stock_detail_stats_increased()
                      : changePercentageYearAgo < 0
                        ? stock_detail_stats_decreased()
                        : stock_detail_stats_unchanged(),
                  changePercent: abbreviateNumber(
                    changePercentageYearAgo?.toFixed(2),
                  ),
                })}
              />

              <div
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2 mt-3"
              >
                <div
                  class="marketCap-driver shadow-none bg-white/70 dark:bg-zinc-950/40 border border-gray-300 shadow dark:border-zinc-700 rounded-2xl p-4"
                >
                  <div class=" text-sm mb-2 flex items-center">
                    <span>{stock_detail_stats_nav_market_cap()}</span>
                  </div>
                  <div class="flex items-baseline">
                    <span class="text-xl font-semibold">
                      {abbreviateNumber(data?.getStockQuote?.marketCap)}</span
                    >
                  </div>
                </div>

                <div
                  class="category-driver shadow-none bg-white/70 dark:bg-zinc-950/40 border border-gray-300 shadow dark:border-zinc-700 rounded-2xl p-4"
                >
                  <div class=" text-sm mb-2 flex items-center">
                    <span>{stock_detail_stats_category()}</span>
                  </div>
                  <div class="flex items-baseline">
                    <span class="text-xl font-semibold"
                      >{#if capCategory}
                        <a
                          class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                          href={capCategory.link}
                        >
                          {capCategory.name}
                        </a>
                      {:else}
                        n/a
                      {/if}</span
                    >
                  </div>
                </div>

                <div
                  class="oneYearChange-driver shadow-none bg-white/70 dark:bg-zinc-950/40 border border-gray-300 shadow dark:border-zinc-700 rounded-2xl p-4"
                >
                  <div class=" text-sm mb-2 flex items-center">
                    <span>{stock_detail_stats_1_year_change()}</span>
                  </div>
                  <div class="flex items-baseline">
                    <span class="text-xl font-semibold"
                      >{changePercentageYearAgo > 100
                        ? "> 100%"
                        : changePercentageYearAgo
                          ? changePercentageYearAgo?.toFixed(1) + "%"
                          : "n/a"}</span
                    >
                    {#if changePercentageYearAgo}
                      <div class="flex flex-col ml-2">
                        <span
                          class="text-sm {changePercentageYearAgo >= 0 &&
                          changePercentageYearAgo !== null
                            ? "before:content-['+'] text-emerald-800 dark:text-emerald-400"
                            : changePercentageYearAgo < 0 &&
                                changePercentageYearAgo !== null
                              ? 'text-rose-800 dark:text-rose-400'
                              : ''}"
                        >
                          {changePercentageYearAgo >= 0
                            ? stock_detail_stats_positive_trend()
                            : stock_detail_stats_negative_trend()}
                        </span>
                      </div>
                    {/if}
                  </div>
                </div>
              </div>

              <div
                class="flex flex-col sm:flex-row items-start sm:items-center w-full border-t border-b border-gray-300 dark:border-zinc-700 py-2"
              >
                <h2 class="mb-3 sm:mb-0 text-xl sm:text-2xl font-bold">
                  {stock_detail_stats_market_cap_chart()}
                </h2>

                <div
                  class="flex flex-row items-center w-fit sm:w-[50%] md:w-auto sm:ml-auto"
                >
                  <div
                    class="timeframe-toggle-driver relative inline-block text-left grow mr-2"
                  >
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild let:builder>
                        <Button
                          builders={[builder]}
                          class="w-full transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <span class="truncate text-xs sm:text-sm"
                            >{timePeriod}</span
                          >
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
                        class="w-56 h-fit max-h-72 overflow-y-auto scroller"
                      >
                        <DropdownMenu.Label
                          class="text-gray-500 dark:text-zinc-400 font-normal"
                        >
                          {stock_detail_stats_select_time_frame()}
                        </DropdownMenu.Label>
                        <DropdownMenu.Separator />
                        <DropdownMenu.Group>
                          <DropdownMenu.Item
                            on:click={() => changeStatement("1M")}
                            class="cursor-pointer text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400"
                          >
                            {stock_detail_stats_1_month()}
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            on:click={() => changeStatement("6M")}
                            class="cursor-pointer text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400"
                          >
                            {stock_detail_stats_6_months()}
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            on:click={() => changeStatement("1Y")}
                            class="cursor-pointer text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400"
                          >
                            {stock_detail_stats_1_year()}
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            on:click={() => changeStatement("3Y")}
                            class="cursor-pointer text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400"
                          >
                            {stock_detail_stats_3_years()}
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            on:click={() => changeStatement("5Y")}
                            class="cursor-pointer text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400"
                          >
                            {stock_detail_stats_5_years()}
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            on:click={() => changeStatement("10Y")}
                            class="cursor-pointer text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400"
                          >
                            {stock_detail_stats_10_years()}
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            on:click={() => changeStatement("Max")}
                            class="cursor-pointer text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400"
                          >
                            {stock_detail_stats_max()}
                          </DropdownMenu.Item>
                        </DropdownMenu.Group>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </div>
                  <DownloadData
                    {data}
                    {rawData}
                    title={`market_cap_${$stockTicker}`}
                  />
                </div>
              </div>

              <div
                class="chart-driver border border-gray-300 shadow shadow-none dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40"
                use:highcharts={config}
              ></div>

              <div
                class=" flex flex-row items-center w-full justify-between mt-2 border-t border-b border-gray-300 dark:border-zinc-700 py-2"
              >
                <h3 class="history-driver text-xl sm:text-2xl font-bold">
                  {stock_detail_stats_history()}
                </h3>

                <div class="inline-flex justify-center rounded w-auto">
                  <div
                    class=" flex flex-col sm:flex-row items-start sm:items-center w-full justify-between"
                  >
                    <div class="">
                      <div class="inline-flex">
                        <div
                          class="w-fit text-sm flex items-center gap-1 rounded-full border border-gray-300 shadow dark:border-zinc-700
           "
                        >
                          {#each tabs as item, i (item)}
                            <button
                              on:click={() => changeTablePeriod(i)}
                              class="cursor-pointer font-medium rounded-full px-3 py-1.5 focus:z-10 focus:outline-none transition-all
          {activeIdx === i
                                ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'}"
                            >
                              {i === 0
                                ? stock_detail_stats_annual()
                                : stock_detail_stats_quarterly()}
                            </button>
                          {/each}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="w-full overflow-x-auto">
                <table
                  class="table table-sm table-compact w-full text-gray-700 dark:text-zinc-200 tabular-nums m-auto rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 mt-2"
                >
                  <thead>
                    <TableHeader {columns} {sortOrders} {sortData} />
                  </thead>
                  <tbody>
                    {#each paginatedTableList as item}
                      <!-- row -->
                      <tr class="transition-colors">
                        <td class=" text-sm whitespace-nowrap">
                          {new Date(item?.date)?.toLocaleDateString("en-US", {
                            day: "2-digit", // Include day number
                            month: "short", // Display short month name
                            year: "numeric", // Include year
                          })}
                        </td>

                        <td class=" text-sm text-right whitespace-nowrap">
                          {@html abbreviateNumber(item?.marketCap, false, true)}
                        </td>

                        <td class=" text-sm whitespace-nowrap text-end">
                          {#if item?.changesPercentage}
                            <span
                              class={item?.changesPercentage >= 0
                                ? "text-emerald-800 dark:text-emerald-400 before:content-['+']"
                                : "text-rose-800 dark:text-rose-400"}
                            >
                              {item?.changesPercentage
                                ? item?.changesPercentage + "%"
                                : "n/a"}
                            </span>
                          {:else}
                            n/a
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
              {/if}
            </div>
          {:else}
            <Infobox text={stock_detail_no_data()} />
          {/if}
        </div>
      </main>
    </div>
  </div>
</section>

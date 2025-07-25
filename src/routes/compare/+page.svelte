<script lang="ts">
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { onMount } from "svelte";
  import { abbreviateNumber } from "$lib/utils";
  import { screenWidth } from "$lib/store";
  import { Combobox } from "bits-ui";
  import { toast } from "svelte-sonner";
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";

  import { mode } from "mode-watcher";
  import highcharts from "$lib/highcharts.ts";

  import SEO from "$lib/components/SEO.svelte";

  export let data;
  const defaultList = [
    { name: "Market Cap", rule: "marketCap" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "Volume", rule: "volume" },
    { name: "PE Ratio", rule: "priceToEarningsRatio" },
    { name: "Revenue", rule: "revenue" },
    { name: "Gross Profit", rule: "grossProfit" },
  ];
  const excludedRules = new Set([
    "volume",
    "price",
    "changesPercentage",
    "revenue",
    "eps",
    "marketCap",
    "grossProfit",
    "priceToEarningsRatio",
    "eps",
  ]);

  let isLoaded = false;
  let configGraph = null;
  let configReturn = null;
  let downloadWorker: Worker | undefined;

  let selectedPlotPeriod = "3Y";

  let selectedPlotCategory = {
    name: "Stock Price",
    value: "close",
    type: "price",
  };

  let categoryList = [
    { name: "Stock Price", value: "close", type: "price" },
    { name: "Market Cap", value: "marketCap", type: "marketCap" },
    { name: "Dividend Yield", value: "yield", type: "dividend" },
    { name: "Dividends", value: "adjDividend", type: "dividend" },
    {
      name: "Payout Ratio",
      value: "dividendPayoutRatio",
      type: "ratios-quarter",
    },
    { name: "Revenue", value: "revenue", type: "income" },
    {
      name: "Revenue Growth",
      value: "growthRevenue",
      type: "income-growth-ttm",
    },
    {
      name: "Operating Income",
      value: "operatingIncome",
      type: "income",
    },
    {
      name: "Operating Income Growth",
      value: "growthOperatingIncome",
      type: "income-growth-ttm",
    },
    { name: "Net Income", value: "netIncome", type: "income" },
    {
      name: "Net Income Growth",
      value: "growthNetIncome",
      type: "income-growth-ttm",
    },
    { name: "EBIT", value: "ebit", type: "income" },
    { name: "EBITDA", value: "ebitda", type: "income" },
    {
      name: "Operating Cash Flow",
      value: "operatingCashFlow",
      type: "cash-flow",
    },
    {
      name: "Operating Expenses",
      value: "operatingExpenses",
      type: "income",
    },
    { name: "Enterprise Value", value: "enterpriseValue", type: "key-metrics" },
    {
      name: "Short % Float",
      value: "shortPercentOfFloat",
      type: "share-statistics",
    },
    { name: "Short Ratio", value: "daysToCover", type: "share-statistics" },
    { name: "EPS (Diluted)", value: "epsDiluted", type: "income" },
    {
      name: "EPS Growth",
      value: "growthEPSDiluted",
      type: "income-growth-ttm",
    },
    {
      name: "Gross Profit Margin",
      value: "grossProfitMargin",
      type: "ratios-quarter",
    },
    { name: "Profit Margin", value: "netProfitMargin", type: "ratios-quarter" },
    {
      name: "Operating Margin",
      value: "operatingProfitMargin",
      type: "ratios-quarter",
    },
    { name: "EBITDA Margin", value: "ebitdaMargin", type: "ratios-quarter" },
    { name: "PE Ratio", value: "priceToEarningsRatio", type: "ratios-quarter" },
    { name: "PS Ratio", value: "priceToSalesRatio", type: "ratios-quarter" },
    { name: "PB Ratio", value: "priceToBookRatio", type: "ratios-quarter" },
    { name: "EV / Sales Ratio", value: "evToSales", type: "ratios-quarter" },
    { name: "EV / EBITDA Ratio", value: "evToEBITDA", type: "ratios-quarter" },
    {
      name: "EV / FCF Ratio",
      value: "evToFreeCashFlow",
      type: "ratios-quarter",
    },
    { name: "Income Tax", value: "incomeTaxExpense", type: "income" },
    {
      name: "Effective Tax Rate",
      value: "effectiveTaxRate",
      type: "ratios-quarter",
    },
    { name: "Free Cash Flow", value: "freeCashFlow", type: "cash-flow" },
    { name: "Total Debt", value: "totalDebt", type: "balance-sheet" },
    {
      name: "Research & Development",
      value: "researchAndDevelopmentExpenses",
      type: "income",
    },
    {
      name: "Shared-Based Compensation",
      value: "stockBasedCompensation",
      type: "cash-flow",
    },
    {
      name: "Return on Assets (ROA)",
      value: "returnOnAssets",
      type: "ratios-ttm",
    },
    {
      name: "Return on Equity (ROE)",
      value: "returnOnEquity",
      type: "ratios-ttm",
    },
    {
      name: "Return on Invested Capital (ROIC)",
      value: "returnOnInvestedCapital",
      type: "ratios-ttm",
    },
  ];
  let tickerList = [];

  const colorPairs = [
    { light: "#1E90FF", dark: "#60A5FA" }, // DodgerBlue → SkyBlue
    { light: "#9400D3", dark: "#7C3AED" }, // DarkViolet → Violet
    { light: "#006400", dark: "#22C55E" }, // DarkGreen → Emerald
    { light: "#DC143C", dark: "#F43F5E" }, // Crimson → Rose
    { light: "#4682B4", dark: "#60A5FA" }, // SteelBlue → SkyBlue
    { light: "#FFFF00", dark: "#FACC15" }, // Yellow → Amber
    { light: "#A9A9A9", dark: "#D1D5DB" }, // DarkGray → Gray-300
    { light: "#000000", dark: "#F9FAFB" }, // Black → Gray-50
    { light: "#FF8C00", dark: "#FDBA74" }, // DarkOrange → Orange-300
    { light: "#20B2AA", dark: "#2DD4BF" }, // LightSeaGreen → Teal-300
  ];

  // Search variables
  let searchBarData = [];
  let timeoutId: ReturnType<typeof setTimeout>;
  let inputValue = "";
  let touchedInput = false;
  let rawGraphData = {};
  let rawTableData = [];

  const handleDownloadMessage = async (event) => {
    isLoaded = false;
    const output = event?.data?.output;
    rawGraphData = output?.graph;
    rawTableData = [...output?.table];

    handleSave();
    configGraph = plotData() || null;
    configReturn = plotReturn() || null;

    isLoaded = true;
  };

  async function changeCategory(category) {
    isLoaded = false;
    selectedPlotCategory = category;

    downloadWorker?.postMessage({
      tickerList: tickerList,
      category: selectedPlotCategory,
    });
  }
  function addTicker(data) {
    isLoaded = false;
    const ticker = data?.symbol?.trim()?.toUpperCase();

    if (tickerList?.includes(ticker)) {
      toast?.error("Ticker is already included");
    } else {
      tickerList.push(ticker);
    }
    tickerList = [...tickerList];

    handleSave();
    setTimeout(() => {
      inputValue = "";
    }, 0);

    downloadWorker?.postMessage({
      tickerList: tickerList,
      category: selectedPlotCategory,
    });
  }
  function removeTicker(symbol) {
    const ticker = symbol?.trim()?.toUpperCase();

    // Guard clause: ensure the ticker exists
    if (!tickerList?.includes(ticker)) {
      toast?.error(`Ticker "${ticker}" not found in your watchlist`);
      return;
    }

    // Remove the ticker
    tickerList = [...tickerList?.filter((item) => item !== ticker)];

    // Persist the change
    handleSave();
    downloadWorker?.postMessage({
      tickerList: tickerList,
      category: selectedPlotCategory,
    });
  }

  async function search() {
    clearTimeout(timeoutId); // Clear any existing timeout

    if (!inputValue.trim()) {
      // Skip if query is empty or just whitespace
      searchBarData = []; // Clear previous results
      return;
    }

    timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/searchbar?query=${encodeURIComponent(inputValue)}&limit=10`,
        );

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }

        searchBarData = await response.json();
      } catch (error) {
        console.error("Error during search:", error);
        searchBarData = [];
      }
    }, 50); // delay
  }

  function handleSave() {
    try {
      // Create filtered strategies without strikeList and dateList

      // Save the filtered version
      localStorage?.setItem(
        "compare-stocks",
        JSON?.stringify({
          tickerList: tickerList,
          selectedPlotCategory: selectedPlotCategory,
        }),
      );
    } catch (e) {
      console.log("Failed saving compare stocks data: ", e);
    }
  }

  function changePlotPeriod(timePeriod) {
    isLoaded = false;
    selectedPlotPeriod = timePeriod;
    downloadWorker?.postMessage({
      tickerList: tickerList,
      category: selectedPlotCategory,
    });
  }

  function filterDataByTimePeriod(history) {
    const now = new Date();

    let thresholdDate;

    switch (selectedPlotPeriod) {
      case "1M":
        thresholdDate = new Date(now);
        thresholdDate.setMonth(now.getMonth() - 1);
        break;
      case "3M":
        thresholdDate = new Date(now);
        thresholdDate.setMonth(now.getMonth() - 3);
        break;
      case "YTD":
        thresholdDate = new Date(now.getFullYear(), 0, 1);
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
      default: // "Max"
        thresholdDate = new Date(0);
    }

    return history?.filter((item) => new Date(item?.date) >= thresholdDate);
  }

  function plotData() {
    // 1) filter & parse each symbol's data into [timestamp, value] pairs
    const parsedData = {};

    for (const [symbol, data] of Object?.entries(rawGraphData)) {
      // Ensure `history` exists and is an array
      const series = Array?.isArray(data?.history) ? data?.history : [];

      // Filter by the desired time period and map to [timestamp, value] pairs
      parsedData[symbol] = filterDataByTimePeriod(series)?.map((item) => {
        const d = new Date(item?.date);
        return [
          Date.UTC(
            d.getUTCFullYear(),
            d.getUTCMonth(),
            d.getUTCDate(),
            d.getUTCHours(),
            d.getUTCMinutes(),
          ),
          item?.value,
        ];
      });
    }

    // 3) build series entries
    const series = Object?.entries(parsedData)?.map(([symbol, data], index) => {
      // wrap around if more symbols than colors
      const pair = colorPairs[index % colorPairs?.length];

      return {
        name: symbol,
        type: "spline", // or "area" if you still want fill
        data,
        color: $mode === "light" ? pair?.light : pair?.dark,
        lineWidth: 1.5,
        marker: { enabled: false },
      };
    });

    // Check if the selected category is percentage-based
    const isPercentageCategory = [
      "dividendPayoutRatio",
      "yield",
      "netProfitMargin",
      "ebitdaMargin",
      "freeCashFlowMargin",
      "operatingProfitMargin",
      "growthRevenue",
      "growthEPSDiluted",
      "growthOperatingIncome",
      "growthNetIncome",
      "shortPercentOfFloat",
      "returnOnEquity",
      "returnOnAssets",
      "returnOnInvestedCapital",
      "grossProfitMargin",
      "effectiveTaxRate",
    ].includes(selectedPlotCategory?.value);

    return {
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        animation: false,
        height: 500,
        events: {
          render: function () {
            const chart = this;

            // 0) Destroy any stray labels when series count shrinks
            if (chart?.customLabels) {
              // if we have more labels than series, kill the extras
              const extra = chart.customLabels.length - chart.series.length;
              if (extra > 0) {
                for (
                  let j = chart.series.length;
                  j < chart.customLabels.length;
                  j++
                ) {
                  chart.customLabels[j].destroy();
                }
                // truncate the array
                chart.customLabels.length = chart.series.length;
              }
            } else {
              chart.customLabels = [];
            }

            // 1) Loop over current series and create/update their labels
            chart.series.forEach((serie, i) => {
              if (!serie.points?.length) return;

              const lastPoint = serie.points[serie.points.length - 1];
              const value = isPercentageCategory
                ? lastPoint.y.toFixed(2) + "%"
                : abbreviateNumber(lastPoint.y);
              const xPos = chart.plotWidth + 10;
              const yPos = lastPoint.plotY + chart.plotTop - 15;

              if (!chart.customLabels[i]) {
                // new series → draw a label
                chart.customLabels[i] = chart.renderer
                  .label(value, xPos, yPos, "bubble", 0, 0, true)
                  .attr({ padding: 5, r: 4, fill: serie.color, zIndex: 10 })
                  .css({ color: "#fff", fontSize: "11px" })
                  .add();
              } else {
                // existing series → move & update text
                chart.customLabels[i]
                  .attr({ text: value, x: xPos, y: yPos })
                  .toFront();
              }
            });
          },
        },
      },
      credits: { enabled: false },
      title: {
        text: `<h3 class="mt-3 mb-1"></h3>`,
        useHTML: true,
        style: { color: $mode === "light" ? "black" : "white" },
      },
      tooltip: {
        shared: ["price", "marketCap"]?.includes(selectedPlotCategory?.value),
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        style: {
          color: "#fff",
          fontSize: "16px",
          padding: "10px",
        },
        borderRadius: 4,
        formatter: function () {
          // Format the x value
          const dateStr = new Date(this?.x)?.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          });

          let tooltipContent = `<span class="m-auto text-[1rem] font-[501] ">${dateStr}</span><br>`;

          // If shared, this.points is an array
          if (this.points) {
            this.points.forEach((point) => {
              const formattedValue = isPercentageCategory
                ? point.y.toFixed(2) + "%"
                : abbreviateNumber(point.y);

              tooltipContent += `
        <span style="display:inline-block; width:10px; height:10px; background-color:${point.color}; border-radius:5%; margin-right:3px;"></span>
        <span class="font-semibold text-xs">${point.series.name}:</span> 
        <span class="font-normal text-sm">${formattedValue}</span><br>`;
            });
          } else {
            // Non-shared, handle single point
            const formattedValue = isPercentageCategory
              ? this.y.toFixed(2) + "%"
              : abbreviateNumber(this.y);

            tooltipContent += `
      <span style="display:inline-block; width:10px; height:10px; background-color:${this.color}; border-radius:5%; margin-right:3px;"></span>
      <span class="font-semibold text-xs">${this.series.name}:</span> 
      <span class="font-normal text-sm">${formattedValue}</span><br>`;
          }

          return tooltipContent;
        },
      },
      xAxis: {
        type: "datetime",
        tickLength: 0,
        crosshair: {
          color: $mode === "light" ? "black" : "white",
          width: 1,
          dashStyle: "Solid",
        },
        labels: {
          style: { color: $mode === "light" ? "black" : "white" },
          distance: 10,
          formatter() {
            const d = new Date(this.value);
            return `<span class="text-xs">${d.toLocaleDateString("en-US", {
              year: "2-digit",
              month: "short",
              timeZone: "UTC",
            })}</span>`;
          },
        },
        tickPositioner() {
          const { min, max } = this.getExtremes();
          const ticks = [];
          const count = $screenWidth < 640 ? 2 : 5;
          const interval = Math.floor((max - min) / count);
          for (let i = 0; i <= count; i++) {
            ticks.push(min + i * interval);
          }
          return ticks;
        },
      },
      yAxis: {
        startOnTick: true,
        endOnTick: true,
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        title: { text: null },
        labels: {
          style: { color: $mode === "light" ? "black" : "white" },
          formatter: function () {
            if (isPercentageCategory) {
              return this.value.toFixed(2) + "%";
            }
            return abbreviateNumber(this.value);
          },
        },
        opposite: true,
      },
      plotOptions: {
        series: {
          animation: false,
          marker: { enabled: false },
          states: { hover: { enabled: false } },
          legendSymbol: "rectangle",
        },
      },
      legend: {
        enabled: true,
        align: "center", // left side
        verticalAlign: "bottom", // top edge
        layout: "horizontal",
        squareSymbol: false, // use our rectangle shape
        symbolWidth: 20,
        symbolHeight: 12,
        symbolRadius: 0,

        itemStyle: {
          color: $mode === "light" ? "black" : "white",
        },
      },

      series,
    };
  }

  function plotReturn() {
    const parsedData = {};
    for (const [symbol, series] of Object?.entries(rawGraphData)) {
      // Map each percentage to [index, value] (could be date-based if needed)
      parsedData[symbol] = series?.changesPercentage;
    }

    // 2) build series entries
    const series = Object.entries(parsedData)?.map(([symbol, data], index) => {
      const pair = colorPairs[index % colorPairs?.length];

      return {
        name: symbol,
        type: "column", // change to bar chart
        data,
        color: $mode === "light" ? pair?.light : pair?.dark,
        borderRadius: 2,
        pointPadding: 0.2,
      };
    });

    // 3) return Highcharts options
    return {
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        animation: false,
        height: 360,
      },
      credits: { enabled: false },
      title: {
        text: null,
        useHTML: true,
        style: { color: $mode === "light" ? "black" : "white" },
      },
      tooltip: {
        useHTML: true,
        shared: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        borderRadius: 4,
        style: {
          color: $mode === "light" ? "black" : "white",
          fontSize: "16px",
          padding: "10px",
        },
        formatter() {
          return `
          <span class="text-white text-[1rem] font-[501]">
            ${this.series.name}: ${this.y}%
          </span><br>
          <span class="text-white text-sm font-normal">
           ${this.x}
          </span>
        `;
        },
      },
      xAxis: {
        categories: ["1 Month", "YTD", "1 Year", "5 Years", "Max"],
        title: null,
        labels: {
          style: { color: $mode === "light" ? "black" : "white" },
        },
      },
      yAxis: {
        title: null,
        opposite: true,
        min: -100,
        max: 100,
        ttckPositions: [0, 50, 100],
        labels: {
          formatter() {
            // only render labels for > 0
            return this.value >= 0 ? this.value + "%" : null;
          },
          style: {
            color: $mode === "light" ? "black" : "white",
          },
        },
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        startOnTick: true,
        endOnTick: true,
      },

      plotOptions: {
        column: {
          borderWidth: 0,
          groupPadding: 0.1,
        },
        legendSymbol: "rectangle",
        series: {
          animation: false,
          states: { hover: { enabled: false } },
        },
      },

      legend: {
        enabled: true,
        align: "center", // left side
        verticalAlign: "bottom", // top edge
        layout: "horizontal",

        // nudge in by 12px (≈ mt-3 / ml-3)
        x: 0,
        y: 12,

        squareSymbol: false, // use our rectangle shape
        symbolWidth: 20,
        symbolHeight: 12,
        symbolRadius: 0,

        itemStyle: {
          color: $mode === "light" ? "black" : "white",
        },
      },
      series,
    };
  }

  onMount(async () => {
    try {
      const savedData = localStorage?.getItem("compare-stocks");

      if (savedData) {
        const parsedData = JSON.parse(savedData);
        tickerList = parsedData?.tickerList;
        selectedPlotCategory = parsedData?.selectedPlotCategory;
      }
    } catch (e) {
      console.log(e);
    }

    if (!downloadWorker) {
      const DownloadWorker = await import(
        "$lib/workers/downloadCompareWorker?worker"
      );
      downloadWorker = new DownloadWorker.default();
      downloadWorker.onmessage = handleDownloadMessage;
    }

    downloadWorker?.postMessage({
      tickerList: tickerList,
      category: selectedPlotCategory,
    });
  });
</script>

<SEO
  title="Stock Comparison Tool"
  description="Compare Stocks side by side, including charts, performance, statistics, financials, and more."
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3"
>
  <div class="text-sm sm:text-[1rem] breadcrumbs">
    <ul>
      <li><a href="/" class="text-muted dark:text-gray-300">Home</a></li>
      <li class="text-muted dark:text-gray-300">Compare Stocks</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class="mb-6 border-[#2C6288] dark:border-white border-b-[2px]">
            <h1 class="mb-1 text-2xl sm:text-3xl font-bold">
              {tickerList?.length === 0
                ? "Compare Stocks"
                : `Compare Stocks: ${tickerList.join(" vs ")}`}
            </h1>
          </div>

          <div class="mt-4">
            <div class="flex flex-col items-start">
              <div
                class="{$screenWidth < 640 && $screenWidth
                  ? 'grid grid-cols-1'
                  : 'flex flex-row'} items-center w-full mt-3 mb-3"
              >
                <Combobox.Root
                  items={searchBarData}
                  bind:inputValue
                  bind:touchedInput
                >
                  <div class="relative w-full">
                    <div
                      class="absolute inset-y-0 left-0 flex items-center pl-2.5"
                    >
                      <svg
                        class="h-4 w-4 text-icon xs:h-5 xs:w-5"
                        fill="none"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="3"
                        stroke="currentcolor"
                        viewBox="0 0 24 24"
                        style="max-width: 40px"
                        aria-hidden="true"
                      >
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        ></path>
                      </svg>
                    </div>

                    <Combobox.Input
                      on:input={search}
                      disabled={tickerList?.length > 10 ? true : false}
                      class="{tickerList?.length > 10
                        ? 'cursor-not-allowed'
                        : ''} text-sm sm:text-[1rem] controls-input shadow-xs focus:bg-gray-50 dark:focus:bg-[#121217] focus:outline-hidden border border-gray-300 dark:border-gray-600 rounded placeholder:text-gray-600 dark:placeholder:text-gray-200 px-3 py-2 pl-8 xs:pl-10 grow w-full "
                      placeholder="Add new stock..."
                      aria-label="Add new stock..."
                    />
                  </div>

                  <Combobox.Content
                    class="z-10 w-full {inputValue?.length > 0
                      ? ''
                      : 'hidden'} rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-default px-1 py-2 shadow-xs outline-hidden"
                    sideOffset={8}
                  >
                    {#if inputValue?.length !== 0}
                      {#each searchBarData as searchItem}
                        <Combobox.Item
                          class="py-2.5 cursor-pointer border-b border-gray-300 dark:border-gray-500 last:border-none flex h-fit w-auto select-none items-center rounded-button  px-2  text-sm capitalize outline-hidden transition-all duration-75 data-highlighted:bg-gray-200 dark:data-highlighted:bg-primary"
                          value={searchItem?.symbol}
                          label={searchItem?.symbol}
                          on:click={(e) => addTicker(searchItem)}
                        >
                          <div
                            class="flex flex-col sm:flex-row items-start sm:items-center"
                          >
                            <span
                              class="text-sm text-blue-700 dark:text-blue-400"
                              >{searchItem?.symbol}</span
                            >
                            <span
                              class="ml-0 sm:ml-2 text-xs sm:text-sm text-muted dark:text-white"
                              >{searchItem?.name}</span
                            >
                          </div>
                        </Combobox.Item>
                      {:else}
                        <span
                          class="block px-5 py-2 text-sm text-muted dark:text-white"
                        >
                          No results found
                        </span>
                      {/each}
                    {:else}
                      <Combobox.Item
                        class="cursor-pointer border-b border-gray-300 dark:border-gray-600 last:border-none flex h-fit w-auto select-none items-center rounded-button py-1.5 pl-5 pr-1.5 text-sm capitalize outline-hidden"
                      >
                        <span class=" text-sm text-muted dark:text-white">
                          {inputValue?.length > 0
                            ? "No results found"
                            : "Start searching..."}
                        </span>
                      </Combobox.Item>
                    {/if}
                  </Combobox.Content>
                </Combobox.Root>

                <div
                  class="order-last w-full sm:w-fit relative inline-block text-left cursor-pointer mt-3 sm:mt-0 sm:ml-3 shadow-xs"
                >
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild let:builder>
                      <Button
                        builders={[builder]}
                        class="w-full min-w-auto border-gray-300 font-semibold dark:font-normal dark:border-gray-600 border text-white bg-black sm:hover:bg-default dark:bg-default dark:sm:hover:bg-primary ease-out  flex flex-row justify-between items-center px-3 py-2 h-10  rounded truncate"
                      >
                        <span class="truncate text-sm"
                          >{selectedPlotCategory?.name}</span
                        >
                        <svg
                          class="-mr-1 ml-3 h-5 w-5 xs:ml-2 inline-block"
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
                      class="w-full max-w-80 sm:w-64 h-fit max-h-72 overflow-y-auto scroller"
                    >
                      <DropdownMenu.Group>
                        {#each categoryList as item}
                          <DropdownMenu.Item
                            on:click={() => changeCategory(item)}
                            class="{selectedPlotCategory?.name === item?.name
                              ? 'bg-gray-200 dark:bg-primary'
                              : ''} cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                          >
                            {item?.name}
                          </DropdownMenu.Item>
                        {/each}
                      </DropdownMenu.Group>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </div>
              </div>
              <div class="w-full">
                {#each tickerList as t, i}
                  <span
                    class="shadow-xs inline-flex items-center gap-x-2 mb-1.5 sm:mt-0 mr-2 px-1 py-1 text-sm font-semibold rounded border-1 border-l-4 border-gray-300 dark:border-gray-600"
                    style="border-left-color: {colorPairs[
                      i % colorPairs?.length
                    ][$mode ? 'dark' : 'light']}"
                  >
                    <span class="ml-1">{t}</span>
                    <button
                      type="button"
                      on:click={() => removeTicker(t)}
                      class="-ml-1"
                      aria-label="Remove {t}"
                    >
                      <svg
                        class=" h-4 w-4 cursor-pointer"
                        viewBox="0 -0.5 25 25"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                          id="SVGRepo_tracerCarrier"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        ></g><g id="SVGRepo_iconCarrier">
                          <path
                            d="M6.96967 16.4697C6.67678 16.7626 6.67678 17.2374 6.96967 17.5303C7.26256 17.8232 7.73744 17.8232 8.03033 17.5303L6.96967 16.4697ZM13.0303 12.5303C13.3232 12.2374 13.3232 11.7626 13.0303 11.4697C12.7374 11.1768 12.2626 11.1768 11.9697 11.4697L13.0303 12.5303ZM11.9697 11.4697C11.6768 11.7626 11.6768 12.2374 11.9697 12.5303C12.2626 12.8232 12.7374 12.8232 13.0303 12.5303L11.9697 11.4697ZM18.0303 7.53033C18.3232 7.23744 18.3232 6.76256 18.0303 6.46967C17.7374 6.17678 17.2626 6.17678 16.9697 6.46967L18.0303 7.53033ZM13.0303 11.4697C12.7374 11.1768 12.2626 11.1768 11.9697 11.4697C11.6768 11.7626 11.6768 12.2374 11.9697 12.5303L13.0303 11.4697ZM16.9697 17.5303C17.2626 17.8232 17.7374 17.8232 18.0303 17.5303C18.3232 17.2374 18.3232 16.7626 18.0303 16.4697L16.9697 17.5303ZM11.9697 12.5303C12.2626 12.8232 12.7374 12.8232 13.0303 12.5303C13.3232 12.2374 13.3232 11.7626 13.0303 11.4697L11.9697 12.5303ZM8.03033 6.46967C7.73744 6.17678 7.26256 6.17678 6.96967 6.46967C6.67678 6.76256 6.67678 7.23744 6.96967 7.53033L8.03033 6.46967ZM8.03033 17.5303L13.0303 12.5303L11.9697 11.4697L6.96967 16.4697L8.03033 17.5303ZM13.0303 12.5303L18.0303 7.53033L16.9697 6.46967L11.9697 11.4697L13.0303 12.5303ZM11.9697 12.5303L16.9697 17.5303L18.0303 16.4697L13.0303 11.4697L11.9697 12.5303ZM13.0303 11.4697L8.03033 6.46967L6.96967 7.53033L11.9697 12.5303L13.0303 11.4697Z"
                            fill="currentColor"
                          ></path>
                        </g></svg
                      >
                    </button>
                  </span>
                {/each}
              </div>
            </div>
          </div>

          {#if tickerList?.length > 0}
            {#if configGraph && isLoaded}
              <div class="relative mt-2">
                <div
                  class="flex justify-start space-x-2 w-full left-4 absolute top-3.5 z-10"
                >
                  {#each ["1Y", "3Y", "5Y", "Max"] as item}
                    <label
                      on:click={() => changePlotPeriod(item)}
                      class="px-2 sm:px-3 py-1 {selectedPlotPeriod === item
                        ? 'bg-gray-300 dark:bg-white text-muted'
                        : 'text-muted dark:text-white bg-gray-100 dark:bg-table text-opacity-[0.6]'} text-xs border border-gray-200 dark:border-gray-700 font-semibold transition ease-out duration-100 sm:hover:bg-white sm:hover:text-black rounded-[2px] cursor-pointer"
                    >
                      {item}
                    </label>
                  {/each}
                </div>
              </div>
              <div
                class="shadow-xs border border-gray-300 dark:border-gray-800 rounded w-full"
                use:highcharts={configGraph}
              ></div>
            {:else}
              <div
                class="mt-2 flex justify-center items-center h-96 border border-gray-300 dark:border-gray-800 rounded"
              >
                <div class="relative">
                  <label
                    class="shadow-xs bg-default dark:bg-secondary rounded h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  >
                    <span
                      class="loading loading-spinner loading-md text-white dark:text-white"
                    ></span>
                  </label>
                </div>
              </div>
            {/if}

            {#if rawTableData?.length > 0 && isLoaded}
              {#key rawTableData}
                <Table
                  title="Comparison"
                  {data}
                  rawData={rawTableData}
                  {defaultList}
                  {excludedRules}
                />
              {/key}
            {/if}

            {#if configReturn && isLoaded && tickerList?.length > 0}
              <h2 class="mt-8 text-xl -mb-2 sm:text-2xl font-bold">
                Average Return
              </h2>
              <Infobox
                text="The average return is based on the stock’s total return, using the compounded annual growth rate (CAGR). It accounts for stock splits and includes dividends."
              />

              <div
                class="mt-5 border border-gray-300 dark:border-gray-800 rounded w-full"
              >
                <div class="shadow-xs" use:highcharts={configReturn}></div>

                <div class="mt-8 hidden px-4 pb-3 md:block">
                  <table class="w-full">
                    <thead
                      ><tr
                        class="border-b border-gray-300 dark:border-gray-800 text-left *:px-2 *:py-1 *:font-semibold"
                        ><th class="text-left">Symbol</th> <th>1 Month</th>
                        <th>Year-to-date</th>
                        <th>1 Year</th> <th>5 Years</th>
                        <th>Max</th></tr
                      ></thead
                    >
                    <tbody>
                      {#each tickerList as ticker, idx}
                        <tr
                          class="border-b border-gray-300 dark:border-gray-800 text-left *:px-2 *:py-1 last:border-0 hover:bg-table-hover"
                        >
                          <td class="flex items-center gap-x-1">
                            <div
                              class="size-4 rounded-sm"
                              style="background-color: {$mode === 'light'
                                ? colorPairs[idx % colorPairs?.length].light
                                : colorPairs[idx % colorPairs?.length].dark}"
                            ></div>
                            <a
                              href={`/stocks/${ticker}/`}
                              class="font-semibold"
                            >
                              {ticker}
                            </a>
                          </td>

                          {#if Array.isArray(tickerList) && tickerList.length > 0 && tickerList.every((tkr) => Array.isArray(rawGraphData[tkr]?.changesPercentage) && rawGraphData[tkr].changesPercentage.length > 0)}
                            {#each rawGraphData[ticker]?.changesPercentage as pct}
                              <td>{pct != null ? `${pct}%` : "-"}</td>
                            {/each}
                          {/if}
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              </div>
            {/if}
          {:else}
            <div
              class="mt-3 rounded border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-[#2A2E39] xs:mt-4 md:mt-6"
            >
              <div
                class="flex h-[300px] w-full items-center justify-center overflow-y-hidden rounded px-8 bp:h-[350px] md:h-[400px] lg:h-[500px]"
              >
                <div class="text-center text-xl font-semibold sm:text-2xl">
                  Add a symbol to get started
                </div>
              </div>
            </div>
          {/if}
        </main>
      </div>
    </div>
  </div>
</section>

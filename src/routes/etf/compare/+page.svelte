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
  import InfoModal from "$lib/components/InfoModal.svelte";

  import { mode } from "mode-watcher";
  import highcharts from "$lib/highcharts.ts";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";

  import SEO from "$lib/components/SEO.svelte";
  import {
    ETF_COMPARE_DEFAULT_LIST,
    ETF_COMPARE_INDICATOR_DEFAULT_ROWS,
    ETF_COMPARE_INDICATOR_ROWS,
    ETF_COMPARE_TAB_RULE_SETS,
    ETF_COMPARE_TABS,
  } from "$lib/config/etfCompareTable";
  import {
    compare_average_return,
    compare_breadcrumb_home,
    compare_no_results,
    compare_popular_comparisons,
    compare_search_placeholder,
    compare_seo_keywords,
    compare_start_searching,
    compare_table_1month,
    compare_table_1year,
    compare_table_5years,
    compare_table_symbol,
    compare_table_ytd,
    compare_toast_invalid_list,
    compare_toast_ticker_included,
    compare_toast_ticker_not_found,
  } from "$lib/paraglide/messages";

  export let data;
  const defaultList = [...ETF_COMPARE_DEFAULT_LIST];
  const excludedRules = new Set(defaultList.map((item) => item.rule));

  let isLoaded = false;
  let configGraph = null;
  let configReturn = null;
  let downloadWorker: Worker | undefined;

  let selectedPlotPeriod = "3Y";

  let selectedPlotCategory = {
    name: "Total Return (%)",
    value: "totalReturnPct",
    type: "total-return-pct",
  };

  let categoryList = [
    { name: "Stock Price", value: "close", type: "price" },
    { name: "Price Change (%)", value: "close", type: "price-change" },
    { name: "Total Return", value: "totalReturn", type: "total-return" },
    {
      name: "Total Return (%)",
      value: "totalReturnPct",
      type: "total-return-pct",
    },
    { name: "Dividends (TTM)", value: "dividendTTM", type: "dividend-ttm" },
    {
      name: "Dividend Growth",
      value: "dividendGrowth",
      type: "dividend-growth",
    },
    {
      name: "Dividend Growth (YoY)",
      value: "dividendGrowthYoY",
      type: "dividend-growth-yoy",
    },
  ];
  const popularComparisons = [
    ["QQQ", "SPY"],
    ["VOO", "SPY"],
    ["VTI", "VOO"],
    ["SCHD", "VYM"],
    ["IWM", "SPY"],
    ["XLK", "VGT"],
    ["XLF", "VFH"],
    ["SOXX", "SMH"],
    ["DIA", "SPY"],
    ["TLT", "IEF"],
    ["GLD", "SLV"],
    ["BND", "AGG"],
    ["VNQ", "SCHH"],
    ["BITO", "IBIT"],
    ["ARKK", "QQQ"],
    ["VWO", "EEM"],
  ];
  let tickerList = [];

  const colorPairs = [
    { light: "#1181fe", dark: "#1181fe" }, // DodgerBlue → SkyBlue
    { light: "#ec7336", dark: "#ec7336" }, // DarkViolet → Violet
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
  type TopHolding = {
    rank: number;
    symbol: string;
    name: string;
    weightPercentage: number | null;
  };

  type TopHoldingsPayload = {
    lastUpdate?: string | null;
    holdings?: Array<Record<string, unknown>>;
  };

  const MAX_COMPARE_HOLDINGS = 10;
  const RETURN_PERIOD_LABELS = [
    "1 Month",
    "YTD",
    "1 Year",
    "5 Years",
    "10 Years",
  ];
  const RETURN_ONE_YEAR_INDEX = 2;
  const RETURN_TEN_YEAR_INDEX = 4;
  const AVERAGE_RETURN_INFO_MODAL_TEXT =
    "The average return is based on the stock's total return, using the compounded annual growth rate (CAGR). It accounts for stock splits and includes dividends.";
  let averageReturnInfoText = "";
  let showAverageReturnInfo = false;
  let topHoldingsByTicker: Record<string, TopHolding[]> = {};
  let holdingsLastUpdateByTicker: Record<string, string | null> = {};
  let isTopHoldingsLoading = false;
  let holdingsRequestVersion = 0;
  const TOP_HOLDINGS_CACHE_TTL_MS = 10 * 60 * 1000;
  const topHoldingsCache = new Map<
    string,
    { holdings: TopHolding[]; lastUpdate: string | null; fetchedAt: number }
  >();

  const isEtfSearchbarItem = (item) => {
    const rawType = String(item?.type ?? item?.assetType ?? "")
      .trim()
      .toLowerCase();
    return rawType === "etf" || rawType === "etfs";
  };

  const toFiniteNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  const formatPercentValue = (value) => {
    const numeric = toFiniteNumber(value);
    return numeric == null ? "-" : `${numeric.toFixed(2)}%`;
  };

  const formatHoldingsLastUpdate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  };

  const normalizeTopHoldings = (
    payload: TopHoldingsPayload | null | undefined,
  ) => {
    const rawHoldings = Array.isArray(payload?.holdings)
      ? payload?.holdings
      : [];
    const normalized = rawHoldings
      ?.map((item, index) => {
        const row = (item ?? {}) as Record<string, unknown>;
        const symbol = String(row?.symbol ?? "")
          .trim()
          .toUpperCase();
        const rank = toFiniteNumber(row?.rank);
        return {
          rank: rank == null ? index + 1 : rank,
          symbol,
          name: String(row?.name ?? "").trim(),
          weightPercentage: toFiniteNumber(row?.weightPercentage),
        };
      })
      ?.filter((item): item is TopHolding => Boolean(item?.symbol));

    const topHoldings = normalized
      ?.sort((a, b) => {
        const rankA = toFiniteNumber(a?.rank) ?? Number.POSITIVE_INFINITY;
        const rankB = toFiniteNumber(b?.rank) ?? Number.POSITIVE_INFINITY;
        return rankA - rankB;
      })
      ?.slice(0, MAX_COMPARE_HOLDINGS);

    return {
      lastUpdate:
        typeof payload?.lastUpdate === "string" && payload?.lastUpdate
          ? payload?.lastUpdate
          : null,
      holdings: topHoldings,
    };
  };

  async function fetchTopHoldings(ticker: string) {
    const cached = topHoldingsCache?.get(ticker);
    if (cached && Date.now() - cached.fetchedAt < TOP_HOLDINGS_CACHE_TTL_MS) {
      return cached;
    }

    const response = await fetch("/api/etf-holdings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ticker }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ETF holdings for ${ticker}`);
    }

    const output = await response.json();
    const normalized = normalizeTopHoldings(output);
    const cacheEntry = {
      ...normalized,
      fetchedAt: Date.now(),
    };
    topHoldingsCache?.set(ticker, cacheEntry);
    return cacheEntry;
  }

  async function refreshTopHoldings(selectedTickers: string[]) {
    const requestVersion = ++holdingsRequestVersion;
    const uniqueTickers = [
      ...new Set(
        (Array.isArray(selectedTickers) ? selectedTickers : [])
          ?.map((item) =>
            String(item ?? "")
              .trim()
              .toUpperCase(),
          )
          ?.filter(Boolean),
      ),
    ];

    if (uniqueTickers?.length <= 1) {
      topHoldingsByTicker = {};
      holdingsLastUpdateByTicker = {};
      isTopHoldingsLoading = false;
      return;
    }

    isTopHoldingsLoading = true;

    try {
      const entries = await Promise.all(
        uniqueTickers.map(async (ticker) => {
          try {
            const data = await fetchTopHoldings(ticker);
            return [ticker, data] as const;
          } catch (error) {
            console.error(`Unable to load ETF holdings for ${ticker}:`, error);
            return [
              ticker,
              {
                holdings: [],
                lastUpdate: null,
              },
            ] as const;
          }
        }),
      );

      if (requestVersion !== holdingsRequestVersion) {
        return;
      }

      const nextTopHoldings: Record<string, TopHolding[]> = {};
      const nextLastUpdates: Record<string, string | null> = {};

      for (const [ticker, data] of entries) {
        nextTopHoldings[ticker] = Array.isArray(data?.holdings)
          ? data?.holdings?.slice(0, MAX_COMPARE_HOLDINGS)
          : [];
        nextLastUpdates[ticker] = data?.lastUpdate ?? null;
      }

      topHoldingsByTicker = nextTopHoldings;
      holdingsLastUpdateByTicker = nextLastUpdates;
    } finally {
      if (requestVersion === holdingsRequestVersion) {
        isTopHoldingsLoading = false;
      }
    }
  }

  const getRelativeComparisonText = (difference) => {
    const absDiff = Math.abs(difference);
    if (absDiff < 0.05) return "about the same as";
    if (absDiff < 1)
      return difference > 0 ? "slightly higher than" : "slightly lower than";
    return difference > 0 ? "higher than" : "lower than";
  };

  const buildAverageReturnInfoText = () => {
    if (tickerList?.length !== 2) {
      return null;
    }

    const primaryTicker = tickerList?.[0];
    const secondaryTicker = tickerList?.[1];
    if (!primaryTicker || !secondaryTicker) {
      return null;
    }

    const primaryReturns = rawGraphData?.[primaryTicker]?.changesPercentage;
    if (!Array.isArray(primaryReturns)) {
      return null;
    }

    const primaryOneYear = toFiniteNumber(
      primaryReturns?.[RETURN_ONE_YEAR_INDEX],
    );
    const primaryTenYear = toFiniteNumber(
      primaryReturns?.[RETURN_TEN_YEAR_INDEX],
    );
    if (primaryOneYear == null || primaryTenYear == null) {
      return null;
    }

    const secondaryReturns = secondaryTicker
      ? rawGraphData?.[secondaryTicker]?.changesPercentage
      : null;
    const secondaryOneYear = Array.isArray(secondaryReturns)
      ? toFiniteNumber(secondaryReturns?.[RETURN_ONE_YEAR_INDEX])
      : null;
    const secondaryTenYear = Array.isArray(secondaryReturns)
      ? toFiniteNumber(secondaryReturns?.[RETURN_TEN_YEAR_INDEX])
      : null;

    if (secondaryOneYear == null || secondaryTenYear == null) {
      return null;
    }

    const oneYearComparison = getRelativeComparisonText(
      primaryOneYear - secondaryOneYear,
    );
    return `In the past year, ${primaryTicker} returned a total of ${formatPercentValue(primaryOneYear)}, which is ${oneYearComparison} ${secondaryTicker}'s ${formatPercentValue(secondaryOneYear)} return. Over the past 10 years, ${primaryTicker} has had annualized average returns of ${formatPercentValue(primaryTenYear)}, compared to ${formatPercentValue(secondaryTenYear)} for ${secondaryTicker}. These numbers are adjusted for stock splits and include dividends.`;
  };

  $: {
    const infoText = buildAverageReturnInfoText();
    averageReturnInfoText = infoText ?? "";
    showAverageReturnInfo = Boolean(infoText);
  }

  $: if (typeof window !== "undefined") {
    void refreshTopHoldings(tickerList);
  }

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

  function getCategoryForAPI(category) {
    return category;
  }

  async function changeCategory(category) {
    isLoaded = false;
    selectedPlotCategory = category;

    downloadWorker?.postMessage({
      tickerList: tickerList,
      category: getCategoryForAPI(selectedPlotCategory),
      assetType: "etf",
    });
  }
  function addTicker(data) {
    isLoaded = false;
    const ticker = data?.symbol?.trim()?.toUpperCase();

    if (tickerList?.includes(ticker)) {
      toast?.error(compare_toast_ticker_included());
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
      category: getCategoryForAPI(selectedPlotCategory),
      assetType: "etf",
    });
  }

  function presetStrategy(defaultTickers) {
    isLoaded = false;
    tickerList = [];
    selectedPlotCategory = {
      name: "Total Return (%)",
      value: "totalReturnPct",
      type: "total-return-pct",
    };

    if (!Array.isArray(defaultTickers)) {
      toast?.error(compare_toast_invalid_list());
      return;
    }

    const newTickers = [];

    for (const rawTicker of defaultTickers) {
      const ticker = rawTicker?.trim()?.toUpperCase();
      if (!ticker) continue;

      if (tickerList?.includes(ticker)) {
        toast?.error(`Ticker ${ticker} is already included`);
      } else {
        newTickers.push(ticker);
      }
    }

    if (newTickers.length > 0) {
      tickerList = [...tickerList, ...newTickers];
      handleSave();

      // Clear input
      setTimeout(() => {
        inputValue = "";
      }, 0);

      downloadWorker?.postMessage({
        tickerList,
        category: getCategoryForAPI(selectedPlotCategory),
        assetType: "etf",
      });
    }
  }

  function removeTicker(symbol) {
    isLoaded = false;
    const ticker = symbol?.trim()?.toUpperCase();

    // Guard clause: ensure the ticker exists
    if (!tickerList?.includes(ticker)) {
      toast?.error(compare_toast_ticker_not_found({ ticker }));
      return;
    }

    // Remove the ticker
    tickerList = [...tickerList?.filter((item) => item !== ticker)];

    // Persist the change
    handleSave();

    if (tickerList.length === 0) {
      rawGraphData = {};
      rawTableData = [];
      configGraph = null;
      configReturn = null;
      isLoaded = true;
      return;
    }

    downloadWorker?.postMessage({
      tickerList: tickerList,
      category: getCategoryForAPI(selectedPlotCategory),
      assetType: "etf",
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
          `/api/searchbar?query=${encodeURIComponent(inputValue)}&limit=10&assetType=etf`,
        );

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }

        const searchOutput = await response.json();
        searchBarData = Array.isArray(searchOutput)
          ? searchOutput.filter(isEtfSearchbarItem)
          : [];
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
        "compare-etf",
        JSON?.stringify({
          tickerList: tickerList,
          selectedPlotCategory: selectedPlotCategory,
        }),
      );
    } catch (e) {
      console.log("Failed saving compare ETF data: ", e);
    }
  }

  function changePlotPeriod(timePeriod) {
    isLoaded = false;
    selectedPlotPeriod = timePeriod;
    downloadWorker?.postMessage({
      tickerList: tickerList,
      category: getCategoryForAPI(selectedPlotCategory),
      assetType: "etf",
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
      const filteredSeries = filterDataByTimePeriod(series);

      parsedData[symbol] = filteredSeries?.map((item) => {
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

    const isLineSeriesCategory = [
      "dividend-ttm",
      "dividend-growth-yoy",
    ]?.includes(selectedPlotCategory?.type);

    // 3) build series entries
    const series = Object?.entries(parsedData)?.map(([symbol, data], index) => {
      // wrap around if more symbols than colors
      const pair = colorPairs[index % colorPairs?.length];

      return {
        name: symbol,
        type: isLineSeriesCategory ? "line" : "spline",
        data,
        color: $mode === "light" ? pair?.light : pair?.dark,
        lineWidth: 1.5,
        marker: { enabled: false },
      };
    });

    // Check if the selected category is percentage-based
    const isPercentageCategory =
      selectedPlotCategory?.type === "price-change" ||
      selectedPlotCategory?.type === "total-return-pct" ||
      selectedPlotCategory?.type === "dividend-growth-yoy";

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
        shared: ["price", "price-change"]?.includes(selectedPlotCategory?.type),
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
        borderRadius: 3,
        pointPadding: 0.1,
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
        text: `<div class= "mt-5"></div>`,
        useHTML: true,
        style: { color: $mode === "light" ? "black" : "white" },
      },
      tooltip: {
        useHTML: true,
        shared: false,
        backgroundColor: $mode === "light" ? "#ffffff" : "#09090B",
        borderColor: $mode === "light" ? "#D1D5DB" : "#374151",
        borderWidth: 1,
        borderRadius: 4,
        style: {
          color: $mode === "light" ? "#111827" : "#F9FAFB",
          fontSize: "16px",
          padding: "10px",
        },
        formatter() {
          const pointColor = this?.point?.color ?? this?.series?.color;
          const value = toFiniteNumber(this?.y);
          const periodLabel =
            this?.point?.category ??
            RETURN_PERIOD_LABELS?.[this?.point?.x] ??
            this?.x;
          return `
          <span class="text-[1rem] font-[501]">${periodLabel}</span><br>
          <div class="mt-1">
            <span style="display:inline-block; width:10px; height:10px; background-color:${pointColor}; border-radius:2px; margin-right:6px;"></span>
            <span class="text-sm font-semibold">${this?.series?.name}</span>
            <span class="text-sm font-normal ml-1">${value == null ? "-" : `${value.toFixed(2)}%`}</span>
          </div>`;
        },
      },
      xAxis: {
        categories: RETURN_PERIOD_LABELS,
        title: null,
        labels: {
          style: { color: $mode === "light" ? "black" : "white" },
        },
      },
      yAxis: {
        title: null,
        opposite: true,

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
          pointWidth: 50,
          dataLabels: {
            enabled: true,
            formatter() {
              const value = Number(this?.y);
              return Number.isFinite(value) ? `${value.toFixed(2)}%` : "";
            },
            style: {
              fontSize: "12px",
              fontWeight: "600",
              textOutline: "none",
            },
          },
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
      const savedData = localStorage?.getItem("compare-etf");

      if (savedData) {
        const parsedData = JSON.parse(savedData);
        tickerList = parsedData?.tickerList;
        const savedCategory = parsedData?.selectedPlotCategory;
        selectedPlotCategory =
          savedCategory?.type === "price-change"
            ? { ...savedCategory, value: "close" }
            : savedCategory;
      }
    } catch (e) {
      console.log(e);
    }

    if (!downloadWorker) {
      const DownloadWorker =
        await import("$lib/workers/downloadCompareWorker?worker");
      downloadWorker = new DownloadWorker.default();
      downloadWorker.onmessage = handleDownloadMessage;
    }

    downloadWorker?.postMessage({
      tickerList: tickerList,
      category: getCategoryForAPI(selectedPlotCategory),
      assetType: "etf",
    });
  });
</script>

<SEO
  title={tickerList?.length === 0
    ? "Compare ETFs"
    : `Compare ${tickerList.join(" vs ")}`}
  description="Compare ETFs side by side with historical charts, total return, dividend trends, and key fund metrics."
  keywords={compare_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "ETF Comparison Tool",
    description:
      "Interactive tool for comparing multiple ETFs side by side with charts and fund analysis",
    url: "https://stocknear.com/etf/compare",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Side-by-side ETF comparison",
      "Interactive financial charts",
      "Performance metrics analysis",
      "Historical data comparison",
      "Multiple timeframe analysis",
      "Dividend trend comparison",
      "Expense ratio comparison",
      "Total assets comparison",
      "Return on investment tracking",
    ],
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3 text-gray-700 dark:text-zinc-200"
>
  <BreadCrumb
    containerClass="text-xs sm:text-sm breadcrumbs text-gray-500 dark:text-zinc-400"
  >
    <li>
      <a
        href="/"
        class="text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400"
        >{compare_breadcrumb_home()}</a
      >
    </li>
    <li class="text-gray-500 dark:text-zinc-400">Compare ETFs</li>
  </BreadCrumb>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class="mb-6 border-b border-gray-300 dark:border-zinc-700">
            <h1
              class="mb-1 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              {tickerList?.length === 0
                ? "Compare ETFs"
                : `Compare ${tickerList.join(" vs ")}`}
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
                        : ''} text-[0.85rem] sm:text-sm border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 rounded-full text-gray-700 dark:text-zinc-200 placeholder:text-gray-800 dark:placeholder:text-zinc-300 px-3 py-2 pl-8 xs:pl-10 grow w-full focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80"
                      placeholder={compare_search_placeholder()}
                      aria-label={compare_search_placeholder()}
                    />
                  </div>

                  <Combobox.Content
                    class="z-10 w-full {inputValue?.length > 0
                      ? ''
                      : 'hidden'} rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none outline-hidden"
                    sideOffset={8}
                  >
                    {#if inputValue?.length !== 0}
                      {#each searchBarData as searchItem}
                        <Combobox.Item
                          class="py-2.5 cursor-pointer border-b border-gray-300 dark:border-zinc-700 last:border-none flex h-fit w-auto select-none items-center rounded-lg px-2 text-sm capitalize outline-hidden transition-all duration-75 data-highlighted:bg-gray-100/70 dark:data-highlighted:bg-zinc-900/60"
                          value={searchItem?.symbol}
                          label={searchItem?.symbol}
                          on:click={(e) => addTicker(searchItem)}
                        >
                          <div
                            class="flex flex-col sm:flex-row items-start sm:items-center"
                          >
                            <span class="text-sm text-gray-900 dark:text-white"
                              >{searchItem?.symbol}</span
                            >
                            <span
                              class="ml-0 sm:ml-2 text-xs sm:text-sm text-gray-500 dark:text-zinc-400"
                              >{searchItem?.name}</span
                            >
                          </div>
                        </Combobox.Item>
                      {:else}
                        <span
                          class="block px-5 py-2 text-sm text-gray-500 dark:text-zinc-400"
                        >
                          {compare_no_results()}
                        </span>
                      {/each}
                    {:else}
                      <Combobox.Item
                        class="cursor-pointer border-b border-gray-300 dark:border-zinc-700 last:border-none flex h-fit w-auto select-none items-center rounded-lg py-1.5 pl-5 pr-1.5 text-sm capitalize outline-hidden"
                      >
                        <span class="text-sm text-gray-500 dark:text-zinc-400">
                          {inputValue?.length > 0
                            ? compare_no_results()
                            : compare_start_searching()}
                        </span>
                      </Combobox.Item>
                    {/if}
                  </Combobox.Content>
                </Combobox.Root>

                <div
                  class="order-last w-full sm:w-fit relative inline-block text-left cursor-pointer mt-3 sm:mt-0 sm:ml-3"
                >
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild let:builder>
                      <Button
                        builders={[builder]}
                        class="w-full min-w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
                      class="w-full max-w-80 sm:w-64 h-fit max-h-72 overflow-y-auto scroller relative rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
                    >
                      <DropdownMenu.Group>
                        {#each categoryList as item}
                          <DropdownMenu.Item
                            on:click={() => changeCategory(item)}
                            class="{selectedPlotCategory?.name === item?.name
                              ? 'bg-gray-100/70 dark:bg-zinc-900/60 text-gray-900 dark:text-white'
                              : ''} cursor-pointer rounded-lg sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition"
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
                    class="inline-flex items-center gap-x-2 mb-1.5 sm:mt-0 mr-2 px-2 py-1 text-xs sm:text-sm font-semibold rounded-full border border-gray-300 shadow dark:border-zinc-700 border-l-4 bg-white/80 dark:bg-zinc-900/50"
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
                      class="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border border-gray-300 shadow dark:border-zinc-700 transition cursor-pointer {selectedPlotPeriod ===
                      item
                        ? 'bg-gray-100/70 text-gray-900 dark:bg-zinc-900/60 dark:text-white'
                        : 'text-gray-500 dark:text-zinc-400 bg-white/80 dark:bg-zinc-950/40 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100/70 dark:hover:bg-zinc-900/60'}"
                    >
                      {item}
                    </label>
                  {/each}
                </div>
              </div>
              <div
                class="border border-gray-300 shadow dark:border-zinc-700 rounded-lg bg-white/70 dark:bg-zinc-950/40 w-full"
                use:highcharts={configGraph}
              ></div>
            {:else}
              <div
                class="mt-2 flex justify-center items-center h-96 border border-gray-300 shadow dark:border-zinc-700 rounded-lg bg-white/70 dark:bg-zinc-950/40"
              >
                <div class="relative">
                  <label
                    class="bg-white/90 dark:bg-zinc-950/70 border border-gray-300 shadow dark:border-zinc-700 rounded-full h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  >
                    <span
                      class="loading loading-spinner loading-md text-gray-700 dark:text-zinc-200"
                    ></span>
                  </label>
                </div>
              </div>
            {/if}

            {#if rawTableData?.length > 0 && isLoaded}
              {#key rawTableData}
                <Table
                  title={`${rawTableData?.length} ${
                    rawTableData?.length > 1 ? "ETFs" : "ETF"
                  }`}
                  {data}
                  rawData={rawTableData}
                  {defaultList}
                  {excludedRules}
                  tableTabs={ETF_COMPARE_TABS}
                  tabRuleSets={ETF_COMPARE_TAB_RULE_SETS}
                  indicatorRowsOverride={ETF_COMPARE_INDICATOR_ROWS}
                  indicatorDefaultRows={ETF_COMPARE_INDICATOR_DEFAULT_ROWS}
                />
              {/key}
            {/if}

            {#if configReturn && isLoaded && tickerList?.length > 0}
              <div class="mt-8 -mb-2 flex items-center gap-x-1">
                <h2
                  class="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
                >
                  {compare_average_return()}
                </h2>
                <InfoModal
                  id="etf-compare-average-return-info"
                  title={compare_average_return()}
                  content={AVERAGE_RETURN_INFO_MODAL_TEXT}
                />
              </div>
              {#if showAverageReturnInfo}
                <Infobox text={averageReturnInfoText} />
              {/if}

              <div
                class="mt-5 border border-gray-300 shadow dark:border-zinc-700 rounded-lg bg-white/70 dark:bg-zinc-950/40 w-full"
              >
                <div use:highcharts={configReturn}></div>

                <div class="mt-8 hidden px-4 pb-3 md:block">
                  <table class="w-full">
                    <thead
                      ><tr
                        class="border-b border-gray-300 dark:border-zinc-700 text-left *:px-2 *:py-1 *:font-semibold text-xs uppercase tracking-wide text-gray-600 dark:text-zinc-300"
                        ><th class="text-left">{compare_table_symbol()}</th>
                        <th>{compare_table_1month()}</th>
                        <th>{compare_table_ytd()}</th>
                        <th>{compare_table_1year()}</th>
                        <th>{compare_table_5years()}</th>
                        <th>10 Years</th></tr
                      ></thead
                    >
                    <tbody>
                      {#each tickerList as ticker, idx}
                        <tr
                          class="border-b border-gray-300 dark:border-zinc-700 text-left *:px-2 *:py-1 last:border-0 hover:bg-gray-50/80 dark:hover:bg-zinc-900/60"
                        >
                          <td class="flex items-center gap-x-1">
                            <div
                              class="size-4 rounded-sm"
                              style="background-color: {$mode === 'light'
                                ? colorPairs[idx % colorPairs?.length].light
                                : colorPairs[idx % colorPairs?.length].dark}"
                            ></div>
                            <a
                              href={`/etf/${ticker}/`}
                              class="font-semibold text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400"
                            >
                              {ticker}
                            </a>
                          </td>

                          {#if Array.isArray(tickerList) && tickerList.length > 0 && tickerList.every((tkr) => Array.isArray(rawGraphData[tkr]?.changesPercentage) && rawGraphData[tkr].changesPercentage.length > 0)}
                            {#each rawGraphData[ticker]?.changesPercentage as pct}
                              <td>{formatPercentValue(pct)}</td>
                            {/each}
                          {/if}
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              </div>
            {/if}

            {#if tickerList?.length > 1}
              <div class="mt-8">
                <div class="flex items-center">
                  <h2
                    class="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
                  >
                    Top 10 Holdings
                  </h2>
                </div>

                <div
                  class="mt-4 overflow-hidden bg-white/40 dark:bg-zinc-950/25"
                >
                  <div class="overflow-x-auto">
                    <div class="flex min-w-max items-start gap-4">
                      {#each tickerList as ticker, idx}
                        <div
                          class="w-[340px] sm:w-[380px] shrink-0 rounded-lg border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40"
                        >
                          <div
                            class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-gray-300 px-3 py-2 dark:border-zinc-700 sm:px-4"
                          >
                            <div class="flex items-center gap-x-2">
                              <div
                                class="size-3 rounded-sm"
                                style="background-color: {$mode === 'light'
                                  ? colorPairs[idx % colorPairs?.length].light
                                  : colorPairs[idx % colorPairs?.length].dark}"
                              ></div>
                              <a
                                href={`/etf/${ticker}/`}
                                class="font-semibold text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400"
                              >
                                {ticker}
                              </a>
                            </div>
                          </div>

                          {#if Array.isArray(topHoldingsByTicker?.[ticker]) && topHoldingsByTicker?.[ticker]?.length > 0}
                            <div class="overflow-x-auto">
                              <table
                                class="table table-sm table-compact w-full"
                              >
                                <thead
                                  class="*:font-semibold text-xs uppercase tracking-wide text-gray-600 dark:text-zinc-300"
                                >
                                  <tr
                                    class="border-b border-gray-300 dark:border-zinc-700"
                                  >
                                    <th class="pl-4">No.</th>
                                    <th>Symbol</th>
                                    <th>Name</th>
                                    <th class="text-right">Weight</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {#each topHoldingsByTicker?.[ticker] as holding}
                                    <tr
                                      class="border-b border-gray-300 dark:border-zinc-700 hover:bg-gray-50/80 dark:hover:bg-zinc-900/60 last:border-0"
                                    >
                                      <td
                                        class="pl-4 text-xs text-gray-500 dark:text-zinc-400"
                                      >
                                        {holding?.rank}
                                      </td>
                                      <td>
                                        <a
                                          href={`/stocks/${holding?.symbol}/`}
                                          class="font-semibold text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400"
                                        >
                                          {holding?.symbol}
                                        </a>
                                      </td>
                                      <td
                                        class="max-w-[180px] truncate text-gray-700 dark:text-zinc-200"
                                        title={holding?.name}
                                      >
                                        {holding?.name || "-"}
                                      </td>
                                      <td class="text-right">
                                        {formatPercentValue(
                                          holding?.weightPercentage,
                                        )}
                                      </td>
                                    </tr>
                                  {/each}
                                </tbody>
                              </table>
                            </div>
                          {:else if isTopHoldingsLoading}
                            <div
                              class="px-4 py-5 text-sm text-gray-500 dark:text-zinc-400"
                            >
                              Loading holdings...
                            </div>
                          {:else}
                            <div
                              class="px-4 py-5 text-sm text-gray-500 dark:text-zinc-400"
                            >
                              No holdings data available.
                            </div>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  </div>
                </div>
              </div>
            {/if}

            <div class="mt-6 md:mt-10">
              <h3
                class="font-semibold tracking-tight text-gray-900 dark:text-white text-xl md:text-2xl"
              >
                {compare_popular_comparisons()}
              </h3>
              <div class="my-4 sm:flex md:my-5">
                <div class="grid grid-cols-2 gap-x-2 gap-y-1 sm:grid-cols-4">
                  {#each popularComparisons as pair}
                    <a
                      class="cursor-pointer flex justify-center rounded-full border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 px-2 py-2 text-sm font-semibold hover:bg-white dark:hover:bg-zinc-900 transition md:text-base"
                      on:click={() => presetStrategy(pair)}
                      >{pair[0]} vs. {pair[1]}</a
                    >
                  {/each}
                </div>
              </div>
            </div>
          {:else}
            <div
              class="mt-3 rounded-lg border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 xs:mt-4 md:mt-6"
            >
              <div
                class="flex h-[300px] w-full items-center justify-center overflow-y-hidden rounded px-8 bp:h-[350px] md:h-[400px] lg:h-[500px]"
              >
                <div class="text-center text-xl font-semibold sm:text-2xl">
                  Add ETF symbols to start comparing
                </div>
              </div>
            </div>

            <div class="mt-6 md:mt-10">
              <h3
                class="font-semibold tracking-tight text-gray-900 dark:text-white text-xl md:text-2xl"
              >
                {compare_popular_comparisons()}
              </h3>
              <div class="my-4 sm:flex md:my-5">
                <div class="grid grid-cols-2 gap-x-2 gap-y-1 sm:grid-cols-4">
                  {#each popularComparisons as pair}
                    <a
                      class="cursor-pointer flex justify-center rounded-full border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 px-2 py-2 text-sm font-semibold hover:bg-white dark:hover:bg-zinc-900 transition md:text-base"
                      on:click={() => presetStrategy(pair)}
                      >{pair[0]} vs. {pair[1]}</a
                    >
                  {/each}
                </div>
              </div>
            </div>
          {/if}
        </main>
      </div>
    </div>
  </div>
</section>

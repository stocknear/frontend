<script lang="ts">
  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
  import { mode } from "mode-watcher";
  import { getCache, setCache } from "$lib/store";
  import highcharts from "$lib/highcharts.ts";
  import { onMount, tick } from "svelte";

  export let tickerList = [];
  export let sources = [];

  $: displayTickerList = tickerList?.slice(0, 5) ?? [];

  // State for expand/collapse
  let isExpanded = false;

  // Show only first 2 tickers initially, or all if expanded
  $: visibleTickerList = isExpanded
    ? displayTickerList
    : displayTickerList.slice(0, 2);

  // Create a map of ticker to URL from sources
  $: tickerUrlMap =
    sources?.reduce((acc, source) => {
      if (source?.ticker && source?.url) {
        acc[source.ticker] = source.url;
      }
      return acc;
    }, {}) || {};

  let selectedPlotPeriod = "1D";
  let config = null;
  let isLoaded = false;
  let isLoading = false;
  let rawGraphData = {};
  let stockQuotes = {};
  let priceData = {};

  function convertTimestamp(unixSeconds: number | string): string {
    if (!unixSeconds) return "";

    const date = new Date(Number(unixSeconds) * 1000); // convert seconds → ms

    const formatted = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);

    return `${formatted} ET`; // explicitly mark Eastern Time
  }

  async function fetchPlotData(tickerList, timePeriod = "one-year") {
    const cacheKey = `plotData-${tickerList.join(",")}-${timePeriod}`;
    const cachedData = getCache(cacheKey, "tickerGraph");
    if (cachedData) {
      console.log("Using cached plot data for:", tickerList, timePeriod);
      return cachedData;
    }

    try {
      const response = await fetch("/api/chat-plot-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tickerList, timePeriod }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCache(cacheKey, "tickerGraph", data);
      return data;
    } catch (error) {
      console.error(`Error fetching plot data:`, error);
      return [];
    }
  }

  async function loadInitialData() {
    if (!displayTickerList || displayTickerList.length === 0) return;
    if (isLoading) return; // Prevent duplicate loading

    isLoading = true;
    isLoaded = false;

    const allTickersCached = displayTickerList.every((ticker) => {
      const quoteCacheKey = `quote-${ticker}`;
      const priceCacheKey = `plotData-${ticker}-one-day`;
      return (
        getCache(quoteCacheKey, "stockQuote") &&
        getCache(priceCacheKey, "tickerGraph")
      );
    });

    if (allTickersCached) {
      displayTickerList.forEach((ticker) => {
        const quoteCacheKey = `quote-${ticker}`;
        const priceCacheKey = `plotData-${ticker}-one-day`;

        stockQuotes[ticker] = getCache(quoteCacheKey, "stockQuote");
        priceData[ticker] = {
          "1D": getCache(priceCacheKey, "tickerGraph") || [],
          "5D": [],
          "1M": [],
          "6M": [],
          YTD: [],
          "1Y": [],
          "5Y": [],
          MAX: [],
        };
      });

      updatePlotData();
      isLoaded = true;
      isLoading = false;
      return;
    }

    // Fetch initial data for 1D period
    const results = await fetchPlotData(displayTickerList, "one-day");

    if (results && results.length > 0) {
      results.forEach((result) => {
        const { ticker, quote, priceData: prices } = result;

        stockQuotes[ticker] = quote;
        setCache(`quote-${ticker}`, "stockQuote", quote);
        setCache(`plotData-${ticker}-one-day`, "tickerGraph", prices || []);

        priceData[ticker] = {
          "1D": prices || [],
          "5D": [],
          "1M": [],
          "6M": [],
          YTD: [],
          "1Y": [],
          "5Y": [],
          MAX: [],
        };
      });

      updatePlotData();
    }

    isLoaded = true;
    isLoading = false;
  }

  function updatePlotData() {
    rawGraphData = {};

    displayTickerList?.forEach((ticker) => {
      const data = priceData[ticker]?.[selectedPlotPeriod] || [];
      // Ensure data is an array before mapping
      const historyData = Array.isArray(data)
        ? data.map((item) => ({
            date: item.time || item.date,
            value: item.close || item.value,
          }))
        : [];

      rawGraphData[ticker] = {
        history: historyData,
      };
    });

    config = plotData() || null;
  }

  function plotData() {
    const parsedData: Record<string, Array<{ x: number; price: number }>> = {};
    const series: any[] = [];

    // Define colors for tickers - optimized for light/dark mode
    const tickerColors = {
      0: $mode === "light" ? "#0066CC" : "#00d4ff", // Blue/Cyan for first ticker
      1: $mode === "light" ? "#9f0712" : "#ffa500", // Dark Orange/Orange for second ticker
      2: $mode === "light" ? "#00A651" : "#00ff88", // Green for third ticker
    };

    // Process data and calculate percentage changes
    for (const [symbol, data] of Object.entries(rawGraphData || {})) {
      const seriesData = Array.isArray(data?.history) ? data.history : [];

      // Only process if we have valid data
      if (seriesData.length > 0) {
        parsedData[symbol] = seriesData.map((item) => {
          const d = new Date(item?.date);
          const ts = Date.UTC(
            d.getUTCFullYear(),
            d.getUTCMonth(),
            d.getUTCDate(),
            d.getUTCHours(),
            d.getUTCMinutes(),
            d.getUTCSeconds(),
          );
          return { x: ts, price: Number(item?.value || 0) };
        });
      } else {
        parsedData[symbol] = [];
      }
    }

    // Track min/max percentage values for yAxis scaling
    let minPercentage = 0;
    let maxPercentage = 0;

    // Convert to percentage-based data
    Object.entries(parsedData).forEach(([symbol, dataPoints], index) => {
      if (!Array.isArray(dataPoints) || dataPoints.length === 0) return;

      const firstValue = dataPoints[0]?.price;
      if (!firstValue || firstValue === 0) return;

      const percentageData = dataPoints.map((point) => {
        const percentValue = ((point.price || 0) / firstValue - 1) * 100;
        // Update min/max tracking
        minPercentage = Math.min(minPercentage, percentValue);
        maxPercentage = Math.max(maxPercentage, percentValue);
        // return an object point so we can carry price to tooltip
        return { x: point.x, y: percentValue, price: point.price };
      });

      series.push({
        name: symbol,
        type: "spline",
        data: percentageData,
        color:
          tickerList?.length === 1
            ? $mode === "light"
              ? "#000"
              : "#fff"
            : tickerColors[index],
        lineWidth: 2,
        marker: { enabled: false },
        zIndex: 2,
      });
    });

    // Calculate yMin and yMax with padding
    const padding = 0.1; // 10% padding for percentage values
    const range = maxPercentage - minPercentage;

    // If range is very small, add minimum padding
    const minRange = 1; // Minimum 1% range
    const effectiveRange = Math.max(range, minRange);

    let yMin = minPercentage - effectiveRange * padding;
    let yMax = maxPercentage + effectiveRange * padding;

    // Ensure we always include 0 in the range for percentage charts
    yMin = Math.min(yMin, -0.5);
    yMax = Math.max(yMax, 0.5);

    const firstData = Object.values(parsedData).find(
      (data) => data?.length > 0,
    );
    const baseDate = firstData?.[0]?.x ? new Date(firstData[0].x) : new Date();
    const startTime = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      9,
      30,
    ).getTime();
    const endTime = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      16,
      0,
    ).getTime();

    return {
      chart: {
        backgroundColor: $mode === "light" ? "#ffffff" : "#09090B",
        animation: false,
        height: 300,
      },
      credits: { enabled: false },
      title: { text: null },

      legend: {
        enabled: false,
      },

      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor:
          $mode === "light" ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.9)",
        borderColor:
          $mode === "light" ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.1)",
        borderWidth: 1,
        style: {
          color: $mode === "light" ? "#1f2937" : "white",
          fontSize: "14px",
        },
        borderRadius: 4,
        formatter: function () {
          const date = new Date(this.x);
          const formattedTime = date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          });

          // Currency formatter for prices
          const currency = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 2,
          });

          let content = `<div style="padding: 8px;">`;
          this.points?.forEach((point) => {
            // skip our baseline series
            if (!point.series.name.includes("Baseline")) {
              // the underlying price is carried on the point
              const rawPrice =
                point.point && point.point.price ? point.point.price : null;
              const priceFormatted =
                rawPrice !== null ? ` ${currency.format(rawPrice)}` : "";

              content += `<div style="color: ${point.series.color}; margin-bottom: 4px;">${point.series.name} ${priceFormatted} (<span class="${point?.y > 0 ? "text-emerald-600 dark:text-emerald-400" : point?.y < 0 ? "text-rose-600 dark:text-rose-400" : ""}">${point.y >= 0 ? "+" : ""}${point.y?.toFixed(2)}%</span>)</div>`;
            }
          });
          content += `<div style="color: ${$mode === "light" ? "#6b7280" : "#fff"}; font-size: 12px; margin-top: 4px;">${formattedTime}</div></div>`;
          return content;
        },
      },

      xAxis: {
        type: "datetime",
        min: selectedPlotPeriod === "1D" ? startTime : null,
        max: selectedPlotPeriod === "1D" ? endTime : null,
        tickLength: 0,
        categories: null,
        crosshair: {
          color: $mode === "light" ? "#374151" : "#e5e7eb",
          width: 1,
          dashStyle: "Solid",
        },
        labels: {
          style: {
            color: $mode === "light" ? "#374151" : "#e5e7eb",
            fontSize: "12px",
          },
          formatter: function () {
            const date = new Date(this.value);
            if (selectedPlotPeriod === "1D") {
              return date.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              });
            } else {
              return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
            }
          },
        },
      },

      yAxis: {
        min: yMin ?? null,
        max: yMax ?? null,
        startOnTick: false,
        endOnTick: false,
        gridLineColor:
          $mode === "light" ? "rgb(31,41,55,0.6)" : "rgb(229,231,235,0.2)",
        gridLineWidth: 1,
        gridLineDashStyle: "Dash",

        title: { text: null },
        opposite: true,
        labels: {
          style: {
            color: $mode === "light" ? "#374151" : "#e5e7eb",
            fontSize: "12px",
          },
          formatter: function () {
            return (
              (this.value >= 0 ? "" : "") + this.value.toFixed(1) + " " + "%"
            );
          },
        },
      },

      plotOptions: {
        series: {
          animation: false,
          marker: { enabled: false },
          states: { hover: { enabled: false } },
        },
      },
      series,
    };
  }

  // Keep track of last loaded ticker list to prevent unnecessary reloads
  let lastTickerList = "";

  // Combined reactive statement for both ticker list and sources changes
  $: {
    const currentTickerKey = displayTickerList.join(",");
    const shouldLoad =
      displayTickerList &&
      displayTickerList.length > 0 &&
      typeof window !== "undefined" &&
      currentTickerKey !== lastTickerList;

    if (shouldLoad) {
      lastTickerList = currentTickerKey;
      tick().then(() => {
        loadInitialData();
      });
    }
  }

  // React to sources changes to ensure proper rendering
  $: if (
    sources &&
    sources.length > 0 &&
    displayTickerList.length > 0 &&
    Object.keys(stockQuotes).length > 0
  ) {
    tick().then(() => {
      updatePlotData();
    });
  }
</script>

{#if tickerList?.length > 0}
  <div class="w-full border-t border-gray-300 dark:border-zinc-700 pt-10">
    <div
      class="rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 p-6 sm:p-7"
    >
      <!-- Header -->
      <div class="flex items-center gap-2 mb-6">
        <div
          class="ml-auto text-xs text-gray-500 dark:text-zinc-400 tabular-nums"
        >
          {#if displayTickerList?.length > 0}
            {@const firstTicker = displayTickerList[0]}
            {@const firstQuote = stockQuotes[firstTicker]}
            {#if firstQuote}
              Updated {convertTimestamp(firstQuote?.timestamp)}
            {/if}
          {/if}
        </div>
      </div>

      {#if config && isLoaded && Object.keys(stockQuotes)?.length > 0}
        <!-- Stock Price Headers - Side by Side (Always visible for all tickers) -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {#each displayTickerList as ticker, index}
            {@const quote = stockQuotes[ticker]}
            {#if quote}
              <div>
                <div class="flex items-center gap-2 mb-3">
                  <div
                    class="size-8 rounded-full border border-gray-300 dark:border-zinc-700 bg-gray-100/80 dark:bg-zinc-900/60 flex items-center justify-center overflow-hidden"
                  >
                    <img
                      src={`https://financialmodelingprep.com/image-stock/${ticker}.png`}
                      alt="logo"
                      class="size-4 avatar rounded-full"
                    />
                  </div>

                  <span
                    class="text-sm sm:text-base font-semibold tracking-tight text-gray-900 dark:text-zinc-100"
                  >
                    {removeCompanyStrings(quote?.name)}
                  </span>
                </div>

                <div class="flex items-end items-baseline gap-x-2">
                  <span
                    class="text-2xl font-semibold text-gray-900 dark:text-zinc-100 tabular-nums"
                  >
                    {quote?.price?.toFixed(2) || "n/a"}
                  </span>
                  <span
                    class={`text-sm sm:text-base font-semibold tabular-nums ${
                      (quote?.changesPercentage || 0) >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {(quote?.changesPercentage || 0) >= 0 ? "+" : "-"}{Math.abs(
                      quote?.change || 0,
                    ).toFixed(2)}
                    ({(quote?.changesPercentage || 0) >= 0
                      ? "+"
                      : ""}{quote?.changesPercentage?.toFixed(2) || "0.00"}%)
                  </span>
                </div>
              </div>
            {/if}
          {/each}
        </div>

        <!-- Chart -->
        <div class="w-full mb-8 overflow-hidden" use:highcharts={config}></div>

        <!-- Stock Details - Collapsible section (only shows first 2 tickers initially) -->
        <div class="space-y-4">
          {#each visibleTickerList as ticker}
            {@const quote = stockQuotes[ticker]}
            {#if quote}
              <div class="">
                <div class="flex justify-between items-center mb-4">
                  <h3
                    class="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-zinc-400"
                  >
                    {ticker?.toUpperCase()}
                  </h3>
                </div>
                <div class="grid grid-cols-3 gap-x-8 gap-y-3 text-sm">
                  <div class="flex items-baseline justify-between gap-4">
                    <span
                      class="text-[0.65rem] uppercase tracking-[0.2em] text-gray-500 dark:text-zinc-500 whitespace-nowrap"
                      >Prev Close</span
                    >
                    <span
                      class="text-gray-900 dark:text-zinc-100 tabular-nums font-medium"
                      >{quote?.previousClose?.toFixed(2) || "n/a"}</span
                    >
                  </div>

                  <div class="flex items-baseline justify-between gap-4">
                    <span
                      class="text-[0.65rem] uppercase tracking-[0.2em] text-gray-500 dark:text-zinc-500 whitespace-nowrap"
                      >Day Range</span
                    >
                    <span
                      class="text-gray-900 dark:text-zinc-100 tabular-nums font-medium"
                      >{quote?.dayLow?.toFixed(2)} - {quote?.dayHigh?.toFixed(
                        2,
                      )}</span
                    >
                  </div>

                  <div class="flex items-baseline justify-between gap-4">
                    <span
                      class="text-[0.65rem] uppercase tracking-[0.2em] text-gray-500 dark:text-zinc-500 whitespace-nowrap"
                      >P/E Ratio</span
                    >
                    <span
                      class="text-gray-900 dark:text-zinc-100 tabular-nums font-medium"
                      >{quote?.pe?.toFixed(2) || "n/a"}</span
                    >
                  </div>

                  <div class="flex items-baseline justify-between gap-4">
                    <span
                      class="text-[0.65rem] uppercase tracking-[0.2em] text-gray-500 dark:text-zinc-500 whitespace-nowrap"
                      >Open</span
                    >
                    <span
                      class="text-gray-900 dark:text-zinc-100 tabular-nums font-medium"
                      >{quote?.open?.toFixed(2) || "n/a"}</span
                    >
                  </div>

                  <div class="flex items-baseline justify-between gap-4">
                    <span
                      class="text-[0.65rem] uppercase tracking-[0.2em] text-gray-500 dark:text-zinc-500 whitespace-nowrap"
                      >52W Range</span
                    >
                    <span
                      class="text-gray-900 dark:text-zinc-100 tabular-nums font-medium"
                      >{quote?.yearLow?.toFixed(2)} - {quote?.yearHigh?.toFixed(
                        2,
                      )}</span
                    >
                  </div>

                  <div class="flex items-baseline justify-between gap-4">
                    <span
                      class="text-[0.65rem] uppercase tracking-[0.2em] text-gray-500 dark:text-zinc-500 whitespace-nowrap"
                      >Dividend Yield</span
                    >
                    <span
                      class="text-gray-900 dark:text-zinc-100 tabular-nums font-medium"
                      >{quote?.dividendYield
                        ? `${(quote.dividendYield * 100).toFixed(3)}%`
                        : "n/a"}</span
                    >
                  </div>
                  <div class="flex items-baseline justify-between gap-4">
                    <span
                      class="text-[0.65rem] uppercase tracking-[0.2em] text-gray-500 dark:text-zinc-500 whitespace-nowrap"
                      >Volume</span
                    >
                    <span
                      class="text-gray-900 dark:text-zinc-100 tabular-nums font-medium"
                      >{abbreviateNumber(quote?.volume) || "n/a"}</span
                    >
                  </div>

                  <div class="flex items-baseline justify-between gap-4">
                    <span
                      class="text-[0.65rem] uppercase tracking-[0.2em] text-gray-500 dark:text-zinc-500 whitespace-nowrap"
                      >Market Cap</span
                    >
                    <span
                      class="text-gray-900 dark:text-zinc-100 tabular-nums font-medium"
                      >{abbreviateNumber(quote?.marketCap)}</span
                    >
                  </div>

                  <div class="flex items-baseline justify-between gap-4">
                    <span
                      class="text-[0.65rem] uppercase tracking-[0.2em] text-gray-500 dark:text-zinc-500 whitespace-nowrap"
                      >EPS</span
                    >
                    <span
                      class="text-gray-900 dark:text-zinc-100 tabular-nums font-medium"
                      >{quote?.eps?.toFixed(2) || "n/a"}</span
                    >
                  </div>
                </div>

                {#if tickerUrlMap[ticker]}
                  <div class="mt-6 font-sans">
                    <a
                      href={tickerUrlMap[ticker]}
                      class="text-xs sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                    >
                      More about {ticker?.toUpperCase()}
                    </a>
                  </div>
                {/if}
              </div>
            {/if}
          {/each}
        </div>

        <!-- Expand/Collapse button for detailed stats -->
        {#if displayTickerList.length > 2}
          <div class="flex justify-center mb-6">
            <button
              on:click={() => (isExpanded = !isExpanded)}
              class="cursor-pointer inline-flex items-center gap-2 rounded-full border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 px-4 py-1.5 text-xs font-semibold text-gray-600 dark:text-zinc-400 transition sm:hover:text-violet-600 dark:sm:hover:text-violet-400"
            >
              {#if isExpanded}
                <span class="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-4 h-4"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M4.5 15.75l7.5-7.5 7.5 7.5"
                    />
                  </svg>
                  Show Less Details
                </span>
              {:else}
                <span class="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-4 h-4"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                  Show Details for All {displayTickerList.length} Tickers
                </span>
              {/if}
            </button>
          </div>
        {/if}
      {:else}
        <!-- Loading State -->
        <div class="flex justify-center items-center h-96">
          <div class="relative">
            <label
              class="rounded-full border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            >
              <span
                class="loading loading-spinner loading-md text-gray-500 dark:text-zinc-300"
              ></span>
            </label>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

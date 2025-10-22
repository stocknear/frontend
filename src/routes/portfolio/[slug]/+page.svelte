<script lang="ts">
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";

  import {
    getCache,
    setCache,
    globalForm,
    realtimePrice,
    priceIncrease,
    wsBidPrice,
    wsAskPrice,
    wsShares,
    currentPortfolioPrice,
    stockTicker,
    screenWidth,
    isOpen,
  } from "$lib/store";
  import { onDestroy } from "svelte";
  import WIIM from "$lib/components/WIIM.svelte";
  import SEO from "$lib/components/SEO.svelte";

  import News from "$lib/components/News.svelte";
  import NextEarnings from "$lib/components/NextEarnings.svelte";
  import EarningsSurprise from "$lib/components/EarningsSurprise.svelte";
  import Sidecard from "$lib/components/Sidecard.svelte";

  import {
    convertTimestamp,
    abbreviateNumber,
    convertPeriodString,
  } from "$lib/utils";

  export let data;
  export let form;

  let stockDeck = data?.getStockDeck;
  let quoteVolume = data?.getStockQuote?.volume;
  $: previousClose = data?.getStockQuote?.previousClose;
  //============================================//
  const intervals = ["1D", "1W", "1M", "6M", "YTD", "1Y", "MAX"];

  let config = null;
  let output = null;
  let displayData = "1D";
  let lastValue;

  // One-Day Price WebSocket
  let oneDayPriceSocket = null;

  function connectOneDayPriceWebSocket() {
    if (!data?.wsURL || !$isOpen) {
      return;
    }

    // Prevent duplicate connections
    if (
      oneDayPriceSocket &&
      (oneDayPriceSocket.readyState === WebSocket.CONNECTING ||
        oneDayPriceSocket.readyState === WebSocket.OPEN)
    ) {
      console.log("One-day price WebSocket already connected or connecting");
      return;
    }

    try {
      oneDayPriceSocket = new WebSocket(data?.wsURL + "/one-day-price");

      oneDayPriceSocket.addEventListener("open", () => {
        console.log("One-day price WebSocket connection opened");

        // Send the ticker to the server
        const message = {
          ticker: $stockTicker,
        };
        oneDayPriceSocket.send(JSON.stringify(message));
      });

      oneDayPriceSocket.addEventListener("message", (event) => {
        try {
          const newData = JSON?.parse(event.data);

          if (newData && Array.isArray(newData) && newData.length > 0) {
            console.log(
              "Received one-day price update:",
              newData.length,
              "data points",
            );
            // Update oneDayPrice data
            oneDayPrice = newData;
            output = [...oneDayPrice];

            // Recalculate the chart if we're displaying 1D data
            if (displayData === "1D") {
              config = plotData(oneDayPrice) || null;
            }
          }
        } catch (error) {
          console.error(
            "Error processing one-day price WebSocket message:",
            error,
          );
        }
      });

      oneDayPriceSocket.addEventListener("close", (event) => {
        console.log(
          "One-day price WebSocket connection closed:",
          event.code,
          event.reason,
        );
        oneDayPriceSocket = null;
      });

      oneDayPriceSocket.addEventListener("error", (error) => {
        console.error("One-day price WebSocket error:", error);
      });
    } catch (error) {
      console.error("Failed to create one-day price WebSocket:", error);
    }
  }

  function disconnectOneDayPriceWebSocket() {
    if (oneDayPriceSocket) {
      oneDayPriceSocket.close();
      oneDayPriceSocket = null;
      console.log("One-day price WebSocket disconnected");
    }
  }

  // Connect/disconnect based on market status
  $: {
    if ($isOpen && typeof window !== "undefined") {
      connectOneDayPriceWebSocket();
    } else {
      disconnectOneDayPriceWebSocket();
    }
  }

  function plotData(priceData) {
    const rawData = priceData || [];

    const change = (rawData?.at(-1)?.close / rawData?.at(0)?.close - 1) * 100;

    const priceList = rawData?.map((item) => item?.close);
    const dateList = rawData?.map((item) =>
      Date.UTC(
        new Date(item?.time).getUTCFullYear(),
        new Date(item?.time).getUTCMonth(),
        new Date(item?.time).getUTCDate(),
        new Date(item?.time).getUTCHours(),
        new Date(item?.time).getUTCMinutes(),
      ),
    );

    const seriesData = rawData?.map((item) => [
      Date.UTC(
        new Date(item?.time).getUTCFullYear(),
        new Date(item?.time).getUTCMonth(),
        new Date(item?.time).getUTCDate(),
        new Date(item?.time).getUTCHours(),
        new Date(item?.time).getUTCMinutes(),
        new Date(item?.time).getUTCSeconds(),
      ),
      item?.close,
    ]);

    // Find the lowest & highest close values
    let minValue = Math?.min(...rawData?.map((item) => item?.close));
    let maxValue = Math?.max(...rawData?.map((item) => item?.close));

    if (minValue - 0 < 1 && displayData === "1D") {
      //don't delete this sometimes 1D can't find minValue
      minValue = data?.getStockQuote?.dayLow;
    }

    let padding = 0.002;
    let yMin = minValue * (1 - padding) === 0 ? null : minValue * (1 - padding);
    let yMax = maxValue * (1 + padding) === 0 ? null : maxValue * (1 + padding);

    const isNegative =
      displayData === "1D"
        ? data?.getStockQuote?.changesPercentage < 0
        : change < 0;

    // Use the same green for line and gradient, but slightly darker line, lighter gradient
    const lineColor = isNegative
      ? "#CC261A" // keep red if negative if needed
      : $mode === "light"
        ? "#137547" // darker green line (adjusted from #047857)
        : "#00FC50"; // bright green for dark mode

    const fillColorStart = isNegative
      ? "rgba(204, 38, 26, 0.6)" // red fill if negative
      : "rgba(19, 117, 71, 0.6)"; // green fill start, same tone as lineColor but transparent

    const fillColorEnd = isNegative
      ? "rgba(204, 38, 26, 0.01)"
      : "rgba(19, 117, 71, 0.01)"; // fade out transparent to near 0 opacity

    const baseDate =
      rawData && rawData?.length ? new Date(rawData?.at(0)?.time) : new Date();

    // Set the fixed start and end times (9:30 and 16:10)
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

    const options = {
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        animation: false,
        height: 320,
        events: {
          // Add touch event handling to hide tooltip on mobile
          load: function () {
            const chart = this;
            let isTouching = false;

            // Track touch start
            chart.container.addEventListener("touchstart", () => {
              isTouching = true;
            });

            // Track touch end
            chart.container.addEventListener("touchend", () => {
              isTouching = false;
              chart.tooltip.hide();
            });

            // Track touch cancel
            chart.container.addEventListener("touchcancel", () => {
              isTouching = false;
              chart.tooltip.hide();
            });
          },
        },
      },
      credits: { enabled: false },
      title: { text: null },
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 0.8)", // Semi-transparent black
        borderColor: "rgba(255, 255, 255, 0.2)", // Slightly visible white border
        borderWidth: 1,
        style: {
          color: $mode === "light" ? "black" : "white",
          fontSize: "16px",
          padding: "10px",
        },
        borderRadius: 4,
        formatter: function () {
          const date = new Date(this?.x);
          let formattedDate;
          if (displayData === "1D") {
            formattedDate = date?.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });
          } else if (["1W", "1M"].includes(displayData)) {
            formattedDate = date?.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            });
          } else {
            formattedDate = date?.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            });
          }

          let tooltipContent = "";

          // Loop through each point in the shared tooltip
          this.points?.forEach((point) => {
            tooltipContent += `<span class="text-white text-[1rem] font-[501]">${point.series.name}: ${point.y}</span><br>`;
          });

          // Append the formatted date at the end
          tooltipContent += `<span class="text-white m-auto text-black text-sm font-normal">${formattedDate}</span><br>`;

          return tooltipContent;
        },
      },

      xAxis: {
        type: "datetime",
        min: displayData === "1D" ? startTime : null,
        max: displayData === "1D" ? endTime : null,
        tickLength: 0,
        categories: displayData === "1D" ? null : dateList,
        crosshair: {
          color: $mode === "light" ? "black" : "white",
          width: 1,
          dashStyle: "Solid",
        },
        labels: {
          style: { color: $mode === "light" ? "black" : "white" },
          distance: 10,
          formatter: function () {
            const date = new Date(this?.value);
            if (displayData === "1D") {
              const timeString = date?.toLocaleTimeString("en-US", {
                hour: "numeric",
                hour12: true,
              });
              return `<span class=" text-xs">${timeString.replace(/\s/g, " ")}</span>`;
            } else if (["1W", "1M"].includes(displayData)) {
              const timeString = date?.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                timeZone: "UTC",
              });
              return `<span class=" text-xs">${timeString}</span>`;
            } else {
              const timeString = date?.toLocaleDateString("en-US", {
                year: "2-digit",
                month: "short",
                timeZone: "UTC",
              });
              return `<span class=" text-xs">${timeString}</span>`;
            }
          },
        },
        tickPositioner: function () {
          // Create custom tick positions with wider spacing
          const positions = [];
          const info = this.getExtremes();
          const tickCount = $screenWidth < 640 ? 2 : 5; // Reduce number of ticks displayed
          const interval = Math.floor((info.max - info.min) / tickCount);

          for (let i = 0; i <= tickCount; i++) {
            positions.push(info.min + i * interval);
          }
          return positions;
        },
      },

      yAxis: {
        // Force y‑axis to stay near the actual data range
        min: yMin ?? null,
        max: yMax ?? null,
        startOnTick: false,
        endOnTick: false,
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        title: { text: null },
        labels: {
          style: { color: $mode === "light" ? "black" : "white" },
        },
        opposite: true,
        // Add a dashed plot line at the previous close value
        plotLines: [
          {
            value:
              displayData === "1D"
                ? data?.getStockQuote?.previousClose
                : priceData?.at(0)?.close,
            dashStyle: "Dash",
            color: "#fff", // Choose a contrasting color if needed
            width: 0.8,
          },
        ],
      },
      plotOptions: {
        series: {
          animation: false,
          marker: { enabled: false },
          states: { hover: { enabled: false } },
        },
      },
      legend: { enabled: false },
      series: [
        {
          name: "Price",
          type: "area",
          data: displayData === "1D" ? seriesData : priceList,
          animation: false,
          color: lineColor,
          lineWidth: 2,
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

  //const startTimeTracking = performance.now();

  //==========================//

  $: {
    if (output !== null) {
      let change;
      let graphChange;
      let currentDataRow;
      let currentDataRowOneDay;
      let baseClose = previousClose;
      let graphBaseClose;

      currentDataRowOneDay = oneDayPrice?.at(-1);

      switch (displayData) {
        case "1W":
          currentDataRow = oneWeekPrice?.at(-1);
          graphBaseClose = oneWeekPrice?.at(0)?.close;
          config = plotData(oneWeekPrice) || null;
          break;

        case "1M":
          currentDataRow = oneMonthPrice?.at(-1);
          graphBaseClose = oneMonthPrice?.at(0)?.close;
          config = plotData(oneMonthPrice) || null;
          break;
        case "YTD":
          currentDataRow = ytdPrice?.at(-1);
          graphBaseClose = ytdPrice?.at(0)?.close;
          config = plotData(ytdPrice) || null;
          break;
        case "6M":
          currentDataRow = sixMonthPrice?.at(-1);
          graphBaseClose = sixMonthPrice?.at(0)?.close;
          config = plotData(sixMonthPrice) || null;
          break;

        case "1Y":
          currentDataRow = oneYearPrice?.at(-1);
          graphBaseClose = oneYearPrice?.at(0)?.close;
          config = plotData(oneYearPrice) || null;
          break;

        case "MAX":
          currentDataRow = maxPrice?.at(-1);
          graphBaseClose = maxPrice?.at(0)?.close;
          config = plotData(maxPrice) || null;
          break;
      }

      const closeValue =
        $realtimePrice !== null && $realtimePrice !== undefined
          ? $realtimePrice
          : (currentDataRowOneDay?.close ?? currentDataRowOneDay?.value);

      const graphCloseValue =
        $realtimePrice !== null && $realtimePrice !== undefined
          ? $realtimePrice
          : (currentDataRow?.close ?? currentDataRow?.value);

      if (closeValue && baseClose) {
        change = ((closeValue / baseClose - 1) * 100)?.toFixed(2);
      }

      if (graphCloseValue && graphBaseClose) {
        graphChange = ((graphCloseValue / graphBaseClose - 1) * 100)?.toFixed(
          2,
        );
      }

      // Format date
      const date = new Date(currentDataRowOneDay?.time * 1000);

      const options = {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "UTC",
      };

      const formattedDate = date?.toLocaleString("en-US", options);

      const safeFormattedDate =
        formattedDate === "Invalid Date"
          ? convertTimestamp(data?.getStockQuote?.timestamp)
          : formattedDate;

      // Set display legend
      displayLegend = {
        close:
          currentDataRowOneDay?.close?.toFixed(2) ??
          data?.getStockQuote?.price?.toFixed(2),
        date: safeFormattedDate,
        change,
        graphChange: displayData === "1D" ? change : graphChange,
      };
    }
  }

  //==========================//

  $: {
    if ($stockTicker) {
      // add a check to see if running on client-side
      if ($realtimePrice !== null && $realtimePrice !== 0) {
        $currentPortfolioPrice = $realtimePrice;
      } else if ($realtimePrice === null || $realtimePrice === 0) {
        $realtimePrice = data?.getStockQuote?.price;
        $currentPortfolioPrice = $realtimePrice;
      } else if (oneDayPrice?.length !== 0) {
        $currentPortfolioPrice = oneDayPrice?.at(-1)?.close;
      }
    }
  }

  async function changeData(state) {
    switch (state) {
      case "1D":
        displayData = "1D";
        if (oneDayPrice?.length !== 0) {
          displayLastLogicalRangeValue = oneDayPrice?.at(0)?.close; //previousClose
          lastValue = oneDayPrice?.at(-1)?.close;
        } else {
          displayLastLogicalRangeValue = null;
          lastValue = null;
        }
        config = plotData(oneDayPrice) || null;
        break;
      case "1W":
        displayData = "1W";
        await historicalPrice("one-week");
        if (oneWeekPrice?.length !== 0) {
          displayLastLogicalRangeValue = oneWeekPrice?.at(0)?.close;
          lastValue = oneWeekPrice?.slice(-1)?.at(0)?.close;
        } else {
          displayLastLogicalRangeValue = null;
          lastValue = null;
        }

        break;
      case "1M":
        displayData = "1M";
        await historicalPrice("one-month");
        if (oneMonthPrice?.length !== 0) {
          displayLastLogicalRangeValue = oneMonthPrice?.at(0)?.close;
          lastValue = oneMonthPrice.slice(-1)?.at(0)?.close;
        } else {
          displayLastLogicalRangeValue = null;
          lastValue = null;
        }
        break;
      case "YTD":
        displayData = "YTD";
        await historicalPrice("ytd");
        if (ytdPrice?.length !== 0) {
          displayLastLogicalRangeValue = ytdPrice?.at(0)?.close;
          lastValue = ytdPrice.slice(-1)?.at(0)?.close;
        } else {
          displayLastLogicalRangeValue = null;
          lastValue = null;
        }
        break;
      case "6M":
        displayData = "6M";
        await historicalPrice("six-months");
        if (sixMonthPrice?.length !== 0) {
          displayLastLogicalRangeValue = sixMonthPrice?.at(0)?.close;
          lastValue = sixMonthPrice?.slice(-1)?.at(0)?.close;
        } else {
          displayLastLogicalRangeValue = null;
          lastValue = null;
        }
        break;
      case "1Y":
        displayData = "1Y";
        await historicalPrice("one-year");

        if (oneYearPrice?.length !== 0) {
          displayLastLogicalRangeValue = oneYearPrice?.at(0)?.close;
          lastValue = oneYearPrice.slice(-1)?.at(0)?.close;
        } else {
          displayLastLogicalRangeValue = null;
          lastValue = null;
        }

        break;
      case "MAX":
        displayData = "MAX";
        await historicalPrice("max");
        if (maxPrice?.length !== 0) {
          displayLastLogicalRangeValue = maxPrice?.at(0)?.close;
          lastValue = maxPrice.slice(-1)?.at(0)?.close;
        } else {
          displayLastLogicalRangeValue = null;
          lastValue = null;
        }

        break;
      default:
        return;
    }
  }

  let oneDayPrice = [];
  let oneWeekPrice = [];
  let oneMonthPrice = [];
  let ytdPrice = [];
  let sixMonthPrice = [];

  let oneYearPrice = [];
  let maxPrice = [];

  async function historicalPrice(timePeriod: string) {
    const cachedData = getCache($stockTicker, "historicalPrice" + timePeriod);
    if (cachedData) {
      switch (timePeriod) {
        case "one-week":
          oneWeekPrice = cachedData;
          break;
        case "one-month":
          oneMonthPrice = cachedData;
          break;
        case "ytd":
          ytdPrice = cachedData;
          break;
        case "six-months":
          sixMonthPrice = cachedData;
          break;
        case "one-year":
          oneYearPrice = cachedData;
          break;
        case "max":
          maxPrice = cachedData;
          break;
        default:
          console.log(`Unsupported time period: ${timePeriod}`);
      }
    } else {
      output = null;
      config = null;

      const postData = {
        ticker: $stockTicker,
        timePeriod: timePeriod,
      };

      const response = await fetch("/api/historical-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      output = (await response?.json()) ?? [];

      const lastHistoric = output[output?.length - 1];
      const lastOneDay = oneDayPrice[oneDayPrice?.length - 1];

      // parse into Date objects
      const historicDate = new Date(lastHistoric?.time);
      const oneDayDate = new Date(lastOneDay?.time);

      // if historicData is not newer than oneDayPrice, push it
      // i.e. if historicDate <= oneDayDate
      if (historicDate <= oneDayDate) {
        output?.push(lastOneDay);
      }

      try {
        switch (timePeriod) {
          case "one-week":
            oneWeekPrice = output;
            break;
          case "one-month":
            oneMonthPrice = output;
            break;
          case "ytd":
            ytdPrice = output;
            break;
          case "six-months":
            sixMonthPrice = output;
            break;
          case "one-year":
            oneYearPrice = output;
            break;
          case "max":
            maxPrice = output;
            break;
          default:
            console.log(`Unsupported time period: ${timePeriod}`);
        }

        setCache($stockTicker, output, "historicalPrice" + timePeriod);
      } catch (e) {
        console.log(e);
      }
    }
  }

  async function initializePrice() {
    output = null;
    config = null;

    try {
      oneDayPrice = [...data?.getOneDayPrice] ?? [];

      output = [...oneDayPrice];

      if (oneDayPrice?.length > 0) {
        config = plotData(oneDayPrice) || null;
      }

      displayData =
        oneDayPrice?.length === 0 && sixMonthPrice?.length !== 0 ? "6M" : "1D";
      if (displayData === "1D") {
        lastValue = oneDayPrice?.at(-0)?.close;
      } else if (displayData === "6M") {
        lastValue = sixMonthPrice?.at(-1)?.close;
      }

      displayLastLogicalRangeValue =
        oneDayPrice?.length === 0 && sixMonthPrice?.length !== 0
          ? sixMonthPrice?.at(0)?.close
          : oneDayPrice?.at(0)?.close;
    } catch (e) {
      console.log(e);
    }
  }

  let displayLegend = {
    close: data?.getStockQuote?.price
      ? data?.getStockQuote?.price?.toFixed(2)
      : "n/a",
    date: "-",
    change: data?.getStockQuote?.changesPercentage
      ? data?.getStockQuote?.changesPercentage?.toFixed(2)
      : "n/a",
  };

  let displayLastLogicalRangeValue;

  onDestroy(async () => {
    $priceIncrease = null;
    $globalForm = [];
    disconnectOneDayPriceWebSocket();
  });

  $: dataMapping = {
    "1D": oneDayPrice,
    "1W": oneWeekPrice,
    "1M": oneMonthPrice,
    ytd: ytdPrice,
    "6M": sixMonthPrice,
    "1Y": oneYearPrice,
    MAX: maxPrice,
  };

  $: {
    if (form) {
      $globalForm = form;
    }
  }

  $: {
    if ($stockTicker || $mode) {
      // add a check to see if running on client-side
      oneDayPrice = [];
      oneWeekPrice = [];
      oneMonthPrice = [];
      ytdPrice = [];
      oneYearPrice = [];
      maxPrice = [];
      output = null;
      config = null;

      stockDeck = data?.getStockDeck;
      initializePrice();
    }
  }
  $: {
    if (
      $wsShares &&
      $wsShares > 0 &&
      $wsShares !== null &&
      typeof window !== "undefined" &&
      quoteVolume
    ) {
      quoteVolume += $wsShares;
    }
  }
</script>

<SEO
  title={`${$stockTicker} ${$currentPortfolioPrice !== null && $currentPortfolioPrice !== 0 ? $currentPortfolioPrice : "$" + data?.getStockQuote?.price?.toFixed(2)} ${displayLegend?.change >= 0 ? "▲" : "▼"} ${displayLegend?.change}% Live Trading Data`}
  description={`Complete ${data?.companyName} (${$stockTicker}) stock analysis with real-time price ${$currentPortfolioPrice !== null && $currentPortfolioPrice !== 0 ? $currentPortfolioPrice : "$" + data?.getStockQuote?.price?.toFixed(2)}, earnings forecasts, financial statements, options flow analysis, and technical indicators. Market cap ${data?.getStockQuote?.marketCap ? "$" + (data.getStockQuote.marketCap / 1e9).toFixed(1) + "B" : "N/A"}. Professional-grade investment research and trading insights for ${$stockTicker} stock.`}
  keywords={`${$stockTicker} stock analysis, ${data?.companyName} stock price, ${$stockTicker} real-time quotes, ${$stockTicker} earnings forecast, ${$stockTicker} financial data, ${$stockTicker} options analysis, ${$stockTicker} technical analysis, ${$stockTicker} investment research, stock market analysis, equity research, financial statements analysis, earnings reports, options flow`}
  type="article"
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "Article", "WebPage"],
    name: `${data?.companyName} (${$stockTicker}) Stock Analysis`,
    identifier: $stockTicker,
    headline: `${data?.companyName} (${$stockTicker}) - Complete Stock Analysis & Real-Time Data`,
    description: `Comprehensive stock analysis for ${data?.companyName} (${$stockTicker}) including real-time price data, financial statements, earnings forecasts, and technical indicators`,
    url: `https://stocknear.com/stocks/${$stockTicker}`,

    author: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
      description: "Professional stock market analysis platform",
    },
    publisher: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
      logo: {
        "@type": "ImageObject",
        url: "https://stocknear.com/favicon.png",
      },
    },
    dateModified: new Date().toISOString(),
    datePublished: new Date().toISOString(),
    mainEntity: {
      "@type": "Corporation",
      name: data?.companyName,
      tickerSymbol: $stockTicker,
      url: data?.website,
      description: `Publicly traded corporation listed under ticker symbol ${$stockTicker}`,
    },
    about: {
      "@type": "FinancialProduct",
      name: `${data?.companyName} Common Stock`,
      category: "Equity Security",
      identifier: $stockTicker,
      provider: {
        "@type": "Organization",
        name: data?.companyName,
      },
      offers: {
        "@type": "Offer",
        price:
          $currentPortfolioPrice !== null && $currentPortfolioPrice !== 0
            ? $currentPortfolioPrice
            : data?.getStockQuote?.price,
        priceCurrency: "USD",
        priceValidUntil: new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        ).toISOString(),
        availability: "https://schema.org/InStock",
      },
    },
    financialData: {
      "@type": "MonetaryAmount",
      currency: "USD",
      value: {
        marketCap: data?.getStockQuote?.marketCap,
        price:
          $currentPortfolioPrice !== null && $currentPortfolioPrice !== 0
            ? $currentPortfolioPrice
            : data?.getStockQuote?.price,
        eps: data?.getStockQuote?.eps,
        peRatio: data?.getStockQuote?.pe,
        volume: data?.getStockQuote?.volume,
      },
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://stocknear.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Stocks",
          item: "https://stocknear.com/stocks",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `${data?.companyName} (${$stockTicker})`,
          item: `https://stocknear.com/stocks/${$stockTicker}`,
        },
      ],
    },
  }}
/>

<section
  class="text-muted dark:text-white min-h-screen pb-40 overflow-hidden w-full"
>
  <div class="w-full m-auto overflow-hidden">
    <div
      class="md:flex md:justify-between md:divide-x md:divide-slate-800 w-full"
    >
      <!-- Main content -->
      <div class="pb-12 md:pb-20 w-full sm:pr-6 xl:pr-0">
        <div class="mt-2">
          <!--End Ticker Section-->
          <!-- Start Graph -->

          <div
            class="sm:pl-7 mt-4 mb-5 lg:flex lg:flex-row lg:gap-x-4 w-full min-h-[320px]"
          >
            <div
              class="order-1 lg:order-5 grow overflow-hidden border-gray-300 dark:border-gray-800 py-0.5 xs:py-1 sm:px-0.5 sm:pb-3 sm:pt-2.5 lg:mb-0 lg:border-0 lg:border-l lg:border-sharp lg:px-0 lg:py-0 lg:pl-5 md:mb-4 md:border-b"
            >
              <div class="flex items-center justify-between py-1 sm:pt-0.5">
                <div class=" overflow-x-auto">
                  <ul class="flex sm:space-x-2">
                    {#each intervals as interval}
                      <li>
                        <button
                          on:click={() => changeData(interval)}
                          class="cursor-pointer"
                        >
                          <span
                            class="block px-3 sm:px-2 py-1 text-sm sm:text-[1rem] rounded duration-100 ease-in-out whitespace-nowrap
          {displayData === interval
                              ? 'bg-gray-100 text-muted dark:bg-primary dark:text-white font-semibold'
                              : 'bg-transparent text-muted dark:text-gray-400 dark:sm:hover:text-white sm:hover:bg-gray-100 dark:sm:hover:bg-primary'}"
                          >
                            {$screenWidth < 1200
                              ? interval
                              : convertPeriodString(interval)}
                          </span>
                        </button>
                      </li>
                    {/each}
                  </ul>
                </div>
                <div
                  class="flex shrink flex-row space-x-1 pr-1 text-sm sm:text-[1rem]"
                >
                  <span
                    class={displayLegend?.graphChange >= 0
                      ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
                      : "text-red-800 dark:text-[#FF2F1F]"}
                  >
                    {displayLegend?.graphChange ??
                      data?.getStockQuote?.changesPercentage?.toFixed(2)}%
                  </span>
                  <span class="hidden text-muted dark:text-gray-200 sm:block"
                    >({displayData})</span
                  >
                </div>
              </div>

              {#if output !== null && config !== null && dataMapping[displayData]?.length !== 0}
                <div use:highcharts={config}></div>
              {:else}
                <div
                  class="flex justify-center w-full sm:w-[650px] h-[300px] sm:h-[320px] items-center"
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
            </div>

            <div
              class="mt-5 lg:mt-0 order-5 lg:order-1 flex flex-row space-x-2 sm:space-x-3 xs:space-x-4"
            >
              <table class="w-[50%] text-sm sm:text-[1rem] lg:min-w-[250px]">
                <tbody
                  ><tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-800 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >Bid</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-[1rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{$wsBidPrice !== 0 && $wsBidPrice !== null
                        ? $wsBidPrice
                        : ((data?.getStockQuote?.bid !== 0
                            ? data?.getStockQuote?.bid
                            : "n/a") ?? "n/a")}</td
                    ></tr
                  >
                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-800 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      ><a
                        href={`/stocks/${$stockTicker}/statistics/market-cap`}
                        class="sm:hover:text-blue-800 dark:sm:hover:text-blue-400 underline underline-offset-4"
                        >Market Cap</a
                      ></td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-[1rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{@html abbreviateNumber(
                        data?.getStockQuote?.marketCap,
                        false,
                        true,
                      )}</td
                    ></tr
                  >
                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-800 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      ><a
                        href={`/stocks/${$stockTicker}/statistics/revenue`}
                        class="sm:hover:text-blue-800 dark:sm:hover:text-blue-400 underline underline-offset-4"
                        >Revenue (ttm)</a
                      ></td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                    >
                      {@html stockDeck?.revenueTTM !== null &&
                      stockDeck?.revenueTTM !== 0
                        ? abbreviateNumber(stockDeck?.revenueTTM, false, true)
                        : "n/a"}</td
                    ></tr
                  >
                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-800 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >Net Income (ttm)</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{@html stockDeck?.netIncomeTTM !== null
                        ? abbreviateNumber(stockDeck?.netIncomeTTM, false, true)
                        : "n/a"}</td
                    ></tr
                  >

                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-800 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >EPS (ttm)</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{data?.getStockQuote?.eps ?? "n/a"}</td
                    ></tr
                  >
                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-800 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >PE Ratio (ttm)</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{data?.getStockQuote?.pe ?? "n/a"}</td
                    ></tr
                  >
                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-800 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >Forward PE</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{stockDeck?.forwardPE ?? "n/a"}</td
                    ></tr
                  >
                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-800 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      ><a
                        href={data?.getAnalystSummary?.consensusRating !==
                        undefined
                          ? `/stocks/${$stockTicker}/forecast`
                          : ""}
                        class={data?.getAnalystSummary?.consensusRating !==
                        undefined
                          ? "sm:hover:text-blue-800 dark:sm:hover:text-blue-400 underline underline-offset-4"
                          : " cursor-text"}>Analyst</a
                      >
                    </td>
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{data?.getAnalystSummary?.consensusRating !== null &&
                      data?.getAnalystSummary?.consensusRating !== "n/a" &&
                      data?.getAnalystSummary?.consensusRating !== undefined
                        ? data?.getAnalystSummary?.consensusRating
                        : "n/a"}</td
                    ></tr
                  >

                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-800 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      ><a
                        href={data?.getStockDeck?.annualDividend
                          ? `/stocks/${$stockTicker}/dividends`
                          : ""}
                        class={data?.getStockDeck?.annualDividend
                          ? "sm:hover:text-blue-800 dark:sm:hover:text-blue-400 underline underline-offset-4"
                          : " cursor-text"}>Dividends</a
                      >
                    </td>
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{data?.getStockDeck?.annualDividend
                        ? "$" + data?.getStockDeck?.annualDividend
                        : "n/a"}</td
                    ></tr
                  >
                </tbody>
              </table>
              <table class="w-[50%] text-sm lg:min-w-[250px]">
                <tbody
                  ><tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-800 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >Ask</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{$wsAskPrice !== 0 && $wsAskPrice !== null
                        ? $wsAskPrice
                        : ((data?.getStockQuote?.ask !== 0
                            ? data?.getStockQuote?.ask
                            : "n/a") ?? "n/a")}</td
                    ></tr
                  >
                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-800 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >Volume</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{Math.floor(quoteVolume)?.toLocaleString("en-us")}</td
                    ></tr
                  >
                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-800 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >Avg. Volume (20D)</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{data?.getStockQuote?.avgVolume !== undefined
                        ? data?.getStockQuote?.avgVolume?.toLocaleString(
                            "en-us",
                          )
                        : "n/a"}</td
                    ></tr
                  >
                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-800 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >Open</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{data?.getStockQuote?.open?.toFixed(2)}</td
                    ></tr
                  >
                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-800 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >Previous Close</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{data?.getStockQuote?.previousClose?.toFixed(2)}</td
                    ></tr
                  >
                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-800 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >Day's Range</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{data?.getStockQuote?.dayLow?.toFixed(2)} - {data?.getStockQuote?.dayHigh?.toFixed(
                        2,
                      )}</td
                    ></tr
                  >
                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-800 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >52-Week Range</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{data?.getStockQuote?.yearLow?.toFixed(2)} - {data?.getStockQuote?.yearHigh?.toFixed(
                        2,
                      )}</td
                    ></tr
                  >
                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-800 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >Beta</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{stockDeck?.beta
                        ? stockDeck?.beta?.toFixed(2)
                        : "n/a"}</td
                    ></tr
                  >

                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-800 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >Ex-Dividend Date</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{stockDeck?.exDividendDate
                        ? new Date(
                            stockDeck?.exDividendDate,
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            timeZone: "UTC",
                          })
                        : "n/a"}</td
                    ></tr
                  >
                </tbody>
              </table>
            </div>
          </div>

          <!--End Graph-->

          <div
            class="mt-6 flex flex-col lg:flex-row gap-x-14 items-start w-full justify-between"
          >
            <div
              class="lg:space-y-6 lg:order-2 lg:pt-1 sm:pl-7 lg:pl-0 w-full lg:w-[45%] sm:ml-auto lg:max-w-[345px]"
            >
              <Sidecard {data} />
            </div>

            <div class="w-full lg:w-[65%] 2xl:w-[70%]">
              <div
                class="w-full m-auto sm:pl-6 sm:pb-6 {Object?.keys(
                  data?.getEarningsSurprise || {},
                )?.length > 0
                  ? ''
                  : 'hidden'}"
              >
                <EarningsSurprise {data} />
              </div>

              <div
                class="w-full m-auto mt-5 sm:mt-0 sm:pl-6 sm:pb-6 {Object?.keys(
                  data?.getNextEarnings || {},
                )?.length !== 0 &&
                data?.getEarningsSurprise?.date !== data?.getNextEarnings?.date
                  ? ''
                  : 'hidden'}"
              >
                <NextEarnings {data} />
              </div>

              <div
                class="w-full mt-10 sm:mt-0 m-auto sm:pl-6 sm:pb-6 {data
                  ?.getWhyPriceMoved?.length !== 0
                  ? ''
                  : 'hidden'}"
              >
                <WIIM {data} />
              </div>

              <div class="w-full mt-5 sm:mt-0 m-auto sm:pl-6 sm:pb-6">
                <News {data} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<script lang="ts">
  import StockPriceChart from "$lib/components/Plot/StockPriceChart.svelte";
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
  import StockPriceExport from "$lib/components/StockPriceExport.svelte";
  import {
    stock_detail_52w_range,
    stock_detail_analyst,
    stock_detail_ask,
    stock_detail_avg_volume_20d,
    stock_detail_beta,
    stock_detail_bid,
    stock_detail_days_range,
    stock_detail_dividends,
    stock_detail_eps_ttm,
    stock_detail_ex_dividend_date,
    stock_detail_forward_pe,
    stock_detail_market_cap,
    stock_detail_net_income_ttm,
    stock_detail_no_data,
    stock_detail_open,
    stock_detail_pb_ttm,
    stock_detail_pe_ratio_ttm,
    stock_detail_prev_close,
    stock_detail_price_target,
    stock_detail_ps_ttm,
    stock_detail_revenue_ttm,
    stock_detail_total_assets_ttm,
    stock_detail_total_equity_ttm,
    stock_detail_total_liabilities_ttm,
    stock_detail_volume,
  } from "$lib/paraglide/messages";

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

  let output = null;
  let displayData = "1D";
  let lastValue;

  // Get current chart data based on selected range
  $: currentChartData = (() => {
    switch (displayData) {
      case "1D":
        return oneDayPrice;
      case "1W":
        return oneWeekPrice;
      case "1M":
        return oneMonthPrice;
      case "6M":
        return sixMonthPrice;
      case "YTD":
        return ytdPrice;
      case "1Y":
        return oneYearPrice;
      case "MAX":
        return maxPrice;
      default:
        return oneDayPrice;
    }
  })();

  // Determine if chart should show negative colors
  $: chartIsNegative =
    displayData === "1D"
      ? data?.getStockQuote?.changesPercentage < 0
      : currentChartData?.length > 1
        ? (currentChartData?.at(-1)?.close / currentChartData?.at(0)?.close -
            1) *
            100 <
          0
        : false;

  const toNum = (v: unknown): number | null => {
    const n =
      typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
    return Number.isFinite(n) ? n : null;
  };

  $: priceTarget = toNum(data?.getAnalystSummary?.medianPriceTarget);

  $: priceTargetUpside =
    priceTarget !== null &&
    data?.getStockQuote?.price !== null &&
    data?.getStockQuote?.price !== 0
      ? ((priceTarget / data?.getStockQuote?.price - 1) * 100)?.toFixed(2)
      : 0;

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
            // Update oneDayPrice data - reactivity will update the chart
            oneDayPrice = newData;
            output = [...oneDayPrice];
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
          break;

        case "1M":
          currentDataRow = oneMonthPrice?.at(-1);
          graphBaseClose = oneMonthPrice?.at(0)?.close;
          break;
        case "YTD":
          currentDataRow = ytdPrice?.at(-1);
          graphBaseClose = ytdPrice?.at(0)?.close;
          break;
        case "6M":
          currentDataRow = sixMonthPrice?.at(-1);
          graphBaseClose = sixMonthPrice?.at(0)?.close;
          break;

        case "1Y":
          currentDataRow = oneYearPrice?.at(-1);
          graphBaseClose = oneYearPrice?.at(0)?.close;
          break;

        case "MAX":
          currentDataRow = maxPrice?.at(-1);
          graphBaseClose = maxPrice?.at(0)?.close;
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

  let isLoadingChart = true; // Track if chart data is still loading

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
      isLoadingChart = false;
    } else {
      output = null;
      isLoadingChart = true;

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
      } finally {
        isLoadingChart = false;
      }
    }
  }

  async function initializePrice() {
    output = null;
    isLoadingChart = true;

    try {
      oneDayPrice = [...data?.getOneDayPrice] ?? [];

      output = [...oneDayPrice];

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
    } finally {
      isLoadingChart = false;
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
  title={`${$stockTicker} ${$currentPortfolioPrice !== null && $currentPortfolioPrice !== 0 ? $currentPortfolioPrice : data?.getStockQuote?.price?.toFixed(2)} ${displayLegend?.change >= 0 ? "▲" : "▼"} ${displayLegend?.change}% Live Trading Data`}
  description={`Complete ${data?.companyName} (${$stockTicker}) stock analysis with real-time price ${$currentPortfolioPrice !== null && $currentPortfolioPrice !== 0 ? $currentPortfolioPrice : data?.getStockQuote?.price?.toFixed(2)}, earnings forecasts, financial statements, options flow analysis, and technical indicators. Market cap ${data?.getStockQuote?.marketCap ? "$" + (data.getStockQuote.marketCap / 1e9).toFixed(1) + "B" : "N/A"}. Professional-grade investment research and trading insights for ${$stockTicker} stock.`}
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
  class="text-gray-700 dark:text-zinc-200 min-h-screen pb-40 overflow-hidden w-full"
>
  <div class="w-full m-auto overflow-hidden">
    <div
      class="md:flex md:justify-between md:divide-x md:divide-gray-200/70 dark:md:divide-zinc-800/80 w-full"
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
              class="order-1 lg:order-5 grow overflow-hidden border-gray-300 dark:border-zinc-700 py-0.5 xs:py-1 sm:px-0.5 sm:pb-3 sm:pt-2.5 lg:mb-0 lg:border-0 lg:border-l lg:px-0 lg:py-0 lg:pl-5 md:mb-4 md:border-b"
            >
              <div class="flex items-center justify-between py-1 sm:pt-0.5">
                <div class="overflow-x-auto">
                  <ul class="flex sm:space-x-2">
                    {#each intervals as interval}
                      <li>
                        <button
                          on:click={() => changeData(interval)}
                          class="cursor-pointer"
                        >
                          <span
                            class="block px-3 sm:px-2 py-1 text-sm rounded-full duration-100 ease-in-out whitespace-nowrap
          {displayData === interval
                              ? 'bg-gray-100/70 text-gray-900 dark:text-white dark:bg-zinc-900/60 font-semibold'
                              : 'bg-transparent text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100/60 dark:hover:bg-zinc-900/60'}"
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
                <div class="flex shrink flex-row space-x-1 pr-1 text-sm">
                  {#if displayLegend?.graphChange}
                    <span
                      class={displayLegend?.graphChange >= 0
                        ? "before:content-['+'] text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"}
                    >
                      {displayLegend?.graphChange ??
                        data?.getStockQuote?.changesPercentage?.toFixed(2)}%
                    </span>
                    <span
                      class="hidden text-gray-500 dark:text-zinc-300 sm:block"
                      >({displayData})</span
                    >
                  {/if}
                </div>
              </div>

              {#if currentChartData?.length > 0}
                <StockPriceChart
                  priceData={currentChartData}
                  displayRange={displayData}
                  previousClose={data?.getStockQuote?.previousClose}
                  isNegative={chartIsNegative}
                  isLoading={isLoadingChart}
                />
              {:else if !isLoadingChart}
                <div
                  class="flex justify-center w-full sm:w-[650px] h-[300px] sm:h-[320px] items-center"
                >
                  <p class="text-sm text-gray-500 dark:text-zinc-300">
                    {stock_detail_no_data()}
                  </p>
                </div>
              {:else}
                <StockPriceChart
                  priceData={[]}
                  displayRange={displayData}
                  previousClose={null}
                  isNegative={false}
                  isLoading={true}
                />
              {/if}
            </div>

            <div
              class="mt-5 lg:mt-0 order-5 lg:order-1 flex flex-row space-x-2 sm:space-x-3 xs:space-x-4"
            >
              <table class="w-[50%] text-sm lg:min-w-[250px]">
                <tbody
                  ><tr
                    class="flex flex-col border-b border-gray-300 dark:border-zinc-700 min-h-[60px] justify-center sm:table-row sm:min-h-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >{stock_detail_bid()}</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{$wsBidPrice !== 0 && $wsBidPrice !== null
                        ? $wsBidPrice
                        : ((data?.getStockQuote?.bid !== 0
                            ? data?.getStockQuote?.bid
                            : "n/a") ?? "n/a")}</td
                    ></tr
                  >
                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-zinc-700 min-h-[60px] justify-center sm:table-row sm:min-h-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      ><a
                        href={`/stocks/${$stockTicker}/statistics/market-cap`}
                        class="hover:text-violet-600 dark:hover:text-violet-400 underline underline-offset-4"
                        >{stock_detail_market_cap()}</a
                      ></td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{@html abbreviateNumber(
                        data?.getStockQuote?.marketCap,
                        false,
                        true,
                      )}</td
                    ></tr
                  >

                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-zinc-700 min-h-[60px] justify-center sm:table-row sm:min-h-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      ><a
                        href={`/stocks/${$stockTicker}/statistics/revenue`}
                        class="hover:text-violet-600 dark:hover:text-violet-400 underline underline-offset-4"
                        >{stock_detail_revenue_ttm()}</a
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
                    class="flex flex-col border-b border-gray-300 dark:border-zinc-700 min-h-[60px] justify-center sm:table-row sm:min-h-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >{stock_detail_net_income_ttm()}</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{@html stockDeck?.netIncomeTTM !== null
                        ? abbreviateNumber(stockDeck?.netIncomeTTM, false, true)
                        : "n/a"}</td
                    ></tr
                  >

                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-zinc-700 min-h-[60px] justify-center sm:table-row sm:min-h-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >{stock_detail_eps_ttm()}</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{data?.getStockQuote?.eps ?? "n/a"}</td
                    ></tr
                  >
                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-zinc-700 min-h-[60px] justify-center sm:table-row sm:min-h-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >{stock_detail_pe_ratio_ttm()}</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{data?.getStockQuote?.pe ?? "n/a"}</td
                    ></tr
                  >
                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-zinc-700 min-h-[60px] justify-center sm:table-row sm:min-h-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >{stock_detail_forward_pe()}</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{stockDeck?.forwardPE ?? "n/a"}</td
                    ></tr
                  >

                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-zinc-700 min-h-[60px] justify-center sm:table-row sm:min-h-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >{stock_detail_pb_ttm()}</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{stockDeck?.priceToBookRatioTTM
                        ? stockDeck?.priceToBookRatioTTM?.toFixed(2)
                        : "n/a"}</td
                    ></tr
                  >

                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-zinc-700 min-h-[60px] justify-center sm:table-row sm:min-h-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >{stock_detail_ps_ttm()}</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{stockDeck?.priceToSalesRatioTTM
                        ? stockDeck?.priceToSalesRatioTTM?.toFixed(2)
                        : "n/a"}</td
                    ></tr
                  >

                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-zinc-700 min-h-[60px] justify-center sm:table-row sm:min-h-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >{stock_detail_total_assets_ttm()}</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{stockDeck?.totalAssets
                        ? abbreviateNumber(stockDeck?.totalAssets)
                        : "n/a"}</td
                    ></tr
                  >
                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-zinc-700 min-h-[60px] justify-center sm:table-row sm:min-h-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >{stock_detail_total_liabilities_ttm()}</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                    >
                      {stockDeck?.totalLiabilities
                        ? abbreviateNumber(stockDeck?.totalLiabilities)
                        : "n/a"}</td
                    ></tr
                  >

                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-zinc-700 min-h-[60px] justify-center sm:table-row sm:min-h-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                    >
                      {stock_detail_total_equity_ttm()}
                    </td>
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                    >
                      {stockDeck?.totalEquity
                        ? abbreviateNumber(stockDeck?.totalEquity)
                        : "n/a"}</td
                    ></tr
                  >
                </tbody>
              </table>

              <table class="w-[50%] text-sm lg:min-w-[250px]">
                <tbody
                  ><tr
                    class="flex flex-col border-b border-gray-300 dark:border-zinc-700 min-h-[60px] justify-center sm:table-row sm:min-h-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >{stock_detail_ask()}</td
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
                    class="flex flex-col border-b border-gray-300 dark:border-zinc-700 min-h-[60px] justify-center sm:table-row sm:min-h-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >{stock_detail_volume()}</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{Math.floor(quoteVolume)?.toLocaleString("en-us")}</td
                    ></tr
                  >
                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-zinc-700 min-h-[60px] justify-center sm:table-row sm:min-h-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >{stock_detail_avg_volume_20d()}</td
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
                    class="flex flex-col border-b border-gray-300 dark:border-zinc-700 min-h-[60px] justify-center sm:table-row sm:min-h-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >{stock_detail_open()}</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{data?.getStockQuote?.open
                        ? data?.getStockQuote?.open?.toFixed(2)
                        : "n/a"}</td
                    ></tr
                  >
                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-zinc-700 min-h-[60px] justify-center sm:table-row sm:min-h-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >{stock_detail_prev_close()}</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{data?.getStockQuote?.previousClose
                        ? data?.getStockQuote?.previousClose?.toFixed(2)
                        : "n/a"}</td
                    ></tr
                  >
                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-zinc-700 min-h-[60px] justify-center sm:table-row sm:min-h-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >{stock_detail_days_range()}</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{data?.getStockQuote?.dayLow
                        ? data?.getStockQuote?.dayLow?.toFixed(2)
                        : "n/a"} - {data?.getStockQuote?.dayHigh
                        ? data?.getStockQuote?.dayHigh?.toFixed(2)
                        : "n/a"}</td
                    ></tr
                  >
                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-zinc-700 min-h-[60px] justify-center sm:table-row sm:min-h-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >{stock_detail_52w_range()}</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{data?.getStockQuote?.yearLow
                        ? data?.getStockQuote?.yearLow?.toFixed(2)
                        : "n/a"} - {data?.getStockQuote?.yearHigh
                        ? data?.getStockQuote?.yearHigh?.toFixed(2)
                        : "n/a"}</td
                    ></tr
                  >
                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-zinc-700 min-h-[60px] justify-center sm:table-row sm:min-h-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >{stock_detail_beta()}</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{stockDeck?.beta
                        ? stockDeck?.beta?.toFixed(2)
                        : "n/a"}</td
                    ></tr
                  >

                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-zinc-700 min-h-[60px] justify-center sm:table-row sm:min-h-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      ><a
                        href={data?.getAnalystSummary?.consensusRating !==
                        undefined
                          ? `/stocks/${$stockTicker}/forecast/analyst`
                          : ""}
                        class={data?.getAnalystSummary?.consensusRating !==
                        undefined
                          ? "hover:text-violet-600 dark:hover:text-violet-400 underline underline-offset-4"
                          : " cursor-text"}>{stock_detail_analyst()}</a
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
                    class="flex flex-col border-b border-gray-300 dark:border-zinc-700 min-h-[60px] justify-center sm:table-row sm:min-h-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      ><a
                        href={data?.getAnalystSummary?.consensusRating !==
                        undefined
                          ? `/stocks/${$stockTicker}/forecast`
                          : ""}
                        class={data?.getAnalystSummary?.consensusRating !==
                        undefined
                          ? "hover:text-violet-600 dark:hover:text-violet-400 underline underline-offset-4"
                          : " cursor-text"}>{stock_detail_price_target()}</a
                      >
                    </td>
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                    >
                      {#if priceTarget}
                        {priceTarget} ({priceTargetUpside}%)
                      {:else}
                        n/a
                      {/if}</td
                    ></tr
                  >

                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-zinc-700 min-h-[60px] justify-center sm:table-row sm:min-h-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      ><a
                        href={data?.getStockDeck?.annualDividend
                          ? `/stocks/${$stockTicker}/dividends`
                          : ""}
                        class={data?.getStockDeck?.annualDividend
                          ? "hover:text-violet-600 dark:hover:text-violet-400 underline underline-offset-4"
                          : " cursor-text"}>{stock_detail_dividends()}</a
                      >
                    </td>
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm sm:text-[0.9rem] font-semibold dark:font-normal xs:px-1 sm:text-right"
                      >{data?.getStockDeck?.annualDividend
                        ? "$" + data?.getStockDeck?.annualDividend
                        : "n/a"}
                      {#if data?.getStockDeck?.annualDividend}
                        ({data?.getStockDeck?.dividendYield
                          ? data?.getStockDeck?.dividendYield + "%"
                          : "n/a"})
                      {/if}</td
                    ></tr
                  >
                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-zinc-700 min-h-[60px] justify-center sm:table-row sm:min-h-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 text-sm sm:text-[0.9rem]"
                      >{stock_detail_ex_dividend_date()}</td
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
              <Sidecard {data} {priceTargetUpside} {priceTarget} />
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

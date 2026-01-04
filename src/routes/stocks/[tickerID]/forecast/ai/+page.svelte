<script lang="ts">
  import { displayCompanyName, stockTicker, screenWidth } from "$lib/store";
  import { removeCompanyStrings } from "$lib/utils";
  import Infobox from "$lib/components/Infobox.svelte";
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";

  import SEO from "$lib/components/SEO.svelte";

  export let data;

  const isSubscribed = ["Pro", "Plus"]?.includes(data?.user?.tier);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const year = date.getUTCFullYear().toString().slice(-2);
    const monthIndex = date.getUTCMonth();
    const day = date.getUTCDate();

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const month = months[monthIndex];

    return `${month} ${day}, '${year}`;
  };

  const calculatePriceChange = (targetPrice) =>
    targetPrice && price ? ((targetPrice / price - 1) * 100)?.toFixed(2) : 0;

  function prepareDataset() {
    price = data?.getStockQuote?.price?.toFixed(2) || 0;

    avgPriceTarget = data?.getPriceAnalysis?.avgPriceTarget || 0;
    medianPriceTarget = data?.getPriceAnalysis?.medianPriceTarget || 0;
    lowPriceTarget = data?.getPriceAnalysis?.lowPriceTarget || 0;
    highPriceTarget = data?.getPriceAnalysis?.highPriceTarget || 0;

    lowChange = calculatePriceChange(lowPriceTarget);
    medianChange = calculatePriceChange(medianPriceTarget);
    avgChange = calculatePriceChange(avgPriceTarget);
    highChange = calculatePriceChange(highPriceTarget);

    // Assume data.getHistoricalPrice contains objects with a "time" field (e.g. "2015-01-02")
    historicalData = data?.getHistoricalPrice || [];

    backtestList = data?.getAIScore?.backtest || [];

    // Append the latest historical date (using "time") if available. Note that this entry may not include a score.
    if (historicalData && historicalData?.length) {
      const latest = historicalData?.at(-1);
      backtestList?.push({ date: latest.time });

      const seenDates = new Set();
      backtestList = backtestList?.filter((item) => {
        // Check if the date is already seen
        if (seenDates?.has(item?.date)) {
          // If yes, skip this duplicate (delete the last one)
          return false;
        }
        // Otherwise, record the date and keep the item
        seenDates?.add(item?.date);
        return true;
      });
    }

    processedData = backtestList?.map((item) => {
      const dateStr = item.date;
      const targetTime = new Date(dateStr).getTime();
      let closestPoint = historicalData[0];
      let minDiff = Infinity;

      historicalData.forEach((point) => {
        const pointTime = new Date(point.time).getTime();
        const diff = Math.abs(pointTime - targetTime);
        if (diff < minDiff) {
          minDiff = diff;
          closestPoint = point;
        }
      });

      // Base data point with x as the target date timestamp and y as the close price from the closest historical point
      const dataPoint = { x: targetTime, y: closestPoint.close };

      // If a score is provided, add marker configuration based on its value.
      if (item.hasOwnProperty("score")) {
        let markerColor, markerSymbol;
        if (item.score > 6) {
          // Bullish: green marker with an upward triangle
          markerColor = "#007050";
          markerSymbol = "circle";
        } else if (item.score < 5) {
          // Bearish: red marker with a downward triangle
          markerColor = "#007050";
          markerSymbol = "circle";
        } else {
          // Neutral (score exactly 5): yellow marker with a circle
          markerColor = "#007050";
          markerSymbol = "circle";
        }

        dataPoint.marker = {
          symbol: markerSymbol,
          radius: 4,
          fillColor: markerColor,
          lineWidth: 2,
          lineColor: $mode === "light" ? "black" : "white",
        };

        dataPoint.dataLabels = {
          enabled: true,
          format: String(item.score),
          style: {
            color: $mode === "light" ? "black" : "white",
            fontWeight: "bold",
            fontSize: "14px",
          },
          y: -10,
        };
      }

      return dataPoint;
    });

    tableDates = processedData
      ?.slice(0, -1)
      ?.map((item) => formatDate(item?.x));

    tableScore = processedData
      ?.slice(0, -1)
      ?.map((item) => item?.dataLabels?.format);

    // Compute percentage change
    tableQuarterChange = processedData
      ?.slice(0, -1)
      ?.map((item, index, arr) => {
        const prevY = arr[index - 1]?.y; // Get the previous value
        if (prevY == null || item.y == null) return null; // Handle missing values
        const change = ((item.y - prevY) / prevY) * 100; // Calculate percentage change
        return {
          quarter: tableDates[index],
          change: change?.toFixed(2) ?? null, // Format to 2 decimal places
          price: prevY?.toFixed(2) ?? null, // Format price to 2 decimal places
        };
      })
      ?.filter(Boolean); // Remove null values

    // Compute Average Return
    // Compute Average Return
    returns = processedData
      ?.slice(0, -1) // Exclude the last entry (current/latest) since it has no score or future data
      ?.map((item, index) => {
        const currentScore = item?.dataLabels?.format;
        const nextItem = processedData[index + 1];

        // Skip if no score available or no next data point
        if (
          !currentScore ||
          !nextItem ||
          item.y == null ||
          nextItem.y == null
        ) {
          return null;
        }

        const score = Number(currentScore);
        const currentPrice = item.y;
        const nextPrice = nextItem.y;
        const actualReturn = ((nextPrice - currentPrice) / currentPrice) * 100;

        // Corrected logic:
        // Bullish (score >= 7): go long - include the actual return
        // Neutral (score 4-6): stay out of the market - exclude from calculation
        // Bearish (score <= 3): go short - invert the return (profit from decline)

        if (score >= 7) {
          // Bullish prediction - go long
          // If price goes up, you make money (positive return)
          // If price goes down, you lose money (negative return)
          return actualReturn;
        } else if (score <= 3) {
          // Bearish prediction - go short
          // If price goes down, you make money (negative return becomes positive)
          // If price goes up, you lose money (positive return becomes negative)
          return -actualReturn;
        } else {
          // Neutral (scores 4-6) - stay out of the market
          // No position taken, so no return to include
          return null;
        }
      })
      .filter((val) => val !== null); // Remove null values

    avgReturn =
      returns?.length > 0
        ? returns.reduce((sum, returnPercentage) => sum + returnPercentage, 0) /
          returns.length
        : 0;
  }

  let price;

  let avgPriceTarget;
  let medianPriceTarget;
  let lowPriceTarget;
  let highPriceTarget;

  let lowChange;
  let medianChange;
  let avgChange;
  let highChange;

  let historicalData;

  let backtestList;

  // For each backtest entry, find the historical price with the closest available time.
  // Then, if a score exists, attach a marker and data label based on the score.
  let processedData = [];

  let tableDates;

  let tableScore;

  // Compute percentage change
  let tableQuarterChange;

  // Compute Average Return
  let returns;

  let avgReturn;

  function getAIScorePlot() {
    let solidData;
    if ($screenWidth < 640) {
      solidData = processedData
        ?.slice(0, -1) // all except last
        ?.filter((_, idx) => idx % 2 === 0) // keep every 2nd point
        ?.concat(processedData.at(-2));
    } else {
      solidData = processedData?.slice(0, -1); // all except last
    }

    const lastTwoPoints = processedData.slice(-2); // Extract the last two points

    // Highcharts options for plotting the data with markers.
    const options = {
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 360,
        animation: false,
      },
      title: {
        text: `<h3 class="mt-3 mb-1 text-[1rem] sm:text-lg">Historical AI Score Performance</h3>`,
        style: {
          color: $mode === "light" ? "black" : "white",
          // Using inline CSS for margin-top and margin-bottom
        },
        useHTML: true, // Enable HTML to apply custom class styling
      },
      xAxis: {
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        type: "datetime",
        labels: {
          style: {
            color: $mode === "light" ? "#545454" : "white",
          },
          formatter: function () {
            const date = new Date(this.value);
            return date.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            });
          },
        },
      },
      tooltip: {
        enabled: false,
      },
      yAxis: {
        title: {
          text: "",
        },
        labels: {
          style: {
            color: $mode === "light" ? "#545454" : "white",
          },
          formatter: function () {
            return `$${this.value.toFixed(0)}`;
          },
        },
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
      },
      series: [
        {
          name: "Close Price",
          data: solidData,
          color: $mode === "light" ? "#007050" : "#fff",
          animation: false,
          marker: {
            enabled: true,
          },
          lineWidth: 3,
        },
        {
          name: "Projected Price",
          data: lastTwoPoints, // Include the second-last and last point
          color: $mode === "light" ? "#007050" : "#fff",
          animation: false,
          marker: {
            enabled: false,
          },
          lineWidth: 2.5,
          dashStyle: "Dash", // Dashed line for the last part
        },
      ],

      plotOptions: {
        series: {
          enableMouseTracking: false,
          states: {
            hover: {
              enabled: false,
            },
          },
          marker: {
            states: {
              hover: {
                enabled: false,
              },
            },
          },
        },
      },
      legend: {
        enabled: false,
      },
      credits: {
        enabled: false,
      },
    };

    return options;
  }

  function getPriceForecastChart() {
    const historicalData = data?.getPriceAnalysis?.pastPriceList || [];
    const forecastTargets = {
      low: lowPriceTarget,
      avg: avgPriceTarget,
      high: highPriceTarget,
    };

    // Process historical data
    const processedHistorical = historicalData?.map((point) => [
      new Date(point?.date).getTime(),
      point?.close,
    ]);

    const currentDate = new Date();
    const forecastDate = new Date(
      currentDate.getFullYear() + 1,
      currentDate.getMonth(),
      currentDate.getDate(),
    );
    const forecastTimestamp = forecastDate.getTime();

    // Get the last historical data point
    const lastHistoricalDate = new Date(
      historicalData[historicalData.length - 1]?.date,
    ).getTime();
    const lastHistoricalClose =
      historicalData[historicalData.length - 1]?.close;

    // Create forecast points
    const forecastHigh = [
      [lastHistoricalDate, lastHistoricalClose],
      [forecastTimestamp, forecastTargets.high],
    ];

    const forecastAvg = [
      [lastHistoricalDate, lastHistoricalClose],
      [forecastTimestamp, forecastTargets.avg],
    ];

    const forecastLow = [
      [lastHistoricalDate, lastHistoricalClose],
      [forecastTimestamp, forecastTargets.low],
    ];

    const options = {
      tooltip: {
        enabled: false,
      },
      plotOptions: {
        series: {
          enableMouseTracking: false,
          states: {
            hover: {
              enabled: false,
            },
          },
          marker: {
            states: {
              hover: {
                enabled: false,
              },
            },
          },
        },
      },
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 360,
        animation: false,
      },
      title: {
        text: `<div class="grid grid-cols-2 w-[200px] sm:w-[500px] -mb-3.5 text-xs font-[501] text-gray-600 dark:text-gray-400">
          <h3 class="text-left">${$screenWidth && $screenWidth < 640 ? "Past Year" : "Past 12 Months"}</h3>
          <h3 class="text-right">${$screenWidth && $screenWidth < 640 ? "Next Year" : "12 Month Forecast"}</h3>
         </div>`,
        style: {
          color: $mode === "light" ? "black" : "white",
          width: "100%",
        },
        verticalAlign: "top",
        useHTML: true,
      },
      xAxis: {
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        type: "datetime",
        endOnTick: false,
        labels: {
          style: {
            color: $mode === "light" ? "#545454" : "white",
          },
          formatter: function () {
            const date = new Date(this.value);
            return date.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            });
          },
        },
      },
      yAxis: {
        title: {
          text: "",
        },
        labels: {
          style: {
            color: $mode === "light" ? "#545454" : "white",
          },
          formatter: function () {
            return `$${this.value.toFixed(0)}`;
          },
        },
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
      },

      series: [
        {
          animation: false,
          name: "Historical",
          data: processedHistorical,
          color: $mode === "light" ? "#007050" : "#fff",
          marker: {
            enabled: true,
            symbol: "circle",
            radius: 4,
          },
          lineWidth: 3,
        },
        {
          animation: false,
          name: "High",
          data: forecastHigh,
          color: "#31B800",
          dashStyle: "Dash",
          marker: {
            enabled: false,
          },
          lineWidth: 2.5,
        },
        {
          animation: false,
          name: "Average",
          data: forecastAvg,
          color: $mode === "light" ? "#007050" : "#fff",
          dashStyle: "Dash",
          marker: {
            enabled: false,
          },
          lineWidth: 2.5,
        },
        {
          animation: false,
          name: "Low",
          data: forecastLow,
          color: "#D9220E",
          dashStyle: "Dash",
          marker: {
            enabled: false,
          },
          lineWidth: 2.5,
        },
      ],

      legend: {
        enabled: false,
      },
      credits: {
        enabled: false,
      },
    };
    return options;
  }

  let config = null;
  let configScore = null;

  $: {
    if ($stockTicker || ($mode && typeof window !== "undefined")) {
      configScore = null;
      config = null;
      prepareDataset();
      configScore = getAIScorePlot() || null;
      config = getPriceForecastChart() || null;
    }
  }
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) AI Stock Forecast | Machine Learning Price Predictions`}
  description={`Advanced AI-powered stock forecast for ${$displayCompanyName} (${$stockTicker}). Machine learning price predictions, algorithmic analysis, trend forecasting, and technical indicators with real-time market sentiment and momentum analysis.`}
  keywords={`${$stockTicker} AI forecast, ${$displayCompanyName} stock prediction, machine learning stock analysis, AI price target, ${$stockTicker} algorithmic forecast, stock prediction model, AI trading signals, predictive stock analysis`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/forecast/ai`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "SoftwareApplication"],
    name: `${$displayCompanyName} AI Stock Forecast`,
    description: `Advanced AI-powered forecasting and prediction analysis for ${$displayCompanyName} (${$stockTicker})`,
    url: `https://stocknear.com/stocks/${$stockTicker}/forecast/ai`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "AI-powered price predictions",
      "Machine learning analysis",
      "Algorithmic forecasting",
      "Technical indicator analysis",
      "Market sentiment analysis",
      "Trend prediction models",
      "Risk assessment algorithms",
      "Automated trading signals",
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
      name: "AI Stock Forecasting",
      description:
        "Advanced artificial intelligence and machine learning for stock price prediction",
    },
  }}
/>

<section class="w-full overflow-hidden h-full">
  <div class="w-full flex justify-center w-full sm-auto h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <main class="w-full">
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 m-auto mt-2 sm:mt-0">
          {#if data?.getAIScore?.backtest?.length > 0}
            <div class="">
              <h1 class="text-xl sm:text-2xl font-bold">
                {removeCompanyStrings($displayCompanyName)} AI Score Forecast
              </h1>
            </div>

            <p class="mt-4">
              As of the latest evaluation, our AI model assigns a score of
              <strong
                >{#if isSubscribed}
                  {data?.getAIScore?.score || "n/a"}
                {:else}
                  <a
                    href="/pricing"
                    class="sm:hover:text-default dark:sm:hover:text-blue-400 text-sm"
                  >
                    Upgrade <svg
                      class="w-4 h-4 mb-1 inline-block"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                      />
                    </svg>
                  </a>
                {/if}</strong
              >
              out of 10, indicating a
              <strong>
                {#if isSubscribed}
                  {[10, 9, 8, 7]?.includes(data?.getAIScore?.score)
                    ? "bullish"
                    : [6, 5, 4]?.includes(data?.getAIScore?.score)
                      ? "neutral"
                      : "bearish"}
                {:else}
                  <a
                    href="/pricing"
                    class="sm:hover:text-default dark:sm:hover:text-blue-400 text-sm"
                  >
                    Upgrade <svg
                      class="w-4 h-4 mb-1 inline-block"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                      />
                    </svg>
                  </a>
                {/if}
              </strong>
              outlook. The model demonstrates an accuracy rate of
              <strong>
                {#if isSubscribed}
                  {data?.getAIScore?.accuracy
                    ? data?.getAIScore?.accuracy + "%"
                    : "n/a"}
                {:else}
                  <a
                    href="/pricing"
                    class="sm:hover:text-default dark:sm:hover:text-blue-400 text-sm"
                  >
                    Upgrade <svg
                      class="w-4 h-4 mb-1 inline-block"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                      />
                    </svg>
                  </a>
                {/if}
              </strong>
              based on historical backtesting. Following this AI Score methodology,
              the average return would be
              <strong
                class={avgReturn >= 0 && isSubscribed
                  ? "text-green-800 dark:text-[#00FC50]"
                  : avgReturn < 0 && isSubscribed
                    ? "text-red-800 dark:text-[#FF2F1F]"
                    : ""}
              >
                {#if isSubscribed}
                  {avgReturn >= 0 ? "+" : ""}{avgReturn?.toFixed(2)}%
                {:else}
                  <a
                    href="/pricing"
                    class="sm:hover:text-default dark:sm:hover:text-blue-400 text-sm"
                  >
                    Upgrade <svg
                      class="w-4 h-4 mb-1 inline-block"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                      />
                    </svg>
                  </a>
                {/if}
              </strong>. The current forecast suggests
              <strong>
                {#if isSubscribed}
                  {data?.getAIScore?.score > 6
                    ? "positive momentum"
                    : data?.getAIScore?.score < 5
                      ? "potential downside risk"
                      : "sideways movement"}
                {:else}
                  <a
                    href="/pricing"
                    class="sm:hover:text-default dark:sm:hover:text-blue-400 text-sm"
                  >
                    Upgrade <svg
                      class="w-4 h-4 mb-1 inline-block"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                      />
                    </svg>
                  </a>
                {/if}
              </strong>
              for the stock's near-term performance.
            </p>

            <div class="w-full mb-10 mt-3">
              <div class="mt-4">
                <div class="grow">
                  <div class="relative">
                    <!-- Apply the blur class to the chart -->
                    {#if config}
                      <div
                        class="{!isSubscribed
                          ? 'blur-[3px]'
                          : ''} mt-5 shadow sm:mt-0 sm:border sm:border-gray-300 dark:border-gray-800 rounded"
                        use:highcharts={configScore}
                      ></div>
                    {/if}
                    <!-- Overlay with "Upgrade to Pro" -->
                    {#if !isSubscribed}
                      <div
                        class="font-bold text-lg sm:text-xl absolute top-0 bottom-0 left-0 right-0 flex items-center justify-center text-muted dark:text-white"
                      >
                        <a
                          href="/pricing"
                          class="sm:hover:text-default dark:sm:hover:text-white dark:text-white flex flex-row items-center"
                        >
                          <span>Upgrade</span>
                          <svg
                            class="ml-1 w-5 h-5 sm:w-6 sm:h-6 inline-block"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            ><path
                              fill="currentColor"
                              d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                            /></svg
                          >
                        </a>
                      </div>
                    {/if}
                  </div>

                  <div
                    class=" mb-1 mt-2 overflow-x-auto px-1.5 text-center md:mb-0 md:px-0 lg:mt-5"
                  >
                    <table
                      class="table table-sm table-compact w-full text-right text-tiny xs:text-sm"
                    >
                      <thead>
                        <tr
                          class="border-b border-gray-300 dark:border-gray-600 font-normal text-sm sm:text-[1rem] whitespace-nowrap"
                        >
                          <th
                            class="py-[3px] text-left font-semibold lg:py-0.5 text-muted dark:text-white"
                          >
                            Date
                          </th>
                          {#each tableDates as item}
                            <th
                              class="py-[3px] text-left font-semibold lg:py-0.5 text-muted dark:text-white"
                            >
                              {item}
                            </th>
                          {/each}
                        </tr>
                      </thead>
                      <tbody>
                        <!-- Score Row -->
                        <tr
                          class="border-b border-gray-300 dark:border-gray-600 font-normal text-sm sm:text-[1rem] whitespace-nowrap"
                        >
                          <td class="py-[3px] text-left lg:py-0.5 text-[1rem]"
                            >Score</td
                          >
                          {#each tableScore as val, index}
                            <td
                              class="text-right whitespace-nowrap text-[1rem]"
                            >
                              {#if isSubscribed}
                                {val}
                                {[10, 9, 8, 7].includes(Number(val))
                                  ? "(Bullish)"
                                  : [6, 5, 4].includes(Number(val))
                                    ? "(Hold)"
                                    : "(Sell)"}
                              {:else}
                                <a
                                  href="/pricing"
                                  class="sm:hover:text-default dark:sm:hover:text-blue-400 text-sm"
                                >
                                  Upgrade
                                  <svg
                                    class="w-4 h-4 mb-1 inline-block"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      fill="currentColor"
                                      d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                    />
                                  </svg>
                                </a>
                              {/if}
                            </td>
                          {/each}
                        </tr>

                        <tr
                          class="font-normal text-sm sm:text-[1rem] whitespace-nowrap"
                        >
                          <td class="py-[3px] text-left lg:py-0.5 text-[1rem]"
                            >Price</td
                          >
                          {#each tableQuarterChange as item, index}
                            <td class="text-[1rem]">
                              {#if isSubscribed}
                                {item?.price && item?.price !== null
                                  ? "$" + item?.price
                                  : "n/a"}
                              {:else}
                                <a
                                  href="/pricing"
                                  class="text-sm sm:hover:text-default dark:sm:hover:text-blue-400"
                                >
                                  Upgrade
                                  <svg
                                    class="w-4 h-4 mb-1 inline-block"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      fill="currentColor"
                                      d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                    />
                                  </svg>
                                </a>
                              {/if}
                            </td>
                          {/each}
                        </tr>

                        <!-- QoQ Change Row -->
                        <tr
                          class="font-normal text-sm sm:text-[1rem] whitespace-nowrap"
                        >
                          <td class="py-[3px] text-left lg:py-0.5 text-[1rem]"
                            >% Change</td
                          >
                          {#each tableQuarterChange as item, index}
                            <td class="text-[1rem]">
                              {#if isSubscribed}
                                <span
                                  class={item?.change > 0
                                    ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
                                    : "text-red-800 dark:text-[#FF2F1F]"}
                                >
                                  {item?.change && item?.change !== null
                                    ? item?.change + "%"
                                    : "n/a"}
                                </span>
                              {:else}
                                <a
                                  href="/pricing"
                                  class="text-sm sm:hover:text-default dark:sm:hover:text-blue-400"
                                >
                                  Upgrade
                                  <svg
                                    class="w-4 h-4 mb-1 inline-block"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      fill="currentColor"
                                      d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                    />
                                  </svg>
                                </a>
                              {/if}
                            </td>
                          {/each}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          {/if}

          {#if Object?.keys(data?.getPriceAnalysis)?.length > 0}
            <div class="">
              <h1 class="text-xl sm:text-2xl font-bold">
                {removeCompanyStrings($displayCompanyName)} Trend Forecast
              </h1>
            </div>
            <div class="w-full mb-6 mt-3">
              <p class="mt-4">
                Using our AI model trained on historical seasonal data, we
                generated a 12-month forecast for {removeCompanyStrings(
                  $displayCompanyName,
                )}. The model predicts a median target price of
                <strong>
                  {#if isSubscribed}
                    ${medianPriceTarget}
                  {:else}
                    <a
                      href="/pricing"
                      class="sm:hover:text-default dark:sm:hover:text-blue-400 text-sm"
                    >
                      Upgrade <svg
                        class="w-4 h-4 mb-1 inline-block"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                        />
                      </svg>
                    </a>
                  {/if}
                </strong>, ranging from
                <strong>
                  {#if isSubscribed}
                    ${lowPriceTarget}
                  {:else}
                    <a
                      href="/pricing"
                      class="sm:hover:text-default dark:sm:hover:text-blue-400 text-sm"
                    >
                      Upgrade <svg
                        class="w-4 h-4 mb-1 inline-block"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                        />
                      </svg>
                    </a>
                  {/if}
                </strong>
                to
                <strong>
                  {#if isSubscribed}
                    ${highPriceTarget}
                  {:else}
                    <a
                      href="/pricing"
                      class="sm:hover:text-default dark:sm:hover:text-blue-400 text-sm"
                    >
                      Upgrade <svg
                        class="w-4 h-4 mb-1 inline-block"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                        />
                      </svg>
                    </a>
                  {/if}
                </strong>, indicating a
                <strong
                  class={medianChange >= 0 && isSubscribed
                    ? "text-green-800 dark:text-[#00FC50]"
                    : medianChange < 0 && isSubscribed
                      ? "text-red-800 dark:text-[#FF2F1F]"
                      : ""}
                >
                  {#if isSubscribed}
                    {medianChange > 0
                      ? "potential increase"
                      : "potential decrease"} of {medianChange >= 0
                      ? "+"
                      : ""}{medianChange}%
                  {:else}
                    <a
                      href="/pricing"
                      class="sm:hover:text-default dark:sm:hover:text-blue-400 text-sm"
                    >
                      Upgrade <svg
                        class="w-4 h-4 mb-1 inline-block"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                        />
                      </svg>
                    </a>
                  {/if}
                </strong>
                from the current price of
                <strong>
                  {#if isSubscribed}
                    ${price}
                  {:else}
                    <a
                      href="/pricing"
                      class="sm:hover:text-default dark:sm:hover:text-blue-400 text-sm"
                    >
                      Upgrade <svg
                        class="w-4 h-4 mb-1 inline-block"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                        />
                      </svg>
                    </a>
                  {/if}
                </strong>. This forecast is based on comprehensive analysis of
                seasonal patterns, market trends, and historical performance
                data to provide insights into the stock's potential trajectory
                over the next twelve months.
              </p>

              <div>
                <div class="grow pt-5">
                  <div class="relative">
                    <!-- Apply the blur class to the chart -->
                    {#if config}
                      <div
                        class="{!isSubscribed
                          ? 'blur-[3px]'
                          : ''} mt-5 shadow sm:mt-0 sm:border sm:border-gray-300 dark:border-gray-800 rounded"
                        use:highcharts={config}
                      ></div>
                    {/if}
                    <!-- Overlay with "Upgrade to Pro" -->
                    {#if !isSubscribed}
                      <div
                        class="font-bold text-lg sm:text-xl absolute top-0 bottom-0 left-0 right-0 flex items-center justify-center text-muted dark:text-white"
                      >
                        <a
                          href="/pricing"
                          class="sm:hover:text-default dark:sm:hover:text-white dark:text-white flex flex-row items-center"
                        >
                          <span>Upgrade</span>
                          <svg
                            class="ml-1 w-5 h-5 sm:w-6 sm:h-6 inline-block"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            ><path
                              fill="currentColor"
                              d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                            /></svg
                          >
                        </a>
                      </div>
                    {/if}
                  </div>

                  <div
                    class=" mb-1 mt-2 overflow-x-auto px-1.5 text-center md:mb-0 md:px-0 lg:mt-5"
                  >
                    <table class="w-full text-right text-tiny xs:text-sm">
                      <thead
                        ><tr
                          class="border-b border-gray-300 dark:border-gray-600 font-normal text-sm sm:text-[1rem]"
                          ><th
                            class="py-[3px] text-left font-semibold lg:py-0.5"
                            >Target</th
                          > <th class="font-semibold">Low</th>
                          <th class="font-semibold">Average</th>
                          <th class="font-semibold">Median</th>
                          <th class="font-semibold">High</th></tr
                        ></thead
                      >
                      <tbody
                        ><tr
                          class="border-b border-gray-300 dark:border-gray-600 font-normal text-sm sm:text-[1rem]"
                        >
                          <td class="py-[3px] text-left lg:py-0.5">Price</td>
                          {#if !isSubscribed}
                            <td class="whitespace-nowrap">
                              <a
                                href="/pricing"
                                class="sm:hover:text-default dark:sm:hover:text-blue-400 text-sm"
                                >Upgrade <svg
                                  class="w-4 h-4 mb-1 inline-block"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                  />
                                </svg></a
                              >
                            </td>
                            <td class="whitespace-nowrap">
                              <a
                                href="/pricing"
                                class="sm:hover:text-default dark:sm:hover:text-blue-400 text-sm"
                                >Upgrade <svg
                                  class="w-4 h-4 mb-1 inline-block"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                  />
                                </svg></a
                              >
                            </td>
                            <td class="whitespace-nowrap">
                              <a
                                href="/pricing"
                                class="sm:hover:text-default dark:sm:hover:text-blue-400 text-sm"
                                >Upgrade <svg
                                  class="w-4 h-4 mb-1 inline-block"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                  />
                                </svg></a
                              >
                            </td>
                            <td class="whitespace-nowrap">
                              <a
                                href="/pricing"
                                class="sm:hover:text-default dark:sm:hover:text-blue-400 text-sm"
                                >Upgrade <svg
                                  class="w-4 h-4 mb-1 inline-block"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                  />
                                </svg></a
                              >
                            </td>
                          {:else}
                            <td>${lowPriceTarget}</td>
                            <td>${avgPriceTarget}</td>
                            <td>${medianPriceTarget}</td>
                            <td>${highPriceTarget}</td>
                          {/if}
                        </tr>

                        <tr class="text-sm text-gray-600 dark:text-zinc-300">
                          <td class="py-[3px] text-left lg:py-0.5">% Change</td>
                          {#if !isSubscribed}
                            <td class="whitespace-nowrap">
                              <a
                                href="/pricing"
                                class="sm:hover:text-default dark:sm:hover:text-blue-400 text-sm"
                              >
                                Upgrade
                                <svg
                                  class="w-4 h-4 mb-1 inline-block"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                  />
                                </svg>
                              </a>
                            </td>
                            <td class="whitespace-nowrap"
                              ><a
                                href="/pricing"
                                class="sm:hover:text-default dark:sm:hover:text-blue-400 text-sm"
                                >Upgrade <svg
                                  class="w-4 h-4 mb-1 inline-block"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                  />
                                </svg></a
                              ></td
                            >
                            <td class="whitespace-nowrap"
                              ><a
                                href="/pricing"
                                class="sm:hover:text-default dark:sm:hover:text-blue-400 text-sm"
                                >Upgrade <svg
                                  class="w-4 h-4 mb-1 inline-block"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                  />
                                </svg></a
                              ></td
                            >
                            <td class="whitespace-nowrap"
                              ><a
                                href="/pricing"
                                class="sm:hover:text-default dark:sm:hover:text-blue-400 text-sm"
                                >Upgrade <svg
                                  class="w-4 h-4 mb-1 inline-block"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                  />
                                </svg></a
                              ></td
                            >
                          {:else}
                            <td
                              class={lowChange > 0
                                ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
                                : "text-red-800 dark:text-[#FF2F1F]"}
                              >{lowChange}%</td
                            >
                            <td
                              class={avgChange > 0
                                ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
                                : "text-red-800 dark:text-[#FF2F1F]"}
                              >{avgChange}%</td
                            >
                            <td
                              class={medianChange > 0
                                ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
                                : "text-red-800 dark:text-[#FF2F1F]"}
                              >{medianChange}%</td
                            >
                            <td
                              class={highChange > 0
                                ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
                                : "text-red-800 dark:text-[#FF2F1F]"}
                              >{highChange}%</td
                            >
                          {/if}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          {:else}
            <Infobox text="No AI Price Forecast available right now" />
          {/if}
        </div>
      </main>
    </div>
  </div>
</section>

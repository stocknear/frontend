<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import Tutorial from "$lib/components/Tutorial.svelte";

  export let data;

  let rawData = data?.getData?.history || [];
  let earningsData = data?.getData?.stats || {};

  // Calculate metrics
  function calculateMetrics(data) {
    if (!data || data.length === 0)
      return { avgPriceImpact: 0, volatilityImpact: 0 };

    const nextDayChanges = data
      ?.map((item) => item?.forward_2_days_change_percent)
      ?.filter((change) => change !== undefined);

    // Average price impact
    const avgPriceImpact =
      nextDayChanges?.reduce((sum, change) => sum + change, 0) /
      nextDayChanges?.length;

    // Volatility impact (average absolute range)
    const volatilityImpact =
      data?.reduce((sum, item) => {
        if (item?.high && item?.low && item?.close) {
          const range = ((item.high - item.low) / item.close) * 100;
          return sum + range;
        }
        return sum;
      }, 0) / data?.length;

    return {
      avgPriceImpact: avgPriceImpact?.toFixed(1),
      volatilityImpact: volatilityImpact?.toFixed(1),
    };
  }

  const metrics = calculateMetrics(rawData);

  function checkTime(timeString) {
    if (!timeString) {
      return "-"; // Return "-" if timeString is undefined or null
    }

    const [hours, minutes, seconds] = timeString.split(":").map(Number);

    // Convert the time to total seconds for easy comparison
    const totalSeconds = hours * 3600 + minutes * 60 + (seconds || 0);

    // Define the reference times in seconds
    const amcStart = 16 * 3600; // 16:00:00
    const bmcEnd = 9 * 3600 + 30 * 60; // 9:30:00

    if (totalSeconds >= amcStart) {
      return "AMC";
    } else if (totalSeconds < bmcEnd) {
      return "BMC";
    } else {
      return "-"; // Optional: if the time is in between
    }
  }

  let steps = [
    {
      popover: {
        title: "Price Reaction",
        description:
          "This dashboard tracks how a stock's price historically responded to earnings announcements. Traders use this data to anticipate potential price movements and volatility when positioning around future earnings reports.",
        side: "center",
        align: "center",
      },
    },
    {
      element: ".eps-beats-driver",
      popover: {
        title: "EPS Beats Estimate",
        description:
          "Shows how often EPS has topped analyst estimates. Companies with a history of consistent EPS beats tend to carry positive momentum into the next release—traders often anticipate another beat, which can drive the stock higher if actual results align with expectations.",
        side: "left",
        align: "start",
      },
    },
    {
      element: ".revenue-beats-driver",
      popover: {
        title: "Revenue Beats Estimate",
        description:
          "Shows how often revenue has topped analyst estimates. A strong beat history signals underlying business strength and can raise odds of another surprise on the next report—dual beats (EPS + revenue) typically amplify bullish market reactions.",
        side: "bottom",
        align: "start",
      },
    },

    {
      element: ".avg-price-impact-driver",
      popover: {
        title: "Average Price Impact",
        description:
          "This represents the typical price change following earnings announcements. While modest, the consistent positive direction suggests the market generally rewards this company's results.",
        side: "right",
        align: "start",
      },
    },
    {
      element: ".volatility-impact-driver",
      popover: {
        title: "Volatility Impact",
        description:
          "This measures the typical price swing magnitude around earnings. Options traders use this to calibrate strike prices and straddle/strangle strategies, while stock traders should prepare for significant moves.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: ".historical-data-driver",
      popover: {
        title: "Historical Earnings Table",
        description:
          "This table breaks down price action before, during, and after specific earnings reports. Note the variation between open and close prices on report days, plus the frequent reversals in subsequent days, suggesting initial reactions often overshoot.",
        side: "center",
        align: "center",
      },
    },
    {
      element: ".rsi-iv-driver",
      popover: {
        title: "RSI & IV Indicators",
        description:
          "RSI (Relative Strength Index) and IV (Implied Volatility) provide context about momentum and expected movement. Higher IV indicates the market anticipates larger moves, useful for options strategy selection.",
        side: "right",
        align: "start",
      },
    },
    {
      element: ".rsi-iv-driver",
      popover: {
        title: "Pre-Earnings Price Action",
        description:
          "The -3, -2, and -1 day columns show consistent patterns before announcements. Note how prices often move significantly before the actual report, suggesting positioning by informed traders or anticipatory momentum.",
        side: "center",
        align: "center",
      },
    },
    {
      element: ".rsi-iv-driver",
      popover: {
        title: "Report Day Trading",
        description:
          "Open, High, Low, Close columns reveal intraday volatility on report days. Note the wide ranges representing intraday swings, critical information for swing traders planning entries and exits.",
        side: "center",
        align: "center",
      },
    },
    {
      element: ".rsi-iv-driver",
      popover: {
        title: "Post-Earnings Price Action",
        description:
          "The +1, +2, +3 days and +/-1 Week columns show how initial reactions often reverse. For example, the Feb 2025 report shows an initial -8.48% close, followed by +3.97%, then -8.69%, revealing multi-day trading opportunities beyond the announcement.",
        side: "center",
        align: "center",
      },
    },
    {
      popover: {
        title: "You're All Set!",
        description:
          "You've now understand the key earnings-related metrics and how they influence stock price reactions. Use these insights to craft smarter strategies, anticipate volatility and trade with greater knowledge compared to everyone else. Happy investing!",
        side: "center",
        align: "center",
      },
    },
  ];
</script>

<SEO
  title={`Price Reaction ${$displayCompanyName} (${$stockTicker})`}
  description={`Analyze the historical price reaction of ${$displayCompanyName} (${$stockTicker}) following earnings releases to understand market trends and investor sentiment.`}
/>

<section class=" w-full overflow-hidden min-h-screen h-full">
  <div class="w-full flex justify-center w-full sm-auto h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <main class="w-full">
        <div class="sm:pl-7 sm:pt-7 sm:pb-7 m-auto mt-2 sm:mt-0">
          <div class="w-full flex flex-col sm:flex-row justify-between mb-3">
            <h1 class="text-xl sm:text-2xl font-bold mb-3 sm:mb-0">
              Price Reaction to Earnings Reports
            </h1>
            <Tutorial {steps} />
          </div>

          {#if rawData?.length > 0}
            <div
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
            >
              <div
                class="eps-beats-driver shadow-md bg-gray-200 dark:bg-[#1C1E22] rounded p-4"
              >
                <div class=" text-sm mb-2 flex items-center">
                  <span>EPS Beats Estimate</span>
                </div>
                <div class="flex items-baseline">
                  <span class="text-2xl font-bold"
                    >{earningsData.positiveEpsPercent}%</span
                  >
                  <div class="flex flex-col ml-2">
                    <span class="text-sm"
                      >{`${earningsData?.positiveEpsSurprises}/${earningsData?.totalReports}`}
                      quarters</span
                    >
                    <span
                      class="text-xs font-semibold text-violet-700 dark:text-violet-400"
                    >
                      {earningsData?.positiveEpsSurprises >
                      earningsData?.totalReports / 2
                        ? "Above Average"
                        : "Below Average"}
                    </span>
                  </div>
                </div>
              </div>

              <div
                class="revenue-beats-driver shadow-md bg-gray-200 dark:bg-[#1C1E22] rounded p-4"
              >
                <div class=" text-sm mb-2 flex items-center">
                  <span>Revenue Beats Estimate</span>
                </div>
                <div class="flex items-baseline">
                  <span class="text-2xl font-bold"
                    >{earningsData.positiveRevenuePercent}%</span
                  >
                  <div class="flex flex-col ml-2">
                    <span class="text-sm"
                      >{`${earningsData?.positiveRevenueSurprises}/${earningsData?.totalReports}`}
                      quarters</span
                    >
                    <span
                      class="text-xs font-semibold text-red-800 dark:text-red-400"
                    >
                      {earningsData?.positiveRevenueSurprises >
                      earningsData?.totalReports / 2
                        ? "Above Average"
                        : "Below Average"}
                    </span>
                  </div>
                </div>
              </div>

              <div
                class="avg-price-impact-driver shadow-md bg-gray-200 dark:bg-[#1C1E22] rounded p-4"
              >
                <div class=" text-sm mb-2 flex items-center">
                  <span>Avg. Price Impact</span>
                </div>
                <div class="flex items-baseline">
                  <span class="text-2xl font-bold"
                    >{metrics?.avgPriceImpact >= 0
                      ? "+"
                      : ""}{metrics?.avgPriceImpact}%</span
                  >
                  <div class="flex flex-col ml-2">
                    <span class="text-sm">Next Day</span>
                    <span
                      class="text-xs font-semibold {metrics?.avgPriceImpact >= 0
                        ? 'text-green-800 dark:text-green-400'
                        : 'text-red-800 dark:text-red-400'}"
                    >
                      {metrics?.avgPriceImpact >= 0 ? "Positive" : "Negative"} Trend
                    </span>
                  </div>
                </div>
              </div>

              <div
                class="volatility-impact-driver shadow-md bg-gray-200 dark:bg-[#1C1E22] rounded p-4"
              >
                <div class=" text-sm mb-2 flex items-center">
                  <span>Volatility Impact</span>
                </div>
                <div class="flex items-baseline">
                  <span class="text-2xl font-bold"
                    >±{metrics.volatilityImpact}%</span
                  >
                  <div class="flex flex-col ml-2">
                    <span class="text-sm">Range</span>
                    <span
                      class="text-xs font-semibold text-yellow-700 dark:text-yellow-400"
                    >
                      {Number(metrics.volatilityImpact) > 3 ? "High" : "Normal"}
                      Impact
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="mb-5 mt-5 w-full">
              <Infobox
                text="This table provides an overview of how a stock's price historically reacted around earnings reports. It displays key metrics like price changes over specific timeframes and Relative Strength Index (RSI)."
              />
            </div>

            <div class=" w-full overflow-x-auto no-scrollbar">
              <table
                class="table-fixed leading-3 border-separate border-spacing-0 font-sans tabular-nums w-full"
              >
                <thead class="historical-data-driver"
                  ><tr class=" text-sm sm:text-[1rem]"
                    ><th
                      class="w-44 whitespace-nowrap font-normal h-5 text-left px-1"
                      >Report Date</th
                    ><th
                      class="px-4 last:pr-11 w-20 last:w-24.5 whitespace-nowrap font-normal h-5 text-right p-0"
                      >-3 Days</th
                    ><th
                      class="px-4 last:pr-11 w-20 last:w-24.5 whitespace-nowrap font-normal h-5 text-right p-0"
                      >-2 Days</th
                    ><th
                      class="px-4 last:pr-11 w-20 last:w-24.5 whitespace-nowrap font-normal h-5 text-right p-0"
                      >-1 Day</th
                    ><th class="px-0 w-1 whitespace-nowrap font-normal h-5 p-0"
                    ></th><th
                      class="px-4 last:pr-11 w-20 last:w-24.5 whitespace-nowrap font-normal h-5 text-center p-0 font-semibold"
                      >Open</th
                    ><th
                      class="px-4 last:pr-11 w-20 last:w-24.5 whitespace-nowrap font-normal h-5 text-center p-0 font-semibold"
                      >High</th
                    ><th
                      class="px-4 last:pr-11 w-20 last:w-24.5 whitespace-nowrap font-normal h-5 text-center p-0 font-semibold"
                      >Low</th
                    ><th
                      class="px-4 last:pr-11 w-20 last:w-24.5 whitespace-nowrap font-normal h-5 text-center p-0 font-semibold"
                      >Close</th
                    ><th class="px-0 w-1 whitespace-nowrap font-normal h-5 p-0"
                    ></th><th
                      class="px-4 last:pr-11 w-20 last:w-24.5 whitespace-nowrap font-normal h-5 text-right p-0"
                      >+1 Day</th
                    ><th
                      class="px-4 last:pr-11 w-20 last:w-24.5 whitespace-nowrap font-normal h-5 text-right p-0"
                      >+2 Days</th
                    ><th
                      class="px-4 last:pr-11 w-20 last:w-24.5 whitespace-nowrap font-normal h-5 text-right p-0"
                      >+3 Days</th
                    ><th
                      class="px-4 last:pr-11 w-20 last:w-24.5 whitespace-nowrap font-normal h-5 text-right p-0"
                      >+1 Week</th
                    ><th
                      class="px-4 last:pr-11 w-20 last:w-24.5 whitespace-nowrap font-normal h-5 text-right p-0"
                      >-1 Week</th
                    ></tr
                  ></thead
                >
                {#each rawData as item, index}
                  <tbody class="">
                    <tr class="group"
                      ><td
                        class="whitespace-nowrap border-l border-t border-gray-300 dark:border-primary py-0.5 rounded-tl-md px-1"
                        ><div class="flex flex-col items-start w-full">
                          <div
                            class="pr-0.5 mt-2 flex flex-row items-center w-full text-sm"
                          >
                            <div class="">
                              {item?.date !== undefined
                                ? new Date(item?.date)?.toLocaleString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      daySuffix: "2-digit",
                                    },
                                  )
                                : "-"}
                              ({item?.quarter})
                            </div>
                            <div class="ml-1 text-end w-full">
                              {checkTime(item?.time)}
                            </div>
                          </div>

                          <div class=" text-xs -mt-2 invisible">
                            {item?.quarter}
                            {item?.year}
                          </div>
                        </div></td
                      ><td
                        class="border-gray-300 dark:border-primary px-3.5 py-0.5 border-t border-l px-4 last:pr-11 w-17 last:w-24.5 px-1 text-right"
                        ><span class=" text-sm sm:text-[1rem]"
                          >{item?.backward_2_days_close?.toFixed(2)}</span
                        ></td
                      ><td
                        class="border-gray-300 dark:border-primary px-3.5 py-0.5 border-t border-l px-4 last:pr-11 w-17 last:w-24.5 px-1 text-right"
                        ><span class=" text-sm sm:text-[1rem]"
                          >{item?.backward_1_days_close?.toFixed(2)}</span
                        ></td
                      ><td
                        class="border-gray-300 dark:border-primary px-3.5 py-0.5 border-t border-l rounded-tr-md px-4 last:pr-11 w-17 last:w-24.5 border-r px-1 text-right"
                        ><span class=" text-sm sm:text-[1rem]"
                          >{item?.forward_0_days_close?.toFixed(2)}</span
                        ></td
                      ><td
                        class="border-gray-300 dark:border-primary px-3.5 py-0.5 px-4 last:pr-11 w-17 last:w-24.5 px-1"
                      ></td><td
                        class="border-gray-300 dark:border-primary px-3.5 py-0.5 border-t border-l px-4 last:pr-11 w-17 last:w-24.5 dark:border-l-gray-800 px-1 text-right"
                        ><span class=" text-sm sm:text-[1rem]"
                          >{item?.open ? item?.open?.toFixed(2) : "-"}</span
                        ></td
                      ><td
                        class="border-gray-300 dark:border-primary px-3.5 py-0.5 border-t border-l border-r px-4 last:pr-11 w-17 last:w-24.5 px-1 text-right"
                        ><span class=" text-sm sm:text-[1rem]"
                          >{item?.high ? item?.high?.toFixed(2) : "-"}</span
                        ></td
                      ><td
                        class="border-gray-300 dark:border-primary px-3.5 py-0.5 border-t border-l border-r px-4 last:pr-11 w-17 last:w-24.5 px-1 text-right"
                        ><span class=" text-sm sm:text-[1rem]"
                          >{item?.low ? item?.low?.toFixed(2) : "-"}</span
                        ></td
                      ><td
                        class="border-gray-300 dark:border-primary px-3.5 py-0.5 border-t border-r dark:border-r-gray-800 px-4 last:pr-11 w-17 last:w-24.5 px-1 text-right"
                        ><span class=" text-sm sm:text-[1rem]"
                          >{item?.close ? item?.close?.toFixed(2) : "-"}</span
                        ></td
                      ><td
                        class="border-gray-300 dark:border-primary px-3.5 py-0.5 px-4 last:pr-11 w-17 last:w-24.5 px-1"
                      ></td><td
                        class="border-gray-300 dark:border-primary px-3.5 py-0.5 border-t border-l rounded-tl-md px-4 last:pr-11 w-17 last:w-24.5 border-l px-1 text-right"
                        ><span class=" text-sm sm:text-[1rem]"
                          >{item?.forward_2_days_close !== undefined
                            ? item?.forward_2_days_close?.toFixed(2)
                            : "-"}</span
                        ></td
                      ><td
                        class="border-gray-300 dark:border-primary px-3.5 py-0.5 border-t border-l px-4 last:pr-11 w-17 last:w-24.5 px-1 text-right"
                        ><span class=" text-sm sm:text-[1rem]"
                          >{item?.forward_3_days_close !== undefined
                            ? item?.forward_3_days_close?.toFixed(2)
                            : "-"}</span
                        ></td
                      ><td
                        class="border-gray-300 dark:border-primary border-t border-l border-r px-3.5 py-0.5 px-4 last:pr-11 w-17 last:w-24.5 px-1 text-right"
                        ><span class=" text-sm sm:text-[1rem]"
                          >{item?.forward_4_days_close !== undefined
                            ? item?.forward_4_days_close?.toFixed(2)
                            : "-"}</span
                        ></td
                      ><td
                        class="border-gray-300 dark:border-primary px-3.5 py-0.5 border-t border-r px-4 last:pr-11 w-17 last:w-24.5 px-1 text-right"
                        ><span class=" text-sm sm:text-[1rem]"
                          >{item?.forward_6_days_close !== undefined
                            ? item?.forward_6_days_close?.toFixed(2)
                            : "-"}</span
                        ></td
                      ><td
                        class="border-gray-300 dark:border-primary px-3.5 py-0.5 border-t border-r px-4 last:pr-11 w-17 last:w-24.5 px-1 text-right"
                        ><span class=" text-sm sm:text-[1rem]"
                          >{item?.backward_4_days_close
                            ? item?.backward_4_days_close?.toFixed(2)
                            : "-"}</span
                        ></td
                      ></tr
                    >
                    <tr
                      class="group rsi-iv-driver {index + 1 ===
                        rawData?.length &&
                      !['Pro', 'Plus']?.includes(data?.user?.tier)
                        ? 'opacity-[0.1]'
                        : ''}"
                      ><td
                        class="border-l border-gray-300 dark:border-primary pl-1 text-muted dark:text-gray-200 text-sm px-1"
                        ><div class="flex w-full justify-between">
                          <div class="flex items-center">
                            <div class="mr-1 font-semibold">IV:</div>
                            <div
                              class="leading-3 w-full whitespace-nowrap font-semibold"
                            >
                              {item?.iv ?? "-"}
                            </div>
                          </div>

                          <div class="flex items-center">
                            <div class="mr-1 font-semibold">RSI:</div>
                            <div
                              class="leading-3 w-full whitespace-nowrap font-semibold"
                            >
                              {item?.rsi ?? "-"}
                            </div>
                          </div>

                          <div>% Change</div>
                        </div></td
                      ><td
                        class="px-4 last:pr-11 w-17 last:w-24.5 border-gray-300 dark:border-primary px-3.5 py-0.5 border-l px-1 text-right"
                        ><span
                          class="w-full text-sm sm:text-[1rem] items-baseline justify-end whitespace-nowrap {item?.backward_2_days_change_percent >=
                          0
                            ? "text-green-800 dark:text-positive before:content-['+']"
                            : 'text-red-800 dark:text-negative'}"
                          >{item?.backward_2_days_change_percent}%<span
                            class="w-0 text-center"
                          ></span></span
                        ></td
                      ><td
                        class="px-4 last:pr-11 w-17 last:w-24.5 border-gray-300 dark:border-primary px-3.5 py-0.5 border-l border-r px-1 text-right"
                        ><span
                          class="w-full text-sm sm:text-[1rem] items-baseline justify-end whitespace-nowrap {item?.backward_1_days_change_percent >=
                          0
                            ? "text-green-800 dark:text-positive before:content-['+']"
                            : 'text-red-800 dark:text-negative'}"
                          >{item?.backward_1_days_change_percent?.toFixed(
                            2,
                          )}%<span class="w-0 text-center"></span></span
                        ></td
                      ><td
                        class="px-4 last:pr-11 w-17 last:w-24.5 border-gray-300 dark:border-primary px-3.5 py-0.5 border-l border-r px-1 text-right"
                        ><span
                          class="w-full text-sm sm:text-[1rem] items-baseline justify-end whitespace-nowrap {item?.backward_1_days_change_percent >=
                          0
                            ? "text-green-800 dark:text-positive before:content-['+']"
                            : 'text-red-800 dark:text-negative'}"
                          >{item?.backward_1_days_change_percent?.toFixed(
                            2,
                          )}%<span class="w-0 text-center"></span></span
                        ></td
                      ><td
                        class="px-4 last:pr-11 w-17 last:w-24.5 border border-gray-300 dark:border-primary px-3.5 py-0.5 px-1 text-right"
                      ></td><td
                        class="px-4 last:pr-11 w-17 last:w-24.5 border-gray-300 dark:border-primary px-3.5 py-0.5 dark:border-l-gray-800 px-1 text-right"
                        ><div
                          class="text-center w-full whitespace-nowrap rounded text-sm sm:text-[1rem] {item?.open_change_percent &&
                          item?.open_change_percent >= 0
                            ? "bg-positive/60 before:content-['+'] "
                            : item?.open_change_percent < 0
                              ? 'bg-negative/70 '
                              : ''}"
                        >
                          {item?.open_change_percent
                            ? item?.open_change_percent?.toFixed(2) + "%"
                            : "-"}
                        </div></td
                      ><td
                        class="px-4 last:pr-11 w-17 last:w-24.5 px-3.5 py-0.5 px-1 text-right border-l border-r border-gray-300 dark:border-primary"
                        ><div
                          class="text-center w-full whitespace-nowrap rounded text-sm sm:text-[1rem] {item?.high_change_percent &&
                          item?.high_change_percent >= 0
                            ? "bg-positive/60 before:content-['+'] "
                            : item?.high_change_percent < 0
                              ? 'bg-negative/70 '
                              : ''}"
                        >
                          {item?.high_change_percent
                            ? item?.high_change_percent?.toFixed(2) + "%"
                            : "-"}
                        </div></td
                      ><td
                        class="px-4 last:pr-11 w-17 last:w-24.5 border-gray-300 px-3.5 py-0.5 px-1 text-right border-l border-r border-gray-300 dark:border-primary"
                        ><div
                          class="text-center w-full whitespace-nowrap rounded text-sm sm:text-[1rem] {item?.low_change_percent &&
                          item?.low_change_percent >= 0
                            ? "bg-positive/60 before:content-['+'] "
                            : item?.low_change_percent
                              ? 'bg-negative/70 '
                              : ''}"
                        >
                          {item?.low_change_percent
                            ? item?.low_change_percent?.toFixed(2) + "%"
                            : "-"}
                        </div></td
                      ><td
                        class="px-4 last:pr-11 w-17 last:w-24.5 border-r border-gray-300 dark:border-gray-800 px-3.5 py-0.5 px-1 text-right"
                        ><div
                          class="text-center w-full whitespace-nowrap rounded text-sm sm:text-[1rem] {item?.close_change_percent &&
                          item?.close_change_percent >= 0
                            ? "bg-positive/60 before:content-['+']  "
                            : item?.close_change_percent < 0
                              ? 'bg-negative/70 '
                              : ''}"
                        >
                          {item?.close_change_percent
                            ? item?.close_change_percent?.toFixed(2) + "%"
                            : "-"}
                        </div></td
                      ><td
                        class="px-4 last:pr-11 w-17 last:w-24.5 border-gray-300 dark:border-primary px-3.5 py-0.5 px-1 text-right"
                      ></td><td
                        class="px-4 last:pr-11 w-17 last:w-24.5 border-gray-300 dark:border-primary px-3.5 py-0.5 border-l border-r px-1 text-right"
                        ><span
                          class="w-full text-sm sm:text-[1rem] items-baseline justify-end whitespace-nowrap {item?.forward_2_days_change_percent >=
                          0
                            ? "text-green-800 dark:text-positive before:content-['+']"
                            : item?.forward_2_days_change_percent < 0
                              ? 'text-red-800 dark:text-negative'
                              : ''}"
                          >{item?.forward_2_days_change_percent !== undefined
                            ? item?.forward_2_days_change_percent + "%"
                            : "-"}<span class="w-0 text-center"></span></span
                        ></td
                      ><td
                        class="px-4 last:pr-11 w-17 last:w-24.5 border-l border-r border-gray-300 dark:border-primary px-3.5 py-0.5 px-1 text-right"
                        ><span
                          class="w-full text-sm sm:text-[1rem] items-baseline justify-end whitespace-nowrap {item?.forward_3_days_change_percent >=
                          0
                            ? "text-green-800 dark:text-positive before:content-['+']"
                            : item?.forward_3_days_change_percent < 0
                              ? 'text-red-800 dark:text-negative'
                              : ''}"
                          >{item?.forward_3_days_change_percent !== undefined
                            ? item?.forward_3_days_change_percent + "%"
                            : "-"}<span class="w-0 text-center"></span></span
                        ></td
                      ><td
                        class="px-4 last:pr-11 w-17 last:w-24.5 border-gray-300 dark:border-primary px-3.5 py-0.5 px-1 text-right"
                        ><span
                          class="w-full text-sm sm:text-[1rem] items-baseline justify-end whitespace-nowrap {item?.forward_4_days_change_percent >=
                          0
                            ? "text-green-800 dark:text-positive before:content-['+']"
                            : item?.forward_4_days_change_percent < 0
                              ? 'text-red-800 dark:text-negative'
                              : ''}"
                          >{item?.forward_4_days_change_percent !== undefined
                            ? item?.forward_4_days_change_percent + "%"
                            : "-"}<span class="w-0 text-center"></span></span
                        ></td
                      ><td
                        class="px-4 last:pr-11 w-17 last:w-24.5 border-gray-300 dark:border-primary px-3.5 py-0.5 border-l px-1 text-right"
                        ><span
                          class="w-full text-sm sm:text-[1rem] items-baseline justify-end whitespace-nowrap {item?.forward_6_days_change_percent >=
                          0
                            ? "text-green-800 dark:text-positive before:content-['+']"
                            : item?.forward_6_days_change_percent < 0
                              ? 'text-red-800 dark:text-negative'
                              : ''}"
                          >{item?.forward_6_days_change_percent !== undefined
                            ? item?.forward_6_days_change_percent + "%"
                            : "-"}<span class="w-0 text-center"></span></span
                        ></td
                      ><td
                        class="px-4 last:pr-11 w-17 last:w-24.5 border-gray-300 dark:border-primary px-3.5 py-0.5 border-l border-r px-1 text-right"
                        ><span
                          class="w-full text-sm sm:text-[1rem] items-baseline justify-end whitespace-nowrap {item?.backward_4_days_change_percent >=
                          0
                            ? "text-green-800 dark:text-positive before:content-['+']"
                            : 'text-red-800 dark:text-negative'}"
                          >{item?.backward_4_days_change_percent?.toFixed(
                            2,
                          )}%<span class="w-0 text-center"></span></span
                        ></td
                      ></tr
                    >
                  </tbody>
                {/each}
                <tfoot
                  ><tr
                    ><td colspan="15" class="pt-3 px-1 leading-tight text-sm"
                      >Daily change and RSI 14 are based on the report date for
                      BMO releases and the following day for AMC releases.</td
                    ></tr
                  ></tfoot
                >
              </table>
            </div>
            <UpgradeToPro {data} />
          {:else}
            <Infobox text="No data available" />
          {/if}
        </div>
      </main>
    </div>
  </div>
</section>

<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
  import Infobox from "$lib/components/Infobox.svelte";
  import FailToDeliver from "$lib/components/FailToDeliver.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import Tutorial from "$lib/components/Tutorial.svelte";

  export let data;

  let rawData = data?.getData || [];
  let originalData = data?.getData || [];

  let changePercentageYearAgo = 0;
  let relativeFTD =
    data?.getStockQuote?.avgVolume > 0
      ? (
          (rawData?.slice(-1)?.at(0)?.failToDeliver /
            data?.getStockQuote?.avgVolume) *
          100
        )?.toFixed(2)
      : "n/a";

  function computeYearOverYearChange(originalData) {
    if (originalData?.length < 2) {
      return null; // Not enough originalData to compute change
    }

    // Step 1: Get the last entry in the list
    const lastEntry = originalData[originalData?.length - 1];
    const lastDate = new Date(lastEntry?.date);
    const lastValue = originalData?.slice(-1)?.at(0)?.failToDeliver;

    // Step 2: Find the entry closest to one year before the last date
    let closestEntry = null;
    for (let i = originalData.length - 2; i >= 0; i--) {
      const entryDate = new Date(originalData[i]?.date);
      const oneYearAgo = new Date(lastDate);
      oneYearAgo.setFullYear(lastDate.getFullYear() - 1);

      // Check if the entry is close to one year ago
      if (entryDate <= oneYearAgo) {
        closestEntry = originalData[i];
        break;
      }
    }

    if (!closestEntry) {
      return null; // No suitable entry found for comparison
    }

    const prevValue = closestEntry?.failToDeliver;

    // Step 3: Calculate the percentage change
    const change = ((lastValue - prevValue) / prevValue) * 100;

    return change;
  }

  changePercentageYearAgo = computeYearOverYearChange(originalData);

  let steps = [
    {
      popover: {
        title: "Fail‑To‑Deliver (FTD)",
        description: `This dashboard shows total fail-to-deliver shares, their ratio to average volume, and how these metrics have trended over the past year. Traders use this data to assess potential settlement issues. High FTD shares or a high FTD/volume ratio may indicate problems with short selling or clearing inefficiencies, while low values typically suggest a healthier trading environment.`,
        side: "center",
        align: "center",
      },
    },
    {
      element: ".ftd-total-driver",
      popover: {
        title: "Total FTD Shares",
        description: `The company’s total fail-to-deliver shares this month is ${abbreviateNumber(
          rawData?.slice(-1)?.at(0)?.failToDeliver,
          false,
        )}. Elevated totals can point to significant clearing or delivery issues for the stock.`,
        side: "left",
        align: "start",
      },
    },
    {
      element: ".ftd-ratio-driver",
      popover: {
        title: "FTD / Avg. Volume",
        description: `Shows failed deliveries as a percentage of the stock’s average daily volume. Higher ratios may indicate increased settlement risk or short selling activity.`,
        side: "bottom",
        align: "start",
      },
    },
    {
      element: ".oneYearChange-driver",
      popover: {
        title: "1‑Year Change",
        description: `Shows how FTD shares have moved in the last year. A sharp decline reflects improved delivery efficiency, while an increase may raise concerns for traders.`,
        side: "right",
        align: "start",
      },
    },
    {
      element: ".chart-driver",
      popover: {
        title: "FTD Over Time",
        description:
          "This chart displays fail-to-deliver shares and the stock price over time, highlighting spikes that may correspond to settlement failures, short squeezes, or other unusual trading behavior.",
        side: "right",
        align: "start",
      },
    },
    {
      element: ".history-driver",
      popover: {
        title: "FTD History Table",
        description:
          "Browse the historical table of FTD shares and % change alongside stock prices to spot patterns and correlations that may inform trading decisions.",
        side: "right",
        align: "start",
      },
    },
    {
      element: ".timeframe-toggle-driver",
      popover: {
        title: "Adjust Timeframe",
        description:
          "Switch between monthly and quarterly views to zoom in on shorter or longer-term FTD trends.",
        side: "bottom",
        align: "start",
      },
    },
    {
      popover: {
        title: "You’re All Set!",
        description:
          "Now you know how to interpret FTD metrics and apply these insights to your trading strategies. Happy investing!",
        side: "center",
        align: "center",
      },
    },
  ];
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Fail-to-Deliver Shares`}
  description={`Historical Fail-to-Deliver shares of ${$displayCompanyName}.`}
/>

<section class=" w-full overflow-hidden h-full">
  <div class="w-full flex justify-center w-full sm-auto h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <main class="w-full">
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 m-auto mt-2 sm:mt-0">
          <div
            class="w-full flex flex-col items-start sm:items-center sm:flex-row justify-between mb-3"
          >
            <h1 class="text-xl sm:text-2xl font-bold">
              {removeCompanyStrings($displayCompanyName)} Fail-to-Deliver
            </h1>
            <Tutorial {steps} />
          </div>

          {#if rawData?.length > 0}
            <div
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4"
            >
              <div
                class="ftd-total-driver shadow-md bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
              >
                <div class=" text-sm mb-2 flex items-center">
                  <span>Total FTD Shares</span>
                </div>
                <div class="flex items-baseline">
                  <span class="text-xl font-bold">
                    {abbreviateNumber(
                      rawData?.slice(-1)?.at(0)?.failToDeliver,
                      false,
                    )}</span
                  >
                  <div class="flex flex-col ml-2">
                    <span class="text-sm text-violet-600 dark:text-violet-400">
                      {rawData?.slice(-1)?.at(0)?.failToDeliver > 1e5
                        ? "Above Average"
                        : "Below Average"}
                    </span>
                  </div>
                </div>
              </div>

              <div
                class="ftd-ratio-driver shadow-md bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
              >
                <div class=" text-sm mb-2 flex items-center">
                  <span>FTD / Avg. Volume</span>
                </div>
                <div class="flex items-baseline">
                  <span class="text-xl font-bold"
                    >{relativeFTD > 0.01
                      ? relativeFTD + "%"
                      : relativeFTD !== "n/a"
                        ? "< 0.01%"
                        : "n/a"}</span
                  >
                  <div class="flex flex-col ml-2">
                    <span class="text-sm text-red-800 dark:text-red-400">
                      {relativeFTD > 20 ? "High Impact" : "Low Impact"}
                    </span>
                  </div>
                </div>
              </div>

              <div
                class="oneYearChange-driver shadow-md bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
              >
                <div class=" text-sm mb-2 flex items-center">
                  <span>1-Year Change</span>
                </div>
                <div class="flex items-baseline">
                  <span class="text-xl font-bold"
                    >{changePercentageYearAgo
                      ? changePercentageYearAgo > 100
                        ? "> 100%"
                        : changePercentageYearAgo?.toFixed(1) + "%"
                      : "n/a"}</span
                  >
                  <div class="flex flex-col ml-2">
                    <span
                      class="text-sm {changePercentageYearAgo
                        ? changePercentageYearAgo >= 0
                          ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
                          : changePercentageYearAgo < 0
                            ? 'text-red-800 dark:text-[#FF2F1F]'
                            : ''
                        : ''}"
                    >
                      {changePercentageYearAgo
                        ? changePercentageYearAgo >= 0
                          ? "Positive Trend"
                          : "Negative Trend"
                        : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-2">
              <FailToDeliver {data} {rawData} />
            </div>
          {:else}
            <Infobox text="No data available" />
          {/if}
        </div>
      </main>
    </div>
  </div>
</section>

<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
  import Infobox from "$lib/components/Infobox.svelte";
  import FailToDeliver from "$lib/components/FailToDeliver.svelte";
  import SEO from "$lib/components/SEO.svelte";

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
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Fail-to-Deliver (FTD) Analysis | Settlement Risk & Short Interest`}
  description={`Comprehensive fail-to-deliver (FTD) analysis for ${$displayCompanyName} (${$stockTicker}). Track settlement failures, delivery issues, and potential short squeeze indicators with historical FTD data and volume ratios for informed trading decisions.`}
  keywords={`${$stockTicker} fail to deliver, ${$displayCompanyName} FTD analysis, settlement failures, delivery issues, ${$stockTicker} FTD shares, short squeeze indicators, settlement risk analysis, fail to deliver data, FTD volume ratio`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/statistics/fail-to-deliver`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "Dataset"],
    name: `${$displayCompanyName} Fail-to-Deliver Analysis`,
    description: `Professional fail-to-deliver tracking and analysis for ${$displayCompanyName} (${$stockTicker})`,
    url: `https://stocknear.com/stocks/${$stockTicker}/statistics/fail-to-deliver`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Fail-to-deliver tracking",
      "FTD volume ratio analysis",
      "Settlement risk assessment",
      "Historical FTD trends",
      "Short squeeze indicators",
      "Delivery failure patterns",
      "Clearing efficiency metrics",
      "Market structure analysis",
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
      name: "Fail-to-Deliver Analysis",
      description:
        "Professional analysis of settlement failures and delivery issues in stock trading",
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
          <div
            class="w-full flex flex-col items-start sm:items-center sm:flex-row justify-between mb-3"
          >
            <h1 class="text-xl sm:text-2xl font-bold">
              SEC Fail-to-Deliver Shares
            </h1>
          </div>

          {#if rawData?.length > 0}
            <div
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4"
            >
              <div
                class="ftd-total-driver shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
              >
                <div class=" text-sm mb-2 flex items-center">
                  <span>Total FTD Shares</span>
                </div>
                <div class="flex items-baseline">
                  <span class="text-xl font-bold">
                    {abbreviateNumber(
                      rawData?.slice(-1)?.at(0)?.failToDeliver,
                    )}</span
                  >
                  <div class="flex flex-col ml-2">
                    <span class="text-sm">
                      {rawData?.slice(-1)?.at(0)?.failToDeliver > 1e5
                        ? "Above Average"
                        : "Below Average"}
                    </span>
                  </div>
                </div>
              </div>

              <div
                class="ftd-ratio-driver shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
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
                    <span class="text-sm">
                      {relativeFTD > 20 ? "High Impact" : "Low Impact"}
                    </span>
                  </div>
                </div>
              </div>

              <div
                class="oneYearChange-driver shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
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
                    <span class="text-sm">
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

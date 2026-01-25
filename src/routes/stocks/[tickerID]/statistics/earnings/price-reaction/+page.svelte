<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import * as m from "$lib/paraglide/messages";

  export let data;

  let rawData = data?.getData?.history || [];
  let earningsData = data?.getData?.stats || {};
  let isSubscribed = ["Plus", "Pro"]?.includes(data?.user?.tier);

  // Calculate metrics
  function calculateMetrics(data) {
    if (!data || data.length === 0)
      return { avgPriceImpact: 0, volatilityImpact: 0 };

    const nextDayChanges = data
      ?.map((item) => item?.forward_1_days_change_percent)
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
    const bmoEnd = 9 * 3600 + 30 * 60; // 9:30:00

    if (totalSeconds >= amcStart) {
      return "AMC";
    } else if (totalSeconds < bmoEnd) {
      return "BMO";
    } else {
      return "-"; // Optional: if the time is in between
    }
  }
</script>

<SEO
  title={m.stock_detail_stats_price_reaction_seo_title({ company: $displayCompanyName, ticker: $stockTicker })}
  description={m.stock_detail_stats_price_reaction_seo_description({ company: $displayCompanyName, ticker: $stockTicker })}
  keywords={m.stock_detail_stats_price_reaction_seo_keywords({ company: $displayCompanyName, ticker: $stockTicker })}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/statistics/price-reaction`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataAnalysis"],
    name: m.stock_detail_stats_price_reaction_structured_name({ company: $displayCompanyName }),
    description: m.stock_detail_stats_price_reaction_structured_desc({ company: $displayCompanyName, ticker: $stockTicker }),
    url: `https://stocknear.com/stocks/${$stockTicker}/statistics/price-reaction`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Earnings price reaction analysis",
      "Historical volatility tracking",
      "EPS beat rate analysis",
      "Revenue surprise tracking",
      "Post-earnings drift analysis",
      "Pre-earnings price action",
      "Volatility impact assessment",
      "Earnings trading insights",
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
      name: "Earnings Price Reaction Analysis",
      description:
        "Professional analysis of stock price reactions to earnings announcements and surprises",
    },
  }}
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
              {m.stock_detail_stats_price_reaction_title()}
            </h1>
          </div>

          <div class="mb-5 mt-5 w-full">
            <Infobox
              text={m.stock_detail_stats_price_reaction_info()}
            />
          </div>

          {#if rawData?.length > 0}
            <div
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
            >
              <div
                class="eps-beats-driver shadow-none bg-white/70 dark:bg-zinc-950/40 border border-gray-300 shadow dark:border-zinc-700 rounded-2xl p-4"
              >
                <div class=" text-sm mb-2 flex items-center">
                  <span>{m.stock_detail_stats_eps_beats_estimate()}</span>
                </div>
                <div class="flex items-baseline">
                  {#if isSubscribed}
                    <span class="text-2xl font-bold"
                      >{earningsData.positiveEpsPercent}%</span
                    >
                  {:else}
                    <a
                      href="/pricing"
                      class="text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400"
                    >
                      <svg
                        class="size-6 mb-1 inline-block"
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
                  <div class="flex flex-col ml-2">
                    {#if isSubscribed}
                      <span class="text-sm"
                        >{`${earningsData?.positiveEpsSurprises}/${earningsData?.totalReports}`}
                        {m.stock_detail_stats_quarters()}</span
                      >
                    {:else}
                      <span class="text-sm">
                        <svg
                          class="size-3.5 mb-1 inline-block"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="currentColor"
                            d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                          />
                        </svg>{`/${earningsData?.totalReports}`}
                        {m.stock_detail_stats_quarters()}</span
                      >
                    {/if}
                    <span class="text-xs font-semibold">
                      {earningsData?.positiveEpsSurprises >
                      earningsData?.totalReports / 2
                        ? m.stock_detail_stats_above_average()
                        : m.stock_detail_stats_below_average()}
                    </span>
                  </div>
                </div>
              </div>

              <div
                class="revenue-beats-driver shadow-none bg-white/70 dark:bg-zinc-950/40 border border-gray-300 shadow dark:border-zinc-700 rounded-2xl p-4"
              >
                <div class=" text-sm mb-2 flex items-center">
                  <span>{m.stock_detail_stats_revenue_beats_estimate()}</span>
                </div>
                <div class="flex items-baseline">
                  {#if isSubscribed}
                    <span class="text-2xl font-bold"
                      >{earningsData.positiveRevenuePercent}%</span
                    >
                  {:else}
                    <a
                      href="/pricing"
                      class="text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400"
                    >
                      <svg
                        class="size-6 mb-1 inline-block"
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
                  <div class="flex flex-col ml-2">
                    {#if isSubscribed}
                      <span class="text-sm"
                        >{`${earningsData?.positiveRevenueSurprises}/${earningsData?.totalReports}`}
                        {m.stock_detail_stats_quarters()}</span
                      >
                    {:else}
                      <span class="text-sm">
                        <svg
                          class="size-3.5 mb-1 inline-block"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="currentColor"
                            d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                          />
                        </svg>{`/${earningsData?.totalReports}`}
                        {m.stock_detail_stats_quarters()}</span
                      >
                    {/if}
                    <span class="text-xs font-semibold">
                      {earningsData?.positiveRevenueSurprises >
                      earningsData?.totalReports / 2
                        ? m.stock_detail_stats_above_average()
                        : m.stock_detail_stats_below_average()}
                    </span>
                  </div>
                </div>
              </div>

              <div
                class="avg-price-impact-driver shadow-none bg-white/70 dark:bg-zinc-950/40 border border-gray-300 shadow dark:border-zinc-700 rounded-2xl p-4"
              >
                <div class=" text-sm mb-2 flex items-center">
                  <span>{m.stock_detail_stats_avg_price_impact()}</span>
                </div>
                <div class="flex items-baseline">
                  {#if isSubscribed}
                    <span class="text-2xl font-bold"
                      >{metrics?.avgPriceImpact >= 0
                        ? "+"
                        : ""}{metrics?.avgPriceImpact}%</span
                    >
                  {:else}
                    <a
                      href="/pricing"
                      class="text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400"
                    >
                      <svg
                        class="size-6 mb-1 inline-block"
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
                  <div class="flex flex-col ml-2">
                    {#if isSubscribed}
                      <span class="text-sm">{m.stock_detail_stats_next_day()}</span>
                      <span class="text-xs font-semibold">
                        {metrics?.avgPriceImpact >= 0 ? m.stock_detail_stats_positive_trend() : m.stock_detail_stats_negative_trend()}
                      </span>
                    {:else}
                      <span class="text-sm">{m.stock_detail_stats_next_day()}</span>
                      <span class="text-xs font-semibold">
                        {metrics?.avgPriceImpact >= 0 ? m.stock_detail_stats_positive_trend() : m.stock_detail_stats_negative_trend()}
                      </span>
                    {/if}
                  </div>
                </div>
              </div>

              <div
                class="volatility-impact-driver shadow-none bg-white/70 dark:bg-zinc-950/40 border border-gray-300 shadow dark:border-zinc-700 rounded-2xl p-4"
              >
                <div class=" text-sm mb-2 flex items-center">
                  <span>{m.stock_detail_stats_volatility_impact()}</span>
                </div>
                <div class="flex items-baseline">
                  {#if isSubscribed}
                    <span class="text-2xl font-bold"
                      >±{metrics.volatilityImpact}%</span
                    >
                  {:else}
                    <a
                      href="/pricing"
                      class="text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400"
                    >
                      <svg
                        class="size-6 mb-1 inline-block"
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
                  <div class="flex flex-col ml-2">
                    {#if isSubscribed}
                      <span class="text-sm">{m.stock_detail_stats_range()}</span>
                      <span class="text-xs font-semibold">
                        {Number(metrics.volatilityImpact) > 3
                          ? m.stock_detail_stats_high_impact()
                          : m.stock_detail_stats_low_impact()}
                      </span>
                    {:else}
                      <span class="text-sm">{m.stock_detail_stats_range()}</span>
                      <span class="text-xs font-semibold">
                        {Number(metrics.volatilityImpact) > 3
                          ? m.stock_detail_stats_high_impact()
                          : m.stock_detail_stats_low_impact()}
                      </span>
                    {/if}
                  </div>
                </div>
              </div>
            </div>

            <div class=" w-full overflow-x-auto">
              <table
                class="earnings-table table-fixed leading-3 border-collapse border border-gray-300 shadow dark:border-zinc-700 font-sans tabular-nums w-full"
              >
                <thead class="historical-data-driver"
                  ><tr class=" text-sm"
                    ><th
                      class="w-36 whitespace-nowrap font-normal h-5 text-left px-1"
                      >{m.stock_detail_stats_report_date()}</th
                    ><th
                      class="px-4 last:pr-11 w-20 last:w-24.5 whitespace-nowrap font-normal h-5 text-right p-0"
                      >-1 Week</th
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
                    ></tr
                  ></thead
                >
                {#each rawData as item, index}
                  <tbody class="">
                    <tr class="group"
                      ><td
                        class="whitespace-nowrap border-l border-t border-gray-300 dark:border-zinc-700 py-0.5 rounded-tl-md px-1"
                        ><div class="flex flex-col items-start w-fit">
                          <div
                            class="pl-0.5 pr-0.5 mt-2 flex flex-row items-center w-fit text-sm"
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
                                      timeZone: "UTC",
                                    },
                                  )
                                : "-"}
                              ({item?.quarter})
                            </div>
                          </div>
                        </div></td
                      ><td
                        class="border-gray-300 dark:border-zinc-700 px-3.5 py-0.5 border-t border-l px-4 last:pr-11 w-17 last:w-24.5 px-1 text-right"
                        ><span class=" text-sm"
                          >{item?.backward_4_days_close
                            ? item?.backward_4_days_close?.toFixed(2)
                            : "-"}</span
                        ></td
                      ><td
                        class="border-gray-300 dark:border-zinc-700 px-3.5 py-0.5 border-t border-l px-4 last:pr-11 w-17 last:w-24.5 px-1 text-right"
                        ><span class=" text-sm"
                          >{item?.backward_3_days_close?.toFixed(2)}</span
                        ></td
                      ><td
                        class="border-gray-300 dark:border-zinc-700 px-3.5 py-0.5 border-t border-l px-4 last:pr-11 w-17 last:w-24.5 px-1 text-right"
                        ><span class=" text-sm"
                          >{item?.backward_2_days_close?.toFixed(2)}</span
                        ></td
                      ><td
                        class="border-gray-300 dark:border-zinc-700 px-3.5 py-0.5 border-t border-l rounded-tr-md px-4 last:pr-11 w-17 last:w-24.5 border-r px-1 text-right"
                        ><span class=" text-sm"
                          >{item?.backward_1_days_close?.toFixed(2)}</span
                        ></td
                      ><td
                        class="border-gray-300 dark:border-zinc-700 px-3.5 py-0.5 px-4 last:pr-11 w-17 last:w-24.5 px-1"
                      ></td><td
                        class="border-gray-300 dark:border-zinc-700 px-3.5 py-0.5 border-t border-l px-4 last:pr-11 w-17 last:w-24.5 dark:border-l-gray-800 px-1 text-center"
                        ><span class=" text-sm"
                          >{item?.open ? item?.open?.toFixed(2) : "-"}</span
                        ></td
                      ><td
                        class="border-gray-300 dark:border-zinc-700 px-3.5 py-0.5 border-t border-l border-r px-4 last:pr-11 w-17 last:w-24.5 px-1 text-center"
                        ><span class=" text-sm"
                          >{item?.high ? item?.high?.toFixed(2) : "-"}</span
                        ></td
                      ><td
                        class="border-gray-300 dark:border-zinc-700 px-3.5 py-0.5 border-t border-l border-r px-4 last:pr-11 w-17 last:w-24.5 px-1 text-center"
                        ><span class=" text-sm"
                          >{item?.low ? item?.low?.toFixed(2) : "-"}</span
                        ></td
                      ><td
                        class="border-gray-300 dark:border-zinc-700 px-3.5 py-0.5 border-t border-r dark:border-r-gray-800 px-4 last:pr-11 w-17 last:w-24.5 px-1 text-center"
                        ><span class=" text-sm"
                          >{item?.close ? item?.close?.toFixed(2) : "-"}</span
                        ></td
                      ><td
                        class="border-gray-300 dark:border-zinc-700 px-3.5 py-0.5 px-4 last:pr-11 w-17 last:w-24.5 px-1"
                      ></td><td
                        class="border-gray-300 dark:border-zinc-700 px-3.5 py-0.5 border-t border-l rounded-tl-md px-4 last:pr-11 w-17 last:w-24.5 border-l px-1 text-center"
                        ><span class=" text-sm"
                          >{item?.forward_1_days_close !== undefined
                            ? item?.forward_1_days_close?.toFixed(2)
                            : "-"}</span
                        ></td
                      ><td
                        class="border-gray-300 dark:border-zinc-700 px-3.5 py-0.5 border-t border-l px-4 last:pr-11 w-17 last:w-24.5 px-1 text-center"
                        ><span class=" text-sm"
                          >{item?.forward_2_days_close !== undefined
                            ? item?.forward_2_days_close?.toFixed(2)
                            : "-"}</span
                        ></td
                      ><td
                        class="border-gray-300 dark:border-zinc-700 border-t border-l border-r px-3.5 py-0.5 px-4 last:pr-11 w-17 last:w-24.5 px-1 text-center"
                        ><span class=" text-sm"
                          >{item?.forward_3_days_close !== undefined
                            ? item?.forward_3_days_close?.toFixed(2)
                            : "-"}</span
                        ></td
                      ><td
                        class="border-gray-300 dark:border-zinc-700 px-3.5 py-0.5 border-t border-r px-4 last:pr-11 w-17 last:w-24.5 px-1 text-center"
                        ><span class=" text-sm"
                          >{item?.forward_6_days_close !== undefined
                            ? item?.forward_6_days_close?.toFixed(2)
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
                    >
                      <td
                        class="border-l border-gray-300 dark:border-zinc-700 mt-auto text-xs text-gray-600 dark:text-zinc-300"
                      >
                        <div
                          class="grid grid-cols-2 items-center justify-center pl-0.5 pr-0.5 w-full m-auto text-center"
                        >
                          <!-- IV -->
                          <!--
                          <div class="flex items-center pl-1">
                            <div class="font-semibold mr-1">IV:</div>
                            <div class="font-semibold">{item?.iv ?? "-"}</div>
                          </div>
                          -->

                          <!-- RSI -->
                          <div class="flex items-center ml-1.5">
                            <div class="font-semibold mr-1">RSI:</div>
                            <div class="font-semibold">{item?.rsi ?? "-"}</div>
                          </div>

                          <!-- Time -->
                          <div class="flex items-center justify-end">
                            <div class="font-semibold mr-1">{m.stock_detail_stats_release()}:</div>

                            <div class="font-semibold mr-1.5">
                              {checkTime(item?.time) ?? "-"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td
                        class="px-4 last:pr-11 w-17 last:w-24.5 border-gray-300 dark:border-zinc-700 px-3.5 py-0.5 border-l px-1 text-right"
                        ><span
                          class="w-full text-sm items-baseline justify-end whitespace-nowrap {item?.backward_4_days_change_percent >=
                          0
                            ? "text-green-800 dark:text-positive before:content-['+']"
                            : 'text-red-800 dark:text-negative'}"
                          >{item?.backward_4_days_change_percent !== undefined
                            ? item?.backward_4_days_change_percent?.toFixed(2) +
                              "%"
                            : "-"}<span class="w-0 text-center"></span></span
                        ></td
                      ><td
                        class="px-4 last:pr-11 w-17 last:w-24.5 border-gray-300 dark:border-zinc-700 px-3.5 py-0.5 border-l px-1 text-right"
                        ><span
                          class="w-full text-sm items-baseline justify-end whitespace-nowrap {item?.backward_3_days_change_percent >=
                          0
                            ? "text-green-800 dark:text-positive before:content-['+']"
                            : 'text-red-800 dark:text-negative'}"
                          >{item?.backward_3_days_change_percent}%<span
                            class="w-0 text-center"
                          ></span></span
                        ></td
                      ><td
                        class="px-4 last:pr-11 w-17 last:w-24.5 border-gray-300 dark:border-zinc-700 px-3.5 py-0.5 border-l border-r px-1 text-right"
                        ><span
                          class="w-full text-sm items-baseline justify-end whitespace-nowrap {item?.backward_2_days_change_percent >=
                          0
                            ? "text-green-800 dark:text-positive before:content-['+']"
                            : 'text-red-800 dark:text-negative'}"
                          >{item?.backward_2_days_change_percent?.toFixed(
                            2,
                          )}%<span class="w-0 text-center"></span></span
                        ></td
                      ><td
                        class="px-4 last:pr-11 w-17 last:w-24.5 border-gray-300 dark:border-zinc-700 px-3.5 py-0.5 border-l border-r px-1 text-right"
                        ><span
                          class="w-full text-sm items-baseline justify-end whitespace-nowrap {item?.backward_1_days_change_percent >=
                          0
                            ? "text-green-800 dark:text-positive before:content-['+']"
                            : 'text-red-800 dark:text-negative'}"
                          >{item?.backward_1_days_change_percent?.toFixed(
                            2,
                          )}%<span class="w-0 text-center"></span></span
                        ></td
                      ><td
                        class="px-4 last:pr-11 w-17 last:w-24.5 border border-gray-300 shadow dark:border-zinc-700 px-3.5 py-0.5 px-1 text-center"
                      ></td><td
                        class="px-4 last:pr-11 w-17 last:w-24.5 border-gray-300 dark:border-zinc-700 px-3.5 py-0.5 dark:border-l-gray-800 px-1 text-center"
                        ><div
                          class="text-center w-full whitespace-nowrap rounded text-sm {item?.open_change_percent &&
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
                        class="px-4 last:pr-11 w-17 last:w-24.5 px-3.5 py-0.5 px-1 text-center border-l border-r border-gray-300 dark:border-zinc-700"
                        ><div
                          class="text-center w-full whitespace-nowrap rounded text-sm {item?.high_change_percent &&
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
                        class="px-4 last:pr-11 w-17 last:w-24.5 border-gray-200 px-3.5 py-0.5 px-1 text-center border-l border-r border-gray-300 dark:border-zinc-700"
                        ><div
                          class="text-center w-full whitespace-nowrap rounded text-sm {item?.low_change_percent &&
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
                        class="px-4 last:pr-11 w-17 last:w-24.5 border-r border-gray-300 dark:border-zinc-700 px-3.5 py-0.5 px-1 text-center"
                        ><div
                          class="text-center w-full whitespace-nowrap rounded text-sm {item?.close_change_percent &&
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
                        class="px-4 last:pr-11 w-17 last:w-24.5 border-gray-300 dark:border-zinc-700 px-3.5 py-0.5 px-1 text-center"
                      ></td><td
                        class="px-4 last:pr-11 w-17 last:w-24.5 border-gray-300 dark:border-zinc-700 px-3.5 py-0.5 border-l border-r px-1 text-center"
                        ><span
                          class="w-full text-sm items-baseline justify-end whitespace-nowrap {item?.forward_1_days_change_percent >=
                          0
                            ? "text-green-800 dark:text-positive before:content-['+']"
                            : item?.forward_1_days_change_percent < 0
                              ? 'text-red-800 dark:text-negative'
                              : ''}"
                          >{item?.forward_1_days_change_percent !== undefined
                            ? item?.forward_1_days_change_percent + "%"
                            : "-"}<span class="w-0 text-center"></span></span
                        ></td
                      ><td
                        class="px-4 last:pr-11 w-17 last:w-24.5 border-l border-r border-gray-300 dark:border-zinc-700 px-3.5 py-0.5 px-1 text-center"
                        ><span
                          class="w-full text-sm items-baseline justify-end whitespace-nowrap {item?.forward_2_days_change_percent >=
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
                        class="px-4 last:pr-11 w-17 last:w-24.5 border-gray-300 dark:border-zinc-700 px-3.5 py-0.5 px-1 text-center"
                        ><span
                          class="w-full text-sm items-baseline justify-end whitespace-nowrap {item?.forward_3_days_change_percent >=
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
                        class="px-4 last:pr-11 w-17 last:w-24.5 border-gray-300 dark:border-zinc-700 px-3.5 py-0.5 border-r px-1 text-center"
                        ><span
                          class="w-full text-sm items-baseline justify-end whitespace-nowrap {item?.forward_6_days_change_percent >=
                          0
                            ? "text-green-800 dark:text-positive before:content-['+']"
                            : item?.forward_6_days_change_percent < 0
                              ? 'text-red-800 dark:text-negative'
                              : ''}"
                          >{item?.forward_6_days_change_percent !== undefined
                            ? item?.forward_6_days_change_percent + "%"
                            : "-"}<span class="w-0 text-center"></span></span
                        ></td
                      ></tr
                    >
                  </tbody>
                {/each}
              </table>
            </div>
            <UpgradeToPro {data} />
          {:else}
            <Infobox text={m.stock_detail_no_data()} />
          {/if}
        </div>
      </main>
    </div>
  </div>
</section>

<style>
  :global(.earnings-table) {
    border-collapse: collapse;
  }

  :global(.earnings-table th),
  :global(.earnings-table td) {
    border: 1px solid rgb(209 213 219);
  }

  :global(.dark .earnings-table th),
  :global(.dark .earnings-table td) {
    border-color: rgb(31 41 55);
  }

  :global(.earnings-table thead th) {
    border-bottom-width: 1px;
  }

  :global(.earnings-table tbody tr:last-child td) {
    border-bottom-width: 1px;
  }
</style>

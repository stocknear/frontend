<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
  import SEO from "$lib/components/SEO.svelte";
  import { mode } from "mode-watcher";
  import Tutorial from "$lib/components/Tutorial.svelte";

  import { goto } from "$app/navigation";
  import highcharts from "$lib/highcharts.ts";

  import Infobox from "$lib/components/Infobox.svelte";

  export let data;

  let config = null;

  let rawData = data?.getHistoricalRevenue || {};
  let tableList = [];

  const tabs = [
    {
      title: "Annual",
    },
    {
      title: "Quarterly",
    },
  ];
  let activeIdx = 0;
  let timeIdx = 0;

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  const plotTabs = [
    {
      title: "Annual",
    },
    {
      title: "Quarterly",
    },
  ];

  function changeTablePeriod(index) {
    activeIdx = index;
    const rawData = data?.getHistoricalRevenue;
    if (activeIdx === 0) {
      // Clone the array before sorting
      tableList = [...rawData?.annual];
      tableList.sort((a, b) => new Date(b?.date) - new Date(a?.date));
    } else {
      tableList = [...rawData?.quarter];
      tableList.sort((a, b) => new Date(b?.date) - new Date(a?.date));
    }
  }

  async function changeTimePeriod(state) {
    timeIdx = state;

    config = plotData();
    try {
      config.yAxis.labels.formatter = function () {
        return abbreviateNumber(this?.value);
      };
    } catch (e) {
      console.log(e);
    }
  }

  function plotData() {
    let filteredData = [];
    const rawData = data?.getHistoricalRevenue;
    if (timeIdx === 0) {
      // Clone the array before sorting
      filteredData = [...rawData?.annual];
    } else {
      filteredData = [...rawData?.quarter];
    }
    // Sort ascending for plotting
    filteredData.sort((a, b) => new Date(a?.date) - new Date(b?.date));

    const dates = filteredData.map((item) => item?.date);
    const valueList = filteredData.map((item) => item?.revenue);

    const options = {
      credits: {
        enabled: false,
      },
      chart: {
        type: "column",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 360, // Set the maximum height for the chart
        animation: false,
      },
      title: {
        text:
          timeIdx === 0
            ? `<h3 class="mt-3 mb-1">${removeCompanyStrings($displayCompanyName)} Revenue - Annual</h3>`
            : `<h3 class="mt-3 mb-1">${removeCompanyStrings($displayCompanyName)} Revenue - Quarterly</h3>`,
        style: {
          color: $mode === "light" ? "black" : "white",
          // Using inline CSS for margin-top and margin-bottom
        },
        useHTML: true, // Enable HTML to apply custom class styling
      },

      xAxis: {
        categories: dates,
        gridLineWidth: 0,
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
          formatter: function () {
            return timeIdx === 0 ? this?.value?.substring(0, 4) : this?.value;
          },
        },
      },
      yAxis: {
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
        },
        title: { text: null },
        opposite: true,
      },
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 0.8)", // Semi-transparent black
        borderColor: "rgba(255, 255, 255, 0.2)", // Slightly visible white border
        borderWidth: 1,
        style: {
          color: "#fff",
          fontSize: "16px",
          padding: "10px",
        },
        borderRadius: 4,
        formatter: function () {
          // Format the x value to display time in a custom format
          let tooltipContent = `<span class="m-auto text-[1rem] font-[501]">${new Date(
            this?.x,
          ).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}</span><br>`;

          // Loop through each point in the shared tooltip
          this.points.forEach((point) => {
            tooltipContent += `
        <span style="display:inline-block; width:10px; height:10px; background-color:${point.color}; border-radius:50%; margin-right:5px;"></span>
        <span class="font-semibold text-sm">${point.series.name}:</span> 
        <span class="font-normal text-sm">${abbreviateNumber(point.y)}</span><br>`;
          });

          return tooltipContent;
        },
      },

      plotOptions: {
        series: {
          color: $mode === "light" ? "black" : "white",
          animation: false,
          dataLabels: {
            enabled: timeIdx === 0 ? true : false,
            color: $mode === "light" ? "black" : "white",
            style: {
              fontSize: "13px",
              fontWeight: "bold",
            },
            formatter: function () {
              return abbreviateNumber(this?.y);
            },
          },
        },
      },
      legend: {
        enabled: false,
      },
      series: [
        {
          name: "Revenue",
          data: valueList,
          color: $mode === "light" ? "#2C6288" : "white",
        },
      ],
    };

    return options;
  }

  let steps = [
    {
      popover: {
        title: "Revenue",
        description: `This dashboard shows total revenue, revenue growth, and related efficiency and valuation metrics, plus their historical trends. Traders use these to gauge top-line strength: strong or rising revenue growth signals healthy demand and momentum, while declines can flag weakening fundamentals.`,
        side: "center",
        align: "center",
      },
    },
    {
      element: ".revenue-ttm-driver",
      popover: {
        title: "Revenue (TTM)",
        description: `Trailing twelve months (TTM) revenue: ${abbreviateNumber(rawData?.revenue, true)}. Aggregates the last four quarters for a normalized view of recent top-line performance. Higher revenue usually correlates with stronger business scale and investor confidence.`,
        side: "left",
        align: "start",
      },
    },
    {
      element: ".revenue-growth-driver",
      popover: {
        title: "Revenue Growth",
        description: `Year-over-year growth = (Current Revenue − Prior Revenue) / Prior Revenue × 100. Here: ${rawData?.growthRevenue}%. High growth (> 20%) often reflects accelerating sales trends, while negative growth can indicate contraction.`,
        side: "bottom",
        align: "start",
      },
    },
    {
      element: ".ps-ratio-driver",
      popover: {
        title: "Price / Sales Ratio",
        description: `Price/Sales is defined as Market Cap / Revenue. A low P/S ratio (< 1) can signal undervaluation relative to peers, while a high ratio (> 5) implies strong market growth expectations or premium valuation.`,
        side: "right",
        align: "start",
      },
    },
    {
      element: ".rev-per-emp-driver",
      popover: {
        title: "Revenue / Employee",
        description: `Revenue per employee = Revenue / Employees. Higher values indicate greater efficiency and productivity, whereas low values may suggest overstaffing or inefficiencies.`,
        side: "bottom",
        align: "start",
      },
    },
    {
      element: ".employees-driver",
      popover: {
        title: "Employees",
        description: `Changes in staffing levels help contextualize shifts in revenue efficiency and per-employee output.`,
        side: "right",
        align: "start",
      },
    },
    {
      element: ".marketCap-driver",
      popover: {
        title: "Market Cap",
        description: `Provides valuation context relative to revenue; compare market cap / revenue multiple versus industry benchmarks.`,
        side: "left",
        align: "start",
      },
    },
    {
      element: ".chart-driver",
      popover: {
        title: "Revenue Over Time",
        description: `Plots revenue by period to reveal trends, seasonality, or inflection points. Look for consistent growth or accelerating curves when making trading decisions.`,
        side: "right",
        align: "start",
      },
    },
    {
      element: ".history-driver",
      popover: {
        title: "Revenue History Table",
        description: `Detailed historical revenue and % change with period end dates. Use this to verify growth consistency or spot volatile swings that could impact stock performance.`,
        side: "right",
        align: "start",
      },
    },
    {
      popover: {
        title: "You’re All Set!",
        description: `Now you understand how each revenue metric is calculated, why they matter, and how high or low values can influence trading decisions. Happy investing!`,
        side: "center",
        align: "center",
      },
    },
  ];

  $: {
    if ($mode) {
      changeTablePeriod(0);
      changeTimePeriod(0);
    }
  }
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Revenue, Sales & Growth Trends`}
  description={`Explore the historical revenue, sales performance, and growth trends of ${$displayCompanyName} (${$stockTicker}). Get in-depth financial insights.`}
/>

<section class="w-full overflow-hidden min-h-screen">
  <div class="w-full flex justify-center w-full sm-auto h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <main class="w-full">
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 m-auto mt-2 sm:mt-0">
          <div class="w-full flex flex-col sm:flex-row justify-between">
            <h1 class="text-xl sm:text-2xl font-bold">
              {removeCompanyStrings($displayCompanyName)} Revenue
            </h1>
            <Tutorial {steps} />
          </div>

          {#if Object?.keys(data?.getHistoricalRevenue)?.length > 0}
            <div class="grid grid-cols-1 gap-2">
              <Infobox
                text={`${removeCompanyStrings($displayCompanyName)} reported an annual revenue of ${abbreviateNumber(rawData?.annual?.at(0)?.revenue, true)}, reflecting a ${rawData?.growthRevenue}% growth. For the quarter ending ${formatDate(rawData?.quarter?.at(0)?.date)}, ${removeCompanyStrings($displayCompanyName)} generated ${abbreviateNumber(rawData?.quarter?.at(0)?.revenue, true)} in revenue.`}
              />

              <div
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 mt-3"
              >
                <div
                  class="revenue-ttm-driver shadow-md bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
                >
                  <div class="text-sm sm:text-[1rem] mb-2 flex items-center">
                    <span>Revenue (ttm)</span>
                  </div>
                  <div class="flex items-baseline">
                    <span class="text-xl font-semibold">
                      {abbreviateNumber(rawData?.revenue, true)}</span
                    >
                  </div>
                </div>

                <div
                  class="revenue-growth-driver shadow-md bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
                >
                  <div class="text-sm sm:text-[1rem] mb-2 flex items-center">
                    <span>Revenue Growth</span>
                  </div>
                  <div class="flex items-baseline">
                    <span class="text-xl font-semibold"
                      >{rawData?.growthRevenue}%</span
                    >
                  </div>
                </div>

                <div
                  class="ps-ratio-driver shadow-md bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
                >
                  <div class="text-sm sm:text-[1rem] mb-2 flex items-center">
                    <span>Price / Sales Ratio</span>
                  </div>
                  <div class="flex items-baseline">
                    <span class="text-xl font-semibold"
                      >{rawData?.priceToSalesRatio}</span
                    >
                  </div>
                </div>

                <div
                  class="rev-per-emp-driver shadow-md bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
                >
                  <div class="text-sm sm:text-[1rem] mb-2 flex items-center">
                    <span>Revenue / Employee </span>
                  </div>
                  <div class="flex items-baseline">
                    <span class="text-xl font-semibold"
                      >{abbreviateNumber(
                        rawData?.revenuePerEmployee,
                        true,
                      )}</span
                    >
                  </div>
                </div>

                <div
                  class="employees-driver shadow-md bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
                >
                  <div class="text-sm sm:text-[1rem] mb-2 flex items-center">
                    <span>Employees </span>
                  </div>
                  <div class="flex items-baseline">
                    <span class="text-xl font-semibold"
                      >{rawData?.employees?.toLocaleString("en-US")}</span
                    >
                  </div>
                </div>
                <div
                  class="marketCap-driver shadow-md bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
                >
                  <div class="text-sm sm:text-[1rem] mb-2 flex items-center">
                    <span>Market Cap </span>
                  </div>
                  <div class="flex items-baseline">
                    <span class="text-xl font-semibold"
                      >{abbreviateNumber(data?.getStockQuote?.marketCap)}</span
                    >
                  </div>
                </div>
              </div>

              <div
                class=" flex flex-col sm:flex-row items-start sm:items-center w-full justify-between"
              >
                <h2 class="text-xl sm:text-2xl font-bold">Revenue Chart</h2>

                <div
                  class="inline-flex justify-center w-full rounded sm:w-auto sm:ml-auto"
                >
                  <div
                    class="bg-default text-white dark:bg-secondary w-full min-w-24 sm:w-fit relative flex flex-wrap items-center justify-center rounded p-1 mt-4"
                  >
                    {#each plotTabs as item, i}
                      <button
                        on:click={() => changeTimePeriod(i)}
                        class="cursor-pointer group relative z-1 rounded-full w-1/2 min-w-24 md:w-auto px-5 py-1 {timeIdx ===
                        i
                          ? 'z-0'
                          : ''} "
                      >
                        {#if timeIdx === i}
                          <div class="absolute inset-0 rounded bg-[#fff]"></div>
                        {/if}
                        <span
                          class="relative text-sm block font-semibold {timeIdx ===
                          i
                            ? 'text-black'
                            : ''}"
                        >
                          {item.title}
                        </span>
                      </button>
                    {/each}
                  </div>
                </div>
              </div>

              <div
                class="chart-driver shadow-xs mt-5 sm:mt-0 border border-gray-300 dark:border-gray-800 rounded"
                use:highcharts={config}
              ></div>

              <div
                class="history-driver mt-5 flex flex-col sm:flex-row items-start sm:items-center w-full justify-between sm:border-y border-gray-300 dark:border-gray-800 sm:pt-2 sm:pb-2"
              >
                <h3 class="text-xl sm:text-2xl font-bold mb-2 sm:mb-0">
                  Revenue History
                </h3>

                <div
                  class="inline-flex justify-center w-full rounded sm:w-auto sm:ml-auto"
                >
                  <div
                    class="bg-default text-white dark:bg-secondary w-full min-w-24 sm:w-fit relative flex flex-wrap items-center justify-center rounded p-1"
                  >
                    {#each tabs as item, i}
                      {#if !["Pro", "Plus"]?.includes(data?.user?.tier) && i > 0}
                        <button
                          on:click={() => goto("/pricing")}
                          class="cursor-pointer group relative z-1 rounded-full w-1/2 min-w-24 md:w-auto px-5 py-1"
                        >
                          <span class="relative text-sm block font-semibold">
                            {item.title}
                            <svg
                              class="inline-block ml-0.5 -mt-1 w-3.5 h-3.5"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              ><path
                                fill="#A3A3A3"
                                d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                              /></svg
                            >
                          </span>
                        </button>
                      {:else}
                        <button
                          on:click={() => changeTablePeriod(i)}
                          class="cursor-pointer group relative z-1 rounded-full w-1/2 min-w-24 md:w-auto px-5 py-1 {activeIdx ===
                          i
                            ? 'z-0'
                            : ''} "
                        >
                          {#if activeIdx === i}
                            <div
                              class="absolute inset-0 rounded bg-[#fff]"
                            ></div>
                          {/if}
                          <span
                            class="relative text-sm block font-semibold whitespace-nowrap {activeIdx ===
                            i
                              ? 'text-black'
                              : ''}"
                          >
                            {item.title}
                          </span>
                        </button>
                      {/if}
                    {/each}
                  </div>
                </div>
              </div>

              <div class="w-full overflow-x-auto">
                <table
                  class="table table-sm table-compact no-scrollbar rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto mt-4"
                >
                  <thead class="bg-default text-white">
                    <tr>
                      <th
                        class=" font-semibold text-start text-sm sm:text-[1rem]"
                        >{activeIdx === 0
                          ? "Fiscal Year End"
                          : "Quarter Ended"}</th
                      >
                      <th class=" font-semibold text-end text-sm sm:text-[1rem]"
                        >Revenue</th
                      >
                      <th class=" font-semibold text-end text-sm sm:text-[1rem]"
                        >% Change</th
                      >
                    </tr>
                  </thead>
                  <tbody>
                    {#each tableList as item, index}
                      <!-- row -->
                      <tr
                        class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
                      >
                        <td class=" text-sm sm:text-[1rem] whitespace-nowrap">
                          {new Date(item?.date)?.toLocaleDateString("en-US", {
                            day: "2-digit", // Include day number
                            month: "short", // Display short month name
                            year: "numeric", // Include year
                          })}
                        </td>

                        <td
                          class=" text-sm sm:text-[1rem] text-right whitespace-nowrap"
                        >
                          {abbreviateNumber(item?.revenue)}
                        </td>

                        <td
                          class=" text-sm sm:text-[1rem] whitespace-nowrap text-end"
                        >
                          {#if index === tableList?.length - 1}
                            n/a
                          {:else if item?.revenue > tableList[index + 1]?.revenue}
                            <span class="text-green-800 dark:text-[#00FC50]">
                              +{(
                                ((item?.revenue -
                                  tableList[index + 1]?.revenue) /
                                  tableList[index + 1]?.revenue) *
                                100
                              )?.toFixed(2)}%
                            </span>
                          {:else if item?.revenue < tableList[index + 1]?.revenue}
                            <span class="text-red-800 dark:text-[#FF2F1F]">
                              -{(
                                Math.abs(
                                  (item?.revenue -
                                    tableList[index + 1]?.revenue) /
                                    tableList[index + 1]?.revenue,
                                ) * 100
                              )?.toFixed(2)}%
                            </span>
                          {:else}
                            n/a
                          {/if}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
              <span class="text-sm mt-2">
                Sources: Historical revenue is based on company filings
                submitted to the U.S. Securities and Exchange Commission (SEC).
                The most recent revenue numbers may be taken from company press
                releases.
              </span>
            </div>
          {:else}
            <Infobox text="No data available" />
          {/if}
        </div>
      </main>
    </div>
  </div>
</section>

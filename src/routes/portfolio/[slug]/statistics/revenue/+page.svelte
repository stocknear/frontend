<script lang="ts">
  import { displayCompanyName, stockTicker, timeFrame } from "$lib/store";
  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
  import SEO from "$lib/components/SEO.svelte";
  import { mode } from "mode-watcher";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";

  import highcharts from "$lib/highcharts.ts";

  import Infobox from "$lib/components/Infobox.svelte";

  export let data;

  let config = null;

  let rawData = data?.getHistoricalRevenue || {};
  let tableList = [];

  $timeFrame = "5Y";
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

  function filterByYears(data) {
    // Find the maximum fiscal year
    const maxYear = Math.max(...data.map((item) => Number(item.fiscalYear)));

    let yearsToKeep;
    if ($timeFrame === "MAX") {
      return data; // Keep everything
    } else if ($timeFrame.endsWith("Y")) {
      yearsToKeep = Number($timeFrame?.replace("Y", ""));
    } else {
      throw new Error("Invalid $timeFrame format. Use '5Y', '10Y', or 'MAX'.");
    }
    return data?.filter(
      (item) => Number(item.fiscalYear) >= maxYear - yearsToKeep + 1,
    );
  }

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC", // Ensure consistent formatting regardless of user's timezone
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
    if (activeIdx === 0) {
      // Clone the array before sorting
      tableList = [...rawData?.annual];
      tableList.sort((a, b) => new Date(b?.date) - new Date(a?.date));
    } else {
      tableList = [...rawData?.quarter];
      tableList.sort((a, b) => new Date(b?.date) - new Date(a?.date));
    }
  }

  tableList = filterByYears(tableList);

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
    filteredData = filterByYears(filteredData);
    // Sort ascending for plotting
    filteredData.sort((a, b) => new Date(a?.date) - new Date(b?.date));

    let categories;
    if (timeIdx === 0) {
      // Annual: Just show fiscal year
      categories = filteredData.map((item) => {
        const shortYear = `${String(item?.fiscalYear).slice(-2)}`;
        return `FY${shortYear}`;
      });
    } else {
      // Quarterly: "Q1 `25" format
      categories = filteredData.map((item) => {
        const shortYear = `'${String(item?.fiscalYear).slice(-2)}`;
        return `${item?.period} ${shortYear}`;
      });
    }

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
        categories,
        gridLineWidth: 0,
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
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
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        style: {
          color: "#fff",
          fontSize: "16px",
          padding: "10px",
        },
        borderRadius: 4,
        formatter: function () {
          // Get the x-axis category label for this point
          const categoryLabel = this.points
            ? this.points[0].series.xAxis.categories[this.points[0].point.index]
            : this.series.xAxis.categories[this.point.index];

          let tooltipContent = `<span class="m-auto text-[1rem] font-[501]">${categoryLabel}</span><br>`;

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
            enabled: timeIdx === 0 && $timeFrame === "5Y" ? true : false,
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

  $: {
    if ($mode || $timeFrame) {
      changeTablePeriod(0);
      changeTimePeriod(0);
    }
  }
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Revenue Analysis | Historical Sales Growth & Trends`}
  description={`Comprehensive revenue analysis for ${$displayCompanyName} (${$stockTicker}). Track historical sales performance, revenue growth trends, quarterly revenue data, and year-over-year comparisons with detailed financial insights and charts.`}
  keywords={`${$stockTicker} revenue analysis, ${$displayCompanyName} sales performance, revenue growth trends, ${$stockTicker} quarterly revenue, historical sales data, revenue growth rate, ${$stockTicker} sales trends, company revenue history`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/statistics/revenue`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "Dataset"],
    name: `${$displayCompanyName} Revenue Analysis`,
    description: `Professional revenue tracking and sales performance analysis for ${$displayCompanyName} (${$stockTicker})`,
    url: `https://stocknear.com/stocks/${$stockTicker}/statistics/revenue`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Historical revenue analysis",
      "Sales growth tracking",
      "Quarterly revenue data",
      "Revenue trend analysis",
      "Year-over-year comparisons",
      "Sales performance metrics",
      "Revenue growth rate calculation",
      "Financial performance charts",
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
      name: "Revenue Analysis",
      description:
        "Professional analysis of company revenue trends and sales performance",
    },
  }}
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
                  class="revenue-ttm-driver shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
                >
                  <div class="text-sm sm:text-[1rem] mb-2 flex items-center">
                    <span>Revenue (ttm)</span>
                  </div>
                  <div class="flex items-baseline">
                    <span class="text-xl font-semibold">
                      {abbreviateNumber(rawData?.revenue)}</span
                    >
                  </div>
                </div>

                <div
                  class="revenue-growth-driver shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
                >
                  <div class="text-sm sm:text-[1rem] mb-2 flex items-center">
                    <span>Revenue Growth</span>
                  </div>
                  <div class="flex items-baseline">
                    <span class="text-xl font-semibold"
                      >{rawData?.growthRevenue
                        ? rawData?.growthRevenue + "%"
                        : "n/a"}</span
                    >
                  </div>
                </div>

                <div
                  class="ps-ratio-driver shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
                >
                  <div class="text-sm sm:text-[1rem] mb-2 flex items-center">
                    <span>Price / Sales Ratio</span>
                  </div>
                  <div class="flex items-baseline">
                    <span class="text-xl font-semibold"
                      >{rawData?.priceToSalesRatio ?? "n/a"}</span
                    >
                  </div>
                </div>

                <div
                  class="rev-per-emp-driver shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
                >
                  <div class="text-sm sm:text-[1rem] mb-2 flex items-center">
                    <span>Revenue / Employee </span>
                  </div>
                  <div class="flex items-baseline">
                    <span class="text-xl font-semibold"
                      >{abbreviateNumber(rawData?.revenuePerEmployee)}</span
                    >
                  </div>
                </div>

                <div
                  class="employees-driver shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
                >
                  <div class="text-sm sm:text-[1rem] mb-2 flex items-center">
                    <span>Employees </span>
                  </div>
                  <div class="flex items-baseline">
                    <span class="text-xl font-semibold"
                      >{rawData?.employees?.toLocaleString("en-US") ??
                        "n/a"}</span
                    >
                  </div>
                </div>
                <div
                  class="marketCap-driver shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
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
                class=" flex flex-col sm:flex-row items-start sm:items-center w-full justify-between border-t border-b border-gray-300 dark:border-gray-800 py-2"
              >
                <h2 class="text-xl sm:text-2xl font-bold">Revenue Chart</h2>
                <div class="sm:ml-auto">
                  <div class="inline-flex mt-2 sm:mt-0">
                    <div class="inline-flex rounded-lg shadow-sm">
                      {#each plotTabs as item, i}
                        <button
                          on:click={() => changeTimePeriod(i)}
                          class="cursor-pointer px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none transition-colors duration-50
                          {i === 0 ? 'rounded-l border' : ''}
                          {i === plotTabs.length - 1
                            ? 'rounded-r border-t border-r border-b'
                            : ''}
                          {i !== 0 && i !== plotTabs.length - 1
                            ? 'border-t border-b'
                            : ''}
                          {timeIdx === i
                            ? 'bg-black dark:bg-white text-white dark:text-black'
                            : 'bg-white  border-gray-300 sm:hover:bg-gray-100 dark:bg-primary dark:border-gray-800'}"
                        >
                          {item.title}
                        </button>
                      {/each}
                    </div>
                  </div>
                  <div class="ml-1 relative inline-block">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild let:builder>
                        <Button
                          builders={[builder]}
                          class="flex-shrink-0  w-full sm:w-fit border border-gray-300 dark:border-gray-800 bg-black sm:hover:bg-default text-white dark:bg-primary dark:sm:hover:bg-secondary ease-out  flex flex-row justify-between items-center px-3 py-1.5  rounded truncate"
                        >
                          <span class="truncate">{$timeFrame}</span>
                          <svg
                            class="-mr-1 ml-1 h-5 w-5 xs:ml-2 inline-block"
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
                        class=" h-fit max-h-72 overflow-y-auto scroller"
                      >
                        <DropdownMenu.Group>
                          <DropdownMenu.Item
                            on:click={() => ($timeFrame = "5Y")}
                            class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                          >
                            5Y
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            on:click={() => ($timeFrame = "10Y")}
                            class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                          >
                            10Y
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            on:click={() => ($timeFrame = "MAX")}
                            class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary flex flex-row items-center"
                          >
                            Max
                          </DropdownMenu.Item>
                        </DropdownMenu.Group>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </div>
                </div>
              </div>

              <div
                class="chart-driver shadow-xs mt-5 sm:mt-0 border border-gray-300 dark:border-gray-800 rounded"
                use:highcharts={config}
              ></div>

              <div
                class="history-driver mt-5 flex flex-row items-center w-full justify-between border-t border-b border-gray-300 dark:border-gray-800 py-2"
              >
                <h3 class="text-xl sm:text-2xl font-bold">History</h3>

                <div class="inline-flex ml-auto">
                  <div class="inline-flex rounded-lg shadow-sm">
                    {#each tabs as item, i}
                      <button
                        on:click={() => changeTablePeriod(i)}
                        class="cursor-pointer px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none transition-colors duration-50
                          {i === 0 ? 'rounded-l border' : ''}
                          {i === tabs.length - 1
                          ? 'rounded-r border-t border-r border-b'
                          : ''}
                          {i !== 0 && i !== tabs.length - 1
                          ? 'border-t border-b'
                          : ''}
                          {activeIdx === i
                          ? 'bg-black dark:bg-white text-white dark:text-black'
                          : 'bg-white  border-gray-300 sm:hover:bg-gray-100 dark:bg-primary dark:border-gray-800'}"
                      >
                        {item.title}
                      </button>
                    {/each}
                  </div>
                </div>
              </div>

              <div class="w-full overflow-x-auto">
                <table
                  class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto mt-4"
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

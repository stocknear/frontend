<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
  import SEO from "$lib/components/SEO.svelte";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";

  import Infobox from "$lib/components/Infobox.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  //import * as XLSX from 'xlsx';
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";

  export let data;

  let rawData = data?.getHistoricalMarketCap || [];
  let tableList = [];
  let changePercentageYearAgo = 0;
  let timePeriod = "3Y";

  const tabs = [
    {
      title: "Annual",
    },
    {
      title: "Quarterly",
    },
  ];
  let activeIdx = 0;

  function getMarketCapCategory(marketCap) {
    const BILLION = 1_000_000_000;
    const MILLION = 1_000_000;

    const marketCapNavigation = [
      {
        threshold: 200 * BILLION,
        name: "Mega-Cap",
        link: "/list/market-cap/mega-cap-stocks",
      },
      {
        minThreshold: 10 * BILLION,
        maxThreshold: 200 * BILLION,
        name: "Large-Cap",
        link: "/list/market-cap/large-cap-stocks",
      },
      {
        minThreshold: 2 * BILLION,
        maxThreshold: 10 * BILLION,
        name: "Mid-Cap",
        link: "/list/market-cap/mid-cap-stocks",
      },
      {
        minThreshold: 300 * MILLION,
        maxThreshold: 2 * BILLION,
        name: "Small-Cap",
        link: "/list/market-cap/small-cap-stocks",
      },
      {
        minThreshold: 50 * MILLION,
        maxThreshold: 300 * MILLION,
        name: "Micro-Cap",
        link: "/list/market-cap/micro-cap-stocks",
      },
      {
        maxThreshold: 50 * MILLION,
        name: "Nano-Cap",
        link: "/list/market-cap/nano-cap-stocks",
      },
    ];

    if (!marketCap) return null;

    // Convert string to number if needed
    const capValue =
      typeof marketCap === "string" ? parseFloat(marketCap) : marketCap;

    return marketCapNavigation.find((category) => {
      if (category.threshold) {
        return capValue >= category.threshold;
      }
      if (category.minThreshold && category.maxThreshold) {
        return (
          capValue >= category.minThreshold && capValue < category.maxThreshold
        );
      }
      if (category.maxThreshold) {
        return capValue < category.maxThreshold;
      }
      return false;
    });
  }

  function computeYearOverYearChange(rawData) {
    if (rawData.length < 2) {
      return null; // Not enough rawData to compute change
    }

    // Step 1: Get the last entry in the list
    const lastEntry = rawData[rawData.length - 1];
    const lastDate = new Date(lastEntry.date);
    const lastMarketCap = data?.getStockQuote?.marketCap;

    // Step 2: Find the entry closest to one year before the last date
    let closestEntry = null;
    for (let i = rawData.length - 2; i >= 0; i--) {
      const entryDate = new Date(rawData[i].date);
      const oneYearAgo = new Date(lastDate);
      oneYearAgo.setFullYear(lastDate.getFullYear() - 1);

      // Check if the entry is close to one year ago
      if (entryDate <= oneYearAgo) {
        closestEntry = rawData[i];
        break;
      }
    }

    if (!closestEntry) {
      return null; // No suitable entry found for comparison
    }

    const previousMarketCap = closestEntry.marketCap;

    // Step 3: Calculate the percentage change
    const change =
      ((lastMarketCap - previousMarketCap) / previousMarketCap) * 100;

    return change;
  }

  function addChangesPercentage(data) {
    // First, sort by date ascending
    const sorted = [...data].sort(
      (a, b) => new Date(b?.date) - new Date(a?.date),
    );

    // Then, calculate changesPercentage compared to next item
    return sorted.map((item, index, arr) => {
      if (index === arr.length - 1) {
        return { ...item, changesPercentage: null };
      }

      const nextMarketCap = arr[index + 1]?.marketCap;
      const pctChange =
        ((item.marketCap - nextMarketCap) / nextMarketCap) * 100;

      return {
        ...item,
        changesPercentage: parseFloat(pctChange?.toFixed(2)),
      };
    });
  }

  function filterEndOfYearDates(data) {
    // Step 1: Group data by year
    const groupedByYear = data.reduce((acc, item) => {
      const year = new Date(item.date).getFullYear();
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(item);
      return acc;
    }, {});

    // Step 2: For each year, find the entry with the latest date
    let annualData = Object.values(groupedByYear).map((yearData) => {
      return yearData.reduce((latest, current) => {
        return new Date(latest.date) > new Date(current.date)
          ? latest
          : current;
      });
    });

    annualData = addChangesPercentage(annualData);

    return annualData;
  }

  function filterEndOfQuarterDates(data) {
    // Step 1: Group data by year and quarter
    const groupedByQuarter = data?.reduce((acc, item) => {
      const date = new Date(item?.date);
      const year = date.getFullYear();
      const quarter = Math?.floor(date?.getMonth() / 3) + 1; // Get the quarter (1-4)

      const key = `${year}-Q${quarter}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});

    // Step 2: For each year-quarter group, find the entry with the latest date
    let quarterlyData = Object?.values(groupedByQuarter)?.map((quarterData) => {
      return quarterData?.reduce((latest, current) => {
        return new Date(latest?.date) > new Date(current?.date)
          ? latest
          : current;
      });
    });

    quarterlyData = addChangesPercentage(quarterlyData);
    return quarterlyData;
  }

  function changeTablePeriod(index) {
    activeIdx = index;
    if (activeIdx === 0) {
      tableList = filterEndOfYearDates(rawData);
    } else {
      tableList = filterEndOfQuarterDates(rawData);
    }

    tableList?.sort((a, b) => new Date(b?.date) - new Date(a?.date));
  }

  tableList = filterEndOfYearDates(rawData);
  tableList?.sort((a, b) => new Date(b?.date) - new Date(a?.date));
  changePercentageYearAgo = computeYearOverYearChange(rawData);

  async function changeStatement(state) {
    timePeriod = state;

    config = plotData();
  }

  function filterDataByTimePeriod(rawData, timePeriod) {
    let dates = [];
    let marketCapList = [];
    let changesPercentageList = [];
    const now = new Date();

    // Calculate the date threshold based on the selected time period
    let thresholdDate;
    switch (timePeriod) {
      case "1M":
        thresholdDate = new Date(now);
        thresholdDate.setMonth(now.getMonth() - 1);
        break;
      case "6M":
        thresholdDate = new Date(now);
        thresholdDate.setMonth(now.getMonth() - 6);
        break;
      case "1Y":
        thresholdDate = new Date(now);
        thresholdDate.setFullYear(now.getFullYear() - 1);
        break;
      case "3Y":
        thresholdDate = new Date(now);
        thresholdDate.setFullYear(now.getFullYear() - 3);
        break;
      case "5Y":
        thresholdDate = new Date(now);
        thresholdDate.setFullYear(now.getFullYear() - 5);
        break;
      case "10Y":
        thresholdDate = new Date(now);
        thresholdDate.setFullYear(now.getFullYear() - 10);
        break;
      case "Max":
      default:
        thresholdDate = new Date(0); // Set to the earliest possible date
        break;
    }

    // Filter the data based on the threshold date
    rawData?.forEach((item) => {
      const itemDate = new Date(item?.date);
      if (itemDate >= thresholdDate) {
        dates?.push(item?.date);
        marketCapList?.push(item?.marketCap);
        changesPercentageList?.push(item?.changesPercentage);
      }
    });

    return { dates, marketCapList, changesPercentageList };
  }

  function plotData() {
    const filteredData = filterDataByTimePeriod(rawData, timePeriod);

    const fillColorStart = "rgb(70, 129, 244,0.5)";
    const fillColorEnd = "rgb(70, 129, 244,0.001)";

    const options = {
      credits: {
        enabled: false,
      },
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 360,
      },
      title: {
        text: `<h3 class="mt-3 mb-1 ">${removeCompanyStrings($displayCompanyName)} Market Cap</h3>`,
        style: {
          color: $mode === "light" ? "black" : "white",
          // Using inline CSS for margin-top and margin-bottom
        },
        useHTML: true, // Enable HTML to apply custom class styling
      },
      xAxis: {
        type: "datetime",
        endOnTick: false,
        categories: filteredData?.dates,
        crosshair: {
          color: $mode === "light" ? "black" : "white", // Set the color of the crosshair line
          width: 1, // Adjust the line width as needed
          dashStyle: "Solid",
        },
        labels: {
          style: {
            color: $mode === "light" ? "#545454" : "white",
          },
          distance: 10, // Increases space between label and axis
          formatter: function () {
            const date = new Date(this.value);
            return date.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            });
          },
        },
        tickPositioner: function () {
          // Create custom tick positions with wider spacing
          const positions = [];
          const info = this.getExtremes();
          const tickCount = 5; // Reduce number of ticks displayed
          const interval = Math.floor((info.max - info.min) / tickCount);

          for (let i = 0; i <= tickCount; i++) {
            positions.push(info.min + i * interval);
          }
          return positions;
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
        <span class="font-semibold text-sm">${point.series.name}:</span> 
        <span class="font-normal text-sm">${abbreviateNumber(point.y)}</span><br>`;
          });

          return tooltipContent;
        },
      },

      plotOptions: {
        series: {
          color: "white",
          animation: false, // Disable series animation
          states: {
            hover: {
              enabled: false, // Disable hover effect globally
            },
          },
        },
      },
      legend: {
        enabled: false,
      },
      series: [
        {
          name: "Mkt Cap",
          type: "area",
          data: filteredData?.marketCapList,
          color: "#4681f4",
          lineWidth: 1.2,
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

  let config = null;

  $: {
    if ($mode) {
      config = plotData();
    }
  }
  $: capCategory = getMarketCapCategory(data?.getStockQuote?.marketCap);

  let columns = [
    { key: "date", label: "Date", align: "left" },
    { key: "marketCap", label: "Market Cap", align: "right" },
    { key: "changesPercentage", label: "% Change", align: "right" },
  ];

  let sortOrders = {
    date: { order: "none", type: "date" },
    marketCap: { order: "none", type: "number" },
    changesPercentage: { order: "none", type: "number" },
  };

  const sortData = (key) => {
    // Reset all other keys to 'none' except the current key
    for (const k in sortOrders) {
      if (k !== key) {
        sortOrders[k].order = "none";
      }
    }

    // Cycle through 'none', 'asc', 'desc' for the clicked key
    const orderCycle = ["none", "asc", "desc"];

    let originalData = [];
    if (activeIdx === 0) {
      originalData = filterEndOfYearDates(rawData);
    } else {
      originalData = filterEndOfQuarterDates(rawData);
    }

    tableList?.sort((a, b) => new Date(b?.date) - new Date(a?.date));

    const currentOrderIndex = orderCycle.indexOf(sortOrders[key].order);
    sortOrders[key].order =
      orderCycle[(currentOrderIndex + 1) % orderCycle.length];
    const sortOrder = sortOrders[key].order;

    // Reset to original data when 'none' and stop further sorting
    if (sortOrder === "none") {
      tableList = [...originalData]; // Reset to original data (spread to avoid mutation)
      return;
    }

    // Define a generic comparison function
    const compareValues = (a, b) => {
      const { type } = sortOrders[key];
      let valueA, valueB;

      switch (type) {
        case "date":
          valueA = new Date(a[key]);
          valueB = new Date(b[key]);
          break;
        case "string":
          valueA = a[key].toUpperCase();
          valueB = b[key].toUpperCase();
          return sortOrder === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        case "number":
        default:
          valueA = parseFloat(a[key]);
          valueB = parseFloat(b[key]);
          break;
      }

      if (sortOrder === "asc") {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    };

    // Sort using the generic comparison function
    tableList = [...originalData].sort(compareValues);
  };
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Market Cap Analysis | Historical Valuation & Growth Trends`}
  description={`Comprehensive market capitalization analysis for ${$displayCompanyName} (${$stockTicker}). Track historical market cap trends, valuation growth, size classification, and year-over-year changes with detailed charts and quarterly data.`}
  keywords={`${$stockTicker} market cap, ${$displayCompanyName} market capitalization, company valuation, ${$stockTicker} net worth, market cap history, valuation trends, company size analysis, ${$stockTicker} enterprise value, market cap growth`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/statistics/market-cap`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "Dataset"],
    name: `${$displayCompanyName} Market Cap Analysis`,
    description: `Professional market capitalization tracking and valuation analysis for ${$displayCompanyName} (${$stockTicker})`,
    url: `https://stocknear.com/stocks/${$stockTicker}/statistics/market-cap`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Market cap tracking",
      "Historical valuation analysis",
      "Size classification",
      "Growth trend analysis",
      "Quarterly market cap data",
      "Year-over-year comparisons",
      "Valuation metrics",
      "Market cap charts",
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
      name: "Market Capitalization Analysis",
      description:
        "Professional analysis of company market value and valuation trends",
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
          <div class="w-full flex flex-col sm:flex-row justify-between">
            <h1 class="text-xl sm:text-2xl font-bold">
              {removeCompanyStrings($displayCompanyName)} Market Cap
            </h1>
          </div>

          {#if rawData?.length !== 0}
            <div class="grid grid-cols-1 gap-2">
              <Infobox
                text={`${removeCompanyStrings($displayCompanyName)} has a market cap or net worth of ${abbreviateNumber(
                  data?.getStockQuote?.marketCap,
                )} as of ${new Date()?.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  daySuffix: "2-digit",
                  timeZone: "UTC",
                })}. Its market cap has ${
                  changePercentageYearAgo > 0
                    ? "increased"
                    : changePercentageYearAgo < 0
                      ? "decreased"
                      : "unchanged"
                } by ${abbreviateNumber(
                  changePercentageYearAgo?.toFixed(2),
                )}% in one year.`}
              />

              <div
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2 mt-3"
              >
                <div
                  class="marketCap-driver shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
                >
                  <div class=" text-sm mb-2 flex items-center">
                    <span>Market Cap</span>
                  </div>
                  <div class="flex items-baseline">
                    <span class="text-xl font-semibold">
                      {abbreviateNumber(data?.getStockQuote?.marketCap)}</span
                    >
                  </div>
                </div>

                <div
                  class="category-driver shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
                >
                  <div class=" text-sm mb-2 flex items-center">
                    <span>Category</span>
                  </div>
                  <div class="flex items-baseline">
                    <span class="text-xl font-semibold"
                      >{#if capCategory}
                        <a
                          class="text-blue-800 sm:hover:text-muted dark:sm:hover:text-white dark:text-blue-400"
                          href={capCategory.link}
                        >
                          {capCategory.name}
                        </a>
                      {:else}
                        n/a
                      {/if}</span
                    >
                  </div>
                </div>

                <div
                  class="oneYearChange-driver shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
                >
                  <div class=" text-sm mb-2 flex items-center">
                    <span>1-Year Change</span>
                  </div>
                  <div class="flex items-baseline">
                    <span class="text-xl font-semibold"
                      >{changePercentageYearAgo > 100
                        ? "> 100%"
                        : changePercentageYearAgo
                          ? changePercentageYearAgo?.toFixed(1) + "%"
                          : "n/a"}</span
                    >
                    {#if changePercentageYearAgo}
                      <div class="flex flex-col ml-2">
                        <span
                          class="text-sm {changePercentageYearAgo >= 0 &&
                          changePercentageYearAgo !== null
                            ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
                            : changePercentageYearAgo < 0 &&
                                changePercentageYearAgo !== null
                              ? 'text-red-800 dark:text-[#FF2F1F]'
                              : ''}"
                        >
                          {changePercentageYearAgo >= 0
                            ? "Positive"
                            : "Negative"}
                          Trend
                        </span>
                      </div>
                    {/if}
                  </div>
                </div>
              </div>

              <div
                class="flex flex-col sm:flex-row items-start sm:items-center w-full border-t border-b border-gray-300 dark:border-gray-800 py-2"
              >
                <h2 class="mb-3 sm:mb-0 text-xl sm:text-2xl font-bold">
                  Market Cap Chart
                </h2>

                <div
                  class="flex flex-row items-center w-fit sm:w-[50%] md:w-auto sm:ml-auto"
                >
                  <div
                    class="timeframe-toggle-driver relative inline-block text-left grow mr-2"
                  >
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild let:builder>
                        <Button
                          builders={[builder]}
                          class="w-full  border-gray-300 dark:border-gray-600 border bg-black text-white sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary ease-out  flex flex-row justify-between items-center px-3 py-2  rounded truncate"
                        >
                          <span class="truncate text-xs sm:text-sm"
                            >{timePeriod}</span
                          >
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
                        class="w-56 h-fit max-h-72 overflow-y-auto scroller"
                      >
                        <DropdownMenu.Label
                          class="text-muted dark:text-gray-400 font-normal"
                        >
                          Select time frame
                        </DropdownMenu.Label>
                        <DropdownMenu.Separator />
                        <DropdownMenu.Group>
                          <DropdownMenu.Item
                            on:click={() => changeStatement("1M")}
                            class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                          >
                            1 Month
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            on:click={() => changeStatement("6M")}
                            class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                          >
                            6 Months
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            on:click={() => changeStatement("1Y")}
                            class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                          >
                            1 Year
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            on:click={() => changeStatement("3Y")}
                            class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                          >
                            3 Years
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            on:click={() => changeStatement("5Y")}
                            class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                          >
                            5 Years
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            on:click={() => changeStatement("10Y")}
                            class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                          >
                            10 Years
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            on:click={() => changeStatement("Max")}
                            class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                          >
                            Max
                          </DropdownMenu.Item>
                        </DropdownMenu.Group>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </div>
                  <DownloadData
                    {data}
                    {rawData}
                    title={`market_cap_${$stockTicker}`}
                  />
                </div>
              </div>

              <div
                class="chart-driver border border-gray-300 shadow-xs dark:border-gray-800 rounded"
                use:highcharts={config}
              ></div>

              <div
                class=" flex flex-row items-center w-full justify-between mt-2 border-t border-b border-gray-300 dark:border-gray-800 py-2"
              >
                <h3 class="history-driver text-xl sm:text-2xl font-bold">
                  History
                </h3>

                <div class="inline-flex justify-center rounded w-auto">
                  <div
                    class=" flex flex-col sm:flex-row items-start sm:items-center w-full justify-between"
                  >
                    <div class="">
                      <div class="inline-flex">
                        <div class="inline-flex rounded-lg shadow-sm">
                          {#each tabs as item, i}
                            <button
                              on:click={() => changeTablePeriod(i)}
                              class="cursor-pointer px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none transition-colors duration-50
                          {i === 0 ? 'rounded-l border' : ''}
                          {i === tabs?.length - 1
                                ? 'rounded-r border-t border-r border-b'
                                : ''}
                          {i !== 0 && i !== tabs?.length - 1
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
                  </div>
                </div>
              </div>

              <div class="w-full overflow-x-auto">
                <table
                  class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto mt-2"
                >
                  <thead>
                    <TableHeader {columns} {sortOrders} {sortData} />
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
                          {@html abbreviateNumber(item?.marketCap, false, true)}
                        </td>

                        <td
                          class=" text-sm sm:text-[1rem] whitespace-nowrap text-end"
                        >
                          {#if item?.changesPercentage}
                            <span
                              class={item?.changesPercentage >= 0
                                ? "text-green-800 dark:text-[#00FC50] before:content-['+']"
                                : "text-red-800 dark:text-[#FF2F1F]"}
                            >
                              {item?.changesPercentage
                                ? item?.changesPercentage + "%"
                                : "n/a"}
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
            </div>
          {:else}
            <Infobox text="No data available" />
          {/if}
        </div>
      </main>
    </div>
  </div>
</section>

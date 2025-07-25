<script lang="ts">
  import { screenWidth } from "$lib/store";
  import Table from "$lib/components/Table/Table.svelte";

  import ArrowLogo from "lucide-svelte/icons/move-up-right";
  import SEO from "$lib/components/SEO.svelte";

  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";

  export let data;

  let timePeriod = "oneWeek";
  let rawData = [];

  const excludedRules = new Set([
    "price",
    "changesPercentage",
    "count",
    "sentiment",
    "marketCap",
  ]);

  const defaultList = [
    { name: "Market Cap", rule: "marketCap" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "Mentions", rule: "count" },
    { name: "Sentiment", rule: "sentiment" },
  ];

  const specificRows = [
    { name: "Mentions", rule: "count", type: "int" },
    { name: "Sentiment", rule: "sentiment", type: "rating" },
  ];

  let configPieChart = null;
  let configBarChart = null;

  let activeIdx = 0;

  const tabs = [
    {
      title: "Week",
    },
    {
      title: "Month",
    },
    {
      title: "3 Months",
    },
  ];

  function changeTimePeriod(state) {
    activeIdx = state;
    if (activeIdx === 0) {
      timePeriod = "oneWeek";
    } else if (activeIdx === 1) {
      timePeriod = "oneMonth";
    } else if (activeIdx === 2) {
      timePeriod = "threeMonths";
    }
  }

  function plotPieChart() {
    // Sector allocation data
    const stockData = data?.getRedditTracker[timePeriod];

    // Color palette matching the screenshot
    const colors = [
      "#2B5F75", // Technology - Dark blue
      "#4A7BA7", // Financials - Medium blue
      "#8B5A9B", // Consumer Discretionary - Purple
      "#C85A9B", // Health Care - Pink-purple
      "#E85A85", // Industrials - Pink
      "#F5756B", // Communication Services - Coral
      "#F9A05C", // Consumer Staples - Orange
      "#FFC04D", // Other - Yellow
      "#FFD93D", // Energy - Bright yellow
      "#4A6B8A", // Utilities - Blue-gray
      "#9B7BA7", // Real Estate - Light purple
      "#D85A9B", // Materials - Pink
    ];

    // Transform data for Highcharts pie chart
    // Transform data for Highcharts pie chart, filtering out entries with less than 1% weight
    const pieData = stockData?.slice(0, 12)?.map((item, index) => ({
      name: item.symbol,
      y: item.weightPercentage,
      color: colors[index % colors.length],
    }));

    // Highcharts configuration options
    const options = {
      credits: {
        enabled: false,
      },
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        type: "pie",
        height: 330,
        animation: false,
      },
      title: {
        text: null,
      },
      plotOptions: {
        pie: {
          allowPointSelect: false,
          cursor: "pointer",
          dataLabels: {
            enabled: true,
            distance: 30,
            style: {
              color: $mode === "light" ? "#333" : "#fff",
              fontSize: "14px",
              fontWeight: "500",
              textOutline: "none",
            },
            formatter: function () {
              return `<span style="font-weight: 600">${this.point.name}:</span> ${this.y.toFixed(2)}%`;
            },
          },
          showInLegend: false,
          borderWidth: 0,
          size: "80%",
          innerSize: "0%",
          animation: false,
          enableMouseTracking: false,
          states: {
            hover: {
              enabled: false,
            },
            inactive: {
              enabled: false,
            },
          },
        },
      },
      tooltip: {
        enabled: false,
      },
      series: [
        {
          name: "Mentions",
          data: pieData,
          animation: false,
        },
      ],
      legend: {
        enabled: false,
      },
    };

    return options;
  }

  function plotBarChart() {
    // Sector allocation data
    const stockData = data?.getRedditTracker[timePeriod]?.slice(0, 12);

    // Transform data for Highcharts horizontal bar chart
    const categories = stockData?.map((item) => item?.symbol);
    const values = stockData?.map((item) => item?.weightPercentage);

    // Highcharts configuration options
    const options = {
      credits: {
        enabled: false,
      },
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        type: "bar",
        height: 500,
        animation: false,
      },
      title: {
        text: null,
      },
      xAxis: {
        categories: categories,
        title: {
          text: null,
        },
        labels: {
          style: {
            color: $mode === "light" ? "#333" : "#fff",
            fontSize: "14px",
            fontWeight: "400",
          },
        },
        lineWidth: 0,
        tickLength: 0,
      },
      yAxis: {
        min: 0,
        max: 35,
        title: {
          text: null,
        },
        labels: {
          enabled: false,
        },
        gridLineWidth: 0,
        lineWidth: 0,
        tickLength: 0,
      },
      plotOptions: {
        bar: {
          dataLabels: {
            enabled: true,
            inside: true,
            align: "left",
            x: 5,
            style: {
              color: $mode === "light" ? "#333" : "#fff",
              fontSize: "14px",
              fontWeight: "600",
              textOutline: "none",
            },
            formatter: function () {
              return this.y.toFixed(2) + "%";
            },
          },
          color: "#4A90A4",
          borderWidth: 0,
          pointPadding: 0.1,
          groupPadding: 0.1,
          animation: false,
          enableMouseTracking: false,
          states: {
            hover: {
              enabled: false,
            },
            inactive: {
              enabled: false,
            },
          },
        },
      },
      tooltip: {
        enabled: false,
      },
      series: [
        {
          name: "Percentage",
          data: values,
          animation: false,
        },
      ],
      legend: {
        enabled: false,
      },
    };

    return options;
  }

  $: {
    if ($mode && typeof window !== "undefined" && timePeriod) {
      configPieChart = plotPieChart() || null;
      configBarChart = plotBarChart() || null;
      rawData = data?.getRedditTracker[timePeriod] || [];
    }
  }
</script>

<SEO
  title="Reddit Stock Tracker - WSB Analytics & Insights"
  description="Track WallStreetBets stock discussions and trends in real-time. Get detailed analytics, sentiment analysis, and trading insights from Reddit's largest stock community."
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3 text-muted dark:text-white"
>
  <div class="text-sm sm:text-[1rem] breadcrumbs">
    <ul>
      <li><a href="/" class="text-muted dark:text-gray-300">Home</a></li>
      <li class="text-muted dark:text-gray-300">Reddit Tracker</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:w-3/4 lg:pr-5">
          <div class="mb-3">
            <h1 class="mb-1 text-2xl sm:text-3xl font-bold">
              Wallsteetbets Tracker
            </h1>
          </div>

          <nav
            class="border-[#2C6288] dark:border-white border-b-[2px] overflow-x-auto whitespace-nowrap"
          >
            <ul class="flex flex-row items-center w-full text-[1rem]">
              {#each tabs as item, i}
                <button
                  on:click={() => changeTimePeriod(i)}
                  class="p-2 px-5 cursor-pointer {activeIdx === i
                    ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                    : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
                >
                  {item?.title}
                </button>
              {/each}
            </ul>
          </nav>

          <p class="mt-4">
            Overview of WallStreetBets discussion trends for the selected
            <strong
              >{timePeriod === "oneWeek"
                ? "week"
                : timePeriod === "oneMonth"
                  ? "month"
                  : "3-month"}</strong
            >
            period. As of today, the most discussed stock is
            <strong>{rawData?.[0]?.symbol || "n/a"}</strong>
            with
            <strong
              >{rawData?.[0]?.count?.toLocaleString("en-US") || "n/a"}</strong
            >
            mentions, representing
            <strong
              >{rawData?.[0]?.weightPercentage
                ? rawData[0].weightPercentage.toFixed(1) + "%"
                : "n/a"}</strong
            >
            of total discussion volume. The overall sentiment is
            <strong
              >{rawData?.[0]?.sentiment > 0.6
                ? "bullish"
                : rawData?.[0]?.sentiment < 0.4
                  ? "bearish"
                  : "neutral"}</strong
            >. Total tracked mentions across all stocks amount to
            <strong
              >{rawData
                ?.reduce((sum, item) => sum + (item.count || 0), 0)
                ?.toLocaleString("en-US") || "n/a"}</strong
            >
            discussions, indicating
            <strong
              >{rawData?.length > 10
                ? "high"
                : rawData?.length > 5
                  ? "moderate"
                  : "low"}</strong
            >
            community engagement levels.
          </p>

          {#if data?.getRedditTracker[timePeriod]?.length > 0}
            <div class="">
              <div class="grow mt-5">
                <div class="relative">
                  <h2 class="mb-2 text-xl sm:text-2xl font-bold">
                    Mentions Allocation
                  </h2>

                  <div
                    class=" sm:p-3 shadow-xs border border-gray-300 dark:border-gray-800 rounded"
                    use:highcharts={$screenWidth < 640
                      ? configBarChart
                      : configPieChart}
                  ></div>
                </div>
              </div>
            </div>
          {/if}

          {#if rawData?.length > 0}
            {#key rawData}
              <Table
                {data}
                {rawData}
                {excludedRules}
                {defaultList}
                {specificRows}
              />
            {/key}
          {/if}
        </main>

        <aside class="hidden lg:block relative fixed w-1/4 ml-4">
          <div
            class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
          >
            <a
              href="/potus-tracker"
              class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-xl font-bold ml-3">POTUS Tracker</h2>
                <ArrowLogo
                  class="w-8 h-8 mr-3 shrink-0 text-gray-400 dark:text-white"
                />
              </div>
              <span class=" p-3 ml-3 mr-3">
                Follow the latest executive orders of the US President
              </span>
            </a>
          </div>

          <div
            class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
          >
            <a
              href="/insider-tracker"
              class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-xl font-bold ml-3">
                  Insider Tracker
                </h2>
                <ArrowLogo
                  class="w-8 h-8 mr-3 shrink-0 text-gray-400 dark:text-white"
                />
              </div>
              <span class=" p-3 ml-3 mr-3">
                Get the latest unusual insider trading in realtime
              </span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
</section>

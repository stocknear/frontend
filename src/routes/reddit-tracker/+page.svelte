<script lang="ts">
  import { screenWidth } from "$lib/store";
  import Table from "$lib/components/Table/Table.svelte";

  import ArrowLogo from "lucide-svelte/icons/move-up-right";
  import SEO from "$lib/components/SEO.svelte";

  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";
  import { goto } from "$app/navigation";

  export let data;

  // Reactive variables that update when data changes
  $: currentSubreddit = data?.currentSubreddit || "wallstreetbets";
  $: availableSubreddits = data?.availableSubreddits || [];

  // Subreddit display configuration
  const subredditConfig = {
    wallstreetbets: {
      displayName: "WallStreetBets",
      shortName: "WSB",
      description:
        "High-volume discussions from r/wallstreetbets, tracking meme stocks and aggressive trading strategies",
    },
    valueinvesting: {
      displayName: "Value Investing",
      shortName: "Value",
      description:
        "Value-focused discussions from r/valueinvesting, emphasizing fundamental analysis and long-term holds",
    },
    stocks: {
      displayName: "Stocks",
      shortName: "Stocks",
      description:
        "General stock discussions from r/stocks covering market trends and investment ideas",
    },
    investing: {
      displayName: "Investing",
      shortName: "Investing",
      description:
        "Broad investing discussions from r/investing for diverse portfolio strategies",
    },
    stockmarket: {
      displayName: "Stock Market",
      shortName: "Market",
      description:
        "Market news and analysis from r/stockmarket tracking overall market trends",
    },
  };

  function changeSubreddit(subreddit: string) {
    goto(`/reddit-tracker?subreddit=${subreddit}`);
  }

  function getSubredditDisplay(name: string) {
    return subredditConfig[name]?.displayName || name;
  }

  function getSubredditDescription(name: string) {
    return subredditConfig[name]?.description || "";
  }

  let timePeriod = "oneWeek";
  let rawData = [];

  const excludedRules = new Set([
    "price",
    "changesPercentage",
    "sentiment",
    "marketCap",
  ]);

  const defaultList = [
    { name: "Market Cap", rule: "marketCap" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "Sentiment", rule: "sentiment" },
  ];

  const specificRows = [
    { name: "Sentiment", rule: "sentiment", type: "rating" },
  ];

  let configPieChart = null;

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
        height: $screenWidth < 640 ? 300 : 360,
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
            distance: $screenWidth < 640 ? 10 : 30,
            style: {
              color: $mode === "light" ? "#333" : "#fff",
              fontSize: $screenWidth < 640 ? "12px" : "14px",
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

  $: {
    if ($mode && typeof window !== "undefined" && timePeriod) {
      configPieChart = plotPieChart() || null;
      rawData = data?.getRedditTracker[timePeriod];
    }
  }
</script>

<SEO
  title={`Reddit Stock Tracker - ${getSubredditDisplay(currentSubreddit)} Analytics & Sentiment`}
  description={`Track ${getSubredditDisplay(currentSubreddit)} stock discussions, sentiment analysis, and trending stocks from r/${currentSubreddit}. Monitor mentions, sentiment scores, and social trading insights. Free Reddit stock tracker with real-time data.`}
  keywords={`${currentSubreddit}, reddit stocks, ${currentSubreddit} sentiment, reddit trading, ${currentSubreddit} tracker, reddit analytics, reddit stock mentions, social trading`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Reddit Stock Tracker",
    description:
      "Multi-subreddit stock discussion tracker with sentiment analysis",
    url: "https://stocknear.com/reddit-tracker",
    applicationCategory: "FinanceApplication",
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
          name: "Reddit Tracker",
          item: "https://stocknear.com/reddit-tracker",
        },
      ],
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3 text-muted dark:text-white"
>
  <div class="text-sm sm:text-[1rem] breadcrumbs">
    <ul>
      <li>
        <a href="/" class="text-muted dark:text-gray-300">Home</a>
      </li>
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
              Reddit Stock Tracker
            </h1>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {getSubredditDescription(currentSubreddit)}
            </p>
          </div>

          <!-- Subreddit Selector -->
          {#if availableSubreddits.length > 0}
            <div class="mb-4">
              <label class="block text-sm font-medium mb-3">
                Select Subreddit
              </label>
              <div class="flex flex-wrap gap-2">
                {#each availableSubreddits as subreddit}
                  <button
                    on:click={() => changeSubreddit(subreddit.name)}
                    class="cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-all duration-50 {currentSubreddit ===
                    subreddit.name
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}"
                  >
                    r/{subreddit.name}
                  </button>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Time Period Tabs -->
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
            Overview of r/{currentSubreddit} discussion trends for the selected
            <strong
              >{timePeriod === "oneWeek"
                ? "week"
                : timePeriod === "oneMonth"
                  ? "month"
                  : "3-month"}</strong
            >
            period. As of today, the most discussed stock is
            <strong>{rawData?.[0]?.symbol || "n/a"}</strong>, representing
            <strong
              >{rawData?.[0]?.weightPercentage
                ? rawData[0].weightPercentage.toFixed(1) + "%"
                : "n/a"}</strong
            >
            of total discussion volume.
          </p>

          {#if data?.getRedditTracker[timePeriod]?.length > 0}
            <div class="">
              <div class="grow mt-5">
                <div class="relative">
                  <h2 class="mb-2 text-xl sm:text-2xl font-bold">
                    Mentions Allocation
                  </h2>

                  <div
                    class=" sm:p-3 shadow border border-gray-300 dark:border-gray-800 rounded"
                    use:highcharts={configPieChart}
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
                title={rawData?.length?.toLocaleString("en-US") +
                  " " +
                  "Stocks"}
              />
            {/key}
          {/if}
        </main>

        <aside class="hidden lg:block relative fixed w-1/4 ml-4">
          <div
            class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow dark:sm:hover:bg-secondary transition ease-out duration-100"
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
            class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow dark:sm:hover:bg-secondary transition ease-out duration-100"
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

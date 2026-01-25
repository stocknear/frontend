<script lang="ts">
  import { screenWidth } from "$lib/store";
  import Table from "$lib/components/Table/Table.svelte";

  import SEO from "$lib/components/SEO.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu";
  import { Button } from "$lib/components/shadcn/button/index.js";

  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";
  import { goto } from "$app/navigation";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import * as m from "$lib/paraglide/messages";

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
    { name: "Sentiment", rule: "sentiment", type: "sentiment" },
  ];

  let configPieChart = null;

  let activeIdx = 0;

  $: tabs = [
    {
      title: m.reddit_tracker_tab_week(),
    },
    {
      title: m.reddit_tracker_tab_month(),
    },
    {
      title: m.reddit_tracker_tab_3months(),
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
  title={m.reddit_tracker_seo_title({ subreddit: getSubredditDisplay(currentSubreddit) })}
  description={m.reddit_tracker_seo_description({ subreddit: getSubredditDisplay(currentSubreddit) })}
  keywords={m.reddit_tracker_seo_keywords({ subreddit: currentSubreddit })}
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
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3 text-gray-700 dark:text-zinc-200"
>
  <BreadCrumb
    containerClass="text-xs sm:text-sm breadcrumbs text-gray-500 dark:text-zinc-400"
  >
    <li>
      <a
        href="/"
        class="text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400"
        >{m.reddit_tracker_breadcrumb_home()}</a
      >
    </li>
    <li class="text-gray-500 dark:text-zinc-400">{m.reddit_tracker_breadcrumb_current()}</li>
  </BreadCrumb>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class="mb-3">
            <h1
              class="mb-1 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              {m.reddit_tracker_title()}
            </h1>
            <p class="text-sm text-gray-800 dark:text-zinc-300">
              {getSubredditDescription(currentSubreddit)}
            </p>
          </div>

          <!-- Time Period Tabs -->
          <nav
            class="border-b border-gray-300 dark:border-zinc-700 overflow-x-auto whitespace-nowrap"
          >
            <ul
              class="flex flex-row items-center w-full gap-1 pb-2 text-sm sm:text-base"
            >
              {#each tabs as item, i}
                <button
                  on:click={() => changeTimePeriod(i)}
                  class="cursor-pointer px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {activeIdx ===
                  i
                    ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                    : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                >
                  {item?.title}
                </button>
              {/each}
            </ul>
          </nav>

          {#if data?.getRedditTracker[timePeriod]?.length > 0}
            <div
              class="-mb-2 pt-3 overflow-x-auto whitespace-nowrap flex flex-row items-center justify-between sm:justify-start w-full"
            >
              <h2
                class="text-start w-full text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
              >
                {m.reddit_tracker_subreddit_label()}
              </h2>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild let:builder>
                  <Button
                    builders={[builder]}
                    class="shadow-sm transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center w-fit px-3 py-2 rounded-full "
                  >
                    <span class="truncate text-[0.85rem] sm:text-sm">
                      r/{currentSubreddit}
                    </span>
                    <svg
                      class="-mr-1 ml-1 h-5 w-5 inline-block"
                      viewBox="0 0 20 20"
                      fill="currentColor"
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
                  class="min-w-36 w-auto max-w-60 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 text-gray-700 dark:text-zinc-200 shadow-lg shadow-black/5 p-2"
                >
                  <DropdownMenu.Group>
                    {#each availableSubreddits as subreddit}
                      <DropdownMenu.Item
                        on:click={() => changeSubreddit(subreddit.name)}
                        class="sm:hover:bg-gray-100 dark:sm:hover:bg-zinc-900 cursor-pointer flex flex-row items-center justify-between rounded-lg text-gray-700 dark:text-zinc-200 transition-colors"
                      >
                        <span>{subreddit.name}</span>
                      </DropdownMenu.Item>
                    {/each}
                  </DropdownMenu.Group>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
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
                title={m.reddit_tracker_stocks_count({ count: rawData?.length?.toLocaleString("en-US") })}
              />
            {/key}
          {/if}
        </main>
      </div>
    </div>
  </div>
</section>

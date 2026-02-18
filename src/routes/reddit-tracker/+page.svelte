<script lang="ts">
  import { screenWidth } from "$lib/store";
  import { onMount } from "svelte";

  import SEO from "$lib/components/SEO.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu";
  import { Button } from "$lib/components/shadcn/button/index.js";

  import { goto } from "$app/navigation";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import { abbreviateNumber } from "$lib/utils";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";
  import {
    reddit_tracker_breadcrumb_current,
    reddit_tracker_breadcrumb_home,
    reddit_tracker_seo_description,
    reddit_tracker_seo_keywords,
    reddit_tracker_seo_title,
    reddit_tracker_subreddit_label,
    reddit_tracker_tab_day,
    reddit_tracker_tab_3months,
    reddit_tracker_tab_month,
    reddit_tracker_tab_week,
    reddit_tracker_title,
    reddit_tracker_posts_loading,
    reddit_tracker_posts_empty,
    reddit_tracker_posts_comments,
    reddit_tracker_posts_upvote,
    reddit_tracker_posts_mentioned,
    reddit_tracker_table_symbol,
    reddit_tracker_table_mentions,
    reddit_tracker_table_market_cap,
    reddit_tracker_table_price,
    reddit_tracker_table_change,
    reddit_tracker_table_sentiment,
    reddit_tracker_previous,
    reddit_tracker_next,
    reddit_tracker_rows,
    reddit_tracker_page_of,
  } from "$lib/paraglide/messages";

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
  let originalData = [];
  let stockList = [];

  let activeIdx = 1;

  $: tabs = [
    { title: reddit_tracker_tab_day() },
    { title: reddit_tracker_tab_week() },
    { title: reddit_tracker_tab_month() },
    { title: reddit_tracker_tab_3months() },
  ];

  function changeTimePeriod(state) {
    activeIdx = state;
    if (activeIdx === 0) {
      timePeriod = "oneDay";
    } else if (activeIdx === 1) {
      timePeriod = "oneWeek";
    } else if (activeIdx === 2) {
      timePeriod = "oneMonth";
    } else if (activeIdx === 3) {
      timePeriod = "threeMonths";
    }
    checkedSymbol = "";
    expandedPosts = [];
    currentPage = 1;
  }

  // --- Custom table state (following insider-tracker pattern) ---

  // Expandable row state
  $: checkedSymbol = "";
  let expandedPosts = [];
  let loadingPosts = false;

  function openGraph(symbol) {
    if (checkedSymbol === symbol) {
      checkedSymbol = "";
      expandedPosts = [];
    } else {
      checkedSymbol = symbol;
      fetchPostsForTicker(symbol);
    }
  }

  async function fetchPostsForTicker(ticker) {
    loadingPosts = true;
    expandedPosts = [];
    try {
      const response = await fetch(
        `/api/reddit-tracker-posts?subreddit=${encodeURIComponent(currentSubreddit)}&ticker=${encodeURIComponent(ticker)}&period=${encodeURIComponent(timePeriod)}`,
      );
      if (response.ok) {
        expandedPosts = await response.json();
      } else {
        expandedPosts = [];
      }
    } catch {
      expandedPosts = [];
    }
    loadingPosts = false;
  }

  function formatPostDate(utcSeconds) {
    return new Date(utcSeconds * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // Pagination state
  let currentPage = 1;
  let rowsPerPage = 20;
  let rowsPerPageOptions = [20, 50, 100];
  let totalPages = 1;
  let pagePathName = "";

  function updatePaginatedData() {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    stockList = originalData?.slice(startIndex, endIndex) || [];
    totalPages = Math.ceil((originalData?.length || 0) / rowsPerPage);
  }

  function goToPage(pg) {
    if (pg >= 1 && pg <= totalPages) {
      currentPage = pg;
      checkedSymbol = "";
      expandedPosts = [];
      updatePaginatedData();
    }
  }

  function changeRowsPerPage(newRowsPerPage) {
    rowsPerPage = newRowsPerPage;
    currentPage = 1;
    updatePaginatedData();
    saveRowsPerPage();
  }

  function saveRowsPerPage() {
    if (!pagePathName || typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(`${pagePathName}_rowsPerPage`, String(rowsPerPage));
    } catch {}
  }

  function loadRowsPerPage() {
    const currentPath = pagePathName;
    if (!currentPath || typeof localStorage === "undefined") {
      rowsPerPage = 20;
      return;
    }
    try {
      const saved = localStorage.getItem(`${currentPath}_rowsPerPage`);
      if (saved && rowsPerPageOptions.includes(Number(saved))) {
        rowsPerPage = Number(saved);
      } else {
        rowsPerPage = 20;
      }
    } catch {
      rowsPerPage = 20;
    }
  }

  // Column definitions
  function getDefaultColumns() {
    return [
      {
        key: "symbol",
        label: reddit_tracker_table_symbol(),
        align: "left",
      },
      {
        key: "mentions",
        label: reddit_tracker_table_mentions(),
        align: "right",
      },
      {
        key: "marketCap",
        label: reddit_tracker_table_market_cap(),
        align: "right",
      },
      { key: "price", label: reddit_tracker_table_price(), align: "right" },
      {
        key: "changesPercentage",
        label: reddit_tracker_table_change(),
        align: "right",
      },
      {
        key: "sentiment",
        label: reddit_tracker_table_sentiment(),
        align: "right",
      },
    ];
  }

  let defaultColumns = getDefaultColumns();
  let customColumnOrder: string[] = [];
  let lastAppliedColumnKeys = "";

  $: orderedColumns = applyColumnOrder([...defaultColumns], customColumnOrder);

  $: columns = [
    ...($screenWidth > 1024
      ? [{ key: "chart", label: "", align: "right" }]
      : []),
    ...orderedColumns,
  ];

  let sortOrders = {
    chart: { order: "none", type: "string" },
    symbol: { order: "none", type: "string" },
    mentions: { order: "none", type: "number" },
    marketCap: { order: "none", type: "number" },
    price: { order: "none", type: "number" },
    changesPercentage: { order: "none", type: "number" },
    sentiment: { order: "none", type: "string" },
  };

  const sortData = (key) => {
    for (const k in sortOrders) {
      if (k !== key) {
        sortOrders[k].order = "none";
      }
    }

    const orderCycle = ["none", "asc", "desc"];
    const currentOrderIndex = orderCycle.indexOf(sortOrders[key].order);
    sortOrders[key].order =
      orderCycle[(currentOrderIndex + 1) % orderCycle.length];
    const sortOrder = sortOrders[key].order;

    if (sortOrder === "none") {
      originalData = [...rawData];
      currentPage = 1;
      updatePaginatedData();
      return;
    }

    const compareValues = (a, b) => {
      const { type } = sortOrders[key];
      let valueA, valueB;

      switch (type) {
        case "string":
          valueA = (a[key] ?? "").toString().toUpperCase();
          valueB = (b[key] ?? "").toString().toUpperCase();
          return sortOrder === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        case "number":
        default:
          valueA = parseFloat(a[key]) || 0;
          valueB = parseFloat(b[key]) || 0;
          break;
      }

      if (sortOrder === "asc") {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    };

    originalData = [...originalData].sort(compareValues);
    currentPage = 1;
    checkedSymbol = "";
    expandedPosts = [];
    updatePaginatedData();
  };

  // Column reordering
  function getColumnOrderStorageKey() {
    return `${pagePathName}_columnOrder`;
  }

  function loadColumnOrder(): string[] {
    if (typeof localStorage === "undefined") return [];
    try {
      const saved = localStorage.getItem(getColumnOrderStorageKey());
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  function saveColumnOrder(order: string[]) {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(getColumnOrderStorageKey(), JSON.stringify(order));
    } catch {}
  }

  function applyColumnOrder(
    cols: typeof defaultColumns,
    order: string[],
  ): typeof defaultColumns {
    if (!order.length) return cols;
    const colMap = new Map(cols.map((c) => [c.key, c]));
    const ordered: typeof defaultColumns = [];
    for (const key of order) {
      const col = colMap.get(key);
      if (col) {
        ordered.push(col);
        colMap.delete(key);
      }
    }
    for (const col of colMap.values()) {
      ordered.push(col);
    }
    return ordered;
  }

  function handleColumnReorder(fromIndex: number, toIndex: number) {
    const hasChartColumn = columns[0]?.key === "chart";
    if (hasChartColumn && (fromIndex === 0 || toIndex === 0)) {
      return;
    }
    const reordered = [...columns];
    const [removed] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, removed);
    const reorderableColumns = reordered.filter((c) => c.key !== "chart");
    customColumnOrder = reorderableColumns.map((c) => c.key);
    saveColumnOrder(customColumnOrder);
  }

  // Apply custom column order
  $: {
    const currentColumnKeys = defaultColumns.map((c) => c.key).join(",");
    if (currentColumnKeys !== lastAppliedColumnKeys) {
      lastAppliedColumnKeys = currentColumnKeys;
      customColumnOrder = loadColumnOrder();
    }
  }

  onMount(() => {
    loadRowsPerPage();
    customColumnOrder = loadColumnOrder();
    updatePaginatedData();
  });

  // Main reactive block: update data when timePeriod/data changes
  $: {
    if (typeof window !== "undefined" && timePeriod) {
      const trendingData = data?.getRedditTracker[timePeriod] || [];
      rawData = trendingData.map((item) => ({
        ...item,
        mentions: item?.count || 0,
      }));
      originalData = [...rawData];
      updatePaginatedData();
    }
  }
</script>

<SEO
  title={reddit_tracker_seo_title({
    subreddit: getSubredditDisplay(currentSubreddit),
  })}
  description={reddit_tracker_seo_description({
    subreddit: getSubredditDisplay(currentSubreddit),
  })}
  keywords={reddit_tracker_seo_keywords({ subreddit: currentSubreddit })}
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
        >{reddit_tracker_breadcrumb_home()}</a
      >
    </li>
    <li class="text-gray-500 dark:text-zinc-400">
      {reddit_tracker_breadcrumb_current()}
    </li>
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
              {reddit_tracker_title()}
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
                    : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
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
                {reddit_tracker_subreddit_label()}
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

          <!-- Custom Table with Expandable Rows -->
          <div class="w-full m-auto mt-5">
            {#if stockList?.length > 0}
              <div
                class="w-full m-auto rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 mb-4 overflow-x-auto"
              >
                <table
                  class="table table-sm table-compact w-full m-auto text-gray-700 dark:text-zinc-200 tabular-nums"
                >
                  <thead>
                    <TableHeader
                      {columns}
                      {sortOrders}
                      {sortData}
                      onColumnReorder={handleColumnReorder}
                    />
                  </thead>
                  <tbody
                    class="divide-y divide-gray-200/70 dark:divide-zinc-800/80"
                  >
                    {#each stockList as item, index}
                      <tr
                        class="transition-colors hover:bg-gray-50/80 dark:hover:bg-zinc-900/60 cursor-pointer"
                        on:click={() => openGraph(item?.symbol)}
                      >
                        {#each columns as column}
                          {#if column.key === "chart"}
                            <td class="hidden lg:table-cell">
                              <button
                                class="cursor-pointer h-full pl-2 pr-2 align-middle lg:pl-3"
                              >
                                <svg
                                  class="w-5 h-5 text-gray-800 dark:text-zinc-300 {checkedSymbol ===
                                  item?.symbol
                                    ? 'rotate-180'
                                    : ''}"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  style="max-width:40px"
                                >
                                  <path
                                    fill-rule="evenodd"
                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                    clip-rule="evenodd"
                                  ></path>
                                </svg>
                              </button>
                            </td>
                          {:else if column.key === "symbol"}
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <td
                              class="text-[0.85rem] sm:text-sm text-start text-gray-700 dark:text-zinc-200"
                              on:click|stopPropagation
                            >
                              <HoverStockChart symbol={item?.symbol} />
                            </td>
                          {:else if column.key === "mentions"}
                            <td
                              class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-700 dark:text-zinc-200 tabular-nums"
                            >
                              {item?.mentions?.toLocaleString("en-US") || "0"}
                            </td>
                          {:else if column.key === "marketCap"}
                            <td
                              class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-700 dark:text-zinc-200 tabular-nums"
                            >
                              {abbreviateNumber(item?.marketCap)}
                            </td>
                          {:else if column.key === "price"}
                            <td
                              class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-700 dark:text-zinc-200 tabular-nums"
                            >
                              {item?.price !== undefined && item?.price !== null
                                ? "$" + item.price.toFixed(2)
                                : "-"}
                            </td>
                          {:else if column.key === "changesPercentage"}
                            <td
                              class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap tabular-nums"
                            >
                              {#if item?.changesPercentage !== undefined && item?.changesPercentage !== null}
                                <span
                                  class={item.changesPercentage >= 0
                                    ? "text-emerald-800 dark:text-emerald-400"
                                    : "text-rose-800 dark:text-rose-400"}
                                >
                                  {item.changesPercentage >= 0
                                    ? "+"
                                    : ""}{item.changesPercentage.toFixed(2)}%
                                </span>
                              {:else}
                                -
                              {/if}
                            </td>
                          {:else if column.key === "sentiment"}
                            <td
                              class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap"
                            >
                              <span
                                class={[
                                  "Bullish",
                                  "Buy",
                                  "Strong Buy",
                                ]?.includes(item?.sentiment)
                                  ? "text-emerald-800 dark:text-emerald-400"
                                  : ["Neutral", "Hold"]?.includes(
                                        item?.sentiment,
                                      )
                                    ? "text-[#E57C34] dark:text-yellow-500"
                                    : [
                                          "Bearish",
                                          "Sell",
                                          "Strong Sell",
                                        ]?.includes(item?.sentiment)
                                      ? "text-rose-800 dark:text-rose-400"
                                      : ""}
                              >
                                {item?.sentiment || "-"}
                              </span>
                            </td>
                          {/if}
                        {/each}
                      </tr>

                      <!-- Expanded Row: Reddit Posts -->
                      {#if checkedSymbol === item?.symbol}
                        <tr class="bg-white/80 dark:bg-zinc-950/60">
                          <td colspan={columns.length} class="px-0">
                            <div class="p-4 sm:p-5">
                              <!-- Header -->
                              <div
                                class="flex flex-wrap items-center gap-2 sm:gap-3 mb-4"
                              >
                                <span
                                  class="text-lg font-semibold text-gray-900 dark:text-white"
                                  >{item?.symbol}</span
                                >
                                <span
                                  class="px-2 py-0.5 rounded-full text-xs font-medium {[
                                    'Bullish',
                                    'Buy',
                                    'Strong Buy',
                                  ]?.includes(item?.sentiment)
                                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-400'
                                    : ['Neutral', 'Hold']?.includes(
                                          item?.sentiment,
                                        )
                                      ? 'bg-amber-100 dark:bg-amber-900/40 text-[#E57C34] dark:text-yellow-500'
                                      : [
                                            'Bearish',
                                            'Sell',
                                            'Strong Sell',
                                          ]?.includes(item?.sentiment)
                                        ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-400'
                                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300'}"
                                >
                                  {item?.sentiment || "N/A"}
                                </span>
                                <span
                                  class="text-sm text-gray-500 dark:text-zinc-400"
                                >
                                  {item?.mentions?.toLocaleString("en-US") ||
                                    "0"} mentions
                                </span>
                              </div>

                              <!-- Loading state -->
                              {#if loadingPosts}
                                <div
                                  class="flex justify-center items-center h-80"
                                >
                                  <div class="relative">
                                    <label
                                      class="border border-gray-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/80 rounded-2xl h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                                    >
                                      <span
                                        class="loading loading-spinner loading-md text-white dark:text-white"
                                      ></span>
                                    </label>
                                  </div>
                                </div>

                                <!-- Empty state -->
                              {:else if expandedPosts?.length === 0}
                                <p
                                  class="text-center py-8 text-gray-500 dark:text-zinc-400 text-sm"
                                >
                                  {reddit_tracker_posts_empty({
                                    ticker: item?.symbol,
                                  })}
                                </p>

                                <!-- Post feed -->
                              {:else}
                                <div
                                  class="space-y-3 max-h-[500px] overflow-y-auto scroller pr-1"
                                >
                                  {#each expandedPosts as post}
                                    <a
                                      href="https://reddit.com{post.permalink}"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      class="block rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-950/40 p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-zinc-900/60 transition"
                                    >
                                      <!-- Flair + author + date -->
                                      <div
                                        class="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 text-xs text-gray-500 dark:text-zinc-400"
                                      >
                                        {#if post.link_flair_text}
                                          <span
                                            class="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-[11px] font-medium"
                                          >
                                            {post.link_flair_text}
                                          </span>
                                        {/if}
                                        <span>u/{post.author}</span>
                                        <span class="hidden sm:inline">
                                          &middot;
                                        </span>
                                        <span>
                                          {formatPostDate(post.created_utc)}
                                        </span>
                                      </div>
                                      <!-- Title -->
                                      <h3
                                        class="text-sm font-medium text-gray-900 dark:text-white mb-1.5 line-clamp-2 whitespace-normal"
                                      >
                                        {post.title}
                                      </h3>
                                      <!-- Selftext snippet -->
                                      {#if post.selftext}
                                        <p
                                          class="text-xs text-gray-600 dark:text-zinc-400 line-clamp-2 mb-2 whitespace-normal"
                                        >
                                          {post.selftext}
                                        </p>
                                      {/if}
                                      <!-- Stats row -->
                                      <div
                                        class="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-500 dark:text-zinc-400"
                                      >
                                        <span
                                          >{reddit_tracker_posts_upvote({
                                            ratio: String(
                                              Math.round(post.upvote_ratio),
                                            ),
                                          })}</span
                                        >
                                        <span>&middot;</span>
                                        <span
                                          >{reddit_tracker_posts_comments({
                                            count: String(
                                              post.num_comments?.toLocaleString(
                                                "en-US",
                                              ),
                                            ),
                                          })}</span
                                        >
                                        {#if post.ticker_count > 1}
                                          <span>&middot;</span>
                                          <span
                                            >{reddit_tracker_posts_mentioned({
                                              count: String(post.ticker_count),
                                            })}</span
                                          >
                                        {/if}
                                      </div>
                                    </a>
                                  {/each}
                                </div>
                              {/if}
                            </div>
                          </td>
                        </tr>
                      {/if}
                    {/each}
                  </tbody>
                </table>
              </div>

              <!-- Pagination controls -->
              {#if totalPages > 1}
                <div
                  class="flex flex-row items-center justify-between mt-8 sm:mt-5"
                >
                  <!-- Previous button -->
                  <div class="flex items-center gap-2">
                    <Button
                      on:click={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <svg
                        class="h-5 w-5 inline-block shrink-0 rotate-90"
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
                      <span class="hidden sm:inline"
                        >{reddit_tracker_previous()}</span
                      >
                    </Button>
                  </div>

                  <!-- Page info + rows selector -->
                  <div class="flex flex-row items-center gap-4">
                    <span class="text-sm text-gray-600 dark:text-zinc-300">
                      {reddit_tracker_page_of({
                        current: String(currentPage),
                        total: String(totalPages),
                      })}
                    </span>

                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild let:builder>
                        <Button
                          builders={[builder]}
                          class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <span class="truncate text-[0.85rem] sm:text-sm"
                            >{rowsPerPage} {reddit_tracker_rows()}</span
                          >
                          <svg
                            class="ml-0.5 mt-1 h-5 w-5 inline-block shrink-0"
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
                        class="w-auto min-w-40 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
                      >
                        <DropdownMenu.Group class="pb-2">
                          {#each rowsPerPageOptions as rpp}
                            <DropdownMenu.Item
                              class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition"
                            >
                              <label
                                on:click={() => changeRowsPerPage(rpp)}
                                class="inline-flex justify-between w-full items-center cursor-pointer"
                              >
                                <span class="text-sm"
                                  >{rpp} {reddit_tracker_rows()}</span
                                >
                              </label>
                            </DropdownMenu.Item>
                          {/each}
                        </DropdownMenu.Group>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </div>

                  <!-- Next button -->
                  <div class="flex items-center gap-2">
                    <Button
                      on:click={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <span class="hidden sm:inline"
                        >{reddit_tracker_next()}</span
                      >
                      <svg
                        class="h-5 w-5 inline-block shrink-0 -rotate-90"
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
                  </div>
                </div>
              {/if}
            {:else}
              <div class="flex justify-center items-center h-80">
                <div class="relative">
                  <label
                    class="border border-gray-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/80 rounded-2xl h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  >
                    <span
                      class="loading loading-spinner loading-md text-white dark:text-white"
                    ></span>
                  </label>
                </div>
              </div>
            {/if}
          </div>
        </main>
      </div>
    </div>
  </div>
</section>

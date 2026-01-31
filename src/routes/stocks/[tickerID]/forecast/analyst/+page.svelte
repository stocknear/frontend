<script lang="ts">
  import { displayCompanyName, screenWidth, stockTicker } from "$lib/store";
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import AnalystInfo from "$lib/components/AnalystInfo.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import {
    stock_detail_forecast_analyst_all,
    stock_detail_forecast_analyst_col_action,
    stock_detail_forecast_analyst_col_analyst,
    stock_detail_forecast_analyst_col_date,
    stock_detail_forecast_analyst_col_firm,
    stock_detail_forecast_analyst_col_price_target,
    stock_detail_forecast_analyst_col_rating,
    stock_detail_forecast_analyst_col_upside,
    stock_detail_forecast_analyst_consensus,
    stock_detail_forecast_analyst_history,
    stock_detail_forecast_analyst_next,
    stock_detail_forecast_analyst_no_top,
    stock_detail_forecast_analyst_page,
    stock_detail_forecast_analyst_previous,
    stock_detail_forecast_analyst_price_target,
    stock_detail_forecast_analyst_rows,
    stock_detail_forecast_analyst_seo_description,
    stock_detail_forecast_analyst_seo_keywords,
    stock_detail_forecast_analyst_seo_title,
    stock_detail_forecast_analyst_structured_desc,
    stock_detail_forecast_analyst_structured_name,
    stock_detail_forecast_analyst_title,
    stock_detail_forecast_analyst_top,
    stock_detail_forecast_analyst_top_info,
    stock_detail_forecast_analyst_total,
    stock_detail_forecast_analyst_upside,
    stock_detail_forecast_new,
  } from "$lib/paraglide/messages";

  import { removeCompanyStrings } from "$lib/utils";
  export let data;

  const PREMIUM_TIERS = ["Pro", "Plus"];
  const DEFAULT_ROWS_PER_PAGE = 20;
  const rowsPerPageOptions = [20, 50, 100];

  let analystRating = {};

  let rawData = [];
  let paginatedData = [];
  let priceTarget = "n/a";
  let numOfAnalyst = "n/a";
  let consensusRating = "n/a";
  let changesPercentage = "n/a";
  let currentPage = 1;
  let rowsPerPage = DEFAULT_ROWS_PER_PAGE;
  let totalPages = 1;
  let pagePathName = $page?.url?.pathname;

  $: tabs = [
    stock_detail_forecast_analyst_all(),
    stock_detail_forecast_analyst_top(),
  ];

  // Static column config for sort initialization (labels are reactive separately)
  const columnConfig = [
    { key: "analyst_name", type: "string", align: "left" },
    { key: "analyst", type: "string", align: "left" },
    { key: "rating_current", type: "string", align: "right" },
    { key: "action_company", type: "string", align: "right" },
    { key: "adjusted_pt_current", type: "number", align: "right" },
    { key: "upside", type: "number", align: "right" },
    { key: "date", type: "date", align: "right" },
  ];

  $: columnDefinitions = [
    { ...columnConfig[0], label: stock_detail_forecast_analyst_col_analyst() },
    { ...columnConfig[1], label: stock_detail_forecast_analyst_col_firm() },
    { ...columnConfig[2], label: stock_detail_forecast_analyst_col_rating() },
    { ...columnConfig[3], label: stock_detail_forecast_analyst_col_action() },
    {
      ...columnConfig[4],
      label: stock_detail_forecast_analyst_col_price_target(),
    },
    { ...columnConfig[5], label: stock_detail_forecast_analyst_col_upside() },
    { ...columnConfig[6], label: stock_detail_forecast_analyst_col_date() },
  ];

  let activeIdx = 0;
  let isPremiumUser = PREMIUM_TIERS.includes(data?.user?.tier);
  let originalData = [];

  const orderCycle = ["none", "asc", "desc"];

  const createInitialSortOrders = () =>
    columnConfig.reduce((acc, column) => {
      acc[column.key] = { order: "none", type: column.type };
      return acc;
    }, {});

  let sortOrders = createInitialSortOrders();
  let currentSortKey = null;

  function resetSortState() {
    sortOrders = createInitialSortOrders();
    currentSortKey = null;
  }

  function resolveSortValue(item, key) {
    if (!item) return null;
    switch (key) {
      case "analyst_name":
        return item?.analyst_name ?? "";
      case "analyst":
        return item?.analyst ?? "";
      case "rating_current":
        return item?.rating_current ?? "";
      case "action_company":
        return item?.action_company ?? "";
      case "adjusted_pt_current": {
        const value = Number(item?.adjusted_pt_current);
        return Number.isFinite(value) ? value : null;
      }
      case "upside": {
        const target = Number(item?.adjusted_pt_current);
        const price = Number(data?.getStockQuote?.price);
        if (
          !Number.isFinite(target) ||
          !Number.isFinite(price) ||
          price === 0
        ) {
          return null;
        }
        return (target / price - 1) * 100;
      }
      case "date":
        return item?.date ? new Date(item.date).getTime() : null;
      default:
        return item?.[key] ?? null;
    }
  }

  function compareValues(a, b, key, order, type) {
    const valueA = resolveSortValue(a, key);
    const valueB = resolveSortValue(b, key);

    const missingA =
      valueA === null || valueA === undefined || Number.isNaN(valueA);
    const missingB =
      valueB === null || valueB === undefined || Number.isNaN(valueB);

    if (missingA && missingB) return 0;
    if (missingA) return 1;
    if (missingB) return -1;

    if (type === "string") {
      const aStr = String(valueA).toUpperCase();
      const bStr = String(valueB).toUpperCase();
      return order === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    }

    return order === "asc" ? valueA - valueB : valueB - valueA;
  }

  function sortData(key) {
    const nextOrder =
      orderCycle[
        (orderCycle.indexOf(sortOrders[key]?.order ?? "none") + 1) %
          orderCycle.length
      ];

    sortOrders = columnConfig.reduce((acc, column) => {
      acc[column.key] = {
        ...sortOrders[column.key],
        order: column.key === key ? nextOrder : "none",
      };
      return acc;
    }, {});

    currentSortKey = nextOrder === "none" ? null : key;

    if (nextOrder === "none") {
      rawData = [...originalData];
    } else {
      const sortType = sortOrders[key]?.type ?? "string";
      rawData = [...originalData].sort((a, b) =>
        compareValues(a, b, key, nextOrder, sortType),
      );
    }

    currentPage = 1;
    updatePaginatedData();
    sortOrders = { ...sortOrders };
  }

  function filterLatestEntries(dataSet) {
    const latestEntries = {};

    dataSet?.forEach((entry) => {
      try {
        const key = `${entry.analyst}-${entry.name}`;
        const dateTime = new Date(`${entry.date}`);

        if (!latestEntries[key] || dateTime > latestEntries[key].dateTime) {
          latestEntries[key] = { dateTime, entry };
        }
      } catch (e) {
        console.error(`Error processing entry: ${e}`);
      }
    });

    return Object.values(latestEntries).map((value: any) => value.entry);
  }

  function getPaginationStorageKey(tabIndex = activeIdx) {
    const path = pagePathName || $page?.url?.pathname;
    if (!path) return null;
    return `${path}_analyst_tab_${tabIndex}_rowsPerPage`;
  }

  function loadRowsPerPage(tabIndex = activeIdx) {
    if (!browser) return rowsPerPage;
    const key = getPaginationStorageKey(tabIndex);
    if (!key) return rowsPerPage;

    try {
      const savedRows = localStorage.getItem(key);
      const parsedRows = savedRows ? Number(savedRows) : NaN;
      if (rowsPerPageOptions.includes(parsedRows)) {
        return parsedRows;
      }
    } catch (error) {
      console.warn("Failed to load rows per page preference:", error);
    }
    return DEFAULT_ROWS_PER_PAGE;
  }

  function saveRowsPerPage(tabIndex = activeIdx) {
    if (!browser) return;
    const key = getPaginationStorageKey(tabIndex);
    if (!key) return;
    try {
      localStorage.setItem(key, String(rowsPerPage));
    } catch (error) {
      console.warn("Failed to save rows per page preference:", error);
    }
  }

  function updatePaginatedData() {
    if (!isPremiumUser) {
      paginatedData = rawData?.slice(0, 3) ?? [];
      totalPages = 1;
      currentPage = 1;
      return;
    }

    const totalItems = rawData?.length ?? 0;
    totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage) || 1);

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    if (currentPage < 1) {
      currentPage = 1;
    }

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    paginatedData = rawData?.slice(startIndex, endIndex) ?? [];
  }

  function initializePagination() {
    if (!isPremiumUser) {
      paginatedData = rawData?.slice(0, 3) ?? [];
      totalPages = 1;
      currentPage = 1;
      return;
    }

    const storedRows = loadRowsPerPage(activeIdx);
    if (rowsPerPageOptions.includes(storedRows) && storedRows !== rowsPerPage) {
      rowsPerPage = storedRows;
    } else if (!rowsPerPageOptions.includes(rowsPerPage)) {
      rowsPerPage = DEFAULT_ROWS_PER_PAGE;
    }
    currentPage = 1;
    updatePaginatedData();
  }

  function goToPage(pageNumber: number) {
    if (!isPremiumUser) return;
    if (pageNumber < 1 || pageNumber > totalPages || pageNumber === currentPage)
      return;
    currentPage = pageNumber;
    updatePaginatedData();
  }

  function changeRowsPerPage(newRowsPerPage: number) {
    if (!isPremiumUser) return;
    if (rowsPerPage === newRowsPerPage) return;
    rowsPerPage = newRowsPerPage;
    currentPage = 1;
    updatePaginatedData();
    saveRowsPerPage();
  }

  function changeTab(index: number) {
    activeIdx = index;

    if (Object.keys(analystRating ?? {}).length !== 0) {
      numOfAnalyst = analystRating?.numOfAnalyst;
      priceTarget =
        analystRating?.medianPriceTarget !== ("n/a" && 0)
          ? analystRating?.medianPriceTarget
          : "-";
      consensusRating = analystRating?.consensusRating;
      changesPercentage =
        analystRating?.medianPriceTarget !== "n/a" &&
        analystRating?.medianPriceTarget !== null &&
        analystRating?.medianPriceTarget !== undefined &&
        data?.getStockQuote?.price !== null
          ? (
              (analystRating.medianPriceTarget / data.getStockQuote.price - 1) *
              100
            )?.toFixed(2)
          : "-";
    }

    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    const topAnalystEntries = filterLatestEntries(
      data?.getAnalystTickerHistory?.filter(
        (item) => item?.analystScore >= 4,
      ) ?? [],
    );

    let dataset = [];

    if (activeIdx === 1) {
      const recentData =
        topAnalystEntries
          ?.filter((item) => {
            const date = new Date(item?.date);
            return date >= oneYearAgo;
          })
          ?.slice(0, 30) ?? [];

      const filteredAnalystCount = recentData?.length ?? 0;
      const priceTargets = recentData
        ?.map((item) => parseFloat(item?.adjusted_pt_current))
        ?.filter((pt) => !isNaN(pt));
      const medianPriceTarget = priceTargets?.length
        ? priceTargets?.sort((a, b) => a - b)[
            Math.floor(priceTargets?.length / 2)
          ]
        : "n/a";

      numOfAnalyst = filteredAnalystCount === 0 ? "n/a" : filteredAnalystCount;
      priceTarget = medianPriceTarget;
      changesPercentage =
        medianPriceTarget !== "-" &&
        medianPriceTarget !== "n/a" &&
        data?.getStockQuote?.price != null
          ? (
              (medianPriceTarget / data?.getStockQuote.price - 1) *
              100
            )?.toFixed(2)
          : "n/a";

      const ratingScores = {
        "Strong Buy": 5,
        Buy: 4,
        Hold: 3,
        Sell: 2,
        "Strong Sell": 1,
      };

      const totalRatingScore = recentData
        ?.map((item) => ratingScores[item.rating_current] || 0)
        ?.reduce((sum, score) => sum + score, 0);

      const averageRatingScore = filteredAnalystCount
        ? totalRatingScore / filteredAnalystCount
        : 0;

      consensusRating =
        averageRatingScore >= 4.5
          ? "Strong Buy"
          : averageRatingScore >= 3.5
            ? "Buy"
            : averageRatingScore >= 2.5
              ? "Hold"
              : averageRatingScore >= 1.5
                ? "Sell"
                : averageRatingScore >= 1
                  ? "Strong Sell"
                  : "n/a";

      dataset = recentData ?? [];
    } else {
      dataset = data?.getAnalystTickerHistory ?? [];
    }

    rawData = Array.isArray(dataset) ? [...dataset] : [];
    originalData = [...rawData];
    resetSortState();
    initializePagination();
  }

  function latestInfoDate(inputDate) {
    // Convert the input date string to milliseconds since epoch
    const inputDateMs = Date?.parse(inputDate);

    // Get today's date in milliseconds since epoch
    const todayMs = Date?.now();

    // Calculate the difference in milliseconds
    const differenceInMs = todayMs - inputDateMs;

    // Convert milliseconds to days
    const differenceInDays = Math?.floor(
      differenceInMs / (1000 * 60 * 60 * 24),
    );

    // Return the difference in days
    return differenceInDays <= 4;
  }

  function formatNumber(value) {
    if (value == null || value === undefined || value === "") {
      return "n/a";
    }

    const num = Number(value);

    if (isNaN(num)) {
      return "n/a";
    }

    // If it's a whole number, don't show decimals
    if (num % 1 === 0) {
      return num.toString();
    }

    // Otherwise, show up to 2 decimal places, removing trailing zeros
    return parseFloat(num.toFixed(2)).toString();
  }

  $: charNumber = $screenWidth < 640 ? 20 : 30;

  $: isPremiumUser = PREMIUM_TIERS.includes(data?.user?.tier);

  $: if ($page?.url?.pathname && $page?.url?.pathname !== pagePathName) {
    pagePathName = $page?.url?.pathname;
    initializePagination();
  }

  $: {
    if ($stockTicker) {
      analystRating = data?.getAnalystSummary ?? {};
      activeIdx = 0;
      changeTab(0);
    }
  }
</script>

<SEO
  title={stock_detail_forecast_analyst_seo_title({
    company: $displayCompanyName,
    ticker: $stockTicker,
  })}
  description={stock_detail_forecast_analyst_seo_description({
    company: $displayCompanyName,
    ticker: $stockTicker,
  })}
  keywords={stock_detail_forecast_analyst_seo_keywords({
    company: $displayCompanyName,
    ticker: $stockTicker,
  })}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/forecast/analyst`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "Review"],
    name: stock_detail_forecast_analyst_structured_name({
      company: $displayCompanyName,
    }),
    description: stock_detail_forecast_analyst_structured_desc({
      company: $displayCompanyName,
      ticker: $stockTicker,
    }),
    url: `https://stocknear.com/stocks/${$stockTicker}/forecast/analyst`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Analyst ratings tracking",
      "Price target analysis",
      "Consensus ratings",
      "Upgrade/downgrade alerts",
      "Research firm opinions",
      "Investment recommendations",
      "Rating history tracking",
      "Analyst accuracy metrics",
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
  }}
/>

<section class=" overflow-hidden h-full min-h-screen mb-40 sm:mb-0 w-full">
  <div class="flex justify-center m-auto h-full overflow-hidden w-full">
    <div
      class="relative flex justify-center items-center overflow-hidden w-full"
    >
      <div class="sm:pl-4 sm:pt-4 w-full m-auto mt-2 sm:mt-0">
        <div class="mb-4">
          <div
            class="mb-5 flex flex-col justify-between gap-y-2.5 sm:mb-2 sm:flex-row sm:items-end"
          >
            <h1 class="mb-px text-xl font-bold sm:text-2xl sm:pl-1">
              {stock_detail_forecast_analyst_title()}
            </h1>
            <div>
              <div class="flex flex-col w-full sm:w-fit items-end justify-end">
                <div class="">
                  <div class="inline-flex">
                    <div
                      class="w-fit flex text-sm items-center gap-1 rounded-full border border-gray-300 shadow dark:border-zinc-700
           "
                    >
                      {#each tabs as item, i (item)}
                        {#if !["Pro", "Plus"]?.includes(data?.user?.tier) && i > 0}
                          <button
                            on:click={() => goto("/pricing")}
                            class="cursor-pointer font-medium rounded-full px-3 py-1.5 focus:z-10 focus:outline-none transition-all
                
                          {activeIdx === i
                              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                              : 'bg-white/80 border-gray-300 text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50 dark:bg-zinc-950/60 dark:border-zinc-700'}"
                          >
                            <span class="relative text-sm block font-semibold">
                              {item}
                              <svg
                                class="inline-block ml-0.5 -mt-1 w-3.5 h-3.5"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                ><path
                                  fill="currentColor"
                                  d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                /></svg
                              >
                            </span>
                          </button>
                        {:else}
                          <button
                            on:click={() => changeTab(i)}
                            class="cursor-pointer font-medium rounded-full px-3 py-1.5 focus:z-10 focus:outline-none transition-all
          {activeIdx === i
                              ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                              : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'}"
                          >
                            {item}
                          </button>
                        {/if}
                      {/each}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="shadow-none mb-4 grid grid-cols-2 grid-rows-2 divide-contrast rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 md:grid-cols-4 md:grid-rows-1 md:divide-x"
        >
          <div
            class="p-4 bp:p-5 sm:p-6 border-r border-gray-300 dark:border-zinc-700"
          >
            <div
              class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
            >
              {stock_detail_forecast_analyst_total()}
            </div>

            <div
              class="mt-1 break-words font-semibold leading-8 text-xl sm:text-2xl"
            >
              {numOfAnalyst}
            </div>
          </div>
          <div
            class="p-4 bp:p-5 sm:p-6 border-r-0 md:border-r border-gray-300 dark:border-zinc-700"
          >
            <div
              class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
            >
              {stock_detail_forecast_analyst_consensus()}
            </div>
            <div
              class="mt-1 break-words font-semibold leading-8 text-xl sm:text-2xl"
            >
              {consensusRating}
            </div>
          </div>
          <div
            class="p-4 bp:p-5 sm:p-6 border-r-0 md:border-r border-t md:border-t-0 border-gray-300 dark:border-zinc-700"
          >
            <div
              class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
            >
              {stock_detail_forecast_analyst_price_target()}
            </div>
            <div
              class="mt-1 break-words font-semibold leading-8 text-xl sm:text-2xl"
            >
              {priceTarget !== null && priceTarget !== undefined
                ? priceTarget
                : "n/a"}
            </div>
          </div>
          <div
            class="p-4 bp:p-5 sm:p-6 border-t border-gray-300 dark:border-zinc-700 md:border-0 border-l border-gray-300 dark:border-zinc-700 md:border-0"
          >
            <div
              class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
            >
              {stock_detail_forecast_analyst_upside()}
            </div>
            <div
              class="mt-1 break-words font-semibold leading-8 text-xl sm:text-2xl {changesPercentage &&
              changesPercentage > 0
                ? "before:content-['+'] after:content-['%'] text-emerald-800 dark:text-emerald-400"
                : changesPercentage && changesPercentage < 0
                  ? "after:content-['%'] text-rose-800 dark:text-rose-400"
                  : ''}"
            >
              {changesPercentage ?? "n/a"}
            </div>
          </div>
        </div>

        {#if rawData?.length !== 0}
          {#if activeIdx === 1}
            <Infobox text={stock_detail_forecast_analyst_top_info()} />
          {/if}

          <div
            class="mt-10 mb-2 items-center justify-between py-0 md:mt-8 md:flex md:py-2"
          >
            <div class="flex justify-between md:block">
              <h3 class="text-xl sm:text-2xl font-bold">
                {stock_detail_forecast_analyst_history()}
              </h3>
            </div>
          </div>

          <div class=" w-full m-auto mb-4 overflow-x-auto lg:overflow-hidden">
            <table
              class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 text-gray-700 dark:text-zinc-200 tabular-nums m-auto"
            >
              <thead>
                <TableHeader
                  columns={columnDefinitions}
                  {sortOrders}
                  {sortData}
                />
              </thead>
              <tbody>
                {#each paginatedData as item, index}
                  <tr
                    class=" {latestInfoDate(item?.date)
                      ? 'bg-gray-50/70 dark:bg-zinc-900/40'
                      : 'transition-colors'} {index + 1 ===
                      paginatedData?.length && !isPremiumUser
                      ? 'opacity-[0.1]'
                      : ''}"
                  >
                    {#each columnDefinitions as column}
                      <td
                        class="text-sm whitespace-nowrap"
                        class:text-left={column.align === "left"}
                        class:text-right={column.align === "right"}
                      >
                        {#if column.key === "analyst_name"}
                          <div class="flex flex-col items-start">
                            <a
                              href={item?.analystId !== null
                                ? `/analysts/${item?.analystId}`
                                : "#"}
                              class="font-semibold dark:font-normal text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                              >{item?.analyst_name}
                            </a>

                            <div class="flex flex-row items-center mt-1">
                              {#each Array.from({ length: 5 }) as _, i}
                                {#if item?.analystScore < 1 && item?.analystScore > 0 && i === 0}
                                  <svg
                                    class="w-4 h-4"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 22 20"
                                  >
                                    <defs>
                                      <linearGradient id="halfGradient">
                                        <stop
                                          offset="30%"
                                          stop-color="#FFA500"
                                        />
                                        <stop offset="30%" stop-color="gray" />
                                      </linearGradient>
                                    </defs>
                                    <path
                                      fill="url(#halfGradient)"
                                      d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"
                                    />
                                  </svg>
                                {:else if i < Math.floor(item?.analystScore)}
                                  <svg
                                    class="w-4 h-4 text-[#FFA500] dark:text-[#FFA500]"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="currentColor"
                                    viewBox="0 0 22 20"
                                  >
                                    <path
                                      d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"
                                    />
                                  </svg>
                                {:else}
                                  <svg
                                    class="w-4 h-4 text-gray-400 dark:text-gray-500"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="currentColor"
                                    viewBox="0 0 22 20"
                                  >
                                    <path
                                      d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"
                                    />
                                  </svg>
                                {/if}
                              {/each}
                            </div>
                          </div>
                        {:else if column.key === "analyst"}
                          {item?.analyst?.length > charNumber
                            ? item?.analyst?.slice(0, charNumber) + "..."
                            : item?.analyst}
                        {:else if column.key === "rating_current"}
                          <div
                            class={["Bullish", "Buy", "Strong Buy"]?.includes(
                              item[column.key],
                            )
                              ? "text-emerald-800 dark:text-emerald-400"
                              : ["Neutral", "Hold"]?.includes(item[column.key])
                                ? "text-[#E57C34] dark:text-yellow-500"
                                : ["Bearish", "Sell", "Strong Sell"]?.includes(
                                      item[column.key],
                                    )
                                  ? "text-rose-800 dark:text-rose-400"
                                  : ""}
                          >
                            {item?.rating_current}
                          </div>
                        {:else if column.key === "action_company"}
                          {item?.action_company?.replace(
                            "Initiates Coverage On",
                            "Initiates",
                          )}
                        {:else if column.key === "adjusted_pt_current"}
                          <div class="flex flex-col items-end">
                            <div class="flex flex-row items-center">
                              {#if Math?.ceil(item?.adjusted_pt_prior) !== 0}
                                <span class="font-normal">
                                  {formatNumber(item?.adjusted_pt_prior)}
                                </span>
                                <svg
                                  class="w-3 h-3 ml-1 mr-1 inline-block"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2.5"
                                    d="M4 12h16m0 0l-6-6m6 6l-6 6"
                                  />
                                </svg>
                                <span
                                  >{formatNumber(
                                    item?.adjusted_pt_current,
                                  )}</span
                                >
                              {:else if Math?.ceil(item?.adjusted_pt_current) !== 0}
                                <span
                                  >{formatNumber(
                                    item?.adjusted_pt_current,
                                  )}</span
                                >
                              {:else}
                                <span>n/a</span>
                              {/if}
                            </div>
                          </div>
                        {:else if column.key === "upside"}
                          {#if Math?.ceil(item?.adjusted_pt_current) !== 0 && data?.getStockQuote?.price}
                            {@const upsideValue =
                              (item?.adjusted_pt_current /
                                data?.getStockQuote?.price -
                                1) *
                                100 || 0}
                            <span
                              class="text-sm whitespace-nowrap {upsideValue >= 0
                                ? "before:content-['+'] text-emerald-800 dark:text-emerald-400"
                                : upsideValue < 0
                                  ? 'text-rose-800 dark:text-rose-400'
                                  : ''}"
                            >
                              {upsideValue?.toFixed(2)}%
                            </span>
                          {:else}
                            <span>n/a</span>
                          {/if}
                        {:else if column.key === "date"}
                          <div class="flex flex-col items-end">
                            {#if latestInfoDate(item?.date)}
                              <label
                                class="rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/50 text-gray-700 dark:text-zinc-200 font-semibold text-xs px-2 py-0.5 mb-1"
                              >
                                {stock_detail_forecast_new()}
                              </label>
                            {/if}
                            {new Date(item?.date).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              daySuffix: "2-digit",
                              timeZone: "UTC",
                            })}
                          </div>
                        {/if}
                      </td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          {#if isPremiumUser}
            <div
              class="flex flex-col gap-3 mt-6 sm:flex-row sm:items-center sm:justify-between"
            >
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
                    >{stock_detail_forecast_analyst_previous()}</span
                  >
                </Button>
              </div>

              <div class="flex flex-row items-center gap-4">
                <span class="text-sm text-gray-600 dark:text-zinc-300">
                  {stock_detail_forecast_analyst_page({
                    current: currentPage,
                    total: totalPages,
                  })}
                </span>

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild let:builder>
                    <Button
                      builders={[builder]}
                      class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <span class="truncate text-[0.85rem] sm:text-sm">
                        {stock_detail_forecast_analyst_rows({
                          count: rowsPerPage,
                        })}
                      </span>
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
                      {#each rowsPerPageOptions as item}
                        <DropdownMenu.Item
                          class="text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
                        >
                          <label
                            on:click={() => changeRowsPerPage(item)}
                            class="inline-flex justify-between w-full items-center cursor-pointer"
                          >
                            <span class="text-sm"
                              >{stock_detail_forecast_analyst_rows({
                                count: item,
                              })}</span
                            >
                          </label>
                        </DropdownMenu.Item>
                      {/each}
                    </DropdownMenu.Group>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </div>

              <div class="flex items-center gap-2">
                <Button
                  on:click={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span class="hidden sm:inline"
                    >{stock_detail_forecast_analyst_next()}</span
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
        {:else if activeIdx === 1}
          <Infobox
            text={stock_detail_forecast_analyst_no_top({
              company: removeCompanyStrings($displayCompanyName),
            })}
          />
        {/if}

        {#if rawData?.length !== 0}
          <UpgradeToPro {data} />
        {/if}
        {#if !["Pro", "Plus"]?.includes(data?.user?.tier)}
          <AnalystInfo />
        {/if}
      </div>
    </div>
  </div>
</section>

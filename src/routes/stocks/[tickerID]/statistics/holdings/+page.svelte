<script lang="ts">
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import {
    displayCompanyName,
    isOpen,
    screenWidth,
    stockTicker,
  } from "$lib/store";
  import {
    abbreviateNumber,
    calculateChange,
    removeCompanyStrings,
  } from "$lib/utils";
  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import highcharts from "$lib/highcharts.ts";
  import { onDestroy, onMount } from "svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { mode } from "mode-watcher";
  import {
    etf_detail_holdings_change,
    etf_detail_holdings_price,
    etf_detail_holdings_shares,
    etf_detail_holdings_stocks_count,
    etf_detail_holdings_weight,
    etf_main_no_results,
    etf_search_placeholder,
    etf_table_column_fund_name,
    etf_table_column_symbol,
    stock_detail_back_to_top,
    stock_detail_next,
    stock_detail_page_of,
    stock_detail_previous,
    stock_detail_rows,
  } from "$lib/paraglide/messages";

  type HoldingExposure = {
    symbol: string;
    name: string;
    weightPercentage: number | null;
    marketValue: number | null;
    sharesNumber: number | null;
    price: number | null;
    changesPercentage: number | null;
    marketCap: number | null;
    previous?: number | null;
  };

  type SortType = "number" | "string";
  type SortOrder = "asc" | "desc" | "none";

  export let data;

  const DEFAULT_ROWS_PER_PAGE = 20;
  const rowsPerPageOptions = [20, 50, 100];

  let rawData: HoldingExposure[] = [];
  let summaryData: HoldingExposure[] = [];
  let filteredTableData: HoldingExposure[] = [];
  let paginatedTableData: HoldingExposure[] = [];
  let inputValue = "";
  let currentPage = 1;
  let rowsPerPage = DEFAULT_ROWS_PER_PAGE;
  let totalPages = 1;
  let pagePathName = "";
  let charNumber = 35;
  let priceSocket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let lastSubscriptionKey: string | null = null;
  let pendingQuoteUpdates = new Map<string, number>();
  let flushAnimationFrame: number | null = null;
  let hasMounted = false;
  let sourceHoldingsRef: HoldingExposure[] | null = null;

  let companyLabel = "";
  let infoText = "";
  let topTenWeight = 0;
  let totalMarketValue = 0;
  let largestExposure: HoldingExposure | null = null;
  let configBarChart;
  let configPieChart;
  const PRICE_SOCKET_RECONNECT_DELAY = 1500;

  const allocationColors = [
    "#2B5F75",
    "#4A7BA7",
    "#8B5A9B",
    "#C85A9B",
    "#E85A85",
    "#F5756B",
    "#F9A05C",
    "#FFC04D",
    "#FFD93D",
    "#4A6B8A",
    "#7C8797",
  ];

  const columns = [
    { key: "symbol", label: etf_table_column_symbol(), align: "left" },
    { key: "name", label: etf_table_column_fund_name(), align: "left" },
    { key: "price", label: etf_detail_holdings_price(), align: "right" },
    {
      key: "changesPercentage",
      label: etf_detail_holdings_change(),
      align: "right",
    },
    { key: "marketValue", label: "Market Value", align: "right" },
    {
      key: "sharesNumber",
      label: etf_detail_holdings_shares(),
      align: "right",
    },
    {
      key: "weightPercentage",
      label: etf_detail_holdings_weight(),
      align: "right",
    },
  ];

  let sortOrders: Record<string, { order: SortOrder; type: SortType }> = {
    symbol: { order: "none", type: "string" },
    name: { order: "none", type: "string" },
    price: { order: "none", type: "number" },
    changesPercentage: { order: "none", type: "number" },
    marketValue: { order: "none", type: "number" },
    sharesNumber: { order: "none", type: "number" },
    weightPercentage: { order: "none", type: "number" },
  };

  function sumBy(
    items: HoldingExposure[],
    key: keyof HoldingExposure,
    limit: number | null = null,
  ): number {
    const source = typeof limit === "number" ? items.slice(0, limit) : items;
    return source.reduce((total, item) => {
      const value = item?.[key];
      return total + (typeof value === "number" ? value : 0);
    }, 0);
  }

  function generateInfoText(): string {
    if (!summaryData.length) {
      return `<span>No ETF exposure data is currently available for ${companyLabel}.</span>`;
    }

    const topHoldings = summaryData
      .slice(0, 5)
      .map((item) => {
        const weight = item?.weightPercentage ?? 0;
        return `${removeCompanyStrings(item?.name || item?.symbol)} at ${weight.toFixed(2)}%`;
      })
      .join(", ")
      .replace(/, ([^,]*)$/, ", and $1");

    return `<span>${companyLabel} currently has exposure to ${summaryData.length.toLocaleString("en-US")} ETFs, led by ${topHoldings}.</span>`;
  }

  function buildAllocationChartSeries() {
    const weightedItems = summaryData
      .filter(
        (item) => typeof item?.marketValue === "number" && item.marketValue > 0,
      )
      .sort(
        (left, right) =>
          (right.marketValue ?? Number.NEGATIVE_INFINITY) -
          (left.marketValue ?? Number.NEGATIVE_INFINITY),
      );

    const topItems = weightedItems.slice(0, 10).map((item, index) => ({
      name: item.symbol,
      y: item.marketValue as number,
      color: allocationColors[index % allocationColors.length],
    }));

    const otherWeight = weightedItems
      .slice(10)
      .reduce((total, item) => total + (item.marketValue ?? 0), 0);

    if (otherWeight > 0) {
      topItems.push({
        name: "Other",
        y: Number(otherWeight.toFixed(2)),
        color: allocationColors[allocationColors.length - 1],
      });
    }

    return topItems;
  }

  function plotPieChart() {
    const pieData = buildAllocationChartSeries();

    return {
      credits: {
        enabled: false,
      },
      chart: {
        backgroundColor: $mode === "light" ? "transparent" : "transparent",
        plotBackgroundColor: $mode === "light" ? "transparent" : "transparent",
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
            distance: 20,
            style: {
              color: $mode === "light" ? "#4B5563" : "#A1A1AA",
              fontSize: "12px",
              fontWeight: "500",
              textOutline: "none",
            },
            formatter: function () {
              return `<span style="font-weight: 600">${this.point.name}:</span> ${abbreviateNumber(this.y, false, true)}`;
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
          name: "ETF Allocation",
          data: pieData,
          animation: false,
        },
      ],
      legend: {
        enabled: false,
      },
    };
  }

  function plotBarChart() {
    const allocationData = buildAllocationChartSeries();
    const categories = allocationData.map((item) => item.name);
    const values = allocationData.map((item) => item.y);
    const maxValue = values.length > 0 ? Math.max(...values) : 0;

    return {
      credits: {
        enabled: false,
      },
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        type: "bar",
        height: Math.max(360, categories.length * 34 + 40),
        animation: false,
      },
      title: {
        text: null,
      },
      xAxis: {
        categories,
        title: {
          text: null,
        },
        labels: {
          style: {
            color: $mode === "light" ? "#4B5563" : "#A1A1AA",
            fontSize: "12px",
            fontWeight: "500",
          },
        },
        lineWidth: 0,
        tickLength: 0,
      },
      yAxis: {
        min: 0,
        max: maxValue > 0 ? Math.ceil(maxValue / 5) * 5 : 5,
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
            inside: false,
            align: "right",
            style: {
              color: $mode === "light" ? "#374151" : "#E5E7EB",
              fontSize: "12px",
              fontWeight: "600",
              textOutline: "none",
            },
            formatter: function () {
              return abbreviateNumber(this.y, false, true);
            },
          },
          colorByPoint: true,
          colors: allocationColors,
          borderWidth: 0,
          pointPadding: 0.12,
          groupPadding: 0.08,
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
          name: "ETF Allocation",
          data: allocationData.map((item) => ({
            y: item.y,
            color: item.color,
          })),
          animation: false,
        },
      ],
      legend: {
        enabled: false,
      },
    };
  }

  function compareForSort(
    left: HoldingExposure,
    right: HoldingExposure,
    key: keyof HoldingExposure,
    type: SortType,
    order: Exclude<SortOrder, "none">,
  ): number {
    const direction = order === "asc" ? 1 : -1;

    if (type === "string") {
      const valueA = (left?.[key] ?? "").toString().toLowerCase();
      const valueB = (right?.[key] ?? "").toString().toLowerCase();
      return valueA.localeCompare(valueB) * direction;
    }

    const rawA = Number(left?.[key]);
    const rawB = Number(right?.[key]);
    const fallback =
      order === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    const isValidA =
      left?.[key] !== null &&
      left?.[key] !== undefined &&
      Number.isFinite(rawA);
    const isValidB =
      right?.[key] !== null &&
      right?.[key] !== undefined &&
      Number.isFinite(rawB);
    const safeA = isValidA ? rawA : fallback;
    const safeB = isValidB ? rawB : fallback;

    if (safeA === safeB) {
      return 0;
    }

    return safeA < safeB ? -1 * direction : 1 * direction;
  }

  function sortData(key: string) {
    if (!sortOrders[key]) {
      return;
    }

    const orderCycle: SortOrder[] = ["none", "asc", "desc"];
    const nextSortOrders = { ...sortOrders };

    for (const sortKey in nextSortOrders) {
      if (sortKey !== key) {
        nextSortOrders[sortKey] = {
          ...nextSortOrders[sortKey],
          order: "none",
        };
      }
    }

    const currentOrderIndex = orderCycle.indexOf(nextSortOrders[key].order);
    nextSortOrders[key] = {
      ...nextSortOrders[key],
      order: orderCycle[(currentOrderIndex + 1) % orderCycle.length],
    };

    sortOrders = nextSortOrders;
    currentPage = 1;
  }

  function matchesSearch(item: HoldingExposure, query: string): boolean {
    if (!query) {
      return true;
    }

    const name = item?.name?.toLowerCase() ?? "";
    const symbol = item?.symbol?.toLowerCase() ?? "";

    return name.includes(query) || symbol.includes(query);
  }

  function resetTableSearch() {
    inputValue = "";
    currentPage = 1;
  }

  function goToPage(pageNumber: number) {
    if (pageNumber < 1 || pageNumber > totalPages) {
      return;
    }

    currentPage = pageNumber;
  }

  function changeRowsPerPage(newRowsPerPage: number) {
    if (rowsPerPage === newRowsPerPage) {
      return;
    }

    rowsPerPage = newRowsPerPage;
    currentPage = 1;
    saveRowsPerPage(rowsPerPage);
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function getPaginationKey(pathName?: string): string | null {
    const currentPath =
      pathName || (browser ? window.location.pathname || "" : "");

    if (!currentPath) {
      return null;
    }

    return `${currentPath}_stock_holdings_rowsPerPage`;
  }

  function loadRowsPerPageFromStorage(pathName?: string): number {
    const paginationKey = getPaginationKey(pathName);

    if (!paginationKey || !browser) {
      return DEFAULT_ROWS_PER_PAGE;
    }

    try {
      const savedRows = localStorage.getItem(paginationKey);
      const parsedRows = savedRows ? Number(savedRows) : NaN;

      if (rowsPerPageOptions.includes(parsedRows)) {
        return parsedRows;
      }
    } catch (error) {
      console.warn("Failed to load rows per page preference:", error);
    }

    return DEFAULT_ROWS_PER_PAGE;
  }

  function saveRowsPerPage(value: number) {
    const paginationKey = getPaginationKey(pagePathName);

    if (!paginationKey || !browser) {
      return;
    }

    try {
      localStorage.setItem(paginationKey, String(value));
    } catch (error) {
      console.warn("Failed to save rows per page preference:", error);
    }
  }

  function formatPrice(value: number | null): string {
    return typeof value === "number" ? value.toFixed(2) : "-";
  }

  function formatLargeNumber(value: number | null): string {
    return typeof value === "number"
      ? abbreviateNumber(value, false, true)
      : "-";
  }

  function formatWeight(value: number | null): string {
    if (value == null) {
      return "-";
    }

    if (value === 0) {
      return "0.00%";
    }

    return Math.abs(value) >= 0.01 ? `${value.toFixed(2)}%` : "< 0.01%";
  }

  function formatSignedPercent(value: number | null): string {
    if (value == null) {
      return "-";
    }

    if (value > 0) {
      return `+${value.toFixed(2)}%`;
    }

    return `${value.toFixed(2)}%`;
  }

  function getSignedPercentClass(value: number | null): string {
    if (value == null || value === 0) {
      return "text-gray-600 dark:text-zinc-300";
    }

    return value > 0
      ? "text-emerald-800 dark:text-emerald-400"
      : "text-rose-800 dark:text-rose-400";
  }

  function getRealtimeSymbols(): string[] {
    const symbols = new Set<string>();
    for (const item of rawData) {
      const symbol = item?.symbol?.toUpperCase?.();
      if (symbol) {
        symbols.add(symbol);
      }
    }
    return Array.from(symbols);
  }

  function shouldUseRealtime(): boolean {
    return (
      hasMounted &&
      $isOpen &&
      typeof data?.wsURL === "string" &&
      data.wsURL.length > 0 &&
      getRealtimeSymbols().length > 0
    );
  }

  function clearPendingQuoteUpdates() {
    pendingQuoteUpdates.clear();
    if (flushAnimationFrame !== null && typeof window !== "undefined") {
      window.cancelAnimationFrame(flushAnimationFrame);
    }
    flushAnimationFrame = null;
  }

  function clearReconnectTimer() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function cleanupPriceSocket() {
    clearPendingQuoteUpdates();
    clearReconnectTimer();
    lastSubscriptionKey = null;

    const socketToClose = priceSocket;
    priceSocket = null;

    if (
      socketToClose &&
      (socketToClose.readyState === WebSocket.OPEN ||
        socketToClose.readyState === WebSocket.CONNECTING)
    ) {
      try {
        socketToClose.close();
      } catch (error) {
        console.error("Error closing holdings price socket:", error);
      }
    }
  }

  function sendPriceSubscription(symbols: string[]) {
    if (!priceSocket || priceSocket.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      priceSocket.send(JSON.stringify(symbols));
      lastSubscriptionKey = symbols.slice().sort().join("|");
    } catch (error) {
      console.error("Failed to send holdings price subscription:", error);
    }
  }

  function scheduleReconnect() {
    if (reconnectTimer || !shouldUseRealtime()) {
      return;
    }

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connectPriceSocket();
    }, PRICE_SOCKET_RECONNECT_DELAY);
  }

  function applyRealtimeQuoteUpdates(
    updates: Array<{ symbol: string; avgPrice: number }>,
  ) {
    if (!updates.length || rawData.length === 0) {
      return;
    }

    const clonedRows = rawData.map((item) => ({ ...item }));
    const nextRows = calculateChange(clonedRows, updates) as HoldingExposure[];
    rawData = nextRows.map((item) => ({ ...item }));
  }

  function flushRealtimeQuoteUpdates() {
    if (pendingQuoteUpdates.size === 0) {
      return;
    }

    const updates = Array.from(pendingQuoteUpdates.entries()).map(
      ([symbol, avgPrice]) => ({
        symbol,
        avgPrice,
      }),
    );

    pendingQuoteUpdates.clear();
    applyRealtimeQuoteUpdates(updates);
  }

  function scheduleRealtimeFlush() {
    if (flushAnimationFrame !== null || typeof window === "undefined") {
      return;
    }

    flushAnimationFrame = window.requestAnimationFrame(() => {
      flushAnimationFrame = null;
      flushRealtimeQuoteUpdates();
    });
  }

  function handlePriceSocketMessage(raw: unknown) {
    if (typeof raw !== "string") {
      return;
    }

    try {
      const payload = JSON.parse(raw);
      const updates = Array.isArray(payload) ? payload : [payload];

      for (const item of updates) {
        const symbol = item?.symbol?.toUpperCase?.();
        const avgPrice = item?.avgPrice;

        if (
          !symbol ||
          typeof avgPrice !== "number" ||
          !Number.isFinite(avgPrice) ||
          avgPrice <= 0
        ) {
          continue;
        }

        pendingQuoteUpdates.set(symbol, avgPrice);
      }

      scheduleRealtimeFlush();
    } catch (error) {
      console.error("Error parsing holdings WebSocket payload:", error);
    }
  }

  function connectPriceSocket() {
    if (!shouldUseRealtime()) {
      return;
    }

    if (
      priceSocket &&
      (priceSocket.readyState === WebSocket.OPEN ||
        priceSocket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      priceSocket = new WebSocket(`${data.wsURL}/price-data`);
    } catch (error) {
      console.error("Failed establishing holdings price socket:", error);
      priceSocket = null;
      scheduleReconnect();
      return;
    }

    priceSocket.addEventListener("open", () => {
      clearReconnectTimer();
      sendPriceSubscription(getRealtimeSymbols());
    });

    priceSocket.addEventListener("message", (event) => {
      handlePriceSocketMessage(event?.data);
    });

    priceSocket.addEventListener("close", () => {
      priceSocket = null;
      lastSubscriptionKey = null;
      if (shouldUseRealtime()) {
        scheduleReconnect();
      }
    });

    priceSocket.addEventListener("error", (error) => {
      console.error("Holdings price socket error:", error);
      if (priceSocket) {
        try {
          priceSocket.close();
        } catch (closeError) {
          console.error(
            "Failed closing errored holdings price socket:",
            closeError,
          );
        }
      }
    });
  }

  function syncPriceSubscription() {
    const symbols = getRealtimeSymbols();
    if (!shouldUseRealtime()) {
      cleanupPriceSocket();
      return;
    }

    const nextSubscriptionKey = symbols.slice().sort().join("|");

    if (priceSocket?.readyState === WebSocket.OPEN) {
      if (nextSubscriptionKey !== lastSubscriptionKey) {
        sendPriceSubscription(symbols);
      }
      return;
    }

    if (priceSocket?.readyState === WebSocket.CONNECTING) {
      return;
    }

    connectPriceSocket();
  }

  onMount(() => {
    hasMounted = true;
    pagePathName = $page?.url?.pathname || "";
    rowsPerPage = loadRowsPerPageFromStorage(pagePathName);
    syncPriceSubscription();
  });

  onDestroy(() => {
    hasMounted = false;
    clearPendingQuoteUpdates();
    cleanupPriceSocket();
  });

  $: if (
    browser &&
    $page?.url?.pathname &&
    $page.url.pathname !== pagePathName
  ) {
    pagePathName = $page.url.pathname;
    rowsPerPage = loadRowsPerPageFromStorage(pagePathName);
    currentPage = 1;
  }

  $: if (
    Array.isArray(data?.getETFHoldings) &&
    data.getETFHoldings !== sourceHoldingsRef
  ) {
    sourceHoldingsRef = data.getETFHoldings;
    const nextRows = data.getETFHoldings.map((item) => ({ ...item }));
    summaryData = nextRows.map((item) => ({ ...item }));
    rawData = nextRows.map((item) => ({ ...item }));
  }
  $: companyLabel = $displayCompanyName || $stockTicker || "this stock";
  $: charNumber = $screenWidth < 640 ? 25 : 35;
  $: topTenWeight = sumBy(summaryData, "weightPercentage", 10);
  $: totalMarketValue = sumBy(summaryData, "marketValue");
  $: largestExposure = summaryData[0] ?? null;
  $: infoText = generateInfoText();
  $: {
    if ($mode && typeof window !== "undefined") {
      configBarChart = plotBarChart() || null;
      configPieChart = plotPieChart() || null;
    }
  }
  $: if (hasMounted) {
    if ($isOpen) {
      syncPriceSubscription();
    } else {
      cleanupPriceSocket();
    }
  }
  $: if (hasMounted && rawData.length > 0) {
    syncPriceSubscription();
  }
  $: {
    const query = inputValue.trim().toLowerCase();
    const activeSortKey = Object.keys(sortOrders).find(
      (key) => sortOrders[key].order !== "none",
    ) as keyof HoldingExposure | undefined;

    let workingList = query
      ? rawData.filter((item) => matchesSearch(item, query))
      : [...rawData];

    if (activeSortKey) {
      const { order, type } = sortOrders[activeSortKey];

      if (order !== "none") {
        workingList = [...workingList].sort((left, right) =>
          compareForSort(left, right, activeSortKey, type, order),
        );
      }
    }

    filteredTableData = workingList;

    const safeRowsPerPage =
      rowsPerPage && rowsPerPage > 0 ? rowsPerPage : DEFAULT_ROWS_PER_PAGE;
    const nextTotalPages = Math.max(
      1,
      Math.ceil(filteredTableData.length / safeRowsPerPage),
    );

    totalPages = nextTotalPages;

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    if (currentPage < 1) {
      currentPage = 1;
    }

    const startIndex = (currentPage - 1) * safeRowsPerPage;
    paginatedTableData = filteredTableData.slice(
      startIndex,
      startIndex + safeRowsPerPage,
    );
  }
</script>

<SEO
  title={`${companyLabel} (${$stockTicker}) ETF Holdings & Exposure`}
  description={`ETF exposure breakdown for ${companyLabel} (${$stockTicker}) with holdings ranked by market value, plus weight, share count, price, and live price change.`}
  keywords={`${$stockTicker} ETF holdings, ${companyLabel} ETF exposure, ETF ownership by stock, ETF holders of ${$stockTicker}, ETF exposure table`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${companyLabel} ETF Holdings & Exposure`,
    description: `ETF exposure breakdown for ${companyLabel} (${$stockTicker}) ranked by market value.`,
    url: `https://stocknear.com/stocks/${$stockTicker}/statistics/holdings`,
  }}
/>

<section
  class="overflow-hidden h-full min-h-screen mb-20 sm:mb-0 w-full mt-2 sm:mt-0 text-gray-700 dark:text-zinc-200"
>
  <div class="flex justify-center m-auto h-full overflow-hidden w-full">
    <div
      class="relative flex justify-center items-center overflow-hidden w-full"
    >
      <div class="mt-5 sm:mt-0 sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto">
        <div class="mb-4">
          <h1
            class="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
          >
            ETF Holdings
          </h1>
        </div>

        <div class="mt-5">
          <Infobox text={infoText} />
        </div>

        {#if summaryData.length > 0}
          <div
            class="mt-4 mb-6 grid grid-cols-2 divide-x divide-gray-200/70 dark:divide-zinc-800/80 rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 md:grid-cols-4"
          >
            <div class="p-4 bp:p-5 sm:p-6">
              <label class="text-sm text-gray-500 dark:text-zinc-400">
                Total ETFs
              </label>
              <div
                class="mt-1 break-words font-semibold leading-8 text-lg sm:text-xl text-gray-900 dark:text-white"
              >
                {summaryData.length.toLocaleString("en-US")}
              </div>
            </div>

            <div class="p-4 bp:p-5 sm:p-6">
              <label class="text-sm text-gray-500 dark:text-zinc-400">
                Top 10 Weight
              </label>
              <div
                class="mt-1 break-words font-semibold leading-8 text-lg sm:text-xl text-gray-900 dark:text-white"
              >
                {topTenWeight.toFixed(2)}%
              </div>
            </div>

            <div class="p-4 bp:p-5 sm:p-6">
              <label class="text-sm text-gray-500 dark:text-zinc-400">
                Total Market Value
              </label>
              <div
                class="mt-1 break-words font-semibold leading-8 text-lg sm:text-xl text-gray-900 dark:text-white"
              >
                {abbreviateNumber(totalMarketValue)}
              </div>
            </div>

            <div class="p-4 bp:p-5 sm:p-6 flex flex-col items-start">
              <label class="text-sm text-gray-500 dark:text-zinc-400">
                Largest ETF
              </label>
              <a
                href="/etf/{largestExposure?.symbol}"
                class="mt-1 break-words font-semibold leading-7 text-base sm:text-lg sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
              >
                {largestExposure?.symbol}
              </a>

              <div class="text-sm text-gray-500 dark:text-zinc-400">
                {(largestExposure?.weightPercentage ?? 0).toFixed(2)}%
              </div>
            </div>
          </div>

          {#if buildAllocationChartSeries().length > 0}
            <div class="mt-5">
              <div class="relative">
                <h2
                  class="mb-2 text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
                >
                  Market Value Allocation
                </h2>

                <div
                  class="sm:p-3 border border-gray-300 dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40"
                  use:highcharts={$screenWidth < 640
                    ? configBarChart
                    : configPieChart}
                ></div>
              </div>
            </div>
          {/if}

          <div class="w-full m-auto mt-5">
            <div class="items-center lg:overflow-visible px-1 py-1">
              <div
                class="col-span-2 flex flex-col lg:flex-row items-start sm:items-center lg:order-2 lg:grow py-1 border-t border-b border-gray-300 dark:border-zinc-700"
              >
                <h2
                  class="text-start whitespace-nowrap text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white py-1 border-b border-gray-300 dark:border-zinc-700 lg:border-none w-full"
                >
                  {etf_detail_holdings_stocks_count({
                    count: summaryData.length.toLocaleString("en-US"),
                  })}
                </h2>

                <div
                  class="mt-1 w-full flex flex-row lg:flex items-center ml-auto pb-1 pt-1 sm:pt-0 order-0 lg:order-1"
                >
                  <div
                    class="relative lg:ml-auto w-full lg:w-fit rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 overflow-hidden flex items-center"
                  >
                    <div
                      class="inline-block cursor-pointer absolute right-2 top-2 text-sm"
                    >
                      {#if inputValue.trim().length > 0}
                        <label
                          class="cursor-pointer"
                          on:click={resetTableSearch}
                        >
                          <svg
                            class="w-5 h-5"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                          >
                            <path
                              fill="currentColor"
                              d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
                            />
                          </svg>
                        </label>
                      {/if}
                    </div>

                    <input
                      bind:value={inputValue}
                      on:input={() => (currentPage = 1)}
                      type="text"
                      placeholder={etf_search_placeholder()}
                      class="py-2 text-[0.85rem] sm:text-sm border-0 bg-transparent text-gray-700 dark:text-zinc-200 placeholder:text-gray-800 dark:placeholder:text-zinc-300 focus:outline-none focus:ring-0 grow w-full sm:min-w-56 lg:max-w-14 px-3 pr-8"
                    />
                  </div>

                  <div class="ml-2">
                    <DownloadData
                      {data}
                      rawData={filteredTableData}
                      title={`${$stockTicker}_etf_holdings`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {#if filteredTableData.length > 0}
              <div
                class="mt-6 w-full m-auto mb-4 rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 overflow-x-auto"
              >
                <table
                  class="table table-sm table-compact rounded-none sm:rounded w-full m-auto text-gray-700 dark:text-zinc-200 tabular-nums"
                >
                  <thead>
                    <TableHeader {columns} {sortOrders} {sortData} />
                  </thead>
                  <tbody
                    class="divide-y divide-gray-200/70 dark:divide-zinc-800/80"
                  >
                    {#each paginatedTableData as item}
                      <tr
                        class="transition-colors hover:bg-gray-50/60 dark:hover:bg-zinc-900/50"
                      >
                        <td class="text-[0.85rem] sm:text-sm text-start">
                          <a
                            href={`/etf/${item?.symbol}`}
                            class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                          >
                            {item?.symbol || "-"}
                          </a>
                        </td>

                        <td
                          class="whitespace-nowrap text-[0.85rem] sm:text-sm text-start truncate w-fit text-gray-600 dark:text-zinc-300"
                        >
                          {#if item?.name?.length > charNumber}
                            {item.name.slice(0, charNumber) + "..."}
                          {:else}
                            {item?.name || "-"}
                          {/if}
                        </td>

                        <td
                          class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                        >
                          {formatPrice(item?.price)}
                        </td>

                        <td
                          class={`text-end text-[0.85rem] sm:text-sm whitespace-nowrap tabular-nums ${getSignedPercentClass(
                            item?.changesPercentage,
                          )}`}
                        >
                          {formatSignedPercent(item?.changesPercentage)}
                        </td>

                        <td
                          class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                        >
                          {formatLargeNumber(item?.marketValue)}
                        </td>

                        <td
                          class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                        >
                          {formatLargeNumber(item?.sharesNumber)}
                        </td>

                        <td
                          class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                        >
                          {formatWeight(item?.weightPercentage)}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>

              <div
                class="flex flex-row items-center justify-between mt-8 sm:mt-5"
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
                      />
                    </svg>
                    <span class="hidden sm:inline"
                      >{stock_detail_previous()}</span
                    >
                  </Button>
                </div>

                <div class="flex flex-row items-center gap-4">
                  <span class="text-sm text-gray-600 dark:text-zinc-300">
                    {stock_detail_page_of({
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
                          {stock_detail_rows({ count: rowsPerPage })}
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
                          />
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
                            class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition"
                          >
                            <label
                              on:click={() => changeRowsPerPage(item)}
                              class="inline-flex justify-between w-full items-center cursor-pointer"
                            >
                              <span class="text-sm">
                                {stock_detail_rows({ count: item })}
                              </span>
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
                    <span class="hidden sm:inline">{stock_detail_next()}</span>
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
                      />
                    </svg>
                  </Button>
                </div>
              </div>

              <div class="flex justify-center mt-4">
                <button
                  on:click={scrollToTop}
                  class="cursor-pointer text-sm font-medium text-gray-800 dark:text-zinc-300 transition hover:text-violet-600 dark:hover:text-violet-400"
                >
                  {stock_detail_back_to_top()}
                  <svg
                    class="h-5 w-5 inline-block shrink-0 rotate-180"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    style="max-width:40px"
                    aria-hidden="true"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            {:else}
              <div
                class="mt-6 w-full flex items-center justify-start text-start"
              >
                <Infobox
                  text={etf_main_no_results({
                    query: inputValue.trim(),
                  })}
                />
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>

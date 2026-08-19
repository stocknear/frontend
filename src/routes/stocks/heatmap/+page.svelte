<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import SEO from "$lib/components/SEO.svelte";
  import { setCache, getCache, isOpen } from "$lib/store";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import HeatmapChart from "$lib/components/Plot/HeatmapChart.svelte";
  import CustomizeIndexesModal from "$lib/components/Heatmap/CustomizeIndexesModal.svelte";
  import { Download } from "lucide-svelte";
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import { changeClass, changeSign } from "$lib/utils";
  import {
    DEFAULT_INDEX,
    DEFAULT_METRIC,
    DEFAULT_PERIOD,
    DEFAULT_TABS,
    HEATMAP_METRICS,
    HEATMAP_PERIODS,
    canUseIndex,
    loadTabs,
    metricLabel,
    saveTabs,
    type HeatmapIndex,
  } from "$lib/heatmap";
  import {
    buildAuthenticatedWsUrl,
    getPublicWsClosePolicy,
    invalidateWsToken,
  } from "$lib/websocket";
  import {
    common_home,
    heatmap_breadcrumb_label,
    heatmap_error_load,
    heatmap_feature_color,
    heatmap_feature_download,
    heatmap_feature_interactive,
    heatmap_feature_momentum,
    heatmap_feature_real_time,
    heatmap_feature_rotation,
    heatmap_feature_timeframes,
    heatmap_feature_trend,
    heatmap_constituents_note,
    heatmap_customize_button,
    heatmap_heading,
    heatmap_heading_metric,
    heatmap_no_data,
    common_download,
    heatmap_seo_description,
    heatmap_seo_keywords,
    heatmap_seo_title,
    heatmap_structured_breadcrumb_label,
    heatmap_structured_description,
    heatmap_structured_name,
    heatmap_time_period_label,
  } from "$lib/paraglide/messages.js";

  type HeatmapCustom = {
    symbol?: string;
    change?: number;
    currentPrice?: number;
    referencePrice?: number;
    revenue?: number | null;
    netIncome?: number | null;
    pe?: number | null;
  };

  type HeatmapNode = {
    id?: string;
    name?: string;
    parent?: string;
    value?: number;
    colorValue?: number;
    custom?: HeatmapCustom;
  };

  type HeatmapPayload = {
    data?: HeatmapNode[];
    timePeriod?: string;
    colorRange?: number;
    etfName?: string;
  };

  type RealtimePricePayload = {
    symbol?: string;
    avgPrice?: number;
  };

  type HeatmapPointUpdate = {
    symbol: string;
    custom: HeatmapCustom;
  };

  export let data;
  let isLoading = false;
  let heatmapChartRef: HeatmapChart;
  let priceSocket: WebSocket | null = null;
  const ignoredPriceSockets = new WeakSet<WebSocket>();
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let lastSubscriptionKey: string | null = null;
  let pendingQuoteUpdates = new Map<string, number>();
  let flushAnimationFrame: number | null = null;
  let hasMounted = false;
  let reconnectAttempt = 0;
  let isConnecting = false;

  function handleDownload() {
    heatmapChartRef?.downloadChart();
  }

  let heatmapData: HeatmapPayload | null = data?.getHeatMap?.data
    ? data.getHeatMap
    : null;
  let selectedTimePeriod = data?.params || DEFAULT_PERIOD;
  let selectedETF = data?.etf || DEFAULT_INDEX;
  let selectedMetric = data?.metric || DEFAULT_METRIC;
  let savedTabs: string[] = DEFAULT_TABS;
  // Guards against a slow response for a previously selected index landing after a
  // faster one and repainting the chart with data the header no longer describes.
  let heatmapRequestId = 0;
  let heatmapLeafMap = new Map<string, HeatmapNode>();

  $: catalog = (data?.indexes ?? []) as HeatmapIndex[];
  $: indexBySymbol = new Map(catalog?.map((index) => [index?.symbol, index]));
  $: selectedIndexLabel = indexBySymbol.get(selectedETF)?.name ?? selectedETF;
  // The period control is hidden for metrics it does not apply to, so the tab chips fall
  // back to the default rather than reporting a window the user cannot see or change.
  $: chipPeriod =
    selectedMetric === DEFAULT_METRIC ? selectedTimePeriod : DEFAULT_PERIOD;

  // The active index always has a tab, even when it was deep-linked or has just been
  // switched on, so a deselected or empty saved list can never leave an empty bar.
  $: visibleTabs = [
    ...savedTabs.filter((symbol) =>
      canUseIndex(indexBySymbol.get(symbol), data?.entitled),
    ),
    ...(savedTabs.includes(selectedETF) ? [] : [selectedETF]),
  ];

  $: heatmapLeafMap = buildHeatmapLeafMap(heatmapData);

  function getHeatmapLeafNodes(payload: HeatmapPayload | null): HeatmapNode[] {
    if (!Array.isArray(payload?.data)) {
      return [];
    }

    return payload.data.filter((node) => {
      const symbol = node?.custom?.symbol;
      const referencePrice = node?.custom?.referencePrice;
      return (
        !!node?.parent &&
        typeof symbol === "string" &&
        symbol.length > 0 &&
        typeof referencePrice === "number" &&
        Number.isFinite(referencePrice) &&
        referencePrice > 0
      );
    });
  }

  function buildHeatmapLeafMap(payload: HeatmapPayload | null) {
    const nextMap = new Map<string, HeatmapNode>();
    for (const node of getHeatmapLeafNodes(payload)) {
      const symbol = node?.custom?.symbol?.toUpperCase();
      if (symbol) {
        nextMap.set(symbol, node);
      }
    }
    return nextMap;
  }

  function getSubscriptionSymbols(): string[] {
    return Array.from(heatmapLeafMap.keys());
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
    clearReconnectTimer();
    lastSubscriptionKey = null;
    isConnecting = false;

    const socketToClose = priceSocket;
    priceSocket = null;

    if (
      socketToClose &&
      (socketToClose.readyState === WebSocket.OPEN ||
        socketToClose.readyState === WebSocket.CONNECTING)
    ) {
      try {
        ignoredPriceSockets.add(socketToClose);
        socketToClose.close();
      } catch (error) {
        console.error("Error closing heatmap price socket:", error);
      }
    }
  }

  function shouldUseRealtime(): boolean {
    return (
      hasMounted &&
      $isOpen &&
      typeof data?.wsURL === "string" &&
      data.wsURL.length > 0 &&
      getSubscriptionSymbols().length > 0
    );
  }

  function sendPriceSubscription(symbols: string[]) {
    if (!priceSocket || priceSocket.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      priceSocket.send(JSON.stringify(symbols));
      lastSubscriptionKey = symbols.slice().sort().join("|");
    } catch (error) {
      console.error("Failed to send heatmap subscription:", error);
    }
  }

  function scheduleReconnect(
    event?: Pick<CloseEvent, "code"> | { code?: number },
  ) {
    if (reconnectTimer || !shouldUseRealtime()) {
      return;
    }

    const policy = getPublicWsClosePolicy(event, reconnectAttempt);
    if (!policy.retry) {
      return;
    }
    if (policy.invalidateToken) {
      invalidateWsToken("/price-data");
    }

    reconnectAttempt += 1;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connectPriceSocket();
    }, policy.delayMs);
  }

  function applyRealtimeQuote(
    symbol: string,
    livePrice: number,
  ): HeatmapPointUpdate | null {
    const node = heatmapLeafMap.get(symbol);
    const referencePrice = node?.custom?.referencePrice;
    if (
      !node ||
      typeof referencePrice !== "number" ||
      !Number.isFinite(referencePrice) ||
      referencePrice <= 0
    ) {
      return null;
    }

    const changeValue = ((livePrice - referencePrice) / referencePrice) * 100;
    const roundedChangeValue = Number(changeValue.toFixed(4));
    const nextCustom: HeatmapCustom = {
      ...(node.custom ?? {}),
      currentPrice: Number(livePrice.toFixed(4)),
      change: roundedChangeValue,
    };

    node.colorValue = roundedChangeValue;
    node.custom = nextCustom;

    // No colorValue here: the chart derives the tile colour from whichever metric is
    // selected, so a price tick must not repaint a revenue view.
    return { symbol, custom: nextCustom };
  }

  function flushRealtimeQuoteUpdates() {
    if (pendingQuoteUpdates.size === 0) {
      return;
    }

    const updates = Array.from(pendingQuoteUpdates.entries());
    pendingQuoteUpdates.clear();

    const pointUpdates: HeatmapPointUpdate[] = [];
    for (const [symbol, livePrice] of updates) {
      const pointUpdate = applyRealtimeQuote(symbol, livePrice);
      if (pointUpdate) {
        pointUpdates.push(pointUpdate);
      }
    }

    if (pointUpdates.length > 0) {
      heatmapChartRef?.applyRealtimeUpdates(pointUpdates);
    }
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

      for (const item of updates as RealtimePricePayload[]) {
        const symbol = item?.symbol?.toUpperCase?.();
        const livePrice = item?.avgPrice;

        if (
          !symbol ||
          typeof livePrice !== "number" ||
          !Number.isFinite(livePrice) ||
          livePrice <= 0
        ) {
          continue;
        }

        pendingQuoteUpdates.set(symbol, livePrice);
      }

      scheduleRealtimeFlush();
    } catch (error) {
      console.error("Error parsing heatmap WebSocket payload:", error);
    }
  }

  async function connectPriceSocket() {
    if (!shouldUseRealtime() || isConnecting) {
      return;
    }

    let nextPriceSocket: WebSocket | null = null;
    if (
      priceSocket &&
      (priceSocket.readyState === WebSocket.OPEN ||
        priceSocket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    isConnecting = true;
    try {
      const wsUrl = await buildAuthenticatedWsUrl(
        data.wsURL,
        "/price-data",
        data.wsToken,
      );
      if (!wsUrl) {
        scheduleReconnect();
        return;
      }
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
      nextPriceSocket = new WebSocket(wsUrl);
      priceSocket = nextPriceSocket;
    } catch (error) {
      console.error("Failed establishing heatmap price socket:", error);
      priceSocket = null;
      scheduleReconnect();
      return;
    } finally {
      isConnecting = false;
    }

    if (!nextPriceSocket) {
      return;
    }

    nextPriceSocket.addEventListener("open", () => {
      clearReconnectTimer();
      reconnectAttempt = 0;
      sendPriceSubscription(getSubscriptionSymbols());
    });

    nextPriceSocket.addEventListener("message", (event) => {
      handlePriceSocketMessage(event?.data);
    });

    nextPriceSocket.addEventListener("close", (event) => {
      if (priceSocket === nextPriceSocket) {
        priceSocket = null;
      }
      if (ignoredPriceSockets.has(nextPriceSocket)) {
        ignoredPriceSockets.delete(nextPriceSocket);
        return;
      }
      lastSubscriptionKey = null;
      if (shouldUseRealtime()) {
        scheduleReconnect(event);
      }
    });

    nextPriceSocket.addEventListener("error", (error) => {
      console.error("Heatmap price socket error:", error);
      if (
        nextPriceSocket.readyState === WebSocket.OPEN ||
        nextPriceSocket.readyState === WebSocket.CONNECTING
      ) {
        try {
          nextPriceSocket.close();
        } catch (closeError) {
          console.error("Failed closing errored heatmap socket:", closeError);
        }
      }
    });
  }

  function syncPriceSubscription() {
    const symbols = getSubscriptionSymbols();
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
    savedTabs = loadTabs();
    // Canonicalises the address after a rejected or defaulted ?i=.
    silentUpdateUrl();
    syncPriceSubscription();
  });

  onDestroy(() => {
    hasMounted = false;
    clearPendingQuoteUpdates();
    cleanupPriceSocket();
  });

  $: if (hasMounted) {
    if ($isOpen) {
      syncPriceSubscription();
    } else {
      cleanupPriceSocket();
    }
  }

  $: if (hasMounted && heatmapData?.data) {
    syncPriceSubscription();
  }

  /**
   * Mirrors the current view into the address bar without going through `goto`, so no
   * `load` re-runs and no ~30 KB payload is re-shipped for data the client already has.
   * Defaults are omitted to keep the shareable URL clean.
   */
  function buildUrl() {
    const params = new URLSearchParams();
    if (selectedETF !== DEFAULT_INDEX) params.set("i", selectedETF);
    if (selectedTimePeriod !== DEFAULT_PERIOD) params.set("t", selectedTimePeriod);
    if (selectedMetric !== DEFAULT_METRIC) params.set("d", selectedMetric);

    const query = params.toString();
    return `${$page?.url?.pathname}${query ? `?${query}` : ""}`;
  }

  function silentUpdateUrl() {
    // history.state has to be passed through -- replacing it with {} drops SvelteKit's
    // router state key and breaks the next real navigation.
    if (browser) history.replaceState(history.state, "", buildUrl());
  }

  function selectMetric(metric: string) {
    // No fetch: every metric is already baked into the tiles.
    selectedMetric = metric;
    silentUpdateUrl();
  }

  function toggleTab(symbol: string) {
    savedTabs = savedTabs.includes(symbol)
      ? savedTabs.filter((tab) => tab !== symbol)
      : [...savedTabs, symbol];
    saveTabs(savedTabs);
  }

  async function getHeatMap(timePeriod: string, etf: string = selectedETF) {
    if (
      timePeriod === selectedTimePeriod &&
      etf === selectedETF &&
      heatmapData?.data
    ) {
      return;
    }

    // Applied optimistically so the active tab moves immediately, and rolled back below
    // if the fetch fails -- otherwise the heading, footnote and URL describe an index the
    // chart is not showing.
    const previous = { etf: selectedETF, period: selectedTimePeriod };
    selectedTimePeriod = timePeriod;
    selectedETF = etf;
    silentUpdateUrl();
    isLoading = true;
    const requestId = ++heatmapRequestId;

    try {
      const cacheKey = `heatmap_${etf}_${timePeriod}_v4`;
      const cachedData = getCache(cacheKey, "getHeatmap");

      if (cachedData?.data) {
        if (requestId === heatmapRequestId) heatmapData = cachedData;
      } else {
        const postData = { params: timePeriod, etf };
        const response = await fetch("/api/heatmap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        });

        if (!response?.ok) {
          throw new Error(`heatmap request failed: ${response?.status}`);
        }

        const payload = await response.json();
        if (payload?.data) {
          setCache(cacheKey, payload, "getHeatmap");
        }
        if (requestId === heatmapRequestId) heatmapData = payload;
      }
    } catch (error) {
      console.error("Error loading heatmap:", error);
      if (requestId === heatmapRequestId) {
        selectedETF = previous.etf;
        selectedTimePeriod = previous.period;
        silentUpdateUrl();
      }
      toast.error(heatmap_error_load(), {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    } finally {
      if (requestId === heatmapRequestId) isLoading = false;
    }
  }
</script>

<SEO
  title={heatmap_seo_title()}
  description={heatmap_seo_description()}
  keywords={heatmap_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: heatmap_structured_name(),
    description: heatmap_structured_description(),
    url: "https://stocknear.com/stocks/heatmap",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web Browser",
    browserRequirements: "Modern web browser with JavaScript enabled",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: common_home(),
          item: "https://stocknear.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: heatmap_structured_breadcrumb_label(),
          item: "https://stocknear.com/stocks/heatmap",
        },
      ],
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    featureList: [
      heatmap_feature_real_time(),
      heatmap_feature_interactive(),
      heatmap_feature_timeframes(),
      heatmap_feature_color(),
      heatmap_feature_download(),
      heatmap_feature_trend(),
      heatmap_feature_rotation(),
      heatmap_feature_momentum(),
    ],
    creator: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-6 px-4 lg:px-6 text-fg"
>
  <BreadCrumb
    containerClass="text-xs sm:text-sm breadcrumbs text-fg-muted"
  >
    <li>
      <a
        href="/"
        class="text-fg-muted hover:text-accent transition"
        >{common_home()}</a
      >
    </li>
    <li class="text-fg-muted">
      {heatmap_breadcrumb_label()}
    </li>
  </BreadCrumb>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div
            class="mb-5 flex flex-row flex-wrap items-stretch gap-2.5 border-b border-line pb-5"
          >
            {#each visibleTabs as symbol (symbol)}
              {@const indexChange = indexBySymbol.get(symbol)?.changes?.[
                chipPeriod
              ]}
              <button
                on:click={() => getHeatMap(selectedTimePeriod, symbol)}
                disabled={isLoading}
                class="flex min-w-[8.5rem] cursor-pointer flex-col items-start gap-1 rounded-container border px-4 py-3 text-left transition disabled:opacity-60 disabled:cursor-not-allowed {symbol ===
                selectedETF
                  ? 'border-accent bg-surface-raised'
                  : 'border-line bg-surface-card hover:border-line-strong'}"
              >
                <span class="type-h3 leading-none text-fg">{symbol}</span>
                <span class="text-sm leading-tight text-fg-muted"
                  >{indexBySymbol.get(symbol)?.name ?? symbol}</span
                >
                <span
                  class="mt-1 flex w-fit items-center gap-0.5 rounded-control py-px pl-1 pr-1.5 text-xs font-semibold leading-tight {changeClass(
                    indexChange,
                  )} {indexChange > 0
                    ? 'bg-up/10'
                    : indexChange < 0
                      ? 'bg-down/10'
                      : 'bg-surface-sunken'}"
                >
                  {#if indexChange}
                    <svg
                      class="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d={indexChange > 0
                          ? "M7 11l5-5m0 0l5 5m-5-5v12"
                          : "M17 13l-5 5m0 0l-5-5m5 5V6"}
                      ></path>
                    </svg>
                  {/if}
                  {Number.isFinite(indexChange)
                    ? `${changeSign(indexChange)}${indexChange?.toFixed(2)}%`
                    : "-"}
                </span>
              </button>
            {/each}

            <label
              for="heatmapIndexModal"
              class="flex cursor-pointer items-center rounded-container border border-dashed border-line bg-surface-card px-5 text-sm font-medium text-fg-muted transition hover:border-line-strong hover:text-accent"
            >
              {heatmap_customize_button()}
            </label>
          </div>

          <div
            class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <h1 class="type-h1 text-fg">
              {selectedMetric === DEFAULT_METRIC
                ? heatmap_heading({
                    index: selectedIndexLabel,
                    period: selectedTimePeriod,
                  })
                : heatmap_heading_metric({
                    index: selectedIndexLabel,
                    metric: metricLabel(selectedMetric),
                  })}
            </h1>

            <div class="flex flex-row items-center gap-2.5">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild let:builder>
                  <Button
                    builders={[builder]}
                    class="transition-all duration-150 border border-line text-fg bg-surface-card hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    <span class="truncate">
                      {metricLabel(selectedMetric)}
                    </span>
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
                  class="w-auto h-fit max-h-72 overflow-y-auto scroller rounded-container border border-line bg-surface-card p-2 text-fg shadow-none"
                >
                  <div
                    class="relative sticky z-40 focus:outline-hidden -top-1"
                    tabindex="0"
                    role="menu"
                    style=""
                  ></div>
                  <DropdownMenu.Group>
                    {#each HEATMAP_METRICS as item}
                      <DropdownMenu.Item
                        on:click={() => selectMetric(item?.id)}
                        class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-accent transition cursor-pointer"
                      >
                        <span class="mr-8">{item?.label()}</span>
                      </DropdownMenu.Item>
                    {/each}
                  </DropdownMenu.Group>
                </DropdownMenu.Content>
              </DropdownMenu.Root>

              <!-- Price change is the only metric a period applies to; the others are
                   point-in-time TTM figures identical across every period file. -->
              {#if selectedMetric === DEFAULT_METRIC}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild let:builder>
                  <Button
                    builders={[builder]}
                    class="transition-all duration-150 border border-line text-fg bg-surface-card hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isLoading}
                    title={heatmap_time_period_label()}
                  >
                    <span class="truncate">{selectedTimePeriod}</span>
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
                  class="w-auto h-fit max-h-72 overflow-y-auto scroller rounded-container border border-line bg-surface-card p-2 text-fg shadow-none"
                >
                  <div
                    class="relative sticky z-40 focus:outline-hidden -top-1"
                    tabindex="0"
                    role="menu"
                    style=""
                  ></div>
                  <DropdownMenu.Group>
                    {#each HEATMAP_PERIODS as item}
                      <DropdownMenu.Item
                        on:click={() => getHeatMap(item, selectedETF)}
                        class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-accent transition cursor-pointer"
                      >
                        <span class="mr-8">{item}</span>
                      </DropdownMenu.Item>
                    {/each}
                  </DropdownMenu.Group>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
              {/if}

              <button
                on:click={handleDownload}
                disabled={isLoading || !heatmapData?.data}
                class="cursor-pointer transition-all duration-150 border border-line text-fg bg-surface-card hover:bg-white dark:hover:bg-zinc-900 flex items-center justify-center gap-2 px-3 py-2 rounded-full text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                title="Download heatmap as PNG"
              >
                <Download class="h-4 w-4" />
                <span>{common_download()}</span>
              </button>
            </div>
          </div>

          <div class="w-full mt-6">
            {#if isLoading}
              <div
                class="flex justify-center items-center h-[500px] sm:h-[600px] lg:h-[750px]"
              >
                <div class="relative">
                  <label
                    class="border border-line bg-surface-card rounded-full h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  >
                    <span
                      class="loading loading-spinner loading-md text-fg-muted"
                    ></span>
                  </label>
                </div>
              </div>
            {:else if heatmapData?.data}
              <HeatmapChart
                bind:this={heatmapChartRef}
                data={heatmapData}
                metric={selectedMetric}
              />
            {:else}
              <div class="flex justify-center items-center h-80">
                <p class="">{heatmap_no_data()}</p>
              </div>
            {/if}

            {#if heatmapData?.data}
              <p class="mt-3 text-xs text-fg-subtle">
                {heatmap_constituents_note({ symbol: selectedETF })}
              </p>
            {/if}
          </div>
        </main>
      </div>
    </div>
  </div>
</section>

<CustomizeIndexesModal
  indexes={catalog}
  selected={savedTabs}
  activeSymbol={selectedETF}
  entitled={data?.entitled === true}
  on:toggle={(event) => toggleTab(event?.detail?.symbol)}
/>

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
  import { Download } from "lucide-svelte";
  import {
    buildAuthenticatedWsUrl,
    getPublicWsClosePolicy,
    invalidateWsToken,
  } from "$lib/websocket";
  import {
    common_home,
    etf_heatmap_breadcrumb_label,
    etf_heatmap_error_load,
    etf_heatmap_feature_aum,
    etf_heatmap_feature_categories,
    etf_heatmap_feature_real_time,
    etf_heatmap_feature_timeframes,
    etf_heatmap_heading,
    etf_heatmap_no_data,
    etf_heatmap_seo_description,
    etf_heatmap_seo_keywords,
    etf_heatmap_seo_title,
    etf_heatmap_structured_breadcrumb_label,
    etf_heatmap_structured_description,
    etf_heatmap_structured_name,
    heatmap_feature_color,
    heatmap_feature_download,
    heatmap_time_period_label,
  } from "$lib/paraglide/messages.js";

  type HeatmapCustom = {
    symbol?: string;
    performance?: string;
    aum?: number;
    currentPrice?: number;
    referencePrice?: number;
    referenceDate?: string | null;
    timePeriod?: string;
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
  };

  type RealtimePricePayload = {
    symbol?: string;
    avgPrice?: number;
  };

  type HeatmapPointUpdate = {
    symbol: string;
    colorValue: number;
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

  let heatmapData: HeatmapPayload | null = data?.getETFHeatMap?.data
    ? data.getETFHeatMap
    : null;
  let selectedTimePeriod = heatmapData?.timePeriod || "1D";
  let heatmapLeafMap = new Map<string, HeatmapNode>();

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

  function formatPerformance(value: number): string {
    if (!Number.isFinite(value)) {
      return "0.00%";
    }
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
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
        console.error("Error closing ETF heatmap price socket:", error);
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
      console.error("Failed to send ETF heatmap subscription:", error);
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
      performance: formatPerformance(changeValue),
    };

    node.colorValue = roundedChangeValue;
    node.custom = nextCustom;

    return {
      symbol,
      colorValue: roundedChangeValue,
      custom: nextCustom,
    };
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
      console.error("Error parsing ETF heatmap WebSocket payload:", error);
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
      console.error("Failed establishing ETF heatmap price socket:", error);
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
      console.error("ETF heatmap price socket error:", error);
      if (
        nextPriceSocket.readyState === WebSocket.OPEN ||
        nextPriceSocket.readyState === WebSocket.CONNECTING
      ) {
        try {
          nextPriceSocket.close();
        } catch (closeError) {
          console.error(
            "Failed closing errored ETF heatmap socket:",
            closeError,
          );
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

  async function getETFHeatMap(timePeriod: string) {
    if (timePeriod === selectedTimePeriod && heatmapData?.data) {
      return;
    }

    selectedTimePeriod = timePeriod;
    isLoading = true;

    try {
      const cacheKey = `etf_heatmap_${timePeriod}_v2`;
      const cachedData = getCache(cacheKey, "getETFHeatmap");

      if (cachedData?.data) {
        heatmapData = cachedData;
      } else {
        const response = await fetch("/api/etf-heatmap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ params: timePeriod }),
        });

        heatmapData = await response.json();
        if (heatmapData?.data) {
          setCache(cacheKey, heatmapData, "getETFHeatmap");
        }
      }
    } catch (error) {
      console.error("Error loading ETF heatmap:", error);
      toast.error(etf_heatmap_error_load(), {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    } finally {
      isLoading = false;
    }
  }
</script>

<SEO
  title={etf_heatmap_seo_title()}
  description={etf_heatmap_seo_description()}
  keywords={etf_heatmap_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: etf_heatmap_structured_name(),
    description: etf_heatmap_structured_description(),
    url: "https://stocknear.com/etf/heatmap",
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
          name: etf_heatmap_structured_breadcrumb_label(),
          item: "https://stocknear.com/etf/heatmap",
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
      etf_heatmap_feature_real_time(),
      etf_heatmap_feature_categories(),
      etf_heatmap_feature_aum(),
      etf_heatmap_feature_timeframes(),
      heatmap_feature_color(),
      heatmap_feature_download(),
    ],
    creator: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-6 px-4 lg:px-6 text-gray-700 dark:text-zinc-200"
>
  <BreadCrumb
    containerClass="text-xs sm:text-sm breadcrumbs text-muted dark:text-zinc-300"
  >
    <li>
      <a
        href="/"
        class="text-muted dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
        >{common_home()}</a
      >
    </li>
    <li class="text-muted dark:text-zinc-300">
      {etf_heatmap_breadcrumb_label()}
    </li>
  </BreadCrumb>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class="mb-6 border-b border-gray-300 dark:border-zinc-700">
            <h1
              class="mb-1 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              {etf_heatmap_heading({ period: selectedTimePeriod })}
            </h1>
          </div>

          <div class="flex flex-row items-center gap-2.5 w-fit">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild let:builder>
                <Button
                  builders={[builder]}
                  class="transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  <span class="truncate">{heatmap_time_period_label()}</span>
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
                class="w-auto h-fit max-h-72 overflow-y-auto scroller rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
              >
                <div
                  class="relative sticky z-40 focus:outline-hidden -top-1"
                  tabindex="0"
                  role="menu"
                  style=""
                ></div>
                <DropdownMenu.Group>
                  {#each ["1D", "1W", "1M", "3M", "6M", "1Y", "3Y"] as item}
                    <DropdownMenu.Item
                      on:click={() => getETFHeatMap(item)}
                      class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition cursor-pointer"
                    >
                      <span class="mr-8">{item}</span>
                    </DropdownMenu.Item>
                  {/each}
                </DropdownMenu.Group>
              </DropdownMenu.Content>
            </DropdownMenu.Root>

            <button
              on:click={handleDownload}
              disabled={isLoading || !heatmapData?.data}
              class="cursor-pointer transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex items-center justify-center px-3 py-2 rounded-full disabled:opacity-60 disabled:cursor-not-allowed"
              title="Download ETF heatmap as PNG"
            >
              <Download class="h-5 w-5" />
            </button>
          </div>

          <div class="w-full mt-6">
            {#if isLoading}
              <div
                class="flex justify-center items-center h-[500px] sm:h-[600px] lg:h-[750px]"
              >
                <div class="relative">
                  <label
                    class="border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 rounded-full h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  >
                    <span
                      class="loading loading-spinner loading-md text-muted dark:text-zinc-300"
                    ></span>
                  </label>
                </div>
              </div>
            {:else if heatmapData?.data}
              <HeatmapChart
                bind:this={heatmapChartRef}
                data={heatmapData}
                isETF={true}
              />
            {:else}
              <div class="flex justify-center items-center h-80">
                <p>{etf_heatmap_no_data()}</p>
              </div>
            {/if}
          </div>
        </main>
      </div>
    </div>
  </div>
</section>

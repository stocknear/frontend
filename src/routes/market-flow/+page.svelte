<script lang="ts">
  import { abbreviateNumber, sectorNavigation } from "$lib/utils";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import { onMount, onDestroy } from "svelte";
  import MarketTideChart from "$lib/components/MarketFlow/MarketTideChart.svelte";
  import SectorFlowChart from "$lib/components/MarketFlow/SectorFlowChart.svelte";
  import FearAndGreedChart from "$lib/components/MarketFlow/FearAndGreedChart.svelte";
  import OpenInterestChart from "$lib/components/MarketFlow/OpenInterestChart.svelte";
  import VolumeChart from "$lib/components/MarketFlow/VolumeChart.svelte";
  import IntradayBarsChart from "$lib/components/MarketFlow/IntradayBarsChart.svelte";
  import LineChart from "lucide-svelte/icons/chart-no-axes-gantt";
  import {
  market_flow_breadcrumb_home,
  market_flow_breadcrumb_market_flow,
  market_flow_card_most_active_sector,
  market_flow_card_net_call_prem,
  market_flow_card_net_put_prem,
  market_flow_card_net_volume,
  market_flow_last_update,
  market_flow_modal_description,
  market_flow_modal_title,
  market_flow_overview_as_of,
  market_flow_overview_contracts,
  market_flow_overview_contracts_period,
  market_flow_overview_indicating,
  market_flow_overview_intro,
  market_flow_overview_net_call_premium,
  market_flow_overview_net_put_premium,
  market_flow_overview_of_average,
  market_flow_overview_sentiment,
  market_flow_overview_total_volume,
  market_flow_overview_volume_pc_ratio,
  market_flow_section_fear_greed,
  market_flow_section_open_interest,
  market_flow_section_sector_flow,
  market_flow_section_sp500_flow,
  market_flow_section_volume,
  market_flow_sentiment_bearish,
  market_flow_sentiment_bullish,
  market_flow_sentiment_neutral,
  market_flow_sentiment_unknown,
  market_flow_seo_description,
  market_flow_seo_keywords,
  market_flow_seo_title,
  market_flow_stat_call_oi,
  market_flow_stat_call_volume,
  market_flow_stat_put_call_ratio,
  market_flow_stat_put_oi,
  market_flow_stat_put_volume,
  market_flow_stat_todays_oi,
  market_flow_stat_todays_volume,
  market_flow_structured_description,
  market_flow_structured_name,
  market_flow_upgrade,
  market_flow_upgrade_to_pro,
  market_flow_view_intraday_bars,
} from "$lib/paraglide/messages";
  import { getLocale } from "$lib/paraglide/runtime.js";

  export let data;

  let marketTideData = Array.isArray(data?.getData?.marketTide)
    ? (data?.getData?.marketTide ?? [])
    : [];
  let sectorFlow = Array.isArray(data?.getData?.sectorFlow)
    ? (data?.getData?.sectorFlow ?? [])
    : [];
  let overview = data?.getData?.overview ?? {};
  let intradayBars =
    data?.getData?.intradayBars &&
    typeof data?.getData?.intradayBars === "object"
      ? data.getData.intradayBars
      : {};
  let marketFlowDate =
    typeof data?.getData?.date === "string" ? data.getData.date : "";

  let fearAndGreedValue = data?.getFearAndGreed?.current?.value || 50;
  let currentCategory = data?.getFearAndGreed?.current?.category || "Neutral";

  let isPro = data?.user?.tier === "Pro";

  let marketFlowSocket: WebSocket | null = null;
  let marketFlowReconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let lastMarketFlowSignature: string | null = null;
  let marketFlowSocketEnabled = false;
  let marketFlowRefreshInterval: ReturnType<typeof setInterval> | null = null;

  const MARKET_FLOW_RECONNECT_DELAY = 5000;
  const MARKET_FLOW_REFRESH_INTERVAL_MS = 10000;

  function cleanupMarketFlowSocket() {
    if (marketFlowReconnectTimer) {
      clearTimeout(marketFlowReconnectTimer);
      marketFlowReconnectTimer = null;
    }

    if (marketFlowRefreshInterval) {
      clearInterval(marketFlowRefreshInterval);
      marketFlowRefreshInterval = null;
    }

    if (marketFlowSocket) {
      try {
        marketFlowSocket.close();
      } catch (error) {
        console.error("Error closing market flow socket:", error);
      }
    }

    marketFlowSocket = null;
    lastMarketFlowSignature = null;
  }

  function scheduleMarketFlowReconnect() {
    if (!marketFlowSocketEnabled || marketFlowReconnectTimer) {
      return;
    }

    marketFlowReconnectTimer = setTimeout(() => {
      marketFlowReconnectTimer = null;
      if (typeof window !== "undefined") {
        connectMarketFlowSocket();
      }
    }, MARKET_FLOW_RECONNECT_DELAY);
  }

  function handleMarketFlowMessage(raw: unknown) {
    if (typeof raw !== "string" || raw.length === 0) {
      return;
    }

    if (lastMarketFlowSignature === raw) {
      return;
    }
    lastMarketFlowSignature = raw;

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (error) {
      console.error("Failed parsing market flow payload:", error);
      return;
    }

    if (Array.isArray(payload?.marketTide)) {
      marketTideData = payload.marketTide;
    }

    if (Array.isArray(payload?.sectorFlow)) {
      sectorFlow = payload.sectorFlow;
    }

    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      overview = payload?.overview ?? overview;
      if (typeof payload?.date === "string") {
        marketFlowDate = payload.date;
      }
      if (payload?.intradayBars && typeof payload?.intradayBars === "object") {
        intradayBars = payload.intradayBars;
      }
    }
  }

  function connectMarketFlowSocket() {
    if (!marketFlowSocketEnabled) {
      return;
    }
    if (
      typeof window === "undefined" ||
      !data?.wsURL ||
      (marketFlowSocket &&
        (marketFlowSocket.readyState === WebSocket.CONNECTING ||
          marketFlowSocket.readyState === WebSocket.OPEN))
    ) {
      return;
    }

    cleanupMarketFlowSocket();

    try {
      marketFlowSocket = new WebSocket(`${data.wsURL}/market-flow`);
    } catch (error) {
      console.error("Failed establishing market flow socket:", error);
      scheduleMarketFlowReconnect();
      return;
    }

    marketFlowSocket.addEventListener("open", () => {
      if (marketFlowReconnectTimer) {
        clearTimeout(marketFlowReconnectTimer);
        marketFlowReconnectTimer = null;
      }
      if (!marketFlowRefreshInterval) {
        marketFlowRefreshInterval = setInterval(() => {
          if (
            marketFlowSocket &&
            marketFlowSocket.readyState === WebSocket.OPEN
          ) {
            try {
              marketFlowSocket.send(JSON.stringify({ type: "refresh" }));
            } catch (error) {
              console.error(
                "Failed sending market flow refresh request:",
                error,
              );
            }
          } else if (!marketFlowReconnectTimer) {
            connectMarketFlowSocket();
          }
        }, MARKET_FLOW_REFRESH_INTERVAL_MS);
      }
    });

    marketFlowSocket.addEventListener("message", (event) => {
      handleMarketFlowMessage(event?.data);
    });

    marketFlowSocket.addEventListener("close", () => {
      cleanupMarketFlowSocket();
      scheduleMarketFlowReconnect();
    });

    marketFlowSocket.addEventListener("error", (error) => {
      console.error("Market flow socket error:", error);
      if (marketFlowSocket) {
        try {
          marketFlowSocket.close();
        } catch (closeError) {
          console.error(
            "Failed closing errored market flow socket:",
            closeError,
          );
        }
      }
    });
  }

  onMount(() => {
    marketFlowSocketEnabled = isPro;
    if (isPro) {
      connectMarketFlowSocket();
    }

    return () => {
      marketFlowSocketEnabled = false;
      cleanupMarketFlowSocket();
    };
  });

  onDestroy(() => {
    marketFlowSocketEnabled = false;
    cleanupMarketFlowSocket();
  });

  function findLastNonNull(dataArray, key) {
    if (!Array.isArray(dataArray)) {
      return null;
    }

    for (let i = dataArray.length - 1; i >= 0; i--) {
      if (
        dataArray[i]?.net_call_premium !== null &&
        dataArray[i]?.net_call_premium !== undefined
      ) {
        return dataArray[i][key];
      }
    }
    return null; // Return null if no non-null value is found.
  }
</script>

<SEO
  title={market_flow_seo_title()}
  description={market_flow_seo_description()}
  keywords={market_flow_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: market_flow_structured_name(),
    description: market_flow_structured_description(),
    url: "https://stocknear.com/market-flow",
    applicationCategory: "FinanceApplication",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: market_flow_breadcrumb_home(),
          item: "https://stocknear.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: market_flow_breadcrumb_market_flow(),
          item: "https://stocknear.com/market-flow",
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
  class="w-full overflow-hidden min-h-screen text-gray-700 dark:text-zinc-200"
>
  <BreadCrumb containerClass="text-sm sm:text-[1rem] breadcrumbs mb-4">
    <li>
      <a
        href="/"
        class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
        >{market_flow_breadcrumb_home()}</a
      >
    </li>
    <li class="text-muted dark:text-gray-300">{market_flow_breadcrumb_market_flow()}</li>
  </BreadCrumb>

  <div class="w-full overflow-hidden m-auto">
    <div class=" flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class="w-full m-auto">
            <p
              class="mb-5 text-sm sm:text-base leading-6 text-gray-600 dark:text-zinc-300"
            >
              {market_flow_overview_intro()} <strong
                class="font-semibold text-gray-900 dark:text-white"
                >S&P500</strong
              >. {market_flow_overview_as_of()}
              <strong class="font-semibold text-gray-900 dark:text-white"
                >{marketFlowDate}</strong
              >, {market_flow_overview_total_volume()}
              <strong class="font-semibold text-gray-900 dark:text-white">
                {#if isPro}
                  {(overview?.putVol + overview?.callVol)?.toLocaleString(
                    "en-US",
                  ) || "n/a"}
                {:else}
                  <a
                    href="/pricing"
                    class="inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                  >
                    {market_flow_upgrade()} <svg
                      class="w-4 h-4 mb-1 inline-block"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                      />
                    </svg>
                  </a>
                {/if}
              </strong>
              {market_flow_overview_contracts()}
              <strong class="font-semibold text-gray-900 dark:text-white">
                {#if isPro}
                  {overview?.avg30Vol && overview?.avg30Vol > 0
                    ? (
                        ((overview?.callVol + overview?.putVol) /
                          overview?.avg30Vol) *
                        100
                      )?.toFixed(2) + "%"
                    : "n/a"}
                {:else}
                  <a
                    href="/pricing"
                    class="inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                  >
                    {market_flow_upgrade()} <svg
                      class="w-4 h-4 mb-1 inline-block"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                      />
                    </svg>
                  </a>
                {/if}
              </strong>
              {market_flow_overview_of_average()}
              <strong class="font-semibold text-gray-900 dark:text-white">
                {#if isPro}
                  {overview?.avg30Vol?.toLocaleString("en-US") || "n/a"}
                {:else}
                  <a
                    href="/pricing"
                    class="inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                  >
                    {market_flow_upgrade()} <svg
                      class="w-4 h-4 mb-1 inline-block"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                      />
                    </svg>
                  </a>
                {/if}
              </strong>
              {market_flow_overview_contracts_period()} {market_flow_overview_volume_pc_ratio()}
              <strong class="font-semibold text-gray-900 dark:text-white">
                {#if isPro}
                  {overview?.pcVol?.toFixed(2) || "n/a"}
                {:else}
                  <a
                    href="/pricing"
                    class="inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                  >
                    {market_flow_upgrade()} <svg
                      class="w-4 h-4 mb-1 inline-block"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                      />
                    </svg>
                  </a>
                {/if}
              </strong>. {market_flow_overview_net_call_premium()}
              <strong class="font-semibold text-gray-900 dark:text-white">
                {#if isPro}
                  {abbreviateNumber(
                    findLastNonNull(marketTideData, "net_call_premium"),
                  ) || "n/a"}
                {:else}
                  <a
                    href="/pricing"
                    class="inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                  >
                    {market_flow_upgrade()} <svg
                      class="w-4 h-4 mb-1 inline-block"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                      />
                    </svg>
                  </a>
                {/if}
              </strong>
              {market_flow_overview_net_put_premium()}
              <strong class="font-semibold text-gray-900 dark:text-white">
                {#if isPro}
                  {abbreviateNumber(
                    findLastNonNull(marketTideData, "net_put_premium"),
                  ) || "n/a"}
                {:else}
                  <a
                    href="/pricing"
                    class="inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                  >
                    {market_flow_upgrade()} <svg
                      class="w-4 h-4 mb-1 inline-block"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                      />
                    </svg>
                  </a>
                {/if}
              </strong>, {market_flow_overview_indicating()}
              <strong class="font-semibold text-gray-900 dark:text-white">
                {#if isPro}
                  {(() => {
                    const netCallPremium = findLastNonNull(
                      marketTideData,
                      "net_call_premium",
                    );
                    const netPutPremium = findLastNonNull(
                      marketTideData,
                      "net_put_premium",
                    );

                    if (netCallPremium == null || netPutPremium == null) {
                      return market_flow_sentiment_unknown();
                    }

                    const netPremiumDiff = netCallPremium - netPutPremium;
                    const totalPremium =
                      Math.abs(netCallPremium) + Math.abs(netPutPremium);

                    if (totalPremium === 0) {
                      return market_flow_sentiment_neutral();
                    }

                    const premiumRatio = netPremiumDiff / totalPremium;

                    if (premiumRatio > 0.2) {
                      return market_flow_sentiment_bullish();
                    } else if (premiumRatio < -0.2) {
                      return market_flow_sentiment_bearish();
                    } else {
                      return market_flow_sentiment_neutral();
                    }
                  })()}
                {:else}
                  <a
                    href="/pricing"
                    class="inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                  >
                    {market_flow_upgrade()} <svg
                      class="w-4 h-4 mb-1 inline-block"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                      />
                    </svg>
                  </a>
                {/if}
              </strong>
              {market_flow_overview_sentiment()}
            </p>

            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div
                class="net-volume-driver rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/60 dark:bg-zinc-950/40 p-4"
              >
                <div
                  class="text-xs tracking-wide text-gray-800 dark:text-zinc-300 mb-2 flex items-center"
                >
                  <span>{market_flow_card_net_volume()}</span>
                </div>
                <div class="flex items-baseline">
                  {#if data?.user?.tier === "Pro"}
                    <span
                      class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tabular-nums"
                    >
                      {abbreviateNumber(
                        findLastNonNull(marketTideData, "net_volume"),
                      )}</span
                    >
                  {:else}
                    <a
                      href="/pricing"
                      class="mt-1 inline-flex items-center text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
                    >
                      <svg
                        class="size-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        style="max-width: 40px;"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clip-rule="evenodd"
                        >
                        </path>
                      </svg>
                    </a>
                  {/if}
                </div>
              </div>

              <div
                class="net-call-premium-driver rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/60 dark:bg-zinc-950/40 p-4"
              >
                <div
                  class="text-xs tracking-wide text-gray-800 dark:text-zinc-300 mb-2 flex items-center"
                >
                  <span>{market_flow_card_net_call_prem()}</span>
                </div>
                <div class="flex items-baseline">
                  {#if data?.user?.tier === "Pro"}
                    <span
                      class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tabular-nums"
                    >
                      {abbreviateNumber(
                        findLastNonNull(marketTideData, "net_call_premium"),
                      )}</span
                    >
                  {:else}
                    <a
                      href="/pricing"
                      class="mt-1 inline-flex items-center text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
                    >
                      <svg
                        class="size-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        style="max-width: 40px;"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clip-rule="evenodd"
                        >
                        </path>
                      </svg>
                    </a>
                  {/if}
                </div>
              </div>

              <div
                class="net-put-premium-driver rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/60 dark:bg-zinc-950/40 p-4"
              >
                <div
                  class="text-xs tracking-wide text-gray-800 dark:text-zinc-300 mb-2 flex items-center"
                >
                  <span>{market_flow_card_net_put_prem()}</span>
                </div>
                <div class="flex items-baseline">
                  {#if data?.user?.tier === "Pro"}
                    <span
                      class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tabular-nums"
                    >
                      {abbreviateNumber(
                        findLastNonNull(marketTideData, "net_put_premium"),
                      )}</span
                    >
                  {:else}
                    <a
                      href="/pricing"
                      class="mt-1 inline-flex items-center text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
                    >
                      <svg
                        class="size-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        style="max-width: 40px;"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clip-rule="evenodd"
                        >
                        </path>
                      </svg>
                    </a>
                  {/if}
                </div>
              </div>

              <div
                class="rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/60 dark:bg-zinc-950/40 p-4"
              >
                <div
                  class="text-xs tracking-wide text-gray-800 dark:text-zinc-300 mb-2 flex items-center"
                >
                  <span>{market_flow_card_most_active_sector()}</span>
                </div>
                <div class="flex items-baseline">
                  {#if data?.user?.tier === "Pro"}
                    <a
                      href={sectorNavigation?.find(
                        (listItem) =>
                          listItem?.title === sectorFlow?.at(0)?.sector,
                      )?.link}
                      class="text-lg sm:text-xl font-semibold sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                    >
                      {sectorFlow?.length > 0
                        ? sectorFlow?.at(0)?.sector
                        : "n/a"}
                    </a>
                  {:else}
                    <a
                      href="/pricing"
                      class="mt-1 inline-flex items-center text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
                    >
                      <svg
                        class="size-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        style="max-width: 40px;"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clip-rule="evenodd"
                        >
                        </path>
                      </svg>
                    </a>
                  {/if}
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div class="lg:col-span-2">
                <h2
                  class="mb-2 text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white"
                >
                  {market_flow_section_sp500_flow()}
                </h2>
                {#if data?.user?.tier === "Pro"}
                  <div class="relative">
                    <MarketTideChart {marketTideData} />
                  </div>
                {:else}
                  <div
                    class="rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 h-[360px] flex flex-col items-center justify-center"
                  >
                    <a
                      href="/pricing"
                      class="flex flex-col items-center gap-3 text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
                    >
                      <svg
                        class="size-10"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                        />
                      </svg>
                      <span class="text-sm font-medium"
                        >{market_flow_upgrade_to_pro()}</span
                      >
                    </a>
                  </div>
                {/if}
              </div>

              <div class="">
                <div class="flex items-center justify-between mb-2">
                  <h2
                    class="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white"
                  >
                    {market_flow_section_fear_greed()}
                  </h2>
                  <span class="text-xs italic text-gray-800 dark:text-zinc-300">
                    {market_flow_last_update()} {new Date(
                      data?.getFearAndGreed?.current?.date,
                    )?.toLocaleDateString(getLocale() === "de" ? "de-DE" : "en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div class="relative">
                  <FearAndGreedChart {fearAndGreedValue} {currentCategory} />
                </div>
              </div>

              <div class="">
                <h2
                  class="mb-2 text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white"
                >
                  {market_flow_section_sector_flow()}
                </h2>
                {#if data?.user?.tier === "Pro"}
                  <div class="relative">
                    <SectorFlowChart {sectorFlow} />
                  </div>
                {:else}
                  <div
                    class="rounded-2xl h-[300px] border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 flex flex-col items-center justify-center"
                  >
                    <a
                      href="/pricing"
                      class="flex flex-col items-center gap-3 text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
                    >
                      <svg
                        class="size-10"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                        />
                      </svg>
                      <span class="text-sm font-medium"
                        >{market_flow_upgrade_to_pro()}</span
                      >
                    </a>
                  </div>
                {/if}
              </div>
            </div>

            {#if Object?.keys(overview)?.length > 0}
              <div class="w-full m-auto mt-10">
                <div
                  class="flex flex-col flex-wrap sm:flex-row items-center sm:justify-between mb-4"
                >
                  <h2
                    class="order-1 sm:order-0 mb-6 text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white w-fit"
                  >
                    {market_flow_section_open_interest()}
                  </h2>
                  <div class="flex items-center gap-2 mb-6">
                    <label
                      for="marketFlowBarsModal"
                      class="order-0 sm:order-1 cursor-pointer text-md font-semibold text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                    >
                      <LineChart class="size-6 inline-block " />
                      {market_flow_view_intraday_bars()}
                      {#if !isPro}
                        <svg
                          class="inline-block ml-1 -mt-1 w-3.5 h-3.5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="currentColor"
                            d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                          />
                        </svg>
                      {/if}
                    </label>
                  </div>
                  <div
                    class="flex flex-col -mt-2 mb-8 md:flex-row gap-4 justify-between items-center w-full m-auto"
                  >
                    <!-- Gauge -->
                    <OpenInterestChart {overview} />

                    <!-- Stats -->
                    <div
                      class="grid grid-cols-2 gap-8 p-3 sm:p-0 text-[1rem] w-full sm:w-[50%]"
                    >
                      <div class="flex flex-col">
                        <div
                          class="text-xs sm:text-sm tracking-wide text-gray-800 dark:text-zinc-300 flex items-center gap-x-2"
                        >
                          <span>{market_flow_stat_todays_oi()}</span>
                          <InfoModal
                            id="todaysOI"
                            content="Open Interest (OI) is the total number of outstanding options contracts (both calls and puts) that are still open.  
                    High OI means more market activity and liquidity.  
                    Low OI means less interest and lower liquidity."
                          />
                        </div>
                        <span
                          class="font-semibold text-sm sm:text-base text-gray-700 dark:text-zinc-200 tabular-nums"
                        >
                          {#if isPro}
                            {(
                              overview?.putOI + overview?.callOI
                            )?.toLocaleString("en-US")}
                          {:else}
                            <a
                              href="/pricing"
                              class="inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                            >
                              <svg
                                class="w-4 h-4 mb-1 inline-block"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="currentColor"
                                  d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                />
                              </svg>
                            </a>
                          {/if}
                        </span>
                      </div>

                      <div class="flex flex-col">
                        <div
                          class="text-xs sm:text-sm tracking-wide text-gray-800 dark:text-zinc-300 flex items-center gap-x-2"
                        >
                          <span>{market_flow_stat_put_call_ratio()}</span>
                          <InfoModal
                            id="putCallRatio"
                            content="The Open Interest (OI) Put-Call Ratio compares the number of open put contracts to open call contracts.  
      A high ratio (>1) suggests more puts than calls — often seen as bearish.  
      A low ratio (<1) suggests more calls than puts — often seen as bullish."
                          />
                        </div>

                        <span
                          class="font-semibold text-sm sm:text-base text-gray-700 dark:text-zinc-200 tabular-nums"
                        >
                          {#if isPro}
                            {overview?.pcOI?.toFixed(2)}
                          {:else}
                            <a
                              href="/pricing"
                              class="inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                            >
                              <svg
                                class="w-4 h-4 mb-1 inline-block"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="currentColor"
                                  d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                />
                              </svg>
                            </a>
                          {/if}
                        </span>
                      </div>

                      <div class="flex flex-col">
                        <div
                          class="text-xs sm:text-sm tracking-wide text-gray-800 dark:text-zinc-300 flex items-center gap-x-2"
                        >
                          <span>{market_flow_stat_put_oi()}</span>
                          <InfoModal
                            id="putCallOI"
                            content="Put Open Interest is the total number of open put option contracts on a stock.  
                  High put OI suggests more traders are buying protection or betting on a decline — often seen as bearish.  
                  Low put OI suggests less demand for downside protection — often seen as bullish or neutral."
                          />
                        </div>

                        <span
                          class="font-semibold text-sm sm:text-base text-gray-700 dark:text-zinc-200 tabular-nums"
                        >
                          {#if isPro}
                            {overview?.putOI?.toLocaleString("en-US")}
                          {:else}
                            <a
                              href="/pricing"
                              class="inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                            >
                              <svg
                                class="w-4 h-4 mb-1 inline-block"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="currentColor"
                                  d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                />
                              </svg>
                            </a>
                          {/if}
                        </span>
                      </div>

                      <div class="flex flex-col">
                        <div
                          class="text-xs sm:text-sm tracking-wide text-gray-800 dark:text-zinc-300 flex items-center gap-x-2"
                        >
                          <span>{market_flow_stat_call_oi()}</span>
                          <InfoModal
                            id="callOI"
                            content="Call Open Interest is the total number of open call option contracts on a stock.  
                  High call OI suggests more traders expect the stock to rise or are speculating — often seen as bullish.  
                  Low call OI suggests less demand for upside bets — often seen as bearish or neutral."
                          />
                        </div>

                        <span
                          class="font-semibold text-sm sm:text-base text-gray-700 dark:text-zinc-200 tabular-nums"
                        >
                          {#if isPro}
                            {overview?.callOI?.toLocaleString("en-US")}
                          {:else}
                            <a
                              href="/pricing"
                              class="inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                            >
                              <svg
                                class="w-4 h-4 mb-1 inline-block"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="currentColor"
                                  d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                />
                              </svg>
                            </a>
                          {/if}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  class="flex flex-wrap sm:flex-row items-center sm:justify-between mb-4"
                >
                  <h2
                    class="mb-6 text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white w-fit"
                  >
                    {market_flow_section_volume()}
                  </h2>
                  <div
                    class="flex flex-col -mt-2 mb-8 md:flex-row gap-4 justify-between items-center w-full m-auto"
                  >
                    <!-- Gauge -->
                    <VolumeChart {overview} />

                    <!-- Stats -->
                    <div
                      class="grid grid-cols-2 gap-8 p-3 sm:p-0 text-[1rem] w-full sm:w-[50%]"
                    >
                      <div class="flex flex-col">
                        <div
                          class="text-xs sm:text-sm tracking-wide text-gray-800 dark:text-zinc-300 flex items-center gap-x-2"
                        >
                          <span>{market_flow_stat_todays_volume()}</span>
                          <InfoModal
                            id="todaysVolume"
                            content="Volume is the total number of options contracts traded today.  
                    High volume indicates strong interest and liquidity.  
                    Low volume indicates less trading activity."
                          />
                        </div>
                        <span
                          class="font-semibold text-sm sm:text-base text-gray-700 dark:text-zinc-200 tabular-nums"
                        >
                          {#if isPro}
                            {(
                              overview?.putVol + overview?.callVol
                            )?.toLocaleString("en-US")}
                          {:else}
                            <a
                              href="/pricing"
                              class="inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                            >
                              <svg
                                class="w-4 h-4 mb-1 inline-block"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="currentColor"
                                  d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                />
                              </svg>
                            </a>
                          {/if}
                        </span>
                      </div>

                      <div class="flex flex-col">
                        <div
                          class="text-xs sm:text-sm tracking-wide text-gray-800 dark:text-zinc-300 flex items-center gap-x-2"
                        >
                          <span>{market_flow_stat_put_call_ratio()}</span>
                          <InfoModal
                            id="putCallRatioVol"
                            content="The Volume Put-Call Ratio compares the number of traded put contracts to call contracts.  
      A high ratio (>1) suggests more puts traded — often seen as bearish.  
      A low ratio (<1) suggests more calls traded — often seen as bullish."
                          />
                        </div>

                        <span
                          class="font-semibold text-sm sm:text-base text-gray-700 dark:text-zinc-200 tabular-nums"
                        >
                          {#if isPro}
                            {overview?.pcVol?.toFixed(2)}
                          {:else}
                            <a
                              href="/pricing"
                              class="inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                            >
                              <svg
                                class="w-4 h-4 mb-1 inline-block"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="currentColor"
                                  d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                />
                              </svg>
                            </a>
                          {/if}
                        </span>
                      </div>

                      <div class="flex flex-col">
                        <div
                          class="text-xs sm:text-sm tracking-wide text-gray-800 dark:text-zinc-300 flex items-center gap-x-2"
                        >
                          <span>{market_flow_stat_put_volume()}</span>
                          <InfoModal
                            id="putVol"
                            content="Put Volume is the total number of put option contracts traded today.  
                  High put volume suggests active betting on a decline or hedging.  
                  Low put volume suggests less interest in downside protection."
                          />
                        </div>

                        <span
                          class="font-semibold text-sm sm:text-base text-gray-700 dark:text-zinc-200 tabular-nums"
                        >
                          {#if isPro}
                            {overview?.putVol?.toLocaleString("en-US")}
                          {:else}
                            <a
                              href="/pricing"
                              class="inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                            >
                              <svg
                                class="w-4 h-4 mb-1 inline-block"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="currentColor"
                                  d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                />
                              </svg>
                            </a>
                          {/if}
                        </span>
                      </div>

                      <div class="flex flex-col">
                        <div
                          class="text-xs sm:text-sm tracking-wide text-gray-800 dark:text-zinc-300 flex items-center gap-x-2"
                        >
                          <span>{market_flow_stat_call_volume()}</span>
                          <InfoModal
                            id="callVol"
                            content="Call Volume is the total number of call option contracts traded today.  
                  High call volume suggests active betting on a rise or speculation.  
                  Low call volume suggests less interest in upside bets."
                          />
                        </div>

                        <span
                          class="font-semibold text-sm sm:text-base text-gray-700 dark:text-zinc-200 tabular-nums"
                        >
                          {#if isPro}
                            {overview?.callVol?.toLocaleString("en-US")}
                          {:else}
                            <a
                              href="/pricing"
                              class="inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                            >
                              <svg
                                class="w-4 h-4 mb-1 inline-block"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="currentColor"
                                  d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                />
                              </svg>
                            </a>
                          {/if}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </main>
      </div>
    </div>
  </div>
</section>

<input type="checkbox" id="marketFlowBarsModal" class="modal-toggle" />
<dialog id="marketFlowBarsModal" class="modal p-3 sm:p-0">
  <label for="marketFlowBarsModal" class="cursor-pointer modal-backdrop"
  ></label>
  <div
    class="modal-box w-full max-w-5xl relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
  >
    <div class="flex items-start justify-between gap-4 mb-4">
      <div>
        <h3
          class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white"
        >
          {market_flow_modal_title()}
        </h3>
        <p class="text-xs sm:text-sm text-gray-600 dark:text-zinc-300">
          {market_flow_modal_description()}
        </p>
      </div>
      <label
        for="marketFlowBarsModal"
        class="inline-block cursor-pointer absolute right-4 top-4 text-[1.3rem] sm:text-[1.6rem] text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition"
        aria-label="Close modal"
      >
        <svg
          class="w-6 h-6 sm:w-7 sm:h-7"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          ><path
            fill="currentColor"
            d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
          /></svg>
      </label>
    </div>

    <IntradayBarsChart
      {intradayBars}
      {isPro}
      defaultInterval={isPro ? 15 : 30}
    />
  </div>
</dialog>

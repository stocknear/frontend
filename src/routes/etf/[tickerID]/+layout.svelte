<script lang="ts">
  import {
    wsBidPrice,
    wsAskPrice,
    wsShares,
    globalForm,
    screenWidth,
    openPriceAlert,
    currentPortfolioPrice,
    realtimePrice,
    isCrosshairMoveActive,
    currentPrice,
    priceIncrease,
    etfTicker,
    assetType,
    displayCompanyName,
    isOpen,
    isWeekend,
    shouldUpdatePriceChart,
    priceChartData,
  } from "$lib/store";

  import { onDestroy, afterUpdate } from "svelte";
  import { page } from "$app/stores";

  import { convertTimestamp } from "$lib/utils";
  import TickerHeader from "$lib/components/TickerHeader.svelte";
  import StockPriceExport from "$lib/components/StockPriceExport.svelte";
  import WatchlistButton from "$lib/components/WatchlistButton.svelte";

  import {
    etf_detail_nav_overview,
    etf_detail_nav_holdings,
    etf_detail_nav_unusual_orders,
    etf_detail_nav_options,
    etf_detail_nav_dividends,
    etf_detail_nav_history,
    etf_detail_price_alert,
  } from "$lib/paraglide/messages";

  export let data;
  let prePostData = data?.getPrePostQuote || {};
  $: $realtimePrice = data?.getStockQuote?.price?.toFixed(2);
  let oneDayPrice = [];
  let previousRealtimePrice = null;
  let previousTicker;
  let socket;
  let prePostSocket = null;

  $etfTicker = data?.getParams;
  $assetType = "etf";
  $displayCompanyName = data?.companyName;

  let isScrolled = false;
  let y;

  let displaySection = "";
  let displayLegend = {};

  let isComponentDestroyed = false;

  function changeSection(state) {
    const sectionMap = {
      insider: "/insider",
      options: "/options",
      holdings: "/holdings",
      "unusual-orders": "/unusual-orders",
      dividends: "/dividends",
      history: "/history",
      profile: "/profile",
    };

    if (state !== "overview" && sectionMap[state]) {
      displaySection = state;
      //goto(`/stocks/${$etfTicker}${sectionMap[state]}`);
    } else {
      displaySection = "overview";
      //goto(`/stocks/${$etfTicker}/`);
    }
  }

  function sendMessage(message) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON?.stringify(message));
    } else {
      console.error("WebSocket is not open. Unable to send message.");
    }
  }

  // Pre-Post Quote WebSocket connection
  function connectPrePostWebSocket() {
    if (!data?.wsURL || $isOpen || $isWeekend) {
      return;
    }

    // Prevent duplicate connections
    if (
      prePostSocket &&
      (prePostSocket.readyState === WebSocket.CONNECTING ||
        prePostSocket.readyState === WebSocket.OPEN)
    ) {
      console.log("Pre-post WebSocket already connected or connecting");
      return;
    }

    try {
      prePostSocket = new WebSocket(data?.wsURL + "/pre-post-quote");

      prePostSocket.addEventListener("open", () => {
        console.log("Pre-post quote WebSocket connection opened");

        // Send the ticker to the server
        const message = {
          ticker: $etfTicker,
        };
        prePostSocket.send(JSON.stringify(message));
      });

      prePostSocket.addEventListener("message", (event) => {
        try {
          const newData = JSON.parse(event.data);

          if (newData && Object.keys(newData).length > 0) {
            //console.log("Received pre-post quote update:", newData);
            prePostData = newData;
          }
        } catch (error) {
          console.error(
            "Error processing pre-post quote WebSocket message:",
            error,
          );
        }
      });

      prePostSocket.addEventListener("close", (event) => {
        console.log(
          "Pre-post quote WebSocket connection closed:",
          event.reason,
        );
        prePostSocket = null;

        // Attempt to reconnect if market is closed and component not destroyed
        if (!$isOpen && !$isWeekend && !isComponentDestroyed) {
          setTimeout(() => {
            connectPrePostWebSocket();
          }, 5000);
        }
      });

      prePostSocket.addEventListener("error", (error) => {
        console.error("Pre-post quote WebSocket error:", error);
      });
    } catch (error) {
      console.error(
        "Failed to establish pre-post quote WebSocket connection:",
        error,
      );
    }
  }

  function disconnectPrePostWebSocket() {
    if (prePostSocket) {
      prePostSocket.close();
      prePostSocket = null;
    }
  }

  // Connect/disconnect based on market status
  $: {
    if (!$isOpen && !$isWeekend) {
      connectPrePostWebSocket();
    } else {
      disconnectPrePostWebSocket();
    }
  }

  async function websocketRealtimeData() {
    try {
      socket = new WebSocket(data?.wsURL + "/price-data");

      socket.addEventListener("open", () => {
        console.log("WebSocket connection opened");
        // Send only current watchlist symbols
        const tickerList = [$etfTicker?.toUpperCase()] || [];
        sendMessage(tickerList);
      });

      socket.addEventListener("message", (event) => {
        const data = event.data;
        //console.log("Received message:", data);
        try {
          const parsedData = JSON.parse(data);
          const { type, lp, ls, time, bp, ap, avgPrice } =
            parsedData?.at(0) || {};

          if (type === "T") {
            $realtimePrice = typeof lp !== "undefined" ? lp : null;
            $priceChartData = {
              time: typeof time !== "undefined" ? time : null,
              price: typeof lp !== "undefined" ? Number(lp) : null,
            };
            shouldUpdatePriceChart.set(true);
          } else if (type === "Q") {
            $wsBidPrice = typeof bp !== "undefined" ? bp : null;
            $wsAskPrice = typeof ap !== "undefined" ? ap : null;
            $wsShares = typeof ls !== "undefined" ? ls : 0;

            $realtimePrice =
              typeof avgPrice !== "undefined" ? avgPrice?.toFixed(2) : null;
          }

          // Update price increase state
          if ($realtimePrice !== previousRealtimePrice) {
            $priceIncrease = $realtimePrice > previousRealtimePrice;
            previousRealtimePrice = $realtimePrice;
          }

          $isCrosshairMoveActive = false;
        } catch (e) {
          console.log(e);
        }
      });

      socket.addEventListener("close", (event) => {
        console.log("WebSocket connection closed:", event.reason);
      });
    } catch (error) {
      console.error("WebSocket connection error:", error);
    }
  }

  $: if ($isOpen) {
    websocketRealtimeData();
  }

  afterUpdate(async () => {
    if (previousTicker !== $etfTicker) {
      previousTicker = $etfTicker;

      // Handle price data WebSocket reconnection
      if (typeof socket !== "undefined") {
        socket?.close();
        await new Promise((resolve, reject) => {
          socket?.addEventListener("close", resolve);
        });

        if (socket?.readyState === WebSocket?.CLOSED) {
          await websocketRealtimeData();
          console.log("Price WebSocket connecting again");
        }
        $wsAskPrice = null;
        $wsBidPrice = null;
        $wsShares = null;
      }

      // Handle pre-post quote WebSocket reconnection
      if (prePostSocket) {
        disconnectPrePostWebSocket();
        // Small delay to ensure clean disconnect
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (!$isOpen && !$isWeekend) {
          connectPrePostWebSocket();
          console.log("Pre-post WebSocket connecting for new ticker");
        }
      }
    }
  });

  onDestroy(() => {
    isComponentDestroyed = true;
    try {
      //socket?.send('close')
      socket?.close();
      disconnectPrePostWebSocket();
    } catch (e) {
      console.log(e);
    }

    //$displayCompanyName = '';
    $currentPortfolioPrice = null;
    $currentPrice = null;
    $priceIncrease = null;
    $wsAskPrice = null;
    $wsBidPrice = null;
    $wsShares = null;
    //$traded = false
  });

  $: {
    if ($etfTicker && $etfTicker?.length !== 0) {
      // add a check to see if running on client-side
      $etfTicker = data?.getParams;
      $assetType = "etf";
      $displayCompanyName = data?.companyName;
      $currentPortfolioPrice = data?.getStockQuote?.price?.toFixed(2);
      prePostData = data?.getPrePostQuote || {};
      const output = [...data?.getOneDayPrice] ?? [];
      oneDayPrice = output?.map((item) => ({
        time: Date?.parse(item?.time + "Z") / 1000,
        open: item?.open !== null ? item?.open : NaN,
        high: item?.high !== null ? item?.high : NaN,
        low: item?.low !== null ? item?.low : NaN,
        close: item?.close !== null ? item?.close : NaN,
      }));

      let changesPercentage = null;
      let change = null;
      let currentDataRowOneDay;
      let baseClose =
        data?.getStockQuote?.previousClose || oneDayPrice?.at(0)?.open;

      const length = oneDayPrice?.length;
      for (let i = length - 1; i >= 0; i--) {
        if (!isNaN(oneDayPrice[i]?.close)) {
          currentDataRowOneDay = oneDayPrice[i];
          break;
        }
      }

      // Calculate percentage change if baseClose and currentDataRow are valid
      const closeValue =
        $realtimePrice !== null && $realtimePrice !== undefined
          ? $realtimePrice
          : currentDataRowOneDay?.close || currentDataRowOneDay?.value;

      if (closeValue && baseClose) {
        change = (closeValue - baseClose)?.toFixed(2);
        changesPercentage = ((closeValue / baseClose - 1) * 100)?.toFixed(2);
      }

      // Format date
      const date = new Date(currentDataRowOneDay?.time * 1000);

      const options = {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "UTC",
      };

      const formattedDate = date?.toLocaleString("en-US", options);

      const safeFormattedDate =
        formattedDate === "Invalid Date"
          ? convertTimestamp(data?.getStockQuote?.timestamp)
          : formattedDate;

      // Set display legend
      displayLegend = {
        close:
          $realtimePrice !== null && $realtimePrice !== undefined
            ? $realtimePrice
            : currentDataRowOneDay?.close?.toFixed(2) ||
              data?.getStockQuote?.price?.toFixed(2),
        date: safeFormattedDate,
        changesPercentage,
        change,
      };
    }
  }

  $: charNumber = $screenWidth < 640 ? 25 : 40;

  $: {
    if ($etfTicker && $page.url.pathname === `/etf/${$etfTicker}`) {
      displaySection = "overview";
    }
  }

  $: {
    if ($page?.url?.pathname) {
      const parts = $page?.url?.pathname?.split("/");
      const sectionMap = {
        options: "options",
        "unusual-orders": "unusual-orders",
        holdings: "holdings",
        dividends: "dividends",
        history: "history",
      };
      displaySection =
        sectionMap[
          parts?.find((part) => Object?.keys(sectionMap)?.includes(part))
        ] || "overview";
    }
  }

  $: isScrolled = y > 0;
</script>

<svelte:window bind:scrollY={y} />

<div
  class=" w-full max-w-screen sm:max-w-[1250px] min-h-screen overflow-hidden"
>
  <!-- Page wrapper -->
  <div class=" flex flex-col w-full relative w-full sm:max-w-[1250px]">
    <main class="sm:mt-2 grow w-full">
      <section class="">
        <div class="w-full">
          <div class="sm:flex sm:justify-start w-full">
            <div class=" w-full px-3 sm:px-0 lg:pr-3">
              <div
                class="md:flex md:justify-between md:divide-x md:divide-gray-200/70 dark:md:divide-zinc-800/80"
              >
                <!-- Main content -->
                <div class="pb-12 md:pb-20 w-full">
                  <div class="">
                    <!-----Start-Header-CandleChart-Indicators------>

                    <div class="m-auto pl-0 sm:pl-4 overflow-hidden mb-3">
                      <div
                        class="flex flex-row w-full justify-between items-center"
                      >
                        <!--Start Watchlist-->

                        <div
                          class="-mb-1 mt-6 flex justify-end sm:ml-auto w-full ml-auto sm:gap-2 sm:right-5 sm:top-6 sm:mb-0 sm:mt-0 sm:w-auto lg:right-8"
                        >
                          <!-- Mobile: Unified button group -->
                          <div class="flex items-center w-full shadow rounded-full border border-gray-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 sm:hidden">
                            <WatchlistButton
                              ticker={$etfTicker}
                              assetType="etf"
                              price={data?.getStockQuote?.price}
                            />
                            <div class="w-px h-5 bg-gray-300 dark:bg-zinc-700"></div>
                            <label
                              on:click={() => ($openPriceAlert = true)}
                              for={data?.user ? "priceAlertModal" : "userLogin"}
                              class="flex-1 inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 px-2 py-2.5 text-xs font-medium"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="size-4 flex-shrink-0"
                                viewBox="0 0 24 24"
                              >
                                <g
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="1.5"
                                >
                                  <path d="M3 5.231L6.15 3M21 5.231L17.85 3" />
                                  <circle cx="12" cy="13" r="8" />
                                  <path d="M9.5 13h5M12 10.5v5" />
                                </g>
                              </svg>
                              <span>Price Alert</span>
                            </label>
                            <div class="w-px h-5 bg-gray-300 dark:bg-zinc-700"></div>
                            <a
                              href="/chart/{$etfTicker}"
                              class="flex-1 inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 px-2 py-2.5 text-xs font-medium"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="size-4 flex-shrink-0"
                                viewBox="0 0 18 18"
                                fill="currentColor"
                              >
                                <path d="M17 8.2 9 16 1 8.2 3.667 3h10.666zM2.226 8 9 14.602 15.773 8l-2.05-4H4.277zM7 7h1v2H7v1H6V9H5V7h1V5h1zm5-1h1v2h-1v2h-1V8h-1V6h1V5h1z" />
                              </svg>
                              <span>Pro Chart</span>
                            </a>
                          </div>

                          <!-- Desktop: Individual buttons -->
                          <div class="hidden sm:flex sm:gap-2">
                            <WatchlistButton
                              ticker={$etfTicker}
                              assetType="etf"
                              price={data?.getStockQuote?.price}
                            />
                            <label
                              on:click={() => ($openPriceAlert = true)}
                              for={data?.user ? "priceAlertModal" : "userLogin"}
                              class="group shadow inline-flex items-center justify-center cursor-pointer transition-all duration-700 ease-out whitespace-nowrap rounded-full border border-gray-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 text-gray-900 dark:text-white hover:bg-white/80 dark:hover:bg-zinc-900/70 p-2.5 text-sm"
                              title={etf_detail_price_alert()}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="size-5 flex-shrink-0"
                                viewBox="0 0 24 24"
                              >
                                <g
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="1.5"
                                >
                                  <path d="M3 5.231L6.15 3M21 5.231L17.85 3" />
                                  <circle cx="12" cy="13" r="8" />
                                  <path d="M9.5 13h5M12 10.5v5" />
                                </g>
                              </svg>
                              <span class="text-sm overflow-hidden max-w-0 group-hover:max-w-28 group-hover:ml-1.5 transition-all duration-700 ease-out">{etf_detail_price_alert()}</span>
                            </label>
                            <a
                              href="/chart/{$etfTicker}"
                              class="group shadow inline-flex items-center justify-center cursor-pointer transition-all duration-700 ease-out whitespace-nowrap rounded-full border border-gray-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 text-gray-900 dark:text-white hover:bg-white/80 dark:hover:bg-zinc-900/70 p-2.5 text-sm"
                              title="Pro Chart"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="size-5 flex-shrink-0"
                                viewBox="0 0 18 18"
                                fill="currentColor"
                              >
                                <path d="M17 8.2 9 16 1 8.2 3.667 3h10.666zM2.226 8 9 14.602 15.773 8l-2.05-4H4.277zM7 7h1v2H7v1H6V9H5V7h1V5h1zm5-1h1v2h-1v2h-1V8h-1V6h1V5h1z" />
                              </svg>
                              <span class="text-sm overflow-hidden max-w-0 group-hover:max-w-24 group-hover:ml-1.5 transition-all duration-700 ease-out">Pro Chart</span>
                            </a>
                            <StockPriceExport
                              ticker={$etfTicker}
                              user={data?.user}
                              className="sm:flex-1 md:flex-initial"
                            />
                          </div>
                        </div>

                        <!--End Watchlist-->
                      </div>

                      <!-- svelte-ignore a11y-click-events-have-key-events -->
                      <!-- svelte-ignore a11y-label-has-associated-control -->

                      <TickerHeader
                        {data}
                        isOpen={$isOpen}
                        {prePostData}
                        ticker={$etfTicker}
                        displayCompanyName={$displayCompanyName}
                        {displayLegend}
                        {charNumber}
                      />
                    </div>
                    <!-----End-Header-CandleChart-Indicators------>

                    <!--Start Ticker Section-->

                    <nav
                      class="sm:ml-4 border-b border-gray-300 dark:border-zinc-700 overflow-x-auto whitespace-nowrap"
                    >
                      <ul
                        class="flex flex-row items-center w-full gap-1 pb-2 text-sm sm:text-base"
                      >
                        <a
                          href={`/etf/${$etfTicker}`}
                          on:click={() => changeSection("overview")}
                          class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySection ===
                          'overview'
                            ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                            : 'border-transparent text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                        >
                          {etf_detail_nav_overview()}
                        </a>

                        <a
                          href={`/etf/${$etfTicker}/holdings`}
                          on:click={() => changeSection("holdings")}
                          class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySection ===
                          'holdings'
                            ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                            : 'border-transparent text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                        >
                          {etf_detail_nav_holdings()}
                        </a>

                        <a
                          href={`/etf/${$etfTicker}/unusual-orders`}
                          on:click={() => changeSection("unusual-orders")}
                          class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySection ===
                          'unusual-orders'
                            ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                            : 'border-transparent text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                        >
                          {etf_detail_nav_unusual_orders()}
                        </a>
                        <a
                          href={`/etf/${$etfTicker}/options`}
                          on:click={() => changeSection("options")}
                          class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySection ===
                          'options'
                            ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                            : 'border-transparent text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                        >
                          {etf_detail_nav_options()}
                        </a>

                        <a
                          href={`/etf/${$etfTicker}/dividends`}
                          on:click={() => changeSection("dividends")}
                          class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySection ===
                          'dividends'
                            ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                            : 'border-transparent text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                        >
                          {etf_detail_nav_dividends()}
                        </a>
                        <a
                          href={`/etf/${$etfTicker}/history`}
                          on:click={() => changeSection("history")}
                          class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySection ===
                          'history'
                            ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                            : 'border-transparent text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                        >
                          {etf_detail_nav_history()}
                        </a>
                      </ul>
                    </nav>

                    <!--Start-Main Content-->
                    {#key $etfTicker}
                      <slot />
                    {/key}
                    <!--End Main Content-->
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</div>

<!--Start Login Modal-->
{#if !data?.user}
  {#await import("$lib/components/LoginPopup.svelte") then { default: Comp }}
    <svelte:component this={Comp} form={$globalForm} />
  {/await}
{/if}
<!--End Login Modal-->

<!--Start SellTrade Modal-->
{#await import("$lib/components/PriceAlert.svelte") then { default: Comp }}
  <svelte:component this={Comp} {data} ticker={$etfTicker} assetType="etf" />
{/await}


<style lang="scss">
  .scrollbar {
    display: grid;
    grid-gap: 17px;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    grid-auto-flow: column;
    overflow-x: auto;
    scrollbar-width: thin; /* Hide the default scrollbar in Firefox */
    scrollbar-color: transparent transparent; /* Hide the default scrollbar in Firefox */
  }

  /* Custom scrollbar for Webkit (Chrome, Safari) */
  .scrollbar::-webkit-scrollbar {
    width: 0; /* Hide the width of the scrollbar */
    height: 0; /* Hide the height of the scrollbar */
  }

  .scrollbar::-webkit-scrollbar-thumb {
    background: transparent; /* Make the thumb transparent */
  }

  ::-webkit-scrollbar {
    height: 7px;
    width: 10px;
    background: #09090b;
  }

  ::-webkit-scrollbar-thumb {
    background: #6b6f79;
    -webkit-border-radius: 1ex;
  }

  ::-webkit-scrollbar-corner {
    background: #09090b;
  }
</style>

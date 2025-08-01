<script lang="ts">
  import {
    wsBidPrice,
    wsAskPrice,
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
    shouldUpdatePriceChart,
    priceChartData,
  } from "$lib/store";

  import { onDestroy, afterUpdate } from "svelte";
  import { page } from "$app/stores";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";

  import { convertTimestamp } from "$lib/utils";
  import TickerHeader from "$lib/components/TickerHeader.svelte";

  export let data;
  let prePostData = data?.getPrePostQuote || {};
  $: $realtimePrice = data?.getStockQuote?.price?.toFixed(2);
  let oneDayPrice = [];
  let previousRealtimePrice = null;
  let previousTicker;
  let socket;

  $etfTicker = data?.getParams;
  $assetType = "etf";
  $displayCompanyName = data?.companyName;

  let isScrolled = false;
  let y;

  let userWatchList = data?.getUserWatchlist ?? [];
  //let userPortfolio = data?.getUserPortfolio ?? [];
  //let holdingShares = 0;
  //let availableCash = 0;

  let displaySection = "";
  let displayLegend = {};

  function changeSection(state) {
    const sectionMap = {
      insider: "/insider",
      options: "/options",
      holdings: "/holdings",
      "dark-pool": "/dark-pool",
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

  async function toggleUserWatchlist(watchListId: string) {
    try {
      // Find the index of the watchlist
      const watchlistIndex = userWatchList?.findIndex(
        (item) => item?.id === watchListId,
      );

      if (watchlistIndex !== -1 && watchlistIndex !== undefined) {
        const watchlist = userWatchList[watchlistIndex];
        const existingTickerIndex = watchlist?.ticker?.indexOf($etfTicker);

        let updatedTickers = [...(watchlist?.ticker || [])]; // Ensure we don't mutate directly

        if (existingTickerIndex !== -1) {
          // Remove the ticker if it exists
          updatedTickers.splice(existingTickerIndex, 1);
        } else {
          // Add the ticker if it doesn't exist
          updatedTickers.push($etfTicker);

          // Check tier limits
          if (
            !["Pro", "Plus"]?.includes(data?.user?.tier) &&
            updatedTickers.length > 5
          ) {
            toast.error("Upgrade to Pro to add unlimited stocks!", {
              style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
            });
            return;
          }
        }

        // Update the local state immutably
        userWatchList = userWatchList.map((item, idx) =>
          idx === watchlistIndex ? { ...item, ticker: updatedTickers } : item,
        );

        // Send API request
        const response = await fetch("/api/update-watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ watchListId, ticker: $etfTicker }),
        });

        const output = await response.json();

        // Update userWatchList based on API response
        userWatchList = userWatchList.map((item) =>
          item.id === watchListId ? output : item,
        );
      } else {
        // If watchlist doesn't exist, create a new entry
        const response = await fetch("/api/update-watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ watchListId, ticker: $etfTicker }),
        });

        const output = await response.json();
        userWatchList = [...userWatchList, output];
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  }

  function sendMessage(message) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON?.stringify(message));
    } else {
      console.error("WebSocket is not open. Unable to send message.");
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
          const { type, lp, time, bp, ap, avgPrice } = parsedData?.at(0) || {};

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

  let LoginPopup;

  $: if ($isOpen) {
    websocketRealtimeData();
  }

  afterUpdate(async () => {
    if (previousTicker !== $etfTicker && typeof socket !== "undefined") {
      previousTicker = $etfTicker;
      //socket.send('close')
      socket?.close();
      await new Promise((resolve, reject) => {
        socket?.addEventListener("close", resolve);
      });

      if (socket?.readyState === WebSocket?.CLOSED) {
        await websocketRealtimeData();
        console.log("connecting again");
      }
      $wsAskPrice = null;
      $wsBidPrice = null;
    }
  });

  onDestroy(() => {
    try {
      //socket?.send('close')
      socket?.close();
    } catch (e) {
      console.log(e);
    }

    //$displayCompanyName = '';
    $currentPortfolioPrice = null;
    $currentPrice = null;
    $priceIncrease = null;
    $wsAskPrice = null;
    $wsBidPrice = null;
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
        "dark-pool": "dark-pool",
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

<body
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
                class="md:flex md:justify-between md:divide-x md:divide-slate-800"
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
                          class="-mb-1 mt-6 flex sm:ml-auto w-full ml-auto gap-2 sm:right-5 sm:top-6 sm:mb-0 sm:mt-0 sm:w-auto lg:right-8"
                        >
                          <label
                            for={data?.user ? "addWatchListModal" : "userLogin"}
                            class="inline-flex items-center justify-center gap-x-1.5 cursor-pointer transition-all whitespace-nowrap rounded bg-default sm:hover:bg-black dark:sm:hover:bg-[#2A2E39] border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-base font-semibold text-white shadow-xs lg:px-2.5 flex-1 md:flex-initial"
                            ><svg
                              class="size-5 flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              style="max-width:40px"
                              aria-hidden="true"
                              ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                              ></path></svg
                            >
                            <span class="text-sm md:text-[1rem]">Watchlist</span
                            ></label
                          >
                          <label
                            on:click={() => ($openPriceAlert = true)}
                            for={data?.user ? "priceAlertModal" : "userLogin"}
                            class="inline-flex items-center justify-center gap-x-1.5 cursor-pointer transition-all whitespace-nowrap rounded bg-default sm:hover:bg-black dark:sm:hover:bg-[#2A2E39] border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-base font-semibold text-white shadow-xs lg:px-2.5 flex-1 md:flex-initial"
                            ><svg
                              xmlns="http://www.w3.org/2000/svg"
                              class="size-5 flex-shrink-0"
                              viewBox="0 0 24 24"
                              ><g
                                fill="none"
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="1.5"
                                ><path
                                  d="M3 5.231L6.15 3M21 5.231L17.85 3"
                                /><circle cx="12" cy="13" r="8" /><path
                                  d="M9.5 13h5M12 10.5v5"
                                /></g
                              ></svg
                            >
                            <span class="text-sm md:text-[1rem]"
                              >Price Alert</span
                            ></label
                          >
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
                      class="sm:ml-4 border-b-[2px] border-[#2C6288] dark:border-white overflow-x-auto whitespace-nowrap no-scrollbar"
                    >
                      <ul
                        class="flex flex-row items-center w-full text-[1rem] text-white"
                      >
                        <a
                          href={`/etf/${$etfTicker}`}
                          on:click={() => changeSection("overview")}
                          class="p-2 px-5 cursor-pointer {displaySection ===
                          'overview'
                            ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-secondary font-semibold'
                            : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-secondary'}"
                        >
                          Overview
                        </a>

                        <a
                          href={`/etf/${$etfTicker}/holdings`}
                          on:click={() => changeSection("holdings")}
                          class="p-2 px-5 cursor-pointer {displaySection ===
                          'holdings'
                            ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-secondary font-semibold'
                            : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-secondary'}"
                        >
                          Holdings
                        </a>

                        <a
                          href={`/etf/${$etfTicker}/dark-pool`}
                          on:click={() => changeSection("dark-pool")}
                          class="p-2 px-5 cursor-pointer {displaySection ===
                          'dark-pool'
                            ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-secondary font-semibold'
                            : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-secondary'}"
                        >
                          Dark Pool
                        </a>
                        <a
                          href={`/etf/${$etfTicker}/options`}
                          on:click={() => changeSection("options")}
                          class="p-2 px-5 cursor-pointer {displaySection ===
                          'options'
                            ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-secondary font-semibold'
                            : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-secondary'}"
                        >
                          Options
                        </a>

                        <a
                          href={`/etf/${$etfTicker}/dividends`}
                          on:click={() => changeSection("dividends")}
                          class="p-2 px-5 cursor-pointer {displaySection ===
                          'dividends'
                            ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-secondary font-semibold'
                            : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-secondary'}"
                        >
                          Dividends
                        </a>
                        <a
                          href={`/etf/${$etfTicker}/history`}
                          on:click={() => changeSection("history")}
                          class="p-2 px-5 cursor-pointer {displaySection ===
                          'history'
                            ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-secondary font-semibold'
                            : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-secondary'}"
                        >
                          History
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
</body>

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

<!--Start Add Watchlist Modal-->
<input type="checkbox" id="addWatchListModal" class="modal-toggle" />

<dialog id="addWatchListModal" class="modal bg-[#000]/40 p-3 sm:p-0">
  <label
    id="addWatchListModal"
    for="addWatchListModal"
    class="cursor-pointer modal-backdrop"
  ></label>

  <div
    class="modal-box max-h-96 rounded w-full bg-white dark:bg-secondary border border-gray-600"
  >
    <div
      class="mb-5 flex flex-row justify-between items-center border-b pb-2 border-gray-300 dark:border-gray-600"
    >
      <h3 class="font-semibold text-lg sm:text-xl text-black dark:text-white">
        Add to Watchlist
      </h3>
      <label
        for="addWatchListModal"
        class="cursor-pointer absolute right-5 top-2 text-[1rem] sm:text-[1.5rem]"
      >
        ✕
      </label>
    </div>

    <div class="">
      <div class="flex flex-col items-center w-full max-w-3xl">
        {#each userWatchList as item}
          <label
            on:click|stopPropagation={() => toggleUserWatchlist(item?.id)}
            class="cursor-pointer w-full flex flex-row justify-start items-center mb-5"
          >
            <div
              class="flex flex-row items-center w-full border p-3 rounded {item?.ticker?.includes(
                $etfTicker,
              )
                ? 'border border-gray-600 dark:border-gray-300'
                : 'border-gray-300 dark:border-gray-600'}"
            >
              <div class="flex flex-col items-center w-full">
                <span class="ml-1 mr-auto">
                  {item?.title}
                </span>
                <span class="ml-1 text-sm mr-auto">
                  {item?.ticker?.length}
                  {item?.ticker?.length !== 1 ? "Companies" : "Company"}
                </span>
              </div>

              <div
                class="rounded-full w-8 h-8 relative border border-[#737373]"
              >
                {#if item?.ticker?.includes($etfTicker)}
                  <svg
                    class="w-full h-full rounded-full text-black dark:text-white"
                    viewBox="0 0 48 48"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    fill="#09090B000"
                    ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                      id="SVGRepo_tracerCarrier"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></g><g id="SVGRepo_iconCarrier">
                      <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->
                      <title>ic_fluent_checkmark_circle_48_filled</title>
                      <desc>Created with Sketch.</desc>
                      <g
                        stroke="none"
                        stroke-width="1"
                        fill="none"
                        fill-rule="evenodd"
                      >
                        <g
                          id="ic_fluent_checkmark_circle_48_filled"
                          fill="currentColor"
                          fill-rule="nonzero"
                        >
                          <path
                            d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z"
                          >
                          </path>
                        </g>
                      </g>
                    </g></svg
                  >
                {/if}
              </div>
            </div>
          </label>
        {/each}
      </div>
    </div>
  </div>
</dialog>

<!--End Add Watchlist Modal-->

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
    -webkit-box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.75);
  }

  ::-webkit-scrollbar-corner {
    background: #09090b;
  }
</style>

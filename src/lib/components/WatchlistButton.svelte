<script lang="ts">
  import { page } from "$app/stores";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";

  // Import all localization messages
  import {
    stock_detail_watchlist,
    stock_detail_add_to_watchlist,
    stock_detail_ticker_added,
    stock_detail_ticker_add_failed,
    stock_detail_upgrade_watchlist,
    stock_detail_companies,
    stock_detail_company,
  } from "$lib/paraglide/messages";
  import {
    etf_detail_watchlist,
    etf_detail_add_to_watchlist,
    etf_detail_ticker_added,
    etf_detail_ticker_add_failed,
    etf_detail_upgrade_watchlist,
    etf_detail_companies,
    etf_detail_company,
  } from "$lib/paraglide/messages";
  import {
    index_detail_watchlist,
    index_detail_add_to_watchlist,
    index_detail_ticker_added,
    index_detail_ticker_add_failed,
    index_detail_upgrade_watchlist,
    index_detail_companies,
    index_detail_company,
  } from "$lib/paraglide/messages";

  // Props - minimal, only what's truly needed
  export let ticker: string;
  export let assetType: "stock" | "etf" | "index";
  export let price: number | null = null;

  // Get user and watchlists from page data (no prop drilling!)
  $: user = $page.data?.user;
  $: initialWatchlists = $page.data?.getUserWatchlist ?? [];

  // Local state
  let userWatchList: any[] = [];
  let isTogglingWatchlist = false;
  let isModalOpen = false;

  // Initialize watchlist from page data
  $: userWatchList = initialWatchlists;

  // Message lookup based on asset type
  const messages = {
    stock: {
      watchlist: stock_detail_watchlist,
      addTo: stock_detail_add_to_watchlist,
      added: stock_detail_ticker_added,
      addFailed: stock_detail_ticker_add_failed,
      upgrade: stock_detail_upgrade_watchlist,
      companies: stock_detail_companies,
      company: stock_detail_company,
    },
    etf: {
      watchlist: etf_detail_watchlist,
      addTo: etf_detail_add_to_watchlist,
      added: etf_detail_ticker_added,
      addFailed: etf_detail_ticker_add_failed,
      upgrade: etf_detail_upgrade_watchlist,
      companies: etf_detail_companies,
      company: etf_detail_company,
    },
    index: {
      watchlist: index_detail_watchlist,
      addTo: index_detail_add_to_watchlist,
      added: index_detail_ticker_added,
      addFailed: index_detail_ticker_add_failed,
      upgrade: index_detail_upgrade_watchlist,
      companies: index_detail_companies,
      company: index_detail_company,
    },
  };

  $: msg = messages[assetType];

  // Helper to check if ticker exists in watchlist (handles both string and object formats)
  function tickerExistsInWatchlist(
    tickers: (string | { symbol: string })[],
    symbol: string
  ): boolean {
    if (!tickers || !Array.isArray(tickers)) return false;
    return tickers.some((t) =>
      typeof t === "string" ? t === symbol : t?.symbol === symbol
    );
  }

  // Open login modal for unauthenticated users
  function openLoginModal() {
    const modal = document.getElementById("userLogin") as HTMLInputElement;
    if (modal) modal.checked = true;
  }

  // Handle watchlist button click
  async function handleWatchlistButtonClick() {
    if (!user) {
      openLoginModal();
      return;
    }

    if (!userWatchList || userWatchList.length === 0) {
      // No watchlists exist, create one and add ticker
      try {
        const response = await fetch("/api/update-watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            watchListId: "default",
            ticker: ticker,
            title: "My Watchlist",
            price: price,
          }),
        });

        const output = await response.json();
        userWatchList = [output];

        toast.success(msg.added(), {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        });
      } catch (error) {
        console.error("Error creating watchlist:", error);
        toast.error(msg.addFailed(), {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        });
      }
    } else {
      // Watchlists exist, open modal
      isModalOpen = true;
    }
  }

  // Toggle ticker in watchlist
  async function toggleUserWatchlist(watchListId: string) {
    if (isTogglingWatchlist) return;
    isTogglingWatchlist = true;

    try {
      const watchlistIndex = userWatchList.findIndex(
        (item) => item?.id === watchListId
      );

      if (watchlistIndex !== -1) {
        const watchlist = userWatchList[watchlistIndex];
        const tickerExists = tickerExistsInWatchlist(watchlist?.ticker, ticker);

        // Check tier limits before adding
        if (!tickerExists) {
          const currentCount = watchlist?.ticker?.length || 0;
          if (!["Pro", "Plus"].includes(user?.tier) && currentCount >= 5) {
            toast.error(msg.upgrade(), {
              style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
            });
            return;
          }
        }

        // Send API request - let the server handle the toggle
        const response = await fetch("/api/update-watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            watchListId,
            ticker: ticker,
            price: !tickerExists ? price : undefined,
          }),
        });

        const output = await response.json();

        // Update local state based on API response (single source of truth)
        userWatchList = userWatchList.map((item) =>
          item.id === watchListId ? output : item
        );
      } else {
        // If watchlist doesn't exist, create a new entry
        const response = await fetch("/api/update-watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            watchListId,
            ticker: ticker,
            price: price,
          }),
        });

        const output = await response.json();
        userWatchList = [...userWatchList, output];
      }
    } catch (error) {
      console.error("An error occurred:", error);
    } finally {
      isTogglingWatchlist = false;
    }
  }

  function closeModal() {
    isModalOpen = false;
  }
</script>

<!-- Watchlist Button -->
<button
  on:click={handleWatchlistButtonClick}
  class="shadow inline-flex items-center justify-center gap-x-1.5 cursor-pointer transition-all whitespace-nowrap rounded-full border border-gray-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 text-gray-900 dark:text-white hover:bg-white/80 dark:hover:bg-zinc-900/70 px-3 py-2 text-sm lg:px-3 flex-1 md:flex-initial"
>
  <svg
    class="size-5 flex-shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    style="max-width:40px"
    aria-hidden="true"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
  <span class="text-sm md:text-sm">{msg.watchlist()}</span>
</button>

<!-- Watchlist Modal -->
<input
  type="checkbox"
  id="watchlistModal-{ticker}"
  class="modal-toggle"
  bind:checked={isModalOpen}
/>

<dialog id="watchlistModal-{ticker}" class="modal p-3 sm:p-0">
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="modal-backdrop"
    on:click={closeModal}
  ></div>

  <div
    class="modal-box max-h-96 rounded-2xl w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-800 text-gray-700 dark:text-zinc-200"
  >
    <div
      class="mb-5 flex flex-row justify-between items-center border-b pb-2 border-gray-200/70 dark:border-zinc-800"
    >
      <h3 class="font-semibold text-lg sm:text-xl text-gray-900 dark:text-white">
        {msg.addTo()}
      </h3>
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <span
        class="cursor-pointer absolute right-5 top-2 text-sm sm:text-[1.5rem]"
        on:click={closeModal}
      >
        ✕
      </span>
    </div>

    <div class="">
      <div class="flex flex-col items-center w-full max-w-3xl">
        {#each userWatchList as item}
          <label
            on:click|stopPropagation={() => toggleUserWatchlist(item?.id)}
            class="cursor-pointer w-full flex flex-row justify-start items-center mb-5"
          >
            <div
              class="flex flex-row items-center w-full border p-3 rounded-2xl {tickerExistsInWatchlist(
                item?.ticker,
                ticker
              )
                ? 'border-gray-200/70 dark:border-zinc-700/80 bg-gray-50/60 dark:bg-zinc-900/50'
                : 'border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40'}"
            >
              <div class="flex flex-col items-center w-full">
                <span class="ml-1 mr-auto text-gray-700 dark:text-zinc-200">
                  {item?.title}
                </span>
                <span class="ml-1 text-sm mr-auto text-gray-500 dark:text-zinc-300">
                  {item?.ticker?.length}
                  {item?.ticker?.length !== 1 ? msg.companies() : msg.company()}
                </span>
              </div>

              <div
                class="rounded-full w-8 h-8 relative border border-gray-300 dark:border-zinc-700"
              >
                {#if tickerExistsInWatchlist(item?.ticker, ticker)}
                  <svg
                    class="w-full h-full rounded-full text-gray-700 dark:text-zinc-200"
                    viewBox="0 0 48 48"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    fill="#09090B000"
                  >
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      <title>ic_fluent_checkmark_circle_48_filled</title>
                      <desc>Created with Sketch.</desc>
                      <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                        <g
                          id="ic_fluent_checkmark_circle_48_filled"
                          fill="currentColor"
                          fill-rule="nonzero"
                        >
                          <path
                            d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z"
                          />
                        </g>
                      </g>
                    </g>
                  </svg>
                {/if}
              </div>
            </div>
          </label>
        {/each}
      </div>
    </div>
  </div>
</dialog>

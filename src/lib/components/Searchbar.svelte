<script lang="ts">
  import { screenWidth } from "$lib/store";
  import { page } from "$app/stores";
  import { onDestroy, onMount } from "svelte";
  import Search from "lucide-svelte/icons/search";
  import { goto } from "$app/navigation";
  import { Combobox } from "bits-ui";
  import {
    searchbar_aria_label,
    searchbar_no_results,
    searchbar_placeholder,
    searchbar_popular,
    searchbar_recent,
    searchbar_search_label,
    searchbar_suggestions,
  } from "$lib/paraglide/messages.js";

  type SearchItem = {
    symbol: string;
    name: string;
    type: string;
  };

  const SEARCH_DEBOUNCE_MS = 120;

  let searchHistory: SearchItem[] = [];
  let updatedSearchHistory: SearchItem[] = [];
  let searchBarData: SearchItem[] = [];
  let isLoading = false;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let historyCommitTimeoutId: ReturnType<typeof setTimeout> | undefined;
  let focusTimeoutId: ReturnType<typeof setTimeout> | undefined;
  let searchAbortController: AbortController | null = null;
  let showSuggestions = false;
  let touchedInput = false;
  let isNavigatingWithSpinner = false;

  let inputValue = "";

  // Clear search input (delayed to run after Combobox internal handler)
  const clearSearchInput = () => {
    setTimeout(() => {
      inputValue = "";
      searchBarData = [];
      touchedInput = false;
    }, 0);
  };
  let searchBarModalChecked = false;
  let inputElement: HTMLInputElement | null = null;
  let isNavigating = false;

  const popularList = [
    {
      symbol: "KO",
      name: "Coca Cola Company",
      type: "Stock",
    },
    {
      symbol: "TSLA",
      name: "Tesla Inc",
      type: "Stock",
    },
    {
      symbol: "AMD",
      name: "Advanced Micro Devices",
      type: "Stock",
    },
    {
      symbol: "SPY",
      name: "SPDR S&P 500 ETF Trust",
      type: "ETF",
    },
    {
      symbol: "NVDA",
      name: "Nvidia",
      type: "Stock",
    },
  ];

  async function handleSearch(symbol: string, assetType: string) {
    if (isNavigating) return;
    isNavigating = true;

    // Close modal immediately on mobile and show spinner
    if ($screenWidth < 640) {
      searchBarModalChecked = false;
      isNavigatingWithSpinner = true;
      // Small delay to ensure modal closes before navigation
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    const upperSymbol = symbol?.toUpperCase();

    // Pull current path's segments
    const segments = $page.url.pathname.split("/").filter(Boolean);
    const prevRoot = segments[0]?.toLowerCase() || "";

    // If we're on /chart/[slug], navigate to /chart/[newSymbol]
    if (prevRoot === "chart") {
      const newPath = `/chart/${upperSymbol}`;
      await goto(newPath, { replaceState: true });
      clearSearchInput();
      isNavigatingWithSpinner = false;

      // Update search history for chart navigation
      let newSearchItem = searchBarData?.find(
        ({ symbol }) => symbol?.toUpperCase() === upperSymbol,
      );
      if (!newSearchItem) {
        newSearchItem = searchHistory?.find(
          ({ symbol }) => symbol?.toUpperCase() === upperSymbol,
        );
      }
      if (!newSearchItem) {
        newSearchItem = popularList?.find(
          ({ symbol }) => symbol?.toUpperCase() === upperSymbol,
        );
      }
      if (newSearchItem) {
        const itemToAdd = {
          symbol: newSearchItem.symbol,
          name: newSearchItem.name,
          type: newSearchItem.type,
        };
        updatedSearchHistory = [
          itemToAdd,
          ...(searchHistory?.filter(
            (item) => item?.symbol?.toUpperCase() !== upperSymbol,
          ) || []),
        ]?.slice(0, 5);
      }

      setTimeout(() => (isNavigating = false), 100);
      return;
    }

    // normalize type to 'etf' | 'index' | 'stock'
    let type = (assetType || "stocks")?.toLowerCase();
    if (type.endsWith("s")) type = type.slice(0, -1);

    // Only keep suffix if we began on a finance page
    const suffix = ["stocks", "etfs", "etf", "indexes", "index"].includes(
      prevRoot,
    )
      ? segments.slice(2)
      : [];

    const firstSuffix = suffix[0]?.toLowerCase() || "";

    // Determine new root
    let root = type === "etf" ? "etf" : type === "index" ? "index" : "stocks";
    let newSuffix = suffix;

    // metrics always goes to stocks
    if (firstSuffix === "metrics") {
      if (type === "stock") {
        root = "stocks";
        newSuffix = ["metrics"];
      } else {
        // ETF or INDEX: strip the metrics suffix entirely
        newSuffix = [];
      }
    } else {
      // block some sub-pages when leaving stocks
      const blocked = [
        "metrics",
        "profile",
        "statistics",
        "forecast",
        "insider",
        "financials",
      ];
      if (root !== "stocks" && blocked?.some((b) => firstSuffix?.includes(b))) {
        newSuffix = [];
      }

      // moving to index from stocks/etf: strip dividend/unusual-orders
      if (
        type === "index" &&
        (prevRoot === "stocks" || prevRoot === "etf") &&
        (firstSuffix?.includes("dividends") ||
          firstSuffix?.includes("unusual-orders"))
      ) {
        newSuffix = [];
      }

      // moving to stock from etf/index: strip holdings
      if (
        type === "stock" &&
        (prevRoot === "etf" || prevRoot === "index") &&
        firstSuffix?.includes("holdings")
      ) {
        root = "stocks";
        newSuffix = [];
      }
    }

    const newPath = `/${[root, upperSymbol, ...newSuffix].join("/")}`;

    // Navigate and wait for completion
    await goto(newPath, { replaceState: true });

    clearSearchInput();
    isNavigatingWithSpinner = false; // Hide spinner after navigation

    // Find the item in searchBarData, searchHistory, or popularList
    let newSearchItem = searchBarData?.find(
      ({ symbol }) => symbol?.toUpperCase() === upperSymbol,
    );

    // If not found in searchBarData, look in searchHistory
    if (!newSearchItem) {
      newSearchItem = searchHistory?.find(
        ({ symbol }) => symbol?.toUpperCase() === upperSymbol,
      );
    }

    // If still not found, look in popularList
    if (!newSearchItem) {
      newSearchItem = popularList?.find(
        ({ symbol }) => symbol?.toUpperCase() === upperSymbol,
      );
    }

    // If we found the item (from any source), update the history
    if (newSearchItem) {
      // Create a new item object to ensure it's treated as "new"
      const itemToAdd = {
        symbol: newSearchItem.symbol,
        name: newSearchItem.name,
        type: newSearchItem.type,
      };

      // Remove any existing instance and add to the top
      updatedSearchHistory = [
        itemToAdd,
        ...(searchHistory?.filter(
          (item) => item?.symbol?.toUpperCase() !== upperSymbol,
        ) || []),
      ]?.slice(0, 5);
    }

    setTimeout(() => (isNavigating = false), 100);
  }

  async function search() {
    const query = inputValue?.trim();
    clearTimeout(timeoutId);

    if (!query) {
      searchAbortController?.abort();
      searchAbortController = null;
      searchBarData = [];
      showSuggestions = false;
      isLoading = false;
      return;
    }

    isLoading = true;

    timeoutId = setTimeout(async () => {
      searchAbortController?.abort();
      const controller = new AbortController();
      searchAbortController = controller;

      try {
        const response = await fetch(
          `/api/searchbar?query=${encodeURIComponent(query)}&limit=5`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error(`Search request failed with status ${response.status}`);
        }

        const payload = await response.json();
        if (!controller.signal.aborted) {
          searchBarData = Array.isArray(payload) ? payload : [];
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Searchbar request failed");
          searchBarData = [];
        }
      } finally {
        if (searchAbortController === controller) {
          isLoading = false;
        }
      }
    }, SEARCH_DEBOUNCE_MS);
  }

  function handleKeyDown(symbol: string) {
    if (isNavigating) return;

    const list = Array.from(
      new Map(
        [...searchHistory, ...searchBarData, ...popularList]?.map((item) => [
          item.symbol,
          item,
        ]),
      ).values(),
    );

    if (!list?.length) return;

    const newData = list?.find(
      (item) => item?.symbol?.toLowerCase() === symbol?.toLowerCase(),
    );
    if (newData) {
      handleSearch(newData?.symbol, newData?.type);
    }
  }

  const handleControlK = (event: KeyboardEvent) => {
    if (event.ctrlKey && event.key === "k") {
      const keyboardSearch = document.getElementById("combobox-input");
      keyboardSearch?.dispatchEvent(new MouseEvent("click"));
      event.preventDefault();
    }
  };

  function saveRecentTicker() {
    try {
      // Save the version along with the rules
      localStorage?.setItem("search-history", JSON?.stringify(searchHistory));
    } catch (e) {
      console.log("Failed saving indicator rules: ", e);
    }
  }

  onMount(() => {
    try {
      const savedRules = localStorage?.getItem("search-history");

      if (savedRules) {
        const parsed = JSON.parse(savedRules);
        searchHistory = Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.log(e);
    }

    window.addEventListener("keydown", handleControlK);
    return () => {
      window.removeEventListener("keydown", handleControlK);
    };
  });

  onDestroy(() => {
    clearTimeout(timeoutId);
    clearTimeout(historyCommitTimeoutId);
    clearTimeout(focusTimeoutId);
    searchAbortController?.abort();
    if (typeof window !== "undefined") {
      document.body.classList.remove("overflow-hidden");
      document.body.classList.remove("search-modal-open");
    }
  });

  function handleEnter() {
    //user enters before searchbarData is completely loaded.
    //wait until it is ready and then goto the place;
    if (!isLoading && searchBarData?.length > 0) {
      handleKeyDown(inputValue);
    }
  }

  // Reset spinner if user navigates away manually
  $: if ($page) {
    isNavigatingWithSpinner = false;
  }

  $: {
    if (searchBarModalChecked === true && typeof window !== "undefined") {
      clearTimeout(focusTimeoutId);
      focusTimeoutId = setTimeout(() => inputElement?.focus(), 30);
      // Page is not scrollable now and hide fixed mobile nav layers.
      document.body.classList.add("overflow-hidden");
      document.body.classList.add("search-modal-open");
    }
  }

  $: {
    if (searchBarModalChecked === false && typeof window !== "undefined") {
      showSuggestions = false;
      // Clear input when modal closes
      if (!isNavigatingWithSpinner) {
        inputValue = "";
      }
      document.body.classList?.remove("overflow-hidden");
      document.body.classList?.remove("search-modal-open");
    }
  }

  $: {
    if (
      searchBarModalChecked === false &&
      updatedSearchHistory?.length > 0
    ) {
      clearTimeout(historyCommitTimeoutId);
      historyCommitTimeoutId = setTimeout(() => {
        // Keep a short delay so list updates don't race against navigation.
        searchHistory = updatedSearchHistory;
        updatedSearchHistory = [];
        saveRecentTicker();
      }, 500);
    }
  }

  $: {
    if (searchBarData) {
      if (searchBarData?.length > 0) {
        showSuggestions = true;
      } else {
        showSuggestions = false;
      }
    }
  }

  $: if (inputValue !== undefined) {
    search();
  }
</script>

<!-- Loading spinner overlay for mobile navigation -->
{#if isNavigatingWithSpinner}
  <div
    class="fixed inset-0 z-[2147483647] bg-black/50 flex items-center justify-center"
  >
    <div class="relative">
      <label
        class="rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 h-14 w-14 flex justify-center items-center"
      >
        <span
          class="loading loading-spinner loading-md text-gray-700 dark:text-zinc-200"
        ></span>
      </label>
    </div>
  </div>
{/if}

<div class="hidden sm:block w-full sm:max-w-[600px]">
  <div>
    <div class="relative flex items-center">
      <Combobox.Root
        items={searchBarData}
        bind:inputValue
        bind:touchedInput
        onSelectedChange={(state) => handleKeyDown(state?.value)}
      >
        <div
          on:keydown={(e) => {
            if (e.key === "Enter") {
              handleEnter();
            }
          }}
          class="relative w-full"
        >
          <div
            class="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-800 dark:text-zinc-300"
          >
            <svg
              class="h-5 w-5 text-gray-800 dark:text-zinc-300"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style="max-width: 40px"
              aria-hidden="true"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <Combobox.Input
            id="combobox-input"
            on:click={() => (inputValue = "")}
            class="grow rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/60 py-2.5 pl-9 text-sm text-gray-700 dark:text-zinc-200 placeholder:text-gray-500 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-0 focus:border-gray-300 dark:focus:border-zinc-700 tiny:pl-8 xs:pl-10 w-full"
            placeholder={searchbar_placeholder()}
            aria-label={searchbar_aria_label()}
          />
          <div
            class="absolute inset-y-0 right-0 flex items-center gap-x-2 px-3 text-gray-800 dark:text-zinc-300 font-semibold"
          >
            {#if isLoading}
              <span class="loading loading-spinner loading-sm"></span>
            {:else if inputValue?.length > 0}
              <label class="cursor-pointer" on:click={() => (inputValue = "")}>
                <svg
                  class="w-6 h-6"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  ><path
                    fill="currentColor"
                    d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
                  /></svg>

              </label>
            {:else}
              <div
                class="pointer-events-none absolute end-6 top-2.5 gap-1 opacity-80 rtl:flex-row-reverse hidden lg:flex"
              >
                <kbd
                  class="kbd kbd-sm rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-gray-500 dark:text-zinc-400"
                  >ctrl</kbd
                >
                <kbd
                  class="kbd kbd-sm rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-gray-500 dark:text-zinc-400"
                  >K</kbd
                >
              </div>
            {/if}
          </div>
        </div>
        <Combobox.Content
          class="w-auto z-40 -mt-0.5 rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white dark:bg-zinc-950 px-1.5 py-2 shadow-none outline-hidden"
          sideOffset={8}
        >
          {#if inputValue?.length > 0 && searchBarData?.length > 0}
            <div
              class="pl-2 pb-2 border-b border-gray-300 dark:border-zinc-700 text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-zinc-300 w-full"
            >
              {searchbar_suggestions()}
            </div>
            {#each searchBarData as item}
              <Combobox.Item
                class="cursor-pointer text-gray-700 dark:text-zinc-200 border-b border-gray-300 dark:border-zinc-700 last:border-none flex h-fit w-auto select-none items-center rounded-lg py-2.5 pl-2 pr-1.5 text-sm outline-hidden transition-colors duration-75 data-highlighted:bg-gray-100/70 dark:data-highlighted:bg-zinc-900/60"
                value={item?.symbol}
                label={item?.name}
                on:click={() => handleSearch(item?.symbol, item?.type)}
              >
                <div class="flex flex-row items-center justify-between w-full">
                  <span
                    class="text-sm font-semibold text-gray-700 dark:text-zinc-200"
                    >{item?.symbol}</span
                  >
                  <span class="ml-3 text-sm text-gray-600 dark:text-zinc-300"
                    >{item?.name}</span
                  >
                  <span class="ml-auto text-sm text-gray-500 dark:text-zinc-400"
                    >{item?.type}</span
                  >
                </div>
              </Combobox.Item>
            {/each}
          {:else if inputValue?.length === 0 || !showSuggestions}
            <div
              class="pl-2 pb-2 border-b border-gray-300 dark:border-zinc-700 text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-zinc-300 w-full"
            >
              {searchHistory?.length > 0
                ? searchbar_recent()
                : searchbar_popular()}
            </div>
            {#each searchHistory?.length > 0 ? searchHistory : popularList as item}
              <Combobox.Item
                class="cursor-pointer text-gray-700 dark:text-zinc-200 border-b border-gray-300 dark:border-zinc-700 last:border-none flex h-fit w-auto select-none items-center rounded-lg py-2.5 pl-2 pr-1.5 text-sm outline-hidden transition-colors duration-75 data-highlighted:bg-gray-100/70 dark:data-highlighted:bg-zinc-900/60"
                value={item?.symbol}
                label={item?.name}
                on:click={() => handleSearch(item?.symbol, item?.type)}
              >
                <div class="flex flex-row items-center justify-between w-full">
                  <span
                    class="text-sm font-semibold text-gray-700 dark:text-zinc-200"
                    >{item?.symbol}</span
                  >
                  <span class="ml-3 text-sm text-gray-600 dark:text-zinc-300"
                    >{item?.name}</span
                  >
                  <span class="ml-auto text-sm text-gray-500 dark:text-zinc-400"
                    >{item?.type}</span
                  >
                </div>
              </Combobox.Item>
            {/each}
          {:else}
            <span
              class="block px-5 py-2 text-sm text-gray-800 dark:text-zinc-300"
            >
              {searchbar_no_results()}
            </span>
          {/if}
        </Combobox.Content>
      </Combobox.Root>
    </div>
  </div>
</div>

<label
  for="searchBarModal"
  class="sm:hidden rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/60 text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition cursor-pointer p-2 shrink-0 flex items-center justify-center"
>
  <Search class="h-[20px] w-[20px]" />
</label>

<input
  type="checkbox"
  id="searchBarModal"
  class="modal-toggle"
  bind:checked={searchBarModalChecked}
/>

<dialog
  id="searchBarModal"
  class="modal modal-middle fixed inset-0 z-[2147483644] p-0 sm:p-3"
>
  <label
    for="searchBarModal"
    class="cursor-pointer modal-backdrop z-[2147483645]"
  ></label>

  <div
    class="z-[2147483646] modal-box w-screen h-dvh min-h-dvh max-w-none max-h-none overflow-hidden m-0 sm:my-8 sm:mx-auto sm:w-3/4 lg:w-1/2 2xl:w-1/3 sm:h-auto sm:min-h-0 sm:max-h-[90vh] sm:max-w-[42rem] relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border-0 sm:border border-gray-300 dark:border-zinc-700 rounded-none sm:rounded-2xl shadow-none sm:shadow-2xl p-0"
  >
    <!-- Mobile header -->
    <div
      class="sticky top-0 z-[2147483647] border-b border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5"
    >
      <div class="flex items-center gap-2">
        <label
          for="searchBarModal"
          class="inline-flex cursor-pointer items-center justify-center text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition"
          aria-label="Close modal"
        >
          <svg
            class="h-7 w-7"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M15.41 7.41L14 6l-6 6l6 6l1.41-1.41L10.83 12z"
            />
          </svg>
        </label>

        <div class="relative flex-1">
          <label for="modal-search" class="sr-only">
            {searchbar_search_label()}
          </label>
          <svg
            class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 dark:text-zinc-400"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>

          <input
            id="modal-search"
            class="focus:outline-none w-full rounded-2xl border border-gray-300 dark:border-zinc-700 bg-gray-100/90 dark:bg-zinc-800/80 py-2 pl-10 pr-10 text-[16px] sm:text-sm text-gray-700 dark:text-zinc-100 placeholder:text-gray-500 dark:placeholder:text-zinc-400 focus:ring-0"
            placeholder={searchbar_placeholder()}
            bind:value={inputValue}
            bind:this={inputElement}
            autocomplete="off"
            on:keydown={(e) => {
              if (e.key === "Enter" && inputValue) {
                handleKeyDown(inputValue);
              }
            }}
          />

          {#if isLoading}
            <span
              class="absolute right-3 top-1/2 -translate-y-1/2 loading loading-spinner loading-sm text-gray-600 dark:text-zinc-300"
            ></span>
          {:else if inputValue?.length > 0}
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition"
              on:click={() => (inputValue = "")}
              aria-label="Clear search"
            >
              <svg
                class="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
                />
              </svg>
            </button>
          {/if}
        </div>
      </div>
    </div>

    <div
      class="h-[calc(100dvh-64px)] sm:h-auto sm:max-h-[calc(90vh-64px)] overflow-y-auto bg-white dark:bg-zinc-900"
    >
      {#if inputValue?.length > 0 && searchBarData?.length > 0}
        {#each searchBarData as item}
          <button
            type="button"
            class="w-full cursor-pointer border-b border-gray-200 dark:border-zinc-700 px-4 py-3 text-left text-gray-700 dark:text-zinc-100 transition-colors duration-75 active:bg-gray-100 dark:active:bg-zinc-800"
            on:click={() => handleSearch(item?.symbol, item?.type)}
          >
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <div class="text-[1rem] font-semibold leading-tight">
                  {item?.symbol}
                </div>
                <div
                  class="mt-0.5 truncate text-[0.84rem] leading-snug text-gray-500 dark:text-zinc-400"
                >
                  {item?.name}
                </div>
              </div>
              <span
                class="ml-auto shrink-0 text-[0.9rem] font-medium text-gray-600 dark:text-zinc-300"
              >
                {item?.type}
              </span>
            </div>
          </button>
        {/each}
      {:else if inputValue?.length === 0 || !showSuggestions}
        {#each searchHistory?.length > 0 ? searchHistory : popularList as item}
          <button
            type="button"
            class="w-full cursor-pointer border-b border-gray-200 dark:border-zinc-700 px-4 py-3 text-left text-gray-700 dark:text-zinc-100 transition-colors duration-75 active:bg-gray-100 dark:active:bg-zinc-800"
            on:click={() => handleSearch(item?.symbol, item?.type)}
          >
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <div class="text-[1rem] font-semibold leading-tight">
                  {item?.symbol}
                </div>
                <div
                  class="mt-0.5 truncate text-[0.84rem] leading-snug text-gray-500 dark:text-zinc-400"
                >
                  {item?.name}
                </div>
              </div>
              <span
                class="ml-auto shrink-0 text-[0.9rem] font-medium text-gray-600 dark:text-zinc-300"
              >
                {item?.type}
              </span>
            </div>
          </button>
        {/each}
      {:else}
        <span class="block px-5 py-6 text-sm text-gray-600 dark:text-zinc-300">
          {searchbar_no_results()}
        </span>
      {/if}
    </div>
  </div>
</dialog>

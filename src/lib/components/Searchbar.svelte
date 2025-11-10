<script lang="ts">
  import { screenWidth } from "$lib/store";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import Search from "lucide-svelte/icons/search";
  import { goto } from "$app/navigation";
  import { Combobox } from "bits-ui";

  let searchHistory = [];
  let updatedSearchHistory = [];
  let searchBarData = [];
  let isLoading = false;
  let timeoutId;
  let showSuggestions = false;
  let touchedInput = false;
  let isNavigatingWithSpinner = false; // New state for navigation spinner

  $: inputValue = "";
  let nextPage = false;
  let searchOpen = false;
  let searchBarModalChecked = false; // Initialize it to false
  let inputElement;
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

    // normalize type to 'etf' | 'index' | 'stock'
    let type = (assetType || "stocks")?.toLowerCase();
    if (type.endsWith("s")) type = type.slice(0, -1);

    // Pull current path's segments
    const segments = $page.url.pathname.split("/").filter(Boolean);
    const prevRoot = segments[0]?.toLowerCase() || "";

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

      // moving to index from stocks/etf: strip dividend/dark-pool
      if (
        type === "index" &&
        (prevRoot === "stocks" || prevRoot === "etf") &&
        (firstSuffix?.includes("dividends") ||
          firstSuffix?.includes("dark-pool"))
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

    inputValue = "";
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
    searchOpen = false;
  }

  async function search() {
    isLoading = true;
    clearTimeout(timeoutId); // Clear any existing timeout

    if (!inputValue?.trim()) {
      // Skip if query is empty or just whitespace
      searchBarData = []; // Clear previous results
      isLoading = false;
      return;
    }

    timeoutId = setTimeout(async () => {
      const response = await fetch(
        `/api/searchbar?query=${encodeURIComponent(inputValue)}&limit=5`,
      );
      searchBarData = await response?.json();
      isLoading = false;
    }, 50); // delay
  }

  function handleKeyDown(symbol) {
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

  const handleControlK = async (event) => {
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
        searchHistory = JSON.parse(savedRules);
      }
    } catch (e) {
      console.log(e);
    }

    window.addEventListener("keydown", handleControlK);
    return () => {
      window.removeEventListener("keydown", handleControlK);
    };
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
      if ($screenWidth > 640) {
        inputElement.focus();
      }
      //Page is not scrollable now
      document.body.classList.add("overflow-hidden");
    }
  }

  $: {
    if (searchBarModalChecked === false && typeof window !== "undefined") {
      showSuggestions = "";
      // Clear input when modal closes
      if (!isNavigatingWithSpinner) {
        inputValue = "";
      }
      document.body.classList?.remove("overflow-hidden");
    }
  }

  $: {
    if (
      (nextPage === true || searchBarModalChecked === false) &&
      updatedSearchHistory?.length > 0
    ) {
      (async () => {
        // Add 500 ms delay is important otherwise bug since #each has searchHistory and updates too quickly and redirects to wrong symbol
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Update search history after delay
        searchHistory = updatedSearchHistory;
        updatedSearchHistory = [];
        saveRecentTicker();
        nextPage = false;
      })();
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

  $: {
    if (inputValue) {
      search();
    }
  }
</script>

<!-- Loading spinner overlay for mobile navigation -->
{#if isNavigatingWithSpinner}
  <div
    class="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center"
  >
    <div class="relative">
      <label
        class="shadow bg-default dark:bg-secondary rounded h-14 w-14 flex justify-center items-center"
      >
        <span
          class="loading loading-spinner loading-md text-white dark:text-white"
        ></span>
      </label>
    </div>
  </div>
{/if}

<div class="hidden sm:block w-full sm:max-w-[600px] shadow">
  <div>
    <div class="relative flex items-center">
      <div class="absolute inset-y-0 left-0 flex items-center pl-2.5">
        <svg
          class="h-4 w-4 text-icon xs:h-5 xs:w-5"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="3"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style="max-width: 40px"
          aria-hidden="true"
          ><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg
        >
      </div>
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
            class="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400"
          >
            <svg
              class="text-icon h-5 w-5"
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
            class="grow rounded-sm border border-gray-300 dark:border-gray-600 py-2 pl-9 text-[1rem] placeholder-gray-600 dark:placeholder-gray-400  focus:shadow-lg focus:outline-hidden focus:ring-0 tiny:pl-8 xs:pl-10 text-muted dark:text-white md:py-2 w-full bg-[#F9FAFB] dark:bg-secondary focus:bg-white dark:focus:bg-secondary"
            placeholder="Company or stock symbol..."
            aria-label="Company or stock symbol..."
          />
          <div
            class="absolute inset-y-0 right-0 flex items-center gap-x-2 px-3 text-gray-350 font-semibold"
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
                  /></svg
                >
              </label>
            {:else}
              <div
                class="pointer-events-none absolute end-6 top-2.5 gap-1 opacity-80 rtl:flex-row-reverse hidden lg:flex"
              >
                <kbd
                  class="kbd kbd-sm bg-gray-300 dark:bg-[#1C2128] text-gray-600 dark:text-gray-400"
                  >ctrl</kbd
                >
                <kbd
                  class="kbd kbd-sm bg-gray-300 dark:bg-[#1C2128] text-gray-600 dark:text-gray-400"
                  >K</kbd
                >
              </div>
            {/if}
          </div>
        </div>
        <Combobox.Content
          class="w-auto z-40 -mt-0.5  rounded border border-gray-300 dark:border-gray-700 bg-[#F9FAFB] dark:bg-secondary px-1 py-3 shadow-xl outline-hidden"
          sideOffset={8}
        >
          {#if inputValue?.length > 0 && searchBarData?.length > 0}
            <div
              class="pl-2 pb-2 border-b border-gray-300 dark:border-gray-600 text-muted dark:text-white text-sm font-semibold w-full"
            >
              Suggestions
            </div>
            {#each searchBarData as item}
              <Combobox.Item
                class="cursor-pointer text-muted dark:text-white border-b border-gray-300 dark:border-gray-600 last:border-none flex h-fit w-auto select-none items-center rounded-button py-3 pl-2 pr-1.5 text-sm capitalize outline-hidden transition-all duration-75 data-highlighted:bg-gray-200 dark:data-highlighted:bg-gray-200 dark:data-highlighted:bg-primary"
                value={item?.symbol}
                label={item?.name}
                on:click={() => handleSearch(item?.symbol, item?.type)}
              >
                <div class="flex flex-row items-center justify-between w-full">
                  <span
                    class="text-sm text-muted font-semibold dark:font-normal dark:text-blue-400"
                    >{item?.symbol}</span
                  >
                  <span class="ml-3 text-sm text-muted dark:text-white"
                    >{item?.name}</span
                  >
                  <span class="ml-auto text-sm text-muted dark:text-white"
                    >{item?.type}</span
                  >
                </div>
              </Combobox.Item>
            {/each}
          {:else if inputValue?.length === 0 || !showSuggestions}
            <div
              class="pl-2 pb-2 border-b border-gray-300 dark:border-gray-600 text-muted dark:text-white text-sm font-semibold w-full"
            >
              {searchHistory?.length > 0 ? "Recent" : "Popular"}
            </div>
            {#each searchHistory?.length > 0 ? searchHistory : popularList as item}
              <Combobox.Item
                class="cursor-pointer text-white border-b border-gray-300 dark:border-gray-600 last:border-none flex h-fit w-auto select-none items-center rounded-button py-3 pl-2 pr-1.5 text-sm capitalize outline-hidden transition-all duration-75 data-highlighted:bg-gray-200 dark:data-highlighted:bg-primary"
                value={item?.symbol}
                label={item?.name}
                on:click={() => handleSearch(item?.symbol, item?.type)}
              >
                <div class="flex flex-row items-center justify-between w-full">
                  <span
                    class="text-sm text-muted font-semibold dark:font-normal dark:text-blue-400"
                    >{item?.symbol}</span
                  >
                  <span class="ml-3 text-sm text-muted dark:text-white"
                    >{item?.name}</span
                  >
                  <span class="ml-auto text-sm text-muted dark:text-white"
                    >{item?.type}</span
                  >
                </div>
              </Combobox.Item>
            {/each}
          {:else}
            <span class="block px-5 py-2 text-sm text-muted dark:text-white">
              No results found
            </span>
          {/if}
        </Combobox.Content>
      </Combobox.Root>
    </div>
  </div>
</div>

<label
  for="searchBarModal"
  class="sm:hidden bg-gray-100 shadow dark:bg-default text-gray-500 dark:text-gray-300 dark:sm:hover:text-white cursor-pointer p-2 shrink-0 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded"
>
  <Search class="h-[20px] w-[20px]" />
</label>

<input
  type="checkbox"
  id="searchBarModal"
  class="modal-toggle"
  bind:checked={searchBarModalChecked}
/>

<dialog id="searchBarModal" class="modal p-3 min-h-96">
  <label for="searchBarModal" class="cursor-pointer modal-backdrop"></label>

  <div
    class="z-999 modal-box min-h-96 overflow-hidden rounded shadow bg-white dark:bg-secondary border border-gray-300 dark:border-gray-600 sm:my-8 sm:m-auto sm:h-auto w-full sm:w-3/4 lg:w-1/2 2xl:w-1/3"
  >
    <label
      for="searchBarModal"
      class="inline-block cursor-pointer absolute right-3 top-3 text-[1.3rem] sm:text-[1.8rem]"
    >
      <svg
        class="w-6 h-6 sm:w-8 sm:h-8"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        ><path
          fill="currentColor"
          d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
        /></svg
      >
    </label>

    <!-- Search layout -->
    <div class="mt-8">
      <div class="relative">
        <div
          class="inline-block cursor-pointer absolute right-5 top-1.5 text-[1.3rem] sm:text-[1.5rem]"
        >
          {#if isLoading}
            <span class="loading loading-spinner loading-sm"></span>
          {:else if inputValue?.length > 0}
            <label class="cursor-pointer" on:click={() => (inputValue = "")}>
              <svg
                class="w-6 h-6 mt-2 ml-1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                ><path
                  fill="currentColor"
                  d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
                /></svg
              >
            </label>
          {:else}
            /
          {/if}
        </div>

        <label for="modal-search" class="sr-only">Search</label>

        <input
          id="modal-search"
          class="focus:outline-none rounded w-full bg-gray-300 dark:bg-secondary border border-gray-300 dark:border-gray-600 focus:ring-transparent placeholder-gray-600 dark:placeholder-gray-200 py-3 pl-10 pr-4"
          placeholder="Company or stock symbol..."
          bind:value={inputValue}
          bind:this={inputElement}
          autocomplete="off"
          on:keydown={(e) => {
            if (e.key === "Enter" && inputValue) {
              handleKeyDown(inputValue);
            }
          }}
        />

        <button class="absolute inset-0 right-auto group" aria-label="Search">
          <svg
            class="w-4 h-4 shrink-0 fill-current ml-4 mr-2 dark:text-slate-400"
            viewBox="0 0 16 16"
            xmlns="http://www.w3.org/2000/svg"
            ><path
              d="M7 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zM7 2C4.243 2 2 4.243 2 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5z"
            />
            <path
              d="M15.707 14.293L13.314 11.9a8.019 8.019 0 01-1.414 1.414l2.393 2.393a.997.997 0 001.414 0 .999.999 0 000-1.414z"
            />
          </svg>
        </button>
      </div>
    </div>

    <div
      class="w-auto z-40 mt-3 rounded border border-gray-300 dark:border-gray-700 bg-[#F9FAFB] dark:bg-secondary px-1 py-3 outline-hidden"
    >
      {#if inputValue?.length > 0 && searchBarData?.length > 0}
        <div
          class="pl-2 pb-2 border-b border-gray-300 dark:border-gray-600 text-muted dark:text-white text-sm font-semibold w-full"
        >
          Suggestions
        </div>
        {#each searchBarData as item}
          <li
            class="cursor-pointer text-muted dark:text-white border-b border-gray-300 dark:border-gray-600 last:border-none flex h-fit w-auto select-none items-center rounded-button py-3 pl-2 pr-1.5 text-sm capitalize outline-hidden transition-all duration-75 data-highlighted:bg-gray-200 dark:data-highlighted:bg-gray-200 dark:data-highlighted:bg-primary"
            on:click={() => handleSearch(item?.symbol, item?.type)}
          >
            <div class="flex flex-row items-center justify-between w-full">
              <span
                class="text-sm text-muted font-semibold dark:font-normal dark:text-blue-400"
                >{item?.symbol}</span
              >
              <span
                class="whitespace-nowrap ml-3 mr-6 text-sm text-muted dark:text-white truncate"
                >{item?.name}</span
              >
              <span class="ml-auto text-sm text-muted dark:text-white"
                >{item?.type}</span
              >
            </div>
          </li>
        {/each}
      {:else if inputValue?.length === 0 || !showSuggestions}
        <div
          class="pl-2 pb-2 border-b border-gray-300 dark:border-gray-600 text-muted dark:text-white text-sm font-semibold w-full"
        >
          {searchHistory?.length > 0 ? "Recent" : "Popular"}
        </div>
        {#each searchHistory?.length > 0 ? searchHistory : popularList as item}
          <li
            class="gap-y-1.5 cursor-pointer text-white border-b border-gray-300 dark:border-gray-600 last:border-none flex h-fit w-auto select-none items-center rounded-button py-3 pl-2 pr-1.5 text-sm capitalize outline-hidden transition-all duration-75 data-highlighted:bg-gray-200 dark:data-highlighted:bg-primary"
            on:click={() => handleSearch(item?.symbol, item?.type)}
          >
            <div class="flex flex-row items-center justify-between w-full">
              <span
                class="text-sm text-muted font-semibold dark:font-normal dark:text-blue-400"
                >{item?.symbol}</span
              >
              <span
                class="whitespace-nowrap ml-3 mr-6 text-sm text-muted dark:text-white truncate"
                >{item?.name}</span
              >
              <span class="ml-auto text-sm text-muted dark:text-white"
                >{item?.type}</span
              >
            </div>
          </li>
        {/each}
      {:else}
        <span class="block px-5 py-2 text-sm text-muted dark:text-white">
          No results found
        </span>
      {/if}
    </div>
  </div>
</dialog>

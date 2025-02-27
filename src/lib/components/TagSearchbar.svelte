<script lang="ts">
  import {
    searchBarData,
    stockTicker,
    etfTicker,
    screenWidth,
  } from "$lib/store";

  let apiURL = import.meta.env.VITE_USEAST_API_URL;
  let apiKey = import.meta.env.VITE_STOCKNEAR_API_KEY;

  let assetType = "";

  let showSuggestions = false;
  let notFoundTicker = false;
  let searchQuery = "";

  let searchOpen = false;
  let searchBarModalChecked = false; // Initialize it to false
  let inputElement;

  async function loadSearchData() {
    if ($searchBarData?.length !== 0) {
      return;
    } else {
      // make the GET request to the endpoint
      const response = await fetch(apiURL + "/searchbar-data", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
      });

      $searchBarData = await response.json();
    }
  }

  function popularTicker(state) {
    searchOpen = false;
    stockTicker.update((value) => state.toUpperCase());

    const closePopup = document.getElementById("tagSearchBarModal");
    closePopup?.dispatchEvent(new MouseEvent("click"));
  }

  function searchBarTicker(state, assetType) {
    showSuggestions = false;
    if (
      state !== "" &&
      $searchBarData.find((item) => item?.symbol === state.toUpperCase())
    ) {
      stockTicker.update((value) => state?.toUpperCase());
      //In this case we dont care if stockTicker or etfTicker

      searchOpen = false;
      notFoundTicker = false;
      //searchQuery = state.toUpperCase();
      const closePopup = document.getElementById("tagSearchBarModal");
      closePopup?.dispatchEvent(new MouseEvent("click"));
    } else {
      notFoundTicker = true;
      //searchQuery ="";
    }

    searchQuery = "";
  }

  let searchResults = [];

  async function search() {
    const normalizedSearchQuery = searchQuery?.toLowerCase();

    // Define names for which symbols without dots should be prioritized
    const prioritizeWithoutDotsForNames = [
      "apple" /* Add more names as needed */,
    ];

    const filteredList = $searchBarData
      ?.map((item) => ({
        ...item,
        nameLower: item?.name?.toLowerCase(),
        symbolLower: item?.symbol?.toLowerCase(),
      }))
      ?.filter(
        ({ nameLower, symbolLower }) =>
          nameLower?.includes(normalizedSearchQuery) ||
          symbolLower?.includes(normalizedSearchQuery),
      );

    filteredList?.sort((a, b) => {
      const aSymbolLower = a?.symbolLower;
      const bSymbolLower = b?.symbolLower;
      const aNameLower = a?.nameLower;
      const bNameLower = b?.nameLower;

      // Check for exact symbol matches
      const isExactMatchA = aSymbolLower === normalizedSearchQuery;
      const isExactMatchB = bSymbolLower === normalizedSearchQuery;

      if (isExactMatchA && !isExactMatchB) {
        return -1; // Prioritize exact symbol match for A
      } else if (!isExactMatchA && isExactMatchB) {
        return 1; // Prioritize exact symbol match for B
      }

      const aSymbolIndex = aSymbolLower?.indexOf(normalizedSearchQuery);
      const bSymbolIndex = bSymbolLower?.indexOf(normalizedSearchQuery);

      const aNameIndex = aNameLower?.indexOf(normalizedSearchQuery);
      const bNameIndex = bNameLower?.indexOf(normalizedSearchQuery);

      // If no exact symbol match, prioritize based on the combined position in name and symbol
      const positionComparison =
        aSymbolIndex + aNameIndex - (bSymbolIndex + bNameIndex);

      // Additional condition for prioritizing symbols without dots for specific names
      if (prioritizeWithoutDotsForNames.includes(normalizedSearchQuery)) {
        const aHasDot = aSymbolLower?.includes(".") || false;
        const bHasDot = bSymbolLower?.includes(".") || false;

        // Prioritize results without dots for the specified names
        return aHasDot - bHasDot || positionComparison;
      }

      return positionComparison;
    });

    searchResults = filteredList?.slice(0, 5);
    showSuggestions = normalizedSearchQuery !== "";
  }

  const onKeyPress = (e) => {
    if (e.charCode === 13) {
      searchBarTicker(searchQuery, assetType);
      focusedSuggestion = "";
    }
  };

  let focusedSuggestion = null;

  function handleKeyDown(event) {
    if (event.key === "ArrowDown" && showSuggestions) {
      // Move down in the suggestions
      event.preventDefault(); // Prevent scrolling
      const currentIndex = searchResults.findIndex(
        (item) => item.symbol === searchQuery,
      );
      if (currentIndex < searchResults.length - 1) {
        searchQuery = searchResults[currentIndex + 1].symbol;
        assetType = searchResults[currentIndex + 1].type;
        focusedSuggestion = searchQuery; // Update the focused suggestion
      }
    } else if (event.key === "ArrowUp" && showSuggestions) {
      // Move up in the suggestions
      event.preventDefault(); // Prevent scrolling
      const currentIndex = searchResults.findIndex(
        (item) => item.symbol === searchQuery,
      );
      if (currentIndex > 0) {
        searchQuery = searchResults[currentIndex - 1].symbol;
        assetType = searchResults[currentIndex - 1].type;
        focusedSuggestion = searchQuery; // Update the focused suggestion
      }
    } else if (event.key === "ArrowDown" && !showSuggestions) {
      // Move down in the suggestions
      event.preventDefault(); // Prevent scrolling
      const currentIndex = popularList.findIndex(
        (item) => item.symbol === searchQuery,
      );
      if (currentIndex < popularList.length - 1) {
        searchQuery = popularList[currentIndex + 1].symbol;
        assetType = popularList[currentIndex + 1].type;
        focusedSuggestion = searchQuery; // Update the focused suggestion
      }
    } else if (event.key === "ArrowUp" && !showSuggestions) {
      // Move up in the suggestions
      event.preventDefault(); // Prevent scrolling
      const currentIndex = popularList.findIndex(
        (item) => item.symbol === searchQuery,
      );
      if (currentIndex > 0) {
        searchQuery = popularList[currentIndex - 1].symbol;
        assetType = popularList[currentIndex - 1].type;
        focusedSuggestion = searchQuery; // Update the focused suggestion
      }
    }
  }

  let charNumber = 20;

  $: {
    if ($screenWidth < 640) {
      charNumber = 20;
    } else {
      charNumber = 20;
    }
  }

  let popularList = [];
  const popularSymbols = [
    "ADBE",
    "SHOP",
    "CRM",
    "UBER",
    "RDHL",
    "TSM",
    "INTC",
    "NIO",
    "DBX",
    "HOOD",
    "AMZN",
    "TSLA",
    "AMD",
    "MCD",
    "NVDA",
    "PYPL",
    "AAPL",
    "BYND",
    "KO",
  ];

  $: {
    if ($searchBarData && popularList?.length === 0) {
      popularList = $searchBarData.filter(({ symbol }) =>
        popularSymbols?.includes(symbol),
      );

      // Fisher-Yates (Knuth) Shuffle Algorithm
      for (let i = popularList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [popularList[i], popularList[j]] = [popularList[j], popularList[i]];
      }

      popularList = popularList?.slice(0, 5);
    }
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
      showSuggestions = searchQuery = "";
      document.body.classList.remove("overflow-hidden");
    }
  }

  $: {
    if (searchQuery?.length !== 0) {
      notFoundTicker = false;
    }
  }
</script>

<label
  on:click={loadSearchData}
  for="tagSearchBarModal"
  class="border border-slate-500 mb-2 flex flex-wrap pl-4 pr-4 py-2 m-1 mr-3 justify-between items-center text-sm font-medium rounded-xl cursor-pointer text-gray-200 hover:text-gray-100"
>
  <svg
    class="w-4 h-4 mr-2"
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      class="fill-current text-white"
      d="M7 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zM7 2C4.243 2 2 4.243 2 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5z"
    />
    <path
      class="fill-current text-white"
      d="M15.707 14.293L13.314 11.9a8.019 8.019 0 01-1.414 1.414l2.393 2.393a.997.997 0 001.414 0 .999.999 0 000-1.414z"
    />
  </svg>
  <span class="text-gray-300">Search a ticker...</span>
</label>

<!--Start Searchbar Modal-->

{#if $screenWidth > 640}
  <input
    type="checkbox"
    id="tagSearchBarModal"
    class="modal-toggle"
    bind:checked={searchBarModalChecked}
  />

  <dialog id="tagSearchBarModal" class="modal modal-top">
    <label for="tagSearchBarModal" class="cursor-pointer modal-backdrop"
    ></label>

    <div
      class="modal-box overflow-hidden rounded-xl bg-default sm:my-8 sm:m-auto sm:h-auto w-full sm:w-1/2 2xl:w-1/3"
    >
      <!-- Search layout -->
      <div class="mt-5 sm:mt-0">
        <div class="relative">
          <label for="modal-search" class="sr-only">Search</label>
          <input
            id="modal-search"
            class="rounded-md w-full text-white bg-default border border-gray-600 focus:ring-transparent placeholder-gray-200 py-3 pl-10 pr-4"
            type="search"
            placeholder="Search Anything…"
            bind:value={searchQuery}
            bind:this={inputElement}
            on:input={search}
            on:keydown={handleKeyDown}
            on:keypress={onKeyPress}
            autocomplete="off"
          />
          <button
            on:click={() => searchBarTicker(searchQuery, assetType)}
            class="absolute inset-0 right-auto group"
            type="submit"
            aria-label="Search"
          >
            <svg
              class="w-4 h-4 shrink-0 fill-current text-white ml-4 mr-2 text-slate-400"
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

      {#if $searchBarData?.length !== 0}
        <div class="py-4">
          <!-- Popular searches -->
          <div class="mb-3 last:mb-0 mt-3">
            {#if notFoundTicker}
              <p class="text-xs font-semibold text-[#FB6A67] px-2 mb-4">
                Oh snapp, ticker does not exist in our database
              </p>
            {/if}
            {#if !showSuggestions}
              <div class="text-start text-sm font-semibold text-white mb-2">
                Popular
              </div>
            {/if}
            <ul class="text-sm">
              {#if !showSuggestions}
                {#each popularList as item}
                  <li class="border-b border-gray-800">
                    <a
                      data-sveltekit-preload-data="false"
                      on:click={() => popularTicker(item?.symbol)}
                      class="mb-2 {item?.symbol === focusedSuggestion
                        ? 'shake-ticker cursor-pointer flex justify-start items-center p-2 text-white bg-[#404040] bg-opacity-[0.25] rounded group'
                        : 'shake-ticker cursor-pointer bg-default sm:hover:bg-[#17171A] rounded-md flex justify-start items-center p-2 text-white  group'} w-full"
                    >
                      <div class="flex flex-row items-center w-full">
                        <div
                          class="rounded-full w-10 h-10 relative bg-[#000] flex items-center justify-center"
                        >
                          <img
                            style="clip-path: circle(50%);"
                            class="w-6 h-6"
                            src={`https://financialmodelingprep.com/image-stock/${item?.symbol}.png`}
                            loading="lazy"
                          />
                        </div>
                        <div class="flex flex-col ml-2">
                          <span class="text-blue-400">{item?.symbol}</span>
                          <span class="text-white"
                            >{item?.name.length > 150
                              ? item?.name?.slice(0, 150) + "..."
                              : item?.name}</span
                          >
                        </div>

                        <div class="text-white font-medium ml-auto">
                          {item?.type}
                        </div>
                      </div>
                    </a>
                  </li>
                {/each}
              {:else if showSuggestions && searchResults?.length > 0}
                <div class="text-start text-sm font-semibold text-white mb-2">
                  Suggestions
                </div>
                {#each searchResults as item}
                  <li class="border-b border-gray-800">
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-label-has-associated-control -->
                    <label
                      data-sveltekit-preload-data="false"
                      on:click={() => searchBarTicker(item?.symbol, item?.type)}
                      class="mb-2 {item?.symbol === focusedSuggestion
                        ? 'shake-ticker cursor-pointer flex justify-start items-center p-2 text-white bg-[#404040] bg-opacity-[0.25] rounded group'
                        : 'cursor-pointer mb-2 bg-default sm:hover:bg-[#17171A] rounded-md flex justify-start items-center p-2 text-white group'}"
                    >
                      <div class="flex flex-row items-center w-full">
                        <div class="flex flex-col">
                          <span class="text-blue-400">{item?.symbol}</span>
                          <span class="text-white"
                            >{item?.name?.length > 150
                              ? item?.name?.slice(0, 150) + "..."
                              : item?.name}</span
                          >
                        </div>

                        <div class="text-white font-medium ml-auto">
                          {item?.type}
                        </div>
                      </div>
                    </label>
                  </li>
                {/each}
              {:else if showSuggestions && searchResults?.length === 0}
                <li>
                  <label
                    class="flex items-center p-2 text-white hover:text-white hover:bg-[#404040] bg-opacity-[0.25] rounded group"
                  >
                    <svg
                      class="w-3 h-3 fill-slate-400 shrink-0 mr-3 dark:fill-slate-500"
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11.953 4.29a.5.5 0 0 0-.454-.292H6.14L6.984.62A.5.5 0 0 0 6.12.173l-6 7a.5.5 0 0 0 .379.825h5.359l-.844 3.38a.5.5 0 0 0 .864.445l6-7a.5.5 0 0 0 .075-.534Z"
                      />
                    </svg>
                    <span>No results found</span>
                  </label>
                </li>
              {/if}
            </ul>
          </div>
        </div>
      {:else}
        <div class="flex justify-center items-center m-auto mt-4 py-20">
          <span class="loading loading-lg loading-spinner text-success"></span>
        </div>
      {/if}

      <label for="searchBarModal" class="absolute left-6 top-4 sm:hidden">
        <svg
          class="w-6 h-6 inline-block mb-0.5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          ><path
            fill="#fff"
            d="M9.125 21.1L.7 12.7q-.15-.15-.213-.325T.425 12q0-.2.063-.375T.7 11.3l8.425-8.425q.35-.35.875-.35t.9.375q.375.375.375.875t-.375.875L3.55 12l7.35 7.35q.35.35.35.863t-.375.887q-.375.375-.875.375t-.875-.375Z"
          /></svg
        >
        <span class="text-white text-md font-medium"> Return </span>
      </label>
    </div>
  </dialog>
{:else}
  <!--Start Drawer Sidewise for mobile-->

  <div class="drawer drawer-end overflow-hidden" style="z-index: 9999">
    <input
      id="tagSearchBarModal"
      type="checkbox"
      class="drawer-toggle"
      bind:checked={searchBarModalChecked}
    />

    <div class="drawer-side overflow-hidden">
      <div
        class="modal-box overflow-hidden rounded-xl bg-default min-h-screen w-screen pt-10"
      >
        <!-- Search layout -->
        <div class="mt-5 sm:mt-0">
          <div class="relative">
            <label for="modal-search" class="sr-only">Search</label>
            <input
              id="modal-search"
              class="rounded-md w-full text-white bg-default border border-gray-600 focus:ring-transparent placeholder-gray-200 py-3 pl-10 pr-4"
              type="search"
              placeholder="Search Anything…"
              bind:value={searchQuery}
              bind:this={inputElement}
              on:input={search}
              on:keydown={handleKeyDown}
              on:keypress={onKeyPress}
              autocomplete="off"
            />
            <button
              on:click={() => searchBarTicker(searchQuery, assetType)}
              class="absolute inset-0 right-auto group"
              type="submit"
              aria-label="Search"
            >
              <svg
                class="w-4 h-4 shrink-0 fill-current text-white ml-4 mr-2 text-slate-400"
                viewBox="0 0 16 16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zM7 2C4.243 2 2 4.243 2 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5z"
                />
                <path
                  d="M15.707 14.293L13.314 11.9a8.019 8.019 0 01-1.414 1.414l2.393 2.393a.997.997 0 001.414 0 .999.999 0 000-1.414z"
                />
              </svg>
            </button>
          </div>
        </div>

        {#if $searchBarData?.length !== 0}
          <div class="py-4">
            <!-- Popular searches -->
            <div class="mb-3 last:mb-0 mt-3">
              {#if notFoundTicker}
                <p class="text-xs font-semibold text-[#FB6A67] px-2 mb-4">
                  Oh snapp, ticker does not exist in our database
                </p>
              {/if}
              {#if !showSuggestions}
                <div
                  class="text-start text-sm font-semibold text-slate-400 mb-2"
                >
                  Popular
                </div>
              {/if}
              <ul class="text-sm">
                {#if !showSuggestions}
                  {#each popularList as item}
                    <li>
                      <a
                        data-sveltekit-preload-data="false"
                        on:click={() => popularTicker(item?.symbol, item?.type)}
                        class="mb-2 {item?.symbol === focusedSuggestion
                          ? 'shake-ticker cursor-pointer flex justify-start items-center p-2 text-white bg-[#404040] bg-opacity-[0.25] rounded group'
                          : 'cursor-pointer bg-default rounded-md flex justify-start items-center p-2 text-white group'} w-full"
                      >
                        <div class="flex flex-row items-center w-full">
                          <div
                            class="rounded-full w-10 h-10 relative bg-[#000] flex items-center justify-center"
                          >
                            <img
                              style="clip-path: circle(50%);"
                              class="w-6 h-6"
                              src={`https://financialmodelingprep.com/image-stock/${item?.symbol}.png`}
                              loading="lazy"
                            />
                          </div>
                          <div class="flex flex-col ml-2">
                            <span class="text-blue-400">{item?.symbol}</span>
                            <span class="text-white"
                              >{item?.name.length > charNumber
                                ? item?.name.slice(0, charNumber) + "..."
                                : item?.name}</span
                            >
                          </div>

                          <div class="text-white font-medium ml-auto mr-2">
                            {item?.type}
                          </div>
                        </div>
                      </a>
                    </li>
                  {/each}
                {:else if showSuggestions && searchResults?.length > 0}
                  <div
                    class="text-start text-sm font-semibold text-slate-400 mb-2"
                  >
                    Suggestions
                  </div>
                  {#each searchResults as item}
                    <li>
                      <!-- svelte-ignore a11y-click-events-have-key-events -->
                      <!-- svelte-ignore a11y-label-has-associated-control -->
                      <label
                        data-sveltekit-preload-data="false"
                        on:click={() =>
                          searchBarTicker(item?.symbol, item?.type)}
                        class="mb-2 {item?.symbol === focusedSuggestion
                          ? 'shake-ticker cursor-pointer flex justify-start items-center p-2 text-white bg-[#404040] bg-opacity-[0.25] rounded group'
                          : 'cursor-pointer mb-2 bg-default rounded-md flex justify-start items-center p-2 text-white group'}"
                      >
                        <div class="flex flex-row items-center w-full">
                          <div class="flex flex-col ml-1">
                            <span class="text-blue-400">{item?.symbol}</span>
                            <span class="text-white"
                              >{item?.name?.length > charNumber
                                ? item?.name?.slice(0, charNumber) + "..."
                                : item?.name}</span
                            >
                          </div>

                          <div class="text-white font-medium ml-auto mr-2">
                            {item?.type}
                          </div>
                        </div>
                      </label>
                    </li>
                  {/each}
                {:else if showSuggestions && searchResults?.length === 0}
                  <li>
                    <label
                      class="flex items-center p-2 text-white hover:text-white hover:bg-[#404040] bg-opacity-[0.25] rounded group"
                    >
                      <svg
                        class="w-3 h-3 fill-slate-400 shrink-0 mr-3 dark:fill-slate-500"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M11.953 4.29a.5.5 0 0 0-.454-.292H6.14L6.984.62A.5.5 0 0 0 6.12.173l-6 7a.5.5 0 0 0 .379.825h5.359l-.844 3.38a.5.5 0 0 0 .864.445l6-7a.5.5 0 0 0 .075-.534Z"
                        />
                      </svg>
                      <span>No results found</span>
                    </label>
                  </li>
                {/if}
              </ul>
            </div>
          </div>
        {:else}
          <div class="flex justify-center items-center m-auto mt-4 py-20">
            <span class="loading loading-lg loading-spinner text-success"
            ></span>
          </div>
        {/if}

        <label for="tagSearchBarModal" class="absolute left-6 top-4 sm:hidden">
          <svg
            class="w-6 h-6 inline-block mb-0.5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            ><path
              fill="#fff"
              d="M9.125 21.1L.7 12.7q-.15-.15-.213-.325T.425 12q0-.2.063-.375T.7 11.3l8.425-8.425q.35-.35.875-.35t.9.375q.375.375.375.875t-.375.875L3.55 12l7.35 7.35q.35.35.35.863t-.375.887q-.375.375-.875.375t-.875-.375Z"
            /></svg
          >
        </label>
      </div>
    </div>
  </div>

  <!--End Drawer Sidewise for mobile-->
{/if}
<!--End Searchbar Modal-->

<script lang="ts">
  import { goto } from "$app/navigation";
  import { Combobox } from "bits-ui";
  import { screenWidth } from "$lib/store";
  import SEO from "$lib/components/SEO.svelte";

  let inputValue = "";
  let searchBarData: any[] = [];
  let isLoading = false;
  let touchedInput = false;
  let showSuggestions = false;
  let timeoutId: ReturnType<typeof setTimeout>;
  let inputElement: HTMLInputElement;
  let searchBarModalChecked = false;
  let isNavigating = false;

  const popularList = [
    { symbol: "AAPL", name: "Apple Inc", type: "Stock" },
    { symbol: "TSLA", name: "Tesla Inc", type: "Stock" },
    { symbol: "NVDA", name: "Nvidia", type: "Stock" },
    { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", type: "ETF" },
    { symbol: "AMD", name: "Advanced Micro Devices", type: "Stock" },
  ];

  const goToChart = (symbol: string) => {
    if (!symbol || isNavigating) return;
    isNavigating = true;

    // Close modal on mobile
    if ($screenWidth < 640) {
      searchBarModalChecked = false;
    }

    goto(`/chart/${symbol.toUpperCase()}`);
    inputValue = "";
    setTimeout(() => (isNavigating = false), 100);
  };

  async function search() {
    isLoading = true;
    clearTimeout(timeoutId);

    if (!inputValue?.trim()) {
      searchBarData = [];
      isLoading = false;
      return;
    }

    timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/searchbar?query=${encodeURIComponent(inputValue)}&limit=5`,
        );
        searchBarData = await response.json();
      } catch {
        searchBarData = [];
      }
      isLoading = false;
    }, 50);
  }

  function handleKeyDown(symbol: string) {
    if (isNavigating) return;
    const list = [...searchBarData, ...popularList];
    const item = list.find(
      (i) => i?.symbol?.toLowerCase() === symbol?.toLowerCase(),
    );
    if (item) {
      goToChart(item.symbol);
    } else if (symbol) {
      goToChart(symbol);
    }
  }

  function handleEnter() {
    if (!isLoading && searchBarData?.length > 0) {
      handleKeyDown(inputValue);
    } else if (inputValue?.trim()) {
      goToChart(inputValue);
    }
  }

  $: if (searchBarModalChecked && typeof window !== "undefined") {
    document.body.classList.add("overflow-hidden");
  }

  $: if (!searchBarModalChecked && typeof window !== "undefined") {
    inputValue = "";
    document.body.classList?.remove("overflow-hidden");
  }

  $: if (searchBarData?.length > 0) {
    showSuggestions = true;
  } else {
    showSuggestions = false;
  }

  $: if (inputValue) {
    search();
  }
</script>

<SEO
  title="Pro Chart - Advanced Stock Charting"
  description="Professional charting with technical indicators, options flow, fundamentals overlay, and drawing tools. Real-time data for stocks, ETFs, and indices."
/>

<section
  class="w-full overflow-hidden min-h-screen bg-linear-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]"
>
  <div class="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
    <!-- Header -->
    <div class="text-center mb-10 sm:mb-14">
      <h1
        class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight"
      >
        Pro Chart
      </h1>
      <p class="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto">
        Advanced charting with technicals, options flow, and fundamentals
      </p>
    </div>

    <!-- Desktop Search Bar -->
    <div class="hidden sm:block max-w-2xl mx-auto">
      <Combobox.Root
        items={searchBarData}
        bind:inputValue
        bind:touchedInput
        onSelectedChange={(state) => handleKeyDown(state?.value)}
      >
        <div
          on:keydown={(e) => {
            if (e.key === "Enter") handleEnter();
          }}
          class="relative w-full"
        >
          <div
            class="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-800 dark:text-zinc-300"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <Combobox.Input
            on:click={() => (inputValue = "")}
            class="w-full py-4 pl-12 pr-12 text-base sm:text-lg text-gray-700 dark:text-zinc-200 bg-white/80 dark:bg-zinc-900/60 border border-gray-300 dark:border-zinc-700 rounded-xl shadow focus:outline-none focus:ring-0 focus:border-gray-300 dark:focus:border-zinc-700 placeholder:text-gray-500 dark:placeholder:text-zinc-500 transition"
            placeholder="Company or stock symbol..."
          />
          <div
            class="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-800 dark:text-zinc-300"
          >
            {#if isLoading}
              <span class="loading loading-spinner loading-sm"></span>
            {:else if inputValue?.length > 0}
              <button class="cursor-pointer" on:click={() => (inputValue = "")}>
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
                  />
                </svg>
              </button>
            {/if}
          </div>
        </div>
        <Combobox.Content
          class="w-full z-40 mt-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-1.5 py-2 shadow-xl outline-hidden"
          sideOffset={8}
        >
          {#if inputValue?.length > 0 && searchBarData?.length > 0}
            <div
              class="pl-2 pb-2 border-b border-gray-300 dark:border-zinc-700 text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-zinc-300 w-full"
            >
              Suggestions
            </div>
            {#each searchBarData as item}
              <Combobox.Item
                class="cursor-pointer text-gray-700 dark:text-zinc-200 border-b border-gray-300 dark:border-zinc-700 last:border-none flex h-fit w-full select-none items-center rounded-lg py-2.5 pl-2 pr-1.5 text-sm outline-hidden transition-colors duration-75 data-highlighted:bg-gray-100/70 dark:data-highlighted:bg-zinc-900/60"
                value={item?.symbol}
                label={item?.name}
                on:click={() => goToChart(item?.symbol)}
              >
                <div class="flex flex-row items-center justify-between w-full">
                  <span
                    class="text-sm font-semibold text-gray-700 dark:text-zinc-200"
                    >{item?.symbol}</span
                  >
                  <span
                    class="ml-3 text-sm text-gray-600 dark:text-zinc-300 truncate"
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
              Popular
            </div>
            {#each popularList as item}
              <Combobox.Item
                class="cursor-pointer text-gray-700 dark:text-zinc-200 border-b border-gray-300 dark:border-zinc-700 last:border-none flex h-fit w-full select-none items-center rounded-lg py-2.5 pl-2 pr-1.5 text-sm outline-hidden transition-colors duration-75 data-highlighted:bg-gray-100/70 dark:data-highlighted:bg-zinc-900/60"
                value={item?.symbol}
                label={item?.name}
                on:click={() => goToChart(item?.symbol)}
              >
                <div class="flex flex-row items-center justify-between w-full">
                  <span
                    class="text-sm font-semibold text-gray-700 dark:text-zinc-200"
                    >{item?.symbol}</span
                  >
                  <span
                    class="ml-3 text-sm text-gray-600 dark:text-zinc-300 truncate"
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
              No results found
            </span>
          {/if}
        </Combobox.Content>
      </Combobox.Root>
    </div>

    <!-- Mobile Search Button -->
    <div class="sm:hidden flex justify-center px-3">
      <label
        for="chartSearchModal"
        class="flex items-center gap-3 px-3 py-2 w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/60 text-gray-500 dark:text-zinc-500 cursor-pointer shadow transition"
      >
        <svg
          class="w-4 h-4 text-gray-800 dark:text-zinc-300"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path
            d="M7 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zM7 2C4.243 2 2 4.243 2 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5z"
          />
          <path
            d="M15.707 14.293L13.314 11.9a8.019 8.019 0 01-1.414 1.414l2.393 2.393a.997.997 0 001.414 0 .999.999 0 000-1.414z"
          />
        </svg>
        <span>Company or stock symbol...</span>
      </label>
    </div>

    <!-- Mobile Search Modal -->
    <input
      type="checkbox"
      id="chartSearchModal"
      class="modal-toggle"
      bind:checked={searchBarModalChecked}
    />
    <dialog
      id="chartSearchModal"
      class="modal modal-middle fixed inset-0 z-[9999] p-3"
    >
      <label for="chartSearchModal" class="cursor-pointer modal-backdrop"
      ></label>
      <div
        class="modal-box min-h-96 overflow-hidden m-auto w-full relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
      >
        <label
          for="chartSearchModal"
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
        <label
          for="chartSearchModal"
          class="inline-block cursor-pointer absolute right-3 top-3"
        >
          <svg
            class="w-6 h-6 sm:w-8 sm:h-8"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
            />
          </svg>
        </label>

        <div class="mt-8">
          <div class="relative">
            <div class="absolute inset-y-0 right-4 flex items-center">
              {#if isLoading}
                <span class="loading loading-spinner loading-sm"></span>
              {:else if inputValue?.length > 0}
                <button
                  class="cursor-pointer"
                  on:click={() => (inputValue = "")}
                >
                  <svg
                    class="w-6 h-6 mt-2 ml-1"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
                    />
                  </svg>
                </button>
              {:else}
                /
              {/if}
            </div>
            <input
              class="w-full py-3 pl-10 pr-12 rounded-xl bg-white/80 dark:bg-zinc-900/60 border border-gray-300 dark:border-zinc-700 shadow text-sm text-gray-700 dark:text-zinc-200 placeholder:text-gray-500 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-0 focus:border-gray-300 dark:focus:border-zinc-700"
              placeholder="Company or stock symbol..."
              bind:value={inputValue}
              bind:this={inputElement}
              autocomplete="off"
              on:keydown={(e) => {
                if (e.key === "Enter" && inputValue) handleKeyDown(inputValue);
              }}
            />
            <button class="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg
                class="w-4 h-4 text-gray-800 dark:text-zinc-300"
                fill="currentColor"
                viewBox="0 0 16 16"
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

        <div
          class="mt-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-1.5 py-2"
        >
          {#if inputValue?.length > 0 && searchBarData?.length > 0}
            <div
              class="pl-2 pb-2 border-b border-gray-300 dark:border-zinc-700 text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-zinc-300 w-full"
            >
              Suggestions
            </div>
            {#each searchBarData as item}
              <li
                class="cursor-pointer text-gray-700 dark:text-zinc-200 border-b border-gray-300 dark:border-zinc-700 last:border-none flex items-center rounded-lg py-2.5 pl-2 pr-1.5 text-sm data-highlighted:bg-gray-100/70 dark:data-highlighted:bg-zinc-900/60 transition"
                on:click={() => goToChart(item?.symbol)}
              >
                <div class="flex flex-row items-center justify-between w-full">
                  <span
                    class="text-sm font-semibold text-gray-700 dark:text-zinc-200"
                    >{item?.symbol}</span
                  >
                  <span
                    class="whitespace-nowrap ml-3 mr-6 text-sm text-gray-600 dark:text-zinc-300 truncate"
                    >{item?.name}</span
                  >
                  <span class="ml-auto text-sm text-gray-500 dark:text-zinc-400"
                    >{item?.type}</span
                  >
                </div>
              </li>
            {/each}
          {:else if inputValue?.length === 0 || !showSuggestions}
            <div
              class="pl-2 pb-2 border-b border-gray-300 dark:border-zinc-700 text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-zinc-300 w-full"
            >
              Popular
            </div>
            {#each popularList as item}
              <li
                class="gap-y-1.5 cursor-pointer text-gray-700 dark:text-zinc-200 border-b border-gray-300 dark:border-zinc-700 last:border-none flex items-center rounded-lg py-2.5 pl-2 pr-1.5 text-sm data-highlighted:bg-gray-100/70 dark:data-highlighted:bg-zinc-900/60 transition"
                on:click={() => goToChart(item?.symbol)}
              >
                <div class="flex flex-row items-center justify-between w-full">
                  <span
                    class="text-sm font-semibold text-gray-700 dark:text-zinc-200"
                    >{item?.symbol}</span
                  >
                  <span
                    class="whitespace-nowrap ml-3 mr-6 text-sm text-gray-600 dark:text-zinc-300 truncate"
                    >{item?.name}</span
                  >
                  <span class="ml-auto text-sm text-gray-500 dark:text-zinc-400"
                    >{item?.type}</span
                  >
                </div>
              </li>
            {/each}
          {:else}
            <span
              class="block px-5 py-2 text-sm text-gray-800 dark:text-zinc-300"
            >
              No results found
            </span>
          {/if}
        </div>
      </div>
    </dialog>

    <!-- Features -->
    <div class="mt-12 sm:mt-16 flex justify-center">
      <div class="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-zinc-500">
        <span>Technicals</span>
        <span class="hidden sm:inline text-zinc-700">·</span>
        <span>Drawing Tools</span>
        <span class="hidden sm:inline text-zinc-700">·</span>
        <span>Options Flow</span>
        <span class="hidden sm:inline text-zinc-700">·</span>
        <span>Fundamentals</span>
        <span class="hidden sm:inline text-zinc-700">·</span>
        <span class="flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          Real-time
        </span>
      </div>
    </div>
  </div>
</section>
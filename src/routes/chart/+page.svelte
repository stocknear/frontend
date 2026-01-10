<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import SEO from "$lib/components/SEO.svelte";

  let inputValue = "";
  let searchResults: any[] = [];
  let isLoading = false;
  let showDropdown = false;
  let timeoutId: ReturnType<typeof setTimeout>;
  let inputElement: HTMLInputElement;

  const goToChart = (symbol: string) => {
    if (!symbol) return;
    goto(`/chart/${symbol.toUpperCase()}`);
  };

  const handleSearch = async () => {
    clearTimeout(timeoutId);

    if (!inputValue?.trim()) {
      searchResults = [];
      showDropdown = false;
      return;
    }

    isLoading = true;
    showDropdown = true;

    timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/searchbar?query=${encodeURIComponent(inputValue)}&limit=6`
        );
        searchResults = await response.json();
      } catch {
        searchResults = [];
      }
      isLoading = false;
    }, 150);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && inputValue?.trim()) {
      if (searchResults.length > 0) {
        goToChart(searchResults[0].symbol);
      } else {
        goToChart(inputValue);
      }
    }
    if (e.key === "Escape") {
      showDropdown = false;
      inputElement?.blur();
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(".search-container")) {
      showDropdown = false;
    }
  };

  onMount(() => {
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  });

  $: if (inputValue) {
    handleSearch();
  } else {
    searchResults = [];
    showDropdown = false;
  }
</script>

<SEO
  title="Pro Chart - Professional Stock Charts with 50+ Indicators"
  description="Analyze stocks with professional charts featuring 50+ technical indicators, drawing tools, earnings markers, and real-time data. Start charting any stock, ETF, or index."
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
        Professional charts with 50+ indicators, drawing tools, and earnings markers
      </p>
    </div>

    <!-- Search Bar -->
    <div class="search-container relative max-w-2xl mx-auto">
      <div class="relative">
        <div
          class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none"
        >
          <svg
            class="h-5 w-5 text-zinc-400"
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
        <input
          bind:this={inputElement}
          bind:value={inputValue}
          on:keydown={handleKeyDown}
          on:focus={() => inputValue && (showDropdown = true)}
          type="text"
          placeholder="Search for any stock, ETF, or index..."
          class="w-full py-4 pl-12 pr-12 text-base sm:text-lg text-white bg-zinc-900/80 border border-zinc-700 rounded-xl focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 placeholder-zinc-500 transition"
        />
        {#if isLoading}
          <div class="absolute inset-y-0 right-0 flex items-center pr-4">
            <span class="loading loading-spinner loading-sm text-zinc-400"
            ></span>
          </div>
        {:else if inputValue}
          <button
            class="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-400 hover:text-white transition"
            on:click={() => {
              inputValue = "";
              inputElement?.focus();
            }}
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
              />
            </svg>
          </button>
        {/if}
      </div>

      <!-- Search Dropdown -->
      {#if showDropdown && searchResults.length > 0}
        <div
          class="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden"
        >
          {#each searchResults as item}
            <button
              class="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800 transition text-left border-b border-zinc-800 last:border-none"
              on:click={() => goToChart(item.symbol)}
            >
              <div class="flex items-center gap-3">
                <span class="font-semibold text-white">{item.symbol}</span>
                <span class="text-zinc-400 text-sm truncate max-w-[200px] sm:max-w-[300px]"
                  >{item.name}</span
                >
              </div>
              <span class="text-zinc-500 text-xs">{item.type}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Features hint -->
    <div class="mt-8 sm:mt-10 text-center">
      <div class="flex flex-wrap justify-center gap-4 sm:gap-8 text-sm text-zinc-500">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          <span>50+ Technical Indicators</span>
        </div>
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          <span>Drawing Tools</span>
        </div>
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          <span>Earnings Markers</span>
        </div>
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          <span>Real-time Data</span>
        </div>
      </div>
    </div>
  </div>
</section>

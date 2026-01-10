<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount, onDestroy } from "svelte";
  import { init, dispose } from "klinecharts";
  import { DateTime } from "luxon";
  import SEO from "$lib/components/SEO.svelte";

  export let data;

  const zone = "America/New_York";

  let inputValue = "";
  let searchResults: any[] = [];
  let isLoading = false;
  let showDropdown = false;
  let timeoutId: ReturnType<typeof setTimeout>;
  let inputElement: HTMLInputElement;
  let chartContainer: HTMLDivElement;
  let chart: any = null;

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
          `/api/searchbar?query=${encodeURIComponent(inputValue)}&limit=6`,
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

  // Parse intraday timestamp using luxon (same as [slug] page)
  const parseIntradayTimestamp = (value: string): number | null => {
    const dt = DateTime.fromFormat(value, "yyyy-MM-dd HH:mm:ss", { zone });
    return dt.isValid ? dt.toMillis() : null;
  };

  // Check if timestamp is within market hours (9:30 AM - 4:00 PM ET)
  const isMarketHours = (timestamp: number): boolean => {
    const dt = DateTime.fromMillis(timestamp, { zone });
    const hour = dt.hour;
    const minute = dt.minute;
    const timeInMinutes = hour * 60 + minute;
    const marketOpen = 9 * 60 + 30; // 9:30 AM = 570 minutes
    const marketClose = 16 * 60; // 4:00 PM = 960 minutes
    return timeInMinutes >= marketOpen && timeInMinutes <= marketClose;
  };

  // Transform intraday data to klinecharts format (market hours only)
  const transformIntradayData = (rawData: any[]) => {
    if (!Array.isArray(rawData) || rawData.length === 0) return [];
    return rawData
      .map((bar) => {
        const time = typeof bar?.time === "string" ? bar.time : null;
        if (!time) return null;
        const timestamp = parseIntradayTimestamp(time);
        if (!timestamp) return null;
        // Filter to market hours only
        if (!isMarketHours(timestamp)) return null;
        return {
          timestamp,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: bar.volume ?? 0,
        };
      })
      .filter(Boolean);
  };

  onMount(() => {
    document.addEventListener("click", handleClickOutside);

    // Initialize the preview chart
    if (chartContainer && data?.spyIntraday?.length > 0) {
      chart = init(chartContainer, { timezone: zone });

      if (chart) {
        // Disable scrolling and zooming
        chart.setScrollEnabled(false);
        chart.setZoomEnabled(false);

        // Apply dark theme styles
        chart.setStyles({
          grid: {
            show: true,
            horizontal: {
              show: true,
              size: 1,
              color: "rgba(255, 255, 255, 0.05)",
              style: "solid",
            },
            vertical: {
              show: false,
            },
          },
          candle: {
            type: "candle_solid",
            bar: {
              upColor: "#10B981",
              downColor: "#EF4444",
              noChangeColor: "#6B7280",
              upBorderColor: "#10B981",
              downBorderColor: "#EF4444",
              noChangeBorderColor: "#6B7280",
              upWickColor: "#10B981",
              downWickColor: "#EF4444",
              noChangeWickColor: "#6B7280",
            },
            priceMark: {
              show: false,
            },
            tooltip: {
              showRule: "none",
            },
          },
          xAxis: {
            show: true,
            axisLine: {
              show: false,
            },
            tickLine: {
              show: false,
            },
            tickText: {
              show: true,
              color: "rgba(255, 255, 255, 0.4)",
              size: 10,
            },
          },
          yAxis: {
            show: true,
            axisLine: {
              show: false,
            },
            tickLine: {
              show: false,
            },
            tickText: {
              show: true,
              color: "rgba(255, 255, 255, 0.4)",
              size: 10,
            },
          },
          crosshair: {
            show: false,
          },
        });

        // Transform the SPY data
        const chartData = transformIntradayData(data?.spyIntraday);

        // Calculate bar space to fit all data (390 minutes in market hours)
        // Container is ~800px wide on desktop, so use small bar space
        const containerWidth = chartContainer.clientWidth || 800;
        const totalBars = 390; // 9:30 to 16:00 = 390 minutes
        const calculatedBarSpace = Math.max(1, Math.floor(containerWidth / totalBars));
        chart.setBarSpace(calculatedBarSpace);

        // Use v10 API: setSymbol, setPeriod, setDataLoader
        chart.setSymbol({ ticker: "SPY" });
        chart.setPeriod({ span: 1, type: "minute" });
        chart.setDataLoader({
          getBars: ({ callback }) => {
            callback(chartData, { backward: false, forward: false });
          },
        });

        // Scroll to show from beginning (9:30 AM)
        chart.scrollToDataIndex(0);
      }
    }

    return () => document.removeEventListener("click", handleClickOutside);
  });

  onDestroy(() => {
    if (chart) {
      dispose(chartContainer);
      chart = null;
    }
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
        Professional charts with 50+ indicators, drawing tools, and earnings
        markers
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
          placeholder="Analyze the chart of ..."
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
                <span
                  class="text-zinc-400 text-sm truncate max-w-[200px] sm:max-w-[300px]"
                  >{item.name}</span
                >
              </div>
              <span class="text-zinc-500 text-xs">{item.type}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- SPY Preview Chart -->
    <div class="mt-10 sm:mt-12 max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-zinc-400">SPY</span>
          <span class="text-xs text-zinc-500">S&P 500 ETF - Today</span>
        </div>
        <button
          on:click={() => goToChart("SPY")}
          class="text-xs text-violet-400 hover:text-violet-300 transition"
        >
          Open full chart →
        </button>
      </div>
      <div
        bind:this={chartContainer}
        class="w-full h-[280px] sm:h-[320px] bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden"
      ></div>
    </div>

    <!-- Features hint -->
    <div class="mt-8 sm:mt-10 text-center">
      <div
        class="flex flex-wrap justify-center gap-4 sm:gap-8 text-sm text-zinc-500"
      >
        <div class="flex items-center gap-2">
          <svg
            class="w-4 h-4 text-violet-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
          <span>50+ Technical Indicators</span>
        </div>
        <div class="flex items-center gap-2">
          <svg
            class="w-4 h-4 text-violet-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
          <span>Drawing Tools</span>
        </div>
        <div class="flex items-center gap-2">
          <svg
            class="w-4 h-4 text-violet-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
          <span>Earnings Markers</span>
        </div>
        <div class="flex items-center gap-2">
          <svg
            class="w-4 h-4 text-violet-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
          <span>Real-time Data</span>
        </div>
      </div>
    </div>
  </div>
</section>

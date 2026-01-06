<script lang="ts">
  export let sources: Array<{
    name: string;
    description?: string;
    function: string;
    ticker?: string;
    timestamp?: string;
    type?: string;
    url?: string;
  }> = [];

  // Unique tickers with their URLs
  const tickersWithUrls = Array?.from(
    new Set(sources?.map((s) => s.ticker).filter(Boolean)),
  )?.map((ticker) => {
    // Find the first source with this ticker to get its URL
    const source = sources?.find((s) => s.ticker === ticker);
    return {
      ticker,
      url: source?.url || `/stocks/${ticker}`, // fallback to /stocks/ if no URL
    };
  });

  // State for expand/collapse
  let isExpanded = false;
  const INITIAL_DISPLAY_COUNT = 3;

  // Determine which sources to display
  $: displayedSources = isExpanded
    ? sources
    : sources?.slice(0, INITIAL_DISPLAY_COUNT);
  $: hasMoreSources = sources?.length > INITIAL_DISPLAY_COUNT;
</script>

{#if sources && sources?.length > 0}
  <div
    class="w-full mt-6 pt-4 border-t border-gray-200/70 dark:border-zinc-800/80"
  >
    <div class="flex items-center gap-2 mb-3">
      <h3
        class="text-[0.9rem] sm:text-base font-semibold tracking-tight text-gray-900 dark:text-zinc-100"
      >
        Sources
      </h3>
      <span class="text-xs text-gray-500 dark:text-zinc-400 tabular-nums">
        ({sources?.length})
      </span>
    </div>

    <!-- Row 1: Tickers side-by-side -->
    {#if tickersWithUrls?.length > 0}
      <div class="flex flex-wrap gap-2 mb-4">
        {#each tickersWithUrls as { ticker, url }}
          <a
            href={url}
            class="inline-flex items-center rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/50 px-2 py-0.5 text-xs font-semibold text-violet-800 dark:text-violet-400 transition sm:hover:text-muted dark:sm:hover:text-white"
          >
            {ticker}
          </a>
        {/each}
      </div>
    {/if}

    <!-- Row 2: Sources side-by-side -->
    <div
      class="sources-section grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-all duration-300"
    >
      {#each displayedSources as source, index}
        <a
          href={source.url || "#"}
          class="flex items-start gap-3 rounded-xl border border-gray-200/70 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/40 p-4 transition sm:hover:border-violet-300/60 dark:sm:hover:border-violet-500/40"
          class:cursor-pointer={source.url}
          class:cursor-default={!source.url}
        >
          <div
            class="avatar w-7 h-7 rounded-full flex items-center justify-center bg-gray-100/80 dark:bg-zinc-900/60"
          >
            <img
              src={source.ticker?.length > 0 && source.ticker !== "General"
                ? `https://financialmodelingprep.com/image-stock/${source.ticker}.png`
                : "/pwa-192x192.png"}
              alt={`${source?.ticker || "Stocknear"} logo`}
              class="shrink-0 w-4 h-4 rounded-full"
            />
          </div>

          <div class="flex-1 min-w-0">
            <h5
              class="text-xs sm:text-sm font-semibold tracking-tight text-gray-900 dark:text-zinc-100 truncate"
            >
              {source.name}
            </h5>
            <p class="text-[0.72rem] text-gray-600 dark:text-zinc-400 mt-1">
              {source.description || "Live data from Stocknear"}
            </p>
          </div>
        </a>
      {/each}
    </div>

    <!-- Show More/Less button -->
    {#if hasMoreSources}
      <button
        on:click={() => (isExpanded = !isExpanded)}
        class="cursor-pointer group mt-4 inline-flex items-center gap-2 rounded-full border border-gray-200/70 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/40 px-4 py-1.5 text-xs font-semibold text-gray-500 dark:text-zinc-400 transition sm:hover:text-violet-600 dark:sm:hover:text-violet-400"
      >
        <span class="relative">
          {#if !isExpanded}
            <span class="flex items-center gap-1.5">
              <span>View all {sources.length} sources</span>
              <svg
                class="w-4 h-4 transition-transform group-hover:translate-y-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </span>
          {:else}
            <span class="flex items-center gap-1.5">
              <span>Show less</span>
              <svg
                class="w-4 h-4 transition-transform group-hover:-translate-y-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </span>
          {/if}
        </span>
      </button>
    {/if}
  </div>
{/if}

<style>
  .source-card {
    animation: fadeInUp 0s ease-out forwards;
    opacity: 0;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>

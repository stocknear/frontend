<script lang="ts">
  import { screenWidth } from "$lib/store";

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
  const INITIAL_DISPLAY_COUNT = $screenWidth < 640 ? 3 : 6;

  // Determine which sources to display
  $: displayedSources = isExpanded
    ? sources
    : sources?.slice(0, INITIAL_DISPLAY_COUNT);
  $: hasMoreSources = sources?.length > INITIAL_DISPLAY_COUNT;
</script>

{#if sources && sources?.length > 0}
  <div class="w-full mt-6 pt-4 border-t border-gray-300 dark:border-gray-600">
    <div class="flex items-center gap-2 mb-4">
      <h3 class="text-[1rem] sm:text-lg font-semibold">Sources</h3>
      <span class="text-sm">({sources?.length})</span>
    </div>

    <!-- Row 1: Tickers side-by-side -->
    {#if tickersWithUrls?.length > 0}
      <div class="flex flex-wrap gap-2 mb-4">
        {#each tickersWithUrls as { ticker, url }}
          <a
            href={url}
            class="inline-block badge border-blue-100 dark:border-gray-800 bg-blue-50 dark:bg-primary font-semibold rounded px-2 text-blue-800 dark:text-blue-400 sm:hover:text-muted dark:sm:hover:text-white"
          >
            {ticker}
          </a>
        {/each}
      </div>
    {/if}

    <!-- Row 2: Sources side-by-side -->
    <div
      class="sources-section grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 transition-all duration-300"
    >
      {#each displayedSources as source, index}
        <a
          href={source.url || "#"}
          class=" flex items-start gap-3 p-3 rounded bg-gray-100 shadow dark:bg-primary sm:hover:bg-gray-200 dark:sm:hover:bg-secondary transition-all"
          class:cursor-pointer={source.url}
          class:cursor-default={!source.url}
        >
          <div
            class="avatar w-5 h-5 rounded-full flex items-center justify-center"
          >
            <img
              src={source.ticker?.length > 0 && source.ticker !== "General"
                ? `https://financialmodelingprep.com/image-stock/${source.ticker}.png`
                : "/pwa-192x192.png"}
              alt={`${source?.ticker || "Stocknear"} logo`}
              class="shrink-0 w-3.5 h-3.5 rounded-full"
            />
          </div>

          <div class="flex-1 min-w-0">
            <h5
              class="text-xs sm:text-sm font-medium text-black dark:text-gray-100 truncate"
            >
              {source.name}
            </h5>
            <p class="text-xs text-gray-900 dark:text-gray-300 mt-0.5">
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
        class="cursor-pointer group mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all"
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

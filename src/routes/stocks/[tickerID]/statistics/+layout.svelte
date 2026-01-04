<script lang="ts">
  import { stockTicker } from "$lib/store";
  import { page } from "$app/stores";

  let displaySubSection = "overview";

  function changeSubSection(state) {
    const subSectionMap = {
      "market-cap": "/statistics/market-cap",
      "short-interest": "/statistics/short-interest",
      revenue: "/statistics/revenue",
      earnings: "/statistics/earnings",
      "fail-to-deliver": "/statistics/fail-to-deliver",
    };

    if (state !== "overview" && subSectionMap[state]) {
      displaySubSection = state;
    } else {
      displaySubSection = state;
    }
  }

  $: {
    if ($page?.url?.pathname) {
      const parts = $page?.url?.pathname.split("/");
      const sectionMap = {
        earnings: "earnings",
        "market-cap": "market-cap",
        "short-interest": "short-interest",
        revenue: "revenue",
        "fail-to-deliver": "fail-to-deliver",
      };

      const foundSection = parts?.find((part) =>
        Object?.values(sectionMap)?.includes(part),
      );

      displaySubSection =
        Object?.keys(sectionMap)?.find(
          (key) => sectionMap[key] === foundSection,
        ) || "overview";
    }
  }
</script>

<section class="w-full overflow-hidden h-full">
  <div class="m-auto h-full overflow-hidden">
    <main class="w-full">
      <div class="m-auto">
        <nav
          class="mt-1 mb-5 sm:mb-0 sm:ml-4 pt-1 text-sm whitespace-nowrap overflow-x-auto border-b border-gray-200/70 dark:border-zinc-800/80"
        >
          <ul
            class="flex flex-row items-center w-full gap-1 pb-3 text-sm sm:text-base"
          >
            <a
              href={`/stocks/${$stockTicker}/statistics`}
              on:click={() => changeSubSection("overview")}
              class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
              'overview'
                ? 'border-gray-200/70 dark:border-zinc-800/80 bg-gray-100/70 dark:bg-zinc-900/60 text-gray-900 dark:text-white'
                : 'border-transparent text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
            >
              Overview
            </a>

            <a
              href={`/stocks/${$stockTicker}/statistics/earnings`}
              on:click={() => changeSubSection("earnings")}
              class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
              'earnings'
                ? 'border-gray-200/70 dark:border-zinc-800/80 bg-gray-100/70 dark:bg-zinc-900/60 text-gray-900 dark:text-white'
                : 'border-transparent text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
            >
              Earnings
            </a>

            <a
              href={`/stocks/${$stockTicker}/statistics/market-cap`}
              on:click={() => changeSubSection("market-cap")}
              class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
              'market-cap'
                ? 'border-gray-200/70 dark:border-zinc-800/80 bg-gray-100/70 dark:bg-zinc-900/60 text-gray-900 dark:text-white'
                : 'border-transparent text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
            >
              Market Cap
            </a>

            <a
              href={`/stocks/${$stockTicker}/statistics/short-interest`}
              on:click={() => changeSubSection("short-interest")}
              class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
              'short-interest'
                ? 'border-gray-200/70 dark:border-zinc-800/80 bg-gray-100/70 dark:bg-zinc-900/60 text-gray-900 dark:text-white'
                : 'border-transparent text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
            >
              Short Interest
            </a>

            <a
              href={`/stocks/${$stockTicker}/statistics/revenue`}
              on:click={() => changeSubSection("revenue")}
              class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
              'revenue'
                ? 'border-gray-200/70 dark:border-zinc-800/80 bg-gray-100/70 dark:bg-zinc-900/60 text-gray-900 dark:text-white'
                : 'border-transparent text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
            >
              Revenue
            </a>

            <a
              href={`/stocks/${$stockTicker}/statistics/fail-to-deliver`}
              on:click={() => changeSubSection("fail-to-deliver")}
              class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
              'fail-to-deliver'
                ? 'border-gray-200/70 dark:border-zinc-800/80 bg-gray-100/70 dark:bg-zinc-900/60 text-gray-900 dark:text-white'
                : 'border-transparent text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
            >
              Fail-to-Deliver
            </a>
          </ul>
        </nav>
      </div>
      <slot />
    </main>
  </div>
</section>

<style>
  .scrollbar {
    display: grid;
    grid-gap: 18px;
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
</style>

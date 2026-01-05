<script lang="ts">
  import { getLastTradingDay } from "$lib/utils";
  import { page } from "$app/stores";
  import { displayTitle, displayDate } from "$lib/store";

  export let data;
  const lastTradingDay = new Date(getLastTradingDay() ?? null)?.toLocaleString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    },
  );

  let timePeriod;

  // Capitalize only the first letter of the last path segment
  $: categoryType = $page.url.pathname
    .split("/")
    .pop()
    ?.toLowerCase()
    ?.replace(/^\w/, (c) => c.toUpperCase());

  $: {
    const pathSegments = $page.url.pathname.split("/");
    timePeriod = pathSegments[pathSegments.length - 1];

    $displayTitle = "Pre-market" + " " + categoryType;
    $displayDate = lastTradingDay;
  }
</script>

<section
  class="w-full overflow-hidden m-auto min-h-screen text-gray-700 dark:text-zinc-200"
>
  <div class="flex justify-center w-full m-auto overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <main class="w-full">
        <!--Start Top Winners/Losers-->

        <nav
          class="border-b border-gray-300 dark:border-zinc-700 overflow-x-auto whitespace-nowrap"
        >
          <ul
            class="flex flex-row items-center w-full gap-1 pb-2 text-sm sm:text-base"
          >
            <a
              href="/market-mover/premarket/gainers"
              class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {categoryType ===
              'Gainers'
                ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
            >
              Gainers
            </a>
            <a
              href="/market-mover/premarket/losers"
              class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {categoryType ===
              'Losers'
                ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
            >
              Losers
            </a>
          </ul>
        </nav>

        <div class="flex flex-col justify-center items-center overflow-hidden">
          <slot />
        </div>
      </main>
    </div>
  </div>
</section>

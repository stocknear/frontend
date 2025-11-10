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

    $displayTitle = "After-hours" + " " + categoryType;
    $displayDate = lastTradingDay;
  }
</script>

<section class="w-full overflow-hidden m-auto min-h-screen">
  <div class="flex justify-center w-full m-auto overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <main class="w-full">
        <!--Start Top Winners/Losers-->

        <nav class=" pt-1 overflow-x-auto whitespace-nowrap">
          <ul
            class="flex flex-row items-center w-full text-sm sm:text-[1rem] text-white"
          >
            <a
              href="/market-mover/afterhours/gainers"
              class="p-2 px-5 cursor-pointer {categoryType === 'Gainers'
                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
            >
              Gainers
            </a>
            <a
              href="/market-mover/afterhours/losers"
              class="p-2 px-5 cursor-pointer {categoryType === 'Losers'
                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
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

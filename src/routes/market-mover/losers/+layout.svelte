<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
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
  const titles = {
    losers: "title Today",
    week: "Week title",
    month: "Month title",
    year: "1 Year title",
    "3Y": "3 Year title",
    "5Y": "5 Year title",
  };

  let timePeriod;

  let title = "Losers";

  $: {
    const pathSegments = $page.url.pathname.split("/");
    timePeriod = pathSegments[pathSegments.length - 1];

    $displayTitle = titles[timePeriod]?.replace("title", title);
    $displayDate = lastTradingDay;
  }
</script>

<SEO
  title={timePeriod === "losers"
    ? `Today's Top Stock ${title}`
    : `Top Stock ${title} in the past ${timePeriod}`}
  description="A list of the stocks with the highest percentage gain, highest percentage loss and most active today. See stock price, volume, market cap and more."
/>

<section
  class="w-full overflow-hidden m-auto min-h-screen text-muted dark:text-white"
>
  <div class="flex justify-center w-full m-auto overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <main class="w-full">
        <!--Start Top Winners/Losers-->

        <nav class="overflow-x-auto whitespace-nowrap">
          <ul
            class="flex flex-row items-center w-full text-sm sm:text-[1rem] text-white"
          >
            <a
              href="/market-mover/losers"
              class="p-2 px-5 cursor-pointer {timePeriod === 'losers'
                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
            >
              Today
            </a>
            <a
              href="/market-mover/losers/week"
              class="p-2 px-5 cursor-pointer {timePeriod === 'week'
                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
            >
              Week
            </a>
            <a
              href="/market-mover/losers/month"
              class="p-2 px-5 cursor-pointer {timePeriod === 'month'
                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
            >
              Month
            </a>
            <a
              href="/market-mover/losers/year"
              class="p-2 px-5 cursor-pointer {timePeriod === 'year'
                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
            >
              Year
            </a>
            <a
              href="/market-mover/losers/3Y"
              class="p-2 px-5 cursor-pointer {timePeriod === '3Y'
                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
            >
              3 Years
            </a>
            <a
              href="/market-mover/losers/5Y"
              class="p-2 px-5 cursor-pointer {timePeriod === '5Y'
                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
            >
              5 Years
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

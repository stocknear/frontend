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
    gainers: "title Today",
    week: "Week title",
    month: "Month title",
    year: "1 Year title",
    "3Y": "3 Year title",
    "5Y": "5 Year title",
  };

  let timePeriod;

  let title = "Gainers";

  $: {
    const pathSegments = $page.url.pathname.split("/");
    timePeriod = pathSegments[pathSegments.length - 1];

    $displayTitle = titles[timePeriod]?.replace("title", title);
    $displayDate = lastTradingDay;
  }
</script>

<SEO
  title={timePeriod === "gainers"
    ? `Top Stock Gainers Today - Biggest Winners & Best Performing Stocks `
    : `Top Stock Gainers ${timePeriod} - Best Performing Stocks & Winners `}
  description={timePeriod === "gainers"
    ? "Track today's biggest stock market gainers and winners. Monitor stocks with highest percentage gains, top performers by volume, market cap, and price movements. Free real-time stock gainers list."
    : `Find the best performing stocks and biggest gainers over the past ${timePeriod}. Track winning stocks, percentage gains, and top performers with detailed market data and analysis.`}
  keywords="stock gainers, biggest stock winners, top performing stocks, best stocks today, stock market winners, stock gainers list, top gainers, winning stocks"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name:
      timePeriod === "gainers"
        ? "Today's Top Stock Gainers"
        : `Top Stock Gainers - ${timePeriod}`,
    description: "List of top performing stocks and biggest market gainers",
    url: `https://stocknear.com/market-mover/gainers${timePeriod === "gainers" ? "" : "/" + timePeriod}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://stocknear.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Market Mover",
          item: "https://stocknear.com/market-mover",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Gainers",
          item: "https://stocknear.com/market-mover/gainers",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Stock Gainers List",
      description: "Top performing stocks with highest percentage gains",
    },
  }}
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
              href="/market-mover/gainers"
              class="p-2 px-5 cursor-pointer {timePeriod === 'gainers'
                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
            >
              Today
            </a>
            <a
              href="/market-mover/gainers/week"
              class="p-2 px-5 cursor-pointer {timePeriod === 'week'
                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
            >
              Week
            </a>
            <a
              href="/market-mover/gainers/month"
              class="p-2 px-5 cursor-pointer {timePeriod === 'month'
                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
            >
              Month
            </a>
            <a
              href="/market-mover/gainers/year"
              class="p-2 px-5 cursor-pointer {timePeriod === 'year'
                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
            >
              Year
            </a>
            <a
              href="/market-mover/gainers/3Y"
              class="p-2 px-5 cursor-pointer {timePeriod === '3Y'
                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
            >
              3 Years
            </a>
            <a
              href="/market-mover/gainers/5Y"
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

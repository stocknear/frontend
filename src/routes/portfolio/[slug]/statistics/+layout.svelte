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

<section class="w-auto overflow-hidden h-full">
  <div class="m-auto h-full overflow-hidden">
    <main class="w-full">
      <div class="m-auto">
        <nav
          class="mb-5 sm:mb-0 sm:ml-4 pt-1 text-sm sm:text-[1rem] whitespace-nowrap overflow-x-auto whitespace-nowrap"
        >
          <ul class="flex flex-row items-center w-full">
            <a
              href={`/stocks/${$stockTicker}/statistics`}
              on:click={() => changeSubSection("overview")}
              class="p-2 px-5 cursor-pointer {displaySubSection === 'overview'
                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
            >
              Overview
            </a>

            <a
              href={`/stocks/${$stockTicker}/statistics/earnings`}
              on:click={() => changeSubSection("earnings")}
              class="p-2 px-5 cursor-pointer {displaySubSection === 'earnings'
                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
            >
              Earnings
            </a>

            <a
              href={`/stocks/${$stockTicker}/statistics/market-cap`}
              on:click={() => changeSubSection("market-cap")}
              class="p-2 px-5 cursor-pointer {displaySubSection === 'market-cap'
                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
            >
              Market Cap
            </a>

            <a
              href={`/stocks/${$stockTicker}/statistics/short-interest`}
              on:click={() => changeSubSection("short-interest")}
              class="p-2 px-5 cursor-pointer {displaySubSection ===
              'short-interest'
                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
            >
              Short Interest
            </a>

            <a
              href={`/stocks/${$stockTicker}/statistics/revenue`}
              on:click={() => changeSubSection("revenue")}
              class="p-2 px-5 cursor-pointer {displaySubSection === 'revenue'
                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
            >
              Revenue
            </a>

            <a
              href={`/stocks/${$stockTicker}/statistics/fail-to-deliver`}
              on:click={() => changeSubSection("fail-to-deliver")}
              class="p-2 px-5 cursor-pointer {displaySubSection ===
              'fail-to-deliver'
                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
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

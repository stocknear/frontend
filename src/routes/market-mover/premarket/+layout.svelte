<script lang="ts">
  import { getLastTradingDay } from "$lib/utils";
  import { page } from "$app/stores";
  import InfoModal from "$lib/components/InfoModal.svelte";

  export let data;
  const lastTradingDay = new Date(getLastTradingDay() ?? null)?.toLocaleString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );

  $: categoryType = $page.url.pathname.split("/").pop();
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
              href="/market-mover/premarket/gainers"
              class="p-2 px-5 cursor-pointer {categoryType === 'gainers'
                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
            >
              Gainers
            </a>
            <a
              href="/market-mover/premarket/losers"
              class="p-2 px-5 cursor-pointer {categoryType === 'losers'
                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
            >
              Losers
            </a>
          </ul>
        </nav>

        <div
          class="flex flex-col justify-center items-center overflow-hidden mt-10"
        >
          <div class="controls groups w-full">
            <div
              class="title-group flex flex-row items-center justify-start mb-3"
            >
              <h1 class="text-xl sm:text-2xl font-semibold">
                Premarket {categoryType === "gainers" ? "Gainers" : "Losers"}
              </h1>
              <InfoModal
                title={`${categoryType === "gainers" ? "Premarket Gainers" : "Premarket Losers"} Today`}
                content={`The stocks with the highest percentage ${categoryType === "gainers" ? "gains" : "loss"} in the premarket, updated every two minutes during market closing. Excludes stocks with a market cap under 10M.`}
                id={"premarketId"}
              />
              <div
                class="mb-0 ml-5 mt-1 whitespace-nowrap text-sm font-semibold"
              >
                <span class="hidden lg:inline">Updated</span>
                {lastTradingDay}
              </div>
              <div
                class="flex flex-row items-center justify-end w-fit sm:w-[50%] md:w-auto ml-auto"
              ></div>
            </div>
          </div>
          <slot />
        </div>
      </main>
    </div>
  </div>
</section>

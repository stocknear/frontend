<script lang="ts">
  import { onMount } from "svelte";

  import { screenWidth } from "$lib/store";
  import { isPWAInstalled } from "$lib/utils";
  import { closedPWA } from "$lib/store";
  import SEO from "$lib/components/SEO.svelte";
  import MarketMover from "$lib/components/Dashboard/MarketMover.svelte";
  import UpcomingEarnings from "$lib/components/Dashboard/UpcomingEarnings.svelte";
  import OptionsFlow from "$lib/components/Dashboard/OptionsFlow.svelte";
  import Wiim from "$lib/components/Dashboard/Wiim.svelte";
  import AnalystReport from "$lib/components/Dashboard/AnalystReport.svelte";
  //import AIAgent from "$lib/components/Dashboard/AIAgent.svelte";

  export let data;
  export let form;

  let gainersList = data?.getDashboard?.gainers || [];
  let losersList = data?.getDashboard?.losers || [];
  let marketStatus = data?.getDashboard?.marketStatus ?? 0;

  let wiim = data?.getDashboard?.wiim || [];
  let optionsFlowList = data?.getDashboard?.optionsFlow || [];
  let upcomingEarnings = data?.getDashboard?.upcomingEarnings || [];
  let analystReport = data?.getDashboard?.analystReport || {};
  let pwaInstalled = false;
  let AppInstalled = null;

  function getClosedPWA() {
    //if user closed the banner
    const item = localStorage.getItem("closePWA");
    if (!item) return null;

    const { value, expires } = JSON.parse(item);
    if (new Date() > new Date(expires)) {
      localStorage.removeItem("closePWA"); // Remove expired item
      return null;
    }
    return value;
  }

  onMount(async () => {
    pwaInstalled = isPWAInstalled();

    if (!pwaInstalled) {
      try {
        $closedPWA = getClosedPWA();

        if (!$closedPWA) {
          // Dynamically import the AppInstalled component
          AppInstalled = (await import("$lib/components/AppInstalled.svelte"))
            .default;
        }
      } catch (e) {
        console.error("Error loading AppInstalled component:", e);
      }
    }
  });

  $: charNumber = $screenWidth < 640 ? 20 : 30;
</script>

<SEO
  title="Free Online Stock Analysis for Investors"
  description="Stocknear has everything you need to analyze stocks with help of AI, including detailed financial data, statistics, news and charts."
/>

<div class="w-full max-w-8xl overflow-hidden m-auto min-h-screen mb-16">
  {#if AppInstalled && !$closedPWA}
    <svelte:component this={AppInstalled} />
  {/if}
  <!--
  {#if !["Pro", "Plus"]?.includes(data?.user?.tier)}
    <div class="flex justify-center mb-5 whitespace-nowrap mt-5 sm:mt-0">
      <a
        href="/pricing"
        class="cursor-pointer whitespace-nowrap flex flex-col sm:flex-row items-center gap-2 px-3.5 py-2.5 text-sm sm:text-[1rem] font-medium border border-gray-300 dark:border-gray-800 shadow rounded"
        tabindex="0"
      >
        <div>
          <svg
            class="w-5 h-5 text-zinc-500 dark:text-orange-200 inline-block"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z"
              clip-rule="evenodd"
            ></path>
          </svg>
          <strong class="text-pink-500 text-[1rem]"> Summer Sale:</strong>
        </div>
        <div>Get <strong> 50% OFF</strong> on your Subscription!</div>
      </a>
    </div>
  {/if}
-->

  <main id="main">
    <div
      class="border-b border-gray-100 dark:border-gray-800 rounded-[5px] px-4 bg-gray-100 dark:bg-[#1C1E22] pt-8 sm:pt-12 shadow-sm pb-26 landscape:border-t-2 landscape:md:border-t-0"
    >
      <!--
      <div class="flex justify-center mb-5 whitespace-nowrap">
        <div class=" flex justify-center lg:mb-3">
          <a href="/options-screener"
            ><div
              class="flex items-center justify-center sm:hover:text-muted dark:sm:hover:text-white text-blue-700 dark:text-blue-400"
            >
              <div class="text-lg sm:text-xl font-semibold">
                Options Screener
              </div>
              <div
                class="-mt-2 ml-1 -rotate-6 rounded-[3px] bg-red-500 px-1 py-0.5 text-xs font-semibold text-white"
              >
                New
              </div>
            </div></a
          >
        </div>
      </div>
        -->

      <div class="mx-auto max-w-[850px] text-center">
        <h1
          class="mb-3 text-2xl font-bold sm:mb-5 md:text-4xl lg:mb-7 lg:text-[42px]"
        >
          Research your Trading Ideas
        </h1>
        <p class=" sm:text-lg md:text-xl lg:text-[22px] lg:leading-8">
          Accurate information on all US Stocks and funds. See stock prices,
          options data, dark pool orders, news, financials, forecasts, charts
          and more.
        </p>
        <!--
        <div class="mx-auto max-w-[95%] md:max-w-[85%]">
          <AIAgent {data} {form} />
        </div>
        -->
      </div>
    </div>

    <div>
      <div class="mb-4 flex justify-center">
        <div
          class="-mt-12 grid max-w-[90%] grid-cols-2 gap-4 sm:grid-cols-3 md:-mt-10 lg:grid-cols-6 xl:-mt-12 xl:max-w-[80%] xl:gap-6"
        >
          {#each data?.selectedCards as card}
            <a
              href={card.href}
              class="border border-gray-300 dark:border-gray-600 flex flex-col justify-center items-center p-4 bg-white dark:bg-secondary rounded-[5px] shadow font-semibold gap-2 hover:shadow-lg text-center dark:hover:shadow-dark-600 dark:hover:shadow-md"
            >
              {@html card.icon}
              <div>{card.label}</div>
            </a>
          {/each}
        </div>
      </div>
    </div>
    <div class="mb-8 pb-3 pt-6 md:pt-8 lg:pt-10">
      <MarketMover {gainersList} {losersList} {marketStatus} {charNumber} />

      <div
        class="mx-auto flex flex-col px-3 pt-6 xs:px-4 sm:px-5 md:pt-8 lg:grid lg:max-w-[1200px] lg:grid-cols-3 lg:justify-evenly lg:gap-8 lg:pt-10"
      >
        <Wiim {wiim} />

        <div class="flex flex-col space-y-6 pt-6 lg:space-y-8 lg:pt-0">
          <AnalystReport {analystReport} />

          <UpcomingEarnings {upcomingEarnings} />
          <OptionsFlow {optionsFlowList} />
        </div>
      </div>
    </div>
  </main>
</div>

<style>
  .scrollbar {
    display: grid;
    grid-gap: 90px;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
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

  .stroke-text {
    font-size: 56px; /* Adjust the font size as needed */
    font-weight: bold; /* Adjust the font weight as needed */
    color: transparent; /* Make the text transparent */
    -webkit-text-stroke: 1px #cbd5e1; /* Add a black stroke outline with a thickness of 2px */
  }
</style>

<script lang="ts">
  import { onMount } from "svelte";

  import { screenWidth } from "$lib/store";
  import { isPWAInstalled } from "$lib/utils";
  import { closedPWA } from "$lib/store";
  import SEO from "$lib/components/SEO.svelte";
  import MarketMover from "$lib/components/Dashboard/MarketMover.svelte";
  import UpcomingEarnings from "$lib/components/Dashboard/UpcomingEarnings.svelte";
  import OptionsFlow from "$lib/components/Dashboard/OptionsFlow.svelte";
  import MarketNews from "$lib/components/Dashboard/MarketNews.svelte";
  import AnalystReport from "$lib/components/Dashboard/AnalystReport.svelte";
  import AIAgent from "$lib/components/Dashboard/AIAgent.svelte";
  import MiniPlot from "$lib/components/MiniPlot.svelte";

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
  title="Advanced Stock Analysis & Financial Data Platform"
  description="Free advanced stock analysis, AI-powered forecasting, options flow tracking, and comprehensive financial data for all US stocks. Get real-time insights for TSLA, NVDA, AAPL and thousands more with Stocknear's powerful analysis tools."
  keywords="stocknear, stock analysis, stock forecast, tsla forecast, nvda analysis, options flow, earnings analysis, financial data, stock screener, market analysis, AI stock predictions, dark pool data, insider trading, congress trading"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Stocknear",
    description:
      "Advanced stock analysis and financial data platform with AI-powered insights",
    url: "https://stocknear.com",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Real-time stock analysis",
      "AI-powered forecasting",
      "Options flow tracking",
      "Financial data analysis",
      "Dark pool monitoring",
      "Earnings analysis",
      "Market insights",
    ],
    provider: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
  }}
/>

<div class="w-full max-w-8xl overflow-hidden m-auto min-h-screen mb-16">
  {#if AppInstalled && !$closedPWA}
    <svelte:component this={AppInstalled} />
  {/if}

  <!--
  {#if !["Pro", "Plus"].includes(data?.user?.tier)}
    <div class="flex justify-center mb-5 text-center mt-5 sm:mt-0 px-4">
      <a
        href="/pricing"
        class="group relative cursor-pointer flex items-center gap-3 px-5 py-3 text-sm font-medium rounded-xl
               bg-gradient-to-r from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-800
               border border-gray-200 dark:border-zinc-700/50
               shadow-sm hover:shadow-md dark:shadow-none
               transition-all duration-300"
        tabindex="0"
      >
        <div
          class="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"
        ></div>
        <span class="flex items-center gap-1.5">
          <span class="relative flex h-1.5 w-1.5">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"
            ></span>
            <span
              class="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-500"
            ></span>
          </span>
          <span
            class="text-violet-600 dark:text-violet-400 font-semibold tracking-wide"
            >Christmas Deal</span
          >
        </span>
        <span class="text-gray-400 dark:text-zinc-600">|</span>
        <span class="text-gray-600 dark:text-zinc-300">
          <span class="font-bold text-gray-900 dark:text-white">40% off</span> all
          plans
        </span>
        <span class="text-gray-400 dark:text-zinc-600">|</span>
        <span
          class="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 tracking-wider"
          >XMAS25</span
        >
        <svg
          class="w-4 h-4 text-gray-400 dark:text-zinc-500 group-hover:translate-x-0.5 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          ></path>
        </svg>
      </a>
    </div>
  {/if}
-->
  <main id="main">
    <div
      class="border-b border-gray-100 dark:border-gray-800 rounded-[5px] px-4 bg-gray-100 dark:bg-[#1C1E22] pt-8 sm:pt-12 shadow-sm pb-26 landscape:border-t-2 landscape:md:border-t-0"
    >
      <!--
      {#if data?.user}
        <div class="flex justify-center mb-5 whitespace-nowrap">
          <div class=" flex justify-center lg:mb-3">
            <a href="/unusual-order-flow"
              ><div
                class="flex items-center justify-center sm:hover:text-muted dark:sm:hover:text-white text-blue-800 dark:text-blue-400"
              >
                <div class="text-lg sm:text-xl font-semibold">
                  Unusual Order Flow
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
      {/if}
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

        <div class="mx-auto max-w-[95%] md:max-w-[85%] mt-5">
          <AIAgent {data} {form} randomChats={data?.randomChats || []} />
        </div>
      </div>
    </div>

    <div>
      <div class="mb-4 flex justify-center">
        <div
          class="-mt-12 grid max-w-[90%] grid-cols-2 gap-x-10 md:-mt-10 sm:grid-cols-4 xl:-mt-12 xl:max-w-[80%]"
        >
          <MiniPlot />
          {#each data?.selectedCards?.slice(0, 4) as card}
            <a
              href={card.href}
              class="border border-gray-300 dark:border-gray-600 flex flex-col justify-center items-center p-4 bg-white dark:bg-secondary rounded-[5px] shadow font-semibold gap-2 hover:shadow-lg text-center dark:hover:shadow-dark-600 dark:hover:shadow"
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
        <MarketNews {wiim} />

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

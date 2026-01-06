<script lang="ts">
  import { page } from "$app/stores";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import { industryList } from "$lib/utils";
  import ArrowLogo from "lucide-svelte/icons/move-up-right";

  export let data;

  function formatFilename(industryName) {
    let formattedName = industryName
      ?.replace(/ /g, "-")
      .replace(/&/g, "and")
      .replace(/-{2,}/g, "-")
      .toLowerCase();
    return formattedName;
  }

  let navigationIndustry = industryList.map((industry) => ({
    title: industry,
    link: `/list/industry/${formatFilename(industry)}`,
  }));

  let navigation = [
    {
      title: "Stock Lists",
      link: "/list",
    },
    {
      title: "Mega-Cap Stocks",
      link: "/list/market-cap/mega-cap-stocks",
    },
    {
      title: "Large-Cap Stocks",
      link: "/list/market-cap/large-cap-stocks",
    },
    {
      title: "Mid-Cap Stocks",
      link: "/list/market-cap/mid-cap-stocks",
    },
    {
      title: "Small-Cap Stocks",
      link: "/list/market-cap/small-cap-stocks",
    },
    {
      title: "Micro-Cap Stocks",
      link: "/list/market-cap/micro-cap-stocks",
    },
    {
      title: "Nano-Cap Stocks",
      link: "/list/market-cap/nano-cap-stocks",
    },
    {
      title: "All Stocks Listed on the NASDAQ",
      link: "/list/exchange/nasdaq",
    },
    {
      title: "All Stocks Listed on the NYSE",
      link: "/list/exchange/nyse",
    },
    {
      title: "All Stocks Listed on AMEX",
      link: "/list/exchange/amex",
    },
    {
      title: "Dow Jones Industrial Average Stocks List",
      link: "/list/index/dowjones",
    },
    {
      title: "NASDAQ 100 Index Stocks List",
      link: "/list/index/nasdaq100",
    },
    {
      title: "S&P 500 Index Stocks List",
      link: "/list/index/sp500",
    },
    {
      title: "German Companies on the US Stock Market",
      link: "/list/country/de",
    },
    {
      title: "Canadian Companies on the US Stock Market",
      link: "/list/country/ca",
    },
    {
      title: "Chinese Companies on the US Stock Market",
      link: "/list/cn",
    },
    {
      title: "Indian Companies on the US Stock Market",
      link: "/list/country/in",
    },
    {
      title: "Israeli Companies on the US Stock Market",
      link: "/list/country/il",
    },
    {
      title: "UK Companies on the US Stock Market",
      link: "/list/country/gb",
    },
    {
      title: "Japanese Companies on the US Stock Market",
      link: "/list/country/jp",
    },
    {
      title: "Financials Sector Stocks",
      link: "/list/sector/financial",
    },
    {
      title: "Healthcare Sector Stocks",
      link: "/list/sector/healthcare",
    },
    {
      title: "Technology Sector Stocks",
      link: "/list/sector/technology",
    },
    {
      title: "Industrials Sector Stocks",
      link: "/list/sector/industrials",
    },
    {
      title: "Energy Sector Stocks",
      link: "/list/sector/energy",
    },
    {
      title: "Utilities Sector Stocks",
      link: "/list/sector/utilities",
    },
    {
      title: "Consumer Cyclical Sector Stocks",
      link: "/list/sector/consumer-cyclical",
    },
    {
      title: "Real Estate Sector Stocks",
      link: "/list/sector/real-estate",
    },
    {
      title: "Basic Materials Sector Stocks",
      link: "/list/sector/basic-materials",
    },
    {
      title: "Communication Services Sector Stocks",
      link: "/list/sector/communication-services",
    },
    {
      title: "Consumer Defensive Sector Stocks",
      link: "/list/sector/consumer-defensive",
    },

    {
      title: "Bitcoin ETFs",
      link: "/list/bitcoin-etfs",
    },
    {
      title: "Magnificent Seven Stocks",
      link: "/list/magnificent-seven",
    },
    {
      title: "Dividend Kings",
      link: "/list/dividend/dividend-kings",
    },
    {
      title: "Dividend Aristocrats",
      link: "/list/dividend/dividend-aristocrats",
    },
    {
      title: "All Active REITs on the US Stock Market",
      link: "/list/reit-stocks",
    },
    {
      title: "FAANG Companies",
      link: "/list/faang",
    },
    {
      title: "Actively Traded Penny Stocks",
      link: "/list/penny-stocks",
    },
    {
      title: "Oversold Stocks",
      link: "/list/oversold-stocks",
    },
    {
      title: "Overbought Stocks",
      link: "/list/overbought-stocks",
    },
    {
      title: "Top-Rated Dividend Stocks",
      link: "/list/top-rated-dividend-stocks",
    },
    {
      title: "Biggest U.S. Companies by Revenue",
      link: "/list/highest-revenue",
    },
    {
      title: "Biggest U.S. Companies by Income Taxes",
      link: "/list/highest-income-tax",
    },
    {
      title: "Biggest U.S. Employers",
      link: "/list/most-employees",
    },
    {
      title: "Biggest Companies with Failed-to-Deliver Shares",
      link: "/list/most-ftd-shares",
    },
    {
      title: "Most Shorted Stocks",
      link: "/list/most-shorted-stocks",
    },
    {
      title: "Highest OI Change",
      link: "/list/highest-open-interest-change",
    },
    {
      title: "Highest OI",
      link: "/list/highest-open-interest",
    },
    {
      title: "Highest IV Rank",
      link: "/list/highest-option-iv-rank",
    },
    {
      title: "Highest Option Premium",
      link: "/list/highest-option-premium",
    },
    {
      title: "Highest Call Volume",
      link: "/list/highest-call-volume",
    },
    {
      title: "Highest Put Volume",
      link: "/list/highest-put-volume",
    },
    {
      title: "Highest Open Interest by Contract",
      link: "/list/highest-open-interest-by-contract",
    },
    {
      title: "Most Active Option Contracts",
      link: "/list/highest-volume-by-contract",
    },
    {
      title: "Biggest Artificial Intelligence Stocks",
      link: "/list/ai-stocks",
    },
    {
      title: "Biggest Mobile Game Stocks",
      link: "/list/mobile-games",
    },
    {
      title: "Biggest Social Media Stocks by Market Cap",
      link: "/list/social-media-stocks",
    },
    {
      title: "Biggest Clean Energy Stocks",
      link: "/list/clean-energy",
    },
    {
      title: "Biggest E-Sports Stocks",
      link: "/list/esports",
    },
    {
      title: "Biggest Car Company Stocks",
      link: "/list/car-company-stocks",
    },
    {
      title: "Biggest Electric Vehicle Stocks",
      link: "/list/electric-vehicles",
    },
    {
      title: "Biggest Augmented Reality Stocks",
      link: "/list/augmented-reality",
    },
    {
      title: "Biggest Gaming Stocks by Market Cap",
      link: "/list/gaming-stocks",
    },
    {
      title: "Biggest Pharmaceutical Stocks",
      link: "/list/pharmaceutical-stocks",
    },
    {
      title: "Biggest Online Dating Stocks",
      link: "/list/online-dating",
    },
    {
      title: "Biggest Virtual Reality Stocks",
      link: "/list/virtual-reality",
    },
    {
      title: "Biggest Sports Betting Stocks",
      link: "/list/sports-betting",
    },
    {
      title: "Biggest Metaverse Stocks",
      link: "/list/metaverse",
    },
    {
      title: "Biggest Online Gambling Stocks",
      link: "/list/online-gambling",
    },
    {
      title: "Biggest U.S. Companies with Highest Buybacks",
      link: "/list/most-buybacks",
    },
    {
      title: "Stocks That Pay Monthly Dividends",
      link: "/list/monthly-dividend-stocks",
    },
    {
      title: "All Active SPACs on the US Stock Market",
      link: "/list/spacs-stocks",
    },
    {
      title: "Ethereum ETFs List",
      link: "/list/ethereum-etfs",
    },
    {
      title: "Monthly Dividend ETFs List",
      link: "/list/monthly-dividend-etfs",
    },
    {
      title: "Crypto ETFs List",
      link: "/list/crypto-etfs",
    },
    {
      title: "Covered Call ETFs",
      link: "/list/covered-call-etfs",
    },
  ];

  navigation = [...navigationIndustry, ...navigation];
  let updatedNavigation = navigation?.map((item) => {
    return {
      ...item,
      link: item.link + "/",
    };
  });

  const combinedNavigation = navigation?.concat(updatedNavigation);
</script>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-6 px-4 lg:px-6 text-gray-700 dark:text-zinc-200"
>
  <BreadCrumb
    containerClass="text-xs sm:text-sm breadcrumbs text-gray-800 dark:text-zinc-300"
  >
    <li>
      <a
        href="/"
        class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
        >Home</a
      >
    </li>
    {#if $page.url.pathname.startsWith("/list/industry")}
      <li>
        <a
          href="/industry"
          class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          >Industry</a
        >
      </li>
    {:else}
      <li>
        <a
          href="/list/"
          class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          >Lists</a
        >
      </li>
    {/if}
    {#if $page.url.pathname.startsWith("/list/")}
      <li>
        <span class="text-gray-800 dark:text-zinc-300">
          {combinedNavigation?.find(
            (item) => item?.link === $page.url.pathname,
          )?.title}
        </span>
      </li>
    {/if}
  </BreadCrumb>

  <div class="mt-10 sm:mt-5 w-full m-auto mb-10 overflow-hidden">
    <!--Start Top Winners/Losers-->
    <div class="flex flex-col justify-center items-center">
      <div class="ml-2 text-start w-full mb-2">
        {#each navigation as item}
          {#if item?.link === $page.url.pathname}
            <h1
              class="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              {item?.title}
            </h1>
          {/if}
        {/each}
      </div>

      <div class="border-b border-gray-300 dark:border-zinc-700 w-full" />
      <div
        class="relative flex flex-col lg:flex-row justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:w-3/4 lg:pr-10">
          <slot />
        </main>

        <aside class="inline-block relative w-full lg:w-1/4 mt-3">
          {#if !["Pro", "Plus"]?.includes(data?.user?.tier)}
            <div
              class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
            >
              <a
                href="/pricing"
                class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
              >
                <div class="w-full flex justify-between items-center p-3 mt-3">
                  <h2 class="text-start text-lg font-semibold ml-3">
                    Pro Subscription
                  </h2>
                  <ArrowLogo
                    class="w-6 h-6 mr-3 shrink-0 text-gray-800 dark:text-zinc-300 group-hover:text-violet-500 transition"
                  />
                </div>
                <span
                  class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
                >
                  Upgrade now for unlimited access to all data, tools and no
                  ads.
                </span>
              </a>
            </div>
          {/if}

          <div
            class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
          >
            <a
              href={"/watchlist/stocks"}
              class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-lg font-semibold ml-3">Watchlist</h2>
                <ArrowLogo
                  class="w-6 h-6 mr-3 shrink-0 text-gray-800 dark:text-zinc-300 group-hover:text-violet-500 transition"
                />
              </div>
              <span
                class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
              >
                Build your watchlist to keep track of their performance.
              </span>
            </a>
          </div>

          <div
            class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
          >
            <a
              href={"/stock-screener"}
              class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-lg font-semibold ml-3">
                  Stock Screener
                </h2>
                <ArrowLogo
                  class="w-6 h-6 mr-3 shrink-0 text-gray-800 dark:text-zinc-300 group-hover:text-violet-500 transition"
                />
              </div>
              <span
                class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
              >
                Build your Stock Screener to find profitable stocks.
              </span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
</section>

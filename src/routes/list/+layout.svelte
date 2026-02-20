<script lang="ts">
  import { page } from "$app/stores";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import { industryList } from "$lib/utils";
  import {
    common_home,
    list_breadcrumb_industry,
    list_breadcrumb_lists,
    list_category_actively_traded_penny_stocks,
    list_category_all_active_spacs,
    list_category_all_stocks_amex,
    list_category_all_stocks_nasdaq,
    list_category_all_stocks_nyse,
    list_category_biggest_ai_stocks,
    list_category_biggest_augmented_reality_stocks,
    list_category_biggest_car_company_stocks,
    list_category_biggest_clean_energy_stocks,
    list_category_biggest_electric_vehicle_stocks,
    list_category_biggest_esports_stocks,
    list_category_biggest_failed_to_deliver,
    list_category_biggest_gaming_stocks_by_market_cap,
    list_category_biggest_metaverse_stocks,
    list_category_biggest_mobile_game_stocks,
    list_category_biggest_online_dating_stocks,
    list_category_biggest_online_gambling_stocks,
    list_category_biggest_pharmaceutical_stocks,
    list_category_biggest_social_media_stocks_by_market_cap,
    list_category_biggest_sports_betting_stocks,
    list_category_biggest_us_buybacks,
    list_category_biggest_us_employers,
    list_category_biggest_us_income_taxes,
    list_category_biggest_us_revenue,
    list_category_biggest_virtual_reality_stocks,
    list_category_bitcoin_etfs,
    list_category_canadian_companies_us,
    list_category_chinese_companies_us,
    list_category_covered_call_etfs,
    list_category_crypto_etfs_list,
    list_category_dividend_aristocrats,
    list_category_dividend_kings,
    list_category_dow_jones_list,
    list_category_faang_companies,
    list_category_german_companies_us,
    list_category_highest_call_volume,
    list_category_highest_iv_rank,
    list_category_highest_oi,
    list_category_highest_oi_change,
    list_category_highest_open_interest_by_contract,
    list_category_highest_option_premium,
    list_category_highest_put_volume,
    list_category_indian_companies_us,
    list_category_israeli_companies_us,
    list_category_japanese_companies_us,
    list_category_large_cap_stocks,
    list_category_mega_cap_stocks,
    list_category_micro_cap_stocks,
    list_category_mid_cap_stocks,
    list_category_magnificent_seven_stocks,
    list_category_most_active_option_contracts,
    list_category_most_shorted_stocks,
    list_category_nano_cap_stocks,
    list_category_nasdaq_100_list,
    list_category_overbought_stocks,
    list_category_oversold_stocks,
    list_category_reits_active,
    list_category_small_cap_stocks,
    list_category_sp500_list,
    list_category_stock_lists,
    list_category_stocks_pay_monthly_dividends,
    list_category_top_rated_dividend_stocks,
    list_category_uk_companies_us,
    list_category_ethereum_etfs_list,
    list_category_monthly_dividend_etfs_list,
    list_category_sector_basic_materials,
    list_category_sector_communication_services,
    list_category_sector_consumer_cyclical,
    list_category_sector_consumer_defensive,
    list_category_sector_energy,
    list_category_sector_financials,
    list_category_sector_healthcare,
    list_category_sector_industrials,
    list_category_sector_real_estate,
    list_category_sector_technology,
    list_category_sector_utilities,
    list_sidebar_pro_title,
    list_sidebar_pro_description,
    list_sidebar_watchlist_title,
    list_sidebar_watchlist_description,
    list_sidebar_screener_title,
    list_sidebar_screener_description,
  } from "$lib/paraglide/messages.js";

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
      title: list_category_stock_lists(),
      link: "/list",
    },
    {
      title: list_category_mega_cap_stocks(),
      link: "/list/market-cap/mega-cap-stocks",
    },
    {
      title: list_category_large_cap_stocks(),
      link: "/list/market-cap/large-cap-stocks",
    },
    {
      title: list_category_mid_cap_stocks(),
      link: "/list/market-cap/mid-cap-stocks",
    },
    {
      title: list_category_small_cap_stocks(),
      link: "/list/market-cap/small-cap-stocks",
    },
    {
      title: list_category_micro_cap_stocks(),
      link: "/list/market-cap/micro-cap-stocks",
    },
    {
      title: list_category_nano_cap_stocks(),
      link: "/list/market-cap/nano-cap-stocks",
    },
    {
      title: list_category_all_stocks_nasdaq(),
      link: "/list/exchange/nasdaq",
    },
    {
      title: list_category_all_stocks_nyse(),
      link: "/list/exchange/nyse",
    },
    {
      title: list_category_all_stocks_amex(),
      link: "/list/exchange/amex",
    },
    {
      title: list_category_dow_jones_list(),
      link: "/list/index/dowjones",
    },
    {
      title: list_category_nasdaq_100_list(),
      link: "/list/index/nasdaq100",
    },
    {
      title: list_category_sp500_list(),
      link: "/list/index/sp500",
    },
    {
      title: list_category_german_companies_us(),
      link: "/list/country/de",
    },
    {
      title: list_category_canadian_companies_us(),
      link: "/list/country/ca",
    },
    {
      title: list_category_chinese_companies_us(),
      link: "/list/cn",
    },
    {
      title: list_category_indian_companies_us(),
      link: "/list/country/in",
    },
    {
      title: list_category_israeli_companies_us(),
      link: "/list/country/il",
    },
    {
      title: list_category_uk_companies_us(),
      link: "/list/country/gb",
    },
    {
      title: list_category_japanese_companies_us(),
      link: "/list/country/jp",
    },
    {
      title: list_category_sector_financials(),
      link: "/list/sector/financial",
    },
    {
      title: list_category_sector_healthcare(),
      link: "/list/sector/healthcare",
    },
    {
      title: list_category_sector_technology(),
      link: "/list/sector/technology",
    },
    {
      title: list_category_sector_industrials(),
      link: "/list/sector/industrials",
    },
    {
      title: list_category_sector_energy(),
      link: "/list/sector/energy",
    },
    {
      title: list_category_sector_utilities(),
      link: "/list/sector/utilities",
    },
    {
      title: list_category_sector_consumer_cyclical(),
      link: "/list/sector/consumer-cyclical",
    },
    {
      title: list_category_sector_real_estate(),
      link: "/list/sector/real-estate",
    },
    {
      title: list_category_sector_basic_materials(),
      link: "/list/sector/basic-materials",
    },
    {
      title: list_category_sector_communication_services(),
      link: "/list/sector/communication-services",
    },
    {
      title: list_category_sector_consumer_defensive(),
      link: "/list/sector/consumer-defensive",
    },

    {
      title: list_category_bitcoin_etfs(),
      link: "/list/bitcoin-etfs",
    },
    {
      title: list_category_magnificent_seven_stocks(),
      link: "/list/magnificent-seven",
    },
    {
      title: list_category_dividend_kings(),
      link: "/list/dividend/dividend-kings",
    },
    {
      title: list_category_dividend_aristocrats(),
      link: "/list/dividend/dividend-aristocrats",
    },
    {
      title: list_category_reits_active(),
      link: "/list/reit-stocks",
    },
    {
      title: list_category_faang_companies(),
      link: "/list/faang",
    },
    {
      title: list_category_actively_traded_penny_stocks(),
      link: "/list/penny-stocks",
    },
    {
      title: list_category_oversold_stocks(),
      link: "/list/oversold-stocks",
    },
    {
      title: list_category_overbought_stocks(),
      link: "/list/overbought-stocks",
    },
    {
      title: list_category_top_rated_dividend_stocks(),
      link: "/list/top-rated-dividend-stocks",
    },
    {
      title: "Dividend Growth Stocks",
      link: "/list/dividend-growth-stocks",
    },
    {
      title: "Safe Dividend Stocks",
      link: "/list/safe-dividend-stocks",
    },
    {
      title: "High Free Cash Flow Yield Stocks",
      link: "/list/high-free-cash-flow-yield-stocks",
    },
    {
      title: "Undervalued Growth Stocks",
      link: "/list/undervalued-growth-stocks",
    },
    {
      title: "Low PE High ROE Stocks",
      link: "/list/low-pe-high-roe-stocks",
    },
    {
      title: "Strong Balance Sheet Stocks",
      link: "/list/strong-balance-sheet-stocks",
    },
    {
      title: "Piotroski 8-9 Stocks",
      link: "/list/piotroski-8-9-stocks",
    },
    {
      title: "Net Cash Stocks",
      link: "/list/net-cash-stocks",
    },
    {
      title: "Earnings Growth Stocks This Month",
      link: "/list/earnings-growth-stocks-this-month",
    },
    {
      title: "High Analyst Upside Stocks",
      link: "/list/high-analyst-upside-stocks",
    },
    {
      title: list_category_biggest_us_revenue(),
      link: "/list/highest-revenue",
    },
    {
      title: list_category_biggest_us_income_taxes(),
      link: "/list/highest-income-tax",
    },
    {
      title: list_category_biggest_us_employers(),
      link: "/list/most-employees",
    },
    {
      title: list_category_biggest_failed_to_deliver(),
      link: "/list/most-ftd-shares",
    },
    {
      title: list_category_most_shorted_stocks(),
      link: "/list/most-shorted-stocks",
    },
    {
      title: list_category_highest_oi_change(),
      link: "/list/highest-open-interest-change",
    },
    {
      title: list_category_highest_oi(),
      link: "/list/highest-open-interest",
    },
    {
      title: list_category_highest_iv_rank(),
      link: "/list/highest-option-iv-rank",
    },
    {
      title: list_category_highest_option_premium(),
      link: "/list/highest-option-premium",
    },
    {
      title: list_category_highest_call_volume(),
      link: "/list/highest-call-volume",
    },
    {
      title: list_category_highest_put_volume(),
      link: "/list/highest-put-volume",
    },
    {
      title: list_category_highest_open_interest_by_contract(),
      link: "/list/highest-open-interest-by-contract",
    },
    {
      title: list_category_most_active_option_contracts(),
      link: "/list/highest-volume-by-contract",
    },
    {
      title: list_category_biggest_ai_stocks(),
      link: "/list/ai-stocks",
    },
    {
      title: list_category_biggest_mobile_game_stocks(),
      link: "/list/mobile-games",
    },
    {
      title: list_category_biggest_social_media_stocks_by_market_cap(),
      link: "/list/social-media-stocks",
    },
    {
      title: list_category_biggest_clean_energy_stocks(),
      link: "/list/clean-energy",
    },
    {
      title: list_category_biggest_esports_stocks(),
      link: "/list/esports",
    },
    {
      title: list_category_biggest_car_company_stocks(),
      link: "/list/car-company-stocks",
    },
    {
      title: list_category_biggest_electric_vehicle_stocks(),
      link: "/list/electric-vehicles",
    },
    {
      title: list_category_biggest_augmented_reality_stocks(),
      link: "/list/augmented-reality",
    },
    {
      title: list_category_biggest_gaming_stocks_by_market_cap(),
      link: "/list/gaming-stocks",
    },
    {
      title: list_category_biggest_pharmaceutical_stocks(),
      link: "/list/pharmaceutical-stocks",
    },
    {
      title: list_category_biggest_online_dating_stocks(),
      link: "/list/online-dating",
    },
    {
      title: list_category_biggest_virtual_reality_stocks(),
      link: "/list/virtual-reality",
    },
    {
      title: list_category_biggest_sports_betting_stocks(),
      link: "/list/sports-betting",
    },
    {
      title: list_category_biggest_metaverse_stocks(),
      link: "/list/metaverse",
    },
    {
      title: list_category_biggest_online_gambling_stocks(),
      link: "/list/online-gambling",
    },
    {
      title: list_category_biggest_us_buybacks(),
      link: "/list/most-buybacks",
    },
    {
      title: list_category_stocks_pay_monthly_dividends(),
      link: "/list/monthly-dividend-stocks",
    },
    {
      title: list_category_all_active_spacs(),
      link: "/list/spacs-stocks",
    },
    {
      title: list_category_ethereum_etfs_list(),
      link: "/list/ethereum-etfs",
    },
    {
      title: list_category_monthly_dividend_etfs_list(),
      link: "/list/monthly-dividend-etfs",
    },
    {
      title: list_category_crypto_etfs_list(),
      link: "/list/crypto-etfs",
    },
    {
      title: list_category_covered_call_etfs(),
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
        >{common_home()}</a
      >
    </li>
    {#if $page.url.pathname.startsWith("/list/industry")}
      <li>
        <a
          href="/industry"
          class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          >{list_breadcrumb_industry()}</a
        >
      </li>
    {:else}
      <li>
        <a
          href="/list/"
          class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          >{list_breadcrumb_lists()}</a
        >
      </li>
    {/if}
    {#if $page.url.pathname.startsWith("/list/")}
      <li>
        <span class="text-gray-800 dark:text-zinc-300">
          {combinedNavigation?.find((item) => item?.link === $page.url.pathname)
            ?.title}
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
                    {list_sidebar_pro_title()}
                  </h2>
                </div>
                <span
                  class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
                >
                  {list_sidebar_pro_description()}
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
                <h2 class="text-start text-lg font-semibold ml-3">
                  {list_sidebar_watchlist_title()}
                </h2>
              </div>
              <span
                class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
              >
                {list_sidebar_watchlist_description()}
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
                  {list_sidebar_screener_title()}
                </h2>
              </div>
              <span
                class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
              >
                {list_sidebar_screener_description()}
              </span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
</section>

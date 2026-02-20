<script>
  import SEO from "$lib/components/SEO.svelte";

  import { convertToSlug } from "$lib/utils";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import {
    common_home,
    sitemap_breadcrumb_aria_label,
    sitemap_financial_terms_heading,
    sitemap_intro,
    sitemap_learning_center_heading,
    sitemap_pages_heading,
    sitemap_seo_description,
    sitemap_seo_title,
    sitemap_section_aria_label,
    sitemap_sidebar_pro_desc,
    sitemap_sidebar_pro_title,
    sitemap_sidebar_screener_desc,
    sitemap_sidebar_screener_title,
    sitemap_sidebar_watchlists_desc,
    sitemap_sidebar_watchlists_title,
    sitemap_tab_about,
    sitemap_tab_advertise_with_us,
    sitemap_tab_ai_agent,
    sitemap_tab_afterhours_stock_gainers,
    sitemap_tab_afterhours_stock_losers,
    sitemap_tab_contact_us,
    sitemap_tab_dark_pool_flow,
    sitemap_tab_data_disclaimer,
    sitemap_tab_dividends,
    sitemap_tab_earnings,
    sitemap_tab_economic_events,
    sitemap_tab_etf_provider,
    sitemap_tab_etfs,
    sitemap_tab_faq,
    sitemap_tab_free_newsletter,
    sitemap_tab_highest_iv_rank,
    sitemap_tab_highest_open_interest,
    sitemap_tab_highest_open_interest_change,
    sitemap_tab_highest_option_premium,
    sitemap_tab_imprint,
    sitemap_tab_institutional_portfolio,
    sitemap_tab_insider_tracker,
    sitemap_tab_market_flow,
    sitemap_tab_market_heatmap,
    sitemap_tab_market_news,
    sitemap_tab_most_active_stocks,
    sitemap_tab_options_calculator,
    sitemap_tab_options_flow,
    sitemap_tab_potus_tracker,
    sitemap_tab_premarket_stock_gainers,
    sitemap_tab_premarket_stock_losers,
    sitemap_tab_price_alerts,
    sitemap_tab_pricing,
    sitemap_tab_privacy_policy,
    sitemap_tab_stock_lists,
    sitemap_tab_stock_screener,
    sitemap_tab_stocks,
    sitemap_tab_terms_of_use,
    sitemap_tab_top_analyst_stock_picks,
    sitemap_tab_top_stock_gainers,
    sitemap_tab_top_stock_losers,
    sitemap_tab_top_wallstreet_analysts,
    sitemap_tab_us_senate_portfolio,
    sitemap_tab_watchlist,
    sitemap_title,
    sitemap_visit_page_title,
  } from "$lib/paraglide/messages.js";

  export let data;
  const tabs = [
    {
      title: sitemap_tab_ai_agent(),
      link: "/chat",
    },
    {
      title: sitemap_tab_stocks(),
      link: "/stocks",
    },
    {
      title: sitemap_tab_etfs(),
      link: "/etf",
    },
    {
      title: sitemap_tab_etf_provider(),
      link: "/etf/etf-providers",
    },
    {
      title: sitemap_tab_options_flow(),
      link: "/options-flow",
    },
    {
      title: sitemap_tab_market_flow(),
      link: "/market-flow",
    },
    {
      title: sitemap_tab_dark_pool_flow(),
      link: "/unusual-order-flow",
    },
    {
      title: sitemap_tab_earnings(),
      link: "/earnings-calendar",
    },
    {
      title: sitemap_tab_dividends(),
      link: "/dividends-calendar",
    },
    {
      title: sitemap_tab_economic_events(),
      link: "/economic-calendar",
    },
    {
      title: sitemap_tab_market_news(),
      link: "/market-news",
    },
    {
      title: sitemap_tab_us_senate_portfolio(),
      link: "/politicians",
    },
    {
      title: sitemap_tab_institutional_portfolio(),
      link: "/hedge-funds",
    },
    {
      title: sitemap_tab_highest_open_interest(),
      link: "/list/highest-open-interest-change",
    },
    {
      title: sitemap_tab_highest_open_interest_change(),
      link: "/list/highest-open-interest",
    },
    {
      title: sitemap_tab_highest_iv_rank(),
      link: "/list/highest-option-iv-rank",
    },
    {
      title: sitemap_tab_highest_option_premium(),
      link: "/list/highest-option-premium",
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
      title: sitemap_tab_insider_tracker(),
      link: "/insider-tracker",
    },
    {
      title: sitemap_tab_potus_tracker(),
      link: "/potus-tracker",
    },
    {
      title: sitemap_tab_options_calculator(),
      link: "/options-calculator",
    },
    {
      title: sitemap_tab_top_stock_gainers(),
      link: "/market-mover/gainers",
    },
    {
      title: sitemap_tab_top_stock_losers(),
      link: "/market-mover/losers",
    },
    {
      title: sitemap_tab_most_active_stocks(),
      link: "/market-mover/active",
    },
    {
      title: sitemap_tab_premarket_stock_gainers(),
      link: "/market-mover/premarket/gainers",
    },
    {
      title: sitemap_tab_premarket_stock_losers(),
      link: "/market-mover/premarket/losers",
    },
    {
      title: sitemap_tab_afterhours_stock_gainers(),
      link: "/market-mover/afterhours/gainers",
    },
    {
      title: sitemap_tab_afterhours_stock_losers(),
      link: "/market-mover/afterhours/losers",
    },
    {
      title: sitemap_tab_watchlist(),
      link: "/watchlist/stocks",
    },
    {
      title: sitemap_tab_top_analyst_stock_picks(),
      link: "/analysts/top-stocks",
    },
    {
      title: sitemap_tab_top_wallstreet_analysts(),
      link: "/analysts",
    },
    {
      title: sitemap_tab_stock_screener(),
      link: "/stock-screener",
    },
    {
      title: sitemap_tab_market_heatmap(),
      link: "/heatmap",
    },
    {
      title: sitemap_tab_stock_lists(),
      link: "/list",
    },
    {
      title: sitemap_tab_price_alerts(),
      link: "/price-alert",
    },
    {
      title: sitemap_tab_about(),
      link: "/about",
    },
    {
      title: sitemap_tab_contact_us(),
      link: "/contact",
    },
    {
      title: sitemap_tab_terms_of_use(),
      link: "/terms-of-use",
    },
    {
      title: sitemap_tab_imprint(),
      link: "/imprint",
    },
    {
      title: sitemap_tab_privacy_policy(),
      link: "/privacy-policy",
    },
    {
      title: sitemap_tab_pricing(),
      link: "/pricing",
    },
    {
      title: sitemap_tab_free_newsletter(),
      link: "/newsletter",
    },
    {
      title: sitemap_tab_data_disclaimer(),
      link: "/data-disclaimer",
    },
    {
      title: sitemap_tab_faq(),
      link: "/faq",
    },
    {
      title: sitemap_tab_advertise_with_us(),
      link: "/advertise",
    },
  ];
</script>

<SEO
  title={sitemap_seo_title()}
  description={sitemap_seo_description()}
/>

<main class="text-gray-700 dark:text-zinc-200">
  <section
    class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-6 px-4 lg:px-6"
    aria-label={sitemap_section_aria_label()}
  >
    <BreadCrumb
      tag="nav"
      ariaLabel={sitemap_breadcrumb_aria_label()}
      containerClass="text-xs sm:text-sm breadcrumbs text-gray-800 dark:text-zinc-300"
    >
      <li>
        <a
          href="/"
          class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          >{common_home()}</a
        >
      </li>
      <li class="text-gray-800 dark:text-zinc-300" aria-current="page">
        {sitemap_title()}
      </li>
    </BreadCrumb>

    <div class="w-full overflow-hidden m-auto mt-5">
      <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
        <div
          class="relative flex justify-center items-start overflow-hidden w-full"
        >
          <article class="w-full lg:w-3/4 lg:pr-10">
            <div class="mb-6 border-b border-gray-300 dark:border-zinc-700">
              <h1
                class="mb-2 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
              >
                {sitemap_title()}
              </h1>
            </div>

            <div class=" w-full m-auto">
              <div class="content">
                <p
                  class="text-sm sm:text-base text-gray-800 dark:text-zinc-300"
                >
                  {sitemap_intro()}
                </p>
                <h2
                  class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-5"
                >
                  {sitemap_pages_heading()}
                </h2>
                <nav aria-label={sitemap_pages_heading()}>
                  <ul
                    class="list-outside list-disc space-y-1 p-1 pl-6 text-sm sm:text-base text-gray-800 dark:text-zinc-300"
                  >
                    {#each tabs as item}
                      <li>
                        <a
                          class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                          href={item?.link}
                          title={sitemap_visit_page_title({
                            title: item?.title,
                          })}>{item?.title}</a
                        >
                      </li>
                    {/each}
                  </ul>
                </nav>

                <h2
                  class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-5"
                >
                  {sitemap_learning_center_heading()}
                </h2>
                <nav aria-label={sitemap_learning_center_heading()}>
                  <ul
                    class="list-outside list-disc space-y-1 p-1 pl-6 text-sm sm:text-base text-gray-800 dark:text-zinc-300"
                  >
                    {#each data?.getTutorialPost?.slice(0, 15) as item}
                      <li>
                        <a
                          href={"/learning-center/article/" +
                            convertToSlug(item?.title)}
                          class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                          title={sitemap_visit_page_title({
                            title: item?.title,
                          })}>{item?.title}</a
                        >
                      </li>
                    {/each}
                  </ul>
                </nav>

                <h2
                  class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-5"
                >
                  {sitemap_financial_terms_heading()}
                </h2>
                <nav aria-label={sitemap_financial_terms_heading()}>
                  <ul
                    class="list-outside list-disc space-y-1 p-1 pl-6 text-sm sm:text-base text-gray-800 dark:text-zinc-300"
                  >
                    {#each data?.getTerms as item}
                      <li>
                        <a
                          href={"/learning-center/article/" + convertToSlug(item?.title)}
                          class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                          title={sitemap_visit_page_title({
                            title: item?.title,
                          })}
                        >
                          {item?.title}
                        </a>
                      </li>
                    {/each}
                  </ul>
                </nav>
              </div>
            </div>
          </article>

          <aside class="hidden lg:block relative fixed w-1/4 mt-4">
            <div
              class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
            >
              <a
                href="/pricing"
                class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
              >
                <div class="w-full flex justify-between items-center p-3 mt-3">
                  <h2 class="text-start text-lg font-semibold ml-3">
                    {sitemap_sidebar_pro_title()}
                  </h2>
                </div>
                <span
                  class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
                >
                  {sitemap_sidebar_pro_desc()}
                </span>
              </a>
            </div>

            <div
              class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
            >
              <a
                href="/stock-screener"
                class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
              >
                <div class="w-full flex justify-between items-center p-3 mt-3">
                  <h2 class="text-start text-lg font-semibold ml-3">
                    {sitemap_sidebar_screener_title()}
                  </h2>
                </div>
                <span
                  class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
                >
                  {sitemap_sidebar_screener_desc()}
                </span>
              </a>
            </div>

            <div
              class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
            >
              <a
                href="/watchlist/stocks"
                class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
              >
                <div class="w-full flex justify-between items-center p-3 mt-3">
                  <h2 class="text-start text-lg font-semibold ml-3">
                    {sitemap_sidebar_watchlists_title()}
                  </h2>
                </div>
                <span
                  class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
                  >{sitemap_sidebar_watchlists_desc()}
                </span>
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  </section>
</main>

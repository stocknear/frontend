<script>
  import SEO from "$lib/components/SEO.svelte";
  import ArrowLogo from "lucide-svelte/icons/move-up-right";
  import { convertToSlug } from "$lib/utils";

  export let data;
  const tabs = [
    {
      title: "AI Agent",
      link: "/chat",
    },
    {
      title: "Stocks",
      link: "/stocks",
    },
    {
      title: "ETFs",
      link: "/etf",
    },
    {
      title: "ETF Provider",
      link: "/etf/etf-providers",
    },
    {
      title: "Options Flow",
      link: "/options-flow",
    },
    {
      title: "Market Flow",
      link: "/market-flow",
    },
    {
      title: "Dark Pool Flow",
      link: "/dark-pool-flow",
    },
    {
      title: "Earnings",
      link: "/earnings-calendar",
    },
    {
      title: "Dividends",
      link: "/dividends-calendar",
    },
    {
      title: "Economic Events",
      link: "/economic-calendar",
    },
    {
      title: "Market News",
      link: "/market-news",
    },
    {
      title: "U.S. Senate Portfolio",
      link: "/politicians",
    },
    {
      title: "Instituitonal Portfolio",
      link: "/hedge-funds",
    },
    {
      title: "Highest Open Interest",
      link: "/list/highest-open-interest-change",
    },
    {
      title: "Highest Open Interest Change",
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
      title: "Insider Tracker",
      link: "/insider-tracker",
    },
    {
      title: "POTUS Tracker",
      link: "/potus-tracker",
    },
    {
      title: "Options Calculator",
      link: "/options-calculator",
    },
    {
      title: "Top Stock Gainers",
      link: "/market-mover/gainers",
    },
    {
      title: "Top Stock Losers",
      link: "/market-mover/losers",
    },
    {
      title: "Most Active Stocks",
      link: "/market-mover/active",
    },
    {
      title: "Premarket Stock Gainers",
      link: "/market-mover/premarket/gainers",
    },
    {
      title: "Premarket Stock Losers",
      link: "/market-mover/premarket/losers",
    },
    {
      title: "Afterhours Stock Gainers",
      link: "/market-mover/afterhours/gainers",
    },
    {
      title: "Afterhours Stock Losers",
      link: "/market-mover/afterhours/losers",
    },
    {
      title: "Watchlist",
      link: "/watchlist/stocks",
    },
    {
      title: "Top Analyst Stocks Picks",
      link: "/analysts/top-stocks",
    },
    {
      title: "Top Wallstreet Analysts",
      link: "/analysts",
    },
    {
      title: "Stock Screener",
      link: "/stock-screener",
    },
    {
      title: "Market Heatmap",
      link: "/heatmap",
    },
    {
      title: "Stock Lists",
      link: "/list",
    },
    {
      title: "Price Alerts",
      link: "/price-alert",
    },
    {
      title: "About",
      link: "/about",
    },
    {
      title: "Contact Us",
      link: "/contact",
    },
    {
      title: "Terms of Use",
      link: "/terms-of-use",
    },
    {
      title: "Imprint",
      link: "/imprint",
    },
    {
      title: "Privacy Policy",
      link: "/privacy-policy",
    },
    {
      title: "Pricing",
      link: "/pricing",
    },
    {
      title: "Free Newsletter",
      link: "/newsletter",
    },
    {
      title: "Blog",
      link: "/blog",
    },
    {
      title: "Data Disclaimer",
      link: "/data-disclaimer",
    },
    {
      title: "FAQ",
      link: "/faq",
    },
    {
      title: "Advertise with Us",
      link: "/advertise",
    },
  ];
</script>

<SEO
  title="Sitemap | Complete Financial Market Directory"
  description="Navigate through Stocknear's complete collection of financial tools and market analysis resources. Access real-time stock data, ETFs, options flow, and more."
/>

<main class="text-muted dark:text-white">
  <section
    class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3"
    aria-label="Sitemap Navigation"
  >
    <nav class="text-sm sm:text-[1rem] breadcrumbs" aria-label="Breadcrumb">
      <ul>
        <li><a href="/" class="text-muted dark:text-gray-300">Home</a></li>
        <li class="text-muted dark:text-gray-300" aria-current="page">
          Sitemap
        </li>
      </ul>
    </nav>

    <div class="w-full overflow-hidden m-auto mt-5">
      <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
        <div
          class="relative flex justify-center items-start overflow-hidden w-full"
        >
          <article class="w-full lg:w-3/4 lg:pr-10">
            <div class="mb-6 border-[#2C6288] dark:border-white border-b-[2px]">
              <h1 class="mb-1 text-2xl sm:text-3xl font-bold">Sitemap</h1>
            </div>

            <div class=" w-full m-auto">
              <div class="content">
                <p class="text-[1rem] sm:text-lg">
                  Explore a comprehensive list of Stocknear's financial tools
                  and resources. Find real-time stock data, market analysis,
                  ETFs, options flow, and more. Use our search bar for quick
                  access to specific stock symbols.
                </p>
                <h2 class=" text-xl sm:text-2xl font-bold mt-8 mb-5">Pages</h2>
                <nav aria-label="Site Pages">
                  <ul
                    class="list-outside list-disc space-y-1 p-1 pl-6 md:gap-x-8 md:text-lg"
                  >
                    {#each tabs as item}
                      <li>
                        <a
                          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white sm:hover:underline sm:hover:underline-offset-4"
                          href={item?.link}
                          title={`Visit ${item?.title} page`}>{item?.title}</a
                        >
                      </li>
                    {/each}
                  </ul>
                </nav>

                <h2 class=" text-xl sm:text-2xl font-bold mt-8 mb-5">
                  Articles
                </h2>
                <nav aria-label="Site Pages">
                  <ul
                    class="list-outside list-disc space-y-1 p-1 pl-6 md:gap-x-8 md:text-lg"
                  >
                    {#each data?.getBlogPosts?.slice(0, 15) as item}
                      {#if ["blog", "pre-earnings"]?.includes(item?.category)}
                        <li>
                          <a
                            href={"/blog/article/" + convertToSlug(item?.title)}
                            class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white sm:hover:underline sm:hover:underline-offset-4"
                            title={`Visit ${item?.title} page`}>{item?.title}</a
                          >
                        </li>
                      {/if}
                    {/each}
                  </ul>
                </nav>

                <h2 class=" text-xl sm:text-2xl font-bold mt-8 mb-5">
                  Learning Center
                </h2>
                <nav aria-label="Site Pages">
                  <ul
                    class="list-outside list-disc space-y-1 p-1 pl-6 md:gap-x-8 md:text-lg"
                  >
                    {#each data?.getTutorialPost?.slice(0, 15) as item}
                      <li>
                        <a
                          href={"/learning-center/article/" +
                            convertToSlug(item?.title)}
                          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white sm:hover:underline sm:hover:underline-offset-4"
                          title={`Visit ${item?.title} page`}>{item?.title}</a
                        >
                      </li>
                    {/each}
                  </ul>
                </nav>

                <h2 class=" text-xl sm:text-2xl font-bold mt-8 mb-5">
                  Financial terms
                </h2>
                <nav aria-label="Site Pages">
                  <ul
                    class="list-outside list-disc space-y-1 p-1 pl-6 md:gap-x-8 md:text-lg"
                  >
                    {#each data?.getBlogPosts
                      ?.filter((item) => item?.category === "term")
                      ?.sort( (a, b) => a?.title?.localeCompare(b?.title), ) as item}
                      <li>
                        <a
                          href={"/blog/article/" + convertToSlug(item?.title)}
                          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white sm:hover:underline sm:hover:underline-offset-4"
                          title={`Visit ${item?.title} page`}
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
              class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
            >
              <a
                href="/pricing"
                class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
              >
                <div class="w-full flex justify-between items-center p-3 mt-3">
                  <h2 class="text-start text-xl font-bold ml-3">
                    Pro Subscription
                  </h2>
                  <ArrowLogo
                    class="w-8 h-8 mr-3 shrink-0 text-gray-400 dark:text-white"
                  />
                </div>
                <span class=" p-3 ml-3 mr-3">
                  Upgrade now for unlimited access to all data, tools and no
                  ads.
                </span>
              </a>
            </div>

            <div
              class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
            >
              <a
                href="/stock-screener"
                class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
              >
                <div class="w-full flex justify-between items-center p-3 mt-3">
                  <h2 class="text-start text-xl font-bold ml-3">
                    Stock Screener
                  </h2>
                  <ArrowLogo
                    class="w-8 h-8 mr-3 shrink-0 text-gray-400 dark:text-white"
                  />
                </div>
                <span class=" p-3 ml-3 mr-3">
                  Filter, sort and analyze all stocks to find your next
                  investment.
                </span>
              </a>
            </div>

            <div
              class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
            >
              <a
                href="/watchlist/stocks"
                class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
              >
                <div class="w-full flex justify-between items-center p-3 mt-3">
                  <h2 class="text-start text-xl font-bold ml-3">Watchlists</h2>
                  <ArrowLogo
                    class="w-8 h-8 mr-3 shrink-0 text-gray-400 dark:text-white"
                  />
                </div>
                <span class=" p-3 ml-3 mr-3"
                  >Keep track of your favorite stocks in real-time.
                </span>
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  </section>
</main>

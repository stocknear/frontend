<script>
  import ArrowLogo from "lucide-svelte/icons/move-up-right";
  import SEO from "$lib/components/SEO.svelte";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  export let data;

  function handleCopyPrompt(text) {
    const content = text;

    if (!content) return;

    navigator.clipboard
      ?.writeText(content)
      ?.then(() => {
        toast?.success("Copied!", {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        });
      })
      ?.catch((err) => {
        toast?.error("Failed to copy prompt", {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        });
      });
  }
</script>

<SEO
  title="AI Agents Guide - Smart Financial Analysis with AI Assistants"
  description="Master Stocknear's AI-powered financial agents for advanced stock analysis. Learn to use specialized AI tools for stock screening, analyst insights, dark pool tracking, options flow analysis, and investment research."
  keywords="AI financial agents, stock analysis AI, AI investment tools, automated stock screening, AI analyst insights, dark pool AI analysis, options flow AI, financial AI assistants, smart investing tools"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "AI Agents Guide for Financial Analysis",
    description:
      "Comprehensive guide to using AI agents for stock market analysis and investment research",
    url: "https://stocknear.com/faq/ai-agents",
    author: {
      "@type": "Organization",
      name: "Stocknear",
    },
    publisher: {
      "@type": "Organization",
      name: "Stocknear",
      logo: {
        "@type": "ImageObject",
        url: "https://stocknear.com/pwa-512x512.png",
      },
    },
    about: {
      "@type": "Thing",
      name: "Artificial Intelligence in Finance",
    },
    audience: {
      "@type": "Audience",
      audienceType: "Investors and Traders",
    },
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3 text-muted dark:text-white"
>
  <div class="text-sm sm:text-[1rem] breadcrumbs">
    <ul>
      <li><a href="/" class="text-muted dark:text-gray-300">Home</a></li>
      <li class="text-muted dark:text-gray-300">AI Agents Guide</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:w-3/4 lg:pr-10">
          <div class="mb-4 border-b-2">
            <h1 class="mb-1 text-2xl sm:text-3xl font-bold">AI Agents Guide</h1>
          </div>

          <div class="w-full m-auto">
            <p class="mb-4">
              Stocknear's AI Agents combine large language model intelligence
              with real-time market data to transform financial analysis. These
              specialized tools help retail investors make data-driven decisions
              by providing actionable insights on stocks, options flow, dark
              pool activity, and institutional positioning.
            </p>

            <div>
              <section class="mb-6">
                <h2
                  class="mb-2 text-2xl font-bold text-gray-900 dark:text-white"
                >
                  @StockScreener Agent
                </h2>
                <p class="mb-4">
                  Filters stocks based on custom financial criteria and metrics.
                </p>
                <div class="mb-2">
                  <strong>Requirements:</strong> Define screening rules using financial
                  metrics
                </div>
                <p class="mb-4">Screens stocks using parameters like:</p>
                <ul class="list-disc list-inside mb-3 space-y-1">
                  <li>Valuation ratios (P/E, P/S)</li>
                  <li>Growth metrics (revenue, EPS)</li>
                  <li>Profitability indicators</li>
                  <li>Technical indicators</li>
                </ul>

                <p class="mb-2">Example prompt:</p>
                <div
                  class="mb-4 rounded border-l-4 border-[#2C6288] bg-[#f3f4f6] dark:bg-table/60 px-5 py-3 italic"
                >
                  <div
                    class="flex flex-row items-center justify-between w-full"
                  >
                    <div>
                      @StockScreener find undervalued tech stocks with P/E under
                      20 and revenue growth above 15%
                    </div>
                    <button
                      on:click={() =>
                        handleCopyPrompt(
                          "@StockScreener find undervalued tech stocks with P/E under 20 and revenue growth above 15%",
                        )}
                      class="cursor-pointer text-token-text-secondary hover:bg-token-bg-secondary rounded-lg text-muted dark:text-gray-300 dark:sm:hover:text-white"
                      aria-label="Copy"
                    >
                      <!-- Copy icon SVG remains same -->
                    </button>
                  </div>
                </div>
              </section>

              <section class="mb-6">
                <h2
                  class="mb-2 text-2xl font-bold text-gray-900 dark:text-white"
                >
                  @Analyst Agent
                </h2>
                <div class="mb-2">
                  <strong>Requirements:</strong> Stock ticker (e.g., AMD)
                </div>
                <p class="mb-4">
                  Provides Wall Street analyst perspectives including:
                </p>
                <ul class="list-disc list-inside mb-3 space-y-1">
                  <li>Upgrades/downgrades</li>
                  <li>Price targets</li>
                  <li>EPS estimates</li>
                  <li>Consensus ratings</li>
                </ul>
                <p class="mb-2">Example prompt:</p>
                <div
                  class="mb-4 rounded border-l-4 border-[#2C6288] bg-[#f3f4f6] dark:bg-table/60 px-5 py-3 italic"
                >
                  <div
                    class="flex flex-row items-center justify-between w-full"
                  >
                    <div>
                      @Analyst show recent analyst actions for Nvidia with price
                      targets
                    </div>
                    <button
                      on:click={() =>
                        handleCopyPrompt(
                          "@Analyst show recent analyst actions for Nvidia with price targets",
                        )}
                      class="cursor-pointer text-token-text-secondary hover:bg-token-bg-secondary rounded-lg text-muted dark:text-gray-300 dark:sm:hover:text-white"
                      aria-label="Copy"
                    >
                      <!-- Copy icon SVG -->
                    </button>
                  </div>
                </div>
              </section>

              <!-- Improved sections continue with same pattern -->

              <section class="mb-6">
                <h2
                  class="mb-2 text-2xl font-bold text-gray-900 dark:text-white"
                >
                  @BullvsBear
                </h2>
                <div class="mb-2">
                  <strong>Requirements:</strong> Stock ticker (e.g., AMD)
                </div>
                <p class="mb-4">
                  Generates balanced investment theses by analyzing:
                </p>
                <ul class="list-disc list-inside mb-3 space-y-1">
                  <li>Fundamental strengths/weaknesses</li>
                  <li>Market sentiment indicators</li>
                  <li>Competitive positioning</li>
                  <li>Technical analysis</li>
                </ul>
                <p class="mb-2">Example prompt:</p>
                <div
                  class="mb-4 rounded border-l-4 border-[#2C6288] bg-[#f3f4f6] dark:bg-table/60 px-5 py-3 italic"
                >
                  <div
                    class="flex flex-row items-center justify-between w-full"
                  >
                    <div>
                      @BullvsBear present bull and bear cases for Tesla stock
                    </div>
                    <button
                      on:click={() =>
                        handleCopyPrompt(
                          "@BullvsBear present bull and bear cases for Tesla stock",
                        )}
                      class="cursor-pointer text-token-text-secondary hover:bg-token-bg-secondary rounded-lg text-muted dark:text-gray-300 dark:sm:hover:text-white"
                      aria-label="Copy"
                    >
                      <!-- Copy icon SVG -->
                    </button>
                  </div>
                </div>
              </section>

              <section class="mb-6">
                <h2
                  class="mb-2 text-2xl font-bold text-gray-900 dark:text-white"
                >
                  @CompareStocks
                </h2>
                <div class="mb-2">
                  <strong>Requirements:</strong> 2+ stock tickers (e.g., AMD, INTC)
                </div>
                <p class="mb-4">Compares companies across key dimensions:</p>
                <ul class="list-disc list-inside mb-3 space-y-1">
                  <li>Financial metrics</li>
                  <li>Growth trajectories</li>
                  <li>Valuation multiples</li>
                  <li>Market positioning</li>
                </ul>
                <p class="mb-2">Example prompt:</p>
                <div
                  class="mb-4 rounded border-l-4 border-[#2C6288] bg-[#f3f4f6] dark:bg-table/60 px-5 py-3 italic"
                >
                  <div
                    class="flex flex-row items-center justify-between w-full"
                  >
                    <div>
                      @CompareStocks compare AMD and Intel on financial health
                      and growth prospects
                    </div>
                    <button
                      on:click={() =>
                        handleCopyPrompt(
                          "@CompareStocks compare AMD and Intel on financial health and growth prospects",
                        )}
                      class="cursor-pointer text-token-text-secondary hover:bg-token-bg-secondary rounded-lg text-muted dark:text-gray-300 dark:sm:hover:text-white"
                      aria-label="Copy"
                    >
                      <!-- Copy icon SVG -->
                    </button>
                  </div>
                </div>
              </section>

              <section class="mb-6">
                <h2
                  class="mb-2 text-2xl font-bold text-gray-900 dark:text-white"
                >
                  @DarkPoolData Agent
                </h2>
                <div class="mb-2">
                  <strong>Requirements:</strong> Stock ticker (e.g., AMD)
                </div>
                <p class="mb-4">
                  Reveals institutional dark pool activity including:
                </p>
                <ul class="list-disc list-inside mb-3 space-y-1">
                  <li>Block trade volume</li>
                  <li>Unusual liquidity patterns</li>
                  <li>Historical dark pool trends</li>
                  <li>Institutional positioning</li>
                </ul>
                <p class="mb-2">Example prompt:</p>
                <div
                  class="mb-4 rounded border-l-4 border-[#2C6288] bg-[#f3f6f4] dark:bg-table/60 px-5 py-3 italic"
                >
                  <div
                    class="flex flex-row items-center justify-between w-full"
                  >
                    <div>
                      @DarkPoolData show recent dark pool activity for Apple
                    </div>
                    <button
                      on:click={() =>
                        handleCopyPrompt(
                          "@DarkPoolData show recent dark pool activity for Apple",
                        )}
                      class="cursor-pointer text-token-text-secondary hover:bg-token-bg-secondary rounded-lg text-muted dark:text-gray-300 dark:sm:hover:text-white"
                      aria-label="Copy"
                    >
                      <!-- Copy icon SVG -->
                    </button>
                  </div>
                </div>
              </section>

              <section class="mb-6">
                <h2
                  class="mb-2 text-2xl font-bold text-gray-900 dark:text-white"
                >
                  @FundamentalData Agent
                </h2>
                <div class="mb-2">
                  <strong>Requirements:</strong> Stock ticker (e.g., AMD)
                </div>
                <p class="mb-4">
                  Analyzes SEC filings and financial statements:
                </p>
                <ul class="list-disc list-inside mb-3 space-y-1">
                  <li>Income/balance sheet statements</li>
                  <li>Cash flow analysis</li>
                  <li>Financial ratios</li>
                  <li>Ownership metrics</li>
                </ul>
                <p class="mb-2">Example prompt:</p>
                <div
                  class="mb-4 rounded border-l-4 border-[#2C6288] bg-[#f3f4f6] dark:bg-table/60 px-5 py-3 italic"
                >
                  <div
                    class="flex flex-row items-center justify-between w-full"
                  >
                    <div>
                      @FundamentalData analyze Microsoft's latest balance sheet
                      and cash flow
                    </div>
                    <button
                      on:click={() =>
                        handleCopyPrompt(
                          "@FundamentalData analyze Microsoft's latest balance sheet and cash flow",
                        )}
                      class="cursor-pointer text-token-text-secondary hover:bg-token-bg-secondary rounded-lg text-muted dark:text-gray-300 dark:sm:hover:text-white"
                      aria-label="Copy"
                    >
                      <!-- Copy icon SVG -->
                    </button>
                  </div>
                </div>
              </section>

              <section class="mb-6">
                <h2
                  class="mb-2 text-2xl font-bold text-gray-900 dark:text-white"
                >
                  @OptionsData Agent
                </h2>
                <div class="mb-2">
                  <strong>Requirements:</strong> Stock ticker (e.g., AMD)
                </div>
                <p class="mb-4">Examines options market dynamics including:</p>
                <ul class="list-disc list-inside mb-3 space-y-1">
                  <li>Open interest concentrations</li>
                  <li>Volume anomalies</li>
                  <li>Implied volatility trends</li>
                  <li>Max pain calculations</li>
                </ul>
                <p class="mb-2">Example prompt:</p>
                <div
                  class="mb-4 rounded border-l-4 border-[#2C6288] bg-[#f3f4f6] dark:bg-table/60 px-5 py-3 italic"
                >
                  <div
                    class="flex flex-row items-center justify-between w-full"
                  >
                    <div>
                      @OptionsData show unusual options activity for Amazon
                    </div>
                    <button
                      on:click={() =>
                        handleCopyPrompt(
                          "@OptionsData show unusual options activity for Amazon",
                        )}
                      class="cursor-pointer text-token-text-secondary hover:bg-token-bg-secondary rounded-lg text-muted dark:text-gray-300 dark:sm:hover:text-white"
                      aria-label="Copy"
                    >
                      <!-- Copy icon SVG -->
                    </button>
                  </div>
                </div>
              </section>

              <section class="mb-6">
                <h2
                  class="mb-2 text-2xl font-bold text-gray-900 dark:text-white"
                >
                  @OptionsFlowFeed Agent
                </h2>
                <div class="mb-2">
                  <strong>Requirements:</strong> None
                </div>
                <p class="mb-4">
                  Tracks institutional options activity in real-time:
                </p>
                <ul class="list-disc list-inside mb-3 space-y-1">
                  <li>Large block trades</li>
                  <li>Sweep orders</li>
                  <li>Unusual volume spikes</li>
                  <li>Institutional positioning</li>
                </ul>
                <p class="mb-2">Example prompt:</p>
                <div
                  class="mb-4 rounded border-l-4 border-[#2C6288] bg-[#f3f4f6] dark:bg-table/60 px-5 py-3 italic"
                >
                  <div
                    class="flex flex-row items-center justify-between w-full"
                  >
                    <div>
                      @OptionsFlowFeed show largest institutional options orders
                      today
                    </div>
                    <button
                      on:click={() =>
                        handleCopyPrompt(
                          "@OptionsFlowFeed show largest institutional options orders today",
                        )}
                      class="cursor-pointer text-token-text-secondary hover:bg-token-bg-secondary rounded-lg text-muted dark:text-gray-300 dark:sm:hover:text-white"
                      aria-label="Copy"
                    >
                      <!-- Copy icon SVG -->
                    </button>
                  </div>
                </div>
              </section>

              <section class="mb-6">
                <h2
                  class="mb-2 text-2xl font-bold text-gray-900 dark:text-white"
                >
                  @Investor Agent
                </h2>
                <p class="mb-4">
                  Emulates investment strategies of legendary investors:
                </p>
                <div class="mb-2">
                  <strong>Requirements:</strong> Investor name + stock ticker
                </div>
                <ul class="list-disc list-inside mb-3 space-y-1">
                  <li>
                    <strong>@WarrenBuffett</strong> - Value investing focus
                  </li>
                  <li>
                    <strong>@CharlieMunger</strong> - Quality business analysis
                  </li>
                  <li>
                    <strong>@BenjaminGraham</strong> - Value investing fundamentals
                    & margin of safety
                  </li>
                  <li>
                    <strong>@PeterLynch</strong> - Growth investing approach
                  </li>
                  <li>
                    <strong>@MichaelBurry</strong> - Contrarian deep value
                  </li>
                  <li>
                    <strong>@CathieWood</strong> - Disruptive innovation focus
                  </li>
                </ul>
                <p class="mb-2">Example prompt:</p>
                <div
                  class="mb-4 rounded border-l-4 border-[#2C6288] bg-[#f3f4f6] dark:bg-table/60 px-5 py-3 italic"
                >
                  <div
                    class="flex flex-row items-center justify-between w-full"
                  >
                    <div>
                      @WarrenBuffett would Coca-Cola meet your investment
                      criteria today?
                    </div>
                    <button
                      on:click={() =>
                        handleCopyPrompt(
                          "@WarrenBuffett would Coca-Cola meet your investment criteria today?",
                        )}
                      class="cursor-pointer text-token-text-secondary hover:bg-token-bg-secondary rounded-lg text-muted dark:text-gray-300 dark:sm:hover:text-white"
                      aria-label="Copy"
                    >
                      <!-- Copy icon SVG -->
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>

        <!-- Sidebar remains unchanged -->
        <aside class="hidden lg:block relative fixed w-1/4 mt-4">
          {#if !["Plus", "Pro"]?.includes(data?.user?.tier)}
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
          {/if}

          <div
            class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
          >
            <a
              href="/about"
              class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-xl font-bold ml-3">About Us</h2>
                <ArrowLogo
                  class="w-8 h-8 mr-3 shrink-0 text-gray-400 dark:text-white"
                />
              </div>
              <span class=" p-3 ml-3 mr-3">
                Learn more about why we're doing this here
              </span>
            </a>
          </div>

          <div
            class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
          >
            <a
              href="/contact"
              class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-xl font-bold ml-3">Contact Us</h2>
                <ArrowLogo
                  class="w-8 h-8 mr-3 shrink-0 text-gray-400 dark:text-white"
                />
              </div>
              <span class=" p-3 ml-3 mr-3">
                Let me know if you need something
              </span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
</section>

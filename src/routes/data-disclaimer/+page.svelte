<script>
  import ArrowLogo from "lucide-svelte/icons/move-up-right";
  import SEO from "$lib/components/SEO.svelte";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";

  let discordURL = import.meta.env.VITE_DISCORD_URL;
  const emailAddress = "support@stocknear.com";
</script>

<SEO
  title="Data Disclaimer | Financial Data Sources & Accuracy"
  description="Comprehensive information about our financial data sources, accuracy standards, and usage guidelines for stock market data, analyst estimates, and financial metrics."
/>

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
    <li class="text-gray-800 dark:text-zinc-300">Data Disclaimer</li>
  </BreadCrumb>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:w-3/4 lg:pr-10">
          <div class="mb-6 border-b border-gray-300 dark:border-zinc-700">
            <h1
              class="mb-2 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              Data Disclaimer
            </h1>
          </div>

          <div class="w-full m-auto">
            <div>
              <p
                class="mb-5 text-sm sm:text-base text-gray-800 dark:text-zinc-300"
              >
                The financial data presented on Stocknear is provided for
                informational and educational purposes only. This information
                should not be construed as financial advice or used as the sole
                basis for trading or investment decisions.
                <br />
                We maintain rigorous standards for data accuracy and quality assurance.
                If you identify any discrepancies or require clarification, please
                reach out to us via
                <a
                  href={discordURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-gray-900 dark:text-white hover:text-violet-500 transition"
                >
                  Discord
                </a>
                or contact our support team at
                <a
                  href="mailto:{emailAddress}"
                  class="text-gray-900 dark:text-white hover:text-violet-500 transition"
                >
                  {emailAddress}
                </a>.
              </p>

              <h2
                class="mb-1 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                Market Data & Stock Charts
              </h2>
              <p
                class="mb-10 mt-4 text-sm sm:text-base text-gray-800 dark:text-zinc-300"
              >
                Our comprehensive market data and real-time stock charts are
                powered by
                <a
                  href="https://site.financialmodelingprep.com/pricing-plans?couponCode=stocknear"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-gray-900 dark:text-white hover:text-violet-500 transition"
                >
                  Financial Modeling Prep (FMP)
                </a>, a leading provider of financial data services. This
                includes intraday pricing, historical data, and technical
                indicators.
              </p>

              <h2
                class="mb-1 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                Market Coverage
              </h2>
              <p
                class="mb-10 mt-4 text-sm sm:text-base text-gray-800 dark:text-zinc-300"
              >
                Stocknear provides comprehensive coverage of securities listed
                on major U.S. exchanges, including NASDAQ, NYSE, NYSE American,
                and NYSE Arca. Our database encompasses stocks, ETFs, ADRs, and
                select OTC securities. We are actively expanding our coverage to
                include additional global exchanges and financial instruments.
              </p>

              <h2
                class="mb-1 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                Financial Fundamentals
              </h2>
              <p
                class="mb-10 mt-4 text-sm sm:text-base text-gray-800 dark:text-zinc-300"
              >
                Our fundamental financial data is sourced from
                <a
                  href="https://site.financialmodelingprep.com/pricing-plans?couponCode=stocknear"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-gray-900 dark:text-white hover:text-violet-500 transition"
                >
                  Financial Modeling Prep
                </a>
                and is derived from official SEC filings (Forms 10-K, 10-Q, and 8-K).
                While our systems update this information daily, there may be inherent
                delays due to standard SEC filing windows and corporate reporting
                schedules. All financial data presented is based on official, audited
                company submissions to regulatory authorities.
              </p>

              <h2
                class="mb-1 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                Business Metrics Data
              </h2>
              <p
                class="mb-10 mt-4 text-sm sm:text-base text-gray-800 dark:text-zinc-300"
              >
                Business Metrics Data, including operational KPIs and non-GAAP
                unit economics, is provided through our partner
                <a
                  href="https://mainstreetdata.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-gray-900 dark:text-white hover:text-violet-500 transition"
                >
                  Main Street Data
                </a>. Their research team aggregates, normalizes, and
                continuously validates these disclosures from company filings,
                investor presentations, and management commentary to ensure
                high-integrity business performance coverage across our
                platform.
              </p>

              <h2
                class="mb-1 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                Analyst Coverage & Market Projections
              </h2>
              <p
                class="mb-10 mt-4 text-sm sm:text-base text-gray-800 dark:text-zinc-300"
              >
                Our analyst coverage integrates data from multiple authoritative
                sources. Price targets and analyst ratings are provided by
                Benzinga, representing consensus views from leading Wall Street
                analysts. Revenue projections and EPS forecasts are aggregated
                from both Benzinga and
                <a
                  href="https://site.financialmodelingprep.com/pricing-plans?couponCode=stocknear"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-gray-900 dark:text-white hover:text-violet-500 transition"
                >
                  Financial Modeling Prep
                </a>. While we strive to present the most accurate forecasts,
                users should note that market predictions are inherently
                uncertain and should be considered as part of a broader
                investment research process.
              </p>

              <h2
                class="mb-1 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                ETF Analytics
              </h2>
              <p
                class="mb-10 mt-4 text-sm sm:text-base text-gray-800 dark:text-zinc-300"
              >
                Our ETF holdings data and analytics are provided through our
                partnership with
                <a
                  href="https://site.financialmodelingprep.com/pricing-plans?couponCode=stocknear"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-gray-900 dark:text-white hover:text-violet-500 transition"
                >
                  Financial Modeling Prep
                </a>, ensuring accurate and timely information on fund
                compositions, allocations, and performance metrics.
              </p>

              <h2
                class="mb-1 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                Options Market Data
              </h2>
              <p
                class="mb-10 mt-4 text-sm sm:text-base text-gray-800 dark:text-zinc-300"
              >
                Our options market data infrastructure leverages multiple data
                vendors, combining their feeds into a unified pipeline to
                deliver comprehensive full-stream OPRA (Options Price Reporting
                Authority) data. By aggregating real-time options flow and
                individual options chain data from several sources, we ensure
                complete coverage of options market activity and pricing across
                all major U.S. options exchanges.
              </p>
            </div>
          </div>
        </main>

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
                  Pro Subscription
                </h2>
                <ArrowLogo
                  class="w-6 h-6 mr-3 shrink-0 text-gray-800 dark:text-zinc-300 group-hover:text-violet-500 transition"
                />
              </div>
              <span
                class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
              >
                Upgrade now for unlimited access to all data, tools and no ads.
              </span>
            </a>
          </div>

          <div
            class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
          >
            <a
              href="/about"
              class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-lg font-semibold ml-3">About Us</h2>
                <ArrowLogo
                  class="w-6 h-6 mr-3 shrink-0 text-gray-800 dark:text-zinc-300 group-hover:text-violet-500 transition"
                />
              </div>
              <span
                class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
              >
                Learn more about why we're doing this here
              </span>
            </a>
          </div>

          <div
            class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
          >
            <a
              href="/contact"
              class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-lg font-semibold ml-3">
                  Contact Us
                </h2>
                <ArrowLogo
                  class="w-6 h-6 mr-3 shrink-0 text-gray-800 dark:text-zinc-300 group-hover:text-violet-500 transition"
                />
              </div>
              <span
                class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
              >
                Let me know if you need something
              </span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
</section>

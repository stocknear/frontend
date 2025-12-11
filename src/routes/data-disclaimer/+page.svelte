<script>
  import ArrowLogo from "lucide-svelte/icons/move-up-right";
  import SEO from "$lib/components/SEO.svelte";

  let discordURL = import.meta.env.VITE_DISCORD_URL;
  const emailAddress = "support@stocknear.com";
</script>

<SEO
  title="Data Disclaimer | Financial Data Sources & Accuracy"
  description="Comprehensive information about our financial data sources, accuracy standards, and usage guidelines for stock market data, analyst estimates, and financial metrics."
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3 text-muted dark:text-white"
>
  <div class="text-sm sm:text-[1rem] breadcrumbs">
    <ul>
      <li>
        <a href="/" class="text-muted dark:text-gray-300">Home</a>
      </li>
      <li class="text-muted dark:text-gray-300">Data Disclaimer</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:w-3/4 lg:pr-10">
          <div class="mb-6 border-b-2">
            <h1 class="mb-1 text-2xl sm:text-3xl font-bold">Data Disclaimer</h1>
          </div>

          <div class="w-full m-auto">
            <div>
              <p class=" mb-5 text-[1rem] sm:text-lg">
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
                  class="text-blue-800 dark:text-blue-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:underline"
                >
                  Discord
                </a>
                or contact our support team at
                <a
                  href="mailto:{emailAddress}"
                  class="text-blue-800 dark:text-blue-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:underline"
                >
                  {emailAddress}
                </a>.
              </p>

              <h2 class="mb-1 text-2xl sm:text-3xl font-bold">
                Market Data & Stock Charts
              </h2>
              <p class=" mb-10 mt-5 text-[1rem] sm:text-lg">
                Our comprehensive market data and real-time stock charts are
                powered by
                <a
                  href="https://site.financialmodelingprep.com/pricing-plans?couponCode=stocknear"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-blue-800 dark:text-blue-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:underline"
                >
                  Financial Modeling Prep (FMP)
                </a>, a leading provider of financial data services. This
                includes intraday pricing, historical data, and technical
                indicators.
              </p>

              <h2 class="mb-1 text-2xl sm:text-3xl font-bold">
                Market Coverage
              </h2>
              <p class=" mb-10 mt-5 text-[1rem] sm:text-lg">
                Stocknear provides comprehensive coverage of securities listed
                on major U.S. exchanges, including NASDAQ, NYSE, NYSE American,
                and NYSE Arca. Our database encompasses stocks, ETFs, ADRs, and
                select OTC securities. We are actively expanding our coverage to
                include additional global exchanges and financial instruments.
              </p>

              <h2 class="mb-1 text-2xl sm:text-3xl font-bold">
                Financial Fundamentals
              </h2>
              <p class=" mb-10 mt-5 text-[1rem] sm:text-lg">
                Our fundamental financial data is sourced from
                <a
                  href="https://site.financialmodelingprep.com/pricing-plans?couponCode=stocknear"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-blue-800 dark:text-blue-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:underline"
                >
                  Financial Modeling Prep
                </a>
                and is derived from official SEC filings (Forms 10-K, 10-Q, and 8-K).
                While our systems update this information daily, there may be inherent
                delays due to standard SEC filing windows and corporate reporting
                schedules. All financial data presented is based on official, audited
                company submissions to regulatory authorities.
              </p>

              <h2 class="mb-1 text-2xl sm:text-3xl font-bold">
                Business Metrics Data
              </h2>
              <p class=" mb-10 mt-5 text-[1rem] sm:text-lg">
                Business Metrics Data, including operational KPIs and non-GAAP
                unit economics, is provided through our partner
                <a
                  href="https://mainstreetdata.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-blue-800 dark:text-blue-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:underline"
                >
                  Main Street Data
                </a>. Their research team aggregates, normalizes, and
                continuously validates these disclosures from company filings,
                investor presentations, and management commentary to ensure
                high-integrity business performance coverage across our
                platform.
              </p>

              <h2 class="mb-1 text-2xl sm:text-3xl font-bold">
                Analyst Coverage & Market Projections
              </h2>
              <p class=" mb-10 mt-5 text-[1rem] sm:text-lg">
                Our analyst coverage integrates data from multiple authoritative
                sources. Price targets and analyst ratings are provided by
                Benzinga, representing consensus views from leading Wall Street
                analysts. Revenue projections and EPS forecasts are aggregated
                from both Benzinga and
                <a
                  href="https://site.financialmodelingprep.com/pricing-plans?couponCode=stocknear"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-blue-800 dark:text-blue-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:underline"
                >
                  Financial Modeling Prep
                </a>. While we strive to present the most accurate forecasts,
                users should note that market predictions are inherently
                uncertain and should be considered as part of a broader
                investment research process.
              </p>

              <h2 class="mb-1 text-2xl sm:text-3xl font-bold">ETF Analytics</h2>
              <p class=" mb-10 mt-5 text-[1rem] sm:text-lg">
                Our ETF holdings data and analytics are provided through our
                partnership with
                <a
                  href="https://site.financialmodelingprep.com/pricing-plans?couponCode=stocknear"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-blue-800 dark:text-blue-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:underline"
                >
                  Financial Modeling Prep
                </a>, ensuring accurate and timely information on fund
                compositions, allocations, and performance metrics.
              </p>

              <h2 class="mb-1 text-2xl sm:text-3xl font-bold">
                Options Market Data
              </h2>
              <p class=" mb-10 mt-5 text-[1rem] sm:text-lg">
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
                Upgrade now for unlimited access to all data, tools and no ads.
              </span>
            </a>
          </div>

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

<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import LazyVideo from "$lib/components/LazyVideo.svelte";
  import { inview } from "$lib/actions/inview";
  import { onMount } from "svelte";

  export let data;
  export let form;

  const trustpilotScore = 4.6;
  const investorCount = 7000;

  let LoginPopup: any;

  onMount(async () => {
    if (!data?.user) {
      LoginPopup = (await import("$lib/components/LoginPopup.svelte")).default;
    }
  });
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

<!-- Hero Section -->
<section class="relative overflow-hidden bg-white dark:bg-[#09090B]">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
    <!-- Headline -->
    <div class="text-center max-w-4xl mx-auto">
      <h1
        use:inview={{ animation: 'fade-up', duration: 700 }}
        class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight"
      >
        Research your next Trading
        <span
          class="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500 italic"
        >
          Idea
        </span>
      </h1>
      <p
        use:inview={{ animation: 'fade-up', delay: 100, duration: 700 }}
        class="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
      >
        Realtime stock prices, options flow, dark pool orders, news, financials,
        forecasts, charts, and more.
      </p>

      <!-- CTA + Trust -->
      <div
        use:inview={{ animation: 'fade-up', delay: 200, duration: 600 }}
        class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        <a
          href="/register"
          class="w-full max-w-56 sm:max-w-full sm:w-auto inline-flex items-center justify-center px-5 py-2 sm:px-8 sm:py-3 bg-muted hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black font-semibold rounded text-[1rem] sm:text-lg transition-all border border-gray-300 dark:border-transparent"
        >
          Start Free
        </a>
        <label
          for={!data?.user ? "userLogin" : ""}
          on:click={() => {
            if (data?.user) window.location.href = "/pricing";
          }}
          class="w-full max-w-56 sm:max-w-full sm:w-auto inline-flex items-center justify-center px-5 py-2 sm:px-8 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded text-[1rem] sm:text-lg transition-all shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 cursor-pointer"
        >
          Start 7-Day Free Trial
        </label>
      </div>

      <!-- Trust signals - subtle, supporting -->
      <div
        use:inview={{ animation: 'fade', delay: 400, duration: 800 }}
        class="mt-8 flex flex-wrap justify-center items-center gap-6 text-sm text-gray-500 dark:text-gray-400"
      >
        <a
          href="https://www.trustpilot.com/review/stocknear.com"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg
            class="w-4 h-4 mr-1.5 text-green-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
          </svg>
          {trustpilotScore}/5 on Trustpilot
        </a>
        <span class="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
        <span class="flex items-center">
          <svg
            class="w-4 h-4 mr-1.5 text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"
            />
          </svg>
          {investorCount?.toLocaleString()}+ investors
        </span>
        <span class="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
        <span class="flex items-center">
          <svg
            class="w-4 h-4 mr-1.5 text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
              clip-rule="evenodd"
            />
          </svg>
          Real-time Stock & Options Data
        </span>
      </div>
    </div>

    <!-- Hero Video - Product first -->
    <div
      use:inview={{ animation: 'scale', delay: 300, duration: 800 }}
      class="mt-16 relative"
    >
      <div
        class="absolute inset-0 bg-gradient-to-t from-white dark:from-[#09090B] to-transparent z-10 pointer-events-none h-32 bottom-0 top-auto"
      ></div>
      <div
        class="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl shadow-gray-900/10 dark:shadow-black/50"
      >
        <LazyVideo
          src="/video/overview.mp4"
          poster="/img/landing-page/overview.png"
          className="w-full h-auto"
          threshold={0.2}
          rootMargin="200px"
        />
      </div>
    </div>
  </div>
</section>

<!-- AI Chatbot Section -->
<section
  class="py-10 sm:py-20 bg-white dark:bg-[#09090B] border-t border-gray-200 dark:border-gray-800"
>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid lg:grid-cols-2 gap-12 items-center">
      <!-- Content -->
      <div use:inview={{ animation: 'fade-right', duration: 700 }}>
        <div
          class="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-6"
        >
          <svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
            />
          </svg>
          Unlike ChatGPT
        </div>
        <h2
          class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white"
        >
          AI That Knows the Market
          <span
            class="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500"
            >Right Now</span
          >
        </h2>
        <p class="mt-6 text-lg text-gray-600 dark:text-gray-300">
          LLM uses a fixed knowledge cutoff. Our AI, on the other hand, has
          real-time access to every stock, every metric, every price movement — <strong
            >as they happen</strong
          >.
        </p>

        <ul class="mt-8 space-y-4">
          <li class="flex items-start">
            <div
              class="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5"
            >
              <svg
                class="w-4 h-4 text-green-600 dark:text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <p class="ml-3 text-gray-600 dark:text-gray-300">
              <strong class="text-gray-900 dark:text-white"
                >Realtime prices & fundamentals</strong
              > — Ask about any stock and get live data
            </p>
          </li>
          <li class="flex items-start">
            <div
              class="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5"
            >
              <svg
                class="w-4 h-4 text-green-600 dark:text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <p class="ml-3 text-gray-600 dark:text-gray-300">
              <strong class="text-gray-900 dark:text-white"
                >Full Stocknear data access</strong
              > — Options flow, dark pool, analyst ratings & more
            </p>
          </li>
          <li class="flex items-start">
            <div
              class="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5"
            >
              <svg
                class="w-4 h-4 text-green-600 dark:text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <p class="ml-3 text-gray-600 dark:text-gray-300">
              <strong class="text-gray-900 dark:text-white"
                >Research in seconds</strong
              > — No more switching between 10 tabs
            </p>
          </li>
        </ul>

        <div class="w-full m-auto flex justify-center sm:justify-start">
          <a
            href="/chat"
            class="inline-flex items-center mt-8 px-5 py-2 sm:px-6 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded transition-all shadow-lg shadow-purple-500/25"
          >
            Try AI Chat
            <svg
              class="w-5 h-5 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        </div>
      </div>

      <!-- Video -->
      <div use:inview={{ animation: 'fade-left', duration: 700, delay: 150 }} class="relative">
        <div
          class="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-2xl shadow-purple-500/10"
        >
          <LazyVideo
            src="/video/ai-agent.mp4"
            poster="/img/landing-page/ai-agent.png"
            className="w-full aspect-video object-cover"
            threshold={0.3}
          />
          <!-- Play overlay hint -->
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"
          ></div>
        </div>
        <!-- Decorative elements -->
        <div
          class="absolute -z-10 -top-4 -right-4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"
        ></div>
        <div
          class="absolute -z-10 -bottom-4 -left-4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"
        ></div>
      </div>
    </div>
  </div>
</section>

<!-- Options Flow Section -->
<section class=" sm:py-10 bg-white dark:bg-[#09090B]">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div use:inview={{ animation: 'fade-up', duration: 600 }} class="text-center mb-16">
      <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
        See What Smart Money Is Buying
      </h2>
      <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">
        The same options flow data institutions pay thousands for
      </p>
    </div>

    <div class="grid -mt-6 sm:mt-0 gap-5 sm:gap-10">
      <!-- Options Flow Card -->
      <div use:inview={{ animation: 'fade-up', duration: 700, delay: 100 }} class="relative group">
        <!-- Glow effect -->
        <div
          class="absolute -inset-1 bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 rounded-xl blur-lg opacity-25 group-hover:opacity-40 transition duration-500"
        ></div>

        <div
          class="relative bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-2xl"
        >
          <!-- Video with premium frame -->
          <div class="relative">
            <LazyVideo
              src="/video/options-flow.mp4"
              poster="/img/landing-page/options-flow.png"
              className="w-full object-contain"
              playbackRate={3}
              threshold={0.3}
            />
            <!-- Bottom gradient fade -->
            <div
              class="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black dark:from-black to-transparent pointer-events-none"
            ></div>
          </div>

          <!-- Content -->
          <div class="p-6">
            <div class="flex items-center gap-2 mb-2">
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                Realtime Options Flow
              </h3>
              <span
                class="px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-full"
              >
                PRO
              </span>
            </div>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              Watch institutional trades hit the tape in realtime. Spot unusual
              sweeps, block trades, and smart money positioning before price
              moves.
            </p>
            <ul class="space-y-3">
              <li
                class="flex items-start text-sm text-gray-600 dark:text-gray-300"
              >
                <svg
                  class="w-5 h-5 text-purple-500 mr-2 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                Spot unusual sweeps & block trades instantly
              </li>
              <li
                class="flex items-start text-sm text-gray-600 dark:text-gray-300"
              >
                <svg
                  class="w-5 h-5 text-purple-500 mr-2 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                GEX & DEX to predict key price levels
              </li>
              <li
                class="flex items-start text-sm text-gray-600 dark:text-gray-300"
              >
                <svg
                  class="w-5 h-5 text-purple-500 mr-2 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                Max pain & OI for support/resistance zones
              </li>
              <li
                class="flex items-start text-sm text-gray-600 dark:text-gray-300"
              >
                <svg
                  class="w-5 h-5 text-purple-500 mr-2 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                Filter by ticker, size, expiry & sentiment
              </li>
            </ul>
            <div class="w-full flex justify-center sm:justify-start">
              <a
                href="/options-flow"
                class="inline-flex items-center mt-6 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded transition-all"
              >
                Watch Live Flow
                <svg
                  class="w-4 h-4 ml-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- What You'll See Section - Show value through examples -->
<section
  class="py-10 sm:py-20 bg-gray-50 dark:bg-[#0f0f11] border-t border-gray-200 dark:border-gray-800"
>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div use:inview={{ animation: 'fade-up', duration: 600 }} class="text-center mb-12">
      <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
        What You'll See Every Day
      </h2>
      <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">
        Real examples of unusual activity our users spot
      </p>
    </div>

    <div class="grid md:grid-cols-3 gap-6">
      <a
        use:inview={{ animation: 'fade-up', duration: 600, delay: 0 }}
        href="/stocks/TSLA/options/gex/strike"
        class="group bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20"
      >
        <div
          class="aspect-[16/9] bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 overflow-hidden relative transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-purple-100 group-hover:to-violet-100 dark:group-hover:from-purple-800/40 dark:group-hover:to-violet-800/40"
        >
          <img
            src="/img/landing-page/gex-chart.png"
            alt="GEX/DEX Chart"
            class="w-full h-full object-cover rounded transition-transform duration-300 ease-out group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div class="p-5">
          <div class="flex items-center gap-2 mb-2">
            <span
              class="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full"
            >
              Calls
            </span>
            <span
              class="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-full"
            >
              Puts
            </span>
          </div>
          <h3
            class="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300"
          >
            Gamma/Delta Exposure
          </h3>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            The Gamma/Delta Exposure Chart shows the estimated dollar amount
            that market makers must hedge for every 1% change in the spot price
            to remain gamma neutral. This chart helps traders anticipate
            potential buying or selling pressure from dealer hedging.
          </p>
        </div>
      </a>

      <!-- Example 2: Greeks Chart -->
      <a
        use:inview={{ animation: 'fade-up', duration: 600, delay: 100 }}
        href="/stocks/TSLA/options/greeks"
        class="group bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20"
      >
        <div
          class="aspect-[16/9] bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 overflow-hidden relative transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-purple-100 group-hover:to-violet-100 dark:group-hover:from-purple-800/40 dark:group-hover:to-violet-800/40"
        >
          <img
            src="/img/landing-page/theta-chart.png"
            alt="Greek Chart"
            class="w-full h-full object-cover rounded transition-transform duration-300 ease-out group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div class="p-5">
          <div class="flex items-center gap-2 mb-2">
            <span
              class="px-2 py-0.5 text-xs font-medium bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 rounded-full"
            >
              Greeks
            </span>
            <span
              class="px-2 py-0.5 text-xs font-medium bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 rounded-full"
              >Delta</span
            >
            <span
              class="px-2 py-0.5 text-xs font-medium bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 rounded-full"
              >Gamma</span
            >
            <span
              class="px-2 py-0.5 text-xs font-medium bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 rounded-full"
              >Theta</span
            >
            <span
              class="px-2 py-0.5 text-xs font-medium bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 rounded-full"
              >Vega</span
            >
          </div>

          <h3
            class="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300"
          >
            Greeks
          </h3>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            The Greek Charts show Delta, Gamma, Theta, and Vega for both calls
            and puts across all strikes. Each value is derived from current
            market prices using the Black-Scholes model. These Greeks give
            traders deeper insight into how option prices react to market
            movements, time decay, and changes in volatility—helping them better
            understand and manage their positions.
          </p>
        </div>
      </a>

      <!-- Example 3: Open Interest -->
      <a
        use:inview={{ animation: 'fade-up', duration: 600, delay: 200 }}
        href="/stocks/TSLA/options/oi"
        class="group bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20"
      >
        <div
          class="aspect-[16/9] bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 overflow-hidden relative transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-purple-100 group-hover:to-violet-100 dark:group-hover:from-purple-800/40 dark:group-hover:to-violet-800/40"
        >
          <img
            src="/img/landing-page/oi-chart.png"
            alt="Open Interest Chart"
            class="w-full h-full object-cover rounded transition-transform duration-300 ease-out group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div class="p-5">
          <div class="flex items-center gap-2 mb-2">
            <span
              class="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full"
            >
              By Strike
            </span>
            <span
              class="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full"
              >By Expiration</span
            >
          </div>
          <h3
            class="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300"
          >
            Open Interest
          </h3>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            The Open Interest chart displays the number of open contracts for
            each option. It serves as a useful indicator of market sentiment and
            liquidity. Data is available both by strike and by expiration,
            helping traders assess where interest is concentrated and potential
            market trends.
          </p>
        </div>
      </a>
    </div>
  </div>
</section>

<!-- Additional Features Section -->
<section class="py-10 sm:py-20 bg-white dark:bg-[#09090B]">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div use:inview={{ animation: 'fade-up', duration: 600 }} class="text-center mb-16">
      <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
        More Than Just Flow Data
      </h2>
      <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">
        Tools that give you an edge in every trade
      </p>
    </div>

    <div class="grid md:grid-cols-2 gap-10">
      <!-- Why Price Moved Card -->
      <div
        use:inview={{ animation: 'fade-right', duration: 600 }}
        class="bg-gray-50 dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        <!-- Screenshot Placeholder -->
        <div class="text-center">
          <img
            src="/img/landing-page/wiim-chart.png"
            alt="Greek Chart"
            class="w-full h-full object-cover rounded"
            loading="lazy"
          />
        </div>

        <!-- Content -->
        <div class="p-6">
          <div class="flex items-center gap-2 mb-2">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white">
              Why Price Moved
            </h3>
            <span
              class="px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full"
            >
              Realtime
            </span>
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            One-sentence explanations of why stocks are moving. We cut through
            noise from news, press releases and SEC filings to pinpoint the
            trigger.
          </p>
          <ul class="space-y-3">
            <li
              class="flex items-start text-sm text-gray-600 dark:text-gray-300"
            >
              <svg
                class="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              Instant price movement explanations
            </li>
            <li
              class="flex items-start text-sm text-gray-600 dark:text-gray-300"
            >
              <svg
                class="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              Aggregated from news & SEC filings
            </li>
            <li
              class="flex items-start text-sm text-gray-600 dark:text-gray-300"
            >
              <svg
                class="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              No noise, just the signal
            </li>
          </ul>
          <a
            href="/news-flow"
            class="inline-flex items-center mt-6 font-medium hover:underline"
          >
            View News Flow
            <svg
              class="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        </div>
      </div>

      <!-- Wall Street Analysts Card -->
      <div
        use:inview={{ animation: 'fade-left', duration: 600, delay: 100 }}
        class="bg-gray-50 dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        <!-- Screenshot Placeholder -->
        <div
          class="aspect-[16/9] bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 flex items-center justify-center border-b border-gray-200 dark:border-gray-800"
        >
          <div class="text-center">
            <img
              src="/img/landing-page/analyst-chart.png"
              alt="Greek Chart"
              class="w-full h-full object-cover rounded"
              loading="lazy"
            />
          </div>
        </div>

        <!-- Content -->
        <div class="p-6">
          <div class="flex items-center gap-2 mb-2">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white">
              Wall Street Analysts
            </h3>
            <span
              class="px-2 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full"
            >
              Ranked
            </span>
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Track top analysts with their historic performance. See who actually
            makes money and who doesn't before following their calls.
          </p>
          <ul class="space-y-3">
            <li
              class="flex items-start text-sm text-gray-600 dark:text-gray-300"
            >
              <svg
                class="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              Success rate & win rate tracking
            </li>
            <li
              class="flex items-start text-sm text-gray-600 dark:text-gray-300"
            >
              <svg
                class="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              Average return per rating
            </li>
            <li
              class="flex items-start text-sm text-gray-600 dark:text-gray-300"
            >
              <svg
                class="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              Instant updates on new ratings
            </li>
          </ul>
          <a
            href="/analysts"
            class="inline-flex items-center mt-6 font-medium hover:underline"
          >
            View Top Analysts
            <svg
              class="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Pricing Section -->
<section
  class="py-10 sm:py-20 bg-gray-50 dark:bg-[#0f0f11] border-t border-gray-200 dark:border-gray-800"
>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <div use:inview={{ animation: 'fade-up', duration: 600 }} class="text-center mb-12">
      <div
        class="inline-flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium mb-4"
      >
        <svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd"
          />
        </svg>
        Lowest price in the industry
      </div>
      <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
        Your unfair advantage in the market
      </h2>
      <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">
        Professional-grade tools at retail-friendly prices. Competitors charge
        $100-300/mo for the same data.
      </p>
    </div>

    <div class="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      <!-- Plus Tier -->
      <div
        use:inview={{ animation: 'fade-right', duration: 600, delay: 0 }}
        class="relative flex flex-col bg-white dark:bg-zinc-900 rounded border border-gray-400 dark:border-zinc-600 p-6 overflow-visible"
      >
        <h3 class="text-3xl font-bold text-gray-900 dark:text-white">Plus</h3>
        <p class="text-gray-600 dark:text-zinc-300 text-sm mt-1">
          Essential tools for individual traders
        </p>
        <div class="mt-4">
          <span class="text-4xl font-bold text-gray-900 dark:text-white"
            >$10</span
          >
          <span class="text-xl ml-1 text-gray-600 dark:text-gray-400">/mo</span>
        </div>

        <ul class="mt-6 mb-6 space-y-2 flex-grow">
          <li class="flex items-start text-gray-900 dark:text-white">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            150 Credits/mo
          </li>
          <li class="flex items-start text-gray-900 dark:text-white">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Unlimited Watchlist up to 100 stocks
          </li>
          <li class="flex items-start text-gray-900 dark:text-white">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Unlimited Stock Screener
          </li>
          <li class="flex items-start text-gray-900 dark:text-white">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Hedge Fund Portfolio Access
          </li>
          <li class="flex items-start text-gray-900 dark:text-white">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            US Congress Portfolio Access
          </li>
          <li class="flex items-start text-gray-900 dark:text-white">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Financial History Access
          </li>
          <li class="flex items-start text-gray-900 dark:text-white">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Real-Time Notification
          </li>
          <li class="flex items-start text-gray-900 dark:text-white">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            No Ads
          </li>
        </ul>

        <div class="mt-auto pt-6 border-t border-gray-200 dark:border-zinc-700">
          <label
            for={!data?.user ? "userLogin" : ""}
            on:click={() => {
              if (data?.user) window.location.href = "/pricing";
            }}
            class="block w-full py-3 px-4 text-center font-semibold rounded bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Start Free 7 Day Trial
            <svg
              class="w-5 h-5 ml-2 inline-block"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </label>
        </div>
      </div>

      <!-- Pro Tier -->
      <div
        use:inview={{ animation: 'fade-left', duration: 600, delay: 100 }}
        class="relative flex flex-col bg-[#18181B] dark:bg-zinc-900 rounded border border-violet-500/50 p-6 text-white overflow-visible"
      >
        <!-- Subtle top glow -->
        <div
          class="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent"
        ></div>
        <!-- Best Value Badge -->
        <div
          class="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-violet-500 text-white text-xs font-semibold rounded-full shadow-md uppercase tracking-wider whitespace-nowrap"
        >
          Best Value
        </div>
        <h3 class="text-3xl font-bold mt-2">Pro</h3>
        <p class="text-zinc-300 text-sm mt-1">
          Professional tools at retail prices
        </p>
        <div class="mt-4">
          <span class="text-4xl font-bold">$35</span>
          <span class="text-xl ml-1">/mo</span>
        </div>

        <ul class="mt-6 mb-6 space-y-2 flex-grow">
          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            1,000 Credits/mo
          </li>
          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Everything in Plus and ...
          </li>
          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Watchlist with up to 300 stocks
          </li>
          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Real-Time Options & Historical Data
          </li>
          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Real-Time Options Flow Data
          </li>
          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Real-Time Unusual Orders
          </li>
          <li class="flex items-start">
            <svg
              class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Premium Discord Channel Access
          </li>
        </ul>

        <div class="mt-auto pt-6 border-t border-zinc-700">
          <label
            for={!data?.user ? "userLogin" : ""}
            on:click={() => {
              if (data?.user) window.location.href = "/pricing";
            }}
            class="block w-full py-3 px-4 text-center font-semibold rounded bg-violet-500 text-white hover:bg-violet-600 transition-colors cursor-pointer"
          >
            Start Free 7 Day Trial
            <svg
              class="w-5 h-5 ml-2 inline-block"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </label>
        </div>
      </div>
    </div>

    <!-- Value reinforcement -->
    <div
      use:inview={{ animation: 'fade-up', duration: 600, delay: 200 }}
      class="mt-6 sm:mt-12 text-center p-6 rounded bg-white dark:bg-[#18181B] border border-gray-200 dark:border-gray-800 max-w-4xl mx-auto"
    >
      <p class="text-gray-600 dark:text-gray-300">
        <span class="font-semibold text-gray-900 dark:text-white"
          >Why so affordable?</span
        >
        We believe every retail trader deserves access to institutional-quality data.
        No hidden fees, no compromises.
      </p>
    </div>
  </div>
</section>

<!-- Trust & Guarantee Section -->
<section class="py-10 sm:py-16 bg-white dark:bg-[#09090B] border-t border-gray-200 dark:border-gray-800">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div use:inview={{ animation: 'fade-up', duration: 600 }} class="text-center mb-10">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
        <svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
      <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
        Your Investment is Protected
      </h2>
      <p class="mt-3 text-gray-600 dark:text-gray-400">
        Try Stocknear completely risk-free
      </p>
    </div>

    <div use:inview={{ animation: 'fade-up', duration: 600, delay: 100 }} class="grid sm:grid-cols-3 gap-6 sm:gap-8">
      <!-- 7-Day Trial -->
      <div class="text-center p-6 rounded-xl bg-gray-50 dark:bg-[#18181B] border border-gray-200 dark:border-gray-800">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
          <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">7-Day Free Trial</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Full access to all Pro features. Experience everything before you commit.
        </p>
      </div>

      <!-- 30-Day Money Back -->
      <div class="text-center p-6 rounded-xl bg-green-50 dark:bg-green-900/10 border-2 border-green-200 dark:border-green-800">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
          <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">30-Day Money Back</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Not satisfied? Get a full refund within 30 days. <strong class="text-gray-900 dark:text-white">No questions asked.</strong>
        </p>
      </div>

      <!-- Cancel Anytime -->
      <div class="text-center p-6 rounded-xl bg-gray-50 dark:bg-[#18181B] border border-gray-200 dark:border-gray-800">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
          <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Cancel Anytime</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          One click in your settings. No hoops, no retention calls, no hassle.
        </p>
      </div>
    </div>

    <div use:inview={{ animation: 'fade', duration: 600, delay: 200 }} class="mt-10 text-center">
      <p class="text-gray-600 dark:text-gray-300 italic text-lg">
        "If Stocknear doesn't help you make better trading decisions, we don't want your money."
      </p>
      <p class="mt-3 text-sm font-medium text-gray-900 dark:text-white">
        Dr. Muslem Rahimi
        <span class="text-gray-500 dark:text-gray-400 font-normal">— CEO, Stocknear</span>
      </p>
    </div>
  </div>
</section>

<!-- Testimonials Section -->
<section
  class="py-10 sm:py-20 bg-gray-50 dark:bg-[#0f0f11] border-t border-gray-200 dark:border-gray-800"
>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <div use:inview={{ animation: 'fade-up', duration: 600 }} class="text-center mb-6">
      <a
        href="https://www.trustpilot.com/review/stocknear.com"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center text-lg font-medium text-gray-900 dark:text-white hover:underline"
      >
        <svg
          class="w-5 h-5 mr-2 text-green-500"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          />
        </svg>
        {trustpilotScore}/5 on Trustpilot
      </a>
    </div>

    <div class="grid md:grid-cols-3 gap-6">
      <!-- Testimonial 1 -->
      <div
        use:inview={{ animation: 'fade-up', duration: 600, delay: 0 }}
        class="bg-white dark:bg-[#18181B] rounded p-6 border border-gray-200 dark:border-gray-800"
      >
        <div class="flex mb-3">
          {#each Array(5) as _}
            <svg
              class="w-4 h-4 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </svg>
          {/each}
        </div>
        <p class="text-gray-600 dark:text-gray-300 text-sm sm:text-[1rem]">
          "Offers premium features for an affordable price. There are usually
          new features being rolled out weekly."
        </p>
        <p class="mt-4 text-sm font-medium text-gray-900 dark:text-white">
          Pat
        </p>
      </div>

      <!-- Testimonial 2 -->
      <div
        use:inview={{ animation: 'fade-up', duration: 600, delay: 100 }}
        class="bg-white dark:bg-[#18181B] rounded p-6 border border-gray-200 dark:border-gray-800"
      >
        <div class="flex mb-3">
          {#each Array(5) as _}
            <svg
              class="w-4 h-4 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </svg>
          {/each}
        </div>
        <p class="text-gray-600 dark:text-gray-300 text-sm sm:text-[1rem]">
          "The information that the site provides is top notch. They have great
          support and always improving."
        </p>
        <p class="mt-4 text-sm font-medium text-gray-900 dark:text-white">
          Dean
        </p>
      </div>

      <!-- Testimonial 3 -->
      <div
        use:inview={{ animation: 'fade-up', duration: 600, delay: 200 }}
        class="bg-white dark:bg-[#18181B] rounded p-6 border border-gray-200 dark:border-gray-800"
      >
        <div class="flex mb-3">
          {#each Array(5) as _}
            <svg
              class="w-4 h-4 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </svg>
          {/each}
        </div>
        <p class="text-gray-600 dark:text-gray-300 text-sm sm:text-[1rem]">
          "Brings analysis tools to retail investors in a way that elevates
          decision making to pro levels. "
        </p>
        <p class="mt-4 text-sm font-medium text-gray-900 dark:text-white">
          SkiSmith
        </p>
      </div>
    </div>
  </div>
</section>

<!-- FAQ Section -->
<section
  class="py-10 sm:py-20 bg-white dark:bg-[#09090B] border-t border-gray-200 dark:border-gray-800"
>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
    <div use:inview={{ animation: 'fade-up', duration: 600 }} class="text-center mb-12">
      <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
        Frequently Asked Questions
      </h2>
      <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">
        Everything you need to know before getting started
      </p>
    </div>

    <div use:inview={{ animation: 'fade-up', duration: 600, delay: 100 }} class="divide-y divide-gray-200 dark:divide-gray-800">
      <!-- FAQ 1 -->
      <details class="group py-5">
        <summary class="flex items-center justify-between cursor-pointer list-none">
          <span class="font-semibold text-gray-900 dark:text-white text-lg">
            What makes Stocknear different from other platforms?
          </span>
          <svg
            class="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <p class="mt-4 text-gray-600 dark:text-gray-300">
          Stocknear provides institutional-grade data at retail-friendly prices. We offer real-time options flow, dark pool activity, AI-powered analysis, and Wall Street-level tools — all in one unified platform. Competitors charge $100-300/mo for similar data.
        </p>
      </details>

      <!-- FAQ 2 -->
      <details class="group py-5">
        <summary class="flex items-center justify-between cursor-pointer list-none">
          <span class="font-semibold text-gray-900 dark:text-white text-lg">
            How does the 7-day free trial work?
          </span>
          <svg
            class="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <p class="mt-4 text-gray-600 dark:text-gray-300">
          You get full access to all Pro features for 7 days. Cancel anytime within your trial period with no obligations. If you decide it's not for you, you won't be charged a penny.
        </p>
      </details>

      <!-- FAQ 3 -->
      <details class="group py-5">
        <summary class="flex items-center justify-between cursor-pointer list-none">
          <span class="font-semibold text-gray-900 dark:text-white text-lg">
            What's your refund policy?
          </span>
          <svg
            class="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <p class="mt-4 text-gray-600 dark:text-gray-300">
          We offer a <strong class="text-gray-900 dark:text-white">30-day money-back guarantee</strong>, no questions asked. If you're not satisfied for any reason, just send us an email and you'll get a full refund.
        </p>
      </details>

      <!-- FAQ 4 -->
      <details class="group py-5">
        <summary class="flex items-center justify-between cursor-pointer list-none">
          <span class="font-semibold text-gray-900 dark:text-white text-lg">
            Can I cancel my subscription anytime?
          </span>
          <svg
            class="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <p class="mt-4 text-gray-600 dark:text-gray-300">
          Absolutely. There's a "Cancel Subscription" button in your account settings. One click and you're done — no hoops to jump through, no retention calls, no hassle.
        </p>
      </details>

      <!-- FAQ 5 -->
      <details class="group py-5">
        <summary class="flex items-center justify-between cursor-pointer list-none">
          <span class="font-semibold text-gray-900 dark:text-white text-lg">
            Are there any hidden fees?
          </span>
          <svg
            class="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <p class="mt-4 text-gray-600 dark:text-gray-300">
          None. The price you see is the price you pay. No commissions, no add-ons, no surprise charges. What you see on our pricing page is exactly what you'll be billed.
        </p>
      </details>

      <!-- FAQ 6 -->
      <details class="group py-5">
        <summary class="flex items-center justify-between cursor-pointer list-none">
          <span class="font-semibold text-gray-900 dark:text-white text-lg">
            What are credits and how do they work?
          </span>
          <svg
            class="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <p class="mt-4 text-gray-600 dark:text-gray-300">
          Credits are used for premium features like AI chat and bulk data downloads. Your credits reset monthly based on your plan. Plus gets 150 credits/month, Pro gets 1,000 credits/month — more than enough for active traders.
        </p>
      </details>
    </div>
  </div>
</section>

<!-- Final CTA -->
<section
  class="py-10 sm:py-20 bg-gray-50 dark:bg-[#0f0f11] border-t border-gray-200 dark:border-gray-800"
>
  <div use:inview={{ animation: 'fade-up', duration: 700 }} class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
      Success is well researched
    </h2>
    <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">
      We develop tools that surface unusual trading activity early, giving
      retail investors an informational edge ahead of major market moves.
    </p>
    <label
      for={!data?.user ? "userLogin" : ""}
      on:click={() => {
        if (data?.user) window.location.href = "/pricing";
      }}
      class="inline-flex items-center mt-8 px-5 sm::px-8 py-3 sm:py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded text-[1rem] sm:text-lg transition-all shadow-lg shadow-purple-500/25 cursor-pointer"
    >
      Start 7-Day Free Trial
      <svg
        class="w-5 h-5 ml-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M17 8l4 4m0 0l-4 4m4-4H3"
        />
      </svg>
    </label>
    <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">Cancel anytime</p>
  </div>
</section>

{#if LoginPopup}
  <LoginPopup {form} />
{/if}

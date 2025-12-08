<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
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
  title="Stocknear - Realtime Options Flow & Dark Pool Data"
  description="Track institutional order flow in realtime. See options flow, dark pool trades, and unusual activity before the crowd. Start your free trial today."
  keywords="options flow, dark pool data, unusual options activity, institutional trading, smart money tracking, realtime options data"
/>

<!-- Hero Section -->
<section class="relative overflow-hidden bg-white dark:bg-[#09090B]">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
    <!-- Headline -->
    <div class="text-center max-w-4xl mx-auto">
      <h1
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
        class="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
      >
        Realtime stock prices, options flow, dark pool orders, news, financials,
        forecasts, charts, and more.
      </p>

      <!-- CTA + Trust -->
      <div
        class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        <a
          href="/register"
          class="w-full max-w-56 sm:max-w-full sm:w-auto inline-flex items-center justify-center px-5 py-2 sm:px-8 sm:py-3 bg-gray-100 hover:bg-gray-200 dark:bg-white dark:hover:bg-gray-100 text-gray-900 dark:text-black font-semibold rounded text-[1rem] sm:text-lg transition-all border border-gray-300 dark:border-transparent"
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
          {investorCount.toLocaleString()}+ investors
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
          Real-time Stock & OPRA Data
        </span>
      </div>
    </div>

    <!-- Hero Video - Product first -->
    <div class="mt-16 relative">
      <div
        class="absolute inset-0 bg-gradient-to-t from-white dark:from-[#09090B] to-transparent z-10 pointer-events-none h-32 bottom-0 top-auto"
      ></div>
      <div
        class="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl shadow-gray-900/10 dark:shadow-black/50"
      >
        <video
          class="w-full h-auto"
          autoplay
          loop
          muted
          playsinline
          id="overviewVideo"
        >
          <source src="/video/overview.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  </div>
</section>

<!-- AI Chatbot Section -->
<section
  class="py-20 bg-white dark:bg-[#09090B] border-t border-gray-200 dark:border-gray-800"
>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid lg:grid-cols-2 gap-12 items-center">
      <!-- Content -->
      <div>
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
      <div class="relative">
        <div
          class="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-2xl shadow-purple-500/10"
        >
          <video
            class="w-full aspect-video object-cover"
            autoplay
            loop
            muted
            playsinline
          >
            <source src="/video/ai-agent.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
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
    <div class="text-center mb-16">
      <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
        See What Smart Money Is Buying
      </h2>
      <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">
        The same options flow data institutions pay thousands for
      </p>
    </div>

    <div class="grid -mt-6 sm:mt-0 gap-5 sm:gap-10">
      <!-- Options Flow Card -->
      <div class="relative group">
        <!-- Glow effect -->
        <div
          class="absolute -inset-1 bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 rounded-xl blur-lg opacity-25 group-hover:opacity-40 transition duration-500"
        ></div>

        <div
          class="relative bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-2xl"
        >
          <!-- Video with premium frame -->
          <div class="relative">
            <video
              class="w-full object-contain"
              autoplay
              loop
              muted
              playsinline
              id="optionsFlowVideo"
            >
              <source src="/video/options-flow.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <!-- Bottom gradient fade -->
            <div
              class="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-black to-transparent pointer-events-none"
            ></div>
          </div>
          <script>
            document.getElementById("optionsFlowVideo").playbackRate = 3.0;
          </script>

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
  class="py-20 bg-gray-50 dark:bg-[#0f0f11] border-t border-gray-200 dark:border-gray-800"
>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
        What You'll See Every Day
      </h2>
      <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">
        Real examples of unusual activity our users spot
      </p>
    </div>

    <div class="grid md:grid-cols-3 gap-6">
      <!-- Example 1: Unusual Options Activity -->
      <div
        class="bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        <div
          class="aspect-[16/9] bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20"
        >
          <img
            src="/img/landing-page/unusual-option-trade.png"
            alt="Unusual Options Activity"
            class="w-full h-full object-cover rounded"
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
            <span class="text-xs text-gray-500 dark:text-gray-400"
              >Unusual Activity</span
            >
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white">
            Large Call Sweeps
          </h3>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Spot when institutions aggressively buy calls across multiple
            exchanges — often before major moves.
          </p>
        </div>
      </div>

      <!-- Example 2: Dark Pool Prints -->
      <div
        class="bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        <div
          class="aspect-[4/3] bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 flex items-center justify-center"
        >
          <div class="text-center p-4">
            <div
              class="w-10 h-10 mx-auto mb-2 rounded bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center"
            >
              <svg
                class="w-5 h-5 text-cyan-600 dark:text-cyan-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p class="text-gray-500 dark:text-gray-400 font-medium text-xs">
              dark-pool-example.png
            </p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Screenshot showing block trade
            </p>
          </div>
        </div>
        <div class="p-5">
          <div class="flex items-center gap-2 mb-2">
            <span
              class="px-2 py-0.5 text-xs font-medium bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 rounded-full"
            >
              Dark Pool
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400"
              >Block Trade</span
            >
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white">
            Hidden Block Trades
          </h3>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            See large off-exchange orders that don't show up on regular charts —
            institutions hiding their positions.
          </p>
        </div>
      </div>

      <!-- Example 3: Put/Call Imbalance -->
      <div
        class="bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        <div
          class="aspect-[4/3] bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 flex items-center justify-center"
        >
          <div class="text-center p-4">
            <div
              class="w-10 h-10 mx-auto mb-2 rounded bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center"
            >
              <svg
                class="w-5 h-5 text-amber-600 dark:text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p class="text-gray-500 dark:text-gray-400 font-medium text-xs">
              sentiment-example.png
            </p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Screenshot showing put/call ratio
            </p>
          </div>
        </div>
        <div class="p-5">
          <div class="flex items-center gap-2 mb-2">
            <span
              class="px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full"
            >
              Sentiment
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400"
              >Market Flow</span
            >
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white">
            Put/Call Imbalance
          </h3>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Track when options flow suddenly skews bearish or bullish — early
            warning for sentiment shifts.
          </p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Additional Features Section -->
<section class="py-20 bg-white dark:bg-[#09090B]">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
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
        class="bg-gray-50 dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        <!-- Screenshot Placeholder -->
        <div
          class="aspect-[16/10] bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 flex items-center justify-center border-b border-gray-200 dark:border-gray-800"
        >
          <div class="text-center p-6">
            <div
              class="w-12 h-12 mx-auto mb-3 rounded bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center"
            >
              <svg
                class="w-6 h-6 text-amber-600 dark:text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p class="text-gray-500 dark:text-gray-400 font-medium text-sm">
              why-price-moved-preview.png
            </p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Screenshot of market news feed
            </p>
          </div>
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
            href="/market-news"
            class="inline-flex items-center mt-6 text-amber-600 dark:text-amber-400 font-medium hover:underline"
          >
            View Market News
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
        class="bg-gray-50 dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        <!-- Screenshot Placeholder -->
        <div
          class="aspect-[16/10] bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 flex items-center justify-center border-b border-gray-200 dark:border-gray-800"
        >
          <div class="text-center p-6">
            <div
              class="w-12 h-12 mx-auto mb-3 rounded bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center"
            >
              <svg
                class="w-6 h-6 text-emerald-600 dark:text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p class="text-gray-500 dark:text-gray-400 font-medium text-sm">
              analysts-preview.png
            </p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Screenshot of /analysts page
            </p>
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
            class="inline-flex items-center mt-6 text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
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
  class="py-20 bg-gray-50 dark:bg-[#0f0f11] border-t border-gray-200 dark:border-gray-800"
>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
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
      class="mt-12 text-center p-6 rounded bg-white dark:bg-[#18181B] border border-gray-200 dark:border-gray-800 max-w-4xl mx-auto"
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

<!-- Testimonials Section -->
<section
  class="py-20 bg-gray-50 dark:bg-[#0f0f11] border-t border-gray-200 dark:border-gray-800"
>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-6">
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

<!-- Final CTA -->
<section
  class="py-20 bg-white dark:bg-[#09090B] border-t border-gray-200 dark:border-gray-800"
>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
      class="inline-flex items-center mt-8 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded text-lg transition-all shadow-lg shadow-purple-500/25 cursor-pointer"
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

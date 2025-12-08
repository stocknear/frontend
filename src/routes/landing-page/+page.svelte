<script lang="ts">
  import { onMount } from "svelte";
  import SEO from "$lib/components/SEO.svelte";
  import { mode } from "mode-watcher";

  // Animated counter for social proof
  let investorCount = 0;
  const targetInvestors = 7000;

  function animateCounter() {
    const duration = 1500;
    const steps = 50;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      investorCount = Math.floor(targetInvestors * easeOut);

      if (step >= steps) {
        clearInterval(timer);
        investorCount = targetInvestors;
      }
    }, interval);
  }

  onMount(() => {
    animateCounter();
  });

  // Trustpilot
  const trustpilotScore = 4.6;
</script>

<SEO
  title="Stocknear - Realtime Options Flow & Dark Pool Data"
  description="Track institutional order flow in realtime. See options flow, dark pool trades, and unusual activity before the crowd. Start your free trial today."
  keywords="options flow, dark pool data, unusual options activity, institutional trading, smart money tracking, realtime options data"
/>

<!-- Hero Section -->
<section class="relative overflow-hidden bg-white dark:bg-[#09090B]">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-12">
    <!-- Trust Badge -->
    <div class="flex justify-center mb-8">
      <div class="inline-flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
        <span class="flex items-center">
          <svg class="w-4 h-4 mr-1.5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
          </svg>
          {investorCount.toLocaleString()}+ investors
        </span>
        <span class="text-gray-300 dark:text-gray-600">•</span>
        <a
          href="https://www.trustpilot.com/review/stocknear.com"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg class="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          {trustpilotScore}/5 on Trustpilot
        </a>
      </div>
    </div>

    <!-- Headline -->
    <div class="text-center max-w-3xl mx-auto">
      <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
        See What
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500">
          Smart Money
        </span>
        Sees
      </h1>
      <p class="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
        Realtime options flow and dark pool data. Track institutional trades before the crowd.
      </p>

      <!-- Single CTA -->
      <div class="mt-10">
        <a
          href="/pricing"
          class="inline-flex items-center px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-lg transition-all shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30"
        >
          Start 7-Day Free Trial
          <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
          </svg>
        </a>
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
          No credit card required
        </p>
      </div>
    </div>

    <!-- Hero Screenshot -->
    <div class="mt-16 relative">
      <div class="absolute inset-0 bg-gradient-to-t from-white dark:from-[#09090B] to-transparent z-10 pointer-events-none h-32 bottom-0 top-auto"></div>
      <div class="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl shadow-gray-900/10 dark:shadow-black/50">
        <!-- Placeholder for hero screenshot -->
        <div class="aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
          <div class="text-center p-8">
            <div class="w-16 h-16 mx-auto mb-4 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <svg class="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <p class="text-gray-500 dark:text-gray-400 font-medium">hero-screenshot.png</p>
            <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Full dashboard showing options flow feed</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Features Section - Two Cards -->
<section class="py-20 bg-gray-50 dark:bg-[#0f0f11] border-t border-gray-200 dark:border-gray-800">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
        Two Powerful Data Streams
      </h2>
      <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">
        Everything you need to track institutional activity
      </p>
    </div>

    <div class="grid md:grid-cols-2 gap-8">
      <!-- Options Flow Card -->
      <div class="bg-white dark:bg-[#18181B] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <!-- Screenshot Placeholder -->
        <div class="aspect-[4/3] bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 flex items-center justify-center border-b border-gray-200 dark:border-gray-800">
          <div class="text-center p-6">
            <div class="w-12 h-12 mx-auto mb-3 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <p class="text-gray-500 dark:text-gray-400 font-medium text-sm">options-flow-preview.png</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Screenshot of /options-flow page</p>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Realtime Options Flow
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Direct OPRA feed showing every institutional options trade as it happens.
          </p>
          <ul class="space-y-3">
            <li class="flex items-start text-sm text-gray-600 dark:text-gray-300">
              <svg class="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              Unusual activity detection & alerts
            </li>
            <li class="flex items-start text-sm text-gray-600 dark:text-gray-300">
              <svg class="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              GEX, DEX & full options Greeks
            </li>
            <li class="flex items-start text-sm text-gray-600 dark:text-gray-300">
              <svg class="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              Max pain & open interest analysis
            </li>
            <li class="flex items-start text-sm text-gray-600 dark:text-gray-300">
              <svg class="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              Filter by ticker, premium, expiry
            </li>
          </ul>
          <a
            href="/options-flow"
            class="inline-flex items-center mt-6 text-purple-600 dark:text-purple-400 font-medium hover:underline"
          >
            View Options Flow
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      </div>

      <!-- Dark Pool Card -->
      <div class="bg-white dark:bg-[#18181B] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <!-- Screenshot Placeholder -->
        <div class="aspect-[4/3] bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 flex items-center justify-center border-b border-gray-200 dark:border-gray-800">
          <div class="text-center p-6">
            <div class="w-12 h-12 mx-auto mb-3 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <p class="text-gray-500 dark:text-gray-400 font-medium text-sm">dark-pool-preview.png</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Screenshot of /dark-pool-flow page</p>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Dark Pool & Block Trades
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Track large institutional orders executed off-exchange before they move price.
          </p>
          <ul class="space-y-3">
            <li class="flex items-start text-sm text-gray-600 dark:text-gray-300">
              <svg class="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              Block trades (10,000+ shares)
            </li>
            <li class="flex items-start text-sm text-gray-600 dark:text-gray-300">
              <svg class="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              Price level support/resistance zones
            </li>
            <li class="flex items-start text-sm text-gray-600 dark:text-gray-300">
              <svg class="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              Historical dark pool data (30+ days)
            </li>
            <li class="flex items-start text-sm text-gray-600 dark:text-gray-300">
              <svg class="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              Hottest trades ranking
            </li>
          </ul>
          <a
            href="/dark-pool-flow"
            class="inline-flex items-center mt-6 text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            View Dark Pool Flow
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Additional Features Section -->
<section class="py-20 bg-white dark:bg-[#09090B]">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
        More Than Just Flow Data
      </h2>
      <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">
        Tools that give you an edge in every trade
      </p>
    </div>

    <div class="grid md:grid-cols-2 gap-8">
      <!-- Why Price Moved Card -->
      <div class="bg-gray-50 dark:bg-[#18181B] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <!-- Screenshot Placeholder -->
        <div class="aspect-[16/10] bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 flex items-center justify-center border-b border-gray-200 dark:border-gray-800">
          <div class="text-center p-6">
            <div class="w-12 h-12 mx-auto mb-3 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <svg class="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <p class="text-gray-500 dark:text-gray-400 font-medium text-sm">why-price-moved-preview.png</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Screenshot of market news feed</p>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6">
          <div class="flex items-center gap-2 mb-2">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white">
              Why Price Moved
            </h3>
            <span class="px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full">
              Realtime
            </span>
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            One-sentence explanations of why stocks are moving. We cut through noise from news, press releases and SEC filings to pinpoint the trigger.
          </p>
          <ul class="space-y-3">
            <li class="flex items-start text-sm text-gray-600 dark:text-gray-300">
              <svg class="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              Instant price movement explanations
            </li>
            <li class="flex items-start text-sm text-gray-600 dark:text-gray-300">
              <svg class="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              Aggregated from news & SEC filings
            </li>
            <li class="flex items-start text-sm text-gray-600 dark:text-gray-300">
              <svg class="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              No noise, just the signal
            </li>
          </ul>
          <a
            href="/market-news"
            class="inline-flex items-center mt-6 text-amber-600 dark:text-amber-400 font-medium hover:underline"
          >
            View Market News
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      </div>

      <!-- Wall Street Analysts Card -->
      <div class="bg-gray-50 dark:bg-[#18181B] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <!-- Screenshot Placeholder -->
        <div class="aspect-[16/10] bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 flex items-center justify-center border-b border-gray-200 dark:border-gray-800">
          <div class="text-center p-6">
            <div class="w-12 h-12 mx-auto mb-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
              <svg class="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <p class="text-gray-500 dark:text-gray-400 font-medium text-sm">analysts-preview.png</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Screenshot of /analysts page</p>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6">
          <div class="flex items-center gap-2 mb-2">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white">
              Wall Street Analysts
            </h3>
            <span class="px-2 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full">
              Ranked
            </span>
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Track top analysts with their historic performance. See who actually makes money and who doesn't before following their calls.
          </p>
          <ul class="space-y-3">
            <li class="flex items-start text-sm text-gray-600 dark:text-gray-300">
              <svg class="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              Success rate & win rate tracking
            </li>
            <li class="flex items-start text-sm text-gray-600 dark:text-gray-300">
              <svg class="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              Average return per rating
            </li>
            <li class="flex items-start text-sm text-gray-600 dark:text-gray-300">
              <svg class="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              Instant updates on new ratings
            </li>
          </ul>
          <a
            href="/analysts"
            class="inline-flex items-center mt-6 text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
          >
            View Top Analysts
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Pricing Section -->
<section class="py-20 bg-gray-50 dark:bg-[#0f0f11] border-t border-gray-200 dark:border-gray-800">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
        Simple, Transparent Pricing
      </h2>
      <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">
        Start free. Upgrade when you're ready.
      </p>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <!-- Plus Tier -->
      <div class="bg-gray-50 dark:bg-[#18181B] rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white">Plus</h3>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Essential tools</p>
        <div class="mt-6">
          <span class="text-4xl font-bold text-gray-900 dark:text-white">$10</span>
          <span class="text-gray-500 dark:text-gray-400">/mo</span>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">or $7.50/mo billed annually</p>

        <ul class="mt-8 space-y-4">
          <li class="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <svg class="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            100 AI Credits/month
          </li>
          <li class="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <svg class="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            Hedge Fund & Congress data
          </li>
          <li class="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <svg class="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            Stock Screener & Financials
          </li>
          <li class="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <svg class="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            No ads
          </li>
        </ul>

        <a
          href="/pricing"
          class="mt-8 block w-full py-3 px-4 text-center font-semibold rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          Start Free Trial
        </a>
      </div>

      <!-- Pro Tier -->
      <div class="bg-[#18181B] rounded-2xl border-2 border-purple-500 p-8 relative">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-500 text-white text-xs font-semibold rounded-full">
          Best Value
        </div>
        <h3 class="text-xl font-bold text-white">Pro</h3>
        <p class="text-gray-400 mt-1">Full access to everything</p>
        <div class="mt-6">
          <span class="text-4xl font-bold text-white">$35</span>
          <span class="text-gray-400">/mo</span>
        </div>
        <p class="text-sm text-gray-400 mt-1">or $25/mo billed annually</p>

        <ul class="mt-8 space-y-4">
          <li class="flex items-center text-sm text-gray-200">
            <svg class="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            <strong class="text-white">Realtime</strong>&nbsp;Options Flow
          </li>
          <li class="flex items-center text-sm text-gray-200">
            <svg class="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            <strong class="text-white">Realtime</strong>&nbsp;Dark Pool Data
          </li>
          <li class="flex items-center text-sm text-gray-200">
            <svg class="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            1,000 AI Credits/month
          </li>
          <li class="flex items-center text-sm text-gray-200">
            <svg class="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            GEX, DEX & Full Greeks
          </li>
          <li class="flex items-center text-sm text-gray-200">
            <svg class="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            Everything in Plus
          </li>
        </ul>

        <a
          href="/pricing"
          class="mt-8 block w-full py-3 px-4 text-center font-semibold rounded-xl bg-purple-500 text-white hover:bg-purple-600 transition-colors"
        >
          Start Free Trial
        </a>
      </div>
    </div>
  </div>
</section>

<!-- Testimonials Section -->
<section class="py-20 bg-gray-50 dark:bg-[#0f0f11] border-t border-gray-200 dark:border-gray-800">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <a
        href="https://www.trustpilot.com/review/stocknear.com"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center text-lg font-medium text-gray-900 dark:text-white hover:underline"
      >
        <svg class="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        {trustpilotScore}/5 on Trustpilot
      </a>
    </div>

    <div class="grid md:grid-cols-3 gap-6">
      <!-- Testimonial 1 -->
      <div class="bg-white dark:bg-[#18181B] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
        <div class="flex mb-3">
          {#each Array(5) as _}
            <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          {/each}
        </div>
        <p class="text-gray-600 dark:text-gray-300 text-sm">
          "Offers premium features for an affordable price. There are usually new features being rolled out weekly."
        </p>
        <p class="mt-4 text-sm font-medium text-gray-900 dark:text-white">Pat</p>
      </div>

      <!-- Testimonial 2 -->
      <div class="bg-white dark:bg-[#18181B] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
        <div class="flex mb-3">
          {#each Array(5) as _}
            <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          {/each}
        </div>
        <p class="text-gray-600 dark:text-gray-300 text-sm">
          "The information that the site provides is top notch. They have great support and always improving."
        </p>
        <p class="mt-4 text-sm font-medium text-gray-900 dark:text-white">Dean</p>
      </div>

      <!-- Testimonial 3 -->
      <div class="bg-white dark:bg-[#18181B] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
        <div class="flex mb-3">
          {#each Array(5) as _}
            <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          {/each}
        </div>
        <p class="text-gray-600 dark:text-gray-300 text-sm">
          "Perfect for Beginners and Pros Alike! The founder is very responsive and helps build features."
        </p>
        <p class="mt-4 text-sm font-medium text-gray-900 dark:text-white">GoldFish</p>
      </div>
    </div>
  </div>
</section>

<!-- Final CTA -->
<section class="py-20 bg-white dark:bg-[#09090B] border-t border-gray-200 dark:border-gray-800">
  <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
      Ready to see what smart money sees?
    </h2>
    <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">
      Join {investorCount.toLocaleString()}+ investors tracking institutional flow.
    </p>
    <a
      href="/pricing"
      class="inline-flex items-center mt-8 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-lg transition-all shadow-lg shadow-purple-500/25"
    >
      Start Your Free Trial
      <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
      </svg>
    </a>
    <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
      7-day free trial · No credit card required
    </p>
  </div>
</section>

<script lang="ts">
  export let data;
</script>

<section class="w-full overflow-hidden">
  <div class="w-full overflow-hidden m-auto">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex flex-col lg:flex-row justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:w-3/4 lg:pr-10">
          <slot />
        </main>

        <aside class="inline-block relative w-full lg:w-1/4 mt-3">
          {#if !["Pro", "Plus"]?.includes(data?.user?.tier)}
            <div
              class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
            >
              <a
                href="/pricing"
                class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
              >
                <div class="w-full flex justify-between items-center p-3 mt-3">
                  <h2 class="text-start text-xl font-semibold sm:ml-3">
                    Pro Subscription
                  </h2>
                </div>
                <span class=" p-3 sm:ml-3 sm:mr-3 -mt-4">
                  Upgrade now for unlimited access to all data, tools and no
                  ads.
                </span>
              </a>
            </div>
          {/if}

          {#if data?.getAIScore?.backtest?.length > 0}
            <div
              class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4"
            >
              <h3 class="p-2 pt-4 text-xl font-semibold">
                AI Score Definition
              </h3>
              <div class=" p-2">
                The AI Score leverages advanced machine learning algorithms that
                analyze a comprehensive blend of technical indicators,
                fundamental metrics, market sentiment data, and historical price
                patterns to forecast short-term stock momentum over the next 30
                days. Scored on a scale of 1-10, where scores of 7+ indicate
                bullish sentiment, 4-6 suggest neutral/sideways movement, and
                1-3 signal bearish conditions. Higher scores reflect greater
                statistical confidence in the directional prediction, backed by
                rigorous backtesting across multiple market cycles.
              </div>
              <!--
            <div class="px-2">
              <a
                href="/blog/article/revenue"
                class="flex justify-center items-center rounded cursor-pointer w-full py-2 mt-3 text-[1rem] text-center font-semibold text-white dark:text-black m-auto sm:hover:bg-muted dark:sm:hover:bg-gray-300 bg-black dark:bg-[#fff] transition duration-100"
              >
                Full Definition
              </a>
            </div>
            -->
            </div>
          {/if}

          {#if Object?.keys(data?.getPriceAnalysis)?.length > 0}
            <div
              class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4"
            >
              <h3 class="p-2 pt-4 text-xl font-semibold">
                AI Trend Forecast Definition
              </h3>
              <div class=" p-2">
                The AI Trend Model forecasts stock trends by analyzing
                historical price data. It detects patterns, seasonality, and
                trends to predict future price movements, making it useful for
                predicting price targets for the next 12 months.
              </div>
              <!--
            <div class="px-2">
              <a
                href="/blog/article/revenue"
                class="flex justify-center items-center rounded cursor-pointer w-full py-2 mt-3 text-[1rem] text-center font-semibold text-white dark:text-black m-auto sm:hover:bg-muted dark:sm:hover:bg-gray-300 bg-black dark:bg-[#fff] transition duration-100"
              >
                Full Definition
              </a>
            </div>
            -->
            </div>
          {/if}
        </aside>
      </div>
    </div>
  </div>
</section>

<script lang="ts">
  import {
  stock_detail_forecast_ai_aside_pro_desc,
  stock_detail_forecast_ai_aside_pro_title,
  stock_detail_forecast_ai_aside_score_desc,
  stock_detail_forecast_ai_aside_score_title,
  stock_detail_forecast_ai_aside_trend_desc,
  stock_detail_forecast_ai_aside_trend_title,
} from "$lib/paraglide/messages";
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
              class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 p-4 mt-4"
            >
              <a
                href="/pricing"
                class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
              >
                <div class="w-full flex justify-between items-center p-3 mt-3">
                  <h2 class="text-start text-xl font-semibold sm:ml-3">
                    {stock_detail_forecast_ai_aside_pro_title()}
                  </h2>
                </div>
                <span class=" p-3 sm:ml-3 sm:mr-3 -mt-4">
                  {stock_detail_forecast_ai_aside_pro_desc()}
                </span>
              </a>
            </div>
          {/if}

          {#if data?.getAIScore?.backtest?.length > 0}
            <div
              class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 p-4 mt-4"
            >
              <h3 class="p-2 pt-4 text-xl font-semibold">
                {stock_detail_forecast_ai_aside_score_title()}
              </h3>
              <div class=" p-2">
                {stock_detail_forecast_ai_aside_score_desc()}
              </div>
              <!--
            <div class="px-2">
              <a
                href="/learning-center/article/revenue"
                class="flex justify-center items-center rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 cursor-pointer w-full py-2.5 mt-3 text-sm text-center font-semibold transition hover:bg-gray-800 dark:hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/40"
              >
                Full Definition
              </a>
            </div>
            -->
            </div>
          {/if}

          {#if Object?.keys(data?.getPriceAnalysis)?.length > 0}
            <div
              class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 p-4 mt-4"
            >
              <h3 class="p-2 pt-4 text-xl font-semibold">
                {stock_detail_forecast_ai_aside_trend_title()}
              </h3>
              <div class=" p-2">
                {stock_detail_forecast_ai_aside_trend_desc()}
              </div>
              <!--
            <div class="px-2">
              <a
                href="/learning-center/article/revenue"
                class="flex justify-center items-center rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 cursor-pointer w-full py-2.5 mt-3 text-sm text-center font-semibold transition hover:bg-gray-800 dark:hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/40"
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

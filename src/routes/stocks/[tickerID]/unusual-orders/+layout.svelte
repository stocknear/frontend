<script lang="ts">
  import { stockTicker } from "$lib/store";
  import {
    stock_detail_unusual_orders_pro_subscription,
    stock_detail_unusual_orders_pro_description,
    stock_detail_unusual_orders_block_order,
    stock_detail_unusual_orders_block_order_description,
    stock_detail_unusual_orders_dark_pool_order,
    stock_detail_unusual_orders_dark_pool_description,
    stock_detail_unusual_orders_full_definition,
    stock_detail_unusual_orders_unusual_order_flow,
    stock_detail_unusual_orders_follow_whales,
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
                    {stock_detail_unusual_orders_pro_subscription()}
                  </h2>
                </div>
                <span class=" p-3 sm:ml-3 sm:mr-3 -mt-4">
                  {stock_detail_unusual_orders_pro_description()}
                </span>
              </a>
            </div>
          {/if}

          <div
            class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 p-4 mt-4"
          >
            <h3 class="p-2 pt-4 text-xl font-semibold">
              {stock_detail_unusual_orders_block_order()}
            </h3>
            <div class="p-2">
              {stock_detail_unusual_orders_block_order_description()}
            </div>

            <div class="px-2">
              <a
                href="/learning-center/article/block-trade-how-large-institutional-orders-work"
                class="flex justify-center items-center rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 cursor-pointer w-full py-2.5 mt-3 text-sm text-center font-semibold transition hover:bg-gray-800 dark:hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/40"
              >
                {stock_detail_unusual_orders_full_definition()}
              </a>
            </div>
          </div>

          <div
            class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 p-4 mt-4"
          >
            <h3 class="p-2 pt-4 text-xl font-semibold">
              {stock_detail_unusual_orders_dark_pool_order()}
            </h3>
            <div class=" p-2">
              {stock_detail_unusual_orders_dark_pool_description()}
            </div>

            <div class="px-2">
              <a
                href="/learning-center/article/dark-pool-how-offexchange-trading-works"
                class="flex justify-center items-center rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 cursor-pointer w-full py-2.5 mt-3 text-sm text-center font-semibold transition hover:bg-gray-800 dark:hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/40"
              >
                {stock_detail_unusual_orders_full_definition()}
              </a>
            </div>
          </div>

          <div
            class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 p-4 mt-4"
          >
            <a
              href={`/unusual-order-flow?query=${$stockTicker}`}
              class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-xl font-bold ml-3">
                  {stock_detail_unusual_orders_unusual_order_flow()}
                </h2>
              </div>
              <span class="p-3 ml-3 mr-3">
                {stock_detail_unusual_orders_follow_whales()}
              </span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
</section>

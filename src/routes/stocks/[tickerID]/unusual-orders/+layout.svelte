<script lang="ts">
  import ArrowLogo from "lucide-svelte/icons/move-up-right";

  import { stockTicker } from "$lib/store";
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
              class="w-full border border-gray-200/70 dark:border-zinc-800/80 rounded-2xl bg-white/70 dark:bg-zinc-950/40 p-4 mt-4"
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

          <div
            class="w-full border border-gray-200/70 dark:border-zinc-800/80 rounded-2xl bg-white/70 dark:bg-zinc-950/40 p-4 mt-4"
          >
            <h3 class="p-2 pt-4 text-xl font-semibold">Block Order</h3>
            <div class="p-2">
              Block orders are large, institution-sized transactions executed on
              public exchanges (not off-exchange) with a minimum size of 10,000
              shares. Because they occur on exchanges rather than in dark pools,
              block orders are visible to market data feeds and signal
              meaningful institutional accumulation or distribution.
            </div>

            <div class="px-2">
              <a
                href="/blog/article/block-trade"
                class="flex justify-center items-center rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 cursor-pointer w-full py-2.5 mt-3 text-sm text-center font-semibold transition hover:bg-gray-800 dark:hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/40"
              >
                Full Definition
              </a>
            </div>
          </div>

          <div
            class="w-full border border-gray-200/70 dark:border-zinc-800/80 rounded-2xl bg-white/70 dark:bg-zinc-950/40 p-4 mt-4"
          >
            <h3 class="p-2 pt-4 text-xl font-semibold">Dark Pool Order</h3>
            <div class=" p-2">
              Dark pools are private, off-exchange venues where large
              institutions anonymously trade blocks of securities to minimize
              market impact and information leakage—revealing institutional
              positioning before retail investors catch on.
            </div>

            <div class="px-2">
              <a
                href="/blog/article/dark-pool"
                class="flex justify-center items-center rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 cursor-pointer w-full py-2.5 mt-3 text-sm text-center font-semibold transition hover:bg-gray-800 dark:hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/40"
              >
                Full Definition
              </a>
            </div>
          </div>

          <div
            class="w-full border border-gray-200/70 dark:border-zinc-800/80 rounded-2xl bg-white/70 dark:bg-zinc-950/40 p-4 mt-4"
          >
            <a
              href={`/dark-pool-flow?query=${$stockTicker}`}
              class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-xl font-bold ml-3">
                  Unusual Order Flow
                </h2>
                <ArrowLogo
                  class="w-8 h-8 mr-3 shrink-0 text-gray-400 dark:text-white"
                />
              </div>
              <span class="p-3 ml-3 mr-3">
                Follow the order feed of big whales in realtime
              </span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
</section>

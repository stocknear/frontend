<script lang="ts">
  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
  import {
  stock_detail_stats_company,
  stock_detail_stats_ftd_avg_volume_header,
  stock_detail_stats_ftd_definition,
  stock_detail_stats_ftd_definition_title,
  stock_detail_stats_ftd_rankings,
  stock_detail_stats_full_definition,
  stock_detail_stats_pro_subscription,
  stock_detail_stats_related_stocks,
  stock_detail_stats_upgrade_desc,
} from "$lib/paraglide/messages";

  export let data;
  const similarStocks = data?.getSimilarStocks?.sort(
    (a, b) => b?.relativeFTD - a?.relativeFTD,
  );
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
                    {stock_detail_stats_pro_subscription()}
                  </h2>
                </div>
                <span class=" p-3 sm:ml-3 sm:mr-3 -mt-4">
                  {stock_detail_stats_upgrade_desc()}
                </span>
              </a>
            </div>
          {/if}

          <div
            class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 p-4 mt-4"
          >
            <h3 class="p-2 pt-4 text-xl font-semibold">
              {stock_detail_stats_ftd_definition_title()}
            </h3>
            <div class=" p-2">
              {stock_detail_stats_ftd_definition()}
            </div>

            <div class="px-2">
              <a
                href="/learning-center/article/failtodeliver-shares"
                class="flex justify-center items-center rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 cursor-pointer w-full py-2.5 mt-3 text-sm text-center font-semibold transition hover:bg-gray-800 dark:hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/40"
              >
                {stock_detail_stats_full_definition()}
              </a>
            </div>
          </div>

          {#if similarStocks?.length > 0 && similarStocks?.at(0)?.relativeFTD}
            <div
              class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 p-4 mt-4"
            >
              <h3 class="p-2 pt-4 text-xl font-semibold">{stock_detail_stats_related_stocks()}</h3>
              <table
                class="table table-sm table-compact w-full text-sm text-gray-700 dark:text-zinc-200 tabular-nums"
              >
                <thead
                  class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                  ><tr
                    ><th
                      class="whitespace-nowrap border-b border-gray-300 dark:border-zinc-700 text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400 font-semibold text-left px-2"
                      >{stock_detail_stats_company()}</th
                    >
                    <th
                      class="whitespace-nowrap border-b border-gray-300 dark:border-zinc-700 text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400 font-semibold text-right px-2"
                      >{stock_detail_stats_ftd_avg_volume_header()}</th
                    ></tr
                  ></thead
                >
                <tbody>
                  {#each similarStocks?.slice(0, 8) as item, index}
                    {#if item?.relativeFTD > 0}
                      <tr
                        class="border-gray-300 dark:border-zinc-700 text-sm {index !==
                        similarStocks?.slice(0, 8).length - 1
                          ? 'border-b'
                          : ''} "
                        ><td class="text-left text-sm px-2"
                          ><a
                            href={`/stocks/${item?.symbol}`}
                            class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                            >{removeCompanyStrings(item?.name)}</a
                          ></td
                        >
                        <td class="text-right text-sm px-2"
                          >{item?.relativeFTD > 0.01
                            ? abbreviateNumber(item?.relativeFTD) + "%"
                            : "< 0.01%"}</td
                        >
                      </tr>
                    {/if}
                  {/each}
                </tbody>
              </table>
              <div class="px-2">
                <a
                  href="/list/most-ftd-shares"
                  class="flex justify-center items-center rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 cursor-pointer w-full py-2.5 mt-3 text-sm text-center font-semibold transition hover:bg-gray-800 dark:hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/40"
                >
                  {stock_detail_stats_ftd_rankings()}
                </a>
              </div>
            </div>
          {/if}
        </aside>
      </div>
    </div>
  </div>
</section>

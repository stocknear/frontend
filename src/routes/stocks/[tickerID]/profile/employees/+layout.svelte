<script lang="ts">
  import { stockTicker } from "$lib/store";
  import * as m from "$lib/paraglide/messages";

  export let data;

  let similarStocks;
  let newsList = data?.getNews ?? [];

  const formatDate = (dateString) => {
    // Create a date object for the input dateString
    const inputDate = new Date(dateString);

    // Create a date object for the current time in New York City
    const nycTime = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
    });
    const currentNYCDate = new Date(nycTime);

    // Calculate the difference in milliseconds
    const difference = inputDate.getTime() - currentNYCDate.getTime();

    // Convert the difference to minutes
    const minutes = Math.abs(Math.round(difference / (1000 * 60)));

    if (minutes < 60) {
      const unit = minutes === 1 ? m.time_minute() : m.time_minutes();
      return m.time_ago({ count: minutes, unit });
    } else if (minutes < 1440) {
      const hours = Math.round(minutes / 60);
      const unit = hours === 1 ? m.time_hour() : m.time_hours();
      return m.time_ago({ count: hours, unit });
    } else {
      const days = Math.round(minutes / 1440);
      const unit = days === 1 ? m.time_day() : m.time_days();
      return m.time_ago({ count: days, unit });
    }
  };

  $: {
    if ($stockTicker) {
      similarStocks = data?.getSimilarStocks?.sort(
        (a, b) => b?.employees - a?.employees,
      );
    }
  }
</script>

<section class="w-full overflow-hidden">
  <div class="w-full overflow-hidden m-auto">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:w-3/4 lg:pr-10">
          <slot />
        </main>

        <aside class="hidden lg:block relative fixed w-1/4 mt-3">
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
                    {m.stock_detail_stats_pro_subscription()}
                  </h2>
                </div>
                <span class=" p-3 sm:ml-3 sm:mr-3 -mt-4">
                  {m.stock_detail_stats_upgrade_desc()}
                </span>
              </a>
            </div>
          {/if}

          {#if similarStocks?.length > 0}
            <div
              class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 p-4 mt-4"
            >
              <h3 class="p-2 pt-4 text-2xl font-semibold">{m.stock_detail_stats_related_stocks()}</h3>
              <table
                class="table table-sm table-compact w-full text-sm text-gray-700 dark:text-zinc-200 tabular-nums"
              >
                <thead
                  class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                  ><tr
                    ><th
                      class="whitespace-nowrap border-b border-gray-300 dark:border-zinc-700 text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400 font-semibold text-left px-2"
                      >{m.stock_detail_stats_company()}</th
                    >
                    <th
                      class="whitespace-nowrap border-b border-gray-300 dark:border-zinc-700 text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400 font-semibold text-right px-2"
                      >{m.stock_detail_employees()}</th
                    ></tr
                  ></thead
                >
                <tbody>
                  {#each similarStocks?.slice(0, 8) as item, index}
                    {#if item?.name}
                      <tr
                        class="border-gray-300 dark:border-zinc-700 {index !==
                        similarStocks?.slice(0, 8).length - 1
                          ? 'border-b'
                          : ''}"
                        ><td class="text-left px-2"
                          ><a
                            href={`/stocks/${item?.symbol}/profile/employees`}
                            class="text-sm text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                            >{item?.name?.length > 30
                              ? item?.name?.slice(0, 30) + "..."
                              : item?.name}</a
                          ></td
                        >
                        <td class="text-right text-sm cursor-normal px-2"
                          >{item?.employees !== null &&
                          item?.employees !== undefined
                            ? parseFloat(item?.employees).toLocaleString(
                                "en-US",
                                {
                                  maximumFractionDigits: 2,
                                  minimumFractionDigits: 0,
                                },
                              )
                            : "n/a"}</td
                        >
                      </tr>
                    {/if}
                  {/each}
                </tbody>
              </table>
              <div class="px-2">
                <a
                  href={`/list/most-employees`}
                  class="flex justify-center items-center rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 cursor-pointer w-full py-2.5 mt-3 text-sm text-center font-semibold transition hover:bg-gray-800 dark:hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/40"
                >
                  {m.stock_detail_employees_rankings()}
                </a>
              </div>
            </div>
          {/if}

          {#if newsList?.length !== 0}
            <div
              class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 p-4 mt-4"
            >
              <div class="p-4 text-sm">
                <h3 class="text-lg font-semibold mb-3">
                  {m.stock_detail_stats_ticker_news({ ticker: $stockTicker })}
                </h3>
                <ul class=" mb-3">
                  {#each newsList?.slice(0, 10) as item}
                    <li class="mb-3 last:mb-1">
                      {formatDate(item?.publishedDate)} -
                      <a
                        class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                        href={item?.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow">{item?.title}</a
                      >
                      - {item?.site}
                    </li>
                  {/each}
                </ul>
                <a
                  href={`/stocks/${$stockTicker}`}
                  class="flex justify-center items-center rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 cursor-pointer w-full py-2.5 mt-3 text-sm text-center font-semibold transition hover:bg-gray-800 dark:hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/40"
                >
                  {m.stock_detail_more_news()}
                </a>
              </div>
            </div>
          {/if}
        </aside>
      </div>
    </div>
  </div>
</section>

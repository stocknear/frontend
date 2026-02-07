<script lang="ts">
  import { etfTicker } from "$lib/store";
  import {
    stock_detail_dividends_definition_text,
    stock_detail_dividends_definition_title,
    stock_detail_dividends_full_definition,
    stock_detail_stats_pro_subscription,
    stock_detail_stats_ticker_news,
    stock_detail_stats_upgrade_desc,
    time_ago,
    time_day,
    time_days,
    time_hour,
    time_hours,
    time_minute,
    time_minutes,
  } from "$lib/paraglide/messages";

  export let data;

  const formatDate = (dateString) => {
    const inputDate = new Date(dateString);
    const nycTime = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
    });
    const currentNYCDate = new Date(nycTime);
    const difference = inputDate.getTime() - currentNYCDate.getTime();
    const minutes = Math.abs(Math.round(difference / (1000 * 60)));

    if (minutes < 60) {
      const unit = minutes === 1 ? time_minute() : time_minutes();
      return time_ago({ count: minutes, unit });
    } else if (minutes < 1440) {
      const hours = Math.round(minutes / 60);
      const unit = hours === 1 ? time_hour() : time_hours();
      return time_ago({ count: hours, unit });
    } else {
      const days = Math.round(minutes / 1440);
      const unit = days === 1 ? time_day() : time_days();
      return time_ago({ count: days, unit });
    }
  };

  let newsList = data?.getNews ?? [];
</script>

<section class="w-auto overflow-hidden min-h-screen">
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
              class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
            >
              <a
                href="/pricing"
                class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
              >
                <div class="w-full flex justify-between items-center p-3 mt-3">
                  <h2 class="text-start text-lg font-semibold ml-3">
                    {stock_detail_stats_pro_subscription()}
                  </h2>
                </div>
                <span
                  class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
                >
                  {stock_detail_stats_upgrade_desc()}
                </span>
              </a>
            </div>
          {/if}

          <div
            class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 p-4 mt-4"
          >
            <h3 class="p-2 pt-4 text-xl font-semibold">{stock_detail_dividends_definition_title()}</h3>
            <div class="p-2">
              {stock_detail_dividends_definition_text()}
            </div>

            <div class="px-2">
              <a
                href="/learning-center/article/dividends-how-companies-pay-shareholders"
                class="flex justify-center items-center rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 cursor-pointer w-full py-2.5 mt-3 text-sm text-center font-semibold transition hover:bg-gray-800 dark:hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/40"
              >
                {stock_detail_dividends_full_definition()}
              </a>
            </div>
          </div>

          {#if newsList?.length !== 0}
            <div
              class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 p-4 mt-4"
            >
              <div class="p-4 text-sm">
                <h3 class="text-lg font-semibold mb-3">
                  {stock_detail_stats_ticker_news({ ticker: $etfTicker })}
                </h3>
                <ul class="">
                  {#each newsList?.slice(0, 10) as item}
                    <li class="mb-3 last:mb-1">
                      {formatDate(item?.publishedDate)} &#183;
                      <a
                        class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400"
                        href={item?.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow">{item?.title}</a
                      >
                      - {item?.site}
                    </li>
                  {/each}
                </ul>
              </div>
            </div>
          {/if}
        </aside>
      </div>
    </div>
  </div>
</section>

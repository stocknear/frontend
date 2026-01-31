<script lang="ts">
  import { stockTicker } from "$lib/store";
  import { page } from "$app/stores";
  import {
    stock_detail_insider_nav_13f_institute,
    stock_detail_insider_nav_insider_trading,
    stock_detail_insider_nav_transcripts,
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

  let newsList = data?.getNews ?? [];

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

  let displaySubSection = "";

  if (!displaySubSection || displaySubSection.length === 0) {
    const parts = $page?.url?.pathname.split("/");
    const sectionMap = {
      institute: "institute",
      "congress-trading": "congress-trading",
      transcripts: "transcripts",
    };

    const foundSection = parts?.find((part) =>
      Object?.values(sectionMap)?.includes(part),
    );

    displaySubSection =
      Object?.keys(sectionMap)?.find(
        (key) => sectionMap[key] === foundSection,
      ) || "insider";
  }

  function changeSubSection(state) {
    const subSectionMap = {
      "congress-trading": "/insider/congress-trading",
      institute: "/insider/institute",
      transcripts: "/insider/transcripts",
    };

    if (state !== "insider" && subSectionMap[state]) {
      displaySubSection = state;
    } else {
      displaySubSection = state;
    }
  }
</script>

<section class="w-full overflow-hidden">
  <div class="w-full overflow-hidden m-auto">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex flex-col lg:flex-row justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:w-3/4 lg:pr-10">
          <nav
            class=" sm:ml-4 sm:pt-2 text-sm whitespace-nowrap overflow-x-auto border-b border-gray-300 dark:border-zinc-700"
          >
            <ul
              class="flex flex-row items-center w-full gap-1 pb-2 text-sm sm:text-base"
            >
              <a
                href={`/stocks/${$stockTicker}/insider`}
                on:click={() => changeSubSection("insider")}
                class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
                'insider'
                  ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                  : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
              >
                {stock_detail_insider_nav_insider_trading()}
              </a>

              <a
                href={`/stocks/${$stockTicker}/insider/institute`}
                on:click={() => changeSubSection("institute")}
                class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
                'institute'
                  ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                  : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
              >
                {stock_detail_insider_nav_13f_institute()}
              </a>
              <!--
              <a
                href={`/stocks/${$stockTicker}/insider/congress-trading`}
                on:click={() => changeSubSection("congress-trading")}
                class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
                'congress-trading'
                  ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                  : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
              >
                Congress Trading
              </a>
              -->
              <a
                href={`/stocks/${$stockTicker}/insider/transcripts`}
                on:click={() => changeSubSection("transcripts")}
                class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
                'transcripts'
                  ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                  : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
              >
                {stock_detail_insider_nav_transcripts()}
              </a>
            </ul>
          </nav>

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

          {#if newsList?.length !== 0}
            <div
              class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 p-4 mt-4"
            >
              <div class="p-4 text-sm">
                <h3 class="text-lg font-semibold mb-3">
                  {stock_detail_stats_ticker_news({ ticker: $stockTicker })}
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

<style lang="scss">
  .scrollbar {
    display: grid;
    grid-gap: 17px;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    grid-auto-flow: column;
    overflow-x: auto;
    scrollbar-width: thin; /* Hide the default scrollbar in Firefox */
    scrollbar-color: transparent transparent; /* Hide the default scrollbar in Firefox */
  }

  /* Custom scrollbar for Webkit (Chrome, Safari) */
  .scrollbar::-webkit-scrollbar {
    width: 0; /* Hide the width of the scrollbar */
    height: 0; /* Hide the height of the scrollbar */
  }

  .scrollbar::-webkit-scrollbar-thumb {
    background: transparent; /* Make the thumb transparent */
  }

  ::-webkit-scrollbar {
    height: 7px;
    width: 10px;
    background: #09090b;
  }

  ::-webkit-scrollbar-thumb {
    background: #6b6f79;
    -webkit-border-radius: 1ex;
  }

  ::-webkit-scrollbar-corner {
    background: #09090b;
  }
</style>

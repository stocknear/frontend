<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import { getLastTradingDay } from "$lib/utils";
  import { page } from "$app/stores";
  import { displayTitle, displayDate } from "$lib/store";
  import {
    common_home,
    layout_market_mover,
    market_mover_category_losers,
    market_mover_display_title_3y,
    market_mover_display_title_5y,
    market_mover_display_title_month,
    market_mover_display_title_today,
    market_mover_display_title_week,
    market_mover_display_title_year,
    market_mover_losers_seo_description,
    market_mover_losers_seo_title_period,
    market_mover_losers_seo_title_today,
    market_mover_losers_structured_description,
    market_mover_losers_structured_main_description,
    market_mover_losers_structured_main_name,
    market_mover_losers_structured_name_period,
    market_mover_losers_structured_name_today,
    market_mover_period_label_3y,
    market_mover_period_label_5y,
    market_mover_period_label_month,
    market_mover_period_label_week,
    market_mover_period_label_year,
    market_mover_period_month,
    market_mover_period_today,
    market_mover_period_week,
    market_mover_period_year,
    market_mover_tab_losers,
  } from "$lib/paraglide/messages.js";

  export let data;
  const lastTradingDay = new Date(getLastTradingDay() ?? null)?.toLocaleString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    },
  );
  let timePeriod;
  let seoTitle = "";
  let seoDescription = "";
  let structuredData = {};

  $: categoryLabel = market_mover_category_losers();
  $: displayTitleMap = {
    losers: market_mover_display_title_today({ category: categoryLabel }),
    week: market_mover_display_title_week({ category: categoryLabel }),
    month: market_mover_display_title_month({ category: categoryLabel }),
    year: market_mover_display_title_year({ category: categoryLabel }),
    "3Y": market_mover_display_title_3y({ category: categoryLabel }),
    "5Y": market_mover_display_title_5y({ category: categoryLabel }),
  };
  $: periodLabelMap = {
    week: market_mover_period_label_week(),
    month: market_mover_period_label_month(),
    year: market_mover_period_label_year(),
    "3Y": market_mover_period_label_3y(),
    "5Y": market_mover_period_label_5y(),
  };

  $: {
    const pathSegments = $page.url.pathname.split("/");
    timePeriod = pathSegments[pathSegments.length - 1];

    const periodLabel = periodLabelMap[timePeriod];

    $displayTitle = displayTitleMap[timePeriod] ?? categoryLabel;
    $displayDate = lastTradingDay;

    seoTitle =
      timePeriod === "losers"
        ? market_mover_losers_seo_title_today()
        : market_mover_losers_seo_title_period({ period: periodLabel });

    seoDescription = market_mover_losers_seo_description();

    structuredData = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name:
        timePeriod === "losers"
          ? market_mover_losers_structured_name_today()
          : market_mover_losers_structured_name_period({ period: periodLabel }),
      description: market_mover_losers_structured_description(),
      url: `https://stocknear.com/market-mover/losers${timePeriod === "losers" ? "" : "/" + timePeriod}`,
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: common_home(),
            item: "https://stocknear.com",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: layout_market_mover(),
            item: "https://stocknear.com/market-mover",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: market_mover_tab_losers(),
            item: "https://stocknear.com/market-mover/losers",
          },
        ],
      },
      mainEntity: {
        "@type": "ItemList",
        name: market_mover_losers_structured_main_name(),
        description: market_mover_losers_structured_main_description(),
      },
    };
  }
</script>

<SEO title={seoTitle} description={seoDescription} {structuredData} />

<section
  class="w-full overflow-hidden m-auto min-h-screen text-gray-700 dark:text-zinc-200"
>
  <div class="flex justify-center w-full m-auto overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <main class="w-full">
        <!--Start Top Winners/Losers-->

        <nav
          class="border-b border-gray-300 dark:border-zinc-700 overflow-x-auto whitespace-nowrap"
        >
          <ul
            class="flex flex-row items-center w-full gap-1 pb-2 text-sm sm:text-base"
          >
            <a
              href="/market-mover/losers"
              class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {timePeriod ===
              'losers'
                ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
            >
              {market_mover_period_today()}
            </a>
            <a
              href="/market-mover/losers/week"
              class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {timePeriod ===
              'week'
                ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
            >
              {market_mover_period_week()}
            </a>
            <a
              href="/market-mover/losers/month"
              class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {timePeriod ===
              'month'
                ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
            >
              {market_mover_period_month()}
            </a>
            <a
              href="/market-mover/losers/year"
              class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {timePeriod ===
              'year'
                ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
            >
              {market_mover_period_year()}
            </a>
            <a
              href="/market-mover/losers/3Y"
              class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {timePeriod ===
              '3Y'
                ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
            >
              {market_mover_period_label_3y()}
            </a>
            <a
              href="/market-mover/losers/5Y"
              class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {timePeriod ===
              '5Y'
                ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
            >
              {market_mover_period_label_5y()}
            </a>
          </ul>
        </nav>

        <div class="flex flex-col justify-center items-center overflow-hidden">
          <slot />
        </div>
      </main>
    </div>
  </div>
</section>

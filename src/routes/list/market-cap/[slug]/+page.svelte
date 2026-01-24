<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";
  import Table from "$lib/components/Table/Table.svelte";
  import { page } from "$app/stores";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import {
    list_count_stocks,
    list_label_total_market_cap,
    list_label_total_revenue,
    list_label_total_stocks,
    list_market_cap_infobox,
    list_market_cap_large,
    list_market_cap_mega,
    list_market_cap_mid,
    list_market_cap_micro,
    list_market_cap_nano,
    list_market_cap_range_above,
    list_market_cap_range_below,
    list_market_cap_range_between,
    list_market_cap_seo_description,
    list_market_cap_seo_title,
    list_market_cap_small,
    list_market_cap_value_billion,
    list_market_cap_value_million,
  } from "$lib/paraglide/messages.js";

  export let data;

  let rawData = [];
  let marketCapList = [];

  const BILLION = 1_000_000_000;
  const MILLION = 1_000_000;

  const marketCapNavigation = [
    {
      threshold: 200 * BILLION,
      name: list_market_cap_mega,
      link: "/list/market-cap/mega-cap-stocks",
    },
    {
      minThreshold: 10 * BILLION,
      maxThreshold: 200 * BILLION,
      name: list_market_cap_large,
      link: "/list/market-cap/large-cap-stocks",
    },
    {
      minThreshold: 2 * BILLION,
      maxThreshold: 10 * BILLION,
      name: list_market_cap_mid,
      link: "/list/market-cap/mid-cap-stocks",
    },
    {
      minThreshold: 300 * MILLION,
      maxThreshold: 2 * BILLION,
      name: list_market_cap_small,
      link: "/list/market-cap/small-cap-stocks",
    },
    {
      minThreshold: 50 * MILLION,
      maxThreshold: 300 * MILLION,
      name: list_market_cap_micro,
      link: "/list/market-cap/micro-cap-stocks",
    },
    {
      maxThreshold: 50 * MILLION,
      name: list_market_cap_nano,
      link: "/list/market-cap/nano-cap-stocks",
    },
  ];

  let totalMarketCap = 0;
  let totalRevenue = 0;

  $: {
    if ($page?.url?.pathname) {
      rawData = data?.getMarketCapCategory;
      marketCapList = rawData?.slice(0, 50);

      totalMarketCap = rawData?.reduce(
        (total, stock) => total + stock?.marketCap,
        0,
      );
      totalRevenue = rawData?.reduce(
        (total, stock) => total + stock?.revenue,
        0,
      );
    }
  }

  // Get current category from URL params
  $: currentCategory = data?.getParams?.replace("-stocks", "");
  // Filter out current category

  // Format number to billions/millions
  function formatThreshold(value) {
    const billion = 1_000_000_000;
    const million = 1_000_000;

    if (value >= billion) {
      return list_market_cap_value_billion({
        value: (value / billion).toFixed(0),
      });
    }
    return list_market_cap_value_million({
      value: (value / million).toFixed(0),
    });
  }

  // Get description for current category
  $: currentCategoryData = marketCapNavigation.find((cat) =>
    cat.link.includes(currentCategory),
  );

  // Generate description based on thresholds
  $: description = currentCategoryData
    ? (() => {
        if (currentCategoryData.threshold) {
          return list_market_cap_range_above({
            value: formatThreshold(currentCategoryData.threshold),
          });
        } else if (
          currentCategoryData.minThreshold &&
          currentCategoryData.maxThreshold
        ) {
          return list_market_cap_range_between({
            min: formatThreshold(currentCategoryData.minThreshold),
            max: formatThreshold(currentCategoryData.maxThreshold),
          });
        } else if (currentCategoryData.maxThreshold) {
          return list_market_cap_range_below({
            value: formatThreshold(currentCategoryData.maxThreshold),
          });
        }
        return "";
      })()
    : "";

  $: currentCategoryName = currentCategoryData?.name
    ? currentCategoryData.name()
    : "";
</script>

<SEO
  title={list_market_cap_seo_title({
    category: currentCategoryName,
    range: description,
  })}
  description={list_market_cap_seo_description({
    category: currentCategoryName,
    range: description,
  })}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text={list_market_cap_infobox({
      category: currentCategoryName,
      range: description,
    })}
  />

  <div
    class="mt-5 mb-4 grid grid-cols-1 sm:grid-cols-3 overflow-hidden rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/60 dark:bg-zinc-950/40 divide-y divide-gray-200/70 dark:divide-zinc-800/80 sm:divide-x sm:divide-y-0"
  >
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div
          class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
        >
          {list_label_total_stocks()}
        </div>
        <div
          class="mt-1 break-words text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tabular-nums"
        >
          {new Intl.NumberFormat("en")?.format(rawData?.length)}
        </div>
      </div>
    </div>
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div
          class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
        >
          {list_label_total_market_cap()}
        </div>
        <div
          class="mt-1 break-words text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tabular-nums"
        >
          {abbreviateNumber(totalMarketCap)}
        </div>
      </div>
    </div>
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div
          class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
        >
          {list_label_total_revenue()}
        </div>
        <div
          class="mt-1 break-words text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tabular-nums"
        >
          {abbreviateNumber(totalRevenue)}
        </div>
      </div>
    </div>
  </div>

  <!-- Page wrapper -->
  <Table
    {data}
    {rawData}
    title={list_count_stocks({
      count: rawData?.length?.toLocaleString("en-US") ?? "0",
    })}
  />
</section>

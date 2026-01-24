<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import {
    list_category_stock_lists,
    list_count_stocks,
    list_exchange_infobox,
    list_exchange_name_amex,
    list_exchange_name_nasdaq,
    list_exchange_name_nyse,
    list_exchange_seo_description,
    list_exchange_seo_title,
    list_label_total_market_cap,
    list_label_total_revenue,
    list_label_total_stocks,
  } from "$lib/paraglide/messages.js";

  export let data;

  let rawData = data?.getExchangeCategory;

  let totalMarketCap = rawData?.reduce(
    (total, stock) => total + stock?.marketCap,
    0,
  );
  let totalRevenue = rawData?.reduce(
    (total, stock) => total + stock?.revenue,
    0,
  );

  const exchangeNavigation = {
    amex: list_exchange_name_amex,
    nyse: list_exchange_name_nyse,
    nasdaq: list_exchange_name_nasdaq,
  };
</script>

<SEO
  title={list_exchange_seo_title({
    exchange:
      exchangeNavigation[data?.getParams?.toLowerCase()]?.() ??
      list_category_stock_lists(),
  })}
  description={list_exchange_seo_description({
    exchange:
      exchangeNavigation[data?.getParams?.toLowerCase()]?.() ??
      list_category_stock_lists(),
  })}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text={list_exchange_infobox({
      exchange:
        exchangeNavigation[data?.getParams?.toLowerCase()]?.() ??
        list_category_stock_lists(),
    })}
  />

  <div
    class="mt-6 mb-4 grid grid-cols-1 sm:grid-cols-3 overflow-hidden rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/60 dark:bg-zinc-950/40 divide-y divide-gray-200/70 dark:divide-zinc-800/80 sm:divide-x sm:divide-y-0"
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

  <Table
    {data}
    rawData={data?.getExchangeCategory}
    title={list_count_stocks({
      count: data?.getExchangeCategory?.length?.toLocaleString("en-US") ?? "0",
    })}
  />
</section>

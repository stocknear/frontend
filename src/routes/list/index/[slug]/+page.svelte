<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import {
    list_count_stocks,
    list_index_exchange_dowjones,
    list_index_exchange_nasdaq100,
    list_index_exchange_sp500,
    list_index_info_dowjones,
    list_index_info_nasdaq100,
    list_index_info_sp500,
    list_index_seo_description,
    list_index_seo_title,
    list_label_total_market_cap,
    list_label_total_revenue,
    list_label_total_stocks,
  } from "$lib/paraglide/messages.js";

  export let data;

  let rawData = data?.getIndexCategory;

  let totalMarketCap = rawData?.reduce(
    (total, stock) => total + stock?.marketCap,
    0,
  );
  let totalRevenue = rawData?.reduce(
    (total, stock) => total + stock?.revenue,
    0,
  );

  const indexNavigation = {
    nasdaq100: list_index_info_nasdaq100,
    dowjones: list_index_info_dowjones,
    sp500: list_index_info_sp500,
  };

  const exchangeNavigation = {
    dowjones: list_index_exchange_dowjones,
    nasdaq100: list_index_exchange_nasdaq100,
    sp500: list_index_exchange_sp500,
  };
</script>

<SEO
  title={list_index_seo_title({
    index: exchangeNavigation[data?.getParams?.toLowerCase()]?.() ?? "",
  })}
  description={list_index_seo_description({
    index: exchangeNavigation[data?.getParams?.toLowerCase()]?.() ?? "",
  })}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox text={indexNavigation[data?.getParams?.toLowerCase()]?.() ?? ""} />

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

  <!-- Content area -->
  <Table
    {data}
    rawData={data?.getIndexCategory}
    title={list_count_stocks({
      count: data?.getIndexCategory?.length?.toLocaleString("en-US") ?? "0",
    })}
  />
</section>

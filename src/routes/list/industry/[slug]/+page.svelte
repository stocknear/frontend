<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import {
    list_count_stocks,
    list_industry_infobox,
    list_label_total_market_cap,
    list_label_total_revenue,
    list_label_total_stocks,
  } from "$lib/paraglide/messages.js";

  export let data;

  let rawData = data?.getIndustryStocks?.stocks;

  let totalMarketCap =
    rawData?.reduce((total, stock) => total + stock?.marketCap, 0) ?? 0;

  let totalRevenue = rawData?.reduce(
    (total, stock) => total + stock?.revenue,
    0,
  );
</script>

<section class="w-full overflow-hidden m-auto min-h-screen">
  <Infobox
    text={list_industry_infobox({
      count: rawData?.length?.toLocaleString("en-US") ?? "0",
      marketCap: abbreviateNumber(totalMarketCap),
      revenue: abbreviateNumber(totalRevenue),
    })}
  />

  <div
    class="mt-4 mb-4 grid grid-cols-1 sm:grid-cols-3 overflow-hidden rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/60 dark:bg-zinc-950/40 divide-y divide-gray-200/70 dark:divide-zinc-800/80 sm:divide-x sm:divide-y-0"
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
    rawData={data?.getIndustryStocks?.stocks}
    title={list_count_stocks({
      count:
        data?.getIndustryStocks?.stocks?.length?.toLocaleString("en-US") ?? "0",
    })}
  />
</section>

<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";

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
    text={`The industry has a total of ${rawData?.length} stocks, with a combined market
    cap of ${abbreviateNumber(totalMarketCap)} and a total revenue of ${abbreviateNumber(
      totalRevenue,
    )}.`}
  />

  <div
    class="mt-4 mb-4 grid grid-cols-1 sm:grid-cols-3 overflow-hidden rounded-xl border border-gray-200/70 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-950/40 divide-y divide-gray-200/70 dark:divide-zinc-800/80 sm:divide-x sm:divide-y-0"
  >
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div class="text-xs uppercase tracking-wide text-gray-400 dark:text-zinc-500">Total Stocks</div>
        <div
          class="mt-1 break-words text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tabular-nums"
        >
          {new Intl.NumberFormat("en")?.format(rawData?.length)}
        </div>
      </div>
    </div>
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div class="text-xs uppercase tracking-wide text-gray-400 dark:text-zinc-500">Total Market Cap</div>
        <div
          class="mt-1 break-words text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tabular-nums"
        >
          {abbreviateNumber(totalMarketCap)}
        </div>
      </div>
    </div>
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div class="text-xs uppercase tracking-wide text-gray-400 dark:text-zinc-500">Total Revenue</div>
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
    title={data?.getIndustryStocks?.stocks?.length?.toLocaleString("en-US") +
      " " +
      "Stocks"}
  />
</section>

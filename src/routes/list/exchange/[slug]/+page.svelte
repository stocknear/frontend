<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

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
    amex: "AMEX (American Stock Exchange)",
    nyse: "NYSE (New York Stock Exchange)",
    nasdaq: "NASDAQ",
  };
</script>

<SEO
  title={`All Stocks Listed on the ${exchangeNavigation[data?.getParams?.toLowerCase()]}`}
  description={`All of the stocks listed on the ${exchangeNavigation[data?.getParams?.toLowerCase()]} in the US.`}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text={`A complete list of the ${exchangeNavigation[data?.getParams?.toLowerCase()]} companies
    that are listed on the US stock market.`}
  />

  <div
    class="mt-6 mb-4 grid grid-cols-1 sm:grid-cols-3 overflow-hidden rounded-xl border border-gray-300 shadow dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-950/40 divide-y divide-gray-200/70 dark:divide-zinc-800/80 sm:divide-x sm:divide-y-0"
  >
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div
          class="text-xs uppercase tracking-wide text-gray-400 dark:text-zinc-500"
        >
          Total Stocks
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
          class="text-xs uppercase tracking-wide text-gray-400 dark:text-zinc-500"
        >
          Total Market Cap
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
          class="text-xs uppercase tracking-wide text-gray-400 dark:text-zinc-500"
        >
          Total Revenue
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
    title={data?.getExchangeCategory?.length?.toLocaleString("en-US") +
      " " +
      "Stocks"}
  />
</section>

<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

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
    nasdaq100:
      "A list of all stocks in the NASDAQ 100, an index of the top 100 non-financial companies on the Nasdaq exchange. Although there are 100 companies, there are 101 stock tickers, as Alphabet has two symbols.",
    dowjones:
      "A list of the 30 stocks in the Dow Jones Industrial Average stock index, which is an index of 30 major companies listed on stock exchanges in the U.S.",
    sp500:
      "A list of all stocks in the S&P 500, an index of the 500 largest U.S.-listed companies. There are over 500 tickers, as some companies have multiple symbols.",
  };

  const exchangeNavigation = {
    dowjones: "Dow Jones",
    nasdaq100: "Nasdaq 100",
    sp500: "S&P500",
  };
</script>

<SEO
  title={`All Stocks Listed on the ${exchangeNavigation[data?.getParams?.toLowerCase()]}`}
  description={`All of the stocks listed on the ${exchangeNavigation[data?.getParams?.toLowerCase()]} in the US.`}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox text={`${indexNavigation[data?.getParams?.toLowerCase()]}`} />

  <div
    class="mt-6 mb-4 grid grid-cols-1 sm:grid-cols-3 overflow-hidden rounded-xl border border-gray-200/70 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-950/40 divide-y divide-gray-200/70 dark:divide-zinc-800/80 sm:divide-x sm:divide-y-0"
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

  <!-- Content area -->
  <Table
    {data}
    rawData={data?.getIndexCategory}
    title={data?.getIndexCategory?.length?.toLocaleString("en-US") +
      " " +
      "Stocks"}
  />
</section>

<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";
  import Table from "$lib/components/Table/Table.svelte";
  import { page } from "$app/stores";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;

  let rawData = [];
  let marketCapList = [];

  const BILLION = 1_000_000_000;
  const MILLION = 1_000_000;

  const marketCapNavigation = [
    {
      threshold: 200 * BILLION,
      name: "Mega Cap",
      link: "/list/market-cap/mega-cap-stocks",
    },
    {
      minThreshold: 10 * BILLION,
      maxThreshold: 200 * BILLION,
      name: "Large Cap",
      link: "/list/market-cap/large-cap-stocks",
    },
    {
      minThreshold: 2 * BILLION,
      maxThreshold: 10 * BILLION,
      name: "Mid Cap",
      link: "/list/market-cap/mid-cap-stocks",
    },
    {
      minThreshold: 300 * MILLION,
      maxThreshold: 2 * BILLION,
      name: "Small Cap",
      link: "/list/market-cap/small-cap-stocks",
    },
    {
      minThreshold: 50 * MILLION,
      maxThreshold: 300 * MILLION,
      name: "Micro Cap",
      link: "/list/market-cap/micro-cap-stocks",
    },
    {
      maxThreshold: 50 * MILLION,
      name: "Nano Cap",
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
      return `$${(value / billion).toFixed(0)} billion`;
    }
    return `$${(value / million).toFixed(0)} million`;
  }

  // Get description for current category
  $: currentCategoryData = marketCapNavigation.find((cat) =>
    cat.link.includes(currentCategory),
  );

  // Generate description based on thresholds
  $: description = currentCategoryData
    ? (() => {
        if (currentCategoryData.threshold) {
          return `above ${formatThreshold(currentCategoryData.threshold)}`;
        } else if (
          currentCategoryData.minThreshold &&
          currentCategoryData.maxThreshold
        ) {
          return `between ${formatThreshold(currentCategoryData.minThreshold)} and ${formatThreshold(currentCategoryData.maxThreshold)}`;
        } else if (currentCategoryData.maxThreshold) {
          return `below ${formatThreshold(currentCategoryData.maxThreshold)}`;
        }
        return "";
      })()
    : "";
</script>

<SEO
  title={`List of ${currentCategoryData?.name} Stocks ${description} Market Cap`}
  description={`${currentCategoryData?.name} stocks are defined as having a market capitalization of ${description} USD.`}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text={`${currentCategoryData?.name} stocks have market capitalizations ranging ${description}
    USD.`}
  />

  <div
    class="mt-5 mb-4 grid grid-cols-1 sm:grid-cols-3 overflow-hidden rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/60 dark:bg-zinc-950/40 divide-y divide-gray-200/70 dark:divide-zinc-800/80 sm:divide-x sm:divide-y-0"
  >
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div
          class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
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
          class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
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
          class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
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

  <!-- Page wrapper -->
  <Table {data} {rawData} title={rawData?.length + " " + "Stocks"} />
</section>

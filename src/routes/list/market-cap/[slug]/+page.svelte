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
    class="shadow mt-5 mb-4 flex flex-col divide-y divide-gray-300 dark:divide-gray-600 rounded border border-gray-300 dark:border-gray-600 sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0"
  >
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div class="text-[1rem] font-semibold">Total Stocks</div>
        <div
          class="mt-1 break-words font-semibold leading-8 text-xl sm:text-2xl"
        >
          {new Intl.NumberFormat("en")?.format(rawData?.length)}
        </div>
      </div>
    </div>
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div class="text-[1rem] font-semibold">Total Market Cap</div>
        <div
          class="mt-1 break-words font-semibold leading-8 text-xl sm:text-2xl"
        >
          {abbreviateNumber(totalMarketCap)}
        </div>
      </div>
    </div>
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div class="text-[1rem] font-semibold">Total Revenue</div>
        <div
          class="mt-1 break-words font-semibold leading-8 text-xl sm:text-2xl"
        >
          {abbreviateNumber(totalRevenue)}
        </div>
      </div>
    </div>
  </div>

  <!-- Page wrapper -->
  <Table {data} {rawData} title={rawData?.length + " " + "Stocks"} />
</section>

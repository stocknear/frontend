<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;

  let rawData = data?.getCountryCategory;

  let totalMarketCap = rawData?.reduce(
    (total, stock) => total + stock?.marketCap,
    0,
  );
  let totalRevenue = rawData?.reduce(
    (total, stock) => total + stock?.revenue,
    0,
  );

  const countryNavigation = {
    ca: "Canadian",
    de: "German",
    in: "Indian",
    il: "Israeli",
    jp: "Japanese",
    gb: "UK",
    cn: "Chinese",
  };
</script>

<SEO
  title={`List of ${countryNavigation[data?.getParams?.toLowerCase()]} Companies on the US Stock Market`}
  description={`Explore a complete list of ${countryNavigation[data?.getParams?.toLowerCase()]} companies publicly traded on the US stock market. Find stock symbols, market data, and more.`}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text={`A complete list of the ${countryNavigation[data?.getParams?.toLowerCase()]} companies
    that are listed on the US stock market.`}
  />

  <div
    class="shadow mt-6 mb-4 flex flex-col divide-y divide-gray-300 dark:divide-gray-600 rounded border border-gray-300 dark:border-gray-600 sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0"
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

  <Table
    {data}
    rawData={data?.getCountryCategory}
    title={data?.getCountryCategory?.length?.toLocaleString("en-US") +
      " " +
      "Stocks"}
  />
</section>

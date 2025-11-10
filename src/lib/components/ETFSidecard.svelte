<script lang="ts">
  import { etfTicker, stockTicker, cryptoTicker } from "$lib/store";
  import {
    formatETFName,
    formatString,
    abbreviateNumber,
    sectorNavigation,
  } from "$lib/utils";

  import { goto } from "$app/navigation";
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";

  export let data;

  let info;
  let topHoldingList = [];
  let topSectorList = [];
  let description = "";
  let website = "-";

  let ipoDate = "n/a";
  let assetClass = "-";
  let provider = "-";
  let totalAssetPercentage = 0;

  let dividendHistoryList = [];
  let dividendYield;

  async function stockSelector(ticker: string) {
    if (ticker?.length !== 0 && !["BTCUSD", "USD"]?.includes(ticker)) {
      window?.scroll({ top: 0, left: 0, behavior: "smooth" });
      stockTicker.update((value) => ticker);
      goto("/stocks/" + ticker + "/");
    } else if (ticker === "BTCUSD") {
      window?.scroll({ top: 0, left: 0, behavior: "smooth" });
      cryptoTicker.update((value) => "BTCUSD");
      goto("/crypto/BTCUSD");
    }
  }

  $: {
    if ($etfTicker) {
      info = data?.getETFProfile?.at(0);
      topHoldingList = data?.getETFHoldings?.holdings || [];
      topSectorList = data?.getETFSectorWeighting || [];
      dividendHistoryList = data?.getStockDividend?.history || [];
      dividendYield = data?.getStockDividend?.dividendYield;
      provider = info?.etfProvider;
      assetClass = info?.assetClass;
      ipoDate =
        info?.inceptionDate !== null
          ? new Date(info?.inceptionDate)?.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              daySuffix: "2-digit",
            })
          : "n/a";

      description =
        info?.description ??
        "A detailed description of the company is not yet available.";
      website = info?.website;

      totalAssetPercentage = topHoldingList
        ?.slice(0, 10)
        ?.reduce((acc, current) => acc + current?.weightPercentage, 0)
        ?.toFixed(2);
    }
  }
</script>

<div class="px-0.5 lg:px-0 text-muted dark:text-white">
  <h2 class="mb-2 text-2xl font-bold">
    About {$etfTicker}
  </h2>
  <p class="text-muted dark:text-gray-200">
    {description}
  </p>

  <div
    class="mt-3 grid grid-cols-2 gap-3 w-full border-b border-gray-300 dark:border-gray-600 lg:border-none pb-8 lg:pb-0"
  >
    <div class="col-span-1 text-muted dark:text-gray-200">
      <span class="block font-semibold">Asset Class</span>
      <span class=" ">{assetClass ?? "n/a"}</span>
    </div>
    <div class="col-span-1 text-muted dark:text-gray-200">
      <span class="block font-semibold">Ticker Symbol</span>
      {$etfTicker}
    </div>
    <div class="col-span-1 text-muted dark:text-gray-200">
      <span class="block font-semibold">Inception Date</span>
      <span>{ipoDate}</span>
    </div>
    <div class="col-span-1 text-muted dark:text-gray-200">
      <span class="block font-semibold">Provider</span>
      <a
        href={`/etf/etf-providers/${provider}`}
        class="sm:hover:text-blue-800 dark:sm:hover:text-blue-400 underline underline-offset-4"
        >{provider ? formatETFName(provider) : "n/a"}</a
      >
    </div>

    <div class="col-span-1 whitespace-nowrap text-muted dark:text-gray-200">
      <span class="block font-semibold">Website</span>
      <a
        href={website}
        class="sm:hover:text-blue-800 dark:sm:hover:text-blue-400 underline underline-offset-4"
        target="_blank">Fund Home Page</a
      >
    </div>

    <div class="col-span-1 whitespace-nowrap text-muted dark:text-gray-200">
      <span class="block font-semibold">Exchange</span>
      <span>{data?.getStockQuote?.exchange ?? "n/a"}</span>
    </div>
  </div>
</div>

{#if topSectorList?.length !== 0}
  <div
    class="space-y-3 pt-5 text-muted dark:text-white {topSectorList?.length !==
    0
      ? ''
      : 'hidden'}"
  >
    <div class="h-auto w-full">
      <!--Start Content-->
      <div class="w-auto lg:w-full flex flex-col m-auto">
        <h2 class="mb-2 text-2xl flex flex-row items-center">
          <span class="font-bold">Top Sectors</span>
        </h2>

        <div class="mt-2 w-full overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="border-y border-gray-300 dark:border-gray-800">
                <th class="px-1 py-1.5 text-left xs:px-2">Sector</th>

                <th class="px-1 py-1.5 text-right xs:px-2">Weight %</th>
              </tr>
            </thead>
            <tbody>
              {#each topSectorList?.slice(0, 5) as item}
                {#if item?.weightPercentage > 0}
                  <tr class=" border-b border-gray-300 dark:border-gray-800">
                    <td class="px-1 py-1.5 text-left xs:px-2">
                      <a
                        href={sectorNavigation?.find(
                          (listItem) => listItem?.title === item?.sector,
                        )?.link}
                        class="sm:hover:text-blue-800 dark:sm:hover:text-blue-400 underline underline-offset-4 truncate"
                      >
                        {item?.sector}
                      </a>
                    </td>

                    <td class="px-1 py-1.5 text-right xs:px-2">
                      {abbreviateNumber(item?.weightPercentage?.toFixed(2))}%
                    </td>
                  </tr>
                {/if}
              {/each}
            </tbody>
          </table>
        </div>

        <a
          href={`/etf/${$etfTicker}/holdings`}
          class="flex justify-center items-center rounded cursor-pointer w-full py-2 mt-3 text-[1rem] text-center font-semibold text-white dark:text-black m-auto sm:hover:bg-muted dark:sm:hover:bg-gray-300 bg-black dark:bg-[#fff] transition duration-100"
        >
          View All Sectors
        </a>
      </div>
    </div>
  </div>
{/if}

{#if topHoldingList?.length !== 0}
  <div
    class="space-y-3 pt-8 sm:pt-5 text-muted dark:text-white {topHoldingList?.length !==
    0
      ? ''
      : 'hidden'}"
  >
    <div class="h-auto w-full">
      <!--Start Content-->
      <div class="w-auto lg:w-full flex flex-col m-auto">
        <h2 class="mb-2 text-2xl flex flex-row items-center">
          <span class="font-bold">Top 10 Holdings</span>
          <span class=" font-semibold ml-auto text-sm">
            {totalAssetPercentage}% of assets
          </span>
        </h2>

        <div class="mt-2 w-full">
          <table class="w-full">
            <thead
              ><tr class="border-y border-gray-300 dark:border-gray-800"
                ><th class="px-1 py-1.5 text-left xs:px-2">Name</th>
                <th class="px-1 py-1.5 text-left xs:px-2">Symbol</th>
                <th class="px-1 py-1.5 text-right xs:px-2">Weight</th></tr
              ></thead
            >
            <tbody>
              {#each topHoldingList?.slice(0, 10) as item}
                {#if item?.symbol !== null}
                  <tr
                    class="border-b border-gray-300 dark:border-gray-300 dark:border-gray-800"
                  >
                    <td class="px-1 py-1.5 text-left xs:px-2">
                      {#if typeof item?.name !== "undefined"}
                        {item?.name?.length > 20
                          ? formatString(item?.name?.slice(0, 20)) + "..."
                          : formatString(item?.name)?.replace("Usd", "USD")}
                      {:else}
                        n/a
                      {/if}
                    </td>

                    <td class="px-1 py-1.5 text-left xs:px-2">
                      <HoverStockChart symbol={item?.symbol} />
                    </td>

                    <td class="px-1 py-1.5 text-right xs:px-2">
                      {abbreviateNumber(item?.weightPercentage?.toFixed(2))}%
                    </td>
                  </tr>
                {/if}
              {/each}
            </tbody>
          </table>
        </div>

        <a
          href={`/etf/${$etfTicker}/holdings`}
          class="flex justify-center items-center rounded cursor-pointer w-full py-2 mt-3 text-[1rem] text-center font-semibold text-white dark:text-black m-auto sm:hover:bg-muted dark:sm:hover:bg-gray-300 bg-black dark:bg-[#fff] transition duration-100"
        >
          View More Holdings
        </a>
      </div>
    </div>
  </div>
{/if}

{#if dividendHistoryList?.length !== 0}
  <div
    class="space-y-3 pt-8 sm:pt-5 text-muted dark:text-white {(
      dividendHistoryList?.length ?? []
    )?.length !== 0
      ? ''
      : 'hidden'}"
  >
    <div class="h-auto w-full">
      <!--Start Content-->
      <div class="w-auto lg:w-full flex flex-col m-auto">
        <h2 class="mb-2 text-2xl flex flex-row items-center">
          <span class="font-bold">Dividends</span>
          <span class=" font-semibold ml-auto text-sm">
            Dividend Yield {dividendYield ?? "0"}%
          </span>
        </h2>

        <div class="mt-2 w-full">
          <table class="w-full">
            <thead
              ><tr class="border-y border-gray-300 dark:border-gray-800"
                ><th class="px-1 py-1.5 text-left xs:px-2">Ex-Dividend</th>
                <th class="px-1 py-1.5 text-left xs:px-2">Amount</th>
                <th class="px-1 py-1.5 text-right xs:px-2">Payment Date</th></tr
              ></thead
            >

            <tbody>
              {#each dividendHistoryList?.slice(0, 5) as item}
                <tr class="border-b border-gray-300 dark:border-gray-800">
                  <td class="px-1 py-1.5 text-left xs:px-2">
                    {new Date(item?.date)?.toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      daySuffix: "2-digit",
                    })}
                  </td>

                  <td class="px-1 py-1.5 text-left xs:px-2">
                    ${item?.adjDividend?.toFixed(4)}
                  </td>

                  <td class="px-1 py-1.5 text-right xs:px-2">
                    {item?.paymentDate?.length !== 0
                      ? new Date(item?.paymentDate)?.toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          daySuffix: "2-digit",
                        })
                      : "n/a"}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <a
          href={`/etf/${$etfTicker}/dividends`}
          class="flex justify-center items-center rounded cursor-pointer w-full py-2 mt-3 text-[1rem] text-center font-semibold text-white dark:text-black m-auto sm:hover:bg-muted dark:sm:hover:bg-gray-300 bg-black dark:bg-[#fff] transition duration-100"
        >
          Full Dividend History
        </a>
      </div>
    </div>
  </div>
{/if}

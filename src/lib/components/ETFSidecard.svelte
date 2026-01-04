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

<div class="px-0.5 lg:px-0 text-gray-700 dark:text-zinc-200">
  <h2 class="mb-2 text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
    About {$etfTicker}
  </h2>
  <p class="text-sm text-gray-600 dark:text-zinc-400">
    {description}
  </p>

  <div
    class="mt-3 grid grid-cols-2 gap-3 w-full border-b border-gray-200/70 dark:border-zinc-800/80 lg:border-none pb-8 lg:pb-0"
  >
    <div class="col-span-1 text-sm text-gray-600 dark:text-zinc-400">
      <span class="block text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-500">Asset Class</span>
      <span>{assetClass ?? "n/a"}</span>
    </div>
    <div class="col-span-1 text-sm text-gray-600 dark:text-zinc-400">
      <span class="block text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-500">Ticker Symbol</span>
      {$etfTicker}
    </div>
    <div class="col-span-1 text-sm text-gray-600 dark:text-zinc-400">
      <span class="block text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-500">Inception Date</span>
      <span>{ipoDate}</span>
    </div>
    <div class="col-span-1 text-sm text-gray-600 dark:text-zinc-400">
      <span class="block text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-500">Provider</span>
      <a
        href={`/etf/etf-providers/${provider}`}
        class="hover:text-violet-600 dark:hover:text-violet-400 underline underline-offset-4"
        >{provider ? formatETFName(provider) : "n/a"}</a
      >
    </div>

    <div class="col-span-1 whitespace-nowrap text-sm text-gray-600 dark:text-zinc-400">
      <span class="block text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-500">Website</span>
      <a
        href={website}
        class="hover:text-violet-600 dark:hover:text-violet-400 underline underline-offset-4"
        target="_blank">Fund Home Page</a
      >
    </div>

    <div class="col-span-1 whitespace-nowrap text-sm text-gray-600 dark:text-zinc-400">
      <span class="block text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-500">Exchange</span>
      <span>{data?.getStockQuote?.exchange ?? "n/a"}</span>
    </div>
  </div>
</div>

{#if topSectorList?.length !== 0}
  <div
    class="space-y-3 pt-5 {topSectorList?.length !== 0 ? '' : 'hidden'}"
  >
    <div class="h-auto w-full">
      <!--Start Content-->
      <div class="w-auto lg:w-full flex flex-col m-auto">
        <h2 class="mb-2 text-xl sm:text-2xl flex flex-row items-center">
          <span class="font-semibold tracking-tight text-gray-900 dark:text-white">Top Sectors</span>
        </h2>

        <div class="mt-2 w-full overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="border-y border-gray-200/70 dark:border-zinc-800/80 text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400">
                <th class="px-1 py-1.5 text-left xs:px-2 font-semibold">Sector</th>

                <th class="px-1 py-1.5 text-right xs:px-2 font-semibold">Weight %</th>
              </tr>
            </thead>
            <tbody>
              {#each topSectorList?.slice(0, 5) as item}
                {#if item?.weightPercentage > 0}
                  <tr class="border-b border-gray-200/70 dark:border-zinc-800/80 text-sm text-gray-600 dark:text-zinc-300">
                    <td class="px-1 py-1.5 text-left xs:px-2">
                      <a
                        href={sectorNavigation?.find(
                          (listItem) => listItem?.title === item?.sector,
                        )?.link}
                        class="hover:text-violet-600 dark:hover:text-violet-400 underline underline-offset-4 truncate"
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
          class="inline-flex items-center justify-center rounded-full cursor-pointer w-full py-2 mt-3 text-sm text-center font-semibold text-white dark:text-gray-900 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 transition duration-100"
        >
          View All Sectors
        </a>
      </div>
    </div>
  </div>
{/if}

{#if topHoldingList?.length !== 0}
  <div
    class="space-y-3 pt-8 sm:pt-5 {topHoldingList?.length !== 0 ? '' : 'hidden'}"
  >
    <div class="h-auto w-full">
      <!--Start Content-->
      <div class="w-auto lg:w-full flex flex-col m-auto">
        <h2 class="mb-2 text-xl sm:text-2xl flex flex-row items-center">
          <span class="font-semibold tracking-tight text-gray-900 dark:text-white">Top 10 Holdings</span>
          <span class="font-semibold ml-auto text-sm text-gray-500 dark:text-zinc-400">
            {totalAssetPercentage}% of assets
          </span>
        </h2>

        <div class="mt-2 w-full">
          <table class="w-full">
            <thead
              ><tr class="border-y border-gray-200/70 dark:border-zinc-800/80 text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                ><th class="px-1 py-1.5 text-left xs:px-2 font-semibold">Name</th>
                <th class="px-1 py-1.5 text-left xs:px-2 font-semibold">Symbol</th>
                <th class="px-1 py-1.5 text-right xs:px-2 font-semibold">Weight</th></tr
              ></thead
            >
            <tbody>
              {#each topHoldingList?.slice(0, 10) as item}
                {#if item?.symbol !== null}
                  <tr
                    class="border-b border-gray-200/70 dark:border-zinc-800/80 text-sm text-gray-600 dark:text-zinc-300"
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
          class="inline-flex items-center justify-center rounded-full cursor-pointer w-full py-2 mt-3 text-sm text-center font-semibold text-white dark:text-gray-900 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 transition duration-100"
        >
          View More Holdings
        </a>
      </div>
    </div>
  </div>
{/if}

{#if dividendHistoryList?.length !== 0}
  <div
    class="space-y-3 pt-8 sm:pt-5 {(
      dividendHistoryList?.length ?? []
    )?.length !== 0
      ? ''
      : 'hidden'}"
  >
    <div class="h-auto w-full">
      <!--Start Content-->
      <div class="w-auto lg:w-full flex flex-col m-auto">
        <h2 class="mb-2 text-xl sm:text-2xl flex flex-row items-center">
          <span class="font-semibold tracking-tight text-gray-900 dark:text-white">Dividends</span>
          <span class="font-semibold ml-auto text-sm text-gray-500 dark:text-zinc-400">
            Dividend Yield {dividendYield ?? "0"}%
          </span>
        </h2>

        <div class="mt-2 w-full">
          <table class="w-full">
            <thead
              ><tr class="border-y border-gray-200/70 dark:border-zinc-800/80 text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                ><th class="px-1 py-1.5 text-left xs:px-2 font-semibold">Ex-Dividend</th>
                <th class="px-1 py-1.5 text-left xs:px-2 font-semibold">Amount</th>
                <th class="px-1 py-1.5 text-right xs:px-2 font-semibold">Payment Date</th></tr
              ></thead
            >

            <tbody>
              {#each dividendHistoryList?.slice(0, 5) as item}
                <tr class="border-b border-gray-200/70 dark:border-zinc-800/80 text-sm text-gray-600 dark:text-zinc-300">
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
          class="inline-flex items-center justify-center rounded-full cursor-pointer w-full py-2 mt-3 text-sm text-center font-semibold text-white dark:text-gray-900 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 transition duration-100"
        >
          Full Dividend History
        </a>
      </div>
    </div>
  </div>
{/if}

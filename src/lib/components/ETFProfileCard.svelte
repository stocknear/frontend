<script lang="ts">
  import {
    etfTicker,
    wsBidPrice,
    wsAskPrice,
    screenWidth,
    displayCompanyName,
  } from "$lib/store";

  import { abbreviateNumber, formatETFName } from "$lib/utils";
  import { fade } from "svelte/transition";
  import { goto } from "$app/navigation";
  import defaultImage from "$lib/images/etf/cover/default.jpg";

  export let etfProfile;
  export let data;

  let info;
  let assetClass = "-";
  let aum = "-";
  let avgVolume = "-";
  let inceptionDate = "-";
  let holdingsCount = "-";
  let provider = "-";
  let sectorExposed;
  let country;
  let description = "";
  let website = "-";
  let snippet;
  let dividendYield = "-";
  let payoutRatio = "-";

  let showFullText = false;

  $: {
    if (
      $etfTicker &&
      typeof $etfTicker !== "undefined" &&
      typeof window !== "undefined" &&
      typeof etfProfile !== "undefined" &&
      etfProfile?.length !== 0
    ) {
      info = etfProfile?.at(0);
      assetClass = info?.assetClass;
      sectorExposed = info?.sectorsList?.length;
      aum = info?.aum;
      country = info?.domicile;
      inceptionDate = new Date(info?.inceptionDate)
        ?.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        .replace(/\//g, ".");
      holdingsCount = info?.holdingsCount;
      avgVolume = info?.avgVolume;
      dividendYield =
        typeof data?.getStockDividend?.dividendYield !== "undefined"
          ? data?.getStockDividend?.dividendYield?.toFixed(2) + "%"
          : "-";
      payoutRatio =
        typeof data?.getStockDividend?.payoutRatio !== "undefined" &&
        data?.getStockDividend?.payoutRatio !== null
          ? data?.getStockDividend?.payoutRatio?.toFixed(2) + "%"
          : "-";

      provider = info?.etfProvider;
      country = info?.domicile ?? "-";
      description =
        info?.description ??
        "A detailed description of the company is not yet available.";
      website = info?.website;
      snippet = description?.slice(0, 150) + "...";
    }
  }
</script>

<div class="sm:space-y-3">
  <div
    class="sm:rounded shadow-lg sm:border sm:border-gray-600 bg-[#000] lg:bg-default h-auto h-auto w-screen pt-16 sm:w-full md:w-[420px] xl:w-[450px] lg:pt-0"
  >
    <!--Start Header-->
    <div
      class="lg:rounded-t-sm w-full h-[130px] bg-default p-3 flex flex-col bg-cover bg-center bg-no-repeat"
      style="background-image: url('{defaultImage}');"
    >
      <div class="flex flex-row pt-1 pb-2">
        <div class="badge badge-error gap-2 mt-2 text-sm text-white">
          Asset Class - {assetClass}
        </div>
      </div>
      <!--
              <div class="flex flex-row justify-end items-center mt-2 relative z-10 -my-5">
                <div style={`background-image: url(${sTier}`} class="animate-bounce circle-background mr-5 w-20 h-20 z-10">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-28 h-28" viewBox="0 0 106 34">
                      <g class="sparkles">
                          <path style="--duration: 4s;" d="M2.5740361 5.33344622s1.1875777-6.20179466 2.24320232 0c0 0 5.9378885 1.05562462 0 2.11124925 0 0-1.05562463 6.33374774-2.24320233 0-3.5627331-.6597654-3.29882695-1.31953078 0-2.11124925z" />
                          <path style="--duration: 3.2s;" d="M33.5173993 29.97263826s1.03464615-5.40315215 1.95433162 0c0 0 5.17323078.91968547 0 1.83937095 0 0-.91968547 5.51811283-1.95433162 0-3.10393847-.57480342-2.8740171-1.14960684 0-1.83937095z" />
                          <path style="--duration: 2.5s;" d="M69.03038108 1.71240809s.73779281-3.852918 1.39360864 0c0 0 3.68896404.65581583 0 1.31163166 0 0-.65581583 3.93489497-1.39360864 0-2.21337842-.4098849-2.04942447-.81976979 0-1.31163166z" />
                      </g>
                      </svg>
                      <div class="tier-text italic m-auto text-xl">
                      <span class="text-4xl" style="color: #FFFFFF}">
                        {tierList ?? 'n/a'}  
                      </span>
                      </div>
                  </div>

                </div>
              -->
    </div>
    <!--End Header-->

    <!--Start Content-->
    <div class="w-full flex flex-wrap border-t border-gray-600">
      <h2 class="text-start ml-4 text-2xl font-bold text-white pb-2 mt-3">
        ETF Info
      </h2>
      <div class="flex items-center w-full">
        <table class="table table-sm table-compact">
          <tbody>
            <tr class="text-white border-b border-[#27272A]">
              <td
                class="text-start bg-[#000] lg:bg-default text-white font-semibold whitespace-nowrap"
                >Bid</td
              >
              <td class="text-center sm:text-end bg-[#000] lg:bg-default"
                >{$wsBidPrice !== 0 && $wsBidPrice !== null
                  ? $wsBidPrice
                  : data?.getStockQuote?.bid}</td
              >
              <td
                class="text-start sm:text-end bg-[#000] lg:bg-default text-white font-semibold whitespace-nowrap"
                >Ask</td
              >
              <td class="text-start sm:text-end bg-[#000] lg:bg-default"
                >{$wsAskPrice !== 0 && $wsAskPrice !== null
                  ? $wsAskPrice
                  : data?.getStockQuote?.ask}</td
              >
            </tr>
            <tr class="text-white border-b border-[#27272A]">
              <td
                class="text-start bg-[#000] lg:bg-default text-white font-semibold whitespace-nowrap"
                >Provider</td
              >
              <td
                on:click={() => goto(`/etf/etf-providers/${provider}`)}
                class="text-center sm:text-end text-blue-400 lg:hover:text-white cursor-pointer bg-[#000] lg:bg-default"
                >{formatETFName(provider)}</td
              >
              <td
                class="text-start sm:text-end bg-[#000] lg:bg-default text-white font-semibold whitespace-nowrap"
                >Country</td
              >
              <td
                class="text-start sm:text-end bg-[#000] lg:bg-default whitespace-nowrap"
                >{country?.length !== 0 ? country : "-"}</td
              >
            </tr>
            <tr class="text-white border-b border-[#27272A]">
              <td
                class="text-start bg-[#000] lg:bg-default text-white font-semibold whitespace-nowrap"
                >AUM</td
              >
              <td class="text-center sm:text-end bg-[#000] lg:bg-default"
                >{abbreviateNumber(aum, true)}</td
              >
              <td
                class="text-start sm:text-end bg-[#000] lg:bg-default text-white font-semibold whitespace-nowrap"
                >Vol</td
              >
              <td
                class="text-start sm:text-end bg-[#000] lg:bg-default whitespace-nowrap"
                >{abbreviateNumber(data?.getStockQuote?.volume)}</td
              >
            </tr>
            <tr class="text-white border-b border-[#27272A]">
              <td
                class="text-start bg-[#000] lg:bg-default text-white font-semibold whitespace-nowrap"
                >NAV</td
              >
              <td class="text-center sm:text-end bg-[#000] lg:bg-default"
                >{info?.nav?.toFixed(2)}</td
              >
              <td
                class="text-start sm:text-end bg-[#000] lg:bg-default text-white font-semibold whitespace-nowrap"
                >Expense Ratio</td
              >
              <td class="text-start sm:text-end bg-[#000] lg:bg-default"
                >{info?.expenseRatio?.toFixed(2)}%</td
              >
            </tr>
            <tr class="text-white border-b border-[#27272A]">
              <td
                class="text-start bg-[#000] lg:bg-default text-white font-semibold whitespace-nowrap"
                >Shares Out.</td
              >
              <td class="text-center sm:text-end bg-[#000] lg:bg-default"
                >{abbreviateNumber(data?.getStockQuote?.sharesOutstanding)}</td
              >
              <td
                class="text-start sm:text-end bg-[#000] lg:bg-default text-white font-semibold whitespace-nowrap"
                >Avg. Vol</td
              >
              <td
                class="text-start sm:text-end bg-[#000] lg:bg-default whitespace-nowrap"
                >{abbreviateNumber(avgVolume)}</td
              >
            </tr>
            <!--
                <tr class="text-white border-b border-[#27272A]">
                  <td class="text-start bg-[#000] lg:bg-default text-white font-semibold whitespace-nowrap">Open</td>
                  <td class="text-center sm:text-end bg-[#000] lg:bg-default">{data?.getStockQuote?.open?.toFixed(2)}</td>
                  <td class="text-start sm:text-end bg-[#000] lg:bg-default text-white font-semibold whitespace-nowrap ">Prev. Close</td>
                  <td class="text-start sm:text-end bg-[#000] lg:bg-default whitespace-nowrap ">{data?.getStockQuote?.previousClose?.toFixed(2)}</td>
                </tr>
              -->
            <tr class="text-white border-b border-[#27272A]">
              <td
                class="text-start bg-[#000] lg:bg-default text-white font-semibold whitespace-nowrap"
                >Dividend Yield</td
              >
              <td class="text-center sm:text-end bg-[#000] lg:bg-default"
                >{dividendYield}</td
              >
              <td
                class="text-start sm:text-end bg-[#000] lg:bg-default text-white font-semibold whitespace-nowrap"
                >Payout Ratio</td
              >
              <td class="text-start sm:text-end bg-[#000] lg:bg-default"
                >{payoutRatio}</td
              >
            </tr>
            <tr class="text-white border-b border-[#27272A]">
              <td
                class="text-start bg-[#000] lg:bg-default text-white font-semibold whitespace-nowrap"
                >Holdings</td
              >
              <td class="text-center sm:text-end bg-[#000] lg:bg-default"
                >{holdingsCount} Assets</td
              >
              <td
                class="text-start sm:text-end bg-[#000] lg:bg-default text-white font-semibold whitespace-nowrap"
                >Inception</td
              >
              <td class="text-start sm:text-end bg-[#000] lg:bg-default"
                >{inceptionDate}</td
              >
            </tr>
          </tbody>
        </table>
      </div>

      <h2
        class="text-start ml-4 text-xl font-bold text-white pb-2 pt-6 lg:pt-3"
      >
        Description
      </h2>

      <p class="text-gray-100 ml-2 text-sm whitespace-normal p-2">
        {#if showFullText}
          <div transition:fade={{ delay: 0, duration: 80 }} in={showFullText}>
            {description}
          </div>
        {:else if $screenWidth <= 800}
          {description}
        {:else}
          {snippet}
        {/if}
      </p>
      {#if description.length !== 0}
        <div class="flex flex-row w-full items-center mt-4 pb-2 mb-2">
          <label
            on:click={() => (showFullText = !showFullText)}
            class="hidden lg:block ml-3 w-full text-md mt-1 cursor-pointer text-white sm:hover:text-blue-400 sm:hover:underline"
          >
            {#if showFullText}
              Show less
            {:else}
              Show more
            {/if}
          </label>

          <div class="flex justify-end w-full relative bottom-0 right-0 mr-3">
            <a
              target="_blank"
              href={website}
              class="inline-flex text-sm text-white sm:hover:text-blue-400 sm:hover:underline"
            >
              Go to website
              <svg
                class="w-5 h-5 ml-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
                ><path
                  d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"
                ></path><path
                  d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"
                ></path></svg
              >
            </a>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

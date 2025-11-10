<script lang="ts">
  //import ProgressBar from 'progressbar.js';
  import { stockTicker, screenWidth } from "$lib/store";
  import { abbreviateNumber } from "$lib/utils";

  export let lastPrice;
  export let analystRating = {};

  let buyCount = 0;
  let holdCount = 0;
  let sellCount = 0;
  let priceTarget = "n/a";
  let numOfAnalyst = 0;
  let consensusRating = "n/a";
  let changesPercentage = 0;

  $: {
    if (
      $stockTicker &&
      typeof window !== "undefined" &&
      typeof analystRating !== "undefined" &&
      Object?.keys(analystRating)?.length !== 0
    ) {
      numOfAnalyst = analystRating?.numOfAnalyst;
      buyCount = ((analystRating?.Buy / numOfAnalyst) * 100)?.toFixed(2);
      holdCount = ((analystRating?.Hold / numOfAnalyst) * 100)?.toFixed(2);
      sellCount = ((analystRating?.Sell / numOfAnalyst) * 100)?.toFixed(2);
      priceTarget =
        analystRating?.priceTarget !== ("n/a" && 0)
          ? analystRating?.priceTarget
          : "-";
      consensusRating = analystRating?.consensusRating;

      try {
        changesPercentage =
          ((priceTarget / lastPrice - 1) * 100)?.toFixed(2) ?? 0;
      } catch (e) {
        changesPercentage = 0;
      }
    }
  }
</script>

<!--Start Analyst Card -->
<div
  class="space-y-3 sm:pt-5 hidden sm:block sm:{Object?.keys(analystRating)
    ?.length !== 0
    ? ''
    : 'hidden'}"
>
  <div
    class="sm:rounded shadow-lg bg-[#000] sm:bg-default sm:border sm:border-gray-600 h-auto {$screenWidth <
    640
      ? 'w-screen pt-16'
      : ''} md:w-[420px] xl:w-[450px] -mx-1 sm:mx-0"
  >
    <!--Start Content-->
    <div
      class="w-auto lg:w-full p-1 flex flex-col m-auto pb-14 sm:pb-10 px-2 sm:px-0"
    >
      <h2 class="text-start text-2xl font-semibold text-white p-3 mt-3 ml-1">
        Analyst Rating
      </h2>

      <div class="flex flex-col mt-5 w-full">
        <div class="flex flex-row m-auto w-full">
          <span class="text-start mr-auto ml-5 text-white text-xl">
            Signal
          </span>
          <span class="mr-5 text-white text-xl"> Price Target </span>
        </div>
        <div class="flex flex-row m-auto w-full">
          {#if consensusRating === "Buy" || consensusRating === "Strong Buy"}
            <span
              class="text-start font-semibold text-[#00FC50] mr-auto ml-5 mt-2 text-xl"
            >
              {consensusRating}
            </span>
          {:else if consensusRating === "Sell" || consensusRating === "Strong Sell"}
            <span
              class="text-start font-semibold text-[#FF2F1F] mr-auto ml-5 mt-2 text-xl"
            >
              {consensusRating}
            </span>
          {:else}
            <span
              class="text-start font-semibold text-[#FF2F1F] mr-auto ml-5 mt-2 text-xl"
            >
              {consensusRating}
            </span>
          {/if}

          <span class="mr-5 mt-2 font-semibold text-xl text-white">
            {priceTarget}
          </span>
        </div>
      </div>

      <div class="text-white pl-4 pr-4 mt-6">
        {#if changesPercentage < 0}
          The Stock Price has a downside of
          <span style="color: #FF2F1F; font-weight: 500"
            >{abbreviateNumber(Math.abs(changesPercentage))}%</span
          >
        {:else if changesPercentage >= 0}
          The Stock Price has an upside of
          <span style="color: #00FC50; font-weight: 500"
            >{abbreviateNumber(Math.abs(changesPercentage))}%</span
          >
        {/if}
        based on <span style="font-weight: 600">{numOfAnalyst}</span> analysts in
        the past 12 months.
      </div>

      <div
        class="mt-5 w-full rounded-full flex justify-center items-center mb-5"
      >
        <div class="flex flex-col items-center w-full">
          <!--Start Progress-->

          <div class="flex flex-col items-center w-full">
            <div class="flex flex-row items-center w-11/12 mt-5 mb-2">
              <span class="text-white text-start mr-auto"> Buy </span>
              <span class="text-white text-md ml-auto">
                {buyCount}%
              </span>
            </div>
            <progress
              class="progress bg-[#3B3D3F] w-11/12 [&::-webkit-progress-value]:bg-[#00FC50] [&::-moz-progress-bar]:bg-[#00FC50]"
              value={buyCount}
              max="100"
            ></progress>
          </div>

          <div class="flex flex-col items-center w-full">
            <div class="flex flex-row items-center w-11/12 mt-5 mb-2">
              <span class="text-white text-start mr-auto"> Hold </span>
              <span class="text-white text-md ml-auto">
                {holdCount}%
              </span>
            </div>
            <progress
              class="progress bg-[#3B3D3F] w-11/12 [&::-webkit-progress-value]:bg-[#fff] [&::-moz-progress-bar]:bg-[#fff]"
              value={holdCount}
              max="100"
            ></progress>
          </div>

          <div class="flex flex-col items-center w-full">
            <div class="flex flex-row items-center w-11/12 mt-5 mb-2">
              <span class="text-white text-start mr-auto"> Sell </span>
              <span class="text-white text-md ml-auto">
                {sellCount}%
              </span>
            </div>
            <progress
              class="progress bg-[#3B3D3F] w-11/12 [&::-webkit-progress-value]:bg-[#FF2F1F] [&::-moz-progress-bar]:bg-[#FF2F1F]"
              value={sellCount}
              max="100"
            ></progress>
          </div>

          <!--End Progress-->
        </div>
      </div>

      <a
        href={`/stocks/${$stockTicker}/forecast/analyst`}
        class="rounded cursor-pointer w-11/12 py-2 h-full mt-6 text-lg text-center font-bold text-white m-auto sm:hover:bg-gray-300 bg-[#fff] transition duration-100"
      >
        Analyst Ratings
      </a>
    </div>
  </div>
</div>

<!--End Analyst Card-->

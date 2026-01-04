<script lang="ts">
  import {
    optionComponent,
    assetType,
    stockTicker,
    etfTicker,
    displayCompanyName,
    getCache,
    setCache,
  } from "$lib/store";
  import { abbreviateNumber } from "$lib/utils";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import { LayerCake, Html } from "layercake";
  import Circle from "$lib/components/Circle/Circle.html.svelte";

  export let data;

  let optionsDict = {};

  let isLoaded = false;

  function changeStatement(event) {
    displayTimePeriod = event.target.value;
  }

  function allValuesZero(obj) {
    return Object?.values(obj)?.every((value) => value === 0);
  }

  let displayTimePeriod = "oneMonth";
  let signal = "";
  let callVolume;
  let putVolume;
  let dataset;

  const idKey = "contract";
  const valueKey = "value";
  let rawData = [];

  let checkIfNotZero: boolean;

  const getOptionsBubble = async (ticker) => {
    // Get cached data for the specific tickerID
    const cachedData = getCache(ticker, "getOptionsBubble");
    if (cachedData) {
      optionsDict = cachedData;
    } else {
      const postData = { ticker: ticker, path: "options-bubble" };
      // make the POST request to the endpoint
      const response = await fetch("/api/ticker-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      optionsDict = await response?.json();

      // Cache the data for this specific tickerID with a specific name 'getOptionsBubble'
      setCache(ticker, optionsDict, "getOptionsBubble");
    }

    if (Object?.keys(optionsDict)?.length !== 0) {
      $optionComponent = true;
    } else {
      $optionComponent = false;
    }
  };

  function prepareData() {
    checkIfNotZero = false;
    rawData = [];
    try {
      dataset = optionsDict[displayTimePeriod];

      callVolume = dataset?.callVolume;
      putVolume = dataset?.putVolume;

      const totalVolume = dataset?.putVolume + dataset?.callVolume;
      const callProportion = Math.ceil(
        (dataset?.callVolume / totalVolume) * 100,
      );
      const putProportion = 100 - callProportion;

      rawData.push({ contract: "calls", value: callProportion });
      rawData.push({ contract: "puts", value: putProportion });
      signal = callProportion >= putProportion ? "Bullish" : "Bearish";
      checkIfNotZero = allValuesZero(dataset);
    } catch (e) {
      dataset = {};
    }
  }

  const timePeriods = {
    oneDay: "24h",
    oneWeek: "week",
    oneMonth: "month",
    threeMonth: "3 months",
    sixMonth: "6 months",
    oneYear: "1 year",
  };

  $: period = timePeriods[displayTimePeriod] || displayTimePeriod;

  $: {
    if (
      ($assetType === "stock" ? $stockTicker : $etfTicker) &&
      typeof window !== "undefined"
    ) {
      isLoaded = false;

      const ticker = $assetType === "stock" ? $stockTicker : $etfTicker;

      const asyncFunctions = [getOptionsBubble(ticker)];
      Promise.all(asyncFunctions)
        .then((results) => {
          prepareData();
        })
        .catch((error) => {
          console.error("An error occurred:", error);
        });
      isLoaded = true;
    }
  }

  $: {
    if (
      displayTimePeriod &&
      Object?.keys(optionsDict)?.length !== 0 &&
      isLoaded === true
    ) {
      prepareData();
    }
  }
</script>

<section class="overflow-hidden text-white h-full pb-8">
  <main class="overflow-hidden">
    <div class="flex flex-row items-center">
      <label
        for="optionsInfo"
        class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold"
      >
        Latest Options Activity
      </label>
      <InfoModal
        title={"Options Activity"}
        content={`Monitor real-time unusual options activity from big instiutional traders and hedge funds of ${$displayCompanyName} with a 1-minute delay, which can significantly influence stock prices.`}
        id={"optionsInfo"}
      />
    </div>

    {#if isLoaded}
      <div class="flex flex-row items-end justify-between">
        <select
          class="mt-5 sm:mb-0 ml-1 w-36 select select-bordered select-sm p-0 pl-5 bg-secondary"
          on:change={changeStatement}
        >
          <option disabled>Choose a time period</option>
          <option value="oneDay"> 1 Day </option>
          <option value="oneWeek"> 1 Week </option>
          <option value="oneMonth" selected> 1 Month </option>
          <option value="threeMonth">3 Months</option>
          <option value="sixMonth">6 Months</option>
          <option value="oneYear">1 Year</option>
        </select>

        <a
          href={$assetType === "stock"
            ? `/stocks/${$stockTicker}/options`
            : `/etf/${$etfTicker}/options`}
          class="text-sm sm:text-[1rem] sm:hover:text-white text-blue-400 font-normal"
          >Full report</a
        >
      </div>

      {#if !checkIfNotZero}
        <div
          class="flex flex-row items-center justify-center m-auto w-full h-auto mt-4"
        >
          <div class="flex flex-col items-start w-full">
            <div class="chart-container">
              <LayerCake
                padding={{ top: 0, bottom: 0, left: 0, right: 10 }}
                data={rawData}
              >
                <Html>
                  <Circle {idKey} {valueKey} textStrokeWidth={-0.5} />
                </Html>
              </LayerCake>
            </div>

            <div class="sm:mt-10">
              The Options activity signals a
              {#if signal === "Bullish"}
                <span class="text-emerald-600 dark:text-emerald-400">
                  <svg
                    class="w-6 h-6 sm:w-7 sm:h-7 inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    ><g
                      fill="none"
                      stroke="#00FC50"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      ><path d="m3 17l6-6l4 4l8-8" /><path d="M17 7h4v4" /></g
                    ></svg
                  >
                  {signal}
                </span>
              {:else if signal === "Bearish"}
                <span class="text-[#E57C34]">
                  <svg
                    class="w-6 h-6 sm:w-7 sm:h-7 inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 256 256"
                    ><path
                      fill="#ff2f1f"
                      d="M244 136v64a12 12 0 0 1-12 12h-64a12 12 0 0 1 0-24h35l-67-67l-31.51 31.52a12 12 0 0 1-17 0l-72-72a12 12 0 0 1 17-17L96 127l31.51-31.52a12 12 0 0 1 17 0L220 171v-35a12 12 0 0 1 24 0Z"
                    /></svg
                  >
                  {signal}
                </span>
              {:else}
                <span class="text-rose-600 dark:text-rose-400">
                  <svg
                    class="w-6 h-6 sm:w-7 sm:h-7 inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    ><path
                      fill="#e57c34"
                      d="m22 12l-4-4v3H3v2h15v3l4-4Z"
                    /></svg
                  >
                  Neutral
                </span>
              {/if} trend.
            </div>

            <span class="text-[1rem] text-white">
              In the past {period}, hedge funds and major institutional traders
              have bought {abbreviateNumber(callVolume)} calls and {abbreviateNumber(
                putVolume,
              )} puts with an average DTE of {dataset?.avgDTE} days.
            </span>
          </div>
        </div>
      {:else}
        <div class="flex justify-center items-center m-auto mt-16 mb-6">
          <div
            class="text-gray-100 text-sm sm:text-[1rem] sm:rounded h-auto border border-gray-600 p-4"
          >
            <svg
              class="w-5 h-5 inline-block sm:mr-2 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 256 256"
              ><path
                fill="#fff"
                d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"
              /></svg
            >
            No Options activity found
          </div>
        </div>
      {/if}
    {:else}
      <div class="flex justify-center items-center h-80">
        <div class="relative">
          <label
            class="shadow bg-default dark:bg-secondary rounded h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <span
              class="loading loading-spinner loading-md text-white dark:text-white"
            ></span>
          </label>
        </div>
      </div>
    {/if}
  </main>
</section>

<style>
  /*
    The wrapper div needs to have an explicit width and height in CSS.
    It can also be a flexbox child or CSS grid element.
    The point being it needs dimensions since the <LayerCake> element will
    expand to fill it.
  */
  .chart-container {
    width: 100%;
    height: 250px;
  }
</style>

<script lang="ts">
  import { revenueSegmentationComponent, stockTicker, screenWidth, getCache, setCache } from "$lib/store";
  import { abbreviateNumber, formatString } from "$lib/utils";
  import Sankey from "$lib/components/Sankey.svelte";
  import { LayerCake, Svg } from "layercake";
  import { countryList } from "$lib/country-list.ts";

  import InfoModal from "$lib/components/InfoModal.svelte";

  export let userTier;
  export let apiURL;
  export let apiKey;

  let isLoaded = false;

  let revenueSegmentation = [];

  let data = [];
  let geographicList = [];
  let totalProductRevenue = 0;
  let totalGeographicRevenue = 0;

  async function prepareData(output) {
    const outputProduct = output?.at(0) ?? [];
    const outputGeographic = output?.at(1) ?? [];

    totalProductRevenue = 0;
    totalGeographicRevenue = 0;

    data = [];
    geographicList = [];

    if (outputProduct?.length !== 0) {
      const productData = outputProduct[0];
      const productKeys = Object?.keys(productData);

      let nodes = [];
      let links = [];

      for (const key of productKeys) {
        const values = productData[key];
        let count = 0;
        for (const category in values) {
          if (count >= 4) break; // Stop after the fifth element
          const value = values[category];
          if (value > 0) {
            nodes?.push({
              id: (category?.length > 35 ? category?.slice(0, 35) + "..." : category) + ' · ' +`$${abbreviateNumber(value)}`,
            });
            links?.push({
              source: (category?.length > 35 ? category?.slice(0, 35) + "..." : category) + ' · ' +`$${abbreviateNumber(value)}`,
              target: "Revenue",
              value: value,
            });
            totalProductRevenue += value;
            count++;
          }
        }
      }
      nodes?.push({ id: "Revenue" });
      links = links?.sort((a, b) => b?.value - a?.value);

      data = {
        nodes: nodes,
        links: links,
      };

      //console.log(data)
    }

    if (outputGeographic?.length !== 0) {
      const geographicData = outputGeographic[0];
      const geographicKeys = Object.keys(geographicData);

      for (const key of geographicKeys) {
        const values = geographicData[key];
        for (const category in values) {
          const value = values[category];
          geographicList?.push({
            name: category?.replace("Other Geographical", "Other"),
            value: value,
          });
          totalGeographicRevenue += value;
        }
      }

      geographicList?.sort((a, b) => b?.value - a?.value);
    }

    geographicList?.forEach((item) => {
      if (item?.name === "TAIWAN, PROVINCE OF CHINA") {
        item.name = "TAIWAN";
      } else if (item?.name === "KOREA, REPUBLIC OF") {
        item.name = "South Korea";
      }
    });

    geographicList = geographicList?.map((item) => {
      return {
        ...item,
        name: item?.name?.replace("Video Game Brands - ", ""),
      };
    });
    // Create an index for quick lookups
    const countryIndex = countryList?.reduce((acc, country) => {
      acc[country.long] = country.short;
      return acc;
    }, {});

    // Update the originalList with the "code" property
    geographicList = geographicList?.map((item) => ({
      ...item,
      code: countryIndex[formatString(item?.name)]?.toLowerCase() || "xx",
    }));

    geographicList = [...geographicList];

    if (Object?.keys(data)?.length !== 0 && totalProductRevenue !== 0) {
      $revenueSegmentationComponent = true;
    } else {
      $revenueSegmentationComponent = false;
    }
  }

  const getRevenueSegmentation = async (ticker) => {
    // Get cached data for the specific tickerID
    const cachedData = getCache(ticker, "getRevenueSegmentation");
    if (cachedData) {
      revenueSegmentation = cachedData;
    } else {
      const postData = { ticker: ticker };
      // make the POST request to the endpoint
      const response = await fetch(apiURL + "/revenue-segmentation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify(postData),
      });

      revenueSegmentation = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getRevenueSegmentation'
      setCache(ticker, revenueSegmentation, "getRevenueSegmentation");
    }
  };

  $: {
    if ($stockTicker && typeof window !== "undefined") {
      isLoaded = false;
      showFullStats = false;
      data = [];
      geographicList = [];
      totalProductRevenue = 0;
      totalGeographicRevenue = 0;
      const ticker = $stockTicker;

      const asyncFunctions = [getRevenueSegmentation(ticker)];
      Promise.all(asyncFunctions)
        .then((results) => {
          prepareData(revenueSegmentation);
        })
        .catch((error) => {
          console.error("An error occurred:", error);
        });
      isLoaded = true;
    }
  }

  let showFullStats = false;
$: charNumber = $screenWidth < 640 ? 25 :40;

</script>

<section class="overflow-hidden text-white h-full pb-8">
  <main class="overflow-hidden">
    <div class="flex flex-row items-center">
      <label for="revenueProductSegmentationInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold"> Revenue Breakdown </label>
      <InfoModal
        title={"Revenue Breakdown"}
        content={"A revenue stream for a company is how they make money. It can come from selling things, providing services, or other sources. These different ways of making money add up to keep the company running and growing."}
        id={"revenueProductSegmentationInfo"}
      />
    </div>

    {#if userTier === "Pro"}
      {#if isLoaded}
        {#if Object?.keys(data)?.length !== 0 && totalProductRevenue !== 0}
          <div class="mt-2 pb-4">
            <div class="text-white text-md mt-3 w-full mb-5">Based on the latest earnings report the main contributors of revenue are:</div>

            <div class="mt-5 w-full rounded-full flex justify-center items-center">
              <div class="flex flex-col items-center w-full">
                <div class="chart-container">
                  <LayerCake {data}>
                    <Svg>
                      <Sankey colorNodes={(d) => "#3B82F6"} colorLinks={(d) => "#3B82F635"} />
                    </Svg>
                  </LayerCake>
                </div>

                <a href={`/stocks/${$stockTicker}/stats/income`} class="mt-10 mr-3 sm:mr-0 ml-auto text-blue-400 hover:text-white"> Full report </a>
              </div>
            </div>
          </div>

          {#if geographicList?.length !== 0 && totalGeographicRevenue !== 0}
            <div class="text-white text-md mt-6">
              The highest revenue was generated in the {geographicList?.length} regions:
            </div>

            <div class="w-full rounded-full flex justify-center items-center">
              <div class="flex flex-col items-center w-full">
                <!--Start Progress-->
                {#each showFullStats ? geographicList : geographicList?.slice(0, 3) as item, index}
                  <div class="shadow-lg bg-[#27272A] w-full rounded-lg p-4 sm:p-3 mb-5 flex flex-row items-center {index === 0 ? 'mt-4' : ''} {index === 2 && !showFullStats && geographicList?.length > 3 ? 'opacity-[0.3]' : ''}">
                    <div class="mr-3 rounded-full w-8 h-8 sm:w-10 sm:h-10 relative bg-[#27272A]">
                      {#if item?.name?.toLowerCase() === "europe"}
                        <svg class="rounded-full w-6 h-6 sm:w-7 sm:h-7 absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"
                          ><mask id="circleFlagsEu0"><circle cx="256" cy="256" r="256" fill="#fff" /></mask><g mask="url(#circleFlagsEu0)"
                            ><path fill="#0052b4" d="M0 0h512v512H0z" /><path
                              fill="#ffda44"
                              d="m256 100.2l8.3 25.5H291l-21.7 15.7l8.3 25.6l-21.7-15.8l-21.7 15.8l8.3-25.6l-21.7-15.7h26.8zm-110.2 45.6l24 12.2l18.9-19l-4.2 26.5l23.9 12.2l-26.5 4.2l-4.2 26.5l-12.2-24l-26.5 4.3l19-19zM100.2 256l25.5-8.3V221l15.7 21.7l25.6-8.3l-15.8 21.7l15.8 21.7l-25.6-8.3l-15.7 21.7v-26.8zm45.6 110.2l12.2-24l-19-18.9l26.5 4.2l12.2-23.9l4.2 26.5l26.5 4.2l-24 12.2l4.3 26.5l-19-19zM256 411.8l-8.3-25.5H221l21.7-15.7l-8.3-25.6l21.7 15.8l21.7-15.8l-8.3 25.6l21.7 15.7h-26.8zm110.2-45.6l-24-12.2l-18.9 19l4.2-26.5l-23.9-12.2l26.5-4.2l4.2-26.5l12.2 24l26.5-4.3l-19 19zM411.8 256l-25.5 8.3V291l-15.7-21.7l-25.6 8.3l15.8-21.7l-15.8-21.7l25.6 8.3l15.7-21.7v26.8zm-45.6-110.2l-12.2 24l19 18.9l-26.5-4.2l-12.2 23.9l-4.2-26.5l-26.5-4.2l24-12.2l-4.3-26.5l19 19z"
                            /></g
                          ></svg
                        >
                      {:else if item?.name?.toLowerCase() === "taiwan"}
                        <svg class="rounded-full w-6 h-6 sm:w-7 sm:h-7 absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"
                          ><path fill="#ed4c5c" d="M32 2v30H2c0 16.6 13.4 30 30 30s30-13.4 30-30S48.6 2 32 2" /><path fill="#2a5f9e" d="M32 2C15.4 2 2 15.4 2 32h30z" /><path
                            fill="#fff"
                            d="m24 20.3l5-1.3l-5-1.3l3.7-3.7l-5 1.3l1.3-5l-3.7 3.7L19 9l-1.3 5l-3.7-3.7l1.3 5l-5-1.3l3.7 3.7L9 19l5 1.3l-3.7 3.7l5-1.3l-1.3 5l3.7-3.7l1.3 5l1.3-5l3.7 3.7l-1.3-5l5 1.3z"
                          /><circle cx="19" cy="19" r="5.7" fill="#428bc1" /><circle cx="19" cy="19" r="5" fill="#fff" /></svg
                        >
                      {:else if item?.code == "xx"}
                        <svg class="rounded-full w-6 h-6 sm:w-7 sm:h-7 absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"
                          ><path fill="#7cb342" d="M24 4C13 4 4 13 4 24s9 20 20 20s20-9 20-20S35 4 24 4" /><path
                            fill="#0277bd"
                            d="M45 24c0 11.7-9.5 21-21 21S3 35.7 3 24S12.3 3 24 3s21 9.3 21 21m-21.2 9.7c0-.4-.2-.6-.6-.8c-1.3-.4-2.5-.4-3.6-1.5c-.2-.4-.2-.8-.4-1.3c-.4-.4-1.5-.6-2.1-.8h-4.2c-.6-.2-1.1-1.1-1.5-1.7c0-.2 0-.6-.4-.6c-.4-.2-.8.2-1.3 0c-.2-.2-.2-.4-.2-.6c0-.6.4-1.3.8-1.7c.6-.4 1.3.2 1.9.2c.2 0 .2 0 .4.2c.6.2.8 1 .8 1.7v.4c0 .2.2.2.4.2c.2-1.1.2-2.1.4-3.2c0-1.3 1.3-2.5 2.3-2.9c.4-.2.6.2 1.1 0c1.3-.4 4.4-1.7 3.8-3.4c-.4-1.5-1.7-2.9-3.4-2.7c-.4.2-.6.4-1 .6c-.6.4-1.9 1.7-2.5 1.7c-1.1-.2-1.1-1.7-.8-2.3c.2-.8 2.1-3.6 3.4-3.1l.8.8c.4.2 1.1.2 1.7.2c.2 0 .4 0 .6-.2c.2-.2.2-.2.2-.4c0-.6-.6-1.3-1-1.7c-.4-.4-1.1-.8-1.7-1.1c-2.1-.6-5.5.2-7.1 1.7s-2.9 4-3.8 6.1c-.4 1.3-.8 2.9-1 4.4c-.2 1-.4 1.9.2 2.9c.6 1.3 1.9 2.5 3.2 3.4c.8.6 2.5.6 3.4 1.7c.6.8.4 1.9.4 2.9c0 1.3.8 2.3 1.3 3.4c.2.6.4 1.5.6 2.1c0 .2.2 1.5.2 1.7c1.3.6 2.3 1.3 3.8 1.7c.2 0 1-1.3 1-1.5c.6-.6 1.1-1.5 1.7-1.9c.4-.2.8-.4 1.3-.8c.4-.4.6-1.3.8-1.9c.1-.5.3-1.3.1-1.9m.4-19.4c.2 0 .4-.2.8-.4c.6-.4 1.3-1.1 1.9-1.5c.6-.4 1.3-1.1 1.7-1.5c.6-.4 1.1-1.3 1.3-1.9c.2-.4.8-1.3.6-1.9c-.2-.4-1.3-.6-1.7-.8c-1.7-.4-3.1-.6-4.8-.6c-.6 0-1.5.2-1.7.8c-.2 1.1.6.8 1.5 1.1c0 0 .2 1.7.2 1.9c.2 1-.4 1.7-.4 2.7c0 .6 0 1.7.4 2.1zM41.8 29c.2-.4.2-1.1.4-1.5c.2-1 .2-2.1.2-3.1c0-2.1-.2-4.2-.8-6.1c-.4-.6-.6-1.3-.8-1.9c-.4-1.1-1-2.1-1.9-2.9c-.8-1.1-1.9-4-3.8-3.1c-.6.2-1 1-1.5 1.5c-.4.6-.8 1.3-1.3 1.9c-.2.2-.4.6-.2.8c0 .2.2.2.4.2c.4.2.6.2 1 .4c.2 0 .4.2.2.4c0 0 0 .2-.2.2c-1 1.1-2.1 1.9-3.1 2.9c-.2.2-.4.6-.4.8c0 .2.2.2.2.4s-.2.2-.4.4c-.4.2-.8.4-1.1.6c-.2.4 0 1.1-.2 1.5c-.2 1.1-.8 1.9-1.3 2.9c-.4.6-.6 1.3-1 1.9c0 .8-.2 1.5.2 2.1c1 1.5 2.9.6 4.4 1.3c.4.2.8.2 1.1.6c.6.6.6 1.7.8 2.3c.2.8.4 1.7.8 2.5c.2 1 .6 2.1.8 2.9c1.9-1.5 3.6-3.1 4.8-5.2c1.5-1.3 2.1-3 2.7-4.7"
                          /></svg
                        >
                      {:else}
                        <img class="rounded-full w-6 h-6 sm:w-7 sm:h-7 absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2" src={`https://hatscripts.github.io/circle-flags/flags/${item?.code}.svg`} alt="Country Logo" />
                      {/if}
                    </div>

                    <div class="flex flex-col -mt-3 sm:-mt-5 w-full">
                      <div class="flex flex-row items-center w-full">
                        <span class="text-white text-sm sm:text-md font-medium text-start mb-2 mr-auto mt-2">
                          {item?.name?.length > charNumber ? formatString(item?.name)?.slice(0, charNumber) + "..." : formatString(item?.name)} · ${abbreviateNumber(item?.value)}
                        </span>
                        <span class="text-white text-sm sm:text-md font-medium ml-auto">
                          {((item?.value / totalGeographicRevenue) * 100)?.toFixed(2)}%
                        </span>
                      </div>
                      <progress class="progress bg-[#3B3D3F] [&::-webkit-progress-value]:bg-[#10DB06] [&::-moz-progress-bar]:bg-[#10DB06]" value={(item?.value / totalGeographicRevenue) * 100} max="100"></progress>
                    </div>
                  </div>
                {/each}
                <!--End Progress-->
              </div>
            </div>
          {/if}

          {#if geographicList?.length > 3}
            <label on:click={() => (showFullStats = !showFullStats)} class="cursor-pointer m-auto flex justify-center items-center mt-5">
              <svg class="w-10 h-10 transform {showFullStats ? 'rotate-180' : ''} " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                ><path fill="#2A323C" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 13.5L7.5 11l1.42-1.41L12 12.67l3.08-3.08L16.5 11L12 15.5z" /></svg
              >
            </label>{/if}
        {/if}
      {:else}
        <div class="flex justify-center items-center h-80">
          <div class="relative">
            <label class="bg-[#09090B] rounded-xl h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span class="loading loading-spinner loading-md"></span>
            </label>
          </div>
        </div>
      {/if}
    {:else}
      <div class="shadow-lg shadow-bg-[#000] bg-[#111112] sm:bg-opacity-[0.5] text-sm sm:text-[1rem] rounded-md w-full p-4 min-h-24 mt-4 text-white m-auto flex justify-center items-center text-center font-semibold">
        <svg class="mr-1.5 w-5 h-5 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
          ><path fill="#A3A3A3" d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z" /></svg
        >
        Unlock content with <a class="inline-block ml-2 text-blue-400 hover:sm:text-white" href="/pricing">Pro Subscription</a>
      </div>
    {/if}
  </main>
</section>

<style>
  .app {
    height: 300px;
    max-width: 100%; /* Ensure chart width doesn't exceed the container */
  }

  @media (max-width: 640px) {
    .app {
      height: 180px;
    }
  }

  .chart {
    width: 100%;
  }

  .chart-container {
    width: 100%;
    height: 250px;
  }
</style>

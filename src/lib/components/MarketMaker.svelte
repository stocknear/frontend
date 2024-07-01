<script lang ='ts'>
  import { marketMakerComponent, displayCompanyName, stockTicker, assetType, etfTicker, screenWidth, userRegion, getCache, setCache} from '$lib/store';
  import InfoModal from '$lib/components/InfoModal.svelte';
  import { Chart } from 'svelte-echarts'
  import { abbreviateNumber, formatString } from "$lib/utils";

  import Lazy from 'svelte-lazy';
  export let data;

  let isLoaded = false;
  const usRegion = ['cle1','iad1','pdx1','sfo1'];

  let apiURL;

  userRegion.subscribe(value => {

      if (usRegion.includes(value)) {
      apiURL = import.meta.env.VITE_USEAST_API_URL;
      } else {
      apiURL = import.meta.env.VITE_EU_API_URL;
      }
  });

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  let rawData = {};
  let historyData = [];
  let topMarketMakers = [];
  let optionsData;
  let avgTradeCount;
  let avgShareQuantity;
  let avgNotionalSum;
  let showFullStats = false;

function formatDateRange(lastDateStr) {
  // Convert lastDateStr to Date object
  const lastDate = new Date(lastDateStr);

  // Get today's date for the first date (assuming today is the last date in your original logic)
  const firstDate = new Date(lastDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Format first and last dates
  const firstDateFormatted = firstDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', day: '2-digit' });
  const lastDateFormatted = lastDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', day: '2-digit' });

  // Construct and return the formatted date range string
  return `${firstDateFormatted} - ${lastDateFormatted}`;
}

function normalizer(value) {
if (Math?.abs(value) >= 1e18) {
  return { unit: 'Q', denominator: 1e18 };
} else if (Math?.abs(value) >= 1e12) {
  return { unit: 'T', denominator: 1e12 };
} else if (Math?.abs(value) >= 1e9) {
  return { unit: 'B', denominator: 1e9 };
} else if (Math?.abs(value) >= 1e6) {
  return { unit: 'M', denominator: 1e6 };
} else if (Math?.abs(value) >= 1e5) {
  return { unit: 'K', denominator: 1e5 };
} else {
  return { unit: '', denominator: 1 };
}
}


function getPlotOptions() {
  let dates = [];
  let tradeCountList = [];
  let shareQuantityList = [];
  let notionalSumList = [];
  // Iterate over the data and extract required information
  historyData?.forEach(item => {

  dates?.push(item?.date);
  tradeCountList?.push(item?.totalWeeklyTradeCount);
  shareQuantityList?.push(item?.totalWeeklyShareQuantity)
  notionalSumList?.push(item?.totalNotionalSum)
  });

  
  // Compute the average of item?.traded
  const totalTraded = tradeCountList?.reduce((acc, traded) => acc + traded, 0);
  avgTradeCount = totalTraded / tradeCountList?.length;

  const totalShare = shareQuantityList?.reduce((acc, item) => acc + item, 0);
  avgShareQuantity = totalShare / shareQuantityList?.length;

  const totalSum = notionalSumList?.reduce((acc, sentiment) => acc + sentiment, 0);
  avgNotionalSum = totalSum / notionalSumList?.length;


  const {unit, denominator } = normalizer(Math.max(...notionalSumList) ?? 0)
  const { unit: shareUnit, denominator: shareDenominator } = normalizer(Math.max(...shareQuantityList) ?? 0);

  const option = {
  silent: true,
  animation: $screenWidth < 640 ? false: true,
  grid: {
      left: '2%',
      right: '2%',
      bottom: '2%',
      top: '5%',
      containLabel: true
  },
  xAxis:
  {
      type: 'category',
      boundaryGap: false,
      data: dates,
  },
  yAxis: [
  { 
      type: 'value',
      splitLine: {
          show: false, // Disable x-axis grid lines
      },
      axisLabel: {
          color: '#6E7079', // Change label color to white
          formatter: function (value, index) {
              // Display every second tick
              if (index % 2 === 0) {
                  value = Math.max(value, 0);
                  return '$'+(value / denominator)?.toFixed(1) + unit; // Format value in millions
              } else {
                  return ''; // Hide this tick
              }
          }
      },
  },
  {
    type: 'value',
    splitLine: {
          show: false, // Disable x-axis grid lines
    },
    position: 'right',
    axisLabel: {
        formatter: function (value, index) {
          if (index % 2 === 0) {
            return (value / shareDenominator)?.toFixed(1) + shareUnit; // Format value in millions
          } else {
                return ''; // Hide this tick
            }
        }
    }
  }
  ],
  series: [
      {
          data: notionalSumList,
          type: 'line',
          itemStyle: {
              color: '#fff' // Change bar color to white
          },
          showSymbol: false
      },
      {
          data: shareQuantityList,
          type: 'line',
          areaStyle: {opacity: 0.3},
          yAxisIndex: 1,
          itemStyle: {
              color: '#00BBFF' // Change bar color to white
          },
          showSymbol: false
      },
  ]
  };


return option;
}

const getMarketMaker = async (ticker) => {
  // Get cached data for the specific tickerID
  const cachedData = getCache(ticker, 'getMarketMaker');
  if (cachedData) {
    rawData = cachedData;
  } else {

    const postData = {'ticker': ticker};
    // make the POST request to the endpoint
    const response = await fetch(apiURL + '/market-maker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
    });

    rawData = await response.json();
    // Cache the data for this specific tickerID with a specific name 'getMarketMaker'
    setCache(ticker, rawData, 'getMarketMaker');
  }
  
  if(Object?.keys(rawData)?.length !== 0) {
    $marketMakerComponent = true;
  } else {
    $marketMakerComponent = false;
  }
};


$: {
if($assetType === 'stock' ? $stockTicker :$etfTicker && typeof window !== 'undefined') {
  isLoaded=false;
  showFullStats = false;
  const ticker = $assetType === 'stock' ? $stockTicker :$etfTicker
  const asyncFunctions = [
    getMarketMaker(ticker)
    ];
    Promise.all(asyncFunctions)
        .then((results) => {
          topMarketMakers = rawData?.topMarketMakers ?? [];
          historyData = rawData?.history;
          optionsData = getPlotOptions()
        })
        .catch((error) => {
          console.error('An error occurred:', error);
        });
  isLoaded = true;

}
}

let charNumber = 20;

$: {
if($screenWidth < 640)
{
  charNumber = 20;
}
else {
  charNumber =40;
}
}
  


</script>
  
  
  
  
<section class="overflow-hidden text-white h-full pb-8">
  <main class="overflow-hidden ">
                  
      <div class="flex flex-row items-center">
          <label for="marketMakerInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold">
              Market Maker Activity
          </label>
          <InfoModal
            title={"Market Maker Activity"}
            content={"Market makers provide liquidity by quoting buy and sell prices, stabilizing markets. For retail traders, understanding this helps navigate tight spreads, execute trades effectively, and gauge market sentiment."}
            id={"marketMakerInfo"}
          />
      </div>

      {#if data?.user?.tier === 'Pro'}
      {#if isLoaded}

      {#if historyData?.length !== 0}

      <div class="w-full flex flex-col items-start">
          <div class="text-white text-sm sm:text-[1rem] mt-2 mb-2 w-full">
              Over the past year, {$displayCompanyName} has seen a weekly average of
              <span class="font-semibold">{abbreviateNumber(avgTradeCount)}</span> trades, involving an average of
              <span class="font-semibold">{abbreviateNumber(avgShareQuantity)}</span> shares bought and sold.
              This activity sums up to an average total notional value of
              <span class="font-semibold">{abbreviateNumber(avgNotionalSum,true)}</span>.
          </div>
      </div>

      <div class="pb-2 rounded-lg bg-[#0F0F0F]">
              
        
          <Lazy height={300} fadeOption={{delay: 100, duration: 500}} keep={true}>
              <div class="app w-full h-[300px] mt-5">
                  <Chart options={optionsData} class="chart" />
              </div>
          </Lazy>
      
      </div>

      <div class="flex flex-row items-center justify-between mx-auto mt-5 w-full sm:w-11/12">
          <div class="mt-3.5 sm:mt-0 flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
          <div class="h-full transform -translate-x-1/2 " aria-hidden="true"></div>
          <div class="w-3 h-3 bg-[#fff] border-4 box-content border-[#202020] rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
          <span class="mt-2 sm:mt-0 text-white text-center sm:text-start text-xs sm:text-md inline-block">
              Notional Sum
          </span>
      </div>
          <div class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
              <div class="h-full transform -translate-x-1/2 " aria-hidden="true"></div>
              <div class="w-3 h-3 bg-[#00BBFF] border-4 box-content border-[#202020] rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
              <span class="mt-2 sm:mt-0 text-white text-xs sm:text-md sm:font-medium inline-block">
                  Share Quantity
              </span>
          </div>

      </div>


      <h2 class="mt-10 mr-1 flex flex-row items-center text-white text-xl sm:text-2xl font-bold mb-3">
          Latest Information
      </h2>


        <div class="flex justify-start items-center w-full m-auto ">
          <table class="w-full" data-test="statistics-table">
            <tbody>
                <tr class="border-y border-gray-800 odd:bg-[#202020]">
                    <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                        <span>Date</span>
                    </td>
                    <td class="px-[5px] py-1.5 text-right text-sm sm:text-[1rem] font-medium xs:px-2.5 xs:py-2">
                      {formatDateRange(historyData?.slice(-1)?.at(0)?.date)}
                    </td>
                </tr>
                <tr class="border-y border-gray-800 odd:bg-[#202020]">
                    <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                        <span>Total Notional Sum</span>
                    </td>
                    <td class="px-[5px] py-1.5 text-right font-medium xs:px-2.5 xs:py-2">
                      ${abbreviateNumber(historyData?.slice(-1)?.at(0)?.totalNotionalSum)}
                    </td>
                </tr>
                <tr class="border-y border-gray-800 odd:bg-[#202020]">
                    <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                        <span>Total Trade Count</span>
                    </td>
                    <td class="px-[5px] py-1.5 text-right font-medium xs:px-2.5 xs:py-2">
                      {abbreviateNumber(historyData?.slice(-1)?.at(0)?.totalWeeklyTradeCount)}
                    </td>
                </tr>
                <tr class="border-y border-gray-800 odd:bg-[#202020]">
                  <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                      <span>Total Share Quantity</span>
                  </td>
                  <td class="px-[5px] py-1.5 text-right font-medium xs:px-2.5 xs:py-2">
                    {abbreviateNumber(historyData?.slice(-1)?.at(0)?.totalWeeklyShareQuantity)}
                  </td>
              </tr>
            </tbody>
        </table>
        </div>


      <h3 class="mt-10 mr-1 flex flex-row items-center text-white text-xl sm:text-2xl font-bold mb-3">
          Top 10 Market Makers Activity
      </h3>
      These market makers represent the highest average trading activity for {$displayCompanyName} over the past 12 months, calculated on a weekly basis.
  
        <div class="flex justify-start items-center w-full m-auto mt-6 overflow-x-scroll no-scrollbar">
          <table class="table table-sm table-compact w-full">
            <thead>
              <tr class="border-b border-blue-400">
                <th class="text-white shadow-md font-semibold text-sm text-start bg-[#0F0F0F]">Name</th>
                <th class="text-white shadow-md font-semibold text-sm text-end bg-[#0F0F0F]">Trade Count</th>
                <th class="text-white shadow-md font-semibold text-sm text-end bg-[#0F0F0F]">Share Quantity</th>
                <th class="text-white shadow-md font-semibold text-sm text-end bg-[#0F0F0F]">Notional Sum</th>
              </tr>
            </thead>
            <tbody>
              {#each (showFullStats ? topMarketMakers?.slice(0,10) : topMarketMakers?.slice(0,3)) as item,index}
              <tr class="border-y border-gray-800 odd:bg-[#202020] {index === 2 && !showFullStats && topMarketMakers?.length > 3 ? 'opacity-[0.5]' : '' } sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] bg-[#0F0F0F] border-b-[#0F0F0F]">
               
                  <td class="text-white font-medium">
                   {item?.name?.length > charNumber ? formatString(item?.name?.slice(0,charNumber)) + "..." : formatString(item?.name)}
                  </td>
              
                  <td class="text-white text-end font-medium">
                      {abbreviateNumber(item?.avgWeeklyTradeCount)}
                  </td>

                  <td class="text-white text-end font-medium">
                      {abbreviateNumber(item?.avgWeeklyShareQuantity)}
                  </td>
              
                  <td class="text-white text-end font-medium ">
                      {abbreviateNumber(item?.avgNotionalSum, true)}
                  </td>
              </tr>
              {/each}
            </tbody>
          </table>

  
        </div>

        <label on:click={() => showFullStats = !showFullStats} class="cursor-pointer flex justify-center items-center mt-5">
          <svg class="w-10 h-10 transform {showFullStats ? 'rotate-180' : ''} " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#2A323C" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 13.5L7.5 11l1.42-1.41L12 12.67l3.08-3.08L16.5 11L12 15.5z"/></svg>
      </label>

      
      {/if}

      {:else}
      <div class="flex justify-center items-center h-80">
          <div class="relative">
          <label class="bg-[#202020] rounded-xl h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span class="loading loading-spinner loading-md"></span>
          </label>
          </div>
      </div>
      {/if}

      {:else}
      <div class="shadow-lg shadow-bg-[#000] bg-[#202020] sm:bg-opacity-[0.5] text-sm sm:text-[1rem] rounded-md w-full p-4 min-h-24 mt-4 text-white m-auto flex justify-center items-center text-center font-semibold">
          <svg class="mr-1.5 w-5 h-5 inline-block"xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#A3A3A3" d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"/></svg>
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
  height: 210px;
}
}

.chart {
width: 100%;
}

</style>
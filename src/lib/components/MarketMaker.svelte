<script lang ='ts'>
  import { marketMakerComponent, displayCompanyName, stockTicker, assetType, etfTicker, screenWidth, getCache, setCache} from '$lib/store';
  import InfoModal from '$lib/components/InfoModal.svelte';
  import { Chart } from 'svelte-echarts'
  import { abbreviateNumber, formatString, formatDateRange, monthNames } from "$lib/utils";

  import { init, use } from 'echarts/core'
  import { LineChart } from 'echarts/charts'
  import { GridComponent, TooltipComponent } from 'echarts/components'
  import { CanvasRenderer } from 'echarts/renderers'

  use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])


  export let data;

  let isLoaded = false;


  let rawData = {};
  let historyData = [];
  let topMarketMakers = [];
  let optionsData;
  let avgTradeCount;
  let avgShareQuantity;
  let avgNotionalSum;
  let showFullStats = false;




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



  const option = {
  silent: true,
  animation: false,
  tooltip: {
        trigger: 'axis',
        hideDelay: 100, // Set the delay in milliseconds
    },
  grid: {
      left: '3%',
      right: '3%',
      bottom: '2%',
      top: '5%',
      containLabel: true
  },
   xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLabel: {
        color: '#fff',
        formatter: function (value) {
            // Assuming dates are in the format 'yyyy-mm-dd'
            // Extract the month and day from the date string and convert the month to its abbreviated name
            const dateParts = value.split('-');
            const day = dateParts[2].substring(0); // Extracting the last two digits of the year
            const monthIndex = parseInt(dateParts[1]) - 1; // Months are zero-indexed in JavaScript Date objects
            return `${day} ${monthNames[monthIndex]}`;
        }
        }
    },
  yAxis: [
  { 
      type: 'value',
      splitLine: {
          show: false, // Disable x-axis grid lines
      },
      axisLabel: {
        show: false // Hide y-axis labels
      },
  },
  {
    type: 'value',
    splitLine: {
          show: false, // Disable x-axis grid lines
    },
    position: 'right',
    axisLabel: {
        show: false // Hide y-axis labels
      },
  }
  ],
  series: [
      { name: 'Notional Sum',
          data: notionalSumList,
          type: 'line',
          itemStyle: {
              color: '#fff' // Change bar color to white
          },
          showSymbol: false
      },
      { 
        name: 'Shares',
          data: shareQuantityList,
          type: 'line',
          areaStyle: {opacity: 1},
          yAxisIndex: 1,
          itemStyle: {
              color: '#408FFF' // Change bar color to white
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

    const postData = {'ticker': ticker, path: 'market-maker'};
    // make the POST request to the endpoint
    const response = await fetch('/api/ticker-data', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(postData)
    });

    rawData = await response?.json();
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

      {#if isLoaded}

      {#if historyData?.length !== 0}

      <div class="w-full flex flex-col items-start">
          <div class="text-white text-[1rem] mt-2 mb-2 w-full">
              Over the past year, {$displayCompanyName} has seen a weekly average of
              <span class="font-semibold">{abbreviateNumber(avgTradeCount)}</span> trades, involving an average of
              <span class="font-semibold">{abbreviateNumber(avgShareQuantity)}</span> shares bought and sold.
              This activity sums up to an average total notional value of
              <span class="font-semibold">{abbreviateNumber(avgNotionalSum,true)}</span>.
          </div>
      </div>

      <div class="pb-2 rounded-lg bg-[#09090B]">
              
        
          <div class="app w-full h-[300px] mt-5">
              <Chart {init} options={optionsData} class="chart" />
          </div>
      
      </div>

      <div class="flex flex-row items-center justify-between mx-auto mt-5 w-full sm:w-11/12">
          <div class="mt-3.5 sm:mt-0 flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
          <div class="h-full transform -translate-x-1/2 " aria-hidden="true"></div>
          <div class="w-3 h-3 bg-[#fff] border-4 box-content border-[#27272A] rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
          <span class="mt-2 sm:mt-0 text-white text-center sm:text-start text-xs sm:text-md inline-block">
              Notional Sum
          </span>
      </div>
          <div class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
              <div class="h-full transform -translate-x-1/2 " aria-hidden="true"></div>
              <div class="w-3 h-3 bg-[#3B82F6] border-4 box-content border-[#27272A] rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
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
                <tr class="border-y border-gray-800 odd:bg-[#27272A]">
                    <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                        <span>Date</span>
                    </td>
                    <td class="px-[5px] py-1.5 text-right whitespace-nowrap font-medium xs:px-2.5 xs:py-2">
                      {formatDateRange(historyData?.slice(-1)?.at(0)?.date)}
                    </td>
                </tr>
                <tr class="border-y border-gray-800 odd:bg-[#27272A]">
                    <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                        <span>Total Notional Sum</span>
                    </td>
                    <td class="px-[5px] py-1.5 text-right font-medium xs:px-2.5 xs:py-2">
                      ${abbreviateNumber(historyData?.slice(-1)?.at(0)?.totalNotionalSum)}
                    </td>
                </tr>
                <tr class="border-y border-gray-800 odd:bg-[#27272A]">
                    <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                        <span>Total Trade Count</span>
                    </td>
                    <td class="px-[5px] py-1.5 text-right font-medium xs:px-2.5 xs:py-2">
                      {abbreviateNumber(historyData?.slice(-1)?.at(0)?.totalWeeklyTradeCount)}
                    </td>
                </tr>
                <tr class="border-y border-gray-800 odd:bg-[#27272A]">
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
              <tr class="">
                <th class="text-white shadow-md font-semibold text-sm text-start bg-[#09090B]">Name</th>
                <th class="text-white shadow-md font-semibold text-sm text-end bg-[#09090B]">Trade Count</th>
                <th class="text-white shadow-md font-semibold text-sm text-end bg-[#09090B]">Share Quantity</th>
                <th class="text-white shadow-md font-semibold text-sm text-end bg-[#09090B]">Notional Sum</th>
              </tr>
            </thead>
            <tbody>
              {#each (showFullStats ? topMarketMakers?.slice(0,10) : topMarketMakers?.slice(0,3)) as item,index}
              <tr class="border-y border-gray-800 odd:bg-[#27272A] {index === 2 && !showFullStats && topMarketMakers?.length > 3 ? 'opacity-[0.5]' : '' } sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] bg-[#09090B] border-b-[#09090B]">
               
                  <td class="text-white text-sm sm:text-[1rem] font-medium whitespace-nowrap">
                   {item?.name?.length > charNumber ? formatString(item?.name?.slice(0,charNumber)) + "..." : formatString(item?.name)}
                  </td>
              
                  <td class="text-white text-end text-sm sm:text-[1rem] font-medium whitespace-nowrap">
                      {abbreviateNumber(Math.floor(item?.avgWeeklyTradeCount))}
                  </td>

                  <td class="text-white text-end text-sm sm:text-[1rem] font-medium whitespace-nowrap">
                      {abbreviateNumber(Math.floor(item?.avgWeeklyShareQuantity))}
                  </td>
              
                  <td class="text-white text-end text-sm sm:text-[1rem] font-medium whitespace-nowrap">
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
          <label class="bg-[#09090B] rounded-xl h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span class="loading loading-spinner loading-md"></span>
          </label>
          </div>
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
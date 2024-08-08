<script lang ='ts'>
  import { darkPoolComponent, displayCompanyName, stockTicker, assetType, etfTicker, screenWidth, getCache, setCache} from '$lib/store';
  import InfoModal from '$lib/components/InfoModal.svelte';
  import { Chart } from 'svelte-echarts'
  import { abbreviateNumber, formatDateRange } from "$lib/utils";
  import { init, use } from 'echarts/core'
  import { LineChart } from 'echarts/charts'
  import { GridComponent } from 'echarts/components'
  import { CanvasRenderer } from 'echarts/renderers'

  use([LineChart, GridComponent, CanvasRenderer])

    export let data;

    let isLoaded = false;

    let rawData = [];
    let optionsData;
    let avgVolume;
    let avgShortVolume;
    let monthlyVolume;
    let avgMonthlyShort;

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


function findMonthlyValue(data, lastDateStr) {
    // Convert lastDateStr to Date object
    const lastDate = new Date(lastDateStr);
  
    // Set the first date to the beginning of the month of lastDate
    const firstDate = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1);
  
    // Filter data to include only prices within the specified month period
    const filteredData = data.filter(item => {
        const currentDate = new Date(item?.date);
        return currentDate >= firstDate && currentDate <= lastDate;
    });
    	
    // Extract prices from filtered data
    monthlyVolume = abbreviateNumber(filteredData?.reduce((accumulator, currentItem) => {
        return accumulator + currentItem?.totalVolume;
    }, 0));


    const totalShortPercent = filteredData.reduce((accumulator, currentItem) => {
        return accumulator + (currentItem?.shortPercent || 0);
    }, 0);

    avgMonthlyShort = (totalShortPercent / filteredData?.length)?.toFixed(2);



}


function getPlotOptions() {
    let dates = [];
    let totalVolumeList = [];
    let shortVolumeList = [];
    // Iterate over the data and extract required information
    rawData?.forEach(item => {

    dates?.push(item?.date);
    totalVolumeList?.push(item?.totalVolume);
    shortVolumeList?.push(item?.shortVolume)

    });

    findMonthlyValue(rawData, rawData?.slice(-1)?.at(0)?.date)

    // Compute the average of item?.traded
    const totalTraded = totalVolumeList?.reduce((acc, traded) => acc + traded, 0);
    avgVolume = totalTraded / totalVolumeList?.length;

    const totalShort = shortVolumeList?.reduce((acc, sentiment) => acc + sentiment, 0);
    avgShortVolume = totalShort / shortVolumeList?.length;

    const {unit, denominator } = normalizer(Math.max(...totalVolumeList) ?? 0)

    const option = {
    silent: true,
    tooltip: {
        trigger: 'axis',
        hideDelay: 100, // Set the delay in milliseconds
        backgroundColor: '#202327',
        axisPointer: {
          lineStyle: {
            color: ''
        },
    },
    },
    animation: false,
    grid: {
        left: '2%',
        right: '2%',
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
        }
    },
    yAxis: [
    { 
        type: 'value',
        splitLine: {
            show: false, // Disable x-axis grid lines
        },
        axisLabel: {
            color: '#fff', // Change label color to white
            formatter: function (value, index) {
                // Display every second tick
                if (index % 2 === 0) {
                    value = Math.max(value, 0);
                    return (value / denominator)?.toFixed(1) + unit; // Format value in millions
                } else {
                    return ''; // Hide this tick
                }
            }
        },
    },
    ],
    series: [
        {
            data: totalVolumeList,
            type: 'line',
            itemStyle: {
                color: '#fff', // Change bar color to white
            },
            showSymbol: false
        },
        {

            data: shortVolumeList,
            type: 'line',
            areaStyle: {opacity: 1},
            itemStyle: {
                color: '#3B82F6' // Change bar color to white
            },
            showSymbol: false
        },
    ]
    };


return option;
}

const getDarkPool = async (ticker) => {
    // Get cached data for the specific tickerID
    const cachedData = getCache(ticker, 'getDarkPool');
    if (cachedData) {
      rawData = cachedData;
    } else {

      const postData = {'ticker': ticker};
      // make the POST request to the endpoint
      const response = await fetch(data?.apiURL + '/dark-pool', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": data?.apiKey
        },
        body: JSON.stringify(postData)
      });

      rawData = await response.json();
      // Cache the data for this specific tickerID with a specific name 'getDarkPool'
      setCache(ticker, rawData, 'getDarkPool');
    }
    if(rawData?.length !== 0) {
      $darkPoolComponent = true;
    } else {
      $darkPoolComponent = false;
    }
};


$: {
  if($assetType === 'stock' ? $stockTicker :$etfTicker && typeof window !== 'undefined') {
    isLoaded=false;
    const ticker = $assetType === 'stock' ? $stockTicker :$etfTicker
    const asyncFunctions = [
      getDarkPool(ticker)
      ];
      Promise.all(asyncFunctions)
          .then((results) => {
            optionsData = getPlotOptions()
          })
          .catch((error) => {
            console.error('An error occurred:', error);
          });
    isLoaded = true;
  }
}

</script>
    
    
    
    
<section class="overflow-hidden text-white h-full pb-8">
    <main class="overflow-hidden ">
                    
        <div class="flex flex-row items-center">
            <label for="darkPoolInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold">
                Dark Pool Activity
            </label>
            <InfoModal
              title={"Dark Pool Data"}
              content={"Dark pool data refers to information on trading activities that occur in private, non-public financial exchanges known as dark pools. These venues are used by hedge funds and major institutional traders to buy and sell large blocks of securities without exposing their orders to the public, minimizing market impact and price fluctuations. Currently, nearly 50% of all trades are executed in these dark pools, highlighting their significant role in the trading landscape."}
              id={"darkPoolInfo"}
            />
        </div>

        {#if data?.user?.tier === 'Pro'}
        {#if isLoaded}

        {#if rawData?.length !== 0}

        <div class="w-full flex flex-col items-start">
            <div class="text-white text-[1rem] mt-2 mb-2 w-full">
                Over the past 12 months, {$displayCompanyName} has experienced an average dark pool trading volume of
                <span class="font-semibold">{abbreviateNumber(avgVolume)}</span> shares.
                Out of this total, an average of <span class="font-semibold">{abbreviateNumber(avgShortVolume)}</span> shares,
                constituting approximately <span class="font-semibold">{((avgShortVolume/avgVolume)*100)?.toFixed(2)}%</span>, were short volume.
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
                Total Volume
            </span>
        </div>
            <div class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
                <div class="h-full transform -translate-x-1/2 " aria-hidden="true"></div>
                <div class="w-3 h-3 bg-[#536FC5] border-4 box-content border-[#27272A] rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                <span class="mt-2 sm:mt-0 text-white text-xs sm:text-md sm:font-medium inline-block">
                Short Volume
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
                      <td class="px-[5px] py-1.5 text-sm sm:text-[1rem] text-right font-medium xs:px-2.5 xs:py-2">
                        { formatDateRange(rawData?.slice(-1)?.at(0)?.date)}
                      </td>
                  </tr>
                  <tr class="border-y border-gray-800 odd:bg-[#27272A]">
                      <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                          <span>Total Volume</span>
                      </td>
                      <td class="px-[5px] py-1.5 text-right font-medium xs:px-2.5 xs:py-2">
                        {monthlyVolume}
                      </td>
                  </tr>
                  <tr class="border-y border-gray-800 odd:bg-[#27272A]">
                      <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                          <span>Avg. Short % of Volume</span>
                      </td>
                      <td class="px-[5px] py-1.5 text-right font-medium xs:px-2.5 xs:py-2">
                        {avgMonthlyShort}%
                      </td>
                  </tr>
              </tbody>
          </table>
          </div>
        
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
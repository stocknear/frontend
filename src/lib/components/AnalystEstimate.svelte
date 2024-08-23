<script lang='ts'>
import {analystEstimateComponent, stockTicker, screenWidth, getCache, setCache} from '$lib/store';
import InfoModal from '$lib/components/InfoModal.svelte';

import { Chart } from 'svelte-echarts'
import { init, use } from 'echarts/core'
import { ScatterChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
  import { abbreviateNumber } from '$lib/utils';

export let data;
use([ScatterChart, GridComponent, TooltipComponent, CanvasRenderer])


let analystEstimateList = [];
let isLoaded = false;

let deactivateContent = data?.user?.tier === 'Pro' ? false : true;

let xData = [];
let optionsData;

let displayData = 'Revenue';

function changeStatement(event)
{
    displayData = event.target.value;
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
  


let tableDataActual = [];
let tableDataForecast = []

const getAnalystEstimate = async (ticker) => {
    // Get cached data for the specific tickerID
    const cachedData = getCache(ticker, 'getAnalystEstimate');
    if (cachedData) {
      analystEstimateList = cachedData;
    } else {

      const postData = {'ticker': ticker};

      const response = await fetch(data?.apiURL + '/analyst-estimate', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": data?.apiKey
        },
        body: JSON.stringify(postData)
      });

      analystEstimateList = await response?.json();
      analystEstimateList = analystEstimateList?.filter(item => !item.date.toString().startsWith("19"));

      // Cache the data for this specific tickerID with a specific name 'getAnalystEstimate'
      setCache(ticker, analystEstimateList, 'getAnalystEstimate');
    }
    
    if(analystEstimateList?.length !== 0) {
        $analystEstimateComponent = true;
    } else {
        $analystEstimateComponent = false;
    }
};


function getPlotOptions() {
    let dates = [];
    let valueList = [];
    let estimatedValueList = [];

    let filteredData = analystEstimateList?.filter(item => item.date >= 2015) ?? [];

    // Iterate over the data and extract required information
    if( displayData === 'Revenue') {
        filteredData?.slice(-20)?.forEach(item => {
        dates.push(item?.date);
        valueList.push(item?.revenue); // Handle null values by using 0 or any placeholder value
        estimatedValueList.push(item?.estimatedRevenueAvg);
        });
    } else if ( displayData === 'Net Income') {
        filteredData?.slice(-20)?.forEach(item => {
        dates.push(item?.date);
        valueList.push(item?.netIncome); // Handle null values by using 0 or any placeholder value
        estimatedValueList.push(item?.estimatedNetIncomeAvg);
        });
    } else if ( displayData === 'EBITDA') {
        filteredData?.slice(-20)?.forEach(item => {
        dates.push(item?.date);
        valueList.push(item?.ebitda); // Handle null values by using 0 or any placeholder value
        estimatedValueList.push(item?.estimatedEbitdaAvg);
        });
    } else if ( displayData === 'EPS') {
        filteredData?.slice(-20)?.forEach(item => {
        dates.push(item?.date);
        valueList.push(item?.eps); // Handle null values by using 0 or any placeholder value
        estimatedValueList.push(item?.estimatedEpsAvg);
        });
    }
   

    // Normalize the data if needed (not required in this case, but leaving it here for reference)
    const { unit, denominator } = normalizer(Math.max(...valueList, ...estimatedValueList) ?? 0);

    const option = {
        silent: true,
        tooltip: {
            trigger: 'axis',
            hideDelay: 100, // Set the delay in milliseconds
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
        yAxis: {
            type: 'value',
            splitLine: {
                show: false, // Disable x-axis grid lines
            },
            axisLabel: {
                color: '#fff', // Change label color to white
                formatter: function (value, index) {
                    // Display every second tick
                    if (index % 2 === 0) {
                        return (value / denominator)?.toFixed(0) + unit; // Format value in millions
                    } else {
                        return ''; // Hide this tick
                    }
                }
            },
        },
        series: [
            {
                name: 'Actual',
                data: valueList,
                type: 'scatter',
                itemStyle: {
                    color: '#fff' // Change scatter plot color to white
                },
                showSymbol: true // Show symbols for scatter plot points
            },
            {
                name: 'Forecast',
                data: estimatedValueList,
                type: 'scatter',
                itemStyle: {
                    color: '#E11D48' // Change scatter plot color to green
                },
                showSymbol: true // Show symbols for scatter plot points
            },
        ]
    };

    return option;
}

  

//To-do: Optimize this piece of shit
function prepareData() {

    tableDataActual = [];
    tableDataForecast = [];

    let filteredData = analystEstimateList?.filter(item => item.date >= 2015) ?? [];

    xData = filteredData?.map(({ date }) => Number(String(date)?.slice(-2)));

    if(displayData === 'Revenue') {

        
        filteredData?.forEach(item => {
        
        tableDataActual?.push({ 'FY': Number(String(item?.date)?.slice(-2)), 'val': (item?.revenue)});
        tableDataForecast?.push({ 'FY': Number(String(item?.date)?.slice(-2)), 'val': (item?.estimatedRevenueAvg)});

        })
    }

    else if(displayData === 'Net Income') {


        filteredData?.forEach(item => {
        
        tableDataActual?.push({ 'FY': Number(String(item?.date)?.slice(-2)), 'val': (item?.netIncome )});
        tableDataForecast?.push({ 'FY': Number(String(item?.date)?.slice(-2)), 'val': (item?.estimatedNetIncomeAvg )});
        
         });
    }

    else if(displayData === 'EPS') {
        filteredData?.forEach(item => {

        tableDataActual?.push({ 'FY': Number(String(item?.date)?.slice(-2)), 'val': item?.eps ?? null});
        tableDataForecast?.push({ 'FY': Number(String(item?.date)?.slice(-2)), 'val': item?.estimatedEpsAvg});

        });
    }

    else if(displayData === 'EBITDA') {

        filteredData?.forEach(item => {
        
        tableDataActual?.push({ 'FY': Number(String(item?.date)?.slice(-2)), 'val': (item?.ebitda)});
        tableDataForecast?.push({ 'FY': Number(String(item?.date)?.slice(-2)), 'val': (item?.estimatedEbitdaAvg)});

        });
    }

}

$: {
  if ($stockTicker && displayData && typeof window !== 'undefined')
  {
    isLoaded = false;


    const asyncFunctions = [
        getAnalystEstimate($stockTicker)
      ];
      Promise.all(asyncFunctions)
          .then((results) => {
            //prepareData(analystEstimateList)
            optionsData = getPlotOptions();
            prepareData()
        
          })
          .catch((error) => {
            console.error('An error occurred:', error);
          });
    isLoaded = true;
  
  }

  
}
  


</script>
    
    


<section class="overflow-hidden text-white h-full pb-8 sm:pb-2">
    <main class="overflow-hidden ">
                <div class="w-full m-auto mt-5 sm:mt-0">
                    
                <div class="flex flex-row items-center">
                    <label for="predictiveFundamentalsInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold">
                        Predictive Fundamentals
                    </label>
                    <InfoModal
                        title={"Predictive Fundamentals"}
                        content={`If quarterly earnings for a year are incomplete, we offer a summarized view based on available data. For instance, if the Q4 report is missing, we display revenue as X, reflecting the sum of Q1-Q3 only. Q4 data will be added later when available.`}
                        id={"predictiveFundamentalsInfo"}
                    />
                </div>
    

                <div class="text-white text-[1rem] mt-1 sm:mt-3 mb-1 w-full sm:w-5/6">
                    We analyze insights from various analysts to offer both historical and future fundamental data forecasts.
                </div>

                {#if data?.user?.tier === 'Pro'}
                {#if isLoaded}

                {#if analystEstimateList?.length !== 0}


                    <select class="mt-5 mb-5 sm:mb-0 sm:mt-3 ml-1 w-44 select select-bordered select-sm p-0 pl-5 overflow-y-auto bg-[#2A303C]" on:change={changeStatement}>
                        <option disabled>Choose Fundamental Data</option>
                        <option disabled={deactivateContent} value="EPS">
                            EPS
                        </option>
                        <option disabled={deactivateContent} value="EBITDA">
                            EBITDA
                        </option>
                        <option value="Net Income">
                            Net Income
                        </option>
                        <option value="Revenue" selected>Revenue</option>                      
                    </select>
                

                    <div class="pb-2">
                
          
                        <div class="app w-full h-[300px] mt-5">
                            <Chart {init} options={optionsData} class="chart" />
                        </div>
                      
                    </div>


                <div class="flex flex-row items-center justify-between m-auto mt-10">

                    <div class="flex flex-row items-center w-1/2 sm:w-full justify-center">
                        <div class="h-full bg-gray-800 transform -translate-x-1/2 " aria-hidden="true"></div>
                        <div class="w-3 h-3 bg-[#fff] border-4 box-content border-gray-900 rounded-full transform -translate-x-1/2" aria-hidden="true"></div>
                        <span class="text-white text-sm sm:text-md sm:font-medium inline-block">
                            Actual
                        </span>
                    </div>

                    <div class="flex flex-row items-center w-1/2 sm:w-full justify-center">
                        <div class="h-full bg-gray-800 transform -translate-x-1/2 " aria-hidden="true"></div>
                        <div class="w-3 h-3 bg-[#E11D48] border-4 box-content border-gray-900 rounded-full transform -translate-x-1/2" aria-hidden="true"></div>
                        <span class="text-white text-sm sm:text-md sm:font-medium inline-block">
                            Analyst Forecast
                        </span>
                    </div>
                </div>

                
                
                <div class="no-scrollbar flex justify-start items-center w-screen sm:w-full mt-6 m-auto overflow-x-scroll pr-5 sm:pr-0">
                    <table class="table table-sm shaodow table-pin-cols table-compact rounded-none sm:rounded-md w-full bg-[#09090B] border-bg-[#09090B]">
                        <thead class="">
                        <tr class="">
                            <th class="bg-[#27272A] border-b border-[#000] text-white font-semibold text-sm sm:text-[1rem] text-start">Year</th>
                            {#each xData as item}
                            <td class="z-20 bg-[#27272A] border-b border-[#000] text-white font-semibold text-sm sm:text-[1rem] text-center bg-[#09090B]">{'FY'+item}</td>
                            {/each}

                        </tr>
                        </thead>
                        <tbody class="shadow-md">

                            <tr class="bg-[#09090B] border-b-[#09090B]">
                                <th class="text-white whitespace-nowrap  text-sm sm:text-[1rem] text-start font-medium bg-[#09090B] border-b border-[#09090B]">
                                    Forecast
                                </th>
                                {#each tableDataForecast as item}
                                    <td class="text-white text-sm sm:text-[1rem] text-center font-medium  border-b border-[#09090B]">
                                        {(item?.val === '0.00' || item?.val === null) ? '-' : abbreviateNumber(item?.val)}
                                    </td>
                                {/each}
                           
                            </tr>

                            <tr class="bg-[#27272A] text-sm sm:text-[1rem] border-b-[#27272A]">
                                <th class="bg-[#27272A] whitespace-nowrap text-white text-start font-medium  bg-[#27272A] border-b border-[#27272A]">
                                    Actual
                                </th>
                                {#each tableDataActual as item}
                                    <td class="text-white text-sm sm:text-[1rem] text-center font-medium bg-[#27272A]">
                                        {(item?.val === '0.00' || item?.val === null) ? '-' : abbreviateNumber(item?.val)}
                                    </td>
                                {/each}
                           
                            </tr>

                            <tr class="bg-[#09090B] text-sm sm:text-[1rem] border-b-[#09090B]">
                                <th class="bg-[#09090B] whitespace-nowrap text-white text-start font-medium  bg-[#09090B] border-b border-[#09090B]">
                                    % Change
                                </th>
                                {#each tableDataActual as item, index}
                                    <td class="text-white text-sm sm:text-[1rem] text-center font-medium bg-[#09090B]">
                                        {#if index-tableDataActual?.length === 0}
                                        -
                                        {:else}
                                            {#if item?.val === null}
                                                {#if (tableDataForecast[index]?.val- tableDataForecast[index-1]?.val) > 0}
                                                <span class="text-orange-400">
                                                    &#42;+{(((tableDataForecast[index]?.val-tableDataForecast[index-1]?.val) / tableDataForecast[index-1]?.val) * 100 )?.toFixed(2)}%
                                                </span>
                                                {:else if (tableDataForecast[index]?.val - tableDataForecast[index-1]?.val ) < 0}
                                                <span class="text-orange-400">
                                                    &#42;{(((tableDataForecast[index]?.val - tableDataForecast[index-1]?.val ) / tableDataForecast[index-1]?.val) * 100 )?.toFixed(2)}%
                                                </span>
                                            {/if}
                                            {:else if (item?.val- tableDataActual[index-1]?.val) > 0}
                                            <span class="text-[#10DB06]">
                                            +{(((item?.val-tableDataActual[index-1]?.val) / tableDataActual[index-1]?.val) * 100 )?.toFixed(2)}%
                                            </span>
                                            {:else if (item?.val - tableDataActual[index-1]?.val ) < 0}
                                            <span class="text-[#FF2F1F]">
                                            {(((item?.val - tableDataActual[index-1]?.val ) / tableDataActual[index-1]?.val) * 100 )?.toFixed(2)}%
                                            </span>
                                            {:else}
                                            0.00%
                                            {/if}
                                        {/if}
                                    </td>
                                {/each}
                           
                            </tr>


                        
                        </tbody>
                    </table>

        
                </div>
                
                <div class="text-orange-400 text-xs sm:text-sm mt-2">
                    &#42; This value depends on the forecast
                </div>
                    <div class="mt-5 text-gray-100 text-sm sm:text-[1rem] sm:rounded-lg h-auto border border-slate-800 p-4">
                        <svg class="w-5 h-5 inline-block mr-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#a474f6" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
                        For {(new Date()).getFullYear()}, we use available quarterly data. Complete annual data, used to compare against analyst estimates, is only finalized after the year ends.
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

            </div>

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
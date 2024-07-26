<script lang='ts'>
import {analystEstimateComponent, stockTicker, screenWidth, getCache, setCache} from '$lib/store';
import InfoModal from '$lib/components/InfoModal.svelte';

import { LayerCake, Html } from 'layercake';

import Scatter from '$lib/components/Scatter//Scatter.html.svelte';
import AxisX from '$lib/components/Scatter//AxisX.html.svelte';
import AxisY from '$lib/components/Scatter//AxisY.html.svelte';


export let data;

let analystEstimateList = [];
let isLoaded = false;

let deactivateContent = data?.user?.tier === 'Pro' ? false : true;

let dataset = [];
let xData = [];

let displayData = 'Revenue';
let displayRevenueUnit = 'Billions';
let displayNetIncomeUnit = 'Billions';
let displayEBITDAUnit = 'Billions';


function changeStatement(event)
{
    displayData = event.target.value;
}
    

function determineDisplayUnit(value) {
  if (Math?.abs(value) >= 1e10) {
    return { unit: '100 Billions', denominator: 10e10 };
  } else if (Math?.abs(value) >= 1e9) {
    return { unit: '10 Billions', denominator: 1e10 };
  } else if (Math?.abs(value) >= 1e7) {
    return { unit: 'Billions', denominator: 1e9 };
  } else if (Math?.abs(value) >= 1e5) {
    return { unit: 'Millions', denominator: 1e6 };
  } else {
    return { unit: '', denominator: 1 };
  }
}

const xKey = 'FY';
const yKey = 'val';
const r = 5;
const padding = 2.5;

let tableDataActual = [];
let tableDataForecast = []

const getAnalystEstimate = async (ticker) => {
    // Get cached data for the specific tickerID
    const cachedData = getCache(ticker, 'getAnalystEstimate');
    if (cachedData) {
      analystEstimateList = cachedData;
    } else {

      const postData = {'ticker': ticker};
      // make the POST request to the endpoint
      const response = await fetch(data?.apiURL + '/analyst-estimate', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": data?.apiKey
        },
        body: JSON.stringify(postData)
      });

      analystEstimateList = await response?.json();

      // Cache the data for this specific tickerID with a specific name 'getAnalystEstimate'
      setCache(ticker, analystEstimateList, 'getAnalystEstimate');
    }
    if(analystEstimateList?.length !== 0) {
        $analystEstimateComponent = true;
    } else {
        $analystEstimateComponent = false;
    }
};


//To-do: Optimize this piece of shit
function prepareData(analystEstimateList) {

    dataset = [];
    tableDataActual = [];
    tableDataForecast = [];

    xData = analystEstimateList?.slice(-7)?.map(({ date }) => Number(String(date)?.slice(-2)));

    if(displayData === 'Revenue') {

        const { unit, denominator } = determineDisplayUnit(analystEstimateList?.at(-1)?.estimatedRevenueAvg);
        displayRevenueUnit = unit;
        
        analystEstimateList?.slice(-7)?.forEach(item => {
        
        tableDataActual?.push({ 'FY': Number(String(item?.date)?.slice(-2)), 'val': (item?.revenue/ denominator)?.toFixed(2)});
        tableDataForecast?.push({ 'FY': Number(String(item?.date)?.slice(-2)), 'val': (item?.estimatedRevenueAvg/denominator)?.toFixed(2)});

        if (item?.revenue !== null) {
            dataset?.push({ 'FY': Number(String(item?.date)?.slice(-2)), 'val': (item?.revenue/denominator)?.toFixed(2), 'dataset': 'actual' });
        }
            dataset?.push({ 'FY': Number(String(item?.date)?.slice(-2)), 'val': item?.estimatedRevenueAvg !== null ? (item?.estimatedRevenueAvg / denominator)?.toFixed(2) : null, 'dataset': 'forecast' });
        });

    }

    else if(displayData === 'Net Income') {

        const { unit, denominator } = analystEstimateList?.at(-2)?.estimatedNetIncomeAvg !== 0 ? determineDisplayUnit(analystEstimateList?.at(-2)?.estimatedNetIncomeAvg) : determineDisplayUnit(analystEstimateList?.at(-1)?.netIncome);
        displayNetIncomeUnit = unit;

        analystEstimateList?.slice(-7)?.forEach(item => {
        
        tableDataActual?.push({ 'FY': Number(String(item?.date)?.slice(-2)), 'val': (item?.netIncome / denominator)?.toFixed(2)});
        tableDataForecast?.push({ 'FY': Number(String(item?.date)?.slice(-2)), 'val': (item?.estimatedNetIncomeAvg / denominator)?.toFixed(2)});
        
        if (item?.netIncome !== null) {
            dataset?.push({ 'FY': Number(String(item?.date)?.slice(-2)), 'val': (item?.netIncome / denominator)?.toFixed(2), 'dataset': 'actual' });
        }
            dataset?.push({ 'FY': Number(String(item?.date)?.slice(-2)), 'val': item?.estimatedNetIncomeAvg !== null ? (item?.estimatedNetIncomeAvg / denominator)?.toFixed(2) : null, 'dataset': 'forecast' });
        });
    }

    else if(displayData === 'EPS') {
        analystEstimateList?.slice(-7)?.forEach(item => {

        tableDataActual?.push({ 'FY': Number(String(item?.date)?.slice(-2)), 'val': item?.eps?.toFixed(2) ?? null});
        tableDataForecast?.push({ 'FY': Number(String(item?.date)?.slice(-2)), 'val': item?.estimatedEpsAvg?.toFixed(2)});
        if (item?.eps !== null) {
            dataset?.push({ 'FY': Number(String(item?.date)?.slice(-2)), 'val': item?.eps, 'dataset': 'actual' });
        }
            dataset?.push({ 'FY': Number(String(item?.date)?.slice(-2)), 'val': item?.estimatedEpsAvg !== null ? item?.estimatedEpsAvg : null, 'dataset': 'forecast' });
        });
    }

    else if(displayData === 'EBITDA') {
        const { unit, denominator } = determineDisplayUnit(analystEstimateList?.at(-1)?.estimatedEbitdaAvg);
        displayEBITDAUnit = unit;

        analystEstimateList?.slice(-7)?.forEach(item => {
        
        tableDataActual?.push({ 'FY': Number(String(item?.date)?.slice(-2)), 'val': (item?.ebitda/ denominator)?.toFixed(2)});
        tableDataForecast?.push({ 'FY': Number(String(item?.date)?.slice(-2)), 'val': (item?.estimatedEbitdaAvg/ denominator)?.toFixed(2)});

        if (item?.ebitda !== null) {
            dataset?.push({ 'FY': Number(String(item?.date)?.slice(-2)), 'val': (item?.ebitda / denominator)?.toFixed(2), 'dataset': 'actual' });
        }
            dataset?.push({ 'FY': Number(String(item?.date)?.slice(-2)), 'val': item?.estimatedEbitdaAvg !== null ? (item?.estimatedEbitdaAvg / denominator)?.toFixed(2) : null, 'dataset': 'forecast' });
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
            prepareData(analystEstimateList)
        
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
                <div class="w-fit sm:w-full  m-auto mt-5 sm:mt-0">
                    
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
    

                <div class="text-white text-sm sm:text-[1rem] mt-1 sm:mt-3 mb-1 w-full sm:w-5/6">
                    We analyze insights from various analysts to offer both historical and future fundamental data forecasts.
                </div>

                {#if data?.user?.tier === 'Pro'}
                {#if isLoaded}

                {#if analystEstimateList?.length !== 0}


                    <select class="mt-5 mb-5 sm:mb-0 sm:mt-3 ml-1 w-44 select select-bordered select-sm p-0 pl-5 overflow-y-auto bg-[#2A303C]" on:change={changeStatement}>
                        <option disabled>Choose Fundamental Data</option>
                        <option disabled={deactivateContent} value="EPS">
                            {!deactivateContent ? 'EPS' : 'EPS (Pro Only)'} 
                        </option>
                        <option disabled={deactivateContent} value="EBITDA">
                            {!deactivateContent ? `EBITDA in ${displayEBITDAUnit}` : 'EBITDA (Pro Only)'}
                        </option>
                        <option value="Net Income">
                            Net Income in {displayNetIncomeUnit}
                        </option>
                        <option value="Revenue" selected>Revenue in {displayRevenueUnit}</option>                      
                    </select>
                

                <div class="flex flex-row items-center ml-2 sm:ml-0 justify-start w-[90vw] sm:w-full h-[220px] sm:h-[250px] sm:pl-3 sm:pr-3 pt-4 pb-5 mt-5 sm:mt-10">


                    <div class="chart-container h-[250px]">
                        <LayerCake
                          ssr={true}
                          percentRange={true}
                          padding={{ top: 0, right: 0, bottom: 30, left: 0 }}
                          x={xKey}
                          y={yKey}
                          xPadding={[padding, padding]}
                          yPadding={[padding, padding]}
                          data={dataset}
                          position={'relative'}

                        >
                      
                          <Html>
                            <AxisX ticks={xData}/>
                            <AxisY/>
                            <Scatter
                              {r}
                            />
                          </Html>
                      
                        </LayerCake>
                    </div>
                    

                </div>


                <div class="flex flex-row items-center justify-between m-auto mt-10">
                    <div class="flex flex-row items-center w-1/2 sm:w-full justify-center">
                        <div class="h-full bg-gray-800 transform -translate-x-1/2 " aria-hidden="true"></div>
                        <div class="w-3 h-3 bg-[#00BBFF] border-4 box-content border-gray-900 rounded-full transform -translate-x-1/2" aria-hidden="true"></div>
                        <span class="text-white text-sm sm:text-md sm:font-medium inline-block">
                            Analyst Forecast
                        </span>
                    </div>

                    <div class="flex flex-row items-center w-1/2 sm:w-full justify-center">
                        <div class="h-full bg-gray-800 transform -translate-x-1/2 " aria-hidden="true"></div>
                        <div class="w-3 h-3 bg-[#0FC008] border-4 box-content border-gray-900 rounded-full transform -translate-x-1/2" aria-hidden="true"></div>
                        <span class="text-white text-sm sm:text-md sm:font-medium inline-block">
                            Actual
                        </span>
                    </div>
                </div>

                
                
                <div class="no-scrollbar flex justify-start items-center w-screen sm:w-full mt-6 m-auto rounded-none sm:rounded-lg overflow-hidden overflow-x-scroll">
                    <table class="table table-sm shaodow table-pin-cols table-compact rounded-none sm:rounded-md w-full bg-[#09090B] border-bg-[#09090B]">
                        <thead class="">
                        <tr class="">
                            <th class="bg-[#09090B] border-b border-[#000] text-white font-semibold text-sm text-start">Year</th>
                            {#each ($screenWidth >= 640 ? xData?.slice(-6) : xData) as item}
                            <td class="z-20 bg-[#09090B] border-b border-[#000] text-white font-semibold text-sm text-center bg-[#09090B]">{'FY'+item}</td>
                            {/each}

                        </tr>
                        </thead>
                        <tbody class="shadow-md">

                            <tr class="bg-[#09090B] border-b-[#09090B]">
                                <th class="text-white text-start font-medium bg-[#09090B] border-b border-[#09090B]">
                                    Forecast
                                </th>
                                {#each ($screenWidth >= 640 ? tableDataForecast?.slice(-6) : tableDataForecast) as item}
                                    <td class="text-white text-center font-medium  border-b border-[#09090B]">
                                        {(item?.val === '0.00' || item?.val === null) ? '-' : item?.val}
                                    </td>
                                {/each}
                           
                            </tr>

                            <tr class="bg-[#09090B] border-b-[#09090B]">
                                <th class="bg-[#09090B] text-white text-start font-medium  bg-[#09090B] border-b border-[#09090B]">
                                    Actual
                                </th>
                                {#each ($screenWidth >= 640 ? tableDataActual?.slice(-6) : tableDataActual) as item}
                                    <td class="text-white text-center font-medium bg-[#09090B]">
                                        {(item?.val === '0.00' || item?.val === null) ? '-' : item?.val}
                                    </td>
                                {/each}
                           
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
            <div class="shadow-lg shadow-bg-[#000] bg-[#09090B] sm:bg-opacity-[0.5] text-sm sm:text-[1rem] rounded-md w-full p-4 min-h-24 mt-4 text-white m-auto flex justify-center items-center text-center font-semibold">
                <svg class="mr-1.5 w-5 h-5 inline-block"xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#A3A3A3" d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"/></svg>
                Unlock content with <a class="inline-block ml-2 text-blue-400 hover:sm:text-white" href="/pricing">Pro Subscription</a>
              </div>
            {/if}

            </div>

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
height: 100%;
max-height: 250px;
}


</style>
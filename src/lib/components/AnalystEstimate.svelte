<script lang='ts'>
import {screenWidth} from '$lib/store';
import InfoModal from '$lib/components/InfoModal.svelte';

import { LayerCake, Html } from 'layercake';

import Scatter from '$lib/components/Scatter//Scatter.html.svelte';
import AxisX from '$lib/components/Scatter//AxisX.html.svelte';
import AxisY from '$lib/components/Scatter//AxisY.html.svelte';


export let analystEstimateList;
export let data;

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

//To-do: Optimize this piece of shit
$: {
  if (displayData && analystEstimateList?.length !== 0)
  {
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

  
}
  


</script>
    
    


<section class="bg-[#0F0F0F] overflow-hidden text-white h-full sm:mb-0">
    <div class="flex justify-center w-fit m-auto h-full overflow-hidden">
        <div class="relative flex justify-center items-center overflow-hidden">
            <main>
                <div class="w-fit sm:w-full sm:max-w-2xl m-auto mt-5 sm:mt-0">
                    
   
                {#if analystEstimateList?.length !== 0}

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
                

                <div class="flex flex-row items-center ml-2 sm:ml-0 justify-start w-[90vw] sm:w-[560px] h-[220px] sm:h-[250px] sm:pl-3 sm:pr-3 pt-4 pb-5 mt-5 sm:mt-10">


                    <div class="chart-container h-[250px] ">
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

                
                
                <div class="no-scrollbar flex justify-start items-center w-screen sm:w-full mt-6 m-auto rounded-none sm:rounded-lg overflow-hidden overflow-x-scroll pr-10">
                    <table class="table table-sm shaodow table-pin-cols table-compact rounded-none sm:rounded-md w-full bg-[#0F0F0F] border-bg-[#0F0F0F]">
                        <thead class="">
                        <tr class="">
                            <th class="bg-[#0F0F0F] border-b border-[#000] shadow-md text-white font-medium text-sm text-start">Year</th>
                            {#each ($screenWidth >= 640 ? xData?.slice(-6) : xData) as item}
                            <td class="z-20 bg-[#0F0F0F] border-b border-[#000] shadow-md text-white font-medium text-sm text-center bg-[#0F0F0F]">{'FY'+item}</td>
                            {/each}

                        </tr>
                        </thead>
                        <tbody class="shadow-md">

                            <tr class="bg-[#0F0F0F] border-b-[#0F0F0F]">
                                <th class="text-white text-start font-medium bg-[#0F0F0F] border-b border-[#0F0F0F]">
                                    Forecast
                                </th>
                                {#each ($screenWidth >= 640 ? tableDataForecast?.slice(-6) : tableDataForecast) as item}
                                    <td class="text-white text-center font-medium  border-b border-[#0F0F0F]">
                                        {(item?.val === '0.00' || item?.val === null) ? '-' : item?.val}
                                    </td>
                                {/each}
                           
                            </tr>

                            <tr class="bg-[#0F0F0F] border-b-[#0F0F0F]">
                                <th class="text-white text-start font-medium  bg-[#0F0F0F] border-b border-[#0F0F0F]">
                                    Actual
                                </th>
                                {#each ($screenWidth >= 640 ? tableDataActual?.slice(-6) : tableDataActual) as item}
                                    <td class="text-white text-center font-medium  border-b border-[#0F0F0F]">
                                        {(item?.val === '0.00' || item?.val === null) ? '-' : item?.val}
                                    </td>
                                {/each}
                           
                            </tr>


                        
                        </tbody>
                    </table>

            
                    </div>
            
                

        
                {:else} 
                <h2 class=" mt-10 justify-center items-center text-3xl font-bold text-slate-700 mb-5 m-auto">
                    No data available
                    <svg class="w-10 sm:w-12 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#334155" d="M18.68 12.32a4.49 4.49 0 0 0-6.36.01a4.49 4.49 0 0 0 0 6.36a4.508 4.508 0 0 0 5.57.63L21 22.39L22.39 21l-3.09-3.11c1.13-1.77.87-4.09-.62-5.57m-1.41 4.95c-.98.98-2.56.97-3.54 0c-.97-.98-.97-2.56.01-3.54c.97-.97 2.55-.97 3.53 0c.97.98.97 2.56 0 3.54M10.9 20.1a6.527 6.527 0 0 1-1.48-2.32C6.27 17.25 4 15.76 4 14v3c0 2.21 3.58 4 8 4c-.4-.26-.77-.56-1.1-.9M4 9v3c0 1.68 2.07 3.12 5 3.7v-.2c0-.93.2-1.85.58-2.69C6.34 12.3 4 10.79 4 9m8-6C7.58 3 4 4.79 4 7c0 2 3 3.68 6.85 4h.05c1.2-1.26 2.86-2 4.6-2c.91 0 1.81.19 2.64.56A3.215 3.215 0 0 0 20 7c0-2.21-3.58-4-8-4Z"/></svg>
                </h2>
                {/if}
                
            </div>
        </main>
        </div>
        </div>
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
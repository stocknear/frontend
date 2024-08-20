<script lang="ts">
import {numberOfUnreadNotification,displayCompanyName, stockTicker} from '$lib/store';
import { abbreviateNumber } from '$lib/utils';
//import * as XLSX from 'xlsx';
import { Chart } from 'svelte-echarts'

import { init, use } from 'echarts/core'
  import { LineChart, BarChart } from 'echarts/charts'
  import { GridComponent, TooltipComponent } from 'echarts/components'
  import { CanvasRenderer } from 'echarts/renderers'
  import { onMount } from 'svelte';
  use([LineChart, BarChart, GridComponent,TooltipComponent, CanvasRenderer])


    export let data;
    
    let isLoaded = false;
    let optionsData;

    let rawData = data?.getHistoricalMarketCap || [];
    let tableList = [];
    let filterRule = 'annual';
    let changePercentageYearAgo = 0;
    let timePeriod = 'threeYears';

function computeYearOverYearChange(data) {
    if (data.length < 2) {
        return null; // Not enough data to compute change
    }

    // Step 1: Get the last entry in the list
    const lastEntry = data[data.length - 1];
    const lastDate = new Date(lastEntry.date);
    const lastMarketCap = lastEntry.marketCap;

    // Step 2: Find the entry closest to one year before the last date
    let closestEntry = null;
    for (let i = data.length - 2; i >= 0; i--) {
        const entryDate = new Date(data[i].date);
        const oneYearAgo = new Date(lastDate);
        oneYearAgo.setFullYear(lastDate.getFullYear() - 1);

        // Check if the entry is close to one year ago
        if (entryDate <= oneYearAgo) {
            closestEntry = data[i];
            break;
        }
    }

    if (!closestEntry) {
        return null; // No suitable entry found for comparison
    }

    const previousMarketCap = closestEntry.marketCap;

    // Step 3: Calculate the percentage change
    const change = ((lastMarketCap - previousMarketCap) / previousMarketCap) * 100;

    return change;
}

function filterEndOfYearDates(data) {
    // Step 1: Group data by year
    const groupedByYear = data.reduce((acc, item) => {
        const year = new Date(item.date).getFullYear();
        if (!acc[year]) {
            acc[year] = [];
        }
        acc[year].push(item);
        return acc;
    }, {});

    // Step 2: For each year, find the entry with the latest date
    const annualData = Object.values(groupedByYear).map(yearData => {
        return yearData.reduce((latest, current) => {
            return new Date(latest.date) > new Date(current.date) ? latest : current;
        });
    });

    return annualData;
}
      
function filterEndOfQuarterDates(data) {
    // Step 1: Group data by year and quarter
    const groupedByQuarter = data?.reduce((acc, item) => {
        const date = new Date(item?.date);
        const year = date.getFullYear();
        const quarter = Math?.floor(date?.getMonth() / 3) + 1; // Get the quarter (1-4)

        const key = `${year}-Q${quarter}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(item);
        return acc;
    }, {});

    // Step 2: For each year-quarter group, find the entry with the latest date
    const quarterlyData = Object?.values(groupedByQuarter)?.map(quarterData => {
        return quarterData?.reduce((latest, current) => {
            return new Date(latest?.date) > new Date(current?.date) ? latest : current;
        });
    });
    
    return quarterlyData;
}

function changeTablePeriod(state:string) {
    filterRule = state;
    if(state === 'annual') {
        tableList = filterEndOfYearDates(rawData);
    } else {
        tableList = filterEndOfQuarterDates(rawData);
    }
    tableList?.sort((a, b) => new Date(b?.date) - new Date(a?.date));
}

    onMount(async () => {
        optionsData= await plotData()
        tableList = filterEndOfYearDates(rawData);
        tableList?.sort((a, b) => new Date(b?.date) - new Date(a?.date));
        changePercentageYearAgo = computeYearOverYearChange(rawData);
        isLoaded = true;
    })


async function changeStatement(event)
{
    timePeriod = event.target.value;

    optionsData = await plotData();
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

function filterDataByTimePeriod(rawData, timePeriod) {
    let dates = [];
    let marketCapList = [];
    const now = new Date();

    // Calculate the date threshold based on the selected time period
    let thresholdDate;
    switch (timePeriod) {
        case 'oneMonth':
            thresholdDate = new Date(now);
            thresholdDate.setMonth(now.getMonth() - 1);
            break;
        case 'sixMonths':
            thresholdDate = new Date(now);
            thresholdDate.setMonth(now.getMonth() - 6);
            break;
        case 'oneYear':
            thresholdDate = new Date(now);
            thresholdDate.setFullYear(now.getFullYear() - 1);
            break;
        case 'threeYears':
            thresholdDate = new Date(now);
            thresholdDate.setFullYear(now.getFullYear() - 3);
            break;
        case 'fiveYears':
            thresholdDate = new Date(now);
            thresholdDate.setFullYear(now.getFullYear() - 5);
            break;
        case 'tenYears':
            thresholdDate = new Date(now);
            thresholdDate.setFullYear(now.getFullYear() - 10);
            break;
        case 'max':
        default:
            thresholdDate = new Date(0); // Set to the earliest possible date
            break;
    }

    // Filter the data based on the threshold date
    rawData?.forEach(item => {
        const itemDate = new Date(item?.date);
        if (itemDate >= thresholdDate) {
            dates?.push(item?.date);
            marketCapList?.push(item?.marketCap);
        }
    });

    return { dates, marketCapList };
}

async function plotData()
    {
    
    const filteredData = filterDataByTimePeriod(rawData, timePeriod);
    
    const {unit, denominator } = normalizer(Math.max(...filteredData?.marketCapList) ?? 0)

    const options = {
        animation: false,
        grid: {
        left: '0%',
        right: '2%',
        bottom: '2%',
        top: '10%',
        containLabel: true
        },
        xAxis: {
        axisLabel: {
            color: '#fff',
        },
        data: filteredData?.dates,
        type: 'category',
        },
        yAxis: [
        {
            type: 'value',
            splitLine: {
            show: false, // Disable x-axis grid lines
            },
            axisLabel: {
            color: '#fff', // Change label color to white
            formatter: function (value) {
                return '$'+(value / denominator)?.toFixed(1) + unit; // Format value in millions
                },
            },
        },
        {
            type: 'value',
            splitLine: {
            show: false, // Disable x-axis grid lines
            },
        },
        ],
        series: [
        {
            name: 'Mkt Cap',
            data: filteredData?.marketCapList,
            type: 'line',
            areaStyle: {opacity: 0.2},
            smooth: true,
        },
        ],
        tooltip: {
            trigger: 'axis',
            hideDelay: 100,
        },
    };
    
    return options;
    }
    




    
</script>
                    
    
<svelte:head>

<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
<title>
    {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} {$displayCompanyName} ({$stockTicker}) Market Cap & Net Worth · stocknear
</title>
<meta name="description" content={`Historical Market Cap of the company.`} />
<meta property="og:title" content={`${$displayCompanyName} (${$stockTicker}) Market Cap & Net Worth · stocknear`}/>
<meta property="og:description" content={`Historical Market Cap of the company.`} />
<meta property="og:type" content="website"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content={`${$displayCompanyName} (${$stockTicker}) Market Cap & Net Worth · stocknear`}/>
<meta name="twitter:description" content={`Historical Market Cap of the company.`} />
</svelte:head>

    
    <section class="bg-[#09090B] w-full  overflow-hidden text-white h-full pb-40 sm:mb-0">
        <div class="w-full flex justify-center w-full sm-auto h-full overflow-hidden">
            <div class="w-full relative flex justify-center items-center overflow-hidden">

                {#if isLoaded}
                <main class="w-full">
                    <div class="sm:p-7 m-auto mt-2 sm:mt-0">
                        <div class="mb-3">
                            <h1 class="text-2xl text-gray-200 font-bold">
                               Market Cap
                            </h1>
                        </div>
    
    
                        <div class="grid grid-cols-1 gap-2">
                            <div class="text-white p-3 sm:p-5 mb-10 rounded-lg sm:flex sm:flex-row sm:items-center border border-slate-800 text-sm sm:text-[1rem]">
                                <svg class="w-6 h-6 flex-shrink-0 inline-block sm:mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#a474f6" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
                                {$displayCompanyName} has a market cap or net worth of {abbreviateNumber(rawData?.at(-1)?.marketCap,true)} as of {new Date(rawData?.at(-1)?.date ?? null)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}. Its market cap has {changePercentageYearAgo > 0 ? 'increased' : changePercentageYearAgo < 0 ? 'decreased' : 'unchanged'} by {abbreviateNumber(changePercentageYearAgo?.toFixed(2))}% in one year.
                            </div>
    
                            
                            <div class="w-full">
                                <div class="relative flex justify-end">
                                <select class="w-24 select select-bordered select-sm p-0 pl-5 bg-[#2A303C]" on:change={changeStatement}>
                                    <option disabled>Choose a Time Period</option>
                                    <option value="oneMonth">1M</option>
                                    <option value="sixMonths">6M</option>
                                    <option value="oneYear">1Y</option>
                                    <option value="threeYears" selected>3Y</option>
                                    <option value="fiveYears">5Y</option>
                                    <option value="tenYears">10Y</option>
                                    <option value="max">Max</option>                                 
                                </select>
                                </div>
                            </div>
                
                            <div class="app w-full ">
                                <Chart {init} options={optionsData} class="chart" />
                            </div>


                            <h2 class="mt-5 text-2xl text-gray-200 font-semibold">
                                Market Cap History
                            </h2>


                            <ul class="text-[0.8rem] font-medium text-center w-56 pt-3 sm:w-56 mb-5 flex justify-center sm:justify-end items-center ml-auto">
                                <li class="w-full">
                                    <label on:click={() => changeTablePeriod('annual')} class="cursor-pointer rounded-l-lg inline-block w-full py-2.5 text-white {filterRule === 'annual' ? 'bg-purple-600' : 'bg-[#2A303C]'} font-semibold border-r border-gray-600" aria-current="page">
                                      Annual
                                    </label>
                                </li>
                                <li class="w-full">
                                  {#if data?.user?.tier === 'Pro'}
                                    <label on:click={() => changeTablePeriod('quarterly')} class="cursor-pointer inline-block w-full py-2.5 {filterRule === 'quarterly' ? 'bg-purple-600' : 'bg-[#2A303C]'} font-semibold text-white rounded-r-lg">
                                      Quartely
                                    </label>
                                  {:else}
                                  <a href="/pricing" class="flex flex-row items-center m-auto justify-center cursor-pointer inline-block w-full py-2.5 bg-[#2A303C] font-semibold text-white rounded-r-lg">
                                    <span class="">Quarterly</span>
                                    <svg class="ml-1 -mt-0.5 w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#A3A3A3" d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"/></svg>
                                  </a>
                                  {/if}
    
                                </li>
                            </ul>

                            <div class="w-full overflow-x-scroll">         
                                <table class="table table-sm table-compact rounded-none sm:rounded-md w-full border-bg-[#09090B] m-auto mt-4 ">
                                  <thead>
                                    <tr class="border border-slate-800">
                                      <th class="text-white font-semibold text-start text-sm sm:text-[1rem]">Date</th>
                                      <th class="text-white font-semibold text-end text-sm sm:text-[1rem]">Market Cap</th>
                                      <th class="text-white font-semibold text-end text-sm sm:text-[1rem]">% Change</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {#each tableList as item, index}
                                        <!-- row -->
                                        <tr class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#27272A] border-b-[#09090B] shake-ticker cursor-pointer">
                                        
                                            <td class="text-white font-medium text-sm sm:text-[1rem] whitespace-nowrap border-b-[#09090B]">
                                            {item?.date}
                                            </td>

                                            <td class="text-white text-sm sm:text-[1rem] text-right whitespace-nowrap border-b-[#09090B]">
                                            {abbreviateNumber(item?.marketCap)}
                                            </td>

                                            <td class="text-white text-sm sm:text-[1rem] whitespace-nowrap font-medium text-end border-b-[#09090B]">
                                                {#if index+1-tableList?.length === 0}
                                                -
                                                {:else}
                                                {#if (item?.marketCap- tableList[index+1]?.marketCap) > 0}
                                                <span class="text-[#10DB06]">
                                                  +{(((item?.marketCap-tableList[index+1]?.marketCap) / item?.marketCap) * 100 )?.toFixed(2)}%
                                                </span>
                                                {:else if (item?.marketCap - tableList[index+1]?.marketCap ) < 0}
                                                <span class="text-[#FF2F1F]">
                                                  -{(Math?.abs((tableList[index+1]?.marketCap - item?.marketCap) / item?.marketCap) * 100 )?.toFixed(2)}%
                                                </span>
                                                {:else}
                                                -
                                                {/if}
                                                {/if}
                                            </td>

                                        </tr>
                                        {/each}

                                  </tbody>
                                </table>
                    
                                    
                            </div>

    
                    
    
                        </div>
    
                    </div>
                </main>
                {:else}
                <div class="w-full flex justify-center items-center h-80">
                    <div class="relative">
                    <label class="bg-[#09090B] rounded-xl h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <span class="loading loading-spinner loading-md"></span>
                    </label>
                    </div>
                </div>
                {/if}
            </div>
        </div>
    </section>
            
                

    





    
    <style>
        .app {
            height: 400px;
            width: 100%;
        }
        
        @media (max-width: 560px) {
            .app {
                width: 100%;
                height: 300px;
            }
        }
    
        .chart {
            width: 100%;
        }
    </style>
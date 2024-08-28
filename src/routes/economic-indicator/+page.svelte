<script lang='ts'>
import { goto } from '$app/navigation';
import { numberOfUnreadNotification, screenWidth } from '$lib/store';
import ArrowLogo from "lucide-svelte/icons/move-up-right";
import { Chart } from 'svelte-echarts'
import Lazy from '$lib/components/Lazy.svelte';

import { init, use } from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { onMount } from 'svelte';
use([LineChart, BarChart, GridComponent,TooltipComponent, CanvasRenderer])



export let data;
let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;

let isLoaded = false;
let rawData;
let tableList = [];
let optionsData;
let optionsCPI;
let optionsGDP;
let optionsInflation;

let filterRule = 'annual';

let timePeriod = 'threeYears';
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];


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

async function changeStatement(event)
{
    timePeriod = event.target.value;

    optionsData = await plotData();
}

// Function to filter data by a specified time period
function filterDataByTimePeriod(rawData, timePeriod) {
    let dates = [];
    let seriesData = {};

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
            dates.push(item?.date);

            // Iterate over each key in the item, except for 'date'
            Object.keys(item).forEach(key => {
                if (key !== 'date') {
                    // Initialize the array if it doesn't exist
                    if (!seriesData[key]) {
                        seriesData[key] = [];
                    }
                    // Push the corresponding value into the appropriate array
                    seriesData[key].push(item[key]);
                }
            });
        }
    });

    return { dates, seriesData };
}

// Function to plot data based on a specified time period
async function plotData() {
    // Get the filtered data based on the selected time period
    const { dates, seriesData } = filterDataByTimePeriod(rawData, timePeriod);

    // Convert seriesData to the format required by the series property
    let series = Object?.keys(seriesData).map(key => {
        return {
            name: key,
            data: seriesData[key],
            type: 'line',
            smooth: true,
            showSymbol: false,
        };
    });

    const options = {
        animation: false,
        grid: {
            left: '2%',
            right: '2%',
            bottom: '2%',
            top: '10%',
            containLabel: true
        },
        xAxis: {
            axisLabel: {
                color: '#fff',
                formatter: function (value) {
                // Assuming dates are in the format 'yyyy-mm-dd'
                // Extract the month and day from the date string and convert the month to its abbreviated name
                const dateParts = value.split('-');
                const year = dateParts[0].substring(2); // Extracting the last two digits of the year
                const monthIndex = parseInt(dateParts[1]) - 1; // Months are zero-indexed in JavaScript Date objects
                return `${monthNames[monthIndex]} '${year}`;
              }
            },
            data: dates,
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
                },
            },
            {
                type: 'value',
                splitLine: {
                    show: false, // Disable x-axis grid lines
                },
            },
        ],
        series: series, // Use the dynamically created series array
        tooltip: {
            trigger: 'axis',
            hideDelay: 100,
        },
    };

    return options;
}

async function plotCPI() {
    // Get the filtered data based on the selected time period
    let dates = [];
    let valueList = [];
    // Iterate over the data and extract required information
    data?.getEconomicIndicator?.cpi?.forEach(item => {
  
    dates?.push(item?.date);
    valueList?.push(item?.value);
    });

    const options = {
        animation: false,
        grid: {
            left: '2%',
            right: '2%',
            bottom: '2%',
            top: '10%',
            containLabel: true
        },
        xAxis: {
            axisLabel: {
                color: '#fff',
                formatter: function (value) {
                // Assuming dates are in the format 'yyyy-mm-dd'
                // Extract the month and day from the date string and convert the month to its abbreviated name
                const dateParts = value.split('-');
                const year = dateParts[0].substring(2); // Extracting the last two digits of the year
                const monthIndex = parseInt(dateParts[1]) - 1; // Months are zero-indexed in JavaScript Date objects
                return `${monthNames[monthIndex]} '${year}`;
              }
            },
            data: dates,
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
                },
            },
            {
                type: 'value',
                splitLine: {
                    show: false, // Disable x-axis grid lines
                },
            },
        ],
        series: {
            name: 'CPI',
            data: valueList,
            type: 'line',
            areaStyle: {opacity: 0.2},
            smooth: true,
            showSymbol: false,
        },
        tooltip: {
            trigger: 'axis',
            hideDelay: 100,
        },
    };

    return options;
}

async function plotGDP() {
    // Get the filtered data based on the selected time period
    let dates = [];
    let gdpList = [];
    let realGDPList = [];
    let realGDPPerCapitaList = []
    // Iterate over the data and extract required information
    data?.getEconomicIndicator?.gdp?.forEach(item => {
  
    dates?.push(item?.date);
    gdpList?.push(item?.value);
    });

    data?.getEconomicIndicator?.realGDP?.forEach(item => {
      realGDPList?.push(item?.value);
    });

    data?.getEconomicIndicator?.realGDPPerCapita?.forEach(item => {
      realGDPPerCapitaList?.push(item?.value);
    });

    const options = {
        animation: false,
        grid: {
            left: '2%',
            right: '2%',
            bottom: '2%',
            top: '10%',
            containLabel: true
        },
        xAxis: {
            axisLabel: {
                color: '#fff',
                formatter: function (value) {
                // Assuming dates are in the format 'yyyy-mm-dd'
                // Extract the month and day from the date string and convert the month to its abbreviated name
                const dateParts = value.split('-');
                const year = dateParts[0].substring(2); // Extracting the last two digits of the year
                const monthIndex = parseInt(dateParts[1]) - 1; // Months are zero-indexed in JavaScript Date objects
                return `${monthNames[monthIndex]} '${year}`;
              }
            },
            data: dates,
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
                },
            },
            {
                type: 'value',
                splitLine: {
                    show: false, // Disable x-axis grid lines
                },
                axisLabel: {
                    color: '#fff', // Change label color to white
                },
            },
        ],
        series:
          [
            {
            name: 'GDP',
            data: gdpList,
            type: 'line',
            smooth: true,
            showSymbol: false,
          },
          {
          name: 'Real GDP',
            data: realGDPList,
            type: 'line',
            smooth: true,
            showSymbol: false,
          },
          {
          name: 'Real GDP Per Capita',
            data: realGDPPerCapitaList,
            type: 'line',
            yAxisIndex: 1,
            smooth: true,
            showSymbol: false,
          },
        ],
        tooltip: {
            trigger: 'axis',
            hideDelay: 100,
        },
    };

    return options;
}

async function plotInflation() {
    // Get the filtered data based on the selected time period
    let dates = [];
    let inflationRateList = [];
    let recessionList = [];
    // Iterate over the data and extract required information
    data?.getEconomicIndicator?.inflationRate?.forEach(item => {
  
    dates?.push(item?.date);
    inflationRateList?.push(item?.value);
    });

    data?.getEconomicIndicator?.unemploymentRate?.forEach(item => {
      recessionList?.push(item?.value);
    });


    const options = {
        animation: false,
        grid: {
            left: '2%',
            right: '2%',
            bottom: '2%',
            top: '10%',
            containLabel: true
        },
        xAxis: {
            axisLabel: {
                color: '#fff',
                formatter: function (value) {
                // Assuming dates are in the format 'yyyy-mm-dd'
                // Extract the month and day from the date string and convert the month to its abbreviated name
                const dateParts = value.split('-');
                const year = dateParts[0].substring(2); // Extracting the last two digits of the year
                const monthIndex = parseInt(dateParts[1]) - 1; // Months are zero-indexed in JavaScript Date objects
                return `${monthNames[monthIndex]} '${year}`;
              }
            },
            data: dates,
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
                },
            },
            {
                type: 'value',
                splitLine: {
                    show: false, // Disable x-axis grid lines
                },
                axisLabel: {
                    color: '#fff', // Change label color to white
                },
            },
        ],
        series:
          [
            {
            name: 'Inflation Rate',
            data: inflationRateList,
            type: 'line',
            smooth: true,
            showSymbol: false,
          },
          {
          name: 'Unemployment Rate',
            data: recessionList,
            yAxisIndex: 1,

            type: 'line',
            smooth: true,
            showSymbol: false,
          },
          
        ],
        tooltip: {
            trigger: 'axis',
            hideDelay: 100,
        },
    };

    return options;
}
onMount(async () => {
  rawData = data?.getEconomicIndicator?.treasury ?? {};

  // Run the async functions concurrently
  [optionsData, optionsCPI, optionsGDP, optionsInflation] = await Promise.all([
    plotData(),
    plotCPI(),
    plotGDP(),
    plotInflation(),
  ]);

  tableList = filterEndOfYearDates(rawData);
  tableList?.sort((a, b) => new Date(b?.date) - new Date(a?.date));

  isLoaded = true;
});



        
  </script>
  
  <svelte:head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>
      {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} US Economic Indicator · stocknear
  </title>
  <meta name="description" content={`Economic indicators measure economic performance and identify growth trends.`} />
  
  <!-- Other meta tags -->
  <meta property="og:title" content={`US Economic Indicator · stocknear`}/>
  <meta property="og:description" content={`Economic indicators measure economic performance and identify growth trends.`} />
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->
  
  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content={`US Economic Indicator · stocknear`}/>
  <meta name="twitter:description" content={`Economic indicators measure economic performance and identify growth trends.`} />
  <!-- Add more Twitter meta tags as needed -->
  
  </svelte:head>
  
      
  
  <section class="w-full max-w-3xl sm:max-w-screen-2xl overflow-hidden min-h-screen pt-5 pb-40 lg:px-3">
          
    <div class="text-sm sm:text-[1rem] breadcrumbs ml-4">
      <ul>
        <li><a href="/" class="text-gray-300">Home</a></li>
        <li class="text-gray-300">US Economic Indicator</li>
      </ul>
    </div>
            
    <div class="w-full overflow-hidden m-auto mt-5">
      
      <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden ">
          <div class="relative flex justify-center items-start overflow-hidden w-full">


              <main class="w-full lg:w-3/4 lg:pr-5">
               
                <div class="w-full m-auto sm:bg-[#27272A] sm:rounded-xl h-auto pl-10 pr-10 pt-5 sm:pb-10 sm:pt-10 mt-3 mb-8">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
                
                    <!-- Start Column -->
                    <div>
                      <div class="flex flex-row justify-center items-center">
                        <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
                            Economic Indicators
                        </h1>
                      </div>
            
                      <span class="text-white text-md font-medium text-center flex justify-center items-center ">
                        The indicators measure economic performance and identify growth trends.
                      </span>
            
        
                    </div>
                    <!-- End Column -->
                
                    <!-- Start Column -->
                    <div class="hidden sm:block relative m-auto mb-5 mt-5 sm:mb-0 sm:mt-0">
                      <svg class="w-40 -my-5" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <filter id="glow">
                            <feGaussianBlur stdDeviation="5" result="glow"/>
                            <feMerge>
                              <feMergeNode in="glow"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>
                        <path fill="#1E40AF" d="M57.6,-58.7C72.7,-42.6,81.5,-21.3,82,0.5C82.5,22.3,74.7,44.6,59.7,60.1C44.6,75.6,22.3,84.3,0,84.3C-22.3,84.2,-44.6,75.5,-61.1,60.1C-77.6,44.6,-88.3,22.3,-87.6,0.7C-86.9,-20.8,-74.7,-41.6,-58.2,-57.7C-41.6,-73.8,-20.8,-85.2,0.2,-85.4C21.3,-85.6,42.6,-74.7,57.6,-58.7Z" transform="translate(100 100)" filter="url(#glow)" />
                      </svg>
                      
                      
                      <div class="z-1 absolute top-1">
                          <img class="w-[80px] ml-10" src={cloudFrontUrl+'/assets/economic_data_logo.png'} alt="logo" loading="lazy">
                        </div>
                    </div>
                    <!-- End Column -->
                  </div>
            
                 
            
            
                </div>

                {#if isLoaded}
                <div class="w-screen sm:w-full m-auto mt-20 sm:mt-10 p-3">
                  
                  <h2 class="text-2xl text-gray-200 font-bold">
                    Consumer Price Index (CPI)
                  </h2>

                  <div class="text-[1rem] text-white mt-2 mb-2">
                    The CPI measures the average change in prices for a typical basket of goods. It's key for tracking inflation, affecting interest rates, wages, and business decisions. Rising CPI indicates inflation, impacting purchasing power and the overall economy.
                  </div>

                  <Lazy>
                  <div class="app w-full">
                    <Chart {init} options={optionsCPI} class="chart" />
                  </div>
                  </Lazy>

                  <h2 class="text-2xl text-gray-200 font-bold mt-20 sm:mt-10">
                    Gross Domestic Product (GDP)
                  </h2>

                  <div class="text-[1rem] text-white mt-2 mb-2">
                    The GDP measures a country's economic performance, representing the total value of all goods and services produced within a specific period. It's a key indicator of economic health, used to compare the economic output of different nations and track growth or decline over time.
                  </div>

                  <Lazy>
                  <div class="app w-full ">
                    <Chart {init} options={optionsGDP} class="chart" />
                  </div>
                  </Lazy>

                  <h2 class="text-2xl text-gray-200 font-bold mt-20 sm:mt-10">
                    Unemployment Rate vs Inflation Rate
                  </h2>

                  <div class="text-[1rem] text-white mt-2 mb-2">
                    The unemployment rate measures the jobless percentage in the labor force, impacting spending and growth. Low unemployment boosts wages and activity, while high unemployment slows them. The inflation rate tracks price increases, with moderate inflation (~2%) being healthy. These rates are often inversely related and crucial for economic stability, influencing spending, savings, and investment.
                  </div>

                  <Lazy>
                  <div class="app w-full ">
                    <Chart {init} options={optionsInflation} class="chart" />
                  </div>
                  </Lazy>

                  <h2 class="text-2xl text-gray-200 font-bold mt-20 sm:mt-10">
                    Treasury Rates
                  </h2>

                  <div class="text-[1rem] text-white mt-2 mb-2">
                    Treasury rates are the interest rates that the US government pays on its debt obligations, and they are a key benchmark for interest rates across the economy.
                  </div>

                  <div class="w-full text-white">
                    <div class="relative flex justify-end">
                    <select class="w-24 select select-bordered select-sm p-0 pl-5 bg-[#2A303C]" on:change={changeStatement}>
                        <option disabled>Choose a Time Period</option>
                        <option value="oneMonth">1M</option>
                        <option value="sixMonths">6M</option>
                        <option value="oneYear">1Y</option>
                        <option value="threeYears" selected>3Y</option>
                        <option value="fiveYears">5Y</option>
                        <option value="max">Max</option>                                 
                    </select>
                    </div>
                </div>
                <Lazy>
                  <div class="app w-full ">
                    <Chart {init} options={optionsData} class="chart" />
                  </div>
                </Lazy>

                  <ul class="text-[0.8rem] font-medium text-center w-56 pt-10 sm:w-56 mb-5 flex justify-center sm:justify-end items-center ml-auto">
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
                        <th class="text-white font-semibold text-end text-sm sm:text-[1rem]">Month 1</th>
                        <th class="text-white font-semibold text-end text-sm sm:text-[1rem]">Month 2</th>
                        <th class="text-white font-semibold text-end text-sm sm:text-[1rem]">Month 3</th>
                        <th class="text-white font-semibold text-end text-sm sm:text-[1rem]">Month 6</th>
                        <th class="text-white font-semibold text-end text-sm sm:text-[1rem]">Year 1</th>
                        <th class="text-white font-semibold text-end text-sm sm:text-[1rem]">Year 2</th>
                        <th class="text-white font-semibold text-end text-sm sm:text-[1rem]">Year 3</th>
                        <th class="text-white font-semibold text-end text-sm sm:text-[1rem]">Year 5</th>
                        <th class="text-white font-semibold text-end text-sm sm:text-[1rem]">Year 10</th>
                        <th class="text-white font-semibold text-end text-sm sm:text-[1rem]">Year 20</th>
                        <th class="text-white font-semibold text-end text-sm sm:text-[1rem]">Year 30</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each tableList as item}
                          <!-- row -->
                          <tr class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#27272A] border-b-[#09090B] shake-ticker cursor-pointer">
                          
                              <td class="text-white font-medium text-sm sm:text-[1rem] whitespace-nowrap border-b-[#09090B]">
                                {item?.date}
                              </td>
                              <td class="text-white font-medium text-sm sm:text-[1rem] text-end whitespace-nowrap border-b-[#09090B]">
                                {item?.month1}
                              </td>
                              <td class="text-white font-medium text-sm sm:text-[1rem] text-end whitespace-nowrap border-b-[#09090B]">
                                {item?.month2 !== null ? item?.month2 : '-'}
                              </td>
                              <td class="text-white font-medium text-sm sm:text-[1rem] text-end whitespace-nowrap border-b-[#09090B]">
                                {item?.month3}
                              </td>
                              <td class="text-white font-medium text-sm sm:text-[1rem] text-end whitespace-nowrap border-b-[#09090B]">
                                {item?.month6}
                              </td>
                              <td class="text-white font-medium text-sm sm:text-[1rem] text-end whitespace-nowrap border-b-[#09090B]">
                                {item?.year1}
                              </td>
                              <td class="text-white font-medium text-sm sm:text-[1rem] text-end whitespace-nowrap border-b-[#09090B]">
                                {item?.year2}
                              </td>
                              <td class="text-white font-medium text-sm sm:text-[1rem] text-end whitespace-nowrap border-b-[#09090B]">
                                {item?.year3}
                              </td>
                              <td class="text-white font-medium text-sm sm:text-[1rem] text-end whitespace-nowrap border-b-[#09090B]">
                                {item?.year5}
                              </td>
                              <td class="text-white font-medium text-sm sm:text-[1rem] text-end whitespace-nowrap border-b-[#09090B]">
                                {item?.year10}
                              </td>
                              <td class="text-white font-medium text-sm sm:text-[1rem] text-end whitespace-nowrap border-b-[#09090B]">
                                {item?.year20}
                              </td>
                              <td class="text-white font-medium text-sm sm:text-[1rem] text-end whitespace-nowrap border-b-[#09090B]">
                                {item?.year30}
                              </td>

                          </tr>
                          {/each}

                    </tbody>
                  </table>
      
                      
              </div>


                  
                </div>

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
              <aside class="hidden lg:block relative fixed w-1/4 ml-4">        
              
                {#if data?.user?.tier !== 'Pro' || data?.user?.freeTrial}
                <div on:click={() => goto('/pricing')} class="w-full bg-[#141417] duration-100 ease-out sm:hover:text-white text-gray-400 sm:hover:border-gray-700 border border-gray-800 rounded-lg h-fit pb-4 mt-4 cursor-pointer">
                    <div class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0">
                        <div class="w-full flex justify-between items-center p-3 mt-3">
                        <h2 class="text-start text-xl font-semibold text-white ml-3">
                        Pro Subscription
                        </h2>
                        <ArrowLogo class="w-8 h-8 mr-3 flex-shrink-0"/>
                        </div>
                        <span class="text-white p-3 ml-3 mr-3">
                            Upgrade now for unlimited access to all data and tools.
                        </span>
                    </div>
                </div>
                {/if}

                <div on:click={() => goto('/analysts')} class="w-full bg-[#141417] duration-100 ease-out sm:hover:text-white text-gray-400 sm:hover:border-gray-700 border border-gray-800 rounded-lg h-fit pb-4 mt-4 cursor-pointer">
                    <div class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0">
                        <div class="w-full flex justify-between items-center p-3 mt-3">
                        <h2 class="text-start text-xl font-semibold text-white ml-3">
                        Wallstreet Analyst
                        </h2>
                        <ArrowLogo class="w-8 h-8 mr-3 flex-shrink-0"/>
                        </div>
                        <span class="text-white p-3 ml-3 mr-3">
                            Get the latest top Wall Street analyst ratings.
                        </span>
                    </div>
                </div>

                <div on:click={() => goto('/politicians')} class="w-full bg-[#141417] duration-100 ease-out sm:hover:text-white text-gray-400 sm:hover:border-gray-700 border border-gray-800 rounded-lg h-fit pb-4 mt-4 cursor-pointer">
                    <div class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0">
                        <div class="w-full flex justify-between items-center p-3 mt-3">
                        <h2 class="text-start text-xl font-semibold text-white ml-3">
                        Congress Trading
                        </h2>
                        <ArrowLogo class="w-8 h-8 mr-3 flex-shrink-0"/>
                        </div>
                        <span class="text-white p-3 ml-3 mr-3">
                            Get the latest top Congress trading insights.
                        </span>
                    </div>
                </div>

              </aside>

        </div>
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
<script lang='ts'>
import {stockTicker, etfTicker, cryptoTicker, assetType} from '$lib/store';
import { Chart } from 'svelte-echarts'
import { init, use } from 'echarts/core'

import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])
    
export let quantData;


let firstElementKey;

let monthlyReturnsData;
let benchmarkMonthlyReturnsData;

    
    
const plotAnnualReturn = () => {

const annualReturnList = [];
const annualReturnListBenchmark = [];

// Find the maximum year in monthlyReturnsData
// Find the maximum year in monthlyReturnsData
let maxYear = Math?.max(...Object?.keys(monthlyReturnsData)?.map(year => parseInt(year)));

// Iterate over the last 4 years
for (let year = maxYear; year > maxYear - 4; year--) {
    if (monthlyReturnsData.hasOwnProperty(year.toString())) {
        const values = monthlyReturnsData[year.toString()];
        annualReturnList.push(values[values.length - 1]);
    }
}

// Find the maximum year in benchmarkMonthlyReturnsData
maxYear = Math?.max(...Object?.keys(benchmarkMonthlyReturnsData)?.map(year => parseInt(year)));

// Iterate over the last 4 years
for (let year = maxYear; year > maxYear - 4; year--) {
    if (benchmarkMonthlyReturnsData.hasOwnProperty(year.toString())) {
        const values = benchmarkMonthlyReturnsData[year.toString()];
        annualReturnListBenchmark.push(values[values.length - 1]);
    }
}




       
const options = {
    silent: true,
    animation: false,
    tooltip: {
        trigger: 'axis',
        hideDelay: 100, // Set the delay in milliseconds
    },
    grid: {
        left: "0%",
        right: "0%",
        bottom: '0%',
        height: "90%",
        containLabel: true,
    },
    xAxis: {
        data: ['2020', '2021', '2022', '2023','2024'],
        type: 'category',
        axisTick: {
            alignWithLabel: true,
        },
        axisLabel: {
            color: '#fff',
        }
    },
    yAxis: [
        {
            type: 'value',
            splitLine: {
                show: false, // Disable y-axis grid lines
            },
            axisLabel: {
            color: '#fff',
            formatter: function (value, index) {
                // Display every second tick
                if (index % 2 === 0) {
                    return '%'+value; // Format value in millions
                } else {
                    return ''; // Hide this tick
                }
            }
        }
        },
        {
            type: 'value',
            axisLabel: {
                formatter: '{value} %', // Display value with a percent sign
            },
            splitLine: {
                show: false, // Disable y-axis grid lines
            },
        },
    ],
    series: [                    
        {
            name: $assetType === 'etf' ? $etfTicker : $assetType === 'crypto' ? $cryptoTicker : $stockTicker,
            data: annualReturnList,
            type: 'bar',
            barWidth: '30%',
            smooth: true,
            itemStyle: {
                color: '#398EC2',
            },
            
        },
        {
            name: 'S&P500',
            data: annualReturnListBenchmark,
            type: 'bar',
            barWidth: '30%',
            smooth: true,
            itemStyle: {
                color: '#FEDD78',
            },
            
            
        },
    ],
    
};


return options;

}
    

    let optionsAnnualReturn;
    
    
    
    $: {
            
        if (($assetType === 'etf' ? $etfTicker : $assetType === 'crypto' ? $cryptoTicker : $stockTicker) && typeof window !== 'undefined')
        {
            try {
                firstElementKey = Object?.keys(quantData)[0];
                monthlyReturnsData = quantData[firstElementKey]['Monthly Return'];
                benchmarkMonthlyReturnsData = quantData['SPY']['Monthly Return']
            }

            catch(e) {
                monthlyReturnsData = [];
                benchmarkMonthlyReturnsData = [];
            }
            
    
            optionsAnnualReturn = plotAnnualReturn()
        }
    }
    
    
    </script>
    
    
    
    <section class="mt-4 overflow-hidden text-white h-full">
                                      
        <div class="w-full m-auto h-full overflow-hidden">
            <main>

      


            <div class="rounded-2xl pl-3 sm:pr-0 pt-3 w-full mt-4">

                    <h1 class="text-white m-auto font-bold text-lg  text-center">
                        Annual Return (%)
                    </h1>
            
                    <div class="text-white flex flex-row items-center justify-center m-auto font-medium text-md text-center mt-3">
                        
                        <div class="flex flex-row items-center">
                            <div class="h-full bg-gray-800 transform -translate-x-1/2 " aria-hidden="true"></div>
                            <div class="w-4 h-4 bg-[#3E9CD5] border-4 box-content border-gray-900 rounded-full transform -translate-x-1/2" aria-hidden="true"></div>
                            <span class="text-white font-medium inline-block">
                                {$assetType === 'etf' ? $etfTicker : $assetType === 'crypto' ? $cryptoTicker : $stockTicker}
                            </span>
                        </div>

                        <div class="flex flex-row items-center ml-10">
                            <div class="h-full bg-gray-800 transform -translate-x-1/2 " aria-hidden="true"></div>
                            <div class="w-4 h-4 bg-[#FFF384] border-4 box-content border-gray-900 rounded-full transform -translate-x-1/2" aria-hidden="true"></div>
                            <span class="text-white font-medium inline-block">
                                S&P500
                            </span>
                        </div>


                    </div>

                <div class="app w-full h-[300px] mt-5 mb-16">
                    <Chart {init} options={optionsAnnualReturn} class="chart" />
                </div>

                
            </div>
    
              </main>
            </div>
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
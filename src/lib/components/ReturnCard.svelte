<script lang='ts'>

    //import { Chart } from 'svelte-echarts';
    import { Chart } from 'svelte-echarts'
    import Lazy from "svelte-lazy";

    import {stockTicker, etfTicker, cryptoTicker, assetType} from '$lib/store';
    
    export let quantData;
    

    
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
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
                grid: {
                    left: "2%",
                    right: "2%",
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
                },
                yAxis: [
                    {
                        type: 'value',
                        splitLine: {
                            show: false, // Disable y-axis grid lines
                        },
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
    
    const plotMonthlyDistributionReturn = () => {
        const allReturns = Object?.values(monthlyReturnsData)?.flat();

        let histogramData = [];
        // Calculate histogram data
        let binSize = 6;
        let maxBin = Math.ceil(Math.max(...allReturns) / binSize) * binSize;
        let minBin = Math.floor(Math.min(...allReturns) / binSize) * binSize;

        for (let i = minBin; i <= maxBin; i += binSize) {
            let count = allReturns.filter(r => r >= i && r < i + binSize)?.length;
            histogramData.push([i, count]);
        }

        const options = {
            grid: {
                    left: "0%",
                    right: "0%",
                    bottom: '0%',
                    height: "90%",
                    containLabel: true,
                },
            xAxis: [
                {
                type: 'category',
                name: 'Return (%)', // X-axis label
                nameLocation: 'center',
                axisTick: {
                    alignWithLabel: true,
                },
               
                nameTextStyle: {
                    color: 'white', // Set label color to white
                    padding: [30, 0, 0, 0],
                },
                }
                
            ],
            yAxis: [
                    {
                        type: 'value',
                        name: 'Frequency', // X-axis label
                        nameLocation: 'center',
                        splitLine: {
                            show: false, // Disable y-axis grid lines
                        },
                        nameTextStyle: {
                            color: 'white', // Set label color to white
                            padding: [0, 0, 20, 0],
                        },
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
                name: 'Frequency of Return',
                type: 'bar',
                barWidth: '80%',
                itemStyle: {
                    color: 'white',
                },
                data: histogramData
                }
            ],
            
            };
        
        return options;
    };
    
    let displayReturn = 'annualReturn';
    let optionsAnnualReturn;
    let optionsMonthlyDistributionReturn;
    
    function changeStatement(event)
        
        {
        
            displayReturn = event.target.value;
        
        }
        
    
    
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
            
    
            if (displayReturn === 'annualReturn')
            {
                optionsAnnualReturn = plotAnnualReturn()
            }
            else if(displayReturn === 'monthlyDistributionReturn')
            {
                optionsMonthlyDistributionReturn = plotMonthlyDistributionReturn();
            }
        }
    }
    
    
    </script>
    
    
    
    <section class="mt-4 overflow-hidden text-white h-full">
                                      
        <div class="w-full m-auto h-full overflow-hidden">
            <main>

            <div class="text-start mr-auto w-full">
              <select class="w-48 select select-bordered select-sm p-0 pl-5 ml-2 mt-2 bg-[#2A303C]" on:change={changeStatement}>
                <option disabled>Choose your Return</option>
                <option value="annualReturn" selected>
                    Annual Return
                </option>
                <option value="monthlyDistributionReturn" >
                    Distribution of Monthly Returns
                </option>
              </select>
            </div>


            <div class="rounded-2xl pl-3 sm:pr-0 pt-3 w-full mt-4">

                {#if displayReturn === 'annualReturn'}
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

                    <Lazy height={300} fadeOption={{delay: 100, duration: 500}} keep={true}>
                        <div class="app w-full h-[300px] mt-5 mb-16">
                            <Chart options={optionsAnnualReturn} class="chart" />
                        </div>
                    </Lazy>

                    
                {:else if displayReturn === 'monthlyDistributionReturn'}

                    <h1 class="text-white m-auto font-bold text-lg sm:-mb-2 text-center">
                        Distribution of Monthly Returns
                    </h1>

                    <Lazy height={300} fadeOption={{delay: 100, duration: 500}} keep={true}>
                        <div class="app w-full h-[300px] mt-5 mb-16">
                            <Chart options={optionsMonthlyDistributionReturn} class="chart" />
                        </div>
                    </Lazy>
                {/if}
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
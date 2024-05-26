
<script lang ='ts'>
    import { displayCompanyName, stockTicker, screenWidth} from '$lib/store';
    import InfoModal from '$lib/components/InfoModal.svelte';
    import { Chart } from 'svelte-echarts'
    import { abbreviateNumber } from "$lib/utils";

    import Lazy from 'svelte-lazy';


    export let h1bVisaList;
    let optionsData;


function getPlotOptions() {
    let dates = [];
    let engineerApplication = [];
    let saleApplication = [];
    let marketingApplication = [];
    let managerApplication = [];
    // Iterate over the data and extract required information
    h1bVisaList?.forEach(item => {
    // Extract year and convert it to fiscal year format
    const fiscalYear = "FY" + String(item?.year)?.slice(2);
    dates?.push(fiscalYear);

    // Extract totalValue
    engineerApplication?.push(item?.engineerApplication);
    saleApplication?.push(item?.saleApplication);
    marketingApplication?.push(item?.marketingApplication);
    managerApplication?.push(item?.managerApplication);
    });



    const option = {
    silent: true,
    grid: {
        left: $screenWidth < 640 ? '0%' : '2%',
        right: $screenWidth < 640 ? '5%' : '2%',
        bottom: $screenWidth < 640 ? '0%' : '2%',
        containLabel: true
    },
    xAxis: {
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
            color: '#6E7079', // Change label color to white
                formatter: function (value) {
                return '#'+value // Format value in millions
                },
            },
        },
        ],
    series: [
        {
            data: saleApplication,
            type: 'bar',
            itemStyle: {
                    color: '#fff' // Change bar color to white
                }
        },
        {
            data: marketingApplication,
            type: 'bar',
            itemStyle: {
                color: '#5470C6' // Change bar color to white
            }
        },
        {
            data: managerApplication,
            type: 'bar',
            itemStyle: {
                color: '#FF2F1F' // Change bar color to white
            }
        },
        {
            data: engineerApplication,
            type: 'bar',
            itemStyle: {
                    color: '#F8901E' // Change bar color to white
                }
        },
    ]
    };


return option;
}
   
$: {
  if($stockTicker && typeof window !== 'undefined' && h1bVisaList?.length !== 0) {

    optionsData = getPlotOptions()

    // Calculate total number of contracts
    /*
    avgTotalValue = Math.floor((h1bVisaList?.reduce((sum, item) => sum + item?.totalValue, 0))/h1bVisaList?.length);
    const { year:yearWithMaxLobbying, totalValue: maxLobbying } = h1bVisaList?.reduce((max, item) => item?.totalValue > max?.totalValue ? item : max, h1bVisaList?.at(0));
    displayYear = yearWithMaxLobbying;
    displayMaxLobbying = maxLobbying
    */
  }
}

</script>
    
    
    
    <section class="overflow-hidden text-white h-full pb-8 sm:pb-2">
        <main class="overflow-hidden ">
                        
            <div class="flex flex-row items-center">
                <label for="h1bVisaInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold">
                    Talent Acquisition
                </label>
                <InfoModal
                  title={"H1B Visa"}
                  content={"Add explanation"}
                  id={"h1bVisaInfo"}
                />
            </div>
    
            {#if h1bVisaList?.length !== 0}
            <div class="p-3 sm:p-0 mt-2 pb-8 sm:pb-2 rounded-lg bg-[#202020] sm:bg-[#0F0F0F]">
                    
                <div class="w-full flex flex-col items-start">
                    <div class="text-white text-sm sm:text-[1rem] mt-1 sm:mt-3 mb-1 w-full">
                        Explore {$displayCompanyName} talent acquisition strategies for attracting top global talent, securing exceptional employees worldwide through the H1B Visa program, spanning sales to engineering roles.
                    </div>
                </div>
            
                <a href="{'/stocks/'+$stockTicker+'/stats/employees'}" class="text-blue-400 hover:text-white flex justify-end mt-3 text-sm sm:text-[1rem]">
                    Full Report
                </a>

                <Lazy height={300} fadeOption={{delay: 100, duration: 500}} keep={true}>
                    <div class="app w-full h-[300px] ">
                        <Chart options={optionsData} class="chart" />
                    </div>
                </Lazy>

                <div class="flex flex-row items-center justify-between mx-auto mt-5 w-full sm:w-5/6">
                    <div class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
                    <div class="h-full bg-gray-800 transform -translate-x-1/2 " aria-hidden="true"></div>
                    <div class="w-3 h-3 bg-[#F8901E] border-4 box-content border-gray-900 rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                    <span class="mt-2 sm:mt-0 text-white text-sm sm:text-md inline-block">
                        Engineer
                    </span>
                </div>
                    <div class="flex flex-col sm:flex-row items-center  w-1/2 justify-center">
                        <div class="h-full bg-gray-800 transform -translate-x-1/2 " aria-hidden="true"></div>
                        <div class="w-3 h-3 bg-[#fff] border-4 box-content border-gray-900 rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                        <span class="mt-2 sm:mt-0 text-white text-sm sm:text-md sm:font-medium inline-block">
                        Sale
                        </span>
                    </div>
                    <div class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
                    <div class="h-full bg-gray-800 transform -translate-x-1/2 " aria-hidden="true"></div>
                    <div class="w-3 h-3 bg-[#5470C6] border-4 box-content border-gray-900 rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                    <span class="mt-2 sm:mt-0 text-white text-sm sm:text-md inline-block">
                        Marketing
                    </span>
                </div>
                <div class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
                    <div class="h-full bg-gray-800 transform -translate-x-1/2 " aria-hidden="true"></div>
                    <div class="w-3 h-3 bg-[#FF2F1F] border-4 box-content border-gray-900 rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                    <span class="mt-2 sm:mt-0 text-white text-sm sm:text-md inline-block">
                        Manager
                    </span>
                </div>
            
                </div>
            </div>

            {:else}
            <h2 class="mt-10 mb-5 flex justify-center items-center text-3xl font-bold text-slate-700 m-auto">
                No data available
                <svg class="w-10 sm:w-12 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#334155" d="M18.68 12.32a4.49 4.49 0 0 0-6.36.01a4.49 4.49 0 0 0 0 6.36a4.508 4.508 0 0 0 5.57.63L21 22.39L22.39 21l-3.09-3.11c1.13-1.77.87-4.09-.62-5.57m-1.41 4.95c-.98.98-2.56.97-3.54 0c-.97-.98-.97-2.56.01-3.54c.97-.97 2.55-.97 3.53 0c.97.98.97 2.56 0 3.54M10.9 20.1a6.527 6.527 0 0 1-1.48-2.32C6.27 17.25 4 15.76 4 14v3c0 2.21 3.58 4 8 4c-.4-.26-.77-.56-1.1-.9M4 9v3c0 1.68 2.07 3.12 5 3.7v-.2c0-.93.2-1.85.58-2.69C6.34 12.3 4 10.79 4 9m8-6C7.58 3 4 4.79 4 7c0 2 3 3.68 6.85 4h.05c1.2-1.26 2.86-2 4.6-2c.91 0 1.81.19 2.64.56A3.215 3.215 0 0 0 20 7c0-2.21-3.58-4-8-4Z"/></svg>
            </h2>
            
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
        height: 230px;
    }
    }

    .chart {
    width: 100%;
    }
    
</style>
<script lang ='ts'>
    import { optionsNetFlowComponent, stockTicker, assetType, etfTicker, getCache, setCache} from '$lib/store';
    import InfoModal from '$lib/components/InfoModal.svelte';
    import { Chart } from 'svelte-echarts'
    import { init, use } from 'echarts/core'
    import { LineChart } from 'echarts/charts'
    import { GridComponent } from 'echarts/components'
    import { CanvasRenderer } from 'echarts/renderers'

    export let data;

    use([LineChart, GridComponent, CanvasRenderer])
  
    let isLoaded = false;
   
  
    let rawData = [];
    let optionsData;
    let sentiment;

  
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
  } else if (Math?.abs(value) >= 1e4) {
        return { unit: 'K', denominator: 1e4 };
  } else {
    return { unit: '', denominator: 1 };
  }
  }
  
  
  function getPlotOptions() {
    let dates = [];
    let priceList = [];
    let netCallList = [];
    let netPutList = [];

    // Iterate over the data and extract required information
    rawData?.forEach(item => {
  
    dates?.push(item?.date);
    priceList?.push(item?.price);
    netCallList?.push(item?.netCall)
    netPutList?.push(item?.netPut)
   
    });
    
    sentiment = netCallList?.slice(-1)?.at(0) > netPutList?.slice(-1)?.at(0) ? 'bullish' : 'bearish';
    
    const {unit, denominator } = normalizer(Math.max(...netCallList) ?? 0)

    const option = {
    silent: true,
    tooltip: {
        trigger: 'axis',
        hideDelay: 100, // Set the delay in milliseconds
    },
    animation: false,
    grid: {
        left: '1%',
        right: '2%',
        bottom: '0%',
        top: '10%',
        containLabel: true
    },
    xAxis:
    {
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
                    //value = Math.max(value, 0);
                    return '$'+(value / denominator)?.toFixed(0) + unit; // Format value in millions
                } else {
                    return ''; // Hide this tick
                }
            }
        },
    },
    {
      type: 'value',
      splitLine: {
            show: false, // Disable x-axis grid lines
      },
      position: 'right',
      
      axisLabel: {
        color: '#fff',
          formatter: function (value, index) {
            if (index % 2 === 0) {
              return '$'+value?.toFixed(1)
            } else {
                  return ''; // Hide this tick
              }
          }
      }
    },
    ],
    series: [
        {
            name: 'Price',
            data: priceList,
            type: 'line',
            yAxisIndex: 1,
            itemStyle: {
                color: '#fff'
            },
            showSymbol: false,    
        },
        {   
            name: 'Net Put',
            data: netPutList,
            type: 'line',
            areaStyle: {opacity: 0.5},
            stack: 'NetFlow',
            itemStyle: {
                color: '#FF2F1F'
            },
            showSymbol: false,
           
        },
        {
            name: 'Net Call',
            data: netCallList,
            type: 'line',
            areaStyle: {opacity: 0.5},
            stack: 'NetFlow',
            itemStyle: {
                color: '#10DB06'
            },
            showSymbol: false,

        },
    ]
    };
  
  
  return option;
  }
  
  const getOptionsNetFlow = async (ticker) => {
    // Get cached data for the specific tickerID
    const cachedData = getCache(ticker, 'getOptionsNetFlow');
    if (cachedData) {
      rawData = cachedData;
    } else {
  
      const postData = {'ticker': ticker};
      // make the POST request to the endpoint
      const response = await fetch(data?.apiURL + '/options-net-flow-ticker', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": data?.apiKey
        },
        body: JSON.stringify(postData)
      });
  
      rawData = (await response.json());
      // Cache the data for this specific tickerID with a specific name 'getOptionsNetFlow'
      setCache(ticker, rawData, 'getOptionsNetFlow');
    }
    
    if(rawData?.length !== 0) {
      $optionsNetFlowComponent = true;
    } else {
      $optionsNetFlowComponent = false;
    }
  };
  
  

  $: {
  if($assetType === 'stock' ? $stockTicker :$etfTicker && typeof window !== 'undefined') {
    isLoaded=false;
    const ticker = $assetType === 'stock' ? $stockTicker :$etfTicker
    const asyncFunctions = [
      getOptionsNetFlow(ticker)
      ];
      Promise.all(asyncFunctions)
          .then((results) => {
            optionsData = getPlotOptions();
          })
          .catch((error) => {
            console.error('An error occurred:', error);
          });
    isLoaded = true;
  
  }
  }
      
  
  
  </script>
    
<svelte:options immutable={true} />
    
  <section class="overflow-hidden text-white h-full pb-8">
    <main class="overflow-hidden ">
                    
        <div class="flex flex-row items-center">
            <label for="optionsNetFlowInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold">
                Options Net Flow
            </label>
            <InfoModal
              title={"Options Net Flow"}
              content={"An Options Net Flow of XY% means the market expects significant price fluctuations for the stock, with an annualized potential range of ±XY% from its current price. This indicates high uncertainty and risk, leading to more expensive options but doesn't predict price direction."}
              id={"optionsNetFlowInfo"}
            />
        </div>
  
        {#if data?.user?.tier === 'Pro'}
        {#if isLoaded}
  
        {#if rawData?.length !== 0}
  
        <div class="w-full flex flex-col items-start">
            <div class="text-white text-[1rem] mt-2 mb-2 w-full">
                Analysis of the 20-day moving average of the options net flow demonstrates a {sentiment} trend, characterized by the {sentiment === 'bullish' ? 'Net Call Flow exceeding the Net Put Flow' : 'Net Put Flow exceeding the Net Call Flow'} .
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
                    Price
                </span>
            </div>

            <div class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
                <div class="h-full transform -translate-x-1/2 " aria-hidden="true"></div>
                <div class="w-3 h-3 bg-[#10DB06] border-4 box-content border-[#27272A] rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                <span class="mt-2 sm:mt-0 text-white text-xs sm:text-md sm:font-medium inline-block">
                    Net Call 
                </span>
            </div>

            <div class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
                <div class="h-full transform -translate-x-1/2 " aria-hidden="true"></div>
                <div class="w-3 h-3 bg-[#FF2F1F] border-4 box-content border-[#27272A] rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                <span class="mt-2 sm:mt-0 text-white text-xs sm:text-md sm:font-medium inline-block">
                    Net Put
                </span>
            </div>
  
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
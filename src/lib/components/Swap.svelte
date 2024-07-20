<script lang ='ts'>
    import { swapComponent, displayCompanyName, stockTicker, screenWidth, userRegion, getCache, setCache} from '$lib/store';
    import InfoModal from '$lib/components/InfoModal.svelte';
    import { Chart } from 'svelte-echarts'
    import { Motion, AnimateSharedLayout } from "svelte-motion";

    import Lazy from 'svelte-lazy';
    export let data;
  
    let isLoaded = false;

    const tabs = [
    {
      title: "Effective Date",
    },
    {
      title: "Expiration Date",
    }
  ];

  let activeIdx = 0;


function changeTab(index) {
    activeIdx = index;
    switch (activeIdx) {
        case 0:
            optionsData = getPlotOptions('effectiveDate');
            break;
        case 1:
        optionsData = getPlotOptions('expirationDate');
            break;
        // Default case in case changeType doesn't match any of the specified cases
        default:
            // Handle the default case or leave it empty if not needed
            break;
    }
}


    const usRegion = ['cle1','iad1','pdx1','sfo1'];
  
    let apiURL;
    let apiKey = import.meta.env.VITE_STOCKNEAR_API_KEY;

  
    userRegion.subscribe(value => {
  
        if (usRegion.includes(value)) {
        apiURL = import.meta.env.VITE_USEAST_API_URL;
        } else {
        apiURL = import.meta.env.VITE_EU_API_URL;
        }
    });
  
  
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
    return { unit: 'K', denominator: 1e3 };
  } else if (Math?.abs(value) >= 1e4) {
        return { unit: 'K', denominator: 1e3 };
  } else {
    return { unit: '', denominator: 1 };
  }
  }
  
  
  function getPlotOptions(state) {


    let dates = [];
    let notionalAmount = [];
    let notionalQuanitity = [];

    // Iterate over the data and extract required information
    rawData?.forEach(item => {
        
    if ( state === 'effectiveDate') {
        dates?.push(item['Effective Date']);
    }
    else {
        dates?.push(item['Expiration Date']);
    }
    notionalAmount?.push(item['Notional amount-Leg 1']);
    notionalQuanitity?.push(item['Total notional quantity-Leg 1']);
    });
    
    dates?.sort((a, b) => {
        return new Date(a) - new Date(b);
    });

    const {unit, denominator } = normalizer(Math.max(...notionalAmount) ?? 0)

    const { unit: quantityUnit, denominator: quantityDenominator } = normalizer(Math.max(...notionalQuanitity) ?? 0);
    
    const option = {
    silent: true,
    animation: $screenWidth < 640 ? false: true,
    grid: {
        left: '2%',
        right: $screenWidth < 640 ? '2%' : '6%',
        bottom: '0%',
        top: '10%',
        containLabel: true
    },
    xAxis:
    {
        type: 'category',
        boundaryGap: false,
        data: dates,
    },
    yAxis: [
    { 
        type: 'value',
        splitLine: {
            show: false, // Disable x-axis grid lines
        },
        axisLabel: {
            color: '#6E7079', // Change label color to white
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
            color: '#6E7079', // Change label color to white
            formatter: function (value, index) {
                // Display every second tick
                if (index % 2 === 0) {
                    //value = Math.max(value, 0);
                    return '#'+(value / quantityDenominator)?.toFixed(0) + quantityUnit; // Format value in millions
                } else {
                    return ''; // Hide this tick
                }
            }
        },
    },
    ],
    series: [
            {
                type: 'scatter',
                symbolSize: 8,
                data: dates?.map((date, index) => [date, notionalAmount[index]]),
                itemStyle: {
                    color: '#8F54F4'
                }
            },
            {
                type: 'scatter',
                symbolSize: 8,
                data: dates?.map((date, index) => [date, notionalQuanitity[index]]),
                yAxisIndex: 1,
                itemStyle: {
                    color: '#fff'
                }
            }
        ]
    };
  
  
  return option;
  }
  
  const getSwapData = async (ticker) => {
    // Get cached data for the specific tickerID
    const cachedData = getCache(ticker, 'getSwapData');
    if (cachedData) {
      rawData = cachedData;
    } else {
  
      const postData = {'ticker': ticker};
      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/swap-ticker', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData)
      });
  
      rawData = (await response.json());
      // Cache the data for this specific tickerID with a specific name 'getSwapData'
      setCache(ticker, rawData, 'getSwapData');
    }
    
    if(rawData?.length !== 0) {
      $swapComponent = true;
    } else {
      $swapComponent = false;
    }
  };
  
  

  $: {
  if($stockTicker && typeof window !== 'undefined') {
    isLoaded=false;
    activeIdx = 0;
    const asyncFunctions = [
      getSwapData($stockTicker)
      ];
      Promise.all(asyncFunctions)
          .then((results) => {
            optionsData = getPlotOptions('effectiveDate');
          })
          .catch((error) => {
            console.error('An error occurred:', error);
          });
    isLoaded = true;
  
  }
  }
  
  let charNumber = 20;
  
  $: {
  if($screenWidth < 640)
  {
    charNumber = 20;
  }
  else {
    charNumber =40;
  }
  }
    
  
  
  </script>
    
    
    
  <section class="overflow-hidden text-white h-full pb-8">
    <main class="overflow-hidden ">
                    
        <div class="flex flex-row items-center">
            <label for="swapInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold">
                Swap Data
            </label>
            <InfoModal
              title={"Swap Data"}
              content={"Swaps in the stock market are derivative contracts to exchange cash flows or assets, used for risk management, speculation, and enhancing market liquidity."}
              id={"swapInfo"}
            />
        </div>
  
        {#if data?.user?.tier === 'Pro'}
        {#if isLoaded}
  
        {#if rawData?.length !== 0}
  
        <div class="w-full flex flex-col items-start">
            <div class="text-white text-sm sm:text-[1rem] mt-2 mb-2 w-full">
                Analysis of the 20-day moving average of the options net flow demonstrates a {sentiment} trend, characterized by the {sentiment === 'bullish' ? 'Net Call Flow exceeding the Net Put Flow' : 'Net Put Flow exceeding the Net Call Flow'} .
            </div>
        </div>
  
        <div class="pb-2 rounded-lg bg-[#09090B]">
                
            <div class="bg-[#313131] w-fit relative flex flex-wrap items-center justify-center rounded-lg p-1 mt-4">
                <AnimateSharedLayout>
                  {#each tabs as item, i}
                    <button
                      on:click={() => changeTab(i)}
                      class="group relative z-[1] rounded-full px-3 sm:px-6 py-1 {activeIdx === i
                        ? 'z-0'
                        : ''} "
                    >
                      {#if activeIdx === i}
                        <Motion
                          layoutId="clicked-btn"
                          transition={{ duration: 0.2 }}
                          let:motion
                        >
                          <div
                            use:motion
                            class="absolute inset-0 rounded-lg bg-purple-600"
                          ></div>
                        </Motion>
                      {/if}
                      <span
                        class="relative text-xs sm:text-sm block font-medium duration-200 text-white">
                        {item.title}
                      </span>
                    </button>
                  {/each}
                </AnimateSharedLayout>
              </div>

          
            <Lazy height={300} fadeOption={{delay: 100, duration: 500}} keep={true}>
                <div class="app w-full h-[300px] mt-5">
                    <Chart options={optionsData} class="chart" />
                </div>
            </Lazy>
        
        </div>
  
        <div class="flex flex-row items-center justify-between mx-auto mt-5 w-full sm:w-11/12">
            
            <div class="mt-3.5 sm:mt-0 flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
                <div class="h-full transform -translate-x-1/2 " aria-hidden="true"></div>
                <div class="w-3 h-3 bg-[#8F54F4] border-4 box-content border-[#27272A] rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                <span class="mt-2 sm:mt-0 text-white text-center sm:text-start text-xs sm:text-md inline-block">
                    Notional Amount
                </span>
            </div>

            <div class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
                <div class="h-full transform -translate-x-1/2 " aria-hidden="true"></div>
                <div class="w-3 h-3 bg-[#fff] border-4 box-content border-[#27272A] rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                <span class="mt-2 sm:mt-0 text-white text-xs sm:text-md sm:font-medium inline-block">
                    Notional Quantity
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
        <div class="shadow-lg shadow-bg-[#000] bg-[#09090B] sm:bg-opacity-[0.5] text-sm sm:text-[1rem] rounded-md w-full p-4 min-h-24 mt-4 text-white m-auto flex justify-center items-center text-center font-semibold">
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
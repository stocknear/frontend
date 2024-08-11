<script lang ='ts'>
  import { abbreviateNumber } from "$lib/utils";

    import { swapComponent, stockTicker, screenWidth, getCache, setCache} from '$lib/store';
    import InfoModal from '$lib/components/InfoModal.svelte';
    import { Chart } from 'svelte-echarts'

    import { init, use } from 'echarts/core'
    import { ScatterChart } from 'echarts/charts'
   import { GridComponent } from 'echarts/components'
   import { CanvasRenderer } from 'echarts/renderers';
    export let data;

    use([ScatterChart, GridComponent, CanvasRenderer])

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
    optionsData = getPlotOptions(activeIdx === 0 ? 'effectiveDate' : 'expirationDate');
  }
  
    let rawData = [];
    let optionsData;
    let avgNotionalAmount;
    let avgNotionalQuantity;


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
    let notionalQuantity = [];

    // Iterate over the data and extract required information
    rawData?.forEach(item => {
        
    if ( state === 'effectiveDate') {
        dates?.push(item['Effective Date']);
    }
    else {
        dates?.push(item['Expiration Date']);
    }
    notionalAmount?.push(item['Notional amount-Leg 1']);
    notionalQuantity?.push(item['Total notional quantity-Leg 1']);
    });
    
    dates?.sort((a, b) => {
        return new Date(a) - new Date(b);
    });

    // Compute the average of item?.traded
    const totalNotionalAmount = notionalAmount?.reduce((acc, item) => acc + item, 0);
    avgNotionalAmount = totalNotionalAmount / notionalAmount?.length;

    const totalNotionalQuantity = notionalQuantity?.reduce((acc, item) => acc + item, 0);
    avgNotionalQuantity = totalNotionalQuantity / notionalQuantity?.length;

    const {unit, denominator } = normalizer(Math.max(...notionalAmount) ?? 0)

    const { unit: quantityUnit, denominator: quantityDenominator } = normalizer(Math.max(...notionalQuantity) ?? 0);
    
    const option = {
    silent: true,
    animation: false,
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
            color: '#fff', // Change label color to white
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
                data: dates?.map((date, index) => [date, notionalQuantity[index]]),
                yAxisIndex: 1,
                itemStyle: {
                    color: '#fff'
                }
            }
        ]
    };
  
  
  return option;
  }
  
  async function getSwapData(ticker) {
    const cachedData = getCache(ticker, 'getSwapData');
    if (cachedData) {
      rawData = cachedData;
    } else {
      try {
        const response = await fetch(`${data?.apiURL}/swap-ticker`, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": data?.apiKey
          },
          body: JSON.stringify({ ticker })
        });
        if (!response.ok) throw new Error('API request failed');
        rawData = await response.json();
        setCache(ticker, rawData, 'getSwapData');
      } catch (error) {
        console.error('Failed to fetch swap data:', error);
        rawData = [];
      }
    }
    $swapComponent = rawData?.length !== 0;
  }
  

  $: if ($stockTicker && typeof window !== 'undefined') {
    isLoaded = false;
    activeIdx = 0;
    getSwapData($stockTicker).then(() => {
      optionsData = getPlotOptions('effectiveDate');
      isLoaded = true;
    });
  }


  $: charNumber = $screenWidth < 640 ? 20 : 40;
  
</script>
    
<svelte:options immutable={true} />


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
            <div class="text-white text-[1rem] mt-2 mb-2 w-full">
                The swap data from the past 100 days shows an average notional amount of {abbreviateNumber(avgNotionalAmount,true)} and an average notional quantity of {abbreviateNumber(avgNotionalQuantity)}.
            </div>
        </div>
  
        <div class="pb-2 rounded-lg bg-[#09090B]">
                
            <div class="bg-[#313131] w-fit relative flex flex-wrap items-center justify-center rounded-lg p-1 mt-4">
                  {#each tabs as item, i}
                    <button
                      on:click={() => changeTab(i)}
                      class="group relative z-[1] rounded-full px-3 py-1 {activeIdx === i
                        ? 'z-0'
                        : ''} ">
                      {#if activeIdx === i}
                          <div
                            class="absolute inset-0 rounded-lg bg-purple-600"
                          ></div>
                      {/if}
                      <span
                        class="relative text-sm block font-medium duration-200 text-white">
                        {item.title}
                      </span>
                    </button>
                  {/each}
              </div>

          
                <div class="app w-full h-[300px] mt-5">
                    <Chart {init} options={optionsData} class="chart" />
                </div>
        
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
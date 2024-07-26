
<script lang ='ts'>
    import { shareStatisticsComponent, displayCompanyName, stockTicker, screenWidth, getCache, setCache} from '$lib/store';
    import InfoModal from '$lib/components/InfoModal.svelte';
    import { Chart } from 'svelte-echarts'
    import { abbreviateNumber } from "$lib/utils";

    import Lazy from 'svelte-lazy';

    export let data;
    
    let isLoaded = false;
   

    let rawData = {};
    let optionsData;


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
function getPlotOptions() {
    let dates = [];
    let floatShares = [];
    let outstandingShares = [];
    // Iterate over the data and extract required information
    rawData?.historicalShares?.forEach(item => {
    dates?.push(item?.date);

    floatShares?.push(item?.floatShares);
    outstandingShares?.push(item?.outstandingShares);

    });


    const {unit, denominator } = normalizer(Math.max(...floatShares) ?? 0)


    const option = {
    silent: true,
    animation: $screenWidth < 640 ? false: true,
    grid: {
        left: $screenWidth < 640 ? '1%' : '2%',
        right: $screenWidth < 640 ? '0%' : '2%',
        bottom: $screenWidth < 640 ? '0%' : '2%',
        top: '5%',
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
                value = Math.max(value, 0);
                return (value / denominator)?.toFixed(1) + unit; // Format value in millions
                },
            },
        },
        
        ],
    series: [
        {
            data: floatShares,
            type: 'bar',
            itemStyle: {
                color: '#5470C6' // Change bar color to white
            }
        },
        {
            data: outstandingShares,
            type: 'bar',
            itemStyle: {
                color: '#C12F23' // Change bar color to white
            }
        },
    ]
    };


return option;
}

const getShareStatistics = async (ticker) => {
    // Get cached data for the specific tickerID
    const cachedData = getCache(ticker, 'getShareStatistics');
    if (cachedData) {
      rawData = cachedData;
    } else {

      const postData = {'ticker': ticker};
      // make the POST request to the endpoint
      const response = await fetch(data?.apiURL + '/share-statistics', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": data?.apiKey
        },
        body: JSON.stringify(postData)
      });

      rawData = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getShareStatistics'
      setCache(ticker, rawData, 'getShareStatistics');
    }
    if (Object?.keys(rawData)?.length !== 0) {
        $shareStatisticsComponent = true;
    } else {
        $shareStatisticsComponent = false;
    }
};


$: {
  if($stockTicker && typeof window !== 'undefined') {
    isLoaded=false;
    const asyncFunctions = [
      getShareStatistics($stockTicker)
      ];
      Promise.all(asyncFunctions)
          .then((results) => {
            optionsData = getPlotOptions()
          })
          .catch((error) => {
            console.error('An error occurred:', error);
          });
    isLoaded = true;
  }
}

</script>
    
    
    
    <section class="overflow-hidden text-white h-full pb-8">
        <main class="overflow-hidden ">
                        
            <div class="flex flex-row items-center">
                <label for="shareStatisticsInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold">
                    Share Statistics
                </label>
                <InfoModal
                  title={"Share Statistics"}
                  content={"Shares outstanding refer to a company's stock currently held by all its shareholders. Floating shares refer to the number of a company's shares that are actively traded and available for public trading on the stock market."}
                  id={"shareStatisticsInfo"}
                />
            </div>

            {#if data?.user?.tier === 'Pro'}
            {#if isLoaded}
    
            {#if Object?.keys(rawData)?.length !== 0}

                {#if rawData?.historicalShares?.length !== 0}
                <div class="mt-2 pb-4 bg-[#09090B]">
                        
                    <div class="w-full flex flex-col items-start">
                        <div class="text-white text-sm sm:text-[1rem] mt-1 sm:mt-3 mb-1 w-full">
                            {$displayCompanyName}'s' has <span class="font-semibold">{abbreviateNumber(rawData?.latestOutstandingShares)}</span> shares outstanding with <span class="font-semibold">{abbreviateNumber(rawData?.latestFloatShares)}</span> of those shares currently floating.
                        </div>
                    </div>
                
                    
                    <Lazy height={300} fadeOption={{delay: 100, duration: 500}} keep={true}>
                        <div class="app w-full h-[300px] mt-6">
                            <Chart options={optionsData} class="chart" />
                        </div>
                    </Lazy>
                    
                    
                    <div class="flex flex-row items-center justify-between mx-auto mt-8 w-full sm:w-11/12">
                        <div class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
                        <div class="h-full transform -translate-x-1/2 " aria-hidden="true"></div>
                        <div class="w-3 h-3 bg-[#5470C6] border-4 box-content border-[#27272A] rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                        <span class="mt-2 sm:mt-0 text-white text-center sm:text-start text-sm sm:font-semibold inline-block">
                            Floating Shares
                        </span>
                    </div>
                        <div class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
                            <div class="h-full transform -translate-x-1/2 " aria-hidden="true"></div>
                            <div class="w-3 h-3 bg-[#C12F23] border-4 box-content border-[#27272A] rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                            <span class="mt-2 sm:mt-0 text-white text-sm sm:font-semibold inline-block">
                            Outstanding Shares
                            </span>
                        </div>
                
                    </div>
                </div>
                {:else}
                <div class="mt-5 text-gray-100 text-sm sm:text-[1rem] sm:rounded-lg h-auto border border-slate-800 p-4">
                    <svg class="w-5 h-5 inline-block mr-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#a474f6" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
                        Historical Shares are not available yet for {$displayCompanyName}
                </div>
                {/if}

            {#if rawData?.sharesShort !== 0}
            <h2 class="mt-10 mr-1 flex flex-row items-center text-white text-xl sm:text-2xl font-bold mb-3">
              Short Selling Information
            </h2>
            <span class="text-white">
              The latest short interest is <span class="font-semibold"> {abbreviateNumber(rawData?.sharesShort)}</span>, so <span class="font-semibold">{rawData?.shortOutStandingPercent}%</span> of the outstanding shares have been sold short.
            </span>

            <div class="flex justify-start items-center w-full m-auto mt-6 ">
              <table class="w-full" data-test="statistics-table">
                <tbody>
                    <tr class="border-y border-gray-800 odd:bg-[#27272A]">
                        <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                            <span>Short Interest</span>
                        </td>
                        <td class="text-sm sm:text-[1rem] px-[5px] py-1.5 text-right font-semibold xs:px-2.5 xs:py-2">
                            {abbreviateNumber(rawData?.sharesShort)}
                        </td>
                    </tr>
                    <tr class="border-y border-gray-800 odd:bg-[#27272A]">
                        <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                            <span>Short Previous Month</span>
                        </td>
                        <td class="text-sm sm:text-[1rem] px-[5px] py-1.5 text-right font-semibold xs:px-2.5 xs:py-2">
                          {abbreviateNumber(rawData?.sharesShortPriorMonth)}
                        </td>
                    </tr>
                    <tr class="border-y border-gray-800 odd:bg-[#27272A]">
                        <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                            <span>Short % of Shares Out</span>
                        </td>
                        <td class="text-sm sm:text-[1rem] px-[5px] py-1.5 text-right font-semibold xs:px-2.5 xs:py-2">
                            {rawData?.shortOutStandingPercent}%
                        </td>
                    </tr>
                    <tr class="border-y border-gray-800 odd:bg-[#27272A]">
                        <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                            <span>Short % of Float</span>
                        </td>
                        <td class="text-sm sm:text-[1rem] px-[5px] py-1.5 text-right font-semibold xs:px-2.5 xs:py-2">
                          {rawData?.shortFloatPercent}%
                        </td>
                    </tr>
                    <tr class="border-y border-gray-800 odd:bg-[#27272A]">
                        <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                            <span>Short Ratio (days to cover)</span>
                        </td>
                        <td class="text-sm sm:text-[1rem] px-[5px] py-1.5 text-right font-semibold xs:px-2.5 xs:py-2">
                            {rawData?.shortRatio}
                        </td>
                    </tr>
                </tbody>
            </table>
            </div>
            {/if}

            
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
        height: 230px;
    }
    }

    .chart {
    width: 100%;
    }
    
</style>
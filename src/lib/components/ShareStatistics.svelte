
<script lang ='ts'>
    import { displayCompanyName, stockTicker, screenWidth, userRegion, getCache, setCache} from '$lib/store';
    import InfoModal from '$lib/components/InfoModal.svelte';
    import { Chart } from 'svelte-echarts'
    import { abbreviateNumber } from "$lib/utils";

    import Lazy from 'svelte-lazy';
    let isLoaded = false;
    const usRegion = ['cle1','iad1','pdx1','sfo1'];

    let apiURL;

    userRegion.subscribe(value => {

        if (usRegion.includes(value)) {
        apiURL = import.meta.env.VITE_USEAST_API_URL;
        } else {
        apiURL = import.meta.env.VITE_EU_API_URL;
        }
    });


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
                value = Math.max(value, 0);
                return '$'+(value / denominator)?.toFixed(1) + unit; // Format value in millions
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
      const response = await fetch(apiURL + '/share-statistics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      });

      rawData = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getShareStatistics'
      setCache(ticker, rawData, 'getShareStatistics');
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

            {#if isLoaded}
    
            {#if Object?.keys(rawData)?.length !== 0}
            <div class="p-3 sm:p-0 mt-2 pb-8 sm:pb-2 rounded-lg bg-[#202020] sm:bg-[#0F0F0F]">
                    
                <div class="w-full flex flex-col items-start">
                    <div class="text-white text-sm sm:text-[1rem] mt-1 sm:mt-3 mb-1 w-full">
                        {$displayCompanyName}'s' has <span class="font-semibold">{abbreviateNumber(rawData?.latestOutstandingShares)}</span> shares outstanding with <span class="font-semibold">{abbreviateNumber(rawData?.latestFloatShares)}</span> of those shares currently floating.
                    </div>
                </div>
            

                <Lazy height={300} fadeOption={{delay: 100, duration: 500}} keep={true}>
                    <div class="app w-full h-[300px] ">
                        <Chart options={optionsData} class="chart" />
                    </div>
                </Lazy>
                
                <div class="flex flex-row items-center justify-between mx-auto mt-8 w-full sm:w-11/12">
                    <div class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
                    <div class="h-full transform -translate-x-1/2 " aria-hidden="true"></div>
                    <div class="w-3 h-3 bg-[#5470C6] border-4 box-content border-[#202020] rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                    <span class="mt-2 sm:mt-0 text-white text-center sm:text-start text-sm sm:font-semibold inline-block">
                        Floating Shares
                    </span>
                </div>
                    <div class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
                        <div class="h-full transform -translate-x-1/2 " aria-hidden="true"></div>
                        <div class="w-3 h-3 bg-[#C12F23] border-4 box-content border-[#202020] rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                        <span class="mt-2 sm:mt-0 text-white text-sm sm:font-semibold inline-block">
                        Outstanding Shares
                        </span>
                    </div>
            
                </div>
            </div>

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
                    <tr class="border-y border-gray-800 odd:bg-[#202020]">
                        <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                            <span>Short Interest</span>
                        </td>
                        <td class="px-[5px] py-1.5 text-right font-semibold xs:px-2.5 xs:py-2">
                            {abbreviateNumber(rawData?.sharesShort)}
                        </td>
                    </tr>
                    <tr class="border-y border-gray-800 odd:bg-[#202020]">
                        <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                            <span>Short Previous Month</span>
                        </td>
                        <td class="px-[5px] py-1.5 text-right font-semibold xs:px-2.5 xs:py-2">
                          {abbreviateNumber(rawData?.sharesShortPriorMonth)}
                        </td>
                    </tr>
                    <tr class="border-y border-gray-800 odd:bg-[#202020]">
                        <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                            <span>Short % of Shares Out</span>
                        </td>
                        <td class="px-[5px] py-1.5 text-right font-semibold xs:px-2.5 xs:py-2">
                            {rawData?.shortOutStandingPercent}%
                        </td>
                    </tr>
                    <tr class="border-y border-gray-800 odd:bg-[#202020]">
                        <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                            <span>Short % of Float</span>
                        </td>
                        <td class="px-[5px] py-1.5 text-right font-semibold xs:px-2.5 xs:py-2">
                          {rawData?.shortFloatPercent}%
                        </td>
                    </tr>
                    <tr class="border-y border-gray-800 odd:bg-[#202020]">
                        <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                            <span>Short Ratio (days to cover)</span>
                        </td>
                        <td class="px-[5px] py-1.5 text-right font-semibold xs:px-2.5 xs:py-2">
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
                <label class="bg-[#202020] rounded-xl h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span class="loading loading-spinner loading-md"></span>
                </label>
                </div>
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
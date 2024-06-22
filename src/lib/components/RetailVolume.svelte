
<script lang ='ts'>
    import { retailVolumeComponent,displayCompanyName, stockTicker, assetType, etfTicker, screenWidth, userRegion, getCache, setCache} from '$lib/store';
    import InfoModal from '$lib/components/InfoModal.svelte';
    import { Chart } from 'svelte-echarts'
    import { abbreviateNumber } from "$lib/utils";

    import Lazy from 'svelte-lazy';
    export let data;

    let isLoaded = false;
    const usRegion = ['cle1','iad1','pdx1','sfo1'];

    let historyData = [];
    let apiURL;

    userRegion.subscribe(value => {

        if (usRegion.includes(value)) {
        apiURL = import.meta.env.VITE_USEAST_API_URL;
        } else {
        apiURL = import.meta.env.VITE_EU_API_URL;
        }
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let rawData = [];
    let optionsData;
    let avgVolume;
    let avgSentiment;

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
    let tradingList = [];
    let sentimentList = [];
    // Iterate over the data and extract required information
    historyData?.forEach(item => {

    dates?.push(item?.date);
    tradingList?.push(item?.traded);
    sentimentList?.push(item?.sentiment)

    });

    // Compute the average of item?.traded
    const totalTraded = tradingList?.reduce((acc, traded) => acc + traded, 0);
    avgVolume = totalTraded / tradingList?.length;

    const totalSentiment = sentimentList?.reduce((acc, sentiment) => acc + sentiment, 0);
    avgSentiment = totalSentiment / tradingList?.length > 1 ? 'Bullish' : 'Bearish';

    const {unit, denominator } = normalizer(Math.max(...tradingList) ?? 0)


    const option = {
    silent: true,
    animation: $screenWidth < 640 ? false: true,
    grid: {
        left: '0%',
        right: '0%',
        bottom: '0%',
        top: '5%',
        containLabel: true
    },
    xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLabel: {
        formatter: function (value) {
            // Assuming dates are in the format 'yyyy-mm-dd'
            // Extract the month and day from the date string and convert the month to its abbreviated name
            const dateParts = value.split('-');
            const day = dateParts[2].substring(0); // Extracting the last two digits of the year
            const monthIndex = parseInt(dateParts[1]) - 1; // Months are zero-indexed in JavaScript Date objects
            return `${day} ${monthNames[monthIndex]}`;
        }
        }
    },
    yAxis: [
    { 
      name: 'Volume',
      position: 'left',
        type: 'value',
        splitLine: {
            show: false, // Disable x-axis grid lines
        },
        axisLabel: {
            color: '#6E7079', // Change label color to white
            formatter: function (value, index) {
                // Display every second tick
                if (index % 2 === 0) {
                    value = Math.max(value, 0);
                    return '$' + (value / denominator)?.toFixed(1) + unit; // Format value in millions
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
      name: 'Sentiment',
      position: 'right',
      axisLabel: {
          formatter: function (value, index) {
            if (index % 2 === 0) {
              return value.toFixed(2); // Format the sentiment value
            } else {
                  return ''; // Hide this tick
              }
          }
      }
    }
    ],
    series: [
        {
            data: tradingList,
            type: 'line',
            itemStyle: {
                color: '#fff' // Change bar color to white
            },
            showSymbol: false
        },
        {
            name: 'Sentiment',
            data: sentimentList,
            type: 'bar',
            yAxisIndex: 1,
            itemStyle: {
            color: (params) => {
                // Set color based on positive or negative value
                return params.data >= 0 ? '#10DB06' : '#FF2F1F';
            },
            },
            
        },
    ]
    };


return option;
}

const getRetailVolume = async (ticker) => {
    // Get cached data for the specific tickerID
    const cachedData = getCache(ticker, 'getRetailVolume');
    if (cachedData) {
      rawData = cachedData;
      historyData = rawData?.history;
    } else {

      const postData = {'ticker': ticker};
      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/retail-volume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      });

      rawData = await response.json();
      historyData = rawData?.history;
      // Cache the data for this specific tickerID with a specific name 'getRetailVolume'
      setCache(ticker, rawData, 'getRetailVolume');
    }
    if(Object?.keys(rawData)?.length !== 0) {
      $retailVolumeComponent = true;
    } else {
      $retailVolumeComponent = false;
    }
};


$: {
  if($assetType === 'stock' ? $stockTicker :$etfTicker && typeof window !== 'undefined') {
    isLoaded=false;
    const ticker = $assetType === 'stock' ? $stockTicker :$etfTicker
    const asyncFunctions = [
      getRetailVolume(ticker)
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
                <label for="retailTraderTrackerInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold">
                    Retail Trader Activity
                </label>
                <InfoModal
                  title={"Retail Trader Activity"}
                  content={"Gain insights into Retail Trader activity with the following visualization: The green bar illustrates the daily volume trend, signifying a bullish sentiment if it ranges from 0 to 100, or bearish if it spans from -100 to just below 0. The white line depicts the daily trading volume of retail investors."}
                  id={"retailTraderTrackerInfo"}
                />
            </div>

            {#if data?.user?.tier === 'Pro'}
            {#if isLoaded}
    
            {#if Object?.keys(rawData)?.length !== 0}

            <div class="w-full flex flex-col items-start">
              <div class="text-white text-sm sm:text-[1rem] mt-2 mb-2 w-full">
                  In the past six months, the {$displayCompanyName} had an average retail investor volume of <span class="font-semibold">{avgVolume > 100e3 ? abbreviateNumber(avgVolume,true) : '< $100K'}</span>, with a prevailing
                  {#if avgSentiment === 'Bullish' }
                  <span class="text-[#10DB06]">
                    <svg class="w-6 h-6 sm:w-7 sm:h-7 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="#10db06" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"><path d="m3 17l6-6l4 4l8-8"/><path d="M17 7h4v4"/></g></svg>
                    {avgSentiment}
                    </span>

                    {:else if avgSentiment === 'Bearish' }
                    <span class="text-[#E57C34]">
                        <svg class="w-6 h-6 sm:w-7 sm:h-7 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#ff2f1f" d="M244 136v64a12 12 0 0 1-12 12h-64a12 12 0 0 1 0-24h35l-67-67l-31.51 31.52a12 12 0 0 1-17 0l-72-72a12 12 0 0 1 17-17L96 127l31.51-31.52a12 12 0 0 1 17 0L220 171v-35a12 12 0 0 1 24 0Z"/></svg>
                    {avgSentiment}
                    </span>
                    {:else}
                    <span class="text-[#FF2F1F]">
                        <svg class="w-6 h-6 sm:w-7 sm:h-7 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#e57c34" d="m22 12l-4-4v3H3v2h15v3l4-4Z"/></svg>
                        Neutral
                    </span>
                    {/if} trend.
              </div>
            </div>

            <div class="pb-8 sm:pb-2 rounded-lg bg-[#0F0F0F]">
                    
              
                <Lazy height={300} fadeOption={{delay: 100, duration: 500}} keep={true}>
                    <div class="app w-full h-[300px] mt-5">
                        <Chart options={optionsData} class="chart" />
                    </div>
                </Lazy>
            
            </div>

            <div class="text-white mt-6">
              The line chart shows dollar volume, while the bar chart indicates sentiment from -100 to 100, with negative values for more selling and positive values for more buying.
            </div>

            <h2 class="mt-10 mr-1 flex flex-row items-center text-white text-xl sm:text-2xl font-bold mb-3">
                Latest Information
            </h2>
              <span class="text-white">
                On {new Date(rawData?.lastDate)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}, retail traders accounted for <span class="font-semibold">{rawData?.retailStrength > 0.01 ? rawData?.retailStrength : '< 0.01'}%</span> of the trading volume.
              </span>
              <div class="flex justify-start items-center w-full m-auto mt-6 ">
                <table class="w-full" data-test="statistics-table">
                  <tbody>
                      <tr class="border-y border-gray-800 odd:bg-[#202020]">
                          <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                              <span>Date</span>
                          </td>
                          <td class="px-[5px] py-1.5 text-right font-medium xs:px-2.5 xs:py-2">
                            {new Date(rawData?.lastDate)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                          </td>
                      </tr>
                      <tr class="border-y border-gray-800 odd:bg-[#202020]">
                          <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                              <span>Volume</span>
                          </td>
                          <td class="px-[5px] py-1.5 text-right font-medium xs:px-2.5 xs:py-2">
                            {rawData?.lastTrade > 100e3 ? abbreviateNumber(rawData?.lastTrade,true) : '< $100K'}
                          </td>
                      </tr>
                      <tr class="border-y border-gray-800 odd:bg-[#202020]">
                          <td class="px-[5px] py-1.5 xs:px-2.5 xs:py-2">
                              <span>Retail Sentiment</span>
                          </td>
                          <td class="px-[5px] py-1.5 text-right font-medium xs:px-2.5 xs:py-2 { rawData?.lastSentiment >= 0 ? 'text-[#10DB06]' : 'text-[#E57C34]'} ">
                              {rawData?.lastSentiment >=0 ? rawData?.lastSentiment+' '+'(Bullish)' : rawData?.lastSentiment +' '+'(Bearish)'}
                          </td>
                      </tr>
                  </tbody>
              </table>
              </div>
            
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

            {:else}
            <div class="shadow-lg shadow-bg-[#000] bg-[#202020] sm:bg-opacity-[0.5] text-sm sm:text-[1rem] rounded-md w-full p-4 min-h-24 mt-4 text-white m-auto flex justify-center items-center text-center font-semibold">
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
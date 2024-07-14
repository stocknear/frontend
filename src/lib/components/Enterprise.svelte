
<script lang ='ts'>
    import { enterpriseComponent, displayCompanyName, stockTicker, screenWidth, userRegion, getCache, setCache} from '$lib/store';
    import InfoModal from '$lib/components/InfoModal.svelte';
    import { Chart } from 'svelte-echarts'

    import Lazy from 'svelte-lazy';

    export let data;
    
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


    let rawData = [];
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
    let enterpriseValue = [];
    let numberOfShares = [];
    let marketCapitalization = [];
    let addTotalDebt = [];
    let cashEquivalent = [];
    // Iterate over the data and extract required information
    rawData?.forEach(item => {
    // Extract year and convert it to fiscal year format
    const fiscalYear = item?.date;
    dates?.push(fiscalYear);

    // Extract totalValue
    enterpriseValue?.push(item?.enterpriseValue);
    marketCapitalization?.push(item?.marketCapitalization);
    addTotalDebt?.push(item?.addTotalDebt);
    cashEquivalent?.push(item?.minusCashAndCashEquivalents)

    });

    const {unit, denominator } = normalizer(Math.max(...enterpriseValue) ?? 0)


    const option = {
    silent: true,
    animation: $screenWidth < 640 ? false: true,
    grid: {
        left: $screenWidth < 640 ? '0%' : '2%',
        right: $screenWidth < 640 ? '2%' : '2%',
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
                //value = Math.max(value, 0);
                return '$'+(value / denominator)?.toFixed(1) + unit; // Format value in millions
                },
            },
        },
        
        ],
    series: [
        {
            data: cashEquivalent,
            type: 'bar',
            itemStyle: {
                color: '#fff' // Change bar color to white
            }
        },
        {
            data: addTotalDebt,
            type: 'bar',
            itemStyle: {
                color: '#FF2F1F' // Change bar color to white
            }
        },
        {
            data: marketCapitalization,
            type: 'bar',
            itemStyle: {
                color: '#5470C6' // Change bar color to white
            }
        },
        {
            data: enterpriseValue,
            type: 'bar',
            itemStyle: {
                    color: '#F8901E' // Change bar color to white
                }
        },
    ]
    };


return option;
}

const getEnterPriseValues = async (ticker) => {
    // Get cached data for the specific tickerID
    const cachedData = getCache(ticker, 'getEnterPriseValues');
    if (cachedData) {
      rawData = cachedData;
    } else {

      const postData = {'ticker': ticker};
      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/enterprise-values', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      });

      rawData = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getEnterPriseValues'
      setCache(ticker, rawData, 'getEnterPriseValues');
    }

    if(rawData?.length !== 0) {
        $enterpriseComponent = true;
    } else {
        $enterpriseComponent = false;
    }
};


$: {
  if($stockTicker && typeof window !== 'undefined') {
    isLoaded=false;
    const asyncFunctions = [
      getEnterPriseValues($stockTicker)
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
    
    
    
    <section class="overflow-hidden text-white h-full pb-8 sm:pb-2">
        <main class="overflow-hidden ">
                        
            <div class="flex flex-row items-center">
                <label for="enterpriseValueInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold">
                    Enterprise Value
                </label>
                <InfoModal
                  title={"Enterprise Value"}
                  content={"Enterprise value (EV) is a comprehensive measure of a company's total value in the stock market, considering market capitalization, debt, cash, and minority interests. It helps in M&A analysis, comparative analysis, valuation metrics, and capital structure assessment, aiding investors, analysts, and companies in financial decision-making."}
                  id={"enterpriseValueInfo"}
                />
            </div>
            
            {#if data?.user?.tier === 'Pro'}
            {#if isLoaded}
            {#if rawData?.length !== 0}
            <div class="mt-2 pb-4">
                    
                <div class="w-full flex flex-col items-start">
                    <div class="text-white text-sm sm:text-[1rem] mt-1 sm:mt-3 mb-1 w-full">
                        {$displayCompanyName}'s' enterprise value provides a comprehensive snapshot of its total worth, crucial for assessing its financial health and making informed investment decisions.
                    </div>
                </div>
            
                <a href="{'/stocks/'+$stockTicker+'/stats/income'}" class="text-blue-400 hover:text-white flex justify-end mt-3 text-sm sm:text-[1rem]">
                    Full report
                </a>

                <Lazy height={300} fadeOption={{delay: 100, duration: 500}} keep={true}>
                    <div class="app w-full h-[300px] mt-5">
                        <Chart options={optionsData} class="chart" />
                    </div>
                </Lazy>
                
                <div class="flex flex-row items-center justify-between mx-auto mt-5 w-full sm:w-11/12">
                    <div class="mt-3.5 sm:mt-0 flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
                    <div class="h-full transform -translate-x-1/2 " aria-hidden="true"></div>
                    <div class="w-3 h-3 bg-[#F8901E] border-4 box-content border-[#27272A] rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                    <span class="mt-2 sm:mt-0 text-white text-center sm:text-start text-xs sm:text-md inline-block">
                        Enterprise Value
                    </span>
                </div>
                    <div class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
                        <div class="h-full transform -translate-x-1/2 " aria-hidden="true"></div>
                        <div class="w-3 h-3 bg-[#5470C6] border-4 box-content border-[#27272A] rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                        <span class="mt-2 sm:mt-0 text-white text-xs sm:text-md sm:font-medium inline-block">
                        Mkt Cap
                        </span>
                    </div>
                    <div class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
                    <div class="h-full transform -translate-x-1/2 " aria-hidden="true"></div>
                    <div class="w-3 h-3 bg-[#FF2F1F] border-4 box-content border-[#27272A] rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                    <span class="mt-2 sm:mt-0 text-white text-xs sm:text-md inline-block">
                        Debt
                    </span>
                </div>
                <div class="mt-3.5 sm:mt-0 flex flex-col sm:flex-row items-center sm:items-center ml-3 sm:ml-0 w-1/2 justify-center">
                    <div class="h-full transform -translate-x-1/2 " aria-hidden="true"></div>
                    <div class="w-3 h-3 bg-[#fff] border-4 box-content border-[#27272A] rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                    <span class="mt-2 sm:mt-0 text-white text-center sm:text-start text-xs sm:text-md inline-block">
                        Cash Equivalents
                    </span>
                </div>
            
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
        height: 230px;
    }
    }

    .chart {
    width: 100%;
    }
    
</style>
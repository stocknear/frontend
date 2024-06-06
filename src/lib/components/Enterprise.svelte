
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
    
            {#if rawData?.length !== 0}
            <div class="p-3 sm:p-0 mt-2 pb-8 sm:pb-2 rounded-lg bg-[#202020] sm:bg-[#0F0F0F]">
                    
                <div class="w-full flex flex-col items-start">
                    <div class="text-white text-sm sm:text-[1rem] mt-1 sm:mt-3 mb-1 w-full">
                        {$displayCompanyName}'s' enterprise value provides a comprehensive snapshot of its total worth, crucial for assessing its financial health and making informed investment decisions.
                    </div>
                </div>
            
                <a href="{'/stocks/'+$stockTicker+'/stats/income'}" class="text-blue-400 hover:text-white flex justify-end mt-3 text-sm sm:text-[1rem]">
                    Full report
                </a>

                <Lazy height={300} fadeOption={{delay: 100, duration: 500}} keep={true}>
                    <div class="app w-full h-[300px] ">
                        <Chart options={optionsData} class="chart" />
                    </div>
                </Lazy>
                
                <div class="flex flex-row items-center justify-between mx-auto mt-5 w-full sm:w-11/12">
                    <div class="mt-3.5 sm:mt-0 flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
                    <div class="h-full bg-gray-800 transform -translate-x-1/2 " aria-hidden="true"></div>
                    <div class="w-3 h-3 bg-[#F8901E] border-4 box-content border-gray-900 rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                    <span class="mt-2 sm:mt-0 text-white text-center sm:text-start text-xs sm:text-md inline-block">
                        Enterprise Value
                    </span>
                </div>
                    <div class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
                        <div class="h-full bg-gray-800 transform -translate-x-1/2 " aria-hidden="true"></div>
                        <div class="w-3 h-3 bg-[#5470C6] border-4 box-content border-gray-900 rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                        <span class="mt-2 sm:mt-0 text-white text-xs sm:text-md sm:font-medium inline-block">
                        Mkt Cap
                        </span>
                    </div>
                    <div class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
                    <div class="h-full bg-gray-800 transform -translate-x-1/2 " aria-hidden="true"></div>
                    <div class="w-3 h-3 bg-[#FF2F1F] border-4 box-content border-gray-900 rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                    <span class="mt-2 sm:mt-0 text-white text-xs sm:text-md inline-block">
                        Debt
                    </span>
                </div>
                <div class="mt-3.5 sm:mt-0 flex flex-col sm:flex-row items-center sm:items-center ml-3 sm:ml-0 w-1/2 justify-center">
                    <div class="h-full bg-gray-800 transform -translate-x-1/2 " aria-hidden="true"></div>
                    <div class="w-3 h-3 bg-[#fff] border-4 box-content border-gray-900 rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                    <span class="mt-2 sm:mt-0 text-white text-center sm:text-start text-xs sm:text-md inline-block">
                        Cash Equivalents
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
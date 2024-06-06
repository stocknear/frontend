
<script lang ='ts'>
  import { displayCompanyName, stockTicker, etfTicker, cryptoTicker, assetType, screenWidth, userRegion, getCache, setCache} from '$lib/store';
  import InfoModal from '$lib/components/InfoModal.svelte';
  import { Chart } from 'svelte-echarts'

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

    import Lazy from 'svelte-lazy';


    let priceAnalysisDict = {};
    export let data;

    const modalContent = `
    Our AI model, employing a Bayesian approach, predicts future prices by breaking down trends, seasonality, and holiday effects. It integrates uncertainty to offer forecasts with intervals.<br><br>
    <span class="font-semibold underline"><span class="italic">R</span><sup>2</sup> Score</span>: How well the regression model fits the data. A high score (close to 100%) is good, indicating a strong fit, while a low score (close to 0%) is bad, suggesting poor fit.
    <br><br>
    <span class="font-semibold underline">Mean Absolute Percentage Error (MAPE)</span>: Measures the average percentage difference between predicted and actual values. A lower MAPE indicates better accuracy, while a higher MAPE suggests less accurate predictions.
    `;


    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];


    //let showMore = false;
    //let oneMonthResult;
    let r2Score;
    let mape;
    let priceSentiment = 'n/a';
    let displayData = 'threeMonth';
    let lastPrice = 'n/a';
    let oneYearPricePrediction = 'n/a';
    let optionsData;
    

function getPlotOptions() {
    const predictionDate = priceAnalysisDict?.predictionDate;
    const upperBand = priceAnalysisDict?.upperBand;
    const lowerBand = priceAnalysisDict?.lowerBand?.map(value => value < 0 ? 0 : value);
    const historicalPrice = priceAnalysisDict?.historicalPrice;
    //const meanPredictionPrice = priceAnalysisDict?.meanResult;

    const option = {
  silent: true,
  grid: {
    left: $screenWidth < 640 ? '0%' : '2%',
    right: $screenWidth < 640 ? '5%' : '2%',
    bottom: $screenWidth < 640 ? '0%' : '5%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: predictionDate,
    axisLabel: {
      formatter: function (value) {
        // Assuming dates are in the format 'yyyy-mm-dd'
        // Extract the month and day from the date string and convert the month to its abbreviated name
        const dateParts = value.split('-');
        const year = dateParts[0].substring(2); // Extracting the last two digits of the year
        const monthIndex = parseInt(dateParts[1]) - 1; // Months are zero-indexed in JavaScript Date objects
        return `${monthNames[monthIndex]} '${year}`;
      }
    }
  },
  yAxis: {
    type: 'value',
    splitLine: {
      show: false,
    }
  },
  series: [
    {
      data: upperBand,
      showSymbol: false,
      smooth: true,
      type: 'line',
      areaStyle: {
        color: 'rgb(60, 116, 212,0.4)',
      },
      lineStyle: {
        color: 'rgb(60, 116, 212)' // set line color to white
      }
    },
    {
      data: lowerBand,
      showSymbol: false,
      smooth: true,
      type: 'line',
      areaStyle: {
        color: '#0F0F0F', // color of the background
        opacity: 1
      },
      lineStyle: {
        color: 'rgb(60, 116, 212)'
      }
    },
    /*
    {
      data: meanPredictionPrice,
      showSymbol: false,
      smooth: true,
      type: 'line',
      itemStyle: {
            color: "rgb(60, 116, 212,0.3)"
        }
    },
    */
    {
      data: historicalPrice,
      showSymbol: false,
      smooth: true,
      type: 'line',
      itemStyle: {
            color: "#C40377"
        }
    }
  ]
};


return option;
}


const getPriceAnalysis = async (ticker) => {
    // Get cached data for the specific tickerID
    const cachedData = getCache(ticker, 'getPriceAnalysis');
    if (cachedData) {
      priceAnalysisDict = cachedData;
    } else {

      const postData = {'ticker': ticker};
      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/price-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      });

      priceAnalysisDict = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getPriceAnalysis'
      setCache(ticker, priceAnalysisDict, 'getPriceAnalysis');
    }
};



$: {
  if(($assetType === 'stock' ? $stockTicker : $assetType === 'etf' ? $etfTicker : $cryptoTicker) && typeof window !== 'undefined') {
    isLoaded = false;
    lastPrice = data?.getStockQuote?.price ?? "n/a";
    const ticker = $assetType === 'stock' ? $stockTicker : $assetType === 'etf' ? $etfTicker : $cryptoTicker;

    const asyncFunctions = [
      getPriceAnalysis(ticker)
      ];
      Promise.all(asyncFunctions)
          .then((results) => {
            oneYearPricePrediction = priceAnalysisDict?.meanResult?.slice(-1)?.at(0);          
            mape = priceAnalysisDict?.mape;
            r2Score = priceAnalysisDict?.r2Score;
            priceSentiment = lastPrice < oneYearPricePrediction ? 'Bullish' : 'Bearish';
            optionsData = getPlotOptions()
          })
          .catch((error) => {
            console.error('An error occurred:', error);
          });
    isLoaded = true;
  }
}

</script>
    
    
    
    <section class="overflow-hidden text-white h-full pb-8 sm:pb-2 ">
        <main class="overflow-hidden ">
                        
            <div class="flex flex-row items-center">
                <label for="priceAnalysisInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold">
                  AI Price Analysis
                </label>
                <InfoModal
                  title={"Price Analysis"}
                  content={modalContent}
                  id={"priceAnalysisInfo"}
                />
            </div>
    
           
            {#if isLoaded}

            {#if Object?.keys(priceAnalysisDict)?.length !== 0}
            <div class="w-full flex flex-col items-start">
                <div class="text-white text-sm sm:text-[1rem] mt-1 sm:mt-3 mb-1 w-full">
                    Our model predicts future prices by analyzing trends, seasonal variations, and holiday impacts. Here are the stats of the model for {$displayCompanyName} to ensure transparency and reliability.
                </div>
            </div>

            <div class="w-full mt-5 mb-5 flex justify-start items-center">
                <div class="w-full grid grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-3 ">
                  <!--Start Flow Sentiment-->  
                  <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 bg-[#202020] shadow-lg rounded-2xl h-20">
                      <div class="flex flex-col items-start">
                          <span class="font-medium text-gray-200 text-sm">Price Sentiment</span>
                          <span class="text-start text-[1rem] font-medium {priceSentiment === 'Bullish' ? 'text-[#10DB06]' : 'text-[#FC2120]'}">{priceSentiment}</span>
                      </div>
                  </div>
                  
                  <!--End Flow Sentiment-->
                   <!--Start Put/Call-->  
                   <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 bg-[#202020] shadow-lg rounded-2xl h-20">
                    <div class="flex flex-col items-start">
                        <span class="font-medium text-gray-200 text-sm"><span class="italic">R</span><sup>2</sup> Score</span>
                        <span class="text-start text-sm sm:text-[1rem] font-medium text-white">
                          {r2Score >=65 ? 'Good' : r2Score >= 50 ? 'Moderate' : 'Bad'}
                        </span>
                    </div>
                    <!-- Circular Progress -->
                      <div class="relative size-14 ml-auto">
                        <svg class="size-full w-14 h-14" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                          <!-- Background Circle -->
                          <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#3E3E3E]" stroke-width="3"></circle>
                          <!-- Progress Circle inside a group with rotation -->
                          <g class="origin-center -rotate-90 transform">
                            <circle cx="18" cy="18" r="16" fill="none" class="stroke-current {r2Score >= 65 ? 'text-[#00FC50]' : r2Score >= 50 ? 'text-[#F8901E]' : 'text-[#FF2F1F]'}" stroke-width="3" stroke-dasharray="100" stroke-dashoffset={100-(r2Score)}></circle>
                          </g>
                        </svg>
                        <!-- Percentage Text -->
                        <div class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
                          <span class="text-center text-white text-sm">{r2Score}%</span>
                        </div>
                      </div>
                    <!-- End Circular Progress -->
    
                    </div>
                   <!--End Put/Call-->

                   <!--Start mape-->  
                   <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 bg-[#202020] shadow-lg rounded-2xl h-20">
                    <div class="flex flex-col items-start">
                        <span class="font-medium text-gray-200 text-sm">MAPE</span>
                        <span class="text-start text-sm sm:text-[1rem] font-medium text-white">
                          {mape <=15 ? 'Good' : mape <= 35 ? 'Moderate' : 'Bad'}
                        </span>
                    </div>
                    <!-- Circular Progress -->
                      <div class="relative size-14 ml-auto">
                        <svg class="size-full w-14 h-14" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                          <!-- Background Circle -->
                          <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#3E3E3E]" stroke-width="3"></circle>
                          <!-- Progress Circle inside a group with rotation -->
                          <g class="origin-center -rotate-90 transform">
                            <circle cx="18" cy="18" r="16" fill="none" class="stroke-current {mape <= 15 ? 'text-[#00FC50]' : mape <= 35 ? 'text-[#F8901E]' : 'text-[#FF2F1F]'}" stroke-width="3" stroke-dasharray="100" stroke-dashoffset={(100-mape) > 0 ? 100-mape : 1}></circle>
                          </g>
                        </svg>
                        <!-- Percentage Text -->
                        <div class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
                          <span class="text-center text-white text-sm">{mape}%</span>
                        </div>
                      </div>
                    <!-- End Circular Progress -->
    
                    </div>
                   <!--End mape-->

            </div>

            </div>


            

            <Lazy height={300} fadeOption={{delay: 100, duration: 500}} keep={true}>
                <div class="app w-full h-[300px] ">
                    <Chart options={optionsData} class="chart" />
                </div>
            </Lazy>

            <div class="text-white text-sm sm:text-[1rem] mt-4 sm:mt-7 ml-1">
                Over the next 12 months, the model predicts a
                <span class="font-semibold {priceSentiment === 'Bullish' ? 'text-[#10DB06]' : 'text-[#FC2120]'}">{priceSentiment}</span>
                trend, suggesting that the future price is expected to {priceSentiment === 'Bullish' ? 'surpass' : 'to be less than'} the previous price of
                <span class="font-semibold">${lastPrice?.toFixed(2) ?? 'n/a'}</span>, with a mean value of <span class="font-semibold">${oneYearPricePrediction}</span>.
              </div>
            
            
              
            {:else}
            <h2 class="mt-10 mb-5 flex justify-center items-center text-3xl font-bold text-slate-700 m-auto">
                No data available
                <svg class="w-10 sm:w-12 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#334155" d="M18.68 12.32a4.49 4.49 0 0 0-6.36.01a4.49 4.49 0 0 0 0 6.36a4.508 4.508 0 0 0 5.57.63L21 22.39L22.39 21l-3.09-3.11c1.13-1.77.87-4.09-.62-5.57m-1.41 4.95c-.98.98-2.56.97-3.54 0c-.97-.98-.97-2.56.01-3.54c.97-.97 2.55-.97 3.53 0c.97.98.97 2.56 0 3.54M10.9 20.1a6.527 6.527 0 0 1-1.48-2.32C6.27 17.25 4 15.76 4 14v3c0 2.21 3.58 4 8 4c-.4-.26-.77-.56-1.1-.9M4 9v3c0 1.68 2.07 3.12 5 3.7v-.2c0-.93.2-1.85.58-2.69C6.34 12.3 4 10.79 4 9m8-6C7.58 3 4 4.79 4 7c0 2 3 3.68 6.85 4h.05c1.2-1.26 2.86-2 4.6-2c.91 0 1.81.19 2.64.56A3.215 3.215 0 0 0 20 7c0-2.21-3.58-4-8-4Z"/></svg>
            </h2>
            
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
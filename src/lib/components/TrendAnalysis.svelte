
<script lang ='ts'>
    import { displayCompanyName, trendAnalysisComponent, stockTicker, etfTicker, cryptoTicker, assetType, userRegion, getCache, setCache} from '$lib/store';
    import InfoModal from '$lib/components/InfoModal.svelte';
    //import Chart from '$lib/components/Chart.svelte';
    //import Lazy from 'svelte-lazy';

  let trendList = [];
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

  export let data;

  let deactivateContent = data?.user?.tier === 'Pro' ? false : true;


  //let showMore = false;
  //let oneMonthResult;
  let accuracy;
  let precision;
  let flowSentiment = 'n/a';
  let displayData = 'threeMonth';
  let lastPrice = 'n/a';


function changeStatement(event)
{
  displayData = event.target.value;
}

const getTrendAnalysis = async (ticker) => {
    // Get cached data for the specific tickerID
    const cachedData = getCache(ticker, 'getTrendAnalysis');
    if (cachedData) {
      trendList = cachedData;
    } else {

      const postData = {'ticker': ticker};
      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/trend-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      });

      trendList = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getTrendAnalysis'
      setCache(ticker, trendList, 'getTrendAnalysis');
    }

    if(trendList?.length !== 0) {
    $trendAnalysisComponent = true;
    }
    else {
      $trendAnalysisComponent = false;
    }

};



$: {
  if(($assetType === 'stock' ? $stockTicker : $assetType === 'etf' ? $etfTicker : $cryptoTicker) && typeof window !== 'undefined') {
    isLoaded = false;
    const ticker = $assetType === 'stock' ? $stockTicker : $assetType === 'etf' ? $etfTicker : $cryptoTicker;

    const asyncFunctions = [
      getTrendAnalysis(ticker)
      ];
      Promise.all(asyncFunctions)
          .then((results) => {
            lastPrice = data?.getStockQuote?.price ?? "n/a";
            const sample = trendList?.filter(item => item?.label === displayData)?.at(0);
            flowSentiment = sample?.sentiment;
            accuracy = sample?.accuracy;
            precision = sample?.precision;
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
                <label for="trendAnalysisInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold">
                  AI Trend Analysis
                </label>
                <InfoModal
                  title={"Trend Analysis"}
                  content={`We trained our model using historical data of $${$assetType === 'stock' ? $stockTicker : $assetType === 'etf' ? $etfTicker : $cryptoTicker} and assessed its precision and accuracy with unseen company data to evaluate its performance. The model exhibits varying performance across different time periods.`}
                  id={"trendAnalysisInfo"}
                />
            </div>
            
            {#if isLoaded}
            {#if trendList?.length !== 0}
            <div class="w-full flex flex-col items-start">
                <div class="text-white text-sm sm:text-[1rem] mt-1 sm:mt-3 mb-1 w-full">
                  Our model uses technical indicators to predict the next trend. Here are the stats of the model for {$displayCompanyName} to ensure transparency and reliability.
                </div>
            </div>
           

            <div class="w-full mt-5 mb-5 flex justify-start items-center">
                <div class="w-full grid grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-3 ">
                  <!--Start Flow Sentiment-->  
                  <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 bg-[#202020] shadow-lg rounded-2xl h-20">
                      <div class="flex flex-col items-start">
                          <span class="font-medium text-gray-200 text-sm">Trend Sentiment</span>
                          <span class="text-start text-[1rem] font-medium {flowSentiment === 'Bullish' ? 'text-[#10DB06]' : 'text-[#FC2120]'}">{flowSentiment}</span>
                      </div>
                  </div>
                  
                  <!--End Flow Sentiment-->
                   <!--Start Put/Call-->  
                   <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 bg-[#202020] shadow-lg rounded-2xl h-20">
                    <div class="flex flex-col items-start">
                        <span class="font-medium text-gray-200 text-sm ">Accuracy</span>
                        <span class="text-start text-sm sm:text-[1rem] font-medium text-white">
                          {accuracy >=65 ? 'Good' : accuracy >= 50 ? 'Moderate' : 'Bad'}
                        </span>
                    </div>
                    <!-- Circular Progress -->
                      <div class="relative size-14 ml-auto">
                        <svg class="size-full w-14 h-14" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                          <!-- Background Circle -->
                          <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#3E3E3E]" stroke-width="3"></circle>
                          <!-- Progress Circle inside a group with rotation -->
                          <g class="origin-center -rotate-90 transform">
                            <circle cx="18" cy="18" r="16" fill="none" class="stroke-current {accuracy >= 65 ? 'text-[#00FC50]' : accuracy >= 50 ? 'text-[#F8901E]' : 'text-[#FF2F1F]'}" stroke-width="3" stroke-dasharray="100" stroke-dashoffset={100-(accuracy)}></circle>
                          </g>
                        </svg>
                        <!-- Percentage Text -->
                        <div class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
                          <span class="text-center text-white text-sm">{accuracy}%</span>
                        </div>
                      </div>
                    <!-- End Circular Progress -->
    
                    </div>
                   <!--End Put/Call-->

                   <!--Start Precision-->  
                   <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 bg-[#202020] shadow-lg rounded-2xl h-20">
                    <div class="flex flex-col items-start">
                        <span class="font-medium text-gray-200 text-sm ">Precision</span>
                        <span class="text-start text-sm sm:text-[1rem] font-medium text-white">
                          {precision >=65 ? 'Good' : precision >= 50 ? 'Moderate' : 'Bad'}
                        </span>
                    </div>
                    <!-- Circular Progress -->
                      <div class="relative size-14 ml-auto">
                        <svg class="size-full w-14 h-14" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                          <!-- Background Circle -->
                          <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#3E3E3E]" stroke-width="3"></circle>
                          <!-- Progress Circle inside a group with rotation -->
                          <g class="origin-center -rotate-90 transform">
                            <circle cx="18" cy="18" r="16" fill="none" class="stroke-current {precision >= 65 ? 'text-[#00FC50]' : precision >= 50 ? 'text-[#F8901E]' : 'text-[#FF2F1F]'}" stroke-width="3" stroke-dasharray="100" stroke-dashoffset={100-precision}></circle>
                          </g>
                        </svg>
                        <!-- Percentage Text -->
                        <div class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
                          <span class="text-center text-white text-sm">{precision}%</span>
                        </div>
                      </div>
                    <!-- End Circular Progress -->
    
                    </div>
                   <!--End Precision-->

            </div>

            </div>


            <select class="mt-1 sm:mt-3 ml-1 w-36 select select-bordered select-sm p-0 pl-5 overflow-y-auto bg-[#2A303C]" on:change={changeStatement}>
              <option disabled>Choose Time Period</option>
              <option disabled={deactivateContent} value="oneWeek">
                    {!deactivateContent ? 'Predict 1W' : '1W (Pro Only)'} 
              </option>
              <option disabled={deactivateContent} value="oneMonth">
                {!deactivateContent ? 'Predict 1M' : '1M (Pro Only)'} 
              </option>
              <option value="threeMonth" selected>Predict 3M</option>                      
            </select>

          

            <div class="text-white text-sm sm:text-[1rem] mt-4 sm:mt-7 ml-1">
              Over the next {displayData === 'threeMonth' ? '3 months' : displayData === 'oneMonth' ? '1 month' : '1 week'}, the model forecasts a 
              <span class="font-semibold {flowSentiment === 'Bullish' ? 'text-[#10DB06]' : 'text-[#FC2120]'}">{flowSentiment}</span>
              trend, indicating that the future price is expected to {flowSentiment === 'Bullish' ? 'exceed' : 'to be less than'} the previous price of 
              <span class="font-medium">${lastPrice ?? 'n/a'}</span>.
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
    
        </main>
    </section>
    
    
    
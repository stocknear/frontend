
<script lang ='ts'>
  import { fundamentalAnalysisComponent, displayCompanyName, stockTicker, userRegion, getCache, setCache} from '$lib/store';
  import InfoModal from '$lib/components/InfoModal.svelte';

  let fundamentalAnalysisDict = {};
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

const getFundamentalAnalysis = async (ticker) => {
  // Get cached data for the specific tickerID
  const cachedData = getCache(ticker, 'getFundamentalAnalysis');
  if (cachedData) {
    fundamentalAnalysisDict = cachedData;
  } else {

    const postData = {'ticker': ticker};
    // make the POST request to the endpoint
    const response = await fetch(apiURL + '/fundamental-predictor-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
    });

    fundamentalAnalysisDict = await response?.json();

    // Cache the data for this specific tickerID with a specific name 'getFundamentalAnalysis'
    setCache(ticker, fundamentalAnalysisDict, 'getFundamentalAnalysis');
  }
  if(Object?.keys(fundamentalAnalysisDict)?.length !== 0) {
    $fundamentalAnalysisComponent = true;
  }
  else {
    $fundamentalAnalysisComponent = false;
  }
};



$: {
  if($stockTicker && typeof window !== 'undefined') {
  
    isLoaded = false;
    const asyncFunctions = [
      getFundamentalAnalysis($stockTicker)
      ];
      Promise.all(asyncFunctions)
          .then((results) => {
            flowSentiment = fundamentalAnalysisDict?.sentiment;
            accuracy = fundamentalAnalysisDict?.accuracy;
            precision = fundamentalAnalysisDict?.precision;
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
                <label for="fundamentalAnalysisInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold">
                  AI Fundamental Analysis
                </label>
                <InfoModal
                  title={"Fundamental Analysis"}
                  content={`We trained our model using historical fundamental data such as revenue, net income, price to book ratio etc. to predict if the price of the next quarter will be higher than the previous one. We computed the precision and accuracy with unseen company data to evaluate its performance.`}
                  id={"fundamentalAnalysisInfo"}
                />
            </div>
            
            {#if isLoaded}

            {#if Object?.keys(fundamentalAnalysisDict)?.length !== 0}
            <div class="w-full flex flex-col items-start">
                <div class="text-white text-sm sm:text-[1rem] mt-1 sm:mt-3 mb-1 w-full">
                  Our model uses fundamental data only to predict the next quarter. Here are the stats of the model for {$displayCompanyName} to ensure transparency and reliability.
                </div>
            </div>
           

            <div class="w-full mt-5 mb-5 flex justify-start items-center">
                <div class="w-full grid grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-3 ">
                  <!--Start Flow Sentiment-->  
                  <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 bg-[#202020] shadow-lg rounded-2xl h-20">
                      <div class="flex flex-col items-start">
                          <span class="font-medium text-gray-200 text-sm">Quarter Sentiment</span>
                          {#if !deactivateContent}
                          <span class="text-start text-[1rem] font-medium {flowSentiment === 'Bullish' ? 'text-[#10DB06]' : 'text-[#FC2120]'}">{flowSentiment}</span>
                          {:else}
                          <a href="/pricing" class="text-blue-400 mt-1 hover:text-white font-medium text-sm flex justify-center items-center">
                            Unlock with Pro
                            <svg class="ml-1 w-5 h-5 inline-block"xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#A3A3A3" d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"/></svg>
                          </a>
                          {/if}
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

      

            <div class="text-white text-sm sm:text-[1rem] mt-4 sm:mt-7 ml-1">
              Over the next quarter the model forecasts a
              {#if !deactivateContent}
              <span class="font-semibold {flowSentiment === 'Bullish' ? 'text-[#10DB06]' : 'text-[#FC2120]'}">{flowSentiment}</span> price movement.
              {:else}
              <a href="/pricing" class="text-blue-400 mt-1 hover:text-white font-medium text-sm">
                Unlock Prediction with Pro
                <svg class="w-5 h-5 inline-block"xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#A3A3A3" d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"/></svg>
              </a>
              price movement.
              {/if}
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
    
    
    
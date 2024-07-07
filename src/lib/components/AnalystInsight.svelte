<script lang ='ts'>
    import { analystInsightComponent, stockTicker, userRegion, getCache, setCache} from '$lib/store';
    import InfoModal from '$lib/components/InfoModal.svelte';
  
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
  
  
    let rawData = {};


function latestInfoDate(inputDate) {
    // Convert the input date string to milliseconds since epoch
    const inputDateMs = Date?.parse(inputDate);

    // Get today's date in milliseconds since epoch
    const todayMs = Date?.now();

    // Calculate the difference in milliseconds
    const differenceInMs = todayMs - inputDateMs;

    // Convert milliseconds to days
    const differenceInDays = Math?.floor(differenceInMs / (1000 * 60 * 60 * 24));

    // Return the difference in days
    return differenceInDays <=1;
}


  const getAnalystInsight = async (ticker) => {
    // Get cached data for the specific tickerID
    const cachedData = getCache(ticker, 'getAnalystInsight');
    if (cachedData) {
      rawData = cachedData;
    } else {
  
      const postData = {'ticker': ticker};
      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/analyst-insight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      });
  
      rawData = await response.json();
      // Cache the data for this specific tickerID with a specific name 'getAnalystInsight'
      setCache(ticker, rawData, 'getAnalystInsight');
    }
    
    if(Object?.keys(rawData)?.length !== 0) {
      $analystInsightComponent = true;
    } else {
      $analystInsightComponent = false;
    }
  };
  
  
  
  $: {
  if($stockTicker && typeof window !== 'undefined') {
    isLoaded=false;
    const ticker = $stockTicker;
    const asyncFunctions = [
      getAnalystInsight(ticker)
      ];
      Promise.all(asyncFunctions)
          .then((results) => {
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
            <label for="analystInsightInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold">
              <svg class="w-6 h-6 inline-block mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#FAC109" d="m17 1.208l1.32 2.473L20.792 5L18.32 6.319L17 8.792l-1.318-2.473l-2.473-1.32l2.473-1.318zM8 4.333l2.667 5l5 2.667l-5 2.667l-2.666 5l-2.667-5l-5-2.667l5-2.667zm11.667 12l-1.666-3.125l-1.667 3.125L13.209 18l3.125 1.667l1.667 3.125l1.666-3.125L22.792 18z"/></svg>  
              AI Analyst Insight
            </label>
            <InfoModal
              title={"AI Analyst Insight"}
              content={"We use large language models to analyze the latest reports from Wall Street analysts, providing concise summaries and key insights. This approach helps save time and allows you to focus on the most important information."}
              id={"analystInsightInfo"}
            />
        </div>
  
        {#if data?.user?.tier === 'Pro'}
        {#if isLoaded}
  
        {#if Object?.keys(rawData)?.length !== 0}
  
        <div class="w-full flex flex-col items-start">
            <div class="text-white text-sm sm:text-[1rem] mt-2 mb-2 w-full">
                The AI model summarizes the latest Wallstreet Analyst Insight Report and extracts key points for you, focusing on what matters most.
            </div>
        </div>
  
        
        
        <div class="w-full mt-4">

            <a href="{'/stocks/'+$stockTicker+'/analyst'}" class="text-blue-400 hover:text-white flex justify-end mb-3 text-sm sm:text-[1rem]">
                See All Ratings
            </a>
    
            <div class="relative">
                <div class="">
                    
                    <div class="flex justify-center ">
                        <!--<div class="{rawData.changesPercentage >= 0 ? 'bg-[#10DB06]' : 'bg-[#FF2F1F]'} w-1.5 mb-5 rounded-l-xl" />-->
                            
                        <!--Start Item-->
                        <div class="flex flex-row items-center w-full mb-6">
                
                            <div class="w-full rounded-lg {latestInfoDate(rawData?.date) ? 'bg-[#F9AB00] bg-opacity-[0.1]' : 'bg-[#202020]'} shadow-lg h-full pl-3 pt-2 pb-4">
                                <div class="flex flex-col items-start"> 

                                    <div class="flex flex-row items-start w-full pt-2">
                                        <span class="text-white text-[0.915rem] pl-2 italic">Last Report from {rawData.date}</span>
                                        {#if latestInfoDate(rawData.date)}
                                            <label class="bg-[#2D4F8A] text-white font-medium text-xs rounded-lg px-2 py-0.5 ml-3">New</label>
                                        {/if}
                                    </div>

                                    <div class="flex flex-col w-full pt-3 pl-2 pr-2 sm:pr-4">
                                        <span class="text-white text-[0.915rem] ">
                                            {rawData?.insight}
                                        </span>
                                    </div>
                
                                </div>
                            </div>
                        </div>
                        <!--End Item-->

                    </div>
                </div>
            </div>
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
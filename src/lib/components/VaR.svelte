
<script lang ='ts'>
    import { varComponent, displayCompanyName, stockTicker, etfTicker, cryptoTicker, assetType, getCache, setCache} from '$lib/store';
    import InfoModal from '$lib/components/InfoModal.svelte';

    export let data;

    let isLoaded = false;
    let rating;
    let outlook;
    let valueAtRisk;
    let varDict = {}


    const getVaR = async (ticker) => {
    // Get cached data for the specific tickerID
    const cachedData = getCache(ticker, 'getVaR');
    if (cachedData) {
      varDict = cachedData;
    } else {

      const postData = {'ticker': ticker};
      // make the POST request to the endpoint
      const response = await fetch(data?.apiURL + '/value-at-risk', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": data?.apiKey
        },
        body: JSON.stringify(postData)
      });

      varDict = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getVaR'
      setCache(ticker, varDict, 'getVaR');
    }

    if(Object?.keys(varDict)?.length !== 0) {
    $varComponent = true;
    }
    else {
      $varComponent = false;
    }

};




    $: {
    if($assetType === 'stock' ? $stockTicker : $assetType === 'etf' ? $etfTicker : $cryptoTicker && typeof window !== 'undefined') {
        isLoaded = false;
        const ticker = $assetType === 'stock' ? $stockTicker : $assetType === 'etf' ? $etfTicker : $cryptoTicker;
        
        const asyncFunctions = [
        getVaR(ticker)
        ];
        Promise.all(asyncFunctions)
            .then((results) => {
                rating = varDict?.rating;
                outlook = varDict?.outlook;
                valueAtRisk = varDict?.var;
            })
            .catch((error) => {
                console.error('An error occurred:', error);
            });
        isLoaded = true;
    }
}

</script>
    
    
    
    <section class="overflow-hidden text-white h-full pb-10 sm:pb-0">
        <main class="overflow-hidden ">
                        
            <div class="flex flex-row items-center">
                <label for="varInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold">
                    Value at Risk
                </label>
                <InfoModal
                  title={"Value at Risk"}
                  content={`Value at Risk (VaR) quantifies the potential loss of investment or capital within a specified time frame (N days) under typical market conditions, providing an estimate of potential losses with a given probability for ${$displayCompanyName}.`}
                  id={"varInfo"}
                />
            </div>
    
            {#if data?.user?.tier === 'Pro'}

            {#if Object?.keys(varDict)?.length !== 0}
            

            <div class="pb-4 w-full mt-5">
                <div class="w-auto p-4 sm:p-6 bg-[#09090B] sm:bg-[#09090B] rounded-lg relative">
                  <div class="flex flex-row items-center justify-between ">
                            <div class="relative size-[60px] sm:size-[70px] ml-auto">
                            <svg class="size-full w-[60px] h-[60px] sm:w-[70px] sm:h-[70px]" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                                <!-- Background Circle -->
                                <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#303030]" stroke-width="4"></circle>
                                <!-- Progress Circle inside a group with rotation -->
                                <g class="origin-center -rotate-90 transform">
                                <circle cx="18" cy="18" r="16" fill="none" class="stroke-current {rating > 5 ? 'text-[#10DB06]' : rating < 5 ? 'text-[#FF2F1F]' : 'text-white'} " stroke-width="4" stroke-dasharray="100" stroke-dashoffset={100-rating*10}></circle>
                                </g>
                            </svg>
                            <!-- Percentage Text -->
                            <div class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
                                <span class="text-center text-white text-xl font-semibold">
                                    {rating}
                                </span>
                            </div>
                            </div>
                    
                        <div class="flex flex-col items-start ml-4 sm:ml-10 mr-auto sm:-top-3 sm:relative">
                            <h3 class="hidden sm:block text-gray-300 text-[1rem] sm:text-lg font-semibold">
                                <span class="{outlook === 'Minimum Risk' ? 'text-[#10BC09]' : outlook==='Risky' ? 'text-red-500' : 'text-white'}">{outlook}</span> outlook:
                            </h3>
                            <span class="text-gray-200 text-sm mt-1">
                                Under typical market conditions, there is a <span class="font-semibold">95%</span> probability that <span class="text-blue-400">${$assetType === 'stock' ? $stockTicker : $assetType === 'etf' ? $etfTicker : $cryptoTicker}</span> will incur a maximum loss of <span class="text-[#FF2F1F] font-semibold">{valueAtRisk}%</span> in the upcoming week.
                            </span>
                        </div>
                    </div>
                </div>
              </div>

           
    
              
            {:else}
            <h2 class="mt-10 mb-5 flex justify-center items-center text-2xl font-bold text-slate-700 m-auto">
                No data available
            </h2>
            
            {/if}

            {:else}
            <div class="shadow-lg shadow-bg-[#000] bg-[#111112] sm:bg-opacity-[0.5] text-sm sm:text-[1rem] rounded-md w-full p-4 min-h-24 mt-4 text-white m-auto flex justify-center items-center text-center font-semibold">
                <svg class="mr-1.5 w-5 h-5 inline-block"xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#A3A3A3" d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"/></svg>
                Unlock content with <a class="inline-block ml-2 text-blue-400 hover:sm:text-white" href="/pricing">Pro Subscription</a>
              </div>
            {/if}
    
        </main>
    </section>
    
    
    
    
    
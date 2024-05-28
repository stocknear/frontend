<script lang='ts'>
  import cardBackground from "$lib/images/bg-hedge-funds.png";
  import defaultAvatar from "$lib/images/hedge_funds/default-avatar.png";

  import { screenWidth, numberOfUnreadNotification } from '$lib/store';
  import { abbreviateNumber } from '$lib/utils';
  import { onMount } from 'svelte';
  import { compareTwoStrings } from 'string-similarity';
    //  import * as XLSX from 'xlsx';

  export let data;
  
  let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;


  let rawData = data?.getHedgeFunds;
  let slicedRawData = [];
  let displayList = [];
  let images = {};
  let filterQuery = '';

  let isLoaded = false;

  
    
  async function handleScroll() {
    const scrollThreshold = document.body.offsetHeight * 0.8; // 80% of the website height
    const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;
    if (isBottom && displayList?.length !== rawData?.length) {
        const nextIndex = displayList?.length;
        const filteredNewResults = rawData?.slice(nextIndex, nextIndex + 20);
        displayList = [...displayList, ...filteredNewResults];
    }
  }
  

    
  
onMount(async () => {
    displayList = rawData?.slice(0,20) ?? [];
    isLoaded = true;
  
    window.addEventListener('scroll', handleScroll);
      //window.addEventListener('keydown', handleKeyDown);
    
      return () => {
        // Cleanup the event listeners when the component is unmounted
        window.removeEventListener('scroll', handleScroll);
        //window.removeEventListener('keydown', handleKeyDown);
      };
  
  });
  


let syncWorker: Worker | undefined = undefined;

// Handling messages from the worker
const handleMessage = async (event) => {
    const filterData = event.data?.output
    console.log(filterData)
    if (filterData?.length !== 0) {
        rawData = filterData;
        displayList = [...filterData]?.slice(0,20);
    } else {
        // Reset to original data if no matches found
        rawData = data?.getHedgeFunds;
        displayList = rawData?.slice(0, 20);
    }
};

const loadWorker = async () => {
  const SyncWorker = await import('./workers/filterQuery?worker');
  syncWorker = new SyncWorker.default();
  syncWorker.postMessage({ rawData: data?.getHedgeFunds, filterQuery: filterQuery});
  syncWorker.onmessage = handleMessage;

};
  
async function handleInput(event) {
    filterQuery = event.target.value?.toLowerCase();
    let newData = [];

    setTimeout(async () => {
        if (filterQuery?.length !== 0) {
            await loadWorker();
        } else {
            // Reset to original data if filter is empty
            rawData = data?.getHedgeFunds;
            displayList = rawData?.slice(0, 20);
        }
    }, 500);
}

  

  let charNumber = 40;
  $: {
      if ($screenWidth < 640)
      {
        charNumber = 20;
      }
      else {
        charNumber = 40;
      }
    }
    
  

  </script>
  
  <!-- HEADER FOR BETTER SEO -->
  <svelte:head>
    <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} All listed Hedge Funds · stocknear</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0">
  
    <meta name="description" content="Find all listed Hedge Funds based on the US Market.">
    <!-- Other meta tags -->
    <meta property="og:title" content="All listed Hedge Funds · stocknear"/>
    <meta property="og:description" content="Find all listed Hedge Funds based on the US Market.">
    <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
    <meta property="og:type" content="website"/>
    <!-- Add more Open Graph meta tags as needed -->
  
    <!-- Twitter specific meta tags -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="All listed Hedge Funds · stocknear"/>
    <meta name="twitter:description" content="Find all listed Hedge Funds based on the US Market.">
    <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
    <!-- Add more Twitter meta tags as needed -->
  </svelte:head>

  
  
  
  
  <section class="w-full max-w-6xl overflow-hidden m-auto min-h-screen pt-5 pb-60">
      
    
    <body class="w-full max-w-6xl overflow-hidden m-auto">
              
      <div class="text-sm breadcrumbs ml-4">
        <ul>
          <li><a href="/" class="text-gray-300">Home</a></li> 
          <li class="text-gray-300">Hedge Funds</li>
        </ul>
      </div>
    
        
    {#if isLoaded}
  
              
      <section class="w-full max-w-6xl overflow-hidden m-auto sm:mt-10 px-0 sm:px-3 mt-10">
        
        <div class="p-3 sm:p-0 flex justify-center w-full m-auto overflow-hidden">
            <div class="relative flex justify-center items-center overflow-hidden w-full">
                <main class="w-full">
  
                  
                  <div class="w-full pb-3">
                    <div class="relative right-0 bg-[#0F0F0F]">
                      <ul class="relative grid grid-cols-1 sm:grid-cols-4 gap-y-3 gap-x-3 flex flex-wrap p-1 list-none rounded-[3px]">
                        <li class="pl-3 py-1.5 flex-auto text-center bg-[#2E3238] rounded-[3px]">
                          <label class="flex flex-row items-center">
                            <input 
                            id="modal-search"
                            type="search" 
                            class="ml-2 text-[1rem] placeholder-gray-400 border-transparent focus:border-transparent focus:ring-0 flex items-center justify-center w-full px-0 py-1 bg-inherit"
                            placeholder="Find by name"
                            bind:value={filterQuery}
                            on:input={handleInput}
                            autocomplete="off"
                            />
                            <svg class="ml-auto mr-5 h-8 w-8 inline-block mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="m19.485 20.154l-6.262-6.262q-.75.639-1.725.989t-1.96.35q-2.402 0-4.066-1.663T3.808 9.503T5.47 5.436t4.064-1.667t4.068 1.664T15.268 9.5q0 1.042-.369 2.017t-.97 1.668l6.262 6.261zM9.539 14.23q1.99 0 3.36-1.37t1.37-3.361t-1.37-3.36t-3.36-1.37t-3.361 1.37t-1.37 3.36t1.37 3.36t3.36 1.37"/></svg>
                          </label>
                          </li>
                        

                      </ul>
                    </div>
                  </div>

    
                <div class="w-full m-auto mt-4">
                      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
                            {#each displayList as item}
                              <a href={`/hedge-funds/${item?.cik}`} class="w-full cursor-pointer bg-[#202020] sm:hover:bg-[#000] transition-colors ease-in-out border sm:hover:border-[#000] sm:hover:shadow-[#8C5F1B] border-slate-800 shadow-md rounded-lg h-auto pb-4 pt-4 mb-7">
                                <div class="flex flex-col relative">
                                  <img class="absolute -mt-4 w-full m-auto rounded-lg" src={cardBackground} />
                                  <div class="flex flex-col justify-center items-center rounded-2xl ">

                                    <div class="-mt-3 shadow-lg rounded-full border border-slate-600 w-20 h-20 relative hedge-fund-striped bg-[#20202E] flex items-center justify-center">
                                      <img style="clip-path: circle(50%);" class="rounded-full w-16" src={item?.image} loading="lazy"/>
                                    </div>
                                    <span class="text-white text-md font-semibold mt-2 mb-2 w-64 text-center">
                                      {item?.name}
                                    </span>
                                    <span class="text-white text-md mb-8">
                                      AUM: {abbreviateNumber(item?.marketValue,true)}
                                    </span>
  
                                  </div>
                                  
                                  <div class="relative bottom-0 w-full px-8">
                                    <div class="flex flex-row justify-between items-center w-full mb-6">
                                      <label class="cursor-pointer flex flex-col items-start">
                                        <span class="text-white text-[1rem] font-semibold">{abbreviateNumber(item?.numberOfStocks)}</span>
                                        <span class="text-slate-300 font-medium text-sm"># of Holdings</span>
                                      </label>
                  
                                      <div class="flex flex-col items-end ">
                                        <span class="text-white text-[1rem] font-semibold">
                                          {item?.turnover?.toFixed(2)}
                                        </span>
                                        <span class="text-slate-300 font-medium text-sm">Turnover</span>
                                      </div>
                                    </div>

                                    <div class="flex flex-row justify-between items-center w-full">
                                      <label class="cursor-pointer flex flex-col items-start">
                                          <div class="flex flex-row mt-1 text-[1rem] font-semibold">
                                            {#if item?.performancePercentage3year >=0}
                                              <span class="text-[#10DB06]">+{abbreviateNumber(item?.performancePercentage3year?.toFixed(2))}%</span>
                                            {:else}
                                              <span class="text-[#FF2F1F]">{abbreviateNumber(item?.performancePercentage3year?.toFixed(2))}% </span> 
                                            {/if}
                                          </div>
                                        <span class="text-slate-300 font-medium text-sm">3-Year Performance</span>
                                      </label>
                  
                                      <div class="flex flex-col items-end ">
                                        <div class="flex flex-row mt-1 text-[1rem] font-semibold">
                                          {#if item?.winRate >=0}
                                            <span class="text-[#10DB06]">+{abbreviateNumber(item?.winRate?.toFixed(2))}%</span>
                                          {:else}
                                            <span class="text-[#FF2F1F]">{abbreviateNumber(item?.winRate?.toFixed(2))}% </span> 
                                          {/if}
                                        </div>
                                        <span class="text-slate-300 font-medium text-sm">Win Rate</span>
                                      </div>
                                    </div>
                                  </div>
                           
            
              
                                </a>
                            {/each}
  
                            <!--<InfiniteLoading on:infinite={infiniteHandler} />-->
                      </div>
  
                     

  
                  </div>
                
                </main>
            </div>
        </div>
      </section>
      {:else}
      <div class="flex justify-center items-center m-auto relative w-[100px]">
        <div class="loader">Loading...</div>
      </div>
  
      {/if}
          
  </body>
          
          
      
  </section>




<style>

.hedge-fund-striped {
    background-image: repeating-linear-gradient(
        -45deg,
        #A77120,
        #A77120 10px,
        #90621C 10px,
        #90621C 20px
    );
}
</style>
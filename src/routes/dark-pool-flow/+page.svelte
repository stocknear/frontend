<script lang='ts'>
  import { goto } from '$app/navigation';
  import { numberOfUnreadNotification, screenWidth, isOpen } from '$lib/store';
  import InfiniteLoading from '$lib/components/InfiniteLoading.svelte';
  import { onMount } from 'svelte';
  import UpgradeToPro from '$lib/components/UpgradeToPro.svelte';

  
    export let data;
    let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;

    let isLoaded = false;
    let rawData = []
    let displayList =  [];
    let mostFrequentTicker;
    let highestVolumeTicker;
    let highestSizeTicker;
    let displayDate;

function getLastDate(dateString) {
  const date = new Date(dateString);

  // Check if it is open
  if ($isOpen) {
    return date?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } else {
    const dayOfWeek = date.getDay(); // 0 (Sunday) to 6 (Saturday)

    // Check if it is a weekday (Monday to Friday)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      // Subtract one day
      date.setDate(date.getDate() - 1);
    } else {
      // Find the last weekday of the week
      // If it's Saturday, go back to Friday
      // If it's Sunday, go back to Friday
      if (dayOfWeek === 6) {
        date.setDate(date.getDate() - 1);
      } else if (dayOfWeek === 0) {
        date.setDate(date.getDate() - 2);
      }
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
  function formatTime(dateString) {
    // Parse the date string to a Date object
  const date = new Date(dateString);

  // Extract hours, minutes, and seconds
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  // Format time as hh:mm:ss
  return `${hours}:${minutes}:${seconds}`;

  }

  function findMostFrequentTicker(data) {
    const tickerCountMap = new Map();
    // Iterate through the data and update the count for each ticker
    data?.forEach(item => {
      const ticker = item?.symbol;
      if (tickerCountMap?.has(ticker)) {
        tickerCountMap?.set(ticker, tickerCountMap?.get(ticker) + 1);
      } else {
        tickerCountMap?.set(ticker, 1);
      }
    });
  
    let maxTicker;
    let maxCount = -1;
  
    // Find the ticker with the highest count
    tickerCountMap?.forEach((count, ticker) => {
      if (count > maxCount) {
        maxCount = count;
        maxTicker = ticker;
      }
    });
  
    return { ticker: maxTicker, count: maxCount };
  }
  

  function findHighestVolume(data) {
    let maxVolume = -1;
    let maxVolumeTicker = null;
  
    // Iterate through the data and find the ticker with the highest volume
    data?.forEach(item => {
      const volume = parseInt(item?.volume); // Assuming volume is a string, parse it to an integer
      if (volume > maxVolume) {
        maxVolume = volume;
        maxVolumeTicker = item?.symbol;
      }
    });
  
    return { ticker: maxVolumeTicker, volume: maxVolume };
  }

  function findHighestSize(data) {
    let maxSize = -1;
    let maxSizeTicker = null;
  
    // Iterate through the data and find the ticker with the highest cost basis
    data?.forEach(item => {
      if (item?.size > maxSize) {
        maxSize = item?.size;
        maxSizeTicker = item?.symbol;
      }
    });
  
    return { ticker: maxSizeTicker, size: maxSize };
  }

  async function infiniteHandler({ detail: { loaded, complete } }) 
  {
  if (displayList?.length === rawData?.length) {
      complete();
    } else {
      const nextIndex = displayList?.length;
      const newArticles = rawData?.slice(nextIndex, nextIndex + 5);
      displayList = [...displayList, ...newArticles];
      loaded();
    }
  }
  
    
  onMount(() => {
    rawData = data?.getDarkPoolFlow ?? [];
    displayList = rawData?.slice(0,20) ?? []
    displayDate = getLastDate(rawData?.at(0)?.date)
    mostFrequentTicker = findMostFrequentTicker(rawData);
    highestVolumeTicker = findHighestVolume(rawData);
    highestSizeTicker = findHighestSize(rawData);
    isLoaded = true;
  })
  
  
  let charNumber = 40;
  $: {
    if ($screenWidth < 640)
    {
      charNumber = 15;
    }
    else {
      charNumber = 40;
    }
  }
  
        
  </script>
  
  <svelte:head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>
      {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Dark Pool Flow · stocknear
  </title>
  <meta name="description" content={`Realtime Dark Pool Trades from Hedge Funds & Major Institutional Traders.`} />
  
  <!-- Other meta tags -->
  <meta property="og:title" content={`Dark Pool Flow · stocknear`}/>
  <meta property="og:description" content={`Realtime Dark Pool Trades from Hedge Funds & Major Institutional Traders.`} />
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->
  
  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content={`Dark Pool Flow · stocknear`}/>
  <meta name="twitter:description" content={`Realtime Dark Pool Trades from Hedge Funds & Major Institutional Traders.`} />
  <!-- Add more Twitter meta tags as needed -->
  
  </svelte:head>
  
      
  
  <section class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-5 pb-40">
        
    <div class="text-sm breadcrumbs ml-4">
      <ul>
        <li><a href="/" class="text-gray-300">Home</a></li>
        <li class="text-gray-300">Dark Pool Flow</li>
      </ul>
    </div>
            
    <div class="w-full max-w-4xl overflow-hidden m-auto mt-5">
      
      <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden max-w-4xl">
          <div class="relative flex justify-center items-center overflow-hidden w-full">
              <main class="w-full">
               
                <div class="w-full max-w-4xl m-auto sm:bg-[#202020] sm:rounded-xl h-auto pl-10 pr-10 pt-5 sm:pb-10 sm:pt-10 mt-3 mb-8">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
                
                    <!-- Start Column -->
                    <div>
                      <div class="flex flex-row justify-center items-center">
                        <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
                          Dark Pool Flow
                        </h1>
                      </div>
            
                      <span class="text-white text-md font-medium text-center flex justify-center items-center ">
                          Realtime Dark Pool Trades from Hedge Funds & Major Institutional Traders.
                      </span>
            
        
                    </div>
                    <!-- End Column -->
                
                    <!-- Start Column -->
                    <div class="hidden sm:block relative m-auto mb-5 mt-5 sm:mb-0 sm:mt-0">
                      <svg class="w-40 -my-5" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <filter id="glow">
                            <feGaussianBlur stdDeviation="5" result="glow"/>
                            <feMerge>
                              <feMergeNode in="glow"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>
                        <path fill="#1E40AF" d="M57.6,-58.7C72.7,-42.6,81.5,-21.3,82,0.5C82.5,22.3,74.7,44.6,59.7,60.1C44.6,75.6,22.3,84.3,0,84.3C-22.3,84.2,-44.6,75.5,-61.1,60.1C-77.6,44.6,-88.3,22.3,-87.6,0.7C-86.9,-20.8,-74.7,-41.6,-58.2,-57.7C-41.6,-73.8,-20.8,-85.2,0.2,-85.4C21.3,-85.6,42.6,-74.7,57.6,-58.7Z" transform="translate(100 100)" filter="url(#glow)" />
                      </svg>
                      
                      
                      <div class="z-1 absolute top-0">
                          <img class="w-auto" src={cloudFrontUrl+'/assets/dark_pool_flow_logo.png'} alt="logo" loading="lazy">
                        </div>
                    </div>
                    <!-- End Column -->
                  </div>
            
                 
            
            
                </div>

                {#if isLoaded}

                <div class="flex flex-col items-start">
                  <span class="text-white text-sm sm:text-[1rem] mt-5 text-center sm:text-start w-full ml-2">
                    Real-time trades delayed by 15 minutes.
                  </span>

                  <span class="text-white text-sm sm:text-[1rem] italic mt-2 text-center sm:text-start w-full ml-2 mb-5">
                    Live Flow of {displayDate}
                  </span>

                </div>


                <div class="w-full mt-5 mb-10 m-auto flex justify-center items-center p-3 sm:p-0">
                  <div class="w-full grid grid-cols-2 lg:grid-cols-4 gap-y-3 gap-x-3 ">
        
                   <!--Start Most Traded-->  
                   <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 bg-[#262626] shadow-lg rounded-lg h-20">
                    <div class="flex flex-col items-start">
                        <span class="font-medium text-gray-200 text-sm ">Most Traded Option</span>
                        <span class="text-start text-sm sm:text-[1rem] font-medium text-white mt-0.5">
                          <a href={"/stocks/"+mostFrequentTicker?.ticker} class="text-blue-400 ">
                            {mostFrequentTicker?.ticker}
                          </a>
                          {new Intl.NumberFormat("en", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(mostFrequentTicker?.count)}
                        </span>
                    </div>
                  </div>
                  <!--End Most Traded-->
        
        
                  <!--Start Highest Volume-->  
                  <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 bg-[#262626] shadow-lg rounded-lg h-20">
                    <div class="flex flex-col items-start">
                        <span class="font-medium text-gray-200 text-sm ">Highest Volume</span>
                        <span class="text-start text-sm sm:text-[1rem] font-medium text-white mt-0.5">
                          <a href={"/stocks/"+highestVolumeTicker?.ticker} class="text-blue-400 ">
                            {highestVolumeTicker?.ticker}
                          </a>
                          {new Intl.NumberFormat("en", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(highestVolumeTicker?.volume)}
                        </span>
                    </div>
                  </div>
                  <!--End Highest Volume-->
        
                   <!--Start Highest Size-->  
                   <div class="flex flex-row items-center flex-wrap w-full px-5 bg-[#262626] shadow-lg rounded-lg h-20">
                    <div class="flex flex-col items-start">
                        <span class="font-medium text-gray-200 text-sm ">Highest Size</span>
                        <span class="text-start text-sm sm:text-[1rem] font-medium text-white mt-0.5">
                          <a href={"/stocks/"+highestSizeTicker?.ticker} class="text-blue-400 ">
                            {highestSizeTicker?.ticker}
                          </a>
                          {new Intl.NumberFormat("en", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(highestSizeTicker?.size)}
                        </span>
                    </div>
                  </div>
                  <!--End Highest Size-->
        
        
                  </div>
                </div>

                <div class="w-screen sm:w-full m-auto mt-20 sm:mt-10">
                    
                  
                    <div class="w-screen sm:w-full m-auto rounded-none sm:rounded-lg mb-4 overflow-x-scroll sm:overflow-hidden">
                      <table class="table table-sm table-compact rounded-none sm:rounded-md w-full bg-[#0F0F0F] border-bg-[#0F0F0F] m-auto">
                        <thead>
                          <tr class="bg-[#0F0F0F] border-b border-blue-400">
                            <th class="text-start bg-[#0F0F0F] text-white text-sm font-semibold">
                              Time
                            </th>
                            <th class="text-start bg-[#0F0F0F] text-white text-sm font-semibold">
                              Company
                            </th>
                            <th class="text-start bg-[#0F0F0F] text-white text-sm font-semibold">
                              Size
                            </th>
                            <th class="text-end bg-[#0F0F0F] text-white text-sm font-semibold">
                              Volume
                            </th>
                            <th class="text-end bg-[#0F0F0F] text-white text-sm font-semibold">
                             Price
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {#each displayList as item, index}
  
                          <tr on:click={() => goto(`/stocks/${item?.symbol}`)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#202020] {index+1 === displayList?.length && data?.user?.tier !== 'Pro' ? 'opacity-[0.1]' : ''} cursor-pointer">
 
  
                            <td class="text-start text-sm font-medium text-white">
                                {formatTime(item?.date)}
                            </td>

                            <td class="text-sm text-start">
                              <div class="flex flex-col items-start w-32 sm:w-fit">
                                  <span class="text-blue-400">{item?.symbol}</span>
                                  <span class="text-white">
                                      {item?.name?.length > charNumber ? item?.name?.slice(0,charNumber) + "..." : item?.name}
                                  </span>
                              </div>
                          </td>

                            <td class="text-start text-sm font-medium text-white">
                              {new Intl.NumberFormat("en", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            }).format(item?.size)}
                          </td>
      
                            <td class="text-end text-sm font-medium text-white">
                              {new Intl.NumberFormat("en", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            }).format(item?.volume)}
                            </td>

                            <td class="text-end text-sm font-medium text-white">
                              ${item?.price}
                          </td>

                          </tr>
                        {/each}
                        </tbody>
                      </table>
                  </div>
                    <InfiniteLoading on:infinite={infiniteHandler} />
                    <UpgradeToPro data={data} title="Get the latest dark pool trades in realtime from Hedge Funds & Major Institutional Traders"/>
  
                </div>

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
          </div>
      </div>
  
    
    </div>
        
        
    
  </section>
  
  
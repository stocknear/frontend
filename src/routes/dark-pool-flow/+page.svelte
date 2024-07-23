<script lang='ts'>
  import { numberOfUnreadNotification, screenWidth, isOpen } from '$lib/store';
  import { onMount, onDestroy } from 'svelte';
  import UpgradeToPro from '$lib/components/UpgradeToPro.svelte';
  import { abbreviateNumber } from '$lib/utils.js';
  import { goto } from '$app/navigation';
  
    export let data;

    let isLoaded = false;
    let rawData = []
    let displayList =  [];
    let mostFrequentTicker;
    let highestVolumeTicker;
    let highestSizeTicker;
    let highestAmountTicker;
    let displayDate;
    let scrollContainer;
    let notFound = false;

    let filterQuery = '';


function getLastDate(dateString) {
  const date = new Date(dateString);

  // Check if it is open
  if ($isOpen) {
    return date?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } else {
    const dayOfWeek = date.getDay(); // 0 (Sunday) to 6 (Saturday)

    // Check if it is a weekday (Monday to Friday)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      date.setDate(date.getDate());
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
  let hours = date.getUTCHours();
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  // Determine AM/PM
  const ampm = hours >= 12 ? 'PM' : 'AM';

  // Convert hours from 24-hour to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  // Format hours
  const formattedHours = String(hours).padStart(2, '0');

  // Format time as hh:mm:ss AM/PM
  return `${formattedHours}:${minutes}:${seconds} ${ampm}`;
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

  function findHighestAmount(data) {
    let maxAmount = -1;
    let maxAmountTicker = null;
  
    // Iterate through the data and find the ticker with the highest cost basis
    data?.forEach(item => {
      if ((item?.volume*item?.price) > maxAmount) {
        maxAmount = item?.volume*item?.price;
        maxAmountTicker = item?.symbol;
      }
    });

  
    return { ticker: maxAmountTicker, amount: maxAmount };
  }



  async function handleScroll() {
    if (!scrollContainer) return;
    const scrollThreshold = scrollContainer.scrollHeight * 0.8; // 80% of the div height
    const isBottom = scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollThreshold;
    if (isBottom && displayList?.length !== rawData?.length) {
      const nextIndex = displayList?.length;
      const filteredNewResults = rawData?.slice(nextIndex, nextIndex + 25);
      displayList = [...displayList, ...filteredNewResults];
    }
  }

    
  onMount(() => {
    rawData = data?.getDarkPoolFlow ?? [];
    displayList = rawData?.slice(0,20) ?? []
    displayDate = getLastDate(rawData?.at(0)?.date)
    mostFrequentTicker = findMostFrequentTicker(rawData);
    highestVolumeTicker = findHighestVolume(rawData);
    highestSizeTicker = findHighestSize(rawData);
    highestAmountTicker = findHighestAmount(rawData);

    if (data?.user?.tier === 'Pro') {
      const attachScrollListener = () => {
        if (scrollContainer) {
          scrollContainer.addEventListener('scroll', handleScroll);
          return true;
        }
        return false;
      };

      if (!attachScrollListener()) {
        const observer = new MutationObserver(() => {
          if (attachScrollListener()) {
            observer.disconnect();
          }
        });

        observer.observe(document.body, { childList: true, subtree: true });
      }
    }

    isLoaded = true;
  })
  

onDestroy(async() => {

  if (scrollContainer && data?.user?.tier === 'Pro') {
    scrollContainer.removeEventListener('scroll', handleScroll);
  };


})

  function handleInput(event) {
    filterQuery = event.target.value;
    let newData = [];
    setTimeout(() => {
        if (filterQuery?.length !== 0) {
            newData = [...rawData?.filter(item => item?.symbol === filterQuery?.toUpperCase())];
            if (newData?.length !== 0) {
                rawData = newData;

                displayList = [...rawData?.slice(0, 100)];


                notFound = false;
            } else {
                notFound = true;
                rawData = data?.getDarkPoolFlow;
                displayList = rawData?.slice(0, 100);
            }
        } else {
            notFound = false;
            rawData = data?.getDarkPoolFlow;
            displayList = rawData?.slice(0, 100);
        }

        mostFrequentTicker = findMostFrequentTicker(rawData);
        highestVolumeTicker = findHighestVolume(rawData);
        highestSizeTicker = findHighestSize(rawData);
        highestAmountTicker = findHighestAmount(rawData);

    }, 200);
}

function debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            fn.apply(this, args);
        }, delay);
    };
}

const debouncedHandleInput = debounce(handleInput, 200);

  
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
  

<svelte:options immutable={true} />

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
  
      
  <body class="sm:fixed h-screen m-auto w-full max-w-screen">

 

    <section class="w-full max-w-screen sm:max-w-6xl flex justify-center items-center m-auto pt-5 bg-[#09090B] ">
        
      
        <div class="w-full m-auto mb-10 pl-3 pr-3">
  
          <div class="text-sm breadcrumbs mb-5">
            <ul>
              <li><a href="/" class="text-gray-300">Home</a></li>
              <li class="text-gray-300">Dark Pool Flow</li>
            </ul>
          </div>
  
  
            <div class="flex flex-col sm:flex-row items-center w-full bg-[#262626] rounded-lg px-3">
            
    
                <div class="flex flex-row items-center justify-center sm:justify-start mt-6 pb-5">
               
                  
  
    
              
                <div class="ml-3 flex flex-col items-start">
                    <span class="text-xs sm:text-sm italic text-white">
                      Live flow of {new Date(displayList?.at(0)?.date ?? null)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })} (NYSE Time)
                    </span>
                </div>
    
              
            </div>
  
            <!--Start Filter-->
            <div class="sm:ml-auto w-full sm:w-fit">
              <div class="relative flex flex-col sm:flex-row items-center">
                  <div class="relative w-full sm:w-fit pl-3 py-2 sm:py-1.5 sm:mr-5 mb-4 sm:mb-0 flex-auto text-center bg-[#313131] rounded-lg border border-gray-600">
                    <label class="flex flex-row items-center ">
                      <input 
                      id="modal-search"
                        type="search" 
                        class="text-white sm:ml-2 text-[1rem] placeholder-gray-300 border-transparent focus:border-transparent focus:ring-0 flex items-center justify-center w-full px-0 py-1 bg-inherit"
                        placeholder="Find by Symbol"
                        bind:value={filterQuery}
                        on:input={debouncedHandleInput}
                        autocomplete="off"
                      />
                      <svg class="ml-auto h-7 w-7 sm:h-8 sm:w-8 inline-block mr-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="m19.485 20.154l-6.262-6.262q-.75.639-1.725.989t-1.96.35q-2.402 0-4.066-1.663T3.808 9.503T5.47 5.436t4.064-1.667t4.068 1.664T15.268 9.5q0 1.042-.369 2.017t-.97 1.668l6.262 6.261zM9.539 14.23q1.99 0 3.36-1.37t1.37-3.361t-1.37-3.36t-3.36-1.37t-3.361 1.37t-1.37 3.36t1.37 3.36t3.36 1.37"/></svg>
                    </label>
                    {#if notFound === true}
                    <span class="absolute left-1 -bottom-6 label-text text-error text-[0.65rem] mt-2">
                        No Results Found
                    </span>
                    {/if}
                  </div>
                  
                  
                <div class="py-2 sm:py-1.5 mb-5 sm:mb-0 flex-auto text-center bg-[#000] rounded-lg w-full sm:w-fit">
                  <label for="filterList" class="sm:flex sm:flex-row justify-center items-center cursor-pointer px-5">
                    <svg class="h-6 w-6 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M32 144h448M112 256h288M208 368h96"/></svg>
                    <span class="m-auto text-[1rem] text-white ml-2 px-0 py-1 bg-inherit">
                      Filters
                    </span>
                  </label>
                </div>
  
  
          </div>
        </div>
            <!--End Filter-->
                
        </div>
    
            
      
  
    
            {#if isLoaded }
  
    
            <div class="w-full mt-5 mb-10 m-auto flex justify-center items-center">
  
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

                  <!--Start Amount-->  
                  <div class="flex flex-row items-center flex-wrap w-full px-5 bg-[#262626] shadow-lg rounded-lg h-20">
                    <div class="flex flex-col items-start">
                        <span class="font-medium text-gray-200 text-sm ">Highest Amount</span>
                        <span class="text-start text-sm sm:text-[1rem] font-medium text-white mt-0.5">
                          <a href={"/stocks/"+highestAmountTicker?.ticker} class="text-blue-400 ">
                            {highestAmountTicker?.ticker}
                          </a>
                          {abbreviateNumber(highestAmountTicker?.amount, true)}
                        </span>
                    </div>
                  </div>
                  <!--End Amount-->
      
      
                </div>
              </div>
      
           </div>
            
      
    
          
    
    
            <!-- Page wrapper -->
            <div class="flex justify-center w-full m-auto h-full overflow-hidden">
        
                <!-- Content area -->
                <div bind:this={scrollContainer} class="mt-4 w-full overflow-x-auto overflow-y-auto h-[900px] rounded-lg">
                  <table class="table table-pin-cols table-pin-rows table-sm table-compact">
                      <thead>
                        <tr class="">
                          <td class="bg-[#161618] text-slate-300 font-bold text-xs text-start uppercase">Time</td>
                          <th class="bg-[#161618] font-bold text-slate-300 text-xs text-start uppercase">Company</th>
                          <td class="bg-[#161618] text-slate-300 font-bold text-xs text-start uppercase">Size</td>
                          <td class="bg-[#161618] text-slate-300 font-bold text-xs text-end uppercase">Volume</td>
                          <td class="bg-[#161618] text-slate-300 font-bold text-xs text-end uppercase">Price</td>
                          <td class="bg-[#161618] text-slate-300 font-bold text-xs text-end uppercase">Amount</td>
                        </tr>
                      </thead>
                      <tbody>
                        {#each displayList as item,index}
                        <!-- row -->
                        <tr class="w-full odd:bg-[#27272A] cursor-pointer {index+1 === displayList?.length && data?.user?.tier !== 'Pro' ? 'opacity-[0.1]' : ''}">
                          
                          <td class="text-start text-sm font-medium text-white whitespace-nowrap">
                            {formatTime(item?.date)}
                          </td>
      
                              <td  on:click|stopPropagation={() => goto(`/stocks/${item?.symbol}`)}  class="text-sm text-start whitespace-nowrap">
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
      
                        <td class="text-end text-sm font-medium text-white">
                          {abbreviateNumber(item?.price*item?.volume,true)}
                        </td>
        
      
                        </tr>
                        
                    
                        {/each}
                      </tbody>
                    </table>
        
                    <!--<InfiniteLoading on:infinite={infiniteHandler} />-->    
      
            </div>
        
            </div>
  
  
            <div class="relative bottom-[400px] w-fit m-auto flex justify-center items-center">
              <UpgradeToPro data={data} title="Get the recent Options Flow Data from Hedge Funds and major institutional traders to never miss out"/>
            </div>
    
           
            {:else}
            <div class="flex justify-center items-center h-80">
              <div class="relative">
              <label class="bg-[#09090B] rounded-xl h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span class="loading loading-spinner loading-md"></span>
              </label>
              </div>
          </div>
    
            {/if}
        </div>        
        
    </section>
        
  </body>
  
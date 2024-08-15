<script lang='ts'>
  import { goto } from '$app/navigation';
  import { screenWidth, numberOfUnreadNotification, etfTicker, stockTicker, isOpen } from '$lib/store';
  import notifySound from '$lib/audio/options-flow-reader.mp3';
  //import UpgradeToPro from '$lib/components/UpgradeToPro.svelte';
  import { abbreviateNumber } from '$lib/utils';
  import { onMount, onDestroy } from 'svelte';
  import toast from 'svelte-french-toast';
  import VirtualList from 'svelte-tiny-virtual-list';
  
  export let data;
    
  
  
  let rawData = [];
  let filterList = [];
  let displayedData =[];

  let flowSentiment;
  let putCallRatio;
  let displayCallVolume;
  let displayPutVolume;
  let callPercentage;
  let putPercentage;
  let mostFrequentTicker;
  let highestVolumeTicker;
  let highestPremiumTicker;
  let highestOpenInterestTicker;
  
  let audio;
  let muted = true;
  let newIncomingData = false;
  let socket;
  let filterQuery = '';
  let previousCallVolume = 0; //This is needed to play the sound only if it changes.
  let notFound = false;
  let isLoaded = false;
  let mode = $isOpen === true ? true : false;
  let showMore = false;
  
  let optionSymbol;
  let optionDescription;
  let optionPremium;
  let optionExpiry;
  let optionContract;
  let optionType;
  let optionStrike;
  let optionVolume;
  let optionSpot;

  let optionOpenInterest;
  let optionSentiment;
  let optionPrice;
  let optionTradeCount;
  let optionExecutionEstimate;
  let optionExchange;

  /*
  async function infiniteHandler({ detail: { loaded, complete, error } }) {

		try {
      const lastId = rawData?.at(-1)?.id;
      const postData = {'lastId': lastId};
      const response = await fetch(data?.apiURL + '/options-flow-feed', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": data?.apiKey
        },
        body: JSON.stringify(postData),
      });
      const newData = await response.json();
      if(newData?.length === 0) {
        complete();
      }
      else {
        rawData = [...rawData,...newData];
        loaded();
      }
		} catch (e) {
			error();
		}
	}
  */
  function toggleMode()
  {
      if ($isOpen) {
        mode = !mode;
      }
      else {
        toast.error(`Market is closed`, {
            style: 'border-radius: 200px; background: #333; color: #fff;'
        });

      }
     
  }
  
  function formatTime(timeString) {
  // Split the time string into components
  const [hours, minutes, seconds] = timeString.split(':').map(Number);

  // Determine AM or PM
  const period = hours >= 12 ? 'PM' : 'AM';

  // Convert hours from 24-hour to 12-hour format
  const formattedHours = hours % 12 || 12; // Converts 0 to 12 for midnight

  // Format the time string
  const formattedTimeString = `${formattedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${period}`;

  return formattedTimeString;
}

function handleViewData(optionData) {
  //optionStart = optionData['Start Date'] === null ? 'n/a' : new Date(optionData['Start Date'])?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' });
  optionSymbol = optionData?.option_symbol;
  optionDescription = optionData?.description;
  optionPremium = abbreviateNumber(optionData?.cost_basis,true);
  optionExpiry = reformatDate(optionData?.date_expiration);
  optionContract = optionData?.put_call;
  optionType = optionData?.type;
  optionStrike = optionData?.strike_price;
  optionVolume = new Intl.NumberFormat("en", {minimumFractionDigits: 0, maximumFractionDigits: 0}).format(optionData?.volume);
  optionSpot = optionData?.underlying_price;
  optionOpenInterest = new Intl.NumberFormat("en", {minimumFractionDigits: 0, maximumFractionDigits: 0}).format(optionData?.open_interest);
  optionSentiment = optionData?.sentiment;
  optionPrice = optionData?.price;
  optionTradeCount = optionData?.tradeCount;
  optionExecutionEstimate = optionData?.executionEstimate;
  optionExchange = optionData?.exchange;

  const openPopup = $screenWidth < 640 ? document.getElementById("optionDetailsMobileModal") : document.getElementById("optionDetailsDesktopModal");
  openPopup?.dispatchEvent(new MouseEvent('click'))

}

  async function websocketRealtimeData() {
  
  try {
  socket = new WebSocket(data?.wsURL+"/options-flow-reader");
  
  
  socket.addEventListener('message', (event) => {
    previousCallVolume = displayCallVolume ?? 0;
    if(mode === true) {
        try {
            const newData = JSON.parse(event.data);
            if(rawData?.length !== newData?.length) {
                newIncomingData = true;
            }
            rawData = [...newData];
            
            // Apply current filters to the new rawData
            let filteredData = rawData;

            // Apply filterQuery if it exists
            if (filterQuery?.length !== 0) {
                filteredData = filteredData.filter(item => item?.ticker === filterQuery?.toUpperCase());
            }

            // Apply filterList if it exists
            if (filterList?.length !== 0) {
                filteredData = filterExpiringSoon(filteredData, Math.max(...filterList));
            }

            if (filteredData.length !== 0) {
                notFound = false;
            } else {
                notFound = true;
            }

            // Update displayedData instead of rawData
            displayedData = filteredData;

            calculateStats(displayedData);

            if (previousCallVolume !== displayCallVolume && !muted) {
                audio?.play();
            }
        }
        catch(e) {
            console.log(e)
        }
    }
});
  
  
  socket.addEventListener('close', (event) => {
      console.log('WebSocket connection closed:', event.reason);
      // Handle disconnection, you might want to attempt to reconnect here
    });
  } catch (error) {
    console.error('WebSocket connection error:', error);
    // Handle connection errors here
  }
  }
  
    

  onMount(async () => {
    audio = new Audio(notifySound);
    rawData = data?.getOptionsFlowFeed;
    displayedData = rawData;
    calculateStats(rawData);
    isLoaded = true;

    if ($isOpen) {
      await websocketRealtimeData();
    }


  });
  
onDestroy(async() => {


    if (typeof window !== 'undefined') 
    {
      socket?.close()
    }
    if (audio) {
      audio.pause();
      audio = null;
    }
  
  })
  

    async function assetSelector(symbol, assetType)
      {    

        if(assetType === 'etf')
        {
          etfTicker.update(value => symbol);
          goto(`/etf/${symbol}`)
        }
        else if(assetType === 'stock') {
          stockTicker.update(value => symbol);
          goto(`/stocks/${symbol}`)
        }
        
    }
    
  
  
  function reformatDate(dateString) {
      return dateString.substring(5, 7) + '/' + dateString.substring(8) + '/' + dateString.substring(2, 4);
  }
  
  
  
function calculateStats(data) {
    const { callVolumeSum, putVolumeSum, bullishCount, bearishCount } = data?.reduce((acc, item) => {
      const volume = parseInt(item?.volume);
  
      if (item?.put_call === "Calls") {
        acc.callVolumeSum += volume;
      } else if (item?.put_call === "Puts") {
        acc.putVolumeSum += volume;
      }

      if (item?.sentiment === "Bullish") {
        acc.bullishCount += 1;
      } else if (item?.sentiment === "Bearish") {
        acc.bearishCount += 1;
      }
  
        return acc;
      }, { callVolumeSum: 0, putVolumeSum: 0, bullishCount: 0, bearishCount: 0 });

      if(bullishCount > bearishCount) {
        flowSentiment = 'Bullish'
      }
      else if (bullishCount < bearishCount) {
        flowSentiment = 'Bearish'
      } else {
        flowSentiment = 'Neutral';
      }


      putCallRatio = callVolumeSum !== 0 ? (putVolumeSum / callVolumeSum) : 0;
      
      callPercentage = Math.floor((callVolumeSum)/(callVolumeSum+putVolumeSum)*100);
      putPercentage = (100-callPercentage);
  
      displayCallVolume = callVolumeSum;
      displayPutVolume = putVolumeSum;

      mostFrequentTicker = findMostFrequentTicker(data);
      highestVolumeTicker = findHighestVolume(data);
      highestPremiumTicker = findHighestCostBasis(data);
      highestOpenInterestTicker = findHighestOpenInterest(data);

  }
  
  function findMostFrequentTicker(data) {
    const tickerCountMap = new Map();
    // Iterate through the data and update the count for each ticker
    data?.forEach(item => {
      const ticker = item?.ticker;
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
        maxVolumeTicker = item?.ticker;
      }
    });
  
    return { ticker: maxVolumeTicker, volume: maxVolume };
  }
  
  function findHighestCostBasis(data) {
    let maxCostBasis = -1;
    let maxCostBasisTicker = null;
  
    // Iterate through the data and find the ticker with the highest cost basis
    data?.forEach(item => {
      if (item?.cost_basis > maxCostBasis) {
        maxCostBasis = item?.cost_basis;
        maxCostBasisTicker = item?.ticker;
      }
    });
  
    return { ticker: maxCostBasisTicker, costBasis: maxCostBasis };
  }
  
  function findHighestOpenInterest(data) {
    let maxOpenInterest = -1;
    let maxOpenInterestTicker = null;
  
    // Iterate through the data and find the ticker with the highest open interest
    data?.forEach(item => {
      const openInterest = parseInt(item?.open_interest); // Assuming open interest is a string, parse it to an integer
      if (openInterest > maxOpenInterest) {
        maxOpenInterest = openInterest;
        maxOpenInterestTicker = item?.ticker;
      }
    });
  
    return { ticker: maxOpenInterestTicker, openInterest: maxOpenInterest };
  }
  
  
  function handleInput(event) {
    filterQuery = event.target.value;

    setTimeout(() => {
        let filteredData = rawData;

        if (filterQuery?.length !== 0) {
            filteredData = rawData.filter(item => item?.ticker === filterQuery?.toUpperCase());
        }

        if (filteredData.length !== 0) {
            notFound = false;
        } else {
            notFound = true;
        }

        // Update a separate variable for displayed data, not rawData itself
        displayedData = filteredData;

        calculateStats(displayedData);
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

const debouncedHandleInput = debounce(handleInput, 300);


async function handleFilter(newFilter) {
    //e.preventDefault();
  
    const filterSet = new Set(filterList);
  
    // Check if the new filter already exists in the list
    if (filterSet?.has(newFilter)) {
      // If it exists, remove it from the list
      filterSet?.delete(newFilter);
    } else {
      // If it doesn't exist, add it to the list
      filterSet?.add(newFilter);
  
    }
    filterList = Array?.from(filterSet);
    //console.log(filterList)
  
  }
  
  
  
// Function to filter elements with date_expiration within a given number of days
const filterExpiringSoon = (data, days) => {
  const currentDate = new Date(); // Get today's date
  return data.filter(item => {
    const expirationDate = new Date(item?.date_expiration);
    const timeDiff = expirationDate - currentDate; // Time difference in milliseconds
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24); // Convert to days
    return daysDiff <= days && daysDiff >= 0; // Ensure it's within the specified number of days and not in the past
  });
};


$: {
    if(filterList && typeof window !== 'undefined' && mode === false)
    {
      if(filterList?.length !== 0)
      {
        const newData = filterExpiringSoon(rawData, Math.max(...filterList));
        if (newData?.length !== 0) {
            rawData = newData;
            notFound = false;
        } else {
            notFound = true;
            rawData = data?.getOptionsFlowFeed;
        }
        
      }
      else if (filterQuery?.length === 0) {
        rawData = data?.getOptionsFlowFeed;

      }
      calculateStats(rawData);
   }
  }



</script>
         
<svelte:options immutable={true} />
  
  <svelte:head>
  
  <meta charset="utf-8" />
  <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0">
  
  <title>
    {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Options Flow Feed · stocknear
  </title>
  <meta name="description" content={`Explore unusual options from big institutional traders and hedge funds.`} />
  
  <!-- Other meta tags -->
  <meta property="og:title" content={`Options Flow Feed · stocknear`}/>
  <meta property="og:description" content={`Explore unusual options from big institutional traders and hedge funds.`} />
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->
  
  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content={`Options Flow Feed · stocknear`}/>
  <meta name="twitter:description" content={`Explore unusual options from big institutional traders and hedge funds.`} />
  <!-- Add more Twitter meta tags as needed -->
  
  </svelte:head>
    
<body class="sm:fixed h-screen w-full max-w-screen-xl">

 

  <section class="w-full max-w-screen sm:max-w-6xl xl:max-w-7xl flex justify-center items-center pt-5 bg-[#09090B] ">
      
    
      <div class="w-full m-auto mb-10 pl-3 pr-3">

        <div class="text-sm sm:text-[1rem] breadcrumbs mb-5">
          <ul>
            <li><a href="/" class="text-gray-300">Home</a></li>
            <li class="text-gray-300">Options Flow</li>
          </ul>
        </div>

        {#if !$isOpen}
          <div class="text-white text-sm sm:text-[1rem] italic text-center sm:text-start w-full ml-2 mb-3">
            Live flow of {new Date(rawData?.at(0)?.date ?? null)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })} (NYSE Time)
          </div>
        {/if}

        

          <div class="flex flex-col sm:flex-row items-center w-full bg-[#262626] rounded-lg px-3">
          
  
              <div class="flex flex-row items-center justify-center sm:justify-start mt-6 pb-5">
                <label data-tip="Audio Preference" on:click={() => muted = !muted} class="xl:tooltip xl:tooltip-bottom flex flex-col items-center mr-6 cursor-pointer">
                  <div class="rounded-full w-10 h-10 relative bg-[#000] flex items-center justify-center">
                    {#if !muted}
                    <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="#fff" d="M9 2.5a.5.5 0 0 0-.849-.358l-2.927 2.85H3.5a1.5 1.5 0 0 0-1.5 1.5v2.99a1.5 1.5 0 0 0 1.5 1.5h1.723l2.927 2.875A.5.5 0 0 0 9 13.5zm1.111 2.689a.5.5 0 0 1 .703-.08l.002.001l.002.002l.005.004l.015.013l.046.04c.036.034.085.08.142.142c.113.123.26.302.405.54c.291.48.573 1.193.573 2.148c0 .954-.282 1.668-.573 2.148a3.394 3.394 0 0 1-.405.541a2.495 2.495 0 0 1-.202.196l-.008.007h-.001s-.447.243-.703-.078a.5.5 0 0 1 .075-.7l.002-.002l-.001.001l.002-.001h-.001l.018-.016c.018-.017.048-.045.085-.085a2.4 2.4 0 0 0 .284-.382c.21-.345.428-.882.428-1.63c0-.747-.218-1.283-.428-1.627a2.382 2.382 0 0 0-.368-.465a.5.5 0 0 1-.096-.717m1.702-2.08a.5.5 0 1 0-.623.782l.011.01l.052.045c.047.042.116.107.201.195c.17.177.4.443.63.794c.46.701.92 1.733.92 3.069a5.522 5.522 0 0 1-.92 3.065c-.23.35-.46.614-.63.79a3.922 3.922 0 0 1-.252.24l-.011.01h-.001a.5.5 0 0 0 .623.782l.033-.027l.075-.065c.063-.057.15-.138.253-.245a6.44 6.44 0 0 0 .746-.936a6.522 6.522 0 0 0 1.083-3.614a6.542 6.542 0 0 0-1.083-3.618a6.517 6.517 0 0 0-.745-.938a4.935 4.935 0 0 0-.328-.311l-.023-.019l-.007-.006l-.002-.002zM10.19 5.89l-.002-.001Z"/></svg>
                    {:else}
                    <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M3.28 2.22a.75.75 0 1 0-1.06 1.06L6.438 7.5H4.25A2.25 2.25 0 0 0 2 9.749v4.497a2.25 2.25 0 0 0 2.25 2.25h3.68a.75.75 0 0 1 .498.19l4.491 3.994c.806.716 2.081.144 2.081-.934V16.06l5.72 5.72a.75.75 0 0 0 1.06-1.061zm13.861 11.74l1.138 1.137A6.974 6.974 0 0 0 19 12a6.973 6.973 0 0 0-.84-3.328a.75.75 0 0 0-1.32.714c.42.777.66 1.666.66 2.614c0 .691-.127 1.351-.359 1.96m2.247 2.246l1.093 1.094A9.956 9.956 0 0 0 22 12a9.959 9.959 0 0 0-1.96-5.946a.75.75 0 0 0-1.205.892A8.459 8.459 0 0 1 20.5 12a8.458 8.458 0 0 1-1.112 4.206M9.52 6.338l5.48 5.48V4.25c0-1.079-1.274-1.65-2.08-.934z"/></svg>
                    {/if}
                  </div>
                </label>
                
  
              <span class="text-xs sm:text-sm sm:text-lg {!mode ? 'text-white' : 'text-gray-400'} mr-3">
                  Paused
              </span>
              
              <label class="inline-flex cursor-pointer relative focus-none">
                <input on:click={toggleMode} type="checkbox" class="toggle toggle-success" checked={mode} value={mode} disabled={!$isOpen ? true : false} />
              </label>

  
            
              <div class="ml-3 flex flex-col items-start">
                  <span class="text-xs sm:text-sm sm:text-lg {mode ? 'text-white' : 'text-gray-400'}">
                     Live Flow
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

            
            <div class="w-full grid grid-cols-1 lg:grid-cols-4 gap-y-3 gap-x-3 ">

              
              <!--Start Flow Sentiment-->  
              <div class="flex flex-row items-center flex-wrap w-full px-5 bg-[#262626] shadow-lg rounded-lg h-20">
                  <div class="flex flex-col items-start">
                      <span class="font-semibold text-gray-200 text-sm sm:text-lg ">Flow Sentiment</span>
                      <span class="text-start text-xl font-semibold {flowSentiment === 'Bullish' ? 'text-[#00FC50]' : 'text-[#FC2120]'}">{flowSentiment}</span>
                  </div>
                  
              </div>
              <!--End Flow Sentiment-->
               <!--Start Put/Call-->  
               <div class="flex flex-row items-center flex-wrap w-full px-5 bg-[#262626] shadow-lg rounded-lg h-20">
                <div class="flex flex-col items-start">
                    <span class="font-semibold text-gray-200 text-sm sm:text-lg ">Put/Call</span>
                    <span class="text-start text-lg font-semibold text-white">
                      {putCallRatio?.toFixed(3)}
                    </span>
                </div>
                <!-- Circular Progress -->
                  <div class="relative size-14 ml-auto">
                    <svg class="size-full w-14 h-14" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                      <!-- Background Circle -->
                      <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#3E3E3E]" stroke-width="3"></circle>
                      <!-- Progress Circle inside a group with rotation -->
                      <g class="origin-center -rotate-90 transform">
                        <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-blue-500" stroke-width="3" stroke-dasharray="100" stroke-dashoffset={putCallRatio >=1 ? 0 : 100-(putCallRatio*100)?.toFixed(2)}></circle>
                      </g>
                    </svg>
                    <!-- Percentage Text -->
                    <div class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
                      <span class="text-center text-white text-sm">{putCallRatio?.toFixed(2)}</span>
                    </div>
                  </div>
                <!-- End Circular Progress -->

            </div>
            <!--End Put/Call-->
             <!--Start Call Flow-->  
             <div class="flex flex-row items-center flex-wrap w-full px-5 bg-[#262626] shadow-lg rounded-lg h-20">
              <div class="flex flex-col items-start">
                  <span class="font-semibold text-gray-200 text-sm sm:text-lg ">Call Flow</span>
                  <span class="text-start text-lg font-semibold text-white">
                    {new Intl.NumberFormat("en", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                  }).format(displayCallVolume)}
                  </span>
              </div>
               <!-- Circular Progress -->
               <div class="relative size-14 ml-auto">
                <svg class="size-full w-14 h-14" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                  <!-- Background Circle -->
                  <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#3E3E3E]" stroke-width="3"></circle>
                  <!-- Progress Circle inside a group with rotation -->
                  <g class="origin-center -rotate-90 transform">
                    <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#00FC50]" stroke-width="3" stroke-dasharray="100" stroke-dashoffset={100-callPercentage?.toFixed(2)}></circle>
                  </g>
                </svg>
                <!-- Percentage Text -->
                <div class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
                  <span class="text-center text-white text-sm">{callPercentage}%</span>
                </div>
              </div>
              <!-- End Circular Progress -->
            </div>
            <!--End Call Flow-->
            <!--Start Put Flow-->  
            <div class="flex flex-row items-center flex-wrap w-full px-5 bg-[#262626] shadow-lg rounded-lg h-20">
              <div class="flex flex-col items-start">
                  <span class="font-semibold text-gray-200 text-sm sm:text-lg ">Put Flow</span>
                  <span class="text-start text-lg font-semibold text-white">
                    {new Intl.NumberFormat("en", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                  }).format(displayPutVolume)}
                  </span>
              </div>
               <!-- Circular Progress -->
               <div class="relative size-14 ml-auto">
                <svg class="size-full w-14 h-14" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                  <!-- Background Circle -->
                  <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#3E3E3E]" stroke-width="3"></circle>
                  <!-- Progress Circle inside a group with rotation -->
                  <g class="origin-center -rotate-90 transform">
                    <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#EE5365]" stroke-width="3" stroke-dasharray="100" stroke-dashoffset={100-putPercentage?.toFixed(2)}></circle>
                  </g>
                </svg>
                <!-- Percentage Text -->
                <div class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
                  <span class="text-center text-white text-sm">{putPercentage}%</span>
                </div>
              </div>
              <!-- End Circular Progress -->
            </div>
            <!--End Put Flow-->
  
            {#if showMore}
             <!--Start Most Traded-->  
             <div class="flex flex-row items-center flex-wrap w-full px-5 bg-[#262626] shadow-lg rounded-lg h-20">
              <div class="flex flex-col items-start">
                  <span class="font-semibold text-gray-200 text-sm sm:text-lg ">Most Traded Option</span>
                  <span class="text-start text-lg font-semibold text-white mt-0.5">
                    <span class="text-blue-400 ">
                      {mostFrequentTicker?.ticker}
                    </span>
                    {new Intl.NumberFormat("en", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                  }).format(mostFrequentTicker?.count)}
                  </span>
              </div>
            </div>
            <!--End Most Traded-->
  
             <!--Start Highest Premium-->  
             <div class="flex flex-row items-center flex-wrap w-full px-5 bg-[#262626] shadow-lg rounded-lg h-20">
              <div class="flex flex-col items-start">
                  <span class="font-semibold text-gray-200 text-sm sm:text-lg ">Highest Premium</span>
                  <span class="text-start text-lg font-semibold text-white mt-0.5">
                    <span class="text-blue-400 ">
                      {highestPremiumTicker?.ticker}
                    </span>
                    ${new Intl.NumberFormat("en", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                  }).format(highestPremiumTicker?.costBasis)}
                  </span>
              </div>
            </div>
            <!--End Highest Premium-->
  
            <!--Start Highest Volume-->  
            <div class="flex flex-row items-center flex-wrap w-full px-5 bg-[#262626] shadow-lg rounded-lg h-20">
              <div class="flex flex-col items-start">
                  <span class="font-semibold text-gray-200 text-sm sm:text-lg ">Highest Volume</span>
                  <span class="text-start text-lg font-semibold text-white mt-0.5">
                    <span class="text-blue-400 ">
                      {highestVolumeTicker?.ticker}
                    </span>
                    {new Intl.NumberFormat("en", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                  }).format(highestVolumeTicker?.volume)}
                  </span>
              </div>
            </div>
            <!--End Highest Volume-->
  
             <!--Start Highest Open Interest-->  
             <div class="flex flex-row items-center flex-wrap w-full px-5 bg-[#262626] shadow-lg rounded-lg h-20">
              <div class="flex flex-col items-start">
                  <span class="font-semibold text-gray-200 text-sm sm:text-lg ">Highest Open Interest</span>
                  <span class="text-start text-lg font-semibold text-white mt-0.5">
                    <span class="text-blue-400 ">
                      {highestOpenInterestTicker?.ticker}
                    </span>
                    {new Intl.NumberFormat("en", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                  }).format(highestOpenInterestTicker?.openInterest)}
                  </span>
              </div>
            </div>
            <!--End Highest Open Interest-->
  
            {/if}
  
            </div>
          </div>
          
          <!--Start Expand-->
          <label on:click={() => showMore=!showMore} class="cursor-pointer w-full flex justify-center items-center -mt-5 transition duration-150 ease-in-out group">
            <div class="tracking-normal group-hover:translate-y-0.5 transition-transform duration-150 ease-in-out">
              <svg class="w-10 h-10 {showMore ? 'rotate-180' : ''}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M12 14.373q-.162 0-.298-.053q-.137-.053-.267-.183L7.046 9.748q-.14-.14-.15-.344q-.01-.204.15-.364t.354-.16t.354.16L12 13.287l4.246-4.247q.14-.14.344-.15q.204-.01.364.15t.16.354q0 .194-.16.354l-4.389 4.389q-.13.13-.267.183q-.136.053-.298.053"/></svg>
            </div>
          </label>
          <!--End Expand-->
  
        
  
  
          <!-- Page wrapper -->
          <div class="flex justify-center w-full m-auto h-full overflow-hidden">
      
        
              <!-- Content area -->
              <div class="mt-4 w-full overflow-x-auto overflow-y-auto h-[850px] ">
                <div class="table-container">
                <div class="table">
                  <VirtualList
                    width="100%"
                    height={850}
                    itemCount={displayedData.length}
                    itemSize={40}
                  >
                    <div slot="header" class="tr th sticky z-40 top-0">
                      <div class="td bg-[#161618] text-slate-300 font-bold text-xs text-start uppercase">Time</div>
                        <div class="td bg-[#161618] font-bold text-slate-300 text-xs text-start uppercase">Symbol</div>
                        <div class="td bg-[#161618] text-slate-300 font-bold text-xs text-start uppercase">Expiry</div>
                        <div class="td bg-[#161618] text-slate-300 font-bold text-xs text-start uppercase">Strike</div>
                        <div class="td bg-[#161618] text-slate-300 font-bold text-xs text-start uppercase">C/P</div>
                        <div class="td bg-[#161618] text-slate-300 font-bold text-xs text-start uppercase">Sent.</div>
                        <div class="td bg-[#161618] text-slate-300 font-bold text-xs text-start uppercase">Spot</div>
                        <div class="td bg-[#161618] text-slate-300 font-bold text-xs text-start uppercase">Price</div>
                        <div class="td bg-[#161618] text-slate-300 font-bold text-xs text-start uppercase">Prem.</div>
                        <div class="td bg-[#161618] text-slate-300 font-bold text-xs text-start uppercase">Type</div>
                        <div class="td bg-[#161618] text-slate-300 font-bold text-xs text-end uppercase">Vol</div>
                        <div class="td bg-[#161618] text-slate-300 font-bold text-xs text-end uppercase">OI</div>
                    </div>
                
                    <div on:click={() => handleViewData(displayedData[index])} slot="item" let:index let:style {style} class="tr cursor-pointer">


                      <div style="justify-content: center;" class="td text-white pb-3 text-xs sm:text-sm text-start">
                        {formatTime(displayedData[index]?.time)}
                      </div>
  
                      <div on:click|stopPropagation={() => assetSelector(displayedData[index]?.ticker, displayedData[index]?.assetType)} style="justify-content: center;" class="td text-sm sm:text-[1rem] text-blue-400 font-normal">
                        {displayedData[index]?.ticker}
                      </div>

                      <div style="justify-content: center;" class="td text-sm sm:text-[1rem] text-white text-start">
                        {reformatDate(displayedData[index]?.date_expiration)}
                      </div>

                    <div style="justify-content: center;" class="td text-sm sm:text-[1rem] text-white text-start">
                      {displayedData[index]?.strike_price}
                    </div>

                    <div style="justify-content: center;" class="td  text-sm sm:text-[1rem] {displayedData[index]?.put_call === 'Calls' ? 'text-[#00FC50]' : 'text-[#FC2120]'} text-start">
                      {displayedData[index]?.put_call}
                    </div>

                    <div style="justify-content: center;" class="td  text-sm sm:text-[1rem] {displayedData[index]?.sentiment === 'Bullish' ? 'text-[#00FC50]' : displayedData[index]?.sentiment === 'Bearish' ? 'text-[#FC2120]' : 'text-[#C6A755]'} text-start">
                      {displayedData[index]?.sentiment}
                    </div>
  
                      <div style="justify-content: center;" class="td  text-sm sm:text-[1rem] text-start text-white">
                        {displayedData[index]?.underlying_price}
                      </div>
                    
                    <div style="justify-content: center;" class="td  text-sm sm:text-[1rem] text-start text-white">
                      {displayedData[index]?.price}
                    </div>
                    
                    <div style="justify-content: center;" class="td  text-sm sm:text-[1rem] text-start font-semibold {displayedData[index]?.put_call === 'Puts' ? 'text-[#CB281C]' : 'text-[#0FB307]'} ">
                      {abbreviateNumber(displayedData[index]?.cost_basis)}
                    </div>

                    <div style="justify-content: center;" class="td  text-sm sm:text-[1rem] text-start {displayedData[index]?.type === 'Sweep' ? 'text-[#C6A755]' : 'text-[#976DB7]'}">
                      {displayedData[index]?.type}
                    </div>
    
                    <div style="justify-content: center;" class="td  text-sm sm:text-[1rem] text-white text-end">
                        {new Intl.NumberFormat("en", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(displayedData[index]?.volume)}
                    </div>
    
                    <div style="justify-content: center;" class="td  text-sm sm:text-[1rem] text-white text-end">
                      {new Intl.NumberFormat("en", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    }).format(displayedData[index]?.open_interest)}
                    </div>

                    </div>
                  </VirtualList>
                </div>
              </div>
             
                  <!--<InfiniteLoading on:infinite={infiniteHandler} />-->    
    
          </div>
      
          </div>

          <!--
          <div class="relative bottom-[400px] w-fit m-auto flex justify-center items-center">
            <UpgradeToPro data={data} title="Get the recent Options Flow Data from Hedge Funds and major institutional traders to never miss out"/>
          </div>
          -->
  
         
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
      



      <!--Start View All List-->
<input type="checkbox" id="filterList" class="modal-toggle" />
    
<dialog id="filterList" class="modal modal-bottom sm:modal-middle ">


  <label id="filterList" for="filterList" class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
  
  
  <div class="modal-box w-full bg-[#09090B] sm:border sm:border-slate-800 overflow-hidden rounded-md">


    <div class="relative z-50 mx-2 max-h-[80vh] rounded bg-default opacity-100 bp:mx-3 sm:mx-4 w-full max-w-[1024px]" aria-modal="true">
      <label for="filterList" class="cursor-pointer absolute right-0 top-0 m-2 sm:right-1 sm:top-1" aria-label="Close">
        <svg class="w-6 h-6 text-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="max-width:40px">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </label>
    
      <div class="border-default p-3 xs:p-4 xl:w-[1024px]">
        <h3 class="mb-1 text-lg xs:mb-2 text-white font-semibold">
          Filter Expiration Dates up to 
        </h3>
      </div> 
    
      <div class="h-[35vh] sm:h-[10vh] overflow-auto overscroll-contain px-3 pb-4 xs:h-[60vh] xs:px-4 lg:max-h-[600px] mt-5">
        <div>
          <div class="flex flex-wrap">
            <div class="flex w-full items-center space-x-1.5 py-1.5 md:w-1/2 lg:w-1/3 lg:py-1">
              <input on:click={() => handleFilter(7)} id="oneWeek" type="checkbox" class="cursor-pointer h-[18px] w-[18px] rounded-sm ring-offset-0 bg-gray-600 lg:h-4 lg:w-4">
              <div class="-mt-0.5">
                <label for="oneWeek" class="cursor-pointer text-white lg:text-sm">1 Week</label>  
              </div>
            </div>
            <div class="flex w-full items-center space-x-1.5 py-1.5 md:w-1/2 lg:w-1/3 lg:py-1">
              <input on:click={() => handleFilter(30)} id="oneMonth" type="checkbox" class="cursor-pointer h-[18px] w-[18px] rounded-sm ring-offset-0 bg-gray-600 lg:h-4 lg:w-4">
              <div class="-mt-0.5">
                <label for="oneMonth" class="cursor-pointer text-white lg:text-sm">1 Month</label>
              </div>
            </div>
           <div class="flex w-full items-center space-x-1.5 py-1.5 md:w-1/2 lg:w-1/3 lg:py-1">
              <input on:click={() => handleFilter(90)} id="threeMonths" type="checkbox" class="cursor-pointer h-[18px] w-[18px] rounded-sm ring-offset-0 bg-gray-600 lg:h-4 lg:w-4">
              <div class="-mt-0.5">
                <label for="threeMonths" class="cursor-pointer text-white lg:text-sm">3 Months</label>
              </div>
            </div>

            <div class="flex w-full items-center space-x-1.5 py-1.5 md:w-1/2 lg:w-1/3 lg:py-1">
              <input on:click={() => handleFilter(180)} id="sixMonths" type="checkbox" class="cursor-pointer h-[18px] w-[18px] rounded-sm ring-offset-0 bg-gray-600 lg:h-4 lg:w-4">
              <div class="-mt-0.5">
                <label for="sixMonths" class="cursor-pointer text-white lg:text-sm">6 Months</label>
              </div>
            </div>

            <div class="flex w-full items-center space-x-1.5 py-1.5 md:w-1/2 lg:w-1/3 lg:py-1">
              <input on:click={() => handleFilter(365)} id="oneYear" type="checkbox" class="cursor-pointer h-[18px] w-[18px] rounded-sm ring-offset-0 bg-gray-600 lg:h-4 lg:w-4">
              <div class="-mt-0.5">
                <label for="oneYear" class="cursor-pointer text-white lg:text-sm">1 Year</label>
              </div>
            </div>

            <div on:click={() => handleFilter(1095)} class="flex w-full items-center space-x-1.5 py-1.5 md:w-1/2 lg:w-1/3 lg:py-1">
              <input id="threeYears" type="checkbox" class="cursor-pointer h-[18px] w-[18px] rounded-sm ring-offset-0 bg-gray-600 lg:h-4 lg:w-4">
              <div class="-mt-0.5">
                <label for="threeYears" class="cursor-pointer text-white lg:text-sm">3 Years</label>
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>

        
      </div>
  </dialog>





<!--Start Options Detail Desktop Modal-->


<!-- Put this part before </body> tag -->
<input type="checkbox" id="optionDetailsDesktopModal" class="modal-toggle" />

<label for="optionDetailsDesktopModal" class="modal modal-bottom sm:modal-middle cursor-pointer">

  <label for="optionDetailsDesktopModal"  class="cursor-pointer modal-backdrop"></label>



  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label class="modal-box w-full relative bg-[#09090B] h-auto max-h-[900px] border border-gray-800 overflow-y-scroll">
    <label for="optionDetailsDesktopModal" class="cursor-pointer absolute right-5 top-2 bg-[#09090B] text-2xl text-white">
      ✕
    </label>

    <p class="text-gray-200 mt-10">
      <span class="text-white text-xl font-semibold">Order Details:</span>
      <br>
      {optionSymbol}

    </p>
    <p class="py-4 text-gray-200 bg-[#09090B] w-full">
      <span class="font-semibold text-white">Description:</span>
      <br>
      {optionDescription}
    </p>

    <table class="table table-sm table-compact bg-[#09090B] w-full mt-5 mb-10 text-white">
      <tbody>
        <!-- row 1 -->
        <tr class="border-b border-slate-700 odd:bg-[#27272A]">
          <td class="font-semibold">Premium</td>
          <td class="">{optionPremium}</td>
          <td class="font-semibold">C/P</td>
          <td class="">{optionContract}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A]">
          <td class="font-semibold">Expiry</td>
          <td class="">{optionExpiry}</td>
          <td class="font-semibold">Type</td>
          <td class="">{optionType}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A]">
          <td class="font-semibold">Strike</td>
          <td class="">${optionStrike}</td>
          <td class="font-semibold">Volume</td>
          <td class="">{optionVolume}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A]">
          <td class="font-semibold">Spot</td>
          <td class="">${optionSpot}</td>
          <td class="font-semibold">Open Interest</td>
          <td class="">{optionOpenInterest}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A]">
          <td class="font-semibold">Price</td>
          <td class="">${optionPrice}</td>
          <td class="font-semibold">Sentiment</td>
          <td class="">{optionSentiment}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A]">
          <td class="font-semibold">Execution Estimate</td>
          <td class="">{optionExecutionEstimate}</td>
          <td class="font-semibold"></td>
          <td class=""></td>
        </tr>
      </tbody>
    </table>


  </label>
</label>


<!--End Options Detial Desktop Modal-->

  <!--Start Options Detail Modal-->
  <!--
<div class="hidden drawer drawer-end z-[999] w-full overflow-hidden">
  <input id="optionDetailsMobileModal" type="checkbox" class="drawer-toggle"/>
  <div class="drawer-side overflow-hidden z-[999]">
  
      
    <div class="bg-[#000] min-h-screen w-full border pb-20 overflow-hidden">

        <label for="optionDetailsMobileModal" class="absolute left-6 top-6">
          <svg class="w-6 h-6 inline-block mb-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M9.125 21.1L.7 12.7q-.15-.15-.213-.325T.425 12q0-.2.063-.375T.7 11.3l8.425-8.425q.35-.35.875-.35t.9.375q.375.375.375.875t-.375.875L3.55 12l7.35 7.35q.35.35.35.863t-.375.887q-.375.375-.875.375t-.875-.375Z"/></svg>
        </label>

  
  <div class="w-fit border overflow-hidden p-2">

    <p class="text-xl font-semibold text-white mt-16 p-3">
      <span class="text-xl font-semibold">Order Details:</span>
      <br>
      {optionSymbol}
    </p>
    <p class="py-4 text-gray-200 w-full p-3">
      <span class="font-semibold text-white">Description:</span>
      {optionDescription}
    </p>

    <table class="table table-sm table-compact w-full mt-5 mb-10 text-white">
      <tbody>
        <tr class="border-b border-slate-700 odd:bg-[#27272A]">
          <td class="font-semibold">Premium</td>
          <td class="">{optionPremium}</td>
          <td class="font-semibold">C/P</td>
          <td class="">{optionContract}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A]">
          <td class="font-semibold">Expiry</td>
          <td class="">{optionExpiry}</td>
          <td class="font-semibold">Type</td>
          <td class="">{optionType}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A]">
          <td class="font-semibold">Strike</td>
          <td class="">${optionStrike}</td>
          <td class="font-semibold">Volume</td>
          <td class="">{optionVolume}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A]">
          <td class="font-semibold">Spot</td>
          <td class="">${optionSpot}</td>
          <td class="font-semibold">Open Interest</td>
          <td class="">{optionOpenInterest}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A]">
          <td class="font-semibold">Price</td>
          <td class="">${optionPrice}</td>
          <td class="font-semibold">Sentiment</td>
          <td class="">{optionSentiment}</td>
        </tr>
        <tr class="odd:bg-[#27272A]">
          <td class="font-semibold">Trade Count</td>
          <td class="">{optionTradeCount}</td>
          <td class="font-semibold">Exchange</td>
          <td class="">{optionExchange}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A]">
          <td class="font-semibold">Execution Est.</td>
          <td class="">{optionExecutionEstimate}</td>
          <td class="font-semibold"></td>
          <td class=""></td>
        </tr>
      </tbody>
    </table>

        
  </div>

</div>
</div>
</div>
-->
<!--End Options Detail Modal-->

<style>
  .table-container {
      width: 100%;
      overflow-x: auto;
  }

  .table :global(.virtual-list-inner) {
        width: 100%;
        display: flex;
        flex-direction: column;
    }

    @media (max-width: 768px) {
        .table {
            width: 1000px;
        }
    }

  .table .virtual-list-inner {
      flex-flow: column nowrap;
      font-size: .8rem;
      line-height: 1.5;
      flex: 1 1 auto;
  }

  .th {
      display: none;
      font-weight: 700;
      background-color: #09090B;
  }

  .th > .td {
      white-space: normal;
      justify-content: center;
  }

  .tr {
      width: 100%;
      display: flex;
      flex-flow: row nowrap;
  }

  .tr:nth-of-type(even) {
      background-color: #27272A;
  }

  .tr:nth-of-type(odd) {
      background-color: #09090B;
  }

  .td {
      display: flex;
      flex-flow: row nowrap;
      flex-grow: 1;
      flex-basis: 0;
      padding: 0.5em;
      word-break: break-word;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0px;
      white-space: nowrap;
      border-bottom: 1px solid #09090B;
  }
</style>

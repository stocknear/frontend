<script lang='ts'>
    import { goto } from '$app/navigation';
    import { screenWidth, userRegion, numberOfUnreadNotification, etfTicker, stockTicker, isOpen } from '$lib/store';
    import notifySound from '$lib/audio/options-flow-reader.mp3';
    import UpgradeToPro from '$lib/components/UpgradeToPro.svelte';
    import { abbreviateNumber } from '$lib/utils';

    import { onMount, onDestroy } from 'svelte';
    
    export let data;
    
    let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;
    
    
    const usRegion = ['cle1','iad1','pdx1','sfo1'];
    let wsURL;
    
    userRegion?.subscribe(value => {
    if (usRegion?.includes(value)) {
      wsURL = import.meta.env.VITE_USEAST_WS_URL;
    } else {
      wsURL = import.meta.env.VITE_EU_WS_URL;
    }
    });
    
    let optionList = []
    let rawData = [];
    
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


    let audio;
    let muted = true;
    let socket;
    let filterQuery = '';
    let previousCallVolume = 0; //This is needed to play the sound only if it changes.
    let notFound = false;
    let showMore = false;

    let isLoaded = false;
    let mode = $isOpen === true ? true : false;
    
function toggleMode()
{   
    mode = !mode;
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
    socket = new WebSocket(wsURL+"/options-zero-dte-reader");


    socket.addEventListener('message', (event) => {
      const newData = event.data;
      previousCallVolume = displayCallVolume ?? 0;
      if(mode === true) {
      try {
          rawData = [...JSON?.parse(newData)];
          
          if (filterQuery?.length !== 0) {
              const newData = [...rawData?.filter(item => item?.ticker === filterQuery?.toUpperCase())];
              if (newData?.length !== 0) {
              notFound = false;
              rawData = [...newData]
              optionList = rawData?.slice(0,20); //newData?.slice(0,20) //[...newData];
              }
              else {
                  optionList = rawData?.slice(0,20);
                  notFound = true;
                  
              }
          } else {
              notFound = false;
              optionList = rawData?.slice(0,20);
          }
  
          calculateStats(rawData);
          if(previousCallVolume !== displayCallVolume && !muted) {
          audio?.play()
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

    audio = new Audio(notifySound)
    rawData = data?.getOptionsZeroDTE;
    optionList = rawData?.slice(0,20);
    calculateStats(rawData)
    isLoaded = true;

    if ($isOpen) //&& currentDateTime > startTime && currentDateTime < endTime
    {
    await websocketRealtimeData()
    }
    if(data?.user?.tier === 'Pro') {
    window.addEventListener('scroll', handleScroll);
    return () => {
        window.removeEventListener('scroll', handleScroll);
    };
    }

})
    
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
    
    
async function handleScroll() {
    const scrollThreshold = document.body.offsetHeight * 0.8; // 80% of the website height
    const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;
    if (isBottom && optionList?.length !== rawData?.length) {
        const nextIndex = optionList?.length;
        const filteredNewResults = rawData?.slice(nextIndex, nextIndex + 25);
        optionList = [...optionList, ...filteredNewResults];
    }
}


function reformatDate(dateString) {
      return dateString.substring(5, 7) + '/' + dateString.substring(8) + '/' + dateString.substring(2, 4);
  }
  
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

    
    
function calculateStats(optionList) {
    const { callVolumeSum, putVolumeSum, bullishCount, bearishCount } = optionList?.reduce((acc, item) => {
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
      
    putCallRatio = (putVolumeSum/callVolumeSum);

    callPercentage = Math.floor((callVolumeSum)/(callVolumeSum+putVolumeSum)*100);
    putPercentage = (100-callPercentage);

    displayCallVolume = callVolumeSum;
    displayPutVolume = putVolumeSum;

    mostFrequentTicker = findMostFrequentTicker(rawData);
    highestVolumeTicker = findHighestVolume(rawData);
    highestPremiumTicker = findHighestCostBasis(rawData);
    highestOpenInterestTicker = findHighestOpenInterest(rawData);
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
    let newData = [];
    setTimeout(() => {
        if (filterQuery?.length !== 0) {
            newData = [...rawData?.filter(item => item?.ticker === filterQuery?.toUpperCase())];
            if (newData?.length !== 0) {
                rawData = newData;
                optionList = rawData?.slice(0, 20);
                notFound = false;
                console.log('test');
            } else {
                notFound = true;
                rawData = data?.getOptionsZeroDTE;
                optionList = rawData?.slice(0, 20);
            }
        } else {
            notFound = false;
            rawData = data?.getOptionsZeroDTE;
            optionList = rawData?.slice(0, 20);
        }
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
    
</script>
           
      
    
    
<svelte:head>

<meta charset="utf-8" />
<meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0">

<title>
{$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Options 0DTE Flow Feed · stocknear
</title>
<meta name="description" content={`Explore unusual options from big institutional traders and hedge funds.`} />

<!-- Other meta tags -->
<meta property="og:title" content={`Options 0DTE Flow Feed · stocknear`}/>
<meta property="og:description" content={`Explore unusual options from big institutional traders and hedge funds.`} />
<meta property="og:type" content="website"/>
<!-- Add more Open Graph meta tags as needed -->

<!-- Twitter specific meta tags -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content={`Options 0DTE Flow Feed · stocknear`}/>
<meta name="twitter:description" content={`Explore unusual options from big institutional traders and hedge funds.`} />
<!-- Add more Twitter meta tags as needed -->

</svelte:head>

<section class="w-full max-w-5xl overflow-hidden m-auto min-h-screen pt-5 pb-40 bg-[#0F0F0F]">



<div class="w-full max-w-5xl m-auto sm:bg-[#202020] sm:rounded-xl h-auto pl-10 pr-10 pt-5 sm:pb-10 sm:pt-10 mt-3 mb-8">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
    
        <!-- Start Column -->
        <div>
        <div class="flex flex-row justify-center items-center">
            <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
            0DTE Options Flow
            </h1>
        </div>

        <span class="text-white text-md font-medium text-center flex justify-center items-center ">
            Realtime update of same day expiration options contracts from large institutional traders and hedge funds.
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
        
        
        <div class="z-1 absolute top-6 right-1">
            <img class="w-32 h-fit mr-2" src={cloudFrontUrl+'/assets/0dte_logo.png'} alt="logo" loading="lazy">
        </div>
        </div>
        <!-- End Column -->
    </div>

    

    </div>
                


<div class="w-full m-auto mb-10 bg-[#0F0F0F] pl-3 pr-3">
    <div class="flex flex-col sm:flex-row items-center w-full">
        {#if !$isOpen}
        <span class="text-white text-sm sm:text-md italic mt-5 text-center sm:text-start w-full ml-2 mb-5">
            Live flow of {new Date(optionList?.at(0)?.date ?? null)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })} (NYSE Time)
        </span>
        {/if}

    

        <div class="flex flex-row items-center justify-center sm:justify-end mt-6 pb-5 w-full">

            <label on:click={() => muted = !muted} class="flex flex-col items-center mr-6 cursor-pointer">
            {#if !muted}
            <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="#20C997" d="M9 2.5a.5.5 0 0 0-.849-.358l-2.927 2.85H3.5a1.5 1.5 0 0 0-1.5 1.5v2.99a1.5 1.5 0 0 0 1.5 1.5h1.723l2.927 2.875A.5.5 0 0 0 9 13.5zm1.111 2.689a.5.5 0 0 1 .703-.08l.002.001l.002.002l.005.004l.015.013l.046.04c.036.034.085.08.142.142c.113.123.26.302.405.54c.291.48.573 1.193.573 2.148c0 .954-.282 1.668-.573 2.148a3.394 3.394 0 0 1-.405.541a2.495 2.495 0 0 1-.202.196l-.008.007h-.001s-.447.243-.703-.078a.5.5 0 0 1 .075-.7l.002-.002l-.001.001l.002-.001h-.001l.018-.016c.018-.017.048-.045.085-.085a2.4 2.4 0 0 0 .284-.382c.21-.345.428-.882.428-1.63c0-.747-.218-1.283-.428-1.627a2.382 2.382 0 0 0-.368-.465a.5.5 0 0 1-.096-.717m1.702-2.08a.5.5 0 1 0-.623.782l.011.01l.052.045c.047.042.116.107.201.195c.17.177.4.443.63.794c.46.701.92 1.733.92 3.069a5.522 5.522 0 0 1-.92 3.065c-.23.35-.46.614-.63.79a3.922 3.922 0 0 1-.252.24l-.011.01h-.001a.5.5 0 0 0 .623.782l.033-.027l.075-.065c.063-.057.15-.138.253-.245a6.44 6.44 0 0 0 .746-.936a6.522 6.522 0 0 0 1.083-3.614a6.542 6.542 0 0 0-1.083-3.618a6.517 6.517 0 0 0-.745-.938a4.935 4.935 0 0 0-.328-.311l-.023-.019l-.007-.006l-.002-.002zM10.19 5.89l-.002-.001Z"/></svg>
            <span class="text-[#20C997] text-xs">
                Sounds on
            </span>
            {:else}
            <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#EE5365" d="M3.28 2.22a.75.75 0 1 0-1.06 1.06L6.438 7.5H4.25A2.25 2.25 0 0 0 2 9.749v4.497a2.25 2.25 0 0 0 2.25 2.25h3.68a.75.75 0 0 1 .498.19l4.491 3.994c.806.716 2.081.144 2.081-.934V16.06l5.72 5.72a.75.75 0 0 0 1.06-1.061zm13.861 11.74l1.138 1.137A6.974 6.974 0 0 0 19 12a6.973 6.973 0 0 0-.84-3.328a.75.75 0 0 0-1.32.714c.42.777.66 1.666.66 2.614c0 .691-.127 1.351-.359 1.96m2.247 2.246l1.093 1.094A9.956 9.956 0 0 0 22 12a9.959 9.959 0 0 0-1.96-5.946a.75.75 0 0 0-1.205.892A8.459 8.459 0 0 1 20.5 12a8.458 8.458 0 0 1-1.112 4.206M9.52 6.338l5.48 5.48V4.25c0-1.079-1.274-1.65-2.08-.934z"/></svg>
                <span class="text-[#EE5365] text-xs">
                Sounds off
            </span>
                {/if}
            </label>


        <span class="text-xs sm:text-sm {!mode ? 'text-white' : 'text-gray-400'} mr-3">
            Paused
        </span>

        <label class="inline-flex cursor-pointer relative focus-none">
            <input on:click={toggleMode} type="checkbox" class="toggle toggle-success" checked={mode} value={mode} disabled={!$isOpen ? true : false}  />
        </label>

        
        <div class="ml-3 flex flex-col items-start">
            <span class="text-xs sm:text-sm {mode ? 'text-white' : 'text-gray-400'}">
                Live Flow
            </span>
        </div>



        
    </div>
        
    </div>

    



    {#if isLoaded }

    <div class="w-full mt-5 mb-10 m-auto flex justify-center items-center">
        <div class="w-full grid grid-cols-2 lg:grid-cols-4 gap-y-3 gap-x-3 ">
        <!--Start Flow Sentiment-->  
        <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 bg-[#262626] shadow-lg rounded-2xl h-20">
            <div class="flex flex-col items-start">
                <span class="font-medium text-gray-200 text-sm ">Flow Sentiment</span>
                <span class="text-start text-[1rem] font-medium {flowSentiment === 'Bullish' ? 'text-[#00FC50]' : 'text-[#FC2120]'}">{flowSentiment}</span>
            </div>
            
        </div>
        <!--End Flow Sentiment-->
         <!--Start Put/Call-->  
         <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 bg-[#262626] shadow-lg rounded-2xl h-20">
          <div class="flex flex-col items-start">
              <span class="font-medium text-gray-200 text-sm ">Put/Call</span>
              <span class="text-start text-sm sm:text-[1rem] font-medium text-white">
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
                  <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-blue-500" stroke-width="3" stroke-dasharray="100" stroke-dashoffset={100-(putCallRatio*100)?.toFixed(2)}></circle>
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
       <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 bg-[#262626] shadow-lg rounded-2xl h-20">
        <div class="flex flex-col items-start">
            <span class="font-medium text-gray-200 text-sm ">Call Flow</span>
            <span class="text-start text-sm sm:text-[1rem] font-medium text-white">
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
      <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 bg-[#262626] shadow-lg rounded-2xl h-20">
        <div class="flex flex-col items-start">
            <span class="font-medium text-gray-200 text-sm ">Put Flow</span>
            <span class="text-start text-sm sm:text-[1rem] font-medium text-white">
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
      <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 bg-[#262626] shadow-lg rounded-lg h-20">
       <div class="flex flex-col items-start">
           <span class="font-medium text-gray-200 text-sm ">Most Traded Option</span>
           <span class="text-start text-sm sm:text-[1rem] font-medium text-white mt-0.5">
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
      <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 bg-[#262626] shadow-lg rounded-lg h-20">
       <div class="flex flex-col items-start">
           <span class="font-medium text-gray-200 text-sm ">Highest Premium</span>
           <span class="text-start text-sm sm:text-[1rem] font-medium text-white mt-0.5">
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
     <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 bg-[#262626] shadow-lg rounded-lg h-20">
       <div class="flex flex-col items-start">
           <span class="font-medium text-gray-200 text-sm ">Highest Volume</span>
           <span class="text-start text-sm sm:text-[1rem] font-medium text-white mt-0.5">
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
           <span class="font-medium text-gray-200 text-sm ">Highest Open Interest</span>
           <span class="text-start text-sm sm:text-[1rem] font-medium text-white mt-0.5">
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
    

    {#if rawData?.length !== 0}
          <!--Start Filter-->
          <div class="w-full pb-3 mt-10 sm:mt-0">
            <div class="relative right-0 bg-[#0F0F0F]">
              <ul class="relative grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-3 flex flex-wrap p-1 list-none rounded-[3px]">
                <li class="pl-3 py-1.5 flex-auto text-center bg-[#2E3238] rounded-[3px]">
          <label class="flex flex-row items-center">
            <input 
            id="modal-search"
              type="search" 
              class="text-white sm:ml-2 text-sm sm:text-[1rem] placeholder-gray-400 border-transparent focus:border-transparent focus:ring-0 flex items-center justify-center w-full px-0 py-1 bg-inherit"
              placeholder="Find by Symbol"
              bind:value={filterQuery}
              on:input={debouncedHandleInput}
              autocomplete="off"
            />
            <svg class="ml-auto h-7 w-7 sm:h-8 sm:w-8 inline-block mr-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="m19.485 20.154l-6.262-6.262q-.75.639-1.725.989t-1.96.35q-2.402 0-4.066-1.663T3.808 9.503T5.47 5.436t4.064-1.667t4.068 1.664T15.268 9.5q0 1.042-.369 2.017t-.97 1.668l6.262 6.261zM9.539 14.23q1.99 0 3.36-1.37t1.37-3.361t-1.37-3.36t-3.36-1.37t-3.361 1.37t-1.37 3.36t1.37 3.36t3.36 1.37"/></svg>
          </label>
          {#if notFound === true}
          <span class="label-text text-error text-[0.65rem] mt-1">
              No Results Found
          </span>
          {/if}
          </li>
          </ul>
        </div>
      </div>
          <!--End Filter-->


    
    <!-- Page wrapper -->
    <div class="flex justify-center w-full max-w-5xl m-auto h-full overflow-hidden mt-3">

    
        <!-- Content area -->
        <div class="mt-4 w-full overflow-x-auto">     
            <table class="table table-pin-cols table-sm table-compact">
                <thead>
                <tr class="">
                    <td class="text-slate-200 font-semibold text-sm text-start">Time</td>
                    <th class="bg-[#0F0F0F] text-slate-200 font-semibold text-sm text-start">Symbol</th>
                    <td class="text-slate-200 font-semibold text-sm text-start">Strike</td>
                    <td class="text-slate-200 font-semibold text-sm text-start">C/P</td>
                    <td class="text-slate-200 font-semibold text-sm text-start">Sent.</td>
                    <td class="text-slate-200 font-semibold text-sm text-start">Spot</td>
                    <td class="text-slate-200 font-semibold text-sm text-start">Price</td>
                    <td class="text-slate-200 font-semibold text-sm text-start">Prem.</td>
                    <td class="text-slate-200 font-semibold text-sm text-start">Type</td>
                    <td class="text-slate-200 font-semibold text-sm text-end">Vol.</td>
                    <td class="text-slate-200 font-semibold text-sm text-end">OI</td>
                </tr>
                </thead>
                <tbody>
                {#each optionList as item,index}
                <!-- row -->
                <tr on:click={() => handleViewData(item)} class="w-full odd:bg-[#202020] cursor-pointer {index+1 === optionList?.length && data?.user?.tier !== 'Pro' ? 'opacity-[0.1]' : ''}">
                    
                  <td class="text-white pb-3 text-xs sm:text-sm text-start">
                    {formatTime(item?.time)}
                  </td>

                <th on:click|stopPropagation={() => assetSelector(item?.ticker, item?.assetType)} class="{index % 2 ? 'bg-[#0F0F0F]' : 'bg-[#202020]'} text-blue-400 text-start font-normal">
                  {item?.ticker}
                </th>

                <td class="text-white text-start">
                    {item?.strike_price}
                </td>

                <td class="{item?.put_call === 'Calls' ? 'text-[#00FC50]' : 'text-[#FC2120]'} text-start">
                  {item?.put_call}
                </td>

                <td class="{item?.sentiment === 'Bullish' ? 'text-[#00FC50]' : 'text-[#FC2120]'} text-start">
                    {item?.sentiment}
                </td>

                <td class="text-sm text-start text-white">
                    {item?.underlying_price}
                </td>
                
                <td class="text-sm text-start text-white">
                    {item?.price}
                </td>
                
                <td class="text-sm text-start font-medium {item?.put_call === 'Puts' ? 'text-[#CB281C]' : 'text-[#0FB307]'} ">
                    {abbreviateNumber(item?.cost_basis)}
                </td>

                <td class="text-sm text-start {item?.type === 'Sweep' ? 'text-[#C6A755]' : 'text-[#976DB7]'}">
                    {item?.type}
                </td>

    

                <td class="text-white text-end">
                    {new Intl.NumberFormat("en", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    }).format(item?.volume)}
                </td>

                <td class="text-white text-end">
                    {new Intl.NumberFormat("en", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(item?.open_interest)}
                </td>

            
    
    
                </tr>
                
            
                {/each}
                </tbody>
            </table>

            <!--<InfiniteLoading on:infinite={infiniteHandler} />-->


    </div>

    </div>

    <UpgradeToPro data={data} title="Get the recent Options Flow Data from Hedge Funds and major institutional traders to never miss out"/>

    {:else}
    <div class="mt-10 w-full text-center justify-center max-w-96 sm:flex sm:flex-row sm:items-center m-auto text-gray-100 bg-[#202020] sm:rounded-lg h-auto p-5 mb-4">
        <svg class="w-5 h-5 inline-block sm:mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#a474f6" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
        No 0DTE Contracts filed yet!
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
</div>        

</section>








<!--Start Options Detail Desktop Modal-->


<!-- Put this part before </body> tag -->
<input type="checkbox" id="optionDetailsDesktopModal" class="modal-toggle" />

<label for="optionDetailsDesktopModal" class="hidden sm:modal modal-bottom sm:modal-middle cursor-pointer">

  <label for="optionDetailsDesktopModal"  class="cursor-pointer modal-backdrop"></label>



  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label class="modal-box w-full relative bg-[#202020] h-auto max-h-[900px] overflow-y-scroll">
    <label for="optionDetailsDesktopModal" class="cursor-pointer absolute right-5 top-2 bg-[#202020] text-2xl text-white">
      ✕
    </label>

    <p class="text-gray-200 mt-10">
      <span class="text-white text-xl font-semibold">Order Details:</span>
      <br>
      {optionSymbol}

    </p>
    <p class="py-4 text-gray-200 bg-[#202020] w-full">
      <span class="font-semibold text-white">Description:</span>
      <br>
      {optionDescription}
    </p>

    <table class="table table-sm table-compact bg-[#202020] w-full mt-5 mb-10 text-white">
      <tbody>
        <!-- row 1 -->
        <tr class="border-b border-slate-700 odd:bg-[#202020]">
          <td class="font-semibold">Premium</td>
          <td class="">{optionPremium}</td>
          <td class="font-semibold">C/P</td>
          <td class="">{optionContract}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#202020]">
          <td class="font-semibold">Expiry</td>
          <td class="">{optionExpiry}</td>
          <td class="font-semibold">Type</td>
          <td class="">{optionType}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#202020]">
          <td class="font-semibold">Strike</td>
          <td class="">${optionStrike}</td>
          <td class="font-semibold">Volume</td>
          <td class="">{optionVolume}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#202020]">
          <td class="font-semibold">Spot</td>
          <td class="">${optionSpot}</td>
          <td class="font-semibold">Open Interest</td>
          <td class="">{optionOpenInterest}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#202020]">
          <td class="font-semibold">Price</td>
          <td class="">${optionPrice}</td>
          <td class="font-semibold">Sentiment</td>
          <td class="">{optionSentiment}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#202020]">
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
<div class="sm:hidden drawer drawer-end z-40 overflow-hidden w-screen">
  <input id="optionDetailsMobileModal" type="checkbox" class="drawer-toggle"/>
  <div class="drawer-side overflow-hidden">
  
      
    <div class="bg-[#000] min-h-screen w-screen pb-20 overflow-hidden">

        <label for="optionDetailsMobileModal" class="absolute left-6 top-6">
          <svg class="w-6 h-6 inline-block mb-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M9.125 21.1L.7 12.7q-.15-.15-.213-.325T.425 12q0-.2.063-.375T.7 11.3l8.425-8.425q.35-.35.875-.35t.9.375q.375.375.375.875t-.375.875L3.55 12l7.35 7.35q.35.35.35.863t-.375.887q-.375.375-.875.375t-.875-.375Z"/></svg>
        </label>

  
  <div class="w-full overflow-hidden overflow-y-scroll p-2">

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
        <!-- row 1 -->
        <tr class="border-b border-slate-700 odd:bg-[#202020]">
          <td class="font-semibold">Premium</td>
          <td class="">{optionPremium}</td>
          <td class="font-semibold">C/P</td>
          <td class="">{optionContract}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#202020]">
          <td class="font-semibold">Expiry</td>
          <td class="">{optionExpiry}</td>
          <td class="font-semibold">Type</td>
          <td class="">{optionType}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#202020]">
          <td class="font-semibold">Strike</td>
          <td class="">${optionStrike}</td>
          <td class="font-semibold">Volume</td>
          <td class="">{optionVolume}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#202020]">
          <td class="font-semibold">Spot</td>
          <td class="">${optionSpot}</td>
          <td class="font-semibold">Open Interest</td>
          <td class="">{optionOpenInterest}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#202020]">
          <td class="font-semibold">Price</td>
          <td class="">${optionPrice}</td>
          <td class="font-semibold">Sentiment</td>
          <td class="">{optionSentiment}</td>
        </tr>
        <tr class="odd:bg-[#202020]">
          <td class="font-semibold">Trade Count</td>
          <td class="">{optionTradeCount}</td>
          <td class="font-semibold">Exchange</td>
          <td class="">{optionExchange}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#202020]">
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
<!--End Options Detail Modal-->


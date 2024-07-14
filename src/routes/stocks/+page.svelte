<script lang='ts'>
import { goto } from '$app/navigation';
import { screenWidth, numberOfUnreadNotification } from '$lib/store';
import { abbreviateNumber } from '$lib/utils';
import { page } from '$app/stores';
import { fly } from 'svelte/transition';
import logo from '$lib/images/box_logo.png';

import InfiniteLoading from '$lib/components/InfiniteLoading.svelte';

export let data;


let charNumber =40;
let notDestroyed = true;

let rawData = data?.getStockList;
let symbolList = rawData?.slice(0,50);


async function infiniteHandler({ detail: { loaded, complete } }) 
{
  if (symbolList?.length === rawData?.length && notDestroyed) {
      complete();
    } else if (notDestroyed) {
      const nextIndex = symbolList?.length;
      const newSymbols = rawData?.slice(nextIndex, nextIndex + 5);
      symbolList = [...symbolList, ...newSymbols];
      loaded();
    }
}

    
$: {
    if($screenWidth < 640)
    {
    charNumber = 15;
    }
    else {
    charNumber =40;
    }
}

$: {
  if ($page.url.pathname !== '/stocks') {
    notDestroyed = false;
  }
}

</script>
    
    
    
<svelte:head>

<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
<title>
  {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} List of All Stock Ticker Symbols · stocknear
</title>
<meta name="description" content={`An overview of all the stock ticker symbols listed. Explore the stock pages to learn about the company's price history, financials, key stats, and more.`} />

<!-- Other meta tags -->
<meta property="og:title" content={`List of All Stock Ticker Symbols · stocknear`}/>
<meta property="og:description" content={`An overview of all the stock ticker symbols listed. Explore the stock pages to learn about the company's price history, financials, key stats, and more.`} />
<meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
<meta property="og:type" content="website"/>
<!-- Add more Open Graph meta tags as needed -->

<!-- Twitter specific meta tags -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content={`List of All Stock Ticker Symbols · stocknear`}/>
<meta name="twitter:description" content={`An overview of all the stock ticker symbols listed. Explore the stock pages to learn about the company's price history, financials, key stats, and more.`} />
<meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
<!-- Add more Twitter meta tags as needed -->

</svelte:head>
  

      
    <section in:fly={{ x: -10, duration: 150, delay: 150 }} out:fly={{ x: 5, duration: 150 }} class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-5 pb-40">
        
      <!--
      <div class="text-sm breadcrumbs ml-4">
        <ul>
          <li><a href="/" class="text-gray-300">Home</a></li> 
          <li><a class="text-gray-300">All Stock Symbols</a></li> 
        </ul>
      </div>
      -->

      <div class="w-full max-w-4xl m-auto sm:bg-[#09090B] sm:rounded-xl h-auto pl-10 pr-10 pt-5 sm:pb-10 sm:pt-10 mt-3 mb-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
      
          <!-- Start Column -->
          <div>
            <div class="flex flex-row justify-center items-center">
              <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
                Stock Symbols
              </h1>
            </div>
    
            <span class="text-white text-md font-medium text-center flex justify-center items-center ">
                Collection of all Stock Symbols available
            </span>
            <!--
            <label for="marketMoverInfo" class="cursor-pointer flex justify-center items-center mt-2">
              <span class="text-white text-md font-medium">
                Learn more
              </span>
              <svg class="w-6 h-6 inline-block ml-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="info-circle"> <g> <circle cx="12" cy="12" data-name="--Circle" fill="none" id="_--Circle" r="10" stroke="#B46266" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle> <line fill="none" stroke="#B46266" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="12" y2="16"></line> <line fill="none" stroke="#B46266" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="8" y2="8"></line> </g> </g> </g> </g></svg>
            </label>
            -->
    
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
              <img class="w-24 ml-9" src={logo} alt="logo" loading="lazy">
            </div>
          </div>
          <!-- End Column -->
        </div>
    
       
    
    
      </div>
    

    
    <div class="w-full max-w-4xl mt-10 m-auto mb-10 bg-[#09090B] pl-3 pr-3 overflow-hidden">
    
    
        <!--Start Top Winners/Losers-->
        <div class="flex flex-col justify-center items-center">
          
          <div class="ml-4 text-start w-full text-white mb-2">          
              <span class="font-bold text-2xl">
                {rawData?.length} Stocks
              </span>
          </div>

          <div class="border-b mt-2 border-blue-400 w-full mb-4" />

  
        <table class="mt-5 table table-sm table-compact rounded-none sm:rounded-md w-full bg-[#09090B] border-bg-[#09090B] m-auto overflow-hidden">
          <thead>
            <tr>
              <th class="text-white font-medium text-[0.95rem] hidden sm:table-cell text-start">Symbol</th>
              <th class="text-white font-medium text-sm sm:text-[0.95rem]">Name</th>
              <th class="text-white font-medium text-center sm:text-start text-sm sm:text-[0.95rem]l">Sector</th>
              <th class="text-white font-medium text-end text-sm sm:text-[0.95rem]">Market Cap</th>
            </tr>
          </thead>
          <tbody>
            {#each symbolList as item,index}
            <tr on:click={() => goto("/stocks/"+item?.symbol)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#27272A] border-b-[#09090B] shake-ticker cursor-pointer">
              
              <td class="hidden sm:table-cell text-blue-400 font-medium text-sm text-start border-b-[#09090B]">
                {item?.symbol}
              </td>

              <td class="text-gray-200 border-b-[#09090B]">
                <span class="hidden sm:block text-white">{item?.name?.length > charNumber ? item?.name?.slice(0,charNumber) + "..." : item?.name}</span>
                <div class="sm:hidden flex flex-row">
                  <div class="flex flex-col">
                    <span class="text-blue-400 font-medium">{item?.symbol}</span>
                    <span class="text-white">{item?.name?.length > charNumber ? item?.name?.slice(0,charNumber) + "..." : item?.name}</span>
                  </div>
                </div>
              </td>
            
            
            <td class="text-white border-b-[#09090B] text-center sm:text-start">
              {item?.sector !== null ? item?.sector : '-'}
            </td>

            <td class="text-white border-b-[#09090B] text-end">
              {item?.marketCap !== null ? abbreviateNumber(item?.marketCap,true) : '-'}
            </td>
    
    
  
            </tr>
            {/each}


          </tbody>
        </table>
      </div>

      <InfiniteLoading on:infinite={infiniteHandler} />

    
    
     
    
    </section>
    
    
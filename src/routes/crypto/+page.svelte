<script lang='ts'>
import { goto } from '$app/navigation';
import { numberOfUnreadNotification, screenWidth } from '$lib/store';
import { abbreviateNumber  } from '$lib/utils';
import { page } from '$app/stores';
import logo from '$lib/images/box_logo.png';


export let data;



let charNumber =50;
let notDestroyed = true;

let rawData = data?.getCryptoList;
let symbolList = rawData //rawData?.slice(0,30);




$: {
    if($screenWidth < 640)
    {
    charNumber = 20;
    }
    else {
    charNumber =50;
    }
}

$: {
    if ($page.url.pathname !== '/crypto') {
    notDestroyed = false;
    }
}
  
</script>
        
        
        
<svelte:head>

<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
<title>
  {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} List of All Crypto Ticker Symbols · stocknear
</title>
<meta name="description" content={`An overview of all the Crypto symbols listed. Explore the Crypto pages to learn about the circulating supply and price changes.`} />

<!-- Other meta tags -->
<meta property="og:title" content={`List of All Crypto Ticker Symbols · stocknear`}/>
<meta property="og:description" content={`An overview of all the Crypto symbols listed. Explore the Crypto pages to learn about the circulating supply and price changes.`} />
<meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
<meta property="og:type" content="website"/>
<!-- Add more Open Graph meta tags as needed -->

<!-- Twitter specific meta tags -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content={`List of All Crypto Ticker Symbols · stocknear`}/>
<meta name="twitter:description" content={`An overview of all the Crypto symbols listed. Explore the Crypto pages to learn about the circulating supply and price changes.`} />
<meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
<!-- Add more Twitter meta tags as needed -->

</svelte:head>
          
        <section class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-5 pb-40">
            <!--
            <div class="text-sm breadcrumbs ml-4">
                <ul>
                  <li><a href="/" class="text-gray-300">Home</a></li> 
                  <li><a class="text-gray-300">All Crypto Symbols</a></li> 
                </ul>
            </div>
          -->

          <div class="w-full max-w-4xl m-auto sm:bg-[#09090B] sm:rounded-xl h-auto pl-10 pr-10 pt-5 sm:pb-10 sm:pt-10 mt-3 mb-8">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
          
              <!-- Start Column -->
              <div>
                <div class="flex flex-row justify-center items-center">
                  <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
                    Crypto Symbols
                  </h1>
                </div>
        
                <span class="text-white text-md font-medium text-center flex justify-center items-center ">
                    Collection of all Crypto Symbols available
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
                    {rawData?.length} Cryptos
                  </span>
              </div>
    
              <div class="border-b mt-2 border-blue-400 w-full mb-4" />
    
              <div class="w-screen sm:w-full overflow-x-scroll">
              <table class="mt-5 table table-sm table-compact rounded-none sm:rounded-md w-full bg-[#09090B] border-bg-[#09090B] m-auto overflow-x-scroll">
                <thead>
                  <tr>
                    <th class="text-white font-semibold hidden sm:table-cell text-sm text-start">Symbol</th>
                    <th class="text-white font-semibold text-sm ">Name</th>
                    <th class="text-white font-semibold text-end text-sm ">MarketCap</th>
                    <th class="text-white font-semibold text-end text-sm ">Circulating Supply</th>
                    <th class="text-white font-semibold text-end text-sm ">Max Supply</th>
                  </tr>
                </thead>
                <tbody>
                  {#each symbolList as item,index}
                  <tr on:click={() => goto("/crypto/"+item?.symbol)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#27272A] border-b-[#09090B] shake-ticker cursor-pointer">
                    
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
                  
                  
                    <td class="text-white text-end border-b-[#09090B]">
                      {item?.marketCap !== null ? abbreviateNumber(item?.marketCap,true) : '-'}
                    </td>
                    
      
                  <td class="text-white border-b-[#09090B] text-end">
                    {item?.circulatingSupply !== null ? abbreviateNumber(item?.circulatingSupply,true) : '-'}
                  </td>

                  <td class="text-white border-b-[#09090B] text-end">
                    {item?.maxSupply !== 'Uncapped' ? abbreviateNumber(item?.maxSupply,true) : 'Uncapped'}
                  </td>
          
          
        
                  </tr>
                  {/each}
      
      
                </tbody>
              </table>
            </div>
          </div>
    
          <!--<InfiniteLoading on:infinite={infiniteHandler} />-->
    
        
     
        
        </section>
        
        
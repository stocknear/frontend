<script lang='ts'>
import { goto } from '$app/navigation';
import { numberOfUnreadNotification, screenWidth } from '$lib/store';
import { abbreviateNumber } from '$lib/utils';
import logo from '$lib/images/new_launcher_logo.png';
import ArrowLogo from "lucide-svelte/icons/move-up-right";

export let data;

let etfData = data?.getETFNewLaunches;

$: charNumber = $screenWidth < 640 ? 30 : 40
</script>
        
            
<svelte:head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
<title>
    {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} 100 Newest ETFs · stocknear
</title>
<meta name="description" content={`A list of the 100 most recently launched ETFs on the US stock market, sorted by the inception date.`} />

<!-- Other meta tags -->
<meta property="og:title" content={`100 Newest ETFs · stocknear`}/>
<meta property="og:description" content={`A list of the 100 most recently launched ETFs on the US stock market, sorted by the inception date.`} />
<meta property="og:type" content="website"/>
<!-- Add more Open Graph meta tags as needed -->

<!-- Twitter specific meta tags -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content={`100 Newest ETFs · stocknear`}/>
<meta name="twitter:description" content={`A list of the 100 most recently launched ETFs on the US stock market, sorted by the inception date.`} />
<!-- Add more Twitter meta tags as needed -->
</svelte:head>
              
<section class="w-full max-w-3xl sm:max-w-screen-xl overflow-hidden min-h-screen pt-5 pb-40">
    
    <div class="text-sm sm:text-[1rem] breadcrumbs ml-4">
        <ul>
          <li><a href="/" class="text-gray-300">Home</a></li> 
          <li><a class="text-gray-300">New Launches of ETFs</a></li> 
        </ul>
    </div>

    <div class="w-full overflow-hidden m-auto mt-5">

      <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden ">
          <div class="relative flex justify-center items-start overflow-hidden w-full">
      
      
              <main class="w-full lg:w-3/4 lg:pr-5">
                  
                  <div class="w-full  m-auto sm:bg-[#27272A] sm:rounded-xl h-auto pl-10 pr-10 pt-5 sm:pb-10 sm:pt-10 mt-3 mb-8">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
  
      <!-- Start Column -->
      <div>
        <div class="flex flex-row justify-center items-center">
          <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
            New ETFs
          </h1>
        </div>

        <span class="hidden sm:block text-white text-md font-medium text-center flex justify-center items-center ">
            Collection of all new launches of ETFs
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
          <img class="w-28 ml-4" src={logo} alt="logo" loading="lazy">
        </div>
      </div>
      <!-- End Column -->
    </div>

    


  </div>



<div class="w-full mt-5 m-auto mb-10 bg-[#09090B] pl-3 pr-3 overflow-hidden">


    <!--Start Top Winners/Losers-->
    <div class="flex flex-col justify-center items-center">
      
      <div class="ml-4 text-start w-full text-white mb-2">          
          <span class="font-bold text-2xl">
            {etfData?.length} ETFs
          </span>
      </div>

      <div class="border-b mt-2 border-gray-800 w-full mb-4" />

    <div class="w-full overflow-x-scroll">
    <table class="mt-5 table table-compact rounded-none sm:rounded-md w-full bg-[#09090B] border-bg-[#09090B] m-auto overflow-hidden">
      <thead>
        <tr class="border-b border-[#27272A]">
          <th class="text-white font-semibold text-[1rem]">Inception</th>
          <th class="text-white font-semibold text-[1rem]">Symbol</th>
          <th class="text-white font-semibold text-[1rem] ">Fund Name</th>
          <th class="text-white font-semibold text-end text-[1rem] ">Holdings</th>
          <th class="text-white font-semibold text-end text-[1rem] ">Total Assets</th>
        </tr>
      </thead>
      <tbody>
        {#each etfData as item,index}
        <tr on:click={() => goto("/etf/"+item?.symbol)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#27272A] border-b-[#09090B] shake-ticker cursor-pointer">
          <td class="text-white text-sm sm:text-[1rem] whitespace-nowrap border-b-[#09090B]">
            {new Date(item?.inceptionDate)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
          </td>
        
          
        <td class="text-blue-400 text-sm sm:text-[1rem] whitespace-nowrap border-b-[#09090B]">
          {item?.symbol}
        </td>

        <td class="text-white text-sm sm:text-[1rem] whitespace-nowrap border-b-[#09090B] ">
          {item?.name?.length > charNumber ? item?.name?.slice(0,charNumber) + '...' : item?.name}
        </td>



        <td class="text-white text-sm sm:text-[1rem] whitespace-nowrap border-b-[#09090B] text-end ">
            {item?.numberOfHoldings}
        </td>

        <td class="text-white text-sm sm:text-[1rem] whitespace-nowrap border-b-[#09090B] text-end">
            {(item?.totalAssets !== 0 && item?.totalAssets !== null) ? abbreviateNumber(item?.totalAssets,true) : '-'}
        </td>



        </tr>
        {/each}


      </tbody>
    </table>
    </div>
  </div>

 
</main>


<aside class="hidden lg:block relative fixed w-1/4 ml-4">        

  {#if data?.user?.tier !== 'Pro' || data?.user?.freeTrial}
  <div on:click={() => goto('/pricing')} class="w-full bg-[#141417] duration-100 ease-out sm:hover:text-white text-gray-400 sm:hover:border-gray-700 border border-gray-800 rounded-lg h-fit pb-4 mt-4 cursor-pointer">
      <div class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0">
          <div class="w-full flex justify-between items-center p-3 mt-3">
          <h2 class="text-start text-xl font-semibold text-white ml-3">
          Pro Subscription
          </h2>
          <ArrowLogo class="w-8 h-8 mr-3 flex-shrink-0"/>
          </div>
          <span class="text-white p-3 ml-3 mr-3">
              Upgrade now for unlimited access to all data and tools.
          </span>
      </div>
  </div>
  {/if}

  <div on:click={() => goto('/analysts')} class="w-full bg-[#141417] duration-100 ease-out sm:hover:text-white text-gray-400 sm:hover:border-gray-700 border border-gray-800 rounded-lg h-fit pb-4 mt-4 cursor-pointer">
      <div class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0">
          <div class="w-full flex justify-between items-center p-3 mt-3">
          <h2 class="text-start text-xl font-semibold text-white ml-3">
          Wallstreet Analyst
          </h2>
          <ArrowLogo class="w-8 h-8 mr-3 flex-shrink-0"/>
          </div>
          <span class="text-white p-3 ml-3 mr-3">
              Get the latest top Wall Street analyst ratings.
          </span>
      </div>
  </div>

  <div on:click={() => goto('/politicians')} class="w-full bg-[#141417] duration-100 ease-out sm:hover:text-white text-gray-400 sm:hover:border-gray-700 border border-gray-800 rounded-lg h-fit pb-4 mt-4 cursor-pointer">
      <div class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0">
          <div class="w-full flex justify-between items-center p-3 mt-3">
          <h2 class="text-start text-xl font-semibold text-white ml-3">
          Congress Trading
          </h2>
          <ArrowLogo class="w-8 h-8 mr-3 flex-shrink-0"/>
          </div>
          <span class="text-white p-3 ml-3 mr-3">
              Get the latest top Congress trading insights.
          </span>
      </div>
  </div>

</aside>

</div>
</div>


</div>



</section>

            
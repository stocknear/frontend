<script lang='ts'>
  import { goto } from '$app/navigation';
  import { numberOfUnreadNotification } from '$lib/store';
  import UpgradeToPro from '$lib/components/UpgradeToPro.svelte';
  import ArrowLogo from "lucide-svelte/icons/move-up-right";
  import { onMount } from 'svelte';

  export let data;

  let isLoaded = false;
  let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;

  let rawData = data?.getTopAnalyst;
  let analytRatingList =  rawData?.slice(0,40) ?? [];


async function handleScroll() {
    const scrollThreshold = document.body.offsetHeight * 0.8; // 80% of the website height
    const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;
    if (isBottom && analytRatingList?.length !== rawData?.length) {
        const nextIndex = analytRatingList?.length;
        const filteredNewResults = rawData?.slice(nextIndex, nextIndex + 50);
        analytRatingList = [...analytRatingList, ...filteredNewResults];
    }
  }

onMount(async () => {

isLoaded = true;
window.addEventListener('scroll', handleScroll);
  return () => {
      window.removeEventListener('scroll', handleScroll);
  };
})



let order = '';
let sortBy = ''; // Default sorting by change percentage

function changeOrder(state:string) {
    if (state === 'highToLow')
    {
      order = 'lowToHigh';
    }
    else {
      order = 'highToLow';
    }
  }

const sortByRank = (tickerList) => {
  return tickerList?.sort(function(a, b) {
    if(order === 'highToLow')
    {
      return b?.rank - a?.rank;
    }
    else {
      return a?.rank - b?.rank;
    }
      
    });
}

const sortBySuccessRate = (tickerList) => {
  return tickerList?.sort(function(a, b) {
    if(order === 'highToLow')
    {
      return b?.successRate - a?.successRate;
    }
    else {
      return a?.successRate - b?.successRate;
    }
  });
}

const sortByAvgReturn = (tickerList) => {
  return tickerList?.sort(function(a, b) {
    if(order === 'highToLow')
    {
      return b?.avgReturn - a?.avgReturn;
    }
    else {
      return a?.avgReturn - b?.avgReturn;
    }
  });
}

const sortByTotalRatings = (tickerList) => {
  return tickerList?.sort(function(a, b) {
    if(order === 'highToLow')
    {
      return b?.totalRatings - a?.totalRatings;
    }
    else {
      return a?.totalRatings - b?.totalRatings;
    }
  });
}




$: {
  if(order)
  {
    if(sortBy === 'rank')
    {
      analytRatingList = sortByRank(rawData)?.slice(0,50);
    }
    else if(sortBy === 'successRate')
    {
      analytRatingList = sortBySuccessRate(rawData)?.slice(0,50);
    }
    else if(sortBy === 'avgReturn')
    {
      analytRatingList = sortByAvgReturn(rawData)?.slice(0,50);
    }
    else if(sortBy === 'totalRatings')
    {
      analytRatingList = sortByTotalRatings(rawData)?.slice(0,50);
    }
    
  }
}


      
</script>

<svelte:head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
<title>
    {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''}  Top Wall Street Stock Analysts · stocknear
</title>
<meta name="description" content={`A list of the top Wall Street stock analysts, ranked by their success rate and average return per rating.`} />

<!-- Other meta tags -->
<meta property="og:title" content={`Top Wall Street Stock Analysts · stocknear`}/>
<meta property="og:description" content={`A list of the top Wall Street stock analysts, ranked by their success rate and average return per rating.`} />
<meta property="og:type" content="website"/>
<!-- Add more Open Graph meta tags as needed -->

<!-- Twitter specific meta tags -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content={`Top Wall Street Stock Analysts · stocknear`}/>
<meta name="twitter:description" content={`A list of the top Wall Street stock analysts, ranked by their success rate and average return per rating.`} />
<!-- Add more Twitter meta tags as needed -->

</svelte:head>

    


<section class="w-full max-w-3xl sm:max-w-screen-2xl overflow-hidden min-h-screen pt-5 pb-40 lg:px-3">
          
  <div class="text-sm sm:text-[1rem] breadcrumbs ml-4">
    <ul>
      <li><a href="/" class="text-gray-300">Home</a></li>
      <li class="text-gray-300">Top Shorted Stocks</li>
    </ul>
  </div>
          
  <div class="w-full overflow-hidden m-auto mt-5">
    
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden ">
        <div class="relative flex justify-center items-start overflow-hidden w-full">


            <main class="w-full lg:w-3/4 lg:pr-5">
             
              <div class="w-full m-auto sm:bg-[#27272A] sm:rounded-xl h-auto pl-10 pr-10 pt-5 sm:pb-10 sm:pt-10 mt-3 mb-8">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
              
                  <!-- Start Column -->
                  <div>
                    <div class="flex flex-row justify-center items-center">
                      <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
                        Top Wall Street Analysts
                      </h1>
                    </div>
          
                    <span class="text-white text-md font-medium text-center flex justify-center items-center ">
                      A performance-based ranking of Wall Street Analysts.
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
                    
                    
                    <div class="z-1 absolute top-4">
                        <img class="w-36 ml-2" src={cloudFrontUrl+'/assets/analyst_logo.png'} alt="logo" loading="lazy">
                      </div>
                  </div>
                  <!-- End Column -->
                </div>
          
               
          
          
              </div>
  

              
              <div class="w-screen sm:w-full m-auto mt-16">
                  {#if isLoaded}

                  <div class="w-screen sm:w-full m-auto rounded-none sm:rounded-lg mb-4 overflow-x-scroll sm:overflow-hidden">
                    <table class="table table-sm table-compact rounded-none sm:rounded-md w-full bg-[#09090B] border-bg-[#09090B] m-auto">
                      <thead>
                        <tr class="bg-[#09090B]">
                          <th on:click={() => { sortBy = 'rank'; changeOrder(order); }} class="cursor-pointer text-center bg-[#09090B] text-white text-[1rem] font-semibold">
                            Rank
                            <svg class="w-5 h-5 inline-block {order === 'highToLow' && sortBy === 'rank' ? 'rotate-180' : ''}" viewBox="0 0 20 20" fill="currentColor" style="max-width:40px"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                          </th>
                          <th class="text-start bg-[#09090B] text-white text-[1rem] font-semibold">
                            Analyst
                          </th>

              
                          <th on:click={() => { sortBy = 'successRate'; changeOrder(order); }} class="cursor-pointer text-end bg-[#09090B] text-white text-[1rem] font-semibold">
                            Success Rate
                            <svg class="w-5 h-5 inline-block {order === 'highToLow' && sortBy === 'successRate' ? 'rotate-180' : ''}" viewBox="0 0 20 20" fill="currentColor" style="max-width:40px"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                          </th>
                          <th on:click={() => { sortBy = 'avgReturn'; changeOrder(order); }} class="cursor-pointer text-end bg-[#09090B] text-white text-[1rem] font-semibold">
                            Avg. return
                            <svg class="w-5 h-5 inline-block {order === 'highToLow' && sortBy === 'avgReturn' ? 'rotate-180' : ''}" viewBox="0 0 20 20" fill="currentColor" style="max-width:40px"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                          </th>
                          <th on:click={() => { sortBy = 'totalRatings'; changeOrder(order); }} class="cursor-pointer text-white font-semibold text-end text-[1rem]">
                            Total Ratings
                            <svg class="w-5 h-5 inline-block {order === 'highToLow' && sortBy === 'totalRatings' ? 'rotate-180' : ''}" viewBox="0 0 20 20" fill="currentColor" style="max-width:40px"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                          </th>
                          <!--
                          <th class="text-end bg-[#09090B] text-white text-[1rem] font-semibold">
                            Main Sector
                          </th>
                          -->
                          <th class="text-white font-semibold  text-end text-[1rem]">
                            Last Rating
                          </th>
                         
                        </tr>
                      </thead>
                      <tbody>
                        {#each analytRatingList as item, index}

                        <tr on:click={() => goto(`/analysts/${item?.analystId}`)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#27272A] {index+1 === rawData?.length && data?.user?.tier !== 'Pro' ? 'opacity-[0.1]' : ''} cursor-pointer">
                          <td class="text-white text-sm sm:text-[1rem] font-semibold text-white text-center">
                            {item?.rank}
                          </td>

                          <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap">
                            <div class="flex flex-col items-start">
                              <span class="text-blue-400 font-medium">{item?.analystName} </span>
                              <span class="text-white ">{item?.companyName} </span>
                                  <div class="flex flex-row items-center mt-1">
                                    {#each Array.from({ length: 5 }) as _, i}
                                    {#if i < Math.floor(item?.analystScore)}
                                        <svg class="w-3.5 h-3.5 text-[#FFA500]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                                            <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
                                        </svg>
                                          {:else}
                                              <svg class="w-3.5 h-3.5 text-gray-300 dark:text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                                                  <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
                                              </svg>
                                          {/if}
                                      {/each}
                                
                                      <span class="ml-1 text-gray-400">
                                          ({item?.analystScore !== null ? item?.analystScore : 0})
                                      </span>
                                  
                                  </div>
                          </div>
                              
                          </td>

                       
  
                         <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap font-semibold text-white">
                            {#if Number(item?.successRate) >= 0}
                            <span class="text-[#37C97D]">{Number(item?.successRate)?.toFixed(2)}%</span>
                            {/if}
                          </td>

                            <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap font-semibold text-white">
                              {#if Number(item?.avgReturn) >= 0}
                                <span class="text-[#37C97D]">{Number(item?.avgReturn)?.toFixed(2)}%</span>
                              {:else}
                                <span class="text-[#B84242]">{Number(item?.avgReturn)?.toFixed(2)}%</span>
                              {/if}
                            </td>

                            <td class="text-end font-semibold text-white text-sm sm:text-[1rem] whitespace-nowrap">
                              {item?.totalRatings}
                            </td>

                            <!--
                            <td class="text-white text-sm sm:text-[1rem] whitespace-nowrap text-white text-end">
                              {item?.mainSectors?.at(0)}
                            </td>
                            -->

                            <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap  text-white">
                              {item?.lastRating !== null ? new Date(item?.lastRating)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' }) : 'n/a'}
                            </td>
                            

                        </tr>
                      {/each}
                      </tbody>
                    </table>
                  </div>
                  
                  <UpgradeToPro data={data} title="Get stock forecasts from Wall Street's highest rated professionals"/>
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

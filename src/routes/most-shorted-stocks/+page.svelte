<script lang='ts'>
  import { goto } from '$app/navigation';
  import { numberOfUnreadNotification, screenWidth } from '$lib/store';
  import InfiniteLoading from '$lib/components/InfiniteLoading.svelte';
	import { abbreviateNumber } from '$lib/utils';
  import { onMount } from 'svelte';
  import UpgradeToPro from '$lib/components/UpgradeToPro.svelte';

  
    export let data;
    let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;

    let isLoaded = false;
    let rawData = []
    let shortedList =  [];
  
  
  async function infiniteHandler({ detail: { loaded, complete } }) 
  {
  if (shortedList?.length === rawData?.length) {
      complete();
    } else {
      const nextIndex = shortedList?.length;
      const newArticles = rawData?.slice(nextIndex, nextIndex + 5);
      shortedList = [...shortedList, ...newArticles];
      loaded();
    }
  }
  
    
  onMount(() => {
    rawData = data?.getMostShortedStocks ?? [];
    shortedList = rawData?.slice(0,20) ?? []
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
      {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} High Short Interest Stocks · stocknear
  </title>
  <meta name="description" content={`Short interest, stock short squeeze, short interest ratio & short selling data positions for NASDAQ, NYSE & AMEX stocks to find shorts in the stock market.`} />
  
  <!-- Other meta tags -->
  <meta property="og:title" content={`High Short Interest Stocks · stocknear`}/>
  <meta property="og:description" content={`Short interest, stock short squeeze, short interest ratio & short selling data positions for NASDAQ, NYSE & AMEX stocks to find shorts in the stock market.`} />
  <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->
  
  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content={`High Short Interest Stocks · stocknear`}/>
  <meta name="twitter:description" content={`Short interest, stock short squeeze, short interest ratio & short selling data positions for NASDAQ, NYSE & AMEX stocks to find shorts in the stock market.`} />
  <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <!-- Add more Twitter meta tags as needed -->
  
  </svelte:head>
  
      
  
  <section class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-5 pb-40">
        
    <div class="text-sm breadcrumbs ml-4">
      <ul>
        <li><a href="/" class="text-gray-300">Home</a></li>
        <li class="text-gray-300">Most Shorted Stocks</li>
      </ul>
    </div>
            
    <div class="w-full max-w-4xl overflow-hidden m-auto mt-5">
      
      <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden max-w-4xl">
          <div class="relative flex justify-center items-center overflow-hidden w-full">
              <main class="w-full">
               
                <div class="w-full max-w-4xl m-auto sm:bg-[#09090B] sm:rounded-xl h-auto pl-10 pr-10 pt-5 sm:pb-10 sm:pt-10 mt-3 mb-8">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
                
                    <!-- Start Column -->
                    <div>
                      <div class="flex flex-row justify-center items-center">
                        <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
                           Shorted Stocks
                        </h1>
                      </div>
            
                      <span class="text-white text-md font-medium text-center flex justify-center items-center ">
                        High short interest stocks are often volatile, known for sudden price surges called short squeezes.
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
                      
                      
                      <div class="z-1 absolute -top-3">
                          <img class="w-28 ml-6" src={cloudFrontUrl+'/assets/short_logo.png'} alt="logo" loading="lazy">
                        </div>
                    </div>
                    <!-- End Column -->
                  </div>
            
                 
            
            
                </div>

                {#if isLoaded}
                <div class="w-screen sm:w-full m-auto mt-20 sm:mt-10">
                    
                    <div class="w-screen sm:w-full m-auto rounded-none sm:rounded-lg mb-4 overflow-x-scroll sm:overflow-hidden">
                      <table class="table table-sm table-compact rounded-none sm:rounded-md w-full bg-[#09090B] border-bg-[#09090B] m-auto">
                        <thead>
                          <tr class="bg-[#09090B] border-b border-blue-400">
                            <th class="text-end bg-[#09090B] text-white text-sm font-semibold">
                              #
                            </th>
                            <th class="text-start bg-[#09090B] text-white text-sm font-semibold">
                              Symbol
                            </th>
  
                            <th class="hidden sm:table-cell text-start bg-[#09090B] text-white text-sm font-semibold">
                              Name
                            </th>
  
                            <th class="text-center bg-[#09090B] text-white text-sm font-semibold">
                              Short Interest
                            </th>
                            <th class="text-end bg-[#09090B] text-white text-sm font-semibold">
                              Float
                            </th>
                            <th class="text-end bg-[#09090B] text-white text-sm font-semibold">
                              Outstd
                            </th>
                            <th class="text-end bg-[#09090B] text-white text-sm font-semibold">
                              Sector
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {#each shortedList as item, index}
  
                          <tr on:click={() => goto(`/stocks/${item?.symbol}`)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#27272A] {index+1 === shortedList?.length && data?.user?.tier !== 'Pro' ? 'opacity-[0.1]' : ''} cursor-pointer">
                            <td class="text-white text-sm font-medium text-white text-end">
                              {index+1}
                            </td>
  
                            <td class="text-sm text-start">
                                <div class="flex flex-col items-start w-32 sm:w-fit">
                                    <span class="text-blue-400">{item?.symbol}</span>
                                    <span class="text-white sm:hidden">
                                        {item?.name?.length > charNumber ? item?.name?.slice(0,charNumber) + "..." : item?.name}
                                    </span>
                                </div>
                            </td>
  
                            <td class="hidden sm:table-cell text-white text-sm text-white text-start">
                                {item?.name?.length > charNumber ? item?.name?.slice(0,charNumber) + "..." : item?.name}
                            </td>
                          
  
                            <td class="text-center text-sm font-medium text-white">
                                {item?.shortOutStandingPercent}%
                            </td>

                            <td class="text-end text-sm font-medium text-white">
                                {abbreviateNumber(item?.latestFloatShares)}
                            </td>
                            
                            <td class="text-end text-sm font-medium text-white">
                              {abbreviateNumber(item?.latestOutstandingShares)}
                            </td>

                            <td class="text-end text-sm font-medium text-white">
                              {item?.sector}
                            </td>


                          </tr>
                        {/each}
                        </tbody>
                      </table>
                  </div>
                    <InfiniteLoading on:infinite={infiniteHandler} />
                    <UpgradeToPro data={data} title="Get the most shorted stocks on the market to never miss out the next short squeeze"/>
  
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

              
              </main>
          </div>
      </div>
  
    
    </div>
        
        
    
  </section>
  
  
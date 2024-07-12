<script lang='ts'>
  import { goto } from '$app/navigation';
  import { numberOfUnreadNotification, screenWidth } from '$lib/store';
  import InfiniteLoading from '$lib/components/InfiniteLoading.svelte';
	import { abbreviateNumber } from '$lib/utils';
  import UpgradeToPro from '$lib/components/UpgradeToPro.svelte';
  
  
    export let data;
    let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;

    
    let rawData = data?.getTopAnalystStocks;

    let analytRatingList =  rawData?.slice(0,20) ?? [];
  
  
  async function infiniteHandler({ detail: { loaded, complete } }) 
  {
  if (analytRatingList?.length === rawData?.length) {
      complete();
    } else {
      const nextIndex = analytRatingList?.length;
      const newArticles = rawData?.slice(nextIndex, nextIndex + 5);
      analytRatingList = [...analytRatingList, ...newArticles];
      loaded();
    }
  }
  
    
  
  
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
      {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''}  Top 100 Strong Buy Stocks · stocknear
  </title>
  <meta name="description" content={`The top 100 "Strong Buy" stocks according to the best performing Wall Street analysts, with a rating of 5 stars.`} />
  
  <!-- Other meta tags -->
  <meta property="og:title" content={`Top 100 Strong Buy Stocks · stocknear`}/>
  <meta property="og:description" content={`The top 100 "Strong Buy" stocks according to the best performing Wall Street analysts, with a rating of 5 stars.`} />
  <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->
  
  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content={`Top 100 Strong Buy Stocks · stocknear`}/>
  <meta name="twitter:description" content={`The top 100 "Strong Buy" stocks according to the best performing Wall Street analysts, with a rating of 5 stars.`} />
  <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <!-- Add more Twitter meta tags as needed -->
  
  </svelte:head>
  
      
  
  
  <section class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-5 pb-40">
        
    <div class="text-sm breadcrumbs ml-4">
      <ul>
        <li><a href="/" class="text-gray-300">Home</a></li>
        <li><a href="/analysts" class="text-gray-300">Analysts</a></li> 
        <li class="text-gray-300">Top Stocks</li>
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
                           Top Stocks
                        </h1>
                      </div>
            
                      <span class="text-white text-md font-medium text-center flex justify-center items-center ">
                        Uncover 'Strong Buy' stocks from 5-star Wall Street analysts
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
                          <img class="w-28 ml-6" src={cloudFrontUrl+'/assets/wsb_diamond_hands_logo.png'} alt="logo" loading="lazy">
                        </div>
                    </div>
                    <!-- End Column -->
                  </div>
            
                 
            
            
                </div>

                <div class="w-full max-w-4xl sm:flex sm:flex-row sm:items-center m-auto text-gray-100 bg-[#202020]  sm:rounded-lg h-auto p-5 ">
                  <svg class="w-5 h-5 inline-block sm:mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#a474f6" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
                  Strong Buy stocks by top-rated analysts with a star rating of 4 or above, known for their exceptional accuracy and returns. Stocks are ranked based on the volume of analyst ratings.
                </div>

    
                
                <div class="w-screen sm:w-full m-auto mt-10">
                    
                    <div class="w-screen sm:w-full m-auto rounded-none sm:rounded-lg mb-4 overflow-x-scroll sm:overflow-hidden">
                      <table class="table table-sm table-compact rounded-none sm:rounded-md w-full bg-[#0F0F0F] border-bg-[#0F0F0F] m-auto">
                        <thead>
                          <tr class="bg-[#0F0F0F] border-b border-blue-400">
                            <th class="text-end bg-[#0F0F0F] text-white text-sm font-semibold">
                              #
                            </th>
                            <th class="text-start bg-[#0F0F0F] text-white text-sm font-semibold">
                              Symbol
                            </th>
  
                            <th class="hidden sm:table-cell text-start bg-[#0F0F0F] text-white text-sm font-semibold">
                              Name
                            </th>
  
                            <th class="text-end bg-[#0F0F0F] text-white text-sm font-semibold">
                              Ratings Count
                            </th>
                            <th class="text-end bg-[#0F0F0F] text-white text-sm font-semibold">
                                Price Target
                            </th>
                            <th class="text-end bg-[#0F0F0F] text-white text-sm font-semibold">
                                Current Price
                            </th>
                            <th class="text-end bg-[#0F0F0F] text-white text-sm font-semibold">
                              Upside
                            </th>
                            <th class="text-white font-semibold text-end text-sm">
                              Market Cap
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {#each analytRatingList as item, index}
  
                          <tr on:click={() => goto(`/stocks/${item?.ticker}`)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#202020] {index+1 === rawData?.length && data?.user?.tier !== 'Pro' ? 'opacity-[0.1]' : ''} cursor-pointer">
                            <td class="text-white text-sm font-medium text-white text-end">
                              {item?.rank}
                            </td>
  
                            <td class="text-sm text-start">
                                <div class="flex flex-col items-start w-32 sm:w-fit">
                                    <span class="text-blue-400">{item?.ticker}</span>
                                    <span class="text-white sm:hidden">
                                        {item?.name?.length > charNumber ? item?.name?.slice(0,charNumber) + "..." : item?.name}
                                    </span>
                                </div>
                            </td>
  
                            <td class="hidden sm:table-cell text-white text-sm text-white text-start">
                                {item?.name?.length > charNumber ? item?.name?.slice(0,charNumber) + "..." : item?.name}
                            </td>
                          
  
                            <td class="text-end text-sm font-medium text-white">
                                {item?.counter}
                            </td>

                            <td class="text-end text-sm font-medium text-white">
                                ${item?.priceTarget?.toFixed(2)}
                            </td>
                            
                            <td class="text-end text-sm font-medium text-white">
                                ${item?.price?.toFixed(2)}
                            </td>

                              <td class="text-end text-sm font-medium text-white">
                                {#if Number(item?.upside) >= 0}
                                  <span class="text-[#37C97D]">{Number(item?.upside)?.toFixed(2)}%</span>
                                {:else}
                                  <span class="text-[#B84242]">{Number(item?.upside)?.toFixed(2)}%</span>
                                {/if}
                              </td>
  
                              <td class="text-end font-medium text-white text-sm">
                                {item?.marketCap !== null ? abbreviateNumber(item?.marketCap,true) : '-'}
                              </td>

                          </tr>
                        {/each}
                        </tbody>
                      </table>
                  </div>
                    <InfiniteLoading on:infinite={infiniteHandler} />

                    <UpgradeToPro data={data} title="Get stock forecasts from Wall Street's highest rated professionals"/>
  
                </div>

              
              </main>
          </div>
      </div>
  
    
    </div>
        
        
    
  </section>
  
  
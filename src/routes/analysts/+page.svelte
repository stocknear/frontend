<script lang='ts'>
  import { goto } from '$app/navigation';
  import { numberOfUnreadNotification, screenWidth } from '$lib/store';
  import InfiniteLoading from '$lib/components/InfiniteLoading.svelte';
  import UpgradeToPro from '$lib/components/UpgradeToPro.svelte';

  export let data;
  let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;

  let rawData = data?.getTopAnalyst;
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
    charNumber = 20;
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
    {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''}  Top Wall Street Stock Analysts · stocknear
</title>
<meta name="description" content={`A list of the top Wall Street stock analysts, ranked by their success rate and average return per rating.`} />

<!-- Other meta tags -->
<meta property="og:title" content={`Top Wall Street Stock Analysts · stocknear`}/>
<meta property="og:description" content={`A list of the top Wall Street stock analysts, ranked by their success rate and average return per rating.`} />
<meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
<meta property="og:type" content="website"/>
<!-- Add more Open Graph meta tags as needed -->

<!-- Twitter specific meta tags -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content={`Top Wall Street Stock Analysts · stocknear`}/>
<meta name="twitter:description" content={`A list of the top Wall Street stock analysts, ranked by their success rate and average return per rating.`} />
<meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
<!-- Add more Twitter meta tags as needed -->

</svelte:head>

    


<section class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-5 pb-60">
      
  <div class="text-sm breadcrumbs ml-4">
    <ul>
      <li><a href="/" class="text-gray-300">Home</a></li> 
      <li class="text-gray-300">Analysts</li>
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
                  
                  <div class="w-screen sm:w-full m-auto rounded-none sm:rounded-lg mb-4 overflow-x-scroll sm:overflow-hidden">
                    <table class="table table-sm table-compact rounded-none sm:rounded-md w-full bg-[#0F0F0F] border-bg-[#0F0F0F] m-auto">
                      <thead>
                        <tr class="bg-[#0F0F0F] border-b border-blue-400">
                          <th class="text-end bg-[#0F0F0F] text-white text-[1rem] font-medium">
                            #
                          </th>
                          <th class="text-start bg-[#0F0F0F] text-white text-[1rem] font-medium">
                            Analyst
                          </th>

                          <th class="text-end bg-[#0F0F0F] text-white text-[1rem] font-medium">
                            Main Sector
                          </th>

                          <th class="text-end bg-[#0F0F0F] text-white text-[1rem] font-medium">
                            Success Rate
                          </th>
                          <th class="text-end bg-[#0F0F0F] text-white text-[1rem] font-medium">
                            Average Return
                          </th>
                          <th class="text-white font-medium text-end text-[1rem]">
                            Total Ratings
                          </th>
                          <th class="text-white font-medium  text-end text-[1rem]">
                            Last Rating
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {#each analytRatingList as item, index}

                        <tr on:click={() => goto(`/analysts/${item?.analystId}`)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#202020] {index+1 === rawData?.length && data?.user?.tier !== 'Pro' ? 'opacity-[0.1]' : ''} cursor-pointer">
                          <td class="text-white text-[1rem] font-medium text-white text-end">
                            {item?.rank}
                          </td>

                          <td class="text-sm text-start">
                            <div class="flex flex-col items-star w-32">
                              <span class="text-blue-400 text-sm font-medium">{item?.analystName} </span>
                              <span class="text-white text-xs">{item?.companyName} </span>
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
                                
                                      <span class="ml-1 text-sm text-gray-400">
                                          ({item?.analystScore !== null ? item?.analystScore : 0})
                                      </span>
                                  
                                  </div>
                          </div>
                              
                          </td>

                          <td class="text-white text-sm text-white text-end">
                            {item?.mainSectors?.at(0)}
                          </td>
                        

                          <td class="text-end text-sm font-semibold text-white">
                            {#if Number(item?.successRate) >= 0}
                            <span class="text-[#37C97D]">{Number(item?.successRate)?.toFixed(2)}%</span>
                            {/if}
                          </td>

                            <td class="text-end text-sm font-semibold text-white">
                              {#if Number(item?.avgReturn) >= 0}
                                <span class="text-[#37C97D]">{Number(item?.avgReturn)?.toFixed(2)}%</span>
                              {:else}
                                <span class="text-[#B84242]">{Number(item?.avgReturn)?.toFixed(2)}%</span>
                              {/if}
                            </td>

                            <td class="text-end font-semibold text-white text-sm">
                              {item?.totalRatings}
                            </td>

                            <td class="text-end text-sm  text-white">
                              {item?.lastRating !== null ? new Date(item?.lastRating)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' }) : 'n/a'}
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

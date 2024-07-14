<script lang='ts'>
import { goto } from '$app/navigation';
import { screenWidth, numberOfUnreadNotification } from '$lib/store';
import InfiniteLoading from '$lib/components/InfiniteLoading.svelte';

export let data;

let analystStats = data?.getAnalystStats;

let rawData = data?.getAnalystStats?.ratingsList;
let ratingsList = rawData?.slice(0,20) ?? [];
  
let analystScore = analystStats?.analystScore;
let rank = analystStats?.rank;
let analystName = analystStats?.analystName;
let companyName = analystStats?.companyName;
let totalRatings = analystStats?.totalRatings;
let successRate = analystStats?.successRate;
let avgReturn = analystStats?.avgReturn;
let numOfAnalysts = new Intl.NumberFormat("en", {minimumFractionDigits: 0,maximumFractionDigits: 0}).format(analystStats?.numOfAnalysts);
let numOfStocks = analystStats?.numOfStocks;

  async function infiniteHandler({ detail: { loaded, complete } }) 
  {
  if (ratingsList?.length === rawData?.length) {
      complete();
    } else {
      const nextIndex = ratingsList?.length;
      const newArticles = rawData?.slice(nextIndex, nextIndex + 5);
      ratingsList = [...ratingsList, ...newArticles];
      loaded();
    }
  }
  


function sectorSelector(sector) {
    let path;
    switch(sector) {
        case 'Financials':
            path = "financial-sector";
            break;
        case 'Healthcare':
            path = "healthcare-sector";
            break;
        case 'Information Technology':
            path = "technology-sector";
            break;
        case 'Technology':
            path = "technology-sector";
            break;
        case 'Financial Services':
            path = "financial-sector";
            break;
        case 'Industrials':
            path = "industrials-sector";
            break;
        case 'Energy':
            path = "energy-sector";
            break;
        case 'Utilities':
            path = "utilities-sector";
            break;
        case 'Consumer Cyclical':
            path = "consumer-cyclical-sector";
            break;
        case 'Real Estate':
            path = "real-estate-sector";
            break;
        case 'Basic Materials':
            path = "basic-materials-sector";
            break;
        case 'Communication Services':
            path = "communication-services-sector";
            break;
        case 'Consumer Defensive':
            path = "consumer-defensive-sector";
            break;
        default:
            // Handle default case if needed
            break;
    }
    goto("/list/" + path);
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
        <li><a href="/analysts" class="text-gray-300">Analysts</a></li> 
        <li class="text-gray-300">{analystName}</li>
      </ul>
    </div>
            
            
    <div class="w-full max-w-4xl overflow-hidden m-auto ">
      
      <div class="p-0 flex justify-center w-full m-auto overflow-hidden max-w-4xl">
          <div class="relative flex justify-center items-center overflow-hidden w-full">
              <main class="w-full">
              
                
                <div class="w-screen sm:w-full m-auto mt-12">

                    <div class="flex flex-row items-center justify-center sm:justify-start">
                        <svg class="w-16 h-16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#D4D4D4" d="M16 8a5 5 0 1 0 5 5a5 5 0 0 0-5-5"/><path fill="#D4D4D4" d="M16 2a14 14 0 1 0 14 14A14.016 14.016 0 0 0 16 2m7.993 22.926A5.002 5.002 0 0 0 19 20h-6a5.002 5.002 0 0 0-4.992 4.926a12 12 0 1 1 15.985 0"/></svg>
                        <div class="ml-3 flex flex-col items-start">
                            <div class="text-xl font-bold text-gray-200">{analystName}</div>
                            <div class="text-[1rem] text-gray-200">Analyst at {companyName}</div>
                            <div class="flex flex-row items-center mt-1">
                                {#each Array.from({ length: 5 }) as _, i}
                                {#if i < Math.floor(analystScore)}
                                    <svg class="w-5 h-5 text-[#FFA500]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                                        <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
                                    </svg>
                                      {:else}
                                          <svg class="w-5 h-5 text-gray-300 dark:text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                                              <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
                                          </svg>
                                      {/if}
                                  {/each}
                            
                                  <span class="ml-1 text-sm sm:text-[1rem] text-gray-400">
                                      ({analystScore})
                                  </span>
                              </div>
                        </div>
                    </div>

                    <div class="p-2 sm:p-0">
                      <div class="stats stats-horizontal bg-[#09090B] rounded-lg shadow w-full rounded-none sm:rounded-lg mt-12 mb-5">
              
                          <div class="grid grid-cols-2 sm:grid-cols-4 ">
                                    
              
                              <div class="stat">
                                  <div class="text-2xl font-bold text-gray-200"># {rank}</div>
                                  <div class="text-gray-200 text-sm">Out of {numOfAnalysts} analysts</div>
                                </div>
        
                                <div class="stat">
                                    <div class="text-2xl font-bold text-gray-200">{totalRatings}</div>
                                    <div class="text-gray-200 text-sm">Total Ratings</div>
                                </div>
                                
                                <div class="stat">
                                    <div class="text-2xl font-bold {successRate >= 10 ? 'text-[#36D984]' : 'text-[#EF4444]'}">{successRate?.toFixed(2)}%</div>
                                    <div class="text-gray-200 text-sm">Success Rate</div>
                                </div>
        
                                <div class="stat">
                                    <div class="text-2xl font-bold {avgReturn >= 0 ? 'text-[#36D984]' : 'text-[#EF4444]'}">{avgReturn?.toFixed(2)}%</div>
                                    <div class="text-gray-200 text-sm">Avg Return</div>
                                </div>
              
              
                          </div>
              
                            
                      </div>
                    </div>

                      <div class="p-2 sm:p-0 mb-10">
                      <div class="text-white p-5 rounded-lg sm:flex sm:flex-row sm:items-center border border-slate-800 text-sm sm:text-[1rem]">
                        <div class="flex flex-col items-start">
                          <span class="text-gray-300 font-bold">
                            Main Sectors:
                          </span>

                        <div class="mt-5 mb-3">
                          {#each data?.getAnalystStats?.mainSectors as sector}
                            <label on:click={() => sectorSelector(sector)} class="mr-2 cursor-pointer w-fit bg-[#404040] bg-opacity-[0.5] sm:hover:bg-opacity-[0.6] px-3 sm:px-4 py-2 text-sm font-medium rounded-xl sm:hover:text-white text-blue-400">
                              {sector}
                            </label>
                          {/each}
                        </div>

                        </div>
                      </div>
                    </div>
          


                    <span class="p-3 text-[#F5F5F5] font-bold text-2xl">
                        {numOfStocks} Stocks
                    </span>

                    <div class="w-screen sm:w-full m-auto mt-10">
                  
                      <div class="w-screen sm:w-full m-auto rounded-none sm:rounded-lg mb-4 overflow-x-scroll">
                        <table class="table table-sm table-compact rounded-none sm:rounded-md w-full bg-[#09090B] border-bg-[#09090B] m-auto">
                          <thead>
                            <tr class="bg-[#09090B] border-b border-blue-400">
                              <th class="text-start bg-[#09090B] text-gray-200 text-sm sm:text-[1rem] font-semibold">
                                Stock
                              </th>
                              <th class="text-start bg-[#09090B] text-white text-sm sm:text-[1rem] font-semibold">
                                Action
                              </th>
    
                              <th class="text-end hidden sm:table-cell bg-[#09090B] text-white text-sm sm:text-[1rem] font-semibold">
                                Price Target
                              </th>
                              <th class="text-white font-semibold text-end text-sm sm:text-[1rem]">
                                Date
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {#each ratingsList as item, index}
    
                            <tr on:click={() => goto(`/stocks/${item?.ticker}`)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#27272A] cursor-pointer">
    
                              <td class="text-sm text-start">
                                <div class="flex flex-col items-start w-20 sm:w-fit">
                                  <span class="text-blue-400 text-sm">{item?.ticker} </span>
                                  <span class="text-white text-xs sm:text-sm">{item?.name} </span>
                              </div>
                                  
                              </td>
                            
    
                              <td class="text-sm text-start">
                                <div class="flex flex-col sm:flex-row items-start">
                                  <span class="hidden sm:block text-sm font-medium text-white mr-1">{item?.action_company}:</span>
                                  <span class="text-sm font-medium {['Strong Buy', 'Buy']?.includes(item?.rating_current) ? 'text-[#10DB06]' : item?.rating_current === 'Hold' ? 'text-[#FF7070]' : ['Strong Sell','Sell']?.includes(item?.rating_current) ? 'text-[#FF2F1F]' : 'text-gray-300'}"> 
                                    {item?.rating_current}
                                  </span>
                                  <span class="sm:hidden text-sm font-medium text-white">{item?.action_company}</span>
                                  <div class="sm:hidden flex flex-row items-center justify-start">
                                      {#if Math?.ceil(item?.adjusted_pt_prior) !== 0}
                                      <span class="text-gray-100 text-sm font-normal">${Math?.ceil(item?.adjusted_pt_prior)}</span>
                                      <svg class="w-3 h-3 ml-1 mr-1 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 12h16m0 0l-6-6m6 6l-6 6"/></svg>
                                      <span class="text-white">${Math?.ceil(item?.adjusted_pt_current)}</span>
                                      {:else if Math?.ceil(item?.adjusted_pt_current) !== 0}
                                      <span class="text-white sm:font-semibold">${Math?.ceil(item?.adjusted_pt_current)}</span>
                                      {/if}
                                  </div>
                                </div>
                              </td>
    
                              <td class="text-white hidden sm:table-cell text-sm">
                                  <div class="flex flex-row items-center justify-end">
                                      {#if Math?.ceil(item?.adjusted_pt_prior) !== 0}
                                      <span class="text-gray-100 font-normal">${Math?.ceil(item?.adjusted_pt_prior)}</span>
                                      <svg class="w-3 h-3 ml-1 mr-1 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 12h16m0 0l-6-6m6 6l-6 6"/></svg>
                                      <span class="text-white font-semibold">${Math?.ceil(item?.adjusted_pt_current)}</span>
                                      {:else if Math?.ceil(item?.adjusted_pt_current) !== 0}
                                      <span class="text-white font-semibold">${Math?.ceil(item?.adjusted_pt_current)}</span>
                                      {/if}
                                  </div>
                            </td>

                            <td class="text-white text-end sm:font-medium text-sm">
                              {new Date(item?.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                            </td>
                                
                            </tr>
                          {/each}
                          </tbody>
                        </table>
                    </div>
                      <InfiniteLoading on:infinite={infiniteHandler} />
    
                  </div>


                    
                    <InfiniteLoading on:infinite={infiniteHandler} />
  
                </div>
              
              </main>
          </div>
      </div>
  
    
    </div>
        
        
    
  </section>
  
  
<script lang="ts">

import {numberOfUnreadNotification, displayCompanyName, stockTicker, currentPortfolioPrice} from '$lib/store';
import InfoModal from '$lib/components/InfoModal.svelte';
import InfiniteLoading from '$lib/components/InfiniteLoading.svelte';
import { goto } from '$app/navigation';
import UpgradeToPro from '$lib/components/UpgradeToPro.svelte';

export let data;

let analystRating = data?.getAnalystRating ?? {};

let rawData = [];
let historyList = []
let priceTarget = 'n/a';
let numOfAnalyst = 0;
let consensusRating = 'n/a';
let changesPercentage = 0;  

let filterRule = 'all';




async function infiniteHandler({ detail: { loaded, complete } }) 
{
if (historyList?.length === rawData?.length) {
    complete();
  } else {
    const nextIndex = historyList?.length;
    const newArticles = rawData?.slice(nextIndex, nextIndex + 5);
    historyList = [...historyList, ...newArticles];
    loaded();
  }
}
    
$: {
  if(filterRule) {
    if(Object?.keys(analystRating)?.length !== 0) {

    numOfAnalyst = analystRating?.numOfAnalyst;
    priceTarget = analystRating?.priceTarget
    consensusRating = analystRating?.consensusRating;
    changesPercentage = ((priceTarget/$currentPortfolioPrice -1)*100)?.toFixed(2) ?? 0;


    }
    if (filterRule === 'topAnalysts') {
      rawData = data?.getAnalystTickerHistory?.filter(item => item?.analystScore >=4)
      historyList = rawData?.slice(0,10)
    }
    else {
      rawData = data?.getAnalystTickerHistory ?? [];
      historyList = rawData?.slice(0,10)
    }

  }
}
    

function latestInfoDate(inputDate) {
    // Convert the input date string to milliseconds since epoch
    const inputDateMs = Date?.parse(inputDate);

    // Get today's date in milliseconds since epoch
    const todayMs = Date?.now();

    // Calculate the difference in milliseconds
    const differenceInMs = todayMs - inputDateMs;

    // Convert milliseconds to days
    const differenceInDays = Math?.floor(differenceInMs / (1000 * 60 * 60 * 24));

    // Return the difference in days
    return differenceInDays <=4;
}

</script>
    
    
      
<svelte:head>

<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
<title>
    {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} {$displayCompanyName} ({$stockTicker}) Analyst Ratings · stocknear
</title>
<meta name="description" content={`A list of analyst ratings for Advanced Micro Devices (AMD) stock. See upgrades, downgrades, price targets and more from top Wall Street stock analysts.`} />

<!-- Other meta tags -->
<meta property="og:title" content={`${$displayCompanyName} (${$stockTicker}) Analyst Ratings · stocknear`}/>
<meta property="og:description" content={`A list of analyst ratings for Advanced Micro Devices (AMD) stock. See upgrades, downgrades, price targets and more from top Wall Street stock analysts.`} />
<meta property="og:type" content="website"/>
<!-- Add more Open Graph meta tags as needed -->

<!-- Twitter specific meta tags -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content={`${$displayCompanyName} (${$stockTicker}) Analyst Ratings · stocknear`}/>
<meta name="twitter:description" content={`A list of analyst ratings for Advanced Micro Devices (AMD) stock. See upgrades, downgrades, price targets and more from top Wall Street stock analysts.`} />
<!-- Add more Twitter meta tags as needed -->

</svelte:head>

    
                  
    
    
<section class="bg-[#0F0F0F] overflow-hidden text-white h-full mb-40 sm:mb-0 w-full">
    <div class="flex justify-center m-auto h-full overflow-hidden w-full">
        <div class="relative flex justify-center items-center overflow-hidden w-full">
              <div class="sm:p-7 w-full m-auto mt-2 sm:mt-0">
                    <div class="mb-6">
                        <h2 class="text-2xl sm:text-3xl text-gray-200 font-bold mb-4">
                            Analyst Ratings
                        </h2>



                    </div>

            
                {#if historyList?.length !== 0}

                <div class="stats stats-horizontal bg-[#202020] w-full rounded-lg pr-6 sm:pr-0">
        
                  <div class="grid grid-cols-2">
      
                    <div class="stat">
                      <div class="flex flex-row items-center">
                        <label for="totalAnalystInfo" class="cursor-pointer stat-title text-md sm:text-lg font-medium text-gray-300">
                          Total Analyst
                        </label>
                        <InfoModal
                          title={"Total Analyst"}
                          content={"The total number of analyst who provided a rating in the past 12 months."}
                          id={"totalAnalystInfo"}
                        />
                        </div>
                      <div class="stat-value mt-1 text-lg text-gray-200 font-semibold">
                        {numOfAnalyst}
                      </div>
                    </div>
                  
      
                    <div class="stat">
                      <div class="flex flex-row items-center">
                      <label for="consensusRatingInfo" class="cursor-pointer stat-title text-md sm:text-lg font-medium text-gray-300">
                        Consensus Rating
                      </label>
                      <InfoModal
                            title={"Consensus Rating"}
                            content={`The average analyst rating for ${$stockTicker} is standardized to align with categories: Strong Buy, Buy, Hold, Sell, and Strong Sell.`}
                            id={"consensusRatingInfo"}
                          />
                      </div>
                      
                      <div class="stat-value font-semibold {['Strong Buy', 'Buy']?.includes(consensusRating) ? 'text-[#10DB06]' : consensusRating === 'Hold' ? 'text-[#FF7070]' : ['Strong Sell','Sell']?.includes(consensusRating) ? 'text-[#FF2F1F]' : 'text-gray-200'} mt-1 text-lg">
                        {consensusRating}
                      </div>
                    </div>
                    
                    <div class="stat">
                      <div class="flex flex-row items-center">
                      <label for="priceTargetInfo" class="cursor-pointer stat-title text-md sm:text-lg font-medium text-gray-300">
                        Price Target
                      </label>
                      <InfoModal
                        title={"Price Target"}
                        content={"The average 12-month price target"}
                          id={"priceTargetInfo"}
                          />
                        </div>
                      <div class="stat-value font-semibold text-lg  text-gray-200">
                        ${priceTarget}
                      </div>
                    </div>
      
                    <div class="stat">
                      <div class="flex flex-row items-center">
                        <label for="upsideInfo" class="cursor-pointer stat-title text-md sm:text-lg font-medium text-gray-300">
                          Upside
                        </label>
                        <InfoModal
                          title={"Upside"}
                          content={"The average price target's percentage difference from the current stock price."}
                          id={"upsideInfo"}
                          />
                          </div>
                      <div class="stat-value font-semibold text-lg text-gray-200">
                        <div class="flex flex-row items-center">
                          {#if changesPercentage >=0}
                            <span class="text-[#10DB06]">+{changesPercentage}%</span>
                          {:else}
                            <span class="text-[#FF2F1F]">{changesPercentage}% </span> 
                          {/if}
                        </div>
                      </div>
                    </div>
      
                    </div>
                  
                </div>


                       
    

                    
                        
                        <h3 class="mt-10 text-2xl sm:text-3xl text-gray-200 font-bold mb-4 text-center sm:text-start">
                            Ratings History
                        </h3>

                        


                        <div class="mt-5 text-white p-3 sm:p-5 mb-5 rounded-lg sm:flex sm:flex-row sm:items-center border border-slate-800 text-sm sm:text-[1rem]">
                          <svg class="w-6 h-6 flex-shrink-0 inline-block sm:mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill='#60a5fa' d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
                          In previous years, Wall Street analysts have given {$displayCompanyName} a total of {data?.getAnalystTickerHistory?.length} ratings.
                        </div>


                        <div class="flex flex-col items-end w-full">
                          <InfoModal
                          title={"Top Analysts"}
                          content={"Filter for analysts rated 4+ stars focusing on their win rate and average return per rating. Analysts with 4+ stars typically exhibit both high accuracy and high return per rating."}
                          id={"topAnalystsInfo"}
                          />
                          <ul class="text-[0.8rem] font-medium text-center w-full pt-3 sm:w-56 mb-5 sm:ml-auto flex">
                            <li class="w-full">
                                <label on:click={() => filterRule = 'all'} class="font-semibold cursor-pointer rounded-l-lg inline-block w-full py-2.5 text-white {filterRule === 'all' ? 'bg-[#3C74D4]' : 'bg-[#2A303C]'} border-r border-gray-600" aria-current="page">
                                  All Analysts
                                </label>
                            </li>
                            <li class="w-full">
                              {#if data?.user?.tier === 'Pro'}
                                <label on:click={() => filterRule = 'topAnalysts'} class="font-semibold cursor-pointer inline-block w-full py-2.5 {filterRule === 'topAnalysts' ? 'bg-[#3C74D4]' : 'bg-[#2A303C]'} text-white rounded-r-lg">
                                  Top Analysts
                                </label>
                              {:else}
                              <a href="/pricing" class="font-semibold flex flex-row items-center m-auto justify-center cursor-pointer inline-block w-full py-2.5 bg-[#2A303C] text-white rounded-r-lg">
                                <span class="">Top Analysts</span>
                                <svg class="ml-1 -mt-0.5 w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#A3A3A3" d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"/></svg>
                              </a>
                              {/if}

                            </li>
                          </ul>
                        </div>

                        <div class="w-screen -ml-3 sm:w-full sm:ml-0 flex justify-start items-center m-auto overflow-hidden">
                            
                            <table class="table table-sm table-compact rounded-none sm:rounded-md w-full border-bg-[#0F0F0F] m-auto mt-4">
                                <thead class="">
                                  <tr class="">
                                    <td class="text-white font-bold text-sm sm:text-[1rem] text-start">Analyst</td>
                                    <td class="text-white font-bold text-sm sm:text-[1rem] text-start">Rating</td>
                                    <td class="text-white font-bold text-sm sm:text-[1rem] text-end">Date</td>
                                  </tr>
                                </thead>
                                <tbody>
                                  {#each (data?.user?.tier === 'Pro' ? historyList : historyList?.slice(0,3)) as item,index}
                                  <tr on:click={() => goto(`/analysts/${item?.analystId}`)} class="cursor-pointer {latestInfoDate(item?.date) ? 'bg-[#F9AB00] bg-opacity-[0.1]' : 'bg-[#0F0F0F]'} border-b-[#0F0F0F] {index+1 === historyList?.slice(0,3)?.length && data?.user?.tier !== 'Pro' ? 'opacity-[0.1]' : ''}">
                                    <td class="text-sm text-start">
                                      <div class="flex flex-col items-start">
                                        <span class="text-blue-400 font-medium">{item?.analyst_name} </span>
                                        <span class="text-white text-opacity-80">{item?.analyst?.length > 15 ? item?.analyst?.slice(0,15) + '...' : item?.analyst}</span>
                                        
                                            <div class="flex flex-row items-center mt-1">
                                              {#each Array.from({ length: 5 }) as _, i}
                                              {#if i < Math.floor(item?.analystScore)}
                                                  <svg class="w-3 h-3 text-yellow-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                                                      <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
                                                  </svg>
                                                    {:else}
                                                        <svg class="w-3 h-3 text-gray-300 dark:text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                                                            <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
                                                        </svg>
                                                    {/if}
                                                {/each}
                                          
                                                <span class="ml-1 text-xs text-gray-400">
                                                    ({item?.analystScore !== null ? item?.analystScore : 0})
                                                </span>
                                            
                                            </div>
                                    </div>
                                        
                                    </td>
                
                                    <td class="text-sm text-center text-white">
                                        <div class="flex flex-col items-start">
                                            <span class="text-sm sm:text-[1rem] font-medium {['Strong Buy', 'Buy']?.includes(item?.rating_current) ? 'text-[#10DB06]' : item?.rating_current === 'Hold' ? 'text-[#FF7070]' : ['Strong Sell','Sell']?.includes(item?.rating_current) ? 'text-[#FF2F1F]' : ''}"> 
                                                {item?.rating_current}
                                            </span>
                                            <span class="text-[0.8rem] font-medium text-white">{item?.action_company?.replace('Initiates Coverage On','Initiates')}</span>
                                            <div class="flex flex-row items-center text-sm">
                                                {#if Math?.ceil(item?.adjusted_pt_prior) !== 0}
                                                <span class="text-gray-100  font-normal">${Math?.ceil(item?.adjusted_pt_prior)}</span>
                                                <svg class="w-3 h-3 ml-1 mr-1 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 12h16m0 0l-6-6m6 6l-6 6"/></svg>
                                                <span class="text-white font-semibold">${Math?.ceil(item?.adjusted_pt_current)}</span>
                                                {:else if  Math?.ceil(item?.adjusted_pt_current) !== 0}
                                                <span class="text-white font-semibold">${Math?.ceil(item?.adjusted_pt_current)}</span>
                                                {/if}
                                            </div>
                                        </div>
                                    </td>
                  
                                  <td class="text-white text-end font-medium text-sm sm:w-auto">
                                    <div class="flex flex-col items-end">
                                      {#if latestInfoDate(item?.date)}
                                        <label class="bg-[#2D4F8A] text-white font-medium text-xs rounded-lg px-2 py-0.5 ml-3 mb-1">
                                          New
                                        </label>
                                      {/if}
                                      {new Date(item?.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                                    </div>
                                  </td>
                  
                                  </tr>
                                  
                              
                                  {/each}

                                </tbody>
                                
                            </table>

                        </div>
                        {#if data?.user?.tier === 'Pro'}
                        <InfiniteLoading on:infinite={infiniteHandler} />
                        {/if}

                        <UpgradeToPro data={data} title="Get stock forecasts from Wall Street's highest rated professionals"/>

                    {:else}
                    <div class="flex justify-center items-center m-auto mt-10 mb-6">
                        <div class="text-gray-100 text-sm sm:text-[1rem] rounded-lg h-auto border border-slate-800 p-4">
                        <svg class="w-5 h-5 inline-block sm:mr-1 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#60a5fa" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
                            Wall Street analysts have not provided any ratings for  {$displayCompanyName}
                        </div>
                    </div>

                    
                    {/if}
                    
              


              </div>

              
        </div>
    </div>

    
</section>


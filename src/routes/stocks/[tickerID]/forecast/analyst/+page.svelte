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

const tabs = [
  {
    title: "All Analysts",
  },
  {
    title: "Top Analysts",
  }
];

let activeIdx = 0;

function changeTab(index) {
  activeIdx = index;
  
  if(Object?.keys(analystRating)?.length !== 0) {

    numOfAnalyst = analystRating?.numOfAnalyst;
    priceTarget = analystRating?.priceTarget
    consensusRating = analystRating?.consensusRating;
    changesPercentage = ((priceTarget/$currentPortfolioPrice -1)*100)?.toFixed(2) ?? 0;

    }
    if (activeIdx === 1) {
      rawData = data?.getAnalystTickerHistory?.filter(item => item?.analystScore >=4)
      historyList = rawData?.slice(0,10)
    }
    else {
      rawData = data?.getAnalystTickerHistory ?? [];
      historyList = rawData?.slice(0,10)
    }
}

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


changeTab(0)

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

    
                  
    
    
<section class="bg-[#09090B] overflow-hidden text-white h-full mb-40 sm:mb-0 w-full">
    <div class="flex justify-center m-auto h-full overflow-hidden w-full">
        <div class="relative flex justify-center items-center overflow-hidden w-full">
              <div class="sm:p-7 w-full m-auto mt-2 sm:mt-0">
                    <div class="mb-6">
                        <h2 class="text-2xl sm:text-3xl text-gray-200 font-bold mb-4">
                            Analyst Ratings
                        </h2>



                    </div>

            
                {#if historyList?.length !== 0}

                <div class="mb-4 grid grid-cols-2 grid-rows-2 divide-gray-500 rounded-lg border border-gray-600 bg-[#272727] shadow md:grid-cols-4 md:grid-rows-1 md:divide-x">
                  <div class="p-4 bp:p-5 sm:p-6">
                    <label for="totalAnalystInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-[1rem]">
                      Total Analysts 
                      <InfoModal
                      title={"Total Analyst"}
                      content={"The total number of analyst who provided a rating in the past 12 months."}
                      id={"totalAnalystInfo"}
                      />
                    </label>   
                      <div class="mt-1 break-words font-semibold leading-8 text-light text-xl">
                        {numOfAnalyst}
                      </div> 
                  </div>
                  <div class="p-4 bp:p-5 sm:p-6 border-l border-contrast md:border-0">
                    <label for="consensusRatingInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-[1rem]">
                      Total Rating 
                      <InfoModal
                      title={"Consensus Rating"}
                      content={`The average analyst rating for ${$stockTicker} is standardized to align with categories: Strong Buy, Buy, Hold, Sell, and Strong Sell.`}
                      id={"consensusRatingInfo"}
                    />
                    </label>  
      
                      <div class="mt-1 break-words font-semibold leading-8 text-light text-xl">
                        {consensusRating}
                      </div> 
                  </div>
                  <div class="p-4 bp:p-5 sm:p-6 border-t border-contrast md:border-0">
                    <label for="priceTargetInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-[1rem]">
                      Price Target 
                      <InfoModal
                      title={"Price Target"}
                      content={"The average 12-month price target"}
                      id={"priceTargetInfo"}
                      />
                    </label>    
                   
                      <div class="mt-1 break-words font-semibold leading-8 text-light text-xl">
                        ${priceTarget}
                      </div> 
                  </div>
                  <div class="p-4 bp:p-5 sm:p-6 border-t border-contrast md:border-0 border-l border-contrast md:border-0">
                    <label for="upsideInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-[1rem]">
                      Upside 
                      <InfoModal
                      title={"Upside"}
                      content={"The average price target's percentage difference from the current stock price."}
                      id={"upsideInfo"}
                      />
                    </label>      

                      <div class="mt-1 break-words font-semibold leading-8 text-light text-xl">
                        {#if changesPercentage >=0}
                            <span class="text-[#10DB06]">+{changesPercentage}%</span>
                          {:else}
                            <span class="text-[#FF2F1F]">{changesPercentage}% </span> 
                          {/if}
                      </div> 
                  </div>
              </div>

                  

                        
                        <h3 class="mt-10 text-2xl sm:text-3xl text-gray-200 font-bold mb-4 text-center sm:text-start">
                            Ratings History
                        </h3>

                        


                        <div class="mt-5 w-fit text-white p-3 sm:p-5 mb-5 rounded-lg sm:flex sm:flex-row sm:items-center border border-slate-800 text-sm sm:text-[1rem]">
                          <svg class="w-6 h-6 flex-shrink-0 inline-block sm:mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill='#a474f6' d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
                          In previous years, Wall Street analysts have given {$displayCompanyName} a total of {data?.getAnalystTickerHistory?.length} ratings.
                        </div>


                        <div class="flex flex-col items-end w-full">
                          <InfoModal
                          title={"Top Analysts"}
                          content={"Filter for analysts rated 4+ stars focusing on their win rate and average return per rating. Analysts with 4+ stars typically exhibit both high accuracy and high return per rating."}
                          id={"topAnalystsInfo"}
                          />

                          <div class="ml-auto">
                          <div class="bg-[#313131] w-fit relative flex flex-wrap items-center justify-center rounded-lg p-1 mt-4">
                              {#each tabs as item, i}
                                <button
                                  on:click={() => changeTab(i)}
                                  class="group relative z-[1] rounded-full px-6 py-2 {activeIdx === i
                                    ? 'z-0'
                                    : ''} "
                                >
                                  {#if activeIdx === i}
                                      <div
                                        class="absolute inset-0 rounded-lg bg-purple-600"
                                      ></div>
                                  {/if}
                                  <span
                                    class="relative text-sm block font-medium duration-200 text-white">
                                    {item.title}
                                  </span>
                                </button>
                              {/each}
                          </div>
                        </div>
                        </div>

                        <div class="sm:w-full m-auto mt-10 ">
                      
                    
                          <div class="w-full m-auto rounded-none sm:rounded-lg mb-4 overflow-x-scroll sm:overflow-hidden">
                            <table class="table table-sm table-compact no-scrollbar rounded-none sm:rounded-md w-full bg-[#09090B] border-bg-[#09090B] m-auto">
                                <thead class="">
                                  <tr class="">
                                    <td class="text-white font-semibold text-[1rem] text-start">Analyst</td>
                                    <td class="text-white font-semibold text-[1rem] text-start">Rating</td>
                                    <td class="text-white font-semibold text-[1rem] text-end">Date</td>
                                  </tr>
                                </thead>
                                <tbody>
                                  {#each (data?.user?.tier === 'Pro' ? historyList : historyList?.slice(0,3)) as item,index}
                                  <tr on:click={() => goto(`/analysts/${item?.analystId}`)} class="cursor-pointer {latestInfoDate(item?.date) ? 'bg-[#F9AB00] bg-opacity-[0.1]' : 'odd:bg-[#27272A]'} border-b-[#09090B]  {index+1 === historyList?.slice(0,3)?.length && data?.user?.tier !== 'Pro' ? 'opacity-[0.1]' : ''}">
                                    <td class="text-sm sm:text-[1rem] whitespace-nowrap text-start">
                                      <div class="flex flex-col items-start">
                                        <span class="text-blue-400">{item?.analyst_name} </span>
                                        <span class="text-white">{item?.analyst?.length > 15 ? item?.analyst?.slice(0,15) + '...' : item?.analyst}</span>
                                        
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
                                          
                                                <span class="ml-1 text-sm">
                                                    ({item?.analystScore !== null ? item?.analystScore : 0})
                                                </span>
                                            
                                            </div>
                                    </div>
                                        
                                    </td>
                
                                    <td class="text-sm sm:text-[1rem] whitespace-nowrap text-center text-white">
                                        <div class="flex flex-col items-start">
                                            <span class="text-[1rem] font-medium {['Strong Buy', 'Buy']?.includes(item?.rating_current) ? 'text-[#10DB06]' : item?.rating_current === 'Hold' ? 'text-[#FF7070]' : ['Strong Sell','Sell']?.includes(item?.rating_current) ? 'text-[#FF2F1F]' : ''}"> 
                                                {item?.rating_current}
                                            </span>
                                            <span class="font-medium text-white">{item?.action_company?.replace('Initiates Coverage On','Initiates')}</span>
                                            <div class="flex flex-row items-center">
                                                {#if Math?.ceil(item?.adjusted_pt_prior) !== 0}
                                                <span class="text-gray-100 font-normal">${Math?.ceil(item?.adjusted_pt_prior)}</span>
                                                <svg class="w-3 h-3 ml-1 mr-1 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 12h16m0 0l-6-6m6 6l-6 6"/></svg>
                                                <span class="text-white font-semibold">${Math?.ceil(item?.adjusted_pt_current)}</span>
                                                {:else if  Math?.ceil(item?.adjusted_pt_current) !== 0}
                                                <span class="text-white font-semibold">${Math?.ceil(item?.adjusted_pt_current)}</span>
                                                {/if}
                                            </div>
                                        </div>
                                    </td>
                  
                                  <td class="text-white text-end font-medium text-sm sm:text-[1rem] whitespace-nowrap">
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
                        </div>
                        {#if data?.user?.tier === 'Pro'}
                        <InfiniteLoading on:infinite={infiniteHandler} />
                        {/if}

                        <UpgradeToPro data={data} title="Get stock forecasts from Wall Street's highest rated professionals"/>

                    {:else}
                    <div class="w-full flex justify-start items-center m-auto mt-10 mb-6">
                        <div class="text-center w-fit text-gray-100 text-sm sm:text-[1rem] rounded-lg h-auto border border-slate-800 p-4">
                        <svg class="w-5 h-5 inline-block sm:mr-1 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#a474f6" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
                            Wall Street analysts have not provided any ratings for  {$displayCompanyName}
                        </div>
                    </div>

                    
                    {/if}
                    
              


              </div>

              
        </div>
    </div>

    
</section>


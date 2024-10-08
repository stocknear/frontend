<script lang="ts">
  import { onMount } from 'svelte';
  import { displayCompanyName, numberOfUnreadNotification, stockTicker } from '$lib/store';
	import { getPartyForPoliticians } from '$lib/utils';


  export let data;

  let rawData = data?.getSenateTrading;
  let buySellRatio = 0;
  let partyRatio = 0
  let senateTradingList = [];
  let isLoaded = false;
  let images = {};

  let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;


function backToTop() {
    window.scrollTo({
        top: 0,
    });
}



async function handleScroll() {
    const scrollThreshold = document.body.offsetHeight * 0.8; // 80% of the website height
    const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;
    if (isBottom && senateTradingList?.length !== rawData?.length) {
        const nextIndex = senateTradingList?.length;
        const filteredNewResults = rawData?.slice(nextIndex, nextIndex + 50);
        senateTradingList = [...senateTradingList, ...filteredNewResults];
    }
  }


onMount(async () => {

  
    rawData.forEach(item => {
        const representative = item?.representative || '';
        const fullName = representative.replace(/(\s(?:Dr\s)?\w(?:\.|(?=\s)))?\s/g, '_').trim();
        item.representative = fullName.replace(/_/g, ' ');
    });

    rawData = rawData?.map(item => {
        const party = getPartyForPoliticians(item?.representative);
        return {
            ...item,
            party: party
        };
    });

    // Count the occurrences of "Republican" and "Democrat"
    const partyCounts = rawData.reduce((counts, item) => {
        counts[item?.party] = (counts[item?.party] || 0) + 1;
        return counts;
    }, {});

    const typeCounts = rawData.reduce((counts, item) => {
        counts[item?.type] = (counts[item?.type ] || 0) + 1;
        return counts;
    }, {});

    partyRatio = partyCounts['Democratic'] > 0 && partyCounts['Republican'] === undefined ? 1 : partyCounts['Democratic'] === undefined ? 0 : partyCounts["Democratic"] / partyCounts["Republican"];
    buySellRatio = typeCounts['Bought'] > 0 && typeCounts['Sold'] === undefined ? 1 : typeCounts['Bought'] === undefined ? 0 : typeCounts["Bought"] / typeCounts["Sold"];

    senateTradingList = rawData.slice(0, 20) ?? [];

    isLoaded = true;

     window.addEventListener('scroll', handleScroll);
      return () => {
          window.removeEventListener('scroll', handleScroll);
      };

});
</script>



<svelte:head>

  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>
    {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} {$displayCompanyName} ({$stockTicker}) US Congress & Senate Trading · stocknear
  </title>
  <meta name="description" content={`Get the latest US congress & senate trading of ${$displayCompanyName} (${$stockTicker}) from democrates and republicans.`} />
  
  <!-- Other meta tags -->
  <meta property="og:title" content={`${$displayCompanyName} (${$stockTicker}) US Congress & Senate Trading · stocknear`}/>
  <meta property="og:description" content={`Get the latest US congress & senate trading of ${$displayCompanyName} (${$stockTicker}) from democrates and republicans.`} />
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content={`${$displayCompanyName} (${$stockTicker}) US Congress & Senate Trading · stocknear`}/>
  <meta name="twitter:description" content={`Get the latest US congress & senate trading of ${$displayCompanyName} (${$stockTicker}) from democrates and republicans.`} />
  <!-- Add more Twitter meta tags as needed -->

</svelte:head>
  
     

    
          
<section class="w-full bg-[#09090B] overflow-hidden text-white h-full mb-40 sm:mb-0">
  <div class="h-full overflow-hidden">
      <div class="relative flex justify-center items-center overflow-hidden">
            <div class="sm:p-7 w-full mt-2 sm:mt-0">
                  <div class="mb-6">
                      <h1 class="text-2xl sm:text-3xl text-gray-200 font-bold mb-4">
                          Congress Trading
                      </h1>
  

                        <div class="text-white p-3 sm:p-5 mb-10 rounded-lg sm:flex sm:flex-row sm:items-center border border-slate-800 text-sm sm:text-[1rem]">
                          <svg class="w-6 h-6 flex-shrink-0 inline-block sm:mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#a474f6" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
                          Get detailed insights of Corrupt US Politician 🇺🇸 who bought or sold {$displayCompanyName} and the amounts involved!

                        </div>
                       
    
                    </div>
                      {#if isLoaded}

                
      
                      {#if senateTradingList?.length !== 0}

                      <h3 class="text-white text-xl font-semibold ">
                        Congress Statistics
                      </h3>
                       <!--Start Widget-->
                       <div class="w-full mt-5 mb-10 m-auto flex justify-center items-center ">
                        <div class="w-full grid grid-cols-2 sm:grid-cols-3 gap-y-3 lg:gap-y-3 gap-x-3 ">
        
                          <!--Start Buy/Sell-->  
                          <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-4 bg-[#262626] rounded-lg h-20">
                            <div class="flex flex-col items-start">
                                <span class="font-semibold text-gray-200 text-sm sm:text-[1rem]">Buy/Sell</span>
                                <span class="text-start text-sm sm:text-[1rem] font-medium text-white">
                                  {buySellRatio?.toFixed(3)}
                                </span>
                            </div>
                            <!-- Circular Progress -->
                              <div class="relative size-14 ml-auto">
                                <svg class="size-full w-14 h-14" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                                  <!-- Background Circle -->
                                  <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#3E3E3E]" stroke-width="3"></circle>
                                  <!-- Progress Circle inside a group with rotation -->
                                  <g class="origin-center -rotate-90 transform">
                                    <circle cx="18" cy="18" r="16" fill="none" class="stroke-current {buySellRatio >=0.5 ? 'text-[#00FC50]' : 'text-[#EE5365]'} " stroke-width="3" stroke-dasharray="100" stroke-dashoffset={(100- buySellRatio*100) >= 0 ? 100-(buySellRatio*100)?.toFixed(2) : 0}></circle>
                                  </g>
                                </svg>
                                <!-- Percentage Text -->
                                <div class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
                                  <span class="text-center text-white text-sm sm:text-[1rem]">{buySellRatio?.toFixed(2)}</span>
                                </div>
                              </div>
                            <!-- End Circular Progress -->
                  
                        </div>
                        <!--End Buy/Sell-->
                        <!--Start Dem/Rep-->  
                        <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-4 bg-[#262626] rounded-lg h-20">
                          <div class="flex flex-col items-start">
                              <span class="font-semibold text-gray-200 text-sm sm:text-[1rem]">Dem/Rep</span>
                              <span class="text-start text-sm sm:text-[1rem] font-medium text-white">
                                {partyRatio?.toFixed(3)}
                              </span>
                          </div>
                          <!-- Circular Progress -->
                            <div class="relative size-14 ml-auto">
                              <svg class="size-full w-14 h-14" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                                <!-- Background Circle -->
                                <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#3E3E3E]" stroke-width="3"></circle>
                                <!-- Progress Circle inside a group with rotation -->
                                <g class="origin-center -rotate-90 transform">
                                  <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-blue-500" stroke-width="3" stroke-dasharray="100" stroke-dashoffset={(100-partyRatio*100) >=0 ? 100-(partyRatio*100)?.toFixed(2) : 0}></circle>
                                </g>
                              </svg>
                              <!-- Percentage Text -->
                              <div class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
                                <span class="text-center text-white text-sm sm:text-[1rem]">{partyRatio?.toFixed(2)}</span>
                              </div>
                            </div>
                          <!-- End Circular Progress -->
                
                      </div>
                      <!--End Put/Call-->
                          </div>
                        </div>
                      <!--End Widget-->


                      <div class="mt-6 flex justify-start items-center w-full m-auto rounded-none sm:rounded-lg mb-4 overflow-x-scroll">
                        <table class="table table-sm sm:table-md table-compact rounded-none sm:rounded-md w-full bg-[#09090B] border-bg-[#09090B] m-auto">
                          <thead>
                            <tr class="bg-[#09090B] border-b border-[#27272A]">
                              <th class="shadow-md text-start bg-[#09090B] text-white text-sm font-semibold">
                                Person
                              </th>
                              <th class="shadow-md text-end bg-[#09090B] text-white text-sm font-semibold">
                                Transaction Date
                              </th>
                              <th class="shadow-md text-end bg-[#09090B] text-white text-sm font-semibold">
                                Amount
                              </th>
                              <th class="shadow-md text-white font-semibold text-end text-sm">Type</th>
                            </tr>
                          </thead>
                          <tbody>
                            {#each senateTradingList as item}
                            <tr class="odd:bg-[#27272A] sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] bg-[#09090B] border-b-[#09090B]">
    
                              <td class="text-white text-sm sm:text-[1rem] whitespace-nowrap pb-3 border-b border-b-[#09090B]">
                                <div class="flex flex-row items-center">
                                  <div class="flex-shrink-0 rounded-full border border-slate-700 w-10 h-10 sm:w-12 sm:h-12 relative {item?.party === 'Republican' ? 'bg-[#98272B]' : item?.party === 'Democratic' ? 'bg-[#295AC7]' : 'bg-[#4E2153]'} flex items-center justify-center">
                                    
                                    <img style="clip-path: circle(50%);" class="avatar rounded-full w-7 sm:w-9" src={`${cloudFrontUrl}/assets/senator/${item?.representative?.replace(/\s+/g, "_")}.png`} loading="lazy"/>
                                  </div>
                                  <div class="flex flex-col ml-3">
                                    <a href={`/politicians/${item?.id}`} class="sm:hover:text-white text-blue-400">{item?.representative?.replace('_',' ')}</a>
                                    <span class="">{item?.party}</span>
                                  </div>
                                </div>
                                <!--{item?.firstName} {item?.lastName}-->
                              </td>
    
                                <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap text-white border-b border-b-[#09090B]">
                                    {new Date(item?.transactionDate)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                                </td>

                                <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap text-white border-b border-b-[#09090B]">
                                    {item?.amount}
                                </td>
                                <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap text-white border-b border-b-[#09090B]">
                                  {#if item?.type === 'Bought'}
                                    <span class="text-[#37C97D]">Bought</span>
                                  {:else if item?.type === 'Sold'}
                                    <span class="text-[#FF2F1F]">Sold</span>
                                  {:else if item?.type === 'Exchange'}
                                    <span class="text-[#C6A755]">Exchange</span>
                                  {/if}
                                </td>
                            </tr>
                          {/each}

                          </tbody>
                        </table>

                        
                    </div>



                      {#if rawData?.length >= 20}
                      <label on:click={backToTop} class="w-32 py-1.5 mt-10 hover:bg-white hover:bg-opacity-[0.05] cursor-pointer m-auto flex justify-center items-center border border-slate-800 rounded-full">
                        Back to top
                      </label>
                      {/if}

      
                      {:else} 
                      <h2 class="pl-4 pr-4 flex justify-center items-center text-md sm:text-lg text-center text-slate-200">
                        No trading history available for {$displayCompanyName}. Likely no corrupt politican has interest in this stock.
                      </h2>
                      {/if}
      
  

                      {:else}
                      <div class="flex justify-center items-center h-80">
                        <div class="relative">
                        <label class="bg-[#09090B] rounded-xl h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <span class="loading loading-spinner loading-md text-gray-400"></span>
                        </label>
                        </div>
                    </div>

                      {/if}
                    
    
                </div>
            </div>
         </div>
    </section>


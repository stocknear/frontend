<script lang="ts">
  import { onMount } from 'svelte';
  import { displayCompanyName, numberOfUnreadNotification, stockTicker } from '$lib/store';
  import defaultAvatar from '$lib/images/senator/default-avatar.png';
  import republicanBackground from "$lib/images/bg-republican.png";
  import democraticBackground from "$lib/images/bg-democratic.png";
  import otherBackground from "$lib/images/bg-other.png";
  import InfiniteLoading from '$lib/components/InfiniteLoading.svelte';
	import { getPartyForPoliticians } from '$lib/utils';
  import { goto } from '$app/navigation';


  export let data;

  let rawData = data?.getSenateTrading;
  let buySellRatio = 0;
  let partyRatio = 0
  let senateTradingList = [];
  let displayStructure = 'Card';
  let isLoaded = false;
  let images = {};

function backToTop() {
    window.scrollTo({
        top: 0,
    });
}

function changeStructure() {
    if(displayStructure === 'Card') {
      displayStructure = 'Table';
    }
    else {
      displayStructure = 'Card';
    }
  }


const replacements = {
  'Thomas_Tuberville': 'Tommy_Tuberville',
  'Patrick_Toomey': 'Pat_Toomey',
  'Thomas_Carper': 'Tom_Carper',
  'Shelley_Moore_Capito': 'Shelley_Capito',
  'Christopher_Coons': 'Chris_Coons',
  'Daniel_Sullivan': 'Dan_Sullivan',
  'William_Cassidy': 'Bill_Cassidy',
  'Angus_King_.': 'Angus_King',
};

const district = {
  'Tommy_Tuberville': 'Alabama',
  'Sheldon_Whitehouse': 'Rhode Island',
  'Pat_Toomey': 'Pennsylvania',
  'Tom_Carper': 'Delaware',
  'Pat_Roberts': 'Kansas',
  'Markwayne_Mullin': 'Oklahoma',
  'Shelley_Capito': 'West Virginia',
  'Jerry_Moran': 'Kansas',
  'Dan_Sullivan': 'Alaska',
  'Ron_Wyden': 'Oregon',
  'John_Hickenlooper': 'Colorado',
  'David_Perdue': 'Georgia',
  'Kelly_Loeffler': 'Georgia',
  'Bill_Cassidy': 'Louisiana',
}

function replaceMultipleStrings(inputString, replacements) {
  // Create a regular expression pattern by joining the keys of the replacements object with '|'
  const pattern = new RegExp(Object?.keys(replacements)?.join('|'), 'gi');

  // Replace occurrences of the pattern with the corresponding values in the replacements object
  const resultString = inputString.replace(pattern, match => replacements[match]);

  return resultString;
}

async function infiniteHandler({ detail: { loaded, complete } }) 
{
  if (senateTradingList?.length === rawData?.length) {
      complete();
    } else {
      const nextIndex = senateTradingList?.length;
      const newArticles = rawData?.slice(nextIndex, nextIndex + 20);
      senateTradingList = [...senateTradingList, ...newArticles];
      loaded();
    }
}

  // Function to load images only when they are viewed
  async function loadImages() {
    const imageFiles = import.meta.glob('$lib/images/senator/*.png');
    const imagesPromises = [];

    for (const [path, resolver] of Object?.entries(imageFiles)) {
      const imageNameMatch = path.match(/\/([^/]+)\.png$/);
      if (imageNameMatch && imageNameMatch[1] !== 'default-avatar') {
        imagesPromises?.push(resolver()?.then(module => {
          images[imageNameMatch[1]] = module.default;
        }));
      }
    }

    await Promise?.all(imagesPromises);
  }


let fullName;

onMount(async () => {
  isLoaded = false;
  await loadImages();

  rawData?.forEach(item => {
      let representative = item?.representative || '';
  
      representative = representative?.replace('Jr', '')
          .replace(/Dr./g, '')
          .replace(/Dr_/g, '')
  
      const fullName = representative?.replace(/(\s(?:Dr\s)?\w(?:\.|(?=\s)))?\s/g, '_').trim();
      item.image = images[fullName] || defaultAvatar;
      item.representative = fullName?.replace(/_/g, ' ');
      });
  
      rawData = rawData?.map(item => {
          const party = getPartyForPoliticians(item?.representative);
          return {
              ...item,
              party: party
          };
});

// Count the occurrences of "Republican" and "Democrat"
const partyCounts = rawData?.reduce((counts, item) => {
    counts[item?.party] = (counts[item?.party] || 0) + 1;
    return counts;
}, {});

const typeCounts = rawData?.reduce((counts, item) => {
    counts[item?.type] = (counts[item?.type ] || 0) + 1;
    return counts;
}, {});

partyRatio = partyCounts['Democratic'] > 0 && partyCounts['Republican'] === undefined ? 1 : partyCounts['Democratic'] === undefined ? 0 : partyCounts["Democratic"]/partyCounts["Republican"];
buySellRatio = typeCounts['Bought'] > 0 && typeCounts['Sold'] === undefined ? 1 : typeCounts['Bought'] === undefined ? 0 : typeCounts["Bought"]/typeCounts["Sold"];

senateTradingList = rawData?.slice(0,20) ?? [];


isLoaded = true;

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

                      <h3 class="text-white text-xl font-semibold pt-5">
                        Congress Statistics
                      </h3>
                       <!--Start Widget-->
                       <div class="w-full mt-5 mb-10 m-auto flex justify-center items-center ">
                        <div class="w-full grid grid-cols-2 gap-y-3 lg:gap-y-3 gap-x-3 ">
        
                          <!--Start Buy/Sell-->  
                          <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-4 bg-[#262626] shadow-lg rounded-2xl h-20">
                            <div class="flex flex-col items-start">
                                <span class="font-semibold text-gray-200 text-sm sm:text-[1rem] ">Buy/Sell</span>
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
                                  <span class="text-center text-white text-sm">{buySellRatio?.toFixed(2)}</span>
                                </div>
                              </div>
                            <!-- End Circular Progress -->
                  
                        </div>
                        <!--End Buy/Sell-->
                        <!--Start Dem/Rep-->  
                        <div class="flex flex-row items-center flex-wrap w-full px-3 sm:px-4 bg-[#262626] shadow-lg rounded-2xl h-20">
                          <div class="flex flex-col items-start">
                              <span class="font-semibold text-gray-200 text-sm sm:text-[rem] ">Dem/Rep</span>
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
                                <span class="text-center text-white text-sm">{partyRatio?.toFixed(2)}</span>
                              </div>
                            </div>
                          <!-- End Circular Progress -->
                
                      </div>
                      <!--End Put/Call-->
                          </div>
                        </div>
                      <!--End Widget-->


                      <label on:click={changeStructure} class="sm:hidden w-24 sm:ml-3 mr-2 sm:mr-0 cursor-pointer bg-[#09090B] sm:hover:bg-[#09090B] duration-100 transition ease-in-out px-4 py-2 rounded-lg shadow-md">
                        <span class="m-auto mr-0.5 text-white text-sm">
                          Switch To: {displayStructure}
                        </span>
                      </label>
  

                      {#if displayStructure === 'Card'}
                      <div class="mt-6 flex justify-start items-center w-full m-auto rounded-none sm:rounded-lg mb-4">
                        <table class="table table-sm sm:table-md table-compact rounded-none sm:rounded-md w-full bg-[#09090B] border-bg-[#09090B] m-auto">
                          <thead>
                            <tr class="bg-[#09090B]">
                              <th class="shadow-md text-start bg-[#09090B] text-white text-sm font-semibold">
                                Person
                              </th>
                              <th class="shadow-md text-end bg-[#09090B]  hidden sm:table-cell text-white text-sm font-semibold">
                                Transaction Date
                              </th>
                              <th class="shadow-md text-end bg-[#09090B]  text-white text-sm font-semibold">
                                Amount
                              </th>
                              <th class="shadow-md text-white font-semibold text-end text-sm">Type</th>
                            </tr>
                          </thead>
                          <tbody>
                            {#each senateTradingList as item}
                            <tr on:click={() => goto(`/politicians/${item?.id}`)} class="odd:bg-[#27272A] sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] bg-[#09090B] border-b-[#09090B] cursor-pointer">
    
                              <td class="text-gray-200 pb-3 border-b border-b-[#09090B]">
                                <div class="flex flex-row items-center">
                                  <div class="flex-shrink-0 rounded-full border border-slate-700 w-10 h-10 sm:w-12 sm:h-12 relative {item?.party === 'Republican' ? 'bg-[#98272B]' : item?.party === 'Democratic' ? 'bg-[#295AC7]' : 'bg-[#4E2153]'} flex items-center justify-center">
                                    <img style="clip-path: circle(50%);" class="avatar rounded-full w-7 sm:w-9" src={item?.image} loading="lazy"/>
                                  </div>
                                  <div class="flex flex-col ml-3">
                                    <span class="text-white">{item?.representative?.replace('_',' ')}</span>
                                    <span class="text-white text-opacity-60">{item?.party}</span>
                                  </div>
                                </div>
                                <!--{item?.firstName} {item?.lastName}-->
                              </td>
    
                                <td class="text-end hidden sm:table-cell text-xs sm:text-sm text-white border-b border-b-[#09090B]">
                                    {new Date(item?.transactionDate)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                                </td>

                                <td class="text-end text-xs sm:text-sm text-white border-b border-b-[#09090B]">
                                    {item?.amount}
                                </td>
                                <td class="text-start text-end text-sm text-white border-b border-b-[#09090B]">
                                  {#if item?.type === 'Bought'}
                                    <span class="text-[#10DB06]">Bought</span>
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

                    <InfiniteLoading on:infinite={infiniteHandler} />

                      {:else}
                      <div class="relative w-full mt-10">
                        {#each senateTradingList as item}
                        <div class="w-full bg-[#09090B] border border-slate-800 shadow-lg h-auto pb-4 pt-4 mb-7">
                          <div class="flex flex-col relative ">
                            {#if item?.party === 'Republican'}
                            <img class="absolute -mt-4 w-full m-auto " src={republicanBackground} />
                            {:else if item?.party === 'Democratic'}
                              <img class="absolute -mt-4 w-[500px] m-auto "  src={democraticBackground} />
                            {:else}
                              <img class="absolute -mt-4 w-[500px] m-auto " src={otherBackground} />
                            {/if}
                            <div class="flex flex-col justify-center items-center rounded-2xl ">


                              <div class="-mt-3 shadow-lg rounded-full border border-slate-600 w-20 h-20 relative {item?.party === 'Republican' ? 'bg-[#98272B]' : item?.party === 'Democratic' ? 'bg-[#295AC7]' : 'bg-[#20202E]'} flex items-center justify-center">
                                <img style="clip-path: circle(50%);" class="rounded-full w-16" src={item?.image} loading="lazy"/>
                              </div>
                              <span class="text-white text-lg font-medium mt-2 mb-2">
                                {item?.representative?.replace('_',' ')}
                              </span>
                              <span class="text-white text-md mb-8">
                                {item?.party ?? 'n/a'} / {district[item?.representative] ?? 'n/a'}
                              </span>

                            </div>

                            <div class="flex flex-row items-center pr-4 pl-4">
                             
                              <div class="flex flex-col justify-start items-start">
                                <span class="font-medium text-white">Owner</span>
                                <span class="text-white text-opacity-[0.8] text-sm text-end">
                                  {item?.owner?.length !== 0 ? item?.owner : '-'}
                                </span>
                              </div>
                            </div>

                            <div class="border-1 border-b border-slate-800 w-full mt-5 mb-5" />
        
                            <div class="flex flex-row items-center pr-4 pl-4">
                              <div class="flex flex-col w-40">
                                <span class="font-medium text-white">Transaction Date</span>
                                <span class="text-slate-300 text-sm">
                                  {new Date(item?.transactionDate)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                                </span>
                              </div>
          
                              <div class="flex flex-col justify-end items-end ml-auto">
                                <span class="font-medium text-white">Disclosure Date</span>
                                <span class="text-white text-opacity-[0.8] text-sm text-end">
                                  {new Date(item?.disclosureDate)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                                </span>
                              </div>
                            </div>
        
                            <div class="border-1 border-b border-slate-800 w-full mt-5 mb-5" />
        
                            <div class="flex flex-row items-center pr-4 pl-4">
                              <div class="flex flex-col w-40">
                                <span class="font-medium text-white">Amount</span>
                                <span class="text-slate-300 text-sm font-medium">
                                  {item?.amount?.replace("$1,000,001 - $5,000,000","$1Mio - $5Mio")}
                                </span>
                              </div>
          
                              <div class="flex flex-col justify-end items-end ml-auto">
                                <span class="font-medium text-slate-300 text-ends">Type</span>
                                <span class="text-white font-medium text-end">
                                  {#if item?.type === 'Bought'}
                                  <span class="text-[#10DB06]">Bought</span>
                                  {:else if item?.type === 'Sold'}
                                  <span class="text-[#FF2F1F]">Sold</span>
                                  {:else if item?.type === 'Exchange'}
                                  <span class="text-[#C6A755]">Exchange</span>
                                {/if}
                                </span>
                              </div>
                            </div>

                          </div>
        
        
                        </div>
                      {/each}


                      </div>

                      {#if rawData?.length >= 20}
                      <label on:click={backToTop} class="w-32 py-1.5 mt-10 hover:bg-white hover:bg-opacity-[0.05] cursor-pointer m-auto flex justify-center items-center border border-slate-800 rounded-full">
                        Back to top
                      </label>
                      {/if}

                      <InfiniteLoading on:infinite={infiniteHandler} />

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
                            <span class="loading loading-spinner loading-md"></span>
                        </label>
                        </div>
                    </div>

                      {/if}
                    
    
                </div>
            </div>
         </div>
    </section>


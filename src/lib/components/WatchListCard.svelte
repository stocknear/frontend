<script lang='ts'>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { switchWatchList, screenWidth } from '$lib/store';
  import { formatDate, abbreviateNumber } from '$lib/utils';
  import InfoModal from '$lib/components/InfoModal.svelte';
  
  export let watchListId;
  export let apiKey;
  export let apiURL;
  


const sortTickersByName = (tickerList) => {
  return tickerList.sort(function(a, b) {
    if(order === 'highToLow')
    {
      return a?.symbol?.localeCompare(b?.symbol);
    }
    else {
      return b?.symbol?.localeCompare(a?.symbol);
    }
    
  });
};

const sortTickersByPrice = (tickerList) => {
  return tickerList.sort(function(a, b) {
    if(order === 'highToLow')
    {
      return b?.price - a?.price;
    }
    else {
      return a?.price - b?.price;
    }
     
    });
}

const sortTickersByEPS = (tickerList) => {
  return tickerList.sort(function(a, b) {
    if(order === 'highToLow')
    {
      return b?.eps - a?.eps;
    }
    else {
      return a?.eps - b?.eps;
    }
     
    });
};

const sortTickersByPE = (tickerList) => {
  return tickerList.sort(function(a, b) {
    if(order === 'highToLow')
    {
      return b?.pe - a?.pe;
    }
    else {
      return a?.pe - b?.pe;
    }
     
    });
};

const sortTickersByVolume = (tickerList) => {
  return tickerList.sort(function(a, b) {
    if(order === 'highToLow')
    {
      return b?.volume - a?.volume;
    }
    else {
      return a?.volume - b?.volume;
    }
     
    });
};

const sortTickersBySharesOutstanding = (tickerList) => {
  return tickerList.sort(function(a, b) {
    if(order === 'highToLow')
    {
      return b?.sharesOutstanding - a?.sharesOutstanding;
    }
    else {
      return a?.sharesOutstanding - b?.sharesOutstanding;
    }
     
    });
}

const sortTickersByMarketCap = (tickerList) => {
  return tickerList.sort(function(a, b) {
    if(order === 'highToLow')
    {
      return b?.marketCap - a?.marketCap;
    }
    else {
      return a?.marketCap - b?.marketCap;
    }
    });
}

const sortTickersByChange = (tickerList) => {
  return tickerList.sort(function(a, b) {
    if(order === 'highToLow')
    {
      return b?.changesPercentage - a?.changesPercentage;
    }
    else {
      return a?.changesPercentage - b?.changesPercentage;
    }
    });
}

  


  let isLoaded = false;
  
  let watchList: any[] = [];
  let news = [];

async function getWatchlistData()
{
  const postData = {'watchListId': watchListId}
  

  const response = await fetch(apiURL+'/get-watchlist', {
      method: 'POST',
      headers: {
      "Content-Type": "application/json","X-API-KEY": apiKey
      },
      body: JSON.stringify(postData)
  });

const output = await response.json();
console.log(output)

try {
  watchList = sortTickersByChange(output[0]);
}
catch(e) {
  watchList = []
}

news = output[1];



}



let roundedMean = 0;
let sum = 0;



onMount( async () => {


  await getWatchlistData()
  isLoaded = true;



  });
  



let order = 'highToLow';

function selectSortingMethod(state:string) {
  
    order = 'highToLow';
    
    if(state === 'Change')
    {
      sortBy = state;
      watchList = sortTickersByChange(watchList);
    }

    else if (state === 'Market Cap')
    {
      sortBy = state;
      watchList = sortTickersByMarketCap(watchList);
    }

    else if (state === 'Price')
    {
      sortBy = state;
      watchList = sortTickersByPrice(watchList);
    }

    else if (state === 'EPS')
    {
      sortBy = state;
      watchList = sortTickersByEPS(watchList);
    }

    else if (state === 'PE Ratio')
    {
      sortBy = state;
      watchList = sortTickersByPE(watchList);
    }

    else if (state === 'Volume')
    {
      sortBy = state;
      watchList = sortTickersByVolume(watchList);
    }

   
    else if (state === 'Name: A-Z')
    {
      sortBy = state;
      watchList = sortTickersByName(watchList);
    }
}



function changeOrder(state:string) {
  if (state === 'highToLow')
  {
    order = 'lowToHigh';
  }
  else {
    order = 'highToLow';
  }
}

let sortBy = 'Change';
let charNumber = 20;

  
$: {
  if ($screenWidth < 640)
  {
    charNumber = 15;
  }
  else {
    charNumber = 20;
  }
}




$: {
  if(order)
  {
    if(sortBy === 'Change')
    {
      watchList = sortTickersByChange(watchList);
    }

    else if (sortBy === 'Market Cap')
    {
      watchList = sortTickersByMarketCap(watchList);
    }

    else if (sortBy === 'Price')
    {
      watchList = sortTickersByPrice(watchList);
    }
    
    else if (sortBy === 'EPS')
    {
      watchList = sortTickersByEPS(watchList);
    }

    else if (sortBy === 'PE Ratio')
    {
      watchList = sortTickersByPE(watchList);
    }

    else if (sortBy === 'Volume')
    {
      watchList = sortTickersByVolume(watchList);
    }


    else if (sortBy === 'Name: A-Z')
    {
      watchList = sortTickersByName(watchList);
    } 
  }
}

$: {
  if($switchWatchList && typeof window !== 'undefined')
  {
    isLoaded = false
    sum = 0;
    roundedMean = 0;
    getWatchlistData()

  
  
    isLoaded = true;
    $switchWatchList = false;
  }
}

$: {
if(watchList && isLoaded)
{
  sum = 0;
  for (let i = 0; i < watchList?.length; i++) {
    const change = parseFloat(watchList[i]?.changesPercentage);
    sum += change;
  }

  //const mean = sum / watchList?.length;
  const mean = sum;
  roundedMean = mean?.toFixed(2);
}
}



</script>
 




<section class="w-full overflow-hidden m-auto min-h-screen pt-10 mb-40">



    {#if isLoaded}
      <!--Start Tickersinfo Length-->
      {#if watchList.length !== 0}


      <div class="flex flex-row items-center mb-5">
        <div class="flex flex-row items-center">
          <label for="performanceInfo" class="ml-2 cursor-pointer text-xl font-bold text-gray-300">
            Performance
          </label>
          <InfoModal
            title={"Performance"}
            content={"The performance indicator displays the daily percentage change for all positions on your watchlist."}
            id={"performanceInfo"}
          />
          </div>

        <div class="flex flex-row items-center mr-3 ml-auto">
        {#if roundedMean >= 0}
            <svg class="inline-block w-5 h-5 mt-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
            <span class="text-[#10DB06] text-sm font-medium">+{roundedMean}%</span>
        {:else if roundedMean < 0}
            <svg class="inline-block w-5 h-5 mt-1 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
            <span class="text-[#FF2F1F] text-sm font-medium">{roundedMean}%</span>
        {/if}
        </div>
      </div>




      <div class="flex justify-start items-center ml-3 mb-10">
        <label for="sortByModal" class="cursor-pointer bg-[#09090B] flex flex-row items-center">
          <span class="text-white text-sm sm:text-md mr-2">
            Sort By: 
          </span>
            <div class="flex flex-row items-center">
                <span class="text-sm sm:text-md m-auto font-medium text-white">
                  {sortBy}
                </span>
                <svg class="inline-block w-4 h-4 ml-1 mt-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
                    <g transform="rotate(180 512 512)">
                        <path fill="#fff" d="m488.832 344.32l-339.84 356.672a32 32 0 0 0 0 44.16l.384.384a29.44 29.44 0 0 0 42.688 0l320-335.872l319.872 335.872a29.44 29.44 0 0 0 42.688 0l.384-.384a32 32 0 0 0 0-44.16L535.168 344.32a32 32 0 0 0-46.336 0z"/>
                    </g>
                </svg>
            </div>
          </label>

          <label on:click={() => changeOrder(order)} class="ml-auto flex flex-row items-center mr-3 cursor-pointer">
            <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15"><path fill="{order === 'highToLow' ? 'white' : 'gray'}" d="m7.5 1.5l.354-.354L7.5.793l-.354.353l.354.354Zm-.354.354l4 4l.708-.708l-4-4l-.708.708Zm0-.708l-4 4l.708.708l4-4l-.708-.708ZM7 1.5V14h1V1.5H7Z"/></svg>
            <svg class="w-5 h-5 -ml-1.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15"><g transform="rotate(180 7.5 7.5)"><path fill="{order === 'lowToHigh' ? 'white' : 'gray'}" d="m7.5 1.5l.354-.354L7.5.793l-.354.353l.354.354Zm-.354.354l4 4l.708-.708l-4-4l-.708.708Zm0-.708l-4 4l.708.708l4-4l-.708-.708ZM7 1.5V14h1V1.5H7Z"/></g></svg>
          </label>
  
      </div>


      <div class="w-screen sm:w-full">

        <div class="w-full overflow-x-scroll">
          <table class="table table-sm table-compact rounded-none sm:rounded-md w-full bg-[#09090B] border-bg-[#09090B] m-auto mt-4 ">
            <!-- head -->
            <thead>
              <tr class="">
                <th class="text-white font-semibold text-[1rem] ">Symbol</th>
                <th class="text-white font-semibold text-[1rem] ">Company</th>
                <th class="text-white font-semibold text-center text-[1rem]  {$screenWidth < 640 && sortBy !== 'EPS' ? 'hidden' : ''}">EPS</th>
                <th class="text-white font-semibold text-center text-[1rem]  {$screenWidth < 640 && sortBy !== 'PE Ratio' ? 'hidden' : ''}">PE Ratio</th>
                <th class="text-white font-semibold text-center text-[1rem]  {$screenWidth < 640 && sortBy !== 'Volume' ? 'hidden' : ''}">Volume</th>
                <th class="text-white font-semibold text-center text-[1rem]  {$screenWidth < 640 && (sortBy !== 'Market Cap' && sortBy !== 'Change' && sortBy !== 'Price' && sortBy !== 'Name: A-Z') ? 'hidden' : ''}">Market Cap</th>
                <th class="text-white font-semibold text-end text-[1rem] ">Price</th>
                <th class="text-white font-semibold text-end text-[1rem] ">Change</th>
              </tr>
            </thead>
            <tbody class="p-0">
              {#each watchList as item, index}
              <!-- row -->
              <tr on:click={() => goto(`/${item?.type === 'stock' ? 'stocks' : item?.type === 'etf' ? 'etf' : 'crypto'}/${item?.symbol}`)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#27272A] border-b-[#09090B] cursor-pointer">
                

                <td class="text-blue-400 text-sm sm:text-[1rem] text-start border-b-[#09090B]">
                  {item?.symbol}
                </td>

                <td class="text-white text-sm sm:text-[1rem] border-b-[#09090B] whitespace-nowrap">
                {item?.name?.length > charNumber ? item?.name?.slice(0,charNumber) + "..." : item?.name}
                </td>

                <td class="text-white text-sm sm:text-[1rem] text-center border-b-[#09090B] {$screenWidth < 640 && sortBy !== 'EPS' ? 'hidden' : ''}">
                  {item?.eps !== null ? item?.eps?.toFixed(2) : '-'}
              </td>

              <td class="text-white text-sm sm:text-[1rem] text-center border-b-[#09090B] {$screenWidth < 640 && sortBy !== 'PE Ratio' ? 'hidden' : ''}">
                  {item?.pe !== null ? item?.pe?.toFixed(2) : '-'}
              </td>

              <td class="text-white text-sm sm:text-[1rem] whitespace-nowrap text-center border-b-[#09090B] {$screenWidth < 640 && sortBy !== 'Volume' ? 'hidden' : ''}">
                {new Intl.NumberFormat("en", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
              }).format(item?.volume)}
              </td>

              <td class="text-white text-sm sm:text-[1rem] whitespace-nowrap text-center border-b-[#09090B] {$screenWidth < 640 && (sortBy !== 'Market Cap' && sortBy !== 'Change' && sortBy !== 'Price' && sortBy !== 'Name: A-Z') ? 'hidden' : ''}">
                  {abbreviateNumber(item?.marketCap,true)}
              </td>


              <td class="border-b-[#09090B] text-sm sm:text-[1rem] text-end text-white whitespace-nowrap">
                ${item.price?.toFixed(2)}
              </td>

              <td class="border-b-[#09090B] text-end text-sm sm:text-[1rem] whitespace-nowrap">
                {#if item?.changesPercentage >=0}
                <span class="text-[#10DB06]">+{item?.changesPercentage?.toFixed(2)}%</span>
              {:else}
                <span class="text-[#FF2F1F]">{item?.changesPercentage?.toFixed(2)}% </span> 
              {/if}
              </td>


              </tr>
              
          


              {/each}
            </tbody>
          </table>
        </div>


            
            <div class="w-full m-auto border-b border-slate-800 mt-16 mb-16"></div>

            <h2 class="text-start text-white ml-2 text-xl font-bold text-black mb-3 ">Latest News</h2>
            <div class="relative text-gray-800 m-auto">
              <div class="flex flex-wrap md:flex-row">
                  {#each news as item}
                
                      <a href={item.url} target="_blank" class="cursor-pointer mb-10 w-full">
                        <div class="flex-shrink-0 float-left">
                          <img src={item?.image} class="float-left w-36 sm:w-40 rounded-xl ml-2 mr-4 mb-2" alt="news image" loading="lazy">
                          <div class="absolute w-36 sm:w-40 ml-2 mr-4 mb-2 h-6 bg-[#0C0F17] bg-opacity-80 flex justify-center items-center">
                            <p class="text-white italic text-xs">{(new URL(item?.url)).hostname.replace('www.','')}</p>
                          </div>
                        </div>
                        <div class="flex-grow">
                          <div class="text-sm text-white flex flex-row">
                        
                            <div class="rounded-full w-6 h-6 relative bg-gray-800 mr-1.5 mb-0.5">
                              <img class="rounded-full w-4 h-4 absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2" src={`https://financialmodelingprep.com/image-stock/${item.symbol}.png`} loading="lazy"/>
                            </div>
                            {item?.symbol} &centerdot; {formatDate(item?.publishedDate)} ago
                          </div>
                          <h2 class="text-start text-sm sm:text-md font-medium mb-2 flex-shrink text-white">{item.title}</h2>
                          <p class="text-white text-sm sm:text-md p-2">
                            {item?.text?.length > 250 ? item?.text?.slice(0,250) + "..." : item?.text}
                          </p>
                        </div>
                      </a>
                    {/each}
               
              </div>
            </div>

            


      </div>
  
  {:else}
  <div class="flex flex-col justify-center items-center m-auto pt-5">
    <span class="text-white font-bold text-white text-xl sm:text-3xl">
      Empty Watchlist
  </span>

    
    <svg  class="w-36 mt-6 sm:w-56" viewBox="0 0 148 69" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect opacity="0.1" width="148" height="69" rx="14" fill="white"></rect><rect opacity="0.1" x="8" y="8" width="63" height="24" rx="8" fill="white"></rect><rect opacity="0.1" x="77" y="8" width="63" height="24" rx="8" fill="white"></rect><rect opacity="0.1" x="8" y="36.5" width="63" height="24" rx="8" fill="white"></rect><rect opacity="0.1" x="77" y="37" width="63" height="24" rx="8" fill="white"></rect><rect opacity="0.2" x="17" y="15" width="22" height="4" fill="white"></rect><rect opacity="0.5" x="55" y="15" width="7" height="4" rx="2" fill="#E64141"></rect><rect opacity="0.5" x="124" y="15" width="7" height="4" rx="2" fill="#2DC97E"></rect><rect opacity="0.2" x="86" y="15" width="22" height="4" fill="white"></rect><rect opacity="0.2" x="17" y="43" width="22" height="4" fill="white"></rect><rect opacity="0.5" x="55" y="43" width="7" height="4" rx="2" fill="#2DC97E"></rect><rect opacity="0.5" x="124" y="43" width="7" height="4" rx="2" fill="#E64141"></rect><rect opacity="0.2" x="86" y="43" width="22" height="4" fill="white"></rect><rect opacity="0.1" x="17" y="21" width="45" height="4" fill="white"></rect><rect opacity="0.1" x="86" y="21" width="45" height="4" fill="white"></rect><rect opacity="0.1" x="17" y="49.5" width="45" height="4" fill="white"></rect><rect opacity="0.1" x="86" y="50" width="45" height="4" fill="white"></rect><rect x="6" y="6" width="8" height="8" rx="4" fill="#2C85FD"></rect><rect x="6" y="35" width="8" height="8" rx="4" fill="#2C85FD"></rect><rect x="76" y="6" width="8" height="8" rx="4" fill="#2C85FD"></rect><rect x="76" y="35" width="8" height="8" rx="4" fill="#2C85FD"></rect>
    </svg>
    


    <span class="text-white text-sm sm:text-lg pt-5 m-auto p-4 text-center">
      Fill it up with your favorite stocks and get realtime data and the latest news in one place!
    </span>
  </div>
  {/if}
  <!--End Tickersinfo Length-->


  {:else}
  <div class="flex justify-center items-center h-80">
      <div class="relative">
      <label class="bg-[#09090B] rounded-xl h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <span class="loading loading-spinner loading-md"></span>
      </label>
      </div>
  </div>


  {/if}


</section>







<!--Start Sort By Modal-->
<input type="checkbox" id="sortByModal" class="modal-toggle" />
    
<dialog id="sortByModal" class="modal modal-bottom sm:modal-middle ">


  <label id="sortByModal" for="sortByModal"  class="cursor-pointer modal-backdrop bg-[#09090B] bg-opacity-[0.5]"></label>
  
  
  <div class="modal-box w-full bg-[#09090B] sm:border sm:border-slate-800">



  <label for="sortByModal" class="cursor-pointer absolute right-5 top-2 bg-[#09090B] text-[1.8rem] text-white">
    ✕
  </label>

    <div class="text-white">
      
      <h3 class="font-medium text-lg sm:text-xl mb-10">
        Sort By
      </h3>
        

      <div class="flex flex-col items-center w-full max-w-3xl bg-[#09090B]">


        <label for="sortByModal" on:click={() => selectSortingMethod('Change')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">

            <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {sortBy === 'Change' ? 'ring-2 ring-[#04E000]' : ''}">
              
              <span class="ml-1 text-white font-medium mr-auto">
                Daily Change in %
              </span>

              <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                {#if sortBy === 'Change'}
                  <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#09090B000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                {/if}
              </div>

            </div>
           
        </label>


        <label for="sortByModal" on:click={() => selectSortingMethod('Price')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">

          <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {sortBy === 'Price' ? 'ring-2 ring-[#04E000]' : ''}">
            
            <span class="ml-1 text-white font-medium mr-auto">
              Price in $
            </span>

            <div class="rounded-full w-8 h-8 relative border border-[#737373]">
              {#if sortBy === 'Price'}
              <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#09090B000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
              {/if}
            </div>

          </div>
         
        </label>

    


        <label for="sortByModal" on:click={() => selectSortingMethod('Market Cap')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
          <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {sortBy === 'Market Cap' ? 'ring-2 ring-[#04E000]' : ''}">
            <span class="ml-1 text-white font-medium mr-auto">
              Market Cap
            </span>
            <div class="rounded-full w-8 h-8 relative border border-[#737373]">
              {#if sortBy === 'Market Cap'}
                <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#09090B000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
              {/if}
            </div>
          </div>
        </label>

        <label for="sortByModal" on:click={() => selectSortingMethod('EPS')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
          <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {sortBy === 'EPS' ? 'ring-2 ring-[#04E000]' : ''}">
            <span class="ml-1 text-white font-medium mr-auto">
              Earnings per Share
            </span>
            <div class="rounded-full w-8 h-8 relative border border-[#737373]">
              {#if sortBy === 'EPS'}
                <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#09090B000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
              {/if}
            </div>
          </div>
        </label>

        <label for="sortByModal" on:click={() => selectSortingMethod('PE Ratio')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
          <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {sortBy === 'PE Ratio' ? 'ring-2 ring-[#04E000]' : ''}">
            <span class="ml-1 text-white font-medium mr-auto">
              PE Ratio
            </span>
            <div class="rounded-full w-8 h-8 relative border border-[#737373]">
              {#if sortBy === 'PE Ratio'}
                <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#09090B000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
              {/if}
            </div>
          </div>
        </label>

        <label for="sortByModal" on:click={() => selectSortingMethod('Volume')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
          <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {sortBy === 'Volume' ? 'ring-2 ring-[#04E000]' : ''}">
            <span class="ml-1 text-white font-medium mr-auto">
              Volume
            </span>
            <div class="rounded-full w-8 h-8 relative border border-[#737373]">
              {#if sortBy === 'Volume'}
                <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#09090B000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
              {/if}
            </div>
          </div>
        </label>

    
        <label for="sortByModal" on:click={() => selectSortingMethod('Name: A-Z')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
          <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {sortBy === 'Name: A-Z' ? 'ring-2 ring-[#04E000]' : ''}">
            <span class="ml-1 text-white font-medium mr-auto">
              Name: A-Z
            </span>
            <div class="rounded-full w-8 h-8 relative border border-[#737373]">
              {#if sortBy === 'Name: A-Z'}
              <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#09090B000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
            {/if}
            </div>

          </div>
         
        </label>


      </div>
       
    </div>


        
      </div>
  </dialog>
<!--End Sort By Modal-->
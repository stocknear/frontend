<script lang='ts'>
  import { goto } from '$app/navigation';
  import {formatString} from '$lib/utils';
  import { abbreviateNumber } from '$lib/utils';
  import { screenWidth, numberOfUnreadNotification } from '$lib/store';


  export let data;
  
  let hedgeFundList = [];
  let rawData = data?.getWorstHedgeFunds;
  let sortBy = 'Win Rate';
  let order = 'lowToHigh';
  
    
  const sortByName = (liste) => {
      return liste?.sort(function(a, b) {
        if(order === 'highToLow')
        {
          return a?.name.localeCompare(b?.name);
        }
        else {
          return b?.name.localeCompare(a?.name);
        }
        
      });
    };
  
  const sortByMarketValue = (liste) => {
      return liste?.sort(function(a, b) {
        if(order === 'highToLow')
        {
          return b?.marketValue - a?.marketValue;
        }
        else {
          return a?.marketValue - b?.marketValue;
        }
         
        });
    }
      
  const sortByNumberOfStocks = (liste) => {
      return liste?.sort(function(a, b) {
          if(order === 'highToLow')
          {
          return b?.numberOfStocks - a?.numberOfStocks;
          }
          else {
          return a?.numberOfStocks - b?.numberOfStocks;
          }
          
          });
  }
  
  const sortByTurnover = (liste) => {
      return liste?.sort(function(a, b) {
          if(order === 'highToLow')
          {
          return b?.turnover - a?.turnover;
          }
          else {
          return a?.turnover - b?.turnover;
          }
          
          });
  }
  
  const sortByWinRate = (liste) => {
      return liste?.sort(function(a, b) {
          if(order === 'highToLow')
          {
          return b?.winRate - a?.winRate;
          }
          else {
          return a?.winRate - b?.winRate;
          }
          
          });
  }
      
    
  
  
  function selectSortingMethod(state:string) {
  
    order = 'highToLow';
  
    if(state === 'Value')
    {
    sortBy = state;
    hedgeFundList = sortByMarketValue(rawData);
    }
  
    else if (state === 'Stocks')
    {
    sortBy = state;
    hedgeFundList = sortByNumberOfStocks(rawData);
  
    }
  
    else if (state === 'Turnover')
    {
    sortBy = state;
    hedgeFundList = sortByTurnover(rawData);
    }
  
    else if (state === 'Win Rate')
    {
    sortBy = state;
    hedgeFundList = sortByWinRate(rawData);
    }
  
    else if (state === 'Name: A-Z')
    {
    sortBy = state;
    hedgeFundList = sortByName(rawData);
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
  

  
  
  let charNumber = 40;
  $: {
    if ($screenWidth < 640)
    {
      charNumber = 20
    }
    else {
      charNumber = 40;
    }
  }
  $: {
      if(order)
      {
        if(sortBy === 'Value')
        {
          hedgeFundList = sortByMarketValue(rawData);
        }
    
        else if (sortBy === 'Stocks')
        {
          hedgeFundList = sortByNumberOfStocks(rawData);
        }
    
        else if (sortBy === 'Turnover')
        {
          hedgeFundList = sortByTurnover(rawData);
        }
        
        else if (sortBy === 'Win Rate')
        {
          hedgeFundList = sortByWinRate(rawData);
        }
        else if (sortBy === 'Name: A-Z')
        {
          hedgeFundList = sortByName(rawData);
        } 
      }
    }
  
  
      
</script>
  
  <!-- HEADER FOR BETTER SEO -->
  <svelte:head>
    <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Worst Hedge Funds · stocknear</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
  
    <meta name="description" content="Find the worst performing Hedge Funds to learn from their expensive mistakes.">
    <!-- Other meta tags -->
    <meta property="og:title" content="Worst Hedge Funds · stocknear"/>
    <meta property="og:description" content="Find the worst performing Hedge Funds to learn from their expensive mistakes.">
    <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
    <meta property="og:type" content="website"/>
    <!-- Add more Open Graph meta tags as needed -->
  
    <!-- Twitter specific meta tags -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="Worst Hedge Funds · stocknear"/>
    <meta name="twitter:description" content="Find the worst performing Hedge Funds to learn from their expensive mistakes.">
    <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
    <!-- Add more Twitter meta tags as needed -->
  </svelte:head>
  <section class="w-full max-w-4xl overflow-hidden m-auto">
          
    
      
  
  
    <div class="flex justify-start items-center ml-3 mb-10">
      <label for="sortByModal" class="cursor-pointer bg-[#0F0F0F] flex flex-row items-center">
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



    <!---Start Top Winners/Losers-->
    <div class="flex flex-col justify-center items-center overflow-x-auto">
        
      <table 
      class="table table-sm sm:table-md table-compact rounded-none sm:rounded-md w-full bg-[#0F0F0F] border-bg-[#0F0F0F] m-auto">
      <thead>
        <tr class="border border-slate-800">
          <th class="text-white font-medium sm:font-bold text-sm">Company</th>
          <th class="text-white font-medium text-end sm:text-center sm:font-bold text-sm ">Value</th>
          <th class="text-white font-medium sm:font-bold text-end text-sm {$screenWidth < 640 && sortBy !== 'Stocks' ? 'hidden' : ''}">Stocks</th>
          <th class="text-white font-medium sm:font-bold text-end text-sm {$screenWidth < 640 && sortBy !== 'Turnover' ? 'hidden' : ''}">Turnover</th>
          <th class="text-white font-medium sm:font-bold text-end text-sm {$screenWidth < 640 && sortBy !== 'Value' && sortBy !== 'Win Rate' && sortBy !== 'Name: A-Z' ? 'hidden' : ''}">Win Rate</th>

        </tr>
      </thead>
      <tbody>
        {#each hedgeFundList as item, index}
          <tr on:click={() => goto("/hedge-funds/"+item?.cik)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] {index % 2 === 0 ? 'bg-opacity-[0.25] bg-[#323239]' : 'bg-[#0F0F0F]'} border-b-[#0F0F0F] cursor-pointer">

            <td class="text-gray-200 border-b-[#0F0F0F]">
              <div class="flex flex-row items-center ">
                <div class="">
                  <span class="text-blue-400">
                    {item?.name?.length > charNumber ? formatString(item?.name?.slice(0,charNumber)) + "..." : formatString(item?.name)}
                  </span>
              </div>
            </td>
  
          
    
      
          <td class="text-white sm:font-medium border-b-[#0F0F0F] text-end sm:text-center text-sm">
            {item?.marketValue !== null ? '$' + abbreviateNumber(item?.marketValue) : '-'}
          </td>
  
          <td class="text-white sm:font-medium border-b-[#0F0F0F] text-sm {$screenWidth < 640 && sortBy !== 'Stocks' ? 'hidden' : 'text-end'}">
            {item?.numberOfStocks !== null ? item?.numberOfStocks : '-'}
          </td>
  
      
        
  
          <td class="text-white sm:font-medium text-end border-b-[#0F0F0F] {$screenWidth < 640 && sortBy !== 'Turnover' ? 'hidden' : ''}">
            {item?.turnover !== null ? item?.turnover?.toFixed(2) : '-'}
          </td>

          <td class="text-white sm:font-medium border-b-[#0F0F0F] {$screenWidth < 640 && sortBy !== 'Value' && sortBy !== 'Win Rate' && sortBy !== 'Name: A-Z' ? 'hidden' : ''}">
            <div class="flex flex-row justify-end items-center">
              <div class="flex flex-col items-center">
                <div class="flex flex-row mt-1">
                  {#if item?.winRate >=0}
                  <svg class="w-5 h-5 " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                    <span class="text-[#10DB06] text-xs sm:text-sm">+{item?.winRate?.toFixed(2)} %</span>
                  {:else}
                  <svg class="w-5 h-5 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                  <span class="text-[#FF2F1F] text-xs sm:text-sm">{item?.winRate?.toFixed(2)} % </span> 
                  {/if}
                </div>
              </div>                
            </div>
          </td>
  

  
          </tr>

        {/each}
      </tbody>
    </table>
  
  
  <!--
      {#if !fullList}
      <label on:click={showFullList} class="mt-10 btn btn-sm btn-outline btn-ghost text-white text-xs m-auto normal-case ">
          Show more
      </label>
      {/if}
  -->
  
    </div>
  
  

  

  </section>
  
      
      
      
  

  <!--Start Sort By Modal-->
  <input type="checkbox" id="sortByModal" class="modal-toggle" />
      
  <dialog id="sortByModal" class="modal modal-bottom sm:modal-middle ">
  
  
    <label id="sortByModal" for="sortByModal"  class="cursor-pointer modal-backdrop bg-[#0F0F0F] bg-opacity-[0.5]"></label>
    
    
    <div class="modal-box w-full bg-[#202020] sm:border sm:border-slate-800">
  
  
  
    <label for="sortByModal" class="cursor-pointer absolute right-5 top-2 bg-[#202020] text-[1.8rem] text-white">
      ✕
    </label>
  
      <div class="text-white">
        <h3 class="font-medium text-lg sm:text-2xl mb-10">
          Sort By
        </h3>
  
  
        <div class="flex flex-col items-center w-full max-w-3xl bg-[#202020]">
  
  
          <label for="sortByModal" on:click={() => selectSortingMethod('Value')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
  
              <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {sortBy === 'Value' ? 'ring-2 ring-[#04E000]' : ''}">
                
                <span class="ml-1 text-white font-medium mr-auto">
                  Value
                </span>
  
                <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                  {#if sortBy === 'Value'}
                    <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                  {/if}
                </div>
  
              </div>
             
          </label>
  
  
          <label for="sortByModal" on:click={() => selectSortingMethod('Stocks')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
  
            <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {sortBy === 'Stocks' ? 'ring-2 ring-[#04E000]' : ''}">
              
              <span class="ml-1 text-white font-medium mr-auto">
                Number of Stocks
              </span>
  
              <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                {#if sortBy === 'Stocks'}
                <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                {/if}
              </div>
  
            </div>
           
          </label>
  
      

  
          <label for="sortByModal" on:click={() => selectSortingMethod('Turnover')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
            <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {sortBy === 'Turnover' ? 'ring-2 ring-[#04E000]' : ''}">
              <span class="ml-1 text-white font-medium mr-auto">
                Turnover
              </span>
              <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                {#if sortBy === 'Turnover'}
                  <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                {/if}
              </div>
            </div>
          </label>

          <label for="sortByModal" on:click={() => selectSortingMethod('Win Rate')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
            <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {sortBy === 'Win Rate' ? 'ring-2 ring-[#04E000]' : ''}">
              <span class="ml-1 text-white font-medium mr-auto">
                Win Rate
              </span>
              <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                {#if sortBy === 'Win Rate'}
                  <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
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
                <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
              {/if}
              </div>
  
            </div>
           
          </label>
  
  
        </div>
         
      </div>
  
  
          
        </div>
    </dialog>
  <!--End Sort By Modal-->
  
  
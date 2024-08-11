<script lang='ts'>
  import { goto } from '$app/navigation';
  import {formatString, abbreviateNumber} from '$lib/utils';
  import { screenWidth } from '$lib/store';
  import { onMount } from 'svelte';
  
  export let data;
  
  let rawData;
  let ipoList;
  let isLoaded = false;
  
  async function handleScroll() {
      const scrollThreshold = document.body.offsetHeight * 0.8; // 80% of the website height
      const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;
      if (isBottom && ipoList?.length !== rawData?.length) {
          const nextIndex = ipoList?.length;
          const filteredNewResults = rawData?.slice(nextIndex, nextIndex + 50);
          ipoList = [...ipoList, ...filteredNewResults];
      }
    }
  

  onMount( () => {
    rawData = data?.getIPOCalendar;
      ipoList= rawData?.slice(0,50);
      
      isLoaded = true;

      window.addEventListener('scroll', handleScroll);
      return () => {
          window.removeEventListener('scroll', handleScroll);
      };
  })
    
    

  
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
  
    
  <section class="w-full overflow-hidden m-auto ">
            
      
  
    {#if isLoaded}
  
  <div class="flex flex-col justify-center items-center p-3 sm:p-0">
  
    
    <div class="mt-0 sm:mt-5 mb-2 w-full sm:flex sm:flex-row sm:items-center m-auto text-gray-100 font-medium border border-gray-800 sm:rounded-lg h-auto p-5">
      <svg class="w-5 h-5 inline-block sm:mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#a474f6" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
      All {rawData?.length} IPOs on the US stock market in between 2019 - 2024.
    </div>
    
    <div class="w-full overflow-x-scroll">
      <table class="mt-5 table table-sm table-compact rounded-none sm:rounded-md w-full bg-[#09090B] border-bg-[#09090B] m-auto overflow-hidden">
        <thead>
          <tr>
            <th class="text-white font-medium text-[1rem] text-start">IPO Date</th>
            <th class="text-white font-medium text-[1rem]  text-start">Symbol</th>
            <th class="text-white font-medium text-[1rem]">Name</th>
            <th class="text-white font-medium text-end text-[1rem]">IPO Price</th>
            <th class="text-white font-medium text-end text-[1rem]">Current Price</th>
            <th class="text-white font-medium text-end text-[1rem]">Return Since</th>
          </tr>
        </thead>
        <tbody>
          {#each ipoList as item,index}
          <tr on:click={() => goto("/stocks/"+item?.symbol)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#27272A] border-b-[#09090B] shake-ticker cursor-pointer">
            
  
            <td class="text-white text-sm sm:text-[1rem] text-start border-b-[#09090B] whitespace-nowrap">
              {new Date(item?.date)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
            </td>
  
  
            <td class="whitespace-nowrap text-blue-400 text-sm sm:text-[1rem] text-start border-b-[#09090B]">
              {item?.symbol}
            </td>
  
            <td class="text-white whitespace-nowrap text-sm sm:text-[1rem] border-b-[#09090B]">
              {item?.name?.length > charNumber ? formatString(item?.name?.slice(0,charNumber)) + "..." : formatString(item?.name)}
            </td>
          
          
            <td class="text-white border-b-[#09090B] text-end text-sm sm:text-[1rem] whitespace-nowrap">
              {item?.ipoPrice !== null ? '$'+item?.ipoPrice : '-'}
            </td>
  
          <td class="text-white border-b-[#09090B] text-end text-sm sm:text-[1rem] whitespace-nowrap">
            {item?.currentPrice !== null ? '$'+item?.currentPrice : '-'}
          </td>
  
      
  
          <td class="text-white border-b-[#09090B] text-end text-sm sm:text-[1rem] whitespace-nowrap flex flex-row items-center justify-end">
            {#if item?.return >=0 && item?.return !== null}
              <span class="inline-block text-[#10DB06] text-md">{abbreviateNumber(item?.return)}%</span>
            {:else if item?.return < 0 && item?.return !== null}
              <span class="inline-block text-[#FF2F1F] text-md">{abbreviateNumber(item?.return)}% </span> 
            {:else}
              <span class="inline-block text-white text-md">
                -
              </span> 
            {/if}
          </td>
  
  
  
          </tr>
          {/each}
  

        </tbody>


      </table>
    </div>
  
 
  
  
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
  
  
  
  
  
  </section>
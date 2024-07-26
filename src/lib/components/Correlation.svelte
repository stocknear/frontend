<script lang="ts">
  import { stockTicker, etfTicker, assetType, screenWidth } from '$lib/store';
  import { goto } from '$app/navigation';
  import InfoModal from '$lib/components/InfoModal.svelte';
  import Lazy from 'svelte-lazy';

  export let correlationList;

  let showFullStats = false;
    
    
    
  async function stockSelector(symbol)
    {
      window?.scroll({ top: 0, left: 0, behavior: 'smooth' });
    
      if($assetType === 'etf')
      {
        etfTicker.update(value => symbol);
        goto(`/etf/${symbol}`)
      }
      else {
        stockTicker.update(value => symbol);
        goto(`/stocks/${symbol}`)
      }
      
    }
  
    
  $: {
      if (($assetType === 'etf' ? $etfTicker : $stockTicker) && typeof window !== 'undefined' && typeof correlationList !== 'undefined' && correlationList?.length !== 0 ) {
          showFullStats = false;
      }
  }
  
  
    

  $: charNumber = $screenWidth < 640 ? 10 : 20;
    
  
  
  </script>
    
    <section class="overflow-hidden w-full">
                                
      <main>
    
      <div class="flex flex-row items-center">
        <label for="correlationInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold">
          Most Correlated Stocks
        </label>
        <InfoModal
          title={"Most Correlated Stocks"}
          content={"Correlation between -1 and +1 shows how two stocks move together. +1 means they move in sync, while -1 means they move in opposite directions. Zero means no clear relationship."}
          id={"correlationInfo"}
        />
        </div>
      
    <Lazy height={300} fadeOption={{delay: 100, duration: 500}} keep={true}>
      {#if correlationList?.length !== 0}
       
        {#each (showFullStats ? correlationList : correlationList?.slice(0, 3)) as item, index}
       

      <div class="shadow-lg bg-[#27272A] w-full rounded-lg p-4 sm:p-3 mb-5  flex flex-row items-center {index === 0 ? 'mt-4' : ''} {index === 2 && !showFullStats && correlationList?.length > 2 ? 'opacity-[0.3]' : '' }">

        <div on:click={() => stockSelector(item?.symbol)} class="flex-shrink-0 mr-3 rounded-full w-8 h-8 sm:w-10 sm:h-10 relative bg-[#09090B]">
            <img
            class="avatar rounded-full w-5 h-5 absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2" 
            src={`https://financialmodelingprep.com/image-stock/${item?.symbol}.png`} 
            alt=" " />
        </div>

        <div class="flex flex-col -mt-3 sm:-mt-5s w-full">
          <div class="flex flex-row items-center w-full">
            <div class="mr-auto mt-2 mb-2 text-sm sm:text-md">
            <span class="text-blue-400">
                {item?.symbol}
            </span>
            <span class="text-white">
              · {item?.name?.length > charNumber ? item?.name?.slice(0,charNumber)+'...' : item?.name}
            </span>
            </div>
          <span class="text-white text-sm sm:text-md font-medium ml-auto">
              {(item?.value)?.toFixed(2)}
          </span>
          </div>
          {#if item?.value >= 0}
          <progress class="progress bg-[#3B3D3F] [&::-webkit-progress-value]:bg-[#10DB06] [&::-moz-progress-bar]:bg-[#10DB06]"  value={(item?.value)} max="1"></progress>
          {:else}
          <progress class="progress bg-[#3B3D3F] [&::-webkit-progress-value]:bg-[#C7271A] [&::-moz-progress-bar]:bg-[#C7271A]"  value={-(item?.value)} min="1"></progress>

          {/if}
        </div>


    </div>

      {/each}

      <label on:click={() => showFullStats = !showFullStats} class="{correlationList?.length < 4 ? 'hidden' : ''} cursor-pointer flex justify-center items-center mt-5">
        <svg class="w-10 h-10 transform {showFullStats ? 'rotate-180' : ''} " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#2A323C" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 13.5L7.5 11l1.42-1.41L12 12.67l3.08-3.08L16.5 11L12 15.5z"/></svg>
      </label>
  
      {:else}
      <h2 class=" mt-10 flex justify-center items-center text-3xl font-bold text-slate-700 mb-5 m-auto">
          No data available
          <svg class="w-10 sm:w-12 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#334155" d="M18.68 12.32a4.49 4.49 0 0 0-6.36.01a4.49 4.49 0 0 0 0 6.36a4.508 4.508 0 0 0 5.57.63L21 22.39L22.39 21l-3.09-3.11c1.13-1.77.87-4.09-.62-5.57m-1.41 4.95c-.98.98-2.56.97-3.54 0c-.97-.98-.97-2.56.01-3.54c.97-.97 2.55-.97 3.53 0c.97.98.97 2.56 0 3.54M10.9 20.1a6.527 6.527 0 0 1-1.48-2.32C6.27 17.25 4 15.76 4 14v3c0 2.21 3.58 4 8 4c-.4-.26-.77-.56-1.1-.9M4 9v3c0 1.68 2.07 3.12 5 3.7v-.2c0-.93.2-1.85.58-2.69C6.34 12.3 4 10.79 4 9m8-6C7.58 3 4 4.79 4 7c0 2 3 3.68 6.85 4h.05c1.2-1.26 2.86-2 4.6-2c.91 0 1.81.19 2.64.56A3.215 3.215 0 0 0 20 7c0-2.21-3.58-4-8-4Z"/></svg>
        </h2>
      {/if}
    
    </Lazy>
    
      </main>
    </section>
    
    
    
    
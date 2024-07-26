<script lang="ts">
  import { correlationComponent, stockTicker, etfTicker, assetType, screenWidth,getCache, setCache } from '$lib/store';
  import { goto } from '$app/navigation';
  import InfoModal from '$lib/components/InfoModal.svelte';
  import Lazy from 'svelte-lazy';

  export let data;

  let showFullStats = false;
  let isLoaded = false;
  let rawData = [];
    
    
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
  
  async function getCorrelation(ticker) {
    const cachedData = getCache(ticker, 'getCorrelation');
    if (cachedData) {
      rawData = cachedData;
    } else {
      try {
        const response = await fetch(data?.apiURL+'/correlation-ticker', {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": data?.apiKey
          },
          body: JSON.stringify({ ticker })
        });
        rawData = (await response.json()) || [];
+
        setCache(ticker, rawData, 'getCorrelation');
      } catch (error) {
        console.error('Failed to fetch swap data:', error);
        rawData = [];
      }
    }
    if (rawData?.lenght !== 0) {
      $correlationComponent = true;
    }
    else {
      $correlationComponent = false;
    }
  }
  

  $: {
  if (($assetType === 'stock' ? $stockTicker : $etfTicker) && typeof window !== 'undefined') {
    showFullStats = false;
    isLoaded = false;
    const ticker = $assetType === 'stock' ? $stockTicker : $etfTicker;
      getCorrelation(ticker).then(() => {
      isLoaded = true;
    });
    
  }
}
  
    
  $: charNumber = $screenWidth < 640 ? 10 : 20;
    
  
  </script>


  <svelte:options immutable={true} />
    
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
      
    {#if data?.user?.tier === 'Pro'}
      {#if isLoaded}  
        {#if rawData?.length !== 0}

    <Lazy height={300} fadeOption={{delay: 100, duration: 500}} keep={true}>

        {#each (showFullStats ? rawData : rawData?.slice(0, 3)) as item, index}
       

      <div class="shadow-lg bg-[#27272A] w-full rounded-lg p-4 sm:p-3 mb-5  flex flex-row items-center {index === 0 ? 'mt-4' : ''} {index === 2 && !showFullStats && rawData?.length > 2 ? 'opacity-[0.3]' : '' }">

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

      <label on:click={() => showFullStats = !showFullStats} class="{rawData?.length < 4 ? 'hidden' : ''} cursor-pointer flex justify-center items-center mt-5">
        <svg class="w-10 h-10 transform {showFullStats ? 'rotate-180' : ''} " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#2A323C" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 13.5L7.5 11l1.42-1.41L12 12.67l3.08-3.08L16.5 11L12 15.5z"/></svg>
      </label>
  
    
    </Lazy>

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

    {:else}
    <div class="shadow-lg shadow-bg-[#000] bg-[#111112] sm:bg-opacity-[0.5] text-sm sm:text-[1rem] rounded-md w-full p-4 min-h-24 mt-4 text-white m-auto flex justify-center items-center text-center font-semibold">
        <svg class="mr-1.5 w-5 h-5 inline-block"xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#A3A3A3" d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"/></svg>
        Unlock content with <a class="inline-block ml-2 text-blue-400 hover:sm:text-white" href="/pricing">Pro Subscription</a>
      </div>
    {/if}


    
      </main>
    </section>
    
    
    
    
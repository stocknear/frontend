
<script lang ='ts'>
    import {stockTicker} from '$lib/store';
    import InfoModal from '$lib/components/InfoModal.svelte';

    export let wiim = [];
    export let data;
    
    let showFullHistory = false;

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
    return differenceInDays <=1;
}

    
$: {

    if ($stockTicker && typeof window !== 'undefined' && typeof wiim !== 'undefined' && wiim?.length !== 0)
    {
        showFullHistory = false;   
    }        
    
}
    
        
</script>
    
    
    
    <section class="overflow-hidden text-white h-full">
        <main class="overflow-hidden ">
                        
            <div class="flex flex-row items-center">
                <label for="whyPriceMovedInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold">
                    Why Price Moved
                </label>
                <InfoModal
                  title={"Why Price Moved"}
                  content={"Why Price Moved is a one-sentence explanation of why a stock is moving higher or down. By removing noise and collecting signals from news, press releases and SEC filings, we can pinpoint the trigger for price movements."}
                  id={"whyPriceMovedInfo"}
                />
            </div>
    
            {#if wiim?.length !== 0}
            <div class="mt-7">
            {#each (showFullHistory ? wiim : wiim?.slice(0,2)) as item, index}
    
                <div class="w-full {index === 1 && !showFullHistory && wiim?.length > 2 ? 'opacity-[0.5]' : '' } ">
    
                    <div class="relative">
                        <div class="">
                            
                            <div class="flex justify-center ">
                                <!--<div class="{item?.changesPercentage >= 0 ? 'bg-[#10DB06]' : 'bg-[#FF2F1F]'} w-1.5 mb-5 rounded-l-xl" />-->
                                    
                                <!--Start Item-->
                                <div class="flex flex-row items-center w-full mb-6">
                        
                                    <div class="w-full rounded-lg {latestInfoDate(item?.date) ? 'bg-[#F9AB00] bg-opacity-[0.1]' : 'bg-[#202020]'} shadow-lg h-full pl-3 pt-2 pb-4">
                                        <div class="flex flex-col items-start"> 

                                            <div class="flex flex-row items-start w-full pt-2">
                                                <span class="text-white text-sm pl-2 italic">Updated {item?.date}</span>
                                                {#if latestInfoDate(item?.date)}
                                                    <label class="bg-[#2D4F8A] text-white font-medium text-xs rounded-lg px-2 py-0.5 ml-3">New</label>
                                                {/if}
                                                <div class="text-white text-sm ml-auto pr-4 font-medium">
                                                {#if item?.changesPercentage >=0}
                                                    <svg class="w-5 h-5 -mr-0.5 -mt-0.5 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                                                    <span class="text-[#10DB06] text-xs font-medium inline-block">+{item?.changesPercentage}%</span>
                                                {:else if item?.changesPercentage < 0 }
                                                    <svg class="w-5 h-5 -mr-0.5 -mt-0.5 rotate-180 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                                                    <span class="text-[#FF2F1F] text-xs font-medium inline-block">{item?.changesPercentage}% </span>  
                                                {/if}
                                                </div>
                                            </div>

                                            <div class="flex flex-col w-full max-w-[430px] pt-2 pl-2 pr-2 sm:pr-0">
                                                <span class="text-white text-sm ">
                                                    {data?.user?.tier !== 'Pro' && latestInfoDate(item?.date) ? item?.text?.slice(0,30) + '...' : item?.text }
                                                </span>
                                            </div>

                                            {#if data?.user?.tier !== 'Pro' && latestInfoDate(item?.date)}
                                                <a href="/pricing" class="w-full max-w-xl mt-5 text-blue-300 hover:text-white font-medium text-sm flex justify-center items-center">
                                                    Unlock with Pro Subscription
                                                <svg class="ml-1 w-5 h-5 inline-block"xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#A3A3A3" d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"/></svg>
                                                </a>
                                            {/if}
                        
                                           
                        
                        
                                        </div>
                                    </div>
                                </div>
                                <!--End Item-->
    
                            </div>
                        </div>
                    </div>
                </div>
    
                {/each}
            </div>
    
            
              
           
            {#if wiim?.length > 2}
            <label on:click={() => showFullHistory = !showFullHistory} class="cursor-pointer flex justify-center items-center mt-5">
                <svg class="w-10 h-10 transform {showFullHistory ? 'rotate-180' : ''} " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#2A323C" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 13.5L7.5 11l1.42-1.41L12 12.67l3.08-3.08L16.5 11L12 15.5z"/></svg>
            </label>
            {/if}
    
            {:else}
            <h2 class="mt-10 mb-5 flex justify-center items-center text-3xl font-bold text-slate-700 m-auto">
                No data available
                <svg class="w-10 sm:w-12 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#334155" d="M18.68 12.32a4.49 4.49 0 0 0-6.36.01a4.49 4.49 0 0 0 0 6.36a4.508 4.508 0 0 0 5.57.63L21 22.39L22.39 21l-3.09-3.11c1.13-1.77.87-4.09-.62-5.57m-1.41 4.95c-.98.98-2.56.97-3.54 0c-.97-.98-.97-2.56.01-3.54c.97-.97 2.55-.97 3.53 0c.97.98.97 2.56 0 3.54M10.9 20.1a6.527 6.527 0 0 1-1.48-2.32C6.27 17.25 4 15.76 4 14v3c0 2.21 3.58 4 8 4c-.4-.26-.77-.56-1.1-.9M4 9v3c0 1.68 2.07 3.12 5 3.7v-.2c0-.93.2-1.85.58-2.69C6.34 12.3 4 10.79 4 9m8-6C7.58 3 4 4.79 4 7c0 2 3 3.68 6.85 4h.05c1.2-1.26 2.86-2 4.6-2c.91 0 1.81.19 2.64.56A3.215 3.215 0 0 0 20 7c0-2.21-3.58-4-8-4Z"/></svg>
            </h2>
            
            {/if}
    
        </main>
    </section>
    
    
    
    
    
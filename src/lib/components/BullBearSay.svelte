<script lang='ts'>
import { stockTicker, displayCompanyName } from "$lib/store";
import InfoModal from '$lib/components/InfoModal.svelte';
export let marketMoods = {};

let rawData = marketMoods;
let mode = 'bullish';
let showFullText = false;
// Function to split text into paragraphs

function splitIntoParagraphs(text) {
    // Split the text into paragraphs based on periods followed by spaces, excluding numbers with decimals
    return text?.replace('U.S.', 'US')?.split(/(?<!\d\.\d)(?<!vs)\.\s/);
}

let paragraphs = splitIntoParagraphs(rawData?.bullSays);

function changeMode(state:string) {
    mode = state;
    if(mode === 'bullish') {
        paragraphs = splitIntoParagraphs(rawData?.bullSays);
    }
    else if (mode === 'bearish') {
        paragraphs = splitIntoParagraphs(rawData?.bearSays);
    }
}


$: {
    if($stockTicker && typeof window !== 'undefined') {
        rawData = marketMoods;
        mode = 'bullish';
        showFullText = false;
        paragraphs = splitIntoParagraphs(rawData?.bullSays);
    }
}
    
</script>


{#if Object?.keys(marketMoods)?.length !== 0}

<div class="space-y-3 overflow-hidden">  
    <!--Start Content-->
    <div class="w-auto lg:w-full p-1 flex flex-col m-auto">

      <div class="flex flex-col items-center w-full mb-6">
          <div class="flex flex-row justify-start mr-auto items-center">
            <!--<img class="h-10 inline-block mr-2" src={copilotIcon} />-->
            <div class="flex flex-row items-center">
              <label for="pricePredictionInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold">
                Market Moods
              </label>
              <InfoModal
                title={"Market Moods"}
                content={`Before investing, examine both perspectives. We offer brief analyst report summaries, highlighting both positive ("Bulls Say") and negative ("Bears Say") viewpoints on ${$displayCompanyName}`}
                id={"pricePredictionInfo"}
              />
              </div>

          </div>
      </div>


     <!--Start Header-->
     <div role="tablist" class="-mt-2 w-11/12 sm:w-56">

      <div class="flex flex-col items-center w-full">
        <div class="tabs flex flex-row justify-start items-center w-full">
            <button class="w-fit text-[0.9rem] sm:text-[1rem] mr-10 rounded-md transition font-medium hover:text-white {mode === 'bullish' ? ' text-white' : 'text-[#9A9996]'}" on:click={() => (changeMode('bullish'))} >
                Bulls Say
                <div class="{mode === 'bullish' ? 'bg-[#75D377]' : 'bg-[#0F0F0F]'} mt-1 h-[3px] rounded-full w-[4rem] rounded-full" />
            </button> 
            
            <button class="w-fit text-[0.9rem] sm:text-[1rem] sm:mr-10 rounded-md transition font-medium hover:text-white {mode === 'bearish' ? ' text-white' : 'text-[#9A9996]'}" on:click={() => (changeMode('bearish'))} >
                Bears Say
                <div class="{mode === 'bearish' ? 'bg-[#FF2F1F]' : 'bg-[#0F0F0F]'} mt-1 h-[3px] rounded-full w-[4rem] rounded-full" />
            </button> 
        </div>
      </div>

    </div>

    <!--End Header-->
    <span class="text-gray-200 text-xs sm:text-[0.85rem] italic mt-6 sm:ml-auto">
      Updated {rawData?.date}
    </span>
    <div class="flex mt-5 h-auto">
    
      <div class="{mode === 'bullish' ? 'bg-[#10DB06]' : 'bg-[#FF2F1F]'} w-3.5 rounded-l-xl" />
      <span class="text-gray-100 ml-3 text-sm ">
        {#if showFullText}
        {#each (showFullText ? paragraphs : paragraphs?.slice(0,1)) as paragraph, index}
        <p class="{index !== 0 ? 'mt-1' : ''} pr-1">{paragraph} {paragraphs?.length <= index+1 ? '' : '.'}</p>
        {/each}
        {:else}
        {paragraphs?.at(0)?.slice(0,250) + '...'}
        {/if}
      </span>
    </div>
    </div>

    <label on:click={() => showFullText = !showFullText} class="cursor-pointer m-auto flex justify-center items-center mt-5">
        <svg class="w-10 h-10 transform {showFullText ? 'rotate-180' : ''} " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#2A323C" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 13.5L7.5 11l1.42-1.41L12 12.67l3.08-3.08L16.5 11L12 15.5z"/></svg>
    </label>
</div>
{/if}
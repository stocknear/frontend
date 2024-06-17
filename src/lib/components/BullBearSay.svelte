<script lang='ts'>
import { stockTicker, displayCompanyName } from "$lib/store";
import InfoModal from '$lib/components/InfoModal.svelte';

export let data;
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

function handleMode() {
  if(mode === 'bullish') {
    mode = 'bearish'
    changeMode(mode)
  } else {
    mode = 'bullish';
    changeMode(mode)
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
              <label for="bullBearCase" class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold">
                Bull Case vs Bear Case
              </label>
              <InfoModal
                title={"Bull Case vs Bear Case"}
                content={`Before investing, examine both perspectives. We offer brief analyst report summaries, highlighting both positive ("Bulls Say") and negative ("Bears Say") viewpoints on ${$displayCompanyName}`}
                id={"bullBearCase"}
              />
              </div>

          </div>
      </div>

     <!--Start Header-->
     <div role="tablist" class="-mt-2 w-11/12 sm:w-56">

      <div class="flex flex-col items-center w-full">
        <div class="tabs flex flex-row justify-start items-center w-full">
          <label class="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" on:click={handleMode} checked={mode === 'bullish' ? false : true} class="peer sr-only" />
            <div
              class="peer flex h-8 items-center gap-4 rounded-full px-5 bg-[#313131] after:absolute after:left-1 after: after:h-6 after:w-[85px] after:rounded-full {mode === 'bullish' ? 'after:bg-green-600' : 'after:bg-red-600'} after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-focus:outline-none text-sm font-semibold text-white"
              >
              <span class="mr-2 z-10">Bull Case</span>
              <span class="z-10">Bear Case</span>
            </div>
          </label>

      
        </div>
      </div>

    </div>
    {#if data?.user?.tier === 'Pro'}

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
    {:else}
    <div class="bg-[#202020] sm:bg-opacity-[0.5] text-sm sm:text-[1rem] rounded-md w-full p-4 min-h-24 mt-4 text-white m-auto flex justify-center items-center text-center font-semibold">
      <svg class="mr-1.5 w-5 h-5 inline-block"xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#A3A3A3" d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"/></svg>
      Unlock content with <a class="inline-block ml-2 text-blue-400 hover:sm:text-white" href="/pricing">Pro Subscription</a>
    </div>
    {/if}

    </div>

    <label on:click={() => showFullText = !showFullText} class="{data?.user?.tier !== 'Pro' ? 'hidden' : ''} cursor-pointer m-auto flex justify-center items-center mt-5">
        <svg class="w-10 h-10 transform {showFullText ? 'rotate-180' : ''} " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#2A323C" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 13.5L7.5 11l1.42-1.41L12 12.67l3.08-3.08L16.5 11L12 15.5z"/></svg>
    </label>


  </div>
{/if}
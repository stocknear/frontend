<script lang='ts'>



  import {tagList, stockTicker} from '$lib/store';
  import TagSearchbar from '$lib/components/TagSearchbar.svelte';
  //import { afterNavigate } from '$app/navigation';
  //import { base } from '$app/paths'
  //import { onMount } from 'svelte';
  
  export let id;
  export let errors;
  export let placeholder = '';
  
  /*
  let previousPage : string = base ;
  
  
  
  afterNavigate(({from}) => {
     previousPage = from?.url.pathname || previousPage
  
     if (!previousPage.startsWith('/stocks/'))
      {
          $stockTicker = ''; //reset stock ticker
      }
      
  
  }) 
  */
  
  
  $stockTicker = '';
  let selectedTags = [];
    
    function toggleTag(tag) {
      
      if (selectedTags.includes(tag)) {
        selectedTags = selectedTags.filter((t) => t !== tag);
      } else if (selectedTags.length < 3) {
        selectedTags = [...selectedTags, tag];
      }
  
      if (!selectedTags.includes($stockTicker))
      {
        $stockTicker = '';
        selectedTags = [...selectedTags];
      }
  
    }
  
  
  $: {
    if($stockTicker )
    {
      toggleTag($stockTicker)
    }
  }
  
  $: {
    if (selectedTags)
    {
      errors = '';
    }
  }
  
    </script>
    
  
    {#if selectedTags?.length === 0}
    <span class="w-full max-w-2xl pt-3 text-sm text-gray-400">{placeholder}</span>
    {:else}
    <span class="w-full max-w-2xl pt-3 text-sm text-gray-400">Tags selected: {selectedTags}</span>
    {/if}
    <div class="form-control flex flex-col flex flex-wrap rounded-lg pt-3 items-center bg-[#242527] w-full max-w-2xl">
      <div class="flex flex-wrap m-auto p-3 "> 
  
  
      <!--Start Add stock tag-->
      <div class="-mr-1.5">
        {#if $stockTicker?.length ===0}
          {#if selectedTags.length === 3 && !selectedTags.includes($stockTicker) }
          <label class="mr-2 border border-slate-500 flex flex-wrap pl-4 pr-4 py-2 m-1 justify-between items-center text-sm font-medium rounded-xl cursor-not-allowed opacity-50 text-gray-200 hover:text-gray-100">
          <span class="sr-only">Search</span>
              <svg class="w-4 h-4 mr-2" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                  <path class="fill-current text-white" d="M7 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zM7 2C4.243 2 2 4.243 2 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5z" />
                  <path class="fill-current text-white" d="M15.707 14.293L13.314 11.9a8.019 8.019 0 01-1.414 1.414l2.393 2.393a.997.997 0 001.414 0 .999.999 0 000-1.414z" />
              </svg>
              <span class="text-gray-300">Search a ticker...</span>
          </label>
          {:else}
          <TagSearchbar />
          {/if}
        {:else}
        <label on:click={() => toggleTag($stockTicker)} class="cursor-pointer mr-2 border border-slate-500 flex flex-wrap pl-4 pr-4 py-2 m-1 mb-2 justify-between items-center text-sm font-medium rounded-xl text-gray-200 hover:text-gray-100">
          {$stockTicker}
          {#if selectedTags?.includes($stockTicker)}
          <svg xmlns="http://www.w3.org/2000/svg" class="inline-block h-5 w-5 ml-1 hover:text-gray-300" viewBox="0 0 20 20"
          fill="currentColor">
          <path fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd" />
        </svg>
          {/if}
        </label>
        {/if}
      </div> 
      <!--End add stock tag-->
      {#each $tagList as tag}
        <label on:click={() => toggleTag(tag.name)}
               class="flex flex-wrap pl-4 pr-4 py-2 m-1 mb-2 justify-between items-center text-sm font-medium rounded-xl {selectedTags.length === 3 && !selectedTags.includes(tag.name) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} text-gray-200 hover:text-gray-100"
               style={`background-color: ${tag.color};`} >
          {tag.name}
          {#if selectedTags?.includes(tag.name)}
          <svg xmlns="http://www.w3.org/2000/svg" class="inline-block h-5 w-5 ml-1 hover:text-gray-300" viewBox="0 0 20 20"
          fill="currentColor">
          <path fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd" />
        </svg>
          {/if}
        </label>
        {/each}
  
        <input class="hidden" value={JSON.stringify([selectedTags.filter((t) => t !== $stockTicker) ])} id="tagTopic" name="tagTopic" />
        <input class="hidden" value={$stockTicker} id ="tagline" name="tagline" />
        <input class="hidden" value={selectedTags+$stockTicker} id='atLeastOneTag' name = "atLeastOneTag" />
    
      </div>
  
      
  </div>
  
  <div class="w-full max-w-2xl ">
  {#if errors?.length}
        <label for={id} class="label py-0 pt-1">
          <span class="label-text-alt text-error">
            {errors}
          </span>
        </label>
  {/if}
  </div>
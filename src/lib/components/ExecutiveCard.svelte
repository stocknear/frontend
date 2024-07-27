<script lang="ts">
  import {userRegion, executiveClicked, stockTicker, clientSideCache, } from '$lib/store';
	import { afterUpdate } from 'svelte';

  
  //export let executiveList;
  let executiveList = [];


const usRegion = ['cle1','iad1','pdx1','sfo1'];

let apiURL;
let apiKey = import.meta.env.VITE_STOCKNEAR_API_KEY;


userRegion?.subscribe(value => {
if (usRegion?.includes(value)) {
  apiURL = import.meta.env.VITE_USEAST_API_URL;
} else {
  apiURL = import.meta.env.VITE_EU_API_URL;
}
});


  let isLoaded = false;
  const currentYear = new Date().getFullYear();

  let numberOfFemales = 0;
  let numberOfMales = 0;
  
  
async function fetchData() {

  if($clientSideCache[$stockTicker]?.getExecutives)
  {
    executiveList = $clientSideCache[$stockTicker]?.getExecutives;
  }
  else {
    const postData = { ticker: $stockTicker};
    const response = await fetch(apiURL+'/get-executives', {
    method: 'POST',
    headers: {
        "Content-Type": "application/json", "X-API-KEY": apiKey
    },
    body: JSON.stringify(postData)
    });
  
    executiveList =  await response.json();
    $clientSideCache[$stockTicker].getExecutives = executiveList;
  }
  
};



afterUpdate(async() => {
  if($stockTicker && typeof window !== 'undefined' && $executiveClicked === true) {
    $executiveClicked = false;
    await fetchData()
    for (const executive of executiveList) {
      switch (executive?.gender) {
        case 'female':
          numberOfFemales++;
          break;
        case 'male':
          numberOfMales++;
          break;
        // Handle other gender cases if needed
        }
    }

      isLoaded = true;
    }
})


</script>


<div class="space-y-3 sm:pt-5">  
  <div class="bg-[#000] h-auto w-screen">
    <!--Start Header-->
    <div class="bg-[#27272A] w-full  p-1 flex flex-col items-center pb-5 h-auto rounded-b-[30px]">
      <h2 class="text-center m-auto text-[1.1rem] font-medium text-white mt-5">
        Executives
      </h2>

      <div class="{!isLoaded ? 'hidden' : ''} flex flex-col items-center mt-10 w-full">
        <span class="text-white text-md text-opacity-[0.55]">
          Female/Total Ratio
        </span>

        <div class="flex flex-row justify-center items-center w-full mt-5">


          <div class="flex flex-row items-center ml-5">
            <div class="h-full bg-gray-800 transform -translate-x-1/2 " aria-hidden="true"></div>
            <div class="w-3 h-3 bg-[#0FC008] border-4 box-content border-gray-900 rounded-full transform -translate-x-1/2" aria-hidden="true"></div>
            <span class="text-white text-sm font-medium inline-block">
                Female <span class="font-medium text-[0.95rem]">({numberOfFemales})</span>
            </span>
          </div>


          <span class="text-white font-medium text-3xl m-auto">
            {numberOfFemales === 0 ? 0 : (numberOfFemales/(numberOfFemales+numberOfMales) *100)?.toFixed(2)}%
          </span>

          <div class="flex flex-row items-center mr-5">
            <div class="h-full bg-gray-800 transform -translate-x-1/2 " aria-hidden="true"></div>
            <div class="w-3 h-3 bg-[#FF2F1F] border-4 box-content border-gray-900 rounded-full transform -translate-x-1/2" aria-hidden="true"></div>
            <span class="text-white text-sm font-medium inline-block">
              Male <span class="font-medium text-[0.95rem]">({numberOfMales})</span>
            </span>
          </div>
          
          
        </div>
      </div>
    </div>
    <!--End Header-->
    {#if isLoaded}

    {#if executiveList?.length !== 0}
      <div class="mt-5 w-full">
          {#each executiveList as item}

          <!--Start Item-->
          <div class="flex flex-row items-center pl-4 pr-4 w-full mb-3">
                
            <div class="w-full rounded-md bg-[#27272A] shadow-lg h-auto pb-3 pl-3 pt-3">
                <div class="flex flex-row items-center relative">  
                    <div class="flex flex-col">
                      <div class="flex flex-row items-center mr-auto mb-2 text-white font-medium text-[1rem] w-56">
                        <span>
                          {item?.name}
                        {#if item?.yearBorn !== null}
                        , {(currentYear-item.yearBorn)}
                        {/if}
                      </span>

                      </div>
                        <span class="text-white text-opacity-[0.6] text-sm w-48">
                        {item?.title}
                        </span>
                    </div>

                    {#if item?.gender === 'male'}
                    <div class="flex flex-row items-center ml-auto absolute right-3 top-0">
                      <div class="h-full bg-[#27272A] transform -translate-x-1/2" aria-hidden="true"></div>
                      <div class="w-2 h-2 bg-[#FF2F1F] border-4 box-content border-gray-900 rounded-full transform -translate-x-1/2" aria-hidden="true"></div>
                      <span class="text-white text-[0.85rem] inline-block">
                        Male
                      </span>
                    </div>
                    {:else if item?.gender === 'female'}
                    <div class="flex flex-row items-center ml-auto absolute right-3 top-0">
                      <div class="h-full bg-[#27272A] transform -translate-x-1/2 " aria-hidden="true"></div>
                      <div class="w-2 h-2 bg-[#0FC008] border-4 box-content border-gray-900 rounded-full transform -translate-x-1/2" aria-hidden="true"></div>
                      <span class="text-white text-[0.85rem] inline-block">
                        Female
                      </span>
                    </div>
                    {/if}

                </div>

            </div>
          </div>
        <!--End Item-->
          {/each}
      </div>
      {:else}
      <div class=" mt-20 flex justify-center items-center text-2xl font-bold text-slate-700 mb-20 m-auto">
          No data available
        </div>

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
  <!--End Similar Stocks Card -->    
  
  
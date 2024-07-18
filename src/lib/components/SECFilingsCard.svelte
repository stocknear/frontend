<script lang="ts">
import {userRegion, secFilingsClicked, stockTicker, clientSideCache, } from '$lib/store';
import { Motion, AnimateSharedLayout } from "svelte-motion";

import { fade } from 'svelte/transition';
  
  let secFilingsList;

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


let displayList = [];
let secType = '8K';
let accordionOpen = {};
let newData;
let isLoaded = false;

function changeSECType(index) {
    activeIdx = index;
    switch (activeIdx) {
        case 0:
            secType = '8K';
            prepareData(secFilingsList?.eightK);
            break;
        case 1:
            secType = '10K';
            prepareData(secFilingsList?.tenK);
            break;
        case 2:
            secType = '10Q';
            prepareData(secFilingsList?.tenQ);
            break;
        // Default case in case changeType doesn't match any of the specified cases
        default:
            // Handle the default case or leave it empty if not needed
            break;
    }
}

function prepareData(dataset) {
  if (dataset?.length !== 0)
  {
    newData = {};
    accordionOpen = {};

    dataset?.forEach(item => {
      // Extract year from the date
      const year = new Date(item?.date)?.getFullYear()?.toString();

      // Check if the year already exists in newData
      if (!newData[year]) {
        // If not, initialize a new entry for the year
        newData[year] = {
          'year': year,
          'totalReports': 0,
          'data': []
        };
      }
      // Increment the totalReports count
      newData[year].totalReports++;

      // Add the current item to the 'data' array
      newData[year].data?.push(item);
    });

    // Convert newData object to an array of values
    displayList = Object?.values(newData);
    displayList = displayList?.sort((a,b) => b?.year - a?.year);
    // Output the displayList
    displayList = [...displayList];
    //console.log(displayList)
  }
  else {
    displayList = [];
  }

}


async function handleAccordion(year) {
  accordionOpen[year] = !accordionOpen[year];
}


async function fetchData() {

  if($clientSideCache[$stockTicker]?.getSECFilings)
  {
    secFilingsList = $clientSideCache[$stockTicker]?.getSECFilings;
  }
  else {
    const postData = { ticker: $stockTicker};
    const response = await fetch(apiURL+'/get-sec-filings', {
    method: 'POST',
    headers: {
        "Content-Type": "application/json", "X-API-KEY": apiKey
    },
    body: JSON.stringify(postData)
    });

    secFilingsList =  await response.json();
    $clientSideCache[$stockTicker].getSECFilings = secFilingsList;
  }

};


const tabs = [
    {
      title: "8-K",
    },
    {
      title: "10-K",
    },
    {
      title: "10-Q"
    }
  ];
let activeIdx = 0;


$: {

  if($stockTicker && typeof window !== 'undefined' && $secFilingsClicked === true) {
    isLoaded = false;
    $secFilingsClicked = false;
    activeIdx = 0;
    secType = '8K';
    accordionOpen = {}

    const asyncFunctions = [
      fetchData()
      ];
      Promise.all(asyncFunctions)
          .then((results) => {
            prepareData(secFilingsList?.eightK);
          })
          .catch((error) => {
            console.error('An error occurred:', error);
          });

    isLoaded = true;
    
    }

}

</script>


<div class="space-y-3 sm:pt-5">  
  
  <div class="bg-[#000] h-auto w-screen">
  
    <!--Start Header-->
    <div class="bg-[#000] w-full p-1 flex flex-col items-center pb-5 h-auto">
      <h2 class="text-center m-auto text-[1.1rem] font-medium text-white mt-5">
        SEC Filings
      </h2>


      <div class="w-11/12 mt-5">
        <div class="relative right-0 bg-[#141417] rounded-lg">

          <div class="relative flex flex-row items-center p-1 list-none rounded-lg">
            <AnimateSharedLayout>
              {#each tabs as item, i}
                <button
                  on:click={() => changeSECType(i)}
                  class="group relative z-[1] rounded-lg px-6 py-1 border z-30 flex items-center justify-center w-full px-0 py-1 mb-0 border-0 bg-inherit {activeIdx === i
                    ? 'z-0'
                    : ''} "
                  >
                  {#if activeIdx === i}
                    <Motion
                      layoutId="clicked-btn"
                      transition={{ duration: 0.2 }}
                      let:motion
                    >
                      <div
                        use:motion
                        class="absolute inset-0 rounded-lg sm:rounded-lg {[0,1,2]?.includes(activeIdx) ? 'bg-[#00C806]' : 'bg-[#E02424]'}"
                      ></div>
                    </Motion>
                  {/if}
                  
                  {#if item?.title === '8-K'}
                  <span
                    class="relative block font-medium duration-200 {secType === '8K' ? 'text-black' : 'text-white'}">
                    {item.title}
                  </span>
                  {:else if item?.title === '10-K'}
                  <span
                    class="relative block font-medium duration-200 {secType === '10K' ? 'text-black' : 'text-white'}">
                    {item.title}
                  </span>
                  {:else}
                  <span
                    class="relative block font-medium duration-200 {secType === '10Q' ? 'text-black' : 'text-white'}">
                    {item.title}
                  </span>
                  {/if}

                </button>
              {/each}
            </AnimateSharedLayout>
          </div>

        </div>
      </div>
    </div>
    <!--End Header-->
    {#if isLoaded}
      {#if displayList?.length !== 0}
      <div class="mt-5 w-full">

        {#each displayList as item}
          <div class="flex flex-col justify-center m-auto items-start rounded-md bg-[#141417] shadow-lg h-auto w-11/12 mb-3" transition:fade={{ delay: 0, duration: 80 }} in={accordionOpen[item?.year]}>
            
          
            <div class="flex flex-row items-center w-full p-3">

                <div class="flex-shrink-0 mr-2 rounded-full w-12 h-12 relative bg-[#000]">
                    <svg class="rounded-full w-7 h-7 absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="m18 22l3-3l-.7-.7l-1.8 1.8V16h-1v4.1l-1.8-1.8l-.7.7zm-6-11.15l5.925-3.425L12 4L6.075 7.425zm-9 6.275V6.875L12 1.7l9 5.175V12h-2V9.1l-7.025 4.05L5 9.1v6.85l6.025 3.475v2.3zM18 24q-2.075 0-3.537-1.463T13 19q0-2.075 1.463-3.537T18 14q2.075 0 3.538 1.463T23 19q0 2.075-1.463 3.538T18 24m-6.975-12.275"/></svg>
                </div>

                <div on:click={() => handleAccordion(item?.year)} class="flex flex-row items-center w-full">
                    <div class="flex flex-col items-start w-full ">
                        <span class="text-white text-sm sm:text-md font-medium text-start mt-2">
                            {item?.year}
                        </span>
                        <span class="text-white text-opacity-[0.6] text-xs text-start mb-2">
                            Total Reports: {item?.totalReports}
                        </span>
                    </div>
                    <svg class="h-6 w-6 inline-block transform transition-transform mr-5 {accordionOpen[item?.year] ? '' : 'rotate-180'}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="#fff" d="m488.832 344.32l-339.84 356.672a32 32 0 0 0 0 44.16l.384.384a29.44 29.44 0 0 0 42.688 0l320-335.872l319.872 335.872a29.44 29.44 0 0 0 42.688 0l.384-.384a32 32 0 0 0 0-44.16L535.168 344.32a32 32 0 0 0-46.336 0z"/></svg>

                </div>

            </div>
            {#if accordionOpen[item?.year]}
            {#each item?.data as entry}
              <div class="shadow-lg bg-[#000] bg-opacity-[0.5] w-11/12 rounded-md p-4 mb-3 m-auto flex flex-row justify-center items-center">

                <div class="flex flex-col -mt-2 w-full">
                    <div class="flex flex-row items-center w-full">
                        <span class="text-white text-sm sm:text-md font-medium text-start mb-2 mr-auto mt-2">
                          {new Date(entry?.date)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                        </span>
                    <span class="text-white text-sm sm:text-md font-medium ml-auto">
                      <a href={entry?.link} rel="noopener noreferrer" target="_blank" >
                        Check Report
                      </a>
                    </span>
                    </div>

                  </div>

              </div>
            {/each}


            {/if}
            </div>
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
  
  
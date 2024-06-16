<script lang='ts'>
  import republicanBackground from "$lib/images/bg-republican.png";
  import democraticBackground from "$lib/images/bg-democratic.png";
  import otherBackground from "$lib/images/bg-other.png";

  import { screenWidth, numberOfUnreadNotification } from '$lib/store';
  import { abbreviateNumber } from '$lib/utils';
  import { onMount } from 'svelte';
  import { compareTwoStrings } from 'string-similarity';
    //  import * as XLSX from 'xlsx';

  export let data;
  
  let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;


  let rawData = data?.getAllPolitician;
  let slicedRawData = [];
  let displayList = [];
  let images = {};
  let filterQuery = '';

  let isLoaded = false;
  
  let filterList = [];
  
  let changeRuleFilter = false;
  
    
  async function handleScroll() {
    const scrollThreshold = document.body.offsetHeight * 0.8; // 80% of the website height
    const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;
    if (isBottom && displayList?.length !== rawData?.length) {
        const nextIndex = displayList?.length;
        const filteredNewResults = rawData?.slice(nextIndex, nextIndex + 20);
        displayList = [...displayList, ...filteredNewResults];
    }
  }
  

    
  
onMount(async () => {
    displayList = rawData?.slice(0,20) ?? [];
    isLoaded = true;
  
    window.addEventListener('scroll', handleScroll);
      //window.addEventListener('keydown', handleKeyDown);
    
      return () => {
        // Cleanup the event listeners when the component is unmounted
        window.removeEventListener('scroll', handleScroll);
        //window.removeEventListener('keydown', handleKeyDown);
      };
  
  });
  
  
 
 
  async function handleFilter(e, newFilter) {
    //e.preventDefault();
  
    changeRuleFilter = true;
    const filterSet = new Set(filterList);
  
    // Check if the new filter already exists in the list
    if (filterSet?.has(newFilter)) {
      // If it exists, remove it from the list
      filterSet?.delete(newFilter);
    } else {
      // If it doesn't exist, add it to the list
      filterSet?.add(newFilter);
  
    }
    filterList = Array?.from(filterSet);
    //console.log(filterList)
    changeRuleFilter = true;
  
  }
  
  
  function filterData(data) {
    const newData = data?.filter(item => {
  
      //Democratic Party nested conditions
      if (filterList?.includes("Democratic") && item?.party && item?.party?.toLowerCase() === "democratic") {
        
        return true;
      }
      //Republican Party nested conditions
      if (filterList?.includes("Republican") && item?.party && item?.party?.toLowerCase() === "republican") {
        return true;
      }
  
      //Other Party nested conditions
      if (filterList?.includes("Other") && item?.party && item?.party?.toLowerCase() === "other") {
        return true;
      }
  
      else {
        return false;
      }
      
    });
  
    return newData
  }
  
  
  
  
  function handleInput(event) {
    filterQuery = event.target.value?.toLowerCase();
    let newData = [];

    setTimeout(() => {
        if (filterQuery?.length !== 0) {
            newData = rawData?.filter(item => {
                const representative = item?.representative?.toLowerCase();
                // Check if representative includes filterQuery
                if (representative?.includes(filterQuery)) return true;
                
                // Implement fuzzy search by checking similarity
                // You can adjust the threshold as needed
                const similarityThreshold = 0.5;
                const similarity = compareTwoStrings(representative, filterQuery);
                return similarity > similarityThreshold;
            });

            if (newData?.length !== 0) {
                rawData = newData;
                displayList = [...newData];
            } else {
                // Reset to original data if no matches found
                rawData = data?.getAllPolitician;
                displayList = rawData?.slice(0, 20);
            }
        } else {
            // Reset to original data if filter is empty
            rawData = data?.getAllPolitician;
            displayList = rawData?.slice(0, 20);
        }
    }, 500);
}

  
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
    
  
  
  
  $: {
    if(filterList && changeRuleFilter === true)
    {
      displayList = filterList?.length !== 0 ? filterData(rawData) : rawData;
      displayList = [...displayList];
      changeRuleFilter = false;
      //console.log(slicedRawData?.length)
    }
  }

  
  </script>
  
  <!-- HEADER FOR BETTER SEO -->
  <svelte:head>
      <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} US Politician Stock Trade Tracker · stocknear</title>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width" />
  
      <meta name="description" content="What are US Politicians trading? Filter by Senate or House, Party, Committee, State and more - get detailed infomation about it.">
      <!-- Other meta tags -->
      <meta property="og:title" content="US Politician Stock Trade Tracker · stocknear"/>
      <meta property="og:description" content="What are US Politicians trading? Filter by Senate or House, Party, Committee, State and more - get detailed infomation about it.">
      <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
      <meta property="og:type" content="website"/>
      <!-- Add more Open Graph meta tags as needed -->
  
      <!-- Twitter specific meta tags -->
      <meta name="twitter:card" content="summary_large_image"/>
      <meta name="twitter:title" content="US Politician Stock Trade Tracker · stocknear"/>
      <meta name="twitter:description" content="What are US Politicians trading? Filter by Senate or House, Party, Committee, State and more - get detailed infomation about it.">
      <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
      <!-- Add more Twitter meta tags as needed -->
  </svelte:head>
  
  
  
  
  <section class="w-full max-w-6xl overflow-hidden m-auto min-h-screen pt-5 pb-60">
      
      <div class="text-sm breadcrumbs ml-4">
        <ul>
          <li><a href="/" class="text-gray-300">Home</a></li> 
          <li class="text-gray-300">Politicians</li>
        </ul>
      </div>
    
    
    <body class="w-full max-w-6xl overflow-hidden m-auto">
              
        
    {#if isLoaded}
  
              
      <section class="w-full max-w-6xl overflow-hidden m-auto sm:mt-10 px-0 sm:px-3 mt-10">
        
        <div class="p-3 sm:p-0 flex justify-center w-full m-auto overflow-hidden">
            <div class="relative flex justify-center items-center overflow-hidden w-full">
                <main class="w-full">
  
  
                <div class="w-full pb-3">
                  <div class="relative right-0 bg-[#0F0F0F]">
                    <ul class="relative grid grid-cols-1 sm:grid-cols-4 gap-y-3 gap-x-3 flex flex-wrap p-1 list-none rounded-[3px]">
                      <li class="pl-3 py-1.5 flex-auto text-center bg-[#2E3238] rounded-[3px]">
                        <label class="flex flex-row items-center">
                          <input 
                          id="modal-search"
                          type="search" 
                          class="text-white ml-2 text-[1rem] placeholder-gray-400 border-transparent focus:border-transparent focus:ring-0 flex items-center justify-center w-full px-0 py-1 bg-inherit"
                          placeholder="Find by name"
                          bind:value={filterQuery}
                          on:input={handleInput}
                          autocomplete="off"
                          />
                          <svg class="ml-auto mr-5 h-8 w-8 inline-block mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="m19.485 20.154l-6.262-6.262q-.75.639-1.725.989t-1.96.35q-2.402 0-4.066-1.663T3.808 9.503T5.47 5.436t4.064-1.667t4.068 1.664T15.268 9.5q0 1.042-.369 2.017t-.97 1.668l6.262 6.261zM9.539 14.23q1.99 0 3.36-1.37t1.37-3.361t-1.37-3.36t-3.36-1.37t-3.361 1.37t-1.37 3.36t1.37 3.36t3.36 1.37"/></svg>
                        </label>
                        </li>
                      
                      <li class="pl-3 py-1.5 flex-auto text-center bg-[#2E3238] rounded-[3px]">
                        <label for="filterList" class="flex flex-row items-center">
                          <span class="text-[0.75rem] sm:text-[1rem] text-gray-400 ml-2 text-start w-full px-0 py-1 bg-inherit">
                            Filter
                          </span>
                          <svg class="ml-auto mr-5 h-5 w-5 inline-block transform transition-transform mr-2 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="#fff" d="m488.832 344.32l-339.84 356.672a32 32 0 0 0 0 44.16l.384.384a29.44 29.44 0 0 0 42.688 0l320-335.872l319.872 335.872a29.44 29.44 0 0 0 42.688 0l.384-.384a32 32 0 0 0 0-44.16L535.168 344.32a32 32 0 0 0-46.336 0z"/></svg>
                        </label>
                      </li>
                      

                    </ul>
                  </div>
                </div>
  
    
                <div class="w-full m-auto mt-4">
                      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
                            {#each displayList as item}
                              <a href={`/politicians/${item?.id}`} class="w-full cursor-pointer bg-[#202020] sm:hover:bg-[#000] transition-colors ease-in-out border sm:hover:border-[#000] {item?.party ==='Republican' ? 'sm:hover:shadow-[#80000D]' : item?.party === 'Democratic' ? 'sm:hover:shadow-[#1358C3]' : 'sm:hover:shadow-[#636465]'} border-slate-800 shadow-md rounded-lg h-auto pb-4 pt-4 mb-7">
                                <div class="flex flex-col relative">
                                  {#if item?.party === 'Republican'}
                                  <img class="absolute -mt-4 w-full m-auto rounded-lg" src={republicanBackground} />
                                  {:else if item?.party === 'Democratic'}
                                    <img class="absolute -mt-4 w-[500px] m-auto rounded-lg"  src={democraticBackground} />
                                  {:else}
                                    <img class="absolute -mt-4 w-[500px] m-auto rounded-lg" src={otherBackground} />
                                  {/if}
                                  <div class="flex flex-col justify-center items-center rounded-2xl ">


                                    <div class="-mt-3 shadow-lg rounded-full border border-slate-600 w-20 h-20 relative {item?.party === 'Republican' ? 'republican-striped bg-[#98272B]' : item?.party === 'Democratic' ? 'democratic-striped bg-[#295AC7]' : 'other-striped bg-[#20202E]'} flex items-center justify-center">
                                      <img style="clip-path: circle(50%);" class="rounded-full w-16" src={item?.image} loading="lazy"/>
                                    </div>
                                    <span class="text-white text-lg font-medium mt-2 mb-2">
                                      {item?.representative}
                                    </span>
                                    <span class="text-white text-md mb-8">
                                      {item?.party ?? 'n/a'} {#if item?.district !== undefined && item?.district?.length !== 0} / {item?.district} {/if}
                                    </span>
  
                                  </div>
  
                                  <div class="flex flex-row justify-between items-center w-full px-10 pb-4">
                                    <label class="cursor-pointer flex flex-col items-center">
                                      <span class="text-white text-[1rem] font-semibold">{abbreviateNumber(item?.totalTrades)}</span>
                                      <span class="text-slate-300 font-medium text-sm">Total Trades</span>
                                    </label>
                
                                    <div class="flex flex-col items-center ">
                                      <span class="text-white text-[1rem] font-semibold">
                                        {item?.lastTrade?.length !== undefined ? new Date(item?.lastTrade)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' }) : 'n/a'}
                                      </span>
                                      <span class="text-slate-300 font-medium text-sm">Last Traded</span>
                                    </div>
                                  </div>
                           
            
              
                                </a>
                            {/each}
  
                            <!--<InfiniteLoading on:infinite={infiniteHandler} />-->
                      </div>
  
                     

  
                  </div>
                
                </main>
            </div>
        </div>
      </section>
      {:else}
      <div class="flex justify-center items-center m-auto relative w-[100px]">
        <div class="loader">Loading...</div>
      </div>
  
      {/if}
          
  </body>
          
          
      
  </section>
  
  
  

  
  {#if $screenWidth >= 640}
  <!--Start View All List-->
  <input type="checkbox" id="filterList" class="modal-toggle" />
      
  <dialog id="filterList" class="modal modal-bottom sm:modal-middle">
  
  
    <label id="filterList" for="filterList" class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
    
    
    <div class="modal-box w-full bg-[#202020] sm:border sm:border-slate-800 max-h-[600px] overflow-y-scroll">
  
  
    <label for="filterList" class="cursor-pointer absolute right-5 top-2 bg-[#202020] text-[1.8rem] text-white">
      ✕
    </label>
  
      <div class="text-white mt-5 pb-5">
  
        <div class="flex flex-col items-center justify-start">
          <!--Start Political Party-->
          <div class="grid grid-cols-2 mt-4 w-full ml-auto mt-4">
            <div class="mb-4 mr-auto">
              <h2 class="text-xl sm:text-2xl text-white font-bold mb-3">Political Party</h2>
              <ul class="space-y-1 ">
                <li class="mb-2 cursor-pointer">
                  <label on:click|stopPropagation={(event) => handleFilter(event,'Democratic')} class="cursor-pointer flex w-full items-center space-x-2 py-2 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                    <input checked={filterList?.includes('Democratic')} type="checkbox" class="cursor-pointer bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                    <label class="text-white text-md cursor-pointer">Democratic</label>
                  </label>
                </li>
                  <li class="mb-2 cursor-pointer">
                    <label on:click|stopPropagation={(event) => handleFilter(event,'Republican')} class="cursor-pointer flex w-full items-center space-x-2 py-2 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                      <input checked={filterList?.includes('Republican')} type="checkbox" class="cursor-pointer bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                      <label class="text-white text-md cursor-pointer">Republican</label>
                    </label>
                  </li>
              </ul>
            </div>
              <!-- Column 2 -->
              <div class="mt-11">
                <ul class="space-y-1 ">
                  <li class="mb-2 cursor-pointer">
                    <label on:click|stopPropagation={(event) => handleFilter(event,'Other')} class="cursor-pointer flex w-full items-center space-x-2 py-2 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                      <input checked={filterList?.includes('Other')} type="checkbox" class="cursor-pointer bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                      <label class="text-white text-md cursor-pointer">Other</label>
                    </label>
                  </li>
                  <!-- ...other list items -->
                </ul>
              </div>
          </div>
          <!--End Political Party-->
      
          <!--Start Transaction Type-->
          <div class="grid grid-cols-2 w-full ml-auto mt-4">
            <div class="mb-4 mr-auto">
              <h2 class="text-xl sm:text-2xl text-white font-bold mb-3">Transaction Type</h2>
              <ul class="space-y-1">
                <li class="mb-2 cursor-pointer">
                  <label on:click|stopPropagation={(event) => handleFilter(event,'Bought')} class="cursor-pointer flex w-full items-center space-x-2 py-2 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                    <input checked={filterList?.includes('Bought')} type="checkbox" class="cursor-pointer bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                    <label class="text-white text-md cursor-pointer">Bought</label>
                  </label>
                </li>
              </ul>
            </div>
              <!-- Column 2 -->
              <div class="mt-11">
                <ul class="space-y-1">
                  <li class="mb-2 cursor-pointer">
                    <label on:click|stopPropagation={(event) => handleFilter(event,'Sold')} class="cursor-pointer flex w-full items-center space-x-2 py-2 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                      <input checked={filterList?.includes('Sold')} type="checkbox" class="cursor-pointer bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                      <label class="text-white text-md cursor-pointer">Sold</label>
                    </label>
                  </li>
                  <!-- ...other list items -->
                </ul>
              </div>
          </div>
      
          <!--End Transaction Type-->
      
    
      
      
          </div>
         
      </div>
  
  
          
        </div>
    </dialog>
  <!--End View All List-->
  {:else}
  <div class="drawer drawer-end z-40 overflow-hidden w-screen">
    <input id="filterList" type="checkbox" class="drawer-toggle"/>
    <div class="drawer-side overflow-y-scroll overflow-hidden">
    
        
      <div class="bg-[#000] min-h-screen w-screen pb-20 overflow-y-scroll overflow-hidden">
  
          <label for="filterList" class="absolute left-6 top-6">
            <svg class="w-6 h-6 inline-block mb-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M9.125 21.1L.7 12.7q-.15-.15-.213-.325T.425 12q0-.2.063-.375T.7 11.3l8.425-8.425q.35-.35.875-.35t.9.375q.375.375.375.875t-.375.875L3.55 12l7.35 7.35q.35.35.35.863t-.375.887q-.375.375-.875.375t-.875-.375Z"/></svg>
          </label>
  
    
  <div class="w-screen overflow-y-scroll" >
  
  
  <div class="space-y-3 sm:pt-5">  
    
    <div class="bg-[#000] h-auto w-screen">
    
      <!--Start Header-->
      <div class="bg-[#000] w-full p-1 flex flex-col items-center pb-10 h-auto">
        <h2 class="text-center m-auto text-[1.1rem] font-medium text-white mt-5">
          Filter List
        </h2>
  
        </div>
      <!--End Header-->
  
      <div class="flex flex-col items-center justify-center">
      <!--Start Political Party-->
      <div class="grid grid-cols-2 mt-4 w-11/12 ml-auto mt-4">
        <div class="mb-4 mr-auto">
          <h2 class="text-xl sm:text-2xl text-white font-bold mb-3">Political Party</h2>
          <ul class="space-y-1 ">
            <li class="mb-2 cursor-pointer">
              <label on:click|stopPropagation={(event) => handleFilter(event,'Democratic')} class="flex w-full items-center space-x-2 py-2 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                <input checked={filterList?.includes('Democratic')} type="checkbox" class="bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                <label class="text-white text-md">Democratic</label>
              </label>
            </li>
              <li class="mb-2 cursor-pointer">
                <label on:click|stopPropagation={(event) => handleFilter(event,'Republican')} class="flex w-full items-center space-x-2 py-2 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                  <input checked={filterList?.includes('Republican')} type="checkbox" class="bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                  <label class="text-white text-md">Republican</label>
                </label>
              </li>
          </ul>
        </div>
          <!-- Column 2 -->
          <div class="mt-10">
            <ul class="space-y-1 ">
              <li class="mb-2 cursor-pointer">
                <label on:click|stopPropagation={(event) => handleFilter(event,'Other')} class="flex w-full items-center space-x-2 py-2 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                  <input checked={filterList?.includes('Other')} type="checkbox" class="bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                  <span class="text-white text-md">Other</span>
                </label>
              </li>
              <!-- ...other list items -->
            </ul>
          </div>
      </div>
      <!--End Political Party-->
  
      <!--Start Transaction Type-->
      <div class="grid grid-cols-2 w-11/12 ml-auto mt-4">
        <div class="mb-4 mr-auto">
          <h2 class="text-xl sm:text-2xl text-white font-bold mb-3">Transaction Type</h2>
          <ul class="space-y-1">
            <li class="mb-2 cursor-pointer">
              <label on:click|stopPropagation={(event) => handleFilter(event,'Bought')} class="flex w-full items-center space-x-2 py-2 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                <input checked={filterList?.includes('Bought')} type="checkbox" class="bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                <label class="text-white text-md">Bought</label>
              </label>
            </li>
          </ul>
        </div>
          <!-- Column 2 -->
          <div class="mt-10">
            <ul class="space-y-1 ">
              <li class="mb-2 cursor-pointer">
                <label on:click|stopPropagation={(event) => handleFilter(event,'Sold')} class="flex w-full items-center space-x-2 py-2 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                  <input checked={filterList?.includes('Sold')} type="checkbox" class="bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                  <label class="text-white text-md">Sold</label>
                </label>
              </li>
              <!-- ...other list items -->
            </ul>
          </div>
      </div>
  
      <!--End Transaction Type-->
  
  
  
      </div>
    
  
      
      </div>
      </div>
      </div>
      </div>
    </div>
  </div>
  {/if}

<style>
  .republican-striped {
    background-image: repeating-linear-gradient(
        -45deg,
        #98272B,
        #98272B 10px,
        #840412 10px,
        #840412 20px
    );
}

.democratic-striped {
    background-image: repeating-linear-gradient(
        -45deg,
        #295AC7,
        #295AC7 10px,
        #164D9D 10px,
        #164D9D 20px
    );
}

.other-striped {
    background-image: repeating-linear-gradient(
        -45deg,
        #A4A6A8,
        #A4A6A8 10px,
        #C0C3C5 10px,
        #C0C3C5 20px
    );
}
</style>
<script lang='ts'>
    import { goto } from '$app/navigation';
    import { numberOfUnreadNotification, screenWidth } from '$lib/store';
    import InfiniteLoading from '$lib/components/InfiniteLoading.svelte';
    import { onMount } from 'svelte';
    //import UpgradeToPro from '$lib/components/UpgradeToPro.svelte';
  
    
      export let data;
      let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;
  
      let isLoaded = false;
      let rawData = []
      let displayList =  [];

      let order = 'highToLow';

  const sortByAmount = (tickerList) => {
    return tickerList?.sort(function(a, b) {
      if(order === 'highToLow')
      {
        return b?.amount - a?.amount;
      }
      else {
        return a?.amount - b?.amount;
      }
       
      });
  }

    async function infiniteHandler({ detail: { loaded, complete } }) 
    {
    if (displayList?.length === rawData?.length) {
        complete();
      } else {
        const nextIndex = displayList?.length;
        const newArticles = rawData?.slice(nextIndex, nextIndex + 5);
        displayList = [...displayList, ...newArticles];
        loaded();
      }
    }
    
      
    onMount(() => {
      rawData = data?.getCorporateLobbyingTracker ?? [];
      displayList = rawData?.slice(0,50) ?? []
      isLoaded = true;
    })
    
    
    let charNumber = 40;
    $: {
      if ($screenWidth < 640)
      {
        charNumber = 15;
      }
      else {
        charNumber = 40;
      }
    }
    
function changeOrder(state:string) {
  if (state === 'highToLow')
  {
    order = 'lowToHigh';
  }
  else {
    order = 'highToLow';
  }

  displayList = sortByAmount(rawData)?.slice(0,50);

}




    </script>
    
    <svelte:head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>
        {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Latest Lobbiyng Disclosure Tracker · stocknear
    </title>
    <meta name="description" content={`Track the latest senate lobbying spending of US companies.`} />
    
    <!-- Other meta tags -->
    <meta property="og:title" content={`Latest Lobbiyng Disclosure Tracker · stocknear`}/>
    <meta property="og:description" content={`Track the latest senate lobbying spending of US companies.`} />
    <meta property="og:type" content="website"/>
    <!-- Add more Open Graph meta tags as needed -->
    
    <!-- Twitter specific meta tags -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content={`Latest Lobbiyng Disclosure Tracker · stocknear`}/>
    <meta name="twitter:description" content={`Track the latest senate lobbying spending of US companies.`} />
    <!-- Add more Twitter meta tags as needed -->
    
    </svelte:head>
    
        
    
    <section class="w-full max-w-3xl sm:max-w-screen-xl overflow-hidden min-h-screen pt-5 pb-40">
          

              
      <div class="w-full overflow-hidden m-auto">
        
        
        <div class="sm:p-0 flex justify-center m-auto w-full overflow-hidden ">
            <div class="relative flex justify-center m-auto items-center overflow-hidden w-full">
                <main class="w-full">
                  
                  <div class="text-sm sm:text-[1rem] breadcrumbs ml-4">
                    <ul>
                      <li><a href="/" class="text-gray-300">Home</a></li>
                      <li class="text-gray-300">Corporate Lobbying Tracker</li>
                    </ul>
                  </div>
                  
                  <div class="w-full sm:bg-[#27272A] sm:border sm:border-gray-800 sm:rounded-lg h-auto pt-5 sm:pb-10 sm:pt-10 mt-3 mb-8">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
                  
                      <!-- Start Column -->
                      <div>
                        <div class="flex flex-row justify-center items-center">
                          <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
                            Lobbying Tracker
                          </h1>
                        </div>
              
                        <span class="text-white text-md font-medium text-center flex justify-center items-center ">
                            Track the latest lobbying spendings of US stock companies
                        </span>
              
          
                      </div>
                      <!-- End Column -->
                  
                      <!-- Start Column -->
                      <div class="hidden sm:block relative m-auto mb-5 mt-5 sm:mb-0 sm:mt-0">
                        <svg class="w-40 -my-5" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <filter id="glow">
                              <feGaussianBlur stdDeviation="5" result="glow"/>
                              <feMerge>
                                <feMergeNode in="glow"/>
                                <feMergeNode in="SourceGraphic"/>
                              </feMerge>
                            </filter>
                          </defs>
                          <path fill="#1E40AF" d="M57.6,-58.7C72.7,-42.6,81.5,-21.3,82,0.5C82.5,22.3,74.7,44.6,59.7,60.1C44.6,75.6,22.3,84.3,0,84.3C-22.3,84.2,-44.6,75.5,-61.1,60.1C-77.6,44.6,-88.3,22.3,-87.6,0.7C-86.9,-20.8,-74.7,-41.6,-58.2,-57.7C-41.6,-73.8,-20.8,-85.2,0.2,-85.4C21.3,-85.6,42.6,-74.7,57.6,-58.7Z" transform="translate(100 100)" filter="url(#glow)" />
                        </svg>
                        
                        
                        <div class="z-1 absolute top-4">
                            <img class="w-fit" src={cloudFrontUrl+'/assets/lobbying_logo.png'} alt="logo" loading="lazy">
                          </div>
                      </div>
                      <!-- End Column -->
                    </div>
              
                   
              
              
                  </div>
  
                  {#if isLoaded}
  
  
         
                  <div class="w-screen sm:w-full flex flex-row items-start mt-20 sm:mt-10">
                      
                    
                      <div class="w-screen sm:w-full rounded-none sm:rounded-lg mb-4 overflow-x-scroll lg:overflow-hidden">
                        <table class="table table-sm table-compact no-scrollbar rounded-none sm:rounded-md w-full bg-[#09090B] border-bg-[#09090B] m-auto">
                          <thead>
                            <tr class="bg-[#09090B]">
                              <th class="text-start bg-[#09090B] text-white text-[1rem] font-semibold">
                                Date
                              </th>
                              <th class="text-start bg-[#09090B] text-white text-[1rem] font-semibold">
                                Symbol
                              </th>
                              <th class="text-start bg-[#09090B] text-white text-[1rem] font-semibold">
                                Name
                              </th>
                              
                              <th class="text-end bg-[#09090B] text-white text-[1rem] font-semibold">
                                Sector
                              </th>
                              <th on:click={() => { changeOrder(order); }} class="cursor-pointer text-end bg-[#09090B] text-white text-[1rem] font-semibold">
                                Amount
                                <svg class="w-5 h-5 inline-block {order === 'highToLow' ? '' : 'rotate-180'}" viewBox="0 0 20 20" fill="currentColor" style="max-width:40px"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {#each displayList as item, index}
    
                            <tr on:click={() => goto(`/stocks/${item?.ticker}`)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#27272A] {index+1 === displayList?.length && data?.user?.tier !== 'Pro' ? 'opacity-[0.1]' : ''} cursor-pointer">
   

                            <td class="text-start text-sm sm:text-[1rem] text-white whitespace-nowrap">
                                {item?.date}
                            </td>

                              <td class="text-blue-400 text-sm sm:text-[1rem] text-start">
                                {item?.ticker}
                            </td>

                            <td class="text-white text-sm sm:text-[1rem] whitespace-nowrap text-white text-start">
                                {item?.name?.length > charNumber ? item?.name?.slice(0,charNumber) + "..." : item?.name}
                            </td>
  
                      

                              <td class="text-end text-sm sm:text-[1rem] font-medium text-white">
                                {item?.sector}
                              </td>

                              <td class="text-white text-sm sm:text-[1rem] text-end">
                                ${new Intl.NumberFormat("en", {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                              }).format(item?.amount)}
                              </td>

  
                            </tr>
                          {/each}
                          </tbody>
                        </table>
                    </div>
                      <InfiniteLoading on:infinite={infiniteHandler} />
                      <!--<UpgradeToPro data={data} title="Get the latest dark pool trades in realtime from Hedge Funds & Major Institutional Traders"/>-->
                  
                      
                      

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

                  
                </main>


            </div>
        </div>
    
      
      </div>
          
          
      
    </section>
    
    
<script lang='ts'>
    import { goto } from '$app/navigation';
    import { abbreviateNumber, formatETFName} from '$lib/utils';
    import { screenWidth, numberOfUnreadNotification } from '$lib/store';
    import InfiniteLoading from '$lib/components/InfiniteLoading.svelte';

    export let data;
    let rawData = data?.getETFProviderData;
    let etfProviderData = rawData?.slice(0,50);

    let etfProviderName = formatETFName(data?.getProviderName);

    const totalAssets = rawData?.reduce((total, item) => total + item?.totalAssets, 0);
    
    const avgExpenseRatio = rawData?.reduce(
    (total, item) => total + item?.expenseRatio || 0,
    0
    ) / rawData?.length;
    

    async function infiniteHandler({ detail: { loaded, complete } }) 
  {
  
  if (etfProviderData?.length === rawData?.length) {
      complete();
      } 
      else {
      const nextIndex = etfProviderData?.length;
      const newElements= rawData?.slice(nextIndex, nextIndex + 5);
      etfProviderData = [...etfProviderData, ...newElements];
      loaded();
      }
  }

    let charNumber = 20;
    
    $: {
      if ($screenWidth < 640)
      {
        charNumber = 30;
      }
      else {
        charNumber = 50;
      }
    }


</script>

<svelte:head>

  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>
    {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} {etfProviderData?.length} {etfProviderName} ETFs - A Complete List · stocknear
  </title>
  <meta name="description" content={``} />
  
  <!-- Other meta tags -->
  <meta property="og:title" content={`${etfProviderName} (${etfProviderData?.length}) ETFs - A Complete List`}/>
  <meta property="og:description" content={``} />
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content={`${etfProviderName} (${etfProviderData?.length}) ETFs - A Complete List`}/>
  <meta name="twitter:description" content={``} />
  <!-- Add more Twitter meta tags as needed -->

</svelte:head>


<section class="w-full overflow-hidden m-auto">
                

            {#if rawData?.length !== 0}
            <div class="w-full sm:flex sm:flex-row sm:items-center m-auto text-gray-100 border border-gray-800 sm:rounded-lg h-auto p-5 mb-4">
              <svg class="w-5 h-5 inline-block flex-shrink-0 mr-0.5 sm:mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#a474f6" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
              
              {etfProviderName} has {rawData?.length} ETFs listed with a total of {abbreviateNumber(totalAssets,true)} 
              in assets under management.
              The funds have an average expense ratio of {avgExpenseRatio?.toFixed(2)}%.
              
            </div>
            {/if}

            <div class="stats stats-horizontal bg-[#27272A] shadow w-full rounded-none sm:rounded-lg overflow-hidden">
      
                <div class="stat">
                  <div class="stat-title text-white text-sm sm:text-lg font-semibold">Listed Funds</div>
                  <div class="stat-value text-lg font-semibold text-white">{rawData?.length}</div>
                </div>
                
                <div class="stat">
                  <div class="stat-title text-white text-sm sm:text-lg font-semibold">Total Assets</div>
                  <div class="stat-value text-lg font-semibold text-white">{abbreviateNumber(totalAssets,true)}</div>
                </div>
                
                <div class="stat">
                  <div class="stat-title text-white text-sm sm:text-lg font-semibold">Average Cost</div>
                  <div class="stat-value text-lg font-semibold text-white">{avgExpenseRatio?.toFixed(2)}%</div>
                </div>
                
            </div>
        
            {#if rawData?.length !== 0}
        
              <!-- Page wrapper -->
              <div class="flex justify-center w-full m-auto h-full overflow-hidden">  
                  <!-- Content area -->
                  <div class="w-full overflow-x-scroll pt-5">
          
                    <table class="table table-sm  table-compact rounded-none sm:rounded-md w-full border-bg-[#09090B] m-auto mt-4 ">
                        <thead>
                          <tr class="border border-slate-800">
                            <th class="text-white font-semibold  text-[1rem]">Symbol</th>
                            <th class="text-white font-semibold text-[1rem]">Fund Name</th>
                            <th class="text-white font-semibold text-center text-[1rem]">Total Assets</th>
                            <th class="text-white font-semibold  text-[1rem] text-end">Holdings</th>
                            <th class="text-white font-semibold text-[1rem] text-end">Expense Ratio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {#each etfProviderData as item,index}
                          <!-- row -->
                          <tr on:click={() => goto("/etf/"+item?.symbol)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#27272A] border-b-[#09090B] shake-ticker cursor-pointer">
                            
                            <td class="text-blue-400 font-medium text-sm sm:text-[1rem] whitespace-nowrap border-b-[#09090B]">
                              {item?.symbol}
                            </td>
    
                            <td class="text-gray-200 border-b-[#09090B] text-sm sm:text-[1rem] whitespace-nowrap">
                              {item?.name?.length > charNumber ? item?.name?.slice(0,charNumber) + "..." : item?.name}
                            </td>
        
                            <td class="text-white font-medium  border-b-[#09090B] text-end sm:text-center text-sm sm:text-[1rem] whitespace-nowrap">
                                {abbreviateNumber(item?.totalAssets, true)}
                            </td>
          
                            <td class="text-white font-medium text-end  border-b-[#09090B] text-sm sm:text-[1rem] whitespace-nowrap">
                                {item?.numberOfHoldings}
                            </td>
                    
          
                            <td class="text-white font-medium text-end border-b-[#09090B] text-sm sm:text-[1rem] whitespace-nowrap">
                                {item?.expenseRatio}%
                            </td>
    
          
                       
        
                          </tr>
                          
                      
                          {/each}
                        </tbody>
                      </table>
        

                <InfiniteLoading on:infinite={infiniteHandler} />
              </div>

            </div>

            {:else}
            <div class="mt-10 w-full flex justify-center items-center m-auto text-2xl font-bold text-gray-300">
              No data Available
            </div>
            {/if}
    

            
</section>
          
          
          
          
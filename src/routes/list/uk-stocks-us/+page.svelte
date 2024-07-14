<script lang='ts'>
  import { goto } from '$app/navigation';
  import { screenWidth } from '$lib/store';
  import { abbreviateNumber} from '$lib/utils';
  import InfiniteLoading from '$lib/components/InfiniteLoading.svelte';
  
  export let data;
  let rawData = data?.getUKStocksUS;
  let marketCapList = rawData?.slice(0,50);
  
  async function infiniteHandler({ detail: { loaded, complete } }) 
  {
  
  if (marketCapList?.length === rawData?.length) {
      complete();
      } 
      else {
      const nextIndex = marketCapList?.length;
      const newElements= rawData?.slice(nextIndex, nextIndex + 5);
      marketCapList = [...marketCapList, ...newElements];
      loaded();
      }
  }
  
  let totalMarketCap = rawData?.reduce((total, stock) => total + stock?.marketCap, 0);
  let totalRevenue = rawData?.reduce((total, stock) => total + stock?.revenue, 0);
  let totalProfits = rawData?.reduce((total, stock) => total + stock?.netIncome, 0) ?? 0;
  
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
  </script>
      
      <section class="w-full max-w-4xl overflow-hidden m-auto">
              
            

        <div class="w-full max-w-4xl sm:flex sm:flex-row sm:items-center m-auto text-gray-100 bg-[#09090B] sm:rounded-lg h-auto p-5 mb-4">
          <svg class="w-5 h-5 inline-block sm:mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#a474f6" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
          A complete list of the UK companies that are listed on the US stock market.
        </div>
  
          
        <div class="stats stats-horizontal no-scrollbar bg-[#09090B] w-full rounded-lg text-white">
    
          <div class="stat">
            <div class="stat-title text-sm sm:text-lg font-semibold text-white">Total Stocks</div>
            <div class="stat-value text-lg font-semibold text-white">{rawData?.length}</div>
          </div>
          
          <div class="stat">
            <div class="stat-title text-sm sm:text-lg font-semibold text-white">Total Market Cap</div>
            <div class="stat-value text-lg font-semibold text-white">{abbreviateNumber(totalMarketCap,true)}</div>
          </div>
          
          <div class="stat">
            <div class="stat-title text-sm sm:text-lg font-semibold text-white">Total Revenue</div>
            <div class="stat-value text-lg font-semibold text-white">{abbreviateNumber(totalRevenue,true)}</div>
          </div>
  
          <div class="stat">
            <div class="stat-title text-sm sm:text-lg font-semibold text-white">Total Profits</div>
            <div class="stat-value text-lg font-semibold text-white">{abbreviateNumber(totalProfits,true)}</div>
          </div>
          
        </div>
      
      
          
            <!-- Page wrapper -->
            <div class="flex justify-center w-full max-w-5xl m-auto h-full overflow-hidden">
        
                
          
                <!-- Content area -->
                <div class="relative flex flex-col flex-1 overflow-hidden">
        
      
             
                  <table class="table table-sm sm:table-md table-compact rounded-none sm:rounded-md w-full border-bg-[#09090B] m-auto mt-4 ">
                    <thead>
                      <tr class="border border-slate-800">
                        <th class="text-slate-200 hidden sm:table-cell sm:font-bold text-[0.95rem]">Symbol</th>
                        <th class="text-slate-200 sm:font-bold text-[0.95rem]">Company</th>
                        <th class="text-slate-200 sm:font-bold text-end text-[0.95rem]">Market Cap</th>
                        <th class="text-slate-200 sm:font-bold hidden sm:table-cell text-center text-[0.95rem]">Revenue</th>
                        <th class="text-slate-200 sm:font-bold hidden sm:table-cell text-center text-[0.95rem]">Profits</th>
                        <th class="text-slate-200 sm:font-bold text-[0.95rem] text-end">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each marketCapList as item,index}
                      <!-- row -->
                      <tr on:click={() => goto("/stocks/"+item?.symbol)}  class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#27272A] border-b-[#09090B] shake-ticker cursor-pointer">
                      
                      
                        <td class="hidden sm:table-cell text-blue-400 font-medium  border-b-[#09090B]">
                          {item?.symbol}
                        </td>
      
      
                        <td class="text-gray-200 border-b-[#09090B]">
                          <span class="hidden sm:inline-block text-white font-medium">{item?.name?.length > charNumber ? item?.name?.slice(0,charNumber) + "..." : item?.name}</span>
                          <div class="sm:hidden flex flex-row">
                            <div class="flex flex-col">
                              <span class="text-blue-400 font-medium">{item?.symbol}</span>
                              <span class="text-gray-200 font-medium">{item?.name?.length > charNumber ? item?.name?.slice(0,charNumber) + "..." : item?.name}</span>
                            </div>
                          </div>
                        </td>
      
                        <td class="text-white font-medium text-end border-b-[#09090B]">
                            {abbreviateNumber(item?.marketCap,true)}
                        </td>
      
                        <td class="text-white font-medium text-center hidden sm:table-cell border-b-[#09090B]">
                            {item?.revenue !== null ? abbreviateNumber(item?.revenue,true) : '-'}
                        </td>
      
                        <td class="text-white font-medium text-center hidden sm:table-cell border-b-[#09090B]">
                          {item?.netIncome !== null ? abbreviateNumber(item?.netIncome,true) : '-'}
                      </td>
                
      
                        <td class="text-gray-200 border-b-[#09090B]">
                            <div class="flex flex-row justify-end items-center">
              
                              <div class="flex flex-col">
                                <span class="text-white font-semibold text-md ml-auto">${item.price?.toFixed(2)}</span>
                                <div class="flex flex-row mt-0.5 ml-auto">
                                  {#if item.changesPercentage >=0}
                                    <svg class="w-5 h-5 -mr-0.5 -mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                                    <span class="text-[#10DB06] text-xs font-medium">+{item.changesPercentage?.toFixed(2)}%</span>
                                  {:else}
                                    <svg class="w-5 h-5 -mr-0.5 -mt-0.5 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                                    <span class="text-[#FF2F1F] text-xs font-medium">{item.changesPercentage?.toFixed(2)}% </span> 
                                  {/if}
                                </div>
                              </div>
              
                              
                          </div>
                        </td>
      
                   
        
        
                      </tr>
                      
                  
                      {/each}
                    </tbody>
                  </table>
      
                    
                    <InfiniteLoading on:infinite={infiniteHandler} />
  
            </div>
  
            
        
        </section>
        
        
        
        
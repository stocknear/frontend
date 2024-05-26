<script lang='ts'>
  import { goto } from '$app/navigation';
  import { screenWidth } from '$lib/store';
  import { abbreviateNumber} from '$lib/utils';
  import InfiniteLoading from '$lib/components/InfiniteLoading.svelte';
  import InfoModal from '$lib/components/InfoModal.svelte';

  export let data;
  let rawData = data?.getBasicMaterialsSector;
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
  
  let totalMarketCap = rawData?.reduce((total, stock) => total + stock?.marketCap, 0) ?? 0;
  let totalRevenue = rawData?.reduce((total, stock) => total + stock?.revenue, 0) ?? 0;
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
              
            
          <div class="w-full max-w-4xl sm:flex sm:flex-row sm:items-center m-auto text-gray-100 bg-[#202020] sm:rounded-lg h-auto p-5 mb-4">
            <svg class="w-5 h-5 inline-block sm:mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#60a5fa" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
              A complete list of companies in the Basic Materials Sector that are publicly traded on the US stock exchange.
          </div>
      
          <div class="stats stats-horizontal no-scrollbar bg-[#202020] shadow w-full rounded-lg">
            
            <div class="grid grid-cols-2 sm:grid-cols-3">

              <div class="stat">
                <div class="flex flex-row items-center">
                  <label for="stocksInfo" class="cursor-pointer stat-title text-sm sm:text-lg font-semibold text-white">
                    Stocks
                  </label>
                  <InfoModal
                    title={"Stocks"}
                    content={"The total number of companies who operates in this sector."}
                    id={"stocksInfo"}
                  />
                  </div>
                <div class="stat-value text-lg font-semibold text-white">{rawData?.length}</div>
              </div>
              


              <div class="stat">
                <div class="flex flex-row items-center">
                <label for="marketCapModal" class="cursor-pointer stat-title text-sm sm:text-lg font-semibold text-white">
                  Market Cap
                </label>
                <InfoModal
                      title={"Market Cap"}
                      content={"Combined market cap of all companies in this sector."}
                      id={"marketCapModal"}
                    />
                </div>
                
                <div class="stat-value text-lg font-semibold text-white">{abbreviateNumber(totalMarketCap,true)}</div>
              </div>
              
              <div class="stat">
                <div class="flex flex-row items-center">
                <label for="revenueInfo" class="cursor-pointer stat-title text-sm sm:text-lg font-semibold text-white">
                  Revenue
                </label>
                <InfoModal
                  title={"Revenue"}
                  content={"The total revenue of all companies in this sector."}
                    id={"revenueInfo"}
                    />
                  </div>
                <div class="stat-value text-lg font-semibold text-white">{abbreviateNumber(totalRevenue,true)}</div>
              </div>

              <div class="stat">
                <div class="flex flex-row items-center">
                  <label for="profitsInfo" class="cursor-pointer stat-title text-sm sm:text-lg font-semibold text-white">
                    Profits
                  </label>
                  <InfoModal
                    title={"Profits"}
                    content={"The total net income of all companies in this sector."}
                    id={"profitsInfo"}
                    />
                    </div>
                <div class="stat-value text-lg font-semibold text-white">{abbreviateNumber(totalProfits,true)}</div>
              </div>

              <div class="stat">
                <div class="flex flex-row items-center">
                  <label for="profitMarginInfo" class="cursor-pointer stat-title text-sm sm:text-lg font-semibold text-white">
                    Profit Margin
                  </label>
                  <InfoModal
                    title={"Profit Margin"}
                    content={"The industry's profit margin, calculated by dividing the industry's total net income by the total revenue."}
                      id={"profitMarginInfo"}
                      />
                  </div>

                <div class="stat-value text-lg font-semibold text-white">{(totalProfits/totalRevenue *100)?.toFixed(2)}%</div>
              </div>


              <div class="stat">
                <div class="flex flex-row items-center">
                  <label for="peRatioInfo" class="cursor-pointer stat-title text-sm sm:text-lg font-semibold text-white">
                    PE Ratio
                  </label>
                  <InfoModal
                    title={"PE Ratio"}
                    content={"The industry's PE Ratio, calculated by dividing the industry's total market cap by the total net income."}
                    id={"peRatioInfo"}
                  />
                  </div>
                <div class="stat-value text-lg font-semibold text-white">{(totalProfits/totalMarketCap *100)?.toFixed(2)}</div>
              </div>


            </div>

              
          </div>
      
      
          
            <!-- Page wrapper -->
            <div class="flex justify-center w-full max-w-5xl m-auto h-full overflow-hidden">
        
                
          
                <!-- Content area -->
                <div class="relative flex flex-col flex-1 overflow-hidden">
        
      
             
                <table class="table table-sm sm:table-md table-compact rounded-none sm:rounded-md w-full border-bg-[#0F0F0F] m-auto mt-4 ">
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
                      <tr on:click={() => goto("/stocks/"+item?.symbol)}  class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] {index % 2 === 0 ? 'bg-opacity-[0.25] bg-[#323239]' : 'bg-[#0F0F0F]'} border-b-[#0F0F0F] shake-ticker cursor-pointer">
                      
                      
                        <td class="hidden sm:table-cell text-blue-400 font-medium  border-b-[#0F0F0F]">
                          {item?.symbol}
                        </td>


                        <td class="text-gray-200 border-b-[#0F0F0F]">
                          <span class="hidden sm:inline-block text-white font-medium">{item?.name?.length > charNumber ? item?.name?.slice(0,charNumber) + "..." : item?.name}</span>
                          <div class="sm:hidden flex flex-row">
                            <div class="flex flex-col">
                              <span class="text-blue-400 font-medium">{item?.symbol}</span>
                              <span class="text-gray-200 font-medium">{item?.name?.length > charNumber ? item?.name?.slice(0,charNumber) + "..." : item?.name}</span>
                            </div>
                          </div>
                        </td>
    
                        <td class="text-white font-medium text-end border-b-[#0F0F0F]">
                            {abbreviateNumber(item?.marketCap,true)}
                        </td>
      
                        <td class="text-white font-medium text-center hidden sm:table-cell border-b-[#0F0F0F]">
                            {item?.revenue !== null ? abbreviateNumber(item?.revenue,true) : '-'}
                        </td>

                        <td class="text-white font-medium text-center hidden sm:table-cell border-b-[#0F0F0F]">
                          {item?.revenue !== null ? abbreviateNumber(item?.netIncome,true) : '-'}
                      </td>
                
      
                        <td class="text-gray-200 border-b-[#0F0F0F]">
                            <div class="flex flex-row justify-end items-center">
              
                              <div class="flex flex-col">
                                <span class="text-white font-bold text-md ml-auto">${item.price?.toFixed(2)}</span>
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

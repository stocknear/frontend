<script lang='ts'>
  import { goto } from '$app/navigation';
  import { screenWidth } from '$lib/store';
  import { abbreviateNumber} from '$lib/utils';
  import InfoModal from '$lib/components/InfoModal.svelte';
  
  export let data;
  let rawData = data?.getMagnificentSeven;
  
  
  let totalMarketCap = rawData?.reduce((total, stock) => total + stock?.marketCap, 0) ?? 0;
  let totalRevenue = rawData?.reduce((total, stock) => total + stock?.revenue, 0) ?? 0;
  let totalProfits = rawData?.reduce((total, stock) => total + stock?.netIncome, 0) ?? 0;
  let avgPERatio = ((rawData?.reduce((total, stock) => total + stock?.pe, 0) ?? 0)/rawData?.length)?.toFixed(2);

  
  $: charNumber = $screenWidth < 640 ? 15 : 20;
  </script>
      
      <section class="w-full overflow-hidden m-auto">
              
            
          <div class="w-full border border-gray-800 sm:flex sm:flex-row sm:items-center m-auto text-gray-100 bg-[#09090B] sm:rounded-lg h-auto p-5 mb-4">
              <svg class="w-5 h-5 inline-block sm:mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#a474f6" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
              
              The term "Magnificent 7" refers to a group of 7 well-known technological stocks that made large contributions to the market's overall performance.
            </div>
      
          <div class="stats stats-horizontal bg-[#27272A] w-full rounded-lg">
            
            <div class="grid grid-cols-2 sm:grid-cols-3">

              <div class="stat">
                <div class="flex flex-row items-center">
                  <label for="stocksInfo" class="cursor-pointer stat-title text-md sm:text-lg font-semibold text-gray-300">
                    Stocks
                  </label>
                  <InfoModal
                    title={"Stocks"}
                    content={"The total number of companies who operates in this sector."}
                    id={"stocksInfo"}
                  />
                  </div>
                <div class="stat-value mt-1 text-lg font-semibold text-gray-200">{rawData?.length}</div>
              </div>
              


              <div class="stat">
                <div class="flex flex-row items-center">
                <label for="marketCapModal" class="cursor-pointer stat-title text-md sm:text-lg font-semibold text-gray-300">
                  Market Cap
                </label>
                <InfoModal
                      title={"Market Cap"}
                      content={"Combined market cap of all companies in this group."}
                      id={"marketCapModal"}
                    />
                </div>
                
                <div class="stat-value mt-1 text-lg font-semibold text-gray-200">{abbreviateNumber(totalMarketCap,true)}</div>
              </div>
              
              <div class="stat">
                <div class="flex flex-row items-center">
                <label for="revenueInfo" class="cursor-pointer stat-title text-md sm:text-lg font-semibold text-gray-300">
                  Revenue
                </label>
                <InfoModal
                  title={"Revenue"}
                  content={"The total revenue of all companies in this group"}
                    id={"revenueInfo"}
                    />
                  </div>
                <div class="stat-value text-lg font-semibold text-gray-200">{abbreviateNumber(totalRevenue,true)}</div>
              </div>

              <div class="stat">
                <div class="flex flex-row items-center">
                  <label for="profitsInfo" class="cursor-pointer stat-title text-md sm:text-lg font-semibold text-gray-300">
                    Profits
                  </label>
                  <InfoModal
                    title={"Profits"}
                    content={"The total net income of all companies in this group"}
                    id={"profitsInfo"}
                    />
                    </div>
                <div class="stat-value text-lg font-semibold text-gray-200">{abbreviateNumber(totalProfits,true)}</div>
              </div>

              <div class="stat">
                <div class="flex flex-row items-center">
                  <label for="profitMarginInfo" class="cursor-pointer stat-title text-md sm:text-lg font-semibold text-gray-300">
                    Profit Margin
                  </label>
                  <InfoModal
                    title={"Profit Margin"}
                    content={"The magnificent seven profit margin, calculated by dividing the total net income of all constituents by the total revenue."}
                      id={"profitMarginInfo"}
                      />
                  </div>

                <div class="stat-value text-lg font-semibold text-gray-200">{(totalProfits/totalRevenue *100)?.toFixed(2)}%</div>
              </div>


              <div class="stat">
                <div class="flex flex-row items-center">
                  <label for="peRatioInfo" class="cursor-pointer stat-title text-md sm:text-lg font-semibold text-gray-300">
                    Avg. PE Ratio
                  </label>
                  <InfoModal
                    title={"PE Ratio"}
                    content={"The magnificent seven average PE Ratio, calculated by dividing total PE Ratio of all constituents by the number of constituents."}
                    id={"peRatioInfo"}
                  />
                  </div>
                <div class="stat-value text-lg font-semibold text-gray-200">{avgPERatio}</div>
              </div>


            </div>

              
          </div>
      
      
          
            <!-- Page wrapper -->
            <div class="flex justify-center w-full m-auto h-full overflow-hidden">
        
                
          
                <!-- Content area -->
                <div class="w-full overflow-x-scroll">
        
      
             
                <table class="table table-sm sm:table-md table-compact rounded-none sm:rounded-md w-full border-bg-[#09090B] m-auto mt-4 ">
                    <thead>
                      <tr class="border border-slate-800">
                        <th class="text-white font-semibold text-[1rem]">Symbol</th>
                        <th class="text-white font-semibold text-[1rem]">Company</th>
                        <th class="text-white font-semibold text-end text-[1rem]">Market Cap</th>
                        <th class="text-white font-semibold text-center text-[1rem]">Revenue</th>
                        <th class="text-white font-semibold text-center text-[1rem]">Profits</th>
                        <th class="text-white font-semibold text-[1rem] text-end">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each rawData as item}
                      <!-- row -->
                      <tr on:click={() => goto("/stocks/"+item?.symbol)}  class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#27272A] border-b-[#09090B] shake-ticker cursor-pointer">
                      
                      
                        <td class="text-blue-400 text-sm sm:text-[1rem] whitespace-nowrap font-medium  border-b-[#09090B]">
                          {item?.symbol}
                        </td>


                        <td class="text-white text-sm sm:text-[1rem] whitespace-nowrap border-b-[#09090B]">
                          {item?.name?.length > charNumber ? item?.name?.slice(0,charNumber) + "..." : item?.name}
                        </td>
    
                        <td class="text-white text-sm sm:text-[1rem] whitespace-nowrap font-medium text-end border-b-[#09090B]">
                            {abbreviateNumber(item?.marketCap,true)}
                        </td>
      
                        <td class="text-white text-sm sm:text-[1rem] whitespace-nowrap font-medium text-center border-b-[#09090B]">
                            {item?.revenue !== null ? abbreviateNumber(item?.revenue,true) : '-'}
                        </td>

                        <td class="text-white text-sm sm:text-[1rem] whitespace-nowrap font-medium text-center border-b-[#09090B]">
                          {item?.netIncome !== null ? abbreviateNumber(item?.netIncome,true) : '-'}
                        </td>
                
      
                        <td class="text-white text-sm sm:text-[1rem] whitespace-nowrap border-b-[#09090B]">
                            <div class="flex flex-row justify-end items-center">
              
                              <div class="flex flex-col">
                                <span class="text-white font-semibold text-md ml-auto">${item.price?.toFixed(2)}</span>
                                <div class="flex flex-row mt-0.5 ml-auto">
                                  {#if item.changesPercentage >=0}
                                    <svg class="w-5 h-5 -mr-0.5 -mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#37C97D" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                                    <span class="text-[#37C97D]">+{item.changesPercentage?.toFixed(2)}%</span>
                                  {:else}
                                    <svg class="w-5 h-5 -mr-0.5 -mt-0.5 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                                    <span class="text-[#FF2F1F]">{item.changesPercentage?.toFixed(2)}% </span> 
                                  {/if}
                                </div>
                              </div>
              
                              
                          </div>
                        </td>
      
                   
        
        
                      </tr>
                      
                  
                      {/each}
                    </tbody>
                </table>
      
                      
            </div>
  
            
        
        </section>
        
        

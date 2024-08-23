<script lang='ts'>
  import { goto } from '$app/navigation';
  import { screenWidth } from '$lib/store';
  import { abbreviateNumber} from '$lib/utils';
  import InfoModal from '$lib/components/InfoModal.svelte';
  import { onMount } from 'svelte';

  export let data;
  let rawData = data?.getCommunicationServicesSector;
  let marketCapList = rawData?.slice(0,50);
  
  
  async function handleScroll() {
      const scrollThreshold = document.body.offsetHeight * 0.8; // 80% of the website height
      const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;
      if (isBottom && displayList?.length !== rawData?.length) {
          const nextIndex = displayList?.length;
          const filteredNewResults = rawData?.slice(nextIndex, nextIndex + 50);
          displayList = [...displayList, ...filteredNewResults];
      }
    }
  
    onMount(async () => {
      window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    })
  
  
  let totalMarketCap = rawData?.reduce((total, stock) => total + stock?.marketCap, 0) ?? 0;
  let totalRevenue = rawData?.reduce((total, stock) => total + stock?.revenue, 0) ?? 0;
  let totalProfits = rawData?.reduce((total, stock) => total + stock?.netIncome, 0) ?? 0;

  
  $: charNumber = $screenWidth < 640 ? 15 : 20;
  </script>
      
      <section class="w-full overflow-hidden m-auto">
              
            
          <div class="border border-gray-800 w-full sm:flex sm:flex-row sm:items-center m-auto text-gray-100 bg-[#09090B] sm:rounded-lg h-auto p-5 mb-4">
              <svg class="w-5 h-5 inline-block sm:mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#a474f6" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
              A complete list of companies in the Communication Services Sector that are publicly traded on the US stock exchange.
          </div>
      
          <div class="stats stats-horizontal no-scrollbar bg-[#27272A] shadow w-full rounded-lg">
            
            <div class="grid grid-cols-2 sm:grid-cols-4">

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
                      {#each marketCapList as item,index}
                      <!-- row -->
                      <tr on:click={() => goto("/stocks/"+item?.symbol)}  class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#27272A] border-b-[#09090B] shake-ticker cursor-pointer">
                      
                      
                        <td class="text-blue-400 font-medium text-sm sm:text-[1rem] whitespace-nowrap border-b-[#09090B]">
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
                                <span class="text-white ml-auto">${item.price?.toFixed(2)}</span>
                                <div class="flex flex-row mt-0.5 ml-auto">
                                  {#if item.changesPercentage >=0}
                                    <span class="text-[#10DB06]">+{item.changesPercentage?.toFixed(2)}%</span>
                                  {:else}
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
        
        

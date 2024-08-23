<script lang='ts'>
  import { goto } from '$app/navigation';
  import { screenWidth } from '$lib/store';
  import { abbreviateNumber} from '$lib/utils';
  import { onMount } from 'svelte';

  export let data;
  
  let rawData = data?.getMicroCapStocks;
  let marketCapList = rawData?.slice(0,50);
  
  
  async function handleScroll() {
    const scrollThreshold = document.body.offsetHeight * 0.8; // 80% of the website height
    const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;
    if (isBottom && marketCapList?.length !== rawData?.length) {
        const nextIndex = marketCapList?.length;
        const filteredNewResults = rawData?.slice(nextIndex, nextIndex + 50);
        marketCapList = [...marketCapList, ...filteredNewResults];
    }
  }

  onMount(async () => {
    window.addEventListener('scroll', handleScroll);
      return () => {
          window.removeEventListener('scroll', handleScroll);
      };
  })

  let totalMarketCap = rawData?.reduce((total, stock) => total + stock?.marketCap, 0);
  let totalRevenue = rawData?.reduce((total, stock) => total + stock?.revenue, 0);
  let totalProfits = rawData?.reduce((total, stock) => total + stock?.netIncome, 0);
    
  $: charNumber = $screenWidth < 640 ? 15 : 20;

  </script>
  
  <section class="w-full overflow-hidden m-auto">
          
        
        
    <div class="w-full m-auto text-gray-100 bg-[#27272A] sm:rounded-lg h-auto p-5 mb-4">
      Micro-cap stocks have a market capitalizations ranging between $50 and $300 million USD, while additional categories include 
        <a href="/list/mega-cap-stocks" class="text-blue-400 hover:text-white">
            Mega-Cap
        </a>,
        <a href="/list/large-cap-stocks" class="text-blue-400 hover:text-white">
            Large-Cap
        </a>,
        <a href="/list/mid-cap-stocks" class="text-blue-400 hover:text-white">
            Mid-Cap
        </a>,
        <a href="/list/small-cap-stocks" class="text-blue-400 hover:text-white">
            Small-Cap
        </a>,
        <a href="/list/nano-cap-stocks" class="text-blue-400 hover:text-white">
            Nano-Cap
        </a>.
    </div>
  
    <div class="stats stats-horizontal no-scrollbar bg-[#27272A] w-full rounded-lg text-white">
    
      <div class="stat">
        <div class="stat-title text-sm sm:text-lg font-semibold text-white">Total Stocks</div>
        <div class="stat-value text-lg font-semibold">{rawData?.length}</div>
      </div>
      
      <div class="stat">
        <div class="stat-title text-sm sm:text-lg font-semibold text-white">Total Market Cap</div>
        <div class="stat-value text-lg font-semibold">{abbreviateNumber(totalMarketCap,true)}</div>
      </div>
      
      <div class="stat">
        <div class="stat-title text-sm sm:text-lg font-semibold text-white">Total Revenue</div>
        <div class="stat-value text-lg font-semibold">{abbreviateNumber(totalRevenue,true)}</div>
      </div>

      <div class="stat">
        <div class="stat-title text-sm sm:text-lg font-semibold text-white">Total Profits</div>
        <div class="stat-value text-lg font-semibold">{abbreviateNumber(totalProfits,true)}</div>
      </div>
      
    </div>
  
  
      
        <!-- Page wrapper -->
        <div class="flex justify-center w-full m-auto h-full overflow-hidden">
    
            
      
            <!-- Content area -->
            <div class="w-full overflow-x-scroll">
    
  
         
              <table class="table table-sm sm:table-md table-compact rounded-none sm:rounded-md w-full border-bg-[#09090B] m-auto mt-4 ">
                <thead>
                  <tr class="border border-slate-800">
                    <th class="text-slate-200 sm:font-bold text-[1rem]">Symbol</th>
                    <th class="text-slate-200 sm:font-bold text-[1rem]">Company</th>
                    <th class="text-slate-200 sm:font-bold text-end text-[1rem]">Market Cap</th>
                    <th class="text-slate-200 sm:font-bold text-center text-[1rem]">Revenue</th>
                    <th class="text-slate-200 sm:font-bold text-center text-[1rem]">Profits</th>
                    <th class="text-slate-200 sm:font-bold text-[1rem] text-end">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {#each marketCapList as item,index}
                  <!-- row -->
                  <tr on:click={() => goto("/stocks/"+item?.symbol)}  class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#27272A] border-b-[#09090B] shake-ticker cursor-pointer">
                  
                  
                    <td class="text-blue-400 font-medium text-sm sm:text-[1rem] whitespace-nowrap border-b-[#09090B]">
                      {item?.symbol}
                    </td>
  
  
                    <td class="text-gray-200 border-b-[#09090B] text-sm sm:text-[1rem] whitespace-nowrap">
                      {item?.name?.length > charNumber ? item?.name?.slice(0,charNumber) + "..." : item?.name}
                    </td>
  
                    <td class="text-white font-medium text-sm sm:text-[1rem] whitespace-nowrap text-end border-b-[#09090B]">
                        {abbreviateNumber(item?.marketCap,true)}
                    </td>
  
                    <td class="text-white font-medium text-sm sm:text-[1rem] whitespace-nowrap text-center border-b-[#09090B]">
                        {item?.revenue !== null ? abbreviateNumber(item?.revenue,true) : '-'}
                    </td>
  
                    <td class="text-white font-medium text-sm sm:text-[1rem] whitespace-nowrap text-center border-b-[#09090B]">
                      {item?.netIncome !== null ? abbreviateNumber(item?.netIncome,true) : '-'}
                  </td>
            
  
                    <td class="text-gray-200 border-b-[#09090B] text-sm sm:text-[1rem] whitespace-nowrap">
                        <div class="flex flex-row justify-end items-center">
          
                          <div class="flex flex-col">
                            <span class="text-white font-semibold text-md ml-auto">${item.price?.toFixed(2)}</span>
                            <div class="flex flex-row mt-0.5 ml-auto">
                              {#if item.changesPercentage >=0}
                                <span class="text-[#10DB06] font-medium">+{item.changesPercentage?.toFixed(2)}%</span>
                              {:else}
                                <span class="text-[#FF2F1F] font-medium">{item.changesPercentage?.toFixed(2)}% </span> 
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
    
    
    
    
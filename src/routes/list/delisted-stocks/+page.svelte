<script lang='ts'>
import { screenWidth } from '$lib/store';
import { onMount } from 'svelte';

export let data;
let rawData = data?.getDelistedStocks;
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
    
    <section class="w-full overflow-hidden m-auto">
            
          
        <div class="border border-gray-800 w-full sm:flex sm:flex-row sm:items-center m-auto text-gray-100 bg-[#09090B] sm:rounded-lg h-auto p-5 mb-4">
            <svg class="w-5 h-5 inline-block sm:mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#a474f6" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
            
            A list of companies delisted from the exchange and no longer publicly traded.
            
          </div>
    
        <div class="stats stats-horizontal no-scrollbar bg-[#27272A] shadow w-full rounded-lg">
      
            <div class="stat">
              <div class="stat-title text-sm sm:text-lg font-semibold text-white">Total Stocks</div>
              <div class="stat-value text-lg font-semibold text-white">{rawData?.length}</div>
            </div>
            
            <div class="stat">
              <div class="stat-title text-sm sm:text-lg font-semibold text-white">Total Market Cap</div>
              <div class="stat-value text-lg font-semibold text-white">---</div>
            </div>
            
            <div class="stat">
              <div class="stat-title text-sm sm:text-lg font-semibold text-white">Total Revenue</div>
              <div class="stat-value text-lg font-semibold text-white">---</div>
            </div>
            
          </div>
    
    
        
          <!-- Page wrapper -->
          <div class="flex justify-center w-full m-auto h-full overflow-hidden">
      
              
        
              <!-- Content area -->
              <div class="w-full overflow-x-scroll">
      
    
           
                <table class="table rounded-none sm:rounded-md w-full m-auto mt-4 ">
                    <thead>
                      <tr class="border border-slate-800">
                        <th class="text-white font-semibold text-[1rem]">Symbol</th>
                        <th class="text-white font-semibold text-[1rem]">Company</th>
                        <th class="text-white font-semibold text-[1rem]">IPO</th>
                        <th class="text-white font-semibold text-center text-[1rem]">Exchange</th>
                        <th class="text-white font-semibold text-[1rem] text-end">Delisted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each marketCapList as item,index}
                      <!-- row -->
                      <tr class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#27272A] border-b-[#09090B]">
                        <td class="text-blue-400 font-medium text-sm sm:text-[1rem] whitespace-nowrap border-b-[#09090B]">
                          {item?.symbol}
                        </td>
      
      
                        <td class="text-white text-sm sm:text-[1rem] whitespace-nowrap border-b-[#09090B]">
                          {item?.companyName?.length > charNumber ? item?.companyName?.slice(0,charNumber) + "..." : item?.companyName}
                        </td>
    
                        <td class="text-white font-medium text-sm sm:text-[1rem] whitespace-nowrap border-b-[#09090B]">
                            {new Date(item?.ipoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
      
                        <td class="text-white font-medium text-sm sm:text-[1rem] whitespace-nowrap text-center border-b-[#09090B]">
                            {item?.exchange}
                        </td>
                
      
                        <td class="text-white font-medium text-sm sm:text-[1rem] whitespace-nowrap text-end border-b-[#09090B]">
                          {new Date(item?.delistedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
      
                   
        
        
                      </tr>
                      
                  
                      {/each}
                    </tbody>
                  </table>
    
                  
          </div>

          
      
      </section>
      
      
      
      
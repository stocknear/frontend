<script lang='ts'>
import { screenWidth } from '$lib/store';
import InfiniteLoading from '$lib/components/InfiniteLoading.svelte';

export let data;
let rawData = data?.getDelistedStocks;
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
            
            A list of companies delisted from the exchange and no longer publicly traded.
            
          </div>
    
        <div class="stats stats-horizontal no-scrollbar bg-[#09090B] shadow w-full rounded-lg">
      
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
          <div class="flex justify-center w-full max-w-5xl m-auto h-full overflow-hidden">
      
              
        
              <!-- Content area -->
              <div class="w-full overflow-x-scroll">
      
    
           
                <table class="table rounded-none sm:rounded-md w-full border-bg-[#09090B] m-auto mt-4 ">
                    <thead>
                      <tr class="border border-slate-800">
                        <th class="text-slate-200 hidden sm:table-cell sm:font-bold text-[0.95rem]">Symbol</th>
                        <th class="text-slate-200 sm:font-bold text-[0.95rem]">Company</th>
                        <th class="text-slate-200 sm:font-bold text-[0.95rem]">IPO</th>
                        <th class="text-slate-200 sm:font-bold hidden sm:table-cell text-center text-[0.95rem]">Exchange</th>
                        <th class="text-slate-200 sm:font-bold text-[0.95rem] text-end">Delisted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each marketCapList as item,index}
                      <!-- row -->
                      <tr class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#27272A] border-b-[#09090B]">
                        <td class="hidden sm:table-cell text-blue-400 font-medium  border-b-[#09090B]">
                          {item?.symbol}
                        </td>
      
      
                        <td class="text-gray-200 border-b-[#09090B]">
                          <span class="hidden sm:inline-block text-white font-medium">{item?.companyName?.length > charNumber ? item?.companyName?.slice(0,charNumber) + "..." : item?.companyName}</span>
                          <div class="sm:hidden flex flex-row">
                            <div class="flex flex-col">
                              <span class="text-blue-400 font-medium">{item?.symbol}</span>
                              <span class="text-gray-200 font-medium">{item?.companyName?.length > charNumber ? item?.companyName?.slice(0,charNumber) + "..." : item?.companyName}</span>
                            </div>
                          </div>
                        </td>
    
                        <td class="text-white font-medium  border-b-[#09090B]">
                            {new Date(item?.ipoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
      
                        <td class="text-white font-medium text-center hidden sm:table-cell border-b-[#09090B]">
                            {item?.exchange}
                        </td>
                
      
                        <td class="text-white font-medium text-end border-b-[#09090B]">
                          {new Date(item?.delistedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
      
                   
        
        
                      </tr>
                      
                  
                      {/each}
                    </tbody>
                  </table>
    
                  
                  <InfiniteLoading on:infinite={infiniteHandler} />

          </div>

          
      
      </section>
      
      
      
      
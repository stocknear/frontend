<script lang='ts'>
import { goto } from '$app/navigation';
import { screenWidth } from '$lib/store';
import { abbreviateNumber} from '$lib/utils';

export let data;

let rawData = data?.getETFBitcoinList;

const totalAssets = rawData?.reduce((total, etf) => total + etf?.totalAssets, 0);
const avgExpenseRatio = rawData?.reduce(
(total, item) => total + item?.expenseRatio || 0,
0
) / rawData?.length;

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
      
      A list of all Bitcoin ETFs available for trading on the US stock market, offering investors exposure to the cryptocurrency's price.
    </div>

  <div class="stats stats-horizontal bg-[#09090B] shadow w-full rounded-lg">

      <div class="stat">
        <div class="stat-title text-sm sm:text-lg font-semibold text-white">Total ETFs</div>
        <div class="stat-value text-lg font-semibold text-white">{rawData?.length}</div>
      </div>
      
      <div class="stat">
        <div class="stat-title text-sm sm:text-lg font-semibold text-white">Total Assets</div>
        <div class="stat-value text-lg font-semibold text-white">${abbreviateNumber(totalAssets)}</div>
      </div>
      
      <div class="stat">
        <div class="stat-title text-sm sm:text-lg font-semibold text-white">Avg. Cost</div>
        <div class="stat-value text-lg font-semibold text-white">{avgExpenseRatio?.toFixed(2)}%</div>
      </div>
      
    </div>


  
    <!-- Page wrapper -->
    <div class="flex justify-center w-full max-w-5xl m-auto h-full overflow-hidden">

        
  
        <!-- Content area -->
        <div class="relative flex flex-col flex-1 overflow-hidden">


      
          <table class="table rounded-none sm:rounded-md w-full border-bg-[#09090B] m-auto mt-4 ">
              <thead>
                <tr class="border border-slate-800">
                  <th class="text-slate-200 hidden sm:table-cell sm:font-bold text-sm sm:text-[0.95rem]">Symbol</th>
                  <th class="text-slate-200 sm:font-bold text-sm sm:text-[0.95rem]">Fund Name</th>
                  <th class="text-slate-200 sm:font-bold text-end sm:text-start text-sm sm:text-[0.95rem]">Assets</th>
                  <th class="text-slate-200 sm:font-bold text-sm sm:text-[0.95rem] text-end">Expense Ratio</th>
                </tr>
              </thead>
              <tbody>
                {#each rawData as item,index}
                <!-- row -->
                <tr on:click={() => goto("/etf/"+item?.symbol)}  class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#27272A] border-b-[#09090B] shake-ticker cursor-pointer">


                  <td class="hidden sm:table-cell text-blue-400 font-medium  border-b-[#09090B]">
                    {item?.symbol}
                  </td>


                  <td class="text-gray-200 border-b-[#09090B]">
                    <span class="hidden sm:inline-block text-white font-medium">{item?.name?.length > charNumber ? item?.name?.slice(0,charNumber) + "..." : item?.name}</span>
                    <div class="sm:hidden flex flex-row">
                      <div class="flex flex-col">
                        <span class="text-blue-400 font-medium">{item?.symbol}</span>
                        <span class="text-gray-200 text-xs sm:text-md font-medium">{item?.name?.length > charNumber ? item?.name?.slice(0,charNumber) + "..." : item?.name}</span>
                      </div>
                    </div>
                  </td>

                  <td class="text-white font-medium text-end sm:text-start border-b-[#09090B]">
                      {abbreviateNumber(item?.totalAssets, true)}
                  </td>

                  <td class="text-white font-medium text-end border-b-[#09090B]">
                      {item?.expenseRatio}%
                  </td>
                  
                </tr>
                
            
                {/each}
              </tbody>
            </table>

                
    </div>

    

</section>




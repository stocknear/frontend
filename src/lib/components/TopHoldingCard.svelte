<script lang="ts">

import {etfTicker, stockTicker, cryptoTicker, screenWidth} from '$lib/store';
import { goto } from '$app/navigation';
import { abbreviateNumber, formatString } from '$lib/utils';
import defaultLogo from '$lib/images/stocks/logo/default_logo.png';

export let topHoldingList;

let totalAssetPercentage = 0;

async function stockSelector(ticker:string)
    {
    if (ticker?.length !== 0 && !['BTC', 'USD']?.includes(ticker)) {
        window?.scroll({ top: 0, left: 0, behavior: 'smooth' });
        stockTicker.update(value => ticker);
        goto("/stocks/"+ticker+"/")
    }
    else if (ticker === 'BTC') {
      window?.scroll({ top: 0, left: 0, behavior: 'smooth' });
        cryptoTicker.update(value => 'BTCUSD');
        goto("/crypto/BTCUSD")
    }

}

$: {
    if($etfTicker && typeof window !== 'undefined')
    {
        totalAssetPercentage = topHoldingList?.slice(0, 5)?.reduce((acc, current) => acc + current?.weightPercentage, 0)?.toFixed(2);
    }
}

</script>
      
      <!--Start Similar Stocks Card -->
      
      <div class="space-y-3 lg:pt-5 lg:{topHoldingList?.length !== 0 ? '' : 'hidden'}">  
      
      <div class="lg:rounded-2xl shadow-lg bg-[#000] lg:bg-[#202020] lg:border lg:border-slate-800 h-auto {$screenWidth <= 800 ? 'w-screen pt-16' : ''} lg:w-96">
      
        <div class="w-auto lg:w-full p-1 flex-1 flex flex-wrap pb-5">
    
              
          <div class="-mt-10 lg:mt-0 flex flex-row items-center w-full ml-2 pb-2 p-3">
            <span class="hidden lg:block font-bold text-white text-2xl">
                Top Holdings
            </span>
            <span class="text-white font-medium ml-auto text-sm">
                {totalAssetPercentage}% of assets
            </span>
          </div>
          
          {#if topHoldingList?.length !== 0} 
    
          
      
          <div class="flex justify-start items-center w-full m-auto overflow-hidden">
            <table class="table table-sm table-compact mt-3 text-start flex justify-start items-center w-full px-3 m-auto">
              <thead>
                <tr class="border-b border-blue-400">
                  <th class="text-white font-semibold text-sm text-start bg-[#000] lg:bg-[#202020] border-b border-blue-400">Company</th>
                  <th class="text-white font-semibold text-sm text-start bg-[#000] lg:bg-[#202020] border-b border-blue-400">Market Value</th>
                  <th class="text-white font-semibold text-sm text-end bg-[#000] lg:bg-[#202020] border-b border-blue-400">Portfolio</th>
                </tr>
              </thead>
              <tbody>
                {#each topHoldingList?.slice(0,5) as item}
                {#if item?.asset !== null}
                <tr on:click={() => stockSelector(item?.asset)} class="lg:shake-ticker text-white cursor-pointer lg:hover:bg-[#245073] lg:hover:bg-opacity-[0.2] bg-[#000] lg:bg-[#202020] border-b border-[#000] lg:border-[#202020]">
                    <td class="text-gray-200">
                      <div class="flex flex-row items-center">
                        <div class="rounded-full w-10 h-10 relative  flex items-center justify-center">
                          <img style="clip-path: circle(50%);" class="w-6 h-6 rounded-full" src={item?.asset?.length !== 0 ? `https://financialmodelingprep.com/image-stock/${item?.asset}.png` : defaultLogo} loading="lazy"/>
                        </div>
                        <div class="flex flex-col ml-3 w-full">
                          <span class="text-blue-400 text-sm font-medium">{item?.asset ?? '-'}</span>
                          <span class="text-white  text-xs">
                            {#if typeof item?.name !== 'undefined'}
                              {item?.name?.length > 10 ? formatString(item?.name?.slice(0,10)) + "..." : formatString(item?.name)}
                            {:else}
                              n/a
                            {/if}
                          </span>
                        </div>
                      </div>
                    </td>

                
                  <td class="text-white text-center font-medium ">
                    {item?.marketValue !== null ? abbreviateNumber(item?.marketValue, true) : '-'}
                  </td>
                
                  <td class="text-white font-medium text-end">
                    {abbreviateNumber(item?.weightPercentage?.toFixed(2))}%
                  </td>

                </tr>
                {/if}
                {/each}
              </tbody>
            </table>
          </div>

          <label for="topHoldingModal" on:click={() => goto(`/etf/${$etfTicker}/holdings`)} class="rounded-lg cursor-pointer w-11/12 md:w-3/4 lg:w-11/12 py-2 h-full mt-8 lg:mt-6 text-[1rem] text-center font-semibold text-white m-auto hover:bg-purple-700 bg-purple-600 transition duration-100 ease-in">
            View All Holdings
          </label>
    
          {:else}
            <h2 class="mt-20 justify-center items-center text-3xl font-bold text-slate-700 mb-20 m-auto">
              No data available
              <svg class="w-10 lg:w-12 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#334155" d="M18.68 12.32a4.49 4.49 0 0 0-6.36.01a4.49 4.49 0 0 0 0 6.36a4.508 4.508 0 0 0 5.57.63L21 22.39L22.39 21l-3.09-3.11c1.13-1.77.87-4.09-.62-5.57m-1.41 4.95c-.98.98-2.56.97-3.54 0c-.97-.98-.97-2.56.01-3.54c.97-.97 2.55-.97 3.53 0c.97.98.97 2.56 0 3.54M10.9 20.1a6.527 6.527 0 0 1-1.48-2.32C6.27 17.25 4 15.76 4 14v3c0 2.21 3.58 4 8 4c-.4-.26-.77-.56-1.1-.9M4 9v3c0 1.68 2.07 3.12 5 3.7v-.2c0-.93.2-1.85.58-2.69C6.34 12.3 4 10.79 4 9m8-6C7.58 3 4 4.79 4 7c0 2 3 3.68 6.85 4h.05c1.2-1.26 2.86-2 4.6-2c.91 0 1.81.19 2.64.56A3.215 3.215 0 0 0 20 7c0-2.21-3.58-4-8-4Z"/></svg>
            </h2>
            {/if}
      
        
      </div>
      </div>
      </div>
      <!--End Similar Stocks Card -->    
      
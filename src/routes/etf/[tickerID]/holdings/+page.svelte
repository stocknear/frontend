<script lang="ts">
  import { etfTicker, cryptoTicker, numberOfUnreadNotification, displayCompanyName} from '$lib/store';
  import UpgradeToPro from '$lib/components/UpgradeToPro.svelte';

  import InfiniteLoading from '$lib/components/InfiniteLoading.svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { screenWidth } from '$lib/store';
  import { abbreviateNumber, formatString } from '$lib/utils';

  export let data;
  let notDestroyed = true;
  let rawData = data?.getETFHoldings;
  let holdings = rawData?.slice(0,15);



function stockSelector(symbol)
{
  if(symbol?.length !== 0 && !['BTC', 'USD']?.includes(symbol))
  {
    goto("/stocks/"+symbol)
  }
  else if (symbol === 'BTC') {
    cryptoTicker.update(value => 'BTCUSD');
    goto("/crypto/BTCUSD")
  }
  
}
    
async function infiniteHandler({ detail: { loaded, complete } }) 
{

  if (holdings?.length === rawData?.length && notDestroyed) {
      complete();
    } 
    else if (notDestroyed) {
      const nextIndex = holdings?.length;
      const newHoldings = rawData?.slice(nextIndex, nextIndex + 25);
      holdings = [...holdings, ...newHoldings];
      loaded();
    }
}


$: {
  if ($page.url.pathname !== '/etf/'+$etfTicker+"/holdings") {
    notDestroyed = false;
  }
}

let charNumber = 40;

$: {
  if($screenWidth < 640)
  {
    charNumber = 16;
  }
  else {
    charNumber = 40;
  }
}

</script>


<svelte:head>

  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>
    {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} {$displayCompanyName} ({$etfTicker}) Holdings List · stocknear
  </title>
  <meta name="description" content={`Get the Holdings List of ${$displayCompanyName} (${$etfTicker}).`} />
  
  <!-- Other meta tags -->
  <meta property="og:title" content={`${$displayCompanyName} (${$etfTicker}) Holdings List · stocknear`}/>
  <meta property="og:description" content={`Get the Holdings List of ${$displayCompanyName} (${$etfTicker}).`} />
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content={`${$displayCompanyName} (${$etfTicker}) Holdings List · stocknear`}/>
  <meta name="twitter:description" content={`Get the Holdings List of ${$displayCompanyName} (${$etfTicker}).`} />
  <!-- Add more Twitter meta tags as needed -->

</svelte:head>
  
     
                  

          
<section class="bg-[#0F0F0F] overflow-hidden text-white h-full mb-40 sm:mb-0 w-full">
  <div class="flex justify-center m-auto h-full overflow-hidden w-full">
      <div class="relative flex justify-center items-center overflow-hidden w-full">
            <div class="sm:p-7 w-full m-auto mt-2 sm:mt-0">
                  <div class="mb-6">
                      <h2 class="text-2xl sm:text-3xl text-gray-200 font-bold mb-4">
                          ETF Holdings
                      </h2>


                        <div class="text-white p-3 sm:p-5 mb-10 rounded-lg sm:flex sm:flex-row sm:items-center border border-slate-800 text-sm sm:text-[1rem]">
                          <svg class="w-6 h-6 flex-shrink-0 inline-block sm:mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#60a5fa" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
                          
                          {#if rawData?.length !== 0}
                          The {$displayCompanyName} holds {rawData?.length} different assets
                          and the largest one in the portfolio is {formatString(rawData?.at(0)?.name)}, making up {rawData?.at(0)?.weightPercentage?.toFixed(2)}% of the total.
                          {:else}                          
                            No information available for {$displayCompanyName}.
                          {/if}

                        </div>
  

            
                    </div>
      
                    {#if holdings?.length !== 0}

                    <div class="flex justify-start items-center m-auto overflow-x-auto">
                                  
                                  
                      <table class="table table-pin-cols table-sm table-compact rounded-none sm:rounded-md w-full border-bg-[#0F0F0F] m-auto mt-4 overflow-x-auto">
                          <thead>
                            <tr class="">
                              <td class="text-white border-b border-[#0F0F0F] bg-[#0F0F0F] font-semibold text-sm">No.</td>
                              <td class="text-white border-b border-[#0F0F0F] bg-[#0F0F0F] font-semibold text-sm">Symbol</td>
                              <td class="text-white border-b border-[#0F0F0F] bg-[#0F0F0F] font-semibold text-sm hidden sm:table-cell">Name</td>
                              <td class="text-white border-b border-[#0F0F0F] bg-[#0F0F0F] font-semibold text-end text-sm ">Shares</td>
                              <td class="text-white border-b border-[#0F0F0F] bg-[#0F0F0F] font-semibold text-end text-sm">% Weight</td>
                            </tr>
                          </thead>
                          <tbody>
                            {#each (data?.user?.tier === 'Pro' ? holdings : holdings?.slice(0,3)) as item,index}
                        <!-- row -->
                        {#if item?.asset !== null}
                        <tr on:click={() => stockSelector(item?.asset)} class="w-full sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#202020] {index+1 === holdings?.slice(0,3)?.length && data?.user?.tier !== 'Pro' ? 'opacity-[0.1]' : ''} {item?.asset?.length !== 0 ? 'cursor-pointer' : ''}">
                          
                          <td class="text-gray-200 border-b border-[#0F0F0F]">
                            {index+1}
                          </td>

                          <td class="font-normal  border-b border-[#0F0F0F]">
                            <div class="flex flex-col items-start">
                              <span class="text-blue-400">{item?.asset}</span>
                              <span class="sm:hidden text-white">
                                {item?.name?.length > charNumber ? formatString(item?.name?.slice(0,charNumber)) + "..." : formatString(item?.name)}
                              </span>
                            </div>
                          </td>
                          
                          <td class="text-gray-200 border-b border-[#0F0F0F] w-fit hidden sm:table-cell">
                            {item?.name?.length > charNumber ? formatString(item?.name?.slice(0,charNumber)) + "..." : formatString(item?.name)}
                          </td>
            
          
              
                        <td class="text-gray-200 border-b border-[#0F0F0F] text-end ">
                          <span class="text-white font-medium text-md ">
                                  {new Intl.NumberFormat("en", {
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0
                                  }).format(item?.sharesNumber)}
                          </span>
                        </td>
          
            
                        <td class="text-gray-200 border-b border-[#0F0F0F] text-end">
                                  <span class="text-white font-medium text-md ">{item?.weightPercentage?.toFixed(2)}%</span>
                        </td>
            
                    
            
                      </tr>
                        
                     
            
                        {/if}
                        {/each}

                          </tbody>
                      </table>
                      

                  </div>

                  {#if data?.user?.tier === 'Pro'}
                  <InfiniteLoading on:infinite={infiniteHandler} />
                {/if}
                
               <UpgradeToPro data={data} title="Explore all US ETF holdings for diverse investment strategies and informed decision-making."/>

        
        
                {:else} 
                <h2 class="pl-4 pr-4 flex justify-center items-center text-md sm:text-lg text-center text-slate-200">
                  No holdings are available for {$displayCompanyName} 🧐.
                </h2>
              
                {/if}
      
                    
    
                </div>
            </div>
         </div>
    </section>
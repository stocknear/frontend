<script lang='ts'>
import { goto } from '$app/navigation';

import { abbreviateNumber, formatETFName} from '$lib/utils';
import { numberOfUnreadNotification } from '$lib/store';

export let data;
let etfProviderList = data?.getAllETFProviders;


</script>
    

<svelte:head>

  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>
    {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Largest ETF Providers by Assets Under Management · stocknear
  </title>

  <meta name="description" content={`A complete list of all the companies that provide exchange-traded funds (ETFs) that are actively traded on the U.S. stock market.`}>
  <!-- Other meta tags -->
  <meta property="og:title" content={`Largest ETF Providers by Assets Under Management · stocknear`}/>
  <meta property="og:description" content={`A complete list of all the companies that provide exchange-traded funds (ETFs) that are actively traded on the U.S. stock market.`} />
  <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content={`Largest ETF Providers by Assets Under Management · stocknear`}/>
  <meta name="twitter:description" content={`A complete list of all the companies that provide exchange-traded funds (ETFs) that are actively traded on the U.S. stock market.`} />
  <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <!-- Add more Twitter meta tags as needed -->

</svelte:head>
  


    <section class="w-full max-w-4xl overflow-hidden m-auto">
            
          
        <div class="w-full max-w-4xl sm:flex sm:flex-row sm:items-center m-auto text-gray-100 bg-[#202020] sm:rounded-lg h-auto p-5 mb-4">
          <svg class="w-5 h-5 inline-block flex-shrink-0 mr-0.5 sm:mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#a474f6" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
          
          Every Exchange-Traded Fund (ETF) is managed by a specific company. Below is a list of companies offering actively traded ETFs on the U.S. stock market.
          
        </div>
    
        <!-- Page wrapper -->
          <div class="flex justify-center w-full max-w-5xl m-auto h-full overflow-hidden">

              
        
              <!-- Content area -->
              <div class="relative flex flex-col flex-1 overflow-hidden">
      
    
           
                <table class="table rounded-none sm:rounded-md w-full border-bg-[#0F0F0F] m-auto mt-4 ">
                    <thead>
                      <tr class="border border-slate-800">
                        <th class="text-slate-200 font-semibold text-[0.95rem]">Provider Name</th>
                        <th class="text-slate-200 font-semibold text-center text-[0.95rem]">Total Assets</th>
                        <th class="text-slate-200 font-semibold text-[0.95rem] text-end">Funds</th>
                        <th class="text-slate-200 font-semibold hidden sm:table-cell text-[0.95rem] text-end">Avg. Cost</th>
                        <th class="text-slate-200 font-semibold hidden sm:table-cell text-[0.95rem] text-end">Avg. Holdings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each etfProviderList as item,index}
                      <!-- row -->
                      <tr on:click={() => goto("/etf/etf-providers/"+item?.etfProvider)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#202020] border-b-[#0F0F0F] shake-ticker cursor-pointer">
                        

                        <td class="text-blue-400 font-medium border-b-[#0F0F0F]">
                            {formatETFName(item?.etfProvider)}
                        </td>
    
                        <td class="text-white font-medium  border-b-[#0F0F0F] text-end sm:text-center">
                            {abbreviateNumber(item?.totalAssets, true)}
                        </td>
      
                        <td class="text-white font-medium text-end border-b-[#0F0F0F]">
                            {item?.funds}
                        </td>
                
      
                        <td class="text-white font-medium text-end hidden sm:table-cell border-b-[#0F0F0F]">
                            {item?.avgExpenseRatio}%
                        </td>

                        <td class="text-white font-medium text-end hidden sm:table-cell border-b-[#0F0F0F]">
                            {item?.avgHoldings}
                        </td>
      
                   
        
        
                      </tr>
                      
                  
                      {/each}
                    </tbody>
                  </table>
    
                  

          </div>


          </div>
          

          
  </section>
      
      
      
      
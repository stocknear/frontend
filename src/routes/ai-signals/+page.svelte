<script lang='ts'>
  import { goto } from '$app/navigation';
  import { screenWidth, numberOfUnreadNotification } from '$lib/store';
  import { abbreviateNumber} from '$lib/utils';
  import ScrollToTop from '$lib/components/ScrollToTop.svelte';
  import logo from '$lib/images/signal_logo.png';
  
  export let data;
  
  let signalList = data?.getAISignals;
  
  
  let charNumber = 20;
  
  $: {
    if ($screenWidth < 640)
    {
      charNumber = 10;
    }
    else {
      charNumber = 20;
    }
  }
  
  </script>
     
    
  <!-- HEADER FOR BETTER SEO -->
  <svelte:head>
    <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Top AI Signals · stocknear</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
  
    <meta name="description" content="Top AI Signals for the US Stock Market with the best win rate.">
    <!-- Other meta tags -->
    <meta property="og:title" content="Top AI Signals · stocknear"/>
    <meta property="og:description" content="Top AI Signals for the US Stock Market with the best win rate.">
    <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
    <meta property="og:type" content="website"/>
    <!-- Add more Open Graph meta tags as needed -->
  
    <!-- Twitter specific meta tags -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="Top AI Signals · stocknear"/>
    <meta name="twitter:description" content="Top AI Signals for the US Stock Market with the best win rate.">
    <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
    <!-- Add more Twitter meta tags as needed -->
  </svelte:head>
      
    
  <section class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-4 pb-40">
    <!--   
    <div class="text-sm breadcrumbs ml-4">
      <ul>
        <li><a href="/" class="text-gray-300">Home</a></li> 
        <li class="text-gray-300">Top AI Signals</li>
      </ul>
    </div>
    -->
    
    <div class="w-full max-w-4xl m-auto sm:bg-[#202020] sm:rounded-xl h-auto pl-10 pr-10 pt-5 sm:pb-10 sm:pt-10 mt-3 mb-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
    
        <!-- Start Column -->
        <div>
          <div class="flex flex-row justify-center items-center">
            <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
              Top AI Signals
            </h1>
          </div>
  
          <span class="hidden sm:block text-white text-md font-medium text-center flex justify-center items-center ">
            Get the latest best AI Signals with the highest Win Rate
          </span>
  
  
        </div>
        <!-- End Column -->
    
        <!-- Start Column -->
        <div class="hidden sm:block relative m-auto mb-5 mt-5 sm:mb-0 sm:mt-0">
          <svg class="w-40 -my-10" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="5" result="glow"/>
                <feMerge>
                  <feMergeNode in="glow"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <path fill="#1E40AF" d="M57.6,-58.7C72.7,-42.6,81.5,-21.3,82,0.5C82.5,22.3,74.7,44.6,59.7,60.1C44.6,75.6,22.3,84.3,0,84.3C-22.3,84.2,-44.6,75.5,-61.1,60.1C-77.6,44.6,-88.3,22.3,-87.6,0.7C-86.9,-20.8,-74.7,-41.6,-58.2,-57.7C-41.6,-73.8,-20.8,-85.2,0.2,-85.4C21.3,-85.6,42.6,-74.7,57.6,-58.7Z" transform="translate(100 100)" filter="url(#glow)" />
          </svg>
          
  
          <div class="z-1 absolute -top-7 right-11">
            <img class="w-20" src={logo} alt="logo" loading="lazy">
          </div>
        </div>
        <!-- End Column -->
      </div>
  
     
    </div>
    
      <!-- Page wrapper -->
      <div class="flex justify-center w-full max-w-5xl m-auto h-full overflow-hidden">
  
          
    
          <!-- Content area -->
          <div class="relative flex flex-col flex-1 overflow-hidden">
  
  
            <span class="italic text-sm text-gray-200 sm:ml-3 text-center sm:text-start pt-5 pb-5">
              AI Algorithm was trained & backtested on the time period between {new Date("2015-01-01").toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })} 
              - 
              {new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}.
            </span>
                
       
            <table class="hidden sm:inline-table table-sm table-compact rounded-none sm:rounded-md w-full border-bg-[#0F0F0F] m-auto mt-4 ">
                <thead>
                  <tr>
                    <th class="text-slate-200 font-bold text-[0.95rem] text-start">Company</th>
                    <th class="text-slate-200 font-bold text-[0.95rem] text-start">Win Rate</th>
                    <th class="text-slate-200 font-bold hidden sm:table-cell text-[0.95rem] text-start">Return</th>
                    <th class="text-slate-200 font-bold hidden sm:table-cell text-center text-[0.95rem]">Max. Drawdown</th>
                    <th class="text-slate-200 font-bold text-[0.95rem] text-end">New Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {#each signalList as item,index}
                  <!-- row -->
                  <tr on:click={() => goto("/stocks/"+item?.symbol)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] {index % 2 === 0 ? 'bg-opacity-[0.25] bg-[#323239]' : 'bg-[#0F0F0F]'} border-b-[#0F0F0F] cursor-pointer">
                  
  
                    <td class="text-white border-b-[#0F0F0F]">
                      <div class="flex flex-row items-start">
                        <!--
                        <div class="rounded-full w-10 h-10 relative bg-[#202020] flex items-center justify-center">
                          <img style="clip-path: circle(50%);" class="w-6 h-6" src={`https://financialmodelingprep.com/image-stock/${item.symbol}.png`} loading="lazy"/>
                        </div>
                        -->
                        <span class="text-[0.95rem]">{index+1}.</span>
                        <div class="flex flex-col ml-3">
                          <span class="text-white font-bold">{item?.symbol}</span>
                          <span class="text-white text-opacity-30 text-xs sm:text-sm">{item?.name?.length > charNumber ? item?.name?.slice(0,charNumber) + "..." : item?.name}</span>
                        </div>
                      </div>
                    </td>
  
                  <td class="text-white font-medium border-b-[#0F0F0F]">
                    <div class="flex flex-row items-center">
                    {#if item?.winRate >= 0}
                    <svg class="w-5 h-5 -mr-0.5 -mb-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                    <span class="text-[#10DB06] text-[0.95rem]">
                      +{item?.winRate?.toFixed(2)}%
                    </span>
                    {:else if item?.winRate < 0}
                    <svg class="w-5 h-5 -mr-0.5  rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                    <span class="text-[#FF2F1F] text-[0.95rem]">
                      {item?.winRate?.toFixed(2)}%
                    </span>
                    {:else}
                    <span class="text-gray-300 text-sm m-auto ">n/a</span>
                    {/if}
                    </div>
                  </td>
  
                  <td class="text-white font-medium hidden sm:table-cell border-b-[#0F0F0F]">
                      {abbreviateNumber(item?.return)}%
                  </td>
  
                  <td class="text-white font-medium text-center hidden sm:table-cell border-b-[#0F0F0F]">
                    {#if item?.maxDrawdown >= 0}
                      <svg class="w-2.5 h-2.5 hidden sm:inline-block mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path fill="#10DB06" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z"/></g></svg>
                      <span class="text-[#10DB06] text-[0.95rem]">+{item?.maxDrawdown?.toFixed(2)} %</span>
                      {:else if item?.maxDrawdown < 0}
                      <svg class="w-5 h-5 -mr-0.5 rotate-180 hidden sm:inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                      <span class="text-[#FF2F1F] text-[0.95rem]">{item?.maxDrawdown?.toFixed(2)} %</span>
                      {:else}
                      <span class="text-gray-300 text-[0.95rem] m-auto pr-2">n/a</span>
                      {/if}
                  </td>
  
                  <td class="text-white text-sm text-end mr-1 border-b-[#0F0F0F]">
                    {#if item?.nextSignal === 'Buy'}
                    <span class="text-[#10DB06] text-[1rem]">
                      <svg class="w-6 h-6 sm:w-7 sm:h-7 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="#10db06" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"><path d="m3 17l6-6l4 4l8-8"/><path d="M17 7h4v4"/></g></svg>
                      {item?.nextSignal}
                    </span>
  
                    {:else if item?.nextSignal === 'Hold'}
                    <span class="text-[#E57C34] text-[1rem]">
                      <svg class="w-6 h-6 sm:w-7 sm:h-7 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#e57c34" d="m22 12l-4-4v3H3v2h15v3l4-4Z"/></svg>
                      {item?.nextSignal}.
                    </span>
                    {:else}
                    <span class="text-[#FF2F1F] text-[1rem]">
                      <svg class="w-6 h-6 sm:w-7 sm:h-7 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#ff2f1f" d="M244 136v64a12 12 0 0 1-12 12h-64a12 12 0 0 1 0-24h35l-67-67l-31.51 31.52a12 12 0 0 1-17 0l-72-72a12 12 0 0 1 17-17L96 127l31.51-31.52a12 12 0 0 1 17 0L220 171v-35a12 12 0 0 1 24 0Z"/></svg>
                      {item?.nextSignal}.
                    </span>
                    {/if}
                  </td>
    
    
                  </tr>
                  
              
                  {/each}
                </tbody>
              </table>
  
  
              <div class="relative p-2 sm:hidden">
                {#each signalList as item}
                  <div class="bg-[#202020] rounded-lg border border-slate-800  h-64 pl-2 pr-2 pt-4 mb-7">
                      <div class="flex flex-row items-center">
                        <div class="rounded-full w-10 h-10 relative bg-[#101112] flex items-center justify-center">
                          <img style="clip-path: circle(50%);" class="w-6 h-6" src={`https://financialmodelingprep.com/image-stock/${item.symbol}.png`} loading="lazy"/>
                        </div>
                        <label on:click={() => goto("/stocks/"+item?.symbol)} class="cursor-pointer flex flex-col ml-3 w-40">
                          <span class="font-medium text-blue-400">{item?.symbol}</span>
                          <span class="text-slate-300 text-xs">{item?.name}</span>
                        </label>
  
                        <div class="flex flex-col justify-end items-end ml-auto">
                          <span class="font-medium text-slate-300 text-ends">Win Rate</span>
                          <span class="text-white text-opacity-[0.8] text-sm text-end">
                            {#if item?.winRate >= 0}
                              <svg class="w-5 h-5 -mr-1 -mt-0.5 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                              <span class="text-[#10DB06] text-[0.95rem]">
                                +{item?.winRate?.toFixed(2)}%
                              </span>
                              {:else if item?.winRate < 0}
                              <svg class="w-5 h-5 -mr-0.5 inline-block rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                              <span class="text-[#FF2F1F] text-[0.95rem]">
                                {item?.winRate?.toFixed(2)}%
                              </span>
                              {:else}
                              <span class="text-gray-300 text-sm m-auto pr-2">n/a</span>
                            {/if}
                          </span>
                        </div>
                      </div>
                      <div class="border-1 border-b border-slate-800 w-full mt-5 mb-5" />
  
                      <div class="flex flex-row items-center">
                        <div class="flex flex-col ml-3 w-40">
                          <span class="font-medium text-slate-300">Market Cap</span>
                          <span class="text-slate-300 text-sm">
                            {item?.marketCap !== null ? abbreviateNumber(item?.marketCap,true) : '-'}
                          </span>
                        </div>
  
                        <div class="flex flex-col justify-end items-end ml-auto">
                          <span class="font-medium text-slate-300 text-ends">Return</span>
                          <span class="text-white text-opacity-[0.8] text-sm text-end">
                            {#if item?.return >= 0}
                              <svg class="w-5 h-5 -mr-1 -mt-0.5 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                              <span class="text-[#10DB06] text-[0.95rem]">
                                +{item?.return?.toFixed(2)}%
                              </span>
                              {:else if item?.return < 0}
                              <svg class="w-5 h-5 -mr-0.5 inline-block rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                              <span class="text-[#FF2F1F] text-[0.95rem]">
                                {item?.return?.toFixed(2)}%
                              </span>
                              {:else}
                              <span class="text-gray-300 text-sm m-auto ">n/a</span>
                            {/if}
                          </span>
                        </div>
                      </div>
  
                      <div class="border-1 border-b border-slate-800 w-full mt-5 mb-5" />
  
  
                      <div class="flex flex-row items-center">
                        <div class="flex flex-col ml-3 w-40">
                          <span class="font-medium text-slate-300">Max. Drawdown</span>
                          <span class="text-slate-300 text-sm">
                            {#if item?.maxDrawdown >= 0}
                              <svg class="w-5 h-5 -mt-0.5 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                              <span class="text-[#10DB06] text-[0.95rem]">
                                +{item?.maxDrawdown?.toFixed(2)}%
                              </span>
                              {:else if item?.maxDrawdown < 0}
                              <svg class="w-5 h-5 inline-block rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                              <span class="text-[#FF2F1F] text-[0.95rem]">
                                {item?.maxDrawdown?.toFixed(2)}%
                              </span>
                              {:else}
                              <span class="text-gray-300 text-sm m-auto ">n/a</span>
                            {/if}
                          </span>
                        </div>
  
                        <div class="flex flex-col justify-end items-end ml-auto">
                          <span class="font-medium text-slate-300 text-ends">New Signal</span>
                          <span class="text-white text-sm text-end">
                            {#if item?.nextSignal === 'Buy'}
                              <span class="text-[#10DB06] font-medium text-[1rem]">
                                <svg class="w-6 h-6 sm:w-7 sm:h-7 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="#10db06" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"><path d="m3 17l6-6l4 4l8-8"/><path d="M17 7h4v4"/></g></svg>
                                {item?.nextSignal}
                              </span>
            
                              {:else if item?.nextSignal === 'Hold'}
                              <span class="text-[#E57C34] font-medium text-[1rem]">
                                <svg class="w-6 h-6 sm:w-7 sm:h-7 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#e57c34" d="m22 12l-4-4v3H3v2h15v3l4-4Z"/></svg>
                                {item?.nextSignal}.
                              </span>
                              {:else}
                              <span class="text-[#FF2F1F] font-medium text-[1rem]">
                                <svg class="w-6 h-6 sm:w-7 sm:h-7 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#ff2f1f" d="M244 136v64a12 12 0 0 1-12 12h-64a12 12 0 0 1 0-24h35l-67-67l-31.51 31.52a12 12 0 0 1-17 0l-72-72a12 12 0 0 1 17-17L96 127l31.51-31.52a12 12 0 0 1 17 0L220 171v-35a12 12 0 0 1 24 0Z"/></svg>
                                {item?.nextSignal}.
                              </span>
                            {/if}
                          </span>
                        </div>
                      </div>    
                    </div>
                  {/each}

                  <ScrollToTop />

                </div>

            
      </div>
  
  
      
  
  </section>
  
  
  
  
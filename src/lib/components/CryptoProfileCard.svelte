<script lang="ts">
    import {cryptoTicker, screenWidth, displayCompanyName} from '$lib/store';
    
    import { abbreviateNumber} from '$lib/utils';
    import { fade } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import defaultImage from '$lib/images/etf/cover/default.jpg';
    
    export let cryptoProfile;
  
    let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL; // Set a default API URL


    let info;
    let imageUrl;
    let marketCap = '-';
    let totalVolume = '-';
    let circulatingSupply = '-';
    let maxSupply = '-';
    let description = '';
    let snippet;
    let website;
    let athPrice;
    let athDate;
  

    let showFullText = false;
  
  

  $: {
    if ($cryptoTicker  && typeof $cryptoTicker !== 'undefined' && typeof window !== 'undefined' && typeof cryptoProfile !== 'undefined' && Object?.keys(cryptoProfile)?.length !== 0)
    {
    
      marketCap = cryptoProfile?.market_cap;
      totalVolume = cryptoProfile?.total_volume;
      description = cryptoProfile?.description ?? 'A detailed description of the company is not yet available.';
      snippet= description?.slice(0, 150) + "...";
      circulatingSupply = cryptoProfile?.circulating_supply
      maxSupply = cryptoProfile?.max_supply
      website = cryptoProfile?.website;
      athPrice = cryptoProfile?.ath;
      athDate = cryptoProfile?.ath_date
  
    }
  }
  </script>
  
  <div class="sm:space-y-3">  
    <div class="lg:rounded-lg shadow-lg sm:border sm:border-slate-800 bg-[#000] lg:bg-[#09090B] h-auto h-auto w-screen pt-16 sm:w-full md:w-[420px] xl:w-[450px] lg:pt-0">

         <!--Start Header-->
        <div class="sm:rounded-t-lg w-full h-[130px] bg-[#000] p-3 flex flex-col bg-cover bg-center bg-no-repeat" style="background-image: url({`${cloudFrontUrl}/stocks/cover/${$cryptoTicker?.toUpperCase()}.jpg`});">

            <div class="flex flex-row pt-1 pb-2">
              </div>
              <!--
              <div class="flex flex-row justify-end items-center mt-2 relative z-10 -my-5">
                <div style={`background-image: url(${sTier}`} class="animate-bounce circle-background mr-5 w-20 h-20 z-10">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-28 h-28" viewBox="0 0 106 34">
                      <g class="sparkles">
                          <path style="--duration: 4s;" d="M2.5740361 5.33344622s1.1875777-6.20179466 2.24320232 0c0 0 5.9378885 1.05562462 0 2.11124925 0 0-1.05562463 6.33374774-2.24320233 0-3.5627331-.6597654-3.29882695-1.31953078 0-2.11124925z" />
                          <path style="--duration: 3.2s;" d="M33.5173993 29.97263826s1.03464615-5.40315215 1.95433162 0c0 0 5.17323078.91968547 0 1.83937095 0 0-.91968547 5.51811283-1.95433162 0-3.10393847-.57480342-2.8740171-1.14960684 0-1.83937095z" />
                          <path style="--duration: 2.5s;" d="M69.03038108 1.71240809s.73779281-3.852918 1.39360864 0c0 0 3.68896404.65581583 0 1.31163166 0 0-.65581583 3.93489497-1.39360864 0-2.21337842-.4098849-2.04942447-.81976979 0-1.31163166z" />
                      </g>
                      </svg>
                      <div class="tier-text italic m-auto text-xl">
                      <span class="text-4xl" style="color: #FFFFFF}">
                        {tierList ?? 'n/a'}  
                      </span>
                      </div>
                  </div>

                </div>
              -->
        </div>
       <!--End Header-->

        <!--Start Content-->
        <div class="w-full flex flex-wrap border-t border-slate-800">
          <h2 class="text-start ml-4 text-2xl font-bold text-white pb-2 mt-3">Crypto Info</h2>
          <div class="flex items-center w-full">
            <table class="table table-md table-compact">
              <tbody>
                <!-- row 1 -->
                <tr class="text-white border-b border-[#27272A]" style="font-size: 0.8rem">
                  <td class="text-start lg:border-b lg:border-[#27272A] bg-[#000] lg:bg-[#09090B] text-white font-medium">Name</td>
                  <td class="bg-[#000] lg:border-b lg:border-[#27272A] lg:bg-[#09090B]">{$displayCompanyName?.length > 30 ? $displayCompanyName?.slice(0,30) + '...' : $displayCompanyName}</td>
                  <td class="text-start lg:border-b lg:border-[#27272A] bg-[#000] lg:bg-[#09090B] text-white font-medium">Ticker</td>
                  <td class="bg-[#000] lg:border-b lg:border-[#27272A] lg:bg-[#09090B]">{$cryptoTicker}</td>
                </tr>
                <!-- row 2 -->
                <tr class="text-white border-b border-[#27272A]" style="font-size: 0.8rem">
                  <td class="text-start lg:border-b lg:border-[#27272A] bg-[#000] lg:bg-[#09090B] text-white font-medium">Mkt Cap</td>
                  <td class="bg-[#000] lg:border-b lg:border-[#27272A] lg:bg-[#09090B] whitespace-normal">{abbreviateNumber(marketCap,true)}</td>
                  <td class="text-start lg:border-b lg:border-[#27272A] bg-[#000] lg:bg-[#09090B] text-white font-medium">Total Volume</td>
                  <td class="bg-[#000] lg:border-b lg:border-[#27272A] lg:bg-[#09090B] whitespace-normal">{abbreviateNumber(totalVolume)}</td>
                </tr>
                 <!-- row 2 -->
                 <tr class="text-white border-b border-[#27272A]" style="font-size: 0.8rem">
                    <td class="text-start lg:border-b lg:border-[#27272A] bg-[#000] lg:bg-[#09090B] text-white font-medium">Circulating Supply</td>
                    <td class="bg-[#000] lg:border-b lg:border-[#27272A] lg:bg-[#09090B] whitespace-normal">{abbreviateNumber(circulatingSupply)}</td>
                    <td class="text-start lg:border-b lg:border-[#27272A] bg-[#000] lg:bg-[#09090B] text-white font-medium">Max Supply</td>
                    <td class="bg-[#000] lg:border-b lg:border-[#27272A] lg:bg-[#09090B] whitespace-normal">{maxSupply !== null ? abbreviateNumber(maxSupply) : 'Uncapped'}</td>
                  </tr>
                <!-- row 2 -->
                 <tr class="text-white border-b border-[#27272A]" style="font-size: 0.8rem">
                    <td class="text-start lg:border-b lg:border-[#27272A] bg-[#000] lg:bg-[#09090B] text-white font-medium">ATH Price</td>
                    <td class="bg-[#000] lg:border-b lg:border-[#27272A] lg:bg-[#09090B] whitespace-normal">${new Intl.NumberFormat("en", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }).format(athPrice)}</td>
                    <td class="text-start lg:border-b lg:border-[#27272A] bg-[#000] lg:bg-[#09090B] text-white font-medium">ATH Date</td>
                    <td class="bg-[#000] lg:border-b lg:border-[#27272A] lg:bg-[#09090B] whitespace-normal">{new Date(athDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}</td>
                  </tr>
              </tbody>
            </table>
          </div>
  
          <h2 class="text-start ml-2 text-xl font-bold text-white pb-2 pt-6 lg:pt-3">
            Description
          </h2>
  
  
          <p class="text-gray-100 ml-2 text-sm whitespace-normal">
            {#if showFullText}
            <div transition:fade={{ delay: 0, duration: 80 }} in={showFullText}>
              {description}
            </div>
            {:else if $screenWidth <= 800}
              {description}
            {:else}
            {snippet}
            {/if}
          </p>
        {#if description.length !== 0 }
          <div class="flex flex-row w-full items-center mt-4 pb-2 mb-2">
            <label on:click={() => showFullText = !showFullText} class="hidden lg:block ml-3 w-full text-md mt-1 cursor-pointer font-medium text-white sm:hover:text-blue-400 sm:hover:underline">
              {#if showFullText}
              Show less 
              {:else}
              Show more
              {/if}
            </label>
  
          <div class="flex justify-end w-full relative bottom-0 right-0 mr-3">
            <a target ="_blank" href={website} class="inline-flex text-sm font-medium text-white sm:hover:text-blue-400 sm:hover:underline">
              Go to website
              <svg class="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path></svg>
            </a>
          </div>
  
        </div>
  
          {/if}
  
          
  
  
      </div>
  </div>
  </div>
  
  
  
  
  
  
  
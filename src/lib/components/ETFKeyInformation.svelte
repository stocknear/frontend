<script lang="ts">

  import ETFProfileCard from '$lib/components/ETFProfileCard.svelte';
  import SimilarETFCard from '$lib/components/SimilarETFCard.svelte';
  import TopHoldingCard from '$lib/components/TopHoldingCard.svelte';
  import { similarTickerClicked } from '$lib/store';
	import DividendCard from './DividendCard.svelte';

  export let etfProfile;
  export let data;
  export let similarTicker;
  export let topHoldingList;
  export let dividendList;
  
  

  $: {
    if($similarTickerClicked)
    {
        const closePopup = document.getElementById("similarTickerModal");

        closePopup?.dispatchEvent(new MouseEvent('click'))
        $similarTickerClicked = false;
    }
}
  
  

    
    </script>
    
    
    <section class="mt-4">


      <div class="grid grid-cols-3 gap-x-4 gap-y-2">
        <label for="tickerModal" class="w-auto border border-gray-300 flex px-4 py-2 mb-2 justify-center items-center text-xs font-medium rounded-xl text-gray-200">
          Details
        </label>
        
        <label for="topHoldingModal" class="w-auto border border-gray-300 flex px-4 py-2 mb-2 justify-center items-center text-xs font-medium rounded-xl text-gray-200">
          Holdings
        </label>
        
        <label for="dividendModal" class="w-auto border border-gray-300 flex px-4 py-2 mb-2 justify-center items-center text-xs font-medium rounded-xl text-gray-200">
          Dividends
        </label>
        <label for="similarTickerModal" class="w-auto border border-gray-300 flex px-4 py-2 mb-2 justify-center items-center text-xs font-medium rounded-xl text-gray-200">
          Similar
        </label>
    
      </div>


    </section>


    
    
<!--Start ETF Modal-->
<div class="drawer drawer-end z-40 overflow-hidden w-screen">
  <input id="tickerModal" type="checkbox" class="drawer-toggle"/>
  <div class="drawer-side overflow-hidden">
  
      
    <div class="bg-[#000] min-h-screen w-screen pb-20 overflow-hidden">

        <label for="tickerModal" class="absolute left-6 top-6">
          <svg class="w-6 h-6 inline-block mb-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M9.125 21.1L.7 12.7q-.15-.15-.213-.325T.425 12q0-.2.063-.375T.7 11.3l8.425-8.425q.35-.35.875-.35t.9.375q.375.375.375.875t-.375.875L3.55 12l7.35 7.35q.35.35.35.863t-.375.887q-.375.375-.875.375t-.875-.375Z"/></svg>
        </label>

  
  <div class="w-screen overflow-y-scroll" >

    <ETFProfileCard etfProfile = {etfProfile}/>

        
  </div>

</div>
</div>
</div>
  <!--End ETF Modal-->


  <!--Start Similar Modal-->
<div class="drawer drawer-end z-40 overflow-hidden w-screen">
  <input id="similarTickerModal" type="checkbox" class="drawer-toggle"/>
  <div class="drawer-side overflow-hidden">
  
      
    <div class="bg-[#000] min-h-screen w-screen pb-20 overflow-hidden">

        <label for="similarTickerModal" class="absolute left-6 top-6">
          <svg class="w-6 h-6 inline-block mb-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M9.125 21.1L.7 12.7q-.15-.15-.213-.325T.425 12q0-.2.063-.375T.7 11.3l8.425-8.425q.35-.35.875-.35t.9.375q.375.375.375.875t-.375.875L3.55 12l7.35 7.35q.35.35.35.863t-.375.887q-.375.375-.875.375t-.875-.375Z"/></svg>
        </label>

  
      <div class="w-screen overflow-y-scroll" >
        <SimilarETFCard similarTicker={similarTicker}/>
      </div>

    </div>
  </div>
</div>
<!--End Similar Modal-->


  <!--Start Top Holding Modal-->
  <div class="drawer drawer-end z-40 overflow-hidden w-screen">
    <input id="topHoldingModal" type="checkbox" class="drawer-toggle"/>
    <div class="drawer-side overflow-hidden">
    
        
      <div class="bg-[#000] min-h-screen w-screen pb-20 overflow-hidden">
  
          <label for="topHoldingModal" class="absolute left-6 top-6">
            <svg class="w-6 h-6 inline-block mb-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M9.125 21.1L.7 12.7q-.15-.15-.213-.325T.425 12q0-.2.063-.375T.7 11.3l8.425-8.425q.35-.35.875-.35t.9.375q.375.375.375.875t-.375.875L3.55 12l7.35 7.35q.35.35.35.863t-.375.887q-.375.375-.875.375t-.875-.375Z"/></svg>
          </label>

            <!--Start Header-->
              <div class="bg-[#09090B] w-full p-1 flex flex-col items-center pb-5 h-auto rounded-b-[30px]">
                <h2 class="text-center m-auto text-[1.1rem] font-medium text-white mt-5">
                  Top Holdings
                </h2>
                <div class="flex flex-col items-center mt-8 w-full">
                  <span class="text-white text-center text-md text-opacity-[0.8] pl-8 pr-8">
                    Discover the primary holdings within the ETF's composition.
                  </span>

                  <div class="flex flex-row justify-center items-center w-full mt-5">
                  </div>

                </div>

              </div>
              <!--End Header-->
  
    
    <div class="w-screen overflow-y-scroll" >
  
      <TopHoldingCard topHoldingList = {topHoldingList}/>
  
          
    </div>
  
  </div>
  </div>
  </div>
    <!--End Top Holding Modal-->


<!--Start Dividend Modal-->
  <div class="drawer drawer-end z-40 overflow-hidden w-screen">
    <input id="dividendModal" type="checkbox" class="drawer-toggle"/>
    <div class="drawer-side overflow-hidden">
    
        
      <div class="bg-[#000] min-h-screen w-screen pb-20 overflow-hidden">
  
          <label for="dividendModal" class="absolute left-6 top-6">
            <svg class="w-6 h-6 inline-block mb-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M9.125 21.1L.7 12.7q-.15-.15-.213-.325T.425 12q0-.2.063-.375T.7 11.3l8.425-8.425q.35-.35.875-.35t.9.375q.375.375.375.875t-.375.875L3.55 12l7.35 7.35q.35.35.35.863t-.375.887q-.375.375-.875.375t-.875-.375Z"/></svg>
          </label>
  
    
    <div class="w-screen overflow-y-scroll" >
  
      <DividendCard dividendList = {dividendList}/>
  
          
    </div>
  
  </div>
  </div>
  </div>
    <!--End Dividend Modal-->
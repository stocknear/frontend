<script lang="ts">

  import TickerInfoCard from '$lib/components/TickerInfoCard.svelte';
  import ExecutiveCard from '$lib/components/ExecutiveCard.svelte';

  import SimilarTickerCard from '$lib/components/SimilarTickerCard.svelte';
  //import ESGCard from '$lib/components/ESGCard.svelte';
  import SECFilingsCard from '$lib/components/SECFilingsCard.svelte';
  import TopETFTickerHolder from '$lib/components/TopETFTickerHolder.svelte';


  import { similarTickerClicked, executiveClicked, secFilingsClicked } from '$lib/store';
  
  //import copilotIcon from '$lib/images/copilot_icon.png';
  
  
  export let data;
  
$: {
  if($similarTickerClicked)
  {
      const closePopup = document.getElementById("similarTickerModal");

      closePopup?.dispatchEvent(new MouseEvent('click'))
      $similarTickerClicked = false;
  }
}

</script>
  


<section class="mt-4 overflow-hidden">

  <div class="grid grid-cols-3 gap-x-4 gap-y-2 overflow-hidden">
    <label for="tickerModal" class="w-auto border border-gray-300 flex px-4 py-2 mb-2 justify-center items-center text-xs font-medium rounded-xl text-gray-200">
      Details
    </label>
    
    <label on:click={() => $executiveClicked = true} for="executiveModal" class="w-auto border border-gray-300 flex px-4 py-2 mb-2 justify-center items-center text-xs font-medium rounded-xl text-gray-200">
      Executives
    </label>
    
    <label on:click={() => $secFilingsClicked = true} for="secFilingModal" class="w-auto border border-gray-300 flex px-4 py-2 mb-2 justify-center items-center text-xs font-medium rounded-xl text-gray-200">
      SEC Filings
    </label>
    <!--
    <label for="esgModal" class="w-auto border border-gray-300 flex px-4 py-2 mb-2 justify-center items-center text-xs font-medium rounded-xl text-gray-200">
      ESG Score
    </label>
    -->
    <label for="similarTickerModal" class="w-auto border border-gray-300 flex px-4 py-2 mb-2 justify-center items-center text-xs font-medium rounded-xl text-gray-200">
      Similar
    </label>
    <label for="topETFTickerHolderModal" class="w-auto border border-gray-300 flex px-4 py-2 mb-2 justify-center items-center text-xs font-medium rounded-xl text-gray-200">
      ETFs Holder
    </label>

  </div>


</section>
  
  


  <!--Start Executive Modal-->
  <div class="drawer drawer-end z-40 overflow-hidden w-screen">
    <input id="secFilingModal" type="checkbox" class="drawer-toggle"/>
    <div class="drawer-side overflow-hidden">
    
        
      <div class="bg-[#000] min-h-screen w-screen pb-20 overflow-hidden">
  
          <label for="secFilingModal" class="absolute left-6 top-6">
            <svg class="w-6 h-6 inline-block mb-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M9.125 21.1L.7 12.7q-.15-.15-.213-.325T.425 12q0-.2.063-.375T.7 11.3l8.425-8.425q.35-.35.875-.35t.9.375q.375.375.375.875t-.375.875L3.55 12l7.35 7.35q.35.35.35.863t-.375.887q-.375.375-.875.375t-.875-.375Z"/></svg>
          </label>
  
    
    <div class="w-screen overflow-y-scroll" >
  
      <SECFilingsCard secFilingsList={data?.getSECFilings}/>
  
          
    </div>

  </div>
  </div>
</div>
<!--End Executive Modal-->



  <!--Start Executive Modal-->
  <div class="drawer drawer-end z-40 overflow-hidden w-screen">
    <input id="executiveModal" type="checkbox" class="drawer-toggle"/>
    <div class="drawer-side overflow-hidden">
    
        
      <div class="bg-[#000] min-h-screen w-screen pb-20 overflow-hidden">
  
          <label for="executiveModal" class="absolute left-6 top-6">
            <svg class="w-6 h-6 inline-block mb-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M9.125 21.1L.7 12.7q-.15-.15-.213-.325T.425 12q0-.2.063-.375T.7 11.3l8.425-8.425q.35-.35.875-.35t.9.375q.375.375.375.875t-.375.875L3.55 12l7.35 7.35q.35.35.35.863t-.375.887q-.375.375-.875.375t-.875-.375Z"/></svg>
          </label>
  
    
    <div class="w-screen overflow-y-scroll" >
  
      <ExecutiveCard />
  
          
    </div>

  </div>
  </div>
</div>
<!--End Executive Modal-->


<!--Start Ticker Modal-->
<div class="drawer drawer-end z-40 overflow-hidden w-screen">
    <input id="tickerModal" type="checkbox" class="drawer-toggle"/>
    <div class="drawer-side overflow-hidden">
    
        
      <div class="bg-[#000] min-h-screen w-screen pb-20 overflow-hidden">
  
          <label for="tickerModal" class="absolute left-6 top-6">
            <svg class="w-6 h-6 inline-block mb-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M9.125 21.1L.7 12.7q-.15-.15-.213-.325T.425 12q0-.2.063-.375T.7 11.3l8.425-8.425q.35-.35.875-.35t.9.375q.375.375.375.875t-.375.875L3.55 12l7.35 7.35q.35.35.35.863t-.375.887q-.375.375-.875.375t-.875-.375Z"/></svg>
          </label>
  
    
    <div class="w-screen overflow-y-scroll" >
  
      <TickerInfoCard data={data} stockDeck={data?.getStockDeck}/>
  
          
    </div>

  </div>
  </div>
</div>
<!--End Ticker Modal-->
  
  

  

<!--Start ESG Modal-->
<!--
<div class="drawer drawer-end z-40 overflow-hidden w-screen">
  <input id="esgModal" type="checkbox" class="drawer-toggle"/>
  <div class="drawer-side overflow-hidden">
  
      
    <div class="bg-[#000] min-h-screen w-screen pb-20 overflow-hidden">

        <label for="esgModal" class="absolute left-6 top-6">
          <svg class="w-6 h-6 inline-block mb-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M9.125 21.1L.7 12.7q-.15-.15-.213-.325T.425 12q0-.2.063-.375T.7 11.3l8.425-8.425q.35-.35.875-.35t.9.375q.375.375.375.875t-.375.875L3.55 12l7.35 7.35q.35.35.35.863t-.375.887q-.375.375-.875.375t-.875-.375Z"/></svg>
        </label>

  
      <div class="w-screen overflow-y-scroll" >
        <ESGCard stockDeck={data?.getStockDeck}/>
      </div>

    </div>
  </div>
</div>
-->
<!--End ESG Modal-->

  
  
<!--Start Similar Modal-->
<div class="drawer drawer-end z-40 overflow-hidden w-screen">
  <input id="similarTickerModal" type="checkbox" class="drawer-toggle"/>
  <div class="drawer-side overflow-hidden">
  
      
    <div class="bg-[#000] min-h-screen w-screen pb-20 overflow-hidden">

        <label for="similarTickerModal" class="absolute left-6 top-6">
          <svg class="w-6 h-6 inline-block mb-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M9.125 21.1L.7 12.7q-.15-.15-.213-.325T.425 12q0-.2.063-.375T.7 11.3l8.425-8.425q.35-.35.875-.35t.9.375q.375.375.375.875t-.375.875L3.55 12l7.35 7.35q.35.35.35.863t-.375.887q-.375.375-.875.375t-.875-.375Z"/></svg>
        </label>

  
      <div class="w-screen overflow-y-scroll" >
        <SimilarTickerCard similarstock={data?.getSimilarStock}/>
      </div>

    </div>
  </div>
</div>
<!--End Similar Modal-->


<!--Start Similar Modal-->
<div class="drawer drawer-end z-40 overflow-hidden w-screen">
  <input id="topETFTickerHolderModal" type="checkbox" class="drawer-toggle"/>
  <div class="drawer-side overflow-hidden">
  
      
    <div class="bg-[#000] min-h-screen w-screen pb-20 overflow-hidden">

        <label for="topETFTickerHolderModal" class="absolute left-6 top-6">
          <svg class="w-6 h-6 inline-block mb-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M9.125 21.1L.7 12.7q-.15-.15-.213-.325T.425 12q0-.2.063-.375T.7 11.3l8.425-8.425q.35-.35.875-.35t.9.375q.375.375.375.875t-.375.875L3.55 12l7.35 7.35q.35.35.35.863t-.375.887q-.375.375-.875.375t-.875-.375Z"/></svg>
        </label>

  
      <div class="w-screen overflow-y-scroll" >
        <TopETFTickerHolder topETFHolder={data?.getTopETFHolder}/>
      </div>

    </div>
  </div>
</div>
<!--End Similar Modal-->

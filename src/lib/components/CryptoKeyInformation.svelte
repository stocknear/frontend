<script lang="ts">

import CryptoProfileCard from '$lib/components/CryptoProfileCard.svelte';

export let cryptoProfile;

</script>
      
      
      <section class="mt-4">
  
  
        <div class="grid grid-cols-3 gap-x-4 gap-y-2">
          <label for="tickerModal" class="w-auto border border-gray-300 flex px-4 py-2 mb-2 justify-center items-center text-xs font-medium rounded-xl text-gray-200">
            Details
          </label>
      
        </div>
  
  
      </section>
  
  
      
      
  <!--Start Crypto Modal-->
  <div class="drawer drawer-end z-40 overflow-hidden w-screen">
    <input id="tickerModal" type="checkbox" class="drawer-toggle"/>
    <div class="drawer-side overflow-hidden">
    
        
      <div class="bg-[#000] min-h-screen w-screen pb-20 overflow-hidden">
  
          <label for="tickerModal" class="absolute left-6 top-6">
            <svg class="w-6 h-6 inline-block mb-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M9.125 21.1L.7 12.7q-.15-.15-.213-.325T.425 12q0-.2.063-.375T.7 11.3l8.425-8.425q.35-.35.875-.35t.9.375q.375.375.375.875t-.375.875L3.55 12l7.35 7.35q.35.35.35.863t-.375.887q-.375.375-.875.375t-.875-.375Z"/></svg>
          </label>
  
    
    <div class="w-screen overflow-y-scroll" >
  
      <CryptoProfileCard cryptoProfile = {cryptoProfile}/>
  
          
    </div>
  
  </div>
  </div>
  </div>
    <!--End Crypto Modal-->
  
  
  

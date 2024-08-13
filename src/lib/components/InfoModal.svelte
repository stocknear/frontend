<script>


export let title;
export let content;
export let id;
export let hide = false;
</script>
  

<label for={id} class="cursor-pointer ml-1">
  <svg class="w-5 h-5 {hide ? 'hidden' : ''}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="gray"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="info-circle"> <g> <circle cx="12" cy="12" data-name="--Circle" fill="none" id="_--Circle" r="10" stroke="gray" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle> <line fill="none" stroke="gray" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="12" y2="16"></line> <line fill="none" stroke="gray" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="8" y2="8"></line> </g> </g> </g> </g></svg>
</label>

  <!-- Desktop modal using dialog component -->
<input type="checkbox" id={id} class="modal-toggle" />

<dialog id={id} class="modal modal-bottom sm:modal-middle">


  <label for={id}  class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
  

  <!-- Desktop modal content -->
  <div class="modal-box w-full bg-[#191919] flex flex-col items-center">
    <div class="mx-auto mb-8 h-1.5 w-20 flex-shrink-0 rounded-full bg-[#404040]" />
    <div class="text-white mb-5 text-center">
      <h3 class="font-bold text-2xl mb-5">{title}</h3>
      <span class="text-white text-[1rem] font-normal">{@html content}</span>
    </div>

    <label for={id} class="sm:hidden cursor-pointer px-7 py-2 mb-5 rounded-full bg-[#0DDE00] text-center text-black text-[1rem] font-normal">OK</label>
    
  </div>
</dialog>

<script>


export let title;
export let content;
export let id;
export let hide = false;
</script>
  

<div class="relative">
<label for={id} class="absolute bottom-0 -left-1 cursor-pointer p-1 text-gray-300 hover:text-gray-600 dark:text-dark-400 dark:hover:text-dark-300">
  <svg class="h-[10.5px] w-[10.5px]" viewBox="0 0 4 16" fill="white" style="max-width:20px">
      <path d="M0 6h4v10h-4v-10zm2-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"></path>
  </svg>
</label>
</div>

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

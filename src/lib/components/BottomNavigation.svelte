<script lang='ts'>
  import { goto } from '$app/navigation';


  export let data;


  function handleClick() {
    const label = document.getElementById('animated-label');
    label.classList.add('animate-bounce');

    goto('/community/create-post');
  }

 
</script>


    
<div class="sm:hidden fixed z-50 w-full h-16 max-w-3xl -right-5 bottom-5">
  <div class="h-full max-w-3xl mx-auto">        
    <div class="flex items-center justify-end mr-10">
      <label id="animated-label" on:click={handleClick} class="inline-flex items-center justify-center w-14 h-14 font-medium bg-purple-600 bg-opacity-[0.8] rounded-full cursor-pointer">
        <svg class="w-4 h-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="white" d="m362.7 19.3l-48.4 48.4l130 130l48.4-48.4c25-25 25-65.5 0-90.5l-39.4-39.5c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2c-2.5 8.5-.2 17.6 6 23.8s15.3 8.5 23.7 6.1L151 475.7c14.1-4.2 27-11.8 37.4-22.2l233.3-233.2l-130-130z"/></svg>
      </label>
    </div>
  </div>
</div>
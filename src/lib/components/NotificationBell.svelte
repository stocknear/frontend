
<script lang='ts'>

  import { goto } from '$app/navigation';
  import { numberOfUnreadNotification } from '$lib/store';

  export let data;
  export let hasUnreadElement;


async function toggle() {
  hasUnreadElement = false;
  goto('/notifications')
}
</script>

  <!--Start Notification Bell-->
  {#if data?.user}
  
  <div on:click={toggle} class="relative ml-3 -mr-1">
    <label class="sm:hover:text-[#756EFF] text-gray-300 hover:text-white cursor-pointer">
      <svg class="w-7 h-7 inline-block" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12.0196 2.91016C8.7096 2.91016 6.0196 5.60016 6.0196 8.91016V11.8002C6.0196 12.4102 5.7596 13.3402 5.4496 13.8602L4.2996 15.7702C3.5896 16.9502 4.0796 18.2602 5.3796 18.7002C9.6896 20.1402 14.3396 20.1402 18.6496 18.7002C19.8596 18.3002 20.3896 16.8702 19.7296 15.7702L18.5796 13.8602C18.2796 13.3402 18.0196 12.4102 18.0196 11.8002V8.91016C18.0196 5.61016 15.3196 2.91016 12.0196 2.91016Z" stroke="currentColor" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round"></path><path d="M13.8699 3.19994C13.5599 3.10994 13.2399 3.03994 12.9099 2.99994C11.9499 2.87994 11.0299 2.94994 10.1699 3.19994C10.4599 2.45994 11.1799 1.93994 12.0199 1.93994C12.8599 1.93994 13.5799 2.45994 13.8699 3.19994Z" stroke="currentColor" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path><path opacity="0.4" d="M15.0195 19.0601C15.0195 20.7101 13.6695 22.0601 12.0195 22.0601C11.1995 22.0601 10.4395 21.7201 9.89953 21.1801C9.35953 20.6401 9.01953 19.8801 9.01953 19.0601" stroke="currentColor" stroke-width="1" stroke-miterlimit="10"></path></svg>
    </label>

    {#if hasUnreadElement}
    <div class="absolute top-2 -right-2 flex">
      <div class="relative inline-flex text-xs text-white font-bold w-[18px] h-[18px] bg-red-500 border-[1px] border-gray-700 rounded-full -top-3 right-2">
        <span class="m-auto -my-0.5">{$numberOfUnreadNotification <= 9 ? $numberOfUnreadNotification : '9+' }</span>
      </div>
    </div>
    
    {/if}

  </div>
  
{/if}

  
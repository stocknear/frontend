
<script lang='ts'>

  import { goto } from '$app/navigation';
  import { numberOfUnreadNotification } from '$lib/store';
  import Bell from "lucide-svelte/icons/bell";

  export let data;
  export let hasUnreadElement;


async function toggle() {
  hasUnreadElement = false;
  goto('/notifications')
}
</script>

  <!--Start Notification Bell-->
  {#if data?.user}
  
  <div on:click={toggle} class="text-gray-300 sm:hover:text-white cursor-pointer sm:hover:bg-[#27272A] relative border p-2 rounded-lg border-gray-800 ml-3 -mr-1">
      <Bell class="h-[20px] w-[20px]" />  

    {#if hasUnreadElement}
    <div class="absolute top-2 -right-2 flex">
      <div class="relative inline-flex text-xs text-black font-bold w-[18px] h-[18px] bg-white border-[1px] border-gray-800 rounded-full -top-2 right-2">
        <span class="m-auto">{$numberOfUnreadNotification <= 9 ? $numberOfUnreadNotification : '9+' }</span>
      </div>
    </div>
    
    {/if}

  </div>
  
{/if}

  
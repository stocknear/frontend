<script lang="ts">
  import { numberOfUnreadNotification } from "$lib/store";
  import Bell from "lucide-svelte/icons/bell";

  export let data;
  export let hasUnreadElement;

  async function toggle() {
    hasUnreadElement = false;
  }
</script>

<!--Start Notification Bell-->
{#if data?.user}
  <a
    href="/notifications"
    on:click={toggle}
    class="bg-gray-100 shadow dark:bg-default text-gray-500 dark:text-gray-300 dark:sm:hover:text-white cursor-pointer sm:hover:bg-gray-200 dark:sm:hover:bg-[#18181B] relative border p-2 rounded border-gray-300 dark:border-gray-600 ml-3 -mr-1"
  >
    <Bell class="h-[20px] w-[20px] " />

    {#if hasUnreadElement && $numberOfUnreadNotification > 0}
      <div class="absolute top-2 -right-2 flex">
        <div
          class="relative inline-flex text-xs text-white dark:text-black font-bold w-[18px] h-[18px] bg-default dark:bg-white border-[1px] dark:border-gray-800 rounded-full -top-2 right-2"
        >
          <span class="m-auto"
            >{$numberOfUnreadNotification <= 9
              ? $numberOfUnreadNotification
              : "9+"}</span
          >
        </div>
      </div>
    {/if}
  </a>
{/if}

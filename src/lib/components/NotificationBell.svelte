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
    class="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200/70 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 text-gray-500 dark:text-zinc-400 transition hover:bg-white dark:hover:bg-zinc-900/70 hover:text-violet-600 dark:hover:text-violet-400"
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

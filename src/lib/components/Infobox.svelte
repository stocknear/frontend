<script lang="ts">
  export let text;
</script>

<div
  class="rounded mt-5 bg-gray-50 dark:bg-[#1C1E22] border-gray-300 dark:border-gray-800 border p-0 sm:p-3 flex flex-row items-center"
>
  <svg
    class="h-[22px] w-[22px] shrink-0 hidden sm:inline-block"
    viewBox="0 0 20 20"
    fill="currentColor"
    style="max-width:40px"
    aria-hidden="true"
    ><path
      fill-rule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
      clip-rule="evenodd"
    ></path></svg
  >
  <div class="ml-1 sm:ml-3 w-full">
    <div class="flex w-full flex-row justify-between">
      <div class="p-3 sm:p-0 text-sm sm:text-[1rem]">
        <svg
          class="h-5 w-5 sm:hidden inline-block -mt-1.5"
          viewBox="0 0 20 20"
          fill="currentColor"
          style="max-width:40px"
          aria-hidden="true"
          ><path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clip-rule="evenodd"
          ></path></svg
        >
        {@html text}
      </div>
    </div>
  </div>
</div>

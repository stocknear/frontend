<script lang="ts">
  export let text;
</script>

<div
  class="mt-5 flex items-start gap-3 rounded-xl border border-gray-300 shadow bg-white/80 px-3 py-2.5 text-sm text-gray-700 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-200 sm:text-base"
>
  <div
    class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-zinc-900 dark:text-zinc-300"
  >
    <svg
      class="h-4 w-4"
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
  </div>
  <div class="leading-6">{@html text}</div>
</div>

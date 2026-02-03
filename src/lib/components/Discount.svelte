<script lang="ts">
  let copied = false;

  async function copyPromoCode() {
    await navigator.clipboard.writeText("SAVE50");
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }
</script>

<div class="w-full max-w-lg mx-auto mb-8 mt-4">
  <div
    class="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-gradient-to-br from-violet-50/50 to-white dark:from-violet-950/20 dark:to-zinc-950/60 px-6 py-6"
  >
    <div class="flex flex-col items-center gap-4">
      <!-- Discount badge -->
      <div class="flex items-center gap-3">
        <span
          class="text-4xl sm:text-5xl font-bold text-violet-600 dark:text-violet-400"
        >
          50%
        </span>
        <span class="text-lg sm:text-xl font-medium text-gray-600 dark:text-zinc-400">
          off
        </span>
      </div>

      <!-- Description -->
      <p class="text-center text-sm text-gray-600 dark:text-zinc-400">
        Pro & Plus Annual Plans
      </p>

      <!-- Promo code button -->
      <button
        on:click={copyPromoCode}
        type="button"
        class="cursor-pointer inline-flex items-center gap-2.5 rounded-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-sm transition hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/30"
      >
        <span class="font-mono text-sm font-semibold text-gray-900 dark:text-white tracking-wider">
          SAVE50
        </span>
        <span class="text-gray-400 dark:text-zinc-500">
          {#if copied}
            <svg
              class="w-4 h-4 text-emerald-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          {:else}
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              ></path>
            </svg>
          {/if}
        </span>
      </button>

      <p class="text-xs text-gray-400 dark:text-zinc-500">
        {#if copied}
          Copied!
        {:else}
          Click to copy code
        {/if}
      </p>
    </div>
  </div>
</div>

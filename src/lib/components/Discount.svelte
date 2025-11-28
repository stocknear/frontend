<script lang="ts">
  import { onMount } from "svelte";

  const targetDate = new Date("2025-12-02T23:59:59+01:00");

  let days: number | string = "-";
  let hours: number | string = "-";
  let minutes: number | string = "-";
  let seconds: number | string = "-";
  let copied = false;

  const updateTime = () => {
    const now = new Date();
    const timeDiff = targetDate.getTime() - now.getTime();

    if (timeDiff > 0) {
      const totalSeconds = Math.floor(timeDiff / 1000);

      seconds = totalSeconds % 60;
      minutes = Math.floor((totalSeconds % 3600) / 60);
      hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      days = Math.floor(totalSeconds / (3600 * 24));
    } else {
      days = 0;
      hours = 0;
      minutes = 0;
      seconds = 0;
    }
  };

  // update immediately and then every second
  updateTime();

  onMount(() => {
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  });

  async function copyPromoCode() {
    await navigator.clipboard.writeText("BF25");
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }
</script>

<div class="w-full max-w-xl m-auto mb-10">
  <div class="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-gray-100 to-white dark:from-zinc-900 dark:to-black border border-gray-200 dark:border-zinc-700/50 shadow-xl dark:shadow-2xl overflow-hidden">
    <!-- Subtle glow effect -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent"></div>

    <!-- Main content -->
    <div class="relative z-10">
      <!-- Discount display -->
      <div class="text-center mb-6">
        <span class="text-6xl sm:text-7xl font-black text-gray-900 dark:text-white tracking-tight">50<span class="text-violet-500 dark:text-violet-400">%</span></span>
        <p class="text-gray-500 dark:text-zinc-400 text-sm font-medium tracking-widest uppercase mt-1">Off All Plans</p>
      </div>

      <!-- Promo code -->
      <div class="flex justify-center mb-8">
        <button
          on:click={copyPromoCode}
          class="group flex items-center gap-4 px-5 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800/50 dark:hover:bg-zinc-700/50 border border-gray-200 dark:border-zinc-600/50 rounded-xl transition-all duration-300"
        >
          <span class="text-gray-400 dark:text-zinc-500 text-sm uppercase tracking-wide">Code</span>
          <span class="font-mono font-bold text-xl text-gray-900 dark:text-white tracking-widest">BF25</span>
          <span class="text-gray-400 dark:text-zinc-500 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors">
            {#if copied}
              <svg class="w-5 h-5 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            {:else}
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
            {/if}
          </span>
        </button>
      </div>
      {#if copied}
        <p class="text-center text-emerald-500 dark:text-emerald-400 text-xs -mt-6 mb-6 font-medium">Copied</p>
      {/if}

      <!-- Countdown timer -->
      <div class="border-t border-gray-200 dark:border-zinc-700/50 pt-6">
        <p class="text-center text-gray-400 dark:text-zinc-500 text-xs font-medium tracking-widest uppercase mb-4">Ends in</p>
        <div class="grid grid-cols-4 gap-2 sm:gap-4 max-w-sm mx-auto">
          <div class="text-center">
            <div class="bg-gray-100 dark:bg-zinc-800/80 rounded-lg px-2 sm:px-4 py-3">
              <span class="countdown font-mono text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                <span style="--value:{days};"></span>
              </span>
            </div>
            <span class="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wider mt-2 block">Days</span>
          </div>
          <div class="text-center">
            <div class="bg-gray-100 dark:bg-zinc-800/80 rounded-lg px-2 sm:px-4 py-3">
              <span class="countdown font-mono text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                <span style="--value:{hours};"></span>
              </span>
            </div>
            <span class="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wider mt-2 block">Hours</span>
          </div>
          <div class="text-center">
            <div class="bg-gray-100 dark:bg-zinc-800/80 rounded-lg px-2 sm:px-4 py-3">
              <span class="countdown font-mono text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                <span style="--value:{minutes};"></span>
              </span>
            </div>
            <span class="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wider mt-2 block">Min</span>
          </div>
          <div class="text-center">
            <div class="bg-gray-100 dark:bg-zinc-800/80 rounded-lg px-2 sm:px-4 py-3">
              <span class="countdown font-mono text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                <span style="--value:{seconds};"></span>
              </span>
            </div>
            <span class="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wider mt-2 block">Sec</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

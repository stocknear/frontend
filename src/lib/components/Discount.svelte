<script lang="ts">
  import { onMount } from "svelte";

  const targetDate = new Date("2026-01-10T23:59:59+01:00");

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
    await navigator.clipboard.writeText("XMAS25");
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }
</script>

<div class="w-full max-w-xl mx-auto mb-10 mt-5">
  <div
    class="rounded-2xl border border-gray-300 shadow dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/60 backdrop-blur-sm px-6 py-7 sm:px-8"
  >
    <div class="flex flex-col gap-6">
      <!-- Discount display -->
      <div class="text-center">
        <p class="text-[11px] uppercase tracking-[0.3em]">Limited offer</p>
        <div class="mt-2 flex items-baseline justify-center gap-2">
          <span
            class="text-5xl sm:text-6xl font-semibold text-gray-900 dark:text-white tracking-tight"
            >50%</span
          >
        </div>
        <p class="text-sm">Off all plans</p>
      </div>

      <!-- Promo code -->
      <div class="flex flex-col items-center gap-2">
        <button
          on:click={copyPromoCode}
          class="cursor-pointer group inline-flex items-center gap-3 rounded-full border border-gray-300 shadow dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/40 px-4 py-2 text-sm transition hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900/70"
        >
          <span class="text-[11px] uppercase tracking-[0.2em]">Code</span>
          <span
            class="uppercase font-mono text-base font-semibold text-gray-900 dark:text-white tracking-[0.35em]"
            >newyear26</span
          >
          <span
            class=" group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors"
          >
            {#if copied}
              <svg
                class="w-5 h-5 text-emerald-500 dark:text-emerald-400"
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
                class="w-5 h-5"
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
        {#if copied}
          <p class="text-center text-emerald-500 dark:text-emerald-400 text-xs">
            Copied
          </p>
        {/if}
      </div>

      <!-- Countdown timer -->
      <div class="border-t border-gray-100 dark:border-zinc-800/80 pt-5">
        <p class="text-center text-[11px] uppercase tracking-[0.3em]">
          Ends in
        </p>
        <div class="mt-3 grid grid-cols-4 gap-2 max-w-sm mx-auto">
          <div class="text-center">
            <div
              class="rounded-lg border border-gray-300 shadow dark:border-zinc-800/80 bg-gray-50/80 dark:bg-zinc-900/40 px-2 py-3"
            >
              <span
                class="countdown font-mono text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tabular-nums"
              >
                <span style="--value:{days};"></span>
              </span>
            </div>
            <span class="mt-2 block text-[10px] uppercase tracking-[0.2em]"
              >Days</span
            >
          </div>
          <div class="text-center">
            <div
              class="rounded-lg border border-gray-300 shadow dark:border-zinc-800/80 bg-gray-50/80 dark:bg-zinc-900/40 px-2 py-3"
            >
              <span
                class="countdown font-mono text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tabular-nums"
              >
                <span style="--value:{hours};"></span>
              </span>
            </div>
            <span class="mt-2 block text-[10px] uppercase tracking-[0.2em]"
              >Hours</span
            >
          </div>
          <div class="text-center">
            <div
              class="rounded-lg border border-gray-300 shadow dark:border-zinc-800/80 bg-gray-50/80 dark:bg-zinc-900/40 px-2 py-3"
            >
              <span
                class="countdown font-mono text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tabular-nums"
              >
                <span style="--value:{minutes};"></span>
              </span>
            </div>
            <span class="mt-2 block text-[10px] uppercase tracking-[0.2em]"
              >Min</span
            >
          </div>
          <div class="text-center">
            <div
              class="rounded-lg border border-gray-300 shadow dark:border-zinc-800/80 bg-gray-50/80 dark:bg-zinc-900/40 px-2 py-3"
            >
              <span
                class="countdown font-mono text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tabular-nums"
              >
                <span style="--value:{seconds};"></span>
              </span>
            </div>
            <span class="mt-2 block text-[10px] uppercase tracking-[0.2em]"
              >Sec</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

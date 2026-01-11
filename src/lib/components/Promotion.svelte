<script lang="ts">
  import { screenWidth } from "$lib/store";
  import { goto } from "$app/navigation";

  let modalId = "promotionModal";
  let title = "Upgrade for real-time edge on every trade.";
  let subtitle = "Upgrade to Pro for unlimited access to all features";
  let features = [
    "1,000 credits per month",
    "Watchlist with up to 300 stocks",
    "Portfolio with up to 300 stocks",
    "Real-time options & historical data",
    "Real-time options flow data",
    "Real-time unusual orders",
    "Premium Discord channel access",
  ];

  function closeModal() {
    const checkbox = document.getElementById(modalId) as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = false;
    }
  }
</script>

<input type="checkbox" id={modalId} class="modal-toggle" />

<dialog
  id={modalId}
  class="modal modal-bottom sm:modal-middle rounded-none sm:rounded"
>
  <button
    type="button"
    on:click={closeModal}
    class="cursor-pointer modal-backdrop"
  ></button>

  <div
    class="modal-box w-full bg-white/90 dark:bg-zinc-950/70 shadow-sm backdrop-blur-sm sm:border sm:border-gray-200 dark:sm:border-zinc-800/80 rounded-none sm:rounded-2xl {$screenWidth <
    640
      ? 'min-h-screen'
      : ''}"
  >
    <div class="grid grid-cols-1 animate-fade-in-once">
      <div class="flex justify-center pt-6 sm:pt-3">
        <div
          class="h-12 w-12 rounded-full bg-gray-300/80 dark:bg-zinc-900/60 flex items-center justify-center text-gray-900 dark:text-white"
        >
          <svg
            class="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
          >
            <path
              d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>

      <h2
        class="text-center text-2xl sm:text-3xl pt-4 font-semibold tracking-tight text-gray-900 dark:text-white"
      >
        {title}
      </h2>
      <p class="text-gray-500 dark:text-zinc-400 text-center text-sm pb-5 pt-3">
        {subtitle}
      </p>

      <ul
        class="space-y-3 text-sm sm:text-base text-gray-800 dark:text-zinc-200"
      >
        {#each features as feature}
          <li class="flex items-start gap-3">
            <span
              class="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center"
            >
              <svg
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M5 13l4 4L19 7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            <span>{feature}</span>
          </li>
        {/each}
      </ul>

      <div class="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          on:click={() => {
            closeModal();
            goto("/pricing");
          }}
          class="cursor-pointer flex-1 py-2.5 px-4 rounded-full font-semibold transition bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200 text-center"
        >
          Start 7-Day Free Trial
        </button>
      </div>

      <p class="mt-5 text-center text-xs text-gray-800 dark:text-zinc-300">
        Cancel anytime. We are a small team and your support means everything.
      </p>
    </div>
  </div>
</dialog>

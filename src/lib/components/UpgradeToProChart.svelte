<script lang="ts">
  import { goto } from "$app/navigation";
  import {
    chart_upgrade_modal_title,
    chart_upgrade_modal_description,
    chart_upgrade_modal_feature_history,
    chart_upgrade_modal_feature_indicators,
    chart_upgrade_modal_feature_filters,
    chart_upgrade_modal_cta,
  } from "$lib/paraglide/messages";

  export let currentDays: number = 30;
  export let proDays: number = 90;
</script>

<input type="checkbox" id="upgradeToProModal" class="modal-toggle" />

<dialog
  id="upgradeToProModal"
  class="modal modal-bottom sm:modal-middle"
  aria-labelledby="upgrade-modal-title"
  aria-modal="true"
  role="dialog"
>
  <label for="upgradeToProModal" class="cursor-pointer modal-backdrop"></label>

  <div
    class="modal-box relative m-auto w-full max-w-lg bg-white dark:bg-zinc-950 text-center rounded-2xl border border-gray-300 dark:border-zinc-800 shadow"
  >
    <!-- Close Button -->
    <label
      for="upgradeToProModal"
      class="cursor-pointer absolute right-3 top-3 text-gray-400 hover:text-gray-900 dark:text-zinc-500 dark:hover:text-white transition"
    >
      <svg class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
        />
      </svg>
    </label>

    <!-- Content -->
    <div class="pt-8 pb-6 px-4">
      <h2
        id="upgrade-modal-title"
        class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3"
      >
        {chart_upgrade_modal_title()}
      </h2>

      <p class="text-sm sm:text-base text-gray-600 dark:text-zinc-400 mb-6">
        {chart_upgrade_modal_description({ currentDays, proDays })}
      </p>

      <!-- Benefits List -->
      <ul class="text-left space-y-3 mb-8 max-w-sm mx-auto">
        <li class="flex items-start gap-3">
          <svg
            class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span class="text-sm text-gray-800 dark:text-zinc-300"
            >{chart_upgrade_modal_feature_history({ proDays })}</span
          >
        </li>
        <li class="flex items-start gap-3">
          <svg
            class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span class="text-sm text-gray-800 dark:text-zinc-300"
            >{chart_upgrade_modal_feature_indicators()}</span
          >
        </li>
        <li class="flex items-start gap-3">
          <svg
            class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span class="text-sm text-gray-800 dark:text-zinc-300"
            >{chart_upgrade_modal_feature_filters()}</span
          >
        </li>
      </ul>

      <!-- CTA Button -->
      <label
        for="upgradeToProModal"
        on:click={() => goto("/pricing")}
        class="inline-flex items-center justify-center cursor-pointer py-2.5 px-6 bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-none hover:bg-gray-800 dark:hover:bg-gray-200 transition rounded-full font-semibold text-sm sm:text-base"
      >
        {chart_upgrade_modal_cta()}
      </label>
    </div>
  </div>
</dialog>

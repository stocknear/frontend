<script lang="ts">
  import { onMount } from "svelte";
  import { getActivePromotion, isEligibleUser } from "$lib/constants/promo";
  import {
    home_promo_pill_label,
    home_promo_pill_discount,
    home_promo_pill_subtitle,
  } from "$lib/paraglide/messages.js";

  export let user = undefined;

  const DISMISS_KEY = "promoDismissed";

  const promo = getActivePromotion();

  // Hidden until onMount confirms it wasn't dismissed (SSR-safe, no flash-then-hide)
  let dismissed = true;

  onMount(() => {
    if (!promo) return;
    try {
      const stored = localStorage.getItem(DISMISS_KEY);
      dismissed = stored ? JSON.parse(stored)?.id === promo.id : false;
    } catch (e) {
      dismissed = false;
    }
  });

  function dismiss() {
    dismissed = true;
    try {
      localStorage.setItem(DISMISS_KEY, JSON.stringify({ id: promo?.id }));
    } catch (e) {
      // localStorage unavailable — banner just reappears next visit
    }
  }
</script>

{#if promo && !dismissed && isEligibleUser(user)}
  <div class="flex justify-center mb-5 text-center mt-5 sm:mt-0 px-4 mb-8">
    <div class="relative">
      <a
        href="/pricing"
        class="group relative cursor-pointer flex items-center gap-3 px-5 py-3 text-sm font-medium rounded-xl
               bg-gradient-to-r from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-800
               border border-gray-200 dark:border-zinc-700/50
               shadow-sm hover:shadow-md dark:shadow-none
               transition-all duration-300"
        tabindex="0"
      >
        <div
          class="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"
        ></div>
        <span class="flex items-center gap-1.5">
          <span class="relative flex h-1.5 w-1.5">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"
            ></span>
            <span
              class="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-500"
            ></span>
          </span>
          <span
            class="text-violet-600 dark:text-violet-400 font-semibold tracking-wide"
            >{home_promo_pill_label()}</span
          >
        </span>
        <span class="text-gray-400 dark:text-zinc-600">|</span>
        <span class="text-gray-600 dark:text-zinc-300">
          <span class="font-bold text-gray-900 dark:text-white"
            >{home_promo_pill_discount({
              percent: `${promo.percentOff}%`,
            })}</span
          >
          {home_promo_pill_subtitle()}
        </span>

        <svg
          class="w-4 h-4 text-gray-400 dark:text-zinc-500 group-hover:translate-x-0.5 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          ></path>
        </svg>
      </a>
      <button
        on:click={dismiss}
        type="button"
        aria-label="Dismiss"
        class="absolute -top-2 -right-2 cursor-pointer flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 transition"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          ></path>
        </svg>
      </button>
    </div>
  </div>
{/if}

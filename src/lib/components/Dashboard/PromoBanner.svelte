<script lang="ts">
  import { closedPromoBanner } from "$lib/store";

  function dismiss() {
    const expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    localStorage.setItem(
      "closePromoBanner",
      JSON.stringify({ value: true, expires: expirationDate }),
    );
    $closedPromoBanner = true;
  }
</script>

<div
  class="relative w-full bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-gray-50"
>
  <div class="relative w-full px-3 py-5 lg:py-3.5">
    <!-- Mobile layout -->
    <div class="flex flex-col items-center justify-center gap-4 lg:hidden">
      <span class="px-6 text-center text-sm font-bold text-gray-50">
        🔥 Special Offer: Get 50% off for the Annual Plans
      </span>
      <div class="flex gap-2">
        <a
          href="/pricing"
          class="inline-flex items-center whitespace-nowrap rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-gray-900 shadow-sm transition-all duration-150 hover:bg-gray-100"
        >
          Get it now
        </a>
        <button
          type="button"
          on:click={dismiss}
          class="cursor-pointer inline-flex items-center whitespace-nowrap rounded-full border border-gray-400/40 bg-transparent px-4 py-1.5 text-sm font-medium text-gray-200 transition-all duration-150 hover:bg-white/10"
        >
          Dismiss
        </button>
      </div>
    </div>

    <!-- Desktop layout -->
    <div class="hidden items-center justify-center gap-4 lg:flex">
      <span class="text-sm font-bold text-gray-50">
        🔥 Special Offer: Get 50% off for the Annual Plans
      </span>
      <a
        href="/pricing"
        class="inline-flex items-center whitespace-nowrap rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-gray-900 shadow-sm transition-all duration-150 hover:bg-gray-100"
      >
        Get it now
      </a>
    </div>

    <!-- Desktop dismiss button -->
    <button
      type="button"
      on:click={dismiss}
      class="cursor-pointer absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md p-1.5 text-gray-300 transition-colors duration-150 hover:bg-white/10 hover:text-white focus:outline-none lg:inline-flex"
      aria-label="Dismiss offer banner"
    >
      <svg
        class="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
        />
      </svg>
    </button>
  </div>
</div>

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
  class="relative w-full overflow-hidden bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-700 text-white"
>
  <div class="relative w-full px-4 py-3.5 lg:py-2.5">
    <!-- Mobile layout -->
    <div class="flex flex-col items-center justify-center gap-3 lg:hidden">
      <div class="flex flex-col items-center gap-1">
        <span
          class="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-sm"
        >
          New member offer — expires soon
        </span>
        <span class="px-4 text-center text-[15px] font-bold leading-snug">
          Get <span class="text-amber-300">50% off</span> your first year of Pro
        </span>
      </div>
      <div class="flex gap-2.5">
        <a
          href="/pricing"
          class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-5 py-1.5 text-sm font-bold text-indigo-700 shadow-lg shadow-indigo-900/25 transition-all duration-150 hover:bg-amber-300 hover:text-gray-900 hover:shadow-amber-400/25"
        >
          Claim 50% Off
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </a>
        <button
          type="button"
          on:click={dismiss}
          class="cursor-pointer inline-flex items-center whitespace-nowrap rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm transition-all duration-150 hover:bg-white/20"
        >
          Dismiss
        </button>
      </div>
    </div>

    <!-- Desktop layout -->
    <div class="hidden items-center justify-center gap-4 lg:flex">
      <span
        class="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-sm"
      >
        New member offer — expires soon
      </span>
      <span class="text-sm font-bold">
        Get <span class="text-amber-300">50% off</span> your first year of Pro
      </span>
      <a
        href="/pricing"
        class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-4 py-1.5 text-sm font-bold text-indigo-700 shadow-lg shadow-indigo-900/25 transition-all duration-150 hover:bg-amber-300 hover:text-gray-900 hover:shadow-amber-400/25"
      >
        Claim 50% Off
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </a>
    </div>

    <!-- Desktop dismiss -->
    <button
      type="button"
      on:click={dismiss}
      class="cursor-pointer absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md p-1.5 text-white/60 transition-colors duration-150 hover:bg-white/15 hover:text-white focus:outline-none lg:inline-flex"
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

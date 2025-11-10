<script lang="ts">
  import { goto } from "$app/navigation";
</script>

<input type="checkbox" id="ctaModal" class="modal-toggle hidden" />

<dialog
  id="ctaModal"
  class="modal p-4 sm:p-6"
  aria-labelledby="cta-title"
  aria-modal="true"
  role="dialog"
>
  <!-- Backdrop -->
  <label for="ctaModal" class="cursor-pointer modal-backdrop"></label>
  <!-- Modal content -->
  <div
    class="modal-box relative m-auto w-full max-w-3xl bg-white dark:bg-secondary text-center rounded-[5px] border border-gray-300 dark:border-gray-600 shadow"
  >
    <!-- Close Button (Top Right Corner) -->
    <div class="absolute top-4 right-4">
      <label for="ctaModal" class="cursor-pointer">
        <svg
          class="w-6 h-6 text-black dark:text-white"
          viewBox="0 0 1024 1024"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
        >
          <path
            fill="currentColor"
            d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"
          />
        </svg>
      </label>
    </div>

    <!-- Heading -->
    <h2 class="text-2xl sm:text-3xl font-bold mb-2 mt-8">
      Get more with Pro⚡
    </h2>

    <!-- Description -->
    <p class="text-[1rem] sm:text-lg mb-5 text-center">
      Upgrade to Stocknear Pro to gain access to all premium data, advanced
      charts, AI Agent, ad-free browsing, data downloads, and other exclusive
      features.
    </p>

    <!-- CTA Button -->
    <label
      for="ctaModal"
      class="btn btn-primary btn-lg"
      on:click={() => goto("/pricing")}
    >
      View Plans & Pricing
    </label>
  </div>
</dialog>

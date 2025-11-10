<script lang="ts">
  import { scoreComponent, stockTicker } from "$lib/store";

  export let score = 0;
  export let tier = "Free";

  // Use the correct reactive declaration
  $: {
    if ($stockTicker) {
      // Correctly check if score is neither undefined nor null
      $scoreComponent = score !== undefined && score !== null && score !== 0;
    }
  }
</script>

<section
  class="overflow-hidden bg-white dark:bg-default text-muted dark:text-white"
>
  <main class="overflow-hidden">
    <div class="w-full">
      <div
        class="flex flex-col items-center w-auto p-4 sm:p-4 rounded relative"
      >
        <div class="relative">
          <h3
            class="font-semibold dark:font-normal text-center text-sm sm:text-[1rem] mb-2"
          >
            AI Score
          </h3>
        </div>

        <a
          href={["Pro", "Plus"]?.includes(tier)
            ? `/stocks/${$stockTicker}/forecast/ai`
            : "/pricing"}
          class="flex flex-row items-center justify-between"
        >
          <div class="relative size-[50px] sm:size-[60px] ml-auto">
            <svg
              class="size-full w-[50px] h-[50px] sm:w-[60px] sm:h-[60px]"
              viewBox="0 0 36 36"
              xmlns="http://www.w3.org/2000/svg"
            >
              <!-- Background Circle -->
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                class="stroke-current text-gray-300 dark:text-[#303030]"
                stroke-width="2"
              ></circle>
              <!-- score Circle inside a group with rotation -->
              <g class="origin-center -rotate-90 transform">
                <!-- score Circle -->
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  class="stroke-current {score >= 7
                    ? 'text-green-800 dark:text-[#00FC50]'
                    : score >= 4
                      ? 'text-blue-800 dark:text-[#fff]'
                      : 'text-red-800 dark:text-[#FF2F1F]'}"
                  stroke-width="3"
                  stroke-dasharray="100.48"
                  stroke-dashoffset={100.48 -
                    ((["Pro", "Plus"]?.includes(tier) ? score : 0) / 10) *
                      100.48}
                >
                </circle>
              </g>
              <!-- Text in the middle -->
            </svg>

            <!-- Percentage Text -->
            <div
              class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2"
            >
              {#if ["Pro", "Plus"]?.includes(tier)}
                <span class="text-center text-xl font-semibold">
                  {score}
                </span>
              {:else}
                <div class="block relative">
                  <span
                    class=" font-semibold text-blue-link blur-sm group-hover:blur-[3px]"
                  >
                    XX
                  </span>
                  <div class="absolute top-0.5 flex items-center">
                    <svg
                      class="size-5 text-muted dark:text-[#fff]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      style="max-width: 40px;"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clip-rule="evenodd"
                      >
                      </path>
                    </svg>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </a>
        <h4 class="text-center text-sm mt-1 font-semibold">
          {#if ["Pro", "Plus"]?.includes(tier)}
            {#if score === 10}
              Strong Buy
            {:else if score >= 7}
              Buy
            {:else if score >= 4}
              Hold
            {:else if score >= 2}
              Sell
            {:else}
              Strong Sell
            {/if}
          {:else}
            Unlock
          {/if}
        </h4>
      </div>
    </div>
  </main>
</section>

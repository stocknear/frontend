<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let questions: string[] = [];

  const dispatch = createEventDispatcher();

  let expandedQuestions: Set<number> = new Set();

  function handleQuestionClick(question: string, index: number) {
    // Dispatch event to parent to handle the question click
    dispatch("question-click", { question, index });
  }
</script>

{#if questions && questions.length > 0}
  <div class=" mt-5">
    <div class="flex items-center gap-3">
      <h3 class="text-[1rem] sm:text-lg font-semibold">Related</h3>
    </div>

    <div class="flex flex-col gap-0.5">
      {#each questions as question, index}
        <div
          class="border-b border-gray-300 dark:border-gray-800 last:border-b-0"
        >
          <button
            class="cursor-pointer w-full flex justify-between items-center py-2 bg-transparent transition-colors text-left group"
            on:click={() => handleQuestionClick(question, index)}
            aria-expanded={expandedQuestions.has(index)}
          >
            <span
              class="flex-1 text-sm sm:text-[1rem] leading-relaxed font-normal"
            >
              {question}
            </span>
          </button>
        </div>
      {/each}
    </div>
  </div>
{/if}

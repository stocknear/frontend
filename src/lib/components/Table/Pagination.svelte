<script lang="ts">
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { createEventDispatcher } from "svelte";

  export let currentPage = 1;
  export let totalPages = 1;
  export let rowsPerPage = 20;
  export let rowsPerPageOptions = [20, 50, 100];
  export let showBackToTop = true;

  const dispatch = createEventDispatcher();

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      dispatch('pageChange', { page });
    }
  }

  function changeRowsPerPage(newRowsPerPage: number) {
    dispatch('rowsPerPageChange', { rowsPerPage: newRowsPerPage });
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
</script>

<!-- Pagination controls -->
<div class="flex flex-row items-center justify-between mt-8 sm:mt-5">
  <!-- Previous button -->
  <div class="flex items-center gap-2">
    <Button
      on:click={() => goToPage(currentPage - 1)}
      disabled={currentPage === 1}
      class="w-fit transition-all duration-150 border border-gray-200/70 dark:border-zinc-800/80 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center sm:w-auto px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <svg
        class="h-5 w-5 inline-block shrink-0 rotate-90"
        viewBox="0 0 20 20"
        fill="currentColor"
        style="max-width:40px"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clip-rule="evenodd"
        ></path>
      </svg>
      <span class="hidden sm:inline">Previous</span>
    </Button>
  </div>

  <!-- Page info and rows selector in center -->
  <div class="flex flex-row items-center gap-4">
    <span class="text-sm text-gray-600 dark:text-zinc-300">
      Page {currentPage} of {totalPages}
    </span>

    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild let:builder>
        <Button
          builders={[builder]}
          class="transition-all duration-150 border border-gray-200/70 dark:border-zinc-800/80 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center sm:w-auto px-2 sm:px-3 py-2 rounded-full truncate"
        >
          <span class="truncate text-[0.85rem] sm:text-sm"
            >{rowsPerPage} Rows</span
          >
          <svg
            class="ml-0.5 mt-1 h-5 w-5 inline-block shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
            style="max-width:40px"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clip-rule="evenodd"
            ></path>
          </svg>
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content
        side="bottom"
        align="end"
        sideOffset={10}
        alignOffset={0}
        class="w-auto min-w-40 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-200/70 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
      >
        <!-- Dropdown items -->
        <DropdownMenu.Group class="pb-2">
          {#each rowsPerPageOptions as item}
            <DropdownMenu.Item
              class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-600 dark:sm:hover:text-violet-400 transition"
            >
              <label
                on:click={() => changeRowsPerPage(item)}
                class="inline-flex justify-between w-full items-center cursor-pointer"
              >
                <span class="text-sm">{item} Rows</span>
              </label>
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </div>

  <!-- Next button -->
  <div class="flex items-center gap-2">
    <Button
      on:click={() => goToPage(currentPage + 1)}
      disabled={currentPage === totalPages}
      class="w-fit transition-all duration-150 border border-gray-200/70 dark:border-zinc-800/80 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center sm:w-auto px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <span class="hidden sm:inline">Next</span>
      <svg
        class="h-5 w-5 inline-block shrink-0 -rotate-90"
        viewBox="0 0 20 20"
        fill="currentColor"
        style="max-width:40px"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clip-rule="evenodd"
        ></path>
      </svg>
    </Button>
  </div>
</div>

{#if showBackToTop}
  <!-- Back to Top button -->
  <div class="flex justify-center mt-4">
    <button
      on:click={scrollToTop}
      class="cursor-pointer text-sm font-medium text-gray-600 dark:text-zinc-400 transition hover:text-violet-600 dark:hover:text-violet-400"
    >
      Back to Top <svg
        class="h-5 w-5 inline-block shrink-0 rotate-180"
        viewBox="0 0 20 20"
        fill="currentColor"
        style="max-width:40px"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clip-rule="evenodd"
        ></path>
      </svg>
    </button>
  </div>
{/if}

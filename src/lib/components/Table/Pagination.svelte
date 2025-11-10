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
      class="w-fit transition-all flex flex-row items-center duration-50 border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary flex flex-row justify-between items-center  sm:w-auto px-1.5 sm:px-3 rounded truncate"
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
    <span class="text-sm sm:text-[1rem]">
      Page {currentPage} of {totalPages}
    </span>

    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild let:builder>
        <Button
          builders={[builder]}
          class="w-fit transition-all duration-50 border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary  flex flex-row justify-between items-center  sm:w-auto px-2 sm:px-3 rounded truncate"
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
        class="w-auto min-w-40  max-h-[400px] overflow-y-auto scroller relative"
      >
        <!-- Dropdown items -->
        <DropdownMenu.Group class="pb-2">
          {#each rowsPerPageOptions as item}
            <DropdownMenu.Item
              class="sm:hover:bg-gray-200 dark:sm:hover:bg-primary"
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
      class="w-fit transition-all flex flex-row items-center duration-50 border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary flex flex-row justify-between items-center sm:w-auto px-1.5 sm:px-3 rounded truncate"
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
      class=" cursor-pointer sm:hover:text-muted text-blue-800 dark:sm:hover:text-white dark:text-blue-400 text-sm sm:text-[1rem] font-medium"
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
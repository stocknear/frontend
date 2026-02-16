  <script lang="ts">
  import { tick } from "svelte";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import {
    STATEMENT_INDICATORS,
    type StatementIndicatorConfig,
  } from "$lib/financials/statementIndicators";
  import {
    stock_detail_financials_indicators,
    stock_detail_financials_search_indicators,
    stock_detail_financials_presets,
    stock_detail_financials_no_indicators_found,
    stock_detail_financials_reset_selection,
    stock_detail_financials_select_all,
    stock_detail_financials_income_statement,
    stock_detail_financials_balance_sheet_statement,
    stock_detail_financials_cash_flow_statement,
    stock_detail_financials_ratios_metrics,
  } from "$lib/paraglide/messages";

  export let selectedIds: Set<string> = new Set();
  export let selectedPresetKeys: Set<string> = new Set();
  export let onToggle: (id: string) => void = () => {};
  export let onTogglePreset: (key: string) => void = () => {};
  export let onReset: () => void = () => {};
  export let onSelectAll: () => void = () => {};

  interface PresetConfig {
    key: string;
    label: string;
  }

  export let presets: PresetConfig[] = [];

  let searchQuery = "";
  let isMenuOpen = false;
  let searchInputEl: HTMLInputElement | null = null;

  const GROUPS: { key: string; label: string; statement: string }[] = [
    { key: "income", label: stock_detail_financials_income_statement(), statement: "income" },
    { key: "balance", label: stock_detail_financials_balance_sheet_statement(), statement: "balance" },
    { key: "cashflow", label: stock_detail_financials_cash_flow_statement(), statement: "cashflow" },
    { key: "ratios", label: stock_detail_financials_ratios_metrics(), statement: "ratios" },
  ];

  // Group indicators by statement
  const groupedIndicators: Record<string, StatementIndicatorConfig[]> = {};
  for (const group of GROUPS) {
    groupedIndicators[group.key] = STATEMENT_INDICATORS.filter(
      (i) => i.statement === group.statement,
    );
  }

  $: filteredGroups = GROUPS.map((group) => {
    const items = groupedIndicators[group.key] || [];
    if (!searchQuery) return { ...group, items };
    const q = searchQuery.toLowerCase();
    return {
      ...group,
      items: items.filter((i) => i.label.toLowerCase().includes(q)),
    };
  }).filter((g) => g.items.length > 0);

  $: filteredPresets = searchQuery
    ? presets.filter((p) =>
        p.label.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : presets;

  $: totalSelected = selectedIds.size + selectedPresetKeys.size;

  async function focusSearchInput() {
    await tick();
    requestAnimationFrame(() => {
      searchInputEl?.focus();
      const cursorPos = searchQuery.length;
      searchInputEl?.setSelectionRange(cursorPos, cursorPos);
    });
  }

  function handleMenuOpenChange(nextOpen: boolean) {
    isMenuOpen = nextOpen;
    if (nextOpen) {
      void focusSearchInput();
    }
  }
</script>

<DropdownMenu.Root bind:open={isMenuOpen} onOpenChange={handleMenuOpenChange}>
  <DropdownMenu.Trigger asChild let:builder>
    <Button
      builders={[builder]}
      class="cursor-pointer min-w-fit transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row items-center px-2 sm:px-3 py-2 rounded-full disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <span class="text-[0.85rem] sm:text-sm">{stock_detail_financials_indicators()}</span>
      {#if totalSelected > 0}
        <div
          class="ml-1.5 flex items-center justify-center h-4 min-w-[16px] px-1 bg-gray-200/70 dark:bg-zinc-800/80 border border-gray-300 dark:border-zinc-700/80 text-gray-700 dark:text-zinc-200 rounded-full text-xs font-semibold"
        >
          {totalSelected}
        </div>
      {/if}
      <svg
        class="ml-0.5 mt-0.5 h-5 w-5 inline-block shrink-0"
        viewBox="0 0 20 20"
        fill="currentColor"
        style="max-width:40px"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </Button>
  </DropdownMenu.Trigger>

  <DropdownMenu.Content
    side="bottom"
    align="end"
    sideOffset={10}
    alignOffset={0}
    class="w-72 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
  >
    <!-- Sticky search input -->
    <div
      class="sticky -top-1 z-40 bg-white/95 dark:bg-zinc-950/95 p-2 border-b border-gray-300 dark:border-zinc-700"
    >
      <div class="relative w-full">
        <input
          bind:value={searchQuery}
          bind:this={searchInputEl}
          on:keydown|stopPropagation
          autocomplete="off"
          class="text-sm w-full border-0 bg-white/95 dark:bg-zinc-950/95 focus:border-gray-300 focus:ring-0 focus:outline-none placeholder:text-gray-600 dark:placeholder:text-zinc-400 text-gray-700 dark:text-zinc-200 pr-8"
          type="text"
          placeholder={stock_detail_financials_search_indicators()}
        />
        {#if searchQuery.length > 0}
          <button
            on:click={() => (searchQuery = "")}
            aria-label="Clear"
            tabindex="0"
            class="absolute right-2 top-1/2 transform -translate-y-1/2"
          >
            <svg
              class="h-5 w-5 text-gray-500 dark:text-zinc-400 cursor-pointer"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        {/if}
      </div>
    </div>

    <!-- Presets section -->
    {#if filteredPresets.length > 0}
      <div
        class="text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-zinc-500 px-2 pt-3 pb-1"
      >
        {stock_detail_financials_presets()}
      </div>
      {#each filteredPresets as preset}
        <DropdownMenu.Item
          class="hover:bg-gray-100 dark:hover:bg-zinc-800/80 rounded-lg"
        >
          <label
            on:click|capture|preventDefault={() => onTogglePreset(preset.key)}
            class="cursor-pointer flex items-center w-full"
          >
            <input
              type="checkbox"
              class="rounded checked:bg-blue-700 dark:checked:bg-blue-600 cursor-pointer"
              checked={selectedPresetKeys.has(preset.key)}
            />
            <span class="ml-2 text-sm">{preset.label}</span>
          </label>
        </DropdownMenu.Item>
      {/each}
    {/if}

    <!-- Grouped indicators -->
    {#each filteredGroups as group}
      <div
        class="text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-zinc-500 px-2 pt-3 pb-1"
      >
        {group.label}
      </div>
      {#each group.items as indicator}
        <DropdownMenu.Item
          class="hover:bg-gray-100 dark:hover:bg-zinc-800/80 rounded-lg"
        >
          <label
            on:click|capture|preventDefault={() => onToggle(indicator.id)}
            class="cursor-pointer flex items-center w-full"
          >
            <input
              type="checkbox"
              class="rounded checked:bg-blue-700 dark:checked:bg-blue-600 cursor-pointer"
              checked={selectedIds.has(indicator.id)}
            />
            <span class="ml-2 text-sm">{indicator.label}</span>
          </label>
        </DropdownMenu.Item>
      {/each}
    {/each}

    {#if filteredGroups.length === 0 && filteredPresets.length === 0}
      <div class="px-2 py-3 text-xs text-gray-500 dark:text-zinc-400 text-center">
        {stock_detail_financials_no_indicators_found()}
      </div>
    {/if}

    <!-- Sticky footer -->
    <div
      class="sticky -bottom-1 bg-white/95 dark:bg-zinc-950/95 z-50 p-2 border-t border-gray-300 dark:border-zinc-700 w-full flex justify-between items-center"
    >
      <label
        on:click={() => { searchQuery = ""; onReset(); }}
        class="w-full hover:text-violet-600 dark:hover:text-violet-400 text-gray-600 dark:text-zinc-300 bg-white/95 dark:bg-zinc-950/95 text-start text-sm cursor-pointer"
      >
        {stock_detail_financials_reset_selection()}
      </label>
      <label
        on:click={() => { searchQuery = ""; onSelectAll(); }}
        class="w-full flex justify-end hover:text-violet-600 dark:hover:text-violet-400 text-gray-600 dark:text-zinc-300 bg-white/95 dark:bg-zinc-950/95 text-start text-sm cursor-pointer"
      >
        {stock_detail_financials_select_all()}
      </label>
    </div>
  </DropdownMenu.Content>
</DropdownMenu.Root>

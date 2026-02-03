<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { goto } from "$app/navigation";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import Timer from "lucide-svelte/icons/timer";
  import Trash2 from "lucide-svelte/icons/trash-2";
  import MousePointer2 from "lucide-svelte/icons/mouse-pointer-2";
  import {
    TIMEFRAMES,
    toolGroups,
    toolIcons,
    type ChartTypeOption,
    type ChartTypeId,
  } from "./chartTypes";

  // Props
  export let activeRange: string;
  export let chartType: ChartTypeId;
  export let currentChartType: ChartTypeOption | undefined;
  export let chartTypeOptions: ChartTypeOption[];
  export let isSubscribed: boolean;
  export let showEarnings: boolean;
  export let showDividends: boolean;
  export let showNewsFlow: boolean;
  export let drawingsLocked: boolean;
  export let drawingsVisible: boolean;
  export let selectedToolByGroup: Record<string, string>;
  export let activeTool: string | null;

  const dispatch = createEventDispatcher<{
    setRange: { range: string };
    setChartType: { type: ChartTypeId };
    toggleEarnings: void;
    toggleDividends: void;
    toggleNewsFlow: void;
    toggleDrawingsLock: void;
    toggleDrawingsVisibility: void;
    removeAllDrawings: void;
    activateDrawingTool: { groupId: string; toolId: string; overlay: string };
    setCursorMode: void;
  }>();

  const timeframes = [...TIMEFRAMES];
</script>

<!-- Mobile Bottom Navigation Bar -->
<div
  class="fixed bottom-0 left-0 right-0 z-40 sm:hidden border-t border-gray-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
>
  <div class="flex items-center justify-around h-14 px-2">
    <!-- Timeframe -->
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild let:builder>
        <button
          use:builder.action
          {...builder}
          class="flex flex-col items-center justify-center gap-0.5 p-2 min-w-[56px] text-gray-600 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-200 transition"
        >
          <Timer class="h-5 w-5" />
          <span class="text-[10px] font-medium">{activeRange}</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        side="top"
        align="center"
        sideOffset={8}
        class="w-28 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-1"
      >
        <DropdownMenu.Group>
          {#each timeframes as frame}
            <DropdownMenu.Item
              class={`px-3 py-2 text-sm rounded cursor-pointer transition ${
                activeRange === frame
                  ? "text-violet-400 bg-gray-100 dark:bg-zinc-800"
                  : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100/60 dark:hover:bg-zinc-800"
              }`}
              on:click={() => dispatch("setRange", { range: frame })}
            >
              {frame}
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>

    <!-- Chart Type -->
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild let:builder>
        <button
          use:builder.action
          {...builder}
          class="flex flex-col items-center justify-center gap-0.5 p-2 min-w-[56px] text-gray-600 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-200 transition"
        >
          <svelte:component this={currentChartType?.icon} class="h-5 w-5" />
          <span class="text-[10px] font-medium">Chart</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        side="top"
        align="center"
        sideOffset={8}
        class="w-36 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-1"
      >
        <DropdownMenu.Group>
          {#each chartTypeOptions as option}
            <DropdownMenu.Item
              class={`flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer transition ${
                chartType === option.id
                  ? "text-violet-400 bg-gray-100 dark:bg-zinc-800"
                  : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100/60 dark:hover:bg-zinc-800"
              }`}
              on:click={() => dispatch("setChartType", { type: option.id })}
            >
              <svelte:component this={option.icon} class="h-4 w-4" />
              {option.label}
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>

    <!-- Indicators -->
    <label
      for="indicatorModal"
      class="flex flex-col items-center justify-center gap-0.5 p-2 min-w-[56px] text-gray-600 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-200 transition cursor-pointer"
    >
      <svg
        class="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
      <span class="text-[10px] font-medium">Indicators</span>
    </label>

    <!-- Events -->
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild let:builder>
        <button
          use:builder.action
          {...builder}
          class="flex flex-col items-center justify-center gap-0.5 p-2 min-w-[56px] text-gray-600 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-200 transition"
        >
          <svg
            class="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span class="text-[10px] font-medium">Events</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        side="top"
        align="center"
        sideOffset={8}
        class="w-44 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-1"
      >
        <DropdownMenu.Group>
          <DropdownMenu.Item
            class="flex items-center justify-between px-3 py-2.5 text-sm rounded hover:bg-gray-100/60 dark:hover:bg-zinc-800 cursor-pointer"
            on:click={(e) => e.preventDefault()}
          >
            <label
              class="inline-flex justify-between w-full items-center cursor-pointer"
              on:click|stopPropagation
              on:pointerdown|stopPropagation
            >
              <span class="text-gray-700 dark:text-zinc-300">Earnings</span>
              <div class="relative ml-4 flex items-center">
                <input
                  type="checkbox"
                  class="sr-only peer"
                  checked={showEarnings}
                  on:change={() => dispatch("toggleEarnings")}
                />
                <div
                  class="w-9 h-5 bg-gray-200/80 dark:bg-zinc-800 rounded-full peer peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300/70 dark:after:border-zinc-700/80 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"
                ></div>
              </div>
            </label>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            class="flex items-center justify-between px-3 py-2.5 text-sm rounded hover:bg-gray-100/60 dark:hover:bg-zinc-800 cursor-pointer"
            on:click={(e) => e.preventDefault()}
          >
            <label
              class="inline-flex justify-between w-full items-center cursor-pointer"
              on:click|stopPropagation
              on:pointerdown|stopPropagation
            >
              <span class="text-gray-700 dark:text-zinc-300">Dividends</span>
              <div class="relative ml-4 flex items-center">
                <input
                  type="checkbox"
                  class="sr-only peer"
                  checked={showDividends}
                  on:change={() => dispatch("toggleDividends")}
                />
                <div
                  class="w-9 h-5 bg-gray-200/80 dark:bg-zinc-800 rounded-full peer peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300/70 dark:after:border-zinc-700/80 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"
                ></div>
              </div>
            </label>
          </DropdownMenu.Item>
          {#if isSubscribed}
            <DropdownMenu.Item
              class="flex items-center justify-between px-3 py-2.5 text-sm rounded hover:bg-gray-100/60 dark:hover:bg-zinc-800 cursor-pointer"
              on:click={(e) => e.preventDefault()}
            >
              <label
                class="inline-flex justify-between w-full items-center cursor-pointer"
                on:click|stopPropagation
                on:pointerdown|stopPropagation
              >
                <span class="text-gray-700 dark:text-zinc-300">News Flow</span>
                <div class="relative ml-4 flex items-center">
                  <input
                    type="checkbox"
                    class="sr-only peer"
                    checked={showNewsFlow}
                    on:change={() => dispatch("toggleNewsFlow")}
                  />
                  <div
                    class="w-9 h-5 bg-gray-200/80 dark:bg-zinc-800 rounded-full peer peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300/70 dark:after:border-zinc-700/80 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"
                  ></div>
                </div>
              </label>
            </DropdownMenu.Item>
          {/if}
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>

    <!-- Drawing Tools -->
    <label
      for="mobileToolsModal"
      class="flex flex-col items-center justify-center gap-0.5 p-2 min-w-[56px] text-gray-600 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-200 transition cursor-pointer"
    >
      <svg
        class="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </svg>
      <span class="text-[10px] font-medium">Tools</span>
    </label>
  </div>
</div>

<!-- Mobile Drawing Tools Modal -->
<input type="checkbox" id="mobileToolsModal" class="modal-toggle" />
<dialog id="mobileToolsModal" class="modal modal-bottom">
  <label
    for="mobileToolsModal"
    class="cursor-pointer modal-backdrop bg-black/30"
  ></label>
  <div
    class="modal-box p-0 w-full max-h-[70vh] relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
  >
    <label
      for="mobileToolsModal"
      class="inline-block cursor-pointer absolute right-4 top-4 text-[1.3rem] sm:text-[1.6rem] text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition"
      aria-label="Close drawing tools"
    >
      <svg
        class="w-6 h-6 sm:w-7 sm:h-7"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        ><path
          fill="currentColor"
          d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
        /></svg
      >
    </label>
    <!-- Handle bar -->
    <div class="flex justify-center py-2">
      <div class="w-10 h-1 bg-gray-200 dark:bg-zinc-700 rounded-full"></div>
    </div>

    <!-- Header -->
    <div
      class="flex items-center justify-between px-4 pb-3 border-b border-gray-300 dark:border-zinc-700"
    >
      <h3 class="text-base font-semibold text-gray-900 dark:text-white">
        Drawing Tools
      </h3>
      <div class="flex items-center gap-2">
        <!-- Lock/Unlock -->
        <button
          class={`p-2 rounded-lg transition ${drawingsLocked ? "text-amber-400 bg-amber-400/10" : "text-gray-600 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-200 hover:bg-gray-100/60 dark:hover:bg-zinc-800"}`}
          on:click={() => dispatch("toggleDrawingsLock")}
          title={drawingsLocked ? "Unlock drawings" : "Lock drawings"}
        >
          <svg class="h-5 w-5" viewBox="0 0 22 22" fill="currentColor">
            <path d={drawingsLocked ? toolIcons.lock : toolIcons.unlock} />
          </svg>
        </button>
        <!-- Show/Hide -->
        <button
          class={`p-2 rounded-lg transition ${!drawingsVisible ? "text-gray-500 dark:text-zinc-400" : "text-gray-600 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-200 hover:bg-gray-100/60 dark:hover:bg-zinc-800"}`}
          on:click={() => dispatch("toggleDrawingsVisibility")}
          title={drawingsVisible ? "Hide drawings" : "Show drawings"}
        >
          <svg class="h-5 w-5" viewBox="0 0 22 22" fill="currentColor">
            <path
              d={drawingsVisible ? toolIcons.visible : toolIcons.invisible}
            />
          </svg>
        </button>
        <!-- Delete All -->
        <button
          class="p-2 rounded-lg text-gray-600 dark:text-zinc-400 hover:text-rose-400 hover:bg-rose-400/10 transition"
          on:click={() => dispatch("removeAllDrawings")}
          title="Delete all drawings"
        >
          <Trash2 class="h-5 w-5" />
        </button>
      </div>
    </div>

    <!-- Tools Grid -->
    <div class="p-4 space-y-4 overflow-y-auto max-h-[50vh]">
      {#each toolGroups as group}
        <div>
          <h4
            class="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-2"
          >
            {group.label}
          </h4>
          <div class="grid grid-cols-2 gap-2">
            {#each group.options as option}
              <label
                for="mobileToolsModal"
                class={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${
                  selectedToolByGroup[group.id] === option.id
                    ? "border-violet-500 bg-violet-500/10 text-violet-300"
                    : "border-gray-300 dark:border-zinc-700 bg-gray-100/50 dark:bg-zinc-900/50 text-gray-700 dark:text-zinc-300 hover:border-gray-300 dark:border-zinc-700 hover:bg-gray-100/60 dark:hover:bg-zinc-800/50"
                } ${drawingsLocked ? "opacity-50 pointer-events-none" : ""}`}
                on:click={() =>
                  dispatch("activateDrawingTool", {
                    groupId: group.id,
                    toolId: option.id,
                    overlay: option.overlay,
                  })}
              >
                <svg
                  class="h-5 w-5 flex-shrink-0"
                  viewBox="0 0 22 22"
                  fill="currentColor"
                >
                  <path
                    d={toolIcons[option.icon] ||
                      toolIcons.horizontalStraightLine}
                  />
                </svg>
                <span class="text-sm truncate">{option.label}</span>
              </label>
            {/each}
          </div>
        </div>
      {/each}
    </div>

    <!-- Cursor Mode Button -->
    <div class="p-4 pt-0">
      <label
        for="mobileToolsModal"
        class="flex items-center justify-center gap-2 w-full p-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800/50 text-gray-700 dark:text-zinc-200 hover:bg-gray-100/60 dark:hover:bg-zinc-800 transition cursor-pointer"
        on:click={() => dispatch("setCursorMode")}
      >
        <MousePointer2 class="h-5 w-5" />
        <span class="text-sm font-medium">Cursor Mode</span>
      </label>
    </div>
  </div>
</dialog>

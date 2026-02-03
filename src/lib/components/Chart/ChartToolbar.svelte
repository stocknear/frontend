<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import MousePointer2 from "lucide-svelte/icons/mouse-pointer-2";
  import ZoomIn from "lucide-svelte/icons/zoom-in";
  import ZoomOut from "lucide-svelte/icons/zoom-out";
  import Undo2 from "lucide-svelte/icons/undo-2";
  import Redo2 from "lucide-svelte/icons/redo-2";
  import Keyboard from "lucide-svelte/icons/keyboard";
  import {
    toolGroups,
    toolIcons,
    type DrawingMode,
  } from "./chartTypes";

  // Props
  export let activeTool: string | null;
  export let drawingsLocked: boolean;
  export let drawingsVisible: boolean;
  export let drawingMode: DrawingMode;
  export let selectedToolByGroup: Record<string, string>;
  export let dropdownStates: Record<string, boolean>;
  export let canUndo: boolean = false;
  export let canRedo: boolean = false;

  const dispatch = createEventDispatcher<{
    setCursorMode: void;
    activateDrawingTool: { groupId: string; toolId: string; overlay: string };
    setDrawingMode: { mode: DrawingMode };
    toggleDrawingsVisibility: void;
    toggleDrawingsLock: void;
    zoomIn: void;
    zoomOut: void;
    downloadChart: void;
    removeAllDrawings: void;
    undo: void;
    redo: void;
    showKeyboardShortcuts: void;
  }>();
</script>

<!-- KlineCharts Pro Style Drawing Toolbar -->
<div
  class="tv-left-rail hidden sm:flex h-full w-[54px] flex-col items-center border-r border-gray-300 dark:border-zinc-800 bg-white dark:bg-[#0b0b0d] py-2 overflow-visible transition-all duration-200"
>
  <!-- Cursor Tool -->
  <button
    class={`cursor-pointer group relative flex h-[38px] w-[38px] items-center justify-center rounded transition-all duration-200 ${
      activeTool === "cursor"
        ? "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white"
        : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100/60 dark:hover:bg-zinc-800 hover:text-violet-600 dark:hover:text-violet-400"
    }`}
    on:click={() => dispatch("setCursorMode")}
    title="Cursor"
  >
    <MousePointer2 class="size-5" />
  </button>

  <!-- Drawing Tool Groups -->
  {#each toolGroups as group}
    <DropdownMenu.Root bind:open={dropdownStates[group.id]}>
      <div class="relative mt-1 group/item">
        <!-- Main Button with selected tool icon -->
        <button
          class={`relative flex h-[38px] w-[38px] items-center justify-center rounded transition-all duration-200 ${
            drawingsLocked
              ? "cursor-not-allowed opacity-40 text-gray-500 dark:text-zinc-500"
              : group.options.some((o) => o.id === activeTool)
                ? "cursor-pointer bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white"
                : "cursor-pointer text-gray-600 dark:text-zinc-400 hover:bg-gray-100/60 dark:hover:bg-zinc-800 hover:text-violet-600 dark:hover:text-violet-400"
          }`}
          on:click={() => {
            if (drawingsLocked) return;
            const selectedTool = group.options.find(
              (o) => o.id === selectedToolByGroup[group.id],
            );
            if (selectedTool) {
              dispatch("activateDrawingTool", {
                groupId: group.id,
                toolId: selectedTool.id,
                overlay: selectedTool.overlay,
              });
            }
          }}
          title={drawingsLocked ? "Unlock drawings to use this tool" : group.label}
        >
          <svg viewBox="0 0 22 22" class="h-6 w-6 fill-current">
            <path
              d={toolIcons[selectedToolByGroup[group.id]] ||
                toolIcons.horizontalStraightLine}
            />
          </svg>
        </button>
        <!-- Dropdown Arrow - hidden when drawings are locked -->
        {#if !drawingsLocked}
          <DropdownMenu.Trigger asChild let:builder>
            <button
              use:builder.action
              {...builder}
              class="absolute -right-1 top-1/2 -translate-y-1/2 w-[14px] h-[24px] flex items-center justify-center opacity-0 group-hover/item:opacity-100 hover:bg-gray-200/70 dark:hover:bg-zinc-700/70 rounded transition-all duration-200 cursor-pointer"
              on:click|stopPropagation
            >
              <svg
                viewBox="0 0 4 6"
                class="w-[6px] h-[9px] fill-gray-600 dark:fill-zinc-300 transition-transform duration-300 ease-out {dropdownStates[group.id] ? 'rotate-90' : ''}"
              >
                <path
                  d="M1.07298,0.159458C0.827521,-0.0531526,0.429553,-0.0531526,0.184094,0.159458C-0.0613648,0.372068,-0.0613648,0.716778,0.184094,0.929388L2.61275,3.03303L0.260362,5.07061C0.0149035,5.28322,0.0149035,5.62793,0.260362,5.84054C0.505822,6.05315,0.903789,6.05315,1.14925,5.84054L3.81591,3.53075C4.01812,3.3556,4.05374,3.0908,3.92279,2.88406C3.93219,2.73496,3.87113,2.58315,3.73964,2.46925L1.07298,0.159458Z"
                />
              </svg>
            </button>
          </DropdownMenu.Trigger>
        {/if}

        <!-- Dropdown Menu -->
        <DropdownMenu.Content
          side="right"
          align="start"
          sideOffset={4}
          class="w-52 max-h-80 overflow-y-auto scroller rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-1 z-50"
        >
          <DropdownMenu.Group>
            {#each group.options as option}
              <DropdownMenu.Item
                class={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg transition-colors ${
                  selectedToolByGroup[group.id] === option.id
                    ? "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium"
                    : "text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
                }`}
                on:click={() => {
                  dispatch("activateDrawingTool", {
                    groupId: group.id,
                    toolId: option.id,
                    overlay: option.overlay,
                  });
                  dropdownStates[group.id] = false;
                }}
              >
                <svg
                  viewBox="0 0 22 22"
                  class="h-[18px] w-[18px] flex-shrink-0 fill-current"
                >
                  <path d={toolIcons[option.icon]} />
                </svg>
                <span>{option.label}</span>
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Group>
        </DropdownMenu.Content>
      </div>
    </DropdownMenu.Root>
  {/each}

  <!-- Separator -->
  <div class="w-5 h-px bg-gray-300 dark:bg-zinc-700 my-2"></div>

  <!-- Magnet Mode -->
  <DropdownMenu.Root bind:open={dropdownStates.magnet}>
    <div class="relative mt-1 group/magnet">
      <button
        class={`cursor-pointer relative flex h-[38px] w-[38px] items-center justify-center rounded transition-all duration-200 ${
          drawingMode !== "normal"
            ? "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white"
            : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100/60 dark:hover:bg-zinc-800 hover:text-gray-700 dark:text-zinc-200"
        }`}
        on:click={() => {
          if (drawingMode === "normal") {
            dispatch("setDrawingMode", { mode: "weak_magnet" });
          } else {
            dispatch("setDrawingMode", { mode: "normal" });
          }
        }}
        title={drawingMode === "normal" ? "Enable magnet mode" : "Disable magnet mode"}
      >
        <svg viewBox="0 0 28 28" class="h-6 w-6 fill-current">
          <path d={toolIcons.magnet} />
        </svg>
      </button>
      <!-- Dropdown Arrow - appears on hover -->
      <DropdownMenu.Trigger asChild let:builder>
        <button
          use:builder.action
          {...builder}
          class="absolute -right-1 top-1/2 -translate-y-1/2 w-[14px] h-[24px] flex items-center justify-center opacity-0 group-hover/magnet:opacity-100 hover:bg-gray-200/70 dark:hover:bg-zinc-700/70 rounded transition-all duration-200 cursor-pointer"
          on:click|stopPropagation
        >
          <svg
            viewBox="0 0 4 6"
            class="w-[6px] h-[9px] fill-gray-600 dark:fill-zinc-300 transition-transform duration-300 ease-out {dropdownStates.magnet ? 'rotate-90' : ''}"
          >
            <path
              d="M1.07298,0.159458C0.827521,-0.0531526,0.429553,-0.0531526,0.184094,0.159458C-0.0613648,0.372068,-0.0613648,0.716778,0.184094,0.929388L2.61275,3.03303L0.260362,5.07061C0.0149035,5.28322,0.0149035,5.62793,0.260362,5.84054C0.505822,6.05315,0.903789,6.05315,1.14925,5.84054L3.81591,3.53075C4.01812,3.3556,4.05374,3.0908,3.92279,2.88406C3.93219,2.73496,3.87113,2.58315,3.73964,2.46925L1.07298,0.159458Z"
            />
          </svg>
        </button>
      </DropdownMenu.Trigger>

      <!-- Magnet Mode Dropdown -->
      <DropdownMenu.Content
        side="right"
        align="start"
        sideOffset={4}
        class="w-44 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-1 z-50"
      >
        <DropdownMenu.Group>
          <DropdownMenu.Item
            class={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg transition-colors ${
              drawingMode === "weak_magnet"
                ? "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium"
                : "text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
            }`}
            on:click={() => {
              dispatch("setDrawingMode", { mode: "weak_magnet" });
              dropdownStates.magnet = false;
            }}
          >
            <svg
              viewBox="0 0 28 28"
              class="h-[18px] w-[18px] flex-shrink-0 fill-current"
            >
              <path d={toolIcons.magnet} />
            </svg>
            <span>Weak Magnet</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            class={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg transition-colors ${
              drawingMode === "strong_magnet"
                ? "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium"
                : "text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
            }`}
            on:click={() => {
              dispatch("setDrawingMode", { mode: "strong_magnet" });
              dropdownStates.magnet = false;
            }}
          >
            <svg
              viewBox="0 0 28 28"
              class="h-[18px] w-[18px] flex-shrink-0 fill-current"
            >
              <path d={toolIcons.magnet} />
            </svg>
            <span>Strong Magnet</span>
          </DropdownMenu.Item>
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </div>
  </DropdownMenu.Root>

  <!-- Visibility - highlights when drawings are hidden (unusual state) -->
  <button
    class={`cursor-pointer flex h-[38px] w-[38px] items-center justify-center rounded transition-all duration-200 mt-1 ${
      !drawingsVisible
        ? "bg-gray-100 dark:bg-zinc-800 text-rose-400"
        : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100/60 dark:hover:bg-zinc-800 hover:text-gray-700 dark:text-zinc-200"
    }`}
    on:click={() => dispatch("toggleDrawingsVisibility")}
    title={drawingsVisible ? "Hide drawings" : "Show drawings"}
  >
    <svg viewBox="0 0 22 22" class="h-6 w-6 fill-current">
      <path d={drawingsVisible ? toolIcons.visible : toolIcons.invisible} />
    </svg>
  </button>

  <!-- Lock - prevents accidental modification of drawings -->
  <button
    class={`cursor-pointer flex h-[38px] w-[38px] items-center justify-center rounded transition-all duration-200 mt-1 ${
      drawingsLocked
        ? "bg-gray-100 dark:bg-zinc-800 text-amber-500 dark:text-amber-400"
        : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100/60 dark:hover:bg-zinc-800 hover:text-violet-600 dark:hover:text-violet-400"
    }`}
    on:click={() => dispatch("toggleDrawingsLock")}
    title={drawingsLocked ? "Unlock drawings" : "Lock drawings"}
  >
    <svg viewBox="0 0 22 22" class="h-6 w-6 fill-current">
      <path d={drawingsLocked ? toolIcons.lock : toolIcons.unlock} />
    </svg>
  </button>

  <!-- Separator -->
  <div class="w-5 h-px bg-gray-300 dark:bg-zinc-700 my-2"></div>

  <!-- Undo/Redo -->
  <button
    class={`flex h-[38px] w-[38px] items-center justify-center rounded transition-all duration-200 ${
      canUndo
        ? "cursor-pointer text-gray-600 dark:text-zinc-400 hover:bg-gray-100/60 dark:hover:bg-zinc-800 hover:text-violet-600 dark:hover:text-violet-400"
        : "cursor-not-allowed text-gray-300 dark:text-zinc-600"
    }`}
    on:click={() => canUndo && dispatch("undo")}
    disabled={!canUndo}
    title="Undo (Ctrl+Z)"
  >
    <Undo2 class="size-5" />
  </button>
  <button
    class={`flex h-[38px] w-[38px] items-center justify-center rounded transition-all duration-200 mt-1 ${
      canRedo
        ? "cursor-pointer text-gray-600 dark:text-zinc-400 hover:bg-gray-100/60 dark:hover:bg-zinc-800 hover:text-violet-600 dark:hover:text-violet-400"
        : "cursor-not-allowed text-gray-300 dark:text-zinc-600"
    }`}
    on:click={() => canRedo && dispatch("redo")}
    disabled={!canRedo}
    title="Redo (Ctrl+Shift+Z)"
  >
    <Redo2 class="size-5" />
  </button>

  <!-- Separator -->
  <div class="w-5 h-px bg-gray-300 dark:bg-zinc-700 my-2"></div>

  <!-- Zoom Tools -->
  <button
    class="cursor-pointer flex h-[38px] w-[38px] items-center justify-center rounded text-gray-600 dark:text-zinc-400 transition-all duration-200 hover:bg-gray-100/60 dark:hover:bg-zinc-800 hover:text-violet-600 dark:hover:text-violet-400"
    on:click={() => dispatch("zoomIn")}
    title="Zoom in"
  >
    <ZoomIn class="size-5" />
  </button>
  <button
    class="cursor-pointer flex h-[38px] w-[38px] items-center justify-center rounded text-gray-600 dark:text-zinc-400 transition-all duration-200 hover:bg-gray-100/60 dark:hover:bg-zinc-800 hover:text-violet-600 dark:hover:text-violet-400 mt-1"
    on:click={() => dispatch("zoomOut")}
    title="Zoom out"
  >
    <ZoomOut class="size-5" />
  </button>

  <!-- Screenshot -->
  <button
    class="cursor-pointer flex h-[38px] w-[38px] items-center justify-center rounded text-gray-600 dark:text-zinc-400 transition-all duration-200 hover:bg-gray-100/60 dark:hover:bg-zinc-800 hover:text-violet-600 dark:hover:text-violet-400 mt-1"
    on:click={() => dispatch("downloadChart")}
    title="Screenshot"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 28 28"
      class="h-6 w-6 fill-current"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M11.118 6a.5.5 0 0 0-.447.276L9.809 8H5.5A1.5 1.5 0 0 0 4 9.5v10A1.5 1.5 0 0 0 5.5 21h16a1.5 1.5 0 0 0 1.5-1.5v-10A1.5 1.5 0 0 0 21.5 8h-4.309l-.862-1.724A.5.5 0 0 0 15.882 6h-4.764zm-1.342-.17A1.5 1.5 0 0 1 11.118 5h4.764a1.5 1.5 0 0 1 1.342.83L17.809 7H21.5A2.5 2.5 0 0 1 24 9.5v10a2.5 2.5 0 0 1-2.5 2.5h-16A2.5 2.5 0 0 1 3 19.5v-10A2.5 2.5 0 0 1 5.5 7h3.691l.585-1.17z"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M13.5 18a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm0 1a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z"
      />
    </svg>
  </button>

  <!-- Keyboard Shortcuts Help -->
  <button
    class="cursor-pointer flex h-[38px] w-[38px] items-center justify-center rounded text-gray-600 dark:text-zinc-400 transition-all duration-200 hover:bg-gray-100/60 dark:hover:bg-zinc-800 hover:text-violet-600 dark:hover:text-violet-400 mt-1"
    on:click={() => dispatch("showKeyboardShortcuts")}
    title="Keyboard shortcuts (?)"
  >
    <Keyboard class="size-5" />
  </button>

  <!-- Remove All -->
  <button
    class="cursor-pointer flex h-[38px] w-[38px] items-center justify-center rounded text-gray-600 dark:text-zinc-400 transition-all duration-200 hover:bg-gray-100/60 dark:hover:bg-zinc-800 hover:text-rose-500 mt-1"
    on:click={() => dispatch("removeAllDrawings")}
    title="Remove all drawings"
  >
    <svg viewBox="0 0 28 28" class="h-6 w-6 fill-current">
      <path d={toolIcons.remove} />
    </svg>
  </button>
</div>

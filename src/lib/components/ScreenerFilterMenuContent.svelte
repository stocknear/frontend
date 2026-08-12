<script lang="ts">
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { cn } from "$lib/utils";

  export let side: "top" | "right" | "bottom" | "left" = "bottom";
  export let align: "start" | "center" | "end" = "end";
  export let sideOffset = 10;
  export let alignOffset = 0;
  export let contentClass = "w-fit";
  export let showHeader = true;
</script>

<DropdownMenu.Content
  {side}
  {align}
  {sideOffset}
  {alignOffset}
  class={cn(
    "max-h-[calc(100dvh-1rem)] max-w-[calc(100vw-1rem)] overflow-hidden p-0 shadow-overlay",
    contentClass,
  )}
>
  {#if showHeader && $$slots.header}
    <div
      data-screener-filter-header
      class="shrink-0 border-b border-line bg-popover"
    >
      <slot name="header" />
    </div>
  {/if}
  <div
    data-screener-filter-options
    class="scroller min-h-10 max-h-[min(15rem,calc(100dvh-4.75rem))] overflow-y-auto overscroll-contain p-1.5"
  >
    <slot />
  </div>
</DropdownMenu.Content>

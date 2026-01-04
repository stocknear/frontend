<script lang="ts">
  import { Calendar as CalendarPrimitive } from "bits-ui";
  import ChevronLeft from "lucide-svelte/icons/chevron-left";
  import { buttonVariants } from "$lib/components/shadcn/button/index.js";
  import { cn } from "$lib/utils.js";

  type $$Props = CalendarPrimitive.PrevButtonProps;
  type $$Events = CalendarPrimitive.PrevButtonEvents;

  let className: $$Props["class"] = undefined;
  export { className as class };
</script>

<CalendarPrimitive.PrevButton
  on:click
  class={cn(
    buttonVariants({ variant: "outline" }),
    "h-7 w-7 p-0 border-gray-200/70 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/60 text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-white/80 dark:hover:bg-zinc-900/60 opacity-90 hover:opacity-100",
    className,
  )}
  {...$$restProps}
  let:builder
>
  <slot {builder}>
    <ChevronLeft class="h-4 w-4" />
  </slot>
</CalendarPrimitive.PrevButton>

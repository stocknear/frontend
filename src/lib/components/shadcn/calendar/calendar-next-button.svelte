<script lang="ts">
  import { Calendar as CalendarPrimitive } from "bits-ui";
  import ChevronRight from "lucide-svelte/icons/chevron-right";
  import { buttonVariants } from "$lib/components/shadcn/button/index.js";
  import { cn } from "$lib/utils.js";

  type $$Props = CalendarPrimitive.NextButtonProps;
  type $$Events = CalendarPrimitive.NextButtonEvents;

  let className: $$Props["class"] = undefined;
  export { className as class };
</script>

<CalendarPrimitive.NextButton
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
    <ChevronRight class="h-4 w-4" />
  </slot>
</CalendarPrimitive.NextButton>

<script lang="ts">
  import { Calendar as CalendarPrimitive } from "bits-ui";
  import { cn } from "$lib/utils.js";

  type $$Props = CalendarPrimitive.HeaderProps;

  let className: $$Props["class"] = undefined;
  export { className as class };
</script>

<CalendarPrimitive.Header
  class={cn(
    "relative flex w-full items-center justify-between pb-2 mb-2 border-b border-gray-200/70 dark:border-zinc-800/80",
    className,
  )}
  {...$$restProps}
>
  <slot />
</CalendarPrimitive.Header>

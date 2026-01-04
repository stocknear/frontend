<script lang="ts">
  import { Calendar as CalendarPrimitive } from "bits-ui";
  import { cn } from "$lib/utils.js";

  type $$Props = CalendarPrimitive.HeadCellProps;

  let className: $$Props["class"] = undefined;
  export { className as class };
</script>

<CalendarPrimitive.HeadCell
  class={cn(
    "text-gray-500 dark:text-zinc-400 w-9 rounded text-[0.7rem] font-medium uppercase tracking-wide",
    className,
  )}
  {...$$restProps}
>
  <slot />
</CalendarPrimitive.HeadCell>

<script lang="ts">
  import { Calendar as CalendarPrimitive } from "bits-ui";
  import { cn } from "$lib/utils.js";

  type $$Props = CalendarPrimitive.HeadCellProps;

  let className: $$Props["class"] = undefined;
  export { className as class };
</script>

<CalendarPrimitive.HeadCell
  class={cn(
    "bg-white dark:bg-[#000] text-muted dark:text-white w-9 rounded text-[0.8rem] font-normal",
    className,
  )}
  {...$$restProps}
>
  <slot />
</CalendarPrimitive.HeadCell>

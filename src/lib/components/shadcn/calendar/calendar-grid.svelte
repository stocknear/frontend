<script lang="ts">
  import { Calendar as CalendarPrimitive } from "bits-ui";
  import { cn } from "$lib/utils.js";

  type $$Props = CalendarPrimitive.GridProps;

  let className: $$Props["class"] = undefined;
  export { className as class };
</script>

<CalendarPrimitive.Grid
  class={cn("w-full bg-white dark:bg-[#000] border-none space-y-1", className)}
  {...$$restProps}
>
  <slot />
</CalendarPrimitive.Grid>

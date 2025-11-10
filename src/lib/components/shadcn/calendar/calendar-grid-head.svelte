<script lang="ts">
  import { Calendar as CalendarPrimitive } from "bits-ui";
  import { cn } from "$lib/utils.js";

  type $$Props = CalendarPrimitive.GridHeadProps;

  let className: $$Props["class"] = undefined;
  export { className as class };
</script>

<CalendarPrimitive.GridHead
  class={cn("bg-white dark:bg-[#000]", className)}
  {...$$restProps}
>
  <slot />
</CalendarPrimitive.GridHead>

<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";

  type $$Props = DropdownMenuPrimitive.SeparatorProps;

  let className: $$Props["class"] = undefined;
  export { className as class };
</script>

<DropdownMenuPrimitive.Separator
  class={cn("-mx-1 my-1 h-px bg-gray-300 dark:bg-gray-800", className)}
  {...$$restProps}
/>

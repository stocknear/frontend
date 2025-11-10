<script lang="ts">
  import { Command as CommandPrimitive } from "cmdk-sv";
  import { cn } from "$lib/utils";

  type $$Props = CommandPrimitive.ItemProps;

  export let asChild = false;

  let className: string | undefined | null = undefined;
  export { className as class };
</script>

<CommandPrimitive.Item
  {asChild}
  class={cn(
    "text-white sm:hover:bg-primary sm:hover:text-white aria-selected:bg-primary aria-selected:text-white relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden data-disabled:pointer-events-none data-disabled:opacity-50",
    className,
  )}
  {...$$restProps}
  let:action
  let:attrs
>
  <slot {action} {attrs} />
</CommandPrimitive.Item>

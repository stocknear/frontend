<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
  import { cn, flyAndScale } from "$lib/utils";

  type $$Props = DropdownMenuPrimitive.SubContentProps;
  type $$Events = DropdownMenuPrimitive.SubContentEvents;

  let className: $$Props["class"] = undefined;
  export let transition: $$Props["transition"] = flyAndScale;
  export let transitionConfig: $$Props["transitionConfig"] = {
    x: -10,
    y: 0,
  };
  export { className as class };
</script>

<DropdownMenuPrimitive.SubContent
  {transition}
  {transitionConfig}
  class={cn(
    "z-50 min-w-[8rem] rounded border bg-white dark:bg-default p-1 text-white shadow-lg focus:outline-hidden",
    className,
  )}
  {...$$restProps}
  on:keydown
  on:focusout
  on:pointermove
>
  <slot />
</DropdownMenuPrimitive.SubContent>

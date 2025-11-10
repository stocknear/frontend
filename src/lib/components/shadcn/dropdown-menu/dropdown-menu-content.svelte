<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
  import { cn, flyAndScale } from "$lib/utils";

  type $$Props = DropdownMenuPrimitive.ContentProps;
  type $$Events = DropdownMenuPrimitive.ContentEvents;

  let className: $$Props["class"] = undefined;
  export let sideOffset: $$Props["sideOffset"] = 4;
  export let transition: $$Props["transition"] = flyAndScale;
  export let transitionConfig: $$Props["transitionConfig"] = undefined;
  export { className as class };
</script>

<DropdownMenuPrimitive.Content
  {transition}
  {transitionConfig}
  {sideOffset}
  class={cn(
    "z-50 min-w-[8rem]  rounded border border-gray-300 dark:border-gray-500 bg-white dark:bg-default p-1 text-muted dark:text-white shadow focus:outline-hidden",
    className,
  )}
  {...$$restProps}
  on:keydown
>
  <slot />
</DropdownMenuPrimitive.Content>

<script lang="ts">
  import { Select as SelectPrimitive } from "bits-ui";
  import ChevronDown from "lucide-svelte/icons/chevron-down";
  import { cn } from "$lib/utils";

  type $$Props = SelectPrimitive.TriggerProps;
  type $$Events = SelectPrimitive.TriggerEvents;

  let className: $$Props["class"] = undefined;
  export { className as class };
</script>

<SelectPrimitive.Trigger
  class={cn(
    "border-input bg-default ring-offset-background focus-visible:ring-ring aria-[invalid]:border-destructive [&>span]:data-placeholder:text-white flex h-10 w-full items-center justify-between rounded border border-gray-800 px-3 py-2 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
    className,
  )}
  {...$$restProps}
  let:builder
  on:click
  on:keydown
>
  <slot {builder} />
  <div>
    <ChevronDown class="h-4 w-4 opacity-50" />
  </div>
</SelectPrimitive.Trigger>

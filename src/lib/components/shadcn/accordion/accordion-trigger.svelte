<script lang="ts">
  import { Accordion as AccordionPrimitive } from "bits-ui";
  import ChevronDown from "lucide-svelte/icons/chevron-down";
  import { cn } from "$lib/utils";

  type $$Props = AccordionPrimitive.TriggerProps;
  type $$Events = AccordionPrimitive.TriggerEvents;

  let className: $$Props["class"] = undefined;
  export let level: AccordionPrimitive.HeaderProps["level"] = 3;
  export { className as class };
</script>

<AccordionPrimitive.Header {level} class="flex">
  <AccordionPrimitive.Trigger
    class={cn(
      "cursor-pointer flex flex-1 items-center justify-between  transition-all [&[data-state=open]>svg1]:rotate-180",
      className,
    )}
    {...$$restProps}
    on:click
  >
    <slot />
    <ChevronDown
      class="text-muted dark:text-white h-4 w-4 sm:absolute sm:right-5 shrink-0 transition-transform duration-200"
    />
  </AccordionPrimitive.Trigger>
</AccordionPrimitive.Header>

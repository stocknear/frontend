<script lang="ts">
  import { Command as CommandPrimitive } from "cmdk-sv";
  import Search from "lucide-svelte/icons/search";
  import { cn } from "$lib/utils";

  type $$Props = CommandPrimitive.InputProps;

  let className: string | undefined | null = undefined;
  export { className as class };
  export let value: string = "";
</script>

<svelte:head>
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
  />
</svelte:head>

<div class="flex items-center border-b px-2" data-cmdk-input-wrapper="">
  <Search class="mr-2 h-4 w-4 shrink-0 opacity-50" />
  <CommandPrimitive.Input
    class={cn(
      "placeholder:text-muted-foreground flex h-11 w-full rounded bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...$$restProps}
    bind:value
  />
</div>

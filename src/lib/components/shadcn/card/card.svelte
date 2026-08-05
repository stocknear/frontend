<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "$lib/utils";

  type $$Props = HTMLAttributes<HTMLDivElement>;

  let className: $$Props["class"] = undefined;
  export { className as class };
</script>

<div
  class={cn(
    "rounded-control border border-line bg-white dark:bg-default text-fg shadow",
    className,
  )}
  {...$$restProps}
>
  <slot />
</div>

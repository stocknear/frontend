<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import ChevronRight from "lucide-svelte/icons/chevron-right";
	import { cn } from "$lib/utils";

	type $$Props = DropdownMenuPrimitive.SubTriggerProps & {
		inset?: boolean;
	};
	type $$Events = DropdownMenuPrimitive.SubTriggerEvents;

	let className: $$Props["class"] = undefined;
	export let inset: $$Props["inset"] = undefined;
	export { className as class };
</script>

<DropdownMenuPrimitive.SubTrigger
	class={cn(
		"flex cursor-default select-none items-center rounded-control px-2 py-1.5 text-sm outline-hidden data-highlighted:bg-surface-raised data-[state=open]:bg-surface-raised data-highlighted:text-fg data-[state=open]:text-fg",
		inset && "pl-8",
		className
	)}
	{...$$restProps}
	on:click
	on:keydown
	on:focusin
	on:focusout
	on:pointerleave
	on:pointermove
>
	<slot />
	<ChevronRight class="ml-auto h-4 w-4" />
</DropdownMenuPrimitive.SubTrigger>

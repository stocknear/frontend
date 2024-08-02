<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "$lib/utils";

	type $$Props = HTMLAttributes<HTMLTableRowElement> & {
		"data-state"?: unknown;
	};

	let className: $$Props["class"] = undefined;
	export { className as class };
</script>

<tr
	class={cn(
		"border-b border-gray-800 transition-colors data-[state=selected]:bg-muted",
		className
	)}
	{...$$restProps}
	on:click
	on:keydown
>
	<slot />
</tr>
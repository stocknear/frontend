<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "$lib/utils";

	type $$Props = HTMLAttributes<HTMLDivElement>;

	let className: $$Props["class"] = undefined;
	export { className as class };
</script>

<div
	class={cn("rounded-lg border border-gray-800 bg-[#09090B] text-white shadow-sm", className)}
	{...$$restProps}
>
	<slot />
</div>
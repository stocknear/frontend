<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "$lib/utils";

	type $$Props = HTMLAttributes<HTMLTableSectionElement>;

	let className: $$Props["class"] = undefined;
	export { className as class };
</script>

<tbody class={cn("[&_tr:last-child]:border-0 scroller", className)} {...$$restProps}>
	<slot />
</tbody>



<style>
.scroller {
	scrollbar-width: thin;
}
</style>
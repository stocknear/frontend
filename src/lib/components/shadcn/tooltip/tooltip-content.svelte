<script lang="ts">
	import { Tooltip as TooltipPrimitive } from "bits-ui";
	import { cn, flyAndScale } from "$lib/utils";

	type $$Props = TooltipPrimitive.ContentProps;

	let className: $$Props["class"] = undefined;
	export let sideOffset: $$Props["sideOffset"] = 1;
	export let transition: $$Props["transition"] = flyAndScale;
	export let transitionConfig: $$Props["transitionConfig"] = {
		y: 8,
		duration: 0,
		delay: 0,
	};
	export { className as class };
</script>

<TooltipPrimitive.Content
	{transition}
	{transitionConfig}
	{sideOffset}
	class={cn(
		"z-50 overflow-hidden rounded-md border bg-[#fff] px-3 py-1.5 text-sm text-black shadow-md",
		className
	)}
	{...$$restProps}
>
	<slot />
</TooltipPrimitive.Content>
<script lang="ts">
	import { Calendar as CalendarPrimitive } from "bits-ui";
	import { buttonVariants } from "$lib/components/shadcn/button/index.js";
	import { cn } from "$lib/utils.js";

	type $$Props = CalendarPrimitive.DayProps;
	type $$Events = CalendarPrimitive.DayEvents;

	export let date: $$Props["date"];
	export let month: $$Props["month"];
	let className: $$Props["class"] = undefined;
	export { className as class };
</script>

<CalendarPrimitive.Day
	on:click
	{date}
	{month}
	class={cn(
		buttonVariants({ variant: "ghost" }),
		"h-9 w-9 p-0 font-normal rounded-full",
		"hover:bg-gray-100/70 dark:hover:bg-zinc-900/60 hover:text-gray-900 dark:hover:text-white",
		// Today
		"[&[data-today]:not([data-selected])]:ring-1 [&[data-today]:not([data-selected])]:ring-gray-300/70 dark:[&[data-today]:not([data-selected])]:ring-zinc-700/80",
		// Selected
		"data-selected:bg-gray-200/80 data-selected:text-gray-900 data-selected:hover:bg-gray-200/80 data-selected:focus:bg-gray-200/80 data-selected:font-semibold data-selected:opacity-100 dark:data-selected:bg-zinc-800/80 dark:data-selected:text-white dark:data-selected:hover:bg-zinc-800/80 dark:data-selected:focus:bg-zinc-800/80",
		// Disabled
		"data-disabled:text-gray-400/70 dark:data-disabled:text-zinc-500/70 data-disabled:opacity-50",
		// Unavailable
		"data-unavailable:text-rose-500/70 data-unavailable:line-through",
		// Outside months
		"data-outside-month:text-gray-400/60 dark:data-outside-month:text-zinc-600/60 data-outside-month:pointer-events-none data-outside-month:opacity-40",
		className
	)}
	{...$$restProps}
	let:selected
	let:disabled
	let:unavailable
	let:builder
>
	<slot {selected} {disabled} {unavailable} {builder}>
		{date.day}
	</slot>
</CalendarPrimitive.Day>

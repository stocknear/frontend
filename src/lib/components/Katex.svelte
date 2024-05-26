<script>
	import katex from "katex";
	export let math;
	export let displayMode = false;
	export let formula = false;

	const options = {
		displayMode: displayMode,
		throwOnError: false
	}
	
	$: katexString = katex.renderToString(math, options);
</script>

<svelte:head>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.css" integrity="sha384-AfEj0r4/OFrOo5t7NnNe46zW/tFgW6x/bCJG8FqQCEo3+Aro6EYUG4+cU+KJWu/X" crossorigin="anonymous">
</svelte:head>

<h1 class="{formula === false ? 'hidden' : ''} text-gray-200 text-lg mt-3 sm:text-xl underline italic">
    Formula:
</h1>

<div class="mt-1 text-sm sm:text-[1rem]">
    {@html katexString}
</div>
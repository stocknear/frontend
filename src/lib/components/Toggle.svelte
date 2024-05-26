<script>
	export let lines
	let open = true
	const toggle = () => open = !open
</script>

<div class="" class:open class:lines on:click={toggle}>
	<!-- if it's a "lines" style  -->
	{#if lines}
	{open ? '' : '↕️'}
	{:else}
	{open ? '[-]' : '[+] comments collapsed'}
	{/if}
</div>

<div style:display={open ? 'block' : 'none'}>
	<slot />
</div>

<style>
	.toggle{
		cursor: pointer;
	}
	.toggle.lines {
		width: 0.5px;
		background: #334155;
		height: 100%;
		display: block;
		position: absolute;
		left: 0;
		top: 0;
	}
	.toggle.lines:hover {
		background: #ddd;
	}
</style>
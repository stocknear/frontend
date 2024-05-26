<script>
	import { onMount} from 'svelte'

	let el
	let show = false;
	
	onMount(() => {
		const observer = new IntersectionObserver((entries) => {
			const entry = entries[0]
			if (entry.target !== el) return
			show = entry.isIntersecting
			if (show) observer.disconnect()
		})
		observer.observe(el)
		return () => observer.disconnect()
	})
</script>

{#if show}
	<slot />
{:else}
	<div bind:this={el}/> 
{/if}
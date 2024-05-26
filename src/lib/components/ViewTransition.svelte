<script lang="ts">
	import { onNavigate } from '$app/navigation'
	import { screenWidth } from '$lib/store'

	if ($screenWidth < 640) {
		
		onNavigate((navigation) => {
			if (!document.startViewTransition) return

			return new Promise((resolve) => {
				document?.startViewTransition(async () => {
					resolve()
					await navigation.complete
				})
			})
		})

	}
	
</script>

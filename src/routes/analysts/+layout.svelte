<script lang="ts">
  import { onMount } from "svelte";

  // Lazy-load the shared login modal so the FollowAnalystButton's
  // `userLogin` modal exists for guests on all /analysts routes.
  // (LoginPopup defines id="userLogin" and is otherwise only mounted on
  // certain other routes.) Its `form` prop is optional (read via form?.).
  let LoginPopup: any;

  onMount(async () => {
    LoginPopup = (await import("$lib/components/LoginPopup.svelte")).default;
  });
</script>

<slot />

{#if LoginPopup}
  <svelte:component this={LoginPopup} />
{/if}

<script>
  import { onMount } from "svelte";

  let el;
  let show = false;

  onMount(() => {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.target !== el) return;
      show = entry.isIntersecting;
      if (show) observer.disconnect();
    });
    observer.observe(el);
    return () => observer.disconnect();
  });
</script>

{#if show}
  <slot />
{:else}
  <div bind:this={el} class="flex justify-center items-center h-80">
    <div class="relative">
      <label
        class="shadow bg-default dark:bg-secondary rounded h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      >
        <span
          class="loading loading-spinner loading-md text-white dark:text-white"
        ></span>
      </label>
    </div>
  </div>
{/if}

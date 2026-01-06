<script lang="ts">
  export type BreadCrumbItem = {
    label: string;
    href?: string;
  };

  export let items: BreadCrumbItem[] = [];
  export let tag: keyof HTMLElementTagNameMap = "div";
  export let ariaLabel: string | undefined;
  export let containerClass =
    "text-xs sm:text-sm breadcrumbs text-gray-800 dark:text-zinc-300";
  export let listClass = "";
  export let linkClass =
    "text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition";
  export let itemClass = "text-gray-800 dark:text-zinc-300";
</script>

{#if items?.length}
  <svelte:element this={tag} class={containerClass} aria-label={ariaLabel}>
    <ul class={listClass}>
      {#each items as item}
        <li class={itemClass}>
          {#if item?.href}
            <a href={item.href} class={linkClass}>{item.label}</a>
          {:else}
            {item.label}
          {/if}
        </li>
      {/each}
    </ul>
  </svelte:element>
{:else}
  <svelte:element this={tag} class={containerClass} aria-label={ariaLabel}>
    <ul class={listClass}>
      <slot />
    </ul>
  </svelte:element>
{/if}

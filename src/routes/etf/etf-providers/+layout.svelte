<script lang="ts">
  import { page } from "$app/stores";
  import { formatETFName } from "$lib/utils";

  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import {
    etf_breadcrumb_home,
    etf_breadcrumb_providers,
    etf_providers_main_name,
  } from "$lib/paraglide/messages";

  export let data;
  let currentPath = "";

  $: {
    // Positional indexing broke on localized routes (parts[3] became
    // "etf-providers"); the route param is prefix-independent.
    const providerSlug = $page?.params?.slug ?? "";
    currentPath = providerSlug ? (formatETFName(providerSlug) ?? "") : "";
  }
</script>

<section
  class="w-full max-w-(--breakpoint-2xl) overflow-hidden min-h-screen pb-20 pt-6 px-4 lg:px-6 text-fg"
>
  <BreadCrumb
    containerClass="text-xs sm:text-sm breadcrumbs text-fg-muted"
  >
    <li>
      <a
        href="/"
        class="text-fg-muted hover:text-accent transition"
        >{etf_breadcrumb_home()}</a
      >
    </li>
    <li>
      <a
        href="/etf/etf-providers"
        class="text-fg-muted hover:text-accent transition"
        >{etf_breadcrumb_providers()}</a
      >
    </li>
    {#if currentPath?.length !== 0 && typeof currentPath !== undefined}
      <li class="text-fg-muted">{currentPath}</li>
    {/if}
  </BreadCrumb>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex flex-col lg:flex-row justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class=" border-b border-line">
            <h1
              class="mb-2 type-h1 text-fg"
            >
              {etf_providers_main_name()}
            </h1>
          </div>

          <div class="w-full m-auto overflow-hidden">
            <div class="w-full flex flex-col justify-center items-center">
              <slot />
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</section>

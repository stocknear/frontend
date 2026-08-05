<script lang="ts">
  import { deLocalizeHref } from "$lib/paraglide/runtime.js";
  import { page } from "$app/stores";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import {
    common_home,
    industry_breadcrumb_label,
    industry_page_title,
    industry_tab_industries,
    industry_tab_overview,
    industry_tab_sectors,
  } from "$lib/paraglide/messages.js";

  export let data;

  function handleMode(i) {
    activeIdx = i;
  }

  const tabs = [
    {
      title: industry_tab_overview,
    },
    {
      title: industry_tab_sectors,
    },
    {
      title: industry_tab_industries,
    },
  ];

  let activeIdx = 0;

  // Subscribe to the $page store to reactively update the activeIdx based on the URL
  $: if (deLocalizeHref($page.url.pathname) === "/industry") {
    activeIdx = 0;
  } else if (deLocalizeHref($page.url.pathname).startsWith("/industry/sectors")) {
    activeIdx = 1;
  } else if (deLocalizeHref($page.url.pathname).startsWith("/industry/all")) {
    activeIdx = 2;
  }
</script>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-6 px-4 lg:px-6 text-fg"
>
  <BreadCrumb
    containerClass="text-xs sm:text-sm breadcrumbs text-fg-muted"
  >
    <li>
      <a
        href="/"
        class="text-fg-muted hover:text-accent transition"
        >{common_home()}</a
      >
    </li>
    <li>
      <span class="text-fg-muted"
        >{industry_breadcrumb_label()}</span
      >
    </li>
  </BreadCrumb>

  <div class="mt-10 sm:mt-5 w-full m-auto mb-10 overflow-hidden">
    <div class="mb-2 border-b border-line">
      <h1
        class="mb-2 type-h1 text-fg"
      >
        {industry_page_title()}
      </h1>
    </div>

    <nav
      class="border-b border-line overflow-x-auto whitespace-nowrap"
    >
      <ul
        class="flex flex-row items-center w-full gap-1 pb-2 text-sm sm:text-base"
      >
        {#each tabs as item, i}
          <a
            href={i === 0
              ? "/industry"
              : i === 1
                ? "/industry/sectors"
                : "/industry/all"}
            on:click={() => handleMode(i)}
            class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {activeIdx ===
            i
              ? 'border-line bg-gray-100/70 dark:bg-zinc-900/60 text-accent'
              : 'border-transparent text-fg-muted hover:text-accent hover:border-gray-300/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
          >
            {item.title()}
          </a>
        {/each}
      </ul>
    </nav>

    <div class="w-full flex flex-col justify-center items-center">
      <div class="flex justify-center w-full m-auto overflow-hidden">
        <main class="w-full">
          <slot />
        </main>
      </div>
    </div>
  </div>
</section>

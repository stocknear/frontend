<script lang="ts">
  import { deLocalizeHref } from "$lib/paraglide/runtime.js";
  import { page } from "$app/stores";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import {
    ipos_breadcrumb_data,
    ipos_breadcrumb_home,
    ipos_main_name_recent,
    ipos_main_name_statistics,
    ipos_tab_latest,
    ipos_tab_recent,
    ipos_tab_statistics,
  } from "$lib/paraglide/messages";

  export let data;

  let displaySection = "Latest";

  // The rail is driven by the calendar itself. It used to be a literal
  // ["Latest", "2026", … "2019"] array plus a hardcoded startYear, which meant
  // a manual edit every January and a floor that no longer matched the data.
  $: availableYears = [
    ...new Set(
      (data?.getIPOCalendar ?? [])
        .map((item) => item?.ipoDate?.slice(0, 4))
        .filter(Boolean),
    ),
  ].sort((a, b) => b.localeCompare(a));

  // Get year from URL if it looks like /ipos/2024 etc. Matching any four-digit
  // segment keeps this working under a /de/ prefix.
  $: {
    const maybeYear = $page.url.pathname
      .split("/")
      ?.find((p) => /^\d{4}$/.test(p));

    displaySection = availableYears.includes(maybeYear) ? maybeYear : "Latest";
  }

  // These messages already existed in the catalog; the rail was rendering
  // hardcoded English over the top of them.
  const tabs = [
    { title: ipos_tab_recent(), path: "/ipos" },
    { title: ipos_tab_statistics(), path: "/ipos/statistics" },
  ];

  let activeIdx = 0;

  $: if (deLocalizeHref($page.url.pathname) === "/ipos") {
    activeIdx = 0;
  } else if (deLocalizeHref($page.url.pathname).startsWith("/ipos/statistics")) {
    activeIdx = 1;
  }
</script>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden pb-20 pt-6 px-4 lg:px-6 text-fg"
>
  <BreadCrumb
    containerClass="text-xs sm:text-sm breadcrumbs text-fg-muted"
  >
    <li>
      <a
        href="/"
        class="text-fg-muted hover:text-accent transition"
        >{ipos_breadcrumb_home()}</a
      >
    </li>
    <li class="text-fg-muted">{ipos_breadcrumb_data()}</li>
  </BreadCrumb>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:pr-5">
          <h1
            class="mb-6 type-h1 text-fg"
          >
            {activeIdx === 0
              ? ipos_main_name_recent()
              : activeIdx === 1
                ? ipos_main_name_statistics()
                : "IPO News"}
          </h1>

          <nav
            class="border-b border-line overflow-x-auto whitespace-nowrap"
          >
            <ul
              class="flex flex-row items-center w-full gap-1 pb-2 text-sm sm:text-base"
            >
              {#each tabs as item, i}
                <a
                  href={item?.path}
                  class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {activeIdx ===
                  i
                    ? 'border-line bg-gray-100/70 dark:bg-zinc-900/60 text-accent'
                    : 'border-transparent text-fg-muted hover:text-accent hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                >
                  {item.title}
                </a>
              {/each}
            </ul>
          </nav>

          {#if activeIdx === 0}
            <nav
              class="border-b border-line overflow-x-auto whitespace-nowrap mt-2"
            >
              <ul
                class="flex flex-row items-center w-full gap-1 pb-2 text-sm sm:text-base"
              >
                {#each ["Latest", ...availableYears] as item}
                  {#if item !== "Latest"}
                    <a
                      href={`/ipos/${item}`}
                      on:click={() => (displaySection = item)}
                      class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySection ===
                      item
                        ? 'border-line bg-gray-100/70 dark:bg-zinc-900/60 text-accent'
                        : 'border-transparent text-fg-muted hover:text-accent hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                    >
                      {item}
                    </a>
                  {:else}
                    <a
                      href={`/ipos`}
                      on:click={() => (displaySection = item)}
                      class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySection ===
                      item
                        ? 'border-line bg-gray-100/70 dark:bg-zinc-900/60 text-accent'
                        : 'border-transparent text-fg-muted hover:text-accent hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                    >
                      {ipos_tab_latest()}
                    </a>
                  {/if}
                {/each}
              </ul>
            </nav>
          {/if}

          <slot />
        </main>
      </div>
    </div>
  </div>
</section>

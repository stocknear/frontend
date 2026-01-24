<script lang="ts">
  import { page } from "$app/stores";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import * as m from "$lib/paraglide/messages";

  export let data;

  let navigation: { title: number; link: string }[] = [];
  let displaySection = "Latest";

  const startYear = 2019;
  const currentYear = new Date().getFullYear();

  for (let year = currentYear; year >= startYear; year--) {
    navigation.push({ title: year, link: `/ipos/${year}` });
  }

  // Get year from URL if it looks like /ipos/2024 etc.
  $: {
    const parts = $page.url.pathname.split("/");
    const maybeYear = parts?.find((p) => /^\d{4}$/.test(p));

    const yearNum = maybeYear ? Number(maybeYear) : null;

    displaySection =
      yearNum && yearNum >= startYear && yearNum <= currentYear
        ? String(yearNum)
        : "Latest";
  }

  const tabs = [
    { title: "Recent", path: "/ipos" },
    { title: "Statistics", path: "/ipos/statistics" },
  ];

  let activeIdx = 0;

  $: if ($page.url.pathname === "/ipos") {
    activeIdx = 0;
  } else if ($page.url.pathname.startsWith("/ipos/statistics")) {
    activeIdx = 1;
  }
</script>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden pb-20 pt-6 px-4 lg:px-6 text-gray-700 dark:text-zinc-200"
>
  <BreadCrumb
    containerClass="text-xs sm:text-sm breadcrumbs text-gray-800 dark:text-zinc-300"
  >
    <li>
      <a
        href="/"
        class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
        >{m.ipos_breadcrumb_home()}</a
      >
    </li>
    <li class="text-gray-800 dark:text-zinc-300">{m.ipos_breadcrumb_data()}</li>
  </BreadCrumb>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:pr-5">
          <h1
            class="mb-6 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
          >
            {activeIdx === 0
              ? m.ipos_main_name_recent()
              : activeIdx === 1
                ? m.ipos_main_name_statistics()
                : "IPO News"}
          </h1>

          <nav
            class="border-b border-gray-300 dark:border-zinc-700 overflow-x-auto whitespace-nowrap"
          >
            <ul
              class="flex flex-row items-center w-full gap-1 pb-2 text-sm sm:text-base"
            >
              {#each tabs as item, i}
                <a
                  href={item?.path}
                  class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {activeIdx ===
                  i
                    ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                    : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                >
                  {item.title}
                </a>
              {/each}
            </ul>
          </nav>

          {#if activeIdx === 0}
            <nav class="border-b border-gray-300 dark:border-zinc-700 overflow-x-auto whitespace-nowrap mt-2">
              <ul class="flex flex-row items-center w-full gap-1 pb-2 text-sm sm:text-base">
                {#each ["Latest", "2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019"] as item}
                  {#if item !== "Latest"}
                    <a
                      href={`/ipos/${item}`}
                      on:click={() => (displaySection = item)}
                      class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySection ===
                      item
                        ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                        : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                    >
                      {item}
                    </a>
                  {:else}
                    <a
                      href={`/ipos`}
                      on:click={() => (displaySection = item)}
                      class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySection ===
                      item
                        ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                        : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                    >
                      {item}
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

<script lang="ts">
  import { page } from "$app/stores";

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
  <div class="text-xs sm:text-sm breadcrumbs text-gray-800 dark:text-zinc-300">
    <ul>
      <li>
        <a
          href="/"
          class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          >Home</a
        >
      </li>
      <li class="text-gray-800 dark:text-zinc-300">IPO Data</li>
    </ul>
  </div>

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
              ? "Recent IPOs"
              : activeIdx === 1
                ? "IPO Statistics"
                : "IPO News"}
          </h1>

          <nav
            class="pb-2 border-b border-gray-300 dark:border-zinc-700 overflow-x-auto whitespace-nowrap"
          >
            <ul
              class="flex flex-row items-center w-full text-sm sm:text-base gap-2"
            >
              {#each tabs as item, i}
                <a
                  href={item?.path}
                  class="px-4 py-2 rounded-full cursor-pointer transition {activeIdx ===
                  i
                    ? 'text-gray-900 dark:text-white bg-gray-100/70 dark:bg-zinc-900/60 font-semibold'
                    : 'text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400'}"
                >
                  {item.title}
                </a>
              {/each}
            </ul>
          </nav>

          {#if activeIdx === 0}
            <nav class="overflow-x-auto whitespace-nowrap mt-2">
              <ul class="flex flex-row items-center w-full gap-2">
                {#each ["Latest", "2025", "2024", "2023", "2022", "2021", "2020", "2019"] as item}
                  {#if item !== "Latest"}
                    <a
                      href={`/ipos/${item}`}
                      on:click={() => (displaySection = item)}
                      class="px-3 py-1.5 rounded-full cursor-pointer transition text-sm sm:text-base {displaySection ===
                      item
                        ? 'text-gray-900 dark:text-white bg-gray-100/70 dark:bg-zinc-900/60 font-semibold'
                        : 'text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400'}"
                    >
                      {item}
                    </a>
                  {:else}
                    <a
                      href={`/ipos`}
                      on:click={() => (displaySection = item)}
                      class="px-3 py-1.5 rounded-full cursor-pointer transition text-sm sm:text-base {displaySection ===
                      item
                        ? 'text-gray-900 dark:text-white bg-gray-100/70 dark:bg-zinc-900/60 font-semibold'
                        : 'text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400'}"
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

<style lang="scss">
  .scrollbar {
    display: grid;
    grid-gap: 17px;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    grid-auto-flow: column;
    overflow-x: auto;
    scrollbar-width: thin; /* Hide the default scrollbar in Firefox */
    scrollbar-color: transparent transparent; /* Hide the default scrollbar in Firefox */
  }

  /* Custom scrollbar for Webkit (Chrome, Safari) */
  .scrollbar::-webkit-scrollbar {
    width: 0; /* Hide the width of the scrollbar */
    height: 0; /* Hide the height of the scrollbar */
  }

  .scrollbar::-webkit-scrollbar-thumb {
    background: transparent; /* Make the thumb transparent */
  }

  .navmenu {
    display: flex;
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    white-space: nowrap;
  }
</style>

<script lang="ts">
  import { page } from "$app/stores";

  export let data;

  const tabs = [
    {
      title: "Gainers",
      path: "/market-mover/gainers",
    },
    {
      title: "Losers",
      path: "/market-mover/losers",
    },
    {
      title: "Active",
      path: "/market-mover/active",
    },
    {
      title: "Pre-Market",
      path: "/market-mover/premarket/gainers",
    },
    {
      title: "After-Hours",
      path: "/market-mover/afterhours/gainers",
    },
  ];

  let activeIdx = 0;

  // Subscribe to the $page store to reactively update the activeIdx based on the URL
  $: if ($page.url.pathname === "/market-mover/gainers") {
    activeIdx = 0;
  } else if ($page.url.pathname.startsWith("/market-mover/losers")) {
    activeIdx = 1;
  } else if ($page.url.pathname.startsWith("/market-mover/active")) {
    activeIdx = 2;
  } else if ($page.url.pathname.startsWith("/market-mover/premarket")) {
    activeIdx = 3;
  } else if ($page.url.pathname.startsWith("/market-mover/afterhours")) {
    activeIdx = 4;
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
          class="text-gray-800 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition"
          >Home</a
        >
      </li>
      <li class="text-gray-800 dark:text-zinc-300">Market Mover</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:pr-5">
          <div class="mb-2 border-b border-gray-300 dark:border-zinc-700">
            <h1
              class="mb-2 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              Market Mover
            </h1>
          </div>

          <nav
            class="border-b border-gray-300 dark:border-zinc-700 overflow-x-auto whitespace-nowrap"
          >
            <ul
              class="flex flex-row items-center w-full gap-1 pb-2 text-sm sm:text-base"
            >
              {#each tabs as item, index}
                <a
                  href={item?.path}
                  class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {activeIdx ===
                  index
                    ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                    : 'border-transparent text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                >
                  {item.title}
                </a>
              {/each}
            </ul>
          </nav>

          <div class="mt-2">
            <slot />
          </div>
        </main>
      </div>
    </div>
  </div>
</section>

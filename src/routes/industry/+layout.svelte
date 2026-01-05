<script lang="ts">
  import { page } from "$app/stores";

  export let data;

  function handleMode(i) {
    activeIdx = i;
  }

  const tabs = [
    {
      title: "Overview",
    },
    {
      title: "Sectors",
    },
    {
      title: "Industries",
    },
  ];

  let activeIdx = 0;

  // Subscribe to the $page store to reactively update the activeIdx based on the URL
  $: if ($page.url.pathname === "/industry") {
    activeIdx = 0;
  } else if ($page.url.pathname.startsWith("/industry/sectors")) {
    activeIdx = 1;
  } else if ($page.url.pathname.startsWith("/industry/all")) {
    activeIdx = 2;
  }
</script>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-6 px-4 lg:px-6 text-gray-700 dark:text-zinc-200"
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
      <li><span class="text-gray-800 dark:text-zinc-300">Industry</span></li>
    </ul>
  </div>

  <div class="mt-10 sm:mt-5 w-full m-auto mb-10 overflow-hidden">
    <div class="mb-6">
      <h1
        class="mb-1 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
      >
        Stock Sectors & Industries
      </h1>
    </div>

    <nav
      class="border-b border-gray-300 dark:border-zinc-700 overflow-x-auto whitespace-nowrap"
    >
      <ul class="mb-2 flex flex-row items-center w-full text-sm sm:text-base">
        {#each tabs as item, i}
          <a
            href={i === 0
              ? "/industry"
              : i === 1
                ? "/industry/sectors"
                : "/industry/all"}
            on:click={() => handleMode(i)}
            class="px-4 py-2 rounded-full cursor-pointer transition {activeIdx ===
            i
              ? 'text-gray-900 dark:text-white bg-gray-100/70 dark:bg-zinc-900/60 font-semibold'
              : 'text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400'}"
          >
            {item.title}
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

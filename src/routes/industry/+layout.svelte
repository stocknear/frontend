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
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pt-5 px-4 lg:px-3 mb-20"
>
  <div class="text-sm sm:text-[1rem] breadcrumbs">
    <ul>
      <li><a href="/" class="text-muted dark:text-gray-300">Home</a></li>
      <li><span class="text-muted dark:text-gray-300">Industry</span></li>
    </ul>
  </div>

  <div class="mt-10 sm:mt-5 w-full m-auto mb-10 overflow-hidden">
    <div class="mb-6">
      <h1 class="mb-1 text-2xl sm:text-3xl font-bold">
        Stock Sectors & Industries
      </h1>
    </div>

    <nav
      class="border-[#2C6288] dark:border-white border-b-[2px] overflow-x-auto whitespace-nowrap"
    >
      <ul class="flex flex-row items-center w-full text-[1rem] sm:text-lg">
        {#each tabs as item, i}
          <a
            href={i === 0
              ? "/industry"
              : i === 1
                ? "/industry/sectors"
                : "/industry/all"}
            on:click={() => handleMode(i)}
            class="p-2 px-5 cursor-pointer {activeIdx === i
              ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
              : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
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

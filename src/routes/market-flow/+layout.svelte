<script lang="ts">
  import { page } from "$app/stores";

  export let data;

  const tabs = [
    {
      title: "Overview",
      path: "/market-flow",
    },
    {
      title: "Sector Flow",
      path: "/market-flow/sector-flow",
    },
  ];

  let activeIdx = 0;

  // Subscribe to the $page store to reactively update the activeIdx based on the URL
  $: if ($page.url.pathname === "/market-flow") {
    activeIdx = 0;
  } else if ($page.url.pathname.startsWith("/market-flow/sector-flow")) {
    activeIdx = 1;
  }
</script>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pt-5 px-4 lg:px-3 text-muted dark:text-white"
>
  <div class="text-sm sm:text-[1rem] breadcrumbs">
    <ul>
      <li>
        <a
          href="/"
          class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          >Home</a
        >
      </li>
      <li class="text-muted dark:text-gray-300">Market Flow</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5 sm:max-w-[1400px]">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex flex-col lg:flex-row justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class="mb-6 border-[#2C6288] dark:border-white border-b-[2px]">
            <h1 class="mb-1 text-2xl sm:text-3xl font-bold">Market Flow</h1>
          </div>

          <slot />
        </main>
      </div>
    </div>
  </div>
</section>

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
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden pb-20 pt-5 px-4 lg:px-3 text-muted dark:text-white"
>
  <div class="text-sm sm:text-[1rem] breadcrumbs">
    <ul>
      <li><a href="/" class="text-muted dark:text-gray-300">Home</a></li>
      <li class="text-muted dark:text-gray-300">Market Mover</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:pr-5">
          <h1 class="mb-6 text-2xl sm:text-3xl font-bold">Market Mover</h1>

          <nav
            class="border-[#2C6288] dark:border-white border-b-[2px] overflow-x-auto whitespace-nowrap"
          >
            <ul
              class="flex flex-row items-center w-full text-[1rem] sm:text-lg"
            >
              {#each tabs as item, index}
                <a
                  href={item?.path}
                  class="p-2 px-5 cursor-pointer {activeIdx === index
                    ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                    : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
                >
                  {item.title}
                </a>
              {/each}
            </ul>
          </nav>

          <slot />
        </main>
      </div>
    </div>
  </div>
</section>

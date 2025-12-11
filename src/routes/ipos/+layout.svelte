<script lang="ts">
  import { page } from "$app/stores";

  export let data;

  let navigation = [];
  let displaySection = "Latest";

  for (let year = 2025; year >= 2019; year--) {
    navigation.push({ title: year, link: `/ipos/${year}` });
  }

  $: {
    if ($page.url.pathname) {
      const parts = $page?.url?.pathname?.split("/");
      const sectionMap = {
        "2025": "2025",
        "2024": "2024",
        "2023": "2023",
        "2022": "2022",
        "2021": "2021",
        "2020": "2020",
        "2019": "2019",
      };
      displaySection =
        sectionMap[
          parts?.find((part) => Object?.keys(sectionMap)?.includes(part))
        ] || "Latest";
    }
  }

  const tabs = [
    {
      title: "Recent",
      path: "/ipos",
    },
    {
      title: "Statistics",
      path: "/ipos/statistics",
    },
  ];

  let activeIdx = 0;

  // Subscribe to the $page store to reactively update the activeIdx based on the URL
  $: if ($page.url.pathname === "/ipos") {
    activeIdx = 0;
  } else if ($page.url.pathname.startsWith("/ipos/statistics")) {
    activeIdx = 1;
  }
</script>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden pb-20 pt-5 px-4 lg:px-3"
>
  <div class="text-sm sm:text-[1rem] breadcrumbs">
    <ul>
      <li>
        <a href="/" class="text-muted dark:text-gray-300">Home</a>
      </li>
      <li class="text-muted dark:text-gray-300">IPO Data</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:pr-5">
          <h1 class="mb-6 text-2xl sm:text-3xl font-bold">
            {activeIdx === 0
              ? "Recent IPOs"
              : activeIdx === 1
                ? "IPO Statistics"
                : "IPO News"}
          </h1>

          <nav
            class=" border-[#2C6288] dark:border-white border-b-[2px] overflow-x-auto whitespace-nowrap"
          >
            <ul class="flex flex-row items-center w-full text-lg">
              {#each tabs as item, i}
                <a
                  href={item?.path}
                  class="p-2 px-5 cursor-pointer {activeIdx === i
                    ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                    : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
                >
                  {item.title}
                </a>
              {/each}
            </ul>
          </nav>

          {#if activeIdx === 0}
            <nav class="overflow-x-auto whitespace-nowrap">
              <ul class="flex flex-row items-center w-full">
                {#each ["Latest", "2025", "2024", "2023", "2022", "2021", "2020", "2019"] as item}
                  {#if item !== "Latest"}
                    <a
                      href={`/ipos/${item}`}
                      on:click={() => (displaySection = item)}
                      class="p-2 px-5 cursor-pointer {displaySection === item
                        ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                        : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
                    >
                      {item}
                    </a>
                  {:else}
                    <a
                      href={`/ipos`}
                      on:click={() => (displaySection = item)}
                      class="p-2 px-5 cursor-pointer {displaySection === item
                        ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                        : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
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

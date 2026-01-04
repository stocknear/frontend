<script lang="ts">
  import { etfTicker } from "$lib/store";
  import { page } from "$app/stores";

  export let data;

  let displaySubSection = "overview";

  function changeSubSection(state) {
    const subSectionMap = {
      dex: "/options/dex",
      strike: "/options/dex/strike",
      expiry: "/options/dex/expiry",
    };

    if (state !== "overview" && subSectionMap[state]) {
      displaySubSection = state;
      //goto(`/etf/${$etfTicker}${subSectionMap[state]}`);
    } else {
      displaySubSection = state;
      //goto(`/etf/${$etfTicker}/statistics`);
    }
  }

  $: {
    if ($page?.url?.pathname) {
      const parts = $page?.url?.pathname.split("/");
      const sectionMap = {
        overview: "overview",
        strike: "strike",
        expiry: "expiry",
      };

      const foundSection = parts?.find((part) =>
        Object?.values(sectionMap)?.includes(part),
      );

      displaySubSection =
        Object?.keys(sectionMap)?.find(
          (key) => sectionMap[key] === foundSection,
        ) || "overview";
    }
  }
</script>

<section class="w-full overflow-hidden min-h-screen">
  <div class="w-full overflow-hidden m-auto">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <nav class="sm:ml-4 overflow-x-auto text-sm whitespace-nowrap">
            <ul
              class="flex flex-row items-center w-full gap-1 pb-3 text-sm sm:text-base"
            >
              <!--
              <a
                href={`/etf/${$etfTicker}/options/dex`}
                on:click={() => changeSubSection("overview")}
                class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection === 'overview'
                  ? 'border-gray-200 dark:border-zinc-800/80 bg-gray-100/70 dark:bg-zinc-900/60 text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
              >
                Overview
              </a>
              -->

              <a
                href={`/etf/${$etfTicker}/options/dex/strike`}
                on:click={() => changeSubSection("strike")}
                class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
                'strike'
                  ? 'border-gray-200 dark:border-zinc-800/80 bg-gray-100/70 dark:bg-zinc-900/60 text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
              >
                By Strike
              </a>
              <a
                href={`/etf/${$etfTicker}/options/dex/expiry`}
                on:click={() => changeSubSection("expiry")}
                class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
                'expiry'
                  ? 'border-gray-200 dark:border-zinc-800/80 bg-gray-100/70 dark:bg-zinc-900/60 text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
              >
                By Expiry
              </a>
            </ul>
          </nav>
          <div class="mt-2 sm:mt-0">
            <slot />
          </div>
        </main>
      </div>
    </div>
  </div>
</section>

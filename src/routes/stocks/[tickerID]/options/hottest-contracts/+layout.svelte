<script lang="ts">
  import { stockTicker } from "$lib/store";
  import { page } from "$app/stores";

  export let data;

  let displaySubSection = "oi";

  function changeSubSection(state) {
    const subSectionMap = {
      oi: "/options/hottest-contracts/oi",
      expiry: "/options/hottest-contracts/volume",
    };

    if (state !== "overview" && subSectionMap[state]) {
      displaySubSection = state;
      //goto(`/stocks/${$stockTicker}${subSectionMap[state]}`);
    } else {
      displaySubSection = state;
      //goto(`/stocks/${$stockTicker}/statistics`);
    }
  }

  $: {
    if ($page?.url?.pathname) {
      const parts = $page?.url?.pathname.split("/");
      const sectionMap = {
        oi: "oi",
        volume: "volume",
      };

      const foundSection = parts?.find((part) =>
        Object?.values(sectionMap)?.includes(part),
      );

      displaySubSection =
        Object?.keys(sectionMap)?.find(
          (key) => sectionMap[key] === foundSection,
        ) || "oi";
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
          <nav
            class="mb-5 sm:mb-0 sm:ml-4 pt-1 text-sm whitespace-nowrap overflow-x-auto border-b border-gray-200/70 dark:border-zinc-800/80"
          >
            <ul class="flex flex-row items-center w-full gap-1 pb-3 text-sm sm:text-base">
              <a
                href={`/stocks/${$stockTicker}/options/hottest-contracts`}
                on:click={() => changeSubSection("oi")}
                class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection === 'oi'
                  ? 'border-gray-200/70 dark:border-zinc-800/80 bg-gray-100/70 dark:bg-zinc-900/60 text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
              >
                By Open Interest
              </a>

              <a
                href={`/stocks/${$stockTicker}/options/hottest-contracts/volume`}
                on:click={() => changeSubSection("volume")}
                class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection === 'volume'
                  ? 'border-gray-200/70 dark:border-zinc-800/80 bg-gray-100/70 dark:bg-zinc-900/60 text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
              >
                By Volume
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

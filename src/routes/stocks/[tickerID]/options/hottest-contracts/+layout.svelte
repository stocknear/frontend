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
            class="mb-5 sm:mb-0 sm:ml-4 pt-1 text-sm sm:text-[1rem] whitespace-nowrap overflow-x-auto whitespace-nowrap"
          >
            <ul class="flex flex-row items-center w-full">
              <a
                href={`/stocks/${$stockTicker}/options/hottest-contracts`}
                on:click={() => changeSubSection("oi")}
                class="p-2 px-5 cursor-pointer {displaySubSection === 'oi'
                  ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                  : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
              >
                By Open Interest
              </a>

              <a
                href={`/stocks/${$stockTicker}/options/hottest-contracts/volume`}
                on:click={() => changeSubSection("volume")}
                class="p-2 px-5 cursor-pointer {displaySubSection === 'volume'
                  ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                  : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
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

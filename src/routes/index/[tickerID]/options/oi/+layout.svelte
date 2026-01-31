<script lang="ts">
  import { indexTicker } from "$lib/store";
  import { page } from "$app/stores";
  import {
    stock_detail_options_oi_nav_expiry,
    stock_detail_options_oi_nav_strike,
  } from "$lib/paraglide/messages";

  export let data;

  let displaySubSection = "strike";

  function changeSubSection(state) {
    const subSectionMap = {
      strike: "/options/oi/strike",
      expiry: "/options/oi/expiry",
    };

    if (state !== "overview" && subSectionMap[state]) {
      displaySubSection = state;
      //goto(`/index/${$indexTicker}${subSectionMap[state]}`);
    } else {
      displaySubSection = state;
      //goto(`/index/${$indexTicker}/statistics`);
    }
  }

  $: {
    if ($page?.url?.pathname) {
      const parts = $page?.url?.pathname.split("/");
      const sectionMap = {
        strike: "strike",
        expiry: "expiry",
      };

      const foundSection = parts?.find((part) =>
        Object?.values(sectionMap)?.includes(part),
      );

      displaySubSection =
        Object?.keys(sectionMap)?.find(
          (key) => sectionMap[key] === foundSection,
        ) || "strike";
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
            class=" sm:ml-4 sm:pt-2 text-sm whitespace-nowrap overflow-x-auto border-b border-gray-300 dark:border-zinc-700"
          >
            <ul
              class="flex flex-row items-center w-full gap-1 pb-2 text-sm sm:text-base"
            >
              <a
                href={`/index/${$indexTicker}/options/oi`}
                on:click={() => changeSubSection("strike")}
                class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
                'strike'
                  ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                  : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
              >
                {stock_detail_options_oi_nav_strike()}
              </a>

              <a
                href={`/index/${$indexTicker}/options/oi/expiry`}
                on:click={() => changeSubSection("expiry")}
                class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
                'expiry'
                  ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                  : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
              >
                {stock_detail_options_oi_nav_expiry()}
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

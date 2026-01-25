<script lang="ts">
  import { stockTicker } from "$lib/store";
  import { onDestroy } from "svelte";
  import { page } from "$app/stores";
  import * as m from "$lib/paraglide/messages";

  let displaySubSection = "overview";

  if (displaySubSection) {
    const parts = $page?.url?.pathname.split("/");
    const sectionMap = {
      overview: "overview",
      ai: "ai",
      analyst: "analyst",
      "dcf-model": "dcf-model",
    };

    const foundSection = parts?.find((part) =>
      Object?.values(sectionMap)?.includes(part),
    );

    displaySubSection =
      Object?.keys(sectionMap)?.find(
        (key) => sectionMap[key] === foundSection,
      ) || "overview";
  }

  function changeSubSection(state) {
    const subSectionMap = {
      overview: "/forecast",
      //ai: "/forecast/ai",
      analyst: "/forecast/analyst",
    };

    if (state !== "overview" && subSectionMap[state]) {
      displaySubSection = state;
    } else {
      displaySubSection = state;
    }
  }

  const unsubscribe = page.subscribe(($page) => {
    const splitRoute = $page.url.pathname.split("/");
    const routeState =
      splitRoute[splitRoute.length - 1] !== "forecast"
        ? splitRoute[splitRoute.length - 1]
        : "overview";

    changeSubSection(routeState);
  });

  onDestroy(() => {
    unsubscribe();
  });
</script>

<section class="w-full overflow-hidden h-full">
  <div class="m-auto h-full overflow-hidden">
    <main class="w-full mb-4 sm:mb-0">
      <div class="m-auto">
        <nav
          class="mb-5 sm:mb-0 sm:ml-4 pt-2 text-sm whitespace-nowrap overflow-x-auto border-b border-gray-300 dark:border-zinc-700"
        >
          <ul
            class="flex flex-row items-center w-full gap-1 pb-3 text-sm sm:text-base"
          >
            <a
              href={`/stocks/${$stockTicker}/forecast`}
              on:click={() => changeSubSection("overview")}
              class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
              'overview'
                ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
            >
              {m.stock_detail_forecast_nav_overview()}
            </a>

            <a
              href={`/stocks/${$stockTicker}/forecast/analyst`}
              on:click={() => changeSubSection("analyst")}
              class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
              'analyst'
                ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
            >
              {m.stock_detail_forecast_nav_analysts()}
            </a>
            <a
              href={`/stocks/${$stockTicker}/forecast/ai`}
              on:click={() => changeSubSection("ai")}
              class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
              'ai'
                ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
            >
              {m.stock_detail_forecast_nav_ai()}
            </a>

            <a
              href={`/stocks/${$stockTicker}/forecast/dcf-model`}
              on:click={() => changeSubSection("dcf-model")}
              class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
              'dcf-model'
                ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
            >
              {m.stock_detail_forecast_nav_dcf()}
            </a>
          </ul>
        </nav>
      </div>
    </main>

    <slot />
  </div>
</section>

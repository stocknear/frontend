<script lang="ts">
  import { stockTicker } from "$lib/store";
  import { onDestroy } from "svelte";
  import { page } from "$app/stores";

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
          class="mb-5 sm:mb-0 sm:ml-4 pt-1 text-sm sm:text-[1rem] whitespace-nowrap overflow-x-auto whitespace-nowrap"
        >
          <ul class="flex flex-row items-center w-full">
            <a
              href={`/stocks/${$stockTicker}/forecast`}
              on:click={() => changeSubSection("overview")}
              class="p-2 px-5 cursor-pointer {displaySubSection === 'overview'
                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
            >
              Overview
            </a>

            <a
              href={`/stocks/${$stockTicker}/forecast/analyst`}
              on:click={() => changeSubSection("analyst")}
              class="p-2 px-5 cursor-pointer {displaySubSection === 'analyst'
                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
            >
              Analysts Ratings
            </a>
            <a
              href={`/stocks/${$stockTicker}/forecast/ai`}
              on:click={() => changeSubSection("ai")}
              class="p-2 px-5 cursor-pointer {displaySubSection === 'ai'
                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
            >
              AI Forecast
            </a>

            <a
              href={`/stocks/${$stockTicker}/forecast/dcf-model`}
              on:click={() => changeSubSection("dcf-model")}
              class="p-2 px-5 cursor-pointer {displaySubSection === 'dcf-model'
                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
            >
              DCF Model
            </a>
          </ul>
        </nav>
      </div>
    </main>

    <slot />
  </div>
</section>

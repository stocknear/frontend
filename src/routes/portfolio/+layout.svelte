<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";

  export let data;

  let displaySection = "overview";
  let activePortfolioId: string | null = null;

  // Reactive: Update activePortfolioId based on priority: URL > localStorage > first portfolio
  $: {
    // Priority 1: URL parameter (highest priority)
    const urlId = $page?.url?.searchParams?.get("id");
    if (urlId) {
      activePortfolioId = urlId;
    }
    // Priority 2: localStorage (if no URL param)
    else if (typeof window !== "undefined" && !activePortfolioId) {
      try {
        const savedId = localStorage.getItem("last-portfolio-id");
        if (savedId) {
          activePortfolioId = JSON.parse(savedId);
        }
      } catch (e) {
        console.log("Failed to load portfolio id:", e);
      }
    }

    // Priority 3: First portfolio in list (if no URL or localStorage)
    if (!activePortfolioId && data?.getAllPortfolio?.length > 0) {
      activePortfolioId = data.getAllPortfolio[0]?.id;
    }
  }

  function changeSection(state) {
    const sectionMap = {
      analysis: "/analysis",
    };

    if (state !== "overview" && sectionMap[state]) {
      displaySection = state;
      //goto(`/stocks/${$stockTicker}${sectionMap[state]}`);
    } else {
      displaySection = "overview";
      //goto(`/stocks/${$stockTicker}/`);
    }
  }

  $: {
    if ($page?.url?.pathname) {
      const parts = $page?.url?.pathname?.split("/");
      const sectionMap = {
        overview: "overview",
        analysis: "analysis",
      };
      displaySection =
        sectionMap[
          parts?.find((part) => Object?.keys(sectionMap)?.includes(part))
        ] || "overview";
    }
  }
</script>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden pb-20 pt-5 px-3 text-muted dark:text-white"
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
      <li class="text-muted dark:text-gray-300">Portfolio Tracker</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <h1 class=" text-2xl sm:text-3xl font-bold">Portfolio Tracker</h1>

          <nav
            class="border-[#2C6288] dark:border-white border-b-[2px] overflow-x-auto whitespace-nowrap mt-3"
          >
            <ul
              class="flex flex-row items-center w-full text-sm sm:text-[1rem]"
            >
              <a
                href={activePortfolioId
                  ? `/portfolio/?id=${activePortfolioId}`
                  : `/portfolio/`}
                on:click={() => changeSection("overview")}
                class="p-2 px-5 cursor-pointer {displaySection === 'overview'
                  ? ' bg-[#EEEEEE] dark:bg-secondary font-semibold'
                  : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-secondary'}"
              >
                Overview
              </a>
              <a
                href={activePortfolioId
                  ? `/portfolio/analysis?id=${activePortfolioId}`
                  : `/portfolio/analysis`}
                on:click={() => changeSection("analysis")}
                class="p-2 px-5 cursor-pointer {displaySection === 'analysis'
                  ? ' bg-[#EEEEEE] dark:bg-secondary font-semibold'
                  : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-secondary'}"
              >
                Analysis
              </a>
            </ul>
          </nav>

          <slot />
        </main>
      </div>
    </div>
  </div>
</section>

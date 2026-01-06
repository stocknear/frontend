<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";

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
  <BreadCrumb containerClass="text-sm sm:text-[1rem] breadcrumbs">
    <li>
      <a
        href="/"
        class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
        >Home</a
      >
    </li>
    <li class="text-muted dark:text-gray-300">Portfolio Tracker</li>
  </BreadCrumb>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <h1 class=" text-2xl sm:text-3xl font-bold">Portfolio Tracker</h1>

          <nav
            class="border-b border-gray-300 dark:border-zinc-700 overflow-x-auto whitespace-nowrap mt-3"
          >
            <ul
              class="flex flex-row items-center w-full gap-1 pb-2 text-sm sm:text-base"
            >
              <a
                href={activePortfolioId
                  ? `/portfolio/?id=${activePortfolioId}`
                  : `/portfolio/`}
                on:click={() => changeSection("overview")}
                class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySection ===
                'overview'
                  ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                  : 'border-transparent text-gray-600 dark:text-zinc-300 hover:text-violet-800 dark:hover:text-violet-400 hover:border-gray-200/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
              >
                Overview
              </a>
              <a
                href={activePortfolioId
                  ? `/portfolio/analysis?id=${activePortfolioId}`
                  : `/portfolio/analysis`}
                on:click={() => changeSection("analysis")}
                class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySection ===
                'analysis'
                  ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                  : 'border-transparent text-gray-600 dark:text-zinc-300 hover:text-violet-800 dark:hover:text-violet-400 hover:border-gray-200/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
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

<script lang="ts">
  import { stockTicker, selectedTimePeriod } from "$lib/store";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";

  export let data;
  let displaySubSection = "income";

  function updateQuery(query: string) {
    // Create a new URL object based on the current URL
    const url = new URL($page.url.href);

    // Update or remove the "query" parameter
    if (query) {
      url.searchParams.set("query", query);
    } else {
      url.searchParams.delete("query");
    }

    // Use goto to navigate to the same pathname with updated query parameters
    goto(url.pathname + url.search, { replaceState: true });
    $selectedTimePeriod = query;
  }

  function changeSubSection(state) {
    // Allow for ttm to be explicitly set.
    if (state === "ttm") {
      displaySubSection = state;
      return;
    }
    const subSectionMap = {
      income: "/financials/income",
      "balance-sheet": "/financials/balance-sheet",
      "cash-flow": "/financials/cash-flow",
      ratios: "/financials/ratios",
    };

    if (state !== "income" && subSectionMap[state]) {
      displaySubSection = state;
    } else {
      displaySubSection = state;
    }
  }

  // Reactive block to check URL
  $: {
    // If query param "query" equals "ttm", mark ttm as active.
    if ($page?.url?.searchParams?.get("query") === "ttm") {
      $selectedTimePeriod = "ttm";
    } else if ($page?.url?.searchParams?.get("query") === "annual") {
      $selectedTimePeriod = "annual";
    } else if ($page?.url?.searchParams?.get("query") === "quarterly") {
      $selectedTimePeriod = "quarterly";
    } else {
      $selectedTimePeriod = "annual";
    }

    if ($page?.url?.pathname) {
      const parts = $page.url.pathname.split("/");
      const sectionMap = {
        income: "income",
        "balance-sheet": "balance-sheet",
        "cash-flow": "cash-flow",
        ratios: "ratios",
      };

      const foundSection = parts.find((part) =>
        Object.values(sectionMap).includes(part),
      );

      displaySubSection =
        Object.keys(sectionMap).find(
          (key) => sectionMap[key] === foundSection,
        ) || "income";

      if (displaySubSection === "ratios" && $selectedTimePeriod === "ttm") {
        $selectedTimePeriod = "annual";
      }
    }
  }
</script>

<section class="w-full overflow-hidden">
  <div class="w-full overflow-hidden m-auto">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class="m-auto">
            <nav
              class="mb-5 sm:mb-0 sm:ml-4 pt-1 text-sm sm:text-[1rem] whitespace-nowrap overflow-x-auto"
            >
              <ul class="flex flex-row items-center w-full">
                <a
                  href={$selectedTimePeriod !== "annual" && $selectedTimePeriod
                    ? `/stocks/${$stockTicker}/financials/?query=${$selectedTimePeriod}`
                    : `/stocks/${$stockTicker}/financials`}
                  on:click={() => changeSubSection("income")}
                  class="p-2 px-5 cursor-pointer {displaySubSection === 'income'
                    ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                    : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
                >
                  Income
                </a>

                <a
                  href={$selectedTimePeriod !== "annual" && $selectedTimePeriod
                    ? `/stocks/${$stockTicker}/financials/balance-sheet/?query=${$selectedTimePeriod}`
                    : `/stocks/${$stockTicker}/financials/balance-sheet`}
                  on:click={() => changeSubSection("balance-sheet")}
                  class="p-2 px-5 cursor-pointer {displaySubSection ===
                  'balance-sheet'
                    ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                    : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
                >
                  Balance Sheet
                </a>
                <a
                  href={$selectedTimePeriod !== "annual" && $selectedTimePeriod
                    ? `/stocks/${$stockTicker}/financials/cash-flow/?query=${$selectedTimePeriod}`
                    : `/stocks/${$stockTicker}/financials/cash-flow`}
                  on:click={() => changeSubSection("cash-flow")}
                  class="p-2 px-5 cursor-pointer {displaySubSection ===
                  'cash-flow'
                    ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                    : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
                >
                  Cashflow
                </a>
                <a
                  href={$selectedTimePeriod !== "annual" && $selectedTimePeriod
                    ? `/stocks/${$stockTicker}/financials/ratios/?query=${$selectedTimePeriod}`
                    : `/stocks/${$stockTicker}/financials/ratios`}
                  on:click={() => changeSubSection("ratios")}
                  class="p-2 px-5 cursor-pointer {displaySubSection === 'ratios'
                    ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                    : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
                >
                  Ratios
                </a>

                <a
                  href={$page?.url?.pathname}
                  on:click|preventDefault={() => updateQuery("annual")}
                  class="hidden sm:block ml-auto p-2 px-5 cursor-pointer {$selectedTimePeriod ===
                  'annual'
                    ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                    : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
                >
                  Annual
                </a>
                <a
                  href={$page?.url?.pathname + "?query=quarterly"}
                  on:click|preventDefault={() => updateQuery("quarterly")}
                  class="hidden sm:block p-2 px-5 cursor-pointer {$selectedTimePeriod ===
                  'quarterly'
                    ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                    : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
                >
                  Quarterly
                </a>
                {#if displaySubSection !== "ratios"}
                  <a
                    href={$page?.url?.pathname + "?query=ttm"}
                    on:click|preventDefault={() => updateQuery("ttm")}
                    class="hidden sm:block p-2 px-5 cursor-pointer {$selectedTimePeriod ===
                    'ttm'
                      ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                      : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
                  >
                    TTM
                  </a>
                {/if}
              </ul>

              <ul class="flex flex-row items-center w-full mt-1 sm:hidden">
                <a
                  href={$page?.url?.pathname}
                  on:click|preventDefault={() => updateQuery("annual")}
                  class=" p-2 px-5 cursor-pointer {$selectedTimePeriod ===
                  'annual'
                    ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                    : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
                >
                  Annual
                </a>
                <a
                  href={$page?.url?.pathname + "?query=quarterly"}
                  on:click|preventDefault={() => updateQuery("quarterly")}
                  class="p-2 px-5 cursor-pointer {$selectedTimePeriod ===
                  'quarterly'
                    ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                    : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
                >
                  Quarterly
                </a>
                {#if displaySubSection !== "ratios"}
                  <a
                    href={$page?.url?.pathname + "?query=ttm"}
                    on:click|preventDefault={() => updateQuery("ttm")}
                    class="p-2 px-5 cursor-pointer {$selectedTimePeriod ===
                    'ttm'
                      ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                      : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
                  >
                    TTM
                  </a>
                {/if}
              </ul>
            </nav>
          </div>

          <slot />
        </main>
      </div>
    </div>
  </div>
</section>

<style>
  .scrollbar {
    display: grid;
    grid-gap: 18px;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    grid-auto-flow: column;
    overflow-x: auto;
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
  }
  .scrollbar::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
  .scrollbar::-webkit-scrollbar-thumb {
    background: transparent;
  }
</style>

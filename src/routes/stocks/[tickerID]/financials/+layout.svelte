<script lang="ts">
  import { stockTicker, selectedTimePeriod } from "$lib/store";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import {
    stock_detail_financials_annual,
    stock_detail_financials_balance_sheet,
    stock_detail_financials_cashflow,
    stock_detail_financials_income,
    stock_detail_financials_quarterly,
    stock_detail_financials_ratios,
    stock_detail_financials_ttm,
  } from "$lib/paraglide/messages";

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
              class=" sm:ml-4 pt-2 text-sm whitespace-nowrap overflow-x-auto sm:border-none border-b border-gray-300 dark:border-zinc-700"
            >
              <ul
                class="flex flex-row items-center w-full gap-1 pb-2 text-sm sm:text-base border-b border-gray-300 dark:border-zinc-700"
              >
                <a
                  href={$selectedTimePeriod !== "annual" && $selectedTimePeriod
                    ? `/stocks/${$stockTicker}/financials/?query=${$selectedTimePeriod}`
                    : `/stocks/${$stockTicker}/financials`}
                  on:click={() => changeSubSection("income")}
                  class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
                  'income'
                    ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                    : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                >
                  {stock_detail_financials_income()}
                </a>

                <a
                  href={$selectedTimePeriod !== "annual" && $selectedTimePeriod
                    ? `/stocks/${$stockTicker}/financials/balance-sheet/?query=${$selectedTimePeriod}`
                    : `/stocks/${$stockTicker}/financials/balance-sheet`}
                  on:click={() => changeSubSection("balance-sheet")}
                  class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
                  'balance-sheet'
                    ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                    : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                >
                  {stock_detail_financials_balance_sheet()}
                </a>
                <a
                  href={$selectedTimePeriod !== "annual" && $selectedTimePeriod
                    ? `/stocks/${$stockTicker}/financials/cash-flow/?query=${$selectedTimePeriod}`
                    : `/stocks/${$stockTicker}/financials/cash-flow`}
                  on:click={() => changeSubSection("cash-flow")}
                  class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
                  'cash-flow'
                    ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                    : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                >
                  {stock_detail_financials_cashflow()}
                </a>
                <a
                  href={$selectedTimePeriod !== "annual" && $selectedTimePeriod
                    ? `/stocks/${$stockTicker}/financials/ratios/?query=${$selectedTimePeriod}`
                    : `/stocks/${$stockTicker}/financials/ratios`}
                  on:click={() => changeSubSection("ratios")}
                  class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
                  'ratios'
                    ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                    : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                >
                  {stock_detail_financials_ratios()}
                </a>

                <a
                  href={$page?.url?.pathname}
                  on:click|preventDefault={() => updateQuery("annual")}
                  class="hidden sm:block ml-auto px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {$selectedTimePeriod ===
                  'annual'
                    ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                    : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                >
                  {stock_detail_financials_annual()}
                </a>
                <a
                  href={$page?.url?.pathname + "?query=quarterly"}
                  on:click|preventDefault={() => updateQuery("quarterly")}
                  class="hidden sm:block px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {$selectedTimePeriod ===
                  'quarterly'
                    ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                    : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                >
                  {stock_detail_financials_quarterly()}
                </a>
                <a
                  href={$page?.url?.pathname + "?query=ttm"}
                  on:click|preventDefault={() => updateQuery("ttm")}
                  class="hidden sm:block px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {$selectedTimePeriod ===
                  'ttm'
                    ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                    : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                >
                  {stock_detail_financials_ttm()}
                </a>
              </ul>

              <ul
                class="flex flex-row items-center w-full mt-1 sm:hidden gap-1 pb-3 text-sm pt-2"
              >
                <a
                  href={$page?.url?.pathname}
                  on:click|preventDefault={() => updateQuery("annual")}
                  class="px-2.5 py-1.5 rounded-full border text-sm font-medium transition {$selectedTimePeriod ===
                  'annual'
                    ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                    : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                >
                  {stock_detail_financials_annual()}
                </a>
                <a
                  href={$page?.url?.pathname + "?query=quarterly"}
                  on:click|preventDefault={() => updateQuery("quarterly")}
                  class="px-2.5 py-1.5 rounded-full border text-sm font-medium transition {$selectedTimePeriod ===
                  'quarterly'
                    ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                    : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                >
                  {stock_detail_financials_quarterly()}
                </a>
                <a
                  href={$page?.url?.pathname + "?query=ttm"}
                  on:click|preventDefault={() => updateQuery("ttm")}
                  class="px-2.5 py-1.5 rounded-full border text-sm font-medium transition {$selectedTimePeriod ===
                  'ttm'
                    ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                    : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                >
                  {stock_detail_financials_ttm()}
                </a>
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

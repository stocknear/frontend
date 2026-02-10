<script lang="ts">
  import { displayCompanyName, selectedTimePeriod, financialHistoryRange } from "$lib/store";
  import { removeCompanyStrings } from "$lib/utils";
  import { stock_detail_financials_in_currency } from "$lib/paraglide/messages";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import FinancialCustomGrid from "$lib/components/Financial/FinancialCustomGrid.svelte";
  import FinancialChartModal from "$lib/components/Financial/FinancialChartModal.svelte";

  export let data;
  export let chartConfig;
  export let currentPrice: number | undefined = undefined;

  let mergedData: Record<string, any>[] = [];
  let fullStatement: Record<string, any>[] = [];
  let switchDate = false;

  type HistoryRange = "All" | "10Y" | "5Y" | "3Y" | "1Y";
  const HISTORY_RANGE_OPTIONS: Array<{ value: HistoryRange; label: string }> = [
    { value: "All", label: "All" },
    { value: "10Y", label: "10Y" },
    { value: "5Y", label: "5Y" },
    { value: "3Y", label: "3Y" },
    { value: "1Y", label: "1Y" },
  ];

  const filterByHistoryRange = (
    statements: any[] = [],
    range: HistoryRange = "All",
    periodType: string = "annual",
  ) => {
    if (!Array.isArray(statements) || range === "All") return statements;
    const yearsByRange: Record<string, number> = { "1Y": 1, "3Y": 3, "5Y": 5, "10Y": 10 };
    const years = yearsByRange[range];
    if (!years) return statements;
    const periodsPerYear = periodType === "annual" ? 1 : 4;
    const periodsToShow = years * periodsPerYear;
    const startIndex = Math.max(statements.length - periodsToShow, 0);
    return statements.slice(startIndex);
  };

  // Modal state
  let isModalOpen = false;
  let modalMetricKey = "";
  let modalMetricLabel = "";
  let modalOverviewConfig: any = null;

  function handleExpandChart(configKey: string, label: string) {
    const cfg = chartConfig.find((c: any) => c.key === configKey);
    modalMetricKey = cfg?.metrics?.[0]?.key || configKey;
    modalMetricLabel = label;
    // Always pass overview config so the modal uses the overview builder
    // (bypasses the overlay system which doesn't know about stockPrice, etc.)
    modalOverviewConfig = cfg || null;
    isModalOpen = true;
  }

  function handleCloseModal() {
    isModalOpen = false;
  }

  const getStatementTimestamp = (statement?: Record<string, any>) => {
    if (!statement) return 0;
    const dateValue =
      statement.date || statement.fiscalDate || statement.fiscalYear;
    const parsed = Date.parse(dateValue);
    if (!Number.isNaN(parsed)) return parsed;
    const fiscalYear = Number(statement?.fiscalYear);
    if (Number.isFinite(fiscalYear)) return Date.UTC(fiscalYear, 0, 1);
    return 0;
  };

  const sortStatementsAscending = (statements: any[] = []) =>
    [...statements].sort(
      (a, b) => getStatementTimestamp(a) - getStatementTimestamp(b),
    );

  // Lock info for current period
  let lockInfo: {
    hasLockedData: boolean;
    lockedCount: number;
    lockedFiscalYearRange: string;
  } = {
    hasLockedData: false,
    lockedCount: 0,
    lockedFiscalYearRange: "",
  };

  $: {
    const periodKey =
      (
        { annual: "annual", quarterly: "quarter", ttm: "ttm" } as Record<
          string,
          string
        >
      )[$selectedTimePeriod] || "annual";
    fullStatement = data?.getMergedData?.[periodKey] ?? [];

    const lockKey = periodKey === "quarter" ? "quarterly" : periodKey;
    lockInfo = data?.financialLockInfo?.[lockKey] ?? {
      hasLockedData: false,
      lockedCount: 0,
      lockedFiscalYearRange: "",
    };

    const sorted = sortStatementsAscending(
      Array.isArray(fullStatement) ? fullStatement : [],
    );
    const ranged = filterByHistoryRange(sorted, $financialHistoryRange, $selectedTimePeriod || "annual");
    mergedData = switchDate ? [...ranged].reverse() : ranged;
  }
</script>

<section class="w-full overflow-hidden h-full text-gray-700 dark:text-zinc-200">
  <div class="w-full flex justify-center w-full sm-auto h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <main class="w-full">
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 m-auto mt-2 sm:mt-0">
          <div
            class="mb-3 sm:mb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between"
          >
            <h1
              class="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              {removeCompanyStrings($displayCompanyName)} Custom Financials
            </h1>
          </div>

          <div class="grid grid-cols-1 gap-2">
            {#if mergedData?.length > 0}
              <div class="flex flex-col md:flex-row items-end justify-between">
                <span
                  class="text-xs sm:text-sm order-1 sm:order-0 mt-5 sm:mt-0 text-gray-800 dark:text-zinc-300 w-full"
                >
                  {stock_detail_financials_in_currency({
                    currency: mergedData[0]?.reportedCurrency || "USD",
                    range: data?.getProfileData?.fiscalYearRange || "",
                  })}
                </span>

                <div
                  class="flex flex-row flex-wrap items-center justify-end w-full gap-1.5 sm:gap-2"
                >
                  <!-- Metric Picker Slot -->
                  <slot name="picker" />

                  <!-- Time Range Dropdown -->
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild let:builder>
                      <Button
                        builders={[builder]}
                        class="cursor-pointer w-fit transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row items-center px-2 sm:px-3 py-2 rounded-full"
                      >
                        <span class="text-sm">{$financialHistoryRange}</span>
                        <svg
                          class="-mr-1 ml-1 h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content
                      side="bottom"
                      align="start"
                      sideOffset={8}
                      class="min-w-[90px] rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-2 text-gray-700 dark:text-zinc-200 shadow-lg"
                    >
                      <DropdownMenu.Group>
                        {#each HISTORY_RANGE_OPTIONS as option}
                          <DropdownMenu.Item
                            on:click={() =>
                              ($financialHistoryRange = option.value)}
                            class="{$financialHistoryRange === option.value
                              ? 'bg-gray-100/70 dark:bg-zinc-900/60 text-violet-600 dark:text-violet-400 font-medium'
                              : ''} cursor-pointer hover:text-violet-600 dark:hover:text-violet-400 rounded-xl"
                          >
                            {option.label}
                          </DropdownMenu.Item>
                        {/each}
                      </DropdownMenu.Group>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>

                  <!-- Sort Order Toggle -->
                  <Button
                    on:click={() => (switchDate = !switchDate)}
                    class="cursor-pointer w-fit transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row items-center px-2 sm:px-3 py-2 rounded-full disabled:opacity-60 disabled:cursor-not-allowed"
                    title={switchDate ? "Newest first" : "Oldest first"}
                  >
                    <svg
                      class="shrink-0 w-5 h-5 pointer-events-none"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      style="max-width:40px"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      ></path>
                    </svg>
                  </Button>
                </div>
              </div>

              {#if lockInfo.hasLockedData}
                <a
                  href="/pricing"
                  class="mt-3 flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-violet-200 dark:border-violet-800/50 bg-violet-50/80 dark:bg-violet-950/30 transition-colors hover:bg-violet-100/80 dark:hover:bg-violet-900/30"
                >
                  <div
                    class="flex items-center gap-2.5 text-violet-900 dark:text-violet-200"
                  >
                    <svg
                      class="w-4 h-4 shrink-0 text-violet-500 dark:text-violet-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      style="max-width:40px"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span>
                      Viewing {mergedData.length} periods
                      {#if lockInfo.lockedFiscalYearRange}
                        <span class="font-medium"
                          >&middot; Unlock {lockInfo.lockedFiscalYearRange} for full
                          history</span
                        >
                      {/if}
                    </span>
                  </div>
                  <span
                    class="text-xs font-semibold text-violet-700 dark:text-violet-300 whitespace-nowrap"
                  >
                    Upgrade &rarr;
                  </span>
                </a>
              {/if}

              <FinancialCustomGrid
                {mergedData}
                {chartConfig}
                {currentPrice}
                ghostCount={lockInfo.lockedCount}
                onExpandChart={handleExpandChart}
              />
            {/if}
          </div>
        </div>
      </main>
    </div>
  </div>
</section>

<FinancialChartModal
  isOpen={isModalOpen}
  metricKey={modalMetricKey}
  metricLabel={modalMetricLabel}
  data={fullStatement}
  periodType={$selectedTimePeriod || "annual"}
  onClose={handleCloseModal}
  userTier={data?.user?.tier}
  overviewConfig={modalOverviewConfig}
/>

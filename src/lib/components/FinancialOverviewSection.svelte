<script lang="ts">
  import {
    displayCompanyName,
    selectedTimePeriod,
  } from "$lib/store";
  import { removeCompanyStrings } from "$lib/utils";
  import { stock_detail_financials_in_currency } from "$lib/paraglide/messages";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import FinancialOverviewGrid from "$lib/components/FinancialOverviewGrid.svelte";
  import FinancialChartModal from "$lib/components/FinancialChartModal.svelte";
  import FinancialAISummary from "$lib/components/FinancialAISummary.svelte";

  export let data;
  export let chartConfig;
  export let currentPrice: number | undefined = undefined;

  let mergedData: Record<string, any>[] = [];
  let fullStatement: Record<string, any>[] = [];
  let switchDate = false;

  // Modal state
  let isModalOpen = false;
  let modalMetricKey = "";
  let modalMetricLabel = "";
  let modalOverviewConfig: any = null;

  function handleExpandChart(configKey: string, label: string) {
    const cfg = chartConfig.find((c: any) => c.key === configKey);
    modalMetricKey = cfg?.metrics?.[0]?.key || configKey;
    modalMetricLabel = label;
    // Pass full config for multi-series charts so the modal can render all series
    modalOverviewConfig = cfg && cfg.metrics?.length > 1 ? cfg : null;
    isModalOpen = true;
  }

  function handleCloseModal() {
    isModalOpen = false;
  }

  const getStatementTimestamp = (statement?: Record<string, any>) => {
    if (!statement) return 0;
    const dateValue = statement.date || statement.fiscalDate || statement.fiscalYear;
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

  $: {
    const periodKey = ({ annual: 'annual', quarterly: 'quarter', ttm: 'ttm' } as Record<string, string>)[$selectedTimePeriod] || 'annual';
    fullStatement = data?.getMergedData?.[periodKey] ?? [];

    const sorted = sortStatementsAscending(
      Array.isArray(fullStatement) ? fullStatement : [],
    );
    mergedData = switchDate ? [...sorted].reverse() : sorted;
  }
</script>

<section class="w-full overflow-hidden h-full text-gray-700 dark:text-zinc-200">
  <div class="w-full flex justify-center w-full sm-auto h-full overflow-hidden">
    <div class="w-full relative flex justify-center items-center overflow-hidden">
      <main class="w-full">
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 m-auto mt-2 sm:mt-0">
          <div class="mb-3 sm:mb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <h1 class="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {removeCompanyStrings($displayCompanyName)} Financial Overview
            </h1>
          </div>

          <div class="grid grid-cols-1 gap-2">
            {#if mergedData?.length > 0}
              <div class="flex flex-col md:flex-row items-end justify-between">
                <span class="text-xs sm:text-sm order-1 sm:order-0 mt-5 sm:mt-0 text-gray-800 dark:text-zinc-300 w-full">
                  {stock_detail_financials_in_currency({ currency: mergedData[0]?.reportedCurrency || 'USD', range: data?.getProfileData?.fiscalYearRange || '' })}
                </span>

                <div class="flex flex-row flex-wrap items-center justify-end w-full gap-1.5 sm:gap-2">
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

                  <!-- AI Financial Summary -->
                  <FinancialAISummary
                    {data}
                    periodType={$selectedTimePeriod || "annual"}
                    statementType="income-statement"
                  />
                </div>
              </div>

              <FinancialOverviewGrid
                {mergedData}
                {chartConfig}
                {currentPrice}
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

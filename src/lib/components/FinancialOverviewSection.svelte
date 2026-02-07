<script lang="ts">
  import {
    displayCompanyName,
    stockTicker,
    selectedTimePeriod,
  } from "$lib/store";
  import { removeCompanyStrings } from "$lib/utils";
  import FinancialOverviewGrid from "$lib/components/FinancialOverviewGrid.svelte";
  import FinancialChartModal from "$lib/components/FinancialChartModal.svelte";

  export let data;
  export let chartConfig;

  let mergedData: Record<string, any>[] = [];
  let fullStatement: Record<string, any>[] = [];

  // Modal state
  let isModalOpen = false;
  let modalMetricKey = "";
  let modalMetricLabel = "";

  function handleExpandChart(metricKey: string, metricLabel: string) {
    modalMetricKey = metricKey;
    modalMetricLabel = metricLabel;
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
    if ($selectedTimePeriod) {
      if ($selectedTimePeriod === "annual") {
        fullStatement = data?.getMergedData?.annual ?? [];
      } else if ($selectedTimePeriod === "quarterly") {
        fullStatement = data?.getMergedData?.quarter ?? [];
      } else if ($selectedTimePeriod === "ttm") {
        fullStatement = data?.getMergedData?.ttm ?? [];
      } else {
        fullStatement = data?.getMergedData?.annual ?? [];
      }

      // Always show oldest-first for charts (left to right chronological)
      mergedData = sortStatementsAscending(
        Array.isArray(fullStatement) ? fullStatement : [],
      );
    } else {
      mergedData = [];
      fullStatement = [];
    }
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
              <span class="text-xs sm:text-sm text-gray-800 dark:text-zinc-300">
                In {mergedData[0]?.reportedCurrency || 'USD'}
              </span>

              <FinancialOverviewGrid
                {mergedData}
                {chartConfig}
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
/>

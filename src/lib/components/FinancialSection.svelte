<script lang="ts">
  import {
    displayCompanyName,
    stockTicker,
    coolMode,
    selectedTimePeriod,
  } from "$lib/store";
  import {
    removeCompanyStrings,
    augmentStatementsWithGrowth,
  } from "$lib/utils";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import {
  stock_detail_financials_download,
  stock_detail_financials_fiscal_quarter,
  stock_detail_financials_fiscal_year,
  stock_detail_financials_in_currency,
  stock_detail_financials_period_ending,
  stock_detail_financials_sec_filings,
  stock_detail_upgrade,
} from "$lib/paraglide/messages";
  import FinancialTable from "$lib/components/FinancialTable.svelte";
  import FinancialAISummary from "$lib/components/FinancialAISummary.svelte";
  import FinancialChartGrid from "$lib/components/FinancialChartGrid.svelte";
  import FinancialChartModal from "$lib/components/FinancialChartModal.svelte";
  import LayoutGrid from "lucide-svelte/icons/layout-grid";
  import Table from "lucide-svelte/icons/table";

  import { goto } from "$app/navigation";

  export let data;
  export let title;
  export let statementType = "income-statement";
  export let statementConfig;
  export let enableFavorites = false;
  export let favoriteStorageKey = "";

  let seoDescription = "";
  if (title === "Income Statement") {
    seoDescription = `Detailed annual, quarterly and trailing income statement for ${$displayCompanyName} (${$stockTicker}). See many years of revenue, expenses and profits or losses.`;
  }

  let switchDate = false;
  let tableList = [];
  let processedData = {};

  let financialData = [];
  let tableData = [];
  let fullStatement = [];
  let hasLockedData = false;

  const marginKeys = new Set([
    "freeCashFlowYield",
    "returnOnEquity",
    "returnOnAssets",
    "returnOnInvestedCapital",
    "returnOnCapitalEmployed",
  ]);
  const PREMIUM_TIERS = new Set(["Pro", "Plus"]);
  const FREE_COLUMN_LIMIT = 5;

  const fields = statementConfig.map((item) => ({
    label: item.label,
    key: item.propertyName,
  }));
  function toggleMode() {
    $coolMode = !$coolMode;
  }

  let lockedStatements = [];
  let lockedFiscalYearRange = "";
  let lockedPeriodRange = "";
  let tableFields = fields;

  // Modal state for expanded chart view
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
    const dateValue =
      statement.date || statement.fiscalDate || statement.fiscalYear;
    const parsed = Date.parse(dateValue);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
    const fiscalYear = Number(statement?.fiscalYear);
    if (Number.isFinite(fiscalYear)) {
      return Date.UTC(fiscalYear, 0, 1);
    }
    return 0;
  };

  const sortStatementsAscending = (statements: any[] = []) =>
    [...statements].sort(
      (a, b) => getStatementTimestamp(a) - getStatementTimestamp(b),
    );

  function partitionStatements(
    statements: any[] = [],
    canViewAll: boolean,
  ): { visible: any[]; locked: any[] } {
    const chronological = sortStatementsAscending(statements);
    if (canViewAll) {
      return { visible: chronological, locked: [] };
    }
    const startIndex = Math.max(chronological.length - FREE_COLUMN_LIMIT, 0);
    return {
      visible: chronological.slice(startIndex),
      locked: chronological.slice(0, startIndex),
    };
  }

  const getFiscalYearValue = (statement: any) => {
    const year = Number(statement?.fiscalYear);
    return Number.isFinite(year) ? year : null;
  };

  const getPeriodEndingYearValue = (statement: any) => {
    const rawDate = statement?.date || statement?.fiscalDate;
    const parsed = rawDate ? Date.parse(rawDate) : Number.NaN;
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).getFullYear();
    }
    return getFiscalYearValue(statement);
  };

  const applyDisplayOrder = (statements: any[] = [], oldestFirst = false) => {
    if (oldestFirst) {
      return statements;
    }
    return [...statements].reverse();
  };

  function formatLockedRange(
    statements: any[] = [],
    extractor: (statement: any) => number | null,
  ) {
    const values = statements
      .map(extractor)
      .filter((value): value is number => Number.isFinite(value));
    if (!values.length) {
      return "";
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    return min === max ? `${min}` : `${min}-${max}`;
  }

  fullStatement = data?.getData;

  const exportFundamentalData = (format = "csv") => {
    if (["Pro", "Plus"]?.includes(data?.user?.tier)) {
      const data = fullStatement;
      if (!data || data.length === 0) {
        return;
      }

      let properties = [
        {
          key: $selectedTimePeriod === "annual" ? "fiscalYear" : "date",
          label: $selectedTimePeriod === "annual" ? "Year" : "Quarter",
        },
      ];

      for (let i = 0; i < statementConfig?.length; i++) {
        properties.push({
          key: statementConfig[i]?.propertyName,
          label: statementConfig[i]?.label,
        });
      }

      // Helper function to handle special cases

      // Create rows for CSV/Excel
      let rows = data.map((item) =>
        properties?.map((property) => item[property?.key] || 0),
      );

      // Include headers
      const headers = properties.map((prop) => prop.label);
      rows.unshift(headers);

      const fileTitle = title?.toLowerCase()?.trim()?.replace(/\s+/g, "_");
      // Check the format to export
      if (format.toLowerCase() === "csv") {
        const csvContent = rows.map((row) => row.join(",")).join("\n");
        const blob = new Blob([csvContent], {
          type: "data:text/csv;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download =
          $stockTicker.toLowerCase() +
          `${$selectedTimePeriod === "annual" ? "_annual" : $selectedTimePeriod === "quarterly" ? "_quarter" : "_ttm"}_${fileTitle}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } else {
      goto("/pricing");
    }
  };

  // Pre-process all data once instead of in each component
  function preprocessFinancialData() {
    processedData = {};

    // Precompute mapping from propertyName to config for quick lookup
    const configMap = {};
    statementConfig.forEach((item) => {
      if (item && item.propertyName) {
        configMap[item.propertyName] = item;
      }
    });

    // Precompute xList from income (reverse order)
    const xList = [];
    for (let i = financialData.length - 1; i >= 0; i--) {
      const statement = financialData[i];
      const year = statement.fiscalYear?.slice(-2);
      const quarter = statement.period;
      xList.push(
        $selectedTimePeriod === "annual"
          ? "FY" + year
          : "FY" + year + " " + quarter,
      );
    }

    // Process each field using precomputed config and xList
    fields.forEach((field) => {
      const statementKey = field.key;
      const config = configMap[statementKey];
      if (!config) return;

      const valueList = [];
      // Loop through financialData in reverse to match xList order
      for (let i = financialData.length - 1; i >= 0; i--) {
        const statement = financialData[i];
        let rawValue = Number(statement[config.propertyName]);
        if (Number.isFinite(rawValue) && marginKeys.has(config.propertyName)) {
          rawValue = rawValue * 100;
        }
        const value = Number.isFinite(rawValue)
          ? parseFloat(rawValue.toFixed(2))
          : 0;
        valueList.push(value);
      }

      processedData[statementKey] = {
        xList, // re-use the precomputed labels
        valueList,
        labelName: config.label,
      };
    });

    // Build tableList once for all charts and sort by date (newest first)
    tableList = financialData?.map((statement) => ({
      date: statement.date,
      // Add more properties if needed
    }));

    tableList.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  $: {
    // Include switchDate in reactive dependencies so toggling order updates both table and chart views
    const _switchDateDep = switchDate;
    
    if ($selectedTimePeriod) {
      if ($selectedTimePeriod === "annual") {
        fullStatement = data?.getData?.annual ?? [];
      } else if ($selectedTimePeriod === "quarterly") {
        fullStatement = data?.getData?.quarter ?? [];
      } else if ($selectedTimePeriod === "ttm") {
        fullStatement = data?.getData?.ttm ?? [];
      } else {
        fullStatement = data?.getData?.annual ?? [];
      }

      const canViewAllHistory = PREMIUM_TIERS.has(data?.user?.tier);
      const { visible, locked } = partitionStatements(
        Array.isArray(fullStatement) ? fullStatement : [],
        canViewAllHistory,
      );

      const lockInfo =
        data?.financialLockInfo?.[$selectedTimePeriod || "annual"];

      if (lockInfo) {
        lockedStatements = [];
        lockedFiscalYearRange = lockInfo.lockedFiscalYearRange || "";
        lockedPeriodRange = lockInfo.lockedPeriodRange || "";
        hasLockedData = Boolean(lockInfo.hasLockedData);
      } else {
        lockedStatements = locked;
        lockedFiscalYearRange = formatLockedRange(
          lockedStatements,
          getFiscalYearValue,
        );
        lockedPeriodRange = formatLockedRange(
          lockedStatements,
          getPeriodEndingYearValue,
        );
        hasLockedData = lockedStatements.length > 0;
      }

      financialData = applyDisplayOrder(visible, _switchDateDep);
      preprocessFinancialData();
    } else {
      financialData = [];
      lockedStatements = [];
      lockedFiscalYearRange = "";
      lockedPeriodRange = "";
      hasLockedData = false;
    }
  }

  // Derive growth rows and keep base data unchanged for headers/export.
  $: {
    if (financialData.length > 0) {
      const { statements, fields: augmentedFields } =
        augmentStatementsWithGrowth(
          financialData,
          statementConfig,
          $selectedTimePeriod || "annual",
        );
      tableData = statements;
      tableFields = augmentedFields;
    } else {
      tableData = financialData;
      tableFields = fields;
    }
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
              {removeCompanyStrings($displayCompanyName)}
              {title}
            </h1>
          </div>

          <div class="grid grid-cols-1 gap-2">
            {#if financialData?.length > 0}
              <div class="flex flex-col md:flex-row items-end justify-between">
                <span
                  class="text-xs sm:text-sm order-1 sm:order-0 mt-5 sm:mt-0 text-gray-800 dark:text-zinc-300 w-full"
                >
                  {stock_detail_financials_in_currency({ currency: financialData?.at(0)?.reportedCurrency, range: data?.getProfileData?.fiscalYearRange })}
                </span>

                <div class="flex flex-row flex-wrap items-center justify-end w-full gap-1.5 sm:gap-2">
                  <!-- View Controls Group -->
                  <div class="flex flex-row items-center gap-1 sm:gap-1.5">
                    <!-- Chart Mode / Table Mode Toggle -->
                    <Button
                      on:click={toggleMode}
                      class="cursor-pointer w-fit transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row items-center px-2 sm:px-3 py-2 rounded-full disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {#if $coolMode}
                        <Table class="w-4 h-4" />
                        <span class="ml-1.5 text-sm">Table Mode</span>
                      {:else}
                        <LayoutGrid class="w-4 h-4" />
                        <span class="ml-1.5 text-sm">Chart Mode</span>
                      {/if}
                    </Button>

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
                        ><path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        ></path></svg>
                    </Button>
                  </div>

                  <!-- Actions Group -->
                  <div class="flex flex-row items-center gap-1 sm:gap-1.5">
                    <!-- Download Button -->
                    <Button
                      on:click={() => exportFundamentalData("csv")}
                      class="cursor-pointer w-fit transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row items-center px-2 sm:px-3 py-2 rounded-full disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <span class="text-sm">{stock_detail_financials_download()}</span>
                      <svg
                        class="{['Pro', 'Plus']?.includes(data?.user?.tier)
                          ? 'hidden'
                          : ''} ml-1 -mt-0.5 w-3.5 h-3.5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        ><path
                          fill="currentColor"
                          d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                        /></svg>
                    </Button>

                    <!-- AI Financial Summary Button -->
                    <FinancialAISummary
                      {data}
                      periodType={$selectedTimePeriod || "annual"}
                      {statementType}
                    />
                  </div>
                </div>
              </div>

              <!-- Chart Mode View -->
              {#if $coolMode}
                <FinancialChartGrid
                  {processedData}
                  {statementConfig}
                  onExpandChart={handleExpandChart}
                />
              {:else}
                <!-- Table Mode View -->
                <div
                  class="w-full rounded-none sm:rounded m-auto overflow-x-auto"
                >
                  <table
                    class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 text-gray-700 dark:text-zinc-200 tabular-nums"
                  >
                    <thead
                      class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                    >
                      <tr class="border-b border-gray-300 dark:border-zinc-700">
                        <td
                          class="text-start text-xs font-semibold uppercase tracking-wide w-96 border-r border-gray-300 dark:border-zinc-700"
                          >{$selectedTimePeriod !== "annual"
                            ? stock_detail_financials_fiscal_quarter()
                            : stock_detail_financials_fiscal_year()}</td
                        >
                        {#each financialData as item, index}
                          {#if $selectedTimePeriod === "annual"}
                            <td
                              class="font-semibold text-xs uppercase tracking-wide text-end border-l border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-300"
                            >
                              {"FY" + " " + item?.fiscalYear}
                            </td>
                          {:else}
                            <td
                              class="font-semibold text-xs uppercase tracking-wide text-end border-l border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-300"
                            >
                              {item?.period + " " + item?.fiscalYear}
                            </td>
                          {/if}
                        {/each}
                        {#if hasLockedData}
                          <td
                            class="font-semibold text-xs uppercase tracking-wide text-center text-gray-600 dark:text-zinc-300 border-l border-gray-300 dark:border-zinc-700"
                          >
                            {lockedFiscalYearRange || stock_detail_upgrade()}
                          </td>
                        {/if}
                      </tr>
                      <tr class="border-b border-gray-300 dark:border-zinc-700">
                        <td
                          class="text-start text-xs font-semibold uppercase tracking-wide w-96 border-r border-gray-300 dark:border-zinc-700"
                          >{stock_detail_financials_period_ending()}</td
                        >
                        {#each financialData as item, index}
                          <td
                            class="font-semibold text-xs uppercase tracking-wide text-end border-l border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-300"
                          >
                            {new Date(item?.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                        {/each}
                        {#if hasLockedData}
                          <td
                            class="font-semibold text-xs uppercase tracking-wide text-center text-gray-600 dark:text-zinc-300 border-l border-gray-300 dark:border-zinc-700"
                          >
                            {lockedPeriodRange || stock_detail_upgrade()}
                          </td>
                        {/if}
                      </tr>
                    </thead>
                    <tbody
                      class="divide-y divide-gray-200/70 dark:divide-zinc-800/80"
                    >
                      <!-- row -->
                      <FinancialTable
                        data={tableData}
                        fields={tableFields}
                        {enableFavorites}
                        {favoriteStorageKey}
                        periodType={$selectedTimePeriod || "annual"}
                        showUpgradeColumn={hasLockedData}
                        upgradeHref="/pricing"
                        upgradeLabel={stock_detail_upgrade()}
                        onExpandChart={handleExpandChart}
                      />
                    </tbody>
                  </table>
                </div>
              {/if}
              
              <!-- SEC Filings Links -->
              <div
                class="sm:flex sm:justify-between text-sm text-gray-800 dark:text-zinc-300"
              >
                <div class="mt-2 flex ml-auto items-center gap-x-2">
                  {stock_detail_financials_sec_filings()} <a
                    class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition flex items-center"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://www.sec.gov/cgi-bin/browse-edgar?CIK=${data?.getProfileData?.cik}&amp;type=10-K`}
                    >10-K <svg
                      class="size-3.5 ml-0.5 mt-px"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
                      style="max-width:40px"
                      ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      ></path></svg>
                  </a>
                  ·
                  <a
                    class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition flex items-center"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://www.sec.gov/cgi-bin/browse-edgar?CIK=${data?.getProfileData?.cik}&amp;type=10-Q`}
                    >10-Q <svg
                      class="size-3.5 ml-0.5 mt-px"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
                      style="max-width:40px"
                      ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      ></path></svg>
                  </a>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </main>
    </div>
  </div>
</section>

<!-- Expanded Chart Modal -->
<FinancialChartModal
  isOpen={isModalOpen}
  metricKey={modalMetricKey}
  metricLabel={modalMetricLabel}
  data={fullStatement}
  periodType={$selectedTimePeriod || "annual"}
  onClose={handleCloseModal}
/>

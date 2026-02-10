<script lang="ts">
  import { stockTicker } from "$lib/store";
  import { abbreviateNumber, calculatePeriodCAGRs, formatCAGRValue, getCAGRColorClass, sortStatementsChronologicallyForCAGR } from "$lib/utils";
  import { MARGIN_KEYS as marginKeys } from "$lib/financials/constants";
  import { mode } from "mode-watcher";
  import highcharts from "$lib/highcharts.ts";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import {
    getMetricOverlayConfig,
    hasMetricOverlays,
    computeDerivedMetric,
  } from "$lib/financials/metricOverlays";
  import BarChart from "lucide-svelte/icons/chart-column-increasing";
  import LineChart from "lucide-svelte/icons/chart-spline";
  import X from "lucide-svelte/icons/x";
  import { goto } from "$app/navigation";

  export let isOpen: boolean = false;
  export let metricKey: string = "";
  export let metricLabel: string = "";
  export let data: Record<string, any>[] = [];
  export let periodType: "annual" | "quarterly" | "ttm" = "annual";
  export let onClose: () => void = () => {};
  export let userTier: string = "";
  export let overviewConfig: any = null;

  const PREMIUM_TIERS = new Set(["Pro", "Plus"]);
  $: isPremiumUser = PREMIUM_TIERS.has(userTier);

  // State
  let chartMode: "bar" | "line" = "bar";
  let selectedRange: string = "All";
  let selectedOverlay: string = "";
  let config: any = null;

  // Time range options
  const RANGE_OPTIONS = [
    { value: "All", label: "All" },
    { value: "10Y", label: "10Y" },
    { value: "5Y", label: "5Y" },
    { value: "3Y", label: "3Y" },
    { value: "1Y", label: "1Y" },
  ];

  // Get overlay configuration (disabled when overview multi-series is active)
  $: overlayConfig = getMetricOverlayConfig(metricKey);

  // Filter overlays to only those that can produce data from the current dataset
  function canOverlayProduceData(overlay: any, entries: Record<string, any>[]): boolean {
    if (!entries?.length) return false;
    // Check at least one entry produces a non-null value
    return entries.some(entry => {
      if (overlay.computed) {
        return computeDerivedMetric(overlay.key, entry) !== null;
      }
      if (overlay.series?.length) {
        return overlay.series.some((k: string) => {
          const v = entry?.[k];
          return v !== null && v !== undefined && Number.isFinite(Number(v));
        });
      }
      const v = entry?.[overlay.key];
      return v !== null && v !== undefined && Number.isFinite(Number(v));
    });
  }

  $: availableOverlays = overlayConfig?.overlays?.filter(
    (o: any) => canOverlayProduceData(o, data)
  ) || [];
  $: hasOverlays = !overviewConfig && availableOverlays.length > 1;

  // Reset overlay when metric changes — prevents stale state from previous metric
  $: if (metricKey) {
    if (overviewConfig) {
      selectedOverlay = "";
    } else if (availableOverlays.length > 0) {
      const primaryOverlay = availableOverlays.find((o: any) => o.primary);
      selectedOverlay = primaryOverlay?.key || metricKey;
    } else {
      selectedOverlay = "";
    }
  }

  // Check if current metric should be displayed as percentage
  $: isMarginMetric = overviewConfig?.isMargin || marginKeys.has(selectedOverlay) || marginKeys.has(metricKey);

  // Filter data by time range
  function filterByRange(entries: Record<string, any>[], range: string): Record<string, any>[] {
    if (!entries?.length || range === "All") return entries;
    
    const sortedData = sortStatementsChronologicallyForCAGR(entries);
    const periodsPerYear = periodType === "quarterly" || periodType === "ttm" ? 4 : 1;
    
    const yearsMap: Record<string, number> = {
      "1Y": 1,
      "3Y": 3,
      "5Y": 5,
      "10Y": 10,
    };
    
    const years = yearsMap[range];
    if (!years) return sortedData;
    
    const periodsToShow = years * periodsPerYear;
    return sortedData.slice(-periodsToShow);
  }

  // Format date label for x-axis
  function formatDateLabel(entry: Record<string, any>): string {
    const fiscalYear = entry?.fiscalYear || "";
    if (periodType === "quarterly" || periodType === "ttm") {
      const periodLabel = entry?.period || (periodType === "ttm" ? "TTM" : "");
      return periodLabel && fiscalYear ? `${periodLabel} ${fiscalYear}` : fiscalYear;
    }
    return `FY ${fiscalYear}`;
  }

  // Get value for current overlay
  function getOverlayValue(entry: Record<string, any>, overlayKey: string): number | null {
    // Check if it's a computed metric
    const overlay = availableOverlays.find((o: any) => o.key === overlayKey);
    if (overlay?.computed) {
      return computeDerivedMetric(overlayKey, entry);
    }
    
    // Direct metric value
    const value = entry?.[overlayKey];
    if (value === null || value === undefined) return null;
    const numValue = Number(value);
    return Number.isFinite(numValue) ? numValue : null;
  }

  // Fallback margin computation for missing ratios (e.g. FY25 not yet reported)
  function getFallbackMargin(row: Record<string, any>, key: string): number {
    const revenue = Number(row?.revenue);
    if (!Number.isFinite(revenue) || revenue === 0) return NaN;
    switch (key) {
      case 'grossProfitMargin': {
        const v = Number(row?.grossProfit);
        return Number.isFinite(v) ? v / revenue : NaN;
      }
      case 'operatingProfitMargin': {
        const v = Number(row?.operatingIncome);
        return Number.isFinite(v) ? v / revenue : NaN;
      }
      case 'netProfitMargin': {
        const v = Number(row?.netIncome);
        return Number.isFinite(v) ? v / revenue : NaN;
      }
      case 'returnOnCapitalEmployed': {
        const ebit = Number(row?.operatingIncome);
        const denom = Number(row?.totalAssets) - Number(row?.totalCurrentLiabilities);
        return Number.isFinite(ebit) && Number.isFinite(denom) && denom !== 0 ? ebit / denom : NaN;
      }
      default:
        return NaN;
    }
  }

  function formatProfessionalAxisLabel(value: number, isPercent = false): string {
    const safeValue = Number.isFinite(value) ? value : 0;
    const abs = Math.abs(safeValue);

    let formatted = "";
    if (abs >= 1000) {
      formatted = new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 0,
      }).format(safeValue);
    } else if (abs >= 10) {
      formatted = Number(safeValue.toFixed(1)).toLocaleString("en-US", {
        maximumFractionDigits: 1,
      });
    } else {
      formatted = Number(safeValue.toFixed(2)).toLocaleString("en-US", {
        maximumFractionDigits: 2,
      });
    }

    return isPercent ? `${formatted}%` : formatted;
  }

  // Shared chart shell — returns the common Highcharts config structure
  function makeChartShell(dateList: string[], series: any[], stacking?: string) {
    const chartColor = $mode === "light" ? '#F59E0B' : '#FBBF24';
    return {
      chart: {
        type: chartMode === "bar" ? "column" : "spline",
        backgroundColor: $mode === "light" ? "#fff" : "#18181b",
        height: 400,
        animation: false,
        spacing: [20, 10, 20, 10],
      },
      credits: { enabled: false },
      legend: {
        enabled: series.length > 1,
        itemStyle: { color: $mode === "light" ? "#374151" : "#d4d4d8" },
      },
      title: {
        text: `<div class="text-lg font-semibold">${$stockTicker} ${metricLabel}</div>`,
        useHTML: true,
        style: { color: $mode === "light" ? "#111827" : "#f4f4f5" },
      },
      plotOptions: {
        column: {
          borderRadius: 3,
          pointPadding: 0.1,
          groupPadding: 0.15,
          ...(stacking ? { stacking } : {}),
        },
        spline: { lineWidth: 2, marker: { enabled: true, radius: 3 } },
        series: { animation: false },
      },
      xAxis: {
        categories: dateList,
        crosshair: { color: $mode === "light" ? "#d1d5db" : "#3f3f46", width: 1 },
        labels: { style: { color: $mode === "light" ? "#6b7280" : "#a1a1aa" }, rotation: -45 },
        lineColor: $mode === "light" ? "#e5e7eb" : "#27272a",
      },
      yAxis: {
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#f3f4f6" : "#27272a",
        labels: {
          style: { color: $mode === "light" ? "#6b7280" : "#a1a1aa" },
          formatter: function () {
            return formatProfessionalAxisLabel(Number(this.value), isMarginMetric);
          },
        },
        title: {
          text: isMarginMetric ? "Percent (%)" : null,
          style: { color: $mode === "light" ? "#6b7280" : "#a1a1aa" },
        },
        opposite: true,
      },
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        style: { color: "#fff", fontSize: "13px" },
        borderRadius: 8,
        formatter: function () {
          const categoryName = this.points?.[0]?.key ?? this.x;
          // Iterate ALL series so null values show as "n/a"
          const allSeries = this.points?.[0]?.series?.chart?.series || [];
          const xIdx = typeof this.x === 'number' ? this.x : 0;
          let html = `<div class="px-1 py-1"><div class="font-semibold mb-1">${categoryName}</div>`;
          allSeries.forEach((s: any) => {
            const point = s.data?.[xIdx];
            const val = point?.y;
            const formatted = val != null
              ? (Math.abs(val) < 1000 ? val?.toFixed(2) : abbreviateNumber(val))
              : 'n/a';
            const suffix = val != null && isMarginMetric ? '%' : '';
            html += `<div class="flex items-center gap-2">
              <span style="color: ${s.color}">${s.name}:</span>
              <span class="font-medium">${formatted}${suffix}</span>
            </div>`;
          });
          html += `</div>`;
          return html;
        },
      },
      series,
    };
  }

  // Build multi-series chart for overview composite configs (margins, cash & debt, etc.)
  function buildOverviewChartOptions() {
    if (!data?.length || !overviewConfig?.metrics?.length) return null;

    const sortedData = sortStatementsChronologicallyForCAGR(data);
    const rangedData = filterByRange(sortedData, selectedRange);
    if (!rangedData.length) return null;

    const dateList = rangedData.map(entry => formatDateLabel(entry));
    const chartColor = $mode === "light" ? '#F59E0B' : '#FBBF24';
    const COLORS = [chartColor, '#3B82F6', '#EF4444', '#10B981', '#8B5CF6'];
    const isMargin = overviewConfig.isMargin || false;
    const isStacked = overviewConfig.chartType === 'stacked' || overviewConfig.chartType === 'grouped-stacked';

    const series = overviewConfig.metrics.map((m: any, idx: number) => {
      const values = rangedData.map((entry: any) => {
        let val = Number(entry?.[m.key]);
        // Fallback for missing margin ratios
        if ((!Number.isFinite(val) || val === 0) && marginKeys.has(m.key)) {
          const fb = getFallbackMargin(entry, m.key);
          if (Number.isFinite(fb)) val = fb;
        }
        if (!Number.isFinite(val)) return null;
        if (isMargin || marginKeys.has(m.key)) val *= 100;
        if (overviewConfig.negate || m.negate) val = -val;
        return parseFloat(val.toFixed(2));
      });

      return {
        name: m.label,
        data: values,
        color: m.color || COLORS[idx % COLORS.length],
        borderColor: m.color || COLORS[idx % COLORS.length],
        borderRadius: 2,
        animation: false,
        ...(m.stack ? { stack: m.stack } : {}),
      };
    });

    // Drop periods where every series is null (e.g. stock price before history starts)
    const keep = dateList.map((_: any, i: number) => series.some((s: any) => s.data[i] !== null));
    const filteredDates = dateList.filter((_: any, i: number) => keep[i]);
    const filteredSeries = series.map((s: any) => ({ ...s, data: s.data.filter((_: any, i: number) => keep[i]) }));

    if (!filteredSeries.some((s: any) => s.data.some((v: any) => v !== null))) return null;

    return makeChartShell(filteredDates, filteredSeries, isStacked ? 'normal' : undefined);
  }

  // Build chart options (single-series default path)
  function buildChartOptions() {
    // Route to overview builder for all overview charts (single or multi-series)
    if (overviewConfig && overviewConfig.metrics?.length >= 1) {
      return buildOverviewChartOptions();
    }

    if (!data?.length || !metricKey) return null;

    const sortedData = sortStatementsChronologicallyForCAGR(data);
    const rangedData = filterByRange(sortedData, selectedRange);

    const activeKey = selectedOverlay || metricKey;

    const chartData = rangedData
      .map(entry => ({
        label: formatDateLabel(entry),
        value: getOverlayValue(entry, activeKey),
        rawEntry: entry,
      }))
      .filter(item => item.value !== null);

    if (!chartData.length) return null;

    const dateList = chartData.map(d => d.label);
    const valueList = chartData.map(d => isMarginMetric ? (d.value as number) * 100 : d.value);

    const chartColor = $mode === "light" ? '#F59E0B' : '#FBBF24';

    const activeOverlay = overlayConfig?.overlays.find(o => o.key === selectedOverlay);
    let series: any[] = [];

    if (activeOverlay?.series && activeOverlay.series.length > 1) {
      const colors = [chartColor, '#F59E0B', '#10B981', '#8B5CF6'];
      series = activeOverlay.series.map((seriesKey, idx) => {
        const seriesValues = rangedData.map(entry => {
          const val = entry?.[seriesKey];
          if (val === null || val === undefined) return null;
          const numVal = Number(val);
          return Number.isFinite(numVal) ? numVal : null;
        });

        return {
          name: seriesKey.replace(/([A-Z])/g, ' $1').trim(),
          data: seriesValues,
          color: colors[idx % colors.length],
          borderColor: colors[idx % colors.length],
          borderRadius: 2,
          animation: false,
        };
      });
    } else {
      series = [{
        name: metricLabel,
        data: valueList,
        color: chartColor,
        borderColor: chartColor,
        borderRadius: 2,
        animation: false,
      }];
    }

    return makeChartShell(dateList, series);
  }

  // Hide CAGR for multi-series charts (CAGR only makes sense for a single metric)
  $: hideCAGR = overviewConfig?.metrics?.length > 1;

  // Calculate CAGR values
  $: cagrValues = data?.length > 0 ? calculatePeriodCAGRs(data, selectedOverlay || metricKey, periodType) : { '1Y': null, '2Y': null, '5Y': null, '10Y': null };

  // Rebuild chart when any dependency changes
  $: if (isOpen && metricKey && data?.length > 0 && $mode !== undefined && overviewConfig !== undefined) {
    config = buildChartOptions();
  }

  function toggleChartMode() {
    chartMode = chartMode === "bar" ? "line" : "bar";
    config = buildChartOptions();
  }

  function handleRangeSelect(range: string) {
    selectedRange = range;
    config = buildChartOptions();
  }

  function handleOverlaySelect(overlayKey: string) {
    selectedOverlay = overlayKey;
    config = buildChartOptions();
  }

  function handleClose() {
    isOpen = false;
    onClose();
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      handleClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <!-- Modal Backdrop -->
  <div 
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
    on:click={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    <!-- Modal Content -->
    <div 
      class="relative w-full max-w-4xl max-h-[90vh] overflow-auto bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800"
      on:click|stopPropagation
    >
      <!-- Header -->
      <div class="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-4 sm:px-6 py-4">
        <div class="flex items-start justify-between">
          <div>
            <h2 id="modal-title" class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              {metricLabel}
            </h2>
            <p class="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
              {$stockTicker} - {periodType === 'annual' ? 'Annual' : periodType === 'quarterly' ? 'Quarterly' : 'TTM'}
            </p>
          </div>
          <button
            type="button"
            class="cursor-pointer p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
            on:click={handleClose}
            aria-label="Close modal"
          >
            <X class="w-5 h-5 text-gray-500 dark:text-zinc-400" />
          </button>
        </div>

        <!-- Controls Row -->
        <div class="flex flex-wrap items-center gap-2 mt-4">
          <!-- Time Range Dropdown (shadcn pattern) -->
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild let:builder>
              <Button
                builders={[builder]}
                class="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-zinc-700 rounded-2xl bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700"
              >
                <span>{selectedRange}</span>
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
              class="min-w-[100px] rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2 text-gray-700 dark:text-zinc-200 shadow-lg"
            >
              <DropdownMenu.Group>
                {#each RANGE_OPTIONS as option}
                  <DropdownMenu.Item
                    on:click={() => {
                      if (!isPremiumUser) {
                        goto('/pricing');
                      } else {
                        handleRangeSelect(option.value);
                      }
                    }}
                    class="{selectedRange === option.value
                      ? 'bg-gray-100/70 dark:bg-zinc-900/60 text-violet-600 dark:text-violet-400 font-medium'
                      : ''} cursor-pointer hover:text-violet-600 dark:hover:text-violet-400 rounded-xl"
                  >
                    <div class="flex items-center justify-between w-full gap-2">
                      <span>{option.label}</span>
                      {#if !isPremiumUser}
                        <svg
                          class="w-3.5 h-3.5 text-gray-500 dark:text-zinc-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="currentColor"
                            d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                          />
                        </svg>
                      {/if}
                    </div>
                  </DropdownMenu.Item>
                {/each}
              </DropdownMenu.Group>
            </DropdownMenu.Content>
          </DropdownMenu.Root>

          <!-- Chart Mode Toggle -->
          <Button
            on:click={toggleChartMode}
            class="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-zinc-700 rounded-2xl bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700"
          >
            {#if chartMode === "bar"}
              <LineChart class="w-4 h-4" />
              <span>Line</span>
            {:else}
              <BarChart class="w-4 h-4" />
              <span>Bar</span>
            {/if}
          </Button>
        </div>

        <!-- Overlay Tabs (if available) -->
        {#if hasOverlays && availableOverlays.length > 1}
          <div class="flex flex-wrap gap-1.5 mt-3">
            {#each availableOverlays as overlay}
              <button
                type="button"
                class="cursor-pointer px-3 py-1 text-xs font-medium rounded-full border transition {selectedOverlay === overlay.key
                  ? 'border-violet-500 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                  : 'border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'}"
                on:click={() => handleOverlaySelect(overlay.key)}
              >
                {overlay.label}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Chart Area -->
      <div class="px-4 sm:px-6 py-4">
        {#if config}
          <div class="w-full" use:highcharts={config}></div>
        {:else if data?.length > 0}
          <div class="h-[400px] flex flex-col items-center justify-center text-gray-500 dark:text-zinc-400">
            <span class="text-sm">No data available for this metric.</span>
          </div>
        {:else}
          <div class="h-[400px] flex items-center justify-center">
            <span class="loading loading-spinner loading-md text-gray-400"></span>
          </div>
        {/if}
      </div>

      <!-- CAGR Footer (hidden for stacked/grouped-stacked charts) -->
      {#if !hideCAGR}
        <div class="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950/50 rounded-b-2xl">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm font-medium text-gray-700 dark:text-zinc-300 mr-2">CAGR:</span>
            {#if isPremiumUser}
              {#each Object.entries(cagrValues) as [period, value]}
                <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium {getCAGRColorClass(value)}">
                  <span class="text-gray-600 dark:text-zinc-400">{period}:</span>
                  <span>{formatCAGRValue(value)}</span>
                </div>
              {/each}
            {:else}
              {#each Object.entries(cagrValues) as [period]}
                <button
                  type="button"
                  on:click={() => goto('/pricing')}
                  class="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition"
                >
                  <span class="text-gray-600 dark:text-zinc-400">{period}:</span>
                  <svg
                    class="w-3.5 h-3.5 text-gray-500 dark:text-zinc-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                    />
                  </svg>
                </button>
              {/each}
            {/if}
          </div>
          <p class="text-xs text-gray-500 dark:text-zinc-500 mt-2">
            CAGR (Compound Annual Growth Rate) shows the smoothed annual rate of growth over the specified period.
          </p>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* Ensure modal content scrolls properly */
  :global(.financial-modal-chart .highcharts-container) {
    overflow: visible !important;
  }
</style>

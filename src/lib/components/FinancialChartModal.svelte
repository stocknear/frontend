<script lang="ts">
  import { stockTicker } from "$lib/store";
  import { abbreviateNumber, calculatePeriodCAGRs, formatCAGRValue, getCAGRColorClass, sortStatementsChronologicallyForCAGR } from "$lib/utils";
  import { mode } from "mode-watcher";
  import highcharts from "$lib/highcharts.ts";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { 
    getMetricOverlayConfig, 
    hasMetricOverlays, 
    computeDerivedMetric,
    CHART_COLOR_THEMES,
    getMetricColorTheme
  } from "$lib/financials/metricOverlays";
  import BarChart from "lucide-svelte/icons/chart-column-increasing";
  import LineChart from "lucide-svelte/icons/chart-spline";
  import X from "lucide-svelte/icons/x";

  export let isOpen: boolean = false;
  export let metricKey: string = "";
  export let metricLabel: string = "";
  export let data: Record<string, any>[] = [];
  export let periodType: "annual" | "quarterly" | "ttm" = "annual";
  export let onClose: () => void = () => {};

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

  // Margin keys for percentage display
  const marginKeys = new Set([
    "freeCashFlowYield",
    "returnOnEquity",
    "returnOnAssets",
    "returnOnInvestedCapital",
    "returnOnCapitalEmployed",
    "grossProfitMargin",
    "operatingMargin",
    "netProfitMargin",
    "ebitdaMargin",
  ]);

  // Get overlay configuration
  $: overlayConfig = getMetricOverlayConfig(metricKey);
  $: hasOverlays = hasMetricOverlays(metricKey);

  // Initialize overlay on metric change
  $: if (metricKey && overlayConfig) {
    const primaryOverlay = overlayConfig.overlays.find(o => o.primary);
    selectedOverlay = primaryOverlay?.key || metricKey;
  }

  // Check if current metric should be displayed as percentage
  $: isMarginMetric = marginKeys.has(selectedOverlay) || marginKeys.has(metricKey);

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
    const overlay = overlayConfig?.overlays.find(o => o.key === overlayKey);
    if (overlay?.computed) {
      return computeDerivedMetric(overlayKey, entry);
    }
    
    // Direct metric value
    const value = entry?.[overlayKey];
    if (value === null || value === undefined) return null;
    const numValue = Number(value);
    return Number.isFinite(numValue) ? numValue : null;
  }

  // Build chart options
  function buildChartOptions() {
    if (!data?.length || !metricKey) return null;
    
    const sortedData = sortStatementsChronologicallyForCAGR(data);
    const rangedData = filterByRange(sortedData, selectedRange);
    
    // Get the metric key to use (overlay or base metric)
    const activeKey = selectedOverlay || metricKey;
    
    // Extract values
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
    
    // Get chart color
    const themeKey = getMetricColorTheme(metricKey);
    const theme = CHART_COLOR_THEMES[themeKey];
    const chartColor = $mode === "light" ? theme.primary : theme.secondary;
    
    // Check for multi-series overlay (like FCF & SBC)
    const activeOverlay = overlayConfig?.overlays.find(o => o.key === selectedOverlay);
    let series: any[] = [];
    
    if (activeOverlay?.series && activeOverlay.series.length > 1) {
      // Multi-series chart
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
      // Single series chart
      series = [{
        name: metricLabel,
        data: valueList,
        color: chartColor,
        borderColor: chartColor,
        borderRadius: 2,
        animation: false,
      }];
    }
    
    return {
      chart: {
        type: chartMode === "bar" ? "column" : "spline",
        backgroundColor: $mode === "light" ? "#fff" : "#18181b", // zinc-900
        height: 400,
        animation: false,
        spacing: [20, 10, 20, 10],
      },
      credits: { enabled: false },
      legend: { 
        enabled: series.length > 1,
        itemStyle: {
          color: $mode === "light" ? "#374151" : "#d4d4d8",
        },
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
        },
        spline: {
          lineWidth: 2,
          marker: {
            enabled: true,
            radius: 3,
          },
        },
        series: {
          animation: false,
        },
      },
      xAxis: {
        categories: dateList,
        crosshair: {
          color: $mode === "light" ? "#d1d5db" : "#3f3f46",
          width: 1,
        },
        labels: {
          style: { color: $mode === "light" ? "#6b7280" : "#a1a1aa" },
          rotation: -45,
        },
        lineColor: $mode === "light" ? "#e5e7eb" : "#27272a",
      },
      yAxis: {
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#f3f4f6" : "#27272a",
        labels: {
          style: { color: $mode === "light" ? "#6b7280" : "#a1a1aa" },
          formatter: function () {
            const formatted = abbreviateNumber(this.value);
            return isMarginMetric ? `${formatted}%` : formatted;
          },
        },
        title: { text: null },
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
          let html = `<div class="px-1 py-1">
            <div class="font-semibold mb-1">${this.x}</div>`;
          this.points?.forEach((point: any) => {
            const formatted = abbreviateNumber(point.y);
            const suffix = isMarginMetric ? "%" : "";
            html += `<div class="flex items-center gap-2">
              <span style="color: ${point.color}">${point.series.name}:</span>
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

  // Calculate CAGR values
  $: cagrValues = data?.length > 0 ? calculatePeriodCAGRs(data, selectedOverlay || metricKey, periodType) : { '1Y': null, '2Y': null, '5Y': null, '10Y': null };

  // Update chart when dependencies change
  $: if (isOpen && metricKey && data?.length > 0) {
    config = buildChartOptions();
  }

  // Update chart when mode/range/overlay changes
  $: if ($mode !== undefined && isOpen) {
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
                class="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-zinc-700 rounded-2xl bg-white dark:bg-zinc-950 hover:bg-gray-50 dark:hover:bg-zinc-800"
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
              class="min-w-[100px] rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-lg"
            >
              <DropdownMenu.Group>
                {#each RANGE_OPTIONS as option}
                  <DropdownMenu.Item
                    on:click={() => handleRangeSelect(option.value)}
                    class="{selectedRange === option.value
                      ? 'bg-gray-100/70 dark:bg-zinc-900/60 text-violet-600 dark:text-violet-400 font-medium'
                      : ''} cursor-pointer hover:text-violet-600 dark:hover:text-violet-400 rounded-xl"
                  >
                    <span>{option.label}</span>
                  </DropdownMenu.Item>
                {/each}
              </DropdownMenu.Group>
            </DropdownMenu.Content>
          </DropdownMenu.Root>

          <!-- Chart Mode Toggle -->
          <Button
            on:click={toggleChartMode}
            class="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-zinc-700 rounded-2xl bg-white dark:bg-zinc-950 hover:bg-gray-50 dark:hover:bg-zinc-800"
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
        {#if hasOverlays && overlayConfig?.overlays}
          <div class="flex flex-wrap gap-1.5 mt-3">
            {#each overlayConfig.overlays as overlay}
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
        {:else}
          <div class="h-[400px] flex items-center justify-center">
            <span class="loading loading-spinner loading-md text-gray-400"></span>
          </div>
        {/if}
      </div>

      <!-- CAGR Footer -->
      <div class="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950/50 rounded-b-2xl">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm font-medium text-gray-700 dark:text-zinc-300 mr-2">CAGR:</span>
          {#each Object.entries(cagrValues) as [period, value]}
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium {getCAGRColorClass(value)}">
              <span class="text-gray-600 dark:text-zinc-400">{period}:</span>
              <span>{formatCAGRValue(value)}</span>
            </div>
          {/each}
        </div>
        <p class="text-xs text-gray-500 dark:text-zinc-500 mt-2">
          CAGR (Compound Annual Growth Rate) shows the smoothed annual rate of growth over the specified period.
        </p>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Ensure modal content scrolls properly */
  :global(.financial-modal-chart .highcharts-container) {
    overflow: visible !important;
  }
</style>

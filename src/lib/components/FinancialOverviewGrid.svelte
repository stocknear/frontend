<script lang="ts">
  import FinancialOverviewChartCard from "$lib/components/FinancialOverviewChartCard.svelte";
  import { selectedTimePeriod } from "$lib/store";

  export let mergedData: Record<string, any>[] = [];
  export let chartConfig: Array<{
    key: string;
    label: string;
    chartType: 'bar' | 'line' | 'grouped' | 'stacked';
    metrics: Array<{ key: string; label: string; color?: string }>;
    isMargin?: boolean;
  }> = [];
  export let onExpandChart: (metricKey: string, metricLabel: string) => void = () => {};

  // Set of margin/ratio keys displayed as percentages
  const marginKeys = new Set([
    "freeCashFlowYield",
    "returnOnEquity",
    "returnOnAssets",
    "returnOnInvestedCapital",
    "returnOnCapitalEmployed",
    "grossProfitMargin",
    "operatingProfitMargin",
    "netProfitMargin",
    "ebitdaMargin",
  ]);

  // Build xList from merged data
  function buildXList(data: Record<string, any>[]): string[] {
    return data.map(row => {
      const year = row.fiscalYear?.slice?.(-2) || '';
      const period = row.period;
      return $selectedTimePeriod === 'annual'
        ? 'FY' + year
        : 'FY' + year + ' ' + period;
    });
  }

  // Build series data for a chart config entry
  function buildSeriesData(data: Record<string, any>[], config: typeof chartConfig[0]) {
    return config.metrics.map(m => ({
      key: m.key,
      label: m.label,
      color: m.color,
      values: data.map(row => {
        let val = Number(row[m.key]);
        if (Number.isFinite(val) && (config.isMargin || marginKeys.has(m.key))) {
          val = val * 100;
        }
        return Number.isFinite(val) ? parseFloat(val.toFixed(2)) : 0;
      }),
    }));
  }

  // Trim leading zero-only periods from a chart's data so charts with
  // partial coverage (e.g. price data starting in 2015) don't show
  // decades of empty bars.
  function trimLeadingZeros(
    xLabels: string[],
    series: Array<{ key: string; label: string; values: number[]; color?: string }>,
  ): { xList: string[]; series: typeof series } {
    let firstNonZero = 0;
    for (let i = 0; i < xLabels.length; i++) {
      if (series.some(s => s.values[i] !== 0)) {
        firstNonZero = i;
        break;
      }
      if (i === xLabels.length - 1) {
        firstNonZero = xLabels.length; // all zeros
      }
    }
    if (firstNonZero === 0) return { xList: xLabels, series };
    return {
      xList: xLabels.slice(firstNonZero),
      series: series.map(s => ({ ...s, values: s.values.slice(firstNonZero) })),
    };
  }

  // Filter to only configs that have data
  $: xList = buildXList(mergedData);
  $: validCharts = chartConfig.filter(config => {
    const series = buildSeriesData(mergedData, config);
    return series.some(s => s.values.some(v => v !== 0));
  });
</script>

<div class="w-full">
  {#if validCharts.length === 0}
    <div class="flex items-center justify-center py-12 text-gray-500 dark:text-zinc-400">
      <p>No chart data available</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each validCharts as config (config.key)}
        {@const rawSeries = buildSeriesData(mergedData, config)}
        {@const trimmed = trimLeadingZeros(xList, rawSeries)}
        <FinancialOverviewChartCard
          metricKey={config.key}
          metricLabel={config.label}
          xList={trimmed.xList}
          chartType={config.chartType}
          seriesData={trimmed.series}
          isMargin={config.isMargin || false}
          onExpand={onExpandChart}
        />
      {/each}
    </div>
  {/if}
</div>

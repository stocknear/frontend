<script lang="ts">
  import FinancialCustomChartCard from "$lib/components/Financial/FinancialCustomChartCard.svelte";
  import { selectedTimePeriod } from "$lib/store";

  export let mergedData: Record<string, any>[] = [];
  export let chartConfig: Array<{
    key: string;
    label: string;
    chartType: 'bar' | 'line' | 'grouped' | 'stacked' | 'grouped-stacked';
    metrics: Array<{ key: string; label: string; color?: string; negate?: boolean; stack?: string }>;
    isMargin?: boolean;
    negate?: boolean;
  }> = [];
  export let currentPrice: number | undefined = undefined;
  export let onExpandChart: (metricKey: string, metricLabel: string) => void = () => {};

  const marginKeys = new Set([
    "freeCashFlowYield", "returnOnEquity", "returnOnAssets",
    "returnOnInvestedCapital", "returnOnCapitalEmployed",
    "grossProfitMargin", "operatingProfitMargin", "netProfitMargin", "ebitdaMargin",
  ]);

  function buildXList(data: Record<string, any>[]): string[] {
    return data.map(row => {
      const year = row.fiscalYear?.slice?.(-2) || '';
      return $selectedTimePeriod === 'annual'
        ? 'FY' + year
        : 'FY' + year + ' ' + row.period;
    });
  }

  function getFallbackMargin(row: Record<string, any>, key: string): number | null {
    const revenue = Number(row.revenue);
    if (!Number.isFinite(revenue) || revenue === 0) return null;
    switch (key) {
      case 'grossProfitMargin': {
        const v = Number(row.grossProfit);
        return Number.isFinite(v) ? v / revenue : null;
      }
      case 'operatingProfitMargin': {
        const v = Number(row.operatingIncome);
        return Number.isFinite(v) ? v / revenue : null;
      }
      case 'netProfitMargin': {
        const v = Number(row.netIncome);
        return Number.isFinite(v) ? v / revenue : null;
      }
      case 'returnOnCapitalEmployed': {
        const ebit = Number(row.operatingIncome);
        const denom = Number(row.totalAssets) - Number(row.totalCurrentLiabilities);
        return Number.isFinite(ebit) && Number.isFinite(denom) && denom !== 0
          ? ebit / denom : null;
      }
      default:
        return null;
    }
  }

  function buildSeriesData(data: Record<string, any>[], config: typeof chartConfig[0]) {
    return config.metrics.map(m => ({
      key: m.key,
      label: m.label,
      color: m.color,
      stack: m.stack,
      values: data.map(row => {
        let val = Number(row[m.key]);
        if ((!Number.isFinite(val) || val === 0) && marginKeys.has(m.key)) {
          const fallback = getFallbackMargin(row, m.key);
          if (fallback !== null) val = fallback;
        }
        if (Number.isFinite(val) && (config.isMargin || marginKeys.has(m.key))) val *= 100;
        if (Number.isFinite(val) && (config.negate || m.negate)) val = -val;
        return Number.isFinite(val) ? parseFloat(val.toFixed(2)) : null;
      }),
    }));
  }

  function trimLeadingZeros(
    xLabels: string[],
    series: Array<{ key: string; label: string; values: (number | null)[]; color?: string }>,
  ) {
    let firstNonZero = xLabels.length;
    for (let i = 0; i < xLabels.length; i++) {
      if (series.some(s => s.values[i] != null && s.values[i] !== 0)) {
        firstNonZero = i;
        break;
      }
    }
    if (firstNonZero === 0) return { xList: xLabels, series };
    return {
      xList: xLabels.slice(firstNonZero),
      series: series.map(s => ({ ...s, values: s.values.slice(firstNonZero) })),
    };
  }

  // Single reactive pass: build xList, series, trim, filter — no double computation
  $: xList = buildXList(mergedData);
  $: preparedCharts = chartConfig
    .map(config => {
      const series = buildSeriesData(mergedData, config);
      const hasData = series.some(s => s.values.some(v => v != null && v !== 0));
      const trimmed = trimLeadingZeros(xList, series);

      if (config.key === 'stockPrice' && currentPrice != null && Number.isFinite(currentPrice)) {
        return {
          config,
          hasData,
          xList: [...trimmed.xList, 'Current'],
          series: trimmed.series.map(s => ({
            ...s,
            values: [...s.values, parseFloat(Number(currentPrice).toFixed(2))],
          })),
        };
      }
      return { config, hasData, xList: trimmed.xList, series: trimmed.series };
    })
;
</script>

<div class="w-full">
  {#if preparedCharts.length === 0}
    <div class="flex items-center justify-center py-12 text-gray-500 dark:text-zinc-400">
      <p>No chart data available</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each preparedCharts as chart (chart.config.key)}
        {#if chart.hasData}
          <FinancialCustomChartCard
            metricKey={chart.config.key}
            metricLabel={chart.config.label}
            xList={chart.xList}
            chartType={chart.config.chartType}
            seriesData={chart.series}
            isMargin={chart.config.isMargin || false}
            onExpand={onExpandChart}
          />
        {:else}
          <div class="flex flex-col items-center justify-center rounded-xl border border-gray-200 dark:border-zinc-700/70 bg-white dark:bg-zinc-950/60 p-6 min-h-[220px]">
            <span class="text-sm font-semibold text-gray-800 dark:text-zinc-200 mb-2">{chart.config.label}</span>
            <span class="text-xs text-gray-500 dark:text-zinc-400 text-center">No data available for this indicator.</span>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>

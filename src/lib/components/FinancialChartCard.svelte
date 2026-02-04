<script lang="ts">
  import highcharts from "$lib/highcharts.ts";
  import { abbreviateNumber } from "$lib/utils";
  import { mode } from "mode-watcher";
  import { getMetricChartColor, getMetricColorTheme, CHART_COLOR_THEMES } from "$lib/financials/metricOverlays";
  import Maximize from "lucide-svelte/icons/maximize-2";

  export let metricKey: string;
  export let metricLabel: string;
  export let xList: string[] = [];
  export let valueList: number[] = [];
  export let isMargin: boolean = false;
  export let onExpand: (metricKey: string, metricLabel: string) => void = () => {};

  let config: any = null;
  let isLoaded = false;

  // Get color based on metric type
  function getChartColor(): string {
    const themeKey = getMetricColorTheme(metricKey);
    const theme = CHART_COLOR_THEMES[themeKey];
    return $mode === 'light' ? theme.primary : theme.secondary;
  }

  function getChartOptions() {
    const chartColor = getChartColor();
    
    return {
      chart: {
        type: "column",
        backgroundColor: "transparent",
        height: 180,
        animation: false,
        spacing: [10, 5, 10, 5],
        style: {
          overflow: 'visible'
        }
      },
      credits: { enabled: false },
      legend: { enabled: false },
      title: { text: null },
      plotOptions: {
        column: {
          borderRadius: 2,
          pointPadding: 0.1,
          groupPadding: 0.1,
        },
        series: {
          animation: false,
          states: {
            hover: {
              brightness: 0.1
            }
          }
        },
      },
      xAxis: {
        categories: xList,
        labels: {
          enabled: false
        },
        lineWidth: 0,
        tickWidth: 0,
      },
      yAxis: {
        gridLineWidth: 0,
        labels: {
          enabled: false
        },
        title: { text: null },
      },
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        style: {
          color: "#fff",
          fontSize: "12px",
        },
        borderRadius: 6,
        formatter: function () {
          const point = this.points?.[0];
          if (!point) return '';
          const formattedValue = abbreviateNumber(point.y);
          const suffix = isMargin ? '%' : '';
          return `<div class="px-1 py-0.5">
            <span class="font-medium">${point.key}</span><br/>
            <span>${formattedValue}${suffix}</span>
          </div>`;
        },
      },
      series: [
        {
          name: metricLabel,
          data: valueList,
          color: chartColor,
          borderColor: chartColor,
          borderRadius: 2,
        },
      ],
    };
  }

  function handleExpand() {
    onExpand(metricKey, metricLabel);
  }

  // Reactive update when data changes
  $: if ((xList?.length > 0 || valueList?.length > 0) && typeof window !== 'undefined') {
    config = getChartOptions();
    isLoaded = true;
  }

  // Update config when mode changes
  $: if ($mode && isLoaded && typeof window !== 'undefined') {
    config = getChartOptions();
  }
</script>

<div 
  class="group relative bg-white dark:bg-zinc-950/60 border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden hover:border-gray-300 dark:hover:border-zinc-700 transition-all duration-200 hover:shadow-md cursor-pointer"
  role="button"
  tabindex="0"
  on:click={handleExpand}
  on:keydown={(e) => e.key === 'Enter' && handleExpand()}
>
  <!-- Header -->
  <div class="flex items-center justify-between px-3 pt-3 pb-1">
    <h3 class="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate pr-2">
      {metricLabel}
    </h3>
    <button
      type="button"
      class="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
      on:click|stopPropagation={handleExpand}
      aria-label="Expand chart"
    >
      <Maximize class="w-4 h-4 text-gray-500 dark:text-zinc-400" />
    </button>
  </div>

  <!-- Chart -->
  <div class="px-2 pb-2">
    {#if !isLoaded || !config}
      <div class="h-[180px] flex items-center justify-center">
        <span class="loading loading-spinner loading-sm text-gray-400"></span>
      </div>
    {:else}
      <div class="h-[180px]" use:highcharts={config}></div>
    {/if}
  </div>

  <!-- Latest Value Badge -->
  {#if valueList.length > 0}
    {@const latestValue = valueList[valueList.length - 1]}
    {@const previousValue = valueList.length > 1 ? valueList[valueList.length - 2] : null}
    {@const change = previousValue !== null && previousValue !== 0 
      ? ((latestValue - previousValue) / Math.abs(previousValue)) * 100 
      : null}
    <div class="absolute bottom-2 left-3 flex items-center gap-2">
      <span class="text-xs font-semibold text-gray-700 dark:text-zinc-300">
        {isMargin 
          ? `${abbreviateNumber(latestValue)}%` 
          : abbreviateNumber(latestValue)}
      </span>
      {#if change !== null}
        <span class="text-[10px] font-medium px-1.5 py-0.5 rounded {change >= 0 
          ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30' 
          : 'text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/30'}">
          {change >= 0 ? '+' : ''}{change.toFixed(1)}%
        </span>
      {/if}
    </div>
  {/if}
</div>

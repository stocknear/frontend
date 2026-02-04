<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import highcharts from "$lib/highcharts.ts";
  import { abbreviateNumber } from "$lib/utils";
  import { mode } from "mode-watcher";
  import { getMetricColorTheme, CHART_COLOR_THEMES } from "$lib/financials/metricOverlays";
  import Maximize from "lucide-svelte/icons/maximize-2";

  export let metricKey: string;
  export let metricLabel: string;
  export let xList: string[] = [];
  export let valueList: number[] = [];
  export let isMargin: boolean = false;
  export let onExpand: (metricKey: string, metricLabel: string) => void = () => {};

  let config: any = null;
  let isVisible = false;
  let hasBeenVisible = false; // Once visible, stay rendered
  let cardElement: HTMLDivElement;
  let observer: IntersectionObserver | null = null;

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

  // Setup IntersectionObserver for lazy loading
  onMount(() => {
    if (typeof window === 'undefined' || !cardElement) return;

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasBeenVisible) {
            isVisible = true;
            hasBeenVisible = true;
            // Build chart config only when visible
            if (xList?.length > 0 && valueList?.length > 0) {
              config = getChartOptions();
            }
            // Disconnect after first visibility - no need to observe anymore
            observer?.disconnect();
          }
        });
      },
      {
        root: null,
        rootMargin: '100px', // Start loading 100px before entering viewport
        threshold: 0
      }
    );

    observer.observe(cardElement);
  });

  onDestroy(() => {
    observer?.disconnect();
  });

  // Update config when mode changes (only if already visible)
  $: if ($mode && hasBeenVisible && xList?.length > 0 && valueList?.length > 0) {
    config = getChartOptions();
  }

  // Update config when data changes (only if already visible)
  $: if (hasBeenVisible && (xList?.length > 0 || valueList?.length > 0)) {
    config = getChartOptions();
  }
</script>

<div 
  bind:this={cardElement}
  class="group relative bg-white dark:bg-zinc-950/60 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:border-gray-300 dark:hover:border-zinc-700 transition-all duration-200 hover:shadow-md cursor-pointer"
  role="button"
  tabindex="0"
  on:click={handleExpand}
  on:keydown={(e) => e.key === 'Enter' && handleExpand()}
>
  <!-- Header with Value Badge -->
  <div class="flex items-center justify-between px-3 pt-3 pb-1">
    <div class="flex items-center gap-2 min-w-0">
      <h3 class="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">
        {metricLabel}
      </h3>
      {#if valueList.length > 0}
        {@const latestValue = valueList[valueList.length - 1]}
        {@const previousValue = valueList.length > 1 ? valueList[valueList.length - 2] : null}
        {@const change = previousValue !== null && previousValue !== 0 
          ? ((latestValue - previousValue) / Math.abs(previousValue)) * 100 
          : null}
        <span class="text-xs font-semibold text-gray-600 dark:text-zinc-400 shrink-0">
          {isMargin 
            ? `${abbreviateNumber(latestValue)}%` 
            : abbreviateNumber(latestValue)}
        </span>
        {#if change !== null}
          <span class="text-[10px] font-medium px-1.5 py-0.5 rounded-2xl shrink-0 {change >= 0 
            ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30' 
            : 'text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/30'}">
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
        {/if}
      {/if}
    </div>
    <button
      type="button"
      class="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-2xl hover:bg-gray-100 dark:hover:bg-zinc-800 shrink-0"
      on:click|stopPropagation={handleExpand}
      aria-label="Expand chart"
    >
      <Maximize class="w-4 h-4 text-gray-500 dark:text-zinc-400" />
    </button>
  </div>

  <!-- Chart - Lazy loaded -->
  <div class="px-2 pb-3">
    {#if !hasBeenVisible}
      <!-- Placeholder skeleton while not yet visible -->
      <div class="h-[180px] flex items-center justify-center bg-gray-50 dark:bg-zinc-900/30 rounded-lg">
        <div class="flex flex-col items-center gap-2">
          <div class="w-24 h-2 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse"></div>
          <div class="w-16 h-2 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse"></div>
        </div>
      </div>
    {:else if !config}
      <div class="h-[180px] flex items-center justify-center">
        <span class="loading loading-spinner loading-sm text-gray-400"></span>
      </div>
    {:else}
      <div class="h-[180px]" use:highcharts={config}></div>
    {/if}
  </div>
</div>

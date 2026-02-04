<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
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

  let canvasElement: HTMLCanvasElement;
  let cardElement: HTMLDivElement;
  let observer: IntersectionObserver | null = null;
  let hasBeenVisible = false;
  let tooltipVisible = false;
  let tooltipX = 0;
  let tooltipY = 0;
  let tooltipData: { label: string; value: string } | null = null;

  // Chart dimensions
  const CHART_HEIGHT = 160;
  const CHART_PADDING = { top: 10, right: 10, bottom: 35, left: 10 };

  // Get color based on metric type
  function getChartColor(): string {
    const themeKey = getMetricColorTheme(metricKey);
    const theme = CHART_COLOR_THEMES[themeKey];
    return $mode === 'light' ? theme.primary : theme.secondary;
  }

  function drawChart() {
    if (!canvasElement || !valueList?.length) return;

    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;

    // Get device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvasElement.getBoundingClientRect();
    
    // Set canvas size accounting for device pixel ratio
    canvasElement.width = rect.width * dpr;
    canvasElement.height = CHART_HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = CHART_HEIGHT;
    const chartWidth = width - CHART_PADDING.left - CHART_PADDING.right;
    const chartHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate bar dimensions
    const barCount = valueList.length;
    const barGap = Math.max(1, Math.min(3, chartWidth / barCount * 0.15));
    const barWidth = Math.max(2, (chartWidth - (barCount - 1) * barGap) / barCount);

    // Find min/max for scaling (handle negative values)
    const minValue = Math.min(0, ...valueList);
    const maxValue = Math.max(0, ...valueList);
    const valueRange = maxValue - minValue || 1;

    // Calculate zero line position
    const zeroY = CHART_PADDING.top + chartHeight * (maxValue / valueRange);

    // Get chart color
    const barColor = getChartColor();

    // Draw bars
    valueList.forEach((value, index) => {
      const x = CHART_PADDING.left + index * (barWidth + barGap);
      const barHeight = Math.abs(value / valueRange) * chartHeight;
      
      let y: number;
      if (value >= 0) {
        y = zeroY - barHeight;
      } else {
        y = zeroY;
      }

      // Draw bar with rounded top corners
      ctx.fillStyle = barColor;
      ctx.beginPath();
      const radius = Math.min(2, barWidth / 4);
      
      if (value >= 0) {
        // Rounded top for positive bars
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, y + barHeight);
        ctx.lineTo(x, y + barHeight);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
      } else {
        // Rounded bottom for negative bars
        ctx.moveTo(x, y);
        ctx.lineTo(x + barWidth, y);
        ctx.lineTo(x + barWidth, y + barHeight - radius);
        ctx.quadraticCurveTo(x + barWidth, y + barHeight, x + barWidth - radius, y + barHeight);
        ctx.lineTo(x + radius, y + barHeight);
        ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - radius);
        ctx.lineTo(x, y);
      }
      ctx.fill();
    });

    // Draw x-axis labels (show ~5-6 labels)
    const labelStep = Math.max(1, Math.ceil(xList.length / 6));
    ctx.fillStyle = $mode === 'light' ? '#6b7280' : '#a1a1aa';
    ctx.font = '9px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';

    xList.forEach((label, index) => {
      if (index % labelStep === 0 || index === xList.length - 1) {
        const x = CHART_PADDING.left + index * (barWidth + barGap) + barWidth / 2;
        const y = height - 8;
        
        // Rotate text
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-Math.PI / 6); // -30 degrees
        ctx.fillText(label, 0, 0);
        ctx.restore();
      }
    });
  }

  function handleMouseMove(event: MouseEvent) {
    if (!canvasElement || !valueList?.length) return;

    const rect = canvasElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const chartWidth = rect.width - CHART_PADDING.left - CHART_PADDING.right;
    const barCount = valueList.length;
    const barGap = Math.max(1, Math.min(3, chartWidth / barCount * 0.15));
    const barWidth = Math.max(2, (chartWidth - (barCount - 1) * barGap) / barCount);

    // Find which bar is hovered
    const relativeX = x - CHART_PADDING.left;
    const barIndex = Math.floor(relativeX / (barWidth + barGap));

    if (barIndex >= 0 && barIndex < valueList.length) {
      const value = valueList[barIndex];
      const label = xList[barIndex] || '';
      const formattedValue = abbreviateNumber(value);
      const suffix = isMargin ? '%' : '';

      tooltipData = { label, value: `${formattedValue}${suffix}` };
      tooltipX = event.clientX - rect.left;
      tooltipY = event.clientY - rect.top - 40;
      tooltipVisible = true;
    } else {
      tooltipVisible = false;
    }
  }

  function handleMouseLeave() {
    tooltipVisible = false;
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
            hasBeenVisible = true;
            // Draw chart after becoming visible
            tick().then(() => {
              drawChart();
            });
            observer?.disconnect();
          }
        });
      },
      {
        root: null,
        rootMargin: '50px',
        threshold: 0
      }
    );

    observer.observe(cardElement);
  });

  onDestroy(() => {
    observer?.disconnect();
  });

  // Redraw when mode changes
  $: if ($mode && hasBeenVisible && canvasElement) {
    drawChart();
  }

  // Redraw when data changes
  $: if (hasBeenVisible && canvasElement && valueList?.length > 0) {
    drawChart();
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
      class="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-2xl hover:bg-gray-100 dark:hover:bg-zinc-800 shrink-0"
      on:click|stopPropagation={handleExpand}
      aria-label="Expand chart"
    >
      <Maximize class="w-4 h-4 text-gray-500 dark:text-zinc-400" />
    </button>
  </div>

  <!-- Chart - Canvas based (lightweight) -->
  <div class="px-2 pb-2 relative">
    {#if !hasBeenVisible}
      <!-- Placeholder skeleton while not yet visible -->
      <div class="h-[160px] flex items-center justify-center bg-gray-50 dark:bg-zinc-900/30 rounded-lg">
        <div class="flex flex-col items-center gap-2">
          <div class="w-24 h-2 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse"></div>
          <div class="w-16 h-2 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse"></div>
        </div>
      </div>
    {:else}
      <canvas
        bind:this={canvasElement}
        class="w-full"
        style="height: {CHART_HEIGHT}px;"
        on:mousemove={handleMouseMove}
        on:mouseleave={handleMouseLeave}
      ></canvas>
      
      <!-- Tooltip -->
      {#if tooltipVisible && tooltipData}
        <div 
          class="absolute pointer-events-none z-10 px-2 py-1 rounded-lg bg-black/90 text-white text-xs whitespace-nowrap"
          style="left: {tooltipX}px; top: {tooltipY}px; transform: translateX(-50%);"
        >
          <div class="font-medium">{tooltipData.label}</div>
          <div>{tooltipData.value}</div>
        </div>
      {/if}
    {/if}
  </div>
</div>

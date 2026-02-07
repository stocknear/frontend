<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import { abbreviateNumber } from "$lib/utils";
  import { mode } from "mode-watcher";
  import { CHART_COLOR_THEMES } from "$lib/financials/metricOverlays";
  import Maximize from "lucide-svelte/icons/maximize-2";

  export let metricKey: string;
  export let metricLabel: string;
  export let xList: string[] = [];
  export let chartType: 'bar' | 'line' | 'grouped' | 'stacked' = 'bar';
  export let seriesData: Array<{ key: string; label: string; values: number[]; color?: string }> = [];
  export let isMargin: boolean = false;
  export let onExpand: (metricKey: string, metricLabel: string) => void = () => {};

  // Color palette for multi-series charts
  const SERIES_COLORS = [
    { light: '#F59E0B', dark: '#FBBF24' }, // Amber
    { light: '#3B82F6', dark: '#60A5FA' }, // Blue
    { light: '#EF4444', dark: '#F87171' }, // Red
    { light: '#10B981', dark: '#34D399' }, // Emerald
    { light: '#8B5CF6', dark: '#A78BFA' }, // Violet
  ];

  let canvasElement: HTMLCanvasElement;
  let cardElement: HTMLDivElement;
  let observer: IntersectionObserver | null = null;
  let hasBeenVisible = false;
  let tooltipVisible = false;
  let tooltipX = 0;
  let tooltipY = 0;
  let tooltipData: { label: string; lines: string[] } | null = null;

  const CHART_HEIGHT = 160;
  const CHART_PADDING = { top: 10, right: 10, bottom: 35, left: 10 };

  function getSeriesColor(index: number): string {
    const s = seriesData[index];
    if (s?.color) return s.color;
    const palette = SERIES_COLORS[index % SERIES_COLORS.length];
    return $mode === 'light' ? palette.light : palette.dark;
  }

  function drawChart() {
    if (!canvasElement || !xList?.length || !seriesData?.length) return;

    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvasElement.getBoundingClientRect();
    canvasElement.width = rect.width * dpr;
    canvasElement.height = CHART_HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = CHART_HEIGHT;
    const chartWidth = width - CHART_PADDING.left - CHART_PADDING.right;
    const chartHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;

    ctx.clearRect(0, 0, width, height);

    const barCount = xList.length;
    const barGap = Math.max(1, Math.min(3, chartWidth / barCount * 0.15));

    if (chartType === 'line') {
      drawLine(ctx, chartWidth, chartHeight, barCount, barGap);
    } else if (chartType === 'bar') {
      drawSingleBars(ctx, chartWidth, chartHeight, barCount, barGap);
    } else if (chartType === 'grouped') {
      drawGroupedBars(ctx, chartWidth, chartHeight, barCount, barGap);
    } else if (chartType === 'stacked') {
      drawStackedBars(ctx, chartWidth, chartHeight, barCount, barGap);
    }

    drawXLabels(ctx, chartWidth, height, barCount, barGap);
  }

  function drawLine(ctx: CanvasRenderingContext2D, chartWidth: number, chartHeight: number, barCount: number, barGap: number) {
    const values = seriesData[0]?.values || [];
    const barWidth = Math.max(2, (chartWidth - (barCount - 1) * barGap) / barCount);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;
    const lineColor = getSeriesColor(0);

    // Draw filled area under the line
    ctx.beginPath();
    values.forEach((value, index) => {
      const x = CHART_PADDING.left + index * (barWidth + barGap) + barWidth / 2;
      const y = CHART_PADDING.top + chartHeight * (1 - (value - minValue) / valueRange);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    // Close the area path
    const lastX = CHART_PADDING.left + (values.length - 1) * (barWidth + barGap) + barWidth / 2;
    const firstX = CHART_PADDING.left + barWidth / 2;
    const bottomY = CHART_PADDING.top + chartHeight;
    ctx.lineTo(lastX, bottomY);
    ctx.lineTo(firstX, bottomY);
    ctx.closePath();
    ctx.fillStyle = lineColor + '18'; // ~10% opacity
    ctx.fill();

    // Draw the line
    ctx.beginPath();
    values.forEach((value, index) => {
      const x = CHART_PADDING.left + index * (barWidth + barGap) + barWidth / 2;
      const y = CHART_PADDING.top + chartHeight * (1 - (value - minValue) / valueRange);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function drawSingleBars(ctx: CanvasRenderingContext2D, chartWidth: number, chartHeight: number, barCount: number, barGap: number) {
    const values = seriesData[0]?.values || [];
    const barWidth = Math.max(2, (chartWidth - (barCount - 1) * barGap) / barCount);
    const minValue = Math.min(0, ...values);
    const maxValue = Math.max(0, ...values);
    const valueRange = maxValue - minValue || 1;
    const zeroY = CHART_PADDING.top + chartHeight * (maxValue / valueRange);
    const barColor = getSeriesColor(0);

    values.forEach((value, index) => {
      const x = CHART_PADDING.left + index * (barWidth + barGap);
      const barHeight = Math.abs(value / valueRange) * chartHeight;
      const y = value >= 0 ? zeroY - barHeight : zeroY;

      ctx.fillStyle = barColor;
      drawRoundedBar(ctx, x, y, barWidth, barHeight, value >= 0);
    });
  }

  function drawGroupedBars(ctx: CanvasRenderingContext2D, chartWidth: number, chartHeight: number, barCount: number, barGap: number) {
    const numSeries = seriesData.length;
    const groupWidth = Math.max(2, (chartWidth - (barCount - 1) * barGap) / barCount);
    const subBarGap = 1;
    const subBarWidth = Math.max(1, (groupWidth - (numSeries - 1) * subBarGap) / numSeries);

    // Find global min/max across all series
    let globalMin = 0, globalMax = 0;
    for (const s of seriesData) {
      for (const v of s.values) {
        if (v < globalMin) globalMin = v;
        if (v > globalMax) globalMax = v;
      }
    }
    const valueRange = globalMax - globalMin || 1;
    const zeroY = CHART_PADDING.top + chartHeight * (globalMax / valueRange);

    for (let i = 0; i < barCount; i++) {
      const groupX = CHART_PADDING.left + i * (groupWidth + barGap);
      for (let s = 0; s < numSeries; s++) {
        const value = seriesData[s]?.values[i] || 0;
        const barHeight = Math.abs(value / valueRange) * chartHeight;
        const x = groupX + s * (subBarWidth + subBarGap);
        const y = value >= 0 ? zeroY - barHeight : zeroY;

        ctx.fillStyle = getSeriesColor(s);
        drawRoundedBar(ctx, x, y, subBarWidth, barHeight, value >= 0);
      }
    }
  }

  function drawStackedBars(ctx: CanvasRenderingContext2D, chartWidth: number, chartHeight: number, barCount: number, barGap: number) {
    const barWidth = Math.max(2, (chartWidth - (barCount - 1) * barGap) / barCount);

    // Compute stacked totals for scaling
    let globalMax = 0, globalMin = 0;
    for (let i = 0; i < barCount; i++) {
      let posSum = 0, negSum = 0;
      for (const s of seriesData) {
        const v = s.values[i] || 0;
        if (v >= 0) posSum += v;
        else negSum += v;
      }
      if (posSum > globalMax) globalMax = posSum;
      if (negSum < globalMin) globalMin = negSum;
    }
    const valueRange = globalMax - globalMin || 1;
    const zeroY = CHART_PADDING.top + chartHeight * (globalMax / valueRange);

    for (let i = 0; i < barCount; i++) {
      let posOffset = 0;
      let negOffset = 0;
      const x = CHART_PADDING.left + i * (barWidth + barGap);

      for (let s = 0; s < seriesData.length; s++) {
        const value = seriesData[s]?.values[i] || 0;
        const barHeight = Math.abs(value / valueRange) * chartHeight;

        let y: number;
        if (value >= 0) {
          y = zeroY - posOffset - barHeight;
          posOffset += barHeight;
        } else {
          y = zeroY + negOffset;
          negOffset += barHeight;
        }

        ctx.fillStyle = getSeriesColor(s);
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    }
  }

  function drawRoundedBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, isPositive: boolean) {
    const radius = Math.min(2, w / 4);
    ctx.beginPath();
    if (isPositive) {
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
    } else {
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y);
    }
    ctx.fill();
  }

  function drawXLabels(ctx: CanvasRenderingContext2D, chartWidth: number, height: number, barCount: number, barGap: number) {
    const barWidth = Math.max(2, (chartWidth - (barCount - 1) * barGap) / barCount);
    const labelStep = Math.max(1, Math.ceil(xList.length / 6));
    ctx.fillStyle = $mode === 'light' ? '#6b7280' : '#a1a1aa';
    ctx.font = '9px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';

    xList.forEach((label, index) => {
      if (index % labelStep === 0 || index === xList.length - 1) {
        const x = CHART_PADDING.left + index * (barWidth + barGap) + barWidth / 2;
        const y = height - 8;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-Math.PI / 6);
        ctx.fillText(label, 0, 0);
        ctx.restore();
      }
    });
  }

  function handleMouseMove(event: MouseEvent) {
    if (!canvasElement || !xList?.length) return;

    const rect = canvasElement.getBoundingClientRect();
    const x = event.clientX - rect.left;

    const chartWidth = rect.width - CHART_PADDING.left - CHART_PADDING.right;
    const barCount = xList.length;
    const barGap = Math.max(1, Math.min(3, chartWidth / barCount * 0.15));
    const barWidth = Math.max(2, (chartWidth - (barCount - 1) * barGap) / barCount);

    const relativeX = x - CHART_PADDING.left;
    const barIndex = Math.floor(relativeX / (barWidth + barGap));

    if (barIndex >= 0 && barIndex < xList.length) {
      const label = xList[barIndex] || '';
      const suffix = isMargin ? '%' : '';
      const lines = seriesData.map(s => {
        const val = s.values[barIndex];
        return `${s.label}: ${abbreviateNumber(val)}${suffix}`;
      });

      tooltipData = { label, lines };
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

  // Latest value display — find last non-zero value in primary series
  function findLastNonZero(values: number[]): { value: number | null; prevValue: number | null } {
    for (let i = values.length - 1; i >= 0; i--) {
      if (values[i] !== 0) {
        const prev = i > 0 ? values[i - 1] : null;
        return { value: values[i], prevValue: prev !== 0 ? prev : null };
      }
    }
    return { value: null, prevValue: null };
  }

  $: ({ value: latestValue, prevValue: previousValue } = seriesData[0]?.values?.length > 0
    ? findLastNonZero(seriesData[0].values)
    : { value: null, prevValue: null });
  $: change = previousValue !== null && previousValue !== 0 && latestValue !== null
    ? ((latestValue - previousValue) / Math.abs(previousValue)) * 100
    : null;

  onMount(() => {
    if (typeof window === 'undefined' || !cardElement) return;

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasBeenVisible) {
            hasBeenVisible = true;
            tick().then(() => drawChart());
            observer?.disconnect();
          }
        });
      },
      { root: null, rootMargin: '50px', threshold: 0 }
    );

    observer.observe(cardElement);
  });

  onDestroy(() => {
    observer?.disconnect();
  });

  $: if ($mode && hasBeenVisible && canvasElement) {
    drawChart();
  }

  $: if (hasBeenVisible && canvasElement && seriesData?.length > 0 && xList?.length > 0) {
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
  <!-- Header -->
  <div class="flex items-center justify-between px-3 pt-3 pb-1">
    <div class="flex items-center gap-2 min-w-0">
      <h3 class="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">
        {metricLabel}
      </h3>
      {#if latestValue !== null}
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

  <!-- Legend for multi-series -->
  {#if seriesData.length > 1}
    <div class="flex flex-wrap gap-x-3 gap-y-0.5 px-3 pb-1">
      {#each seriesData as s, i}
        <div class="flex items-center gap-1">
          <div class="w-2 h-2 rounded-full" style="background-color: {getSeriesColor(i)}"></div>
          <span class="text-[10px] text-gray-500 dark:text-zinc-400">{s.label}</span>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Chart -->
  <div class="px-2 pb-2 relative">
    {#if !hasBeenVisible}
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

      {#if tooltipVisible && tooltipData}
        <div
          class="absolute pointer-events-none z-10 px-2 py-1 rounded-lg bg-black/90 text-white text-xs whitespace-nowrap"
          style="left: {tooltipX}px; top: {tooltipY}px; transform: translateX(-50%);"
        >
          <div class="font-medium">{tooltipData.label}</div>
          {#each tooltipData.lines as line}
            <div>{line}</div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>

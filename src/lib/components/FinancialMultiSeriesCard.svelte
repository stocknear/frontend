<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import { abbreviateNumber } from "$lib/utils";
  import { mode } from "mode-watcher";
  import Maximize from "lucide-svelte/icons/maximize-2";

  export let metricLabel: string;
  export let xList: string[] = [];
  export let series: { label: string; values: number[]; color: string; darkColor: string }[] = [];
  export let chartType: "grouped-bar" | "multi-line" = "grouped-bar";
  export let isMargin: boolean = false;
  export let onExpand: () => void = () => {};

  let canvasElement: HTMLCanvasElement;
  let cardElement: HTMLDivElement;
  let observer: IntersectionObserver | null = null;
  let hasBeenVisible = false;
  let tooltipVisible = false;
  let tooltipX = 0;
  let tooltipY = 0;
  let tooltipData: { label: string; items: { name: string; value: string; color: string }[] } | null = null;

  const CHART_HEIGHT = 160;
  const CHART_PADDING = { top: 10, right: 10, bottom: 35, left: 10 };

  function getSeriesColor(s: typeof series[0]): string {
    return $mode === 'light' ? s.color : s.darkColor;
  }

  function drawChart() {
    if (!canvasElement || !series?.length || !xList?.length) return;

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

    if (chartType === "grouped-bar") {
      drawGroupedBars(ctx, chartWidth, chartHeight);
    } else {
      drawMultiLine(ctx, chartWidth, chartHeight);
    }

    drawXLabels(ctx, chartWidth, height);
  }

  function drawGroupedBars(ctx: CanvasRenderingContext2D, chartWidth: number, chartHeight: number) {
    const dataLength = xList.length;
    const seriesCount = series.length;
    if (!dataLength || !seriesCount) return;

    let minValue = 0, maxValue = 0;
    for (const s of series) {
      for (const v of s.values) {
        if (Number.isFinite(v)) {
          if (v < minValue) minValue = v;
          if (v > maxValue) maxValue = v;
        }
      }
    }
    const valueRange = maxValue - minValue || 1;
    const zeroY = CHART_PADDING.top + chartHeight * (maxValue / valueRange);

    const groupGap = Math.max(2, chartWidth / dataLength * 0.2);
    const groupWidth = (chartWidth - (dataLength - 1) * groupGap) / dataLength;
    const barGapInGroup = 1;
    const barWidth = (groupWidth - (seriesCount - 1) * barGapInGroup) / seriesCount;

    for (let i = 0; i < dataLength; i++) {
      const groupX = CHART_PADDING.left + i * (groupWidth + groupGap);

      for (let s = 0; s < seriesCount; s++) {
        const value = series[s].values[i] ?? 0;
        if (!Number.isFinite(value)) continue;
        const barHeight = Math.abs(value / valueRange) * chartHeight;
        const x = groupX + s * (barWidth + barGapInGroup);
        const y = value >= 0 ? zeroY - barHeight : zeroY;

        ctx.fillStyle = getSeriesColor(series[s]);
        ctx.beginPath();
        const radius = Math.min(2, barWidth / 4);

        if (value >= 0) {
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + barWidth - radius, y);
          ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
          ctx.lineTo(x + barWidth, y + barHeight);
          ctx.lineTo(x, y + barHeight);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
        } else {
          ctx.moveTo(x, y);
          ctx.lineTo(x + barWidth, y);
          ctx.lineTo(x + barWidth, y + barHeight - radius);
          ctx.quadraticCurveTo(x + barWidth, y + barHeight, x + barWidth - radius, y + barHeight);
          ctx.lineTo(x + radius, y + barHeight);
          ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - radius);
          ctx.lineTo(x, y);
        }
        ctx.fill();
      }
    }
  }

  function drawMultiLine(ctx: CanvasRenderingContext2D, chartWidth: number, chartHeight: number) {
    let minValue = Infinity, maxValue = -Infinity;
    for (const s of series) {
      for (const v of s.values) {
        if (Number.isFinite(v)) {
          if (v < minValue) minValue = v;
          if (v > maxValue) maxValue = v;
        }
      }
    }
    if (minValue === Infinity) return;

    const padding = (maxValue - minValue) * 0.1 || 1;
    minValue -= padding;
    maxValue += padding;
    const valueRange = maxValue - minValue;

    const stepX = xList.length > 1 ? chartWidth / (xList.length - 1) : chartWidth;

    for (const s of series) {
      const color = getSeriesColor(s);

      // Draw area fill
      ctx.beginPath();
      let started = false;
      let firstX = 0, lastX = 0;
      for (let i = 0; i < s.values.length; i++) {
        const v = s.values[i];
        if (!Number.isFinite(v)) continue;
        const x = CHART_PADDING.left + i * stepX;
        const y = CHART_PADDING.top + chartHeight - ((v - minValue) / valueRange) * chartHeight;
        if (!started) {
          ctx.moveTo(x, y);
          firstX = x;
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
        lastX = x;
      }
      if (started) {
        ctx.lineTo(lastX, CHART_PADDING.top + chartHeight);
        ctx.lineTo(firstX, CHART_PADDING.top + chartHeight);
        ctx.closePath();
        ctx.fillStyle = color + '18';
        ctx.fill();
      }

      // Draw line
      ctx.beginPath();
      started = false;
      for (let i = 0; i < s.values.length; i++) {
        const v = s.values[i];
        if (!Number.isFinite(v)) continue;
        const x = CHART_PADDING.left + i * stepX;
        const y = CHART_PADDING.top + chartHeight - ((v - minValue) / valueRange) * chartHeight;
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function drawXLabels(ctx: CanvasRenderingContext2D, chartWidth: number, height: number) {
    const labelStep = Math.max(1, Math.ceil(xList.length / 6));
    ctx.fillStyle = $mode === 'light' ? '#6b7280' : '#a1a1aa';
    ctx.font = '9px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';

    const dataLength = xList.length;
    if (!dataLength) return;

    if (chartType === "grouped-bar") {
      const groupGap = Math.max(2, chartWidth / dataLength * 0.2);
      const groupWidth = (chartWidth - (dataLength - 1) * groupGap) / dataLength;

      xList.forEach((label, index) => {
        if (index % labelStep === 0 || index === xList.length - 1) {
          const x = CHART_PADDING.left + index * (groupWidth + groupGap) + groupWidth / 2;
          const y = height - 8;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(-Math.PI / 6);
          ctx.fillText(label, 0, 0);
          ctx.restore();
        }
      });
    } else {
      const stepX = dataLength > 1 ? chartWidth / (dataLength - 1) : chartWidth;
      xList.forEach((label, index) => {
        if (index % labelStep === 0 || index === xList.length - 1) {
          const x = CHART_PADDING.left + index * stepX;
          const y = height - 8;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(-Math.PI / 6);
          ctx.fillText(label, 0, 0);
          ctx.restore();
        }
      });
    }
  }

  function handleMouseMove(event: MouseEvent) {
    if (!canvasElement || !xList?.length || !series?.length) return;

    const rect = canvasElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const chartWidth = rect.width - CHART_PADDING.left - CHART_PADDING.right;
    const relativeX = x - CHART_PADDING.left;

    let barIndex: number;
    if (chartType === "grouped-bar") {
      const dataLength = xList.length;
      const groupGap = Math.max(2, chartWidth / dataLength * 0.2);
      const groupWidth = (chartWidth - (dataLength - 1) * groupGap) / dataLength;
      barIndex = Math.floor(relativeX / (groupWidth + groupGap));
    } else {
      const stepX = xList.length > 1 ? chartWidth / (xList.length - 1) : chartWidth;
      barIndex = Math.round(relativeX / stepX);
    }

    if (barIndex >= 0 && barIndex < xList.length) {
      const label = xList[barIndex] || '';
      const items = series.map(s => {
        const value = s.values[barIndex] ?? 0;
        const formatted = abbreviateNumber(value);
        const suffix = isMargin ? '%' : '';
        return { name: s.label, value: `${formatted}${suffix}`, color: getSeriesColor(s) };
      });

      tooltipData = { label, items };
      tooltipX = event.clientX - rect.left;
      tooltipY = event.clientY - rect.top - 50;
      tooltipVisible = true;
    } else {
      tooltipVisible = false;
    }
  }

  function handleMouseLeave() {
    tooltipVisible = false;
  }

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

  $: if (hasBeenVisible && canvasElement && series?.length > 0 && xList?.length > 0) {
    drawChart();
  }

  // Compute latest values for header display
  $: latestValues = series.map(s => {
    const lastVal = s.values[s.values.length - 1];
    return Number.isFinite(lastVal) ? lastVal : 0;
  });

  $: primaryLatest = latestValues.length > 0 ? latestValues[0] : 0;
  $: primaryPrev = series.length > 0 && series[0].values.length > 1
    ? series[0].values[series[0].values.length - 2]
    : null;
  $: primaryChange = primaryPrev !== null && primaryPrev !== 0 && Number.isFinite(primaryPrev)
    ? ((primaryLatest - primaryPrev) / Math.abs(primaryPrev)) * 100
    : null;
</script>

<div
  bind:this={cardElement}
  class="group relative bg-white dark:bg-zinc-950/60 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:border-gray-300 dark:hover:border-zinc-700 transition-all duration-200 hover:shadow-md cursor-pointer"
  role="button"
  tabindex="0"
  on:click={onExpand}
  on:keydown={(e) => e.key === 'Enter' && onExpand()}
>
  <!-- Header -->
  <div class="flex items-center justify-between px-3 pt-3 pb-1">
    <div class="flex items-center gap-2 min-w-0">
      <h3 class="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">
        {metricLabel}
      </h3>
      <span class="text-xs font-semibold text-gray-600 dark:text-zinc-400 shrink-0">
        {isMargin
          ? `${abbreviateNumber(primaryLatest)}%`
          : abbreviateNumber(primaryLatest)}
      </span>
      {#if primaryChange !== null}
        <span class="text-[10px] font-medium px-1.5 py-0.5 rounded-2xl shrink-0 {primaryChange >= 0
          ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30'
          : 'text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/30'}">
          {primaryChange >= 0 ? '+' : ''}{primaryChange.toFixed(1)}%
        </span>
      {/if}
    </div>
    <button
      type="button"
      class="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-2xl hover:bg-gray-100 dark:hover:bg-zinc-800 shrink-0"
      on:click|stopPropagation={onExpand}
      aria-label="Expand chart"
    >
      <Maximize class="w-4 h-4 text-gray-500 dark:text-zinc-400" />
    </button>
  </div>

  <!-- Legend (only show for multi-series) -->
  {#if series.length > 1}
    <div class="flex items-center gap-3 px-3 pb-1">
      {#each series as s}
        <div class="flex items-center gap-1">
          <span class="w-2 h-2 rounded-full" style="background-color: {getSeriesColor(s)}"></span>
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
          class="absolute pointer-events-none z-10 px-2 py-1.5 rounded-lg bg-black/90 text-white text-xs whitespace-nowrap"
          style="left: {tooltipX}px; top: {tooltipY}px; transform: translateX(-50%);"
        >
          <div class="font-medium mb-0.5">{tooltipData.label}</div>
          {#each tooltipData.items as item}
            <div class="flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full" style="background-color: {item.color}"></span>
              <span>{item.name}: {item.value}</span>
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>

<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import BarChartIcon from "lucide-svelte/icons/chart-column-increasing";
  import LineChartIcon from "lucide-svelte/icons/chart-spline";
  import ScatterChartIcon from "lucide-svelte/icons/circle-dot";

  export let data;
  export let rawData = [];
  export let metrics = {};

  let isPro = false;
  let showLocked = false;
  $: isPro = data?.user?.tier === "Pro";
  $: showLocked = !isPro;

  let currentPrice = Number(data?.getStockQuote?.price?.toFixed(2));
  let hottestTrades = data?.getPriceLevel?.hottestTrades || [];
  let srZones = data?.getPriceLevel?.srZones || {};
  let config;

  // Chart type state
  type ChartType = "column" | "spline" | "scatter";
  let chartType: ChartType = "column";

  const chartTypes: { type: ChartType; label: string; icon: any }[] = [
    { type: "column", label: "Column", icon: BarChartIcon },
    { type: "spline", label: "Line", icon: LineChartIcon },
    { type: "scatter", label: "Scatter", icon: ScatterChartIcon },
  ];

  function changeChartType(type: ChartType) {
    chartType = type;
    config = getVolumeChart() || null;
  }

  // Use backend-computed SR zones if available, otherwise compute locally
  let keySupport = srZones?.keySupport || null;
  let keyResistance = srZones?.keyResistance || null;
  let totalVolume = srZones?.totalVolume || 0;

  // Data freshness
  let dataDate = "";
  let isToday = false;

  function checkDataFreshness() {
    if (hottestTrades?.length > 0) {
      const latestDate = new Date(hottestTrades[0]?.date);
      const today = new Date();
      dataDate = latestDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "America/New_York",
      });
      isToday = latestDate.toDateString() === today.toDateString();
    }
  }

  // Fallback: compute SR locally if backend doesn't provide it
  function computeLocalSR() {
    if (keySupport || keyResistance) return; // Backend already provided
    if (!rawData || rawData.length === 0 || !currentPrice) return;

    totalVolume = rawData.reduce((sum, item) => sum + item.size, 0);

    const supportLevels = rawData.filter(
      (item) => item.price_level < currentPrice,
    );
    const resistanceLevels = rawData.filter(
      (item) => item.price_level > currentPrice,
    );

    if (supportLevels.length > 0) {
      const strongest = supportLevels.sort((a, b) => b.size - a.size)[0];
      keySupport = {
        price: strongest.price_level,
        size: strongest.size,
        distancePct: Math.abs(
          ((strongest.price_level - currentPrice) / currentPrice) * 100,
        ),
        volumePct: (strongest.size / totalVolume) * 100,
        strength: ((strongest.size / totalVolume) * 100).toFixed(1),
      };
    }

    if (resistanceLevels.length > 0) {
      const strongest = resistanceLevels.sort((a, b) => b.size - a.size)[0];
      keyResistance = {
        price: strongest.price_level,
        size: strongest.size,
        distancePct: Math.abs(
          ((strongest.price_level - currentPrice) / currentPrice) * 100,
        ),
        volumePct: (strongest.size / totalVolume) * 100,
        strength: ((strongest.size / totalVolume) * 100).toFixed(1),
      };
    }
  }

  function getVolumeChart() {
    const priceSizeMap = new Map();
    rawData?.forEach((item) => priceSizeMap.set(item?.price_level, item?.size));

    let priceLevel = rawData?.map((item) => item?.price_level || 0);
    priceLevel = Array.from(new Set([...priceLevel, currentPrice]))?.sort(
      (a, b) => a - b,
    );

    const sizes = priceLevel?.map((price) => {
      if (price === currentPrice && !priceSizeMap.has(currentPrice)) return 0;
      return priceSizeMap.get(price) || 0;
    });

    const maxSize = Math.max(...sizes);
    const localTotalVolume = totalVolume || sizes.reduce((a, b) => a + b, 0);

    const colors = priceLevel?.map((price, index) => {
      const size = sizes[index];
      if (size === 0) return "transparent";

      const isMax = size === maxSize;
      const isSupport = price < currentPrice;
      const isResistance = price > currentPrice;
      const intensity = Math.min(size / maxSize, 1);

      if (isMax)
        return isSupport ? "#22c55e" : isResistance ? "#ef4444" : "#71717a";
      if (isSupport)
        return intensity > 0.5
          ? "#4ade80"
          : $mode === "light"
            ? "#bbf7d0"
            : "#166534";
      if (isResistance)
        return intensity > 0.5
          ? "#f87171"
          : $mode === "light"
            ? "#fecaca"
            : "#991b1b";
      return $mode === "light" ? "#e5e7eb" : "#3f3f46";
    });

    const currentPriceIndex = priceLevel?.findIndex((s) => s === currentPrice);

    return {
      credits: { enabled: false },
      chart: {
        type: chartType,
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        animation: false,
        height: 300,
        zoomType: "x",
        style: { fontFamily: "inherit" },
        resetZoomButton: {
          theme: {
            fill: $mode === "light" ? "#f3f4f6" : "#27272a",
            stroke: $mode === "light" ? "#d1d5db" : "#3f3f46",
            style: { color: $mode === "light" ? "#111827" : "#f4f4f5" },
            r: 8,
            states: {
              hover: { fill: $mode === "light" ? "#e5e7eb" : "#3f3f46" },
            },
          },
          position: { align: "right", x: -10, y: 10 },
        },
      },
      title: {
        text: `<h3 class="mt-3 mb-1 text-sm font-semibold tracking-tight">Volume by Price Level</h3>`,
        useHTML: true,
        style: { color: $mode === "light" ? "black" : "white" },
      },
      legend: { enabled: false },
      xAxis: {
        categories: priceLevel,
        lineColor: $mode === "light" ? "#e5e7eb" : "#27272a",
        tickColor: "transparent",
        plotLines: [
          {
            value: currentPriceIndex,
            color: $mode === "light" ? "#000" : "#fff",
            dashStyle: "Dash",
            width: 1.5,
            label: {
              text: `Current $${currentPrice}`,
              style: {
                color: $mode === "light" ? "#000" : "#fff",
                fontSize: "10px",
              },
            },
            zIndex: 5,
          },
        ],
        crosshair: {
          color: $mode === "light" ? "black" : "white",
          width: 1,
          dashStyle: "Solid",
        },
        labels: {
          style: {
            color: $mode === "light" ? "#545454" : "white",
            fontSize: "9px",
          },
          formatter: function () {
            return "$" + this.value;
          },
        },
      },
      yAxis: {
        title: { text: null },
        opposite: true,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        gridLineWidth: 1,
        labels: {
          formatter: function () {
            return abbreviateNumber(this?.value);
          },
          style: {
            color: $mode === "light" ? "#545454" : "white",
            fontSize: "9px",
          },
        },
      },
      tooltip: {
        shared: true,
        useHTML: true,
        animation: false,
        backgroundColor: "rgba(0, 0, 0, 1)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        borderRadius: 4,
        style: { color: "#fff", fontSize: "14px", padding: "10px" },
        formatter: function () {
          // Use category value (actual price), not the index
          const price = this.points?.[0]?.key ?? priceLevel[this.x];
          const volume = this.points?.[0]?.y || 0;
          const pctOfTotalRaw =
            localTotalVolume > 0 ? (volume / localTotalVolume) * 100 : 0;
          const pctOfTotal =
            pctOfTotalRaw < 0.01 && pctOfTotalRaw > 0
              ? "< 0.01"
              : pctOfTotalRaw.toFixed(1);
          const isSupport = price < currentPrice;
          const isResistance = price > currentPrice;
          const zone = isSupport
            ? "Support Zone"
            : isResistance
              ? "Resistance Zone"
              : "Current Price";
          const zoneColor = isSupport
            ? "#22c55e"
            : isResistance
              ? "#ef4444"
              : "#71717a";

          return `
            <div style="padding: 2px 0; font-variant-numeric: tabular-nums;">
              <div style="font-weight: 600; font-size: 13px;">$${price}</div>
              <div style="font-size: 10px; color: ${zoneColor}; text-transform: uppercase; letter-spacing: 0.3px; margin-top: 2px;">${zone}</div>
              <div style="margin-top: 6px; font-size: 11px;">
                ${abbreviateNumber(volume)} shares<br/>
                ${pctOfTotal}% of total activity
              </div>
            </div>
          `;
        },
      },
      plotOptions: {
        column: {
          colorByPoint: true,
          colors,
          borderColor: "transparent",
          borderRadius: 2,
          pointPadding: 0.12,
          groupPadding: 0.08,
        },
        spline: {
          marker: { enabled: true, radius: 3 },
          color: $mode === "light" ? "#6366f1" : "#818cf8",
        },
        scatter: {
          marker: { radius: 5, symbol: "circle" },
          color: $mode === "light" ? "#6366f1" : "#818cf8",
        },
        series: {
          animation: false,
          states: { hover: { enabled: false } },
        },
      },
      series: [
        {
          name: "Volume",
          type: chartType,
          data: sizes,
          animation: false,
          ...(chartType !== "column" && {
            color: $mode === "light" ? "#6366f1" : "#818cf8",
          }),
        },
      ],
    };
  }

  $: {
    if (rawData?.length > 0 || $mode || chartType) {
      checkDataFreshness();
      computeLocalSR();
      config = getVolumeChart() || null;
    }
  }
</script>

<section class="py-4">
  {#if rawData?.length !== 0 && Object?.keys(metrics)?.length > 0}
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-1.5">
        <h3 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Key Price Levels
        </h3>
        <InfoModal
          title="Key Price Levels"
          content="Shows where large institutional orders (block trades & dark pool) concentrated over the last 30 days. Higher volume at a price suggests stronger interest. Note: Direction (buy/sell) is unknown."
          id="keyPriceLevelsInfo"
        />
      </div>
    </div>

    <!-- Key Levels - Market Cap Style Widgets -->
    {#if keySupport || keyResistance}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <!-- Support Widget -->
        <div
          class="bg-white/70 dark:bg-zinc-950/40 border border-gray-300 dark:border-zinc-700 rounded-2xl p-4"
        >
          <div class="text-sm mb-2 flex items-center">
            <span>Key Support</span>
            {#if keySupport?.strength && !showLocked}
              <span
                class="ml-auto text-xs tabular-nums text-gray-800 dark:text-zinc-300"
              >
                Strength: {typeof keySupport.strength === "number"
                  ? keySupport.strength.toFixed(1)
                  : keySupport.strength}%
              </span>
            {/if}
          </div>
          {#if showLocked}
            <a
              href="/pricing"
              class="inline-flex items-center text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
            >
              <svg
                class="size-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                style="max-width: 40px;"
              >
                <path
                  fill-rule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clip-rule="evenodd"
                >
                </path>
              </svg>
            </a>
          {:else if keySupport}
            <div class="flex items-baseline">
              <span
                class="text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400"
              >
                ${keySupport.price?.toFixed(2)}
              </span>
            </div>
          {:else}
            <div class="text-xl font-semibold text-gray-400 dark:text-zinc-600">
              —
            </div>
          {/if}
        </div>

        <!-- Resistance Widget -->
        <div
          class="bg-white/70 dark:bg-zinc-950/40 border border-gray-300 dark:border-zinc-700 rounded-2xl p-4"
        >
          <div class="text-sm mb-2 flex items-center">
            <span>Key Resistance</span>
            {#if keyResistance?.strength && !showLocked}
              <span
                class="ml-auto text-xs tabular-nums text-gray-800 dark:text-zinc-300"
              >
                Strength: {typeof keyResistance.strength === "number"
                  ? keyResistance.strength.toFixed(1)
                  : keyResistance.strength}%
              </span>
            {/if}
          </div>
          {#if showLocked}
            <a
              href="/pricing"
              class="inline-flex items-center text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
            >
              <svg
                class="size-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                style="max-width: 40px;"
              >
                <path
                  fill-rule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clip-rule="evenodd"
                >
                </path>
              </svg>
            </a>
          {:else if keyResistance}
            <div class="flex items-baseline">
              <span
                class="text-xl font-semibold tabular-nums text-red-500 dark:text-red-400"
              >
                ${keyResistance.price?.toFixed(2)}
              </span>
            </div>
          {:else}
            <div class="text-xl font-semibold text-gray-400 dark:text-zinc-600">
              —
            </div>
          {/if}
        </div>
      </div>
    {/if}

    {#if showLocked}
      <div
        class="rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 h-[300px] flex flex-col items-center justify-center"
      >
        <a
          href="/pricing"
          class="flex flex-col items-center gap-3 text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
        >
          <svg
            class="size-10"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
            />
          </svg>
          <span class="text-sm font-medium">Upgrade to Pro to unlock</span>
        </a>
      </div>
    {:else}
      <!-- Chart Controls -->
      <div class="flex items-center justify-between mb-3">
        <div
          class="flex items-center gap-3 text-xs text-gray-800 dark:text-zinc-300"
        >
          <span class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
            Support
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-sm bg-red-500"></span>
            Resistance
          </span>
        </div>

        <!-- Chart Type Switcher -->
        <div class="flex items-center">
          <div
            class="w-fit flex text-sm items-center gap-1 rounded-full border border-gray-300 dark:border-zinc-700 p-1"
          >
            {#each chartTypes as item}
              <button
                on:click={() => changeChartType(item.type)}
                class="cursor-pointer rounded-full p-1.5 focus:z-10 focus:outline-none transition-all
                  {chartType === item.type
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                  : 'text-gray-800 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white'}"
                title={item.label}
              >
                <svelte:component this={item.icon} class="w-4 h-4" />
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- Chart - MaxPain Style -->
      <div
        class="border border-gray-300 dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 overflow-hidden"
      >
        <div use:highcharts={config}></div>
      </div>

      <!-- Note -->
      <p class="text-xs text-gray-800 dark:text-zinc-300 text-center mt-3">
        Based on 30-day institutional order flow. Direction unknown — use with
        other analysis.
      </p>
    {/if}
  {/if}
</section>

<script lang="ts">
  import highcharts from "$lib/highcharts.ts";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import { mode } from "mode-watcher";
  import { displayCompanyName, screenWidth } from "$lib/store";
  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
  import BarChartIcon from "lucide-svelte/icons/chart-column-increasing";
  import LineChartIcon from "lucide-svelte/icons/chart-spline";
  import ScatterChartIcon from "lucide-svelte/icons/circle-dot";

  export let data;
  export let rawData: Array<Record<string, any>> = [];

  let isPro = false;
  let showLocked = false;
  $: isPro = data?.user?.tier === "Pro";
  $: showLocked = !isPro;

  // Exchange insights from backend (pre-computed)
  let exchangeInsights = data?.getPriceLevel?.exchangeInsights || {};

  const MAX_ON_EXCHANGES = 4;

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
    config = buildChart(rawData) || null;
  }

  function parsePct(value: any): number {
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function formatDateShort(dateStr: string): string {
    const d = new Date(`${dateStr}T00:00:00Z`);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      timeZone: "UTC",
    });
  }

  function formatDateLong(dateStr: string): string {
    const d = new Date(`${dateStr}T00:00:00Z`);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  }

  function pctText(value: number): string {
    return value === 0 ? "< 0.01%" : `${value.toFixed(1)}%`;
  }

  function buildChart(rows: Array<Record<string, any>>) {
    const sorted = [...(rows || [])]
      .filter((r) => typeof r?.date === "string" && r.date.length >= 10)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (sorted.length === 0) return null;

    const allKeys = new Set<string>();
    for (const row of sorted) {
      for (const key of Object.keys(row)) {
        if (key !== "date" && key !== "totalPremium") allKeys.add(key);
      }
    }

    const keys = [...allKeys];
    if (keys.length === 0) return null;

    const hasOffExchange = allKeys.has("Off-Exchange");

    const totalPremiumForRow = (row: Record<string, any>): number =>
      Number.isFinite(Number(row?.totalPremium)) ? Number(row.totalPremium) : 0;

    const daySumPctForRow = (row: Record<string, any>): number =>
      Object.keys(row)
        .filter((k) => k !== "date" && k !== "totalPremium")
        .reduce((acc, k) => acc + parsePct(row[k]), 0);

    const scores = keys
      .filter((k) => k !== "Off-Exchange")
      .map((k) => ({
        key: k,
        score: sorted.reduce((acc, row) => {
          const totalPrem = totalPremiumForRow(row);
          if (totalPrem <= 0) return acc;
          const daySumPct = daySumPctForRow(row);
          if (daySumPct <= 0) return acc;
          return acc + (totalPrem * parsePct(row[k])) / daySumPct;
        }, 0),
      }))
      .sort((a, b) => b.score - a.score);

    const selectedKeys: string[] = [];
    if (hasOffExchange) selectedKeys.push("Off-Exchange");
    for (const { key } of scores) {
      if (selectedKeys.length - (hasOffExchange ? 1 : 0) >= MAX_ON_EXCHANGES)
        break;
      selectedKeys.push(key);
    }

    const selectedKeySet = new Set(selectedKeys);
    const needsOther = keys.some((k) => !selectedKeySet.has(k));

    const fullDates = sorted.map((r) => r.date.slice(0, 10));
    const categories = fullDates.map(formatDateShort);
    const totalPremiums = sorted.map((r) =>
      Number.isFinite(Number(r?.totalPremium)) ? Number(r.totalPremium) : 0,
    );
    const maxTotalPremium = Math.max(0, ...totalPremiums);

    const isLightMode = $mode === "light";
    const isDarkMode = !isLightMode;

    function seriesColor(name: string, fallbackIndex: number): string {
      if (name === "Off-Exchange") return "#E15759";
      if (name.startsWith("Nasdaq")) return "#76B7B2";
      if (name.startsWith("NYSE")) return "#4E79A7";
      if (name === "Other") return isDarkMode ? "#94A3B8" : "#BAB0AC";

      const palette = ["#F28E2B", "#59A14F", "#B07AA1", "#9C755F", "#EDC948"];
      return palette[fallbackIndex % palette.length];
    }

    const seriesKeys = [...selectedKeys, ...(needsOther ? ["Other"] : [])];
    const series = seriesKeys.map((name, index) => {
      const seriesData = sorted.map((row) => {
        const totalPrem = totalPremiumForRow(row);
        if (totalPrem <= 0) return 0;

        const daySumPct = daySumPctForRow(row);
        if (daySumPct <= 0) return 0;

        if (name === "Other") {
          let other = 0;
          for (const k of keys) {
            if (!selectedKeySet.has(k)) other += parsePct(row[k]);
          }
          return (totalPrem * other) / daySumPct;
        }
        return (totalPrem * parsePct(row[name])) / daySumPct;
      });

      return {
        name,
        type: chartType,
        data: seriesData,
        color: seriesColor(name, index),
        animation: false,
        borderRadius: chartType === "column" ? 4 : 0,
        yAxis: 0,
        marker: {
          enabled: chartType !== "column",
          radius: chartType === "scatter" ? 4 : 3,
        },
      };
    });

    return {
      credits: { enabled: false },
      chart: {
        type: chartType,
        backgroundColor: isLightMode ? "#fff" : "#09090B",
        plotBackgroundColor: isLightMode ? "#fff" : "#09090B",
        animation: false,
        height: 340,
        zoomType: "x",
        resetZoomButton: {
          theme: {
            fill: isLightMode ? "#f3f4f6" : "#27272a",
            stroke: isLightMode ? "#d1d5db" : "#3f3f46",
            style: { color: isLightMode ? "#111827" : "#f4f4f5" },
            r: 8,
            states: { hover: { fill: isLightMode ? "#e5e7eb" : "#3f3f46" } },
          },
          position: { align: "right", x: -10, y: 10 },
        },
      },
      title: {
        text: `<h3 class="mt-3 mb-1 text-sm font-semibold tracking-tight">Exchange Distribution (30 Days)</h3>`,
        useHTML: true,
        zIndex: 0,
        style: { color: isLightMode ? "black" : "white" },
      },
      legend: {
        enabled: true,
        itemStyle: { color: isLightMode ? "black" : "white" },
      },
      xAxis: {
        categories,
        crosshair: {
          color: isLightMode ? "#000" : "#fff",
          width: 1,
          dashStyle: "Solid",
        },
        labels: { style: { color: isLightMode ? "#545454" : "#fff" } },
      },
      yAxis: {
        min: 0,
        max: maxTotalPremium,
        opposite: true,
        title: { text: null },
        gridLineColor: isLightMode ? "#e5e7eb" : "#111827",

        labels: {
          style: { color: isLightMode ? "#545454" : "#fff" },
          formatter: function () {
            return abbreviateNumber(this.value, true, true);
          },
        },
      },
      tooltip: {
        zIndex: 20,
        outside: false,
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        style: { color: "#fff", fontSize: "14px", padding: "10px", zIndex: 20 },
        borderRadius: 4,
        positioner: function (labelWidth, labelHeight, point) {
          const chart = this.chart;
          const plotLeft = chart.plotLeft;
          const plotWidth = chart.plotWidth;
          const titleHeight = 60;

          if (point.plotX > plotWidth / 2) {
            return { x: plotLeft + 10, y: titleHeight };
          } else {
            return {
              x: plotLeft + plotWidth - labelWidth - 10,
              y: titleHeight,
            };
          }
        },
        formatter: function () {
          const idx = this.points?.[0]?.point?.index ?? 0;
          const dateStr = fullDates[idx] || "";
          const formattedDate = dateStr ? formatDateLong(dateStr) : "";

          let total = 0;
          const points = (this.points || [])
            .filter(
              (p) => p?.y !== null && p?.y !== undefined && Number(p.y) > 0,
            )
            .sort((a, b) => (Number(b.y) || 0) - (Number(a.y) || 0));

          points.forEach((p) => {
            total += Number(p.y) || 0;
          });

          let content = `<div style="min-width: 240px; max-width: 380px;">`;
          content += `<div style="font-weight: 600; margin-bottom: 5px; font-size: 15px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 8px;">${formattedDate}</div>`;
          content += `<div style="display: grid; gap: 5px;">`;

          points.forEach((point) => {
            const y = Number(point.y) || 0;
            const pct = total > 0 ? (y / total) * 100 : 0;
            const pctStr = pct < 0.01 ? "&lt; 0.01%" : `${pct.toFixed(1)}%`;
            content += `
              <div style="display: grid; grid-template-columns: auto 1fr auto; gap: 5px; align-items: center;">
                <span style="color: ${point.color}; font-size: 13px;">●</span>
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 13px;">${point.series.name}</span>
                <span style="font-weight: 600; white-space: nowrap; font-size: 13px;">${abbreviateNumber(y, true, true)} (${pctStr})</span>
              </div>`;
          });

          content += `</div>`;
          content += `
            <div style="margin-top: 10px; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.3); display: flex; justify-content: space-between; font-size: 13px;">
              <span style="font-weight: 600;">Total:</span>
              <span style="font-weight: 700;">${abbreviateNumber(total, true, true)}</span>
            </div>`;
          content += `</div>`;

          return content;
        },
      },
      plotOptions: {
        column: {
          stacking: "normal",
          groupPadding: 0.15,
          pointPadding: 0.05,
          borderWidth: 0,
        },
        spline: {
          marker: { enabled: true, radius: 3 },
        },
        scatter: {
          marker: { radius: 4, symbol: "circle" },
        },
        series: {
          animation: false,
          states: { hover: { enabled: true } },
        },
      },
      series,
    };
  }

  $: config = buildChart(rawData) || null;

  // Reactive computed values (fallback if backend insights not available)
  $: sortedRows =
    rawData
      ?.filter((r) => typeof r?.date === "string" && r.date.length >= 10)
      ?.sort((a, b) => a.date.localeCompare(b.date)) ?? [];

  $: latestRow =
    sortedRows.length > 0 ? sortedRows[sortedRows.length - 1] : null;
  $: latestDateStr =
    exchangeInsights?.latestDate || latestRow?.date?.slice(0, 10) || "";

  // Use backend insights if available, otherwise compute locally
  $: latestDarkPoolPct =
    exchangeInsights?.latestDarkPoolPct ??
    (latestRow ? parsePct(latestRow["Off-Exchange"]) : 0);
  $: avgDarkPoolPct =
    exchangeInsights?.avgDarkPoolPct ??
    (() => {
      if (!sortedRows?.length) return 0;
      let sum = 0;
      for (const row of sortedRows) {
        sum += parsePct(row["Off-Exchange"]);
      }
      return sortedRows.length > 0 ? sum / sortedRows.length : 0;
    })();
  $: darkPoolTrend = exchangeInsights?.darkPoolTrend || "stable";
  $: deviationFromAvg =
    exchangeInsights?.deviationFromAvg ?? latestDarkPoolPct - avgDarkPoolPct;
  $: topOnExchangeVenue = exchangeInsights?.topOnExchangeVenue || {
    name: "",
    pct: 0,
  };
  $: latestTotalPremium =
    exchangeInsights?.latestTotalPremium ??
    (latestRow ? Number(latestRow?.totalPremium || 0) : 0);
  $: activityLevel = exchangeInsights?.activityLevel || "moderate";

  // Data freshness check
  $: isToday = (() => {
    if (!latestDateStr) return false;
    const latestDate = new Date(latestDateStr);
    const today = new Date();
    return latestDate.toDateString() === today.toDateString();
  })();

  // Trend icon and color
</script>

{#if rawData?.length > 0 && config}
  <section class="overflow-hidden h-full pb-8 pt-3">
    <main class="overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-1.5">
          <h3
            class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white"
          >
            Exchange Breakdown
          </h3>
          <InfoModal
            title="Exchange Breakdown"
            content="Shows how unusual order volume is distributed across exchanges over the last 30 days. Off-Exchange (Dark Pool) trades are private institutional transactions hidden from public view until reporting. High dark pool activity may indicate institutional accumulation or distribution, but direction (buy/sell) is unknown."
            id="unusualOrdersExchangeInfo"
          />
        </div>
      </div>

      <!-- Key Metrics - Market Cap Style Widgets -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <!-- Dark Pool % Widget -->
        <div
          class="bg-white/70 dark:bg-zinc-950/40 border border-gray-300 dark:border-zinc-700 rounded-2xl p-4"
        >
          <div class="text-sm mb-2 flex items-center">
            <span>Dark Pool Activity</span>
            {#if !showLocked}
              <span class="ml-auto text-xs tabular-nums">
                {darkPoolTrend}
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
          {:else}
            <div class="flex items-baseline">
              <span class="text-xl font-semibold tabular-nums">
                {pctText(latestDarkPoolPct)}
              </span>
            </div>
            <div
              class="text-sm text-gray-800 dark:text-zinc-300 mt-1 tabular-nums"
            >
              30-day avg: {pctText(avgDarkPoolPct)}
            </div>
          {/if}
        </div>

        <!-- Top Exchange Widget -->
        <div
          class="bg-white/70 dark:bg-zinc-950/40 border border-gray-300 dark:border-zinc-700 rounded-2xl p-4"
        >
          <div class="text-sm mb-2 flex items-center">
            <span>Top On-Exchange Venue</span>
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
          {:else if topOnExchangeVenue?.name}
            <div class="flex items-baseline">
              <span
                class="text-xl font-semibold truncate"
                title={topOnExchangeVenue.name}
              >
                {topOnExchangeVenue.name.length > 15
                  ? topOnExchangeVenue.name.slice(0, 15) + "..."
                  : topOnExchangeVenue.name}
              </span>
            </div>
            <div
              class="text-sm text-gray-800 dark:text-zinc-300 mt-1 tabular-nums"
            >
              {pctText(topOnExchangeVenue.pct)} of on-exchange volume
            </div>
          {:else}
            <div class="text-xl font-semibold text-gray-400 dark:text-zinc-600">
              —
            </div>
          {/if}
        </div>

        <!-- Volume Widget -->
        <div
          class="bg-white/70 dark:bg-zinc-950/40 border border-gray-300 dark:border-zinc-700 rounded-2xl p-4"
        >
          <div class="text-sm mb-2 flex items-center">
            <span>Latest Transaction Value</span>
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
          {:else}
            <div class="flex items-baseline">
              <span class="text-xl font-semibold tabular-nums">
                {abbreviateNumber(latestTotalPremium, true, true)}
              </span>
            </div>
            <div
              class="text-sm text-gray-800 dark:text-zinc-300 mt-1 capitalize"
            >
              {activityLevel} institutional activity
            </div>
          {/if}
        </div>
      </div>

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
              <span
                class="w-2.5 h-2.5 rounded-sm"
                style="background-color: #E15759;"
              ></span>
              Off-Exchange
            </span>
            <span class="flex items-center gap-1.5">
              <span
                class="w-2.5 h-2.5 rounded-sm"
                style="background-color: #4E79A7;"
              ></span>
              On-Exchange
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

        <style>
          :global(.highcharts-tooltip-container) {
            z-index: 9999 !important;
          }
        </style>

        <!-- Chart - MaxPain Style -->
        <div
          class="border border-gray-300 dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 overflow-hidden"
        >
          <div use:highcharts={config}></div>
        </div>

        <!-- Interpretation Note -->
        <p class="text-xs text-gray-800 dark:text-zinc-300 text-center mt-3">
          Dark pool trades hide large orders from public view. High % may
          indicate institutional positioning but direction is unknown.
        </p>
      {/if}
    </main>
  </section>
{/if}

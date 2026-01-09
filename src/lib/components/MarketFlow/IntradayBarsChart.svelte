<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";
  import { goto } from "$app/navigation";

  export let intradayBars: Record<string, any[]> = {};
  export let defaultInterval = 15;
  export let isPro = false;

  const intervalOptions = [5, 15, 30];
  let selectedInterval = intervalOptions.includes(defaultInterval)
    ? defaultInterval
    : 15;

  const formatTime = (time: string) => {
    const parsed = new Date(time);
    if (Number.isNaN(parsed.getTime())) {
      return time;
    }
    return parsed.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSeriesData = () => {
    const bars = intradayBars?.[String(selectedInterval)] ?? [];
    const categories = bars.map((item) => formatTime(item?.time ?? ""));
    const volumeSeries = bars.map((item) => Number(item?.volume ?? 0));
    const oiSeries = bars.map((item) => Number(item?.openInterest ?? 0));
    const volumeSinceOpen = bars.map((item) =>
      Number(item?.volumeSinceOpen ?? 0),
    );
    const oiSinceOpen = bars.map((item) =>
      Number(item?.openInterestSinceOpen ?? 0),
    );

    return {
      bars,
      categories,
      volumeSeries,
      oiSeries,
      volumeSinceOpen,
      oiSinceOpen,
    };
  };

  const buildConfig = () => {
    const {
      bars,
      categories,
      volumeSeries,
      oiSeries,
      volumeSinceOpen,
      oiSinceOpen,
    } = getSeriesData();

    return {
      credits: { enabled: false },
      chart: {
        type: "column",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 360,
        animation: false,
      },
      title: { text: null },
      xAxis: {
        categories,
        crosshair: {
          color: $mode === "light" ? "black" : "white",
          width: 1,
          dashStyle: "Solid",
        },
        labels: {
          style: {
            color: $mode === "light" ? "#09090B" : "white",
            fontSize: "12px",
          },
        },
        tickLength: 0,
      },
      yAxis: [
        {
          visible: false,
          title: { text: "Interval" },
          gridLineWidth: 0,
          labels: {
            style: {
              color: $mode === "light" ? "#545454" : "white",
            },
            formatter: function () {
              return abbreviateNumber(this.value);
            },
          },
        },
        {
          visible: false,
          title: { text: "Since Open" },
          opposite: true,
          gridLineWidth: 0,
          labels: {
            style: {
              color: $mode === "light" ? "#545454" : "white",
            },
            formatter: function () {
              return abbreviateNumber(this.value);
            },
          },
        },
      ],
      plotOptions: {
        series: {
          animation: false,
          states: { hover: { enabled: false }, inactive: { enabled: false } },
        },
        column: {
          borderWidth: 0,
          pointPadding: 0.1,
          groupPadding: 0.2,
        },
        spline: {
          marker: { enabled: false },
        },
      },
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 1)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        style: { color: "#fff", fontSize: "13px", padding: "10px" },
        formatter: function () {
          const index = this?.points?.[0]?.point?.index ?? 0;
          const bar = bars?.[index];
          const timeLabel = bar?.time
            ? new Date(bar.time).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : this.x;

          let html = `<div style="min-width:190px;">
            <div style="font-weight:600; margin-bottom:6px;">${timeLabel}</div>`;

          (this.points || []).forEach((point) => {
            html += `
              <div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
                <span style="display:inline-block; width:10px; height:10px; background-color:${point.color}; border-radius:50%;"></span>
                <div style="font-weight:600; width:120px;">${point.series.name}:</div>
                <div style="font-weight:400;">${abbreviateNumber(point.y)}</div>
              </div>`;
          });

          html += "</div>";
          return html;
        },
      },
      legend: {
        enabled: true,
        align: "center",
        verticalAlign: "top",
        layout: "horizontal",
        squareSymbol: false,
        symbolWidth: 18,
        symbolHeight: 10,
        symbolRadius: 0,
        itemStyle: {
          color: $mode === "light" ? "black" : "white",
        },
      },
      series: [
        {
          name: "Volume",
          type: "column",
          data: volumeSeries,
          color: $mode === "light" ? "#6366f1" : "#818cf8",
        },
        {
          name: "Open Interest",
          type: "column",
          data: oiSeries,
          color: $mode === "light" ? "#22c55e" : "#4ade80",
        },
        {
          name: "Volume Since Open",
          type: "spline",
          data: volumeSinceOpen,
          yAxis: 1,
          dashStyle: "ShortDot",
          color: $mode === "light" ? "#1f2937" : "#e5e7eb",
        },
        {
          name: "OI Since Open",
          type: "spline",
          data: oiSinceOpen,
          yAxis: 1,
          dashStyle: "ShortDot",
          color: $mode === "light" ? "#0f766e" : "#14b8a6",
        },
      ],
    };
  };

  let config: any = null;

  $: if (!isPro && selectedInterval !== 30) {
    selectedInterval = 30;
  }

  $: if ($mode && intradayBars && selectedInterval) {
    config = buildConfig();
  }
</script>

<div class="flex flex-wrap items-center justify-between gap-3 mb-4">
  <div class="text-sm font-semibold text-gray-800 dark:text-zinc-200">
    Interval Bars
  </div>
  <div
    class="w-fit text-sm flex items-center gap-1 rounded-full border border-gray-300 dark:border-zinc-700"
  >
    {#each intervalOptions as item, i}
      {#if !isPro && item !== 30}
        <button
          on:click={() => goto("/pricing")}
          class="cursor-pointer font-medium rounded-full px-3 py-1.5 focus:z-10 focus:outline-none transition-all bg-white/80 text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50 dark:bg-zinc-950/60"
        >
          <span class="relative text-sm block font-semibold">
            {item}m
            <svg
              class="inline-block ml-0.5 -mt-1 w-3.5 h-3.5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              ><path
                fill="currentColor"
                d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
              /></svg
            >
          </span>
        </button>
      {:else}
        <button
          on:click={() => (selectedInterval = item)}
          class="cursor-pointer font-medium rounded-full px-3 py-1.5 focus:z-10 focus:outline-none transition-all
                            {selectedInterval === item
            ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-white'
            : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'}"
        >
          {item}m
        </button>
      {/if}
    {/each}
  </div>
</div>

{#if intradayBars?.[String(selectedInterval)]?.length}
  <div class="" use:highcharts={config}></div>
{:else}
  <div
    class="border border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl py-10 text-center text-sm text-gray-600 dark:text-zinc-300"
  >
    No intraday bar data available yet.
  </div>
{/if}

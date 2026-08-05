<script lang="ts">
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";
  import { deferFunction } from "$lib/utils";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import { getLocale } from "$lib/paraglide/runtime.js";
  import {
    ipos_chart_series,
    ipos_year_extremes,
    ipos_year_heading,
    ipos_year_none,
    ipos_year_summary,
  } from "$lib/paraglide/messages";

  export let data;
  export let year;

  // ipoDate is a plain YYYY-MM-DD string. new Date("2024-03-01") is parsed as
  // UTC midnight but read back in local time, so getMonth()/getFullYear() land
  // one month — or one year — early for anyone west of Greenwich. Slice the
  // string instead of round-tripping through a Date.
  const yearOf = (ipoDate) => Number(ipoDate?.slice(0, 4));
  const monthIndexOf = (ipoDate) => Number(ipoDate?.slice(5, 7)) - 1;

  const filteredData =
    data?.getIPOCalendar?.filter((item) => yearOf(item?.ipoDate) === year) ?? [];

  let config = null;
  let isLoaded = false;

  const monthFormatter = new Intl.DateTimeFormat(getLocale(), {
    month: "long",
    timeZone: "UTC",
  });
  const shortMonthFormatter = new Intl.DateTimeFormat(getLocale(), {
    month: "short",
    timeZone: "UTC",
  });
  const monthLabels = Array.from({ length: 12 }, (_, index) =>
    shortMonthFormatter.format(Date.UTC(2000, index, 1)),
  );

  // One source of truth for the chart and the sentence above it. Counting only
  // the months that appear in the data meant the prose named the smallest
  // non-empty month and could never report a month with zero IPOs, while the
  // chart plotted all twelve.
  const monthlyCounts = Array(12).fill(0);
  for (const item of filteredData) {
    const monthIndex = monthIndexOf(item?.ipoDate);
    if (monthIndex >= 0 && monthIndex < 12) monthlyCounts[monthIndex] += 1;
  }

  const total = filteredData?.length ?? 0;
  const maxCount = total ? Math.max(...monthlyCounts) : 0;
  const minCount = total ? Math.min(...monthlyCounts) : 0;
  const maxMonth = total ? monthlyCounts.indexOf(maxCount) : -1;
  const minMonth = total ? monthlyCounts.indexOf(minCount) : -1;

  function plotData(year) {
    const ipoCounts = monthlyCounts;
    const months = monthLabels;

    // Build Highcharts options
    const options = {
      credits: {
        enabled: false,
      },
      chart: {
        type: "column",
        backgroundColor: "transparent",
        plotBackgroundColor: "transparent",
        height: 360,
        animation: false,
      },
      title: {
        text: `<h3 class="mt-3 mb-1">${ipos_year_heading({ year })}</h3>`,
        style: {
          color: $mode === "light" ? "black" : "white",
        },
        useHTML: true,
      },
      xAxis: {
        categories: months,
        gridLineWidth: 0,
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
        },
      },
      yAxis: {
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
        },
        title: { text: null },
        opposite: true,
      },
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 1)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        style: {
          color: "#fff",
          fontSize: "16px",
          padding: "10px",
        },
        borderRadius: 4,
        formatter: function () {
          return `<span class="m-auto text-[1rem] font-[501]">${this.x}</span><br>
                        <span class="font-semibold text-sm text-fg">${ipos_chart_series()}:</span>
                        <span class="font-normal text-sm text-fg">${this.y?.toLocaleString(getLocale())}</span>`;
        },
      },
      plotOptions: {
        series: {
          color: $mode === "light" ? "black" : "white",
          animation: false,
          dataLabels: {
            enabled: true,
            color: $mode === "light" ? "black" : "white",
            style: {
              fontSize: "13px",
              fontWeight: "",
            },
            formatter: function () {
              return this.y;
            },
          },
        },
      },
      legend: {
        enabled: false,
      },
      series: [
        {
          name: ipos_chart_series(),
          data: ipoCounts,
          color: $mode === "light" ? "#2C6288" : "white",
        },
      ],
    };

    return options;
  }

  onMount(async () => {
    if (!browser) return;
    deferFunction(() => {
      config = plotData(year) || null;
    }, 600);

    isLoaded = true;
  });
</script>

<h2 class="type-h2 text-fg mt-2">
  {ipos_year_heading({ year })}
</h2>

<div class="mb-2">
  {#if total === 0}
    {ipos_year_none({ year })}
  {:else}
    {ipos_year_summary({ count: total?.toLocaleString(getLocale()), year })}
    {ipos_year_extremes({
      maxMonth: monthFormatter.format(Date.UTC(2000, maxMonth, 1)),
      maxCount: maxCount?.toLocaleString(getLocale()),
      minMonth: monthFormatter.format(Date.UTC(2000, minMonth, 1)),
      minCount: minCount?.toLocaleString(getLocale()),
    })}
  {/if}
</div>

{#if isLoaded && config}
  <div
    class="border border-line rounded-control"
    use:highcharts={config}
  ></div>
{:else}
  <div class="flex justify-center items-center h-80">
    <div class="relative">
      <label
        class="shadow bg-default dark:bg-secondary rounded-control h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      >
        <span
          class="loading loading-spinner loading-md text-white dark:text-white"
        ></span>
      </label>
    </div>
  </div>
{/if}

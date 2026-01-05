<script lang="ts">
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";
  import { deferFunction } from "$lib/utils";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";

  export let data;
  export let year;

  const currentYear = new Date()?.getFullYear();
  const filteredData = data?.getIPOCalendar?.filter((item) => {
    const ipoYear = new Date(item?.ipoDate)?.getFullYear();
    return ipoYear === year;
  });

  let config = null;
  let isLoaded = false;

  const monthDict = {
    1: "January",
    2: "February",
    3: "March",
    4: "April",
    5: "May",
    6: "June",
    7: "July",
    8: "August",
    9: "September",
    10: "October",
    11: "November",
    12: "December",
  };

  function findMinMaxMonths(year) {
    const rawData = data?.getIPOCalendar || [];

    // Count IPOs per month for the given year
    const ipoCounts = rawData.reduce((acc, { ipoDate }) => {
      const date = new Date(ipoDate);
      const ipoYear = date.getFullYear();
      const month = date.getMonth() + 1; // Get month (1-12)

      if (ipoYear === year) {
        acc[month] = (acc[month] || 0) + 1;
      }
      return acc;
    }, {});

    const months = Object.keys(ipoCounts);
    if (months.length === 0) {
      console.log(`No valid IPOs found for ${year}.`);
      return { maxMonth: null, minMonth: null, maxCount: 0, minCount: 0 };
    }

    // Find the month with the most and least IPOs
    const maxMonth = months.reduce((a, b) =>
      ipoCounts[a] > ipoCounts[b] ? a : b,
    );
    const minMonth = months.reduce((a, b) =>
      ipoCounts[a] < ipoCounts[b] ? a : b,
    );

    return {
      maxMonth: Number(maxMonth), // Convert string to number
      minMonth: Number(minMonth),
      maxCount: ipoCounts[maxMonth],
      minCount: ipoCounts[minMonth],
    };
  }

  // Example Usage
  const { maxMonth, minMonth, maxCount, minCount } = findMinMaxMonths(year);

  function plotData(year) {
    const rawData = filteredData || [];

    // Initialize an array with 12 months, all set to 0
    const ipoCounts = Array(12).fill(0);

    // Count IPOs per month for the given year
    rawData.forEach(({ ipoDate }) => {
      const date = new Date(ipoDate);
      const month = date.getMonth(); // Month index (0-11)
      ipoCounts[month]++;
    });

    // Define month names for the x-axis
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Build Highcharts options
    const options = {
      credits: {
        enabled: false,
      },
      chart: {
        type: "column",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 360,
        animation: false,
      },
      title: {
        text: `<h3 class="mt-3 mb-1">${year} IPOs</h3>`,
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
                        <span class="font-semibold text-sm">IPOs:</span> 
                        <span class="font-normal text-sm">${this.y?.toLocaleString("en-US")}</span>`;
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
          name: "IPOs",
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

<h2 class="text-xl sm:text-2xl font-bold mt-2">
  {year} Initial Public Offerings
</h2>

<div class="mb-2">
  {#if year === currentYear}
    There have been 64 IPOs so far in {year}.
  {:else}
    There have been {filteredData?.length?.toLocaleString("en-US")} IPOs in {year}.
    The most was in {monthDict[maxMonth]} with {maxCount?.toLocaleString(
      "en-US",
    )}, the least was in {monthDict[minMonth]} with
    {minCount}.
  {/if}
</div>

{#if isLoaded && config}
  <div
    class="shadow border border-gray-300 dark:border-zinc-700 rounded"
    use:highcharts={config}
  ></div>
{:else}
  <div class="flex justify-center items-center h-80">
    <div class="relative">
      <label
        class="shadow bg-default dark:bg-secondary rounded h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      >
        <span
          class="loading loading-spinner loading-md text-white dark:text-white"
        ></span>
      </label>
    </div>
  </div>
{/if}

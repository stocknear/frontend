<script>
  import { onMount } from "svelte";
  import highcharts from "$lib/highcharts.ts";

  let chart;
  let container;
  const chartOptions = {
    chart: {
      type: "line",
    },

    title: {
      text: "Random Line Chart (1 000 points)",
      align: "center",
    },

    xAxis: {
      title: {
        text: "Index",
      },
    },

    yAxis: {
      title: {
        text: "Value",
      },
    },

    series: [
      {
        name: "Random data",
        // generate 1 000 random y-values (x will be auto-indexed 0…999)
        data: Array.from({ length: 1000 }, () => Math.random()),
        // turboThreshold set to series length for best perf
      },
    ],
  };
</script>

<!-- Container for Highcharts -->
{#if chartOptions}
  <div
    class="shadow border border-gray-300 dark:border-gray-800 rounded w-full h-[400px]"
    use:highcharts={chartOptions}
  ></div>
{/if}

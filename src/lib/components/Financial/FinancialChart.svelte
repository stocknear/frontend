<script lang="ts">
  import highcharts from "$lib/highcharts.ts";
  import { abbreviateNumber } from "$lib/utils";
  import { mode } from "mode-watcher";

  export let data;
  export let displayStatement;
  export let filterRule = "annual";
  export let statementConfig;
  export let processedData = null; // Accept pre-processed data
  export let color = "#fff";

  let config = null;
  let isLoaded = false;
  let chartElement;

  // Memoize chart options to prevent unnecessary recalculations
  function getChartOptions(xList, valueList, labelName) {
    return {
      chart: {
        type: "column",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 360,
        animation: false,
      },
      credits: { enabled: false },
      legend: { enabled: false },

      plotOptions: {
        series: {
          marker: {
            enabled: false,
            radius: 0,
          },
          color: "white",
          animation: false,
          dataLabels: {
            enabled: false,
            color: "white",
            style: {
              fontSize: "13px",
              fontWeight: "bold",
            },
            formatter: function () {
              return abbreviateNumber(this?.y);
            },
          },
        },
      },
      title: {
        text: `<h3 class="mt-3 mb-1 sm:text-lg">${labelName}</h3>`,
        useHTML: true,
        style: { color: $mode === "light" ? "black" : "white" },
      },
      xAxis: {
        endOnTick: false,
        categories: xList,
        crosshair: {
          color: $mode === "light" ? "black" : "white", // Set the color of the crosshair line
          width: 1, // Adjust the line width as needed
          dashStyle: "Solid",
        },
        labels: {
          style: {
            color: $mode === "light" ? "#545454" : "white",
          },
          rotation: -45,
          distance: 10, // Increases space between label and axis
        },
      },
      yAxis: {
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        labels: {
          style: { color: $mode === "light" ? "black" : "white" },
          formatter: function () {
            return abbreviateNumber(this.value);
          },
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
          let tooltipContent = `<span class="text-white m-auto text-black text-[1rem] font-[501]">${this?.x}</span><br>`;
          this.points.forEach((point) => {
            tooltipContent += `<span class="text-white font-semibold text-sm">${point.series.name}:</span>
          <span class="text-white font-normal text-sm">${abbreviateNumber(
            point.y,
          )}</span><br>`;
          });
          return tooltipContent;
        },
      },
      series: [
        {
          name: labelName,
          data: valueList,
          color: color,
          borderColor: color,
          borderRadius: "1px",
          animation: false,
        },
      ],
    };
  }

  async function plotData() {
    isLoaded = false;

    // Simulate some processing time to ensure loading state is visible
    // This can be removed in production if the actual data processing takes enough time
    if (!processedData) {
      // If no processed data, just show loading
      return null;
    }

    try {
      // Add a small delay to ensure the loading state is visible
      await new Promise((resolve) => setTimeout(resolve, 100));

      const { xList, valueList, labelName } = processedData[displayStatement];
      return getChartOptions(xList, valueList, labelName);
    } catch (error) {
      console.error("Error processing chart data:", error);
      return null;
    } finally {
      // Don't set isLoaded here - we'll set it after the chart is rendered
    }
  }

  // This function will be called whenever the relevant props change
  async function updateChart() {
    config = await plotData();
    // Only set isLoaded to true after a small delay to ensure the chart is fully rendered
    setTimeout(() => {
      isLoaded = true;
    }, 100);
  }

  // Watch for changes in props and update chart accordingly
  $: if (
    filterRule ||
    displayStatement ||
    data ||
    processedData ||
    ($mode && typeof window !== "undefined")
  ) {
    updateChart();
    console.log("afds");
  }
</script>

{#if !isLoaded}
  <div
    class="w-full h-[360px] flex justify-center items-center m-auto shadow border border-gray-300 dark:border-zinc-700 rounded"
  >
    <span class="loading loading-bars loading-sm"></span>
  </div>
{:else}
  <div
    class="shadow border border-gray-300 dark:border-zinc-700 rounded w-full"
    use:highcharts={config}
    bind:this={chartElement}
  ></div>
{/if}

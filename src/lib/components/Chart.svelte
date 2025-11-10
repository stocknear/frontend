<script lang="ts">
  import highcharts from "$lib/highcharts.ts";

  export let ticker: string;
  export let initialData: any[];

  let chart: any = null;
  let selectedInterval = "1D";
  const intervals = ["1D", "1W", "1M", "6M", "1Y", "MAX"];
  let historicalData: { [key: string]: any[] } = {};
  let loading = false;

  const chartConfig = {
    chart: {
      type: "area",
      backgroundColor: "#09090B",
      height: "400px",
    },
    title: { text: null },
    xAxis: {
      type: "datetime",
      labels: {
        format: "{value:%b %Y}",
        style: { color: "#FFF" },
      },
    },
    yAxis: {
      title: { text: null },
      opposite: true,
      labels: { style: { color: "#FFF" } },
    },
    tooltip: {
      shared: true,
      formatter: function () {
        return `<b>${Highcharts.dateFormat("%b %e, %Y", this.x)}</b><br>
          Price: $${Highcharts.numberFormat(this.points[0].y, 2)}`;
      },
    },
    series: [
      {
        name: "Price",
        data: [],
        color: "#00FC50",
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, "rgba(0, 252, 80, 0.2)"],
            [1, "rgba(0, 252, 80, 0.01)"],
          ],
        },
      },
    ],
  };

  async function fetchHistoricalData(timePeriod: string) {
    if (historicalData[timePeriod]) return;

    loading = true;
    try {
      const response = await fetch(`/api/historical-price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, timePeriod }),
      });

      const data = await response.json();
      historicalData[timePeriod] = data.map((point: any) => ({
        x: new Date(point.date).getTime(),
        y: point.close,
      }));
    } catch (error) {
      console.error("Failed to fetch historical data:", error);
    }
    loading = false;
  }

  function updateChart(timePeriod: string) {
    if (!chart || !historicalData[timePeriod]) return;

    chart.update(
      {
        series: [
          {
            data: historicalData[timePeriod],
            type: timePeriod === "1D" ? "line" : "area",
          },
        ],
      },
      true,
    );
  }

  async function handleIntervalChange(timePeriod: string) {
    selectedInterval = timePeriod;
    await fetchHistoricalData(timePeriod);
    updateChart(timePeriod);
  }
</script>

<div class="chart-container">
  <div
    class="chart border border-gray-800 rounded"
    use:highcharts={chartConfig}
  ></div>

  <div class="interval-selector">
    {#each intervals as interval}
      <button
        class:active={selectedInterval === interval}
        on:click={() => handleIntervalChange(interval)}
      >
        {interval}
      </button>
    {/each}
  </div>

  {#if loading}
    <div class="loading-indicator">
      <span class="spinner" /> Loading...
    </div>
  {/if}
</div>

<style>
  .chart-container {
    position: relative;
    background: #09090b;
    padding: 1rem;
    border-radius: 8px;
  }

  .interval-selector {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  button {
    padding: 0.5rem 1rem;
    border: 1px solid #333;
    border-radius: 4px;
    color: #fff;
    background: #222;
    cursor: pointer;
    transition: all 0.2s;
  }

  button.active {
    background: #00fc50;
    color: #000;
    border-color: #00fc50;
  }

  .loading-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #fff;
  }

  .spinner {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 2px solid #fff;
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin 1s linear infinite;
    margin-right: 0.5rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>

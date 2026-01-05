<script lang="ts">
  import { screenWidth } from "$lib/store";
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";

  export let data;

  let config;

  function getPlotChart() {
    const rawData = data?.getOneDayPrice || [];
    const darkPoolVolume = data?.getPriceLevel?.trend || [];

    const baseDate =
      rawData && rawData?.length ? new Date(rawData?.at(0)?.time) : new Date();

    // Set the fixed start and end times (9:30 and 16:00)
    const startTime = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      9,
      30,
    ).getTime();
    const endTime = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      16,
      0,
    ).getTime();

    // Convert rawData into series data for the line chart
    const seriesData = rawData?.map((item) => [
      Date.UTC(
        new Date(item?.time).getUTCFullYear(),
        new Date(item?.time).getUTCMonth(),
        new Date(item?.time).getUTCDate(),
        new Date(item?.time).getUTCHours(),
        new Date(item?.time).getUTCMinutes(),
        new Date(item?.time).getUTCSeconds(),
      ),
      item?.close,
    ]);

    // Convert darkPoolVolume into series data for the bar chart
    const darkPoolSeries = darkPoolVolume?.map((item) => [
      Date.UTC(
        new Date(item?.date).getUTCFullYear(),
        new Date(item?.date).getUTCMonth(),
        new Date(item?.date).getUTCDate(),
        new Date(item?.date).getUTCHours(),
        new Date(item?.date).getUTCMinutes(),
      ),
      item?.totalSize,
    ]);

    // Find the lowest & highest close values
    let minValue = Math?.min(...rawData?.map((item) => item?.close));
    let maxValue = Math?.max(...rawData?.map((item) => item?.close));

    if (minValue - 0 < 1) {
      minValue = data?.getStockQuote?.dayLow;
    }

    let padding = 0.015;
    let yMin = minValue * (1 - padding) === 0 ? null : minValue * (1 - padding);
    let yMax = maxValue * (1 + padding) === 0 ? null : maxValue * (1 + padding);

    // Create volume impact indicators (bubbles for ALL dark pool activity)
    const maxVolume = Math.max(
      ...(darkPoolVolume?.map((v) => v.totalSize) || [0]),
    );
    const minVolume = Math.min(
      ...(darkPoolVolume?.map((v) => v.totalSize) || [0]),
    );

    // Calculate a dynamic threshold to show meaningful spikes (top 80% or above average)
    const avgVolume =
      darkPoolVolume?.reduce((sum, item) => sum + item.totalSize, 0) /
      (darkPoolVolume?.length || 1);
    const volumeThreshold = Math.min(avgVolume * 1.2, maxVolume * 0.3); // Show more bubbles

    const volumeImpactPoints =
      darkPoolVolume
        ?.filter((item) => item?.totalSize > volumeThreshold) // Lower threshold to catch more spikes
        ?.map((item) => {
          // Find corresponding price point
          const timeStamp = new Date(item?.date).getTime();
          const pricePoint = rawData?.find(
            (p) => Math.abs(new Date(p.time).getTime() - timeStamp) < 300000,
          ); // 5min tolerance

          const x = Date.UTC(
            new Date(item?.date).getUTCFullYear(),
            new Date(item?.date).getUTCMonth(),
            new Date(item?.date).getUTCDate(),
            new Date(item?.date).getUTCHours(),
            new Date(item?.date).getUTCMinutes(),
          );

          const y = pricePoint?.close || minValue || 0;
          const z = item?.totalSize || 0;

          // Only return valid data points with meaningful volume
          return x && y && z > 0 ? { x, y, z } : null;
        })
        ?.filter(Boolean) || []; // Remove null/undefined values

    const options = {
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        animation: false,
        height: 360,
      },

      credits: { enabled: false },
      legend: {
        enabled: true,
        align: "center",
        verticalAlign: "top",
        layout: "horizontal",
        squareSymbol: false,
        symbolWidth: 20,
        symbolHeight: 12,
        symbolRadius: 0,
        itemStyle: {
          color: $mode === "light" ? "black" : "white",
        },
      },

      title: {
        text: `<h3 class="mt-3 -mb-3 text-[1rem] sm:text-lg">Realtime Unusual Order Impact</h3>`,
        useHTML: true,
        style: { color: $mode === "light" ? "black" : "white" },
      },

      xAxis: {
        type: "datetime",
        min: startTime,
        max: endTime,
        crosshair: {
          color: $mode === "light" ? "black" : "white",
          width: 1,
          dashStyle: "Solid",
        },
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
          distance: 10,
          formatter: function () {
            const date = new Date(this?.value);
            const timeString = date?.toLocaleTimeString("en-US", {
              hour: "numeric",
              hour12: true,
            });
            return `<span class="text-xs">${timeString.replace(/\s/g, " ")}</span>`;
          },
        },
        tickPositioner: function () {
          const positions = [];
          const info = this.getExtremes();
          const tickCount = 5;
          const interval = (info.max - info.min) / tickCount;

          for (let i = 0; i <= tickCount; i++) {
            positions.push(info.min + i * interval);
          }
          return positions;
        },
      },

      yAxis: [
        {
          id: "price-axis",
          min: yMin ?? null,
          max: yMax ?? null,
          title: {
            text: $screenWidth < 640 ? null : "Stock Price",
            style: {
              color: $mode === "light" ? "#6b7280" : "#fff",
            },
          },
          labels: {
            style: {
              color: $mode === "light" ? "#6b7280" : "#fff",
            },
            formatter: function () {
              return `$${this.value?.toFixed(2)}`;
            },
          },
          gridLineWidth: 1,
          gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
          tickAmount: 6,
          opposite: false, // Stock price axis on the left
        },
        {
          id: "volume-axis",
          title: {
            text: $screenWidth < 640 ? null : "Total Size",
            style: {
              color: $mode === "light" ? "#6b7280" : "#fff",
            },
          },
          labels: {
            style: {
              color: $mode === "light" ? "#6b7280" : "#fff",
            },
          },

          gridLineWidth: 0,
          opposite: true, // Volume axis on the right
        },
      ],

      tooltip: {
        shared: false, // Changed to false for better bubble tooltip handling
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 1)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        style: {
          color: $mode === "light" ? "black" : "white",
          fontSize: "16px",
          padding: "10px",
        },
        borderRadius: 4,
        formatter: function () {
          const date = new Date(this?.x);
          let formattedDate = date?.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          });

          let tooltipContent = `<span class="text-white m-auto text-black text-sm font-normal">${formattedDate}</span><br>`;

          // Handle bubble series differently
          if (this.series.type === "bubble") {
            tooltipContent += `<span class="text-white text-sm font-[501]">${this.series.name}</span><br>`;
            tooltipContent += `<span class="text-white text-sm font-[501]">Price: ${this.point.y?.toFixed(2)}</span><br>`;
            tooltipContent += `<span class="text-white text-sm font-[501]">Volume: ${this.point.z?.toLocaleString("en-US")}</span><br>`;
            tooltipContent += `<span class="text-white text-sm font-[400]">Rank: ${this.point.z === maxVolume ? "Highest" : this.point.z > avgVolume * 2 ? "High" : "Medium"} Impact</span>`;
          } else {
            tooltipContent += `<span class="text-white text-sm font-[501]">${this.series.name}: ${this.y?.toLocaleString("en-US")}</span><br>`;
          }

          return tooltipContent;
        },
      },

      plotOptions: {
        series: {
          legendSymbol: "rectangle",
          animation: false,
          marker: {
            enabled: false,
            states: {
              hover: { enabled: false },
              select: { enabled: false },
            },
          },
        },
        spline: {
          lineWidth: 2.5,
          shadow: false,
        },
        areaspline: {
          lineWidth: 1.5,
          fillOpacity: 0.3,
          shadow: false,
        },
        bubble: {
          minSize: 5, // Smaller minimum for small spikes
          maxSize: 40, // Larger maximum for biggest spikes
          opacity: 0.8,
          marker: {
            enabled: true, // Enable markers for bubbles
            fillOpacity: 0.8,
            lineWidth: 1,
            lineColor: $mode === "light" ? "#d97706" : "#f59e0b",
          },
          dataLabels: {
            enabled: false,
          },
          sizeBy: "z", // Size bubbles by z-value
          zMin: minVolume, // Use actual minimum volume for scaling
          zMax: maxVolume, // Use actual maximum volume for scaling
          sizeByAbsoluteValue: false, // Use relative sizing for better proportion
        },
      },

      series: [
        {
          name: "Stock Price",
          type: "spline",
          data: seriesData,
          color: $mode === "light" ? "#000" : "#fff",
          lineWidth: 2.5,
          yAxis: "price-axis",
          animation: false,
          shadow: false,
          zIndex: 2,
        },
        {
          name: "Order Volume",
          type: "areaspline",
          data: darkPoolSeries,
          color: "#F21C64",
          borderColor: "#F21C64",
          yAxis: "volume-axis",
          animation: false,
          zIndex: 1,
        },
        {
          name: "High Impact Orders",
          type: "bubble",
          data: volumeImpactPoints,
          color: $mode === "light" ? "#f59e0b" : "#fbbf24",
          yAxis: "price-axis",
          animation: false,
          zIndex: 3, // Highest z-index to appear on top
          showInLegend: true,
        },
      ],
    };

    return options;
  }

  $: if ($mode) {
    config = null;
    config = getPlotChart() || null;
  }
</script>

<div>
  <div class="grow">
    <div class="relative">
      <!-- Apply the blur class to the chart -->
      <div
        class="border border-gray-300 dark:border-zinc-700 rounded"
        use:highcharts={config}
      ></div>
    </div>
  </div>
</div>

<script lang="ts">
  import { setCache, getCache, screenWidth } from "$lib/store";
  import highcharts from "$lib/highcharts.ts";
  import { abbreviateNumber } from "$lib/utils";
  import { mode } from "mode-watcher";

  export let data;
  export let symbol;
  export let ratingsList;
  export let numOfRatings = 0;
  export let title = "Ratings";
  export let addToLast = false; //if date value not found at mark point to the last value date.

  let isLoaded = false;
  let config = null;
  let historicalData = [];
  let timePeriod = "1Y";

  // Mobile-responsive values (only true when screenWidth is set and < 640)
  $: isMobile = $screenWidth > 0 && $screenWidth < 640;
  $: chartHeight = 360;
  $: markerRadius = isMobile ? 4 : 6;
  $: labelFontSize = isMobile ? "11px" : "14px";
  $: tickCount = isMobile ? 3 : 5;
  $: tooltipFontSize = isMobile ? "14px" : "16px";

  function filterDataByPeriod(historicalData, period = "1Y") {
    const currentDate = new Date();
    let startDate;

    // Calculate the start date based on the period input
    switch (period) {
      case "1Y":
        startDate = new Date();
        startDate.setFullYear(currentDate.getFullYear() - 1);
        break;
      case "3Y":
        startDate = new Date();
        startDate.setFullYear(currentDate.getFullYear() - 3);
        break;
      case "5Y":
        startDate = new Date();
        startDate.setFullYear(currentDate.getFullYear() - 5);
        break;
      case "Max":
        // For 'Max', assume we want to start from the earliest possible date
        startDate = new Date(0); // This will set the date to January 1, 1970
        break;
      default:
        throw new Error(`Unsupported period: ${period}`);
    }

    // Filter the data based on the calculated start date
    const filteredData = historicalData?.filter((item) => {
      const itemDate = new Date(item?.time);
      return itemDate >= startDate && itemDate <= currentDate;
    });

    // Extract the dates and close values from the filtered data
    const dates = filteredData?.map((item) => item?.time);
    const closeValues = filteredData?.map((item) => item?.close);

    return { dates, closeValues };
  }

  async function historicalPrice(symbol) {
    const cachedData = getCache(symbol, "ratingsChart");
    if (cachedData) {
      historicalData = cachedData;
    } else {
      const postData = {
        ticker: symbol,
        timePeriod: "max",
      };

      const response = await fetch("/api/historical-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      historicalData = (await response?.json()) ?? [];

      setCache(symbol, historicalData, "ratingsChart");
    }
    config = plotData();
  }

  // Function to plot data based on a specified time period
  function plotData() {
    // Extract the time (x-axis) and close values (y-axis)
    const { dates, closeValues } = filterDataByPeriod(
      historicalData,
      timePeriod,
    );

    // Process ratings for markers
    const markers = [];

    if (ratingsList && ratingsList.length > 0) {
      ratingsList
        ?.filter((rating) => rating?.ticker === symbol)
        ?.forEach((rating) => {
          let dateIndex;

          if (addToLast) {
            // If addToLast is true, use fallback logic for the last date
            dateIndex = dates.includes(rating?.date)
              ? dates?.indexOf(rating?.date)
              : dates?.length - 1;
          } else {
            // If addToLast is false, use the original logic
            dateIndex = dates?.indexOf(rating?.date);
          }

          // Skip if date index is invalid
          if (dateIndex === -1) return;

          // Format the rating type
          const formattedType = rating?.type
            ?.replace("Bought", "Buy")
            ?.replace("Sold", "Sell")
            ?.replace("Sector Perform", "Hold")
            ?.replace("Equal-Weight", "Hold")
            ?.replace("Market Perform", "Hold")
            ?.replace("Overweight", "Buy")
            ?.replace("Market Outperform", "Buy")
            ?.replace("Outperform", "Buy")
            ?.replace("Market Underperform", "Sell")
            ?.replace("Underperform", "Sell")
            ?.replace("Underweight", "Sell");

          // Determine marker color based on rating type
          let markerColor = "#FF0000"; // Default to red (Sell)
          if (["Buy", "Strong Buy"].includes(formattedType)) {
            markerColor = "#00FF00"; // Green for Buy ratings
          } else if (["Hold", "Neutral"].includes(formattedType)) {
            markerColor = "#FFA500"; // Orange for Hold ratings
          }

          // Add marker point
          markers.push({
            x: dateIndex,
            y: closeValues[dateIndex],
            marker: {
              symbol: "triangle-down",
              radius: markerRadius,
              fillColor: markerColor,
              lineWidth: isMobile ? 1.5 : 2,
              lineColor: $mode === "light" ? "black" : "white",
            },
            dataLabels: {
              enabled: true,
              format: formattedType,
              style: {
                color: $mode === "light" ? "black" : "white",
                fontWeight: "bold",
                fontSize: labelFontSize,
              },
              y: isMobile ? -8 : -10,
            },
          });
        });
    }

    const fillColorStart = "rgb(70, 129, 244,0.5)";
    const fillColorEnd = "rgb(70, 129, 244,0.001)";

    // Find the lowest & highest close values
    let minValue = Math?.min(...closeValues?.map((item) => item));
    let maxValue = Math?.max(...closeValues?.map((item) => item));

    let padding = 0.002;
    let yMin = minValue * (1 - padding) === 0 ? null : minValue * (1 - padding);
    let yMax = maxValue * (1 + padding) === 0 ? null : maxValue * (1 + padding);

    const options = {
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: chartHeight,
      },
      credits: { enabled: false },
      legend: { enabled: false },
      title: {
        text: `<h3 class="mt-3 mb-2 "></h3>`,
        useHTML: true,
        style: { color: $mode === "light" ? "#374151" : "#d4d4d8" },
      },
      xAxis: {
        type: "datetime",
        endOnTick: false,
        categories: dates,
        crosshair: {
          color: $mode === "light" ? "black" : "white", // Set the color of the crosshair line
          width: 1, // Adjust the line width as needed
          dashStyle: "Solid",
        },
        labels: {
          style: {
            color: $mode === "light" ? "#545454" : "white",
          },
          distance: 20, // Increases space between label and axis
          formatter: function () {
            const date = new Date(this.value);
            return date.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            });
          },
        },
        tickPositioner: function () {
          // Create custom tick positions with wider spacing
          const positions = [];
          const info = this.getExtremes();
          const numTicks = tickCount; // Responsive tick count
          const interval = Math.floor((info.max - info.min) / numTicks);

          for (let i = 0; i <= numTicks; i++) {
            positions.push(info.min + i * interval);
          }
          return positions;
        },
      },
      yAxis: {
        min: yMin ?? null,
        max: yMax ?? null,
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        labels: {
          style: { color: $mode === "light" ? "black" : "white" },
        },
        title: { text: null },
        opposite: true,
      },
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        borderColor: "rgba(255, 255, 255, 0.15)",
        borderWidth: 1,
        style: {
          color: "white",
          fontSize: tooltipFontSize,
          padding: isMobile ? "8px" : "10px",
        },
        borderRadius: 6,
        formatter: function () {
          // Format the x value to display time in hh:mm format
          let tooltipContent = `<span class=" m-auto text-[1rem] font-[501]">${new Date(
            this.points[0]?.key,
          ).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}</span><br>`;

          // Loop through each point in the shared tooltip
          this.points.forEach((point) => {
            tooltipContent += `<span class=" font-semibold text-sm">${point.series.name}:</span> 
          <span class=" font-normal text-sm">${abbreviateNumber(
            point.y,
          )}</span><br>`;
          });

          return tooltipContent;
        },
      },
      plotOptions: {
        series: {
          color: $mode === "light" ? "black" : "white",
          animation: false, // Disable series animation
          states: {
            hover: {
              enabled: false, // Disable hover effect globally
            },
          },
        },
      },

      series: [
        {
          name: "Price",
          data: closeValues?.map((value, index) => {
            return markers?.some((marker) => marker?.x === index)
              ? { y: value } // Keeps the price plotted while allowing markers
              : value;
          }),
          type: "area",
          lineWidth: 1.3,
          animation: false,
          zIndex: 10,
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, fillColorStart],
              [1, fillColorEnd],
            ],
          },
          color: "#4681f4",
        },
        {
          name: "Ratings",
          type: "scatter",
          data: markers,
          enableMouseTracking: false,
          animation: false,
          marker: {
            enabled: true,
          },
        },
      ],
    };

    return options;
  }

  $: {
    if ((symbol && timePeriod) || $mode || $screenWidth) {
      isLoaded = false;
      config = null;
      historicalData = [];

      historicalPrice(symbol);
      isLoaded = true;
    }
  }
</script>

<div class="w-full overflow-hidden m-auto">
  {#if isLoaded && config !== null}
    {#if historicalData?.length > 0}
      <div class="relative">
        <div
          class="flex justify-start gap-1.5 sm:gap-2 w-full ml-1.5 sm:ml-2 absolute top-3 sm:top-3.5 z-10"
        >
          {#each ["1Y", "3Y", "5Y", "Max"] as item, index}
            {#if ["Pro", "Plus"]?.includes(data?.user?.tier) || index === 0}
              <label
                on:click={() => (timePeriod = item)}
                class="px-2 py-0.5 sm:py-1 text-xs {timePeriod === item
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-600 dark:text-zinc-400 bg-white/90 dark:bg-zinc-900/90 border border-gray-300/70 dark:border-zinc-700/70'} transition-colors rounded-full cursor-pointer"
              >
                {item}
              </label>
            {:else if !["Pro", "Plus"]?.includes(data?.user?.tier)}
              <a
                href="/pricing"
                class="px-2 py-0.5 sm:py-1 text-xs flex items-center {timePeriod ===
                item
                  ? 'bg-white text-gray-500'
                  : 'text-gray-400 dark:text-zinc-500 bg-gray-100/90 dark:bg-zinc-800/90'} border border-gray-300/70 dark:border-zinc-700/70 transition-colors rounded-full cursor-pointer hover:text-violet-600 dark:hover:text-violet-400"
              >
                {item}
                <svg
                  class="ml-0.5 sm:ml-1 w-3 h-3 sm:w-3.5 sm:h-3.5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  ><path
                    fill="currentColor"
                    d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                  /></svg
                >
              </a>
            {/if}
          {/each}
        </div>
      </div>
      <div
        class="border border-gray-300/70 dark:border-zinc-700/80 rounded-lg w-full"
        use:highcharts={config}
      ></div>
    {:else}
      <div class="h-[220px] sm:h-[350px]">
        <div
          class="flex h-full w-full flex-col items-center justify-center rounded-lg border border-gray-300/70 dark:border-zinc-700/80 p-4 sm:p-6 text-center"
        >
          <div class="text-gray-500 dark:text-zinc-500 text-sm sm:text-base">
            No chart data available for {symbol}
          </div>
        </div>
      </div>
    {/if}
  {:else}
    <div class="flex justify-center items-center h-64 sm:h-80">
      <div class="relative">
        <label
          class="shadow-sm bg-white/90 dark:bg-zinc-900/80 border border-gray-300 shadow dark:border-zinc-700 rounded-full h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        >
          <span
            class="loading loading-spinner loading-md text-gray-700 dark:text-zinc-200"
          ></span>
        </label>
      </div>
    </div>
  {/if}
</div>

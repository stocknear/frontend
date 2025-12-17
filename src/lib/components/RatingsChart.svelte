<script lang="ts">
  import { setCache, getCache } from "$lib/store";
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
              radius: 6,
              fillColor: markerColor,
              lineWidth: 2,
              lineColor: $mode === "light" ? "black" : "white",
            },
            dataLabels: {
              enabled: true,
              format: formattedType,
              style: {
                color: $mode === "light" ? "black" : "white",
                fontWeight: "bold",
                fontSize: "14px",
              },
              y: -10,
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
        height: 360,
      },
      credits: { enabled: false },
      legend: { enabled: false },
      title: {
        text: `<h3 class="mt-3 mb-1 text-[1rem] sm:text-lg">${symbol} - ${numOfRatings} Transaction</h3>`,
        useHTML: true,
        style: { color: $mode === "light" ? "black" : "white" },
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
          const tickCount = 5; // Reduce number of ticks displayed
          const interval = Math.floor((info.max - info.min) / tickCount);

          for (let i = 0; i <= tickCount; i++) {
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
        backgroundColor: "rgba(0, 0, 0, 1)", // Semi-transparent black
        borderColor: "rgba(255, 255, 255, 0.2)", // Slightly visible white border
        borderWidth: 1,
        style: {
          color: "white",
          fontSize: "16px",
          padding: "10px",
        },
        borderRadius: 4,
        formatter: function () {
          // Format the x value to display time in hh:mm format
          let tooltipContent = `<span class=" m-auto text-[1rem] font-[501]">${new Date(
            this?.x,
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
    if ((symbol && timePeriod) || $mode) {
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
          class="flex justify-start space-x-2 w-full ml-2 absolute top-3.5 z-10"
        >
          {#each ["1Y", "3Y", "5Y", "Max"] as item, index}
            {#if ["Pro", "Plus"]?.includes(data?.user?.tier) || index === 0}
              <label
                on:click={() => (timePeriod = item)}
                class="px-3 py-1 {timePeriod === item
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'text-muted dark:text-white bg-white border border-gray-300 dark:border-gray-800 shadow dark:bg-table '} transition ease-out duration-100 rounded cursor-pointer"
              >
                {item}
              </label>
            {:else if !["Pro", "Plus"]?.includes(data?.user?.tier)}
              <a
                href="/pricing"
                class="px-3 py-1 flex flex-row items-center {timePeriod === item
                  ? 'bg-white text-muted'
                  : 'text-muted dark:text-white bg-gray-100 dark:bg-table text-opacity-[0.6]'} border border-gray-200 dark:border-gray-700 transition ease-out duration-100 sm:hover:bg-white sm:hover:text-black rounded cursor-pointer"
              >
                {item}
                <svg
                  class="ml-1 mt-0.5 w-3.5 h-3.5 inline-block"
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
        class="border border-gray-300 dark:border-gray-800 rounded w-full"
        use:highcharts={config}
      ></div>
    {:else}
      <div class="h-[250px] sm:h-[350px]">
        <div
          class="flex h-full w-full flex-col items-center justify-center rounded-sm border border-gray-300 dark:border-gray-800 p-6 text-center md:p-12"
        >
          <div class="mb-4 text-white text-[1rem] sm:text-xl font-semibold">
            No chart data available for {symbol}
          </div>
        </div>
      </div>
    {/if}
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
</div>

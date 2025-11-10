<script lang="ts">
  import { displayCompanyName } from "$lib/store";
  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
  import highcharts from "$lib/highcharts.ts";
  import RealtimeTrade from "$lib/components/DarkPool/RealtimeTrade.svelte";
  import { mode } from "mode-watcher";

  let category = "Today's Trend";

  export let data;
  export let rawData = [];
  export let metrics = {};

  let isPro = data?.user?.tier === "Pro";

  let currentPrice = Number(data?.getStockQuote?.price?.toFixed(2));

  let config;

  function getBarChart() {
    const xAxis = rawData?.map((item) => item?.size);
    let priceLevel = rawData?.map((item) => item?.price_level || 0);

    priceLevel = Array.from(new Set([...priceLevel, ...[currentPrice]]))?.sort(
      (a, b) => a - b,
    );

    // Find max value index for highlighting
    const maxValueIndex = xAxis?.indexOf(Math.max(...xAxis));

    // Create colors array with highlighted bar
    const colors = xAxis?.map((value, index) =>
      index === maxValueIndex
        ? "#3BA272"
        : $mode === "light"
          ? "#2C6288"
          : "#e2e8f0",
    );

    const options = {
      chart: {
        type: "column",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        animation: false,
        height: 360,
      },
      credits: { enabled: false },
      legend: { enabled: false },
      title: {
        text: `<h3 class="mt-3 mb-1 text-[1rem] sm:text-lg">Dark Pool Price Levels</h3>`,
        useHTML: true,
        style: { color: $mode === "light" ? "black" : "white" },
      },
      xAxis: {
        endonTick: false,
        categories: priceLevel,
        plotLines: [
          {
            value: priceLevel?.findIndex((s) => s === currentPrice),
            color: $mode === "light" ? "#000" : "#fff",
            dashStyle: "Dash",
            width: 1.5,
            label: {
              text: `Current Price ${currentPrice}`,
              style: { color: $mode === "light" ? "#000" : "#fff" },
            },
            zIndex: 5,
          },
        ],
        crosshair: {
          color: $mode === "light" ? "#545454" : "white", // Set the color of the crosshair line
          width: 1, // Adjust the line width as needed
          dashStyle: "Solid",
        },
        labels: {
          style: {
            color: $mode === "light" ? "#545454" : "white",
          },
          distance: 10, // Increases space between label and axis
          formatter: function () {
            return this.value;
          },
        },
      },
      yAxis: {
        title: {
          text: null,
        },
        opposite: true,
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        tickPositioner: function () {
          const positions = [];
          const info = this.getExtremes();
          const tickCount = 3; // Number of ticks displayed
          const interval = Math.floor((info.max - info.min) / tickCount);

          for (let i = 0; i <= tickCount; i++) {
            positions.push(info.min + i * interval);
          }
          return positions;
        },
        labels: {
          formatter: function () {
            return abbreviateNumber(this?.value);
          },
          style: {
            color: $mode === "light" ? "#545454" : "white",
          },
        },
      },
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 1)", // Semi-transparent black
        borderColor: "rgba(255, 255, 255, 0.2)", // Slightly visible white border
        borderWidth: 1,
        style: {
          color: "#fff",
          fontSize: "16px",
          padding: "10px",
        },
        borderRadius: 4,
        formatter: function () {
          // Format the x value to display time in hh:mm format
          let tooltipContent = `<span class=" m-auto  text-sm font-[501]">Price Level ${this?.x}</span><br>`;

          // Loop through each point in the shared tooltip
          this.points?.forEach((point) => {
            tooltipContent += `<span class=" font-semibold text-sm">${point.series.name}:</span> 
          <span class=" font-normal text-sm ">${abbreviateNumber(
            point.y,
          )}</span><br>`;
          });

          return tooltipContent;
        },
      },

      plotOptions: {
        column: {
          colorByPoint: true,
          colors: colors,
          borderColor: colors,
          borderRadius: "1px",
          dataLabels: {
            enabled: false,
          },
        },
        animation: false,
      },
      series: [
        {
          name: `Total Size`,
          data: xAxis,
          animation: false,
        },
      ],
    };

    return options;
  }

  $: if (category === "Price Level" || $mode) {
    config = getBarChart() || null;
  }
</script>

<section class="overflow-hidden h-full pb-8 pt-3">
  <main class="overflow-hidden">
    {#if rawData?.length !== 0 && Object?.keys(metrics)?.length > 0}
      <div class="w-full flex flex-col items-start">
        <p class="text-[1rem] mt-2 w-full sm:mb-4">
          {removeCompanyStrings($displayCompanyName)} dark pool activity today shows
          an average trade size of
          <strong>
            {Math.floor(metrics?.avgTradeSize)?.toLocaleString("en-US")}
          </strong>
          with
          <strong>
            ${abbreviateNumber(metrics?.avgPremTrade)}
          </strong>
          average premium per trade.
        </p>
      </div>

      <div class=" rounded mt-5 sm:mt-0">
        <div class="flex justify-end mb-2 space-x-2 z-10 text-sm">
          {#each ["Today's Trend", "Price Level"] as item, index}
            {#if data?.user?.tier === "Pro" || index === 0}
              <label
                on:click={() => (category = item)}
                class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 {category ===
                item
                  ? 'bg-black text-white sm:hover:bg-default dark:bg-white dark:text-black'
                  : ' shadow bg-gray-100 dark:bg-table text-opacity-[0.6]'} transition ease-out duration-100 rounded cursor-pointer"
              >
                {item}
              </label>
            {:else if data?.user?.tier !== "Pro"}
              <a
                href="/pricing"
                class="px-3 py-1 text-sm flex flex-row items-center border border-gray-300 dark:border-gray-700 {category ===
                item
                  ? 'bg-black text-white sm:hover:bg-default dark:bg-white dark:text-black'
                  : ' shadow bg-gray-100 dark:bg-table text-opacity-[0.6]'} transition ease-out duration-100 rounded cursor-pointer"
              >
                {item}
                <svg
                  class="ml-1 -mt-w-3.5 h-3.5 inline-block"
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

        {#if category === "Price Level"}
          <div
            class="border border-gray-300 dark:border-gray-800 rounded w-full"
            use:highcharts={config}
          ></div>
        {:else}
          <RealtimeTrade {data} />
        {/if}
      </div>
    {/if}
  </main>
</section>

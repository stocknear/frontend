<script>
  import { abbreviateNumber, sectorNavigation } from "$lib/utils";
  import { stockTicker, displayCompanyName } from "$lib/store";
  import { mode } from "mode-watcher";
  import highcharts from "$lib/highcharts.ts";

  export let blogData = {};

  function plotData() {
    const dates = blogData?.cumulativeReturns?.map((item) => item?.date);
    const tickerData = blogData?.cumulativeReturns?.map(
      (item) => item?.cumulativeTicker,
    );
    const spyData = blogData?.cumulativeReturns?.map(
      (item) => item?.cumulativeBenchmark,
    );

    const options = {
      credits: {
        enabled: false,
      },
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 360,
      },
      title: {
        text: `<h3 class="mt-3 mb-1 ">Returns vs SPY</h3>`,
        style: {
          color: $mode === "light" ? "black" : "white",
          // Using inline CSS for margin-top and margin-bottom
        },
        useHTML: true, // Enable HTML to apply custom class styling
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
          distance: 10, // Increases space between label and axis
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
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
          formatter: function () {
            return this.value + "%";
          },
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
          color: "#fff",
          fontSize: "16px",
          padding: "10px",
        },
        borderRadius: 4,
        formatter: function () {
          // Format the x value to display time in a custom format
          let tooltipContent = `<span class="m-auto text-[1rem] font-[501]">${new Date(
            this?.x,
          ).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}</span><br>`;

          // Loop through each point in the shared tooltip
          this.points.forEach((point) => {
            tooltipContent += `
        <span style="display:inline-block; width:10px; height:10px; background-color:${point.color}; border-radius:50%; margin-right:5px;"></span>
        <span class="font-semibold text-sm">${point.series.name}:</span> 
        <span class="font-normal text-sm">${abbreviateNumber(point.y)}%</span><br>`;
          });

          return tooltipContent;
        },
      },

      plotOptions: {
        series: {
          color: "white",
          animation: false, // Disable series animation
          states: {
            hover: {
              enabled: false, // Disable hover effect globally
            },
          },
        },
      },
      legend: {
        enabled: true,
        align: "center", // Positions legend at the left edge
        verticalAlign: "top", // Positions legend at the top
        layout: "horizontal", // Align items horizontally (use 'vertical' if preferred)
        itemStyle: {
          color: $mode === "light" ? "black" : "white",
        },
        symbolWidth: 14, // Controls the width of the legend symbol
        symbolRadius: 1, // Creates circular symbols (adjust radius as needed)
        squareSymbol: true, // Ensures symbols are circular, not square
      },
      series: [
        {
          name: `Cumulative Return ${$stockTicker}`,
          type: "spline",
          data: tickerData,
          color: "#4681f4",
          lineWidth: 1.2,
          marker: {
            enabled: false,
          },
        },
        {
          name: `Cumulative Return SPY`,
          type: "spline",
          data: spyData,
          color: "#37F713",
          lineWidth: 1.2,
          marker: {
            enabled: false,
          },
        },
      ],
    };

    return options;
  }

  let config = plotData();
</script>

<h2 class="text-xl sm:text-3xl font-bold mt-8">Overview</h2>
<div class="mt-4">
  <div class=" border-[#2C6288] dark:border-gray-600 border-b">
    {$stockTicker} - {$displayCompanyName}
  </div>

  <div
    class="my-5 pb-5 grid
            grid-cols-2 gap-3
            xs:mt-6 bp:mt-7
            sm:grid-cols-3 sm:gap-6
            lg:grid-cols-4"
  >
    <div class="flex flex-col">
      <div class="text-gray-800 dark:text-gray-300 text-sm">Market Cap</div>
      <div class="mt-0.5 text-lg bp:text-lg sm:mt-1.5 sm:text-xl font-semibold">
        {abbreviateNumber(blogData?.marketCap)}
      </div>
    </div>
    <div class="flex flex-col">
      <div class="text-gray-800 dark:text-gray-300 text-sm">Sector</div>
      <div class="mt-0.5 text-lg bp:text-lg sm:mt-1.5 sm:text-xl font-semibold">
        <a
          href={sectorNavigation?.find(
            (listItem) => listItem?.title === blogData?.sector,
          )?.link}
          class="inline-block text-violet-800 dark:text-violet-400 dark:sm:hover:text-white sm:hover:text-muted"
        >
          {blogData?.sector}
        </a>
      </div>
    </div>
    <div class="flex flex-col">
      <div class="text-gray-800 dark:text-gray-300 text-sm">EPS (TTM)</div>
      <div class="mt-0.5 text-lg bp:text-lg sm:mt-1.5 sm:text-xl font-semibold">
        {blogData?.epsTTM}
      </div>
    </div>
    <div class="flex flex-col">
      <div class="text-gray-800 dark:text-gray-300 text-sm">P/E (TTM)</div>
      <div class="mt-0.5 text-lg bp:text-lg sm:mt-1.5 sm:text-xl font-semibold">
        {blogData?.peTTM}
      </div>
    </div>
    <div class="flex flex-col">
      <div class="text-gray-800 dark:text-gray-300 text-sm">Div & Yield</div>
      <div class="mt-0.5 text-lg bp:text-lg sm:mt-1.5 sm:text-xl font-semibold">
        {blogData?.annualDividend ?? "n/a"} ({blogData?.dividendYield
          ? blogData?.dividendYield + "%"
          : "n/a"})
      </div>
    </div>

    <div class="flex flex-col">
      <div class="text-gray-800 dark:text-gray-300 text-sm">P/S</div>
      <div class="mt-0.5 text-lg bp:text-lg sm:mt-1.5 sm:text-xl font-semibold">
        {blogData?.priceToSalesRatio}
      </div>
    </div>

    <div class="flex flex-col">
      <div class="text-gray-800 dark:text-gray-300 text-sm">P/B</div>
      <div class="mt-0.5 text-lg bp:text-lg sm:mt-1.5 sm:text-xl font-semibold">
        {blogData?.priceToBookRatio}
      </div>
    </div>

    <div class="flex flex-col">
      <div class="text-gray-800 dark:text-gray-300 text-sm">Next Earnings</div>
      <div class="mt-0.5 text-lg bp:text-lg sm:mt-1.5 sm:text-xl font-semibold">
        {blogData?.nextEarning}
      </div>
    </div>

    <div class="flex flex-col">
      <div class="text-gray-800 dark:text-gray-300 text-sm">
        Shares Outstanding
      </div>
      <div class="mt-0.5 text-lg bp:text-lg sm:mt-1.5 sm:text-xl font-semibold">
        {abbreviateNumber(blogData?.sharesOutstanding)}
      </div>
    </div>
    <div class="flex flex-col">
      <div class="text-gray-800 dark:text-gray-300 text-sm">Short % Float</div>
      <div class="mt-0.5 text-lg bp:text-lg sm:mt-1.5 sm:text-xl font-semibold">
        {blogData?.shortFloatPercent + "%"}
      </div>
    </div>
    <div class="flex flex-col">
      <div class="text-gray-800 dark:text-gray-300 text-sm">Short % Out</div>
      <div class="mt-0.5 text-lg bp:text-lg sm:mt-1.5 sm:text-xl font-semibold">
        {blogData?.shortOutstandingPercent?.toFixed(2) + "%"}
      </div>
    </div>

    <div class="flex flex-col">
      <div class="text-gray-800 dark:text-gray-300 text-sm">Forward P/E</div>
      <div class="mt-0.5 text-lg bp:text-lg sm:mt-1.5 sm:text-xl font-semibold">
        {blogData?.forwardPE}
      </div>
    </div>
  </div>
</div>

<h2 class="text-xl sm:text-2xl font-bold mt-6 mb-2">Description</h2>
<p class="mb-4">
  {blogData?.description}
</p>

{#if config}
  <div
    class="chart-driver border border-gray-300 shadow dark:border-zinc-700 rounded"
    use:highcharts={config}
  ></div>
{/if}

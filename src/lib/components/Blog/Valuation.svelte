<script lang="ts">
  import highcharts from "$lib/highcharts.ts";
  import { abbreviateNumber } from "$lib/utils";
  import { mode } from "mode-watcher";
  export let blogData = {};

  let peData = blogData?.data?.priceToEarningsRatio;
  let pFCFData = blogData?.data?.priceToFreeCashFlowRatio;
  let psData = blogData?.data?.priceToSalesRatio;
  let pegData = blogData?.data?.priceToEarningsGrowthRatio;

  let fundamentalData = [
    {
      label: `P/E of ${peData?.value} is ${peData?.value > peData?.fiveYearAvg ? "above" : "below"} 5-Year Avg ${peData?.fiveYearAvg}`,
      value: peData?.upside,
      sentiment: peData?.sentiment,
    },
    {
      label: `P/FCF of ${pFCFData?.value} is ${pFCFData?.value > pFCFData?.fiveYearAvg ? "above" : "below"} 5-Year Avg ${pFCFData?.fiveYearAvg}`,
      value: pFCFData?.upside,
      sentiment: pFCFData?.sentiment,
    },
    {
      label: `P/S of ${psData?.value} is  ${psData?.value > psData?.fiveYearAvg ? "above" : "below"} 5-Year Avg ${psData?.fiveYearAvg}`,
      value: psData?.upside,
      sentiment: psData?.sentiment,
    },
    {
      label: `PEG Ratio of ${pegData?.value} is  ${pegData?.value > pegData?.fiveYearAvg ? "above" : "below"} 5-Year Avg ${pegData?.fiveYearAvg}`,
      value: pegData?.upside,
      sentiment: pegData?.sentiment,
    },
  ];

  function plotData() {
    const categories = ["P/E Ratio", "P/FCF Ratio", "P/S Ratio", "PEG Ratio"];
    const values = fundamentalData.map((d) => d.value);
    const barColor = "#fff"; // blue fill color

    const options = {
      credits: { enabled: false },
      chart: {
        type: "column",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 360,
      },
      title: {
        text: `<h3 class="mt-3 mb-1 ">Current vs 5 Year Avg Upside</h3>`,
        style: {
          color: $mode === "light" ? "black" : "white",
        },
        useHTML: true,
      },
      xAxis: {
        categories: categories,
        crosshair: {
          color: $mode === "light" ? "black" : "white",
          width: 1,
          dashStyle: "Solid",
        },
        labels: {
          style: {
            color: $mode === "light" ? "#545454" : "white",
          },
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
          return this.points
            ?.map(
              (point) => `
            <span class="font-semibold text-sm">${point.key}:</span> 
            <span class="font-normal text-sm">${abbreviateNumber(point.y)}%</span><br>
          `,
            )
            ?.join("");
        },
      },
      plotOptions: {
        column: {
          colorByPoint: false, // all bars same color
          color: $mode === "light" ? "#2C6288" : barColor,
          borderColor: $mode === "light" ? "#2C6288" : barColor,
          borderWidth: 1,
        },
        series: {
          animation: false,
          states: { hover: { enabled: false } },
        },
      },
      legend: {
        enabled: false,
      },
      series: [
        {
          name: "Upside",
          data: values,
        },
      ],
    };

    return options;
  }

  let config = plotData();
</script>

<h2 class="text-xl sm:text-3xl font-bold mt-8">Valuation</h2>

<div
  class="overflow-x-auto flex justify-start items-center w-full m-auto rounded-none sm:rounded mb-8 mt-5"
>
  <table
    class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-zinc-700 m-auto"
  >
    <tbody class="">
      {#each fundamentalData as item}
        <tr class=" dark:sm:hover:bg-[#245073]/10">
          <td class="text-start text-sm whitespace-nowrap">
            {item?.label}
          </td>
          <td class="text-end text-sm whitespace-nowrap">
            {item?.value + "%"}
          </td>

          <td class=" text-sm sm:text-[1rem] whitespace-nowrap text-end">
            <label
              class="badge badge-lg w-24 rounded-[3px] {[
                'Very Good',
                'Good',
              ]?.includes(item?.sentiment)
                ? 'bg-green-800 dark:bg-green-600'
                : item?.sentiment === 'Average'
                  ? 'bg-orange-800 dark:bg-orange-600'
                  : 'bg-red-800 dark:bg-red-600'}">{item?.sentiment}</label
            >
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

{#if config}
  <div
    class="chart-driver border border-gray-300 shadow dark:border-zinc-700 rounded mb-6"
    use:highcharts={config}
  ></div>
{/if}

{@html blogData?.text}

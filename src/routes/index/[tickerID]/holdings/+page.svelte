<script lang="ts">
  import { indexTicker, displayCompanyName, screenWidth } from "$lib/store";
  import { removeCompanyStrings } from "$lib/utils";
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";

  export let data;
  let rawData = [...data?.getETFHoldings?.holdings] ?? [];

  let configBarChart;
  let configPieChart;

  let options = {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  };
  let lastUpdate = new Date(data?.getETFHoldings?.lastUpdate);
  let formattedDate = lastUpdate.toLocaleDateString("en-US", options);
  let htmlOutput = generateStatementInfoHTML();

  const excludedRules = new Set([
    "price",
    "changesPercentage",
    "sharesNumber",
    "weightPercentage",
  ]);

  const defaultList = [
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "Shares", rule: "sharesNumber" },
    { name: "% Weight", rule: "weightPercentage" },
  ];

  const specificRows = [
    { name: "% Weight", rule: "weightPercentage", type: "percent" },
    { name: "Shares", rule: "sharesNumber", type: "int" },
  ];

  function plotPieChart() {
    // Sector allocation data
    const sectorData = data?.getIndexSectorWeighting;

    // Color palette matching the screenshot
    const colors = [
      "#2B5F75", // Technology - Dark blue
      "#4A7BA7", // Financials - Medium blue
      "#8B5A9B", // Consumer Discretionary - Purple
      "#C85A9B", // Health Care - Pink-purple
      "#E85A85", // Industrials - Pink
      "#F5756B", // Communication Services - Coral
      "#F9A05C", // Consumer Staples - Orange
      "#FFC04D", // Other - Yellow
      "#FFD93D", // Energy - Bright yellow
      "#4A6B8A", // Utilities - Blue-gray
      "#9B7BA7", // Real Estate - Light purple
      "#D85A9B", // Materials - Pink
    ];

    // Transform data for Highcharts pie chart
    const pieData = sectorData.map((item, index) => ({
      name: item.sector,
      y: item.weightPercentage,
      color: colors[index % colors.length],
    }));

    // Highcharts configuration options
    const options = {
      credits: {
        enabled: false,
      },
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        type: "pie",
        height: 330,
        animation: false,
      },
      title: {
        text: null,
      },
      plotOptions: {
        pie: {
          allowPointSelect: false,
          cursor: "pointer",
          dataLabels: {
            enabled: true,
            distance: 30,
            style: {
              color: $mode === "light" ? "#333" : "#fff",
              fontSize: "14px",
              fontWeight: "500",
              textOutline: "none",
            },
            formatter: function () {
              return `<span style="font-weight: 600">${this.point.name}:</span> ${this.y.toFixed(2)}%`;
            },
          },
          showInLegend: false,
          borderWidth: 0,
          size: "80%",
          innerSize: "0%",
          animation: false,
          enableMouseTracking: false,
          states: {
            hover: {
              enabled: false,
            },
            inactive: {
              enabled: false,
            },
          },
        },
      },
      tooltip: {
        enabled: false,
      },
      series: [
        {
          name: "Sectors",
          data: pieData,
          animation: false,
        },
      ],
      legend: {
        enabled: false,
      },
    };

    return options;
  }

  function plotBarChart() {
    // Sector allocation data
    const sectorData = data?.getIndexSectorWeighting;

    // Transform data for Highcharts horizontal bar chart
    const categories = sectorData.map((item) => item.sector);
    const values = sectorData.map((item) => item.weightPercentage);

    // Highcharts configuration options
    const options = {
      credits: {
        enabled: false,
      },
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        type: "bar",
        height: 500,
        animation: false,
      },
      title: {
        text: null,
      },
      xAxis: {
        categories: categories,
        title: {
          text: null,
        },
        labels: {
          style: {
            color: $mode === "light" ? "#333" : "#fff",
            fontSize: "14px",
            fontWeight: "400",
          },
        },
        lineWidth: 0,
        tickLength: 0,
      },
      yAxis: {
        min: 0,
        max: 35,
        title: {
          text: null,
        },
        labels: {
          enabled: false,
        },
        gridLineWidth: 0,
        lineWidth: 0,
        tickLength: 0,
      },
      plotOptions: {
        bar: {
          dataLabels: {
            enabled: true,
            inside: true,
            align: "left",
            x: 5,
            style: {
              color: $mode === "light" ? "#333" : "#fff",
              fontSize: "14px",
              fontWeight: "600",
              textOutline: "none",
            },
            formatter: function () {
              return this.y.toFixed(2) + "%";
            },
          },
          color: "#4A90A4",
          borderWidth: 0,
          pointPadding: 0.1,
          groupPadding: 0.1,
          animation: false,
          enableMouseTracking: false,
          states: {
            hover: {
              enabled: false,
            },
            inactive: {
              enabled: false,
            },
          },
        },
      },
      tooltip: {
        enabled: false,
      },
      series: [
        {
          name: "Percentage",
          data: values,
          animation: false,
        },
      ],
      legend: {
        enabled: false,
      },
    };

    return options;
  }

  function generateStatementInfoHTML() {
    if (rawData?.length > 0) {
      const holdingsCount = rawData.length;

      // build the top 5 holdings text
      const topHoldings = rawData
        ?.slice(0, 5)
        ?.map((item) => {
          return `${removeCompanyStrings(item.name)} at ${item.weightPercentage?.toFixed(2)}%`;
        })
        ?.join(", ")
        ?.replace(/, ([^,]*)$/, ", and $1"); // replace last comma with ", and"

      return `
      <span>
        The ${$displayCompanyName} is an Index with a total of ${holdingsCount} individual holdings. 
        The top holdings are ${topHoldings}.
      </span>
    `;
    } else {
      return `
      <span>
        No financial data available for ${$displayCompanyName}.
      </span>
    `;
    }
  }

  $: {
    if ($mode && typeof window !== "undefined") {
      configBarChart = plotBarChart() || null;
      configPieChart = plotPieChart() || null;
    }
  }
</script>

<SEO
  title={`${$displayCompanyName} (${$indexTicker}) Holdings List`}
  description={`Get the Holdings List of ${$displayCompanyName} (${$indexTicker}).`}
/>

<section
  class=" overflow-hidden h-full min-h-screen mb-20 sm:mb-0 w-full mt-2 sm:mt-0"
>
  <div class="flex justify-center m-auto h-full overflow-hidden w-full">
    <div
      class="relative flex justify-center items-center overflow-hidden w-full"
    >
      <div class="mt-5 sm:mt-0 sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto">
        <div class="flex flex-row items-center md:space-x-4 md:border-0">
          <h1 class=" text-xl sm:text-2xl font-bold">
            {$indexTicker} Holdings List
          </h1>
          {#if data?.getETFHoldings?.lastUpdate}
            <div
              class="ml-3 sm:mt-1 whitespace-nowrap text-sm sm:text-[1rem] md:ml-0"
            >
              <span class="inline">As of </span>{formattedDate}
            </div>
          {/if}
        </div>
        <div class="mt-5">
          <Infobox text={htmlOutput} />
        </div>

        <div
          class="mt-4 shadow-xs mb-4 grid grid-cols-2 grid-rows-1 divide-gray-300 dark:divide-gray-600 rounded border border-gray-300 dark:border-gray-600 md:grid-cols-3 md:grid-rows-1 divide-x"
        >
          <div class="p-4 bp:p-5 sm:p-6">
            <label
              class="mr-1 cursor-pointer flex flex-row items-center text-[1rem]"
            >
              Total Holdings
            </label>
            <div class="mt-1 break-words font-semibold leading-8 text-xl">
              {rawData?.length?.toLocaleString("en-US")}
            </div>
          </div>
          <div
            class="p-4 bp:p-5 sm:p-6 border-b border-gray-300 dark:border-gray-600"
          >
            <label
              class="mr-1 cursor-pointer flex flex-row items-center text-[1rem]"
            >
              Top 10 Percentage
            </label>

            <div class="mt-1 break-words font-semibold leading-8 text-xl">
              {rawData
                ?.slice(0, 10)
                ?.reduce((acc, item) => acc + (item?.weightPercentage || 0), 0)
                ?.toFixed(2) + "%"}
            </div>
          </div>
          <div class="p-4 bp:p-5 sm:p-6 border-t border-b sm:border-none">
            <label
              class="mr-1 cursor-pointer flex flex-row items-center text-[1rem]"
            >
              Asset Class
            </label>

            <div class="mt-1 break-words font-semibold leading-8 text-xl">
              Index
            </div>
          </div>
        </div>

        {#if data?.getIndexSectorWeighting?.at(0)?.weightPercentage > 0}
          <div class="">
            <div class="grow mt-5">
              <div class="relative">
                <h2 class="mb-2 text-xl sm:text-2xl font-bold">
                  Sector Allocation
                </h2>

                <div
                  class=" sm:p-3 shadow-xs border border-gray-300 dark:border-gray-800 rounded"
                  use:highcharts={$screenWidth < 640
                    ? configBarChart
                    : configPieChart}
                ></div>
              </div>
            </div>
          </div>
        {/if}

        {#if rawData?.length > 0}
          <Table
            {data}
            {rawData}
            {excludedRules}
            {defaultList}
            {specificRows}
          />
        {/if}
      </div>
    </div>
  </div>
</section>

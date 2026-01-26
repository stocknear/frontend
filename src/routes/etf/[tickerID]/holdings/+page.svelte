<script lang="ts">
  import { etfTicker, displayCompanyName, screenWidth } from "$lib/store";
  import { removeCompanyStrings, abbreviateNumber } from "$lib/utils";
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";

  import {
    etf_detail_na,
    etf_detail_expense_ratio,
    etf_detail_holdings_title,
    etf_detail_holdings_as_of,
    etf_detail_holdings_total,
    etf_detail_holdings_top10,
    etf_detail_holdings_asset_class,
    etf_detail_holdings_assets,
    etf_detail_holdings_pe_ratio,
    etf_detail_holdings_sector_allocation,
    etf_detail_holdings_stocks_count,
    etf_detail_holdings_infobox,
    etf_detail_holdings_no_data,
    etf_detail_holdings_price,
    etf_detail_holdings_change,
    etf_detail_holdings_shares,
    etf_detail_holdings_weight,
  } from "$lib/paraglide/messages";

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

  $: defaultList = [
    { name: etf_detail_holdings_price(), rule: "price" },
    { name: etf_detail_holdings_change(), rule: "changesPercentage" },
    { name: etf_detail_holdings_shares(), rule: "sharesNumber" },
    { name: etf_detail_holdings_weight(), rule: "weightPercentage" },
  ];

  $: specificRows = [
    { name: etf_detail_holdings_weight(), rule: "weightPercentage", type: "percent" },
    { name: etf_detail_holdings_shares(), rule: "sharesNumber", type: "int" },
  ];

  function plotPieChart() {
    // Sector allocation data
    const sectorData = data?.getETFSectorWeighting;

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
        backgroundColor: $mode === "light" ? "transparent" : "transparent",
        plotBackgroundColor: $mode === "light" ? "transparent" : "transparent",
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
            distance: 24,
            style: {
              color: $mode === "light" ? "#4B5563" : "#A1A1AA",
              fontSize: "12px",
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
    const sectorData = data?.getETFSectorWeighting;

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
            color: $mode === "light" ? "#4B5563" : "#A1A1AA",
            fontSize: "12px",
            fontWeight: "500",
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
              color: $mode === "light" ? "#374151" : "#E5E7EB",
              fontSize: "12px",
              fontWeight: "600",
              textOutline: "none",
            },
            formatter: function () {
              return this.y.toFixed(2) + "%";
            },
          },
          color: "#6B7280",
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

      return `<span>${etf_detail_holdings_infobox({ name: $displayCompanyName, count: holdingsCount.toString(), holdings: topHoldings })}</span>`;
    } else {
      return `<span>${etf_detail_holdings_no_data({ name: $displayCompanyName })}</span>`;
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
  title={`${$displayCompanyName} (${$etfTicker}) ETF Holdings & Portfolio Analysis - Complete Fund Breakdown`}
  description={`Detailed holdings analysis for ${$displayCompanyName} (${$etfTicker}) ETF featuring {rawData?.length || 0} individual holdings with sector allocation, top holdings weightings, and portfolio diversification metrics. Analyze ETF composition, sector exposure, and asset allocation for informed investment decisions.`}
  keywords={`${$etfTicker} holdings, ${$displayCompanyName} portfolio, ETF composition, ETF sector allocation, top ETF holdings, fund holdings analysis, ETF diversification, asset allocation, sector weightings, portfolio analysis, ETF breakdown`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: `${$displayCompanyName} (${$etfTicker}) Holdings Analysis`,
    description: "Complete breakdown of ETF holdings and sector allocation",
    category: "Exchange-Traded Fund",
    url: `https://stocknear.com/etf/${$etfTicker}/holdings`,
    about: {
      "@type": "InvestmentFund",
      name: `${$displayCompanyName}`,
      tickerSymbol: $etfTicker,
      category: "Exchange-Traded Fund",
      numberOfHoldings: rawData?.length || 0,
      assetClass: data?.getETFProfile?.at(0)?.assetClass || "Equity",
    },
    provider: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Total Holdings",
        value: rawData?.length || 0,
      },
      {
        "@type": "PropertyValue",
        name: "Top 10 Concentration",
        value:
          rawData
            ?.slice(0, 10)
            ?.reduce((acc, item) => acc + (item?.weightPercentage || 0), 0)
            ?.toFixed(2) + "%",
      },
      ...(data?.getETFProfile?.at(0)?.expenseRatio
        ? [
            {
              "@type": "PropertyValue",
              name: "Expense Ratio",
              value: data.getETFProfile.at(0).expenseRatio.toFixed(4) + "%",
            },
          ]
        : []),
    ],
  }}
/>

<section
  class="overflow-hidden h-full min-h-screen mb-20 sm:mb-0 w-full mt-2 sm:mt-0 text-gray-700 dark:text-zinc-200"
>
  <div class="flex justify-center m-auto h-full overflow-hidden w-full">
    <div
      class="relative flex justify-center items-center overflow-hidden w-full"
    >
      <div class="mt-5 sm:mt-0 sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto">
        <div class="flex flex-row items-center md:space-x-4 md:border-0">
          <h1
            class="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
          >
            {etf_detail_holdings_title({ ticker: $etfTicker })}
          </h1>
          {#if data?.getETFHoldings?.lastUpdate}
            <div
              class="ml-3 sm:mt-1 whitespace-nowrap text-sm text-gray-500 dark:text-zinc-400 md:ml-0"
            >
              <span class="inline">{etf_detail_holdings_as_of()} </span>{formattedDate}
            </div>
          {/if}
        </div>
        <div class="mt-5">
          <Infobox text={htmlOutput} />
        </div>

        <div
          class="mt-4 mb-4 grid grid-cols-2 grid-rows-1 divide-gray-200/70 dark:divide-zinc-800/80 rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 md:grid-cols-3 md:grid-rows-1 divide-x"
        >
          <div class="p-4 bp:p-5 sm:p-6">
            <label
              class="mr-1 cursor-pointer flex flex-row items-center text-sm text-gray-500 dark:text-zinc-400"
            >
              {etf_detail_holdings_total()}
            </label>
            <div
              class="mt-1 break-words font-semibold leading-8 text-lg sm:text-xl text-gray-900 dark:text-white"
            >
              {rawData?.length?.toLocaleString("en-US")}
            </div>
          </div>
          <div
            class="p-4 bp:p-5 sm:p-6 border-b border-gray-300 dark:border-zinc-700"
          >
            <label
              class="mr-1 cursor-pointer flex flex-row items-center text-sm text-gray-500 dark:text-zinc-400"
            >
              {etf_detail_holdings_top10()}
            </label>

            <div
              class="mt-1 break-words font-semibold leading-8 text-lg sm:text-xl text-gray-900 dark:text-white"
            >
              {rawData
                ?.slice(0, 10)
                ?.reduce((acc, item) => acc + (item?.weightPercentage || 0), 0)
                ?.toFixed(2) + "%"}
            </div>
          </div>
          <div class="p-4 bp:p-5 sm:p-6 border-t border-b sm:border-none">
            <label
              class="mr-1 cursor-pointer flex flex-row items-center text-sm text-gray-500 dark:text-zinc-400"
            >
              {etf_detail_holdings_asset_class()}
            </label>

            <div
              class="mt-1 break-words font-semibold leading-8 text-lg sm:text-xl text-gray-900 dark:text-white"
            >
              {data?.getETFProfile?.at(0)?.assetClass}
            </div>
          </div>

          <div class="p-4 bp:p-5 sm:p-6 border-t">
            <label
              class="mr-1 cursor-pointer flex flex-row items-center text-sm text-gray-500 dark:text-zinc-400"
            >
              {etf_detail_holdings_assets()}
            </label>

            <div
              class="mt-1 break-words font-semibold leading-8 text-lg sm:text-xl text-gray-900 dark:text-white"
            >
              {abbreviateNumber(data?.getETFProfile?.at(0)?.aum)}
            </div>
          </div>
          <div class="p-4 bp:p-5 sm:p-6">
            <label
              class="mr-1 cursor-pointer flex flex-row items-center text-sm text-gray-500 dark:text-zinc-400"
            >
              {etf_detail_holdings_pe_ratio()}
            </label>

            <div
              class="mt-1 break-words font-semibold leading-8 text-lg sm:text-xl text-gray-900 dark:text-white"
            >
              {data?.getStockQuote?.pe?.toFixed(2) ?? etf_detail_na()}
            </div>
          </div>
          <div
            class="p-4 bp:p-5 sm:p-6 border-t border-gray-300 dark:border-zinc-700"
          >
            <label
              class="mr-1 cursor-pointer flex flex-row items-center text-sm text-gray-500 dark:text-zinc-400"
            >
              {etf_detail_expense_ratio()}
            </label>

            <div
              class="mt-1 break-words font-semibold leading-8 text-lg sm:text-xl text-gray-900 dark:text-white"
            >
              {data?.getETFProfile?.at(0)?.expenseRatio?.toFixed(4) + "%"}
            </div>
          </div>
        </div>

        {#if data?.getETFSectorWeighting?.at(0)?.weightPercentage > 0}
          <div class="">
            <div class="grow mt-5">
              <div class="relative">
                <h2
                  class="mb-2 text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
                >
                  {etf_detail_holdings_sector_allocation()}
                </h2>

                <div
                  class="sm:p-3 border border-gray-300 dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40"
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
            title={etf_detail_holdings_stocks_count({ count: rawData?.length?.toLocaleString("en-US") })}
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

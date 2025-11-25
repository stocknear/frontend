<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import { screenWidth } from "$lib/store";

  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";

  export let data;

  let configPieChart = null;

  const defaultList = [
    { name: "Retail Vol Share vs US Market", rule: "activity" },
    { name: "Retail Vol in $", rule: "traded" },
    { name: "Retail Sentiment", rule: "sentiment" },
  ];

  const specificRows = [
    {
      name: "Retail Vol / US Market",
      rule: "activity",
      type: "percent",
    },
    {
      name: "Retail Vol in $",
      rule: "traded",
      type: "int",
    },
    {
      name: "Retail Sentiment",
      rule: "sentiment",
      type: "sentiment",
    },
  ];

  const excludedRules = new Set([
    "volume",
    "price",
    "changesPercentage",
    "sentiment",
    "traded",
    "activity",
  ]);

  function plotPieChart() {
    // Sector allocation data
    const stockData = data?.getStocks;

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
    // Transform data for Highcharts pie chart, filtering out entries with less than 1% weight
    const pieData = stockData?.slice(0, 12)?.map((item, index) => ({
      name: item.symbol,
      y: item?.activity,
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
        height: $screenWidth < 640 ? 300 : 360,
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
            distance: $screenWidth < 640 ? 10 : 30,
            style: {
              color: $mode === "light" ? "#333" : "#fff",
              fontSize: $screenWidth < 640 ? "12px" : "14px",
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
          name: "",
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

  $: {
    if ($mode) {
      configPieChart = plotPieChart() || null;
    }
  }
</script>

<SEO
  title="Top US Stocks by Retail Trading Tracker Volume"
  description="Track US stocks with the highest retail trading volume. Discover where individual investors are most active and spot potential meme stocks or volatility spikes."
  keywords="retail trading volume, retail investor activity, top retail stocks, meme stocks, high retail volume, individual investor trends"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Top US Stocks by Retail Trading Volume",
    description:
      "US stocks ranked by highest retail trading volume and individual investor activity.",
    url: "https://stocknear.com/list/most-retail-volume",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://stocknear.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Stock Lists",
          item: "https://stocknear.com/list",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Top US Stocks by Retail Volume",
          item: "https://stocknear.com/list/most-retail-volume",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Stocks by Retail Trading Volume",
      description:
        "List of US stocks ranked by retail trading activity and volume.",
      numberOfItems: data?.getStocks?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text="US stocks ranked by Retail Market Share, showing where individual investors are most active. Highlights potential meme stocks or volatility unrelated to fundamentals."
  />

  <div class="">
    <div class="grow mt-5">
      <div class="relative">
        <div
          class=" sm:p-3 shadow border border-gray-300 dark:border-gray-800 rounded"
          use:highcharts={configPieChart}
        ></div>
      </div>
    </div>
  </div>

  <!-- Page wrapper -->
  <Table
    {data}
    rawData={data?.getStocks}
    {excludedRules}
    {defaultList}
    {specificRows}
    title={data?.getStocks?.length?.toLocaleString("en-US") + " " + "Stocks"}
  />
</section>

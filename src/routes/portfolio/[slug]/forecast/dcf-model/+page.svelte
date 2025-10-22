<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import { displayCompanyName, stockTicker, screenWidth } from "$lib/store";
  import { abbreviateNumber } from "$lib/utils";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import Infobox from "$lib/components/Infobox.svelte";

  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";
  export let data;

  $: valuationData = data?.getData || {};

  // Charts config
  let configHistoricalChart = null;
  let configMetricChart = null;

  let userHasModifiedInputs = false;

  // Metric toggle (default Free Cash Flow)
  let selectedMetric:
    | "freeCashFlow"
    | "operatingIncome"
    | "operatingCashFlow"
    | "bookValue" = "freeCashFlow";

  // Select proper history & ratio keys depending on selectedMetric
  $: historyKey =
    selectedMetric === "freeCashFlow"
      ? "freeCashFlowHistory"
      : selectedMetric === "operatingIncome"
        ? "operatingIncomeHistory"
        : selectedMetric === "operatingCashFlow"
          ? "operatingCashFlowHistory"
          : "bookValueHistory";

  $: ratioProp =
    selectedMetric === "freeCashFlow"
      ? "priceToFCFRatio"
      : selectedMetric === "operatingIncome"
        ? "priceToOperatingIncomeRatio"
        : selectedMetric === "operatingCashFlow"
          ? "priceToOCFRatio"
          : "priceToBookRatio";

  $: ratioAvgKey =
    selectedMetric === "freeCashFlow"
      ? "priceRatioAvgFCF"
      : selectedMetric === "operatingIncome"
        ? "priceRatioAvgOI"
        : selectedMetric === "operatingCashFlow"
          ? "priceRatioAvgOCF"
          : "priceRatioAvgBV";

  // Latest TTM metric (sum of last 4 quarters)
  $: latestMetric = (() => {
    const history = valuationData?.[historyKey] || [];
    if (history.length >= 4) {
      const last4 = history.slice(-4);
      return last4?.reduce((sum, q) => {
        return (
          sum +
          (selectedMetric === "freeCashFlow"
            ? q?.freeCashFlow || 0
            : selectedMetric === "operatingIncome"
              ? q?.operatingIncome || 0
              : selectedMetric === "operatingCashFlow"
                ? q?.operatingCashFlow || 0
                : q?.bookValue || 0)
        );
      }, 0);
    } else if (history.length > 0) {
      // fallback for Book Value: take last quarter
      return selectedMetric === "bookValue"
        ? history[history.length - 1]?.bookValue || 0
        : 0;
    }
    return 0;
  })();

  // Latest available date for metric history
  $: latestDate = valuationData?.[historyKey]?.slice(-1)?.[0]?.date || "";

  // Growth / ratio inputs (defaults from API but user may override)
  let metricGrowthRate = 0; // binds to metric-growth input
  let sharesGrowthRate = 0;
  let dividendGrowthRate = 0;
  let priceRatioAvg = 0;

  $: if (valuationData && !userHasModifiedInputs) {
    metricGrowthRate =
      selectedMetric === "freeCashFlow"
        ? valuationData?.freeCashFlowGrowth || 0
        : selectedMetric === "operatingIncome"
          ? valuationData?.operatingIncomeGrowth || 0
          : selectedMetric === "operatingCashFlow"
            ? valuationData?.operatingCashFlowGrowth || 0
            : valuationData?.bookValueGrowth || 0;

    sharesGrowthRate = valuationData?.sharesGrowth || 0;
    dividendGrowthRate = valuationData?.dividendGrowth || 0;
    priceRatioAvg = valuationData?.[ratioAvgKey] || 0;
  }

  // Basic DCF variables
  let dilutedShares = data?.getStockQuote?.sharesOutstanding || 0;
  let forwardDividend = data?.getStockDeck?.annualDividend || 0;
  let discountRate = 10; // %
  let yearsToProject = 5;

  // Calculated values
  let futureMetric;
  let futureShares;
  let futureStockPrice;
  let presentValue;
  let totalDividends;
  let totalFutureValue;
  let discountedValueList: [number, number][] = [];
  let upsideTotalFutureValue = 0;
  let upsidePresentValue = 0;
  let currentPrice = data?.getStockQuote?.price || 0;

  // Metric labels
  $: metricLabel =
    selectedMetric === "freeCashFlow"
      ? "Free Cash Flow"
      : selectedMetric === "operatingIncome"
        ? "Operating Income"
        : selectedMetric === "operatingCashFlow"
          ? "Operating Cash Flow"
          : "Book Value";

  $: metricShortLabel =
    selectedMetric === "freeCashFlow"
      ? "FCF"
      : selectedMetric === "operatingIncome"
        ? "OpInc"
        : selectedMetric === "operatingCashFlow"
          ? "OCF"
          : "BV";

  $: metricTTTLabel = `${metricLabel} TTM`;

  // DCF Calculation
  function calculateDCF() {
    discountedValueList = [];

    const historicalData = data?.getData?.historicalPrice || [];
    if (!historicalData || historicalData.length === 0) {
      // nothing to base DCF date on; clear values gracefully
      futureMetric =
        futureShares =
        futureStockPrice =
        presentValue =
        totalDividends =
        totalFutureValue =
          0;
      return;
    }

    const lastDate = new Date(historicalData[historicalData.length - 1].date);

    // Step 1: Project metric (e.g., TTM FCF or TTM Operating Income) for yearsToProject
    futureMetric =
      latestMetric * Math.pow(1 + metricGrowthRate / 100, yearsToProject);

    // Step 2: Project shares outstanding
    futureShares =
      dilutedShares * Math.pow(1 + sharesGrowthRate / 100, yearsToProject);

    // Step 3: Project future stock price using price ratio
    // protect divide by zero
    const perShareFutureMetric =
      futureShares > 0 ? futureMetric / futureShares : 0;
    futureStockPrice = Math.floor(perShareFutureMetric * (priceRatioAvg || 0));

    // Step 4: Project dividends
    totalDividends =
      forwardDividend *
      yearsToProject *
      Math.pow(1 + dividendGrowthRate / 100, yearsToProject / 2);

    // Step 5: Total future value & discount it back
    totalFutureValue = Number((futureStockPrice + totalDividends)?.toFixed(2));

    // Build discounted values for each projected year (we keep yearsToProject ... 0)
    for (let year = yearsToProject; year >= 0; year--) {
      const discountYears = yearsToProject - year;
      const pv = Math.floor(
        totalFutureValue / Math.pow(1 + discountRate / 100, discountYears || 0),
      );
      // Projected date: add `year` years to lastDate (so highest year is last)
      const projectedDate = new Date(lastDate);
      projectedDate.setFullYear(projectedDate.getFullYear() + year);
      discountedValueList.push([projectedDate.getTime(), pv]);
    }

    // presentValue is the last pushed value (lowest year)
    presentValue =
      discountedValueList[discountedValueList.length - 1]?.[1] ?? 0;

    // Upside calculations
    upsideTotalFutureValue = currentPrice
      ? (((totalFutureValue - currentPrice) / currentPrice) * 100)?.toFixed(2)
      : "0.00";
    upsidePresentValue = currentPrice
      ? (((presentValue - currentPrice) / currentPrice) * 100)?.toFixed(2)
      : "0.00";
  }

  // Plot Historical Price Chart (with ratio series for selected metric)
  function plotHistoricalPriceChart() {
    calculateDCF();

    const historicalData = data?.getData?.historicalPrice || [];
    if (!historicalData || historicalData.length === 0) return null;

    const prices = historicalData.map((item) => [
      new Date(item.date).getTime(),
      item.price,
    ]);

    const priceToMetricRatios = historicalData
      .filter((item) => item[ratioProp] != null)
      .map((item) => [new Date(item.date).getTime(), item[ratioProp]]);

    // create connection line between last real price and first DCF projection
    const connectionLine: [number, number][] = [];
    if (prices.length > 0 && discountedValueList.length > 0) {
      const lastPricePoint = prices[prices.length - 1];
      const firstDCFPoint = discountedValueList[0];
      connectionLine.push([lastPricePoint[0], lastPricePoint[1]]);
      connectionLine.push([firstDCFPoint[0], firstDCFPoint[1]]);
    }

    const options = {
      credits: { enabled: false },
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        type: "spline",
        height: $screenWidth < 640 ? 360 : 450,
        animation: false,
      },
      title: { text: "" },
      xAxis: {
        type: "datetime",
        crosshair: {
          color: $mode === "light" ? "black" : "white",
          width: 1,
          dashStyle: "Solid",
        },
        labels: { style: { color: $mode === "light" ? "#666" : "#aaa" } },
        gridLineColor: $mode === "light" ? "#e0e0e0" : "#2a2a2a",
      },
      yAxis: [
        {
          title: {
            text: "Price",
            style: { color: $mode === "light" ? "#000" : "#fff" },
          },
          gridLineWidth: 1,
          gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
          labels: { style: { color: $mode === "light" ? "#545454" : "white" } },
        },
        {
          title: { text: null },
          labels: { enabled: false },
          gridLineWidth: 0,
          opposite: true,
        },
      ],
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        style: { color: "#fff", fontSize: "14px", padding: "10px" },
        borderRadius: 4,
        formatter: function () {
          let tooltip = `<b>${new Date(this.x)?.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}</b><br/>`;
          this.points.forEach((point) => {
            if (point.series.name === "Stock Price") {
              tooltip += `<span  style="color:${point.color}">●</span> Price: $${point.y.toFixed(2)}<br/>`;
            } else if (point.series.name === "DCF Projection") {
              tooltip += `<span  style="color:${point.color}">●</span> Projected Price: $${point.y.toFixed(2)}<br/>`;
            } else if (point.series.name === `P/${metricShortLabel} Ratio`) {
              tooltip += `<span  style="color:${point.color}">●</span> P/${metricShortLabel} Ratio: ${point.y.toFixed(2)}x`;
            }
          });
          return tooltip;
        },
      },
      plotOptions: {
        series: {
          legendSymbol: "rectangle",
          animation: false,
          states: { hover: { enabled: false } },
        },
        spline: {
          marker: { enabled: false, states: { hover: { enabled: false } } },
        },
      },
      series: [
        {
          name: "Stock Price",
          data: prices,
          color: $mode === "light" ? "#000" : "#fff",
          yAxis: 0,
          animation: false,
          zIndex: 2,
        },
        {
          name: "DCF Projection",
          data: discountedValueList,
          color: "#ef4444",
          yAxis: 0,
          animation: false,
          dashStyle: "ShortDot",
          lineWidth: 2,
          marker: { enabled: true, radius: 4, symbol: "circle" },
          zIndex: 3,
        },
        {
          name: "Connection",
          type: "line",
          data: connectionLine,
          color: "#ffffff",
          yAxis: 0,
          animation: false,
          dashStyle: "Dash",
          lineWidth: 1,
          marker: { enabled: false },
          showInLegend: false,
          enableMouseTracking: false,
          zIndex: 4,
        },
        {
          name: `P/${metricShortLabel} Ratio`,
          data: priceToMetricRatios,
          color: "#2c6288",
          yAxis: 1,
          animation: false,
        },
      ],
      legend: {
        enabled: true,
        align: "center",
        verticalAlign: "top",
        layout: "horizontal",
        itemStyle: { color: $mode === "light" ? "black" : "white" },
      },
    };

    return options;
  }

  // Plot metric historical + projected (replaces FCF-specific chart)
  function plotMetricChart() {
    const history = valuationData?.[historyKey] || [];
    if (!history || history.length < 4) return null;

    // Build TTM historical (sum last 4 quarters)
    const historicalMetric = [];
    for (let i = 3; i < history.length; i++) {
      const ttm = history.slice(i - 3, i + 1)?.reduce((sum, q) => {
        return (
          sum +
          (selectedMetric === "freeCashFlow"
            ? q?.freeCashFlow || 0
            : selectedMetric === "operatingIncome"
              ? q?.operatingIncome || 0
              : selectedMetric === "operatingCashFlow"
                ? q?.operatingCashFlow || 0
                : q?.bookValue || 0)
        );
      }, 0);
      historicalMetric?.push([new Date(history[i].date).getTime(), ttm]);
    }

    // Project metric quarterly
    const projectedMetric = [];
    const lastHistoricalDate = new Date(history[history.length - 1].date);
    const totalQuarters = yearsToProject * 4;

    for (let quarter = 1; quarter <= totalQuarters; quarter++) {
      const projectedDate = new Date(lastHistoricalDate);
      projectedDate.setMonth(projectedDate.getMonth() + quarter * 3);

      const yearsFraction = quarter / 4;
      const projectedValue =
        latestMetric * Math.pow(1 + metricGrowthRate / 100, yearsFraction);
      projectedMetric.push([projectedDate.getTime(), projectedValue]);
    }

    // Connection line between last historical and first projected
    const connectionLine = [];
    if (historicalMetric.length > 0 && projectedMetric.length > 0) {
      const lastHistoricalPoint = historicalMetric[historicalMetric.length - 1];
      const firstProjectedPoint = projectedMetric[0];
      connectionLine.push([lastHistoricalPoint[0], lastHistoricalPoint[1]]);
      connectionLine.push([firstProjectedPoint[0], firstProjectedPoint[1]]);
    }

    const options = {
      credits: { enabled: false },
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        type: "spline",
        height: $screenWidth < 640 ? 360 : 450,
        animation: false,
      },
      title: { text: "" },
      xAxis: {
        type: "datetime",
        crosshair: {
          color: $mode === "light" ? "black" : "white",
          width: 1,
          dashStyle: "Solid",
        },
        labels: { style: { color: $mode === "light" ? "#666" : "#aaa" } },
        gridLineColor: $mode === "light" ? "#e0e0e0" : "#2a2a2a",
      },
      yAxis: {
        title: null,
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
          formatter: function () {
            return abbreviateNumber(this.value);
          },
        },
      },
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        style: { color: "#fff", fontSize: "14px", padding: "10px" },
        borderRadius: 4,
        formatter: function () {
          let tooltip = `<b>${new Date(this.x)?.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}</b><br/>`;
          this.points.forEach((point) => {
            if (point.series.name === `Historical ${metricLabel}`) {
              tooltip += `<span style="color:${point.color}">●</span> ${metricLabel} (ttm): ${abbreviateNumber(point.y)}<br/>`;
            } else if (point.series.name === `Projected ${metricLabel}`) {
              tooltip += `<span style="color:${point.color}">●</span> ${metricLabel} (ttm): ${abbreviateNumber(point.y)}<br/>`;
            }
          });
          return tooltip;
        },
      },
      plotOptions: {
        series: {
          legendSymbol: "rectangle",
          animation: false,
          states: { hover: { enabled: false } },
        },
        spline: {
          marker: { enabled: false, states: { hover: { enabled: false } } },
        },
      },
      series: [
        {
          name: `Historical ${metricLabel}`,
          data: historicalMetric,
          color: $mode === "light" ? "#000" : "#fff",
          animation: false,
          zIndex: 2,
        },
        {
          name: `Projected ${metricLabel}`,
          data: projectedMetric,
          color: "#ef4444",
          animation: false,
          dashStyle: "ShortDot",
          lineWidth: 2,
          marker: { enabled: true, radius: 4, symbol: "circle" },
          zIndex: 3,
        },
        {
          name: "Connection",
          type: "line",
          data: connectionLine,
          color: "#ffffff",
          animation: false,
          dashStyle: "Dash",
          lineWidth: 1,
          marker: { enabled: false },
          showInLegend: false,
          enableMouseTracking: false,
          zIndex: 4,
        },
      ],
      legend: {
        enabled: true,
        align: "center",
        verticalAlign: "top",
        layout: "horizontal",
        itemStyle: { color: $mode === "light" ? "black" : "white" },
      },
    };

    return options;
  }

  // Recompute charts when data or settings change
  $: {
    if (Object?.keys(valuationData || {})?.length > 0) {
      calculateDCF();
    }
  }

  $: {
    if (
      $mode &&
      typeof window !== "undefined" &&
      Object?.keys(valuationData || {})?.length > 0 &&
      yearsToProject &&
      discountRate &&
      selectedMetric
    ) {
      configHistoricalChart = plotHistoricalPriceChart() || null;
      configMetricChart = plotMetricChart() || null;
    }
  }

  // When metric selection changes, reset userHasModifiedInputs so defaults refresh
  function onMetricChange() {
    userHasModifiedInputs = false;
  }
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) DCF Valuation & Intrinsic Value`}
  description={`Discounted Cash Flow (DCF) valuation model for ${$displayCompanyName} (${$stockTicker}). See intrinsic value estimates and projections.`}
/>

<section class="w-full overflow-hidden min-h-screen">
  <div class="w-full overflow-hidden">
    <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full mt-2 sm:mt-0">
      <div
        class="relative flex flex-col lg:flex-row justify-center items-start overflow-hidden w-full"
      >
        {#if Object?.keys(valuationData || {})?.length > 0}
          <main class="w-full lg:w-3/4 lg:pr-5">
            <div class="mb-3">
              <h1 class="mb-1 text-2xl sm:text-3xl font-bold">
                DCF Calculator
              </h1>
            </div>

            <div
              class="mt-5 mb-6 grid grid-cols-2 gap-3 xs:mt-6 bp:mt-7 sm:grid-cols-4 sm:gap-6"
            >
              <div>
                Current Price
                <div
                  class="mt-0.5 text-lg bp:text-xl sm:mt-1.5 sm:text-2xl font-bold flex flex-row items-center"
                >
                  {currentPrice}
                </div>
              </div>

              <div>
                Dividends Paid
                <div
                  class="mt-0.5 text-lg font-bold bp:text-xl sm:mt-1.5 sm:text-2xl"
                >
                  {totalDividends ? totalDividends?.toFixed(2) : "n/a"}
                </div>
              </div>

              <div>
                DCF Fair Value (today)
                <div
                  class="mt-0.5 text-lg bp:text-xl sm:mt-1.5 sm:text-2xl font-bold flex flex-row items-center"
                >
                  {presentValue && presentValue > 0 ? presentValue : "n/a"}
                  <span
                    class="ml-2 px-2 py-1 rounded-md font-medium text-sm {upsidePresentValue >=
                      0 && presentValue > 0
                      ? "before:content-['+'] bg-green-200 text-green-800 dark:bg-green-900/20 dark:text-[#00FC50]"
                      : upsidePresentValue < 0 && presentValue > 0
                        ? 'bg-red-200 text-red-800 dark:bg-red-900/20 dark:text-[#FF2F1F]'
                        : 'hidden'}"
                  >
                    {upsidePresentValue}%
                  </span>
                </div>
              </div>

              <div>
                Projected Value in {yearsToProject} years
                <div
                  class="mt-0.5 text-lg bp:text-xl sm:mt-1.5 sm:text-2xl font-bold flex flex-row items-center"
                >
                  {totalFutureValue && totalFutureValue > 0
                    ? totalFutureValue
                    : "n/a"}
                  <span
                    class="ml-2 px-2 py-1 rounded-md font-medium text-sm {upsideTotalFutureValue >=
                      0 && totalFutureValue > 0
                      ? "before:content-['+'] bg-green-200 text-green-800 dark:bg-green-900/20 dark:text-[#00FC50]"
                      : upsideTotalFutureValue < 0 && totalFutureValue > 0
                        ? 'bg-red-200 text-red-800 dark:bg-red-900/20 dark:text-[#FF2F1F]'
                        : 'hidden'}"
                  >
                    {upsideTotalFutureValue}%
                  </span>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between mb-4">
              <label
                for="showSteps"
                class="cursor-pointer text-sm px-3 py-1 rounded-md border text-white border border-gray-300 dark:border-gray-600 bg-black sm:hover:bg-muted dark:bg-primary dark:sm:hover:bg-secondary"
              >
                Show Calculation Steps
              </label>
            </div>

            {#if data?.getData?.historicalPrice?.length > 0}
              <div class="mb-8">
                <div class="grow">
                  <div class="relative">
                    <div
                      class="sm:p-3 shadow-xs border border-gray-300 dark:border-gray-800 rounded"
                      use:highcharts={configHistoricalChart}
                    ></div>
                  </div>
                </div>
              </div>
            {/if}

            {#if valuationData?.[historyKey]?.length > 0}
              <h2 class="text-xl sm:text-2xl font-bold text-start mr-auto mb-4">
                Historical and Projected {metricLabel}
              </h2>

              <div class="mb-8">
                <div class="grow">
                  <div class="relative">
                    <div
                      class="sm:p-3 shadow-xs border border-gray-300 dark:border-gray-800 rounded"
                      use:highcharts={configMetricChart}
                    ></div>
                  </div>
                </div>
              </div>
            {/if}
          </main>

          <aside class="inline-block relative w-full lg:w-1/4 mt-3">
            <div class="bg-gray-200 dark:bg-[#1F2937] p-6 rounded shadow">
              <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold">DCF Inputs</h2>
              </div>

              <div class="space-y-6">
                <div>
                  <label
                    for="metric"
                    class="flex items-center text-sm font-medium mb-2"
                  >
                    Metric
                    <InfoModal
                      id="metric"
                      content="This is the metric you will use for your valuation projections. The appropriate metric depends on the industry. For most companies, free cash flow or operating cash flow is commonly used, as it reflects the cash available to shareholders. For banks and other financial institutions, earnings or book value are often more meaningful, because cash flows do not accurately capture their performance. Choose the metric that best represents how the company generates value."
                    />
                  </label>
                  <select
                    id="metric"
                    bind:value={selectedMetric}
                    on:change={() => onMetricChange()}
                    class="bg-white dark:bg-[#374151] border border-gray-300 shadow dark:border-gray-600 text-smrounded focus:outline-none block w-full pl-3 py-1 cursor-pointer"
                  >
                    <option value="freeCashFlow">Free Cash Flow</option>
                    <option value="operatingIncome">Operating Income</option>
                    <option value="operatingCashFlow"
                      >Operating Cash Flow</option
                    >
                    <option value="bookValue">Book Value</option>
                  </select>
                </div>

                <div>
                  <label
                    for="years"
                    class="flex items-center text-sm font-medium mb-2"
                  >
                    Number of Years To Project
                    <InfoModal
                      id="years"
                      content="The number of years to project the company's future performance."
                    />
                  </label>
                  <select
                    id="years"
                    bind:value={yearsToProject}
                    on:change={() => (userHasModifiedInputs = true)}
                    class="bg-white dark:bg-[#374151] border border-gray-300 shadow dark:border-gray-600 text-sm rounded focus:outline-none block w-full pl-3 py-1 cursor-pointer"
                  >
                    <option value={3}>3</option>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                  </select>
                </div>

                <div>
                  <label
                    for="metric-growth"
                    class="flex items-center text-sm font-medium mb-2"
                  >
                    {metricLabel} Growth Rate
                    <InfoModal
                      id="metricGrowthRate"
                      content="Expected annual growth rate for the selected metric."
                    />
                  </label>
                  <div class="relative">
                    <span
                      class="absolute inset-y-0 left-0 flex items-center pl-3"
                      >%</span
                    >
                    <input
                      type="number"
                      step="0.01"
                      id="metric-growth"
                      bind:value={metricGrowthRate}
                      on:input={() => (userHasModifiedInputs = true)}
                      class="bg-white dark:bg-[#374151] border border-gray-300 shadow dark:border-gray-600 text-smrounded focus:outline-none block w-full pl-7 py-1"
                    />
                  </div>
                  <p class="mt-2 text-xs">
                    5-year historical {metricLabel} growth: {selectedMetric ===
                    "freeCashFlow"
                      ? valuationData?.freeCashFlowGrowth || 0
                      : valuationData?.operatingIncomeGrowth || 0}%
                  </p>
                </div>

                <div>
                  <label
                    for="shares-growth"
                    class="flex items-center text-sm font-medium mb-2"
                  >
                    Diluted Shares Growth Rate
                    <InfoModal
                      id="dilutedSharedsGrowthRate"
                      content="Expected annual change in diluted shares outstanding."
                    />
                  </label>
                  <div class="relative">
                    <span
                      class="absolute inset-y-0 left-0 flex items-center pl-3"
                      >%</span
                    >
                    <input
                      type="number"
                      step="0.01"
                      id="shares-growth"
                      bind:value={sharesGrowthRate}
                      on:input={() => (userHasModifiedInputs = true)}
                      class="bg-white dark:bg-[#374151] border border-gray-300 shadow dark:border-gray-600 text-sm rounded focus:outline-none block w-full pl-7 py-1"
                    />
                  </div>
                  <p class="mt-2 text-xs">
                    5-year historical shares growth: {valuationData?.sharesGrowth ||
                      0}%
                  </p>
                </div>

                <div>
                  <label
                    for="dividend-growth"
                    class="flex items-center text-sm font-medium mb-2"
                  >
                    Dividend Growth Rate
                    <InfoModal
                      id="dividendGrowthRate"
                      content="Expected annual growth rate for dividends per share."
                    />
                  </label>
                  <div class="relative">
                    <span
                      class="absolute inset-y-0 left-0 flex items-center pl-3"
                      >%</span
                    >
                    <input
                      type="number"
                      step="0.01"
                      id="dividend-growth"
                      bind:value={dividendGrowthRate}
                      on:input={() => (userHasModifiedInputs = true)}
                      class="bg-white dark:bg-[#374151] border border-gray-300 shadow dark:border-gray-600 text-smrounded focus:outline-none block w-full pl-7 py-1"
                    />
                  </div>
                </div>

                <div>
                  <label
                    for="price-ratio"
                    class="flex items-center text-sm font-medium mb-2"
                  >
                    Price Ratio
                    <InfoModal
                      id="priceRatio"
                      content="Expected price ratio to apply to the per-share metric."
                    />
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="price-ratio"
                    bind:value={priceRatioAvg}
                    on:input={() => (userHasModifiedInputs = true)}
                    class="bg-white dark:bg-[#374151] border border-gray-300 shadow dark:border-gray-600 text-sm rounded focus:outline-none block w-full pl-3 py-1"
                  />
                  <p class="mt-2 text-xs">
                    5-year average P/{metricShortLabel}: {valuationData?.[
                      ratioAvgKey
                    ] ?? 0}
                  </p>
                </div>

                <div>
                  <label
                    for="discount-rate"
                    class="flex items-center text-sm font-medium mb-2"
                  >
                    Discount Rate
                    <InfoModal
                      id="discountedRate"
                      content="Your target annual rate of return from this investment."
                    />
                  </label>
                  <div class="relative">
                    <span
                      class="absolute inset-y-0 left-0 flex items-center pl-3"
                      >%</span
                    >
                    <input
                      type="number"
                      step="0.01"
                      id="discount-rate"
                      bind:value={discountRate}
                      on:input={() => (userHasModifiedInputs = true)}
                      class="bg-white dark:bg-[#374151] border border-gray-300 shadow dark:border-gray-600 text-smrounded focus:outline-none block w-full pl-7 py-1"
                    />
                  </div>
                  <p class="mt-2 text-xs">
                    A sane starting discount rate is 10%.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        {:else}
          <div class="w-full">
            <Infobox text="No valuation data available." />
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>

<input type="checkbox" id="showSteps" class="modal-toggle" />

<dialog id="showSteps" class="modal p-3 sm:p-0 text-muted dark:text-white">
  <label for="showSteps" class="cursor-pointer modal-backdrop bg-[#000]/30"
  ></label>

  <div
    class="modal-box rounded border border-gray-300 dark:border-gray-600 w-full bg-white dark:bg-secondary flex flex-col items-center"
  >
    <div class="mx-auto h-1.5 w-20 shrink-0 rounded-full" />
    <div class="mb-5 text-center overflow-y-auto max-h-[80vh]">
      <h3 class="font-bold text-xl sm:text-2xl mb-5 text-start">
        DCF Calculation Breakdown
      </h3>
      <div class="space-y-6 text-start">
        <div>
          <h3 class="font-semibold mb-2">Step 1: Project {metricLabel}</h3>
          <p class="text-sm">
            The most recent {metricLabel} (TTM) value is
            <span class="font-semibold">{abbreviateNumber(latestMetric)}</span>
            as of {new Date(latestDate)?.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}.
          </p>
          <p class="text-sm">
            We will project this out {yearsToProject} years with a yearly growth
            rate of
            <span class="font-semibold">{metricGrowthRate}%</span>.
          </p>
          <p class="text-sm">
            Starting with {abbreviateNumber(latestMetric)} and growing at {metricGrowthRate}%
            for {yearsToProject} years, we estimate {metricLabel} will be
            <span class="font-semibold"
              >{abbreviateNumber(futureMetric ?? 0)}</span
            >.
          </p>
        </div>

        <div>
          <h3 class="font-semibold mb-2">
            Step 2: Project Future Diluted Shares Outstanding
          </h3>
          <p class="text-sm">
            The most recent Diluted Shares Outstanding value is <span
              class="font-semibold">{abbreviateNumber(dilutedShares)}</span
            >.
          </p>
          <p class="text-sm">
            We will project this out {yearsToProject} year(s) with a growth rate
            of <span class="font-semibold">{sharesGrowthRate}%</span>.
          </p>
          <p class="text-sm">
            Estimated Diluted Shares Outstanding: <span class="font-semibold"
              >{abbreviateNumber(futureShares ?? 0)}</span
            >.
          </p>
        </div>

        <div>
          <h3 class="font-semibold mb-2">Step 3: Project Future Stock Price</h3>
          <p class="text-sm mb-3">
            Using a price ratio of <span class="font-semibold"
              >{priceRatioAvg}</span
            >, formula: (Future {metricLabel} ÷ Future Diluted Shares Outstanding)
            × Price Ratio
          </p>
          <p class="text-sm">
            ({abbreviateNumber(futureMetric ?? 0)} ÷ {abbreviateNumber(
              futureShares ?? 1,
            )}) × {priceRatioAvg} =
            <span class="font-semibold"
              >{futureStockPrice && futureStockPrice > 0
                ? "$" + futureStockPrice
                : "n/a"}</span
            >
          </p>
        </div>

        <div>
          <h3 class="font-semibold mb-2">
            Step 4: Project Future Dividends Paid
          </h3>
          <p class="text-sm">
            Forward dividend per share: <span class="font-semibold"
              >${forwardDividend}</span
            >.
          </p>
          <p class="text-sm">
            Projected over {yearsToProject} years with a growth rate of
            <span class="font-semibold"
              >{dividendGrowthRate
                ? dividendGrowthRate?.toFixed(2) + "%"
                : "n/a"}</span
            >, dividends add to total shareholder return.
          </p>
          <p class="text-sm">
            Expected dividends in {yearsToProject} years:
            <span class="font-semibold">${totalDividends}</span>.
          </p>
        </div>

        <div>
          <h3 class="font-semibold mb-2">
            Step 5: Discount the Projected Stock Price
          </h3>
          <p class="text-sm">
            Projected stock price: <span class="font-semibold"
              >{futureStockPrice && futureStockPrice > 0
                ? "$" + futureStockPrice
                : "n/a"}</span
            >.
          </p>
          <p class="text-sm">
            Including dividends, total future value: <span class="font-semibold"
              >{totalFutureValue && totalFutureValue > 0
                ? "$" + totalFutureValue
                : "n/a"}</span
            >.
          </p>
          <p class="text-sm">
            Discounted at <span class="font-semibold">{discountRate}%</span> per
            year over {yearsToProject} years → Fair Value:
            <strong
              >{presentValue && presentValue > 0
                ? "$" + presentValue
                : "n/a"}</strong
            >.
          </p>
        </div>
      </div>
    </div>

    <div class="border-t border-gray-300 dark:border-gray-600 mt-2 w-full">
      <label
        for="showSteps"
        class="mt-4 font-semibold text-xl m-auto flex justify-center cursor-pointer"
        >Close</label
      >
    </div>
  </div>
</dialog>

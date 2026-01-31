<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import { displayCompanyName, stockTicker, screenWidth } from "$lib/store";
  import { abbreviateNumber } from "$lib/utils";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import {
    stock_detail_forecast_dcf_avg_ratio,
    stock_detail_forecast_dcf_book_value,
    stock_detail_forecast_dcf_breakdown_title,
    stock_detail_forecast_dcf_close,
    stock_detail_forecast_dcf_current_price,
    stock_detail_forecast_dcf_discount_hint,
    stock_detail_forecast_dcf_discount_info,
    stock_detail_forecast_dcf_discount_rate,
    stock_detail_forecast_dcf_dividend_growth,
    stock_detail_forecast_dcf_dividend_info,
    stock_detail_forecast_dcf_dividends_paid,
    stock_detail_forecast_dcf_fair_value,
    stock_detail_forecast_dcf_fcf,
    stock_detail_forecast_dcf_growth_info,
    stock_detail_forecast_dcf_growth_rate,
    stock_detail_forecast_dcf_historical_growth,
    stock_detail_forecast_dcf_historical_projected,
    stock_detail_forecast_dcf_historical_shares,
    stock_detail_forecast_dcf_inputs,
    stock_detail_forecast_dcf_metric,
    stock_detail_forecast_dcf_metric_info,
    stock_detail_forecast_dcf_no_data,
    stock_detail_forecast_dcf_ocf,
    stock_detail_forecast_dcf_operating_income,
    stock_detail_forecast_dcf_price_ratio,
    stock_detail_forecast_dcf_price_ratio_info,
    stock_detail_forecast_dcf_projected_value,
    stock_detail_forecast_dcf_seo_description,
    stock_detail_forecast_dcf_seo_title,
    stock_detail_forecast_dcf_shares_growth,
    stock_detail_forecast_dcf_shares_info,
    stock_detail_forecast_dcf_show_steps,
    stock_detail_forecast_dcf_step1_project,
    stock_detail_forecast_dcf_step1_recent,
    stock_detail_forecast_dcf_step1_result,
    stock_detail_forecast_dcf_step1_title,
    stock_detail_forecast_dcf_step2_project,
    stock_detail_forecast_dcf_step2_recent,
    stock_detail_forecast_dcf_step2_result,
    stock_detail_forecast_dcf_step2_title,
    stock_detail_forecast_dcf_step3_formula,
    stock_detail_forecast_dcf_step3_title,
    stock_detail_forecast_dcf_step4_forward,
    stock_detail_forecast_dcf_step4_project,
    stock_detail_forecast_dcf_step4_result,
    stock_detail_forecast_dcf_step4_title,
    stock_detail_forecast_dcf_step5_projected,
    stock_detail_forecast_dcf_step5_result,
    stock_detail_forecast_dcf_step5_title,
    stock_detail_forecast_dcf_step5_total,
    stock_detail_forecast_dcf_title,
    stock_detail_forecast_dcf_years_info,
    stock_detail_forecast_dcf_years_to_project,
    stock_detail_forecast_dcf_margin_of_safety,
    stock_detail_forecast_dcf_margin_of_safety_info,
    stock_detail_forecast_dcf_buy_below,
    stock_detail_forecast_dcf_sensitivity,
    stock_detail_forecast_dcf_sensitivity_info,
    stock_detail_forecast_dcf_implied_growth,
    stock_detail_forecast_dcf_implied_growth_info,
    stock_detail_forecast_dcf_market_expects,
    stock_detail_forecast_dcf_valuation_status,
    stock_detail_forecast_dcf_undervalued,
    stock_detail_forecast_dcf_overvalued,
    stock_detail_forecast_dcf_fair,
    stock_detail_forecast_dcf_growth_warning,
    stock_detail_forecast_dcf_negative_warning,
  } from "$lib/paraglide/messages";

  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  export let data;

  $: valuationData = data?.getData || {};

  // Charts config
  let configHistoricalChart = null;
  let configMetricChart = null;

  let userHasModifiedInputs = false;

  // Sensitivity analysis grid values
  const sensitivityGrowthRates = [-5, 0, 5, 10, 15, 20];
  const sensitivityDiscountRates = [8, 10, 12, 14];
  let sensitivityMatrix: number[][] = [];

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

  // Margin of Safety calculations
  let marginOfSafety = 0;
  let buyPriceConservative = 0; // 30% margin
  let buyPriceModerate = 0; // 20% margin
  let buyPriceAggressive = 0; // 10% margin

  // Implied growth rate (reverse DCF)
  let impliedGrowthRate = 0;

  // Valuation status
  $: valuationStatus = (() => {
    if (!presentValue || presentValue <= 0 || !currentPrice) return "neutral";
    const diff = ((presentValue - currentPrice) / currentPrice) * 100;
    if (diff > 15) return "undervalued";
    if (diff < -15) return "overvalued";
    return "fair";
  })();

  // Warning flags for unusual inputs
  $: showGrowthWarning = metricGrowthRate > 20;
  $: showNegativeWarning = latestMetric < 0;

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

    // Margin of Safety calculations
    if (presentValue && presentValue > 0) {
      marginOfSafety = currentPrice
        ? Math.round(((presentValue - currentPrice) / presentValue) * 100)
        : 0;
      buyPriceConservative = Math.round(presentValue * 0.7); // 30% margin
      buyPriceModerate = Math.round(presentValue * 0.8); // 20% margin
      buyPriceAggressive = Math.round(presentValue * 0.9); // 10% margin
    }

    // Calculate implied growth rate (reverse DCF)
    impliedGrowthRate = calculateImpliedGrowthRate();

    // Calculate sensitivity matrix
    calculateSensitivityMatrix();
  }

  // Reverse DCF: Find growth rate that produces current price
  function calculateImpliedGrowthRate(): number {
    if (!currentPrice || !latestMetric || !dilutedShares || latestMetric <= 0) {
      return 0;
    }

    let low = -30;
    let high = 50;
    const tolerance = 0.1;
    const maxIterations = 50;

    for (let i = 0; i < maxIterations; i++) {
      const mid = (low + high) / 2;
      const impliedValue = calculateFairValueWithGrowth(mid);

      if (Math.abs(impliedValue - currentPrice) < tolerance) {
        return Math.round(mid * 100) / 100;
      }

      if (impliedValue > currentPrice) {
        high = mid;
      } else {
        low = mid;
      }
    }

    return Math.round(((low + high) / 2) * 100) / 100;
  }

  // Helper: Calculate fair value with a specific growth rate
  function calculateFairValueWithGrowth(growth: number): number {
    const projectedMetric =
      latestMetric * Math.pow(1 + growth / 100, yearsToProject);
    const projectedShares =
      dilutedShares * Math.pow(1 + sharesGrowthRate / 100, yearsToProject);
    const perShareMetric =
      projectedShares > 0 ? projectedMetric / projectedShares : 0;
    const projectedPrice = perShareMetric * (priceRatioAvg || 0);
    const projectedDividends =
      forwardDividend *
      yearsToProject *
      Math.pow(1 + dividendGrowthRate / 100, yearsToProject / 2);
    const futureValue = projectedPrice + projectedDividends;
    return futureValue / Math.pow(1 + discountRate / 100, yearsToProject);
  }

  // Calculate sensitivity analysis matrix
  function calculateSensitivityMatrix() {
    sensitivityMatrix = [];
    for (const growth of sensitivityGrowthRates) {
      const row: number[] = [];
      for (const discount of sensitivityDiscountRates) {
        const projectedMetric =
          latestMetric * Math.pow(1 + growth / 100, yearsToProject);
        const projectedShares =
          dilutedShares * Math.pow(1 + sharesGrowthRate / 100, yearsToProject);
        const perShareMetric =
          projectedShares > 0 ? projectedMetric / projectedShares : 0;
        const projectedPrice = perShareMetric * (priceRatioAvg || 0);
        const projectedDividends =
          forwardDividend *
          yearsToProject *
          Math.pow(1 + dividendGrowthRate / 100, yearsToProject / 2);
        const futureValue = projectedPrice + projectedDividends;
        const fairValue = Math.round(
          futureValue / Math.pow(1 + discount / 100, yearsToProject),
        );
        row.push(fairValue > 0 ? fairValue : 0);
      }
      sensitivityMatrix.push(row);
    }
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
        backgroundColor: "rgba(0, 0, 0, 1)",
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
        backgroundColor: "rgba(0, 0, 0, 1)",
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
  // Include all input variables in the reactive dependency tracking
  $: {
    // Reference all input variables to make this block reactive to their changes
    metricGrowthRate;
    sharesGrowthRate;
    dividendGrowthRate;
    priceRatioAvg;
    dilutedShares;
    forwardDividend;
    discountRate;
    yearsToProject;
    latestMetric;

    if (Object?.keys(valuationData || {})?.length > 0) {
      calculateDCF();
    }
  }

  $: {
    // Reference all input variables to make this block reactive to their changes
    metricGrowthRate;
    sharesGrowthRate;
    dividendGrowthRate;
    priceRatioAvg;
    dilutedShares;
    forwardDividend;

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
  title={stock_detail_forecast_dcf_seo_title({
    company: $displayCompanyName,
    ticker: $stockTicker,
  })}
  description={stock_detail_forecast_dcf_seo_description({
    company: $displayCompanyName,
    ticker: $stockTicker,
  })}
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
                {stock_detail_forecast_dcf_title()}
              </h1>
            </div>

            <!-- Warning Banners -->
            {#if showNegativeWarning}
              <div
                class="mt-4 flex items-start gap-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/30 px-3 py-2.5 text-sm text-amber-800 dark:text-amber-200"
              >
                <div
                  class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900"
                >
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <span>{stock_detail_forecast_dcf_negative_warning()}</span>
              </div>
            {/if}

            {#if showGrowthWarning}
              <div
                class="mt-4 flex items-start gap-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/30 px-3 py-2.5 text-sm text-amber-800 dark:text-amber-200"
              >
                <div
                  class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900"
                >
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <span>{stock_detail_forecast_dcf_growth_warning()}</span>
              </div>
            {/if}

            <div
              class="mt-5 mb-6 grid grid-cols-2 gap-3 xs:mt-6 bp:mt-7 sm:grid-cols-4 sm:gap-6"
            >
              <div>
                {stock_detail_forecast_dcf_current_price()}
                <div
                  class="mt-0.5 text-lg bp:text-xl sm:mt-1.5 sm:text-2xl font-bold flex flex-row items-center"
                >
                  ${currentPrice}
                </div>
              </div>

              <div>
                {stock_detail_forecast_dcf_fair_value()}
                <div
                  class="mt-0.5 text-lg bp:text-xl sm:mt-1.5 sm:text-2xl font-bold flex flex-row items-center"
                >
                  {presentValue && presentValue > 0
                    ? "$" + presentValue
                    : "n/a"}
                  <span
                    class="ml-2 px-2 py-1 rounded-full font-medium text-sm {upsidePresentValue >=
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
                <span class="flex items-center">
                  {stock_detail_forecast_dcf_margin_of_safety()}
                  <InfoModal
                    id="marginOfSafety"
                    content={stock_detail_forecast_dcf_margin_of_safety_info()}
                  />
                </span>
                <div
                  class="mt-0.5 text-lg bp:text-xl sm:mt-1.5 sm:text-2xl font-bold flex flex-row items-center {marginOfSafety >
                  0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : marginOfSafety < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : ''}"
                >
                  {presentValue && presentValue > 0
                    ? (marginOfSafety > 0 ? "+" : "") + marginOfSafety + "%"
                    : "n/a"}
                </div>
              </div>

              <div>
                <span class="flex items-center">
                  {stock_detail_forecast_dcf_implied_growth()}
                  <InfoModal
                    id="impliedGrowth"
                    content={stock_detail_forecast_dcf_implied_growth_info()}
                  />
                </span>
                <div
                  class="mt-0.5 text-lg bp:text-xl sm:mt-1.5 sm:text-2xl font-bold flex flex-row items-center"
                >
                  {impliedGrowthRate
                    ? (impliedGrowthRate > 0 ? "+" : "") +
                      impliedGrowthRate +
                      "%"
                    : "n/a"}
                </div>
                <p class="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                  {stock_detail_forecast_dcf_market_expects()}
                </p>
              </div>
            </div>

            <!-- Valuation Status Banner -->
            {#if presentValue && presentValue > 0}
              <div
                class="mb-6 p-4 rounded-xl border {valuationStatus ===
                'undervalued'
                  ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/30'
                  : valuationStatus === 'overvalued'
                    ? 'border-rose-300 dark:border-rose-700 bg-rose-50/80 dark:bg-rose-950/30'
                    : 'border-gray-300 dark:border-zinc-700 bg-gray-50/80 dark:bg-zinc-950/30'}"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <span
                      class="text-sm font-medium text-gray-600 dark:text-zinc-400"
                      >{stock_detail_forecast_dcf_valuation_status()}</span
                    >
                    <div
                      class="text-lg font-bold {valuationStatus ===
                      'undervalued'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : valuationStatus === 'overvalued'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-gray-700 dark:text-zinc-200'}"
                    >
                      {valuationStatus === "undervalued"
                        ? stock_detail_forecast_dcf_undervalued()
                        : valuationStatus === "overvalued"
                          ? stock_detail_forecast_dcf_overvalued()
                          : stock_detail_forecast_dcf_fair()}
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="text-sm text-gray-600 dark:text-zinc-400"
                      >{stock_detail_forecast_dcf_buy_below()}</span
                    >
                    <div class="flex gap-3 mt-1">
                      <div class="text-center">
                        <div class="text-xs text-gray-500 dark:text-zinc-500">
                          30%
                        </div>
                        <div class="font-semibold text-sm">
                          ${buyPriceConservative}
                        </div>
                      </div>
                      <div class="text-center">
                        <div class="text-xs text-gray-500 dark:text-zinc-500">
                          20%
                        </div>
                        <div class="font-semibold text-sm">
                          ${buyPriceModerate}
                        </div>
                      </div>
                      <div class="text-center">
                        <div class="text-xs text-gray-500 dark:text-zinc-500">
                          10%
                        </div>
                        <div class="font-semibold text-sm">
                          ${buyPriceAggressive}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            {/if}

            <div class="flex items-center justify-between mb-4">
              <label
                for="showSteps"
                class="inline-flex items-center gap-2 cursor-pointer text-sm px-3 py-1.5 rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 transition hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50"
              >
                {stock_detail_forecast_dcf_show_steps()}
              </label>
            </div>

            {#if data?.getData?.historicalPrice?.length > 0}
              <div class="mb-8">
                <div class="grow">
                  <div class="relative">
                    <div
                      class="sm:p-3 shadow-none border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40"
                      use:highcharts={configHistoricalChart}
                    ></div>
                  </div>
                </div>
              </div>
            {/if}

            {#if valuationData?.[historyKey]?.length > 0}
              <h2 class="text-xl sm:text-2xl font-bold text-start mr-auto mb-4">
                {stock_detail_forecast_dcf_historical_projected({
                  metric: metricLabel,
                })}
              </h2>

              <div class="mb-8">
                <div class="grow">
                  <div class="relative">
                    <div
                      class="sm:p-3 shadow-none border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40"
                      use:highcharts={configMetricChart}
                    ></div>
                  </div>
                </div>
              </div>
            {/if}

            <!-- Sensitivity Analysis Table -->
            {#if sensitivityMatrix.length > 0 && presentValue > 0}
              <div class="mb-8">
                <h2
                  class="text-xl sm:text-2xl font-bold text-start mr-auto mb-2 flex items-center"
                >
                  {stock_detail_forecast_dcf_sensitivity()}
                  <div class="font-normal">
                    <InfoModal
                      id="sensitivity"
                      content={stock_detail_forecast_dcf_sensitivity_info()}
                    />
                  </div>
                </h2>
                <p class="text-sm text-gray-500 dark:text-zinc-400 mb-4">
                  Fair values at different growth and discount rate combinations
                </p>

                <div class="overflow-x-auto">
                  <div
                    class="border border-gray-300 dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 overflow-hidden"
                  >
                    <table class="w-full text-sm">
                      <thead>
                        <tr
                          class="border-b border-gray-300 dark:border-zinc-700"
                        >
                          <th
                            class="p-3 text-left font-semibold text-gray-600 dark:text-zinc-400 bg-gray-50/50 dark:bg-zinc-900/50"
                          >
                            Growth / Discount
                          </th>
                          {#each sensitivityDiscountRates as discount}
                            <th
                              class="p-3 text-center font-semibold text-gray-600 dark:text-zinc-400 bg-gray-50/50 dark:bg-zinc-900/50 {discount ===
                              discountRate
                                ? 'bg-violet-100 dark:bg-violet-900/30'
                                : ''}"
                            >
                              {discount}%
                            </th>
                          {/each}
                        </tr>
                      </thead>
                      <tbody>
                        {#each sensitivityMatrix as row, rowIndex}
                          <tr
                            class="border-b border-gray-300 dark:border-zinc-700 last:border-b-0 transition-colors hover:bg-gray-50/60 dark:hover:bg-zinc-900/50"
                          >
                            <td
                              class="p-3 font-medium text-gray-700 dark:text-zinc-300 {sensitivityGrowthRates[
                                rowIndex
                              ] === Math.round(metricGrowthRate)
                                ? 'bg-violet-100 dark:bg-violet-900/30'
                                : ''}"
                            >
                              {sensitivityGrowthRates[rowIndex] > 0
                                ? "+"
                                : ""}{sensitivityGrowthRates[rowIndex]}%
                            </td>
                            {#each row as value, colIndex}
                              {@const isCurrentCell =
                                sensitivityGrowthRates[rowIndex] ===
                                  Math.round(metricGrowthRate) &&
                                sensitivityDiscountRates[colIndex] ===
                                  discountRate}
                              {@const isUndervalued =
                                value > currentPrice * 1.1}
                              {@const isOvervalued = value < currentPrice * 0.9}
                              <td
                                class="p-3 text-center font-medium transition-colors
                                {isCurrentCell
                                  ? 'bg-violet-200 dark:bg-violet-800/50 ring-2 ring-violet-500 ring-inset'
                                  : ''}
                                {!isCurrentCell && isUndervalued
                                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20'
                                  : ''}
                                {!isCurrentCell && isOvervalued
                                  ? 'text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-900/20'
                                  : ''}
                                {!isCurrentCell &&
                                !isUndervalued &&
                                !isOvervalued
                                  ? 'text-gray-700 dark:text-zinc-300'
                                  : ''}
                              "
                              >
                                ${value}
                              </td>
                            {/each}
                          </tr>
                        {/each}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div
                  class="flex flex-wrap gap-4 mt-3 text-xs text-gray-500 dark:text-zinc-400"
                >
                  <div class="flex items-center gap-1">
                    <span
                      class="w-3 h-3 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700"
                    ></span>
                    <span>Undervalued</span>
                    <InfoModal
                      id="sensitivityUndervalued"
                      content="Green cells indicate scenarios where the fair value is more than 10% above the current price, suggesting the stock may be undervalued under those assumptions."
                    />
                  </div>
                  <div class="flex items-center gap-1">
                    <span
                      class="w-3 h-3 rounded-full bg-rose-100 dark:bg-rose-900/40 border border-rose-300 dark:border-rose-700"
                    ></span>
                    <span>Overvalued</span>
                    <InfoModal
                      id="sensitivityOvervalued"
                      content="Red cells indicate scenarios where the fair value is more than 10% below the current price, suggesting the stock may be overvalued under those assumptions."
                    />
                  </div>
                  <div class="flex items-center gap-1">
                    <span
                      class="w-3 h-3 rounded-full bg-violet-200 dark:bg-violet-800/50 border border-violet-400 dark:border-violet-600"
                    ></span>
                    <span>Current</span>
                    <InfoModal
                      id="sensitivityCurrent"
                      content="The highlighted cell shows the fair value based on your current growth rate and discount rate assumptions."
                    />
                  </div>
                </div>
              </div>
            {/if}
          </main>

          <aside class="inline-block relative w-full lg:w-1/4 mt-3">
            <div
              class="bg-white/70 dark:bg-zinc-950/40 border border-gray-300 shadow dark:border-zinc-700 p-6 rounded-2xl shadow-none text-gray-700 dark:text-zinc-200"
            >
              <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold">
                  {stock_detail_forecast_dcf_inputs()}
                </h2>
              </div>

              <div class="space-y-6">
                <!-- Metric Dropdown -->
                <div>
                  <label class="flex items-center text-sm font-medium mb-2">
                    {stock_detail_forecast_dcf_metric()}
                    <InfoModal
                      id="metric"
                      content={stock_detail_forecast_dcf_metric_info()}
                    />
                  </label>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild let:builder>
                      <Button
                        builders={[builder]}
                        class="w-full transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 flex flex-row justify-between items-center px-3 py-2 rounded-full"
                      >
                        <span class="truncate text-sm">{metricLabel}</span>
                        <svg
                          class="-mr-1 ml-2 h-5 w-5 inline-block"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clip-rule="evenodd"
                          ></path>
                        </svg>
                      </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content
                      side="bottom"
                      align="start"
                      sideOffset={10}
                      class="w-56 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
                    >
                      <DropdownMenu.Group>
                        <DropdownMenu.Item
                          on:click={() => {
                            selectedMetric = "freeCashFlow";
                            onMetricChange();
                          }}
                          class="{selectedMetric === 'freeCashFlow'
                            ? 'text-gray-900 dark:text-white font-medium'
                            : 'text-gray-800 dark:text-zinc-300'} cursor-pointer hover:text-violet-600 dark:hover:text-violet-400"
                        >
                          {stock_detail_forecast_dcf_fcf()}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          on:click={() => {
                            selectedMetric = "operatingIncome";
                            onMetricChange();
                          }}
                          class="{selectedMetric === 'operatingIncome'
                            ? 'text-gray-900 dark:text-white font-medium'
                            : 'text-gray-800 dark:text-zinc-300'} cursor-pointer hover:text-violet-600 dark:hover:text-violet-400"
                        >
                          {stock_detail_forecast_dcf_operating_income()}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          on:click={() => {
                            selectedMetric = "operatingCashFlow";
                            onMetricChange();
                          }}
                          class="{selectedMetric === 'operatingCashFlow'
                            ? 'text-gray-900 dark:text-white font-medium'
                            : 'text-gray-800 dark:text-zinc-300'} cursor-pointer hover:text-violet-600 dark:hover:text-violet-400"
                        >
                          {stock_detail_forecast_dcf_ocf()}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          on:click={() => {
                            selectedMetric = "bookValue";
                            onMetricChange();
                          }}
                          class="{selectedMetric === 'bookValue'
                            ? 'text-gray-900 dark:text-white font-medium'
                            : 'text-gray-800 dark:text-zinc-300'} cursor-pointer hover:text-violet-600 dark:hover:text-violet-400"
                        >
                          {stock_detail_forecast_dcf_book_value()}
                        </DropdownMenu.Item>
                      </DropdownMenu.Group>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </div>

                <!-- Years Dropdown -->
                <div>
                  <label class="flex items-center text-sm font-medium mb-2">
                    {stock_detail_forecast_dcf_years_to_project()}
                    <InfoModal
                      id="years"
                      content={stock_detail_forecast_dcf_years_info()}
                    />
                  </label>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild let:builder>
                      <Button
                        builders={[builder]}
                        class="w-full transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 flex flex-row justify-between items-center px-3 py-2 rounded-full"
                      >
                        <span class="truncate text-sm"
                          >{yearsToProject} Years</span
                        >
                        <svg
                          class="-mr-1 ml-2 h-5 w-5 inline-block"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clip-rule="evenodd"
                          ></path>
                        </svg>
                      </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content
                      side="bottom"
                      align="start"
                      sideOffset={10}
                      class="w-56 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
                    >
                      <DropdownMenu.Group>
                        {#each [3, 5, 10] as year}
                          <DropdownMenu.Item
                            on:click={() => {
                              yearsToProject = year;
                              userHasModifiedInputs = true;
                            }}
                            class="{yearsToProject === year
                              ? 'text-gray-900 dark:text-white font-medium'
                              : 'text-gray-800 dark:text-zinc-300'} cursor-pointer hover:text-violet-600 dark:hover:text-violet-400"
                          >
                            {year} Years
                          </DropdownMenu.Item>
                        {/each}
                      </DropdownMenu.Group>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </div>

                <div>
                  <label
                    for="metric-growth"
                    class="flex items-center text-sm font-medium mb-2"
                  >
                    {stock_detail_forecast_dcf_growth_rate({
                      metric: metricLabel,
                    })}
                    <InfoModal
                      id="metricGrowthRate"
                      content={stock_detail_forecast_dcf_growth_info()}
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
                      class="bg-white/80 dark:bg-zinc-950/60 border border-gray-300 shadow dark:border-zinc-700 text-sm rounded-full focus:outline-none focus:border-gray-400/90 dark:focus:border-zinc-500/90 block w-full pl-7 py-1.5 text-gray-700 dark:text-zinc-200"
                    />
                  </div>
                  <p class="mt-2 text-xs">
                    {stock_detail_forecast_dcf_historical_growth({
                      metric: metricLabel,
                      value:
                        selectedMetric === "freeCashFlow"
                          ? valuationData?.freeCashFlowGrowth || 0
                          : valuationData?.operatingIncomeGrowth || 0,
                    })}
                  </p>
                </div>

                <div>
                  <label
                    for="shares-growth"
                    class="flex items-center text-sm font-medium mb-2"
                  >
                    {stock_detail_forecast_dcf_shares_growth()}
                    <InfoModal
                      id="dilutedSharedsGrowthRate"
                      content={stock_detail_forecast_dcf_shares_info()}
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
                      class="bg-white/80 dark:bg-zinc-950/60 border border-gray-300 shadow dark:border-zinc-700 text-sm rounded-full focus:outline-none focus:border-gray-400/90 dark:focus:border-zinc-500/90 block w-full pl-7 py-1.5 text-gray-700 dark:text-zinc-200"
                    />
                  </div>
                  <p class="mt-2 text-xs">
                    {stock_detail_forecast_dcf_historical_shares({
                      value: valuationData?.sharesGrowth || 0,
                    })}
                  </p>
                </div>

                <div>
                  <label
                    for="dividend-growth"
                    class="flex items-center text-sm font-medium mb-2"
                  >
                    {stock_detail_forecast_dcf_dividend_growth()}
                    <InfoModal
                      id="dividendGrowthRate"
                      content={stock_detail_forecast_dcf_dividend_info()}
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
                      class="bg-white/80 dark:bg-zinc-950/60 border border-gray-300 shadow dark:border-zinc-700 text-sm rounded-full focus:outline-none focus:border-gray-400/90 dark:focus:border-zinc-500/90 block w-full pl-7 py-1.5 text-gray-700 dark:text-zinc-200"
                    />
                  </div>
                </div>

                <div>
                  <label
                    for="price-ratio"
                    class="flex items-center text-sm font-medium mb-2"
                  >
                    {stock_detail_forecast_dcf_price_ratio()}
                    <InfoModal
                      id="priceRatio"
                      content={stock_detail_forecast_dcf_price_ratio_info()}
                    />
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="price-ratio"
                    bind:value={priceRatioAvg}
                    on:input={() => (userHasModifiedInputs = true)}
                    class="bg-white/80 dark:bg-zinc-950/60 border border-gray-300 shadow dark:border-zinc-700 text-sm rounded-full focus:outline-none focus:border-gray-400/90 dark:focus:border-zinc-500/90 block w-full pl-3 py-1.5 text-gray-700 dark:text-zinc-200"
                  />
                  <p class="mt-2 text-xs">
                    {stock_detail_forecast_dcf_avg_ratio({
                      metric: metricShortLabel,
                      value: valuationData?.[ratioAvgKey] ?? 0,
                    })}
                  </p>
                </div>

                <div>
                  <label
                    for="discount-rate"
                    class="flex items-center text-sm font-medium mb-2"
                  >
                    {stock_detail_forecast_dcf_discount_rate()}
                    <InfoModal
                      id="discountedRate"
                      content={stock_detail_forecast_dcf_discount_info()}
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
                      class="bg-white/80 dark:bg-zinc-950/60 border border-gray-300 shadow dark:border-zinc-700 text-sm rounded-full focus:outline-none focus:border-gray-400/90 dark:focus:border-zinc-500/90 block w-full pl-7 py-1.5 text-gray-700 dark:text-zinc-200"
                    />
                  </div>
                  <p class="mt-2 text-xs">
                    {stock_detail_forecast_dcf_discount_hint()}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        {:else}
          <div class="w-full">
            <Infobox text={stock_detail_forecast_dcf_no_data()} />
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>

<input type="checkbox" id="showSteps" class="modal-toggle" />

<dialog
  id="showSteps"
  class="modal p-3 sm:p-0 text-gray-600 dark:text-zinc-300"
>
  <label for="showSteps" class="cursor-pointer modal-backdrop bg-[#000]/30"
  ></label>

  <div
    class="modal-box rounded-2xl border border-gray-300 shadow dark:border-zinc-700 w-full bg-white dark:bg-zinc-950 flex flex-col items-center"
  >
    <div class="mx-auto h-1.5 w-20 shrink-0 rounded-full" />
    <div class="mb-5 text-center overflow-y-auto max-h-[80vh]">
      <h3 class="font-bold text-xl sm:text-2xl mb-5 text-start">
        {stock_detail_forecast_dcf_breakdown_title()}
      </h3>
      <div class="space-y-6 text-start">
        <div>
          <h3 class="font-semibold mb-2">
            {stock_detail_forecast_dcf_step1_title({ metric: metricLabel })}
          </h3>
          <p class="text-sm">
            {stock_detail_forecast_dcf_step1_recent({
              metric: metricLabel,
              value: abbreviateNumber(latestMetric),
              date: new Date(latestDate)?.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
            })}
          </p>
          <p class="text-sm">
            {stock_detail_forecast_dcf_step1_project({
              years: yearsToProject,
              rate: metricGrowthRate,
            })}
          </p>
          <p class="text-sm">
            {stock_detail_forecast_dcf_step1_result({
              start: abbreviateNumber(latestMetric),
              rate: metricGrowthRate,
              years: yearsToProject,
              metric: metricLabel,
              result: abbreviateNumber(futureMetric ?? 0),
            })}
          </p>
        </div>

        <div>
          <h3 class="font-semibold mb-2">
            {stock_detail_forecast_dcf_step2_title()}
          </h3>
          <p class="text-sm">
            {stock_detail_forecast_dcf_step2_recent({
              value: abbreviateNumber(dilutedShares),
            })}
          </p>
          <p class="text-sm">
            {stock_detail_forecast_dcf_step2_project({
              years: yearsToProject,
              rate: sharesGrowthRate,
            })}
          </p>
          <p class="text-sm">
            {stock_detail_forecast_dcf_step2_result({
              value: abbreviateNumber(futureShares ?? 0),
            })}
          </p>
        </div>

        <div>
          <h3 class="font-semibold mb-2">
            {stock_detail_forecast_dcf_step3_title()}
          </h3>
          <p class="text-sm mb-3">
            {stock_detail_forecast_dcf_step3_formula({
              ratio: priceRatioAvg,
              metric: metricLabel,
            })}
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
            {stock_detail_forecast_dcf_step4_title()}
          </h3>
          <p class="text-sm">
            {stock_detail_forecast_dcf_step4_forward({
              value: forwardDividend,
            })}
          </p>
          <p class="text-sm">
            {stock_detail_forecast_dcf_step4_project({
              years: yearsToProject,
              rate: dividendGrowthRate
                ? dividendGrowthRate?.toFixed(2) + "%"
                : "n/a",
            })}
          </p>
          <p class="text-sm">
            {stock_detail_forecast_dcf_step4_result({
              years: yearsToProject,
              value: totalDividends,
            })}
          </p>
        </div>

        <div>
          <h3 class="font-semibold mb-2">
            {stock_detail_forecast_dcf_step5_title()}
          </h3>
          <p class="text-sm">
            {stock_detail_forecast_dcf_step5_projected({
              value:
                futureStockPrice && futureStockPrice > 0
                  ? "$" + futureStockPrice
                  : "n/a",
            })}
          </p>
          <p class="text-sm">
            {stock_detail_forecast_dcf_step5_total({
              value:
                totalFutureValue && totalFutureValue > 0
                  ? "$" + totalFutureValue
                  : "n/a",
            })}
          </p>
          <p class="text-sm">
            {stock_detail_forecast_dcf_step5_result({
              rate: discountRate,
              years: yearsToProject,
              value:
                presentValue && presentValue > 0 ? "$" + presentValue : "n/a",
            })}
          </p>
        </div>
      </div>
    </div>

    <div class="border-t border-gray-300 dark:border-zinc-700 mt-2 w-full">
      <label
        for="showSteps"
        class="mt-4 font-semibold text-xl m-auto flex justify-center cursor-pointer"
        >{stock_detail_forecast_dcf_close()}</label
      >
    </div>
  </div>
</dialog>

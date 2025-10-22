<script lang="ts">
  import {
    displayCompanyName,
    stockTicker,
    analystEstimateComponent,
    screenWidth,
  } from "$lib/store";
  import {
    abbreviateNumber,
    monthNames,
    removeCompanyStrings,
  } from "$lib/utils";
  import highcharts from "$lib/highcharts.ts";

  import { goto } from "$app/navigation";

  import SEO from "$lib/components/SEO.svelte";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import { mode } from "mode-watcher";

  export let data;

  const calculatePriceChange = (targetPrice) =>
    targetPrice && price ? ((targetPrice / price - 1) * 100)?.toFixed(2) : 0;

  let index;
  let changeRevenue;
  let changeRevenueNextYear;
  let changeEPS;
  let changeEPSNextYear;
  let price;

  let numOfAnalyst;
  let avgPriceTarget;
  let medianPriceTarget;
  let lowPriceTarget;
  let highPriceTarget;
  let consensusRating;

  let lowChange;
  let medianChange;
  let avgChange;
  let highChange;
  let rawAnalystList;
  let recommendationList;

  let categories = ["Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"];

  const tabs = [
    {
      title: "All Analysts",
    },
    {
      title: "Top Analysts",
    },
  ];
  let activeIdx = 0;

  function changeTab(index) {
    activeIdx = index;
    if (activeIdx === 0) {
      numOfAnalyst = data?.getAnalystSummary?.numOfAnalyst || 0;
      avgPriceTarget = data?.getAnalystSummary?.avgPriceTarget || 0;
      medianPriceTarget = data?.getAnalystSummary?.medianPriceTarget || 0;
      lowPriceTarget = data?.getAnalystSummary?.lowPriceTarget || 0;
      highPriceTarget = data?.getAnalystSummary?.highPriceTarget || 0;
      consensusRating = data?.getAnalystSummary?.consensusRating;

      lowChange = calculatePriceChange(lowPriceTarget);
      medianChange = calculatePriceChange(medianPriceTarget);
      avgChange = calculatePriceChange(avgPriceTarget);
      highChange = calculatePriceChange(highPriceTarget);
      rawAnalystList = data?.getAnalystSummary?.recommendationList || [];
      recommendationList =
        rawAnalystList?.length > 5 ? rawAnalystList?.slice(-6) : rawAnalystList;
      categories = ["Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"];
    } else {
      numOfAnalyst = data?.getTopAnalystSummary?.numOfAnalyst || 0;
      avgPriceTarget = data?.getTopAnalystSummary?.avgPriceTarget || 0;
      medianPriceTarget = data?.getTopAnalystSummary?.medianPriceTarget || 0;
      lowPriceTarget = data?.getTopAnalystSummary?.lowPriceTarget || 0;
      highPriceTarget = data?.getTopAnalystSummary?.highPriceTarget || 0;
      consensusRating = data?.getTopAnalystSummary?.consensusRating;

      lowChange = calculatePriceChange(lowPriceTarget);
      medianChange = calculatePriceChange(medianPriceTarget);
      avgChange = calculatePriceChange(avgPriceTarget);
      highChange = calculatePriceChange(highPriceTarget);
      rawAnalystList = data?.getTopAnalystSummary?.recommendationList || [];
      recommendationList =
        rawAnalystList?.length > 5 ? rawAnalystList?.slice(-6) : rawAnalystList;
      categories = ["Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"];
    }

    optionsBarChart = getBarChart() || null;
    optionsPieChart = getPieChart() || null;
    config = getPriceForecastChart() || null;
  }

  function findIndex(data) {
    let year = new Date().getFullYear() - 1;

    while (year > 0) {
      // Ensure we don't loop indefinitely
      // Find the index where the item's date matches the current year and revenue is null
      const index = data?.findIndex((item) => item?.date === year);

      // If index is found and there is at least one item in the data for this year with non-null revenue
      if (index !== -1) {
        const hasNonNullRevenue = data?.some(
          (item) => item?.date === year && item?.revenue !== null,
        );

        // Add +1 to the index if the condition is met
        return hasNonNullRevenue ? index + 1 : index;
      }

      // Decrement the year to search the previous year
      year--;
    }

    return -1; // Return -1 if no matching index is found
  }

  function getTotalForDate(index, recommendationList) {
    return categories?.reduce(
      (sum, cat) => sum + recommendationList[index][cat],
      0,
    );
  }

  const calculateChange = (current, previous) => {
    if (previous !== undefined && previous !== 0) {
      const change = (Math.abs(current) / Math.abs(previous) - 1) * 100;
      // Preserve the direction of change (positive/negative)
      const direction = current < 0 || previous < 0 ? -1 : 1;
      return change * direction;
    } else {
      return null;
    }
  };

  function getBarChart() {
    if (!rawAnalystList || rawAnalystList.length === 0) {
      return null;
    }

    const categories = ["Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"];
    const colors = ["#008A00", "#31B800", "#F5B700", "#D9220E", "#9E190A"];

    // Step 1: Store original values
    const formattedData = rawAnalystList.map((item) =>
      categories?.map((cat) => item[cat] || 0),
    );

    // Step 2: Create normalized data for visualization
    const normalizedData = formattedData.map((row) => {
      const total = row.reduce((sum, val) => sum + val, 0);
      return row.map((val) => (total > 0 ? (val / total) * 100 : 0));
    });

    // Step 3: Include original values in data points
    const series = categories.map((name, idx) => ({
      name: name,
      data: normalizedData?.map((row, dataIndex) => ({
        y: formattedData[dataIndex][idx], // Normalized percentage for chart
        originalValue: formattedData[dataIndex][idx], // Original value for tooltip
      })),
      color: colors[idx],
      borderColor: colors[idx],
      borderRadius: "1px",
    }));

    const xCategories = rawAnalystList.map((item) => {
      const dateParts = item.date.split("-");
      const monthIndex = parseInt(dateParts[1], 10) - 1;
      // Extract the last two digits of the year and prepend an apostrophe
      const yearTwoDigits = "'" + dateParts[0].slice(-2);
      return `${monthNames[monthIndex]} ${yearTwoDigits}`;
    });

    // Define and return the Highcharts options object
    const options = {
      chart: {
        type: "column",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        animation: false,
        height: 360, // Add fixed height
        marginTop: 30, // Reduce top margin
        marginBottom: 60, // Increase bottom margin for x-axis labels
      },
      legend: {
        enabled: false,
      },
      title: {
        text: null,
      },
      xAxis: {
        categories: xCategories,
        labels: {
          style: {
            color: $mode === "light" ? "#545454" : "white",
          },
        },
      },
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        style: {
          color: $mode === "light" ? "#545454" : "white",
          fontSize: "16px",
          padding: "10px",
        },
        borderRadius: 4,
        headerFormat:
          '<span class="font-semibold text-[1rem] text-white">{point.key}</span><br/>',
        pointFormat:
          '<span style="color:{point.color}">\u25CF</span> ' +
          "<span class='text-sm text-white'>{series.name}: <b>{point.originalValue}</b><br/></span>",
      },
      yAxis: {
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
        },
        title: { text: null },
      },
      plotOptions: {
        column: {
          stacking: "normal", // stacks the columns so that each column adds up to 100%
        },
        series: {
          animation: false,
        },
      },
      credits: {
        enabled: false,
      },
      series: series,
    };

    return options;
  }

  function getPieChart() {
    let value;
    // Determine the value based on the consensus rating
    switch (consensusRating) {
      case "Strong Sell":
        value = 0.5;
        break;
      case "Sell":
        value = 1.5;
        break;
      case "Hold":
        value = 2.5;
        break;
      case "Buy":
        value = 3.5;
        break;
      case "Strong Buy":
        value = 4.5;
        break;
      default:
        value = 0.5;
        break;
    }

    const options = {
      legend: {
        enabled: false,
      },
      credits: {
        enabled: false,
      },
      chart: {
        type: "gauge",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        animation: false,
      },
      title: {
        text: null,
      },
      yAxis: {
        min: 0,
        max: 5,
        tickPosition: "inside",
        tickLength: 20,
        tickWidth: 0,
        minorTickInterval: null,
        lineWidth: 0,
        // Remove numeric tick labels
        labels: {
          enabled: false,
        },
        plotBands: [
          {
            from: 0,
            to: 1,
            color: "#9E190A",
            thickness: 40,
            borderRadius: "0px",
          },
          {
            from: 1,
            to: 2,
            color: "#D9220E",
            thickness: 40,
            borderRadius: "0px",
          },
          {
            from: 2,
            to: 3,
            color: "#f5b700",
            thickness: 40,
            borderRadius: "0px",
          },
          {
            from: 3,
            to: 4,
            color: "#31B800",
            thickness: 40,
            borderRadius: "0px",
          },
          {
            from: 4,
            to: 5,
            color: "#008A00",
            thickness: 40,
            borderRadius: "0px",
          },
        ],
      },
      pane: {
        startAngle: -90,
        endAngle: 89.9,
        background: null,
        center: ["50%", "50%"],
        size: "70%",
      },
      series: [
        {
          name: "Rating",
          data: [value],
          animation: false,
          dataLabels: {
            enabled: true,
            useHTML: true,
            borderWidth: 0,
            backgroundColor: "transparent",
            style: {
              textOutline: "none",
              fontSize: "16px",
              fontWeight: "bold",
            },
            formatter: function () {
              const rating = this.y;
              let ratingText = "";
              let textColor = "";

              if (rating < 1) {
                ratingText = "Strong Sell";
                textColor = "#D9220E";
              } else if (rating < 2) {
                ratingText = "Sell";
                textColor = "#D9220E";
              } else if (rating < 3) {
                ratingText = "Hold";
                textColor = "#C19000";
              } else if (rating < 4) {
                ratingText = "Buy";
                textColor = "#31B800";
              } else {
                ratingText = "Strong Buy";
                textColor = "#31B800";
              }

              // "Analyst Consensus:" in white, rating in color
              return `
          <span class="text-lg text-muted dark:text-white">Analyst Consensus: </span>
          <span class="text-lg" style="color:${textColor};">${ratingText}</span>
        `;
            },
          },
          dial: {
            radius: "80%",
            backgroundColor: "#2A2E39",
            baseWidth: 12,
            baseLength: "0%",
            rearLength: "0%",
          },
          pivot: {
            backgroundColor: "#2A2E39",
            radius: 8,
          },
        },
      ],
    };

    return options;
  }

  function getPriceForecastChart() {
    const historicalData = data?.getAnalystSummary?.pastPriceList || [];
    const forecastTargets = {
      low: lowPriceTarget,
      avg: avgPriceTarget,
      high: highPriceTarget,
    };

    // Process historical data
    const processedHistorical = historicalData?.map((point) => [
      new Date(point?.date).getTime(),
      point?.close,
    ]);

    const currentDate = new Date();
    const forecastDate = new Date(
      currentDate.getFullYear() + 1,
      currentDate.getMonth(),
      currentDate.getDate(),
    );
    const forecastTimestamp = forecastDate.getTime();

    // Get the last historical data point
    const lastHistoricalDate = new Date(
      historicalData[historicalData.length - 1]?.date,
    ).getTime();
    const lastHistoricalClose =
      historicalData[historicalData.length - 1]?.close;

    // Create forecast points
    const forecastHigh = [
      [lastHistoricalDate, lastHistoricalClose],
      [forecastTimestamp, forecastTargets.high],
    ];

    const forecastAvg = [
      [lastHistoricalDate, lastHistoricalClose],
      [forecastTimestamp, forecastTargets.avg],
    ];

    const forecastLow = [
      [lastHistoricalDate, lastHistoricalClose],
      [forecastTimestamp, forecastTargets.low],
    ];

    const options = {
      tooltip: {
        enabled: false,
      },
      plotOptions: {
        series: {
          enableMouseTracking: false,
          states: {
            hover: {
              enabled: false,
            },
          },
          marker: {
            states: {
              hover: {
                enabled: false,
              },
            },
          },
        },
      },
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 360,
        animation: false,
      },
      title: {
        text: `<div class="grid grid-cols-2 w-[200px] sm:w-[500px] -mb-3.5 text-xs font-[501] text-gray-600 dark:text-gray-400">
          <h3 class="text-left">${$screenWidth && $screenWidth < 640 ? "Past Year" : "Past 12 Months"}</h3>
          <h3 class="text-right">${$screenWidth && $screenWidth < 640 ? "Next Year" : "12 Month Forecast"}</h3>
         </div>`,
        style: {
          color: $mode === "light" ? "black" : "white",
          width: "100%",
        },
        verticalAlign: "top",
        useHTML: true,
      },
      xAxis: {
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        type: "datetime",
        endOnTick: false,
        labels: {
          style: {
            color: $mode === "light" ? "#545454" : "white",
          },
          formatter: function () {
            const date = new Date(this.value);
            return date.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
              timeZone: "UTC",
            });
          },
        },
      },
      yAxis: {
        title: {
          text: "",
        },
        labels: {
          style: {
            color: $mode === "light" ? "#545454" : "white",
          },
          formatter: function () {
            return `$${this.value.toFixed(0)}`;
          },
        },
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
      },

      series: [
        {
          animation: false,
          name: "Historical",
          data: processedHistorical,
          color: $mode === "light" ? "#007050" : "#fff",
          marker: {
            enabled: true,
            symbol: "circle",
            radius: 4,
          },
          lineWidth: 3,
        },
        {
          animation: false,
          name: "High",
          data: forecastHigh,
          color: "#31B800",
          dashStyle: "Dash",
          marker: {
            enabled: false,
          },
        },
        {
          animation: false,
          name: "Average",
          data: forecastAvg,
          color: $mode === "light" ? "#007050" : "#fff",
          dashStyle: "Dash",
          marker: {
            enabled: false,
          },
        },
        {
          animation: false,
          name: "Low",
          data: forecastLow,
          color: "#D9220E",
          dashStyle: "Dash",
          marker: {
            enabled: false,
          },
        },
      ],
      /*
      annotations: [
        {
          labels: [
            {
              point: {
                x: forecastHigh[forecastHigh.length - 1][0], // Last X (timestamp)
                y: forecastHigh[forecastHigh.length - 1][1], // Last Y (Average value)
                xAxis: 0,
                yAxis: 0,
              },
              text: `<b>High</b><br><span class="text-sm">$${forecastHigh[forecastHigh.length - 1][1]}</span>`,
              useHTML: true,
              style: {
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                borderColor: "rgba(255, 255, 255, 0.2)",
                borderWidth: 1,
                fontSize: "12px",
                fontWeight: "bold",
              },
              align: "left",
              verticalAlign: "middles",
              x: -10,
              y: 0,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              borderColor: "rgba(255, 255, 255, 0.2)",
              borderWidth: 1,
              padding: 8,
              shape: "",
            },
            {
              point: {
                x: forecastAvg[forecastAvg.length - 1][0], // Last X (timestamp)
                y: forecastAvg[forecastAvg.length - 1][1], // Last Y (Average value)
                xAxis: 0,
                yAxis: 0,
              },
              text: `<b>Average</b><br><span>$${forecastAvg[forecastAvg.length - 1][1]}</span>`,
              useHTML: true,
              style: {
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                borderColor: "rgba(255, 255, 255, 0.2)",
                borderWidth: 1,
                fontSize: "12px",
                fontWeight: "bold",
              },
              align: "right",
              verticalAlign: "middle",
              x: -10,
              y: 30,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              borderColor: "rgba(255, 255, 255, 0.2)",
              borderWidth: 1,
              padding: 5,
              shape: "",
            },
            {
              point: {
                x: forecastLow[forecastLow.length - 1][0], // Last X (timestamp)
                y: forecastLow[forecastLow.length - 1][1], // Last Y (Average value)
                xAxis: 0,
                yAxis: 0,
              },
              text: `<b>Low</b><br><span>$${forecastLow[forecastLow.length - 1][1]}</span>`,
              useHTML: true,
              style: {
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                borderColor: "rgba(255, 255, 255, 0.2)",
                borderWidth: 1,
                fontSize: "12px",
                fontWeight: "bold",
              },
              align: "top",
              verticalAlign: "middle",
              x: -10,
              y: -40,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              borderColor: "rgba(255, 255, 255, 0.2)",
              borderWidth: 1,
              padding: 5,
              shape: "",
            },
          ],
        },
      ],
      */

      legend: {
        enabled: false,
      },
      credits: {
        enabled: false,
      },
    };
    return options;
  }

  let optionsBarChart = null;
  let optionsPieChart = null;
  let config = null;

  function latestInfoDate(inputDate) {
    // Convert the input date string to milliseconds since epoch
    const inputDateMs = Date?.parse(inputDate);

    // Get today's date in milliseconds since epoch
    const todayMs = Date?.now();

    // Calculate the difference in milliseconds
    const differenceInMs = todayMs - inputDateMs;

    // Convert milliseconds to days
    const differenceInDays = Math?.floor(
      differenceInMs / (1000 * 60 * 60 * 24),
    );

    // Return the difference in days
    return differenceInDays <= 1;
  }

  $: {
    if ($mode) {
      optionsBarChart = getBarChart() || null;
      optionsPieChart = getPieChart() || null;
      config = getPriceForecastChart() || null;
    }
  }

  index = 0;
  activeIdx = 0;
  changeRevenue = 0;
  changeRevenueNextYear = 0;
  changeEPS = 0;
  changeEPSNextYear = 0;
  price = data?.getStockQuote?.price?.toFixed(2) || 0;

  numOfAnalyst = data?.getAnalystSummary?.numOfAnalyst || 0;
  avgPriceTarget = data?.getAnalystSummary?.avgPriceTarget || 0;
  medianPriceTarget = data?.getAnalystSummary?.medianPriceTarget || 0;
  lowPriceTarget = data?.getAnalystSummary?.lowPriceTarget || 0;
  highPriceTarget = data?.getAnalystSummary?.highPriceTarget || 0;
  consensusRating = data?.getAnalystSummary?.consensusRating;

  lowChange = calculatePriceChange(lowPriceTarget);
  medianChange = calculatePriceChange(medianPriceTarget);
  avgChange = calculatePriceChange(avgPriceTarget);
  highChange = calculatePriceChange(highPriceTarget);
  rawAnalystList = data?.getAnalystSummary?.recommendationList || [];
  recommendationList =
    rawAnalystList?.length > 5 ? rawAnalystList?.slice(-6) : rawAnalystList;

  if (data?.getAnalystEstimate?.length !== 0) {
    index = findIndex(data?.getAnalystEstimate);

    // Calculate changes using the helper function
    const estimatedRevenueAvg =
      data?.getAnalystEstimate[index]?.estimatedRevenueAvg;
    const revenue = data?.getAnalystEstimate[index - 1]?.revenue;
    const estimatedRevenueAvgNextYear =
      data?.getAnalystEstimate[index + 1]?.estimatedRevenueAvg;
    const estimatedEpsAvg = data?.getAnalystEstimate[index]?.estimatedEpsAvg;
    const eps = data?.getAnalystEstimate[index - 1]?.eps;
    const estimatedEPSAvgNextYear =
      data?.getAnalystEstimate[index + 1]?.estimatedEpsAvg;

    // Calculate percentage changes for each metric
    changeRevenue = calculateChange(estimatedRevenueAvg, revenue);
    changeRevenueNextYear = calculateChange(
      estimatedRevenueAvgNextYear,
      estimatedRevenueAvg,
    );
    changeEPS = calculateChange(estimatedEpsAvg, eps);
    changeEPSNextYear = calculateChange(
      estimatedEPSAvgNextYear,
      estimatedEpsAvg,
    );
  }

  optionsBarChart = getBarChart() || null;
  optionsPieChart = getPieChart() || null;
  config = getPriceForecastChart() || null;
</script>

<SEO
  title={`${$stockTicker} Stock Forecast & Price Predictions - ${$displayCompanyName} Analyst Targets & Earnings Estimates`}
  description={`Professional ${$stockTicker} stock forecast and price predictions for ${$displayCompanyName}. Get comprehensive analyst price targets, earnings estimates, revenue forecasts, and consensus ratings from Wall Street experts. Track ${$stockTicker} future price projections with ${numOfAnalyst || 0} analyst recommendations and historical accuracy data.`}
  keywords={`${$stockTicker} stock forecast, ${$displayCompanyName} price prediction, ${$stockTicker} analyst targets, Wall Street analyst ratings, ${$stockTicker} earnings forecast, stock price predictions, ${$stockTicker} consensus rating, financial forecasting, investment research, ${$stockTicker} future price, analyst estimates, stock recommendations`}
  type="article"
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["Article", "FinancialProduct", "AnalysisNewsArticle"],
    headline: `${$stockTicker} Stock Forecast - Professional Price Predictions & Analyst Analysis`,
    name: `${$displayCompanyName} (${$stockTicker}) Stock Forecast`,
    description: `Comprehensive stock forecast analysis for ${$displayCompanyName} (${$stockTicker}) with ${numOfAnalyst || 0} analyst price targets, earnings estimates, and professional investment insights`,
    url: `https://stocknear.com/stocks/${$stockTicker}/forecast`,

    dateModified: new Date().toISOString(),
    datePublished: new Date().toISOString(),
    author: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
      description: "Professional stock market analysis platform",
    },
    publisher: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
      logo: {
        "@type": "ImageObject",
        url: "https://stocknear.com/favicon.png",
      },
    },
    mainEntity: {
      "@type": "FinancialProduct",
      name: `${$displayCompanyName} Stock Forecast Analysis`,
      description: `Professional stock price forecast and predictions for ${$displayCompanyName} (${$stockTicker}) with analyst consensus and earnings estimates`,
      category: "Stock Market Analysis",
      provider: {
        "@type": "Organization",
        name: "Stocknear",
      },
      offers:
        numOfAnalyst > 0
          ? {
              "@type": "Offer",
              price: avgPriceTarget || 0,
              priceCurrency: "USD",
              description: `Average analyst price target: $${avgPriceTarget || 0}`,
              priceRange: `$${lowPriceTarget || 0} - $${highPriceTarget || 0}`,
            }
          : undefined,
    },
    about: {
      "@type": "Corporation",
      name: $displayCompanyName,
      tickerSymbol: $stockTicker,
    },
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
          name: "Stocks",
          item: "https://stocknear.com/stocks",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `${$displayCompanyName} (${$stockTicker})`,
          item: `https://stocknear.com/stocks/${$stockTicker}`,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: "Stock Forecast",
          item: `https://stocknear.com/stocks/${$stockTicker}/forecast`,
        },
      ],
    },
    significantLink: [
      `https://stocknear.com/stocks/${$stockTicker}/forecast/ai`,
      `https://stocknear.com/stocks/${$stockTicker}/forecast/analyst`,
    ],
  }}
/>

<section class="w-full overflow-hidden h-full">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <div class="sm:pl-4 w-full m-auto">
        <div
          class="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between"
        >
          <h1 class="mb-px text-xl sm:text-2xl font-bold bp:text-3xl sm:pl-1">
            {removeCompanyStrings($displayCompanyName)} Stock Forecast
          </h1>
          <div class="flex flex-col w-full sm:w-fit items-end justify-end">
            <InfoModal
              title="Top Analyst"
              content="Filter by only analysts with 4+ stars based on their success rate and
        average return per rating. 4+ star analysts have a high accuracy and
        high average return per rating."
            />

            <div class="inline-flex justify-center w-full rounded sm:w-auto">
              <div
                class="bg-black text-white dark:bg-secondary w-full sm:w-fit relative flex flex-wrap items-center justify-center rounded p-1"
              >
                {#each tabs as item, i}
                  {#if !["Pro", "Plus"]?.includes(data?.user?.tier) && i > 0}
                    <button
                      on:click={() => goto("/pricing")}
                      class="cursor-pointer group relative z-1 rounded-full w-1/2 min-w-24 md:w-auto px-5 py-1"
                    >
                      <span class="relative text-sm block font-semibold">
                        {item.title}
                        <svg
                          class="inline-block ml-0.5 -mt-1 w-3.5 h-3.5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          ><path
                            fill="currentColor"
                            d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                          /></svg
                        >
                      </span>
                    </button>
                  {:else}
                    <button
                      on:click={() => changeTab(i)}
                      class="cursor-pointer group relative z-1 rounded-full w-1/2 min-w-24 md:w-auto px-5 py-1 {activeIdx ===
                      i
                        ? 'z-0'
                        : ''} "
                    >
                      {#if activeIdx === i}
                        <div class="absolute inset-0 rounded bg-[#fff]"></div>
                      {/if}
                      <span
                        class="relative text-sm block font-semibold whitespace-nowrap {activeIdx ===
                        i
                          ? 'text-black'
                          : ''}"
                      >
                        {item.title}
                      </span>
                    </button>
                  {/if}
                {/each}
              </div>
            </div>
          </div>
        </div>

        <div class="w-full mb-6 mt-3">
          <div
            class="rounded shadow-xs border border-gray-300 dark:border-gray-600 p-0.5 xs:p-1 md:flex md:flex-col md:space-y-4 md:divide-y md:p-4 lg:flex-row lg:space-x-4 lg:space-y-0 lg:divide-x lg:divide-y-0 divide-gray-300 dark:divide-gray-600"
          >
            <div
              class="p-3 md:flex md:space-x-4 md:p-0 lg:block lg:max-w-[32%] lg:space-x-0"
            >
              <div>
                <div class="flex items-baseline justify-between">
                  <h2 class="mb-1 text-xl font-bold">Stock Price Forecast</h2>

                  <span></span>
                </div>
                {#if numOfAnalyst > 0}
                  <p>
                    The {numOfAnalyst} analysts with 12-month price forecasts for
                    {$stockTicker}
                    stock have an median target of {medianPriceTarget}, with a
                    low estimate of {lowPriceTarget}
                    and a high estimate of {highPriceTarget}. The median target
                    predicts {medianChange > 0 ? "an increase" : "a decrease"} of
                    {medianChange}% from the current stock price of {price}.
                  </p>
                {:else}
                  No Analyst Data available yet.
                {/if}
              </div>
              {#if numOfAnalyst > 0}
                <div
                  class="max-h-[225px]"
                  use:highcharts={optionsPieChart}
                ></div>
              {:else}
                <div class="min-w-[500px]"></div>
              {/if}
            </div>
            <div class="grow p-3 md:pt-4 lg:pl-4 lg:pt-0">
              {#if numOfAnalyst > 0}
                <div
                  class="sm:shadow-xs sm:border border-gray-300 dark:border-gray-800 rounded"
                  use:highcharts={config}
                ></div>
              {:else}
                <div
                  class="mb-2 min-h-[200px] sm:min-h-[300px] text-lg sm:text-xl font-bold shadow-xs border border-gray-300 dark:border-gray-800 rounded flex justify-center items-center"
                >
                  No Chart available
                </div>
              {/if}
              <div
                class=" mb-1 mt-2 overflow-x-auto px-1.5 text-center md:mb-0 md:px-0 lg:mt-2"
              >
                <table class="w-full text-right text-tiny xs:text-sm sm:">
                  <thead
                    ><tr
                      class="border-b border-gray-300 dark:border-gray-600 font-normal text-sm sm:text-[1rem]"
                      ><th class="py-[3px] text-left font-semibold lg:py-0.5"
                        >Target</th
                      > <th class="font-semibold">Low</th>
                      <th class="font-semibold">Average</th>
                      <th class="font-semibold">Median</th>
                      <th class="font-semibold">High</th></tr
                    ></thead
                  >
                  <tbody
                    ><tr
                      class="border-b border-gray-300 dark:border-gray-600 font-normal text-sm sm:text-[1rem]"
                      ><td class="py-[3px] text-left lg:py-0.5">Price</td>
                      <td>{lowPriceTarget > 0 ? lowPriceTarget : "n/a"}</td>
                      <td>{avgPriceTarget > 0 ? avgPriceTarget : "n/a"}</td>
                      <td
                        >{medianPriceTarget > 0 ? medianPriceTarget : "n/a"}</td
                      >
                      <td>{highPriceTarget > 0 ? highPriceTarget : "n/a"}</td
                      ></tr
                    >
                    <tr class="text-sm sm:text-[1rem]"
                      ><td class="py-[3px] text-left lg:py-0.5">Change</td>
                      <td
                        class={lowChange > 0
                          ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
                          : lowChange < 0
                            ? "text-red-800 dark:text-[#FF2F1F]"
                            : ""}
                        >{lowChange !== 0 ? lowChange + "%" : "n/a"}</td
                      >
                      <td
                        class={avgChange > 0
                          ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
                          : avgChange < 0
                            ? "text-red-800 dark:text-[#FF2F1F]"
                            : ""}
                        >{avgChange !== 0 ? avgChange + "%" : "n/a"}</td
                      >
                      <td
                        class={medianChange > 0
                          ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
                          : medianChange < 0
                            ? "text-red-800 dark:text-[#FF2F1F]"
                            : ""}
                        >{medianChange !== 0 ? medianChange + "%" : "n/a"}</td
                      >
                      <td
                        class={highChange > 0
                          ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
                          : highChange < 0
                            ? "text-red-800 dark:text-[#FF2F1F]"
                            : ""}
                        >{highChange !== 0 ? highChange + "%" : "n/a"}</td
                      ></tr
                    ></tbody
                  >
                </table>
              </div>
            </div>
          </div>

          <div
            class="w-full shadow-xs rounded-sm border border-gray-300 dark:border-gray-600 mt-8 p-3 divide-gray-300 dark:divide-gray-600 lg:flex lg:space-x-4 lg:divide-x"
          >
            <div class="flex flex-col justify-between p-1 lg:max-w-[32%]">
              <div>
                <div class="flex flex-row items-center">
                  <h2 class="mb-1 text-xl font-bold">
                    Latest Analyst Insight Report
                  </h2>
                  {#if latestInfoDate(data?.getAnalystInsight?.date)}
                    <label
                      class="bg-black dark:bg-[#fff] rounded text-white dark:text-black font-semibold text-xs px-2 py-0.5 ml-3"
                      >New</label
                    >
                  {/if}
                </div>
                {#if Object?.keys(data?.getAnalystInsight)?.length > 0}
                  {#if ["Pro", "Plus"]?.includes(data?.user?.tier)}
                    <p class="pr-2 sm:pr-4">
                      {data?.getAnalystInsight?.insight}
                    </p>
                    <p class="mt-5 italic text-sm">
                      Updated {data?.getAnalystInsight?.date}
                    </p>
                  {:else}
                    <p>
                      {data?.getAnalystInsight?.insight?.slice(0, 50) + "..."}
                      <span class="mt-3">
                        Unlock content with
                        <a
                          class="inline-block ml-0.5 text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
                          href="/pricing"
                          >Pro Subscription <svg
                            class="w-4 h-4 mb-1 inline-block text[#A3A3A3] sm:hover:"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            ><path
                              fill="currentColor"
                              d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                            /></svg
                          ></a
                        >
                      </span>
                    </p>

                    <p class="mt-5 italic text-sm">
                      Updated {data?.getAnalystInsight?.date}
                    </p>
                  {/if}
                {:else if numOfAnalyst > 0}
                  <p>
                    According to {numOfAnalyst} stock analyst, the rating for {$displayCompanyName}
                    is "{consensusRating}". This means that the analyst believes
                    this stock is likely to lead to {[
                      "Strong Sell",
                      "Sell",
                    ]?.includes(consensusRating)
                      ? "lower"
                      : ["Strong Buy", "Buy"]?.includes(consensusRating)
                        ? "higher"
                        : "similar"} returns than market as a whole.
                  </p>
                {:else}
                  <div class="min-w-[500px]">
                    No Analyst Data available yet.
                  </div>
                {/if}
              </div>
            </div>
            <div class="grow pt-2 md:pt-4 lg:pl-4 lg:pt-0">
              {#if optionsBarChart !== null && numOfAnalyst > 0}
                <div
                  class="shadow-xs border border-gray-300 dark:border-gray-800 rounded"
                  use:highcharts={optionsBarChart}
                ></div>
              {:else}
                <div
                  class="min-h-[200px] sm:min-h-[300px] text-lg sm:text-xl font-bold shadow-xs border border-gray-300 dark:border-gray-800 rounded flex justify-center items-center"
                >
                  No Chart available
                </div>
              {/if}
              <div
                class=" mb-1 mt-2 overflow-x-auto px-1.5 text-center md:mb-0 md:px-0 lg:mt-2"
              >
                <table
                  class="w-full text-right text-tiny xs:text-sm md:text-smaller"
                >
                  <thead
                    ><tr
                      class="border-b border-gray-300 dark:border-gray-600 font-normal"
                      ><th
                        class="whitespace-nowrap px-1 py-[3px] text-sm sm:text-[1rem] text-left font-semibold"
                        >Rating</th
                      >
                      {#each recommendationList as item}
                        <th
                          class="px-1 py-[3px] text-sm sm:text-[1rem] text-right font-semibold"
                        >
                          {new Intl.DateTimeFormat("en", {
                            month: "short",
                            year: "2-digit",
                            timeZone: "UTC",
                          }).format(new Date(item?.date))}
                        </th>
                      {/each}
                    </tr></thead
                  >
                  <tbody>
                    {#each categories as category}
                      <tr
                        class="border-b border-gray-300 dark:border-gray-600 font-normal"
                      >
                        <td
                          class="whitespace-nowrap px-1 py-[3px] text-sm sm:text-[1rem] text-left"
                          >{category}</td
                        >
                        {#each recommendationList as entry}
                          <td
                            class="px-1 py-[3px] text-sm sm:text-[1rem] text-right"
                            >{entry[category]}</td
                          >
                        {/each}
                      </tr>
                    {/each}
                    <tr class="font-semibold"> </tr><tr class="font-semibold">
                      <td
                        class="whitespace-nowrap px-1 py-[3px] text-sm sm:text-[1rem] text-left"
                        >Total</td
                      >
                      {#each recommendationList as _, i}
                        <td
                          class="px-1 py-[3px] text-sm sm:text-[1rem] text-right"
                        >
                          {getTotalForDate(i, recommendationList)}
                        </td>
                      {/each}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <h2 class="mt-8 text-xl sm:text-2xl font-bold mb-4">
            Financial Forecast this Year
          </h2>
          {#if data?.getAnalystEstimate?.length !== 0}
            <div
              class="mb-4 shadow-xs grid grid-cols-1 overflow-hidden rounded border divide-gray-300 dark:divide-gray-600 border-gray-300 dark:border-gray-600 md:grid-cols-2 lg:grid-cols-4"
            >
              <div
                class="border-b px-3 py-5 last:border-b-0 xs:px-4 sm:p-6 md:border-b lg:border-b-0 border-gray-300 dark:border-gray-600"
              >
                <div class=" font-normal">Revenue This Year</div>
                <div
                  class="mt-1 flex flex-wrap items-baseline justify-between space-y-2 bp:space-y-0"
                >
                  <div class="flex items-baseline text-2xl font-semibold">
                    {data?.getAnalystEstimate[index]?.estimatedRevenueAvg !==
                      null &&
                    data?.getAnalystEstimate[index]?.estimatedRevenueAvg !== 0
                      ? abbreviateNumber(
                          data?.getAnalystEstimate[index]?.estimatedRevenueAvg,
                        )
                      : "n/a"}
                    {#if data?.getAnalystEstimate[index]?.estimatedRevenueAvg !== null && data?.getAnalystEstimate[index]?.estimatedRevenueAvg !== 0}
                      <div class="ml-2 block text-sm font-semibold lg:hidden">
                        from {data?.getAnalystEstimate[index - 1]?.revenue !==
                        undefined
                          ? abbreviateNumber(
                              data?.getAnalystEstimate[index - 1]?.revenue,
                            )
                          : "n/a"}
                      </div>
                    {/if}
                  </div>
                  {#if data?.getAnalystEstimate[index]?.estimatedRevenueAvg !== null && data?.getAnalystEstimate[index]?.estimatedRevenueAvg !== 0}
                    <div
                      class="inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-semibold md:mt-2 lg:mt-0 {changeRevenue >
                      0
                        ? 'bg-[#00FC50]'
                        : 'bg-[#FF2F1F]'} text-black"
                    >
                      <svg
                        class="-ml-1 mr-0.5 h-5 w-5 shrink-0 self-center text-black {changeRevenue >
                        0
                          ? ''
                          : 'rotate-180 '}"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        style="max-width:40px"
                        aria-hidden="true"
                        ><path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M7 11l5-5m0 0l5 5m-5-5v12"
                        ></path></svg
                      > <span class="sr-only">Increased by</span>
                      {abbreviateNumber(changeRevenue?.toFixed(1))}%
                    </div>
                  {/if}
                </div>
                {#if data?.getAnalystEstimate[index]?.estimatedRevenueAvg !== null && data?.getAnalystEstimate[index]?.estimatedRevenueAvg !== 0}
                  <div
                    class="ml-0.5 mt-1.5 hidden text-sm font-semibold lg:block"
                  >
                    from {data?.getAnalystEstimate[index - 1]?.revenue !== null
                      ? abbreviateNumber(
                          data?.getAnalystEstimate[index - 1]?.revenue,
                        )
                      : "n/a"}
                  </div>
                {/if}
              </div>
              <div
                class="border-b px-3 py-5 last:border-b-0 xs:px-4 sm:p-6 md:border-b md:border-l lg:border-b-0"
              >
                <div class=" font-normal">Revenue Next Year</div>
                <div
                  class="mt-1 flex flex-wrap items-baseline justify-between space-y-2 bp:space-y-0"
                >
                  <div class="flex items-baseline text-2xl font-semibold">
                    {data?.getAnalystEstimate[index + 1]
                      ?.estimatedRevenueAvg !== undefined
                      ? abbreviateNumber(
                          data?.getAnalystEstimate[index + 1]
                            ?.estimatedRevenueAvg,
                        )
                      : "n/a"}
                    <div class="ml-2 block text-sm font-semibold lg:hidden">
                      from {data?.getAnalystEstimate[index]
                        ?.estimatedRevenueAvg !== undefined
                        ? abbreviateNumber(
                            data?.getAnalystEstimate[index]
                              ?.estimatedRevenueAvg,
                          )
                        : "n/a"}
                    </div>
                  </div>
                  <div
                    class="inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-semibold md:mt-2 lg:mt-0 {changeRevenueNextYear >
                    0
                      ? 'bg-[#00FC50]'
                      : 'bg-[#FF2F1F]'} text-black"
                  >
                    <svg
                      class="-ml-1 mr-0.5 h-5 w-5 shrink-0 self-center text-black {changeRevenueNextYear >
                      0
                        ? ''
                        : 'rotate-180 '}"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      style="max-width:40px"
                      aria-hidden="true"
                      ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 11l5-5m0 0l5 5m-5-5v12"
                      ></path></svg
                    > <span class="sr-only">Increased by</span>
                    {abbreviateNumber(changeRevenueNextYear?.toFixed(1))}%
                  </div>
                </div>
                <div
                  class="ml-0.5 mt-1.5 hidden text-sm font-semibold lg:block"
                >
                  from {data?.getAnalystEstimate[index]?.estimatedRevenueAvg !==
                  undefined
                    ? abbreviateNumber(
                        data?.getAnalystEstimate[index]?.estimatedRevenueAvg,
                      )
                    : "n/a"}
                </div>
              </div>
              <div
                class="border-b px-3 py-5 last:border-b-0 xs:px-4 sm:p-6 md:border-b-0 lg:border-l"
              >
                <div class=" font-normal">EPS This Year</div>
                <div
                  class="mt-1 flex flex-wrap items-baseline justify-between space-y-2 bp:space-y-0"
                >
                  <div class="flex items-baseline text-2xl font-semibold">
                    {abbreviateNumber(
                      data?.getAnalystEstimate[index]?.estimatedEpsAvg,
                    )}
                    <div class="ml-2 block text-sm font-semibold lg:hidden">
                      from {data?.getAnalystEstimate[index - 1]?.eps}
                    </div>
                  </div>
                  <div
                    class="inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-semibold md:mt-2 lg:mt-0 {changeEPS >
                    0
                      ? 'bg-[#00FC50]'
                      : 'bg-[#FF2F1F]'} text-black"
                  >
                    <svg
                      class="-ml-1 mr-0.5 h-5 w-5 shrink-0 self-center text-black {changeEPS >
                      0
                        ? ''
                        : 'rotate-180 '}"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      style="max-width:40px"
                      aria-hidden="true"
                      ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 11l5-5m0 0l5 5m-5-5v12"
                      ></path></svg
                    > <span class="sr-only">Increased by</span>
                    {abbreviateNumber(changeEPS?.toFixed(1))}%
                  </div>
                </div>
                <div
                  class="ml-0.5 mt-1.5 hidden text-sm font-semibold lg:block"
                >
                  from {data?.getAnalystEstimate[index - 1]?.eps}
                </div>
              </div>
              <div
                class="border-b px-3 py-5 last:border-b-0 xs:px-4 sm:p-6 md:border-l border-gray-300 dark:border-gray-600"
              >
                <div class=" font-normal">EPS Next Year</div>
                <div
                  class="mt-1 flex flex-wrap items-baseline justify-between space-y-2 bp:space-y-0"
                >
                  <div class="flex items-baseline text-2xl font-semibold">
                    {abbreviateNumber(
                      data?.getAnalystEstimate[index + 1]?.estimatedEpsAvg,
                    )}
                    <div class="ml-2 block text-sm font-semibold lg:hidden">
                      from {abbreviateNumber(
                        data?.getAnalystEstimate[index]?.estimatedEpsAvg,
                      )}
                    </div>
                  </div>
                  <div
                    class="inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-semibold md:mt-2 lg:mt-0 {changeEPSNextYear >
                    0
                      ? 'bg-[#00FC50]'
                      : 'bg-[#FF2F1F] '} text-black"
                  >
                    <svg
                      class="-ml-1 mr-0.5 h-5 w-5 shrink-0 self-center text-black {changeEPSNextYear >
                      0
                        ? ''
                        : 'rotate-180 '}"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      style="max-width:40px"
                      aria-hidden="true"
                      ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 11l5-5m0 0l5 5m-5-5v12"
                      ></path></svg
                    > <span class="sr-only">Increased by</span>
                    {abbreviateNumber(changeEPSNextYear?.toFixed(1))}%
                  </div>
                </div>
                <div
                  class="ml-0.5 mt-1.5 hidden text-sm font-semibold lg:block"
                >
                  from {abbreviateNumber(
                    data?.getAnalystEstimate[index]?.estimatedEpsAvg,
                  )}
                </div>
              </div>
            </div>

            <div
              class="w-full m-auto {!$analystEstimateComponent ? 'hidden' : ''}"
            >
              {#await import("$lib/components/AnalystEstimate.svelte") then { default: Comp }}
                <svelte:component this={Comp} {data} />
              {/await}
            </div>
          {:else}
            <div
              class=" p-3 sm:p-5 mb-10 rounded sm:flex sm:flex-row sm:items-center border border-gray-300 dark:border-gray-600 text-sm sm:text-[1rem]"
            >
              <svg
                class="w-6 h-6 shrink-0 inline-block sm:mr-2"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 256 256"
                ><path
                  fill="#fff"
                  d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"
                /></svg
              >
              No analyst forecast available for {$displayCompanyName}.
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</section>

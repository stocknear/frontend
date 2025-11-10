<script lang="ts">
  import { analystEstimateComponent, stockTicker } from "$lib/store";
  import { abbreviateNumber, computeGrowthSingleList } from "$lib/utils";
  import EstimationGraph from "$lib/components/EstimationGraph.svelte";

  import Lazy from "svelte-lazy";
  import { mode } from "mode-watcher";

  export let data;

  let analystEstimateList = [];
  let isLoaded = false;

  let xData = [];
  let optionsRevenue = null;
  let optionsEPS = null;
  let optionsNetIncome = null;
  let optionsEbitda = null;

  let optionsRevenueGrowth = null;
  let optionsEPSGrowth = null;
  let optionsNetIncomeGrowth = null;
  let optionsEbitdaGrowth = null;

  let revenueDateList = [];
  let avgRevenueList = [];
  let lowRevenueList = [];
  let highRevenueList = [];

  let epsDateList = [];
  let avgEPSList = [];
  let lowEPSList = [];
  let highEPSList = [];

  let netIncomeDateList = [];
  let avgNetIncomeList = [];
  let lowNetIncomeList = [];
  let highNetIncomeList = [];

  let ebitdaDateList = [];
  let avgEbitdaList = [];
  let lowEbitdaList = [];
  let highEbitdaList = [];

  let revenueAvgGrowthList = [];
  let epsAvgGrowthList = [];
  let netIncomeAvgGrowthList = [];
  let ebitdaAvgGrowthList = [];

  function fillMissingDates(dates, highGrowthList) {
    // Get the current year
    const currentYear = new Date().getFullYear();
    const currentFiscalYear = `FY${currentYear % 100}`; // Get the current fiscal year (e.g., 2024 => FY24)

    // Create a map from the highGrowthList for quick lookup
    const highGrowthMap = new Map(
      highGrowthList?.map((item) => [`FY${item.FY}`, item]),
    );

    // Generate the complete list based on the dates array
    return dates?.map((date) => {
      // Check if the date is the current fiscal year or it exists in the map
      const data = highGrowthMap?.get(date) || {
        FY: date?.slice(2),
        val: null,
        growth: null,
      };

      // If the fiscal year is the current one, set val and growth to null
      if (date === currentFiscalYear) {
        data.val = null;
        data.growth = null;
      }

      return data;
    });
  }

  function computeGrowthList(tableActualRevenue, tableForecastRevenue) {
    return tableActualRevenue?.map((item, index) => {
      const currentFY = item?.FY;

      // If it's the first item or the list is empty, return null growth
      if (index === 0 || tableActualRevenue.length === 0) {
        return { FY: currentFY, growth: null };
      }

      // If actual value is null, compute growth based on forecast values
      if (item?.val === null) {
        const prevForecastVal = tableForecastRevenue[index - 1]?.val ?? 0;
        const currentForecastVal = tableForecastRevenue[index]?.val ?? 0;

        if (prevForecastVal === 0 || currentForecastVal === 0) {
          return { FY: currentFY, growth: null };
        }

        const forecastGrowth =
          ((currentForecastVal - prevForecastVal) / Math.abs(prevForecastVal)) *
          100;

        return {
          FY: currentFY,
          growth:
            forecastGrowth !== 0 ? Number(forecastGrowth?.toFixed(2)) : null,
        };
      }

      // Compute actual growth for non-null actual values
      const prevActualVal = tableActualRevenue[index - 1]?.val ?? 0;
      const currentActualVal = item?.val ?? 0;

      if (prevActualVal === 0 || currentActualVal === 0) {
        return { FY: currentFY, growth: null };
      }

      const actualGrowth =
        ((currentActualVal - prevActualVal) / Math.abs(prevActualVal)) * 100;

      return {
        FY: currentFY,
        growth: actualGrowth !== 0 ? Number(actualGrowth.toFixed(2)) : null,
      };
    });
  }

  function findIndex(data) {
    const currentYear = new Date().getFullYear();
    // Find the index where the item's date is greater than or equal to the current year and revenue is null
    let index = data.findIndex(
      (item) => item.date >= currentYear && item?.revenue === null,
    );

    // Check if there is any item for the current year with non-null revenue
    const hasNonNullRevenue = data?.some(
      (item) => item.date === currentYear && item.revenue !== null,
    );

    // Add +1 to the index if the condition is met
    return index !== -1 && hasNonNullRevenue ? index + 1 : index;
  }

  let tableActualRevenue = [];
  let tableForecastRevenue = [];
  let tableCombinedRevenue = [];

  let tableActualEPS = [];
  let tableForecastEPS = [];
  let tableCombinedEPS = [];

  let tableActualNetIncome = [];
  let tableCombinedNetIncome = [];
  let tableForecastNetIncome = [];

  let tableActualEbitda = [];
  let tableCombinedEbitda = [];
  let tableForecastEbitda = [];

  function getPlotOptions(dataType: string) {
    let dates = [];
    let valueList = [];
    let avgList = [];
    let lowList = [];
    let highList = [];
    let filteredData =
      analystEstimateList?.filter((item) => item.date >= 2019) ?? [];
    const stopIndex = findIndex(filteredData);

    if (filteredData) {
      filteredData.forEach((item, index) => {
        const date = item.date?.toString().slice(-2);
        const isAfterStartIndex = stopIndex <= index + 1;
        dates.push(`FY${date}`);
        switch (dataType) {
          case "Revenue":
            valueList.push(isAfterStartIndex ? null : item.revenue);
            avgList.push(isAfterStartIndex ? item?.estimatedRevenueAvg : null);
            lowList.push(isAfterStartIndex ? item?.estimatedRevenueLow : null);
            highList.push(
              isAfterStartIndex ? item?.estimatedRevenueHigh : null,
            );
            break;
          case "EPS":
            valueList.push(isAfterStartIndex ? null : item.eps);
            avgList.push(isAfterStartIndex ? item.estimatedEpsAvg : null);
            lowList.push(isAfterStartIndex ? item.estimatedEpsLow : null);
            highList.push(isAfterStartIndex ? item.estimatedEpsHigh : null);
            break;
          case "NetIncome":
            valueList.push(isAfterStartIndex ? null : item.netIncome);
            avgList.push(isAfterStartIndex ? item.estimatedNetIncomeAvg : null);
            lowList.push(isAfterStartIndex ? item.estimatedNetIncomeLow : null);
            highList.push(
              isAfterStartIndex ? item.estimatedNetIncomeHigh : null,
            );
            break;
          case "Ebitda":
            valueList.push(isAfterStartIndex ? null : item.ebitda);
            avgList.push(isAfterStartIndex ? item.estimatedEbitdaAvg : null);
            lowList.push(isAfterStartIndex ? item.estimatedEbitdaLow : null);
            highList.push(isAfterStartIndex ? item.estimatedEbitdaHigh : null);
            break;
          default:
            break;
        }
      });
    }

    try {
      const lastValue = valueList[stopIndex - 2];
      avgList[stopIndex - 2] = lastValue;
      lowList[stopIndex - 2] = lastValue;
      highList[stopIndex - 2] = lastValue;
    } catch (e) {
      console.log(e);
    }

    // Normalize the data if needed (not required in this case, but leaving it here for reference)

    let currentYearSuffix = new Date().getFullYear()?.toString().slice(-2);
    let searchString = `FY${currentYearSuffix}`;
    let currentYearIndex = dates?.findIndex((date) => date === searchString);

    // Assign to global variables based on dataType
    if (dataType === "Revenue") {
      revenueDateList = dates?.slice(currentYearIndex) || [];
      avgRevenueList =
        avgList?.slice(currentYearIndex)?.map((val, index) => ({
          FY: revenueDateList[index]?.slice(2),
          val: val,
        })) || [];
      lowRevenueList =
        lowList?.slice(currentYearIndex)?.map((val, index) => ({
          FY: revenueDateList[index]?.slice(2),
          val: val,
        })) || [];
      highRevenueList =
        highList?.slice(currentYearIndex)?.map((val, index) => ({
          FY: revenueDateList[index]?.slice(2),
          val: val,
        })) || [];
    } else if (dataType === "EPS") {
      epsDateList = dates?.slice(currentYearIndex) || [];
      avgEPSList =
        avgList?.slice(currentYearIndex)?.map((val, index) => ({
          FY: epsDateList[index]?.slice(2),
          val: val,
        })) || [];
      lowEPSList =
        lowList?.slice(currentYearIndex)?.map((val, index) => ({
          FY: epsDateList[index]?.slice(2),
          val: val,
        })) || [];
      highEPSList =
        highList?.slice(currentYearIndex)?.map((val, index) => ({
          FY: epsDateList[index]?.slice(2),
          val: val,
        })) || [];
    } else if (dataType === "NetIncome") {
      netIncomeDateList = dates?.slice(currentYearIndex) || [];
      avgNetIncomeList =
        avgList?.slice(currentYearIndex)?.map((val, index) => ({
          FY: netIncomeDateList[index]?.slice(2),
          val: val,
        })) || [];
      lowNetIncomeList =
        lowList?.slice(currentYearIndex)?.map((val, index) => ({
          FY: netIncomeDateList[index]?.slice(2),
          val: val,
        })) || [];
      highNetIncomeList =
        highList?.slice(currentYearIndex)?.map((val, index) => ({
          FY: netIncomeDateList[index]?.slice(2),
          val: val,
        })) || [];
    } else if (dataType === "Ebitda") {
      ebitdaDateList = dates?.slice(currentYearIndex) || [];
      avgEbitdaList =
        avgList?.slice(currentYearIndex)?.map((val, index) => ({
          FY: ebitdaDateList[index]?.slice(2),
          val: val,
        })) || [];
      lowEbitdaList =
        lowList?.slice(currentYearIndex)?.map((val, index) => ({
          FY: ebitdaDateList[index]?.slice(2),
          val: val,
        })) || [];
      highEbitdaList =
        highList?.slice(currentYearIndex)?.map((val, index) => ({
          FY: ebitdaDateList[index]?.slice(2),
          val: val,
        })) || [];
    }
    const growthList = dates?.map((date) => {
      const fy = parseInt(date.replace("FY", ""), 10); // Extract numeric FY value
      const listToUse =
        dataType === "Revenue"
          ? revenueAvgGrowthList
          : dataType === "EPS"
            ? epsAvgGrowthList
            : dataType === "NetIncome"
              ? netIncomeAvgGrowthList
              : ebitdaAvgGrowthList; // Select the correct growth list
      const growth = listToUse?.find((r) => r.FY === fy); // Find matching FY
      return growth ? growth?.growth : null; // Return growth or null if not found
    });

    const option = {
      credits: {
        enabled: false,
      },
      legend: {
        enabled: false,
      },
      plotOptions: {
        series: {
          animation: false,
          marker: {
            enabled: false,
            states: {
              hover: { enabled: false }, // Disable marker on hover
              select: { enabled: false }, // Disable marker on selection
            },
          },
        },
      },
      chart: {
        type: "line",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 360,
        animation: false,
      },
      title: {
        text: null,
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
          let tooltipContent = `<span class=" m-auto  text-[1rem] font-[501]">${
            this?.x
          }</span><br>`;

          // Loop through each point in the shared tooltip
          this.points?.forEach((point) => {
            tooltipContent += `<span class=" font-semibold text-sm">${point.series.name}:</span> 
          <span class=" font-normal text-sm" >${abbreviateNumber(
            point.y,
          )}</span><br>`;
          });

          return tooltipContent;
        },
      },
      xAxis: {
        categories: dates,
        type: "datetime",
        endOnTick: false,
        categories: dates,
        crosshair: {
          color: $mode === "light" ? "#545454" : "white", // Set the color of the crosshair line
          width: 1, // Adjust the line width as needed
          dashStyle: "Solid",
        },

        labels: {
          style: {
            color: $mode === "light" ? "#545454" : "white",
            fontSize: "12px",
          },
        },
      },
      yAxis: {
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
        },
        title: { text: null },
        opposite: true,
      },
      series: [
        {
          name: "Actual",
          data: valueList,
          color: $mode === "light" ? "#2C6288" : "white",
          animation: false,
          lineWidth: 2.5,
        },
        {
          name: "Avg",
          data: avgList,
          color: $mode === "light" ? "#2C6288" : "white",
          dashStyle: "Dash", // Dashed line style
          animation: false,
          marker: {
            enabled: false,
          },
          lineWidth: 2.5,
        },
        {
          name: "Low",
          data: lowList,
          // If you want a dashed line with a different color, set the series color to that color.
          color: $mode === "light" ? "#8AAAC0" : "#c2c7cf",
          dashStyle: "Dash",
          animation: false,
          lineWidth: 2.5,
        },
        {
          name: "High",
          data: highList,
          color: $mode === "light" ? "#8AAAC0" : "#c2c7cf",
          dashStyle: "Dash",
          animation: false,
          lineWidth: 2.5,
        },
      ],
    };

    let highGrowthList = [];
    let lowGrowthList = [];
    if (dataType === "Revenue") {
      highGrowthList = computeGrowthSingleList(highRevenueList, avgRevenueList);
      lowGrowthList = computeGrowthSingleList(lowRevenueList, avgRevenueList);
    } else if (dataType === "EPS") {
      highGrowthList = computeGrowthSingleList(highEPSList, avgEPSList);
      lowGrowthList = computeGrowthSingleList(lowEPSList, avgEPSList);
    } else if (dataType === "NetIncome") {
      highGrowthList = computeGrowthSingleList(
        highNetIncomeList,
        avgNetIncomeList,
      );
      lowGrowthList = computeGrowthSingleList(
        lowNetIncomeList,
        avgNetIncomeList,
      );
    } else if (dataType === "Ebitda") {
      highGrowthList = computeGrowthSingleList(highEbitdaList, avgEbitdaList);
      lowGrowthList = computeGrowthSingleList(lowEbitdaList, avgEbitdaList);
    }

    highGrowthList = fillMissingDates(dates, highGrowthList)?.map(
      (item) => item?.growth,
    );

    lowGrowthList = fillMissingDates(dates, lowGrowthList)?.map(
      (item) => item?.growth,
    );

    const optionsGrowth = {
      credits: {
        enabled: false,
      },
      legend: {
        enabled: false,
      },
      plotOptions: {
        series: {
          animation: false,
        },
      },
      chart: {
        type: "column",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 360,
        animation: false,
      },
      title: {
        text: null,
      },
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 1)", // Semi-transparent black
        borderColor: "rgba(255, 255, 255, 0.2)", // Slightly visible white border
        borderWidth: 1,
        style: {
          color: "white",
          fontSize: "14px",
          padding: "10px",
        },
        borderRadius: 4,
        formatter: function () {
          // Find the main series point (exclude error bar points)
          const mainPoint = this.points.find(
            (p) => p.series.type !== "errorbar",
          );
          const idx = mainPoint.point.index;
          const mainValue = mainPoint.y;
          let tooltipContent = `<b style="font-weight:501;">${dates[idx]}</b><br>`;

          // Use highGrowthList and lowGrowthList from outer scope
          const high = highGrowthList[idx];
          const low = lowGrowthList[idx];

          if (high && high !== "N/A") {
            tooltipContent += `<span style="font-weight:501;">High:</span> ${high.toFixed(2)}<br>`;
          }
          if (mainValue && mainValue !== "N/A") {
            tooltipContent += `<span style="font-weight:501;">Avg:</span> ${mainValue.toFixed(2)}<br>`;
          }
          if (low && low !== "N/A") {
            tooltipContent += `<span style="font-weight:501;">Low:</span> ${low.toFixed(2)}<br>`;
          }
          return tooltipContent;
        },
      },

      xAxis: {
        categories: dates,
        type: "datetime",
        labels: {
          style: {
            color: $mode === "light" ? "#545454" : "white",
            fontSize: "12px",
          },
        },
      },
      yAxis: {
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
        },
        title: { text: null },
        opposite: true,
      },
      series: [
        {
          // Dynamically set the series name based on dataType
          name:
            dataType === "Revenue"
              ? "Revenue Growth"
              : dataType === "EPS"
                ? "EPS Growth"
                : dataType === "NetIncome"
                  ? "Net Income Growth"
                  : "EBITDA Growth",
          data: growthList?.map((value) => ({
            y: value,
            // Set color based on the sign of the value
            color:
              value >= 0
                ? $mode === "light"
                  ? "#338D73"
                  : "#00FC50"
                : "#ED3333",
            borderColor:
              value >= 0
                ? $mode === "light"
                  ? "#338D73"
                  : "#00FC50"
                : "#ED3333",
            borderRadius: "1px",
          })),
          zIndex: 5,
          // 'smooth' is not applicable for column charts
        },
        {
          name: "Error Bars",
          type: "errorbar",
          // Prepare data as [low, high] pairs for each index.
          data: growthList?.map((value, index) => {
            const high = highGrowthList[index];
            const low = lowGrowthList[index];
            // If either high or low is null/undefined, return nulls.
            return high != null && low != null ? [low, high] : [null, null];
          }),
          color: $mode === "light" ? "#545454" : "white",
          lineWidth: 1, // Thicker lines for error bars
          whiskerLength: 10, // Adjust whisker length as needed
          zIndex: 10,
          // Disable tooltip for error bar points
          tooltip: {
            pointFormatter: function () {
              return "";
            },
          },
        },
      ],
    };

    if (dataType === "Revenue") {
      optionsRevenue = option;
      optionsRevenueGrowth = optionsGrowth;
    } else if (dataType === "EPS") {
      optionsEPS = option;
      optionsEPSGrowth = optionsGrowth;
    } else if (dataType === "NetIncome") {
      optionsNetIncome = option;
      optionsNetIncomeGrowth = optionsGrowth;
    } else if (dataType === "Ebitda") {
      optionsEbitda = option;
      optionsEbitdaGrowth = optionsGrowth;
    }
  }

  //To-do: Optimize this piece of shit
  function prepareData() {
    tableActualRevenue = [];
    tableForecastRevenue = [];
    tableCombinedRevenue = [];

    tableActualEPS = [];
    tableCombinedEPS = [];
    tableForecastEPS = [];

    tableActualNetIncome = [];
    tableCombinedNetIncome = [];
    tableForecastNetIncome = [];

    tableActualEbitda = [];
    tableCombinedEbitda = [];
    tableForecastEbitda = [];

    revenueAvgGrowthList = [];
    epsAvgGrowthList = [];
    netIncomeAvgGrowthList = [];
    ebitdaAvgGrowthList = [];

    let filteredData =
      analystEstimateList?.filter((item) => item.date >= 2015) ?? [];

    xData = filteredData?.map(({ date }) => Number(String(date)?.slice(-2)));
    //============================//
    //Revenue Data
    filteredData?.forEach((item) => {
      tableActualRevenue?.push({
        FY: Number(String(item?.date)?.slice(-2)),
        val: item?.revenue,
      });
      tableForecastRevenue?.push({
        FY: Number(String(item?.date)?.slice(-2)),
        val: item?.estimatedRevenueAvg,
        numOfAnalysts: item?.numOfAnalysts,
      });
    });

    tableCombinedRevenue = tableActualRevenue?.map((item1) => {
      // Find the corresponding item in data2 based on "FY"
      const item2 = tableForecastRevenue?.find(
        (item2) => item2?.FY === item1?.FY,
      );

      // If the value in data1 is null, replace it with the value from data2
      return {
        FY: item1.FY,
        val: item1.val === null ? item2.val : item1.val,
        numOfAnalysts: item2.numOfAnalysts,
      };
    });

    //============================//
    //NetIncome Data
    filteredData?.forEach((item) => {
      tableActualNetIncome?.push({
        FY: Number(String(item?.date)?.slice(-2)),
        val: item?.netIncome,
      });
      tableForecastNetIncome?.push({
        FY: Number(String(item?.date)?.slice(-2)),
        val: item?.estimatedNetIncomeAvg,
      });
    });

    tableCombinedNetIncome = tableActualNetIncome?.map((item1) => {
      // Find the corresponding item in data2 based on "FY"
      const item2 = tableForecastNetIncome?.find(
        (item2) => item2?.FY === item1?.FY,
      );

      // If the value in data1 is null, replace it with the value from data2
      return {
        FY: item1.FY,
        val: item1.val === null ? item2.val : item1.val,
      };
    });

    //============================//
    //Ebitda Data
    filteredData?.forEach((item) => {
      tableActualEbitda?.push({
        FY: Number(String(item?.date)?.slice(-2)),
        val: item?.ebitda,
      });
      tableForecastEbitda?.push({
        FY: Number(String(item?.date)?.slice(-2)),
        val: item?.estimatedEbitdaAvg,
      });
    });

    tableCombinedEbitda = tableActualEbitda?.map((item1) => {
      // Find the corresponding item in data2 based on "FY"
      const item2 = tableForecastEbitda?.find(
        (item2) => item2?.FY === item1?.FY,
      );

      // If the value in data1 is null, replace it with the value from data2
      return {
        FY: item1.FY,
        val: item1.val === null ? item2.val : item1.val,
      };
    });

    //============================//
    //EPS Data
    filteredData?.forEach((item) => {
      tableActualEPS?.push({
        FY: Number(String(item?.date)?.slice(-2)),
        val: item?.eps,
      });
      tableForecastEPS?.push({
        FY: Number(String(item?.date)?.slice(-2)),
        val: item?.estimatedEpsAvg,
      });
    });

    tableCombinedEPS = tableActualEPS?.map((item1) => {
      // Find the corresponding item in data2 based on "FY"
      const item2 = tableForecastEPS?.find((item2) => item2?.FY === item1?.FY);

      // If the value in data1 is null, replace it with the value from data2
      return {
        FY: item1.FY,
        val: item1.val === null ? item2.val : item1.val,
      };
    });

    //Values coincide with table values for crosscheck
    revenueAvgGrowthList = computeGrowthList(
      tableActualRevenue,
      tableCombinedRevenue,
    );
    netIncomeAvgGrowthList = computeGrowthList(
      tableActualNetIncome,
      tableCombinedNetIncome,
    );

    ebitdaAvgGrowthList = computeGrowthList(
      tableActualEbitda,
      tableCombinedEbitda,
    );
    epsAvgGrowthList = computeGrowthList(tableActualEPS, tableCombinedEPS);
  }

  $: {
    if ($stockTicker || $mode) {
      isLoaded = false;
      analystEstimateList = [];
      analystEstimateList = data?.getAnalystEstimate || [];
      if (analystEstimateList?.length !== 0) {
        prepareData();
        $analystEstimateComponent = true;
        getPlotOptions("Revenue");
        getPlotOptions("EPS");
        getPlotOptions("NetIncome");
        getPlotOptions("Ebitda");
      } else {
        $analystEstimateComponent = false;
      }
      isLoaded = true;
    }
  }
</script>

<section class="overflow-hidden h-full pb-8 sm:pb-2">
  <main class="overflow-hidden">
    <div class="w-full m-auto">
      <div class="flex flex-row items-center"></div>

      {#if isLoaded}
        {#if analystEstimateList?.length !== 0}
          <div
            class=" flex justify-start items-center w-screen sm:w-full mt-2 m-auto overflow-x-auto pr-5 sm:pr-0"
          >
            <table
              class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
            >
              <thead class="text-white bg-default">
                <tr class="">
                  <th class=" font-semibold text-sm text-start">Fiscal Year</th>
                  {#each xData as item}
                    <td class="z-20 font-semibold text-sm text-end"
                      >{"FY" + item}</td
                    >
                  {/each}
                </tr>
              </thead>
              <tbody>
                <tr class=" ">
                  <th
                    class=" whitespace-nowrap text-sm sm:text-[1rem] text-start font-normal"
                  >
                    Revenue
                  </th>
                  {#each tableCombinedRevenue as item}
                    <td class=" text-sm sm:text-[1rem] text-end">
                      {item?.val === "0.00" ||
                      item?.val === null ||
                      item?.val === 0
                        ? "n/a"
                        : abbreviateNumber(item?.val.toFixed(2))}
                    </td>
                  {/each}
                </tr>

                <tr class="bg-[#F6F7F8] dark:bg-odd">
                  <th
                    class=" whitespace-nowrap text-sm sm:text-[1rem] text-start font-normal"
                  >
                    Revenue Growth
                  </th>
                  {#each computeGrowthList(tableActualRevenue, tableCombinedRevenue) as item, index}
                    <td class=" text-sm sm:text-[1rem] text-end">
                      {#if index === 0 || item?.growth === null}
                        n/a
                      {:else if tableActualRevenue[index]?.val === null}
                        <span
                          class="text-orange-800 dark:text-orange-400 {item?.growth >
                          0
                            ? "before:content-['+']"
                            : ''}"
                        >
                          {item?.growth}%&#42;
                        </span>
                      {:else}
                        <span
                          class={item?.growth > 0
                            ? "text-green-800 dark:text-[#00FC50] before:content-['+']"
                            : item?.growth < 0
                              ? "text-red-800 dark:text-[#FF2F1F]"
                              : ""}
                        >
                          {item?.growth}%
                        </span>
                      {/if}
                    </td>
                  {/each}
                </tr>

                <tr class="">
                  <th
                    class=" whitespace-nowrap text-sm sm:text-[1rem] text-start font-normal"
                  >
                    EPS
                  </th>
                  {#each tableCombinedEPS as item}
                    <td class=" text-sm sm:text-[1rem] text-end">
                      {item?.val === "0.00" ||
                      item?.val === null ||
                      item?.val === 0
                        ? "-"
                        : abbreviateNumber(item?.val.toFixed(2))}
                    </td>
                  {/each}
                </tr>

                <tr class="bg-[#F6F7F8] dark:bg-odd">
                  <th
                    class=" whitespace-nowrap text-sm sm:text-[1rem] font-normal text-start"
                  >
                    EPS Growth
                  </th>
                  {#each computeGrowthList(tableActualEPS, tableCombinedEPS) as item, index}
                    <td class=" text-sm sm:text-[1rem] text-end">
                      {#if index === 0 || item?.growth === null}
                        n/a
                      {:else if tableActualRevenue[index]?.val === null}
                        <span
                          class="text-orange-800 dark:text-orange-400 {item?.growth >
                          0
                            ? "before:content-['+']"
                            : ''}"
                        >
                          {item?.growth}%&#42;
                        </span>
                      {:else}
                        <span
                          class={item?.growth > 0
                            ? "text-green-800 dark:text-[#00FC50] before:content-['+']"
                            : item?.growth < 0
                              ? "text-red-800 dark:text-[#FF2F1F]"
                              : ""}
                        >
                          {item?.growth}%
                        </span>
                      {/if}
                    </td>
                  {/each}
                </tr>
                <!--
                <tr>
                  <th
                    class=" whitespace-nowrap text-sm sm:text-[1rem] text-start font-normal"
                  >
                    Net Income
                  </th>
                  {#each tableCombinedNetIncome as item}
                    <td class=" text-sm sm:text-[1rem] text-end">
                      {item?.val === "0.00" ||
                      item?.val === null ||
                      item?.val === 0
                        ? "n/a"
                        : abbreviateNumber(item?.val.toFixed(2))}
                    </td>
                  {/each}
                </tr>

                <tr class="bg-[#F6F7F8] dark:bg-odd">
                  <th
                    class=" whitespace-nowrap text-sm sm:text-[1rem] font-normal text-start"
                  >
                    Net Income Growth
                  </th>
                  {#each computeGrowthList(tableActualNetIncome, tableCombinedNetIncome) as item, index}
                    <td class=" text-sm sm:text-[1rem] text-end">
                      {#if index === 0 || item?.growth === null}
                        n/a
                      {:else if tableActualNetIncome[index]?.val === null}
                        <span
                          class="text-orange-800 dark:text-orange-400 {item?.growth >
                          0
                            ? "before:content-['+']"
                            : ''}"
                        >
                          {item?.growth}%&#42;
                        </span>
                      {:else}
                        <span
                          class={item?.growth > 0
                            ? "text-green-800 dark:text-[#00FC50] before:content-['+']"
                            : item?.growth < 0
                              ? "text-red-800 dark:text-[#FF2F1F]"
                              : ""}
                        >
                          {item?.growth}%
                        </span>
                      {/if}
                    </td>
                  {/each}
                </tr>

                <tr>
                  <th
                    class=" whitespace-nowrap text-sm sm:text-[1rem] text-start font-normal"
                  >
                    EBITDA
                  </th>
                  {#each tableCombinedEbitda as item}
                    <td class=" text-sm sm:text-[1rem] text-end">
                      {item?.val === "0.00" ||
                      item?.val === null ||
                      item?.val === 0
                        ? "n/a"
                        : abbreviateNumber(item?.val.toFixed(2))}
                    </td>
                  {/each}
                </tr>

                <tr class="bg-[#F6F7F8] dark:bg-odd">
                  <th
                    class=" whitespace-nowrap text-sm sm:text-[1rem] font-normal text-start"
                  >
                    EBITDA Growth
                  </th>
                  {#each computeGrowthList(tableActualEbitda, tableCombinedEbitda) as item, index}
                    <td class=" text-sm sm:text-[1rem] text-end">
                      {#if index === 0 || item?.growth === null}
                        n/a
                      {:else if tableActualEbitda[index]?.val === null}
                        <span
                          class="text-orange-800 dark:text-orange-400 {item?.growth >
                          0
                            ? "before:content-['+']"
                            : ''}"
                        >
                          {item?.growth}%&#42;
                        </span>
                      {:else}
                        <span
                          class={item?.growth > 0
                            ? "text-green-800 dark:text-[#00FC50] before:content-['+']"
                            : item?.growth < 0
                              ? "text-red-800 dark:text-[#FF2F1F]"
                              : ""}
                        >
                          {item?.growth}%
                        </span>
                      {/if}
                    </td>
                  {/each}
                </tr>
-->
                <tr>
                  <th
                    class=" whitespace-nowrap text-sm sm:text-[1rem] text-start font-normal"
                    >No. Analysts</th
                  >
                  {#each tableCombinedRevenue as item}
                    <td class=" text-sm sm:text-[1rem] text-end">
                      {#if item?.FY > 24}
                        {item?.numOfAnalysts === (null || 0)
                          ? "n/a"
                          : item?.numOfAnalysts}
                      {:else}
                        -
                      {/if}
                    </td>
                  {/each}
                </tr>
              </tbody>
            </table>
          </div>
          <div class=" text-sm mt-2">
            Historical EPS numbers are GAAP, while forecasted numbers may be
            non-GAAP.
          </div>
          <div class="text-orange-800 dark:text-orange-400 text-sm mt-2">
            &#42; This value depends on the forecast
          </div>
          <!--
            <div class="mt-5 text-gray-100 text-sm sm:text-[1rem] sm:rounded h-auto border border-gray-600 p-4">
              <svg class="w-5 h-5 inline-block mr-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"
                ><path fill="#fff" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16" /></svg
              >
              For the current Fiscal Year we use available quarterly data. Complete annual data, used to compare against analyst estimates, is only finalized after the year ends.
            </div>
            -->
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

      <div class="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0 mt-10">
        <Lazy fadeOption={{ delay: 100, duration: 100 }} keep={true}>
          <EstimationGraph
            userTier={data?.user?.tier}
            title="Revenue"
            config={optionsRevenue}
            tableDataList={revenueDateList}
            highDataList={highRevenueList}
            avgDataList={avgRevenueList}
            lowDataList={lowRevenueList}
          />
        </Lazy>

        <Lazy fadeOption={{ delay: 100, duration: 100 }} keep={true}>
          <EstimationGraph
            userTier={data?.user?.tier}
            title="Revenue Growth"
            config={optionsRevenueGrowth}
            tableDataList={revenueDateList}
            highDataList={highRevenueList}
            avgDataList={avgRevenueList}
            lowDataList={lowRevenueList}
            avgGrowthList={revenueAvgGrowthList}
            graphType="growth"
          />
        </Lazy>

        <Lazy fadeOption={{ delay: 100, duration: 100 }} keep={true}>
          <EstimationGraph
            userTier={data?.user?.tier}
            title="EPS"
            config={optionsEPS}
            tableDataList={epsDateList}
            highDataList={highEPSList}
            avgDataList={avgEPSList}
            lowDataList={lowEPSList}
          />
        </Lazy>

        <Lazy fadeOption={{ delay: 100, duration: 100 }} keep={true}>
          <EstimationGraph
            userTier={data?.user?.tier}
            title="EPS Growth"
            config={optionsEPSGrowth}
            tableDataList={epsDateList}
            highDataList={highEPSList}
            avgDataList={avgEPSList}
            lowDataList={lowEPSList}
            avgGrowthList={epsAvgGrowthList}
            graphType="growth"
          />
        </Lazy>

        <!--
        <Lazy fadeOption={{ delay: 100, duration: 100 }} keep={true}>
          <EstimationGraph
            userTier={data?.user?.tier}
            title="Net Income"
            config={optionsNetIncome}
            tableDataList={netIncomeDateList}
            highDataList={highNetIncomeList}
            avgDataList={avgNetIncomeList}
            lowDataList={lowNetIncomeList}
          />
        </Lazy>

        <Lazy fadeOption={{ delay: 100, duration: 100 }} keep={true}>
          <EstimationGraph
            userTier={data?.user?.tier}
            title="Net Income Growth"
            config={optionsNetIncomeGrowth}
            tableDataList={netIncomeDateList}
            highDataList={highNetIncomeList}
            avgDataList={avgNetIncomeList}
            lowDataList={lowNetIncomeList}
            avgGrowthList={netIncomeAvgGrowthList}
            graphType="growth"
          />
        </Lazy>
      
        <Lazy fadeOption={{ delay: 100, duration: 100 }} keep={true}>
          <EstimationGraph
            userTier={data?.user?.tier}
            title="EBITDA"
            config={optionsEbitda}
            tableDataList={ebitdaDateList}
            highDataList={highEbitdaList}
            avgDataList={avgEbitdaList}
            lowDataList={lowEbitdaList}
          />
        </Lazy>

        <Lazy fadeOption={{ delay: 100, duration: 100 }} keep={true}>
          <EstimationGraph
            userTier={data?.user?.tier}
            title="EBITDA Growth"
            config={optionsEbitdaGrowth}
            tableDataList={ebitdaDateList}
            highDataList={highEbitdaList}
            avgDataList={avgEbitdaList}
            lowDataList={lowEbitdaList}
            avgGrowthList={ebitdaAvgGrowthList}
            graphType="growth"
          />
        </Lazy>
        -->
      </div>
    </div>
  </main>
</section>

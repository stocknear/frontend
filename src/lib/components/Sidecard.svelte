<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";
  import { sectorNavigation } from "$lib/utils";
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";
  import {
    deferFunction,
    abbreviateNumber,
    removeCompanyStrings,
  } from "$lib/utils";

  export let data;

  let info;

  let sector = "n/a";
  let industry = "n/a";
  let exchange = "n/a";
  let employees = "n/a";
  let description = "";
  let website = "n/a";
  let snippet;

  let strongBuyCount = 0;
  let buyCount = 0;
  let holdCount = 0;
  let sellCount = 0;
  let strongSellCount = 0;
  let priceTarget = "n/a";
  let numOfAnalyst = 0;
  let consensusRating = "n/a";
  let changesPercentage = 0;
  let ipoDate = "n/a";

  let configAnalyst = null;
  let configFinancial = null;
  let financialPerformance = {};

  function getIndustryHref(industryName) {
    // Replace spaces with hyphens
    let formattedName = industryName?.replace(/ /g, "-");
    // Replace "&" with "and"
    formattedName = formattedName?.replace(/&/g, "and");
    // Remove any extra hyphens (e.g., from consecutive spaces)
    formattedName = formattedName?.replace(/-{2,}/g, "-");
    // Convert to lowercase for consistency
    return "/list/industry/" + formattedName?.toLowerCase();
  }

  function plotAnalyst() {
    // X-axis categories
    const categories = [
      "Strong<br>Sell",
      "Sell",
      "Hold",
      "Buy",
      "Strong<br>Buy",
    ];

    // Corresponding data
    const dataValues = [
      strongSellCount,
      sellCount,
      holdCount,
      buyCount,
      strongBuyCount,
    ];
    const colors = ["#FF4C4C", "#FF4C4C", "#3D3D3D", "#008A00", "#008A00"];

    const options = {
      chart: {
        type: "column",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 250,
        animation: false,
      },
      title: {
        text: `<div class="text-muted dark:text-gray-200 mt-3  text-center font-normal text-2xl">Price Target: <span class="${changesPercentage >= 0 ? "text-green-800 dark:text-[#00FC50]" : "text-red-800 dark:text-[#FF2F1F]"}">$${priceTarget}</span></div>
        <div class="text-muted dark:text-gray-200  mb-2 text-center font-normal text-xl">(${changesPercentage}% ${changesPercentage >= 0 ? "upside" : "downside"})</div>
        <div class="text-muted dark:text-gray-200 text-center font-normal text-xl flex justify-center items-center">Analyst Consensus: <span class="ml-1 ${consensusRating === "Buy" ? "text-green-800 dark:text-[#00FC50]" : consensusRating === "Sell" ? "text-red-800 dark:text-[#FF2F1F]" : consensusRating === "Hold" ? "text-muted dark:text-[#D5AB31]" : "text-muted dark:text-white"}">${consensusRating ?? "n/a"}</span></div>`,
        style: {
          color: "white",
          // Using inline CSS for margin-top and margin-bottom
        },
        useHTML: true, // Enable HTML to apply custom class styling
      },
      credits: { enabled: false },
      xAxis: {
        categories: categories,
        gridLineWidth: 0,
        labels: {
          rotation: 0,
          style: {
            color: $mode === "light" ? "black" : "white",
            fontSize: "12.5px",
          },
        },
      },
      yAxis: {
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        labels: {
          style: { color: $mode === "light" ? "black" : "white" },
          formatter: function () {
            return Math.floor(this.value); // Ensures whole numbers only
          },
        },
        title: { text: null },
        opposite: true, // If you want the axis on the right side
        allowDecimals: false, // Ensures no decimal values on the axis
        min: Math.min(...dataValues), // Ensures the Y-axis starts at 1
      },
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        style: {
          color: "#fff",
          fontSize: "16px",
          padding: "10px",
        },
        borderRadius: 4,
        formatter: function () {
          let tooltipContent = "";
          this.points.forEach((point) => {
            tooltipContent += `
          <span class="text-white font-semibold text-sm">${point.key?.replace("<br>", " ")}:</span> 
          <span class="text-white font-normal text-sm" >${point.y}</span><br>
        `;
          });
          return tooltipContent;
        },
      },
      plotOptions: {
        series: {
          animation: false,
          borderRadius: "2px",
        },
      },
      legend: {
        enabled: false,
      },
      series: [
        {
          data: dataValues.map((value, index) => ({
            y: value,
            color: colors[index],
            borderColor: colors[index],
            borderRadius: "0px",
          })),
          animation: false,
        },
      ],
    };

    return options;
  }

  function plotFinancial() {
    const history = financialPerformance?.history ?? [];
    // Build data arrays from the aggregated data
    let dates = history?.map((item) => item?.date);
    let revenue = history?.map((item) => item?.revenue);
    let netIncome = history?.map((item) => item?.netIncome);

    // Highcharts configuration options
    const options = {
      credits: {
        enabled: false,
      },
      plotOptions: {
        column: {
          groupPadding: 0.1, // Increase to add more space between groups of columns
          pointPadding: 0.1, // Adjust to fine-tune spacing within a group
          borderWidth: 0, // Optional: Remove borders if not needed
        },
        series: {
          color: $mode === "light" ? "black" : "white",
          animation: false, // Disable series animation
          states: {
            hover: {
              enabled: false, // Disable hover effect globally
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
        text: null,
      },
      xAxis: {
        categories: dates,
        gridLineWidth: 0,
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
          formatter: function () {
            return this?.value?.substring(0, 4);
          },
        },
      },
      yAxis: [
        {
          gridLineWidth: 1,
          gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
          labels: {
            style: { color: $mode === "light" ? "#545454" : "white" },
          },
          title: { text: null },
          opposite: true,
        },
        {
          title: {
            text: null,
          },
          gridLineWidth: 0,
          labels: {
            enabled: false,
          },
        },
      ],
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 0.8)", // Semi-transparent black
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
            timeZone: "UTC",
          })}</span><br>`;

          // Loop through each point in the shared tooltip
          this.points.forEach((point) => {
            tooltipContent += `
        <span style="display:inline-block; width:10px; height:10px; background-color:${point.color}; border-radius:50%; margin-right:5px;"></span>
        <span class="font-semibold text-sm">${point.series.name}:</span> 
        <span class="font-normal text-sm">${abbreviateNumber(point.y)}</span><br>`;
          });

          return tooltipContent;
        },
      },
      series: [
        {
          name: "Revenue",
          type: "column",
          data: revenue,
          color: "#457BA1",
          borderColor: "#457BA1",
          borderRadius: "2px",
          animation: false,
          states: { hover: { enabled: false } },
          lineWidth: 1.5,
          crisp: true,
          marker: {
            enabled: false,
          },
        },
        {
          name: "Earnings",
          type: "column",
          data: netIncome,
          color: "#EE5365",
          borderColor: "#EE5365",
          borderRadius: "2px",
          animation: false,
          states: { hover: { enabled: false } },
          lineWidth: 1.5,
          crisp: true,
          marker: {
            enabled: false,
          },
        },
      ],
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
    };

    return options;
  }

  $: {
    if ($mode) {
      info = data?.getStockDeck;
      financialPerformance = info?.financialPerformance ?? {};
      ipoDate =
        info?.ipoDate !== null && info?.ipoDate?.length > 0
          ? new Date(info?.ipoDate)?.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              daySuffix: "2-digit",
            })
          : "n/a";

      //ceoName = info?.ceoName?.length !== 0 ? getAbbreviatedName(info?.ceoName) : "-";
      sector = info?.sector ?? "n/a";
      industry = info?.industry ?? "n/a";
      exchange = info?.exchange;
      employees = info?.fullTimeEmployees ?? "n/a";
      //country = info?.country ?? "n/a";
      description =
        info?.description ??
        "A detailed description of the company is not yet available.";
      website = info?.website;
      snippet = description?.slice(0, 450) + "...";

      numOfAnalyst = data?.getAnalystSummary?.numOfAnalyst;
      strongBuyCount = data?.getAnalystSummary?.strongBuy || 0;
      buyCount = data?.getAnalystSummary?.buy || 0;
      holdCount = data?.getAnalystSummary?.hold || 0;
      sellCount = data?.getAnalystSummary?.sell || 0;
      strongSellCount = data?.getAnalystSummary?.strongSell || 0;

      priceTarget =
        data?.getAnalystSummary?.medianPriceTarget !== ("n/a" && 0)
          ? data?.getAnalystSummary?.medianPriceTarget
          : "n/a";
      consensusRating = data?.getAnalystSummary?.consensusRating;

      try {
        changesPercentage =
          ((priceTarget / data?.getStockQuote?.price - 1) * 100)?.toFixed(2) ??
          0;
      } catch (e) {
        changesPercentage = 0;
      }

      deferFunction(() => {
        configAnalyst = plotAnalyst() || null;
        configFinancial = plotFinancial() || null;
      });
    }
  }
</script>

<div class="space-y-3">
  <div class="h-auto w-full">
    <!--Start Content-->
    <div class="w-auto lg:w-full flex flex-col m-auto">
      <h2 class="mb-2 text-2xl font-bold text-black dark:text-white">
        About {$stockTicker}
      </h2>
      <p class="dark:text-gray-200">
        {snippet}
      </p>
      <div class="inline-block">
        <a
          href={`/stocks/${$stockTicker}/profile`}
          class="w-full text-md mt-1 cursor-pointer sm:hover:text-muted dark:sm:hover:text-white text-blue-700 dark:text-blue-400 sm:hover:underline"
        >
          [Read more]
        </a>
      </div>

      <div class="mt-3 grid grid-cols-2 gap-3 w-full">
        <div class="col-span-1 dark:text-gray-200">
          <span class="block font-semibold">Industry</span>
          <a
            href={getIndustryHref(industry)}
            class="sm:hover:text-blue-700 dark:sm:hover:text-blue-400 underline underline-offset-4"
            >{industry}</a
          >
        </div>
        <div class="col-span-1 dark:text-gray-200">
          <span class="block font-semibold">Sector</span>
          <a
            href={sectorNavigation?.find((item) => item?.title === sector)
              ?.link}
            class="sm:hover:text-blue-700 dark:sm:hover:text-blue-400 underline underline-offset-4"
            >{sector}</a
          >
        </div>
        <div class="col-span-1 dark:text-gray-200">
          <span class="block font-semibold">IPO Date</span>
          <span>{ipoDate}</span>
        </div>
        <div class="col-span-1 dark:text-gray-200">
          <span class="block font-semibold">Employees</span>
          <a
            href={`/stocks/${$stockTicker}/profile/employees`}
            class="sm:hover:text-blue-700 dark:sm:hover:text-blue-400 underline underline-offset-4"
            >{new Intl.NumberFormat("en")?.format(employees)}</a
          >
        </div>
        <div class="col-span-1 dark:text-gray-200">
          <span class="block font-semibold">Stock Exchange</span>
          <span>{exchange}</span>
        </div>
        <div class="col-span-1 dark:text-gray-200">
          <span class="block font-semibold">Ticker Symbol</span>
          <span>{$stockTicker}</span>
        </div>
        {#if website}
          <div class="col-span-1 whitespace-nowrap dark:text-gray-200">
            <span class="block font-semibold">Website</span>
            <a
              href={website}
              class="sm:hover:text-muted dark:sm:hover:text-white truncate text-blue-700 dark:text-blue-400"
              target="_blank">{website}</a
            >
          </div>
        {/if}
      </div>
      <a
        href={`/stocks/${$stockTicker}/profile`}
        class="rounded-[2px] cursor-pointer w-full m-auto py-2 h-full mt-6 text-[1rem] sm:text-lg text-center font-semibold text-white dark:text-black sm:hover:bg-muted sm:hover:text-white dark:sm:hover:text-muted dark:sm:hover:bg-gray-300 bg-black dark:bg-[#ffff] transition duration-50"
      >
        Full Company Profile
      </a>
    </div>
  </div>
</div>

{#if Object?.keys(financialPerformance ?? {})?.length > 0}
  <div
    class="space-y-3 pt-6 sm:pt-0 {Object?.keys(financialPerformance ?? {})
      ?.length > 0
      ? ''
      : 'hidden'}"
  >
    <div class="h-auto w-full">
      <!--Start Content-->
      <div class="w-auto lg:w-full flex flex-col m-auto">
        <h2 class="mb-2 text-2xl font-bold">Financial Performance</h2>
        <p class="dark:text-gray-200">
          In {financialPerformance?.history?.at(-1)?.date?.slice(0, 4)}, {removeCompanyStrings(
            $displayCompanyName,
          )}'s revenue was ${abbreviateNumber(
            financialPerformance?.history?.at(-1)?.revenue,
          )}, {financialPerformance?.changePercentageRevenue >= 0
            ? "an increase"
            : "a decrease"} of {financialPerformance?.changePercentageRevenue?.toLocaleString(
            "en-US",
          )}% compared to the previous year's ${abbreviateNumber(
            financialPerformance?.history?.at(-2)?.revenue,
          )}. Earnings were ${abbreviateNumber(
            financialPerformance?.history?.at(-1)?.netIncome,
          )}, {financialPerformance?.changePercentageNetIncome >= 0
            ? "an increase"
            : "a decrease"} of {financialPerformance?.changePercentageNetIncome?.toLocaleString(
            "en-US",
          )}%.
        </p>

        {#if configFinancial}
          <div
            class="mt-3 border border-gray-300 dark:border-gray-800 rounded"
            use:highcharts={configFinancial}
          ></div>
        {/if}

        <a
          href={`/stocks/${$stockTicker}/financials`}
          class="rounded-[2px] cursor-pointer w-full m-auto py-2 h-full mt-6 text-[1rem] sm:text-lg text-center font-semibold text-white dark:text-black sm:hover:bg-muted sm:hover:text-white dark:sm:hover:text-muted dark:sm:hover:bg-gray-300 bg-black dark:bg-[#ffff] transition duration-50"
        >
          Financial Statements
        </a>
      </div>
    </div>
  </div>
{/if}

{#if Object?.keys(data?.getAnalystSummary ?? {})?.length !== 0}
  <div
    class="space-y-3 pt-6 sm:pt-0 {Object?.keys(data?.getAnalystSummary ?? {})
      ?.length !== 0
      ? ''
      : 'hidden'}"
  >
    <div class="h-auto w-full">
      <!--Start Content-->
      <div class="w-auto lg:w-full flex flex-col m-auto pb-10">
        <h2 class="mb-2 text-2xl font-bold">Analyst Forecast</h2>
        <p class="dark:text-gray-200">
          According to {numOfAnalyst} analyst ratings, the average rating for {$stockTicker}
          stock is "{consensusRating}." The 12-month stock price forecast is ${priceTarget},
          which is {changesPercentage > 0 ? "an increase" : "a decrease"} of {changesPercentage}%
          from the latest price.
        </p>

        {#if configAnalyst}
          <div
            class="mt-3 border border-gray-300 dark:border-gray-800 rounded"
            use:highcharts={configAnalyst}
          ></div>
        {/if}

        <a
          href={`/stocks/${$stockTicker}/forecast/analyst`}
          class="rounded-[2px] cursor-pointer w-full m-auto py-2 h-full mt-6 text-[1rem] sm:text-lg text-center font-semibold text-white dark:text-black sm:hover:bg-muted sm:hover:text-white dark:sm:hover:text-muted dark:sm:hover:bg-gray-300 bg-black dark:bg-[#ffff] transition duration-50"
        >
          Stock Forecasts
        </a>
      </div>
    </div>
  </div>
{/if}

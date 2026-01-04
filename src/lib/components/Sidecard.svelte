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
  export let priceTargetUpside = 0;
  export let priceTarget = "n/a";

  let info = data?.getStockDeck;

  let sector = "n/a";
  let industry = "n/a";
  let exchange = "n/a";
  let employees = "n/a";
  let description =
    info?.description ??
    "A detailed description of the company is not yet available.";
  let website = "n/a";
  let snippet;

  let strongBuyCount = 0;
  let buyCount = 0;
  let holdCount = 0;
  let sellCount = 0;
  let strongSellCount = 0;
  let numOfAnalyst = 0;
  let consensusRating = "n/a";
  let ipoDate = "n/a";
  let currency = data?.getStockDeck?.currency ?? "USD";

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
        text: `<div class="text-gray-600 dark:text-zinc-400 mt-3 text-center font-normal text-2xl">Price Target: <span class="${priceTargetUpside >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}">$${priceTarget}</span></div>
        <div class="text-gray-600 dark:text-zinc-400 mb-2 text-center font-normal text-xl">(${priceTargetUpside}% ${priceTargetUpside >= 0 ? "upside" : "downside"})</div>
        <div class="text-gray-600 dark:text-zinc-400 text-center font-normal text-xl flex justify-center items-center">Analyst Consensus: <span class="ml-1 ${consensusRating === "Buy" ? "text-emerald-600 dark:text-emerald-400" : consensusRating === "Sell" ? "text-rose-600 dark:text-rose-400" : consensusRating === "Hold" ? "text-amber-500 dark:text-amber-400" : "text-gray-500 dark:text-zinc-400"}">${consensusRating ?? "n/a"}</span></div>`,
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

  sector = info?.sector ?? "n/a";
  industry = info?.industry ?? "n/a";
  exchange = info?.exchange;
  employees = info?.fullTimeEmployees || "n/a";

  website = info?.website;
  snippet = description?.slice(0, 450) + "...";

  numOfAnalyst = data?.getAnalystSummary?.numOfAnalyst;
  strongBuyCount = data?.getAnalystSummary?.strongBuy || 0;
  buyCount = data?.getAnalystSummary?.buy || 0;
  holdCount = data?.getAnalystSummary?.hold || 0;
  sellCount = data?.getAnalystSummary?.sell || 0;
  strongSellCount = data?.getAnalystSummary?.strongSell || 0;

  consensusRating = data?.getAnalystSummary?.consensusRating;

  $: {
    if ($mode) {
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
      <h2
        class="mb-2 text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
      >
        About {$stockTicker}
      </h2>
      <p class="text-sm text-gray-600 dark:text-zinc-400">
        {snippet}
      </p>
      <div class="inline-block">
        <a
          href={`/stocks/${$stockTicker}/profile`}
          class="w-full text-sm mt-1 cursor-pointer text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
        >
          [Read more]
        </a>
      </div>

      <div class="mt-3 grid grid-cols-2 gap-3 w-full">
        <div class="col-span-1 text-sm text-gray-600 dark:text-zinc-400">
          <span
            class="block text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-500"
            >Industry</span
          >
          <a
            href={getIndustryHref(industry)}
            class="hover:text-violet-600 dark:hover:text-violet-400 underline underline-offset-4"
            >{industry}</a
          >
        </div>
        <div class="col-span-1 text-sm text-gray-600 dark:text-zinc-400">
          <span
            class="block text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-500"
            >Sector</span
          >
          <a
            href={sectorNavigation?.find((item) => item?.title === sector)
              ?.link}
            class="hover:text-violet-600 dark:hover:text-violet-400 underline underline-offset-4"
            >{sector}</a
          >
        </div>
        <div class="col-span-1 text-sm text-gray-600 dark:text-zinc-400">
          <span
            class="block text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-500"
            >IPO Date</span
          >
          <span>{ipoDate}</span>
        </div>
        <div class="col-span-1 text-sm text-gray-600 dark:text-zinc-400">
          <span
            class="block text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-500"
            >Employees</span
          >
          <a
            href={`/stocks/${$stockTicker}/profile/employees`}
            class="hover:text-violet-600 dark:hover:text-violet-400 underline underline-offset-4"
            >{employees && employees !== "n/a"
              ? Number(employees)?.toLocaleString("en-US")
              : "n/a"}</a
          >
        </div>
        <div class="col-span-1 text-sm text-gray-600 dark:text-zinc-400">
          <span
            class="block text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-500"
            >Stock Exchange</span
          >
          <span>{exchange ?? "n/a"}</span>
        </div>
        <div class="col-span-1 text-sm text-gray-600 dark:text-zinc-400">
          <span
            class="block text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-500"
            >Ticker Symbol</span
          >
          <span>{$stockTicker}</span>
        </div>
        {#if website}
          <div
            class="col-span-1 whitespace-nowrap text-sm text-gray-600 dark:text-zinc-400"
          >
            <span
              class="block text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-500"
              >Website</span
            >
            <a
              href={website}
              class="truncate text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400"
              target="_blank">{website}</a
            >
          </div>
        {/if}
      </div>
      <a
        href={`/stocks/${$stockTicker}/profile`}
        class="inline-flex items-center justify-center rounded-full border border-gray-300 shadow dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/70 text-gray-900 dark:text-white hover:bg-white dark:hover:bg-zinc-900 transition w-full m-auto py-2 mt-6 text-sm font-semibold"
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
        <h2
          class="mb-2 text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
        >
          Financial Performance
        </h2>
        <p class="text-sm text-gray-600 dark:text-zinc-400">
          In {financialPerformance?.history?.at(-1)?.date?.slice(0, 4)}, {removeCompanyStrings(
            $displayCompanyName,
          )}'s revenue was {abbreviateNumber(
            financialPerformance?.history?.at(-1)?.revenue,
          )}, {financialPerformance?.changePercentageRevenue >= 0
            ? "an increase"
            : "a decrease"} of {financialPerformance?.changePercentageRevenue?.toLocaleString(
            "en-US",
          )}% compared to the previous year's {abbreviateNumber(
            financialPerformance?.history?.at(-2)?.revenue,
          )}. Earnings were {abbreviateNumber(
            financialPerformance?.history?.at(-1)?.netIncome,
          )}, {financialPerformance?.changePercentageNetIncome >= 0
            ? "an increase"
            : "a decrease"} of {financialPerformance?.changePercentageNetIncome?.toLocaleString(
            "en-US",
          )}%.
        </p>

        {#if configFinancial}
          <div
            class="mt-3 border border-gray-300 shadow dark:border-zinc-800/80 rounded-lg bg-white/70 dark:bg-zinc-950/40"
            use:highcharts={configFinancial}
          ></div>
        {/if}
        {#if currency !== "USD"}
          <span class="text-sm text-gray-500 dark:text-zinc-400 mt-2"
            >Financial numbers in {currency}</span
          >
        {/if}
        <a
          href={`/stocks/${$stockTicker}/financials`}
          class="inline-flex items-center justify-center rounded-full border border-gray-300 shadow dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/70 text-gray-900 dark:text-white hover:bg-white dark:hover:bg-zinc-900 transition w-full m-auto py-2 mt-6 text-sm font-semibold"
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
        <h2
          class="mb-2 text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
        >
          Analyst Forecast
        </h2>
        <p class="text-sm text-gray-600 dark:text-zinc-400">
          According to {numOfAnalyst} analyst ratings, the average rating for {$stockTicker}
          stock is "{consensusRating}." The 12-month stock price forecast is {priceTarget},
          which is {priceTargetUpside > 0 ? "an increase" : "a decrease"} of {priceTargetUpside}%
          from the latest price.
        </p>

        {#if configAnalyst}
          <div
            class="mt-3 border border-gray-300 shadow dark:border-zinc-800/80 rounded-lg bg-white/70 dark:bg-zinc-950/40"
            use:highcharts={configAnalyst}
          ></div>
        {/if}

        <a
          href={`/stocks/${$stockTicker}/forecast/analyst`}
          class="inline-flex items-center justify-center rounded-full border border-gray-300 shadow dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/70 text-gray-900 dark:text-white hover:bg-white dark:hover:bg-zinc-900 transition w-full m-auto py-2 mt-6 text-sm font-semibold"
        >
          Stock Forecasts
        </a>
      </div>
    </div>
  </div>
{/if}

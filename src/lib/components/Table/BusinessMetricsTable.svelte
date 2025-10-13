<script lang="ts">
  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import {
    displayCompanyName,
    stockTicker,
    selectedTimePeriod,
  } from "$lib/store";
  import { mode } from "mode-watcher";
  import highcharts from "$lib/highcharts.ts";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import BarChart from "lucide-svelte/icons/chart-column-increasing";
  import LineChart from "lucide-svelte/icons/chart-spline";

  export let data;
  export let title = "";
  export let metrics = [];
  export let showGrowth = true;
  export let first = false;
  export let overrideDownloadData = null; // For overview page to pass combined data

  const isSubscribed = ["Pro", "Plus"]?.includes(data?.user?.tier);
  const limit = 6;

  let config = null;
  let chartMode = "bar";
  let modalLabel;
  let highestValue;
  let highestValueDate;
  let lowestValueDate;
  let lowestValue;
  let fiveYearsGrowth;
  let currentMetric;
  let currentValueType;
  let isGrowthChart = false;

  let tabs = ["Quarterly", "TTM"];

  $: activeIdx = $selectedTimePeriod === "quarterly" ? 0 : 1;

  function handleTabClick(index: number) {
    $selectedTimePeriod = index === 0 ? "quarterly" : "ttm";
  }

  function plotData(metric, valueType, showGrowth = false) {
    // Extract dates and values from metric
    let sortedValues = [...metric.values].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Limit to last 3 years if not subscribed
    if (!isSubscribed) {
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      sortedValues = sortedValues.filter(
        (item) => new Date(item.date) >= threeYearsAgo
      );
    }

    const dateList = sortedValues.map((item) => {
      const date = new Date(item.date);
      const month = date.toLocaleDateString("en-US", { month: "short" });
      const year = date.getFullYear().toString().slice(-2);
      return `${month} '${year}`;
    });

    let valueList;

    // Calculate growth percentages if needed
    if (showGrowth) {
      valueList = sortedValues.map((item, index) => {
        if (index === 0) return null; // No previous value for first item
        const currentVal = item.val;
        const prevVal = sortedValues[index - 1].val;
        if (prevVal === null || prevVal === 0) return null;
        return ((currentVal - prevVal) / prevVal) * 100;
      });
      // Remove first null value and corresponding date
      valueList.shift();
      dateList.shift();
    } else {
      valueList = sortedValues.map((item) => item.val);
    }

    // Calculate highest and lowest value
    highestValue = null;
    lowestValue = null;
    highestValueDate = null;
    lowestValueDate = null;

    if (valueList?.length > 0) {
      highestValue = Math.max(...valueList);
      lowestValue = Math.min(...valueList);

      const highestValueIndex = valueList.indexOf(highestValue);
      const lowestValueIndex = valueList.indexOf(lowestValue);

      highestValueDate = dateList[highestValueIndex] || null;
      lowestValueDate = dateList[lowestValueIndex] || null;
    }

    // Calculate last 5 periods growth
    fiveYearsGrowth = null;
    if (valueList?.length >= 5) {
      const firstValue = valueList[valueList.length - 5];
      const lastValue = valueList[valueList.length - 1];
      if (firstValue !== 0) {
        fiveYearsGrowth =
          ((lastValue - firstValue) / Math.abs(firstValue)) * 100;
      }
    }

    const options = {
      chart: {
        type: chartMode === "bar" ? "column" : "spline",
        backgroundColor: $mode === "light" ? "#fff" : "#2A2E39",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#2A2E39",
        height: 360,
        animation: false,
      },
      credits: { enabled: false },
      legend: { enabled: false },
      plotOptions: {
        series: {
          color: "white",
          animation: false,
          dataLabels: {
            enabled: false,
            color: "white",
            style: { fontSize: "13px", fontWeight: "bold" },
            formatter: function () {
              if (showGrowth || valueType === "PERCENT") {
                return this?.y?.toFixed(2) + "%";
              }
              return abbreviateNumber(this?.y);
            },
          },
        },
      },
      title: {
        text: `<h3 class="mt-3 mb-1 sm:text-lg">${$stockTicker} ${metric.name}${showGrowth ? " Growth" : ""}</h3>`,
        useHTML: true,
        style: { color: $mode === "light" ? "black" : "white" },
      },
      xAxis: {
        categories: dateList,
        crosshair: {
          color: $mode === "light" ? "black" : "white",
          width: 1,
          dashStyle: "Solid",
        },
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
          rotation: -45,
          distance: 10,
        },
      },
      yAxis: {
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#404657",
        labels: {
          style: { color: $mode === "light" ? "black" : "white" },
          formatter: function () {
            if (showGrowth || valueType === "PERCENT") {
              return this.value.toFixed(1) + "%";
            }
            return abbreviateNumber(this.value);
          },
        },
        title: { text: null },
        opposite: true,
      },
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        style: { color: "#fff", fontSize: "16px", padding: "10px" },
        borderRadius: 4,
        formatter: function () {
          let tooltipContent = `<span class="text-white text-[1rem] font-[501]">${this?.x}</span><br>`;
          this.points.forEach((point) => {
            const formattedValue = (showGrowth || valueType === "PERCENT")
              ? point.y?.toFixed(2) + "%"
              : abbreviateNumber(point.y?.toFixed(2));
            tooltipContent += `<span class="text-white font-semibold text-sm">${point.series.name}:</span>
          <span class="text-white font-normal text-sm">${formattedValue}</span><br>`;
          });
          return tooltipContent;
        },
      },
      series: [
        {
          name: metric.name,
          data: valueList,
          color: $mode === "light" ? "#2C6288" : "white",
          borderColor: $mode === "light" ? "#2C6288" : "white",
          borderRadius: "1px",
          animation: false,
        },
      ],
    };

    return options;
  }

  function handleChart(metric, showGrowthChart = false) {
    modalLabel = metric.name;
    currentMetric = metric;
    currentValueType = metric.values?.[0]?.valueType || "NUMBER";
    isGrowthChart = showGrowthChart;
    config = plotData(metric, currentValueType, showGrowthChart);
  }

  function toggleMode() {
    if (chartMode === "bar") {
      chartMode = "line";
    } else {
      chartMode = "bar";
    }
    // Re-render the chart with the new mode
    if (currentMetric) {
      config = plotData(currentMetric, currentValueType, isGrowthChart);
    }
  }

  // Pre-compute everything in one reactive block
  let tableData = { dates: [], formattedDates: [], rows: [] };

  $: {
    if (!metrics || metrics.length === 0) {
      tableData = { dates: [], formattedDates: [], rows: [] };
    } else {
      // Collect all dates
      const dateSet = new Set();
      for (const metric of metrics) {
        for (const v of metric.values) {
          dateSet.add(v.date);
        }
      }

      // Sort and limit to most recent
      const allDates = Array.from(dateSet).sort().reverse();

      // Pre-format dates once
      const formattedDates = allDates.map((d) => {
        const date = new Date(d);
        return isNaN(date)
          ? "n/a"
          : date.toLocaleString("en-US", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              timeZone: "UTC",
            });
      });

      // Pre-compute all row data
      const rows = metrics.map((metric) => {
        const valueMap = new Map();
        let valueType = "NUMBER";

        // Build value map
        for (const v of metric.values) {
          valueMap.set(v.date, v.val);
          if (v.valueType) valueType = v.valueType;
        }

        // Pre-compute all cells
        const cells = allDates.map((date, i) => {
          const value = valueMap.get(date) ?? null;

          // Format value
          let formatted = "-";
          if (value !== null && value !== undefined) {
            switch (valueType) {
              case "CURRENCY":
                formatted = abbreviateNumber(value, false, true);
                break;
              case "PERCENT":
                formatted = value.toFixed(2) + "%";
                break;
              case "NUMBER":
                formatted = abbreviateNumber(value, false, false);
                break;
              default:
                formatted = value.toString();
            }
          }

          // Calculate growth
          let growth = "-";
          let growthNum = 0;
          let growthClass = "";

          if (showGrowth && i < allDates.length - 1) {
            const prevValue = valueMap.get(allDates[i + 1]) ?? null;
            if (value !== null && prevValue !== null && prevValue !== 0) {
              growthNum = ((value - prevValue) / prevValue) * 100;
              growth = (growthNum > 0 ? "+" : "") + growthNum.toFixed(2) + "%";
              growthClass =
                growthNum > 0
                  ? "text-green-800 dark:text-[#00FC50]"
                  : growthNum < 0
                    ? "text-red-800 dark:text-[#FF2F1F]"
                    : "";
            }
          }

          return {
            value,
            formatted,
            growth,
            growthClass,
            isPremium: !isSubscribed && i > limit,
          };
        });

        return {
          name: metric.name,
          cells,
        };
      });

      tableData = { dates: allDates, formattedDates, rows };
    }
  }

  // Transform tableData for download - matches table display format
  $: downloadData = (() => {
    // Use override data if provided (for overview page with all categories)
    if (overrideDownloadData && overrideDownloadData.length > 0) {
      return overrideDownloadData;
    }

    if (!tableData.formattedDates || tableData.formattedDates.length === 0) {
      return [];
    }

    // Create array of objects where each object is a column (date period)
    return tableData.formattedDates.map((formattedDate, dateIndex) => {
      const downloadRow: Record<string, any> = {
        "Period Ending": formattedDate,
      };

      // Add each metric's value for this date
      tableData.rows.forEach((row) => {
        const cell = row.cells[dateIndex];
        if (cell && !cell.isPremium) {
          downloadRow[row.name] = cell.formatted;
          if (showGrowth && cell.growth !== "-") {
            downloadRow[`${row.name} Growth`] = cell.growth;
          }
        } else if (cell?.isPremium) {
          downloadRow[row.name] = "Premium";
          if (showGrowth) {
            downloadRow[`${row.name} Growth`] = "Premium";
          }
        } else {
          downloadRow[row.name] = "-";
          if (showGrowth) {
            downloadRow[`${row.name} Growth`] = "-";
          }
        }
      });

      return downloadRow;
    });
  })();
</script>

<section class="my-5 pb-5">
  {#if first}
    <div class="items-center lg:overflow-visible">
      <div
        class="col-span-2 flex flex-col lg:flex-row items-start sm:items-center lg:order-2 lg:grow py-1"
      >
        <h2
          class="text-start whitespace-nowrap text-xl sm:text-2xl font-bold py-1 w-full"
        >
          {removeCompanyStrings($displayCompanyName)}
          {title}
        </h2>
        <div
          class="mt-1 w-full flex flex-row lg:flex order-1 items-center ml-auto pb-1 pt-1 sm:pt-0 w-full order-0 lg:order-1"
        >
          <div class="ml-auto">
            <div class="inline-flex">
              <div class="inline-flex rounded-lg shadow-sm">
                {#each tabs as item, i (item)}
                  <button
                    on:click={() => handleTabClick(i)}
                    class="cursor-pointer px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none transition-colors duration-50
                            {i === 0 ? 'rounded-l border' : ''}
                            {i === tabs?.length - 1
                      ? 'rounded-r border-t border-r border-b'
                      : ''}
                            {i !== 0 && i !== tabs?.length - 1
                      ? 'border-t border-b'
                      : ''}
                            {activeIdx === i
                      ? 'bg-black dark:bg-white text-white dark:text-black'
                      : 'bg-white  border-gray-300 sm:hover:bg-gray-100 dark:bg-primary dark:border-gray-800'}"
                  >
                    {item}
                  </button>
                {/each}
              </div>
            </div>
          </div>

          <div class="ml-2">
            <DownloadData
              {data}
              rawData={downloadData}
              title={overrideDownloadData
                ? `${$stockTicker}_all_business_metrics_overview`
                : `${$stockTicker}_${title?.toLowerCase().replace(/\s+/g, "_")}_metrics`}
            />
          </div>
        </div>
      </div>
    </div>
  {:else}
    <h2 class="mt-5 text-xl font-bold mb-4">{title}</h2>
  {/if}

  <div
    class="flex justify-start items-center w-screen sm:w-full mt-2 m-auto overflow-x-auto pr-5 sm:pr-0"
  >
    <table
      class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
    >
      <thead class="bg-default text-white w-full">
        <tr>
          <th
            class="border-b border-r border-gray-800 font-semibold text-sm text-start"
          >
            Period Ending
          </th>
          {#each tableData.formattedDates as formattedDate (formattedDate)}
            <th
              class="z-20 border-b border-r min-w-[120px] border-gray-800 font-semibold text-sm text-end"
            >
              {formattedDate}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody class="shadow w-full">
        {#each tableData.rows as row, rowIndex (row.name)}
          <tr class="w-full odd:bg-[#F6F7F8] dark:odd:bg-odd">
            <th
              class="whitespace-nowrap flex flex-row justify-between items-center text-sm sm:text-[1rem] font-normal text-start border-r border-gray-300 dark:border-gray-800"
            >
              {row.name}
              <label
                for="financialPlotModal"
                on:click={() => handleChart(metrics[rowIndex], false)}
                class="cursor-pointer inline-block border-none"
              >
                <svg
                  class="w-5 h-5 text-gray-500 dark:text-gray-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                    id="SVGRepo_tracerCarrier"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></g><g id="SVGRepo_iconCarrier">
                    <path
                      d="M9 12H4.6C4.03995 12 3.75992 12 3.54601 12.109C3.35785 12.2049 3.20487 12.3578 3.10899 12.546C3 12.7599 3 13.0399 3 13.6V19.4C3 19.9601 3 20.2401 3.10899 20.454C3.20487 20.6422 3.35785 20.7951 3.54601 20.891C3.75992 21 4.03995 21 4.6 21H9M9 21H15M9 21L9 8.6C9 8.03995 9 7.75992 9.10899 7.54601C9.20487 7.35785 9.35785 7.20487 9.54601 7.10899C9.75992 7 10.0399 7 10.6 7H13.4C13.9601 7 14.2401 7 14.454 7.10899C14.6422 7.20487 14.7951 7.35785 14.891 7.54601C15 7.75992 15 8.03995 15 8.6V21M15 21H19.4C19.9601 21 20.2401 21 20.454 20.891C20.6422 20.7951 20.7951 20.6422 20.891 20.454C21 20.2401 21 19.9601 21 19.4V4.6C21 4.03995 21 3.75992 20.891 3.54601C20.7951 3.35785 20.6422 3.20487 20.454 3.10899C20.2401 3 19.9601 3 19.4 3H16.6C16.0399 3 15.7599 3 15.546 3.10899C15.3578 3.20487 15.2049 3.35785 15.109 3.54601C15 3.75992 15 4.03995 15 4.6V8"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></path>
                  </g></svg
                >
              </label>
            </th>
            {#each row.cells as cell, i}
              <td
                class="whitespace-nowrap text-sm sm:text-[1rem] text-end border-b border-r border-gray-300 dark:border-gray-800"
              >
                {#if cell?.isPremium && cell?.value !== null}
                  <a
                    href="/pricing"
                    class="inline-flex items-center justify-end text-sm font-semibold"
                  >
                    Upgrade
                    <svg
                      class="ml-1 mt-px size-3.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      style="max-width:40px"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </a>
                {:else}
                  {cell.formatted}
                {/if}
              </td>
            {/each}
          </tr>
          {#if showGrowth}
            <tr>
              <td
                class="min-w-96 w-full whitespace-nowrap flex flex-row justify-between items-center text-sm sm:text-[1rem] font-normal text-start border-r border-gray-300 dark:border-gray-800"
              >
                <span class="ml-2">{row.name} Growth</span>
                <label
                  for="financialPlotModal"
                  on:click={() => handleChart(metrics[rowIndex], true)}
                  class="cursor-pointer inline-block border-none"
                >
                  <svg
                    class="w-5 h-5 text-gray-500 dark:text-gray-300"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                      id="SVGRepo_tracerCarrier"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></g><g id="SVGRepo_iconCarrier">
                      <path
                        d="M9 12H4.6C4.03995 12 3.75992 12 3.54601 12.109C3.35785 12.2049 3.20487 12.3578 3.10899 12.546C3 12.7599 3 13.0399 3 13.6V19.4C3 19.9601 3 20.2401 3.10899 20.454C3.20487 20.6422 3.35785 20.7951 3.54601 20.891C3.75992 21 4.03995 21 4.6 21H9M9 21H15M9 21L9 8.6C9 8.03995 9 7.75992 9.10899 7.54601C9.20487 7.35785 9.35785 7.20487 9.54601 7.10899C9.75992 7 10.0399 7 10.6 7H13.4C13.9601 7 14.2401 7 14.454 7.10899C14.6422 7.20487 14.7951 7.35785 14.891 7.54601C15 7.75992 15 8.03995 15 8.6V21M15 21H19.4C19.9601 21 20.2401 21 20.454 20.891C20.6422 20.7951 20.7951 20.6422 20.891 20.454C21 20.2401 21 19.9601 21 19.4V4.6C21 4.03995 21 3.75992 20.891 3.54601C20.7951 3.35785 20.6422 3.20487 20.454 3.10899C20.2401 3 19.9601 3 19.4 3H16.6C16.0399 3 15.7599 3 15.546 3.10899C15.3578 3.20487 15.2049 3.35785 15.109 3.54601C15 3.75992 15 4.03995 15 4.6V8"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></path>
                    </g></svg
                  >
                </label>
              </td>
              {#each row.cells as cell, i}
                <td
                  class="text-sm sm:text-[1rem] text-end border-b border-r border-gray-300 dark:border-gray-800 {cell.growthClass}"
                >
                  {#if cell.isPremium && cell.growth !== "-"}
                    <a
                      href="/pricing"
                      class="inline-flex items-center justify-end text-sm font-semibold text-muted dark:text-white"
                    >
                      Upgrade
                      <svg
                        class="ml-1 mt-px size-3.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        style="max-width:40px"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </a>
                  {:else}
                    {cell.growth}
                  {/if}
                </td>
              {/each}
            </tr>
          {/if}
        {/each}
      </tbody>
    </table>
  </div>
</section>

<input type="checkbox" id="financialPlotModal" class="modal-toggle" />
<dialog id="financialPlotModal" class="modal px-3">
  <label for="financialPlotModal" class="cursor-pointer modal-backdrop"></label>

  <div
    class="modal-box w-full max-w-3xl p-6 rounded shadow-lg border
        bg-white dark:bg-secondary border border-gray-600 dark:border-gray-800"
  >
    {#if config}
      <div class="flex justify-end items-center w-full">
        <Button
          on:click={toggleMode}
          class="w-fit border-gray-300 dark:border-gray-600 border bg-black sm:hover:bg-default text-white dark:text-black dark:bg-white dark:sm:hover:bg-gray-100 ease-out  flex flex-row justify-between items-center px-3 py-1.5  rounded truncate"
        >
          {#if chartMode === "bar"}
            <LineChart class="w-4.5 h-4.5" />
            <span class="ml-1 mr-auto text-sm"> Line Chart </span>
          {:else}
            <BarChart class="w-4.5 h-4.5" />
            <span class="ml-1 mr-auto text-sm"> Bar Chart </span>
          {/if}</Button
        >
      </div>

      <div class="mt-2" use:highcharts={config}></div>
    {/if}
    <p class="text-sm mb-6">
      {modalLabel}{isGrowthChart ? " Growth" : ""} peaked at
      <strong
        >{(isGrowthChart || currentValueType === "PERCENT")
          ? highestValue?.toFixed(2) + "%"
          : abbreviateNumber(highestValue?.toFixed(2))}</strong
      >
      in <strong>{highestValueDate}</strong>
      and hit its lowest at
      <strong
        >{(isGrowthChart || currentValueType === "PERCENT")
          ? lowestValue?.toFixed(2) + "%"
          : abbreviateNumber(lowestValue?.toFixed(2))}</strong
      >
      in <strong>{lowestValueDate}</strong>.
      {#if fiveYearsGrowth && !isGrowthChart}
        Over the past five periods, it has {fiveYearsGrowth >= 0
          ? "grown"
          : "declined"} by <strong>{fiveYearsGrowth?.toFixed(2)}%</strong>.
      {/if}
    </p>

    <div class="border-t border-gray-300 dark:border-gray-600 mt-2 w-full">
      <label
        for="financialPlotModal"
        class="mt-4 font-semibold text-xl m-auto flex justify-center cursor-pointer"
      >
        Close
      </label>
    </div>
  </div>
</dialog>

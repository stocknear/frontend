<script lang="ts">
  import { displayCompanyName, screenWidth } from "$lib/store";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import Pagination from "$lib/components/Table/Pagination.svelte";

  import Infobox from "$lib/components/Infobox.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { goto } from "$app/navigation";
  import highcharts from "$lib/highcharts.ts";
  import { createHighchartsRangeSelector } from "$lib/highchartsRangeSelector";
  import { mode } from "mode-watcher";

  export let data;
  export let ticker;

  let timePeriod = "Daily";
  let plotPeriod = "Max";
  let rawData = [];
  let originalData = [];
  let config = null;

  // Pagination state
  let currentPage = 1;
  let rowsPerPage = 20;
  let rowsPerPageOptions = [20, 50, 100];
  let totalPages = 1;
  let stockList = [];

  function prepareDataset(data, timePeriod = "Daily") {
    if (
      timePeriod === "Weekly" ||
      timePeriod === "Monthly" ||
      timePeriod === "Quarterly" ||
      timePeriod === "Annual"
    ) {
      // Group data by week, month, quarter, or year
      const aggregatedData = [];
      let currentPeriod = null;

      data.forEach((entry) => {
        const date = new Date(entry.time);
        let periodStart;
        let periodKey;

        if (timePeriod === "Weekly") {
          // Calculate the start of the week (Monday)
          const dayOfWeek = date.getDay(); // 0 for Sunday, 1 for Monday, etc.
          periodStart = new Date(
            date.setDate(date.getDate() - ((dayOfWeek + 6) % 7)), // Adjust to get Monday
          );
          periodKey = periodStart.getTime();
        } else if (timePeriod === "Monthly") {
          // Use year and month as the period key
          periodKey = `${date.getFullYear()}-${date.getMonth()}`;
          // Get the last day of the month
          periodStart = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        } else if (timePeriod === "Quarterly") {
          // Calculate quarter (0-3)
          const quarter = Math.floor(date.getMonth() / 3);
          periodKey = `${date.getFullYear()}-Q${quarter}`;
          // Get the last day of the quarter
          const lastMonthOfQuarter = (quarter + 1) * 3 - 1;
          periodStart = new Date(date.getFullYear(), lastMonthOfQuarter + 1, 0);
        } else {
          // Annual
          periodKey = date.getFullYear().toString();
          // Get the last day of the year (December 31st)
          periodStart = new Date(date.getFullYear(), 11, 31);
        }

        if (!currentPeriod || currentPeriod.periodKey !== periodKey) {
          // Start a new period
          currentPeriod = {
            periodStart,
            periodKey,
            open: entry.open,
            high: entry.high,
            low: entry.low,
            close: entry.close,
            adjClose: entry.adjClose,
            volume: entry.volume,
          };
          aggregatedData.push(currentPeriod);
        } else {
          // Update the current period's values
          // High values should be the maximum observed so far.
          currentPeriod.high = Math.max(currentPeriod.high, entry.high);

          // Low values should be the minimum observed so far.
          currentPeriod.low = Math.min(currentPeriod.low, entry.low);
          // For close values, use the most recent (current) close.
          currentPeriod.close = entry.close;
          currentPeriod.adjClose = entry.adjClose;
          // Sum volumes.
          currentPeriod.volume += entry.volume;
        }
      });

      // Replace Daily data with aggregated data including adjusted values
      data = aggregatedData.map((period) => ({
        time: period.periodStart.toISOString().split("T")[0],
        open: period.open,
        high: period.high,
        low: period.low,
        close: period.close,
        adjClose: period.adjClose,
        volume: period.volume,
      }));
    }

    // Process the data to add change and changesPercentage (using non-adjusted close values)
    const modifiedData = data?.map((entry, index, arr) => {
      if (index === 0) {
        return { ...entry, change: null, changesPercentage: null };
      }
      const previousClose = arr[index - 1]?.close;
      const currentClose = entry?.close;
      const change = (currentClose - previousClose)?.toFixed(2);
      const changesPercentage =
        previousClose !== 0
          ? (((currentClose - previousClose) / previousClose) * 100)?.toFixed(2)
          : null;
      return { ...entry, changesPercentage };
    });

    // Sort the data by "time" from latest to earliest
    return modifiedData?.sort((a, b) => new Date(b?.time) - new Date(a?.time));
  }

  // Pagination functions
  function updatePaginatedData() {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    stockList = originalData?.slice(startIndex, endIndex) || [];
    totalPages = Math.ceil((originalData?.length || 0) / rowsPerPage);
  }

  function handlePageChange(event) {
    currentPage = event.detail.page;
    updatePaginatedData();
  }

  function handleRowsPerPageChange(event) {
    rowsPerPage = event.detail.rowsPerPage;
    currentPage = 1; // Reset to first page when changing rows per page
    updatePaginatedData();
  }

  function filterDataByTimePeriod() {
    const rawData = data?.getData ?? []; // 1) grab the array (or empty)
    const now = new Date();

    // 2) compute the thresholdDate once
    let thresholdDate;
    switch (plotPeriod) {
      case "1M":
        thresholdDate = new Date(now);
        thresholdDate.setMonth(now.getMonth() - 1);
        break;
      case "3M":
        thresholdDate = new Date(now);
        thresholdDate.setMonth(now.getMonth() - 3);
        break;
      case "YTD":
        thresholdDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "1Y":
        thresholdDate = new Date(now);
        thresholdDate.setFullYear(now.getFullYear() - 1);
        break;
      case "3Y":
        thresholdDate = new Date(now);
        thresholdDate.setFullYear(now.getFullYear() - 3);
        break;
      case "5Y":
        thresholdDate = new Date(now);
        thresholdDate.setFullYear(now.getFullYear() - 5);
        break;
      default: // "Max"
        thresholdDate = new Date(0);
    }

    // 3) filter & sort
    return rawData
      ?.filter((item) => {
        const d = new Date(item.time);
        return d >= thresholdDate;
      })
      ?.sort((a, b) => new Date(a.time) - new Date(b.time));
  }

  function plotData() {
    const filteredData = filterDataByTimePeriod();

    const priceList = filteredData?.map((item) => item?.close);
    const dateList = filteredData?.map((item) =>
      Date.UTC(
        new Date(item?.time).getUTCFullYear(),
        new Date(item?.time).getUTCMonth(),
        new Date(item?.time).getUTCDate(),
        new Date(item?.time).getUTCHours(),
        new Date(item?.time).getUTCMinutes(),
      ),
    );

    // Find the lowest & highest close values
    let minValue = Math?.min(...filteredData?.map((item) => item?.close));
    let maxValue = Math?.max(...filteredData?.map((item) => item?.close));

    let padding = 0.015;
    let yMin = minValue * (1 - padding) === 0 ? null : minValue * (1 - padding);
    let yMax = maxValue * (1 + padding) === 0 ? null : maxValue * (1 + padding);

    const lineColor = "#4681f4";
    const fillColorStart = "rgb(70, 129, 244,0.5)";
    const fillColorEnd = "rgb(70, 129, 244,0.001)";
    const options = {
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        animation: false,
        height: 360,
        events: {
          render: function () {
            const chart: any = this;
            if (!chart.__rangeSelector) {
              chart.__rangeSelector = createHighchartsRangeSelector(chart, {
                getRange: () => `HISTORY_${plotPeriod}`,
                getMode: () => $mode,
              });
            }
            chart.__rangeSelector.sync(`HISTORY_${plotPeriod}`);
          },
          destroy: function () {
            const chart: any = this;
            chart.__rangeSelector?.destroy?.();
            chart.__rangeSelector = null;
          },
          // Add touch event handling to hide tooltip on mobile
          load: function () {
            const chart = this;
            let isTouching = false;

            // Track touch start
            chart.container.addEventListener("touchstart", () => {
              isTouching = true;
            });

            // Track touch end
            chart.container.addEventListener("touchend", () => {
              isTouching = false;
              chart.tooltip.hide();
            });

            // Track touch cancel
            chart.container.addEventListener("touchcancel", () => {
              isTouching = false;
              chart.tooltip.hide();
            });
          },
        },
      },
      credits: { enabled: false },
      title: {
        text: `<h3 class="mt-3 mb-1 "></h3>`,
        style: {
          color: $mode === "light" ? "black" : "white",
          // Using inline CSS for margin-top and margin-bottom
        },
        useHTML: true, // Enable HTML to apply custom class styling
      },
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 1)", // Semi-transparent black
        borderColor: "rgba(255, 255, 255, 0.2)", // Slightly visible white border
        borderWidth: 1,
        style: {
          color: $mode === "light" ? "black" : "white",
          fontSize: "16px",
          padding: "10px",
        },
        borderRadius: 4,
        formatter: function () {
          if (this.chart?.__rangeSelector?.selecting) {
            return false;
          }
          const date = new Date(this?.x);
          let formattedDate = date?.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          });

          let tooltipContent = "";

          // Loop through each point in the shared tooltip
          this.points?.forEach((point) => {
            tooltipContent += `<span class="text-white text-[1rem] font-[501]">${point.series.name}: ${point.y}</span><br>`;
          });

          // Append the formatted date at the end
          tooltipContent += `<span class="text-white m-auto text-black text-sm font-normal">${formattedDate}</span><br>`;

          return tooltipContent;
        },
      },

      xAxis: {
        type: "datetime",
        min: null,
        max: null,
        tickLength: 0,
        categories: dateList,
        crosshair: {
          color: $mode === "light" ? "black" : "white",
          width: 1,
          dashStyle: "Solid",
        },
        labels: {
          style: { color: $mode === "light" ? "black" : "white" },
          distance: 10,
          formatter: function () {
            const date = new Date(this?.value);

            const timeString = date?.toLocaleDateString("en-US", {
              year: "2-digit",
              month: "short",
              timeZone: "UTC",
            });
            return `<span class=" text-xs">${timeString}</span>`;
          },
        },
        tickPositioner: function () {
          // Create custom tick positions with wider spacing
          const positions = [];
          const info = this.getExtremes();
          const tickCount = $screenWidth < 640 ? 2 : 5; // Reduce number of ticks displayed
          const interval = Math.floor((info.max - info.min) / tickCount);

          for (let i = 0; i <= tickCount; i++) {
            positions.push(info.min + i * interval);
          }
          return positions;
        },
      },

      yAxis: {
        // Force y‑axis to stay near the actual data range
        min: yMin ?? null,
        max: yMax ?? null,
        startOnTick: false,
        endOnTick: false,
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        title: { text: null },
        labels: {
          style: { color: $mode === "light" ? "black" : "white" },
        },
        opposite: true,
      },
      plotOptions: {
        series: {
          animation: false,
          marker: { enabled: false },
          states: { hover: { enabled: false } },
        },
      },
      legend: { enabled: false },
      series: [
        {
          name: "Price",
          type: "area",
          data: priceList,
          animation: false,
          color: lineColor,
          lineWidth: 1.5,
          marker: {
            enabled: false,
          },
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, fillColorStart],
              [1, fillColorEnd],
            ],
          },
        },
      ],
    };

    return options;
  }

  $: columns = [
    { key: "time", label: "Date", align: "left" },
    { key: "open", label: "Open", align: "right" },
    { key: "high", label: "High", align: "right" },
    { key: "low", label: "Low", align: "right" },
    { key: "close", label: "Close", align: "right" },
    { key: "adjClose", label: "Adj Close", align: "right" },
    { key: "changesPercentage", label: "% Change", align: "right" },
    { key: "volume", label: "Volume", align: "right" },
  ];

  $: sortOrders = {
    time: { order: "none", type: "date" },
    open: { order: "none", type: "number" },
    high: { order: "none", type: "number" },
    low: { order: "none", type: "number" },
    close: { order: "none", type: "number" },
    adjClose: { order: "none", type: "number" },
    changesPercentage: { order: "none", type: "number" },
    volume: { order: "none", type: "number" },
  };

  const sortData = (key) => {
    // Reset all other keys to 'none' except the current key
    for (const k in sortOrders) {
      if (k !== key) {
        sortOrders[k].order = "none";
      }
    }

    // Cycle through 'none', 'asc', 'desc' for the clicked key
    const orderCycle = ["none", "asc", "desc"];

    const currentOrderIndex = orderCycle.indexOf(sortOrders[key].order);
    sortOrders[key].order =
      orderCycle[(currentOrderIndex + 1) % orderCycle.length];
    const sortOrder = sortOrders[key].order;

    // Reset to original data when 'none' and stop further sorting
    if (sortOrder === "none") {
      originalData = [...rawData]; // Reset originalData to rawData
      currentPage = 1; // Reset to first page
      updatePaginatedData(); // Reset displayed data with pagination
      return;
    }

    // Define a generic comparison function
    const compareValues = (a, b) => {
      const { type } = sortOrders[key];
      let valueA, valueB;

      switch (type) {
        case "date":
          valueA = new Date(a[key]);
          valueB = new Date(b[key]);
          break;
        case "string":
          valueA = a[key].toUpperCase();
          valueB = b[key].toUpperCase();
          return sortOrder === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        case "number":
        default:
          valueA = parseFloat(a[key]);
          valueB = parseFloat(b[key]);
          break;
      }

      if (sortOrder === "asc") {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    };

    // Sort using the generic comparison function
    originalData = [...originalData].sort(compareValues);
    currentPage = 1; // Reset to first page after sorting
    updatePaginatedData(); // Update displayed data with pagination
  };

  $: {
    if (timePeriod || $mode) {
      rawData = data?.getData || [];
      config = plotData();
      rawData = prepareDataset(data?.getData, timePeriod);
      originalData = rawData;
      currentPage = 1; // Reset to first page when data changes
      updatePaginatedData();
    }
  }

  $: {
    if (plotPeriod) {
      config = plotData();
    }
  }
</script>

<section class=" overflow-hidden h-full w-full mt-5 sm:mt-0">
  <div class="w-full overflow-hidden m-auto">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto">
            {#if config}
              <h1 class="text-xl sm:text-2xl font-bold mb-3">
                {ticker} Stock Price History
              </h1>
              <div class="relative">
                <div
                  class="hidden sm:flex justify-start space-x-2 w-full ml-2 absolute top-3.5 z-10"
                >
                  {#each ["1M", "3M", "YTD", "1Y", "3Y", "5Y", "Max"] as item}
                    <label
                      on:click={() => (plotPeriod = item)}
                      class="px-3 py-1 {plotPeriod === item
                        ? 'bg-black dark:bg-white text-white dark:text-black'
                        : 'shadow text-muted dark:text-white bg-gray-100 dark:bg-table '} text-xs border border-gray-200 dark:border-gray-700 transition ease-out duration-100 sm:hover:bg-black dark:sm:hover:bg-white sm:hover:text-white dark:sm:hover:text-black rounded-[2px] cursor-pointer"
                    >
                      {item}
                    </label>
                  {/each}
                </div>
              </div>
              <div
                class="border border-gray-300 dark:border-gray-800 rounded w-full"
                use:highcharts={config}
              ></div>
            {/if}

            {#if rawData?.length > 0}
              <div
                class="mt-5 border-t border-b pt-2 pb-2 border-gray-300 dark:border-gray-800 flex flex-row items-center w-full sm:justify-between md:space-x-4 w-full mb-3"
              >
                <h2 class="text-xl sm:text-2xl font-bold">Historical Data</h2>
                <div class="flex flex-row items-center ml-auto w-fit">
                  <div class="relative inline-block text-left ml-auto mr-2">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild let:builder>
                        <Button
                          builders={[builder]}
                          class="transition-all w-fit border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary ease-out flex flex-row justify-between items-center px-3 py-2 rounded truncate"
                        >
                          <span class="truncate px-1">{timePeriod}</span>
                          <svg
                            class="-mr-1 ml-1 h-5 w-5 xs:ml-2 inline-block"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            style="max-width:40px"
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
                        align="end"
                        sideOffset={10}
                        alignOffset={0}
                        class="w-56 h-fit max-h-72 overflow-y-auto scroller"
                      >
                        <DropdownMenu.Label
                          class="text-muted dark:text-gray-400 font-normal"
                        >
                          Select time frame
                        </DropdownMenu.Label>
                        <DropdownMenu.Separator />
                        <DropdownMenu.Group>
                          <DropdownMenu.Item
                            on:click={() => (timePeriod = "Daily")}
                            class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                          >
                            Daily
                          </DropdownMenu.Item>

                          {#if !["Pro", "Plus"]?.includes(data?.user?.tier)}
                            {#each ["Weekly", "Monthly", "Quarterly", "Annual"] as entry}
                              <DropdownMenu.Item
                                on:click={() => goto("/pricing")}
                                class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                              >
                                {entry}
                                <svg
                                  class="ml-auto -mt-0.5 w-4 h-4 inline-block"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  ><path
                                    fill="currentColor"
                                    d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                  /></svg
                                >
                              </DropdownMenu.Item>
                            {/each}
                          {:else}
                            <DropdownMenu.Item
                              on:click={() => (timePeriod = "Monthly")}
                              class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                            >
                              Monthly
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              on:click={() => (timePeriod = "Quarterly")}
                              class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                            >
                              Quarterly
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              on:click={() => (timePeriod = "Annual")}
                              class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                            >
                              Annual
                            </DropdownMenu.Item>
                          {/if}
                        </DropdownMenu.Group>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </div>

                  <DownloadData
                    {data}
                    {rawData}
                    title={`historical_price_${ticker}`}
                  />
                </div>
              </div>

              <div class="w-full m-auto">
                <div
                  class="w-full m-auto rounded-none sm:rounded mb-4 overflow-x-auto"
                >
                  <table
                    class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
                  >
                    <thead>
                      <TableHeader {columns} {sortOrders} {sortData} />
                    </thead>

                    <tbody>
                      {#each stockList as item, index}
                        <tr
                          class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
                        >
                          <td
                            class="text-start text-sm sm:text-[1rem] whitespace-nowrap"
                          >
                            {#if timePeriod === "Weekly"}
                              Week of {new Date(item?.time).toLocaleString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  timeZone: "Europe/Berlin",
                                },
                              )}
                            {:else}
                              {new Date(item?.time).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                timeZone: "Europe/Berlin",
                              })}
                            {/if}
                          </td>
                          <td
                            class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
                          >
                            {item?.open?.toFixed(2)}
                          </td>

                          <td
                            class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
                          >
                            {item?.high?.toFixed(2)}
                          </td>

                          <td
                            class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
                          >
                            {item?.low?.toFixed(2)}
                          </td>

                          <td
                            class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
                          >
                            {item?.close?.toFixed(2)}
                          </td>

                          <td
                            class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
                          >
                            {item?.adjClose !== undefined
                              ? item?.adjClose?.toFixed(2)
                              : "n/a"}
                          </td>

                          <td
                            class="text-sm sm:text-[1rem] {item?.changesPercentage >=
                              0 && item?.changesPercentage !== null
                              ? "text-green-800 dark:text-[#00FC50] before:content-['+'] "
                              : item?.changesPercentage < 0 &&
                                  item?.changesPercentage !== null
                                ? 'text-red-800 dark:text-[#FF2F1F]'
                                : ''} text-end"
                          >
                            {item?.changesPercentage !== null
                              ? item?.changesPercentage + "%"
                              : "n/a"}
                          </td>
                          <td
                            class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
                          >
                            {item?.volume?.toLocaleString("en-US")}
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>

                {#if originalData?.length > rowsPerPage}
                  <Pagination
                    {currentPage}
                    {totalPages}
                    {rowsPerPage}
                    {rowsPerPageOptions}
                    on:pageChange={handlePageChange}
                    on:rowsPerPageChange={handleRowsPerPageChange}
                  />
                {/if}
              </div>
            {:else}
              <Infobox
                text={`No price history are available for ${$displayCompanyName}.`}
              />
            {/if}
          </div>
        </main>
      </div>
    </div>
  </div>
</section>

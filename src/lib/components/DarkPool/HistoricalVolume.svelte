<script lang="ts">
  import { displayCompanyName, stockTicker, etfTicker } from "$lib/store";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";

  import highcharts from "$lib/highcharts.ts";
  import { goto } from "$app/navigation";
  import { mode } from "mode-watcher";

  export let data;
  export let rawData = [];

  function addChangesPercentage(data) {
    // First, sort by date ascending
    const sorted = [...data].sort(
      (a, b) => new Date(b?.date) - new Date(a?.date),
    );

    // Then, calculate changesPercentage compared to next item
    return sorted.map((item, index, arr) => {
      if (index === arr.length - 1) {
        return { ...item, changesPercentage: null };
      }

      const nextValue = arr[index + 1]?.shortVolume;
      const pctChange = ((item.shortVolume - nextValue) / nextValue) * 100;

      return {
        ...item,
        changesPercentage: parseFloat(pctChange?.toFixed(2)),
      };
    });
  }

  const toNum = (x) => (typeof x === "number" ? x : 0);

  function computeWithLongVolume(rawData) {
    if (!Array.isArray(rawData) || rawData.length === 0) return [];

    const n = rawData.length;
    const out = new Array(n);

    for (let i = 0; i < n; i++) {
      const item = rawData[i] || {};
      const total = toNum(item.totalVolume);
      const short = toNum(item.shortVolume);

      // compute longVolume once
      const longVolume = total - short;
      // avoid division by zero
      const longShortRatio = short !== 0 ? longVolume / short : null; // or Infinity, 0, whatever makes sense for you

      out[i] = {
        ...item,
        longVolume,
        longShortRatio,
      };
    }

    return out;
  }

  rawData = computeWithLongVolume(rawData);
  rawData = addChangesPercentage(rawData);

  const originalData = rawData;
  let activeIdx = 0;
  const tabs = [
    {
      title: "Weekly",
    },
    {
      title: "Quarterly",
    },
  ];

  let config = null;
  let avgVolume = 0;
  let avgShortVolume = 0;
  let monthlyVolume = "";
  let avgMonthlyShort = "";

  function findMonthlyValue(data, lastDateStr) {
    const lastDate = new Date(lastDateStr);
    const firstDate = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1);

    const filteredData = data.filter((item) => {
      const currentDate = new Date(item?.date);
      return currentDate >= firstDate && currentDate <= lastDate;
    });

    monthlyVolume = abbreviateNumber(
      filteredData.reduce((acc, item) => acc + (item?.totalVolume || 0), 0),
    );

    const totalShortPercent = filteredData.reduce(
      (acc, item) => acc + (item?.shortPercent || 0),
      0,
    );
    avgMonthlyShort =
      (totalShortPercent / filteredData?.length)?.toFixed(2) || "0.00";
  }

  function getPlotOptions() {
    // Prepare the data arrays
    const sortedChartData = [...rawData]?.sort(
      (a, b) => new Date(a?.date).getTime() - new Date(b?.date).getTime(),
    );
    const dates = sortedChartData?.map((item) => item?.date);
    const totalVolumeList = sortedChartData.map(
      (item) => item?.totalVolume || 0,
    );
    const shortVolumeList = sortedChartData.map(
      (item) => item?.shortVolume || 0,
    );

    // Call side-effect function as in your original code
    findMonthlyValue(sortedChartData, sortedChartData.at(-1)?.date);

    // Compute averages (these remain global if used elsewhere)
    avgVolume =
      Math.floor(
        totalVolumeList.reduce((acc, val) => acc + val, 0) /
          totalVolumeList?.length,
      ) || 0;
    avgShortVolume =
      Math.floor(
        shortVolumeList?.reduce((acc, val) => acc + val, 0) /
          shortVolumeList?.length,
      ) || 0;

    const options = {
      credits: {
        enabled: false,
      },
      chart: {
        type: "line",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 360,
        spacingTop: 5,
        animation: false,
      },
      title: {
        text: `<h3 class="mt-3 -mb-3 text-[1rem] sm:text-lg">${removeCompanyStrings($displayCompanyName)} Historical Chart</h3>`,
        style: {
          color: $mode === "light" ? "black" : "white",
        },
        useHTML: true,
      },
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
      xAxis: {
        type: "datetime",
        endOnTick: false,
        categories: dates,
        crosshair: {
          color: $mode === "light" ? "black" : "white", // Set the color of the crosshair line
          width: 1, // Adjust the line width as needed
          dashStyle: "Solid",
        },
        labels: {
          style: {
            color: $mode === "light" ? "#545454" : "white",
          },
          distance: 20, // Increases space between label and axis
          formatter: function () {
            const date = new Date(this.value);
            return date.toLocaleDateString("en-US", {
              day: "2-digit", // Include day number
              month: "short", // Display short month name
              year: "numeric", // Include year
            });
          },
        },
      },
      yAxis: [
        {
          gridLineWidth: 1,
          gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
          labels: {
            enabled: false,
          },
          title: {
            text: null,
          },
          opposite: true,
        },
        {
          labels: {
            enabled: false,
          },
          title: {
            text: null,
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
      plotOptions: {
        series: {
          color: "white",
          legendSymbol: "rectangle",
          animation: false, // Disable series animation
          states: {
            hover: {
              enabled: false, // Disable hover effect globally
            },
          },
        },
      },
      series: [
        {
          name: "Total Volume",
          data: totalVolumeList,
          type: "line",
          color: $mode === "light" ? "#2C6288" : "white",
        },
        {
          name: "Short Volume",
          data: shortVolumeList,
          // Using an 'area' type to mimic the areaStyle option
          type: "area",
          color: "#E11D48",
          fillOpacity: 1,
          marker: {
            enabled: false,
          },
        },
      ],
    };

    return options;
  }

  let tableList = [];

  changeTimePeriod(activeIdx);

  function changeTimePeriod(i) {
    activeIdx = i;
    if (activeIdx === 0) {
      tableList = filterByPeriod(originalData, "weekly");
    } else if (activeIdx === 1) {
      tableList = filterByPeriod(originalData);
    }

    tableList = addChangesPercentage(tableList);
  }

  function filterByPeriod(data, period = "quarterly") {
    if (!Array.isArray(data) || data.length === 0) return [];

    // Keep track of seen period keys
    const seenPeriods = new Set();

    return data.filter((item) => {
      const dt = new Date(item.date);
      const year = dt.getFullYear();
      let key;

      switch (period) {
        case "weekly":
          // ISO week number calculation
          const tmp = new Date(
            Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()),
          );
          const dayNum = tmp.getUTCDay() || 7; // Monday=1, Sunday=7
          tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
          const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
          const weekNo = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
          key = `${year}-W${weekNo}`;
          break;

        case "quarterly":
        default:
          // Quarter calculation
          const quarter = Math.floor(dt.getMonth() / 3) + 1; // 1 to 4
          key = `${year}-Q${quarter}`;
          break;
      }

      if (!seenPeriods.has(key)) {
        seenPeriods.add(key);
        return true;
      }
      return false;
    });
  }

  let columns = [
    { key: "date", label: "Date", align: "left" },
    { key: "longVolume", label: "Long Volume", align: "right" },
    { key: "shortVolume", label: "Short Volume", align: "right" },
    { key: "longShortRatio", label: "Long / Short", align: "right" },
    { key: "changesPercentage", label: "% Short Change", align: "right" },
  ];

  let sortOrders = {
    date: { order: "none", type: "date" },
    longVolume: { order: "none", type: "number" },
    shortVolume: { order: "none", type: "number" },
    longShortRatio: { order: "none", type: "number" },
    changesPercentage: { order: "none", type: "number" },
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

    tableList = tableList?.sort(
      (a, b) => new Date(b?.date) - new Date(a?.date),
    );

    let originalData = tableList;

    const currentOrderIndex = orderCycle.indexOf(sortOrders[key].order);
    sortOrders[key].order =
      orderCycle[(currentOrderIndex + 1) % orderCycle.length];
    const sortOrder = sortOrders[key].order;

    // Reset to original data when 'none' and stop further sorting
    if (sortOrder === "none") {
      tableList = [...originalData]; // Reset to original data (spread to avoid mutation)
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
    tableList = [...originalData].sort(compareValues);
  };

  $: if ($mode) {
    config = getPlotOptions() || null;
  }
</script>

<section class="overflow-hidden h-full pb-8">
  <main class="overflow-hidden">
    <div class="flex flex-row items-center">
      <label
        for="historicalDataInfo"
        class="mr-1 cursor-pointer flex flex-row items-center text-xl sm:text-2xl font-bold"
      >
        Historical Chart
      </label>
      <InfoModal
        title={"Historical Data"}
        content={"By analyzing historical dark pool activity, retail investors can gauge market sentiment through total and short volumes. High short volume may indicate bearish sentiment."}
        id={"historicalDataInfo"}
      />
    </div>

    {#if rawData?.length !== 0}
      <div class="w-full flex flex-col items-start">
        <div class=" text-[1rem] mt-2 mb-2 w-full">
          Over the past 12 months, {removeCompanyStrings($displayCompanyName)} has
          experienced an average dark pool trading volume of
          <span class="font-semibold">{abbreviateNumber(avgVolume)}</span>
          shares. Out of this total, an average of
          <span class="font-semibold">{abbreviateNumber(avgShortVolume)}</span>
          shares, constituting approximately
          <span class="font-semibold"
            >{((avgShortVolume / avgVolume) * 100)?.toFixed(2)}%</span
          >, were short volume.
        </div>
      </div>

      <div>
        <div class="grow">
          <div class="relative">
            <!-- Apply the blur class to the chart -->
            <div
              class="{!['Pro']?.includes(data?.user?.tier)
                ? 'blur-[3px]'
                : ''} mt-5 shadow-xs sm:mt-0 border border-gray-300 dark:border-gray-800 rounded"
              use:highcharts={config}
            ></div>
            <!-- Overlay with "Upgrade to Pro" -->
            {#if !["Pro"]?.includes(data?.user?.tier)}
              <div
                class="font-bold text-lg sm:text-xl absolute top-0 bottom-0 left-0 right-0 flex items-center justify-center text-muted dark:text-white"
              >
                <a
                  href="/pricing"
                  class="sm:hover:text-blue-700 dark:sm:hover:text-white dark:text-white flex flex-row items-center"
                >
                  <span>Upgrade to Pro</span>
                  <svg
                    class="ml-1 w-5 h-5 sm:w-6 sm:h-6 inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    ><path
                      fill="currentColor"
                      d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                    /></svg
                  >
                </a>
              </div>
            {/if}
          </div>
        </div>
      </div>

      <div
        class="mt-5 flex flex-col sm:flex-row items-start sm:items-center w-full justify-between sm:border-y border-gray-300 dark:border-gray-800 sm:pt-2 sm:pb-2"
      >
        <h3 class="text-xl sm:text-2xl font-bold mb-2 sm:mb-0">
          Dark Pool Table
        </h3>

        <div
          class="inline-flex justify-center w-full rounded sm:w-auto sm:ml-auto"
        >
          <div
            class="bg-default text-white dark:bg-secondary w-full min-w-24 sm:w-fit relative flex flex-wrap items-center justify-center rounded p-1"
          >
            {#each tabs as item, i}
              {#if data?.user?.tier !== "Pro" && i > 0}
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
                  on:click={() => changeTimePeriod(i)}
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

      <div class="w-full overflow-x-auto mt-3">
        <table
          class="table table-sm table-compact no-scrollbar rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
        >
          <thead>
            <TableHeader {columns} {sortOrders} {sortData} />
          </thead>
          <tbody>
            {#each data?.user?.tier === "Pro" ? tableList : tableList?.slice(0, 3) as item, index}
              <!-- row -->
              <tr
                class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd {index +
                  1 ===
                  tableList?.slice(0, 3)?.length &&
                !['Pro']?.includes(data?.user?.tier)
                  ? 'opacity-[0.1]'
                  : ''}"
              >
                <td class=" text-sm sm:text-[1rem] whitespace-nowrap">
                  {new Date(item?.date)?.toLocaleDateString("en-US", {
                    day: "2-digit", // Include day number
                    month: "short", // Display short month name
                    year: "numeric", // Include year
                  })}
                </td>

                <td
                  class=" text-sm sm:text-[1rem] text-right whitespace-nowrap"
                >
                  {abbreviateNumber(item?.longVolume)}
                </td>

                <td
                  class=" text-sm sm:text-[1rem] text-right whitespace-nowrap"
                >
                  {abbreviateNumber(item?.shortVolume)}
                </td>

                <td
                  class=" text-sm sm:text-[1rem] text-right whitespace-nowrap"
                >
                  {item?.longShortRatio
                    ? item?.longShortRatio?.toFixed(2)
                    : "n/a"}
                </td>

                <td class=" text-sm sm:text-[1rem] whitespace-nowrap text-end">
                  {#if item?.changesPercentage}
                    <span
                      class={item?.changesPercentage >= 0
                        ? "text-green-800 dark:text-[#00FC50] before:content-['+']"
                        : "text-red-800 dark:text-[#FF2F1F]"}
                    >
                      {item?.changesPercentage
                        ? item?.changesPercentage + "%"
                        : "n/a"}
                    </span>
                  {:else}
                    n/a
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <UpgradeToPro {data} display={true} />
    {/if}
  </main>
</section>

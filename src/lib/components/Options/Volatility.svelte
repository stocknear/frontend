<script lang="ts">
  import { removeCompanyStrings, abbreviateNumber } from "$lib/utils";
  import { displayCompanyName } from "$lib/store";
  import { onMount } from "svelte";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";

  export let data;
  export let ticker;

  let isLoaded = false;
  let rawData;

  let avgIV;
  let avgRV;
  let displayList;
  let timePeriod;

  let config = null;

  initialize();

  function initialize() {
    rawData = data?.getData || [];
    avgIV =
      rawData?.reduce((acc, entry) => acc + entry.iv, 0) / rawData?.length;
    avgRV =
      rawData?.reduce((acc, entry) => acc + entry.rv, 0) / rawData?.length;

    displayList = rawData?.slice(0, 150);
    timePeriod = "3M";

    config = plotData();
  }

  function filterDataByPeriod(historicalData, period = "3M") {
    const currentDate = new Date();
    let startDate = new Date();

    // Calculate the start date based on the period input
    switch (period) {
      case "3M":
        startDate.setMonth(currentDate.getMonth() - 3);
        break;
      case "6M":
        startDate.setMonth(currentDate.getMonth() - 6);
        break;
      case "1Y":
        startDate.setFullYear(currentDate.getFullYear() - 1);
        break;
      default:
        throw new Error(`Unsupported period: ${period}`);
    }

    // Filter the data based on the calculated start date
    let filteredData = historicalData?.filter((item) => {
      if (!item?.date) return false;
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= currentDate;
    });

    filteredData?.forEach((entry) => {
      const matchingData = data?.getHistoricalPrice?.find(
        (d) => d?.time === entry?.date,
      );
      if (matchingData) {
        entry.price = matchingData?.close;
      }
    });

    // Extract the dates and gamma values from the filtered data
    const dateList = filteredData?.map((item) => item.date);
    const impliedVolatility = filteredData?.map((item) => item?.iv);
    const realizedVolatility = filteredData?.map((item) => item?.rv);

    const priceList = filteredData
      ?.map((item) => item.price)
      ?.filter((price) => price != null); // Filter out null/undefined

    return {
      dateList,
      impliedVolatility,
      realizedVolatility,
      priceList,
    };
  }

  function plotData() {
    // Sort and filter the raw data as before
    const data = rawData?.sort((a, b) => new Date(a?.date) - new Date(b?.date));
    const { dateList, impliedVolatility, realizedVolatility, priceList } =
      filterDataByPeriod(data, timePeriod);

    const options = {
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        animation: false,
        height: 360,
      },
      credits: { enabled: false },
      legend: {
        enabled: true,
        align: "center", // left side
        verticalAlign: "top", // top edge
        layout: "horizontal",
        squareSymbol: false, // use our rectangle shape
        symbolWidth: 20,
        symbolHeight: 12,
        symbolRadius: 0,

        itemStyle: {
          color: $mode === "light" ? "black" : "white",
        },
      },
      title: {
        text: `<h3 class="mt-3 -mb-2 text-[1rem] sm:text-lg">Volatiltiy Exposure</h3>`,
        useHTML: true,
        style: { color: $mode === "light" ? "black" : "white" },
      },
      // Disable markers globally on hover for all series
      xAxis: {
        type: "datetime",
        endOnTick: false,
        categories: dateList,
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
              month: "short",
              year: "numeric",
            });
          },
        },
        tickPositioner: function () {
          // Create custom tick positions with wider spacing
          const positions = [];
          const info = this.getExtremes();
          const tickCount = 5; // Reduce number of ticks displayed
          const interval = Math?.floor((info?.max - info?.min) / tickCount);

          for (let i = 0; i <= tickCount; i++) {
            positions?.push(info?.min + i * interval);
          }
          return positions;
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
          // Primary yAxis (left) – for volatility series
          labels: { enabled: false },
          title: { text: null },
          gridLineWidth: 0,
        },
        {
          // Primary yAxis (left) – for volatility series
          labels: { enabled: false },
          title: { text: null },
          gridLineWidth: 0,
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
          legendSymbol: "rectangle",
          marker: {
            enabled: false,
            states: {
              hover: {
                enabled: false,
              },
            },
          },
          color: $mode === "light" ? "black" : "white",
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
          name: "Stock Price",
          type: "spline", // smooth line
          data: priceList,
          yAxis: 1,
          color: $mode === "light" ? "#000" : "#fff",
          lineWidth: 1.3,
          animation: false,
        },
        {
          name: "Implied Volatility",
          type: "spline",
          data: impliedVolatility,
          lineWidth: 2,
          yAxis: 0,
          color: $mode === "light" ? "#C69307" : "#FAD776",
          animation: false,
        },
        {
          name: "Realized Volatility",
          type: "spline",
          data: realizedVolatility,
          lineWidth: 2,
          yAxis: 0,
          color: "#007BFF",
          animation: false,
        },
      ],
    };

    return options;
  }

  function formatDate(dateStr) {
    // Convert the input date string to a Date object in UTC
    let date = new Date(dateStr + "T00:00:00Z");

    // Use the desired format and set timezone if needed
    let options = {
      timeZone: "UTC",
      month: "short", // Full month name
      day: "numeric", // Day without leading zero
      year: "numeric", // Full year
    };

    let formatter = new Intl.DateTimeFormat("en-US", options);

    return formatter.format(date); // e.g., April 11, 2025
  }

  async function handleScroll() {
    const scrollThreshold = document.body.offsetHeight * 0.8; // 80% of the website height
    const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;

    if (isBottom && displayList?.length !== rawData?.length) {
      const nextIndex = displayList?.length;
      const filteredNewResults = rawData?.slice(nextIndex, nextIndex + 50);
      displayList = [...displayList, ...filteredNewResults];
    }
  }

  onMount(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  });

  $: columns = [
    { key: "date", label: "Date", align: "left" },
    {
      key: "changesPercentage",
      label: "% Change",
      align: "right",
    },
    {
      key: "putCallRatio",
      label: "P/C",
      align: "right",
    },
    {
      key: "total_open_interest",
      label: "Total OI",
      align: "right",
    },
    {
      key: "changesPercentageOI",
      label: "% OI Change",
      align: "right",
    },
    {
      key: "iv",
      label: "Implied Volatility",
      align: "right",
    },
    {
      key: "rv",
      label: "Realized Vol.",
      align: "right",
    },
  ];

  $: sortOrders = {
    date: { order: "none", type: "date" },
    changesPercentage: { order: "none", type: "number" },
    putCallRatio: { order: "none", type: "number" },
    iv: { order: "none", type: "number" },
    rv: { order: "none", type: "number" },
    total_open_interest: { order: "none", type: "number" },
    changesPercentageOI: { order: "none", type: "number" },
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
    let originalData = rawData?.sort(
      (a, b) => new Date(b?.date) - new Date(a?.date),
    );
    const currentOrderIndex = orderCycle.indexOf(sortOrders[key].order);
    sortOrders[key].order =
      orderCycle[(currentOrderIndex + 1) % orderCycle.length];
    const sortOrder = sortOrders[key].order;

    // Reset to original data when 'none' and stop further sorting
    if (sortOrder === "none") {
      originalData = [...rawData]; // Reset originalData to rawDataVolume
      displayList = originalData;
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
    displayList = [...originalData].sort(compareValues);
  };

  $: {
    if (timePeriod || $mode) {
      config = plotData() || null;
    }
  }
</script>

<div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto mt-2 sm:mt-0">
  <h2 class=" flex flex-row items-center text-xl sm:text-2xl font-bold w-fit">
    {ticker} Volatility Exposure
  </h2>
  <div class="w-full mt-2">
    {removeCompanyStrings($displayCompanyName)} has experienced an average implied
    volatility of {avgIV?.toFixed(2)} and an average realized volatility of {avgRV?.toFixed(
      2,
    )}.
  </div>

  <div class="w-full overflow-hidden m-auto">
    {#if config}
      <div class="flex justify-end pt-5 pb-2 space-x-2 ml-auto z-10">
        {#each ["3M", "6M", "1Y"] as item, index}
          {#if data?.user?.tier === "Pro" || index === 0}
            <label
              on:click={() => (timePeriod = item)}
              class="px-3 py-1 text-sm shadow-xs border-gray-300 dark:border-gray-600 {timePeriod ===
              item
                ? 'bg-gray-300 dark:bg-white text-black '
                : ' bg-gray-100 dark:bg-table text-opacity-[0.6]'} transition ease-out duration-100 rounded cursor-pointer"
            >
              {item}
            </label>
          {:else if data?.user?.tier !== "Pro"}
            <a
              href="/pricing"
              class="px-3 py-1 text-sm flex flex-row items-center border border-gray-300 dark:border-gray-600 {timePeriod ===
              item
                ? 'bg-gray-300 dark:bg-white text-black '
                : ' bg-gray-100 dark:bg-table text-opacity-[0.6]'} transition ease-out duration-100 rounded cursor-pointer"
            >
              {item}
              <svg
                class="ml-1 -mt-w-3.5 h-3.5 inline-block"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                ><path
                  fill="currentColor"
                  d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                /></svg
              >
            </a>
          {/if}
        {/each}
      </div>
      <div
        class="border border-gray-300 dark:border-gray-800 rounded w-full"
        use:highcharts={config}
      ></div>
    {/if}
  </div>

  <h3 class="mt-5 text-xl sm:text-2xl font-bold mb-2 sm:mb-0">
    Volatility History
  </h3>
  <div class="w-full overflow-x-auto mt-5">
    <table
      class="table table-sm table-compact no-scrollbar rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto mt-4"
    >
      <thead>
        <TableHeader {columns} {sortOrders} {sortData} />
      </thead>
      <tbody>
        {#each data?.user?.tier === "Pro" ? displayList : displayList?.slice(0, 3) as item, index}
          <tr
            class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd {index +
              1 ===
              displayList?.slice(0, 3)?.length &&
            !['Pro']?.includes(data?.user?.tier)
              ? 'opacity-[0.1]'
              : ''}"
          >
            <td class=" text-sm sm:text-[1rem] text-start whitespace-nowrap">
              {formatDate(item?.date)}
            </td>

            <td class=" text-sm sm:text-[1rem] text-end">
              {#if item?.changesPercentage >= 0 && item?.changesPercentage !== null}
                <span class="text-green-800 dark:text-[#00FC50]"
                  >+{item?.changesPercentage >= 1000
                    ? abbreviateNumber(item?.changesPercentage)
                    : item?.changesPercentage?.toFixed(2)}%</span
                >
              {:else if item?.changesPercentage < 0 && item?.changesPercentage !== null}
                <span class="text-red-800 dark:text-[#FF2F1F]"
                  >{item?.changesPercentage <= -1000
                    ? abbreviateNumber(item?.changesPercentage)
                    : item?.changesPercentage?.toFixed(2)}%
                </span>
              {:else}
                n/a
              {/if}
            </td>

            <td class="text-sm sm:text-[1rem] text-end">
              {item?.putCallRatio}
            </td>

            <td class="text-sm sm:text-[1rem] text-end">
              {@html abbreviateNumber(item?.total_open_interest, false, true)}
            </td>

            <td class=" text-sm sm:text-[1rem] text-end">
              {#if item?.changesPercentageOI >= 0 && item?.changesPercentageOI !== null}
                <span class="text-green-800 dark:text-[#00FC50]"
                  >+{item?.changesPercentageOI >= 1000
                    ? abbreviateNumber(item?.changesPercentageOI)
                    : item?.changesPercentageOI?.toFixed(2)}%</span
                >
              {:else if item?.changesPercentageOI < 0 && item?.changesPercentageOI !== null}
                <span class="text-red-800 dark:text-[#FF2F1F]"
                  >{item?.changesPercentageOI <= -1000
                    ? abbreviateNumber(item?.changesPercentageOI)
                    : item?.changesPercentageOI?.toFixed(2)}%
                </span>
              {:else}
                <span class=""> n/a </span>
              {/if}
            </td>

            <td class=" text-sm sm:text-[1rem] text-end whitespace-nowrap">
              {item?.iv}
            </td>
            <td class=" text-sm sm:text-[1rem] text-end whitespace-nowrap">
              {item?.rv ?? "n/a"}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <UpgradeToPro {data} display={true} />
</div>

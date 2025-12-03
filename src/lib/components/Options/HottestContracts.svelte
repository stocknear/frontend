<script lang="ts">
  import { screenWidth } from "$lib/store";

  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";

  export let data;
  export let ticker;
  export let title;
  export let type;
  export let assetType;

  let isLoaded = false;
  let config = null;

  let rawDataHistory = [];

  let rawData = [];
  let tableData = [];

  function convertDateFormat(dateString) {
    // Check if the input is a valid string
    if (!dateString || typeof dateString !== "string") {
      return null;
    }

    // Split the date string by '-'
    const parts = dateString.split("-");

    // Validate that we have exactly 3 parts
    if (parts.length !== 3) {
      return null;
    }

    const [year, month, day] = parts;

    // Basic validation
    if (!year || !month || !day || year.length !== 4) {
      return null;
    }

    // Return in mm/dd/yyyy format
    return `${month}/${day}/${year?.slice(-2)}`;
  }

  function initialize() {
    rawDataHistory = [];
    if (type === "oi") {
      rawData = data?.getData?.openInterest?.map((item) => ({
        ...item,
        dte: daysLeft(item?.date_expiration),
        otm: computeOTM(item?.strike_price, item?.option_type),
      }));
      tableData = rawData;
    } else {
      rawData = data?.getData?.volume?.map((item) => ({
        ...item,
        dte: daysLeft(item?.date_expiration),
        otm: computeOTM(item?.strike_price, item?.option_type),
      }));

      tableData = rawData;
    }
  }

  function computeOTM(strikePrice, optionType) {
    // Get the current stock price
    const currentPrice = data?.getStockQuote?.price;

    let otmPercentage = 0;

    if (optionType === "C") {
      // Call option: OTM is positive if strike > currentPrice, negative (ITM) otherwise
      otmPercentage = (
        ((strikePrice - currentPrice) / currentPrice) *
        100
      )?.toFixed(2);
    } else if (optionType === "P") {
      // Put option: OTM is positive if strike < currentPrice, negative (ITM) otherwise
      otmPercentage = (
        ((currentPrice - strikePrice) / currentPrice) *
        100
      )?.toFixed(2);
    } else {
      otmPercentage = "n/a";
    }

    return otmPercentage; // Return the percentage rounded to two decimal places
  }

  const currentTime = new Date(
    new Date().toLocaleString("en-US", { timeZone: "UTC" }),
  )?.getTime();

  function daysLeft(targetDate) {
    const targetTime = new Date(targetDate).getTime();
    const difference = targetTime - currentTime;

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const daysLeft = Math?.ceil(difference / millisecondsPerDay);

    return daysLeft + "D";
  }

  $: columns = [
    { key: "strike_price", label: "Type", align: "left" },
    { key: "dte", label: "DTE", align: "right" },
    { key: "otm", label: "% OTM", align: "right" },
    { key: "last", label: "Last", align: "right" },
    { key: "high", label: "Low-High", align: "right" },
    { key: "volume", label: "Volume", align: "right" },
    { key: "open_interest", label: "OI", align: "right" },
    { key: "changeOI", label: "OI Change", align: "right" },
    { key: "iv", label: "IV", align: "right" },
    { key: "total_premium", label: "Prem", align: "right" },
    { key: "option_symbol", label: "Option Symbol", align: "right" },
  ];

  $: sortOrders = {
    strike_price: { order: "none", type: "number" },
    dte: { order: "none", type: "number" },
    otm: { order: "none", type: "number" },
    last: { order: "none", type: "number" },
    high: { order: "none", type: "number" },
    volume: { order: "none", type: "number" },
    open_interest: { order: "none", type: "number" },
    changeOI: { order: "none", type: "number" },
    iv: { order: "none", type: "number" },
    total_premium: { order: "none", type: "number" },
    option_symbol: { order: "none", type: "string" },
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
    let originalData = rawData;
    const currentOrderIndex = orderCycle.indexOf(sortOrders[key].order);
    sortOrders[key].order =
      orderCycle[(currentOrderIndex + 1) % orderCycle.length];
    const sortOrder = sortOrders[key].order;

    // Reset to original data when 'none' and stop further sorting
    if (sortOrder === "none") {
      originalData = [...rawData]; // Reset originalData to rawData
      tableData = originalData;
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
    tableData = [...originalData].sort(compareValues);
  };

  function plotBarChart() {
    // Transform raw data
    let sortedData = [];
    if (type === "oi") {
      sortedData = [...rawData]?.sort(
        (a, b) => b?.open_interest - a?.open_interest,
      );
    } else {
      sortedData = [...rawData]?.sort((a, b) => b?.volume - a?.volume);
    }

    const categories = sortedData?.map(
      (item) =>
        `${convertDateFormat(item.date_expiration)} ${item.strike_price}${item.option_type}`,
    );
    const data = sortedData.map((item) => ({
      y: type === "oi" ? item.open_interest : item.volume,
      color: item.option_type === "P" ? "#f87171" : "#34d399", // red for Puts, greenish for Calls
      // Store the original data for tooltip access
      originalData: item,
    }));

    const options = {
      credits: {
        enabled: false,
      },
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        type: "bar",
        height: 360,
        animation: false,
      },
      title: { text: null },
      xAxis: {
        categories,
        title: null,
        labels: {
          style: {
            color: $mode === "light" ? "#09090B" : "white",
            fontSize: "12px",
            fontWeight: "400",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis", // optional: add ... if it overflows
            overflow: "hidden", // optional: hide overflow
          },
          useHTML: true,
          formatter: function () {
            return this.value; // no <br>, just the original string
          },
        },

        lineWidth: 0,
        tickLength: 0,
      },
      yAxis: {
        min: 0,
        title: null,
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
        },
        gridLineWidth: 0,
        lineWidth: 0,
        tickLength: 0,
      },
      plotOptions: {
        series: {
          pointWidth: 10, // fixed bar width
        },
        bar: {
          dataLabels: {
            enabled: true,
            inside: false,
            align: "right",
            style: {
              color: "#000",
              fontSize: "12.5px",
              fontWeight: "550",
              textOutline: "none",
            },
            formatter: function () {
              return this.y?.toLocaleString("en-US");
            },
          },
          borderWidth: 0,
          pointPadding: $screenWidth < 640 ? 0.02 : 0.18, // Much smaller padding on mobile for thicker bars
          groupPadding: $screenWidth < 640 ? 0.4 : -0.1,
          animation: false,
          states: {
            hover: { enabled: false },
            inactive: { enabled: false },
          },
        },
      },
      tooltip: {
        shared: false, // Changed to false since we're dealing with single series
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
          // Access the original data from the point
          const originalItem = this.point.originalData;

          let tooltipContent = `<span class="m-auto text-xs">${ticker} ${convertDateFormat(originalItem?.date_expiration)} ${originalItem.strike_price}${originalItem.option_type}</span><br>`;
          tooltipContent += `<span class="font-normal text-sm">OI: ${this.y?.toLocaleString("en-US")}</span><br>`;

          return tooltipContent;
        },
      },
      series: [
        {
          name: "Open Interest",
          data,
          animation: false,
        },
      ],
      legend: { enabled: false },
    };
    return options;
  }

  $: {
    if (ticker && typeof window !== "undefined") {
      isLoaded = false;

      initialize();
      config = plotBarChart() || null;
      isLoaded = true;
    }
  }
</script>

<section class="w-full overflow-hidden">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto mt-2 sm:mt-0">
        <h2
          class=" flex flex-row items-center text-xl sm:text-2xl font-bold w-fit"
        >
          {ticker}
          {title}
        </h2>

        <p class="mt-4">
          The highest {type === "oi" ? "open interest" : "volume"} is
          <strong
            >{type === "oi"
              ? Math.max(
                  ...rawData?.map((item) => item?.open_interest || 0),
                )?.toLocaleString("en-US")
              : Math.max(
                  ...rawData?.map((item) => item?.volume || 0),
                )?.toLocaleString("en-US")}</strong
          >
          contracts at the
          <strong
            >{type === "oi"
              ? rawData?.find(
                  (item) =>
                    item?.open_interest ===
                    Math.max(...rawData?.map((i) => i?.open_interest || 0)),
                )?.strike_price
              : rawData?.find(
                  (item) =>
                    item?.volume ===
                    Math.max(...rawData?.map((i) => i?.volume || 0)),
                )?.strike_price}</strong
          >
          {type === "oi"
            ? rawData?.find(
                (item) =>
                  item?.open_interest ===
                  Math.max(...rawData?.map((i) => i?.open_interest || 0)),
              )?.option_type === "C"
              ? "call"
              : "put"
            : rawData?.find(
                  (item) =>
                    item?.volume ===
                    Math.max(...rawData?.map((i) => i?.volume || 0)),
                )?.option_type === "C"
              ? "call"
              : "put"}
          strike. The average implied volatility across all contracts is
          <strong
            >{(
              rawData
                ?.filter((item) => item?.iv)
                ?.reduce((sum, item, _, arr) => sum + parseFloat(item.iv), 0) /
                rawData?.filter((item) => item?.iv)?.length || 0
            )?.toFixed(2)}%</strong
          >.
        </p>

        {#if config}
          <div
            class=" sm:p-3 shadow border border-gray-300 dark:border-gray-800 rounded mt-4 mb-4"
            use:highcharts={config}
          ></div>
        {/if}

        <div class="w-full overflow-x-auto">
          <table
            class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto mt-4"
          >
            <thead>
              <TableHeader {columns} {sortOrders} {sortData} />
            </thead>
            <tbody>
              {#each data?.user?.tier === "Pro" ? tableData : tableData?.slice(0, 3) as item, index}
                {@const isCall = item?.option_type === "C"}
                {@const isPut = item?.option_type === "P"}
                {@const highVolume = item?.volume > 1000}
                {@const highOI = item?.open_interest > 5000}
                <tr
                  class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd relative {index +
                    1 ===
                    tableData?.slice(0, 3)?.length &&
                  !['Pro']?.includes(data?.user?.tier)
                    ? 'opacity-[0.1]'
                    : ''}"
                  style="background: {(() => {
                    const baseColor =
                      $mode === 'light'
                        ? index % 2 === 0
                          ? '#ffffff'
                          : '#F6F7F8'
                        : index % 2 === 0
                          ? '#09090B'
                          : '#1A1A1F';

                    if ($mode === 'light') {
                      if (isCall) {
                        // Higher intensity for high volume/OI
                        if (highVolume || highOI) {
                          return `linear-gradient(90deg, ${baseColor} 0%, rgba(34, 197, 94, 0.2) 60%, rgba(34, 197, 94, 0.3) 100%)`;
                        }
                        return `linear-gradient(90deg, ${baseColor} 0%, rgba(34, 197, 94, 0.15) 60%, rgba(34, 197, 94, 0.25) 100%)`;
                      }
                      if (isPut) {
                        // Higher intensity for high volume/OI
                        if (highVolume || highOI) {
                          return `linear-gradient(90deg, ${baseColor} 0%, rgba(238, 83, 101, 0.2) 60%, rgba(238, 83, 101, 0.3) 100%)`;
                        }
                        return `linear-gradient(90deg, ${baseColor} 0%, rgba(238, 83, 101, 0.15) 60%, rgba(238, 83, 101, 0.25) 100%)`;
                      }
                    } else {
                      // Dark mode
                      if (isCall) {
                        // Higher intensity for high volume/OI
                        if (highVolume || highOI) {
                          return `linear-gradient(90deg, ${baseColor} 0%, rgba(0, 252, 80, 0.12) 60%, rgba(0, 252, 80, 0.2) 100%)`;
                        }
                        return `linear-gradient(90deg, ${baseColor} 0%, rgba(0, 252, 80, 0.08) 60%, rgba(0, 252, 80, 0.15) 100%)`;
                      }
                      if (isPut) {
                        // Higher intensity for high volume/OI
                        if (highVolume || highOI) {
                          return `linear-gradient(90deg, ${baseColor} 0%, rgba(238, 83, 101, 0.12) 60%, rgba(238, 83, 101, 0.2) 100%)`;
                        }
                        return `linear-gradient(90deg, ${baseColor} 0%, rgba(238, 83, 101, 0.08) 60%, rgba(238, 83, 101, 0.15) 100%)`;
                      }
                    }
                    return baseColor;
                  })()}"
                >
                  <td
                    class=" text-sm sm:text-[1rem] text-start whitespace-nowrap flex flex-row items-center justify-between"
                  >
                    <span
                      class={item?.option_type === "C"
                        ? "dark:text-[#00FC50]"
                        : "dark:text-[#FF2F1F]"}
                    >
                      {item?.option_type === "C" ? "Call" : "Put"}
                      {" " + item?.strike_price}
                    </span>
                  </td>
                  <td
                    class=" text-sm sm:text-[1rem] text-end whitespace-nowrap"
                  >
                    {item?.dte}
                  </td>
                  <td
                    class=" text-sm sm:text-[1rem] text-end whitespace-nowrap"
                  >
                    {item?.otm}%
                  </td>
                  <td
                    class=" text-sm sm:text-[1rem] text-end whitespace-nowrap"
                  >
                    {item?.last ?? "n/a"}
                  </td>
                  <td
                    class=" text-sm sm:text-[1rem] text-end whitespace-nowrap"
                  >
                    {#if item?.low && item?.high}
                      {item?.low}-{item?.high}
                    {:else}
                      n/a
                    {/if}
                  </td>
                  <td
                    class=" text-sm sm:text-[1rem] text-end whitespace-nowrap"
                  >
                    {item?.volume?.toLocaleString("en-US")}
                  </td>
                  <td
                    class=" text-sm sm:text-[1rem] text-end whitespace-nowrap"
                  >
                    {item?.open_interest?.toLocaleString("en-US")}
                  </td>
                  <td
                    class=" text-sm sm:text-[1rem] text-end whitespace-nowrap"
                  >
                    {#if item?.changeOI >= 0}
                      <span class="text-green-800 dark:text-[#00FC50]"
                        >+{item?.changeOI?.toLocaleString("en-US")}</span
                      >
                    {:else if item?.changeOI < 0}
                      <span class="text-red-800 dark:text-[#FF2F1F]"
                        >{item?.changeOI?.toLocaleString("en-US")}</span
                      >
                    {:else}
                      n/a
                    {/if}
                  </td>
                  <td class="text-sm sm:text-[1rem] text-end">
                    {item?.iv ? item?.iv + "%" : "n/a"}
                  </td>
                  <td
                    class=" text-sm sm:text-[1rem] text-end whitespace-nowrap"
                  >
                    ${item?.total_premium?.toLocaleString("en-US")}
                  </td>

                  <td
                    class=" text-sm sm:text-[1rem] text-end whitespace-nowrap"
                  >
                    <a
                      href={`/${["stocks", "stock"]?.includes(assetType) ? "stocks" : assetType === "etf" ? "etf" : "index"}/${ticker}/options/contract-lookup?query=${item?.option_symbol}`}
                      class="cursor-pointer text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
                    >
                      {item?.option_symbol}
                    </a>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <UpgradeToPro {data} display={true} />
      </div>
    </div>
  </div>
</section>

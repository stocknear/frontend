<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";
  import { onMount } from "svelte";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";
  import Infobox from "$lib/components/Infobox.svelte";

  export let data;
  export let title = "Gamma";
  export let ticker;

  let rawData = data?.getData || [];

  const isGamma = title === "Gamma";
  const today = new Date();

  rawData = rawData?.reduce((result, item) => {
    const itemDate = new Date(item?.expiry);
    if (itemDate >= today) {
      if (title === "Gamma") {
        result.push({
          ...item,
          net_gex: (item?.call_gex || 0) + (item?.put_gex || 0),
          put_call_ratio:
            item?.call_gex > 0
              ? Math.abs((item?.put_gex || 0) / item?.call_gex)
              : null,
        });
      } else {
        result.push({
          ...item,
          net_dex: (item?.call_dex || 0) + (item?.put_dex || 0),
          put_call_ratio:
            item?.call_dex > 0
              ? Math.abs((item?.put_dex || 0) / item?.call_dex)
              : null,
        });
      }
    }
    return result;
  }, []);

  let displayList = rawData?.slice(0, 20);

  function formatDate(dateString) {
    if (!dateString) return null; // Handle null or undefined input
    const date = new Date(dateString);
    const formatter = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
      timeZone: "UTC",
    });
    return formatter.format(date);
  }

  function plotData() {
    // Determine if the current data is Gamma-based or not
    const isGamma = title === "Gamma";

    // Process data; note that the original sort was based on a missing "strike" field.
    // Here we sort by expiry (assuming formatDate returns a sortable date string).
    const processedData = rawData
      ?.map((d) => ({
        expiry: formatDate(d?.expiry),
        callValue: isGamma ? d?.call_gex : d?.call_dex,
        putValue: isGamma ? d?.put_gex : d?.put_dex,
        netValue: isGamma ? d?.net_gex : d?.net_dex,
      }))
      .sort((a, b) => new Date(a.expiry) - new Date(b.expiry));

    // Create arrays for categories and series data.
    const expiries = processedData.map((d) => d.expiry);
    // Convert values to numbers (toFixed returns a string)
    const callValues = processedData.map((d) =>
      parseFloat(d.callValue.toFixed(2)),
    );
    const putValues = processedData.map((d) =>
      parseFloat(d.putValue.toFixed(2)),
    );
    const netValues = processedData.map((d) =>
      parseFloat(d.netValue.toFixed(2)),
    );

    const options = {
      credits: {
        enabled: false,
      },
      chart: {
        type: "column",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 360,
        animation: false,
      },
      title: {
        text: `<h3 class="mt-3 mb-1 ">${ticker} ${title === "Gamma" ? "GEX" : "DEX"} Chart</h3>`,
        style: {
          color: $mode === "light" ? "black" : "white",
          // Using inline CSS for margin-top and margin-bottom
        },
        useHTML: true, // Enable HTML to apply custom class styling
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
      plotOptions: {
        series: {
          animation: false,
          stacking: "normal",
        },
      },
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
      xAxis: {
        type: "datetime",
        endOnTick: false,
        categories: expiries,
        crosshair: {
          color: $mode === "light" ? "black" : "white", // Set the color of the crosshair line
          width: 1, // Adjust the line width as needed
          dashStyle: "Solid",
        },
        gridLineWidth: 0,
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
      yAxis: {
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
          formatter: function () {
            return abbreviateNumber(this.value);
          },
        },
        title: { text: null },
        opposite: true,
      },
      series: [
        {
          name: `Put ${isGamma ? "Gamma" : "Delta"}`,
          data: putValues,
          color: "#9B5DC4",
          borderColor: "#9B5DC4",
          borderRadius: "1px",
          animation: false,
        },
        {
          name: `Net ${isGamma ? "Gamma" : "Delta"}`,
          data: netValues,
          color: "#FF2F1F",
          borderColor: "#FF2F1F",
          borderRadius: "1px",
          animation: false,
        },
        {
          name: `Call ${isGamma ? "Gamma" : "Delta"}`,
          data: callValues,
          color: "#C4E916",
          borderColor: "#C4E916",
          borderRadius: "1px",
          animation: false,
        },
      ],
    };

    return options;
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
    { key: "expiry", label: "Expiry Date", align: "left" },
    {
      key: isGamma ? "call_gex" : "call_dex",
      label: isGamma ? "Call GEX" : "Call Delta",
      align: "right",
    },
    {
      key: isGamma ? "put_gex" : "put_dex",
      label: isGamma ? "Put GEX" : "Put Delta",
      align: "right",
    },
    {
      key: isGamma ? "net_gex" : "net_dex",
      label: isGamma ? "Net GEX" : "Net Delta",
      align: "right",
    },
    {
      key: "put_call_ratio",
      label: isGamma ? "P/C GEX" : "P/C Delta",
      align: "right",
    },
  ];

  $: sortOrders = {
    expiry: { order: "none", type: "date" },
    [isGamma ? "call_gex" : "call_dex"]: { order: "none", type: "number" },
    [isGamma ? "put_gex" : "put_dex"]: { order: "none", type: "number" },
    [isGamma ? "net_gex" : "net_dex"]: { order: "none", type: "number" },
    put_call_ratio: { order: "none", type: "number" },
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

  let config = null;

  $: {
    if ($mode) {
      config = plotData() || null;
    }
  }
</script>

<div class="sm:pl-7 sm:pb-7 sm:pt-5 w-full m-auto mt-2 sm:mt-0">
  <h2 class=" flex flex-row items-center text-xl sm:text-2xl font-bold w-fit">
    {ticker}
    {title} Exposure By Expiry
  </h2>

  <div class="mt-6 sm:mt-0">
    <Infobox
      text={title === "Gamma"
        ? `Gamma Exposure (GEX) for ${ticker} options representing the estimated dollar value of shares that option sellers must buy or sell to maintain delta neutrality for each 1% move in ${ticker}’s stock price by expiration.`
        : `Delta Exposure (DEX) for ${ticker} options representing the estimated net number of ${ticker} shares that option sellers must hold or short to hedge their current options positions and maintain delta neutrality at expiration.`}
    />
  </div>

  <div class="w-full overflow-hidden m-auto sm:mt-3 shadow-xs">
    {#if config !== null}
      <div>
        <div class="grow">
          <div class="relative">
            <!-- Apply the blur class to the chart -->
            <div
              class="mt-5 shadow-xs sm:mt-0 sm:border sm:border-gray-300 dark:border-gray-800 rounded"
              use:highcharts={config}
            ></div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <h3 class="text-xl sm:text-2xl font-bold mt-5">
    {ticker}
    {title === "Gamma" ? "GEX" : "DEX"} Table
  </h3>

  <div class="mt-3 w-full overflow-x-auto">
    <table
      class="table table-sm table-compact no-scrollbar rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
    >
      <thead>
        <TableHeader {columns} {sortOrders} {sortData} />
      </thead>
      <tbody>
        {#each displayList as item, index}
          <tr
            class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
          >
            <td class=" text-sm sm:text-[1rem] text-start whitespace-nowrap">
              {formatDate(item?.expiry)}
            </td>
            <td class=" text-sm sm:text-[1rem] text-end whitespace-nowrap">
              {abbreviateNumber(
                (isGamma ? item?.call_gex : item?.call_dex)?.toFixed(2),
              )}
            </td>
            <td class=" text-sm sm:text-[1rem] text-end whitespace-nowrap">
              {abbreviateNumber(
                (isGamma ? item?.put_gex : item?.put_dex)?.toFixed(2),
              )}
            </td>

            <td class=" text-sm sm:text-[1rem] text-end whitespace-nowrap">
              {abbreviateNumber(
                (isGamma ? item?.net_gex : item?.net_dex)?.toFixed(2),
              )}
            </td>

            <td class=" text-sm sm:text-[1rem] text-end whitespace-nowrap">
              {#if item?.put_call_ratio <= 1 && item?.put_call_ratio !== null}
                <span class="text-green-800 dark:text-[#00FC50]"
                  >{item?.put_call_ratio?.toFixed(2)}</span
                >
              {:else if item?.put_call_ratio > 1 && item?.put_call_ratio !== null}
                <span class="text-red-800 dark:text-[#FF2F1F]"
                  >{item?.put_call_ratio?.toFixed(2)}</span
                >
              {:else}
                n/a
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

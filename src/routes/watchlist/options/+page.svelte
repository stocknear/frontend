<script lang="ts">
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";
  import { abbreviateNumber } from "$lib/utils";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import Star from "lucide-svelte/icons/star";
  import SEO from "$lib/components/SEO.svelte";
  import { screenWidth, setCache, getCache } from "$lib/store";
  import { onMount } from "svelte";
  import { toast } from "svelte-sonner";
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";

  export let data;
  let originalData = [];
  let editMode = false;
  let numberOfChecked = 0;
  let deleteOptionsId = [];

  let isLoaded = false;
  let config = null;

  let optionHistoryList = [];
  let selectGraphType = "Vol/OI";
  let container;
  let rawDataHistory = [];
  let strikePrice;
  let optionType;
  let optionSymbol;
  let dateExpiration;
  let ticker;

  function daysLeft(targetDate) {
    const targetTime = new Date(targetDate).getTime();
    const currentTime = new Date().getTime();
    const difference = targetTime - currentTime;

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const daysLeft = Math?.ceil(difference / millisecondsPerDay);

    return daysLeft;
  }

  let rawData = data?.getOptionsWatchlist?.optionsList;

  function reformatDate(dateString) {
    return (
      dateString.substring(5, 7) +
      "/" +
      dateString.substring(8) +
      "/" +
      dateString.substring(2, 4)
    );
  }

  function formatDate(dateStr) {
    // Parse the input date string (YYYY-mm-dd)
    var date = new Date(dateStr);

    // Get month, day, and year
    var month = date.getMonth() + 1; // Month starts from 0
    var day = date.getDate();
    var year = date.getFullYear();

    var shortYear = year?.toString().slice(-2);

    // Add leading zeros if necessary
    month = (month < 10 ? "0" : "") + month;
    day = (day < 10 ? "0" : "") + day;

    var formattedDate = month + "/" + day + "/" + shortYear;

    return formattedDate;
  }

  function formatTime(timeString) {
    // Split the time string into components
    const [hours, minutes, seconds] = timeString.split(":").map(Number);

    // Determine AM or PM
    const period = hours >= 12 ? "PM" : "AM";

    // Convert hours from 24-hour to 12-hour format
    const formattedHours = hours % 12 || 12; // Converts 0 to 12 for midnight

    // Format the time string
    const formattedTimeString = `${formattedHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")} ${period}`;

    return formattedTimeString;
  }

  async function handleFilter(optionsId) {
    const filterSet = new Set(deleteOptionsId);

    // Check if the new filter already exists in the list
    if (filterSet?.has(optionsId)) {
      // If it exists, remove it from the list
      filterSet?.delete(optionsId);
    } else {
      // If it doesn't exist, add it to the list
      filterSet?.add(optionsId);
    }
    deleteOptionsId = Array?.from(filterSet);
    numberOfChecked = deleteOptionsId?.length;
  }

  async function handleDelete() {
    if (numberOfChecked === 0) {
      toast.error(`You need to select symbols before you can delete them`, {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    } else if (data?.getOptionsWatchlist?.id?.length === 0) {
      toast.error(`You need to select symbols before you can delete them`, {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    } else {
      rawData = rawData?.filter((item) => !deleteOptionsId?.includes(item?.id));

      rawData = [...rawData];

      const postData = {
        itemIdList: deleteOptionsId,
        id: data?.getOptionsWatchlist?.id,
      };

      numberOfChecked = 0;
      editMode = !editMode;

      await fetch("/api/update-options-watchlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      deleteOptionsId = [];
    }
  }

  function getScroll() {
    const scrollThreshold = container.scrollHeight * 0.8; // 80% of the container height

    // Check if the user has scrolled to the bottom based on the threshold
    const isBottom =
      container.scrollTop + container.clientHeight >= scrollThreshold;

    // Only load more data if at the bottom and there is still data to load
    if (isBottom && optionHistoryList?.length !== rawDataHistory?.length) {
      const nextIndex = optionHistoryList.length; // Ensure optionHistoryList is defined
      const filteredNewResults = rawDataHistory.slice(
        nextIndex,
        nextIndex + 25,
      ); // Ensure rawData is defined
      optionHistoryList = [...optionHistoryList, ...filteredNewResults];
    }
  }

  const getContractHistory = async () => {
    let output;
    const cachedData = getCache(optionSymbol, "getContractHistory");
    if (cachedData) {
      output = cachedData;
    } else {
      const postData = {
        ticker: ticker,
        contract: optionSymbol,
      };

      // make the POST request to the endpoint
      const response = await fetch("/api/options-contract-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();

      setCache(optionSymbol, output, "getContractHistory");
    }

    return output;
  };

  const getHistoricalPrice = async () => {
    let output;
    const cachedData = getCache(ticker, "getHistoricalPrice");
    if (cachedData) {
      output = cachedData;
    } else {
      const postData = {
        timePeriod: "six-months",
        ticker: ticker,
      };

      // make the POST request to the endpoint
      const response = await fetch("/api/historical-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();

      setCache(ticker, output, "getHistoricalPrice");
    }

    return output;
  };

  async function handleViewData(item) {
    isLoaded = false;
    selectGraphType = "Vol/OI";
    optionDetailsDesktopModal?.showModal();

    strikePrice = item?.strike_price;
    optionType = item?.put_call;
    ticker = item?.ticker;
    dateExpiration = item?.date_expiration;
    optionSymbol = item?.option_symbol;
    const output = await getContractHistory();
    const historicalPrice = await getHistoricalPrice();

    rawDataHistory = output?.history;

    if (rawDataHistory?.length > 0) {
      rawDataHistory?.forEach((entry) => {
        const matchingData = historicalPrice?.find(
          (d) => d?.time === entry?.date,
        );
        if (matchingData) {
          entry.price = matchingData?.close;
        }
      });

      config = plotData();
      rawDataHistory = rawDataHistory?.sort(
        (a, b) => new Date(b?.date) - new Date(a?.date),
      );
      optionHistoryList = rawDataHistory?.slice(0, 20);
    } else {
      config = null;
    }

    isLoaded = true;
  }

  function plotData() {
    // Ensure rawDataHistory exists and sort it by date
    const sortedData =
      rawDataHistory?.sort((a, b) => new Date(a?.date) - new Date(b?.date)) ||
      [];

    // Filter out data points that have an undefined price so they don't appear in any series
    const filteredData = sortedData.filter((item) => item?.price !== undefined);

    // Build series based on the selected graph type, using filteredData
    let series = [];
    const fillColorStart = "rgb(70, 129, 244,0.5)";
    const fillColorEnd = "rgb(70, 129, 244,0.001)";
    if (selectGraphType == "Vol/OI") {
      series = [
        {
          name: "Stock Price",
          type: "area",
          yAxis: 1,
          data: filteredData.map((item) => [
            new Date(item.date).getTime(),
            item.price,
          ]),
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, fillColorStart],
              [1, fillColorEnd],
            ],
          },
          color: "#4681f4",
          borderColor: "4681f4",
          lineWidth: 1.3,
          marker: { enabled: false },
          animation: false,
        },
        {
          name: "Avg Fill",
          type: "spline", // smooth line
          data: filteredData.map((item) => [
            new Date(item.date).getTime(),
            item.mark,
          ]),
          color: "#F21C64",
          yAxis: 2,
          lineWidth: 1.3,
          animation: false,
          marker: { enabled: false },
        },
        {
          name: "Volume",
          type: "column",
          data: filteredData.map((item) => [
            new Date(item.date).getTime(),
            item.volume,
          ]),
          color: "#FD7E14",
          borderColor: "#FD7E14",
          borderRadius: "2px",
          yAxis: 0,
          animation: false,
        },
        {
          name: "OI",
          type: "column",
          data: filteredData.map((item) => [
            new Date(item.date).getTime(),
            item.open_interest,
          ]),
          color: "#33B890",
          borderColor: "#33B890",
          borderRadius: "2px",
          yAxis: 0,
          animation: false,
        },
      ];
    } else {
      series = [
        {
          name: "Stock Price",
          type: "area",
          yAxis: 1,
          data: filteredData.map((item) => [
            new Date(item.date).getTime(),
            item.price,
          ]),
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, fillColorStart],
              [1, fillColorEnd],
            ],
          },
          color: "#4681f4",
          borderColor: "4681f4",
          lineWidth: 1.3,
          marker: { enabled: false },
          animation: false,
        },
        {
          name: "Avg Fill",
          type: "spline", // smooth line
          data: filteredData?.map((item) => [
            new Date(item.date).getTime(),
            item.mark,
          ]),
          color: "#F21C64",
          yAxis: 2,
          lineWidth: 1.3,
          animation: false,
          marker: { enabled: false },
        },
        {
          name: "IV",
          type: "spline",
          data: filteredData?.map((item) => [
            new Date(item.date).getTime(),
            Math.floor(item.implied_volatility * 100),
          ]),
          color: $mode === "light" ? "black" : "white",
          yAxis: 0,
          animation: false,
          marker: { enabled: false },
        },
      ];
    }

    // Highcharts configuration object
    const options = {
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        animation: false,
        height: 360,
      },
      credits: { enabled: false },
      title: {
        text: `<h3 class="mt-3 mb-1 text-[1rem] sm:text-lg">Contract History</h3>`,
        useHTML: true,
        style: { color: $mode === "light" ? "black" : "white" },
      },
      // Disable markers globally on hover for all series
      plotOptions: {
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
      xAxis: {
        type: "datetime",
        endOnTick: false,
        crosshair: {
          color: $mode === "light" ? "black" : "white",
          width: 1,
          dashStyle: "Solid",
        },
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
          distance: 20,
          formatter: function () {
            return new Date(this.value).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            });
          },
        },
        tickPositioner: function () {
          const positions = [];
          const info = this.getExtremes();
          const tickCount = 5; // Reduce number of ticks displayed
          const interval = Math.floor((info.max - info.min) / tickCount);

          for (let i = 0; i <= tickCount; i++) {
            positions.push(info.min + i * interval);
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
          title: { text: null },
          gridLineWidth: 0,
          labels: { enabled: false },
        },
        {
          title: { text: null },
          gridLineWidth: 0,
          labels: { enabled: false },
        },
        {
          title: { text: null },
          gridLineWidth: 0,
          labels: { enabled: false },
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
          })}</span><br>`;

          // Loop through each point in the shared tooltip
          this.points.forEach((point) => {
            tooltipContent += `
        <span class="font-semibold text-sm">${point.series.name}:</span> 
        <span class="font-normal text-sm">${abbreviateNumber(point.y)}</span><br>`;
          });

          return tooltipContent;
        },
      },

      legend: {
        enabled: true,
        align: "center", // Positions legend at the left edge
        verticalAlign: "top", // Positions legend at the top
        layout: "horizontal", // Align items horizontally (use 'vertical' if preferred)
        itemStyle: {
          color: $mode === "light" ? "black" : "white",
        },
        symbolWidth: 16, // Controls the width of the legend symbol
        symbolRadius: 8, // Creates circular symbols (adjust radius as needed)
        squareSymbol: false, // Ensures symbols are circular, not square
      },
      series: series,
    };

    return options;
  }

  $: columns = [
    { key: "time", label: "Time", align: "center" },
    { key: "ticker", label: "Symbol", align: "center" },
    { key: "option_symbol", label: "Option Chain", align: "center" },
    { key: "date_expiration", label: "Expiry", align: "center" },
    { key: "dte", label: "DTE", align: "center" },
    { key: "sentiment", label: "Sent.", align: "center" },
    { key: "size", label: "Size", align: "center" },
    { key: "execution_estimate", label: "Exec", align: "center" },
    { key: "underlying_price", label: "Price", align: "center" },
    { key: "price", label: "Spot", align: "center" },
    { key: "cost_basis", label: "Prem", align: "center" },
    { key: "option_activity_type", label: "Type", align: "center" },
    { key: "volume", label: "Volume", align: "center" },
    { key: "open_interest", label: "OI", align: "center" },
  ];

  $: sortOrders = {
    time: { order: "none", type: "string" },
    date: { order: "none", type: "date" },
    ticker: { order: "none", type: "string" },
    option_symbol: { order: "none", type: "string" },
    date_expiration: { order: "none", type: "date" },
    execution_estimate: { order: "none", type: "string" },
    dte: { order: "none", type: "number" },
    sentiment: { order: "none", type: "sentiment" },
    size: { order: "none", type: "number" },
    underlying_price: { order: "none", type: "number" },
    price: { order: "none", type: "number" },
    cost_basis: { order: "none", type: "number" },
    volume: { order: "none", type: "number" },
    open_interest: { order: "none", type: "number" },
    option_activity_type: { order: "none", type: "string" },
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
    let originalData = data?.getOptionsWatchlist?.optionsList;
    if (sortOrder === "none") {
      rawData = [...originalData]?.slice(0, 150);
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
        case "sentiment":
          const sentimentOrder = { BULLISH: 1, NEUTRAL: 2, BEARISH: 3 };
          const sentimentA = sentimentOrder[a?.sentiment?.toUpperCase()] || 4;
          const sentimentB = sentimentOrder[b?.sentiment?.toUpperCase()] || 4;
          return sortOrder === "asc"
            ? sentimentA - sentimentB
            : sentimentB - sentimentA;

        case "number":
        default:
          valueA = parseFloat(a[key]);
          valueB = parseFloat(b[key]);
          break;
      }

      // Default comparison for numbers and fallback case
      if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
      if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    };

    // Sort using the generic comparison function
    rawData = [...originalData].sort(compareValues)?.slice(0, 150);
  };

  $: {
    if (selectGraphType) {
      isLoaded = false;
      if (rawDataHistory?.length > 0) {
        config = plotData();
      } else {
        config = null;
      }

      isLoaded = true;
    }
  }
</script>

<SEO
  title="Options Watchlist - Track Options Contracts & Monitor Option Chains "
  description="Create and manage your options watchlist with real-time tracking of calls, puts, and option chains. Monitor volume, open interest, Greeks, and options performance. Free options tracking tool for traders."
  keywords="options watchlist, options tracker, option chains, calls and puts, options trading, options monitoring, option Greeks, volume tracking, open interest"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Options Watchlist Tracker",
    description: "Options contracts tracking and monitoring tool",
    url: "https://stocknear.com/watchlist/options",
    applicationCategory: "FinanceApplication",
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
          name: "Watchlist",
          item: "https://stocknear.com/watchlist",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Options",
          item: "https://stocknear.com/watchlist/options",
        },
      ],
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pt-5 pb-40 lg:px-3"
>
  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          {#if rawData?.length !== 0}
            <div class="flex flex-row justify-end items-center pb-2">
              <h2 class="font-semibold text-xl mr-auto">
                {rawData?.length} Options
              </h2>
              <a
                href="/options-flow"
                class="border text-sm border-gray-300 dark:border-gray-600 mr-2 sm:ml-3 sm:mr-0 cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded py-2 pl-3 pr-4 font-semibold bg-black sm:hover:bg-default text-white dark:sm:hover:bg-default/60 ease-out dark:sm:hover:text-gray-300"
              >
                <Star class="inline-block w-5 h-5" />
                <span class="ml-1 text-sm"> Add Contracts </span>
              </a>
              {#if editMode}
                <label
                  on:click={handleDelete}
                  class="border text-sm border-gray-300 dark:border-gray-600 mr-2 sm:ml-3 sm:mr-0 cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded py-2 pl-3 pr-4 font-semibold bg-black sm:hover:bg-default text-white dark:sm:hover:bg-default/60 ease-out sm:hover:text-red-500"
                >
                  <svg
                    class="inline-block w-5 h-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    ><path
                      fill="currentColor"
                      d="M10 5h4a2 2 0 1 0-4 0M8.5 5a3.5 3.5 0 1 1 7 0h5.75a.75.75 0 0 1 0 1.5h-1.32l-1.17 12.111A3.75 3.75 0 0 1 15.026 22H8.974a3.75 3.75 0 0 1-3.733-3.389L4.07 6.5H2.75a.75.75 0 0 1 0-1.5zm2 4.75a.75.75 0 0 0-1.5 0v7.5a.75.75 0 0 0 1.5 0zM14.25 9a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0v-7.5a.75.75 0 0 1 .75-.75m-7.516 9.467a2.25 2.25 0 0 0 2.24 2.033h6.052a2.25 2.25 0 0 0 2.24-2.033L18.424 6.5H5.576z"
                    /></svg
                  >
                  <span class="ml-1 text-sm">
                    {numberOfChecked}
                  </span>
                </label>
              {/if}

              <label
                on:click={() => (editMode = !editMode)}
                class="border text-sm border-gray-300 dark:border-gray-600 mr-2 sm:ml-3 sm:mr-0 cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded py-2 pl-3 pr-4 font-semibold bg-black sm:hover:bg-default text-white dark:sm:hover:bg-default/60 ease-out"
              >
                <svg
                  class="inline-block w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 1024 1024"
                  ><path
                    fill="currentColor"
                    d="M832 512a32 32 0 1 1 64 0v352a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h352a32 32 0 0 1 0 64H192v640h640z"
                  /><path
                    fill="currentColor"
                    d="m469.952 554.24l52.8-7.552L847.104 222.4a32 32 0 1 0-45.248-45.248L477.44 501.44l-7.552 52.8zm422.4-422.4a96 96 0 0 1 0 135.808l-331.84 331.84a32 32 0 0 1-18.112 9.088L436.8 623.68a32 32 0 0 1-36.224-36.224l15.104-105.6a32 32 0 0 1 9.024-18.112l331.904-331.84a96 96 0 0 1 135.744 0z"
                  /></svg
                >
                {#if !editMode}
                  <span class="ml-1 text-sm"> Edit </span>
                {:else}
                  <span class="ml-1 text-sm"> Cancel </span>
                {/if}
              </label>
            </div>

            <!--Start Table-->
            <div class="w-full rounded overflow-hidden overflow-x-auto">
              <table
                class="table table-sm table-compact rounded-none sm:rounded w-full m-auto mt-2 overflow-x-auto border border-gray-300 dark:border-gray-800"
              >
                <thead>
                  <TableHeader {columns} {sortOrders} {sortData} />
                </thead>
                <tbody>
                  {#each rawData as item, index}
                    <!-- row -->
                    <tr class=" odd:bg-[#F6F7F8] dark:odd:bg-odd">
                      <td
                        class="text-xs sm:text-sm text-start whitespace-nowrap"
                      >
                        {formatTime(item?.time)}
                      </td>

                      <td
                        on:click={() => handleFilter(item?.id)}
                        class="{index % 2
                          ? 'bg-white dark:bg-default'
                          : 'bg-[#F6F7F8] dark:bg-odd'} font-normal text-sm sm:text-[1rem] text-center"
                      >
                        <div class=" flex flex-row items-center">
                          <input
                            type="checkbox"
                            checked={deleteOptionsId?.includes(item?.id) ??
                              false}
                            class="{!editMode
                              ? 'hidden'
                              : ''} bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 mr-3"
                          />
                          {#if !editMode}
                            <HoverStockChart
                              symbol={item?.ticker}
                              assetType={item?.underlying_type}
                            />
                          {:else}
                            <span
                              class="text-blue-800 dark:text-blue-400 cursor-pointer"
                              >{item?.ticker}</span
                            >
                          {/if}
                        </div>
                      </td>

                      <td
                        class="text-sm sm:text-[1rem] text-start whitespace-nowrap flex justify-between"
                      >
                        <label
                          on:click={() => handleViewData(item)}
                          on:mouseover={() =>
                            getContractHistory(item?.option_symbol)}
                          class="cursor-pointer flex flex-row items-center justify-between text-blue-800 dark:text-blue-400 dark:sm:hover:text-white sm:hover:underline sm:hover:underline-offset-4"
                        >
                          <div>
                            {item?.put_call === "Puts" ? "P" : "C"}
                            {item?.strike_price}

                            {" " + item?.date_expiration}
                          </div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="inline-block w-4 h-4 ml-1"
                            viewBox="0 0 512 512"
                            fill="currentColor"
                            ><path
                              d="M104 496H72a24 24 0 01-24-24V328a24 24 0 0124-24h32a24 24 0 0124 24v144a24 24 0 01-24 24zM328 496h-32a24 24 0 01-24-24V232a24 24 0 0124-24h32a24 24 0 0124 24v240a24 24 0 01-24 24zM440 496h-32a24 24 0 01-24-24V120a24 24 0 0124-24h32a24 24 0 0124 24v352a24 24 0 01-24 24zM216 496h-32a24 24 0 01-24-24V40a24 24 0 0124-24h32a24 24 0 0124 24v432a24 24 0 01-24 24z"
                            ></path></svg
                          >
                        </label>
                      </td>

                      <td class=" text-sm sm:text-[1rem] text-center">
                        {reformatDate(item?.date_expiration)}
                      </td>

                      <td class=" text-sm sm:text-[1rem] text-center">
                        {item?.dte < 0 ? "expired" : item?.dte + "d"}
                      </td>

                      <td
                        class="text-sm sm:text-[1rem] {item?.sentiment ===
                        'Bullish'
                          ? 'dark:text-[#00FC50]'
                          : item?.sentiment === 'Bearish'
                            ? 'dark:text-[#FF2F1F]'
                            : 'text-[#C6A755]'} text-center"
                      >
                        {item?.sentiment}
                      </td>
                      <td class="text-sm sm:text-[1rem] text-center">
                        {item?.size?.toLocaleString("en-US")}
                      </td>
                      <td
                        class="text-sm sm:text-[1rem] text-center whitespace-nowrap"
                      >
                        {item?.execution_estimate}
                      </td>

                      <td class="text-sm sm:text-[1rem] text-center">
                        {item?.price}
                      </td>

                      <td class="text-sm sm:text-[1rem] text-center">
                        {item?.underlying_price}
                      </td>

                      <td
                        class="text-sm sm:text-[1rem] text-center {item?.put_call ===
                        'Puts'
                          ? 'dark:text-green-400'
                          : 'dark:text-red-400'} "
                      >
                        {abbreviateNumber(item?.cost_basis)}
                      </td>

                      <td
                        class="text-sm sm:text-[1rem] text-center {item?.option_activity_type ===
                        'Sweep'
                          ? 'dark:text-[#C6A755]'
                          : 'dark:text-[#976DB7]'}"
                      >
                        {item?.option_activity_type}
                      </td>

                      <td
                        class=" text-center text-sm sm:text-[1rem] text-center"
                      >
                        {new Intl.NumberFormat("en", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(item?.volume)}
                      </td>

                      <td
                        class=" text-center text-sm sm:text-[1rem] text-center"
                      >
                        {new Intl.NumberFormat("en", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(item?.open_interest)}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
            <!--End Table-->
          {:else}
            <div class="flex flex-col justify-center items-center m-auto pt-8">
              <span class=" font-bold text-2xl sm:text-3xl">
                Empty Options List
              </span>

              <span class=" text-sm sm:text-lg m-auto p-4 text-center">
                Add your unusual options contracts and start tracking them now!
              </span>
              {#if !data?.user}
                <a
                  class="w-64 flex mt-10 justify-center items-center m-auto btn text-black bg-[#fff] sm:hover:bg-gray-300 transition duration-150 ease-in-out group"
                  href="/register"
                >
                  Get Started
                  <span
                    class="tracking-normal group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out"
                  >
                    <svg
                      class="w-4 h-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      ><g transform="rotate(90 12 12)"
                        ><g fill="none"
                          ><path
                            d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01l-.184-.092Z"
                          /><path
                            fill="black"
                            d="M13.06 3.283a1.5 1.5 0 0 0-2.12 0L5.281 8.939a1.5 1.5 0 0 0 2.122 2.122L10.5 7.965V19.5a1.5 1.5 0 0 0 3 0V7.965l3.096 3.096a1.5 1.5 0 1 0 2.122-2.122L13.06 3.283Z"
                          /></g
                        ></g
                      ></svg
                    >
                  </span>
                </a>
              {:else}
                <a
                  href="/options-flow"
                  class="w-64 flex mt-5 justify-center items-center m-auto btn bg-blue-700 sm:hover:bg-blue-600 border border-gray-300 dark:border-gray-600 group"
                >
                  <span class="font-semibold text-[1rem]"
                    >Follow the Whales
                    <svg
                      class="inline-block -mt-2 -ml-1 w-8 h-8"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 32 32"
                      ><g fill="none"
                        ><path
                          fill="#00a6ed"
                          d="M24.04 6.508C27.007 9.5 29 12.953 29 16.468c0 6.422-1.95 10.392-6.648 12.315a16 16 0 0 1-1.652-.318l-.012.582c-.105.563-.485 1.352-1.625.703c-.84-.478-2.112-1.55-2.33-4.281c-.511-1.271-.617-2.91-.733-4.969c-.164-2.91-3.078-3.89-5-4c-1.84-.105-8.316-.467-8.869-.498a15 15 0 0 1-.01-1.111c0-2.66 3.363-4.9 5.713-4.9h6.55c3.46 0 6.27 2.81 6.27 6.27c-.17 2.411 3.373 3.405 3.82.78c.492-2.896-.591-6.166-2.435-8.494c-.195-.047-.308-.047-.445.047c-1.258 1.258-2.16 1.312-3.852.914a1 1 0 0 0-.239-.103c-.228-.077-.435-.147-.331-.608c.14-.625 1.125-1.719 1.125-1.719c.773-.906 1.758-1.11 2.226-1.055c.402.047.515-.068.58-.135l.03-.029c.065-.051.133-.437.133-.437c-.164-.875.043-1.678.547-2.383c0 0 .882-1.266 1.687-1.344c.72-.07.803.37.879.768q.012.071.027.139c.334 1.535.17 1.902-.215 2.765c-.065.147-.137.308-.214.492c-.13.308-.058.434.038.605zM8.219 29.938c-1.735 0-3.64-2.438-3.11-5.922c.313.2 2.615 2.052 3.75 3.14c.329.844.11 2.782-.64 2.782"
                        /><path
                          fill="#1c1c1c"
                          d="M15.517 15a.61.61 0 0 1-.604-.604v-.758c0-.33.274-.604.604-.604s.604.274.604.604v.758a.604.604 0 0 1-.604.604"
                        /><path
                          fill="#aeddff"
                          d="M20.706 28.208q.745.278 1.692.556q-.84.348-1.8.608q.06-.166.09-.325zm-3.973-4.468c-.107-.771-.157-1.671-.217-2.74l-.016-.281c-.164-2.911-3.766-4.61-5.687-4.719c-1.839-.105-8.138-.01-8.682 0c.339 7.399 6.034 14.639 13.885 14.095a27 27 0 0 0 3.007-.367c-1-.583-2.564-2.007-2.29-5.988"
                        /></g
                      ></svg
                    >
                  </span>
                </a>
              {/if}
            </div>
          {/if}
        </main>
      </div>
    </div>
  </div>
</section>

<dialog
  id="optionDetailsDesktopModal"
  class="modal {$screenWidth < 640 ? 'modal-bottom ' : ''}  sm:px-5"
>
  <div
    class="modal-box bg-white dark:bg-default w-full {rawDataHistory?.length > 0
      ? 'max-w-7xl'
      : 'w-full'} rounded border-t sm:border border-gray-300 dark:border-gray-800 min-h-48 h-auto"
  >
    <form
      method="dialog"
      class="modal-backdrop backdrop-blur-[4px] flex flex-row items-center w-full justify-between"
    >
      <p
        class="text-muted dark:text-white text-[1rem] sm:text-xl font-semibold cursor-text"
      >
        Contract: <span
          class={optionType === "Calls"
            ? "text-green-800 dark:text-[#00FC50]"
            : "text-red-800 dark:text-[#FF2F1F]"}
          >{ticker}
          {strikePrice}
          {optionType}
          {dateExpiration} ({daysLeft(dateExpiration)})
        </span>
      </p>
      <button class="cursor-pointer text-[1.8rem] focus:outline-hidden">
        <svg
          class="w-8 h-8 text-muted dark:text-white"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          ><path
            fill="currentColor"
            d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
          />
        </svg>
      </button>
    </form>
    {#if rawDataHistory?.length > 0}
      <div
        class="border-b border-gray-300 dark:border-gray-800 w-full mt-2 mb-2 sm:mb-3 sm:mt-3"
      ></div>

      <div class="hidden sm:flex flex-wrap pb-2">
        <div class="mr-3 whitespace-nowrap">
          {formatDate(optionHistoryList?.at(0)?.date)}:
        </div>
        <div class="mr-3 whitespace-nowrap">
          <span class="text-[var(--light-text-color)] font-normal">Vol:</span>
          {optionHistoryList?.at(0)?.volume?.toLocaleString("en-US")}
        </div>
        <div class="mr-3 whitespace-nowrap">
          <span class="text-[var(--light-text-color)] font-normal">OI:</span>
          {optionHistoryList?.at(0)?.open_interest?.toLocaleString("en-US")}
        </div>
        <div class="mr-3 whitespace-nowrap">
          <span class="text-[var(--light-text-color)] font-normal">Avg:</span>
          ${optionHistoryList?.at(0)?.mark}
        </div>
        <div class="mr-3 whitespace-nowrap">
          <span class="text-[var(--light-text-color)] font-normal">Prem:</span>
          {abbreviateNumber(optionHistoryList?.at(0)?.total_premium, true)}
        </div>
        <div class="mr-3 whitespace-nowrap">
          <span class="text-[var(--light-text-color)] font-normal">IV:</span>
          {(optionHistoryList?.at(0)?.implied_volatility * 100)?.toLocaleString(
            "en-US",
          )}%
        </div>
      </div>

      <div class="pb-8 sm:pb-2 rounded overflow-hidden">
        <div
          class="flex flex-row items-center justify-between gap-x-2 ml-auto w-fit mt-2"
        >
          {#each ["Vol/OI", "IV"] as item}
            <label
              on:click={() => (selectGraphType = item)}
              class="px-3 py-1.5 {selectGraphType === item
                ? ' bg-gray-100 dark:bg-white text-black '
                : ' text-opacity-[0.6] border border-gray-300 dark:border-gray-600'} transition ease-out duration-100 sm:hover:bg-white sm:hover:text-black rounded cursor-pointer"
            >
              {item}
            </label>
          {/each}
        </div>
        <div
          class="mt-2 border border-gray-300 dark:border-gray-800 rounded"
          use:highcharts={config}
        ></div>
      </div>

      <div
        bind:this={container}
        on:scroll={getScroll}
        class="h-full max-h-[500px] overflow-y-auto overflow-x-auto"
      >
        <div class="flex justify-start items-center m-auto cursor-normal">
          {#if isLoaded}
            <table
              class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto mt-4"
            >
              <thead class="text-white bg-default">
                <tr class="">
                  <td class=" font-semibold text-sm text-start">Date</td>
                  <td class=" font-semibold text-sm text-end">Vol</td>
                  <td class=" font-semibold text-sm text-end">OI</td>
                  <td class=" font-semibold text-sm text-end">OI Change</td>
                  <td class=" font-semibold text-sm text-end">% Change OI</td>
                  <td class=" font-semibold text-sm text-end">Last Price</td>
                  <td class=" font-semibold text-sm text-end">Avg Price</td>
                  <td class=" font-semibold text-sm text-end">IV</td>
                  <td class=" font-semibold text-sm text-end">Total Prem</td>
                  <td class=" font-semibold text-sm text-end">GEX</td>
                  <td class=" font-semibold text-sm text-end">DEX</td>
                </tr>
              </thead>
              <tbody>
                {#each optionHistoryList as item}
                  <!-- row -->
                  <tr
                    class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
                  >
                    <td class="text-sm sm:text-[1rem] text-start">
                      {formatDate(item?.date)}
                    </td>

                    <td class="text-sm sm:text-[1rem] text-end">
                      {item?.volume !== null
                        ? item?.volume?.toLocaleString("en-US")
                        : 0}
                    </td>

                    <td class="text-sm sm:text-[1rem] text-end">
                      {item?.open_interest !== undefined
                        ? item?.open_interest?.toLocaleString("en-US")
                        : "n/a"}
                    </td>
                    <td class="text-sm sm:text-[1rem] text-end">
                      {#if item?.changeOI >= 0 && item?.changeOI !== null}
                        <span class="text-green-800 dark:text-[#00FC50]"
                          >+{item?.changeOI?.toLocaleString("en-US")}</span
                        >
                      {:else if item?.changeOI < 0 && item?.changeOI !== null}
                        <span class="text-red-800 dark:text-[#FF2F1F]"
                          >{item?.changeOI?.toLocaleString("en-US")}</span
                        >
                      {:else}
                        n/a
                      {/if}
                    </td>

                    <td class="text-sm sm:text-[1rem] text-end">
                      {#if item?.changesPercentageOI > 0 && item?.changesPercentageOI !== undefined}
                        <span class="text-green-800 dark:text-[#00FC50]"
                          >+{item?.changesPercentageOI + "%"}</span
                        >
                      {:else if item?.changesPercentageOI < 0 && item?.changesPercentageOI !== undefined}
                        <span class="text-red-800 dark:text-[#FF2F1F]"
                          >{item?.changesPercentageOI + "%"}</span
                        >
                      {:else if item?.changesPercentageOI === 0 && item?.changesPercentageOI !== undefined}
                        0%
                      {:else}
                        n/a
                      {/if}
                    </td>

                    <td class="text-sm sm:text-[1rem] text-end">
                      {item?.close}
                    </td>

                    <td class="text-sm sm:text-[1rem] text-end">
                      {item?.mark}
                    </td>

                    <td class="text-sm sm:text-[1rem] text-end">
                      {(item?.implied_volatility * 100)?.toLocaleString(
                        "en-US",
                      ) + "%"}
                    </td>

                    <td class="text-sm sm:text-[1rem] text-end">
                      {abbreviateNumber(item?.total_premium)}
                    </td>
                    <td class="text-sm sm:text-[1rem] text-end">
                      {abbreviateNumber(item?.gex?.toFixed(2))}
                    </td>
                    <td class="text-sm sm:text-[1rem] text-end">
                      {abbreviateNumber(item?.dex?.toFixed(2))}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {:else}
            <div class="m-auto flex justify-center items-center h-80">
              <div class="relative">
                <label
                  class=" bg-default dark:bg-secondary rounded h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                >
                  <span
                    class="loading loading-spinner loading-md text-white dark:text-white"
                  ></span>
                </label>
              </div>
            </div>
          {/if}
        </div>
      </div>
    {:else}
      <div
        class="mt-10 flex justify-center sm:justify-start items-center w-full"
      >
        No historical data available yet for the given contract
      </div>
    {/if}
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>

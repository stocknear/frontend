<script lang="ts">
  import {
    abbreviateNumber,
    buildOptionSymbol,
    parseOptionSymbol,
  } from "$lib/utils";
  import { setCache, getCache } from "$lib/store";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import Infobox from "$lib/components/Infobox.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import { page } from "$app/stores";
  import { deferFunction } from "$lib/utils";
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import InfoModal from "$lib/components/InfoModal.svelte";

  import { onMount } from "svelte";

  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";

  export let data;
  export let ticker;

  let isLoaded = false;
  let currentStockPrice = data?.getStockQuote?.price;
  let config = null;
  let selectedOptionType;

  let optionData = {};

  let dateList = Object?.keys(optionData);

  let selectedDate;

  let strikeList = [];

  let selectedStrike;
  let optionSymbol = "";

  let displayList = [];
  let selectGraphType = "Vol/OI";
  let rawDataHistory = [];
  // Track the currently sorted data separately
  let sortedData = [];
  let infoText = {};
  let tooltipTitle;

  // Pagination state
  let currentPage = 1;
  let rowsPerPage = 20;
  let rowsPerPageOptions = [20, 50, 100];
  let totalPages = 1;
  let pagePathName = $page?.url?.pathname;

  let optionQuery = $page.url.searchParams.get("query") || "";

  // Define columns for sorting
  $: columns = [
    { key: "date", label: "Date", align: "left" },
    { key: "volume", label: "Vol", align: "right" },
    { key: "open_interest", label: "OI", align: "right" },
    { key: "changeOI", label: "OI Change", align: "right" },
    { key: "changesPercentageOI", label: "% Change OI", align: "right" },
    { key: "close", label: "Last Price", align: "right" },
    { key: "mark", label: "Avg Price", align: "right" },
    { key: "implied_volatility", label: "IV", align: "right" },
    { key: "total_premium", label: "Total Prem", align: "right" },
    { key: "gex", label: "GEX", align: "right" },
    { key: "dex", label: "DEX", align: "right" },
  ];

  // Define sort orders for each column
  $: sortOrders = {
    date: { order: "none", type: "date" },
    volume: { order: "none", type: "number" },
    open_interest: { order: "none", type: "number" },
    changeOI: { order: "none", type: "number" },
    changesPercentageOI: { order: "none", type: "number" },
    close: { order: "none", type: "number" },
    mark: { order: "none", type: "number" },
    implied_volatility: { order: "none", type: "number" },
    total_premium: { order: "none", type: "number" },
    gex: { order: "none", type: "number" },
    dex: { order: "none", type: "number" },
  };

  function setDefault() {
    selectedOptionType = "Call";
    optionData = data?.getData[selectedOptionType] ?? {};
    if (Object?.keys(optionData)?.length > 0) {
      selectedDate = Object.keys(optionData)[0];
      strikeList = [...optionData[selectedDate]] || [];
      if (!strikeList?.includes(selectedStrike)) {
        selectedStrike = strikeList?.reduce(
          (closest, strike) =>
            Math.abs(strike - currentStockPrice) <
            Math.abs(closest - currentStockPrice)
              ? strike
              : closest,
          strikeList?.at(0),
        );
      }
    }
  }

  if (optionQuery?.length > 0) {
    try {
      const parsedData = parseOptionSymbol(optionQuery);
      selectedOptionType = parsedData?.optionType;
      optionData = data?.getData[selectedOptionType];
      selectedDate = parsedData?.dateExpiration;
      strikeList = optionData[selectedDate] || [];
      selectedStrike = parsedData?.strikePrice;
    } catch (e) {
      setDefault();
    }
  } else {
    setDefault();
  }
  const formatDate = (dateString: string): string => {
    if (!dateString) return "n/a";
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "n/a"
      : date.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          timeZone: "UTC",
        });
  };

  /*
  function calculateDTE(data, dateExpiration) {
    if (!Array.isArray(data)) return [];

    // Parse the expiration date and snap to UTC midnight
    const expirationDate = new Date(dateExpiration);
    expirationDate.setUTCHours(0, 0, 0, 0);

    return data?.map((item) => {
      // Parse each item’s date and snap to UTC midnight
      const itemDate = new Date(item.date);
      itemDate.setUTCHours(0, 0, 0, 0);

      // Compute difference in milliseconds, then convert to days
      const msPerDay = 1000 * 60 * 60 * 24;
      const diffMs = expirationDate - itemDate;
      const dte = Math.ceil(diffMs / msPerDay);

      return {
        ...item,
        dte,
      };
    });
  }
    */

  function plotData() {
    const sortedData =
      rawDataHistory?.sort((a, b) => new Date(a?.date) - new Date(b?.date)) ||
      [];

    // Filter out data points that have an undefined price so they don't appear in any series
    //const filteredData = sortedData.filter((item) => item?.price !== undefined);
    const filteredData = sortedData;

    // Build series based on the selected graph type, using filteredData
    let series = [];
    //const fillColorStart = "rgb(70, 129, 244,0.5)";
    //const fillColorEnd = "rgb(70, 129, 244,0.001)";

    if (selectGraphType == "Vol/OI") {
      series = [
        /*
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
        */
        {
          name: "Option Price",
          type: "spline", // smooth line
          data: filteredData.map((item) => [
            new Date(item.date).getTime(),
            item?.mark,
          ]),
          color: "#4279E6",
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
          color: "#FD8789",
          borderColor: "#FD8789",
          borderRadius: "1px",
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
          color: "#33ABA0",
          borderColor: "#33ABA0",
          borderRadius: "1px",
          yAxis: 0,
          animation: false,
        },
      ];
    } else {
      series = [
        /*
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
        */
        {
          name: "Option Price",
          type: "spline", // smooth line
          data: filteredData?.map((item) => [
            new Date(item.date).getTime(),
            item?.mark,
          ]),
          color: "#4279E6",
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
            Math.ceil(item?.implied_volatility * 100 * 100) / 100, // ceil to 2 decimals
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
      plotOptions: {
        series: {
          animation: false,
          marker: { enabled: false },
          states: { hover: { enabled: false } },
          legendSymbol: "rectangle",
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
              month: "long", // “April”
              day: "numeric", // “11”
              timeZone: "UTC",
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
          // Header with formatted date
          let tooltipContent = `<span class="m-auto text-[1rem] font-[501]">${new Date(
            this.x,
          ).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          })}</span><br>`;

          // Add each series entry, appending "%" when series.name === "IV"
          this.points.forEach((point) => {
            const raw = point?.y?.toLocaleString("en-US");
            const suffix = point.series.name === "IV" ? "%" : "";
            tooltipContent += `
                    <span style="display:inline-block; width:10px; height:10px; background-color:${point.color}; border-radius:50%; margin-right:5px;"></span>
        <span class="font-normal text-sm">${point.series.name}:</span>
        <span class="font-normal text-sm">${raw}${suffix}</span><br>`;
          });

          return tooltipContent;
        },
      },

      series: series,
    };

    return options;
  }

  const getContractHistory = async (contractId) => {
    const postData = {
      ticker: ticker,
      contract: contractId,
    };

    // make the POST request to the endpoint
    const response = await fetch("/api/options-contract-history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    const output = await response?.json();

    return output;
  };

  // Sorting function
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
      sortedData = [...rawDataHistory];
      currentPage = 1; // Reset to first page
      updatePaginatedData();
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
          valueA = a[key]?.toUpperCase() || "";
          valueB = b[key]?.toUpperCase() || "";
          return sortOrder === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        case "number":
        default:
          valueA = parseFloat(a[key]) || 0;
          valueB = parseFloat(b[key]) || 0;
          break;
      }

      // Default comparison for numbers and dates
      if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
      if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    };

    // Sort all data and store it
    sortedData = [...rawDataHistory].sort(compareValues);
    // Reset to first page and update pagination
    currentPage = 1;
    updatePaginatedData();
  };

  // Pagination functions
  function updatePaginatedData() {
    const dataSource = sortedData?.length > 0 ? sortedData : rawDataHistory;
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    displayList = dataSource?.slice(startIndex, endIndex) || [];
    totalPages = Math.ceil((dataSource?.length || 0) / rowsPerPage);
  }

  function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      updatePaginatedData();
    }
  }

  function changeRowsPerPage(newRowsPerPage) {
    rowsPerPage = newRowsPerPage;
    currentPage = 1; // Reset to first page when changing rows per page
    updatePaginatedData();
    saveRowsPerPage(); // Save to localStorage
  }

  // Save rows per page preference to localStorage
  function saveRowsPerPage() {
    if (!pagePathName || typeof localStorage === "undefined") return;

    try {
      const paginationKey = `${pagePathName}_rowsPerPage`;
      localStorage.setItem(paginationKey, String(rowsPerPage));
    } catch (e) {
      console.warn("Failed to save rows per page preference:", e);
    }
  }

  // Load rows per page preference from localStorage
  function loadRowsPerPage() {
    const currentPath = pagePathName || $page?.url?.pathname;

    if (!currentPath || typeof localStorage === "undefined") {
      rowsPerPage = 50; // Default value
      return;
    }

    try {
      const paginationKey = `${currentPath}_rowsPerPage`;
      const savedRows = localStorage.getItem(paginationKey);

      if (savedRows && rowsPerPageOptions.includes(Number(savedRows))) {
        rowsPerPage = Number(savedRows);
      } else {
        rowsPerPage = 50; // Default if invalid or not found
      }
    } catch (e) {
      console.warn("Failed to load rows per page preference:", e);
      rowsPerPage = 50; // Default on error
    }
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function loadData(state: string) {
    //isLoaded = false;
    optionData = data?.getData[selectedOptionType] ?? {};
    if (Object?.keys(optionData)?.length > 0) {
      dateList = [...Object?.keys(optionData)] ?? [];

      strikeList = [...optionData[selectedDate]] ?? [];

      if (!strikeList?.includes(selectedStrike)) {
        selectedStrike = strikeList?.reduce((closest, strike) => {
          return Math?.abs(strike - currentStockPrice) <
            Math?.abs(closest - currentStockPrice)
            ? strike
            : closest;
        }, strikeList?.at(0));
      }

      displayList = [];
      rawDataHistory = [];

      // Reset sort orders
      for (const key in sortOrders) {
        sortOrders[key].order = "none";
      }

      optionSymbol = buildOptionSymbol(
        ticker,
        selectedDate,
        selectedOptionType,
        selectedStrike,
      );

      const output = await getContractHistory(optionSymbol);
      rawDataHistory = output?.history;

      if (rawDataHistory?.length > 0) {
        /*
      rawDataHistory.forEach((entry) => {
        const matchingData = data?.getHistoricalPrice?.find(
          (d) => d?.time === entry?.date,
        );
        if (matchingData) {
          entry.price = matchingData?.close;
        }
      });
      */

        //rawDataHistory = calculateDTE(rawDataHistory, selectedDate);
        config = plotData() || null;
        rawDataHistory = rawDataHistory?.sort(
          (a, b) => new Date(b?.date) - new Date(a?.date),
        );
        // Initialize sortedData with raw data
        sortedData = [...rawDataHistory];
        // Reset to first page and update pagination
        currentPage = 1;
        updatePaginatedData();
      } else {
        config = null;
        displayList = [];
      }
    }

    isLoaded = true;
  }

  async function getInfoText(parameter, title) {
    tooltipTitle = title;
    const cachedData = getCache(parameter, "getInfoText");
    if (cachedData) {
      infoText = cachedData;
    } else {
      const postData = { parameter };
      const response = await fetch("/api/info-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      infoText = await response.json();
      setCache(parameter, infoText, "getInfoText");
    }
  }

  onMount(async () => {
    if (!browser) return;

    // Load pagination preference
    loadRowsPerPage();

    deferFunction(async () => {
      await loadData("default");
    }, 500);
  });

  $: {
    if (selectGraphType) {
      config = plotData() || null;
    }
  }

  // Reactive statement to load pagination settings when page changes
  $: if ($page?.url?.pathname && $page?.url?.pathname !== pagePathName) {
    pagePathName = $page?.url?.pathname;
    loadRowsPerPage(); // Load pagination preference for new page
  }
</script>

<section class="w-full overflow-hidden">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto mt-2 sm:mt-0">
        <h2
          class=" flex flex-row items-center text-xl sm:text-2xl font-bold mb-3"
        >
          Option Contract Lookup
        </h2>

        <Infobox
          text="Search for specific option contracts by expiration date, strike price and option type."
        />

        <div
          class="rounded border border-gray-300 dark:border-gray-700 bg-gray-100 shadow dark:bg-primary p-2 mt-5"
        >
          <div class="items-end">
            <div
              class="sm:grid sm:gap-x-2.5 gap-y-3 md:grid-cols-2 xl:grid-cols-3 w-full"
            >
              <!--Start Added Rules-->
              <div
                class="flex items-center justify-between space-x-2 px-1 py-1.5 leading-tight sm:py-0 border-b border-gray-300 dark:border-gray-600"
              >
                <div class="flex flex-row items-center">
                  Date Expiration
                  <div class="">
                    <InfoModal
                      id="dateExpiration"
                      title="Date Expiration"
                      callAPI={true}
                      parameter="dateExpiration"
                    />
                  </div>
                </div>

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild let:builder>
                    <Button
                      builders={[builder]}
                      class="mb-1 border-gray-300 dark:border-none shadow text-white bg-black sm:hover:bg-default dark:bg-[#000] h-[35px] flex flex-row justify-between items-center min-w-[130px] w-[140px] sm:w-auto  px-3  rounded truncate"
                    >
                      <span class="truncate text-sm"
                        >{formatDate(selectedDate)}</span
                      >
                      <svg
                        class="-mr-1 ml-2 h-5 w-5 inline-block"
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
                    class="min-w-48 w-auto max-w-60 max-h-[400px] overflow-y-auto scroller relative"
                  >
                    <!-- Dropdown items -->
                    <DropdownMenu.Group class="pb-2"
                      >{#each dateList as item, index}
                        {#if data?.user?.tier === "Pro" || index == 0}
                          <DropdownMenu.Item
                            on:click={() => {
                              selectedDate = item;
                              loadData("default");
                            }}
                            class="sm:hover:bg-gray-200 dark:sm:hover:bg-primary cursor-pointer "
                          >
                            {formatDate(item)}
                          </DropdownMenu.Item>
                        {:else}
                          <DropdownMenu.Item
                            on:click={() => goto("/pricing")}
                            class="cursor-pointer sm:hover:bg-gray-200 dark:sm:hover:bg-primary"
                          >
                            <div class="flex flex-row items-center gap-x-2">
                              <span> {formatDate(item)}</span>
                              <svg
                                class="size-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                style="max-width: 40px;"
                              >
                                <path
                                  fill-rule="evenodd"
                                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                  clip-rule="evenodd"
                                >
                                </path>
                              </svg>
                            </div>
                          </DropdownMenu.Item>
                        {/if}
                      {/each}</DropdownMenu.Group
                    >
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </div>
              <div
                class="flex items-center justify-between space-x-2 px-1 py-1.5 leading-tight sm:py-0 border-b border-gray-300 dark:border-gray-600"
              >
                <div class="flex flex-row items-center">
                  Strike Price
                  <div class="">
                    <InfoModal
                      id="strikePrice"
                      title="Strike Price"
                      callAPI={true}
                      parameter="strikePrice"
                    />
                  </div>
                </div>

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild let:builder>
                    <Button
                      builders={[builder]}
                      class="mb-1 border-gray-300 dark:border-none shadow text-white bg-black sm:hover:bg-default dark:bg-[#000] h-[35px] flex flex-row justify-between items-center min-w-[130px] w-[140px] sm:w-auto  px-3  rounded truncate"
                    >
                      <span class="truncate text-sm"
                        >{selectedStrike ?? "n/a"}</span
                      >
                      <svg
                        class="-mr-1 ml-2 h-5 w-5 inline-block"
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
                    class="w-auto max-w-60 max-h-[400px] overflow-y-auto scroller relative"
                  >
                    <!-- Dropdown items -->
                    <DropdownMenu.Group class="pb-2">
                      <!-- Added padding to avoid overlapping with Reset button -->
                      {#each strikeList as item}
                        <DropdownMenu.Item
                          on:click={() => {
                            selectedStrike = item;
                            loadData("default");
                          }}
                          class="sm:hover:bg-gray-200 dark:sm:hover:bg-primary cursor-pointer "
                        >
                          {item}
                        </DropdownMenu.Item>
                      {/each}
                    </DropdownMenu.Group>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </div>
              <div
                class="flex items-center justify-between space-x-2 px-1 py-1.5 leading-tight sm:py-0 border-b border-gray-300 dark:border-gray-600"
              >
                <div class="flex flex-row items-center">
                  Option Type
                  <div class="">
                    <InfoModal
                      id="optionType"
                      title="Option Type"
                      callAPI={true}
                      parameter="optionType"
                    />
                  </div>
                </div>

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild let:builder>
                    <Button
                      builders={[builder]}
                      class="mb-1 border-gray-300 dark:border-none shadow text-white bg-black sm:hover:bg-default dark:bg-[#000] h-[35px] flex flex-row justify-between items-center min-w-[130px] w-[140px] sm:w-auto  px-3  rounded truncate"
                    >
                      <span class="truncate text-sm">{selectedOptionType}</span>
                      <svg
                        class="-mr-1 ml-2 h-5 w-5 inline-block"
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
                    class="w-auto max-w-60 max-h-[400px] overflow-y-auto scroller relative"
                  >
                    <!-- Dropdown items -->
                    <DropdownMenu.Group class="pb-2"
                      >{#each ["Call", "Put"] as item}
                        <DropdownMenu.Item
                          on:click={() => {
                            selectedOptionType = item;
                            loadData("optionType");
                          }}
                          class="sm:hover:bg-gray-200 dark:sm:hover:bg-primary cursor-pointer "
                        >
                          {item}
                        </DropdownMenu.Item>
                      {/each}</DropdownMenu.Group
                    >
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </div>
              <!--End Added Rules-->
            </div>
          </div>
        </div>

        {#if Object?.keys(optionData)?.length > 0}
          <h3
            class=" flex flex-row items-center text-xl sm:text-xl font-bold mt-10"
          >
            {ticker}
            {formatDate(selectedDate)}
            {selectedStrike}
            {selectedOptionType}
          </h3>
          <h3
            class="text-gray-500 dark:text-gray-400 flex flex-row items-center text-sm sm:text-[1rem] mb-2 sm:mb-0"
          >
            {optionSymbol}
          </h3>
          {#if isLoaded && config}
            <div
              class="mt-5 order-5 lg:order-1 flex flex-row space-x-2 sm:space-x-3 xs:space-x-4"
            >
              <table class="w-[50%] text-sm sm:text-[1rem] xl:min-w-[300px]">
                <tbody
                  ><tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-600 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 sm:py-2 text-[1rem]"
                      >Last</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm xs:px-1 sm:py-2 sm:text-right sm:text-[1rem]"
                      >{rawDataHistory?.at(0)?.close ?? "n/a"}</td
                    ></tr
                  >

                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-600 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 sm:py-2 text-[1rem]"
                      >Bid</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm xs:px-1 sm:py-2 sm:text-right sm:text-[1rem]"
                      >{rawDataHistory?.at(0)?.close_bid ?? "n/a"}</td
                    ></tr
                  >

                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-600 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 sm:py-2 text-[1rem]"
                      >Mid</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm xs:px-1 sm:py-2 sm:text-right sm:text-[1rem]"
                      >{rawDataHistory?.at(0)?.mark?.toFixed(2) ?? "n/a"}</td
                    ></tr
                  >

                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-600 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 sm:py-2 text-[1rem]"
                      >Ask</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm xs:px-1 sm:py-2 sm:text-right sm:text-[1rem]"
                      >{rawDataHistory?.at(0)?.close_ask ?? "n/a"}</td
                    ></tr
                  >

                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-600 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 sm:py-2 text-[1rem]"
                      >Open
                    </td>
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm xs:px-1 sm:py-2 sm:text-right sm:text-[1rem]"
                      >{rawDataHistory?.at(0)?.open ?? "n/a"}</td
                    ></tr
                  >
                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-600 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 sm:py-2 text-[1rem]"
                      >Volume
                    </td>
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm xs:px-1 sm:py-2 sm:text-right sm:text-[1rem]"
                      >{rawDataHistory
                        ?.at(0)
                        ?.volume?.toLocaleString("en-US") ?? "n/a"}</td
                    ></tr
                  >
                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-600 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 sm:py-2 text-[1rem]"
                      >Open Interest
                    </td>
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm xs:px-1 sm:py-2 sm:text-right sm:text-[1rem]"
                      >{rawDataHistory
                        ?.at(0)
                        ?.open_interest?.toLocaleString("en-US") ?? "n/a"}</td
                    ></tr
                  >
                </tbody>
              </table>
              <table class="w-[50%] text-sm xl:min-w-[300px]">
                <tbody
                  ><tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-600 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 sm:py-2 text-[1rem]"
                      >Implied Volatility (IV)</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm xs:px-1 sm:py-2 sm:text-right sm:text-[1rem]"
                    >
                      {rawDataHistory?.at(0)?.implied_volatility
                        ? (
                            rawDataHistory?.at(0)?.implied_volatility * 100
                          )?.toFixed(2) + "%"
                        : "n/a"}</td
                    ></tr
                  >

                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-600 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 sm:py-2 text-[1rem]"
                      >Delta</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm xs:px-1 sm:py-2 sm:text-right sm:text-[1rem]"
                      >{rawDataHistory?.at(0)?.delta?.toFixed(3) ?? "n/a"}</td
                    ></tr
                  >

                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-600 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 sm:py-2 text-[1rem]"
                      >Gamma</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm xs:px-1 sm:py-2 sm:text-right sm:text-[1rem]"
                      >{rawDataHistory?.at(0)?.gamma?.toFixed(3) ?? "n/a"}</td
                    ></tr
                  >

                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-600 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 sm:py-2 text-[1rem]"
                      >Theta</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm xs:px-1 sm:py-2 sm:text-right sm:text-[1rem]"
                    >
                      {rawDataHistory?.at(0)?.theta?.toFixed(3) ?? "n/a"}
                    </td></tr
                  >
                  <tr
                    class="flex flex-col border-b border-gray-300 dark:border-gray-600 py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 sm:py-2 text-[1rem]"
                      >Vega</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm xs:px-1 sm:py-2 sm:text-right sm:text-[1rem]"
                    >
                      {rawDataHistory?.at(0)?.vega?.toFixed(3) ?? "n/a"}
                    </td></tr
                  >
                  <tr class="flex flex-col py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 sm:py-2 text-[1rem] invisible"
                      >XXX</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm xs:px-1 sm:py-2 sm:text-right sm:text-[1rem] invisible"
                    >
                      XXX
                    </td></tr
                  >
                  <tr class="flex flex-col py-1 sm:table-row sm:py-0"
                    ><td
                      class="whitespace-nowrap px-0.5 py-[1px] xs:px-1 sm:py-2 text-[1rem] invisible"
                      >XXX</td
                    >
                    <td
                      class="whitespace-nowrap px-0.5 py-[1px] text-left text-sm xs:px-1 sm:py-2 sm:text-right sm:text-[1rem] invisible"
                    >
                      XXX
                    </td></tr
                  >
                </tbody>
              </table>
            </div>

            <div class="mt-5 pb-2 rounded overflow-hidden">
              <div
                class="flex flex-row items-center justify-between w-full mt-2"
              >
                <h2 class="text-xl sm:text-2xl font-bold text-start">
                  Contract Chart
                </h2>
                <div class="w-fit ml-auto">
                  {#each ["Vol/OI", "IV"] as item, index}
                    <label
                      on:click={() => {
                        selectGraphType = item;
                      }}
                      class="px-3 py-1.5 text-sm {index === 0
                        ? 'mr-1'
                        : ''} {selectGraphType === item
                        ? 'shadow border border-gray-300 dark:border-gray-600 bg-black sm:hover:bg-muted dark:bg-white text-white dark:text-black '
                        : 'shadow text-opacity-[0.6] border border-gray-300 dark:border-gray-600'}  rounded cursor-pointer"
                    >
                      {item}
                    </label>
                  {/each}
                </div>
              </div>
              {#if config}
                <div>
                  <div class="grow pt-3">
                    <div class="relative">
                      <!-- Apply the blur class to the chart -->
                      <div
                        class="mt-5 shadow sm:mt-0 sm:border sm:border-gray-300 dark:border-gray-800 rounded"
                        use:highcharts={config}
                      ></div>
                    </div>
                  </div>
                </div>
              {/if}
            </div>

            {#if displayList?.length > 0}
              <div class="items-center lg:overflow-visible px-1 py-1 mt-5">
                <div
                  class="col-span-2 flex flex-row items-center grow py-1 border-t border-b border-gray-300 dark:border-gray-800"
                >
                  <h2
                    class="text-start whitespace-nowrap text-xl sm:text-2xl font-semibold w-full"
                  >
                    History
                  </h2>
                  <div
                    class="mt-1 w-full flex flex-row lg:flex order-1 items-center ml-auto pb-1 pt-1 sm:pt-0 w-full order-0 lg:order-1"
                  >
                    <div class="ml-auto">
                      <DownloadData
                        {data}
                        rawData={rawDataHistory}
                        title={`${optionSymbol}_contract_history`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div
                class="flex justify-start items-center m-auto overflow-x-auto cursor-normal"
              >
                <table
                  class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto mt-4"
                >
                  <thead>
                    <TableHeader {columns} {sortOrders} {sortData} />
                  </thead>
                  <tbody>
                    {#each displayList as item, index}
                      <tr
                        class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
                      >
                        <td
                          class="text-sm sm:text-[1rem] text-start whitespace-nowrap"
                        >
                          {formatDate(item?.date)}
                        </td>

                        <td class="text-sm sm:text-[1rem] text-end">
                          {item?.volume !== null
                            ? item?.volume?.toLocaleString("en-US")
                            : 0}
                        </td>

                        <td class="text-sm sm:text-[1rem] text-end">
                          {item?.open_interest &&
                          item?.open_interest !== undefined
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
                          {item?.implied_volatility
                            ? (item?.implied_volatility * 100)?.toFixed(2) + "%"
                            : "n/a"}
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
              </div>

              <!-- Pagination controls -->
              {#if displayList?.length > 0 && totalPages > 0}
                <div
                  class="flex flex-row items-center justify-between mt-8 sm:mt-5"
                >
                  <!-- Previous button -->
                  <div class="flex items-center gap-2">
                    <Button
                      on:click={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      class="w-fit transition-all flex flex-row items-center duration-50 border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary flex flex-row justify-between items-center sm:w-auto px-1.5 sm:px-3 rounded truncate"
                    >
                      <svg
                        class="h-5 w-5 inline-block shrink-0 rotate-90"
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
                      <span class="hidden sm:inline">Previous</span>
                    </Button>
                  </div>

                  <!-- Page info and rows selector in center -->
                  <div class="flex flex-row items-center gap-4">
                    <span class="text-sm sm:text-[1rem]">
                      Page {currentPage} of {totalPages}
                    </span>

                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild let:builder>
                        <Button
                          builders={[builder]}
                          class="w-fit transition-all duration-50 border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary flex flex-row justify-between items-center sm:w-auto px-2 sm:px-3 rounded truncate"
                        >
                          <span class="truncate text-[0.85rem] sm:text-sm"
                            >{rowsPerPage} Rows</span
                          >
                          <svg
                            class="ml-0.5 mt-1 h-5 w-5 inline-block shrink-0"
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
                        class="w-auto min-w-40 max-h-[400px] overflow-y-auto scroller relative"
                      >
                        <!-- Dropdown items -->
                        <DropdownMenu.Group class="pb-2">
                          {#each rowsPerPageOptions as item}
                            <DropdownMenu.Item
                              class="sm:hover:bg-gray-200 dark:sm:hover:bg-primary"
                            >
                              <label
                                on:click={() => changeRowsPerPage(item)}
                                class="inline-flex justify-between w-full items-center cursor-pointer"
                              >
                                <span class="text-sm">{item} Rows</span>
                              </label>
                            </DropdownMenu.Item>
                          {/each}
                        </DropdownMenu.Group>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </div>

                  <!-- Next button -->
                  <div class="flex items-center gap-2">
                    <Button
                      on:click={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      class="w-fit transition-all flex flex-row items-center duration-50 border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary flex flex-row justify-between items-center sm:w-auto px-1.5 sm:px-3 rounded truncate"
                    >
                      <span class="hidden sm:inline">Next</span>
                      <svg
                        class="h-5 w-5 inline-block shrink-0 -rotate-90"
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
                  </div>
                </div>

                <!-- Back to Top button -->
                <div class="flex justify-center mt-4">
                  <button
                    on:click={scrollToTop}
                    class="cursor-pointer sm:hover:text-muted text-blue-800 dark:sm:hover:text-white dark:text-blue-400 text-sm sm:text-[1rem] font-medium"
                  >
                    Back to Top <svg
                      class="h-5 w-5 inline-block shrink-0 rotate-180"
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
                  </button>
                </div>
              {/if}
            {/if}
          {:else if isLoaded && !config}
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
          {:else}
            <Infobox
              text={`No data is available for this option contract. It may have expired or the selection is invalid.`}
            />
          {/if}
        {:else}
          <Infobox
            text={`No data available for "${selectedOptionType}" options.`}
          />
        {/if}
      </div>
    </div>
  </div>
</section>

{#if isLoaded}
  <input type="checkbox" id="mobileTooltip" class="modal-toggle" />

  <dialog id="mobileTooltip" class="modal p-3">
    <label for="mobileTooltip" class="cursor-pointer modal-backdrop"></label>

    <!-- Desktop modal content -->
    <div
      class="modal-box rounded border border-gray-300 dark:border-gray-600 w-full bg-white dark:bg-secondary flex flex-col items-center"
    >
      <div class=" mb-5 text-center">
        <h3 class="font-bold text-2xl mb-5">{tooltipTitle}</h3>
        <span class=" text-[1rem] font-normal">{infoText?.text ?? "n/a"}</span>
        {#if infoText?.equation !== undefined}
          <div class="w-5/6 m-auto mt-5"></div>
          <div class="text-[1rem] w-full pt-3 pb-3 m-auto">
            {infoText?.equation}
          </div>
        {/if}
      </div>

      <div class="border-t border-gray-300 dark:border-gray-600 mt-2 w-full">
        <label
          for="mobileTooltip"
          class="cursor-pointer mt-4 font-semibold text-xl m-auto flex justify-center"
        >
          Close
        </label>
      </div>
    </div>
  </dialog>
{/if}

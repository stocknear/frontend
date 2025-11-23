<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import { onMount } from "svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import { browser } from "$app/environment";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { goto } from "$app/navigation";

  //import * as XLSX from 'xlsx';
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";

  export let data;

  let rawData = data?.getData?.history || [];
  let baseTableData = Array.isArray(rawData)
    ? [...rawData].sort(
        (a, b) => new Date(b?.date).getTime() - new Date(a?.date).getTime(),
      )
    : [];
  let tableList: any[] = [...baseTableData];
  let paginatedTableList: any[] = [];

  const DEFAULT_ROWS_PER_PAGE = 20;
  const rowsPerPageOptions = [20, 50, 100];

  let rowsPerPage = DEFAULT_ROWS_PER_PAGE;
  let currentPage = 1;
  let totalPages = 1;
  let pagePathName = "";
  let latestEntry = baseTableData?.[0] ?? null;
  $: latestEntry = baseTableData?.[0] ?? null;

  let selectedTimePeriod = "3M";

  function filterTimePeriod(data: any[] = []) {
    if (!Array.isArray(data) || data.length === 0) return [];

    if (selectedTimePeriod === "MAX") {
      return data;
    }

    const now = new Date();
    let cutoffDate: Date;

    if (selectedTimePeriod.endsWith("M")) {
      const months = Number(selectedTimePeriod.replace("M", ""));
      cutoffDate = new Date(
        now.getFullYear(),
        now.getMonth() - months,
        now.getDate(),
      );
    } else if (selectedTimePeriod.endsWith("Y")) {
      const years = Number(selectedTimePeriod.replace("Y", ""));
      cutoffDate = new Date(
        now.getFullYear() - years,
        now.getMonth(),
        now.getDate(),
      );
    } else {
      throw new Error(
        "Invalid selectedTimePeriod format. Use '3M', '6M', '1Y', '3Y', or 'MAX'.",
      );
    }

    return data.filter((item) => new Date(item.date) >= cutoffDate);
  }

  function plotData() {
    if (!rawData || rawData.length === 0) {
      return {};
    }

    // Prepare series data in one pass
    const priceSeries = [];
    const activitySeries = [];
    const sentimentSeries = [];

    rawData.forEach(({ date, price, traded, sentiment }) => {
      const time = new Date(date).getTime();
      priceSeries.push([time, price]);
      activitySeries.push([time, traded]);
      // we'll store plain [time, sentiment] for later tooltip compatibility
      sentimentSeries.push([time, sentiment]);
    });

    // Convert sentimentSeries to point objects with explicit color per point
    const sentimentPoints = sentimentSeries.map(([x, y]) => ({
      x,
      y,
      color: typeof y === "number" && y >= 0 ? "#16A34A" : "#EF4444", // green for >=0, red for <0
    }));

    const options = {
      credits: { enabled: false },
      chart: {
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 400,
        animation: false,
      },
      title: {
        text: `<h3 class="mt-3 -mb-3 text-[1rem] sm:text-lg">Retail Trader Activity</h3>`,
        useHTML: true,
        style: { color: $mode === "light" ? "black" : "white" },
      },
      xAxis: {
        type: "datetime",
        crosshair: {
          color: $mode === "light" ? "black" : "white",
          width: 1,
          dashStyle: "Solid",
        },
        labels: {
          style: { color: $mode === "light" ? "#6b7280" : "#fff" },
          formatter: function () {
            const date = new Date(this.value);
            return `<span class="text-xs">${date.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}</span>`;
          },
        },
      },
      // --- Y-Axes ---
      yAxis: [
        {
          opposite: true, // Right side (sentiment)
          title: {
            text: "Stock Price",
            style: {
              color: $mode === "light" ? "#6b7280" : "#fff",
            },
          },
          labels: {
            style: {
              color: $mode === "light" ? "#6b7280" : "#fff",
            },
            formatter: function () {
              return `${this.value.toFixed(2)}`;
            },
          },
          gridLineWidth: 1,
          gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        },
        {
          visible: false,
        },
        {
          visible: false,
        },
      ],
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 1)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        borderRadius: 4,
        style: {
          color: "#fff",
          fontSize: "14px",
          padding: "10px",
        },
        formatter: function () {
          const pts = this.points || [];

          // Default values
          let retailVol = "-",
            retailColor = "#fff";
          let sentimentVal = "-",
            sentimentColor = "#fff";
          let stockPrice = "-",
            stockColor = "#fff";

          for (let i = 0; i < pts.length; i++) {
            const p = pts[i];
            if (!p.series) continue;

            switch (p.series.name) {
              case "Retail Vol Share":
                retailVol = `$${abbreviateNumber(p.y)}`;
                retailColor = p.color || "#fff";
                break;
              case "Sentiment":
                sentimentVal =
                  p.y > -5 && p.y < 5
                    ? "Neutral"
                    : p.y < -5
                      ? "Bearish"
                      : "Bullish";
                sentimentColor = p.color || (p.y >= 0 ? "#16A34A" : "#EF4444");
                break;
              case "Stock Price":
                stockPrice = p.y.toFixed(2);
                stockColor = p.color || "#fff";
                break;
            }
          }

          // Precompute date string
          const date = new Date(this.x);
          const formattedDate = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });

          // Simple helper for colored circle
          const circle = (color) =>
            `<span style="display:inline-block;width:10px;height:10px;background:${color};border-radius:50%;margin-right:5px;"></span>`;

          // Build HTML in one string (faster than multiple concatenations)
          return `
      <span>${formattedDate}</span><br>
      ${circle(stockColor)}Stock Price: ${stockPrice}<br>
      ${circle(retailColor)}Retail Vol Share: ${retailVol}<br>
      ${circle(sentimentColor)}Retail Sentiment: ${sentimentVal}
    `;
        },
      },

      plotOptions: {
        series: {
          legendSymbol: "rectangle",
          animation: false,
          marker: {
            enabled: false,
            states: {
              hover: { enabled: false },
              select: { enabled: false },
            },
          },
        },
        spline: {
          lineWidth: 2.5,
          shadow: false,
        },
        areaspline: {
          lineWidth: 1.5,
          fillOpacity: 0.3,
          shadow: false,
        },
        column: {
          pointPadding: 0.2,
          borderWidth: 0,
        },
      },
      legend: {
        enabled: true,
        align: "center",
        verticalAlign: "top",
        layout: "horizontal",
        squareSymbol: false,
        symbolWidth: 20,
        symbolHeight: 12,
        symbolRadius: 0,
        itemStyle: {
          color: $mode === "light" ? "black" : "white",
        },
      },
      series: [
        {
          name: "Stock Price",
          type: "spline",
          data: priceSeries,
          yAxis: 0, // Use the NEW first Y-axis (Index 0) on the left
          color: $mode === "light" ? "#000" : "#fff",
          lineWidth: 1.5,
          animation: false,
          zIndex: 1,
        },
        {
          name: "Sentiment",
          type: "column",
          data: sentimentPoints,
          yAxis: 1, // Use the NEW second Y-axis (Index 1)
          color: "#6366f1",
          animation: false,
          zIndex: 0,
        },
        {
          name: "Retail Vol Share",
          type: "spline",
          data: activitySeries,
          yAxis: 2, // Use the NEW third Y-axis (Index 2)
          color: $mode === "light" ? "#2c6288" : "#e3ac0d",
          lineWidth: 1.5,
          animation: false,
          zIndex: 0,
        },
      ],
    };

    return options;
  }

  let config = null;

  let columns = [
    { key: "date", label: "Date", align: "left" },
    {
      key: "activity",
      label: "Retail Vol / US Market",
      align: "right",
    },
    { key: "traded", label: "Retail Vol in $", align: "right" },
    { key: "price", label: "Price", align: "right" },
    { key: "changesPercentage", label: "% Change", align: "right" },
  ];

  let sortOrders = {
    date: { order: "none", type: "date" },
    activity: { order: "none", type: "number" },
    traded: { order: "none", type: "number" },
    price: { order: "none", type: "number" },
    changesPercentage: { order: "none", type: "number" },
  };

  function getPaginationKey() {
    if (!browser) {
      return null;
    }

    const currentPath = window.location.pathname || "";
    if (!currentPath) {
      return null;
    }

    pagePathName = currentPath;
    return `${currentPath}_retail_trader_tracker_rowsPerPage`;
  }

  function loadRowsPerPageFromStorage() {
    const paginationKey = getPaginationKey();
    if (!paginationKey) {
      return rowsPerPage;
    }

    try {
      const savedRows = localStorage.getItem(paginationKey);
      const parsedRows = savedRows ? Number(savedRows) : NaN;
      if (rowsPerPageOptions.includes(parsedRows)) {
        return parsedRows;
      }
    } catch (e) {
      console.warn("Failed to load rows per page preference:", e);
    }

    return DEFAULT_ROWS_PER_PAGE;
  }

  function saveRowsPerPage(value: number) {
    const paginationKey = getPaginationKey();
    if (!paginationKey) {
      return;
    }

    try {
      localStorage.setItem(paginationKey, String(value));
    } catch (e) {
      console.warn("Failed to save rows per page preference:", e);
    }
  }

  function compareForSort(
    a: any,
    b: any,
    key: string,
    type: "date" | "number" | "string",
    order: "asc" | "desc",
  ) {
    const direction = order === "asc" ? 1 : -1;

    if (type === "date") {
      const timeA = new Date(a?.[key]).getTime();
      const timeB = new Date(b?.[key]).getTime();
      const fallback =
        order === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
      const safeA = Number.isFinite(timeA) ? timeA : fallback;
      const safeB = Number.isFinite(timeB) ? timeB : fallback;
      if (safeA === safeB) return 0;
      return safeA < safeB ? -1 * direction : 1 * direction;
    }

    if (type === "string") {
      const valueA = (a?.[key] ?? "").toString().toLowerCase();
      const valueB = (b?.[key] ?? "").toString().toLowerCase();
      return valueA.localeCompare(valueB) * direction;
    }

    const rawA = Number(a?.[key]);
    const rawB = Number(b?.[key]);
    const fallback =
      order === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    const isValidA =
      a?.[key] !== null && a?.[key] !== undefined && Number.isFinite(rawA);
    const isValidB =
      b?.[key] !== null && b?.[key] !== undefined && Number.isFinite(rawB);
    const safeA = isValidA ? rawA : fallback;
    const safeB = isValidB ? rawB : fallback;
    if (safeA === safeB) return 0;
    return safeA < safeB ? -1 * direction : 1 * direction;
  }

  function applySorting() {
    const activeKey = Object.keys(sortOrders).find(
      (key) => sortOrders[key].order !== "none",
    );

    let workingList = [...baseTableData];

    if (activeKey) {
      const { order, type } = sortOrders[activeKey];
      if (order !== "none") {
        workingList.sort((a, b) =>
          compareForSort(a, b, activeKey, type, order),
        );
      }
    }

    tableList = workingList;
  }

  function applyPagination() {
    if (!Array.isArray(tableList) || tableList.length === 0) {
      paginatedTableList = [];
      totalPages = 1;
      currentPage = 1;
      return;
    }

    const safeRowsPerPage =
      rowsPerPage && rowsPerPage > 0 ? rowsPerPage : DEFAULT_ROWS_PER_PAGE;

    if (rowsPerPage <= 0) {
      rowsPerPage = safeRowsPerPage;
    }

    totalPages = Math.max(1, Math.ceil(tableList.length / safeRowsPerPage));

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    if (currentPage < 1) {
      currentPage = 1;
    }

    const startIndex = (currentPage - 1) * safeRowsPerPage;
    paginatedTableList = tableList.slice(
      startIndex,
      startIndex + safeRowsPerPage,
    );
  }

  function refreshTable({ resetPage = false } = {}) {
    applySorting();
    if (resetPage) {
      currentPage = 1;
    }
    applyPagination();
  }

  function goToPage(pageNumber: number) {
    if (pageNumber < 1 || pageNumber > totalPages) {
      return;
    }

    currentPage = pageNumber;
    applyPagination();
  }

  function changeRowsPerPage(newRowsPerPage: number) {
    if (rowsPerPage === newRowsPerPage) {
      return;
    }

    rowsPerPage = newRowsPerPage;
    currentPage = 1;
    if (browser) {
      saveRowsPerPage(rowsPerPage);
    }
    refreshTable({ resetPage: true });
  }

  function sortData(key: string) {
    if (!sortOrders[key]) {
      return;
    }

    const updatedSortOrders = { ...sortOrders };
    for (const sortKey in updatedSortOrders) {
      if (sortKey !== key) {
        updatedSortOrders[sortKey].order = "none";
      }
    }

    const orderCycle: Array<"none" | "asc" | "desc"> = ["none", "asc", "desc"];
    const currentOrder = updatedSortOrders[key].order;
    const nextOrder =
      orderCycle[(orderCycle.indexOf(currentOrder) + 1) % orderCycle.length];

    updatedSortOrders[key].order = nextOrder;
    sortOrders = updatedSortOrders;

    refreshTable({ resetPage: true });
  }

  refreshTable({ resetPage: true });

  onMount(() => {
    if (!browser) {
      return;
    }

    const storedRows = loadRowsPerPageFromStorage();
    if (storedRows !== rowsPerPage) {
      rowsPerPage = storedRows;
    }

    refreshTable({ resetPage: true });
  });

  $: {
    if ($mode && selectedTimePeriod) {
      rawData = data?.getData?.history || [];
      rawData = filterTimePeriod(rawData);
      config = plotData(); // refresh chart
    }
  }
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Retail Trader Activity Tracker | Volume, Flow, and Sentiment`}
  description={`Real-time and historical retail trader tracking for ${$displayCompanyName} (${$stockTicker}). Analyze retail volume share, dollar flow, and market sentiment to understand individual investor impact on the stock price and overall trading activity.`}
  keywords={`${$stockTicker} retail volume, ${$displayCompanyName} retail sentiment, retail trader tracker, individual investor activity, retail flow, ${$stockTicker} daily retail volume, stock market sentiment data`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/statistics/retail-trader-tracker`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "Dataset"],
    name: `${$displayCompanyName} Retail Trader Tracker`,
    description: `Professional tracking and analysis of retail investor trading volume and sentiment for ${$displayCompanyName} (${$stockTicker}).`,
    url: `https://stocknear.com/stocks/${$stockTicker}/statistics/retail-trader-tracker`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Retail Volume Share tracking",
      "Retail Dollar Volume Flow",
      "Retail Trader Sentiment analysis",
      "Historical retail activity data",
      "Individual investor impact analysis",
      "Retail vs US Market Volume Comparison",
      "Daily activity metrics",
    ],
    provider: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
    mainEntity: {
      "@type": "Corporation",
      name: $displayCompanyName,
      tickerSymbol: $stockTicker,
    },
    about: {
      "@type": "Thing",
      name: "Retail Trader Activity and Sentiment Analysis",
      description:
        "Professional analysis of retail trader volume, flow, and sentiment for stock $stockTicker.",
    },
  }}
/>
<section class=" w-full overflow-hidden h-full">
  <div class="w-full flex justify-center w-full sm-auto h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <main class="w-full">
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 m-auto mt-2 sm:mt-0">
          <div class="w-full flex flex-col sm:flex-row justify-between">
            <h1 class="text-xl sm:text-2xl font-bold">
              {removeCompanyStrings($displayCompanyName)} Retail Trader Tracker
            </h1>
          </div>

          {#if rawData?.length !== 0}
            <div class="grid grid-cols-1 gap-2">
              <Infobox
                text={`As of ${new Date(
                  data?.getData?.lastDate,
                )?.toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  timeZone: "UTC",
                })}, retail traders accounted for ${
                  typeof data?.getData?.lastActivity === "number"
                    ? data.getData.lastActivity.toFixed(2)
                    : (data?.getData?.lastActivity ?? "-")
                }% of ${removeCompanyStrings($displayCompanyName)}'s trading volume. Retail Market Share shows how much individual investors are focusing on this stock compared to the overall US retail market, often revealing rising attention or potential volatility.`}
              />

              <div
                class="my-5 grid grid-cols-2 gap-3 xs:mt-6 bp:mt-7 sm:grid-cols-3 sm:gap-6"
              >
                <div class="short-interest-driver">
                  Retail Vol / US Market
                  <div
                    class="mt-0.5 text-lg bp:text-xl sm:mt-1.5 sm:text-2xl font-semibold"
                  >
                    {data?.getData?.lastActivity
                      ? data?.getData?.lastActivity + "%"
                      : "n/a"}
                  </div>
                </div>
                <div class="changeMoM-driver">
                  Retail Vol in $ <div
                    class="mt-0.5 text-lg bp:text-xl sm:mt-1.5 sm:text-2xl font-semibold"
                  >
                    {data?.getData?.lastTraded
                      ? "$" + abbreviateNumber(data?.getData?.lastTraded)
                      : "n/a"}
                  </div>
                </div>
                <div class="shortPriorMonth-driver">
                  Retail Sentiment <div
                    class="mt-0.5 text-lg bp:text-xl sm:mt-1.5 sm:text-2xl font-semibold"
                  >
                    {data?.getData?.lastSentiment > -5 &&
                    data?.getData?.lastSentiment < 5
                      ? "Neutral"
                      : data?.getData?.lastSentiment < -5
                        ? "Bearish"
                        : "Bullish"}
                  </div>
                </div>
              </div>

              <div
                class="mt-2 flex flex-row items-center w-full justify-between border-t border-b border-gray-300 dark:border-gray-800 py-2"
              >
                <h2 class="text-xl sm:text-2xl font-bold">
                  Retail Tracker Chart
                </h2>
                <div class="sm:ml-auto">
                  <div class="relative inline-block">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild let:builder>
                        <Button
                          builders={[builder]}
                          class="flex-shrink-0  w-full sm:w-fit border border-gray-300 dark:border-gray-800 bg-black sm:hover:bg-default text-white dark:bg-primary dark:sm:hover:bg-secondary ease-out  flex flex-row justify-between items-center px-3 py-1.5  rounded truncate"
                        >
                          <span class="truncate">{selectedTimePeriod}</span>
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
                        class=" h-fit max-h-72 overflow-y-auto scroller"
                      >
                        <DropdownMenu.Group>
                          {#each ["3M", "6M", "1Y", "3Y"] as item, index}
                            {#if ["Plus", "Pro"]?.includes(data?.user?.tier) || index === 0}
                              <DropdownMenu.Item
                                on:click={() => (selectedTimePeriod = item)}
                                class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                              >
                                {item}
                              </DropdownMenu.Item>
                            {:else}
                              <DropdownMenu.Item
                                on:click={() => goto("/pricing")}
                                class="cursor-pointer sm:hover:bg-gray-200 dark:sm:hover:bg-primary"
                              >
                                {item}
                                <svg
                                  class="ml-1 size-4"
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
                              </DropdownMenu.Item>
                            {/if}
                          {/each}
                        </DropdownMenu.Group>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </div>
                </div>
              </div>

              <div class="">
                <div class="grow">
                  <div class="relative">
                    <!-- Apply the blur class to the chart -->
                    <div
                      class="{!['Plus', 'Pro']?.includes(data?.user?.tier)
                        ? 'blur-[3px]'
                        : ''}  border border-gray-300 dark:border-gray-800 rounded"
                      use:highcharts={config}
                    ></div>
                    {#if !["Plus", "Pro"]?.includes(data?.user?.tier)}
                      <div
                        class="font-bold text-lg sm:text-xl absolute top-0 bottom-0 left-0 right-0 flex items-center justify-center text-muted dark:text-white"
                      >
                        <a
                          href="/pricing"
                          class="sm:hover:text-blue-800 dark:sm:hover:text-white dark:text-white flex flex-row items-center"
                        >
                          <span>Upgrade</span>
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
                class="flex flex-row items-center w-full justify-between mt-3 border-t border-b border-gray-300 dark:border-gray-800 py-2"
              >
                <h3 class=" history-driver text-xl sm:text-2xl font-bold">
                  History
                </h3>

                <div class="flex flex-row items-center w-fit w-[50%] ml-auto">
                  <DownloadData
                    {data}
                    {rawData}
                    title={`retail_trader_tracker_${$stockTicker}`}
                  />
                </div>
              </div>

              <div class="w-full overflow-x-auto">
                <table
                  class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto mt-2"
                >
                  <thead>
                    <TableHeader {columns} {sortOrders} {sortData} />
                  </thead>
                  <tbody>
                    {#each paginatedTableList as item}
                      <!-- row -->
                      <tr
                        class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
                      >
                        <td class=" text-sm sm:text-[1rem] whitespace-nowrap">
                          {new Date(item?.date)?.toLocaleDateString("en-US", {
                            day: "2-digit", // Include day number
                            month: "short", // Display short month name
                            year: "numeric", // Include year
                            timeZone: "UTC",
                          })}
                        </td>

                        <td
                          class=" text-sm sm:text-[1rem] text-right whitespace-nowrap"
                        >
                          {item?.activity ? item?.activity + "%" : "n/a"}
                        </td>
                        <td
                          class=" text-sm sm:text-[1rem] text-right whitespace-nowrap"
                        >
                          {item?.traded
                            ? "$" + abbreviateNumber(item?.traded)
                            : "n/a"}
                        </td>

                        <td
                          class=" text-sm sm:text-[1rem] text-right whitespace-nowrap"
                        >
                          {item?.price}
                        </td>

                        <td
                          class=" text-sm sm:text-[1rem] whitespace-nowrap text-end"
                        >
                          <span
                            class={item?.changesPercentage &&
                            item?.changesPercentage > 0
                              ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
                              : item?.changesPercentage &&
                                  item?.changesPercentage < 0
                                ? "text-red-800 dark:text-[#FF2F1F]"
                                : ""}
                          >
                            {item?.changesPercentage
                              ? item?.changesPercentage?.toFixed(2) + "%"
                              : "n/a"}
                          </span>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
              {#if paginatedTableList?.length > 0}
                <div
                  class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-6"
                >
                  <Button
                    on:click={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    class="w-fit transition-all duration-50 border border-gray-300 dark:border-gray-800 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary flex flex-row items-center sm:w-auto px-1.5 sm:px-3 rounded truncate gap-1"
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

                  <div class="flex flex-row items-center gap-4">
                    <span class="text-sm sm:text-[1rem]">
                      Page {currentPage} of {totalPages}
                    </span>

                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild let:builder>
                        <Button
                          builders={[builder]}
                          class="w-fit transition-all duration-50 border border-gray-300 dark:border-gray-800 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary flex flex-row justify-between items-center sm:w-auto px-2 sm:px-3 rounded truncate gap-1"
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

                  <Button
                    on:click={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    class="w-fit transition-all duration-50 border border-gray-300 dark:border-gray-800 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary flex flex-row items-center sm:w-auto px-1.5 sm:px-3 rounded truncate gap-1"
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
              {/if}

              <div
                class="text-sm border border-gray-300 dark:border-gray-800 p-3 mt-5"
              >
                <strong>Source:</strong> Retail Trader Activity data to track
                sentiment is provided by
                <a
                  href="https://data.nasdaq.com/databases/RTAT"
                  target="_blank"
                  rel="noopener"
                  class="sm:hover:text-muted text-blue-800 dark:text-blue-400 dark:sm:hover:text-white"
                  >Nasdaq Data Link</a
                >. The data is updated daily.
              </div>
            </div>
          {:else}
            <Infobox text="No data available" />
          {/if}
        </div>
      </main>
    </div>
  </div>
</section>

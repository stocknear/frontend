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

 //import * as XLSX from 'xlsx';
 import highcharts from "$lib/highcharts.ts";
 import { mode } from "mode-watcher";

 export let data;

 let rawData = data?.getData?.history || [];
 let baseTableData = Array.isArray(rawData)
  ? [...rawData].sort(
    (a, b) =>
     new Date(b?.recordDate).getTime() - new Date(a?.recordDate).getTime(),
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

 function plotData() {
  if (!rawData || rawData.length === 0) {
   return {};
  }

  // Prepare series data in one pass
  const priceSeries = [];
  const shortFloatData = [];

  rawData.forEach(({ recordDate, price, shortPercentOfFloat }) => {
   const time = new Date(recordDate).getTime();
   priceSeries.push([time, price]);
   shortFloatData.push({ time, price, shortFloat: shortPercentOfFloat });
  });

  // Calculate statistical thresholds for categorization
  const shortFloatValues = shortFloatData.map((d) => d.shortFloat);
  const maxShortFloat = Math.max(...shortFloatValues);
  const minShortFloat = Math.min(...shortFloatValues);
  const avgShortFloat =
   shortFloatValues.reduce((sum, val) => sum + val, 0) /
   shortFloatValues.length;

  // Calculate standard deviation for better threshold detection
  const variance =
   shortFloatValues.reduce(
    (sum, val) => sum + Math.pow(val - avgShortFloat, 2),
    0,
   ) / shortFloatValues.length;
  const stdDev = Math.sqrt(variance);

  // Define thresholds for different severity levels (relative to avg)
  const extremeThreshold = avgShortFloat + 2 * stdDev;
  const highThreshold = avgShortFloat + stdDev;
  const mediumThreshold = avgShortFloat + 0.5 * stdDev;

  // Categorize short interest spikes into different severity levels
  const extremeShortBubbles = [];
  const highShortBubbles = [];
  const mediumShortBubbles = [];

  shortFloatData.forEach((item) => {
   // Create bubble point with proper structure
   const bubblePoint = {
    x: item.time,
    y: item.price,
    z: item.shortFloat, // Size based on short float percentage
    shortFloat: item.shortFloat,
    date: new Date(item.time).toLocaleDateString("en-US", {
     year: "numeric",
     month: "short",
     day: "numeric",
    }),
   };

   // Categorize by severity (keeps same thresholds, but used for grouping/visuals)
   if (item.shortFloat >= extremeThreshold) {
    extremeShortBubbles.push(bubblePoint);
   } else if (item.shortFloat >= highThreshold) {
    highShortBubbles.push(bubblePoint);
   } else if (item.shortFloat >= mediumThreshold) {
    mediumShortBubbles.push(bubblePoint);
   }
  });

  const fillColorStart = "rgba(70, 129, 244, 0.5)";
  const fillColorEnd = "rgba(70, 129, 244, 0.001)";

  const options = {
   credits: { enabled: false },
   chart: {
    backgroundColor: $mode === "light" ? "#fff" : "#09090B",
    plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
    height: 400,
    animation: false,
   },
   title: {
    text: `<h3 class="mt-3 -mb-3 text-sm sm:text-lg">Short Interest Activity</h3>`,
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
    tickPositioner: function () {
     const positions = [];
     const { min, max } = this.getExtremes();
     const tickCount = 5;
     const interval = Math.floor((max - min) / tickCount);
     for (let i = 0; i <= tickCount; i++) {
      positions.push(min + i * interval);
     }
     return positions;
    },
   },
   yAxis: {
    title: {
     text: "Stock Price ($)",
     style: {
      color: $mode === "light" ? "#6b7280" : "#fff",
     },
    },
    labels: {
     style: {
      color: $mode === "light" ? "#6b7280" : "#fff",
     },
     formatter: function () {
      return `$${this.value.toFixed(2)}`;
     },
    },
    gridLineWidth: 1,
    gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
   },
   tooltip: {
    shared: false,
    useHTML: true,
    backgroundColor: "rgba(0, 0, 0, 1)",
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    style: {
     color: "#fff",
     fontSize: "14px",
     padding: "10px",
    },
    borderRadius: 4,
    formatter: function () {
     const date = new Date(this.x);
     const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
     });

     if (this.series.type === "bubble") {
      // Determine how the short float compares to the average
      const val = this.point.shortFloat;
      let severityLabel = "";
      let severityColor = "";

      if (val >= extremeThreshold) {
       severityLabel = "Well above average";
       severityColor = "#dc2626"; // red
      } else if (val >= highThreshold) {
       severityLabel = "Above average";
       severityColor = "#f59e0b"; // orange
      } else if (val >= mediumThreshold) {
       severityLabel = "Slightly above average";
       severityColor = "#fbbf24"; // amber
      } else {
       severityLabel = "Average or below";
       severityColor = $mode === "light" ? "#10b981" : "#34d399"; // green tones
      }

      return `
      <span class="text-white text-sm font-normal">${formattedDate}</span><br>
      <span class="text-white text-sm">Stock Price: $${this.point.y?.toFixed(2)}</span><br>
      <span class="text-white text-sm">Short Float: ${this.point.shortFloat?.toFixed(2)}%</span><br>
      <span class="text-white text-sm">Comparison to Avg: <span style="color: ${severityColor}">${severityLabel}</span></span><br>
     `;
     } else {
      return `
      <span class="text-white text-sm font-normal">${formattedDate}</span><br>
      <span class="text-white text-sm font-[501]">Stock Price: $${this.y?.toFixed(2)}</span>
     `;
     }
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
     shadow-none: false,
    },
    areaspline: {
     lineWidth: 1.5,
     fillOpacity: 0.3,
     shadow-none: false,
    },
    bubble: {
     minSize: 5, // Smaller minimum for small spikes
     maxSize: 40, // Larger maximum for biggest spikes
     opacity: 0.5,
     marker: {
      enabled: true, // Enable markers for bubbles
      fillOpacity: 0.8,
      lineWidth: 1,
      lineColor: $mode === "light" ? "#d97706" : "#f59e0b",
     },
     dataLabels: {
      enabled: false,
     },
     sizeBy: "z", // Size bubbles by z-value
     zMin: minShortFloat, // Use actual minimum volume for scaling
     zMax: maxShortFloat, // Use actual maximum volume for scaling
     sizeByAbsoluteValue: false, // Use relative sizing for better proportion
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
     type: "area",
     data: priceSeries,
     color: "#4681f4",
     lineWidth: 1.5,
     fillColor: {
      linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
      stops: [
       [0, fillColorStart],
       [1, fillColorEnd],
      ],
     },
     animation: false,
     zIndex: 1,
    },
    {
     // points >= avg + 2*stdDev
     name: "Well above average",
     type: "bubble",
     data: extremeShortBubbles,
     color: "#ef4444", // Red for well above avg
     marker: {
      lineColor: "#dc2626",
     },
     animation: false,
     zIndex: 4,
     showInLegend: extremeShortBubbles.length > 0,
    },
    {
     // points >= avg + 1*stdDev
     name: "Above average",
     type: "bubble",
     data: highShortBubbles,
     color: "#fb923c", // Orange for above avg
     marker: {
      lineColor: "#f59e0b",
     },
     animation: false,
     zIndex: 3,
     showInLegend: highShortBubbles.length > 0,
    },
    {
     // points >= avg + 0.5*stdDev
     name: "Slightly above average",
     type: "bubble",
     data: mediumShortBubbles,
     color: "#fbbf24", // Amber for slightly above avg
     marker: {
      lineColor: "#fbbf24",
     },
     animation: false,
     zIndex: 2,
     showInLegend: mediumShortBubbles.length > 0,
    },
   ],
  };

  return options;
 }

 let config = null;

 let columns = [
  { key: "recordDate", label: "Date", align: "left" },
  { key: "totalShortInterest", label: "Short Interest", align: "right" },
  { key: "shortPriorMo", label: "Short Prior Month", align: "right" },
  { key: "percentChangeMoMo", label: "% Change", align: "right" },
  { key: "daysToCover", label: "Day to Cover", align: "right" },
  { key: "shortPercentOfFloat", label: "Short % Float", align: "right" },
  { key: "shortPercentOfOut", label: "Short % Out", align: "right" },
 ];

 let sortOrders = {
  recordDate: { order: "none", type: "date" },
  totalShortInterest: { order: "none", type: "number" },
  shortPriorMo: { order: "none", type: "number" },
  percentChangeMoMo: { order: "none", type: "number" },
  daysToCover: { order: "none", type: "number" },
  shortPercentOfFloat: { order: "none", type: "number" },
  shortPercentOfOut: { order: "none", type: "number" },
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
  return `${currentPath}_short_interest_rowsPerPage`;
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
  if ($mode) {
   config = plotData();
  }
 }
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Short Interest Analysis | Historical Data & Squeeze Indicators`}
  description={`Comprehensive short interest analysis for ${$displayCompanyName} (${$stockTicker}). Track short position changes, days to cover, short ratio, float percentage, and historical trends. Advanced short squeeze detection and bearish sentiment analysis tools.`}
  keywords={`${$stockTicker} short interest, ${$displayCompanyName} short squeeze, days to cover, short float percentage, ${$stockTicker} short ratio, short position analysis, short interest history, bearish sentiment analysis, squeeze indicators`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/statistics/short-interest`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "Dataset"],
    name: `${$displayCompanyName} Short Interest Analysis`,
    description: `Professional short interest tracking and squeeze analysis for ${$displayCompanyName} (${$stockTicker})`,
    url: `https://stocknear.com/stocks/${$stockTicker}/statistics/short-interest`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Short interest tracking",
      "Days to cover analysis",
      "Short float percentage",
      "Historical short data",
      "Short squeeze indicators",
      "Bearish sentiment analysis",
      "Short ratio calculations",
      "Position change tracking",
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
      name: "Short Interest Analysis",
      description:
        "Professional analysis of short positions and squeeze potential",
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
              {removeCompanyStrings($displayCompanyName)} Short Interest
            </h1>
          </div>

          {#if rawData?.length !== 0}
            <div class="grid grid-cols-1 gap-2">
              <Infobox
                text={`${removeCompanyStrings($displayCompanyName)} has a total short interest of ${abbreviateNumber(
                  data?.getData?.sharesShort,
                )}. Its short interest has ${
                  (latestEntry?.percentChangeMoMo ?? 0) > 0
                    ? "increased"
                    : (latestEntry?.percentChangeMoMo ?? 0) < 0
                      ? "decreased"
                      : "unchanged"
                } by ${abbreviateNumber(
                  latestEntry?.percentChangeMoMo?.toFixed(2),
                )}% to the previous month.`}
              />

              <div
                class="my-5 grid grid-cols-2 gap-3 xs:mt-6 bp:mt-7 sm:grid-cols-3 sm:gap-6"
              >
                <div class="short-interest-driver">
                  Short Interest
                  <div
                    class="mt-0.5 text-lg bp:text-xl sm:mt-1.5 sm:text-2xl font-semibold"
                  >
                    {abbreviateNumber(data?.getData?.sharesShort)}
                  </div>
                </div>
                <div class="shortPriorMonth-driver">
                  Short Prior Month <div
                    class="mt-0.5 text-lg bp:text-xl sm:mt-1.5 sm:text-2xl font-semibold"
                  >
                    {abbreviateNumber(data?.getData?.sharesShortPriorMonth)}
                  </div>
                </div>
                <div class="changeMoM-driver">
                  % Change MoM <div
                    class="mt-0.5 text-lg {latestEntry?.percentChangeMoMo > 0
                      ? "before:content-['+'] "
                      : ''} font-semibold bp:text-xl sm:mt-1.5 sm:text-2xl"
                  >
                    {latestEntry?.percentChangeMoMo
                      ? latestEntry?.percentChangeMoMo + "%"
                      : "n/a"}
                  </div>
                </div>
                <div class="shortPercentFloat-driver">
                  Short % Floating
                  <div
                    class="mt-0.5 text-lg bp:text-xl sm:mt-1.5 sm:text-2xl font-semibold"
                  >
                    {data?.getData?.shortFloatPercent
                      ? data?.getData?.shortFloatPercent + "%"
                      : "n/a"}
                  </div>
                </div>
                <div class="shortPercentOutstanding-driver">
                  Short % Outstanding
                  <div
                    class="mt-0.5 text-lg bp:text-xl sm:mt-1.5 sm:text-2xl font-semibold"
                  >
                    {data?.getData?.shortOutstandingPercent
                      ? data?.getData?.shortOutstandingPercent + "%"
                      : "n/a"}
                  </div>
                </div>
                <div class="daysToCover-driver">
                  Days to Cover
                  <div
                    class="mt-0.5 text-lg bp:text-xl sm:mt-1.5 sm:text-2xl font-semibold"
                  >
                    {data?.getData?.shortRatio}
                  </div>
                </div>
              </div>

              <div
                class="flex flex-col sm:flex-row items-start sm:items-center w-full"
              >
                <h2 class="text-xl sm:text-2xl font-bold">
                  Short Interest Chart
                </h2>
              </div>

              <div class="chart-driver">
                <div class="grow">
                  <div class="relative">
                    <!-- Apply the blur class to the chart -->
                    <div
                      class="{!['Plus', 'Pro']?.includes(data?.user?.tier)
                        ? 'blur-[3px]'
                        : ''}  border border-gray-200/70 dark:border-zinc-800/80 rounded"
                      use:highcharts={config}
                    ></div>
                    <!-- Overlay with "Upgrade to Pro" -->
                    {#if !["Plus", "Pro"]?.includes(data?.user?.tier)}
                      <div
                        class="font-bold text-lg sm:text-xl absolute top-0 bottom-0 left-0 right-0 flex items-center justify-center text-gray-600 dark:text-zinc-300"
                      >
                        <a
                          href="/pricing"
                          class="text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition flex flex-row items-center"
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
                class="flex flex-row items-center w-full justify-between mt-3 border-t border-b border-gray-200/70 dark:border-zinc-800/80 py-2"
              >
                <h3 class=" history-driver text-xl sm:text-2xl font-bold">
                  History
                </h3>

                <div class="flex flex-row items-center w-fit w-[50%] ml-auto">
                  <DownloadData
                    {data}
                    {rawData}
                    title={`short_interest_${$stockTicker}`}
                  />
                </div>
              </div>

              <div class="w-full overflow-x-auto">
                <table
                  class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-200/70 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/40 text-gray-700 dark:text-zinc-200 tabular-nums m-auto mt-2"
                >
                  <thead>
                    <TableHeader {columns} {sortOrders} {sortData} />
                  </thead>
                  <tbody>
                    {#each paginatedTableList as item}
                      <!-- row -->
                      <tr class="transition-colors">
                        <td class=" text-sm whitespace-nowrap">
                          {new Date(item?.recordDate)?.toLocaleDateString(
                            "en-US",
                            {
                              day: "2-digit", // Include day number
                              month: "short", // Display short month name
                              year: "numeric", // Include year
                              timeZone: "UTC",
                            },
                          )}
                        </td>

                        <td class=" text-sm text-right whitespace-nowrap">
                          {abbreviateNumber(item?.totalShortInterest)}
                        </td>
                        <td class=" text-sm text-right whitespace-nowrap">
                          {abbreviateNumber(item?.shortPriorMo)}
                        </td>
                        <td class=" text-sm whitespace-nowrap text-end">
                          <span
                            class={item?.percentChangeMoMo &&
                            item?.percentChangeMoMo >= 0
                              ? "before:content-['+'] text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"}
                          >
                            {item?.percentChangeMoMo
                              ? item?.percentChangeMoMo + "%"
                              : "n/a"}
                          </span>
                        </td>
                        <td class=" text-sm text-right whitespace-nowrap">
                          {abbreviateNumber(item?.daysToCover)}
                        </td>
                        <td class=" text-sm text-right whitespace-nowrap">
                          {item?.shortPercentOfFloat
                            ? item?.shortPercentOfFloat + "%"
                            : "n/a"}
                        </td>
                        <td class=" text-sm text-right whitespace-nowrap">
                          {item?.shortPercentOfOut
                            ? item?.shortPercentOfOut + "%"
                            : "n/a"}
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
                    class="w-fit sm:w-auto gap-1 transition-all duration-150 border border-gray-200/70 dark:border-zinc-800/80 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
                    <span class="text-sm text-gray-600 dark:text-zinc-300">
                      Page {currentPage} of {totalPages}
                    </span>

                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild let:builder>
                        <Button
                          builders={[builder]}
                          class="w-fit sm:w-auto gap-1 transition-all duration-150 border border-gray-200/70 dark:border-zinc-800/80 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
                        class="w-auto min-w-40 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-200/70 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
                      >
                        <DropdownMenu.Group class="pb-2">
                          {#each rowsPerPageOptions as item}
                            <DropdownMenu.Item
                              class="text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
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
                    class="w-fit sm:w-auto gap-1 transition-all duration-150 border border-gray-200/70 dark:border-zinc-800/80 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
            </div>
          {:else}
            <Infobox text="No data available" />
          {/if}
        </div>
      </main>
    </div>
  </div>
</section>

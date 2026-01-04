<script lang="ts">
 import { displayCompanyName, stockTicker, screenWidth } from "$lib/store";
 import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
 import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
 import { Button } from "$lib/components/shadcn/button/index.js";
 import highcharts from "$lib/highcharts.ts";
 import { mode } from "mode-watcher";
 import { page } from "$app/stores";
 import { toast } from "svelte-sonner";

 import { onMount } from "svelte";

 import TableHeader from "$lib/components/Table/TableHeader.svelte";
 import SEO from "$lib/components/SEO.svelte";
 import Infobox from "$lib/components/Infobox.svelte";
 import DownloadData from "$lib/components/DownloadData.svelte";

 export let data;

 const SUMMARY_CREDIT_COST = 3;

 // AI Summarize feature states
 let showSummary = false;
 let isGeneratingSummary = false;
 let summaryGenerated = false;
 let summaryError = false;

 // Summary data from API
 let summaryData: {
  sentiment: string;
  sentimentScore: number;
  keyHighlights: string[];
  risks: string[];
  outlook: string;
  error?: string;
 } | null = null;

 // LocalStorage cache helpers
 function getSummaryCacheKey(ticker: string): string {
  return `insider-summary-${ticker}`;
 }

 function getCachedSummary(ticker: string) {
  try {
   const key = getSummaryCacheKey(ticker);
   const cached = localStorage.getItem(key);
   if (cached) {
    const parsed = JSON.parse(cached);
    const cacheTime = parsed.timestamp || 0;
    const now = Date.now();
    // Cache valid for 1 day (insider data changes less frequently)
    if (now - cacheTime < 1 * 24 * 60 * 60 * 1000) {
     return parsed.data;
    } else {
     localStorage.removeItem(key);
    }
   }
  } catch (e) {
   console.error("Error reading from cache:", e);
  }
  return null;
 }

 function saveSummaryToCache(ticker: string, summary: typeof summaryData) {
  try {
   const key = getSummaryCacheKey(ticker);
   localStorage.setItem(
    key,
    JSON.stringify({
     data: summary,
     timestamp: Date.now(),
    }),
   );
  } catch (e) {
   console.error("Error saving to cache:", e);
  }
 }

 // Export functions
 function generateMarkdown(): string {
  if (!summaryData) return "";

  return `# ${$displayCompanyName} (${$stockTicker}) - Insider Trading Summary

## Overall Sentiment: ${summaryData.sentiment} (${summaryData.sentimentScore}%)

## Key Highlights
${summaryData.keyHighlights.map((h) => `- ${h}`).join("\n")}

## Risk Factors
${summaryData.risks.map((r) => `- ${r}`).join("\n")}

## Outlook
${summaryData.outlook}

---
*Generated on ${new Date().toLocaleDateString()}*
`;
 }

 function copyToClipboard() {
  const markdown = generateMarkdown();
  navigator.clipboard.writeText(markdown).then(() => {
   toast.success("Summary copied to clipboard!", {
    style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
   });
  });
 }

 function downloadMarkdown() {
  const markdown = generateMarkdown();
  const blob = new Blob([markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${$stockTicker}-insider-summary.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  toast.success("Summary downloaded!", {
   style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
  });
 }

 async function generateSummary() {
  if (summaryGenerated && !summaryError) {
   showSummary = !showSummary;
   return;
  }

  // Check localStorage cache first (free, no credits)
  const cached = getCachedSummary($stockTicker);
  if (cached) {
   summaryData = cached;
   summaryGenerated = true;
   showSummary = true;
   return;
  }

  // Check if user is logged in
  if (!data?.user) {
   toast.error("Please log in to use this feature.", {
    style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
   });
   return;
  }

  // Check if user has the right tier
  if (!["Plus", "Pro"]?.includes(data?.user?.tier)) {
   toast.error(
    "This feature is available exclusively for Subscribers. Please upgrade your plan.",
    {
     style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
    },
   );
   return;
  }

  // Check if user has enough credits
  if (data?.user?.credits < SUMMARY_CREDIT_COST) {
   toast.error(
    `Insufficient credits. Your current balance is ${data?.user?.credits}. This feature costs ${SUMMARY_CREDIT_COST} credits.`,
    {
     style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
    },
   );
   return;
  }

  isGeneratingSummary = true;
  showSummary = true;
  summaryError = false;

  try {
   const response = await fetch("/api/insider-summary", {
    method: "POST",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify({
     ticker: $stockTicker,
     insiderData: originalData,
    }),
   });

   if (!response.ok) {
    const errorData = await response.json();
    toast.error(errorData?.error || "Failed to generate summary", {
     style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
    });
    showSummary = false;
    isGeneratingSummary = false;
    return;
   }

   summaryData = await response.json();

   if (summaryData?.error) {
    summaryError = true;
    toast.error(summaryData.error, {
     style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
    });
    showSummary = false;
   } else {
    // Save to localStorage cache
    saveSummaryToCache($stockTicker, summaryData);
    // Deduct credits on successful generation
    data.user.credits -= SUMMARY_CREDIT_COST;
    summaryGenerated = true;
   }
  } catch (e) {
   console.error("Summary generation error:", e);
   toast.error("Something went wrong. Please try again.", {
    style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
   });
   showSummary = false;
   summaryError = true;
  } finally {
   isGeneratingSummary = false;
  }
 }

 // Helper function for sentiment colors
 function getSentimentColors(sentiment: string) {
  switch (sentiment?.toLowerCase()) {
   case "bullish":
    return {
     text: "text-emerald-700 dark:text-emerald-300",
     bg: "bg-emerald-50/60 dark:bg-emerald-500/10",
     bar: "bg-emerald-500/70 dark:bg-emerald-400",
    };
   case "bearish":
    return {
     text: "text-rose-700 dark:text-rose-300",
     bg: "bg-rose-50/60 dark:bg-rose-500/10",
     bar: "bg-rose-500/70 dark:bg-rose-400",
    };
   default:
    return {
     text: "text-amber-700 dark:text-amber-300",
     bg: "bg-amber-50/60 dark:bg-amber-500/10",
     bar: "bg-amber-500/70 dark:bg-amber-400",
    };
  }
 }

 $: sentimentColors = getSentimentColors(summaryData?.sentiment ?? "Neutral");

 let originalData = data?.getInsiderTrading;
 let rawData = originalData;
 let filterList = [];
 let checkedItems = new Set();
 let historicalData = data?.getHistoricalPrice || [];
 let chartConfig = null;
 let syncWorker: Worker | undefined;
 let searchWorker: Worker | undefined;
 let totalTransaction = (
  rawData?.filter((item) => item?.price > 0)?.length || 0
 )?.toLocaleString("en-US");

 let inputValue = "";
 let transactionList = [
  "P-Purchase",
  "A-Award",
  "D-Return",
  "G-Gift",
  "S-Sale",
  "M-Exempt",
  "X-InTheMoney",
  "C-Conversion",
  "F-InKind",
  "J-Other",
 ];

 let displayList = rawData?.slice(0, 50);

 // Pagination state
 let currentPage = 1;
 let rowsPerPage = 20;
 let rowsPerPageOptions = [20, 50, 100];
 let totalPages = 1;

 let pagePathName = $page?.url?.pathname;

 // Create chart configuration with insider trading markers
 function createChartConfig() {
  if (!historicalData?.length || !originalData?.length) return;

  // Find insider trading date range from ORIGINAL data (not filtered)
  // This ensures stock price always shows the full range
  const insiderDates =
   originalData
    ?.filter(
     (item) =>
      item?.price > 0 &&
      new Date(item.transactionDate).getFullYear() >= 2015,
    )
    ?.map((item) =>
     Date.UTC(
      new Date(item.transactionDate).getUTCFullYear(),
      new Date(item.transactionDate).getUTCMonth(),
      new Date(item.transactionDate).getUTCDate(),
     ),
    ) || [];

  if (!insiderDates.length) return;

  const minInsiderDate = Math.min(...insiderDates);
  const maxInsiderDate = Math.max(...insiderDates);

  // Filter historical data to only include dates within insider trading range
  const filteredHistoricalData = historicalData?.filter((item) => {
   const itemDate = Date.UTC(
    new Date(item.time).getUTCFullYear(),
    new Date(item.time).getUTCMonth(),
    new Date(item.time).getUTCDate(),
   );
   return itemDate >= minInsiderDate && itemDate <= maxInsiderDate;
  });

  // Convert filtered historical data to series format
  const priceData = filteredHistoricalData?.map((item) => [
   Date.UTC(
    new Date(item.time).getUTCFullYear(),
    new Date(item.time).getUTCMonth(),
    new Date(item.time).getUTCDate(),
   ),
   item.close,
  ]);

  if (!priceData?.length) return;

  // Find min/max values for chart scaling
  const prices = priceData.map((item) => item[1]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = 0.05;
  const yMin = minPrice * (1 - padding);
  const yMax = maxPrice * (1 + padding);

  // Convert insider trading data to markers
  const purchaseMarkers = [];
  const saleMarkers = [];

  rawData
   ?.filter((item) => {
    return item?.price > 0;
   })
   ?.forEach((transaction) => {
    const transactionDate = new Date(transaction.transactionDate);
    const x = Date.UTC(
     transactionDate.getUTCFullYear(),
     transactionDate.getUTCMonth(),
     transactionDate.getUTCDate(),
    );

    // Find corresponding price point
    const pricePoint = priceData.find(
     (p) => Math.abs(p[0] - x) < 7 * 24 * 60 * 60 * 1000, // Within 7 days
    );

    const y = pricePoint ? pricePoint[1] : transaction.price;
    const value = transaction.securitiesTransacted * transaction.price;

    const marker = {
     x,
     y,
     z: Math.max(value / 1000, 5), // Size based on transaction value, minimum size 5
     name: transaction.name,
     shares: transaction.securitiesTransacted,
     price: transaction.price,
     value: value,
     date: transaction.transactionDate,
    };

    // Check transaction type more comprehensively
    const transType = transaction.transactionType?.toUpperCase();

    if (
     transType === "P" ||
     transType === "P-PURCHASE" ||
     transType?.startsWith("P-") ||
     transType?.includes("PURCHASE")
    ) {
     purchaseMarkers.push(marker);
    } else if (
     transType === "S" ||
     transType === "S-SALE" ||
     transType?.startsWith("S-") ||
     transType?.includes("SALE")
    ) {
     saleMarkers.push(marker);
    }
   });

  const options = {
   chart: {
    backgroundColor: $mode === "light" ? "#fff" : "#09090B",
    animation: false,
    height: 400,
   },
   credits: { enabled: false },
   legend: {
    enabled: true,
    align: "center",
    verticalAlign: "top",
    layout: "horizontal",
    itemStyle: {
     color: $mode === "light" ? "black" : "white",
    },
   },
   title: {
    text: `<h3 class="mt-3 -mb-3 text-sm sm:text-lg">Insider Trading Activity</h3>`,
    useHTML: true,
    style: { color: $mode === "light" ? "black" : "white" },
   },
   xAxis: {
    type: "datetime",
    min: minInsiderDate,
    max: maxInsiderDate,
    crosshair: {
     color: $mode === "light" ? "black" : "white",
     width: 1,
     dashStyle: "Solid",
    },
    labels: {
     style: { color: $mode === "light" ? "#545454" : "white" },
     formatter: function () {
      const date = new Date(this.value);
      return `<span class="text-xs">${date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>`;
     },
    },
   },
   yAxis: {
    title: {
     text: $screenWidth < 640 ? null : "Stock Price ($)",
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
    min: yMin,
    max: yMax,
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
     color: $mode === "light" ? "black" : "white",
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
      const isPurchase = this.series.name.includes("Purchase");
      return `
       <span class="text-white text-sm font-normal">${formattedDate}</span><br>
       <span class="text-white text-sm font-[501]">${this.series.name}</span><br>
       <span class="text-white text-sm">Insider: ${this.point.name}</span><br>
       <span class="text-white text-sm">Price: $${this.point.price?.toFixed(2)}</span><br>
       <span class="text-white text-sm">Shares: ${this.point.shares?.toLocaleString("en-US")}</span><br>
       <span class="text-white text-sm">Value: $${this.point.value?.toLocaleString("en-US")}</span>
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
     lineWidth: 2,
     shadow-none: false,
    },
    bubble: {
     minSize: 8,
     maxSize: 30,
     opacity: 0.8,
     marker: {
      enabled: true,
      fillOpacity: 0.8,
      lineWidth: 2,
     },
     dataLabels: {
      enabled: false,
     },
     sizeBy: "z",
    },
   },
   series: [
    {
     name: "Stock Price",
     type: "spline",
     data: priceData,
     color: $mode === "light" ? "#000" : "#fff",
     lineWidth: 2,
     animation: false,
     zIndex: 1,
    },
    {
     name: "Insider Purchases",
     type: "bubble",
     data: purchaseMarkers,
     color: "#22c55e", // Green for purchases
     marker: {
      lineColor: "#16a34a",
     },
     animation: false,
     zIndex: 3,
     showInLegend: purchaseMarkers.length > 0,
    },
    {
     name: "Insider Sales",
     type: "bubble",
     data: saleMarkers,
     color: "#ef4444", // Red for sales
     marker: {
      lineColor: "#dc2626",
     },
     animation: false,
     zIndex: 3,
     showInLegend: saleMarkers.length > 0,
    },
   ],
  };

  chartConfig = options;
 }

 // Pagination functions
 function updatePaginatedData() {
  // Filter data to only include items with price > 0 before pagination
  const dataSource = inputValue?.length > 0 ? rawData : originalData;
  const filteredData = dataSource?.filter((item) => item?.price > 0) || [];

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  displayList = filteredData?.slice(startIndex, endIndex) || [];
  totalPages = Math.ceil((filteredData?.length || 0) / rowsPerPage);
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
   rowsPerPage = 20; // Default value
   return;
  }

  try {
   const paginationKey = `${currentPath}_rowsPerPage`;
   const savedRows = localStorage.getItem(paginationKey);

   if (savedRows && rowsPerPageOptions.includes(Number(savedRows))) {
    rowsPerPage = Number(savedRows);
   } else {
    rowsPerPage = 20; // Default if invalid or not found
   }
  } catch (e) {
   console.warn("Failed to load rows per page preference:", e);
   rowsPerPage = 20; // Default on error
  }
 }

 function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
 }

 async function resetTableSearch() {
  inputValue = "";
  rawData = originalData;
  currentPage = 1; // Reset to first page
  updatePaginatedData();
 }

 async function search() {
  inputValue = inputValue?.toLowerCase();

  setTimeout(async () => {
   if (inputValue?.length > 0) {
    await loadSearchWorker();
   } else {
    // Reset to original data if filter is empty
    rawData = originalData;
    currentPage = 1; // Reset to first page
    updatePaginatedData();
   }
  }, 100);
 }

 const loadSearchWorker = async () => {
  if (searchWorker && originalData?.length > 0) {
   searchWorker.postMessage({
    rawData: originalData,
    inputValue: inputValue,
   });
  }
 };

 const handleSearchMessage = (event) => {
  if (event.data?.message === "success") {
   rawData = event.data?.output ?? [];
   currentPage = 1; // Reset to first page after search
   updatePaginatedData();
  }
 };

 async function handleChangeValue(value) {
  if (checkedItems.has(value)) {
   checkedItems.delete(value);
  } else {
   checkedItems.add(value);
  }
  const filterSet = new Set(filterList);
  filterSet.has(value) ? filterSet.delete(value) : filterSet.add(value);
  filterList = Array.from(filterSet);

  if (filterList.length > 0) {
   await loadWorker();
  } else {
   rawData = [...originalData];
   currentPage = 1; // Reset to first page
   updatePaginatedData();
  }

  transactionList = [...transactionList];
 }

 // Handle messages from our filtering web worker.
 const handleMessage = (event) => {
  rawData = event.data?.output || [];
  currentPage = 1; // Reset to first page after filtering
  updatePaginatedData();
 };

 // Tell the web worker to filter our data
 const loadWorker = async () => {
  syncWorker?.postMessage({
   rawData: originalData,
   filterList: filterList,
  });
 };

 function extractOfficeInfo(inputString) {
  const indexOfficer = inputString?.toLowerCase()?.indexOf("officer:");
  const indexOther = inputString?.toLowerCase()?.indexOf("other:");
  if (indexOfficer !== -1) {
   return inputString?.substring(indexOfficer + "officer:"?.length)?.trim();
  } else if (indexOther !== -1) {
   return inputString?.substring(indexOther + "other:"?.length)?.trim();
  } else if (inputString?.toLowerCase()?.includes("director")) {
   return "Director";
  } else if (inputString?.toLowerCase()?.includes("percent owner")) {
   return inputString?.replace("percent owner", "% Owner");
  } else {
   return "n/a";
  }
 }

 onMount(async () => {
  // Check if there's a cached summary
  const cachedSummary = getCachedSummary($stockTicker);
  if (cachedSummary) {
   summaryData = cachedSummary;
   summaryGenerated = true;
  }

  // Load pagination preference
  loadRowsPerPage();

  // Initialize pagination
  updatePaginatedData();

  if (!syncWorker) {
   const SyncWorker = await import("./workers/filterWorker?worker");
   syncWorker = new SyncWorker.default();
   syncWorker.onmessage = handleMessage;
  }

  if (!searchWorker) {
   const SearchWorker = await import(
    "$lib/workers/tableSearchWorker?worker"
   );
   searchWorker = new SearchWorker.default();
   searchWorker.onmessage = handleSearchMessage;
  }
 });

 // Reactive statements for chart updates
 $: if (($mode && historicalData?.length) || rawData) {
  createChartConfig();
 }

 // Update pagination when originalData or rawData changes
 $: if (
  (originalData && originalData.length > 0) ||
  (rawData && inputValue?.length > 0)
 ) {
  updatePaginatedData();
 }

 // Reactive statement to load pagination settings when page changes
 $: if ($page?.url?.pathname && $page?.url?.pathname !== pagePathName) {
  pagePathName = $page?.url?.pathname;
  loadRowsPerPage(); // Load pagination preference for new page
  updatePaginatedData(); // Update display with loaded preference
 }

 let columns = [
  { key: "name", label: "Name", align: "left" },
  { key: "transactionDate", label: "Transaction Date", align: "right" },
  { key: "securitiesTransacted", label: "Shares", align: "right" },
  { key: "price", label: "Price", align: "right" },
  { key: "value", label: "Value", align: "right" },
  { key: "transactionType", label: "Type", align: "right" },
 ];

 let sortOrders = {
  name: { order: "none", type: "string" },
  transactionDate: { order: "none", type: "date" },
  securitiesTransacted: { order: "none", type: "number" },
  price: { order: "none", type: "number" },
  value: { order: "none", type: "number" },
  transactionType: { order: "none", type: "string" },
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
   if (inputValue?.length > 0) {
    // If filtering, don't change rawData
    updatePaginatedData();
   } else {
    originalData = [...data?.getInsiderTrading]; // Reset originalData
    rawData = originalData;
    currentPage = 1; // Reset to first page
    updatePaginatedData(); // Reset displayed data
   }
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
  if (inputValue?.length > 0) {
   // If filtering, sort the filtered data
   rawData = [...rawData].sort(compareValues);
  } else {
   // If not filtering, sort the original data
   originalData = [...originalData].sort(compareValues);
   rawData = originalData;
  }

  currentPage = 1; // Reset to first page when sorting
  updatePaginatedData();
 };

 function isChecked(item) {
  return checkedItems.has(item);
 }
</script>

<SEO
 title={`${$displayCompanyName} (${$stockTicker}) Insider Trading Analysis - Executive Transactions & SEC Filings Tracker`}
 description={`Professional insider trading analysis for ${$displayCompanyName} (${$stockTicker}) with real-time SEC filings, executive transactions, and institutional insider activity. Track ${$stockTicker} insider sentiment through purchase/sale patterns, insider ownership changes, and key executive trading behavior. Essential intelligence for understanding management confidence and insider positioning.`}
 keywords={`${$stockTicker} insider trading, ${$displayCompanyName} insider transactions, SEC filings, executive trades, insider ownership, management trading, ${$stockTicker} insider activity, insider sentiment, executive stock sales, insider purchases, Form 4 filings, insider analysis`}
 structuredData={{
  "@context": "https://schema.org",
  "@type": ["FinancialProduct", "WebPage", "AnalysisNewsArticle"],
  name: `${$displayCompanyName} (${$stockTicker}) Insider Trading Analysis`,
  headline: `${$displayCompanyName} Insider Trading Intelligence - Executive Transactions & SEC Filing Analysis`,
  description: `Comprehensive insider trading analysis for ${$displayCompanyName} (${$stockTicker}) including executive transactions, SEC filings, and insider sentiment tracking`,
  url: `https://stocknear.com/stocks/${$stockTicker}/insider`,

  author: {
   "@type": "Organization",
   name: "Stocknear",
   url: "https://stocknear.com",
  },
  publisher: {
   "@type": "Organization",
   name: "Stocknear",
   url: "https://stocknear.com",
   logo: {
    "@type": "ImageObject",
    url: "https://stocknear.com/favicon.png",
   },
  },
  dateModified: new Date().toISOString(),
  datePublished: new Date().toISOString(),
  mainEntity: {
   "@type": "Corporation",
   name: $displayCompanyName,
   tickerSymbol: $stockTicker,
  },
  about: {
   "@type": "Thing",
   name: "Insider Trading Analysis",
   description:
    "Analysis of corporate insider trading activity, SEC filings, and executive transaction patterns",
  },
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
     name: "Stocks",
     item: "https://stocknear.com/stocks",
    },
    {
     "@type": "ListItem",
     position: 3,
     name: `${$displayCompanyName} (${$stockTicker})`,
     item: `https://stocknear.com/stocks/${$stockTicker}`,
    },
    {
     "@type": "ListItem",
     position: 4,
     name: "Insider Trading",
     item: `https://stocknear.com/stocks/${$stockTicker}/insider`,
    },
   ],
  },
 }}
/>

<section class="w-full overflow-hidden h-full">
 <div class="w-full flex h-full overflow-hidden">
  <div
   class="w-full relative flex justify-center items-center overflow-hidden"
  >
   <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto mt-2 sm:mt-0">
    <div class="w-full flex flex-row justify-between mb-5">
     <h1 class="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
      {$stockTicker} Insider Trading
     </h1>
    </div>

    <p class="mt-4 text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
     We track
     <strong>{totalTransaction}</strong> insider transactions spanning
     <strong
      >{rawData
       ?.filter((item) => item?.transactionType?.includes("P"))
       ?.length?.toLocaleString("en-US")}</strong
     >
     purchases and
     <strong
      >{rawData
       ?.filter((item) => item?.transactionType?.includes("S"))
       ?.length?.toLocaleString("en-US")}</strong
     >
     sales, with a total transaction value of
     <strong
      >${abbreviateNumber(
       rawData?.reduce((sum, item) => sum + (item?.value || 0), 0),
      )}</strong
     >. Recent activity shows
     <strong
      >{rawData?.filter(
       (item) =>
        new Date(item?.transactionDate) >
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      )?.length || 0}</strong
     >
     transactions in the last 90 days, indicating
     <strong
      >{rawData?.filter(
       (item) =>
        new Date(item?.transactionDate) >
         new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) &&
        item?.transactionType?.includes("P"),
      )?.length >
      rawData?.filter(
       (item) =>
        new Date(item?.transactionDate) >
         new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) &&
        item?.transactionType?.includes("S"),
      )?.length
       ? "bullish insider accumulation"
       : "insider distribution"}</strong
     >
     among company executives and key stakeholders.
    </p>

    <div
     class="w-full flex flex-row justify-end items-center gap-2 pb-2 pt-3"
    >
     <!-- AI Summarize Button -->

     <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild let:builder>
       <Button
        builders={[builder]}
        class="w-auto transition-all duration-150 border border-gray-200/70 dark:border-zinc-800/80 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
       >
        <span class="truncate">Filter Type</span>
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
       class="w-56 h-fit max-h-72 overflow-y-auto scroller rounded-xl border border-gray-200/70 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
      >
       <DropdownMenu.Group>
        {#each transactionList as item}
         <DropdownMenu.Item
          class="text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400"
         >
          <div
           on:click|capture={(event) => event.preventDefault()}
           class="flex items-center"
          >
           <label
            class="cursor-pointer"
            on:click={() => handleChangeValue(item)}
            for={item}
           >
            <input type="checkbox" checked={isChecked(item)} />
            <span class="ml-2">{item}</span>
           </label>
          </div>
         </DropdownMenu.Item>
        {/each}
       </DropdownMenu.Group>
      </DropdownMenu.Content>
     </DropdownMenu.Root>

     <button
      on:click={generateSummary}
      disabled={isGeneratingSummary || originalData?.length === 0}
      class="cursor-pointer flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full border border-gray-200/70 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 transition hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50 disabled:opacity-60"
     >
      {#if isGeneratingSummary}
       <span class="loading loading-spinner loading-xs"></span>
      {:else}
       <svg
        class="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
       >
        <path
         stroke-linecap="round"
         stroke-linejoin="round"
         stroke-width="2"
         d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
       </svg>
      {/if}
      {summaryGenerated
       ? showSummary
        ? "Hide Summary"
        : "Show Summary"
       : "AI Summarize"}
     </button>
    </div>

    <!-- AI Summary Panel -->
    {#if showSummary}
     <div
      class="border border-gray-200/70 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-6 mb-4 bg-white/70 dark:bg-zinc-950/40 text-gray-700 dark:text-zinc-200"
     >
      {#if isGeneratingSummary}
       <!-- Loading State -->
       <div class="flex flex-col items-center justify-center py-8">
        <div class="relative">
         <div
          class="w-12 h-12 border-4 border-gray-200/80 dark:border-zinc-800/80 rounded-full"
         ></div>
         <div
          class="w-12 h-12 border-4 border-gray-900/80 border-t-transparent dark:border-white/80 rounded-full animate-spin absolute top-0 left-0"
         ></div>
        </div>
        <p
         class="mt-4 text-sm text-gray-700 dark:text-zinc-200 font-medium"
        >
         Analyzing insider trading data with AI...
        </p>
        <p class="mt-1 text-xs text-gray-500 dark:text-zinc-400">
         Extracting key patterns and sentiment
        </p>
       </div>
      {:else}
       <!-- Summary Content -->
       <div class="space-y-6">
        <!-- Header with Sentiment -->
        <div
         class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
         <div class="flex items-center gap-2">
          <svg
           class="w-5 h-5 text-gray-600 dark:text-zinc-300"
           fill="none"
           stroke="currentColor"
           viewBox="0 0 24 24"
          >
           <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
           />
          </svg>
          <h3
           class="text-lg font-semibold text-gray-900 dark:text-white"
          >
           AI-Generated Summary
          </h3>
         </div>
         <div class="flex items-center gap-3">
          <span class="text-sm text-gray-600 dark:text-zinc-400"
           >Insider Sentiment:</span
          >
          <div class="flex items-center gap-2">
           <span
            class="px-2.5 py-1 text-sm font-semibold {sentimentColors.text} {sentimentColors.bg} rounded-full"
           >
            {summaryData?.sentiment ?? "Neutral"}
           </span>
           <div class="flex items-center gap-1">
            <div
            class="w-16 h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden"
            >
             <div
              class="h-full {sentimentColors.bar} rounded-full"
              style="width: {summaryData?.sentimentScore ?? 50}%"
             ></div>
            </div>
            <span class="text-xs text-gray-500 dark:text-zinc-400"
             >{summaryData?.sentimentScore ?? 50}%</span
            >
           </div>
          </div>
         </div>
        </div>

        <!-- Export Actions -->
        <div
        class="flex flex-wrap items-center justify-end gap-2 pb-4 border-b border-gray-200/70 dark:border-zinc-800/80"
        >
         <div class="flex items-center gap-2">
          <button
           on:click={copyToClipboard}
          class="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-zinc-200 bg-white/80 dark:bg-zinc-950/60 border border-gray-200/70 dark:border-zinc-800/80 rounded-full transition hover:text-violet-600 dark:hover:text-violet-400"
          >
           <svg
            class="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
           >
            <path
             stroke-linecap="round"
             stroke-linejoin="round"
             stroke-width="2"
             d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
           </svg>
           Copy
          </button>
          <button
           on:click={downloadMarkdown}
          class="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-zinc-200 bg-white/80 dark:bg-zinc-950/60 border border-gray-200/70 dark:border-zinc-800/80 rounded-full transition hover:text-violet-600 dark:hover:text-violet-400"
          >
           <svg
            class="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
           >
            <path
             stroke-linecap="round"
             stroke-linejoin="round"
             stroke-width="2"
             d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
           </svg>
           Download
          </button>
         </div>
        </div>

        <!-- Key Highlights -->
        <div>
         <h4
          class="text-sm font-semibold text-gray-700 dark:text-zinc-200 mb-3 flex items-center gap-2"
         >
          <svg
           class="w-4 h-4 text-gray-400 dark:text-zinc-500"
           fill="currentColor"
           viewBox="0 0 20 20"
          >
           <path
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
           />
          </svg>
          Key Highlights
         </h4>
         <ul class="space-y-2">
          {#each summaryData?.keyHighlights ?? [] as highlight}
           <li
            class="flex items-start gap-2 text-sm text-gray-700 dark:text-zinc-200"
           >
            <svg
             class="w-4 h-4 text-gray-400 dark:text-zinc-500 mt-0.5 flex-shrink-0"
             fill="currentColor"
             viewBox="0 0 20 20"
            >
             <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
             />
            </svg>
            {highlight}
           </li>
          {/each}
         </ul>
        </div>

        <!-- Risks Section -->
        <div>
         <h4
          class="text-sm font-semibold text-gray-700 dark:text-zinc-200 mb-3 flex items-center gap-2"
         >
          <svg
           class="w-4 h-4 text-gray-400 dark:text-zinc-500"
           fill="none"
           stroke="currentColor"
           viewBox="0 0 24 24"
          >
           <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
           />
          </svg>
          Risk Signals
         </h4>
         <ul class="space-y-2">
          {#each summaryData?.risks ?? [] as risk}
           <li
            class="flex items-start gap-2 text-sm text-gray-700 dark:text-zinc-200"
           >
            <svg
             class="w-4 h-4 text-gray-400 dark:text-zinc-500 mt-0.5 flex-shrink-0"
             fill="currentColor"
             viewBox="0 0 20 20"
            >
             <path
              fill-rule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
             />
            </svg>
            {risk}
           </li>
          {/each}
         </ul>
        </div>

        <!-- Outlook -->
        <div>
         <h4
          class="text-sm font-semibold text-gray-700 dark:text-zinc-200 mb-3 flex items-center gap-2"
         >
          <svg
          class="w-4 h-4 text-gray-400 dark:text-zinc-500"
           fill="none"
           stroke="currentColor"
           viewBox="0 0 24 24"
          >
           <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
           />
           <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
           />
          </svg>
          Insider Activity Outlook
         </h4>
         <p
          class="text-sm text-gray-700 dark:text-zinc-200 bg-white/80 dark:bg-zinc-950/60 rounded-2xl p-4 border border-gray-200/70 dark:border-zinc-800/80"
         >
          {summaryData?.outlook ?? "No outlook available."}
         </p>
        </div>

        <!-- Disclaimer -->
        <p
        class="text-xs text-gray-500 dark:text-zinc-400 italic border-t border-gray-200/70 dark:border-zinc-800/80 pt-4"
        >
         This summary was generated by AI based on insider trading
         data. It should not be considered investment advice. Please
         conduct your own research.
        </p>
       </div>
      {/if}
     </div>
    {/if}

    <!-- Chart Section -->
    {#if chartConfig}
     <div
      class=" border border-gray-200/70 dark:border-zinc-800/80 rounded-2xl bg-white/70 dark:bg-zinc-950/40 mb-4"
      use:highcharts={chartConfig}
     ></div>
    {/if}

    <div class="mt-4">
     <div
      class="rounded-2xl border border-gray-200/70 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/40 px-4 py-3 sm:px-5 sm:py-4"
     >
      <div
       class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
      >
       <div class="flex flex-col">
        <span
         class="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400"
         >Transactions</span
        >
        <h2
         class="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white"
        >
         {totalTransaction} Transactions
        </h2>
       </div>
       <div
        class="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end lg:w-auto"
       >
        <div class="relative w-full sm:w-56">
        <div
         class="inline-block cursor-pointer absolute right-2 top-2 text-sm"
        >
         {#if inputValue?.length > 0}
          <label
           class="cursor-pointer"
           on:click={() => resetTableSearch()}
          >
           <svg
            class="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            ><path
             fill="currentColor"
             d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
            /></svg
           >
          </label>
         {/if}
        </div>

        <input
         bind:value={inputValue}
         on:input={search}
         type="text"
         placeholder="Find..."
         class="w-full rounded-full border border-gray-300/80 bg-white/80 px-3 py-2 text-[0.85rem] text-gray-700 shadow-none placeholder:text-gray-500 focus:outline-none focus:ring-0 focus:border-gray-400/90 dark:border-zinc-700/80 dark:bg-zinc-950/60 dark:text-zinc-200 dark:placeholder:text-zinc-400 dark:focus:border-zinc-500/90"
        />
       </div>

        <div class="sm:ml-2">
         <DownloadData
          {data}
          rawData={originalData}
          title={`${$stockTicker}_insider_trading`}
         />
        </div>
       </div>
      </div>
     </div>
    </div>
    </div>

    {#if displayList?.length > 0}
     <div class="mt-3 w-full m-auto mb-4 overflow-x-auto">
      <div class="w-full overflow-hidden rounded-2xl border border-gray-200/70 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/40">
       <table
        class="table table-sm table-compact w-full text-gray-700 dark:text-zinc-200 tabular-nums m-auto"
       >
       <thead class="insider-table-driver">
        <TableHeader {columns} {sortOrders} {sortData} />
       </thead>
       <tbody>
        {#each displayList as item}
         <tr
          class="transition-colors"
         >
          <td class="text-sm whitespace-nowrap">
           <div class="flex flex-col">
            <span class="">{item?.name}</span>
            <span class="text-xs text-gray-500 dark:text-zinc-400"
             >{extractOfficeInfo(item?.typeOfOwner)}</span
            >
           </div>
          </td>

          <td class="text-end text-sm whitespace-nowrap">
           {new Date(item?.transactionDate)?.toLocaleString(
            "en-US",
            {
             month: "short",
             day: "numeric",
             year: "numeric",
             daySuffix: "2-digit",
             timeZone: "UTC",
            },
           )}
          </td>

          <td
           class="text-end text-sm whitespace-nowrap"
          >
           {item?.securitiesTransacted?.toLocaleString("en-US")}
          </td>
          <td
           class="text-end text-sm whitespace-nowrap"
          >
           ${item?.price?.toFixed(2)}
          </td>
          <td
           class="text-end text-sm whitespace-nowrap"
          >
           ${item?.value?.toLocaleString("en-US")}
          </td>
          <td
           class="text-end text-sm whitespace-nowrap"
          >
           {item?.transactionType}
          </td>
         </tr>
        {/each}
       </tbody>
       </table>
      </div>
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
         class="w-fit sm:w-auto transition-all duration-150 border border-gray-200/70 dark:border-zinc-800/80 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
        <span class="text-sm text-gray-600 dark:text-zinc-300">
         Page {currentPage} of {totalPages}
        </span>

        <DropdownMenu.Root>
         <DropdownMenu.Trigger asChild let:builder>
          <Button
           builders={[builder]}
           class="w-fit sm:w-auto transition-all duration-150 border border-gray-200/70 dark:border-zinc-800/80 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
          <!-- Dropdown items -->
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

       <!-- Next button -->
       <div class="flex items-center gap-2">
        <Button
         on:click={() => goToPage(currentPage + 1)}
         disabled={currentPage === totalPages}
         class="w-fit sm:w-auto transition-all duration-150 border border-gray-200/70 dark:border-zinc-800/80 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
        class="cursor-pointer text-sm font-medium text-gray-600 dark:text-zinc-400 transition hover:text-violet-600 dark:hover:text-violet-400"
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
    {:else if displayList?.length === 0 && inputValue?.length > 0}
     <div class="w-full flex items-center justify-start text-start">
      <Infobox text={`No results found for "${inputValue}" `} />
     </div>
    {:else if displayList?.length === 0 && filterList?.length > 0}
     <Infobox
      text={`No Transaction Type found for ${removeCompanyStrings($displayCompanyName)}. Try a different filter...`}
     />
    {:else}
     <Infobox
      text={`No trading history available for ${$displayCompanyName}. Likely no
       insider trading has happened yet.`}
     />
    {/if}
   </div>
  </div>
 </div>
</section>

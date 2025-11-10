<script lang="ts">
  import { displayCompanyName, stockTicker, screenWidth } from "$lib/store";
  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";
  import { page } from "$app/stores";

  import { onMount } from "svelte";

  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";

  export let data;

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
        text: `<h3 class="mt-3 -mb-3 text-[1rem] sm:text-lg">Insider Trading Activity</h3>`,
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
          shadow: false,
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
          <h1 class="text-xl sm:text-2xl font-bold">
            {$stockTicker} Insider Trading
          </h1>
        </div>

        <p class="mt-4">
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

        <div class="w-full flex flex-row justify-end items-center pb-2 pt-3">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild let:builder>
              <Button
                builders={[builder]}
                class="filter-type-driver border-gray-300 dark:border-gray-600 border border-gray-300  text-white bg-default sm:hover:bg-black dark:sm:hover:bg-primary ease-out  px-3 py-2  rounded "
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
              class="w-56 h-fit max-h-72 overflow-y-auto scroller"
            >
              <DropdownMenu.Group>
                {#each transactionList as item}
                  <DropdownMenu.Item
                    class="sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
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
        </div>

        <!-- Chart Section -->
        {#if chartConfig}
          <div
            class=" border border-gray-300 dark:border-gray-800 rounded mb-4"
            use:highcharts={chartConfig}
          ></div>
        {/if}

        <div class="items-center lg:overflow-visible px-1 py-1 mt-4">
          <div
            class="col-span-2 flex flex-col lg:flex-row items-start sm:items-center lg:order-2 lg:grow py-1 border-t border-b border-gray-300 dark:border-gray-800"
          >
            <h2
              class="text-start whitespace-nowrap text-xl sm:text-2xl font-semibold py-1 border-b border-gray-300 dark:border-gray-800 lg:border-none w-full"
            >
              {totalTransaction} Transactions
            </h2>
            <div
              class="mt-1 w-full flex flex-row lg:flex order-1 items-center ml-auto pb-1 pt-1 sm:pt-0 w-full order-0 lg:order-1"
            >
              <div class="relative lg:ml-auto w-full lg:w-fit">
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
                  class=" py-[7px] text-[0.85rem] sm:text-sm border bg-white dark:bg-default shadow focus:outline-hidden border border-gray-300 dark:border-gray-600 rounded placeholder:text-gray-800 dark:placeholder:text-gray-300 px-3 focus:outline-none focus:ring-0 dark:focus:border-gray-800 grow w-full sm:min-w-56 lg:max-w-14"
                />
              </div>

              <div class="ml-2">
                <DownloadData
                  {data}
                  rawData={originalData}
                  title={`${$stockTicker}_insider_trading`}
                />
              </div>
            </div>
          </div>
        </div>

        {#if displayList?.length > 0}
          <div
            class="mt-3 flex justify-start items-center w-full m-auto rounded-none sm:rounded mb-4 overflow-x-auto"
          >
            <table
              class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
            >
              <thead class="insider-table-driver">
                <TableHeader {columns} {sortOrders} {sortData} />
              </thead>
              <tbody>
                {#each displayList as item}
                  <tr
                    class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
                  >
                    <td class=" text-sm sm:text-[1rem] ] whitespace-nowrap">
                      <div class="flex flex-col">
                        <span class="">{item?.name}</span>
                        <span class="text-sm"
                          >{extractOfficeInfo(item?.typeOfOwner)}</span
                        >
                      </div>
                    </td>

                    <td
                      class="text-end text-sm sm:text-[1rem] whitespace-nowrap ]"
                    >
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
                      class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
                    >
                      {item?.securitiesTransacted?.toLocaleString("en-US")}
                    </td>
                    <td
                      class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
                    >
                      ${item?.price?.toFixed(2)}
                    </td>
                    <td
                      class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
                    >
                      ${item?.value?.toLocaleString("en-US")}
                    </td>
                    <td
                      class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
                    >
                      {item?.transactionType}
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

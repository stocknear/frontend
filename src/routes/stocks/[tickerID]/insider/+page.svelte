<script lang="ts">
  import { displayCompanyName, stockTicker, screenWidth } from "$lib/store";
  import {
    formatString,
    abbreviateNumber,
    removeCompanyStrings,
  } from "$lib/utils";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import Tutorial from "$lib/components/Tutorial.svelte";
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";

  import { onMount } from "svelte";

  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";

  export let data;

  let rawData = data?.getInsiderTrading;
  let filterList = [];
  let checkedItems = new Set();
  let historicalData = data?.getHistoricalPrice || [];
  let chartConfig = null;
  let syncWorker: Worker | undefined;
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

  // Create chart configuration with insider trading markers
  function createChartConfig() {
    if (!historicalData?.length || !rawData?.length) return;

    // Find insider trading date range first
    const insiderDates =
      rawData
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
          name: transaction.reportingName,
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
        backgroundColor: "rgba(0, 0, 0, 0.8)",
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
      rawData = [...data?.getInsiderTrading];

      displayList = rawData?.slice(0, 50) ?? [];
    }

    transactionList = [...transactionList];
  }

  // Handle messages from our filtering web worker.
  const handleMessage = (event) => {
    rawData = event.data?.output || [];
    if (filterList?.length > 0) {
      displayList = rawData?.slice(0, 50) || [];
    } else {
      rawData = data?.getInsiderTrading;
      displayList = rawData?.slice(0, 50) || [];
    }
  };

  // Tell the web worker to filter our data
  const loadWorker = async () => {
    syncWorker?.postMessage({
      rawData: data?.getInsiderTrading,
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

  async function handleScroll() {
    const scrollThreshold = document.body.offsetHeight * 0.8; // 80% of the website height
    const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;
    if (isBottom && displayList?.length !== rawData?.length) {
      const nextIndex = displayList?.length;
      const filteredNewResults = rawData?.slice(nextIndex, nextIndex + 50);
      displayList = [...displayList, ...filteredNewResults];
    }
  }

  onMount(async () => {
    if (!syncWorker) {
      const SyncWorker = await import("./workers/filterWorker?worker");
      syncWorker = new SyncWorker.default();
      syncWorker.onmessage = handleMessage;
    }

    // Create chart configuration with server data
    createChartConfig();

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  });

  // Reactive statements for chart updates
  $: if ($mode && historicalData?.length) {
    createChartConfig();
  }

  let columns = [
    { key: "reportingName", label: "Name", align: "left" },
    { key: "transactionDate", label: "Transaction Date", align: "right" },
    { key: "securitiesTransacted", label: "Shares", align: "right" },
    { key: "price", label: "Price", align: "right" },
    { key: "value", label: "Value", align: "right" },
    { key: "transactionType", label: "Type", align: "right" },
  ];

  let sortOrders = {
    reportingName: { order: "none", type: "string" },
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

    let originalData = rawData;

    const currentOrderIndex = orderCycle.indexOf(sortOrders[key].order);
    sortOrders[key].order =
      orderCycle[(currentOrderIndex + 1) % orderCycle.length];
    const sortOrder = sortOrders[key].order;

    // Reset to original data when 'none' and stop further sorting
    if (sortOrder === "none") {
      displayList = [...originalData]?.slice(0, 50); // Reset to original data (spread to avoid mutation)
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
    displayList = [...originalData].sort(compareValues)?.slice(0, 50);
  };

  function isChecked(item) {
    return checkedItems.has(item);
  }

  let steps = [
    {
      popover: {
        title: "Insider Trading",
        description: `This dashboard aggregates every insider stock transaction filed for ${$stockTicker}. Use these to spot insider buying or selling trends that may signal executive confidence (or concern) in the stock.`,
        side: "center",
        align: "center",
      },
    },
    {
      element: ".transactions-count-driver",
      popover: {
        title: "Total Transactions",
        description: `The total number of insider trades recorded. A high count can indicate active insider buying or selling over time.`,
        side: "bottom",
        align: "start",
      },
    },
    {
      element: ".filter-type-driver",
      popover: {
        title: "Filter Type",
        description: `Filter by transaction type (e.g. “S-Sale” for scheduled sales, “P-Purchase,” or “F-InKind”). Use this to hone in on buys versus sells or other special transactions.`,
        side: "left",
        align: "start",
      },
    },
    {
      element: ".insider-table-driver",
      popover: {
        title: "Transactions Table",
        description: `Lists each insider transaction with key details. Scroll or filter to quickly zero in on the trades you care about.`,
        side: "right",
        align: "start",
      },
    },

    {
      popover: {
        title: "You’re All Set!",
        description: `Now you know how to read this page and filter insider trades. Use this to monitor insider activity and be up-to-date with your trading decisions.`,
        side: "center",
        align: "center",
      },
    },
  ];
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
          <Tutorial {steps} />
        </div>

        <p class="mt-4">
          We track
          <strong>{rawData?.length?.toLocaleString("en-US")}</strong> insider
          transactions spanning
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
          class="w-full flex flex-row justify-between items-center pb-2 pt-3"
        >
          <h3 class="transactions-count-driver text-xl font-semibold">
            {(rawData?.length || 0)?.toLocaleString("en-US")} Transactions
          </h3>

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
                {#each displayList as item, index}
                  {#if item?.price > 0}
                    <tr
                      class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
                    >
                      <td class=" text-sm sm:text-[1rem] ] whitespace-nowrap">
                        <div class="flex flex-col">
                          <span class=""
                            >{formatString(item?.reportingName)?.replace(
                              "/de/",
                              "",
                            )}</span
                          >
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
                  {/if}
                {/each}
              </tbody>
            </table>
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

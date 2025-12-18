<script lang="ts">
  import { displayCompanyName } from "$lib/store";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";

  import highcharts from "$lib/highcharts.ts";
  import { page } from "$app/stores";
  import { mode } from "mode-watcher";
  import { onMount } from "svelte";

  export let data;
  export let rawData = [];

  function addChangesPercentage(data) {
    if (!data || data.length === 0) return data;

    // Sort in place for better memory efficiency
    const sorted = [...data].sort(
      (a, b) => new Date(b?.date) - new Date(a?.date),
    );

    // Process in place to avoid creating new objects
    for (let i = 0; i < sorted.length; i++) {
      if (i === sorted.length - 1) {
        sorted[i] = { ...sorted[i], changesPercentage: null };
      } else {
        const nextValue = sorted[i + 1]?.shortVolume;
        const pctChange =
          nextValue !== 0
            ? ((sorted[i].shortVolume - nextValue) / nextValue) * 100
            : 0;
        sorted[i] = {
          ...sorted[i],
          changesPercentage: Math.round(pctChange * 100) / 100,
        };
      }
    }

    return sorted;
  }

  const toNum = (x) => (typeof x === "number" ? x : 0);

  function computeWithLongVolume(rawData) {
    if (!Array.isArray(rawData) || rawData.length === 0) return [];

    const n = rawData.length;
    const out = new Array(n);

    for (let i = 0; i < n; i++) {
      const item = rawData[i] || {};
      const total = toNum(item.totalVolume);
      const short = toNum(item.shortVolume);

      // compute longVolume once
      const longVolume = total - short;
      // avoid division by zero
      const longShortRatio = short !== 0 ? longVolume / short : null; // or Infinity, 0, whatever makes sense for you

      out[i] = {
        ...item,
        longVolume,
        longShortRatio,
      };
    }

    return out;
  }

  rawData = computeWithLongVolume(rawData);
  rawData = addChangesPercentage(rawData);

  const originalData = rawData;
  let activeIdx = 0;
  const tabs = [
    {
      title: "Weekly",
    },
    {
      title: "Quarterly",
    },
  ];

  let config = null;
  let avgVolume = 0;
  let avgShortVolume = 0;
  let monthlyVolume = "";
  let avgMonthlyShort = "";

  function findMonthlyValue(data, lastDateStr) {
    const lastDate = new Date(lastDateStr);
    const firstDate = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1);

    const filteredData = data.filter((item) => {
      const currentDate = new Date(item?.date);
      return currentDate >= firstDate && currentDate <= lastDate;
    });

    monthlyVolume = abbreviateNumber(
      filteredData.reduce((acc, item) => acc + (item?.totalVolume || 0), 0),
    );

    const totalShortPercent = filteredData.reduce(
      (acc, item) => acc + (item?.shortPercent || 0),
      0,
    );
    avgMonthlyShort =
      (totalShortPercent / filteredData?.length)?.toFixed(2) || "0.00";
  }

  function getPlotOptions() {
    // Prepare the data arrays with optimized single-pass processing
    const sortedChartData = [...rawData]?.sort(
      (a, b) => new Date(a?.date).getTime() - new Date(b?.date).getTime(),
    );

    // Single pass to extract all needed data
    const dates = [];
    const totalVolumeList = [];
    const shortVolumeList = [];
    let totalVolSum = 0;
    let shortVolSum = 0;

    for (let i = 0; i < sortedChartData.length; i++) {
      const item = sortedChartData[i];
      dates.push(item?.date);
      const totalVol = item?.totalVolume || 0;
      const shortVol = item?.shortVolume || 0;
      totalVolumeList.push(totalVol);
      shortVolumeList.push(shortVol);
      totalVolSum += totalVol;
      shortVolSum += shortVol;
    }

    // Call side-effect function as in your original code
    findMonthlyValue(sortedChartData, sortedChartData.at(-1)?.date);

    // Compute averages more efficiently
    const length = sortedChartData.length;
    avgVolume = length > 0 ? Math.floor(totalVolSum / length) : 0;
    avgShortVolume = length > 0 ? Math.floor(shortVolSum / length) : 0;

    const options = {
      credits: { enabled: false },
      chart: {
        type: "line",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 360,
        spacingTop: 5,
        animation: false,
        reflow: false, // Disable automatic reflow for better performance
      },
      title: {
        text: `<h3 class="mt-3 -mb-3 text-[1rem] sm:text-lg">${removeCompanyStrings($displayCompanyName)} Historical Chart</h3>`,
        style: {
          color: $mode === "light" ? "black" : "white",
        },
        useHTML: true,
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
      xAxis: {
        type: "datetime",
        endOnTick: false,
        categories: dates,
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
              day: "2-digit", // Include day number
              month: "short", // Display short month name
              year: "numeric", // Include year
            });
          },
        },
      },
      yAxis: [
        {
          gridLineWidth: 1,
          gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
          labels: {
            enabled: false,
          },
          title: {
            text: null,
          },
          opposite: true,
        },
        {
          labels: {
            enabled: false,
          },
          title: {
            text: null,
          },
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
          // Pre-format date to avoid repeated calculations
          const formattedDate = new Date(this?.x).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });

          // Use array join instead of string concatenation for better performance
          const tooltipParts = [
            `<span class="m-auto text-[1rem] font-[501]">${formattedDate}</span><br>`,
          ];

          // Process points more efficiently
          for (let i = 0; i < this.points.length; i++) {
            const point = this.points[i];
            tooltipParts.push(
              `<span style="display:inline-block; width:10px; height:10px; background-color:${point.color}; border-radius:50%; margin-right:5px;"></span>`,
              `<span class="font-semibold text-sm">${point.series.name}:</span> `,
              `<span class="font-normal text-sm">${abbreviateNumber(point.y)}</span><br>`,
            );
          }

          return tooltipParts.join("");
        },
      },
      plotOptions: {
        series: {
          color: "white",
          legendSymbol: "rectangle",
          animation: false, // Disable series animation
          enableMouseTracking: true, // Keep tooltip but optimize
          states: {
            hover: {
              enabled: false, // Disable hover effect globally
            },
          },
        },
      },
      boost: {
        useGPUTranslations: true, // Enable GPU acceleration if available
        seriesThreshold: 1, // Enable boost for all series
      },
      series: [
        {
          name: "Total Volume",
          data: totalVolumeList,
          type: "line",
          color: $mode === "light" ? "#2C6288" : "white",
          marker: { enabled: false },
          animation: false,
        },
        {
          name: "Short Volume",
          data: shortVolumeList,
          type: "area",
          color: "#E11D48",
          fillOpacity: 1,
          marker: { enabled: false },
          animation: false,
        },
      ],
    };

    return options;
  }

  let tableList = [];
  let paginatedTableList = [];

  // Pagination state (Pro-only; non-Pro stays capped)
  let currentPage = 1;
  let rowsPerPage = 20;
  let rowsPerPageOptions = [20, 50, 100];
  let totalPages = 1;

  let pagePathName = $page?.url?.pathname;

  function updatePaginatedData() {
    const isPro = data?.user?.tier === "Pro";

    if (!isPro) {
      paginatedTableList = (tableList || [])?.slice(0, 3);
      totalPages = 1;
      currentPage = 1;
      return;
    }

    const totalRows = tableList?.length || 0;
    totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    paginatedTableList = (tableList || [])?.slice(startIndex, endIndex) || [];
  }

  function goToPage(pageNum) {
    if (pageNum >= 1 && pageNum <= totalPages) {
      currentPage = pageNum;
      updatePaginatedData();
    }
  }

  function saveRowsPerPage() {
    if (!pagePathName || typeof localStorage === "undefined") return;

    try {
      const paginationKey = `${pagePathName}_HistoricalDarkPool_rowsPerPage`;
      localStorage.setItem(paginationKey, String(rowsPerPage));
    } catch (e) {
      console.warn("Failed to save rows per page preference:", e);
    }
  }

  function loadRowsPerPage() {
    const currentPath = pagePathName || $page?.url?.pathname;

    if (!currentPath || typeof localStorage === "undefined") {
      rowsPerPage = 20;
      return;
    }

    try {
      const paginationKey = `${currentPath}_HistoricalDarkPool_rowsPerPage`;
      const savedRows = localStorage.getItem(paginationKey);

      if (savedRows && rowsPerPageOptions.includes(Number(savedRows))) {
        rowsPerPage = Number(savedRows);
      } else {
        rowsPerPage = 20;
      }
    } catch (e) {
      console.warn("Failed to load rows per page preference:", e);
      rowsPerPage = 20;
    }
  }

  function changeRowsPerPage(newRowsPerPage) {
    rowsPerPage = newRowsPerPage;
    currentPage = 1;
    updatePaginatedData();
    saveRowsPerPage();
  }

  changeTimePeriod(activeIdx);

  function changeTimePeriod(i) {
    activeIdx = i;
    if (activeIdx === 0) {
      tableList = filterByPeriod(originalData, "weekly");
    } else if (activeIdx === 1) {
      tableList = filterByPeriod(originalData);
    }

    tableList = addChangesPercentage(tableList);
    currentPage = 1;
    updatePaginatedData();
  }

  function filterByPeriod(data, period = "quarterly") {
    if (!Array.isArray(data) || data.length === 0) return [];

    // Keep track of seen period keys
    const seenPeriods = new Set();

    return data.filter((item) => {
      const dt = new Date(item.date);
      const year = dt.getFullYear();
      let key;

      switch (period) {
        case "weekly":
          // ISO week number calculation
          const tmp = new Date(
            Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()),
          );
          const dayNum = tmp.getUTCDay() || 7; // Monday=1, Sunday=7
          tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
          const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
          const weekNo = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
          key = `${year}-W${weekNo}`;
          break;

        case "quarterly":
        default:
          // Quarter calculation
          const quarter = Math.floor(dt.getMonth() / 3) + 1; // 1 to 4
          key = `${year}-Q${quarter}`;
          break;
      }

      if (!seenPeriods.has(key)) {
        seenPeriods.add(key);
        return true;
      }
      return false;
    });
  }

  let columns = [
    { key: "date", label: "Date", align: "left" },
    { key: "longVolume", label: "Long Volume", align: "right" },
    { key: "shortVolume", label: "Short Volume", align: "right" },
    { key: "longShortRatio", label: "Long / Short", align: "right" },
    { key: "changesPercentage", label: "% Short Change", align: "right" },
  ];

  let sortOrders = {
    date: { order: "none", type: "date" },
    longVolume: { order: "none", type: "number" },
    shortVolume: { order: "none", type: "number" },
    longShortRatio: { order: "none", type: "number" },
    changesPercentage: { order: "none", type: "number" },
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

    tableList = tableList?.sort(
      (a, b) => new Date(b?.date) - new Date(a?.date),
    );

    let originalData = tableList;

    const currentOrderIndex = orderCycle.indexOf(sortOrders[key].order);
    sortOrders[key].order =
      orderCycle[(currentOrderIndex + 1) % orderCycle.length];
    const sortOrder = sortOrders[key].order;

    // Reset to original data when 'none' and stop further sorting
    if (sortOrder === "none") {
      tableList = [...originalData]; // Reset to original data (spread to avoid mutation)
      currentPage = 1;
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
    tableList = [...originalData].sort(compareValues);
    currentPage = 1;
    updatePaginatedData();
  };

  // Optimize reactive statement to avoid unnecessary recalculations
  let prevMode = $mode;
  $: if ($mode !== prevMode) {
    prevMode = $mode;
    config = getPlotOptions() || null;
  }

  // Initialize config on component mount
  if (!config) {
    config = getPlotOptions() || null;
  }

  onMount(() => {
    loadRowsPerPage();
    updatePaginatedData();
  });

  $: if ($page?.url?.pathname && $page?.url?.pathname !== pagePathName) {
    pagePathName = $page?.url?.pathname;
    loadRowsPerPage();
    updatePaginatedData();
  }
</script>

<section class="overflow-hidden h-full pb-8">
  <main class="overflow-hidden">
    <div class="flex flex-row items-center">
      <label
        for="historicalDataInfo"
        class="mr-1 cursor-pointer flex flex-row items-center text-xl sm:text-2xl font-bold"
      >
        Historical Dark Pool Chart
      </label>
      <InfoModal
        title={"Historical Data"}
        content={"By analyzing historical dark pool activity, retail investors can gauge market sentiment through total and short volumes. High short volume may indicate bearish sentiment."}
        id={"historicalDataInfo"}
      />
    </div>

    {#if rawData?.length !== 0}
      <div class="mt-5">
        <div class="grow">
          <div class="relative">
            <!-- Apply the blur class to the chart -->
            <div
              class="mt-5 shadow sm:mt-0 border border-gray-300 dark:border-gray-800 rounded"
              use:highcharts={config}
            ></div>
          </div>
        </div>
      </div>

      <div
        class="mt-5 flex items-center justify-end w-full border-y border-gray-300 dark:border-gray-800 py-2"
      >
        <div
          class="inline-flex rounded shadow-sm border border-gray-300 dark:border-gray-700"
        >
          {#each tabs as item, i}
            <button
              on:click={() => changeTimePeriod(i)}
              class="cursor-pointer px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none transition-colors duration-50
                          {i === 0 ? 'rounded-l border' : ''}
                          {i === tabs?.length - 1
                ? 'rounded-r border-t border-r border-b'
                : ''}
                          {i !== 0 && i !== tabs?.length - 1
                ? 'border-t border-b'
                : ''}
                          {activeIdx === i
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-white  border-gray-300 sm:hover:bg-gray-100 dark:bg-primary dark:border-gray-800'}"
            >
              {item.title}
            </button>
          {/each}
        </div>
      </div>

      <div class="w-full overflow-x-auto mt-3">
        <table
          class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
        >
          <thead>
            <TableHeader {columns} {sortOrders} {sortData} />
          </thead>
          <tbody>
            {#each paginatedTableList as item, index}
              <!-- row -->
              <tr
                class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd {index +
                  1 ===
                  paginatedTableList?.length &&
                !['Pro']?.includes(data?.user?.tier)
                  ? 'opacity-[0.1]'
                  : ''}"
              >
                <td class=" text-sm sm:text-[1rem] whitespace-nowrap">
                  {new Date(item?.date)?.toLocaleDateString("en-US", {
                    day: "2-digit", // Include day number
                    month: "short", // Display short month name
                    year: "numeric", // Include year
                  })}
                </td>

                <td
                  class=" text-sm sm:text-[1rem] text-right whitespace-nowrap"
                >
                  {item?.longVolume?.toLocaleString("en-US")}
                </td>

                <td
                  class=" text-sm sm:text-[1rem] text-right whitespace-nowrap"
                >
                  {item?.shortVolume?.toLocaleString("en-US")}
                </td>

                <td
                  class=" text-sm sm:text-[1rem] text-right whitespace-nowrap"
                >
                  {item?.longShortRatio
                    ? item?.longShortRatio?.toFixed(2)
                    : "n/a"}
                </td>

                <td class=" text-sm sm:text-[1rem] whitespace-nowrap text-end">
                  {#if item?.changesPercentage}
                    <span
                      class={item?.changesPercentage >= 0
                        ? "text-green-800 dark:text-[#00FC50] before:content-['+']"
                        : item?.changesPercentage < 0
                          ? "text-red-800 dark:text-[#FF2F1F]"
                          : ""}
                    >
                      {item?.changesPercentage
                        ? item?.changesPercentage + "%"
                        : "n/a"}
                    </span>
                  {:else}
                    n/a
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if data?.user?.tier === "Pro" && paginatedTableList?.length > 0}
        <div class="flex flex-row items-center justify-between mt-5">
          <div class="flex items-center gap-2">
            <Button
              on:click={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              class="w-fit transition-all flex flex-row items-center duration-50 border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary flex flex-row justify-between items-center  sm:w-auto px-1.5 sm:px-3 rounded truncate"
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
              <span class="hidden sm:inline">Previous</span></Button
            >
          </div>

          <div class="flex flex-row items-center gap-4">
            <span class="text-sm sm:text-[1rem]">
              Page {currentPage} of {totalPages}
            </span>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild let:builder>
                <Button
                  builders={[builder]}
                  class="w-fit transition-all duration-50 border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary  flex flex-row justify-between items-center  sm:w-auto px-2 sm:px-3 rounded truncate"
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
                class="w-auto min-w-40  max-h-[400px] overflow-y-auto scroller relative"
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
      {/if}
      <UpgradeToPro {data} display={true} />
    {/if}
  </main>
</section>

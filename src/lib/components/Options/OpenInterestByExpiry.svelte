<script lang="ts">
  import {
    stock_detail_options_chart_type_column,
    stock_detail_options_chart_type_line,
    stock_detail_options_chart_type_scatter,
    stock_detail_options_col_call_oi,
    stock_detail_options_col_pc_oi,
    stock_detail_options_col_put_oi,
    stock_detail_options_common_back_to_top,
    stock_detail_options_common_call,
    stock_detail_options_common_next,
    stock_detail_options_common_page_of,
    stock_detail_options_common_previous,
    stock_detail_options_common_put,
    stock_detail_options_common_rows,
    stock_detail_options_oi_chart_expiry_title,
    stock_detail_options_oi_chart_title,
    stock_detail_options_oi_col_expiry_date,
    stock_detail_options_oi_expiry_summary_active,
    stock_detail_options_oi_expiry_summary_intro,
    stock_detail_options_oi_expiry_summary_no_data,
    stock_detail_options_oi_expiry_summary_totals,
    stock_detail_options_oi_table_title,
  } from "$lib/paraglide/messages";
  import { abbreviateNumber } from "$lib/utils";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { page } from "$app/stores";
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";
  import BarChartIcon from "lucide-svelte/icons/chart-column-increasing";
  import LineChartIcon from "lucide-svelte/icons/chart-spline";
  import ScatterChartIcon from "lucide-svelte/icons/circle-dot";

  export let data;
  export let ticker;

  // Chart type state
  type ChartType = "column" | "line" | "scatter";
  let chartType: ChartType = "column";

  const chartTypes: { type: ChartType; icon: any }[] = [
    { type: "column", icon: BarChartIcon },
    { type: "line", icon: LineChartIcon },
    { type: "scatter", icon: ScatterChartIcon },
  ];

  const chartTypeLabels: Record<ChartType, () => string> = {
    column: stock_detail_options_chart_type_column,
    line: stock_detail_options_chart_type_line,
    scatter: stock_detail_options_chart_type_scatter,
  };

  function getChartTypeLabel(type: ChartType): string {
    return chartTypeLabels[type]?.() ?? type;
  }

  function changeChartType(type: ChartType) {
    chartType = type;
    config = plotData() || null;
  }

  let rawData = data?.getData || [];

  const today = new Date();

  rawData = rawData?.reduce((result, item) => {
    const itemDate = new Date(item?.expiry);
    if (itemDate >= today) {
      result.push({
        ...item,
        put_call_ratio:
          item?.call_oi > 0
            ? Math.abs((item?.put_oi || 0) / item.call_oi)
            : null,
      });
    }
    return result;
  }, []);

  let totalCallOI = 0;
  let totalPutOI = 0;
  let totalOI = 0;
  let formattedTotalOI = "0";
  let formattedCallOI = "0";
  let formattedPutOI = "0";

  $: totalCallOI = rawData?.reduce(
    (sum, item) => sum + (item?.call_oi || 0),
    0,
  );
  $: totalPutOI = rawData?.reduce((sum, item) => sum + (item?.put_oi || 0), 0);
  $: totalOI = totalCallOI + totalPutOI;
  $: formattedTotalOI = totalOI?.toLocaleString("en-US");
  $: formattedCallOI = totalCallOI?.toLocaleString("en-US");
  $: formattedPutOI = totalPutOI?.toLocaleString("en-US");

  // Track the currently sorted data separately
  let sortedData = [];
  let displayList = [];

  // Pagination state
  let currentPage = 1;
  let rowsPerPage = 20;
  let rowsPerPageOptions = [20, 50, 100];
  let totalPages = 1;
  let pagePathName = $page?.url?.pathname;

  // Pagination functions
  function updatePaginatedData() {
    const dataSource = sortedData?.length > 0 ? sortedData : rawData;
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

  function plotData() {
    const processedData = rawData?.map((d) => ({
      expiry: d?.expiry,
      callValue: d?.call_oi,
      putValue: d?.put_oi,
    }));

    const categories = processedData?.map((d) => d.expiry);
    const callValues = processedData?.map((d) =>
      parseFloat((d.callValue ?? 0).toFixed(2)),
    );
    const putValues = processedData?.map((d) =>
      parseFloat((d.putValue ?? 0).toFixed(2)),
    );

    const options = {
      chart: {
        type: chartType === "scatter" ? "scatter" : chartType,
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        animation: false,
        height: 360,
        zoomType: "x",
        resetZoomButton: {
          theme: {
            fill: $mode === "light" ? "#f3f4f6" : "#27272a",
            stroke: $mode === "light" ? "#d1d5db" : "#3f3f46",
            style: {
              color: $mode === "light" ? "#111827" : "#f4f4f5",
            },
            r: 8,
            states: {
              hover: {
                fill: $mode === "light" ? "#e5e7eb" : "#3f3f46",
              },
            },
          },
          position: {
            align: "right",
            x: -10,
            y: 10,
          },
        },
      },
      credits: { enabled: false },
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
      title: {
        text: `<h3 class="mt-3 mb-1 text-sm font-semibold tracking-tight">${stock_detail_options_oi_chart_expiry_title({ ticker })}</h3>`,
        useHTML: true,
        style: { color: $mode === "light" ? "#111827" : "#f4f4f5" },
      },
      xAxis: {
        type: "category",
        categories: categories,
        crosshair: {
          color: $mode === "light" ? "black" : "white",
          width: 1,
          dashStyle: "Solid",
        },
        labels: {
          style: {
            color: $mode === "light" ? "#545454" : "white",
          },
          distance: 10, // Adjust space between labels and axis
          formatter: function () {
            const date = new Date(this.value);
            return date.toLocaleDateString("en-US", {
              day: "2-digit",
              month: "short", // "Jan", "Feb", etc.
              year: "numeric",
              timeZone: "UTC",
            });
          },
        },
        tickInterval: Math.max(1, Math.floor(categories.length / 5)), // Ensures better spacing
        tickPositioner: function () {
          const positions = [];
          const tickCount = 5; // Reduce number of ticks displayed
          const totalPoints = this.categories.length;
          const interval = Math.max(1, Math.floor(totalPoints / tickCount));

          for (let i = 0; i < totalPoints; i += interval) {
            positions.push(i);
          }
          return positions;
        },
      },

      yAxis: {
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
        },
        title: { text: null },
        opposite: true,
      },
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
            this.points[0]?.key,
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
        <span class="font-normal text-sm">${point.y?.toLocaleString("en-US")}</span><br>`;
          });

          return tooltipContent;
        },
      },
      plotOptions: {
        animation: false,
        column: {
          grouping: true,
          shadow: false,
          borderWidth: 0,
        },
        line: {
          marker: {
            enabled: true,
            radius: 3,
          },
        },
        scatter: {
          marker: {
            radius: 4,
            symbol: "circle",
          },
        },
      },

      series: [
        {
          name: stock_detail_options_common_put(),
          type: chartType,
          data: putValues,
          color: "#CC2619",
          borderColor: "#CC2619",
          borderRadius: "1px",
          animation: false,
        },
        {
          name: stock_detail_options_common_call(),
          type: chartType,
          data: callValues,
          color: "#00C440",
          borderColor: "#00C440",
          borderRadius: "1px",
          animation: false,
        },
      ],
    };

    return options;
  }

  // Initialize pagination on mount
  function initialize() {
    // Initialize sortedData with raw data
    sortedData = [...rawData];

    // Load pagination preference
    loadRowsPerPage();

    // Reset to first page and update pagination
    currentPage = 1;
    updatePaginatedData();
  }

  initialize();

  $: columns = [
    {
      key: "expiry",
      label: stock_detail_options_oi_col_expiry_date(),
      align: "left",
    },
    {
      key: "call_oi",
      label: stock_detail_options_col_call_oi(),
      align: "right",
    },
    {
      key: "put_oi",
      label: stock_detail_options_col_put_oi(),
      align: "right",
    },
    {
      key: "put_call_ratio",
      label: stock_detail_options_col_pc_oi(),
      align: "right",
    },
  ];

  $: sortOrders = {
    expiry: { order: "none", type: "date" },
    call_oi: { order: "none", type: "number" },
    put_oi: { order: "none", type: "number" },
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
    const currentOrderIndex = orderCycle.indexOf(sortOrders[key].order);
    sortOrders[key].order =
      orderCycle[(currentOrderIndex + 1) % orderCycle.length];
    const sortOrder = sortOrders[key].order;

    // Reset to original data when 'none' and stop further sorting
    if (sortOrder === "none") {
      sortedData = [...rawData];
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
          valueA = (a[key] || "")?.toUpperCase();
          valueB = (b[key] || "")?.toUpperCase();
          return sortOrder === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        case "number":
        default:
          valueA = parseFloat(a[key]) || 0;
          valueB = parseFloat(b[key]) || 0;
          break;
      }

      if (sortOrder === "asc") {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    };

    // Sort all data and store it
    sortedData = [...rawData].sort(compareValues);
    // Reset to first page and update pagination
    currentPage = 1;
    updatePaginatedData();
  };

  let config = null;

  $: {
    if ($mode) {
      config = plotData() || null;
    }
  }

  // Reactive statement to load pagination settings when page changes
  $: if ($page?.url?.pathname && $page?.url?.pathname !== pagePathName) {
    pagePathName = $page?.url?.pathname;
    loadRowsPerPage(); // Load pagination preference for new page
    updatePaginatedData(); // Update display with loaded preference
  }
</script>

<div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto mt-2 sm:mt-0">
  <h2
    class="flex flex-row items-center text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white w-fit"
  >
    {stock_detail_options_oi_chart_title()}
  </h2>

  <p class="mt-3 mb-2 text-sm text-gray-800 dark:text-zinc-300 leading-relaxed">
    {#if rawData?.length > 0}
      <span
        >{@html stock_detail_options_oi_expiry_summary_intro({ ticker })}</span
      >
      {" "}
      <span
        >{@html stock_detail_options_oi_expiry_summary_active({
          count: rawData?.length,
        })}</span
      >
      {" "}
      <span
        >{@html stock_detail_options_oi_expiry_summary_totals({
          total: formattedTotalOI,
          call: formattedCallOI,
          put: formattedPutOI,
        })}</span
      >
    {:else}
      {stock_detail_options_oi_expiry_summary_no_data()}
    {/if}
  </p>

  <!-- Chart Type Switcher -->
  <div class="mt-7 flex flex-wrap items-center justify-end gap-3">
    <div class="flex items-center">
      <div
        class="w-fit flex text-sm items-center gap-1 rounded-full border border-gray-300 dark:border-zinc-700 p-1"
      >
        {#each chartTypes as item}
          <button
            on:click={() => changeChartType(item.type)}
            class="cursor-pointer rounded-full p-1.5 focus:z-10 focus:outline-none transition-all
              {chartType === item.type
              ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-white'
              : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'}"
            title={getChartTypeLabel(item.type)}
          >
            <svelte:component this={item.icon} class="w-4 h-4" />
          </button>
        {/each}
      </div>
    </div>
  </div>

  <div class="w-full overflow-hidden m-auto mt-3">
    {#if config !== null}
      <div>
        <div class="grow">
          <div class="relative">
            <!-- Apply the blur class to the chart -->
            <div
              class="mt-5 sm:mt-0 border border-gray-300 dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40"
              use:highcharts={config}
            ></div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <div class="items-center lg:overflow-visible px-1 py-1 mt-10">
    <div
      class="col-span-2 flex flex-row items-center grow py-1 border-t border-b border-gray-300 dark:border-zinc-700"
    >
      <h2
        class="text-start whitespace-nowrap text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white w-full"
      >
        {stock_detail_options_oi_table_title()}
      </h2>
      <div
        class="mt-1 w-full flex flex-row lg:flex order-1 items-center ml-auto pb-1 pt-1 sm:pt-0 w-full order-0 lg:order-1"
      >
        <div class="ml-auto">
          <DownloadData
            {data}
            {rawData}
            title={`${ticker}_open_interest_by_expiry`}
          />
        </div>
      </div>
    </div>
  </div>

  <div class="mt-3 w-full m-auto mb-4 overflow-x-auto">
    <div class="w-full overflow-x-auto">
      <table
        class="table table-sm table-compact w-full text-gray-700 dark:text-zinc-200 tabular-nums m-auto rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 mt-2"
      >
        <thead
          class="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400"
        >
          <TableHeader {columns} {sortOrders} {sortData} />
        </thead>
        <tbody>
          {#each displayList as item, index}
            <tr class="transition-colors">
              <td class="text-sm text-start whitespace-nowrap">
                {new Date(item?.expiry).toLocaleDateString("en-US", {
                  month: "short", // Abbreviated month (e.g., Jan)
                  day: "numeric", // Numeric day (e.g., 10)
                  year: "numeric", // Full year (e.g., 2025)
                })}
              </td>
              <td class="text-sm text-end whitespace-nowrap">
                {item?.call_oi?.toLocaleString("en-US")}
              </td>
              <td class="text-sm text-end whitespace-nowrap">
                {item?.put_oi?.toLocaleString("en-US")}
              </td>

              <td class="text-sm text-end whitespace-nowrap">
                {#if item?.put_call_ratio <= 1 && item?.put_call_ratio !== null}
                  <span class="f text-emerald-600 dark:text-emerald-400"
                    >{item?.put_call_ratio?.toFixed(2)}</span
                  >
                {:else if item?.put_call_ratio > 1 && item?.put_call_ratio !== null}
                  <span class="f text-rose-600 dark:text-rose-400"
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

  <!-- Pagination controls -->
  {#if displayList?.length > 0 && totalPages > 0}
    <div class="flex flex-row items-center justify-between mt-8 sm:mt-5">
      <!-- Previous button -->
      <div class="flex items-center gap-2">
        <Button
          on:click={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
          <span class="hidden sm:inline"
            >{stock_detail_options_common_previous()}</span
          >
        </Button>
      </div>

      <!-- Page info and rows selector in center -->
      <div class="flex flex-row items-center gap-4">
        <span class="text-sm text-gray-600 dark:text-zinc-300">
          {stock_detail_options_common_page_of({
            current: currentPage,
            total: totalPages,
          })}
        </span>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild let:builder>
            <Button
              builders={[builder]}
              class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span class="truncate text-[0.85rem] sm:text-sm"
                >{stock_detail_options_common_rows({
                  count: rowsPerPage,
                })}</span
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
            class="w-auto min-w-40 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
          >
            <!-- Dropdown items -->
            <DropdownMenu.Group class="pb-2">
              {#each rowsPerPageOptions as item}
                <DropdownMenu.Item
                  class="hover:text-violet-600 dark:hover:text-violet-400 transition"
                >
                  <label
                    on:click={() => changeRowsPerPage(item)}
                    class="inline-flex justify-between w-full items-center cursor-pointer"
                  >
                    <span class="text-sm"
                      >{stock_detail_options_common_rows({ count: item })}</span
                    >
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
          class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span class="hidden sm:inline"
            >{stock_detail_options_common_next()}</span
          >
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
        class="cursor-pointer text-sm font-medium text-gray-800 dark:text-zinc-300 transition hover:text-violet-600 dark:hover:text-violet-400"
      >
        {stock_detail_options_common_back_to_top()}
        <svg
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
</div>

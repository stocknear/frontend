<script lang="ts">
  import * as m from "$lib/paraglide/messages";
  import { abbreviateNumber } from "$lib/utils";
  import { onMount } from "svelte";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { page } from "$app/stores";
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import BarChartIcon from "lucide-svelte/icons/chart-column-increasing";
  import LineChartIcon from "lucide-svelte/icons/chart-spline";
  import ScatterChartIcon from "lucide-svelte/icons/circle-dot";

  export let data;
  export let title = "Gamma";
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
    column: m.stock_detail_options_chart_type_column,
    line: m.stock_detail_options_chart_type_line,
    scatter: m.stock_detail_options_chart_type_scatter,
  };

  function getChartTypeLabel(type: ChartType): string {
    return chartTypeLabels[type]?.() ?? type;
  }

  function changeChartType(type: ChartType) {
    chartType = type;
    config = plotData() || null;
  }

  let rawData = data?.getData || [];
  let sortedData = [];

  const isGamma = title === "Gamma";
  const today = new Date();

  // Pagination state
  let currentPage = 1;
  let rowsPerPage = 20;
  let rowsPerPageOptions = [20, 50, 100];
  let totalPages = 1;
  let pagePathName = $page?.url?.pathname;

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

  let displayList = [];

  // Calculate aggregate metrics for the insight paragraph
  $: totalExposure =
    rawData?.reduce((sum, item) => {
      return sum + (isGamma ? item?.net_gex || 0 : item?.net_dex || 0);
    }, 0) || 0;

  $: totalCallExposure =
    rawData?.reduce((sum, item) => {
      return sum + (isGamma ? item?.call_gex || 0 : item?.call_dex || 0);
    }, 0) || 0;

  $: totalPutExposure =
    rawData?.reduce((sum, item) => {
      return sum + (isGamma ? item?.put_gex || 0 : item?.put_dex || 0);
    }, 0) || 0;

  $: nearestExpiry =
    rawData?.length > 0 ? formatDate(rawData[0]?.expiry) : "n/a";

  $: highestExposureExpiry =
    rawData?.reduce((max, item) => {
      const currentNet = isGamma
        ? Math.abs(item?.net_gex || 0)
        : Math.abs(item?.net_dex || 0);
      const maxNet = isGamma
        ? Math.abs(max?.net_gex || 0)
        : Math.abs(max?.net_dex || 0);
      return currentNet > maxNet ? item : max;
    }, rawData[0]) || {};

  $: overallPutCallRatio =
    totalCallExposure !== 0
      ? Math.abs(totalPutExposure / totalCallExposure).toFixed(2)
      : "n/a";

  $: greekMetricLabel = isGamma ? "GEX" : "DEX";

  $: formattedTotalExposure = totalExposure?.toLocaleString("en-US");
  $: formattedCallExposure = totalCallExposure?.toLocaleString("en-US");
  $: formattedPutExposure = Math.abs(totalPutExposure)?.toLocaleString("en-US");

  $: ratioContext = isGamma
    ? overallPutCallRatio !== "n/a" &&
        parseFloat(overallPutCallRatio) > 1
      ? m.stock_detail_options_greek_expiry_gamma_context_high_put()
      : overallPutCallRatio !== "n/a" &&
          parseFloat(overallPutCallRatio) < 0.5
        ? m.stock_detail_options_greek_expiry_gamma_context_high_call()
        : m.stock_detail_options_greek_expiry_gamma_context_balanced()
    : overallPutCallRatio !== "n/a" &&
        parseFloat(overallPutCallRatio) > 1
      ? m.stock_detail_options_greek_expiry_delta_context_high_put()
      : overallPutCallRatio !== "n/a" &&
          parseFloat(overallPutCallRatio) < 0.5
        ? m.stock_detail_options_greek_expiry_delta_context_high_call()
        : m.stock_detail_options_greek_expiry_delta_context_balanced();

  $: summaryIntroText = isGamma
    ? m.stock_detail_options_greek_expiry_gamma_intro({
        ticker,
        total: formattedTotalExposure,
        call: formattedCallExposure,
        put: formattedPutExposure,
      })
    : m.stock_detail_options_greek_expiry_delta_intro({
        ticker,
        total: formattedTotalExposure,
        call: formattedCallExposure,
        put: formattedPutExposure,
      });

  $: summaryRatioText = isGamma
    ? m.stock_detail_options_greek_expiry_gamma_ratio({
        ratio: overallPutCallRatio,
        context: ratioContext,
      })
    : m.stock_detail_options_greek_expiry_delta_ratio({
        ratio: overallPutCallRatio,
        context: ratioContext,
      });

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
    // Convert values to numbers (toFixed returns a string) - handle undefined values
    const callValues = processedData.map((d) =>
      parseFloat((d.callValue ?? 0).toFixed(2)),
    );
    const putValues = processedData.map((d) =>
      parseFloat((d.putValue ?? 0).toFixed(2)),
    );
    const netValues = processedData.map((d) =>
      parseFloat((d.netValue ?? 0).toFixed(2)),
    );

    const options = {
      credits: {
        enabled: false,
      },
      chart: {
        type: chartType === "scatter" ? "scatter" : chartType,
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 360,
        animation: false,
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
      title: {
        text: `<h3 class="mt-3 mb-1 text-sm font-semibold tracking-tight">${m.stock_detail_options_greek_chart_title({ ticker, metric: greekMetricLabel })}</h3>`,
        style: {
          color: $mode === "light" ? "#111827" : "#f4f4f5",
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
      plotOptions: {
        series: {
          animation: false,
          ...(chartType === "column" ? { stacking: "normal" } : {}),
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
              timeZone: "UTC",
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
          color: "#E74C3C",
          borderColor: "#E74C3C",
          borderRadius: "1px",
          animation: false,
        },
        {
          name: `Net ${isGamma ? "Gamma" : "Delta"}`,
          data: netValues,
          color: "#2C6288",
          borderColor: "#2C6288",
          borderRadius: "1px",
          animation: false,
        },
        {
          name: `Call ${isGamma ? "Gamma" : "Delta"}`,
          data: callValues,
          color: "#2ECC71",
          borderColor: "#2ECC71",
          borderRadius: "1px",
          animation: false,
        },
      ],
    };

    return options;
  }

  function updatePaginatedData() {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    displayList = sortedData?.slice(start, end);
    totalPages = Math.ceil(sortedData?.length / rowsPerPage);
  }

  function goToPage(page) {
    currentPage = page;
    updatePaginatedData();
  }

  function changeRowsPerPage(newRowsPerPage) {
    rowsPerPage = newRowsPerPage;
    currentPage = 1;
    updatePaginatedData();
    saveRowsPerPage();
  }

  function saveRowsPerPage() {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        `greekByExpiry_rowsPerPage_${pagePathName}`,
        rowsPerPage.toString(),
      );
    }
  }

  function loadRowsPerPage() {
    if (typeof localStorage !== "undefined") {
      const savedRowsPerPage = localStorage.getItem(
        `greekByExpiry_rowsPerPage_${pagePathName}`,
      );
      if (savedRowsPerPage) {
        rowsPerPage = parseInt(savedRowsPerPage, 10);
      }
    }
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function initialize() {
    sortedData = [...rawData];
    loadRowsPerPage();
    currentPage = 1;
    updatePaginatedData();
  }

  onMount(() => {
    initialize();
  });

  $: {
    if (pagePathName) {
      initialize();
    }
  }

  $: columns = [
    { key: "expiry", label: m.stock_detail_options_greek_col_expiry_date(), align: "left" },
    {
      key: isGamma ? "call_gex" : "call_dex",
      label: isGamma ? m.stock_detail_options_greek_col_call_gex() : m.stock_detail_options_greek_col_call_delta(),
      align: "right",
    },
    {
      key: isGamma ? "put_gex" : "put_dex",
      label: isGamma ? m.stock_detail_options_greek_col_put_gex() : m.stock_detail_options_greek_col_put_delta(),
      align: "right",
    },
    {
      key: isGamma ? "net_gex" : "net_dex",
      label: isGamma ? m.stock_detail_options_greek_col_net_gex() : m.stock_detail_options_greek_col_net_delta(),
      align: "right",
    },
    {
      key: "put_call_ratio",
      label: isGamma ? m.stock_detail_options_greek_col_pc_gex() : m.stock_detail_options_greek_col_pc_delta(),
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
    const currentOrderIndex = orderCycle.indexOf(sortOrders[key].order);
    sortOrders[key].order =
      orderCycle[(currentOrderIndex + 1) % orderCycle.length];
    const sortOrder = sortOrders[key].order;

    // Reset to original data when 'none' and stop further sorting
    if (sortOrder === "none") {
      sortedData = [...rawData];
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
    sortedData = [...rawData].sort(compareValues);
    currentPage = 1;
    updatePaginatedData();
  };

  let config = null;

  $: {
    if ($mode) {
      config = plotData() || null;
    }
  }
</script>

<div class="sm:pl-7 sm:pb-7 sm:pt-5 w-full m-auto mt-2 sm:mt-0">
  <h2
    class="flex flex-row items-center text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white w-fit"
  >
    {m.stock_detail_options_greek_by_expiry()} <InfoModal
      content={isGamma
        ? m.stock_detail_options_greek_expiry_info_gamma({ ticker })
        : m.stock_detail_options_greek_expiry_info_delta({ ticker })}
    />
  </h2>

  <!-- Insightful overview paragraph -->
  <div class="w-full mt-4 mb-6 text-sm text-gray-800 dark:text-zinc-300">
    <p>
      <span>{@html summaryIntroText}</span>
      {" "}
      <span>{@html summaryRatioText}</span>
    </p>
  </div>

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

  <div class="w-full overflow-hidden m-auto sm:mt-3">
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
        {title === "Gamma" ? m.stock_detail_options_gex_table() : m.stock_detail_options_dex_table()}
      </h2>
      <div
        class="mt-1 w-full flex flex-row lg:flex order-1 items-center ml-auto pb-1 pt-1 sm:pt-0 w-full order-0 lg:order-1"
      >
        <div class="ml-auto">
          <DownloadData
            {data}
            rawData={rawData?.map((item) => {
              if (title === "Gamma") {
                return {
                  expiry: item?.expiry,
                  call_gex: item?.call_gex,
                  put_gex: item?.put_gex,
                  net_gex: item?.net_gex,
                  put_call_ratio: item?.put_call_ratio,
                };
              } else {
                return {
                  expiry: item?.expiry,
                  call_dex: item?.call_dex,
                  put_dex: item?.put_dex,
                  net_dex: item?.net_dex,
                  put_call_ratio: item?.put_call_ratio,
                };
              }
            })}
            title={`${ticker}_${title === "Gamma" ? "gex" : "dex"}_by_expiry`}
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
                {formatDate(item?.expiry)}
              </td>
              <td class="text-sm text-end whitespace-nowrap">
                {(isGamma ? item?.call_gex : item?.call_dex)?.toLocaleString(
                  "en-US",
                )}
              </td>
              <td class="text-sm text-end whitespace-nowrap">
                {(isGamma ? item?.put_gex : item?.put_dex)?.toLocaleString(
                  "en-US",
                )}
              </td>

              <td class="text-sm text-end whitespace-nowrap">
                {(isGamma ? item?.net_gex : item?.net_dex)?.toLocaleString(
                  "en-US",
                )}
              </td>

              <td class="text-sm text-end whitespace-nowrap">
                {#if item?.put_call_ratio <= 1 && item?.put_call_ratio !== null}
                  <span class="text-emerald-600 dark:text-emerald-400"
                    >{item?.put_call_ratio?.toFixed(2)}</span
                  >
                {:else if item?.put_call_ratio > 1 && item?.put_call_ratio !== null}
                  <span class="text-rose-600 dark:text-rose-400"
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
          <span class="hidden sm:inline">{m.stock_detail_options_common_previous()}</span>
        </Button>
      </div>

      <!-- Page info and rows selector in center -->
      <div class="flex flex-row items-center gap-4">
        <span class="text-sm text-gray-600 dark:text-zinc-300">
          {m.stock_detail_options_common_page_of({ current: currentPage, total: totalPages })}
        </span>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild let:builder>
            <Button
              builders={[builder]}
              class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span class="truncate text-[0.85rem] sm:text-sm"
                >{m.stock_detail_options_common_rows({ count: rowsPerPage })}</span
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
                  class="text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
                >
                  <label
                    on:click={() => changeRowsPerPage(item)}
                    class="inline-flex justify-between w-full items-center cursor-pointer"
                  >
                    <span class="text-sm">{m.stock_detail_options_common_rows({ count: item })}</span>
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
          <span class="hidden sm:inline">{m.stock_detail_options_common_next()}</span>
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
        {m.stock_detail_options_common_back_to_top()} <svg
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

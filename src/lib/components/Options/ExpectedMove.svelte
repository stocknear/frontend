<script lang="ts">
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  export let data;
  export let ticker: string = "";

  let isSubscribed = ["Pro", "Plus"].includes(data?.user?.tier);

  let config = null;

  // Data from backend
  let stockPrice: number = 0;
  let historicalPrices: { date: string; close: number }[] = [];
  let rawData: any[] = [];
  let sortedData: any[] = [];
  let displayList: any[] = [];

  // UI State
  let selectedExpiration: any = null;

  // Pagination state
  let currentPage = 1;
  let rowsPerPage = 20;
  let rowsPerPageOptions = [20, 50, 100];
  let totalPages = 1;
  let pagePathName = $page?.url?.pathname;

  // Initialize data
  $: {
    if (data?.getData) {
      stockPrice = data.getData.stockPrice || 0;
      historicalPrices = data.getData.historicalPrices || [];
      rawData = data.getData.expirations || [];
      sortedData = [...rawData];

      if (rawData.length > 0 && !selectedExpiration) {
        selectedExpiration = rawData[0];
      }

      loadRowsPerPage();
      updatePaginatedData();
    }
  }

  // Watch for mode/expiration changes
  $: if ($mode && historicalPrices?.length > 0 && selectedExpiration) {
    config = plotData() || null;
  }

  // Pagination functions
  function updatePaginatedData() {
    const dataSource = sortedData?.length > 0 ? sortedData : rawData;

    // For non-subscribed users, only show first 6 items
    if (!isSubscribed) {
      displayList = dataSource?.slice(0, 6) || [];
      totalPages = 1;
      return;
    }

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    displayList = dataSource?.slice(startIndex, endIndex) || [];
    totalPages = Math.ceil((dataSource?.length || 0) / rowsPerPage);
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      updatePaginatedData();
    }
  }

  function changeRowsPerPage(newRowsPerPage: number) {
    rowsPerPage = newRowsPerPage;
    currentPage = 1;
    updatePaginatedData();
    saveRowsPerPage();
  }

  function saveRowsPerPage() {
    if (!pagePathName || typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(`${pagePathName}_rowsPerPage`, String(rowsPerPage));
    } catch (e) {}
  }

  function loadRowsPerPage() {
    const currentPath = pagePathName || $page?.url?.pathname;
    if (!currentPath || typeof localStorage === "undefined") {
      rowsPerPage = 20;
      return;
    }
    try {
      const saved = localStorage.getItem(`${currentPath}_rowsPerPage`);
      if (saved && rowsPerPageOptions.includes(Number(saved))) {
        rowsPerPage = Number(saved);
      }
    } catch (e) {
      rowsPerPage = 20;
    }
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return "n/a";
    try {
      const date = new Date(dateStr + "T00:00:00Z");
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      });
    } catch {
      return "n/a";
    }
  }

  function getExpiryTypeLabel(type: string): string {
    return type || "";
  }

  function formatDteLabel(daysToExpiry: number): string {
    if (daysToExpiry == null) return "";
    const dayLabel = daysToExpiry === 1 ? "day" : "days";
    return `(${daysToExpiry} ${dayLabel})`;
  }

  function selectExpiration(exp: any) {
    selectedExpiration = exp;
    config = plotData() || null;
  }

  function plotData() {
    if (!selectedExpiration || historicalPrices.length === 0) return null;

    const isDarkMode = $mode === "dark";
    const textColor = isDarkMode ? "#fff" : "#000";
    const gridColor = isDarkMode ? "#111827" : "#e5e7eb";
    const bgColor = isDarkMode ? "#09090B" : "#fff";

    // Prepare historical price data
    const priceData = historicalPrices.map((p) => [
      new Date(p.date).getTime(),
      p.close,
    ]);

    const today = Date.now();

    // Build upper and lower price projection lines
    const upperData: [number, number][] = [[today, stockPrice]];
    const lowerData: [number, number][] = [[today, stockPrice]];
    const areaRangeData: [number, number, number][] = [
      [today, stockPrice, stockPrice],
    ];

    for (const exp of rawData) {
      if (!exp.upperPrice || !exp.lowerPrice) continue;
      const expDate = new Date(exp.expiration).getTime();
      upperData.push([expDate, exp.upperPrice]);
      lowerData.push([expDate, exp.lowerPrice]);
      areaRangeData.push([expDate, exp.lowerPrice, exp.upperPrice]);
    }

    upperData.sort((a, b) => a[0] - b[0]);
    lowerData.sort((a, b) => a[0] - b[0]);
    areaRangeData.sort((a, b) => a[0] - b[0]);

    const allPrices = [
      ...priceData.map((p) => p[1]),
      ...upperData.map((p) => p[1]),
      ...lowerData.map((p) => p[1]),
    ];
    const minPrice = Math.min(...allPrices) * 0.95;
    const maxPrice = Math.max(...allPrices) * 1.05;

    const options = {
      credits: { enabled: false },
      chart: {
        type: "line",
        backgroundColor: bgColor,
        height: 360,
        animation: false,
        zoomType: "x",
        resetZoomButton: {
          theme: {
            fill: isDarkMode ? "#27272a" : "#f3f4f6",
            stroke: isDarkMode ? "#3f3f46" : "#d1d5db",
            style: { color: isDarkMode ? "#f4f4f5" : "#111827" },
            r: 8,
            states: { hover: { fill: isDarkMode ? "#3f3f46" : "#e5e7eb" } },
          },
          position: { align: "right", x: -10, y: 10 },
        },
      },
      title: {
        text: `<h3 class="mt-3 mb-1 text-sm font-semibold tracking-tight">${ticker} Expected Move Chart</h3>`,
        useHTML: true,
        style: { color: textColor },
      },
      legend: {
        enabled: true,
        align: "center",
        verticalAlign: "top",
        layout: "horizontal",
        itemStyle: { color: textColor },
        symbolWidth: 14,
        symbolRadius: 1,
      },
      xAxis: {
        type: "datetime",
        gridLineWidth: 0,
        crosshair: {
          color: textColor,
          width: 1,
          dashStyle: "Solid",
        },
        labels: {
          style: { color: isDarkMode ? "white" : "#545454" },
          format: "{value:%b %Y}",
        },
        plotLines: [
          {
            value: new Date(selectedExpiration.expiration).getTime(),
            color: isDarkMode ? "#fff" : "#000",
            dashStyle: "Dash",
            width: 1.5,
            label: {
              text: `${formatDate(selectedExpiration.expiration)} (${selectedExpiration.daysToExpiry} ${selectedExpiration.daysToExpiry === 1 ? "day" : "days"}) (${getExpiryTypeLabel(selectedExpiration.expiryType)})`,
              style: {
                color: isDarkMode ? "#fff" : "#000",
              },
            },
            zIndex: 5,
          },
        ],
      },
      yAxis: {
        gridLineWidth: 1,
        gridLineColor: gridColor,
        labels: {
          style: { color: isDarkMode ? "white" : "#545454" },
          format: "${value}",
        },
        title: { text: null },
        opposite: true,
        min: minPrice,
        max: maxPrice,
      },
      tooltip: {
        shared: true,
        useHTML: true,
        animation: false,
        backgroundColor: "rgba(0, 0, 0, 1)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        borderRadius: 4,
        style: { color: "#fff", fontSize: "16px", padding: "10px" },
        formatter: function (this: any): string {
          const points = this.points;
          if (!points || points.length === 0) return "";

          const dateStr = new Date(points[0].x).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          });

          const expData = rawData.find(
            (e) => new Date(e.expiration).getTime() === points[0].x,
          );

          // Header with date and days
          let content = `<span class="text-white text-xs font-[501]">${dateStr}</span>`;
          if (expData) {
            content += ` <span class="text-zinc-400 font-normal text-xs">(${expData.daysToExpiry}d)</span>`;
          }
          content += `<br/>`;

          if (expData) {
            // Expected Move
            content += `<span class="text-white  text-xs">Expected Move:</span> `;
            content += `<span class="text-white font-normal text-xs">±$${expData.expectedMoveAmount?.toFixed(2)} (${expData.expectedMovePercent?.toFixed(2)}%)</span><br/>`;
            // Implied Volatility
            content += `<span class="text-white  text-xs">Implied Volatility:</span> `;
            content += `<span class="text-white font-normal text-xs">${expData.impliedVolatility?.toFixed(2)}%</span><br/>`;
            // Upper Price (green)
            content += `<span class="text-green-500  text-xs">Upper Price:</span> `;
            content += `<span class="text-green-500 font-normal text-xs">$${expData.upperPrice?.toFixed(2)}</span><br/>`;
            // Lower Price (red)
            content += `<span class="text-red-500  text-xs">Lower Price:</span> `;
            content += `<span class="text-red-500 font-normal text-xs">$${expData.lowerPrice?.toFixed(2)}</span>`;
          } else {
            // For historical data points (no expiration data)
            points.forEach((point: any) => {
              if (point.series.name === "Expected Range") return;
              if (
                point.series.name.includes("Price") &&
                !point.series.name.includes("Upper") &&
                !point.series.name.includes("Lower")
              ) {
                content += `<span class="text-white font-semibold text-sm">${point.series.name}:</span> `;
                content += `<span class="text-white font-normal text-sm">$${point.y?.toFixed(2)}</span><br/>`;
              }
            });
          }

          return content;
        },
      },
      plotOptions: {
        series: {
          animation: false,
        },
        line: {
          animation: false,
          marker: { enabled: false },
        },
        arearange: {
          animation: false,
        },
      },
      series: [
        {
          name: `${ticker} Price`,
          data: priceData,
          type: "line",
          color: "#3b82f6",
          lineWidth: 2,
          zIndex: 3,
        },
        {
          name: "Expected Range",
          data: areaRangeData,
          type: "arearange",
          color: "rgba(139, 92, 246, 0.15)",
          fillOpacity: 0.3,
          lineWidth: 0,
          marker: { enabled: false },
          zIndex: 1,
          showInLegend: false,
        },
        {
          name: "Upper Price",
          data: upperData,
          type: "line",
          color: "#22c55e",
          lineWidth: 1.5,
          dashStyle: "ShortDot",
          marker: { enabled: true, radius: 2.5, symbol: "circle" },
          zIndex: 2,
        },
        {
          name: "Lower Price",
          data: lowerData,
          type: "line",
          color: "#ef4444",
          lineWidth: 1.5,
          dashStyle: "ShortDot",
          marker: { enabled: true, radius: 2.5, symbol: "circle" },
          zIndex: 2,
        },
      ],
    };

    return options;
  }

  // Table sorting
  $: columns = [
    { key: "expiration", label: "Expiration", align: "left" },
    { key: "expectedMoveAmount", label: "Expected Move", align: "right" },
    { key: "expectedMovePercent", label: "% Change Move", align: "right" },
    { key: "lowerPrice", label: "Lower Price", align: "right" },
    { key: "upperPrice", label: "Upper Price", align: "right" },
    { key: "impliedVolatility", label: "Implied Volatility", align: "right" },
  ];

  $: sortOrders = {
    expiration: { order: "none", type: "date" },
    expectedMoveAmount: { order: "none", type: "number" },
    expectedMovePercent: { order: "none", type: "number" },
    lowerPrice: { order: "none", type: "number" },
    upperPrice: { order: "none", type: "number" },
    impliedVolatility: { order: "none", type: "number" },
  };

  const sortData = (key: string) => {
    for (const k in sortOrders) {
      if (k !== key) sortOrders[k].order = "none";
    }

    const orderCycle = ["none", "asc", "desc"];
    const currentOrderIndex = orderCycle.indexOf(sortOrders[key].order);
    sortOrders[key].order =
      orderCycle[(currentOrderIndex + 1) % orderCycle.length];

    if (sortOrders[key].order === "none") {
      sortedData = [...rawData];
      currentPage = 1;
      updatePaginatedData();
      return;
    }

    const compareValues = (a: any, b: any) => {
      const { type } = sortOrders[key];
      let valueA, valueB;

      if (type === "date") {
        valueA = new Date(a[key]);
        valueB = new Date(b[key]);
      } else {
        valueA = parseFloat(a[key]) || 0;
        valueB = parseFloat(b[key]) || 0;
      }

      if (sortOrders[key].order === "asc") {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    };

    sortedData = [...rawData].sort(compareValues);
    currentPage = 1;
    updatePaginatedData();
  };

  onMount(() => {
    if (rawData.length > 0) {
      config = plotData() || null;
    }
  });

  // Reactive statement to load pagination settings when page changes
  $: if ($page?.url?.pathname && $page?.url?.pathname !== pagePathName) {
    pagePathName = $page?.url?.pathname;
    loadRowsPerPage();
    updatePaginatedData();
  }
</script>

<div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto mt-2 sm:mt-0">
  <h2
    class="flex flex-row items-center text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white w-fit"
  >
    Expected Move
  </h2>

  <p class="mt-3 mb-2 text-sm text-gray-800 dark:text-zinc-300 leading-relaxed">
    {#if selectedExpiration}
      The expected move for <span class="font-semibold">{ticker}</span> options
      expiring on
      <span class="font-semibold"
        >{formatDate(selectedExpiration.expiration)}</span
      >
      ({selectedExpiration.daysToExpiry}
      {selectedExpiration.daysToExpiry === 1 ? "day" : "days"}) is
      <span class="font-semibold"
        >±${selectedExpiration.expectedMoveAmount?.toFixed(2)} ({selectedExpiration.expectedMovePercent?.toFixed(
          2,
        )}%)</span
      >, with a price range of
      <span class="font-semibold"
        >${selectedExpiration.lowerPrice?.toFixed(2)}</span
      >
      -
      <span class="font-semibold"
        >${selectedExpiration.upperPrice?.toFixed(2)}</span
      >.
    {:else}
      Select an expiration date to view the expected move.
    {/if}
  </p>

  <div class="mt-4 mb-4 flex flex-wrap items-center justify-between gap-3">
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild let:builder>
        <Button
          builders={[builder]}
          class="min-w-[130px] max-w-[240px] sm:w-auto transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span class="text-sm">
            Expiration | {selectedExpiration
              ? formatDate(selectedExpiration.expiration)
              : "Select"}
          </span>
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
        class="min-w-56 w-auto max-w-60 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
      >
        <DropdownMenu.Group class="pb-2">
          {#each rawData as item, index}
            {#if data?.user?.tier === "Pro" || index === 0}
              <DropdownMenu.Item
                on:click={() => selectExpiration(item)}
                class="{selectedExpiration?.expiration === item.expiration
                  ? 'bg-gray-100/70 dark:bg-zinc-900/60'
                  : ''} cursor-pointer hover:text-violet-600 dark:hover:text-violet-400"
              >
                <span>{formatDate(item.expiration)}</span>
                <span class="ml-2 text-xs text-gray-500 dark:text-zinc-400">
                  {formatDteLabel(item.daysToExpiry)}
                </span>
              </DropdownMenu.Item>
            {:else}
              <DropdownMenu.Item
                on:click={() => goto("/pricing")}
                class="cursor-pointer hover:text-violet-600 dark:hover:text-violet-400"
              >
                <span>{formatDate(item.expiration)}</span>
                <span class="ml-2 text-xs text-gray-500 dark:text-zinc-400">
                  {formatDteLabel(item.daysToExpiry)}
                </span>
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
                  ></path>
                </svg>
              </DropdownMenu.Item>
            {/if}
          {/each}
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </div>

  <div class="w-full overflow-hidden m-auto sm:mt-3">
    {#if config !== null}
      <div class="grow">
        <div class="relative">
          <div
            class="mt-5 sm:mt-0 border border-gray-300 dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40"
            use:highcharts={config}
          ></div>
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
        Expected Move by Expiry
      </h2>
      <div
        class="mt-1 w-full flex flex-row lg:flex order-1 items-center ml-auto pb-1 pt-1 sm:pt-0 w-full order-0 lg:order-1"
      >
        <div class="ml-auto">
          <DownloadData {data} {rawData} title={`${ticker}_expected_move`} />
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
            <tr
              class="transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800/50 {index === displayList.length - 1 && !isSubscribed ? 'opacity-[0.15]' : ''}"
              on:click={() => selectExpiration(item)}
            >
              <td class="text-sm text-start whitespace-nowrap">
                {formatDate(item.expiration)}
                <span class="text-xs text-gray-500">
                  ({item.daysToExpiry}
                  {item.daysToExpiry === 1 ? "day" : "days"}) ({getExpiryTypeLabel(
                    item.expiryType,
                  )})
                </span>
              </td>
              <td class="text-sm text-end whitespace-nowrap">
                {#if item.expectedMoveAmount}
                  ±{item.expectedMoveAmount?.toFixed(2)}
                {:else}
                  <span class="text-gray-400">-</span>
                {/if}
              </td>
              <td class="text-sm text-end whitespace-nowrap">
                {#if item.expectedMovePercent}
                  ±{item.expectedMovePercent?.toFixed(2)}%
                {:else}
                  <span class="text-gray-400">-</span>
                {/if}
              </td>
              <td class="text-sm text-end whitespace-nowrap">
                {#if item.lowerPrice}
                  {item.lowerPrice?.toFixed(2)}
                  {@const lowerPct =
                    ((item.lowerPrice - stockPrice) / stockPrice) * 100}
                  <span
                    class="ml-1 {lowerPct >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'}"
                  >
                    ({lowerPct >= 0 ? "+" : ""}{lowerPct?.toFixed(2)}%)
                  </span>
                {:else}
                  <span class="text-gray-400">-</span>
                {/if}
              </td>
              <td class="text-sm text-end whitespace-nowrap">
                {#if item.upperPrice}
                  {item.upperPrice?.toFixed(2)}
                  {@const upperPct =
                    ((item.upperPrice - stockPrice) / stockPrice) * 100}
                  <span
                    class="ml-1 {upperPct >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'}"
                  >
                    ({upperPct >= 0 ? "+" : ""}{upperPct?.toFixed(2)}%)
                  </span>
                {:else}
                  <span class="text-gray-400">-</span>
                {/if}
              </td>
              <td class="text-sm text-end whitespace-nowrap">
                {#if item.impliedVolatility}
                  {item.impliedVolatility?.toFixed(2)}%
                {:else}
                  <span class="text-gray-400">-</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  {#if displayList?.length > 0 && totalPages > 0 && isSubscribed}
    <div class="flex flex-row items-center justify-between mt-8 sm:mt-5">
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

      <div class="flex flex-row items-center gap-4">
        <span class="text-sm text-gray-600 dark:text-zinc-300">
          Page {currentPage} of {totalPages}
        </span>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild let:builder>
            <Button
              builders={[builder]}
              class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate"
            >
              <span class="truncate text-[0.85rem] sm:text-sm"
                >{rowsPerPage} Rows</span
              >
              <svg
                class="ml-0.5 mt-1 h-5 w-5 inline-block shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
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
            class="w-auto min-w-40 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
          >
            <DropdownMenu.Group class="pb-2">
              {#each rowsPerPageOptions as item}
                <DropdownMenu.Item
                  on:click={() => changeRowsPerPage(item)}
                  class="hover:text-violet-600 dark:hover:text-violet-400 transition cursor-pointer"
                >
                  <span class="text-sm">{item} Rows</span>
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
          class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span class="hidden sm:inline">Next</span>
          <svg
            class="h-5 w-5 inline-block shrink-0 -rotate-90"
            viewBox="0 0 20 20"
            fill="currentColor"
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

    <div class="flex justify-center mt-4">
      <button
        on:click={scrollToTop}
        class="cursor-pointer text-sm font-medium text-gray-800 dark:text-zinc-300 transition hover:text-violet-600 dark:hover:text-violet-400"
      >
        Back to Top
        <svg
          class="h-5 w-5 inline-block shrink-0 rotate-180"
          viewBox="0 0 20 20"
          fill="currentColor"
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

  <UpgradeToPro {data} display={true} />
</div>

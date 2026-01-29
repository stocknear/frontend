<script lang="ts">
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";
  import { page } from "$app/stores";
  import { onMount } from "svelte";

  export let data;
  export let ticker: string = "";

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
        selectedExpiration = rawData[rawData.length - 1];
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

    for (const exp of rawData) {
      if (!exp.upperPrice || !exp.lowerPrice) continue;
      const expDate = new Date(exp.expiration).getTime();
      upperData.push([expDate, exp.upperPrice]);
      lowerData.push([expDate, exp.lowerPrice]);
    }

    upperData.sort((a, b) => a[0] - b[0]);
    lowerData.sort((a, b) => a[0] - b[0]);

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
            value: today,
            color: textColor,
            dashStyle: "Dash",
            width: 1.5,
            label: {
              text: "Today",
              style: { color: textColor, fontSize: "10px" },
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
        plotLines: [
          {
            value: stockPrice,
            color: "#3b82f6",
            dashStyle: "Dash",
            width: 2,
            zIndex: 5,
            label: {
              text: `Current: $${stockPrice?.toFixed(2)}`,
              align: "left",
              style: { color: "#3b82f6", fontSize: "11px" },
            },
          },
        ],
      },
      tooltip: {
        shared: false,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 1)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        style: { color: "#fff", fontSize: "14px", padding: "10px" },
        borderRadius: 4,
        formatter: function (this: any): string {
          const point = this.point;
          const series = this.series;
          const dateStr = new Date(point.x).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          });

          if (series.name === `${ticker} Price`) {
            return `<b>${dateStr}</b><br/>Price: <b>$${point.y?.toFixed(2)}</b>`;
          }

          const expData = rawData.find(
            (e) => new Date(e.expiration).getTime() === point.x
          );

          if (expData) {
            return `
              <div>
                <b>${dateStr} (${expData.daysToExpiry}d)</b><br/>
                Expected Move: <b>±$${expData.expectedMoveAmount?.toFixed(2)} (${expData.expectedMovePercent?.toFixed(2)}%)</b><br/>
                IV: <b>${expData.impliedVolatility?.toFixed(2)}%</b><br/>
                <span style="color: #22c55e;">Upper: $${expData.upperPrice?.toFixed(2)}</span><br/>
                <span style="color: #ef4444;">Lower: $${expData.lowerPrice?.toFixed(2)}</span>
              </div>
            `;
          }
          return `<b>${dateStr}</b><br/>$${point.y?.toFixed(2)}`;
        },
      },
      plotOptions: {
        animation: false,
        line: {
          marker: { enabled: false },
        },
      },
      series: [
        {
          name: `${ticker} Price`,
          data: priceData,
          type: "line",
          color: "#3b82f6",
          lineWidth: 2,
          zIndex: 1,
        },
        {
          name: "Upper Price",
          data: upperData,
          type: "line",
          color: "#22c55e",
          lineWidth: 2,
          dashStyle: "Dot",
          marker: { enabled: true, radius: 2.5, symbol: "circle" },
          zIndex: 2,
        },
        {
          name: "Lower Price",
          data: lowerData,
          type: "line",
          color: "#ef4444",
          lineWidth: 2,
          dashStyle: "Dot",
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
    { key: "expectedMoveAmount", label: "Expected Move ($)", align: "right" },
    { key: "expectedMovePercent", label: "Expected Move (%)", align: "right" },
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
    sortOrders[key].order = orderCycle[(currentOrderIndex + 1) % orderCycle.length];

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
      The expected move for <span class="font-semibold">{ticker}</span> options expiring on
      <span class="font-semibold text-blue-600 dark:text-blue-400">{formatDate(selectedExpiration.expiration)}</span>
      ({selectedExpiration.daysToExpiry} {selectedExpiration.daysToExpiry === 1 ? "day" : "days"})
      is <span class="font-semibold text-violet-600 dark:text-violet-400">±${selectedExpiration.expectedMoveAmount?.toFixed(2)} ({selectedExpiration.expectedMovePercent?.toFixed(2)}%)</span>,
      with a price range of
      <span class="font-semibold text-red-500">${selectedExpiration.lowerPrice?.toFixed(2)}</span> -
      <span class="font-semibold text-green-500">${selectedExpiration.upperPrice?.toFixed(2)}</span>.
    {:else}
      Select an expiration date to view the expected move.
    {/if}
  </p>

  <div class="mt-7 flex flex-wrap items-center justify-between gap-3">
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild let:builder>
        <Button
          builders={[builder]}
          class="w-fit transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate"
        >
          <span class="truncate text-sm">
            Expiration | {selectedExpiration ? `${selectedExpiration.expiration} (${selectedExpiration.daysToExpiry}d)` : "Select"}
          </span>
          <svg
            class="-mr-1 ml-2 h-5 w-5 inline-block"
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
        align="start"
        sideOffset={10}
        class="min-w-56 w-auto max-w-64 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
      >
        <DropdownMenu.Group class="pb-2">
          {#each rawData as item, index}
            {#if data?.user?.tier === "Pro" || index === 0}
              <DropdownMenu.Item
                on:click={() => selectExpiration(item)}
                class="cursor-pointer hover:text-violet-600 dark:hover:text-violet-400"
              >
                {formatDate(item.expiration)} ({item.daysToExpiry}d) ({getExpiryTypeLabel(item.expiryType)})
              </DropdownMenu.Item>
            {:else}
              <DropdownMenu.Item
                on:click={() => window.location.href = "/pricing"}
                class="cursor-pointer hover:text-violet-600 dark:hover:text-violet-400"
              >
                {formatDate(item.expiration)} ({item.daysToExpiry}d)
                <svg
                  class="ml-1 size-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
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
        {ticker} Expected Move by Expiry
      </h2>
      <div
        class="mt-1 w-full flex flex-row lg:flex order-1 items-center ml-auto pb-1 pt-1 sm:pt-0 w-full order-0 lg:order-1"
      >
        <div class="ml-auto">
          <DownloadData {data} rawData={rawData} title={`${ticker}_expected_move`} />
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
          {#each displayList as item}
            <tr
              class="transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800/50"
              on:click={() => selectExpiration(item)}
            >
              <td class="text-sm text-start whitespace-nowrap">
                {formatDate(item.expiration)}
                <span class="text-xs text-gray-500">
                  ({item.daysToExpiry} {item.daysToExpiry === 1 ? "day" : "days"}) ({getExpiryTypeLabel(item.expiryType)})
                </span>
              </td>
              <td class="text-sm text-end whitespace-nowrap">
                {#if item.expectedMoveAmount}
                  ±${item.expectedMoveAmount?.toFixed(2)}
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
              <td class="text-sm text-end whitespace-nowrap text-red-500">
                {#if item.lowerPrice}
                  ${item.lowerPrice?.toFixed(2)}
                {:else}
                  <span class="text-gray-400">-</span>
                {/if}
              </td>
              <td class="text-sm text-end whitespace-nowrap text-green-500">
                {#if item.upperPrice}
                  ${item.upperPrice?.toFixed(2)}
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

  {#if displayList?.length > 0 && totalPages > 0}
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
              <span class="truncate text-[0.85rem] sm:text-sm">{rowsPerPage} Rows</span>
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
</div>

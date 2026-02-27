<script lang="ts">
  import { mode } from "mode-watcher";
  import { abbreviateNumber } from "$lib/utils";
  import highcharts from "$lib/highcharts.ts";
  import { screenWidth } from "$lib/store";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";

  export let item: any = null;
  export let isOpen = false;
  export let onClose: () => void = () => {};

  let isLoading = false;
  let hasError = false;
  let rawHistory: any[] = [];
  let chartConfig: any = null;
  let selectGraphType = "Price";
  let selectedTimePeriod = "3M";

  const chartTypes = ["Price", "Vol/OI", "IV"];
  const timePeriodLabels: Record<string, string> = {
    "1W": "1 Week",
    "1M": "1 Month",
    "3M": "3 Months",
    "6M": "6 Months",
    "1Y": "1 Year",
  };

  let latestStats: any = null;

  $: if (isOpen && item?.option_symbol && item?.ticker) {
    fetchContractHistory();
  }

  $: if (!isOpen) {
    rawHistory = [];
    chartConfig = null;
    latestStats = null;
    hasError = false;
    selectGraphType = "Price";
    selectedTimePeriod = "3M";
  }

  $: if (rawHistory.length > 0 && (selectGraphType || selectedTimePeriod)) {
    chartConfig = plotData();
  }

  $: if (rawHistory.length > 0) {
    const sorted = [...rawHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    latestStats = sorted[0] || null;
  }

  async function fetchContractHistory() {
    isLoading = true;
    hasError = false;
    rawHistory = [];
    chartConfig = null;
    latestStats = null;

    try {
      const res = await fetch("/api/options-contract-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: item.ticker,
          contract: item.option_symbol,
        }),
      });

      if (!res.ok) {
        hasError = true;
        return;
      }

      const output = await res.json();
      rawHistory = output?.history || [];

      if (rawHistory.length === 0) {
        hasError = true;
      }
    } catch {
      hasError = true;
    } finally {
      isLoading = false;
    }
  }

  function filterDataByTimePeriod(data: any[], timePeriod: string) {
    if (!data || data.length === 0) return [];

    const now = new Date();
    let thresholdDate: Date;

    switch (timePeriod) {
      case "1W":
        thresholdDate = new Date(now);
        thresholdDate.setDate(now.getDate() - 7);
        break;
      case "1M":
        thresholdDate = new Date(now);
        thresholdDate.setMonth(now.getMonth() - 1);
        break;
      case "3M":
        thresholdDate = new Date(now);
        thresholdDate.setMonth(now.getMonth() - 3);
        break;
      case "6M":
        thresholdDate = new Date(now);
        thresholdDate.setMonth(now.getMonth() - 6);
        break;
      case "1Y":
        thresholdDate = new Date(now);
        thresholdDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        thresholdDate = new Date(0);
        break;
    }

    return data.filter((item) => new Date(item?.date) >= thresholdDate);
  }

  function plotData() {
    const sortedData =
      [...rawHistory].sort(
        (a, b) => new Date(a?.date).getTime() - new Date(b?.date).getTime(),
      ) || [];

    const timeFilteredData = filterDataByTimePeriod(
      sortedData,
      selectedTimePeriod,
    );

    const filteredData = timeFilteredData.filter((item) => {
      const close = item?.close ?? item?.mark;
      return close > 0;
    });

    if (filteredData.length === 0) return null;

    let series: any[] = [];

    if (selectGraphType === "Price") {
      series = [
        {
          name: "Option Price",
          type: "spline",
          data: filteredData.map((item) => [
            new Date(item.date).getTime(),
            item?.close ?? item?.mark,
          ]),
          color: $mode === "light" ? "#7c3aed" : "#a78bfa",
          yAxis: 0,
          lineWidth: 2,
          animation: false,
          marker: { enabled: false },
        },
      ];
    } else if (selectGraphType === "Vol/OI") {
      series = [
        {
          name: "Option Price",
          type: "spline",
          data: filteredData.map((item) => [
            new Date(item.date).getTime(),
            item?.mark,
          ]),
          color: "#ff2f1f",
          yAxis: 2,
          lineWidth: 1.3,
          animation: false,
          marker: { enabled: false },
        },
        {
          name: "Volume",
          type: "column",
          data: filteredData.map((item) => [
            new Date(item.date).getTime(),
            item.volume,
          ]),
          color: "#FD8789",
          borderColor: "#FD8789",
          borderRadius: "1px",
          yAxis: 0,
          animation: false,
        },
        {
          name: "OI",
          type: "column",
          data: filteredData.map((item) => [
            new Date(item.date).getTime(),
            item.open_interest,
          ]),
          color: "#33ABA0",
          borderColor: "#33ABA0",
          borderRadius: "1px",
          yAxis: 0,
          animation: false,
        },
      ];
    } else if (selectGraphType === "IV") {
      series = [
        {
          name: "Option Price",
          type: "spline",
          data: filteredData.map((item) => [
            new Date(item.date).getTime(),
            item?.close ?? item?.mark,
          ]),
          color: $mode === "light" ? "#7c3aed" : "#a78bfa",
          yAxis: 2,
          lineWidth: 1.5,
          animation: false,
          marker: { enabled: false },
        },
        {
          name: "IV",
          type: "spline",
          data: filteredData.map((item) => [
            new Date(item.date).getTime(),
            Math.ceil(item?.implied_volatility * 100 * 100) / 100,
          ]),
          color: $mode === "light" ? "black" : "white",
          yAxis: 0,
          animation: false,
          marker: { enabled: false },
        },
      ];
    }

    const modalBg = $mode === "light" ? "#fff" : "#18181b";

    return {
      chart: {
        backgroundColor: modalBg,
        animation: false,
        height: $screenWidth < 640 ? 240 : 360,
      },
      credits: { enabled: false },
      title: { text: "" },
      legend: {
        enabled: true,
        align: "center",
        verticalAlign: "top",
        layout: "horizontal",
        squareSymbol: false,
        symbolWidth: 20,
        symbolHeight: 12,
        symbolRadius: 0,
        itemStyle: { color: $mode === "light" ? "black" : "white" },
      },
      plotOptions: {
        series: {
          animation: false,
          marker: { enabled: false },
          states: { hover: { enabled: false } },
          legendSymbol: "rectangle",
        },
      },
      xAxis: {
        type: "datetime",
        endOnTick: false,
        crosshair: {
          color: $mode === "light" ? "black" : "white",
          width: 1,
          dashStyle: "Solid",
        },
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
          distance: 20,
          formatter: function () {
            return new Date(this.value).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            });
          },
        },
        tickPositioner: function () {
          const positions: number[] = [];
          const info = this.getExtremes();
          const tickCount = 5;
          const interval = Math.max(
            1,
            Math.floor((info.max - info.min) / tickCount),
          );
          for (let i = 0; i <= tickCount; i++) {
            positions.push(info.min + i * interval);
          }
          return positions;
        },
      },
      yAxis: [
        {
          gridLineWidth: 1,
          gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
          labels: {
            style: { color: $mode === "light" ? "#545454" : "white" },
          },
          title: { text: null },
          opposite: true,
        },
        {
          title: { text: null },
          gridLineWidth: 0,
          labels: { enabled: false },
        },
        {
          title: { text: null },
          gridLineWidth: 0,
          labels: { enabled: false },
        },
      ],
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 1)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        style: { color: "#fff", fontSize: "16px", padding: "10px" },
        borderRadius: 4,
        formatter: function () {
          const extremes = this.series.chart.xAxis[0].getExtremes();
          const spansMultipleYears =
            new Date(extremes.max).getUTCFullYear() !==
            new Date(extremes.min).getUTCFullYear();

          const headerOptions = spansMultipleYears
            ? {
                year: "numeric",
                month: "short",
                day: "numeric",
                timeZone: "UTC",
              }
            : { month: "short", day: "numeric", timeZone: "UTC" };

          let tooltipContent = `<span class="m-auto text-[1rem] font-[501]">${new Date(
            this.x,
          ).toLocaleDateString("en-US", headerOptions)}</span><br>`;

          this.points.forEach((point: any) => {
            let suffix = "";
            if (point.series.name === "IV") suffix = "%";

            const formatValue = (val: number, name: string) => {
              if (val === null || val === undefined) return "N/A";
              if (name === "IV") return val?.toFixed(2);
              if (name === "Option Price") return "$" + val?.toFixed(2);
              return val?.toLocaleString("en-US");
            };

            const formatted = formatValue(point?.y, point.series.name);
            tooltipContent += `
            <span style="display:inline-block; width:10px; height:10px; background-color:${point.color}; border-radius:50%; margin-right:5px;"></span>
            <span class="font-normal text-sm">${point.series.name}:</span>
            <span class="font-normal text-sm">${formatted}${suffix}</span><br>`;
          });

          return tooltipContent;
        },
      },
      series: series,
    };
  }

  function formatDate(dateString: string): string {
    if (!dateString) return "n/a";
    const date = new Date(dateString + "T00:00:00Z");
    if (isNaN(date.getTime())) return "n/a";
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(date.getUTCDate()).padStart(2, "0");
    const yy = String(date.getUTCFullYear()).slice(-2);
    return `${mm}/${dd}/${yy}`;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen && item}
  <div
    class="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
    on:click|self={onClose}
    role="dialog"
    aria-modal="true"
  >
    <div
      class="relative w-full max-w-3xl max-h-[100vh] sm:max-h-[90vh] overflow-auto bg-white dark:bg-zinc-900 sm:rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-2xl"
      on:click|stopPropagation
    >
      <!-- Header -->
      <div
        class="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-4 sm:px-6 py-4 flex items-start justify-between"
      >
        <div>
          <h3
            class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white"
          >
            {item.ticker}
            <span
              class="text-sm font-normal {item.put_call === 'Calls'
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-rose-700 dark:text-rose-400'}"
            >
              {item.put_call}
            </span>
          </h3>
          <span class="text-sm text-gray-600 dark:text-zinc-400">
            ${item.strike_price} Strike · Exp {formatDate(
              item.date_expiration,
            )}
          </span>
        </div>
        <button
          on:click={onClose}
          class="cursor-pointer p-1 rounded-full text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
        >
          <svg
            class="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {#if isLoading}
        <!-- Loading skeleton -->
        <div class="px-4 sm:px-6 py-4">
          <div
            class="w-full bg-gray-100 dark:bg-zinc-800/60 rounded-lg animate-pulse"
            style="height: {$screenWidth < 640 ? 240 : 360}px"
          ></div>
        </div>
        <div
          class="px-4 sm:px-6 pb-6 border-t border-gray-200 dark:border-zinc-800 pt-4"
        >
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-6">
            {#each Array(8) as _}
              <div class="space-y-2">
                <div
                  class="h-4 w-20 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse"
                ></div>
                <div
                  class="h-4 w-14 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse"
                ></div>
              </div>
            {/each}
          </div>
        </div>
      {:else if hasError || rawHistory.length === 0}
        <!-- Error / Empty state -->
        <div class="px-4 sm:px-6 py-12 text-center">
          <svg
            class="w-12 h-12 mx-auto text-gray-300 dark:text-zinc-600 mb-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path
              d="M9 12H4.6C4.03995 12 3.75992 12 3.54601 12.109C3.35785 12.2049 3.20487 12.3578 3.10899 12.546C3 12.7599 3 13.0399 3 13.6V19.4C3 19.9601 3 20.2401 3.10899 20.454C3.20487 20.6422 3.35785 20.7951 3.54601 20.891C3.75992 21 4.03995 21 4.6 21H9M9 21H15M9 21L9 8.6C9 8.03995 9 7.75992 9.10899 7.54601C9.20487 7.35785 9.35785 7.20487 9.54601 7.10899C9.75992 7 10.0399 7 10.6 7H13.4C13.9601 7 14.2401 7 14.454 7.10899C14.6422 7.20487 14.7951 7.35785 14.891 7.54601C15 7.75992 15 8.03995 15 8.6V21M15 21H19.4C19.9601 21 20.2401 21 20.454 20.891C20.6422 20.7951 20.7951 20.6422 20.891 20.454C21 20.2401 21 19.9601 21 19.4V4.6C21 4.03995 21 3.75992 20.891 3.54601C20.7951 3.35785 20.6422 3.20487 20.454 3.10899C20.2401 3 19.9601 3 19.4 3H16.6C16.0399 3 15.7599 3 15.546 3.10899C15.3578 3.20487 15.2049 3.35785 15.109 3.54601C15 3.75992 15 4.03995 15 4.6V8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <p class="text-gray-500 dark:text-zinc-400 text-sm">
            No contract data available for this option.
          </p>
        </div>
      {:else}
        <!-- Chart Controls -->
        <div
          class="px-4 sm:px-6 pt-4 flex flex-row items-center justify-end gap-x-3"
        >
          <!-- Chart Type Dropdown -->
          <div class="relative inline-block text-left">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild let:builder>
                <Button
                  builders={[builder]}
                  class="w-full transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate"
                >
                  <span class="truncate text-xs sm:text-sm"
                    >{selectGraphType}</span
                  >
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
                class="w-40 h-fit max-h-72 overflow-y-auto scroller rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
              >
                <DropdownMenu.Label
                  class="text-xs font-medium text-gray-500 dark:text-zinc-400"
                >
                  Chart Type
                </DropdownMenu.Label>
                <DropdownMenu.Separator />
                <DropdownMenu.Group>
                  {#each chartTypes as type}
                    <DropdownMenu.Item
                      on:click={() => (selectGraphType = type)}
                      class="cursor-pointer text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400"
                    >
                      {type}
                    </DropdownMenu.Item>
                  {/each}
                </DropdownMenu.Group>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>

          <!-- Time Period Dropdown -->
          <div class="relative inline-block text-left">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild let:builder>
                <Button
                  builders={[builder]}
                  class="w-full transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate"
                >
                  <span class="truncate text-xs sm:text-sm"
                    >{selectedTimePeriod}</span
                  >
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
                class="w-40 h-fit max-h-72 overflow-y-auto scroller rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
              >
                <DropdownMenu.Label
                  class="text-xs font-medium text-gray-500 dark:text-zinc-400"
                >
                  Time Period
                </DropdownMenu.Label>
                <DropdownMenu.Separator />
                <DropdownMenu.Group>
                  {#each Object.entries(timePeriodLabels) as [key, label]}
                    <DropdownMenu.Item
                      on:click={() => (selectedTimePeriod = key)}
                      class="cursor-pointer text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400"
                    >
                      {label}
                    </DropdownMenu.Item>
                  {/each}
                </DropdownMenu.Group>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        </div>

        <!-- Chart -->
        <div class="px-4 sm:px-6 py-4">
          {#if chartConfig}
            <div
              use:highcharts={chartConfig}
              class="rounded-2xl border border-gray-300 dark:border-zinc-700"
            ></div>
          {:else}
            <div
              class="flex items-center justify-center rounded-2xl border border-gray-300 dark:border-zinc-700 text-gray-400 dark:text-zinc-500 text-sm"
              style="height: {$screenWidth < 640 ? 240 : 360}px"
            >
              No data for selected period
            </div>
          {/if}
        </div>

        <!-- Stats Grid -->
        {#if latestStats}
          <div
            class="px-4 sm:px-6 pb-4 border-t border-gray-200 dark:border-zinc-800 pt-4"
          >
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-6">
              <div>
                <span
                  class="text-xs font-medium text-gray-500 dark:text-zinc-400"
                  >Last Price</span
                >
                <div
                  class="text-sm font-semibold text-gray-900 dark:text-white"
                >
                  ${(latestStats?.close ?? latestStats?.mark)?.toFixed(2) ??
                    "n/a"}
                </div>
              </div>
              <div>
                <span
                  class="text-xs font-medium text-gray-500 dark:text-zinc-400"
                  >Volume</span
                >
                <div
                  class="text-sm font-semibold text-gray-900 dark:text-white"
                >
                  {latestStats?.volume?.toLocaleString("en-US") ?? "n/a"}
                </div>
              </div>
              <div>
                <span
                  class="text-xs font-medium text-gray-500 dark:text-zinc-400"
                  >Open Interest</span
                >
                <div
                  class="text-sm font-semibold text-gray-900 dark:text-white"
                >
                  {latestStats?.open_interest?.toLocaleString("en-US") ?? "n/a"}
                </div>
              </div>
              <div>
                <span
                  class="text-xs font-medium text-gray-500 dark:text-zinc-400"
                  >IV</span
                >
                <div
                  class="text-sm font-semibold text-gray-900 dark:text-white"
                >
                  {latestStats?.implied_volatility != null
                    ? (latestStats.implied_volatility * 100).toFixed(2) + "%"
                    : "n/a"}
                </div>
              </div>
              <div>
                <span
                  class="text-xs font-medium text-gray-500 dark:text-zinc-400"
                  >Delta</span
                >
                <div
                  class="text-sm font-semibold text-gray-900 dark:text-white"
                >
                  {latestStats?.delta?.toFixed(4) ?? "n/a"}
                </div>
              </div>
              <div>
                <span
                  class="text-xs font-medium text-gray-500 dark:text-zinc-400"
                  >Gamma</span
                >
                <div
                  class="text-sm font-semibold text-gray-900 dark:text-white"
                >
                  {latestStats?.gamma?.toFixed(4) ?? "n/a"}
                </div>
              </div>
              <div>
                <span
                  class="text-xs font-medium text-gray-500 dark:text-zinc-400"
                  >Theta</span
                >
                <div
                  class="text-sm font-semibold text-gray-900 dark:text-white"
                >
                  {latestStats?.theta?.toFixed(4) ?? "n/a"}
                </div>
              </div>
              <div>
                <span
                  class="text-xs font-medium text-gray-500 dark:text-zinc-400"
                  >Vega</span
                >
                <div
                  class="text-sm font-semibold text-gray-900 dark:text-white"
                >
                  {latestStats?.vega?.toFixed(4) ?? "n/a"}
                </div>
              </div>
            </div>
          </div>
        {/if}

        <!-- Footer link -->
        <div
          class="px-4 sm:px-6 pb-4 pt-2 border-t border-gray-200 dark:border-zinc-800"
        >
          <a
            href="/stocks/{item.ticker}/options/contract-lookup?contract={item.option_symbol}"
            class="text-sm text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-1"
          >
            View Full Contract History
            <svg
              class="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </a>
        </div>
      {/if}
    </div>
  </div>
{/if}

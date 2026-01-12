<script lang="ts">
  import { screenWidth } from "$lib/store";
  import { abbreviateNumber } from "$lib/utils";
  import VirtualList from "svelte-tiny-virtual-list";
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";
  import { mode } from "mode-watcher";
  import { browser } from "$app/environment";

  export let data;
  export let displayedData = [];
  export let filteredData = [];
  export let rawData = [];

  // Column reordering
  const defaultColumns = [
    { key: "date", label: "Date", align: "start" },
    { key: "ticker", label: "Symbol", align: "end" },
    { key: "price", label: "Price", align: "end" },
    { key: "premium", label: "Avg. Paid", align: "end" },
    { key: "size", label: "Size", align: "end" },
    { key: "volume", label: "Volume", align: "end" },
    { key: "sizeVolRatio", label: "% Size / Vol", align: "end" },
    { key: "sizeAvgVolRatio", label: "% Size / Avg Vol", align: "end" },
    { key: "transactionType", label: "Type", align: "end" },
    { key: "exchange", label: "Exchange", align: "end" },
    { key: "assetType", label: "Asset type", align: "end" },
  ];

  const COLUMN_ORDER_KEY = "unusualOrderFlowColumnOrder";

  let columns = [...defaultColumns];
  let customColumnOrder = false;

  // Load saved column order from localStorage
  if (browser) {
    const saved = localStorage.getItem(COLUMN_ORDER_KEY);
    if (saved) {
      try {
        const savedOrder = JSON.parse(saved);
        const reordered = savedOrder
          .map((key: string) => defaultColumns.find((col) => col.key === key))
          .filter(Boolean);
        if (reordered.length === defaultColumns.length) {
          columns = reordered;
          // Check if order differs from default
          customColumnOrder = savedOrder.some(
            (key: string, i: number) => key !== defaultColumns[i].key,
          );
        }
      } catch {
        // ignore
      }
    }
  }

  // Drag-and-drop state
  let draggedColumnIndex: number | null = null;
  let dragOverColumnIndex: number | null = null;

  function handleDragStart(event: DragEvent, index: number) {
    draggedColumnIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
    }
    const target = event.target as HTMLElement;
    target.style.opacity = "0.5";
  }

  function handleDragEnd(event: DragEvent) {
    const target = event.target as HTMLElement;
    target.style.opacity = "1";
    draggedColumnIndex = null;
    dragOverColumnIndex = null;
  }

  function handleDragOver(event: DragEvent, index: number) {
    if (draggedColumnIndex === null) return;
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
    if (index !== draggedColumnIndex) {
      dragOverColumnIndex = index;
    }
  }

  function handleDragLeave(event: DragEvent) {
    // Only reset if we're leaving the element completely
    const relatedTarget = event.relatedTarget as HTMLElement;
    const currentTarget = event.currentTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      dragOverColumnIndex = null;
    }
  }

  function handleDrop(event: DragEvent, targetIndex: number) {
    event.preventDefault();
    if (draggedColumnIndex === null || draggedColumnIndex === targetIndex)
      return;

    const newColumns = [...columns];
    const [removed] = newColumns.splice(draggedColumnIndex, 1);
    newColumns.splice(targetIndex, 0, removed);
    columns = newColumns;

    // Save to localStorage
    if (browser) {
      const order = columns.map((col) => col.key);
      localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(order));
      customColumnOrder = order.some(
        (key, i) => key !== defaultColumns[i].key,
      );
    }
    draggedColumnIndex = null;
    dragOverColumnIndex = null;
  }

  function resetColumnOrder() {
    columns = [...defaultColumns];
    customColumnOrder = false;
    if (browser) {
      localStorage.removeItem(COLUMN_ORDER_KEY);
    }
  }

  export { resetColumnOrder, customColumnOrder };

  function formatToNewYorkTime(isoString) {
    const date = new Date(isoString);
    const options = {
      year: "2-digit",
      month: "numeric",
      day: "2-digit",
      hour: "numeric",
      minute: "numeric",
      timeZone: "America/New_York",
      hour12: true,
    };
    const formatter = new Intl.DateTimeFormat("en-US", options);
    const parts = formatter.formatToParts(date);

    const year = parts.find((p) => p.type === "year").value;
    const month = parts.find((p) => p.type === "month").value;
    const day = parts.find((p) => p.type === "day").value.padStart(2, "0");
    const hour = parts.find((p) => p.type === "hour").value.padStart(2, "0");
    const minute = parts
      .find((p) => p.type === "minute")
      .value.padStart(2, "0");
    const ampm = parts.find((p) => p.type === "dayPeriod").value;

    return `${month}/${day}/${year} ${hour}:${minute} ${ampm}`;
  }

  let sortOrders = {
    date: "none",
    ticker: "none",
    price: "none",
    premium: "none",
    assetType: "none",
    volume: "none",
    sizeAvgVolRatio: "none",
    sizeVolRatio: "none",
    size: "none",
    transactionType: "none",
    exchange: "none",
  };

  function sortData(key) {
    for (const k in sortOrders) {
      if (k !== key) sortOrders[k] = "none";
    }

    const orderCycle = ["none", "asc", "desc"];
    const currentOrderIndex = orderCycle.indexOf(sortOrders[key]);
    sortOrders[key] = orderCycle[(currentOrderIndex + 1) % orderCycle.length];

    const sortOrder = sortOrders[key];
    const originalData =
      filteredData?.length !== 0 ? [...filteredData] : [...rawData];
    if (sortOrder === "none") {
      displayedData = originalData;
      return;
    }

    const compareFunctions = {
      ticker: (a, b) => {
        const tickerA = a.ticker.toUpperCase();
        const tickerB = b.ticker.toUpperCase();
        return sortOrder === "asc"
          ? tickerA.localeCompare(tickerB)
          : tickerB.localeCompare(tickerA);
      },
      transactionType: (a, b) => {
        const transactionTypeA = a.transactionType || "";
        const transactionTypeB = b.transactionType || "";
        if (transactionTypeA === "" && transactionTypeB !== "") return 1;
        if (transactionTypeB === "" && transactionTypeA !== "") return -1;
        return sortOrder === "asc"
          ? transactionTypeA
              .toUpperCase()
              .localeCompare(transactionTypeB.toUpperCase())
          : transactionTypeB
              .toUpperCase()
              .localeCompare(transactionTypeA.toUpperCase());
      },
      date: (a, b) =>
        sortOrder === "asc"
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date),
      price: (a, b) =>
        sortOrder === "asc"
          ? parseFloat(a.price) - parseFloat(b.price)
          : parseFloat(b.price) - parseFloat(a.price),
      premium: (a, b) =>
        sortOrder === "asc"
          ? parseFloat(a.premium) - parseFloat(b.premium)
          : parseFloat(b.premium) - parseFloat(a.premium),
      size: (a, b) =>
        sortOrder === "asc"
          ? parseFloat(a?.size) - parseFloat(b?.size)
          : parseFloat(b?.size) - parseFloat(a?.size),
      volume: (a, b) =>
        sortOrder === "asc"
          ? parseFloat(a.volume) - parseFloat(b.volume)
          : parseFloat(b.volume) - parseFloat(a.volume),
      sizeVolRatio: (a, b) =>
        sortOrder === "asc"
          ? parseFloat(a.sizeVolRatio) - parseFloat(b.sizeVolRatio)
          : parseFloat(b.sizeVolRatio) - parseFloat(a.sizeVolRatio),
      sizeAvgVolRatio: (a, b) =>
        sortOrder === "asc"
          ? parseFloat(a.sizeAvgVolRatio) - parseFloat(b.sizeAvgVolRatio)
          : parseFloat(b.sizeAvgVolRatio) - parseFloat(a.sizeAvgVolRatio),
      assetType: (a, b) => {
        const typeOrder = { STOCK: 1, ETF: 2 };
        const typeA = typeOrder[a.assetType?.toUpperCase()] || 3;
        const typeB = typeOrder[b.assetType?.toUpperCase()] || 3;
        return sortOrder === "asc" ? typeA - typeB : typeB - typeA;
      },
      exchange: (a, b) => {
        const exchA = a?.exchange?.toUpperCase() || "";
        const exchB = b?.exchange?.toUpperCase() || "";
        return sortOrder === "asc"
          ? exchA.localeCompare(exchB)
          : exchB.localeCompare(exchA);
      },
    };

    displayedData = originalData.sort(compareFunctions[key]);
  }
</script>

<!-- Container with horizontal scrolling -->
<div class="w-full overflow-x-auto">
  <!-- Set a min-width on smaller screens so the grid can show all columns -->
  <div
    class="min-w-[1200px] rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 overflow-hidden"
  >
    <!-- Header row using grid -->
    <div
      class="table-driver bg-white/60 dark:bg-zinc-950/40 text-gray-500 dark:text-zinc-400 grid grid-cols-11 sticky top-0 z-10 border-b border-gray-300 dark:border-zinc-700 font-semibold text-[11px] uppercase tracking-wide"
    >
      {#each columns as column, colIndex (column.key)}
        {@const sortKey = column.key === "ticker" ? "ticker" : column.key}
        <div
          draggable="true"
          on:dragstart={(e) => handleDragStart(e, colIndex)}
          on:dragover={(e) => handleDragOver(e, colIndex)}
          on:dragleave={handleDragLeave}
          on:drop={(e) => handleDrop(e, colIndex)}
          on:dragend={handleDragEnd}
          on:click={() => sortData(sortKey)}
          class="p-2 text-{column.align} select-none whitespace-nowrap transition-all duration-150 cursor-grab active:cursor-grabbing
            {dragOverColumnIndex === colIndex && draggedColumnIndex !== colIndex
            ? 'bg-violet-100 dark:bg-violet-900/30 border-l-2 border-violet-500'
            : ''}"
        >
          <span class="inline-flex items-center gap-1">
            <svg
              class="inline-block w-3 h-3 opacity-40"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="9" cy="6" r="1.5" />
              <circle cx="15" cy="6" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="9" cy="18" r="1.5" />
              <circle cx="15" cy="18" r="1.5" />
            </svg>
            {column.label}
            <svg
              class="shrink-0 w-4 h-4 -mt-1 {sortOrders[sortKey] === 'asc'
                ? 'rotate-180 inline-block'
                : sortOrders[sortKey] === 'desc'
                  ? 'inline-block'
                  : 'hidden'} "
              viewBox="0 0 20 20"
              fill="currentColor"
              style="max-width:50px"
              ><path
                fill-rule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clip-rule="evenodd"
              ></path></svg
            >
          </span>
        </div>
      {/each}
    </div>

    <!-- VirtualList renders rows in a grid -->
    <VirtualList
      width="100%"
      height={$screenWidth < 640
        ? data?.user?.tier === "Pro"
          ? 550
          : 250
        : data?.user?.tier === "Pro"
          ? 850
          : 250}
      itemCount={displayedData.length}
      itemSize={40}
    >
      <div
        slot="item"
        let:index
        let:style
        {style}
        class={`grid grid-cols-11 gap-0 relative overflow-hidden `}
        class:opacity-30={index + 1 === rawData?.length &&
          data?.user?.tier !== "Pro"}
      >
        {@const transactionType = displayedData[index]?.transactionType || ""}
        {@const transactionLabel = transactionType
          ?.replace("DP", "Dark Pool")
          ?.replace("B", "Block")}
        {@const isDarkPool =
          transactionType === "DP" ||
          transactionType?.toLowerCase().includes("dark")}
        {#each columns as column (column.key)}
          {#if column.key === "date"}
            <div
              class="p-2 text-end text-xs sm:text-sm whitespace-nowrap relative z-10 text-gray-500 dark:text-zinc-400 tabular-nums"
            >
              {$screenWidth < 640
                ? formatToNewYorkTime(displayedData[index]?.date)?.slice(0, -3)
                : formatToNewYorkTime(displayedData[index]?.date)}
            </div>
          {:else if column.key === "ticker"}
            <div
              class="p-2 text-end text-sm sm:text-[0.95rem] relative z-10 text-gray-700 dark:text-zinc-200"
            >
              <HoverStockChart
                symbol={displayedData[index]?.ticker}
                assetType={displayedData[index]?.assetType}
              />
            </div>
          {:else if column.key === "price"}
            <div
              class="p-2 text-end text-xs sm:text-sm relative z-10 text-gray-600 dark:text-zinc-300 tabular-nums"
            >
              {displayedData[index]?.price}
            </div>
          {:else if column.key === "premium"}
            <div
              class="p-2 text-end text-xs sm:text-sm relative z-10 text-gray-600 dark:text-zinc-300 tabular-nums"
            >
              {abbreviateNumber(displayedData[index]?.premium, true, true)}
            </div>
          {:else if column.key === "size"}
            <div
              class="p-2 text-end text-xs sm:text-sm relative z-10 text-gray-600 dark:text-zinc-300 tabular-nums"
            >
              {new Intl.NumberFormat("en", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(displayedData[index]?.size)}
            </div>
          {:else if column.key === "volume"}
            <div
              class="p-2 text-end text-xs sm:text-sm relative z-10 text-gray-600 dark:text-zinc-300 tabular-nums"
            >
              {displayedData[index]?.volume?.toLocaleString("en-US")}
            </div>
          {:else if column.key === "sizeVolRatio"}
            <div
              class="p-2 text-end text-xs sm:text-sm relative z-10 text-gray-600 dark:text-zinc-300 tabular-nums"
            >
              {displayedData[index]?.sizeVolRatio > 0.01
                ? displayedData[index]?.sizeVolRatio?.toFixed(2) + "%"
                : "< 0.01%"}
            </div>
          {:else if column.key === "sizeAvgVolRatio"}
            <div
              class="p-2 text-end text-xs sm:text-sm relative z-10 text-gray-600 dark:text-zinc-300 tabular-nums"
            >
              {displayedData[index]?.sizeAvgVolRatio > 0.01
                ? displayedData[index]?.sizeAvgVolRatio?.toFixed(2) + "%"
                : "< 0.01%"}
            </div>
          {:else if column.key === "transactionType"}
            <div
              class="p-2 text-end text-xs sm:text-sm relative z-10 -mr-3 text-gray-600 dark:text-zinc-300"
            >
              <span class="inline-flex items-center justify-end gap-2 w-full">
                <span
                  class={`h-1.5 w-1.5 rounded-full ${
                    isDarkPool
                      ? "bg-violet-500/70 dark:bg-violet-400/70"
                      : "bg-amber-500/70 dark:bg-amber-400/70"
                  }`}
                ></span>
                <span class="whitespace-nowrap">{transactionLabel}</span>
              </span>
            </div>
          {:else if column.key === "exchange"}
            <div
              class="p-2 text-end text-xs sm:text-sm relative z-10 -mr-3 text-gray-600 dark:text-zinc-300"
            >
              {displayedData[index]?.exchange}
            </div>
          {:else if column.key === "assetType"}
            <div
              class="p-2 text-end text-xs sm:text-sm relative z-10 text-gray-600 dark:text-zinc-300"
            >
              {displayedData[index]?.assetType}
            </div>
          {/if}
        {/each}
      </div>
    </VirtualList>
  </div>
</div>

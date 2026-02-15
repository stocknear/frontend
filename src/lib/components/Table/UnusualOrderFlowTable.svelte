<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";
  import { browser } from "$app/environment";

  export let data;
  export let displayedData = [];
  export let filteredData = [];
  export let rawData = [];
  export let isLoading = false;
  export let onSort: ((key: string, order: string) => void) | undefined =
    undefined;

  // Column reordering
  const defaultColumns = [
    { key: "date", label: "Date", align: "left" },
    { key: "ticker", label: "Symbol", align: "left" },
    { key: "price", label: "Price", align: "right" },
    { key: "premium", label: "Avg. Paid", align: "right" },
    { key: "size", label: "Size", align: "right" },
    { key: "volume", label: "Volume", align: "right" },
    { key: "sizeVolRatio", label: "% Size / Vol", align: "right" },
    { key: "sizeAvgVolRatio", label: "% Size / Avg Vol", align: "right" },
    { key: "transactionType", label: "Type", align: "right" },
    { key: "exchange", label: "Exchange", align: "right" },
    { key: "assetType", label: "Asset type", align: "right" },
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
      event.dataTransfer.setData("text/plain", index.toString());
    }
    const target = event.target as HTMLElement;
    setTimeout(() => {
      target.style.opacity = "0.5";
    }, 0);
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

    if (browser) {
      const order = columns.map((col) => col.key);
      localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(order));
      customColumnOrder = order.some((key, i) => key !== defaultColumns[i].key);
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

    const hour = parts.find((p) => p.type === "hour").value.padStart(2, "0");
    const minute = parts
      .find((p) => p.type === "minute")
      .value.padStart(2, "0");
    const ampm = parts.find((p) => p.type === "dayPeriod").value;

    return `${hour}:${minute} ${ampm}`;
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

  let currentSortKey = null;
  let currentSortOrder = "none";

  // Internal sorted data
  let sortedDisplayData = [];

  function sortData(key) {
    for (const k in sortOrders) {
      if (k !== key) sortOrders[k] = "none";
    }

    const orderCycle = ["none", "asc", "desc"];
    const currentOrderIndex = orderCycle.indexOf(sortOrders[key]);
    sortOrders[key] = orderCycle[(currentOrderIndex + 1) % orderCycle.length];

    const sortOrder = sortOrders[key];

    currentSortKey = key;
    currentSortOrder = sortOrder;

    // If server-side sort callback is provided, delegate to parent
    if (onSort) {
      onSort(key, sortOrder);
      return;
    }

    const originalData =
      filteredData?.length !== 0 ? [...filteredData] : [...rawData];

    if (sortOrder === "none") {
      currentSortKey = null;
      currentSortOrder = "none";
      sortedDisplayData = originalData;
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

    sortedDisplayData = originalData.sort(compareFunctions[key]);
  }

  function applySortDirectly(data, key, sortOrder) {
    if (sortOrder === "none") return data;

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

    return data.sort(compareFunctions[key]);
  }

  // Watch for changes in displayedData and reapply sort
  $: {
    if (displayedData?.length > 0) {
      if (currentSortKey && currentSortOrder !== "none") {
        sortedDisplayData = applySortDirectly(
          [...displayedData],
          currentSortKey,
          currentSortOrder,
        );
      } else {
        sortedDisplayData = [...displayedData];
      }
    } else {
      sortedDisplayData = [];
    }
  }
</script>

<div
  class="w-full m-auto mb-4 rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 overflow-x-auto relative transition-opacity duration-200"
  class:opacity-60={isLoading}
>
  {#if isLoading}
    <div
      class="pointer-events-none absolute inset-0 bg-white/70 dark:bg-[#0b1220]/70 backdrop-blur-sm"
      aria-hidden="true"
    ></div>
  {/if}
  <table
    class="table table-sm table-compact rounded-none sm:rounded w-full m-auto text-gray-700 dark:text-zinc-200 tabular-nums"
    aria-busy={isLoading}
  >
    <thead>
      <tr
        class="bg-white/60 dark:bg-zinc-950/40 text-gray-500 dark:text-zinc-400 font-semibold text-[11px] uppercase tracking-wide border-b border-gray-300 dark:border-zinc-700"
      >
        {#each columns as column, i}
          <th
            draggable="true"
            on:dragstart={(e) => handleDragStart(e, i)}
            on:dragover={(e) => handleDragOver(e, i)}
            on:dragleave={handleDragLeave}
            on:drop={(e) => handleDrop(e, i)}
            on:dragend={handleDragEnd}
            on:click={() => sortData(column.key)}
            class="p-2 text-center select-none whitespace-nowrap transition-all duration-150 cursor-grab active:cursor-grabbing
              {dragOverColumnIndex === i && draggedColumnIndex !== i
              ? 'bg-violet-100 dark:bg-violet-900/30 border-l-2 border-violet-500'
              : ''}"
          >
            <span class="inline-flex items-center gap-1 justify-center">
              {column.label}
              <svg
                class="shrink-0 w-4 h-4 {sortOrders[column.key] === 'asc'
                  ? 'rotate-180 inline-block'
                  : sortOrders[column.key] === 'desc'
                    ? 'inline-block'
                    : 'hidden'}"
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
          </th>
        {/each}
      </tr>
    </thead>
    <tbody
      class="transition-opacity duration-100 divide-y divide-gray-200/70 dark:divide-zinc-800/80"
      class:opacity-70={isLoading}
    >
      {#if !sortedDisplayData?.length}
        <tr>
          <td
            colspan={columns.length}
            class="py-6 text-center text-sm text-gray-800 dark:text-zinc-300"
          >
            {isLoading ? "Loading..." : "No data available"}
          </td>
        </tr>
      {:else}
        {#each sortedDisplayData as item, index}
          {@const isLockedRow =
            index + 1 === rawData?.length && data?.user?.tier !== "Pro"}
          {@const transactionType = item?.transactionType || ""}
          {@const transactionLabel = transactionType
            ?.replace("DP", "Dark Pool")
            ?.replace("B", "Block")}
          {@const isDarkPool =
            transactionType === "DP" ||
            transactionType?.toLowerCase().includes("dark")}
          <tr
            class="transition-colors hover:bg-gray-50/60 dark:hover:bg-zinc-900/50"
            class:opacity-30={isLockedRow}
          >
            {#each columns as column (column.key)}
              {#if column.key === "date"}
                <td class="text-left text-xs sm:text-sm whitespace-nowrap text-gray-500 dark:text-zinc-400 tabular-nums">
                  {formatToNewYorkTime(item?.date)}
                </td>
              {:else if column.key === "ticker"}
                <td
                  on:click|stopPropagation
                  class="text-left text-sm whitespace-nowrap"
                >
                  <HoverStockChart
                    symbol={item?.ticker}
                    assetType={item?.assetType}
                  />
                </td>
              {:else if column.key === "price"}
                <td class="text-end text-xs sm:text-sm whitespace-nowrap tabular-nums">
                  {item?.price}
                </td>
              {:else if column.key === "premium"}
                <td class="text-end text-xs sm:text-sm whitespace-nowrap tabular-nums">
                  {abbreviateNumber(item?.premium, true, true)}
                </td>
              {:else if column.key === "size"}
                <td class="text-end text-xs sm:text-sm whitespace-nowrap tabular-nums">
                  {new Intl.NumberFormat("en", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(item?.size)}
                </td>
              {:else if column.key === "volume"}
                <td class="text-end text-xs sm:text-sm whitespace-nowrap tabular-nums">
                  {item?.volume?.toLocaleString("en-US")}
                </td>
              {:else if column.key === "sizeVolRatio"}
                <td class="text-end text-xs sm:text-sm whitespace-nowrap tabular-nums">
                  {item?.sizeVolRatio > 0.01
                    ? item?.sizeVolRatio?.toFixed(2) + "%"
                    : "< 0.01%"}
                </td>
              {:else if column.key === "sizeAvgVolRatio"}
                <td class="text-end text-xs sm:text-sm whitespace-nowrap tabular-nums">
                  {item?.sizeAvgVolRatio > 0.01
                    ? item?.sizeAvgVolRatio?.toFixed(2) + "%"
                    : "< 0.01%"}
                </td>
              {:else if column.key === "transactionType"}
                <td class="text-end text-xs sm:text-sm whitespace-nowrap">
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
                </td>
              {:else if column.key === "exchange"}
                <td class="text-end text-xs sm:text-sm whitespace-nowrap">
                  {item?.exchange}
                </td>
              {:else if column.key === "assetType"}
                <td class="text-end text-xs sm:text-sm whitespace-nowrap">
                  {item?.assetType}
                </td>
              {/if}
            {/each}
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

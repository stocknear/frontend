<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import { onMount } from "svelte";

  export let charNumber;
  export let industryList;
  export let sectorName = "default";
  export let sectorLink = "";

  let originalData = industryList;
  let rawData = originalData;
  let displayList = rawData;

  let inputValue = "";
  let searchWorker: Worker | undefined;

  // Search functions
  async function resetTableSearch() {
    inputValue = "";
    rawData = originalData;
    displayList = rawData;
  }

  async function search() {
    const searchTerm = inputValue?.toLowerCase();

    setTimeout(async () => {
      if (searchTerm?.length > 0) {
        await loadSearchWorker();
      } else {
        rawData = originalData;
        displayList = rawData;
      }
    }, 100);
  }

  const loadSearchWorker = async () => {
    if (searchWorker && originalData?.length > 0) {
      searchWorker.postMessage({
        rawData: originalData,
        inputValue: inputValue?.toLowerCase(),
      });
    }
  };

  const handleSearchMessage = (event) => {
    if (event.data?.message === "success") {
      rawData = event.data?.output ?? [];
      displayList = rawData;
    }
  };

  onMount(async () => {
    // Load column order preference
    initColumnOrder();

    if (!searchWorker) {
      const SearchWorker = await import(
        "$lib/workers/tableSearchWorker?worker"
      );
      searchWorker = new SearchWorker.default();
      searchWorker.onmessage = handleSearchMessage;
    }
  });

  let defaultColumns = [
    { key: "name", label: "Industry Name", align: "left" },
    { key: "numStocks", label: "# Stocks", align: "right" },
    { key: "totalMarketCap", label: "Market Cap", align: "right" },
    { key: "avgDividendYield", label: "Div. Yield", align: "right" },
    { key: "pe", label: "PE Ratio", align: "right" },
    { key: "profitMargin", label: "Profit Margin", align: "right" },
    { key: "avgChange1D", label: "1D Change", align: "right" },
    { key: "avgChange1W", label: "1W Change", align: "right" },
    { key: "avgChange1M", label: "1M Change", align: "right" },
    { key: "avgChange1Y", label: "1Y Change", align: "right" },
  ];

  // Column reordering state
  let customColumnOrder: string[] = [];

  // Column reordering functions
  function getColumnOrderStorageKey() {
    return `industry_${sectorName?.replace(/\s+/g, "_")}_columnOrder`;
  }

  function loadColumnOrder(): string[] {
    if (typeof localStorage === "undefined") return [];
    try {
      const saved = localStorage.getItem(getColumnOrderStorageKey());
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  function saveColumnOrder(order: string[]) {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(getColumnOrderStorageKey(), JSON.stringify(order));
    } catch (e) {
      console.warn("Failed to save column order:", e);
    }
  }

  function applyColumnOrder(
    cols: typeof defaultColumns,
    order: string[],
  ): typeof defaultColumns {
    if (!order.length) return cols;

    const colMap = new Map(cols.map((c) => [c.key, c]));
    const ordered: typeof defaultColumns = [];

    for (const key of order) {
      const col = colMap.get(key);
      if (col) {
        ordered.push(col);
        colMap.delete(key);
      }
    }

    // Add any remaining columns not in the saved order
    for (const col of colMap.values()) {
      ordered.push(col);
    }

    return ordered;
  }

  function handleColumnReorder(fromIndex: number, toIndex: number) {
    const reordered = [...columns];
    const [removed] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, removed);
    customColumnOrder = reordered.map((c) => c.key);
    saveColumnOrder(customColumnOrder);
  }

  function resetColumnOrder() {
    customColumnOrder = [];
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(getColumnOrderStorageKey());
      } catch (e) {
        console.warn("Failed to remove column order:", e);
      }
    }
  }

  function initColumnOrder() {
    customColumnOrder = loadColumnOrder();
  }

  $: columns = applyColumnOrder([...defaultColumns], customColumnOrder);

  let sortOrders = {
    name: { order: "none", type: "string" },
    numStocks: { order: "none", type: "number" },
    totalMarketCap: { order: "none", type: "number" },
    avgDividendYield: { order: "none", type: "number" },
    pe: { order: "none", type: "number" },
    profitMargin: { order: "none", type: "number" },
    avgChange1D: { order: "none", type: "number" },
    avgChange1W: { order: "none", type: "number" },
    avgChange1M: { order: "none", type: "number" },
    avgChange1Y: { order: "none", type: "number" },
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
        displayList = [...rawData];
      } else {
        displayList = [...originalData];
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
          valueA = (a[key] ?? "").toUpperCase();
          valueB = (b[key] ?? "").toUpperCase();
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

    // Sort using the generic comparison function
    if (inputValue?.length > 0) {
      displayList = [...rawData].sort(compareValues);
    } else {
      displayList = [...originalData].sort(compareValues);
    }
  };
</script>

<div
  class="flex flex-col sm:flex-row sm:items-center w-full mt-2 mb-4 pb-2 border-b border-gray-300 dark:border-zinc-700"
>
  <a
    href={sectorLink}
    class="cursor-pointer font-semibold tracking-tight text-base sm:text-lg text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 transition whitespace-nowrap"
  >
    Sector: {sectorName}
    <svg
      class="inline-block h-6 w-6 -mt-1"
      viewBox="0 0 20 20"
      fill="currentColor"
      style="max-width:40px"
    >
      <path
        fill-rule="evenodd"
        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
        clip-rule="evenodd"
      />
    </svg>
  </a>

  <div
    class="mt-2 sm:mt-0 w-full flex flex-row items-center sm:ml-auto sm:w-fit"
  >
    <div class="relative w-full sm:w-fit sm:ml-auto">
      <div class="inline-block cursor-pointer absolute right-2 top-2 text-sm">
        {#if inputValue?.length > 0}
          <label class="cursor-pointer" on:click={() => resetTableSearch()}>
            <svg
              class="w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
              />
            </svg>
          </label>
        {/if}
      </div>

      <input
        bind:value={inputValue}
        on:input={search}
        type="text"
        placeholder="Find..."
        class="py-2 text-[0.85rem] sm:text-sm border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 rounded-full text-gray-700 dark:text-zinc-200 placeholder:text-gray-800 dark:placeholder:text-zinc-300 px-3 focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80 w-full sm:min-w-56"
      />
    </div>

    <div class="ml-2">
      <DownloadData
        data={{}}
        rawData={displayList}
        title={`${sectorName?.replace(/\s+/g, "_")}_industries`}
      />
    </div>

    {#if customColumnOrder?.length > 0}
      <button
        on:click={resetColumnOrder}
        title="Reset column order"
        class="ml-2 shrink-0 cursor-pointer p-2 rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
      >
        <svg
          class="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            d="M3 7h14M3 12h10M3 17h6M17 10l4 4-4 4M21 14H11"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    {/if}
  </div>
</div>

<div
  class=" w-full m-auto mb-4 rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 overflow-x-auto"
>
  <table
    class="table table-sm table-compact rounded-none sm:rounded w-full m-auto text-gray-700 dark:text-zinc-200 tabular-nums"
  >
    <thead>
      <TableHeader
        {columns}
        {sortOrders}
        {sortData}
        onColumnReorder={handleColumnReorder}
      />
    </thead>
    <tbody class="divide-y divide-gray-200/70 dark:divide-zinc-800/80">
      {#each displayList as item}
        <!-- row -->
        <tr
          class="transition-colors hover:bg-gray-50/60 dark:hover:bg-zinc-900/50"
        >
          {#each columns as column}
            {#if column.key === "name"}
              <td
                class="text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-700 dark:text-zinc-200"
              >
                <a
                  href={`/list/industry/${item?.name?.replace(/ /g, "-")?.replace(/&/g, "and")?.replace(/-{2,}/g, "-")?.toLowerCase()}`}
                  class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                >
                  {item?.name?.length > charNumber
                    ? item?.name?.slice(0, charNumber) + "..."
                    : item?.name}
                </a>
              </td>
            {:else if column.key === "numStocks"}
              <td
                class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
              >
                {item?.numStocks}
              </td>
            {:else if column.key === "totalMarketCap"}
              <td
                class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
              >
                {abbreviateNumber(item?.totalMarketCap) ?? "n/a"}
              </td>
            {:else if column.key === "avgDividendYield"}
              <td
                class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
              >
                {item?.avgDividendYield?.toFixed(2) ?? "n/a"}%
              </td>
            {:else if column.key === "pe"}
              <td
                class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
              >
                {item?.pe?.toFixed(2) ?? "n/a"}
              </td>
            {:else if column.key === "profitMargin"}
              <td
                class="{item?.profitMargin >= 0
                  ? "before:content-['+'] text-emerald-600 dark:text-emerald-400"
                  : 'text-rose-600 dark:text-rose-400'}  text-[0.85rem] sm:text-sm whitespace-nowrap text-end tabular-nums"
              >
                {abbreviateNumber(item?.profitMargin)}%
              </td>
            {:else if column.key === "avgChange1D"}
              <td
                class="{item?.avgChange1D && item?.avgChange1D > 0
                  ? "before:content-['+'] text-emerald-600 dark:text-emerald-400"
                  : item?.avgChange1D && item?.avgChange1D < 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : ''} text-end text-[0.85rem] sm:text-sm whitespace-nowrap tabular-nums"
              >
                {item?.avgChange1D
                  ? item?.avgChange1D?.toFixed(2) + "%"
                  : "n/a"}
              </td>
            {:else if column.key === "avgChange1W"}
              <td
                class="{item?.avgChange1W && item?.avgChange1W > 0
                  ? "before:content-['+'] text-emerald-600 dark:text-emerald-400"
                  : item?.avgChange1W && item?.avgChange1W < 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : ''} text-end text-[0.85rem] sm:text-sm whitespace-nowrap tabular-nums"
              >
                {item?.avgChange1W
                  ? item?.avgChange1W?.toFixed(2) + "%"
                  : "n/a"}
              </td>
            {:else if column.key === "avgChange1M"}
              <td
                class="{item?.avgChange1M && item?.avgChange1M > 0
                  ? "before:content-['+'] text-emerald-600 dark:text-emerald-400"
                  : item?.avgChange1M && item?.avgChange1M < 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : ''} text-end text-[0.85rem] sm:text-sm whitespace-nowrap tabular-nums"
              >
                {item?.avgChange1M
                  ? item?.avgChange1M?.toFixed(2) + "%"
                  : "n/a"}
              </td>
            {:else if column.key === "avgChange1Y"}
              <td
                class="{item?.avgChange1Y && item?.avgChange1Y > 0
                  ? "before:content-['+'] text-emerald-600 dark:text-emerald-400"
                  : item?.avgChange1Y && item?.avgChange1Y < 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : ''} text-end text-[0.85rem] sm:text-sm whitespace-nowrap tabular-nums"
              >
                {item?.avgChange1Y
                  ? item?.avgChange1Y?.toFixed(2) + "%"
                  : "n/a"}
              </td>
            {/if}
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<div class="border-t border-gray-300 dark:border-zinc-700 mt-3" />

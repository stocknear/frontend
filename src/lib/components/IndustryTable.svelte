<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";

  export let charNumber;
  export let industryList;

  let displayList = industryList;

  let columns = [
    { key: "industry", label: "Industry Name", align: "left" },
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

  let sortOrders = {
    industry: { order: "none", type: "string" },
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

    let originalData = industryList;

    const currentOrderIndex = orderCycle.indexOf(sortOrders[key].order);
    sortOrders[key].order =
      orderCycle[(currentOrderIndex + 1) % orderCycle.length];
    const sortOrder = sortOrders[key].order;

    // Reset to original data when 'none' and stop further sorting
    if (sortOrder === "none") {
      displayList = [...originalData]; // Reset to original data (spread to avoid mutation)
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
    displayList = [...originalData].sort(compareValues);
  };
</script>

<div
  class="w-full m-auto mt-4 mb-4 rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 overflow-x-auto"
>
  <table
    class="table table-sm table-compact rounded-none sm:rounded w-full m-auto text-gray-700 dark:text-zinc-200 tabular-nums"
  >
    <thead>
      <TableHeader {columns} {sortOrders} {sortData} />
    </thead>
    <tbody class="divide-y divide-gray-200/70 dark:divide-zinc-800/80">
      {#each displayList as item}
        <!-- row -->
        <tr
          class="transition-colors hover:bg-gray-50/60 dark:hover:bg-zinc-900/50"
        >
          <td
            class="text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-700 dark:text-zinc-200"
          >
            <a
              href={`/list/industry/${item?.industry?.replace(/ /g, "-")?.replace(/&/g, "and")?.replace(/-{2,}/g, "-")?.toLowerCase()}`}
              class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
            >
              {item?.industry?.length > charNumber
                ? item?.industry?.slice(0, charNumber) + "..."
                : item?.industry}
            </a>
          </td>

          <td
            class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
          >
            {item?.numStocks}
          </td>

          <td
            class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
          >
            {abbreviateNumber(item?.totalMarketCap) ?? "n/a"}
          </td>

          <td
            class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
          >
            {item?.avgDividendYield?.toFixed(2) ?? "n/a"}%
          </td>

          <td
            class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
          >
            {item?.pe?.toFixed(2) ?? "n/a"}
          </td>

          <td
            class="{item?.profitMargin >= 0
              ? "before:content-['+'] text-emerald-600 dark:text-emerald-400"
              : 'text-rose-600 dark:text-rose-400'}  text-[0.85rem] sm:text-sm whitespace-nowrap text-end tabular-nums"
          >
            {abbreviateNumber(item?.profitMargin)}%
          </td>

          <td
            class="{item?.avgChange1D && item?.avgChange1D > 0
              ? "before:content-['+'] text-emerald-600 dark:text-emerald-400"
              : item?.avgChange1D && item?.avgChange1D < 0
                ? 'text-rose-600 dark:text-rose-400'
                : ''} text-end text-[0.85rem] sm:text-sm whitespace-nowrap tabular-nums"
          >
            {item?.avgChange1D ? item?.avgChange1D?.toFixed(2) + "%" : "n/a"}
          </td>

          <td
            class="{item?.avgChange1W && item?.avgChange1W > 0
              ? "before:content-['+'] text-emerald-600 dark:text-emerald-400"
              : item?.avgChange1W && item?.avgChange1W < 0
                ? 'text-rose-600 dark:text-rose-400'
                : ''} text-end text-[0.85rem] sm:text-sm whitespace-nowrap tabular-nums"
          >
            {item?.avgChange1W ? item?.avgChange1W?.toFixed(2) + "%" : "n/a"}
          </td>

          <td
            class="{item?.avgChange1M && item?.avgChange1M > 0
              ? "before:content-['+'] text-emerald-600 dark:text-emerald-400"
              : item?.avgChange1M && item?.avgChange1M < 0
                ? 'text-rose-600 dark:text-rose-400'
                : ''} text-end text-[0.85rem] sm:text-sm whitespace-nowrap tabular-nums"
          >
            {item?.avgChange1M ? item?.avgChange1M?.toFixed(2) + "%" : "n/a"}
          </td>

          <td
            class="{item?.avgChange1Y && item?.avgChange1Y > 0
              ? "before:content-['+'] text-emerald-600 dark:text-emerald-400"
              : item?.avgChange1Y && item?.avgChange1Y < 0
                ? 'text-rose-600 dark:text-rose-400'
                : ''} text-end text-[0.85rem] sm:text-sm whitespace-nowrap tabular-nums"
          >
            {item?.avgChange1Y ? item?.avgChange1Y?.toFixed(2) + "%" : "n/a"}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

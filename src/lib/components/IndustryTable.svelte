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

<div class="w-full overflow-x-auto">
  <table
    class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto mt-4"
  >
    <thead>
      <TableHeader {columns} {sortOrders} {sortData} />
    </thead>
    <tbody>
      {#each displayList as item}
        <!-- row -->
        <tr
          class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
        >
          <td class=" text-sm sm:text-[1rem] whitespace-nowrap">
            <a
              href={`/list/industry/${item?.industry?.replace(/ /g, "-")?.replace(/&/g, "and")?.replace(/-{2,}/g, "-")?.toLowerCase()}`}
              class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
            >
              {item?.industry?.length > charNumber
                ? item?.industry?.slice(0, charNumber) + "..."
                : item?.industry}
            </a>
          </td>

          <td class=" text-end text-sm sm:text-[1rem] whitespace-nowrap">
            {item?.numStocks}
          </td>

          <td class=" text-end text-sm sm:text-[1rem] whitespace-nowrap">
            {abbreviateNumber(item?.totalMarketCap) ?? "n/a"}
          </td>

          <td class=" text-end text-sm sm:text-[1rem] whitespace-nowrap">
            {item?.avgDividendYield?.toFixed(2) ?? "n/a"}%
          </td>

          <td class=" text-end text-sm sm:text-[1rem] whitespace-nowrap">
            {item?.pe?.toFixed(2) ?? "n/a"}
          </td>

          <td
            class="{item?.profitMargin >= 0
              ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
              : 'text-red-800 dark:text-[#FF2F1F]'}  text-sm sm:text-[1rem] whitespace-nowrap text-end"
          >
            {abbreviateNumber(item?.profitMargin)}%
          </td>

          <td
            class="{item?.avgChange1D && item?.avgChange1D > 0
              ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
              : item?.avgChange1D && item?.avgChange1D < 0
                ? 'text-red-800 dark:text-[#FF2F1F]'
                : ''} text-end text-sm sm:text-[1rem] whitespace-nowrap"
          >
            {item?.avgChange1D ? item?.avgChange1D?.toFixed(2) + "%" : "n/a"}
          </td>

          <td
            class="{item?.avgChange1Y && item?.avgChange1Y > 0
              ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
              : item?.avgChange1Y && item?.avgChange1Y < 0
                ? 'text-red-800 dark:text-[#FF2F1F]'
                : ''} text-end text-sm sm:text-[1rem] whitespace-nowrap"
          >
            {item?.avgChange1Y ? item?.avgChange1Y?.toFixed(2) + "%" : "n/a"}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

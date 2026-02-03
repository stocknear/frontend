<script lang="ts">
  import InfoModal from "$lib/components/InfoModal.svelte";

  import TableHeader from "$lib/components/Table/TableHeader.svelte";

  import { abbreviateNumber } from "$lib/utils";

  import {
    stock_detail_hottest_trades_title,
    stock_detail_hottest_trades_info,
    stock_detail_hottest_trades_col_rank,
    stock_detail_hottest_trades_col_time,
    stock_detail_hottest_trades_col_price,
    stock_detail_hottest_trades_col_size,
    stock_detail_hottest_trades_col_size_vol,
    stock_detail_hottest_trades_col_size_avg_vol,
    stock_detail_hottest_trades_col_avg_paid,
    stock_detail_hottest_trades_col_type,
    stock_detail_hottest_trades_type_block,
    stock_detail_hottest_trades_type_dark_pool,
  } from "$lib/paraglide/messages";

  export let data;
  export let rawData = [];
  export let ticker;

  // show only first N items by default (toggle shows full list)
  const DEFAULT_VISIBLE = 5;
  let showFullHistory = false;

  // Keep the slice used for sorting / display (limit sorting pool to 50 like before)
  $: stockList = (rawData || []).slice(0, 50);

  // This is what the template will iterate over — either first DEFAULT_VISIBLE or the full stockList
  $: displayedStockList = (stockList || []).slice(
    0,
    showFullHistory ? stockList.length : DEFAULT_VISIBLE,
  );

  function formatToNewYorkTime(isoString) {
    const date = new Date(isoString);

    // Get the date components in New York time zone
    const options = {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      timeZone: "America/New_York",
      hour12: true,
    };

    const formatter = new Intl.DateTimeFormat("en-US", options);
    const parts = formatter.formatToParts(date);

    const year = parts.find((p) => p.type === "year").value;
    const month = parts.find((p) => p.type === "month").value;
    const day = parts.find((p) => p.type === "day").value;
    const hour = parts.find((p) => p.type === "hour").value.padStart(2, "0");
    const minute = parts
      ?.find((p) => p.type === "minute")
      ?.value.padStart(2, "0");

    const ampm = parts.find((p) => p.type === "dayPeriod").value; // AM/PM

    return `${hour}:${minute} ${ampm}`;
  }

  $: columns = [
    {
      key: "rank",
      label: stock_detail_hottest_trades_col_rank(),
      align: "left",
    },
    {
      key: "date",
      label: stock_detail_hottest_trades_col_time(),
      align: "left",
    },
    {
      key: "price",
      label: stock_detail_hottest_trades_col_price(),
      align: "right",
    },
    {
      key: "size",
      label: stock_detail_hottest_trades_col_size(),
      align: "right",
    },
    {
      key: "sizeVolRatio",
      label: stock_detail_hottest_trades_col_size_vol(),
      align: "right",
    },
    {
      key: "sizeAvgVolRatio",
      label: stock_detail_hottest_trades_col_size_avg_vol(),
      align: "right",
    },
    {
      key: "premium",
      label: stock_detail_hottest_trades_col_avg_paid(),
      align: "right",
    },
    {
      key: "transactionType",
      label: stock_detail_hottest_trades_col_type(),
      align: "right",
    },
  ];
  $: sortOrders = {
    rank: { order: "none", type: "number" },
    date: { order: "none", type: "date" },
    price: { order: "none", type: "number" },
    premium: { order: "none", type: "number" },
    size: { order: "none", type: "number" },
    sizeVolRatio: { order: "none", type: "number" },
    sizeAvgVolRatio: { order: "none", type: "number" },
    transactionType: { order: "none", type: "string" },
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

    const originalData = rawData || [];

    // Reset to original data when 'none' and stop further sorting
    if (sortOrder === "none") {
      // Rebuild the stockList from original un-sorted rawData (limited to 50)
      stockList = originalData.slice(0, 50);
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
          valueA = (a[key] || "").toUpperCase();
          valueB = (b[key] || "").toUpperCase();
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

    // Sort using the generic comparison function and keep the top 50 for performance
    stockList = [...originalData].sort(compareValues).slice(0, 50);
  };
</script>

<section class="overflow-hidden h-full pb-8">
  <main class="overflow-hidden">
    <div class="flex flex-row items-center">
      <label
        for="hottestDPTrade"
        class="mr-1 cursor-pointer flex flex-row items-center text-xl sm:text-2xl font-bold"
      >
        {stock_detail_hottest_trades_title()}
      </label>
      <InfoModal
        title={stock_detail_hottest_trades_title()}
        content={stock_detail_hottest_trades_info()}
        id={"hottestDPTrade"}
      />
    </div>

    {#if rawData?.length !== 0}
      <div class="w-full m-auto rounded mb-4 overflow-x-auto mt-4">
        <table
          class="table table-sm table-compact w-full border border-gray-300 dark:border-zinc-700 m-auto"
        >
          <thead>
            <TableHeader {columns} {sortOrders} {sortData} />
          </thead>
          <tbody>
            {#each displayedStockList as item, index}
              <tr
                class="dark:sm:hover:bg-[#245073]/10 {!showFullHistory &&
                index === displayedStockList.length - 1 &&
                stockList?.length > DEFAULT_VISIBLE
                  ? 'opacity-60 cursor-pointer'
                  : index + 1 === rawData?.length &&
                      !['Pro']?.includes(data?.user?.tier)
                    ? 'opacity-[0.1]'
                    : ''}"
                on:click={() => {
                  // If user clicks the faded last visible row while collapsed, expand the list
                  if (
                    !showFullHistory &&
                    index === displayedStockList.length - 1 &&
                    stockList?.length > DEFAULT_VISIBLE
                  )
                    showFullHistory = true;
                }}
              >
                <td class="text-start text-sm whitespace-nowrap">
                  {item?.rank}
                </td>

                <td class="text-start text-sm whitespace-nowrap">
                  {formatToNewYorkTime(item?.date)}
                </td>

                <td class="text-end text-sm whitespace-nowrap">
                  {item?.price}
                </td>

                <td class="text-sm text-end">
                  {item?.size?.toLocaleString("en-US")}
                </td>

                <td class="text-sm text-end">
                  {item?.sizeVolRatio?.toFixed(2)}%
                </td>
                <td class="text-sm text-end">
                  {item?.sizeAvgVolRatio?.toFixed(2)}%
                </td>

                <td class="text-sm text-end">
                  {abbreviateNumber(item?.premium)}
                </td>
                <td class="text-sm sm:text-[1rem] text-end whitespace-nowrap">
                  {item?.transactionType
                    ?.replace("B", stock_detail_hottest_trades_type_block())
                    ?.replace(
                      "DP",
                      stock_detail_hottest_trades_type_dark_pool(),
                    )}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if stockList?.length > DEFAULT_VISIBLE}
        <label
          on:click={() => (showFullHistory = !showFullHistory)}
          class="cursor-pointer flex justify-center items-center mt-5"
        >
          <svg
            class="w-10 h-10 transform text-black dark:text-[#2A323C] {showFullHistory
              ? 'rotate-180'
              : ''}"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 13.5L7.5 11l1.42-1.41L12 12.67l3.08-3.08L16.5 11L12 15.5z"
            />
          </svg>
        </label>
      {/if}
    {/if}
  </main>
</section>

<script lang="ts">
  import { screenWidth } from "$lib/store";
  import { abbreviateNumber } from "$lib/utils";

  import VirtualList from "svelte-tiny-virtual-list";
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";
  import { mode } from "mode-watcher";

  export let data;
  export let displayedData = [];
  export let rawData = [];

  // Internal sorted data that we control
  let sortedDisplayData = [];

  function formatTime(timeString) {
    if (!timeString) return "";
    // Time is already in NY timezone from backend
    const [hours, minutes] = timeString?.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    return `${formattedHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
  }

  let sortOrders = {
    time: "none",
    ticker: "none",
    price: "none",
    bid: "none",
    ask: "none",
    size: "none",
    totalValue: "none",
    exec: "none",
    exchange: "none",
    assetType: "none",
  };

  let currentSortKey = null;
  let currentSortOrder = "none";

  function sortData(key) {
    for (const k in sortOrders) {
      if (k !== key) {
        sortOrders[k] = "none";
      }
    }

    const orderCycle = ["none", "asc", "desc"];
    const currentOrderIndex = orderCycle.indexOf(sortOrders[key]);
    sortOrders[key] = orderCycle[(currentOrderIndex + 1) % orderCycle.length];

    const sortOrder = sortOrders[key];

    currentSortKey = key;
    currentSortOrder = sortOrder;

    const originalData = [...displayedData];

    if (sortOrder === "none") {
      currentSortKey = null;
      currentSortOrder = "none";
      sortedDisplayData = originalData;
      return;
    }

    const compareFunctions = {
      time: (a, b) => {
        const timeA = new Date("1970-01-01T" + a.time).getTime();
        const timeB = new Date("1970-01-01T" + b.time).getTime();
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      },
      ticker: (a, b) => {
        const tickerA = a.ticker?.toUpperCase() || "";
        const tickerB = b.ticker?.toUpperCase() || "";
        return sortOrder === "asc"
          ? tickerA.localeCompare(tickerB)
          : tickerB.localeCompare(tickerA);
      },
      price: (a, b) => {
        const priceA = parseFloat(a.price) || 0;
        const priceB = parseFloat(b.price) || 0;
        return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
      },
      bid: (a, b) => {
        const bidA = parseFloat(a.bid) || 0;
        const bidB = parseFloat(b.bid) || 0;
        return sortOrder === "asc" ? bidA - bidB : bidB - bidA;
      },
      ask: (a, b) => {
        const askA = parseFloat(a.ask) || 0;
        const askB = parseFloat(b.ask) || 0;
        return sortOrder === "asc" ? askA - askB : askB - askA;
      },
      size: (a, b) => {
        const sizeA = parseFloat(a.size) || 0;
        const sizeB = parseFloat(b.size) || 0;
        return sortOrder === "asc" ? sizeA - sizeB : sizeB - sizeA;
      },
      totalValue: (a, b) => {
        const valueA = parseFloat(a.cost_basis) || 0;
        const valueB = parseFloat(b.cost_basis) || 0;
        return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
      },
      exec: (a, b) => {
        const execA = a?.execution_estimate?.toUpperCase() || "";
        const execB = b?.execution_estimate?.toUpperCase() || "";
        return sortOrder === "asc"
          ? execA.localeCompare(execB)
          : execB.localeCompare(execA);
      },
      exchange: (a, b) => {
        const exchA = a?.exchange?.toUpperCase() || "";
        const exchB = b?.exchange?.toUpperCase() || "";
        return sortOrder === "asc"
          ? exchA.localeCompare(exchB)
          : exchB.localeCompare(exchA);
      },
      assetType: (a, b) => {
        const typeA = a?.underlying_type?.toUpperCase() || "";
        const typeB = b?.underlying_type?.toUpperCase() || "";
        return sortOrder === "asc"
          ? typeA.localeCompare(typeB)
          : typeB.localeCompare(typeA);
      },
    };

    sortedDisplayData = originalData.sort(compareFunctions[key]);
  }

  function applySortDirectly(data, key, sortOrder) {
    if (sortOrder === "none") {
      return data;
    }

    const compareFunctions = {
      time: (a, b) => {
        const timeA = new Date("1970-01-01T" + a.time).getTime();
        const timeB = new Date("1970-01-01T" + b.time).getTime();
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      },
      ticker: (a, b) => {
        const tickerA = a.ticker?.toUpperCase() || "";
        const tickerB = b.ticker?.toUpperCase() || "";
        return sortOrder === "asc"
          ? tickerA.localeCompare(tickerB)
          : tickerB.localeCompare(tickerA);
      },
      price: (a, b) => {
        const priceA = parseFloat(a.price) || 0;
        const priceB = parseFloat(b.price) || 0;
        return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
      },
      bid: (a, b) => {
        const bidA = parseFloat(a.bid) || 0;
        const bidB = parseFloat(b.bid) || 0;
        return sortOrder === "asc" ? bidA - bidB : bidB - bidA;
      },
      ask: (a, b) => {
        const askA = parseFloat(a.ask) || 0;
        const askB = parseFloat(b.ask) || 0;
        return sortOrder === "asc" ? askA - askB : askB - askA;
      },
      size: (a, b) => {
        const sizeA = parseFloat(a.size) || 0;
        const sizeB = parseFloat(b.size) || 0;
        return sortOrder === "asc" ? sizeA - sizeB : sizeB - sizeA;
      },
      totalValue: (a, b) => {
        const valueA = parseFloat(a.cost_basis) || 0;
        const valueB = parseFloat(b.cost_basis) || 0;
        return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
      },
      exec: (a, b) => {
        const execA = a?.execution_estimate?.toUpperCase() || "";
        const execB = b?.execution_estimate?.toUpperCase() || "";
        return sortOrder === "asc"
          ? execA.localeCompare(execB)
          : execB.localeCompare(execA);
      },
      exchange: (a, b) => {
        const exchA = a?.exchange?.toUpperCase() || "";
        const exchB = b?.exchange?.toUpperCase() || "";
        return sortOrder === "asc"
          ? exchA.localeCompare(exchB)
          : exchB.localeCompare(exchA);
      },
      assetType: (a, b) => {
        const typeA = a?.underlying_type?.toUpperCase() || "";
        const typeB = b?.underlying_type?.toUpperCase() || "";
        return sortOrder === "asc"
          ? typeA.localeCompare(typeB)
          : typeB.localeCompare(typeA);
      },
    };

    return data.sort(compareFunctions[key]);
  }

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

<div class="w-full overflow-x-auto">
  <div class="min-w-[900px]">
    <!-- Header row using grid -->
    <div
      class="table-driver bg-default text-white grid grid-cols-10 sticky top-0 z-10 border border-gray-300 dark:border-gray-800 font-bold text-xs uppercase"
    >
      <div
        on:click={() => sortData("time")}
        class="cursor-pointer p-2 text-center select-none whitespace-nowrap"
      >
        Time
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['time'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['time'] === 'desc'
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
      </div>
      <div
        on:click={() => sortData("ticker")}
        class="cursor-pointer p-2 text-center select-none whitespace-nowrap"
      >
        Symbol
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['ticker'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['ticker'] === 'desc'
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
      </div>

      <div
        on:click={() => sortData("price")}
        class="cursor-pointer p-2 text-center select-none whitespace-nowrap"
      >
        Price
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['price'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['price'] === 'desc'
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
      </div>

      <div
        on:click={() => sortData("bid")}
        class="cursor-pointer p-2 text-center select-none whitespace-nowrap"
      >
        Bid
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['bid'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['bid'] === 'desc'
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
      </div>

      <div
        on:click={() => sortData("ask")}
        class="cursor-pointer p-2 text-center select-none whitespace-nowrap"
      >
        Ask
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['ask'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['ask'] === 'desc'
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
      </div>

      <div
        on:click={() => sortData("size")}
        class="cursor-pointer p-2 text-center select-none whitespace-nowrap"
      >
        Size
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['size'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['size'] === 'desc'
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
      </div>

      <div
        on:click={() => sortData("totalValue")}
        class="cursor-pointer p-2 text-center select-none whitespace-nowrap"
      >
        Value
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['totalValue'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['totalValue'] === 'desc'
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
      </div>

      <div
        on:click={() => sortData("exec")}
        class="cursor-pointer p-2 text-center select-none whitespace-nowrap"
      >
        Exec
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['exec'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['exec'] === 'desc'
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
      </div>

      <div
        on:click={() => sortData("exchange")}
        class="cursor-pointer p-2 text-center select-none whitespace-nowrap"
      >
        Exchange
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['exchange'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['exchange'] === 'desc'
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
      </div>

      <div
        on:click={() => sortData("assetType")}
        class="cursor-pointer p-2 text-center select-none whitespace-nowrap"
      >
        Type
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['assetType'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['assetType'] === 'desc'
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
      </div>
    </div>

    <VirtualList
      width="100%"
      height={$screenWidth < 640
        ? data?.user?.tier === "Pro"
          ? 550
          : 250
        : data?.user?.tier === "Pro"
          ? 850
          : 250}
      itemCount={sortedDisplayData.length}
      itemSize={40}
    >
      <div
        slot="item"
        let:index
        let:style
        {style}
        class="grid grid-cols-10 gap-0 relative overflow-hidden"
        class:bg-[#fff]={index % 2 === 0 && $mode === "light"}
        class:bg-[#09090B]={index % 2 === 0 && $mode !== "light"}
        class:bg-[#121217]={index % 2 !== 0 && $mode !== "light"}
        class:bg-[#F6F7F8]={index % 2 !== 0 && $mode == "light"}
        class:opacity-30={index + 1 === rawData?.length &&
          data?.user?.tier !== "Pro"}
      >
        {#if sortedDisplayData[index]}
          {@const item = sortedDisplayData[index]}
          {@const isAtAsk =
            item?.execution_estimate === "At Ask" ||
            item?.execution_estimate === "Above Ask"}
          {@const isAtBid =
            item?.execution_estimate === "At Bid" ||
            item?.execution_estimate === "Below Bid"}

          {@const baseColor =
            $mode === "light"
              ? index % 2 === 0
                ? "#ffffff"
                : "#F6F7F8"
              : index % 2 === 0
                ? "#09090B"
                : "#121217"}

          <!-- Gradient overlay based on execution -->
          {#if isAtAsk || isAtBid}
            <div
              class="absolute inset-0 pointer-events-none z-0"
              style="background: {(() => {
                if ($mode === 'light') {
                  if (isAtAsk) {
                    return `linear-gradient(90deg, ${baseColor} 0%, rgba(34, 197, 94, 0.05) 70%, rgba(34, 197, 94, 0.1) 100%)`;
                  }
                  if (isAtBid) {
                    return `linear-gradient(90deg, ${baseColor} 0%, rgba(239, 68, 68, 0.05) 70%, rgba(239, 68, 68, 0.1) 100%)`;
                  }
                } else {
                  if (isAtAsk) {
                    return `linear-gradient(90deg, ${baseColor} 0%, rgba(0, 252, 80, 0.03) 70%, rgba(0, 252, 80, 0.08) 100%)`;
                  }
                  if (isAtBid) {
                    return `linear-gradient(90deg, ${baseColor} 0%, rgba(255, 47, 31, 0.03) 70%, rgba(255, 47, 31, 0.08) 100%)`;
                  }
                }
                return 'transparent';
              })()}"
            ></div>
          {/if}
        {/if}

        <div
          class="p-2 text-center text-xs sm:text-sm whitespace-nowrap relative z-10"
        >
          {formatTime(sortedDisplayData[index]?.time)}
        </div>

        <div
          on:click|stopPropagation
          class="p-2 text-center text-sm sm:text-[1rem] whitespace-nowrap relative z-10"
        >
          <HoverStockChart
            symbol={sortedDisplayData[index]?.ticker}
            assetType={sortedDisplayData[index]?.underlying_type}
          />
        </div>

        <div
          class="p-2 text-center text-sm sm:text-[1rem] whitespace-nowrap relative z-10"
        >
          {sortedDisplayData[index]?.price?.toFixed(2)}
        </div>

        <div
          class="p-2 text-center text-sm sm:text-[1rem] whitespace-nowrap relative z-10"
        >
          {sortedDisplayData[index]?.bid?.toFixed(2)}
        </div>

        <div
          class="p-2 text-center text-sm sm:text-[1rem] whitespace-nowrap relative z-10"
        >
          {sortedDisplayData[index]?.ask?.toFixed(2)}
        </div>

        <div
          class="p-2 text-center text-sm sm:text-[1rem] whitespace-nowrap relative z-10"
        >
          {new Intl.NumberFormat("en", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(sortedDisplayData[index]?.size)}
        </div>

        <div
          class="p-2 text-center text-sm sm:text-[1rem] whitespace-nowrap relative z-10"
        >
          {@html abbreviateNumber(
            sortedDisplayData[index]?.cost_basis,
            false,
            true,
          )}
        </div>

        <div
          class="p-2 text-center text-sm sm:text-[1rem] whitespace-nowrap relative z-10 {[
            'At Ask',
            'Above Ask',
          ]?.includes(sortedDisplayData[index]?.execution_estimate)
            ? 'text-green-700 dark:text-[#00FC50]'
            : ['At Bid', 'Below Bid']?.includes(
                  sortedDisplayData[index]?.execution_estimate,
                )
              ? 'text-red-700 dark:text-[#FF2F1F]'
              : 'text-orange-700 dark:text-[#C6A755]'}"
        >
          {sortedDisplayData[index]?.execution_estimate?.replace(
            "At Midpoint",
            "At Mid",
          )}
        </div>

        <div
          class="p-2 text-center text-sm sm:text-[1rem] whitespace-nowrap relative z-10"
        >
          {sortedDisplayData[index]?.exchange}
        </div>

        <div
          class="p-2 text-center text-sm sm:text-[1rem] whitespace-nowrap relative z-10 capitalize"
        >
          {sortedDisplayData[index]?.underlying_type}
        </div>
      </div>
    </VirtualList>
  </div>
</div>

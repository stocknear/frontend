<script lang="ts">
  import { screenWidth } from "$lib/store";
  import { abbreviateNumber, sectorNavigation } from "$lib/utils";
  import VirtualList from "svelte-tiny-virtual-list";
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";
  import { mode } from "mode-watcher";

  export let data;
  export let displayedData = [];
  export let filteredData = [];
  export let rawData = [];

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
    sector: "none",
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
      sector: (a, b) => {
        const sectorA = a.sector || "";
        const sectorB = b.sector || "";
        if (sectorA === "" && sectorB !== "") return 1;
        if (sectorB === "" && sectorA !== "") return -1;
        return sortOrder === "asc"
          ? sectorA.toUpperCase().localeCompare(sectorB.toUpperCase())
          : sectorB.toUpperCase().localeCompare(sectorA.toUpperCase());
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
    };

    displayedData = originalData.sort(compareFunctions[key]);
  }
</script>

<!-- Container with horizontal scrolling -->
<div class="w-full overflow-x-auto">
  <!-- Set a min-width on smaller screens so the grid can show all columns -->
  <div class="min-w-[1000px]">
    <!-- Header row using grid -->
    <div
      class="table-driver bg-black text-white grid grid-cols-10 sticky top-0 z-40 border border-gray-300 dark:border-gray-800 font-bold text-xs uppercase"
    >
      <div
        on:click={() => sortData("date")}
        class="cursor-pointer p-2 text-start select-none whitespace-nowrap"
      >
        Date
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
        class="cursor-pointer p-2 text-start select-none whitespace-nowrap"
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
        on:click={() => sortData("premium")}
        class="cursor-pointer p-2 text-start select-none whitespace-nowrap"
      >
        Avg. Paid
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['premium'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['premium'] === 'desc'
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
        class="cursor-pointer p-2 text-start select-none whitespace-nowrap"
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
        on:click={() => sortData("volume")}
        class="cursor-pointer p-2 text-start select-none whitespace-nowrap"
      >
        Volume
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['volume'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['volume'] === 'desc'
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
        on:click={() => sortData("sizeVolRatio")}
        class="cursor-pointer p-2 text-start select-none whitespace-nowrap"
      >
        % Size / Vol
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['sizeVolRatio'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['sizeVolRatio'] === 'desc'
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
        on:click={() => sortData("sizeAvgVolRatio")}
        class="cursor-pointer p-2 text-start select-none whitespace-nowrap"
      >
        % Size / Avg Vol
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['sizeAvgVolRatio'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['sizeAvgVolRatio'] === 'desc'
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
        on:click={() => sortData("sector")}
        class="cursor-pointer p-2 text-start select-none whitespace-nowrap"
      >
        Sector
        <svg
          class="shrink-0 w-4 h-4 -mt-1 {sortOrders['sector'] === 'asc'
            ? 'rotate-180 inline-block'
            : sortOrders['sector'] === 'desc'
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
        class="cursor-pointer p-2 text-end select-none whitespace-nowrap"
      >
        Asset type
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
        class="grid grid-cols-10 gap-0 relative overflow-hidden"
        class:bg-[#fff]={index % 2 === 0 && $mode === "light"}
        class:bg-[#09090B]={index % 2 === 0 && $mode !== "light"}
        class:bg-[#121217]={index % 2 !== 0 && $mode !== "light"}
        class:bg-[#F6F7F8]={index % 2 !== 0 && $mode == "light"}
        class:opacity-30={index + 1 === rawData?.length &&
          data?.user?.tier !== "Pro"}
      >
        <!-- Apply gradient overlay for dark pool trades -->
        {#if displayedData[index]}
          {@const item = displayedData[index]}
          {@const isLargeSize = item?.size >= 10000}
          {@const isHugeSize = item?.size >= 50000}
          {@const isHighVolRatio = item?.sizeVolRatio >= 5}
          {@const isHighAvgVolRatio = item?.sizeAvgVolRatio >= 10}

          {#if isLargeSize || isHighVolRatio || isHighAvgVolRatio}
            {@const baseColor =
              $mode === "light"
                ? index % 2 === 0
                  ? "#ffffff"
                  : "#F6F7F8"
                : index % 2 === 0
                  ? "#09090B"
                  : "#121217"}

            <div
              class="absolute inset-0 pointer-events-none z-0"
              style="background: {(() => {
                if ($mode === 'light') {
                  if (isHugeSize) {
                    return `linear-gradient(90deg, ${baseColor} 0%, rgba(255, 140, 0, 0.1) 70%, rgba(255, 140, 0, 0.2) 100%)`;
                  }
                  if (isHighAvgVolRatio) {
                    return `linear-gradient(90deg, ${baseColor} 0%, rgba(139, 92, 246, 0.08) 70%, rgba(139, 92, 246, 0.15) 100%)`;
                  }
                  if (isHighVolRatio || isLargeSize) {
                    return `linear-gradient(90deg, ${baseColor} 0%, rgba(59, 130, 246, 0.05) 70%, rgba(59, 130, 246, 0.1) 100%)`;
                  }
                } else {
                  // Dark mode
                  if (isHugeSize) {
                    return `linear-gradient(90deg, ${baseColor} 0%, rgba(255, 140, 0, 0.08) 60%, rgba(255, 140, 0, 0.15) 100%)`;
                  }
                  if (isHighAvgVolRatio) {
                    return `linear-gradient(90deg, ${baseColor} 0%, rgba(139, 92, 246, 0.06) 70%, rgba(139, 92, 246, 0.12) 100%)`;
                  }
                  if (isHighVolRatio || isLargeSize) {
                    return `linear-gradient(90deg, ${baseColor} 0%, rgba(59, 130, 246, 0.04) 70%, rgba(59, 130, 246, 0.08) 100%)`;
                  }
                }
                return 'transparent';
              })()}"
            ></div>
          {/if}
        {/if}
        <!-- Date Column -->
        <div
          class="p-2 text-start text-xs sm:text-sm whitespace-nowrap relative z-10"
        >
          {$screenWidth < 640
            ? formatToNewYorkTime(displayedData[index]?.date)?.slice(0, -3)
            : formatToNewYorkTime(displayedData[index]?.date)}
        </div>
        <!-- Symbol Column -->
        <div class="p-2 text-center text-sm sm:text-[1rem] relative z-10">
          <HoverStockChart
            symbol={displayedData[index]?.ticker}
            assetType={displayedData[index]?.assetType}
          />
        </div>
        <!-- Price Column -->
        <div class="p-2 text-start text-sm sm:text-[1rem] relative z-10">
          {displayedData[index]?.price}
        </div>
        <!-- Premium Column -->
        <div class="p-2 text-start text-sm sm:text-[1rem] relative z-10">
          {abbreviateNumber(displayedData[index]?.premium, true, true)}
        </div>
        <!-- Size Column -->
        <div class="p-2 text-start text-sm sm:text-[1rem] relative z-10">
          {new Intl.NumberFormat("en", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(displayedData[index]?.size)}
        </div>
        <!-- Volume Column -->
        <div class="p-2 text-start text-sm sm:text-[1rem] relative z-10">
          {displayedData[index]?.volume?.toLocaleString("en-US")}
        </div>
        <!-- % Size / Vol Column -->
        <div class="p-2 text-start text-sm sm:text-[1rem] relative z-10">
          {displayedData[index]?.sizeVolRatio > 0.01
            ? displayedData[index]?.sizeVolRatio?.toFixed(2) + "%"
            : "< 0.01%"}
        </div>
        <!-- % Size / Avg Vol Column -->
        <div class="p-2 text-start text-sm sm:text-[1rem] relative z-10">
          {displayedData[index]?.sizeAvgVolRatio > 0.01
            ? displayedData[index]?.sizeAvgVolRatio?.toFixed(2) + "%"
            : "< 0.01%"}
        </div>
        <!-- Sector Column -->
        <div
          class="p-2 text-start text-sm sm:text-[1rem] whitespace-nowrap relative z-10"
        >
          <a
            href={sectorNavigation?.find(
              (item) => item?.title === displayedData[index]?.sector,
            )?.link}
            class="sm:hover:underline sm:hover:underline-offset-4"
          >
            {displayedData[index]?.sector?.length > 20
              ? displayedData[index]?.sector?.slice(0, 20) + "..."
              : displayedData[index]?.sector}
          </a>
        </div>
        <!-- Asset Type Column -->
        <div class="p-2 text-end text-sm sm:text-[1rem] relative z-10">
          {displayedData[index]?.assetType}
        </div>
      </div>
    </VirtualList>
  </div>
</div>

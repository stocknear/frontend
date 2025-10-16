<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import {
    abbreviateNumber,
    removeCompanyStrings,
    formatString,
  } from "$lib/utils";
  import { onMount } from "svelte";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";

  export let data;

  let rawData = data?.getShareholderData || {};

  let callPercentage;
  let putPercentage;
  let totalCalls;
  let totalPuts;
  let putCallRatio;

  let shareholderList = rawData?.shareholders;
  let displayList = shareholderList?.slice(0, 50);
  let config;

  let topHolders = 0;

  function plotData() {
    let institutionalOwner =
      rawData?.ownershipPercent > 100 ? 99.99 : rawData?.ownershipPercent || 0;
    let otherOwner = institutionalOwner === 0 ? 0 : 100 - institutionalOwner;

    const options = {
      chart: {
        type: "bar",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 360, // Set the maximum height for the chart
        animation: false,
      },
      credits: { enabled: false },
      legend: {
        enabled: true,
        animation: false,
        itemStyle: { color: $mode === "light" ? "black" : "white" },
      },
      title: {
        text: `<h3 class="mt-3 mb-1 text-center">${removeCompanyStrings($displayCompanyName)} Ownership Distribution</h3>`,
        useHTML: true,
        style: { color: $mode === "light" ? "black" : "white" },
      },
      xAxis: {
        categories: [""],
        animation: false,
      },
      yAxis: {
        title: {
          text: null,
          style: { color: $mode === "light" ? "black" : "white" },
        },
        opposite: true,
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        labels: {
          formatter: function () {
            return this?.value + "%";
          },
          style: { color: $mode === "light" ? "black" : "white" },
        },
        tickPositioner: function () {
          // Create custom tick positions with wider spacing
          const positions = [];
          const info = this.getExtremes();
          const tickCount = 3; // Reduce number of ticks displayed
          const interval = Math.floor((info.max - info.min) / tickCount);

          for (let i = 0; i <= tickCount; i++) {
            positions.push(info.min + i * interval);
          }
          return positions;
        },
      },
      tooltip: {
        enabled: false,
      },
      plotOptions: {
        series: {
          color: $mode === "light" ? "black" : "white",
          animation: false,
          dataLabels: {
            enabled: false,
            color: $mode === "light" ? "black" : "white",
            style: {
              fontSize: "13px",
              fontWeight: "bold",
            },
          },
        },
      },
      series: [
        {
          name: "Institutional Owner",
          data: [institutionalOwner],
          animation: false,
          color: "#1E40AF",
          borderColor: "#1E40AF",
          borderRadius: "1px",
        },
        {
          name: "Others",
          data: [otherOwner],
          animation: false,
          color: "#D97706",
          borderColor: "#D97706",
          borderRadius: "1px",
        },
      ],
    };

    return options;
  }

  totalCalls = rawData?.totalCalls ?? 0;
  totalPuts = rawData?.totalPuts ?? 0;
  if (totalCalls + totalPuts !== 0) {
    callPercentage = (100 * totalCalls) / (totalCalls + totalPuts);
    putPercentage = 100 - callPercentage;
    putCallRatio = rawData?.putCallRatio;
  } else {
    callPercentage = 0;
    putPercentage = 0;
    putCallRatio = 0;
  }

  let charNumber = 30;

  async function handleScroll() {
    const scrollThreshold = document.body.offsetHeight * 0.8; // 80% of the website height
    const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;
    if (isBottom && displayList?.length !== shareholderList?.length) {
      const nextIndex = displayList?.length;
      const filteredNewResults = shareholderList?.slice(
        nextIndex,
        nextIndex + 50,
      );
      displayList = [...displayList, ...filteredNewResults];
    }
  }

  onMount(async () => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  });

  let columns = [
    { key: "investorName", label: "Institute", align: "left" },
    { key: "ownership", label: "Ownership", align: "right" },
    { key: "sharesNumber", label: "Shares", align: "right" },
    {
      key: "changeInSharesNumberPercentage",
      label: "Shares % Change",
      align: "right",
    },
    { key: "marketValue", label: "Market Value", align: "right" },
    { key: "weight", label: "Portfolio", align: "right" },
    { key: "filingDate", label: "Filing Date", align: "right" },
  ];

  let sortOrders = {
    investorName: { order: "none", type: "string" },
    ownership: { order: "none", type: "number" },
    sharesNumber: { order: "none", type: "number" },
    changeInSharesNumberPercentage: { order: "none", type: "number" },
    marketValue: { order: "none", type: "number" },
    weight: { order: "none", type: "number" },
    filingDate: { order: "none", type: "date" },
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

    let originalData = shareholderList;
    const currentOrderIndex = orderCycle.indexOf(sortOrders[key].order);
    sortOrders[key].order =
      orderCycle[(currentOrderIndex + 1) % orderCycle.length];
    const sortOrder = sortOrders[key].order;

    // Reset to original data when 'none' and stop further sorting
    if (sortOrder === "none") {
      displayList = [...originalData]?.slice(0, 50); // Reset to original data (spread to avoid mutation)
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
    displayList = [...originalData].sort(compareValues)?.slice(0, 50);
  };

  $: {
    if ($mode) {
      config = plotData();
    }
  }
</script>

<section class="overflow-hidden h-full pb-8">
  <main class="overflow-hidden">
    {#if shareholderList?.length !== 0}
      <div class=" text-[1rem] mt-3">
        <p>
          Total Institutes of {rawData?.investorsHolding?.toLocaleString(
            "en-US",
          )} in {removeCompanyStrings($displayCompanyName)}
          {rawData?.investorsHoldingChange >= 0
            ? "expanded their positions with an increase of"
            : "reduced their positions with a decrease of"}
          <span class="font-semibold"
            >{Math.abs(rawData?.investorsHoldingChange)}</span
          >
          investors compared to the previous quarter.
          {rawData?.numberOf13FsharesChange >= 0
            ? "An additional"
            : "A reduction of"}
          <span class="font-semibold">
            {@html abbreviateNumber(
              Math.abs(rawData?.numberOf13FsharesChange),
              false,
              true,
            )}
          </span>
          shares, as total invested capital {rawData?.totalInvestedChange >= 0
            ? "grew by"
            : "declined by"}
          <span class="font-semibold">
            {@html abbreviateNumber(
              Math.abs(rawData?.totalInvestedChange),
              true,
              true,
            )}
          </span>
          {rawData?.ownershipPercent >= rawData?.lastOwnershipPercent
            ? "with ownership percentage increasing from"
            : "with ownership percentage dropping from"}
          <span class="font-semibold"
            >{rawData?.lastOwnershipPercent?.toFixed(2)}%</span
          >
          to
          <span class="font-semibold"
            >{rawData?.ownershipPercent?.toFixed(2)}%</span
          >.
        </p>

        <div
          class="border border-gray-300 dark:border-gray-800 rounded w-full mt-3 shadow-xs"
          use:highcharts={config}
        ></div>
      </div>

      {#if putCallRatio !== 0}
        <h1 class=" font-semibold text-xl sm:text-2xl mb-3 mt-5">
          Options Activity
        </h1>

        <div class="mt-3 text-md">
          Institutions are holding {callPercentage > 55
            ? "more Calls Contracts as Puts Contracts, indicating a bullish sentiment."
            : callPercentage < 45
              ? "more Puts Contracts as Calls Contracts, indicating a bearish sentiment."
              : "Calls/Puts contracts nearly balanced, indicating a neutral sentiment."}
        </div>

        <div class="w-full mt-5 mb-10 m-auto flex justify-center items-center">
          <div
            class="w-full grid grid-cols-2 lg:grid-cols-4 gap-y-3 lg:gap-y-3 gap-x-3"
          >
            <!--Start Put/Call-->
            <div
              class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 shadow-xs border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-primary rounded h-20"
            >
              <div class="flex flex-col items-start">
                <span class="  text-sm sm:text-[1rem]">Put/Call</span>
                <span class="text-start text-sm sm:text-[1rem]">
                  {putCallRatio?.toFixed(3)}
                </span>
              </div>
              <!-- Circular Progress -->
              <div class="relative size-14 ml-auto">
                <svg
                  class="size-full w-14 h-14"
                  viewBox="0 0 36 36"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <!-- Background Circle -->
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    class="stroke-current text-gray-300 dark:text-[#3E3E3E]"
                    stroke-width="3"
                  ></circle>
                  <!-- Progress Circle inside a group with rotation -->
                  <g class="origin-center -rotate-90 transform">
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      class="stroke-current text-blue-800"
                      stroke-width="3"
                      stroke-dasharray="100"
                      stroke-dashoffset={putCallRatio >= 1
                        ? 0
                        : 100 - (putCallRatio * 100)?.toFixed(2)}
                    ></circle>
                  </g>
                </svg>
                <!-- Percentage Text -->
                <div
                  class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2"
                >
                  <span class="text-center text-sm"
                    >{putCallRatio?.toFixed(2)}</span
                  >
                </div>
              </div>
              <!-- End Circular Progress -->
            </div>
            <!--End Put/Call-->
            <!--Start Call Flow-->
            <div
              class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 shadow-xs border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-primary rounded h-20"
            >
              <div class="flex flex-col items-start">
                <span class="  text-sm sm:text-[1rem]">Call Flow</span>
                <span class="text-start text-sm sm:text-[1rem]">
                  {new Intl.NumberFormat("en", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(rawData?.totalCalls)}
                </span>
              </div>
              <!-- Circular Progress -->
              <div class="relative size-14 ml-auto">
                <svg
                  class="size-full w-14 h-14"
                  viewBox="0 0 36 36"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <!-- Background Circle -->
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    class="stroke-current text-gray-300 dark:text-[#3E3E3E]"
                    stroke-width="3"
                  ></circle>
                  <!-- Progress Circle inside a group with rotation -->
                  <g class="origin-center -rotate-90 transform">
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      class="stroke-current text-[#00FC50]"
                      stroke-width="3"
                      stroke-dasharray="100"
                      stroke-dashoffset={(100 - callPercentage)?.toFixed(2)}
                    ></circle>
                  </g>
                </svg>
                <!-- Percentage Text -->
                <div
                  class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2"
                >
                  <span class="text-center text-sm"
                    >{callPercentage?.toFixed(0)}%</span
                  >
                </div>
              </div>
              <!-- End Circular Progress -->
            </div>
            <!--End Call Flow-->

            <!--Start Put Flow-->
            <div
              class="flex flex-row items-center flex-wrap w-full px-3 sm:px-5 shadow-xs border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-primary rounded h-20"
            >
              <div class="flex flex-col items-start">
                <span class="  text-sm sm:text-[1rem]">Put Flow</span>
                <span class="text-start text-sm sm:text-[1rem]">
                  {new Intl.NumberFormat("en", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(rawData?.totalPuts)}
                </span>
              </div>
              <!-- Circular Progress -->
              <div class="relative size-14 ml-auto">
                <svg
                  class="size-full w-14 h-14"
                  viewBox="0 0 36 36"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <!-- Background Circle -->
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    class="stroke-current text-gray-300 dark:text-[#3E3E3E]"
                    stroke-width="3"
                  ></circle>
                  <!-- Progress Circle inside a group with rotation -->
                  <g class="origin-center -rotate-90 transform">
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      class="stroke-current text-[#EE5365]"
                      stroke-width="3"
                      stroke-dasharray="100"
                      stroke-dashoffset={100 - putPercentage}
                    ></circle>
                  </g>
                </svg>
                <!-- Percentage Text -->
                <div
                  class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2"
                >
                  <span class="text-center text-sm"
                    >{putPercentage?.toFixed(0)}%</span
                  >
                </div>
              </div>
              <!-- End Circular Progress -->
            </div>
            <!--End Put Flow-->
          </div>
        </div>
      {/if}

      <div class="flex flex-row items-center justify-between mb-3">
        <h3 class=" font-semibold text-xl sm:text-2xl">Top Shareholders</h3>

        {#if topHolders !== 0}
          <span class=" text-[1rem">
            The Top 10 shareholders collectively own <span class="font-semibold"
              >{topHolders <= 0.01
                ? "< 0.01%"
                : topHolders?.toFixed(2) + "%"}</span
            >
            of the {$displayCompanyName}
          </span>
        {/if}

        <div class="flex justify-end items-end ml-auto w-fit">
          <DownloadData
            {data}
            rawData={shareholderList}
            title={`13-institute-${$stockTicker}`}
          />
        </div>
      </div>

      <div
        class="flex justify-start items-center w-full m-auto mt-3 overflow-x-auto"
      >
        <table
          class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
        >
          <thead>
            <TableHeader {columns} {sortOrders} {sortData} />
          </thead>
          <tbody>
            {#each displayList as item, index}
              {#if item?.investorName?.length > 0}
                <tr
                  class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
                >
                  <td class=" text-sm sm:text-[1rem] whitespace-nowrap">
                    <a
                      href={"/hedge-funds/" + item?.cik}
                      class="sm:hover:underline sm:hover:underline-offset-4"
                    >
                      {item?.investorName?.length > charNumber
                        ? formatString(
                            item?.investorName?.slice(0, charNumber),
                          ) + "..."
                        : formatString(item?.investorName)}
                    </a>
                  </td>

                  <td
                    class=" text-end text-sm sm:text-[1rem] whitespace-nowrap"
                  >
                    {item?.ownership <= 0.01
                      ? "< 0.01%"
                      : item?.ownership?.toFixed(2) + "%"}
                  </td>

                  <td
                    class=" text-end text-sm sm:text-[1rem] whitespace-nowrap"
                  >
                    {@html item?.sharesNumber !== null
                      ? abbreviateNumber(item?.sharesNumber, false, true)
                      : "-"}
                  </td>

                  <td
                    class=" text-end text-sm sm:text-[1rem] whitespace-nowrap"
                  >
                    {#if item?.changeInSharesNumberPercentage >= 0}
                      <span class="text-green-800 dark:text-[#00FC50]"
                        >+{abbreviateNumber(
                          item?.changeInSharesNumberPercentage?.toFixed(2),
                        )}%</span
                      >
                    {:else if item?.changeInSharesNumberPercentage < 0}
                      <span class="text-red-800 dark:text-[#FF2F1F]"
                        >{abbreviateNumber(
                          item?.changeInSharesNumberPercentage?.toFixed(2),
                        )}%</span
                      >
                    {:else}
                      -
                    {/if}
                  </td>

                  <td
                    class=" text-end text-sm sm:text-[1rem] whitespace-nowrap"
                  >
                    {item?.marketValue !== null
                      ? abbreviateNumber(item?.marketValue)
                      : "-"}
                  </td>

                  <td
                    class=" text-end text-sm sm:text-[1rem] whitespace-nowrap"
                  >
                    {item?.weight <= 0.01
                      ? "< 0.01%"
                      : item?.weight?.toFixed(2) + "%"}
                  </td>

                  <td
                    class=" text-end text-sm sm:text-[1rem] whitespace-nowrap"
                  >
                    {new Date(item?.filingDate)?.toLocaleDateString("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>

      <UpgradeToPro {data} />
    {/if}
  </main>
</section>

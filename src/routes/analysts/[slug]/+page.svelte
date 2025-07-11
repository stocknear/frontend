<script lang="ts">
  import { screenWidth } from "$lib/store";
  import { sectorNavigation } from "$lib/utils";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import { onMount } from "svelte";
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";
  import RatingsChart from "$lib/components/RatingsChart.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;

  let analystStats = data?.getAnalystStats;

  let rawData = processTickerData(data?.getAnalystStats?.ratingsList);
  let originalData = [...rawData]; // Unaltered copy of raw data

  let stockList = rawData?.slice(0, 50) ?? [];

  let analystScore = analystStats?.analystScore;
  let rank = analystStats?.rank;
  let analystName = analystStats?.analystName ?? "n/a";
  let companyName = analystStats?.companyName;
  let totalRatings = analystStats?.totalRatings;
  let successRate = analystStats?.successRate;
  let avgReturn = analystStats?.avgReturn;
  let numOfAnalysts = new Intl.NumberFormat("en", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(analystStats?.numOfAnalysts);
  let numOfStocks = analystStats?.numOfStocks;

  function processTickerData(data) {
    const tickerMap = new Map();

    data?.forEach((item) => {
      const { ticker } = item;

      if (!ticker) return; // Skip if ticker is not defined

      if (!tickerMap.has(ticker)) {
        // Add the item and initialize count
        tickerMap.set(ticker, { ...item, ratings: 1 });
      } else {
        const existing = tickerMap.get(ticker);

        // Increment the ratings count
        existing.ratings += 1;

        // Keep the item with the latest date
        if (new Date(item.date) > new Date(existing.date)) {
          tickerMap.set(ticker, { ...item, ratings: existing.ratings });
        }
      }
    });

    // Convert the Map back to an array
    return Array.from(tickerMap.values());
  }

  async function handleScroll() {
    const scrollThreshold = document.body.offsetHeight * 0.8; // 80% of the website height
    const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;

    if (isBottom && stockList?.length !== originalData?.length) {
      const nextIndex = stockList?.length;
      const filteredNewResults = originalData?.slice(nextIndex, nextIndex + 50);
      stockList = [...stockList, ...filteredNewResults];
    }
  }

  onMount(async () => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  });

  $: checkedSymbol = "";
  function openGraph(symbol) {
    // Clear all existing symbols
    if (checkedSymbol === symbol) {
      checkedSymbol = "";
    } else {
      checkedSymbol = symbol;
    }
  }
  $: charNumber = $screenWidth < 640 ? 20 : 40;

  $: columns = [
    ...($screenWidth > 1024
      ? [{ key: "chart", label: "", align: "right" }]
      : []),
    { key: "ticker", label: "Name", align: "left" },
    { key: "rating_current", label: "Action", align: "left" },
    { key: "adjusted_pt_current", label: "Price Target", align: "right" },
    { key: "price", label: "Current", align: "right" },
    { key: "upside", label: "% Upside", align: "right" },
    { key: "ratings", label: "Ratings", align: "right" },
    { key: "date", label: "Updated", align: "right" },
  ];

  $: sortOrders = {
    chart: { order: "none", type: "string" },
    ticker: { order: "none", type: "string" },
    rating_current: { order: "none", type: "string" },
    adjusted_pt_current: { order: "none", type: "number" },
    marketCap: { order: "none", type: "number" },
    price: { order: "none", type: "number" },
    upside: { order: "none", type: "number" },
    ratings: { order: "none", type: "number" },
    date: { order: "none", type: "date" },
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
      originalData = [...rawData]; // Reset originalData to rawData
      stockList = originalData?.slice(0, 50); // Reset displayed data
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
    stockList = [...originalData].sort(compareValues)?.slice(0, 50);
  };
</script>

<SEO
  title={`${analystName} - Analyst At ${companyName}`}
  description={`${analystName} is a Wall Street analyst working for ${companyName}. ${analystName} has covered ${totalRatings} stocks with a ${successRate}% success rate and an average return of ${avgReturn}%.`}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pt-5 px-4 lg:px-3 mb-20"
>
  <div class="text-sm sm:text-[1rem] breadcrumbs">
    <ul>
      <li><a href="/" class="text-muted dark:text-gray-300">Home</a></li>
      <li>
        <a href="/analysts" class="text-muted dark:text-gray-300">Analyst</a>
      </li>

      <li class="text-muted dark:text-gray-300">{analystName ?? "n/a"}</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class="w-full m-auto mt-12">
            <div class="items-center justify-between lg:flex">
              <div
                class="flex space-x-3 border-b-[2px] border-below-title pb-3 lg:border-none lg:pb-0"
              >
                <div class="shrink-0">
                  <svg
                    class="h-16 w-16 sm:h-20 sm:w-20 text-gray-500 dark:text-gray-200"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    style="max-width:100px"
                    ><path
                      fill-rule="evenodd"
                      d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                      clip-rule="evenodd"
                    ></path></svg
                  >
                </div>
                <div class="mt-0 pt-0.5 text-left">
                  <h1 class="mb-0 text-2xl font-bold">
                    {analystName ?? "n/a"}
                  </h1>
                  <p
                    class="mb-0.5 text-[1rem] font-semibold text-muted dark:text-gray-300"
                  >
                    Stock Analyst at {companyName ?? "n/a"}
                  </p>
                  <div class="inline-flex items-center">
                    <div class="flex flex-row items-center">
                      {#each Array.from({ length: 5 }) as _, i}
                        {#if i < Math?.floor(analystScore)}
                          <svg
                            class="w-5 h-5 text-[#FFA500]"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 22 20"
                          >
                            <path
                              d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"
                            />
                          </svg>
                        {:else}
                          <svg
                            class="w-5 h-5 text-gray-400 dark:text-gray-500"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 22 20"
                          >
                            <path
                              d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"
                            />
                          </svg>
                        {/if}
                      {/each}
                    </div>
                    <span class="ml-1 text-[1rem]"
                      >({analystScore ?? "n/a"})</span
                    >
                  </div>
                </div>
              </div>
              <div
                class="mt-4 grid grid-cols-2 overflow-hidden rounded border border-gray-300 dark:border-gray-600 py-2 text-center md:grid-cols-4 md:p-0 lg:mt-0 lg:border-none"
              >
                <div class="flex flex-col px-4 py-2 bp:px-6 md:py-6">
                  <div class="text-2xl font-semibold tracking-tight">
                    # {rank ?? "n/a"}
                  </div>
                  <div
                    class="text-[1rem] font-semibold leading-6 text-muted dark:text-gray-300"
                  >
                    Out of {numOfAnalysts ?? "n/a"} analysts
                  </div>
                </div>
                <div
                  class="flex flex-col px-4 py-2 bp:px-6 sm:border-l sm:border-gray-300 dark:sm:border-gray-600 md:py-6"
                >
                  <div class="text-2xl font-bold tracking-tight">
                    {totalRatings ?? "n/a"}
                  </div>
                  <div
                    class="text-[1rem] font-semibold leading-6 text-muted dark:text-gray-300"
                  >
                    Total ratings
                  </div>
                </div>
                <div
                  class="flex flex-col px-4 py-2 bp:px-6 sm:border-l sm:border-gray-300 dark:sm:border-gray-600 md:py-6"
                >
                  <div class="text-2xl font-bold tracking-tight">
                    {#if ["Plus", "Pro"]?.includes(data?.user?.tier)}
                      <span
                        class={successRate >= 0 && successRate !== undefined
                          ? "before:content-['+'] text-green-800 dark:text-[#36D984]"
                          : successRate < 0 && successRate !== undefined
                            ? "text-red-800 dark:text-[#EF4444]"
                            : ""}
                        >{successRate !== undefined
                          ? successRate?.toFixed(2) + "%"
                          : "n/a"}</span
                      >
                    {:else}
                      <a href="/pricing" class="flex justify-center mb-2">
                        <svg
                          class="size-6 text-muted dark:text-[#fff]"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          style="max-width: 40px;"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clip-rule="evenodd"
                          >
                          </path>
                        </svg>
                      </a>
                    {/if}
                  </div>
                  <div
                    class="text-[1rem] font-semibold leading-6 text-muted dark:text-gray-300"
                  >
                    Success rate
                  </div>
                </div>
                <div
                  class="flex flex-col px-4 py-2 bp:px-6 sm:border-l sm:border-gray-300 dark:sm:border-gray-600 md:py-6"
                >
                  <div class="text-2xl font-bold tracking-tight">
                    {#if ["Plus", "Pro"]?.includes(data?.user?.tier)}
                      <span
                        class={avgReturn >= 0 && avgReturn !== undefined
                          ? "before:content-['+'] text-green-800 dark:text-[#36D984]"
                          : avgReturn < 0 && avgReturn !== undefined
                            ? "text-red-800 dark:text-[#EF4444]"
                            : ""}
                        >{avgReturn !== undefined
                          ? avgReturn?.toFixed(2) + "%"
                          : "n/a"}</span
                      >
                    {:else}
                      <a href="/pricing" class="flex justify-center mb-2">
                        <svg
                          class="size-6 text-muted dark:text-[#fff]"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          style="max-width: 40px;"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clip-rule="evenodd"
                          >
                          </path>
                        </svg>
                      </a>
                    {/if}
                  </div>
                  <div
                    class="text-[1rem] font-semibold leading-6 text-muted dark:text-gray-300"
                  >
                    Average return
                  </div>
                </div>
              </div>
            </div>

            {#if data?.getAnalystStats?.mainSectors?.length > 0}
              <div class="mb-10 mt-10">
                <div
                  class="relative my-3 space-y-2 rounded border border-gray-300 dark:border-gray-600 sm:my-6 p-4"
                >
                  <div class="flex flex-col sm:flex-row">
                    <div class="mb-2 font-semibold sm:mb-0">Main Sectors:</div>
                    <div class="flex flex-wrap gap-x-2 gap-y-3 sm:ml-2">
                      {#each data?.getAnalystStats?.mainSectors as item}
                        <a
                          href={sectorNavigation?.find(
                            (listItem) => listItem?.title === item,
                          )?.link}
                          class="inline-block badge border-gray-300 dark:border-gray-800 rounded-[3px] bg-blue-100 dark:bg-primary duration-0 ml-1 px-3 m-auto text-blue-700 dark:text-blue-400 dark:sm:hover:text-white sm:hover:text-muted text-[1rem]"
                        >
                          {item}
                        </a>
                      {/each}
                    </div>
                  </div>
                  <div class="flex flex-col sm:flex-row">
                    <div class="mb-2 whitespace-nowrap font-semibold sm:mb-0">
                      Top Industries:
                    </div>
                    <div class="flex flex-wrap gap-x-2 gap-y-3 sm:ml-2">
                      {#each data?.getAnalystStats?.mainIndustries as item}
                        <a
                          href={`/list/industry/${item?.replace(/ /g, "-")?.replace(/&/g, "and")?.replace(/-{2,}/g, "-")?.toLowerCase()}`}
                          class="inline-block badge border-gray-300 dark:border-gray-800 rounded-[3px] bg-blue-100 dark:bg-primary duration-0 ml-1 px-3 m-auto text-blue-700 dark:text-blue-400 dark:sm:hover:text-white sm:hover:text-muted text-[1rem]"
                        >
                          {item}
                        </a>
                      {/each}
                    </div>
                  </div>
                </div>
              </div>
            {/if}

            {#if rawData?.length > 0}
              <span class=" font-semibold text-xl sm:text-2xl">
                {numOfStocks} Stocks
              </span>

              <div class="w-full m-auto mt-4">
                <div
                  class="w-full m-auto rounded-none sm:rounded mb-4 overflow-x-auto"
                >
                  <table
                    class="table table-sm table-compact no-scrollbar rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
                  >
                    <thead>
                      <TableHeader {columns} {sortOrders} {sortData} />
                    </thead>
                    <tbody>
                      {#each stockList as item, index}
                        <tr
                          class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
                        >
                          <td class="hidden lg:table-cell"
                            ><button
                              on:click={() => openGraph(item?.ticker)}
                              class="cursor-pointer h-full pl-2 pr-2 align-middle lg:pl-3"
                              ><svg
                                class="w-5 h-5 text-icon {checkedSymbol ===
                                item?.ticker
                                  ? 'rotate-180'
                                  : ''}"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                style="max-width:40px"
                                ><path
                                  fill-rule="evenodd"
                                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                  clip-rule="evenodd"
                                ></path></svg
                              ></button
                            ></td
                          >

                          <td
                            class="text-sm sm:text-[1rem] text-start whitespace-nowrap"
                          >
                            {#if index >= 5 && !["Pro", "Plus"]?.includes(data?.user?.tier)}
                              <a class="block relative" href="/pricing">
                                <span
                                  class=" font-semibold text-blue-link blur-sm group-hover:blur-[6px]"
                                >
                                  XXXX
                                </span>

                                <div
                                  class="ml-px max-w-[130px] truncate text-sm blur-sm group-hover:blur-[6px] lg:max-w-[150px]"
                                >
                                  XXXXXXXXXXXXXXXX
                                </div>

                                <div class="absolute top-3 flex items-center">
                                  <svg
                                    class="size-5 text-muted dark:text-[#fff]"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    style="max-width: 40px;"
                                  >
                                    <path
                                      fill-rule="evenodd"
                                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                      clip-rule="evenodd"
                                    >
                                    </path>
                                  </svg>

                                  <span
                                    class="ml-1 font-semibold text-muted dark:text-gray-300"
                                  >
                                    Upgrade
                                  </span>
                                </div>
                              </a>
                            {:else}
                              <div class="flex flex-col items-start">
                                <HoverStockChart symbol={item?.ticker} />

                                <span
                                  class="text-sm text-gray-800 dark:text-gray-200"
                                >
                                  {item?.name?.length > charNumber
                                    ? item?.name?.slice(0, charNumber) + "..."
                                    : item?.name}
                                </span>
                              </div>
                            {/if}
                          </td>

                          <td
                            class="text-sm sm:text-[1rem] text-start whitespace-nowrap"
                          >
                            <div class="flex flex-col sm:flex-row items-start">
                              <span class="mr-1">{item?.action_company}:</span>
                              <span>
                                {item?.rating_current}
                              </span>
                            </div>
                          </td>

                          <td class=" text-sm sm:text-[1rem] whitespace-nowrap">
                            <div class="flex flex-row items-center justify-end">
                              {#if Math?.ceil(item?.adjusted_pt_prior) !== 0}
                                <span
                                  class="text-muted dark:text-gray-100 font-normal"
                                  >{Math?.ceil(item?.adjusted_pt_prior)}</span
                                >
                                <svg
                                  class="w-3 h-3 ml-1 mr-1 inline-block"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  ><path
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="1.5"
                                    d="M4 12h16m0 0l-6-6m6 6l-6 6"
                                  /></svg
                                >
                                <span class=" font-semibold"
                                  >{Math?.ceil(item?.adjusted_pt_current)}</span
                                >
                              {:else if Math?.ceil(item?.adjusted_pt_current) !== 0}
                                <span class=" font-semibold"
                                  >{Math?.ceil(item?.adjusted_pt_current)}</span
                                >
                              {:else}
                                n/a
                              {/if}
                            </div>
                          </td>

                          <td
                            class=" text-end text-sm sm:text-[1rem] whitespace-nowrap"
                          >
                            {item?.price !== null ? item?.price : "n/a"}
                          </td>

                          <td
                            class="{item?.upside >= 0 && item?.upside !== null
                              ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
                              : item?.upside < 0 && item?.upside !== null
                                ? 'text-red-800 dark:text-[#FF2F1F]'
                                : ''} text-end text-sm sm:text-[1rem] whitespace-nowrap"
                          >
                            {item?.upside !== null ? item?.upside + "%" : "n/a"}
                          </td>

                          <td
                            class=" text-end text-sm sm:text-[1rem] whitespace-nowrap"
                          >
                            {item?.ratings !== null ? item?.ratings : "n/a"}
                          </td>

                          <td
                            class=" text-end text-sm sm:text-[1rem] whitespace-nowrap"
                          >
                            {new Date(item?.date).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              daySuffix: "2-digit",
                            })}
                          </td>
                        </tr>
                        {#if checkedSymbol === item?.ticker}
                          <tr class=""
                            ><td colspan="8" class="px-0" style=""
                              ><div class="-mt-0.5 px-0 pb-2">
                                <div class="relative h-[350px]">
                                  <div class="absolute top-0 w-full">
                                    <div
                                      class="h-[250px] w-full xs:h-[300px] sm:h-[350px]"
                                      style="overflow: hidden;"
                                    >
                                      <div
                                        style="position: relative; height: 0px; z-index: 1;"
                                      >
                                        <RatingsChart
                                          ratingsList={data?.getAnalystStats?.ratingsList?.map(
                                            (item) => ({
                                              ...item,
                                              type: item?.rating_current,
                                            }),
                                          )}
                                          symbol={item?.ticker}
                                          numOfRatings={item?.ratings}
                                          {data}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div></td
                            >
                          </tr>
                        {/if}
                      {/each}
                    </tbody>
                  </table>
                </div>
              </div>
            {:else}
              <div class="pt-5">
                <Infobox
                  text="No data is available for the searched analyst."
                />
              </div>
            {/if}
          </div>
        </main>
      </div>
    </div>
  </div>
</section>

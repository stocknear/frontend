<script lang="ts">
  import { numberOfUnreadNotification, screenWidth } from "$lib/store";
  import InfiniteLoading from "$lib/components/InfiniteLoading.svelte";
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
  import ArrowLogo from "lucide-svelte/icons/move-up-right";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";

  export let data;

  let rawData = data?.getCorporateLobbyingTracker ?? [];
  let displayList = rawData?.slice(0, 50) ?? [];

  async function infiniteHandler({ detail: { loaded, complete } }) {
    if (displayList?.length === rawData?.length) {
      complete();
    } else {
      const nextIndex = displayList?.length;
      const newArticles = rawData?.slice(nextIndex, nextIndex + 5);
      displayList = [...displayList, ...newArticles];
      loaded();
    }
  }

  function formatDate(dateString) {
    const date = new Date(dateString);

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are zero-based
    const day = date.getDate().toString().padStart(2, "0");

    const hours = date.getHours() % 12 || 12; // Convert to 12-hour format
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = date.getHours() >= 12 ? "PM" : "AM";

    return `${year}/${month}/${day} ${hours}:${minutes} ${ampm}`;
  }

  $: charNumber = $screenWidth < 640 ? 15 : 20;

  let columns = [
    { key: "date", label: "Date", align: "left" },
    { key: "ticker", label: "Symbol", align: "left" },

    { key: "name", label: "Name", align: "left" },
    { key: "price", label: "Price", align: "right" },

    { key: "changesPercentage", label: "% Change", align: "right" },
    { key: "amount", label: "Amount", align: "right" },
  ];

  let sortOrders = {
    date: { order: "none", type: "date" },
    ticker: { order: "none", type: "string" },
    name: { order: "none", type: "string" },
    changesPercentage: { order: "none", type: "number" },
    price: { order: "none", type: "number" },
    amount: { order: "none", type: "number" },
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

    let originalData = rawData;

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
</script>

<svelte:head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>
    {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ""} Latest
    Lobbiyng Disclosure Tracker · Stocknear
  </title>
  <meta
    name="description"
    content={`Track the latest senate lobbying spending of US companies.`}
  />

  <!-- Other meta tags -->
  <meta
    property="og:title"
    content={`Latest Lobbiyng Disclosure Tracker · Stocknear`}
  />
  <meta
    property="og:description"
    content={`Track the latest senate lobbying spending of US companies.`}
  />
  <meta property="og:type" content="website" />
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta
    name="twitter:title"
    content={`Latest Lobbiyng Disclosure Tracker · Stocknear`}
  />
  <meta
    name="twitter:description"
    content={`Track the latest senate lobbying spending of US companies.`}
  />
  <!-- Add more Twitter meta tags as needed -->
</svelte:head>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3"
>
  <div class="text-sm sm:text-[1rem] breadcrumbs">
    <ul>
      <li><a href="/" class="text-muted dark:text-gray-300">Home</a></li>
      <li class="text-muted dark:text-gray-300">Corporate Lobbying Tracker</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:w-3/4 lg:pr-5">
          <div class="mb-6 border-[#2C6288] dark:border-white border-b-[2px]">
            <h1 class="mb-1 text-white text-2xl sm:text-3xl font-bold">
              Lobbying Tracker
            </h1>
            <p class="mb-3 px-1 font-semibold text-muted sm:px-0">
              Track the latest lobbying spendings of US stock companies
            </p>
          </div>
          <div
            class="w-screen sm:w-full flex flex-row items-start mt-20 sm:mt-10"
          >
            <div
              class="w-screen sm:w-full rounded-none sm:rounded mb-4 overflow-x-auto lg:overflow-hidden"
            >
              <table
                class="table table-sm table-compact rounded-none sm:rounded w-full bg-table border border-gray-800 m-auto"
              >
                <thead>
                  <TableHeader {columns} {sortOrders} {sortData} />
                </thead>
                <tbody>
                  {#each displayList as item, index}
                    <tr
                      class="sm:hover:bg-[#245073] border-b border-[#27272A] sm:hover:bg-opacity-[0.2] odd:bg-odd {index +
                        1 ===
                        displayList?.length &&
                      !['Pro', 'Plus']?.includes(data?.user?.tier)
                        ? 'opacity-[0.1]'
                        : ''}"
                    >
                      <td
                        class="text-start text-sm text-white whitespace-nowrap"
                      >
                        {formatDate(item?.date)}
                      </td>

                      <td
                        class="text-blue-400 text-sm sm:text-[1rem] text-start"
                      >
                        <HoverStockChart symbol={item?.ticker} />
                      </td>

                      <td
                        class="text-white text-sm sm:text-[1rem] whitespace-nowrap text-white text-start"
                      >
                        {item?.name?.length > charNumber
                          ? item?.name?.slice(0, charNumber) + "..."
                          : item?.name}
                      </td>

                      <td
                        class="text-end text-sm sm:text-[1rem] text-white whitespace-nowrap"
                      >
                        {item?.price}
                      </td>

                      <td
                        class="text-white text-end text-sm sm:text-[1rem] border-b-[#09090B]"
                      >
                        {#if item?.changesPercentage >= 0}
                          <span class="text-green-800 dark:text-[#00FC50]"
                            >+{item?.changesPercentage >= 1000
                              ? item?.changesPercentage
                              : item?.changesPercentage?.toFixed(2)}%</span
                          >
                        {:else}
                          <span class="text-red-800 dark:text-[#FF2F1F]"
                            >{item?.changesPercentage <= -1000
                              ? item?.changesPercentage
                              : item?.changesPercentage?.toFixed(2)}%
                          </span>
                        {/if}
                      </td>

                      <td class="text-white text-sm sm:text-[1rem] text-end">
                        ${new Intl.NumberFormat("en", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(item?.amount)}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
            <InfiniteLoading on:infinite={infiniteHandler} />
          </div>

          <UpgradeToPro {data} />
        </main>

        <aside class="hidden lg:block relative fixed w-1/4 ml-4">
          <div
            class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
          >
            <a
              href={"/analysts"}
              class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-xl font-bold ml-3">Top Analyst</h2>
                <ArrowLogo
                  class="w-8 h-8 mr-3 shrink-0 text-gray-400 dark:text-white"
                />
              </div>
              <span class="p-3 ml-3 mr-3">
                Get the latest top Wall Street analyst ratings
              </span>
            </a>
          </div>

          <div
            class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
          >
            <a
              href={"/politicians"}
              class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-xl font-bold ml-3">
                  Congress Trading
                </h2>
                <ArrowLogo
                  class="w-8 h-8 mr-3 shrink-0 text-gray-400 dark:text-white"
                />
              </div>
              <span class="p-3 ml-3 mr-3">
                Get the latest top Congress trading insights.
              </span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
</section>

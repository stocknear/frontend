<script lang="ts">
  import { onMount } from "svelte";
  import { displayCompanyName, etfTicker } from "$lib/store";
  import { getPartyForPoliticians } from "$lib/utils";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";

  export let data;

  let rawData = data?.getSenateTrading;
  let buySellRatio = 0;
  let partyRatio = 0;
  let senateTradingList = [];
  let isLoaded = false;

  let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;

  function getAbbreviatedName(fullName) {
    if (fullName === null) {
      return "-";
    }

    const names = fullName?.split(" ");
    let firstName = names[0];
    // Remove any title prefix (e.g. Dr., Mr., Mrs., Ms.)
    if (names.length > 1 && /^(Dr|Mr|Mrs|Ms)\.?$/i.test(names[0])) {
      firstName = names[1];
      names?.splice(0, 1);
    }
    const initials = names
      ?.slice(0, -1)
      ?.map((name) => name?.charAt(0))
      ?.join(". ");
    const lastName = names[names?.length - 1];
    return `${firstName?.charAt(0)}. ${lastName}`;
  }

  function backToTop() {
    window.scrollTo({
      top: 0,
    });
  }

  async function handleScroll() {
    const scrollThreshold = document.body.offsetHeight * 0.8; // 80% of the website height
    const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;
    if (isBottom && senateTradingList?.length !== rawData?.length) {
      const nextIndex = senateTradingList?.length;
      const filteredNewResults = rawData?.slice(nextIndex, nextIndex + 50);
      senateTradingList = [...senateTradingList, ...filteredNewResults];
    }
  }

  onMount(async () => {
    rawData.forEach((item) => {
      const representative = item?.representative || "";
      const fullName = representative
        .replace(/(\s(?:Dr\s)?\w(?:\.|(?=\s)))?\s/g, "_")
        .trim();
      item.representative = fullName.replace(/_/g, " ");
    });

    rawData = rawData?.map((item) => {
      const party = getPartyForPoliticians(item?.representative);
      return {
        ...item,
        party: party,
      };
    });

    // Count the occurrences of "Republican" and "Democrat"
    const partyCounts = rawData.reduce((counts, item) => {
      counts[item?.party] = (counts[item?.party] || 0) + 1;
      return counts;
    }, {});

    const typeCounts = rawData.reduce((counts, item) => {
      counts[item?.type] = (counts[item?.type] || 0) + 1;
      return counts;
    }, {});

    partyRatio =
      partyCounts["Democratic"] > 0 && partyCounts["Republican"] === undefined
        ? 1
        : partyCounts["Democratic"] === undefined
          ? 0
          : partyCounts["Democratic"] / partyCounts["Republican"];
    buySellRatio =
      typeCounts["Bought"] > 0 && typeCounts["Sold"] === undefined
        ? 1
        : typeCounts["Bought"] === undefined
          ? 0
          : typeCounts["Bought"] / typeCounts["Sold"];

    senateTradingList = rawData.slice(0, 20) ?? [];

    isLoaded = true;

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  });

  let columns = [
    { key: "representative", label: "Person", align: "left" },
    { key: "party", label: "Party", align: "left" },
    { key: "transactionDate", label: "Transaction Date", align: "right" },
    {
      key: "amount",
      label: "Amount",
      align: "right",
    },
    { key: "type", label: "Type", align: "right" },
  ];

  let sortOrders = {
    representative: { order: "none", type: "string" },
    party: { order: "none", type: "string" },
    transactionDate: { order: "none", type: "date" },
    amount: { order: "none", type: "string" },
    type: { order: "none", type: "string" },
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
      senateTradingList = [...originalData]?.slice(0, 50); // Reset to original data (spread to avoid mutation)
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
    senateTradingList = [...originalData].sort(compareValues)?.slice(0, 50);
  };
</script>

<SEO
  title={`${$displayCompanyName} (${$etfTicker}) ETF Congressional Trading Tracker - Political Investment Activity`}
  description={`Track US Congress and Senate trading activity for ${$displayCompanyName} (${$etfTicker}) ETF. Monitor politician trades, party breakdown, and institutional investment patterns from Democratic and Republican legislators. Essential data for understanding political sentiment toward ETF sectors and themes.`}
  keywords={`${$etfTicker} congress trading, ${$displayCompanyName} political trades, ETF congressional activity, politician ETF trades, senate ETF trading, congress stock trades, political investment tracking, ETF politician activity`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "AnalysisNewsArticle",
    headline: `${$displayCompanyName} (${$etfTicker}) ETF Congressional Trading Activity`,
    description: "Analysis of US Congress and Senate trading activity for ETF",
    about: {
      "@type": "FinancialProduct",
      name: `${$displayCompanyName} (${$etfTicker})`,
      category: "Exchange-Traded Fund",
    },
    provider: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
    url: `https://stocknear.com/etf/${$etfTicker}/insider`,
  }}
/>

<section class="w-full overflow-hidden min-h-screen h-full">
  <div class="h-full overflow-hidden w-full">
    <div class="relative flex justify-center items-center overflow-hidden">
      <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full mt-2 sm:mt-0">
        <div class="mb-6">
          <h1 class="text-xl sm:text-2xl font-bold mb-4">Congress Trading</h1>

          {#if isLoaded}
            {#if senateTradingList?.length !== 0}
              <!--Start Widget-->
              <div
                class="w-full mt-5 mb-10 m-auto flex justify-center items-center"
              >
                <div
                  class="w-full grid grid-cols-2 lg:grid-cols-4 gap-y-3 lg:gap-y-3 gap-x-3"
                >
                  <!--Start Buy/Sell-->
                  <div
                    class="flex flex-row items-center flex-wrap w-full px-3 sm:px-4 border border-gray-300 shadow dark:border-gray-600 bg-gray-200 dark:bg-primary rounded h-20"
                  >
                    <div class="flex flex-col items-start">
                      <span class="font-semibold text-sm sm:text-[1rem]"
                        >Buy/Sell</span
                      >
                      <span class="text-start text-sm sm:text-[1rem]">
                        {buySellRatio?.toFixed(3)}
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
                            class="stroke-current {buySellRatio >= 0.5
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-[#EE5365]'} "
                            stroke-width="3"
                            stroke-dasharray="100"
                            stroke-dashoffset={100 - buySellRatio * 100 >= 0
                              ? 100 - (buySellRatio * 100)?.toFixed(2)
                              : 0}
                          ></circle>
                        </g>
                      </svg>
                      <!-- Percentage Text -->
                      <div
                        class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2"
                      >
                        <span class="text-center text-sm sm:text-[1rem]"
                          >{buySellRatio?.toFixed(2)}</span
                        >
                      </div>
                    </div>
                    <!-- End Circular Progress -->
                  </div>
                  <!--End Buy/Sell-->
                  <!--Start Dem/Rep-->
                  <div
                    class="flex flex-row items-center flex-wrap w-full px-3 sm:px-4 border border-gray-300 shadow dark:border-gray-600 bg-gray-200 dark:bg-primary rounded h-20"
                  >
                    <div class="flex flex-col items-start">
                      <span class="font-semibold text-sm sm:text-[1rem]"
                        >Dem/Rep</span
                      >
                      <span class="text-start text-sm sm:text-[1rem]">
                        {partyRatio?.toFixed(3)}
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
                            stroke-dashoffset={100 - partyRatio * 100 >= 0
                              ? 100 - (partyRatio * 100)?.toFixed(2)
                              : 0}
                          ></circle>
                        </g>
                      </svg>
                      <!-- Percentage Text -->
                      <div
                        class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2"
                      >
                        <span class="text-center text-sm sm:text-[1rem]"
                          >{partyRatio?.toFixed(2)}</span
                        >
                      </div>
                    </div>
                    <!-- End Circular Progress -->
                  </div>
                  <!--End Put/Call-->
                </div>
              </div>
              <!--End Widget-->

              <div
                class="mt-6 flex justify-start items-center w-full m-auto rounded-none sm:rounded mb-4 overflow-x-auto"
              >
                <table
                  class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
                >
                  <thead>
                    <TableHeader {columns} {sortOrders} {sortData} />
                  </thead>
                  <tbody>
                    {#each senateTradingList as item}
                      <tr class="dark:sm:hover:bg-[#245073]/10">
                        <td
                          class=" text-sm sm:text-[1rem] whitespace-nowrap pb-3"
                        >
                          <div class="flex flex-row items-center">
                            <div
                              class="shrink-0 rounded-full border border-slate-700 w-9 h-9 relative {item?.party ===
                              'Republican'
                                ? 'bg-[#98272B]'
                                : item?.party === 'Democratic'
                                  ? 'bg-[#295AC7]'
                                  : 'bg-[#4E2153]'} flex items-center justify-center"
                            >
                              <img
                                style="clip-path: circle(50%);"
                                class="rounded-full w-7"
                                src={`${cloudFrontUrl}/assets/senator/${item?.representative?.replace(/\s+/g, "_")}.png`}
                                loading="lazy"
                              />
                            </div>
                            <div class="flex flex-col ml-3 font-normal">
                              <a
                                href={`/politicians/${item?.id}`}
                                class="text-blue-800 sm:hover:text-muted dark:sm:hover:text-white dark:text-blue-400"
                                >{getAbbreviatedName(
                                  item?.representative?.replace("_", " "),
                                )}</a
                              >
                            </div>
                          </div>
                          <!--{item?.firstName} {item?.lastName}-->
                        </td>

                        <td
                          class="text-start text-sm sm:text-[1rem] whitespace-nowrap"
                        >
                          {item?.party}
                        </td>

                        <td
                          class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
                        >
                          {new Date(item?.transactionDate)?.toLocaleString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              daySuffix: "2-digit",
                            },
                          )}
                        </td>

                        <td
                          class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
                        >
                          {item?.amount}
                        </td>
                        <td
                          class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
                        >
                          {#if item?.type === "Bought"}
                            <span class="text-emerald-600 dark:text-emerald-400"
                              >Bought</span
                            >
                          {:else if item?.type === "Sold"}
                            <span class="text-rose-600 dark:text-rose-400"
                              >Sold</span
                            >
                          {:else if item?.type === "Exchange"}
                            <span class="text-[#C6A755]">Exchange</span>
                          {/if}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>

              {#if rawData?.length >= 20}
                <label
                  on:click={backToTop}
                  class="w-32 py-1.5 mt-10 hover:bg-white hover:bg-opacity-[0.05] cursor-pointer m-auto flex justify-center items-center border border-gray-600 rounded-full"
                >
                  Back to top
                </label>
              {/if}
            {:else}
              <Infobox text="No data available" />
            {/if}
          {:else}
            <div class="flex justify-center items-center h-80">
              <div class="relative">
                <label
                  class="shadow bg-default dark:bg-secondary rounded h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                >
                  <span
                    class="loading loading-spinner loading-md text-white dark:text-white"
                  ></span>
                </label>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</section>

<script lang="ts">
  import { onMount } from "svelte";
  import { displayCompanyName, stockTicker } from "$lib/store";
  import { getPartyForPoliticians } from "$lib/utils";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  export let data;

  let rawData = data?.getSenateTrading;
  let buySellRatio = 0;
  let partyRatio = 0;
  let senateTradingList = [];

  rawData?.forEach((item) => {
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

  senateTradingList = rawData.slice(0, 50) ?? [];

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
  title={`${$displayCompanyName} (${$stockTicker}) Congress Trading | Political Insider Activity & Disclosure`}
  description={`Track U.S. Congress and Senate trading activity for ${$displayCompanyName} (${$stockTicker}). Monitor political insider transactions, disclosure filings, and trading patterns from elected officials with detailed transaction history and analysis.`}
  keywords={`${$stockTicker} congress trading, ${$displayCompanyName} political insider trading, senate stock trading, congress stock disclosure, ${$stockTicker} politician trades, political insider activity, congress trading tracker`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/insider/congress-trading`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "Dataset"],
    name: `${$displayCompanyName} Congress Trading Activity`,
    description: `Professional tracking of U.S. Congress and Senate trading activity for ${$displayCompanyName} (${$stockTicker})`,
    url: `https://stocknear.com/stocks/${$stockTicker}/insider/congress-trading`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Congress trading tracking",
      "Senate transaction monitoring",
      "Political insider disclosure",
      "Transaction history analysis",
      "Buy/sell ratio tracking",
      "Party affiliation analysis",
      "Trading pattern identification",
      "Disclosure timeline tracking",
    ],
    provider: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
    mainEntity: {
      "@type": "Corporation",
      name: $displayCompanyName,
      tickerSymbol: $stockTicker,
    },
    about: {
      "@type": "Thing",
      name: "Political Insider Trading",
      description:
        "Professional tracking of elected officials' stock trading activity and disclosure requirements",
    },
  }}
/>

<section class="w-full overflow-hidden min-h-screen h-full">
  <div class="h-full overflow-hidden w-full">
    <div class="relative flex justify-center items-center overflow-hidden">
      <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full">
        <div class="mb-6">
          <h1 class="text-xl sm:text-2xl font-bold mb-4">Congress Trading</h1>

          {#if senateTradingList?.length !== 0}
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
                  {#each senateTradingList as item, index}
                    <tr
                      class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd {index +
                        1 ===
                        rawData?.slice(0, 3)?.length &&
                      !['Pro', 'Plus']?.includes(data?.user?.tier)
                        ? 'opacity-[0.1]'
                        : ''}"
                    >
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
                          <span class="text-green-800 dark:text-[#00FC50]"
                            >Bought</span
                          >
                        {:else if item?.type === "Sold"}
                          <span class="text-red-800 dark:text-[#FF2F1F]"
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

            <UpgradeToPro {data} />
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
        </div>
      </div>
    </div>
  </div>
</section>

<script lang="ts">
  import { displayCompanyName, screenWidth, stockTicker } from "$lib/store";
  import { onMount } from "svelte";
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
  import { goto } from "$app/navigation";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import AnalystInfo from "$lib/components/AnalystInfo.svelte";

  import { removeCompanyStrings } from "$lib/utils";
  export let data;

  let analystRating = {};

  let rawData = [];
  let historyList = [];
  let priceTarget = "n/a";
  let numOfAnalyst = "n/a";
  let consensusRating = "n/a";
  let changesPercentage = "n/a";

  const tabs = [
    {
      title: "All Analysts",
    },
    {
      title: "Top Analysts",
    },
  ];

  let activeIdx = 0;
  function changeTab(index) {
    activeIdx = index;

    if (Object?.keys(analystRating)?.length !== 0) {
      numOfAnalyst = analystRating?.numOfAnalyst;
      priceTarget =
        analystRating?.medianPriceTarget !== ("n/a" && 0)
          ? analystRating?.medianPriceTarget
          : "-";
      consensusRating = analystRating?.consensusRating;
      changesPercentage =
        analystRating?.medianPriceTarget !== "n/a" &&
        analystRating?.medianPriceTarget !== null &&
        analystRating?.medianPriceTarget !== undefined &&
        data?.getStockQuote?.price !== null
          ? (
              (analystRating.medianPriceTarget / data.getStockQuote.price - 1) *
              100
            )?.toFixed(2)
          : "-";
    }

    function filterLatestEntries(data) {
      const latestEntries = {};

      data?.forEach((entry) => {
        try {
          // Create a unique key by combining 'analyst' and 'name'
          const key = `${entry.analyst}-${entry.name}`;

          // Convert date and time to a Date object
          const dateTimeStr = `${entry.date}`;
          const dateTime = new Date(dateTimeStr);

          // Check if this entry is the latest for the given key
          if (!latestEntries[key] || dateTime > latestEntries[key].dateTime) {
            latestEntries[key] = { dateTime, entry };
          }
        } catch (e) {
          console.error(`Error processing entry: ${e}`);
        }
      });

      // Return only the latest entries
      return Object?.values(latestEntries)?.map(({ entry }) => entry);
    }

    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    rawData =
      data?.getAnalystTickerHistory?.filter(
        (item) => item?.analystScore >= 4,
      ) ?? [];
    rawData = filterLatestEntries(rawData);

    if (activeIdx === 1) {
      const recentData = rawData
        ?.filter((item) => {
          const date = new Date(item?.date);
          return date >= oneYearAgo;
        })
        ?.slice(0, 30); //Consider only the last 30 ratings in the last 12 months

      const filteredAnalystCount = recentData?.length ?? "n/a";
      const priceTargets = recentData
        ?.map((item) => parseFloat(item?.adjusted_pt_current))
        ?.filter((pt) => !isNaN(pt));
      const medianPriceTarget = priceTargets?.length
        ? priceTargets?.sort((a, b) => a - b)[
            Math.floor(priceTargets?.length / 2)
          ]
        : "n/a";

      numOfAnalyst = filteredAnalystCount === 0 ? "n/a" : filteredAnalystCount;
      priceTarget = medianPriceTarget;
      changesPercentage =
        medianPriceTarget !== "-" &&
        medianPriceTarget !== "n/a" &&
        data?.getStockQuote?.price != null
          ? (
              (medianPriceTarget / data?.getStockQuote.price - 1) *
              100
            )?.toFixed(2)
          : "n/a";

      // Consensus rating calculation based on rating_current
      const ratingScores = {
        "Strong Buy": 5,
        Buy: 4,
        Hold: 3,
        Sell: 2,
        "Strong Sell": 1,
      };

      const totalRatingScore = recentData
        ?.map((item) => ratingScores[item.rating_current] || 0)
        ?.reduce((sum, score) => sum + score, 0);

      const averageRatingScore = filteredAnalystCount
        ? totalRatingScore / filteredAnalystCount
        : 0;

      consensusRating =
        averageRatingScore >= 4.5
          ? "Strong Buy"
          : averageRatingScore >= 3.5
            ? "Buy"
            : averageRatingScore >= 2.5
              ? "Hold"
              : averageRatingScore >= 1.5
                ? "Sell"
                : averageRatingScore >= 1
                  ? "Strong Sell"
                  : "n/a";

      rawData = recentData;
      historyList = rawData.slice(0, 50);
    } else {
      rawData = data?.getAnalystTickerHistory;
      historyList = rawData.slice(0, 50);
    }
  }

  async function handleScroll() {
    const scrollThreshold = document.body.offsetHeight * 0.8; // 80% of the website height
    const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;
    if (isBottom && historyList?.length !== rawData?.length) {
      const nextIndex = historyList?.length;
      const filteredNewResults = rawData?.slice(nextIndex, nextIndex + 50);
      historyList = [...historyList, ...filteredNewResults];
    }
  }

  function latestInfoDate(inputDate) {
    // Convert the input date string to milliseconds since epoch
    const inputDateMs = Date?.parse(inputDate);

    // Get today's date in milliseconds since epoch
    const todayMs = Date?.now();

    // Calculate the difference in milliseconds
    const differenceInMs = todayMs - inputDateMs;

    // Convert milliseconds to days
    const differenceInDays = Math?.floor(
      differenceInMs / (1000 * 60 * 60 * 24),
    );

    // Return the difference in days
    return differenceInDays <= 4;
  }

  onMount(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  });

  function formatNumber(value) {
    if (value == null || value === undefined || value === "") {
      return "n/a";
    }

    const num = Number(value);

    if (isNaN(num)) {
      return "n/a";
    }

    // If it's a whole number, don't show decimals
    if (num % 1 === 0) {
      return num.toString();
    }

    // Otherwise, show up to 2 decimal places, removing trailing zeros
    return parseFloat(num.toFixed(2)).toString();
  }

  $: charNumber = $screenWidth < 640 ? 20 : 30;

  $: {
    if ($stockTicker) {
      historyList = [];
      analystRating = data?.getAnalystSummary ?? {};
      rawData = data?.getAnalystTickerHistory ?? [];
      activeIdx = 0;
      changeTab(0);
    }
  }
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Analyst Ratings | Price Targets & Recommendations`}
  description={`Comprehensive analyst ratings and price targets for ${$displayCompanyName} (${$stockTicker}). Track Wall Street analyst upgrades, downgrades, consensus ratings, and professional forecasts from top investment firms and research houses.`}
  keywords={`${$stockTicker} analyst ratings, ${$displayCompanyName} price targets, Wall Street recommendations, ${$stockTicker} analyst upgrades, stock analyst opinions, price target consensus, ${$stockTicker} analyst forecasts, investment research ratings`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/forecast/analyst`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "Review"],
    name: `${$displayCompanyName} Analyst Ratings`,
    description: `Professional analyst ratings and price targets for ${$displayCompanyName} (${$stockTicker})`,
    url: `https://stocknear.com/stocks/${$stockTicker}/forecast/analyst`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Analyst ratings tracking",
      "Price target analysis",
      "Consensus ratings",
      "Upgrade/downgrade alerts",
      "Research firm opinions",
      "Investment recommendations",
      "Rating history tracking",
      "Analyst accuracy metrics",
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
  }}
/>

<section class=" overflow-hidden h-full min-h-screen mb-40 sm:mb-0 w-full">
  <div class="flex justify-center m-auto h-full overflow-hidden w-full">
    <div
      class="relative flex justify-center items-center overflow-hidden w-full"
    >
      <div class="sm:pl-4 sm:pt-4 w-full m-auto mt-2 sm:mt-0">
        <div class="mb-4">
          <div
            class="mb-5 flex flex-col justify-between gap-y-2.5 sm:mb-2 sm:flex-row sm:items-end"
          >
            <h1 class="mb-px text-xl font-bold sm:text-2xl sm:pl-1">
              {removeCompanyStrings($displayCompanyName)} Analyst Ratings
            </h1>
            <div>
              <div class="flex flex-col w-full sm:w-fit items-end justify-end">
                <InfoModal
                  id="topAnalyst"
                  title="Top Analyst"
                  content="Filter by only analysts with 4+ stars based on their success rate and
          average return per rating. 4+ star analysts have a high accuracy and
          high average return per rating."
                />

                <div
                  class="inline-flex justify-center w-full rounded sm:w-auto"
                >
                  <div
                    class="bg-default text-white dark:bg-secondary w-full sm:w-fit relative flex flex-wrap items-center justify-center rounded p-1"
                  >
                    {#each tabs as item, i}
                      {#if !["Pro", "Plus"]?.includes(data?.user?.tier) && i > 0}
                        <button
                          on:click={() => goto("/pricing")}
                          class="cursor-pointer group relative z-1 rounded-full w-1/2 min-w-24 md:w-auto px-5 py-1"
                        >
                          <span class="relative text-sm block font-semibold">
                            {item.title}
                            <svg
                              class="inline-block ml-0.5 -mt-1 w-3.5 h-3.5"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              ><path
                                fill="currentColor"
                                d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                              /></svg
                            >
                          </span>
                        </button>
                      {:else}
                        <button
                          on:click={() => changeTab(i)}
                          class="cursor-pointer group relative z-1 rounded-full w-1/2 min-w-24 md:w-auto px-5 py-1 {activeIdx ===
                          i
                            ? 'z-0'
                            : ''} "
                        >
                          {#if activeIdx === i}
                            <div
                              class="absolute inset-0 rounded bg-[#fff]"
                            ></div>
                          {/if}
                          <span
                            class="relative text-sm block font-semibold whitespace-nowrap {activeIdx ===
                            i
                              ? 'text-black'
                              : ''}"
                          >
                            {item.title}
                          </span>
                        </button>
                      {/if}
                    {/each}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="shadow-xs mb-4 grid grid-cols-2 grid-rows-2 divide-contrast rounded border border-gray-300 dark:border-gray-600 md:grid-cols-4 md:grid-rows-1 md:divide-x"
        >
          <div
            class="p-4 bp:p-5 sm:p-6 border-r border-gray-300 dark:border-gray-600"
          >
            <div class="text-[1rem] font-normal">Total Analysts</div>

            <div
              class="mt-1 break-words font-semibold leading-8 text-xl sm:text-2xl"
            >
              {numOfAnalyst}
            </div>
          </div>
          <div
            class="p-4 bp:p-5 sm:p-6 border-r-0 md:border-r border-gray-300 dark:border-gray-600"
          >
            <div class="text-[1rem] font-normal">Consensus Rating</div>
            <div
              class="mt-1 break-words font-semibold leading-8 text-xl sm:text-2xl"
            >
              {consensusRating}
            </div>
          </div>
          <div
            class="p-4 bp:p-5 sm:p-6 border-r-0 md:border-r border-t md:border-t-0 border-gray-300 dark:border-gray-600"
          >
            <div class="text-[1rem] font-normal">Price Target</div>
            <div
              class="mt-1 break-words font-semibold leading-8 text-xl sm:text-2xl"
            >
              {priceTarget !== null && priceTarget !== undefined
                ? priceTarget
                : "n/a"}
            </div>
          </div>
          <div
            class="p-4 bp:p-5 sm:p-6 border-t border-gray-300 dark:border-gray-600 md:border-0 border-l border-gray-300 dark:border-gray-600 md:border-0"
          >
            <div class="text-[1rem] font-normal">Upside</div>
            <div
              class="mt-1 break-words font-semibold leading-8 text-xl sm:text-2xl {changesPercentage &&
              changesPercentage >= 0
                ? "before:content-['+'] after:content-['%'] text-green-800 dark:text-[#00FC50]"
                : changesPercentage && changesPercentage < 0
                  ? "after:content-['%'] text-red-800 dark:text-[#FF2F1F]"
                  : ''}"
            >
              {changesPercentage ?? "n/a"}
            </div>
          </div>
        </div>

        {#if rawData?.length !== 0}
          {#if activeIdx === 1}
            <Infobox
              text="Considering only the latest rating within the past 12 months from each unique analyst with a 4-star or higher rating."
            />
          {/if}

          <div
            class="mt-10 mb-2 items-center justify-between py-0 md:mt-8 md:flex md:py-2"
          >
            <div class="flex justify-between md:block">
              <h3 class="text-xl sm:text-2xl font-bold">Ratings History</h3>
            </div>
          </div>

          <div class=" w-full m-auto mb-4 overflow-x-auto lg:overflow-hidden">
            <table
              class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
            >
              <thead class="text-white bg-default">
                <tr>
                  <td class=" font-semibold text-sm sm:text-[1rem] text-start"
                    >Analyst</td
                  >
                  <td class=" font-semibold text-sm sm:text-[1rem] text-start"
                    >Firm</td
                  >
                  <td class=" font-semibold text-sm sm:text-[1rem] text-end"
                    >Rating</td
                  >
                  <td class=" font-semibold text-sm sm:text-[1rem] text-end"
                    >Action</td
                  >
                  <td class=" font-semibold text-sm sm:text-[1rem] text-end"
                    >Price Target</td
                  >
                  <td class=" font-semibold text-sm sm:text-[1rem] text-end"
                    >Upside</td
                  >

                  <td class=" font-semibold text-sm sm:text-[1rem] text-end"
                    >Date</td
                  >
                </tr>
              </thead>
              <tbody>
                {#each ["Pro", "Plus"]?.includes(data?.user?.tier) ? historyList : historyList?.slice(0, 3) as item, index}
                  <tr
                    class=" {latestInfoDate(item?.date)
                      ? 'bg-blue-100 dark:bg-[#F9AB00]/10  shadow'
                      : 'dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd'}  {index +
                      1 ===
                      historyList?.slice(0, 3)?.length &&
                    !['Pro', 'Plus']?.includes(data?.user?.tier)
                      ? 'opacity-[0.1]'
                      : ''}"
                  >
                    <td
                      class="text-sm sm:text-[1rem] whitespace-nowrap text-start"
                    >
                      <div class="flex flex-col items-start">
                        <a
                          href={item?.analystId !== null
                            ? `/analysts/${item?.analystId}`
                            : "#"}
                          class="font-semibold dark:font-normal text-blue-800 sm:hover:text-muted dark:sm:hover:text-white dark:text-blue-400"
                          >{item?.analyst_name}
                        </a>

                        <div class="flex flex-row items-center mt-1">
                          {#each Array.from({ length: 5 }) as _, i}
                            {#if item?.analystScore < 1 && item?.analystScore > 0 && i === 0}
                              <!-- Render a half-filled star when analystScore is 0 -->
                              <svg
                                class="w-4 h-4"
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 22 20"
                              >
                                <defs>
                                  <linearGradient id="halfGradient">
                                    <stop offset="30%" stop-color="#FFA500" />
                                    <stop offset="30%" stop-color="gray" />
                                  </linearGradient>
                                </defs>
                                <path
                                  fill="url(#halfGradient)"
                                  d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"
                                />
                              </svg>
                            {:else if i < Math.floor(item?.analystScore)}
                              <!-- Render a full star -->
                              <svg
                                class="w-4 h-4 text-[#FFA500] dark:text-[#FFA500]"
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
                              <!-- Render an empty star -->
                              <svg
                                class="w-4 h-4 text-gray-400 dark:text-gray-500"
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
                      </div>
                    </td>

                    <td
                      class="text-sm sm:text-[1rem] whitespace-nowrap text-start"
                    >
                      {item?.analyst?.length > charNumber
                        ? item?.analyst?.slice(0, charNumber) + "..."
                        : item?.analyst}
                    </td>

                    <td
                      class="text-sm sm:text-[1rem] whitespace-nowrap text-end"
                    >
                      {item?.rating_current}
                    </td>

                    <td
                      class="text-sm sm:text-[1rem] whitespace-nowrap text-end"
                    >
                      {item?.action_company?.replace(
                        "Initiates Coverage On",
                        "Initiates",
                      )}
                    </td>

                    <td
                      class="text-sm sm:text-[1rem] whitespace-nowrap text-end font-semibold"
                    >
                      <div class="flex flex-col items-end">
                        <div class="flex flex-row items-center">
                          {#if Math?.ceil(item?.adjusted_pt_prior) !== 0}
                            <span class="font-normal">
                              {formatNumber(item?.adjusted_pt_prior)}
                            </span>
                            <svg
                              class="w-3 h-3 ml-1 mr-1 inline-block"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                            >
                              <path
                                fill="none"
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2.5"
                                d="M4 12h16m0 0l-6-6m6 6l-6 6"
                              />
                            </svg>
                            <span class=""
                              >{formatNumber(item?.adjusted_pt_current)}</span
                            >
                          {:else if Math?.ceil(item?.adjusted_pt_current) !== 0}
                            <span class=""
                              >{formatNumber(item?.adjusted_pt_current)}</span
                            >
                          {:else}
                            <span class="">n/a</span>
                          {/if}
                        </div>
                      </div>
                    </td>
                    <td
                      class="text-sm sm:text-[1rem] whitespace-nowrap text-end"
                    >
                      {#if Math?.ceil(item?.adjusted_pt_current) !== 0}
                        <span
                          class="text-sm sm:text-[1rem] whitespace-nowrap text-end {item?.adjusted_pt_current /
                            data?.getStockQuote?.price -
                            1 >=
                          0
                            ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
                            : item?.adjusted_pt_current /
                                  data?.getStockQuote?.price -
                                  1 <
                                0
                              ? 'text-red-800 dark:text-[#FF2F1F]'
                              : ''}"
                        >
                          {(
                            (item?.adjusted_pt_current /
                              data?.getStockQuote?.price -
                              1) *
                            100
                          )?.toFixed(2)}%
                        </span>
                      {:else}
                        <span class="">n/a</span>
                      {/if}
                    </td>

                    <td
                      class=" text-end text-sm sm:text-[1rem] whitespace-nowrap"
                    >
                      <div class="flex flex-col items-end">
                        {#if latestInfoDate(item?.date)}
                          <label
                            class="border-gray-300 shadow bg-black dark:bg-[#fff] text-white dark:text-black font-semibold text-xs rounded px-2 py-0.5 ml-3 mb-1"
                          >
                            New
                          </label>
                        {/if}
                        {new Date(item?.date).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          daySuffix: "2-digit",
                          timeZone: "UTC",
                        })}
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else if activeIdx === 1}
          <Infobox
            text={`There are no top analyst ratings available for the past 12 months for
              ${removeCompanyStrings($displayCompanyName)}`}
          />
        {/if}

        {#if rawData?.length !== 0}
          <UpgradeToPro {data} />
        {/if}
        {#if !["Pro", "Plus"]?.includes(data?.user?.tier)}
          <AnalystInfo />
        {/if}
      </div>
    </div>
  </div>
</section>

<script lang="ts">
  import { openPriceAlert } from "$lib/store";
  import {
    groupNews,
    groupEarnings,
    compareTimes,
    formatTime,
    abbreviateNumber,
  } from "$lib/utils";
  //import { enhance } from '$app/forms';
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";

  import { goto } from "$app/navigation";
  import { screenWidth, newPriceAlertData } from "$lib/store";
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";
  import { Combobox } from "bits-ui";
  import PriceAlert from "$lib/components/PriceAlert.svelte";
  import { onMount } from "svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;

  let timeoutId;
  let searchBarData = [];

  let addTicker = "";
  let addAssetType = "";
  let activeIdx = 0;
  let rawTabData = [];
  let displayList = [];
  let editMode = false;
  let numberOfChecked = 0;
  let priceAlertList = data?.getPriceAlert?.data || [];

  let deletePriceAlertList = [];
  let news = data?.getPriceAlert?.news || [];
  let earnings = data?.getPriceAlert?.earnings || [];

  news = news?.map((item) => {
    const match = priceAlertList?.find((w) => w?.symbol === item?.symbol);
    return match ? { ...item, type: match?.type } : { ...item };
  });
  earnings = earnings?.map((item) => {
    const match = priceAlertList?.find((w) => w?.symbol === item?.symbol);
    return match ? { ...item, name: match?.name } : { ...item };
  });
  let groupedNews = [];
  let groupedEarnings = [];

  if (priceAlertList?.length > 0) {
    groupedEarnings = groupEarnings(earnings);
    groupedNews = groupNews(news, priceAlertList);
  } else {
    groupedEarnings = [];
    groupedNews = [];
  }
  changeTab(0);

  const tabs = [
    {
      title: "News",
    },
    {
      title: "Earnings Release",
    },
  ];

  async function handleFilter(priceAlertId) {
    const filterSet = new Set(deletePriceAlertList);

    // Check if the new filter already exists in the list
    if (filterSet?.has(priceAlertId)) {
      // If it exists, remove it from the list
      filterSet?.delete(priceAlertId);
    } else {
      // If it doesn't exist, add it to the list
      filterSet?.add(priceAlertId);
    }
    deletePriceAlertList = Array?.from(filterSet);
    numberOfChecked = deletePriceAlertList?.length;
  }

  async function handleDeleteTickers() {
    if (numberOfChecked === 0) {
      toast?.error(`You need to select symbols before you can delete them`, {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    } else {
      toast.success(`Price alerts deleted successfully`, {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });

      const symbolsToDelete = priceAlertList
        ?.filter((item) => deletePriceAlertList.includes(item.id))
        .map((item) => item.symbol);

      // Filter out the price alerts
      priceAlertList = priceAlertList?.filter(
        (item) => !deletePriceAlertList?.includes(item.id),
      );

      // Filter news and earnings using the symbolsToDelete
      news = news?.filter(
        (newsItem) => !symbolsToDelete.includes(newsItem?.symbol),
      );

      earnings = earnings?.filter(
        (earningsItem) => !symbolsToDelete.includes(earningsItem?.symbol),
      );
      priceAlertList = [...priceAlertList];

      if (priceAlertList?.length > 0) {
        groupedNews = [...groupNews(news, priceAlertList)];
        groupedEarnings = [...groupEarnings(earnings)];
      } else {
        groupedEarnings = [];
        groupedNews = [];
      }

      const postData = {
        priceAlertIdList: deletePriceAlertList,
      };

      deletePriceAlertList = [];
      numberOfChecked = 0;
      editMode = !editMode;

      await fetch("/api/delete-price-alert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });
    }
  }

  async function handleAddAlert(event, ticker, assetType) {
    addTicker = ticker;
    addAssetType = assetType?.toLowerCase();
    const postData = {
      path: "get-quote",
      ticker: ticker,
    };

    const response = await fetch("/api/ticker-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });
    const output = await response?.json();

    data.getStockQuote = output;

    const clicked = document.getElementById("priceAlertModal");
    clicked?.dispatchEvent(new MouseEvent("click"));

    editMode = false;
    $openPriceAlert = true;

    inputValue = "";
    event?.preventDefault();
  }

  function changeTab(i) {
    activeIdx = i;
    if (activeIdx === 0) {
      rawTabData = groupedNews;
    } else {
      rawTabData = groupedEarnings;
    }
    displayList = rawTabData?.slice(0, 8);
  }

  async function getPriceAlertList() {
    const response = await fetch("/api/get-price-alert", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    let output = await response.json();
    output.data = output?.data?.sort((a, b) =>
      a?.symbol?.localeCompare(b?.symbol),
    );
    priceAlertList = [...output?.data];

    news = output?.news;
    earnings = output?.earnings;

    news = news?.map((item) => {
      const match = priceAlertList?.find((w) => w?.symbol === item?.symbol);
      return match ? { ...item, type: match?.type } : { ...item };
    });

    earnings = earnings?.map((item) => {
      const match = priceAlertList?.find((w) => w?.symbol === item?.symbol);
      return match ? { ...item, name: match?.name } : { ...item };
    });
    if (priceAlertList?.length > 0) {
      groupedEarnings = groupEarnings(earnings);
      groupedNews = groupNews(news, priceAlertList);
    } else {
      groupedEarnings = [];
      groupedNews = [];
    }
    changeTab(0);
  }

  $: charNumber = $screenWidth < 640 ? 15 : 40;

  $: {
    if (Object?.keys($newPriceAlertData)?.length > 0) {
      getPriceAlertList();
    }
  }

  function handleEditMode() {
    if (editMode === true) {
      deletePriceAlertList = [];
      numberOfChecked = 0;
    }
    editMode = !editMode;
  }

  async function handleScroll() {
    const scrollThreshold = document.body.offsetHeight * 0.8; // 80% of the website height
    const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;
    if (isBottom && displayList?.length !== rawTabData?.length) {
      const nextIndex = displayList?.length;
      const filteredItem = rawTabData?.slice(nextIndex, nextIndex + 8);
      displayList = [...displayList, ...filteredItem];
    }
  }

  onMount(async () => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  });

  let inputValue = "";
  let touchedInput = false;

  async function search() {
    clearTimeout(timeoutId); // Clear any existing timeout

    if (!inputValue.trim()) {
      // Skip if query is empty or just whitespace
      searchBarData = []; // Clear previous results
      return;
    }

    timeoutId = setTimeout(async () => {
      const response = await fetch(
        `/api/searchbar?query=${encodeURIComponent(inputValue)}&limit=10`,
      );
      searchBarData = await response?.json();
    }, 50); // delay
  }
</script>

<SEO
  title="Stock Price Alerts - Real-Time Price Notifications & Market Updates"
  description="Create custom stock price alerts and get instant notifications when your target prices are hit. Track earnings, news, and price movements for your watchlist with real-time market data."
  keywords="stock price alerts, price notifications, stock alerts, price targets, earnings calendar, stock news feed, real-time alerts, market notifications, stock watchlist, price monitoring"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Price Alerts - Stocknear",
    description:
      "Real-time stock price alert system with instant notifications",
    applicationCategory: "FinanceApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Custom price alerts",
      "Real-time notifications",
      "Earnings calendar integration",
      "News feed monitoring",
      "Multiple condition types",
      "Volume tracking",
    ],
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-3 text-gray-700 dark:text-zinc-200"
>
  <div
    class="text-sm sm:text-[0.95rem] breadcrumbs text-gray-500 dark:text-zinc-400"
  >
    <ul>
      <li>
        <a
          href="/"
          class="text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
          >Home</a
        >
      </li>
      <li class="text-gray-500 dark:text-zinc-400">Price Alert</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class="mb-6 border-b border-gray-300 dark:border-zinc-700">
            <h1
              class="mb-1 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              Price Alerts
            </h1>
          </div>

          {#if data?.user}
            <div
              class="w-full grid grid-cols-2 gap-3 sm:gap-0 sm:flex sm:flex-row sm:items-center"
            >
              <div class="order-4 w-fit flex justify-end sm:ml-3">
                <div class="flex flex-row items-center justify-end">
                  {#if editMode}
                    <label
                      on:click={handleDeleteTickers}
                      class="border text-sm border-gray-300 dark:border-zinc-700 mr-2 cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded-full py-2 pl-3 pr-4 font-semibold bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 transition hover:text-rose-600 dark:hover:text-rose-400"
                    >
                      <svg
                        class="inline-block w-5 h-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        ><path
                          fill="currentColor"
                          d="M10 5h4a2 2 0 1 0-4 0M8.5 5a3.5 3.5 0 1 1 7 0h5.75a.75.75 0 0 1 0 1.5h-1.32l-1.17 12.111A3.75 3.75 0 0 1 15.026 22H8.974a3.75 3.75 0 0 1-3.733-3.389L4.07 6.5H2.75a.75.75 0 0 1 0-1.5zm2 4.75a.75.75 0 0 0-1.5 0v7.5a.75.75 0 0 0 1.5 0zM14.25 9a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0v-7.5a.75.75 0 0 1 .75-.75m-7.516 9.467a2.25 2.25 0 0 0 2.24 2.033h6.052a2.25 2.25 0 0 0 2.24-2.033L18.424 6.5H5.576z"
                        /></svg
                      >
                      <span class="ml-1 text-sm">
                        {numberOfChecked}
                      </span>
                    </label>
                  {/if}
                  <label
                    on:click={handleEditMode}
                    class="border text-sm border-gray-300 dark:border-zinc-700 cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded-full py-2 px-3 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 transition hover:text-violet-600 dark:hover:text-violet-400"
                  >
                    <svg
                      class="inline-block w-5 h-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 1024 1024"
                      ><path
                        fill="currentColor"
                        d="M832 512a32 32 0 1 1 64 0v352a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h352a32 32 0 0 1 0 64H192v640h640z"
                      /><path
                        fill="currentColor"
                        d="m469.952 554.24l52.8-7.552L847.104 222.4a32 32 0 1 0-45.248-45.248L477.44 501.44l-7.552 52.8zm422.4-422.4a96 96 0 0 1 0 135.808l-331.84 331.84a32 32 0 0 1-18.112 9.088L436.8 623.68a32 32 0 0 1-36.224-36.224l15.104-105.6a32 32 0 0 1 9.024-18.112l331.904-331.84a96 96 0 0 1 135.744 0z"
                      /></svg
                    >
                    {#if !editMode}
                      <span class="ml-1 text-[0.85rem] sm:text-sm">
                        Edit Alert
                      </span>
                    {:else}
                      <span class="ml-1 text-sm sm:text-[1rem]"> Cancel </span>
                    {/if}
                  </label>
                </div>
              </div>

              <div class="order-2 sm:order-1 w-full sm:w-fit">
                <Combobox.Root
                  items={searchBarData}
                  bind:inputValue
                  bind:touchedInput
                >
                  <div class="relative w-full">
                    <Combobox.Input
                      on:input={search}
                      class="py-2 text-[0.85rem] sm:text-sm border bg-white/80 dark:bg-zinc-950/60 border-gray-300 dark:border-zinc-700 rounded-full placeholder:text-gray-500 dark:placeholder:text-zinc-400 px-3 focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80 grow w-full sm:min-w-56"
                      placeholder="Find..."
                      aria-label="Find..."
                    />
                  </div>
                  <Combobox.Content
                    class="w-auto z-10 rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 px-1 py-1.5 shadow-none outline-hidden"
                    sideOffset={8}
                  >
                    {#if inputValue?.length > 0}
                      {#each searchBarData as item}
                        <Combobox.Item
                          class="cursor-pointer border-b border-gray-300 dark:border-zinc-700 last:border-none flex h-fit w-auto select-none items-center rounded-button py-2 pl-5 pr-1.5 text-sm capitalize outline-hidden transition-all duration-75 data-[highlighted]:text-violet-600 dark:data-[highlighted]:text-violet-400"
                          value={item.symbol}
                          label={item.name}
                          on:click={(e) =>
                            handleAddAlert(e, item?.symbol, item?.type)}
                        >
                          <div class="flex flex-col items-start">
                            <span
                              class="text-sm text-gray-700 dark:text-zinc-200"
                              >{item?.symbol}</span
                            >
                            <span
                              class="text-xs sm:text-sm text-gray-500 dark:text-zinc-400"
                              >{item?.name}</span
                            >
                          </div>
                        </Combobox.Item>
                      {:else}
                        <span
                          class="block px-5 py-2 text-sm text-gray-500 dark:text-zinc-400"
                        >
                          No results found
                        </span>
                      {/each}
                    {:else}
                      <Combobox.Item
                        class="cursor-pointer border-b border-gray-300 dark:border-zinc-700 last:border-none flex h-fit w-auto select-none items-center rounded-button py-1.5 pl-5 pr-1.5 text-sm capitalize outline-hidden"
                      >
                        <span class=" text-sm text-gray-500 dark:text-zinc-400">
                          No results found
                        </span>
                      </Combobox.Item>
                    {/if}
                  </Combobox.Content>
                </Combobox.Root>
              </div>
            </div>
            <!--Start Table-->
            {#if priceAlertList?.length > 0}
              <div
                class="w-full rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 overflow-hidden overflow-x-auto mt-4"
              >
                <table
                  class="table table-sm table-compact w-full m-auto text-sm sm:text-[0.95rem] text-gray-700 dark:text-zinc-200 tabular-nums"
                >
                  <!-- head -->
                  <thead
                    class="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400 bg-white/60 dark:bg-zinc-950/30"
                  >
                    <tr class="border-b border-gray-300 dark:border-zinc-700">
                      <th
                        class=" font-semibold text-[11px] sm:text-[12px] text-left"
                        >Symbol</th
                      >
                      <th
                        class=" font-semibold text-[11px] sm:text-[12px] text-left"
                        >Company</th
                      >

                      <th
                        class=" font-semibold text-end text-[11px] sm:text-[12px]"
                        >Price Target</th
                      >
                      <th
                        class=" font-semibold text-end text-[11px] sm:text-[12px]"
                        >Condition</th
                      >
                      <th
                        class=" font-semibold text-end text-[11px] sm:text-[12px]"
                      >
                        Price</th
                      >
                      <th
                        class=" font-semibold text-end text-[11px] sm:text-[12px]"
                        >% Change</th
                      >
                      <th
                        class=" font-semibold text-end text-[11px] sm:text-[12px]"
                        >Volume</th
                      >
                    </tr>
                  </thead>
                  <tbody class="p-3">
                    {#each priceAlertList as item}
                      <!-- row -->
                      <tr
                        class="border-b border-gray-300 dark:border-zinc-700 last:border-none"
                      >
                        <td
                          on:click={() => handleFilter(item?.id)}
                          class="text-sm sm:text-[0.95rem] whitespace-nowrap text-start flex flex-row items-center"
                        >
                          <input
                            type="checkbox"
                            checked={deletePriceAlertList?.includes(item?.id) ??
                              false}
                            class="{!editMode
                              ? 'hidden'
                              : ''} h-[18px] w-[18px] rounded-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 ring-offset-0 mr-3 cursor-pointer"
                          />
                          {#if editMode}
                            <label
                              class="text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 cursor-pointer transition"
                            >
                              {item?.symbol}
                            </label>
                          {:else}
                            <HoverStockChart
                              symbol={item?.symbol}
                              assetType={item?.type}
                            />
                          {/if}
                        </td>

                        <td
                          class=" text-sm sm:text-[0.95rem] whitespace-nowrap"
                        >
                          {item?.name?.length > charNumber
                            ? item?.name?.slice(0, charNumber) + "..."
                            : item?.name}
                        </td>

                        <td
                          class=" text-sm sm:text-[0.95rem] whitespace-nowrap text-end"
                        >
                          {item?.targetPrice}
                        </td>

                        <td
                          class=" text-sm sm:text-[0.95rem] whitespace-nowrap text-end"
                        >
                          {item?.condition}
                        </td>

                        <td
                          class=" text-sm sm:text-[0.95rem] whitespace-nowrap text-end"
                        >
                          {item?.price?.toFixed(2)}
                        </td>

                        <td
                          class=" text-sm sm:text-[0.95rem] whitespace-nowrap text-end"
                        >
                          {#if item?.changesPercentage >= 0}
                            <span class="text-emerald-600 dark:text-emerald-400"
                              >+{item?.changesPercentage?.toFixed(2)}%</span
                            >
                          {:else}
                            <span class="text-rose-600 dark:text-rose-400"
                              >{item?.changesPercentage?.toFixed(2)}%
                            </span>
                          {/if}
                        </td>
                        <td
                          class=" text-sm sm:text-[0.95rem] whitespace-nowrap text-end"
                        >
                          {abbreviateNumber(item?.volume)}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>

              <div
                class="w-full m-auto border-b border-gray-300 dark:border-zinc-700 mt-10 mb-5"
              ></div>

              <div class=" ">
                <div
                  class="inline-flex justify-center w-full rounded sm:w-auto mb-3"
                >
                  <div
                    class=" flex flex-col sm:flex-row items-start sm:items-center w-full justify-between"
                  >
                    <div class="">
                      <div class="inline-flex">
                        <div class="inline-flex gap-1">
                          {#each tabs as item, i}
                            <button
                              on:click={() => changeTab(i)}
                              class="cursor-pointer px-3 py-1.5 text-sm font-medium focus:z-10 focus:outline-none transition-colors duration-150 rounded-full border
                          {activeIdx === i
                                ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-gray-900 dark:text-white'
                                : 'border-transparent text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200 dark:hover:border-zinc-800/80'}"
                            >
                              {item.title}
                            </button>
                          {/each}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {#if activeIdx === 0}
                  {#if groupedNews?.length > 0}
                    {#each displayList as [date, titleGroups]}
                      <h3
                        class="mb-1.5 mt-3 font-semibold text-gray-500 dark:text-zinc-400"
                      >
                        {date}
                      </h3>
                      <div
                        class="border border-gray-300 dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40"
                      >
                        {#each titleGroups as { title, items, symbols }, index}
                          <div
                            class="flex border-gray-200 {index > 0
                              ? 'border-t'
                              : ''} dark:border-zinc-700 text-sm"
                          >
                            <div
                              class="hidden min-w-[100px] items-center justify-center bg-gray-50/80 dark:bg-zinc-900/60 p-1 text-xs text-gray-500 dark:text-zinc-400 lg:flex"
                            >
                              {new Date(
                                items[0].publishedDate,
                              ).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </div>
                            <div class="grow px-3 py-2 lg:py-1">
                              <h4 class="text-sm font-semibold lg:text-base">
                                {title}
                              </h4>
                              <div
                                class="flex flex-wrap gap-x-2 pt-2 text-sm lg:pt-0.5"
                              >
                                <div class=" lg:hidden">
                                  {new Date(
                                    items[0].publishedDate,
                                  ).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </div>
                                <div class="flex flex-wrap gap-x-2">
                                  {#each symbols as symbol}
                                    <a
                                      href={`/${items[0].type}/${symbol}`}
                                      class="text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                                    >
                                      {symbol}
                                    </a>
                                  {/each}
                                </div>
                              </div>
                            </div>
                          </div>
                        {/each}
                      </div>
                    {/each}
                  {:else}
                    <div
                      class="text-sm sm:text-[1rem] mt-5 text-gray-600 dark:text-zinc-300"
                    >
                      No news yet. Add some stocks to the price alert list to
                      see the latest news.
                    </div>
                  {/if}
                {:else if groupedEarnings?.length > 0}
                  {#each displayList as [date, titleGroups]}
                    <h3
                      class="mb-1.5 mt-3 font-semibold text-gray-500 dark:text-zinc-400"
                    >
                      {date}
                    </h3>
                    <div
                      class="border border-gray-300 dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40"
                    >
                      {#each titleGroups as item, index}
                        <div
                          class="flex border-gray-300 dark:border-zinc-700 text-sm"
                        >
                          <div
                            class="hidden min-w-[100px] items-center justify-center bg-gray-50/80 dark:bg-zinc-900/60 p-1 text-xs text-gray-500 dark:text-zinc-400 lg:flex"
                          >
                            {formatTime(item?.time)}
                          </div>
                          <div
                            class="grow px-3 py-2 lg:py-1 {index > 0
                              ? 'border-t'
                              : ''} border-gray-300 dark:border-zinc-700"
                          >
                            <div>
                              <strong>{item?.name}</strong>
                              (<HoverStockChart symbol={item?.symbol} />)
                              {item?.isToday
                                ? "will report today"
                                : [
                                      "Monday",
                                      "Tuesday",
                                      "Wednesday",
                                      "Thursday",
                                    ].includes(
                                      new Date().toLocaleDateString("en-US", {
                                        weekday: "long",
                                      }),
                                    )
                                  ? "will report tomorrow"
                                  : "will report Monday"}
                              {#if item?.time}
                                {#if compareTimes(item?.time, "16:00") >= 0}
                                  after market closes.
                                {:else if compareTimes(item?.time, "09:30") <= 0}
                                  before market opens.
                                {:else}
                                  during market.
                                {/if}
                              {/if}
                              Analysts estimate {abbreviateNumber(
                                item?.revenueEst,
                              )} in revenue ({(
                                (item?.revenueEst / item?.revenuePrior - 1) *
                                100
                              )?.toFixed(2)}% YoY) and {item?.epsEst} in earnings
                              per share {#if item?.epsPrior !== 0}
                                ({(
                                  (item?.epsEst / item?.epsPrior - 1) *
                                  100
                                )?.toFixed(2)}% YoY).
                              {/if}
                            </div>

                            <div
                              class="flex flex-wrap gap-x-2 pt-2 text-sm lg:pt-0.5"
                            >
                              <div class=" lg:hidden">
                                {formatTime(item?.time)}
                              </div>
                            </div>
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/each}
                {:else}
                  <div
                    class="text-sm sm:text-[1rem] mt-5 text-gray-600 dark:text-zinc-300"
                  >
                    No earnings yet. Add some stocks to the alert list to see
                    the latest earnings data.
                  </div>
                {/if}
              </div>
            {/if}
          {/if}
          {#if priceAlertList?.length === 0}
            <div class="flex flex-col justify-center items-center m-auto mt-14">
              <span class=" font-bold text-xl sm:text-3xl">
                No Alerts set
              </span>

              <span
                class=" text-sm sm:text-[1rem] m-auto p-4 text-center text-gray-600 dark:text-zinc-300"
              >
                Create price alerts for your stocks that have the most potential
                in your opinion.
              </span>

              {#if !data?.user}
                <a
                  class="w-64 flex mt-10 justify-center items-center m-auto rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold text-md transition hover:bg-gray-800 dark:hover:bg-zinc-200 group"
                  href="/register"
                >
                  Get Started
                  <span
                    class="tracking-normal group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out"
                  >
                    <svg
                      class="w-4 h-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      ><g transform="rotate(90 12 12)"
                        ><g fill="none"
                          ><path
                            d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01l-.184-.092Z"
                          /><path
                            fill="black"
                            d="M13.06 3.283a1.5 1.5 0 0 0-2.12 0L5.281 8.939a1.5 1.5 0 0 0 2.122 2.122L10.5 7.965V19.5a1.5 1.5 0 0 0 3 0V7.965l3.096 3.096a1.5 1.5 0 1 0 2.122-2.122L13.06 3.283Z"
                          /></g
                        ></g
                      ></svg
                    >
                  </span>
                </a>
              {/if}
            </div>
          {/if}
        </main>
      </div>
    </div>
  </div>
</section>

<PriceAlert {data} ticker={addTicker} assetType={addAssetType} />

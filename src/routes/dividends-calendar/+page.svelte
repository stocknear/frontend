<script lang="ts">
  import {
    format,
    startOfWeek,
    addDays,
    addWeeks,
    subWeeks,
    differenceInWeeks,
  } from "date-fns";
  import { screenWidth } from "$lib/store";
  import { abbreviateNumber } from "$lib/utils";
  import Infobox from "$lib/components/Infobox.svelte";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { onMount } from "svelte";
  import { page } from "$app/stores";

  import HoverStockChart from "$lib/components/HoverStockChart.svelte";

  export let data;

  // Daily pagination state (used in Daily/Details view)
  let dailyCurrentPage = 1;
  let dailyRowsPerPage = 20;
  let dailyRowsPerPageOptions = [20, 50, 100];
  let dailyTotalPages = 1;
  let dailyDisplayList = [];
  let dailyPagePathName = $page?.url?.pathname;

  // Reusable SVG icon paths
  const arrowIcon =
    "M8.025 22L6.25 20.225L14.475 12L6.25 3.775L8.025 2l10 10l-10 10Z";
  const chevronUpIcon =
    "M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z";
  const chevronDownIcon =
    "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z";

  // Common CSS classes
  const borderClasses = "border border-gray-300 dark:border-gray-800";
  const tableBorderClasses = "border border-gray-300 dark:border-gray-800";
  const navigationButtonClasses =
    "h-16 w-48 cursor-pointer border m-auto flex bg-default text-white dark:bg-primary mb-3";

  let currentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
  let dividendCalendar = data?.getDividendCalendar;
  const maxWeeksChange = 4; // Maximum allowed week change
  let previousMax = false;
  let nextMax = false;
  const today = new Date();

  let formattedWeekday = [];
  let weekday = [];
  let rawWeekday = [];
  let daysOfWeek = [];

  let currentDate = new Date();
  let currentWeekday = Math.min((currentDate.getDay() + 6) % 7, 4);
  let selectedWeekday = currentWeekday;

  // Timeframe management
  let timeframe = "Weekly";
  let expandedItems = {};

  // Tab options
  const tabs = ["Daily", "Weekly"];
  const mobileTabs = ["Details", "Compact"];

  function toggleExpanded(dayIndex, itemIndex) {
    const key = `${dayIndex}-${itemIndex}`;
    expandedItems[key] = !expandedItems[key];
    expandedItems = { ...expandedItems };
  }

  function switchToDailyView(dayIndex) {
    timeframe = "Daily";
    selectedWeekday = dayIndex;
    resetDailyPagination();
  }

  function updateDailyPagination() {
    const selectedDayData = weekday?.[selectedWeekday] ?? [];
    const totalItems = selectedDayData?.length || 0;
    dailyTotalPages =
      totalItems === 0 ? 1 : Math.ceil(totalItems / dailyRowsPerPage);

    const normalizedPage = Math.min(
      Math.max(dailyCurrentPage, 1),
      dailyTotalPages || 1,
    );
    if (normalizedPage !== dailyCurrentPage) {
      dailyCurrentPage = normalizedPage;
    }

    const startIndex = (dailyCurrentPage - 1) * dailyRowsPerPage;
    const endIndex = startIndex + dailyRowsPerPage;
    dailyDisplayList = selectedDayData?.slice(startIndex, endIndex) ?? [];
  }

  function resetDailyPagination() {
    dailyCurrentPage = 1;
    updateDailyPagination();
  }

  function goToDailyPage(pageNumber) {
    if (pageNumber >= 1 && pageNumber <= dailyTotalPages) {
      dailyCurrentPage = pageNumber;
      updateDailyPagination();
    }
  }

  function changeDailyRowsPerPage(newRowsPerPage) {
    dailyRowsPerPage = newRowsPerPage;
    dailyCurrentPage = 1;
    updateDailyPagination();
    saveDailyRowsPerPage();
  }

  function saveDailyRowsPerPage() {
    if (!dailyPagePathName || typeof localStorage === "undefined") return;

    try {
      const paginationKey = `${dailyPagePathName}_dividendsDailyRows`;
      localStorage.setItem(paginationKey, String(dailyRowsPerPage));
    } catch (e) {
      console.warn("Failed to save daily rows per page preference:", e);
    }
  }

  function loadDailyRowsPerPage() {
    const currentPath = dailyPagePathName || $page?.url?.pathname;

    if (!currentPath || typeof localStorage === "undefined") {
      dailyRowsPerPage = 20;
      return;
    }

    try {
      const paginationKey = `${currentPath}_dividendsDailyRows`;
      const savedRows = localStorage.getItem(paginationKey);

      if (savedRows && dailyRowsPerPageOptions.includes(Number(savedRows))) {
        dailyRowsPerPage = Number(savedRows);
      } else {
        dailyRowsPerPage = 20;
      }
    } catch (e) {
      console.warn("Failed to load daily rows per page preference:", e);
      dailyRowsPerPage = 20;
    }
  }

  // Consolidated data processing function
  function processDividendData() {
    const startDate = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const endDate = addDays(startDate, 4);

    // Generate formatted weekday labels
    const formattedMonday = startOfWeek(currentWeek, { weekStartsOn: 1 });
    formattedWeekday = [
      format(formattedMonday, "EEE, MMM d"),
      format(addDays(formattedMonday, 1), "EEE, MMM d"),
      format(addDays(formattedMonday, 2), "EEE, MMM d"),
      format(addDays(formattedMonday, 3), "EEE, MMM d"),
      format(addDays(formattedMonday, 4), "EEE, MMM d"),
    ];

    // Generate days of week with dates
    daysOfWeek = [
      { name: "Monday", date: format(startDate, "yyyy-MM-dd") },
      { name: "Tuesday", date: format(addDays(startDate, 1), "yyyy-MM-dd") },
      { name: "Wednesday", date: format(addDays(startDate, 2), "yyyy-MM-dd") },
      { name: "Thursday", date: format(addDays(startDate, 3), "yyyy-MM-dd") },
      { name: "Friday", date: format(endDate, "yyyy-MM-dd") },
    ];

    // Process calendar data
    dividendCalendar = daysOfWeek?.map((day) => ({
      name: day.name,
      data: data?.getDividendCalendar?.filter((item) => item.date === day.date),
    }));

    if (dividendCalendar?.length) {
      for (let i = 0; i < dividendCalendar.length; i++) {
        const dayData = dividendCalendar[i].data;
        rawWeekday[i] = dayData?.sort((a, b) => b.marketCap - a.marketCap);
      }
      weekday = rawWeekday;
      resetDailyPagination();
    }
  }

  function toggleDate(index) {
    if ($screenWidth > 640) {
      selectedWeekday = index;
      resetDailyPagination();
    }
  }

  function clickWeekday(state, index) {
    if (state === "next" && selectedWeekday + 1 <= 4) {
      selectedWeekday = selectedWeekday + 1;
      resetDailyPagination();
    } else if (state === "previous" && selectedWeekday - 1 >= 0) {
      selectedWeekday--;
      resetDailyPagination();
    } else if (
      state === "previous" &&
      index === 0 &&
      differenceInWeeks(currentWeek, today) > -maxWeeksChange
    ) {
      changeWeek(state);
      selectedWeekday = 4;
      resetDailyPagination();
    } else if (
      state === "next" &&
      index === 4 &&
      differenceInWeeks(currentWeek, today) < maxWeeksChange
    ) {
      changeWeek(state);
      selectedWeekday = 0;
      resetDailyPagination();
    }
  }

  async function changeWeek(state) {
    // Limit the user to go back max 4 weeks and look forward 4 weeks
    if (
      state === "previous" &&
      differenceInWeeks(currentWeek, today) > -maxWeeksChange
    ) {
      currentWeek = subWeeks(currentWeek, 1);
    } else if (
      state === "next" &&
      differenceInWeeks(currentWeek, today) < maxWeeksChange
    ) {
      currentWeek = addWeeks(currentWeek, 1);
    }

    weekday = [];
    rawWeekday = [];
    processDividendData();
    resetDailyPagination();
  }

  // Initialize data on component mount
  $: if (data?.getDividendCalendar) {
    processDividendData();
  }

  // Handle screen width changes for mobile responsiveness
  $: if ($screenWidth < 640) {
    if (timeframe === "Daily" || timeframe === "Weekly") {
      timeframe = "Details";
    }
  } else {
    if (timeframe === "Details" || timeframe === "Compact") {
      timeframe = "Daily";
    }
  }

  // Consolidated navigation limits reactive statement
  $: if (currentWeek) {
    const weekDiff = differenceInWeeks(currentWeek, today);
    previousMax = weekDiff <= -maxWeeksChange;
    nextMax = weekDiff >= maxWeeksChange;
  }

  function scrollToTop() {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  onMount(() => {
    loadDailyRowsPerPage();
    updateDailyPagination();
  });

  $: if ($page?.url?.pathname && $page?.url?.pathname !== dailyPagePathName) {
    dailyPagePathName = $page?.url?.pathname;
    loadDailyRowsPerPage();
    updateDailyPagination();
  }

  $: if (timeframe === "Daily" || timeframe === "Details") {
    updateDailyPagination();
  }

  let columns = [
    { key: "symbol", label: "Symbol", align: "left" },
    { key: "name", label: "Name", align: "left" },
    { key: "marketCap", label: "Market Cap", align: "right" },
    { key: "revenue", label: "Revenue", align: "right" },
    { key: "adjDividend", label: "Cash Amount", align: "right" },
    { key: "date", label: "Ex-Dividend Date", align: "right" },
    { key: "paymentDate", label: "Payment Date", align: "right" },
  ];

  let sortOrders = {
    symbol: { order: "none", type: "string" },
    name: { order: "none", type: "string" },
    marketCap: { order: "none", type: "number" },
    revenue: { order: "none", type: "number" },
    adjDividend: { order: "none", type: "number" },
    paymentDate: { order: "none", type: "date" },
    date: { order: "none", type: "date" },
  };

  $: originalData = rawWeekday[selectedWeekday];

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
      weekday[selectedWeekday] = [...originalData]; // Reset to original data (spread to avoid mutation)
      resetDailyPagination();
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
    weekday[selectedWeekday] = [...originalData]?.sort(compareValues);
    resetDailyPagination();
  };
</script>

<SEO
  title="Dividend Calendar - Ex-Dividend Dates & Payment Schedule for Stocks"
  description="Track dividend payments with our comprehensive dividend calendar featuring ex-dividend dates, payment dates, and dividend amounts for all US dividend-paying stocks. Monitor upcoming dividend distributions, cash amounts, and payment schedules to optimize your dividend investment strategy and income planning."
  keywords="dividend calendar, ex-dividend dates, dividend payments, dividend schedule, dividend stocks, dividend income, dividend yields, payment dates, cash dividends, dividend distribution, dividend investing, income investing, dividend tracker, quarterly dividends"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Dividend Calendar",
    description:
      "Comprehensive dividend calendar tracking ex-dividend dates, payment dates, and dividend amounts for US dividend-paying stocks",
    url: "https://stocknear.com/dividends-calendar",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web Browser",
    browserRequirements: "Modern web browser with JavaScript enabled",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://stocknear.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Dividend Calendar",
          item: "https://stocknear.com/dividends-calendar",
        },
      ],
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    featureList: [
      "Real-time dividend payment tracking",
      "Ex-dividend date notifications",
      "Payment date scheduling",
      "Dividend amount calculations",
      "Market capitalization filtering",
      "Weekly dividend calendar view",
      "Dividend history analysis",
      "Income planning tools",
    ],
    creator: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pt-5 px-4 lg:px-3 mb-20"
>
  <div class="text-sm sm:text-[1rem] breadcrumbs">
    <ul>
      <li>
        <a href="/dashboard" class="text-muted dark:text-gray-300">Home</a>
      </li>
      <li class="text-muted dark:text-gray-300">Dividends Calendar</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:pr-5">
          <div class="mb-6 border-[#2C6288] dark:border-white border-b-[2px]">
            <div
              class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2"
            >
              <h1 class="text-2xl sm:text-3xl font-bold">Dividends Calendar</h1>

              <div class="inline-flex sm:ml-auto">
                <!-- Tab Selection -->
                <div
                  class="inline-flex rounded-md shadow-sm"
                  role="group"
                  aria-label="View Options"
                >
                  {#each $screenWidth >= 640 ? tabs : mobileTabs as item, i}
                    <button
                      on:click={() => (timeframe = item)}
                      class="cursor-pointer px-4 py-2 text-sm font-medium {i ===
                      0
                        ? 'rounded-l-lg border-l border-t border-b'
                        : ''}
                        {i ===
                      ($screenWidth >= 640 ? tabs.length : mobileTabs.length) -
                        1
                        ? 'rounded-r border-t border-r border-b'
                        : ''}
                        {i !== 0 &&
                      i !==
                        ($screenWidth >= 640
                          ? tabs.length
                          : mobileTabs.length) -
                          1
                        ? 'border-t border-b'
                        : ''}
                        {timeframe === item
                        ? 'bg-black dark:bg-white text-white dark:text-black'
                        : 'bg-white border-gray-300 sm:hover:bg-gray-100 dark:bg-default dark:border-gray-800'}"
                    >
                      {item}
                    </button>
                  {/each}
                </div>
              </div>
            </div>
          </div>

          <!-- Page wrapper -->
          <div class="flex justify-center w-full m-auto h-full overflow-hidden">
            <!-- Content area -->
            <div class="w-full overflow-x-auto">
              {#if timeframe === "Daily" || timeframe === "Details"}
                <!-- Daily/Details View -->
                <!-- Cards -->
                <div
                  class=" w-full flex flex-row justify-center m-auto items-center"
                >
                  <!-- Start Columns -->
                  <label
                    on:click={() => changeWeek("previous")}
                    class="{previousMax
                      ? 'opacity-80'
                      : ''} hidden sm:flex {navigationButtonClasses} {borderClasses}"
                  >
                    <svg
                      class="w-6 h-6 m-auto rotate-180"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path fill="currentColor" d={arrowIcon} />
                    </svg>
                  </label>
                  {#each weekday as day, index}
                    <div
                      class="w-full {index === selectedWeekday
                        ? ''
                        : 'hidden sm:block'}"
                    >
                      <label
                        on:click={() => toggleDate(index)}
                        class=" m-auto w-full cursor-pointer h-16 {index ===
                        selectedWeekday
                          ? 'bg-default text-white dark:bg-white dark:text-black font-semibold'
                          : ''} rounded sm:rounded-none flex dark:bg-default {borderClasses} mb-3"
                      >
                        <div
                          class=" flex flex-row justify-center items-center w-full"
                        >
                          <label
                            on:click={() => clickWeekday("previous", index)}
                            class="{previousMax === true && index === 0
                              ? 'opacity-20'
                              : ''} sm:hidden ml-auto"
                          >
                            <svg
                              class="w-8 h-8 inline-block rotate-180"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                            >
                              <path fill="currentColor" d={arrowIcon} />
                            </svg>
                          </label>
                          <div
                            class="flex flex-col items-center truncate m-auto p-1"
                          >
                            <span class="text-[1rem]"
                              >{formattedWeekday[index]}</span
                            >
                            <span
                              class="text-[1rem] sm:text-sm m-auto pt-1 pb-1"
                            >
                              {day?.length} Dividends</span
                            >
                          </div>
                          <label
                            on:click={() => clickWeekday("next", index)}
                            class="{nextMax === true && index === 4
                              ? 'opacity-20'
                              : ''} sm:hidden mr-auto"
                          >
                            <svg
                              class="w-8 h-8 inline-block"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                            >
                              <path fill="currentColor" d={arrowIcon} />
                            </svg>
                          </label>
                        </div>
                      </label>
                    </div>
                  {/each}
                  <label
                    on:click={() => changeWeek("next")}
                    class="{nextMax
                      ? 'opacity-80'
                      : ''} hidden sm:flex {navigationButtonClasses} {borderClasses}"
                  >
                    <svg
                      class="w-6 h-6 m-auto"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path fill="currentColor" d={arrowIcon} />
                    </svg>
                  </label>
                </div>

                {#each weekday as day, index}
                  {#if index === selectedWeekday}
                    {#if day?.length !== 0}
                      <h2 class="font-semibold text-xl mt-5">
                        {formattedWeekday[index]?.split(", ")[1]} · {day?.length}
                        Dividends
                      </h2>

                      <div class="w-full overflow-x-auto">
                        <table
                          class="table table-sm table-compact rounded-none sm:rounded w-full {tableBorderClasses} m-auto mt-4"
                        >
                          <thead>
                            <TableHeader {columns} {sortOrders} {sortData} />
                          </thead>
                          <tbody>
                            {#each dailyDisplayList as item}
                              <!-- row -->
                              <tr
                                class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
                              >
                                <td class=" text-sm sm:text-[1rem]">
                                  <HoverStockChart symbol={item?.symbol} />
                                </td>

                                <td
                                  class=" whitespace-nowrap text-sm sm:text-[1rem]"
                                >
                                  {item?.name.length > 20
                                    ? item?.name.slice(0, 20) + "..."
                                    : item?.name}
                                </td>

                                <td class=" text-sm text-end sm:text-[1rem]">
                                  {@html item?.marketCap !== null
                                    ? abbreviateNumber(
                                        item?.marketCap,
                                        false,
                                        true,
                                      )
                                    : "n/a"}
                                </td>

                                <td class=" text-sm sm:text-[1rem] text-end">
                                  {item?.revenue !== null
                                    ? abbreviateNumber(item?.revenue)
                                    : "n/a"}
                                </td>

                                <td
                                  class=" text-center text-sm sm:text-[1rem] text-end"
                                >
                                  {item?.adjDividend !== null
                                    ? item?.adjDividend?.toFixed(3)
                                    : "n/a"}
                                </td>

                                <td class=" text-end text-sm sm:text-[1rem]">
                                  {item?.date !== null
                                    ? new Date(item?.date)?.toLocaleString(
                                        "en-US",
                                        {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                          daySuffix: "2-digit",
                                          timeZone: "UTC",
                                        },
                                      )
                                    : "n/a"}
                                </td>

                                <td class=" text-end text-sm sm:text-[1rem]">
                                  {item?.paymentDate !== null
                                    ? new Date(
                                        item?.paymentDate,
                                      )?.toLocaleString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                        daySuffix: "2-digit",
                                        timeZone: "UTC",
                                      })
                                    : "n/a"}
                                </td>
                              </tr>
                            {/each}
                          </tbody>
                        </table>
                      </div>
                      {#if dailyDisplayList?.length > 0}
                        <div
                          class="flex flex-row items-center justify-between mt-8 sm:mt-5"
                        >
                          <div class="flex items-center gap-2">
                            <Button
                              on:click={() =>
                                goToDailyPage(dailyCurrentPage - 1)}
                              disabled={dailyCurrentPage === 1}
                              class="w-fit transition-all flex flex-row items-center duration-50 border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary flex flex-row justify-between items-center  sm:w-auto px-1.5 sm:px-3 rounded truncate"
                            >
                              <svg
                                class="h-5 w-5 inline-block shrink-0 rotate-90"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                style="max-width:40px"
                                aria-hidden="true"
                              >
                                <path
                                  fill-rule="evenodd"
                                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                  clip-rule="evenodd"
                                ></path>
                              </svg>
                              <span class="hidden sm:inline">Previous</span
                              ></Button
                            >
                          </div>

                          <div class="flex flex-row items-center gap-4">
                            <span class="text-sm sm:text-[1rem]">
                              Page {dailyCurrentPage} of {dailyTotalPages}
                            </span>

                            <DropdownMenu.Root>
                              <DropdownMenu.Trigger asChild let:builder>
                                <Button
                                  builders={[builder]}
                                  class="w-fit transition-all duration-50 border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary  flex flex-row justify-between items-center  sm:w-auto px-2 sm:px-3 rounded truncate"
                                >
                                  <span
                                    class="truncate text-[0.85rem] sm:text-sm"
                                    >{dailyRowsPerPage} Rows</span
                                  >
                                  <svg
                                    class="ml-0.5 mt-1 h-5 w-5 inline-block shrink-0"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    style="max-width:40px"
                                    aria-hidden="true"
                                  >
                                    <path
                                      fill-rule="evenodd"
                                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                      clip-rule="evenodd"
                                    ></path>
                                  </svg>
                                </Button>
                              </DropdownMenu.Trigger>

                              <DropdownMenu.Content
                                side="bottom"
                                align="end"
                                sideOffset={10}
                                alignOffset={0}
                                class="w-auto min-w-40  max-h-[400px] overflow-y-auto scroller relative"
                              >
                                <DropdownMenu.Group class="pb-2">
                                  {#each dailyRowsPerPageOptions as item}
                                    <DropdownMenu.Item
                                      class="sm:hover:bg-gray-200 dark:sm:hover:bg-primary"
                                    >
                                      <label
                                        on:click={() =>
                                          changeDailyRowsPerPage(item)}
                                        class="inline-flex justify-between w-full items-center cursor-pointer"
                                      >
                                        <span class="text-sm">{item} Rows</span>
                                      </label>
                                    </DropdownMenu.Item>
                                  {/each}
                                </DropdownMenu.Group>
                              </DropdownMenu.Content>
                            </DropdownMenu.Root>
                          </div>

                          <div class="flex items-center gap-2">
                            <Button
                              on:click={() =>
                                goToDailyPage(dailyCurrentPage + 1)}
                              disabled={dailyCurrentPage === dailyTotalPages}
                              class="w-fit transition-all flex flex-row items-center duration-50 border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary flex flex-row justify-between items-center sm:w-auto px-1.5 sm:px-3 rounded truncate"
                            >
                              <span class="hidden sm:inline">Next</span>
                              <svg
                                class="h-5 w-5 inline-block shrink-0 -rotate-90"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                style="max-width:40px"
                                aria-hidden="true"
                              >
                                <path
                                  fill-rule="evenodd"
                                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                  clip-rule="evenodd"
                                ></path>
                              </svg>
                            </Button>
                          </div>
                        </div>

                        <div class="flex justify-center mt-4">
                          <button
                            on:click={scrollToTop}
                            class=" cursor-pointer sm:hover:text-muted text-blue-800 dark:sm:hover:text-white dark:text-blue-400 text-sm sm:text-[1rem] font-medium"
                          >
                            Back to Top <svg
                              class="h-5 w-5 inline-block shrink-0 rotate-180"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              style="max-width:40px"
                              aria-hidden="true"
                            >
                              <path
                                fill-rule="evenodd"
                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                clip-rule="evenodd"
                              ></path>
                            </svg>
                          </button>
                        </div>
                      {/if}
                    {:else}
                      <div class="mt-5">
                        <Infobox text="No Dividends available for the day." />
                      </div>
                    {/if}
                  {/if}
                {/each}
              {:else if timeframe === "Weekly"}
                <!-- Weekly View Container -->
                <div class="flex items-start">
                  <!-- Previous Week Arrow -->
                  <label
                    on:click={() => changeWeek("previous")}
                    class="{previousMax
                      ? 'opacity-80'
                      : ''} hidden sm:flex h-18 w-9 cursor-pointer border flex bg-default text-white dark:bg-primary {borderClasses} mb-3"
                  >
                    <svg
                      class="w-6 h-6 m-auto rotate-180"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path fill="currentColor" d={arrowIcon} />
                    </svg>
                  </label>

                  <!-- Content Area -->
                  <div class="flex-1">
                    <!-- Header Row -->
                    <div
                      class="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4 {borderClasses} p-3 h-18"
                    >
                      {#each weekday as day, index}
                        <div
                          on:click={() => switchToDailyView(index)}
                          class="text-center cursor-pointer"
                        >
                          <div class="font-semibold">
                            {formattedWeekday[index]?.split(",")[0]}, {formattedWeekday[
                              index
                            ]?.split(", ")[1]}
                          </div>
                          <div class="text-sm">
                            {day?.length} Dividends
                          </div>
                        </div>
                      {/each}
                    </div>

                    <!-- Weekly Grid -->
                    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
                      {#each weekday as day, dayIndex}
                        <div class="flex flex-col">
                          <!-- Stocks List -->
                          <div class="space-y-2">
                            {#if day?.length > 0}
                              {#each day as item, itemIndex}
                                {@const isExpanded =
                                  expandedItems[`${dayIndex}-${itemIndex}`]}
                                <div
                                  class="w-full rounded {borderClasses} text-[0.9rem]"
                                >
                                  <!-- Collapsible Header -->
                                  <div
                                    on:click={() =>
                                      toggleExpanded(dayIndex, itemIndex)}
                                    class="flex w-full cursor-pointer items-center justify-between px-2 py-1.5"
                                  >
                                    <span class="max-w-[92%] truncate">
                                      <HoverStockChart symbol={item?.symbol} />
                                      <span class="truncate">
                                        · {item?.name}</span
                                      >
                                    </span>
                                    <svg
                                      class="h-4 w-4"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fill-rule="evenodd"
                                        d={isExpanded
                                          ? chevronUpIcon
                                          : chevronDownIcon}
                                        clip-rule="evenodd"
                                      />
                                    </svg>
                                  </div>

                                  <!-- Expanded Content -->
                                  {#if isExpanded}
                                    <div class="px-2 pb-1 pt-0.5">
                                      <div
                                        class="border-t border-gray-300 dark:border-gray-800"
                                      >
                                        <table class="w-full text-sm">
                                          <tbody>
                                            <tr
                                              class="border-b border-gray-300 dark:border-gray-800"
                                            >
                                              <td class="py-1.5">Ex-Date</td>
                                              <td
                                                class="text-right font-semibold"
                                              >
                                                {item?.date !== null
                                                  ? new Date(
                                                      item?.date,
                                                    )?.toLocaleString("en-US", {
                                                      month: "short",
                                                      day: "numeric",
                                                      year: "numeric",
                                                      timeZone: "UTC",
                                                    })
                                                  : "n/a"}
                                              </td>
                                            </tr>
                                            {#if item?.marketCap !== null}
                                              <tr
                                                class="border-b border-gray-300 dark:border-gray-800"
                                              >
                                                <td class="py-1.5"
                                                  >Market Cap</td
                                                >
                                                <td
                                                  class="text-right font-semibold"
                                                  >{@html abbreviateNumber(
                                                    item?.marketCap,
                                                    false,
                                                    true,
                                                  )}</td
                                                >
                                              </tr>
                                            {/if}
                                            <tr
                                              class="border-b border-gray-300 dark:border-gray-800"
                                            >
                                              <td class="py-1.5">Amount</td>
                                              <td
                                                class="text-right font-semibold"
                                              >
                                                ${item?.adjDividend?.toFixed(
                                                  4,
                                                ) || "n/a"}
                                              </td>
                                            </tr>
                                            <tr
                                              class="border-b border-gray-300 dark:border-gray-800"
                                            >
                                              <td class="py-1.5">Revenue</td>
                                              <td
                                                class="text-right font-semibold"
                                              >
                                                {item?.revenue
                                                  ? `$${abbreviateNumber(item?.revenue, false, true)}`
                                                  : "n/a"}
                                              </td>
                                            </tr>
                                            <tr>
                                              <td class="pb-0.5 pt-1.5"
                                                >Payment Date</td
                                              >
                                              <td
                                                class="text-right font-semibold"
                                              >
                                                {item?.paymentDate !== null
                                                  ? new Date(
                                                      item?.paymentDate,
                                                    )?.toLocaleString("en-US", {
                                                      month: "short",
                                                      day: "numeric",
                                                      year: "numeric",
                                                      timeZone: "UTC",
                                                    })
                                                  : "n/a"}
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  {/if}
                                </div>
                              {/each}
                            {:else}
                              <div
                                class="text-center text-gray-500 dark:text-gray-400 py-4"
                              >
                                No dividends
                              </div>
                            {/if}
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>

                  <!-- Next Week Arrow -->
                  <label
                    on:click={() => changeWeek("next")}
                    class="{nextMax
                      ? 'opacity-80'
                      : ''} hidden sm:flex h-18 w-9 cursor-pointer flex bg-default text-white dark:bg-primary {borderClasses} mb-3"
                  >
                    <svg
                      class="w-6 h-6 m-auto"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path fill="currentColor" d={arrowIcon} />
                    </svg>
                  </label>
                </div>
              {:else if timeframe === "Compact"}
                <!-- Compact View for Mobile -->
                <div class="w-full">
                  <!-- Use same header as Details view -->
                  <div
                    class="w-full flex flex-row justify-center m-auto items-center"
                  >
                    <!-- Start Columns -->
                    <label
                      on:click={() => changeWeek("previous")}
                      class="{previousMax
                        ? 'opacity-80'
                        : ''} hidden sm:flex {navigationButtonClasses} {borderClasses}"
                    >
                      <svg
                        class="w-6 h-6 m-auto rotate-180"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path fill="currentColor" d={arrowIcon} />
                      </svg>
                    </label>
                    {#each weekday as day, index}
                      <div
                        class="w-full {index === selectedWeekday
                          ? ''
                          : 'hidden sm:block'}"
                      >
                        <label
                          on:click={() => toggleDate(index)}
                          class=" m-auto w-full cursor-pointer h-16 {index ===
                          selectedWeekday
                            ? 'bg-default text-white dark:bg-white dark:text-black font-semibold'
                            : ''} rounded sm:rounded-none flex dark:bg-default {borderClasses} mb-3"
                        >
                          <div
                            class=" flex flex-row justify-center items-center w-full"
                          >
                            <label
                              on:click={() => clickWeekday("previous", index)}
                              class="{previousMax === true && index === 0
                                ? 'opacity-20'
                                : ''} sm:hidden ml-auto"
                            >
                              <svg
                                class="w-8 h-8 inline-block rotate-180"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                              >
                                <path fill="currentColor" d={arrowIcon} />
                              </svg>
                            </label>
                            <div
                              class="flex flex-col items-center truncate m-auto p-1"
                            >
                              <span class="text-[1rem]"
                                >{formattedWeekday[index]}</span
                              >
                              <span class="text-sm m-auto pt-1 pb-1">
                                {day?.length} Dividends</span
                              >
                            </div>
                            <label
                              on:click={() => clickWeekday("next", index)}
                              class="{nextMax === true && index === 4
                                ? 'opacity-20'
                                : ''} sm:hidden mr-auto"
                            >
                              <svg
                                class="w-8 h-8 inline-block"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                              >
                                <path fill="currentColor" d={arrowIcon} />
                              </svg>
                            </label>
                          </div>
                        </label>
                      </div>
                    {/each}
                    <label
                      on:click={() => changeWeek("next")}
                      class="{nextMax
                        ? 'opacity-80'
                        : ''} hidden sm:flex {navigationButtonClasses} {borderClasses}"
                    >
                      <svg
                        class="w-6 h-6 m-auto"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path fill="currentColor" d={arrowIcon} />
                      </svg>
                    </label>
                  </div>

                  <!-- Compact Card List -->
                  <div class="space-y-2">
                    {#if weekday[selectedWeekday]?.length > 0}
                      {#each weekday[selectedWeekday] as item, itemIndex}
                        {@const isExpanded =
                          expandedItems[`${selectedWeekday}-${itemIndex}`]}
                        <div
                          class="w-full rounded {borderClasses} text-[0.9rem]"
                        >
                          <!-- Collapsible Header -->
                          <div
                            on:click={() =>
                              toggleExpanded(selectedWeekday, itemIndex)}
                            class="flex w-full cursor-pointer items-center justify-between px-3 py-2"
                          >
                            <span class="max-w-[92%] truncate">
                              <HoverStockChart symbol={item?.symbol} />
                              <span class="truncate"> · {item?.name}</span>
                            </span>
                            <svg
                              class="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fill-rule="evenodd"
                                d={isExpanded ? chevronUpIcon : chevronDownIcon}
                                clip-rule="evenodd"
                              />
                            </svg>
                          </div>

                          <!-- Expanded Content -->
                          {#if isExpanded}
                            <div class="px-2 pb-1 pt-0.5">
                              <div
                                class="border-t border-gray-300 dark:border-gray-800"
                              >
                                <table class="w-full text-sm">
                                  <tbody>
                                    <tr
                                      class="border-b border-gray-300 dark:border-gray-800"
                                    >
                                      <td class="py-1.5">Date</td>
                                      <td class="text-right font-semibold">
                                        {new Date(
                                          item?.date,
                                        ).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        })}
                                      </td>
                                    </tr>
                                    <tr
                                      class="border-b border-gray-300 dark:border-gray-800"
                                    >
                                      <td class="py-1.5">Dividend</td>
                                      <td class="text-right font-semibold">
                                        ${item?.adjDividend?.toFixed(4) ||
                                          "n/a"}
                                      </td>
                                    </tr>
                                    <tr
                                      class="border-b border-gray-300 dark:border-gray-800"
                                    >
                                      <td class="py-1.5">Revenue</td>
                                      <td class="text-right font-semibold">
                                        {item?.revenue
                                          ? `$${abbreviateNumber(item?.revenue, false, true)}`
                                          : "n/a"}
                                      </td>
                                    </tr>
                                    <tr
                                      class="border-b border-gray-300 dark:border-gray-800"
                                    >
                                      <td class="py-1.5">Ex-Date</td>
                                      <td class="text-right font-semibold">
                                        {item?.exDividendDate
                                          ? new Date(
                                              item?.exDividendDate,
                                            ).toLocaleDateString("en-US", {
                                              month: "short",
                                              day: "numeric",
                                              year: "numeric",
                                            })
                                          : "n/a"}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td class="pb-0.5 pt-1.5">Payment Date</td
                                      >
                                      <td class="text-right font-semibold">
                                        {item?.paymentDate
                                          ? new Date(
                                              item?.paymentDate,
                                            ).toLocaleDateString("en-US", {
                                              month: "short",
                                              day: "numeric",
                                              year: "numeric",
                                            })
                                          : "n/a"}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          {/if}
                        </div>
                      {/each}
                    {:else}
                      <div
                        class="text-center text-sm text-gray-500 dark:text-gray-400 py-8"
                      >
                        No dividends scheduled
                      </div>
                    {/if}
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</section>

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
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import { mode } from "mode-watcher";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import CheckMark from "lucide-svelte/icons/check";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { page } from "$app/stores";

  export let data;

  let currentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
  let earningsCalendar = data?.getEarningsCalendar;
  const maxWeeksChange = 4; // Maximum allowed week change
  let previousMax = false;
  let nextMax = false;
  const today = new Date();
  $: tabs = $screenWidth < 640 ? ["Details", "Compact"] : ["Daily", "Weekly"];
  let releaseTime = "anytime";

  // Daily pagination state (used for Daily/Details views)
  let dailyCurrentPage = 1;
  let dailyRowsPerPage = 20;
  let dailyRowsPerPageOptions = [20, 50, 100];
  let dailyTotalPages = 1;
  let dailyDisplayList = [];
  let dailyPagePathName = $page?.url?.pathname;

  const timeOptions = [
    { value: "anytime", label: "Any Time", isPremium: false },
    { value: "bmo", label: "Before Open", isPremium: true },
    { value: "amc", label: "After Close", isPremium: true },
  ];

  function handleTimeOptionClick(option) {
    if (option.isPremium && !["Plus", "Pro"]?.includes(data?.user?.tier)) {
      goto("/pricing");
    } else {
      releaseTime = option.value;
    }
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
      const paginationKey = `${dailyPagePathName}_earningsDailyRows`;
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
      const paginationKey = `${currentPath}_earningsDailyRows`;
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

  function processEarningsData() {
    earningsCalendar = daysOfWeek?.map((day) => ({
      name: day.name,
      data: data?.getEarningsCalendar?.filter(
        (item) => item?.date === day?.date,
      ),
    }));

    if (earningsCalendar?.length) {
      for (let i = 0; i < earningsCalendar.length; i++) {
        const dayData = earningsCalendar[i].data;
        const filteredData =
          releaseTime === "anytime"
            ? dayData
            : dayData?.filter((item) => item?.release === releaseTime);
        rawWeekday[i] = filteredData?.sort(
          (a, b) => b?.marketCap - a?.marketCap,
        );
      }
      weekday = rawWeekday;
      resetDailyPagination();
    }
  }

  function getPercentageChange(current, prior) {
    if (!current || !prior || prior === 0) return null;
    const change = (current / prior - 1) * 100;
    return isFinite(change) ? change.toFixed(2) : null;
  }

  let timeframe = "Weekly";
  let expandedItems = {};

  // Reusable SVG icons
  const arrowIcon =
    "M8.025 22L6.25 20.225L14.475 12L6.25 3.775L8.025 2l10 10l-10 10Z";
  const chevronUpIcon =
    "M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z";
  const chevronDownIcon =
    "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z";

  // Reusable CSS classes
  const weekArrowClasses =
    "hidden sm:flex h-16 w-48 cursor-pointer m-auto flex bg-white/90 dark:bg-zinc-950/70 text-gray-700 dark:text-zinc-200 border border-gray-300 shadow dark:border-zinc-700 mb-3";
  const mobileArrowClasses = "w-6 h-6 inline-block";
  const weekdayClasses =
    "m-auto w-full cursor-pointer h-16 rounded-full sm:rounded-none flex border border-gray-300 shadow dark:border-zinc-700 mb-3";

  let formattedMonday = startOfWeek(currentWeek, { weekStartsOn: 1 });
  let formattedTuesday = format(addDays(formattedMonday, 1), "EEE, MMM d");
  let formattedWednesday = format(addDays(formattedMonday, 2), "EEE, MMM d");
  let formattedThursday = format(addDays(formattedMonday, 3), "EEE, MMM d");
  let formattedFriday = format(addDays(formattedMonday, 4), "EEE, MMM d");
  formattedMonday = format(formattedMonday, "EEE, MMM d");

  let formattedWeekday = [
    formattedMonday,
    formattedTuesday,
    formattedWednesday,
    formattedThursday,
    formattedFriday,
  ];
  let weekday = [];
  let rawWeekday = [];

  let startDate = startOfWeek(currentWeek, { weekStartsOn: 1 });
  let endDate = addDays(startDate, 4);
  let formattedStartDate = format(startDate, "yyyy-MM-dd");
  let formattedEndDate = format(endDate, "yyyy-MM-dd");
  let daysOfWeek = [
    {
      name: "Monday",
      date: formattedStartDate,
    },
    {
      name: "Tuesday",
      date: format(addDays(startDate, 1), "yyyy-MM-dd"),
    },
    {
      name: "Wednesday",
      date: format(addDays(startDate, 2), "yyyy-MM-dd"),
    },
    {
      name: "Thursday",
      date: format(addDays(startDate, 3), "yyyy-MM-dd"),
    },
    {
      name: "Friday",
      date: formattedEndDate,
    },
  ];

  let currentDate = new Date();
  let currentWeekday = Math.min((currentDate.getDay() + 6) % 7, 4);
  let selectedWeekday = currentWeekday;

  function toggleDate(index) {
    if ($screenWidth > 640) {
      selectedWeekday = index;
      resetDailyPagination();
    }
  }

  function toggleExpanded(dayIndex, itemIndex) {
    const key = `${dayIndex}-${itemIndex}`;
    expandedItems[key] = !expandedItems[key];
  }

  function switchToDailyView(dayIndex) {
    timeframe = "Daily";
    selectedWeekday = dayIndex;
    resetDailyPagination();
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

  function scrollToTop() {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  onMount(() => {
    loadDailyRowsPerPage();
    updateDailyPagination();
  });

  async function changeWeek(state) {
    //Limit the user to go back max 4 weeks and look forward 4 weeks

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

    formattedMonday = startOfWeek(currentWeek, { weekStartsOn: 1 });
    formattedTuesday = format(addDays(formattedMonday, 1), "EEE, MMM d");
    formattedWednesday = format(addDays(formattedMonday, 2), "EEE, MMM d");
    formattedThursday = format(addDays(formattedMonday, 3), "EEE, MMM d");
    formattedFriday = format(addDays(formattedMonday, 4), "EEE, MMM d");
    formattedMonday = format(formattedMonday, "EEE, MMM d");

    formattedWeekday = [
      formattedMonday,
      formattedTuesday,
      formattedWednesday,
      formattedThursday,
      formattedFriday,
    ];
    weekday = [];
    rawWeekday = [];

    startDate = startOfWeek(currentWeek, { weekStartsOn: 1 });
    endDate = addDays(startDate, 4);
    formattedStartDate = format(startDate, "yyyy-MM-dd");
    formattedEndDate = format(endDate, "yyyy-MM-dd");
    daysOfWeek = [
      {
        name: "Monday",
        date: formattedStartDate,
      },
      {
        name: "Tuesday",
        date: format(addDays(startDate, 1), "yyyy-MM-dd"),
      },
      {
        name: "Wednesday",
        date: format(addDays(startDate, 2), "yyyy-MM-dd"),
      },
      {
        name: "Thursday",
        date: format(addDays(startDate, 3), "yyyy-MM-dd"),
      },
      {
        name: "Friday",
        date: formattedEndDate,
      },
    ];

    processEarningsData();
  }

  $: {
    if (earningsCalendar && releaseTime) {
      processEarningsData();
    }
  }

  $: if ($page?.url?.pathname && $page?.url?.pathname !== dailyPagePathName) {
    dailyPagePathName = $page?.url?.pathname;
    loadDailyRowsPerPage();
    updateDailyPagination();
  }

  $: {
    if (currentWeek) {
      if (differenceInWeeks(currentWeek, today) > -maxWeeksChange) {
        previousMax = false;
      } else {
        previousMax = true;
      }
    }
  }

  $: {
    if (currentWeek) {
      if (differenceInWeeks(currentWeek, today) < maxWeeksChange) {
        nextMax = false;
      } else {
        nextMax = true;
      }
    }
  }

  let columns = [
    { key: "symbol", label: "Symbol", align: "left" },
    { key: "name", label: "Name", align: "left" },
    { key: "marketCap", label: "Market Cap", align: "right" },
    { key: "revenueEst", label: "Revenue Estimate", align: "right" },
    { key: "epsEst", label: "EPS Estimate", align: "right" },
    { key: "release", label: "Earnings Time", align: "right" },
  ];

  let sortOrders = {
    symbol: { order: "none", type: "string" },
    name: { order: "none", type: "string" },
    marketCap: { order: "none", type: "number" },
    revenueEst: { order: "none", type: "number" },
    epsEst: { order: "none", type: "number" },
    release: { order: "none", type: "string" },
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

  $: {
    if ($screenWidth < 640) {
      // Only set to Details if currently on a desktop view
      if (timeframe === "Daily" || timeframe === "Weekly") {
        timeframe = "Details";
      }
    } else if (timeframe === "Details" || timeframe === "Compact") {
      timeframe = "Daily";
    }
  }

  $: if (timeframe === "Daily" || timeframe === "Details") {
    updateDailyPagination();
  }
</script>

<SEO
  title="Earnings Calendar - Corporate Earnings Releases & Financial Results Schedule"
  description="Track upcoming earnings announcements with our comprehensive earnings calendar. Get real-time earnings dates, revenue estimates, EPS forecasts, and financial results for all major US stocks. Monitor pre-market and after-hours earnings releases with detailed analyst expectations and historical performance data."
  keywords="earnings calendar, earnings announcements, corporate earnings, earnings dates, EPS estimates, revenue forecasts, financial results, earnings season, quarterly earnings, earnings schedule, earnings reports, analyst estimates, earnings per share, company financials"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Earnings Calendar",
    description:
      "Comprehensive earnings calendar tracking corporate earnings announcements, financial results, and analyst estimates for US stocks",
    url: "https://stocknear.com/earnings-calendar",
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
          name: "Earnings Calendar",
          item: "https://stocknear.com/earnings-calendar",
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
      "Real-time earnings announcement tracking",
      "Revenue and EPS estimate analysis",
      "Pre-market and after-hours earnings identification",
      "Market capitalization filtering",
      "Weekly earnings calendar navigation",
      "Analyst consensus forecasts",
      "Historical earnings performance",
      "Sortable earnings data tables",
    ],
    creator: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-6 px-4 lg:px-6 text-gray-700 dark:text-zinc-200"
>
  <div class="text-xs sm:text-sm breadcrumbs text-gray-500 dark:text-zinc-500">
    <ul>
      <li>
        <a
          href="/"
          class="text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white transition"
          >Home</a
        >
      </li>
      <li class="text-gray-500 dark:text-zinc-500">Earnings Calendar</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:pr-5">
          <div class="mb-6 border-b border-gray-300 dark:border-zinc-700">
            <div
              class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2"
            >
              <h1
                class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
              >
                Earnings Calendar
              </h1>

              <div class="inline-flex sm:ml-auto">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild let:builder>
                    <Button
                      builders={[builder]}
                      class="flex-shrink-0 w-fit border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 transition flex flex-row justify-between items-center px-3 py-2 rounded-full truncate"
                    >
                      <span class="truncate">Time of Day</span>
                      <svg
                        class="-mr-1 ml-1 h-5 w-5 xs:ml-2 inline-block"
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
                    class="w-auto min-w-40 max-h-72 overflow-y-auto scroller rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
                  >
                    <DropdownMenu.Group>
                      {#each timeOptions as option}
                        <DropdownMenu.Item
                          on:click={() => handleTimeOptionClick(option)}
                          class="cursor-pointer sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-600 dark:hover:text-violet-400 transition flex items-center justify-between"
                        >
                          <span
                            class="flex items-center justify-between w-full"
                          >
                            {option.label}
                            {#if option.isPremium && !["Plus", "Pro"]?.includes(data?.user?.tier)}
                              <svg
                                class=" w-3.5 h-3.5"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="currentColor"
                                  d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                />
                              </svg>
                            {/if}
                          </span>
                          {#if releaseTime === option.value}
                            <CheckMark
                              class="w-4 h-4 text-gray-700 dark:text-zinc-200 ml-2"
                            />
                          {/if}
                        </DropdownMenu.Item>
                      {/each}
                    </DropdownMenu.Group>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>

                <div
                  class="inline-flex rounded-full ml-1.5 border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60"
                >
                  {#each tabs as item, i}
                    <button
                      on:click={() => (timeframe = item)}
                      class="cursor-pointer px-4 py-1.5 text-sm font-medium focus:z-10 focus:outline-none transition-colors duration-50
                          {i === 0 ? 'rounded-l-full' : ''}
                          {i === tabs.length - 1 ? 'rounded-r-full' : ''}
                          {timeframe === item
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                        : 'text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400'}"
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
                <!-- Daily View -->
                <div
                  class=" w-full flex flex-row justify-center m-auto items-center"
                >
                  <!-- Start Columns -->
                  <label
                    on:click={() => changeWeek("previous")}
                    class="{previousMax ? 'opacity-80' : ''} {weekArrowClasses}"
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
                        class="{weekdayClasses} {index === selectedWeekday
                          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold'
                          : 'bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200'}"
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
                              class="{mobileArrowClasses} rotate-180"
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
                              {day?.length} Earnings</span
                            >
                          </div>
                          <label
                            on:click={() => clickWeekday("next", index)}
                            class="{nextMax === true && index === 4
                              ? 'opacity-20'
                              : ''} sm:hidden mr-auto"
                          >
                            <svg
                              class="w-7 h-7 inline-block"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              ><path
                                fill="currentColor"
                                d="M8.025 22L6.25 20.225L14.475 12L6.25 3.775L8.025 2l10 10l-10 10Z"
                              /></svg
                            >
                          </label>
                        </div>
                      </label>
                    </div>
                  {/each}
                  <label
                    on:click={() => changeWeek("next")}
                    class="{nextMax ? 'opacity-80' : ''} {weekArrowClasses}"
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
              {/if}

              {#if timeframe === "Daily" || timeframe === "Details"}
                {#each weekday as day, index}
                  {#if index === selectedWeekday}
                    {#if day?.length !== 0}
                      <h2
                        class="font-semibold text-xl mt-5 text-gray-900 dark:text-white"
                      >
                        {formattedWeekday[index]?.split(", ")[1]} · {day?.length}
                        Earnings
                      </h2>

                      <div class="w-full overflow-x-auto mt-4">
                        <table
                          class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 m-auto text-gray-700 dark:text-zinc-200 tabular-nums"
                        >
                          <thead>
                            <TableHeader {columns} {sortOrders} {sortData} />
                          </thead>
                          <tbody
                            class="divide-y divide-gray-200/70 dark:divide-zinc-800/80"
                          >
                            {#each dailyDisplayList as item, index}
                              <!-- row -->
                              <tr
                                class="transition-colors hover:bg-gray-50/60 dark:hover:bg-zinc-900/50"
                              >
                                <td
                                  class="text-start text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-700 dark:text-zinc-200"
                                >
                                  <HoverStockChart symbol={item?.symbol} />
                                </td>

                                <td
                                  class="whitespace-nowrap text-[0.85rem] sm:text-sm text-gray-600 dark:text-zinc-300"
                                >
                                  {item?.name.length > 20
                                    ? item?.name?.slice(0, 20) + "..."
                                    : item?.name}
                                </td>

                                <td
                                  class="text-end text-[0.85rem] sm:text-sm text-gray-600 dark:text-zinc-300 tabular-nums"
                                >
                                  {@html item?.marketCap !== null
                                    ? abbreviateNumber(
                                        item?.marketCap,
                                        false,
                                        true,
                                      )
                                    : "n/a"}
                                </td>

                                <td
                                  class="text-end text-[0.85rem] sm:text-sm text-gray-600 dark:text-zinc-300 tabular-nums"
                                >
                                  <div
                                    class="flex flex-row items-center justify-end"
                                  >
                                    <span>
                                      {@html item?.revenueEst !== null
                                        ? abbreviateNumber(
                                            item?.revenueEst,
                                            false,
                                            true,
                                          )
                                        : "n/a"}
                                    </span>
                                    {#if getPercentageChange(item?.revenueEst, item?.revenuePrior) !== null}
                                      {@const revenueChange =
                                        getPercentageChange(
                                          item?.revenueEst,
                                          item?.revenuePrior,
                                        )}
                                      <span
                                        class="ml-1 {revenueChange >= 0
                                          ? 'text-emerald-600 dark:text-emerald-400'
                                          : 'text-rose-600 dark:text-rose-400'}"
                                      >
                                        {revenueChange >= 0
                                          ? "+"
                                          : ""}{revenueChange}%
                                      </span>
                                    {/if}
                                  </div>
                                </td>

                                <td
                                  class="text-end text-[0.85rem] sm:text-sm text-gray-600 dark:text-zinc-300 tabular-nums"
                                >
                                  <div
                                    class="flex flex-row items-center justify-end"
                                  >
                                    <span>
                                      {item?.epsEst !== null
                                        ? item?.epsEst?.toFixed(2)
                                        : "n/a"}
                                    </span>
                                    {#if getPercentageChange(item?.epsEst, item?.epsPrior) !== null}
                                      {@const epsChange = getPercentageChange(
                                        item?.epsEst,
                                        item?.epsPrior,
                                      )}
                                      <span
                                        class="ml-1 {epsChange >= 0
                                          ? 'text-emerald-600 dark:text-emerald-400'
                                          : 'text-rose-600 dark:text-rose-400'}"
                                      >
                                        {epsChange >= 0 ? "+" : ""}{epsChange}%
                                      </span>
                                    {/if}
                                  </div>
                                </td>

                                <td
                                  class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300"
                                >
                                  {#if item?.release === "amc"}
                                    <svg
                                      class="w-4 h-4 inline-block mr-1 text-gray-500 dark:text-zinc-400"
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 256 256"
                                      ><path
                                        fill="currentColor"
                                        d="M232.13 143.64a6 6 0 0 0-6-1.49a90.07 90.07 0 0 1-112.27-112.3a6 6 0 0 0-7.49-7.48a102.88 102.88 0 0 0-51.89 36.31a102 102 0 0 0 142.84 142.84a102.88 102.88 0 0 0 36.31-51.89a6 6 0 0 0-1.5-5.99m-42 48.29a90 90 0 0 1-126-126a90.9 90.9 0 0 1 35.52-28.27a102.06 102.06 0 0 0 118.69 118.69a90.9 90.9 0 0 1-28.24 35.58Z"
                                      /></svg
                                    >
                                    After Close
                                  {:else}
                                    <svg
                                      class="w-4 h-4 inline-block mr-1 text-gray-500 dark:text-zinc-400"
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 256 256"
                                      ><g fill="currentColor"
                                        ><path
                                          d="M184 128a56 56 0 1 1-56-56a56 56 0 0 1 56 56Z"
                                          opacity=".2"
                                        /><path
                                          d="M120 40V16a8 8 0 0 1 16 0v24a8 8 0 0 1-16 0Zm72 88a64 64 0 1 1-64-64a64.07 64.07 0 0 1 64 64Zm-16 0a48 48 0 1 0-48 48a48.05 48.05 0 0 0 48-48ZM58.34 69.66a8 8 0 0 0 11.32-11.32l-16-16a8 8 0 0 0-11.32 11.32Zm0 116.68l-16 16a8 8 0 0 0 11.32 11.32l16-16a8 8 0 0 0-11.32-11.32ZM192 72a8 8 0 0 0 5.66-2.34l16-16a8 8 0 0 0-11.32-11.32l-16 16A8 8 0 0 0 192 72Zm5.66 114.34a8 8 0 0 0-11.32 11.32l16 16a8 8 0 0 0 11.32-11.32ZM48 128a8 8 0 0 0-8-8H16a8 8 0 0 0 0 16h24a8 8 0 0 0 8-8Zm80 80a8 8 0 0 0-8 8v24a8 8 0 0 0 16 0v-24a8 8 0 0 0-8-8Zm112-88h-24a8 8 0 0 0 0 16h24a8 8 0 0 0 0-16Z"
                                        /></g
                                      ></svg
                                    >
                                    Before Open
                                  {/if}
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
                              class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
                            <span
                              class="text-sm text-gray-600 dark:text-zinc-300"
                            >
                              Page {dailyCurrentPage} of {dailyTotalPages}
                            </span>

                            <DropdownMenu.Root>
                              <DropdownMenu.Trigger asChild let:builder>
                                <Button
                                  builders={[builder]}
                                  class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
                                class="w-auto min-w-40 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
                              >
                                <DropdownMenu.Group class="pb-2">
                                  {#each dailyRowsPerPageOptions as item}
                                    <DropdownMenu.Item
                                      class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-600 dark:sm:hover:text-violet-400 transition"
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
                              class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
                            class="cursor-pointer text-sm font-medium text-gray-600 dark:text-zinc-400 transition hover:text-violet-600 dark:hover:text-violet-400"
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
                      <div class="mt-5 mb-3">
                        <Infobox
                          text=" No Earnings reports available for the day."
                        />
                      </div>
                    {/if}
                  {/if}
                {/each}
              {:else if timeframe === "Weekly"}
                <div class="flex flex-col w-full">
                  <div
                    class="w-full flex flex-row justify-center m-auto items-center"
                  >
                    <label
                      on:click={() => changeWeek("previous")}
                      class="{previousMax
                        ? 'opacity-80'
                        : ''} {weekArrowClasses}"
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
                      <div class="w-full">
                        <label
                          on:click={() => switchToDailyView(index)}
                          class="m-auto w-full cursor-pointer h-16 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 rounded-full sm:rounded-none flex border border-gray-300 shadow dark:border-zinc-700 mb-3 hover:text-violet-600 dark:hover:text-violet-400 transition"
                        >
                          <div
                            class="flex flex-col items-center truncate m-auto p-1"
                          >
                            <span class="text-[1rem]"
                              >{formattedWeekday[index]}</span
                            >
                            <span class="text-sm m-auto pt-1 pb-1">
                              {day?.length} Earnings</span
                            >
                          </div>
                        </label>
                      </div>
                    {/each}
                    <label
                      on:click={() => changeWeek("next")}
                      class="{nextMax ? 'opacity-80' : ''} {weekArrowClasses}"
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

                  <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    {#each weekday as day, dayIndex}
                      <div class="flex flex-col">
                        <div class="space-y-2">
                          {#if day?.length > 0}
                            {#each day as item, itemIndex}
                              {@const isExpanded =
                                expandedItems[`${dayIndex}-${itemIndex}`]}
                              <div
                                class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 text-[0.9rem]"
                              >
                                <div
                                  on:click={() =>
                                    toggleExpanded(dayIndex, itemIndex)}
                                  class="flex w-full cursor-pointer items-center justify-between px-3 py-2"
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

                                {#if isExpanded}
                                  <div class="px-3 pb-2 pt-1">
                                    <div
                                      class="border-t border-gray-300 dark:border-zinc-700"
                                    >
                                      <table class="w-full text-sm">
                                        <tbody>
                                          <tr
                                            class="border-b border-gray-300 dark:border-zinc-700"
                                          >
                                            <td class="py-1.5">Reports</td>
                                            <td
                                              class="text-right font-semibold"
                                            >
                                              <span
                                                class="flex items-center justify-end"
                                              >
                                                {#if item?.release === "amc"}
                                                  <svg
                                                    class="h-4 w-4 mr-1 text-gray-500 dark:text-zinc-400"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                  >
                                                    <path
                                                      stroke-linecap="round"
                                                      stroke-linejoin="round"
                                                      stroke-width="2"
                                                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                                                    ></path>
                                                  </svg>
                                                  After Close
                                                {:else}
                                                  <svg
                                                    class="h-4 w-4 mr-1 text-gray-500 dark:text-zinc-400"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                  >
                                                    <path
                                                      stroke-linecap="round"
                                                      stroke-linejoin="round"
                                                      stroke-width="2"
                                                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                                                    ></path>
                                                  </svg>
                                                  Before Open
                                                {/if}
                                              </span>
                                            </td>
                                          </tr>
                                          {#if item?.marketCap !== null}
                                            <tr
                                              class="border-b border-gray-300 dark:border-zinc-700"
                                            >
                                              <td class="py-1.5">Market Cap</td>
                                              <td
                                                class="text-right font-semibold"
                                              >
                                                {@html abbreviateNumber(
                                                  item?.marketCap,
                                                  false,
                                                  true,
                                                )}
                                              </td>
                                            </tr>
                                          {/if}
                                          <tr
                                            class="border-b border-gray-300 dark:border-zinc-700"
                                          >
                                            <td
                                              class="py-1.5"
                                              title="Estimated Revenue"
                                            >
                                              Revenue <span
                                                class="hidden md:inline"
                                                >Est.</span
                                              ><span class="inline md:hidden"
                                                >Estimate</span
                                              >
                                            </td>
                                            <td
                                              class="text-right font-semibold"
                                            >
                                              {#if item?.revenueEst !== null}
                                                {@html abbreviateNumber(
                                                  item?.revenueEst,
                                                  false,
                                                  true,
                                                )}
                                                {#if getPercentageChange(item?.revenueEst, item?.revenuePrior) !== null}
                                                  {@const revenueChange =
                                                    getPercentageChange(
                                                      item?.revenueEst,
                                                      item?.revenuePrior,
                                                    )}
                                                  <span
                                                    class={revenueChange >= 0
                                                      ? "text-emerald-600 dark:text-emerald-400"
                                                      : "text-rose-600 dark:text-rose-400"}
                                                  >
                                                    {revenueChange >= 0
                                                      ? "+"
                                                      : ""}{revenueChange}%
                                                  </span>
                                                {/if}
                                              {:else}
                                                n/a
                                              {/if}
                                            </td>
                                          </tr>
                                          <tr>
                                            <td
                                              class="pb-0.5 pt-1.5"
                                              title="Estimated EPS"
                                            >
                                              EPS <span class="hidden md:inline"
                                                >Est.</span
                                              ><span class="inline md:hidden"
                                                >Estimate</span
                                              >
                                            </td>
                                            <td
                                              class="text-right font-semibold"
                                            >
                                              {item?.epsEst !== null
                                                ? item?.epsEst?.toFixed(2)
                                                : "n/a"}
                                              {#if item?.epsEst !== null && item?.epsPrior !== null && item?.epsPrior !== 0}
                                                {#if item?.epsEst / item?.epsPrior - 1 >= 0}
                                                  <span
                                                    class="text-emerald-600 dark:text-emerald-400"
                                                  >
                                                    +{(
                                                      (item?.epsEst /
                                                        item?.epsPrior -
                                                        1) *
                                                      100
                                                    )?.toFixed(2)}%
                                                  </span>
                                                {:else}
                                                  <span
                                                    class="text-rose-600 dark:text-rose-400"
                                                  >
                                                    {(
                                                      (item?.epsEst /
                                                        item?.epsPrior -
                                                        1) *
                                                      100
                                                    )?.toFixed(2)}%
                                                  </span>
                                                {/if}
                                              {/if}
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
                              class="text-center text-sm text-gray-500 dark:text-zinc-400 py-8"
                            >
                              No earnings scheduled
                            </div>
                          {/if}
                        </div>
                      </div>
                    {/each}
                  </div>
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
                        : ''} {weekArrowClasses}"
                    >
                      <svg
                        class="w-6 h-6 m-auto rotate-180"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        ><path
                          fill="currentColor"
                          d="M8.025 22L6.25 20.225L14.475 12L6.25 3.775L8.025 2l10 10l-10 10Z"
                        /></svg
                      >
                    </label>
                    {#each weekday as day, index}
                      <div
                        class="w-full {index === selectedWeekday
                          ? ''
                          : 'hidden sm:block'}"
                      >
                        <label
                          on:click={() => toggleDate(index)}
                          class="m-auto w-full cursor-pointer h-16 {index ===
                          selectedWeekday
                            ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold'
                            : 'bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200'} rounded-full sm:rounded-none flex border border-gray-300 shadow dark:border-zinc-700 mb-3"
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
                                class="w-6 h-6 inline-block rotate-180"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                ><path
                                  fill="currentColor"
                                  d="M8.025 22L6.25 20.225L14.475 12L6.25 3.775L8.025 2l10 10l-10 10Z"
                                /></svg
                              >
                            </label>
                            <div
                              class="flex flex-col items-center truncate m-auto p-1"
                            >
                              <span class="text-[1rem]"
                                >{formattedWeekday[index]}</span
                              >
                              <span class="text-sm m-auto pt-1 pb-1">
                                {day?.length} Earnings</span
                              >
                            </div>
                            <label
                              on:click={() => clickWeekday("next", index)}
                              class="{nextMax === true && index === 4
                                ? 'opacity-20'
                                : ''} sm:hidden mr-auto"
                            >
                              <svg
                                class="w-7 h-7 inline-block"
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
                      class="{nextMax ? 'opacity-80' : ''} {weekArrowClasses}"
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

                  <!-- Compact Card List (based on Weekly view cards) -->
                  <div class="space-y-2">
                    {#if weekday[selectedWeekday]?.length > 0}
                      {#each weekday[selectedWeekday] as item, itemIndex}
                        {@const isExpanded =
                          expandedItems[`${selectedWeekday}-${itemIndex}`]}
                        <div
                          class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 text-[0.9rem]"
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
                            <div class="px-3 pb-2">
                              <div
                                class="border-t border-gray-300 dark:border-zinc-700 pt-2"
                              >
                                <table class="w-full text-sm">
                                  <tbody>
                                    <tr
                                      class="border-b border-gray-300 dark:border-zinc-700"
                                    >
                                      <td class="py-1.5">Reports</td>
                                      <td class="text-right font-semibold">
                                        <span
                                          class="flex items-center justify-end"
                                        >
                                          {#if item?.release === "amc"}
                                            <svg
                                              class="h-4 w-4 mr-1 text-gray-500 dark:text-zinc-400"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                            >
                                              <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                                              />
                                            </svg>
                                            After Close
                                          {:else}
                                            <svg
                                              class="h-4 w-4 mr-1 text-gray-500 dark:text-zinc-400"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                            >
                                              <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                                              />
                                            </svg>
                                            Before Open
                                          {/if}
                                        </span>
                                      </td>
                                    </tr>
                                    {#if item?.marketCap !== null}
                                      <tr
                                        class="border-b border-gray-300 dark:border-zinc-700"
                                      >
                                        <td class="py-1.5">Market Cap</td>
                                        <td class="text-right font-semibold">
                                          {@html abbreviateNumber(
                                            item?.marketCap,
                                            false,
                                            true,
                                          )}
                                        </td>
                                      </tr>
                                    {/if}
                                    <tr
                                      class="border-b border-gray-300 dark:border-zinc-700"
                                    >
                                      <td
                                        class="py-1.5"
                                        title="Estimated Revenue"
                                        >Revenue Est.</td
                                      >
                                      <td class="text-right font-semibold">
                                        {#if item?.revenueEst !== null}
                                          {@html abbreviateNumber(
                                            item?.revenueEst,
                                            false,
                                            true,
                                          )}
                                        {:else}
                                          n/a
                                        {/if}
                                        {#if item?.revenueEst !== null && item?.revenuePrior !== null && item?.revenuePrior !== 0}
                                          {#if !isFinite((item?.revenueEst / item?.revenuePrior - 1) * 100)}
                                            <span></span>
                                          {:else if item?.revenueEst / item?.revenuePrior - 1 >= 0}
                                            <span
                                              class="text-emerald-600 dark:text-emerald-400"
                                            >
                                              +{(
                                                (item?.revenueEst /
                                                  item?.revenuePrior -
                                                  1) *
                                                100
                                              )?.toFixed(2)}%
                                            </span>
                                          {:else}
                                            <span
                                              class="text-rose-600 dark:text-rose-400"
                                            >
                                              {(
                                                (item?.revenueEst /
                                                  item?.revenuePrior -
                                                  1) *
                                                100
                                              )?.toFixed(2)}%
                                            </span>
                                          {/if}
                                        {/if}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td
                                        class="pb-0.5 pt-1.5"
                                        title="Estimated EPS">EPS Est.</td
                                      >
                                      <td class="text-right font-semibold">
                                        {item?.epsEst !== null
                                          ? item?.epsEst?.toFixed(2)
                                          : "n/a"}
                                        {#if item?.epsEst !== null && item?.epsPrior !== null && item?.epsPrior !== 0}
                                          {#if item?.epsEst / item?.epsPrior - 1 >= 0}
                                            <span
                                              class="text-emerald-600 dark:text-emerald-400"
                                            >
                                              +{(
                                                (item?.epsEst / item?.epsPrior -
                                                  1) *
                                                100
                                              )?.toFixed(2)}%
                                            </span>
                                          {:else}
                                            <span
                                              class="text-rose-600 dark:text-rose-400"
                                            >
                                              {(
                                                (item?.epsEst / item?.epsPrior -
                                                  1) *
                                                100
                                              )?.toFixed(2)}%
                                            </span>
                                          {/if}
                                        {/if}
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
                        class="text-center text-sm text-gray-500 dark:text-zinc-400 py-8"
                      >
                        No earnings scheduled
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

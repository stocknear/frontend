<script lang="ts">
  import { format, startOfWeek, addDays, addWeeks, subWeeks } from "date-fns";
  import { screenWidth } from "$lib/store";
  import { abbreviateNumber, listOfRelevantCountries } from "$lib/utils";
  import ArrowLogo from "lucide-svelte/icons/move-up-right";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  import { onMount } from "svelte";
  import { page } from "$app/stores";

  export let data;

  // Daily pagination state for per-day results
  let dailyCurrentPage = 1;
  let dailyRowsPerPage = 20;
  let dailyRowsPerPageOptions = [20, 50, 100];
  let dailyTotalPages = 1;
  let dailyDisplayList = [];
  let dailyRowsPathName = "";

  // Reusable SVG icon paths
  const arrowIcon =
    "M8.025 22L6.25 20.225L14.475 12L6.25 3.775L8.025 2l10 10l-10 10Z";
  const chevronDownIcon =
    "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z";
  const closeIcon = "M18 6L6 18M6 6l12 12";
  const starIcon =
    "M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z";

  // Common CSS classes
  const borderClasses = "border border-gray-300 shadow dark:border-zinc-700";
  const navigationButtonClasses =
    "h-16 w-48 cursor-pointer m-auto flex bg-white/90 dark:bg-zinc-950/70 text-gray-700 dark:text-zinc-200 mb-3";
  const dropdownButtonClasses =
    "border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 transition flex flex-row justify-between items-center px-3 py-2 rounded-full truncate";

  // Importance levels for dropdown
  const importanceLevels = [1, 2, 3];

  let rawData;
  let filterList = [];
  let weekdayFiltered = [];
  let weekday = []; // our unordered week data
  let syncWorker: Worker | undefined;
  let pagePathName: string = "";
  // reassign pagePathName reactively
  $: pagePathName = $page?.url?.pathname || "";

  const maxWeeksChange = 6;
  const today = new Date();
  let currentWeek = startOfWeek(today, { weekStartsOn: 1 });
  let previousMax = false;
  let nextMax = false;
  let searchQuery = "";
  let sortMode = false;
  let daysOfWeek = [];
  let formattedWeekday = [];
  $: testList = [];

  // Get calendar data from our load function
  $: economicCalendar = data?.getEconomicCalendar;
  // Calculate the week days
  $: daysOfWeek = getDaysOfWeek(currentWeek);
  // Format days for header labels
  $: formattedWeekday = daysOfWeek.map((day) => format(day.date, "EEE, MMM d"));

  // Recalculate weekday data when the economicCalendar or days change – but only when not sorting
  $: if (!sortMode) {
    weekday = getWeekdayData(economicCalendar, daysOfWeek);
    rawData = weekday;
  }

  // Whenever filters are applied and the worker exists, trigger filtering
  $: if (
    filterList.length > 0 &&
    syncWorker &&
    selectedWeekday &&
    currentWeek
  ) {
    loadWorker();
  }

  // Create a consolidated derived value for our header and table rendering
  $: displayWeekData = filterList.length === 0 ? weekday : weekdayFiltered;

  // Calculate week boundaries
  const startBoundary = subWeeks(
    startOfWeek(today, { weekStartsOn: 1 }),
    maxWeeksChange,
  );
  const endBoundary = addWeeks(
    startOfWeek(today, { weekStartsOn: 1 }),
    maxWeeksChange,
  );

  // Consolidated navigation limits reactive statement
  $: {
    previousMax = currentWeek <= startBoundary;
    nextMax = currentWeek >= endBoundary;
  }

  let currentDate = new Date();
  let selectedWeekday = Math.min((currentDate.getDay() + 6) % 7, 4);

  // Returns an array of weekdays (Monday - Friday) for a given week.
  function getDaysOfWeek(week) {
    const startDate = startOfWeek(week, { weekStartsOn: 1 });
    return Array.from({ length: 5 }, (_, i) => ({
      name: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][i],
      date: addDays(startDate, i),
    }));
  }

  // Retrieves and sorts calendar data for each day.
  function getWeekdayData(calendar, days) {
    if (!calendar) return [];
    return days.map((day) => {
      const dayData = calendar.filter(
        (item) => item.date === format(day.date, "yyyy-MM-dd"),
      );
      return dayData.sort(
        (a, b) =>
          new Date(`1970-01-01T${a.time}`).getTime() -
          new Date(`1970-01-01T${b.time}`).getTime(),
      );
    });
  }

  // Handle messages from our filtering web worker.
  const handleMessage = (event) => {
    weekdayFiltered = event.data?.finalData?.output ?? [];
    resetDailyPagination();
  };

  // Tell the web worker to filter our data
  const loadWorker = async () => {
    syncWorker?.postMessage({ rawData, filterList });
  };

  function toggleDate(index) {
    if ($screenWidth > 640) {
      selectedWeekday = index;
      resetDailyPagination();
    }
  }

  function clickWeekday(state, index) {
    if (state === "next" && selectedWeekday < 4) {
      selectedWeekday++;
      resetDailyPagination();
    } else if (state === "previous" && selectedWeekday > 0) {
      selectedWeekday--;
      resetDailyPagination();
    } else if (state === "previous" && index === 0 && !previousMax) {
      changeWeek("previous");
      selectedWeekday = 4;
      resetDailyPagination();
    } else if (state === "next" && index === 4 && !nextMax) {
      changeWeek("next");
      selectedWeekday = 0;
      resetDailyPagination();
    }
  }

  function changeWeek(state) {
    const newWeek =
      state === "previous"
        ? subWeeks(currentWeek, 1)
        : addWeeks(currentWeek, 1);
    if (newWeek >= startBoundary && newWeek <= endBoundary) {
      currentWeek = newWeek;
      resetDailyPagination();
    }
  }

  function updateDailyPagination() {
    const selectedDayData = displayWeekData?.[selectedWeekday] ?? [];
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
    const currentPath = pagePathName || dailyRowsPathName || "";
    if (!currentPath || typeof localStorage === "undefined") return;

    try {
      const paginationKey = `${currentPath}_economicDailyRows`;
      localStorage.setItem(paginationKey, String(dailyRowsPerPage));
    } catch (e) {
      console.warn("Failed to save daily rows per page preference:", e);
    }
  }

  function loadDailyRowsPerPage(path?: string) {
    const currentPath = (path ?? pagePathName ?? dailyRowsPathName) || "";

    if (!currentPath || typeof localStorage === "undefined") {
      dailyRowsPerPage = 20;
      return;
    }

    try {
      const paginationKey = `${currentPath}_economicDailyRows`;
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

  function saveRules() {
    try {
      localStorage?.setItem(pagePathName, JSON.stringify(filterList));
    } catch (e) {
      console.error("Failed saving filterlist:", e);
    }
  }

  // Notice we now initialize checkedItems just once instead of using a reactive assignment.
  let checkedItems: Set<any> = new Set();

  onMount(async () => {
    try {
      const savedRules = localStorage?.getItem(pagePathName);
      if (savedRules) {
        filterList = JSON?.parse(savedRules);
      }
      checkedItems = new Set(filterList);

      if (!syncWorker) {
        const SyncWorker = await import("./workers/filterWorker?worker");
        syncWorker = new SyncWorker.default();
        syncWorker.onmessage = handleMessage;
      }

      await loadWorker();
      loadDailyRowsPerPage(pagePathName);
      updateDailyPagination();
    } catch (e) {
      console.error(e);
    }
  });

  // Update the global searchQuery (avoid shadowing) and debounce the filtering.
  function handleInput(event: InputEvent) {
    searchQuery = (event.target as HTMLInputElement)?.value.toLowerCase() || "";
    setTimeout(() => {
      testList = [];
      if (searchQuery.length > 0) {
        testList = listOfRelevantCountries.filter((item) =>
          item.toLowerCase().startsWith(searchQuery),
        );
      }
    }, 50);
  }

  async function handleChangeValue(value) {
    if (checkedItems.has(value)) {
      checkedItems.delete(value);
    } else {
      checkedItems.add(value);
    }
    const filterSet = new Set(filterList);
    filterSet.has(value) ? filterSet.delete(value) : filterSet.add(value);
    filterList = Array.from(filterSet);

    if (filterList.length !== 0) {
      await loadWorker();
    } else {
      weekday = rawData;
    }
    saveRules();
    resetDailyPagination();
  }

  function handleReset() {
    filterList = [];
    checkedItems = new Set();
    economicCalendar = data?.getEconomicCalendar;
    daysOfWeek = getDaysOfWeek(currentWeek);
    formattedWeekday = daysOfWeek.map((day) => format(day.date, "EEE, MMM d"));
    weekday = getWeekdayData(economicCalendar, daysOfWeek);
    rawData = weekday;
    currentWeek = startOfWeek(today, { weekStartsOn: 1 });
    selectedWeekday = Math.min((currentDate.getDay() + 6) % 7, 4);
    previousMax = currentWeek <= startBoundary;
    nextMax = currentWeek >= endBoundary;
    saveRules();
    resetDailyPagination();
  }

  $: {
    const currentPath = pagePathName || $page?.url?.pathname || "";
    if (currentPath && currentPath !== dailyRowsPathName) {
      dailyRowsPathName = currentPath;
      loadDailyRowsPerPage(currentPath);
      updateDailyPagination();
    }
  }

  $: {
    displayWeekData;
    selectedWeekday;
    updateDailyPagination();
  }

  // Static columns (do not change across renders)
  const columns = [
    { key: "time", label: "Time", align: "left" },
    { key: "country", label: "Country", align: "left" },
    { key: "event", label: "Event", align: "left" },
    { key: "actual", label: "Actual", align: "right" },
    { key: "consensus", label: "Forecast", align: "right" },
    { key: "prior", label: "Previous", align: "right" },
    { key: "importance", label: "Importance", align: "right" },
  ];

  let sortOrders = {
    time: { order: "none", type: "string" },
    country: { order: "none", type: "string" },
    event: { order: "none", type: "string" },
    actual: { order: "none", type: "number" },
    consensus: { order: "none", type: "number" },
    prior: { order: "none", type: "number" },
    importance: { order: "none", type: "number" },
  };

  const sortData = (key) => {
    sortMode = true;
    Object.keys(sortOrders).forEach((k) => {
      if (k !== key) sortOrders[k].order = "none";
    });

    // Cycle through "none", "asc", "desc"
    const orderCycle = ["none", "asc", "desc"];
    const currentOrderIndex = orderCycle.indexOf(
      sortOrders[key]?.order || "none",
    );
    sortOrders[key] = {
      ...sortOrders[key],
      order: orderCycle[(currentOrderIndex + 1) % orderCycle.length],
    };

    const sortOrder = sortOrders[key].order;
    if (sortOrder === "none") {
      sortMode = false;
      resetDailyPagination();
      return;
    }

    const compareValues = (a, b) => {
      const { type } = sortOrders[key];
      let valueA, valueB;
      switch (type) {
        case "date":
          valueA = new Date(a[key]).getTime();
          valueB = new Date(b[key]).getTime();
          break;
        case "string":
          valueA = a[key] ? a[key].toUpperCase() : "";
          valueB = b[key] ? b[key].toUpperCase() : "";
          return sortOrder === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        case "number":
        default:
          valueA = parseFloat(a[key]);
          valueB = parseFloat(b[key]);
          break;
      }
      return sortOrder === "asc"
        ? valueA < valueB
          ? -1
          : valueA > valueB
            ? 1
            : 0
        : valueA > valueB
          ? -1
          : valueA < valueB
            ? 1
            : 0;
    };

    // Create a new array copy to trigger reactivity (instead of in-place mutation)
    weekday = [
      ...weekday.slice(0, selectedWeekday),
      [...rawData[selectedWeekday]].sort(compareValues),
      ...weekday.slice(selectedWeekday + 1),
    ];
    resetDailyPagination();
  };

  function scrollToTop() {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
</script>

<SEO
  title="Economic Calendar - Live Market-Moving Events & Financial Data Releases"
  description="Stay ahead with our comprehensive economic calendar featuring real-time financial events, economic indicators, and market-moving data releases. Track GDP, inflation, employment data, central bank meetings, and key economic announcements with precise timing and forecasts. Essential tool for traders and investors to anticipate market volatility."
  keywords="economic calendar, financial events, market calendar, economic indicators, GDP release, inflation data, employment statistics, central bank meetings, economic news, market-moving events, financial data releases, economic announcements, trading calendar, investment planning"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Economic Calendar",
    description:
      "Comprehensive economic calendar tracking global financial events, economic indicators, and market-moving data releases",
    url: "https://stocknear.com/economic-calendar",
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
          name: "Economic Calendar",
          item: "https://stocknear.com/economic-calendar",
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
      "Real-time economic event tracking",
      "Global financial calendar coverage",
      "Economic indicator forecasts vs actuals",
      "Country-based event filtering",
      "Importance level classification",
      "Weekly calendar navigation",
      "Market impact assessment",
      "Time zone adjusted displays",
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
  <div class="text-xs sm:text-sm breadcrumbs text-gray-800 dark:text-zinc-300">
    <ul>
      <li>
        <a
          href="/"
          class="text-gray-800 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition"
          >Home</a
        >
      </li>
      <li class="text-gray-800 dark:text-zinc-300">Economic Calendar</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex flex-col lg:flex-row justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class="mb-6 border-b border-gray-300 dark:border-zinc-700">
            <h1
              class="mb-1 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              Economic Calendar
            </h1>
          </div>

          <!-- Page wrapper -->
          <div class="flex justify-center w-full m-auto h-full overflow-hidden">
            <!-- Content area -->
            <div class="relative flex flex-col flex-1 overflow-hidden">
              <!-- Header Dates -->
              <div
                class="w-full flex flex-row justify-center m-auto items-center"
              >
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
                {#each displayWeekData as day, index (formattedWeekday[index])}
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
                        : 'bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200'} rounded-full sm:rounded-none flex {borderClasses} mb-3"
                    >
                      <div
                        class="flex flex-row justify-center items-center w-full"
                      >
                        <label
                          on:click={() => clickWeekday("previous", index)}
                          class="sm:hidden ml-auto"
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
                          <span class="text-md">{formattedWeekday[index]}</span>
                          <span class="text-[1rem] sm:text-sm m-auto pt-1 pb-1"
                            >{day?.length} Events</span
                          >
                        </div>
                        <label
                          on:click={() => clickWeekday("next", index)}
                          class="sm:hidden mr-auto"
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

              <!-- Dropdown Filters -->
              <div
                class="flex flex-row items-center w-full sm:w-fit m-auto sm:m-0 pt-6 pb-3"
              >
                <div
                  class="grid grid-cols-2 sm:grid-cols-3 gap-y-3 sm:gap-y-0 gap-x-2.5 lg:grid-cols-3 w-full mt-3"
                >
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild let:builder>
                      <Button
                        builders={[builder]}
                        class={dropdownButtonClasses}
                      >
                        <span class="truncate">Filter Country</span>
                        <svg
                          class="-mr-1 ml-1 h-5 w-5 xs:ml-2 inline-block"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          style="max-width:40px"
                          aria-hidden="true"
                        >
                          <path
                            fill-rule="evenodd"
                            d={chevronDownIcon}
                            clip-rule="evenodd"
                          />
                        </svg>
                      </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content
                      side="bottom"
                      align="end"
                      sideOffset={10}
                      alignOffset={0}
                      class="w-56 h-fit max-h-72 overflow-y-auto scroller rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
                    >
                      <div
                        class="relative sticky z-40 focus:outline-hidden -top-1 flex flex-row items-center justify-between p-3 bg-white/95 dark:bg-zinc-950/95 border-b border-gray-300 dark:border-zinc-700"
                        tabindex="0"
                        role="menu"
                      >
                        <input
                          bind:value={searchQuery}
                          on:input={handleInput}
                          autocomplete="off"
                          class="focus:outline-none text-sm absolute sticky w-full border-0 focus:border-gray-200 focus:ring-0 text-gray-700 dark:text-zinc-200 placeholder:text-gray-500 dark:placeholder:text-zinc-400 bg-transparent"
                          placeholder="Search..."
                        />
                        {#if searchQuery?.length > 0}
                          <label
                            class="cursor-pointer inline-block"
                            on:click={() => (searchQuery = "")}
                          >
                            <svg
                              class="w-5 h-5"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              fill="none"
                              stroke-width="2"
                            >
                              <path d={closeIcon} />
                            </svg>
                          </label>
                        {/if}
                      </div>
                      <DropdownMenu.Group>
                        {#each searchQuery.length > 0 ? testList : listOfRelevantCountries as item}
                          <DropdownMenu.Item
                            class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-600 dark:hover:text-violet-400 transition"
                          >
                            <div class="flex items-center">
                              <label
                                on:click={() => handleChangeValue(item)}
                                class="cursor-pointer"
                                for={item}
                              >
                                <input
                                  type="checkbox"
                                  checked={checkedItems.has(item)}
                                />
                                <span class="ml-2">{item}</span>
                              </label>
                            </div>
                          </DropdownMenu.Item>
                        {:else}
                          <DropdownMenu.Item
                            class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-600 dark:hover:text-violet-400 transition"
                          >
                            No country found
                          </DropdownMenu.Item>
                        {/each}
                      </DropdownMenu.Group>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>

                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild let:builder>
                      <Button
                        builders={[builder]}
                        class={dropdownButtonClasses}
                      >
                        <span class="truncate">Filter Importance</span>
                        <svg
                          class="-mr-1 ml-1 h-5 w-5 xs:ml-2 inline-block"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          style="max-width:40px"
                          aria-hidden="true"
                        >
                          <path
                            fill-rule="evenodd"
                            d={chevronDownIcon}
                            clip-rule="evenodd"
                          />
                        </svg>
                      </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content
                      side="bottom"
                      align="end"
                      sideOffset={10}
                      alignOffset={0}
                      class="w-56 h-fit max-h-72 overflow-y-auto scroller rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
                    >
                      <div
                        class="relative sticky z-40 focus:outline-hidden -top-1"
                        tabindex="0"
                        role="menu"
                      ></div>
                      <DropdownMenu.Group>
                        {#each importanceLevels as i}
                          <DropdownMenu.Item
                            class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-600 dark:hover:text-violet-400 transition"
                          >
                            <div class="flex items-center">
                              <label
                                on:click={() => handleChangeValue(i)}
                                class="flex flex-row items-center cursor-pointer"
                                for={i}
                              >
                                <input
                                  type="checkbox"
                                  checked={checkedItems.has(i)}
                                />
                                <div class="ml-2 flex flex-row items-center">
                                  {#if i > 0}
                                    {#each Array(i) as _}
                                      <svg
                                        class="w-4 h-4 text-[#FFA500]"
                                        aria-hidden="true"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="currentColor"
                                        viewBox="0 0 22 20"
                                      >
                                        <path d={starIcon} />
                                      </svg>
                                    {/each}
                                  {/if}
                                </div>
                              </label>
                            </div>
                          </DropdownMenu.Item>
                        {/each}
                      </DropdownMenu.Group>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>

                  {#if filterList.length !== 0}
                    <Button
                      on:click={handleReset}
                      class="w-fit transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="inline-block w-4 h-4 mr-2"
                        viewBox="0 0 21 21"
                      >
                        <g
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path d="M3.578 6.487A8 8 0 1 1 2.5 10.5" />
                          <path d="M7.5 6.5h-4v-4" />
                        </g>
                      </svg>
                      Reset All
                    </Button>
                  {/if}
                </div>
              </div>

              <!-- Events Table -->
              <div class="z-0 mb-40">
                {#each displayWeekData as day, index}
                  {#if index === selectedWeekday}
                    {#if day?.length !== 0}
                      <div class="flex flex-row items-center mt-5">
                        <h2 class="font-semibold text-xl">
                          {formattedWeekday[index]?.split(", ")[1]} · {day?.length}
                          Events
                        </h2>
                        {#if filterList.length !== 0}
                          <div
                            class="ml-auto text-[1rem] sm:text-lg flex flex-row items-center relative block rounded px-2 py-1 text-gray-600 dark:text-zinc-300"
                          >
                            <span>Filters</span>
                            <span
                              class="ml-2 rounded-full avatar w-5 h-5 text-xs font-semibold text-center shrink-0 flex items-center justify-center bg-white/80 dark:bg-zinc-900/70 border border-gray-300 shadow dark:border-zinc-700 text-gray-700 dark:text-zinc-200"
                            >
                              {filterList.length}
                            </span>
                          </div>
                        {/if}
                      </div>

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
                            {#each dailyDisplayList as item}
                              <tr
                                class="transition-colors hover:bg-gray-50/60 dark:hover:bg-zinc-900/50"
                              >
                                <td
                                  class="text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                                >
                                  {item?.time}
                                </td>
                                <td
                                  class="flex flex-row items-center text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-700 dark:text-zinc-200"
                                >
                                  {#if item?.country === "EU"}
                                    <svg
                                      style="clip-path: circle(50%);"
                                      class="w-4 h-4 sm:w-6 sm:h-6"
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 512 512"
                                    >
                                      <mask id="circleFlagsEu0">
                                        <circle
                                          cx="256"
                                          cy="256"
                                          r="256"
                                          fill="#fff"
                                        />
                                      </mask>
                                      <g mask="url(#circleFlagsEu0)">
                                        <path
                                          fill="#0052b4"
                                          d="M0 0h512v512H0z"
                                        />
                                        <path
                                          fill="#ffda44"
                                          d="m256 100.2l8.3 25.5H291l-21.7 15.7l8.3 25.6l-21.7-15.8l-21.7 15.8l8.3-25.6l-21.7-15.7h26.8zm-110.2 45.6l24 12.2l18.9-19l-4.2 26.5l23.9 12.2l-26.5 4.2l-4.2 26.5l-12.2-24l-26.5 4.3l19-19zM100.2 256l25.5-8.3V221l15.7 21.7l25.6-8.3l-15.8 21.7l15.8 21.7l-25.6-8.3l-15.7 21.7v-26.8zm45.6 110.2l12.2-24l-19-18.9l26.5 4.2l12.2-23.9l4.2 26.5l26.5 4.2l-24 12.2l4.3 26.5l-19-19zM256 411.8l-8.3-25.5H221l21.7-15.7l-8.3-25.6l21.7 15.8l21.7-15.8l-8.3 25.6l21.7 15.7h-26.8zm110.2-45.6l-24-12.2l-18.9 19l4.2-26.5l-23.9-12.2l26.5-4.2l4.2-26.5l12.2 24l26.5-4.3l-19 19zM411.8 256l-25.5 8.3V291l-15.7-21.7l-25.6 8.3l15.8-21.7l-15.8-21.7l25.6 8.3l15.7-21.7v26.8zm-45.6-110.2l-12.2 24l19 18.9l-26.5-4.2l-12.2 23.9l-4.2-26.5l-26.5-4.2l24-12.2l-4.3-26.5l19 19z"
                                        />
                                      </g>
                                    </svg>
                                  {:else if item?.country === "UK"}
                                    <svg
                                      style="clip-path: circle(50%);"
                                      class="w-4 h-4 sm:w-6 sm:h-6"
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 512 512"
                                    >
                                      <mask id="circleFlagsUk0">
                                        <circle
                                          cx="256"
                                          cy="256"
                                          r="256"
                                          fill="#fff"
                                        />
                                      </mask>
                                      <g mask="url(#circleFlagsUk0)">
                                        <path
                                          fill="#eee"
                                          d="m0 0l8 22l-8 23v23l32 54l-32 54v32l32 48l-32 48v32l32 54l-32 54v68l22-8l23 8h23l54-32l54 32h32l48-32l48 32h32l54-32l54 32h68l-8-22l8-23v-23l-32-54l32-54v-32l-32-48l32-48v-32l-32-54l32-54V0l-22 8l-23-8h-23l-54 32l-54-32h-32l-48 32l-48-32h-32l-54 32L68 0z"
                                        />
                                        <path
                                          fill="#0052b4"
                                          d="M336 0v108L444 0Zm176 68L404 176h108zM0 176h108L0 68ZM68 0l108 108V0Zm108 512V404L68 512ZM0 444l108-108H0Zm512-108H404l108 108Zm-68 176L336 404v108z"
                                        />
                                        <path
                                          fill="#d80027"
                                          d="M0 0v45l131 131h45zm208 0v208H0v96h208v208h96V304h208v-96H304V0zm259 0L336 131v45L512 0zM176 336L0 512h45l131-131zm160 0l176 176v-45L381 336z"
                                        />
                                      </g>
                                    </svg>
                                  {:else}
                                    <img
                                      style="clip-path: circle(50%);"
                                      class="w-4 h-4 sm:w-6 sm:h-6"
                                      src={`https://hatscripts.github.io/circle-flags/flags/${item?.countryCode}.svg`}
                                      loading="lazy"
                                      alt="{item?.country} flag"
                                    />
                                  {/if}
                                  <span class="ml-2">{item?.country}</span>
                                </td>
                                <td
                                  class="text-start text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300"
                                >
                                  {item?.event?.length > 60
                                    ? item?.event.slice(0, 60) + "..."
                                    : item?.event}
                                </td>
                                <td
                                  class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                                >
                                  {item?.actual !== null && item?.actual !== ""
                                    ? abbreviateNumber(item?.actual)
                                    : "-"}
                                </td>
                                <td
                                  class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                                >
                                  {item?.consensus !== null &&
                                  item?.consensus !== ""
                                    ? abbreviateNumber(item?.consensus)
                                    : "-"}
                                </td>
                                <td
                                  class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300 tabular-nums"
                                >
                                  {item?.prior !== null && item?.prior !== ""
                                    ? abbreviateNumber(item?.prior)
                                    : "-"}
                                </td>
                                <td
                                  class="text-start text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300"
                                >
                                  <div
                                    class="flex flex-row items-center justify-end"
                                  >
                                    {#each Array.from({ length: 3 }) as _, i}
                                      {#if i < Math.floor(item?.importance)}
                                        <svg
                                          class="w-4 h-4 text-[#FFA500]"
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
                                          class="w-4 h-4 text-gray-300 dark:text-zinc-600"
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
                      <Infobox text="No Events available for the day." />
                    {/if}
                  {/if}
                {/each}
                <div
                  class="text-sm border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 text-gray-600 dark:text-zinc-300 p-3 mt-6"
                >
                  <strong>Source:</strong> Economic Calendar provided by
                  <a
                    href="https://site.financialmodelingprep.com/pricing-plans?couponCode=stocknear"
                    target="_blank"
                    rel="noopener"
                    class="text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                    >Financial Modeling Prep</a
                  > and times are shown in ET (Eastern Time).
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</section>

<script lang="ts">
  import {
    stockTicker,
    etfTicker,
    indexTicker,
    setCache,
    getCache,
  } from "$lib/store";
  import { formatDate } from "$lib/utils";
  import { page } from "$app/stores";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import * as m from "$lib/paraglide/messages";

  export let data;

  let rawData = [];
  let rawDataPressRelease = [];
  let rawNewsVideos = [];

  let newsList = [];
  let displaySection = "all";

  // Pagination state
  let currentPage = 1;
  let rowsPerPage = 5;
  let rowsPerPageOptions = [5, 10, 15];
  let totalPages = 1;

  let pagePathName = $page?.url?.pathname;

  async function getPressRelease() {
    displaySection = "press-releases";
    currentPage = 1; // Reset to first page
    const cachedData = getCache($stockTicker, "getPressRelease");
    if (cachedData) {
      rawDataPressRelease = cachedData;
    } else {
      const postData = { ticker: $stockTicker, path: "stock-press-release" };
      const response = await fetch("/api/ticker-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      rawDataPressRelease = await response?.json();
      setCache($stockTicker, rawDataPressRelease, "getPressRelease");
    }
    updatePaginatedData();
  }

  function showAllNews() {
    displaySection = "all";
    currentPage = 1;
    updatePaginatedData();
  }

  async function getNewsVideos() {
    displaySection = "videos";
    currentPage = 1; // Reset to first page
    const cachedData = getCache($stockTicker, "getNewsVideos");
    if (cachedData) {
      rawNewsVideos = cachedData;
    } else {
      const postData = { ticker: $stockTicker, path: "news-videos" };
      const response = await fetch("/api/ticker-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      rawNewsVideos = await response?.json();
      setCache($stockTicker, rawNewsVideos, "getNewsVideos");
    }
    updatePaginatedData();
  }

  // Memoize the YouTube video check function
  const videoCheckCache = new Map();
  function checkIfYoutubeVideo(link: string): string | null {
    if (videoCheckCache.has(link)) {
      return videoCheckCache.get(link);
    }
    try {
      const url = new URL(link);
      const result =
        url.hostname === "www.youtube.com" || url.hostname === "youtube.com"
          ? url.searchParams.get("v")
          : null;
      videoCheckCache.set(link, result);
      return result;
    } catch {
      videoCheckCache.set(link, null);
      return null;
    }
  }

  // Pagination functions
  function updatePaginatedData() {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    let dataSource;

    switch (displaySection) {
      case "videos":
        dataSource = rawNewsVideos;
        break;
      case "press-releases":
        dataSource = rawDataPressRelease;
        break;
      default:
        dataSource = rawData;
    }

    newsList = dataSource?.slice(startIndex, endIndex) || [];
    totalPages = Math.ceil((dataSource?.length || 0) / rowsPerPage);
  }

  function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      updatePaginatedData();
    }
  }

  function changeRowsPerPage(newRowsPerPage) {
    rowsPerPage = newRowsPerPage;
    currentPage = 1; // Reset to first page when changing rows per page
    updatePaginatedData();
    saveRowsPerPage(); // Save to localStorage
  }

  // Save rows per page preference to localStorage
  function saveRowsPerPage() {
    if (!pagePathName || typeof localStorage === "undefined") return;

    try {
      const paginationKey = `${pagePathName}_news_rowsPerPage`;
      localStorage.setItem(paginationKey, String(rowsPerPage));
    } catch (e) {
      console.warn("Failed to save rows per page preference:", e);
    }
  }

  // Load rows per page preference from localStorage
  function loadRowsPerPage() {
    const currentPath = pagePathName || $page?.url?.pathname;

    if (!currentPath || typeof localStorage === "undefined") {
      rowsPerPage = 5; // Default value
      return;
    }

    try {
      const paginationKey = `${currentPath}_news_rowsPerPage`;
      const savedRows = localStorage.getItem(paginationKey);

      if (savedRows && rowsPerPageOptions.includes(Number(savedRows))) {
        rowsPerPage = Number(savedRows);
      } else {
        rowsPerPage = 5; // Default if invalid or not found
      }
    } catch (e) {
      console.warn("Failed to load rows per page preference:", e);
      rowsPerPage = 5; // Default on error
    }
  }

  function scrollToTop() {
    const newsSection = document.querySelector(".news-section-container");
    if (newsSection) {
      newsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // Pre-calculate video status once when data changes
  $: hasVideos = rawData.some((item) => checkIfYoutubeVideo(item.url) !== null);

  // filteredNewsList now just points to newsList which contains paginated data
  $: filteredNewsList = newsList;

  $: {
    if ($stockTicker || $etfTicker || $indexTicker) {
      rawData = data?.getNews || [];
      if (rawData?.length > 0) {
        rawData?.sort(
          (a, b) => new Date(b?.publishedDate) - new Date(a?.publishedDate),
        );
      }

      rawDataPressRelease = [];
      rawNewsVideos = [];
      displaySection = "all";
      currentPage = 1; // Reset to first page when ticker changes
      loadRowsPerPage(); // Load pagination preference
      updatePaginatedData(); // Initialize paginated data
    }
  }

  // Reactive statement to load pagination settings when page changes
  $: if ($page?.url?.pathname && $page?.url?.pathname !== pagePathName) {
    pagePathName = $page?.url?.pathname;
    loadRowsPerPage(); // Load pagination preference for new page
    updatePaginatedData(); // Update display with loaded preference
  }

  // Track whether each video should be shown
  let showVideo = {};
  function handlePlayClick(index: number) {
    showVideo = { ...showVideo, [index]: true };
  }
</script>

<div class="space-y-3 overflow-hidden text-gray-700 dark:text-zinc-200">
  <div class="w-auto lg:w-full p-1 flex flex-col m-auto news-section-container">
    <div class="flex flex-col items-center w-full mb-1">
      <div class="flex flex-row justify-start mr-auto items-center">
        <div class="flex flex-row items-center">
          <label
            class="mr-1 cursor-pointer flex flex-row items-center text-2xl font-bold"
          >
            <h2>{m.stock_detail_news()}</h2>
          </label>
        </div>
      </div>
    </div>

    <div class=" mt-1 sm:mt-0">
      <div
        class="hflex flex-row items-center justify-between overflow-x-auto border-b border-gray-300 dark:border-zinc-700 py-1.5"
      >
        <ul
          class="mb-0.5 flex flex-row overflow-x-auto whitespace-nowrap text-sm"
        >
          <li>
            <button
              on:click={showAllNews}
              class="cursor-pointer rounded-full px-3 py-1 text-sm text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100/60 dark:hover:bg-zinc-900/60 {displaySection ===
              'all'
                ? 'bg-gray-100/70 text-gray-900 dark:text-white dark:bg-zinc-900/60 font-semibold'
                : ''}">{m.stock_detail_news_all()}</button
            >
          </li>
          {#if hasVideos}
            <li>
              <button
                on:click={() => getNewsVideos()}
                class="ml-1 cursor-pointer rounded-full px-3 py-1 text-sm text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100/60 dark:hover:bg-zinc-900/60 {displaySection ===
                'videos'
                  ? 'bg-gray-100/70 text-gray-900 dark:text-white dark:bg-zinc-900/60 font-semibold'
                  : ''}">{m.stock_detail_news_videos()}</button
              >
            </li>
          {/if}
          {#if !["etf", "index"].some( (sub) => $page.url.pathname?.includes(sub), )}
            <li>
              <button
                on:click={() => getPressRelease()}
                class="ml-1 cursor-pointer rounded-full px-3 py-1 text-sm text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100/60 dark:hover:bg-zinc-900/60 {displaySection ===
                'press-releases'
                  ? 'bg-gray-100/70 text-gray-900 dark:text-white dark:bg-zinc-900/60 font-semibold'
                  : ''}"
                ><span class="inline sm:hidden">{m.stock_detail_news_press()}</span><span
                  class="hidden sm:inline">{m.stock_detail_news_press_releases()}</span
                ></button
              >
            </li>
          {/if}
        </ul>
      </div>
    </div>

    {#if rawData?.length > 0}
      {#if filteredNewsList?.length > 0}
        <div class="grid grid-cols-1 gap-2 pb-5 pt-5">
          {#each filteredNewsList as item, index (item.url)}
            <div class="w-full flex flex-col rounded m-auto">
              {#if checkIfYoutubeVideo(item.url)}
                {#if showVideo[index]}
                  <!-- Show the YouTube iframe when the user clicks play -->
                  <div class="w-full aspect-video mb-4">
                    <iframe
                      class="w-full h-full rounded border border-gray-300 shadow dark:border-zinc-700"
                      src={`https://www.youtube.com/embed/${checkIfYoutubeVideo(item.url)}`}
                      frameborder="0"
                      allow="clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen
                    ></iframe>
                  </div>
                {:else}
                  <!-- Show the image placeholder with a play button -->
                  <div class="w-full aspect-video">
                    <div class="mb-3 sm:order-3 lg:pr-2">
                      <div
                        class="group relative block cursor-pointer bg-black bg-cover bg-[center_50%] object-contain after:block after:pb-[56.25%] after:content-[''] rounded-sm focus:outline-hidden focus:ring-2 focus:ring-blue-brand_light focus:ring-offset-2"
                        style="background-image: url({item?.image});"
                        tabindex="0"
                        on:click={() => handlePlayClick(index)}
                      >
                        <div
                          class="absolute left-[50%] top-[50%] z-10 h-[46px] w-[70px] -translate-x-1/2 -translate-y-1/2 rounded bg-[#212121] opacity-80 transition-all before:absolute before:left-[50%] before:top-[50%] before:-translate-x-1/2 before:-translate-y-1/2 before:border-y-[11px] before:border-l-[19px] before:border-r-0 before:border-transparent before:border-l-white before:content-[''] group-hover:bg-[#ff0000] group-hover:opacity-100"
                        ></div>
                      </div>
                    </div>
                  </div>
                {/if}
                <div class="mt-3 w-full">
                  <h3
                    class="text-sm text-gray-500 dark:text-zinc-400 truncate mb-2"
                  >
                    {formatDate(item?.publishedDate)} &#183; {item?.site}
                  </h3>
                  <a
                    href={item?.url}
                    rel="noopener noreferrer"
                    target="_blank"
                    class="text-lg sm:text-xl font-bold"
                  >
                    {item?.title}
                    <p class=" text-sm mt-2 font-normal">
                      {item?.text?.length > 200
                        ? item?.text?.slice(0, 200) + "..."
                        : item?.text}
                    </p>
                  </a>
                </div>
              {:else}
                <!-- Default news article display -->
                <div class="w-full flex flex-col sm:flex-row">
                  <a
                    href={item?.url}
                    rel="noopener noreferrer"
                    target="_blank"
                    class="w-full sm:max-w-56 h-fit max-h-96 sm:mr-3 border border-gray-800 rounded"
                  >
                    <div class="shrink-0 m-auto">
                      <img
                        src={item?.image}
                        class="h-auto w-full rounded"
                        alt="news image"
                        loading="lazy"
                      />
                    </div>
                  </a>
                  <div class="mt-3 sm:mt-0 w-full">
                    <h3
                      class="text-sm text-gray-500 dark:text-zinc-400 truncate mb-2"
                    >
                      {formatDate(item?.publishedDate)} &#183; {item?.site}
                    </h3>
                    <a
                      href={item?.url}
                      rel="noopener noreferrer"
                      target="_blank"
                      class="text-lg sm:text-xl font-bold"
                    >
                      {item?.title}
                      <p class=" text-sm mt-2 font-normal">
                        {item?.text?.length > 200
                          ? item?.text?.slice(0, 200) + "..."
                          : item?.text}
                      </p>
                    </a>
                  </div>
                </div>
              {/if}
            </div>
            <hr
              class="border-gray-300 dark:border-zinc-700 w-full m-auto mt-5 mb-5"
            />
          {/each}
        </div>
      {:else}
        <div class="mt-5 mt-4 px-3 xs:px-4 sm:px-0">
          <div class="border-l-4 border-white p-4 text-white">
            <div class="flex flex-row items-center">
              <svg
                class="h-6 w-6"
                viewBox="0 0 20 20"
                fill="currentColor"
                style="max-width:40px"
                aria-hidden="true"
                ><path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clip-rule="evenodd"
                ></path></svg
              >
              <div class="ml-3 w-full sm:ml-4">
                <div class="flex w-full flex-row justify-between">
                  <div>
                    {displaySection === "videos" ? m.stock_detail_news_no_videos() : m.stock_detail_news_no_articles()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Pagination controls -->
      {#if filteredNewsList?.length > 0 && totalPages > 1}
        <div class="flex flex-row items-center justify-between mt-8 sm:mt-5">
          <!-- Previous button -->
          <div class="flex items-center gap-2">
            <Button
              on:click={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
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
              <span class="hidden sm:inline">{m.stock_detail_previous()}</span>
            </Button>
          </div>

          <!-- Page info and rows selector in center -->
          <div class="flex flex-row items-center gap-4">
            <span class="text-sm text-gray-600 dark:text-zinc-300">
              {m.stock_detail_page_of({ current: currentPage, total: totalPages })}
            </span>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild let:builder>
                <Button
                  builders={[builder]}
                  class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span class="truncate text-[0.85rem] sm:text-sm"
                    >{m.stock_detail_rows({ count: rowsPerPage })}</span
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
                <!-- Dropdown items -->
                <DropdownMenu.Group class="pb-2">
                  {#each rowsPerPageOptions as item}
                    <DropdownMenu.Item
                      class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition"
                    >
                      <label
                        on:click={() => changeRowsPerPage(item)}
                        class="inline-flex justify-between w-full items-center cursor-pointer"
                      >
                        <span class="text-sm">{m.stock_detail_rows({ count: item })}</span>
                      </label>
                    </DropdownMenu.Item>
                  {/each}
                </DropdownMenu.Group>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>

          <!-- Next button -->
          <div class="flex items-center gap-2">
            <Button
              on:click={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span class="hidden sm:inline">{m.stock_detail_next()}</span>
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

        <!-- Back to Top button -->
        <div class="flex justify-center mt-4">
          <button
            on:click={scrollToTop}
            class="cursor-pointer text-sm font-medium text-gray-800 dark:text-zinc-300 transition hover:text-violet-600 dark:hover:text-violet-400"
          >
            {m.stock_detail_back_to_top()} <svg
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
      <span class="text-white"> {m.stock_detail_news_no_available()} </span>
    {/if}
  </div>
</div>

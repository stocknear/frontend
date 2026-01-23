<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import SEO from "$lib/components/SEO.svelte";
  import {
    market_news_back_to_top,
    market_news_general_seo_description,
    market_news_general_seo_title,
    market_news_image_alt,
    market_news_more_stock_news,
    market_news_pagination_next,
    market_news_pagination_page_of,
    market_news_pagination_previous,
    market_news_pro_subscription_title,
    market_news_rows_label,
    market_news_stock_news_label,
    market_news_time_ago,
    market_news_time_day,
    market_news_time_days,
    market_news_time_hour,
    market_news_time_hours,
    market_news_time_minute,
    market_news_time_minutes,
    market_news_upgrade_description,
    market_news_upgrade_label,
  } from "$lib/paraglide/messages.js";

  export let data;

  const DEFAULT_ROWS_PER_PAGE = 10;
  const rowsPerPageOptions = [10, 20, 30];

  let rawData = data?.getMarketNews ?? [];
  let stockNews = data?.getStockNews ?? [];
  let news: any[] = [];

  let currentPage = 1;
  let rowsPerPage = DEFAULT_ROWS_PER_PAGE;
  let totalPages = 1;

  let pagePathName = $page?.url?.pathname;

  let showVideo: Record<string, boolean> = {};

  const getVideoKey = (item: any, index: number) => item?.url ?? String(index);

  const formatDate = (dateString) => {
    // Create a date object for the input dateString
    const inputDate = new Date(dateString);

    // Create a date object for the current time in New York City
    const nycTime = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
    });
    const currentNYCDate = new Date(nycTime);

    // Calculate the difference in milliseconds
    const difference = inputDate.getTime() - currentNYCDate.getTime();

    // Convert the difference to minutes
    const minutes = Math.abs(Math.round(difference / (1000 * 60)));

    if (minutes < 60) {
      return minutes === 1
        ? market_news_time_minute({ count: minutes })
        : market_news_time_minutes({ count: minutes });
    } else if (minutes < 1440) {
      const hours = Math.round(minutes / 60);
      return hours === 1
        ? market_news_time_hour({ count: hours })
        : market_news_time_hours({ count: hours });
    } else {
      const days = Math.round(minutes / 1440);
      return days === 1
        ? market_news_time_day({ count: days })
        : market_news_time_days({ count: days });
    }
  };

  function checkIfYoutubeVideo(link) {
    try {
      const url = new URL(link);
      if (url.hostname === "www.youtube.com") {
        const searchParams = url.searchParams;
        searchParams?.delete("t");
        const videoIdMatch = url?.search?.match(/v=([^&]+)/);

        if (videoIdMatch) {
          return videoIdMatch[1];
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Track whether each video should be shown
  function handlePlayClick(key: string) {
    showVideo = { ...showVideo, [key]: true };
  }

  function updatePaginatedData() {
    const totalItems = rawData?.length ?? 0;
    totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    if (currentPage < 1) {
      currentPage = 1;
    }

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    news = rawData?.slice(startIndex, endIndex) ?? [];
    showVideo = {};
  }

  function scrollToTop() {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToPage(pageNumber: number) {
    if (
      pageNumber < 1 ||
      pageNumber > totalPages ||
      pageNumber === currentPage
    ) {
      return;
    }
    currentPage = pageNumber;
    updatePaginatedData();
  }

  function changeRowsPerPage(newRowsPerPage: number) {
    if (rowsPerPage === newRowsPerPage) {
      return;
    }
    rowsPerPage = newRowsPerPage;
    currentPage = 1;
    updatePaginatedData();
    saveRowsPerPage();
  }

  function saveRowsPerPage() {
    if (!browser) return;

    const currentPath = pagePathName || $page?.url?.pathname;
    if (!currentPath) return;

    try {
      const paginationKey = `${currentPath}_market_news_general_rowsPerPage`;
      localStorage.setItem(paginationKey, String(rowsPerPage));
    } catch (error) {
      console.warn("Failed to save rows per page preference:", error);
    }
  }

  function loadRowsPerPage() {
    if (!browser) {
      return rowsPerPage;
    }

    const currentPath = pagePathName || $page?.url?.pathname;
    if (!currentPath) {
      return rowsPerPage;
    }

    try {
      const paginationKey = `${currentPath}_market_news_general_rowsPerPage`;
      const savedRows = localStorage.getItem(paginationKey);
      const parsedRows = savedRows ? Number(savedRows) : NaN;

      if (rowsPerPageOptions.includes(parsedRows)) {
        return parsedRows;
      }
    } catch (error) {
      console.warn("Failed to load rows per page preference:", error);
    }

    return rowsPerPage;
  }

  function initializePagination() {
    const storedRows = loadRowsPerPage();
    if (rowsPerPageOptions.includes(storedRows) && storedRows !== rowsPerPage) {
      rowsPerPage = storedRows;
    }
    currentPage = 1;
    updatePaginatedData();
  }

  onMount(() => {
    initializePagination();
  });

  $: if ($page?.url?.pathname && $page?.url?.pathname !== pagePathName) {
    pagePathName = $page?.url?.pathname;
    initializePagination();
  }

  updatePaginatedData();
</script>

<SEO
  title={market_news_general_seo_title()}
  description={market_news_general_seo_description()}
/>

<div class="w-full overflow-hidden m-auto mt-5">
  <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
    <div
      class="relative flex flex-col lg:flex-row justify-center items-start overflow-hidden w-full"
    >
      <main class="w-full lg:w-3/4 lg:pr-10">
        <div class="w-full m-auto">
          <div class="grid grid-cols-1 gap-y-4 market-news-list">
            {#if news?.length !== 0}
              {#each news as item, index}
                <div
                  class="w-full flex flex-col border-b border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-5 pt-2"
                >
                  {#if checkIfYoutubeVideo(item.url)}
                    {#if showVideo[getVideoKey(item, index)]}
                      <!-- Show the YouTube iframe when the user clicks play -->
                      <div class="w-full aspect-video mb-4">
                        <iframe
                          class="w-full h-full rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40"
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
                            class="group relative block cursor-pointer bg-black bg-cover bg-[center_50%] object-contain after:block after:pb-[56.25%] after:content-[''] rounded-xl border border-gray-300 shadow dark:border-zinc-700 focus:outline-hidden focus:ring-2 focus:ring-violet-400/30"
                            style="background-image: url({item?.image});"
                            tabindex="0"
                            on:click={() =>
                              handlePlayClick(getVideoKey(item, index))}
                          >
                            <div
                              class="absolute left-[50%] top-[50%] z-10 h-[46px] w-[70px] -translate-x-1/2 -translate-y-1/2 rounded bg-black/70 opacity-80 transition-all before:absolute before:left-[50%] before:top-[50%] before:-translate-x-1/2 before:-translate-y-1/2 before:border-y-[11px] before:border-l-[19px] before:border-r-0 before:border-transparent before:border-l-white before:content-[''] group-hover:bg-black/80 group-hover:opacity-100"
                            ></div>
                          </div>
                        </div>
                      </div>
                    {/if}
                    <div class="mt-3 w-full">
                      <h3
                        class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-zinc-400 truncate mb-2"
                      >
                        {formatDate(item?.publishedDate)} &#183; {item?.site}
                      </h3>
                      <a
                        href={item?.url}
                        rel="noopener noreferrer"
                        target="_blank"
                        class="group"
                      >
                        <span
                          class="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white transition group-hover:text-violet-600 dark:group-hover:text-violet-400"
                        >
                          {item?.title}
                        </span>
                        <p
                          class="mt-2 text-sm text-gray-600 dark:text-zinc-300"
                        >
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
                        class="w-full sm:max-w-56 h-fit max-h-96 sm:mr-3 border border-gray-300 shadow dark:border-zinc-700 rounded-xl bg-white/70 dark:bg-zinc-950/40 overflow-hidden"
                      >
                        <div class="shrink-0 m-auto">
                          <img
                            src={item?.image}
                            class="h-auto w-full object-cover"
                            alt={market_news_image_alt()}
                            loading="lazy"
                          />
                        </div>
                      </a>
                      <div class="mt-3 sm:mt-0 w-full">
                        <h3
                          class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-zinc-400 truncate mb-2"
                        >
                          {formatDate(item?.publishedDate)} &#183; {item?.site}
                        </h3>
                        <a
                          href={item?.url}
                          rel="noopener noreferrer"
                          target="_blank"
                          class="group"
                        >
                          <span
                            class="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white transition group-hover:text-violet-600 dark:group-hover:text-violet-400"
                          >
                            {item?.title}
                          </span>
                          <p
                            class="mt-2 text-sm text-gray-600 dark:text-zinc-300"
                          >
                            {item?.text?.length > 200
                              ? item?.text?.slice(0, 200) + "..."
                              : item?.text}
                          </p>
                        </a>
                      </div>
                    </div>
                  {/if}
                </div>
              {/each}
            {/if}
          </div>
        </div>

        {#if rawData?.length > 0}
          <div
            class="flex gap-3 mt-6 flex-row items-center justify-between mb-10 sm:mb-0"
          >
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
                <span class="hidden sm:inline">
                  {market_news_pagination_previous()}
                </span>
              </Button>
            </div>

            <div class="flex flex-row items-center gap-4">
              <span class="text-sm text-gray-600 dark:text-zinc-300">
                {market_news_pagination_page_of({
                  currentPage,
                  totalPages,
                })}
              </span>

              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild let:builder>
                  <Button
                    builders={[builder]}
                    class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span class="truncate text-[0.85rem] sm:text-sm">
                      {rowsPerPage} {market_news_rows_label()}
                    </span>
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
                    {#each rowsPerPageOptions as item}
                      <DropdownMenu.Item
                        class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition"
                      >
                        <label
                          on:click={() => changeRowsPerPage(item)}
                          class="inline-flex justify-between w-full items-center cursor-pointer"
                        >
                          <span class="text-sm">
                            {item} {market_news_rows_label()}
                          </span>
                        </label>
                      </DropdownMenu.Item>
                    {/each}
                  </DropdownMenu.Group>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </div>

            <div class="flex items-center gap-2">
              <Button
                on:click={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span class="hidden sm:inline">
                  {market_news_pagination_next()}
                </span>
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
              class="cursor-pointer text-sm font-medium text-gray-800 dark:text-zinc-300 transition hover:text-violet-600 dark:hover:text-violet-400"
            >
              {market_news_back_to_top()} <svg
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
      </main>
      <aside class="inline-block relative w-full lg:w-1/4">
        {#if !["Pro", "Plus"]?.includes(data?.user?.tier)}
          <div
            class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 p-4 mt-4 sm:mt-0"
          >
            <a href="/pricing" class="group flex flex-col gap-2">
              <span
                class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400"
              >
                {market_news_upgrade_label()}
              </span>
              <h2
                class="text-lg font-semibold tracking-tight text-gray-900 dark:text-white transition group-hover:text-violet-600 dark:group-hover:text-violet-400"
              >
                {market_news_pro_subscription_title()}
              </h2>
              <p class="text-sm text-gray-600 dark:text-zinc-300">
                {market_news_upgrade_description()}
              </p>
            </a>
          </div>
        {/if}

        {#if stockNews?.length !== 0}
          <div
            class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 h-fit mt-4"
          >
            <div class="p-4 text-sm">
              <h3
                class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400 mb-3"
              >
                {market_news_stock_news_label()}
              </h3>
              <ul class="text-sm text-gray-600 dark:text-zinc-300">
                {#each stockNews?.slice(0, 10) as item}
                  <li class="mb-3 last:mb-1">
                    {market_news_time_ago({
                      time: formatDate(item?.publishedDate),
                    })} -
                    <a
                      class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                      href={item?.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow">{item?.title}</a
                    >
                    - {item?.site}
                  </li>
                {/each}
              </ul>
              <a
                href={`/market-news`}
                class="flex justify-center items-center rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 cursor-pointer w-full py-2.5 mt-5 text-sm text-center font-semibold transition hover:bg-gray-800 dark:hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/40"
              >
                {market_news_more_stock_news()}
              </a>
            </div>
          </div>
        {/if}
      </aside>
    </div>
  </div>
</div>

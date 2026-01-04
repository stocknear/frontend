<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import SEO from "$lib/components/SEO.svelte";

  export let data;

  const DEFAULT_ROWS_PER_PAGE = 10;
  const rowsPerPageOptions = [10, 20, 30];

  let rawData = data?.getPressNews ?? [];
  let stockNews = data?.getStockNews ?? [];
  let news: any[] = [];

  let currentPage = 1;
  let rowsPerPage = DEFAULT_ROWS_PER_PAGE;
  let totalPages = 1;

  let pagePathName = $page?.url?.pathname;

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
      return `${minutes} minutes`;
    } else if (minutes < 1440) {
      const hours = Math.round(minutes / 60);
      return `${hours} hour${hours !== 1 ? "s" : ""}`;
    } else {
      const days = Math.round(minutes / 1440);
      return `${days} day${days !== 1 ? "s" : ""}`;
    }
  };

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
  }

  function goToPage(pageNumber: number) {
    if (pageNumber < 1 || pageNumber > totalPages || pageNumber === currentPage) {
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
      const paginationKey = `${currentPath}_market_news_press_rowsPerPage`;
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
      const paginationKey = `${currentPath}_market_news_press_rowsPerPage`;
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
  title="Press
    Releases From Publicly Traded Companies"
  description="Press releases for publicly traded companies on the US stock market. Includes important company events, earnings releases and more."
/>

<div class="w-full overflow-hidden m-auto mt-5">
  <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
    <div
      class="relative flex flex-col lg:flex-row justify-center items-start overflow-hidden w-full"
    >
      <main class="w-full lg:w-3/4 lg:pr-10">
        <div class="w-full m-auto">
          <div class="grid grid-cols-1 gap-y-3 market-news-list">
            {#if news.length !== 0}
              {#each news as item}
                <div class="w-full flex flex-col m-auto">
                  <div class="w-full flex flex-col sm:flex-row">
                    <a
                      href={item?.url}
                      rel="noopener noreferrer"
                      target="_blank"
                      class="w-full sm:max-w-56 h-fit max-h-96 sm:mr-3"
                    >
                      <div class="shrink-0 m-auto">
                        <img
                          src={item?.image}
                          class="h-full w-full object-cover rounded"
                          alt="news image"
                          loading="lazy"
                        />
                      </div>
                    </a>

                    <div class="w-full">
                      <h3
                        class="text-sm text-muted dark:text-white/80 truncate mb-2"
                      >
                        {formatDate(item?.publishedDate)} ago · {item?.site}
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
                      <div class=" mt-2">
                        <span>Stocks:</span>

                        <a
                          href={"/stocks/" + item?.symbol}
                          class="px-2.5 text-sm py-0.5 rounded bg-white/10 sm:hover:bg-white/20 ml-1"
                        >
                          {item?.symbol}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <hr
                  class="border-gray-300 dark:border-gray-600 w-full m-auto mt-3 mb-5"
                />
              {/each}
            {/if}
          </div>
        </div>

        {#if rawData?.length > 0}
          <div class="flex flex-col gap-3 mt-6 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-2">
              <Button
                on:click={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                class="w-fit sm:w-auto transition-all duration-150 border border-gray-200/70 dark:border-zinc-800/80 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
                <span class="hidden sm:inline">Previous</span>
              </Button>
            </div>

            <div class="flex flex-row items-center gap-4">
              <span class="text-sm text-gray-600 dark:text-zinc-300">
                Page {currentPage} of {totalPages}
              </span>

              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild let:builder>
                  <Button
                    builders={[builder]}
                    class="w-fit sm:w-auto transition-all duration-150 border border-gray-200/70 dark:border-zinc-800/80 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span class="truncate text-[0.85rem] sm:text-sm">
                      {rowsPerPage} Rows
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
                  class="w-auto min-w-40 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-200/70 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
                >
                  <DropdownMenu.Group class="pb-2">
                    {#each rowsPerPageOptions as item}
                      <DropdownMenu.Item class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-600 dark:sm:hover:text-violet-400 transition">
                        <label
                          on:click={() => changeRowsPerPage(item)}
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
                on:click={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                class="w-fit sm:w-auto transition-all duration-150 border border-gray-200/70 dark:border-zinc-800/80 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
        {/if}
      </main>
      <aside class="inline-block relative w-full lg:w-1/4 mt-3">
        {#if !["Pro", "Plus"]?.includes(data?.user?.tier)}
          <div
            class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
          >
            <a
              href="/pricing"
              class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-xl font-semibold sm:ml-3">
                  Pro Subscription
                </h2>
              </div>
              <span class=" p-3 sm:ml-3 sm:mr-3 -mt-4">
                Upgrade now for unlimited access to all data, tools and no ads.
              </span>
            </a>
          </div>
        {/if}

        {#if stockNews?.length !== 0}
          <div
            class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit mt-4 cursor-pointer"
          >
            <div class="p-4 text-sm">
              <h3 class="text-xl font-bold mb-3">Stock News</h3>
              <ul class="">
                {#each stockNews?.slice(0, 10) as item}
                  <li class="mb-3 last:mb-1">
                    {formatDate(item?.publishedDate)} ago -
                    <a
                      class="sm:hover:text-muted dark:sm:hover:text-white text-blue-800 dark:text-blue-400"
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
                class="flex justify-center items-center rounded cursor-pointer w-full py-2 mt-5 text-[1rem] text-center font-semibold text-white dark:text-black m-auto sm:hover:bg-default dark:sm:hover:bg-gray-300 bg-black dark:bg-[#fff] transition duration-100"
              >
                More Stock News
              </a>
            </div>
          </div>
        {/if}
      </aside>
    </div>
  </div>
</div>
